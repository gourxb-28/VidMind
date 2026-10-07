from fastapi import APIRouter

from app.models.schemas import AnalyzeRequest, AnalyzeResponse
from app.services.chunking import chunk_transcript
from app.services.embeddings import embed_texts
from app.services.session_store import create_session
from app.services.transcript import clean_segments, group_for_display
from app.services.vectorstore import build_index
from app.services.youtube import fetch_transcript
from app.utils.video_id import extract_video_id

router = APIRouter(prefix="/api/v1")


@router.post("/video/analyze", response_model=AnalyzeResponse)
def analyze_video(request: AnalyzeRequest) -> AnalyzeResponse:
    video_id = extract_video_id(request.url)
    result = fetch_transcript(video_id)
    segments = clean_segments(result.segments)
    chunks = chunk_transcript(segments)
    index = build_index(embed_texts([c.text for c in chunks]))
    session = create_session(video_id, chunks, index)

    return AnalyzeResponse(
        session_id=session.session_id,
        video_id=video_id,
        language=result.language,
        is_generated=result.is_generated,
        was_translated=result.was_translated,
        transcript=group_for_display(segments),
    )