from pydantic import BaseModel


class TranscriptSegment(BaseModel):
    """One cleaned caption segment. Kept in the session for chunking."""

    text: str
    start: float 
    duration: float


class TranscriptLine(BaseModel):
    """One display line for the UI (several segments merged together)."""

    start: float 
    timestamp: str 
    text: str

class Chunk(BaseModel):
    """A piece of the transcript used for embedding and retrieval."""

    chunk_id: int
    text: str
    start_time: float 
    end_time: float