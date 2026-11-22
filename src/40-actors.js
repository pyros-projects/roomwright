/* ============================== 10 ACTORS ============================= */
// G holds the whole run. newRun() sets up what persists between floors (the hero, weapons,
// charms, room levels, stats); enterFloor() rebuilds everything that belongs to one floor.
// The damage tally and the census need to know who did it. BY is whoever deals damage to monsters right now:
// 'w:<weapon>', 'r:<room type>', 'c:<charm>' or 'm:<monster>'. Shots, zones, patches and burns remember the BY that
// made them. EBY is the monster that is acting, so its bullets and clouds can be named when they hit the delver.
let BY = null, EBY = null;
function newRun(seed, opts = {}) {
  rand = RNG(seed);
  const hero = HEROES[opts.hero] || HEROES.pip;
  let deck = (opts.deck || hero.deck).filter(id => ROOM_TYPES[id] && ROOM_TYPES[id].tier !== 'x');
  if (deck.length < 3) deck = hero.deck.slice();
  G = {
    seed, hero: hero.id, deck, stakes: clamp(opts.stakes | 0, 0, STAKES.length), floor: 0, F: FLOORS[0], t: 0, tRun: 0, nextId: 1,
    rooms: [], cells: new Array(GRID * GRID).fill(null), sealed: [], jams: [],
    flags: new Uint8Array(GWT * GHT).fill(F_ALL), tag: new Uint8Array(GWT * GHT), tagRoom: new Uint16Array(GWT * GHT),
    distG: new Uint16Array(GWT * GHT).fill(65535), nextG: new Int32Array(GWT * GHT), distF: new Uint16Array(GWT * GHT).fill(65535), nextF: new Int32Array(GWT * GHT), flowTile: -1, flowT: -9,
    P: null, mons: [], shots: [], ebullets: [], picks: [], boons: [], patches: [], zones: [], allies: [], mats: [], parts: [], texts: [], fxs: [],
    cam: { x: 0, y: 0 }, shake: 0, freeze: 0, banner: null, flashT: 0, curRoom: null, roomLabel: null, tipQ: [], tipT: 0, tipText: '',
    dir: null, fstat: null, stats: { kills: 0, rooms: 0, keys: 0, dmg: 0, hurt: 0, elites: 0, evos: 0, floors: 0 },
    tally: {}, hits: [],              // damage dealt per source (see BY), and the last three hits the delver took
    combo: 0, comboT: 0, roomLv: {}, owned: {}, newCards: [], newHeroes: [],
    tut: { step: opts.tutorial ? 0 : 9, moved: 0, t: 0 }, over: false, won: false, endless: false, endT: 0, draft: null,
    stairs: null, bossDown: false, leaving: 0, hearthPortal: null,
  };
  G.P = { x: 0, y: 0, r: 4.5, face: 2, aim: Math.PI / 2, moving: false, anim: 0, hp: hero.hp, maxHp: hero.hp, shield: 0, inv: 0,
    dashT: 0, dashCd: 0, dashX: 0, dashY: 1, dashMax: 1.3, weapons: [], charms: {}, keys: 0, glints: 0, forged: 0, costN: 0, keyCost: CURVE.keyCost(0),
    might: 1, haste: 1, area: 1, magnet: 28, speed: 74, extra: 0, greed: 1, sealPow: 1, crit: 0, dodge: 0, invBonus: 0, mightEff: 1, hasteEff: 1, speedEff: 74,
    pose: 0, poseBoon: null, poseEvo: false, hurtT: 0, pushDoor: null, pushJam: null, keyPop: 0, noKeyT: -9, altar: 0, thresholdT: 0, restT: 0, soakT: 0, onPortal: false, stillT: 0 };
  addWeapon(hero.weapon);
  enterFloor(0);
  return G;
}
function enterFloor(f) {
  const P = G.P;
  G.floor = f; G.F = FLOORS[f]; G.t = 0;
  G.rooms = []; G.cells.fill(null); G.sealed = []; G.jams = []; G.flags.fill(F_ALL); G.tag.fill(0); G.tagRoom.fill(0); G.distG.fill(65535); G.distF.fill(65535); G.flowTile = -1; G.flowT = -9;
  G.mons = []; G.shots = []; G.ebullets = []; G.picks = []; G.boons = []; G.patches = []; G.zones = []; G.allies = []; G.mats = []; G.parts = []; G.texts = []; G.fxs = [];
  G.dir = { acc: 0, ti: 0, boss: null, bossDead: false, calm: f === 0 ? 7 : 5, pestT: {}, stairsBuilt: false, overstay: false, warned: false };
  G.fstat = { rooms: 0, t0: G.tRun, kills0: G.stats.kills, swift: 0, knocks: 0, wrath: 0 };   // knocks, wrath: see knockBack
  G.stairs = null; G.bossDown = false; G.leaving = 0; G.hearthPortal = null; G.draft = null; G.won = false; G.banner = null; G.shake = 0;
  const c = (GRID - 1) >> 1, hearth = buildRoom(c, c, 'hearth', [1, 1, 1, 1]); hearth.seen = true; G.curRoom = hearth;
  refreshSealed(); recalcLinks();
  P.x = hearth.px + CWP / 2; P.y = hearth.py + CHP / 2 + 30; P.face = 2; P.dashT = 0; P.pose = 0; P.inv = Math.max(P.inv, 1); P.onPortal = false;
  P.keys += 1 + (G.hero === 'pip' ? 1 : 0);
  for (const w of P.weapons) { w.orbs.length = 0; w.pend.length = 0; w.cd = 0.5; w.pets.length = 0; }
  recalc(); computeFlow(true);
  G.cam.x = P.x - VW / 2; G.cam.y = P.y - 8 - VH / 2;
}
function addWeapon(id) { G.P.weapons.push({ id, lv: 1, evo: false, cd: 0.5, ang: 0, pend: [], orbs: [], pets: [], pulse: 0, shT: 0, shootT: 0 }); }
const wStat = w => WEAPONS[w.id].S[w.evo ? 5 : w.lv - 1];
const charm = id => G.P.charms[id] || 0;
// power multiplier of one room: stars x resonance (x hero perk). Damage rooms also scale with roomPow().
const roomMul = room => CURVE.stars[roomLevel(room.type) - 1] * (1 + (CURVE.res + 0.1 * charm('trowel')) * room.res) * (HEROES[G.hero].rooms || 1);
const roomLive = room => room && room.reveal >= 1 && room.hexT <= 0;
function keyCostNow() {
  let c = CURVE.keyCost(G.P.costN) * Math.pow(0.94, charm('keyring'));
  if (G.rooms.some(r => r.type === 'counting' && roomLive(r))) c *= 1 - [0.08, 0.12, 0.16][roomLevel('counting') - 1];
  return Math.max(4, Math.round(c));
}
function recalc() {
  const P = G.P, hero = HEROES[G.hero];
  P.might = 1 + 0.14 * charm('might'); P.haste = Math.pow(0.92, charm('haste')); P.area = 1 + 0.13 * charm('reach');
  P.magnet = 28 * (1 + 0.35 * charm('magnet')); P.speed = 74 * (1 + 0.09 * charm('boots')); P.extra = charm('twin');
  let lib = 0; for (const r of G.rooms) if (r.type === 'library' && roomLive(r)) lib += 0.12 * roomMul(r);
  P.greed = (1 + 0.15 * charm('pouch')) * (1 + lib); P.sealPow = 1 + 0.4 * charm('seal');
  P.maxHp = hero.hp + 2 * charm('heart'); P.hp = Math.min(P.hp, P.maxHp);
  P.dashMax = 1.3 * Math.pow(0.85, charm('soles')) * (G.hero === 'brin' ? 1.35 : 1);
  P.crit = 0.1 * charm('keen'); P.dodge = 0.08 * charm('clover'); P.invBonus = 0.5 * charm('wind');
  P.keyCost = keyCostNow();
}
// per-frame effective stats: charms and rooms that depend on where you are and what you just did
function updateBuffs(dt) {
  const P = G.P, room = G.curRoom, live = roomLive(room);
  let m = P.might * (1 + 0.02 * charm('pride') * G.rooms.length) * (1 + 0.08 * P.altar), h = P.haste, s = P.speed;
  if (P.thresholdT > 0) { P.thresholdT -= dt; m *= 1 + 0.2 * charm('threshold'); }
  if (live && room.type === 'chapel') h /= 1 + 0.2 * roomMul(room);
  if (live && room.type === 'cross') s *= 1 + 0.15 * roomMul(room);
  P.mightEff = m; P.hasteEff = h; P.speedEff = s;
}
// The damage tally as a list, largest first: what did the work in this run. kind: w(eapon), r(oom), c(harm), x (the rest).
function tallyList() {
  const total = G.stats.dmg || 1, out = [];
  for (const key in G.tally) {
    const kind = key[0], id = key.slice(2), dmg = G.tally[key]; let name = 'other', icon = null;
    if (kind === 'w' && WEAPONS[id]) { const w = G.P.weapons.find(w => w.id === id); name = w ? weaponName(w) : WEAPONS[id].name; icon = w ? weaponIcon(w) : SPR['i_' + id]; }
    else if (kind === 'r' && ROOM_TYPES[id]) { name = ROOM_TYPES[id].name; icon = SPR['i_' + id]; }
    else if (kind === 'c' && CHARMS[id]) { name = CHARMS[id].name; icon = SPR['i_' + id]; }
    else if (key === 'x:burn') name = 'burning';
    out.push({ key, kind: icon ? kind : 'x', name, icon, dmg, share: dmg / total });
  }
  return out.sort((a, b) => b.dmg - a.dmg);
}
const tallyShare = kind => { let n = 0; for (const k in G.tally) if (k[0] === kind) n += G.tally[k]; return n / (G.stats.dmg || 1); };
function banner(text, sub, col, dur) { G.banner = { text, sub: sub || '', col: col || '#fff8e8', t: 0, d: dur || 2 }; }
function floatText(x, y, s, col) { G.texts.push({ x, y, s, col: col || '#fff8e8', t: 0, d: 1.2 }); }
// one-time coaching tips (remembered in the save, shown in the hint bar)
function tip(id, text) { const seen = Save.data.tips; if (G.demo || seen[id]) return; seen[id] = 1; Save.store(); G.tipQ.push(text); }
function part(x, y, vx, vy, life, col, size, grav) { if (G.parts.length < 560) G.parts.push({ x, y, vx, vy, life, max: life, col, size: size || 1, grav: grav || 0 }); }
// A flash of the whole screen. No two start within a third of a second of each other, so the screen cannot flash more
// than three times a second, whatever happens in it (#14).
function flashScreen(d) { if (G.tRun - (G.flashAt === undefined ? -9 : G.flashAt) < 0.34) return; G.flashAt = G.tRun; G.flashT = d; }
// The beat of a big kill: a ring, a low boom and a shake. Small kills get none of it, so the big ones stand out (#14).
// It does not hold the game: a held frame would swallow a dash pressed in it.
function bigKill(x, y, R) { G.fxs.push({ k: 'tide', x, y, R, t: 0, d: 0.3 + R / 180, hot: 1 }); sfx('boom'); G.shake = Math.max(G.shake, 6); }
function burst(x, y, n, col, sp = 60) { for (let i = 0; i < n; i++) { const a = fxr() * TAU, s = sp * (0.3 + fxr() * 0.7); part(x, y, Math.cos(a) * s, Math.sin(a) * s - 20, 0.25 + fxr() * 0.3, col, fxr() < 0.4 ? 2 : 1, 160); } }
function sparkle(x, y, n, col) { for (let i = 0; i < n; i++) { const a = fxr() * TAU, s = 10 + fxr() * 30; part(x + Math.cos(a) * 6, y + Math.sin(a) * 6, Math.cos(a) * s, Math.sin(a) * s - 12, 0.4 + fxr() * 0.5, col, 1, -10); } }

