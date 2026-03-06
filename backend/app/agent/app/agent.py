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
)
from . import prompt

logger = logging.getLogger(__name__)
MODEL = "gemini-3.1-flash-lite-preview"


class ThrottledAgentTool(AgentTool):
    """
    AgentTool subclass that sleeps for `pause_seconds` before delegating
    to the wrapped sub-agent.

    This inserts a mandatory pause at the ADK framework level — between the
    moment root_agent finishes one sub-agent call and the moment the next
    one starts — so that the cumulative request rate stays under the
    15 RPM limit imposed by gemini-3.1-flash-lite-preview.

    Why here and not in the prompt:
        Prompt-level "wait" instructions are ignored by the model.
        ADK's internal event loop calls tool.run_async() synchronously
        from root_agent's perspective, so sleeping here blocks the entire
        pipeline turn — exactly what we want.
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

        # ── Sub-agent delegation — each pauses 60 s before firing ──────────
        ThrottledAgentTool(agent=news_scraper_agent,         pause_seconds=0),
        ThrottledAgentTool(agent=business_analyst_agent,     pause_seconds=0),
        ThrottledAgentTool(agent=risk_analyst_agent,         pause_seconds=0),
        ThrottledAgentTool(agent=action_item_creator_agent,  pause_seconds=0),
    ],
)
