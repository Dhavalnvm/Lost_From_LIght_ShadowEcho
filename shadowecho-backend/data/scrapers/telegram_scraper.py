"""
ShadowEcho — Telegram Scraper (Pre-hackathon)
Bulk scrapes historical messages from Telegram channels.
Run before the hackathon to build the corpus.

Usage: python data/scrapers/telegram_scraper.py
"""

import json
import hashlib
import asyncio
import logging
from pathlib import Path
from datetime import datetime, timezone

from config import TELEGRAM_API_ID, TELEGRAM_API_HASH, TELEGRAM_CHANNELS

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("telegram_scraper")

RAW_DIR = Path(__file__).parent.parent / "raw" / "telegram"
MESSAGES_PER_CHANNEL = 500  # adjust as needed


async def scrape_telegram():
    if not TELEGRAM_API_ID or not TELEGRAM_API_HASH:
        log.error("Set TELEGRAM_API_ID and TELEGRAM_API_HASH in .env")
        return

    if not TELEGRAM_CHANNELS:
        log.error("Set TELEGRAM_CHANNELS in .env (comma-separated)")
        return

    try:
        from telethon import TelegramClient
    except ImportError:
        log.error("Install telethon: pip install telethon")
        return

    RAW_DIR.mkdir(parents=True, exist_ok=True)
    client = TelegramClient("scraper_session", int(TELEGRAM_API_ID), TELEGRAM_API_HASH)
    await client.start()

    total = 0

    for channel in TELEGRAM_CHANNELS:
        channel = channel.strip()
        if not channel:
            continue

        log.info(f"Scraping: {channel}")
        posts = []

        try:
            async for message in client.iter_messages(channel, limit=MESSAGES_PER_CHANNEL):
                text = message.text or ""
                if len(text) < 10:
                    continue

                sender = await message.get_sender()
                author = getattr(sender, "username", None) or str(getattr(sender, "id", "unknown"))

                posts.append({
                    "id": hashlib.sha256(f"telegram:{text[:200]}".encode()).hexdigest()[:16],
                    "source": "telegram",
                    "forum_type": "telegram",
                    "title": "",
                    "body": text,
                    "author": author,
                    "timestamp": message.date.isoformat() if message.date else "",
                    "url": "",
                    "channel": channel,
                    "scraped_at": datetime.now(timezone.utc).isoformat(),
                })

            if posts:
                safe_name = channel.replace("/", "_").replace("@", "")
                ts = datetime.now().strftime("%Y%m%d_%H%M%S")
                filepath = RAW_DIR / f"{safe_name}_{ts}.json"
                with open(filepath, "w", encoding="utf-8") as f:
                    json.dump(posts, f, indent=2, ensure_ascii=False)
                log.info(f"  Saved {len(posts)} messages → {filepath}")
                total += len(posts)

        except Exception as e:
            log.error(f"  Failed on {channel}: {e}")

    await client.disconnect()
    log.info(f"✅ Done. Total messages scraped: {total}")


if __name__ == "__main__":
    asyncio.run(scrape_telegram())
