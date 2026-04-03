"""Tests for core/signal_filter.py"""
import sys
sys.path.insert(0, str(__import__("pathlib").Path(__file__).parent.parent))

from core.signal_filter import run_signal_filter


def test_high_signal_post():
    text = """Selling RDP access to Fortune 500 company. 
    Proof: 10.200.x.x internal range. $5000 BTC. 
    Tested and confirmed working. CVE-2024-5678 exploited."""
    result = run_signal_filter(text=text, source="dread", detection_score=0.5)
    assert result.score > 0.4
    assert "commercial_intent" in result.flags


def test_noise_post():
    text = "lol just kidding guys hypothetically speaking in minecraft"
    result = run_signal_filter(text=text, source="telegram", detection_score=0.0)
    assert result.score < 0.4
    assert "roleplay_language" in result.flags


def test_cross_source_boost():
    similar = [
        {"metadata": {"source": "telegram"}, "document": "breach alert"},
        {"metadata": {"source": "dread"}, "document": "breach alert"},
        {"metadata": {"source": "reddit"}, "document": "breach alert"},
    ]
    result = run_signal_filter(
        text="corporate breach data available",
        source="breachforums",
        similar_posts=similar,
        detection_score=0.3,
    )
    assert "multi_source_corroboration" in result.flags or "multi_source_corroboration_strong" in result.flags


def test_scam_language_reduces_score():
    text = "DM me on Telegram @seller100 guaranteed legit 100% trusted vouch"
    result = run_signal_filter(text=text, detection_score=0.1)
    assert "scam_language" in result.flags


if __name__ == "__main__":
    test_high_signal_post()
    test_noise_post()
    test_cross_source_boost()
    test_scam_language_reduces_score()
    print("✅ All signal filter tests passed")
