"""
ShadowEcho — Raw Data Processor
Normalizes raw JSON dumps from all scrapers (Tor, Telegram, Reddit)
into a unified format ready for ChromaDB loading.

Input:  data/raw/**/*.json  (raw scraper output)
Output: data/processed/all_posts.json  (normalized, deduplicated)

INCREMENTAL: On each run, loads existing all_posts.json and only adds
posts whose IDs are not already present. Safe to run repeatedly.

Run: python data/process_raw.py
     python data/process_raw.py --reset    # wipe and reprocess from scratch
"""

import sys
import re
import json
import hashlib
import logging
import argparse
import unicodedata
from pathlib import Path
from datetime import datetime, timezone

# Fix: allow running from any directory
BACKEND_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_ROOT))

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("processor")

# ---------------------------------------------------------------------------
# PATHS
# ---------------------------------------------------------------------------

RAW_DIR       = BACKEND_ROOT / "data" / "raw"
PROCESSED_DIR = BACKEND_ROOT / "data" / "processed"
OUTPUT_FILE   = PROCESSED_DIR / "all_posts.json"

# Minimum character length for a post to be embedded
MIN_TEXT_LENGTH = 20


# ---------------------------------------------------------------------------
# TEXT SANITIZATION — prevents Ollama 500 errors
# ---------------------------------------------------------------------------

def sanitize_text(value) -> str:
    """
    Coerce any value to a clean UTF-8 string safe for bge-m3 embedding.
    Handles: None, float NaN, int, bool, lists, dicts, stray control chars.
    """
    if value is None:
        return ""
    if isinstance(value, float):
        # catches NaN, inf
        return "" if (value != value or value == float("inf") or value == float("-inf")) else str(int(value))
    if isinstance(value, (int, bool)):
        return str(value)
    if isinstance(value, (list, dict)):
        try:
            return json.dumps(value, ensure_ascii=False)
        except Exception:
            return ""

    text = str(value)

    # Normalize unicode (NFC)
    try:
        text = unicodedata.normalize("NFC", text)
    except Exception:
        pass

    # Strip null bytes and control characters (keep \n \t \r)
    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", " ", text)

    # Collapse excessive whitespace
    text = re.sub(r"[ \t]{3,}", "  ", text)
    text = re.sub(r"\n{4,}", "\n\n\n", text)

    return text.strip()


def safe_field(raw: dict, *keys, fallback: str = "") -> str:
    """Try multiple keys in order, sanitize the first non-empty result."""
    for key in keys:
        val = raw.get(key)
        cleaned = sanitize_text(val)
        if cleaned:
            return cleaned
    return sanitize_text(fallback)


# ---------------------------------------------------------------------------
# IOC / CREDENTIAL DETECTION
# ---------------------------------------------------------------------------

def has_credential_pattern(text: str) -> bool:
    patterns = [
        r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}",
        r"(?i)(password|passwd|pwd)\s*[:=]\s*\S+",
        r"(?i)(api[_-]?key|token|secret)\s*[:=]\s*\S+",
        r"\b[a-fA-F0-9]{32,64}\b",
    ]
    return any(re.search(p, text) for p in patterns)


def has_ioc_pattern(text: str) -> bool:
    patterns = [
        r"\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b",
        r"(?i)(CVE-\d{4}-\d{4,})",
        r"(?i)(https?://[^\s]+\.onion\b)",
        r"\b[a-fA-F0-9]{64}\b",
        r"(?i)\b(ransomware|malware|exploit|zero-?day|botnet|c2|c&c)\b",
    ]
    return any(re.search(p, text) for p in patterns)


# ---------------------------------------------------------------------------
# ID GENERATION
# ---------------------------------------------------------------------------

def generate_id(text: str, source: str) -> str:
    """Deterministic ID — same post = same ID = auto-dedup."""
    raw = f"{source}:{text[:200]}".encode("utf-8")
    return hashlib.sha256(raw).hexdigest()[:16]


# ---------------------------------------------------------------------------
# NORMALIZE
# ---------------------------------------------------------------------------

def normalize_post(raw: dict, default_source: str = "unknown") -> dict | None:
    """
    Normalize a single raw post into unified schema.
    All string fields are sanitized to prevent NaN/null/control-char
    values from reaching the Ollama embedding API.
    """
    title = safe_field(raw, "title")
    body  = safe_field(raw, "body", "content", "text")

    # Build the combined text that will be embedded
    if title and body:
        text = f"{title}\n{body}"
    elif title:
        text = title
    else:
        text = body

    text = text.strip()

    # Hard minimum
    if len(text) < MIN_TEXT_LENGTH:
        return None

    # Source name — Reddit posts get subreddit-qualified names
    raw_source = sanitize_text(raw.get("source", default_source)) or default_source
    subreddit  = sanitize_text(raw.get("subreddit", ""))
    if raw_source == "reddit" and subreddit:
        source = f"reddit_r_{subreddit}"
    else:
        source = raw_source

    post_id = sanitize_text(raw.get("id", "")) or generate_id(text, source)

    metadata: dict = {
        "char_count":      len(text),
        "has_credentials": has_credential_pattern(text),
        "has_ioc":         has_ioc_pattern(text),
    }
    if subreddit:
        metadata["subreddit"]    = subreddit
        metadata["score"]        = int(raw.get("score", 0) or 0)
        metadata["num_comments"] = int(raw.get("num_comments", 0) or 0)

    return {
        "id":         post_id,
        "source":     source,
        "forum_type": sanitize_text(raw.get("forum_type", raw_source)),
        "title":      title,
        "body":       body,
        "text":       text,   # ← this is what bge-m3 will embed
        "author":     safe_field(raw, "author", "username", fallback="anonymous"),
        "timestamp":  safe_field(raw, "timestamp", "date"),
        "url":        safe_field(raw, "link", "url", "page_url"),
        "scraped_at": safe_field(raw, "scraped_at") or datetime.now(timezone.utc).isoformat(),
        "metadata":   metadata,
    }


