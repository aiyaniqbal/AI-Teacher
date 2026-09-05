"""
AI Teacher - backend entrypoint.

Day-1 milestone this scaffold gets you to:
  1. Upload a PDF/DOCX/PPTX  ->  text extracted, chunked, embedded, indexed
  2. Ask for a lesson (topic OR uploaded material) -> get back a structured
     JSON lesson plan, grounded in retrieved chunks if a document was uploaded

Nothing about video/avatar/TTS lives here yet, on purpose - get this loop
solid first. It's worth more in the rubric (Human-Like Teaching + AI/ML +
RAG = 50%) than the video/avatar layer (25%).
"""
import shutil
import uuid
from pathlib import Path

from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware

from supabase_client import supabase

from ingestion.extract_text import extract_text
from ingestion.chunker import chunk_text
from rag.embed_store import build_index, save_session, load_session, retrieve
from teacher_agent.planner import generate_lesson_plan

app = FastAPI(title="AI Teacher API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = Path("data/uploads")
VECTOR_DIR = Path("data/vector_store")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
VECTOR_DIR.mkdir(parents=True, exist_ok=True)


@app.post("/upload")
async def upload_material(file: UploadFile = File(...)):
    """Accepts a PDF/DOCX/PPTX/TXT, indexes it, returns a session_id to teach from."""
    session_id = str(uuid.uuid4())[:8]
    dest = UPLOAD_DIR / f"{session_id}_{file.filename}"

    with open(dest, "wb") as f:
        shutil.copyfileobj(file.file, f)

    text = extract_text(str(dest))
    chunks = chunk_text(text)
    index = build_index(chunks)
    save_session(str(VECTOR_DIR / session_id), chunks, index)

    return {"session_id": session_id, "chunks_indexed": len(chunks)}


@app.post("/lesson/start")
async def start_lesson(
    topic: str = Form(...),
    level: str = Form("beginner"),
    time_minutes: int = Form(20),
    language: str = Form("English"),
    learning_goal: str = Form("Understand"),
    teaching_style: str = Form("Visual"),
    session_id: str = Form(None),
):
    """
    Generates a structured lesson plan.
    - If session_id is provided, grounds the lesson in the uploaded material via RAG.
    - If not, teaches the topic from the LLM's general knowledge.
    """
    context_chunks = None
    if session_id:
        index, chunks = load_session(str(VECTOR_DIR / session_id))
        context_chunks = retrieve(topic, index, chunks, k=4)

    plan = generate_lesson_plan(
        topic=topic,
        level=level,
        time_minutes=time_minutes,
        language=language,
        learning_goal=learning_goal,
        teaching_style=teaching_style,
        context_chunks=context_chunks,
    )
    return plan

@app.get("/education-levels")
async def get_education_levels():
    try:
        response = (
            supabase
            .table("education_levels")
            .select("*")
            .execute()
        )

        return {
            "status": "ok",
            "levels": response.data,
        }

    except Exception as e:
        return {
            "status": "error",
            "levels": [],
            "message": str(e),
        }


@app.get("/health")
async def health():
    try:
        response = (
            supabase
            .table("education_levels")
            .select("*")
            .limit(1)
            .execute()
        )

        return {
            "status": "ok",
            "database": "connected",
            "data_found": len(response.data)
        }

    except Exception as e:
        return {
            "status": "ok",
            "database": "error",
            "message": str(e)
        }