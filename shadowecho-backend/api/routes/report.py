"""
ShadowEcho — Report Generator Route
/api/report — generate a structured threat intelligence report from DB data.

Sections:
  - Executive Summary   (LLM-generated from stats + alerts)
  - Alert Breakdown     (counts, severity, recent critical)
  - Top Signals         (highest scored posts)
  - IOC Highlights      (posts with credentials / IOCs)
  - Source Intelligence (breakdown by source)
  - Recommendations     (LLM-generated, actionable)

Uses llama3.2:3b (chatbot model) — faster than 8b, sufficient for prose.
Export: /api/report/export returns plain text for download.
"""

import json
import logging
import time
from datetime import datetime, timezone
from fastapi import APIRouter, Query
from fastapi.responses import PlainTextResponse
import httpx

from config import OLLAMA_BASE_URL, CHATBOT_MODEL, CHATBOT_TIMEOUT
from db.crud import (
    get_dashboard_stats,
    get_alerts,
    get_signal_posts,
)
from db.database import get_connection

log = logging.getLogger("api.report")
router = APIRouter(prefix="/api/report", tags=["report"])


# ---------------------------------------------------------------------------
# HELPERS
# ---------------------------------------------------------------------------

def _get_ioc_posts(limit: int = 10) -> list[dict]:
    conn = get_connection()
    rows = conn.execute(
        """SELECT id, source, author, body, has_credentials, has_ioc, signal_score, scraped_at
           FROM posts
           WHERE has_credentials = 1 OR has_ioc = 1
           ORDER BY signal_score DESC LIMIT ?""",
        (limit,),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def _get_source_breakdown() -> list[dict]:
    conn = get_connection()
    rows = conn.execute(
        """SELECT source,
               COUNT(*) as total_posts,
               SUM(is_signal) as signal_posts,
               SUM(has_credentials) as cred_posts,
               SUM(has_ioc) as ioc_posts
           FROM posts GROUP BY source ORDER BY total_posts DESC""",
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def _get_recent_critical(limit: int = 5) -> list[dict]:
    conn = get_connection()
    rows = conn.execute(
        """SELECT id, title, summary, confidence, created_at, alert_type
           FROM alerts WHERE severity = 'critical'
           ORDER BY created_at DESC LIMIT ?""",
        (limit,),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


async def _llm_section(prompt: str) -> str:
    """Call llama3.2:3b to generate a report section."""
    payload = {
        "model": CHATBOT_MODEL,
        "prompt": prompt,
        "stream": False,
        "keep_alive": 0,
        "options": {
            "temperature": 0.4,
            "num_predict": 600,
            "num_gpu": 0,
            "num_ctx": 2048,
        },
    }
    try:
        async with httpx.AsyncClient(timeout=CHATBOT_TIMEOUT) as client:
            r = await client.post(f"{OLLAMA_BASE_URL}/api/generate", json=payload)
            r.raise_for_status()
            return r.json().get("response", "").strip()
    except Exception as e:
        log.error(f"LLM section failed: {e}")
        return f"[LLM unavailable: {e}]"


def _build_exec_prompt(stats: dict, alerts: list, critical: list) -> str:
    sev = stats.get("alerts_by_severity", {})
    sources = stats.get("posts_by_source", {})
    crit_titles = "; ".join(a.get("title","") for a in critical[:3])
    return f"""You are a senior threat intelligence analyst writing an executive summary for a security report.

Platform: ShadowEcho — Dark Web Signal Intelligence

Current statistics:
- Total posts ingested: {stats.get('total_posts', 0)}
- Signal posts (genuine threats): {stats.get('signal_posts', 0)}
- Total alerts fired: {stats.get('total_alerts', 0)}
- Unacknowledged alerts: {stats.get('unacknowledged_alerts', 0)}
- Critical alerts: {sev.get('critical', 0)}, High: {sev.get('high', 0)}, Medium: {sev.get('medium', 0)}
- Posts with credentials leaked: {stats.get('credential_posts', 0)}
- Posts with IOCs: {stats.get('ioc_posts', 0)}
- Active sources: {', '.join(list(sources.keys())[:5])}
- Most critical incidents: {crit_titles or 'None'}

Write a concise 3-4 paragraph executive summary suitable for a CISO. 
Tone: professional, direct, no fluff. Highlight the most critical findings and overall risk posture.
Do not use markdown headers. Write in plain paragraphs only."""


def _build_recommendations_prompt(stats: dict, alerts: list) -> str:
    sev = stats.get("alerts_by_severity", {})
    unacked = stats.get("unacknowledged_alerts", 0)
    cred = stats.get("credential_posts", 0)
    ioc = stats.get("ioc_posts", 0)
    return f"""You are a senior threat intelligence analyst writing actionable recommendations.

Current threat posture:
- Unacknowledged alerts: {unacked} (these need immediate attention)
- Posts with leaked credentials: {cred}
- Posts with IOCs (IPs, domains, hashes): {ioc}
- Critical alerts: {sev.get('critical', 0)}
- High alerts: {sev.get('high', 0)}

Write 5 specific, actionable recommendations for the security team.
Format as a numbered list (1. 2. 3. etc.). 
Be specific — reference the actual numbers above. 
Keep each recommendation to 1-2 sentences. No markdown headers."""


# ---------------------------------------------------------------------------
# ROUTES
# ---------------------------------------------------------------------------

@router.post("")
async def generate_report(
    org_focus: str = Query(default="", description="Optional org name to highlight"),
    include_llm: bool = Query(default=True, description="Whether to call LLM for prose sections"),
):
    """
    Generate a full threat intelligence report.
    Pulls all data from DB, optionally calls LLM for executive summary + recommendations.
    Returns structured JSON with all sections.
    """
    start = time.time()
    log.info(f"Report generation started (include_llm={include_llm}, org='{org_focus}')")

    # ── Gather data ──────────────────────────────────────────────────────────
    stats        = get_dashboard_stats()
    all_alerts   = get_alerts(limit=100)
    signal_posts = get_signal_posts(limit=20)
    ioc_posts    = _get_ioc_posts(limit=10)
    source_breakdown = _get_source_breakdown()
    critical_alerts  = _get_recent_critical(limit=5)

    # Severity distribution
    sev_counts = stats.get("alerts_by_severity", {})

    # Top signals (highest score)
    top_signals = [
        {
            "id": p.get("id", "")[:12],
            "source": p.get("source", ""),
            "author": p.get("author", "anonymous"),
            "snippet": (p.get("body") or "")[:200],
            "signal_score": round(p.get("signal_score") or 0, 3),
            "has_credentials": bool(p.get("has_credentials")),
            "has_ioc": bool(p.get("has_ioc")),
        }
        for p in signal_posts[:10]
    ]

    # IOC summary
    ioc_summary = [
        {
            "id": p.get("id", "")[:12],
            "source": p.get("source", ""),
            "snippet": (p.get("body") or "")[:150],
            "has_credentials": bool(p.get("has_credentials")),
            "has_ioc": bool(p.get("has_ioc")),
            "signal_score": round(p.get("signal_score") or 0, 3),
        }
        for p in ioc_posts
    ]

    # Recent alert list for the report
    alert_list = [
        {
            "id": a.get("id"),
            "severity": a.get("severity"),
            "title": a.get("title"),
            "summary": a.get("summary", "")[:200],
            "confidence": round(a.get("confidence") or 0, 3),
            "alert_type": a.get("alert_type"),
            "acknowledged": bool(a.get("acknowledged")),
            "created_at": a.get("created_at", "")[:16],
        }
        for a in all_alerts[:20]
    ]

    # ── LLM sections ─────────────────────────────────────────────────────────
    executive_summary  = ""
    recommendations    = ""

    if include_llm:
        log.info("Calling LLM for executive summary...")
        executive_summary = await _llm_section(
            _build_exec_prompt(stats, all_alerts, critical_alerts)
        )
        log.info("Calling LLM for recommendations...")
        recommendations = await _llm_section(
            _build_recommendations_prompt(stats, all_alerts)
        )

    duration_ms = round((time.time() - start) * 1000)
    generated_at = datetime.now(timezone.utc).isoformat()

    log.info(f"Report generated in {duration_ms}ms")

    return {
        "generated_at": generated_at,
        "org_focus": org_focus or None,
        "duration_ms": duration_ms,
        "include_llm": include_llm,

        # ── Overview ──────────────────────────────────────────────────────
        "overview": {
            "total_posts": stats.get("total_posts", 0),
            "signal_posts": stats.get("signal_posts", 0),
            "noise_filtered": stats.get("noise_filtered", 0),
            "signal_rate_pct": round(
                (stats.get("signal_posts", 0) / max(stats.get("total_posts", 1), 1)) * 100, 1
            ),
            "total_alerts": stats.get("total_alerts", 0),
            "unacknowledged_alerts": stats.get("unacknowledged_alerts", 0),
            "credential_posts": stats.get("credential_posts", 0),
            "ioc_posts": stats.get("ioc_posts", 0),
            "alerts_by_severity": sev_counts,
            "posts_by_source": stats.get("posts_by_source", {}),
            "feedback": stats.get("feedback", {}),
        },

        # ── LLM sections ──────────────────────────────────────────────────
        "executive_summary": executive_summary,
        "recommendations": recommendations,

        # ── Data sections ─────────────────────────────────────────────────
        "critical_alerts": [
            {
                "id": a.get("id"),
                "title": a.get("title"),
                "summary": a.get("summary", "")[:300],
                "confidence": round(a.get("confidence") or 0, 3),
                "alert_type": a.get("alert_type"),
                "created_at": a.get("created_at", "")[:16],
            }
            for a in critical_alerts
        ],
        "recent_alerts": alert_list,
        "top_signals": top_signals,
        "ioc_highlights": ioc_summary,
        "source_breakdown": source_breakdown,
    }


@router.get("/export")
async def export_report(
    org_focus: str = Query(default=""),
    include_llm: bool = Query(default=False),   # default False for fast export
):
    """
    Export a plain-text version of the report (for download / copy).
    include_llm=false by default so it's instant — set true for LLM prose.
    """
    data = await generate_report(org_focus=org_focus, include_llm=include_llm)

    ov = data["overview"]
    lines = [
        "=" * 72,
        "SHADOWECHO — THREAT INTELLIGENCE REPORT",
        f"Generated : {data['generated_at']}",
        f"Org Focus : {data['org_focus'] or 'All Organizations'}",
        "=" * 72,
        "",
    ]

    if data["executive_summary"]:
        lines += ["EXECUTIVE SUMMARY", "-" * 40, data["executive_summary"], ""]

    lines += [
        "OVERVIEW",
        "-" * 40,
        f"Total Posts Ingested   : {ov['total_posts']}",
        f"Signal Posts           : {ov['signal_posts']} ({ov['signal_rate_pct']}%)",
        f"Noise Filtered         : {ov['noise_filtered']}",
        f"Total Alerts           : {ov['total_alerts']}",
        f"Unacknowledged Alerts  : {ov['unacknowledged_alerts']}",
        f"Posts w/ Credentials   : {ov['credential_posts']}",
        f"Posts w/ IOCs          : {ov['ioc_posts']}",
        "",
        "ALERTS BY SEVERITY",
        "-" * 40,
    ]
    for sev in ["critical", "high", "medium", "low"]:
        lines.append(f"  {sev.upper():10s} : {ov['alerts_by_severity'].get(sev, 0)}")
    lines.append("")

    if data["critical_alerts"]:
        lines += ["CRITICAL ALERTS", "-" * 40]
        for a in data["critical_alerts"]:
            lines.append(f"[{a['created_at']}] {a['title']}")
            lines.append(f"  Confidence: {round(a['confidence']*100)}% | Type: {a['alert_type']}")
            lines.append(f"  {a['summary']}")
            lines.append("")

    if data["top_signals"]:
        lines += ["TOP SIGNALS (by score)", "-" * 40]
        for p in data["top_signals"]:
            lines.append(f"[{p['signal_score']}] {p['source']} / @{p['author']}")
            lines.append(f"  {p['snippet']}")
            lines.append("")

    if data["source_breakdown"]:
        lines += ["SOURCE BREAKDOWN", "-" * 40]
        for s in data["source_breakdown"]:
            lines.append(
                f"  {s['source']:20s} posts={s['total_posts']}  signals={s['signal_posts']}  "
                f"creds={s['cred_posts']}  iocs={s['ioc_posts']}"
            )
        lines.append("")

    if data["recommendations"]:
        lines += ["RECOMMENDATIONS", "-" * 40, data["recommendations"], ""]

    lines += ["=" * 72, "END OF REPORT — ShadowEcho v1.2.0", "=" * 72]

    text = "\n".join(lines)
    filename = f"shadowecho_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
    return PlainTextResponse(
        content=text,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )