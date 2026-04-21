import json
import os
import re
import time
import uuid
from datetime import datetime

import pdfplumber
from ats import generate_ats_report
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from google import genai
from pymongo import MongoClient
from werkzeug.utils import secure_filename

from interview_analysis import (
    analyze_video_behavior,
    build_interview_analysis_prompt,
    build_question_generation_prompt,
)
from interview_transcription import compute_transcript_metrics, transcribe_media_file
from report_generator import (
    extract_json_object,
    fallback_interview_report,
    normalize_interview_report,
)

app = Flask(__name__)
CORS(app)

load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, "storage", "uploads")
AUDIO_FOLDER = os.path.join(BASE_DIR, "storage", "audio_uploads")
TMP_FOLDER = os.path.join(BASE_DIR, "storage", "tmp")
ALLOWED_EXTENSIONS = {"pdf"}
ALLOWED_AUDIO_EXTENSIONS = {"webm", "mp3", "wav", "ogg", "m4a"}
ALLOWED_VIDEO_EXTENSIONS = {"webm", "mp4", "mov", "avi", "mkv"}
MAX_CONTENT_LENGTH = 100 * 1024 * 1024

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(AUDIO_FOLDER, exist_ok=True)
os.makedirs(TMP_FOLDER, exist_ok=True)

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["AUDIO_FOLDER"] = AUDIO_FOLDER
app.config["MAX_CONTENT_LENGTH"] = MAX_CONTENT_LENGTH

MONGO_URI = os.getenv("MONGO_URI")
db = None
users_collection = None
businesses_collection = None
jobs_collection = None
stats_collection = None
interview_sessions_collection = None
feedback_collection = None

try:
    if not MONGO_URI:
        raise ValueError("MONGO_URI is not configured.")
    mongo_client = MongoClient(MONGO_URI)
    db = mongo_client["AI-Interviewer"]
    users_collection = db["users"]
    businesses_collection = db["businesses"]
    jobs_collection = db["jobs"]
    stats_collection = db["stats"]
    interview_sessions_collection = db["interview_sessions"]
    feedback_collection = db["user_feedback"]
    print("Connected to MongoDB")
except Exception as exc:
    print(f"Error connecting to MongoDB: {exc}")

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("WARNING: GEMINI_API_KEY not found in environment variables.")
genai_client = genai.Client(api_key=api_key)
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
GEMINI_MAX_RETRIES = int(os.getenv("GEMINI_MAX_RETRIES", "3"))
GEMINI_RETRY_DELAYS = [2, 4, 8]
INTERVIEW_QUESTION_COUNT = int(os.getenv("INTERVIEW_QUESTION_COUNT", "3"))


def extract_text_from_pdf(pdf_path):
    text = ""
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text


def extract_sections(text):
    sections = {"Education": [], "Projects": [], "Experience": [], "Skills": []}
    lines = text.split("\n")
    current_section = None

    for line in lines:
        line = line.strip()
        if not line:
            continue
        if re.search(r"\bEducation\b", line, re.IGNORECASE):
            current_section = "Education"
            continue
        if re.search(r"\bProjects\b", line, re.IGNORECASE):
            current_section = "Projects"
            continue
        if re.search(r"\bExperience\b", line, re.IGNORECASE):
            current_section = "Experience"
            continue
        if re.search(r"\bSkills\b", line, re.IGNORECASE):
            current_section = "Skills"
            continue
        if current_section and current_section in sections:
            sections[current_section].append(line)

    return sections


def clean_skills(data):
    skills_text = " ".join(data)
    skills_list = re.split(r",|\n", skills_text)
    return [skill.strip() for skill in skills_list if skill.strip()]


def format_output(sections):
    return {
        "Education": sections["Education"],
        "Projects": sections["Projects"],
        "Experience": sections["Experience"],
        "Skills": clean_skills(sections["Skills"]),
    }


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def allowed_video_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_VIDEO_EXTENSIONS


def allowed_audio_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_AUDIO_EXTENSIONS