// ---- boons (what a room card grants) ----
const boonDef = b => b.kind === 'w' ? WEAPONS[b.id] : b.kind === 'c' ? CHARMS[b.id] : MISC[b.id];
const boonName = b => boonDef(b).name;
const boonIcon = b => SPR['i_' + b.id];
const weaponIcon = w => SPR['i_' + w.id + (w.evo ? '_evo' : '')];
const weaponName = w => w.evo ? WEAPONS[w.id].evo.name : WEAPONS[w.id].name;
function boonLv(b) { const P = G.P; if (b.kind === 'w') { const w = P.weapons.find(w => w.id === b.id); return w ? w.lv : 0; } return b.kind === 'c' ? (P.charms[b.id] || 0) : 0; }
function boonTag(b) { if (b.kind === 'm') return 'TREAT'; const lv = boonLv(b); return lv === 0 ? 'NEW!' : 'Lv ' + lv + ' > ' + (lv + 1); }
function boonDesc(b) { if (b.kind === 'w') { const lv = boonLv(b); return lv === 0 ? WEAPONS[b.id].desc : WEAPONS[b.id].up[Math.min(lv, WEAPONS[b.id].max - 1)]; } return boonDef(b).desc; }
function boonValid(b) {
  if (b.kind === 'w') { const lv = boonLv(b); return lv === 0 ? G.P.weapons.length < MAX_WEAPONS : lv < WEAPONS[b.id].max; }
  return b.kind === 'c' ? boonLv(b) < CHARMS[b.id].max : true;
}
// Can this weapon still evolve in this run? 2 = its room is in the deck, already built, or native to a later floor;
// 1 = only native to this floor (build it before you leave); 0 = no. Drafts lean toward weapons that can.
function evoReach(id) {
  const room = WEAPONS[id].evo.room;
  if (G.deck.indexOf(room) >= 0 || G.rooms.some(r => r.type === room)) return 2;
  for (let f = G.floor + 1; f < FLOORS.length; f++) if (FLOORS[f].natives.indexOf(room) >= 0) return 2;
  return G.F.natives.indexOf(room) >= 0 ? 1 : 0;
}
const REACH_W = [0.17, 0.4, 0.55];
function rollBoon(exclude, wantNewWeapon) {
  const P = G.P; let pool = [];
  for (const id in WEAPONS) { const b = { kind: 'w', id }; if (!exclude.has('w' + id) && boonValid(b)) pool.push({ b, w: boonLv(b) ? 9 : (P.weapons.length < 2 ? 6 : 3) * REACH_W[evoReach(id)] }); }
  for (const id in CHARMS) { const b = { kind: 'c', id }; if (!exclude.has('c' + id) && boonValid(b)) pool.push({ b, w: CHARMS[id].w * (boonLv(b) ? 1.4 : 1) * (id === 'heart' && P.hp <= P.maxHp / 2 ? 1.7 : 1) }); }
  if (wantNewWeapon) { const nw = pool.filter(p => p.b.kind === 'w' && !boonLv(p.b)); if (nw.length) pool = nw; }
  if (!pool.length) return { kind: 'm', id: exclude.has('mfeast') ? 'cache' : 'feast' };
  return wpick(pool, p => p.w).b;
}
function applyBoon(b) {
  const P = G.P;
  if (!boonValid(b)) b = { kind: 'm', id: 'cache' };
  if (b.kind === 'w') { const w = P.weapons.find(w => w.id === b.id); if (w) w.lv++; else addWeapon(b.id); }
  else if (b.kind === 'c') { P.charms[b.id] = (P.charms[b.id] || 0) + 1; recalc(); if (b.id === 'heart') P.hp = Math.min(P.maxHp, P.hp + 4); }
  else if (b.id === 'feast') heal(4);
  else gainGlints(P.keyCost * 0.6, true);
  return b;
}
function takeBoon(bp) {
  const P = G.P, text = boonDesc(bp.boon), mul = bp.mul || 1, got = applyBoon(bp.boon);
  for (let i = 1; i < mul; i++) applyBoon(bp.boon);                    // doubled boons (Dice Hall, Scriptorium)
  const lv = boonLv(got);
  P.pose = 0.95; P.poseBoon = got; P.poseEvo = false; P.face = 2; G.freeze = 0.8; sfx('boon'); sparkle(P.x, P.y - 22, 16, PAL.y);
  banner(boonName(got) + (lv > 1 ? '  Lv ' + lv : '') + (mul > 1 ? '  x' + mul : ''), got === bp.boon ? text : boonDesc(got), '#ffd95e', 2.2);
  if (G.tut.step === 3) { G.tut.step = 4; G.tut.t = 0; }
  if (got.kind === 'w' && lv >= WEAPONS[got.id].max) { const e = WEAPONS[got.id].evo; tip('evo', WEAPONS[got.id].name + ' is maxed. Stand in a ' + ROOM_TYPES[e.room].name + ' to evolve it.'); }
}
function gainGlints(v, raw) {
  const P = G.P; P.glints += raw ? v : v * P.greed;
  while (P.glints >= P.keyCost) {
    P.glints -= P.keyCost; P.keys++; P.forged++; P.costN++; G.stats.keys++; P.keyCost = keyCostNow(); P.keyPop = 1.4;
    sfx('key'); floatText(P.x, P.y - 26, 'KEY FORGED!', '#ffd95e'); sparkle(P.x, P.y - 10, 14, PAL.y);
  }
}
function heal(n) {
  const P = G.P, before = P.hp; P.hp = Math.min(P.maxHp, P.hp + n);
  if (P.hp > before) { sfx('heal'); for (let i = 0; i < 8; i++) part(P.x + (fxr() - 0.5) * 14, P.y - 4 - fxr() * 10, 0, -22 - fxr() * 20, 0.6 + fxr() * 0.4, i & 1 ? PAL.p : PAL.l, 1); }
  return P.hp > before;
}
function addShield(max) { const P = G.P; if (P.shield >= max) return false; P.shield++; sfx('shield'); sparkle(P.x, P.y - 10, 10, PAL.b); floatText(P.x, P.y - 24, '+shield', '#9cecf2'); return true; }
// src = the monster that touched you, if any (for the Thorned Vest); cause = what to call it in the census when
// it was not a touch (a bullet's or a cloud's owner); how = 'bullet' for a bullet (else a touch, or something else)
function hurtPlayer(dmg, src, cause, how) {
  const P = G.P; if (P.inv > 0 || G.over || G.won || G.freeze > 0 || G.leaving > 0) return false;
  if (P.dodge > 0 && rand() < P.dodge) { P.inv = 0.5; floatText(P.x, P.y - 24, 'Lucky!', '#b5e85a'); sfx('shield'); return false; }
  if (src && charm('vest')) { const was = BY; BY = 'c:vest'; hurtMon(src, 12 * charm('vest') * P.mightEff, 0, 0, 0, 'room'); BY = was; }
  G.hits.push({ by: cause || (src && src.type) || 'unknown', how: how || (src ? 'touch' : 'other'), floor: G.floor, t: Math.round(G.t) }); if (G.hits.length > 3) G.hits.shift();
  P.inv = 1.0 + P.invBonus; P.hurtT = 0.35; G.shake = Math.max(G.shake, 5); flashScreen(0.3); sfx('hurt');
  if (P.shield > 0) { P.shield--; burst(P.x, P.y - 6, 8, PAL.b); return true; }
  P.hp -= dmg; G.stats.hurt += dmg; burst(P.x, P.y - 6, 8, PAL.r);
  if (P.hp <= 0) {
    const well = G.rooms.find(r => r.type === 'well' && !r.used && roomLive(r));
    if (well) {                       // the Wishing Well: once per floor, wake up beside it
      well.used = true; well.well.spr = 'well_dry'; P.hp = Math.min(P.maxHp, [4, 6, 8][roomLevel('well') - 1]); P.x = well.well.x; P.y = well.well.y + 12; P.inv = 2.5; P.dashT = 0;
      computeFlow(true); G.cam.x = P.x - VW / 2; G.cam.y = P.y - 8 - VH / 2; sfx('revive'); sparkle(P.x, P.y - 8, 24, PAL.c);
      banner('THE WELL REMEMBERS YOU', 'It will not do that again on this floor.', '#9cecf2', 3.2);
      return true;
    }
    P.hp = 0; G.over = true; G.endT = 0; Snd.music(null); sfx('lose'); burst(P.x, P.y - 6, 20, PAL.h, 90);
  }
  return true;
}

