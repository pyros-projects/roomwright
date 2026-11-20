#!/bin/bash
# Build the single-file game: concatenates src/ into index.html (no dependencies beyond bash + cat).
#
#   tools/build.sh           write index.html
#   tools/build.sh --check   exit 1 if index.html is out of date with src/
#
# Order = file-name order. Everything in src/*.js shares one strict-mode function scope.
set -euo pipefail
DIR="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$DIR/index.html"
TMP="$DIR/.index.build.tmp"
{
  cat "$DIR/src/head.html"
  cat "$DIR/src/00-banner.js"
  printf '(() => {\n'"'"'use strict'"'"';\n\n'
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
