"""
ShadowEcho — Embeddings (bge-m3 via Ollama + ChromaDB)
Handles embedding text and querying the vector store.

KEY CHANGE: Uses Ollama's /api/embed endpoint instead of FlagEmbedding.
  - No torch dependency
  - No FlagEmbedding dependency
  - Same model (bge-m3), same 1024-dim vectors
  - Just HTTP calls to Ollama — consistent with llama3 setup
"""

import logging
import httpx
from config import (
    OLLAMA_BASE_URL, EMBEDDING_MODEL, EMBEDDING_BATCH_SIZE,
    CHROMA_DIR, CHROMA_COLLECTION, RAG_TOP_K,
)

import chromadb
from chromadb.config import Settings

log = logging.getLogger("embeddings")

# ---------------------------------------------------------------------------
# SINGLETON — ChromaDB only (no model to load — Ollama handles it)
# ---------------------------------------------------------------------------

_chroma_client = None
_collection = None


def get_collection() -> chromadb.Collection:
    """Get or create ChromaDB collection (singleton)."""
    global _chroma_client, _collection
    if _collection is None:
        CHROMA_DIR.mkdir(parents=True, exist_ok=True)
        _chroma_client = chromadb.PersistentClient(
            path=str(CHROMA_DIR),
            settings=Settings(anonymized_telemetry=False),
        )
        _collection = _chroma_client.get_or_create_collection(
            name=CHROMA_COLLECTION,
            metadata={"description": "ShadowEcho dark web posts"},
        )
        log.info(f"ChromaDB collection '{CHROMA_COLLECTION}' — {_collection.count()} docs")
    return _collection


# ---------------------------------------------------------------------------
# EMBED — via Ollama /api/embed
# ---------------------------------------------------------------------------


def embed_text(text: str) -> list[float]:
    """Embed a single text string via Ollama, returns dense vector."""
    with httpx.Client(timeout=30) as client:
        response = client.post(
            f"{OLLAMA_BASE_URL}/api/embed",
            json={
                "model": EMBEDDING_MODEL,
                "input": text,
            },
        )
        response.raise_for_status()

    data = response.json()
    # Ollama /api/embed returns {"embeddings": [[...], ...]}
    embeddings = data.get("embeddings", [])
    if not embeddings:
        log.error(f"Empty embedding response for text: {text[:80]}")
        return []

    return embeddings[0]


def embed_batch(texts: list[str]) -> list[list[float]]:
    """
    Embed a batch of texts via Ollama.
    Ollama /api/embed supports array input natively.
    For large batches, we chunk to avoid timeouts.
    """
    all_embeddings = []

    for i in range(0, len(texts), EMBEDDING_BATCH_SIZE):
        batch = texts[i:i + EMBEDDING_BATCH_SIZE]

        with httpx.Client(timeout=120) as client:
            response = client.post(
                f"{OLLAMA_BASE_URL}/api/embed",
                json={
                    "model": EMBEDDING_MODEL,
                    "input": batch,
                },
            )
            response.raise_for_status()

        data = response.json()
        embeddings = data.get("embeddings", [])

        if len(embeddings) != len(batch):
            log.warning(
                f"Batch mismatch: sent {len(batch)} texts, got {len(embeddings)} embeddings"
            )
            # Pad with empty if needed
            while len(embeddings) < len(batch):
                embeddings.append([0.0] * 1024)

        all_embeddings.extend(embeddings)

    return all_embeddings


# ---------------------------------------------------------------------------
# QUERY
# ---------------------------------------------------------------------------


def query_similar(text: str, top_k: int = RAG_TOP_K, where: dict = None) -> list[dict]:
    """
    Find similar documents in ChromaDB.
    Returns list of {document, metadata, distance}.
    """
    collection = get_collection()

    if collection.count() == 0:
        log.warning("ChromaDB is empty — no documents to query")
        return []

    embedding = embed_text(text)
    if not embedding:
        return []

    query_params = {
        "query_embeddings": [embedding],
        "n_results": min(top_k, collection.count()),
    }

    if where:
        query_params["where"] = where

    results = collection.query(**query_params)

    similar = []
    if results["documents"] and results["documents"][0]:
        for doc, meta, dist in zip(
            results["documents"][0],
            results["metadatas"][0],
            results["distances"][0],
        ):
            similar.append({
                "document": doc,
                "metadata": meta,
                "distance": round(dist, 4),
            })

    return similar


def add_to_store(post_id: str, text: str, metadata: dict):
    """Add a single post to ChromaDB (for live ingestion)."""
    collection = get_collection()
    embedding = embed_text(text)
    if not embedding:
        log.error(f"Could not embed post {post_id} — skipping")
        return

    # ChromaDB metadata must be str/int/float/bool
    clean_meta = {}
    for k, v in metadata.items():
        if isinstance(v, (str, int, float, bool)):
            clean_meta[k] = v

    collection.add(
        ids=[post_id],
        embeddings=[embedding],
        documents=[text],
        metadatas=[clean_meta],
    )
