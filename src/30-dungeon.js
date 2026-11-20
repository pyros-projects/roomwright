/* ============================== 9 DUNGEON ============================= */
let G = null;                         // the current run: all world state lives here
const inGrid = (cx, cy) => cx >= 0 && cy >= 0 && cx < GRID && cy < GRID;
const roomAt = (px, py) => { const cx = Math.floor(px / CWP), cy = Math.floor(py / CHP); return inGrid(cx, cy) ? G.cells[cy * GRID + cx] : null; };
const nbOf = (room, dir) => { const cx = room.cx + DIRS[dir].x, cy = room.cy + DIRS[dir].y; return inGrid(cx, cy) ? G.cells[cy * GRID + cx] : null; };
const roomLevel = type => G.roomLv[type] || 1;
function blocked(px, py, mask) {
  const tx = Math.floor(px / T), ty = Math.floor(py / T);
  if (tx < 0 || ty < 0 || tx >= GWT || ty >= GHT) return true;
  return (G.flags[ty * GWT + tx] & mask) !== 0;
}
const boxHits = (x, y, r, mask) => blocked(x - r, y - r, mask) || blocked(x + r, y - r, mask) || blocked(x - r, y + r, mask) || blocked(x + r, y + r, mask);
// axis-separated AABB slide. returns bit 1 if x was blocked, bit 2 if y was blocked
function moveBox(o, dx, dy, mask, r = o.r) {
  let hit = 0;
  if (dx) {
    const nx = o.x + dx;
    if (!boxHits(nx, o.y, r, mask)) o.x = nx;
    else { hit |= 1; const e = dx > 0 ? Math.floor((nx + r) / T) * T - r - 0.01 : (Math.floor((nx - r) / T) + 1) * T + r + 0.01; if (Math.abs(e - o.x) <= Math.abs(dx) + 0.5 && !boxHits(e, o.y, r, mask)) o.x = e; }
  }
  if (dy) {
    const ny = o.y + dy;
    if (!boxHits(o.x, ny, r, mask)) o.y = ny;
    else { hit |= 2; const e = dy > 0 ? Math.floor((ny + r) / T) * T - r - 0.01 : (Math.floor((ny - r) / T) + 1) * T + r + 0.01; if (Math.abs(e - o.y) <= Math.abs(dy) + 0.5 && !boxHits(o.x, e, r, mask)) o.y = e; }
  }
  return hit;
}
function los(x0, y0, x1, y1) {        // line of sight for shots
  const dx = x1 - x0, dy = y1 - y0, n = Math.ceil(Math.hypot(dx, dy) / 7);
  for (let i = 1; i < n; i++) if (blocked(x0 + dx * i / n, y0 + dy * i / n, F_SHOT)) return false;
  return true;
}
// tile rect (cell-local) of a door passage, by wall direction
const doorRect = dir => dir === 0 ? { x: 9, y: 0, w: 3, h: 2 } : dir === 2 ? { x: 9, y: 13, w: 3, h: 2 } : dir === 3 ? { x: 0, y: 6, w: 2, h: 3 } : { x: 19, y: 6, w: 2, h: 3 };
function doorPos(room, dir) { const r = doorRect(dir); return { x: room.px + (r.x + r.w / 2) * T, y: room.py + (r.y + r.h / 2) * T, nx: -DIRS[dir].x, ny: -DIRS[dir].y }; }
function setDoorFlags(room, dir, value) {      // 0 = open passage, F_ALL = wall / sealed, F_PLAYER = latched gate
  const r = doorRect(dir), ox = room.cx * CWT, oy = room.cy * CHT;
  for (let y = 0; y < r.h; y++) for (let x = 0; x < r.w; x++) G.flags[(oy + r.y + y) * GWT + ox + r.x + x] = value;
}

