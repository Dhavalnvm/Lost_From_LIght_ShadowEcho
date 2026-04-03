"""
ShadowEcho — Main Application
FastAPI app that mounts all routes and starts background stream processors.

Models:
  - llama3.1:8b  → pipeline (5 intelligence modules) — GPU
  - llama3.2:3b  → chatbot (analyst Q&A)             — CPU
  - bge-m3:567m  → embeddings (via Ollama)

Run: python main.py
"""

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import (
    API_HOST, API_PORT, API_RELOAD,
    OLLAMA_BASE_URL,           # ← used in health check (not hardcoded)
    OLLAMA_MODEL, CHATBOT_MODEL, EMBEDDING_MODEL,
)
from db.database import init_db

# ---------------------------------------------------------------------------
# ROUTE IMPORTS
# ---------------------------------------------------------------------------

from api.routes.dashboard import router as dashboard_router
from api.routes.mirror    import router as mirror_router
from api.routes.notebook  import router as notebook_router
from api.routes.lineup    import router as lineup_router
from api.routes.alerts    import router as alerts_router
from api.routes.feedback  import router as feedback_router
from api.routes.chat      import router as chat_router
from api.routes.decode    import router as decode_router   # /api/decode/*
from api.routes.impact    import router as impact_router
from api.routes.report    import router as report_router   # /api/report

# ---------------------------------------------------------------------------
# STREAM IMPORTS
# ---------------------------------------------------------------------------

from stream.telegram_listener import start_telegram_listener, get_next_message
from stream.tor_crawler       import start_tor_crawler

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
    through the full pipeline using llama3.1:8b (GPU).
    """
    from core.detector       import run_detection
    from core.signal_filter  import run_signal_filter
    from core.rag            import retrieve_context, build_llm_input
    from core.llm            import call_llm
    from core.alert_engine   import evaluate_alert
    from core.embeddings     import add_to_store
    from db.crud             import insert_post, update_post_signal
    from modules.mimicry     import parse_mimicry
    from modules.escalation  import parse_escalation
    from modules.fingerprint import parse_fingerprint
    from modules.consensus   import parse_consensus
    from modules.narrative   import parse_narrative

    log.info("Pipeline processor started — waiting for messages...")

    while True:
        post = await get_next_message(timeout=2.0)
        if not post:
            continue

        try:
            text    = post.get("text", post.get("body", ""))
            post_id = post["id"]

            log.info(f"📨 Processing: {post_id} from {post.get('source', '?')}")

            insert_post(post)

            # Layer 1 — Detection
            detection      = run_detection(text)
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

            # Layer 3 — RAG + LLM (llama3.1:8b — GPU)
            llm_input  = build_llm_input(text, detection_dict, signal.to_dict(), rag_context)
            raw_output = await call_llm(llm_input)

            module_output = {
                "mimicry":     parse_mimicry(raw_output.get("mimicry", {})),
                "escalation":  parse_escalation(raw_output.get("escalation", {})),
                "fingerprint": parse_fingerprint(raw_output.get("fingerprint", {})),
                "consensus":   parse_consensus(raw_output.get("consensus", {})),
                "narrative":   parse_narrative(raw_output.get("narrative", {})),
            }

            # Layer 4 — Alert Engine
            alert = evaluate_alert(
                post_id=post_id,
                post_text=text,
                detection_output=detection_dict,
                signal_output=signal.to_dict(),
                module_output=module_output,
            )

            add_to_store(post_id, text, {
                "source":    post.get("source", ""),
                "author":    post.get("author", ""),
                "is_signal": True,
            })

            if alert:
                log.info(f"  🚨 Alert fired: {alert['severity']} — {alert['title']}")
            else:
                log.info(f"  ✅ Signal processed, no alert threshold crossed")

        except Exception as e:
            log.error(f"  Pipeline error on {post.get('id', '?')}: {e}", exc_info=True)


# ---------------------------------------------------------------------------
# APP LIFESPAN
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("=" * 60)
    log.info("ShadowEcho starting...")
    log.info(f"  Pipeline model : {OLLAMA_MODEL}  (GPU)")
    log.info(f"  Chatbot model  : {CHATBOT_MODEL}  (CPU)")
    log.info(f"  Embedding model: {EMBEDDING_MODEL} (via Ollama)")
    log.info(f"  Ollama URL     : {OLLAMA_BASE_URL}")
    log.info("=" * 60)

    init_db()

    tasks = [
        asyncio.create_task(pipeline_processor()),
        asyncio.create_task(start_telegram_listener()),
        asyncio.create_task(start_tor_crawler()),
    ]

    log.info("✅ ShadowEcho ready")

    yield

    # Cancel and wait for all background tasks to finish cleanly
    for task in tasks:
        task.cancel()
    await asyncio.gather(*tasks, return_exceptions=True)
    log.info("ShadowEcho shutting down")


# ---------------------------------------------------------------------------
# APP
# ---------------------------------------------------------------------------

app = FastAPI(
    title="ShadowEcho",
    description="Dark web signal intelligence platform — comprehension, not just detection.",
    version="1.2.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# MOUNT ROUTES
# ---------------------------------------------------------------------------

app.include_router(dashboard_router)
app.include_router(mirror_router)
app.include_router(notebook_router)
app.include_router(lineup_router)
app.include_router(alerts_router)
app.include_router(feedback_router)
app.include_router(chat_router)
app.include_router(decode_router)   # /api/decode/*
app.include_router(impact_router)
app.include_router(report_router)


# ---------------------------------------------------------------------------
# ROOT & HEALTH
# ---------------------------------------------------------------------------

@app.get("/")
async def root():
    return {
        "name":    "ShadowEcho",
        "tagline": "Noise doesn't just hide threats — it becomes one.",
        "version": "1.2.0",
        "models": {
            "pipeline":   f"{OLLAMA_MODEL} (GPU)",
            "chatbot":    f"{CHATBOT_MODEL} (CPU)",
            "embeddings": EMBEDDING_MODEL,
        },
        "endpoints": [
            "/api/dashboard",
            "/api/dashboard/analyze",
            "/api/mirror",
            "/api/notebook",
            "/api/lineup",
            "/api/alerts",
            "/api/alerts/summary",
            "/api/feedback",
            "/api/chat",
            "/api/chat/stream",
            "/api/decode/dictionary",
            "/api/impact/methodology",
        ],
    }


@app.get("/health")
async def health():
    import httpx
    from db.database import get_connection

    # DB check
    try:
        conn = get_connection()
        conn.execute("SELECT 1")
        conn.close()
        db_ok = True
    except Exception:
        db_ok = False

    # Ollama check — uses OLLAMA_BASE_URL from config, not hardcoded localhost.
    # This matters when Ollama runs in Docker or on a remote host.
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            resp.raise_for_status()
            ollama_ok = True
    except Exception:
        ollama_ok = False

    status = "ok" if (db_ok and ollama_ok) else "degraded"
    return {
        "status":   status,
        "database": db_ok,
        "ollama":   ollama_ok,
        "models": {
            "pipeline":   OLLAMA_MODEL,
            "chatbot":    CHATBOT_MODEL,
            "embeddings": EMBEDDING_MODEL,
        },
    }


# ---------------------------------------------------------------------------
# ENTRY POINT
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=API_HOST,
        port=API_PORT,
        reload=API_RELOAD,
        reload_dirs=["api", "core", "modules", "stream", "db"],
    )