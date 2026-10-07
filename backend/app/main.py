import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import chat, health, notes, session, video
from app.config import settings
from app.services.embeddings import EmbeddingError, get_model
from app.services.gemini import GeminiError
from app.services.notes import NotesError
from app.services.session_store import SessionNotFoundError
from app.services.vectorstore import VectorStoreError
from app.services.youtube import TranscriptError
from app.utils.video_id import InvalidYouTubeURLError

logging.basicConfig(level=logging.INFO)
logging.getLogger("httpx").setLevel(logging.WARNING) 
logger = logging.getLogger("app")


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        get_model()
    except Exception:
        logger.exception("Could not load the embedding model at startup")
    yield


app = FastAPI(title="YouTube AI Analyzer", version="0.2.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Content-Type"],
)


async def app_error_handler(request: Request, exc):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.message})


for error_class in (
    TranscriptError,
    EmbeddingError,
    VectorStoreError,
    GeminiError,
    NotesError,
    SessionNotFoundError,
):
    app.add_exception_handler(error_class, app_error_handler)


@app.exception_handler(InvalidYouTubeURLError)
async def invalid_url_handler(request: Request, exc: InvalidYouTubeURLError):
    return JSONResponse(status_code=400, content={"detail": str(exc)})


@app.exception_handler(RequestValidationError)
async def validation_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"detail": "Please check your input and try again."},
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "Something went wrong on the server. Please try again."},
    )


app.include_router(health.router)
app.include_router(video.router)
app.include_router(notes.router)
app.include_router(chat.router)
app.include_router(session.router)