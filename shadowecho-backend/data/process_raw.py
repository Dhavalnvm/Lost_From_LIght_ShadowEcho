"""
ShadowEcho — Raw Data Processor
Normalizes raw JSON dumps from all scrapers (Tor, Telegram, Reddit)
AND raw CSV exports into a unified format ready for ChromaDB loading.

Handles two CSV schemas automatically:
  Schema A — shadowecho_*.csv  (scrape_session, post_url, scraped_at, ...)
  Schema B — results.csv       (forum_type_detected, url, onion_url,
                                 collection_timestamp, author_rank, tags, ...)

Input:  data/raw/**/*.json   (raw scraper output)
        data/raw/**/*.csv    (CSV exports — any schema variant)
Output: data/processed/all_posts.json  (normalized, deduplicated)

INCREMENTAL: Safe to run repeatedly — only new IDs are appended.

Run: python data/process_raw.py
     python data/process_raw.py --reset    # wipe and reprocess from scratch
"""

import sys
import re
import csv
import json
import hashlib
import logging
import argparse
import unicodedata
from pathlib import Path
from datetime import datetime, timezone

BACKEND_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_ROOT))

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("processor")

# ---------------------------------------------------------------------------
# PATHS
# ---------------------------------------------------------------------------

RAW_DIR       = BACKEND_ROOT / "data" / "raw"
PROCESSED_DIR = BACKEND_ROOT / "data" / "processed"
OUTPUT_FILE   = PROCESSED_DIR / "all.json"

MIN_TEXT_LENGTH = 20


# ---------------------------------------------------------------------------
# TEXT SANITIZATION
# ---------------------------------------------------------------------------

def sanitize_text(value) -> str:
    """Coerce any value to a clean UTF-8 string safe for bge-m3 embedding."""
    if value is None:
        return ""
    if isinstance(value, float):
        return "" if (value != value or value in (float("inf"), float("-inf"))) else str(int(value))
    if isinstance(value, (int, bool)):
        return str(value)
    if isinstance(value, (list, dict)):
        try:
            return json.dumps(value, ensure_ascii=False)
        except Exception:
            return ""

    text = str(value)
    try:
        text = unicodedata.normalize("NFC", text)
    except Exception:
        pass
    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", " ", text)
    text = re.sub(r"[ \t]{3,}", "  ", text)
    text = re.sub(r"\n{4,}", "\n\n\n", text)
    return text.strip()


def safe_field(raw: dict, *keys, fallback: str = "") -> str:
    """Try multiple keys in order, return first non-empty sanitized value."""
    for key in keys:
        val = raw.get(key)
        cleaned = sanitize_text(val)
        if cleaned:
            return cleaned
    return sanitize_text(fallback)


def _csv_bool(value: str) -> bool:
    """Convert CSV boolean strings to Python bool."""
    return str(value).strip().lower() in ("true", "1", "yes", "t")


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
    """Deterministic 16-char hex ID — same post = same ID = auto-dedup."""
    raw = f"{source}:{text[:200]}".encode("utf-8")
    return hashlib.sha256(raw).hexdigest()[:16]


# ---------------------------------------------------------------------------
# NORMALIZE — JSON posts
# ---------------------------------------------------------------------------

def normalize_post(raw: dict, default_source: str = "unknown") -> dict | None:
    """Normalize a single raw JSON post into the unified schema."""
    title = safe_field(raw, "title")
    body  = safe_field(raw, "body", "content", "text")
    text  = f"{title}\n{body}".strip() if (title and body) else (title or body).strip()

    if len(text) < MIN_TEXT_LENGTH:
        return None

    raw_source = sanitize_text(raw.get("source", default_source)) or default_source
    subreddit  = sanitize_text(raw.get("subreddit", ""))
    source     = f"reddit_r_{subreddit}" if (raw_source == "reddit" and subreddit) else raw_source
    post_id    = sanitize_text(raw.get("id", "")) or generate_id(text, source)

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
        "text":       text,
        "author":     safe_field(raw, "author", "username", fallback="anonymous"),
        "timestamp":  safe_field(raw, "timestamp", "date"),
        "url":        safe_field(raw, "link", "url", "page_url"),
        "scraped_at": safe_field(raw, "scraped_at") or datetime.now(timezone.utc).isoformat(),
        "metadata":   metadata,
    }


