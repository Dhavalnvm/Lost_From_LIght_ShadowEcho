"""
ShadowEcho — CRUD Operations
Read/write helpers for all database tables.
"""

import json
from datetime import datetime, timezone
from db.database import get_connection


# ---------------------------------------------------------------------------
# POSTS
# ---------------------------------------------------------------------------


def insert_post(post: dict) -> str:
    conn = get_connection()
    conn.execute(
        """INSERT OR IGNORE INTO posts
           (id, source, forum_type, title, body, author, timestamp, url,
            scraped_at, char_count, has_credentials, has_ioc)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            post["id"], post["source"], post.get("forum_type", ""),
            post.get("title", ""), post["body"], post.get("author", "anonymous"),
            post.get("timestamp", ""), post.get("url", ""),
            post.get("scraped_at", datetime.now(timezone.utc).isoformat()),
            post.get("metadata", {}).get("char_count", len(post.get("body", ""))),
            post.get("metadata", {}).get("has_credentials", False),
            post.get("metadata", {}).get("has_ioc", False),
        ),
    )
    conn.commit()
    conn.close()
    return post["id"]


def update_post_signal(post_id: str, signal_score: float, is_signal: bool):
    conn = get_connection()
    conn.execute(
        """UPDATE posts SET signal_score = ?, is_signal = ?, processed_at = ?
           WHERE id = ?""",
        (signal_score, int(is_signal), datetime.now(timezone.utc).isoformat(), post_id),
    )
    conn.commit()
    conn.close()


def get_post(post_id: str) -> dict | None:
    conn = get_connection()
    row = conn.execute("SELECT * FROM posts WHERE id = ?", (post_id,)).fetchone()
    conn.close()
    return dict(row) if row else None


def get_posts_by_source(source: str, limit: int = 50) -> list[dict]:
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM posts WHERE source = ? ORDER BY scraped_at DESC LIMIT ?",
        (source, limit),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_signal_posts(limit: int = 50) -> list[dict]:
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM posts WHERE is_signal = 1 ORDER BY signal_score DESC LIMIT ?",
        (limit,),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def search_posts_by_org(org_name: str, limit: int = 50) -> list[dict]:
    conn = get_connection()
    pattern = f"%{org_name.lower()}%"
    rows = conn.execute(
        """SELECT * FROM posts
           WHERE LOWER(title) LIKE ? OR LOWER(body) LIKE ?
           ORDER BY scraped_at DESC LIMIT ?""",
        (pattern, pattern, limit),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


# ---------------------------------------------------------------------------
# ALERTS
# ---------------------------------------------------------------------------


def insert_alert(alert: dict) -> int:
    conn = get_connection()
    cursor = conn.execute(
        """INSERT INTO alerts
           (post_id, severity, alert_type, title, summary, confidence,
            uncertainty_note, detection_output, module_output, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            alert["post_id"], alert["severity"], alert["alert_type"],
            alert["title"], alert["summary"], alert["confidence"],
            alert.get("uncertainty_note", ""),
            json.dumps(alert.get("detection_output", {})),
            json.dumps(alert.get("module_output", {})),
            datetime.now(timezone.utc).isoformat(),
        ),
    )
    alert_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return alert_id


def get_alerts(limit: int = 50, severity: str = None) -> list[dict]:
    conn = get_connection()
    if severity:
        rows = conn.execute(
            "SELECT * FROM alerts WHERE severity = ? ORDER BY created_at DESC LIMIT ?",
            (severity, limit),
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT * FROM alerts ORDER BY created_at DESC LIMIT ?", (limit,)
        ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def acknowledge_alert(alert_id: int):
    conn = get_connection()
    conn.execute(
        "UPDATE alerts SET acknowledged = 1, acknowledged_at = ? WHERE id = ?",
        (datetime.now(timezone.utc).isoformat(), alert_id),
    )
    conn.commit()
    conn.close()


# ---------------------------------------------------------------------------
# FEEDBACK
# ---------------------------------------------------------------------------


def insert_feedback(post_id: str, alert_id: int, label: str, notes: str = "") -> int:
    conn = get_connection()
    cursor = conn.execute(
        """INSERT INTO feedback (post_id, alert_id, label, analyst_notes, created_at)
           VALUES (?, ?, ?, ?, ?)""",
        (post_id, alert_id, label, notes, datetime.now(timezone.utc).isoformat()),
    )
    feedback_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return feedback_id


def get_feedback_stats() -> dict:
    conn = get_connection()
    rows = conn.execute(
        "SELECT label, COUNT(*) as count FROM feedback GROUP BY label"
    ).fetchall()
    conn.close()
    return {row["label"]: row["count"] for row in rows}


# ---------------------------------------------------------------------------
# ACTORS
# ---------------------------------------------------------------------------


def upsert_actor(actor: dict):
    conn = get_connection()
    conn.execute(
        """INSERT INTO actors (id, fingerprint, aliases, sources, first_seen,
           last_seen, threat_level, post_count, cluster_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             fingerprint = excluded.fingerprint,
             aliases = excluded.aliases,
             last_seen = excluded.last_seen,
             threat_level = excluded.threat_level,
             post_count = excluded.post_count""",
        (
            actor["id"], actor["fingerprint"],
            json.dumps(actor.get("aliases", [])),
            json.dumps(actor.get("sources", [])),
            actor.get("first_seen", ""), actor.get("last_seen", ""),
            actor.get("threat_level", "unknown"),
            actor.get("post_count", 0),
            actor.get("cluster_id", ""),
        ),
    )
    conn.commit()
    conn.close()


def get_actors(limit: int = 50) -> list[dict]:
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM actors ORDER BY last_seen DESC LIMIT ?", (limit,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


# ---------------------------------------------------------------------------
# DASHBOARD STATS
# ---------------------------------------------------------------------------


def get_dashboard_stats() -> dict:
    conn = get_connection()
    total_posts = conn.execute("SELECT COUNT(*) FROM posts").fetchone()[0]
    signal_posts = conn.execute("SELECT COUNT(*) FROM posts WHERE is_signal = 1").fetchone()[0]
    total_alerts = conn.execute("SELECT COUNT(*) FROM alerts").fetchone()[0]
    unacked_alerts = conn.execute("SELECT COUNT(*) FROM alerts WHERE acknowledged = 0").fetchone()[0]
    cred_posts = conn.execute("SELECT COUNT(*) FROM posts WHERE has_credentials = 1").fetchone()[0]
    ioc_posts = conn.execute("SELECT COUNT(*) FROM posts WHERE has_ioc = 1").fetchone()[0]

    severity_counts = {}
    for row in conn.execute("SELECT severity, COUNT(*) as c FROM alerts GROUP BY severity").fetchall():
        severity_counts[row["severity"]] = row["c"]

    source_counts = {}
    for row in conn.execute("SELECT source, COUNT(*) as c FROM posts GROUP BY source").fetchall():
        source_counts[row["source"]] = row["c"]

    feedback = get_feedback_stats()
    conn.close()

    return {
        "total_posts": total_posts,
        "signal_posts": signal_posts,
        "noise_filtered": total_posts - signal_posts,
        "total_alerts": total_alerts,
        "unacknowledged_alerts": unacked_alerts,
        "credential_posts": cred_posts,
        "ioc_posts": ioc_posts,
        "alerts_by_severity": severity_counts,
        "posts_by_source": source_counts,
        "feedback": feedback,
    }
