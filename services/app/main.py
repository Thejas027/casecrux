from fastapi import FastAPI
from app.routes import summarize
from app.routes import summarize_from_urls
from app.routes import advanced_summarize
from app.routes import summarize_category

app = FastAPI()
app.include_router(summarize.router)
app.include_router(summarize_from_urls.router)
app.include_router(advanced_summarize.router)
app.include_router(summarize_category.router)
