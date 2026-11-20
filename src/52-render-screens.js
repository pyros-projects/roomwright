/* ========================== 14c RENDER: screens ======================= */
// ---- draft ----
const rerollLabel = D => (Input.touch ? '' : 'R  ') + 'DEAL AGAIN  x' + D.rerolls, rerollW = D => textW(rerollLabel(D)) + 12;
const knockLabel = () => (Input.touch ? '' : 'R  ') + 'KNOCK BACK' + ['', '  !', '  !!'][knockTier()], knockW = () => textW(knockLabel()) + 12;   // the marks: what the next knock costs
function draftLayout() {
  const D = G.draft, n = D.cards.length, gap = n > 3 ? 4 : 6, barH = D.stairs || D.locked ? 19 : 0;   // the Stairwell bar, open or still locked
  // A card needs 175px for three lines of room text above its boon. A view too short for that plus the bar
  // and the key legend goes compact: the legend moves to the top right and the cards take its place.
  const compact = barH > 0 && VH - 46 - barH < 175;
  const cw = Math.min(128, Math.floor((VW - 14 - gap * (n - 1)) / n)), ch = Math.min(178, VH - (compact ? 31 : 46) - barH), tw = n * cw + (n - 1) * gap;
  const x0 = Math.round((VW - tw) / 2), y0 = compact ? 28 : Math.round((VH - ch - barH) / 2) + 5;
  return { compact, rects: D.cards.map((_, i) => ({ x: x0 + i * (cw + gap), y: y0, w: cw, h: ch })), bar: D.stairs ? { x: x0, y: y0 + ch + 4, w: tw, h: 15 } : null,
    lock: !D.stairs && D.locked ? { x: x0, y: y0 + ch + 4, w: tw, h: 15 } : null, help: { x: x0, y: y0 - 27, w: textW(helpLabel()) + 12, h: 13 },
    re: D.rerolls > 0 ? { x: x0 + tw - rerollW(D), y: y0 - 27, w: rerollW(D), h: 13 } : null,     // the Map Room's 'deal again' chip
    kb: D.rerolls > 0 ? null : { x: x0 + tw - knockW(), y: y0 - 27, w: knockW(), h: 13 } };       // or, without a free deal, 'knock back'
}
function miniRoom(g, x, y, w, h, col, doors, fresh) {
  g.fillStyle = shade(col, 0.5); g.fillRect(x + 1, y + 1, w - 2, h - 2); g.fillStyle = col; g.fillRect(x + 2, y + 2, w - 4, h - 4);
  const mx = x + (w >> 1), my = y + (h >> 1);
  for (let d = 0; d < 4; d++) {
    if (!doors[d]) continue;
    g.fillStyle = doors[d] === 1 ? (fresh ? ((Math.floor(frameT * 4) & 1) ? '#ffb0b0' : '#ff4a5e') : '#a03a50') : '#fff8e8';
    if (d === 0) g.fillRect(mx - 3, y, 6, 2); else if (d === 2) g.fillRect(mx - 3, y + h - 2, 6, 2); else if (d === 3) g.fillRect(x, my - 3, 2, 6); else g.fillRect(x + w - 2, my - 3, 2, 6);
  }
}
function drawPlan(g, card, x, y, w, h) {   // 3x3 neighbourhood blueprint: where the room lands, what it links to, what resonates
  const D = G.draft, ch = Math.floor(h / 3), cw = Math.min(Math.floor(w / 3), ch * 2), ox = x + ((w - cw * 3) >> 1), oy = y + ((h - ch * 3) >> 1), me = ROOM_TYPES[card.type];
  g.fillStyle = '#141028'; g.fillRect(x, y, w, h); g.fillStyle = '#1e1a3c'; for (let i = 4; i < w; i += 8) for (let j = 4; j < h; j += 8) g.fillRect(x + i, y + j, 1, 1);
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
    const cx = D.cx + i, cy = D.cy + j, px = ox + (i + 1) * cw, py = oy + (j + 1) * ch;
    if (!inGrid(cx, cy)) { g.fillStyle = '#0d0a1a'; g.fillRect(px, py, cw, ch); continue; }
    const room = G.cells[cy * GRID + cx];
    if (i === 0 && j === 0) { miniRoom(g, px, py, cw, ch, me.col, card.plan.doors, true); ds(g, SPR['i_' + card.type], px + (cw >> 1), py + (ch >> 1)); }
    else if (room) miniRoom(g, px, py, cw, ch, mix(room.def.col, '#141028', 0.6), room.doors, false);
  }
  // resonance sparks on the links that would resonate
  for (let d = 0; d < 4; d++) {
    if (card.plan.doors[d] < 2) continue; const nx = D.cx + DIRS[d].x, ny = D.cy + DIRS[d].y, nb = inGrid(nx, ny) ? G.cells[ny * GRID + nx] : null;
    if (!nb || !resonates({ el: me.el }, nb)) continue;
    const sx = ox + cw + (cw >> 1) + DIRS[d].x * (cw >> 1), sy = oy + ch + (ch >> 1) + DIRS[d].y * (ch >> 1), k = 2 + (Math.floor(frameT * 5) & 1);
    g.fillStyle = ELEMENTS[me.el === 'stone' ? nb.el : me.el].col; g.fillRect(sx - k, sy - 1, k * 2 + 1, 2); g.fillRect(sx - 1, sy - k, 2, k * 2 + 1);
  }
  if (card.res > 0) txo(g, '+' + Math.round(card.res * (CURVE.res + 0.1 * charm('trowel')) * 100) + '%', x + 2, y + 2, ELEMENTS[me.el].col, '#1a1426');
  if (card.evo) { const b = SPR['i_' + card.evo.id]; g.globalAlpha = card.evo.ready ? 1 : 0.55; ds(g, b, x + w - 9, y + 9); g.globalAlpha = 1; txo(g, card.evo.ready ? 'EVOLVE!' : 'Lv' + card.evo.lv + '/5', x + w - 2, y + h - 10, card.evo.ready ? ((Math.floor(frameT * 4) & 1) ? '#ffd95e' : '#fff8e8') : '#9aa3b5', '#1a1426', 1); }
}
function drawCard(g, card, r, sel, t, i) {
  const def = ROOM_TYPES[card.type], ap = clamp((t - i * 0.06) / 0.22, 0, 1); if (ap <= 0) return;
  const x = r.x, w = r.w, h = r.h, y = Math.round(r.y + (1 - easeBack(ap)) * 26 - (sel ? 3 : 0)), b = card.boon, el = ELEMENTS[def.el];
  panel(g, x, y, w, h, sel ? '#ffd95e' : '#4c5a84', sel ? '#2a2246' : '#1f1a36');
  g.fillStyle = def.col; g.fillRect(x + 3, y + 3, w - 6, 13); g.fillStyle = shade(def.col, 0.7); g.fillRect(x + 3, y + 15, w - 6, 1);
  txs(g, def.name, x + w / 2, y + 6, '#fff8e8', 0.5, shade(def.col, 0.38));
  txt(g, String(i + 1), x + 6, y + 6, shade(def.col, 0.45));
  drawPlan(g, card, x + 5, y + 19, w - 10, 42);
  // element and star level
  ds(g, SPR['e_' + def.el], x + 10, y + 68); txt(g, el.name, x + 17, y + 64, el.col);
  const up = card.lv > 0 && card.lvTo > card.lv, stars = '```'.slice(0, card.lvTo);
  txt(g, stars, x + w - 6, y + 64, up ? '#b5e85a' : card.lv > 0 ? '#9aa3b5' : '#ffd95e', 1);
  if (up) txt(g, 'UP', x + w - 8 - textW(stars), y + 64, '#b5e85a', 1); else if (card.lv > 0) txt(g, 'MAX', x + w - 8 - textW(stars), y + 64, '#9aa3b5', 1);
  if (card.fresh) { const fw = textW('NEW CARD') + 6; g.fillStyle = '#1a1426'; g.fillRect(x + w - fw - 3, y + 18, fw + 2, 11); g.fillStyle = '#9cecf2'; g.fillRect(x + w - fw - 2, y + 19, fw, 9); txt(g, 'NEW CARD', x + w - fw + 1, y + 20, '#1a1426'); }
  // what the room does (and what the level-up adds)
  // narrow cards (four in a row) pack their text tighter so a boon gets three lines instead of two
  const tight = w < 112, lp = tight ? 8 : 9;
  let ty = y + 76; const lines = wrapText(def.text, w - 12).slice(0, up ? 2 : 3);
  for (const line of lines) { txt(g, line, x + 6, ty, '#d8dbe6'); ty += lp; }
  if (up) for (const line of wrapText(def.lv[card.lvTo - 1], w - 12).slice(0, 3 - lines.length)) { txt(g, line, x + 6, ty, '#b5e85a'); ty += lp; }
  // the boon
  const by = y + h - (tight ? 75 : 72), dy0 = by + (tight ? 35 : 37), dn = tight ? 3 : 2, tag = card.hidden ? 'x2' : boonTag(b) + (card.mul > 1 ? ' x2' : '');
  g.fillStyle = '#4c5a84'; g.fillRect(x + 6, by, w - 12, 1);
  txt(g, 'BOON', x + 6, by + 4, '#9aa3b5'); txt(g, tag, x + w - 6, by + 4, card.mul > 1 ? '#ff9ec4' : tag === 'NEW!' ? '#b5e85a' : '#9cecf2', 1);
  g.fillStyle = '#0d0a1a'; g.fillRect(x + 6, by + 15, 18, 18); g.fillStyle = '#3b2d4f'; g.fillRect(x + 7, by + 16, 16, 16);
  if (card.hidden) { txt(g, '?', x + 15, by + 20, '#ff9ec4', 0.5); txt(g, 'Mystery', x + 28, by + 20, '#ffd95e'); ty = dy0; for (const line of wrapText('Could be anything. You get it twice.', w - 12).slice(0, dn)) { txt(g, line, x + 6, ty, '#d8dbe6'); ty += lp; } }
  else {
    ds(g, boonIcon(b), x + 15, by + 24);
    const nm = wrapText(boonName(b), w - (b.kind === 'w' ? 52 : 34)); txt(g, nm[0], x + 28, by + 15 + (nm.length > 1 ? 0 : 5), '#ffd95e'); if (nm[1]) txt(g, nm[1], x + 28, by + 24, '#ffd95e');
    ty = dy0; for (const line of wrapText(boonDesc(b), w - 12).slice(0, dn)) { txt(g, line, x + 6, ty, '#d8dbe6'); ty += lp; }
    if (b.kind === 'w') { const er = WEAPONS[b.id].evo.room, has = evoReach(b.id) > 0; g.globalAlpha = has ? 1 : 0.35; ds(g, SPR['i_' + er], x + w - 13, by + 24); g.globalAlpha = 1; }
  }
  // doors: what this does to the knocking
  const fy = y + h - 13, fr = card.plan.fresh, pc = card.pressure;
  g.fillStyle = '#4c5a84'; g.fillRect(x + 6, fy - (tight ? 3 : 4), w - 12, 1);
  for (let k = 0; k < fr; k++) g.drawImage(SPR.door_icon.c, x + 6 + k * 8, fy - 2);
  txt(g, fr === 0 ? 'Dead end' : '+' + fr, x + 8 + fr * 8, fy, fr === 0 ? '#9cecf2' : '#fff8e8');
  txt(g, (pc > 0 ? '+' : '') + pc + '%', x + w - 6, fy, pc > 0 ? '#ff9ec4' : pc < 0 ? '#b5e85a' : '#9aa3b5', 1);
  if (card.plan.links) txt(g, 'link', x + w - 12 - textW((pc > 0 ? '+' : '') + pc + '%'), fy, '#b5e85a', 1);
  if (sel) { const bx = x + (w >> 1), by2 = y - 9 + Math.round(Math.sin(frameT * 7) * 2); g.fillStyle = '#1a1426'; g.fillRect(bx - 5, by2 - 1, 11, 3); g.fillRect(bx - 3, by2 + 2, 7, 2); g.fillRect(bx - 1, by2 + 4, 3, 2); g.fillStyle = '#ffd95e'; g.fillRect(bx - 4, by2, 9, 1); g.fillRect(bx - 3, by2 + 1, 7, 1); g.fillRect(bx - 2, by2 + 2, 5, 1); g.fillRect(bx - 1, by2 + 3, 3, 1); g.fillRect(bx, by2 + 4, 1, 1); }
}
function renderDraft(g) {
  const D = G.draft, L_ = draftLayout(), rects = L_.rects;
  g.fillStyle = 'rgba(13,10,26,0.78)'; g.fillRect(0, 0, VW, VH);
  const keys_ = Input.touch ? 'tap a card to build it' : 'ENTER build   ESC step back' + (L_.bar ? '   DOWN stairs' : '');   // a compact view has no room below: the legend takes the title's place
  txo(g, L_.compact ? keys_ : 'WHAT LIES BEHIND THIS DOOR?', VW / 2, rects[0].y - 23, L_.compact ? '#9aa3b5' : '#ffd95e', '#1a1426', 0.5);
  D.cards.forEach((c, i) => drawCard(g, c, rects[i], !D.onStairs && i === D.sel, D.t, i));
  if (L_.bar) {
    const b = L_.bar, on = D.onStairs;
    panel(g, b.x, b.y - (on ? 1 : 0), b.w, b.h, on ? '#ffd95e' : '#6a6a8a', on ? '#3a3052' : '#24203a');
    ds(g, SPR.i_stairs, b.x + 11, b.y + 7); txt(g, 'THE STAIRWELL', b.x + 22, b.y + 4, on ? '#ffd95e' : '#c8c8e0');
    const keys = swiftLeft();       // what it would wake right now, and what a fast kill would still pay
    txt(g, 'warden at ' + Math.round(wardenShare() * 100) + '%   ' + (keys ? 'a fast kill pays ' + keys + (keys > 1 ? ' keys' : ' key') : 'no keys for speed now'), b.x + b.w - 6, b.y + 4, on ? '#fff8e8' : '#9aa3b5', 1);
  }
  if (L_.lock) {                    // not on offer yet: say what it takes
    const b = L_.lock; panel(g, b.x, b.y, b.w, b.h, '#3b3b5a', '#1c1830');
    g.globalAlpha = 0.45; ds(g, SPR.i_stairs, b.x + 11, b.y + 7); g.globalAlpha = 1; txt(g, 'THE STAIRWELL', b.x + 22, b.y + 4, '#6a6a8a');
    txt(g, 'draft ' + D.locked + ' more room' + (D.locked === 1 ? '' : 's') + ' to unlock it', b.x + b.w - 6, b.y + 4, '#9aa3b5', 1);
  }
  { const r = L_.help, hot = Input.inRect(r) && !D.coach; panel(g, r.x, r.y, r.w, r.h, hot ? '#ffd95e' : '#4c5a84', hot ? '#3a3052' : '#24203a'); txt(g, helpLabel(), r.x + r.w / 2, r.y + 3, hot ? '#ffd95e' : '#9cecf2', 0.5); }
  if (L_.kb) { const r = L_.kb, hot = Input.inRect(r) && !D.coach, col = ['#ff9ec4', '#ffd95e', '#ff7a7a'][knockTier()]; panel(g, r.x, r.y, r.w, r.h, hot ? '#fff8e8' : col, hot ? '#3a3052' : '#24203a'); txt(g, knockLabel(), r.x + r.w / 2, r.y + 3, hot ? '#fff8e8' : col, 0.5); }
  if (L_.re) { const r = L_.re, hot = Input.inRect(r); panel(g, r.x, r.y, r.w, r.h, hot ? '#ffd95e' : '#4c5a84', hot ? '#3a3052' : '#24203a'); txt(g, rerollLabel(D), r.x + r.w / 2, r.y + 3, hot ? '#ffd95e' : '#9cecf2', 0.5); }
  let tip_ = G.tut.step === 2 ? 'A card is a room, its power, a boon and new doors. Doors let monsters in.' : Input.touch ? 'Tap a card to build it. Tap outside to step back.' : 'LEFT/RIGHT choose   ENTER build   ESC step back' + (L_.bar ? '   DOWN stairs' : '');
  const low = L_.bar || L_.lock;
  if (!L_.compact) txo(g, tip_, VW / 2, (low ? low.y + low.h : rects[0].y + rects[0].h) + 5, G.tut.step === 2 ? '#fff8e8' : '#9aa3b5', '#1a1426', 0.5);
  renderCoach(g, D, L_);
}