# ---------------------------------------------------------------------------
# NORMALIZE — CSV rows
#
# Schema A (shadowecho_*.csv):
#   record_id, scrape_session, source_type, source_name, source_url,
#   post_url, post_date, scraped_at, author_handle, author_reputation,
#   title, body_snippet, body_full_length, language_detected, ...
#
# Schema B (results.csv):
#   record_id, source_type, source_name, forum_type_detected, url,
#   onion_url, collection_timestamp, post_date, language_detected,
#   author_handle, author_reputation, author_rank, author_post_count,
#   author_joined, author_pgp_fingerprint, body_snippet, title,
#   tags, analyst_notes, ...
#
# All IOC columns (ipv4_addresses, cves, emails, etc.) are shared
# across both schemas.
# ---------------------------------------------------------------------------

def normalize_csv_row(row: dict) -> dict | None:
    """
    Normalize a single CSV row from either schema into the unified schema.
    Uses .get() with fallbacks throughout — never raises KeyError.
    """
    title = sanitize_text(row.get("title", ""))
    body  = sanitize_text(row.get("body_snippet", ""))
    text  = f"{title}\n{body}".strip() if (title and body) else (title or body).strip()

    if len(text) < MIN_TEXT_LENGTH:
        return None

    # ── Source / forum type ──────────────────────────────────────────────────
    source     = sanitize_text(row.get("source_name", "")) or "csv_import"
    forum_type = (
        sanitize_text(row.get("forum_type_detected", ""))  # Schema B
        or sanitize_text(row.get("source_type", ""))       # Schema A
        or source
    )

    # ── Post ID ──────────────────────────────────────────────────────────────
    # Schema A uses 16-char hex; Schema B uses UUID — both work as stable IDs
    post_id = sanitize_text(row.get("record_id", "")) or generate_id(text, source)

    # ── URL ──────────────────────────────────────────────────────────────────
    url = (
        sanitize_text(row.get("post_url", ""))     # Schema A
        or sanitize_text(row.get("url", ""))        # Schema B
        or sanitize_text(row.get("source_url", ""))
        or sanitize_text(row.get("onion_url", ""))
    )

    # ── Timestamps ───────────────────────────────────────────────────────────
    timestamp  = sanitize_text(row.get("post_date", ""))
    scraped_at = (
        sanitize_text(row.get("scraped_at", ""))               # Schema A
        or sanitize_text(row.get("collection_timestamp", ""))  # Schema B
        or datetime.now(timezone.utc).isoformat()
    )

    # ── Author ───────────────────────────────────────────────────────────────
    author = sanitize_text(row.get("author_handle", "")) or "anonymous"

    # ── IOC / credential flags ────────────────────────────────────────────────
    has_ioc = any(_csv_bool(row.get(col, "False")) for col in (
        "contains_network_ioc",
        "contains_malware_ioc",
        "contains_financial_ioc",
        "contains_pii",
    ))
    has_credentials = (
        bool(sanitize_text(row.get("email_pass_pairs", "")))
        or bool(sanitize_text(row.get("api_keys", "")))
        or _csv_bool(row.get("private_keys_found", "False"))
    )
    # Second-pass pattern detection on the text itself
    has_credentials = has_credentials or has_credential_pattern(text)
    has_ioc         = has_ioc         or has_ioc_pattern(text)

    # ── Risk score & confidence ───────────────────────────────────────────────
    try:
        risk_score = int(float(row.get("risk_score", 0) or 0))
    except (ValueError, TypeError):
        risk_score = 0

    try:
        confidence = float(row.get("confidence", 0) or 0)
    except (ValueError, TypeError):
        confidence = 0.0

    # ── Metadata ─────────────────────────────────────────────────────────────
    metadata: dict = {
        "char_count":         len(text),
        "has_credentials":    has_credentials,
        "has_ioc":            has_ioc,
        "threat_category":    sanitize_text(row.get("threat_category", "")),
        "threat_subcategory": sanitize_text(row.get("threat_subcategory", "")),
        "severity":           sanitize_text(row.get("severity", "")),
        "risk_score":         risk_score,
        "confidence":         confidence,
        "language":           sanitize_text(row.get("language_detected", "en")),
        "is_high_priority":   _csv_bool(row.get("is_high_priority", "False")),
        "alert_triggered":    _csv_bool(row.get("alert_triggered", "False")),
        "needs_human_review": _csv_bool(row.get("needs_human_review", "False")),
    }

    # Schema B extras — store if non-empty
    for field in (
        "author_rank", "author_post_count", "author_joined",
        "author_pgp_fingerprint", "author_reputation",
        "tags", "analyst_notes",
    ):
        val = sanitize_text(row.get(field, ""))
        if val:
            metadata[field] = val

    # Schema A extras
    for field in ("alert_reason", "scrape_session"):
        val = sanitize_text(row.get(field, ""))
        if val:
            metadata[field] = val

    # IOC detail fields shared across both schemas — store if non-empty
    for ioc_field in (
        "ipv4_addresses", "ipv6_addresses", "domains", "onion_urls",
        "clearnet_urls", "open_ports", "emails", "email_pass_pairs",
        "phone_numbers", "ssn_patterns", "api_keys", "jwt_tokens",
        "md5_hashes", "sha1_hashes", "sha256_hashes", "sha512_hashes",
        "cves", "btc_addresses", "eth_addresses", "monero_addresses",
        "credit_cards", "ibans", "telegram_handles",
        "jabber_addresses", "wickr_handles",
        "aadhaar_numbers", "pan_numbers", "passport_numbers",
    ):
        val = sanitize_text(row.get(ioc_field, ""))
        if val:
            metadata[ioc_field] = val

    return {
        "id":         post_id,
        "source":     source,
        "forum_type": forum_type,
        "title":      title,
        "body":       body,
        "text":       text,
        "author":     author,
        "timestamp":  timestamp,
        "url":        url,
        "scraped_at": scraped_at,
        "metadata":   metadata,
    }


