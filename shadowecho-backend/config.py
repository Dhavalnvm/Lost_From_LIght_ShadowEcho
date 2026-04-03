"""
ShadowEcho — Central Configuration
All paths, model names, thresholds, and env vars in one place.
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
# LLM (Ollama)
# ---------------------------------------------------------------------------

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")
LLM_TEMPERATURE = 0.3
LLM_MAX_TOKENS = 4096
LLM_TIMEOUT = 60  # seconds

# ---------------------------------------------------------------------------
# EMBEDDINGS (BGE-M3)
# ---------------------------------------------------------------------------

EMBEDDING_MODEL = "BAAI/bge-m3"
EMBEDDING_BATCH_SIZE = 32
EMBEDDING_MAX_LENGTH = 512

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

# Organization names to watch — analyst configures these
DEFAULT_ORG_WATCHLIST = os.getenv("ORG_WATCHLIST", "").split(",") if os.getenv("ORG_WATCHLIST") else []

# ---------------------------------------------------------------------------
# TOR
# ---------------------------------------------------------------------------

TOR_SOCKS_PROXY = os.getenv("TOR_SOCKS_PROXY", "socks5h://127.0.0.1:9050")

# ---------------------------------------------------------------------------
# TELEGRAM
# ---------------------------------------------------------------------------

TELEGRAM_API_ID = os.getenv("TELEGRAM_API_ID", "")
TELEGRAM_API_HASH = os.getenv("TELEGRAM_API_HASH", "")
TELEGRAM_CHANNELS = os.getenv("TELEGRAM_CHANNELS", "").split(",") if os.getenv("TELEGRAM_CHANNELS") else []

# ---------------------------------------------------------------------------
# REDDIT
# ---------------------------------------------------------------------------

REDDIT_CLIENT_ID = os.getenv("REDDIT_CLIENT_ID", "")
REDDIT_CLIENT_SECRET = os.getenv("REDDIT_CLIENT_SECRET", "")
REDDIT_USER_AGENT = os.getenv("REDDIT_USER_AGENT", "ShadowEcho/1.0")
REDDIT_SUBREDDITS = ["darkweb", "netsec", "cybersecurity", "malware"]

# ---------------------------------------------------------------------------
# API
# ---------------------------------------------------------------------------

API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", "8000"))
API_RELOAD = os.getenv("API_RELOAD", "true").lower() == "true"
