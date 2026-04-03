"""
ShadowEcho — Prometheus Metrics
All pipeline, model, and system metrics defined here.

Metrics tracked:
  Pipeline:
    - posts_ingested_total (by source)
    - posts_processed_total (by result: signal/noise)
    - alerts_fired_total (by severity)
    - pipeline_duration_seconds (by stage)

  Models:
    - llm_call_duration_seconds (by model, purpose)
    - embedding_duration_seconds
    - llm_tokens_generated_total

  Features:
    - slang_terms_decoded_total (by language)
    - leak_impact_assessments_total (by severity)
    - chatbot_requests_total
    - chatbot_response_duration_seconds

  System:
    - chromadb_document_count
    - sqlite_row_count (by table)
    - feedback_labels_total (by label)

  HTTP:
    - http_requests_total (by method, endpoint, status)
    - http_request_duration_seconds (by method, endpoint)
"""

import time
import logging
from prometheus_client import (
    Counter, Histogram, Gauge, Summary, Info,
    generate_latest, CONTENT_TYPE_LATEST,
)

log = logging.getLogger("metrics")


# ---------------------------------------------------------------------------
# SYSTEM INFO
# ---------------------------------------------------------------------------

shadowecho_info = Info(
    "shadowecho",
    "ShadowEcho system information",
)
shadowecho_info.info({
    "version": "1.2.0",
    "pipeline_model": "llama3.1:8b",
    "chatbot_model": "llama3.2:3b",
    "embedding_model": "bge-m3:567m",
})


# ---------------------------------------------------------------------------
# PIPELINE METRICS
# ---------------------------------------------------------------------------

posts_ingested = Counter(
    "shadowecho_posts_ingested_total",
    "Total posts ingested into the system",
    ["source"],  # dread, telegram, reddit, breachforums, manual
)

posts_processed = Counter(
    "shadowecho_posts_processed_total",
    "Total posts that went through the full pipeline",
    ["result"],  # signal, noise, error
)

alerts_fired = Counter(
    "shadowecho_alerts_fired_total",
    "Total alerts generated",
    ["severity"],  # low, medium, high, critical
)

pipeline_duration = Histogram(
    "shadowecho_pipeline_duration_seconds",
    "Time spent in each pipeline stage",
    ["stage"],  # detection, signal_filter, rag_retrieval, llm_call, alert_engine, leak_impact, slang_decode
    buckets=[0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0, 30.0, 60.0],
)

pipeline_total_duration = Histogram(
    "shadowecho_pipeline_total_duration_seconds",
    "Total end-to-end pipeline processing time",
    buckets=[0.1, 0.5, 1.0, 2.5, 5.0, 10.0, 30.0, 60.0, 120.0],
)

