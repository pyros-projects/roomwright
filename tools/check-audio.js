// Audio checks: every sound effect and every music track actually puts a signal on the master bus.
// This measures output level through an analyser; it cannot tell whether the result sounds good.
// Needs a running AudioContext, which browsers only start after a real key press (tools/check.sh
// sends one). It takes about a minute of real time, so it runs in the page's background: evaluating
// this file returns 'started'; poll window.RW_AUDIO.done, then read window.RW_AUDIO.out, which holds
// PASS/FAIL lines, or a single SKIP line when audio cannot run here.
(() => {
  const R = window.RW_AUDIO = { done: false, out: '' };
  (async () => {
  const out = [], ok = (n, c, i) => out.push((c ? 'PASS ' : 'FAIL ') + n + (i !== undefined ? ' (' + i + ')' : ''));
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const S = RW.Snd; S.ensure(); await sleep(150);
  if (!S.on) return 'SKIP audio: the AudioContext is not running (no key press yet, or no audio in this browser)';
  const v0 = { music: S.vol.music, sfx: S.vol.sfx };
  try {
    RW.manual(true);                                       // the game stops ticking, so nothing else makes a sound
    // quiet has to last longer than the music echo's delay (0.27s), or a gap between two echoes passes for silence
    const peak = S.probe(), settle = async () => { let quiet = 0; for (let i = 0; i < 400 && quiet < 14; i++) { await sleep(25); quiet = peak() > 0.002 ? 0 : quiet + 1; } return peak(); };
    S.music(null); S.vol.music = 0; S.vol.sfx = 0.8; S.applyVol(); await sleep(400);
    const q = await settle(); ok('silence is silent', q < 0.002, q.toFixed(4));
    /* ---- sound effects ---- */
    const dead = [], threw = [];
    for (const n of S.names) {
      await settle(); let p = 0;
      try { S.play(n, 3); } catch (e) { threw.push(n + ': ' + String(e).slice(0, 60)); continue; }
      for (let i = 0; i < 7; i++) { await sleep(22); p = Math.max(p, peak()); }
      if (p < 0.004) dead.push(n + ' ' + p.toFixed(4));
    }
    ok('no sound effect throws', threw.length === 0, threw.join('; ') || S.names.length + ' effects');
    ok('every sound effect is audible on the master bus', dead.length === 0, dead.join(', ') || 'ok');
    /* ---- music ---- */
    S.vol.sfx = 0; S.vol.music = 0.6; S.applyVol(); const mute = [];
    for (const tr of S.tracks) {
      S.music(null); await settle(); S.music(tr); let p = 0;
      for (let i = 0; i < 40; i++) { await sleep(25); p = Math.max(p, peak()); }
      if (p < 0.004) mute.push(tr + ' ' + p.toFixed(4));
    }
    ok('every music track plays', mute.length === 0, mute.join(', ') || S.tracks.join(' '));
    S.music(null); await settle();
    /* ---- volume and mute ---- */
    S.vol.sfx = 0; S.applyVol(); const base = await settle(); S.play('boom'); let p = 0; for (let i = 0; i < 6; i++) { await sleep(22); p = Math.max(p, peak()); }
    ok('sound effects at volume 0 are silent', p <= base + 0.002, p.toFixed(4) + ' vs ' + base.toFixed(4));
  } catch (e) { out.push('EXCEPTION ' + String(e && e.stack || e).slice(0, 400)); }
  S.vol.music = v0.music; S.vol.sfx = v0.sfx; S.applyVol(); S.music(null);
  try { RW.manual(false); RW.toTitle(); } catch (e) { /* ignore */ }
  return out.join('\n');
  })().then(s => { R.out = s; R.done = true; }, e => { R.out = 'EXCEPTION ' + String(e); R.done = true; });
  return 'started';
})()