// ---- player ----
function updatePlayer(dt) {
  const P = G.P, ax = Input.axis(P.x - G.cam.x, P.y - 8 - G.cam.y);   // the camera centres on this point of the delver
  let mx = ax.x, my = ax.y;
  if (P.pose > 0) { P.pose -= dt; mx = my = 0; }
  if (G.leaving > 0) mx = my = 0;
  const len = Math.hypot(mx, my);
  P.moving = len > 0.15;
  if (P.moving) {
    P.aim = Math.atan2(my, mx); P.stillT = 0;
    if (Math.abs(mx) > Math.abs(my) * 1.15) P.face = mx > 0 ? 1 : 3; else if (Math.abs(my) > Math.abs(mx) * 1.15) P.face = my > 0 ? 2 : 0;
    P.anim += dt; G.tut.moved += dt;
  } else { P.anim = 0; P.stillT += dt; }
  P.dashCd -= dt; P.inv -= dt; P.hurtT -= dt; P.keyPop -= dt;
  if (Input.hit('dash') && P.dashCd <= 0 && P.pose <= 0 && G.leaving <= 0) {
    const a = P.moving ? P.aim : [-Math.PI / 2, 0, Math.PI / 2, Math.PI][P.face];
    P.dashT = 0.2; P.dashCd = P.dashMax; P.dashX = Math.cos(a); P.dashY = Math.sin(a); P.inv = Math.max(P.inv, 0.3); sfx('dash');
    if (P.charms.snuffer) { const B = G.ebullets, R = 22 + 16 * P.charms.snuffer; for (let i = B.length - 1; i >= 0; i--) if (Math.hypot(B[i].x - P.x, B[i].y - (P.y - 4)) < R) { sparkle(B[i].x, B[i].y, 3, PAL.y); B[i] = B[B.length - 1]; B.pop(); } }
    for (let i = 0; i < 6; i++) part(P.x, P.y, -P.dashX * (20 + fxr() * 40) + (fxr() - 0.5) * 30, -P.dashY * (20 + fxr() * 40) + (fxr() - 0.5) * 30, 0.3, PAL.W, 2);
    if (G.tut.step === 5) G.tut.step = 9;
  }
  let vx = mx * P.speedEff, vy = my * P.speedEff;
  if (P.dashT > 0) { P.dashT -= dt; vx = P.dashX * P.speedEff * 3.2; vy = P.dashY * P.speedEff * 3.2; part(P.x, P.y - 6, 0, 0, 0.18, PAL.i, 2); }
  // (if a gate latches around you, you may still walk out of it)
  const mask = boxHits(P.x, P.y, P.r, F_PLAYER) ? F_WALK : PMASK;
  const hit = moveBox(P, vx * dt, vy * dt, mask);
  // corner assist: when walking straight into the lip of a doorway or a lone obstacle, slide around it
  if (hit === 1 && Math.abs(my) < 0.3) cornerSlide(P, 0, Math.sign(vx), P.speedEff * dt, mask);
  else if (hit === 2 && Math.abs(mx) < 0.3) cornerSlide(P, 1, Math.sign(vy), P.speedEff * dt, mask);

  // doors: push a key into a sealed door to draft the room behind it
  let pushing = null;
  for (const d of G.sealed) {
    const rx = P.x - (d.x + d.nx * 16), ry = P.y - (d.y + d.ny * 16), along = rx * d.nx + ry * d.ny, lat = Math.abs(rx * -d.ny + ry * d.nx);
    d.near = along > -2 && along < 40 && lat < 40;
    if (along > -2 && along < P.r + 3.5 && lat < 21 && (mx * -d.nx + my * -d.ny) > 0.35 && P.dashT <= 0 && d.room.reveal >= 1) pushing = d;
  }
  for (const d of G.sealed) if (d !== pushing) { d.push = Math.max(0, d.push - dt * 2); d.hold = false; }
  P.pushDoor = pushing;
  if (pushing && !pushing.hold) {
    if (P.keys > 0) { pushing.push += dt; if (pushing.push >= 0.3) { pushing.push = 0; openDraft(pushing); return; } }
    else if (G.t - P.noKeyT > 1.6) { P.noKeyT = G.t; sfx('nokey'); floatText(P.x, P.y - 24, 'Need a key!', '#ff9ec4'); }
  }
  // latched gates: lean on one to shove it open (no key needed)
  let pj = null;
  for (const j of G.jams) for (let side = 0; side < 2; side++) {
    const p = doorPos(side ? j.b : j.a, side ? (j.dir + 2) % 4 : j.dir);
    const rx = P.x - (p.x + p.nx * 16), ry = P.y - (p.y + p.ny * 16), along = rx * p.nx + ry * p.ny, lat = Math.abs(rx * -p.ny + ry * p.nx);
    if (along > -2 && along < P.r + 3.5 && lat < 21 && (mx * -p.nx + my * -p.ny) > 0.35) pj = j;
  }
  for (const j of G.jams) if (j !== pj) j.push = Math.max(0, j.push - dt);
  P.pushJam = pj;
  if (pj) { pj.push += dt; if (pj.push >= 0.7) { burst(pj.x, pj.y, 12, PAL.g, 80); sfx('unjam'); G.shake = Math.max(G.shake, 2); unjam(pj); } }

  // room tracking
  const room = roomAt(P.x, P.y);
  if (room && room !== G.curRoom) {
    const prev = G.curRoom; G.curRoom = room;
    if (!room.seen) { room.seen = true; G.roomLabel = { text: room.def.name, t: 0 }; }
    if (charm('threshold')) P.thresholdT = 2;
    if (prev) for (let d = 0; d < 4; d++) if (nbOf(prev, d) === room) { const p = doorPos(prev, d); onDoorway(p.x + DIRS[d].x * 16, p.y + DIRS[d].y * 16); }
  }
  // boons on pedestals
  for (let i = G.boons.length - 1; i >= 0; i--) { const b = G.boons[i]; b.t += dt; if (b.t > 0.35 && Math.abs(P.x - b.x) < 14 && Math.abs(P.y - b.y) < 14) { G.boons.splice(i, 1); takeBoon(b); } }
  // waygates: step onto one to hop between it and the Hearth
  if (G.hearthPortal) {
    let on = null; const gates = G.rooms.filter(r => r.portal && roomLive(r)).map(r => r.portal), all = [G.hearthPortal].concat(gates);
    for (const pt of all) if (Math.abs(P.x - pt.x) < 9 && Math.abs(P.y - pt.y) < 7) on = pt;
    if (on && !P.onPortal && gates.length) {
      const to = on === G.hearthPortal ? gates[(G.warpN = (G.warpN || 0) + 1) % gates.length] : G.hearthPortal;
      sparkle(P.x, P.y - 8, 14, PAL.P); P.x = to.x; P.y = to.y; sparkle(P.x, P.y - 8, 14, PAL.c); sfx('warp'); computeFlow(true);
      G.cam.x = P.x - VW / 2; G.cam.y = P.y - 8 - VH / 2; G.curRoom = roomAt(P.x, P.y); on = to;
    }
    P.onPortal = !!on;
  }
  // the way down
  const st = G.stairs;
  if (st && st.open && Math.abs(P.x - st.x) < 13 && Math.abs(P.y - st.y) < 11 && !G.over) { G.leaving += dt; if (G.leaving > 0.6) beginDescent(); }
  else if (G.leaving > 0 && G.leaving <= 0.6) G.leaving = 0;
}
function cornerSlide(P, axis, s, step, mask) {
  if (!s) return;
  for (let off = 1; off <= 13; off++) for (const sg of [-1, 1]) {
    const tx = P.x + (axis ? off * sg : s * 2), ty = P.y + (axis ? s * 2 : off * sg);
    if (!boxHits(tx, ty, P.r, mask)) { if (axis) moveBox(P, sg * Math.min(step, off), 0, mask); else moveBox(P, 0, sg * Math.min(step, off), mask); return; }
  }
}

