from langchain.docstore.document import Document
from langchain.prompts import PromptTemplate
from langchain.chains.summarize import load_summarize_chain
from langchain_groq import ChatGroq
from app.utils.pdf_reader import extract_text_from_pdf
from app.config import get_next_groq_api_key

map_prompt = PromptTemplate.from_template("""
Write a **detailed and comprehensive summary** of the following content. Include important points, subtopics, and any nuanced information:

{text}
""")

combine_prompt = PromptTemplate.from_template("""
Given the summaries below, write a **detailed and structured summary** that preserves all meaningful insights:

{text}
""")


def summarize_pdf(file_bytes: bytes) -> str:
    text = extract_text_from_pdf(file_bytes)
    chunks = [Document(page_content=text[i:i+3000])
              for i in range(0, len(text), 3000)]
    # Use a new LLM instance with the next API key for each request
    llm = ChatGroq(groq_api_key=get_next_groq_api_key(),
                   model_name="llama3-8b-8192")
    chain = load_summarize_chain(
        llm, chain_type="map_reduce", map_prompt=map_prompt, combine_prompt=combine_prompt)
    return chain.invoke(chunks)


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
    from langchain.chains.summarize import load_summarize_chain
    from langchain_groq import ChatGroq
    from app.config import get_next_groq_api_key
    llm = ChatGroq(groq_api_key=get_next_groq_api_key(),
                   model_name="llama3-8b-8192")
    doc = Document(page_content=prompt)
    chain = load_summarize_chain(
        llm, chain_type="stuff", combine_prompt=PromptTemplate.from_template("{text}"))
    import json
    import re
    result = chain.invoke([doc])
    try:
        return json.loads(result)
    except Exception:
        # Try to extract JSON array from output (even if surrounded by text/markdown)
        match = re.search(r'\[.*?\]', result, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(0))
            except Exception:
                pass
        return {"error": "Failed to parse LLM output", "raw": result}
