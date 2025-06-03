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
