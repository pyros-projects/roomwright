/* =============================== 6 INPUT ============================== */
const cv = document.getElementById('game'), ctx = cv.getContext('2d');
let VW = 480, VH = 270, SCALE = 1;    // internal resolution and integer upscale
const Input = (() => {
  const down = new Set(), pressed = new Set();
  const CODE = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
    Space: 'dash', ShiftLeft: 'dash', ShiftRight: 'dash', Enter: 'ok', NumpadEnter: 'ok', KeyZ: 'ok', KeyE: 'ok', Escape: 'back', Backspace: 'back',
    KeyP: 'pause', KeyM: 'mute', Digit1: 'c1', Digit2: 'c2', Digit3: 'c3', Digit4: 'c4', Numpad1: 'c1', Numpad2: 'c2', Numpad3: 'c3', Numpad4: 'c4',
    KeyQ: 'alt', Tab: 'alt', KeyR: 'reroll', KeyI: 'intro', KeyH: 'help', Slash: 'help' };
  const KEY = { arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right', arrowup: 'up', w: 'up', arrowdown: 'down', s: 'down', ' ': 'dash', shift: 'dash',
    enter: 'ok', z: 'ok', e: 'ok', escape: 'back', backspace: 'back', p: 'pause', m: 'mute', '1': 'c1', '2': 'c2', '3': 'c3', '4': 'c4', q: 'alt', tab: 'alt', r: 'reroll', i: 'intro', h: 'help', '?': 'help' };
  const act = e => CODE[e.code] || KEY[(e.key || '').toLowerCase()];
  const mouse = { x: -99, y: -99, click: false, moved: false };
  const stick = { on: false, id: -1, ox: 0, oy: 0, x: 0, y: 0 };
  let padX = 0, padY = 0, touch = false; const padPrev = {};
  addEventListener('keydown', e => {
    const a = act(e); if (!a) return; e.preventDefault(); Snd.ensure();
    if (e.repeat) return; if (!down.has(a)) pressed.add(a); down.add(a);
  });
  addEventListener('keyup', e => { const a = act(e); if (a) down.delete(a); });
  addEventListener('blur', () => { down.clear(); stick.on = false; stick.x = stick.y = 0; });
  const toView = e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * VW / r.width, y: (e.clientY - r.top) * VH / r.height }; };
  cv.addEventListener('mousemove', e => { const p = toView(e); mouse.x = p.x; mouse.y = p.y; mouse.moved = true; });
  cv.addEventListener('mousedown', e => { const p = toView(e); mouse.x = p.x; mouse.y = p.y; mouse.click = true; Snd.ensure(); cv.focus(); e.preventDefault(); });
  cv.addEventListener('contextmenu', e => e.preventDefault());
  cv.addEventListener('touchstart', e => {
    e.preventDefault(); Snd.ensure(); touch = true;
    for (const t of e.changedTouches) {
      const p = toView(t);
      if (App.mode === 'play' && p.y > 30) {
        if (!stick.on && p.x < VW * 0.55) { stick.on = true; stick.id = t.identifier; stick.ox = p.x; stick.oy = p.y; stick.x = stick.y = 0; }
        else pressed.add('dash');
      } else { mouse.x = p.x; mouse.y = p.y; mouse.click = true; }
    }
  }, { passive: false });
  cv.addEventListener('touchmove', e => {
    e.preventDefault();
    for (const t of e.changedTouches) if (stick.on && t.identifier === stick.id) {
      const p = toView(t); let dx = (p.x - stick.ox) / 22, dy = (p.y - stick.oy) / 22; const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; }
      stick.x = l < 0.2 ? 0 : dx; stick.y = l < 0.2 ? 0 : dy;
    }
  }, { passive: false });
  const tend = e => { for (const t of e.changedTouches) if (t.identifier === stick.id) { stick.on = false; stick.x = stick.y = 0; } };
  cv.addEventListener('touchend', tend); cv.addEventListener('touchcancel', tend);
  let navX = 0, navY = 0;
  function poll() {                   // gamepad
    padX = padY = 0;
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const p of pads) {
      if (!p || !p.connected) continue;
      const dz = v => Math.abs(v) < 0.28 ? 0 : v, on = i => !!(p.buttons[i] && p.buttons[i].pressed);
      padX = dz(p.axes[0] || 0) + (on(15) ? 1 : 0) - (on(14) ? 1 : 0); padY = dz(p.axes[1] || 0) + (on(13) ? 1 : 0) - (on(12) ? 1 : 0);
      const edge = (i, ...acts) => { const o = on(i); if (o && !padPrev[i]) { for (const a of acts) pressed.add(a); Snd.ensure(); } padPrev[i] = o; };
      edge(0, 'ok', 'dash'); edge(1, 'back'); edge(2, 'dash'); edge(3, 'alt', 'reroll'); edge(9, 'pause');
      const nx = padX > 0.6 ? 1 : padX < -0.6 ? -1 : 0, ny = padY > 0.6 ? 1 : padY < -0.6 ? -1 : 0;
      if (nx !== navX) { navX = nx; if (nx) pressed.add(nx > 0 ? 'right' : 'left'); }
      if (ny !== navY) { navY = ny; if (ny) pressed.add(ny > 0 ? 'down' : 'up'); }
      break;
    }
  }
  return {
    down, pressed, mouse, stick, poll,
    get touch() { return touch; },
    hit: a => pressed.has(a),
    confirm: () => pressed.has('ok') || pressed.has('dash'),
    axis() { let x = (down.has('right') ? 1 : 0) - (down.has('left') ? 1 : 0) + padX + stick.x, y = (down.has('down') ? 1 : 0) - (down.has('up') ? 1 : 0) + padY + stick.y; const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; } return { x, y }; },
    endFrame() { pressed.clear(); mouse.click = false; mouse.moved = false; },
    inRect: (r) => mouse.x >= r.x && mouse.x < r.x + r.w && mouse.y >= r.y && mouse.y < r.y + r.h,
  };
})();
