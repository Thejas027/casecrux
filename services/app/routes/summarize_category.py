try:
    import cloudinary
    import cloudinary.api
    import cloudinary.uploader
    CLOUDINARY_AVAILABLE = True
except ImportError:
    CLOUDINARY_AVAILABLE = False
    print("Warning: Cloudinary not available. Category summarization will use demo mode.")

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


def create_demo_category_response(category: str):
    """Create demo response when Cloudinary is not available"""
    return {
        "overall_summary": {
            "category_explanation": f"[DEMO MODE] This would analyze all PDF documents in the '{category}' category. The system would process each document using advanced AI models to provide comprehensive legal analysis.",
            "individual_cases": [
                {
                    "case_name": f"Demo Case 1 - {category}",
                    "key_points": [
                        "Sample legal issue identification",
                        "Key procedural aspects",
                        "Important evidence review"
                    ],
                    "pros": [
                        "Strong precedent support",
                        "Clear legal framework"
                    ],
                    "cons": [
                        "Limited factual evidence",
                        "Procedural complexity"
                    ],
                    "final_judgment": "Favorable outcome with specific recommendations",
                    "judgment_against": "opposing party"
                },
                {
                    "case_name": f"Demo Case 2 - {category}",
                    "key_points": [
                        "Statutory interpretation issue",
                        "Constitutional considerations",
                        "Burden of proof analysis"
                    ],
                    "pros": [
                        "Well-established case law",
                        "Clear regulatory guidance"
                    ],
                    "cons": [
                        "Conflicting precedents",
                        "Factual disputes"
                    ],
                    "final_judgment": "Mixed outcome requiring further review",
                    "judgment_against": "multiple parties"
                }
            ],
            "overall_summary": {
                "dominant_legal_themes": [
                    f"{category} legal principles",
                    "Procedural compliance",
                    "Evidence standards"
                ],
                "common_pros": [
                    "Consistent legal framework",
                    "Clear regulatory guidance"
                ],
                "common_cons": [
                    "Complex procedural requirements",
                    "Varying factual circumstances"
                ],
                "overall_assessment": f"The {category} cases demonstrate consistent application of legal principles with varying outcomes based on specific factual circumstances.",
                "success_rate": "Moderate - context dependent"
            },
            "legal_insights": {
                "key_precedents": [
                    f"Leading {category} precedent cases",
                    "Relevant statutory framework",
                    "Regulatory interpretations"
                ],
                "procedural_considerations": [
                    "Filing requirements",
                    "Evidence standards",
                    "Timing considerations"
                ],
                "strategic_recommendations": [
                    "Focus on procedural compliance",
                    "Strengthen factual foundation",
                    "Consider alternative approaches"
                ],
                "emerging_trends": [
                    f"Evolution in {category} law",
                    "Changing regulatory landscape",
                    "New precedential developments"
                ],
                "risk_factors": [
                    "Procedural non-compliance",
                    "Insufficient evidence",
                    "Conflicting precedents"
                ]
            },
            "metadata": {
                "total_cases": "2 (demo)",
                "analysis_scope": "Demonstration of category analysis capabilities"
            }
        },
        "demo_mode": True,
        "message": "Cloudinary service not available. This is a demonstration of the category analysis feature."
    }


@router.post("/summarize_category_overall")
async def summarize_category_overall(request: CategoryRequest):
    category = request.category
    
    # Check if Cloudinary is available
    if not CLOUDINARY_AVAILABLE:
        return create_demo_category_response(category)
    
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
    
    # Check if Cloudinary is available
    if not CLOUDINARY_AVAILABLE:
        return {
            "pdfs": [],
            "demo_mode": True,
            "message": "Cloudinary service not available. No PDFs can be listed."
        }
    
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
    
    # Check if Cloudinary is available
    if not CLOUDINARY_AVAILABLE:
        return {
            "summaries": [],
            "demo_mode": True,
            "message": "Cloudinary service not available. No PDFs can be processed."
        }
    
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
