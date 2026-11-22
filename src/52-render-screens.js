/* ========================== 14c RENDER: screens ======================= */
// ---- draft ----
const rerollLabel = D => (Input.touch ? '' : 'R  ') + 'DEAL AGAIN  x' + D.rerolls, rerollW = D => textW(rerollLabel(D)) + 12;
const knockLabel = () => (Input.touch ? '' : 'R  ') + 'KNOCK BACK' + ['', '  !', '  !!'][knockTier()], knockW = () => textW(knockLabel()) + 12;   // the marks: what the next knock costs
// How a card divides its height. It needs 175 px for everything. A lower one (a phone on its side) gives its boon one
// line of text and its plan less room. by: the boon's top from the card's top; up: how far what is under the plan moves up.
function cardGeo(w, h) {
  const tight = w < 112, lp = tight ? 8 : 9, dn0 = tight ? 3 : 2, cut = Math.max(0, 175 - h), dn = cut > 8 ? 1 : dn0, ph = clamp(42 - Math.max(0, cut - (dn0 - dn) * lp), 20, 42);
  return { tight, lp, dn, cut, by: h - (tight ? 75 : 72) + (dn0 - dn) * lp, ph, up: 42 - ph };
}
function draftLayout() {
  const D = G.draft, n = D.cards.length, gap = n > 3 ? 4 : 6, tap = TAP(), chipH = Math.max(13, tap), barH = D.stairs || D.locked ? Math.max(15, tap) + 4 : 0, bh = barH - 4;   // the Stairwell bar, open or still locked
  if (narrow() || Math.floor((VW - 14 - gap * (n - 1)) / n) < 93) {
    // A view too narrow for its cards side by side (a phone held upright; four cards on a small tablet) shows one card
    // at a time, whole, with its neighbours looking in from the sides. A tap on a neighbour brings it to the middle; a
    // tap on the middle one builds it. (93 px is a card's width with four in a row on the smallest view of a desk.)
    // (a low view, a small phone on its side with four cards, has no room for the title and the tip)
    const S = short(), cy = S ? 2 : 15, top = cy + chipH + (S ? 6 : 8), room = VH - top - barH - (S ? 8 : 30), cw = Math.min(128, VW - 56), ch = Math.min(178, room), x0 = Math.round((VW - cw) / 2), y0 = top + Math.max(0, Math.round((room - ch) / 2)), by = y0 + ch + (S ? 7 : 14);
    return { narrow: true, low: S, compact: true, rects: D.cards.map((_, i) => ({ x: x0 + (i - D.sel) * (cw + 8), y: y0, w: cw, h: ch })), dots: { x: Math.round(VW / 2), y: y0 + ch + (S ? 2 : 6) },
      bar: D.stairs ? { x: 6, y: by, w: VW - 12, h: bh } : null, lock: !D.stairs && D.locked ? { x: 6, y: by, w: VW - 12, h: bh } : null, help: { x: 6, y: cy, w: textW(helpLabel()) + 12, h: chipH },
      re: D.rerolls > 0 ? { x: VW - 6 - rerollW(D), y: cy, w: rerollW(D), h: chipH } : null, kb: D.rerolls > 0 ? null : { x: VW - 6 - knockW(), y: cy, w: knockW(), h: chipH } };
  }
  // A card needs 175px for three lines of room text above its boon. A view too short for that plus the bar
  // and the key legend goes compact: the legend moves to the top right and the cards take its place.
  // On a phone the chips are a finger high: there the compact view starts its cards under them and has no legend.
  // (finger-high chips need more room above the cards than the open layout leaves on a view under about 260: compact there too)
  const open0 = Math.round((VH - Math.min(178, VH - 46 - barH) - barH) / 2) + 5, compact = (barH > 0 || tap > 0) && (VH - 46 - barH < 175 || (tap > 0 && open0 - 14 - chipH < 1)), cy0 = compact ? (tap ? chipH + 8 : 28) : 0;
  const cw = Math.min(128, Math.floor((VW - 14 - gap * (n - 1)) / n)), ch = Math.min(178, VH - (compact ? cy0 + (tap ? 2 : 3) : 46) - barH), tw = n * cw + (n - 1) * gap;
  const x0 = Math.round((VW - tw) / 2), y0 = compact ? cy0 : Math.round((VH - ch - barH) / 2) + 5, cy = compact && tap ? 2 : y0 - 14 - chipH;
  return { narrow: false, compact, rects: D.cards.map((_, i) => ({ x: x0 + i * (cw + gap), y: y0, w: cw, h: ch })), bar: D.stairs ? { x: x0, y: y0 + ch + 4, w: tw, h: bh } : null,
    lock: !D.stairs && D.locked ? { x: x0, y: y0 + ch + 4, w: tw, h: bh } : null, help: { x: x0, y: cy, w: textW(helpLabel()) + 12, h: chipH },
    re: D.rerolls > 0 ? { x: x0 + tw - rerollW(D), y: cy, w: rerollW(D), h: chipH } : null,     // the Map Room's 'deal again' chip
    kb: D.rerolls > 0 ? null : { x: x0 + tw - knockW(), y: cy, w: knockW(), h: chipH } };       // or, without a free deal, 'knock back'
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
  if (card.over > 0) txo(g, 'OVERLOAD', x + 2, y + h - (card.evo && w < 96 ? 19 : 10), (Math.floor(frameT * 4) & 1) ? '#fff8e8' : '#ffd95e', '#1a1426');      // this pick brings a room to overload (#15)
  if (card.evo) { const b = SPR['i_' + card.evo.id]; g.globalAlpha = card.evo.ready ? 1 : 0.55; ds(g, b, x + w - 9, y + 9); g.globalAlpha = 1; txo(g, card.evo.ready ? 'EVOLVE!' : 'Lv' + card.evo.lv + '/5', x + w - 2, y + h - 10, card.evo.ready ? ((Math.floor(frameT * 4) & 1) ? '#ffd95e' : '#fff8e8') : '#9aa3b5', '#1a1426', 1); }
}
function drawCard(g, card, r, sel, t, i) {
  const def = ROOM_TYPES[card.type], ap = clamp((t - i * 0.06) / 0.22, 0, 1); if (ap <= 0) return;
  const x = r.x, w = r.w, h = r.h, y = Math.round(r.y + (1 - easeBack(ap)) * 26 - (sel ? 3 : 0)), b = card.boon, el = ELEMENTS[def.el];
  panel(g, x, y, w, h, sel ? '#ffd95e' : '#4c5a84', sel ? '#2a2246' : '#1f1a36');
  g.fillStyle = def.col; g.fillRect(x + 3, y + 3, w - 6, 13); g.fillStyle = shade(def.col, 0.7); g.fillRect(x + 3, y + 15, w - 6, 1);
  txs(g, def.name, x + w / 2, y + 6, '#fff8e8', 0.5, shade(def.col, 0.38));
  txt(g, String(i + 1), x + 6, y + 6, shade(def.col, 0.45));
  const Q = cardGeo(w, h), up = Q.up;
  drawPlan(g, card, x + 5, y + 19, w - 10, Q.ph);
  // element and star level
  ds(g, SPR['e_' + def.el], x + 10, y + 68 - up); txt(g, el.name, x + 17, y + 64 - up, el.col);
  const lvUp = card.lv > 0 && card.lvTo > card.lv, stars = '```'.slice(0, card.lvTo);
  txt(g, stars, x + w - 6, y + 64 - up, lvUp ? '#b5e85a' : card.lv > 0 ? '#9aa3b5' : '#ffd95e', 1);
  if (lvUp) txt(g, 'UP', x + w - 8 - textW(stars), y + 64 - up, '#b5e85a', 1); else if (card.lv > 0) txt(g, 'MAX', x + w - 8 - textW(stars), y + 64 - up, '#9aa3b5', 1);
  if (card.fresh) { const fw = textW('NEW CARD') + 6; g.fillStyle = '#1a1426'; g.fillRect(x + w - fw - 3, y + 18, fw + 2, 11); g.fillStyle = '#9cecf2'; g.fillRect(x + w - fw - 2, y + 19, fw, 9); txt(g, 'NEW CARD', x + w - fw + 1, y + 20, '#1a1426'); }
  // what the room does (and what the level-up adds)
  // narrow cards (four in a row) pack their text tighter so a boon gets three lines instead of two
  const tight = Q.tight, lp = Q.lp, fit = Q.cut ? Math.max(1, Math.min(3, Math.floor((Q.by - 76 + up + 1) / lp))) : 3;      // the lines that fit above the boon (three on a card of full height)
  let ty = y + 76 - up; const lines = wrapText(def.text, w - 12).slice(0, Math.min(fit, lvUp ? Math.max(1, fit - 1) : 3));
  for (const line of lines) { txt(g, line, x + 6, ty, '#d8dbe6'); ty += lp; }
  if (lvUp) for (const line of wrapText(def.lv[card.lvTo - 1], w - 12).slice(0, Math.max(0, fit - lines.length))) { txt(g, line, x + 6, ty, '#b5e85a'); ty += lp; }
  // the boon
  const by = y + Q.by, dy0 = by + (tight ? 35 : 37), dn = Q.dn, tag = card.hidden ? 'x2' : boonTag(b) + (card.mul > 1 ? ' x2' : '');
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
  const D = G.draft, L_ = draftLayout(), rects = L_.rects, N = L_.narrow, tap = Input.touch || onPhone();
  g.fillStyle = 'rgba(13,10,26,0.78)'; g.fillRect(0, 0, VW, VH);
  const keys_ = tap ? 'tap a card to build it' : 'ENTER build   ESC step back' + (L_.bar ? '   DOWN stairs' : '');   // a compact view has no room below: the legend takes the title's place
  if (N && !L_.low) txo(g, 'WHAT LIES BEHIND THIS DOOR?', VW / 2, 3, '#ffd95e', '#1a1426', 0.5);
  else if (!(L_.compact && tap)) txo(g, L_.compact ? keys_ : 'WHAT LIES BEHIND THIS DOOR?', VW / 2, rects[0].y - 23, L_.compact ? '#9aa3b5' : '#ffd95e', '#1a1426', 0.5);
  D.cards.forEach((c, i) => { if (rects[i].x + rects[i].w > 0 && rects[i].x < VW) drawCard(g, c, rects[i], !D.onStairs && i === D.sel, D.t, i); });
  if (N) {                          // which card of how many, and that there are more to either side
    const n = D.cards.length, d = L_.dots; for (let i = 0; i < n; i++) { g.fillStyle = i === D.sel ? '#ffd95e' : '#4c5a84'; g.fillRect(d.x - n * 4 + i * 8 + 1, d.y, 5, 3); }
    const r = rects[D.sel], my = r.y + (r.h >> 1), b = Math.floor(frameT * 3) & 1; if (D.sel > 0) txo(g, '<', r.x - 9 - b, my, '#ffd95e'); if (D.sel < n - 1) txo(g, '>', r.x + r.w + 4 + b, my, '#ffd95e');
  }
  if (L_.bar) {
    const b = L_.bar, on = D.onStairs, ty = b.y + (b.h >= 16 ? Math.round((b.h - 8) / 2) : 4);
    panel(g, b.x, b.y - (on ? 1 : 0), b.w, b.h, on ? '#ffd95e' : '#6a6a8a', on ? '#3a3052' : '#24203a');
    ds(g, SPR.i_stairs, b.x + 11, ty + 3); txt(g, N ? 'STAIRWELL' : 'THE STAIRWELL', b.x + 22, ty, on ? '#ffd95e' : '#c8c8e0');
    const keys = swiftLeft();       // what it would wake right now, and what a fast kill would still pay
    txt(g, N ? 'warden ' + Math.round(wardenShare() * 100) + '%' + (keys ? '  +' + keys + (keys > 1 ? ' keys' : ' key') : '') : 'warden at ' + Math.round(wardenShare() * 100) + '%   ' + (keys ? 'a fast kill pays ' + keys + (keys > 1 ? ' keys' : ' key') : 'no keys for speed now'), b.x + b.w - 6, ty, on ? '#fff8e8' : '#9aa3b5', 1);
  }
  if (L_.lock) {                    // not on offer yet: say what it takes
    const b = L_.lock, ty = b.y + (b.h >= 16 ? Math.round((b.h - 8) / 2) : 4); panel(g, b.x, b.y, b.w, b.h, '#3b3b5a', '#1c1830');
    g.globalAlpha = 0.45; ds(g, SPR.i_stairs, b.x + 11, ty + 3); g.globalAlpha = 1; txt(g, N ? 'STAIRWELL' : 'THE STAIRWELL', b.x + 22, ty, '#6a6a8a');
    txt(g, (N ? D.locked + ' more room' : 'draft ' + D.locked + ' more room') + (D.locked === 1 ? '' : 's') + (N ? '' : ' to unlock it'), b.x + b.w - 6, ty, '#9aa3b5', 1);
  }
  { const r = L_.help, hot = Input.inRect(r) && !D.coach; panel(g, r.x, r.y, r.w, r.h, hot ? '#ffd95e' : '#4c5a84', hot ? '#3a3052' : '#24203a'); txt(g, helpLabel(), r.x + r.w / 2, rowTextY(r), hot ? '#ffd95e' : '#9cecf2', 0.5); }
  if (L_.kb) { const r = L_.kb, hot = Input.inRect(r) && !D.coach, col = ['#ff9ec4', '#ffd95e', '#ff7a7a'][knockTier()]; panel(g, r.x, r.y, r.w, r.h, hot ? '#fff8e8' : col, hot ? '#3a3052' : '#24203a'); txt(g, knockLabel(), r.x + r.w / 2, rowTextY(r), hot ? '#fff8e8' : col, 0.5); }
  if (L_.re) { const r = L_.re, hot = Input.inRect(r); panel(g, r.x, r.y, r.w, r.h, hot ? '#ffd95e' : '#4c5a84', hot ? '#3a3052' : '#24203a'); txt(g, rerollLabel(D), r.x + r.w / 2, rowTextY(r), hot ? '#ffd95e' : '#9cecf2', 0.5); }
  let tip_ = G.tut.step === 2 ? 'A card is a room, its power, a boon and new doors. Doors let monsters in.' : N ? 'Tap the card to build it, a side to look.' : tap ? 'Tap a card to build it. Tap outside to step back.' : 'LEFT/RIGHT choose   ENTER build   ESC step back' + (L_.bar ? '   DOWN stairs' : '');
  const low = L_.bar || L_.lock;
  if (N && !L_.low) wrapText(tip_, VW - 10).slice(0, 2).forEach((ln, i) => txo(g, ln, VW / 2, (low ? low.y + low.h : L_.dots.y + 4) + 4 + i * 9, G.tut.step === 2 ? '#fff8e8' : '#9aa3b5', '#1a1426', 0.5));
  else if (!N && !L_.compact) txo(g, tip_, VW / 2, (low ? low.y + low.h : rects[0].y + rects[0].h) + 5, G.tut.step === 2 ? '#fff8e8' : '#9aa3b5', '#1a1426', 0.5);
  renderCoach(g, D, L_);
}

