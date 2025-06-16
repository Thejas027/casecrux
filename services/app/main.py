from fastapi import FastAPI
from app.routes import summarize
from app.routes import summarize_category

app = FastAPI()
app.include_router(summarize.router)
app.include_router(summarize_category.router)
