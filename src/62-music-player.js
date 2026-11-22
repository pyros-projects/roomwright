/* ============================ 15c MUSIC PLAYER ======================== */
// A screen reached from the title. It plays every track in the game. Its switches turn the voices of the playing
// piece on and off, and the element voices, so both ways of "Music grows" can be heard here without a run. A second
// page plays every sound effect. Under it sprites from the game dance: one dancer per voice, which hops when its
// voice starts a note and stands still otherwise, dimmed while its voice is switched off.
const Player = { page: 0, sel: 'track:title', track: 'title', off: {}, els: {}, full: false };
const VOICE_ORDER = ['bass', 'drum', 'arp', 'lead', 'answer', 'counter', 'pluck', 'bell'];
const VOICE_NAMES = { bass: 'bass', drum: 'drums', arp: 'arpeggio', lead: 'lead', answer: 'answer', counter: 'counter', pluck: 'plucks', bell: 'bells' };
// who dances to which voice of which track: a sprite's name without its frame number; '@' is the delver of the save.
// `idle` has no voice: Moss looks on while the other three delvers dance to the title's tune.
const DANCERS = {
  title: { bass: 'brin', arp: 'wick', lead: 'pip', idle: 'moss' },
  cellar: { bass: 'kslime', drum: 'tin', arp: 'slime', lead: '@', answer: 'bat', counter: 'bones', pluck: 'spore', bell: 'latch' },
  garden: { bass: 'eshroom', drum: 'beetle', arp: 'bslime', lead: '@', answer: 'moth', counter: 'ghost', pluck: 'thorn', bell: 'flower' },
  kiln: { bass: 'golem', drum: 'bomber', arp: 'cinder', lead: '@', answer: 'imp', counter: 'wraith', pluck: 'bones', bell: 'hexer' },
  boss: { bass: 'boss', drum: 'morel', lead: 'unmaker', arp: 'sapper' },
};
const playerTracks = () => [['title', 'Title'], ...FLOORS.map(f => [f.music, f.name]), ['boss', 'The wardens']];
// the voices the switches leave on, told to the sequencer
function playerHand() {
  const set = {}, info = Snd.info(Player.track);
  for (const v of info.voices) if (!Player.off[v]) set[v] = 1;
  for (const el of info.elements) if (Player.els[el]) { set[el] = 1; if (Player.full) set[el + '+'] = 1; }
  Snd.hand(set);
}
// it opens on the playing track with every voice of the piece on and no element voice
function openPlayer() { Player.page = 0; Player.track = Snd.track || 'title'; Player.sel = 'track:' + Player.track; Player.off = {}; Player.els = {}; Player.full = false; playerHand(); App.mode = 'music'; }
function closePlayer() { Snd.hand(null); if (Snd.track !== 'title') Snd.music('title'); App.mode = 'title'; sfx('back'); }
function playerPlay(id) { Player.track = id; Player.off = {}; Snd.music(null); Snd.music(id); playerHand(); }

