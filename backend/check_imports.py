try:
    print("Importing flask...")
    import flask
    print("Flask imported.")
except ImportError as e:
    print(f"Flask failed: {e}")

try:
    print("Importing pdfplumber...")
    import pdfplumber
    print("pdfplumber imported.")
except Exception as e:
    print(f"pdfplumber failed: {e}")

try:
    print("Importing cryptography...")
    import cryptography
    print("cryptography imported.")
except Exception as e:
    print(f"cryptography failed: {e}")

try:
    print("Importing google.genai...")
    from google import genai
    print("google.genai imported.")
except Exception as e:
    print(f"google.genai failed: {e}")

try:
    print("Importing google.generativeai...")
    import google.generativeai
    print("google.generativeai imported.")
except Exception as e:
    print(f"google.generativeai failed: {e}")

try:
    print("Importing sklearn...")
    from sklearn.feature_extraction.text import TfidfVectorizer
    print("sklearn imported.")
except Exception as e:
    print(f"sklearn failed: {e}")

print("Done.")