signal_score_distribution = Histogram(
    "shadowecho_signal_score",
    "Distribution of signal filter scores",
    buckets=[0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
)

detection_score_distribution = Histogram(
    "shadowecho_detection_score",
    "Distribution of detection scores",
    buckets=[0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
)


# ---------------------------------------------------------------------------
# MODEL METRICS
# ---------------------------------------------------------------------------

llm_call_duration = Histogram(
    "shadowecho_llm_call_duration_seconds",
    "LLM inference time",
    ["model", "purpose"],  # (llama3.1:8b, pipeline) or (llama3.2:3b, chatbot)
    buckets=[0.5, 1.0, 2.5, 5.0, 10.0, 15.0, 30.0, 60.0, 120.0],
)

llm_calls_total = Counter(
    "shadowecho_llm_calls_total",
    "Total LLM calls made",
    ["model", "purpose", "status"],  # status: success, timeout, error
)

embedding_duration = Histogram(
    "shadowecho_embedding_duration_seconds",
    "Time to generate embeddings via Ollama",
    ["operation"],  # single, batch, query
    buckets=[0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0],
)

embedding_calls_total = Counter(
    "shadowecho_embedding_calls_total",
    "Total embedding API calls",
    ["operation", "status"],
)


# ---------------------------------------------------------------------------
# FEATURE METRICS
# ---------------------------------------------------------------------------

slang_terms_decoded = Counter(
    "shadowecho_slang_terms_decoded_total",
    "Total slang terms decoded",
    ["language", "threat_category"],
)

slang_decode_posts = Counter(
    "shadowecho_slang_decode_posts_total",
    "Posts that contained coded language",
    ["highest_severity"],
)

leak_impact_assessments = Counter(
    "shadowecho_leak_impact_assessments_total",
    "Total leak impact assessments performed",
    ["severity", "scale_category"],
)

leak_impact_regulations = Counter(
    "shadowecho_leak_impact_regulations_triggered_total",
    "Regulatory frameworks triggered by leak assessments",
    ["regulation"],  # GDPR, HIPAA, PCI_DSS, CCPA, SOX, DPDPA
)

chatbot_requests = Counter(
    "shadowecho_chatbot_requests_total",
    "Total chatbot requests",
    ["type"],  # regular, stream
)

chatbot_response_duration = Histogram(
    "shadowecho_chatbot_response_duration_seconds",
    "Chatbot response generation time",
    buckets=[0.5, 1.0, 2.0, 3.0, 5.0, 8.0, 15.0, 30.0],
)

feedback_labels = Counter(
    "shadowecho_feedback_labels_total",
    "Analyst feedback labels submitted",
    ["label"],  # real, noise, unsure
)


# ---------------------------------------------------------------------------
# SYSTEM GAUGES — updated periodically
# ---------------------------------------------------------------------------

chromadb_documents = Gauge(
    "shadowecho_chromadb_documents",
    "Number of documents in ChromaDB",
)

sqlite_posts = Gauge(
    "shadowecho_sqlite_posts_total",
    "Total posts in SQLite",
)

sqlite_signals = Gauge(
    "shadowecho_sqlite_signals_total",
    "Total signal posts in SQLite",
)

sqlite_alerts = Gauge(
    "shadowecho_sqlite_alerts_total",
    "Total alerts in SQLite",
)

sqlite_unacked_alerts = Gauge(
    "shadowecho_sqlite_unacked_alerts",
    "Unacknowledged alerts in SQLite",
)

signal_to_noise_ratio = Gauge(
    "shadowecho_signal_to_noise_ratio",
    "Current signal-to-noise ratio",
)


# ---------------------------------------------------------------------------
# HTTP METRICS (set up by middleware)
# ---------------------------------------------------------------------------

http_requests_total = Counter(
    "shadowecho_http_requests_total",
    "Total HTTP requests",
    ["method", "endpoint", "status_code"],
)

http_request_duration = Histogram(
    "shadowecho_http_request_duration_seconds",
    "HTTP request processing time",
    ["method", "endpoint"],
    buckets=[0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0, 30.0],
)


# ---------------------------------------------------------------------------
# METRIC HELPERS — called from pipeline code
# ---------------------------------------------------------------------------


class PipelineTimer:
    """Context manager for timing pipeline stages."""

    def __init__(self, stage: str):
        self.stage = stage
        self.start = None

    def __enter__(self):
        self.start = time.perf_counter()
        return self

    def __exit__(self, *args):
        elapsed = time.perf_counter() - self.start
        pipeline_duration.labels(stage=self.stage).observe(elapsed)


def record_post_ingested(source: str):
    posts_ingested.labels(source=source).inc()


def record_post_processed(result: str):
    posts_processed.labels(result=result).inc()


def record_alert(severity: str):
    alerts_fired.labels(severity=severity).inc()


def record_llm_call(model: str, purpose: str, status: str, duration: float):
    llm_calls_total.labels(model=model, purpose=purpose, status=status).inc()
    if status == "success":
        llm_call_duration.labels(model=model, purpose=purpose).observe(duration)


def record_embedding(operation: str, status: str, duration: float):
    embedding_calls_total.labels(operation=operation, status=status).inc()
    if status == "success":
        embedding_duration.labels(operation=operation).observe(duration)


def record_slang_decoded(decoded_terms: list, highest_severity: str):
    if decoded_terms:
        slang_decode_posts.labels(highest_severity=highest_severity).inc()
        for term in decoded_terms:
            slang_terms_decoded.labels(
                language=term.get("language", "en"),
                threat_category=term.get("threat_category", "unknown"),
            ).inc()


def record_leak_impact(severity: str, scale: str, regulations: list):
    leak_impact_assessments.labels(severity=severity, scale_category=scale).inc()
    for reg in regulations:
        leak_impact_regulations.labels(regulation=reg.get("regulation", "unknown")).inc()


def record_chatbot_request(req_type: str, duration: float):
    chatbot_requests.labels(type=req_type).inc()
    chatbot_response_duration.observe(duration)


def record_feedback(label: str):
    feedback_labels.labels(label=label).inc()


def update_system_gauges():
    """Update system-level gauges. Call periodically."""
    try:
        from db.crud import get_dashboard_stats
        stats = get_dashboard_stats()

        sqlite_posts.set(stats.get("total_posts", 0))
        sqlite_signals.set(stats.get("signal_posts", 0))
        sqlite_alerts.set(stats.get("total_alerts", 0))
        sqlite_unacked_alerts.set(stats.get("unacknowledged_alerts", 0))

        total = stats.get("total_posts", 0)
        signals = stats.get("signal_posts", 0)
        if total > 0:
            signal_to_noise_ratio.set(round(signals / total, 4))

    except Exception as e:
        log.debug(f"Could not update system gauges: {e}")

    try:
        from core.embeddings import get_collection
        collection = get_collection()
        chromadb_documents.set(collection.count())
    except Exception:
        pass