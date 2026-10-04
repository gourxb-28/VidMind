from bisect import bisect_right

from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.config import settings
from app.models.schemas import Chunk, TranscriptSegment


def chunk_transcript(
    segments: list[TranscriptSegment],
    chunk_size: int | None = None,
    chunk_overlap: int | None = None,
) -> list[Chunk]:
    """Split cleaned segments into overlapping chunks that keep timestamps."""
    if not segments:
        return []

    chunk_size = chunk_size or settings.chunk_size
    chunk_overlap = settings.chunk_overlap if chunk_overlap is None else chunk_overlap
    if chunk_overlap >= chunk_size:
        raise ValueError("chunk_overlap must be smaller than chunk_size")


    offsets: list[int] = []
    pos = 0
    for seg in segments:
        offsets.append(pos)
        pos += len(seg.text) + 1 
    full_text = " ".join(seg.text for seg in segments)

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size, chunk_overlap=chunk_overlap
    )
    pieces = splitter.split_text(full_text)

    chunks: list[Chunk] = []
    search_from = 0
    for chunk_id, piece in enumerate(pieces):
        idx = full_text.find(piece, search_from)
        if idx == -1:  # defensive: should not happen
            idx = search_from
        end_idx = idx + len(piece) - 1

        first_seg = max(bisect_right(offsets, idx) - 1, 0)
        last_seg = max(bisect_right(offsets, end_idx) - 1, 0)

        chunks.append(
            Chunk(
                chunk_id=chunk_id,
                text=piece,
                start_time=segments[first_seg].start,
                end_time=round(segments[last_seg].start + segments[last_seg].duration, 2),
            )
        )
        search_from = max(idx + 1, idx + len(piece) - chunk_overlap)

    return chunks