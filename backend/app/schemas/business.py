from typing import Optional, List
from pydantic import BaseModel


class BusinessUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    product_lines: Optional[str] = None
    competitors: Optional[str] = None
    regional_focus: Optional[str] = None


class BusinessResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    product_lines: Optional[str] = None
    competitors: Optional[str] = None
    regional_focus: Optional[str] = None

    class Config:
        from_attributes = True


class EntitySchema(BaseModel):
    id: int
    business_id: int
    category: str
    name: str
    description: str
    location: str

    class Config:
        from_attributes = True


class RouteSchema(BaseModel):
    id: int
    business_id: int
    name: str
    description: str
    start_entity_id: int
    end_entity_id: int
    item_id: int
    transportation_mode: str
    lead_time: int
    cost: int

    class Config:
        from_attributes = True


class GraphResponse(BaseModel):
    business_id: int
    nodes: List[EntitySchema]
    edges: List[RouteSchema]
