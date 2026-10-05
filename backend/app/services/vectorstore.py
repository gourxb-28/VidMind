import logging

import faiss
import numpy as np

logger = logging.getLogger("app.vectorstore")


class VectorStoreError(Exception):
    """Raised when the vector index can't be built or searched.
    `message` is safe to show to the user."""

    def __init__(self, message: str, status_code: int = 500):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def build_index(vectors: np.ndarray) -> faiss.IndexFlatIP:
    """Build an exact similarity index from L2-normalised vectors.

    IndexFlatIP ranks by inner product. For unit-length vectors the inner
    product IS the cosine similarity.
    """
    if vectors.ndim != 2 or vectors.shape[0] == 0:
        raise VectorStoreError("There is nothing to index.", 422)
    try:
        vectors = np.ascontiguousarray(vectors, dtype=np.float32)
        index = faiss.IndexFlatIP(vectors.shape[1])
        index.add(vectors)
        return index
    except Exception:
        logger.exception("FAISS index build failed")
        raise VectorStoreError("Couldn't build the search index for this video.")


def search(
    index: faiss.IndexFlatIP, query_vector: np.ndarray, k: int
) -> list[tuple[int, float]]:
    """Return up to k (position, score) pairs, best match first.

    `position` is the row number in the vectors given to build_index, i.e.
    the position of the chunk in the session's chunk list.
    """
    if k < 1:
        raise VectorStoreError("k must be at least 1.", 500)
    if query_vector.ndim == 1:
        query_vector = query_vector.reshape(1, -1)
    if query_vector.shape[1] != index.d:
        raise VectorStoreError("Search vector has the wrong size.", 500)

    k = min(k, index.ntotal)
    try:
        scores, ids = index.search(
            np.ascontiguousarray(query_vector, dtype=np.float32), k
        )
    except Exception:
        logger.exception("FAISS search failed")
        raise VectorStoreError("Couldn't search this video right now.")

    return [(int(i), float(s)) for i, s in zip(ids[0], scores[0]) if i != -1]