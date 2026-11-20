/* ============================ 8b CONTENT: rooms ======================= */
// A room card is: an element (for resonance), a power (see updateRooms in 42-director.js), a
// layout and a theme. Drafting a type you already own this run levels it up (max 3 stars).
//
// To add a room: an entry here, a THEMES entry, an `i_<id>` icon and, if it does something,
// a case in updateRooms / onRoomReady. Put it in a floor's `natives` (24-floors.js) or give it a
// tier so it can be collected:  's' starter - 1/2/3 found on that floor - 'b1'..'b3' boss reward
// - 'h' hero signature - 'x' never drafted.

const ELEMENTS = {
  stone:  { name: 'Stone',  col: '#b4bccb' },   // resonates with everything
  fire:   { name: 'Fire',   col: '#f6923a' },
  frost:  { name: 'Frost',  col: '#9cecf2' },
  steel:  { name: 'Steel',  col: '#d8c47e' },
  water:  { name: 'Water',  col: '#4c97e8' },
  lore:   { name: 'Lore',   col: '#e0a0e8' },
  wild:   { name: 'Wild',   col: '#78c860' },
  shadow: { name: 'Shadow', col: '#9a7ad6' },
};

// Layout letters (17x11 interior):
//  .  floor        #  pillar        ~  deep water    w  shallow pool   ^  spikes       %  brambles
//  P  boon pedestal   F fountain   S owl statue   B brazier   X crystal   C chest   M fruit patch
//  c  campfire   b bookshelf   o pot   n bones   D mimic lair   r barrel   v vent   i candle
//  L  ballista   s saw   W workbench   O well   m map desk   g coin desk   q book desk   T telescope
//  H  hive   h hedge   p planter   d die   A altar   G gravestone   Q portal   E stairs   j snow   k toadstool
const E_ = '.................';
const ringOf = (a, b, c) => [E_, E_, a, E_, E_, b, E_, E_, c, E_, E_];       // rows 2, 5, 8 filled in
const ROOM_TYPES = {
  /* ---- never drafted ---- */
  hearth: { name: 'The Hearth', el: 'stone', tier: 'x', col: '#e39b72', text: 'Where this floor begins.',
    layouts: [[E_, '.#.............#.', E_, E_, E_, '........c........', E_, E_, E_, '.#.............#.', E_]] },
  stairs: { name: 'The Stairwell', el: 'stone', tier: 'x', col: '#c8c8e0', dead: true, text: 'The way down. Its warden will not let you pass.',
    layouts: [ringOf('...#.........#...', '........E........', '...#.........#...')] },

  /* ---- stone: plain rooms that resonate with any neighbour ---- */
  hall: { name: 'Stone Hall', el: 'stone', tier: 's', w: 1.4, col: '#7f8db4', text: 'Honest flagstones. Resonates with any neighbour.', lv: ['', 'Counts as 1.5 neighbours.', 'Counts as 2 neighbours.'], layouts: [
    ringOf('...#.........#...', '........P........', '...#.........#...'),
    [E_, '..#...#...#...#..', E_, E_, E_, '........P........', E_, E_, E_, '..#...#...#...#..', E_],
    [E_, '.~~...........~~.', '.~~...........~~.', E_, E_, '........P........', E_, E_, '.~~...........~~.', '.~~...........~~.', E_],
    [E_, E_, E_, '.....#.....#.....', E_, '........P........', E_, '.....#.....#.....', E_, E_, E_]] },
  nook: { name: 'Quiet Nook', el: 'stone', tier: 's', col: '#c79a66', dead: true, text: 'A dead end. Stand still here to mend half a heart.', lv: ['', 'Rest comes sooner.', 'Rest comes much sooner.'],
    layouts: [[E_, '.oo...........oo.', '.o.............o.', E_, E_, '........P........', E_, E_, '.o.............o.', '.oo...........oo.', E_]] },
  cross: { name: 'Crossroads', el: 'stone', tier: 's', col: '#a89c90', exits: [1, 1, 1], text: 'Always three new doors. You run faster in here.', lv: ['', 'Faster still.', 'Fastest.'],
    layouts: [ringOf('....#.......#....', '........P........', '....#.......#....')] },
  grand: { name: 'Grand Hall', el: 'stone', tier: 'b1', col: '#a890c0', text: 'Fit for a king. Counts double for resonance.', lv: ['', 'Counts as 2.5 neighbours.', 'Counts triple.'],
    layouts: [ringOf('...#.........#...', '...#....P....#...', '...#.........#...')] },

  /* ---- fire ---- */
  ember: { name: 'Ember Hall', el: 'fire', tier: 's', col: '#e8703a', text: 'Monsters in this room burn.',
    layouts: [ringOf('....B.......B....', '........P........', '....B.......B....')] },
  powder: { name: 'Powder Store', el: 'fire', tier: 1, col: '#c8683a', text: 'Barrels blow up when monsters come near.',
    layouts: [ringOf('.....r.....r.....', '........P........', '.....r.....r.....')] },
  furnace: { name: 'Blast Furnace', el: 'fire', tier: 3, col: '#d04a30', text: 'Every few seconds the whole floor erupts.', lv: ['', 'Hotter blasts.', 'Hotter, faster blasts.'],
    layouts: [[E_, '...v....v....v...', E_, E_, E_, '...v....P....v...', E_, E_, E_, '...v....v....v...', E_]] },
  chapel: { name: 'Candle Chapel', el: 'fire', tier: 'h', col: '#e8b060', text: 'While you stand here, weapons recharge faster.', lv: ['', 'Faster still.', 'Fastest.'],
    layouts: [[E_, '..i...i...i...i..', E_, E_, E_, '........P........', E_, E_, E_, '..i...i...i...i..', E_]] },

  /* ---- frost ---- */
  frost: { name: 'Frost Grotto', el: 'frost', tier: 's', col: '#a8e0f4', text: 'Monsters in this room are slowed.',
    layouts: [ringOf('...X.........X...', '........P........', '...X.........X...')] },
  icicle: { name: 'Icicle Vault', el: 'frost', tier: 2, col: '#8cc8f0', text: 'Icicles drop on monsters and freeze them.', lv: ['', 'Sharper icicles.', 'Sharper, faster icicles.'],
    layouts: [[E_, '.j.............j.', E_, '....X.......X....', E_, '........P........', E_, '....X.......X....', E_, '.j.............j.', E_]] },
  glacier: { name: 'Glacier Gate', el: 'frost', tier: 3, col: '#70b0e8', text: 'Monsters freeze solid when they step in.', lv: ['', 'Frozen longer.', 'Frozen much longer.'],
    layouts: [['......X...X......', E_, E_, 'X...............X', E_, '........P........', E_, 'X...............X', E_, E_, '......X...X......']] },
  blizzard: { name: 'Blizzard Loft', el: 'frost', tier: 2, col: '#d0e0f4', text: 'Monsters in here take extra damage.', lv: ['', 'Even more damage.', 'Much more damage.'],
    layouts: [[E_, '.j....j...j....j.', E_, E_, '..j...........j..', '........P........', '..j...........j..', E_, E_, '.j....j...j....j.', E_]] },

  /* ---- steel: traps and turrets ---- */
  spikes: { name: 'Spike Gallery', el: 'steel', tier: 's', col: '#b06a86', text: 'Floor spikes skewer monsters that cross. You are safe.',
    layouts: [[E_, E_, '..^^^^^^^^^^^^^..', '..^...........^..', '..^...........^..', '..^.....P.....^..', '..^...........^..', '..^...........^..', '..^^^^^^^^^^^^^..', E_, E_]] },
  guardian: { name: 'Guardian Post', el: 'steel', tier: 's', col: '#d8c47e', text: 'Stone owls shoot monsters on sight.',
    layouts: [ringOf('...S.........#...', '........P........', '...#.........S...')] },
  ballista: { name: 'Ballista Hall', el: 'steel', tier: 1, col: '#b8a070', text: 'Fires heavy bolts down the rows of your dungeon.',
    layouts: [ringOf('..#...........#..', '........L...P....', '..#...........#..')] },
  saw: { name: 'Saw Run', el: 'steel', tier: 3, col: '#98a4b8', text: 'Saw blades patrol the floor. You are safe.',
    layouts: [ringOf('..s..............', '........P........', '..............s..')] },
  workshop: { name: 'Workshop', el: 'steel', tier: 'h', col: '#b08a58', text: 'Steel rooms on this floor work faster.', lv: ['', 'Faster still.', 'Fastest.'],
    layouts: [[E_, '.o.............o.', '....W.......W....', E_, E_, '........P........', E_, E_, E_, '.o.............o.', E_]] },

  /* ---- water: mending and safety ---- */
  fountain: { name: 'Fountain Court', el: 'water', tier: 's', col: '#8fd0d8', text: 'Stand by the water to mend a heart.', lv: ['', 'Refills faster.', 'Refills much faster.'],
    layouts: [ringOf('..#...........#..', '........F...P....', '..#...........#..')] },
  spring: { name: 'Hot Spring', el: 'water', tier: 1, col: '#78c8c0', text: 'Soak in the pool to grow shield hearts.', lv: ['', 'Holds two shields.', 'Holds three shields.'],
    layouts: [[E_, E_, E_, '.....wwwwwww.....', '.....wwwwwww.....', '.....wwwwwww..P..', '.....wwwwwww.....', '.....wwwwwww.....', E_, E_, E_]] },
  well: { name: 'Wishing Well', el: 'water', tier: 'b2', col: '#6a9ad8', text: 'Once per floor, wake here instead of dying.', lv: ['', 'Wake with three hearts.', 'Wake with four hearts.'],
    layouts: [[E_, '.#.............#.', E_, E_, E_, '........O...P....', E_, E_, E_, '.#.............#.', E_]] },

  /* ---- lore: glints, keys and information ---- */
  library: { name: 'Dusty Library', el: 'lore', tier: 's', col: '#b0704c', text: 'Glints are worth 12% more. Stacks.',
    layouts: [['bbbbbb.....bbbbbb', E_, E_, E_, E_, '........P........', E_, E_, E_, '.o.............o.', E_]] },
  vault: { name: 'Old Vault', el: 'lore', tier: 's', col: '#9a7ad0', text: 'A chest stuffed with glints.', lv: ['', 'A fatter chest.', 'The fattest chest.'],
    layouts: [[E_, '.#.............#.', E_, E_, E_, '.....C..P........', E_, E_, E_, '.#.............#.', E_]] },
  maproom: { name: 'Map Room', el: 'lore', tier: 1, col: '#c8a878', text: 'Drafts show one more card.', lv: ['', 'And one free reroll (R).', 'And two rerolls.'],
    layouts: [['bbb...........bbb', E_, E_, E_, E_, '....m...P........', E_, E_, E_, E_, E_]] },
  counting: { name: 'Counting House', el: 'lore', tier: 2, col: '#d8b050', text: 'Keys cost fewer glints.', lv: ['', 'Cheaper still.', 'Cheapest.'],
    layouts: [[E_, E_, '....g.......g....', E_, E_, '........P........', E_, E_, '.o.............o.', E_, E_]] },
  observ: { name: 'Observatory', el: 'lore', tier: 3, col: '#6a70c0', text: 'The dread clock on this floor runs slower.', lv: ['', 'Slower still.', 'Slowest.'],
    layouts: [[E_, '.#.............#.', E_, E_, E_, '....T...P........', E_, E_, E_, '.#.............#.', E_]] },
  script: { name: 'Scriptorium', el: 'lore', tier: 'b2', col: '#b06080', max: 1, text: 'Rooms drafted next to it grant their boon twice.',
    layouts: [['bbbbb.......bbbbb', E_, E_, E_, E_, '....q...P...q....', E_, E_, E_, E_, E_]] },

  /* ---- wild ---- */
  garden: { name: 'Moss Garden', el: 'wild', tier: 's', col: '#78c860', text: 'Grows a heart fruit now and then.', lv: ['', 'Grows faster.', 'Grows much faster.'],
    layouts: [[E_, '.~~...........~~.', '.~.............~.', E_, E_, '.....M..P........', E_, E_, '.~.............~.', '.~~...........~~.', E_]] },
  apiary: { name: 'Apiary', el: 'wild', tier: 2, col: '#d8c040', text: 'Guard bees sting monsters in this room.', lv: ['', '+1 bee.', '+1 bee.'],
    layouts: [ringOf('...H.........H...', '........P........', E_)] },
  fairy: { name: 'Fairy Ring', el: 'wild', tier: 2, col: '#68c088', text: 'Monsters slain here leave poison clouds.',
    layouts: [[E_, E_, '......k.k.k......', '....k.......k....', E_, '...k....P....k...', E_, '....k.......k....', '......k.k.k......', E_, E_]] },
  bramble: { name: 'Bramble Maze', el: 'wild', tier: 2, col: '#5a9a50', text: 'Hedges funnel monsters through brambles.',
    layouts: [[E_, E_, '..hhhhh%%%hhhhh..', E_, '...%.........%...', '...%....P....%...', '...%.........%...', E_, '..hhhhh%%%hhhhh..', E_, E_]] },
  greenhouse: { name: 'Greenhouse', el: 'wild', tier: 'h', col: '#90d0a0', text: 'Grows fat glint blooms.', lv: ['', 'Blooms faster.', 'Blooms much faster.'],
    layouts: [ringOf('...p.........p...', '........P........', '...p.........p...')] },

  /* ---- shadow: risk for reward ---- */
  den: { name: 'Monster Den', el: 'shadow', tier: 's', col: '#6e7a62', exits0: true, text: 'A Mimic guards the boon... and a KEY.', lv: ['', 'It guards two keys.', 'It guards three keys.'],
    layouts: [[E_, '.n.............n.', E_, E_, E_, '........D........', E_, E_, E_, '.n.............n.', E_]] },
  dice: { name: 'Dice Hall', el: 'shadow', tier: 1, col: '#c05068', max: 1, text: 'A mystery boon, granted twice.',
    layouts: [[E_, E_, E_, '....d.......d....', E_, '........P........', E_, '....d.......d....', E_, E_, E_]] },
  altar: { name: 'Cursed Altar', el: 'shadow', tier: 3, col: '#6a4a8a', text: 'Offer a heart at the altar for lasting power.', lv: ['', '+1 offering.', '+1 offering.'],
    layouts: [[E_, '.#.............#.', E_, '........A........', E_, '........P........', E_, E_, E_, '.#.............#.', E_]] },
  grave: { name: 'Graveyard', el: 'shadow', tier: 3, col: '#7a8a80', text: 'Skeletons rise here. Kills here drop double glints.', lv: ['', 'Triple glints.', 'Quadruple glints.'],
    layouts: [ringOf('...G.........G...', '........P........', '...G.........G...')] },
  waygate: { name: 'Waygate', el: 'shadow', tier: 'b3', col: '#8a6ad8', max: 1, text: "A portal to this floor's Hearth and back.",
    layouts: [[E_, '.#.............#.', E_, E_, E_, '........Q...P....', E_, E_, E_, '.#.............#.', E_]] },
};
for (const id in ROOM_TYPES) {
  const r = ROOM_TYPES[id]; r.id = id; r.w = r.w || 1; r.max = r.max || ROOM_MAX_LV; r.lv = r.lv || ['', 'Half again as strong.', 'Twice as strong.'];
  for (const lay of r.layouts) if (lay.length !== IH || lay.some(row => row.length !== IW)) console.warn('room ' + id + ': bad layout size');
}
const STARTER_ROOMS = Object.keys(ROOM_TYPES).filter(id => ROOM_TYPES[id].tier === 's');
const DRAFTABLE = Object.keys(ROOM_TYPES).filter(id => ROOM_TYPES[id].tier !== 'x');

