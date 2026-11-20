# Checks, debug hooks and self-play

[Back to the README](../README.md)

`window.RW` exposes the run state and test hooks (`RW.state()`, `RW.manual(true)` + `RW.step(n)` to
drive the clock yourself, `RW.hold/press` for input actions, `RW.openDraft`, `RW.chooseCard`,
`RW.chooseStairs`, `RW.spawnMon`, `RW.summonBoss`, `RW.enterFloor`, `RW.view()` and `RW.draftLayout()`
for aiming pointer events, ...). Three of them are for reading a run:

- `RW.tallyList()` is the damage tally: who dealt the run's damage, largest first.
- `RW.record()` is the run as the census would file it: floor, minute, the last three hits the
  delver took and who dealt them, sealed doors, rooms, weapons.
- `RW.census()` prints the records of the last 20 runs, which the save keeps. Nothing leaves the
  browser.

The scripts below run headless with [agent-browser](https://github.com/vercel-labs/agent-browser).
Both take `AGENT_BROWSER=/path/to/agent-browser` and `AB_FLAGS='...'` for extra global flags (for
example `--args --no-sandbox,--disable-gpu` inside a sandbox or CI container).

`tools/check.sh` is the regression pass (about two minutes). It boots the page and fails on any
console error, then runs four scripts:

- `tools/check-content.js`: every room power, star level, resonance, pest, weapon, evolution,
  charm, warden and unlock does what its card says. Also: every point of damage has an owner and
  the shares add up, the census names what hit the delver, an elite besieges the room built up
  most, door pressure per floor, the knocking late in the clock, a warden's fury, and each rule of
  Stakes in force from its step on.
- `tools/check-flows.js`: first run, pause and options, drafting, the Stairwell, game over, hero
  and deck screens, victory, endless, the gamepad mapping driven by a simulated pad, and the card
  coach (the first-draft walkthrough, one lesson per new thing, H to explain a card again), the
  knock back (what each knock calls, the dice, no loot, the shorter clock), Stakes (a win opens a
  step, the hero screen sets it with keys, mouse and touch, the run plays at it), and the mouse and touch
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
tools/selfplay.sh 1 30 pip                             # seeds 1..30 as Pip: a line per run, a summary, the census
tools/selfplay.sh gap 201 40 pip                       # the pick gap: three card policies on the same seeds
PERSONA=dodger STAKES=2 tools/selfplay.sh 201 40 wick  # the practised player, at step 2 of Stakes
```

A three-floor run simulates in a second or two, so this doubles as a crash test and a difficulty
gauge. All tables below are 40 runs per row, seeds 201 to 240, each delver's default deck, the build
of 0.3. A row reads: beat floor 1 / beat floor 2 / won the run.

### Two bots

- **The kiter** is a deliberately mediocre player: it kites, is timid near doors and reads a warden
  slowly. It stands for a newcomer's first runs.
- **The dodger** walks every heading 0.8 seconds into the future against where the bullets, the
  monsters and a warden's attacks will be, takes the one that stays unhurt longest, and dashes when
  no walk does. It stands for a practised player. `PERSONA=dodger` selects it.

Both pick cards the same way and use only what a player has. Neither is a person. A bot that plays
unlike people misreads difficulty in both directions, so the two are read together: the gap between
them is what movement is worth.

| Delver | Kiter, chosen cards | Dodger, chosen cards | Average run (dodger) |
|---|---|---|---|
| Pip | 31 / 15 / 14 | 36 / 25 / 18 | 14 min |
| Wick | 29 / 9 / 6 | 37 / 24 / 19 | 15 min |
| Brindle | 34 / 10 / 8 | 40 / 29 / 23 | 17 min |
| Moss | 34 / 13 / 10 | 34 / 20 / 12 | 16 min |

The aim for 0.3 was a default where a practised player wins about every second run and a newcomer
fails on floor 2 at first. The dodger wins 12 to 23 of 40; the kiter clears floor 2 in
9 to 15 of 40.

### The pick gap: how much does the draft decide?

The design's claim is that one choice, the draft card, decides how the delver grows, what the
ground does and where the next monsters come from. The pick gap measures it: the same bot on the
same seeds, once with its own reading of the cards (`score`), once picking at random, once always
taking the first card. `tools/selfplay.sh gap` prints the three side by side.

| Delver, dodger | Chosen cards | Random cards | Floor 2 with random cards, as a share of chosen |
|---|---|---|---|
| Pip | 36 / 25 / 18 | 31 / 10 / 5 | 40% |
| Wick | 37 / 24 / 19 | 29 / 13 / 7 | 54% |
| Brindle | 40 / 29 / 23 | 35 / 18 / 10 | 62% |
| Moss | 34 / 20 / 12 | 35 / 22 / 16 | 110% |

Always the first card, as Pip: 32 / 14 / 6. The kiter, chosen against random: Pip 31 / 15 / 14 against 27 / 3 / 2; Wick 29 / 9 / 6 against 27 / 5 / 0; Brindle 34 / 10 / 8 against 26 / 4 / 3; Moss 34 / 13 / 10 against 23 / 3 / 2.

In 0.2 the dodger cleared floor 1 with random cards as often as with chosen ones (37 against 35 as
Pip), and Brindle and Moss cleared floor 2 with them as well (22 against 20, 28 against 30). The aim
for 0.3 was that random cards clear floor 2 at most half as often as chosen ones. Where that stands:

- As Pip it holds on these seeds (10 against 25) and not on seeds 301 to 340 (15 against
  19). The wins are steadier: 5 against 18 here, 5 against 16 there.
- Wick and Brindle are close to it, and every delver now loses runs on floor 1 with random cards that
  chosen cards win.
- For the kiter the gap is wide everywhere: with random cards it clears floor 2 in 3 to 5 of 40 runs.
- Moss is the exception: with Moss the dodger does no better with chosen cards than with random ones,
  on any build so far. Moss's deck is rooms that mend and pay, which the bot's card reading values
  little, so this may say more about the bot than about Moss.

### How runs end: the census

The bot's summary counts deaths per floor and what dealt the killing blow. Dodger, chosen cards:

| Delver | Deaths on floor 1 / 2 / 3 | Killing blows, most frequent first |
|---|---|---|
| Pip | 4 / 11 / 7 | imp 7, spore 6, beetle 4, thorn 2, tin 1 |
| Wick | 3 / 13 / 5 | imp 5, bslime 5, flower 4, thorn 2, tin 2 |
| Brindle | 0 / 11 / 6 | thorn 4, moth 3, bslime 3, imp 3, cinder 2 |
| Moss | 6 / 14 / 8 | imp 6, thorn 5, bslime 3, ghost 2, beetle 2 |

The kiter dies mostly to the wardens; the dodger dies to ordinary monsters, most often to those that
shoot. In a person's save, `RW.census()` prints the same record for their last 20 runs.

### What does the damage

Every run ends with a tally of who dealt its damage. Share of all damage done by rooms, and the
largest sources, dodger with chosen cards:

| Delver | Rooms' share | Largest sources |
|---|---|---|
| Pip | 39% | keyblade 18%, furnace 10%, ember 9%, spikes 7%, guardian 6% |
| Wick | 35% | furnace 20%, spark 13%, ember 10%, guardian 8%, honey 8% |
| Brindle | 34% | bomb 25%, spikes 9%, guardian 8%, ember 6%, furnace 5% |
| Moss | 29% | furnace 14%, thorns 12%, spikes 8%, honey 7%, ricochet 6% |

In 0.2 rooms did a quarter of the damage for Pip (24%). A single run can look very different: on
one seed a Ballista Hall did two thirds of the damage on floor 1.

Pocket Bombs were trimmed from this tally. With Brindle they did 31% of all damage with chosen cards
and up to 38% with random ones, against an agreed limit of a third; they now do 25% and 33%.
What changed: radius 28 and 35 at levels 1 and 4 (was 30 and 40), damage 24 and 29 at levels 2 and 4
(was 25 and 32), three bombs every 2.8 s at level 5 (was 2.6); Inferno Flask 35 damage, radius 39,
every 2.5 s (was 40, 44, 2.3). The bot kites, so it undervalues weapons that need you to stand close
(Lantern Halo, Tide Ring, Dragon Pepper); a person's tally will differ.

### Doors, the Stairwell and Stakes

Two door habits of the scoring bot, as Pip (dodger): `tight` keeps four sealed doors or fewer,
`open` takes the card with the most doors.

| Habit | Result | Sealed doors at the end | Rooms per run |
|---|---|---|---|
| tight | 35 / 16 / 10 | 5.8 | 28.9 |
| the bot's own (up to six) | 36 / 25 / 18 | 6.6 | 37.2 |
| open | 34 / 22 / 16 | 8.6 | 35.0 |

The two differ clearly, and not the way the design hoped: for a mover this good an open plan still
pays. More monsters are more glints, more keys and more rooms. Door pressure makes the open plan
louder; it does not yet make the tight plan the better one. Whether it should is a question for
people who play it.

When to build the Stairwell, as Pip (dodger, chosen cards): `STAIRS=early` builds it as soon as it is
offered, `mid` after eleven rooms or three quarters of the clock, `late` when the clock is nearly out.

| Rule | Result | Rooms per run | Average run |
|---|---|---|---|
| early | 40 / 25 / 16 | 27.9 | 10 min |
| mid | 36 / 25 / 18 | 37.2 | 14 min |
| late | 33 / 27 / 25 | 48.4 | 18 min |

No rule is best on every floor: early is the safest way through floor 1 and the weakest by the end,
late loses the most runs on floor 1 and wins the most overall. Waiting still pays for this bot: the
rooms it gains outweigh the knocking that grows late in the clock.

Stakes, step by step, as Pip (dodger, chosen cards). Each step keeps the rules before it.

| Step | Rule it adds | Result |
|---|---|---|
| 0 | the plain game | 36 / 25 / 18 |
| 1 | Wardens arrive enraged. | 36 / 21 / 18 |
| 2 | Pests come from the first floor on, and sooner. | 33 / 25 / 22 |
| 3 | Dice roll in with the waves. | 33 / 20 / 13 |
| 4 | Hearts drop half as often. | 31 / 16 / 10 |
| 5 | Monsters are a fifth tougher. | 26 / 9 / 4 |
| 6 | The dread clock runs a quarter faster. | 32 / 10 / 6 |

The ladder goes down, and not evenly: neighbouring steps differ by less than the noise in places
(step 2 reads easier than step 1 here), and tougher monsters at step 5 are the largest single drop.

### Reading these numbers

- Forty seeds is a small sample. The same build on other seeds moves a row by three or four either
  way: as Pip on seeds 301 to 340 the dodger makes 37 / 19 / 16 with chosen cards and 33 / 15 / 5 with
  random ones. Compare on at least 40 fresh seeds before believing a difference, and do not read a
  ladder step by step where two neighbours differ by less than that.
- The bots are not people. The dodger never tires and never misreads a pattern it has a rule for;
  it also never learns a warden, plans a floor or stands where a room does the killing. Balance
  against people starts with the playtest of 0.3.
- `unfinished` in a summary counts runs still going at the time limit (30 minutes of game time).
  Long runs with Moss reach it; anything else means the bot or the game got stuck.
- Re-run the tables after touching `CURVE`, a weapon or a warden: `tools/selfplay.sh gap 201 40 pip`
  with `PERSONA=dodger` is the shortest useful check.
