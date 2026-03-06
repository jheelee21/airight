from google.adk.agents import LlmAgent
from google.adk.tools import FunctionTool

from . import prompt
from app.agent.app.tools.bigtable_tools import get_risks_with_actions

MODEL = "gemini-3.1-flash-lite-preview"

action_item_creator_agent = LlmAgent(
    model=MODEL,
    name="action_item_creator_agent",
    description=(
        "A highly accurate AI assistant specialized in creating concrete action "
        "items based on identified supply-chain risks. Uses the Bigtable tool to "
        "fetch all risks and their existing mitigation actions so it can generate "
        "prioritised, gap-filling action plans."
    ),
    instruction=prompt.ACTION_ITEM_CREATION_PROMPT,
    tools=[
        FunctionTool(func=get_risks_with_actions),
    ],
)
