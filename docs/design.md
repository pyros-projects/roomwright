# How Roomwright plays

[Back to the README](../README.md)

You start in a single room with four sealed doors. Monsters only ever enter through sealed doors.
Killing them drops glints; glints forge **keys**. Push a key into a door and you *draft* what lies
behind it. Each card is a room (with a persistent power: spikes, guardian owls, a healing fountain,
burning or freezing floors...), a boon (a weapon, an upgrade or a charm) and some number of new doors.

So one choice decides three things at once: how your character grows, what the terrain you fight on
does, and where the next monsters will come from.

## How the game teaches a card

The first draft stops on one card and walks through it in four steps: the room, the boon, the new
doors and the Stairwell. Each step frames that part of the card and says one sentence about it.
After that a draft explains at most one new thing, the first time a card shows it: a room that
levels up (stars), resonance, an evolution, a dead end, the Stairwell once it is open, and what to do
with a hand you do not want. `H` (or `?`, or the EXPLAIN chip) explains the selected card again at
any time.

The Stairwell is on the draft screen from the first draft. Until it is on offer it is a locked bar
that says how many rooms it still needs, and the HUD shows the same count next to the clock
(`STAIRS 2/5`).

## Knock back

A hand you do not want has two answers. Stepping back with Esc is free, and every door holds its
own three cards, so another door is a free second look. Or knock back: press `R` in a draft and the
cards behind this door change. The key stays, and the door answers with a pack out of that very
door.

| Knock on this floor | What comes out | The warden's clock |
|---|---|---|
| first | 8 monsters | unchanged |
| second | 18 enraged monsters, the floor's elite, two dice | 30 seconds shorter |
| third and later | 26 or more enraged monsters, two elites, three dice, a loaded die | 45 seconds shorter each |

The dice are what you get for cheating them: several at once, enraged, where a wave brings one
now and then (see Dice below). Enraged monsters move a quarter faster. Deeper floors add to every
pack. Nothing a knock calls carries glints or hearts, so a knock is never a way to farm. The count
starts again on each floor. A Map Room's free deals come first; `R` knocks back once they are used.

## Dice

A die hops after you and throws a ring of 8 to 18 bullets, as many as it rolled, and you weave
through the gaps. A loaded die is twice the size, throws two rings of up to 28 and breaks into two
dice. From a set minute on each floor they come with the ordinary waves, so a run that gets that
far has moments where the screen is full and movement decides:

| Floor | A die from | A loaded die from | Of 100 monsters in a wave |
|---|---|---|---|
| 1 | minute 5 | never | 1 |
| 2 | minute 3 | minute 5 | about 2 |
| 3 | minute 2 | minute 4 | about 3 |

The numbers are `DICE` in `src/24-floors.js`. A knock back draws a larger pack from the same
waves and adds dice of its own: two at the second knock, three and a loaded die at the third, more
after that. The third step of Stakes brings dice from the second minute of every floor and two to
six times as many.

A warden fights without them. None join the waves while it lives, and the dice a wave brought flee
with the small monsters when it comes; only a loaded die that a knock called stays, like the
floor's elite. (At the third step of Stakes dice do come into a warden's fight, as they did
before.) A loaded die from a wave is an elite like any other and leaves a heart and 20 glints; one
that a knock called leaves nothing.

An enemy bullet is a bright core in a near-black rim. On light ground the rim stands off, on dark
ground the core and the colour around it, so on a ground of any brightness at least half of a
bullet's 24 pixels differ from it clearly. Before 0.4 the rim was a darker shade of the bullet's
own colour, and a red bullet nearly vanished on the hearth's red carpet. The price: on the darkest
floors (Ember Room, Furnace, Altar) the rim no longer shows and a bullet reads as 4 by 4 pixels,
where it read as 6 by 6. Bullets are also part of the top layer (see What the screen may do), so
no effect covers them.

## The house

A motif grew by itself: Dice Hall, Loaded Dice, Lucky Coin, Counting House, the dice that punish a
knock. Three monsters extend it, one on each floor. Each shoots in its own way, and each way asks
for a different move:

| Floor | Monster | What it does | What it asks |
|---|---|---|---|
| 1 | The dealer | Winds up for half a second, then throws five cards in a fan with the middle one at where you stand. Then it waits three to four seconds. | Step through a gap. A delver that is already walking sideways is past the fan before it arrives. |
| 2 | The roulette wheel | Rattles for half a second, then turns in place for two seconds: an arm of balls that starts well beside you and comes round, toward you and past you. | Circle it, ahead of the arm. The arm comes round by about a quarter turn and no further, so walking away from it is enough at any distance; walking toward it or standing is hit. |
| 3 | The slot machine | Its reels roll, then three of a kind stand above it for seven tenths of a second. Cherries pay a ring of 14, bells a fan of five at you, sevens three fast bolts at you. | Read it and back off. The ring thins out with distance; the fan and the bolts hit a delver that stands and miss one that keeps walking. |

Each comes by itself the first time: one of its kind, out of a door that is idle, with a banner
that says what it does, and no new wave starts for three seconds. Other monsters are still about.
That is three minutes into floor 1, two and a half into floor 2 and two into floor 3. Fifty seconds
later it joins the waves, where of 100 monsters two to four are of the house. A warden fights
without them, as it does without the dice. On a floor without a sealed door it never comes.
The numbers are `HOUSE` in `src/24-floors.js` and the three rows of `MON` in
`src/23-monsters.js`.

## Why the floor plan matters

- **Stars.** Draft a room type you already own and every room of that type levels up (to three
  stars). Levels last for the whole run. A room's power is 0.85, 1.6 and 2.6 at one, two and three
  stars: one star alone is a help, three do real work.
- **Elements and resonance.** Every room has one of eight elements. Two rooms of the same element
  joined by an open doorway resonate: +40% room power each, per link. Stone resonates with anything.
  The draft card previews the bonus for the spot you are about to build on. A three-star room with
  two links is five and a half times a lone one-star room.
- **Overloads.** A room at three stars with two resonance links overloads by itself. Every 20
  seconds it lets go of one burst in its element across the whole room. It needs no button, it
  fires whether or not you are in the room, and it never hurts you. A ring of pips on the room's
  floor fills up as it charges and blinks just before it goes. A hexed or besieged room does not
  charge. The draft card says OVERLOAD when a pick would bring a room that far (the new room, a
  neighbour that gains its second link, or every room of a type that gains its third star), and
  the coach explains it once. The bursts, all scaled by the room's power:

  | Element | Every monster in the room |
  |---|---|
  | Fire | is scorched and burns on for four seconds |
  | Frost | is frozen for three seconds (wardens are not) |
  | Steel | takes the heaviest blow of the eight |
  | Stone | is thrown back and pinned where it lands for a second |
  | Wild | is rooted for three seconds and poisoned for three |
  | Shadow | is marked for six seconds: everything hits it half as hard again |
  | Lore | is marked for four seconds, and every glint on the floor flies to you |
  | Water | is washed back; if you stand in the room and have no shield, you get one |

  A warden takes the damage but is not frozen, pinned, rooted or thrown. It follows the screen's
  rules: a ring in the element's colour and one sound, no flash of the screen. The rooms that the
  title builds behind its logo overload too, without sound. The numbers are `OVER` in `src/42-director.js`.
- **Evolutions.** Each weapon evolves in one specific room: reach level 5, then walk into that room
  on the current floor. Twelve weapons evolve in starter rooms. The other twelve evolve in rooms
  native to one floor or belonging to one delver, so you have to build that room before you leave
  its floor, or collect its card and put it in your deck. A weapon card shows the room it needs
  (dimmed when the run can no longer reach it), and drafts lean toward weapons that still can.
- **Door pressure.** Every sealed door adds to the knocking: 11% on the first floor, 15% on the
  second, 17% on the third (the HUD shows the multiplier, each card shows what it would change).
  Dead ends are quiet; a Crossroads is loud and rich. A plan with seven sealed doors is one and a
  half times as loud as one with three on the first floor, and 1.6 times on the third.
- **Sieges.** Each floor's elite (King Slime, Elder Shroom, Furnace Golem) goes for the room you
  built up most: stars first, then resonance. While it stands in that room the room's power is
  off, and the minimap blinks a red frame around it. On its way there it ignores you, so it can be
  stopped. Once it has settled in, it turns on you when you come close or walk in, and goes back
  when you leave: fight it there, or lure it out. A floor where nothing is built up has no target.
- **Pests** attack the layout instead of you. Latchlings latch a doorway you have to shoulder
  open, Sappers dig a new sealed door into a wall, Hexers switch a room's power off until they die.

## The shape of a run

