from google.adk.agents import LlmAgent
from google.adk.tools import FunctionTool, google_search

from . import prompt
from app.tools.bigtable_tools import get_business_profile, get_existing_risks

MODEL = "gemini-2.5-flash"

risk_analyst_agent = LlmAgent(
    model=MODEL,
    name="risk_analyst_agent",
    description=(
        "A highly accurate AI assistant specialized in analyzing and identifying "
        "potential risks in the supply chain. Uses the Bigtable tool to retrieve "
        "the business's supplier list, BOM, and historical risk data, and Google "
        "Search to gather supplementary market intelligence."
    ),
    instruction=prompt.RISK_ANALYSIS_PROMPT,
    tools=[
        FunctionTool(func=get_business_profile),
        FunctionTool(func=get_existing_risks),
        google_search,
    ],
)
