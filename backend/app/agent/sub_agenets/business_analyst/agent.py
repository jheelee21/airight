from google.adk.agents import LlmAgent

from . import prompt

MODEL = "gemini-2.5-flash"

business_analyst_agent = LlmAgent(
    model=MODEL,
    name="business_analyst_agent",
    description="A highly accurate AI assistant specialized in analyzing mid-market manufacturing business by user input.",
    instruction=prompt.BUSINESS_ANALYSIS_PROMPT,
    tools=[],
)
