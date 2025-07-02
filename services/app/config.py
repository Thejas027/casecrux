import os
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY_FROM_ENV = os.getenv("GROQ_API_KEY")

# Load all GROQ API keys from environment variables
GROQ_API_KEYS = [
    os.getenv("GROQ_API_KEY_1"),
    os.getenv("GROQ_API_KEY_2"),
    os.getenv("GROQ_API_KEY_3"),
    os.getenv("GROQ_API_KEY")  # Fallback single key
]

# Remove any None, empty values, or placeholder values
GROQ_API_KEYS = [
    k for k in GROQ_API_KEYS 
    if k and k.strip() and not k.startswith("your_groq_api_key")
]

# Round robin index (in-memory, not safe for multi-process)
_groq_key_index = 0


def get_next_groq_api_key():
    global _groq_key_index
    if not GROQ_API_KEYS:
        raise RuntimeError(
            "No valid GROQ API keys configured! "
            "Please set GROQ_API_KEY_1, GROQ_API_KEY_2, GROQ_API_KEY_3 "
            "in your environment variables."
        )
    key = GROQ_API_KEYS[_groq_key_index]
    _groq_key_index = (_groq_key_index + 1) % len(GROQ_API_KEYS)
    return key


def get_groq_keys_count():
    """Return the number of available GROQ API keys"""
    return len(GROQ_API_KEYS)
