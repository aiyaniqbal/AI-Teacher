"""
AI Teacher lesson planner.

Generates a structured, curriculum-aware lesson from:
- topic
- retrieved study material
- learner level
- learning goal
- preferred teaching style
- time budget
- teaching language

Language handling is intentionally strict:
- English -> English
- Hindi -> Hindi (Devanagari)
- Hinglish -> natural Hindi + English mix using Roman script

The returned JSON is kept compatible with the existing frontend.
"""

import json
import os
import re
from typing import List, Optional

from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")


def _normalize_language(language: str) -> str:
    """Normalize UI language values so the model receives one exact mode."""
    value = (language or "English").strip().lower()

    if value in {"hindi", "हिंदी", "hi", "hi-in"}:
        return "Hindi"

    if value in {"hinglish", "hinglish (hindi + english)", "hindi + english"}:
        return "Hinglish"

    return "English"


def _language_instruction(language: str) -> str:
    """Return explicit instructions that prevent Gemini from defaulting to English."""
    if language == "Hindi":
        return """
LANGUAGE MODE: HINDI

You MUST teach the student in Hindi.
ALL student-facing teaching text MUST be written in Hindi using Devanagari script.
This includes:
- title
- segment title
- concept
- content
- examples
- Quick Check questions
- all four option texts
- Quick Check explanations
- assessment content
- visual suggestions when they are student-facing

Do NOT translate Hindi teaching into English.
Do NOT write Hindi in Roman/Latin script.
Technical/scientific terms may include their standard English term in parentheses when that makes the explanation clearer, but the surrounding explanation must remain Hindi.

The uploaded reference material may be in English. Understand it and teach its supported facts in Hindi; do not simply copy English sentences.
"""

    if language == "Hinglish":
        return """
LANGUAGE MODE: HINGLISH

You MUST teach the student in natural Hinglish.
Write Hindi primarily in Roman/Latin script, naturally mixed with commonly used English technical terms.
Do NOT produce formal Hindi-only Devanagari prose.
Do NOT produce an English-only lesson.

All student-facing fields must follow Hinglish, including:
- title
- segment title
- concept
- content
- examples
- Quick Check questions
- all four option texts
- Quick Check explanations
- assessment content
- visual suggestions when student-facing

The result should sound like a friendly Indian teacher speaking naturally to a student.
"""

    return """
LANGUAGE MODE: ENGLISH

Teach the student in clear, natural English.
All student-facing fields should be in English.
"""


