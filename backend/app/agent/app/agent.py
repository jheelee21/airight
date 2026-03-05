from google.adk.agents.llm_agent import LlmAgent
from google.adk.tools.agent_tool import AgentTool

from .sub_agenets.news_scraper.agent import news_scraper_agent
from .sub_agenets.business_analyst.agent import business_analyst_agent
from .sub_agenets.risk_analyst.agent import risk_analyst_agent
from .sub_agenets.action_item_creator.agent import action_item_creator_agent
from . import prompt

MODEL = "gemini-2.5-flash"

root_agent = LlmAgent(
    model=MODEL,
    name="root_agent",
    description="Orchestrating agent for end-to-end supply chain risk detection.",
    instruction=prompt.ROOT_AGENT_PROMPT,
    tools=[
        AgentTool(agent=news_scraper_agent),
        AgentTool(agent=business_analyst_agent),
        AgentTool(agent=risk_analyst_agent),
        AgentTool(agent=action_item_creator_agent),
    ],
)
