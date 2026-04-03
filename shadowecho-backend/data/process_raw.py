"""
ShadowEcho — Raw Data Processor
Normalizes raw JSON dumps from all scrapers (Tor, Telegram, Reddit)
into a unified format ready for ChromaDB loading.

Input:  data/raw/**/*.json  (raw scraper output)
Output: data/processed/all_posts.json  (normalized, deduplicated)

Run: python data/process_raw.py
"""

import json
import hashlib
import logging
from pathlib import Path
from datetime import datetime, timezone

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("processor")

RAW_DIR = Path(__file__).parent.parent / "raw"
PROCESSED_DIR = Path(__file__).parent.parent / "processed"

# ---------------------------------------------------------------------------
# UNIFIED POST SCHEMA
# Every post from every source gets normalized to this shape.
# This is what ChromaDB and the rest of the pipeline consume.
# ---------------------------------------------------------------------------

"""
{
    "id": "sha256_hash_16chars",
    "source": "dread | breachforums | telegram | reddit | paste | archive",
    "forum_type": "dread | breachforums | paste | telegram | reddit",
    "title": "Post title or empty",
    "body": "Main text content",
    "text": "title + body combined — this is what gets embedded",
    "author": "username or anonymous",
    "timestamp": "ISO 8601 or empty",
    "url": "link to original post or empty",
    "scraped_at": "ISO 8601",
    "metadata": {
        "char_count": 150,
        "has_credentials": false,
        "has_ioc": false,
        "language": "en"
    }
}
"""


def generate_id(text: str, source: str) -> str:
    """Deterministic ID from content + source — same post = same ID = auto-dedup."""
    raw = f"{source}:{text[:200]}".encode("utf-8")
    return hashlib.sha256(raw).hexdigest()[:16]


def has_credential_pattern(text: str) -> bool:
    """Quick check for credential-like patterns in text."""
    import re
    patterns = [
        r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}",  # email
        r"(?i)(password|passwd|pwd)\s*[:=]\s*\S+",             # password fields
        r"(?i)(api[_-]?key|token|secret)\s*[:=]\s*\S+",       # API keys
        r"\b[a-fA-F0-9]{32,64}\b",                             # hashes (MD5/SHA)
    ]
    for p in patterns:
        if re.search(p, text):
            return True
    return False


def has_ioc_pattern(text: str) -> bool:
    """Quick check for IOC-like patterns."""
    import re
    patterns = [
        r"\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b",                     # IPv4
        r"(?i)(CVE-\d{4}-\d{4,})",                                       # CVE IDs
        r"(?i)(https?://[^\s]+\.onion\b)",                                # .onion URLs
        r"\b[a-fA-F0-9]{64}\b",                                          # SHA256 hashes
        r"(?i)\b(ransomware|malware|exploit|zero-?day|botnet|c2|c&c)\b", # threat keywords
    ]
    for p in patterns:
        if re.search(p, text):
            return True
    return False


def normalize_post(raw: dict, default_source: str = "unknown") -> dict | None:
    """Normalize a single raw post into unified schema."""
    title = raw.get("title", "").strip()
    body = raw.get("body", raw.get("content", raw.get("text", ""))).strip()
    text = f"{title}\n{body}".strip() if title else body

    # Skip empty posts
    if len(text) < 10:
        return None

    source = raw.get("source", default_source)
    post_id = raw.get("id", generate_id(text, source))

    return {
        "id": post_id,
        "source": source,
        "forum_type": raw.get("forum_type", source),
        "title": title,
        "body": body,
        "text": text,  # ← this is what gets embedded by BGE-M3
        "author": raw.get("author", raw.get("username", "anonymous")),
        "timestamp": raw.get("timestamp", raw.get("date", "")),
        "url": raw.get("link", raw.get("url", raw.get("page_url", ""))),
        "scraped_at": raw.get("scraped_at", datetime.now(timezone.utc).isoformat()),
        "metadata": {
            "char_count": len(text),
            "has_credentials": has_credential_pattern(text),
            "has_ioc": has_ioc_pattern(text),
        },
    }


def load_raw_files() -> list[dict]:
    """Load all JSON files from raw/ subdirectories."""
    all_raw = []

    if not RAW_DIR.exists():
        log.warning(f"Raw directory not found: {RAW_DIR}")
        return all_raw

    for json_file in RAW_DIR.rglob("*.json"):
        try:
            with open(json_file, "r", encoding="utf-8") as f:
                data = json.load(f)

            if isinstance(data, list):
                all_raw.extend(data)
            elif isinstance(data, dict):
                all_raw.append(data)

            log.info(f"Loaded {json_file.name}: {len(data) if isinstance(data, list) else 1} records")

        except Exception as e:
            log.error(f"Failed to load {json_file}: {e}")

    return all_raw


def process_all():
    """Main processing pipeline."""
    log.info("Loading raw data...")
    raw_posts = load_raw_files()
    log.info(f"Total raw records: {len(raw_posts)}")

    # Normalize
    normalized = []
    for raw in raw_posts:
        post = normalize_post(raw)
        if post:
            normalized.append(post)

    log.info(f"After normalization: {len(normalized)} posts")

    # Deduplicate by ID
    seen_ids = set()
    deduped = []
    for post in normalized:
        if post["id"] not in seen_ids:
            seen_ids.add(post["id"])
            deduped.append(post)

    log.info(f"After dedup: {len(deduped)} posts")

    # Stats
    cred_count = sum(1 for p in deduped if p["metadata"]["has_credentials"])
    ioc_count = sum(1 for p in deduped if p["metadata"]["has_ioc"])
    sources = {}
    for p in deduped:
        sources[p["source"]] = sources.get(p["source"], 0) + 1

    log.info(f"Posts with credentials: {cred_count}")
    log.info(f"Posts with IOCs: {ioc_count}")
    log.info(f"By source: {sources}")

    # Save
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    output_path = PROCESSED_DIR / "all_posts.json"

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(deduped, f, indent=2, ensure_ascii=False)

    log.info(f"✅ Saved {len(deduped)} processed posts → {output_path}")
    log.info("Next step: run `python data/chroma_loader.py`")

    return deduped


if __name__ == "__main__":
    process_all()
