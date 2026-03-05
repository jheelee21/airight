from pydantic import BaseModel
from typing import List, Optional

class EntitySchema(BaseModel):
    id: int
    business_id: int
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
