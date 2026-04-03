"""
ShadowEcho — ChromaDB Vector Loader
Reads processed posts from data/processed/all_posts.json,
embeds them with bge-m3 via Ollama, and stores in ChromaDB.

INCREMENTAL: Skips posts already in ChromaDB by ID.
RESILIENT:   Small batches (8 texts), per-text truncation at 1500 chars,
             retry with backoff on timeout, progress saved after every batch
             so you can Ctrl+C and resume safely.

Run: python data/chroma_loader.py
     python data/chroma_loader.py --reset    # wipe and reload from scratch
     python data/chroma_loader.py --test     # run test queries after loading
     python data/chroma_loader.py --batch-size 4   # even smaller if still timing out
"""

import json
import sys
import re
import time
import logging
import argparse
import unicodedata
from pathlib import Path

import httpx
import chromadb
from chromadb.config import Settings

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("chroma_loader")

# ---------------------------------------------------------------------------
# PATHS & CONFIG
# ---------------------------------------------------------------------------

BACKEND_ROOT    = Path(__file__).resolve().parent.parent
PROCESSED_FILE  = BACKEND_ROOT / "data" / "processed" / "all_posts.json"
CHROMA_DIR      = BACKEND_ROOT / "vectorstore" / "chroma_db"
COLLECTION_NAME = "shadowecho_posts"

OLLAMA_BASE_URL = "http://localhost:11434"
EMBEDDING_MODEL = "bge-m3:567m"

# Tuning — lower these if Ollama keeps timing out
DEFAULT_BATCH_SIZE = 8          # texts per Ollama request (was 64 — too large)
MAX_TEXT_CHARS     = 1500       # truncate each text before embedding
EMBED_TIMEOUT      = 90         # seconds per batch request
SINGLE_TIMEOUT     = 45         # seconds per single-text fallback request
MAX_RETRIES        = 3          # retries before giving up on a batch
RETRY_BACKOFF      = 5          # seconds to wait between retries


# ---------------------------------------------------------------------------
# TEXT SANITIZATION (second-pass — same as process_raw)
# ---------------------------------------------------------------------------

def sanitize_text(value) -> str:
    if value is None:
        return ""
    if isinstance(value, float):
        return "" if (value != value or value in (float("inf"), float("-inf"))) else str(int(value))
    if isinstance(value, (int, bool)):
        return str(value)
    text = str(value)
    try:
        text = unicodedata.normalize("NFC", text)
    except Exception:
        pass
    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", " ", text)
    text = re.sub(r"[ \t]{3,}", "  ", text)
    text = re.sub(r"\n{4,}", "\n\n\n", text)
    return text.strip()


def prepare_text(raw: str) -> str:
    """Sanitize and truncate to MAX_TEXT_CHARS so Ollama never gets overloaded."""
    clean = sanitize_text(raw)
    if len(clean) > MAX_TEXT_CHARS:
        clean = clean[:MAX_TEXT_CHARS]
    return clean


def is_embeddable(text: str) -> bool:
    return isinstance(text, str) and len(text.strip()) >= 10


# ---------------------------------------------------------------------------
# OLLAMA EMBEDDER — resilient with retry + single-text fallback
# ---------------------------------------------------------------------------