def safe_remove(path):
    if path and os.path.exists(path):
        os.remove(path)


def increment_ai_usage():
    try:
        if stats_collection is not None:
            stats_collection.update_one({"type": "ai_usage"}, {"$inc": {"count": 1}}, upsert=True)
    except Exception:
        pass


def ensure_mongo_collection(collection, action_name):
    if collection is None:
        raise RuntimeError(f"MongoDB is unavailable. {action_name} cannot be completed.")


def serialize_for_json(value):
    if isinstance(value, dict):
        return {key: serialize_for_json(item) for key, item in value.items()}
    if isinstance(value, list):
        return [serialize_for_json(item) for item in value]
    if isinstance(value, datetime):
        return value.isoformat()
    return value


def is_retryable_gemini_error(exc):
    message = str(exc or "").lower()
    retry_markers = [
        "503",
        "unavailable",
        "high demand",
        "deadline exceeded",
        "timed out",
        "timeout",
        "connection reset",
        "temporarily unavailable",
    ]
    return any(marker in message for marker in retry_markers)


def invoke_gemini(contents, purpose):
    last_error = None
    for attempt in range(GEMINI_MAX_RETRIES):
        try:
            return genai_client.models.generate_content(model=GEMINI_MODEL, contents=contents)
        except Exception as exc:
            last_error = exc
            if not is_retryable_gemini_error(exc) or attempt == GEMINI_MAX_RETRIES - 1:
                break
            time.sleep(GEMINI_RETRY_DELAYS[min(attempt, len(GEMINI_RETRY_DELAYS) - 1)])

    message = str(last_error or "")
    if "reported as leaked" in message.lower():
        raise RuntimeError("The Gemini API key is invalid or has been disabled. Please replace it with a new key.")
    if is_retryable_gemini_error(last_error):
        raise RuntimeError(
            f"The AI analysis service is temporarily busy while handling {purpose}. Please wait a few seconds and try again."
        )
    raise RuntimeError(f"Gemini request failed during {purpose}: {message}")


def summarize_session(session):
    responses = session.get("responses", [])
    scores = [response.get("report", {}).get("overall_score", 0) for response in responses if response.get("report")]
    average_score = round(sum(scores) / len(scores), 1) if scores else 0
    latest_report = responses[-1].get("report") if responses else None
    response_mode = session.get("response_mode", "per_question")
    generated_question_count = len(session.get("questions", []))
    displayed_question_count = 1 if response_mode == "single_video" else generated_question_count
    return {
        "session_id": session["session_id"],
        "candidate_name": session.get("candidate_name", ""),
        "candidate_email": session.get("candidate_email", ""),
        "job_title": session.get("job_title", ""),
        "company_name": session.get("company_name", ""),
        "business_email": session.get("business_email", ""),
        "interview_type": session.get("interview_type", ""),
        "difficulty": session.get("difficulty", ""),
        "response_mode": response_mode,
        "status": session.get("status", "pending"),
        "question_count": displayed_question_count,
        "generated_question_count": generated_question_count,
        "responses_completed": len(responses),
        "overall_score": average_score,
        "recommended_decision": latest_report.get("recommended_decision", "Pending") if latest_report else "Pending",
        "last_summary": latest_report.get("summary", "") if latest_report else "",
        "created_at": session.get("created_at"),
        "updated_at": session.get("updated_at"),
    }


def create_interview_session(payload, questions):
    ensure_mongo_collection(interview_sessions_collection, "Interview session creation")
    session_id = str(uuid.uuid4())
    now = datetime.utcnow()
    document = {
        "session_id": session_id,
        "candidate_name": payload.get("candidate_name", ""),
        "candidate_email": payload.get("candidate_email", ""),
        "job_title": payload.get("job_title", ""),
        "job_description": payload.get("job_description", ""),
        "company_name": payload.get("company_name", ""),
        "business_email": payload.get("business_email", ""),
        "interview_type": payload.get("interview_type", ""),
        "difficulty": payload.get("difficulty", ""),
        "candidate_resume": payload.get("candidate_resume", ""),
        "ats_score": payload.get("ats_score", 0),
        "ats_report": payload.get("ats_report", {}),
        "questions": questions,
        "responses": [],
        "response_mode": payload.get("response_mode", "per_question"),
        "status": "in_progress",
        "created_at": now,
        "updated_at": now,
    }
    interview_sessions_collection.insert_one(document)
    document.pop("_id", None)
    return document


