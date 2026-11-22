# Working on Roomwright

[Back to the README](../README.md)

The game is written as small modules in `src/` and **built into the single `index.html`** by
`tools/build.sh` (bash and `cat`, nothing else). All modules share one strict-mode function scope,
in file-name order. Edit `src/`, run the build, reload.

`CHANGELOG.md` is built in too. It is the one source of the changelog: the build puts its text
into the game, where the title screen's CHANGELOG entry shows it. To add an entry, write a line
that starts with `- ` under the version it belongs to and run the build. A version starts with
`## 0.4: Its name (date)`; a line that starts with two spaces continues the entry above it. Write
what changed for a player, in plain sentences, with characters the game's font has: letters,
digits and common punctuation. No backtick, backslash, at sign or curly brace: the build refuses
the first two, and the last three draw as icons in the game. The version at the top is the game's
`VERSION`.
Each change that a player can notice adds its line when it lands.

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
| `25-music` | music that is written out note by note: one piece per floor, each built from its theme, voicings and rhythms |
| `26-changelog` | the changelog's versions and entries, read from the text of `CHANGELOG.md` |
| `30-dungeon` | the grid, doors, resonance links, latching and breaching, room painting, flow fields |
| `40-actors` `41-weapons` | player, monsters, shots, pickups; one `WUPD` function per weapon |
| `42-director` `43-draft` `44-coach` | spawning and pressure, events, wardens, room powers; dealing cards and placing rooms; the lessons shown on a draft card |
| `50-` `51-` `52-render-*` | world, HUD, and the menu, draft, hero and deck screens |
| `60-game` `61-intro` `62-music-player` `70-debug` | save data, modes and the main loop; the intro film player; the title's music player; the `window.RW` test hooks |

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

## The live copy

<https://pyros-projects.github.io/roomwright/> serves two files, `index.html` and `intro.mp4`. A push to
`main` that changes the game publishes it. `.github/workflows/pages.yml` checks that `index.html`
matches `src/`, uploads the two files to GitHub Pages, then fetches the live copy and compares it
with the commit. The same workflow can be started by hand from the Actions tab.

Every version branch (`v0.3`, `v0.4`, ...) is published next to it under its own name, for example
<https://pyros-projects.github.io/roomwright/v0.3/>, for as long as the branch exists. That holds for
the branch being playtested and for the ones already merged: version branches are not deleted after
a merge, so any version can be opened and compared with the ones before it. A copy served from a
version folder keeps its own save, so playing it never touches progress in the released game. A push
to `main` or to a version branch from `v0.4` on publishes all of them again. A run uses the workflow
of the branch that was pushed, and `v0.3` is from before this: a push to it would publish only `main`
and `v0.3`.

So run `tools/build.sh` before you commit a change in `src/`: a stale `index.html` stops the deploy.
After a deploy, run the full checks against the live copy:

```
GAME_URL=https://pyros-projects.github.io/roomwright/ tools/check.sh
```

## Not done yet

Balance is tuned against two bots, a newcomer and a practised player (`docs/checks.md`), and not
yet against people. The music of the three floors has been listened to and approved, played by the
game's synthesizer outside a run. Nobody has yet judged the title and warden music or the sound
effects (the title's music player plays them all), and the game is about 24 dB quieter than its
intro film (`docs/checks.md`, "How loud things are"). Nobody has held a real gamepad: the checks confirm that every sound produces a signal and that the pad
mapping works with a simulated pad, nothing more. The intro's soundtrack has been
listened to and approved. Its levels are measured: -15.7 LUFS, peak -1.6 dBFS. There is no rebindable-controls screen, and room cards cannot yet be banned or weighted
inside a deck.
