#!/bin/bash
# Build the single-file game: concatenates src/ into index.html (no dependencies beyond bash + cat).
#
#   tools/build.sh           write index.html
#   tools/build.sh --check   exit 1 if index.html is out of date with src/
#
# Order = file-name order. Everything in src/*.js shares one strict-mode function scope.
# CHANGELOG.md goes in ahead of them as the text CHANGELOG_MD, exactly as it is written: it is the one source of
# the changelog, for the repo and for the game's screen (src/26-changelog.js reads it).
set -euo pipefail
DIR="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$DIR/index.html"
TMP="$DIR/.index.build.tmp"
LOG="$DIR/CHANGELOG.md"
# it sits in the game inside a template literal in a script element: a backtick, a dollar sign with a brace, a
# backslash or a closing script tag would end or break one of the two
if grep -q -i -e '`' -e '\${' -e '\\' -e '</script' "$LOG"; then echo "CHANGELOG.md must not contain a backtick, a dollar sign followed by a brace, a backslash or a closing script tag"; exit 1; fi
{
  cat "$DIR/src/head.html"
  cat "$DIR/src/00-banner.js"
  printf '(() => {\n'"'"'use strict'"'"';\n\n'
  printf 'const CHANGELOG_MD = String.raw`'; cat "$LOG"; printf '`;\n\n'
  for f in "$DIR"/src/[0-9]*.js; do
    [ "$(basename "$f")" = "00-banner.js" ] && continue
    cat "$f"
    printf '\n'
  done
  printf '})();\n'
  cat "$DIR/src/tail.html"
} > "$TMP"
if [ "${1:-}" = "--check" ]; then
  if cmp -s "$TMP" "$OUT"; then rm -f "$TMP"; echo "index.html is up to date"; exit 0; fi
  rm -f "$TMP"; echo "index.html is OUT OF DATE: run tools/build.sh"; exit 1
fi
mv "$TMP" "$OUT"
echo "built index.html: $(wc -c < "$OUT" | tr -d ' ') bytes, $(wc -l < "$OUT" | tr -d ' ') lines from $(ls "$DIR"/src/[0-9]*.js | wc -l | tr -d ' ') modules"
