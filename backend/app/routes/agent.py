from uuid import uuid4

from fastapi import APIRouter, HTTPException
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

from app.agent.app.agent import root_agent
from app.schemas.agent import AgentFlowRequest, AgentFlowResponse

router = APIRouter(prefix="/api/agent", tags=["Agent"])


def _build_prompt(payload: AgentFlowRequest) -> tuple[str, str]:
    if payload.business_id:
        return (
            "business_id",
            (
                "Run the full risk-detection flow for this existing business. "
                f"Business ID: {payload.business_id}."
            ),
        )

    return (
        "company_description",
        (
            "Run the full risk-detection flow for this company description. "
            "If needed, first create or update the structured business graph before "
            "continuing with risk analysis and action planning.\n\n"
            f"Company description:\n{payload.company_description}"
        ),
    )


@router.post("/flow", response_model=AgentFlowResponse)
async def run_agent_flow(payload: AgentFlowRequest):
    input_mode, prompt_text = _build_prompt(payload)

    session_service = InMemorySessionService()
    runner = Runner(
        app_name="airight-agent-api",
        agent=root_agent,
        session_service=session_service,
    )

    user_id = "api-user"
    session = await session_service.create_session(
        app_name="airight-agent-api",
        user_id=user_id,
        session_id=str(uuid4()),
    )

    new_message = types.Content(
        role="user",
        parts=[types.Part(text=prompt_text)],
    )

    events: list[str] = []
    final_response = None

    try:
        async for event in runner.run_async(
            user_id=user_id,
            session_id=session.id,
            new_message=new_message,
        ):
            if not event.content or not event.content.parts:
                continue

            texts = [part.text for part in event.content.parts if getattr(part, "text", None)]
            if not texts:
                continue

            text = "\n".join(texts).strip()
            if not text:
                continue

            events.append(text)

            if event.is_final_response():
                final_response = text
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to run agents flow: {exc}")

    return AgentFlowResponse(
        success=True,
        input_mode=input_mode,
        events=events,
        final_response=final_response,
    )
