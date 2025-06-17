from fastapi import FastAPI
from app.routes import summarize
from app.routes import summarize_from_urls

app = FastAPI()
app.include_router(summarize.router)
app.include_router(summarize_from_urls.router)
