import cloudinary
import cloudinary.api
import cloudinary.uploader
import requests
from fastapi import APIRouter, HTTPException
from app.services.summarizer import summarize_pdf, summarize_overall
import tempfile
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '../../.env'))

router = APIRouter()


@router.post("/summarize_category_overall")
async def summarize_category_overall(category: str):
    # Configure Cloudinary with environment variables
    cloudinary.config(
        cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
        api_key=os.getenv("CLOUDINARY_API_KEY"),
        api_secret=os.getenv("CLOUDINARY_API_SECRET")
    )
    folder_path = f"pdfs/{category}"
    try:
        # List all PDFs in the folder
        resources = cloudinary.api.resources(
            type="upload",
            prefix=folder_path,
            resource_type="raw",
            max_results=100
        )
        pdf_urls = [res['secure_url'] for res in resources.get(
            'resources', []) if res['format'] == 'pdf']
        if not pdf_urls:
            raise HTTPException(
                status_code=404, detail="No PDFs found in this category.")
        summaries = []
        for url in pdf_urls:
            # Download PDF
            response = requests.get(url)
            if response.status_code != 200:
                continue
            pdf_bytes = response.content
            # Summarize PDF
            summary = summarize_pdf(pdf_bytes)
            summaries.append({
                'pdfName': url.split('/')[-1],
                'summary': summary
            })
        # Get overall summary
        overall = summarize_overall(summaries)
        return {"overall_summary": overall}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
