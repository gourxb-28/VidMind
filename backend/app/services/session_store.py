import threading
import time
import uuid
from dataclasses import dataclass

import faiss

from app.config import settings
from app.models.schemas import Chunk


class SessionNotFoundError(Exception):
    def __init__(self) -> None:
        message = "Your session has expired or doesn't exist. Please analyze the video again."
        super().__init__(message)
        self.message = message
        self.status_code = 404


@dataclass
class Session:
    session_id: str
    video_id: str
    chunks: list[Chunk]
    index: faiss.IndexFlatIP 
    notes: str | None = None
    last_used: float = 0.0


_sessions: dict[str, Session] = {}
_lock = threading.Lock()  


def _now() -> float:
    return time.monotonic()


def _purge_expired() -> None:
    cutoff = _now() - settings.session_ttl_minutes * 60
    for session_id in [sid for sid, s in _sessions.items() if s.last_used < cutoff]:
        del _sessions[session_id]


def create_session(video_id: str, chunks: list[Chunk], index: faiss.IndexFlatIP) -> Session:
    with _lock:
        _purge_expired()
        
        limit = max(settings.max_sessions, 1)
        while len(_sessions) >= limit:
            oldest = min(_sessions.values(), key=lambda s: s.last_used)
            del _sessions[oldest.session_id]
        session = Session(uuid.uuid4().hex, video_id, chunks, index, last_used=_now())
        _sessions[session.session_id] = session
        return session


def get_session(session_id: str) -> Session:
    with _lock:
        _purge_expired()
        session = _sessions.get(session_id)
        if session is None:
            raise SessionNotFoundError()
        session.last_used = _now() 
        return session


def delete_session(session_id: str) -> bool:
    with _lock:
        return _sessions.pop(session_id, None) is not None