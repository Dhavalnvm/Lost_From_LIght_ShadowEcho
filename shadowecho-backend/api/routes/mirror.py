"""
ShadowEcho — Mirror Route
/api/mirror — "What are criminals saying about your organization?"
Searches posts by org name across all sources.
"""

import logging
from fastapi import APIRouter
from api.schemas import MirrorRequest, MirrorResponse
from db.crud import search_posts_by_org
from core.embeddings import query_similar
from core.detector import detect_credentials, detect_iocs

log = logging.getLogger("api.mirror")
router = APIRouter(prefix="/api/mirror", tags=["mirror"])


@router.post("", response_model=MirrorResponse)
async def mirror_lookup(req: MirrorRequest):
    """
    The Mirror — shows exactly what criminals are saying about an org.
    Combines DB search (exact match) + vector search (semantic).
    """
    # DB search — exact org name mentions
    db_posts = search_posts_by_org(req.org_name, limit=req.limit)

    # Vector search — semantic similarity to org name + threat context
    search_query = f"{req.org_name} breach leak attack vulnerability"
    vector_results = query_similar(search_query, top_k=req.limit)

    # Merge and deduplicate
    seen_ids = set()
    merged = []

    for post in db_posts:
        if post["id"] not in seen_ids:
            seen_ids.add(post["id"])
            post["match_type"] = "exact"
            merged.append(post)

    for result in vector_results:
        doc_id = result["metadata"].get("id", "")
        if doc_id and doc_id not in seen_ids:
            seen_ids.add(doc_id)
            merged.append({
                "id": doc_id,
                "body": result["document"],
                "source": result["metadata"].get("source", "unknown"),
                "author": result["metadata"].get("author", "anonymous"),
                "timestamp": result["metadata"].get("timestamp", ""),
                "similarity": round(1 - result["distance"], 3),
                "match_type": "semantic",
                "has_credentials": result["metadata"].get("has_credentials", False),
                "has_ioc": result["metadata"].get("has_ioc", False),
            })

    # Enrich each post with quick detection scan
    for post in merged:
        body = post.get("body", "")
        creds = detect_credentials(body)
        iocs = detect_iocs(body)
        post["credentials_found"] = len(creds)
        post["iocs_found"] = len(iocs)

    return MirrorResponse(
        org_name=req.org_name,
        total_mentions=len(merged),
        posts=merged[:req.limit],
    )


@router.get("/quick/{org_name}")
async def mirror_quick(org_name: str):
    """Quick mirror check — just count and top 5 mentions."""
    db_posts = search_posts_by_org(org_name, limit=5)
    return {
        "org_name": org_name,
        "mention_count": len(db_posts),
        "top_posts": db_posts[:5],
    }
