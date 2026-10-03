import pytest

from app.models.schemas import TranscriptSegment
from app.services.transcript import (
    clean_segments,
    clean_text,
    format_timestamp,
    group_for_display,
)
from app.services.youtube import TranscriptError


@pytest.mark.parametrize(
    "raw, expected",
    [
        ("[Music]", ""),
        ("Hello\nworld", "Hello world"),
        ("  lots   of   space  ", "lots of space"),
        ("it&#39;s fine", "it's fine"),
        (">> Welcome back", "Welcome back"),
        ("♪ la la ♪", "la la"),
        ("So [Applause] thank you", "So thank you"),
        ("keep (this) text", "keep (this) text"),
    ],
)
def test_clean_text(raw, expected):
    assert clean_text(raw) == expected


@pytest.mark.parametrize(
    "seconds, expected",
    [
        (0, "00:00"),
        (65, "01:05"),
        (125.4, "02:05"),
        (3599, "59:59"),
        (3725, "1:02:05"),
    ],
)
def test_format_timestamp(seconds, expected):
    assert format_timestamp(seconds) == expected


def test_clean_segments_drops_empty_and_sorts():
    raw = [
        {"text": "second", "start": 5, "duration": 2},
        {"text": "[Music]", "start": 2, "duration": 2},
        {"text": "first", "start": 1, "duration": 2},
    ]
    result = clean_segments(raw, max_chars=1000)
    assert [s.text for s in result] == ["first", "second"]
    assert result[0].start == 1.0


def test_clean_segments_all_noise_raises():
    with pytest.raises(TranscriptError) as exc:
        clean_segments([{"text": "[Music]", "start": 0, "duration": 1}], max_chars=100)
    assert exc.value.status_code == 404


def test_clean_segments_too_long_raises():
    with pytest.raises(TranscriptError) as exc:
        clean_segments([{"text": "a" * 50, "start": 0, "duration": 1}], max_chars=10)
    assert exc.value.status_code == 422


def test_group_for_display():
    segs = [
        TranscriptSegment(text=t, start=s, duration=2)
        for t, s in [("a", 0), ("b", 10), ("c", 20), ("d", 31), ("e", 40)]
    ]
    lines = group_for_display(segs, window_seconds=30)
    assert len(lines) == 2
    assert lines[0].text == "a b c"
    assert lines[0].timestamp == "00:00"
    assert lines[1].start == 31
    assert lines[1].timestamp == "00:31"
    assert lines[1].text == "d e"


def test_group_for_display_empty():
    assert group_for_display([]) == []