// ---- menus ----
function menuRects(n, y0, w = 150, lh = 14) { const x = Math.round(VW / 2 - w / 2); return Array.from({ length: n }, (_, i) => ({ x, y: y0 + i * lh, w, h: lh })); }
function drawMenu(g, items, rects, sel) {
  items.forEach((it, i) => {
    const r = rects[i], on = i === sel;
    if (on) { g.fillStyle = 'rgba(255,217,94,0.14)'; g.fillRect(r.x, r.y, r.w, r.h - 1); txt(g, '>', r.x + 4 + Math.round(Math.sin(frameT * 8)), r.y + 3, '#ffd95e'); }
    txt(g, it.label, r.x + 14, r.y + 3, on ? '#ffd95e' : '#d8dbe6');
    if (it.value !== undefined) {
      if (typeof it.value === 'number') for (let k = 0; k < 5; k++) { g.fillStyle = k < Math.round(it.value * 5) ? (on ? '#ffd95e' : '#9cecf2') : '#3b2d4f'; g.fillRect(r.x + r.w - 44 + k * 8, r.y + 3, 6, 7); }
      else txt(g, it.value, r.x + r.w - 6, r.y + 3, on ? '#ffd95e' : '#9cecf2', 1);
    }
  });
}
function drawBuild(g, cx, y, P, maxW) {    // centred row(s) of everything you carry
  const ids = Object.keys(P.charms), per = Math.max(4, Math.floor(maxW / 16)), rows = [];
  const all = P.weapons.map(w => ({ w })).concat(ids.map(id => ({ id })));
  for (let i = 0; i < all.length; i += per) rows.push(all.slice(i, i + per));
  rows.forEach((row, ri) => {
    let x = Math.round(cx - row.length * 8);
    for (const it of row) {
      if (it.w) { ds(g, weaponIcon(it.w), x + 8, y + 8 + ri * 16); if (!it.w.evo) miniNum(g, it.w.lv, x + 14, y + 11 + ri * 16, 'w'); }
      else { ds(g, SPR['i_' + it.id], x + 8, y + 8 + ri * 16); if (CHARMS[it.id].max > 1) miniNum(g, P.charms[it.id], x + 14, y + 11 + ri * 16, 'w'); }
      x += 16;
    }
  });
  return rows.length * 16;
}
// The damage tally as one row: what did the work so far, largest first. An icon and its share; the line under
// the icon says what it is (gold: a weapon, blue: a room, green: a charm). What does not fit is summed at the end.
function drawTally(g, x, y, w) {
  const list = tallyList(); if (!list.length) return;
  txt(g, 'DAMAGE', x, y + 4, '#9aa3b5'); let lx = x + textW('DAMAGE') + 8, rest = 0, full = false;
  list.forEach((t, i) => {
    const s = Math.round(t.share * 100) + '%', ew = 18 + textW(s) + 6, room = i < list.length - 1 ? 26 : 0;
    if (full || !t.icon || lx + ew > x + w - room) { if (t.icon) full = true; rest += t.share; return; }
    ds(g, t.icon, lx + 8, y + 8); g.fillStyle = t.kind === 'r' ? '#9cecf2' : t.kind === 'c' ? '#b5e85a' : '#ffd95e'; g.fillRect(lx + 2, y + 16, 12, 1);
    txt(g, s, lx + 18, y + 4, '#fff8e8'); lx += ew;
  });
  if (rest >= 0.005) txt(g, '+' + Math.round(rest * 100) + '%', lx, y + 4, '#5d667c');
}
function pauseItems() { const o = Save.data.opts; return [{ label: 'Resume' }, { label: 'Music', value: o.music }, { label: 'Sound', value: o.sfx }, { label: 'Screen shake', value: o.shake ? 'ON' : 'OFF' }, { label: 'Mouse walk', value: o.mouse === 'drag' ? 'DRAG' : 'TO POINTER' }, { label: 'Restart run' }, { label: 'Quit to title' }]; }
function pauseLayout() { const items = pauseItems(), h = items.length * 14 + 102 + (G.stakes ? 20 : 0), y = Math.round(VH / 2 - h / 2); return { items, h, y, rects: menuRects(items.length, y + 36, 170) }; }
// one line for the Stakes in force: the step, its own rule, and how many came before it
const stakesLine = n => 'STAKES ' + n + ': ' + STAKES[n - 1] + (n > 1 ? '  (and the ' + (n - 1) + ' before it)' : '');
function renderPause(g) {
  g.fillStyle = 'rgba(13,10,26,0.7)'; g.fillRect(0, 0, VW, VH);
  const L_ = pauseLayout(), y = L_.y, P = G.P, hero = HEROES[G.hero];
  panel(g, VW / 2 - 110, y, 220, L_.h);
  txs(g, 'PAUSED', VW / 2, y + 8, '#ffd95e', 0.5);
  txt(g, hero.name + ' the ' + hero.title + '  -  ' + G.F.name + '  -  ' + fmtTime(G.tRun), VW / 2, y + 21, '#9aa3b5', 0.5);
  drawMenu(g, L_.items, L_.rects, App.sel);
  const sk = G.stakes ? 20 : 0;       // two lines for the Stakes in force: the step, and the rule it adds
  drawBuild(g, VW / 2, y + L_.h - 62 - sk, P, 200);
  drawTally(g, VW / 2 - 100, y + L_.h - 30 - sk, 200);
  if (sk) { txt(g, 'STAKES ' + G.stakes + (G.stakes > 1 ? ': every rule up to' : ':'), VW / 2, y + L_.h - 32, '#ff9ec4', 0.5); txt(g, STAKES[G.stakes - 1], VW / 2, y + L_.h - 22, '#fff8e8', 0.5); }
  txt(g, 'M mutes everything', VW / 2, y + L_.h - 11, '#5d667c', 0.5);
}
function endItems() { return App.mode === 'win' ? [{ label: 'Keep delving (endless)' }, { label: 'New run' }, { label: 'Back to title' }] : [{ label: 'Try again' }, { label: 'Back to title' }]; }
function endLayout() { const items = endItems(), h = 206 + (items.length - 2) * 14, y = Math.max(2, Math.round(VH / 2 - h / 2)); return { items, h, y, rects: menuRects(items.length, y + h - items.length * 14 - 8, 170) }; }
function drawNewCards(g, x, y, w, label) {   // cards and heroes unlocked this run
  const n = G.newCards.length + G.newHeroes.length; if (!n) return 0;
  txt(g, label, x, y, '#9cecf2'); let lx = x + textW(label) + 6;
  for (const id of G.newHeroes) { g.drawImage(SPR[id + 'D0'].c, lx, y - 6); lx += 18; }
  for (const id of G.newCards) { if (lx + 16 > x + w) break; ds(g, SPR['i_' + id], lx + 8, y + 3); lx += 16; }
  return 14;
}
function renderEnd(g) {
  const win = App.mode === 'win', L_ = endLayout(), y = L_.y, S = G.stats, x = Math.round(VW / 2 - 135), P = G.P;
  g.fillStyle = win ? 'rgba(40,30,10,0.55)' : 'rgba(30,6,16,0.66)'; g.fillRect(0, 0, VW, VH);
  panel(g, x, y, 270, L_.h, win ? '#ffd95e' : '#a32a3c');
  txo(g, win ? 'THE KNOCKING STOPS' : 'THE DARK GOT IN', VW / 2, y + 9, win ? '#ffd95e' : '#ff9ec4', '#1a1426', 0.5, 2);
  txt(g, win ? 'Three floors, three wardens, one very good floor plan.' : 'Every door you opened was a choice. Choose again?', VW / 2, y + 30, '#d8dbe6', 0.5);
  const rows = [['Reached', G.F.name], ['Time', fmtTime(G.tRun)], ['Rooms drafted', String(S.rooms)], ['Monsters felled', String(S.kills)], ['Weapons evolved', String(S.evos)]];
  if (G.stakes) rows.push(['Stakes', String(G.stakes)]);
  rows.forEach((r, i) => { txt(g, r[0], x + 14, y + 44 + i * 9, '#9aa3b5'); txt(g, r[1], x + 128, y + 44 + i * 9, r[0] === 'Stakes' ? '#ff9ec4' : '#fff8e8', 1); });
  if (App.stakesNew) txt(g, 'STAKES ' + App.stakesNew + ' IS OPEN', x + 14, y + 100, (Math.floor(frameT * 4) & 1) ? '#ff9ec4' : '#fff8e8');
  else if (App.record) txt(g, 'NEW BEST!', x + 14, y + 100, (Math.floor(frameT * 4) & 1) ? '#ffd95e' : '#f6923a');
  // the dungeon you built on this floor
  let x0 = 9, x1 = 0, y0 = 9, y1 = 0; for (const r of G.rooms) { x0 = Math.min(x0, r.cx); x1 = Math.max(x1, r.cx); y0 = Math.min(y0, r.cy); y1 = Math.max(y1, r.cy); }
  const cw = Math.min(14, Math.floor(118 / (x1 - x0 + 1))), ch = Math.min(10, Math.floor(60 / (y1 - y0 + 1)), Math.round(cw * 0.72)), mw = (x1 - x0 + 1) * cw, mh = (y1 - y0 + 1) * ch;
  g.fillStyle = '#141028'; g.fillRect(x + 138, y + 44, 120, 64);
  drawMap(g, x + 138 + ((120 - mw) >> 1) - x0 * cw, y + 44 + ((64 - mh) >> 1) - y0 * ch, cw, ch, false);
  drawTally(g, x + 14, y + 110, 242);
  drawBuild(g, VW / 2, y + 128, P, 240);
  drawNewCards(g, x + 14, y + L_.h - L_.items.length * 14 - 22, 240, 'UNLOCKED');
  drawMenu(g, L_.items, L_.rects, App.sel);
}

