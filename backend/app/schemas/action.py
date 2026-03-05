from pydantic import BaseModel
from typing import Optional


class ActionBase(BaseModel):
    action_type: str
    description: str
    estimated_cost: Optional[float] = None
    expected_impact: Optional[float] = None
    implementation_status: str


class ActionCreate(ActionBase):
    risk_id: int


class ActionSchema(ActionBase):
    id: int
    risk_id: int

    class Config:
        from_attributes = True
