from google.adk.agents import LlmAgent
from google.adk.tools import FunctionTool

from . import prompt
from app.agent.app.tools.bigtable_tools import create_supply_chain

MODEL = "gemini-3.1-flash-lite-preview"

# Only one FunctionTool now — create_supply_chain writes the entire graph
# (business + entities + items + routes) in a single atomic DB transaction,
# reducing the BA agent from ~14 LLM turns to 2 (one reasoning turn + one tool call).
business_analyst_agent = LlmAgent(
    model=MODEL,
    name="business_analyst_agent",
    description=(
        "Parses free-text descriptions of a manufacturer's business, supply chain "
        "entities, materials, and logistics routes, then saves them as a complete "
        "structured graph to the database using create_supply_chain. Returns the "
        "saved business_id and all assigned IDs so downstream agents can reference them."
    ),
    instruction=prompt.BUSINESS_ANALYSIS_PROMPT,
    tools=[
        FunctionTool(func=create_supply_chain),
    ],
)