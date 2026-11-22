/* ============================== 12 DIRECTOR =========================== */
// Monsters only ever enter through sealed doors, and every sealed door adds to the knocking.
// This file also runs the scripted beats, the pests, the three wardens and every room power.
const roomPow = room => CURVE.room(G.floor, G.t / 60) * G.P.sealPow * roomMul(room);
function steelHaste() {               // Tinker's Oil and a Workshop speed up traps and turrets
  let h = 1 + 0.15 * charm('oil');
  if (G.rooms.some(r => r.type === 'workshop' && roomLive(r))) h *= 1 + [0.25, 0.4, 0.55][roomLevel('workshop') - 1];
  return h;
}
function liveDoors() { let n = 0; for (const d of G.sealed) if (d.room.reveal >= 1) n++; return n; }
const doorPressure = () => CURVE.pressure(liveDoors(), charm('wedge'), G.floor);
// Waiting has a price before the warden comes: past 60% of the dread clock the knocking grows.
function dreadMul() { if (G.dir.boss || G.bossDown || G.endless) return 1; const k = G.t / clockLimit(); return k > 0.6 ? 1 + CURVE.dread * Math.min(1, (k - 0.6) / 0.4) : 1; }
const knocking = () => doorPressure() * dreadMul();                    // the multiplier the HUD shows
// what the Stairwell would wake right now (the warden's share of its full strength), and the keys a fast kill would still pay
const wardenShare = () => 0.5 + 0.5 * clamp(G.t / G.F.clock, 0, 1);
const swiftLeft = () => G.dir.overstay ? 0 : clamp(Math.floor((clockLimit() - G.t) / 60), 0, 2);
// A warden's fight cannot be waited out. After CURVE.fury.after seconds it gains a step of fury every CURVE.fury.every
// seconds, and each step makes everything it does that much faster: its walk, its wind-ups, its cool-downs.
function bossFury(e, dt) {
  const F = CURVE.fury; e.fightT = (e.fightT || 0) + dt;
  const step = e.fightT < F.after ? 0 : Math.min(F.max, 1 + Math.floor((e.fightT - F.after) / F.every));
  if (step > (e.fury || 0)) {
    e.fury = step; sfx('roar'); G.shake = Math.max(G.shake, 5); burst(e.x, e.y - 12, 12, PAL.r, 100);
    if (step === 1) { banner(e.def.name + ' GROWS IMPATIENT', 'The longer the fight lasts, the faster it moves.', '#ff7a7a', 2.8); tip('fury', 'A warden gets faster the longer its fight lasts. A build that kills slowly meets a quicker warden.'); }
    else floatText(e.x, e.y - 34, 'faster!', '#ff7a7a');
  }
  return 1 + F.step * (e.fury || 0);
}
function clockLimit() {               // seconds until the warden comes for you on its own
  let c = G.F.clock * (stake(6) ? 0.75 : 1);
  if (G.rooms.some(r => r.type === 'observ' && roomLive(r))) c *= 1 + [0.12, 0.2, 0.28][roomLevel('observ') - 1];
  return Math.max(45, c - G.fstat.wrath);   // every knock back after the first shortens it
}
function doorWeight(d) {
  const ix = d.x + d.nx * 24, iy = d.y + d.ny * 24, dist = G.distG[Math.floor(iy / T) * GWT + Math.floor(ix / T)], far = dist === 65535 ? 80 : dist;
  return 1 / (1 + (far / 22) * (far / 22)) + 0.04;
}
function nearDoor() { let best = null, bw = -1; for (const d of G.sealed) { if (d.room.reveal < 1) continue; const w = doorWeight(d); if (w > bw) { bw = w; best = d; } } return best; }
function emitFrom(d, q) {               // q: a monster id, or { id, rage } for a pack called by a knock back
  const lat = rr(-13, 13), e = spawnMon(q.id || q, d.x - d.ny * lat, d.y + d.nx * lat);
  e.emerge = 0.42; e.evx = d.nx * 92; e.evy = d.ny * 92; e.face = d.nx < 0 ? -1 : 1;
  if (q.id) { e.noLoot = true; if (q.rage) e.haste = 1.25; }
  return e;
}
function fireEvent(ev) {
  const mixl = floorMix(), d = nearDoor(); if (!d) return;
  if (ev === 'breach') {
    banner('KNOCK KNOCK!', 'Something is forcing a door.', '#ff9ec4', 2.6); sfx('breach');
    for (let i = 0, n = 10 + Math.floor(G.t / 28) + G.floor * 3; i < n; i++) d.queue.push(wpick(mixl, x => x[1])[0]);
  } else if (ev === 'elite') {
    const id = G.F.elite; d.queue.push(id);
    banner(id === 'kslime' ? 'A KING SLIME SQUEEZES IN' : id === 'eshroom' ? 'AN ELDER SHROOM LUMBERS IN' : 'A FURNACE GOLEM STOMPS IN', siegeTarget({ x: d.x, y: d.y }) ? 'It is after the room you built up most.' : '', '#b5e85a', 2.6); sfx('breach');
  }
}
function scatterHorde(keep) {         // the small fry flee: wardens fight alone (at first). Elites stay, but not a loaded die that a wave brought
  for (const m of G.mons) if (m !== keep && !m.dead && (!m.def.elite || m.def.ai === 'dice' && !m.noLoot)) { m.dead = true; burst(m.x, m.y - 4, 4, PAL.v, 50); }
  // (a monster of the house that was still behind its door for its first entrance has not come yet: it gets another one)
  const H = HOUSE[Math.min(G.floor, HOUSE.length - 1)]; if (G.sealed.some(d => d.queue.includes(H.id)) && !G.mons.some(m => m.type === H.id)) G.dir.house = undefined;
  for (const d of G.sealed) d.queue.length = 0; G.ebullets.length = 0; G.dir.acc = -6;
}
// fromRoom = the Stairwell you just drafted (the warden climbs out of it); null = it came because you overstayed
function summonBoss(fromRoom) {
  const D = G.dir, P = G.P, id = G.F.boss, def = MON[id]; if (D.boss) return null;
  let e;
  if (fromRoom && fromRoom.stairs) { e = spawnMon(id, fromRoom.stairs.x, fromRoom.stairs.y - 2); e.emerge = 1.1; }
  else {
    const d = def.phase ? null : nearDoor();
    if (d) { e = spawnMon(id, d.x, d.y); e.emerge = 0.95; e.evx = d.nx * 50; e.evy = d.ny * 50; d.shake = 1.4; d.st = 3; d.tel = 1.2; }
    else { e = spawnMon(id, P.x, P.y - 80); e.emerge = 0.9; }
  }
  // a warden woken early is weaker (and so are you); one that had to come and find you is furious
  e.max = e.hp = Math.round(def.hp * wardenShare() * (D.overstay ? 1.25 : 1) * (stake(5) ? 1.2 : 1)); if (D.overstay || stake(1)) e.rage = true;
  D.boss = e; e.st = 0; e.stT = 2.4; e.ang = 0;
  scatterHorde(e);
  banner(def.name, D.overstay ? 'you overstayed: it is furious' : stake(1) ? 'enraged from the first step' : def.sub, '#ff7a7a', 3.2); sfx('roar'); Snd.music('boss'); G.shake = 9;
  return e;
}
function bossDied(e) {
  const D = G.dir, P = G.P, last = G.floor === FLOORS.length - 1;
  D.bossDead = true; G.bossDown = true; G.stats.floors = Math.max(G.stats.floors, G.floor + 1); Snd.music(null); sfx('win'); bigKill(e.x, e.y - 14, 90); G.shake = 10;
  for (const m of G.mons) if (!m.dead && m !== e) { m.dead = true; burst(m.x, m.y - 4, 5, m.def.col); if (m.def.glint) dropGlint(m.x, m.y, m.def.glint); }
  G.ebullets.length = 0; for (const d of G.sealed) d.queue.length = 0; G.zones = G.zones.filter(z => z.kind === 'flame' || z.kind === 'cloud');
  for (const j of G.jams.slice()) unjam(j);
  for (let i = 0; i < 5; i++) burst(e.x + (fxr() - 0.5) * 30, e.y - 14 + (fxr() - 0.5) * 30, 14, [PAL.y, PAL.o, e.def.col, PAL.w][i % 4], 130);
  let gx = e.x, gy = e.y; if (blocked(gx, gy, F_WALK)) { const r = G.curRoom; gx = r.px + CWP / 2; gy = r.py + CHP / 2 + 24; }
  for (let i = 0; i < 24; i++) dropGlint(gx + (fxr() - 0.5) * 30, gy + (fxr() - 0.5) * 20, 12 + G.floor * 6);
  grantBossUnlocks(G.floor);
  if (last) { G.won = true; G.endT = 0; banner('THE KNOCKING STOPS', 'The Unmaker is rubble. Every floor is yours.', '#ffd95e', 4); return; }
  // the way down opens: at the Stairwell if you drafted one, else where the warden fell
  const sr = G.rooms.find(r => r.type === 'stairs' && r.stairs);
  G.stairs = sr ? { x: sr.stairs.x, y: sr.stairs.y, open: true, hole: false } : { x: gx, y: gy, open: true, hole: true };
  const swift = swiftLeft();
  G.fstat.swift = swift; P.keys += swift;
  banner('THE WARDEN FALLS', swift ? 'Swift work: +' + swift + (swift > 1 ? ' keys' : ' key') + '. The stairs are open.' : 'The stairs are open. Leave when you are ready.', '#ffd95e', 4);
  sfx('stairs');
}
function updateDirector(dt) {
  const D = G.dir, m = G.t / 60, F = G.F;
  if (G.bossDown && !G.endless) return;                                 // a floor falls quiet once its warden is dead
  while (D.ti < F.timeline.length && G.t >= F.timeline[D.ti].t) fireEvent(F.timeline[D.ti++].ev);
  if (!D.boss && !G.endless) {                                          // the dread clock
    const lim = clockLimit();
    if (G.t >= lim * 0.6) tip('dread', 'The bar under the clock turned orange: from here the knocking grows until the warden comes.');
    if (!D.warned && G.t >= lim - 15) { D.warned = true; banner('THE WARDEN STIRS...', 'It comes for you in 15 seconds.', '#ff7a7a', 3.2); sfx('breach'); }
    if (G.t >= lim) { D.overstay = true; summonBoss(null); }
  }
  if (D.calm > 0) { D.calm -= dt; return; }
  const fight = D.boss && !D.bossDead;
  // The floor's monster of the house comes by itself the first time: one of its kind, out of a door that is idle, with
  // a banner that says what it does, and no new wave for three seconds. (Without a sealed door it never comes.)
  const H = HOUSE[Math.min(G.floor, HOUSE.length - 1)];
  if (D.house === undefined && G.t >= H.solo && !D.boss) {
    const d = nearDoor();
    if (d && !d.queue.length && d.st === 0) { D.house = G.t; d.queue.push(H.id); D.calm = 3; D.acc = Math.min(D.acc, 0); banner(H.name, H.sub, '#ffd95e', 3.2); sfx('breach'); return; }
  }
  const pests = stake(2) && G.floor === 0 ? Object.assign({ sapper: [150, 85] }, F.pests) : F.pests, soon = stake(2) ? 0.7 : 1;
  for (const id in pests) {                                             // pests go for the floor plan
    const [first, every] = pests[id]; if (D.pestT[id] === undefined) D.pestT[id] = first * soon;
    if (G.t < D.pestT[id]) continue;
    D.pestT[id] = G.t + every * soon * rr(0.8, 1.25);
    const d = nearDoor(); if (d && !fight) d.queue.push(id);
  }
  let doors = 0, queued = 0; for (const d of G.sealed) { if (d.room.reveal >= 1) doors++; queued += d.queue.length; }
  const rate = CURVE.rate(G.floor, m) * CURVE.pressure(doors, charm('wedge'), G.floor) * dreadMul() * (fight ? 0.4 : 1);
  D.acc = Math.min(8, D.acc + rate * dt);
  if (D.acc >= 1 && G.mons.length + queued < CURVE.cap(G.floor, m)) {
    const n = Math.min(Math.floor(D.acc), CURVE.group(G.floor, m)), mixl = floorMix(); D.acc -= n;
    if (doors) { const d = wpick(G.sealed.filter(d => d.room.reveal >= 1), doorWeight); for (let i = 0; i < n; i++) d.queue.push(wpick(mixl, x => x[1])[0]); }
    else {                            // no sealed doors left: the dark squeezes through cracks in the floor
      const room = G.curRoom || G.rooms[0];
      for (let i = 0; i < n; i++) for (let k = 0; k < 12; k++) {
        const x = room.px + 40 + rand() * (CWP - 80), y = room.py + 40 + rand() * (CHP - 80);
        if (!boxHits(x, y, 6, F_WALK) && Math.hypot(x - G.P.x, y - G.P.y) > 70) { const e = spawnMon(wpick(mixl, q => q[1])[0], x, y); e.emerge = 0.3; burst(x, y, 6, PAL.v); break; }
      }
    }
  }
}
function updateDoors(dt) {
  const P = G.P;
  for (const d of G.sealed) {
    d.blink -= dt; if (d.blink < -0.14) d.blink = rr(1.5, 5);
    if (d.shake > 0) d.shake -= dt;
    if (d.st === 0) {
      if (d.queue.length && d.room.reveal >= 1) {
        d.st = 1; d.tel = 0.55; d.shake = 0.55;
        if (Math.abs(d.x - P.x) < 260 && Math.abs(d.y - P.y) < 200) sfx('knock');
        for (let i = 0; i < 4; i++) part(d.x + d.nx * 17 - d.ny * (fxr() - 0.5) * 40, d.y + d.ny * 17 + d.nx * (fxr() - 0.5) * 40, d.nx * 20, d.ny * 20 - 10, 0.4, PAL.W, 1);
      }
    } else if (d.st === 1) { d.tel -= dt; if (d.tel <= 0) { d.st = 2; d.emit = 0; } }
    else if (d.st === 2) {
      d.emit -= dt;
      if (d.emit <= 0) { if (d.queue.length) { emitFrom(d, d.queue.shift()); d.emit = 0.15; } else { d.st = 3; d.tel = 0.3; } }
    } else { d.tel -= dt; if (d.tel <= 0) d.st = d.queue.length ? 2 : 0; }
  }
}

