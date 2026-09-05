"""Reliable AI Teacher TTS server.

Runs independently from the existing FastAPI app on port 8001 so no changes
are required to the existing backend routing. Hindi/Hinglish are rendered by
Microsoft Edge neural voices through edge-tts instead of browser speechSynthesis.
"""
from __future__ import annotations

import io
import json
import os
import re
from typing import Literal

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel, Field

load_dotenv()

app = FastAPI(title="EduMind Reliable Teacher TTS", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SpeechRequest(BaseModel):
    text: str = Field(min_length=1, max_length=12000)
    language: Literal["English", "Hindi", "Hinglish"] = "English"
    rate: float = Field(default=1.0, ge=0.5, le=2.0)


def devanagari_ratio(text: str) -> float:
    letters = [c for c in text if c.isalpha()]
    if not letters:
        return 1.0
    return sum("\u0900" <= c <= "\u097f" for c in letters) / len(letters)


def _clean_json(raw: str) -> str:
    raw = (raw or "").strip()
    raw = re.sub(r"^```(?:json)?\s*", "", raw, flags=re.I)
    raw = re.sub(r"\s*```$", "", raw)
    return raw.strip()


def translate_to_hindi(text: str) -> str:
    """Translate an accidental English transcript before speech.

    We deliberately fail instead of speaking the English text with a Hindi
    voice. That prevents the exact failure mode this project had before.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is required for Hindi transcript correction.")

    import google.generativeai as genai

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-3.6-flash")
    prompt = f"""
Translate the following AI teacher speech into natural spoken Hindi.
Use Devanagari script. Keep scientific/technical terms in English only when
that is natural for an Indian classroom, but the surrounding sentence must be Hindi.
Do not summarize. Do not add information. Return ONLY the translated text.

TEXT:
{text}
"""
    response = model.generate_content(prompt)
    translated = (response.text or "").strip()
    if not translated:
        raise RuntimeError("Gemini returned empty Hindi speech text.")
    if devanagari_ratio(translated) < 0.35:
        raise RuntimeError("Hindi translation did not contain enough Devanagari text.")
    return translated


def translate_to_hinglish(text: str) -> str:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is required for Hinglish transcript correction.")

    import google.generativeai as genai

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-3.6-flash")
    prompt = f"""
Rewrite the following AI teacher speech as natural Indian Hinglish.
Use Roman/Latin script for Hindi words, mixed naturally with English technical terms.
Do not summarize or add information. Return ONLY the rewritten speech.

TEXT:
{text}
"""
    response = model.generate_content(prompt)
    translated = (response.text or "").strip()
    if not translated:
        raise RuntimeError("Gemini returned empty Hinglish speech text.")
    # Hinglish should not be pure Devanagari.
    if devanagari_ratio(translated) > 0.20:
        raise RuntimeError("Hinglish correction returned Devanagari instead of Roman script.")
    return translated


async def make_mp3(text: str, language: str, rate: float) -> bytes:
    try:
        import edge_tts
    except ImportError as exc:
        raise RuntimeError(
            "edge-tts is not installed. Run start_hindi_voice.bat once."
        ) from exc

    if language == "Hindi":
        voice = "hi-IN-SwaraNeural"
        # Never allow English transcript text into Hindi TTS.
        if devanagari_ratio(text) < 0.35:
            text = translate_to_hindi(text)
    elif language == "Hinglish":
        voice = "hi-IN-SwaraNeural"
        if devanagari_ratio(text) > 0.20:
            text = translate_to_hinglish(text)
    else:
        voice = "en-IN-NeerjaNeural"

    # edge-tts expects a percentage-style rate such as +0%.
    rate_percent = round((rate - 1.0) * 100)
    rate_string = f"{rate_percent:+d}%"

    communicate = edge_tts.Communicate(
        text=text,
        voice=voice,
        rate=rate_string,
    )
    audio = io.BytesIO()
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio.write(chunk["data"])
    result = audio.getvalue()
    if not result:
        raise RuntimeError("TTS provider returned no audio data.")
    return result


@app.get("/health")
async def health():
    return {"ok": True, "service": "edumind-tts", "voices": {
        "Hindi": "hi-IN-SwaraNeural",
        "Hinglish": "hi-IN-SwaraNeural",
        "English": "en-IN-NeerjaNeural",
    }}


@app.post("/tts")
async def tts(request: SpeechRequest):
    text = request.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Speech text is empty.")

    try:
        audio = await make_mp3(text, request.language, request.rate)
    except Exception as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    return Response(
        content=audio,
        media_type="audio/mpeg",
        headers={"Cache-Control": "no-store"},
    )
