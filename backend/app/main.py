from fastapi import FastAPI
from database import engine, Base
from routes import users, business

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.include_router(users.router)
app.include_router(business.router)
