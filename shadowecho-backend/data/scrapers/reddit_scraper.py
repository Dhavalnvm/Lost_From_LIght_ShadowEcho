"""
ShadowEcho — Reddit Scraper (Pre-hackathon)
Scrapes posts from security-related subreddits via PRAW.

Usage: python data/scrapers/reddit_scraper.py
"""

import sys
import json
import hashlib
import logging
from pathlib import Path
from datetime import datetime, timezone

# Fix: add backend root to path so 'config' is importable from anywhere
BACKEND_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(BACKEND_ROOT))

from config import REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USER_AGENT, REDDIT_SUBREDDITS

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("reddit_scraper")

RAW_DIR = Path(__file__).parent.parent / "raw" / "reddit"
POSTS_PER_SUB = 200


def scrape_reddit():
    if not REDDIT_CLIENT_ID or not REDDIT_CLIENT_SECRET:
        log.error("Set REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET in .env")
        return

    try:
        import praw
    except ImportError:
        log.error("Install praw: pip install praw")
        return

    RAW_DIR.mkdir(parents=True, exist_ok=True)

    reddit = praw.Reddit(
        client_id=REDDIT_CLIENT_ID,
        client_secret=REDDIT_CLIENT_SECRET,
        user_agent=REDDIT_USER_AGENT,
    )

    total = 0

    for sub_name in REDDIT_SUBREDDITS:
        log.info(f"Scraping: r/{sub_name}")
        posts = []

        try:
            subreddit = reddit.subreddit(sub_name)

            for submission in subreddit.new(limit=POSTS_PER_SUB):
                text = f"{submission.title}\n{submission.selftext}".strip()
                if len(text) < 20:
                    continue

                posts.append({
                    "id": hashlib.sha256(f"reddit:{text[:200]}".encode()).hexdigest()[:16],
                    "source": "reddit",
                    "forum_type": "reddit",
                    "title": submission.title,
                    "body": submission.selftext,
                    "author": str(submission.author) if submission.author else "deleted",
                    "timestamp": datetime.fromtimestamp(submission.created_utc, tz=timezone.utc).isoformat(),
                    "url": f"https://reddit.com{submission.permalink}",
                    "subreddit": sub_name,
                    "score": submission.score,
                    "num_comments": submission.num_comments,
                    "scraped_at": datetime.now(timezone.utc).isoformat(),
                })

            if posts:
                ts = datetime.now().strftime("%Y%m%d_%H%M%S")
                filepath = RAW_DIR / f"{sub_name}_{ts}.json"
                with open(filepath, "w", encoding="utf-8") as f:
                    json.dump(posts, f, indent=2, ensure_ascii=False)
                log.info(f"  Saved {len(posts)} posts → {filepath}")
                total += len(posts)

        except Exception as e:
            log.error(f"  Failed on r/{sub_name}: {e}")

    log.info(f"✅ Done. Total posts scraped: {total}")


if __name__ == "__main__":
    scrape_reddit()