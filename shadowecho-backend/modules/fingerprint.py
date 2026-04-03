"""
ShadowEcho — Module E: Actor Fingerprinting
Builds cross-platform identity profile without relying on usernames.
Based on behavioral and linguistic traits.
"""

VALID_STYLES = {"formal", "casual", "technical", "script_kiddie", "professional_criminal"}
VALID_LEVELS = {"novice", "intermediate", "advanced", "expert"}


def parse_fingerprint(raw: dict) -> dict:
    """Parse and validate fingerprint module output."""
    style = raw.get("writing_style", "casual")
    if style not in VALID_STYLES:
        style = "casual"

    level = raw.get("experience_level", "novice")
    if level not in VALID_LEVELS:
        level = "novice"

    confidence = raw.get("confidence", 0)
    confidence = max(0, min(100, int(confidence)))

    return {
        "actor_id": raw.get("actor_id", ""),
        "traits": raw.get("traits", []),
        "writing_style": style,
        "experience_level": level,
        "confidence": confidence,
        "uncertainty_note": raw.get("uncertainty_note", ""),
        "is_experienced": level in ("advanced", "expert"),
    }
