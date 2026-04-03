"""
ShadowEcho — Dashboard Route
/api/dashboard — the analyst-facing entry point.
Aggregated stats, recent alerts, recent signals.
Full pipeline analysis with slang decoding + leak impact estimation.
"""

import hashlib
import time
import logging
from fastapi import APIRouter
from api.schemas import AnalyzeRequest, AnalyzeResponse
from db.crud import (
    get_dashboard_stats, get_alerts, get_signal_posts,
    insert_post, update_post_signal,
)
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
from modules.leak_impact import estimate_leak_impact, parse_leak_impact

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
    Full pipeline analysis — the main API entry point.
    Runs: Detection (+ slang decode) → Signal Filter → RAG →
          LLM (5 modules) → Leak Impact → Alert Engine
    """
    start = time.time()

    # Layer 1 — Detection (includes slang decoding)
    detection = run_detection(req.text, req.org_watchlist)
    detection_dict = detection.to_dict()

    # Store post in DB (hashlib imported at module level, not inside handler)
    post_id = hashlib.sha256(
        f"{req.source}:{req.text[:200]}".encode()
    ).hexdigest()[:16]

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

    # Layer 2 — Signal Filter
    rag_context = retrieve_context(req.text)
    signal = run_signal_filter(
        text=req.text,
        source=req.source,
        author=req.author,
        similar_posts=rag_context["similar_posts"],
        detection_score=detection.score,
    )
    signal_dict = signal.to_dict()

    update_post_signal(post_id, signal.score, signal.is_signal)

    # Layer 3 — RAG + LLM (only if signal passes)
    module_output: dict = {}
    alert = None

    if signal.is_signal or detection.score > 0.3:
        llm_input = build_llm_input(req.text, detection_dict, signal_dict, rag_context)
        raw_output = await call_llm(llm_input)

        module_output = {
            "mimicry": parse_mimicry(raw_output.get("mimicry", {})),
            "escalation": parse_escalation(raw_output.get("escalation", {})),
            "fingerprint": parse_fingerprint(raw_output.get("fingerprint", {})),
            "consensus": parse_consensus(raw_output.get("consensus", {})),
            "narrative": parse_narrative(raw_output.get("narrative", {})),
            "_meta": raw_output.get("_meta", {}),
        }

        # Layer 3b — Leak Impact (local computation, no extra LLM call)
        leak_impact = estimate_leak_impact(
            text=req.text,
            detection_output=detection_dict,
        )
        module_output["leak_impact"] = leak_impact.to_dict()

        # Merge LLM leak impact assessment if the model provided one
        if raw_output.get("leak_impact"):
            module_output["leak_impact"]["llm_assessment"] = parse_leak_impact(
                raw_output["leak_impact"]
            )

        # Layer 4 — Alert Engine (slang + leak impact factored in scoring)
        alert = evaluate_alert(
            post_id=post_id,
            post_text=req.text,
            detection_output=detection_dict,
            signal_output=signal_dict,
            module_output=module_output,
        )

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