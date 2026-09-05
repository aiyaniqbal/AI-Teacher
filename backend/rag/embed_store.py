"""Embed chunks with sentence-transformers and store/retrieve them via FAISS."""
import json
from pathlib import Path
from typing import List, Tuple

import faiss
from sentence_transformers import SentenceTransformer

_MODEL_NAME = "all-MiniLM-L6-v2"
_model = None


def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer(_MODEL_NAME)
    return _model


def build_index(chunks: List[str]) -> faiss.IndexFlatL2:
    model = get_model()
    embeddings = model.encode(chunks, convert_to_numpy=True, show_progress_bar=False)
    dim = embeddings.shape[1]
    index = faiss.IndexFlatL2(dim)
    index.add(embeddings.astype("float32"))
    return index


def save_session(session_dir: str, chunks: List[str], index: faiss.IndexFlatL2) -> None:
    Path(session_dir).mkdir(parents=True, exist_ok=True)
    faiss.write_index(index, str(Path(session_dir) / "index.faiss"))
    with open(Path(session_dir) / "chunks.json", "w", encoding="utf-8") as f:
        json.dump(chunks, f, ensure_ascii=False)


def load_session(session_dir: str) -> Tuple[faiss.IndexFlatL2, List[str]]:
    index = faiss.read_index(str(Path(session_dir) / "index.faiss"))
    with open(Path(session_dir) / "chunks.json", "r", encoding="utf-8") as f:
        chunks = json.load(f)
    return index, chunks


def retrieve(query: str, index: faiss.IndexFlatL2, chunks: List[str], k: int = 4) -> List[str]:
    model = get_model()
    query_vec = model.encode([query], convert_to_numpy=True).astype("float32")
    _, indices = index.search(query_vec, k)
    return [chunks[i] for i in indices[0] if 0 <= i < len(chunks)]