A run is three floors: the Cellar, the Undergarden and the Kiln. Each has its own monsters, pests,
warden, look, music and a handful of **native rooms** that only turn up there. After five rooms the
draft also offers **the Stairwell**: build it and the floor's warden climbs out. The warden is
weaker the earlier you call it, and beating it with time to spare pays keys, but every room you
skip is power you do not take downstairs. The Stairwell's bar on the draft screen says what it
would wake right now ("warden at 62%") and how many keys a fast kill would still pay.

Waiting has a price before the clock runs out. Past 60% of the dread clock (the bar under the clock
turns orange) the knocking grows, up to 60% more at the end. Wait until it runs out and the warden
comes for you, enraged. And a warden's fight cannot be waited out: after 50 seconds it gains a step
of fury every 20 seconds, up to eight, and each step makes everything it does a tenth faster
(except its bullet phase, below). Pips
under its health bar count the steps. A build that kills slowly meets a quicker warden.

Once the warden is dead the floor is quiet: no monsters, and a Greenhouse grows no more glints.
Weapons, charms, hearts and room stars carry down; the floor plan starts again from one room.

### A warden's bullet phase

Once in its fight, when a warden is down to 60% of its health and between two attacks, it stops
chasing. For nine tenths of a second it stands, flickers and draws the air in, and a banner names
what comes. Then it fills the room with a pattern, in the character of its floor, and each pattern
has a way through that plain walking finds:

| Warden | The pattern | The way through |
|---|---|---|
| Gatejaw | THE GATE COMES DOWN: six rings of bullets, each with one gap. The first gap points at where you are when the ring is thrown, and it turns a little with every ring. | Stay in the gap and walk with it. |
| Mother Morel | SHE BLOOMS: seven slow rings of ten spores, each ring set into the gaps of the one before. | Step from gap to gap. |
| The Unmaker | IT BUILDS WALLS: five walls cross the room you stand in, one after the other from the side farthest from you. Each has a doorway a few steps beside the last. | Walk through the doorways. |

Gatejaw and Mother Morel still hurt to touch while they do this, and Mother Morel keeps smothering
her room. The Unmaker turns to thin air while it builds: it stays where it hovered, a doorway may
lie right on it, and walking through it costs nothing. It can still be hit. An
enraged warden (one that came because you overstayed, or the first step of Stakes) runs its
pattern 1.3 times as fast. Fury does not touch the phase: its clock is the game's, so the way
through stays walkable however long the fight has lasted. The numbers are `PHASE` and `PHASES` in
`src/42-director.js`.

## What the screen may do

The screen should burn, inside rules that keep the next decision readable.

- **A top layer.** The delver, pickups and enemy bullets are drawn once more, last, over every glow,
  blast, particle and damage number and over the screen's flash. Whatever happens, you see where
  you are, what is coming at you and what there is to pick up. The delver also shows over a monster
  that stands in front of it. A prop in front of the delver still hides it, as before. Only the
  small marks that belong to the delver come after that layer: the dash bar, a key over a door you
  can open, the bar of a hold.
- **Flashes are kept apart.** A flash of the whole screen cannot start within a third of a second
  of the last one, so the screen flashes at most three times a second. The flash is a tint: it
  covers at most 0.27 of the picture, in a red that is not saturated. At two hearts or fewer a slow
  pulse of up to 0.12 lies over the picture as well.
- **The big moments are the loud ones.** A small monster dies with a puff. An elite dies with a
  ring, a low boom and a shake, a warden with a larger ring. (A mimic has its own moment: the loot
  it spills.) None of this holds the game, so no key press is lost to a kill. An evolution does
  hold it, for a little over a second, with a ring, sparks, its own sound and a banner.
- **Screen shake** has its switch in the pause menu.

## The music, and how it can follow the plan

Each floor has a piece of its own, written out note by note on the tune the floor had from the first
version: "What the Cellar Keeps" (48 bars, A minor), "What Grows Without Light" (48 bars, D minor)
and "What the Fire Leaves" (56 bars, E minor), darker the deeper you go. The game's synthesizer plays
them live, from the same plain waves as the sound effects. A piece has up to eight voices: bass,
arpeggio, drums, a lead, a voice that answers it, a counter voice, plucked chords and bells.

`Music grows` in the pause menu sets whether the music follows the floor plan. Nothing in play
depends on hearing it.

