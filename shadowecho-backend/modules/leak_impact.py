"""
ShadowEcho — Leak Impact Estimation Engine (Module F)
Estimates the real-world impact of detected data leaks/breaches.

Extracts from post text:
  1. Record count estimation (from explicit numbers or contextual clues)
  2. Data type classification (PII, financial, credentials, medical, source code, etc.)
  3. Regulatory implications (GDPR, HIPAA, PCI-DSS, CCPA, SOX)
  4. Business risk scoring (reputational, legal, financial, operational)
  5. Affected population estimate
  6. Financial impact range (based on per-record breach cost data)

This runs AFTER detection and can use both raw text and LLM output.
"""

import re
import logging
from dataclasses import dataclass, field

log = logging.getLogger("leak_impact")


# ---------------------------------------------------------------------------
# DATA TYPES — what kind of data was leaked?
# ---------------------------------------------------------------------------

DATA_TYPES = {
    "pii": {
        "label": "Personally Identifiable Information",
        "patterns": [
            r"(?i)\b(name|address|phone|email|dob|date of birth|ssn|social security)\b",
            r"(?i)\b(national id|passport|driver.?s?\s+licen[sc]e|id card)\b",
            r"(?i)\b(full\s*name|first\s*name|last\s*name|zip\s*code|postal)\b",
        ],
        "keywords": ["personal", "identity", "user data", "customer data", "employee data"],
        "severity_weight": 0.7,
        "per_record_cost_usd": 180,  # based on IBM/Ponemon breach cost data
    },
    "financial": {
        "label": "Financial Data",
        "patterns": [
            r"(?i)\b(credit\s*card|debit\s*card|card\s*number|cvv|ccv)\b",
            r"(?i)\b(bank\s*account|routing\s*number|iban|swift|aba)\b",
            r"(?i)\b(paypal|venmo|crypto\s*wallet|bitcoin\s*address)\b",
            r"(?i)\b(tax\s*return|w-?2|1099|salary|compensation)\b",
        ],
        "keywords": ["financial", "payment", "billing", "transaction", "account number"],
        "severity_weight": 0.9,
        "per_record_cost_usd": 350,
    },
    "credentials": {
        "label": "Login Credentials",
        "patterns": [
            r"(?i)\b(username|password|passwd|login|credential)\b",
            r"(?i)\b(api[_\s]?key|token|secret|bearer)\b",
            r"(?i)\b(hash|bcrypt|sha256|md5|salt)\b",
        ],
        "keywords": ["password", "login", "auth", "combo", "credential"],
        "severity_weight": 0.6,
        "per_record_cost_usd": 120,
    },
    "medical": {
        "label": "Protected Health Information (PHI)",
        "patterns": [
            r"(?i)\b(medical|health|patient|diagnosis|prescription)\b",
            r"(?i)\b(hipaa|phi|ehr|emr|health\s*record)\b",
            r"(?i)\b(insurance|medicare|medicaid|hospital|clinic)\b",
            r"(?i)\b(blood\s*type|allergy|condition|treatment)\b",
        ],
        "keywords": ["medical", "health", "patient", "hospital", "clinical"],
        "severity_weight": 0.95,
        "per_record_cost_usd": 450,  # highest per-record cost
    },
    "source_code": {
        "label": "Proprietary Source Code",
        "patterns": [
            r"(?i)\b(source\s*code|repo(sitory)?|git(hub|lab)?)\b",
            r"(?i)\b(internal\s*code|proprietary|codebase)\b",
            r"(?i)\b(api\s*source|backend|firmware|sdk)\b",
        ],
        "keywords": ["source code", "repository", "git", "internal code", "proprietary"],
        "severity_weight": 0.8,
        "per_record_cost_usd": 0,  # measured differently
    },
    "corporate_internal": {
        "label": "Corporate Internal Documents",
        "patterns": [
            r"(?i)\b(internal\s*(doc|memo|email|report|meeting))\b",
            r"(?i)\b(confidential|classified|proprietary|trade\s*secret)\b",
            r"(?i)\b(board\s*minutes|strategy|roadmap|m&a|acquisition)\b",
        ],
        "keywords": ["internal", "confidential", "corporate", "business", "strategy"],
        "severity_weight": 0.75,
        "per_record_cost_usd": 0,
    },
    "infrastructure": {
        "label": "IT Infrastructure Details",
        "patterns": [
            r"(?i)\b(network\s*(map|diagram|topology)|subnet|vlan)\b",
            r"(?i)\b(active\s*directory|ldap|domain\s*controller)\b",
            r"(?i)\b(firewall\s*rule|acl|vpn\s*config|ssh\s*key)\b",
        ],
        "keywords": ["network", "infrastructure", "server", "config", "topology"],
        "severity_weight": 0.85,
        "per_record_cost_usd": 0,
    },
}


