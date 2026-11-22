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

`tools/check.sh` is the regression pass (about two minutes). Against the local file it first makes
sure `index.html` is what `src/` and `CHANGELOG.md` build. It boots the page and fails on any
console error, then runs six scripts:

- `tools/check-content.js`: every room power, star level, resonance, pest, weapon, evolution,
  charm, warden and unlock does what its card says. Also: every point of damage has an owner and
  the shares add up, the census names what hit the delver, an elite besieges the room built up
  most, door pressure per floor, the knocking late in the clock, a warden's fury, each warden's bullet phase (it starts at
  60% of its health, once, after a tell; a delver that only walks gets through it unhurt at three
  distances, calm and enraged; standing still is hit; enraged it is over sooner), each rule of
  Stakes in force from its step on, the share card (the picture's size, that it is not blank and
  keeps the game's pixels; the text's line of facts, its grid and the address; that nothing from
  the save is in either; where the picture goes in which browser), the daily delve (day, seed, delver and deck from a fixed date;
  two saves and two different fights find the same cards behind the same doors; the first attempt
  counts and a later one is practice; the last 14 days are kept), room overloads (when a room overloads and when not, the
  20 seconds, that it fires with the delver elsewhere and never hurts the delver, that a hexed room
  does not charge, each element's burst, the card's OVERLOAD and the coach's lesson), the house (the dealer's and the wheel's tell and pattern, that standing
  is hit and the move each asks for is not; the slot machine's reels, which show what is coming for
  over half a second, its three payouts and that backing off beats them; each one's first entrance
  by itself), dice in ordinary waves (from which minute on each floor, how
  small their share is, that a knock back calls more, that a warden fights without them), every
  kind of enemy bullet against a ground of any brightness (at least 8 of its pixels differ by 40 of
  255; both numbers were chosen by looking, they are no standard), the screen's rules (every enemy bullet, the delver and the
  pickups show whole through the heaviest effects and the flash; hurt on every frame, the screen
  flashes at most three times a second; an elite's death and an evolution have their beat, and a kill
  never holds the game), what the
  floor plan tells the music and which voices then
  sound in each `Music grows` setting, and the changelog: the game's version has the first entry
  and the font has every character in it.
- `tools/check-flows.js`: first run, pause and options, drafting, the Stairwell, game over, the
  title's entries, the changelog, the music player and the daily delve (keys, pad, mouse, touch;
  for the daily also leaving it, the end screen and trying again), hero and deck
  screens, victory, endless, the gamepad mapping driven by a simulated pad, and the card coach (the
  first-draft walkthrough, one lesson per new thing, H to explain a card again), the knock back
  (what each knock calls, the dice, no loot, the shorter clock), Stakes (a win opens a step, the
  hero screen sets it with keys, mouse and touch, the run plays at it), and the mouse and touch
  mapping driven by simulated events: walking toward the pointer, the `Mouse walk` option and its
  drag, the dash, the pause mark, taps on cards and beside them. Simulated events are not a hand on
  a phone: they show that the mapping works, not how it feels. `RW.coach(false)` switches the coach
  off; the other checks and the bot run without it.
- `tools/check-audio.js`: every sound effect and music track puts a signal on the master bus. It
  measures level, not whether it sounds good, and is skipped where the browser has no audio.
- `tools/check-intro.py`: the intro at boot (held for the first key, then playing with sound),
  skipping with Enter, Esc and a click, the next boot playing it again with nothing stored, the
  replay from the title, the film's own ending, `?intro=0` and the fallback when the film is
  missing. Run it alone with `uv run --with playwright tools/check-intro.py`. It presses real
  keys, because a browser starts a film with sound only after a real gesture. Without a Chromium
  for Playwright it is skipped.
- `tools/check-music.py`: every music track, rendered by the game's own sequencer faster than real
  time (a short track twice, a long one once and two bars into its repeat): the page gets an audio context that renders into memory and a clock the
  check turns by hand. It fails on an error anywhere in a piece, on a bar under -50 dBFS (an empty
  bar reads -59 or less, a bar with notes -45 or more) and on a mean level outside -48 to -35 dBFS,
  the range in which the music sits under the sound effects, and on a single sample that jumps out
  of the wave (a tick). A written piece is rendered three times: as written, in its thinnest form
  (growing with the plan, before anything is built, which is how a floor starts by default: every
  bar must still sound, inside the range) and in its thickest (with every element's voice, all
  resonating: still inside the range, and no tick). Every sound
  effect is rendered too: each must be heard (a peak over -45 dBFS) and stay clear of full scale
  (under -6 dBFS). `--wav DIR` saves what was rendered as WAV files. Run it alone with
  `uv run --with playwright tools/check-music.py`. Like the audio check it reads levels, not
  whether a piece sounds good.
