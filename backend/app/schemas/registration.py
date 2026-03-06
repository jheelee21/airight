from pydantic import BaseModel, EmailStr
from typing import Optional

class UserRegister(BaseModel):
    business_name: str
    admin_name: str
    admin_email: EmailStr
    password: str
