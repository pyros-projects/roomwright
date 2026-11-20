// Runs in the game page (agent-browser eval): draws the logo, the tagline and the film's captions with the
// game's own bitmap font and returns them as PNG data URLs, so the film's lettering is the game's lettering.
(() => {
  const png = {}, mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; return [c, g]; };
  // the logo exactly as renderTitle draws it (no bob, eyes open, looking ahead); origin = (lx - 8, ly - 4)
  { const sc = 4, lw = RW.textW('ROOMWRIGHT') * sc, [c, g] = mk(lw + 16, 8 * sc + sc + 8), lx = 8, ly = 4;
    RW.txo(g, 'ROOMWRIGHT', lx, ly + sc, '#1a1426', '#1a1426', 0, sc);
    RW.txo(g, 'ROOMWRIGHT', lx, ly, '#f6923a', '#1a1426', 0, sc);
    g.save(); g.beginPath(); g.rect(lx - 4, ly, lw + 8, sc * 3); g.clip(); RW.txt(g, 'ROOMWRIGHT', lx, ly, '#ffd95e', 0, sc); g.restore();
    g.save(); g.beginPath(); g.rect(lx - 4, ly, lw + 8, sc); g.clip(); RW.txt(g, 'ROOMWRIGHT', lx, ly, '#fff8e8', 0, sc); g.restore();
    for (const i of [1, 2]) { const ex = lx + i * 6 * sc + sc, ey = ly + sc;
      g.fillStyle = '#1a1426'; g.fillRect(ex, ey, 3 * sc, 5 * sc); g.fillStyle = '#fff8e8'; g.fillRect(ex + 1, ey + 5, 10, 10);
      g.fillStyle = '#1a1426'; g.fillRect(ex + 4, ey + 8, 4, 6); g.fillStyle = '#fff8e8'; g.fillRect(ex + 5, ey + 9, 1, 1); }
    png.logo = c.toDataURL(); }
  const line = (name, s, col, sc) => { const w = RW.textW(s) * sc, [c, g] = mk(w + 2 * sc, 8 * sc + 2 * sc); RW.txo(g, s, sc, sc, col, '#1a1426', 0, sc); png[name] = c.toDataURL(); };
  line('tagline', 'every level-up is a room', '#9cecf2', 1);
  const caps = __CAPTIONS__;
  for (const k in caps) line('cap-' + k, caps[k], '#fff8e8', 2);
  return JSON.stringify(png);
})()
