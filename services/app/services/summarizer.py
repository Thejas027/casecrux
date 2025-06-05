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


def summarize_overall(summaries: list) -> dict:
    summary_texts = []
    for s in summaries:
        text = s.get('summary')
        if isinstance(text, dict):
            text = text.get('output_text', str(text))
        summary_texts.append(f"PDF: {s.get('pdfName', '')}\n{text}")
    joined = "\n\n".join(summary_texts)
    prompt = f'''
Given the following legal case summaries, analyze and return a JSON object with the following keys:
- overall_summary: A detailed and structured overall summary of the cases.
- pros: An array of the pros from the judgments.
- cons: An array of the cons from the judgments.
- final_judgment: For each case, state whether the judgment went in favor of the person or against them, and briefly why.
- acts_used: An array of all legal acts or sections referenced in the cases.

Respond ONLY with a valid JSON object. Example format:
{{
  "overall_summary": "...",
  "pros": ["...", "..."],
  "cons": ["...", "..."],
  "final_judgment": "...",
  "acts_used": ["...", "..."]
}}

Summaries:
{joined}
'''
    llm = ChatGroq(groq_api_key=get_next_groq_api_key(),
                   model_name="llama3-8b-8192")
    doc = Document(page_content=prompt)
    chain = load_summarize_chain(
        llm, chain_type="stuff", combine_prompt=PromptTemplate.from_template("{text}"))
    import json
    result = chain.invoke([doc])
    # Try to parse JSON from the result
    try:
        return json.loads(result)
    except Exception:
        return {"overall_summary": result}
