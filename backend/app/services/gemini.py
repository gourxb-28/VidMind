import logging
from functools import lru_cache

import httpx
from google import genai

from app.config import settings

logger = logging.getLogger("app.gemini")


class GeminiError(Exception):
    """Raised when a Gemini call fails. `message` is safe to show to the user."""

    def __init__(self, message: str, status_code: int = 502):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


@lru_cache(maxsize=1)
def _get_client() -> genai.Client:
    
    return genai.Client(api_key=settings.gemini_api_key)


def _check_config() -> None:
    key = settings.gemini_api_key.strip()
    model = settings.gemini_model.strip()
    if not key or key == "your_key_here":
        logger.error("GEMINI_API_KEY is missing. Set it in backend/.env")
        raise GeminiError("The AI service isn't configured on the server.", 500)
    if not model or model.startswith("set_in"):
        logger.error("GEMINI_MODEL is not set. Set it in backend/.env")
        raise GeminiError("The AI service isn't configured on the server.", 500)


def _to_gemini_error(exc: Exception) -> GeminiError:
    """Translate any SDK/network error into a safe, user-friendly GeminiError.

    The Interactions client raises errors that carry `.status_code`; older
    Gemini errors carry `.code`. We read either, and never show raw error
    text to the user.
    """
    status = getattr(exc, "status_code", None) or getattr(exc, "code", None)


    if isinstance(exc, httpx.TimeoutException) or "Timeout" in type(exc).__name__:
        logger.warning("Gemini request timed out")
        return GeminiError("The AI took too long to respond. Please try again.", 504)
    if status == 429:
        logger.warning("Gemini rate limit hit (HTTP 429)")
        return GeminiError(
            "The AI service is busy right now (rate limit reached). "
            "Please wait a minute and try again.",
            429,
        )
    if status in (401, 403):
        logger.error("Gemini rejected the API key or its permissions (HTTP %s)", status)
        return GeminiError("The AI service isn't configured correctly on the server.", 502)
    if status == 404:
        logger.error("Gemini model %r not found. Check GEMINI_MODEL.", settings.gemini_model)
        return GeminiError("The AI model is currently unavailable.", 502)
    if status == 400:
        logger.error("Gemini rejected the request (HTTP 400): %.300s", str(exc))
        return GeminiError("The AI service couldn't process this request.", 502)
    if isinstance(status, int) and status >= 500:
        logger.error("Gemini server error (HTTP %s)", status)
        return GeminiError("The AI service is temporarily unavailable. Please try again shortly.", 502)
    if isinstance(exc, httpx.TransportError):
        logger.error("Could not reach Gemini: %s", type(exc).__name__)
        return GeminiError("Couldn't reach the AI service. Please try again.", 502)

    logger.error("Unexpected Gemini error: %s", type(exc).__name__, exc_info=exc)
    return GeminiError("Something went wrong with the AI service. Please try again.", 502)


def generate_text(
    prompt: str,
    system_instruction: str | None = None,
    temperature: float | None = None,
) -> str:
    """Send one stateless request to Gemini and return the answer text."""
    _check_config()

    kwargs: dict = {
        "model": settings.gemini_model,
        "input": prompt,
        "store": False,
        "timeout": settings.gemini_timeout_seconds,
    }
    if system_instruction:
        kwargs["system_instruction"] = system_instruction

    generation_config: dict = {}
    if temperature is not None:
        generation_config["temperature"] = temperature
    if settings.gemini_thinking_level:
        generation_config["thinking_level"] = settings.gemini_thinking_level
    if generation_config:
        kwargs["generation_config"] = generation_config

    try:
        interaction = _get_client().interactions.create(**kwargs)
    except Exception as exc:
        raise _to_gemini_error(exc) from exc

    text = (getattr(interaction, "output_text", None) or "").strip()
    if not text:
        logger.warning("Gemini returned no text (possibly blocked or empty)")
        raise GeminiError("The AI returned an empty answer. Please try again.", 502)
    return text