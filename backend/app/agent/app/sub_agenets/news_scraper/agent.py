from google.adk.agents import LlmAgent

from . import prompt
from google.adk.tools import google_search

MODEL = "gemini-3.1-flash-lite-preview"

news_scraper_agent = LlmAgent(
    model=MODEL,
    name="news_scraping_agent",
    description="A highly accurate AI assistant specialized in scraping and analyzing recent news articles.",
    instruction=prompt.NEWS_SCRAPING_PROMPT,
    tools=[google_search],
)
