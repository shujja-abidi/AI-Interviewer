import json
import re
from collections import Counter

from sklearn.feature_extraction.text import ENGLISH_STOP_WORDS, TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


SECTION_WEIGHTS = {
    "keyword_match": 0.22,
    "skills_alignment": 0.18,
    "experience_relevance": 0.20,
    "project_relevance": 0.10,
    "education_fit": 0.08,
    "role_alignment": 0.10,
    "resume_completeness": 0.07,
    "formatting_quality": 0.05,
}

GENERIC_TOKENS = {
    "developer",
    "engineer",
    "software",
    "management",
    "present",
    "project",
    "projects",
    "experience",
    "education",
    "skills",
    "knowledge",
    "ability",
    "abilities",
    "strong",
    "working",
    "work",
    "year",
    "years",
    "responsibilities",
    "requirements",
    "preferred",
    "team",
}

TECH_PATTERNS = [
    r"c\+\+",
    r"c#",
    r"\.net",
    r"node\.js",
    r"react\.js",
    r"next\.js",
    r"vue\.js",
    r"express\.js",
    r"tailwind",
    r"mongodb",
    r"postgresql",
    r"mysql",
    r"docker",
    r"kubernetes",
    r"aws",
    r"azure",
    r"gcp",
    r"python",
    r"java",
    r"javascript",
    r"typescript",
    r"flask",
    r"django",
    r"react",
    r"node",
    r"sql",
    r"nosql",
    r"tensorflow",
    r"opencv",
    r"nlp",
    r"machine learning",
    r"deep learning",
    r"computer vision",
]

DEGREE_PATTERNS = [
    "bachelor",
    "master",
    "phd",
    "bs",
    "ms",
    "bsc",
    "msc",
    "diploma",
    "engineering",
    "computer science",
    "software engineering",
    "information technology",
]


def load_json_file(path):
    try:
        with open(path, "r", encoding="utf-8") as file_obj:
            data = json.load(file_obj)
            return data if isinstance(data, dict) else {}
    except Exception as exc:
        print(f"Error loading {path}: {exc}")
        return {}


def normalize_mojibake(text):
    replacements = {
        "â€¢": " ",
        "ï‚·": " ",
        "â€“": "-",
        "â€”": "-",
        "ðŸ": " ",
        "ï¸": " ",
        "âœ": " ",
        "â€": " ",
        "Â": " ",
    }
    for source, target in replacements.items():
        text = text.replace(source, target)
    return text


