import os
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY_FROM_ENV = os.getenv("GROQ_API_KEY")
# DEBUG LINE
print(
    f"!!!!!!!!!!!! DEBUG: In config.py, GROQ_API_KEY_FROM_ENV is: '{GROQ_API_KEY_FROM_ENV}' !!!!!!!!!!!!")
GROQ_API_KEY = GROQ_API_KEY_FROM_ENV
