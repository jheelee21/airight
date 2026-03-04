from fastapi import APIRouter, Depends, HTTPException
from pydantic import SecretStr
from sqlalchemy.orm import Session
from database import get_db
from models.users import User
import schemas

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.post("", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):

    # Check if email already exists
    existing_user = db.query(User).filter(User.email == user.email).first()

    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(email=user.email, name=user.name, password=SecretStr(user.password))

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user
