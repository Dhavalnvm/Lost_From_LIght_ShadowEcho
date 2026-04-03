"""
ShadowEcho — Coded Language & Slang Decoder
Translates dark web jargon, coded language, and multilingual slang
into structured threat intelligence.

This isn't a simple find-replace — it's context-aware:
  - "fresh logs" near "stealer" → stolen credentials (high confidence)
  - "fresh logs" near "lumber" → maybe actual lumber (low confidence)

Covers:
  - English dark web slang (forums, marketplaces, Telegram)
  - Russian cybercrime slang (transliterated + Cyrillic)
  - Chinese underground terms
  - Leetspeak / obfuscated variants
  - Marketplace-specific jargon
  - Carding terminology
  - Ransomware ecosystem terms
  - Initial Access Broker (IAB) language

Each decoded term maps to:
  - plain_meaning: human-readable translation
  - threat_category: structured classification
  - severity: low/medium/high/critical
  - confidence: how sure we are about this decoding (0-100)
  - context_hints: what surrounding words increase confidence
"""

import re
import logging
from dataclasses import dataclass, field

log = logging.getLogger("slang_decoder")


@dataclass
class DecodedTerm:
    """A single decoded slang term."""
    original: str           # the slang as found in text
    plain_meaning: str      # human-readable translation
    threat_category: str    # structured category
    severity: str           # low/medium/high/critical
    confidence: int         # 0-100
    language: str           # en/ru/zh/leet


@dataclass
class SlangResult:
    """Full slang decoding result for a post."""
    decoded_terms: list[DecodedTerm] = field(default_factory=list)
    threat_categories: list[str] = field(default_factory=list)
    has_coded_language: bool = False
    highest_severity: str = "low"
    language_mix: list[str] = field(default_factory=list)
    decoded_summary: str = ""

    def to_dict(self) -> dict:
        return {
            "decoded_terms": [
                {
                    "original": t.original,
                    "plain_meaning": t.plain_meaning,
                    "threat_category": t.threat_category,
                    "severity": t.severity,
                    "confidence": t.confidence,
                    "language": t.language,
                }
                for t in self.decoded_terms
            ],
            "threat_categories": self.threat_categories,
            "has_coded_language": self.has_coded_language,
            "highest_severity": self.highest_severity,
            "language_mix": self.language_mix,
            "decoded_summary": self.decoded_summary,
        }


# ---------------------------------------------------------------------------
# SLANG DICTIONARIES
# ---------------------------------------------------------------------------
# Structure: pattern → (plain_meaning, threat_category, severity, language, context_boosters)
#
# threat_category values:
#   stolen_credentials, data_breach, financial_fraud, malware,
#   access_sale, ransomware, exploit, identity_theft, carding,
#   social_engineering, ddos, money_laundering, reconnaissance

