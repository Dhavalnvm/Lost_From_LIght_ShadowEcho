"""
ShadowEcho — Slang Decoder Route
/api/decode — standalone coded language decoder.
Perfect for judge demos: type dark web slang, see it decoded in real-time.
"""

import logging
from fastapi import APIRouter
from pydantic import BaseModel, Field
from core.slang_decoder import decode_slang

log = logging.getLogger("api.decode")
router = APIRouter(prefix="/api/decode", tags=["slang_decoder"])


class DecodeRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Text containing dark web slang")


class DecodeResponse(BaseModel):
    has_coded_language: bool
    decoded_terms: list[dict]
    threat_categories: list[str]
    highest_severity: str
    language_mix: list[str]
    decoded_summary: str
    term_count: int


@router.post("", response_model=DecodeResponse)
async def decode_text(req: DecodeRequest):
    """
    Decode dark web slang and coded language.
    Supports: English, Russian (Cyrillic + transliterated), Chinese, Leetspeak.

    Example inputs:
      - "selling fresh logs from redline stealer, fullz available"
      - "слив базы данных, стилер логи"
      - "FUD crypter, bypass AV, r@ns0m builder"
      - "社工库 data for sale, 拖库 complete"
    """
    result = decode_slang(req.text)
    data = result.to_dict()

    return DecodeResponse(
        has_coded_language=data["has_coded_language"],
        decoded_terms=data["decoded_terms"],
        threat_categories=data["threat_categories"],
        highest_severity=data["highest_severity"],
        language_mix=data["language_mix"],
        decoded_summary=data["decoded_summary"],
        term_count=len(data["decoded_terms"]),
    )


@router.get("/dictionary")
async def get_dictionary():
    """
    Returns the full slang dictionary — categories and coverage stats.
    Shows judges the breadth of coded language support.
    """
    from core.slang_decoder import ENGLISH_SLANG, RUSSIAN_SLANG, CHINESE_SLANG, LEET_SLANG

    return {
        "coverage": {
            "english_terms": len(ENGLISH_SLANG),
            "russian_terms": len(RUSSIAN_SLANG),
            "chinese_terms": len(CHINESE_SLANG),
            "leetspeak_terms": len(LEET_SLANG),
            "total_patterns": (
                len(ENGLISH_SLANG) + len(RUSSIAN_SLANG)
                + len(CHINESE_SLANG) + len(LEET_SLANG)
            ),
        },
        "threat_categories": [
            "stolen_credentials", "data_breach", "financial_fraud",
            "malware", "access_sale", "ransomware", "exploit",
            "identity_theft", "carding", "social_engineering",
            "ddos", "money_laundering", "reconnaissance",
        ],
        "languages": ["English", "Russian (Cyrillic + Latin)", "Chinese", "Leetspeak/Obfuscated"],
        "examples": [
            {"input": "fresh logs from stealer", "decoded": "Recently stolen credentials from infostealer malware"},
            {"input": "fullz with SSN and DOB", "decoded": "Complete identity package (name, SSN, DOB, address)"},
            {"input": "RDP access to Fortune 500", "decoded": "Remote access credentials to compromised systems"},
            {"input": "слив базы", "decoded": "Data leak/dump (Russian)"},
            {"input": "社工库", "decoded": "Social engineering database / leaked personal data repository"},
            {"input": "FUD crypter", "decoded": "Tool to obfuscate malware to bypass antivirus"},
        ],
    }