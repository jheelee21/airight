from google.adk.agents import LlmAgent

from . import prompt

MODEL = "gemini-2.5-flash-lite"

risk_analyst_agent = LlmAgent(
    model=MODEL,
    name="risk_analyst_agent",
    description=(
        "Analyzes supply chain risks for a manufacturer. Receives the company's "
        "full profile (entities, items, routes), existing risks, and pre-scraped "
        "news articles directly from the orchestrator. Returns a structured JSON "
        "risk report in a single reasoning pass — no tool calls required."
    ),
    instruction=prompt.RISK_ANALYSIS_PROMPT,
    tools=[],           # no tools — all context is injected by root_agent
)