"""
ShadowEcho — ChromaDB Vector Loader
Reads processed posts from data/processed/all_posts.json,
embeds them with bge-m3 via Ollama, and stores in ChromaDB.

KEY CHANGE: Uses Ollama /api/embed instead of FlagEmbedding.
  - No torch dependency
  - No FlagEmbedding dependency
  - Just needs: pip install chromadb httpx

Prerequisites:
    ollama pull bge-m3:567m
    pip install chromadb httpx

Run: python data/chroma_loader.py
     python data/chroma_loader.py --reset    # wipe and reload from scratch
"""

import json
import sys
import logging
import argparse
from pathlib import Path

import httpx
import chromadb
from chromadb.config import Settings

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("chroma_loader")

# ---------------------------------------------------------------------------
# PATHS
# ---------------------------------------------------------------------------

BASE_DIR = Path(__file__).parent.parent
PROCESSED_FILE = BASE_DIR / "data" / "processed" / "all_posts.json"
CHROMA_DIR = BASE_DIR / "vectorstore" / "chroma_db"
COLLECTION_NAME = "shadowecho_posts"

# Ollama config
OLLAMA_BASE_URL = "http://localhost:11434"
EMBEDDING_MODEL = "bge-m3:567m"


# ---------------------------------------------------------------------------
# OLLAMA EMBEDDING WRAPPER
# ---------------------------------------------------------------------------


class OllamaEmbedder:
    """Wraps Ollama /api/embed as a simple embedding interface."""

    def __init__(self, base_url: str = OLLAMA_BASE_URL, model: str = EMBEDDING_MODEL):
        self.base_url = base_url
        self.model = model
        self._verify_model()

    def _verify_model(self):
        """Check that the embedding model is available in Ollama."""
        try:
            resp = httpx.get(f"{self.base_url}/api/tags", timeout=10)
            resp.raise_for_status()
            models = resp.json().get("models", [])
            model_names = [m.get("name", "") for m in models]

            if not any(self.model in name for name in model_names):
                log.warning(
                    f"⚠️  Model '{self.model}' not found in Ollama. "
                    f"Available: {model_names}. Run: ollama pull {self.model}"
                )
            else:
                log.info(f"✅ Embedding model '{self.model}' available in Ollama")

        except Exception as e:
            log.error(f"Cannot connect to Ollama at {self.base_url}: {e}")
            log.error("Make sure Ollama is running: ollama serve")
            sys.exit(1)

    def embed(self, texts: list[str], batch_size: int = 32) -> list[list[float]]:
        """Embed a batch of texts via Ollama /api/embed."""
        all_embeddings = []

        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]

            resp = httpx.post(
                f"{self.base_url}/api/embed",
                json={"model": self.model, "input": batch},
                timeout=120,
            )
            resp.raise_for_status()

            data = resp.json()
            embeddings = data.get("embeddings", [])

            if len(embeddings) != len(batch):
                log.warning(f"Batch mismatch: sent {len(batch)}, got {len(embeddings)}")
                while len(embeddings) < len(batch):
                    embeddings.append([0.0] * 1024)

            all_embeddings.extend(embeddings)

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
    # Check existing to skip duplicates
    existing_ids = set()
    try:
        existing = collection.get()
        if existing and existing["ids"]:
            existing_ids = set(existing["ids"])
            log.info(f"Collection already has {len(existing_ids)} documents")
    except Exception:
        pass

    new_posts = [p for p in posts if p["id"] not in existing_ids]
    log.info(f"New posts to load: {len(new_posts)} (skipping {len(posts) - len(new_posts)} duplicates)")

    if not new_posts:
        log.info("Nothing new to load.")
        return

    total_batches = (len(new_posts) + batch_size - 1) // batch_size

    for i in range(0, len(new_posts), batch_size):
        batch = new_posts[i:i + batch_size]
        batch_num = (i // batch_size) + 1

        ids = [p["id"] for p in batch]
        texts = [p["text"] for p in batch]

        metadatas = []
        for p in batch:
            metadatas.append({
                "source": p["source"],
                "forum_type": p["forum_type"],
                "author": p["author"],
                "timestamp": p.get("timestamp", ""),
                "url": p.get("url", ""),
                "scraped_at": p.get("scraped_at", ""),
                "char_count": p["metadata"]["char_count"],
                "has_credentials": p["metadata"]["has_credentials"],
                "has_ioc": p["metadata"]["has_ioc"],
                "title": p.get("title", "")[:200],
            })

        log.info(f"Batch {batch_num}/{total_batches}: embedding {len(texts)} texts via Ollama...")
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
# QUERY TEST
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
        results = collection.query(query_embeddings=embedding, n_results=3)

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
    parser.add_argument("--reset", action="store_true", help="Wipe collection and reload")
    parser.add_argument("--test", action="store_true", help="Run test queries after loading")
    parser.add_argument("--file", type=str, default=str(PROCESSED_FILE), help="Path to processed JSON")
    args = parser.parse_args()

    client = get_chroma_client()

    if args.reset:
        log.warning("⚠️  Resetting collection — deleting all existing vectors")
        try:
            client.delete_collection(COLLECTION_NAME)
        except Exception:
            pass

    collection = get_or_create_collection(client)
    log.info(f"ChromaDB collection '{COLLECTION_NAME}' — current count: {collection.count()}")

    embedder = OllamaEmbedder()

    posts = load_posts(Path(args.file))
    batch_insert(collection, embedder, posts)

    if args.test:
        test_query(collection, embedder)

    log.info(f"\n🏁 Final collection size: {collection.count()} documents")
    log.info(f"ChromaDB stored at: {CHROMA_DIR}")


if __name__ == "__main__":
    main()
