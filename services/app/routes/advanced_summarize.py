"""
Advanced Summarization API Routes - Lightweight Version
Provides endpoints for multi-level, multi-method PDF summarization
Uses lightweight processing for better performance on resource-constrained systems
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Request
from pydantic import BaseModel
from typing import Optional, Dict, Any
from app.services.lightweight_enhanced_summarizer import lightweight_advanced_summarizer
from app.utils.logger import logger

router = APIRouter()


class SummarizationRequest(BaseModel):
    summary_type: str = 'detailed'  # detailed, concise, executive, technical, bullets
    method: str = 'abstractive'     # abstractive, extractive, hybrid


class ComparisonRequest(BaseModel):
    summary_type: str = 'detailed'


@router.post("/advanced_summarize")
async def advanced_summarize(
    file: UploadFile = File(...),
    summary_type: str = 'detailed',
    method: str = 'abstractive'
):
    """
    Advanced PDF summarization with multiple levels and methods
    
    Parameters:
    - file: PDF file to summarize
    - summary_type: detailed, concise, executive, technical, bullets
    - method: abstractive, extractive, hybrid
    """
    try:
        # Validate parameters
        valid_types = ['detailed', 'concise', 'executive', 'technical', 'bullets']
        valid_methods = ['abstractive', 'extractive', 'hybrid']
        
        if summary_type not in valid_types:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid summary_type. Must be one of: {valid_types}"
            )
        
        if method not in valid_methods:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid method. Must be one of: {valid_methods}"
            )
        
        # Read file content
        content = await file.read()
        
        if not content:
            raise HTTPException(status_code=400, detail="Empty file provided")
        
        logger.info(f"Processing PDF with {method} method, {summary_type} level")
        
        # Generate summary
        result = lightweight_advanced_summarizer.summarize_pdf(
            file_bytes=content,
            summary_type=summary_type,
            method=method
        )
        
        return {
            "success": True,
            "summary": result,
            "metadata": {
                "filename": file.filename,
                "summary_type": summary_type,
                "method": method,
                "file_size": len(content)
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in advanced summarization: {e}")
        raise HTTPException(status_code=500, detail=f"Summarization failed: {str(e)}")


@router.post("/compare_summaries")
async def compare_summaries(
    file: UploadFile = File(...),
    summary_type: str = 'detailed'
):
    """
    Generate all three summary methods (abstractive, extractive, hybrid) for comparison
    
    Parameters:
    - file: PDF file to summarize
    - summary_type: Level of detail (detailed, concise, executive, technical, bullets)
    """
    try:
        # Validate summary type
        valid_types = ['detailed', 'concise', 'executive', 'technical', 'bullets']
        if summary_type not in valid_types:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid summary_type. Must be one of: {valid_types}"
            )
        
        content = await file.read()
        
        if not content:
            raise HTTPException(status_code=400, detail="Empty file provided")
        
        logger.info(f"Generating comparison summaries for {summary_type} level")
        
        # Generate comparison
        result = lightweight_advanced_summarizer.compare_summaries(
            file_bytes=content,
            level=summary_type
        )
        
        return {
            "success": True,
            "comparison": result,
            "metadata": {
                "filename": file.filename,
                "summary_type": summary_type,
                "file_size": len(content)
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in summary comparison: {e}")
        raise HTTPException(status_code=500, detail=f"Comparison failed: {str(e)}")


@router.get("/summary_options")
async def get_summary_options():
    """
    Get available summary types and methods with descriptions
    """
    return {
        "summary_types": {
            "detailed": {
                "name": "Detailed Analysis",
                "description": "Comprehensive legal analysis with full context",
                "icon": "📄",
                "estimated_length": "800-1200 words",
                "best_for": "Complete case understanding"
            },
            "concise": {
                "name": "Concise Summary", 
                "description": "Key points and essential information only",
                "icon": "📝",
                "estimated_length": "200-400 words",
                "best_for": "Quick review and overview"
            },
            "executive": {
                "name": "Executive Summary",
                "description": "Business-focused implications and decisions",
                "icon": "👔", 
                "estimated_length": "300-500 words",
                "best_for": "Leadership and strategic decisions"
            },
            "technical": {
                "name": "Technical Legal",
                "description": "Legal expert analysis with citations",
                "icon": "⚖️",
                "estimated_length": "600-1000 words", 
                "best_for": "Legal professionals and researchers"
            },
            "bullets": {
                "name": "Bullet Points",
                "description": "Scannable key points format",
                "icon": "🔸",
                "estimated_length": "150-300 words",
                "best_for": "Quick scanning and reference"
            }
        },
        "methods": {
            "abstractive": {
                "name": "AI Generated",
                "description": "AI creates new interpretive summary text",
                "icon": "🧠",
                "pros": ["Natural language", "Interpretive analysis", "Contextual connections"],
                "cons": ["May introduce bias", "Requires fact-checking"],
                "best_for": "Understanding implications and analysis"
            },
            "extractive": {
                "name": "Direct Quotes", 
                "description": "Extracts exact sentences from original text",
                "icon": "📋",
                "pros": ["100% accurate to source", "No AI interpretation", "Preserves legal language"],
                "cons": ["Less fluid reading", "May lack connections"],
                "best_for": "Fact verification and exact references"
            },
            "hybrid": {
                "name": "Best of Both",
                "description": "Combines extraction with AI interpretation",
                "icon": "⚡",
                "pros": ["Accuracy + interpretation", "Balanced approach", "Comprehensive"],
                "cons": ["Longer processing time"],
                "best_for": "Most use cases - recommended"
            }
        }
    }


@router.post("/batch_advanced_summarize")
async def batch_advanced_summarize(request: Request):
    """
    Advanced batch summarization for multiple PDFs with consistent parameters
    """
    try:
        data = await request.json()
        
        pdf_urls = data.get("pdf_urls", [])
        summary_type = data.get("summary_type", "detailed")
        method = data.get("method", "abstractive")
        
        if not pdf_urls:
            raise HTTPException(status_code=400, detail="No PDF URLs provided")
        
        # Validate parameters
        valid_types = ['detailed', 'concise', 'executive', 'technical', 'bullets']
        valid_methods = ['abstractive', 'extractive', 'hybrid']
        
        if summary_type not in valid_types:
            raise HTTPException(status_code=400, detail=f"Invalid summary_type")
        if method not in valid_methods:
            raise HTTPException(status_code=400, detail=f"Invalid method")
        
        # Process each PDF (this would integrate with existing batch processing)
        summaries = []
        for url in pdf_urls:
            try:
                # Here you would fetch the PDF from the URL and process it
                # This integrates with your existing PDF fetching logic
                logger.info(f"Processing PDF from URL: {url}")
                
                # Placeholder for actual PDF processing
                summary_result = {
                    "pdf_url": url,
                    "summary_type": summary_type,
                    "method": method,
                    "status": "processed",
                    # "summary": ... (actual summary would go here)
                }
                summaries.append(summary_result)
                
            except Exception as e:
                logger.error(f"Error processing PDF {url}: {e}")
                summaries.append({
                    "pdf_url": url,
                    "status": "error",
                    "error": str(e)
                })
        
        return {
            "success": True,
            "summaries": summaries,
            "metadata": {
                "total_pdfs": len(pdf_urls),
                "summary_type": summary_type,
                "method": method,
                "processed_count": len([s for s in summaries if s.get("status") == "processed"])
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in batch advanced summarization: {e}")
        raise HTTPException(status_code=500, detail=f"Batch processing failed: {str(e)}")
