"""
ShadowEcho — RAG Pipeline (Layer 3)
Retrieves similar historical posts from ChromaDB,
builds full context, and prepares the prompt for llama3.
"""

import logging
from core.embeddings import query_similar
from config import RAG_TOP_K

log = logging.getLogger("rag")


def retrieve_context(text: str, top_k: int = RAG_TOP_K) -> dict:
    """
    Retrieve similar historical posts and build context for llama3.
    Returns:
        {
            "similar_posts": [...],
            "context_block": "formatted string for prompt",
            "source_count": int,
            "unique_sources": [...],
        }
    """
    similar = query_similar(text, top_k=top_k)

    if not similar:
        return {
            "similar_posts": [],
            "context_block": "No historical context available.",
            "source_count": 0,
            "unique_sources": [],
        }

    # Build formatted context block for the LLM prompt
    context_parts = []
    sources = set()

    for i, post in enumerate(similar, 1):
        source = post["metadata"].get("source", "unknown")
        author = post["metadata"].get("author", "anonymous")
        distance = post["distance"]
        doc = post["document"]

        # Truncate very long docs
        if len(doc) > 500:
            doc = doc[:500] + "..."

        sources.add(source)
        context_parts.append(
            f"[Historical Post {i}] (source: {source}, author: {author}, similarity: {1 - distance:.2f})\n{doc}"
        )

    context_block = "\n\n".join(context_parts)

    return {
        "similar_posts": similar,
        "context_block": context_block,
        "source_count": len(similar),
        "unique_sources": list(sources),
    }


def build_llm_input(
    new_post_text: str,
    detection_output: dict,
    signal_output: dict,
    rag_context: dict,
) -> dict:
    """
    Assemble all inputs into a structured payload for the LLM.
    This is what gets passed to llm.py for the single master call.
    """
    return {
        "new_post": new_post_text,
        "detection": {
            "org_mentions": detection_output.get("org_mentions", []),
            "credentials_found": len(detection_output.get("credentials", [])),
            "iocs_found": len(detection_output.get("iocs", [])),
            "leak_indicators": detection_output.get("leak_indicators", []),
            "tags": detection_output.get("detection_tags", []),
        },
        "signal_filter": {
            "score": signal_output.get("score", 0),
            "flags": signal_output.get("flags", []),
            "layer_scores": signal_output.get("layer_scores", {}),
        },
        "historical_context": rag_context["context_block"],
        "context_sources": rag_context["unique_sources"],
        "context_post_count": rag_context["source_count"],
    }
