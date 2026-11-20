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

The dice are what you get for cheating them. A die hops after you and throws a ring of 8 to 18
bullets, as many as it rolled. A loaded die is twice the size, throws two rings of up to 28 and
breaks into two dice. Enraged monsters move a quarter faster. Deeper floors add to every pack.
Nothing a knock calls carries glints or hearts, so a knock is never a way to farm. The count
starts again on each floor. A Map Room's free deals come first; `R` knocks back once they are used.

## Why the floor plan matters

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

## The shape of a run

A run is three floors: the Cellar, the Undergarden and the Kiln. Each has its own monsters, pests,
warden, look, music and a handful of **native rooms** that only turn up there. After five rooms the
draft also offers **the Stairwell**: build it and the floor's warden climbs out. The warden is
weaker the earlier you call it, and beating it with time to spare pays keys, but every room you
skip is power you do not take downstairs. Wait too long (the dread bar under the clock) and the
warden comes for you, enraged. Weapons, charms, hearts and room stars carry down; the floor plan
starts again from one room.

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
