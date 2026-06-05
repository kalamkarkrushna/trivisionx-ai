from pydantic import BaseModel
from typing import Optional, Literal

class QueryRequest(BaseModel):
    msg: str
    conversation_id: Optional[str] = None
    # "research" = full RAG pipeline (planner → retriever → citation → summarizer → reporter)
    # "simple"   = skip RAG, answer directly from LLM (planner skipped / forced no-retrieval)
    mode: Literal["research", "simple"] = "research"
