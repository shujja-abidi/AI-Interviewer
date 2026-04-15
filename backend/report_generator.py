import json
import re


def normalize_mojibake(text):
    replacements = {
        "Ã¢â‚¬Â¢": " ",
        "Ã¯â€šÂ·": " ",
        "Ã¢â‚¬â€œ": "-",
        "Ã¢â‚¬â€": "-",
        "Ã°Å¸": " ",
        "Ã¯Â¸": " ",
        "Ã¢Å“": " ",
        "Ã¢â‚¬": " ",
        "Ã‚": " ",
    }
    for source, target in replacements.items():
        text = text.replace(source, target)
    return text


def clamp_score(value, default=0):
    try:
        return max(0, min(100, int(round(float(value)))))
    except Exception:
        return default


def extract_json_object(text):
    if not text:
        return {}
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        return {}
    try:
        return json.loads(match.group(0))
    except Exception:
        return {}


def normalize_transcript_text(text):
    cleaned = normalize_mojibake(str(text or ""))
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


def normalize_interview_report(raw_report, question, media_type, local_video_metrics=None, transcript_metrics=None):
    verbal = raw_report.get("verbal_analysis", {}) if isinstance(raw_report, dict) else {}
    non_verbal = raw_report.get("non_verbal_analysis", {}) if isinstance(raw_report, dict) else {}
    transcript = raw_report.get("transcript", {}) if isinstance(raw_report, dict) else {}
    content = raw_report.get("content_analysis", {}) if isinstance(raw_report, dict) else {}

    report = {
        "question": question,
        "analysis_type": media_type or "text",
        "overall_score": clamp_score(raw_report.get("overall_score", 0)),
        "summary": str(raw_report.get("summary", "")).strip() or "Interview analysis completed.",
        "transcript": {
            "full_text": str(transcript.get("full_text", "")).strip(),
            "summary": str(transcript.get("summary", "")).strip() or "Transcript summary not available.",
            "estimated_answer_quality": str(transcript.get("estimated_answer_quality", "Not assessed")).strip() or "Not assessed",
            "metrics": transcript_metrics or {},
        },
        "content_analysis": {
            "structure_score": clamp_score(content.get("structure_score", 0)),
            "specificity_score": clamp_score(content.get("specificity_score", 0)),
            "key_points_covered": (
                content.get("key_points_covered", [])
                if isinstance(content.get("key_points_covered", []), list)
                else []
            ),
            "content_observations": str(content.get("content_observations", "")).strip() or "No transcript-based observations were returned.",
        },
        "verbal_analysis": {
            "relevance_score": clamp_score(verbal.get("relevance_score", 0)),
            "clarity_score": clamp_score(verbal.get("clarity_score", 0)),
            "confidence_score": clamp_score(verbal.get("confidence_score", 0)),
            "sentiment": str(verbal.get("sentiment", "neutral")).strip() or "neutral",
            "pace": str(verbal.get("pace", "not assessed")).strip() or "not assessed",
            "observations": str(verbal.get("observations", "")).strip() or "No detailed verbal observations were returned.",
        },
        "non_verbal_analysis": {
            "eye_contact": str(non_verbal.get("eye_contact", "Not assessed")).strip() or "Not assessed",
            "body_language": str(non_verbal.get("body_language", "Not assessed")).strip() or "Not assessed",
            "facial_expression": str(non_verbal.get("facial_expression", "Not assessed")).strip() or "Not assessed",
            "presence": str(non_verbal.get("presence", "Not assessed")).strip() or "Not assessed",
            "distraction": str(non_verbal.get("distraction", "Not assessed")).strip() or "Not assessed",
            "local_video_metrics": {},
        },
        "strengths": raw_report.get("strengths", []) if isinstance(raw_report.get("strengths", []), list) else [],
        "weaknesses": raw_report.get("weaknesses", []) if isinstance(raw_report.get("weaknesses", []), list) else [],
        "recommendations": raw_report.get("recommendations", []) if isinstance(raw_report.get("recommendations", []), list) else [],
        "recommended_decision": str(raw_report.get("recommended_decision", "Needs Improvement")).strip() or "Needs Improvement",
    }

    if report["analysis_type"] != "video":
        report["non_verbal_analysis"] = {
            "eye_contact": "Not assessed in this response type",
            "body_language": "Not assessed in this response type",
            "facial_expression": "Not assessed in this response type",
            "presence": "Not assessed in this response type",
            "distraction": "Not assessed in this response type",
            "local_video_metrics": {},
        }

    if report["analysis_type"] == "text" and not report["transcript"]["full_text"]:
        report["transcript"]["full_text"] = "Transcript is the same as the submitted text answer."

    if report["analysis_type"] == "video" and local_video_metrics:
        report["non_verbal_analysis"]["local_video_metrics"] = local_video_metrics
        if local_video_metrics.get("available"):
            report["non_verbal_analysis"]["eye_contact"] = local_video_metrics.get(
                "eye_contact", report["non_verbal_analysis"]["eye_contact"]
            )
            report["non_verbal_analysis"]["body_language"] = local_video_metrics.get(
                "body_language", report["non_verbal_analysis"]["body_language"]
            )
            report["non_verbal_analysis"]["facial_expression"] = local_video_metrics.get(
                "facial_expression", report["non_verbal_analysis"]["facial_expression"]
            )
            report["non_verbal_analysis"]["presence"] = local_video_metrics.get(
                "presence", report["non_verbal_analysis"]["presence"]
            )
            report["non_verbal_analysis"]["distraction"] = local_video_metrics.get(
                "distraction", report["non_verbal_analysis"]["distraction"]
            )

    if not report["strengths"]:
        report["strengths"] = ["The response was captured successfully and could be reviewed for coaching feedback."]
    if not report["weaknesses"]:
        report["weaknesses"] = ["More specific evidence and role-focused examples would strengthen the answer."]
    if not report["recommendations"]:
        report["recommendations"] = [
            "Use a clearer structure: answer directly, give one example, and close with the impact."
        ]

    return report


