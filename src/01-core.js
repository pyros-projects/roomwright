/* ============================== 1 CONFIG ============================== */
const T = 16;                         // tile size in px
const IW = 17, IH = 11, WALL = 2;     // room interior (tiles) and wall ring thickness
const CWT = IW + WALL * 2, CHT = IH + WALL * 2;   // one room cell = 21 x 15 tiles
const CWP = CWT * T, CHP = CHT * T;               // = 336 x 240 px
const GRID = 9;                       // the dungeon is a GRID x GRID board of room cells
const GWT = GRID * CWT, GHT = GRID * CHT;
const STEP = 1 / 60;                  // fixed simulation step
const DIRS = [{x:0,y:-1},{x:1,y:0},{x:0,y:1},{x:-1,y:0}];   // N E S W
const F_WALK = 1, F_FLY = 2, F_SHOT = 4, F_HARD = 8, F_ALL = 15;   // tile blocking flags
const F_PLAYER = 16, PMASK = F_WALK | F_PLAYER;                    // latched gates stop only the player
const VERSION = '0.4';
const MAX_WEAPONS = 4;
const DECK_SIZE = 10;                 // room cards in a deck
const STAIRS_MIN = 5;                 // rooms you must draft on a floor before the Stairwell is offered
const ROOM_MAX_LV = 3;
const VOID_COL = '#0d0a1a';