// ---- between floors ----
function renderDescend(g) {
  const fs = App.descend, x = Math.round(VW / 2 - 130), h = 150, y = Math.round(VH / 2 - h / 2), next = FLOORS[fs.next], t = frameT;
  g.fillStyle = next.void; g.fillRect(0, 0, VW, VH);
  for (let i = 0; i < 40; i++) { const sx = (i * 97 + 13) % VW, sy = ((i * 53 + t * (20 + i % 7 * 6)) % (VH + 20)) - 10; g.fillStyle = next.mark; g.fillRect(sx, VH - sy, 1, 4 + i % 3 * 3); }   // falling past the dark
  panel(g, x, y, 260, h, '#ffd95e');
  txo(g, 'FLOOR ' + (fs.next) + ' CLEARED', VW / 2, y + 9, '#ffd95e', '#1a1426', 0.5, 2);
  const rows = [['Time on this floor', fmtTime(fs.time)], ['Rooms drafted', String(fs.rooms)], ['Swift bonus', fs.swift ? '+' + fs.swift + (fs.swift > 1 ? ' keys' : ' key') : 'none'], ['On arrival', 'a heart mended']];
  rows.forEach((r, i) => { txt(g, r[0], x + 16, y + 34 + i * 11, '#9aa3b5'); txt(g, r[1], x + 244, y + 34 + i * 11, '#fff8e8', 1); });
  g.fillStyle = '#4c5a84'; g.fillRect(x + 12, y + 82, 236, 1);
  txt(g, 'NEXT:', x + 16, y + 88, '#9aa3b5'); txt(g, next.name.toUpperCase(), x + 16 + textW('NEXT: '), y + 88, '#9cecf2');
  txt(g, 'Rooms that only grow down there:', x + 16, y + 100, '#9aa3b5');
  let lx = x + 16; for (const id of next.natives) { g.fillStyle = '#0d0a1a'; g.fillRect(lx, y + 110, 17, 17); g.fillStyle = '#3b2d4f'; g.fillRect(lx + 1, y + 111, 15, 15); if (Save.data.rooms[id]) ds(g, SPR['i_' + id], lx + 8, y + 118); else txt(g, '?', lx + 8, y + 115, '#9aa3b5', 0.5); lx += 19; }
  drawNewCards(g, x + 140, y + 116, 110, 'NEW');
  if ((Math.floor(t * 2.2) & 1) || App.fade) txo(g, Input.touch ? 'TAP TO DESCEND' : 'ENTER: DESCEND', VW / 2, y + h - 14, '#fff8e8', '#1a1426', 0.5);
}

