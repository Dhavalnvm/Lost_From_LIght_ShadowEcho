"""
ShadowEcho — Dashboard Route
/api/dashboard — the judge-facing entry point.
Aggregated stats, recent alerts, recent signals.
"""

import time
import logging
from fastapi import APIRouter, Query
from api.schemas import AnalyzeRequest, AnalyzeResponse
from db.crud import get_dashboard_stats, get_alerts, get_signal_posts, insert_post, update_post_signal
from core.detector import run_detection
from core.signal_filter import run_signal_filter
from core.rag import retrieve_context, build_llm_input
from core.llm import call_llm
from core.alert_engine import evaluate_alert
from core.embeddings import add_to_store
from modules.mimicry import parse_mimicry
from modules.escalation import parse_escalation
from modules.fingerprint import parse_fingerprint
from modules.consensus import parse_consensus
from modules.narrative import parse_narrative

log = logging.getLogger("api.dashboard")
router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("")
async def get_dashboard():
    """Main dashboard view — stats + recent alerts + recent signals."""
    stats = get_dashboard_stats()
    recent_alerts = get_alerts(limit=10)
    recent_signals = get_signal_posts(limit=10)

    return {
        "stats": stats,
        "recent_alerts": recent_alerts,
        "recent_signals": recent_signals,
    }


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_post(req: AnalyzeRequest):
    """
    Full pipeline analysis — the main entry point.
    Runs: Detection → Signal Filter → RAG → LLM → Alert Engine
    """
    start = time.time()

    # Layer 1 — Detection
    detection = run_detection(req.text, req.org_watchlist)
    detection_dict = detection.to_dict()

    # Store post in DB
    import hashlib
    post_id = hashlib.sha256(f"{req.source}:{req.text[:200]}".encode()).hexdigest()[:16]
    insert_post({
        "id": post_id,
        "source": req.source,
        "body": req.text,
        "author": req.author,
        "scraped_at": "",
        "metadata": {
            "char_count": len(req.text),
            "has_credentials": len(detection.credentials) > 0,
            "has_ioc": len(detection.iocs) > 0,
        },
    })

    # Layer 2 — Signal Filter (needs RAG context for cross-source)
    rag_context = retrieve_context(req.text)
    signal = run_signal_filter(
        text=req.text,
        source=req.source,
        author=req.author,
        similar_posts=rag_context["similar_posts"],
        detection_score=detection.score,
    )
    signal_dict = signal.to_dict()

    # Update post signal status in DB
    update_post_signal(post_id, signal.score, signal.is_signal)

    # Layer 3 — RAG + LLM (only if signal passes)
    module_output = {}
    alert = None

    if signal.is_signal or detection.score > 0.3:
        # Build LLM input
        llm_input = build_llm_input(req.text, detection_dict, signal_dict, rag_context)

        # Single llama3 call
        raw_output = await call_llm(llm_input)

        # Parse all 5 modules
        module_output = {
            "mimicry": parse_mimicry(raw_output.get("mimicry", {})),
            "escalation": parse_escalation(raw_output.get("escalation", {})),
            "fingerprint": parse_fingerprint(raw_output.get("fingerprint", {})),
            "consensus": parse_consensus(raw_output.get("consensus", {})),
            "narrative": parse_narrative(raw_output.get("narrative", {})),
            "_meta": raw_output.get("_meta", {}),
        }

        # Layer 4 — Alert Engine
        alert = evaluate_alert(
            post_id=post_id,
            post_text=req.text,
            detection_output=detection_dict,
            signal_output=signal_dict,
            module_output=module_output,
        )

        # Add to vector store for future RAG
        add_to_store(post_id, req.text, {
            "source": req.source,
            "author": req.author,
            "is_signal": True,
        })

    elapsed = (time.time() - start) * 1000

    return AnalyzeResponse(
        post_id=post_id,
        detection=detection_dict,
        signal=signal_dict,
        modules=module_output,
        alert=alert,
        pipeline_time_ms=round(elapsed, 1),
    )