# ---------------------------------------------------------------------------
# REGULATORY FRAMEWORKS
# ---------------------------------------------------------------------------

REGULATIONS = {
    "GDPR": {
        "description": "EU General Data Protection Regulation",
        "triggers": ["pii", "credentials"],
        "geo_triggers": [
            r"(?i)\b(eu|europe|gdpr|german|french|italian|spanish|dutch|polish)\b",
            r"(?i)\b(uk|british|london|berlin|paris|amsterdam)\b",
        ],
        "max_fine": "€20M or 4% of global annual revenue",
        "notification_deadline": "72 hours",
    },
    "HIPAA": {
        "description": "US Health Insurance Portability and Accountability Act",
        "triggers": ["medical"],
        "geo_triggers": [
            r"(?i)\b(us|usa|united states|american|hipaa)\b",
            r"(?i)\b(hospital|clinic|healthcare|patient)\b",
        ],
        "max_fine": "$1.5M per violation category per year",
        "notification_deadline": "60 days",
    },
    "PCI_DSS": {
        "description": "Payment Card Industry Data Security Standard",
        "triggers": ["financial"],
        "geo_triggers": [
            r"(?i)\b(pci|card|payment|visa|mastercard|amex|merchant)\b",
        ],
        "max_fine": "$100K/month until compliant",
        "notification_deadline": "Immediately upon discovery",
    },
    "CCPA": {
        "description": "California Consumer Privacy Act",
        "triggers": ["pii", "credentials"],
        "geo_triggers": [
            r"(?i)\b(california|ccpa|cpra|ca\s+resident)\b",
        ],
        "max_fine": "$7,500 per intentional violation",
        "notification_deadline": "Expeditiously",
    },
    "SOX": {
        "description": "Sarbanes-Oxley Act",
        "triggers": ["corporate_internal", "financial"],
        "geo_triggers": [
            r"(?i)\b(public\s*company|sec\s*filing|sox|financial\s*report)\b",
            r"(?i)\b(audit|annual\s*report|10-k|quarterly)\b",
        ],
        "max_fine": "$5M fine and/or 20 years imprisonment",
        "notification_deadline": "Material event disclosure rules",
    },
    "DPDPA": {
        "description": "India Digital Personal Data Protection Act",
        "triggers": ["pii", "credentials"],
        "geo_triggers": [
            r"(?i)\b(india|indian|aadhaar|pan\s*card|dpdpa)\b",
            r"(?i)\b(mumbai|delhi|bangalore|hyderabad|chennai)\b",
        ],
        "max_fine": "₹250 crore (~$30M USD)",
        "notification_deadline": "Without delay upon awareness",
    },
}


# ---------------------------------------------------------------------------
# RECORD COUNT EXTRACTION
# ---------------------------------------------------------------------------

RECORD_COUNT_PATTERNS = [
    # Explicit numbers: "1.5 million records", "500K users", "3M rows"
    (r"(?i)([\d,.]+)\s*(million|mil|m)\s*(records?|rows?|users?|accounts?|entries|lines|emails?|credentials?|cards?)", 1_000_000),
    (r"(?i)([\d,.]+)\s*(billion|bil|b)\s*(records?|rows?|users?|accounts?)", 1_000_000_000),
    (r"(?i)([\d,.]+)\s*(thousand|k)\s*(records?|rows?|users?|accounts?|entries|lines)", 1_000),
    (r"(?i)([\d,.]+)\s*(records?|rows?|users?|accounts?|entries|lines|emails?|credentials?|cards?)", 1),

    # Size-based: "50GB database", "200MB dump"
    (r"(?i)([\d,.]+)\s*tb\s*(database|dump|data|db|archive)", None),  # handle separately
    (r"(?i)([\d,.]+)\s*gb\s*(database|dump|data|db|archive)", None),
]