_PROMPT_TEMPLATE = """
You are an expert curriculum designer and personal AI teacher.

Create a lesson that feels like a real teacher is teaching the student.

Learner profile:
- Level: {level}
- Learning goal: {learning_goal}
- Preferred teaching style: {teaching_style}
- Language for teaching: {language}
- Time available: {time_minutes} minutes

Topic:
{topic}

PERSONALIZATION REQUIREMENTS:
- Adapt depth, pacing, examples, and assessment emphasis to the learning goal.
- Adapt explanation format to the preferred teaching style.
- Simple: short, intuitive explanations and minimal jargon.
- Visual: describe diagrams, relationships, and visual mental models.
- Examples: teach through concrete worked examples and applications.
- Technical: use precise terminology, mechanisms, formulas, and deeper reasoning.
- Exam Preparation: emphasize high-yield facts, common mistakes, and exam-style checks.
- Interview: emphasize reasoning, practical application, and concise explanations.
- Revision: prioritize concise recall, comparisons, and quick checks.
- Deep Learning: add mechanisms, connections, and deeper reasoning.

Reference material retrieved from the student's uploaded document.
Use this material as ground truth. Do not contradict it.
If the material is empty, use your general knowledge.
---
{context}
---

{language_instruction}

CRITICAL LANGUAGE REQUIREMENT:
The selected teaching language is "{language}".
Never silently switch to English.
Every student-facing text field in the JSON MUST follow the selected language mode above.
The JSON keys and enum values such as "explain", "example", and "assessment" must remain in English because they are API fields.

Return ONLY valid JSON.
Do not use markdown.
Do not wrap the JSON in ```.

Use EXACTLY this structure:

{{
  "title": "string",
  "total_time_minutes": {time_minutes},
  "segments": [
    {{
      "id": 1,
      "type": "explain",
      "title": "Clear concept name",
      "concept": "Short concept name",
      "content": "Teacher explanation in {language}",
      "visual_suggestion": "Description of a useful visual",
      "est_minutes": 5,
      "quick_check": {{
        "question": "A short question testing this concept",
        "options": [
          {{
            "id": "a",
            "text": "Option A"
          }},
          {{
            "id": "b",
            "text": "Option B"
          }},
          {{
            "id": "c",
            "text": "Option C"
          }},
          {{
            "id": "d",
            "text": "Option D"
          }}
        ],
        "correct_option_id": "a",
        "explanation": "Short explanation of why the answer is correct"
      }}
    }}
  ]
}}

IMPORTANT RULES:

1. Every segment MUST have a meaningful "title".
   Never use generic names such as "Concept 1", "Part 1", or "Segment 1".

2. Every segment MUST have a meaningful "concept".

3. Every "explain" segment MUST have a "quick_check".

4. Quick Checks must test the concept that was just explained.

5. Every Quick Check must contain:
   - question
   - exactly 4 options
   - correct_option_id
   - explanation

6. The correct answer must be one of the four option IDs.

7. Do not make every correct answer the same option.

8. Questions should be appropriate for a {level} learner.

9. Use the uploaded reference material whenever available.

10. Do not invent facts that contradict the uploaded material.

11. Include a mixture of:
   - explanation
   - examples
   - visual explanations where useful
   - questions

12. Always finish with one "assessment" segment.

13. The final assessment segment should contain a short set of questions covering the major concepts.

14. Keep the total estimated time close to {time_minutes} minutes.

15. ALL student-facing content MUST be written in the selected language mode. Follow the LANGUAGE MODE instructions above.

16. Make the lesson specific to "{topic}".

17. Avoid generic filler such as:
   - "Let's learn this topic"
   - "This is important"
   - "You should understand this"
   unless followed by useful subject-specific information.

18. The content should be detailed enough that the AI Teacher can actually teach the lesson from it.

19. If the reference material contains terminology that should remain in English, preserve the technical term where appropriate, but still explain it in the selected teaching language.

20. Do not put markdown, HTML, or code fences inside any JSON string.
"""


def _localized_mock_text(language: str, topic: str, level: str) -> dict:
    """Fallback content that also respects the selected language."""
    if language == "Hindi":
        return {
            "title": f"{topic} — {level} स्तर",
            "intro_title": f"{topic} का परिचय",
            "intro_concept": f"{topic} की मूल अवधारणा",
            "intro_content": (
                f"इस पाठ में हम {topic} की मूल अवधारणा को सरल भाषा में समझेंगे। "
                f"हम मुख्य विचार, एक उदाहरण और कुछ जाँच प्रश्नों के माध्यम से सीखेंगे।"
            ),
            "example_title": f"{topic} का उदाहरण",
            "example_content": (
                f"अब {topic} को एक सरल उदाहरण से समझते हैं। "
                f"उदाहरण को चरण-दर-चरण देखें और ध्यान दें कि मुख्य अवधारणा कहाँ लागू होती है।"
            ),
            "assessment_title": f"{topic} का अंतिम आकलन",
            "assessment_content": (
                f"इस आकलन में {topic} की मुख्य अवधारणाओं की समझ जाँची जाएगी।"
            ),
            "q1": f"{topic} की मुख्य अवधारणा क्या है?",
            "a1": f"{topic} की मूल अवधारणा",
            "wrong1": "इस पाठ से असंबंधित विचार",
            "wrong2": "पूरी तरह अलग विषय",
            "wrong3": "इनमें से कोई नहीं",
            "ex1": f"पहला विकल्प {topic} की मूल अवधारणा बताता है।",
        }

    if language == "Hinglish":
        return {
            "title": f"{topic} — {level} level",
            "intro_title": f"{topic} ka Introduction",
            "intro_concept": f"{topic} ki Basic Concept",
            "intro_content": (
                f"Is lesson mein hum {topic} ki basic concept ko simple language mein "
                f"samjhenge. Hum main idea, ek example aur quick questions ke through seekhenge."
            ),
            "example_title": f"{topic} ka Example",
            "example_content": (
                f"Ab {topic} ko ek simple example se samajhte hain. "
                f"Example ko step-by-step dekho aur notice karo ki main concept kahan apply hota hai."
            ),
            "assessment_title": f"{topic} ka Final Assessment",
            "assessment_content": (
                f"Is assessment mein {topic} ke major concepts ki understanding check hogi."
            ),
            "q1": f"{topic} ki main concept kya hai?",
            "a1": f"{topic} ki basic concept",
            "wrong1": "Lesson se unrelated idea",
            "wrong2": "Bilkul different topic",
            "wrong3": "Inmein se koi nahi",
            "ex1": f"Option A {topic} ki basic concept ko correctly describe karta hai.",
        }

    return {
        "title": f"{topic} ({level})",
        "intro_title": f"Introduction to {topic}",
        "intro_concept": f"Core idea of {topic}",
        "intro_content": (
            f"In this lesson, we will understand the core idea of {topic} "
            f"using a clear explanation, an example, and quick questions."
        ),
        "example_title": f"Example of {topic}",
        "example_content": (
            f"Let's understand {topic} with a simple example. "
            f"Follow the example step by step and identify where the main concept applies."
        ),
        "assessment_title": f"Final Assessment: {topic}",
        "assessment_content": (
            f"This assessment checks understanding of the major concepts in {topic}."
        ),
        "q1": f"What is the main idea of {topic}?",
        "a1": f"The core idea of {topic}",
        "wrong1": "An unrelated idea",
        "wrong2": "A completely different subject",
        "wrong3": "None of these",
        "ex1": f"Option A correctly describes the core idea of {topic}.",
    }


