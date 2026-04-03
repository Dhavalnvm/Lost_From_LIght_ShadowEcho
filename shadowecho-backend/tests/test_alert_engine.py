"""Tests for core/alert_engine.py"""
import sys
sys.path.insert(0, str(__import__("pathlib").Path(__file__).parent.parent))

from core.alert_engine import compute_alert_score, determine_severity, determine_alert_type


def test_high_score():
    score = compute_alert_score(
        detection_output={"score": 0.8, "org_mentions": ["Acme"], "detection_tags": ["org_mention", "leak"]},
        signal_output={"score": 0.9},
        module_output={
            "mimicry": {"verdict": "genuine"},
            "escalation": {"level": 5},
            "consensus": {"type": "organized"},
        },
    )
    assert score > 0.7


def test_low_score():
    score = compute_alert_score(
        detection_output={"score": 0.1, "org_mentions": [], "detection_tags": []},
        signal_output={"score": 0.2},
        module_output={
            "mimicry": {"verdict": "troll"},
            "escalation": {"level": 1},
            "consensus": {"type": "solo"},
        },
    )
    assert score < 0.3


def test_severity_mapping():
    assert determine_severity(0.95) == "critical"
    assert determine_severity(0.8) == "high"
    assert determine_severity(0.6) == "medium"
    assert determine_severity(0.3) == "low"


def test_alert_type():
    assert determine_alert_type(
        {"detection_tags": ["leak"]}, {"narrative": {"threat_type": "data_leak"}}
    ) == "data_leak"

    assert determine_alert_type(
        {"detection_tags": ["credentials"]}, {"narrative": {"threat_type": ""}}
    ) == "credential_exposure"

    assert determine_alert_type(
        {"detection_tags": ["org_mention"]}, {"narrative": {"threat_type": ""}}
    ) == "org_mention"


if __name__ == "__main__":
    test_high_score()
    test_low_score()
    test_severity_mapping()
    test_alert_type()
    print("✅ All alert engine tests passed")
