import numpy as np
import os
import json
import random
import glob
from pathlib import Path
import aiohttp
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, UploadFile, File, Query
from pydantic import BaseModel
from typing import Optional, List
import requests
import re
from cv_parser import parse_cv

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Curated list of tech skills for precise keyword matching
# ---------------------------------------------------------------------------
TECH_SKILLS = [
    # Programming Languages
    "python", "java", "javascript", "typescript", "c#", "c++", "c",
    "go", "golang", "rust", "ruby", "php", "swift", "kotlin", "scala",
    "r", "matlab", "perl", "dart", "lua", "haskell", "elixir", "clojure",
    "objective-c", "groovy", "visual basic", "vb.net", "f#", "fortran",
    "assembly", "cobol", "sql", "plsql", "t-sql", "bash", "powershell",
    "shell", "solidity",
    # Frontend
    "react", "reactjs", "react.js", "angular", "angularjs", "vue",
    "vuejs", "vue.js", "svelte", "next.js", "nextjs", "nuxt", "nuxtjs",
    "html", "css", "sass", "scss", "less", "tailwind", "tailwindcss",
    "bootstrap", "jquery", "ember", "backbone", "webpack", "vite",
    "redux", "zustand", "mobx",
    # Backend
    "node", "nodejs", "node.js", "express", "expressjs",
    "django", "flask", "fastapi", "spring", "spring boot", "springboot",
    ".net", "asp.net", "rails", "ruby on rails", "laravel", "symfony",
    "nestjs", "gin", "fiber", "actix", "graphql", "rest", "restful",
    "grpc", "microservices",
    # Databases
    "postgresql", "postgres", "mysql", "mariadb", "sqlite", "oracle",
    "sql server", "mssql", "mongodb", "dynamodb", "cassandra",
    "couchdb", "redis", "elasticsearch", "neo4j", "firebase",
    "supabase", "cockroachdb",
    # Cloud & DevOps
    "aws", "azure", "gcp", "google cloud", "docker", "kubernetes",
    "k8s", "terraform", "ansible", "jenkins", "github actions",
    "gitlab ci", "ci/cd", "circleci", "nginx", "apache",
    "cloudflare", "heroku", "vercel", "netlify", "digitalocean",
    "linux", "ubuntu", "centos", "windows server",
    # Data & AI/ML
    "machine learning", "deep learning", "nlp",
    "natural language processing", "computer vision", "tensorflow",
    "pytorch", "keras", "scikit-learn", "sklearn", "pandas", "numpy",
    "spark", "hadoop", "kafka", "airflow", "dbt", "snowflake",
    "bigquery", "databricks", "power bi", "tableau", "data science",
    "data engineering", "etl", "data pipeline",
    # Mobile
    "android", "ios", "react native", "flutter", "swiftui",
    "jetpack compose", "xamarin", "ionic", "cordova",
    # Tools & Others
    "git", "github", "gitlab", "bitbucket", "jira", "confluence",
    "agile", "scrum", "kanban", "figma", "sketch",
    "rabbitmq", "celery", "websocket", "oauth", "jwt",
    "blockchain", "web3", "cybersecurity", "penetration testing",
    "unity", "unreal engine", "iot", "embedded systems",
]

# Pre-compile a set for O(1) lookups and regex patterns for multi-word skills
_SKILL_SET = set(TECH_SKILLS)
_SKILL_PATTERNS = {
    skill: re.compile(r'\b' + re.escape(skill) + r'\b', re.IGNORECASE)
    for skill in TECH_SKILLS
}


def extract_skills(text: str) -> set:
    """Extract known tech skills from a text string."""
    if not text:
        return set()
    found = set()
    text_lower = text.lower()
    for skill, pattern in _SKILL_PATTERNS.items():
        if pattern.search(text_lower):
            found.add(skill)
    return found


