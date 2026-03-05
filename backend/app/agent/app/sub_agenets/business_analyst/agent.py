from google.adk.agents import LlmAgent
from google.adk.tools import FunctionTool

from . import prompt
from app.tools.bigtable_tools import get_business_profile

MODEL = "gemini-2.5-flash"

business_analyst_agent = LlmAgent(
    model=MODEL,
    name="business_analyst_agent",
    description=(
        "A highly accurate AI assistant specialized in analyzing mid-market "
        "manufacturing businesses. Uses the Bigtable tool to fetch the "
        "company's full supply-chain profile (entities, items, routes) "
        "before performing any analysis."
    ),
    instruction=prompt.BUSINESS_ANALYSIS_PROMPT,
    tools=[
        FunctionTool(func=get_business_profile),
    ],
)