def _mock_plan(
    topic: str,
    level: str,
    time_minutes: int,
    language: str,
    learning_goal: str = "Understand",
    teaching_style: str = "Visual",
) -> dict:
    """Fallback plan used when Gemini is unavailable."""
    language = _normalize_language(language)
    text = _localized_mock_text(language, topic, level)

    first_minutes = max(1, time_minutes // 3)
    second_minutes = max(1, time_minutes // 3)
    assessment_minutes = max(1, time_minutes - first_minutes - second_minutes)

    return {
        "title": text["title"],
        "total_time_minutes": time_minutes,
        "personalization": {
            "learning_goal": learning_goal,
            "teaching_style": teaching_style,
            "level": level,
            "language": language,
        },
        "segments": [
            {
                "id": 1,
                "type": "explain",
                "title": text["intro_title"],
                "concept": text["intro_concept"],
                "content": text["intro_content"],
                "visual_suggestion": (
                    f"A simple diagram explaining {topic}"
                    if language == "English"
                    else (
                        f"{topic} को समझाने वाला एक सरल diagram"
                        if language == "Hinglish"
                        else f"{topic} को समझाने वाला एक सरल चित्र"
                    )
                ),
                "est_minutes": first_minutes,
                "quick_check": {
                    "question": text["q1"],
                    "options": [
                        {"id": "a", "text": text["a1"]},
                        {"id": "b", "text": text["wrong1"]},
                        {"id": "c", "text": text["wrong2"]},
                        {"id": "d", "text": text["wrong3"]},
                    ],
                    "correct_option_id": "a",
                    "explanation": text["ex1"],
                },
            },
            {
                "id": 2,
                "type": "example",
                "title": text["example_title"],
                "concept": text["intro_concept"],
                "content": text["example_content"],
                "visual_suggestion": (
                    f"Step-by-step example diagram for {topic}"
                    if language == "English"
                    else (
                        f"{topic} का step-by-step example diagram"
                        if language == "Hinglish"
                        else f"{topic} का चरण-दर-चरण उदाहरण चित्र"
                    )
                ),
                "est_minutes": second_minutes,
                "quick_check": {
                    "question": text["q1"],
                    "options": [
                        {"id": "a", "text": text["wrong1"]},
                        {"id": "b", "text": text["a1"]},
                        {"id": "c", "text": text["wrong2"]},
                        {"id": "d", "text": text["wrong3"]},
                    ],
                    "correct_option_id": "b",
                    "explanation": text["ex1"],
                },
            },
            {
                "id": 3,
                "type": "assessment",
                "title": text["assessment_title"],
                "concept": text["intro_concept"],
                "content": text["assessment_content"],
                "visual_suggestion": "none",
                "est_minutes": assessment_minutes,
                "quick_check": None,
            },
        ],
    }


def _clean_json_response(raw: str) -> str:
    """Remove accidental markdown fences and surrounding whitespace."""
    raw = (raw or "").strip()

    if raw.startswith("```json"):
        raw = raw[7:]
    elif raw.startswith("```"):
        raw = raw[3:]

    if raw.endswith("```"):
        raw = raw[:-3]

    return raw.strip()


def _safe_text(value, fallback: str = "") -> str:
    """Convert model values to safe strings for the frontend."""
    if value is None:
        return fallback
    if isinstance(value, str):
        return value.strip()
    return str(value).strip()


def _normalize_quick_check(
    quick_check,
    concept: str,
    language: str,
) -> Optional[dict]:
    """Ensure every Quick Check has exactly four valid options."""
    if not isinstance(quick_check, dict):
        return None

    question = _safe_text(quick_check.get("question"))
    explanation = _safe_text(quick_check.get("explanation"))

    raw_options = quick_check.get("options")
    options = []

    if isinstance(raw_options, list):
        for index, option in enumerate(raw_options[:4]):
            if isinstance(option, dict):
                option_id = _safe_text(option.get("id"), chr(97 + index))
                option_text = _safe_text(option.get("text"))
                if option_text:
                    options.append({"id": option_id, "text": option_text})

    # If Gemini returned fewer than four options, add language-aware fallbacks.
    fallback_options = {
        "English": [
            "The main idea of this concept",
            "An unrelated idea",
            "A different subject",
            "None of these",
        ],
        "Hindi": [
            "इस अवधारणा का मुख्य विचार",
            "एक असंबंधित विचार",
            "एक अलग विषय",
            "इनमें से कोई नहीं",
        ],
        "Hinglish": [
            "Is concept ka main idea",
            "Ek unrelated idea",
            "Ek different subject",
            "Inmein se koi nahi",
        ],
    }[language]

    used_ids = set()
    normalized = []
    for index in range(4):
        option_id = chr(97 + index)
        existing = next(
            (item for item in options if item["id"] == option_id),
            None,
        )
        if existing:
            normalized.append(existing)
            used_ids.add(existing["id"])
        else:
            normalized.append(
                {"id": option_id, "text": fallback_options[index]}
            )

    if not question:
        question = {
            "English": f"What is the main idea of {concept}?",
            "Hindi": f"{concept} की मुख्य अवधारणा क्या है?",
            "Hinglish": f"{concept} ki main concept kya hai?",
        }[language]

    if not explanation:
        explanation = {
            "English": "The correct option best matches the concept just explained.",
            "Hindi": "सही विकल्प अभी समझाई गई अवधारणा से सबसे अच्छी तरह मेल खाता है।",
            "Hinglish": "Correct option abhi explain kiye gaye concept ko best describe karta hai.",
        }[language]

    correct_id = _safe_text(
        quick_check.get("correct_option_id")
        or quick_check.get("correctOptionId")
    ).lower()

    if correct_id not in {"a", "b", "c", "d"}:
        correct_id = "a"

    return {
        "question": question,
        "options": normalized,
        "correct_option_id": correct_id,
        "explanation": explanation,
    }


def _validate_plan(
    plan: dict,
    topic: str,
    level: str,
    time_minutes: int,
    language: str,
) -> dict:
    """
    Validate and normalize the Gemini response so the frontend receives
    predictable fields.
    """
    language = _normalize_language(language)

    if not isinstance(plan, dict):
        return _mock_plan(topic, level, time_minutes, language)

    segments = plan.get("segments")

    if not isinstance(segments, list) or not segments:
        return _mock_plan(topic, level, time_minutes, language)

    cleaned_segments = []

    for index, segment in enumerate(segments):
        if not isinstance(segment, dict):
            continue

        segment_type = _safe_text(
            segment.get("type"),
            "explain",
        ).lower()

        title = _safe_text(
            segment.get("title")
            or segment.get("concept")
            or segment.get("topic"),
            {
                "English": f"{topic} — Part {index + 1}",
                "Hindi": f"{topic} — भाग {index + 1}",
                "Hinglish": f"{topic} — Part {index + 1}",
            }[language],
        )

        concept = _safe_text(
            segment.get("concept")
            or segment.get("title")
            or topic,
            topic,
        )

        content = _safe_text(
            segment.get("content")
            or segment.get("explanation")
            or segment.get("description"),
        )

        if not content:
            content = {
                "English": f"Explanation of {concept}.",
                "Hindi": f"{concept} की सरल व्याख्या।",
                "Hinglish": f"{concept} ki simple explanation.",
            }[language]

        quick_check = _normalize_quick_check(
            segment.get("quick_check"),
            concept,
            language,
        )

        # Every explain segment must have a Quick Check.
        if segment_type == "explain" and quick_check is None:
            quick_check = _normalize_quick_check(
                {
                    "question": None,
                    "options": [],
                    "correct_option_id": "a",
                    "explanation": None,
                },
                concept,
                language,
            )

        try:
            est_minutes = int(
                segment.get("est_minutes")
                or segment.get("minutes")
                or 5
            )
        except (TypeError, ValueError):
            est_minutes = 5

        est_minutes = max(1, est_minutes)

        cleaned_segments.append(
            {
                "id": segment.get("id", index + 1),
                "type": segment_type,
                "title": title,
                "concept": concept,
                "content": content,
                "visual_suggestion": _safe_text(
                    segment.get("visual_suggestion"),
                    "none",
                ),
                "est_minutes": est_minutes,
                "quick_check": quick_check,
            }
        )

    if not cleaned_segments:
        return _mock_plan(topic, level, time_minutes, language)

    # Always finish with an assessment segment.
    if cleaned_segments[-1].get("type") != "assessment":
        assessment_content = {
            "English": f"Final assessment covering the major concepts from {topic}.",
            "Hindi": f"{topic} की प्रमुख अवधारणाओं पर अंतिम आकलन।",
            "Hinglish": f"{topic} ke major concepts par final assessment.",
        }[language]

        cleaned_segments.append(
            {
                "id": len(cleaned_segments) + 1,
                "type": "assessment",
                "title": {
                    "English": f"Final Assessment: {topic}",
                    "Hindi": f"अंतिम आकलन: {topic}",
                    "Hinglish": f"Final Assessment: {topic}",
                }[language],
                "concept": topic,
                "content": assessment_content,
                "visual_suggestion": "none",
                "est_minutes": max(2, time_minutes // 5),
                "quick_check": None,
            }
        )

    plan["title"] = _safe_text(
        plan.get("title"),
        {
            "English": topic,
            "Hindi": topic,
            "Hinglish": topic,
        }[language],
    )

    try:
        plan["total_time_minutes"] = int(
            plan.get("total_time_minutes") or time_minutes
        )
    except (TypeError, ValueError):
        plan["total_time_minutes"] = time_minutes

    plan["segments"] = cleaned_segments

    return plan



def _hindi_script_ratio(value) -> float:
    """Return the share of alphabetic characters written in Devanagari."""
    text = str(value or "")
    letters = [ch for ch in text if ch.isalpha()]
    if not letters:
        return 1.0
    devanagari = sum("\u0900" <= ch <= "\u097f" for ch in letters)
    return devanagari / len(letters)


def _plan_needs_hindi_translation(plan: dict) -> bool:
    """Detect an English lesson returned despite Hindi mode."""
    if not isinstance(plan, dict):
        return False
    texts = []
    for segment in plan.get("segments", []) or []:
        if isinstance(segment, dict):
            texts.extend([
                segment.get("title", ""),
                segment.get("concept", ""),
                segment.get("content", ""),
            ])
            qc = segment.get("quick_check")
            if isinstance(qc, dict):
                texts.append(qc.get("question", ""))
                texts.append(qc.get("explanation", ""))
                texts.extend(
                    o.get("text", "") for o in (qc.get("options") or [])
                    if isinstance(o, dict)
                )
    combined = " ".join(str(x) for x in texts if x)
    return bool(combined.strip()) and _hindi_script_ratio(combined) < 0.25


def _translate_plan_to_hindi(model, plan: dict) -> dict:
    """Translate accidental English lesson content and verify the result.

    We never silently return the English lesson after a failed Hindi correction.
    A second attempt is allowed; the caller falls back to a guaranteed-Hindi
    local lesson if both attempts fail.
    """
    base_json = json.dumps(plan, ensure_ascii=False)
    last_error = None

    for attempt in range(2):
        translation_prompt = f"""
You are correcting an AI teacher lesson that was requested in Hindi but was returned in English.
Translate ONLY student-facing values into natural, clear Hindi written in Devanagari.
Preserve the exact JSON structure, keys, IDs, types, correct_option_id values, numbers and formulas.
Keep standard scientific/technical terms in English only when natural, but the surrounding explanation
must be Hindi. Do not translate JSON keys. Do not add or remove segments or options.
Do not return markdown or code fences. Return ONLY valid JSON.

Attempt: {attempt + 1}
LESSON JSON:
{base_json}
"""
        try:
            response = model.generate_content(translation_prompt)
            translated = json.loads(_clean_json_response(response.text))
            if not isinstance(translated, dict):
                raise ValueError("Translated lesson was not a JSON object")
            if not _plan_needs_hindi_translation(translated):
                return translated
            base_json = json.dumps(translated, ensure_ascii=False)
            last_error = ValueError("Translated lesson still contains mostly non-Hindi text")
        except Exception as exc:
            last_error = exc

    raise RuntimeError(f"Hindi translation verification failed: {last_error}")


def generate_lesson_plan(
    topic: str,
    level: str = "beginner",
    time_minutes: int = 20,
    language: str = "English",
    learning_goal: str = "Understand",
    teaching_style: str = "Visual",
    context_chunks: Optional[List[str]] = None,
) -> dict:
    """Generate a lesson while preserving the selected teaching language."""
    language = _normalize_language(language)

    context = "\n\n".join(
        str(chunk) for chunk in context_chunks if chunk
    ) if context_chunks else ""

    if not GEMINI_API_KEY:
        return _mock_plan(
            topic,
            level,
            time_minutes,
            language,
            learning_goal,
            teaching_style,
        )

    import google.generativeai as genai

    genai.configure(api_key=GEMINI_API_KEY)

    model = genai.GenerativeModel("gemini-3.6-flash")

    prompt = _PROMPT_TEMPLATE.format(
        level=level,
        language=language,
        learning_goal=learning_goal,
        teaching_style=teaching_style,
        time_minutes=time_minutes,
        topic=topic,
        context=(
            context
            or "(no uploaded material - teach from general knowledge)"
        ),
        language_instruction=_language_instruction(language),
    )

    try:
        response = model.generate_content(prompt)
        raw = _clean_json_response(response.text)
        plan = json.loads(raw)

        # Gemini can occasionally ignore the language constraint when the
        # reference material is strongly English. Before the lesson reaches
        # the frontend/TTS, force a second-pass Hindi translation.
        if language == "Hindi" and _plan_needs_hindi_translation(plan):
            try:
                plan = _translate_plan_to_hindi(model, plan)
            except Exception as translation_error:
                # Do not let English reach the teacher when Hindi was selected.
                # The local fallback is fully Devanagari and is safer than speaking
                # the wrong language.
                print("Hindi translation verification failed; using Hindi fallback:", translation_error)
                return _mock_plan(topic, level, time_minutes, "Hindi", learning_goal, teaching_style)

        validated = _validate_plan(
            plan=plan,
            topic=topic,
            level=level,
            time_minutes=time_minutes,
            language=language,
        )

        # Final server-side guard: Hindi mode must never return an English lesson.
        if language == "Hindi" and _plan_needs_hindi_translation(validated):
            print("Final Hindi guard rejected non-Hindi lesson; using Hindi fallback.")
            return _mock_plan(topic, level, time_minutes, "Hindi", learning_goal, teaching_style)

        validated["personalization"] = {
            "learning_goal": learning_goal,
            "teaching_style": teaching_style,
            "level": level,
            "language": language,
        }
        return validated

    except Exception as error:
        print("Lesson generation failed:", error)

        return _mock_plan(
            topic,
            level,
            time_minutes,
            language,
            learning_goal,
            teaching_style,
        )
