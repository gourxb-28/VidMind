from app.config import settings
from app.models.schemas import Chunk, RetrievedChunk
from app.services.embeddings import embed_query
from app.services.transcript import format_timestamp
from app.services.vectorstore import VectorStoreError, search


def retrieve(question, chunks, index, k=None) -> list[RetrievedChunk]:
    """Find the k transcript chunks most relevant to the question.

    `chunks` and `index` must belong together: row i of the index is chunks[i].
    Results are ordered best match first.
    """
    k = k or settings.top_k
    if index.ntotal != len(chunks):
        raise VectorStoreError("The search index is out of sync with the transcript.", 500)

    query_vector = embed_query(question)
    hits = search(index, query_vector, k)
    return [
        RetrievedChunk(**chunks[position].model_dump(), score=round(score, 4))
        for position, score in hits
    ]


def build_context(retrieved: list[RetrievedChunk]) -> str:
    """Turn retrieved chunks into the context block sent to Gemini.

    Chunks are put back in video order (not score order) so the text reads
    like the video, and each one is labelled with its time range.
    """
    ordered = sorted(retrieved, key=lambda c: c.start_time)
    return "\n\n".join(
        f"[{format_timestamp(c.start_time)} - {format_timestamp(c.end_time)}]\n{c.text}"
        for c in ordered
    )
