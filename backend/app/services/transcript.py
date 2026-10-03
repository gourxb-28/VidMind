import html
import re

from app.config import settings
from app.models.schemas import TranscriptLine, TranscriptSegment
from app.services.youtube import TranscriptError


_BRACKET_CUE = re.compile(r"\[[^\]]{0,30}\]")
_WHITESPACE = re.compile(r"\s+")


def format_timestamp(seconds: float) -> str:
    """125.4 -> '02:05', 3725 -> '1:02:05'."""
    total = int(max(seconds, 0))
    hours, rest = divmod(total, 3600)
    minutes, secs = divmod(rest, 60)
    if hours:
        return f"{hours}:{minutes:02d}:{secs:02d}"
    return f"{minutes:02d}:{secs:02d}"


def clean_text(text: str) -> str:
    text = html.unescape(text)  
    text = _BRACKET_CUE.sub(" ", text)
    text = text.replace("♪", " ").replace(">>", " ")
    text = _WHITESPACE.sub(" ", text) 
    return text.strip()


def clean_segments(
    raw_segments: list[dict], max_chars: int | None = None
) -> list[TranscriptSegment]:
    """Raw {text, start, duration} dicts -> clean, sorted TranscriptSegments."""
    if max_chars is None:
        max_chars = settings.max_transcript_chars

    cleaned: list[TranscriptSegment] = []
    for raw in sorted(raw_segments, key=lambda s: float(s.get("start", 0))):
        text = clean_text(str(raw.get("text", "")))
        if not text:
            continue  
        cleaned.append(
            TranscriptSegment(
                text=text,
                start=round(float(raw.get("start", 0)), 2),
                duration=round(float(raw.get("duration", 0)), 2),
            )
        )

    if not cleaned:
        raise TranscriptError("The transcript has no readable text.", 404)

    total_chars = sum(len(seg.text) + 1 for seg in cleaned)
    if total_chars > max_chars:
        raise TranscriptError(
            "This video is too long to analyze. Please try a shorter video.", 422
        )

    return cleaned


def group_for_display(
    segments: list[TranscriptSegment], window_seconds: float = 30.0
) -> list[TranscriptLine]:
    """Merge small segments into ~window_seconds lines for the UI."""
    lines: list[TranscriptLine] = []
    current_start: float | None = None
    current_texts: list[str] = []

    def flush() -> None:
        if current_texts and current_start is not None:
            lines.append(
                TranscriptLine(
                    start=current_start,
                    timestamp=format_timestamp(current_start),
                    text=" ".join(current_texts),
                )
            )

    for seg in segments:
        if current_start is not None and seg.start - current_start >= window_seconds:
            flush()
            current_start, current_texts = None, []
        if current_start is None:
            current_start = seg.start
        current_texts.append(seg.text)

    flush()
    return lines