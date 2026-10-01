import pytest

from app.utils.video_id import InvalidYouTubeURLError, extract_video_id

VID = "dQw4w9WgXcQ"


@pytest.mark.parametrize(
    "url",
    [
        f"https://www.youtube.com/watch?v={VID}",
        f"https://youtu.be/{VID}",
        f"https://www.youtube.com/shorts/{VID}",
        f"https://m.youtube.com/watch?v={VID}",
        f"https://www.youtube.com/watch?v={VID}&t=30s&list=abc",
        f"https://youtu.be/{VID}?si=xyz",
        f"youtube.com/watch?v={VID}",
        f"https://www.youtube.com/embed/{VID}",
        f"  https://youtu.be/{VID}  ",
        f"https://www.youtube.com/live/{VID}",
    ],
)
def test_valid_urls(url):
    assert extract_video_id(url) == VID


@pytest.mark.parametrize(
    "url",
    [
        "",
        "   ",
        "hello world",
        f"https://example.com/watch?v={VID}",
        "https://www.youtube.com/watch?v=short",
        "https://www.youtube.com/watch",
        "https://youtu.be/",
        "https://www.youtube.com/watch?v=dQw4w9WgXc!",
        "javascript:alert(1)",
        f"https://youtube.com.evil.com/watch?v={VID}",
        f"https://youtu.be/{VID}?x=" + "a" * 3000,
    ],
)
def test_invalid_urls(url):
    with pytest.raises(InvalidYouTubeURLError):
        extract_video_id(url)