from google.adk.agents import LlmAgent
from google.adk.tools import FunctionTool

from . import prompt
from app.agent.app.tools.bigtable_tools import get_risks_with_actions, create_action_items

MODEL = "gemini-3.1-flash-lite-preview"

action_item_creator_agent = LlmAgent(
    model=MODEL,
    name="action_item_creator_agent",
    description=(
        "A highly accurate AI assistant specialised in creating concrete, prioritised "
        "action items for supply-chain risks. Fetches all existing risks + actions from "
        "the database, generates gap-filling mitigation plans, then persists every "
        "generated action item back to the database via create_action_items."
    ),
    instruction=prompt.ACTION_ITEM_CREATION_PROMPT,
    tools=[
        # Read: fetch risks with their existing actions for de-duplication context
        FunctionTool(func=get_risks_with_actions),
        # Write: persist the generated action items to the database
        FunctionTool(func=create_action_items),
    ],
)