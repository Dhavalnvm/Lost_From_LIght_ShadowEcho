"""
ShadowEcho — Module A: Emotional Escalation
Tracks psychological stage of threat actor.
curiosity → research → planning → preparation → action → post-action
"""

STAGES = ["curiosity", "research", "planning", "preparation", "action", "post-action"]


def parse_escalation(raw: dict) -> dict:
    """Parse and validate escalation module output."""
    stage = raw.get("stage", "curiosity")
    if stage not in STAGES:
        stage = "curiosity"

    level = raw.get("level", 0)
    level = max(1, min(6, int(level)))

    return {
        "stage": stage,
        "level": level,
        "indicators": raw.get("indicators", []),
        "is_high_risk": level >= 4,  # preparation or beyond
        "is_actionable": level >= 5,  # action or post-action
    }
