// Flow checks: first run, pause and options, drafting (step back, stairs), game over, the hero and deck
// screens, victory, endless, back to title. Driven purely by input actions.
// Run with tools/check.sh; returns one PASS/FAIL line per check.
(() => {
  const out = [], ok = (n, c, i) => out.push((c ? 'PASS ' : 'FAIL ') + n + (i !== undefined ? ' (' + i + ')' : ''));
  const press = (a, n = 3) => { RW.press(a); RW.step(n); };
  const until = (fn, max = 400) => { let n = 0; while (!fn() && n++ < max) RW.step(1); return n; };
  const saved = JSON.stringify(RW.Save.data);
  try {
    RW.manual(true);
    /* ---- very first run: title -> straight into play with the tutorial ---- */
    localStorage.removeItem(RW.Save.KEY); RW.Save.load(); RW.toTitle(); RW.step(30);
    ok('boots to the title', RW.App.mode === 'title');
    press('ok'); until(() => RW.App.mode === 'play');
    ok('first Enter starts a run with the tutorial', RW.App.mode === 'play' && RW.G.tut.step === 0 && RW.G.hero === 'pip', RW.App.mode);
    RW.hold('right', true); RW.step(60); RW.hold('right', false); ok('tutorial advances when you move', RW.G.tut.step === 1, RW.G.tut.step);
    /* ---- pause + options ---- */
    press('pause'); ok('P pauses', RW.App.mode === 'pause');
    const m0 = RW.Save.data.opts.music; press('down'); press('left'); ok('music volume steps down', RW.Save.data.opts.music < m0, m0 + '->' + RW.Save.data.opts.music);
    press('right'); ok('music volume steps up', Math.abs(RW.Save.data.opts.music - m0) < 1e-9);
    press('down'); press('down'); const sh0 = RW.Save.data.opts.shake; RW.step(30); press('ok'); ok('screen shake toggles', RW.Save.data.opts.shake !== sh0); press('ok');
    press('back'); ok('Esc resumes', RW.App.mode === 'play');
    press('mute'); ok('M mutes', RW.Save.data.opts.mute === 1 && RW.Snd.vol.sfx === 0); press('mute'); ok('M unmutes', RW.Save.data.opts.mute === 0 && RW.Snd.vol.sfx > 0);
    const old = RW.G; RW.step(120); press('pause'); for (let i = 0; i < 4; i++) press('down'); RW.step(30); press('ok'); RW.step(60);
    ok('restart run from pause', RW.App.mode === 'play' && RW.G !== old && RW.G.t < 1.5, 't=' + RW.G.t.toFixed(2));
    /* ---- drafting ---- */
    let G = RW.G, P = G.P; G.dir.calm = 1e9; G.dir.ti = 99; P.inv = 1e9; P.keys = 20;
    const d = G.sealed[0]; RW.openDraft(d); RW.step(30); const cards = G.draft.cards.map(c => c.type + c.boon.id).join(','), k0 = P.keys;
    press('back'); ok('Esc steps back from a draft for free', RW.App.mode === 'play' && P.keys === k0);
    RW.openDraft(d); RW.step(30); ok('the same door shows the same cards', G.draft.cards.map(c => c.type + c.boon.id).join(',') === cards, cards);
    press('right'); press('left'); press('c3'); ok('a number key picks a card', RW.App.mode === 'play' && G.rooms.length === 2 && P.keys === k0 - 1);
    RW.step(70); RW.openDraft(G.sealed[0]); RW.step(30); ok('no stairs before ' + RW.K.STAIRS_MIN + ' rooms', !G.draft.stairs); press('ok'); RW.step(70);
    for (let i = 0; i < 4; i++) { RW.openDraft(G.sealed[0]); RW.step(30); press('ok'); RW.step(70); }
    RW.openDraft(G.sealed[0]); RW.step(30); ok('the stairwell is offered after ' + RW.K.STAIRS_MIN + ' rooms', G.draft.stairs === true, G.fstat.rooms + ' drafted');
    press('down'); ok('DOWN focuses the stairwell', G.draft.onStairs === true); press('up'); ok('UP returns to the cards', G.draft.onStairs === false);
    press('down'); press('ok'); RW.step(80); ok('choosing it wakes the warden', RW.App.mode === 'play' && !!G.dir.boss && G.rooms.some(r => r.type === 'stairs'));
    /* ---- death -> game over -> try again ---- */
    P.inv = 0; P.shield = 0; RW.hurtPlayer(99); RW.step(130); ok('death leads to game over', RW.App.mode === 'over');
    RW.step(40); press('ok'); RW.step(60); ok('try again starts a fresh run', RW.App.mode === 'play' && RW.G.rooms.length === 1 && RW.G.P.hp === 8 && RW.G.floor === 0);
    /* ---- quit to title, then the hero and deck screens ---- */
    press('pause'); for (let i = 0; i < 5; i++) press('down'); RW.step(30); press('ok'); RW.step(60);
    ok('quit to title', RW.App.mode === 'title' && RW.G.rooms.length > 3, RW.G.rooms.length + ' showcase rooms');
    ok('the showcase never touches the save', Object.keys(RW.Save.data.rooms).length <= RW.STARTER_ROOMS.length + 1, Object.keys(RW.Save.data.rooms).length + ' cards');
    RW.step(30); press('ok'); ok('later runs go through the hero screen', RW.App.mode === 'prep', RW.App.mode);
    press('right'); ok('RIGHT shows the next delver', RW.App.prep.i === 1); RW.step(30); press('ok'); RW.step(30); ok('a locked delver cannot start', RW.App.mode === 'prep' && !RW.App.fade);
    press('alt'); ok('...nor open a deck', RW.App.mode === 'prep'); press('left');
    press('alt'); ok('Q opens the deck builder', RW.App.mode === 'deck');
    const deck0 = RW.deckFor('pip').join(','); press('ok'); ok('ENTER takes a card out', RW.deckFor('pip').length === RW.K.DECK_SIZE - 1, RW.deckFor('pip').length);
    press('ok'); ok('ENTER puts it back', RW.deckFor('pip').length === RW.K.DECK_SIZE);
    press('right'); press('down'); const cur = RW.App.deck.cur; ok('arrows move the cursor', cur === 10, cur);
    press('back'); ok('ESC returns with a full deck', RW.App.mode === 'prep' && RW.fullDeck('pip').length === RW.K.DECK_SIZE, deck0);
    RW.step(30); press('ok'); until(() => RW.App.mode === 'play'); ok('ENTER starts the run', RW.App.mode === 'play' && RW.G.hero === 'pip' && RW.G.deck.length === RW.K.DECK_SIZE);
    /* ---- win -> endless ---- */
    G = RW.G; P = G.P; RW.enterFloor(2); G.dir.calm = 1e9; RW.step(30); RW.summonBoss(null); RW.step(90); const b = G.dir.boss; b.emerge = 0; b.hp = 1; RW.hurtMon(b, 5, 0, 0, 0, 'room');
    ok('felling the last warden wins', G.won === true); until(() => RW.App.mode === 'win', 900);
    ok('the victory screen appears', RW.App.mode === 'win'); ok('the win is recorded and Moss unlocked', RW.Save.data.wins >= 1 && RW.Save.data.heroes.moss === 1 && RW.Save.data.best.floor === 3);
    RW.step(40); press('ok'); ok('keep delving resumes play', RW.App.mode === 'play' && G.endless && !G.won);
    P.inv = 1e9; G.dir.calm = 0; RW.step(60 * 45); ok('endless keeps the doors knocking', G.mons.length > 10, G.mons.length + ' monsters');
    RW.step(10); RW.render();
    /* ---- gamepad: a simulated pad exercises the mapping (not real hardware) ---- */
    const pad = { connected: true, axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false })) };
    Object.defineProperty(navigator, 'getGamepads', { value: () => [pad], configurable: true });
    const gstep = n => { for (let i = 0; i < n; i++) { RW.Input.poll(); RW.step(1); } };
    const tap = b => { pad.buttons[b].pressed = true; gstep(2); pad.buttons[b].pressed = false; gstep(2); };
    RW.start(77, { hero: 'pip' }); G = RW.G; P = G.P; G.tut.step = 9; G.dir.calm = 1e9; G.dir.ti = 99; P.inv = 1e9; P.keys = 9; gstep(5);
    let x0 = P.x; pad.axes[0] = 1; gstep(30); pad.axes[0] = 0; gstep(2); ok('pad: the stick moves you', P.x > x0 + 20, Math.round(P.x - x0) + 'px');
    x0 = P.x; pad.buttons[14].pressed = true; gstep(30); pad.buttons[14].pressed = false; gstep(2); ok('pad: so does the d-pad', P.x < x0 - 20, Math.round(P.x - x0) + 'px');
    const dc0 = P.dashCd; tap(2); ok('pad: X dashes', P.dashCd > dc0, P.dashCd.toFixed(2)); gstep(30);
    tap(9); ok('pad: Start pauses', RW.App.mode === 'pause', RW.App.mode); tap(1); ok('pad: B resumes', RW.App.mode === 'play', RW.App.mode);
    RW.openDraft(G.sealed[0]); gstep(30); const s0 = G.draft.sel; pad.axes[0] = 1; gstep(2); pad.axes[0] = 0; gstep(2); ok('pad: the stick moves between cards', G.draft.sel !== s0, s0 + '->' + G.draft.sel);
    tap(0); ok('pad: A builds the card', RW.App.mode === 'play' && G.rooms.length === 2, RW.App.mode + ', ' + G.rooms.length + ' rooms');
    RW.toTitle(); gstep(40); tap(0); gstep(40); ok('pad: A leaves the title', RW.App.mode === 'prep', RW.App.mode);
    gstep(30); tap(3); ok('pad: Y opens the deck builder', RW.App.mode === 'deck', RW.App.mode); tap(1); ok('pad: B closes it', RW.App.mode === 'prep', RW.App.mode);
    delete navigator.getGamepads;
  } catch (e) { out.push('EXCEPTION ' + String(e && e.stack || e).slice(0, 500)); }
  try { localStorage.setItem(RW.Save.KEY, saved); RW.Save.load(); RW.toTitle(); } catch (e) { /* ignore */ }
  return out.join('\n');
})()
