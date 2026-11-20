/* =====================================================================
   ROOMWRIGHT  -  v0.2
   A survivors-like where every level-up is a ROOM.
   ---------------------------------------------------------------------
   Single file, zero dependencies. All art is generated at boot from code
   (ASCII sprite sheets + procedural painters); all audio is synthesised.

   THIS FILE IS BUILT. Edit the modules in src/ and run tools/build.sh.

   MAP OF THE SOURCE (src/, concatenated in this order)
     01-core ............. constants, math, rng, pixel toolkit, bitmap font
     02-audio ............ WebAudio sfx + tiny chiptune sequencer
     03-input ............ keyboard / mouse / touch / gamepad -> actions
     10-art .............. sprites: heroes, floor-1 monsters, props, icons
     11-art-more ......... sprites: later monsters, wardens, new props
     12-art-icons ........ icons for rooms, weapons, charms, elements
     20-weapons .......... DATA: weapons (+ evolutions) and charms
     22-rooms ............ DATA: elements, room cards, layouts, themes
     23-monsters ......... DATA: monsters, pests, elites, wardens
     24-floors ........... DATA: floors, difficulty curves, heroes, unlocks
     30-dungeon .......... grid, rooms, doors, gates, breaches, painting, flow
     40-actors ........... run + floor state, player, monster AI, pickups
     41-weapons .......... auto-attack behaviours and evolutions
     42-director ......... spawning from doors, pests, wardens, room powers
     43-draft ............ room cards: the level-up
     50/51/52-render ..... world, HUD, screens (draft, deck, menus, title)
     60-game ............. save data + meta-game, state machine, loop, boot
     70-debug ............ window.RW hooks used by automated playtests
   ===================================================================== */
