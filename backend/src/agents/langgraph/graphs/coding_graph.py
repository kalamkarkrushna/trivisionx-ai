"""
src/agents/langgraph/graphs/coding_graph.py
Coding/Development workflow:
  planner (smart router) → code_generation → code_review → testing → reporter
"""
from langgraph.graph import StateGraph, END
from src.agents.langgraph.state import AgentState
from src.agents.langgraph.nodes.planner_node import planner_node
from src.agents.langgraph.nodes.code_generation_node import code_generation_node
from src.agents.langgraph.nodes.code_review_node import code_review_node
from src.agents.langgraph.nodes.testing_node import testing_node
from src.agents.langgraph.nodes.report_node import report_node
from src.core.logger import get_logger

logger = get_logger(__name__)


def build_coding_graph() -> StateGraph:
    workflow = StateGraph(AgentState)

    workflow.add_node("planner", planner_node)
    workflow.add_node("code_generation", code_generation_node)
    workflow.add_node("code_review", code_review_node)
    workflow.add_node("testing", testing_node)
    workflow.add_node("reporter", report_node)

    workflow.set_entry_point("planner")

    workflow.add_edge("planner", "code_generation")
    workflow.add_edge("code_generation", "code_review")
    workflow.add_edge("code_review", "testing")
    workflow.add_edge("testing", "reporter")
    workflow.add_edge("reporter", END)

    return workflow.compile()
