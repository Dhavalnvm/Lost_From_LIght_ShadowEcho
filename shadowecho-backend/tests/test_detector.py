"""Tests for core/detector.py"""
import sys
sys.path.insert(0, str(__import__("pathlib").Path(__file__).parent.parent))

from core.detector import run_detection, detect_credentials, detect_iocs


def test_org_mention():
    result = run_detection("We have breached Acme Corp database", watchlist=["Acme Corp"])
    assert result.is_relevant
    assert "Acme Corp" in result.org_mentions
    assert "org_mention" in result.detection_tags


def test_credential_detection():
    text = "admin@company.com password=hunter2 api_key=sk_live_abc123def456ghi789"
    creds = detect_credentials(text)
    types = [c["type"] for c in creds]
    assert "email" in types
    assert "password_field" in types
    assert "api_key" in types


def test_ioc_detection():
    text = "C2 server at 185.220.101.42 exploiting CVE-2024-1234 hash: " + "a" * 64
    iocs = detect_iocs(text)
    types = [i["type"] for i in iocs]
    assert "ipv4" in types
    assert "cve" in types
    assert "sha256" in types


def test_leak_indicators():
    result = run_detection("selling database dump with fullz and credit card info")
    assert "leak" in result.detection_tags
    assert result.score > 0


def test_clean_text():
    result = run_detection("The weather is nice today")
    assert not result.is_relevant
    assert result.score == 0


def test_private_ip_ignored():
    iocs = detect_iocs("Server at 192.168.1.1 and 10.0.0.1")
    assert len(iocs) == 0  # private IPs should be skipped


if __name__ == "__main__":
    test_org_mention()
    test_credential_detection()
    test_ioc_detection()
    test_leak_indicators()
    test_clean_text()
    test_private_ip_ignored()
    print("✅ All detector tests passed")
