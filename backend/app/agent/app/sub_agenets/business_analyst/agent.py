from google.adk.agents import LlmAgent
from google.adk.tools import FunctionTool

from . import prompt
from app.tools.bigtable_tools import (
    create_business,
    create_entity,
    create_item,
    create_route,
)

MODEL = "gemini-2.5-flash"

# Only FunctionTools here — no google_search, so no INVALID_ARGUMENT mixing error.
# The agent receives free-text company descriptions from the user (via root_agent)
# and uses these four write tools to persist structured records to the database.
business_analyst_agent = LlmAgent(
    model=MODEL,
    name="business_analyst_agent",
    description=(
        "Parses free-text descriptions of a manufacturer's business, supply chain "
        "entities, materials, and logistics routes, then saves them as structured "
        "records to the database using the create_* tools. Returns the saved IDs "
        "so downstream agents can reference them."
    ),
    instruction=prompt.BUSINESS_ANALYSIS_PROMPT,
    tools=[
        FunctionTool(func=create_business),
        FunctionTool(func=create_entity),
        FunctionTool(func=create_item),
        FunctionTool(func=create_route),
    ],
)