// Everything that can be chosen on the current page, each with its place on screen and in a grid the arrows walk:
// { id, x, y, w, h, gx, gy, label, on, col }. The top row (BACK and the two tabs) is gy -1.
function playerLayout() {
  // On a phone every row is TAP() high. A narrow view (held upright) puts the three lists under each other, two
  // columns each, without headings; a phone's view has no legend line; and the sounds come in pages where they do not
  // fit, with `more` as the last cell.
  const N = narrow(), tap = TAP(), row = Math.max(12, tap), th = Math.max(18, tap), W = Math.min(VW - (N ? 8 : 16), 464), x0 = Math.round(VW / 2 - W / 2), top = th + 4, items = [], hint = !tap;
  const add = (id, gx, gy, x, y, w, h, label, more) => items.push(Object.assign({ id, gx, gy, x: Math.round(x), y, w: Math.floor(w), h, label }, more));
  add('back', 0, -1, 0, 0, textW('BACK') + 12, th, 'BACK');
  let tx = x0 + W; for (const [i, name] of [[1, 'SOUNDS'], [0, 'MUSIC']]) { const w = textW(name) + 12; tx -= w; add('tab:' + i, 1 + i, -1, tx, 0, w, th, name, { on: Player.page === i }); }
  const L_ = { W, x0, top, row, items, narrow: N, hint, floor: { x: x0, y: 126, w: W, h: Math.max(40, VH - 126 - 18) } };
  if (Player.page === 1) {                                   // every sound effect, in columns
    const all = Snd.names, fr = Math.max(11, tap), cols = N ? 3 : Math.max(2, Math.floor(W / 92)), cw = W / cols, fit = Math.max(3, Math.floor((VH - top - (hint ? 16 : 3)) / fr));
    const per = all.length <= cols * fit ? all.length : cols * fit - 1, pages = Math.ceil(all.length / per), pg = (Player.fxPage || 0) % pages, names = all.slice(pg * per, (pg + 1) * per);
    const rows = pages > 1 ? fit : Math.ceil(names.length / cols), cell = (i, id, label) => add(id, Math.floor(i / rows), i % rows, x0 + Math.floor(i / rows) * cw, top + (i % rows) * fr, cw - 1, fr, label);
    names.forEach((n, i) => cell(i, 'fx:' + n, n));
    if (pages > 1) cell(cols * rows - 1, 'more', 'more ' + (pg + 1) + '/' + pages);
    return L_;
  }
  const info = Snd.info(Player.track); L_.info = info;
  if (N) {
    const half = W / 2, tracks = playerTracks(), tr = Math.ceil(tracks.length / 2), y1 = top, y2 = y1 + tr * row + 4, y3 = y2 + 4 * row + 4, els = info.elements.length;
    tracks.forEach(([id, name], i) => add('track:' + id, i % 2, i >> 1, x0 + (i % 2) * half, y1 + (i >> 1) * row, half - 2, row, name, { on: Player.track === id }));
    VOICE_ORDER.filter(v => info.voices.includes(v)).forEach((v, i) => add('voice:' + v, i >> 2, tr + (i & 3), x0 + (i >> 2) * half, y2 + (i & 3) * row, half - 2, row, VOICE_NAMES[v], { on: !Player.off[v], box: 1 }));
    info.elements.forEach((el, i) => add('el:' + el, i >> 2, tr + 4 + (i & 3), x0 + (i >> 2) * half, y3 + (i & 3) * row, half - 2, row, ELEMENTS[el].name, { on: !!Player.els[el], box: 1, col: ELEMENTS[el].col }));
    if (els) add('full', 0, tr + 8, x0, y3 + 4 * row, W - 2, row, 'resonating', { on: Player.full, box: 1 });
    const fy = y3 + (els ? 5 * row : 12) + 18;
    L_.lines = [y2 - 3, y3 - 3]; L_.none = els ? 0 : y3 + 2; L_.barY = fy - 15; L_.floor = { x: x0, y: fy, w: W, h: Math.max(0, VH - fy - 4) };
    return L_;
  }
  const cw = Math.round(W * 0.27), vw = Math.floor((W - cw - 12) / 2), vx = x0 + cw + 6, ex = vx + vw + 6, y1 = top + 14;
  L_.cols = [[x0, cw, 'TRACKS'], [vx, vw, 'VOICES'], [ex, vw, 'ELEMENTS']]; L_.panelH = 14 + 5 * row + 6;
  L_.barY = top + L_.panelH + 5; L_.floor = { x: x0, y: L_.barY + 19, w: W, h: tap ? Math.max(0, VH - (L_.barY + 19) - 3) : Math.max(40, VH - (L_.barY + 19) - 18) };      // (a phone on its side may have no room for the dance floor)
  playerTracks().forEach(([id, name], i) => add('track:' + id, 0, i, x0 + 2, y1 + i * row, cw - 4, row, name, { on: Player.track === id }));
  VOICE_ORDER.filter(v => info.voices.includes(v)).forEach((v, i) => add('voice:' + v, 1 + (i >> 2), i & 3, vx + 2 + (i >> 2) * (vw / 2), y1 + (i & 3) * row, vw / 2 - 2, row, VOICE_NAMES[v], { on: !Player.off[v], box: 1 }));
  info.elements.forEach((el, i) => add('el:' + el, 3 + (i >> 2), i & 3, ex + 2 + (i >> 2) * (vw / 2), y1 + (i & 3) * row, vw / 2 - 2, row, ELEMENTS[el].name, { on: !!Player.els[el], box: 1, col: ELEMENTS[el].col }));
  if (info.elements.length) add('full', 3, 4, ex + 2, y1 + 4 * row, vw - 4, row, 'resonating', { on: Player.full, box: 1 });
  return L_;
}
// Where an arrow leads from `cur`. Inside the page it moves by one place in the grid: a row up or down in the same
// column, or to the next column that has anything, in the same row or that column's last. UP from a column's first
// row goes to the top row and DOWN from the top row comes back. In the top row LEFT and RIGHT walk BACK, MUSIC, SOUNDS.
function playerNext(items, cur, dx, dy) {
  const at = (gx, gy) => items.find(it => it.gx === gx && it.gy === gy), page = items.filter(it => it.gy >= 0), last = Math.max(...page.map(it => it.gx));
  if (cur.gy < 0) {
    if (dx) return at(cur.gx + dx, -1) || null;
    return dy > 0 ? (cur.gx === 0 ? at(0, 0) : cur.gx === 2 ? at(last, 0) : at(Math.min(1, last), 0)) || page[0] || null : null;
  }
  if (dy) {
    if (cur.gy + dy < 0) return at(cur.gx === 0 ? 0 : cur.gx === last || cur.gx >= 3 ? 2 : 1, -1);
    return at(cur.gx, cur.gy + dy) || (dy > 0 && cur.gx >= 3 ? at(3, 4) : null) || null;      // "resonating" lies under both element columns
  }
  for (let gx = cur.gx + dx; gx >= 0 && gx <= last; gx += dx) {
    const col = page.filter(it => it.gx === gx); if (!col.length) continue;
    return at(gx, cur.gy) || col.reduce((a, b) => Math.abs(b.gy - cur.gy) < Math.abs(a.gy - cur.gy) ? b : a);
  }
  return null;
}
function playerUse(it) {
  const [kind, id] = it.id.split(':');
  if (kind === 'tab') { Player.page = +id; Player.sel = it.id; sfx('tick'); }
  else if (kind === 'track') { playerPlay(id); sfx('ok'); }
  else if (kind === 'voice') { Player.off[id] = !Player.off[id]; playerHand(); sfx('tick'); }
  else if (kind === 'el') { Player.els[id] = !Player.els[id]; playerHand(); sfx('tick'); }
  else if (kind === 'full') { Player.full = !Player.full; playerHand(); sfx('tick'); }
  else if (kind === 'fx') Snd.play(id, 3);
  else if (kind === 'more') { Player.fxPage = (Player.fxPage || 0) + 1; sfx('tick'); }      // the sounds' next page
}
MODES.music = function (dt) {
  G.t += dt; updateDoors(dt); updateRooms(dt); updateAllies(dt); updateSmall(dt);        // the title's rooms live on behind it
  const items = playerLayout().items, m = Input.mouse, over = items.find(it => Input.inRect(it));
  let cur = items.find(it => it.id === Player.sel) || items.find(it => it.id === 'track:' + Player.track) || items.find(it => it.gy >= 0), use = null;
  const dx = (Input.hit('right') ? 1 : 0) - (Input.hit('left') ? 1 : 0), dy = dx ? 0 : (Input.hit('down') ? 1 : 0) - (Input.hit('up') ? 1 : 0);
  if (dx || dy) { const to = playerNext(items, cur, dx, dy); if (to) { cur = to; sfx('tick'); } }
  if (over && (m.moved || m.click)) cur = over;             // the choice follows the pointer and a tap
  Player.sel = cur.id;
  if (App.modeT > 0.3) { if (m.click) use = over; else if (Input.confirm()) use = cur; }
  if (Input.hit('alt')) use = items.find(it => it.id === 'tab:' + (1 - Player.page));     // Q or Tab turns the page
  if (Input.hit('back') || (use && use.id === 'back')) { closePlayer(); return; }
  if (use) playerUse(use);
};

