from fastapi import APIRouter

from app.models.schemas import NotesResponse, SessionRequest
from app.services.notes import generate_notes
from app.services.session_store import get_session

router = APIRouter(prefix="/api/v1")


@router.post("/notes", response_model=NotesResponse)
def create_notes(request: SessionRequest) -> NotesResponse:
    session = get_session(request.session_id)
    if session.notes is None:
        session.notes = generate_notes(session.chunks)
    return NotesResponse(notes=session.notes)