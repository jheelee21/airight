from google.adk.agents.llm_agent import LlmAgent
from google.adk.tools.agent_tool import AgentTool
from google.adk.tools import FunctionTool

from .sub_agenets.news_scraper.agent import news_scraper_agent
from .sub_agenets.business_analyst.agent import business_analyst_agent
from .sub_agenets.risk_analyst.agent import risk_analyst_agent
from .sub_agenets.action_item_creator.agent import action_item_creator_agent
from app.tools.bigtable_tools import (
    get_business_profile,
    get_existing_risks,
    get_risks_with_actions,
)
from . import prompt

MODEL = "gemini-2.5-flash"

# Architecture note
# -----------------
# Gemini does not allow built-in tools (google_search) and custom tools
# (FunctionTool / AgentTool) in the same agent request.
#
# Solution: root_agent owns ALL database FunctionTools and AgentTools.
# Sub-agents that use google_search (news_scraper, risk_analyst) receive
# their database context already injected by root_agent in their input,
# so they never need to call the DB themselves.
#
# Tool ownership per agent:
#   root_agent             → FunctionTool x3 (Bigtable) + AgentTool x4 (sub-agents)
#   news_scraper_agent     → google_search only
#   risk_analyst_agent     → google_search only
#   business_analyst_agent → no tools (pure reasoning on injected context)
#   action_item_creator    → no tools (pure reasoning on injected context)

root_agent = LlmAgent(
    model=MODEL,
    name="root_agent",
    description="Orchestrating agent for end-to-end supply chain risk detection.",
    instruction=prompt.ROOT_AGENT_PROMPT,
    tools=[
        # ── Bigtable (database) tools ──────────────────────────────────────
        # Fetch company profile → inject into news_scraper and risk_analyst
        FunctionTool(func=get_business_profile),
        # Fetch existing risks (optionally filtered by category)
        FunctionTool(func=get_existing_risks),
        # Fetch risks + actions → inject into action_item_creator
        FunctionTool(func=get_risks_with_actions),

        # ── Sub-agent delegation ───────────────────────────────────────────
        AgentTool(agent=news_scraper_agent),
        AgentTool(agent=business_analyst_agent),
        AgentTool(agent=risk_analyst_agent),
        AgentTool(agent=action_item_creator_agent),
    ],
)