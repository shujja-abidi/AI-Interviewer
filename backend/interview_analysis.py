try:
    import cv2
except Exception:
    cv2 = None


def describe_rate(rate, good=0.75, medium=0.45, good_label="Strong", medium_label="Moderate", low_label="Low"):
    if rate >= good:
        return good_label
    if rate >= medium:
        return medium_label
    return low_label


def analyze_video_behavior(video_path):
    if cv2 is None:
        return {
            "available": False,
            "note": "OpenCV video analysis is unavailable in this runtime.",
        }

    capture = cv2.VideoCapture(video_path)
    if not capture.isOpened():
        return {
            "available": False,
            "note": "Video could not be opened for local behavioral analysis.",
        }

    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
    smile_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_smile.xml")

    sampled_frames = 0
    frames_with_face = 0
    centered_frames = 0
    stable_frames = 0
    smile_frames = 0
    large_movement_frames = 0
    multi_face_frames = 0
    previous_center = None
    previous_area = None
    frame_index = 0
    sample_interval = 8

    try:
        while True:
            ok, frame = capture.read()
            if not ok:
                break

            frame_index += 1
            if frame_index % sample_interval != 0:
                continue

            sampled_frames += 1
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(60, 60))

            if len(faces) == 0:
                continue

            if len(faces) > 1:
                multi_face_frames += 1

            frames_with_face += 1
            x, y, w, h = max(faces, key=lambda face: face[2] * face[3])
            face_center_x = x + (w / 2)
            face_center_y = y + (h / 2)
            face_area = w * h
            frame_height, frame_width = gray.shape

            center_x_ratio = abs(face_center_x - (frame_width / 2)) / max(frame_width / 2, 1)
            center_y_ratio = abs(face_center_y - (frame_height / 2)) / max(frame_height / 2, 1)
            if center_x_ratio < 0.22 and center_y_ratio < 0.28:
                centered_frames += 1

            if previous_center is not None:
                delta_x = abs(face_center_x - previous_center[0]) / max(frame_width, 1)
                delta_y = abs(face_center_y - previous_center[1]) / max(frame_height, 1)
                if delta_x < 0.08 and delta_y < 0.10:
                    stable_frames += 1
                else:
                    large_movement_frames += 1
            if previous_area is not None:
                area_delta = abs(face_area - previous_area) / max(previous_area, 1)
                if area_delta > 0.30:
                    large_movement_frames += 1
            previous_center = (face_center_x, face_center_y)
            previous_area = face_area

            roi_gray = gray[y : y + h, x : x + w]
            smiles = smile_cascade.detectMultiScale(
                roi_gray,
                scaleFactor=1.7,
                minNeighbors=20,
                minSize=(25, 25),
            )
            if len(smiles) > 0:
                smile_frames += 1
    finally:
        capture.release()

    if sampled_frames == 0:
        return {
            "available": False,
            "note": "Not enough video frames were sampled for behavioral analysis.",
        }

    face_presence_rate = frames_with_face / sampled_frames
    centered_face_rate = centered_frames / max(frames_with_face, 1)
    posture_stability_rate = stable_frames / max(frames_with_face - 1, 1)
    smile_detection_rate = smile_frames / max(frames_with_face, 1)
    movement_distraction_rate = large_movement_frames / max(frames_with_face, 1)
    multi_face_rate = multi_face_frames / max(sampled_frames, 1)

    return {
        "available": True,
        "sampled_frames": sampled_frames,
        "face_presence_rate": round(face_presence_rate * 100, 1),
        "centered_face_rate": round(centered_face_rate * 100, 1),
        "posture_stability_rate": round(posture_stability_rate * 100, 1),
        "smile_detection_rate": round(smile_detection_rate * 100, 1),
        "movement_distraction_rate": round(movement_distraction_rate * 100, 1),
        "multi_face_rate": round(multi_face_rate * 100, 1),
        "eye_contact": describe_rate(
            centered_face_rate,
            good=0.70,
            medium=0.40,
            good_label="Mostly centered framing",
            medium_label="Partially centered framing",
            low_label="Frequently off-center framing",
        ),
        "body_language": describe_rate(
            posture_stability_rate,
            good=0.70,
            medium=0.40,
            good_label="Stable on-camera presence",
            medium_label="Some visible movement",
            low_label="Noticeable movement or shifting",
        ),
        "facial_expression": describe_rate(
            smile_detection_rate,
            good=0.30,
            medium=0.08,
            good_label="Frequently expressive",
            medium_label="Occasionally expressive",
            low_label="Mostly neutral expression",
        ),
        "presence": describe_rate(
            face_presence_rate,
            good=0.85,
            medium=0.60,
            good_label="Consistently visible",
            medium_label="Mostly visible",
            low_label="Inconsistent face visibility",
        ),
        "distraction": describe_rate(
            1 - movement_distraction_rate,
            good=0.75,
            medium=0.45,
            good_label="Low visible distraction",
            medium_label="Some visible distraction",
            low_label="Frequent visible distraction",
        ),
        "note": "Local OpenCV analysis based on sampled video frames.",
    }