// ---- room construction ----
// doors[d]: 0 = wall, 1 = sealed (knocking), 2 = open passage, 3 = open but latched by a monster.
// `from` = entry side for the reveal ripple (undefined = appear instantly).
const TAG_SPIKE = 1, TAG_POOL = 2, TAG_BRAMBLE = 3;
function buildRoom(cx, cy, type, doors, from) {
  const def = ROOM_TYPES[type];
  const room = { id: G.rooms.length, cx, cy, px: cx * CWP, py: cy * CHP, type, def, el: def.el, doors: doors.slice(), seed: ri(1, 999999), layout: pick(def.layouts),
    props: [], decor: [], spikes: [], statues: [], barrels: [], saws: [], hives: [], planters: [], graves: [], vents: [],
    reveal: from === undefined ? 1 : 0, from: from === undefined ? 2 : from, timer: 0, tick: 0, charge: 1, grow: 0, used: false, hexT: 0, warn: 0, res: 0, resDir: [0, 0, 0, 0],
    canvas: mkCanvas(CWP, CHP), ped: null, fountain: null, chest: null, patch: null, lair: null, ballista: null, well: null, altar: null, portal: null, stairs: null, seen: false, boon: null, boonMul: 1 };
  const ox = cx * CWT, oy = cy * CHT, F = G.flags;
  for (let y = 0; y < CHT; y++) for (let x = 0; x < CWT; x++) { const i = (oy + y) * GWT + ox + x; F[i] = (x < WALL || y < WALL || x >= CWT - WALL || y >= CHT - WALL) ? F_ALL : 0; G.tag[i] = 0; G.tagRoom[i] = 0; }
  for (let d = 0; d < 4; d++) if (room.doors[d] === 2) setDoorFlags(room, d, 0);
  const SOFT = F_WALK | F_FLY | F_SHOT;   // blocks everything but is not a "hard" wall
  for (let y = 0; y < IH; y++) for (let x = 0; x < IW; x++) {
    const ch = room.layout[y][x]; if (ch === '.') continue;
    const tx = ox + WALL + x, ty = oy + WALL + y, wx = tx * T + 8, wy = ty * T + 8, fi = ty * GWT + tx;
    const prop = (kind, spr, extra) => { const p = Object.assign({ kind, spr, x: wx, y: ty * T + 14, room }, extra); room.props.push(p); return p; };
    const tag = t => { G.tag[fi] = t; G.tagRoom[fi] = room.id + 1; };
    const bake = (spr, dy) => room.decor.push({ spr, x: (x + WALL) * T + 8, y: (y + WALL) * T + (dy || 12) });
    switch (ch) {
      case '#': F[fi] = SOFT; prop('pillar', 'pillar'); break;
      case '~': F[fi] = F_WALK; break;
      case 'w': tag(TAG_POOL); break;
      case '^': room.spikes.push({ tx, ty }); tag(TAG_SPIKE); break;
      case '%': tag(TAG_BRAMBLE); break;
      case 'P': room.ped = { x: wx, y: wy }; prop('pedestal', 'pedestal', { y: wy + 5 }); break;
      case 'F': for (let j = 0; j < 2; j++) for (let i = -1; i <= 1; i++) F[(ty + j) * GWT + tx + i] = F_WALK;
        room.fountain = prop('fountain', 'fountain0', { y: ty * T + 26 }); break;
      case 'S': F[fi] = SOFT; room.statues.push(prop('statue', 'statue', { cd: rr(0.2, 1), flash: 0 })); break;
      case 'B': F[fi] = F_WALK; prop('brazier', 'brazier', { ph: rr(0, 9) }); break;
      case 'X': F[fi] = SOFT; prop('crystal', 'crystal'); break;
      case 'C': F[fi] = F_WALK; room.chest = prop('chest', 'chest0', { open: false }); break;
      case 'M': F[fi] = F_WALK; room.patch = prop('shroom', 'shroom', { fruit: null }); break;
      case 'c': F[fi] = F_WALK; prop('campfire', 'logs', { ph: 0 }); break;
      case 'b': F[fi] = SOFT; prop('shelf', 'shelf', { y: ty * T + 15 }); break;
      case 'o': F[fi] = F_WALK; prop('pot', 'pot'); break;
      case 'n': bake('bonepile', 10); break;
      case 'D': room.lair = { x: wx, y: wy }; break;
      case 'r': F[fi] = F_WALK; room.barrels.push(prop('barrel', 'barrel', { cd: 0 })); break;
      case 'v': bake('vent', 8); room.vents.push({ x: wx, y: wy }); break;
      case 'i': F[fi] = F_WALK; prop('candle', 'candle', { ph: rr(0, 9) }); break;
      case 'L': F[fi] = F_WALK | F_FLY; room.ballista = prop('ballista', 'ballista1', { cd: 1.5, dir: 1, flash: 0 }); break;
      case 's': room.saws.push(prop('saw', 'saw0', { x0: room.px + (WALL + 2) * T + 8, x1: room.px + (WALL + 14) * T + 8, v: x < 8 ? 64 : -64, y: wy + 6, yy: wy })); break;
      case 'W': F[fi] = F_WALK; prop('bench', 'bench'); break;
      case 'O': F[fi] = F_WALK; room.well = prop('well', 'well', { y: ty * T + 16 }); break;
      case 'm': F[fi] = F_WALK; prop('desk', 'desk_map'); break;
      case 'g': F[fi] = F_WALK; prop('desk', 'desk_coin'); break;
      case 'q': F[fi] = F_WALK; prop('desk', 'desk_book'); break;
      case 'T': F[fi] = F_WALK; prop('scope', 'scope'); break;
      case 'H': F[fi] = F_WALK; room.hives.push(prop('hive', 'hive')); break;
      case 'h': F[fi] = SOFT; prop('hedge', 'hedge', { y: ty * T + 15 }); break;
      case 'p': F[fi] = F_WALK; room.planters.push(prop('planter', 'planter', { fruit: null })); break;
      case 'd': F[fi] = F_WALK; prop('die', 'die'); break;
      case 'A': F[fi] = F_WALK; room.altar = prop('altar', 'altar', { uses: 0, hold: 0 }); break;
      case 'G': F[fi] = F_WALK; room.graves.push(prop('grave', 'grave', { cd: rr(4, 9) })); break;
      case 'Q': room.portal = { x: wx, y: wy }; break;
      case 'E': room.stairs = { x: wx, y: wy }; break;
      case 'j': bake('snow', 12); break;
      case 'k': bake('shroom', 12); break;
    }
  }
  G.cells[cy * GRID + cx] = room; G.rooms.push(room);
  paintRoom(room);
  return room;
}
function openDoor(room, dir) { if (room.doors[dir] >= 2) return; room.doors[dir] = 2; setDoorFlags(room, dir, 0); paintRoom(room); }

