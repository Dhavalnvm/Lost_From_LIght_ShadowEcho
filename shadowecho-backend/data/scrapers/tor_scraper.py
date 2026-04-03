"""
ShadowEcho — Tor Forum Scraper
Connects to .onion sites via Tor SOCKS5 proxy.
Scrapes Dread, BreachForums-style forums, and paste sites.

SETUP (whoever runs this):
1. Install Tor:
   - Ubuntu/Debian: sudo apt install tor
   - Mac: brew install tor
   - Windows: download Tor Expert Bundle from torproject.org

2. Start Tor service:
   - Linux/Mac: sudo systemctl start tor  (or just run `tor`)
   - Default SOCKS5 proxy: 127.0.0.1:9050

3. Install Python deps:
   pip install requests[socks] pysocks beautifulsoup4 stem

4. Add your target .onion URLs in the TARGETS list below.

5. Run: python tor_scraper.py
"""

import os
import sys
import json
import time
import random
import hashlib
import logging
from datetime import datetime, timezone
from pathlib import Path

import requests
from bs4 import BeautifulSoup

# ---------------------------------------------------------------------------
# CONFIG — your friend fills these in
# ---------------------------------------------------------------------------

TOR_SOCKS_PROXY = "socks5h://127.0.0.1:9050"  # default Tor proxy

# Add target forums here. Each entry needs:
#   url: the .onion URL (base URL, no trailing slash)
#   type: "dread" | "breachforums" | "paste"
#   paths: list of subpages/categories to crawl
#   label: human-readable name for metadata

TARGETS = [
    # EXAMPLE — replace with real .onion URLs
    # {
    #     "url": "http://example.onion",
    #     "type": "dread",
    #     "paths": ["/d/darknet", "/d/cybersecurity", "/d/malware"],
    #     "label": "dread",
    #     "max_pages": 5,
    # },
    # {
    #     "url": "http://example2.onion",
    #     "type": "breachforums",
    #     "paths": ["/Forum-Leaks", "/Forum-Malware"],
    #     "label": "breachforums",
    #     "max_pages": 5,
    # },
    # {
    #     "url": "http://example3.onion",
    #     "type": "paste",
    #     "paths": ["/recent"],
    #     "label": "pastesite",
    #     "max_pages": 3,
    # },
]

# Output directory for raw JSON dumps
RAW_DIR = Path(__file__).parent.parent / "raw" / "tor"

# Delays to avoid getting blocked
MIN_DELAY = 3  # seconds between requests
MAX_DELAY = 8

# ---------------------------------------------------------------------------
# LOGGING
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
log = logging.getLogger("tor_scraper")

# ---------------------------------------------------------------------------
# TOR SESSION
# ---------------------------------------------------------------------------


def create_tor_session() -> requests.Session:
    """Create a requests session routed through Tor SOCKS5 proxy."""
    session = requests.Session()
    session.proxies = {
        "http": TOR_SOCKS_PROXY,
        "https": TOR_SOCKS_PROXY,
    }
    session.headers.update(
        {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; rv:109.0) Gecko/20100101 Firefox/115.0",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
        }
    )
    return session


def verify_tor(session: requests.Session) -> bool:
    """Check that traffic is actually going through Tor."""
    try:
        resp = session.get("http://check.torproject.org", timeout=30)
        if "Congratulations" in resp.text:
            log.info("✅ Tor connection verified")
            return True
        else:
            log.warning("⚠️  Connected but Tor check failed — traffic may not be routed through Tor")
            return False
    except Exception as e:
        log.error(f"❌ Cannot reach Tor check service: {e}")
        return False


# ---------------------------------------------------------------------------
# PARSERS — one per forum type
# ---------------------------------------------------------------------------


