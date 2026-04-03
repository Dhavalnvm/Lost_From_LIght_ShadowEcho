"""
ShadowEcho — Alert Engine (Layer 4)
Combines detection output + signal filter score + LLM module outputs
+ leak impact estimation to decide if an alert should fire.

Factors:
  - Detection score (keywords, IOCs, credentials, org mentions)
  - Signal filter score (cross-source corroboration)
  - LLM module verdicts (mimicry, escalation, consensus)
  - Slang decoder severity (coded language = likely real threat)
  - Leak impact score (data exposure urgency multiplier)

Fixed:
  - Multiplier applied BEFORE additive leak components so clamping is coherent
  - Gate raised to ALERT_THRESHOLD (0.75) — only real threats reach the DB
  - Score cannot exceed 1.0 at any intermediate step
"""

import logging
from datetime import datetime, timezone
from config import ALERT_THRESHOLD, CRITICAL_ALERT_THRESHOLD
from db.crud import insert_alert

log = logging.getLogger("alert_engine")


def compute_alert_score(
    detection_output: dict,
    signal_output: dict,
    module_output: dict,
) -> float:
    """
    Compute a combined alert score from all pipeline outputs.
    Returns 0-1 score.

    Weight budget:
      Detection   → max 0.30
      Signal      → max 0.30
      Modules     → max 0.40
        mimicry       0.15
        escalation    0.15
        consensus     0.10
      Slang bonus → max 0.10
      Leak bonus  → max 0.15  (applied after base, before multiplier)
      Risk amp    → ×1.15 for business_risk_score ≥ 7
    """
    score = 0.0

    # --- Detection contribution (0–0.30) ---
    det_score = detection_output.get("score", 0)
    if detection_output.get("org_mentions"):
        det_score = min(det_score + 0.1, 0.4)   # cap before clamp below
    score += min(det_score, 0.30)

    # --- Signal filter contribution (0–0.30) ---
    sig_score = signal_output.get("score", 0)
    score += sig_score * 0.30

    # --- Module contributions (0–0.40) ---
    mimicry    = module_output.get("mimicry", {})
    escalation = module_output.get("escalation", {})
    consensus  = module_output.get("consensus", {})

    if mimicry.get("verdict") == "genuine":
        score += 0.15
    elif mimicry.get("verdict") in ("bluff", "troll", "roleplay"):
        score -= 0.10

    esc_level = escalation.get("level", 0)
    if esc_level >= 5:
        score += 0.15
    elif esc_level >= 3:
        score += 0.10

    cons_type = consensus.get("type", "solo")
    if cons_type in ("organized", "mob"):
        score += 0.10
    elif cons_type == "emerging_group":
        score += 0.05

    # --- Slang decoder bonus (0–0.10) ---
    slang = detection_output.get("slang", {})
    if slang.get("has_coded_language"):
        sev = slang.get("highest_severity", "low")
        if sev == "critical":
            score += 0.10
        elif sev == "high":
            score += 0.05

    # Clamp to [0, 1] before applying leak impact bonus + multiplier
    score = min(max(score, 0.0), 1.0)

    # --- Leak impact bonus (0–0.15) ---
    leak_impact = module_output.get("leak_impact", {})
    leak_severity = leak_impact.get("overall_severity", "low")
    if leak_severity == "critical":
        score = min(score + 0.15, 1.0)
    elif leak_severity == "high":
        score = min(score + 0.10, 1.0)
    elif leak_severity == "medium":
        score = min(score + 0.05, 1.0)

    # --- Business risk amplifier (×1.15 for high-risk leaks) ---
    # Applied after all additive components so the amplified value is
    # also clamped correctly at the final step.
    risk_score = leak_impact.get("business_risk_score", 0)
    if risk_score >= 7:
        score = min(score * 1.15, 1.0)

    return round(score, 3)


def determine_severity(score: float) -> str:
    if score >= CRITICAL_ALERT_THRESHOLD:
        return "critical"
    elif score >= ALERT_THRESHOLD:
        return "high"
    elif score >= 0.5:
        return "medium"
    else:
        return "low"


