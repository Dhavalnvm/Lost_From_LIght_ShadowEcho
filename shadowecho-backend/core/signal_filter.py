"""
ShadowEcho — Signal Filter (Layer 2)
Four behavioral layers that determine if a detected post is a real signal or noise.

1. Behavioral Heuristics  — post timing, frequency, actor patterns
2. Cross-Source Correlation — same threat across multiple sources
3. Linguistic Deception     — genuine intent vs roleplay/trolling/scam
4. Coordination Detection   — organic chatter vs orchestrated campaign

Input: post text + detection result
Output: signal score (0-1) + pass/fail
"""

import re
import logging
from datetime import datetime
from dataclasses import dataclass, field
from config import SIGNAL_THRESHOLD

log = logging.getLogger("signal_filter")


@dataclass
class SignalResult:
    """Output of the signal filter."""
    score: float = 0.0
    is_signal: bool = False
    layer_scores: dict = field(default_factory=dict)
    flags: list[str] = field(default_factory=list)
    reasoning: str = ""

    def to_dict(self) -> dict:
        return {
            "score": round(self.score, 3),
            "is_signal": self.is_signal,
            "layer_scores": self.layer_scores,
            "flags": self.flags,
            "reasoning": self.reasoning,
        }


# ---------------------------------------------------------------------------
# LAYER 1: BEHAVIORAL HEURISTICS
# ---------------------------------------------------------------------------

def score_behavioral(text: str, author: str, metadata: dict) -> tuple[float, list[str]]:
    """
    Score based on post behavior patterns.
    High-effort posts with specific details score higher.
    """
    score = 0.0
    flags = []

    char_count = len(text)

    # Length — very short posts are usually noise, medium-length is suspect
    if 100 < char_count < 5000:
        score += 0.2
        flags.append("substantive_length")
    elif char_count > 5000:
        score += 0.1  # extremely long can be copy-paste noise

    # Specificity — contains specific technical details
    specific_patterns = [
        r"\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b",  # IP addresses
        r"CVE-\d{4}-\d+",                              # CVE references
        r"\b[a-fA-F0-9]{32,}\b",                       # hashes
        r"(?i)(version|v)\s*\d+\.\d+",                 # software versions
        r"(?i)(port|tcp|udp)\s*\d+",                    # port numbers
    ]
    specifics_found = sum(1 for p in specific_patterns if re.search(p, text))
    if specifics_found >= 2:
        score += 0.3
        flags.append("high_specificity")
    elif specifics_found >= 1:
        score += 0.15
        flags.append("some_specificity")

    # Named targets — mentions of specific companies/products
    if re.search(r"(?i)\b(microsoft|google|amazon|oracle|cisco|fortinet|palo alto)\b", text):
        score += 0.1
        flags.append("named_target")

    # Pricing language — selling access/data is a strong signal
    if re.search(r"(?i)(\$\d+|price|selling|buy|purchase|escrow|btc|bitcoin|monero|xmr)", text):
        score += 0.2
        flags.append("commercial_intent")

    return min(score, 1.0), flags


# ---------------------------------------------------------------------------
# LAYER 2: CROSS-SOURCE CORRELATION
# ---------------------------------------------------------------------------

def score_cross_source(text: str, source: str, similar_posts: list[dict]) -> tuple[float, list[str]]:
    """
    Score based on whether similar content appears across multiple sources.
    If the same threat shows up on Telegram AND a forum, it's more credible.
    """
    score = 0.0
    flags = []

    if not similar_posts:
        return score, flags

    # Check how many different sources the similar posts come from
    sources_seen = set()
    for post in similar_posts:
        post_source = post.get("metadata", {}).get("source", post.get("source", ""))
        if post_source:
            sources_seen.add(post_source)

    # Current post's source
    sources_seen.add(source)

    if len(sources_seen) >= 3:
        score = 0.9
        flags.append("multi_source_corroboration_strong")
    elif len(sources_seen) >= 2:
        score = 0.6
        flags.append("multi_source_corroboration")
    else:
        score = 0.2

    return min(score, 1.0), flags


# ---------------------------------------------------------------------------
# LAYER 3: LINGUISTIC DECEPTION DETECTION
# ---------------------------------------------------------------------------

ROLEPLAY_MARKERS = [
    r"(?i)\b(hypothetically|in minecraft|asking for a friend|educational purposes)\b",
    r"(?i)\b(just kidding|jk|lol|lmao|rofl)\b",
    r"(?i)\b(rp|roleplay|role-play|fiction|fictional|fanfic)\b",
]

SCAM_MARKERS = [
    r"(?i)\b(dm me|contact me|telegram @|wickr|signal)\b.*\b(guarantee|legit|100%|trusted)\b",
    r"(?i)\b(vouch|vouched|verified seller)\b",
    r"(?i)(send\s+\$|pay\s+first|upfront|advance payment)",
]

