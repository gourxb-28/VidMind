import logging
from functools import lru_cache

import numpy as np
from sentence_transformers import SentenceTransformer

from app.config import settings

logger = logging.getLogger("app.embeddings")


QUERY_INSTRUCTION = "Represent this sentence for searching relevant passages: "

BATCH_SIZE = 32


class EmbeddingError(Exception):
    """Raised when embedding fails. `message` is safe to show to the user."""

    def __init__(self, message: str, status_code: int = 500):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


@lru_cache(maxsize=1)
def get_model() -> SentenceTransformer:
    """Load the embedding model once and reuse it (loading takes seconds)."""
    logger.info("Loading embedding model: %s", settings.embedding_model)
    return SentenceTransformer(settings.embedding_model)


def _encode(texts: list[str]) -> np.ndarray:
    try:
        vectors = get_model().encode(
            texts,
            batch_size=BATCH_SIZE,
            normalize_embeddings=True,
            show_progress_bar=False,
        )
    except Exception:
        logger.exception("Embedding failed")
        raise EmbeddingError(
            "Couldn't process the video text right now. Please try again."
        )
    
    return np.ascontiguousarray(vectors, dtype=np.float32)


def embed_texts(texts: list[str]) -> np.ndarray:
    """Embed transcript chunks. Returns an array of shape (n, dim)."""
    if not texts:
        raise EmbeddingError("There is no text to embed.", 422)
    return _encode(texts)


def embed_query(question: str) -> np.ndarray:
    """Embed a user question. Returns an array of shape (1, dim)."""
    question = (question or "").strip()
    if not question:
        raise EmbeddingError("Please enter a question.", 422)
    return _encode([QUERY_INSTRUCTION + question])