"""
CV/Resume PDF Parser Module
Extracts structured data from PDF resumes: skills, education, experience, contact info.
"""

import re
import io
from typing import Optional
from PyPDF2 import PdfReader


# ── Section heading patterns ──
SECTION_HEADINGS = {
    "education": [
        r"education", r"academic\s*background", r"academic\s*qualifications",
        r"degrees", r"certifications?\s*(?:&|and)?\s*education",
    ],
    "experience": [
        r"(?:work|professional|employment)\s*(?:experience|history)",
        r"experience", r"career\s*history", r"work\s*history",
    ],
    "skills": [
        r"(?:technical\s*)?skills", r"technologies", r"competenc(?:ies|es)",
        r"tools?\s*(?:&|and)?\s*technologies", r"programming\s*languages",
        r"areas?\s*of\s*expertise",
    ],
    "projects": [
        r"projects?", r"personal\s*projects?", r"academic\s*projects?",
        r"selected\s*projects?", r"key\s*projects?",
    ],
    "publications": [
        r"publications?", r"research", r"papers?",
        r"journal\s*(?:articles?|papers?)", r"conference\s*(?:papers?|proceedings)",
    ],
    "summary": [
        r"(?:professional\s*)?summary", r"objective", r"about\s*me",
        r"profile", r"personal\s*statement", r"career\s*objective",
    ],
    "certifications": [
        r"certifications?", r"licenses?\s*(?:&|and)?\s*certifications?",
        r"professional\s*certifications?", r"credentials?",
    ],
    "awards": [
        r"awards?\s*(?:&|and)?\s*honors?", r"honors?\s*(?:&|and)?\s*awards?",
        r"achievements?", r"recognition",
    ],
    "languages": [
        r"languages?", r"language\s*skills",
    ],
}

# Pre-compile section patterns
_SECTION_PATTERNS = {}
for section, patterns in SECTION_HEADINGS.items():
    combined = "|".join(patterns)
    _SECTION_PATTERNS[section] = re.compile(
        r"^\s*(?:" + combined + r")\s*:?\s*$",
        re.IGNORECASE | re.MULTILINE,
    )

# ── Degree patterns ──
DEGREE_PATTERNS = [
    r"(?:Ph\.?D\.?|Doctor(?:ate)?)\s+(?:of|in)\s+\w[\w\s,]+",
    r"(?:M\.?S\.?|M\.?Sc\.?|Master(?:'?s)?)\s+(?:of|in)\s+\w[\w\s,]+",
    r"(?:B\.?S\.?|B\.?Sc\.?|B\.?A\.?|Bachelor(?:'?s)?)\s+(?:of|in)\s+\w[\w\s,]+",
    r"(?:MBA|M\.?B\.?A\.?)",
    r"(?:Associate(?:'?s)?)\s+(?:of|in)\s+\w[\w\s,]+",
]

# ── Contact patterns ──
EMAIL_PATTERN = re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+")
PHONE_PATTERN = re.compile(r"(?:\+?\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}")
LINKEDIN_PATTERN = re.compile(r"(?:https?://)?(?:www\.)?linkedin\.com/in/[\w-]+/?")
GITHUB_PATTERN = re.compile(r"(?:https?://)?(?:www\.)?github\.com/[\w-]+/?")

