import re

from report_generator import extract_json_object, normalize_transcript_text


def transcribe_media_file(genai_client, uploaded_file, question, invoke_gemini=None):
    prompt = f"""
You are a precise speech-to-text assistant.
Transcribe the candidate's answer to this interview question:
"{question}"

Rules:
- Return valid JSON only.
- Keep the transcript in plain text.
- If some words are unclear, produce the best-effort transcript.
- Do not analyze the answer in this step.

JSON format:
{{
  "transcript": "full transcript here"
}}
"""

    response = (
        invoke_gemini([uploaded_file, prompt], "media transcription")
        if invoke_gemini is not None
        else genai_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[uploaded_file, prompt],
        )
    )
    raw_text = response.text or ""
    parsed = extract_json_object(raw_text)
    transcript = normalize_transcript_text(parsed.get("transcript", "")) if parsed else ""
    return transcript, raw_text


def compute_transcript_metrics(question, transcript):
    transcript_text = normalize_transcript_text(transcript)
    question_text = normalize_transcript_text(question).lower()
    words = re.findall(r"\b[\w.+#'-]+\b", transcript_text.lower())
    word_count = len(words)
    sentence_count = len([segment for segment in re.split(r"[.!?]+", transcript_text) if segment.strip()])

    filler_terms = {
        "um",
        "uh",
        "like",
        "basically",
        "actually",
        "literally",
        "you know",
        "i mean",
        "sort of",
        "kind of",
    }

    filler_count = 0
    lowered_transcript = transcript_text.lower()
    for term in filler_terms:
        filler_count += len(re.findall(rf"\b{re.escape(term)}\b", lowered_transcript))

    question_keywords = {
        token
        for token in re.findall(r"\b[a-zA-Z][a-zA-Z0-9.+#-]{2,}\b", question_text)
        if token not in {"what", "why", "when", "where", "which", "about", "your", "strong", "role", "tell"}
    }
    keyword_hits = sorted([token for token in question_keywords if token in lowered_transcript])

    answer_length_quality = "Strong" if word_count >= 60 else "Average" if word_count >= 30 else "Weak"

    return {
        "word_count": word_count,
        "sentence_count": sentence_count,
        "filler_count": filler_count,
        "filler_ratio": round((filler_count / max(word_count, 1)) * 100, 1),
        "keyword_hits": keyword_hits,
        "answer_length_quality": answer_length_quality,
    }
