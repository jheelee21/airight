from typing import Optional, List
from pydantic import BaseModel, Field, model_validator


class AgentFlowRequest(BaseModel):
    business_id: Optional[int] = Field(default=None, ge=1)
    company_description: Optional[str] = Field(default=None, min_length=1)

    @model_validator(mode="after")
    def validate_input(self):
        if not self.business_id and not self.company_description:
            raise ValueError("Either business_id or company_description must be provided")
        return self


class AgentFlowResponse(BaseModel):
    success: bool
    input_mode: str
    events: List[str]
    final_response: Optional[str] = None
    business_id: Optional[int] = None