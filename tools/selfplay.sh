#!/bin/bash
# Fast-forward self-play for Roomwright using agent-browser (https://github.com/vercel-labs/agent-browser).
#
#   tools/selfplay.sh [firstSeed] [runs] [hero] [maxSeconds]       one batch: a line per run, a summary, the census
#   tools/selfplay.sh gap [firstSeed] [runs] [hero]                the pick gap: the three card policies on the same
#                                                                  seeds, side by side (how much does the draft decide?)
#
# Plays whole games with the bot in tools/selfplay-bot.js. The summary says how deep the runs got; the census says
# how they ended (deaths per floor, what dealt the killing blow) and what did the damage. "unfinished" counts runs
# still going at maxSeconds: the bot or the game got stuck. An exception thrown by the game shows on its run's line
# as "ERR ...". A full three-floor run simulates in a second or two. Every run starts from a fresh collection.
#
# Env:  POLICY         how the bot picks a card: score (default), random, first
#       PERSONA        how it moves: kiter (default, a newcomer) or dodger (a practised player)
#       STAKES         the Stakes step to play at (default 0)
#       STAIRS         when it takes the Stairwell: mid (default), early, late
#       AGENT_BROWSER  path to the agent-browser binary (default: agent-browser on PATH)
#       AB_FLAGS       extra global flags, e.g. AB_FLAGS='--args --no-sandbox,--disable-gpu' in a sandbox
set -euo pipefail
DIR="$(cd "$(dirname "$0")/.." && pwd)"
AB="${AGENT_BROWSER:-agent-browser}"
FLAGS=(--session "roomwright-selfplay")
# shellcheck disable=SC2206  # deliberate word-splitting of AB_FLAGS
if [ -n "${AB_FLAGS:-}" ]; then FLAGS+=( $AB_FLAGS ); fi
ab() { "$AB" "${FLAGS[@]}" "$@"; }
export AGENT_BROWSER_DEFAULT_TIMEOUT="${AGENT_BROWSER_DEFAULT_TIMEOUT:-120000}"   # a chunk of runs takes a few seconds; the default limit is 25
MODE=batch; if [ "${1:-}" = "gap" ]; then MODE=gap; shift; fi
A="${1:-1}"; N="${2:-8}"; HERO="${3:-pip}"; MAXS="${4:-1800}"
PERSONA="${PERSONA:-kiter}"; STAKES="${STAKES:-0}"; STAIRS="${STAIRS:-mid}"

ab open "file://$DIR/index.html?intro=0&run=$(date +%s)" >/dev/null
ab wait 300 >/dev/null
ab eval "localStorage.removeItem(RW.Save.KEY); RW.Save.load(); RW.Save.data.heroes['$HERO'] = 1; 'fresh save'" >/dev/null
ab eval --stdin < "$DIR/tools/selfplay-bot.js" >/dev/null

# play the seeds in small chunks (one eval blocks the page), then print what BOT.report makes of them
batch() {  # batch <policy> <what to print: all | summary>
  local s="$A" end=$((A + N)) n
  while [ "$s" -lt "$end" ]; do
    n=$((end - s)); [ "$n" -gt 4 ] && n=4
    ab eval "BOT.batch($s, $n, $MAXS, { hero: '$HERO', policy: '$1', persona: '$PERSONA', stakes: $STAKES, stairs: '$STAIRS' })" >/dev/null
    s=$((s + n))
  done
  local out; out="$(ab eval "BOT.report('hero=$HERO persona=$PERSONA cards=$1 stakes=$STAKES')" | sed 's/\\n/\n/g; s/^"//; s/"$//')"
  if [ "$2" = "all" ]; then printf '%s\n' "$out"; else printf '%s\n' "$out" | grep -E '^(SUMMARY|CENSUS)' ; fi
}

if [ "$MODE" = "gap" ]; then
  echo "The pick gap: seeds $A to $((A + N - 1)) as $HERO, persona $PERSONA. Same seeds, same movement, only the card choice differs."
  for policy in score random first; do batch "$policy" summary; done
else
  batch "${POLICY:-score}" all
fi
echo "page errors:"; ab errors || true
ab close >/dev/null || true