function renderMusic(g) {
  renderWorld(g);
  g.fillStyle = 'rgba(13,10,26,0.84)'; g.fillRect(0, 0, VW, VH);
  const L_ = playerLayout(), { W, x0, top, items } = L_, sel = Player.sel;
  if (!L_.narrow) txs(g, 'MUSIC PLAYER', VW / 2, 6, '#ffd95e', 0.5);
  if (L_.cols) for (const [x, w, head] of L_.cols) { panel(g, x, top, w, L_.panelH); txt(g, head, x + 5, top + 4, '#9aa3b5'); }
  if (L_.cols && !L_.info.elements.length) txt(g, 'none in this one', L_.cols[2][0] + 5, top + 18, '#5d667c');
  if (L_.lines) { g.fillStyle = '#3b2d4f'; for (const y of L_.lines) g.fillRect(x0, y, W, 1); if (L_.none) txt(g, 'no element voices in this one', x0 + 3, L_.none, '#5d667c'); }
  for (const it of items) {
    const on = it.id === sel, kind = it.id.split(':')[0], small = kind === 'back' || kind === 'tab';
    if (on) { g.fillStyle = 'rgba(255,217,94,0.16)'; g.fillRect(it.x, it.y, it.w, it.h - 1); }
    let x = it.x + (small ? 5 : 3); const y = small ? it.y + it.h - 10 : it.y + (it.h >= 16 ? Math.round((it.h - 8) / 2) : 2);
    if (it.box) { g.fillStyle = it.on ? (it.col || '#9cecf2') : '#3b2d4f'; g.fillRect(x, y + 1, 6, 6); if (!it.on) { g.fillStyle = '#1f1a36'; g.fillRect(x + 1, y + 2, 4, 4); } x += 9; }
    const col = on ? '#ffd95e' : small ? (it.on ? '#fff8e8' : '#9aa3b5') : kind === 'more' ? '#9cecf2' : kind === 'track' && it.on ? '#fff8e8' : it.box && !it.on ? '#5d667c' : '#d8dbe6';
    txt(g, it.label, x, y, col);
    if (kind === 'track' && it.on) txt(g, '>', it.x + it.w - 8, y, '#9cecf2');
    if (kind === 'tab' && it.on) { g.fillStyle = '#ffd95e'; g.fillRect(it.x + 5, it.y + it.h - 1, it.w - 12, 1); }
  }
  if (Player.page === 0) {
    const info = L_.info, pos = Snd.track === Player.track ? Snd.pos() : null, bar = pos ? Math.floor(pos.step / 16) % info.bars + 1 : 0, y = L_.barY;
    const name = info.title || playerTracks().find(t => t[0] === Player.track)[1], part = bar && info.parts.length ? info.parts[Math.floor((bar - 1) / 8)] : '';
    const state = !Snd.on ? (L_.narrow ? 'tap for sound' : 'press a key or tap to start the sound') : Snd.vol.music <= 0 ? (L_.narrow ? 'music is off' : 'silent: the music volume is at 0') : bar ? 'bar ' + bar + (L_.narrow ? '/' : ' of ') + info.bars + (part && !L_.narrow ? '  -  ' + part : '') : '';
    txt(g, L_.narrow && textW(name) + textW(state) + 8 > W ? name.replace(/^What the /, '').replace(/^The /, '') : name, x0, y, '#fff8e8'); txt(g, state, x0 + W, y, '#9aa3b5', 1);
    g.fillStyle = '#3b2d4f'; g.fillRect(x0, y + 11, W, 2); if (pos) { g.fillStyle = '#ffd95e'; g.fillRect(x0, y + 11, Math.round(W * (pos.step % pos.steps) / pos.steps), 2); }
    if (L_.floor.h >= 24) drawDancers(g, L_.floor, info, pos);
  }
  if (L_.hint) txt(g, Input.touch ? 'tap a track, a switch or a sound' : 'ARROWS choose - ENTER plays or switches - Q turns the page - ESC goes back', VW / 2, VH - 10, '#5d667c', 0.5);
}
// The dance floor: the floor's colours, tiles that light on the beat, an icon for each element voice and a dancer for
// each voice of the piece. A dancer hops when its voice starts a note and stands dimmed while its voice is off.
function drawDancers(g, F, info, pos) {
  const fl = FLOORS.find(f => f.music === Player.track), beat = pos ? Math.floor(pos.step / 4) : 0, n = Math.max(6, Math.floor(F.w / 24)), tw = F.w / n;
  g.fillStyle = fl ? fl.void : '#0d0a1a'; g.fillRect(F.x, F.y, F.w, F.h);
  for (let i = 0; i < n; i++) { g.fillStyle = (i + beat) & 1 ? (fl ? fl.mark : '#2a2350') : (fl ? fl.grid : '#1a1532'); g.fillRect(Math.round(F.x + i * tw), F.y + F.h - 14, Math.ceil(tw) - 1, 12); }
  const map = DANCERS[Player.track] || {}, list = VOICE_ORDER.filter(v => map[v] && info.voices.includes(v)); if (map.idle) list.push('idle');
  const spr = (v, fr) => { const who = map[v] === '@' ? Save.data.hero : map[v]; return SPR[HEROES[who] ? who + 'D' + fr : who + fr]; };
  // twice their size where the floor has the room for the tallest of them and its hop under the icons, and for the widest
  const gap = F.w / list.length, base = F.y + F.h - 8, k = list.every(v => spr(v, 0).h * 2 + 46 <= F.h && spr(v, 0).w * 2 <= gap) ? 2 : 1;
  const draw = (s, x, y, flip) => g.drawImage(flip ? s.f : s.c, Math.round(x) - (flip ? s.w - 1 - s.ax : s.ax) * k, Math.round(y) - s.ay * k, s.w * k, s.h * k);
  list.forEach((v, i) => {
    const on = v !== 'idle' && Snd.sounds(v), since = on ? Snd.since(v) : Infinity;
    const hop = since < 0.26 ? Math.sin(since / 0.26 * Math.PI) * (v === 'bass' ? 6 : v === 'drum' ? 5 : 4) : 0, s = spr(v, hop ? Math.floor(frameT * 8) & 1 : 0);
    const x = F.x + gap * (i + 0.5) + (v === 'idle' ? Math.round(Math.sin(frameT * 2)) : 0);
    g.globalAlpha = on || v === 'idle' ? 1 : 0.35;
    draw(s.w > 34 ? SPR.sh_xl : s.w > 20 ? SPR.sh_l : SPR.sh_s, x, base + 2 * k, false); draw(s, x, base - Math.round(hop) * k, on && (((beat >> 1) + i) & 1) === 1);
    g.globalAlpha = 1;
  });
  info.elements.forEach((el, i) => {
    const on = Snd.sounds(el), since = on ? Snd.since(el) : Infinity, hop = since < 0.2 ? Math.sin(since / 0.2 * Math.PI) * 3 : 0;
    g.globalAlpha = on ? 1 : 0.25; draw(SPR['e_' + el], F.x + F.w / info.elements.length * (i + 0.5), F.y + 10 * k + 2 - Math.round(hop) * k, false); g.globalAlpha = 1;
  });
}