/* =============================== 2 UTIL =============================== */
const TAU = Math.PI * 2;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const easeOut = t => 1 - (1 - t) * (1 - t);
const easeBack = t => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
function RNG(seed) { let a = seed >>> 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
let rand = Math.random;               // gameplay rng (re-seeded per run)
const fxr = Math.random;              // cosmetic rng (never affects the sim)
const rr = (a, b) => a + rand() * (b - a);
const ri = (a, b) => a + Math.floor(rand() * (b - a + 1));
const pick = arr => arr[Math.floor(rand() * arr.length)];
function wpick(items, wf) { let tot = 0; for (const it of items) tot += wf(it); let r = rand() * tot; for (const it of items) { r -= wf(it); if (r <= 0) return it; } return items[items.length - 1]; }
function hash2(x, y, s) { let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 1442695041)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function angDiff(a, b) { let d = a - b; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; }
function hex2rgb(h) { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function rgb2hex(r, g, b) { return '#' + ((1 << 24) | (clamp(Math.round(r), 0, 255) << 16) | (clamp(Math.round(g), 0, 255) << 8) | clamp(Math.round(b), 0, 255)).toString(16).slice(1); }
function shade(h, f) { const [r, g, b] = hex2rgb(h); return rgb2hex(r * f, g * f, b * f); }
function mix(h1, h2, t) { const a = hex2rgb(h1), b = hex2rgb(h2); return rgb2hex(lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)); }
const fmtTime = s => { s = Math.max(0, Math.floor(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

/* =========================== 3 PIXEL TOOLKIT =========================== */
// One master palette keeps the whole game in a cohesive 16-bit colour space.
const PAL = {
  k:'#1a1426', K:'#3b2d4f', w:'#fff8e8', W:'#d8dbe6', g:'#9aa3b5', G:'#5d667c',
  s:'#ffd2a6', S:'#e39b72', r:'#e8474c', R:'#a32a3c', o:'#f6923a', O:'#c15a2b',
  y:'#ffd95e', Y:'#dc9a2c', l:'#b5e85a', n:'#58b848', N:'#2e7d4f', c:'#9cecf2',
  b:'#4c97e8', B:'#2f55a8', p:'#ff9ec4', m:'#d94f8c', P:'#9a62d6', v:'#5a3894',
  t:'#e3bd88', T:'#a6713f', d:'#643f2a', h:'#3fc1ad', H:'#24857f', i:'#8ff0d6',
};
function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function flipCanvas(c) { const o = mkCanvas(c.width, c.height), g = o.getContext('2d'); g.translate(c.width, 0); g.scale(-1, 1); g.drawImage(c, 0, 0); return o; }
function whiteCanvas(c) { const o = mkCanvas(c.width, c.height), g = o.getContext('2d'); g.drawImage(c, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); return o; }
function rotCanvas(c, q) {            // rotate by q quarter turns clockwise (lossless)
  q = ((q % 4) + 4) % 4; if (!q) return c;
  const w = c.width, h = c.height, o = mkCanvas(q % 2 ? h : w, q % 2 ? w : h), g = o.getContext('2d');
  g.translate(o.width / 2, o.height / 2); g.rotate(q * Math.PI / 2); g.drawImage(c, -w / 2, -h / 2); return o;
}
function scaleCanvas(c, n) { const o = mkCanvas(c.width * n, c.height * n), g = o.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(c, 0, 0, o.width, o.height); return o; }

// grid of palette chars -> canvas, with an optional 1px auto-outline
function drawGrid(grid, map, outline) {
  const h = grid.length, w = grid[0].length, p = outline ? 1 : 0;
  const c = mkCanvas(w + 2 * p, h + 2 * p), g = c.getContext('2d');
  const filled = (x, y) => y >= 0 && y < h && x >= 0 && x < w && grid[y][x] !== '.';
  if (outline) {
    g.fillStyle = map[outline] || outline;
    for (let y = -1; y <= h; y++) for (let x = -1; x <= w; x++)
      if (!filled(x, y) && (filled(x - 1, y) || filled(x + 1, y) || filled(x, y - 1) || filled(x, y + 1))) g.fillRect(x + p, y + p, 1, 1);
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const ch = grid[y][x]; if (ch === '.') continue;
    g.fillStyle = map[ch] || '#f0f'; g.fillRect(x + p, y + p, 1, 1);
  }
  return c;
}
// procedural char-grid: lets us "draw" sprites with shapes but keep palette + outline rules
class CG {
  constructor(w, h) { this.w = w; this.h = h; this.g = []; for (let y = 0; y < h; y++) this.g.push(new Array(w).fill('.')); }
  set(x, y, c) { x |= 0; y |= 0; if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.g[y][x] = c; return this; }
  get(x, y) { return (x >= 0 && y >= 0 && x < this.w && y < this.h) ? this.g[y][x] : '.'; }
  rect(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c); return this; }
  ell(cx, cy, rx, ry, c) { for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) { const dx = (x - cx) / rx, dy = (y - cy) / ry; if (dx * dx + dy * dy <= 1) this.set(x, y, c); } return this; }
  disc(cx, cy, r, c) { return this.ell(cx, cy, r, r, c); }
  line(x0, y0, x1, y1, c) { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1; for (let i = 0; i <= n; i++) this.set(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), c); return this; }
  put(rows, x, y) { for (let j = 0; j < rows.length; j++) for (let i = 0; i < rows[j].length; i++) if (rows[j][i] !== '.') this.set(x + i, y + j, rows[j][i]); return this; }
  canvas(ol, map) { return drawGrid(this.g, map || PAL, ol); }
}

const SPR = {};                       // sprite registry: name -> {c, f, wh, whf, w, h, ax, ay}
function reg(name, canvas, ax, ay) {
  const s = { c: canvas, w: canvas.width, h: canvas.height, ax: ax === undefined ? canvas.width >> 1 : ax, ay: ay === undefined ? canvas.height - 1 : ay };
  s.f = flipCanvas(canvas); s.wh = whiteCanvas(canvas); s.whf = flipCanvas(s.wh);
  SPR[name] = s; return s;
}
// A(name, rows, opts): register an ASCII sprite. opts: ol (outline char, default 'k', null = none), map (palette overrides), ax, ay
function A(name, rows, o = {}) {
  const w = rows.reduce((m, r) => Math.max(m, r.length), 0);
  const grid = rows.map((r, i) => { if (r.length !== w) console.warn('sprite ' + name + ': row ' + i + ' is ' + r.length + ' wide, expected ' + w); return r.padEnd(w, '.').split(''); });
  const map = o.map ? Object.assign({}, PAL, o.map) : PAL;
  return reg(name, drawGrid(grid, map, o.ol === undefined ? 'k' : o.ol), o.ax, o.ay);
}
// draw sprite anchored at its (ax, ay) hot-spot
function ds(g, s, x, y, flip, white) {
  g.drawImage(white ? (flip ? s.whf : s.wh) : (flip ? s.f : s.c), Math.round(x) - (flip ? s.w - 1 - s.ax : s.ax), Math.round(y) - s.ay);
}

// 32-bit pixel buffer for fast procedural painting (floors, walls)
const _c32 = {};
function c32(hex) { let v = _c32[hex]; if (v === undefined) { const [r, g, b] = hex2rgb(hex); v = _c32[hex] = ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0; } return v; }
function mul32(c, f) { const r = Math.min(255, (c & 255) * f) | 0, g = Math.min(255, ((c >> 8) & 255) * f) | 0, b = Math.min(255, ((c >> 16) & 255) * f) | 0; return ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0; }
class PixBuf {
  constructor(w, h) { this.w = w; this.h = h; this.img = new ImageData(w, h); this.d = new Uint32Array(this.img.data.buffer); }
  set(x, y, c) { if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.d[y * this.w + x] = c; }
  get(x, y) { return this.d[y * this.w + x]; }
  rect(x, y, w, h, c) { const x1 = Math.min(this.w, x + w), y1 = Math.min(this.h, y + h); for (let j = Math.max(0, y); j < y1; j++) for (let i = Math.max(0, x); i < x1; i++) this.d[j * this.w + i] = c; }
  dim(x, y, f) { if (x >= 0 && y >= 0 && x < this.w && y < this.h) { const i = y * this.w + x; this.d[i] = mul32(this.d[i], f); } }
  toCanvas(c) { c = c || mkCanvas(this.w, this.h); c.getContext('2d').putImageData(this.img, 0, 0); return c; }
}

/* =============================== 4 FONT =============================== */
// Proportional 5x7 bitmap font (8th row = descenders). A glyph spec with no '/' is a 1px-wide column.
const FONT = {}, FONT_H = 8; let FONT_W = 0;
(() => {
  const src = {
    'A':'.###./#...#/#...#/#####/#...#/#...#/#...#', 'B':'####./#...#/#...#/####./#...#/#...#/####.',
    'C':'.###./#...#/#..../#..../#..../#...#/.###.', 'D':'####./#...#/#...#/#...#/#...#/#...#/####.',
    'E':'#####/#..../#..../####./#..../#..../#####', 'F':'#####/#..../#..../####./#..../#..../#....',
    'G':'.###./#...#/#..../#.###/#...#/#...#/.###.', 'H':'#...#/#...#/#...#/#####/#...#/#...#/#...#',
    'I':'###/.#./.#./.#./.#./.#./###', 'J':'..###/...#./...#./...#./...#./#..#./.##..',
    'K':'#...#/#..#./#.#../##.../#.#../#..#./#...#', 'L':'#..../#..../#..../#..../#..../#..../#####',
    'M':'#...#/##.##/#.#.#/#.#.#/#...#/#...#/#...#', 'N':'#...#/##..#/#.#.#/#..##/#...#/#...#/#...#',
    'O':'.###./#...#/#...#/#...#/#...#/#...#/.###.', 'P':'####./#...#/#...#/####./#..../#..../#....',
    'Q':'.###./#...#/#...#/#...#/#.#.#/#..#./.##.#', 'R':'####./#...#/#...#/####./#.#../#..#./#...#',
    'S':'.####/#..../#..../.###./....#/....#/####.', 'T':'#####/..#../..#../..#../..#../..#../..#..',
    'U':'#...#/#...#/#...#/#...#/#...#/#...#/.###.', 'V':'#...#/#...#/#...#/#...#/#...#/.#.#./..#..',
    'W':'#...#/#...#/#...#/#.#.#/#.#.#/##.##/#...#', 'X':'#...#/#...#/.#.#./..#../.#.#./#...#/#...#',
    'Y':'#...#/#...#/.#.#./..#../..#../..#../..#..', 'Z':'#####/....#/...#./..#../.#.../#..../#####',
    'a':'..../..../.##./...#/.###/#..#/.###', 'b':'#.../#.../###./#..#/#..#/#..#/###.',
    'c':'..../..../.###/#.../#.../#.../.###', 'd':'...#/...#/.###/#..#/#..#/#..#/.###',
    'e':'..../..../.##./#..#/####/#.../.###', 'f':'..#/.#./###/.#./.#./.#./.#.',
    'g':'..../..../.###/#..#/#..#/.###/...#/.##.', 'h':'#.../#.../###./#..#/#..#/#..#/#..#',
    'i':'#.#####', 'j':'.#/../.#/.#/.#/.#/.#/#.',
    'k':'#.../#.../#..#/#.#./##../#.#./#..#', 'l':'#######',
    'm':'...../...../##.#./#.#.#/#.#.#/#.#.#/#.#.#', 'n':'..../..../###./#..#/#..#/#..#/#..#',
    'o':'..../..../.##./#..#/#..#/#..#/.##.', 'p':'..../..../###./#..#/#..#/###./#.../#...',
    'q':'..../..../.###/#..#/#..#/.###/...#/...#', 'r':'.../.../#.#/##./#../#../#..',
    's':'..../..../.###/#.../.##./...#/###.', 't':'.#./.#./###/.#./.#./.#./..#',
    'u':'..../..../#..#/#..#/#..#/#..#/.###', 'v':'.../.../#.#/#.#/#.#/#.#/.#.',
    'w':'...../...../#...#/#.#.#/#.#.#/#.#.#/.#.#.', 'x':'.../.../#.#/#.#/.#./#.#/#.#',
    'y':'..../..../#..#/#..#/#..#/.###/...#/.##.', 'z':'..../..../####/...#/.##./#.../####',
    '0':'.###./#...#/#..##/#.#.#/##..#/#...#/.###.', '1':'.#./##./.#./.#./.#./.#./###',
    '2':'.###./#...#/....#/...#./..#../.#.../#####', '3':'.###./#...#/....#/..##./....#/#...#/.###.',
    '4':'...#./..##./.#.#./#..#./#####/...#./...#.', '5':'#####/#..../####./....#/....#/#...#/.###.',
    '6':'..##./.#.../#..../####./#...#/#...#/.###.', '7':'#####/....#/...#./..#../.#.../.#.../.#...',
    '8':'.###./#...#/#...#/.###./#...#/#...#/.###.', '9':'.###./#...#/#...#/.####/....#/...#./.##..',
    '.':'......#', ',':'../../../../../.#/.#/#.', '!':'#####.#', '?':'.###./#...#/....#/...#./..#../...../..#..',
    ':':'..#..#.', ';':'../../.#/../../.#/.#/#.', "'":'##.....', '"':'#.#/#.#/.../.../.../.../...',
    '-':'.../.../.../###/.../.../...', '+':'.../.../.#./###/.#./.../...', '/':'...#/...#/..#./..#./.#../#.../#...',
    '(':'.#/#./#./#./#./#./.#', ')':'#./.#/.#/.#/.#/.#/#.', '%':'##..#/##.#./...#./..#../.#.../.#.##/#..##',
    '*':'.../#.#/.#./#.#/.../.../...', '<':'.../..#/.#./#../.#./..#/...', '>':'.../#../.#./..#/.#./#../...',
    '=':'..../..../####/..../####/..../....', '#':'.#.#./.#.#./#####/.#.#./#####/.#.#./.#.#.',
    '&':'.##../#..#./#.#../.#.../#.#.#/#..#./.##.#', '_':'..../..../..../..../..../..../####',
    '~':'...../...../.#.../#.#.#/...#./...../.....', '[':'##/#./#./#./#./#./##', ']':'##/.#/.#/.#/.#/.#/##',
    '^':'.#./#.#/.../.../.../.../...', '|':'#######',
    '@':'...../..#../.###./#####/.###./..#../.....',                       // glint
    '{':'...../.#.#./#####/#####/.###./..#../.....',                       // heart
    '}':'......./.##..../#..#.../#..####/#..#.#./.##..../.......',         // key
    '`':'...../..#../..#../#####/.###./.#.#./#...#',                       // star (room level)
  };
  let x = 0;
  for (const ch in src) {
    const rows = src[ch].indexOf('/') < 0 ? src[ch].split('') : src[ch].split('/');
    FONT[ch] = { w: rows[0].length, x, rows }; x += rows[0].length + 1;
  }
  FONT[' '] = { w: 3, x: 0, rows: [] };
  FONT_W = x;
})();
const _atlas = {};
function fontAtlas(col) {
  let a = _atlas[col]; if (a) return a;
  a = mkCanvas(FONT_W, FONT_H); const g = a.getContext('2d'); g.fillStyle = col;
  for (const ch in FONT) { const gl = FONT[ch]; for (let y = 0; y < gl.rows.length; y++) { const r = gl.rows[y]; for (let i = 0; i < r.length; i++) if (r[i] === '#') g.fillRect(gl.x + i, y, 1, 1); } }
  return _atlas[col] = a;
}
function textW(s) { let w = 0; for (let i = 0; i < s.length; i++) w += (FONT[s[i]] || FONT['?']).w + 1; return w > 0 ? w - 1 : 0; }
// txt(g, string, x, y, colour, align 0|0.5|1, scale)
function txt(g, s, x, y, col = '#fff8e8', align = 0, sc = 1) {
  const at = fontAtlas(col); x = Math.round(x - textW(s) * sc * align); y = Math.round(y);
  for (let i = 0; i < s.length; i++) {
    const gl = FONT[s[i]] || FONT['?'];
    if (gl.rows.length) g.drawImage(at, gl.x, 0, gl.w, FONT_H, x, y, gl.w * sc, FONT_H * sc);
    x += (gl.w + 1) * sc;
  }
}
// outlined text (8-way), for anything drawn over the playfield
function txo(g, s, x, y, col = '#fff8e8', ocol = '#1a1426', align = 0, sc = 1) {
  for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) if (ox || oy) txt(g, s, x + ox * sc, y + oy * sc, ocol, align, sc);
  txt(g, s, x, y, col, align, sc);
}
// soft drop-shadow text, for panels
function txs(g, s, x, y, col = '#fff8e8', align = 0, scol = '#1a1426') { txt(g, s, x + 1, y + 1, scol, align); txt(g, s, x, y, col, align); }
function wrapText(s, maxW) {
  const out = []; let line = '';
  for (const word of s.split(' ')) { const t = line ? line + ' ' + word : word; if (textW(t) > maxW && line) { out.push(line); line = word; } else line = t; }
  if (line) out.push(line); return out;
}
// tiny 3x5 digits for damage numbers
const MINI = {}; (() => {
  const d = ['###/#.#/#.#/#.#/###', '.#./##./.#./.#./###', '###/..#/###/#../###', '###/..#/###/..#/###', '#.#/#.#/###/..#/..#', '###/#../###/..#/###', '###/#../###/#.#/###', '###/..#/..#/.#./.#.', '###/#.#/###/#.#/###', '###/#.#/###/..#/###'];
  for (const [name, col] of [['w', '#fff8e8'], ['y', '#ffd95e'], ['r', '#ff7a7a'], ['c', '#9cecf2'], ['g', '#b5e85a']]) {
    const c = mkCanvas(50, 7), g = c.getContext('2d');
    d.forEach((spec, n) => { const rows = spec.split('/'); for (const [ox, oy, cc] of [[-1, 0, '#1a1426'], [1, 0, '#1a1426'], [0, -1, '#1a1426'], [0, 1, '#1a1426'], [0, 0, col]]) { g.fillStyle = cc; rows.forEach((r, y) => { for (let x = 0; x < 3; x++) if (r[x] === '#') g.fillRect(n * 5 + 1 + x + ox, 1 + y + oy, 1, 1); }); } });
    MINI[name] = c;
  }
})();
function miniNum(g, n, x, y, col = 'w') { const s = String(Math.max(0, Math.round(n))); x = Math.round(x - s.length * 2); y = Math.round(y); for (let i = 0; i < s.length; i++) g.drawImage(MINI[col], (s.charCodeAt(i) - 48) * 5, 0, 5, 7, x + i * 4, y, 5, 7); }