def extract_record_count(text: str) -> dict:
    """
    Extract estimated record count from text.
    Returns {count, confidence, source_text, method}.
    """
    text_lower = text.lower()
    best_count = 0
    best_confidence = 0
    best_source = ""
    method = "none"

    for pattern, multiplier in RECORD_COUNT_PATTERNS:
        matches = re.finditer(pattern, text)
        for match in matches:
            try:
                num_str = match.group(1).replace(",", "")
                num = float(num_str)

                if multiplier is None:
                    # Size-based estimation: ~10K records per MB for typical databases
                    if "tb" in match.group().lower():
                        count = int(num * 1_000_000_000 * 10)  # rough
                    else:  # GB
                        count = int(num * 1_000_000 * 10)
                    method = "size_estimation"
                    confidence = 40
                else:
                    count = int(num * multiplier)
                    method = "explicit_count"
                    confidence = 80

                if count > best_count:
                    best_count = count
                    best_confidence = confidence
                    best_source = match.group()

            except (ValueError, IndexError):
                continue

    # Contextual boost: words that suggest large scale
    scale_indicators = {
        "massive": 20, "huge": 15, "major": 10, "all users": 20,
        "entire database": 25, "full dump": 20, "complete": 15,
        "millions": 10, "customers": 5, "employees": 5,
    }
    for indicator, boost in scale_indicators.items():
        if indicator in text_lower:
            best_confidence = min(best_confidence + boost // 3, 95)

    return {
        "estimated_count": best_count,
        "confidence": best_confidence,
        "source_text": best_source,
        "method": method,
        "formatted": _format_count(best_count),
    }


def _format_count(count: int) -> str:
    """Human-readable record count."""
    if count == 0:
        return "Unknown"
    if count >= 1_000_000_000:
        return f"~{count / 1_000_000_000:.1f}B records"
    if count >= 1_000_000:
        return f"~{count / 1_000_000:.1f}M records"
    if count >= 1_000:
        return f"~{count / 1_000:.0f}K records"
    return f"~{count} records"


# ---------------------------------------------------------------------------
# IMPACT ESTIMATION ENGINE
# ---------------------------------------------------------------------------


@dataclass
class LeakImpact:
    """Complete leak impact assessment."""
    # Data classification
    data_types_exposed: list[dict] = field(default_factory=list)
    primary_data_type: str = ""

    # Scale
    estimated_records: dict = field(default_factory=dict)
    scale_category: str = ""  # minor/moderate/major/massive/catastrophic

    # Regulatory
    applicable_regulations: list[dict] = field(default_factory=list)
    regulatory_risk: str = ""  # low/medium/high/critical

    # Business risk
    business_risk_score: float = 0.0
    risk_breakdown: dict = field(default_factory=dict)

    # Financial
    estimated_cost_range: dict = field(default_factory=dict)

    # Overall
    overall_severity: str = "low"
    impact_summary: str = ""
    recommended_actions: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "data_types_exposed": self.data_types_exposed,
            "primary_data_type": self.primary_data_type,
            "estimated_records": self.estimated_records,
            "scale_category": self.scale_category,
            "applicable_regulations": self.applicable_regulations,
            "regulatory_risk": self.regulatory_risk,
            "business_risk_score": round(self.business_risk_score, 2),
            "risk_breakdown": self.risk_breakdown,
            "estimated_cost_range": self.estimated_cost_range,
            "overall_severity": self.overall_severity,
            "impact_summary": self.impact_summary,
            "recommended_actions": self.recommended_actions,
        }


def classify_data_types(text: str) -> list[dict]:
    """Identify what types of data are exposed in the leak."""
    text_lower = text.lower()
    found = []

    for dtype, info in DATA_TYPES.items():
        score = 0
        matched_patterns = []

        # Pattern matching
        for pattern in info["patterns"]:
            matches = re.findall(pattern, text)
            if matches:
                score += 30
                matched_patterns.extend(matches[:3])

        # Keyword matching
        for kw in info["keywords"]:
            if kw in text_lower:
                score += 15

        if score > 0:
            found.append({
                "type": dtype,
                "label": info["label"],
                "confidence": min(score, 95),
                "severity_weight": info["severity_weight"],
                "per_record_cost_usd": info["per_record_cost_usd"],
            })

    # Sort by confidence
    found.sort(key=lambda x: x["confidence"], reverse=True)
    return found


def check_regulations(text: str, data_types: list[str]) -> list[dict]:
    """Determine which regulations may be applicable."""
    applicable = []

    for reg_name, reg_info in REGULATIONS.items():
        triggered = False
        trigger_reasons = []

        # Check if detected data types trigger this regulation
        for trigger_type in reg_info["triggers"]:
            if trigger_type in data_types:
                triggered = True
                trigger_reasons.append(f"Exposed {trigger_type} data")

        # Check geographic triggers in text
        for geo_pattern in reg_info["geo_triggers"]:
            if re.search(geo_pattern, text):
                triggered = True
                trigger_reasons.append("Geographic/contextual match")
                break

        if triggered:
            applicable.append({
                "regulation": reg_name,
                "description": reg_info["description"],
                "max_fine": reg_info["max_fine"],
                "notification_deadline": reg_info["notification_deadline"],
                "trigger_reasons": trigger_reasons,
            })

    return applicable