// What would a room placed at (cx,cy), entered from `entry`, with wanted exits `want[4]`, look like?
function planDoors(cx, cy, entry, want) {
  const doors = [0, 0, 0, 0]; let fresh = 0, links = 0;
  for (let s = 0; s < 4; s++) {
    if (s === entry) { doors[s] = 2; continue; }
    const nx = cx + DIRS[s].x, ny = cy + DIRS[s].y;
    if (!inGrid(nx, ny)) continue;
    const nb = G.cells[ny * GRID + nx];
    if (nb) { if (nb.doors[(s + 2) % 4] === 1) { doors[s] = 2; links++; } }     // a neighbour's sealed door always links up
    else if (want[s]) { doors[s] = 1; fresh++; }
  }
  return { doors, fresh, links };
}
// rebuild the list of sealed doors (the monster spawners), keeping per-door state
function refreshSealed() {
  const old = new Map(G.sealed.map(d => [d.room.id * 4 + d.dir, d]));
  G.sealed = [];
  for (const room of G.rooms) for (let dir = 0; dir < 4; dir++) if (room.doors[dir] === 1) {
    let d = old.get(room.id * 4 + dir);
    if (!d) { const p = doorPos(room, dir); d = { room, dir, x: p.x, y: p.y, nx: p.nx, ny: p.ny, queue: [], st: 0, tel: 0, emit: 0, shake: 0, blink: rr(1, 4), eyes: ri(1, 2), cards: null, push: 0, hold: false, near: false, rerolled: 0 }; }
    G.sealed.push(d);
  }
}

