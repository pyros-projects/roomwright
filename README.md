# Roomwright

A survivors-like where **every level-up is a room**. One self-contained file: open `index.html` in a
browser and play. No libraries: all in-game pixel art is drawn by code at boot and all in-game sound is
synthesised with WebAudio. `intro.mp4`, a 30-second intro film, sits next to it and is optional. Without
it the game starts on the title screen.

**Play it: <https://play-roomwright.netlify.app>**

[![The intro film: one room with four sealed doors, a key, a new room, the Warden, the floor plan, the logo](media/intro.gif)](intro.mp4)

The intro runs 30 seconds. [Watch it with sound](intro.mp4).

| A door, three cards | The first room, a minute in |
| :---: | :---: |
| ![The draft screen: three room cards, each with a room power and a boon](media/draft.png) | ![Pip between slimes and bats in the starting room](media/play.png) |

Version 0.2: three floors, 36 room cards, 24 weapons (each with an evolution), 27 charms, four
delvers and a deck you build between runs.

## The idea

You start in a single room with four sealed doors. Monsters only ever enter through sealed doors.
Killing them drops glints; glints forge **keys**. Push a key into a door and you *draft* what lies
behind it. Each card is a room (with a persistent power: spikes, guardian owls, a healing fountain,
burning or freezing floors...), a boon (a weapon, an upgrade or a charm) and some number of new doors.

So one choice decides three things at once: how your character grows, what the terrain you fight on
does, and where the next monsters will come from.

### Why the floor plan matters

- **Stars.** Draft a room type you already own and every room of that type levels up (to three
  stars). Levels last for the whole run.
- **Elements and resonance.** Every room has one of eight elements. Two rooms of the same element
  joined by an open doorway resonate: +25% room power each, per link. Stone resonates with anything.
  The draft card previews the bonus for the spot you are about to build on.
- **Evolutions.** Each weapon evolves in one specific room: reach level 5, then walk into that room
  on the current floor. Twelve weapons evolve in starter rooms. The other twelve evolve in rooms
  native to one floor or belonging to one delver, so you have to build that room before you leave
  its floor, or collect its card and put it in your deck. A weapon card shows the room it needs
  (dimmed when the run can no longer reach it), and drafts lean toward weapons that still can.
- **Door pressure.** Every sealed door adds 11% to the knocking (the HUD shows the multiplier, each
  card shows what it would change). Dead ends are quiet; a Crossroads is loud and rich.
- **Pests** attack the layout instead of you. Latchlings latch a doorway you have to shoulder
  open, Sappers dig a new sealed door into a wall, Hexers switch a room's power off until they die.

### The shape of a run

A run is three floors: the Cellar, the Undergarden and the Kiln. Each has its own monsters, pests,
warden, look, music and a handful of **native rooms** that only turn up there. After five rooms the
draft also offers **the Stairwell**: build it and the floor's warden climbs out. The warden is
weaker the earlier you call it, and beating it with time to spare pays keys, but every room you
skip is power you do not take downstairs. Wait too long (the dread bar under the clock) and the
warden comes for you, enraged. Weapons, charms, hearts and room stars carry down; the floor plan
starts again from one room.

### The deck

Drafts deal from a **deck of ten room cards** plus one room native to the floor. Drafting a native
room once adds its card to your collection; wardens drop cards and delvers of their own. On the
hero screen press Q to edit a delver's deck: which rooms you bring decides which evolutions and
resonances the run can reach.

| Delver | Starts with | Perk | Unlock |
|---|---|---|---|
| Pip, the Key Squire | Key Blade | a spare key on every floor | start |
| Wick, the Lamplighter | Spark Bolt | room powers 20% stronger | beat the Cellar's warden |
| Brindle, the Tinker | Pocket Bombs | five hearts, slower dash | beat the Undergarden's warden |
| Moss, the Gardener | Thorn Trail | hearts drop twice as often and mend double | beat the Unmaker |

### Weapons and where they evolve

