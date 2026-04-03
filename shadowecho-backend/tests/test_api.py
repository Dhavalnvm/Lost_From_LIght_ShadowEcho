"""Tests for API endpoints — requires running server or TestClient."""
import sys
sys.path.insert(0, str(__import__("pathlib").Path(__file__).parent.parent))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_root():
    resp = client.get("/")
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "ShadowEcho"


def test_health():
    resp = client.get("/health")
    assert resp.status_code == 200


def test_dashboard():
    resp = client.get("/api/dashboard")
    assert resp.status_code == 200
    data = resp.json()
    assert "stats" in data
    assert "recent_alerts" in data


def test_alerts():
    resp = client.get("/api/alerts")
    assert resp.status_code == 200
    data = resp.json()
    assert "alerts" in data


def test_alert_summary():
    resp = client.get("/api/alerts/summary")
    assert resp.status_code == 200


def test_feedback_stats():
    resp = client.get("/api/feedback/stats")
    assert resp.status_code == 200


def test_mirror():
    resp = client.post("/api/mirror", json={"org_name": "TestCorp"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["org_name"] == "TestCorp"


def test_lineup():
    resp = client.post("/api/lineup", json={"text": "ransomware attack"})
    assert resp.status_code == 200


if __name__ == "__main__":
    test_root()
    test_health()
    test_dashboard()
    test_alerts()
    test_alert_summary()
    test_feedback_stats()
    test_mirror()
    test_lineup()
    print("✅ All API tests passed")
