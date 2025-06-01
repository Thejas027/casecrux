from fastapi import APIRouter, UploadFile, File
from app.services.summarizer import summarize_pdf

router = APIRouter()

@router.post("/summarize")
async def summarize(file: UploadFile = File(...)):
    content = await file.read()
    summary = summarize_pdf(content)
    return {"summary": summary}
