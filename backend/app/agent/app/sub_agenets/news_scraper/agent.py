from google.adk.agents import LlmAgent
from google.adk.tools import FunctionTool, google_search

from . import prompt
from app.tools.bigtable_tools import get_business_profile

MODEL = "gemini-2.5-flash"

news_scraper_agent = LlmAgent(
    model=MODEL,
    name="news_scraping_agent",
    description=(
        "A highly accurate AI assistant specialized in scraping and analyzing "
        "recent supply chain news. Calls the Bigtable tool first to fetch the "
        "manufacturer's entity list, items, and routes, then uses Google Search "
        "to find relevant articles grounded in that real company data."
    ),
    instruction=prompt.NEWS_SCRAPING_PROMPT,
    tools=[
        FunctionTool(func=get_business_profile),
        google_search,
    ],
)