def compute_recommendation_scores(user_description: str, jobs: list) -> list:
    """
    Hybrid scoring: TF-IDF cosine similarity + direct skill matching.

    Score = 0.4 * tfidf_similarity + 0.6 * skill_match_ratio
    """
    if not jobs or not user_description:
        return []

    # ── Extract user skills ──
    user_skills = extract_skills(user_description)

    # ── TF-IDF cosine similarity ──
    job_descriptions = [job.get("description", "") or "" for job in jobs]
    job_titles = [job.get("title", "") or "" for job in jobs]

    # Combine title + description for better matching
    job_texts = [f"{title} {desc}" for title, desc in zip(job_titles, job_descriptions)]

    try:
        vectorizer = TfidfVectorizer(
            stop_words='english',
            max_features=5000,
            ngram_range=(1, 2),  # Unigrams + bigrams for phrases like "machine learning"
            min_df=1,
        )
        job_vectors = vectorizer.fit_transform(job_texts)
        user_vector = vectorizer.transform([user_description])
        tfidf_scores = cosine_similarity(user_vector, job_vectors).flatten()
    except Exception:
        tfidf_scores = np.zeros(len(jobs))

    # ── Skill matching ──
    skill_scores = np.zeros(len(jobs))
    if user_skills:
        for i, text in enumerate(job_texts):
            job_skills = extract_skills(text)
            matched = user_skills & job_skills
            skill_scores[i] = len(matched) / len(user_skills) if user_skills else 0.0

    # ── Hybrid score ──
    WEIGHT_TFIDF = 0.4
    WEIGHT_SKILL = 0.6
    combined_scores = WEIGHT_TFIDF * tfidf_scores + WEIGHT_SKILL * skill_scores

    # ── Build results (only include jobs with score > 0) ──
    results = []
    for i, score in enumerate(combined_scores):
        if score > 0.01:
            job_skills = extract_skills(job_texts[i])
            matched_skills = list(user_skills & job_skills) if user_skills else []
            results.append({
                "job": jobs[i],
                "similarity_score": f"{score:.4f}",
                "matched_skills": matched_skills,
                "tfidf_score": f"{tfidf_scores[i]:.4f}",
                "skill_score": f"{skill_scores[i]:.4f}",
            })

    # Sort by combined score descending
    results.sort(key=lambda x: float(x["similarity_score"]), reverse=True)

    # Deduplicate: many DB rows are scraped multiple times (same title, same/empty
    # company, different UUIDs). Collapse them so each logical job appears once.
    results = _deduplicate_recommendations(results)
    return results


def _deduplicate_recommendations(results: list) -> list:
    """
    Collapse functional duplicates (same title + same company, different UUIDs).
    Within a (title, company) group, keep the highest-scoring entry.
    Additionally, drop entries with an empty companyName whose title also has a
    non-empty-company variant — those are almost always the same job re-scraped
    without proper company linkage.
    """
    groups = {}
    for entry in results:
        job = entry.get("job") or {}
        title = (job.get("title") or "").strip().lower()
        company = (job.get("companyName") or "").strip().lower()
        if not title:
            continue
        key = (title, company)
        existing = groups.get(key)
        if existing is None or float(entry["similarity_score"]) > float(existing["similarity_score"]):
            groups[key] = entry

    titles_with_company = {title for (title, company) in groups.keys() if company}

    deduped = []
    for (title, company), entry in groups.items():
        if not company and title in titles_with_company:
            continue
        deduped.append(entry)

    deduped.sort(key=lambda x: float(x["similarity_score"]), reverse=True)
    return deduped


@app.post("/recommendation/")
async def recommendation(user_description: str):
    """
    Given a user profile description (skills, interests, etc.),
    return job recommendations ranked by relevance.
    """
    try:
        jobs_response = requests.get("http://job-service:8040/", timeout=10)
        if jobs_response.status_code != 200:
            return {"error": "Could not fetch jobs", "recommended_jobs": []}
        jobs = jobs_response.json()
    except Exception as e:
        return {"error": f"Jobs service unavailable: {str(e)}", "recommended_jobs": []}

    recommended_jobs = compute_recommendation_scores(user_description, jobs)

    return {
        "recommended_jobs": recommended_jobs,
        "total_jobs": len(jobs),
        "matched_count": len(recommended_jobs),
        "user_skills_detected": list(extract_skills(user_description)),
    }


@app.get("/recommendation/skills/")
async def list_skills():
    """Return the list of recognized tech skills."""
    return {"skills": sorted(TECH_SKILLS)}


@app.get("/")
async def get_all():
    try:
        job_response = requests.get("http://job-service:8040/", timeout=10)
        return {"jobs": job_response.json()}
    except Exception as e:
        return {"error": str(e)}


# ---------------------------------------------------------------------------
# Pydantic models for request bodies
# ---------------------------------------------------------------------------
class DescriptionRequest(BaseModel):
    description: str


# ---------------------------------------------------------------------------
# CV Parsing & Storage Endpoints (persisted to user-service PostgreSQL)
# ---------------------------------------------------------------------------

def _persist_cv_to_user_service(user_id: str, cv_data: dict) -> bool:
    """Save parsed CV data to user-service PostgreSQL via API."""
    try:
        # Remove raw_text to keep the stored JSON smaller
        data_to_store = {k: v for k, v in cv_data.items() if k != "raw_text"}
        payload = {"cvData": json.dumps(data_to_store, ensure_ascii=False)}
        resp = requests.patch(
            f"http://user-service:8020/cv/{user_id}",
            json=payload,
            timeout=10,
        )
        return resp.status_code == 200
    except Exception as e:
        print(f"[WARN] Could not persist CV to user-service: {e}")
        return False


