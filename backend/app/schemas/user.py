from pydantic import BaseModel, EmailStr, SecretStr
from datetime import datetime


class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str
    business_id: int


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    business_id: int
    email: EmailStr
    name: str
    created_at: datetime

    class Config:
        from_attributes = True
