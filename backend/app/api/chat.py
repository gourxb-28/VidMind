from fastapi import APIRouter

from app.models.schemas import ChatRequest, ChatResponse
from app.services.chat import answer_question
from app.services.session_store import get_session

router = APIRouter(prefix="/api/v1")


@router.post("/chat", response_model=ChatResponse)
def ask(request: ChatRequest) -> ChatResponse:
    session = get_session(request.session_id)
    return answer_question(session, request.question, history=request.history)