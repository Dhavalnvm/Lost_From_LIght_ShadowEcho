"""
ShadowEcho — Notebook Route
/api/notebook — generates a readable intelligence brief.
Stitches scattered posts into one coherent narrative.
"""

import logging
from fastapi import APIRouter
from api.schemas import NotebookRequest, NotebookResponse
from db.crud import get_post
from core.embeddings import query_similar
from core.rag import retrieve_context, build_llm_input
from core.detector import run_detection
from core.signal_filter import run_signal_filter
from core.llm import call_llm
from modules.narrative import parse_narrative

log = logging.getLogger("api.notebook")
router = APIRouter(prefix="/api/notebook", tags=["notebook"])


@router.post("", response_model=NotebookResponse)
async def generate_brief(req: NotebookRequest):
    """
    The Notebook — all scattered intelligence reconstructed into
    one readable brief. Sourced, transparent, no black boxes.
    """
    text = ""
    post_data = None

    # Get text from post_id or direct query
    if req.post_id:
        post_data = get_post(req.post_id)
        if post_data:
            text = f"{post_data.get('title', '')} {post_data.get('body', '')}".strip()
    
    if req.query:
        text = req.query

    if not text:
        return NotebookResponse(
            brief={"error": "No post_id or query provided"},
            sources_used=0,
            context_posts=[],
        )

    # Retrieve related posts
    rag_context = retrieve_context(text, top_k=req.top_k)

    # Run detection + signal for context
    detection = run_detection(text)
    signal = run_signal_filter(
        text=text,
        similar_posts=rag_context["similar_posts"],
        detection_score=detection.score,
    )

    # Build LLM input and call
    llm_input = build_llm_input(text, detection.to_dict(), signal.to_dict(), rag_context)
    raw_output = await call_llm(llm_input)

    narrative = parse_narrative(raw_output.get("narrative", {}))

    # Build the brief
    brief = {
        "narrative": narrative,
        "detection_summary": {
            "org_mentions": detection.org_mentions,
            "credentials_found": len(detection.credentials),
            "iocs_found": len(detection.iocs),
            "tags": detection.detection_tags,
        },
        "signal_assessment": {
            "score": signal.score,
            "is_signal": signal.is_signal,
            "key_flags": signal.flags[:5],
        },
        "related_actor": raw_output.get("fingerprint", {}),
        "escalation": raw_output.get("escalation", {}),
        "source_count": rag_context["source_count"],
        "sources": rag_context["unique_sources"],
    }

    # Context posts for transparency
    context_posts = []
    for post in rag_context["similar_posts"]:
        context_posts.append({
            "text": post["document"][:300],
            "source": post["metadata"].get("source", "unknown"),
            "similarity": round(1 - post["distance"], 3),
        })

    return NotebookResponse(
        brief=brief,
        sources_used=rag_context["source_count"],
        context_posts=context_posts,
    )
