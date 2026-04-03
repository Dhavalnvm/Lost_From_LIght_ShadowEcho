"""
ShadowEcho — Prometheus Middleware
Auto-tracks HTTP request count, latency, and status codes.
Also exposes /metrics endpoint for Prometheus scraping.

USAGE — call setup_prometheus(app) inside the lifespan context in main.py,
AFTER init_db() and BEFORE yielding. Example:

    @asynccontextmanager
    async def lifespan(app):
        init_db()
        setup_prometheus(app)   # ← add this line
        yield

Fixed:
  - Removed deprecated @app.on_event("startup") — use asyncio.create_task
    inside setup_prometheus so it works with the lifespan pattern.
"""

import asyncio
import logging
import time
from fastapi import FastAPI, Request, Response
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
from monitoring.metrics import (
    http_requests_total,
    http_request_duration,
    update_system_gauges,
)

log = logging.getLogger("monitoring")

GAUGE_UPDATE_INTERVAL = 30  # seconds


def setup_prometheus(app: FastAPI) -> None:
    """
    Attach Prometheus monitoring to a FastAPI app.

    Adds:
      1. HTTP request tracking middleware (count + latency)
      2. /metrics endpoint for Prometheus scraping
      3. Background coroutine for periodic system gauge updates
         (CPU, memory, etc.)

    Call this function inside the lifespan context manager, before yield.
    """

    # 1. Middleware — track every HTTP request
    @app.middleware("http")
    async def prometheus_middleware(request: Request, call_next):
        # Skip /metrics itself to avoid recursive inflation
        if request.url.path == "/metrics":
            return await call_next(request)

        method = request.method
        path = _normalize_path(request.url.path)

        t0 = time.perf_counter()
        response = await call_next(request)
        duration = time.perf_counter() - t0

        status_code = str(response.status_code)

        http_requests_total.labels(
            method=method,
            endpoint=path,
            status_code=status_code,
        ).inc()

        http_request_duration.labels(
            method=method,
            endpoint=path,
        ).observe(duration)

        response.headers["X-Pipeline-Time"] = f"{duration:.4f}s"
        return response

    # 2. /metrics endpoint
    @app.get("/metrics", include_in_schema=False)
    async def metrics_endpoint():
        """Prometheus scrape endpoint."""
        return Response(
            content=generate_latest(),
            media_type=CONTENT_TYPE_LATEST,
        )

    # 3. Background gauge updater — launched as an asyncio task so it
    #    works with both the lifespan pattern and older setups.
    async def _gauge_updater():
        while True:
            try:
                update_system_gauges()
            except Exception as exc:
                log.debug(f"Gauge update error: {exc}")
            await asyncio.sleep(GAUGE_UPDATE_INTERVAL)

    # Schedule the task immediately (works when called from inside lifespan)
    asyncio.create_task(_gauge_updater())
    log.info("✅ Prometheus metrics enabled at /metrics")


def _normalize_path(path: str) -> str:
    """
    Normalize URL paths for consistent metric label cardinality.
    /api/alerts/123         → /api/alerts/{id}
    /api/mirror/quick/Acme → /api/mirror/quick/{param}
    """
    parts = path.strip("/").split("/")
    normalized = []

    for i, part in enumerate(parts):
        if _is_id_like(part):
            normalized.append("{id}")
        elif i > 0 and parts[i - 1] == "quick":
            normalized.append("{param}")
        else:
            normalized.append(part)

    return "/" + "/".join(normalized)


def _is_id_like(s: str) -> bool:
    """Return True if a path segment looks like a generated ID."""
    if not s:
        return False
    if s.isdigit():
        return True
    # Hex hash — our post IDs are 16-char hex strings
    if len(s) >= 8 and all(c in "0123456789abcdef" for c in s.lower()):
        return True
    return False