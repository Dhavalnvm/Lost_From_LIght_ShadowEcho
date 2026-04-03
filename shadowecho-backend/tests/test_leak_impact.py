"""Tests for modules/leak_impact.py"""
import sys
sys.path.insert(0, str(__import__("pathlib").Path(__file__).parent.parent))

from modules.leak_impact import (
    estimate_leak_impact, classify_data_types, extract_record_count,
    check_regulations, determine_scale, estimate_financial_impact,
)


def test_massive_pii_breach():
    text = """Selling 2.5 million customer records from MegaCorp.
    Includes full names, SSN, date of birth, addresses, and phone numbers.
    EU and US customers. Database dump: 15GB."""
    impact = estimate_leak_impact(text)
    assert impact.overall_severity in ("high", "critical")
    assert impact.estimated_records["estimated_count"] > 0
    assert len(impact.data_types_exposed) > 0
    assert impact.business_risk_score > 5
    assert len(impact.applicable_regulations) > 0  # GDPR + CCPA at minimum


def test_financial_data_leak():
    text = """50K credit card numbers with CVV and expiry.
    Visa and Mastercard. BIN list from major US bank.
    Fresh dump, all active cards."""
    impact = estimate_leak_impact(text)
    dtype_types = [d["type"] for d in impact.data_types_exposed]
    assert "financial" in dtype_types
    assert any(r["regulation"] == "PCI_DSS" for r in impact.applicable_regulations)


def test_medical_data_breach():
    text = """Hospital patient records leaked: 100K entries.
    Includes diagnosis, prescriptions, insurance IDs, and SSN.
    Source: compromised EHR system. HIPAA violation."""
    impact = estimate_leak_impact(text)
    dtype_types = [d["type"] for d in impact.data_types_exposed]
    assert "medical" in dtype_types
    assert any(r["regulation"] == "HIPAA" for r in impact.applicable_regulations)
    assert impact.overall_severity in ("high", "critical")


def test_source_code_leak():
    text = """50GB source code leak from tech company.
    Includes internal API source, backend code, infrastructure configs,
    and SSH keys. Git repository from internal GitLab."""
    impact = estimate_leak_impact(text)
    dtype_types = [d["type"] for d in impact.data_types_exposed]
    assert "source_code" in dtype_types or "infrastructure" in dtype_types


def test_credential_dump():
    text = """Combo list: 1.5 million email:password pairs.
    Mostly from corporate domains. Hashes cracked, plaintext available.
    Username, password, login URL included."""
    impact = estimate_leak_impact(text)
    dtype_types = [d["type"] for d in impact.data_types_exposed]
    assert "credentials" in dtype_types
    assert impact.estimated_records["estimated_count"] > 0


def test_record_count_extraction():
    # Explicit millions
    r1 = extract_record_count("database contains 2.5 million records")
    assert r1["estimated_count"] == 2_500_000

    # K notation
    r2 = extract_record_count("500K user accounts leaked")
    assert r2["estimated_count"] == 500_000

    # Plain numbers
    r3 = extract_record_count("leaked 15000 email records")
    assert r3["estimated_count"] == 15_000


def test_scale_categories():
    assert determine_scale(500) == "minor"
    assert determine_scale(50_000) == "moderate"
    assert determine_scale(500_000) == "major"
    assert determine_scale(5_000_000) == "massive"
    assert determine_scale(500_000_000) == "catastrophic"


def test_regulatory_detection_gdpr():
    regs = check_regulations("EU customer data breach in German company", ["pii"])
    reg_names = [r["regulation"] for r in regs]
    assert "GDPR" in reg_names


def test_regulatory_detection_hipaa():
    regs = check_regulations("US hospital patient medical records", ["medical"])
    reg_names = [r["regulation"] for r in regs]
    assert "HIPAA" in reg_names


def test_regulatory_detection_india():
    regs = check_regulations("Indian customer Aadhaar data leaked from Mumbai", ["pii"])
    reg_names = [r["regulation"] for r in regs]
    assert "DPDPA" in reg_names


def test_financial_estimation():
    # 1M records of financial data
    data_types = [{"type": "financial", "per_record_cost_usd": 350, "severity_weight": 0.9}]
    result = estimate_financial_impact(1_000_000, data_types)
    assert result["low_estimate_usd"] > 0
    assert result["high_estimate_usd"] > result["low_estimate_usd"]


def test_clean_text():
    text = "The weather is nice today. Let's go for a walk."
    impact = estimate_leak_impact(text)
    assert impact.overall_severity == "low"
    assert impact.business_risk_score < 3
    assert len(impact.data_types_exposed) == 0


def test_recommendations_generated():
    text = "2 million credit card records with CVV. EU customers. HIPAA medical data included."
    impact = estimate_leak_impact(text)
    assert len(impact.recommended_actions) > 0


if __name__ == "__main__":
    test_massive_pii_breach()
    test_financial_data_leak()
    test_medical_data_breach()
    test_source_code_leak()
    test_credential_dump()
    test_record_count_extraction()
    test_scale_categories()
    test_regulatory_detection_gdpr()
    test_regulatory_detection_hipaa()
    test_regulatory_detection_india()
    test_financial_estimation()
    test_clean_text()
    test_recommendations_generated()
    print("✅ All leak impact tests passed")