// ---- monsters ----
function spawnMon(type, x, y, hpMul) {
  const def = MON[type];
  const e = { def, type, id: G.nextId++, x, y, r: def.r, fr: Math.min(def.r, 5.5), hp: 1, max: 1, kx: 0, ky: 0, flash: 0, anim: rr(0, 3), wob: rr(0, TAU), face: 1,
    emerge: 0, evx: 0, evy: 0, slow: 0, slowT: 0, stun: 0, burnT: 0, burn: 0, burnTick: 0, chill: 0, mark: 0, markT: 0, dead: false, moonT: -9, gl: -1,
    shootT: def.shot ? rr(def.shot.cd[0], def.shot.cd[1]) : 0, st: 0, stT: 0, cx: 0, cy: 0, goal: null, life: 0, boon: null, keys: 1 };
  e.max = e.hp = Math.max(1, Math.round(def.hp * (def.boss ? 1 : CURVE.hp(G.floor, G.t / 60)) * (hpMul || 1) * (stake(5) ? 1.2 : 1)));
  G.mons.push(e); return e;
}
const HC = 32, HW = Math.ceil(GWT * T / HC), HH = Math.ceil(GHT * T / HC);
const hashCells = []; for (let i = 0; i < HW * HH; i++) hashCells.push([]);
const hashUsed = [];
function rebuildHash() {
  for (const i of hashUsed) hashCells[i].length = 0; hashUsed.length = 0;
  for (const e of G.mons) {
    if (e.dead) continue;
    const hx = Math.floor(e.x / HC), hy = Math.floor(e.y / HC); if (hx < 0 || hy < 0 || hx >= HW || hy >= HH) continue;
    const c = hashCells[hy * HW + hx]; if (!c.length) hashUsed.push(hy * HW + hx); c.push(e);
  }
}
function nearMons(x, y, r, fn) {
  r += 17;                            // margin for the largest monster radius
  const x0 = Math.max(0, Math.floor((x - r) / HC)), x1 = Math.min(HW - 1, Math.floor((x + r) / HC)), y0 = Math.max(0, Math.floor((y - r) / HC)), y1 = Math.min(HH - 1, Math.floor((y + r) / HC));
  for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) { const c = hashCells[cy * HW + cx]; for (let i = 0; i < c.length; i++) fn(c[i]); }
}
function nearestMon(x, y, maxR, needLos) {
  let best = null, bd = maxR * maxR;
  for (const e of G.mons) { if (e.dead || e.emerge > 0.2) continue; const d = (e.x - x) * (e.x - x) + (e.y - 3 - y) * (e.y - 3 - y); if (d < bd && (!needLos || los(x, y, e.x, e.y - 3))) { bd = d; best = e; } }
  return best;
}
function nearestMons(x, y, maxR, n, needLos) {
  const c = [];
  for (const e of G.mons) { if (e.dead || e.emerge > 0.2) continue; const d = (e.x - x) * (e.x - x) + (e.y - 3 - y) * (e.y - 3 - y); if (d < maxR * maxR) c.push([d, e]); }
  c.sort((a, b) => a[0] - b[0]);
  const out = []; for (const [, e] of c) { if (!needLos || los(x, y, e.x, e.y - 3)) { out.push(e); if (out.length >= n) break; } }
  return out;
}
// src: undefined = a weapon hit (can crit, carries ring charms) - 'room' = a room power or trap - 'dot' = burn tick
function hurtMon(e, dmg, kx, ky, kb = 1, src) {
  if (e.dead || e.emerge > 0.2) return false;
  const P = G.P; let crit = false;
  if (!src) {
    if (P.crit > 0 && rand() < P.crit) { dmg *= 2; crit = true; }
    const er = P.charms.emberring, fr = P.charms.frostring;
    if (er) { e.burnT = 2.2; e.burn = 3 * er * P.might; e.burnBy = 'c:emberring'; }
    if (fr) { e.slow = Math.max(e.slowT > 0 ? e.slow : 0, 0.08 + 0.09 * fr); e.slowT = 1.5; }
  }
  const room = roomAt(e.x, e.y);
  if (room && room.type === 'blizzard' && roomLive(room)) dmg *= 1 + 0.25 * roomMul(room);
  if (e.markT > 0) dmg *= 1 + e.mark;                                  // stuck in Royal Jelly
  if (e.burnT > 0 && src !== 'dot' && P.charms.tinder) dmg *= 1 + 0.15 * P.charms.tinder;
  dmg = Math.max(1, Math.round(dmg)); e.hp -= dmg; e.flash = 0.1; G.stats.dmg += dmg;
  const by = BY || (src === 'room' ? 'r:other' : src === 'dot' ? 'x:burn' : 'w:other'); G.tally[by] = (G.tally[by] || 0) + dmg;
  if (e.def.mimic && e.st === 0) { e.st = 1; sfx('breach'); }
  const res = e.def.boss ? 0 : e.def.heavy ? 0.25 : 1;
  e.kx += kx * kb * res; e.ky += ky * kb * res;
  if (src !== 'dot' && G.texts.length < 40) G.texts.push({ x: e.x + (fxr() - 0.5) * 6, y: e.y - e.r - 9, n: dmg, col: crit ? 'r' : src === 'room' ? 'c' : dmg >= 25 ? 'y' : 'w', t: 0, d: 0.45 });
  if (src !== 'dot') sfx(e.def.boss ? 'bosshit' : 'hit');
  if (e.hp <= 0) killMon(e);
  return true;
}
function dropPick(k, x, y, v) {
  const a = rand() * TAU, s = 20 + rand() * 40;
  G.picks.push({ k, x, y, v: v || 0, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: 0, mag: false, ms: 70, gone: false });
  return G.picks[G.picks.length - 1];
}
function dropGlint(x, y, v) {
  if (G.picks.length > 300) { for (let i = 0; i < 12; i++) { const p = G.picks[Math.floor(rand() * G.picks.length)]; if (p.k === 'glint') { p.v += v; return; } } }
  dropPick('glint', x, y, v);
}
// lingering ground effects. kind: 'fire' / 'spore' hurt you; 'flame' / 'cloud' / 'honey' / 'drift' hurt monsters (and may slow them or make them 'sticky': hurt more by everything)
function addZone(x, y, r, d, kind, dmg, extra) { if (G.zones.length < 70) G.zones.push(Object.assign({ x, y, r, t: 0, d, kind, dmg: dmg || 0, tick: 0.2, slow: 0, sticky: 0, by: BY, mby: EBY }, extra)); }
function killMon(e) {
  if (e.dead) return; e.dead = true; const def = e.def, P = G.P, room = roomAt(e.x, e.y); G.stats.kills++;
  burst(e.x, e.y - 4, def.elite ? 18 : 6, def.col, def.elite ? 90 : 60); sfx('kill');
  if (def.elite && !def.mimic) bigKill(e.x, e.y - 6, 44);        // a mimic has its own moment: the loot it spills
  let gl = e.noLoot ? 0 : def.glint;      // a pack called by a knock back carries nothing
  if (room && roomLive(room)) {
    if (room.type === 'grave') gl *= 1 + roomLevel('grave');
    if (room.type === 'fairy') { const was = BY; BY = 'r:fairy'; addZone(e.x, e.y, 20, 3, 'cloud', 6 * roomPow(room)); BY = was; }
  }
  if (gl) dropGlint(e.x, e.y, gl);
  if (def.split) for (let i = 0; i < def.split; i++) { const a = i / def.split * TAU + 0.4, s = spawnMon(def.into || 'slime', e.x + Math.cos(a) * 6, e.y + Math.sin(a) * 6); s.kx = Math.cos(a) * 110; s.ky = Math.sin(a) * 110; s.noLoot = e.noLoot; s.haste = e.haste; }
  const firing = EBY; EBY = e.type;
  if (def.ember) addZone(e.x, e.y, 13, 2.6, 'fire');
  if (def.burst) for (let i = 0; i < def.burst; i++) { const a = i / def.burst * TAU + 0.3; fireEBullet(e.x, e.y - 3, Math.cos(a), Math.sin(a), 74, 's_spore', 1.6); }
  EBY = firing;
  if (def.mimic) { for (let i = 0; i < e.keys; i++) dropPick('key', e.x, e.y); if (e.boon) G.boons.push({ x: e.x, y: e.y, boon: e.boon, mul: e.boonMul || 1, t: 0 }); G.shake = Math.max(G.shake, 4); }
  if (def.elite) { G.stats.elites++; if (!def.mimic && !e.noLoot) { dropPick('heart', e.x, e.y); if (charm('magpie')) dropPick('key', e.x, e.y); } }
  else if (!def.boss && !e.noLoot && rand() < 0.012 * (HEROES[G.hero].hearts || 1) * (stake(4) ? 0.5 : 1) && P.hp < P.maxHp) dropPick('heart', e.x, e.y);
  if (def.boss) bossDied(e);
}
function fireEBullet(x, y, dx, dy, sp, spr, life) { if (G.ebullets.length < 180) G.ebullets.push({ x, y, vx: dx * sp, vy: dy * sp, t: 0, spr: spr || 's_ebullet', life: life || 7, by: EBY }); }
function fireFan(e, sp, n, spr, P) {
  const a0 = Math.atan2(P.y - 4 - (e.y - 4), P.x - e.x);
  for (let i = 0; i < n; i++) { const a = a0 + (i - (n - 1) / 2) * 0.28; fireEBullet(e.x, e.y - 4, Math.cos(a), Math.sin(a), sp, spr); }
  sfx('ebullet');
}
// where the flow field wants a walker (or flyer) standing at e to go next
function flowTarget(e, fly, P) {
  const ti = Math.floor(e.y / T) * GWT + Math.floor(e.x / T), dist = fly ? G.distF : G.distG, next = fly ? G.nextF : G.nextG, dd = dist[ti];
  if (dd !== 65535 && dd > 2) { let nx = next[ti]; if (dd > 3) nx = next[nx]; return [(nx % GWT) * T + 8, Math.floor(nx / GWT) * T + 8]; }
  return [P.x, P.y];
}
function updateMons(dt) {
  const P = G.P, mons = G.mons;
  for (let i = 0, n = mons.length; i < n; i++) {
    const e = mons[i]; if (e.dead) continue; const def = e.def; EBY = e.type;
    e.anim += dt; e.life += dt; if (e.flash > 0) e.flash -= dt;
    if (e.emerge > 0) { e.emerge -= dt; e.x += e.evx * dt; e.y += e.evy * dt; continue; }
    if (e.markT > 0) e.markT -= dt;
    if (e.burnT > 0) { e.burnT -= dt; e.burnTick -= dt; if (e.burnTick <= 0) { e.burnTick = 0.5; BY = e.burnBy || null; hurtMon(e, e.burn * 0.5, 0, 0, 0, 'dot'); BY = null; if (e.dead) continue; part(e.x + (fxr() - 0.5) * 6, e.y - 6, 0, -26, 0.3, fxr() < 0.5 ? PAL.o : PAL.y, 1); } }
    if (def.boss) { const k = dt * bossFury(e, dt); if (!bossPhase(e, dt)) BOSS_AI[def.id](e, k); continue; }
    const dxp = P.x - e.x, dyp = P.y - e.y, dp = Math.hypot(dxp, dyp) || 1, room = roomAt(e.x, e.y), live = roomLive(room);
    if (live && room.type === 'glacier' && e.gl !== room.id) { e.gl = room.id; e.stun = Math.max(e.stun, 1.2 * (0.5 + 0.5 * roomMul(room))); sfx('freeze'); }
    if (def.ai === 'hex' && room) { if (room.hexT <= 0 && room.def.tier !== 'x') { sfx('hex'); tip('hex', 'A Hexer switches off the room it stands in. Get rid of it.'); } room.hexT = 0.3; }
    if (e.stun > 0) { e.stun -= dt; e.kx = e.ky = 0; if (dp < e.r + P.r + 1) hurtPlayer(def.dmg, e); continue; }
    let sp = def.spd * (e.haste || 1);
    if (e.slowT > 0) { e.slowT -= dt; sp *= 1 - e.slow; }
    if (live && room.type === 'frost') { sp *= Math.max(0.3, 1 - 0.38 * roomMul(room) * P.sealPow); e.chill = 0.2; } else if (e.chill > 0) e.chill -= dt;
    if (live && G.tag[Math.floor(e.y / T) * GWT + Math.floor(e.x / T)] === TAG_BRAMBLE && !def.fly && !def.phase) sp *= 0.72;
    if (def.mimic && e.st === 0) { if (dp < 54) { e.st = 1; sfx('breach'); G.shake = Math.max(G.shake, 3); } else continue; }
    // where to?
    let tx, ty, direct = false;
    if (def.phase) { tx = P.x; ty = P.y; } else { const t = flowTarget(e, def.fly, P); tx = t[0]; ty = t[1]; }
    const ai = def.ai;
    if (def.siege) { const act = siegeAct(e, dt, room, dp); if (act) { tx = act[0]; ty = act[1]; direct = true; if (act[2]) sp = 0; } }
    if (ai === 'shoot' || ai === 'hex') {
      const s = def.shot; e.shootT -= dt;
      if (dp < s.range) { sp *= dp < s.hold ? 0 : 0.5; if (e.shootT <= 0 && los(e.x, e.y - 4, P.x, P.y - 4)) { e.shootT = rr(s.cd[0], s.cd[1]); e.flash = 0.08; fireEBullet(e.x, e.y - 4, dxp / dp, dyp / dp, s.sp, s.spr); sfx('ebullet'); } }
    } else if (ai === 'turret') {
      const s = def.shot; sp = 0; e.shootT -= dt; e.face = dxp > 0 ? 1 : -1;
      if (dp < s.range && e.shootT <= 0 && los(e.x, e.y - 4, P.x, P.y - 4)) { e.shootT = rr(s.cd[0], s.cd[1]); e.flash = 0.1; fireFan(e, s.sp, s.fan, s.spr, P); }
    } else if (ai === 'charge') {
      e.stT -= dt;
      if (e.st === 0) { if (dp < 96 && e.stT <= 0 && los(e.x, e.y, P.x, P.y)) { e.st = 1; e.stT = 0.45; e.cx = dxp / dp; e.cy = dyp / dp; } }
      else if (e.st === 1) { sp = 0; e.flash = 0.05; if (e.stT <= 0) { e.st = 2; e.stT = 0.55; } }
      else if (e.st === 2) {
        const h = moveBox(e, e.cx * 205 * dt, e.cy * 205 * dt, F_WALK, e.fr); e.face = e.cx > 0 ? 1 : -1;
        if (h || e.stT <= 0) { e.st = 0; e.stT = h ? 1.6 : 1.1; if (h) e.stun = 0.5; }
        if (dp < e.r + P.r + 1) hurtPlayer(def.dmg, e);
        continue;
      }
    } else if (ai === 'bomber') {
      if (e.st === 0 && dp < 26) { e.st = 1; e.stT = 0.55; sfx('fuse'); }
      if (e.st === 1) {
        sp = 0; e.stT -= dt; e.flash = (Math.floor(e.stT * 20) & 1) ? 0.05 : 0;
        if (e.stT <= 0) {
          G.fxs.push({ k: 'boom', x: e.x, y: e.y, R: 30, t: 0, d: 0.3 }); sfx('boom'); G.shake = Math.max(G.shake, 3); burst(e.x, e.y, 10, PAL.o, 90);
          if (dp < 32) hurtPlayer(2, null, 'bomber');
          BY = 'm:bomber'; nearMons(e.x, e.y, 30, o => { if (o !== e && Math.hypot(o.x - e.x, o.y - e.y) < 30 + o.r) hurtMon(o, 30 * CURVE.hp(G.floor, G.t / 60), 0, 0, 0, 'room'); }); BY = null;
          killMon(e); continue;
        }
      }
    } else if (ai === 'latch' || ai === 'dig') {
      const act = pestAct(e, dt, room, ai);
      if (act === 'gone') continue;
      if (act) { tx = act[0]; ty = act[1]; direct = true; if (act[2]) sp = 0; }
    } else if (ai === 'ring') {
      e.shootT -= dt;
      if (e.shootT <= 0 && dp < 190) { e.shootT = 3.6; e.flash = 0.15; const off = rand() * TAU; for (let k = 0; k < 10; k++) fireEBullet(e.x, e.y - 8, Math.cos(off + k * TAU / 10), Math.sin(off + k * TAU / 10), 64, 's_fire'); sfx('ebullet'); G.shake = Math.max(G.shake, 2); }
    } else if (ai === 'dice') {             // it rolls, then throws a ring: the more pips, the more bullets
      const s = def.shot, ring = (n, off) => { for (let k = 0; k < n; k++) fireEBullet(e.x, e.y - 6, Math.cos(off + k * TAU / n), Math.sin(off + k * TAU / n), s.sp, s.spr); };
      e.shootT -= dt;
      if (e.stT > 0 && (e.stT -= dt) <= 0) ring(e.cx, e.cy + Math.PI / e.cx);     // the loaded die throws again, turned half a step
      if (e.shootT <= 0 && dp < s.range) {
        const n = s.n + (1 + Math.floor(rand() * 6)) * s.per, off = rand() * TAU;
        e.shootT = rr(s.cd[0], s.cd[1]); e.flash = 0.15; ring(n, off); sfx('dice'); G.shake = Math.max(G.shake, 1.5);
        if (s.twice) { e.stT = 0.4; e.cx = n; e.cy = off; }
      }
    } else if (ai === 'brood') {
      const s = def.shot; e.shootT -= dt; e.stT -= dt;
      if (e.shootT <= 0 && dp < s.range && los(e.x, e.y - 4, P.x, P.y - 4)) { e.shootT = rr(s.cd[0], s.cd[1]); e.flash = 0.12; fireFan(e, s.sp, s.fan, s.spr, P); }
      if (e.stT <= 0) { e.stT = 6; for (let k = 0; k < 2; k++) { const a = rand() * TAU, b = spawnMon('spore', e.x + Math.cos(a) * 8, e.y + Math.sin(a) * 8, 0.6); b.kx = Math.cos(a) * 90; b.ky = Math.sin(a) * 90; } }
    }
    let dx = tx - e.x, dy = ty - e.y; const dl = Math.hypot(dx, dy) || 1; dx /= dl; dy /= dl;
    if (def.hop) sp *= 0.35 + 1.3 * Math.abs(Math.sin(e.anim * 5 + e.wob));
    if (def.fly && !direct) { const w = Math.sin(e.anim * 6 + e.wob) * 0.6; const ox = -dy, oy = dx; dx += ox * w; dy += oy * w; }
    // soft separation so the horde reads as a crowd, not a stack
    let sx = 0, sy = 0;
    nearMons(e.x, e.y, e.r, o => {
      if (o === e || o.emerge > 0) return;
      const ox = e.x - o.x, oy = e.y - o.y, rsum = e.r + o.r - 1, d2 = ox * ox + oy * oy;
      if (d2 < rsum * rsum && d2 > 0.0001) { const d = Math.sqrt(d2), f = (rsum - d) / rsum; sx += ox / d * f; sy += oy / d * f; }
    });
    const vx = dx * sp + sx * 46 + e.kx, vy = dy * sp + sy * 46 + e.ky, damp = Math.min(1, dt * 9), mask = def.fly ? F_FLY : F_WALK;
    e.kx -= e.kx * damp; e.ky -= e.ky * damp;
    if (def.phase || boxHits(e.x, e.y, e.fr, mask)) { e.x += vx * dt; e.y += vy * dt; } else moveBox(e, vx * dt, vy * dt, mask, e.fr);   // (a walker embedded in a prop may walk out)
    if (Math.abs(dx) > 0.25 && sp > 0) e.face = dx > 0 ? 1 : -1;
    if (dp < e.r + P.r + 1) hurtPlayer(def.dmg, e);
  }
  EBY = null;
}
// A floor's elite goes for the room you built up most (stars first, then resonance) and camps in it. While it
// stands there the room's power is off, as under a Hexer. On its way it ignores the delver (a touch still hurts),
// so it can be stopped before it arrives. Once it has settled in, it turns on a delver who comes close or walks
// into its room, and goes back when they leave: fight it there, or lure it out. A floor with nothing built up
// (one star everywhere, no resonance) has no target, and the elite hunts the delver like any monster.
const SIEGE_NEAR = 76;
function siegeTarget(e) {
  let best = null, bs = 10, bd = 1e9;
  for (const r of G.rooms) {
    if (r.reveal < 1 || r.def.tier === 'x') continue;
    const s = roomLevel(r.type) * 10 + Math.min(9, r.res), d = Math.hypot(r.px + CWP / 2 - e.x, r.py + CHP / 2 - e.y);
    if (s > bs || (s === bs && best && d < bd)) { best = r; bs = s; bd = d; }
  }
  return best;
}
// a free tile to stand on, as near the middle of the room as there is one
function standTile(r) {
  const cx = Math.floor((r.px + CWP / 2) / T), cy = Math.floor((r.py + CHP / 2) / T);
  for (let rad = 0; rad < 6; rad++) for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) {
    if (Math.max(Math.abs(dx), Math.abs(dy)) !== rad) continue;
    const i = (cy + dy) * GWT + cx + dx; if (!(G.flags[i] & F_WALK)) return i;
  }
  return cy * GWT + cx;
}
// returns [x, y, standStill] to steer by, or null to chase the delver like any monster
function siegeAct(e, dt, room, dp) {
  e.siegeT = (e.siegeT || 0) - dt;
  if (e.siegeT <= 0) {                // read the floor plan again now and then: rooms get built, levelled and latched
    e.siegeT = 1.5; e.tr = siegeTarget(e);
    if (e.tr) { if (!e.sd) { e.sd = new Uint16Array(GWT * GHT); e.sn = new Int32Array(GWT * GHT); } const c = standTile(e.tr); bfs(F_WALK, e.sd, e.sn, c % GWT, Math.floor(c / GWT)); }
  }
  const tr = e.tr; if (!tr) return null;
  if (room === tr) {
    tr.hexT = Math.max(tr.hexT, 0.3); tr.siegeT = 0.5;
    if (!e.camped) {
      e.camped = true; sfx('hex'); G.shake = Math.max(G.shake, 3);
      banner('YOUR ' + tr.def.name.toUpperCase() + ' IS UNDER SIEGE', 'Its power is off while the ' + e.def.name + ' stands in it.', '#ff7a7a', 3);
      tip('siege', 'An elite camps in the room you built up most and switches it off. Fight it there, or lure it out.');
    }
  }
  if (e.camped && (dp < SIEGE_NEAR || room === G.curRoom)) return null;  // it has settled in and the delver is here: fight
  const ti = Math.floor(e.y / T) * GWT + Math.floor(e.x / T), dd = e.sd[ti];
  if (dd === 65535) return null;                                         // cut off from its room (a latched gate): hunt instead
  if (dd <= 1) return [e.x, e.y, true];
  let nx = e.sn[ti]; if (dd > 3) nx = e.sn[nx];
  return [(nx % GWT) * T + 8, Math.floor(nx / GWT) * T + 8, false];
}

