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
