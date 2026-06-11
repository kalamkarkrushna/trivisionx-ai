import asyncio
from langchain_core.messages import HumanMessage
from src.core.llm_factory import get_llm

async def main():
    llm = get_llm(provider="openai", model_name="gpt-4o-mini")
    try:
        async for event in llm.astream_events([HumanMessage(content="hi")], version="v2"):
            if event["event"] == "on_chat_model_start":
                print("START:", event)
    except Exception as e:
        print("ERROR", e)

asyncio.run(main())