def determine_alert_type(detection_output: dict, module_output: dict) -> str:
    tags = detection_output.get("detection_tags", [])
    narrative = module_output.get("narrative", {})
    threat_type = narrative.get("threat_type", "")

    slang = detection_output.get("slang", {})
    slang_categories = slang.get("threat_categories", [])

    if "leak" in tags or threat_type == "data_leak":
        return "data_leak"
    if "credentials" in tags or threat_type == "credential_dump":
        return "credential_exposure"
    if threat_type in ("ransomware", "exploit_sale", "access_sale"):
        return threat_type
    if "ransomware" in slang_categories:
        return "ransomware"
    if "access_sale" in slang_categories:
        return "access_sale"
    if "carding" in slang_categories:
        return "carding"
    if "org_mention" in tags:
        return "org_mention"
    if "ioc" in tags:
        return "ioc_detected"
    if slang_categories:
        return slang_categories[0]
    return "threat_signal"


def build_uncertainty_note(module_output: dict) -> str:
    notes = []
    for module_name in ["mimicry", "fingerprint", "narrative"]:
        module = module_output.get(module_name, {})
        note = module.get("uncertainty_note", "")
        if note:
            notes.append(f"{module_name}: {note}")

    mimicry_conf = module_output.get("mimicry", {}).get("confidence", 0)
    if mimicry_conf < 60:
        notes.append(f"Mimicry confidence is low ({mimicry_conf}%)")

    leak_impact = module_output.get("leak_impact", {})
    records = leak_impact.get("estimated_records", {})
    if records.get("confidence", 0) < 50 and records.get("estimated_count", 0) > 0:
        notes.append(f"Record count estimate has low confidence ({records.get('confidence', 0)}%)")

    return " | ".join(notes) if notes else "Analysis confidence is within acceptable range."


def build_alert_title(detection_output: dict, module_output: dict) -> str:
    parts = []

    org_mentions = detection_output.get("org_mentions", [])
    if org_mentions:
        parts.append(f"Org mention: {', '.join(org_mentions[:2])}")

    narrative = module_output.get("narrative", {})
    threat_type = narrative.get("threat_type", "")
    if threat_type:
        parts.append(threat_type.replace("_", " ").title())

    slang = detection_output.get("slang", {})
    if slang.get("has_coded_language") and not parts:
        categories = slang.get("threat_categories", [])
        if categories:
            parts.append(categories[0].replace("_", " ").title())

    leak_impact = module_output.get("leak_impact", {})
    if leak_impact.get("scale_category") in ("major", "massive", "catastrophic"):
        records = leak_impact.get("estimated_records", {})
        if records.get("formatted"):
            parts.append(f"Scale: {records['formatted']}")

    if not parts:
        parts.append("Dark web threat signal detected")

    return " — ".join(parts)


def evaluate_alert(
    post_id: str,
    post_text: str,
    detection_output: dict,
    signal_output: dict,
    module_output: dict,
) -> dict | None:
    """
    Evaluate whether an alert should fire.
    Gate: score must reach ALERT_THRESHOLD (0.75) to be written to the DB.
    Scores between 0.45–0.75 are silently dropped — they are medium/low noise.
    """
    alert_score = compute_alert_score(detection_output, signal_output, module_output)

    # Hard gate — only write to DB if score crosses the alert threshold
    if alert_score < ALERT_THRESHOLD:
        log.debug(f"Post {post_id}: alert score {alert_score:.3f} below threshold ({ALERT_THRESHOLD}) — suppressed")
        return None

    severity = determine_severity(alert_score)
    alert_type = determine_alert_type(detection_output, module_output)

    narrative = module_output.get("narrative", {})
    leak_impact = module_output.get("leak_impact", {})

    alert = {
        "post_id": post_id,
        "severity": severity,
        "alert_type": alert_type,
        "title": build_alert_title(detection_output, module_output),
        "summary": narrative.get("summary", post_text[:200]),
        "confidence": alert_score,
        "uncertainty_note": build_uncertainty_note(module_output),
        "detection_output": detection_output,
        "module_output": module_output,
        "leak_impact_summary": leak_impact.get("impact_summary", ""),
        "regulatory_risk": leak_impact.get("regulatory_risk", ""),
    }

    alert_id = insert_alert(alert)
    alert["id"] = alert_id

    log.info(f"🚨 Alert #{alert_id} fired — severity: {severity}, type: {alert_type}, score: {alert_score:.3f}")
    return alert