def determine_scale(count: int) -> str:
    """Categorize the scale of the breach."""
    if count == 0:
        return "unknown"
    if count < 1_000:
        return "minor"
    if count < 100_000:
        return "moderate"
    if count < 1_000_000:
        return "major"
    if count < 100_000_000:
        return "massive"
    return "catastrophic"


def estimate_financial_impact(
    record_count: int,
    data_types: list[dict],
) -> dict:
    """
    Estimate financial impact range.
    Based on IBM/Ponemon Cost of a Data Breach Report methodology:
    - Average cost per record varies by data type
    - Additional costs: investigation, notification, legal, remediation
    """
    if record_count == 0 or not data_types:
        return {
            "low_estimate_usd": 0,
            "high_estimate_usd": 0,
            "methodology": "Insufficient data for estimation",
            "formatted": "Unable to estimate",
        }

    # Use highest per-record cost among detected data types
    max_per_record = max(
        (dt["per_record_cost_usd"] for dt in data_types if dt["per_record_cost_usd"] > 0),
        default=150,
    )

    # Base calculation
    base_cost = record_count * max_per_record

    # Scale adjustments (larger breaches have lower per-record cost due to economies)
    if record_count > 10_000_000:
        scale_factor = 0.3
    elif record_count > 1_000_000:
        scale_factor = 0.5
    elif record_count > 100_000:
        scale_factor = 0.7
    else:
        scale_factor = 1.0

    adjusted = base_cost * scale_factor

    # Range: -30% to +50% for uncertainty
    low = int(adjusted * 0.7)
    high = int(adjusted * 1.5)

    # Add fixed costs: investigation, legal, notification
    fixed_costs = 500_000  # baseline
    if record_count > 1_000_000:
        fixed_costs = 2_000_000
    if record_count > 10_000_000:
        fixed_costs = 5_000_000

    low += fixed_costs
    high += fixed_costs

    return {
        "low_estimate_usd": low,
        "high_estimate_usd": high,
        "per_record_cost_usd": max_per_record,
        "methodology": "Based on IBM/Ponemon per-record cost model with scale adjustment",
        "formatted": f"${low:,.0f} — ${high:,.0f} USD",
    }


def compute_business_risk(
    data_types: list[dict],
    record_count: int,
    regulations: list[dict],
) -> tuple[float, dict]:
    """
    Compute overall business risk score (0-10).
    Breakdown: reputational, legal, financial, operational.
    """
    reputational = 0.0
    legal = 0.0
    financial = 0.0
    operational = 0.0

    # Data type severity drives base scores
    if data_types:
        max_weight = max(dt["severity_weight"] for dt in data_types)
        reputational += max_weight * 4
        financial += max_weight * 3

    # Scale amplifier
    scale = determine_scale(record_count)
    scale_multiplier = {
        "unknown": 0.5, "minor": 0.6, "moderate": 0.8,
        "major": 1.0, "massive": 1.3, "catastrophic": 1.5,
    }.get(scale, 0.5)

    reputational *= scale_multiplier
    financial *= scale_multiplier

    # Regulatory risk
    if regulations:
        legal = min(len(regulations) * 2.5, 8)
        financial += len(regulations) * 0.5

    # Operational impact (source code, infrastructure leaks)
    dtype_names = [dt["type"] for dt in data_types]
    if "source_code" in dtype_names:
        operational += 4
    if "infrastructure" in dtype_names:
        operational += 5
    if "credentials" in dtype_names:
        operational += 3

    # Cap each at 10
    breakdown = {
        "reputational": round(min(reputational, 10), 1),
        "legal": round(min(legal, 10), 1),
        "financial": round(min(financial, 10), 1),
        "operational": round(min(operational, 10), 1),
    }

    overall = sum(breakdown.values()) / 4
    return round(min(overall, 10), 1), breakdown