@app.post("/cv/parse/")
async def parse_cv_upload(
    file: UploadFile = File(...),
    user_id: Optional[str] = Query(None, description="User ID to store parsed CV for"),
):
    """
    Upload a PDF CV file. Returns structured parsed data.
    If user_id is provided, persists the parsed data to user-service PostgreSQL.
    """
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        return {"error": "Please upload a PDF file"}

    try:
        file_bytes = await file.read()
        result = parse_cv(file_bytes)

        if user_id and "error" not in result:
            stored = _persist_cv_to_user_service(user_id, result)
            result["stored_for_user"] = user_id
            result["persisted_to_db"] = stored

        return result
    except ValueError as e:
        return {"error": str(e)}
    except Exception as e:
        return {"error": f"Failed to process PDF: {str(e)}"}


@app.post("/cv/parse-url/")
async def parse_cv_from_url(
    url: str,
    user_id: Optional[str] = Query(None, description="User ID to store parsed CV for"),
):
    """
    Download a PDF from a URL, parse it, and return structured data.
    Useful for testing with public CVs.
    """
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, timeout=aiohttp.ClientTimeout(total=30)) as response:
                if response.status != 200:
                    return {"error": f"Failed to download PDF: HTTP {response.status}"}

                file_bytes = await response.read()

        result = parse_cv(file_bytes)
        result["source_url"] = url

        if user_id and "error" not in result:
            stored = _persist_cv_to_user_service(user_id, result)
            result["stored_for_user"] = user_id
            result["persisted_to_db"] = stored

        return result
    except aiohttp.ClientError as e:
        return {"error": f"Download failed: {str(e)}"}
    except ValueError as e:
        return {"error": str(e)}
    except Exception as e:
        return {"error": f"Failed to process PDF: {str(e)}"}


@app.post("/cv/recommend/")
async def cv_based_recommendations(
    file: UploadFile = File(...),
):
    """
    Upload a PDF CV and get job recommendations based on extracted skills
    and experience (instead of using the short user description).
    """
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        return {"error": "Please upload a PDF file"}

    try:
        file_bytes = await file.read()
        cv_data = parse_cv(file_bytes)

        if "error" in cv_data:
            return cv_data

        # Build a rich description from the CV for recommendation matching
        description_parts = []
        if cv_data.get("skills"):
            description_parts.append("Skills: " + ", ".join(cv_data["skills"]))
        for section_name in ["summary", "experience", "education", "projects"]:
            section_text = cv_data.get("sections", {}).get(section_name, "")
            if section_text:
                description_parts.append(section_text)

        enriched_description = "\n".join(description_parts)

        # Fetch jobs and compute recommendations
        try:
            jobs_response = requests.get("http://job-service:8040/", timeout=10)
            if jobs_response.status_code != 200:
                return {"error": "Could not fetch jobs", "recommended_jobs": []}
            jobs = jobs_response.json()
        except Exception as e:
            return {"error": f"Jobs service unavailable: {str(e)}", "recommended_jobs": []}

        recommended_jobs = compute_recommendation_scores(enriched_description, jobs)

        return {
            "recommended_jobs": recommended_jobs,
            "total_jobs": len(jobs),
            "matched_count": len(recommended_jobs),
            "cv_skills_detected": cv_data.get("skills", []),
            "cv_name": cv_data.get("name"),
            "cv_education": cv_data.get("education", []),
        }
    except Exception as e:
        return {"error": f"Failed to process: {str(e)}"}


@app.get("/cv/{user_id}")
async def get_stored_cv(user_id: str):
    """
    Retrieve stored parsed CV data for a specific user from user-service.
    """
    try:
        resp = requests.get(f"http://user-service:8020/{user_id}", timeout=10)
        if resp.status_code == 200:
            user_data = resp.json()
            cv_data_str = user_data.get("cvData")
            if cv_data_str:
                return json.loads(cv_data_str)
        return {"error": "No CV found for this user", "user_id": user_id}
    except Exception as e:
        return {"error": f"Could not fetch CV data: {str(e)}"}


# ---------------------------------------------------------------------------
# Job Skill Parsing Endpoints
# ---------------------------------------------------------------------------

