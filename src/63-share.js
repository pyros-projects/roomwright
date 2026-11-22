/* ============================ 16 SHARE CARD =========================== */
// A run leaves a floor plan behind, and the end screen can hand it on (#19): as a picture of SHARE_W by SHARE_H with
// the game's name, the run's facts, the plan and the game's address, or as text: one line of facts, a grid of squares
// in the rooms' element colours, the address. Neither holds anything personal: no name, no save, no clock time.
// Where a phone's browser has a share sheet for files the picture goes there; elsewhere it is copied; where a browser
// cannot copy a picture it is saved as a file.
const SHARE_W = 960, SHARE_H = 540, SHARE_URL = 'pyros-projects.github.io/roomwright';
const SHARE_SQ = { stone: '\u2B1C', fire: '\u{1F7E7}', frost: '\u{1F9CA}', steel: '\u{1F7E8}', water: '\u{1F7E6}', lore: '\u{1F7E5}', wild: '\u{1F7E9}', shadow: '\u{1F7EA}', hearth: '\u{1F7EB}', none: '\u2B1B' };
// dry: for the checks (nothing leaves the page; Share.last says what would have). blob, file, text: made ready when the
// end screen opens, so that the gesture itself can hand them on without waiting.
const Share = { msg: '', what: '', t: 0, busy: false, dry: false, last: null, did: 0, blob: null, file: null, text: '' };
const shareWon = () => App.mode === 'win' || (!!G.won && !G.over);
function shareFacts() {
  const d = G.daily;
  return 'Roomwright ' + VERSION + (d ? ', daily delve ' + d.day + (d.practice ? ' (practice)' : '') : '') + ': ' + HEROES[G.hero].name + ', ' +
    (shareWon() ? 'all three floors' : 'floor ' + (G.floor + 1)) + ', ' + fmtTime(G.tRun) + ', ' + G.stats.rooms + (G.stats.rooms === 1 ? ' room' : ' rooms') + (G.stakes ? ', Stakes ' + G.stakes : '');
}
function shareBox() { let x0 = GRID, x1 = -1, y0 = GRID, y1 = -1; for (const r of G.rooms) { x0 = Math.min(x0, r.cx); x1 = Math.max(x1, r.cx); y0 = Math.min(y0, r.cy); y1 = Math.max(y1, r.cy); } return { x0, x1, y0, y1 }; }
function shareAsText() {
  const B = shareBox(), rows = [];
  for (let y = B.y0; y <= B.y1; y++) { let s = ''; for (let x = B.x0; x <= B.x1; x++) { const r = G.cells[y * GRID + x]; s += !r ? SHARE_SQ.none : r.type === 'hearth' ? SHARE_SQ.hearth : SHARE_SQ[r.def.el] || SHARE_SQ.none; } rows.push(s); }
  return shareFacts() + '\n' + rows.join('\n') + '\n' + SHARE_URL;
}
// the picture: drawn at half size with the game's own letters and its map, then doubled, so it keeps the game's pixels
function shareCard() {
  const W = SHARE_W / 2, H = SHARE_H / 2, c1 = mkCanvas(W, H), g = c1.getContext('2d'), win = shareWon(), d = G.daily, hero = HEROES[G.hero], rim = win ? '#ffd95e' : '#a32a3c';
  g.fillStyle = '#141028'; g.fillRect(0, 0, W, H); g.fillStyle = '#1e1a3c'; for (let i = 4; i < W; i += 8) for (let j = 4; j < H; j += 8) g.fillRect(i, j, 1, 1);
  g.fillStyle = rim; g.fillRect(4, 4, W - 8, 2); g.fillRect(4, H - 6, W - 8, 2); g.fillRect(4, 4, 2, H - 8); g.fillRect(W - 6, 4, 2, H - 8);
  txo(g, LOGO, W / 2, 14, '#ffd95e', '#1a1426', 0.5, 3);
  txo(g, win ? 'THE KNOCKING STOPS' : 'THE DARK GOT IN', W / 2, 42, win ? '#ffd95e' : '#ff9ec4', '#1a1426', 0.5, 2);
  txt(g, hero.name + ' the ' + hero.title + (win ? ' cleared all three floors' : ' fell on floor ' + (G.floor + 1) + ', ' + G.F.name), W / 2, 64, '#fff8e8', 0.5);
  txt(g, fmtTime(G.tRun) + '   ' + G.stats.rooms + (G.stats.rooms === 1 ? ' room' : ' rooms') + '   ' + G.stats.kills + ' monsters' + (G.stakes ? '   Stakes ' + G.stakes : ''), W / 2, 75, '#9cecf2', 0.5);
  if (d) txt(g, 'DAILY DELVE ' + d.day + (d.practice ? ' (practice)' : ''), W / 2, 86, '#ffd95e', 0.5);
  // the plan of the last floor, as large as the box allows
  const B = shareBox(), bx = 40, by = 98, bw = W - 80, bh = H - 98 - 34, nx = B.x1 - B.x0 + 1, ny = B.y1 - B.y0 + 1;
  const cw = Math.max(6, Math.min(44, Math.floor(bw / nx))), ch = Math.max(4, Math.min(30, Math.floor(bh / ny), Math.round(cw * 0.72)));
  g.fillStyle = '#0d0a1a'; g.fillRect(bx, by, bw, bh);
  drawMap(g, bx + ((bw - nx * cw) >> 1) - B.x0 * cw, by + ((bh - ny * ch) >> 1) - B.y0 * ch, cw, ch, false);
  txt(g, 'the plan of floor ' + (G.floor + 1), bx + 4, by + 3, '#5d667c');
  txt(g, SHARE_URL, W / 2, H - 22, '#9aa3b5', 0.5);
  const c2 = mkCanvas(SHARE_W, SHARE_H), g2 = c2.getContext('2d'); g2.imageSmoothingEnabled = false; g2.drawImage(c1, 0, 0, SHARE_W, SHARE_H);
  return c2;
}
// where the picture goes in this browser: a phone's share sheet, the clipboard, or a file
function shareRoute(file, touch = Input.touch) {
  if (touch && file && navigator.canShare && navigator.share) { try { if (navigator.canShare({ files: [file] })) return 'sheet'; } catch (e) { /* no sheet for files */ } }
  if (navigator.clipboard && navigator.clipboard.write && typeof ClipboardItem === 'function') return 'clipboard';
  return 'file';
}
const shareSay = (m, what) => { Share.busy = false; Share.msg = m; Share.what = what || Share.what; Share.t = m ? 2.5 : 0; };
// The end screen opens: no word from the run before, and the picture and the text are made ready.
function sharePrepare() {
  Share.msg = ''; Share.t = 0; Share.busy = false; Share.blob = null; Share.file = null; Share.text = '';
  try { Share.text = shareAsText(); if (!Share.dry) shareCard().toBlob(b => { Share.blob = b; Share.file = b && typeof File === 'function' ? new File([b], 'roomwright.png', { type: 'image/png' }) : null; }, 'image/png'); } catch (e) { /* no picture in this browser */ }
}
function sharePicture() {
  if (Share.busy) return; const say = m => shareSay(m, 'share');
  if (Share.dry) { const c = shareCard(); Share.last = { kind: 'picture', w: c.width, h: c.height, bytes: c.toDataURL('image/png').length, route: shareRoute(null) }; say('READY'); return; }
  const save = blob => { try { const a = document.createElement('a'), u = URL.createObjectURL(blob); a.href = u; a.download = 'roomwright.png'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 5000); say('SAVED'); } catch (e) { say('NOT HERE'); } };
  const go = blob => {
    try {
      if (!blob) return say('NOT HERE');
      const file = Share.file || (typeof File === 'function' ? new File([blob], 'roomwright.png', { type: 'image/png' }) : null), route = shareRoute(file);
      // a sheet that is refused because the browser saw no gesture asks for a second tap; one that is closed says nothing
      if (route === 'sheet') navigator.share({ files: [file], title: 'Roomwright', text: shareFacts() }).then(() => say('SHARED'), e => e && e.name === 'AbortError' ? say('') : e && e.name === 'NotAllowedError' ? say('TAP AGAIN') : save(blob));
      else if (route === 'clipboard') navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]).then(() => say('COPIED'), () => save(blob));
      else save(blob);
    } catch (e) { say('NOT HERE'); }
  };
  Share.busy = true;
  if (Share.blob) go(Share.blob); else { try { shareCard().toBlob(go, 'image/png'); } catch (e) { say('NOT HERE'); } }
}
function shareText() {
  const t = Share.text || shareAsText(), say = m => shareSay(m, 'text');
  if (Share.dry) { Share.last = { kind: 'text', text: t }; say('READY'); return; }
  const old = () => { try { const a = document.createElement('textarea'); a.value = t; a.style.position = 'fixed'; a.style.opacity = '0'; document.body.appendChild(a); a.select(); const ok = document.execCommand('copy'); a.remove(); return ok; } catch (e) { return false; } };
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(() => say('COPIED'), () => say('NOT HERE'));
    else say(old() ? 'COPIED' : 'NOT HERE');
  } catch (e) { say(old() ? 'COPIED' : 'NOT HERE'); }
}
// The two chips beside the end panel. A share sheet and the clipboard open only to a user's gesture, and on a phone a
// touch counts when the finger lifts. So the action runs inside the browser's own event: a key going down, a click, the
// end of a touch. Only a pad has no such event; its Y is seen by the frame.
const shareOpen = () => (App.mode === 'over' || App.mode === 'win') && !App.fade;
function shareAt(vx, vy) { const L_ = endLayout(), hit = r => vx >= r.x && vx < r.x + r.w && vy >= r.y && vy < r.y + r.h; return hit(L_.share) ? 'share' : hit(L_.text) ? 'text' : ''; }
function shareDo(what) { if (!what) return; sfx('ok'); Share.did = performance.now(); if (what === 'share') sharePicture(); else shareText(); }
{ const view = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * VW / r.width, (e.clientY - r.top) * VH / r.height]; };
  addEventListener('keydown', e => { if (!shareOpen() || e.repeat) return; const k = (e.key || '').toLowerCase(); if (e.code === 'KeyR' || k === 'r') shareDo('share'); else if (e.code === 'KeyH' || k === 'h' || k === '?') shareDo('text'); });
  cv.addEventListener('click', e => { if (shareOpen() && !Input.touch) shareDo(shareAt(...view(e))); });
  cv.addEventListener('touchend', e => { if (!shareOpen()) return; const t = e.changedTouches && e.changedTouches[0]; if (t) shareDo(shareAt(...view(t))); });
}
function shareInput(L_, dt) {
  if (Share.t > 0) Share.t -= dt;
  if (performance.now() - Share.did < 250) return;                      // the browser's event has done it already
  if (Input.hit('reroll')) shareDo('share'); else if (Input.hit('help')) shareDo('text');
}