// Floor / wall themes per room type. c = [base, light, dark, grout]
const THEMES = {
  hearth:   { style: 'cobble',  c: ['#c9a27a', '#e0bc92', '#b08a66', '#8a6a52'], wall: '#9c5f50' },
  stairs:   { style: 'slab2',   c: ['#5e5e74', '#74748e', '#4a4a5e', '#36364a'], wall: '#46465e' },
  hall:     { style: 'slab',    c: ['#7483a8', '#8e9cc0', '#62719a', '#4c5a84'], wall: '#525c96' },
  nook:     { style: 'plank',   c: ['#b98a5a', '#d2a470', '#a17447', '#7a5636'], wall: '#77699c' },
  cross:    { style: 'slab2',   c: ['#9a8f84', '#b3a89c', '#857a70', '#6a6058'], wall: '#6e6a7c' },
  grand:    { style: 'checker', c: ['#8a7a9a', '#a898b8', '#746488', '#5a4c70'], wall: '#7a5a8a' },
  ember:    { style: 'basalt',  c: ['#544858', '#685a6c', '#413848', '#2c2634'], wall: '#703c3a' },
  powder:   { style: 'plank',   c: ['#7a6248', '#927858', '#66503a', '#4c3a2a'], wall: '#6a4a3a' },
  furnace:  { style: 'basalt',  c: ['#5a4040', '#704e4e', '#463030', '#301f1f'], wall: '#8a3a2a' },
  chapel:   { style: 'checker', c: ['#c8a880', '#e0c49c', '#b0906a', '#8a6e50'], wall: '#8a5a6a' },
  frost:    { style: 'ice',     c: ['#bfe6f2', '#eefbff', '#9ccfe6', '#7ab2d2'], wall: '#5f86ba' },
  icicle:   { style: 'ice',     c: ['#a8d4ee', '#e0f4ff', '#88bce0', '#68a0cc'], wall: '#4f76b0' },
  glacier:  { style: 'ice',     c: ['#8cc4e8', '#c8ecff', '#6ca8d8', '#4c88c0'], wall: '#3f66a8' },
  blizzard: { style: 'slab',    c: ['#d0dcec', '#f0f6ff', '#b4c4dc', '#94a8c8'], wall: '#6a7ea8' },
  spikes:   { style: 'slab',    c: ['#6d5c76', '#84708c', '#5a4b64', '#443850'], wall: '#7c4058' },
  guardian: { style: 'slab2',   c: ['#cdb878', '#e6d394', '#b39d62', '#8c7a4c'], wall: '#9a8450' },
  ballista: { style: 'slab2',   c: ['#b8a878', '#d0c090', '#a09062', '#7e7048'], wall: '#7a7450' },
  saw:      { style: 'slab',    c: ['#8a94a4', '#a4aebc', '#747e90', '#5a6478'], wall: '#565e78' },
  workshop: { style: 'plank',   c: ['#a07850', '#b89066', '#88623e', '#684a2e'], wall: '#6a6478' },
  fountain: { style: 'checker', c: ['#a9cdd0', '#d6eeee', '#8ab6be', '#6a98a6'], wall: '#4a8494' },
  spring:   { style: 'checker', c: ['#98c8c0', '#c4e8e0', '#7cb0aa', '#5e9490'], wall: '#4a8a84' },
  well:     { style: 'cobble',  c: ['#8a9ab0', '#a4b4c8', '#74849c', '#5a6a84'], wall: '#4a5a8a' },
  library:  { style: 'plank',   c: ['#8f5f44', '#a87656', '#7a4e37', '#5a3828'], wall: '#6c4b60' },
  vault:    { style: 'checker', c: ['#7a5fa8', '#977bc4', '#63499a', '#4a367e'], wall: '#5a408c' },
  maproom:  { style: 'plank',   c: ['#9a7050', '#b28866', '#825a3e', '#62422c'], wall: '#5e5070' },
  counting: { style: 'checker', c: ['#b89a58', '#d4b870', '#9c8046', '#7a6234'], wall: '#6a5a40' },
  observ:   { style: 'slab',    c: ['#4a5080', '#5e6498', '#3c4270', '#2c3058'], wall: '#3a3a6a' },
  script:   { style: 'plank',   c: ['#8a5a4a', '#a4705e', '#72463a', '#56322a'], wall: '#6a4058' },
  garden:   { style: 'grass',   c: ['#6fbf5a', '#93dc70', '#58a64c', '#448a44'], wall: '#5c7e5a' },
  apiary:   { style: 'grass',   c: ['#a8c058', '#c4d870', '#90a848', '#789038'], wall: '#8a7a40' },
  fairy:    { style: 'grass',   c: ['#58a868', '#74c480', '#469058', '#347848'], wall: '#4a6e6a' },
  bramble:  { style: 'grass',   c: ['#5a9a50', '#74b464', '#488440', '#386c34'], wall: '#4a6a4a' },
  greenhouse: { style: 'checker', c: ['#a0c8a0', '#c4e4c0', '#84b088', '#689470'], wall: '#5a8a70' },
  den:      { style: 'slab',    c: ['#616c57', '#737f65', '#4f5948', '#3c4537'], wall: '#4b4b62' },
  dice:     { style: 'checker', c: ['#a04858', '#c06070', '#843a4a', '#662a3a'], wall: '#5a3050' },
  altar:    { style: 'slab',    c: ['#4a3a5a', '#5e4c70', '#3a2c4a', '#2a1e38'], wall: '#3a2a50' },
  grave:    { style: 'grass',   c: ['#6a7a70', '#7e8e86', '#586860', '#465650'], wall: '#4a4a5a' },
  waygate:  { style: 'slab',    c: ['#6a5a9a', '#8472b4', '#584a86', '#44386e'], wall: '#4a3a80' },
};
// Resolved (and floor-tinted) palettes, built on first use: themeFor('ember', floorIndex)
const _themeCache = {};
function themeFor(type, f) {
  const key = type + ':' + f; let t = _themeCache[key]; if (t) return t;
  const src = THEMES[type] || THEMES.hall, tint = FLOORS[f].tint;
  const tc = (c, amt) => tint ? mix(c, tint[0], amt) : c;
  const c = src.c.map(x => tc(x, tint ? tint[2] : 0)), w = tc(src.wall, tint ? tint[1] : 0);
  t = { style: src.style, c, k: c.map(c32), k4: c32(mix(c[0], c[1], 0.5)), k5: c32(mix(c[0], c[2], 0.55)),
    wk: { seam: c32(shade(w, 0.3)), top: c32(shade(w, 0.42)), lip: c32(shade(w, 0.66)), hi: c32(shade(w, 1.3)), hi2: c32(shade(w, 1.12)), mid: c32(w), lo: c32(shade(w, 0.8)), mortar: c32(shade(w, 0.5)), base: c32(shade(w, 0.62)) } };
  return _themeCache[key] = t;
}
