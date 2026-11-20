#!/bin/bash
# Build ../intro.mp4, the 30-second intro cinematic.
#
#   intro/build.sh            story -> render -> captions -> ../intro.mp4
#   intro/build.sh --plates   first convert art/raw/*.png into plates/ again (needs Chromium, see pixel-cat)
#
# Needs: uv, ffmpeg, and a pixel-cat checkout (https://github.com/pyros-projects/pixel-cat).
# The checkout is found through PIXEL_CAT_HOME or ~/.config/pixel-cat/config.json (written by the
# pixel-cat skill's installer).
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
PC="${PIXEL_CAT_HOME:-$(uv run --no-project python -c "import json,pathlib;print(json.loads((pathlib.Path.home()/'.config/pixel-cat/config.json').read_text())['home'])")}"
[ -f "$PC/pyproject.toml" ] || { echo "pixel-cat checkout not found: set PIXEL_CAT_HOME" >&2; exit 1; }
cd "$DIR"

if [ "${1:-}" = "--plates" ]; then
  for n in 01-room 02-knock 03-glints 04-lock 05-newroom 06-plan 07-warden 08-title; do
    src="art/raw/$n.png"
    uv run --project "$PC" pixel-cat convert "$src" --mode grid --grid 400 --sampling crisp --colors 64 --scale 1 -o "plates/$n.png" > /dev/null
    echo "plate $n"
  done
  # the key and the glint come off the model sheet (boxes in sheet pixels), then get a hard pixel edge
  mkdir -p out/cut
  uv run -q --no-project --with pillow tools/cut_sprite.py cut art/raw/00-model-sheet.png out/cut/key.png 650 365 870 475
  uv run -q --no-project --with pillow tools/cut_sprite.py cut art/raw/00-model-sheet.png out/cut/glint.png 635 495 750 630
  for spec in "key 64" "key 44" "glint 15"; do
    name="${spec% *}"; size="${spec#* }"
    uv run --project "$PC" pixel-cat convert "out/cut/$name.png" --mode grid --grid "$size" --sampling crisp --colors 16 --scale 1 -o "sprites/$name-$size.png" > /dev/null
    uv run -q --no-project --with pillow tools/cut_sprite.py edge "sprites/$name-$size.png"
  done
fi

uv run --no-project --with pillow make_story.py
mkdir -p out
uv run --project "$PC" python "$PC/.agents/skills/pixel-cat-film/scripts/render.py" story.json out/master.mp4

# burn the captions in at the film's own pixel size (4x, nearest), each with a quarter-second fade
uv run --no-project python - <<'PY' > out/captions.ffmpeg
import json
caps = json.load(open("captions.timing.json"))
inputs, graph, last = [], [], "0:v"
for i, cap in enumerate(caps, 1):
    a, b = cap["from"], cap["to"]
    inputs.append(f"-loop 1 -framerate 24 -t 30 -i {cap['image']}")
    graph.append(f"[{i}:v]format=rgba,scale=iw*4:ih*4:flags=neighbor,fade=t=in:st={a}:d=0.25:alpha=1,"
                 f"fade=t=out:st={b - 0.25}:d=0.25:alpha=1[c{i}]")
    graph.append(f"[{last}][c{i}]overlay=x=(W-w)/2:y=H-h-12:enable='between(t,{a},{b})'[v{i}]")
    last = f"v{i}"
print(" ".join(inputs)); print(";".join(graph)); print(last)
PY
INPUTS="$(sed -n 1p out/captions.ffmpeg)"; GRAPH="$(sed -n 2p out/captions.ffmpeg)"; LAST="$(sed -n 3p out/captions.ffmpeg)"
# shellcheck disable=SC2086  # INPUTS is a list of arguments
# bring the loudest moment to -1.5 dBFS (the film synth leaves headroom)
PEAK="$(ffmpeg -hide_banner -i out/master.mp4 -af volumedetect -vn -f null - 2>&1 | sed -n 's/.*max_volume: \(-*[0-9.]*\) dB/\1/p')"
GAIN="$(uv run --no-project python -c "print(round(-1.5 - ($PEAK), 2))")"
ffmpeg -hide_banner -loglevel error -y -i out/master.mp4 $INPUTS -filter_complex "$GRAPH" -map "[$LAST]" -map 0:a \
  -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -af "volume=${GAIN}dB" -c:a aac -b:a 160k -ar 48000 -t 30 \
  -movflags +faststart ../intro.mp4
echo "audio gain ${GAIN} dB"
ffprobe -v error -show_entries format=duration,size:stream=codec_name,width,height,r_frame_rate -of compact=p=0:nk=1 ../intro.mp4