@app.post("/jobs/parse-skills/")
async def parse_job_skills(request: DescriptionRequest):
    """
    Extract tech skills from a job description text.
    Returns a sorted list of recognized skills.
    """
    skills = sorted(extract_skills(request.description))
    return {"skills": skills, "count": len(skills)}


@app.post("/jobs/parse-skills-batch/")
async def parse_job_skills_batch():
    """
    Fetch ALL jobs from job-service, extract skills from each description,
    and update each job's requiredSkills field. One-time batch operation.
    """
    try:
        jobs_response = requests.get("http://job-service:8040/", timeout=30)
        if jobs_response.status_code != 200:
            return {"error": "Could not fetch jobs"}
        jobs = jobs_response.json()
    except Exception as e:
        return {"error": f"Jobs service unavailable: {str(e)}"}

    updated = 0
    skipped = 0
    errors = 0

    for job in jobs:
        job_id = job.get("id")
        description = job.get("description", "") or ""
        existing_skills = job.get("requiredSkills")

        # Skip jobs that already have skills extracted
        if existing_skills:
            skipped += 1
            continue

        if not description.strip():
            skipped += 1
            continue

        skills = sorted(extract_skills(description))
        if not skills:
            skipped += 1
            continue

        try:
            resp = requests.patch(
                f"http://job-service:8040/{job_id}/skills",
                json={"requiredSkills": json.dumps(skills)},
                timeout=10,
            )
            if resp.status_code == 200:
                updated += 1
            else:
                errors += 1
        except Exception:
            errors += 1

    return {
        "total_jobs": len(jobs),
        "updated": updated,
        "skipped": skipped,
        "errors": errors,
    }


# ---------------------------------------------------------------------------
# Quiz System: Question Bank, Experience Detection, Generation & Validation
# ---------------------------------------------------------------------------

# Paths
_QUESTION_BANK_DIR = Path(__file__).parent / "question_bank"
_FAMILIAR_WITH_FILE = Path(__file__).parent / "familiar_with" / "technologies.json"

# Load familiar-with data once
_FAMILIAR_DATA = {}
try:
    with open(_FAMILIAR_WITH_FILE, "r", encoding="utf-8") as f:
        _FAMILIAR_DATA = json.load(f)
except Exception:
    _FAMILIAR_DATA = {}

# Technology name normalization map (maps TECH_SKILLS aliases → question bank file prefix)
_TECH_TO_BANK = {
    "python": "python", "java": "java", "javascript": "javascript", "js": "javascript",
    "typescript": "typescript", "ts": "typescript",
    "react": "react", "reactjs": "react", "react.js": "react",
    "node": "nodejs", "nodejs": "nodejs", "node.js": "nodejs",
    "spring": "spring", "spring boot": "spring", "springboot": "spring",
    "postgresql": "postgresql", "postgres": "postgresql", "sql": "postgresql",
    "docker": "docker", "git": "git", "github": "git",
    "personality": "personality",
}

# Experience detection patterns
_HIGH_EXP_PATTERNS = [
    re.compile(r'\b(senior|lead|principal|staff|architect|manager)\b', re.I),
    re.compile(r'\b(\d+)\+?\s*(?:years?|yrs?)\b', re.I),
    re.compile(r'\b(extensive|expert|advanced|deep)\s+(?:experience|knowledge)\b', re.I),
]
_LOW_EXP_PATTERNS = [
    re.compile(r'\b(junior|entry[\s-]?level|intern|trainee|graduate|new\s*grad|associate|fresh)\b', re.I),
    re.compile(r'\b(0[\s-]?[12]|1[\s-]?[23])\s*(?:years?|yrs?)\b', re.I),
    re.compile(r'\b(no\s+experience\s+required|beginner|starter)\b', re.I),
]


def detect_experience_level(description: str) -> str:
    """Detect experience level from job description. Returns 'low' or 'high'."""
    if not description:
        return "low"
    text = description.lower()

    high_score = 0
    low_score = 0

    for pattern in _HIGH_EXP_PATTERNS:
        match = pattern.search(text)
        if match:
            # Check if years >= 4
            groups = match.groups()
            if groups and groups[0].isdigit():
                years = int(groups[0])
                if years >= 4:
                    high_score += 2
                else:
                    low_score += 1
            else:
                high_score += 1

    for pattern in _LOW_EXP_PATTERNS:
        if pattern.search(text):
            low_score += 1

    return "high" if high_score > low_score else "low"


def _load_questions(technology: str, level: str) -> list:
    """Load questions from the question bank for a given technology and level."""
    bank_key = _TECH_TO_BANK.get(technology.lower())
    if not bank_key:
        return []

    filepath = _QUESTION_BANK_DIR / f"{bank_key}_{level}.json"
    if not filepath.exists():
        return []

    try:
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data.get("questions", [])
    except Exception:
        return []