def clean_text(value):
    if isinstance(value, list):
        value = " ".join(str(item) for item in value)
    if value is None:
        return ""

    text = normalize_mojibake(str(value))
    text = text.replace("\u2022", " ")
    text = re.sub(r"[^a-zA-Z0-9.+#/\-&\s]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def normalize_phrase(token):
    token = token.strip().lower()
    token = re.sub(r"\s+", " ", token)
    token = token.strip(" -")
    if not token or len(token) < 2:
        return ""
    if (
        token.endswith("s")
        and len(token) > 4
        and token not in {"aws", "devops"}
        and not token.endswith(".js")
    ):
        token = token[:-1]
    return token


def tokenize_text(text):
    cleaned = clean_text(text).lower()
    if not cleaned:
        return []

    raw_tokens = re.findall(r"[a-zA-Z][a-zA-Z0-9.+#-]{1,}", cleaned)
    tokens = []

    for token in raw_tokens:
        normalized = normalize_phrase(token)
        if (
            normalized
            and normalized not in ENGLISH_STOP_WORDS
            and normalized not in GENERIC_TOKENS
            and len(normalized) > 2
        ):
            tokens.append(normalized)

    return tokens


def split_keywords(raw_value):
    if isinstance(raw_value, list):
        keywords = []
        for entry in raw_value:
            keywords.extend(split_keywords(entry))
        return dedupe_preserve_order(keywords)

    cleaned = normalize_mojibake(str(raw_value or "")).lower()
    cleaned = re.sub(r"[^a-zA-Z0-9,+.#/\-&\s]", " ", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    if not cleaned:
        return []

    pieces = re.split(r",|/|\band\b|\bor\b|\n", cleaned)
    keywords = []

    for piece in pieces:
        piece = normalize_phrase(piece)
        if not piece:
            continue

        if " " in piece:
            keywords.append(piece)
            words = piece.split()
            if 1 < len(words) <= 4:
                for word in words:
                    normalized_word = normalize_phrase(word)
                    if (
                        normalized_word
                        and normalized_word not in ENGLISH_STOP_WORDS
                        and normalized_word not in GENERIC_TOKENS
                    ):
                        keywords.append(normalized_word)
        else:
            keywords.append(piece)

    return dedupe_preserve_order(keywords)


def dedupe_preserve_order(items):
    seen = set()
    output = []
    for item in items:
        if item and item not in seen:
            seen.add(item)
            output.append(item)
    return output


def extract_tech_keywords(text):
    cleaned = clean_text(text).lower()
    found = []

    for pattern in TECH_PATTERNS:
        if re.search(rf"\b{pattern}\b", cleaned):
            found.append(pattern)

    tokens = tokenize_text(cleaned)
    counts = Counter(tokens)
    for token, count in counts.items():
        if count >= 2 and token not in found:
            found.append(token)

    return dedupe_preserve_order(found)


def tfidf_score(text_a, text_b):
    if not text_a or not text_b:
        return 0.0

    try:
        vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2))
        tfidf = vectorizer.fit_transform([text_a.lower(), text_b.lower()])
        return round(float(cosine_similarity(tfidf[0:1], tfidf[1:2])[0][0] * 100), 2)
    except Exception:
        return 0.0


def keyword_coverage_score(source_text, keywords):
    if not keywords:
        return 0.0, [], []

    normalized_source = clean_text(source_text).lower()
    matched = [keyword for keyword in keywords if keyword in normalized_source]
    missing = [keyword for keyword in keywords if keyword not in normalized_source]
    score = round((len(matched) / len(keywords)) * 100, 2)
    return score, matched, missing


def normalize_job_description(job_description):
    requirements = split_keywords(job_description.get("requirements", []))
    preferred = split_keywords(job_description.get("preferred", []))
    responsibilities = split_keywords(job_description.get("responsibilities", []))
    description_keywords = extract_tech_keywords(job_description.get("description", ""))
    title_keywords = split_keywords(job_description.get("title", ""))

    keywords = dedupe_preserve_order(
        requirements + preferred + responsibilities + description_keywords + title_keywords
    )

    return {
        "title": clean_text(job_description.get("title", "")),
        "company": clean_text(job_description.get("company", "")),
        "description": clean_text(job_description.get("description", "")),
        "requirements": requirements,
        "preferred": preferred,
        "responsibilities": responsibilities,
        "keywords": keywords,
    }


def normalize_resume(resume):
    return {
        "education": [clean_text(item) for item in (resume.get("Education") or []) if clean_text(item)],
        "experience": [clean_text(item) for item in (resume.get("Experience") or []) if clean_text(item)],
        "projects": [clean_text(item) for item in (resume.get("Projects") or []) if clean_text(item)],
        "skills": [clean_text(item) for item in (resume.get("Skills") or []) if clean_text(item)],
    }


def score_skills_alignment(resume, job):
    skills_text = " ".join(resume["skills"])
    job_skill_targets = dedupe_preserve_order(job["requirements"] + job["preferred"])

    keyword_score, matched, missing = keyword_coverage_score(skills_text, job_skill_targets)
    semantic_score = tfidf_score(skills_text, " ".join(job_skill_targets))
    combined = round((keyword_score * 0.65) + (semantic_score * 0.35), 2)

    return combined, matched, missing


