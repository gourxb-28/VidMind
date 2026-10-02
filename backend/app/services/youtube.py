import logging
from dataclasses import dataclass

from youtube_transcript_api import (
    AgeRestricted,
    CouldNotRetrieveTranscript,
    InvalidVideoId,
    NoTranscriptFound,
    RequestBlocked,
    TranscriptsDisabled,
    VideoUnavailable,
    YouTubeTranscriptApi,
)

from app.utils.video_id import is_valid_video_id

logger = logging.getLogger("app.youtube")


ENGLISH_CODES = ["en", "en-US", "en-GB"]


class TranscriptError(Exception):
    """Raised when we can't get a usable transcript.

    `message` is safe to show to the user. `status_code` is the HTTP
    status the API layer should return.
    """

    def __init__(self, message: str, status_code: int = 502):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


@dataclass
class TranscriptResult:
    video_id: str
    language: str
    language_code: str
    is_generated: bool
    was_translated: bool 
    segments: list[dict]  


def _get_fetched_transcript(video_id: str):
    """Pick the best transcript. Returns (fetched_transcript, was_translated)."""
    api = YouTubeTranscriptApi()
    transcript_list = api.list(video_id)

    try:
        return transcript_list.find_transcript(ENGLISH_CODES).fetch(), False
    except NoTranscriptFound:
        pass

    transcript = next(iter(transcript_list), None)
    if transcript is None:
        raise TranscriptError("This video has no captions available.", 404)

    if transcript.is_translatable:
        try:
            return transcript.translate("en").fetch(), True
        except CouldNotRetrieveTranscript:
            logger.info("Translation to English failed; using original language.")

    return transcript.fetch(), False


def fetch_transcript(video_id: str) -> TranscriptResult:
    if not is_valid_video_id(video_id):
        raise TranscriptError("That is not a valid YouTube video ID.", 400)

    try:
        fetched, was_translated = _get_fetched_transcript(video_id)
    except TranscriptError:
        raise
    except InvalidVideoId:
        raise TranscriptError("That is not a valid YouTube video ID.", 400)
    except VideoUnavailable:
        raise TranscriptError(
            "This video is unavailable. It may be private, deleted or region-blocked.",
            404,
        )
    except TranscriptsDisabled:
        raise TranscriptError("The owner of this video has disabled captions.", 404)
    except NoTranscriptFound:
        raise TranscriptError("No usable transcript was found for this video.", 404)
    except AgeRestricted:
        raise TranscriptError(
            "This video is age-restricted, so its transcript can't be fetched.", 404
        )
    except RequestBlocked:
        
        logger.warning("YouTube blocked the transcript request for %s", video_id)
        raise TranscriptError(
            "YouTube is blocking transcript requests from this server right now. "
            "Please try again later.",
            502,
        )
    except CouldNotRetrieveTranscript:
        logger.exception("Transcript retrieval failed for %s", video_id)
        raise TranscriptError(
            "Couldn't retrieve the transcript for this video. Please try another video.",
            502,
        )
    except Exception:
        logger.exception("Unexpected transcript error for %s", video_id)
        raise TranscriptError(
            "Something went wrong while fetching the transcript. Please try again.",
            502,
        )

    segments = fetched.to_raw_data()
    if not segments:
        raise TranscriptError("The transcript for this video is empty.", 404)

    return TranscriptResult(
        video_id=video_id,
        language=fetched.language,
        language_code=fetched.language_code,
        is_generated=fetched.is_generated,
        was_translated=was_translated,
        segments=segments,
    )