// ---- menus ----
// (#20) On a phone a menu's row is at least TAP() high, and neither a row nor a panel is wider than the view.
const rowH = (lh = 14) => Math.max(lh, TAP());
const panelW = w => Math.min(w, VW - 6);
const rowTextY = r => r.y + (r.h >= 16 ? Math.round((r.h - 8) / 2) : 3);
function menuRects(n, y0, w = 150, lh = 14) { w = Math.min(w, VW - 16); const x = Math.round(VW / 2 - w / 2); return Array.from({ length: n }, (_, i) => ({ x, y: y0 + i * lh, w, h: lh })); }
function drawMenu(g, items, rects, sel) {
  items.forEach((it, i) => {
    const r = rects[i], on = i === sel, ty = rowTextY(r);
    if (on) { g.fillStyle = 'rgba(255,217,94,0.14)'; g.fillRect(r.x, r.y, r.w, r.h - 1); txt(g, '>', r.x + 4 + Math.round(Math.sin(frameT * 8)), ty, '#ffd95e'); }
    txt(g, it.label, r.x + 14, ty, on ? '#ffd95e' : '#d8dbe6');
    if (it.value !== undefined) {
      if (typeof it.value === 'number') for (let k = 0; k < 5; k++) { g.fillStyle = k < Math.round(it.value * 5) ? (on ? '#ffd95e' : '#9cecf2') : '#3b2d4f'; g.fillRect(r.x + r.w - 44 + k * 8, ty, 6, 7); }
      else txt(g, it.value, r.x + r.w - 6, ty, on ? '#ffd95e' : '#9cecf2', 1);
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
// how the music follows the floor plan (#17): not at all, its own voices entering as the plan grows (the default, in Save.fresh), or a voice for each element built
const GROW_WAYS = { full: 'NO', plan: 'WITH THE PLAN', element: 'BY ELEMENT' };
function pauseItems() { const o = Save.data.opts; return [{ label: 'Resume' }, { label: 'Music', value: o.music }, { label: 'Sound', value: o.sfx }, { label: 'Screen shake', value: o.shake ? 'ON' : 'OFF' }, { label: 'Mouse walk', value: o.mouse === 'drag' ? 'DRAG' : 'TO POINTER' },
  { label: 'Music grows', value: GROW_WAYS[o.grow] }, { label: 'Restart run' }, { label: 'Quit to title' }]; }
// The rows stand closer where the panel would not fit the view (the smallest view with the Stakes lines); vh is for
// the checks. On a phone the rows are TAP() high; where the view is too low for all of it (a phone turned on its
// side), the panel is lean: the rows and nothing else.
function pauseLayout(vh = VH) {
  const items = pauseItems(), n = items.length, sk = G.stakes ? 20 : 0, tap = TAP();
  if (tap) {
    const lean = n * tap + 102 + sk > vh, top = lean ? 16 : 36, h = lean ? top + n * tap + 2 : n * tap + 102 + sk, y = Math.max(0, Math.round(vh / 2 - h / 2));
    return { items, h, y, lh: tap, lean, rects: menuRects(n, y + top, 170, tap) };
  }
  const lh = n * 14 + 102 + sk > vh ? 12 : 14, h = n * lh + 102 + sk, y = Math.round(vh / 2 - h / 2);
  return { items, h, y, lh, lean: false, rects: menuRects(n, y + 36, 170, lh) };
}
// one line for the Stakes in force: the step, its own rule, and how many came before it
const stakesLine = n => 'STAKES ' + n + ': ' + STAKES[n - 1] + (n > 1 ? '  (and the ' + (n - 1) + ' before it)' : '');
function renderPause(g) {
  g.fillStyle = 'rgba(13,10,26,0.7)'; g.fillRect(0, 0, VW, VH);
  const L_ = pauseLayout(), y = L_.y, P = G.P, hero = HEROES[G.hero], w = panelW(220), x = Math.round(VW / 2 - w / 2);
  panel(g, x, y, w, L_.h);
  txs(g, 'PAUSED', VW / 2, y + (L_.lean ? 4 : 8), '#ffd95e', 0.5);
  if (!L_.lean) txt(g, narrow() ? hero.name + '  -  ' + G.F.name + '  -  ' + fmtTime(G.tRun) : hero.name + ' the ' + hero.title + '  -  ' + G.F.name + '  -  ' + fmtTime(G.tRun), VW / 2, y + 21, '#9aa3b5', 0.5);
  drawMenu(g, L_.items, L_.rects, App.sel);
  if (L_.lean) return;
  const sk = G.stakes ? 20 : 0;       // two lines for the Stakes in force: the step, and the rule it adds
  drawBuild(g, VW / 2, y + L_.h - 62 - sk, P, w - 20);
  drawTally(g, x + 10, y + L_.h - 30 - sk, w - 20);
  if (sk) { txt(g, 'STAKES ' + G.stakes + (G.stakes > 1 ? ': every rule up to' : ':'), VW / 2, y + L_.h - 32, '#ff9ec4', 0.5); txt(g, STAKES[G.stakes - 1], VW / 2, y + L_.h - 22, '#fff8e8', 0.5); }
  txt(g, Input.touch ? '' : 'M mutes everything', VW / 2, y + L_.h - 11, '#5d667c', 0.5);
}
const shareLabels = () => Input.touch ? ['SHARE', 'TEXT'] : ['R  SHARE', 'H  TEXT'];
function endItems() { const again = G.daily ? 'Again, as practice' : ''; return App.mode === 'win' ? [{ label: 'Keep delving (endless)' }, { label: again || 'New run' }, { label: 'Back to title' }] : [{ label: again || 'Try again' }, { label: 'Back to title' }]; }
const endLine = () => G.daily ? dailyEndLine() : App.mode === 'win' ? 'Three floors, three wardens, one very good floor plan.' : 'Every door you opened was a choice. Choose again?';
function endRows() { const S = G.stats, rows = [['Reached', G.F.name], ['Time', fmtTime(G.tRun)], ['Rooms drafted', String(S.rooms)], ['Monsters felled', String(S.kills)], ['Weapons evolved', String(S.evos)]]; if (G.stakes) rows.push(['Stakes', String(G.stakes)]); return rows; }
// The end screen's boxes. Wide (a desk, a phone on its side): a panel of 270 with the two share chips beside it; where
// that is too high for the view (a phone on its side) it is lean, without the tally and the loadout. Narrow (a phone
// held upright): one column as wide as the view, the chips inside it. vw is for the checks.
function endLayout(vw = VW) {
  const items = endItems(), n = items.length, rh = rowH(), lab = shareLabels(), ch = Math.max(13, TAP());
  if (vw < 320) {
    const x = 3, w = vw - 6, sub = wrapText(endLine(), w - 16), top = 28 + sub.length * 10, cw = Math.floor((w - 22) / 2), h = top + ch + 6 + endRows().length * 9 + 14 + 48 + 20 + 34 + 16 + n * rh + 8, y = Math.max(2, Math.round(VH / 2 - h / 2));
    return { narrow: true, lean: false, x, w, items, h, y, sub, rects: menuRects(n, y + h - n * rh - 6, 170, rh), share: { x: x + 8, y: y + top, w: cw, h: ch }, text: { x: x + 14 + cw, y: y + top, w: cw, h: ch } };
  }
  const x = Math.round(vw / 2 - 135), w = Math.max(textW(lab[0]), textW(lab[1])) + 10, full = 178 + n * rh, lean = full > VH - 2, h = lean ? 112 + n * rh + 6 : full, y = Math.max(2, Math.round(VH / 2 - h / 2));
  const inside = x + 273 + w > vw - 1;      // a view too narrow for chips beside the panel (a small tablet or phone on its side): they take the panel's top corners
  return { narrow: false, lean, inside, x, w: 270, items, h, y, rects: menuRects(n, y + h - n * rh - (lean ? 4 : 8), 170, rh),
    share: inside ? { x: x + 5, y: y + 4, w, h: ch } : { x: x + 273, y: y + 6, w, h: ch }, text: inside ? { x: x + 265 - w, y: y + 4, w, h: ch } : { x: x + 273, y: y + 10 + ch, w, h: ch } };
}
function drawNewCards(g, x, y, w, label) {   // cards and heroes unlocked this run
  const n = G.newCards.length + G.newHeroes.length; if (!n) return 0;
  txt(g, label, x, y, '#9cecf2'); let lx = x + textW(label) + 6;
  for (const id of G.newHeroes) { g.drawImage(SPR[id + 'D0'].c, lx, y - 6); lx += 18; }
  for (const id of G.newCards) { if (lx + 16 > x + w) break; ds(g, SPR['i_' + id], lx + 8, y + 3); lx += 16; }
  return 14;
}
function endPlan(g, bx, by, bw, bh) {      // the dungeon you built on this floor
  let x0 = 9, x1 = 0, y0 = 9, y1 = 0; for (const r of G.rooms) { x0 = Math.min(x0, r.cx); x1 = Math.max(x1, r.cx); y0 = Math.min(y0, r.cy); y1 = Math.max(y1, r.cy); }
  const cw = Math.min(14, Math.floor((bw - 2) / (x1 - x0 + 1))), ch = Math.min(10, Math.floor((bh - 4) / (y1 - y0 + 1)), Math.round(cw * 0.72)), mw = (x1 - x0 + 1) * cw, mh = (y1 - y0 + 1) * ch;
  g.fillStyle = '#141028'; g.fillRect(bx, by, bw, bh);
  drawMap(g, bx + ((bw - mw) >> 1) - x0 * cw, by + ((bh - mh) >> 1) - y0 * ch, cw, ch, false);
}
function renderEnd(g) {
  const win = App.mode === 'win', L_ = endLayout(), y = L_.y, x = L_.x, w = L_.w, P = G.P, rows = endRows(), head = win ? 'THE KNOCKING STOPS' : 'THE DARK GOT IN', hc = win ? '#ffd95e' : '#ff9ec4';
  g.fillStyle = win ? 'rgba(40,30,10,0.55)' : 'rgba(30,6,16,0.66)'; g.fillRect(0, 0, VW, VH);
  panel(g, x, y, w, L_.h, win ? '#ffd95e' : '#a32a3c');
  const lab = shareLabels(); [[L_.share, lab[0], 'share'], [L_.text, lab[1], 'text']].forEach(([r, label, id]) => { const said = Share.t > 0 && Share.what === id, hot = Input.inRect(r) || said;
    panel(g, r.x, r.y, r.w, r.h, hot ? '#ffd95e' : '#4c5a84', hot ? '#3a3052' : '#24203a'); txt(g, said ? Share.msg : label, r.x + r.w / 2, rowTextY(r), hot ? '#ffd95e' : '#9cecf2', 0.5); });
  const best = (bx, by) => { if (App.stakesNew) txt(g, 'STAKES ' + App.stakesNew + ' IS OPEN', bx, by, (Math.floor(frameT * 4) & 1) ? '#ff9ec4' : '#fff8e8'); else if (App.record) txt(g, 'NEW BEST!', bx, by, (Math.floor(frameT * 4) & 1) ? '#ffd95e' : '#f6923a'); };
  if (L_.narrow) {
    txo(g, head, VW / 2, y + 8, hc, '#1a1426', 0.5, textW(head) * 2 <= w - 10 ? 2 : 1);
    L_.sub.forEach((ln, i) => txt(g, ln, VW / 2, y + 27 + i * 10, G.daily ? '#ffd95e' : '#d8dbe6', 0.5));
    let ty = L_.share.y + L_.share.h + 6;
    rows.forEach((r, i) => { txt(g, r[0], x + 10, ty + i * 9, '#9aa3b5'); txt(g, r[1], x + w - 10, ty + i * 9, r[0] === 'Stakes' ? '#ff9ec4' : '#fff8e8', 1); }); ty += rows.length * 9 + 2;
    best(x + 10, ty); ty += 12;
    endPlan(g, x + 8, ty, w - 16, 44); ty += 48;
    drawTally(g, x + 8, ty, w - 16); ty += 20;
    drawBuild(g, VW / 2, ty, P, w - 24);
    drawNewCards(g, x + 10, L_.rects[0].y - 14, w - 20, 'UNLOCKED');
  } else {
    txo(g, head, VW / 2, y + (L_.inside ? 12 : 9), hc, '#1a1426', 0.5, L_.inside ? 1 : 2);
    txt(g, endLine(), VW / 2, y + 30, G.daily ? '#ffd95e' : '#d8dbe6', 0.5);
    rows.forEach((r, i) => { txt(g, r[0], x + 14, y + 44 + i * 9, '#9aa3b5'); txt(g, r[1], x + 128, y + 44 + i * 9, r[0] === 'Stakes' ? '#ff9ec4' : '#fff8e8', 1); });
    best(x + 14, y + 100);
    endPlan(g, x + 138, y + 44, 120, 64);
    if (!L_.lean) { drawTally(g, x + 14, y + 110, 242); drawBuild(g, VW / 2, y + 128, P, 240); drawNewCards(g, x + 14, L_.rects[0].y - 14, 240, 'UNLOCKED'); }
  }
  drawMenu(g, L_.items, L_.rects, App.sel);
}

// ---- between floors ----
function renderDescend(g) {
  const fs = App.descend, N = narrow(), w = panelW(260), x = Math.round(VW / 2 - w / 2), h = N ? 170 : 150, y = Math.max(2, Math.round(VH / 2 - h / 2)), next = FLOORS[fs.next], t = frameT;
  g.fillStyle = next.void; g.fillRect(0, 0, VW, VH);
  for (let i = 0; i < 40; i++) { const sx = (i * 97 + 13) % VW, sy = ((i * 53 + t * (20 + i % 7 * 6)) % (VH + 20)) - 10; g.fillStyle = next.mark; g.fillRect(sx, VH - sy, 1, 4 + i % 3 * 3); }   // falling past the dark
  panel(g, x, y, w, h, '#ffd95e');
  const head = 'FLOOR ' + (fs.next) + ' CLEARED'; txo(g, head, VW / 2, y + 9, '#ffd95e', '#1a1426', 0.5, textW(head) * 2 <= w - 10 ? 2 : 1);
  const rows = [['Time on this floor', fmtTime(fs.time)], ['Rooms drafted', String(fs.rooms)], ['Swift bonus', fs.swift ? '+' + fs.swift + (fs.swift > 1 ? ' keys' : ' key') : 'none'], ['On arrival', 'a heart mended']];
  rows.forEach((r, i) => { txt(g, r[0], x + 16, y + 34 + i * 11, '#9aa3b5'); txt(g, r[1], x + w - 16, y + 34 + i * 11, '#fff8e8', 1); });
  g.fillStyle = '#4c5a84'; g.fillRect(x + 12, y + 82, w - 24, 1);
  txt(g, 'NEXT:', x + 16, y + 88, '#9aa3b5'); txt(g, next.name.toUpperCase(), x + 16 + textW('NEXT: '), y + 88, '#9cecf2');
  txt(g, N ? 'Rooms that only grow there:' : 'Rooms that only grow down there:', x + 16, y + 100, '#9aa3b5');
  let lx = x + 16; for (const id of next.natives) { g.fillStyle = '#0d0a1a'; g.fillRect(lx, y + 110, 17, 17); g.fillStyle = '#3b2d4f'; g.fillRect(lx + 1, y + 111, 15, 15); if (Save.data.rooms[id]) ds(g, SPR['i_' + id], lx + 8, y + 118); else txt(g, '?', lx + 8, y + 115, '#9aa3b5', 0.5); lx += 19; }
  if (N) drawNewCards(g, x + 16, y + 136, w - 32, 'NEW'); else drawNewCards(g, x + 140, y + 116, 110, 'NEW');
  if ((Math.floor(t * 2.2) & 1) || App.fade) txo(g, Input.touch ? 'TAP TO DESCEND' : 'ENTER: DESCEND', VW / 2, y + h - 14, '#fff8e8', '#1a1426', 0.5);
}

// ---- choose your delver ----
function heroOwned(id) { return !!Save.data.heroes[id]; }
// The hero screen's boxes: sk is the height of the Stakes lines (0 until this delver has won), sy their top, dy the
// deck's; next, stakes and deck are the places a tap takes to the next delver, a Stakes step and the deck builder. A narrow view puts the delver's words beside the portrait and
// everything else below it; a low one leaves the row of evolutions out.
const stakeRule = id => { const n = stakeOf(id); return n ? stakesLine(n).slice(('STAKES ' + n + ': ').length) : 'The game as it is. A step up adds one rule.'; };
function prepLayout(id) {
  const open = heroOwned(id) && stakesOpen(id), N = narrow(), S = short() && !N;
  if (N) {
    const w = VW - 8, x = 4, sk = open ? 16 + wrapText(stakeRule(id), w - 28).length * 9 : 0, h = 236 + sk, y = Math.max(2, Math.round(VH / 2 - h / 2)), sy = y + 138;
    return { narrow: true, lean: false, x, w, sk, h, y, sy, dy: sy + sk + 8, next: { x, y: y + 18, w: 94, h: 84 }, stakes: { x, y: sy, w, h: sk }, deck: { x, y: sy + sk + 2, w, h: 58 }, start: { x, y: y + h - 22, w, h: 21 } };
  }
  const w = Math.min(360, VW - 24), sk = open ? 22 : 0, h = (S ? 158 : 188) + sk, y = Math.max(0, Math.round(VH / 2 - h / 2));
  // what a tap means where: the portrait's side is the next delver, the Stakes lines a step, the deck its builder, anywhere else the start
  return { narrow: false, lean: S, x: Math.round(VW / 2 - w / 2), w, sk, h, y, sy: y + 101, dy: y + 106 + sk, next: { x: 0, y: 0, w: VW / 2 - 40, h: y + 101 }, stakes: { x: 0, y: y + 101, w: VW, h: sk }, deck: { x: 0, y: y + 100 + sk, w: VW, h: S ? 42 : 50 }, start: { x: Math.round(VW / 2 - w / 2), y: y + h - 22, w, h: 21 } };
}
function renderPrep(g) {
  const t = frameT, id = HERO_ORDER[App.prep.i], hero = HEROES[id], own = heroOwned(id), deck = deckFor(id), L_ = prepLayout(id), N = L_.narrow, w = L_.w, h = L_.h, x = L_.x, y = L_.y;
  renderWorld(g); g.fillStyle = 'rgba(13,10,26,0.8)'; g.fillRect(0, 0, VW, VH);
  panel(g, x, y, w, h);
  txs(g, 'CHOOSE YOUR DELVER', VW / 2, y + 8, '#ffd95e', 0.5);
  // portrait
  const big = App.big[id], px = x + (N ? 20 : 22), py = y + (N ? 24 : 30);
  g.fillStyle = '#141028'; g.fillRect(px - 6, py - 4, 60, 66); g.fillStyle = '#2a2246'; g.fillRect(px - 5, py - 3, 58, 64);
  if (own) g.drawImage(big, px, py + 2 - (Math.floor(t * 2) & 1)); else { g.globalAlpha = 0.35; g.drawImage(App.big[id + '_sil'], px, py + 2); g.globalAlpha = 1; txt(g, '?', px + 24, py + 20, '#9aa3b5', 0.5, 2); }
  txt(g, '<', px - 16 - (Math.floor(t * 3) & 1), py + 24, '#ffd95e'); txt(g, '>', px + 58 + (Math.floor(t * 3) & 1), py + 24, '#ffd95e');
  for (let i = 0; i < HERO_ORDER.length; i++) { g.fillStyle = i === App.prep.i ? '#ffd95e' : heroOwned(HERO_ORDER[i]) ? '#9aa3b5' : '#3b2d4f'; g.fillRect(px + 12 + i * 8, py + 66, 5, 3); }
  // who they are
  if (N) {
    const tx = x + 96, tw = w - 102, sc = own && textW(hero.name) * 2 > tw ? 1 : 2;
    txt(g, own ? hero.name : '???', tx, y + 24, '#fff8e8', 0, sc); txt(g, own ? 'the ' + hero.title : 'locked', tx, y + 27 + 8 * sc, '#9aa3b5');
    let ty = y + 39 + 8 * sc; for (const ln of wrapText(own ? hero.perk : 'To unlock: ' + hero.how, tw)) { txt(g, ln, tx, ty, own ? '#b5e85a' : '#ff9ec4'); ty += 9; }
    if (own) { const wd = WEAPONS[hero.weapon]; g.fillStyle = '#0d0a1a'; g.fillRect(x + 8, y + 104, 18, 18); g.fillStyle = '#3b2d4f'; g.fillRect(x + 9, y + 105, 16, 16); ds(g, SPR['i_' + hero.weapon], x + 17, y + 113);
      txt(g, 'Starts with ' + wd.name, x + 31, y + 104, '#ffd95e'); wrapText(wd.desc, w - 40).slice(0, 2).forEach((ln, i) => txt(g, ln, x + 31, y + 114 + i * 9, '#9aa3b5')); }
  } else {
    const tx = x + 92; txt(g, own ? hero.name : '???', tx, y + 28, '#fff8e8', 0, 2); txt(g, own ? 'the ' + hero.title : 'locked', tx + (own ? textW(hero.name) * 2 + 6 : 40), y + 35, '#9aa3b5');
    if (own) {
      const wd = WEAPONS[hero.weapon]; g.fillStyle = '#0d0a1a'; g.fillRect(tx, y + 50, 18, 18); g.fillStyle = '#3b2d4f'; g.fillRect(tx + 1, y + 51, 16, 16); ds(g, SPR['i_' + hero.weapon], tx + 9, y + 59);
      txt(g, 'Starts with ' + wd.name, tx + 23, y + 51, '#ffd95e'); txt(g, wd.desc, tx + 23, y + 60, '#9aa3b5');
      let ty = y + 74; for (const ln of wrapText(hero.perk, w - 104)) { txt(g, ln, tx, ty, '#b5e85a'); ty += 9; }
    } else { let ty = y + 52; for (const ln of wrapText('To unlock: ' + hero.how, w - 104)) { txt(g, ln, tx, ty, '#ff9ec4'); ty += 9; } }
  }
  // the Stakes: one pip per step (lit: chosen, dim: open, dark: still locked) and the rule the chosen step adds
  if (L_.sk) {
    const n = stakeOf(id), top = stakesOpen(id), sy = L_.sy; g.fillStyle = '#4c5a84'; g.fillRect(x + 10, sy, w - 20, 1);
    txt(g, 'STAKES', x + 14, sy + 5, n ? '#ff9ec4' : '#9aa3b5'); let px2 = x + 14 + textW('STAKES') + 6;
    for (let i = 1; i <= STAKES.length; i++) { g.fillStyle = '#0d0a1a'; g.fillRect(px2, sy + 4, 7, 7); g.fillStyle = i <= n ? '#ff6a9a' : i <= top ? '#6a5a84' : '#2a2246'; g.fillRect(px2 + 1, sy + 5, 5, 5); px2 += 9; }
    txt(g, Input.touch ? (N ? 'tap' : 'tap to change') : 'UP / DOWN', x + w - 14, sy + 5, '#5d667c', 1);
    (N ? wrapText(stakeRule(id), w - 28) : [stakeRule(id)]).forEach((ln, i) => txt(g, ln, x + 14, sy + 14 + i * 9, n ? '#fff8e8' : '#9aa3b5'));
  }
  // their deck
  const dy = L_.dy, pitch = Math.min(20, Math.floor((w - 12) / Math.max(1, deck.length))); g.fillStyle = '#4c5a84'; g.fillRect(x + 10, dy - 6, w - 20, 1);
  txt(g, 'DECK', x + 14, dy, '#9aa3b5'); txt(g, deck.length + '/' + DECK_SIZE + (N ? '' : '  Drafts deal these, plus one room native to the floor.'), x + 14 + textW('DECK  '), dy, '#5d667c');
  let lx = Math.round(VW / 2 - deck.length * pitch / 2);
  for (const rid of deck) { const el = ELEMENTS[ROOM_TYPES[rid].el], cw = pitch - 1; g.fillStyle = '#0d0a1a'; g.fillRect(lx, dy + 12, cw, 21); g.fillStyle = '#2a2246'; g.fillRect(lx + 1, dy + 13, cw - 2, 19); g.fillStyle = el.col; g.fillRect(lx + 1, dy + 30, cw - 2, 2); ds(g, SPR['i_' + rid], lx + (cw >> 1), dy + 21); lx += pitch; }
  if (!L_.lean) {
    const evo = Object.keys(WEAPONS).filter(wid => deck.indexOf(WEAPONS[wid].evo.room) >= 0);
    txt(g, 'Can evolve:', x + 14, dy + 42, '#9aa3b5'); lx = x + 14 + textW('Can evolve:  ');
    for (const wid of evo) { if (lx + 16 > x + w - 6) break; ds(g, SPR['i_' + wid + '_evo'], lx + 8, dy + 46); lx += 17; }
  }
  const tap = Input.touch || onPhone();
  if (N) { txt(g, own ? (tap ? 'portrait: next    deck: edit' : 'LEFT/RIGHT delver   Q deck') : (tap ? 'portrait: next delver' : 'LEFT/RIGHT delver   ESC back'), VW / 2, y + h - 25, '#9aa3b5', 0.5); if (own) txo(g, tap ? 'TAP HERE TO START' : 'ENTER start    ESC back', VW / 2, y + h - 13, '#fff8e8', '#1a1426', 0.5); }
  else txo(g, own ? (tap ? 'TAP PORTRAIT: next   TAP DECK: edit   TAP HERE: start' : 'LEFT/RIGHT delver    Q edit deck    ENTER start    ESC back') : tap ? 'TAP PORTRAIT: next delver' : 'LEFT/RIGHT delver    ESC back', VW / 2, y + h - 14, '#fff8e8', '#1a1426', 0.5);
}

// ---- deck builder ----
const EL_ORDER = ['stone', 'fire', 'frost', 'steel', 'water', 'lore', 'wild', 'shadow'];
const DECK_LIST = DRAFTABLE.slice().sort((a, b) => EL_ORDER.indexOf(ROOM_TYPES[a].el) - EL_ORDER.indexOf(ROOM_TYPES[b].el) || DRAFTABLE.indexOf(a) - DRAFTABLE.indexOf(b));
const deckCols = () => narrow() ? Math.max(4, Math.floor((VW - 10) / 27)) : 9;      // a narrow view has fewer columns and the card's text below them
function deckLayout() {
  const cs = 27, cols = deckCols(), N = narrow(), rows = Math.ceil(DECK_LIST.length / cols), gx = N ? Math.round((VW - cols * cs) / 2) : Math.max(6, Math.round((VW - (cols * cs + 8 + 132)) / 2)), gy = 30;
  const box = N ? { px: 4, py: gy + rows * cs + 4, pw: VW - 8, ph: Math.max(40, VH - (gy + rows * cs + 4) - 34) } : { px: gx + cols * cs + 8, py: 28, pw: Math.min(150, VW - (gx + cols * cs + 8) - 6), ph: VH - 52 };
  return Object.assign({ cs, cols, gx, gy, narrow: N, cells: DECK_LIST.map((id, i) => ({ id, x: gx + (i % cols) * cs, y: gy + Math.floor(i / cols) * cs, w: cs - 2, h: cs - 2 })) }, box);
}
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
  txo(g, HEROES[hid].name.toUpperCase() + "'S DECK", L_.gx, 8, '#ffd95e'); txo(g, deck.length + ' / ' + DECK_SIZE, L_.gx + L_.cols * L_.cs - 2, 8, deck.length === DECK_SIZE ? '#b5e85a' : '#ff9ec4', '#1a1426', 1);
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
  const px = L_.px, pw = L_.pw, py = L_.py; panel(g, px, py, pw, L_.ph, own ? ELEMENTS[def.el].col : '#4c5a84');
  let ty = py + 7;
  if (own) {
    txt(g, def.name, px + 7, ty, '#fff8e8'); ty += 11; ds(g, SPR['e_' + def.el], px + 11, ty + 4); txt(g, ELEMENTS[def.el].name, px + 18, ty, ELEMENTS[def.el].col); ty += 12;
    for (const ln of wrapText(def.text, pw - 14)) { txt(g, ln, px + 7, ty, '#d8dbe6'); ty += 9; } ty += 3;
    for (let lv = 1; lv < def.max; lv++) { txt(g, '```'.slice(0, lv + 1), px + 7, ty, '#ffd95e'); for (const ln of wrapText(def.lv[lv], pw - 14 - 20)) { txt(g, ln, px + 27, ty, '#b5e85a'); ty += 9; } }
    const ev = EVO_ROOM[cur]; if (ev) { ty += 3; ds(g, SPR['i_' + ev + '_evo'], px + 14, ty + 8); for (const ln of wrapText('Evolves ' + WEAPONS[ev].name + ' into ' + WEAPONS[ev].evo.name + '.', pw - 34)) { txt(g, ln, px + 26, ty, '#ffd95e'); ty += 9; } }
    if (def.el === 'stone') { ty += 3; for (const ln of wrapText('Stone resonates with every element.', pw - 14)) { txt(g, ln, px + 7, ty, '#9aa3b5'); ty += 9; } }
  } else { txt(g, '???', px + 7, ty, '#9aa3b5'); ty += 14; for (const ln of wrapText('Not collected yet. ' + howToGet(cur), pw - 14)) { txt(g, ln, px + 7, ty, '#ff9ec4'); ty += 9; } }
  txt(g, own ? (deck.indexOf(cur) >= 0 ? 'IN THE DECK' : 'not in the deck') : '', L_.narrow ? px + pw - 7 : px + 7, L_.narrow ? py + 7 : VH - 36, deck.indexOf(cur) >= 0 ? '#b5e85a' : '#5d667c', L_.narrow ? 1 : 0);
  const tap = Input.touch || onPhone(), hint = wrapText(tap ? 'Tap a card to add or remove it. Tap beside the cards when done.' : 'ARROWS move    ENTER add / remove    ESC done', VW - 12), hx = L_.narrow ? 6 : L_.gx;
  hint.forEach((ln, i) => txo(g, ln, hx, VH - 4 - (hint.length - i) * 10, '#9aa3b5'));
  if (App.deck.msgT > 0) wrapText(App.deck.msg, VW - 12).forEach((ln, i) => txo(g, ln, hx, VH - 16 - hint.length * 10 + i * 10, (Math.floor(t * 6) & 1) ? '#ff9ec4' : '#fff8e8'));
}

// ---- title ----
const LOGO = 'ROOMWRIGHT';
// The title's small entries along the bottom, left to right. The big one, START, is the rest of the screen.
// App.titleSel holds the id of the chosen one, '' for START.
function titleLayout() {
  const items = []; if (Intro.ok) items.push(['intro', 'INTRO']); items.push(['daily', 'DAILY'], ['music', 'MUSIC'], ['changes', 'CHANGELOG']);
  const h = rowH(18), pad = items.reduce((a, it) => a + textW(it[1]) + 12, 0) > VW ? 8 : 12; let x = 0; return items.map(([id, label]) => { const r = { id, label, x, y: VH - h, w: textW(label) + pad, h }; x += r.w; return r; });      // (on a phone a row a finger can hit)
}
function renderTitle(g) {
  const t = frameT, hid = Save.data.hero;
  renderWorld(g);
  g.fillStyle = 'rgba(13,10,26,0.5)'; g.fillRect(0, 0, VW, VH);
  const gr = g.createLinearGradient(0, 0, 0, VH); gr.addColorStop(0, 'rgba(13,10,26,0.85)'); gr.addColorStop(0.45, 'rgba(13,10,26,0)'); gr.addColorStop(1, 'rgba(13,10,26,0.9)'); g.fillStyle = gr; g.fillRect(0, 0, VW, VH);
  // logo: chunky two-tone letters; the OO are a pair of eyes peeking through a door slit
  const sc = textW(LOGO) * 4 > VW - 8 ? 3 : 4, ek = sc / 4, lw = textW(LOGO) * sc, lx = Math.round(VW / 2 - lw / 2), ly = Math.round(VH * 0.14) + Math.round(Math.sin(t * 1.3) * 2);
  txo(g, LOGO, lx, ly + sc, '#1a1426', '#1a1426', 0, sc);
  txo(g, LOGO, lx, ly, '#f6923a', '#1a1426', 0, sc);
  g.save(); g.beginPath(); g.rect(lx - 4, ly, lw + 8, sc * 3); g.clip(); txt(g, LOGO, lx, ly, '#ffd95e', 0, sc); g.restore();
  g.save(); g.beginPath(); g.rect(lx - 4, ly, lw + 8, sc); g.clip(); txt(g, LOGO, lx, ly, '#fff8e8', 0, sc); g.restore();
  const blink = (t % 4.2) < 0.13, look = Math.round(Math.sin(t * 0.9) * 2);
  for (const i of [1, 2]) {
    const ex = lx + i * 6 * sc + sc, ey = ly + sc;
    g.fillStyle = '#1a1426'; g.fillRect(ex, ey, 3 * sc, 5 * sc);
    if (!blink) { g.fillStyle = '#fff8e8'; g.fillRect(ex + 1, ey + Math.round(5 * ek), Math.round(10 * ek), Math.round(10 * ek)); g.fillStyle = '#1a1426'; g.fillRect(ex + Math.round(4 * ek) + look, ey + Math.round(8 * ek), Math.round(4 * ek), Math.round(6 * ek)); g.fillStyle = '#fff8e8'; g.fillRect(ex + Math.round(5 * ek) + look, ey + Math.round(9 * ek), 1, 1); }
    else { g.fillStyle = '#f6923a'; g.fillRect(ex + 1, ey + Math.round(10 * ek), Math.round(10 * ek), 2); }
  }
  txo(g, 'every level-up is a room', VW / 2, ly + 9 * sc + 2, '#9cecf2', '#1a1426', 0.5);
  // mascots
  const my = Math.round(VH * 0.6), bob = Math.round(Math.abs(Math.sin(t * 3)) * 3);
  g.drawImage(SPR.sh_xl.c, VW / 2 - 65, my + 17); g.drawImage(App.big[hid], VW / 2 - 70, my - 30 - (Math.floor(t * 2) & 1));
  g.drawImage(App.big.key, VW / 2 - 24, my - 8 + Math.round(Math.sin(t * 2.5) * 2));
  g.drawImage(SPR.sh_xl.c, VW / 2 + 27, my + 17); g.drawImage(App.big['slime' + (bob > 1 ? 0 : 1)], VW / 2 + 26, my - 12 - bob);
  // prompt + how-to. A narrow view stacks the three hints, a low one leaves them out; the version moves up where the entries need the row
  const T = titleLayout(), sel = T.findIndex(e => e.id === App.titleSel), N = narrow(), S = short(), tap = Input.touch || onPhone(), go = tap ? 'TAP TO START' : 'PRESS ENTER TO START';          // sel -1: START
  if (sel >= 0) txo(g, go, VW / 2, Math.round(VH * 0.76), '#5d667c', '#1a1426', 0.5);
  else if ((Math.floor(t * 2.2) & 1) || App.fade) txo(g, go, VW / 2, Math.round(VH * 0.76), '#fff8e8', '#1a1426', 0.5);
  const base = T[0].y, cols = [['@', 'Glints forge keys'], ['}', 'Keys open doors'], ['?', 'Doors hide rooms... and monsters']];
  let tw = 0; for (const c of cols) tw += textW(c[0] + '  ' + c[1]) + 18;
  if (N || (tw - 18 > VW - 8 && !S)) cols.forEach((c, i) => { const w = textW(c[0] + '  ' + c[1]), hx = Math.round(VW / 2 - w / 2), hy = base - 52 + i * 10; txo(g, c[0], hx, hy, '#ffd95e'); txo(g, c[1], hx + textW(c[0]) + 5, hy, '#d8dbe6'); });
  else if (!S) { const hy = VH - 42; let hx = Math.round(VW / 2 - (tw - 18) / 2);
    for (const c of cols) { txo(g, c[0], hx, hy, '#ffd95e'); txo(g, c[1], hx + textW(c[0]) + 5, hy, '#d8dbe6'); hx += textW(c[0] + '  ' + c[1]) + 18; } }
  const b = Save.data.best, nc = Object.keys(Save.data.rooms).length, sy = base - 10;
  if (sel >= 0 && T[sel].id === 'daily') txt(g, dailyTitleLine(), VW / 2, sy, '#ffd95e', 0.5);
  else txt(g, Save.data.runs > 0 ? (N ? 'Floor ' : 'Deepest: floor ') + Math.max(1, b.floor) + (N ? '   Cards ' : '   Cards: ') + nc + '/' + DRAFTABLE.length + (Save.data.wins ? (N ? '   Wins ' : '   Wins: ') + Save.data.wins : '') : tap ? 'drag to move - tap to dash' : 'WASD move - SPACE dash - P pause - M mute', VW / 2, sy, '#5d667c', 0.5);
  if (N) txt(g, 'v' + VERSION, VW - 4, 4, '#3b2d4f', 1); else txt(g, 'v' + VERSION, VW - 5, VH - 10, '#3b2d4f', 1);
  T.forEach((r, i) => {
    const on = i === sel;
    if (on) { g.fillStyle = '#ffd95e'; g.fillRect(r.x + 5, r.y + r.h - 1, textW(r.label), 1); }
    txt(g, r.label, r.x + 5, r.y + r.h - 10, on ? '#fff8e8' : Input.inRect(r) ? '#9aa3b5' : '#5d667c');
  });
}
// ---- the changelog: CHANGELOG.md's entries (src/26-changelog.js), newest first, in a panel that scrolls
let _changes = null;
function changesLayout() {
  const N = narrow(), th = Math.max(18, TAP()), w = Math.min(VW - (N ? 44 : 64), 420), x = N ? 8 : Math.round(VW / 2 - w / 2), top = th + 8, h = VH - top - (TAP() ? 8 : 26);
  if (!_changes || _changes.w !== w) {              // the text as lines for this width: [text, kind, date]; kind v: a version, i: an entry, c: its next lines
    const lines = [];
    for (const c of CHANGES) {
      if (lines.length) lines.push(['', '']);
      const head = c.v + '  ' + c.name, wide = textW(head) + textW(c.date || '') + 10 <= w;      // a narrow view gives the date a line of its own
      lines.push([head, 'v', wide ? c.date : '']); if (!wide && c.date) lines.push([c.date, 'd']);
      for (const it of c.items) wrapText(it, w - 10).forEach((l, i) => lines.push([l, i ? 'c' : 'i']));
    }
    _changes = { w, lines };
  }
  const lines = _changes.lines, total = lines.length * 10 + 6;
  return { view: { x, y: top, w, h }, lines, total, max: Math.max(0, total - h), page: h - 20,
    up: { x: x + w + 8, y: top - 4, w: 22, h: 22 }, down: { x: x + w + 8, y: top + h - 18, w: 22, h: 22 }, hint: !TAP(),
    upper: { x, y: top, w, h: h / 2 }, lower: { x, y: top + h / 2, w, h: h / 2 },      // a click or tap in the text pages too: its upper half back, its lower half on
    back: { x: 0, y: 0, w: textW('BACK') + 12, h: th } };                               // top left, away from where the title has its entries
}
function renderChanges(g) {
  renderWorld(g);
  g.fillStyle = 'rgba(13,10,26,0.8)'; g.fillRect(0, 0, VW, VH);
  const L_ = changesLayout(), v = L_.view, y0 = v.y + 4 - Math.round(App.changes.y);
  txs(g, 'CHANGELOG', VW / 2, L_.back.h - 10, '#ffd95e', 0.5);
  panel(g, v.x - 6, v.y - 4, v.w + 12, v.h + 8);
  g.save(); g.beginPath(); g.rect(v.x - 2, v.y, v.w + 4, v.h); g.clip();
  L_.lines.forEach(([s, kind, date], i) => {
    const y = y0 + i * 10; if (y < v.y - 10 || y > v.y + v.h) return;
    if (kind === 'v') { txt(g, s, v.x, y, '#ffd95e'); if (date) txt(g, date, v.x + v.w, y, '#9aa3b5', 1); }
    else if (kind === 'd') txt(g, s, v.x + 10, y, '#9aa3b5');
    else if (kind) { if (kind === 'i') txt(g, '-', v.x + 1, y, '#9cecf2'); txt(g, s, v.x + 10, y, '#d8dbe6'); }
  });
  g.restore();
  for (const [r, ch, on] of [[L_.up, '^', App.changes.y > 0], [L_.down, 'v', App.changes.y < L_.max]]) {
    panel(g, r.x, r.y, r.w, r.h, on ? '#8e9cc0' : '#3b2d4f'); txt(g, ch, r.x + r.w / 2, r.y + 7, on ? '#fff8e8' : '#5d667c', 0.5);
  }
  txt(g, 'BACK', 5, L_.back.h - 10, Input.inRect(L_.back) ? '#fff8e8' : '#9aa3b5');
  if (L_.hint) txt(g, Input.touch ? 'tap the lower half to read on, the upper half to go back up' : 'UP and DOWN scroll - ESC goes back', VW / 2, VH - 10, '#5d667c', 0.5);
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
  else if (m === 'changes') renderChanges(g);
  else if (m === 'music') renderMusic(g);
  else if (m === 'descend') renderDescend(g);
  else {
    renderWorld(g); renderHUD(g);
    if (m === 'draft') renderDraft(g); else if (m === 'pause') renderPause(g); else if (m === 'over' || m === 'win') renderEnd(g);
  }
  if (App.fade) renderIris(g);
}