GENUINE_MARKERS = [
    r"(?i)\b(proof|sample|evidence|screenshot|paste)\b",
    r"(?i)\b(tested|confirmed|verified|working)\b",
    r"(?i)\b(access to|shell on|rdp|vpn|credentials for)\b",
]


def score_linguistic(text: str) -> tuple[float, list[str]]:
    """
    Score based on linguistic analysis.
    Genuine threats use different language than trolls and scammers.
    """
    score = 0.5  # neutral starting point
    flags = []

    # Check roleplay markers (reduce score)
    roleplay_hits = sum(1 for p in ROLEPLAY_MARKERS if re.search(p, text))
    if roleplay_hits > 0:
        score -= 0.3 * roleplay_hits
        flags.append("roleplay_language")

    # Check scam markers (reduce score — scams aren't real threats)
    scam_hits = sum(1 for p in SCAM_MARKERS if re.search(p, text))
    if scam_hits > 0:
        score -= 0.15 * scam_hits
        flags.append("scam_language")

    # Check genuine markers (increase score)
    genuine_hits = sum(1 for p in GENUINE_MARKERS if re.search(p, text))
    if genuine_hits >= 2:
        score += 0.3
        flags.append("genuine_indicators_strong")
    elif genuine_hits >= 1:
        score += 0.15
        flags.append("genuine_indicators")

    # All caps = usually noise
    caps_ratio = sum(1 for c in text if c.isupper()) / max(len(text), 1)
    if caps_ratio > 0.5:
        score -= 0.2
        flags.append("excessive_caps")

    return max(min(score, 1.0), 0.0), flags


# ---------------------------------------------------------------------------
# LAYER 4: COORDINATION DETECTION
# ---------------------------------------------------------------------------

def score_coordination(text: str, similar_posts: list[dict]) -> tuple[float, list[str]]:
    """
    Detect if this is part of a coordinated campaign vs organic chatter.
    Coordinated campaigns are MORE threatening — score goes up.
    """
    score = 0.0
    flags = []

    if not similar_posts:
        return score, flags

    # Check for near-duplicate content across posts (copy-paste campaigns)
    text_lower = text.lower().strip()
    duplicate_count = 0
    for post in similar_posts:
        other_text = post.get("document", post.get("body", "")).lower().strip()
        # Simple similarity — shared long substrings
        if len(text_lower) > 50 and len(other_text) > 50:
            # Check if first 100 chars match (lazy but fast)
            if text_lower[:100] == other_text[:100]:
                duplicate_count += 1

    if duplicate_count >= 3:
        score = 0.8
        flags.append("coordinated_campaign")
    elif duplicate_count >= 1:
        score = 0.5
        flags.append("possible_coordination")

    # Timing clustering would go here with real timestamps
    # For now, just check if similar posts exist at all
    if len(similar_posts) >= 5:
        score = max(score, 0.4)
        flags.append("high_volume_cluster")

    return min(score, 1.0), flags


# ---------------------------------------------------------------------------
# MAIN SIGNAL FILTER
# ---------------------------------------------------------------------------


def run_signal_filter(
    text: str,
    source: str = "",
    author: str = "",
    metadata: dict = None,
    similar_posts: list[dict] = None,
    detection_score: float = 0.0,
) -> SignalResult:
    """
    Run all four signal filter layers.
    Returns combined score and pass/fail.
    """
    if metadata is None:
        metadata = {}
    if similar_posts is None:
        similar_posts = []

    result = SignalResult()

    # Run all layers
    behav_score, behav_flags = score_behavioral(text, author, metadata)
    cross_score, cross_flags = score_cross_source(text, source, similar_posts)
    ling_score, ling_flags = score_linguistic(text)
    coord_score, coord_flags = score_coordination(text, similar_posts)

    result.layer_scores = {
        "behavioral": round(behav_score, 3),
        "cross_source": round(cross_score, 3),
        "linguistic": round(ling_score, 3),
        "coordination": round(coord_score, 3),
    }

    result.flags = behav_flags + cross_flags + ling_flags + coord_flags

    # Weighted combination
    # Detection score from Layer 1 gets a weight too
    combined = (
        detection_score * 0.25
        + behav_score * 0.25
        + cross_score * 0.20
        + ling_score * 0.20
        + coord_score * 0.10
    )

    result.score = round(combined, 3)
    result.is_signal = combined >= SIGNAL_THRESHOLD

    # Build reasoning
    if result.is_signal:
        result.reasoning = f"Signal confirmed (score: {result.score}). Key factors: {', '.join(result.flags[:5])}"
    else:
        result.reasoning = f"Filtered as noise (score: {result.score}). Below threshold {SIGNAL_THRESHOLD}."

    return result