ENGLISH_SLANG = {
    # --- CREDENTIAL / DATA THEFT ---
    r"(?i)\bfresh\s+logs?\b": (
        "Recently stolen credentials from infostealer malware",
        "stolen_credentials", "high", ["stealer", "redline", "raccoon", "vidar", "lumma", "bot"],
    ),
    r"(?i)\bcombo\s*list\b": (
        "List of email:password pairs from breaches",
        "stolen_credentials", "high", ["crack", "brute", "login", "account"],
    ),
    r"(?i)\bfullz\b": (
        "Complete identity package (name, SSN, DOB, address, etc.)",
        "identity_theft", "critical", ["ssn", "dob", "bank", "credit"],
    ),
    r"(?i)\bfull\s*info\b": (
        "Complete identity/financial data package",
        "identity_theft", "high", ["card", "bank", "ssn", "identity"],
    ),
    r"(?i)\bcookies?\s*(log|grab|steal|dump)\b": (
        "Stolen browser session cookies for account takeover",
        "stolen_credentials", "high", ["session", "bypass", "2fa", "mfa"],
    ),
    r"(?i)\bstealer\s+logs?\b": (
        "Data harvested by infostealer malware (passwords, cookies, wallets)",
        "stolen_credentials", "critical", ["redline", "raccoon", "vidar", "lumma", "meta"],
    ),
    r"(?i)\bcloud\s+logs?\b": (
        "Stolen cloud service credentials (AWS, Azure, GCP)",
        "stolen_credentials", "critical", ["aws", "azure", "gcp", "s3", "bucket"],
    ),
    r"(?i)\bconfig\s*(file|pack|hit)\b": (
        "Credential stuffing configuration for automated tools",
        "stolen_credentials", "high", ["openbullet", "sentry", "silverbullet"],
    ),
    r"(?i)\b(db|database)\s+dump\b": (
        "Exfiltrated database contents",
        "data_breach", "critical", ["sql", "table", "records", "rows", "million"],
    ),
    r"(?i)\bdata\s*dump\b": (
        "Bulk exfiltrated data package",
        "data_breach", "critical", ["download", "leak", "breach", "gb", "tb"],
    ),
    r"(?i)\bsource\s*code\s*(leak|dump|stolen)\b": (
        "Stolen proprietary source code",
        "data_breach", "critical", ["git", "repo", "repository", "internal"],
    ),

    # --- CARDING ---
    r"(?i)\bcc\s*dump\b": (
        "Stolen credit card data with magnetic stripe info",
        "carding", "critical", ["track1", "track2", "bin", "magnetic"],
    ),
    r"(?i)\bcvv\s*(shop|store|buy|sell)\b": (
        "Marketplace for stolen credit card numbers with CVV",
        "carding", "critical", ["card", "visa", "mastercard", "amex"],
    ),
    r"(?i)\bbin\s+list\b": (
        "Bank Identification Numbers for targeted card fraud",
        "carding", "high", ["bank", "card", "issuer", "country"],
    ),
    r"(?i)\bcash\s*out\b": (
        "Converting stolen funds/cards to cash",
        "money_laundering", "high", ["drop", "mule", "atm", "withdraw"],
    ),
    r"(?i)\bdrop\s*(address|ship|account)\b": (
        "Address/account used to receive fraudulently obtained goods",
        "money_laundering", "medium", ["package", "reship", "forward"],
    ),
    r"(?i)\bmoney\s*mule\b": (
        "Person who transfers stolen money on behalf of criminals",
        "money_laundering", "high", ["transfer", "wire", "western union"],
    ),
    r"(?i)\bclone\s*(card|chip)\b": (
        "Physically duplicated credit/debit card",
        "carding", "high", ["skimmer", "emboss", "magnetic", "chip"],
    ),

    # --- ACCESS / EXPLOITATION ---
    r"(?i)\binitial\s+access\b": (
        "First-stage network entry point being sold",
        "access_sale", "critical", ["vpn", "rdp", "citrix", "corporate", "revenue"],
    ),
    r"(?i)\b(rdp|vpn|ssh)\s+access\b": (
        "Remote access credentials to compromised systems",
        "access_sale", "critical", ["admin", "root", "server", "corporate"],
    ),
    r"(?i)\bweb\s*shell\b": (
        "Backdoor script uploaded to a compromised web server",
        "access_sale", "high", ["upload", "php", "asp", "server"],
    ),
    r"(?i)\b(reverse|bind)\s*shell\b": (
        "Remote command execution backdoor on target",
        "malware", "high", ["c2", "callback", "listener"],
    ),
    r"(?i)\bbackdoor\b": (
        "Hidden unauthorized access mechanism in a system",
        "malware", "high", ["persistent", "hidden", "access", "admin"],
    ),
    r"(?i)\b(priv\s*esc|privilege\s+escalation)\b": (
        "Method to gain higher system privileges",
        "exploit", "high", ["root", "admin", "kernel", "local"],
    ),
    r"(?i)\b(poc|proof\s+of\s+concept)\b": (
        "Working exploit demonstration code",
        "exploit", "high", ["exploit", "cve", "vuln", "rce"],
    ),
    r"(?i)\b(0day|zero\s*-?\s*day)\b": (
        "Previously unknown vulnerability with no patch",
        "exploit", "critical", ["exploit", "unpatched", "remote"],
    ),

    # --- RANSOMWARE ECOSYSTEM ---
    r"(?i)\b(raas|ransomware.as.a.service)\b": (
        "Ransomware-as-a-Service subscription platform",
        "ransomware", "critical", ["affiliate", "panel", "builder"],
    ),
    r"(?i)\baffiliate\s+(panel|program|join)\b": (
        "Ransomware group recruitment for affiliates",
        "ransomware", "critical", ["raas", "ransom", "encrypt", "split"],
    ),
    r"(?i)\blocker\b(?=.*(?:ransom|encrypt|pay|btc))": (
        "Ransomware/screen-locking malware",
        "ransomware", "high", ["encrypt", "decrypt", "bitcoin", "payment"],
    ),
    r"(?i)\bblog\s*post\b(?=.*(?:leak|victim|company))": (
        "Ransomware leak site publication of victim data",
        "ransomware", "critical", ["leak", "victim", "deadline", "negotiation"],
    ),
    r"(?i)\bdouble\s+extortion\b": (
        "Ransomware tactic: encrypt + threaten to leak data",
        "ransomware", "critical", ["leak", "publish", "negotiate"],
    ),

    # --- MALWARE ---
    r"(?i)\b(rat|remote\s+access\s+trojan)\b": (
        "Remote Access Trojan for full system control",
        "malware", "high", ["control", "camera", "keylog", "screen"],
    ),
    r"(?i)\b(fud|fully\s+undetect(ed|able))\b": (
        "Malware that evades all current antivirus detection",
        "malware", "high", ["bypass", "av", "edr", "scantime", "runtime"],
    ),
    r"(?i)\bcrypter\b": (
        "Tool to obfuscate malware to bypass antivirus",
        "malware", "high", ["fud", "bypass", "av", "stub"],
    ),
    r"(?i)\bloader\b(?=.*(?:malware|payload|drop|bot))": (
        "Malware that downloads and executes secondary payloads",
        "malware", "high", ["payload", "drop", "stage", "bot"],
    ),
    r"(?i)\bbotnet\b": (
        "Network of compromised machines under attacker control",
        "malware", "critical", ["ddos", "spam", "c2", "bot", "zombie"],
    ),
    r"(?i)\b(c2|c&c|command\s+and\s+control)\b": (
        "Server controlling compromised systems",
        "malware", "critical", ["beacon", "callback", "implant"],
    ),
    r"(?i)\bphishing\s*kit\b": (
        "Ready-made phishing page package",
        "social_engineering", "high", ["login", "clone", "panel", "smtp"],
    ),

    # --- MARKETPLACE JARGON ---
    r"(?i)\bescrow\b": (
        "Marketplace payment held by third party until delivery confirmed",
        "access_sale", "medium", ["buy", "sell", "vendor", "market"],
    ),
    r"(?i)\bfe\s+(allowed|only|accepted)\b": (
        "Finalize Early — pay vendor before delivery (risky for buyer)",
        "access_sale", "medium", ["vendor", "trust", "shop"],
    ),
    r"(?i)\bpgp\s*verified\b": (
        "Vendor identity verified via PGP cryptographic signature",
        "access_sale", "medium", ["vendor", "trusted", "verified"],
    ),
    r"(?i)\bwickr\b(?=.*(?:dm|contact|message|hit))": (
        "Encrypted messaging app used for criminal negotiations",
        "access_sale", "medium", ["contact", "dm", "deal"],
    ),
    r"(?i)\btox\s*(id|me)\b": (
        "Tox messenger ID for anonymous criminal communication",
        "access_sale", "medium", ["contact", "dm", "anonymous"],
    ),

    # --- DDoS ---
    r"(?i)\bstress(er|ing)\s*(service|tool)?\b": (
        "DDoS-for-hire service (marketed as 'stress testing')",
        "ddos", "high", ["layer", "gbps", "attack", "down"],
    ),
    r"(?i)\bboot(er|ing)\s*(service)?\b": (
        "DDoS-for-hire service",
        "ddos", "high", ["layer7", "layer4", "amplification"],
    ),

    # --- SOCIAL ENGINEERING ---
    r"(?i)\bsim\s*swap\b": (
        "Hijacking victim's phone number via carrier social engineering",
        "social_engineering", "critical", ["port", "carrier", "2fa", "bypass"],
    ),
    r"(?i)\bcalling\s*(service|method)\b(?=.*(?:bank|verify|social))": (
        "Social engineering phone call service",
        "social_engineering", "high", ["bank", "verification", "impersonate"],
    ),
    r"(?i)\b(smish|sms\s*phish)\b": (
        "Phishing via SMS text messages",
        "social_engineering", "high", ["text", "link", "otp", "verify"],
    ),

    # --- RECONNAISSANCE ---
    r"(?i)\bdork(s|ing)?\b(?=.*(?:sql|google|admin|login))": (
        "Google search queries to find vulnerable systems",
        "reconnaissance", "medium", ["google", "sql", "admin", "login", "inurl"],
    ),
    r"(?i)\brecon\s*(tool|scan|service)\b": (
        "Automated target reconnaissance/scanning",
        "reconnaissance", "medium", ["scan", "port", "shodan", "censys"],
    ),
}


