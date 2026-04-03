"""
ShadowEcho — Telegram Live Listener
Connects to Telegram channels via Telethon and streams new messages
directly into the analysis pipeline.

Run as a background task alongside FastAPI.
"""

import asyncio
import hashlib
import logging
from datetime import datetime, timezone

from config import TELEGRAM_API_ID, TELEGRAM_API_HASH, TELEGRAM_CHANNELS

log = logging.getLogger("stream.telegram")

# Message queue — pipeline reads from this
message_queue: asyncio.Queue = asyncio.Queue()


async def start_telegram_listener():
    """Start the Telethon listener. Runs as async background task."""
    if not TELEGRAM_API_ID or not TELEGRAM_API_HASH:
        log.warning("Telegram API credentials not configured — listener disabled")
        return

    if not TELEGRAM_CHANNELS:
        log.warning("No Telegram channels configured — listener disabled")
        return

    try:
        from telethon import TelegramClient, events

        client = TelegramClient("shadowecho_session", int(TELEGRAM_API_ID), TELEGRAM_API_HASH)

        @client.on(events.NewMessage(chats=TELEGRAM_CHANNELS))
        async def handler(event):
            """Handle incoming Telegram messages."""
            text = event.message.text or ""
            if len(text) < 10:
                return

            sender = await event.get_sender()
            author = getattr(sender, "username", None) or str(getattr(sender, "id", "unknown"))
            chat = await event.get_chat()
            channel = getattr(chat, "title", str(chat.id))

            post = {
                "id": hashlib.sha256(f"telegram:{text[:200]}".encode()).hexdigest()[:16],
                "source": "telegram",
                "forum_type": "telegram",
                "title": "",
                "body": text,
                "text": text,
                "author": author,
                "timestamp": event.message.date.isoformat() if event.message.date else "",
                "url": "",
                "channel": channel,
                "scraped_at": datetime.now(timezone.utc).isoformat(),
                "metadata": {
                    "char_count": len(text),
                    "has_credentials": False,
                    "has_ioc": False,
                },
            }

            await message_queue.put(post)
            log.info(f"📥 Telegram [{channel}] from {author}: {text[:80]}...")

        log.info(f"Starting Telegram listener on {len(TELEGRAM_CHANNELS)} channels...")
        await client.start()
        await client.run_until_disconnected()

    except ImportError:
        log.error("Telethon not installed. Run: pip install telethon")
    except Exception as e:
        log.error(f"Telegram listener failed: {e}")


async def get_next_message(timeout: float = 1.0) -> dict | None:
    """Get next message from queue (non-blocking with timeout)."""
    try:
        return await asyncio.wait_for(message_queue.get(), timeout=timeout)
    except asyncio.TimeoutError:
        return None
