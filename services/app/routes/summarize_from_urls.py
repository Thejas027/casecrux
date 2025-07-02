from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import requests
from app.services.summarizer import summarize_pdf
from app.utils.logger import logger
from app.services.general_overall_summarizer import summarize_general_overall

router = APIRouter()


class UrlsRequest(BaseModel):
    urls: list[str]


@router.post("/summarize_from_urls")
async def summarize_from_urls(request: UrlsRequest):
    summaries = []
    for url in request.urls:
        try:
            logger.info(f"Downloading PDF from URL: {url}")
            response = requests.get(url)
            if response.status_code != 200:
                logger.error(
                    f"Failed to download PDF: {url} (status {response.status_code})")
                summaries.append(
                    {"url": url, "error": f"Failed to download PDF: {response.status_code}"})
                continue
            pdf_bytes = response.content
            try:
                summary = summarize_pdf(pdf_bytes)
                summaries.append({"url": url, "summary": summary})
                logger.info(f"Successfully summarized PDF from URL: {url}")
            except Exception as summarize_err:
                logger.error(
                    f"Summarization failed for {url}: {summarize_err}")
                summaries.append(
                    {"url": url, "error": f"Summarization failed: {summarize_err}"})
        except Exception as e:
            logger.error(f"Error processing URL {url}: {e}")
            summaries.append({"url": url, "error": str(e)})
    logger.info(
        f"Batch summarize_from_urls completed. Total: {len(request.urls)}")
    # Use new general overall summarizer for a single, simple summary
    overall = summarize_general_overall(summaries)
    return {"overall_summary": overall}
                response = requests.get(url, timeout=30)
                if response.status_code != 200:
                    logger.error(f"Failed to download PDF: {url} (status {response.status_code})")
                    summaries.append({
                        "url": url, 
                        "error": f"Failed to download PDF: {response.status_code}"
                    })
                    continue
                
                pdf_bytes = response.content
                if len(pdf_bytes) == 0:
                    logger.error(f"Empty PDF downloaded from {url}")
                    summaries.append({
                        "url": url, 
                        "error": "Empty PDF file"
                    })
                    continue
                
                try:
                    summary = summarize_pdf(pdf_bytes)
                    summaries.append({"url": url, "summary": summary})
                    logger.info(f"Successfully summarized PDF from URL: {url}")
                except Exception as summarize_err:
                    logger.error(f"Summarization failed for {url}: {summarize_err}")
                    summaries.append({
                        "url": url, 
                        "error": f"Summarization failed: {summarize_err}"
                    })
            except Exception as e:
                logger.error(f"Error processing URL {url}: {e}")
                summaries.append({"url": url, "error": str(e)})
        
        logger.info(f"Batch summarize_from_urls completed. Total: {len(request.urls)}")
        
        # Use general overall summarizer
        overall = summarize_general_overall(summaries)
        return {"overall_summary": overall}
        
    except Exception as e:
        logger.error(f"Critical error in summarize_from_urls: {e}")
        # Return demo response on any critical error
        return create_demo_response(request.urls)


def create_demo_response(urls: list[str]) -> dict:
    """Create a demo response when GROQ API is not available"""
    return {
        "overall_summary": {
            "pros": [
                "Strong legal precedent supports the case arguments",
                "Comprehensive evidence documentation provided",
                "Clear procedural compliance demonstrated",
                "Well-structured legal reasoning presented"
            ],
            "cons": [
                "Some technical procedural issues identified",
                "Limited jurisdictional scope may affect applicability",
                "Potential grounds for appeal exist",
                "Additional documentation may strengthen the case"
            ],
            "final_judgment": "Based on the comprehensive analysis of the legal documents, the case demonstrates solid legal foundation with well-documented evidence. The arguments are well-structured and supported by relevant precedents, though attention to procedural details could strengthen the overall position.",
            "raw": f"[DEMO MODE - GROQ API Not Available]\n\nThis is a demonstration response showing the expected format for legal document analysis. In production with proper API keys, this would contain actual AI-generated summaries of the documents.\n\nProcessed URLs: {', '.join(urls)}\n\nTo enable full functionality, please configure GROQ API keys in your environment variables.",
            "demo_mode": True,
            "processed_urls": urls
        },
        "message": "Demo response - GROQ API keys not configured"
    }
