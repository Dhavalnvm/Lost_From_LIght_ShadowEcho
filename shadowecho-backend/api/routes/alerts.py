"""
ShadowEcho — Alerts Route
/api/alerts — alert feed + severity filtering + acknowledgment.
"""

import logging
from fastapi import APIRouter, Query
from api.schemas import AlertAckRequest
from db.crud import get_alerts, acknowledge_alert

log = logging.getLogger("api.alerts")
router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.get("")
async def list_alerts(
    limit: int = Query(default=20, ge=1, le=100),
    severity: str = Query(default=None, pattern="^(low|medium|high|critical)$"),
):
    """Get alert feed, optionally filtered by severity."""
    alerts = get_alerts(limit=limit, severity=severity)
    return {
        "total": len(alerts),
        "alerts": alerts,
    }


@router.get("/unacknowledged")
async def unacked_alerts(limit: int = Query(default=20, ge=1, le=100)):
    """Get only unacknowledged alerts."""
    all_alerts = get_alerts(limit=limit)
    unacked = [a for a in all_alerts if not a.get("acknowledged")]
    return {
        "total": len(unacked),
        "alerts": unacked,
    }


@router.post("/acknowledge")
async def ack_alert(req: AlertAckRequest):
    """Acknowledge an alert."""
    acknowledge_alert(req.alert_id)
    return {"message": f"Alert {req.alert_id} acknowledged", "alert_id": req.alert_id}


@router.get("/summary")
async def alert_summary():
    """Quick summary of alert counts by severity."""
    alerts = get_alerts(limit=1000)
    summary = {"critical": 0, "high": 0, "medium": 0, "low": 0, "total": len(alerts)}
    for a in alerts:
        sev = a.get("severity", "low")
        if sev in summary:
            summary[sev] += 1
    return summary
