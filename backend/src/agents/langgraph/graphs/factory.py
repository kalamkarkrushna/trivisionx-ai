"""
src/agents/langgraph/graphs/factory.py
Factory for loading the correct LangGraph workflow based on research mode.
"""
from langgraph.graph import StateGraph
from src.core.logger import get_logger

from .research_graph import build_research_graph

logger = get_logger(__name__)

# Cache the compiled graphs
_compiled_graphs = {}

def get_workflow_for_mode(mode: str) -> StateGraph:
    """
    Returns the appropriate compiled LangGraph workflow for the given mode.
    Modes: "research", "summary", "competitive", "technical".
    """
    if mode in _compiled_graphs:
        return _compiled_graphs[mode]

    logger.info(f"Compiling LangGraph workflow for mode: {mode}")

    # For both "simple" (Quick) and "research" (Deep) we route through the main research graph.
    # The planner node will dynamically bypass retrieval for "simple" mode.
    workflow = build_research_graph()

    _compiled_graphs[mode] = workflow
    return workflow