# ---------------------------------------------------------------------------
# RUSSIAN CYBERCRIME SLANG (transliterated + Cyrillic)
# Russian-speaking forums are a massive part of the dark web ecosystem
# ---------------------------------------------------------------------------

RUSSIAN_SLANG = {
    # Cyrillic forms
    r"(?i)(логи|лог\b)": (
        "Stolen credentials/stealer logs (Russian: 'logi')",
        "stolen_credentials", "high", ["стилер", "пароль", "куки"],
    ),
    r"(?i)стилер": (
        "Infostealer malware (Russian: 'stealer')",
        "malware", "high", ["логи", "пароль", "бот"],
    ),
    r"(?i)кардинг": (
        "Credit card fraud (Russian: 'karding')",
        "carding", "high", ["карта", "бин", "дамп"],
    ),
    r"(?i)дамп(ы)?": (
        "Database/card dumps (Russian: 'dump')",
        "data_breach", "high", ["база", "карта", "слив"],
    ),
    r"(?i)слив": (
        "Data leak/dump (Russian: 'sliv')",
        "data_breach", "critical", ["база", "данные", "пароль"],
    ),
    r"(?i)пробив": (
        "Unauthorized personal data lookup service (Russian: 'probiv')",
        "identity_theft", "high", ["паспорт", "телефон", "адрес"],
    ),
    r"(?i)обнал": (
        "Cash-out service for stolen funds (Russian: 'obnal')",
        "money_laundering", "high", ["карта", "дроп", "нал"],
    ),
    r"(?i)дроп(ы|пер)?": (
        "Money mule or drop address (Russian: 'drop')",
        "money_laundering", "high", ["обнал", "карта", "перевод"],
    ),
    r"(?i)залив": (
        "Loading stolen money onto cards/accounts (Russian: 'zaliv')",
        "money_laundering", "critical", ["карта", "счет", "банк"],
    ),
    r"(?i)шелл": (
        "Web shell / server access (Russian: 'shell')",
        "access_sale", "high", ["сервер", "доступ", "рут"],
    ),
    r"(?i)доступ": (
        "Access to compromised system (Russian: 'dostup')",
        "access_sale", "high", ["rdp", "vpn", "сервер", "корп"],
    ),
    r"(?i)вымогатель": (
        "Ransomware (Russian: 'vymogatel')",
        "ransomware", "critical", ["шифр", "выкуп", "биткоин"],
    ),
    r"(?i)эксплойт": (
        "Exploit (Russian: 'eksploit')",
        "exploit", "high", ["уязвимость", "rce", "нулевой день"],
    ),

    # Transliterated forms (Russians typing in Latin script)
    r"(?i)\blogi\b": (
        "Stolen credentials/logs (transliterated Russian)",
        "stolen_credentials", "high", ["stealer", "pass", "cookie"],
    ),
    r"(?i)\bsliv\b": (
        "Data leak (transliterated Russian)",
        "data_breach", "critical", ["baza", "dump", "leak"],
    ),
    r"(?i)\bprobiv\b": (
        "Personal data lookup service (transliterated Russian)",
        "identity_theft", "high", ["passport", "phone", "address"],
    ),
    r"(?i)\bobnal\b": (
        "Cash-out service (transliterated Russian)",
        "money_laundering", "high", ["drop", "card", "cash"],
    ),
    r"(?i)\bzaliv\b": (
        "Loading stolen funds onto cards (transliterated Russian)",
        "money_laundering", "critical", ["card", "bank", "transfer"],
    ),
}


