#!/bin/bash
# Production-ready startup script
export PORT=${PORT:-8000}
export HOST=${HOST:-0.0.0.0}

# Start the FastAPI application
uvicorn app.main:app --host $HOST --port $PORT --workers 1
