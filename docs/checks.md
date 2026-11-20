# Checks, debug hooks and self-play

[Back to the README](../README.md)

`window.RW` exposes the run state and test hooks (`RW.state()`, `RW.manual(true)` + `RW.step(n)` to
drive the clock yourself, `RW.hold/press` for input actions, `RW.openDraft`, `RW.chooseCard`,
`RW.chooseStairs`, `RW.spawnMon`, `RW.summonBoss`, `RW.enterFloor`, `RW.view()` and `RW.draftLayout()`
for aiming pointer events, ...).

The scripts below run headless with [agent-browser](https://github.com/vercel-labs/agent-browser).
Both take `AGENT_BROWSER=/path/to/agent-browser` and `AB_FLAGS='...'` for extra global flags (for
example `--args --no-sandbox,--disable-gpu` inside a sandbox or CI container).

`tools/check.sh` is the regression pass (about two minutes). It boots the page and fails on any
console error, then runs four scripts:

- `tools/check-content.js`: every room power, star level, resonance, pest, weapon, evolution,
  charm, warden and unlock does what its card says.
- `tools/check-flows.js`: first run, pause and options, drafting, the Stairwell, game over, hero
  and deck screens, victory, endless, the gamepad mapping driven by a simulated pad, and the card
  coach (the first-draft walkthrough, one lesson per new thing, H to explain a card again), the
  knock back (what each knock calls, the dice, no loot, the shorter clock), and the mouse and touch
  mapping driven by simulated events: walking toward the pointer, the `Mouse walk` option and its
  drag, the dash, the pause mark, taps on cards and beside them. Simulated events are not a hand on a phone: they show that the mapping works, not
  how it feels. `RW.coach(false)` switches the coach off; the other checks and the bot run without it.
- `tools/check-audio.js`: every sound effect and music track puts a signal on the master bus. It
  measures level, not whether it sounds good, and is skipped where the browser has no audio.
- `tools/check-intro.py`: the intro at boot (held for the first key, then playing with sound),
  skipping with Enter, Esc and a click, the next boot playing it again with nothing stored, the
  replay from the title, the film's own ending, `?intro=0` and the fallback when the film is
  missing. Run it alone with `uv run --with playwright tools/check-intro.py`. It presses real
  keys, because a browser starts a film with sound only after a real gesture. Without a Chromium
  for Playwright it is skipped.

`tools/selfplay-bot.js` is a bot that plays whole runs through the hooks using only what a player
has. `tools/selfplay.sh` runs it:

```
tools/selfplay.sh 1 30 pip    # seeds 1..30 as Pip: one line per run, then a summary
```

A three-floor run simulates in a second or two, so this doubles as a crash test and a difficulty
gauge. The bot is a deliberately mediocre player: it kites, picks cards with a simple score and
walks its weapons to their evolution rooms. At the current tuning, with each delver's default deck:

| Delver (seeds 1-40) | Beat floor 1 | Beat floor 2 | Won the run | Average run |
|---|---|---|---|---|
| Pip | 33 | 14 | 13 | 11 min |
| Wick | 31 | 13 | 10 | 11 min |
| Brindle | 32 | 9 | 8 | 11 min |
| Moss | 30 | 9 | 5 | 11 min |

Runs it wins nearly always have three or four evolved weapons; runs that end on floor 2 usually
have none or one. Re-run it after touching `CURVE`, a weapon or a warden, and read the result with
care:

- Forty seeds is a small sample. The same change measured on other seeds moves a delver by three
  or four wins either way, so compare on at least 40 fresh seeds before believing a difference.
- The bot kites, so it undervalues weapons that need you to stand close (Lantern Halo, Tide Ring,
  Dragon Pepper). That is why Wick now starts with Spark Bolt rather than the halo.
- `unfinished` in the summary counts runs still going at the time limit. It should be 0; anything
  else means the bot or the game got stuck.