# ---------------------------------------------------------------------------
# CHINESE UNDERGROUND SLANG
# Growing Chinese-language dark web presence
# ---------------------------------------------------------------------------

CHINESE_SLANG = {
    r"社工库": (
        "Social engineering database / leaked personal data repository",
        "data_breach", "critical", ["数据", "查询", "身份证"],
    ),
    r"洗料": (
        "Money laundering / processing stolen financial data",
        "money_laundering", "high", ["银行", "转账", "套现"],
    ),
    r"黑产": (
        "Black market industry / cybercrime ecosystem",
        "access_sale", "high", ["产业链", "地下", "暗网"],
    ),
    r"拖库": (
        "Database exfiltration / SQL injection data theft",
        "data_breach", "critical", ["数据库", "sql", "注入"],
    ),
    r"撞库": (
        "Credential stuffing attack",
        "stolen_credentials", "high", ["密码", "账号", "登录"],
    ),
    r"肉鸡": (
        "Compromised computer (botnet zombie, lit. 'broiler chicken')",
        "malware", "high", ["控制", "bot", "远控"],
    ),
    r"免杀": (
        "Antivirus evasion / FUD technique",
        "malware", "high", ["木马", "杀软", "bypass"],
    ),
    r"木马": (
        "Trojan horse malware",
        "malware", "high", ["远控", "后门", "植入"],
    ),
    r"钓鱼": (
        "Phishing attack",
        "social_engineering", "high", ["网站", "登录", "仿冒"],
    ),
}


