from fastapi import FastAPI
from database import engine, Base
from routes import user, business

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.include_router(user.router)
app.include_router(business.router)
