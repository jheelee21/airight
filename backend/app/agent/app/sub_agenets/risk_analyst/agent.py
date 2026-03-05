from google.adk.agents import LlmAgent
from google.adk.tools import google_search

from . import prompt

MODEL = "gemini-2.5-flash"

# NOTE: google_search is a built-in tool and CANNOT be combined with FunctionTools.
# The business profile and existing risks are fetched by root_agent via FunctionTool
# and injected into this agent's input as structured context.
risk_analyst_agent = LlmAgent(
    model=MODEL,
    name="risk_analyst_agent",
    description=(
        "Analyzes supply chain risks for a manufacturer. Receives the company's "
        "full profile (entities, items, routes) and existing risks from the "
        "orchestrator, plus scraped news articles. Uses Google Search for "
        "supplementary intelligence. Returns a structured JSON risk report."
    ),
    instruction=prompt.RISK_ANALYSIS_PROMPT,
    tools=[google_search],
)