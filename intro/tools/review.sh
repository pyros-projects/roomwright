#!/bin/bash
# Review sheet: tile film frames at the given seconds into one picture.
#   intro/tools/review.sh VIDEO OUT.png COLSxROWS T1 T2 ...
set -euo pipefail
VIDEO="$1"; OUT="$2"; TILE="$3"; shift 3
SEL=""; for t in "$@"; do n=$(uv run --no-project python -c "print(round($t*24))"); SEL="${SEL:+$SEL+}eq(n\,$n)"; done
ffmpeg -hide_banner -loglevel error -y -i "$VIDEO" -vf "select='$SEL',scale=640:360:flags=neighbor,tile=$TILE" -frames:v 1 -fps_mode vfr "$OUT"