// ---- choose your delver ----
function heroOwned(id) { return !!Save.data.heroes[id]; }
// the hero screen's boxes: sk is the height of the Stakes lines (0 until this delver has won), sy their top, dy the deck's
function prepLayout(id) { const sk = heroOwned(id) && stakesOpen(id) ? 22 : 0, h = 188 + sk, y = Math.round(VH / 2 - h / 2); return { sk, h, y, sy: y + 101, dy: y + 106 + sk }; }
function renderPrep(g) {
  const t = frameT, id = HERO_ORDER[App.prep.i], hero = HEROES[id], own = heroOwned(id), deck = deckFor(id), w = Math.min(360, VW - 24), L_ = prepLayout(id), h = L_.h, x = Math.round(VW / 2 - w / 2), y = L_.y;
  renderWorld(g); g.fillStyle = 'rgba(13,10,26,0.8)'; g.fillRect(0, 0, VW, VH);
  panel(g, x, y, w, h);
  txs(g, 'CHOOSE YOUR DELVER', VW / 2, y + 8, '#ffd95e', 0.5);
  // portrait
  const big = App.big[id], px = x + 22, py = y + 30;
  g.fillStyle = '#141028'; g.fillRect(px - 6, py - 4, 60, 66); g.fillStyle = '#2a2246'; g.fillRect(px - 5, py - 3, 58, 64);
  if (own) g.drawImage(big, px, py + 2 - (Math.floor(t * 2) & 1)); else { g.globalAlpha = 0.35; g.drawImage(App.big[id + '_sil'], px, py + 2); g.globalAlpha = 1; txt(g, '?', px + 24, py + 20, '#9aa3b5', 0.5, 2); }
  txt(g, '<', px - 16 - (Math.floor(t * 3) & 1), py + 24, '#ffd95e'); txt(g, '>', px + 58 + (Math.floor(t * 3) & 1), py + 24, '#ffd95e');
  for (let i = 0; i < HERO_ORDER.length; i++) { g.fillStyle = i === App.prep.i ? '#ffd95e' : heroOwned(HERO_ORDER[i]) ? '#9aa3b5' : '#3b2d4f'; g.fillRect(px + 12 + i * 8, py + 66, 5, 3); }
  // who they are
  const tx = x + 92; txt(g, own ? hero.name : '???', tx, y + 28, '#fff8e8', 0, 2); txt(g, own ? 'the ' + hero.title : 'locked', tx + (own ? textW(hero.name) * 2 + 6 : 40), y + 35, '#9aa3b5');
  if (own) {
    const wd = WEAPONS[hero.weapon]; g.fillStyle = '#0d0a1a'; g.fillRect(tx, y + 50, 18, 18); g.fillStyle = '#3b2d4f'; g.fillRect(tx + 1, y + 51, 16, 16); ds(g, SPR['i_' + hero.weapon], tx + 9, y + 59);
    txt(g, 'Starts with ' + wd.name, tx + 23, y + 51, '#ffd95e'); txt(g, wd.desc, tx + 23, y + 60, '#9aa3b5');
    let ty = y + 74; for (const ln of wrapText(hero.perk, w - 104)) { txt(g, ln, tx, ty, '#b5e85a'); ty += 9; }
  } else { let ty = y + 52; for (const ln of wrapText('To unlock: ' + hero.how, w - 104)) { txt(g, ln, tx, ty, '#ff9ec4'); ty += 9; } }
  // the Stakes: one pip per step (lit: chosen, dim: open, dark: still locked) and the rule the chosen step adds
  if (L_.sk) {
    const n = stakeOf(id), top = stakesOpen(id), sy = L_.sy; g.fillStyle = '#4c5a84'; g.fillRect(x + 10, sy, w - 20, 1);
    txt(g, 'STAKES', x + 14, sy + 5, n ? '#ff9ec4' : '#9aa3b5'); let px2 = x + 14 + textW('STAKES') + 6;
    for (let i = 1; i <= STAKES.length; i++) { g.fillStyle = '#0d0a1a'; g.fillRect(px2, sy + 4, 7, 7); g.fillStyle = i <= n ? '#ff6a9a' : i <= top ? '#6a5a84' : '#2a2246'; g.fillRect(px2 + 1, sy + 5, 5, 5); px2 += 9; }
    txt(g, Input.touch ? 'tap to change' : 'UP / DOWN', x + w - 14, sy + 5, '#5d667c', 1);
    txt(g, n ? stakesLine(n).slice(('STAKES ' + n + ': ').length) : 'The game as it is. A step up adds one rule.', x + 14, sy + 14, n ? '#fff8e8' : '#9aa3b5');
  }
  // their deck
  const dy = L_.dy; g.fillStyle = '#4c5a84'; g.fillRect(x + 10, dy - 6, w - 20, 1);
  txt(g, 'DECK', x + 14, dy, '#9aa3b5'); txt(g, deck.length + '/' + DECK_SIZE + '  Drafts deal these, plus one room native to the floor.', x + 14 + textW('DECK  '), dy, '#5d667c');
  let lx = Math.round(VW / 2 - deck.length * 10);
  for (const rid of deck) { const el = ELEMENTS[ROOM_TYPES[rid].el]; g.fillStyle = '#0d0a1a'; g.fillRect(lx, dy + 12, 19, 21); g.fillStyle = '#2a2246'; g.fillRect(lx + 1, dy + 13, 17, 19); g.fillStyle = el.col; g.fillRect(lx + 1, dy + 30, 17, 2); ds(g, SPR['i_' + rid], lx + 9, dy + 21); lx += 20; }
  const evo = Object.keys(WEAPONS).filter(wid => deck.indexOf(WEAPONS[wid].evo.room) >= 0);
  txt(g, 'Can evolve:', x + 14, dy + 42, '#9aa3b5'); lx = x + 14 + textW('Can evolve:  ');
  for (const wid of evo) { ds(g, SPR['i_' + wid + '_evo'], lx + 8, dy + 46); lx += 17; }
  txo(g, own ? (Input.touch ? 'TAP PORTRAIT: next   TAP DECK: edit   TAP HERE: start' : 'LEFT/RIGHT delver    Q edit deck    ENTER start    ESC back') : Input.touch ? 'TAP PORTRAIT: next delver' : 'LEFT/RIGHT delver    ESC back', VW / 2, y + h - 14, '#fff8e8', '#1a1426', 0.5);
}

