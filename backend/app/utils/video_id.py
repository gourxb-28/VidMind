import re
from urllib.parse import parse_qs, urlparse


VIDEO_ID_PATTERN = re.compile(r"[A-Za-z0-9_-]{11}")

MAX_URL_LENGTH = 2048

YOUTUBE_HOSTS = {
    "youtube.com",
    "www.youtube.com",
    "m.youtube.com",
    "music.youtube.com",
}
SHORT_HOSTS = {"youtu.be", "www.youtu.be"}

ID_IN_PATH_PREFIXES = {"shorts", "embed", "live"}

class InvalidYouTubeURLError(ValueError):
    """Raised when the pasted text is not a usable YouTube video URL.

    The message is safe to show directly to the user.
    """

def is_valid_video_id(video_id: str) -> bool:
    return bool(VIDEO_ID_PATTERN.fullmatch(video_id))


def extract_video_id(url: str) -> str:
    """Return the 11-character video ID from a YouTube URL, or raise
    InvalidYouTubeURLError."""
    url = (url or "").strip()

    if not url:
        raise InvalidYouTubeURLError("Please paste a YouTube URL.")
    if len(url) > MAX_URL_LENGTH:
        raise InvalidYouTubeURLError("That URL is too long.")

    if "://" not in url:
        url = "https://" + url

    try:
        parsed = urlparse(url)
    except ValueError:
        raise InvalidYouTubeURLError("That doesn't look like a valid URL.")

    if parsed.scheme not in ("http", "https"):
        raise InvalidYouTubeURLError("That doesn't look like a valid URL.")

    host = (parsed.hostname or "").lower()
    path_parts = [p for p in parsed.path.split("/") if p]
    candidate = None

    if host in SHORT_HOSTS:
        candidate = path_parts[0] if path_parts else None
    elif host in YOUTUBE_HOSTS:
        if path_parts and path_parts[0] == "watch":
            candidate = parse_qs(parsed.query).get("v", [None])[0]
        elif len(path_parts) >= 2 and path_parts[0] in ID_IN_PATH_PREFIXES:
            candidate = path_parts[1]
    else:
        raise InvalidYouTubeURLError("That is not a YouTube link.")

    if not candidate or not is_valid_video_id(candidate):
        raise InvalidYouTubeURLError(
            "Couldn't find a valid YouTube video ID in that link."
        )

    return candidate