def generate_quiz(technologies: list, level: str, count: int = 10) -> dict:
    """Generate a quiz by selecting questions from the question bank."""
    all_questions = []
    tech_sources = set()

    # TEMPORARY: Force personality test
    technologies = ["personality"]
    level = "low"

    for tech in technologies:
        questions = _load_questions(tech, level)
        if questions:
            tech_sources.add(_TECH_TO_BANK.get(tech.lower(), tech))
            all_questions.extend(questions)

    if not all_questions:
        return {"questions": [], "count": 0, "technologies": [], "level": level}

    # Remove duplicates by question ID
    seen = set()
    unique = []
    for q in all_questions:
        if q["id"] not in seen:
            seen.add(q["id"])
            unique.append(q)

    # Randomly select up to 'count' questions
    selected = random.sample(unique, min(count, len(unique)))
    random.shuffle(selected)

    # Strip correct answers from the response (only send to validate endpoint)
    quiz_questions = []
    for q in selected:
        quiz_questions.append({
            "id": q["id"],
            "type": q["type"],
            "question": q["question"],
            "code": q.get("code"),
            "options": q["options"],
        })

    return {
        "questions": quiz_questions,
        "count": len(quiz_questions),
        "technologies": sorted(tech_sources),
        "level": level,
        "time_limit_minutes": 15,
    }


def validate_quiz(answers: list) -> dict:
    """Validate quiz answers and return score with explanations."""
    results = []
    correct_count = 0

    # Build a lookup of all questions
    question_map = {}
    for filepath in _QUESTION_BANK_DIR.glob("*.json"):
        if filepath.name.startswith("_"):
            continue
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                data = json.load(f)
                for q in data.get("questions", []):
                    question_map[q["id"]] = q
        except Exception:
            continue

    for answer in answers:
        q_id = answer.get("id")
        selected = answer.get("selected")  # index of the selected option

        question = question_map.get(q_id)
        if not question:
            results.append({
                "id": q_id,
                "correct": False,
                "selected": selected,
                "correct_answer": None,
                "explanation": "Question not found",
            })
            continue

        is_correct = selected == question["correct"]
        if is_correct:
            correct_count += 1

        results.append({
            "id": q_id,
            "correct": is_correct,
            "selected": selected,
            "correct_answer": question["correct"],
            "explanation": question.get("explanation", ""),
        })

    total = len(answers)
    return {
        "score": correct_count,
        "total": total,
        "percentage": round((correct_count / total * 100) if total > 0 else 0),
        "results": results,
    }


# ---------------------------------------------------------------------------
# Pydantic models for quiz endpoints
# ---------------------------------------------------------------------------

class QuizGenerateRequest(BaseModel):
    technologies: List[str]
    level: str = "low"
    count: int = 10


class QuizAnswer(BaseModel):
    id: str
    selected: int


class QuizValidateRequest(BaseModel):
    answers: List[QuizAnswer]


class FamiliarRequest(BaseModel):
    technologies: List[str]
    level: str = "low"


# ---------------------------------------------------------------------------
# Quiz API Endpoints
# ---------------------------------------------------------------------------

@app.post("/quiz/generate/")
async def quiz_generate(request: QuizGenerateRequest):
    """Generate a quiz for given technologies and experience level."""
    quiz = generate_quiz(request.technologies, request.level, request.count)
    return quiz


@app.post("/quiz/generate-for-job/")
async def quiz_generate_for_job(job_id: str = Query(...)):
    """Generate a quiz based on a job listing's description."""
    try:
        resp = requests.get(f"http://job-service:8040/{job_id}", timeout=10)
        if resp.status_code != 200:
            return {"error": "Job not found", "questions": []}
        job = resp.json()
    except Exception as e:
        return {"error": f"Job service unavailable: {str(e)}", "questions": []}

    description = job.get("description", "") or ""
    title = job.get("title", "") or ""
    full_text = f"{title} {description}"

    # Extract skills and detect level
    skills = sorted(extract_skills(full_text))
    level = job.get("experienceLevel") or detect_experience_level(full_text)

    quiz = generate_quiz(skills, level, 10)
    quiz["job_id"] = job_id
    quiz["detected_skills"] = skills
    quiz["detected_level"] = level
    return quiz


@app.post("/quiz/validate/")
async def quiz_validate(request: QuizValidateRequest):
    """Validate quiz answers and return score with explanations."""
    answers = [{"id": a.id, "selected": a.selected} for a in request.answers]
    return validate_quiz(answers)