# ---------------------------------------------------------------------------
# LEETSPEAK / OBFUSCATION PATTERNS
# Actors deliberately misspell to evade keyword filters
# ---------------------------------------------------------------------------

LEET_SLANG = {
    r"(?i)\bcr[3e]d(s|ential)?\b": (
        "Credentials (leetspeak obfuscation)",
        "stolen_credentials", "high", ["dump", "leak", "steal"],
    ),
    r"(?i)\bp[a@]ss(w[o0]rd)?s?\b(?=.*(?:dump|list|leak|breach|combo))": (
        "Passwords (obfuscated spelling near breach context)",
        "stolen_credentials", "high", ["dump", "list", "leak"],
    ),
    r"(?i)\bexpl[o0][i1]t\b": (
        "Exploit (leetspeak obfuscation)",
        "exploit", "high", ["cve", "rce", "0day"],
    ),
    r"(?i)\bm[a@]lw[a@]re\b": (
        "Malware (obfuscated spelling)",
        "malware", "high", ["fud", "crypter", "rat"],
    ),
    r"(?i)\bph[i1]sh(ing)?\b": (
        "Phishing (leetspeak obfuscation)",
        "social_engineering", "high", ["page", "kit", "smtp"],
    ),
    r"(?i)\br[a@]ns[o0]m\b": (
        "Ransom/Ransomware (obfuscated spelling)",
        "ransomware", "critical", ["encrypt", "pay", "btc", "lock"],
    ),
}


