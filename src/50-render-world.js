/* =========================== 14a RENDER: world ======================== */
let frameT = 0;                       // wall-clock for ambient animation (keeps ticking in menus)
const FACE = ['U', 'R', 'D', 'R'];
const heroSpr = (face, fr) => SPR[G.hero + FACE[face] + fr];
const drawList = [];
let vignette = null;
function panel(g, x, y, w, h, border = '#8e9cc0', fill = '#1f1a36') {
  x = Math.round(x); y = Math.round(y);
  g.fillStyle = '#0d0a1a'; g.fillRect(x + 1, y, w - 2, h); g.fillRect(x, y + 1, w, h - 2);
  g.fillStyle = border; g.fillRect(x + 2, y + 1, w - 4, h - 2); g.fillRect(x + 1, y + 2, w - 2, h - 4);
  g.fillStyle = fill; g.fillRect(x + 3, y + 2, w - 6, h - 4); g.fillRect(x + 2, y + 3, w - 4, h - 6);
  g.fillStyle = 'rgba(255,255,255,0.05)'; g.fillRect(x + 3, y + 2, w - 6, Math.min(9, h - 4));
}
function pxRing(g, x, y, r, col, squash = 1) { g.fillStyle = col; const n = Math.max(12, Math.floor(r * 4.2)); for (let i = 0; i < n; i++) { const a = i / n * TAU; g.fillRect(Math.round(x + Math.cos(a) * r), Math.round(y + Math.sin(a) * r * squash), 1, 1); } }
function pxLine(g, x0, y0, x1, y1, w = 1) { const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)))); for (let i = 0; i <= n; i++) g.fillRect(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), w, w); }

