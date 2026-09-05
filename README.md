# EduMind — AI Teacher

EduMind is a multilingual, personalized AI teaching prototype that learns from uploaded study material, creates structured lessons, checks understanding, adapts explanations, and presents the lesson through an AI teacher avatar with neural voice.

## Active local architecture

The **root `src/` application** is the active frontend used by `npm run dev`.

- Frontend: React + Vite — `http://localhost:3000`
- Main API: FastAPI — `http://127.0.0.1:8000`
- Neural TTS: FastAPI + `edge-tts` — `http://127.0.0.1:8001`
- RAG: SentenceTransformers + FAISS
- Lesson generation: Gemini
- Database: Supabase

The older `client/` + `server/` implementation is retained for compatibility/reference but is **not used by the root Vite app**.

## Run locally

### Option A — Windows one-click launcher

Double-click `start.bat` from the project root. It starts:

1. Hindi/English TTS on port 8001
2. FastAPI backend on port 8000
3. Vite frontend on port 3000

Keep all three terminal windows open during a demo.

### Option B — manual terminals

Terminal 1:

```powershell
cd backend
python -m uvicorn tts_server:app --host 127.0.0.1 --port 8001
```

Terminal 2:

```powershell
cd backend
python -m uvicorn main:app --reload --port 8000
```

Terminal 3:

```powershell
npm run dev
```

Open `http://localhost:3000`.

## TTS health check

Open:

`http://127.0.0.1:8001/health`

A healthy response reports the configured neural voices. Hindi uses `hi-IN-SwaraNeural` and English uses `en-IN-NeerjaNeural`.

## Environment

Do not commit real secrets. Copy the example environment file and provide your own credentials.

Backend variables:

- `GEMINI_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_KEY`

Internet access is required for Gemini and the Edge neural TTS service.

## Main demo flow

Upload material → choose learner level → choose language → choose learning goal/style → generate lesson → AI teacher explains → Quick Check → adaptive response → progress.

## Build check

From the project root:

```powershell
npm run build
```

For a clean machine, install dependencies first with `npm install`.
