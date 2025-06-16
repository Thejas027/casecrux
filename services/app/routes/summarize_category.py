import cloudinary
import cloudinary.api
import cloudinary.uploader
import requests
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.summarizer import summarize_pdf, summarize_overall
import tempfile
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '../../.env'))

router = APIRouter()


class CategoryRequest(BaseModel):
    category: str


@router.post("/summarize_category_overall")
async def summarize_category_overall(request: CategoryRequest):
    category = request.category
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
            resource_type="auto",
            max_results=100
        )
        print("[Cloudinary Debug] resources:", resources)
        pdf_urls = [res['secure_url'] for res in resources.get(
            'resources', []) if res.get('format') == 'pdf']
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


@router.post("/list_pdfs_in_category")
async def list_pdfs_in_category(request: CategoryRequest):
    category = request.category
    cloudinary.config(
        cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
        api_key=os.getenv("CLOUDINARY_API_KEY"),
        api_secret=os.getenv("CLOUDINARY_API_SECRET")
    )
    folder_path = f"pdfs/{category}"
    try:
        resources = cloudinary.api.resources(
            type="upload",
            prefix=folder_path,
            resource_type="auto",
            max_results=100
        )
        pdfs = [
            {
                'public_id': res.get('public_id'),
                'filename': res.get('filename') or res.get('public_id').split('/')[-1],
                'secure_url': res.get('secure_url'),
                'format': res.get('format'),
                'bytes': res.get('bytes'),
                'created_at': res.get('created_at')
            }
            for res in resources.get('resources', []) if res.get('format') == 'pdf'
        ]
        return {"pdfs": pdfs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/summarize_category_download")
async def summarize_category_download(request: CategoryRequest):
    category = request.category
    cloudinary.config(
        cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
        api_key=os.getenv("CLOUDINARY_API_KEY"),
        api_secret=os.getenv("CLOUDINARY_API_SECRET")
    )
    folder_path = f"pdfs/{category}"
    try:
        resources = cloudinary.api.resources(
            type="upload",
            prefix=folder_path,
            resource_type="auto",
            max_results=100
        )
        pdfs = [
            {
                'public_id': res.get('public_id'),
                'filename': res.get('filename') or res.get('public_id').split('/')[-1],
                'secure_url': res.get('secure_url'),
                'format': res.get('format'),
                'bytes': res.get('bytes'),
                'created_at': res.get('created_at')
            }
            for res in resources.get('resources', []) if res.get('format') == 'pdf'
        ]
        if not pdfs:
            raise HTTPException(
                status_code=404, detail="No PDFs found in this category.")
        # Download and summarize each PDF
        summaries = []
        for pdf in pdfs:
            url = pdf['secure_url']
            response = requests.get(url)
            if response.status_code != 200:
                continue
            pdf_bytes = response.content
            summary = summarize_pdf(pdf_bytes)
            summaries.append({
                'pdfName': pdf['filename'],
                'summary': summary
            })
        return {"summaries": summaries}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
