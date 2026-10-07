from fastapi import APIRouter

from app.services.session_store import delete_session

router = APIRouter(prefix="/api/v1")


@router.delete("/session/{session_id}")
def end_session(session_id: str) -> dict[str, str]:
    """Used by the 'New' button. Deleting an unknown session is not an error."""
    delete_session(session_id)
    return {"status": "deleted"}