# ---------------------------------------------------------------------------
# LOAD EXISTING (incremental)
# ---------------------------------------------------------------------------

def load_existing() -> tuple[list[dict], set[str]]:
    """Load the current all_posts.json. Returns (posts, id_set)."""
    if not OUTPUT_FILE.exists():
        log.info("No existing all_posts.json — starting fresh")
        return [], set()

    with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
        posts = json.load(f)

    # Re-sanitize existing text fields in case old data has issues
    fixed = 0
    for p in posts:
        original = p.get("text", "")
        cleaned  = sanitize_text(original)
        if cleaned != original:
            p["text"] = cleaned
            fixed += 1

    ids = {p["id"] for p in posts}
    log.info(f"Existing all_posts.json: {len(posts)} posts ({fixed} text fields re-sanitized)")
    return posts, ids


# ---------------------------------------------------------------------------
# LOAD RAW FILES
# ---------------------------------------------------------------------------

def load_raw_files() -> list[dict]:
    """Walk data/raw/**/*.json and load every record."""
    all_raw = []

    if not RAW_DIR.exists():
        log.warning(f"Raw directory not found: {RAW_DIR}")
        return all_raw

    json_files = sorted(RAW_DIR.rglob("*.json"))
    if not json_files:
        log.warning(f"No JSON files found under {RAW_DIR}")
        return all_raw

    for json_file in json_files:
        try:
            with open(json_file, "r", encoding="utf-8") as f:
                data = json.load(f)

            if isinstance(data, list):
                all_raw.extend(data)
                log.info(f"  📄 {json_file.relative_to(BACKEND_ROOT)}: {len(data)} records")
            elif isinstance(data, dict):
                all_raw.append(data)
                log.info(f"  📄 {json_file.relative_to(BACKEND_ROOT)}: 1 record")

        except Exception as e:
            log.error(f"  ❌ Failed to load {json_file.name}: {e}")

    return all_raw


# ---------------------------------------------------------------------------
# MAIN
# ---------------------------------------------------------------------------

def process_all(reset: bool = False) -> list[dict]:
    log.info("=" * 60)
    log.info("ShadowEcho — process_raw starting")
    log.info(f"  RAW_DIR     : {RAW_DIR}")
    log.info(f"  OUTPUT_FILE : {OUTPUT_FILE}")
    log.info("=" * 60)

    if reset:
        log.warning("⚠️  --reset flag: wiping existing processed data")
        existing_posts, existing_ids = [], set()
    else:
        existing_posts, existing_ids = load_existing()

    log.info(f"\nScanning {RAW_DIR} for raw JSON files...")
    raw_posts = load_raw_files()
    log.info(f"Total raw records found: {len(raw_posts)}")

    if not raw_posts:
        log.info("Nothing to process.")
        return existing_posts

    new_posts     = []
    skipped_short = 0
    skipped_dupe  = 0

    for raw in raw_posts:
        post = normalize_post(raw)
        if post is None:
            skipped_short += 1
            continue
        if post["id"] in existing_ids:
            skipped_dupe += 1
            continue
        existing_ids.add(post["id"])
        new_posts.append(post)

    merged = existing_posts + new_posts

    log.info("\n📊 Summary:")
    log.info(f"  Previously processed : {len(existing_posts)}")
    log.info(f"  Raw records scanned  : {len(raw_posts)}")
    log.info(f"  Skipped (too short)  : {skipped_short}")
    log.info(f"  Skipped (duplicates) : {skipped_dupe}")
    log.info(f"  ✨ New posts added   : {len(new_posts)}")
    log.info(f"  Total in output      : {len(merged)}")

    if new_posts:
        cred_count = sum(1 for p in new_posts if p["metadata"]["has_credentials"])
        ioc_count  = sum(1 for p in new_posts if p["metadata"]["has_ioc"])
        sources: dict[str, int] = {}
        for p in new_posts:
            sources[p["source"]] = sources.get(p["source"], 0) + 1
        log.info(f"  New posts with credentials : {cred_count}")
        log.info(f"  New posts with IOCs        : {ioc_count}")
        log.info(f"  New posts by source:")
        for src, count in sorted(sources.items()):
            log.info(f"    {src}: {count}")
    else:
        log.info("  ✅ Nothing new — all raw files already processed.")

    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(merged, f, indent=2, ensure_ascii=False)

    log.info(f"\n✅ Saved → {OUTPUT_FILE}")
    log.info("Next step: python data/chroma_loader.py")

    return merged


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="ShadowEcho — incremental raw data processor")
    parser.add_argument("--reset", action="store_true", help="Wipe existing processed data and reprocess from scratch")
    args = parser.parse_args()
    process_all(reset=args.reset)