// ---- deck builder ----
const EL_ORDER = ['stone', 'fire', 'frost', 'steel', 'water', 'lore', 'wild', 'shadow'];
const DECK_LIST = DRAFTABLE.slice().sort((a, b) => EL_ORDER.indexOf(ROOM_TYPES[a].el) - EL_ORDER.indexOf(ROOM_TYPES[b].el) || DRAFTABLE.indexOf(a) - DRAFTABLE.indexOf(b));
const DECK_COLS = 9;
function deckLayout() { const cs = 27, gx = Math.max(6, Math.round((VW - (DECK_COLS * cs + 8 + 132)) / 2)), gy = 30; return { cs, gx, gy, px: gx + DECK_COLS * cs + 8, pw: Math.min(150, VW - (gx + DECK_COLS * cs + 8) - 6), cells: DECK_LIST.map((id, i) => ({ id, x: gx + (i % DECK_COLS) * cs, y: gy + Math.floor(i / DECK_COLS) * cs, w: cs - 2, h: cs - 2 })) }; }
function howToGet(id) {
  const r = ROOM_TYPES[id], t = r.tier;
  if (t === 's') return 'Starter card.';
  if (t === 'h') { const h = HERO_ORDER.find(k => HEROES[k].sig === id); return 'Comes with ' + HEROES[h].name + '.'; }
  if (typeof t === 'number') return 'Draft it once on floor ' + t + ' (' + FLOORS[t - 1].name + ').';
  return 'Reward for beating the warden of floor ' + t[1] + '.';
}
function renderDeck(g) {
  const L_ = deckLayout(), hid = HERO_ORDER[App.prep.i], deck = deckFor(hid), cur = DECK_LIST[App.deck.cur], def = ROOM_TYPES[cur], own = !!Save.data.rooms[cur], t = frameT;
  g.fillStyle = '#141028'; g.fillRect(0, 0, VW, VH);
  g.fillStyle = '#1e1a3c'; for (let i = 6; i < VW; i += 12) for (let j = 6; j < VH; j += 12) g.fillRect(i, j, 1, 1);
  txo(g, HEROES[hid].name.toUpperCase() + "'S DECK", L_.gx, 8, '#ffd95e'); txo(g, deck.length + ' / ' + DECK_SIZE, L_.gx + DECK_COLS * L_.cs - 2, 8, deck.length === DECK_SIZE ? '#b5e85a' : '#ff9ec4', '#1a1426', 1);
  txt(g, Object.keys(Save.data.rooms).length + ' of ' + DRAFTABLE.length + ' cards collected', L_.gx, 19, '#5d667c');
  L_.cells.forEach((c, i) => {
    const r = ROOM_TYPES[c.id], has = !!Save.data.rooms[c.id], inDeck = deck.indexOf(c.id) >= 0, sel = i === App.deck.cur;
    g.fillStyle = sel ? '#ffd95e' : inDeck ? '#b5e85a' : '#0d0a1a'; g.fillRect(c.x - 1, c.y - 1, c.w + 2, c.h + 2);
    g.fillStyle = has ? (inDeck ? '#2f3a52' : '#241d3a') : '#17132b'; g.fillRect(c.x, c.y, c.w, c.h);
    g.fillStyle = has ? ELEMENTS[r.el].col : '#2a2350'; g.fillRect(c.x, c.y + c.h - 3, c.w, 3);
    if (has) { g.globalAlpha = inDeck ? 1 : 0.6; ds(g, SPR['i_' + c.id], c.x + (c.w >> 1), c.y + 11); g.globalAlpha = 1; } else txt(g, '?', c.x + (c.w >> 1), c.y + 7, '#3b2d4f', 0.5);
    if (inDeck) { g.fillStyle = '#b5e85a'; g.fillRect(c.x + c.w - 6, c.y + 1, 5, 5); g.fillStyle = '#1a1426'; g.fillRect(c.x + c.w - 5, c.y + 3, 1, 2); g.fillRect(c.x + c.w - 4, c.y + 4, 1, 1); g.fillRect(c.x + c.w - 3, c.y + 2, 1, 2); }
  });
  // details
  const px = L_.px, pw = L_.pw; panel(g, px, 28, pw, VH - 52, own ? ELEMENTS[def.el].col : '#4c5a84');
  let ty = 35;
  if (own) {
    txt(g, def.name, px + 7, ty, '#fff8e8'); ty += 11; ds(g, SPR['e_' + def.el], px + 11, ty + 4); txt(g, ELEMENTS[def.el].name, px + 18, ty, ELEMENTS[def.el].col); ty += 12;
    for (const ln of wrapText(def.text, pw - 14)) { txt(g, ln, px + 7, ty, '#d8dbe6'); ty += 9; } ty += 3;
    for (let lv = 1; lv < def.max; lv++) { txt(g, '```'.slice(0, lv + 1), px + 7, ty, '#ffd95e'); for (const ln of wrapText(def.lv[lv], pw - 14 - 20)) { txt(g, ln, px + 27, ty, '#b5e85a'); ty += 9; } }
    const ev = EVO_ROOM[cur]; if (ev) { ty += 3; ds(g, SPR['i_' + ev + '_evo'], px + 14, ty + 8); for (const ln of wrapText('Evolves ' + WEAPONS[ev].name + ' into ' + WEAPONS[ev].evo.name + '.', pw - 34)) { txt(g, ln, px + 26, ty, '#ffd95e'); ty += 9; } }
    if (def.el === 'stone') { ty += 3; for (const ln of wrapText('Stone resonates with every element.', pw - 14)) { txt(g, ln, px + 7, ty, '#9aa3b5'); ty += 9; } }
  } else { txt(g, '???', px + 7, ty, '#9aa3b5'); ty += 14; for (const ln of wrapText('Not collected yet. ' + howToGet(cur), pw - 14)) { txt(g, ln, px + 7, ty, '#ff9ec4'); ty += 9; } }
  txt(g, own ? (deck.indexOf(cur) >= 0 ? 'IN THE DECK' : 'not in the deck') : '', px + 7, VH - 36, deck.indexOf(cur) >= 0 ? '#b5e85a' : '#5d667c');
  txo(g, Input.touch ? 'Tap a card to add or remove it. Tap beside the cards when done.' : 'ARROWS move    ENTER add / remove    ESC done', L_.gx, VH - 14, '#9aa3b5');
  if (App.deck.msgT > 0) txo(g, App.deck.msg, L_.gx, VH - 26, (Math.floor(t * 6) & 1) ? '#ff9ec4' : '#fff8e8');
}

