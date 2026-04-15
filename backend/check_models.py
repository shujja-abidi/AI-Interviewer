from google import genai
from dotenv import load_dotenv
import os

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)

print(f"Checking models for key ending in ...{api_key[-4:]}")
try:
    # In the new SDK, we just iterate directly
    for model in client.models.list():
        print(f"Found: {model.name}")
except Exception as e:
    print(f"Error: {e}")