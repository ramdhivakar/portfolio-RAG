import json
import re
from pathlib import Path
from typing import Any


KNOWLEDGE_FILE = Path(__file__).with_name("profile.json")


STOP_WORDS = {
    "a", "an", "the", "is", "are", "was", "were",
    "do", "does", "did", "what", "which", "who",
    "how", "when", "where", "why", "tell", "me",
    "about", "and", "or", "to", "of", "in", "for",
    "his", "he", "has", "have", "with", "can",
    "ramdhivakar", "current"
}


def load_knowledge() -> dict[str, Any]:
    """Load the professional knowledge base."""

    if not KNOWLEDGE_FILE.exists():
        raise FileNotFoundError(
            f"Knowledge file not found: {KNOWLEDGE_FILE}"
        )

    with KNOWLEDGE_FILE.open("r", encoding="utf-8") as file:
        data = json.load(file)

    if not isinstance(data, dict):
        raise ValueError("The knowledge base must contain a JSON object.")

    return data


def flatten_knowledge(
    data: Any,
    path: str = "",
) -> list[dict[str, str]]:
    """Convert nested JSON data into searchable text entries."""

    entries: list[dict[str, str]] = []

    if isinstance(data, dict):
        for key, value in data.items():
            next_path = f"{path}.{key}" if path else key
            entries.extend(flatten_knowledge(value, next_path))

    elif isinstance(data, list):
        for index, value in enumerate(data):
            next_path = f"{path}[{index}]"
            entries.extend(flatten_knowledge(value, next_path))

    elif data is not None:
        entries.append(
            {
                "source": path,
                "text": f"{path.replace('_', ' ')}: {data}",
            }
        )

    return entries


def tokenize(text: str) -> set[str]:
    """Normalize text into searchable terms."""

    return set(
        re.findall(r"[a-zA-Z0-9.+#-]+", text.lower())
    )


def retrieve_knowledge(
    question: str,
    limit: int = 8,
) -> list[dict[str, str]]:
    """Retrieve profile entries relevant to a question."""

    if not question.strip():
        return []

    knowledge = load_knowledge()
    entries = flatten_knowledge(knowledge)

    question_tokens = tokenize(question) - STOP_WORDS

    if not question_tokens:
        return []

    scored_entries: list[tuple[int, dict[str, str]]] = []

    normalized_question = " ".join(question.lower().split())

    # Map common question phrases to relevant knowledge sections.
    section_aliases = {
        "current role": ["current_role", "job_title", "company"],
        "job title": ["job_title", "current_role"],
        "works at": ["company", "current_role"],
        "working at": ["company", "current_role"],
        "career history": ["career_history"],
        "work experience": ["career_history", "current_role"],
        "technical skills": ["technical_skills", "skills"],
        "programming skills": ["programming", "skills"],
        "projects": ["projects"],
        "certifications": ["certifications"],
        "education": ["education"],
    }

    preferred_sections: list[str] = []

    for phrase, sections in section_aliases.items():
        if phrase in normalized_question:
            preferred_sections.extend(sections)

    for entry in entries:
        source = entry["source"].lower()
        searchable_text = (
            f"{source.replace('_', ' ')} "
            f"{entry['text']}"
        )

        entry_tokens = tokenize(searchable_text)
        overlap = question_tokens & entry_tokens

        score = len(overlap) * 2

        # Prioritize entries from sections matching the question.
        for section in preferred_sections:
            if section in source:
                score += 10

        # Prefer the current role over older job-title entries
        # when the question explicitly asks about the current role.
        if "current role" in normalized_question:
            if "profile.current_role" in source:
                score += 15
            elif "career_history" in source:
                score -= 5

        if score > 0:
            scored_entries.append((score, entry))

    scored_entries.sort(
        key=lambda item: item[0],
        reverse=True,
    )

    return [
        entry
        for _, entry in scored_entries[:limit]
    ]