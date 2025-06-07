import os
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY_FROM_ENV = os.getenv("GROQ_API_KEY")
# ...existing code...
# (DEBUG LINE REMOVED)
# ...existing code...

# Load all GROQ API keys from environment variables
GROQ_API_KEYS = [
    os.getenv("GROQ_API_KEY_1"),
    os.getenv("GROQ_API_KEY_2"),
    os.getenv("GROQ_API_KEY_3"),
]
# Remove any None or empty values
GROQ_API_KEYS = [k for k in GROQ_API_KEYS if k]

# Round robin index (in-memory, not safe for multi-process)
_groq_key_index = 0


def get_next_groq_api_key():
    global _groq_key_index
    if not GROQ_API_KEYS:
        raise RuntimeError("No GROQ API keys configured!")
    key = GROQ_API_KEYS[_groq_key_index]
    _groq_key_index = (_groq_key_index + 1) % len(GROQ_API_KEYS)
    return key