def score_experience_relevance(resume, job):
    experience_text = " ".join(resume["experience"])
    job_context = " ".join(
        [job["title"], job["description"], " ".join(job["responsibilities"]), " ".join(job["requirements"])]
    )

    responsibility_score, matched, missing = keyword_coverage_score(
        experience_text,
        dedupe_preserve_order(job["responsibilities"] + job["requirements"]),
    )
    semantic_score = tfidf_score(experience_text, job_context)
    combined = round((responsibility_score * 0.55) + (semantic_score * 0.45), 2)

    return combined, matched, missing


def score_project_relevance(resume, job):
    project_text = " ".join(resume["projects"])
    project_keywords = dedupe_preserve_order(job["requirements"] + job["preferred"] + job["responsibilities"])
    keyword_score, matched, missing = keyword_coverage_score(project_text, project_keywords)
    semantic_score = tfidf_score(project_text, f"{job['title']} {job['description']}")
    combined = round((keyword_score * 0.6) + (semantic_score * 0.4), 2)

    return combined, matched, missing


def score_education_fit(resume, job):
    education_text = " ".join(resume["education"]).lower()
    if not education_text:
        return 0.0

    degree_hits = sum(1 for item in DEGREE_PATTERNS if item in education_text)
    degree_score = min(100, degree_hits * 18)
    semantic_score = tfidf_score(education_text, f"{job['title']} {job['description']}")
    return round((degree_score * 0.6) + (semantic_score * 0.4), 2)


def score_role_alignment(resume, job):
    experience_text = " ".join(resume["experience"]).lower()
    title_keywords = [token for token in split_keywords(job["title"]) if token not in GENERIC_TOKENS]

    if not title_keywords:
        return 0.0

    matches = sum(1 for token in title_keywords if token in experience_text)
    exact_match_score = round((matches / len(title_keywords)) * 100, 2)
    semantic_score = tfidf_score(experience_text, job["title"])

    return round((exact_match_score * 0.7) + (semantic_score * 0.3), 2)


def score_resume_completeness(resume):
    sections = {
        "education": bool(resume["education"]),
        "experience": bool(resume["experience"]),
        "projects": bool(resume["projects"]),
        "skills": bool(resume["skills"]),
    }
    base = round((sum(sections.values()) / len(sections)) * 100, 2)

    if len(resume["experience"]) < 3:
        base -= 10
    if len(resume["projects"]) < 2:
        base -= 10
    if len(resume["skills"]) < 4:
        base -= 10

    return max(0.0, round(base, 2))


def score_formatting_quality(resume):
    all_sections = resume["education"] + resume["experience"] + resume["projects"] + resume["skills"]
    if not all_sections:
        return 0.0, ["Resume content could not be parsed cleanly."]

    issues = []
    score = 100.0

    noisy_lines = [line for line in all_sections if any(marker in line for marker in ["â", "ï", "ð"])]
    if noisy_lines:
        score -= 25
        issues.append("Resume contains encoding or formatting artifacts that can confuse ATS parsing.")

    long_lines = [line for line in all_sections if len(line.split()) > 35]
    if long_lines:
        score -= 15
        issues.append("Some resume lines are too long and should be broken into shorter bullet points.")

    if len(resume["skills"]) == 1 and len(resume["skills"][0].split()) > 20:
        score -= 20
        issues.append("Skills appear as one large paragraph instead of a clean keyword list.")

    if len(resume["projects"]) and any("work history" in line.lower() for line in resume["projects"]):
        score -= 10
        issues.append("Project section appears mixed with work-history content.")

    return max(0.0, round(score, 2)), issues


def build_strengths(report_inputs):
    strengths = []
    scores = report_inputs["scores"]

    if scores["keyword_match"] >= 70:
        strengths.append("Your resume already includes many of the job-specific keywords ATS systems usually look for.")
    if scores["skills_alignment"] >= 65:
        strengths.append("Your skills section is reasonably aligned with the target role.")
    if scores["experience_relevance"] >= 65:
        strengths.append("Your experience section shows relevant overlap with the job requirements.")
    if scores["project_relevance"] >= 60:
        strengths.append("Your project section adds supporting evidence for your profile.")
    if scores["resume_completeness"] >= 80:
        strengths.append("Your resume has the main sections an ATS expects to find.")

    if not strengths:
        strengths.append("The resume has a base structure, but it needs stronger tailoring to this role.")

    return strengths[:5]


