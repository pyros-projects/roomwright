/* ===================== 8d CONTENT: floors, curves, heroes ============= */
// A run is three floors. Each has its own monsters, pests, warden, look and a few native rooms
// that show up in drafts whatever deck you brought (that is how new cards are found).

const FLOORS = [
  { id: 'cellar', name: 'The Cellar', clock: 360, music: 'cellar', boss: 'gatejaw', elite: 'kslime',
    tint: null, void: '#0d0a1a', grid: '#1a1532', mark: '#2a2350', flame: 'sflame', glow: 'warm',
    natives: ['powder', 'ballista', 'maproom', 'dice', 'spring'],
    mix(t) { const m = t / 60, l = [['slime', 3]]; if (m >= 0.75) l.push(['bat', 1.3]); if (m >= 1.75) l.push(['bones', 1.6]); if (m >= 2.75) l.push(['spore', 1.0]); if (m >= 4.25) l.push(['tin', 0.7]); return l; },
    timeline: [{ t: 130, ev: 'breach' }, { t: 210, ev: 'elite' }, { t: 290, ev: 'breach' }],
    pests: { latch: [150, 60] } },
  { id: 'garden', name: 'The Undergarden', clock: 390, music: 'garden', boss: 'morel', elite: 'eshroom',
    tint: ['#2f9a6a', 0.24, 0.1], void: '#07130f', grid: '#12261e', mark: '#1e3a30', flame: 'gflame', glow: 'green',
    natives: ['apiary', 'fairy', 'bramble', 'icicle', 'counting', 'blizzard'],
    mix(t) { const m = t / 60, l = [['bslime', 3], ['moth', 1.2]]; if (m >= 1) l.push(['thorn', 1.3]); if (m >= 1.75) l.push(['flower', 0.7]); if (m >= 2.75) l.push(['beetle', 1.2]); if (m >= 3.75) l.push(['ghost', 0.8]); if (m >= 4.75) l.push(['spore', 0.8]); return l; },
    timeline: [{ t: 110, ev: 'breach' }, { t: 190, ev: 'elite' }, { t: 270, ev: 'breach' }, { t: 340, ev: 'elite' }],
    pests: { latch: [50, 55], sapper: [115, 75] } },
  { id: 'kiln', name: 'The Kiln', clock: 420, music: 'kiln', boss: 'unmaker', elite: 'golem',
    tint: ['#c0402a', 0.26, 0.1], void: '#160a0a', grid: '#2a1414', mark: '#402020', flame: 'sflame', glow: 'red',
    natives: ['furnace', 'saw', 'altar', 'grave', 'observ', 'glacier'],
    mix(t) { const m = t / 60, l = [['cinder', 3], ['bones', 1.3]]; if (m >= 0.6) l.push(['imp', 1.1]); if (m >= 1.5) l.push(['bomber', 0.9]); if (m >= 2.25) l.push(['tin', 1.0]); if (m >= 3.25) l.push(['wraith', 0.9]); return l; },
    timeline: [{ t: 100, ev: 'breach' }, { t: 170, ev: 'elite' }, { t: 250, ev: 'breach' }, { t: 320, ev: 'elite' }, { t: 380, ev: 'breach' }],
    pests: { latch: [40, 50], sapper: [85, 65], hexer: [130, 70] } },
];

// Every difficulty knob. f = floor index (0..2), m = minutes spent on this floor.
const CURVE = {
  rate: (f, m) => [0.5, 1.0, 1.5][f] + [0.36, 0.46, 0.6][f] * m + 0.02 * m * m,           // monsters per second before door pressure
  cap: (f, m) => Math.min(260, 26 + 30 * m + f * 20),                                     // max alive
  hp: (f, m) => [1, 2.5, 7.0][f] * (1 + 0.09 * m + 0.015 * m * m),                        // monster hp multiplier
  group: (f, m) => 1 + Math.min(5, Math.floor(m / 1.4) + f),                              // monsters per knock
  keyCost: n => Math.round(6 + 5 * n + 0.45 * n * n),                                     // glints for the n-th key
  room: (f, m) => [1, 2.0, 3.8][f] * (1 + 0.24 * m),                                      // room power (spikes, owls, embers...)
  door: [0.11, 0.15, 0.17],                                                               // what one sealed door adds to the knocking, per floor
  pressure: (doors, wedge, f) => 0.55 + CURVE.door[f || 0] * Math.min(14, doors) * (1 - 0.12 * wedge),   // the knocking: every sealed door is a place they come from
  stars: [0.85, 1.6, 2.6],                                                                // room power by star level: one star alone is a help, three do the work
  res: 0.4,                                                                               // +40% room power per resonating neighbour
  bossHp: (f, overstay) => (overstay ? 1.25 : 1),
  dread: 0.6,                                                                             // past 60% of the dread clock the knocking grows, up to this much more when it runs out
  fury: { after: 50, every: 20, step: 0.1, max: 8 },                                      // a warden's fight: seconds before its first step of fury, seconds per step, speed per step, most steps
  costKeep: 0.5,                                                                          // share of key-cost progress kept when you descend
};

