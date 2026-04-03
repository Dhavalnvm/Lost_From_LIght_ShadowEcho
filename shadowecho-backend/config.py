"""
ShadowEcho — Central Configuration
All paths, model names, thresholds, and env vars in one place.

Models:
  - llama3.1:8b  → pipeline intelligence (5 modules, detection, alerts)
  - llama3.2:3b  → chatbot (analyst Q&A, conversational)
  - bge-m3:567m  → embeddings via Ollama (no FlagEmbedding/torch needed)
"""

import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# ---------------------------------------------------------------------------
# PATHS
# ---------------------------------------------------------------------------

BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"
RAW_DIR = DATA_DIR / "raw"
PROCESSED_DIR = DATA_DIR / "processed"
SYNTHETIC_DIR = DATA_DIR / "synthetic"
CHROMA_DIR = BASE_DIR / "vectorstore" / "chroma_db"
PROMPTS_DIR = BASE_DIR / "prompts"
DB_PATH = BASE_DIR / "db" / "shadowecho.db"

# ---------------------------------------------------------------------------
# LLM — PIPELINE (Ollama — llama3.1:8b)
# Heavy lifting: 5 intelligence modules, structured JSON output
# ---------------------------------------------------------------------------

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.1:8b")
LLM_TEMPERATURE = 0.3
LLM_MAX_TOKENS = 4096
LLM_TIMEOUT = 120  # seconds — 8b model needs more headroom

# ---------------------------------------------------------------------------
# LLM — CHATBOT (Ollama — llama3.2:3b)
# Fast conversational responses for analyst Q&A
# ---------------------------------------------------------------------------

CHATBOT_MODEL = os.getenv("CHATBOT_MODEL", "llama3.2:3b")
CHATBOT_TEMPERATURE = 0.5  # slightly more creative for conversation
CHATBOT_MAX_TOKENS = 2048
CHATBOT_TIMEOUT = 180  # 3b on CPU needs more headroom — 60s was too tight
CHATBOT_CONTEXT_POSTS = 5  # how many RAG posts to inject into chat context

# ---------------------------------------------------------------------------
# EMBEDDINGS — Ollama bge-m3:567m
# No FlagEmbedding/torch dependency — pure HTTP to Ollama
# ---------------------------------------------------------------------------

EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "bge-m3:567m")
EMBEDDING_BATCH_SIZE = 32  # Ollama handles batching internally
EMBEDDING_MAX_LENGTH = 512
EMBEDDING_DIMENSION = 1024  # bge-m3 output dimension

# ---------------------------------------------------------------------------
# CHROMADB
# ---------------------------------------------------------------------------

CHROMA_COLLECTION = "shadowecho_posts"
RAG_TOP_K = 5  # number of similar docs to retrieve

# ---------------------------------------------------------------------------
# SIGNAL FILTER THRESHOLDS
# ---------------------------------------------------------------------------

SIGNAL_THRESHOLD = 0.6          # minimum score to pass signal filter
ALERT_THRESHOLD = 0.75          # minimum score to fire an alert
CRITICAL_ALERT_THRESHOLD = 0.9  # severity = critical

# ---------------------------------------------------------------------------
# DETECTOR
# ---------------------------------------------------------------------------

DEFAULT_ORG_WATCHLIST = os.getenv("ORG_WATCHLIST", "").split(",") if os.getenv("ORG_WATCHLIST") else []

# ---------------------------------------------------------------------------
# TOR
# ---------------------------------------------------------------------------

TOR_SOCKS_PROXY = os.getenv("TOR_SOCKS_PROXY", "socks5h://127.0.0.1:9050")

# ---------------------------------------------------------------------------
# TELEGRAM
# ---------------------------------------------------------------------------

TELEGRAM_API_ID = os.getenv("TELEGRAM_API_ID")
TELEGRAM_API_HASH = os.getenv("TELEGRAM_API_HASH")

channels = os.getenv("TELEGRAM_CHANNELS", "")

TELEGRAM_CHANNELS = [ch.strip() for ch in channels.split(",") if ch.strip()]

# ---------------------------------------------------------------------------
# REDDIT
# ---------------------------------------------------------------------------

# REDDIT
REDDIT_CLIENT_ID = os.getenv("REDDIT_CLIENT_ID", "")
REDDIT_CLIENT_SECRET = os.getenv("REDDIT_CLIENT_SECRET", "")
REDDIT_USER_AGENT = os.getenv("REDDIT_USER_AGENT", "ytbot/1.0 by webmafia01")
REDDIT_REDIRECT_URI = os.getenv("REDDIT_REDIRECT_URI", "https://localhost:8080")
REDDIT_SUBREDDITS = ["darkweb", "netsec", "cybersecurity", "malware"]

# ---------------------------------------------------------------------------
# API
# ---------------------------------------------------------------------------

API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", "8000"))
API_RELOAD = os.getenv("API_RELOAD", "true").lower() == "true"