def build_interview_analysis_prompt(question, media_type, transcript_text, answer_text=""):
    media_instructions = (
        "Assess verbal communication using the transcript and visible non-verbal communication using the uploaded video."
        if media_type == "video"
        else "Assess verbal communication using the transcript and provided answer text."
    )
    answer_context = f"\nCandidate answer text: {answer_text}" if answer_text else ""
    transcript_context = f'\nTranscript: "{transcript_text}"'

    return f"""
You are an expert interview evaluator preparing a structured candidate feedback report.
Question: "{question}".
{media_instructions}
{transcript_context}
{answer_context}

Return valid JSON only with this exact structure:
{{
  "overall_score": 0,
  "summary": "2-3 sentence summary",
  "transcript": {{
    "full_text": "verbatim transcript or best-effort transcript",
    "summary": "1-2 sentence transcript summary",
    "estimated_answer_quality": "Strong|Average|Weak"
  }},
  "content_analysis": {{
    "structure_score": 0,
    "specificity_score": 0,
    "key_points_covered": ["point 1", "point 2"],
    "content_observations": "short paragraph"
  }},
  "verbal_analysis": {{
    "relevance_score": 0,
    "clarity_score": 0,
    "confidence_score": 0,
    "sentiment": "positive|neutral|negative|mixed",
    "pace": "slow|moderate|fast|uneven",
    "observations": "short paragraph"
  }},
  "non_verbal_analysis": {{
    "eye_contact": "short phrase",
    "body_language": "short phrase",
    "facial_expression": "short phrase",
    "presence": "short phrase",
    "distraction": "short phrase"
  }},
  "strengths": ["point 1", "point 2", "point 3"],
  "weaknesses": ["point 1", "point 2", "point 3"],
  "recommendations": ["action 1", "action 2", "action 3"],
  "recommended_decision": "Strong Fit|Potential Fit|Needs Improvement"
}}

Scoring guidance:
- 80 to 100: strong answer, role-relevant, clear, confident
- 60 to 79: acceptable answer with noticeable improvement areas
- 0 to 59: weak answer, limited relevance, clarity, or confidence

Rules:
- Evaluate both spoken delivery and actual answer content.
- "key_points_covered" should list the meaningful ideas the candidate actually communicated.
- Reuse the provided transcript as the source of answer content.

Keep the report realistic, concise, and evidence-based.
Do not use markdown.
Do not include text outside JSON.
"""


def build_question_generation_prompt(job_title, job_description, interview_type, difficulty, candidate_resume, question_count):
    return f"""
You are an expert recruiter designing an interview plan.

Role: {job_title or "General role"}
Interview type: {interview_type or "mixed"}
Difficulty: {difficulty or "mid"}
Question count: {question_count}
Job description:
{job_description or "Not provided"}

Candidate resume summary:
{candidate_resume or "Not provided"}

Return valid JSON only:
{{
  "questions": [
    {{
      "question": "text",
      "category": "HR|Technical|Behavioral",
      "focus": "what competency this evaluates"
    }}
  ]
}}

Rules:
- Tailor questions to the role and interview type.
- Mix practical and role-relevant questions.
- Keep each question concise and interview-ready.
- Do not include explanations outside the JSON.
"""