// ---- wardens ----
// Wardens collide with a box no bigger than yours, so anywhere you can stand they can follow (and land).
const BOSS_R = 4.4;
function bossWalk(e, dt, sp, P) {
  const t = flowTarget(e, false, P); let dx = t[0] - e.x, dy = t[1] - e.y; const dl = Math.hypot(dx, dy) || 1; dx /= dl; dy /= dl;
  if (boxHits(e.x, e.y, BOSS_R, F_WALK)) { e.x += dx * sp * dt; e.y += dy * sp * dt; } else moveBox(e, dx * sp * dt, dy * sp * dt, F_WALK, BOSS_R);
  if (Math.abs(dx) > 0.25) e.face = dx > 0 ? 1 : -1;
}
// Where a warden's ring starts: `up` px above its feet, or lower if that spot is inside a wall (a warden that stands
// right under a wall would otherwise fire every bullet into it).
function shotY(e, up) { for (const d of [up, up / 2, 0, -up / 2]) if (!blocked(e.x, e.y - d, F_SHOT)) return e.y - d; return e.y - up; }
// ---- a warden's bullet phase (#13) ----
// Once in a fight, when its health has fallen to PHASE.at of the whole and it is between two attacks, a warden stops
// chasing. A tell of PHASE.tell seconds, then its pattern: `n` volleys, one every `every` seconds. An enraged warden
// (called late, or the first step of Stakes) runs the pattern PHASE.fast times as fast. Fury does not touch the phase:
// its clock is the game's, so the way through stays walkable however long the fight has lasted. The ways through:
//   Gatejaw       rings with one gap that turns a little with every ring: stay in the gap and walk with it
//   Mother Morel  slow rings of spores, each one set into the gaps of the last: step from gap to gap
//   The Unmaker   walls that cross the room you stand in, one after the other from the far side, each with a
//                 doorway a few steps beside the last: walk through them. While it builds it is thin air (`ghost`):
//                 it hovers wherever it was, and a doorway may lie right on it.
// A pattern takes its aim (`start`) with its first volley, not with the tell, so it meets you where you are by then.
// ph.shots keeps what was fired (the checks steer by it).
const PHASE = { at: 0.6, tell: 0.9, fast: 1.3, rest: 1.2 };
const PHASES = {
  gatejaw: { name: 'THE GATE COMES DOWN', sub: 'Stay in the gap and walk with it.', n: 6, every: 0.85, col: PAL.r, N: 36, open: 7, turn: 0.3, sp: 60,
    start(e, ph) { const P = G.P; ph.y = shotY(e, 12); ph.a = Math.atan2(P.y - 4 - ph.y, P.x - e.x); ph.dir = rand() < 0.5 ? 1 : -1; },
    fire(e, ph, i) {
      const D = PHASES.gatejaw, a = ph.a + ph.dir * i * D.turn, n = D.N - D.open;       // n bullets, centred opposite the gap
      for (let k = 0; k < n; k++) { const b = a + Math.PI + (k - (n - 1) / 2) * TAU / D.N; fireEBullet(e.x, ph.y, Math.cos(b), Math.sin(b), D.sp); }
      ph.shots.push({ x: e.x, y: ph.y, a, half: (D.open + 1) / D.N * Math.PI, sp: D.sp, t: 0 });
    } },
  morel: { name: 'SHE BLOOMS', sub: 'Step from gap to gap.', n: 7, every: 0.9, col: PAL.n, N: 10, sp: 40,
    hold(e) { const room = roomAt(e.x, e.y); if (room && room.def.tier !== 'x') room.hexT = 0.3; },          // she smothers her room while she blooms, too
    start(e, ph) { const P = G.P; ph.y = shotY(e, 6); ph.a = Math.atan2(P.y - 4 - ph.y, P.x - e.x) + Math.PI / PHASES.morel.N; },   // the first ring passes either side of you
    fire(e, ph, i) {
      const D = PHASES.morel, a = ph.a + (i & 1) * Math.PI / D.N;
      for (let k = 0; k < D.N; k++) fireEBullet(e.x, ph.y, Math.cos(a + k * TAU / D.N), Math.sin(a + k * TAU / D.N), D.sp, 's_spore');
      ph.shots.push({ x: e.x, y: ph.y, a, step: TAU / D.N, sp: D.sp, t: 0 });
    } },
  unmaker: { name: 'IT BUILDS WALLS', sub: 'Walk through the doorways.', n: 5, every: 1.3, col: PAL.P, door: 44, gap: 12, sp: 60, shift: [30, 46], ghost: 1,
    start(e, ph) {                    // the walls cross the room you stand in, from the side that is farthest from you
      const P = G.P, room = roomAt(P.x, P.y) || G.curRoom; if (!room) return;
      const x0 = room.px + WALL * T + 5, x1 = room.px + (WALL + IW) * T - 5, y0 = room.py + WALL * T + 5, y1 = room.py + (WALL + IH) * T - 5;
      const far = [P.y - y0, x1 - P.x, y1 - P.y, P.x - x0]; let side = 0; for (let i = 1; i < 4; i++) if (far[i] > far[side]) side = i;
      ph.box = [x0, y0, x1, y1]; ph.side = side; ph.door = null;     // side 0: from the top, 1: from the right, 2: from the bottom, 3: from the left
    },
    fire(e, ph, i) {
      const D = PHASES.unmaker, P = G.P; if (!ph.box) return;
      const [x0, y0, x1, y1] = ph.box, side = ph.side, across = side & 1 ? 0 : 1, lo = across ? x0 : y0, hi = across ? x1 : y1, min = lo + D.door / 2 + 6, max = hi - D.door / 2 - 6;
      // the first doorway a few steps beside you, each later one a few steps beside the last
      const base = ph.door === null ? clamp(across ? P.x : P.y - 4, min, max) : ph.door, step = (rand() < 0.5 ? -1 : 1) * (D.shift[0] + rand() * (D.shift[1] - D.shift[0]));
      const door = ph.door = base + step < min || base + step > max ? base - step : base + step;
      const vx = side === 3 ? 1 : side === 1 ? -1 : 0, vy = side === 0 ? 1 : side === 2 ? -1 : 0, from = side === 0 ? y0 : side === 2 ? y1 : side === 3 ? x0 : x1;
      for (let u = lo; u <= hi; u += D.gap) if (Math.abs(u - door) > D.door / 2) fireEBullet(across ? u : from, across ? from : u, vx, vy, D.sp, 's_hexbolt');
      ph.shots.push({ side, across, door, from, vx, vy, sp: D.sp, half: D.door / 2, t: 0 });
    } },
};
// true while the phase holds the warden (the tell, the pattern and the breath after it)
function bossPhase(e, dt) {
  const D = PHASES[e.def.id], P = G.P; if (!D) return false;
  let ph = e.ph;
  if (!ph) {
    if (e.phased || e.st !== 0 || e.hp > e.max * PHASE.at) return false;
    ph = e.ph = { st: 0, t: PHASE.tell, i: 0, shots: [] }; e.phased = true;
    banner(D.name, D.sub, '#ff7a7a', 2.6); sfx('roar'); sfx('fuse'); G.shake = Math.max(G.shake, 5);
  }
  if (!(D.ghost && ph.st) && Math.hypot(P.x - e.x, P.y - e.y) < e.r + P.r) hurtPlayer(2, e);
  if (D.hold) D.hold(e);
  for (const s of ph.shots) s.t += dt;
  if (ph.st === 0) {                  // the tell: it stands, flickers and draws the air in
    ph.t -= dt; e.flash = (Math.floor(ph.t * 14) & 1) ? 0.05 : 0;
    const a = fxr() * TAU, d = 34 + fxr() * 14; part(e.x + Math.cos(a) * d, e.y - 12 + Math.sin(a) * d, -Math.cos(a) * 70, -Math.sin(a) * 70, 0.45, D.col, 1);
    if (ph.t <= 0) { ph.st = 1; ph.t = 0; }
  } else if (ph.st === 1) {           // the pattern
    ph.t -= dt * (e.rage ? PHASE.fast : 1);
    if (ph.t <= 0) { if (!ph.i) D.start(e, ph); D.fire(e, ph, ph.i++); sfx('ebullet'); G.shake = Math.max(G.shake, 2); ph.t = D.every; if (ph.i >= D.n) { ph.st = 2; ph.t = PHASE.rest; } }
  } else { ph.t -= dt; if (ph.t <= 0) { e.ph = null; e.st = 0; e.stT = 1.0; } }
  return true;
}
function summonAdds(e, types, n, hpMul) { for (let i = 0; i < n; i++) { const a = rand() * TAU, s = spawnMon(pick(types), e.x + Math.cos(a) * 8, e.y + Math.sin(a) * 6 + 4, hpMul); s.kx = Math.cos(a) * 120; s.ky = Math.sin(a) * 120; } sfx('roar'); }
const BOSS_AI = {
  // Gatejaw: walks you down, then picks between a charge, a bullet ring and a summon.
  gatejaw(e, dt) {
    const P = G.P, dxp = P.x - e.x, dyp = P.y - e.y, dp = Math.hypot(dxp, dyp) || 1, rage = e.rage || e.hp < e.max * 0.5;
    e.stT -= dt;
    if (e.st === 0) {
      bossWalk(e, dt, e.def.spd * (rage ? 1.3 : 1), P);
      if (e.stT <= 0) {
        const r = rand();
        if (dp < 170 && r < 0.45 && los(e.x, e.y, P.x, P.y)) { e.st = 1; e.stT = 0.75; e.cx = dxp / dp; e.cy = dyp / dp; }
        else if (r < 0.8) { e.st = 3; e.stT = 0.7; }
        else { e.st = 4; e.stT = 0.6; }
      }
    } else if (e.st === 1) { if (e.stT <= 0) { e.st = 2; e.stT = 0.8; sfx('dash'); } }      // charge wind-up
    else if (e.st === 2) {            // charging
      const hit = moveBox(e, e.cx * 200 * dt, e.cy * 200 * dt, F_WALK, BOSS_R);
      part(e.x, e.y, 0, 0, 0.25, PAL.t, 2);
      if (hit) { e.st = 5; e.stT = 1.2; G.shake = Math.max(G.shake, 6); sfx('boom'); burst(e.x, e.y - 10, 14, PAL.t, 90); }
      else if (e.stT <= 0) { e.st = 0; e.stT = rr(1.4, 2.4); }
    } else if (e.st === 3 || e.st === 6) {   // bullet ring (a second, offset ring when enraged)
      if (e.stT <= 0) {
        const n = rage ? 16 : 12, off = rand() * TAU;
        for (let i = 0, y = shotY(e, 12); i < n; i++) { const a = off + i / n * TAU; fireEBullet(e.x, y, Math.cos(a), Math.sin(a), e.st === 6 ? 78 : 60); }
        sfx('ebullet'); G.shake = Math.max(G.shake, 2);
        if (rage && e.st === 3) { e.st = 6; e.stT = 0.4; } else { e.st = 0; e.stT = rr(1.8, 2.8); }
      }
    } else if (e.st === 4) { if (e.stT <= 0) { summonAdds(e, ['slime', 'bat', 'bones'], rage ? 6 : 4, 0.6); e.st = 0; e.stT = rr(1.8, 2.8); } }
    else if (e.st === 5) { if (e.stT <= 0) { e.st = 0; e.stT = 1.2; } }   // stunned after ramming a wall
    if (dp < e.r + P.r) hurtPlayer(2, e);
  },
  // Mother Morel: hops after you, rains spore clouds, leaps, broods. Her room's power is smothered while she is in it.
  morel(e, dt) {
    const P = G.P, dxp = P.x - e.x, dyp = P.y - e.y, dp = Math.hypot(dxp, dyp) || 1, rage = e.rage || e.hp < e.max * 0.5;
    e.stT -= dt; e.z = 0;
    const room = roomAt(e.x, e.y); if (room && room.def.tier !== 'x' && e.st !== 5) room.hexT = 0.3;
    if (e.st === 0) {
      bossWalk(e, dt, e.def.spd * (rage ? 1.3 : 1) * (0.3 + 1.4 * Math.abs(Math.sin(e.anim * 4))), P);
      if (e.stT <= 0) {
        const r = rand();
        if (r < 0.4) { e.st = 1; e.stT = 0.85; e.pts = []; for (let i = 0, n = rage ? 8 : 5; i < n; i++) { const a = rand() * TAU, d = i ? 18 + rand() * 46 : 0; e.pts.push([P.x + Math.cos(a) * d, P.y + Math.sin(a) * d]); } }
        else if (r < 0.75 && dp < 220) { e.st = 3; e.stT = 0.6; }
        else { e.st = 4; e.stT = 0.6; }
      }
    } else if (e.st === 1) {          // spore rain: the circles you see become clouds
      if (e.stT <= 0) { for (const p of e.pts) addZone(p[0], p[1], 15, rage ? 5 : 4, 'spore'); e.pts = null; sfx('ebullet'); e.st = 0; e.stT = rr(1.5, 2.3); }
    } else if (e.st === 3) { if (e.stT <= 0) { e.st = 5; e.stT = 0.7; e.jx = P.x; e.jy = P.y; e.sx = e.x; e.sy = e.y; sfx('dash'); } }   // crouch, then leap
    else if (e.st === 5) {            // airborne
      const k = 1 - Math.max(0, e.stT) / 0.7; e.x = lerp(e.sx, e.jx, k); e.y = lerp(e.sy, e.jy, k); e.z = Math.sin(k * Math.PI) * 42;
      if (e.stT <= 0) {
        e.z = 0; G.shake = Math.max(G.shake, 6); sfx('boom'); burst(e.x, e.y, 16, PAL.O, 100);
        const n = rage ? 16 : 11, off = rand() * TAU; for (let i = 0, y = shotY(e, 6); i < n; i++) fireEBullet(e.x, y, Math.cos(off + i / n * TAU), Math.sin(off + i / n * TAU), 62, 's_spore');
        e.st = 0; e.stT = rr(1.5, 2.3);
      }
      return;
    } else if (e.st === 4) { if (e.stT <= 0) { summonAdds(e, ['spore', 'bslime', 'moth'], rage ? 5 : 3, 0.6); e.st = 0; e.stT = rr(1.8, 2.6); } }
    if (dp < e.r + P.r) hurtPlayer(2, e);
  },
  // The Unmaker: drifts through your walls and takes the floor plan apart: latches doorways, breaches walls.
  unmaker(e, dt) {
    const P = G.P, dxp = P.x - e.x, dyp = P.y - e.y, dp = Math.hypot(dxp, dyp) || 1, rage = e.rage || e.hp < e.max * 0.5, room = G.curRoom;
    e.stT -= dt;
    const want = dp > 58 ? 1 : dp < 34 ? -0.6 : 0, sp = e.def.spd * (rage ? 1.35 : 1);
    e.x += dxp / dp * sp * want * dt; e.y += dyp / dp * sp * want * dt; if (Math.abs(dxp) > 4) e.face = dxp > 0 ? 1 : -1;
    if (e.st === 0) {
      if (e.stT <= 0) {
        const r = rand();
        if (rage && room && room.def.tier !== 'x') { room.hexT = Math.max(room.hexT, 3.5); sfx('hex'); }     // enraged: whatever room you hide in goes dark
        if (r < 0.24) { e.st = 1; e.stT = rage ? 2.6 : 2.0; e.shootT = 0; }
        else if (r < 0.44 && room && room.doors.some(d => d === 2) && G.jams.length < 5) { e.st = 2; e.stT = 1.0; e.room = room; sfx('fuse'); }
        else if (r < 0.62) { e.st = 3; e.stT = 1.2; e.room = room; e.wall = -1; if (room) for (let d = 0; d < 4; d++) if (canBreach(room, d) && !nbOf(room, d)) e.wall = d; sfx('dig'); }
        else if (r < 0.84) { e.st = 5; e.stT = 0.9; e.pts = []; for (let i = 0, n = rage ? 10 : 7; i < n; i++) { const a = rand() * TAU, d = i ? 14 + rand() * 60 : 0; e.pts.push([P.x + Math.cos(a) * d, P.y + Math.sin(a) * d]); } sfx('dig'); }
        else { e.st = 4; e.stT = 0.95; e.shootT = 0; }
      }
    } else if (e.st === 1) {          // spiral
      e.shootT -= dt;
      if (e.shootT <= 0) { e.shootT = 0.13; e.ang += 0.37; for (let k = 0; k < 4; k++) { const a = e.ang + k * TAU / 4; fireEBullet(e.x, e.y - 10, Math.cos(a), Math.sin(a), 76, 's_hexbolt'); } sfx('ebullet'); }
      if (e.stT <= 0) { e.st = 0; e.stT = rr(1.5, 2.2); }
    } else if (e.st === 2) {          // lockdown: every doorway of your room slams shut
      if (e.stT <= 0) {
        let n = 0; if (e.room) for (let d = 0; d < 4; d++) if (e.room.doors[d] === 2 && G.jams.length < 6) { const j = jamDoor(e.room, d); if (j) { n++; burst(j.x, j.y, 8, PAL.y, 70); } }
        if (n) { sfx('jam'); G.shake = Math.max(G.shake, 4); tip('latch', 'Latched gates stop you, not monsters. Lean on one to shove it open.'); }
        e.st = 0; e.stT = rr(1.6, 2.4);
      }
    } else if (e.st === 3) {          // breach: a new knocking door where you had a wall
      if (e.stT <= 0) {
        const res = e.room && e.wall >= 0 ? breachWall(e.room, e.wall) : null;
        if (res === 'door') {
          const d = G.sealed.find(q => q.room === e.room && q.dir === e.wall), mixl = floorMix();
          if (d) for (let i = 0; i < (rage ? 9 : 6); i++) d.queue.push(wpick(mixl, x => x[1])[0]);
          sfx('crack'); G.shake = Math.max(G.shake, 6); const p = doorPos(e.room, e.wall); burst(p.x, p.y, 22, PAL.t, 110);
          banner('THE WALL GIVES WAY', 'The Unmaker opened a new door.', '#e3bd88', 2.2);
        } else summonAdds(e, ['cinder', 'imp', 'bones'], rage ? 6 : 4, 0.6);
        e.st = 0; e.stT = rr(1.8, 2.6);
      }
    } else if (e.st === 5) {          // falling masonry: get out of the circles
      if (e.stT <= 0) {
        for (const p of e.pts) { G.fxs.push({ k: 'boom', x: p[0], y: p[1], R: 17, t: 0, d: 0.3 }); burst(p[0], p[1], 5, PAL.g, 70); if (Math.hypot(P.x - p[0], P.y - p[1]) < 16 && P.dashT <= 0) hurtPlayer(2, null, 'unmaker'); }
        e.pts = null; sfx('boom'); G.shake = Math.max(G.shake, 5); e.st = 0; e.stT = rr(1.3, 2.0);
      }
    } else if (e.st === 4) {          // three aimed fans
      e.shootT -= dt;
      if (e.shootT <= 0) { e.shootT = 0.3; fireFan(e, 78, rage ? 7 : 5, 's_hexbolt', P); }
      if (e.stT <= 0) { e.st = 0; e.stT = rr(1.5, 2.2); }
    }
    if (dp < e.r + P.r) hurtPlayer(2, e);
  },
};

