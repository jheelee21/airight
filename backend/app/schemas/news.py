from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class NewsBase(BaseModel):
    title: str
    content: str
    source: str
    url: Optional[str] = None
    published_at: datetime = datetime.now()
    risk_id: Optional[int] = None

class NewsCreate(NewsBase):
    business_id: int

class NewsSchema(NewsBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    business_id: int
