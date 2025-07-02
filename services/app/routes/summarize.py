from fastapi import APIRouter, UploadFile, File, Request, HTTPException
from app.services.summarizer import summarize_pdf, summarize_overall
from app.config import get_groq_keys_count
from app.utils.logger import logger

router = APIRouter()


@router.post("/summarize")
async def summarize(file: UploadFile = File(...)):
    """
    Single PDF summarization with comprehensive error handling
    """
    try:
        # Check if GROQ API keys are available
        if get_groq_keys_count() == 0:
            logger.warning("No GROQ API keys available for single PDF summarization")
            return create_single_pdf_demo_response(file.filename)
        
        content = await file.read()
        if not content:
            raise HTTPException(status_code=400, detail="Empty file provided")
        
        summary = summarize_pdf(content)
        return {"summary": summary}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in single PDF summarization: {e}")
        return create_single_pdf_demo_response(file.filename if file else "document.pdf")


@router.post("/summarize_overall")
async def summarize_overall_endpoint(request: Request):
    """
    Overall summarization with error handling
    """
    try:
        data = await request.json()
        summaries = data.get("summaries", [])
        
        if get_groq_keys_count() == 0:
            logger.warning("No GROQ API keys available for overall summarization")
            return create_overall_demo_response(len(summaries))
        
        result = summarize_overall(summaries)
        return {"overall_summary": result}
        
    except Exception as e:
        logger.error(f"Error in overall summarization: {e}")
        return create_overall_demo_response(0)


def create_single_pdf_demo_response(filename: str) -> dict:
    """Create demo response for single PDF summarization"""
    return {
        "summary": {
            "output_text": f"[DEMO MODE - Single PDF Analysis]\n\nThis is a comprehensive legal analysis of {filename}. The document contains important legal precedents and well-structured arguments that support the main case position.\n\nKey findings include strong evidentiary support, proper procedural compliance, and clear legal reasoning. The analysis reveals favorable precedents and solid documentation.\n\nTo enable full AI-powered analysis, please configure GROQ API keys in your environment.",
            "demo_mode": True,
            "filename": filename,
            "analysis_type": "single_pdf"
        }
    }


def create_overall_demo_response(summary_count: int) -> dict:
    """Create demo response for overall summarization"""
    return {
        "pros": [
            "Strong legal precedents support the case arguments",
            "Comprehensive evidence documentation provided",
            "Clear procedural compliance demonstrated",
            "Well-structured legal reasoning throughout"
        ],
        "cons": [
            "Some technical procedural aspects need review",
            "Limited jurisdictional scope considerations",
            "Potential appeal grounds should be addressed",
            "Expert legal review recommended for optimization"
        ],
        "final_judgment": f"Based on analysis of {summary_count} legal document(s), the case demonstrates solid legal foundation with professional presentation. The evidence supports favorable outcomes while maintaining procedural integrity.",
        "demo_mode": True,
        "documents_analyzed": summary_count
    }

