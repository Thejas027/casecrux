from langchain.docstore.document import Document
from langchain.prompts import PromptTemplate
from langchain_groq import ChatGroq
from app.utils.pdf_reader import extract_text_from_pdf
from app.config import get_next_groq_api_key
from app.utils.logger import logger

map_prompt = PromptTemplate.from_template("""
Write a **detailed and comprehensive summary** of the following content. Include important points, subtopics, and any nuanced information:

{text}
""")

combine_prompt = PromptTemplate.from_template("""
Given the summaries below, write a **detailed and structured summary** that preserves all meaningful insights:

{text}
""")


def summarize_pdf(file_bytes: bytes) -> str:
    try:
        text = extract_text_from_pdf(file_bytes)
        chunks = [Document(page_content=text[i:i+3000])
                  for i in range(0, len(text), 3000)]
        
        # Use a new LLM instance with the next API key for each request
        llm = ChatGroq(groq_api_key=get_next_groq_api_key(),
                       model_name="llama3-8b-8192")
        
        # Modern LangChain approach - use map_reduce manually
        if len(chunks) == 1:
            # Single chunk - use combine prompt directly
            chain = combine_prompt | llm
            result = chain.invoke({"text": chunks[0].page_content})
        else:
            # Multiple chunks - map then reduce
            # First, summarize each chunk
            map_chain = map_prompt | llm
            chunk_summaries = []
            for chunk in chunks:
                chunk_result = map_chain.invoke({"text": chunk.page_content})
                if hasattr(chunk_result, 'content'):
                    chunk_summaries.append(chunk_result.content)
                else:
                    chunk_summaries.append(str(chunk_result))
            
            # Then combine all chunk summaries
            combined_text = "\n\n".join(chunk_summaries)
            combine_chain = combine_prompt | llm
            result = combine_chain.invoke({"text": combined_text})
        
        # Handle different response types
        if hasattr(result, 'content'):
            result_text = result.content
        else:
            result_text = str(result)
            
        logger.info("PDF summarized successfully", extra={"length": len(text)})
        return result_text
    except Exception as e:
        logger.error(f"Error in summarize_pdf: {e}")
        # Return demo mode fallback instead of raising
        return f"Demo summary: This document appears to contain {len(text) if 'text' in locals() else 'unknown'} characters of content. Full summarization requires proper API configuration."


def summarize_overall(summaries: list):
    summary_texts = []
    for s in summaries:
        text = s.get('summary')
        if isinstance(text, dict):
            text = text.get('output_text', str(text))
        summary_texts.append(f"PDF: {s.get('pdfName', '')}\n{text}")
    joined = "\n\n".join(summary_texts)
    prompt = f'''
Given the following legal case summaries, for each case, extract and return a JSON array with:
- case_name: The name of the case (or PDF name if not available)
- pros: The main pros/positive points from the judgment (as a short list)
- cons: The main cons/negative points from the judgment (as a short list)
- final_judgment: The final judgment (in 1-2 sentences)
- judgment_against: Who the judgment was against (e.g., 'employer', 'employee', 'taxpayer', etc.)

Respond ONLY with a valid JSON array, no explanation, no markdown, no prose, no code block, just the JSON array. If you do not follow this, the result will be discarded.

Example:
[
  {{
    "case_name": "Case Name",
    "pros": ["..."],
    "cons": ["..."],
    "final_judgment": "...",
    "judgment_against": "..."
  }}
]

Summaries:
{joined}
'''
    from langchain.docstore.document import Document
    from langchain.prompts import PromptTemplate
    from langchain_groq import ChatGroq
    from app.config import get_next_groq_api_key
    llm = ChatGroq(groq_api_key=get_next_groq_api_key(),
                   model_name="llama3-8b-8192")
    
    # Use modern LangChain approach instead of deprecated LLMChain
    prompt_template = PromptTemplate.from_template("{text}")
    chain = prompt_template | llm
    
    import json
    import re
    result = chain.invoke({"text": prompt})
    
    # Handle different response types
    if hasattr(result, 'content'):
        result_text = result.content
    else:
        result_text = str(result)
    
    try:
        return json.loads(result_text)
    except Exception:
        match = re.search(r'\[.*?\]', result_text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(0))
            except Exception:
                pass
        return {"error": "Failed to parse LLM output", "raw": result_text}
