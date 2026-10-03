import sys

from app.services.transcript import clean_segments, group_for_display
from app.services.youtube import TranscriptError, fetch_transcript

video_id = sys.argv[1] if len(sys.argv) > 1 else "dQw4w9WgXcQ"

try:
    result = fetch_transcript(video_id)
    segments = clean_segments(result.segments)
except TranscriptError as e:
    print(f"TranscriptError [{e.status_code}]: {e.message}")
    sys.exit(1)

lines = group_for_display(segments)

print(f"Raw segments    : {len(result.segments)}")
print(f"Clean segments  : {len(segments)}")
print(f"Display lines   : {len(lines)}")
print(f"Total characters: {sum(len(s.text) + 1 for s in segments)}")
print("\n--- RAW (first 3) ---")
for seg in result.segments[:3]:
    print(repr(seg["text"]))
print("\n--- CLEAN (first 3) ---")
for seg in segments[:3]:
    print(seg)
print("\n--- DISPLAY (first 3) ---")
for line in lines[:3]:
    print(f"{line.timestamp}  {line.text[:100]}")