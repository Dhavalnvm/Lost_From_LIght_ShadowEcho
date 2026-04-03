"""Tests for core/rag.py — requires ChromaDB to have data loaded."""
import sys
sys.path.insert(0, str(__import__("pathlib").Path(__file__).parent.parent))

from core.rag import retrieve_context, build_llm_input


def test_retrieve_context_structure():
    """Test that retrieve_context returns the expected structure."""
    result = retrieve_context("test query about ransomware")
    assert "similar_posts" in result
    assert "context_block" in result
    assert "source_count" in result
    assert "unique_sources" in result
    assert isinstance(result["similar_posts"], list)


def test_build_llm_input():
    """Test that build_llm_input assembles correctly."""
    llm_input = build_llm_input(
        new_post_text="selling access to bank network",
        detection_output={"org_mentions": ["Bank Corp"], "tags": ["org_mention"]},
        signal_output={"score": 0.7, "flags": ["commercial_intent"]},
        rag_context={
            "similar_posts": [],
            "context_block": "No context",
            "source_count": 0,
            "unique_sources": [],
        },
    )
    assert llm_input["new_post"] == "selling access to bank network"
    assert "Bank Corp" in llm_input["detection"]["org_mentions"]


if __name__ == "__main__":
    test_retrieve_context_structure()
    test_build_llm_input()
    print("✅ All RAG tests passed")
