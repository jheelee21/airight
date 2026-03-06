from pydantic import BaseModel, EmailStr
from typing import Optional

class UserRegister(BaseModel):
    admin_name: str
    admin_email: EmailStr
    password: str
    business_id: int
