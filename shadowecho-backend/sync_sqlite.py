import json
import sys
import argparse
import logging
from pathlib import Path
from datetime import datetime, timezone

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("sync_sqlite")

BASE_DIR = Path(__file__).parent

CANDIDATE_FILES = [
    BASE_DIR / "all_posts__1_.json",
    BASE_DIR / "all_posts.json",
    BASE_DIR.parent / "all_posts__1_.json",
    BASE_DIR.parent / "all_posts.json",
    BASE_DIR / "data" / "processed" / "all_posts.json",
    BASE_DIR.parent / "data" / "processed" / "all_posts.json",
]


def find_data_file() -> Path | None:
    for path in CANDIDATE_FILES:
        if path.exists():
            log.info(f"Trying: {path}")
            try:
                with open(path, encoding="utf-8", errors="replace") as f:
                    data = json.load(f)
                if isinstance(data, list) and len(data) > 0:
                    log.info(f"✅ Found data file: {path} ({len(data)} records)")
                    return path
                else:
                    log.info(f"  → empty or invalid, skipping")
            except Exception as e:
                log.warning(f"  → failed to read: {e}")
    return None


def sync_posts_to_sqlite(posts: list[dict]):
    try:
        from db.database import init_db, get_connection
    except ImportError:
        log.error("Cannot import db.database — make sure you're running from shadowecho-backend/")
        sys.exit(1)

    init_db()
    conn = get_connection()

    inserted = 0
    skipped = 0

    for post in posts:
        try:
            post_id = post.get("id", "")
            if not post_id:
                skipped += 1
                continue

            body = post.get("body") or post.get("text", "")
            title = post.get("title", "")
            source = post.get("source", "unknown")
            forum_type = post.get("forum_type", source)
            author = post.get("author", "anonymous")
            timestamp = post.get("timestamp", "")
            url = post.get("url", "")
            scraped_at = post.get("scraped_at", datetime.now(timezone.utc).isoformat())
            metadata = post.get("metadata", {})
            char_count = metadata.get("char_count", len(body))
            has_credentials = int(bool(metadata.get("has_credentials", False)))
            has_ioc = int(bool(metadata.get("has_ioc", False)))

            conn.execute(
                """INSERT OR IGNORE INTO posts
                   (id, source, forum_type, title, body, author, timestamp, url,
                    scraped_at, char_count, has_credentials, has_ioc)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (post_id, source, forum_type, title, body, author,
                 timestamp, url, scraped_at, char_count, has_credentials, has_ioc),
            )
            inserted += 1

        except Exception as e:
            log.warning(f"Failed to insert post {post.get('id', '?')}: {e}")
            skipped += 1

    conn.commit()
    total = conn.execute("SELECT COUNT(*) FROM posts").fetchone()[0]
    conn.close()

    log.info(f"✅ Inserted: {inserted} | Skipped: {skipped}")
    log.info(f"📊 Total posts in SQLite: {total}")
    return inserted, total


def verify():
    from db.database import get_connection
    conn = get_connection()

    total   = conn.execute("SELECT COUNT(*) FROM posts").fetchone()[0]
    signals = conn.execute("SELECT COUNT(*) FROM posts WHERE is_signal = 1").fetchone()[0]
    creds   = conn.execute("SELECT COUNT(*) FROM posts WHERE has_credentials = 1").fetchone()[0]
    iocs    = conn.execute("SELECT COUNT(*) FROM posts WHERE has_ioc = 1").fetchone()[0]
    alerts  = conn.execute("SELECT COUNT(*) FROM alerts").fetchone()[0]

    sources = conn.execute(
        "SELECT source, COUNT(*) as c FROM posts GROUP BY source ORDER BY c DESC"
    ).fetchall()

    conn.close()

    print("\n" + "="*52)
    print("  DASHBOARD WILL NOW SHOW:")
    print("="*52)
    print(f"  Total posts      : {total}")
    print(f"  Signal posts     : {signals}")
    print(f"  With credentials : {creds}")
    print(f"  With IOCs        : {iocs}")
    print(f"  Alerts           : {alerts}")
    print("\n  By source:")
    for row in sources:
        print(f"    {row[0]:<38} {row[1]}")
    print("="*52)
    print("\n  Refresh your frontend — numbers should be live!\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--file", type=str, default=None, help="Path to JSON data file")
    args = parser.parse_args()

    log.info("ShadowEcho — SQLite Sync")
    log.info("="*40)

    if args.file:
        data_file = Path(args.file)
        if not data_file.exists():
            log.error(f"File not found: {data_file}")
            sys.exit(1)
    else:
        data_file = find_data_file()

    if not data_file:
        log.error("No data file found. Tried:")
        for p in CANDIDATE_FILES:
            log.error(f"  {p}")
        log.error("\nTip: pass the path explicitly:")
        log.error('  python sync_sqlite.py --file "path\\to\\all_posts__1_.json"')
        sys.exit(1)

    with open(data_file, encoding="utf-8", errors="replace") as f:
        posts = json.load(f)

    log.info(f"Syncing {len(posts)} posts to SQLite...")
    sync_posts_to_sqlite(posts)
    verify()