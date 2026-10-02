import sys

from app.services.youtube import TranscriptError, fetch_transcript

video_id = sys.argv[1] if len(sys.argv) > 1 else "dQw4w9WgXcQ"

try:
    result = fetch_transcript(video_id)
except TranscriptError as e:
    print(f"TranscriptError [{e.status_code}]: {e.message}")
    sys.exit(1)

print("Language      :", result.language, f"({result.language_code})")
print("Auto-generated:", result.is_generated)
print("Translated    :", result.was_translated)
print("Segments      :", len(result.segments))
for seg in result.segments[:5]:
    print(seg)