# ---------------------------------------------------------------------------
# LOAD EXISTING (incremental)
# ---------------------------------------------------------------------------

def load_existing() -> tuple[list[dict], set[str]]:
    """Load current all_posts.json. Returns (posts, id_set)."""
    if not OUTPUT_FILE.exists():
        log.info("No existing all_posts.json — starting fresh")
        return [], set()

    with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
        posts = json.load(f)

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
# LOAD RAW — JSON
# ---------------------------------------------------------------------------

def load_raw_json_files() -> list[dict]:
    json_files = sorted(RAW_DIR.rglob("*.json"))
    all_raw: list[dict] = []

    if not json_files:
        log.info("  No JSON files found")
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
            log.error(f"  ❌ {json_file.name}: {e}")

    return all_raw


# ---------------------------------------------------------------------------
# LOAD RAW — CSV (both schemas)
# ---------------------------------------------------------------------------

def load_raw_csv_files() -> list[dict]:
    """
    Walk data/raw/**/*.csv and load every row.
    Detects schema variant from column headers and logs it.
    """
    csv_files = sorted(RAW_DIR.rglob("*.csv"))
    all_rows: list[dict] = []

    if not csv_files:
        log.info("  No CSV files found")
        return all_rows

    for csv_file in csv_files:
        try:
            # utf-8-sig strips the BOM that Excel sometimes adds
            with open(csv_file, "r", encoding="utf-8-sig", newline="") as f:
                reader = csv.DictReader(f)
                rows   = list(reader)

            if not rows:
                log.warning(f"  ⚠️  {csv_file.name}: empty file — skipped")
                continue

            # Detect schema from headers
            cols = set(rows[0].keys())
            if "forum_type_detected" in cols:
                schema = "B (results.csv)"
            elif "scrape_session" in cols:
                schema = "A (shadowecho_*.csv)"
            else:
                schema = "unknown — best-effort mapping"

            all_rows.extend(rows)
            log.info(
                f"  📊 {csv_file.relative_to(BACKEND_ROOT)}: "
                f"{len(rows)} rows  [schema {schema}]"
            )

        except Exception as e:
            log.error(f"  ❌ {csv_file.name}: {e}")

    return all_rows


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

    log.info(f"\nScanning {RAW_DIR} for raw files...")
    log.info("  → JSON:")
    raw_json = load_raw_json_files()
    log.info("  → CSV:")
    raw_csv  = load_raw_csv_files()
    log.info(f"Total raw records: {len(raw_json)} JSON + {len(raw_csv)} CSV rows")

    if not raw_json and not raw_csv:
        log.info("Nothing to process.")
        return existing_posts

    new_posts: list[dict] = []
    skipped_short = 0
    skipped_dupe  = 0

    for raw in raw_json:
        post = normalize_post(raw)
        if post is None:
            skipped_short += 1
            continue
        if post["id"] in existing_ids:
            skipped_dupe += 1
            continue
        existing_ids.add(post["id"])
        new_posts.append(post)

    for row in raw_csv:
        post = normalize_csv_row(row)
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
    log.info(f"  JSON records scanned : {len(raw_json)}")
    log.info(f"  CSV rows scanned     : {len(raw_csv)}")
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