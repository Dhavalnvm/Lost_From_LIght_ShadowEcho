"""
ShadowEcho — ChromaDB Vector Loader
Reads processed posts from data/processed/all_posts.json,
embeds them with bge-m3 via Ollama, and stores in ChromaDB.

INCREMENTAL: Skips posts already in ChromaDB by ID.
Defensive: Sanitizes and validates all text before sending to Ollama
           to prevent 500 errors from empty/NaN/control-char inputs.

Run: python data/chroma_loader.py
     python data/chroma_loader.py --reset    # wipe and reload from scratch
     python data/chroma_loader.py --test     # run test queries after loading
"""

import json
import sys
import re
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
# PATHS
# ---------------------------------------------------------------------------

BACKEND_ROOT   = Path(__file__).resolve().parent.parent
PROCESSED_FILE = BACKEND_ROOT / "data" / "processed" / "all_posts.json"
CHROMA_DIR     = BACKEND_ROOT / "vectorstore" / "chroma_db"
COLLECTION_NAME = "shadowecho_posts"

OLLAMA_BASE_URL = "http://localhost:11434"
EMBEDDING_MODEL = "bge-m3:567m"


# ---------------------------------------------------------------------------
# TEXT SANITIZATION — same logic as process_raw, defensive second pass
# ---------------------------------------------------------------------------

def sanitize_text(value) -> str:
    """Coerce any value to a clean UTF-8 string safe for bge-m3."""
    if value is None:
        return ""
    if isinstance(value, float):
        return "" if (value != value or value == float("inf") or value == float("-inf")) else str(int(value))
    if isinstance(value, (int, bool)):
        return str(value)
    if isinstance(value, (list, dict)):
        try:
            return json.dumps(value, ensure_ascii=False)
        except Exception:
            return ""

    text = str(value)
    try:
        text = unicodedata.normalize("NFC", text)
    except Exception:
        pass
    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", " ", text)
    text = re.sub(r"[ \t]{3,}", "  ", text)
    text = re.sub(r"\n{4,}", "\n\n\n", text)
    return text.strip()


def is_embeddable(text: str) -> bool:
    """Return True only if text is safe to send to Ollama."""
    if not isinstance(text, str):
        return False
    cleaned = sanitize_text(text)
    return len(cleaned) >= 10   # bge-m3 needs at least something meaningful


# ---------------------------------------------------------------------------
# OLLAMA EMBEDDER
# ---------------------------------------------------------------------------

class OllamaEmbedder:
    """Wraps Ollama /api/embed with validation and retry logic."""

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

    def _embed_single(self, text: str) -> list[float]:
        """Embed one text, fallback to zero vector on failure."""
        try:
            resp = httpx.post(
                f"{self.base_url}/api/embed",
                json={"model": self.model, "input": [text]},
                timeout=60,
            )
            resp.raise_for_status()
            embeddings = resp.json().get("embeddings", [])
            if embeddings:
                return embeddings[0]
        except Exception as e:
            log.warning(f"Single embed failed for text[:50]='{text[:50]}': {e}")
        return [0.0] * 1024

    def embed(self, texts: list[str], batch_size: int = 32) -> list[list[float]]:
        """
        Embed a batch of texts via Ollama /api/embed.
        - Sanitizes every text before sending
        - Falls back to single-embed if batch fails
        - Returns zero vectors for anything that still fails
        """
        all_embeddings: list[list[float]] = []

        for i in range(0, len(texts), batch_size):
            batch_raw = texts[i:i + batch_size]

            # Sanitize each text in the batch
            batch = [sanitize_text(t) for t in batch_raw]

            # Flag any that are too short after sanitization
            bad_indices = [j for j, t in enumerate(batch) if len(t) < 10]
            if bad_indices:
                log.warning(f"  ⚠️  {len(bad_indices)} texts too short after sanitize — will use zero vectors")

            try:
                resp = httpx.post(
                    f"{self.base_url}/api/embed",
                    json={"model": self.model, "input": batch},
                    timeout=120,
                )
                resp.raise_for_status()
                embeddings = resp.json().get("embeddings", [])

                if len(embeddings) != len(batch):
                    log.warning(f"Batch mismatch: sent {len(batch)}, got {len(embeddings)} — padding")
                    while len(embeddings) < len(batch):
                        embeddings.append([0.0] * 1024)

                all_embeddings.extend(embeddings)

            except Exception as e:
                log.warning(f"Batch embed failed ({e}) — falling back to single embeds for this batch")
                # Fall back: embed one by one so one bad post doesn't kill the whole batch
                for text in batch:
                    if len(text) >= 10:
                        all_embeddings.append(self._embed_single(text))
                    else:
                        all_embeddings.append([0.0] * 1024)

        return all_embeddings


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


