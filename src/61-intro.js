/* ========================== 15b INTRO CINEMATIC ======================= */
// intro.mp4 sits next to index.html (intro/build.sh makes it). Every boot plays it before the title, and the
// title offers it again (I, or the corner label). Enter, Space, Esc, a click or a tap skips it. Nothing about
// it is stored. Without the file, or in a browser that cannot play it, the game starts on the title as before.
//   index.html?intro=0   start on the title (the checks use this)
const Intro = (() => {
  let el = null, hint = null, src = 'intro.mp4';
  let state = 'off';                  // off | wait (loading, or held until a first key or tap) | play
  let t = 0, tPlay = 0, hintT = 0, stallT = 0, lastCT = -1, tries = 0;
  let gate = false, asking = false, failed = false, tap = false;
  const coarse = () => Input.touch || !!(window.matchMedia && matchMedia('(pointer: coarse)').matches);

  function load(file) {               // (re)create the player; its metadata tells us the film is there
    if (el) el.remove();
    src = file || src; failed = false; state = 'off';
    el = document.createElement('video');
    el.preload = 'metadata'; el.playsInline = true; el.setAttribute('playsinline', ''); el.setAttribute('webkit-playsinline', '');
    el.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100%;object-fit:contain;background:#0d0a1a;z-index:5;display:none;opacity:0;pointer-events:none;transition:opacity .35s';
    el.addEventListener('error', () => { failed = true; });
    el.addEventListener('ended', () => { if (state === 'play') finish(); });
    el.src = src; document.body.appendChild(el); vol();
  }
  // the film carries music and effects in one track, so it follows the louder of the two sliders
  function vol() { if (!el) return; const o = Save.data.opts; el.muted = !!o.mute; el.volume = clamp(Math.max(o.music / 0.6, o.sfx / 0.8) * 0.85, 0, 1); }
  function begin() {
    if (!el || failed) return false;
    state = 'wait'; t = 0; tries = 0; gate = false; asking = false; tap = false; stallT = 0;
    App.mode = 'intro'; Snd.music(null);
    el.preload = 'auto'; el.style.display = ''; el.style.opacity = 0;
    try { el.currentTime = 0; } catch (e) { /* nothing loaded yet */ }
    return true;
  }
  function start() {                  // ask the browser to play; it may refuse sound until a key or a tap
    if (asking || state !== 'wait') return; asking = true; vol();
    const ok = () => { asking = false; if (state !== 'wait') { try { el.pause(); } catch (e) { /* ignore */ } return; } state = 'play'; gate = false; tPlay = t; hintT = 3.5; lastCT = -1; el.style.opacity = 1; showHint(); };
    const no = e => { asking = false; if (e && e.name === 'NotAllowedError') gate = true; else if (!e || e.name !== 'AbortError') failed = true; };
    let p; try { p = el.play(); } catch (e) { no(e); return; }
    if (p && p.then) p.then(ok, no); else ok();
  }
  function stop() {                   // put the film away; it fades out over whatever comes next
    if (state === 'off') return;
    state = 'off'; gate = false; tap = false;
    try { el.pause(); } catch (e) { /* ignore */ }
    el.style.opacity = 0; if (hint) hint.style.opacity = 0;
    const gone = el; setTimeout(() => { if (state === 'off') gone.style.display = 'none'; }, 400);
  }
  function finish() { if (state === 'off') return; stop(); App.mode = 'title'; App.titleT = 0; Snd.music('title'); }   // back to the title
  function update(dt) {
    t += dt;
    if (failed) { finish(); return; }
    const skip = Input.confirm() || Input.hit('back') || Input.hit('intro') || tap; tap = false;
    if (state === 'wait') {
      if (!gate) { start(); if (t > 8) finish(); }                      // never arrived: go on without it
      else if (skip && !asking) { if (++tries > 1) finish(); else start(); }   // a gamepad is no gesture: one try, then move on
      return;
    }
    hintT -= dt; if (hint) hint.style.opacity = hintT > 0 ? 0.9 : 0;
    if (skip && t - tPlay > 0.6) { finish(); return; }
    const ct = el.currentTime;
    if (ct === lastCT && !el.paused) { stallT += dt; if (stallT > 5) finish(); } else { stallT = 0; lastCT = ct; }
  }
  function showHint() {               // the skip label, in the game's own lettering
    const s = coarse() ? 'TAP TO SKIP' : 'ENTER: SKIP';
    if (!hint) {
      hint = mkCanvas(1, 1); document.body.appendChild(hint);
      hint.style.cssText = 'position:fixed;left:auto;top:10px;right:10px;transform:none;z-index:6;opacity:0;pointer-events:none;transition:opacity .3s';
    }
    hint.width = textW(s) + 2; hint.height = 10; txo(hint.getContext('2d'), s, 1, 1, '#d8dbe6', '#1a1426');
    layout();
  }
  function layout() { if (hint) { const k = Math.max(2, Math.round(SCALE)); hint.style.width = hint.width * k + 'px'; hint.style.height = hint.height * k + 'px'; } }
  function hold(hidden) {             // the tab went away or came back
    if (state !== 'play') return;
    if (hidden) el.pause(); else { const p = el.play(); if (p && p.catch) p.catch(() => { state = 'wait'; gate = true; }); }
  }
  // Real events are the only place a browser lets a film start with sound, so the first key or tap is taken here.
  function gesture(e) {
    if (App.mode !== 'intro') return;
    if (state === 'wait' && gate) { if (e.type === 'keydown' && (e.metaKey || e.ctrlKey || e.altKey)) return; start(); }
    else if (state === 'play') { if (e.type === 'pointerdown') tap = true; else if (e.type === 'pointermove') hintT = Math.max(hintT, 2); }
  }
  for (const ev of ['keydown', 'pointerdown', 'pointerup', 'touchend', 'pointermove']) addEventListener(ev, gesture, true);

  return { load, begin, update, stop, finish, vol, layout, hold,
    get state() { return state; }, get gate() { return gate; }, get el() { return el; },
    get ok() { return !!el && !failed && el.readyState >= 1; } };
})();
const introWanted = () => new URLSearchParams(location.search).get('intro') !== '0';
function renderIntro(g) {             // under the film: black, or the prompt for the key that lets it start
  g.fillStyle = '#0d0a1a'; g.fillRect(0, 0, VW, VH);
  if (!Intro.gate) return;
  const cx = Math.round(VW / 2), cy = Math.round(VH / 2), touch = Input.touch || !!(window.matchMedia && matchMedia('(pointer: coarse)').matches);
  g.drawImage(App.big.key, cx - (App.big.key.width >> 1), cy - 24 + Math.round(Math.sin(frameT * 2.5) * 2));
  if (Math.floor(frameT * 2.2) & 1) txo(g, touch ? 'TAP TO BEGIN' : 'PRESS ANY KEY', cx, cy + 6, '#fff8e8', '#1a1426', 0.5);
}
