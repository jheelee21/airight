from google.adk.agents import LlmAgent

from . import prompt

MODEL = "gemini-2.5-flash"

risk_analyst_agent = LlmAgent(
    model=MODEL,
    name="risk_analyst_agent",
    description="A highly accurate AI assistant specialized in analyzing and identifying potential risks in the supply chain based on the business analysis and recent news.",
    instruction=prompt.RISK_ANALYSIS_PROMPT,
    tools=[],
)
