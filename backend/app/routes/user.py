from fastapi import APIRouter, Depends, HTTPException
from pydantic import SecretStr
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
import app.schemas as schemas

from app.models.business import Business
from app.schemas.registration import UserRegister

router = APIRouter(prefix="/api/user", tags=["User"])


@router.post("/register", response_model=schemas.UserResponse)
def register(reg: UserRegister, db: Session = Depends(get_db)):
    # 1. Check if user already exists
    existing_user = db.query(User).filter(User.email == reg.admin_email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # 2. Check if Business exists
    business = db.query(Business).filter(Business.id == reg.business_id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found. Please run agent flow first.")

    # 3. Create User
    new_user = User(
        email=reg.admin_email,
        name=reg.admin_name,
        password=reg.password,
        business_id=reg.business_id
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user


@router.post("", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        email=user.email,
        name=user.name,
        password=user.password, # In real app, hash this
        business_id=user.business_id
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post("/login", response_model=schemas.UserResponse)
def login(user_login: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_login.email).first()
    if not user or user.password != user_login.password:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    return user