def parse_dread(soup: BeautifulSoup, base_url: str) -> list[dict]:
    """
    Parse Dread (Reddit-like) forum pages.
    Dread uses a structure similar to old Reddit — posts in a list,
    each with title, author, body, upvotes, comments.
    Adjust selectors based on actual Dread HTML.
    """
    posts = []
    # Common Dread selectors — adjust if HTML structure differs
    for post_el in soup.select(".post, .thing, article, .submission"):
        try:
            title_el = post_el.select_one(
                ".title a, .post-title, h2 a, h3 a, .submission-title"
            )
            body_el = post_el.select_one(
                ".post-body, .usertext-body, .md, .submission-body, .content"
            )
            author_el = post_el.select_one(
                ".author, .post-author, .username, .submission-user"
            )
            time_el = post_el.select_one("time, .post-time, .timestamp, .date")

            title = title_el.get_text(strip=True) if title_el else ""
            body = body_el.get_text(strip=True) if body_el else ""
            author = author_el.get_text(strip=True) if author_el else "unknown"
            timestamp = time_el.get("datetime", "") if time_el else ""

            # Get link to full post if available
            link = ""
            if title_el and title_el.get("href"):
                href = title_el["href"]
                link = href if href.startswith("http") else f"{base_url}{href}"

            if title or body:  # skip empty
                posts.append(
                    {
                        "title": title,
                        "body": body,
                        "author": author,
                        "timestamp": timestamp,
                        "link": link,
                    }
                )
        except Exception as e:
            log.debug(f"Skipping post element: {e}")
            continue

    return posts


def parse_breachforums(soup: BeautifulSoup, base_url: str) -> list[dict]:
    """
    Parse BreachForums-style threaded forums.
    These typically use MyBB or similar — thread lists with titles,
    authors, reply counts.
    """
    posts = []
    # MyBB / BreachForums common selectors
    for thread_el in soup.select(
        ".thread, tr.inline_row, .threadbit, .forum-thread, .row"
    ):
        try:
            title_el = thread_el.select_one(
                ".thread-title a, .subject a, td:nth-child(2) a, .title a"
            )
            author_el = thread_el.select_one(
                ".author, .username, td:nth-child(3), .starter"
            )
            time_el = thread_el.select_one(
                ".lastpost, .date, td:last-child, .timestamp"
            )

            title = title_el.get_text(strip=True) if title_el else ""
            author = author_el.get_text(strip=True) if author_el else "unknown"
            timestamp = time_el.get_text(strip=True) if time_el else ""

            link = ""
            if title_el and title_el.get("href"):
                href = title_el["href"]
                link = href if href.startswith("http") else f"{base_url}{href}"

            if title:
                posts.append(
                    {
                        "title": title,
                        "body": "",  # need to visit thread page for body
                        "author": author,
                        "timestamp": timestamp,
                        "link": link,
                    }
                )
        except Exception as e:
            log.debug(f"Skipping thread element: {e}")
            continue

    return posts


def parse_paste(soup: BeautifulSoup, base_url: str) -> list[dict]:
    """
    Parse paste sites — simpler structure.
    Usually a list of recent pastes with titles/IDs and content.
    """
    posts = []
    for paste_el in soup.select(
        ".paste, .paste-item, tr, .listed-paste, article, .entry"
    ):
        try:
            title_el = paste_el.select_one("a, .paste-title, .title, td a")
            content_el = paste_el.select_one(
                ".paste-content, pre, code, .content, .text"
            )

            title = title_el.get_text(strip=True) if title_el else ""
            body = content_el.get_text(strip=True) if content_el else ""

            link = ""
            if title_el and title_el.get("href"):
                href = title_el["href"]
                link = href if href.startswith("http") else f"{base_url}{href}"

            if title or body:
                posts.append(
                    {
                        "title": title,
                        "body": body,
                        "author": "anonymous",
                        "timestamp": "",
                        "link": link,
                    }
                )
        except Exception as e:
            log.debug(f"Skipping paste element: {e}")
            continue

    return posts


PARSERS = {
    "dread": parse_dread,
    "breachforums": parse_breachforums,
    "paste": parse_paste,
}

# ---------------------------------------------------------------------------
# THREAD BODY FETCHER — for forums that need a second fetch
# ---------------------------------------------------------------------------


def fetch_thread_body(session: requests.Session, url: str) -> str:
    """Fetch full thread/post body from a detail page."""
    try:
        time.sleep(random.uniform(MIN_DELAY, MAX_DELAY))
        resp = session.get(url, timeout=60)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")

        # Try common content selectors
        for selector in [".post-body", ".post_body", ".message", ".content",
                         ".thread-content", ".postcontent", "article", ".md", "pre"]:
            el = soup.select_one(selector)
            if el and len(el.get_text(strip=True)) > 20:
                return el.get_text(strip=True)

        # Fallback — grab largest text block
        paragraphs = soup.find_all("p")
        if paragraphs:
            return " ".join(p.get_text(strip=True) for p in paragraphs)

        return ""
    except Exception as e:
        log.warning(f"Could not fetch thread body from {url}: {e}")
        return ""


