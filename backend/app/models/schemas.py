from pydantic import BaseModel, ConfigDict, Field
from typing import Literal

class TranscriptSegment(BaseModel):
    text: str
    start: float
    duration: float


class TranscriptLine(BaseModel):
    start: float
    timestamp: str
    text: str


class Chunk(BaseModel):
    chunk_id: int
    text: str
    start_time: float 
    end_time: float  


class RetrievedChunk(Chunk):
    score: float


class AnalyzeRequest(BaseModel):
    url: str = Field(max_length=5000)


class AnalyzeResponse(BaseModel):
    session_id: str
    video_id: str
    language: str
    is_generated: bool  
    was_translated: bool  
    transcript: list[TranscriptLine]
    status: str = "ready"


class SessionRequest(BaseModel):
    session_id: str = Field(min_length=1, max_length=64)


class NotesResponse(BaseModel):
    notes: str

class HistoryMessage(BaseModel):
    role: Literal["user", "assistant"]
    text: str = Field(max_length=2000)

class ChatRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    session_id: str = Field(min_length=1, max_length=64)
    question: str = Field(min_length=1, max_length=1000)
    history: list[HistoryMessage] = Field(default_factory=list, max_length=20)


class Source(BaseModel):
    start_time: float  
    end_time: float
    timestamp: str 
    text: str  


class ChatResponse(BaseModel):
    answer: str
    sources: list[Source]