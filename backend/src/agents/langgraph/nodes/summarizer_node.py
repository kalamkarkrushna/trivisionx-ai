"""
src/agents/langgraph/nodes/summarizer_node.py — Summary Agent
=============================================================
Corresponds to "Summary agent" in the image workflow.

Implements the "Generate — GPT-4o + context + citations" pipeline step:
  - Receives all retrieved chunks as structured context
  - Injects conversation history for multi-turn coherence
  - Uses GPT-4o to synthesize a cited, well-structured markdown answer
"""
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from src.agents.langgraph.state import AgentState
from src.services.llm_service import get_chat_llm
from src.core.logger import get_logger

logger = get_logger(__name__)

SUMMARIZER_SYSTEM_RESEARCH = """You are an expert AI Research Analyst (Summary Agent).

Your task is to synthesize retrieved document chunks into a clear, accurate,
well-cited answer to the user's research question.

STRICT RULES:
1. Base your answer ONLY on the provided document context below.
2. NEVER hallucinate or add information not present in the documents.
3. If the context does not contain enough information, say so explicitly.
4. Cite sources inline using the format: [Source: filename, Page X]
5. Use proper markdown formatting.
6. Consider the conversation history to maintain continuity.

CONTEXT (retrieved document chunks):
{context}"""



SUMMARIZER_SYSTEM_SIMPLE = """You are AI Research Assistant, a helpful and knowledgeable AI assistant.

Answer the user's question directly and clearly based on your own knowledge.
Do not mention documents or retrieval — just give a helpful, well-structured response.

RULES:
1. Be concise but thorough.
2. Use markdown formatting where helpful.
3. Consider the conversation history to maintain continuity."""


def _build_context(docs: list) -> str:
    """Format retrieved doc dicts into a numbered, readable context block."""
    if not docs:
        return "No documents were retrieved for this query."

    parts = []
    for i, doc in enumerate(docs):
        meta = doc.get("metadata", {})
        source = meta.get("filename", meta.get("source", f"Document {i + 1}"))
        page = meta.get("page", "")
        chunk_idx = meta.get("chunk_index", "")
        header = f"[{i + 1}] {source}"
        if page not in ("", "N/A", None):
            header += f" — Page {page}"
        if chunk_idx not in ("", "N/A", None):
            header += f" (chunk {chunk_idx})"
        parts.append(f"{header}:\n{doc['page_content']}")

    return "\n\n---\n\n".join(parts)


async def summarizer_node(state: AgentState) -> dict:
    """
    Summary Agent — synthesizes a high-quality answer.
    """
    query = state.get("query", "")
    docs = state.get("retrieved_docs", [])
    history = state.get("history", [])
    mode = state.get("mode", "research")

    logger.info(
        f"[Summary Agent] Mode='{mode}' | Synthesizing {len(docs)} chunks "
        f"(history={len(history)} turns) for '{query[:60]}'"
    )

    # ── Choose system prompt and model based on mode ──────────────────────────
    if mode == "simple" or mode == "summary":
        system_prompt = SUMMARIZER_SYSTEM_SIMPLE
        llm = get_chat_llm(model_name="gemini-1.5-flash", temperature=0.5)
        history_turns = 2
    else:
        if not docs:
            return {"summary": "No information found in the documents to answer this query.", "current_node": "summarizer"}
        context = _build_context(docs)
        system_prompt = SUMMARIZER_SYSTEM_RESEARCH.format(context=context)
        llm = get_chat_llm()
        history_turns = 6

    messages = [SystemMessage(content=system_prompt)]

    # Inject conversation history
    for turn in history[-history_turns:]:
        role = turn.get("role", "")
        content = turn.get("content", "")
        if role == "user":
            messages.append(HumanMessage(content=content))
        elif role == "assistant":
            messages.append(AIMessage(content=content))

    messages.append(HumanMessage(content=query))

    try:
        response = await llm.ainvoke(messages)
        summary_text = response.content
    except Exception as e:
        logger.error(f"Gemini API error in summarizer: {e}")
        
        # Check if it's the daily limit
        if "PerDayPerProjectPerModel" in str(e):
            summary_text = "Daily AI quota exhausted. Please upgrade your billing plan or wait for the quota to reset."
        elif "503" in str(e) or "UNAVAILABLE" in str(e).upper():
            summary_text = "The AI provider (Gemini) is currently experiencing high demand. Spikes in demand are usually temporary. Please wait a moment and try again."
        else:
            summary_text = f"The AI provider encountered an error. Please try again later. ({str(e)[:50]}...)"

    logger.info(
        f"[Summary Agent] Generated {len(summary_text)} char response"
    )

    return {
        "summary": summary_text,
        "current_node": "summarizer",
    }