// ---- resonance: a room is stronger for every connected neighbour that shares its element ----
const resonates = (a, b) => a.el === b.el || a.el === 'stone' || b.el === 'stone';
function resWorth(nb) { const lv = roomLevel(nb.type); return nb.type === 'hall' ? [1, 1.5, 2][lv - 1] : nb.type === 'grand' ? [2, 2.5, 3][lv - 1] : 1; }
function recalcLinks() {
  for (const r of G.rooms) {
    r.res = 0;
    for (let d = 0; d < 4; d++) { r.resDir[d] = 0; if (r.doors[d] < 2) continue; const nb = nbOf(r, d); if (nb && resonates(r, nb)) { r.res += resWorth(nb); r.resDir[d] = 1; } }
  }
}
// how much resonance a room of `type` would get if placed at (cx,cy) with these doors
function previewRes(cx, cy, type, doors) {
  let res = 0; const me = { el: ROOM_TYPES[type].el };
  for (let d = 0; d < 4; d++) { if (doors[d] < 2) continue; const nx = cx + DIRS[d].x, ny = cy + DIRS[d].y, nb = inGrid(nx, ny) ? G.cells[ny * GRID + nx] : null; if (nb && resonates(me, nb)) res += resWorth(nb); }
  return res;
}

// ---- latched gates: a Latchling can lock an open doorway. Monsters slip through; you have to shove it open ----
function jamDoor(room, dir) {
  if (room.doors[dir] !== 2) return null; const nb = nbOf(room, dir), od = (dir + 2) % 4; if (!nb) return null;
  room.doors[dir] = 3; nb.doors[od] = 3; setDoorFlags(room, dir, F_PLAYER); setDoorFlags(nb, od, F_PLAYER);
  const p = doorPos(room, dir), j = { a: room, dir, b: nb, x: p.x + DIRS[dir].x * 16, y: p.y + DIRS[dir].y * 16, horiz: !(dir & 1), push: 0, t: 0 };
  G.jams.push(j); return j;
}
function unjam(j) {
  const od = (j.dir + 2) % 4; j.a.doors[j.dir] = 2; j.b.doors[od] = 2; setDoorFlags(j.a, j.dir, 0); setDoorFlags(j.b, od, 0);
  const i = G.jams.indexOf(j); if (i >= 0) G.jams.splice(i, 1);
}
// ---- breaches: a Sapper can tunnel through a doorless wall. Into the void = a new knocking door; into a room = a new doorway ----
function canBreach(room, dir) { return room.doors[dir] === 0 && inGrid(room.cx + DIRS[dir].x, room.cy + DIRS[dir].y) && room.reveal >= 1; }
function breachWall(room, dir) {
  if (!canBreach(room, dir)) return null;
  const nb = nbOf(room, dir);
  if (nb) { if (nb.reveal < 1) return null; openDoor(room, dir); openDoor(nb, (dir + 2) % 4); recalcLinks(); computeFlow(true); return 'link'; }
  room.doors[dir] = 1; refreshSealed(); return 'door';
}

