"""
ShadowEcho — Tor Periodic Crawler
Runs periodic crawls of Tor forums and feeds new posts into the pipeline.
Uses the same scraper logic as data/scrapers/tor_scraper.py but runs
continuously as a background task.
"""

import asyncio
import logging
from datetime import datetime, timezone

from config import TOR_SOCKS_PROXY
from stream.telegram_listener import message_queue  # shared queue

log = logging.getLogger("stream.tor_crawler")

# Crawl interval in seconds
CRAWL_INTERVAL = 300  # 5 minutes

# Targets — same format as tor_scraper.py
# Your friend configures these
TOR_TARGETS = [
    # {
    #     "url": "http://example.onion",
    #     "type": "dread",
    #     "paths": ["/d/darknet"],
    #     "label": "dread",
    #     "max_pages": 2,
    # },
]


async def start_tor_crawler():
    """Periodic Tor crawl loop. Runs as async background task."""
    if not TOR_TARGETS:
        log.warning("No Tor targets configured — crawler disabled")
        return

    log.info(f"Starting Tor crawler — interval: {CRAWL_INTERVAL}s, targets: {len(TOR_TARGETS)}")

    # Track seen post IDs to avoid re-processing
    seen_ids: set = set()

    while True:
        try:
            posts = await asyncio.to_thread(_run_crawl)

            new_count = 0
            for post in posts:
                if post["id"] not in seen_ids:
                    seen_ids.add(post["id"])
                    await message_queue.put(post)
                    new_count += 1

            if new_count > 0:
                log.info(f"🧅 Tor crawl complete — {new_count} new posts queued")
            else:
                log.debug("Tor crawl complete — no new posts")

            # Cap seen_ids memory
            if len(seen_ids) > 50000:
                seen_ids = set(list(seen_ids)[-25000:])

        except Exception as e:
            log.error(f"Tor crawl failed: {e}")

        await asyncio.sleep(CRAWL_INTERVAL)


def _run_crawl() -> list[dict]:
    """Synchronous crawl — runs in thread via asyncio.to_thread."""
    import requests
    from bs4 import BeautifulSoup
    import hashlib
    import time
    import random

    session = requests.Session()
    session.proxies = {"http": TOR_SOCKS_PROXY, "https": TOR_SOCKS_PROXY}
    session.headers.update({
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; rv:109.0) Gecko/20100101 Firefox/115.0"
    })

    all_posts = []

    for target in TOR_TARGETS:
        base_url = target["url"]
        label = target["label"]

        for path in target["paths"]:
            for page in range(1, target.get("max_pages", 2) + 1):
                url = f"{base_url}{path}" if page == 1 else f"{base_url}{path}?page={page}"

                try:
                    time.sleep(random.uniform(3, 6))
                    resp = session.get(url, timeout=60)
                    if resp.status_code != 200:
                        break

                    soup = BeautifulSoup(resp.text, "html.parser")

                    # Generic text extraction
                    for el in soup.select("article, .post, .thread, .entry, .submission"):
                        text = el.get_text(strip=True)
                        if len(text) > 20:
                            post_id = hashlib.sha256(
                                f"{label}:{text[:200]}".encode()
                            ).hexdigest()[:16]

                            all_posts.append({
                                "id": post_id,
                                "source": label,
                                "forum_type": target["type"],
                                "title": "",
                                "body": text[:2000],
                                "text": text[:2000],
                                "author": "anonymous",
                                "timestamp": "",
                                "url": url,
                                "scraped_at": datetime.now(timezone.utc).isoformat(),
                                "metadata": {
                                    "char_count": len(text),
                                    "has_credentials": False,
                                    "has_ioc": False,
                                },
                            })
                except Exception as e:
                    log.debug(f"Crawl error on {url}: {e}")
                    break

    return all_posts
