from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from .action import ActionSchema


class RiskBase(BaseModel):
    business_id: int
    target_type: str = Field(..., pattern="^(node|route)$")
    target_id: int
    category: str
    severity: float = Field(..., ge=0.0, le=1.0)
    probability: float = Field(..., ge=0.0, le=1.0)
    description: str


class RiskCreate(RiskBase):
    pass


class RiskSchema(RiskBase):
    id: int
    actions: List[ActionSchema] = []

    class Config:
        from_attributes = True


class RiskScore(BaseModel):
    risk_factor_id: int
    score: float  # severity * probability
    status: str  # e.g., low, medium, high