// Latchlings lock a doorway of the room they arrive in; Sappers tunnel through one of its bare walls.
// returns [x, y, standStill] to steer by, null to behave like a normal chaser, or 'gone' once the job is done.
function pestAct(e, dt, room, ai) {
  if (!room || room.reveal < 1 || e.life > 14 || e.st === 9) { e.st = 9; return null; }
  if (!e.goal) {
    let best = -1, bd = 1e9;
    for (let d = 0; d < 4; d++) {
      const ok = ai === 'latch' ? room.doors[d] === 2 && G.jams.length < 3 : canBreach(room, d) && (!nbOf(room, d) || nbOf(room, d).reveal >= 1);
      if (!ok) continue;
      const p = doorPos(room, d), dd = ai === 'latch' ? Math.hypot(p.x - G.P.x, p.y - G.P.y) : Math.hypot(p.x - e.x, p.y - e.y) + rand() * 60;
      if (dd < bd) { bd = dd; best = d; }
    }
    if (best < 0) { e.st = 9; return null; }
    const p = doorPos(room, best); e.goal = { room, dir: best, x: p.x + p.nx * 22, y: p.y + p.ny * 22 };
  }
  const g = e.goal, ok = ai === 'latch' ? g.room.doors[g.dir] === 2 : canBreach(g.room, g.dir);
  if (!ok) { e.goal = null; e.st = 0; return null; }
  if (Math.hypot(g.x - e.x, g.y - e.y) > 9) { e.st = 0; return [g.x, g.y, false]; }
  if (e.st !== 1) { e.st = 1; e.stT = ai === 'latch' ? 0.9 : 2.6; }
  e.stT -= dt; e.flash = (Math.floor(e.stT * 12) & 1) ? 0.05 : 0;
  const p = doorPos(g.room, g.dir);
  if (ai === 'dig') { sfx('dig'); if (fxr() < 0.5) part(p.x + p.nx * 14 + (fxr() - 0.5) * 30, p.y + p.ny * 14 + (fxr() - 0.5) * 30, p.nx * 30, p.ny * 30 - 20, 0.5, PAL.t, 2, 120); }
  if (e.stT > 0) return [g.x, g.y, true];
  if (ai === 'latch') {
    const j = jamDoor(g.room, g.dir);
    if (j) { sfx('jam'); burst(j.x, j.y, 10, PAL.y, 70); tip('latch', 'A Latchling locked that doorway. Lean on the gate to shove it open.'); }
  } else {
    const res = breachWall(g.room, g.dir);
    if (res) {
      sfx('crack'); G.shake = Math.max(G.shake, 5); burst(p.x, p.y, 22, PAL.t, 110);
      banner(res === 'door' ? 'A SAPPER BROKE THROUGH' : 'A SAPPER DUG A TUNNEL', res === 'door' ? 'That wall is a knocking door now.' : 'Two of your rooms are joined.', '#e3bd88', 2.6);
      tip('sapper', 'Sappers tunnel through bare walls. Stop them before they finish digging.');
    }
  }
  e.dead = true; burst(e.x, e.y - 4, 6, e.def.col); return 'gone';
}

