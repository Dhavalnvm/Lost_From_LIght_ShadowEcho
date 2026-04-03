"""Tests for core/slang_decoder.py"""
import sys
sys.path.insert(0, str(__import__("pathlib").Path(__file__).parent.parent))

from core.slang_decoder import decode_slang


def test_english_slang():
    text = "Selling fresh logs from redline stealer. Fullz available with SSN and DOB."
    result = decode_slang(text)
    assert result.has_coded_language
    assert "stolen_credentials" in result.threat_categories or "identity_theft" in result.threat_categories
    assert result.highest_severity in ("high", "critical")
    assert len(result.decoded_terms) >= 2


def test_carding_slang():
    text = "CC dump with CVV, BIN list included. Track1/Track2 data. $50 per card, escrow accepted."
    result = decode_slang(text)
    assert result.has_coded_language
    assert "carding" in result.threat_categories


def test_ransomware_slang():
    text = "New RaaS affiliate program. 80/20 split. Panel included. Double extortion supported."
    result = decode_slang(text)
    assert result.has_coded_language
    assert "ransomware" in result.threat_categories
    assert result.highest_severity == "critical"


def test_access_sale():
    text = "Initial access to Fortune 500 company. RDP access, domain admin. $10K BTC."
    result = decode_slang(text)
    assert result.has_coded_language
    assert "access_sale" in result.threat_categories


def test_russian_cyrillic():
    text = "Продаю стилер логи, свежие. Слив базы данных."
    result = decode_slang(text)
    assert result.has_coded_language
    assert "ru" in result.language_mix


def test_russian_transliterated():
    text = "selling sliv baza, fresh logi available"
    result = decode_slang(text)
    assert result.has_coded_language
    assert "ru" in result.language_mix


def test_chinese_slang():
    text = "社工库 data available, 拖库 complete, 10M records"
    result = decode_slang(text)
    assert result.has_coded_language
    assert "zh" in result.language_mix


def test_leetspeak():
    text = "FUD r@ns0m builder, bypass AV, cr3ds dump available"
    result = decode_slang(text)
    assert result.has_coded_language
    assert "leet" in result.language_mix


def test_mixed_languages():
    text = "Selling fresh logs, стилер data, 社工库 included. FUD crypter."
    result = decode_slang(text)
    assert result.has_coded_language
    assert len(result.language_mix) >= 2


def test_clean_text():
    text = "The weather is beautiful today and I went for a walk."
    result = decode_slang(text)
    assert not result.has_coded_language
    assert len(result.decoded_terms) == 0


def test_context_boosting():
    # "fresh logs" near "stealer" should have higher confidence than alone
    text1 = "fresh logs available"
    text2 = "fresh logs from redline stealer, raccoon included"
    result1 = decode_slang(text1)
    result2 = decode_slang(text2)
    if result1.decoded_terms and result2.decoded_terms:
        conf1 = result1.decoded_terms[0].confidence
        conf2 = result2.decoded_terms[0].confidence
        assert conf2 >= conf1  # context should boost confidence


def test_malware_slang():
    text = "Selling FUD RAT with keylogger. Crypter included for AV bypass. Botnet ready."
    result = decode_slang(text)
    assert result.has_coded_language
    assert "malware" in result.threat_categories


def test_social_engineering():
    text = "SIM swap service available. Can port any carrier. Bypass 2FA guaranteed."
    result = decode_slang(text)
    assert result.has_coded_language
    assert "social_engineering" in result.threat_categories
    assert result.highest_severity == "critical"


if __name__ == "__main__":
    test_english_slang()
    test_carding_slang()
    test_ransomware_slang()
    test_access_sale()
    test_russian_cyrillic()
    test_russian_transliterated()
    test_chinese_slang()
    test_leetspeak()
    test_mixed_languages()
    test_clean_text()
    test_context_boosting()
    test_malware_slang()
    test_social_engineering()
    print("✅ All slang decoder tests passed")