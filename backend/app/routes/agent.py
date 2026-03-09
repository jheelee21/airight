import json
import logging
import re
from uuid import uuid4

from fastapi import APIRouter, HTTPException

from app.schemas.agent import AgentFlowRequest, AgentFlowResponse

router = APIRouter(prefix="/api/agent", tags=["Agent"])
logger = logging.getLogger(__name__)


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


def _extract_business_id(text: str) -> int | None:
    """
    Try two strategies to pull a business_id out of an agent text chunk:

    1. Full JSON parse — works when the agent emits a well-formed object.
    2. Regex scan    — works when the agent emits partial/embedded JSON or
                       the business_id appears inside a larger incomplete blob.
    """
    # Strategy 1: full JSON parse
    try:
        data = json.loads(text)
        if isinstance(data, dict):
            # Top-level key (root agent final output)
            if "business_id" in data:
                return int(data["business_id"])
            # Nested under onboarding summary: { "business": { "id": 42 } }
            business_block = data.get("business") or data.get("onboarding", {}).get("business")
            if isinstance(business_block, dict) and "id" in business_block:
                return int(business_block["id"])
    except Exception:
        pass

    # Strategy 2: regex — handles truncated / streamed JSON blobs
    # Matches: "business_id": 42  or  "id": 42 inside a "business" context
    for pattern in (
        r'"business_id"\s*:\s*(\d+)',
        r'"business"\s*:\s*\{[^}]*"id"\s*:\s*(\d+)',
    ):
        match = re.search(pattern, text)
        if match:
            return int(match.group(1))

    return None


@router.post("/flow", response_model=AgentFlowResponse)
async def run_agent_flow(payload: AgentFlowRequest):
    from google.adk.runners import Runner                   # noqa: PLC0415
    from google.adk.sessions import InMemorySessionService  # noqa: PLC0415
    from google.genai import types                          # noqa: PLC0415
    from app.agent.app.agent import root_agent              # noqa: PLC0415

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
    final_response: str | None = None
    had_unresolved_function_call = False

    try:
        async for event in runner.run_async(
            user_id=user_id,
            session_id=session.id,
            new_message=new_message,
        ):
            if not event.content or not event.content.parts:
                continue

            # Detect function_call parts that were never followed by a result —
            # this is the root cause of the "non-text parts" warning from Gemini.
            part_types = [getattr(p, "function_call", None) for p in event.content.parts]
            if any(part_types) and event.is_final_response():
                had_unresolved_function_call = True
                logger.warning(
                    "Agent emitted an unresolved function_call as its final response. "
                    "The tool was called but the agent loop exited before receiving "
                    "the tool result. This usually means the model timed out or the "
                    "ADK runner hit its turn limit."
                )

            texts = [
                part.text
                for part in event.content.parts
                if getattr(part, "text", None)
            ]
            if not texts:
                continue

            text = "\n".join(texts).strip()
            if not text:
                continue

            events.append(text)

            if event.is_final_response():
                final_response = text

    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"Failed to run agents flow: {exc}"
        )

    # ── business_id extraction ────────────────────────────────────────────────
    # Search every event emitted during the run, not just the final response.
    # This handles the case where the business_analyst_agent logged the id in
    # an intermediate event but the root agent's final turn stalled on a
    # function_call and never emitted a well-formed closing JSON blob.
    biz_id: int | None = None

    # Prefer the final response, then walk events in reverse (most recent first)
    candidates = ([final_response] if final_response else []) + list(reversed(events))
    for chunk in candidates:
        if chunk:
            biz_id = _extract_business_id(chunk)
            if biz_id is not None:
                break

    if biz_id is None:
        # Distinguish between "agent stalled on function_call" vs "truly no data"
        if had_unresolved_function_call:
            detail = (
                "The AI agent called a tool but stalled before receiving its result "
                "(unresolved function_call in final response). This is usually a "
                "model timeout or ADK turn-limit issue — please retry."
            )
        else:
            detail = (
                "AI Agent failed to analyze supply chain. "
                "Please try a more detailed description that includes supplier names, "
                "locations, and what components or products flow between them."
            )
        raise HTTPException(status_code=422, detail=detail)

    return AgentFlowResponse(
        success=True,
        input_mode=input_mode,
        events=events,
        final_response=final_response,
        business_id=biz_id,
    )