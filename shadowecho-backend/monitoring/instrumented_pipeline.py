"""
ShadowEcho — Instrumented Pipeline Processor
Drop-in replacement for the pipeline_processor() function in main.py.
Identical logic, but every stage is timed and every event is recorded.

USAGE: Replace the pipeline_processor() function in main.py with this one.
"""

from monitoring.metrics import (
    PipelineTimer,
    record_post_ingested,
    record_post_processed,
    record_alert,
    record_llm_call,
    record_slang_decoded,
    record_leak_impact,
    signal_score_distribution,
    detection_score_distribution,
    pipeline_total_duration,
)

import time


async def pipeline_processor():
    """
    Background task — reads from message queue, runs full pipeline.
    Every stage timed, every event recorded for Prometheus.
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
    from modules.leak_impact import estimate_leak_impact
    from stream.telegram_listener import get_next_message

    import logging
    log = logging.getLogger("shadowecho")
    log.info("Pipeline processor started — waiting for messages...")

    while True:
        post = await get_next_message(timeout=2.0)
        if not post:
            continue

        pipeline_start = time.perf_counter()

        try:
            text = post.get("text", post.get("body", ""))
            post_id = post["id"]
            source = post.get("source", "unknown")

            log.info(f"📨 Processing: {post_id} from {source}")

            # Record ingestion
            record_post_ingested(source=source)

            # Store in DB
            insert_post(post)

            # Layer 1 — Detection (includes slang decoding)
            with PipelineTimer("detection"):
                detection = run_detection(text)
            detection_dict = detection.to_dict()
            detection_score_distribution.observe(detection.score)

            # Record slang metrics
            slang_data = detection_dict.get("slang", {})
            if slang_data.get("has_coded_language"):
                record_slang_decoded(
                    decoded_terms=slang_data.get("decoded_terms", []),
                    highest_severity=slang_data.get("highest_severity", "low"),
                )

            # Layer 2 — Signal Filter
            with PipelineTimer("rag_retrieval"):
                rag_context = retrieve_context(text)

            with PipelineTimer("signal_filter"):
                signal = run_signal_filter(
                    text=text,
                    source=source,
                    author=post.get("author", ""),
                    similar_posts=rag_context["similar_posts"],
                    detection_score=detection.score,
                )
            signal_score_distribution.observe(signal.score)

            update_post_signal(post_id, signal.score, signal.is_signal)

            if not signal.is_signal and detection.score < 0.3:
                log.debug(f"  Filtered as noise (score: {signal.score})")
                record_post_processed(result="noise")
                continue

            # Layer 3 — RAG + LLM
            llm_start = time.perf_counter()
            with PipelineTimer("llm_call"):
                llm_input = build_llm_input(text, detection_dict, signal.to_dict(), rag_context)
                raw_output = await call_llm(llm_input)
            llm_duration = time.perf_counter() - llm_start

            # Record LLM metrics
            has_error = "_error" in raw_output
            record_llm_call(
                model="llama3.1:8b",
                purpose="pipeline",
                status="error" if has_error else "success",
                duration=llm_duration,
            )

            module_output = {
                "mimicry": parse_mimicry(raw_output.get("mimicry", {})),
                "escalation": parse_escalation(raw_output.get("escalation", {})),
                "fingerprint": parse_fingerprint(raw_output.get("fingerprint", {})),
                "consensus": parse_consensus(raw_output.get("consensus", {})),
                "narrative": parse_narrative(raw_output.get("narrative", {})),
            }

            # Leak Impact Estimation
            with PipelineTimer("leak_impact"):
                leak_impact = estimate_leak_impact(text=text, detection_output=detection_dict)
            module_output["leak_impact"] = leak_impact.to_dict()

            # Record leak impact metrics
            record_leak_impact(
                severity=leak_impact.overall_severity,
                scale=leak_impact.scale_category,
                regulations=leak_impact.applicable_regulations,
            )

            # Layer 4 — Alert Engine
            with PipelineTimer("alert_engine"):
                alert = evaluate_alert(
                    post_id=post_id,
                    post_text=text,
                    detection_output=detection_dict,
                    signal_output=signal.to_dict(),
                    module_output=module_output,
                )

            # Add to vector store
            add_to_store(post_id, text, {
                "source": source,
                "author": post.get("author", ""),
                "is_signal": True,
            })

            # Record results
            record_post_processed(result="signal")

            if alert:
                record_alert(severity=alert.get("severity", "low"))
                log.info(f"  🚨 Alert fired: {alert['severity']} — {alert['title']}")
            else:
                log.info(f"  ✅ Signal processed, no alert threshold crossed")

        except Exception as e:
            record_post_processed(result="error")
            log.error(f"  Pipeline error on {post.get('id', '?')}: {e}")

        finally:
            # Record total pipeline time
            total_time = time.perf_counter() - pipeline_start
            pipeline_total_duration.observe(total_time)