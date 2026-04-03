"""
ShadowEcho — Feedback Route
/api/feedback — analyst marks signals as real or noise.
This is the feedback flywheel that builds the moat.
"""

import logging
from fastapi import APIRouter
from api.schemas import FeedbackRequest, FeedbackResponse
from db.crud import insert_feedback, get_feedback_stats

log = logging.getLogger("api.feedback")
router = APIRouter(prefix="/api/feedback", tags=["feedback"])


@router.post("", response_model=FeedbackResponse)
async def submit_feedback(req: FeedbackRequest):
    """
    Analyst submits feedback on a post or alert.
    Labels: real | noise | unsure
    This label feeds back into signal filter weight recalibration.
    """
    feedback_id = insert_feedback(
        post_id=req.post_id or "",
        alert_id=req.alert_id or 0,
        label=req.label,
        notes=req.notes,
    )

    log.info(f"Feedback #{feedback_id}: {req.label} (post: {req.post_id}, alert: {req.alert_id})")

    return FeedbackResponse(
        feedback_id=feedback_id,
        message=f"Feedback recorded: {req.label}",
    )


@router.get("/stats")
async def feedback_stats():
    """Get feedback label distribution — shows flywheel health."""
    stats = get_feedback_stats()
    total = sum(stats.values())

    return {
        "stats": stats,
        "total_labels": total,
        "accuracy_signal": _compute_accuracy(stats),
    }


def _compute_accuracy(stats: dict) -> str:
    """Compute simple accuracy signal from feedback."""
    real = stats.get("real", 0)
    noise = stats.get("noise", 0)
    total = real + noise

    if total == 0:
        return "No feedback yet — flywheel not started"

    precision = real / total
    if precision >= 0.8:
        return f"Strong signal quality ({precision:.0%} real) — flywheel healthy"
    elif precision >= 0.5:
        return f"Moderate signal quality ({precision:.0%} real) — filter improving"
    else:
        return f"Low signal quality ({precision:.0%} real) — filter needs tuning"