def batch_insert(
    collection: chromadb.Collection,
    embedder: OllamaEmbedder,
    posts: list[dict],
    batch_size: int = 64,
):
    # Get existing IDs to skip duplicates
    existing_ids: set[str] = set()
    try:
        existing = collection.get()
        if existing and existing["ids"]:
            existing_ids = set(existing["ids"])
            log.info(f"ChromaDB already has {len(existing_ids)} documents")
    except Exception:
        pass

    # Filter to new posts only
    new_posts = [p for p in posts if p["id"] not in existing_ids]
    log.info(f"New posts to embed: {len(new_posts)} (skipping {len(posts) - len(new_posts)} already in ChromaDB)")

    if not new_posts:
        log.info("✅ Nothing new to embed.")
        return

    # Pre-flight validation — catch bad text before it hits Ollama
    valid_posts   = []
    invalid_count = 0
    for p in new_posts:
        raw_text = p.get("text", "")
        clean    = sanitize_text(raw_text)
        if len(clean) < 10:
            log.warning(f"  Skipping post {p['id']} — text too short after sanitize: '{clean[:40]}'")
            invalid_count += 1
            continue
        p["text"] = clean   # store sanitized version
        valid_posts.append(p)

    if invalid_count:
        log.warning(f"  Dropped {invalid_count} posts with unsembeddable text")

    log.info(f"  Valid posts to embed: {len(valid_posts)}")

    total_batches = (len(valid_posts) + batch_size - 1) // batch_size

    for i in range(0, len(valid_posts), batch_size):
        batch     = valid_posts[i:i + batch_size]
        batch_num = (i // batch_size) + 1

        ids    = [p["id"]   for p in batch]
        texts  = [p["text"] for p in batch]

        metadatas = []
        for p in batch:
            meta = p.get("metadata", {})
            metadatas.append({
                "source":           str(p.get("source", "")),
                "forum_type":       str(p.get("forum_type", "")),
                "author":           str(p.get("author", ""))[:200],
                "timestamp":        str(p.get("timestamp", "")),
                "url":              str(p.get("url", ""))[:500],
                "scraped_at":       str(p.get("scraped_at", "")),
                "char_count":       int(meta.get("char_count", 0)),
                "has_credentials":  bool(meta.get("has_credentials", False)),
                "has_ioc":          bool(meta.get("has_ioc", False)),
                "title":            str(p.get("title", ""))[:200],
            })

        log.info(f"Batch {batch_num}/{total_batches}: embedding {len(texts)} texts...")
        embeddings = embedder.embed(texts, batch_size=32)

        collection.add(
            ids=ids,
            embeddings=embeddings,
            documents=texts,
            metadatas=metadatas,
        )
        log.info(f"Batch {batch_num}/{total_batches}: ✅ inserted {len(ids)} documents")

    log.info(f"✅ Loading complete. Collection now has {collection.count()} documents.")


# ---------------------------------------------------------------------------
# TEST QUERIES
# ---------------------------------------------------------------------------

def test_query(collection: chromadb.Collection, embedder: OllamaEmbedder):
    test_queries = [
        "leaked credentials database dump",
        "ransomware attack corporate network",
        "zero day exploit for sale",
    ]
    log.info("\n--- Test Queries ---")
    for query in test_queries:
        embedding = embedder.embed([query])
        results   = collection.query(query_embeddings=embedding, n_results=3)
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
    parser.add_argument("--reset", action="store_true", help="Wipe collection and reload from scratch")
    parser.add_argument("--test",  action="store_true", help="Run test queries after loading")
    parser.add_argument("--file",  type=str, default=str(PROCESSED_FILE), help="Path to processed JSON")
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
    batch_insert(collection, embedder, posts)

    if args.test:
        test_query(collection, embedder)

    log.info(f"\n🏁 Final collection size: {collection.count()} documents")
    log.info(f"ChromaDB stored at: {CHROMA_DIR}")


if __name__ == "__main__":
    main()