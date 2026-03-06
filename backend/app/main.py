from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routes import user, business

Base.metadata.create_all(bind=engine)

API_URL = "airight-api.vercel.app"
APP_URL = "airight.vercel.app"

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", f"https://{APP_URL}", f"https://{API_URL}"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user.router)
app.include_router(business.router)
