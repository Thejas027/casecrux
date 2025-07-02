from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.routes import summarize
from app.routes import summarize_from_urls  
from app.routes import advanced_summarize
from app.utils.logger import logger
import os

# Create FastAPI app
app = FastAPI(
    title="CaseCrux ML Service",
    description="Advanced PDF Summarization Service for Legal Documents",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(summarize.router)
app.include_router(summarize_from_urls.router)
app.include_router(advanced_summarize.router)

@app.get("/")
async def root():
    return {
        "message": "CaseCrux ML Service is running",
        "status": "healthy",
        "version": "1.0.0",
        "endpoints": [
            "/docs",
            "/health", 
            "/summarize",
            "/summarize_from_urls",
            "/advanced_summarize",
            "/compare_summaries",
            "/summary_options",
            "/batch_advanced_summarize"
        ]
    }

@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    try:
        from app.config import get_groq_keys_count, GROQ_API_KEYS
        
        return {
            "status": "healthy",
            "groq_keys_available": len(GROQ_API_KEYS) > 0,
            "groq_keys_count": len(GROQ_API_KEYS),
            "service": "ml-summarization",
            "version": "1.0.0"
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "degraded",
            "groq_keys_available": False,
            "error": str(e),
            "service": "ml-summarization"
        }

logger.info("🚀 CaseCrux ML Service started successfully")