def build_weaknesses(report_inputs):
    weaknesses = []
    scores = report_inputs["scores"]
    missing_keywords = report_inputs["keywords"]["missing"]
    formatting_issues = report_inputs["formatting_issues"]
    resume = report_inputs["resume"]

    if missing_keywords:
        weaknesses.append("Important job keywords are missing, which lowers ATS visibility for this role.")
    if scores["experience_relevance"] < 55:
        weaknesses.append("Experience bullets are too generic or not mapped closely enough to the role requirements.")
    if scores["project_relevance"] < 55:
        weaknesses.append("Projects do not strongly reinforce the technologies or responsibilities in the job description.")
    if not resume["skills"]:
        weaknesses.append("The resume does not clearly present a separate skills section.")
    if formatting_issues:
        weaknesses.append(formatting_issues[0])

    if not weaknesses:
        weaknesses.append("No major structural weakness stands out, but sharper role-specific tailoring would still help.")

    return weaknesses[:5]


def build_improvement_plan(report_inputs):
    scores = report_inputs["scores"]
    job = report_inputs["job"]
    keywords = report_inputs["keywords"]
    formatting_issues = report_inputs["formatting_issues"]
    resume = report_inputs["resume"]

    plan = []

    if keywords["missing_required"]:
        plan.append({
            "section": "Skills and Experience",
            "action": f"Add these required keywords naturally where they genuinely apply: {', '.join(keywords['missing_required'][:6])}.",
        })
    if keywords["missing_preferred"]:
        plan.append({
            "section": "Projects or Summary",
            "action": f"If you have exposure, mention these preferred terms to strengthen ATS fit: {', '.join(keywords['missing_preferred'][:6])}.",
        })
    if scores["experience_relevance"] < 60:
        plan.append({
            "section": "Experience",
            "action": "Rewrite bullets to show technologies used, measurable outcomes, and responsibilities that match the target role.",
        })
    if scores["project_relevance"] < 60:
        plan.append({
            "section": "Projects",
            "action": "Add or improve project bullets so they clearly mention tools, features built, and impact.",
        })
    if scores["formatting_quality"] < 75 or formatting_issues:
        plan.append({
            "section": "Formatting",
            "action": "Use short bullet points, clean section headings, and avoid pasted text artifacts or dense skill paragraphs.",
        })
    if not resume["education"]:
        plan.append({
            "section": "Education",
            "action": "Add a clearly labeled education section with degree, institution, and dates.",
        })
    if job["title"]:
        plan.append({
            "section": "Profile Tailoring",
            "action": f"Tailor the resume summary and top bullets specifically for the role '{job['title']}'.",
        })

    return plan[:6]


def build_summary(overall_score):
    if overall_score >= 80:
        return "This resume is strongly aligned with the target role and should perform well in ATS screening."
    if overall_score >= 65:
        return "This resume is moderately aligned with the target role, but targeted improvements can noticeably raise its ATS performance."
    if overall_score >= 45:
        return "This resume has some relevant content, but it needs clearer tailoring and stronger keyword alignment."
    return "This resume currently has weak ATS alignment for the target role and needs focused improvements in keywords, relevance, and structure."


