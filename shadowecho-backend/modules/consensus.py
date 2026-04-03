"""
ShadowEcho — Module B: Consensus Detector
Detects when solo chatter becomes collective mob intent.
"""

VALID_TYPES = {"solo", "emerging_group", "organized", "mob"}
VALID_MOMENTUM = {"growing", "stable", "declining"}


def parse_consensus(raw: dict) -> dict:
    """Parse and validate consensus module output."""
    cons_type = raw.get("type", "solo")
    if cons_type not in VALID_TYPES:
        cons_type = "solo"

    momentum = raw.get("momentum", "stable")
    if momentum not in VALID_MOMENTUM:
        momentum = "stable"

    return {
        "type": cons_type,
        "group_size_estimate": max(0, int(raw.get("group_size_estimate", 0))),
        "momentum": momentum,
        "evidence": raw.get("evidence", ""),
        "is_collective": cons_type in ("organized", "mob"),
        "is_growing": momentum == "growing",
    }