def generate_recommendations(
    data_types: list[dict],
    regulations: list[dict],
    scale: str,
) -> list[str]:
    """Generate actionable recommendations based on impact assessment."""
    recs = []

    dtype_names = [dt["type"] for dt in data_types]

    # Immediate actions
    if "credentials" in dtype_names:
        recs.append("IMMEDIATE: Force password resets for all potentially affected accounts")
        recs.append("IMMEDIATE: Revoke and rotate all exposed API keys and tokens")

    if "financial" in dtype_names:
        recs.append("IMMEDIATE: Notify payment card brands and initiate fraud monitoring")
        recs.append("IMMEDIATE: Engage forensic investigation for PCI compliance")

    if "medical" in dtype_names:
        recs.append("IMMEDIATE: Activate HIPAA breach response protocol")
        recs.append("IMMEDIATE: Engage healthcare-specialized breach response counsel")

    if "source_code" in dtype_names:
        recs.append("IMMEDIATE: Audit exposed code for embedded secrets and hardcoded credentials")
        recs.append("IMMEDIATE: Assess if exposed code reveals exploitable vulnerabilities")

    if "infrastructure" in dtype_names:
        recs.append("CRITICAL: Assume compromised infrastructure — initiate incident response")
        recs.append("CRITICAL: Rotate all credentials visible in exposed configs")

    # Regulatory actions
    for reg in regulations:
        name = reg["regulation"]
        deadline = reg["notification_deadline"]
        recs.append(f"REGULATORY: Prepare {name} notification — deadline: {deadline}")

    # Scale-based actions
    if scale in ("massive", "catastrophic"):
        recs.append("STRATEGIC: Engage crisis communications firm for public disclosure")
        recs.append("STRATEGIC: Prepare SEC material event disclosure if publicly traded")

    if not recs:
        recs.append("Monitor dark web sources for further exposure of this data")
        recs.append("Review access controls for the affected systems")

    return recs


# ---------------------------------------------------------------------------
# MAIN ESTIMATION FUNCTION
# ---------------------------------------------------------------------------


def estimate_leak_impact(
    text: str,
    detection_output: dict = None,
    org_name: str = "",
) -> LeakImpact:
    """
    Run the full leak impact estimation on a piece of text.
    Optionally enriched with detection output from Layer 1.
    """
    impact = LeakImpact()

    # 1. Classify data types
    data_types = classify_data_types(text)
    impact.data_types_exposed = data_types
    if data_types:
        impact.primary_data_type = data_types[0]["label"]

    # 2. Extract record count
    records = extract_record_count(text)
    impact.estimated_records = records

    # 3. Determine scale
    impact.scale_category = determine_scale(records["estimated_count"])

    # 4. Check regulations
    dtype_names = [dt["type"] for dt in data_types]
    regulations = check_regulations(text, dtype_names)
    impact.applicable_regulations = regulations

    # Regulatory risk level
    if len(regulations) >= 3:
        impact.regulatory_risk = "critical"
    elif len(regulations) >= 2:
        impact.regulatory_risk = "high"
    elif len(regulations) >= 1:
        impact.regulatory_risk = "medium"
    else:
        impact.regulatory_risk = "low"

    # 5. Business risk
    risk_score, risk_breakdown = compute_business_risk(
        data_types, records["estimated_count"], regulations,
    )
    impact.business_risk_score = risk_score
    impact.risk_breakdown = risk_breakdown

    # 6. Financial impact
    impact.estimated_cost_range = estimate_financial_impact(
        records["estimated_count"], data_types,
    )

    # 7. Overall severity
    if risk_score >= 8:
        impact.overall_severity = "critical"
    elif risk_score >= 6:
        impact.overall_severity = "high"
    elif risk_score >= 4:
        impact.overall_severity = "medium"
    else:
        impact.overall_severity = "low"

    # 8. Recommendations
    impact.recommended_actions = generate_recommendations(
        data_types, regulations, impact.scale_category,
    )

    # 9. Impact summary
    parts = []
    if impact.primary_data_type:
        parts.append(f"Primary data: {impact.primary_data_type}")
    if records["estimated_count"] > 0:
        parts.append(f"Scale: {records['formatted']}")
    if regulations:
        reg_names = [r["regulation"] for r in regulations]
        parts.append(f"Regulatory: {', '.join(reg_names)}")
    if impact.estimated_cost_range.get("formatted"):
        parts.append(f"Est. cost: {impact.estimated_cost_range['formatted']}")
    parts.append(f"Risk: {risk_score}/10")

    impact.impact_summary = " | ".join(parts) if parts else "Insufficient data for impact estimation"

    return impact


# ---------------------------------------------------------------------------
# LLM OUTPUT PARSER — for when the LLM returns leak_impact module output
# ---------------------------------------------------------------------------


def parse_leak_impact(raw: dict) -> dict:
    """Parse and validate leak_impact module output from LLM."""
    return {
        "affected_entities": raw.get("affected_entities", []),
        "data_sensitivity": raw.get("data_sensitivity", "unknown"),
        "estimated_scope": raw.get("estimated_scope", ""),
        "business_impact": raw.get("business_impact", ""),
        "urgency": raw.get("urgency", "medium"),
        "llm_assessment": raw.get("assessment", ""),
    }