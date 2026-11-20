# Working on Roomwright

[Back to the README](../README.md)

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

## The live copy

<https://play-roomwright.netlify.app> serves two files, `index.html` and `intro.mp4`. To publish, copy
them into an empty folder outside this checkout and deploy that folder, so no `.netlify/` lands here:

```
netlify deploy --prod --no-build --dir <that folder> --site play-roomwright
GAME_URL=https://play-roomwright.netlify.app/ tools/check.sh   # the same checks against the deployed copy
```

## Not done yet

Balance has only been tuned against the bot, not against people. Nobody has listened to the audio
or held a real gamepad: the checks confirm that every sound produces a signal and that the pad
mapping works with a simulated pad, nothing more. Nobody has listened to the intro's soundtrack
either. Its levels are measured: -15.7 LUFS, peak -1.6 dBFS. There is no rebindable-controls screen, and room cards cannot yet be banned or weighted
inside a deck.