// Stakes: a ladder for players who get through. A win at a step unlocks the next one for that delver. Each step
// adds one rule and keeps the ones before it. stake(n) asks whether step n's rule is in force in this run.
const STAKES = [
  'Wardens arrive enraged.',
  'Pests come from the first floor on, and sooner.',
  'More dice, and from the second minute on.',
  'Hearts drop half as often.',
  'Monsters are a fifth tougher.',
  'The dread clock runs a quarter faster.',
];
const stake = n => (G.stakes || 0) >= n;
// Dice in ordinary waves (#11). From a set minute on each floor a wave can bring a die, and from floor 2 on a loaded
// die: [the minute it starts, its weight in the floor's mix]. A die throws a ring of bullets to weave through.
// A warden fights without them: none join while it lives, and those a wave brought flee when it comes.
const DICE = [{ die: [5.0, 0.08] }, { die: [3.0, 0.15], bigdie: [5.0, 0.015] }, { die: [2.0, 0.2], bigdie: [4.0, 0.02] }];
// The house (#12): one monster per floor on the gambling motif. It first comes alone (`solo` seconds into the floor,
// with a banner that says what it does), and `after` seconds later it joins the floor's waves at weight `w`. A warden
// fights without it, as it does without the dice.
const HOUSE = [
  { id: 'dealer', solo: 180, after: 50, w: 0.2,  name: 'A DEALER SITS DOWN',   sub: 'Five cards in a fan. Step through a gap.' },
  { id: 'wheel',  solo: 150, after: 50, w: 0.2,  name: 'THE WHEEL SPINS',      sub: 'Its arm of balls comes round. Circle it.' },
  { id: 'slot',   solo: 120, after: 50, w: 0.3,  name: 'THE MACHINE PAYS OUT', sub: 'Read its three symbols, then back off.' },
];
// the monsters a wave draws from right now: the floor's mix and its dice; the third step of Stakes brings dice
// from the second minute, more of them, and into a warden's fight too
function floorMix() {
  const l = G.F.mix(G.t), m = G.t / 60, D = DICE[Math.min(G.floor, DICE.length - 1)], fight = G.dir.boss && !G.dir.bossDead;
  if (!fight) for (const id in D) if (m >= D[id][0]) l.push([id, D[id][1]]);
  const H = HOUSE[Math.min(G.floor, HOUSE.length - 1)]; if (!fight && G.dir.house !== undefined && G.t >= G.dir.house + H.after) l.push([H.id, H.w]);
  if (stake(3) && G.t >= 120) { const die = l.find(x => x[0] === 'die'); if (die) die[1] = Math.max(die[1], 0.45); else l.push(['die', 0.45]); }
  return l;
}

// Heroes: a starting weapon, a perk and a default deck (10 room cards). `sig` is unlocked with them.
// Perk knobs: rooms = room power multiplier, hearts = heart drop rate multiplier (other perks are in 40-actors.js).
const HEROES = {
  pip:  { name: 'Pip', title: 'Key Squire', weapon: 'keyblade', hp: 8, perk: 'Arrives on every floor with a spare key.',
    deck: ['hall', 'cross', 'ember', 'frost', 'spikes', 'guardian', 'fountain', 'garden', 'library', 'vault'] },
  wick: { name: 'Wick', title: 'Lamplighter', weapon: 'spark', hp: 8, rooms: 1.2, perk: 'Room powers are 20% stronger.', sig: 'chapel', how: 'Beat the warden of the Cellar.',
    deck: ['hall', 'nook', 'ember', 'chapel', 'fountain', 'guardian', 'library', 'vault', 'frost', 'garden'] },
  brin: { name: 'Brindle', title: 'Tinker', weapon: 'bomb', hp: 10, perk: 'Five hearts, but a slower dash.', sig: 'workshop', how: 'Beat the warden of the Undergarden.',
    deck: ['hall', 'cross', 'spikes', 'guardian', 'workshop', 'ember', 'vault', 'den', 'library', 'frost'] },
  moss: { name: 'Moss', title: 'Gardener', weapon: 'thorns', hp: 8, hearts: 2, perk: 'Hearts drop twice as often and mend double.', sig: 'greenhouse', how: 'Beat the Unmaker.',
    deck: ['hall', 'nook', 'garden', 'greenhouse', 'fountain', 'spikes', 'frost', 'library', 'den', 'cross'] },
};
for (const id in HEROES) HEROES[id].id = id;
const HERO_ORDER = ['pip', 'wick', 'brin', 'moss'];
// What beating each floor's warden unlocks (besides everything you drafted along the way).
const BOSS_UNLOCKS = [{ hero: 'wick', rooms: ['grand'] }, { hero: 'brin', rooms: ['script', 'well'] }, { hero: 'moss', rooms: ['waygate'] }];