function drawVoid(g, cx, cy) {
  const F = G.F, c0 = Math.max(0, Math.floor(cx / CWP)), c1 = Math.min(GRID - 1, Math.floor((cx + VW) / CWP)), r0 = Math.max(0, Math.floor(cy / CHP)), r1 = Math.min(GRID - 1, Math.floor((cy + VH) / CHP));
  for (let y = r0; y <= r1; y++) for (let x = c0; x <= c1; x++) {
    if (G.cells[y * GRID + x]) continue;
    const px = x * CWP - cx, py = y * CHP - cy;
    g.fillStyle = F.grid;             // dashed blueprint outline of the unbuilt cell
    for (let i = 4; i < CWP; i += 8) { g.fillRect(px + i, py + 2, 3, 1); g.fillRect(px + i, py + CHP - 3, 3, 1); }
    for (let i = 4; i < CHP; i += 8) { g.fillRect(px + 2, py + i, 1, 3); g.fillRect(px + CWP - 3, py + i, 1, 3); }
    for (let j = 24; j < CHP; j += 48) for (let i = 24; i < CWP; i += 48) g.fillRect(px + i, py + j, 2, 2);
  }
  for (const d of G.sealed) {         // a big faint "?" in every cell a sealed door leads to
    const fx_ = (d.room.cx + DIRS[d.dir].x) * CWP + CWP / 2 - cx, fy = (d.room.cy + DIRS[d.dir].y) * CHP + CHP / 2 - cy;
    if (fx_ > -30 && fx_ < VW + 30 && fy > -40 && fy < VH + 40) txt(g, '?', fx_, fy - 16 + Math.round(Math.sin(frameT * 2 + d.room.id) * 2), F.mark, 0.5, 4);
  }
}
function drawReveal(g, r, cx, cy) {   // a freshly drafted room drops in tile by tile, rippling out from the door you used
  const px = r.px - cx, py = r.py - cy, k = r.reveal, e = doorRect(r.from), ex = e.x + e.w / 2, ey = e.y + e.h / 2;
  g.fillStyle = 'rgba(63,193,173,' + (0.6 * (1 - k)).toFixed(3) + ')';
  g.fillRect(px + 2, py + 2, CWP - 4, 1); g.fillRect(px + 2, py + CHP - 3, CWP - 4, 1); g.fillRect(px + 2, py + 2, 1, CHP - 4); g.fillRect(px + CWP - 3, py + 2, 1, CHP - 4);
  g.fillRect(px + 32, py + 32, CWP - 64, 1); g.fillRect(px + 32, py + CHP - 33, CWP - 64, 1); g.fillRect(px + 32, py + 32, 1, CHP - 64); g.fillRect(px + CWP - 33, py + 32, 1, CHP - 64);
  for (let ty = 0; ty < CHT; ty++) for (let tx = 0; tx < CWT; tx++) {
    const lt = clamp((k * 1.35 - Math.hypot(tx + 0.5 - ex, ty + 0.5 - ey) / 24 * 0.9) / 0.3, 0, 1); if (lt <= 0) continue;
    g.drawImage(r.canvas, tx * 16, ty * 16, 16, 16, px + tx * 16, py + ty * 16 + Math.round((1 - easeBack(lt)) * -7), 16, 16);
  }
}
const dblk = (dir, u, v) => dir === 0 ? [u, v] : dir === 1 ? [30 - v, u] : dir === 2 ? [62 - u, 30 - v] : [v, 62 - u];   // 2x2 block in door-sprite space -> rotated
function drawDoor(g, d, cx, cy) {
  if (d.room.reveal < 1) return;
  const horiz = !(d.dir & 1), w = horiz ? 64 : 32, h = horiz ? 32 : 64;
  let x = Math.round(d.x - w / 2 - cx), y = Math.round(d.y - h / 2 - cy);
  if (x > VW || y > VH || x + w < 0 || y + h < 0) return;
  if (d.shake > 0) { const j = (Math.floor(frameT * 30) & 1) ? 1 : -1; if (horiz) x += j; else y += j; }
  const ajar = d.st === 2 || d.st === 3;
  g.drawImage((ajar ? DOORS.ajar : DOORS.closed)[d.dir], x, y);
  if (d.blink > 0 || ajar) {          // somebody is always watching
    g.fillStyle = d.st ? '#ff6a6a' : '#ffd95e';
    const spots = ajar ? [[27, 13], [33, 22], [29, 28]] : (d.eyes > 1 ? [[21, 17], [37, 17]] : [[29, 17]]);
    for (const [u, v] of spots) { let p = dblk(d.dir, u, v); g.fillRect(x + p[0], y + p[1], 2, 2); p = dblk(d.dir, u + 4, v); g.fillRect(x + p[0], y + p[1], 2, 2); }
  }
}
// the sprite that gives a prop its size (a flame on top of it is not counted)
const propSprite = p => SPR[{ fountain: 'fountain0', brazier: 'brazier', campfire: 'logs', candle: 'candle', statue: 'statue', saw: 'saw0' }[p.kind] || p.spr];
function drawProp(g, p, x, y) {
  const t = frameT;
  switch (p.kind) {
    case 'fountain': ds(g, SPR[p.room.charge >= 1 ? 'fountain' + (Math.floor(t * 3) & 1) : 'fountain_dry'], x, y); break;
    case 'brazier': ds(g, SPR.brazier, x, y); ds(g, SPR['flame' + (Math.floor(t * 8 + p.ph) % 3)], x, y - 7); break;
    case 'campfire': ds(g, SPR.logs, x, y); ds(g, SPR['flame' + (Math.floor(t * 8) % 3)], x, y - 4); break;
    case 'candle': ds(g, SPR.candle, x, y); ds(g, SPR['sflame' + ((Math.floor(t * 7 + p.ph)) & 1)], x, y - 11); break;
    case 'statue': ds(g, SPR.statue, x, y, false, p.flash > 0); break;
    case 'ballista': ds(g, SPR[p.spr], x, y, false, p.flash > 0.1); break;
    case 'saw': ds(g, SPR['saw' + (Math.floor(t * 16) & 1)], x, y); break;
    default: ds(g, SPR[p.spr], x, y);
  }
}
function drawMon(g, e, x, y) {
  const def = e.def, t = e.anim; let name; y += 2 - (def.lift || 0);
  if (def.id === 'gatejaw') { const open = e.st === 2 || e.st === 3 || e.st === 4 || e.st === 6 || e.ph; name = 'boss' + ((open ? 2 : 0) + (e.st === 5 ? 0 : Math.floor(t * 5) & 1)); if (e.st === 1) x += (Math.floor(frameT * 40) & 1) ? 1 : -1; }
  else if (def.id === 'morel') { const open = e.st === 1 || e.st === 4 || e.st === 5 || e.ph, squat = e.st === 3 || (e.st === 0 && Math.abs(Math.sin(t * 4)) < 0.45); name = 'morel' + ((open ? 2 : 0) + (squat ? 1 : 0)); y -= e.z || 0; }
  else if (def.id === 'unmaker') { name = 'unmaker' + ((e.st || e.ph ? 2 : 0) + (Math.floor(t * 3) & 1)); y += Math.round(Math.sin(t * 2) * 2); if (e.st === 2 || e.st === 3) x += (Math.floor(frameT * 40) & 1) ? 1 : -1; }
  else if (def.mimic) name = e.st === 0 ? 'mimic0' : 'mimic' + (Math.floor(t * 6) & 1);
  else name = def.spr + (Math.floor(t * (def.fly ? 9 : 5)) & 1);
  if (def.hop && e.stun <= 0 && !(def.mimic && e.st === 0)) y -= Math.abs(Math.sin(t * 5 + e.wob)) * 3;
  if (def.fly) y += Math.sin(t * 9) * 1.5;
  const s = SPR[name];
  if (def.alpha) g.globalAlpha = def.alpha + Math.sin(t * 3) * 0.12;
  if (e.emerge > 0) g.globalAlpha = clamp(1.15 - e.emerge * 2, 0.25, 1);
  if (e.ph && e.ph.st && PHASES[def.id].ghost) g.globalAlpha = 0.4 + Math.sin(t * 6) * 0.08;      // the Unmaker while it builds walls: thin air, it does not hurt to touch
  ds(g, s, x, y, e.face < 0, e.flash > 0);
  if (e.stun > 0 && e.flash <= 0) { g.globalAlpha = 0.5; ds(g, s, x, y, e.face < 0, true); g.fillStyle = '#9cecf2'; g.globalAlpha = 1; g.fillRect(Math.round(x) - 3, Math.round(y) - s.h - 1, 2, 2); g.fillRect(Math.round(x) + 2, Math.round(y) - s.h + 1, 2, 2); }
  g.globalAlpha = 1;
  if (def.ai === 'slot' && (e.st === 1 || e.st === 2)) {      // its reels, large above it: they roll, then show three of what it pays out
    const bx = Math.round(x) - 13, by = Math.round(y) - s.h - 12;
    g.fillStyle = '#1a1426'; g.fillRect(bx, by, 27, 11); g.fillStyle = e.st === 2 ? '#fff8e8' : '#d8dbe6'; g.fillRect(bx + 1, by + 1, 25, 9);
    for (let i = 0; i < 3; i++) ds(g, SPR['sym' + (e.st === 2 ? e.pay : (Math.floor(frameT * 16) + i) % 3)], bx + 5 + i * 8, by + 8);
  }
  if (def.crown) ds(g, SPR.crown, x, y - s.h + 4);
  if (def.elite && e.hp < e.max) { g.fillStyle = '#1a1426'; g.fillRect(x - 9, y - s.h - 6, 18, 4); g.fillStyle = '#e8474c'; g.fillRect(x - 8, y - s.h - 5, Math.max(1, Math.round(16 * e.hp / e.max)), 2); }
  if (def.pest && e.st === 1) {       // a pest at work: show how long you have to stop it
    const tot = def.ai === 'latch' ? 0.9 : def.ai === 'dig' ? 2.6 : 1, f = clamp(1 - e.stT / tot, 0, 1);
    g.fillStyle = '#1a1426'; g.fillRect(x - 8, y - s.h - 6, 16, 4); g.fillStyle = '#ffd95e'; g.fillRect(x - 7, y - s.h - 5, Math.round(14 * f), 2);
  }
}
function drawPlayer(g, x, y) {
  const P = G.P, down = heroSpr(2, 0); y += 3;
  if (G.over) {
    const f = Math.min(1, G.endT * 2.6); g.save(); g.translate(Math.round(x), Math.round(y - 5)); g.rotate(f * Math.PI / 2); g.drawImage(G.endT < 0.25 ? down.wh : down.c, -8, -12); g.restore(); return;
  }
  if (P.pose > 0) {
    ds(g, down, x, y);
    if (P.poseBoon) {
      const by = y - 25 - Math.round(Math.sin(clamp(0.95 - P.pose, 0, 0.3) / 0.3 * Math.PI / 2) * 3), ic = SPR['i_' + P.poseBoon.id + (P.poseEvo ? '_evo' : '')];
      g.globalCompositeOperation = 'lighter'; g.drawImage(GLOW.gold, Math.round(x) - 28, by - 28); if (P.poseEvo) g.drawImage(GLOW.warm, Math.round(x) - 40, by - 40); g.globalCompositeOperation = 'source-over'; ds(g, ic, x, by);
    }
    return;
  }
  if (P.inv > 0 && P.dashT <= 0 && (Math.floor(frameT * 20) & 1)) return;
  const fi = Math.floor(P.anim * 9) & 3, fr = P.moving ? [1, 0, 2, 0][fi] : 0;
  const bob = P.moving ? (fi & 1) : (Math.floor(frameT * 2.2) & 1);                 // walk bounce / idle breathing
  ds(g, heroSpr(P.face, fr), x, y - bob, P.face === 3, P.hurtT > 0.2);
}
const ZONE_COL = { fire: ['#f6923a', '#ff6a6a'], spore: ['#58b848', '#ff6a6a'], flame: ['#ffd95e', '#f6923a'], cloud: ['#b5e85a', '#58b848'], honey: ['#ffd95e', '#dc9a2c'], drift: ['#fff8e8', '#9cecf2'] };
const DIE_PIPS = [[], [[3, 3]], [[1, 1], [5, 5]], [[1, 1], [3, 3], [5, 5]], [[1, 1], [5, 1], [1, 5], [5, 5]], [[1, 1], [5, 1], [3, 3], [1, 5], [5, 5]], [[1, 1], [1, 3], [1, 5], [5, 1], [5, 3], [5, 5]]];
function pxDisc(g, x, y, r, col) { g.fillStyle = col; x = Math.round(x); y = Math.round(y); const ri = Math.max(1, Math.round(r)); for (let dy = -ri; dy <= ri; dy++) { const hw = Math.round(Math.sqrt(ri * ri - dy * dy)); g.fillRect(x - hw, y + dy, hw * 2 + 1, 1); } }

