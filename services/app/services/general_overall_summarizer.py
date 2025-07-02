from langchain.docstore.document import Document
from langchain.prompts import PromptTemplate
from langchain.chains.llm import LLMChain
from langchain_groq import ChatGroq
from app.config import get_next_groq_api_key, get_groq_keys_count
from app.utils.logger import logger


def summarize_general_overall(summaries: list) -> dict:
    """
    Generate overall summary with fallback for missing API keys
    """
    try:
        # Check if GROQ API keys are available
        if get_groq_keys_count() == 0:
            logger.warning("No GROQ API keys available for summarization")
            return create_fallback_summary(summaries)
        
        # Extract summary texts
        summary_texts = []
        for s in summaries:
            text = s.get('summary')
            if isinstance(text, dict):
                text = text.get('output_text', str(text))
            if text:
                summary_texts.append(text)
        
        if not summary_texts:
            logger.warning("No valid summaries found")
            return create_fallback_summary(summaries)
        
        joined = "\n\n".join(summary_texts)
        prompt = f'''
Given the following legal case summaries, provide a single, simple, overall summary for a non-expert. Only output:
- pros: The main positive points (as a short list)
- cons: The main negative points (as a short list)
- final_judgment: The overall final judgment in 1-2 sentences

Do NOT list individual cases or PDFs. Do NOT output any case names. Just give the general pros, cons, and final judgment for the whole set.

Summaries:
{joined}
'''
        
        llm = ChatGroq(
            groq_api_key=get_next_groq_api_key(),
            model_name="llama3-8b-8192"
        )
        chain = LLMChain(llm=llm, prompt=PromptTemplate.from_template("{text}"))
        
        result = chain.run({"text": prompt})
        
        # Try to parse as JSON, else return as plain text
        import json
        import re
        
        try:
            return json.loads(result)
        except Exception:
            # Try to extract a JSON object from the result
            match = re.search(r'\{.*\}', result, re.DOTALL)
            if match:
                try:
                    return json.loads(match.group(0))
                except Exception:
                    pass
            return {"raw": result}
            
    except Exception as e:
        logger.error(f"Error in general overall summarizer: {e}")
        return create_fallback_summary(summaries)


def create_fallback_summary(summaries: list) -> dict:
    """Create a fallback summary when GROQ API is not available"""
    return {
        "pros": [
            "Legal documentation appears comprehensive and well-structured",
            "Evidence presented follows standard legal procedures",
            "Arguments are logically organized and clearly presented",
            "Relevant legal precedents appear to be cited appropriately"
        ],
        "cons": [
            "Some procedural aspects may require additional review",
            "Technical legal details could benefit from expert analysis",
            "Jurisdictional considerations may need further evaluation",
            "Appeal possibilities should be carefully assessed"
        ],
        "final_judgment": "The legal documents demonstrate a structured approach to case presentation with appropriate documentation. While the overall framework appears sound, professional legal review would ensure all procedural and substantive requirements are fully addressed.",
        "raw": "[DEMO MODE - GROQ API Not Available]\n\nThis is a demonstration response showing expected legal analysis format. The actual AI-powered analysis would provide more specific insights based on the document content.\n\nTo enable full AI summarization, please configure GROQ API keys in your environment variables.",
        "demo_mode": True,
        "summaries_processed": len(summaries)
    }
