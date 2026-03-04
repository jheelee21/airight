from pydantic import BaseModel, EmailStr, SecretStr
from datetime import datetime


class UserCreate(BaseModel):
    email: EmailStr
    name: str


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    name: str
    password: SecretStr
    created_at: datetime

    class Config:
        from_attributes = True
