/* ========================== 8c CONTENT: monsters ====================== */
// spd px/s, r = combat radius, glint = xp value. Behaviour flags:
//   hop / fly / phase (walks through walls) / heavy (resists knockback) / split / burst (thorns on death)
//   siege: a floor's elite. It goes for the room you built up most and switches it off while it stands in it.
//   ai: 'shoot' (stop and fire) - 'turret' (rooted) - 'charge' - 'bomber' - 'ring' / 'brood' (elites)
//       'latch' (locks a doorway) - 'dig' (breaches a wall) - 'hex' (switches off the room it stands in)
//       'dice' (rolls, then throws a ring of bullets: n + roll * per of them; `twice` throws a second ring)
//       'cards' (a wind-up, then a fan of five cards) - 'wheel' (a rattle, then it turns in place: an arm of balls that
//       starts `lead` rad beside you and sweeps `turn` rad per ball toward you and past you; slow enough to walk ahead of)
//       'slot' (its reels roll, show three of a kind for `show` seconds, then it pays out the attack they name)
const MON = {
  /* floor 1: the Cellar */
  slime:   { spr: 'slime',   hp: 7,   spd: 30, r: 5,  dmg: 1, glint: 1,  col: PAL.n, sh: 'sh_s', hop: 1 },
  bat:     { spr: 'bat',     hp: 5,   spd: 54, r: 4,  dmg: 1, glint: 1,  col: PAL.P, sh: 'sh_s', fly: 1, lift: 6 },
  bones:   { spr: 'bones',   hp: 20,  spd: 34, r: 5,  dmg: 1, glint: 2,  col: PAL.w, sh: 'sh_s' },
  spore:   { spr: 'spore',   hp: 14,  spd: 26, r: 5,  dmg: 1, glint: 2,  col: PAL.r, sh: 'sh_s', ai: 'shoot', shot: { cd: [2.3, 3.3], sp: 62, range: 112, hold: 72, spr: 's_ebullet' } },
  tin:     { spr: 'tin',     hp: 60,  spd: 27, r: 6,  dmg: 2, glint: 6,  col: PAL.g, sh: 'sh_m', heavy: 1 },
  ghost:   { spr: 'ghost',   hp: 16,  spd: 23, r: 5,  dmg: 1, glint: 3,  col: PAL.c, sh: 'sh_s', phase: 1, lift: 3, alpha: 0.8 },
  /* floor 2: the Undergarden */
  bslime:  { spr: 'bslime',  hp: 24,  spd: 36, r: 5,  dmg: 1, glint: 2,  col: PAL.b, sh: 'sh_s', hop: 1 },
  moth:    { spr: 'moth',    hp: 9,   spd: 58, r: 4,  dmg: 1, glint: 2,  col: '#d9a04a', sh: 'sh_s', fly: 1, lift: 6 },
  thorn:   { spr: 'thorn',   hp: 34,  spd: 24, r: 5,  dmg: 1, glint: 3,  col: PAL.n, sh: 'sh_s', burst: 6 },
  flower:  { spr: 'flower',  hp: 22,  spd: 0,  r: 5,  dmg: 1, glint: 3,  col: PAL.p, sh: 'sh_s', ai: 'turret', shot: { cd: [2.2, 2.9], sp: 66, range: 170, fan: 3, spr: 's_spore' } },
  beetle:  { spr: 'beetle',  hp: 30,  spd: 30, r: 6,  dmg: 1, glint: 3,  col: PAL.b, sh: 'sh_m', ai: 'charge' },
  /* floor 3: the Kiln */
  cinder:  { spr: 'cinder',  hp: 18,  spd: 38, r: 5,  dmg: 1, glint: 3,  col: PAL.o, sh: 'sh_s', hop: 1, ember: 1 },
  imp:     { spr: 'imp',     hp: 20,  spd: 46, r: 5,  dmg: 1, glint: 4,  col: PAL.r, sh: 'sh_s', fly: 1, lift: 5, ai: 'shoot', shot: { cd: [1.8, 2.6], sp: 92, range: 135, hold: 80, spr: 's_fire' } },
  bomber:  { spr: 'bomber',  hp: 16,  spd: 62, r: 5,  dmg: 1, glint: 3,  col: PAL.K, sh: 'sh_s', ai: 'bomber' },
  wraith:  { spr: 'wraith',  hp: 28,  spd: 31, r: 5,  dmg: 1, glint: 4,  col: PAL.P, sh: 'sh_s', phase: 1, lift: 3, alpha: 0.8 },
  /* pests: they attack your floor plan, not you */
  latch:   { spr: 'latch',   hp: 16,  spd: 58, r: 5,  dmg: 1, glint: 2,  col: PAL.y, sh: 'sh_s', ai: 'latch', pest: 1 },
  sapper:  { spr: 'sapper',  hp: 36,  spd: 42, r: 5,  dmg: 1, glint: 4,  col: PAL.T, sh: 'sh_s', ai: 'dig', pest: 1 },
  hexer:   { spr: 'hexer',   hp: 34,  spd: 25, r: 5,  dmg: 1, glint: 5,  col: PAL.P, sh: 'sh_s', ai: 'hex', pest: 1, shot: { cd: [2.6, 3.4], sp: 70, range: 150, hold: 95, spr: 's_hexbolt' } },
  /* elites */
  kslime:  { spr: 'kslime',  hp: 170, spd: 27, r: 10, dmg: 2, glint: 30, col: PAL.n, sh: 'sh_l', hop: 1, heavy: 1, elite: 1, split: 4, crown: 1, siege: 1, name: 'King Slime' },
  eshroom: { spr: 'eshroom', hp: 300, spd: 22, r: 11, dmg: 2, glint: 35, col: PAL.r, sh: 'sh_l', heavy: 1, elite: 1, crown: 1, siege: 1, name: 'Elder Shroom', ai: 'brood', shot: { cd: [3, 4], sp: 60, range: 180, fan: 5, spr: 's_spore' } },
  golem:   { spr: 'golem',   hp: 420, spd: 24, r: 11, dmg: 2, glint: 40, col: PAL.g, sh: 'sh_l', heavy: 1, elite: 1, siege: 1, name: 'Furnace Golem', ai: 'ring' },
  mimic:   { spr: 'mimic',   hp: 150, spd: 46, r: 8,  dmg: 2, glint: 20, col: PAL.T, sh: 'sh_m', hop: 1, heavy: 1, elite: 1, mimic: 1 },
  /* the house (#12): one per floor, each with a bullet pattern that asks for a different move (HOUSE in 24-floors.js) */
  dealer:  { spr: 'dealer',  hp: 20,  spd: 28, r: 5,  dmg: 1, glint: 3,  col: PAL.n, sh: 'sh_s', ai: 'cards', shot: { cd: [3.2, 4.0], sp: 64, range: 130, hold: 84, tell: 0.5, fan: 5, spread: 0.3, spr: 's_card' } },
  wheel:   { spr: 'wheel',   hp: 44,  spd: 18, r: 7,  dmg: 1, glint: 4,  col: PAL.y, sh: 'sh_m', heavy: 1, ai: 'wheel', shot: { cd: [3.6, 4.4], sp: 58, range: 140, tell: 0.5, spin: 2.0, every: 0.135, turn: 0.125, lead: 1.0, spr: 's_ball' } },
  slot:    { spr: 'slot',    hp: 46,  spd: 16, r: 8,  dmg: 1, glint: 5,  col: PAL.r, sh: 'sh_m', heavy: 1, ai: 'slot', shot: { cd: [3.2, 4.0], range: 160, roll: 0.5, show: 0.7, ring: 14, fan: 5, bolts: 3 } },
  /* dice: they come with the later waves (DICE in 24-floors.js), and a knock back calls more of them (43-draft.js) */
  die:     { spr: 'die',     hp: 46,  spd: 30, r: 6,  dmg: 1, glint: 2,  col: PAL.w, sh: 'sh_m', hop: 1, ai: 'dice', shot: { cd: [2.3, 3.1], sp: 58, range: 210, n: 6, per: 2, spr: 's_ebullet' } },
  bigdie:  { spr: 'bigdie',  hp: 320, spd: 22, r: 11, dmg: 2, glint: 20, col: PAL.w, sh: 'sh_l', hop: 1, heavy: 1, elite: 1, split: 2, into: 'die', ai: 'dice', shot: { cd: [2.6, 3.2], sp: 54, range: 240, n: 10, per: 3, twice: 1, spr: 's_ebullet' } },
  /* wardens (one per floor) */
  gatejaw: { spr: 'boss',    hp: 950,  spd: 31, r: 16, dmg: 2, glint: 0, col: PAL.T, sh: 'sh_xl', boss: 1, heavy: 1, name: 'GATEJAW', sub: 'the hungry door' },
  morel:   { spr: 'morel',   hp: 4200, spd: 30, r: 16, dmg: 2, glint: 0, col: PAL.O, sh: 'sh_xl', boss: 1, heavy: 1, name: 'MOTHER MOREL', sub: 'she overgrows everything' },
  unmaker: { spr: 'unmaker', hp: 11000, spd: 34, r: 16, dmg: 2, glint: 0, col: PAL.g, sh: 'sh_xl', boss: 1, heavy: 1, phase: 1, lift: 8, name: 'THE UNMAKER', sub: 'what is built can be unbuilt' },
};
for (const id in MON) MON[id].id = id;
