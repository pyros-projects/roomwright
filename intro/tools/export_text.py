"""Export the logo, tagline and captions from the running game as PNG sprites (game font, game colours).

    uv run --no-project intro/tools/export_text.py

Needs agent-browser on PATH. Reads intro/captions.json, writes intro/sprites/{logo,tagline,cap-*}.png.
"""
import base64
import json
import subprocess
from pathlib import Path

INTRO = Path(__file__).resolve().parents[1]
GAME = INTRO.parent
SESSION = ["agent-browser", "--session", "roomwright-intro-export"]


def ab(*args, stdin=None):
    return subprocess.run(SESSION + list(args), input=stdin, capture_output=True, text=True, check=True).stdout


script = (INTRO / "tools/export-text.js").read_text().replace("__CAPTIONS__", (INTRO / "captions.json").read_text())
ab("open", f"file://{GAME}/index.html?intro=0")
ab("wait", "500")
result = ab("eval", "--stdin", stdin=script).strip().splitlines()[-1]
ab("close")
sprites = json.loads(json.loads(result))
out = INTRO / "sprites"
out.mkdir(exist_ok=True)
for name, url in sprites.items():
    (out / f"{name}.png").write_bytes(base64.b64decode(url.split(",", 1)[1]))
print(json.dumps(sorted(sprites)))