@app.get("/quiz/familiar/")
async def quiz_familiar(
    technologies: str = Query(..., description="Comma-separated tech list"),
    level: str = Query("low", description="Experience level: low or high"),
):
    """Return 'You Should Be Familiar With' data for given technologies."""
    tech_list = [t.strip().lower() for t in technologies.split(",") if t.strip()]
    result = {}

    for tech in tech_list:
        # Map aliases to canonical names
        canonical = _TECH_TO_BANK.get(tech, tech)
        if canonical in _FAMILIAR_DATA:
            tech_data = _FAMILIAR_DATA[canonical]
            result[canonical] = tech_data.get(level, tech_data.get("low", {}))

    return {"technologies": result, "level": level}


@app.get("/quiz/familiar-for-job/")
async def quiz_familiar_for_job(job_id: str = Query(...)):
    """Return 'You Should Be Familiar With' data based on job listing."""
    try:
        resp = requests.get(f"http://job-service:8040/{job_id}", timeout=10)
        if resp.status_code != 200:
            return {"error": "Job not found", "technologies": {}}
        job = resp.json()
    except Exception as e:
        return {"error": f"Job service unavailable: {str(e)}", "technologies": {}}

    description = job.get("description", "") or ""
    title = job.get("title", "") or ""
    full_text = f"{title} {description}"

    skills = sorted(extract_skills(full_text))
    level = job.get("experienceLevel") or detect_experience_level(full_text)

    result = {}
    for tech in skills:
        canonical = _TECH_TO_BANK.get(tech, tech)
        if canonical in _FAMILIAR_DATA:
            tech_data = _FAMILIAR_DATA[canonical]
            result[canonical] = tech_data.get(level, tech_data.get("low", {}))

    return {
        "technologies": result,
        "level": level,
        "detected_skills": skills,
        "job_id": job_id,
    }


@app.get("/quiz/available-technologies/")
async def quiz_available_technologies():
    """List all technologies that have quiz questions available."""
    available = {}
    for filepath in _QUESTION_BANK_DIR.glob("*.json"):
        if filepath.name.startswith("_"):
            continue
        parts = filepath.stem.rsplit("_", 1)
        if len(parts) == 2:
            tech, level = parts
            if tech not in available:
                available[tech] = []
            available[tech].append(level)

    return {"technologies": available}


# ---------------------------------------------------------------------------
# Trending Skills Endpoint
# ---------------------------------------------------------------------------

from datetime import datetime, timedelta, timezone


def _parse_iso_date(value):
    if not value:
        return None
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except Exception:
        return None


@app.get("/skills/trending")
async def trending_skills(limit: int = Query(8, ge=1, le=30)):
    """
    Aggregate `requiredSkills` across recent job listings and return rolling
    growth %. Compares the last 30 days against the previous 30 days. Also
    returns a small monthly histogram for sparkline rendering.
    """
    try:
        jobs_response = requests.get("http://job-service:8040/", timeout=15)
        if jobs_response.status_code != 200:
            return {"skills": [], "monthly": []}
        jobs = jobs_response.json()
    except Exception as e:
        return {"skills": [], "monthly": [], "error": str(e)}

    now = datetime.now(timezone.utc)
    recent_window_start = now - timedelta(days=30)
    previous_window_start = now - timedelta(days=60)

    recent_counts: dict = {}
    previous_counts: dict = {}
    monthly_buckets: dict = {}

    for job in jobs:
        skills_raw = job.get("requiredSkills") or ""
        skills_in_job = {
            s.strip().lower()
            for s in re.split(r"[,;|]", skills_raw)
            if s and s.strip()
        }
        if not skills_in_job:
            # Fall back to extracting from description
            skills_in_job = extract_skills(
                (job.get("title") or "") + " " + (job.get("description") or "")
            )
        if not skills_in_job:
            continue

        posted = _parse_iso_date(job.get("postedDate")) or _parse_iso_date(
            job.get("createdDate")
        )
        if not posted:
            for s in skills_in_job:
                recent_counts[s] = recent_counts.get(s, 0) + 1
            continue

        if posted.tzinfo is None:
            posted = posted.replace(tzinfo=timezone.utc)

        if posted >= recent_window_start:
            for s in skills_in_job:
                recent_counts[s] = recent_counts.get(s, 0) + 1
        elif posted >= previous_window_start:
            for s in skills_in_job:
                previous_counts[s] = previous_counts.get(s, 0) + 1

        month_label = posted.strftime("%b")
        bucket = monthly_buckets.setdefault(
            (posted.year, posted.month), {"label": month_label, "count": 0}
        )
        bucket["count"] += 1

    total_recent = sum(recent_counts.values()) or 1
    trending = []
    for skill, count in recent_counts.items():
        prev = previous_counts.get(skill, 0)
        if prev == 0:
            growth = 100 if count > 0 else 0
        else:
            growth = int(round(((count - prev) / prev) * 100))
        share = int(round((count / total_recent) * 100))
        trending.append(
            {
                "skill": skill,
                "count": count,
                "growth": growth,
                "share": share,
            }
        )

    trending.sort(key=lambda x: (x["growth"], x["count"]), reverse=True)
    trending = trending[:limit]

    monthly = [
        {"label": v["label"], "count": v["count"]}
        for k, v in sorted(monthly_buckets.items())
    ][-5:]

    return {"skills": trending, "monthly": monthly}


