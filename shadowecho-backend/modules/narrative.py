"""
ShadowEcho — Module C: Narrative Reconstructor
Stitches scattered intelligence into one coherent attack story.
"""

VALID_THREAT_TYPES = {
    "data_leak", "ransomware", "exploit_sale", "access_sale",
    "credential_dump", "reconnaissance", "other",
}


def parse_narrative(raw: dict) -> dict:
    """Parse and validate narrative module output."""
    threat_type = raw.get("threat_type", "other")
    if threat_type not in VALID_THREAT_TYPES:
        threat_type = "other"

    return {
        "summary": raw.get("summary", ""),
        "threat_type": threat_type,
        "timeline": raw.get("timeline", []),
        "targets": raw.get("targets", []),
        "recommended_actions": raw.get("recommended_actions", []),
        "uncertainty_note": raw.get("uncertainty_note", ""),
    }
