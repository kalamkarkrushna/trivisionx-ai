"""
src/agents/langgraph/nodes/planner_node.py — Research Agent
============================================================
Corresponds to "Research agent" in the image workflow.

Responsibilities:
  - Understand the user's query in context of conversation history
  - Decide whether document retrieval is needed
  - Generate 2–4 targeted search queries that cover different angles
"""
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from pydantic import BaseModel, Field
from typing import List
from src.agents.langgraph.state import AgentState
from src.services.llm_service import get_mini_llm
from src.core.logger import get_logger

logger = get_logger(__name__)


class ResearchPlan(BaseModel):
    retrieval: bool = Field(
        description=(
            "True if the query requires retrieving documents from the vector store. "
            "False for greetings, casual questions, or simple factual queries."
        )
    )
    queries: List[str] = Field(
        description=(
            "2–4 specific, targeted search queries to run against the vector store. "
            "Each query should cover a different angle of the research topic. "
            "Empty list when retrieval=False."
        )
    )
    rationale: str = Field(
        description="Brief explanation of the research strategy chosen."
    )


PLANNER_SYSTEM = """You are a Planning Agent inside a LangGraph multi-agent research system.

Your task is to decide whether retrieval is required and generate search queries.

CRITICAL REQUIREMENTS:

1. Return ONLY valid JSON.
2. Do NOT wrap JSON in markdown.
3. Do NOT use ```json code fences.
4. Do NOT include explanations before or after the JSON.
5. Do NOT include comments.
6. Output must be parseable by Python json.loads().
7. Always return all required fields.

Required schema:

{
"retrieval": true,
"queries": ["query1", "query2"],
"rationale": "reason"
}

Rules:

* For educational, technical, programming, scientific, AI, machine learning, cloud, DevOps, data science, cybersecurity, research, framework, API, model, library, architecture, comparison, tutorial, guide, and explanatory questions:
  retrieval = true

* For greetings, casual chat, arithmetic, and personal opinions:
  retrieval = false

* When retrieval=true generate 3-5 search queries.

Examples:

Input:
What is Python?

Output:
{"retrieval":true,"queries":["Python programming language overview","Python features and applications","Python programming examples"],"rationale":"Educational technical question requiring detailed context."}

Input:
Hello

Output:
{"retrieval":false,"queries":[],"rationale":"Greeting does not require retrieval."}

Remember:
Return ONLY JSON.
No markdown.
No code fences.
No extra text."""


async def planner_node(state: AgentState) -> dict:
    """
    Research Agent — analyzes the query and generates a multi-angle research plan.
    Injects conversation history to handle follow-up queries correctly.

    When mode='simple': immediately returns empty plan → forces direct LLM path.
    When mode='research': runs full RAG-based planning as usual.
    """
    query = state.get("query", "")
    history = state.get("history", [])
    mode = state.get("mode", "research")
    logger.info(f"[Research Agent] Mode='{mode}' | Planning for: '{query[:80]}'")

    # ── Simple/Summary mode: skip RAG planning ────────────────────────────────
    if mode in ("simple", "summary"):
        logger.info(f"[Research Agent] {mode} mode — bypassing retrieval planning")
        return {
            "plan": [],
            "current_node": "planner",
            "errors": [],
        }

    # Fast-path heuristic for simple greetings to save LLM roundtrip latency
    clean_query = query.strip().lower()
    if clean_query in ("hi", "hello", "hey", "hii", "heya", "hola", "sup"):
        logger.info("[Research Agent] Fast-path routing triggered for greeting")
        return {
            "plan": [],
            "terminate": True,
            "final_output": "Hello! How can I help you with your research today?",
            "current_node": "planner",
            "errors": [],
        }

    # Use the mini model for planning (faster, cheaper — structured output)
    llm = get_mini_llm().with_structured_output(ResearchPlan)

    messages = [SystemMessage(content=PLANNER_SYSTEM)]

    # Inject recent conversation history for context-aware planning
    for turn in history[-2:]:  # last 2 turns is sufficient for planning context
        role = turn.get("role", "")
        content = turn.get("content", "")
        if role == "user":
            messages.append(HumanMessage(content=content))
        elif role == "assistant":
            messages.append(AIMessage(content=content))

    messages.append(HumanMessage(content=query))

    try:
        response: ResearchPlan = await llm.ainvoke(messages)
        plan = response.queries if response.retrieval else []
        rationale = response.rationale
        retrieval = response.retrieval
    except Exception as e:
        logger.error(f"Planner LLM failed (API error): {e}")
        # Graceful fallback if the API is overloaded (503)
        plan = []
        retrieval = False
        rationale = "Fallback due to API high demand."

    logger.info(
        f"[Research Agent] retrieval={retrieval}, "
        f"queries={len(plan)}, rationale='{rationale[:60]}'"
    )

    return {
        "plan": plan,
        "current_node": "planner",
        "errors": [],
    }
