"""
ShadowEcho — API Schemas
Pydantic models for all request/response payloads.
"""

from pydantic import BaseModel, Field
from typing import Optional


# ---------------------------------------------------------------------------
# REQUESTS
# ---------------------------------------------------------------------------


class AnalyzeRequest(BaseModel):
    """Submit a post for full pipeline analysis."""
    text: str = Field(..., min_length=10, description="Post text to analyze")
    source: str = Field(default="manual", description="Source of the post")
    author: str = Field(default="anonymous")
    org_watchlist: list[str] = Field(default=[], description="Organization names to watch for")


class MirrorRequest(BaseModel):
    """Look up what's being said about an organization."""
    org_name: str = Field(..., min_length=1, description="Organization name to search")
    limit: int = Field(default=20, ge=1, le=100)


class NotebookRequest(BaseModel):
    """Generate an intelligence brief for a specific post or topic."""
    post_id: Optional[str] = None
    query: Optional[str] = None
    top_k: int = Field(default=5, ge=1, le=20)


class LineupRequest(BaseModel):
    """Find posts with behavioral/linguistic similarity."""
    post_id: Optional[str] = None
    text: Optional[str] = None
    top_k: int = Field(default=10, ge=1, le=50)


class FeedbackRequest(BaseModel):
    """Analyst feedback on a post or alert."""
    post_id: Optional[str] = None
    alert_id: Optional[int] = None
    label: str = Field(..., pattern="^(real|noise|unsure)$")
    notes: str = Field(default="")


class AlertAckRequest(BaseModel):
    """Acknowledge an alert."""
    alert_id: int


# ---------------------------------------------------------------------------
# RESPONSES
# ---------------------------------------------------------------------------


class DetectionResponse(BaseModel):
    is_relevant: bool
    org_mentions: list[str]
    credentials_count: int
    iocs_count: int
    leak_indicators: list[str]
    detection_tags: list[str]
    score: float


class SignalResponse(BaseModel):
    score: float
    is_signal: bool
    layer_scores: dict
    flags: list[str]
    reasoning: str


class ModuleResponse(BaseModel):
    mimicry: dict
    escalation: dict
    fingerprint: dict
    consensus: dict
    narrative: dict


class AlertResponse(BaseModel):
    id: int
    post_id: str
    severity: str
    alert_type: str
    title: str
    summary: str
    confidence: float
    uncertainty_note: str
    created_at: str
    acknowledged: bool


class AnalyzeResponse(BaseModel):
    post_id: str
    detection: dict
    signal: dict
    modules: dict
    alert: Optional[dict] = None
    pipeline_time_ms: float


class MirrorResponse(BaseModel):
    org_name: str
    total_mentions: int
    posts: list[dict]


class NotebookResponse(BaseModel):
    brief: dict
    sources_used: int
    context_posts: list[dict]


class LineupResponse(BaseModel):
    query_post: Optional[dict] = None
    similar_posts: list[dict]
    cluster_count: int


class DashboardResponse(BaseModel):
    stats: dict
    recent_alerts: list[dict]
    recent_signals: list[dict]


class FeedbackResponse(BaseModel):
    feedback_id: int
    message: str
