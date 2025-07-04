from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import logging
from groq import Groq
from app.config import get_next_groq_api_key
import json

router = APIRouter()
logger = logging.getLogger(__name__)

class ChatMessage(BaseModel):
    role: str  # 'system', 'user', 'assistant'
    content: str

class ChatCompletionRequest(BaseModel):
    messages: List[ChatMessage]
    max_tokens: Optional[int] = 800
    temperature: Optional[float] = 0.7
    model: Optional[str] = "llama3-8b-8192"

@router.post("/chat_completion")
async def chat_completion(request: ChatCompletionRequest):
    """
    Generate AI chat completion using GROQ API for the CaseCrux legal assistant
    """
    try:
        logger.info(f"🤖 Chat completion request with {len(request.messages)} messages")
        
        # Get GROQ API key
        groq_api_key = get_next_groq_api_key()
        if not groq_api_key:
            logger.error("No GROQ API key available")
            raise HTTPException(status_code=500, detail="AI service configuration error")
        
        # Initialize GROQ client
        client = Groq(api_key=groq_api_key)
        
        # Prepare messages for GROQ API
        groq_messages = []
        for msg in request.messages:
            groq_messages.append({
                "role": msg.role,
                "content": msg.content
            })
        
        logger.info(f"📝 Sending {len(groq_messages)} messages to GROQ API")
        
        # Call GROQ API
        completion = client.chat.completions.create(
            model=request.model,
            messages=groq_messages,
            max_tokens=request.max_tokens,
            temperature=request.temperature,
            stream=False
        )
        
        # Extract response
        response_content = completion.choices[0].message.content
        
        logger.info(f"✅ Chat completion successful, response length: {len(response_content)}")
        
        return {
            "success": True,
            "response": response_content,
            "content": response_content,  # Alternative field name
            "metadata": {
                "model": request.model,
                "tokens_used": completion.usage.total_tokens if hasattr(completion, 'usage') else None,
                "finish_reason": completion.choices[0].finish_reason if completion.choices else None
            }
        }
        
    except Exception as e:
        logger.error(f"❌ Chat completion failed: {str(e)}")
        
        # Return structured error response
        error_response = {
            "success": False,
            "error": "AI chat completion failed", 
            "details": str(e),
            "fallback_response": generate_fallback_response(request.messages)
        }
        
        # Don't raise HTTP exception, return error in response
        return error_response

def generate_fallback_response(messages: List[ChatMessage]) -> str:
    """
    Generate a fallback response when AI service is unavailable
    """
    if not messages:
        return "I'm having trouble processing your request right now. Please try again in a moment."
    
    last_user_message = ""
    for msg in reversed(messages):
        if msg.role == "user":
            last_user_message = msg.content.lower()
            break
    
    # Simple keyword-based responses
    if "summary" in last_user_message or "document" in last_user_message:
        return """## Document Analysis Available 📄

I can help you understand your legal documents, but I'm currently experiencing technical difficulties with the AI service.

**In the meantime, you can:**
- Review your existing document summaries
- Use the translation features  
- Download and export your analyses
- Upload new documents for processing

**Once the AI service is restored, I'll be able to:**
- Answer specific questions about your documents
- Explain complex legal concepts
- Provide detailed analysis and insights
- Offer personalized legal guidance

Please try again in a few minutes, or contact support if the issue persists.

*[Fallback response - AI service temporarily unavailable]*"""
    
    elif "help" in last_user_message or "how" in last_user_message:
        return """## CaseCrux Help Center 🤝

I'm your legal document assistant, though I'm currently running in limited mode due to technical issues.

**CaseCrux Features:**
- **PDF Analysis**: Upload and analyze legal documents
- **Batch Processing**: Analyze multiple documents by category  
- **Translation**: Convert documents to 15+ languages
- **History Tracking**: Access all your past analyses
- **Export Options**: Download summaries and reports

**Navigation:**
- **Home**: Overview and getting started
- **PDF Summarizer**: Individual document analysis
- **Category Batch**: Multi-document processing
- **History**: View past summaries and analyses

**Need immediate help?** Check the existing summaries in your account or try uploading a new document.

*[Fallback response - Full AI assistance will return shortly]*"""
    
    else:
        return """## AI Assistant Temporarily Unavailable 🔧

I'm experiencing technical difficulties and can't provide my full AI-powered assistance right now.

**What's working:**
✅ Document upload and processing
✅ Summary generation and storage  
✅ Translation services
✅ History and export features

**What's affected:**
⚠️ Interactive Q&A about documents
⚠️ Detailed explanations of legal concepts  
⚠️ Personalized legal guidance
⚠️ Complex document analysis

**Quick solutions:**
- Try uploading a document for automated analysis
- Check your existing summaries and history
- Use the translation features for multilingual support

I'll be back to full functionality shortly. Thank you for your patience!

*[Fallback response - Please try again in a few minutes]*"""