// ---- shots, bullets, patches, zones, allies, pickups, fx ----
function shoot(o) { G.shots.push(Object.assign({ t: 0, hits: null, rehit: 0, pierce: 0, bounces: 0, r: 3, inf: 0, kb: 1, src: undefined, by: BY }, o)); }
function explode(x, y, R, dmg, src) {
  G.fxs.push({ k: 'boom', x, y, R, t: 0, d: 0.3 }); G.shake = Math.max(G.shake, 2.5); sfx('boom'); burst(x, y, 10, PAL.o, 90);
  nearMons(x, y, R, e => { const dx = e.x - x, dy = e.y - 3 - y, d = Math.hypot(dx, dy); if (d < R + e.r) hurtMon(e, dmg, dx / (d || 1) * 90, dy / (d || 1) * 90, 1, src); });
}
function updateShots(dt) {
  const S = G.shots, P = G.P;
  for (let i = S.length - 1; i >= 0; i--) {
    const s = S[i]; s.t += dt; let dead = false; BY = s.by;
    if (s.k === 'bomb') {
      const f = clamp(s.t / s.d, 0, 1); s.x = lerp(s.sx, s.tx, f); s.y = lerp(s.sy, s.ty, f); s.z = Math.sin(f * Math.PI) * 30;
      if (s.t >= s.d) {
        if (s.pot) { addZone(s.tx, s.ty, s.pot.r, s.pot.life, 'honey', s.dmg, { slow: s.pot.slow, sticky: s.pot.sticky }); burst(s.tx, s.ty, 8, PAL.y, 50); sfx('squish'); }
        else { explode(s.tx, s.ty, s.R, s.dmg); if (s.fire) addZone(s.tx, s.ty, s.R * 0.8, 3, 'flame', s.dmg * 0.25); }
        dead = true;
      }
    } else {
      if (s.k === 'bkey') {             // Skeleton Key: out, then home again
        if (!s.back && s.t > s.out) { s.back = true; s.hits.clear(); }
        if (s.back) { const dx = P.x - s.x, dy = P.y - 4 - s.y, d = Math.hypot(dx, dy) || 1; s.vx = dx / d * 190; s.vy = dy / d * 190; if (d < 8) dead = true; }
        s.x += s.vx * dt; s.y += s.vy * dt;
      } else {
        if (s.homing && s.t > 0.08) { const tg = nearestMon(s.x, s.y, 110, false); if (tg) { const sp = Math.hypot(s.vx, s.vy), a = Math.atan2(s.vy, s.vx), want = Math.atan2(tg.y - 3 - s.y, tg.x - s.x), na = a + clamp(angDiff(want, a), -7 * dt, 7 * dt); s.vx = Math.cos(na) * sp; s.vy = Math.sin(na) * sp; } }
        if (s.grow) { s.r = s.r0 + 5 * s.grow * s.t; s.dmg = s.d0 * (1 + 0.8 * s.grow * s.t); }                     // Snowball
        if (s.stick && s.t > s.out) {                                    // Buzz Saw: parks, and once evolved crawls after monsters
          s.vx = s.vy = 0;
          if (s.crawl) { const tg = nearestMon(s.x, s.y, 140, false); if (tg) { const dx = tg.x - s.x, dy = tg.y - 3 - s.y, d = Math.hypot(dx, dy); if (d > 4) { s.vx = dx / d * s.crawl; s.vy = dy / d * s.crawl; } } }
        }
        const nx = s.x + s.vx * dt, ny = s.y + s.vy * dt;
        if (blocked(nx, ny, F_SHOT)) {
          if (s.stick) { s.vx = s.vy = 0; }
          else if (s.bounces > 0) {
            s.bounces--; const bx = blocked(nx, s.y, F_SHOT), by = blocked(s.x, ny, F_SHOT);
            if (bx || !by) s.vx = -s.vx; if (by || !bx) s.vy = -s.vy;
            sfx('bounce'); part(s.x, s.y, 0, 0, 0.15, PAL.w, 2);
            if (s.shard) { const tg = nearestMon(s.x, s.y, 120, true); if (tg) { const a = Math.atan2(tg.y - 3 - s.y, tg.x - s.x); shoot({ k: 'shard', x: s.x, y: s.y, vx: Math.cos(a) * 200, vy: Math.sin(a) * 200, r: 3, dmg: s.dmg * 0.6, life: 0.7 }); } }
          } else { dead = true; for (let j = 0; j < 3; j++) part(s.x, s.y, (fxr() - 0.5) * 50, (fxr() - 0.5) * 50, 0.2, PAL.c, 1); }
        } else { s.x = nx; s.y = ny; }
      }
      if (s.t > s.life) dead = true;
      if (!dead) nearMons(s.x, s.y, s.r, e => {
        if (dead || e.dead || e.emerge > 0.2) return;
        const dx = e.x - s.x, dy = e.y - 3 - s.y, rs = e.r + s.r; if (dx * dx + dy * dy > rs * rs) return;
        if (s.hits) { const lt = s.hits.get(e.id); if (lt !== undefined && (s.rehit === 0 || G.t - lt < s.rehit)) return; s.hits.set(e.id, G.t); }
        const sp = Math.hypot(s.vx, s.vy) || 1; hurtMon(e, s.dmg, s.vx / sp * 50, s.vy / sp * 50, s.kb, s.src);
        if (s.slow) { e.slow = Math.max(e.slowT > 0 ? e.slow : 0, s.slow); e.slowT = 1.5; }
        if (s.freeze && !e.def.boss) { e.stun = Math.max(e.stun, s.freeze); sfx('freeze'); }
        if (s.burst && !s.split) { s.split = true; for (let k = 0; k < s.burst; k++) { const a = Math.atan2(s.vy, s.vx) + (k - (s.burst - 1) / 2) * 0.9 + Math.PI; shoot({ k: 'shard', x: s.x, y: s.y, vx: Math.cos(a) * 190, vy: Math.sin(a) * 190, r: 3, dmg: s.dmg * 0.5, life: 0.35, hits: new Map([[e.id, G.t]]) }); } }
        if (s.pay && e.dead) dropGlint(e.x, e.y, s.pay);
        if (s.hops !== undefined) {                                      // Lucky Coin: skip on to the nearest monster it has not hit yet
          let nb = null, bd = 95 * 95;
          if (s.hops-- > 0) nearMons(s.x, s.y, 95, o => { if (o.dead || o === e || o.emerge > 0.2 || s.hits.has(o.id)) return; const d = (o.x - s.x) * (o.x - s.x) + (o.y - 3 - s.y) * (o.y - 3 - s.y); if (d < bd) { bd = d; nb = o; } });
          if (!nb) dead = true; else { const a = Math.atan2(nb.y - 3 - s.y, nb.x - s.x); s.vx = Math.cos(a) * 230; s.vy = Math.sin(a) * 230; s.t = 0; sfx('bounce'); }
        }
        if (!s.inf && s.pierce-- <= 0) dead = true;
      });
    }
    if (dead) {
      if (s.boomR) explode(s.x, s.y, s.boomR, s.boomD);                                                             // Siege Bow, rockets, a rolled six
      if (s.sparks) for (let k = 0; k < s.sparks; k++) { const a = k / s.sparks * TAU + s.t; shoot({ k: 'ember', x: s.x, y: s.y, vx: Math.cos(a) * 170, vy: Math.sin(a) * 170, r: 3, dmg: s.boomD * 0.4, life: 0.4, pierce: 1, hits: new Map() }); }
      if (s.drift) addZone(s.x, s.y, Math.max(14, s.r * 1.5), 3, 'drift', s.d0 * 0.6, { slow: 0.5 });
      S[i] = S[S.length - 1]; S.pop();
    }
  }
  BY = null;
}
function updateEBullets(dt) {
  const B = G.ebullets, P = G.P;
  for (let i = B.length - 1; i >= 0; i--) {
    const b = B[i]; b.t += dt; b.x += b.vx * dt; b.y += b.vy * dt;
    let dead = b.t > b.life || blocked(b.x, b.y, F_SHOT);
    if (!dead && P.inv <= 0 && Math.abs(b.x - P.x) < 5 && Math.abs(b.y - (P.y - 4)) < 6) { hurtPlayer(1, null, b.by || 'a bullet', 'bullet'); dead = true; }
    if (dead) { B[i] = B[B.length - 1]; B.pop(); }
  }
}
function updatePatches(dt) {
  const A_ = G.patches;
  for (let i = A_.length - 1; i >= 0; i--) {
    const p = A_[i]; p.life -= dt; p.tick -= dt; BY = p.by;
    if (p.tick <= 0) { p.tick = 0.4; nearMons(p.x, p.y, p.r, e => { if (e.def.fly || e.def.phase) return; const dx = e.x - p.x, dy = e.y - p.y; if (dx * dx + dy * dy < (p.r + e.r) * (p.r + e.r)) { hurtMon(e, p.dmg, 0, 0, 0); e.slow = Math.max(e.slowT > 0 ? e.slow : 0, p.slow); e.slowT = 0.6; } }); }
    if (p.life <= 0) A_.splice(i, 1);
  }
  BY = null;
}
function updateZones(dt) {
  const Z = G.zones, P = G.P;
  for (let i = Z.length - 1; i >= 0; i--) {
    const z = Z[i]; z.t += dt; z.tick -= dt; BY = z.by;
    if (z.kind === 'fire' || z.kind === 'spore') { if (z.t > 0.35 && Math.hypot(P.x - z.x, P.y - z.y) < z.r + 2 && P.dashT <= 0) hurtPlayer(1, null, z.mby || z.kind); }
    else if (z.tick <= 0) { z.tick = 0.4; nearMons(z.x, z.y, z.r, e => {
      if (e.dead || Math.hypot(e.x - z.x, e.y - z.y) >= z.r + e.r) return;
      if (z.sticky) { e.mark = z.sticky; e.markT = 0.7; }
      if (z.slow && !e.def.boss) { e.slow = Math.max(e.slowT > 0 ? e.slow : 0, z.slow); e.slowT = 0.6; }
      hurtMon(e, z.dmg * 0.4, 0, 0, 0, 'room');
    }); }
    if (z.t >= z.d) { Z[i] = Z[Z.length - 1]; Z.pop(); }
  }
  BY = null;
}
// guard bees: each one hunts whatever is in its room, and circles its hive when the room is quiet
function updateAllies(dt) {
  for (const b of G.allies) {
    const room = b.room; b.cd -= dt; b.anim += dt;
    if (!roomLive(room)) { b.x += (b.hx - b.x) * dt * 3; b.y += (b.hy - 10 - b.y) * dt * 3; continue; }
    if (!b.tg || b.tg.dead || roomAt(b.tg.x, b.tg.y) !== room) { b.tg = null; let bd = 1e9; for (const e of G.mons) { if (e.dead || e.emerge > 0 || roomAt(e.x, e.y) !== room) continue; const d = Math.hypot(e.x - b.x, e.y - b.y); if (d < bd) { bd = d; b.tg = e; } } }
    let tx = b.hx + Math.cos(b.anim * 2 + b.ph) * 16, ty = b.hy - 12 + Math.sin(b.anim * 2 + b.ph) * 8;
    if (b.tg) { tx = b.tg.x; ty = b.tg.y - 5; }
    const dx = tx - b.x, dy = ty - b.y, d = Math.hypot(dx, dy) || 1, sp = b.tg ? 130 : 50;
    b.x += dx / d * Math.min(d, sp * dt); b.y += dy / d * Math.min(d, sp * dt);
    if (b.tg && d < 7 && b.cd <= 0) { b.cd = 0.5; BY = 'r:apiary'; hurtMon(b.tg, 6 * roomPow(room), 0, 0, 0, 'room'); BY = null; sfx('sting'); }
  }
}
function syncBees() {                 // every Apiary keeps (1 + its level) bees
  for (const room of G.rooms) {
    if (room.type !== 'apiary' || room.reveal < 1) continue;
    const want = 1 + roomLevel('apiary'), have = G.allies.filter(b => b.room === room).length;
    for (let i = have; i < want; i++) { const h = room.hives[i % room.hives.length]; G.allies.push({ room, x: h.x, y: h.y - 10, hx: h.x, hy: h.y, tg: null, cd: 0, anim: i * 1.7, ph: i * 2.1 }); }
  }
}
function updatePicks(dt) {
  const A_ = G.picks, P = G.P; G.comboT -= dt; if (G.comboT <= 0) G.combo = 0;
  const heartHeal = (charm('sweet') || G.hero === 'moss') ? 4 : 2;
  for (let i = A_.length - 1; i >= 0; i--) {
    const p = A_[i]; p.t += dt;
    const damp = Math.min(1, dt * 6); p.x += p.vx * dt; p.y += p.vy * dt; p.vx -= p.vx * damp; p.vy -= p.vy * damp;
    const dx = P.x - p.x, dy = P.y - 5 - p.y, d = Math.hypot(dx, dy) || 1;
    if (!p.mag && p.t > 0.3 && d < P.magnet && (p.k !== 'heart' || P.hp < P.maxHp) && !G.over) p.mag = true;
    if (p.mag) { p.ms = Math.min(380, p.ms + 620 * dt); p.x += dx / d * p.ms * dt; p.y += dy / d * p.ms * dt; }
    if (d < 9 && p.t > 0.3 && !G.over && (p.k !== 'heart' || P.hp < P.maxHp)) {
      if (p.k === 'glint') { gainGlints(p.v); G.combo++; G.comboT = 0.7; sfx('glint', G.combo); }
      else if (p.k === 'heart') { heal(heartHeal); floatText(P.x, P.y - 24, heartHeal > 2 ? '+2 hearts' : '+1 heart', '#ff9ec4'); }
      else if (p.k === 'key') { P.keys++; P.keyPop = 1.4; sfx('key'); floatText(P.x, P.y - 26, 'KEY!', '#ffd95e'); sparkle(P.x, P.y - 10, 12, PAL.y); }
      p.gone = true; A_[i] = A_[A_.length - 1]; A_.pop();
    }
  }
}
function updateSmall(dt) {            // particles, floating texts, timed fx
  const Pt = G.parts; for (let i = Pt.length - 1; i >= 0; i--) { const p = Pt[i]; p.life -= dt; if (p.life <= 0) { Pt[i] = Pt[Pt.length - 1]; Pt.pop(); continue; } p.vy += p.grav * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
  const Tx = G.texts; for (let i = Tx.length - 1; i >= 0; i--) { const t = Tx[i]; t.t += dt; t.y -= (t.s ? 14 : 26) * dt; if (t.t >= t.d) Tx.splice(i, 1); }
  const Fx = G.fxs; for (let i = Fx.length - 1; i >= 0; i--) { Fx[i].t += dt; if (Fx[i].t >= Fx[i].d) Fx.splice(i, 1); }
  if (G.tipT > 0) G.tipT -= dt; else if (G.tipQ.length) { G.tipText = G.tipQ.shift(); G.tipT = 7; } else G.tipText = '';
}