def append_session_response(session_id, response_payload):
    ensure_mongo_collection(interview_sessions_collection, "Interview session update")
    session = interview_sessions_collection.find_one({"session_id": session_id})
    if not session:
        raise ValueError("Interview session not found.")

    response_index = int(response_payload.get("question_index", len(session.get("responses", []))))
    responses = session.get("responses", [])
    response_record = {
        "question_index": response_index,
        "question": response_payload.get("question", ""),
        "analysis": response_payload.get("analysis", ""),
        "transcript_raw": response_payload.get("transcript_raw", ""),
        "report": response_payload.get("report", {}),
        "created_at": datetime.utcnow(),
    }

    if response_index < len(responses):
        responses[response_index] = response_record
    else:
        responses.append(response_record)

    questions = session.get("questions", [])
    if response_payload.get("complete_session") or session.get("response_mode") == "single_video":
        status = "completed" if responses else "in_progress"
    else:
        status = "completed" if questions and len(responses) >= len(questions) else "in_progress"
    interview_sessions_collection.update_one(
        {"session_id": session_id},
        {
            "$set": {
                "responses": responses,
                "status": status,
                "updated_at": datetime.utcnow(),
            }
        },
    )

    session["responses"] = responses
    session["status"] = status
    session["updated_at"] = datetime.utcnow()
    return session


def build_question_fallback(payload):
    role = payload.get("job_title") or "the target role"
    interview_type = (payload.get("interview_type") or "mixed").lower()
    generic_sets = {
        "technical": [
            f"Walk me through a technically challenging project you completed for {role}.",
            f"What tools or frameworks would you choose first for a new {role} assignment and why?",
            "How do you debug an issue when the root cause is not obvious?",
            "Describe a time you improved performance, quality, or maintainability in your work.",
            "How do you validate that your solution is correct before delivery?",
        ],
        "hr": [
            f"Tell me about yourself and why you want this {role} opportunity.",
            "Describe a time you worked through a difficult team situation.",
            "How do you respond to feedback that you disagree with at first?",
            "What kind of work environment helps you perform your best?",
            "Why should we hire you for this role?",
        ],
        "behavioral": [
            "Tell me about a time you had to solve a problem under pressure.",
            "Describe a situation where you had to learn something quickly to deliver results.",
            "Tell me about a time you made a mistake and how you handled it.",
            "Describe a time you balanced multiple priorities successfully.",
            "Share an example of when you took initiative without being asked.",
        ],
    }
    selected = generic_sets.get(interview_type, generic_sets["technical"][:2] + generic_sets["hr"][:2] + generic_sets["behavioral"][:1])
    return [
        {
            "question": question,
            "category": payload.get("interview_type", "Mixed").title(),
            "focus": "Role-relevant communication and problem solving",
        }
        for question in selected[: max(1, int(payload.get("question_count", 5) or 5))]
    ]


def generate_questions(payload):
    question_count = INTERVIEW_QUESTION_COUNT
    prompt = build_question_generation_prompt(
        payload.get("job_title", ""),
        payload.get("job_description", ""),
        payload.get("interview_type", ""),
        payload.get("difficulty", ""),
        payload.get("candidate_resume", ""),
        question_count,
    )

    try:
        response = invoke_gemini(prompt, "question generation")
        parsed = extract_json_object(response.text or "")
        questions = parsed.get("questions", []) if parsed else []
        normalized = []
        for index, item in enumerate(questions[:question_count]):
            if not isinstance(item, dict):
                continue
            question = str(item.get("question", "")).strip()
            if not question:
                continue
            normalized.append(
                {
                    "question": question,
                    "category": str(item.get("category", payload.get("interview_type", "Mixed"))).strip() or "Mixed",
                    "focus": str(item.get("focus", "General role fit")).strip() or "General role fit",
                    "order": index,
                }
            )
        if normalized:
            return normalized
    except Exception:
        pass

    fallback = build_question_fallback(payload)
    for index, question in enumerate(fallback):
        question["order"] = index
    return fallback