def fallback_interview_report(
    question,
    media_type,
    raw_text,
    local_video_metrics=None,
    transcript_text="",
    transcript_metrics=None,
):
    fallback_score = 65 if raw_text else 50
    return normalize_interview_report(
        {
            "overall_score": fallback_score,
            "summary": raw_text.strip()[:300]
            or "Structured interview feedback could not be parsed, so a simplified report was generated.",
            "transcript": {
                "full_text": transcript_text.strip()[:1000] or raw_text.strip()[:1000],
                "summary": raw_text.strip()[:240] or "Transcript summary could not be generated.",
                "estimated_answer_quality": (transcript_metrics or {}).get("answer_length_quality", "Partial"),
            },
            "content_analysis": {
                "structure_score": max(40, fallback_score - 8),
                "specificity_score": max(40, fallback_score - 10),
                "key_points_covered": [],
                "content_observations": "A reliable structured transcript analysis was not available, so content scoring is approximate.",
            },
            "verbal_analysis": {
                "relevance_score": fallback_score,
                "clarity_score": max(45, fallback_score - 5),
                "confidence_score": max(40, fallback_score - 3),
                "sentiment": "neutral",
                "pace": "moderate",
                "observations": raw_text.strip()[:300] or "The answer was captured, but a detailed structured response was unavailable.",
            },
            "strengths": ["The response was submitted successfully for analysis."],
            "weaknesses": ["The returned analysis could not be fully structured."],
            "recommendations": ["Try giving a more direct answer with one concrete example and a short conclusion."],
            "recommended_decision": "Needs Improvement",
        },
        question,
        media_type,
        local_video_metrics=local_video_metrics,
        transcript_metrics=transcript_metrics,
    )
