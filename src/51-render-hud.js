/* ============================ 14b RENDER: HUD ========================= */
// ---- minimap (also used big on the end screens) ----
function drawMap(g, x, y, cw, ch, live) {
  const P = G.P;
  for (const r of G.rooms) {
    const px = x + r.cx * cw, py = y + r.cy * ch, mx = px + (cw >> 1), my = py + (ch >> 1);
    g.fillStyle = '#0d0a1a'; g.fillRect(px, py, cw, ch); g.fillStyle = r.reveal < 1 ? '#3fc1ad' : r.def.col; g.fillRect(px + 1, py + 1, cw - 2, ch - 2);
    if (live && r.hexT > 0) { g.fillStyle = '#6030a0'; g.fillRect(px + 2, py + 2, cw - 4, ch - 4); }
    for (let d = 0; d < 4; d++) {
      if (!r.doors[d]) continue;
      g.fillStyle = r.doors[d] === 1 ? ((live && (Math.floor(frameT * 3) & 1)) ? '#ffb0b0' : '#ff4a5e') : r.doors[d] === 3 ? '#ffb030' : r.def.col;
      if (d === 0) g.fillRect(mx - 1, py, 2, 1); else if (d === 2) g.fillRect(mx - 1, py + ch - 1, 2, 1); else if (d === 3) g.fillRect(px, my - 1, 1, 2); else g.fillRect(px + cw - 1, my - 1, 1, 2);
    }
  }
  if (live) {
    g.fillStyle = '#ffd95e'; for (const b of G.boons) g.fillRect(Math.round(x + b.x / CWP * cw) - 1, Math.round(y + b.y / CHP * ch) - 1, 2, 2);
    const st = G.stairs; if (st && st.open && (Math.floor(frameT * 3) & 1)) { g.fillStyle = '#ffffff'; g.fillRect(Math.round(x + st.x / CWP * cw) - 1, Math.round(y + st.y / CHP * ch) - 1, 3, 3); }
    if (G.dir.boss && !G.dir.boss.dead) { g.fillStyle = '#ff4a5e'; g.fillRect(Math.round(x + G.dir.boss.x / CWP * cw) - 1, Math.round(y + G.dir.boss.y / CHP * ch) - 1, 3, 3); }
    if (Math.floor(frameT * 4) & 1) { g.fillStyle = '#ffffff'; g.fillRect(Math.round(x + P.x / CWP * cw) - 1, Math.round(y + P.y / CHP * ch) - 1, 2, 2); }
  }
}
const HINTS = ['Move with WASD or the arrow keys. Your weapon swings by itself.', 'You carry a KEY. Push into any knocking door to use it.', '', 'A new room! Grab the BOON waiting inside.', 'Glints @ forge new keys. More rooms, more power.', 'Tap SPACE to dash through danger.'];
function drawLoadout(g, x, y, P, slots) {   // weapons (with level) then charms; returns the x after the last icon
  for (let i = 0; i < (slots ? MAX_WEAPONS : P.weapons.length); i++) {
    const w = P.weapons[i];
    if (slots) { g.fillStyle = '#1a1426'; g.fillRect(x, y, 17, 17); g.fillStyle = w ? (w.evo ? '#6a4a1a' : '#3b2d4f') : '#241d3a'; g.fillRect(x + 1, y + 1, 15, 15); }
    if (w) { ds(g, weaponIcon(w), x + 8, y + 8); if (!w.evo) miniNum(g, w.lv, x + 14, y + 11, w.lv >= WEAPONS[w.id].max ? 'y' : 'w'); }
    x += slots ? 18 : 17;
  }
  return x;
}
function renderHUD(g) {
  const P = G.P, t = frameT, D = G.dir;
  // hearts, then shield hearts
  let hx = 4;
  for (let i = 0, n = P.maxHp / 2; i < n; i++, hx += 11) {
    const v = P.hp - i * 2, s = v >= 2 ? SPR.heart : v === 1 ? SPR.heart_half : SPR.heart_empty;
    g.drawImage(s.c, hx, 4 + (P.hurtT > 0 ? ((Math.floor(t * 30) + i) & 1) : (P.hp <= 2 && v > 0 ? Math.round(Math.abs(Math.sin(t * 6))) : 0)));
  }
  for (let i = 0; i < P.shield; i++, hx += 11) g.drawImage(SPR.heart_shield.c, hx, 4);
  // key forge: glints fill the bar, a full bar pops out a key
  const gy = 18, pop = P.keyPop > 0 ? Math.round(Math.abs(Math.sin(P.keyPop * 12)) * 2) : 0;
  ds(g, P.keys > 0 ? SPR.key : SPR.key_dim, 12, gy + 6 - pop);
  g.fillStyle = '#1a1426'; g.fillRect(22, gy, 54, 7); g.fillStyle = '#3b2d4f'; g.fillRect(23, gy + 1, 52, 5);
  const fw = Math.round(52 * clamp(P.glints / P.keyCost, 0, 1));
  g.fillStyle = '#dc9a2c'; g.fillRect(23, gy + 1, fw, 5); g.fillStyle = '#ffd95e'; g.fillRect(23, gy + 1, fw, 2);
  if (P.keyPop > 0) { g.fillStyle = 'rgba(255,248,232,' + Math.min(1, P.keyPop).toFixed(2) + ')'; g.fillRect(23, gy + 1, 52, 5); }
  txo(g, 'x' + P.keys, 79, gy - pop, P.keys > 0 ? '#ffd95e' : '#9aa3b5');
  // top centre: the warden's health, or this floor's dread clock
  const boss = D.boss;
  if (boss && !boss.dead) {
    const bw = Math.min(170, VW - 220), bx = Math.round(VW / 2 - bw / 2), f = clamp(boss.hp / boss.max, 0, 1);
    txo(g, boss.def.name, VW / 2, 4, '#ff9ec4', '#1a1426', 0.5);
    g.fillStyle = '#1a1426'; g.fillRect(bx - 1, 14, bw + 2, 6); g.fillStyle = '#5a2030'; g.fillRect(bx, 15, bw, 4);
    g.fillStyle = '#e8474c'; g.fillRect(bx, 15, Math.round(bw * f), 4); g.fillStyle = '#ff9ec4'; g.fillRect(bx, 15, Math.round(bw * f), 1);
  } else {
    txo(g, fmtTime(G.t), VW / 2, 4, '#fff8e8', '#1a1426', 0.5);
    for (let i = 0; i < FLOORS.length; i++) { g.fillStyle = '#1a1426'; g.fillRect(VW / 2 + 19 + i * 6, 5, 5, 5); g.fillStyle = i < G.floor ? '#ffd95e' : i === G.floor ? '#fff8e8' : '#3b2d4f'; g.fillRect(VW / 2 + 20 + i * 6, 6, 3, 3); }
    if (G.endless) txo(g, 'ENDLESS', VW / 2, 14, '#9cecf2', '#1a1426', 0.5);
    else if (G.bossDown) txo(g, 'FLOOR CLEAR: TAKE THE STAIRS', VW / 2, 14, (Math.floor(t * 2) & 1) ? '#ffd95e' : '#fff8e8', '#1a1426', 0.5);
    else {
      const bw = 72, bx = Math.round(VW / 2 - bw / 2), lim = clockLimit(), f = clamp(G.t / lim, 0, 1), ready = stairsReady();
      g.fillStyle = '#1a1426'; g.fillRect(bx - 1, 14, bw + 2, 4); g.fillStyle = '#3b2d4f'; g.fillRect(bx, 15, bw, 2);
      g.fillStyle = f > 0.85 ? '#ff6a6a' : '#9a62d6'; g.fillRect(bx, 15, Math.round(bw * f), 2);
      for (const ev of G.F.timeline) { g.fillStyle = '#1a1426'; g.fillRect(bx + Math.round(bw * ev.t / lim), 15, 1, 2); }
      g.drawImage(SPR.door_icon.c, bx + bw + 2, 10);
      // five pips: rooms drafted on this floor; full = the Stairwell is on offer
      for (let i = 0; i < STAIRS_MIN; i++) { g.fillStyle = '#1a1426'; g.fillRect(bx - 2 + i * 5, 20, 4, 4); g.fillStyle = D.stairsBuilt || i < G.fstat.rooms ? '#ffd95e' : '#3b2d4f'; g.fillRect(bx - 1 + i * 5, 21, 2, 2); }
      if (ready && (Math.floor(t * 2) & 1)) txo(g, 'STAIRS', bx + 27, 19, '#ffd95e', '#1a1426');
    }
  }
  if (G.roomLabel) { const L_ = G.roomLabel; g.globalAlpha = clamp(Math.min(L_.t * 4, (2.4 - L_.t) * 2), 0, 1); txo(g, '~ ' + L_.text + ' ~', VW / 2, 30, '#ffd95e', '#1a1426', 0.5); g.globalAlpha = 1; }
  // minimap
  const mw = GRID * 7, mh = GRID * 5, mx = VW - mw - 6, my = 5, doors = G.sealed.length, pr = CURVE.pressure(doors, charm('wedge'));
  g.fillStyle = 'rgba(13,10,26,0.6)'; g.fillRect(mx - 2, my - 2, mw + 4, mh + 4); g.fillStyle = '#3b2d4f'; g.fillRect(mx - 2, my - 2, mw + 4, 1); g.fillRect(mx - 2, my + mh + 1, mw + 4, 1); g.fillRect(mx - 2, my - 2, 1, mh + 4); g.fillRect(mx + mw + 1, my - 2, 1, mh + 4);
  drawMap(g, mx, my, 7, 5, true);
  txo(g, G.rooms.length + (G.rooms.length === 1 ? ' room  ' : ' rooms  ') + doors + (doors === 1 ? ' door' : ' doors'), VW - 6, my + mh + 5, '#9aa3b5', '#1a1426', 1);
  txo(g, 'knocking x' + pr.toFixed(2), VW - 6, my + mh + 14, pr > 1.45 ? '#ff7a7a' : pr > 1.1 ? '#ffd95e' : '#b5e85a', '#1a1426', 1);
  // loadout: weapons, then charms wrapping upward
  if (App.mode !== 'draft') {
    const ly = VH - 21; let lx = drawLoadout(g, 5, ly, P, true) + 4, row = 0; const x0 = lx;
    for (const id in P.charms) {
      if (lx + 15 > VW - 4) { lx = x0; row++; }
      g.fillStyle = 'rgba(26,20,38,0.7)'; g.fillRect(lx, ly + 1 - row * 16, 15, 15); ds(g, SPR['i_' + id], lx + 7, ly + 8 - row * 16); if (CHARMS[id].max > 1) miniNum(g, P.charms[id], lx + 13, ly + 11 - row * 16, P.charms[id] >= CHARMS[id].max ? 'y' : 'w'); lx += 16;
    }
  }
  // off-screen pointers: nearest sealed door while you hold a key, and the open stairs
  const pointer = (wx, wy, col, spr) => {
    const sx = wx - G.view.cx, sy = wy - G.view.cy; if (!(sx < 8 || sy < 28 || sx > VW - 8 || sy > VH - 28)) return;
    const a = Math.atan2(wy - P.y, wx - P.x), px = clamp(sx, 18, VW - 18), py = clamp(sy, 40, VH - 34), bob = Math.round(Math.sin(t * 6) * 2);
    if (spr) ds(g, spr, px - Math.cos(a) * 9, py + 2 - Math.sin(a) * 9);
    for (let pass = 0; pass < 2; pass++) { g.fillStyle = pass ? col : '#1a1426'; for (let i = -3; i <= 3; i++) g.fillRect(Math.round(px + Math.cos(a) * (4 + bob) - Math.sin(a) * i - Math.cos(a) * Math.abs(i)) - (pass ? 0 : 1), Math.round(py + Math.sin(a) * (4 + bob) + Math.cos(a) * i - Math.sin(a) * Math.abs(i)) - (pass ? 0 : 1), pass ? 1 : 3, pass ? 1 : 3); }
  };
  if (G.view && !G.won && !G.over) {
    if (P.keys > 0) { let best = null, bd = 1e9; for (const d of G.sealed) { const dd = Math.hypot(d.x - P.x, d.y - P.y); if (dd < bd) { bd = dd; best = d; } } if (best) pointer(best.x, best.y, '#ffd95e', SPR.key); }
    if (G.stairs && G.stairs.open) pointer(G.stairs.x, G.stairs.y, '#9cecf2', null);
  }
  // banner
  if (G.banner) {
    const b = G.banner, a = Math.min(1, b.t / 0.2, (b.d - b.t) / 0.3), y = Math.round(VH * 0.22 - (1 - easeOut(Math.min(1, b.t / 0.25))) * 8), big = textW(b.text) * 2 < VW - 20 ? 2 : 1;
    const sub = b.sub ? wrapText(b.sub, VW - 30) : [];
    g.globalAlpha = clamp(a, 0, 1); g.fillStyle = 'rgba(13,10,26,0.6)'; g.fillRect(0, y - 6, VW, 12 + 8 * big + sub.length * 10);
    txo(g, b.text, VW / 2, y, b.col, '#1a1426', 0.5, big); sub.forEach((ln, i) => txo(g, ln, VW / 2, y + 4 + 9 * big + i * 10, '#fff8e8', '#1a1426', 0.5));
    g.globalAlpha = 1;
  }
  // tutorial hint or one-time tip
  const hint = App.mode !== 'play' ? '' : (G.tut.step < HINTS.length && HINTS[G.tut.step]) || G.tipText;
  if (hint) {
    const lines = wrapText(hint, VW - 44), w = Math.max(...lines.map(textW)) + 16, h = lines.length * 10 + 6, x = Math.round(VW / 2 - w / 2), y = VH - 30 - h;
    panel(g, x, y, w, h, '#ffd95e', '#241d3a'); lines.forEach((ln, i) => txt(g, ln, VW / 2, y + 4 + i * 10, '#fff8e8', 0.5));
  }
  if (Input.stick.on) { const st = Input.stick; pxRing(g, st.ox, st.oy, 22, 'rgba(255,248,232,0.45)'); pxRing(g, st.ox + st.x * 22, st.oy + st.y * 22, 8, '#ffd95e'); pxRing(g, st.ox + st.x * 22, st.oy + st.y * 22, 7, '#ffd95e'); }
  if (Input.touch && App.mode === 'play') { g.fillStyle = 'rgba(13,10,26,0.6)'; g.fillRect(VW / 2 + 44, 3, 13, 13); g.fillStyle = '#d8dbe6'; g.fillRect(VW / 2 + 48, 6, 2, 7); g.fillRect(VW / 2 + 52, 6, 2, 7); }
}