// ---- title ----
const LOGO = 'ROOMWRIGHT';
function renderTitle(g) {
  const t = frameT, hid = Save.data.hero;
  renderWorld(g);
  g.fillStyle = 'rgba(13,10,26,0.5)'; g.fillRect(0, 0, VW, VH);
  const gr = g.createLinearGradient(0, 0, 0, VH); gr.addColorStop(0, 'rgba(13,10,26,0.85)'); gr.addColorStop(0.45, 'rgba(13,10,26,0)'); gr.addColorStop(1, 'rgba(13,10,26,0.9)'); g.fillStyle = gr; g.fillRect(0, 0, VW, VH);
  // logo: chunky two-tone letters; the OO are a pair of eyes peeking through a door slit
  const sc = 4, lw = textW(LOGO) * sc, lx = Math.round(VW / 2 - lw / 2), ly = Math.round(VH * 0.14) + Math.round(Math.sin(t * 1.3) * 2);
  txo(g, LOGO, lx, ly + sc, '#1a1426', '#1a1426', 0, sc);
  txo(g, LOGO, lx, ly, '#f6923a', '#1a1426', 0, sc);
  g.save(); g.beginPath(); g.rect(lx - 4, ly, lw + 8, sc * 3); g.clip(); txt(g, LOGO, lx, ly, '#ffd95e', 0, sc); g.restore();
  g.save(); g.beginPath(); g.rect(lx - 4, ly, lw + 8, sc); g.clip(); txt(g, LOGO, lx, ly, '#fff8e8', 0, sc); g.restore();
  const blink = (t % 4.2) < 0.13, look = Math.round(Math.sin(t * 0.9) * 2);
  for (const i of [1, 2]) {
    const ex = lx + i * 6 * sc + sc, ey = ly + sc;
    g.fillStyle = '#1a1426'; g.fillRect(ex, ey, 3 * sc, 5 * sc);
    if (!blink) { g.fillStyle = '#fff8e8'; g.fillRect(ex + 1, ey + 5, 10, 10); g.fillStyle = '#1a1426'; g.fillRect(ex + 4 + look, ey + 8, 4, 6); g.fillStyle = '#fff8e8'; g.fillRect(ex + 5 + look, ey + 9, 1, 1); }
    else { g.fillStyle = '#f6923a'; g.fillRect(ex + 1, ey + 10, 10, 2); }
  }
  txo(g, 'every level-up is a room', VW / 2, ly + 9 * sc + 2, '#9cecf2', '#1a1426', 0.5);
  // mascots
  const my = Math.round(VH * 0.6), bob = Math.round(Math.abs(Math.sin(t * 3)) * 3);
  g.drawImage(SPR.sh_xl.c, VW / 2 - 65, my + 17); g.drawImage(App.big[hid], VW / 2 - 70, my - 30 - (Math.floor(t * 2) & 1));
  g.drawImage(App.big.key, VW / 2 - 24, my - 8 + Math.round(Math.sin(t * 2.5) * 2));
  g.drawImage(SPR.sh_xl.c, VW / 2 + 27, my + 17); g.drawImage(App.big['slime' + (bob > 1 ? 0 : 1)], VW / 2 + 26, my - 12 - bob);
  // prompt + how-to
  if ((Math.floor(t * 2.2) & 1) || App.fade) txo(g, Input.touch ? 'TAP TO START' : 'PRESS ENTER TO START', VW / 2, Math.round(VH * 0.76), '#fff8e8', '#1a1426', 0.5);
  const hy = VH - 30, cols = [['@', 'Glints forge keys'], ['}', 'Keys open doors'], ['?', 'Doors hide rooms... and monsters']];
  let tw = 0; for (const c of cols) tw += textW(c[0] + '  ' + c[1]) + 18; let hx = Math.round(VW / 2 - (tw - 18) / 2);
  for (const c of cols) { txo(g, c[0], hx, hy, '#ffd95e'); txo(g, c[1], hx + textW(c[0]) + 5, hy, '#d8dbe6'); hx += textW(c[0] + '  ' + c[1]) + 18; }
  const b = Save.data.best, nc = Object.keys(Save.data.rooms).length;
  txt(g, Save.data.runs > 0 ? 'Deepest: floor ' + Math.max(1, b.floor) + '   Cards: ' + nc + '/' + DRAFTABLE.length + (Save.data.wins ? '   Wins: ' + Save.data.wins : '') : 'WASD move - SPACE dash - P pause - M mute', VW / 2, VH - 14, '#5d667c', 0.5);
  txt(g, 'v' + VERSION, VW - 5, VH - 10, '#3b2d4f', 1);
  if (Intro.ok) txt(g, (Input.touch ? '' : 'I  ') + 'INTRO', 5, VH - 10, Input.inRect(introRect()) ? '#9aa3b5' : '#5d667c');
}
function renderIris(g) {
  const f = App.fade, k = clamp(f.t / f.d, 0, 1), maxR = Math.hypot(VW, VH) * 0.6, r = maxR * (f.phase ? easeOut(k) : 1 - easeOut(k));
  const cx = Math.round(VW / 2), cy = Math.round(VH / 2);
  g.fillStyle = '#0d0a1a';
  for (let y = 0; y < VH; y++) { const dy = y - cy; if (Math.abs(dy) >= r) { g.fillRect(0, y, VW, 1); continue; } const hw = Math.round(Math.sqrt(r * r - dy * dy)); if (cx - hw > 0) g.fillRect(0, y, cx - hw, 1); if (cx + hw < VW) g.fillRect(cx + hw, y, VW - cx - hw, 1); }
}
function render() {
  const g = ctx, m = App.mode;
  if (m === 'intro') renderIntro(g);
  else if (m === 'title') renderTitle(g);
  else if (m === 'prep') renderPrep(g);
  else if (m === 'deck') renderDeck(g);
  else if (m === 'descend') renderDescend(g);
  else {
    renderWorld(g); renderHUD(g);
    if (m === 'draft') renderDraft(g); else if (m === 'pause') renderPause(g); else if (m === 'over' || m === 'win') renderEnd(g);
  }
  if (App.fade) renderIris(g);
}