- `tools/check-devices.py`: the game on ten emulated devices (iPhone 15, Pixel 7, iPhone SE, iPad
  Mini and the 360 by 800 of most Android phones, each upright and turned), each a touch screen
  with a coarse pointer in the size the phone reports to a page. For each: the scale is a whole number of at least two and the view fills the
  screen; on every screen what a finger taps lies inside the view and is at least 40 CSS pixels in
  its smaller dimension (title, hero screen, deck builder, play, draft, pause, both end screens,
  changelog, music player and its sounds); the draft's card is whole and at least 93 by 124 game
  pixels, with three cards and with four; and a run is played by touch: title, hero screen, a drag to walk, a card
  built by a tap, pause and resume, the phone turned while the run goes on, the end screen and
  back. Run it alone with `uv run --with playwright tools/check-devices.py`; `--shots DIR` saves a
  picture of every screen on every device. An emulated phone is not a hand on a real one: it shows
  that the layouts fit and the taps land, not how it feels or whether a thumb covers what matters.

### How loud things are

Measured on 2026-11-21 with `tools/check-music.py --wav`, which renders every track and every sound
effect through the game's own audio code at the default volumes (music 60%, sound 80%), and then
with one loudness meter (ffmpeg's `ebur128`) over those files and over the intro film.

| What | Loudness | Peak |
|---|---|---|
| Intro film (the game plays it at 85%) | -15.7 LUFS | -1.6 dBFS |
| Music: the title's tune | -45.3 LUFS | -23.8 dBFS |
| Music: floor 1 | -41.4 LUFS | -17.8 dBFS |
| Music: floor 2 | -41.9 LUFS | -16.2 dBFS |
| Music: floor 3 | -39.5 LUFS | -14.6 dBFS |
| Music: the wardens | -38.7 LUFS | -19.8 dBFS |
| Sound effects, each alone | | from -42.2 dBFS (burn) to -17.1 dBFS (roar), half of them over -25.9 |

The floors' rows are the pieces as written. With `Music grows` at its default a floor starts with
bass, arpeggio and drums alone, and that form is a little quieter: by the check's own mean level
0.9 dB under the whole piece on floors 1 and 2 and 0.7 dB on floor 3 (2026-11-22).

The music sits under the effects, as it should: the loudest music is around 15 dB under the peak of
a typical effect. The film is another matter: it is about 24 dB louder than the floors' music, so
the game is very quiet after its own intro. Nothing clips and there is room to raise the game by
12 dB or so. Whether to do that, and by how much, is a question for an ear and is open.

Not judged by anyone yet: the title's and the wardens' tunes and the sound effects. The music
player on the title screen plays all of them.

`tools/selfplay-bot.js` is a bot that plays whole runs through the hooks using only what a player
has. `tools/selfplay.sh` runs it:

```
tools/selfplay.sh 1 30 pip                             # seeds 1..30 as Pip: a line per run, a summary, the census
tools/selfplay.sh gap 201 40 pip                       # the pick gap: three card policies on the same seeds
PERSONA=dodger STAKES=2 tools/selfplay.sh 201 40 wick  # the practised player, at step 2 of Stakes
```

A three-floor run simulates in a second or two, so this doubles as a crash test and a difficulty
gauge. All tables below are 120 runs per row, seeds 201 to 320 in three blocks of 40, each delver's
default deck, the build of 0.4. A row reads: beat floor 1 / beat floor 2 / won the run. Where 0.3
stands beside it, that is 0.3's play on the same seeds.

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
| Pip | 94 / 38 / 30 | 105 / 65 / 50 | 14 min |
| Wick | 97 / 48 / 37 | 106 / 72 / 62 | 15 min |
| Brindle | 105 / 41 / 30 | 110 / 70 / 57 | 15 min |
| Moss | 98 / 40 / 26 | 102 / 72 / 53 | 17 min |

The aim since 0.3 is a default where a practised player wins about every second run and a newcomer
fails on floor 2 at first. The dodger wins 50 to 62 of 120; the kiter clears floor 2 in 38 to 48
of 120.

0.4 was to leave the win rates where 0.3 had them: at most 5 of 40 away in each cell, which is 15
of 120. The same seeds with 0.3's play:

| Delver | Kiter in 0.3 | Dodger in 0.3 | Wins, 0.3 to 0.4: kiter, dodger |
|---|---|---|---|
| Pip | 88 / 35 / 29 | 103 / 70 / 50 | 29 to 30, 50 to 50 |
| Wick | 89 / 30 / 25 | 107 / 71 / 54 | 25 to 37, 54 to 62 |
| Brindle | 100 / 30 / 21 | 114 / 81 / 64 | 21 to 30, 64 to 57 |
| Moss | 84 / 27 / 15 | 103 / 70 / 46 | 15 to 26, 46 to 53 |

Every cell is inside the limit; the largest distance is 12 (Wick with the kiter). The kiter wins
more often than in 0.3, 123 of 480 runs after 90: a warden in its bullet phase does not chase, and
overloads help a bot that stays among its rooms. The dodger is where it was, 222 after 214.

### The pick gap: how much does the draft decide?

The design's claim is that one choice, the draft card, decides how the delver grows, what the
ground does and where the next monsters come from. The pick gap measures it: the same bot on the
same seeds, once with its own reading of the cards (`score`), once picking at random, once always
taking the first card. `tools/selfplay.sh gap` prints the three side by side.

| Delver, dodger | Chosen cards | Random cards | Floor 2 with random cards, as a share of chosen |
|---|---|---|---|
| Pip | 105 / 65 / 50 | 89 / 37 / 22 | 57% |
| Wick | 106 / 72 / 62 | 94 / 38 / 17 | 53% |
| Brindle | 110 / 70 / 57 | 105 / 53 / 37 | 76% |
| Moss | 102 / 72 / 53 | 90 / 62 / 35 | 86% |

The kiter with random cards: Pip 78 / 12 / 11, Wick 90 / 16 / 9, Brindle 89 / 15 / 8, Moss 75 / 19 / 10.

In 0.2 the dodger cleared floor 1 with random cards as often as with chosen ones, and Brindle and
Moss cleared floor 2 with them as well. The aim since 0.3 is that random cards clear floor 2 at
most half as often as chosen ones. Where that stands, with 0.3's play on the same seeds beside it:

- Over the four delvers the dodger clears floor 2 with random cards 68% as often as with chosen
  ones (190 against 279). In 0.3 it was 75% (218 against 292): Pip 59%, Wick 58%, Brindle 77%,
  Moss 106%. The card decides a little more than it did, most of all with Moss.
- Wins are further apart than floors: 111 against 222 with the dodger, 38 against 123 with the
  kiter. In 0.3 that was 112 against 214 and 24 against 90.
- Pip and Wick are near the aim, Brindle and Moss are not. Moss's deck is rooms that mend and pay,
  which the bot's card reading values little, so part of this may be the bot and not Moss.

### How runs end: the census

The bot's summary counts deaths per floor and what dealt the killing blow. Dodger, chosen cards:

| Delver | Deaths on floor 1 / 2 / 3 | Killing blows, most frequent first |
|---|---|---|
| Pip | 15 / 39 / 15 | imp 11, flower 10, bslime 7, spore 7, beetle 5, thorn 4 |
| Wick | 14 / 34 / 10 | flower 9, bslime 8, spore 7, tin 5, imp 4, wheel 4 |
| Brindle | 10 / 40 / 13 | beetle 8, spore 7, moth 6, thorn 6, flower 5, bslime 5 |
| Moss | 18 / 30 / 18 | imp 14, bslime 11, spore 10, bat 5, thorn 4, moth 3 |

The kiter dies mostly to the wardens; the dodger dies to ordinary monsters, most often to those that
shoot. In a person's save, `RW.census()` prints the same record for their last 20 runs.

Since 0.4 a record also says whether each hit was a touch or a bullet, and the bot's census line
ends with the bullets' share, `by a bullet: 9 of 18 (dice: 1)`: how many deaths ended on a bullet,
and how many on a die's bullet or touch. Over the four delvers:

| Bot | Deaths | Ended on a bullet | Ended on a die |
|---|---|---|---|
| kiter | 357 | 73 | 16 |
| dodger | 256 | 129 | 14 |

Bullets end one death in five for the newcomer bot and one in two for the practised one, who gets
close to little else. Of the 613 killing blows of both bots, the dice dealt 30 and the three
monsters of the house 29 (dealer 10, wheel 13, slot machine 6).

### What does the damage

Every run ends with a tally of who dealt its damage. Share of all damage done by rooms, and the
largest sources, dodger with chosen cards:

| Delver | Rooms' share | Largest sources |
|---|---|---|
| Pip | 46% | keyblade 10%, spikes 9%, ember 8%, furnace 7%, guardian 7% |
| Wick | 45% | spark 14%, furnace 12%, guardian 11%, ember 6%, hall 6% |
| Brindle | 48% | bomb 19%, spikes 13%, ember 8%, furnace 8%, guardian 7% |
| Moss | 37% | spikes 15%, thorns 11%, furnace 6%, hall 4% |

In 0.3 rooms did 39%, 35%, 34% and 29%, and in 0.2 a quarter for Pip. Overloads are the difference:
a Stone Hall, which did no damage at all, is now among the largest sources. A single run can look
very different: on one seed a Ballista Hall did two thirds of the damage on floor 1.

Pocket Bombs were trimmed from this tally in 0.3. With Brindle they did 31% of all damage with chosen
cards and up to 38% with random ones, against an agreed limit of a third; 25% and 33% after the trim,
and 19% with chosen cards in 0.4.
What changed: radius 28 and 35 at levels 1 and 4 (was 30 and 40), damage 24 and 29 at levels 2 and 4
(was 25 and 32), three bombs every 2.8 s at level 5 (was 2.6); Inferno Flask 35 damage, radius 39,
every 2.5 s (was 40, 44, 2.3). The bot kites, so it undervalues weapons that need you to stand close
(Lantern Halo, Tide Ring, Dragon Pepper); a person's tally will differ.

### Doors, the Stairwell and Stakes

Two door habits of the scoring bot, as Pip (dodger): `tight` keeps four sealed doors or fewer,
`open` takes the card with the most doors.

| Habit | Result | Sealed doors at a death | Rooms per run |
|---|---|---|---|
| tight | 104 / 64 / 42 | 5.4 | 32.8 |
| the bot's own (up to six) | 105 / 65 / 50 | 6.7 | 34.8 |
| open | 111 / 74 / 57 | 9.1 | 37.3 |

An open plan pays, and more clearly than in 0.3: 57 wins against 50 and 42. More monsters are more
glints, more keys and more rooms, and more rooms are more stars and resonance, which now overload.
Door pressure makes the open plan louder; it does not make the tight plan the better one. (The
doors are those sealed when the delver died.)

When to build the Stairwell, as Pip (dodger, chosen cards): `STAIRS=early` builds it as soon as it is
offered, `mid` after eleven rooms or three quarters of the clock, `late` when the clock is nearly out.

| Rule | Result | Rooms per run | Average run |
|---|---|---|---|
| early | 120 / 78 / 52 | 28.8 | 10 min |
| mid | 105 / 65 / 50 | 34.8 | 14 min |
| late | 99 / 81 / 74 | 47.8 | 19 min |

No rule is best on every floor: early gets through floor 1 every time and is no better than mid by
the end, late loses the most runs on floor 1 and wins by far the most overall. Waiting pays for
this bot: the rooms it gains outweigh the knocking that grows late in the clock.

Stakes, step by step, as Pip (dodger, chosen cards). Each step keeps the rules before it.

| Step | Rule it adds | Result |
|---|---|---|
| 0 | the plain game | 105 / 65 / 50 |
| 1 | Wardens arrive enraged. | 106 / 67 / 53 |
| 2 | Pests come from the first floor on, and sooner. | 102 / 62 / 41 |
| 3 | More dice, and from the second minute on. | 96 / 62 / 47 |
| 4 | Hearts drop half as often. | 95 / 54 / 39 |
| 5 | Monsters are a fifth tougher. | 81 / 42 / 21 |
| 6 | The dread clock runs a quarter faster. | 95 / 41 / 23 |

The ladder goes down, and not evenly: neighbouring steps differ by less than chance in places
(step 1 reads no harder than the plain game, step 3 easier than step 2), and tougher monsters at
step 5 are the largest single drop. An enraged warden runs its bullet phase faster, which the
dodger does not mind.

### Reading these numbers

- A block of 40 seeds is too small to compare two builds. The build of 0.3 itself gives Brindle
  with the kiter 8 wins on seeds 201 to 240, 1 on 241 to 280 and 12 on 281 to 320. That is why
  these tables have 120 runs per row since 0.4. A row of 120 still moves by about five either way
  when a change shifts what the generator deals, so do not read a ladder step by step where two
  neighbours differ by less than that.
- A run is not repeated exactly: the same build on the same seeds can differ by one run in a cell.
- The bots are not people. The dodger never tires and never misreads a pattern it has a rule for;
  it also never learns a warden, plans a floor or stands where a room does the killing. Balance
  against people starts with the playtests of 0.3 and 0.4.
- `unfinished` in a summary counts runs still going at the time limit (30 minutes of game time).
  Long runs with Moss reach it; anything else means the bot or the game got stuck.
- Re-run the tables after touching `CURVE`, a weapon, a monster or a warden. `tools/selfplay.sh gap
  201 40 pip` with `PERSONA=dodger` is the shortest look; a comparison of two builds needs the
  three blocks (201, 241 and 281, 40 runs each) for each delver and both bots.