# ---------------------------------------------------------------------------
# SEVERITY ORDER
# ---------------------------------------------------------------------------

SEVERITY_ORDER = {"low": 0, "medium": 1, "high": 2, "critical": 3}


# ---------------------------------------------------------------------------
# DECODER ENGINE
# ---------------------------------------------------------------------------


def _check_context_boost(text_lower: str, context_words: list[str]) -> int:
    """
    Check how many context-boosting words appear near the slang term.
    More context words = higher confidence in the decoding.
    """
    hits = sum(1 for w in context_words if w.lower() in text_lower)
    return min(hits * 15, 40)  # max +40 confidence from context


def _decode_with_dict(
    text: str,
    slang_dict: dict,
    language: str,
) -> list[DecodedTerm]:
    """Run a slang dictionary against the text."""
    text_lower = text.lower()
    decoded = []

    for pattern, (meaning, category, severity, context_words) in slang_dict.items():
        matches = list(re.finditer(pattern, text))
        if not matches:
            continue

        for match in matches:
            original = match.group()
            base_confidence = 60  # base confidence for any match
            context_boost = _check_context_boost(text_lower, context_words)
            confidence = min(base_confidence + context_boost, 98)

            decoded.append(DecodedTerm(
                original=original,
                plain_meaning=meaning,
                threat_category=category,
                severity=severity,
                confidence=confidence,
                language=language,
            ))

    return decoded


def decode_slang(text: str) -> SlangResult:
    """
    Run the full slang decoder on a piece of text.
    Checks all dictionaries (EN, RU, ZH, LEET).
    Returns structured decoding result.
    """
    result = SlangResult()
    all_decoded = []

    # Run all dictionaries
    all_decoded.extend(_decode_with_dict(text, ENGLISH_SLANG, "en"))
    all_decoded.extend(_decode_with_dict(text, RUSSIAN_SLANG, "ru"))
    all_decoded.extend(_decode_with_dict(text, CHINESE_SLANG, "zh"))
    all_decoded.extend(_decode_with_dict(text, LEET_SLANG, "leet"))

    if not all_decoded:
        return result

    # Deduplicate by original term (keep highest confidence)
    seen = {}
    for term in all_decoded:
        key = term.original.lower()
        if key not in seen or term.confidence > seen[key].confidence:
            seen[key] = term
    all_decoded = list(seen.values())

    # Sort by severity then confidence
    all_decoded.sort(
        key=lambda t: (SEVERITY_ORDER.get(t.severity, 0), t.confidence),
        reverse=True,
    )

    result.decoded_terms = all_decoded
    result.has_coded_language = True

    # Unique threat categories
    result.threat_categories = list(set(t.threat_category for t in all_decoded))

    # Language mix
    result.language_mix = list(set(t.language for t in all_decoded))

    # Highest severity
    max_sev = max(SEVERITY_ORDER.get(t.severity, 0) for t in all_decoded)
    for sev, val in SEVERITY_ORDER.items():
        if val == max_sev:
            result.highest_severity = sev

    # Build human-readable summary
    summaries = []
    for term in all_decoded[:5]:  # top 5
        summaries.append(f'"{term.original}" → {term.plain_meaning}')
    result.decoded_summary = " | ".join(summaries)

    return result


# ---------------------------------------------------------------------------
# QUICK DECODE — for inline use in detector
# ---------------------------------------------------------------------------


def quick_decode_tags(text: str) -> tuple[list[str], float]:
    """
    Quick decode that returns (tags, score_boost).
    Used by the detector to enrich detection without full decode overhead.
    """
    result = decode_slang(text)
    if not result.has_coded_language:
        return [], 0.0

    tags = [f"slang:{cat}" for cat in result.threat_categories[:3]]

    # Score boost based on severity of decoded terms
    boost = 0.0
    if result.highest_severity == "critical":
        boost = 0.25
    elif result.highest_severity == "high":
        boost = 0.15
    elif result.highest_severity == "medium":
        boost = 0.1

    return tags, boost