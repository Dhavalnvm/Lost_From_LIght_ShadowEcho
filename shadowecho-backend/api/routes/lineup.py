"""
ShadowEcho — Lineup Route
/api/lineup — posts sharing behavioral/linguistic similarity.
Similarity score shown with explicit uncertainty. Never claims identity.
"""

import logging
from fastapi import APIRouter
from api.schemas import LineupRequest, LineupResponse
from db.crud import get_post
from core.embeddings import query_similar

log = logging.getLogger("api.lineup")
router = APIRouter(prefix="/api/lineup", tags=["lineup"])


@router.post("", response_model=LineupResponse)
async def find_similar(req: LineupRequest):
    """
    The Lineup — find posts with behavioral and linguistic similarity.
    Shows similarity scores with explicit uncertainty.
    Never claims identity — lets the analyst decide.
    """
    text = ""
    query_post = None

    if req.post_id:
        post_data = get_post(req.post_id)
        if post_data:
            text = f"{post_data.get('title', '')} {post_data.get('body', '')}".strip()
            query_post = post_data

    if req.text:
        text = req.text

    if not text:
        return LineupResponse(
            query_post=None,
            similar_posts=[],
            cluster_count=0,
        )

    # Vector similarity search
    results = query_similar(text, top_k=req.top_k)

    similar_posts = []
    source_clusters = {}

    for result in results:
        similarity = round(1 - result["distance"], 3)
        source = result["metadata"].get("source", "unknown")
        author = result["metadata"].get("author", "anonymous")

        # Track source clusters
        if source not in source_clusters:
            source_clusters[source] = 0
        source_clusters[source] += 1

        similar_posts.append({
            "text": result["document"][:500],
            "source": source,
            "author": author,
            "similarity": similarity,
            "timestamp": result["metadata"].get("timestamp", ""),
            "has_credentials": result["metadata"].get("has_credentials", False),
            "has_ioc": result["metadata"].get("has_ioc", False),
            # Explicit uncertainty
            "confidence_note": _similarity_note(similarity),
        })

    return LineupResponse(
        query_post=query_post,
        similar_posts=similar_posts,
        cluster_count=len(source_clusters),
    )


def _similarity_note(score: float) -> str:
    """Generate explicit uncertainty note for similarity scores."""
    if score >= 0.9:
        return "Very high similarity — likely same author or copied content. Verify independently."
    elif score >= 0.75:
        return "High similarity — possibly same actor or campaign. Analyst judgment required."
    elif score >= 0.6:
        return "Moderate similarity — shared topic or style, but may be coincidental."
    else:
        return "Low similarity — weak connection. Included for completeness."
