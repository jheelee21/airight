import asyncio
import logging

from google.adk.agents.llm_agent import LlmAgent
from google.adk.tools.agent_tool import AgentTool
from google.adk.tools import FunctionTool

from .sub_agents.news_scraper.agent import news_scraper_agent
from .sub_agents.business_analyst.agent import business_analyst_agent
from .sub_agents.risk_analyst.agent import risk_analyst_agent
from .sub_agents.action_item_creator.agent import action_item_creator_agent
from app.agent.app.tools.bigtable_tools import (
    get_business_profile,
    get_existing_risks,
    get_risks_with_actions,
    create_risks,
    create_news,
)
from . import prompt

logger = logging.getLogger(__name__)
MODEL = "gemini-2.5-flash-lite"


class ThrottledAgentTool(AgentTool):
    """
    AgentTool subclass that sleeps for `pause_seconds` before delegating
    to the wrapped sub-agent.
    """

    def __init__(self, agent, pause_seconds: float = 60.0):
        super().__init__(agent=agent)
        self._pause_seconds = pause_seconds

    async def run_async(self, *, args, tool_context):
        logger.info(
            "ThrottledAgentTool: pausing %.0fs before calling '%s'",
            self._pause_seconds,
            self.agent.name,
        )
        await asyncio.sleep(self._pause_seconds)
        return await super().run_async(args=args, tool_context=tool_context)

root_agent = LlmAgent(
    model=MODEL,
    name="root_agent",
    description="Orchestrating agent for end-to-end supply chain risk detection.",
    instruction=prompt.ROOT_AGENT_PROMPT,
    tools=[
        # ── Bigtable (database) tools — no throttle needed (not LLM calls) ──
        FunctionTool(func=get_business_profile),
        FunctionTool(func=get_risks_with_actions),
        FunctionTool(func=create_risks),
        FunctionTool(func=create_news),      # ← ADDED: persist scraped articles

        # ── Sub-agent delegation ─────────────────────────────────────────────
        ThrottledAgentTool(agent=news_scraper_agent,         pause_seconds=0),
        ThrottledAgentTool(agent=business_analyst_agent,     pause_seconds=0),
        ThrottledAgentTool(agent=risk_analyst_agent,         pause_seconds=0),
        ThrottledAgentTool(agent=action_item_creator_agent,  pause_seconds=0),
    ],
)