| Setting | What plays |
|---|---|
| NO (the default) | The whole piece, whatever you build. |
| WITH THE PLAN | Bass, arpeggio and drums from the start. The lead and its answer enter with the first room you build on the floor, the counter voice and the plucked chords with the third, the bells with the fifth, which is when the Stairwell is first offered. From then on the whole piece plays. |
| BY ELEMENT | The whole piece, and on top of it one voice for each element among the rooms you built: Stone a low footing, Shadow a low third, Water a ripple up the chord, Steel ticks off the beat, Lore two long notes a bar, Wild hops between the beats, Fire a high flicker, Frost single high notes that ring. A voice enters with the first room of its element and gets a second, softer layer an octave away while one of those rooms resonates. |

The floor's first room and the Stairwell are not rooms you chose for what they are, and count for
neither setting. An element resonates, for the music, when one of its rooms links to another room
you built. The eight element voices are written once, as figures over a piece's chords, so the
same eight fit all three floors. A new floor starts its piece with that floor's plan: bare again.

### The music player

MUSIC on the title screen opens a player. It lists every track: the title's, the three floors' and
the wardens'. All are there from the first start. Choosing one plays it from its start and shows
where it is: the bar and, for a written piece, the part. Its switches turn the voices of the piece
on and off, and the element voices and their resonating layer, so both ways of `Music grows` can be
heard there without a run. A second page, SOUNDS, plays every sound effect.

Under it sprites from the game dance. Each voice has a dancer: the floor's monsters for a floor's
piece with your delver on the lead, the delvers for the title's tune, the three wardens and a pest
for the wardens' tune, and an icon for each element voice. A dancer hops when its voice starts a
note, stands still otherwise, and is dimmed while its voice is switched off.

## What did the work

The end screen and the pause menu show a row of icons with shares: the weapons, room types and
charms that dealt the run's damage, largest first. The line under an icon says what it is (gold: a
weapon, blue: a room, green: a charm). Every point of damage has an owner: a bomb in the air is
still the bombs', a burn belongs to what lit it, a Fairy Ring's cloud to the Fairy Ring.

## Stakes

A win opens Stakes for the delver who won. The hero screen then shows a ladder of six steps: UP and
DOWN (or a click or tap on those lines) set the step for the next run, and a win at the highest open
step opens the next. Each step adds one rule and keeps the ones before it.

| Step | Rule |
|---|---|
| 1 | Wardens arrive enraged. |
| 2 | Pests come from the first floor on, and sooner. |
| 3 | More dice, and from the second minute on. |
| 4 | Hearts drop half as often. |
| 5 | Monsters are a fifth tougher. |
| 6 | The dread clock runs a quarter faster. |

The plain game is step 0. The pause menu and the end screen name the step you are playing.

## The daily delve

DAILY on the title starts the same run for everyone for a day. The seed comes from the date (UTC),
and so do the delver and the deck: Pip, Wick, Brindle and Moss take turns, each with its own ten
cards, whatever the save holds, without Stakes and without the first-run tutorial. Day 1 is
22 November 2026.

- **The same cards behind the same doors.** In an ordinary run the cards behind a door come from
  the run's one generator, so they depend on how the fight went before the door was opened. In a
  daily delve each deal has its own generator, seeded from the day, the floor, the door's place and
  how many new hands that door has been asked for. Everyone starts with the same four hands behind
  the hearth's four doors. Later, two players who are in the same situation when they first look
  behind a door find the same cards: the hand is dealt at the first look and stays, and what can be
  dealt depends on the plan and the delver at that moment (the first draft offers weapons, a dead
  end is not dealt where it would close the floor, a boon that upgrades a weapon needs the weapon).
  A knock back deals the door's next hand, again the same for both.
- **One attempt counts.** The first attempt of a day counts from the moment it starts, also when
  it is left from the pause menu or the tab is closed. Later ones are practice: the banner and the
  end screen say so, and they do not change the day's result. "Again" on the end screen replays
  the same day, also after midnight. A daily delve is a run like any other in what it finds: cards
  and delvers it unlocks are kept, a win counts as a win, practice included. It stands outside the
  Stakes ladder and does not count as one of the first runs that get the tutorial.
- **What is kept.** The end screen names the day and the result. The save keeps the last 14 days
  (day, delver, won or the floor reached, time, rooms). Nothing leaves the browser: there is no
  server and no list of other players.

The numbers are `dailyInfo()` in `src/60-game.js`; the deal is `makeCards()` in `src/43-draft.js`.

## The deck

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

## Weapons and where they evolve

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
