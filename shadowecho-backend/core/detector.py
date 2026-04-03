"""
ShadowEcho — Detector (Layer 1)
First layer in the pipeline. Extracts:
  - Organization mentions (from analyst watchlist)
  - Credentials (emails, passwords, API keys)
  - IOCs (IPs, CVEs, hashes, domains, .onion URLs)
  - Leak indicators (database dumps, combo lists)
  - Coded language / slang (dark web jargon decoder)   ← NEW

Runs BEFORE the signal filter. Decides if a post is even relevant.
"""

import re
import logging
from dataclasses import dataclass, field
from config import DEFAULT_ORG_WATCHLIST
from core.slang_decoder import decode_slang, SlangResult

log = logging.getLogger("detector")


@dataclass
class DetectionResult:
    """Output of the detection layer for a single post."""
    is_relevant: bool = False
    org_mentions: list[str] = field(default_factory=list)
    credentials: list[dict] = field(default_factory=list)
    iocs: list[dict] = field(default_factory=list)
    leak_indicators: list[str] = field(default_factory=list)
    detection_tags: list[str] = field(default_factory=list)
    score: float = 0.0
    # NEW — slang decoder output
    slang: dict = field(default_factory=dict)

    def to_dict(self) -> dict:
        return {
            "is_relevant": self.is_relevant,
            "org_mentions": self.org_mentions,
            "credentials": self.credentials,
            "iocs": self.iocs,
            "leak_indicators": self.leak_indicators,
            "detection_tags": self.detection_tags,
            "score": self.score,
            "slang": self.slang,
        }


# ---------------------------------------------------------------------------
# PATTERN LIBRARIES
# ---------------------------------------------------------------------------

EMAIL_PATTERN = re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")
PASSWORD_PATTERN = re.compile(r"(?i)(password|passwd|pwd|pass)\s*[:=]\s*(\S+)")
API_KEY_PATTERN = re.compile(r"(?i)(api[_-]?key|token|secret|bearer)\s*[:=]\s*([a-zA-Z0-9_\-\.]{16,})")
HASH_MD5 = re.compile(r"\b[a-fA-F0-9]{32}\b")
HASH_SHA1 = re.compile(r"\b[a-fA-F0-9]{40}\b")
HASH_SHA256 = re.compile(r"\b[a-fA-F0-9]{64}\b")
IPV4_PATTERN = re.compile(r"\b(?:\d{1,3}\.){3}\d{1,3}\b")
CVE_PATTERN = re.compile(r"CVE-\d{4}-\d{4,}", re.IGNORECASE)
DOMAIN_PATTERN = re.compile(r"\b[a-zA-Z0-9-]+\.(onion|ru|cn|cc|tk|xyz|top|pw|su)\b")
ONION_URL = re.compile(r"[a-z2-7]{16,56}\.onion")

LEAK_KEYWORDS = [
    "database dump", "db dump", "combo list", "combolist", "leak", "leaked",
    "breach", "breached", "data dump", "fullz", "dox", "doxxed", "ssn",
    "credit card", "cc dump", "cvv", "bin list", "source code leak",
    "employee data", "customer data", "credentials dump",
]

THREAT_KEYWORDS = [
    "exploit", "zero-day", "0day", "zeroday", "ransomware", "malware",
    "botnet", "c2", "c&c", "command and control", "backdoor", "rootkit",
    "keylogger", "rat", "trojan", "phishing kit", "ddos", "brute force",
    "privilege escalation", "rce", "remote code execution", "sqli",
    "sql injection", "xss",
]


# ---------------------------------------------------------------------------
# DETECTION FUNCTIONS
# ---------------------------------------------------------------------------


def detect_org_mentions(text: str, watchlist: list[str]) -> list[str]:
    text_lower = text.lower()
    found = []
    for org in watchlist:
        org_lower = org.strip().lower()
        if org_lower and org_lower in text_lower:
            found.append(org.strip())
    return found


