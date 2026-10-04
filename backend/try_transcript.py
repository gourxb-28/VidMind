import sys

from app.services.chunking import chunk_transcript
from app.services.transcript import clean_segments, format_timestamp
from app.services.youtube import TranscriptError, fetch_transcript

# Usage: python try_transcript.py VIDEO_ID [chunk_size] [chunk_overlap]
video_id = sys.argv[1] if len(sys.argv) > 1 else "dQw4w9WgXcQ"
size = int(sys.argv[2]) if len(sys.argv) > 2 else None
overlap = int(sys.argv[3]) if len(sys.argv) > 3 else None

try:
    result = fetch_transcript(video_id)
    segments = clean_segments(result.segments)
except TranscriptError as e:
    print(f"TranscriptError [{e.status_code}]: {e.message}")
    sys.exit(1)

chunks = chunk_transcript(segments, chunk_size=size, chunk_overlap=overlap)

print(f"Segments: {len(segments)}   Chunks: {len(chunks)}")
lengths = [len(c.text) for c in chunks]
print(f"Chunk length (chars): min={min(lengths)} max={max(lengths)} avg={sum(lengths)//len(lengths)}")

print("\n--- First 3 chunks ---")
for c in chunks[:3]:
    print(
        f"#{c.chunk_id}  {format_timestamp(c.start_time)} -> {format_timestamp(c.end_time)}"
        f"  ({len(c.text)} chars)"
    )
    print("   starts:", c.text[:70])
    print("   ends  :", c.text[-70:])

if len(chunks) >= 2:
    print("\n--- Overlap check (end of #0 vs start of #1) ---")
    print("end of #0  :", chunks[0].text[-120:])
    print("start of #1:", chunks[1].text[:120])