class OllamaEmbedder:

    def __init__(self, base_url: str = OLLAMA_BASE_URL, model: str = EMBEDDING_MODEL):
        self.base_url = base_url
        self.model    = model
        self._verify_model()

    def _verify_model(self):
        try:
            resp = httpx.get(f"{self.base_url}/api/tags", timeout=10)
            resp.raise_for_status()
            models      = resp.json().get("models", [])
            model_names = [m.get("name", "") for m in models]
            if not any(self.model in name for name in model_names):
                log.warning(f"⚠️  Model '{self.model}' not found. Run: ollama pull {self.model}")
            else:
                log.info(f"✅ Embedding model '{self.model}' available in Ollama")
        except Exception as e:
            log.error(f"Cannot connect to Ollama at {self.base_url}: {e}")
            log.error("Make sure Ollama is running: ollama serve")
            sys.exit(1)

    def _embed_batch_once(self, texts: list[str]) -> list[list[float]]:
        """Single attempt at embedding a batch. Raises on failure."""
        resp = httpx.post(
            f"{self.base_url}/api/embed",
            json={"model": self.model, "input": texts},
            timeout=EMBED_TIMEOUT,
        )
        resp.raise_for_status()
        embeddings = resp.json().get("embeddings", [])
        # Pad if Ollama returned fewer than expected
        while len(embeddings) < len(texts):
            embeddings.append([0.0] * 1024)
        return embeddings

    def _embed_single(self, text: str) -> list[float]:
        """Embed one text with a shorter timeout. Returns zero vector on failure."""
        try:
            resp = httpx.post(
                f"{self.base_url}/api/embed",
                json={"model": self.model, "input": [text]},
                timeout=SINGLE_TIMEOUT,
            )
            resp.raise_for_status()
            embeddings = resp.json().get("embeddings", [])
            if embeddings:
                return embeddings[0]
        except Exception as e:
            log.warning(f"  Single embed failed for '{text[:40]}…': {e}")
        return [0.0] * 1024

    def embed(self, texts: list[str]) -> list[list[float]]:
        """
        Embed a list of texts.
        - Sanitizes and truncates every text first
        - Retries the whole batch up to MAX_RETRIES times on timeout
        - Falls back to one-by-one embedding if batch keeps failing
        - Returns zero vectors only as a last resort
        """
        # Prepare texts — sanitize + truncate
        prepared = [prepare_text(t) for t in texts]

        # Try the batch with retries
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                return self._embed_batch_once(prepared)
            except (httpx.TimeoutException, httpx.ReadTimeout):
                if attempt < MAX_RETRIES:
                    log.warning(
                        f"  Batch timeout (attempt {attempt}/{MAX_RETRIES}) "
                        f"— retrying in {RETRY_BACKOFF}s..."
                    )
                    time.sleep(RETRY_BACKOFF)
                else:
                    log.warning(
                        f"  Batch timed out after {MAX_RETRIES} attempts "
                        f"— falling back to single embeds"
                    )
            except Exception as e:
                log.warning(f"  Batch embed failed ({e}) — falling back to single embeds")
                break

        # Single-text fallback
        results = []
        for text in prepared:
            if is_embeddable(text):
                results.append(self._embed_single(text))
            else:
                results.append([0.0] * 1024)
        return results


# ---------------------------------------------------------------------------
# CHROMA CLIENT
# ---------------------------------------------------------------------------

def get_chroma_client() -> chromadb.ClientAPI:
    CHROMA_DIR.mkdir(parents=True, exist_ok=True)
    return chromadb.PersistentClient(
        path=str(CHROMA_DIR),
        settings=Settings(anonymized_telemetry=False),
    )


def get_or_create_collection(client: chromadb.ClientAPI) -> chromadb.Collection:
    return client.get_or_create_collection(
        name=COLLECTION_NAME,
        metadata={"description": "ShadowEcho dark web posts — bge-m3 via Ollama"},
    )


# ---------------------------------------------------------------------------
# LOADER
# ---------------------------------------------------------------------------

def load_posts(filepath: Path) -> list[dict]:
    if not filepath.exists():
        log.error(f"Processed file not found: {filepath}")
        log.error("Run `python data/process_raw.py` first.")
        sys.exit(1)

    with open(filepath, "r", encoding="utf-8") as f:
        posts = json.load(f)

    log.info(f"Loaded {len(posts)} posts from {filepath}")
    return posts


def build_metadata(p: dict) -> dict:
    """Build a ChromaDB-safe metadata dict (all values must be str/int/float/bool)."""
    meta = p.get("metadata", {})
    return {
        "source":          str(p.get("source", ""))[:200],
        "forum_type":      str(p.get("forum_type", ""))[:200],
        "author":          str(p.get("author", "anonymous"))[:200],
        "timestamp":       str(p.get("timestamp", "")),
        "url":             str(p.get("url", ""))[:500],
        "scraped_at":      str(p.get("scraped_at", "")),
        "title":           str(p.get("title", ""))[:200],
        "char_count":      int(meta.get("char_count", 0)),
        "has_credentials": bool(meta.get("has_credentials", False)),
        "has_ioc":         bool(meta.get("has_ioc", False)),
        # CSV-derived fields — store if present
        "threat_category": str(meta.get("threat_category", "")),
        "severity":        str(meta.get("severity", "")),
        "risk_score":      int(meta.get("risk_score", 0)),
    }