def detect_credentials(text: str) -> list[dict]:
    creds = []
    for match in EMAIL_PATTERN.finditer(text):
        creds.append({"type": "email", "value": match.group()})
    for match in PASSWORD_PATTERN.finditer(text):
        creds.append({"type": "password_field", "value": match.group()[:50]})
    for match in API_KEY_PATTERN.finditer(text):
        creds.append({"type": "api_key", "value": match.group()[:50]})
    return creds


def detect_iocs(text: str) -> list[dict]:
    iocs = []
    for match in CVE_PATTERN.finditer(text):
        iocs.append({"type": "cve", "value": match.group()})
    for match in IPV4_PATTERN.finditer(text):
        ip = match.group()
        if not ip.startswith(("10.", "192.168.", "127.", "0.")):
            iocs.append({"type": "ipv4", "value": ip})
    for match in HASH_SHA256.finditer(text):
        iocs.append({"type": "sha256", "value": match.group()})
    for match in HASH_SHA1.finditer(text):
        if len(match.group()) == 40:
            iocs.append({"type": "sha1", "value": match.group()})
    for match in HASH_MD5.finditer(text):
        if len(match.group()) == 32:
            iocs.append({"type": "md5", "value": match.group()})
    for match in DOMAIN_PATTERN.finditer(text):
        iocs.append({"type": "domain", "value": match.group()})
    for match in ONION_URL.finditer(text):
        iocs.append({"type": "onion", "value": match.group()})
    return iocs


def detect_leak_indicators(text: str) -> list[str]:
    text_lower = text.lower()
    return [kw for kw in LEAK_KEYWORDS if kw in text_lower]


def detect_threat_keywords(text: str) -> list[str]:
    text_lower = text.lower()
    return [kw for kw in THREAT_KEYWORDS if kw in text_lower]


# ---------------------------------------------------------------------------
# MAIN DETECTION FUNCTION
# ---------------------------------------------------------------------------


def run_detection(text: str, watchlist: list[str] = None) -> DetectionResult:
    """
    Run full detection on a piece of text.
    Now includes slang decoding for coded language detection.
    """
    if watchlist is None:
        watchlist = DEFAULT_ORG_WATCHLIST

    result = DetectionResult()

    # Run all detectors
    result.org_mentions = detect_org_mentions(text, watchlist)
    result.credentials = detect_credentials(text)
    result.iocs = detect_iocs(text)
    result.leak_indicators = detect_leak_indicators(text)
    threat_kws = detect_threat_keywords(text)

    # NEW — Slang decoder
    slang_result = decode_slang(text)
    result.slang = slang_result.to_dict()

    # Build tags
    if result.org_mentions:
        result.detection_tags.append("org_mention")
    if result.credentials:
        result.detection_tags.append("credentials")
    if result.iocs:
        result.detection_tags.append("ioc")
    if result.leak_indicators:
        result.detection_tags.append("leak")
    if threat_kws:
        result.detection_tags.append("threat")
    if slang_result.has_coded_language:
        result.detection_tags.append("coded_language")
        # Add specific threat categories from slang
        for cat in slang_result.threat_categories[:3]:
            result.detection_tags.append(f"slang:{cat}")

    # Score — weighted sum
    score = 0.0
    if result.org_mentions:
        score += 0.4
    if result.credentials:
        score += 0.2
    if result.iocs:
        score += 0.15
    if result.leak_indicators:
        score += 0.15
    if threat_kws:
        score += 0.1

    # NEW — Slang score boost
    if slang_result.has_coded_language:
        sev = slang_result.highest_severity
        if sev == "critical":
            score += 0.25
        elif sev == "high":
            score += 0.15
        elif sev == "medium":
            score += 0.1

    result.score = min(score, 1.0)
    result.is_relevant = result.score > 0.0 or len(result.detection_tags) > 0

    return result