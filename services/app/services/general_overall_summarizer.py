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
Given the following legal case summaries, provide a single, simple, overall summary for a non-expert. Only output:
- pros: The main positive points (as a short list)
- cons: The main negative points (as a short list)
- final_judgment: The overall final judgment in 1-2 sentences

Do NOT list individual cases or PDFs. Do NOT output any case names. Just give the general pros, cons, and final judgment for the whole set.

Summaries:
{joined}
'''
    llm = ChatGroq(groq_api_key=get_next_groq_api_key(),
                   model_name="llama3-8b-8192")
    chain = LLMChain(llm=llm, prompt=PromptTemplate.from_template("{text}"))
    import json
    import re
    result = chain.run({"text": prompt})
    # Try to parse as JSON, else return as plain text
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