# ---------------------------------------------------------------------------
# Profile Summary / Market Value / Matching helpers
# ---------------------------------------------------------------------------

class ProfileSummaryRequest(BaseModel):
    description: Optional[str] = None
    cvData: Optional[str] = None
    targetRole: Optional[str] = None


def _summarize_profile(description: str, cv: dict, target_role: Optional[str]) -> str:
    skills = []
    if cv and isinstance(cv.get("skills"), list):
        skills = cv["skills"][:8]
    skills_text = ", ".join(skills) if skills else "general engineering"

    exp_count = 0
    if cv and isinstance(cv.get("experience"), list):
        exp_count = len(cv["experience"])
    elif description:
        exp_count = max(0, len(description.split(".")) - 1)

    role_hint = target_role or "engineering"
    seniority = "senior" if exp_count >= 3 else "mid-level" if exp_count >= 1 else "entry-level"
    return (
        f"You present as a {seniority} {role_hint} candidate with hands-on exposure to "
        f"{skills_text}. Based on your CV and description, recruiters will read your profile as "
        f"strongly aligned with hands-on technical roles."
    )


@app.post("/profile/summary/")
async def profile_summary(request: ProfileSummaryRequest):
    cv = {}
    if request.cvData:
        try:
            cv = json.loads(request.cvData)
        except Exception:
            cv = {}
    summary = _summarize_profile(request.description or "", cv, request.targetRole)
    return {"summary": summary}


class MarketValueRequest(BaseModel):
    description: Optional[str] = None
    cvData: Optional[str] = None
    location: Optional[str] = "Türkiye"


@app.post("/profile/market-value/")
async def profile_market_value(request: MarketValueRequest):
    """
    Estimate the user's monthly gross salary band (TRY) from their CV/description.
    Deterministic heuristic so it stays stable between calls.
    """
    cv = {}
    if request.cvData:
        try:
            cv = json.loads(request.cvData)
        except Exception:
            cv = {}

    skills_count = 0
    if cv and isinstance(cv.get("skills"), list):
        skills_count = len(cv["skills"])
    exp_count = 0
    if cv and isinstance(cv.get("experience"), list):
        exp_count = len(cv["experience"])

    base = 45000
    base += min(skills_count, 30) * 1500
    base += min(exp_count, 10) * 4000

    estimate = base
    distribution = {
        "junior": int(base * 0.55),
        "mid": int(base * 0.78),
        "you": estimate,
        "senior": int(base * 1.18),
        "lead": int(base * 1.35),
    }
    market_average = int((distribution["mid"] + distribution["senior"]) / 2)
    delta_pct = int(round(((estimate - market_average) / market_average) * 100))

    return {
        "estimate": estimate,
        "currency": "TRY",
        "deltaVsMarketPct": delta_pct,
        "distribution": distribution,
        "location": request.location,
    }


class AcceptanceRequest(BaseModel):
    userDescription: str
    cvData: Optional[str] = None
    jobId: Optional[str] = None
    jobDescription: Optional[str] = None
    jobTitle: Optional[str] = None
    similarityScore: Optional[float] = None


def _years_of_experience(cv: dict) -> int:
    if not cv:
        return 0
    exp = cv.get("experience")
    if isinstance(exp, list):
        return len(exp)
    return 0


def _seniority_target(text: str) -> str:
    t = (text or "").lower()
    if any(w in t for w in ["senior", "lead", "principal", "kıdemli", "uzman"]):
        return "high"
    if any(w in t for w in ["junior", "entry", "intern", "stajyer"]):
        return "low"
    return "mid"


