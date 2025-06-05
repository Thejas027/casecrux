from fastapi import APIRouter, UploadFile, File, Request
from app.services.summarizer import summarize_pdf, summarize_overall

router = APIRouter()


@router.post("/summarize")
async def summarize(file: UploadFile = File(...)):
    content = await file.read()
    summary = summarize_pdf(content)
    return {"summary": summary}


@router.post("/summarize_overall")
async def summarize_overall_endpoint(request: Request):
    data = await request.json()
    summaries = data.get("summaries", [])
    result = summarize_overall(summaries)
    return {"overall_summary": result}
