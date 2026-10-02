import pytest

from app.services.youtube import TranscriptError, fetch_transcript


def test_invalid_video_id_is_rejected_before_any_network_call():
    with pytest.raises(TranscriptError) as exc:
        fetch_transcript("not-valid")
    assert exc.value.status_code == 400