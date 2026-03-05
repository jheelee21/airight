from google.adk.agents import LlmAgent

from . import prompt

MODEL = "gemini-2.5-flash"

action_item_creator_agent = LlmAgent(
    model=MODEL,
    name="action_item_creator_agent",
    description="A highly accurate AI assistant specialized in creating action items based on the identified risks and business analysis.",
    instruction=prompt.ACTION_ITEM_CREATION_PROMPT,
    tools=[],
)