@app.post("/matching/acceptance/")
async def matching_acceptance(request: AcceptanceRequest):
    cv = {}
    if request.cvData:
        try:
            cv = json.loads(request.cvData)
        except Exception:
            cv = {}

    user_skills = extract_skills(request.userDescription or "")
    if cv and isinstance(cv.get("skills"), list):
        for s in cv["skills"]:
            user_skills.add(s.strip().lower())

    job_skills = extract_skills(
        (request.jobTitle or "") + " " + (request.jobDescription or "")
    )

    if job_skills:
        overlap = len(user_skills & job_skills) / len(job_skills)
    else:
        overlap = 0.5
    technical_fit = int(round(overlap * 100))

    if request.similarityScore is not None:
        sim = request.similarityScore
        if sim <= 1:
            sim = sim * 100
        technical_fit = int(round((technical_fit + sim) / 2))

    years = _years_of_experience(cv)
    target = _seniority_target((request.jobTitle or "") + " " + (request.jobDescription or ""))
    if target == "high":
        experience_fit = min(100, 35 + years * 12)
    elif target == "low":
        experience_fit = max(40, 100 - years * 6)
    else:
        experience_fit = min(100, 55 + years * 8)

    culture_fit = max(40, min(95, technical_fit - 10 + (years % 5) * 4))
    overall = int(round((technical_fit * 0.45) + (experience_fit * 0.35) + (culture_fit * 0.20)))

    return {
        "technicalFit": technical_fit,
        "experienceFit": experience_fit,
        "cultureFit": culture_fit,
        "overall": overall,
        "userSkillsMatched": sorted(user_skills & job_skills),
        "jobSkillsMissing": sorted(job_skills - user_skills),
        "jobSkillsAll": sorted(job_skills),
    }


class AdviceRequest(BaseModel):
    userDescription: str
    cvData: Optional[str] = None
    jobTitle: Optional[str] = None
    jobDescription: Optional[str] = None


@app.post("/matching/advice/")
async def matching_advice(request: AdviceRequest):
    cv = {}
    if request.cvData:
        try:
            cv = json.loads(request.cvData)
        except Exception:
            cv = {}

    user_skills = extract_skills(request.userDescription or "")
    if cv and isinstance(cv.get("skills"), list):
        for s in cv["skills"]:
            user_skills.add(s.strip().lower())

    job_skills = extract_skills(
        (request.jobTitle or "") + " " + (request.jobDescription or "")
    )
    missing = sorted(job_skills - user_skills)[:3]

    tips = []
    for s in missing:
        tips.append({
            "title": f"Learn {s.title()}",
            "description": f"This role specifically calls for {s}. Adding evidence of it on your CV could lift acceptance significantly.",
            "boostPct": 8 + (len(s) % 6),
        })
    if request.jobTitle:
        tips.append({
            "title": f"Reference '{request.jobTitle}' keywords",
            "description": "Mirror two or three concrete phrases from the job description in your cover letter for a stronger semantic match.",
            "boostPct": 5,
        })
    return {"tips": tips[:3]}


class ReplySuggestionsRequest(BaseModel):
    lastMessages: List[str] = []


@app.post("/chat/suggest-replies/")
async def chat_suggest_replies(request: ReplySuggestionsRequest):
    last = " ".join(request.lastMessages[-3:]).lower()
    chips = []
    if any(w in last for w in ["interview", "mülakat", "meet", "görüşme"]):
        chips.append("That time works for me")
        chips.append("Can we move it one day?")
        chips.append("Should I prepare anything specific?")
    if any(w in last for w in ["cv", "resume"]):
        chips.append("I will share an updated CV")
    if any(w in last for w in ["offer", "salary", "maaş", "teklif"]):
        chips.append("Could you share the full package?")
    if not chips:
        chips = [
            "Thanks for reaching out",
            "Could you tell me more about the role?",
            "Happy to schedule a call",
        ]
    return {"suggestions": chips[:4]}


class LiveHintRequest(BaseModel):
    step: int
    skills: List[str] = []
    careerGoal: Optional[str] = None
    title: Optional[str] = None


@app.post("/onboarding/live-hint/")
async def onboarding_live_hint(request: LiveHintRequest):
    if request.step <= 1:
        return {
            "hint": "Add your current title and city so the AI can compare against the right market."
        }
    if request.step == 2:
        if request.skills:
            return {
                "hint": f"{', '.join(request.skills[:3])} is a strong combo. Expect many active matches in the next step."
            }
        return {"hint": "Select at least 3 skills to unlock useful matches."}
    if request.step == 3:
        if request.careerGoal:
            return {
                "hint": f"{request.careerGoal} is a clear target. We'll size the gap on the final step."
            }
        return {"hint": "Pick the career goal that fits where you want to be in 12 months."}
    return {"hint": "Profile ready. We'll surface your top three semantic matches on the next step."}