def generate_ats_report(resume_file="resume.json", jd_file="job_description.json"):
    resume_raw = load_json_file(resume_file)
    job_raw = load_json_file(jd_file)

    resume = normalize_resume(resume_raw)
    job = normalize_job_description(job_raw)

    resume_text = " ".join(
        resume["skills"] + resume["experience"] + resume["projects"] + resume["education"]
    )

    keyword_match_score, matched_keywords, missing_keywords = keyword_coverage_score(
        resume_text,
        job["keywords"],
    )
    skills_alignment_score, matched_skill_keywords, missing_skill_keywords = score_skills_alignment(resume, job)
    experience_relevance_score, matched_experience_keywords, missing_experience_keywords = score_experience_relevance(resume, job)
    project_relevance_score, matched_project_keywords, missing_project_keywords = score_project_relevance(resume, job)
    education_fit_score = score_education_fit(resume, job)
    role_alignment_score = score_role_alignment(resume, job)
    resume_completeness_score = score_resume_completeness(resume)
    formatting_quality_score, formatting_issues = score_formatting_quality(resume)

    scores = {
        "keyword_match": keyword_match_score,
        "skills_alignment": skills_alignment_score,
        "experience_relevance": experience_relevance_score,
        "project_relevance": project_relevance_score,
        "education_fit": education_fit_score,
        "role_alignment": role_alignment_score,
        "resume_completeness": resume_completeness_score,
        "formatting_quality": formatting_quality_score,
    }

    overall_score = int(sum(scores[key] * weight for key, weight in SECTION_WEIGHTS.items()))

    missing_required = [keyword for keyword in job["requirements"] if keyword not in resume_text.lower()]
    missing_preferred = [keyword for keyword in job["preferred"] if keyword not in resume_text.lower()]

    report_inputs = {
        "resume": resume,
        "job": job,
        "scores": scores,
        "keywords": {
            "matched": matched_keywords,
            "missing": missing_keywords,
            "missing_required": missing_required,
            "missing_preferred": missing_preferred,
            "matched_in_skills": matched_skill_keywords,
            "matched_in_experience": matched_experience_keywords,
            "matched_in_projects": matched_project_keywords,
            "missing_in_skills": missing_skill_keywords,
            "missing_in_experience": missing_experience_keywords,
            "missing_in_projects": missing_project_keywords,
        },
        "formatting_issues": formatting_issues,
    }

    report = {
        "overall_score": overall_score,
        "summary": build_summary(overall_score),
        "section_scores": {
            key: {
                "score": round(value, 2),
                "weight": SECTION_WEIGHTS[key],
                "description": {
                    "keyword_match": "Coverage of important required and preferred job keywords across the resume.",
                    "skills_alignment": "How strongly the skills section matches the role requirements.",
                    "experience_relevance": "How relevant the experience section is to the target role.",
                    "project_relevance": "How well the projects support the technical and practical needs of the role.",
                    "education_fit": "How well the education section supports the target role.",
                    "role_alignment": "How closely previous role titles and context align with the target title.",
                    "resume_completeness": "Whether the resume clearly contains major ATS-friendly sections with enough content.",
                    "formatting_quality": "How cleanly the resume is structured for parsing and readability.",
                }[key],
            }
            for key, value in scores.items()
        },
        "keywords": {
            "matched": matched_keywords[:20],
            "missing": missing_keywords[:20],
            "required": job["requirements"][:20],
            "preferred": job["preferred"][:20],
            "missing_required": missing_required[:20],
            "missing_preferred": missing_preferred[:20],
            "section_hits": {
                "skills": matched_skill_keywords[:10],
                "experience": matched_experience_keywords[:10],
                "projects": matched_project_keywords[:10],
            },
        },
        "formatting_issues": formatting_issues[:5],
        "strengths": build_strengths(report_inputs),
        "weaknesses": build_weaknesses(report_inputs),
        "suggestions": [item["action"] for item in build_improvement_plan(report_inputs)],
        "improvement_plan": build_improvement_plan(report_inputs),
    }

    print("--- ATS REPORT ---")
    print(json.dumps(report, indent=2))

    return report


def calculate_final_score(resume_file="resume.json", jd_file="job_description.json"):
    return generate_ats_report(resume_file=resume_file, jd_file=jd_file)["overall_score"]


if __name__ == "__main__":
    print(json.dumps(generate_ats_report(), indent=2))
