from langchain.docstore.document import Document
from langchain.prompts import PromptTemplate
from langchain.chains.llm import LLMChain
from langchain_groq import ChatGroq
from app.config import get_next_groq_api_key


def summarize_general_overall(summaries: list) -> dict:
    # summaries: list of dicts with 'summary' (string or dict)
    summary_texts = []
    for s in summaries:
        text = s.get('summary')
        if isinstance(text, dict):
            text = text.get('output_text', str(text))
        summary_texts.append(text)
    joined = "\n\n".join(summary_texts)
    prompt = f'''
Given the following legal case summaries, provide a comprehensive overall summary analyzing the entire set of cases as a whole. 

Create a JSON response with this structure:
{{
  "category_overview": "Brief explanation of what this collection of cases represents",
  "overall_pros": ["Main positive aspects across all cases", "Common favorable outcomes", "Strong legal precedents identified"],
  "overall_cons": ["Main negative aspects across all cases", "Common unfavorable outcomes", "Potential legal risks identified"],
  "final_judgment": "Overall assessment and final judgment about the entire collection (2-3 sentences)",
  "legal_insights": ["Key legal principles that emerge from the collection", "Important trends or patterns observed", "Strategic recommendations for similar cases"],
  "case_count": "Number of cases analyzed",
  "dominant_themes": ["Main legal themes or areas of law covered"]
}}

Provide a TRUE overall summary - not individual case pros/cons, but synthesized insights about the ENTIRE collection. Focus on patterns, trends, and overarching legal principles that emerge when viewing all cases together.

Summaries:
{joined}
'''
    llm = ChatGroq(groq_api_key=get_next_groq_api_key(),
                   model_name="llama3-8b-8192")
    chain = LLMChain(llm=llm, prompt=PromptTemplate.from_template("{text}"))
    import json
    import re
    result = chain.run({"text": prompt})
    # Try to parse as JSON, else return structured fallback
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
        # Return structured fallback response
        return {
            "category_overview": "Analysis failed - unable to parse response",
            "overall_pros": ["Analysis could not be completed"],
            "overall_cons": ["Please try again or contact support"],
            "final_judgment": "Overall analysis could not be completed due to parsing error.",
            "legal_insights": ["Please retry the request"],
            "case_count": "Unknown",
            "dominant_themes": ["Analysis incomplete"],
            "raw": result
        }
