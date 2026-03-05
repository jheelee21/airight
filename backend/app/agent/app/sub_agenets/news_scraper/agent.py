from google.adk.agents import LlmAgent
from google.adk.tools import google_search

from . import prompt

MODEL = "gemini-2.5-flash"

# NOTE: google_search is a built-in tool and CANNOT be combined with FunctionTools
# (custom tools) in the same agent — Gemini raises INVALID_ARGUMENT if mixed.
# The business profile is fetched by the root_agent via FunctionTool and injected
# into this agent's input as a company_profile JSON object.
news_scraper_agent = LlmAgent(
    model=MODEL,
    name="news_scraping_agent",
    description=(
        "Scrapes recent supply chain news grounded in the manufacturer's profile. "
        "Receives a company_profile JSON from the orchestrator (entities, items, "
        "routes) and uses Google Search to find relevant articles. "
        "Returns a structured JSON with articles and supply-chain signals."
    ),
    instruction=prompt.NEWS_SCRAPING_PROMPT,
    tools=[google_search],
)