# ---------------------------------------------------------------------------
# MAIN SCRAPER
# ---------------------------------------------------------------------------


def scrape_target(session: requests.Session, target: dict) -> list[dict]:
    """Scrape a single target forum across all its paths."""
    base_url = target["url"]
    forum_type = target["type"]
    label = target["label"]
    max_pages = target.get("max_pages", 5)
    parser = PARSERS.get(forum_type)

    if not parser:
        log.error(f"Unknown forum type: {forum_type}")
        return []

    all_posts = []

    for path in target["paths"]:
        log.info(f"Crawling {label} → {path}")

        for page in range(1, max_pages + 1):
            # Build URL — most forums use ?page=N or /page/N
            if page == 1:
                url = f"{base_url}{path}"
            else:
                url = f"{base_url}{path}?page={page}"

            try:
                time.sleep(random.uniform(MIN_DELAY, MAX_DELAY))
                resp = session.get(url, timeout=60)

                if resp.status_code == 403:
                    log.warning(f"403 on {url} — may need auth or got blocked")
                    break
                if resp.status_code == 404:
                    log.info(f"404 on page {page} — no more pages")
                    break

                resp.raise_for_status()
                soup = BeautifulSoup(resp.text, "html.parser")
                posts = parser(soup, base_url)

                if not posts:
                    log.info(f"No posts found on page {page} — stopping")
                    break

                # Enrich each post with metadata
                for post in posts:
                    post["source"] = label
                    post["forum_type"] = forum_type
                    post["scraped_at"] = datetime.now(timezone.utc).isoformat()
                    post["page_url"] = url
                    post["id"] = hashlib.sha256(
                        f"{label}:{post.get('title', '')}:{post.get('body', '')[:100]}".encode()
                    ).hexdigest()[:16]

                    # For breachforums-style, fetch thread body if we got a link
                    if forum_type == "breachforums" and post.get("link") and not post["body"]:
                        log.info(f"  Fetching thread body: {post['title'][:50]}")
                        post["body"] = fetch_thread_body(session, post["link"])

                all_posts.extend(posts)
                log.info(f"  Page {page}: {len(posts)} posts (total: {len(all_posts)})")

            except requests.exceptions.ConnectionError:
                log.error(f"Connection failed on {url} — Tor may be down or site unreachable")
                break
            except Exception as e:
                log.error(f"Error on {url}: {e}")
                break

    return all_posts


def save_raw(posts: list[dict], label: str):
    """Save scraped posts as raw JSON."""
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filepath = RAW_DIR / f"{label}_{timestamp}.json"

    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(posts, f, indent=2, ensure_ascii=False)

    log.info(f"💾 Saved {len(posts)} posts → {filepath}")
    return filepath


# ---------------------------------------------------------------------------
# ENTRY POINT
# ---------------------------------------------------------------------------


def main():
    if not TARGETS:
        log.error("No targets configured. Add .onion URLs to the TARGETS list in this file.")
        sys.exit(1)

    session = create_tor_session()

    log.info("Verifying Tor connection...")
    if not verify_tor(session):
        log.error("Tor verification failed. Make sure Tor is running on port 9050.")
        sys.exit(1)

    total_posts = 0

    for target in TARGETS:
        log.info(f"\n{'='*60}")
        log.info(f"TARGET: {target['label']} ({target['type']})")
        log.info(f"{'='*60}")

        posts = scrape_target(session, target)

        if posts:
            save_raw(posts, target["label"])
            total_posts += len(posts)
        else:
            log.warning(f"No posts scraped from {target['label']}")

    log.info(f"\n✅ Done. Total posts scraped: {total_posts}")
    log.info(f"Raw files saved to: {RAW_DIR}")
    log.info("Next step: run `python data/process_raw.py` then `python data/chroma_loader.py`")


if __name__ == "__main__":
    main()
