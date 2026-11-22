#!/bin/bash
# Regression checks for Roomwright using agent-browser (https://github.com/vercel-labs/agent-browser).
#
#   tools/check.sh
#
# Loads index.html headless, makes sure it boots with a clean console, then runs
# tools/check-content.js, tools/check-flows.js and tools/check-audio.js and prints every FAIL line.
# Then runs the intro cinematic checks, the music checks and the phone checks (tools/check-intro.py,
# tools/check-music.py and tools/check-devices.py, which need uv and Playwright).
# Exits non-zero on failure. The audio, intro and music checks are skipped (not failed) where they cannot run.
# The pages here open with ?intro=0, so the film never sits in front of the other checks.
#
# Env:  GAME_URL       check a deployed copy instead of the local file, e.g. GAME_URL=https://example.net/
#       AGENT_BROWSER  path to the agent-browser binary (default: agent-browser on PATH)
#       AB_FLAGS       extra global flags, e.g. AB_FLAGS='--args --no-sandbox,--disable-gpu' in a sandbox
#       CHROMIUM       browser for the intro checks (default: see tools/check-intro.py)
set -uo pipefail
DIR="$(cd "$(dirname "$0")/.." && pwd)"
AB="${AGENT_BROWSER:-agent-browser}"
FLAGS=(--session "roomwright-check")
# shellcheck disable=SC2206  # deliberate word-splitting of AB_FLAGS
if [ -n "${AB_FLAGS:-}" ]; then FLAGS+=( $AB_FLAGS ); fi
ab() { "$AB" "${FLAGS[@]}" "$@"; }
FAILED=0

# the local file has to be the one src/ and CHANGELOG.md build: a stale index.html would be checked as if it were today's
if [ -z "${GAME_URL:-}" ]; then "$DIR/tools/build.sh" --check || FAILED=1; fi

GAME="${GAME_URL:-file://$DIR/index.html}"
# A new address on every run: a browser that kept the page from before a deploy would otherwise check the old copy.
PAGE="$GAME?intro=0&run=$(date +%s)"
ab open "$PAGE" >/dev/null
ab wait 400 >/dev/null
BOOT="$(ab eval "RW.App.mode + ' ' + Object.keys(RW.SPR).length + ' sprites'" | tail -1)"
echo "boot: $BOOT"
case "$BOOT" in *title*) ;; *) FAILED=1;; esac

for f in check-content check-flows; do
  OUT="$(ab eval --stdin < "$DIR/tools/$f.js" | sed 's/\\n/\n/g; s/^"//; s/"$//')"
  PASS="$(printf '%s\n' "$OUT" | grep -c '^PASS' || true)"
  BAD="$(printf '%s\n' "$OUT" | grep -E '^(FAIL|EXCEPTION)' || true)"
  echo "$f: $PASS passed"
  if [ -n "$BAD" ]; then printf '%s\n' "$BAD"; FAILED=1; fi
  ab open "$PAGE" >/dev/null; ab wait 300 >/dev/null
done

# audio: needs a real key press to start the AudioContext; takes about a minute of real time
ab press ArrowLeft >/dev/null; ab wait 300 >/dev/null
ab eval --stdin < "$DIR/tools/check-audio.js" >/dev/null
for _ in $(seq 1 60); do
  [ "$(ab eval 'RW_AUDIO.done' | tail -1)" = "true" ] && break
  ab wait 2000 >/dev/null
done
OUT="$(ab eval 'RW_AUDIO.done ? RW_AUDIO.out : "FAIL audio check did not finish"' | sed 's/\\n/\n/g; s/^"//; s/"$//')"
PASS="$(printf '%s\n' "$OUT" | grep -c '^PASS' || true)"
BAD="$(printf '%s\n' "$OUT" | grep -E '^(FAIL|EXCEPTION)' || true)"
SKIP="$(printf '%s\n' "$OUT" | grep -E '^SKIP' || true)"
if [ -n "$SKIP" ]; then echo "check-audio: $SKIP"; else echo "check-audio: $PASS passed"; fi
if [ -n "$BAD" ]; then printf '%s\n' "$BAD"; FAILED=1; fi
if [ -z "$SKIP" ] && [ "$PASS" = 0 ] && [ -z "$BAD" ]; then echo "check-audio: no result"; FAILED=1; fi

ERRS="$(ab errors | grep -v '^$' || true)"
if [ -n "$ERRS" ]; then echo "page errors:"; printf '%s\n' "$ERRS"; FAILED=1; else echo "page errors: none"; fi
ab close >/dev/null || true

# the intro cinematic: real key presses and clicks through Playwright
if command -v uv >/dev/null 2>&1; then
  OUT="$(uv run -q --with playwright "$DIR/tools/check-intro.py" --url "$GAME" 2>&1)" || FAILED=1
  PASS="$(printf '%s\n' "$OUT" | grep -c '^PASS' || true)"
  BAD="$(printf '%s\n' "$OUT" | grep -vE '^(PASS|SKIP)' || true)"
  SKIP="$(printf '%s\n' "$OUT" | grep -E '^SKIP' || true)"
  echo "check-intro: $PASS passed"
  if [ -n "$SKIP" ]; then printf '%s\n' "$SKIP"; fi
  if [ -n "$BAD" ]; then printf '%s\n' "$BAD"; FAILED=1; fi
else
  echo "check-intro: SKIP (uv is not installed)"
fi

# the music: every track rendered in full by the game's sequencer, faster than real time
if command -v uv >/dev/null 2>&1; then
  OUT="$(uv run -q --with playwright "$DIR/tools/check-music.py" --url "$GAME" 2>&1)" || FAILED=1
  PASS="$(printf '%s\n' "$OUT" | grep -c '^PASS' || true)"
  BAD="$(printf '%s\n' "$OUT" | grep -vE '^(PASS|SKIP)' || true)"
  SKIP="$(printf '%s\n' "$OUT" | grep -E '^SKIP' || true)"
  echo "check-music: $PASS passed"
  if [ -n "$SKIP" ]; then printf '%s\n' "$SKIP"; fi
  if [ -n "$BAD" ]; then printf '%s\n' "$BAD"; FAILED=1; fi
else
  echo "check-music: SKIP (uv is not installed)"
fi

# phones: six emulated devices, driven by touch (tools/check-devices.py)
if command -v uv >/dev/null 2>&1; then
  OUT="$(uv run -q --with playwright "$DIR/tools/check-devices.py" --url "$GAME" 2>&1)" || FAILED=1
  PASS="$(printf '%s\n' "$OUT" | grep -c '^PASS' || true)"
  BAD="$(printf '%s\n' "$OUT" | grep -vE '^(PASS|SKIP)' || true)"
  SKIP="$(printf '%s\n' "$OUT" | grep -E '^SKIP' || true)"
  echo "check-devices: $PASS passed"
  if [ -n "$SKIP" ]; then printf '%s\n' "$SKIP"; fi
  if [ -n "$BAD" ]; then printf '%s\n' "$BAD"; FAILED=1; fi
else
  echo "check-devices: SKIP (uv is not installed)"
fi
[ "$FAILED" = 0 ] && echo "ALL CHECKS PASSED" || echo "CHECKS FAILED"
exit "$FAILED"