// ---- room powers ----
function onRoomReady(room) {
  const P = G.P;
  G.shake = Math.max(G.shake, 2);
  for (const p of G.picks) if (p.k === 'glint') p.mag = true;          // a finished room inhales every loose glint in the dungeon
  if (room.type === 'den' && room.lair) { const m = spawnMon('mimic', room.lair.x, room.lair.y, 1); m.boon = room.boon; m.boonMul = room.boonMul; m.keys = roomLevel('den'); burst(m.x, m.y, 8, PAL.W); }
  else if (room.ped && room.boon) G.boons.push({ x: room.ped.x, y: room.ped.y, boon: room.boon, mul: room.boonMul, hidden: room.type === 'dice', t: 0 });
  if (room.type === 'apiary') syncBees();
  if (room.type === 'waygate' && !G.hearthPortal) { const h = G.rooms[0]; G.hearthPortal = { x: h.px + (WALL + 12) * T + 8, y: h.py + (WALL + 5) * T + 8 }; tip('waygate', 'Step onto a Waygate to hop to the Hearth and back.'); }
  if (room.type === 'stairs') { G.stairs = { x: room.stairs.x, y: room.stairs.y, open: false, hole: false }; summonBoss(room); }
  recalc();
  const ev = EVO_ROOM[room.type], w = ev && P.weapons.find(w => w.id === ev);
  if (w && !w.evo && w.lv >= WEAPONS[ev].max) tip('evo2', 'Walk into the ' + room.def.name + ' to evolve your ' + WEAPONS[ev].name + '.');
  for (const p of room.props) burst(p.x, p.y - 6, 3, PAL.W, 40);
}
function updateRooms(dt) {
  const P = G.P, cur = G.curRoom, sh = steelHaste(), cap = CURVE.cap(G.floor, G.t / 60);
  const inRoom = (room, fn) => { for (const e of G.mons) if (!e.dead && e.emerge <= 0 && roomAt(e.x, e.y) === room) fn(e); };
  for (const room of G.rooms) {
    BY = 'r:' + room.type;
    if (room.reveal < 1) { room.reveal = Math.min(1, room.reveal + dt / 0.9); if (room.reveal >= 1) onRoomReady(room); continue; }
    if (room.siegeT > 0) room.siegeT -= dt;
    if (room.hexT > 0) { room.hexT -= dt; if (room.hexT <= 0 && room.type === 'library') recalc(); continue; }   // hexed or besieged: switched off
    room.timer += dt;
    const here = room === cur, mul = roomMul(room);
    switch (room.type) {
      case 'fountain': {
        const f = room.fountain; room.charge = Math.min(1, room.charge + dt * mul / 24);
        if (room.charge >= 1 && P.hp < P.maxHp && Math.abs(P.x - f.x) < 42 && Math.abs(P.y - (f.y - 12)) < 36) { room.charge = 0; heal(2); floatText(P.x, P.y - 24, '+1 heart', '#9cecf2'); sparkle(f.x, f.y - 16, 14, PAL.c); }
        break; }
      case 'nook':
        room.charge = Math.min(1, room.charge + dt * mul / 24);
        if (here && room.charge >= 1 && P.hp < P.maxHp && P.stillT > 1.2) { room.charge = 0; heal(1); floatText(P.x, P.y - 24, '+half a heart', '#ff9ec4'); }
        break;
      case 'spring':
        if (here && G.tag[Math.floor(P.y / T) * GWT + Math.floor(P.x / T)] === TAG_POOL) {
          P.soakT += dt * mul; if (fxr() < 0.2) part(P.x + (fxr() - 0.5) * 20, P.y - 4, 0, -14, 0.8, PAL.w, 1);
          if (P.soakT > 9) { P.soakT = 0; addShield(roomLevel('spring')); }
        }
        break;
      case 'spikes': {
        const ph = (room.timer * sh) % 2.6, st = ph < 1.5 ? 0 : ph < 1.95 ? 1 : 2;
        if (st !== room.spikeSt) { room.spikeSt = st; if (st === 2) { room.tick = 0; if (here) sfx('spike'); } }
        if (st === 2) {
          room.tick -= dt;
          if (room.tick <= 0) {
            room.tick = 0.3; const id = room.id + 1, pow = 13 * roomPow(room);
            for (const e of G.mons) { if (e.dead || e.emerge > 0 || e.def.fly || e.def.phase) continue; const ti = Math.floor(e.y / T) * GWT + Math.floor(e.x / T); if (G.tag[ti] === TAG_SPIKE && G.tagRoom[ti] === id) hurtMon(e, pow, 0, 0, 0, 'room'); }
          }
        }
        break; }
      case 'guardian':
        for (const s of room.statues) {
          s.cd -= dt * sh; s.flash -= dt; if (s.cd > 0) continue;
          const t = nearestMon(s.x, s.y - 16, 130, true);
          if (!t) { s.cd = 0.2; continue; }
          const dx = t.x - s.x, dy = t.y - 3 - (s.y - 16), d = Math.hypot(dx, dy) || 1;
          shoot({ k: 'guard', x: s.x, y: s.y - 16, vx: dx / d * 230, vy: dy / d * 230, r: 3, dmg: 9 * roomPow(room), life: 0.8, src: 'room' });
          s.cd = 0.9; s.flash = 0.15; if (here) sfx('shoot');
        }
        break;
      case 'ballista': {
        const b = room.ballista; b.cd -= dt * sh; b.flash -= dt;
        if (b.cd <= 0) {                // look down each of the four rows for something to skewer
          let best = -1, bd = 230;
          for (const e of G.mons) {
            if (e.dead || e.emerge > 0) continue; const dx = e.x - b.x, dy = e.y - 3 - (b.y - 8);
            const d = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0), along = Math.max(Math.abs(dx), Math.abs(dy)), off = Math.min(Math.abs(dx), Math.abs(dy));
            if (off < 11 && along > 12 && along < bd && los(b.x, b.y - 8, e.x, e.y - 3)) { bd = along; best = d; }
          }
          if (best < 0) b.cd = 0.25;
          else { b.dir = best; b.spr = 'ballista' + best; b.cd = 2.6; b.flash = 0.2; shoot({ k: 'bolt', x: b.x, y: b.y - 8, vx: DIRS[best].x * 330, vy: DIRS[best].y * 330, r: 6, dmg: 26 * roomPow(room), life: 1.4, inf: 1, hits: new Map(), dir: best, src: 'room', kb: 1.5 }); if (here) sfx('swing'); }
        }
        break; }
      case 'saw': {
        room.tick -= dt; const bite = room.tick <= 0; if (bite) room.tick = 0.25;
        for (const s of room.saws) {
          s.x += s.v * dt * sh; if (s.x > s.x1) { s.x = s.x1; s.v = -Math.abs(s.v); } else if (s.x < s.x0) { s.x = s.x0; s.v = Math.abs(s.v); }
          if (bite) nearMons(s.x, s.yy, 9, e => { if (!e.def.fly && !e.def.phase && Math.hypot(e.x - s.x, e.y - s.yy) < 10 + e.r) { hurtMon(e, 9 * roomPow(room), 0, 0, 0, 'room'); if (here) sfx('saw'); } });
        }
        break; }
      case 'ember':
        room.tick -= dt;
        if (room.tick <= 0) {
          room.tick = 0.5; let any = false; const pow = 3.2 * roomPow(room);
          inRoom(room, e => { hurtMon(e, pow, 0, 0, 0, 'room'); any = true; part(e.x + (fxr() - 0.5) * 6, e.y - 6, 0, -30, 0.35, fxr() < 0.5 ? PAL.o : PAL.y, 2); });
          if (any && here) sfx('burn');
        }
        break;
      case 'powder':
        for (const b of room.barrels) {
          if (b.cd > 0) { b.cd -= dt; if (b.cd <= 0) { b.spr = 'barrel'; burst(b.x, b.y - 6, 4, PAL.T, 40); } continue; }
          let hit = false; nearMons(b.x, b.y - 4, 15, e => { if (!e.dead && e.emerge <= 0 && Math.hypot(e.x - b.x, e.y - (b.y - 4)) < 15 + e.r) hit = true; });
          if (hit) { explode(b.x, b.y - 6, 36, 26 * roomPow(room), 'room'); b.cd = 7; b.spr = 'barrel_spent'; }
        }
        break;
      case 'furnace': {
        const per = roomLevel('furnace') >= 3 ? 4 : 5; room.tick += dt; room.warn = room.tick > per - 0.7 ? per - room.tick : 0;
        if (room.tick >= per) {
          room.tick = 0; room.warn = 0; let any = false; const pow = 24 * roomPow(room);
          inRoom(room, e => { hurtMon(e, pow, 0, 0, 0, 'room'); any = true; });
          for (const v of room.vents) { G.fxs.push({ k: 'boom', x: v.x, y: v.y, R: 20, t: 0, d: 0.3 }); for (let i = 0; i < 4; i++) part(v.x + (fxr() - 0.5) * 10, v.y, (fxr() - 0.5) * 30, -40 - fxr() * 50, 0.5, fxr() < 0.5 ? PAL.o : PAL.y, 2); }
          if (here || any) { sfx('boom'); if (here) G.shake = Math.max(G.shake, 3); }
        }
        break; }
      case 'icicle':
        room.tick -= dt * (roomLevel('icicle') >= 3 ? 1.35 : 1);
        if (room.tick <= 0) {
          room.tick = 1.4; const list = []; inRoom(room, e => list.push(e));
          if (list.length) { const e = list[Math.floor(rand() * list.length)]; G.fxs.push({ k: 'icicle', x: e.x, y: e.y, t: 0, d: 0.22 }); hurtMon(e, 18 * roomPow(room), 0, 0, 0, 'room'); if (!e.dead && !e.def.boss) e.stun = Math.max(e.stun, 0.7); if (here) sfx('freeze'); }
        }
        break;
      case 'bramble':
        room.tick -= dt;
        if (room.tick <= 0) { room.tick = 0.5; const id = room.id + 1, pow = 4 * roomPow(room); for (const e of G.mons) { if (e.dead || e.emerge > 0 || e.def.fly || e.def.phase) continue; const ti = Math.floor(e.y / T) * GWT + Math.floor(e.x / T); if (G.tag[ti] === TAG_BRAMBLE && G.tagRoom[ti] === id) hurtMon(e, pow, 0, 0, 0, 'room'); } }
        break;
      case 'garden': {
        const p = room.patch;
        if (p.fruit && p.fruit.gone) p.fruit = null;
        if (!p.fruit) { room.grow += dt * mul; if (room.grow > 36) { room.grow = 0; p.fruit = dropPick('heart', p.x, p.y - 12); p.fruit.vx = p.fruit.vy = 0; sparkle(p.x, p.y - 12, 8, PAL.p); } }
        break; }
      case 'greenhouse':
        if (G.bossDown && !G.endless) break;                              // a floor whose warden is dead is quiet: nothing to farm
        room.grow += dt * mul;
        for (const p of room.planters) if (p.fruit && p.fruit.gone) p.fruit = null;
        if (room.grow > 20) {
          const p = room.planters.find(q => !q.fruit);
          if (p) { room.grow = 0; p.fruit = dropPick('glint', p.x, p.y - 12, Math.max(6, P.keyCost * 0.12)); p.fruit.vx = p.fruit.vy = 0; sparkle(p.x, p.y - 12, 8, PAL.l); } else room.grow = 20;
        }
        break;
      case 'vault': {
        const c = room.chest;
        if (!c.open && Math.abs(P.x - c.x) < 17 && Math.abs(P.y - (c.y - 4)) < 17) {
          c.open = true; c.spr = 'chest1'; sfx('chest'); G.shake = Math.max(G.shake, 2);
          const total = Math.max(14, P.keyCost * 0.75) * CURVE.stars[roomLevel('vault') - 1]; for (let i = 0; i < 14; i++) dropGlint(c.x, c.y - 4, total / 14);
          sparkle(c.x, c.y - 8, 16, PAL.y);
        }
        break; }
      case 'altar': {
        const a = room.altar, left = 1 + roomLevel('altar') - a.uses;
        if (here && left > 0 && P.hp > 2 && Math.abs(P.x - a.x) < 18 && Math.abs(P.y - (a.y + 6)) < 12 && !P.moving) {
          a.hold += dt; if (fxr() < 0.3) part(P.x + (fxr() - 0.5) * 12, P.y - 8, 0, -20, 0.5, PAL.r, 1);
          if (a.hold >= 1.1) { a.hold = 0; a.uses++; P.hp -= 2; P.altar++; P.hurtT = 0.3; sfx('hex'); G.shake = Math.max(G.shake, 3); sparkle(a.x, a.y - 14, 18, PAL.m); banner('THE ALTAR DRINKS', '+8% damage for the rest of the run.', '#ff9ec4', 2.4); }
        } else a.hold = Math.max(0, a.hold - dt * 2);
        break; }
      case 'grave':
        if (Math.abs(P.x - (room.px + CWP / 2)) < 420 && Math.abs(P.y - (room.py + CHP / 2)) < 300 && !G.bossDown && !G.demo)
          for (const gr of room.graves) { gr.cd -= dt; if (gr.cd <= 0) { gr.cd = rr(8, 11); if (G.mons.length < cap) { const e = spawnMon('bones', gr.x, gr.y + 8, 0.8); e.emerge = 0.35; burst(gr.x, gr.y + 4, 6, PAL.g, 50); } } }
        break;
    }
  }
  BY = null;
}