| Weapon | Evolves in | Weapon | Evolves in |
|---|---|---|---|
| Key Blade | Old Vault | Hand Ballista | Ballista Hall (floor 1) |
| Spark Bolt | Dusty Library | Squib Rocket | Powder Store (floor 1) |
| Ricochet Rune | Stone Hall | Loaded Dice | Dice Hall (floor 1) |
| Lantern Halo | Fountain Court | Tide Ring | Hot Spring (floor 1) |
| Twin Moons | Guardian Post | Honey Pot | Apiary (floor 2) |
| Pocket Bombs | Ember Hall | Toadstools | Fairy Ring (floor 2) |
| Storm Bell | Moss Garden | Briar Whip | Bramble Maze (floor 2) |
| Thorn Trail | Spike Gallery | Lucky Coin | Counting House (floor 2) |
| Frost Fan | Frost Grotto | Snowball | Blizzard Loft (floor 2) |
| Skeleton Key | Crossroads | Dragon Pepper | Blast Furnace (floor 3) |
| Welcome Mat | Monster Den | Buzz Saw | Saw Run (floor 3) |
| Lamp Moth | Quiet Nook | Clockwork Sentry | Workshop (Brindle's room) |

## Controls

| | Keyboard | Gamepad | Touch |
|---|---|---|---|
| Move | WASD / arrows | left stick / d-pad | drag on the left half |
| Dash (brief invulnerability) | Space / Shift | A or X | tap the right half |
| Open a door | walk into it while holding a key | same | same |
| Choose a card | Left/Right + Enter, or 1 2 3 4, or click | stick + A | tap the card |
| The Stairwell (once offered) | Down, then Enter | down + A | tap its bar |
| Deal again (Map Room, two stars) | R | | |
| Step back from a draft (free; cards stay) | Esc | B | tap outside the cards |
| Edit the deck (hero screen) | Q or Tab | | tap the deck |
| Pause / options | P or Esc | Start | pause button |
| Mute | M | | |
| Skip the intro | Enter, Space or Esc, or click | A or B | tap |
| Watch the intro again (title screen) | I, or click INTRO | | tap INTRO |

Weapons fire on their own. `index.html?seed=123` pins the run's random seed. Progress is saved in
`localStorage` under `roomwright.v2`.

## Working on it

The game is written as small modules in `src/` and **built into the single `index.html`** by
`tools/build.sh` (bash and `cat`, nothing else). All modules share one strict-mode function scope,
in file-name order. Edit `src/`, run the build, reload.

```
tools/build.sh           # write index.html
tools/build.sh --check   # fail if index.html is stale
```

| File | What is in it |
|---|---|
| `01-core` `02-audio` `03-input` | constants, seeded RNG, pixel toolkit, bitmap font; synth SFX and music; keyboard, mouse, touch, gamepad |
| `10-art` `11-art-more` `12-art-icons` | every sprite, as ASCII grids in the `PAL` palette with an automatic outline |
| `20-weapons` | `WEAPONS` (levels, evolution and its room) and `CHARMS` |
| `22-rooms` | `ELEMENTS`, `ROOM_TYPES` (17x11 ASCII layouts, element, stars text), themes |
| `23-monsters` `24-floors` | `MON`; `FLOORS` (monster mix, timeline, pests, natives), `CURVE`, `HEROES`, unlocks |
| `30-dungeon` | the grid, doors, resonance links, latching and breaching, room painting, flow fields |
| `40-actors` `41-weapons` | player, monsters, shots, pickups; one `WUPD` function per weapon |
| `42-director` `43-draft` | spawning and pressure, events, wardens, room powers; dealing cards and placing rooms |
| `50-` `51-` `52-render-*` | world, HUD, and the menu, draft, hero and deck screens |
| `60-game` `61-intro` `70-debug` | save data, modes and the main loop; the intro film player; the `window.RW` test hooks |

The parts you are most likely to touch:

- **`CURVE` in `24-floors.js`** holds every difficulty knob. Difficulty comes from pressure (spawn
  rate, door pressure, pests, events) rather than from monster hit points; `CURVE.hp` is not the
  lever to pull to make the game harder.
- A new **weapon** is a table entry (with its `evo` and the room it evolves in), one function in
  `WUPD` and an `i_<id>` icon (the evolved icon is made from it). Each evolution needs a room of its
  own; twelve room cards are still free.
- A new **room** is a `ROOM_TYPES` entry (element, tier, layouts, `lv` text per star), an `i_<id>`
  icon and, if it does something, a case in `updateRooms` (`42-director.js`). Add it to a floor's
  `natives`, a hero's deck or `BOSS_UNLOCKS` so it can be found.
- A new **floor** is a `FLOORS` entry plus a warden in `MON` and `BOSS_AI`.
- `RW.sheet()` in the console toggles a contact sheet of every sprite.
- The simulation runs on a fixed 60 Hz step and uses a seeded RNG for everything that affects play,
  so a seed plus the same inputs replays exactly.

### The intro

The first time a save boots, the game plays `intro.mp4` before the title screen: one room and four
sealed doors, the knocking, glints forging a key, the key in the lock, a new room, the Warden, the
floor plan growing, the logo. The film ends on the logo where the title screen draws it, and the
title fades in under it. A browser only starts a film with sound after a key press or a tap, so on
a first visit the game shows `PRESS ANY KEY` first. The save then records that the film has played.
Later boots go to the title, and `I` (or the INTRO label in the corner) plays it again. `M` mutes it
like everything else. `index.html?intro=0` never plays it, `?intro=1` always does.

`src/61-intro.js` is the player: a `<video>` laid over the canvas, the skip label drawn in the
game's font, and the fallbacks (no file, no codec, a stalled download) that lead to the title.

The film's sources are in `intro/`. [pixel-cat](https://github.com/pyros-projects/pixel-cat) converts
the art and renders the film:

1. `intro/art/prompts/` holds one prompt per shot. An image model painted each shot at 1792 x 1008,
   steered by a model sheet made from the game's own sprites (`intro/art/raw/00-model-sheet.png`)
   and a screenshot. `intro/tools/imagegen.py` makes the calls. The paintings are in `intro/art/raw/`.
2. `pixel-cat convert` turns each painting into a 400 x 225 plate with 64 colours (`intro/plates/`).
   `intro/build.sh --plates` also cuts the key and the glint from the model sheet and converts them
   (`intro/sprites/`). The game draws the logo, the tagline and the captions itself, and
   `intro/tools/export_text.py` exports them, so the film's lettering is the game's lettering.
3. `intro/make_story.py` writes `story.json`: eight shots with camera moves, lights, particles and
   sprite layers. Its soundtrack plays the title theme (Am F C G at 80 bpm) on the film skill's
   bells and tones. The cues repeat the notes of the game's knock, key and draft sounds. Cuts fall
   on beats. The captions are in `intro/captions.json`.
4. `intro/build.sh` renders `story.json` with pixel-cat's film renderer, burns the captions in and
   writes `intro.mp4` (1600 x 900, H.264 and AAC, under 5 MB).

```
intro/build.sh            # needs uv, ffmpeg and a pixel-cat checkout (PIXEL_CAT_HOME)
intro/build.sh --plates   # also convert the paintings again
```

### The live copy

<https://play-roomwright.netlify.app> serves two files, `index.html` and `intro.mp4`. To publish, copy
them into an empty folder outside this checkout and deploy that folder, so no `.netlify/` lands here:

```
netlify deploy --prod --no-build --dir <that folder> --site play-roomwright
GAME_URL=https://play-roomwright.netlify.app/ tools/check.sh   # the same checks against the deployed copy
```

### Debug hooks, checks and self-play

`window.RW` exposes the run state and test hooks (`RW.state()`, `RW.manual(true)` + `RW.step(n)` to
drive the clock yourself, `RW.hold/press` for input actions, `RW.openDraft`, `RW.chooseCard`,
`RW.chooseStairs`, `RW.spawnMon`, `RW.summonBoss`, `RW.enterFloor`, ...).

The scripts below run headless with [agent-browser](https://github.com/vercel-labs/agent-browser).
Both take `AGENT_BROWSER=/path/to/agent-browser` and `AB_FLAGS='...'` for extra global flags (for
example `--args --no-sandbox,--disable-gpu` inside a sandbox or CI container).

`tools/check.sh` is the regression pass (about two minutes). It boots the page and fails on any
console error, then runs four scripts:

- `tools/check-content.js`: every room power, star level, resonance, pest, weapon, evolution,
  charm, warden and unlock does what its card says.
- `tools/check-flows.js`: first run, pause and options, drafting, the Stairwell, game over, hero
  and deck screens, victory, endless, and the gamepad mapping driven by a simulated pad.
- `tools/check-audio.js`: every sound effect and music track puts a signal on the master bus. It
  measures level, not whether it sounds good, and is skipped where the browser has no audio.
- `tools/check-intro.py`: the intro on a fresh save (held for the first key, then playing with
  sound), skipping with Enter, Esc and a click, the save flag, the replay from the title, the
  film's own ending, the `?intro` switches and the fallback when the film is missing. Run it alone
  with `uv run --with playwright tools/check-intro.py`. It presses real keys, because a browser
  starts a film with sound only after a real gesture. Without a Chromium for Playwright it is
  skipped.

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

## Not done yet

Balance has only been tuned against the bot, not against people. Nobody has listened to the audio
or held a real gamepad: the checks confirm that every sound produces a signal and that the pad
mapping works with a simulated pad, nothing more. Nobody has listened to the intro's soundtrack
either. Its levels are measured: -15.7 LUFS, peak -1.6 dBFS. There is no rebindable-controls screen, and room cards cannot yet be banned or weighted
inside a deck.