def batch_insert(
    collection: chromadb.Collection,
    embedder: OllamaEmbedder,
    posts: list[dict],
    batch_size: int = DEFAULT_BATCH_SIZE,
):
    # ── Get existing IDs (incremental) ────────────────────────────────────────
    existing_ids: set[str] = set()
    try:
        existing = collection.get()
        if existing and existing["ids"]:
            existing_ids = set(existing["ids"])
            log.info(f"ChromaDB already has {len(existing_ids)} documents")
    except Exception:
        pass

    # ── Filter to new posts only ──────────────────────────────────────────────
    new_posts = [p for p in posts if p["id"] not in existing_ids]
    log.info(
        f"New posts to embed: {len(new_posts)} "
        f"(skipping {len(posts) - len(new_posts)} already in ChromaDB)"
    )

    if not new_posts:
        log.info("✅ Nothing new to embed.")
        return

    # ── Pre-flight validation ─────────────────────────────────────────────────
    valid_posts: list[dict] = []
    skipped = 0
    for p in new_posts:
        text = prepare_text(p.get("text", ""))
        if not is_embeddable(text):
            skipped += 1
            continue
        p["text"] = text   # store the prepared (truncated) version
        valid_posts.append(p)

    if skipped:
        log.warning(f"  Dropped {skipped} posts with unembeddable text")
    log.info(f"  Valid posts to embed: {len(valid_posts)}")

    # ── Embed and insert in small batches ─────────────────────────────────────
    total_batches  = (len(valid_posts) + batch_size - 1) // batch_size
    total_inserted = 0

    for i in range(0, len(valid_posts), batch_size):
        batch     = valid_posts[i : i + batch_size]
        batch_num = (i // batch_size) + 1

        ids       = [p["id"]   for p in batch]
        texts     = [p["text"] for p in batch]
        metadatas = [build_metadata(p) for p in batch]

        log.info(f"Batch {batch_num}/{total_batches}: embedding {len(texts)} texts...")

        embeddings = embedder.embed(texts)

        try:
            collection.add(
                ids=ids,
                embeddings=embeddings,
                documents=texts,
                metadatas=metadatas,
            )
            total_inserted += len(ids)
            log.info(
                f"Batch {batch_num}/{total_batches}: ✅ inserted {len(ids)} "
                f"(total so far: {total_inserted})"
            )
        except Exception as e:
            log.error(f"Batch {batch_num}/{total_batches}: ChromaDB insert failed — {e}")
            log.error("  Skipping this batch and continuing...")

    log.info(f"✅ Loading complete. Collection now has {collection.count()} documents.")


# ---------------------------------------------------------------------------
# TEST QUERIES
# ---------------------------------------------------------------------------

def test_query(collection: chromadb.Collection, embedder: OllamaEmbedder):
    queries = [
        "leaked credentials database dump",
        "ransomware attack corporate network",
        "zero day exploit for sale",
    ]
    log.info("\n--- Test Queries ---")
    for query in queries:
        emb     = embedder.embed([query])
        results = collection.query(query_embeddings=emb, n_results=3)
        log.info(f"\nQuery: '{query}'")
        if results["documents"] and results["documents"][0]:
            for j, (doc, meta, dist) in enumerate(
                zip(results["documents"][0], results["metadatas"][0], results["distances"][0])
            ):
                log.info(f"  [{j+1}] dist={dist:.4f} | source={meta['source']} | {doc[:100]}...")
        else:
            log.info("  No results found.")


# ---------------------------------------------------------------------------
# ENTRY POINT
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Load posts into ChromaDB (Ollama embeddings)")
    parser.add_argument("--reset",      action="store_true", help="Wipe collection and reload from scratch")
    parser.add_argument("--test",       action="store_true", help="Run test queries after loading")
    parser.add_argument("--file",       type=str, default=str(PROCESSED_FILE), help="Path to processed JSON")
    parser.add_argument("--batch-size", type=int, default=DEFAULT_BATCH_SIZE,
                        help=f"Texts per Ollama request (default: {DEFAULT_BATCH_SIZE})")
    args = parser.parse_args()

    client = get_chroma_client()

    if args.reset:
        log.warning("⚠️  Resetting ChromaDB collection — deleting all existing vectors")
        try:
            client.delete_collection(COLLECTION_NAME)
        except Exception:
            pass

    collection = get_or_create_collection(client)
    log.info(f"ChromaDB collection '{COLLECTION_NAME}' — current count: {collection.count()}")

    embedder = OllamaEmbedder()
    posts    = load_posts(Path(args.file))

    batch_insert(collection, embedder, posts, batch_size=args.batch_size)

    if args.test:
        test_query(collection, embedder)

    log.info(f"\n🏁 Final collection size: {collection.count()} documents")
    log.info(f"ChromaDB stored at: {CHROMA_DIR}")


if __name__ == "__main__":
    main()