function renderWorld(g) {
  const P = G.P, F = G.F, t = frameT, sh = G.shake > 0 && Save.data.opts.shake ? G.shake : 0;
  const cx = Math.round(G.cam.x + (sh ? (fxr() - 0.5) * sh : 0)), cy = Math.round(G.cam.y + (sh ? (fxr() - 0.5) * sh : 0));
  const vis = (x, y, m) => x > cx - m && x < cx + VW + m && y > cy - m && y < cy + VH + m;
  g.fillStyle = F.void; g.fillRect(0, 0, VW, VH);
  drawVoid(g, cx, cy);
  const rooms = [];
  for (const r of G.rooms) {
    if (r.px - cx > VW || r.py - cy > VH || r.px + CWP < cx || r.py + CHP < cy) continue;
    rooms.push(r);
    if (r.reveal < 1) { drawReveal(g, r, cx, cy); continue; }
    g.drawImage(r.canvas, r.px - cx, r.py - cy);
    for (const sx of [88, 247]) ds(g, SPR[F.flame + ((Math.floor(t * 7) + sx) & 1)], r.px + sx - cx, r.py + 20 - cy);
    if (r.spikeSt) { const s = SPR['spike' + r.spikeSt]; for (const sp of r.spikes) g.drawImage(s.c, sp.tx * T - cx - s.ax, sp.ty * T - cy - s.ay); }
    if (r.warn > 0) { g.fillStyle = 'rgba(246,146,58,' + (0.18 + 0.3 * (1 - r.warn / 0.7)).toFixed(3) + ')'; g.fillRect(r.px + 32 - cx, r.py + 32 - cy, CWP - 64, CHP - 64); }
    if (r.hexT > 0) { g.fillStyle = 'rgba(96,48,150,' + (0.26 + Math.sin(t * 6) * 0.06).toFixed(3) + ')'; g.fillRect(r.px + 32 - cx, r.py + 32 - cy, CWP - 64, CHP - 64); if (fxr() < 0.3) part(r.px + 40 + fxr() * (CWP - 80), r.py + 40 + fxr() * (CHP - 80), 0, -12, 0.8, PAL.P, 1); }
    for (let d = 1; d <= 2; d++) if (r.resDir[d] && r.doors[d] >= 2) {      // resonance rune in the doorway (drawn once, by the room above / left)
      const p = doorPos(r, d), rx = Math.round(p.x + DIRS[d].x * 16 - cx), ry = Math.round(p.y + DIRS[d].y * 16 - cy), k = 2 + Math.round(Math.sin(t * 3 + r.id) * 1);
      g.fillStyle = ELEMENTS[r.el === 'stone' ? (nbOf(r, d) || r).el : r.el].col; g.fillRect(rx - k, ry - 1, k * 2 + 1, 3); g.fillRect(rx - 1, ry - k, 3, k * 2 + 1); g.fillStyle = '#fff8e8'; g.fillRect(rx, ry, 1, 1);
    }
  }
  for (const d of G.sealed) drawDoor(g, d, cx, cy);
  for (const j of G.jams) { const c = DOORS.gate[j.horiz ? 0 : 1]; g.drawImage(c, Math.round(j.x - c.width / 2 - cx) + (j.push > 0 ? ((Math.floor(t * 30) & 1) ? 1 : -1) : 0), Math.round(j.y - c.height / 2 - cy)); }
  // floor-level effects
  const st = G.stairs;
  if (st && vis(st.x, st.y, 40)) { ds(g, SPR[st.open ? 'stairs_open' : 'stairs_shut'], st.x - cx, st.y - cy); }
  const portals = G.hearthPortal ? [G.hearthPortal] : []; for (const r of rooms) if (r.portal && r.reveal >= 1) portals.push(r.portal);
  for (const pt of portals) ds(g, SPR['portal' + (Math.floor(t * 5) & 1)], pt.x - cx, pt.y - cy);
  for (const z of G.zones) {
    if (!vis(z.x, z.y, 40)) continue; const c = ZONE_COL[z.kind], x = z.x - cx, y = z.y - cy, fade = Math.min(1, (z.d - z.t) * 2, z.t * 4);
    g.globalAlpha = 0.3 * fade; g.fillStyle = c[0]; g.beginPath(); g.ellipse(x, y, z.r, z.r * 0.8, 0, 0, TAU); g.fill(); g.globalAlpha = fade;
    pxRing(g, x, y, z.r + Math.sin(t * 6 + z.x) * 1, c[1], 0.8); g.globalAlpha = 1;
    if (fxr() < 0.25) part(z.x + (fxr() - 0.5) * z.r * 1.4, z.y + (fxr() - 0.5) * z.r, 0, -16, 0.5, c[0], 1);
  }
  for (const m of G.mats) if (vis(m.x, m.y, 20)) ds(g, SPR[m.cd > 0 ? 's_mat_off' : 's_mat'], m.x - cx, m.y - cy + 3);
  for (const w of P.weapons) if (w.id === 'toad') for (const m of w.pets) if (vis(m.x, m.y, 12)) ds(g, SPR.s_toad, m.x - cx, m.y - cy + 3 + (m.t < 0.15 ? 2 : 0));
  for (const p of G.patches) if (vis(p.x, p.y, 20)) { if (p.life < 0.6 && (Math.floor(t * 16) & 1)) continue; ds(g, SPR.s_thorn, p.x - cx, p.y - cy + 3); if (p.big) ds(g, SPR.s_thorn, p.x - cx + 5, p.y - cy - 1); }
  if (!P.hidden && !G.over) for (const w of P.weapons) if (w.id === 'halo') {
    const hs = wStat(w), R = hs.r * P.area, hx = P.x - cx, hy = P.y - 2 - cy;
    g.globalAlpha = 0.1 + w.pulse * 0.5; g.fillStyle = w.evo ? '#fff0b0' : '#ffd95e'; g.beginPath(); g.ellipse(hx, hy, R, R * 0.9, 0, 0, TAU); g.fill(); g.globalAlpha = 1;
    pxRing(g, hx, hy, R + Math.sin(t * 5) * 1.2, w.pulse > 0 ? '#fff8e8' : '#f6c24a', 0.9); if (w.evo) pxRing(g, hx, hy, R - 3, '#9cecf2', 0.9);
  }
  const boss = G.dir.boss;
  if (boss && !boss.dead && boss.emerge <= 0) {      // telegraphs
    const bx = boss.x - cx, by = boss.y - cy, id = boss.def.id;
    if (id === 'gatejaw') {
      if (boss.st === 1 && (Math.floor(t * 14) & 1)) { g.fillStyle = '#ff6a6a'; for (let i = 14; i < 190; i += 8) g.fillRect(Math.round(bx + boss.cx * i) - 1, Math.round(by + boss.cy * i) - 1, 3, 3); }
      if (boss.st === 3 || boss.st === 6) pxRing(g, bx, by - 8, 14 + (0.7 - Math.max(0, boss.stT)) * 40, '#ff9ec4', 0.9);
      if (boss.st === 4) pxRing(g, bx, by - 8, 26 - Math.max(0, boss.stT) * 30, '#b5e85a', 0.9);
    } else if (id === 'morel') {
      if (boss.st === 1 && boss.pts) for (const p of boss.pts) { pxRing(g, p[0] - cx, p[1] - cy, 15, '#ff6a6a', 0.8); pxRing(g, p[0] - cx, p[1] - cy, 15 * clamp(1 - boss.stT / 0.85, 0, 1), '#b5e85a', 0.8); }
      if (boss.st === 3) pxRing(g, P.x - cx, P.y - cy, 12 + boss.stT * 20, '#ff6a6a', 0.8);
      if (boss.st === 5) { pxRing(g, boss.jx - cx, boss.jy - cy, 18, '#ff6a6a', 0.8); ds(g, SPR.sh_xl, boss.jx - cx, boss.jy - cy); }
    } else if (id === 'unmaker') {
      const r = boss.room;
      if (boss.st === 5 && boss.pts) for (const p of boss.pts) { pxRing(g, p[0] - cx, p[1] - cy, 16, '#ff6a6a', 0.85); pxRing(g, p[0] - cx, p[1] - cy, 16 * clamp(1 - boss.stT / 0.9, 0, 1), '#fff8e8', 0.85); }
      if (boss.st === 2 && r && (Math.floor(t * 12) & 1)) for (let d = 0; d < 4; d++) if (r.doors[d] === 2) { const p = doorPos(r, d); g.fillStyle = 'rgba(255,217,94,0.55)'; const hz = !(d & 1); g.fillRect(Math.round(p.x - (hz ? 24 : 16) - cx), Math.round(p.y - (hz ? 16 : 24) - cy), hz ? 48 : 32, hz ? 32 : 48); }
      if (boss.st === 3 && r && boss.wall >= 0 && (Math.floor(t * 12) & 1)) { const p = doorPos(r, boss.wall), hz = !(boss.wall & 1); g.fillStyle = 'rgba(255,106,106,0.55)'; g.fillRect(Math.round(p.x - (hz ? 24 : 16) - cx), Math.round(p.y - (hz ? 16 : 24) - cy), hz ? 48 : 32, hz ? 32 : 48); }
    }
  }
  // shadows (also those of the hearts and keys, which are drawn on the top layer), then depth-sorted actors
  for (const p of G.picks) if (p.k !== 'glint' && vis(p.x, p.y, 12)) ds(g, SPR.sh_s, p.x - cx, p.y - cy + 2);
  drawList.length = 0;
  for (const r of rooms) if (r.reveal >= 1) for (const p of r.props) drawList.push({ y: p.y, k: 0, o: p });
  for (const e of G.mons) if (!e.dead && vis(e.x, e.y, 50)) { if (e.emerge <= 0.2) ds(g, SPR[e.def.sh], e.x - cx, e.y - cy + 2); drawList.push({ y: e.y, k: 1, o: e }); }
  if (!P.hidden) { ds(g, SPR.sh_s, P.x - cx, P.y - cy + 3); drawList.push({ y: P.y, k: 2, o: P }); }
  for (const b of G.boons) drawList.push({ y: b.y + 6, k: 3, o: b });
  for (const w of P.weapons) if (w.id === 'sentry') for (const s of w.pets) { ds(g, SPR.sh_s, s.x - cx, s.y - cy + 2); drawList.push({ y: s.y, k: 4, o: s }); }
  drawList.sort((a, b) => a.y - b.y);
  for (const it of drawList) {
    const o = it.o, x = o.x - cx, y = o.y - cy;
    if (it.k === 0) drawProp(g, o, x, y); else if (it.k === 1) drawMon(g, o, x, y); else if (it.k === 2) drawPlayer(g, x, y);
    else if (it.k === 4) { if (o.life > 1.5 || (Math.floor(t * 12) & 1)) ds(g, SPR.s_sentry, x, y + 1 - (o.kick > 0 ? 1 : 0), o.face < 0); }
    else if (o.hidden) { const by = y - 14 + Math.round(Math.sin(t * 3 + o.x) * 2); g.fillStyle = '#1a1426'; g.fillRect(Math.round(x) - 7, by - 7, 14, 14); g.fillStyle = '#c05068'; g.fillRect(Math.round(x) - 6, by - 6, 12, 12); txt(g, '?', x, by - 4, '#fff8e8', 0.5); }
    else ds(g, boonIcon(o.boon), x, y - 14 + Math.round(Math.sin(t * 3 + o.x) * 2));
  }
  // allies and familiars
  for (const b of G.allies) if (vis(b.x, b.y, 10)) ds(g, SPR['bee' + (Math.floor(t * 20) & 1)], b.x - cx, b.y - cy);
  if (!P.hidden && !G.over) for (const w of P.weapons) {
    if (w.id === 'moons') for (let i = 0; i < w.orbs.length; i += 2) ds(g, SPR.s_moon, w.orbs[i] - cx, w.orbs[i + 1] - cy + 4);
    if (w.id === 'moth') for (const m of w.pets) ds(g, SPR['s_moth' + (Math.floor(t * 14) & 1)], m.x - cx, m.y - cy, m.face < 0);
  }
  // shots
  for (const s of G.shots) {
    if (s.t < 0 || !vis(s.x, s.y, 20)) continue; const x = s.x - cx, y = s.y - cy;
    if (s.k === 'bomb') { ds(g, SPR.sh_s, x, y + 6); ds(g, s.pot ? SPR.s_pot : SPR.s_bomb, x, y - s.z + 3); }
    else if (s.k === 'quarrel') { const sp = Math.hypot(s.vx, s.vy) || 1, ux = s.vx / sp, uy = s.vy / sp; g.fillStyle = '#1a1426'; pxLine(g, x - ux * 10, y - uy * 10, x + ux * 2, y + uy * 2, 3); g.fillStyle = '#a6713f'; pxLine(g, x - ux * 9, y - uy * 9, x - ux, y - uy, 1); g.fillStyle = '#fff8e8'; g.fillRect(Math.round(x + ux) - 1, Math.round(y + uy) - 1, 2, 2); }
    else if (s.k === 'rocket') { const sp = Math.hypot(s.vx, s.vy) || 1, ux = s.vx / sp, uy = s.vy / sp, rx = Math.round(x), ry = Math.round(y); g.fillStyle = '#1a1426'; g.fillRect(rx - 3, ry - 3, 6, 6); g.fillStyle = '#e8474c'; g.fillRect(rx - 2, ry - 2, 4, 4); g.fillStyle = '#fff8e8'; g.fillRect(Math.round(x + ux * 2) - 1, Math.round(y + uy * 2) - 1, 2, 2); g.fillStyle = (Math.floor(t * 20) & 1) ? '#ffd95e' : '#f6923a'; g.fillRect(Math.round(x - ux * 4) - 1, Math.round(y - uy * 4) - 1, 2, 2); if (fxr() < 0.5) part(s.x - ux * 5, s.y - uy * 5, 0, -8, 0.3, PAL.g, 1); }
    else if (s.k === 'die') { const rx = Math.round(x) - 3, ry = Math.round(y) - 3 - (Math.floor(s.t * 14) & 1); g.fillStyle = '#1a1426'; g.fillRect(rx - 1, ry - 1, 9, 9); g.fillStyle = s.roll === 6 ? '#ffd95e' : '#fff8e8'; g.fillRect(rx, ry, 7, 7); g.fillStyle = '#1a1426'; for (const q of DIE_PIPS[s.roll]) g.fillRect(rx + q[0], ry + q[1], 1, 1); }
    else if (s.k === 'coin') ds(g, SPR['s_coin' + (Math.floor(s.t * 12) & 1)], x, y + 3);
    else if (s.k === 'snow') { pxDisc(g, x, y, s.r + 1, '#2f55a8'); pxDisc(g, x, y, s.r, '#9cecf2'); pxDisc(g, x - 1, y - 1, Math.max(1, s.r - 1.4), '#fff8e8'); }
    else if (s.k === 'saw') { const sw = SPR['saw' + (Math.floor(t * 18) & 1)]; ds(g, SPR.sh_s, x, y + 7); if (s.r >= 14) g.drawImage(sw.c, Math.round(x) - sw.w, Math.round(y) - sw.h + 2, sw.w * 2, sw.h * 2); else ds(g, sw, x, y + 3); if (s.t > s.out && fxr() < 0.3) part(s.x + (fxr() - 0.5) * s.r * 2, s.y + 2, (fxr() - 0.5) * 40, -30, 0.2, PAL.y, 1); }
    else if (s.k === 'ember') { g.fillStyle = (Math.floor(t * 20) & 1) ? '#ffd95e' : '#f6923a'; g.fillRect(Math.round(x) - 1, Math.round(y) - 1, 2, 2); }
    else if (s.k === 'spark') { g.fillStyle = '#4c97e8'; g.fillRect(Math.round(x - s.vx * 0.02) - 1, Math.round(y - s.vy * 0.02) - 1, 2, 2); ds(g, SPR.s_spark, x, y + 3); }
    else if (s.k === 'orb') ds(g, SPR.s_orb, x, y + 4);
    else if (s.k === 'guard') ds(g, SPR.s_guard, x, y + 3);
    else if (s.k === 'shard') ds(g, SPR.s_shard, x, y + 3);
    else if (s.k === 'bkey') ds(g, SPR['s_bkey' + (Math.floor(s.t * 16) & 3)], x, y);
    else if (s.k === 'bolt') { const hz = !(s.dir & 1); g.fillStyle = '#1a1426'; g.fillRect(Math.round(x) - (hz ? 2 : 7), Math.round(y) - (hz ? 7 : 2), hz ? 4 : 14, hz ? 14 : 4); g.fillStyle = '#fff8e8'; g.fillRect(Math.round(x) - (hz ? 1 : 6), Math.round(y) - (hz ? 6 : 1), hz ? 2 : 12, hz ? 12 : 2); }
    else if (s.k === 'wave') { const ca = Math.cos(s.a), sa = Math.sin(s.a); for (let i = -4; i <= 4; i++) { g.fillStyle = Math.abs(i) < 3 ? '#fff8e8' : '#ffd95e'; g.fillRect(Math.round(x - sa * i * 2 - ca * Math.abs(i) * 1.4) - 1, Math.round(y + ca * i * 2 - sa * Math.abs(i) * 1.4) - 1, 2, 2); } }
  }
  // timed fx
  for (const f of G.fxs) {
    const k = f.t / f.d;
    if (f.k === 'slash') {
      const x = P.x - cx, y = P.y - 3 - cy, a0 = f.a - f.arc / 2, sweep = f.arc * Math.min(1, k * 1.8), tail = Math.max(0, sweep - 1.3);
      for (let a = tail; a <= sweep; a += 2 / f.R) { const ca = Math.cos(a0 + a), sa = Math.sin(a0 + a), fresh = (a - tail) / (sweep - tail || 1);
        g.fillStyle = fresh > 0.6 ? '#fff8e8' : '#ffd95e'; g.fillRect(Math.round(x + ca * f.R) - 1, Math.round(y + sa * f.R) - 1, 2, 2);
        if (fresh > 0.3) { g.fillStyle = '#dc9a2c'; g.fillRect(Math.round(x + ca * (f.R - 3)), Math.round(y + sa * (f.R - 3)), 1, 1); } }
    } else if (f.k === 'boom') {
      const x = f.x - cx, y = f.y - cy, r = f.R * easeOut(k);
      if (k < 0.5) { g.globalAlpha = 0.5 * (1 - k * 2); g.fillStyle = '#fff8e8'; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.globalAlpha = 1; }
      pxRing(g, x, y, r, k < 0.4 ? '#fff8e8' : '#f6923a'); pxRing(g, x, y, r - 2, '#ffd95e');
    } else if (f.k === 'bolt') {
      const rs = RNG(f.seed + Math.floor(k * 3));
      for (let pass = 0; pass < 2; pass++) { g.fillStyle = pass ? '#fff8e8' : '#4c97e8';
        for (const sg of f.segs) { let x0 = sg[0] - cx, y0 = sg[1] - cy; const x1 = sg[2] - cx, y1 = sg[3] - cy, n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / 9));
          for (let j = 1; j <= n; j++) { const jx = j === n ? x1 : lerp(sg[0] - cx, x1, j / n) + (rs() - 0.5) * 8, jy = j === n ? y1 : lerp(sg[1] - cy, y1, j / n) + (rs() - 0.5) * 8; pxLine(g, x0, y0, jx, jy, pass ? 1 : 2); x0 = jx; y0 = jy; } } }
    } else if (f.k === 'icicle') ds(g, SPR.fx_icicle, f.x - cx, f.y - cy - Math.round((1 - k) * 34));
    else if (f.k === 'tide') {
      const x = f.x - cx, y = f.y - cy, r = f.R * easeOut(k); g.globalAlpha = 1 - k * 0.6;
      pxRing(g, x, y, r, f.hot ? '#ffd2a6' : '#9cecf2', 0.9); pxRing(g, x, y, Math.max(1, r - 2), '#fff8e8', 0.9); pxRing(g, x, y, Math.max(1, r - 5), f.hot ? '#f6923a' : '#4c97e8', 0.9); g.globalAlpha = 1;
    } else if (f.k === 'breath') {                 // a flickering cone of flame from your mouth
      const x = P.x - cx, y = P.y - 5 - cy, rs = RNG(f.seed + Math.floor(t * 30));
      for (let i = 0; i < 54; i++) {
        const d = 6 + rs() * (f.R - 6), a = f.a + (rs() - 0.5) * f.arc * (0.3 + 0.7 * d / f.R), c = rs(), sz = d > f.R * 0.65 ? 2 : 3;
        g.fillStyle = d < f.R * 0.3 ? (c < 0.5 ? '#fff8e8' : '#ffd95e') : c < 0.45 ? '#ffd95e' : c < 0.85 ? '#f6923a' : '#e8474c';
        g.fillRect(Math.round(x + Math.cos(a) * d) - 1, Math.round(y + Math.sin(a) * d) - 1, sz, sz);
      }
    } else if (f.k === 'lash') {
      const x = P.x - cx, y = P.y - 3 - cy, ca = Math.cos(f.a), sa = Math.sin(f.a), reach = f.R * Math.min(1, k * 2.4), wob = (1 - k) * 4;
      for (let pass = 0; pass < 2; pass++) for (let d = 4; d <= reach; d += 2) {
        const o = Math.sin(d * 0.16 + k * 9) * wob, px = Math.round(x + ca * d - sa * o), py = Math.round(y + sa * d + ca * o);
        if (!pass) { g.fillStyle = '#1a1426'; g.fillRect(px - 1, py - 1, 3, 3); } else { g.fillStyle = d > reach - 6 ? (f.rose ? '#ff9ec4' : '#fff8e8') : '#58b848'; g.fillRect(px, py, 1, 1); }
      }
    }
  }
  for (const p of G.parts) { g.fillStyle = p.col; g.fillRect(Math.round(p.x - cx), Math.round(p.y - cy), p.size, p.size); }
  // light: additive glows from fire, doors and loot
  g.globalCompositeOperation = 'lighter';
  const torch = GLOW[F.glow];
  for (const r of rooms) {
    if (r.reveal < 1) continue;
    for (const sx of [88, 247]) { g.globalAlpha = 0.4 + Math.sin(t * 9 + sx + r.id) * 0.06; g.drawImage(torch, r.px + sx - torch.width / 2 - cx, r.py + 18 - torch.height / 2 - cy); }
    for (const p of r.props) {
      if (p.kind === 'brazier' || p.kind === 'campfire') { g.globalAlpha = 0.7 + Math.sin(t * 11 + p.x) * 0.08; g.drawImage(GLOW.warm, p.x - 40 - cx, p.y - 50 - cy); }
      else if (p.kind === 'candle') { g.globalAlpha = 0.45; g.drawImage(GLOW.gold, p.x - 28 - cx, p.y - 42 - cy); }
      else if (p.kind === 'crystal') { g.globalAlpha = 0.35; g.drawImage(GLOW.cool, p.x - 40 - cx, p.y - 48 - cy); }
      else if ((p.kind === 'statue' || p.kind === 'ballista') && p.flash > 0) { g.globalAlpha = 0.9; g.drawImage(GLOW.cool, p.x - 40 - cx, p.y - 56 - cy); }
      else if (p.kind === 'fountain' && r.charge >= 1) { g.globalAlpha = 0.3 + Math.sin(t * 3) * 0.08; g.drawImage(GLOW.cool, p.x - 40 - cx, p.y - 56 - cy); }
    }
  }
  for (const d of G.sealed) if (d.room.reveal >= 1 && vis(d.x, d.y, 60)) { g.globalAlpha = d.st ? 0.75 : 0.4 + Math.sin(t * 2 + d.x) * 0.08; g.drawImage(GLOW.dark, d.x + d.nx * 10 - 36 - cx, d.y + d.ny * 10 - 36 - cy); }
  for (const b of G.boons) { g.globalAlpha = 0.6 + Math.sin(t * 4) * 0.15; g.drawImage(GLOW.gold, b.x - 28 - cx, b.y - 42 - cy); }
  for (const pt of portals) { g.globalAlpha = 0.5; g.drawImage(GLOW.dark, pt.x - 36 - cx, pt.y - 36 - cy); }
  if (st && st.open) { g.globalAlpha = 0.5 + Math.sin(t * 3) * 0.15; g.drawImage(GLOW.gold, st.x - 28 - cx, st.y - 28 - cy); }
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  // floating text
  for (const f of G.texts) {
    const x = f.x - cx, y = f.y - cy;
    if (f.s) { g.globalAlpha = clamp((f.d - f.t) * 3, 0, 1); txo(g, f.s, x, y, f.col, '#1a1426', 0.5); g.globalAlpha = 1; }
    else miniNum(g, f.n, x, y - (f.t < 0.08 ? 2 : 0), f.col);
  }
  // vignette + hurt flash
  if (!vignette || vignette.width !== VW || vignette.height !== VH) {
    vignette = mkCanvas(VW, VH); const vg = vignette.getContext('2d'), gr = vg.createRadialGradient(VW / 2, VH / 2, VH * 0.42, VW / 2, VH / 2, VW * 0.72);
    gr.addColorStop(0, 'rgba(8,5,20,0)'); gr.addColorStop(1, 'rgba(8,5,20,0.5)'); vg.fillStyle = gr; vg.fillRect(0, 0, VW, VH);
  }
  g.drawImage(vignette, 0, 0);
  // a flash is a tint: it covers at most 0.27 of what is under it, and flashScreen() keeps flashes apart; at two hearts
  // or fewer a slow pulse of up to 0.12 lies over the picture as well
  if (G.flashT > 0) { g.fillStyle = 'rgba(232,71,76,' + (G.flashT * 0.9).toFixed(3) + ')'; g.fillRect(0, 0, VW, VH); }
  if (!P.hidden && P.hp <= 2 && !G.over && !G.won) { g.fillStyle = 'rgba(232,71,76,' + (0.07 + Math.sin(t * 6) * 0.05).toFixed(3) + ')'; g.fillRect(0, 0, VW, VH); }
  // ---- the top layer (#14): the delver, pickups and enemy bullets, drawn once more over everything above: every blast,
  // glow, particle and number, the vignette and the flash. So nothing that happens on screen hides what the next
  // decision needs. The delver comes first, so the glow of its pose lies under the pickups and the bullets.
  if (!P.hidden) {
    // A prop that stands in front of the delver keeps hiding it: its box is cut out of this second drawing, and what
    // shows there is the delver of the depth-sorted pass, behind the prop. A monster in front does not hide it.
    g.save();
    for (const r of rooms) if (r.reveal >= 1) for (const q of r.props) if (q.y > P.y && q.y < P.y + 64 && Math.abs(q.x - P.x) < 44) {
      const sp = propSprite(q); g.beginPath(); g.rect(0, 0, VW, VH); g.rect(Math.round(q.x - cx) - sp.ax, Math.round(q.y - cy) - sp.ay, sp.w, sp.h); g.clip('evenodd');
    }
    drawPlayer(g, P.x - cx, P.y - cy); g.restore();
  }
  for (const p of G.picks) {
    if (!vis(p.x, p.y, 12)) continue;
    const x = p.x - cx, y = p.y - cy;
    if (p.k === 'glint') ds(g, SPR[p.v >= 20 ? 'glint2' : p.v >= 5 ? 'glint1' : 'glint0'], x, y + Math.round(Math.sin(t * 6 + p.x) * 1));
    else ds(g, SPR[p.k === 'heart' ? 'heart' : 'key'], x, y - 3 + Math.round(Math.sin(t * 5 + p.x) * 2));
  }
  for (const b of G.ebullets) if (vis(b.x, b.y, 8)) ds(g, SPR[b.spr], b.x - cx, b.y - cy + 3);
  // world-space prompts
  if (!P.hidden && !G.over) {
    const x = Math.round(P.x - cx), y = Math.round(P.y - cy);
    if (P.dashCd > 0) { g.fillStyle = '#1a1426'; g.fillRect(x - 6, y + 6, 12, 3); g.fillStyle = '#9cecf2'; g.fillRect(x - 5, y + 7, Math.round(10 * (1 - P.dashCd / P.dashMax)), 1); }
    for (const d of G.sealed) {
      if (!d.near || d.room.reveal < 1 || (P.keys <= 0 && P.pushDoor !== d)) continue;     // no key: only hint while you lean on the door
      const kx = d.x + d.nx * 30 - cx, ky = d.y + d.ny * 30 - cy + Math.round(Math.sin(t * 5) * 2);
      ds(g, P.keys > 0 ? SPR.key : SPR.key_dim, kx, ky);
      if (d.push > 0) { g.fillStyle = '#1a1426'; g.fillRect(kx - 9, ky + 3, 18, 4); g.fillStyle = '#ffd95e'; g.fillRect(kx - 8, ky + 4, Math.round(16 * d.push / 0.3), 2); }
    }
    for (const j of G.jams) if (j.push > 0) { const jx = Math.round(j.x - cx), jy = Math.round(j.y - cy); g.fillStyle = '#1a1426'; g.fillRect(jx - 11, jy - 14, 22, 4); g.fillStyle = '#ffd95e'; g.fillRect(jx - 10, jy - 13, Math.round(20 * j.push / 0.7), 2); }
    if (st && st.open && vis(st.x, st.y, 30)) { txo(g, 'DOWN', st.x - cx, st.y - cy - 26 + Math.round(Math.sin(t * 4) * 2), '#ffd95e', '#1a1426', 0.5); if (G.leaving > 0) { g.fillStyle = '#1a1426'; g.fillRect(st.x - cx - 11, st.y - cy + 16, 22, 4); g.fillStyle = '#ffd95e'; g.fillRect(st.x - cx - 10, st.y - cy + 17, Math.round(20 * Math.min(1, G.leaving / 0.6)), 2); } }
    const cur = G.curRoom, al = cur && cur.altar;
    if (al && al.hold > 0) { g.fillStyle = '#1a1426'; g.fillRect(al.x - cx - 11, al.y - cy - 26, 22, 4); g.fillStyle = '#ff9ec4'; g.fillRect(al.x - cx - 10, al.y - cy - 25, Math.round(20 * al.hold / 1.1), 2); }
  }
  G.view = { cx, cy };
}
