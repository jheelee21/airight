from google.adk.agents.llm_agent import LlmAgent
from google.adk.tools.agent_tool import AgentTool
from .sub_agenets.news_scraper.agent import news_scraper_agent

MODEL = "gemini-2.5-flash"

root_agent = LlmAgent(
    model=MODEL,
    name="root_agent",
    description="A root agent for supply chain risk detection.",
    # prompt="",
    tools=[AgentTool(agent=news_scraper_agent)],
)
