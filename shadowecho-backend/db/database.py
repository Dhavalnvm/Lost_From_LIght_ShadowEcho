"""
ShadowEcho — Database Setup
SQLite initialization and connection management.
"""

import sqlite3
import logging
from pathlib import Path
from config import DB_PATH

log = logging.getLogger("db")


def get_connection() -> sqlite3.Connection:
    """Get SQLite connection with row factory."""
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    """Create all tables if they don't exist."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.executescript("""
        CREATE TABLE IF NOT EXISTS posts (
            id TEXT PRIMARY KEY,
            source TEXT NOT NULL,
            forum_type TEXT,
            title TEXT,
            body TEXT NOT NULL,
            author TEXT DEFAULT 'anonymous',
            timestamp TEXT,
            url TEXT,
            scraped_at TEXT NOT NULL,
            processed_at TEXT,
            signal_score REAL,
            is_signal INTEGER DEFAULT 0,
            char_count INTEGER,
            has_credentials INTEGER DEFAULT 0,
            has_ioc INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            post_id TEXT NOT NULL,
            severity TEXT NOT NULL CHECK(severity IN ('low', 'medium', 'high', 'critical')),
            alert_type TEXT NOT NULL,
            title TEXT NOT NULL,
            summary TEXT NOT NULL,
            confidence REAL NOT NULL,
            uncertainty_note TEXT,
            detection_output TEXT,
            module_output TEXT,
            created_at TEXT NOT NULL,
            acknowledged INTEGER DEFAULT 0,
            acknowledged_at TEXT,
            FOREIGN KEY (post_id) REFERENCES posts(id)
        );

        CREATE TABLE IF NOT EXISTS feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            post_id TEXT,
            alert_id INTEGER,
            label TEXT NOT NULL CHECK(label IN ('real', 'noise', 'unsure')),
            analyst_notes TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (post_id) REFERENCES posts(id),
            FOREIGN KEY (alert_id) REFERENCES alerts(id)
        );

        CREATE TABLE IF NOT EXISTS actors (
            id TEXT PRIMARY KEY,
            fingerprint TEXT NOT NULL,
            aliases TEXT,
            sources TEXT,
            first_seen TEXT,
            last_seen TEXT,
            threat_level TEXT,
            post_count INTEGER DEFAULT 0,
            cluster_id TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_posts_source ON posts(source);
        CREATE INDEX IF NOT EXISTS idx_posts_signal ON posts(is_signal);
        CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
        CREATE INDEX IF NOT EXISTS idx_alerts_created ON alerts(created_at);
        CREATE INDEX IF NOT EXISTS idx_feedback_label ON feedback(label);
    """)

    conn.commit()
    conn.close()
    log.info(f"Database initialized at {DB_PATH}")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    init_db()
    print("✅ Database ready")
