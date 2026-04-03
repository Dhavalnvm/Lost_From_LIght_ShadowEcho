"""
ShadowEcho — Leak Impact Estimation Route
/api/impact — standalone leak impact estimator.
Input a dark web post about a data breach, get a full impact report:
  - What data was exposed
  - How many records
  - Which regulations apply
  - Estimated financial cost
  - Business risk score
  - Recommended actions
"""

import logging
from fastapi import APIRouter
from pydantic import BaseModel, Field
from modules.leak_impact import estimate_leak_impact

log = logging.getLogger("api.impact")
router = APIRouter(prefix="/api/impact", tags=["leak_impact"])


class ImpactRequest(BaseModel):
    text: str = Field(..., min_length=10, description="Post text describing a data leak/breach")
    org_name: str = Field(default="", description="Target organization name (optional)")


class ImpactResponse(BaseModel):
    # Data classification
    data_types_exposed: list[dict]
    primary_data_type: str

    # Scale
    estimated_records: dict
    scale_category: str

    # Regulatory
    applicable_regulations: list[dict]
    regulatory_risk: str

    # Business risk
    business_risk_score: float
    risk_breakdown: dict

    # Financial
    estimated_cost_range: dict

    # Overall
    overall_severity: str
    impact_summary: str
    recommended_actions: list[str]


@router.post("", response_model=ImpactResponse)
async def estimate_impact(req: ImpactRequest):
    """
    Estimate the real-world impact of a detected data leak.

    Example inputs:
      - "Selling 2.5 million customer records from Acme Corp.
         Includes names, SSN, credit card numbers, and medical records.
         EU and US customers affected."
      - "Database dump: 500K employee records with email and password hashes.
         Source: internal HR system."
      - "50GB source code leak from tech company. Includes API keys,
         infrastructure configs, and internal documentation."
    """
    impact = estimate_leak_impact(
        text=req.text,
        org_name=req.org_name,
    )
    data = impact.to_dict()

    return ImpactResponse(**data)


@router.post("/quick")
async def quick_impact(req: ImpactRequest):
    """
    Quick impact summary — just the key numbers.
    Good for dashboard integration.
    """
    impact = estimate_leak_impact(text=req.text, org_name=req.org_name)

    return {
        "severity": impact.overall_severity,
        "risk_score": impact.business_risk_score,
        "scale": impact.scale_category,
        "records": impact.estimated_records.get("formatted", "Unknown"),
        "cost_range": impact.estimated_cost_range.get("formatted", "Unable to estimate"),
        "regulations": [r["regulation"] for r in impact.applicable_regulations],
        "summary": impact.impact_summary,
    }


@router.get("/methodology")
async def impact_methodology():
    """
    Explains the impact estimation methodology — transparency for judges.
    """
    return {
        "overview": "ShadowEcho's Leak Impact Estimation Engine assesses the real-world "
                     "consequences of detected data breaches using a multi-factor model.",
        "methodology": {
            "record_count_extraction": {
                "description": "Extracts volume indicators from text using pattern matching",
                "methods": [
                    "Explicit counts: '2.5 million records' → 2,500,000",
                    "Size-based estimation: '50GB database' → ~500M records",
                    "Contextual scale indicators: 'massive', 'entire database', 'all users'",
                ],
            },
            "data_type_classification": {
                "description": "Identifies what types of data are exposed",
                "types": [
                    "PII (names, SSN, addresses) — $180/record",
                    "Financial (cards, bank accounts) — $350/record",
                    "Credentials (passwords, API keys) — $120/record",
                    "Medical/PHI (patient records) — $450/record",
                    "Source Code (proprietary code)",
                    "Corporate Internal (strategy, M&A docs)",
                    "Infrastructure (network configs, SSH keys)",
                ],
            },
            "regulatory_mapping": {
                "description": "Automatically identifies applicable regulations",
                "regulations": ["GDPR", "HIPAA", "PCI-DSS", "CCPA", "SOX", "DPDPA (India)"],
                "method": "Triggered by data type + geographic/contextual indicators in text",
            },
            "financial_estimation": {
                "description": "Cost range based on IBM/Ponemon breach cost data",
                "method": "Per-record cost × scale adjustment + fixed costs (investigation, legal, notification)",
                "note": "Larger breaches have lower per-record costs due to economies of scale",
            },
            "business_risk_scoring": {
                "description": "0-10 composite score across four dimensions",
                "dimensions": [
                    "Reputational — public trust and brand damage",
                    "Legal — regulatory fines and litigation exposure",
                    "Financial — direct costs and market impact",
                    "Operational — business continuity and infrastructure compromise",
                ],
            },
        },
        "limitations": [
            "Record count estimation is pattern-based and may miss implicit indicators",
            "Financial estimates are ranges based on industry averages, not precise predictions",
            "Regulatory mapping uses contextual clues — actual applicability requires legal review",
            "Business risk scoring doesn't account for organization-specific factors (insurance, maturity)",
        ],
    }