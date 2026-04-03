"""
ShadowEcho — Main Application
FastAPI app that mounts all routes and starts background stream processors.

Run: uvicorn main:app --host 0.0.0.0 --port 8000 --reload
  or: python main.py
"""

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from config import API_HOST, API_PORT, API_RELOAD
from db.database import init_db

# Route imports
from api.routes.dashboard import router as dashboard_router
from api.routes.mirror import router as mirror_router
from api.routes.notebook import router as notebook_router
from api.routes.lineup import router as lineup_router
from api.routes.alerts import router as alerts_router
from api.routes.feedback import router as feedback_router

# Stream imports
from stream.telegram_listener import start_telegram_listener, get_next_message
from stream.tor_crawler import start_tor_crawler

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
log = logging.getLogger("shadowecho")


# ---------------------------------------------------------------------------
# PIPELINE PROCESSOR — consumes from message queue
# ---------------------------------------------------------------------------

async def pipeline_processor():
    """
    Background task that reads from the shared message queue
    (fed by Telegram listener + Tor crawler) and runs each post
    through the full pipeline.
    """
    from core.detector import run_detection
    from core.signal_filter import run_signal_filter
    from core.rag import retrieve_context, build_llm_input
    from core.llm import call_llm
    from core.alert_engine import evaluate_alert
    from core.embeddings import add_to_store
    from db.crud import insert_post, update_post_signal
    from modules.mimicry import parse_mimicry
    from modules.escalation import parse_escalation
    from modules.fingerprint import parse_fingerprint
    from modules.consensus import parse_consensus
    from modules.narrative import parse_narrative

    log.info("Pipeline processor started — waiting for messages...")

    while True:
        post = await get_next_message(timeout=2.0)
        if not post:
            continue

        try:
            text = post.get("text", post.get("body", ""))
            post_id = post["id"]

            log.info(f"📨 Processing: {post_id} from {post.get('source', '?')}")

            # Store in DB
            insert_post(post)

            # Layer 1 — Detection
            detection = run_detection(text)
            detection_dict = detection.to_dict()

            # Layer 2 — Signal Filter
            rag_context = retrieve_context(text)
            signal = run_signal_filter(
                text=text,
                source=post.get("source", ""),
                author=post.get("author", ""),
                similar_posts=rag_context["similar_posts"],
                detection_score=detection.score,
            )

            update_post_signal(post_id, signal.score, signal.is_signal)

            if not signal.is_signal and detection.score < 0.3:
                log.debug(f"  Filtered as noise (score: {signal.score})")
                continue

            # Layer 3 — RAG + LLM
            llm_input = build_llm_input(text, detection_dict, signal.to_dict(), rag_context)
            raw_output = await call_llm(llm_input)

            module_output = {
                "mimicry": parse_mimicry(raw_output.get("mimicry", {})),
                "escalation": parse_escalation(raw_output.get("escalation", {})),
                "fingerprint": parse_fingerprint(raw_output.get("fingerprint", {})),
                "consensus": parse_consensus(raw_output.get("consensus", {})),
                "narrative": parse_narrative(raw_output.get("narrative", {})),
            }

            # Layer 4 — Alert Engine
            alert = evaluate_alert(
                post_id=post_id,
                post_text=text,
                detection_output=detection_dict,
                signal_output=signal.to_dict(),
                module_output=module_output,
            )

            # Add to vector store
            add_to_store(post_id, text, {
                "source": post.get("source", ""),
                "author": post.get("author", ""),
                "is_signal": True,
            })

            if alert:
                log.info(f"  🚨 Alert fired: {alert['severity']} — {alert['title']}")
            else:
                log.info(f"  ✅ Signal processed, no alert threshold crossed")

        except Exception as e:
            log.error(f"  Pipeline error on {post.get('id', '?')}: {e}")


# ---------------------------------------------------------------------------
# APP LIFESPAN
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown logic."""
    # Startup
    log.info("=" * 60)
    log.info("ShadowEcho starting...")
    log.info("=" * 60)

    init_db()

    # Start background tasks
    tasks = []
    tasks.append(asyncio.create_task(pipeline_processor()))
    tasks.append(asyncio.create_task(start_telegram_listener()))
    tasks.append(asyncio.create_task(start_tor_crawler()))

    log.info("✅ ShadowEcho ready")

    yield

    # Shutdown
    for task in tasks:
        task.cancel()
    log.info("ShadowEcho shutting down")


# ---------------------------------------------------------------------------
# APP
# ---------------------------------------------------------------------------

app = FastAPI(
    title="ShadowEcho",
    description="Dark web signal intelligence platform — comprehension, not just detection.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routes
app.include_router(dashboard_router)
app.include_router(mirror_router)
app.include_router(notebook_router)
app.include_router(lineup_router)
app.include_router(alerts_router)
app.include_router(feedback_router)


@app.get("/")
async def root():
    return {
        "name": "ShadowEcho",
        "tagline": "Noise doesn't just hide threats — it becomes one.",
        "version": "1.0.0",
        "endpoints": [
            "/api/dashboard",
            "/api/dashboard/analyze",
            "/api/mirror",
            "/api/notebook",
            "/api/lineup",
            "/api/alerts",
            "/api/feedback",
        ],
    }


@app.get("/health")
async def health():
    from db.database import get_connection
    try:
        conn = get_connection()
        conn.execute("SELECT 1")
        conn.close()
        db_ok = True
    except Exception:
        db_ok = False

    return {"status": "ok" if db_ok else "degraded", "database": db_ok}


# ---------------------------------------------------------------------------
# DIRECT RUN
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=API_HOST, port=API_PORT, reload=API_RELOAD)
