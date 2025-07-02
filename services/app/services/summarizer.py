from langchain.docstore.document import Document
from langchain.prompts import PromptTemplate
from langchain.chains.summarize import load_summarize_chain
from langchain_groq import ChatGroq
from app.utils.pdf_reader import extract_text_from_pdf
from app.config import get_next_groq_api_key
from app.utils.logger import logger

map_prompt = PromptTemplate.from_template("""
Analyze the following legal document content and provide a comprehensive summary with clear structure:

**DOCUMENT ANALYSIS:**
1. **Case Overview**: Brief description of what this document is about
2. **Key Legal Points**: Main legal concepts, statutes, or precedents mentioned
3. **Important Facts**: Relevant factual information and evidence
4. **Pros (Positive Aspects)**: Favorable points, strong arguments, supporting evidence
5. **Cons (Negative Aspects)**: Weaknesses, potential issues, opposing arguments
6. **Legal Reasoning**: Court's or party's analysis and logic
7. **Outcome/Decision**: Final ruling, recommendation, or conclusion

Provide detailed analysis with specific legal terminology and comprehensive insights.

Content: {text}
""")

combine_prompt = PromptTemplate.from_template("""
Based on the legal document analyses below, create a comprehensive summary with this structure:

**EXECUTIVE SUMMARY**: Clear overview of the entire document/case

**KEY LEGAL POINTS**: All important legal concepts, statutes, and precedents

**PROS (Positive Aspects)**:
- Strong arguments and favorable points
- Supporting evidence and precedents
- Advantageous legal positions

**CONS (Negative Aspects)**:
- Weaknesses and potential issues
- Opposing arguments or contrary evidence
- Legal risks or unfavorable precedents

**FACTUAL BACKGROUND**: Relevant facts and evidence presented

**LEGAL REASONING**: Overall analysis and logical reasoning

**FINAL ASSESSMENT**: Conclusion about the legal position, strength of case, and implications

**ADDITIONAL INSIGHTS**:
- Procedural considerations
- Strategic recommendations
- Potential future implications
- Related legal areas

Make this a normal, comprehensive legal summary with proper pros/cons analysis and valuable insights for legal professionals.

Analyses: {text}
""")


def summarize_pdf(file_bytes: bytes) -> str:
    try:
        text = extract_text_from_pdf(file_bytes)
        chunks = [Document(page_content=text[i:i+3000])
                  for i in range(0, len(text), 3000)]
        # Use a new LLM instance with the next API key for each request
        llm = ChatGroq(groq_api_key=get_next_groq_api_key(),
                       model_name="llama3-8b-8192")
        chain = load_summarize_chain(
            llm, chain_type="map_reduce", map_prompt=map_prompt, combine_prompt=combine_prompt)
        result = chain.invoke(chunks)
        logger.info("PDF summarized successfully", extra={"length": len(text)})
        
        # Ensure we return a string for backward compatibility
        if isinstance(result, dict):
            return result.get('output_text', str(result))
        return str(result)
    except Exception as e:
        logger.error(f"Error in summarize_pdf: {e}")
        raise


def summarize_overall(summaries: list):
    summary_texts = []
    for s in summaries:
        text = s.get('summary')
        if isinstance(text, dict):
            text = text.get('output_text', str(text))
        summary_texts.append(f"PDF: {s.get('pdfName', '')}\n{text}")
    joined = "\n\n".join(summary_texts)
    prompt = f'''
Analyze the following collection of legal case summaries and provide a comprehensive overview with detailed insights.

Create a JSON response with this structure:
{{
  "category_explanation": "Explanation of what type of legal cases this collection represents and their common characteristics",
  "individual_cases": [
    {{
      "case_name": "Name of the case or PDF",
      "key_points": ["Main legal points from this case"],
      "pros": ["Positive aspects/favorable outcomes"],
      "cons": ["Negative aspects/unfavorable outcomes"],
      "final_judgment": "Brief judgment or outcome",
      "judgment_against": "Who the judgment was against (e.g., employer, employee, taxpayer, etc.)"
    }}
  ],
  "overall_summary": {{
    "dominant_legal_themes": ["Main areas of law represented in this collection"],
    "common_pros": ["Recurring positive patterns across cases"],
    "common_cons": ["Recurring negative patterns across cases"],
    "overall_assessment": "Synthesized judgment about the entire collection (2-3 sentences)",
    "success_rate": "General assessment of favorable vs unfavorable outcomes"
  }},
  "legal_insights": {{
    "key_precedents": ["Important legal precedents established or referenced"],
    "procedural_considerations": ["Important procedural aspects to note"],
    "strategic_recommendations": ["Practical advice for handling similar cases"],
    "emerging_trends": ["Legal trends or patterns observed across the cases"],
    "risk_factors": ["Common risk factors that lead to unfavorable outcomes"]
  }},
  "metadata": {{
    "total_cases": "Number of cases analyzed",
    "analysis_scope": "Brief description of the scope and limitations of this analysis"
  }}
}}

Provide comprehensive analysis that would be valuable for legal professionals handling similar cases. Focus on both individual case details and overarching patterns across the collection.

Summaries:
{joined}
'''
    from langchain.docstore.document import Document
    from langchain.prompts import PromptTemplate
    from langchain.chains.llm import LLMChain
    from langchain_groq import ChatGroq
    from app.config import get_next_groq_api_key
    llm = ChatGroq(groq_api_key=get_next_groq_api_key(),
                   model_name="llama3-8b-8192")
    chain = LLMChain(llm=llm, prompt=PromptTemplate.from_template("{text}"))
    import json
    import re
    result = chain.run({"text": prompt})
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
        # If JSON parsing fails, return a structured error response
        return {
            "error": "Failed to parse LLM output", 
            "raw": result,
            "category_explanation": "Analysis failed - unable to parse response",
            "individual_cases": [],
            "overall_summary": {
                "overall_assessment": "Analysis could not be completed due to parsing error"
            },
            "legal_insights": {
                "strategic_recommendations": ["Please try again or contact support"]
            }
        }
