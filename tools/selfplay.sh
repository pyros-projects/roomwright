#!/bin/bash
# Fast-forward self-play for Roomwright using agent-browser (https://github.com/vercel-labs/agent-browser).
#
#   tools/selfplay.sh [firstSeed] [runs] [hero] [maxSeconds]
#
# Plays <runs> whole games with the bot in tools/selfplay-bot.js and prints one line per run plus a
# summary (wins, how deep the runs got, average length, and "unfinished": runs still going at
# maxSeconds, which means the bot or the game got stuck). Any exception thrown by the game is
# reported on its run's line as "ERR ...". A full three-floor run simulates in a second or two.
# The bot plays with a fresh save every time (it starts with the starter cards and the hero's default deck).
#
# Env:  AGENT_BROWSER  path to the agent-browser binary (default: agent-browser on PATH)
#       AB_FLAGS       extra global flags, e.g. AB_FLAGS='--args --no-sandbox,--disable-gpu' in a sandbox
set -euo pipefail
DIR="$(cd "$(dirname "$0")/.." && pwd)"
AB="${AGENT_BROWSER:-agent-browser}"
FLAGS=(--session "roomwright-selfplay")
# shellcheck disable=SC2206  # deliberate word-splitting of AB_FLAGS
if [ -n "${AB_FLAGS:-}" ]; then FLAGS+=( $AB_FLAGS ); fi
A="${1:-1}"; N="${2:-8}"; HERO="${3:-pip}"; MAXS="${4:-1800}"

"$AB" "${FLAGS[@]}" open "file://$DIR/index.html?intro=0" >/dev/null
"$AB" "${FLAGS[@]}" wait 300 >/dev/null
"$AB" "${FLAGS[@]}" eval "localStorage.removeItem(RW.Save.KEY); RW.Save.load(); RW.Save.data.heroes['$HERO'] = 1; 'fresh save'" >/dev/null
"$AB" "${FLAGS[@]}" eval --stdin < "$DIR/tools/selfplay-bot.js" >/dev/null
"$AB" "${FLAGS[@]}" eval "(()=>{const rows=[];let wins=0,f2=0,f3=0,tt=0,stall=0;for(let s=$A;s<$A+$N;s++){RW.Save.data.rooms=RW.Save.fresh().rooms;const r=BOT.full(s,$MAXS,{hero:'$HERO',deck:RW.HEROES['$HERO'].deck});rows.push(['seed '+r.seed,r.end,'floor '+r.floor,'t='+r.t+'s','hp='+r.hp,'rooms='+r.drafted,'keys='+r.forged,'kills='+r.kills,'evo='+r.evos,'boss='+r.boss,'['+r.W+']','lv['+r.L+']','floors@'+r.floors.join('/'),r.err?('ERR '+r.err):''].join('  '));if(r.end==='win')wins++;if(r.end!=='win'&&r.end!=='over')stall++;if(r.floor>=2)f2++;if(r.floor>=3)f3++;tt+=r.t;}rows.push('SUMMARY runs=$N hero=$HERO wins='+wins+' reachedFloor2='+f2+' reachedFloor3='+f3+' avgLength='+Math.round(tt/$N)+'s unfinished='+stall);return rows.join('\n');})()" | sed 's/\\n/\n/g; s/^"//; s/"$//'
echo "page errors:"; "$AB" "${FLAGS[@]}" errors || true
"$AB" "${FLAGS[@]}" close >/dev/null || true