// ---- room painting: floor + wall ring baked into one canvas per room ----
function paintTile(buf, ox, oy, tx, ty, th, seed) {
  const b = th.k[0], l = th.k[1], d = th.k[2], g = th.k[3], h = hash2(tx, ty, seed);
  const R = i => hash2(tx * 31 + i, ty * 17 + i * 7, seed + 99);
  switch (th.style) {
    case 'slab': case 'basalt': {
      buf.rect(ox, oy, 16, 16, h > 0.8 ? th.k5 : h < 0.15 ? th.k4 : b);
      buf.rect(ox, oy, 16, 1, l); buf.rect(ox, oy, 1, 16, l); buf.rect(ox, oy + 15, 16, 1, g); buf.rect(ox + 15, oy, 1, 16, g);
      for (let i = 0; i < 4; i++) buf.set(ox + 2 + Math.floor(R(i) * 12), oy + 2 + Math.floor(R(i + 10) * 12), i & 1 ? d : l);
      if (th.style === 'slab' && h > 0.4 && h < 0.47) for (let i = 0; i < 6; i++) buf.set(ox + 4 + i, oy + 5 + i + (i > 2 ? 1 : 0), g);
      if (th.style === 'basalt' && h < 0.24) {                        // glowing lava seam
        const y0 = 3 + Math.floor(R(1) * 9), la = c32('#f6923a'), lb = c32('#ffd95e'), lc = c32('#8a2f2a');
        for (let x = 1; x < 15; x++) { const y = y0 + Math.round(Math.sin((x + h * 60) * 0.9) * 1.6); buf.set(ox + x, oy + y - 1, lc); buf.set(ox + x, oy + y, x % 3 ? la : lb); buf.set(ox + x, oy + y + 1, lc); }
      }
      break; }
    case 'slab2': {
      buf.rect(ox, oy, 16, 16, hash2(tx >> 1, ty >> 1, seed) > 0.7 ? th.k5 : b);
      if (!(ty & 1)) buf.rect(ox, oy, 16, 1, l); else buf.rect(ox, oy + 15, 16, 1, g);
      if (!(tx & 1)) buf.rect(ox, oy, 1, 16, l); else buf.rect(ox + 15, oy, 1, 16, g);
      for (let i = 0; i < 3; i++) buf.set(ox + 2 + Math.floor(R(i) * 12), oy + 2 + Math.floor(R(i + 10) * 12), d);
      break; }
    case 'checker': {
      const alt = (tx + ty) & 1;
      buf.rect(ox, oy, 16, 16, alt ? b : th.k4); buf.rect(ox, oy, 16, 1, l); buf.rect(ox, oy, 1, 16, l); buf.rect(ox, oy + 15, 16, 1, d); buf.rect(ox + 15, oy, 1, 16, d);
      buf.rect(ox + 7, oy + 7, 2, 2, alt ? d : b);
      break; }
    case 'plank': case 'cobble': {
      const span = th.style === 'plank' ? 32 : 16;
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
        const row = ty * 2 + (y >> 3), gx = tx * 16 + x + (row & 1) * (span >> 1), pid = Math.floor(gx / span), v = hash2(pid, row, seed);
        let c = v < 0.33 ? b : v < 0.66 ? th.k4 : th.k5;
        if ((y & 7) === 7 || gx % span === span - 1) c = g; else if ((y & 7) === 0) c = l;
        else if (th.style === 'plank' && hash2(gx >> 2, row * 8 + (y & 7), seed + 5) > 0.93) c = d;
        buf.set(ox + x, oy + y, c);
      }
      break; }
    case 'grass': {
      buf.rect(ox, oy, 16, 16, h > 0.7 ? th.k4 : b);
      for (let i = 0; i < 7; i++) { const x = Math.floor(R(i) * 15), y = Math.floor(R(i + 20) * 14); buf.set(ox + x, oy + y, l); buf.set(ox + x, oy + y + 1, d); }
      if (h < 0.16) { const x = 3 + Math.floor(R(40) * 10), y = 3 + Math.floor(R(41) * 10), pc = c32([PAL.w, PAL.y, PAL.p][Math.floor(R(42) * 3)]); buf.set(ox + x, oy + y, c32(PAL.Y)); buf.set(ox + x - 1, oy + y, pc); buf.set(ox + x + 1, oy + y, pc); buf.set(ox + x, oy + y - 1, pc); buf.set(ox + x, oy + y + 1, pc); }
      break; }
    case 'ice': {
      buf.rect(ox, oy, 16, 16, b);
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const s = x + y + tx * 16 + ty * 16; if (s % 19 < 2 && hash2(Math.floor(s / 19), (x - y + tx * 16 - ty * 16 + 4096) >> 3, seed) > 0.45) buf.set(ox + x, oy + y, l); }
      for (let i = 0; i < 16; i += 2) { buf.set(ox + i, oy + 15, d); buf.set(ox + 15, oy + i, d); }
      buf.set(ox + 2 + Math.floor(R(1) * 12), oy + 2 + Math.floor(R(2) * 12), c32('#ffffff'));
      break; }
  }
}
function paintWater(buf, ox, oy, tx, ty, seed, nb, shallow) {   // nb bits: 1 N, 2 E, 4 S, 8 W neighbours are water too
  const w1 = c32(shallow ? '#6cc4dc' : '#3f84d8'), w2 = c32(shallow ? '#b4ecf4' : '#6cb2f2'), w3 = c32(shallow ? '#4a9cc0' : '#2d5fae'), rim = c32(shallow ? '#3a7a98' : '#22355e');
  buf.rect(ox, oy, 16, 16, w1);
  for (let i = 0; i < 3; i++) buf.rect(ox + Math.floor(hash2(tx + i, ty, seed) * 11), oy + 3 + Math.floor(hash2(tx, ty + i, seed + 3) * 11), 4, 1, w2);
  if (!(nb & 1)) { buf.rect(ox, oy, 16, shallow ? 2 : 4, w3); buf.rect(ox, oy, 16, 1, rim); }
  if (!(nb & 4)) buf.rect(ox, oy + 15, 16, 1, rim);
  if (!(nb & 8)) buf.rect(ox, oy, 1, 16, rim);
  if (!(nb & 2)) buf.rect(ox + 15, oy, 1, 16, rim);
}
function wallPixel(wk, u, d, seed) {  // u = along the wall, d = 0 at the outer ridge .. 31 at the floor
  if (d === 0) return wk.seam;
  if (d < 7) return (d > 1 && d < 6 && hash2(u, d, seed) > 0.93) ? wk.lip : wk.top;
  if (d === 7) return wk.lip;
  if (d >= 29) return d === 29 ? wk.mortar : wk.base;
  const dd = d - 8, course = Math.floor(dd / 7), r = dd % 7, uu = u + (course & 1) * 8;
  if (r === 6 || uu % 16 === 15) return wk.mortar;
  if (r === 0) return wk.hi;
  if (r === 5) return wk.lo;
  const hv = hash2(Math.floor(uu / 16), course, seed);
  return hv > 0.8 ? wk.lo : hv < 0.16 ? wk.hi2 : wk.mid;
}
const SIDE_LIGHT = [1.0, 0.86, 0.74, 0.86];
const JAMB = { ol: c32('#2a2238'), hi: c32('#e4dccb'), mid: c32('#b3ac9c'), lo: c32('#7d776e') };
const RUGS = {                        // [tx, ty, tw, th, fill, border, trim]
  hearth: [5, 3, 7, 5, '#b8404a', '#7c2638', '#f0c060'], nook: [5, 3, 7, 5, '#4a6fb8', '#2f4480', '#e8d090'], library: [4, 2, 9, 7, '#7a2f4a', '#4e1c34', '#d8a850'],
  vault: [6, 3, 5, 5, '#c8963c', '#8a5e24', '#ffe090'], grand: [3, 4, 11, 3, '#a03048', '#6a1c30', '#f0c060'], chapel: [6, 2, 5, 7, '#7a4a9a', '#4e2c6a', '#f0d080'],
  dice: [5, 3, 7, 5, '#2f7a4a', '#1c4e30', '#e8e0a0'], script: [5, 3, 7, 5, '#3a5a8a', '#24385a', '#d8c080'], maproom: [6, 3, 6, 5, '#8a6a3a', '#5a4424', '#e8d090'],
  counting: [5, 4, 7, 3, '#3a6a4a', '#244a30', '#ffd95e'], stairs: [5, 3, 7, 5, '#3a3a52', '#26263a', '#c8c8e0'], altar: [6, 2, 5, 3, '#5a1c30', '#3a1020', '#d04a60'],
};
function paintRoom(room) {
  const th = themeFor(room.type, G.floor), buf = new PixBuf(CWP, CHP), seed = room.seed, lay = room.layout;
  const isW = (x, y, c) => x >= 0 && y >= 0 && x < IW && y < IH && lay[y][x] === c;
  // floor
  for (let y = 0; y < IH; y++) for (let x = 0; x < IW; x++) {
    const ox = (x + WALL) * T, oy = (y + WALL) * T, ch = lay[y][x];
    if (ch === '~' || ch === 'w') paintWater(buf, ox, oy, x, y, seed, (isW(x, y - 1, ch) ? 1 : 0) | (isW(x + 1, y, ch) ? 2 : 0) | (isW(x, y + 1, ch) ? 4 : 0) | (isW(x - 1, y, ch) ? 8 : 0), ch === 'w');
    else {
      paintTile(buf, ox, oy, x, y, th, seed);
      if (ch === '^') { buf.rect(ox + 1, oy + 1, 14, 14, th.k[2]); buf.rect(ox + 1, oy + 1, 14, 1, th.k[3]); buf.rect(ox + 1, oy + 1, 1, 14, th.k[3]); for (const [hx, hy] of [[4, 4], [11, 4], [4, 11], [11, 11]]) buf.rect(ox + hx - 1, oy + hy, 3, 2, c32('#1a1426')); }
      if (ch === '%') {               // brambles: a tangle of thorny vines over the grass
        const v1 = c32('#2e6a3a'), v2 = c32('#1f4a2a'), tip = c32('#d8e8a0');
        for (let i = 0; i < 16; i++) { const yy = 3 + Math.round(Math.sin((i + x * 5) * 0.8) * 2), y2 = 11 + Math.round(Math.cos((i + y * 3) * 0.9) * 2); buf.set(ox + i, oy + yy, v1); buf.set(ox + i, oy + yy + 1, v2); buf.set(ox + i, oy + y2, v1); buf.set(ox + i, oy + y2 + 1, v2); if (i % 4 === 1) { buf.set(ox + i, oy + yy - 1, tip); buf.set(ox + i + 1, oy + y2 - 1, tip); } }
      }
      if (ch === 's' || (y === 2 || y === 8) && room.type === 'saw' && x >= 2 && x <= 14) buf.rect(ox, oy + 7, 16, 2, th.k[3]);   // saw track
    }
  }
  // wall ring (all four inner faces visible, like a 16-bit top-down dungeon)
  for (let y = 0; y < CHP; y++) for (let x = 0; x < CWP; x++) {
    const dn = y, ds_ = CHP - 1 - y, dw = x, de = CWP - 1 - x, d = Math.min(dn, ds_, dw, de);
    if (d >= 32) { if (x > 32 && y >= 32 && y < CHP - 32) x = Math.max(x, CWP - 33); continue; }
    const side = d === dn ? 0 : d === ds_ ? 2 : d === dw ? 3 : 1, u = (side & 1) ? y : x;
    buf.d[y * CWP + x] = mul32(wallPixel(th.wk, u, d, seed + side), SIDE_LIGHT[side]);
  }
  // open doorways: threshold floor + stone jambs
  const map = (side, u, d) => side === 0 ? [u, d] : side === 2 ? [u, CHP - 1 - d] : side === 3 ? [d, u] : [CWP - 1 - d, u];
  for (let side = 0; side < 4; side++) {
    if (room.doors[side] < 2) continue;
    const u0 = (side & 1) ? CHP / 2 : CWP / 2;
    for (let d = 0; d < 32; d++) for (let u = u0 - 32; u < u0 + 32; u++) {
      const a = Math.abs(u + 0.5 - u0); let c;
      if (a >= 24) { const j = Math.floor(32 - a); c = j === 0 || j === 7 ? JAMB.ol : j < 3 ? JAMB.hi : j < 6 ? JAMB.mid : JAMB.lo; if (d >= 30) c = JAMB.lo; if (d === 31 || d === 0) c = JAMB.ol; }
      else { const v = u - (u0 - 24); c = (v % 16 === 15 || d % 16 === 15) ? th.k[3] : (v % 16 === 0 || d % 16 === 0) ? th.k[0] : th.k[2]; c = mul32(c, d < 16 ? 0.5 + d * 0.03 : 1); if (a >= 22) c = mul32(c, 0.7); }
      const p = map(side, u, d); buf.set(p[0], p[1], c);
    }
  }
  // soft shadow the walls cast onto the floor
  const SH = [0.6, 0.7, 0.8, 0.9, 0.96];
  for (let i = 0; i < 5; i++) for (let x = 32; x < CWP - 32; x++) buf.dim(x, 32 + i, SH[i]);
  for (let i = 0; i < 2; i++) for (let y = 37; y < CHP - 32; y++) buf.dim(32 + i, y, i ? 0.93 : 0.82);
  buf.toCanvas(room.canvas);
  // baked decor
  const g = room.canvas.getContext('2d'), rg = RUGS[room.type];
  if (rg) {
    const x = (rg[0] + WALL) * T + 3, y = (rg[1] + WALL) * T + 3, w = rg[2] * T - 6, h = rg[3] * T - 6;
    g.fillStyle = rg[5]; g.fillRect(x, y, w, h); g.fillStyle = rg[4]; g.fillRect(x + 2, y + 2, w - 4, h - 4);
    g.fillStyle = rg[6]; g.fillRect(x + 4, y + 4, w - 8, 1); g.fillRect(x + 4, y + h - 5, w - 8, 1); g.fillRect(x + 4, y + 4, 1, h - 8); g.fillRect(x + w - 5, y + 4, 1, h - 8);
    for (let i = 8; i < w - 8; i += 8) g.fillRect(x + i, y + (h >> 1) - 1, 2, 2);
    g.fillStyle = rg[5]; for (let j = 1; j < h; j += 2) { g.fillRect(x - 1, y + j, 1, 1); g.fillRect(x + w, y + j, 1, 1); }
  }
  for (const dcr of room.decor) ds(g, SPR[dcr.spr], dcr.x, dcr.y);
  for (const sx of [88, 247]) ds(g, SPR.sconce, sx, 24);
  // wall plaques: the room's element, and its stars once it has been levelled up
  if (room.type !== 'hearth' && room.type !== 'stairs') {
    ds(g, SPR['e_' + room.el], 52, 17);
    const lv = roomLevel(room.type); if (lv > 1) for (let i = 0; i < lv; i++) txo(g, '`', CWP - 62 + i * 7, 10, '#ffd95e', '#1a1426');
  }
}
function repaintType(type) { for (const r of G.rooms) if (r.type === type) paintRoom(r); }

