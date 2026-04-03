"""
ShadowEcho — Module D: Mimicry Filter
Parses and validates the mimicry analysis from the LLM output.
Separates real threats from bluffs, trolling, honeypots.
"""


VALID_VERDICTS = {"genuine", "bluff", "troll", "honeypot", "scam", "uncertain"}


def parse_mimicry(raw: dict) -> dict:
    """Parse and validate mimicry module output."""
    verdict = raw.get("verdict", "uncertain")
    if verdict not in VALID_VERDICTS:
        verdict = "uncertain"

    confidence = raw.get("confidence", 0)
    confidence = max(0, min(100, int(confidence)))

    return {
        "verdict": verdict,
        "confidence": confidence,
        "reasoning": raw.get("reasoning", ""),
        "uncertainty_note": raw.get("uncertainty_note", ""),
        "is_genuine": verdict == "genuine",
        "is_noise": verdict in ("bluff", "troll"),
    }
