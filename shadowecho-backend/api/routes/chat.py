"""
ShadowEcho — Chatbot Route
/api/chat — RAG-powered analyst assistant.

Uses llama3.2:3b for fast conversational responses.
Pulls relevant context from ChromaDB + SQLite to ground answers.
Supports both regular and streaming (SSE) responses.
"""

import json
import logging
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from api.schemas import ChatRequest, ChatResponse
from core.embeddings import query_similar
from core.llm import call_chatbot, stream_chatbot
from db.crud import get_alerts, get_dashboard_stats, search_posts_by_org

log = logging.getLogger("api.chat")
router = APIRouter(prefix="/api/chat", tags=["chatbot"])


def _build_context(message: str) -> str:
    """
    Build RAG context for the chatbot based on the analyst's message.
    Pulls from:
      1. ChromaDB — semantically similar posts
      2. SQLite — recent alerts, stats
      3. SQLite — org mentions if detected
    """
    context_parts = []

    # 1. Vector search — find related intelligence
    similar = query_similar(message, top_k=5)
    if similar:
        context_parts.append("RELATED INTELLIGENCE FROM DATABASE:")
        for i, post in enumerate(similar, 1):
            source = post["metadata"].get("source", "unknown")
            author = post["metadata"].get("author", "anonymous")
            similarity = round(1 - post["distance"], 2)
            doc = post["document"][:400]
            context_parts.append(
                f"  [{i}] source={source}, author={author}, relevance={similarity}\n    {doc}"
            )

    # 2. Recent alerts — give the chatbot awareness of current state
    recent_alerts = get_alerts(limit=5)
    if recent_alerts:
        context_parts.append("\nRECENT ALERTS:")
        for alert in recent_alerts:
            context_parts.append(
                f"  - [{alert.get('severity', '?').upper()}] {alert.get('title', 'untitled')} "
                f"(confidence: {alert.get('confidence', 0):.0%})"
            )

    # 3. Dashboard stats — current situational awareness
    try:
        stats = get_dashboard_stats()
        context_parts.append(
            f"\nCURRENT STATUS: {stats.get('total_posts', 0)} posts ingested, "
            f"{stats.get('signal_posts', 0)} signals detected, "
            f"{stats.get('total_alerts', 0)} alerts ({stats.get('unacknowledged_alerts', 0)} unacked)"
        )
    except Exception:
        pass

    # 4. Org-specific search if the message mentions known patterns
    # Simple heuristic: look for capitalized words that might be org names
    words = message.split()
    for word in words:
        clean = word.strip("?.,!\"'")
        if len(clean) > 2 and clean[0].isupper() and clean not in (
            "What", "How", "Who", "When", "Where", "Why", "Tell", "Show",
            "Find", "Search", "Get", "List", "Any", "Are", "Is", "The",
            "Can", "Could", "Would", "Should", "Has", "Have", "Do", "Does",
        ):
            org_posts = search_posts_by_org(clean, limit=3)
            if org_posts:
                context_parts.append(f"\nMENTIONS OF '{clean}':")
                for post in org_posts:
                    body = post.get("body", "")[:200]
                    context_parts.append(f"  - [{post.get('source', '?')}] {body}")

    return "\n".join(context_parts) if context_parts else ""


@router.post("", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """
    Main chat endpoint — analyst asks, ShadowEcho answers.
    Grounded in real intelligence data via RAG.
    """
    # Build context from intelligence database
    context = _build_context(req.message)

    # Call llama3.2:3b
    result = await call_chatbot(
        message=req.message,
        context=context,
        conversation_history=req.history,
    )

    return ChatResponse(
        response=result["response"],
        model=result["model"],
        context_used=bool(context),
        duration_ms=result.get("total_duration_ms", 0),
    )


@router.post("/stream")
async def chat_stream(req: ChatRequest):
    """
    Streaming chat — tokens arrive in real time via SSE.
    Better UX for longer responses.
    """
    context = _build_context(req.message)

    async def event_generator():
        async for chunk in stream_chatbot(
            message=req.message,
            context=context,
            conversation_history=req.history,
        ):
            data = json.dumps(chunk)
            yield f"data: {data}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/health")
async def chat_health():
    """Check if the chatbot model is available in Ollama."""
    import httpx
    from config import OLLAMA_BASE_URL, CHATBOT_MODEL

    try:
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            resp.raise_for_status()
            models = resp.json().get("models", [])
            model_names = [m.get("name", "") for m in models]

            chatbot_ready = any(CHATBOT_MODEL in name for name in model_names)
            pipeline_ready = any("llama3.1:8b" in name for name in model_names)
            embed_ready = any("bge-m3" in name for name in model_names)

            return {
                "ollama_connected": True,
                "chatbot_model": {"name": CHATBOT_MODEL, "ready": chatbot_ready},
                "pipeline_model": {"name": "llama3.1:8b", "ready": pipeline_ready},
                "embedding_model": {"name": "bge-m3:567m", "ready": embed_ready},
                "available_models": model_names,
            }
    except Exception as e:
        return {
            "ollama_connected": False,
            "error": str(e),
        }