// ---- flow field: one BFS from the player per walker class; monsters just follow `next` ----
const _q = new Int32Array(GWT * GHT);
const N8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
function bfs(mask, dist, next, sx, sy) {
  dist.fill(65535); const F = G.flags; let head = 0, tail = 0; const s = sy * GWT + sx;
  dist[s] = 0; next[s] = s; _q[tail++] = s;
  while (head < tail) {
    const i = _q[head++], x = i % GWT, y = (i - x) / GWT, d = dist[i] + 1;
    for (let k = 0; k < 8; k++) {
      const nx = x + N8[k][0], ny = y + N8[k][1]; if (nx < 0 || ny < 0 || nx >= GWT || ny >= GHT) continue;
      const ni = ny * GWT + nx; if (dist[ni] !== 65535 || (F[ni] & mask)) continue;
      if (k >= 4 && ((F[y * GWT + nx] & mask) || (F[ny * GWT + x] & mask))) continue;   // no corner cutting
      dist[ni] = d; next[ni] = i; _q[tail++] = ni;
    }
  }
}
function computeFlow(force) {
  const P = G.P, tx = Math.floor(P.x / T), ty = Math.floor(P.y / T), ti = ty * GWT + tx;
  if (!force && (ti === G.flowTile || G.t - G.flowT < 0.1)) return;
  G.flowTile = ti; G.flowT = G.t;
  bfs(F_WALK, G.distG, G.nextG, tx, ty); bfs(F_FLY, G.distF, G.nextF, tx, ty);
}