@app.route("/upload-resume", methods=["POST"])
def upload_resume():
    if "resume" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["resume"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400
    if not allowed_file(file.filename):
        return jsonify({"error": "Invalid file type. Only PDF files are allowed"}), 400

    file_path = None
    try:
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
        file.save(file_path)
        extracted_text = extract_text_from_pdf(file_path)
        structured_output = format_output(extract_sections(extracted_text))
        safe_remove(file_path)
        return jsonify(structured_output)
    except Exception as exc:
        safe_remove(file_path)
        return jsonify({"error": str(exc)}), 500


@app.route("/api/ats-score", methods=["POST"])
def get_ats_score():
    try:
        data = request.get_json() or {}
        resume_data = data.get("resume")
        jd_data = data.get("job_description")
        if not resume_data or not jd_data:
            return jsonify({"error": "Missing resume or job description"}), 400

        resume_file = os.path.join(TMP_FOLDER, "resume.json")
        jd_file = os.path.join(TMP_FOLDER, "job_description.json")
        with open(resume_file, "w", encoding="utf-8") as resume_handle:
            json.dump(resume_data, resume_handle, ensure_ascii=False, indent=2)
        with open(jd_file, "w", encoding="utf-8") as jd_handle:
            json.dump(jd_data, jd_handle, ensure_ascii=False, indent=2)

        report = generate_ats_report(resume_file=resume_file, jd_file=jd_file)
        return jsonify({"ats_score": report["overall_score"], "report": report})
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.route("/api/interview-questions", methods=["POST"])
def interview_questions():
    try:
        payload = request.get_json() or {}
        questions = generate_questions(payload)
        session = create_interview_session(payload, questions)
        return jsonify(
            {
                "session_id": session["session_id"],
                "questions": questions,
                "session": serialize_for_json(summarize_session(session)),
            }
        )
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.route("/api/interview-analysis", methods=["POST"])
def interview_analysis():
    try:
        media_file = None
        media_type = None
        folder = None

        if "video" in request.files:
            media_file = request.files["video"]
            media_type = "video"
            folder = app.config["UPLOAD_FOLDER"]
        elif "audio" in request.files:
            media_file = request.files["audio"]
            media_type = "audio"
            folder = app.config["AUDIO_FOLDER"]

        question = request.form.get("question", "").strip()
        question_context = request.form.get("question_context", "").strip()
        question_display = request.form.get("question_display", "").strip()
        session_id = request.form.get("session_id", "").strip()
        question_index = request.form.get("question_index", "0").strip()
        complete_session = request.form.get("complete_session", "").strip().lower() == "true"

        if media_file:
            if media_file.filename == "":
                return jsonify({"error": f"No {media_type} file uploaded."}), 400

            is_valid = allowed_video_file(media_file.filename) if media_type == "video" else allowed_audio_file(media_file.filename)
            if not is_valid:
                return jsonify({"error": f"Invalid {media_type} format."}), 400

            filename = f"{uuid.uuid4()}-{secure_filename(media_file.filename)}"
            file_path = os.path.join(folder, filename)
            media_file.save(file_path)
            local_video_metrics = analyze_video_behavior(file_path) if media_type == "video" else None

            try:
                uploaded_file = genai_client.files.upload(file=file_path)
                while uploaded_file.state == "PROCESSING":
                    time.sleep(2)
                    uploaded_file = genai_client.files.get(name=uploaded_file.name)
                if uploaded_file.state == "FAILED":
                    raise RuntimeError("File processing failed by Gemini.")

                analysis_prompt_question = question_context or question
                prompt = build_interview_analysis_prompt(
                    analysis_prompt_question,
                    media_type,
                    "Use the uploaded media as the primary transcript source.",
                    local_video_metrics=local_video_metrics,
                )
                response = invoke_gemini([uploaded_file, prompt], "interview analysis")
                raw_text = response.text or ""
                parsed_report = extract_json_object(raw_text)
                transcript_text = ""
                transcript_raw = raw_text
                if parsed_report:
                    transcript_text = (
                        parsed_report.get("transcript", {}).get("full_text", "")
                        if isinstance(parsed_report.get("transcript", {}), dict)
                        else ""
                    )
                if not transcript_text:
                    try:
                        transcript_text, transcript_raw = transcribe_media_file(
                            genai_client,
                            uploaded_file,
                            question,
                            invoke_gemini=invoke_gemini,
                        )
                    except Exception:
                        transcript_text = ""
                        transcript_raw = raw_text
                transcript_metrics = compute_transcript_metrics(analysis_prompt_question, transcript_text)
                report = (
                    normalize_interview_report(
                        parsed_report,
                        question,
                        media_type,
                        local_video_metrics=local_video_metrics,
                        transcript_metrics=transcript_metrics,
                    )
                    if parsed_report
                    else fallback_interview_report(
                        question,
                        media_type,
                        raw_text,
                        local_video_metrics=local_video_metrics,
                        transcript_text=transcript_text,
                        transcript_metrics=transcript_metrics,
                    )
                )
                if transcript_text and not report["transcript"]["full_text"]:
                    report["transcript"]["full_text"] = transcript_text

                increment_ai_usage()

                session_summary = None
                if session_id:
                    session = append_session_response(
                        session_id,
                        {
                            "question_index": int(question_index or 0),
                            "question": question_display or question or "Full interview session response",
                            "analysis": raw_text,
                            "transcript_raw": transcript_raw,
                            "report": report,
                            "complete_session": complete_session,
                        },
                    )
                    session_summary = serialize_for_json(summarize_session(session))

                safe_remove(file_path)
                return jsonify(
                    {
                        "analysis": raw_text,
                        "transcript_raw": transcript_raw,
                        "report": report,
                        "session": session_summary,
                    }
                )
            except Exception:
                safe_remove(file_path)
                raise

        data = request.get_json() or {}
        question = (data.get("question") or question).strip()
        question_context = (data.get("question_context") or question_context).strip()
        question_display = (data.get("question_display") or question_display).strip()
        answer_text = (data.get("answer") or "").strip()
        session_id = (data.get("session_id") or session_id).strip()
        question_index = int(data.get("question_index", question_index or 0))
        complete_session = bool(data.get("complete_session", complete_session))

        if not answer_text:
            return jsonify({"error": "Answer text/audio required."}), 400

        transcript_text = answer_text
        analysis_prompt_question = question_context or question
        transcript_metrics = compute_transcript_metrics(analysis_prompt_question, transcript_text)
        prompt = build_interview_analysis_prompt(analysis_prompt_question, "text", transcript_text, answer_text=answer_text)
        response = invoke_gemini(prompt, "text interview analysis")
        raw_text = response.text or ""
        parsed_report = extract_json_object(raw_text)
        report = (
            normalize_interview_report(parsed_report, question, "text", transcript_metrics=transcript_metrics)
            if parsed_report
            else fallback_interview_report(
                question,
                "text",
                raw_text,
                transcript_text=transcript_text,
                transcript_metrics=transcript_metrics,
            )
        )
        if answer_text and not report["transcript"]["full_text"]:
            report["transcript"]["full_text"] = answer_text

        increment_ai_usage()

        session_summary = None
        if session_id:
            session = append_session_response(
                session_id,
                {
                    "question_index": question_index,
                    "question": question_display or question or "Full interview session response",
                    "analysis": raw_text,
                    "transcript_raw": "",
                    "report": report,
                    "complete_session": complete_session,
                },
            )
            session_summary = serialize_for_json(summarize_session(session))

        return jsonify({"analysis": raw_text, "report": report, "session": session_summary})
    except Exception as exc:
        status_code = 503 if "temporarily busy" in str(exc).lower() else 500
        return jsonify({"error": str(exc)}), status_code


@app.route("/api/interview-history", methods=["GET"])
def interview_history():
    try:
        ensure_mongo_collection(interview_sessions_collection, "Interview history lookup")
        candidate_email = request.args.get("candidate_email", "").strip()
        if not candidate_email:
            return jsonify({"error": "candidate_email is required"}), 400

        sessions = list(
            interview_sessions_collection.find(
                {"candidate_email": candidate_email},
                {"_id": 0},
            ).sort("updated_at", -1)
        )

        return jsonify(
            {
                "sessions": [serialize_for_json({**session, "summary": summarize_session(session)}) for session in sessions]
            }
        )
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.route("/api/business/candidate-comparison", methods=["GET"])
def business_candidate_comparison():
    try:
        ensure_mongo_collection(interview_sessions_collection, "Candidate comparison")
        business_email = request.args.get("business_email", "").strip()
        if not business_email:
            return jsonify({"error": "business_email is required"}), 400

        query = {"business_email": business_email}
        job_title = request.args.get("job_title", "").strip()
        if job_title:
            query["job_title"] = job_title

        sessions = list(interview_sessions_collection.find(query, {"_id": 0}).sort("updated_at", -1))
        detailed_sessions = [
            serialize_for_json({**session, "summary": summarize_session(session)})
            for session in sessions
        ]
        ranked_candidates = sorted(
            [serialize_for_json(summarize_session(session)) for session in sessions],
            key=lambda item: item.get("overall_score", 0),
            reverse=True,
        )

        by_job = {}
        for session in ranked_candidates:
            key = session.get("job_title") or "Unspecified role"
            by_job.setdefault(key, []).append(session)

        return jsonify({"candidates": ranked_candidates, "by_job": by_job, "sessions": detailed_sessions})
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.errorhandler(413)
def request_entity_too_large(_error):
    return (
        jsonify(
            {
                "error": "Your interview video is too large to upload. Please record a shorter response or try again with a smaller file."
            }
        ),
        413,
    )


@app.route("/api/admin/stats", methods=["GET"])
def get_admin_stats():
    try:
        ensure_mongo_collection(users_collection, "Admin stats lookup")
        cnt_candidates = users_collection.count_documents({})
        cnt_businesses = businesses_collection.count_documents({})
        ai_usage_doc = stats_collection.find_one({"type": "ai_usage"}) if stats_collection is not None else None
        ai_usage_count = ai_usage_doc["count"] if ai_usage_doc else 0
        interviews_count = jobs_collection.count_documents({}) if jobs_collection is not None else 0

        return jsonify(
            {
                "candidates": cnt_candidates,
                "businesses": cnt_businesses,
                "interviews_today": interviews_count,
                "ai_usage": ai_usage_count,
            }
        )
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.route("/api/submit-feedback", methods=["POST"])
def submit_feedback():
    try:
        ensure_mongo_collection(feedback_collection, "Feedback collection")
        data = request.get_json() or {}
        session_id = data.get("session_id", "").strip()
        user_email = data.get("user_email", "").strip()
        rating = data.get("rating")
        comment = data.get("comment", "").strip()

        if not rating:
            return jsonify({"error": "Rating is required"}), 400

        document = {
            "session_id": session_id,
            "user_email": user_email,
            "rating": rating,
            "comment": comment,
            "created_at": datetime.utcnow(),
        }
        feedback_collection.insert_one(document)
        return jsonify({"message": "Feedback submitted successfully."})
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=int(os.getenv("PYTHON_API_PORT", "5500")))