# ── Year patterns for education/experience ──
YEAR_RANGE_PATTERN = re.compile(
    r"(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[\w.]*\s*)?"
    r"(?:19|20)\d{2}"
    r"\s*[-–—to]+\s*"
    r"(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[\w.]*\s*)?"
    r"(?:(?:19|20)\d{2}|[Pp]resent|[Cc]urrent|[Nn]ow)",
    re.IGNORECASE,
)


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract all text from a PDF file."""
    try:
        reader = PdfReader(io.BytesIO(file_bytes))
        pages_text = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                pages_text.append(text.strip())
        return "\n\n".join(pages_text)
    except Exception as e:
        raise ValueError(f"Failed to parse PDF: {str(e)}")


def extract_contact_info(text: str) -> dict:
    """Extract email, phone, LinkedIn, GitHub from CV text."""
    contact = {}

    emails = EMAIL_PATTERN.findall(text)
    if emails:
        contact["email"] = emails[0]

    phones = PHONE_PATTERN.findall(text)
    if phones:
        # Filter out obvious non-phone matches (too short)
        valid_phones = [p.strip() for p in phones if len(re.sub(r"\D", "", p)) >= 7]
        if valid_phones:
            contact["phone"] = valid_phones[0]

    linkedin = LINKEDIN_PATTERN.findall(text)
    if linkedin:
        contact["linkedin"] = linkedin[0]

    github = GITHUB_PATTERN.findall(text)
    if github:
        contact["github"] = github[0]

    return contact


def extract_sections(text: str) -> dict:
    """Split CV text into sections based on common headings."""
    lines = text.split("\n")
    sections = {}
    current_section = "header"
    current_content = []

    for line in lines:
        matched_section = None
        stripped = line.strip()

        # Check if this line is a section heading
        for section_name, pattern in _SECTION_PATTERNS.items():
            if pattern.match(stripped):
                matched_section = section_name
                break

        if matched_section:
            # Save previous section
            content = "\n".join(current_content).strip()
            if content:
                sections[current_section] = content
            current_section = matched_section
            current_content = []
        else:
            current_content.append(line)

    # Save last section
    content = "\n".join(current_content).strip()
    if content:
        sections[current_section] = content

    return sections


def extract_education(text: str) -> list:
    """Extract education entries from the education section."""
    entries = []
    if not text:
        return entries

    # Try to find degree mentions
    for pattern in DEGREE_PATTERNS:
        matches = re.findall(pattern, text, re.IGNORECASE)
        for match in matches:
            entry = {"degree": match.strip()}

            # Try to find associated year range nearby
            # Look in a window around the match position
            pos = text.lower().find(match.lower())
            if pos >= 0:
                context = text[max(0, pos - 100):pos + len(match) + 100]
                years = YEAR_RANGE_PATTERN.findall(context)
                if years:
                    entry["period"] = years[0].strip()

            entries.append(entry)

    # If no degree patterns matched, try splitting by year ranges
    if not entries:
        year_splits = YEAR_RANGE_PATTERN.split(text)
        year_matches = YEAR_RANGE_PATTERN.findall(text)
        for i, period in enumerate(year_matches):
            if i < len(year_splits):
                content = year_splits[i].strip()
                if content and len(content) > 5:
                    entries.append({
                        "description": content[:200],
                        "period": period.strip(),
                    })

    return entries


def extract_experience(text: str) -> list:
    """Extract work experience entries."""
    entries = []
    if not text:
        return entries

    # Split by year ranges to find individual entries
    year_matches = YEAR_RANGE_PATTERN.findall(text)
    if year_matches:
        parts = YEAR_RANGE_PATTERN.split(text)
        for i, period in enumerate(year_matches):
            if i < len(parts):
                content = parts[i].strip()
                if content and len(content) > 3:
                    # Take first meaningful line as title/company
                    lines = [l.strip() for l in content.split("\n") if l.strip()]
                    entry = {
                        "period": period.strip(),
                    }
                    if lines:
                        entry["title_or_company"] = lines[0][:150]
                    if len(lines) > 1:
                        entry["details"] = " ".join(lines[1:])[:300]
                    entries.append(entry)
    else:
        # No year ranges found — just return the raw text as one block
        if text.strip():
            entries.append({"description": text.strip()[:500]})

    return entries


def extract_name(text: str) -> Optional[str]:
    """Try to extract the person's name from the top of the CV."""
    lines = text.strip().split("\n")
    for line in lines[:5]:  # Check first 5 lines
        stripped = line.strip()
        if not stripped:
            continue
        # Skip lines that are emails, phones, URLs
        if EMAIL_PATTERN.search(stripped) or LINKEDIN_PATTERN.search(stripped):
            continue
        if PHONE_PATTERN.search(stripped) and len(stripped) < 20:
            continue
        # Skip very long lines (likely not a name)
        if len(stripped) > 50:
            continue
        # Skip lines that look like addresses
        if any(word in stripped.lower() for word in ["street", "avenue", "road", "city", "state", "zip"]):
            continue
        # A name is typically 2-4 words, all starting with uppercase
        words = stripped.split()
        if 1 <= len(words) <= 5 and all(w[0].isupper() for w in words if w.isalpha()):
            return stripped

    return None


def parse_cv(file_bytes: bytes) -> dict:
    """
    Main entry point: parse a PDF CV and return structured data.

    Returns:
    {
        "name": "John Doe",
        "raw_text": "...",
        "contact": {"email": "...", "phone": "...", "linkedin": "...", "github": "..."},
        "sections": {"education": "...", "experience": "...", ...},
        "education": [...],
        "experience": [...],
        "skills": ["python", "java", ...],
        "page_count": 2,
    }
    """
    raw_text = extract_text_from_pdf(file_bytes)

    if not raw_text or len(raw_text.strip()) < 20:
        return {
            "error": "Could not extract meaningful text from this PDF",
            "raw_text": raw_text,
            "skills": [],
        }

    # Import skills extractor from main module
    from main import extract_skills

    sections = extract_sections(raw_text)
    contact = extract_contact_info(raw_text)
    name = extract_name(raw_text)
    skills = list(extract_skills(raw_text))

    # Extract education and experience from their sections if available
    education_text = sections.get("education", "")
    experience_text = sections.get("experience", "")

    education = extract_education(education_text)
    experience = extract_experience(experience_text)

    # Count pages
    try:
        reader = PdfReader(io.BytesIO(file_bytes))
        page_count = len(reader.pages)
    except Exception:
        page_count = 0

    return {
        "name": name,
        "raw_text": raw_text,
        "contact": contact,
        "sections": {k: v[:1000] for k, v in sections.items()},  # Truncate for response size
        "education": education,
        "experience": experience,
        "skills": sorted(skills),
        "page_count": page_count,
    }
