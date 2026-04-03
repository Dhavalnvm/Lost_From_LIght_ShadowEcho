# ShadowEcho Backend

AI-powered cyber intelligence backend for detecting, analyzing, and tracking threat signals from dark web and open-source channels.

---

## Setup

```bash
cd shadowecho-backend
cp .env.example .env          # Fill in API keys, configs
pip install -r requirements.txt
python db/database.py         # Initialize SQLite database
```

---

## Data Pipeline

Scraping is handled externally. This pipeline processes and loads data.

```bash
# Scrapers (run by data pipeline / teammate)
python data/scrapers/tor_scraper.py
python data/scrapers/telegram_scraper.py
python data/scrapers/reddit_scraper.py

# Processing + normalization
python data/process_raw.py

# Load into vector DB (ChromaDB)
python data/chroma_loader.py --test
```

---

## Run the Server

```bash
python main.py
```

Or using Uvicorn (recommended for development):

```bash
uvicorn main:app --reload
```

---

## Run Tests

```bash
python tests/test_detector.py
python tests/test_signal_filter.py
python tests/test_alert_engine.py
```

---

## Architecture Overview

* API Layer → FastAPI routes (`/api/*`)
* Core Pipeline
  Detection → Signal Filtering → RAG → LLM → Alert Engine
* Modules
  Mimicry, Escalation, Fingerprint, Consensus, Narrative
* Vector Store
  ChromaDB (semantic retrieval)
* Streaming
  Telegram + Tor ingestion
* Database
  SQLite (alerts, posts, actors, feedback)

---

## Environment Variables

Create a `.env` file with:

```
OPENAI_API_KEY=
OLLAMA_BASE_URL=
TELEGRAM_API_ID=
TELEGRAM_API_HASH=
TOR_PROXY=socks5://127.0.0.1:9050
```

---

## Project Structure

```
shadowecho-backend/
├── api/              # FastAPI routes + schemas
├── core/             # Detection, RAG, LLM pipeline
├── modules/          # Post-LLM reasoning modules
├── db/               # Database models + CRUD
├── stream/           # Real-time ingestion
├── data/             # Scrapers + processing
├── vectorstore/      # ChromaDB
├── prompts/          # LLM prompts
└── tests/            # Unit tests
```

---

## Notes

* Use `--test` flag in `chroma_loader.py` to validate embedding pipeline.
* Ensure Tor is running locally for `.onion` scraping.
* LLM runs via Ollama (llama3) by default.

---

## TODO (Optional Enhancements)

* [ ] Add WebSocket support for live alerts
* [ ] Deploy with Docker
* [ ] Add authentication layer
* [ ] Integrate Kafka for streaming

---

## Authors

ShadowEcho Team
