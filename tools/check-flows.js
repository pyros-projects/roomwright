// Flow checks: first run, pause and options, drafting (step back, stairs), game over, the title's entries, the
// changelog and the music player, the hero and deck screens, victory, endless, back to title. Driven purely by input actions.
// Run with tools/check.sh; returns one PASS/FAIL line per check.
(() => {
  const out = [], ok = (n, c, i) => out.push((c ? 'PASS ' : 'FAIL ') + n + (i !== undefined ? ' (' + i + ')' : ''));
  const press = (a, n = 3) => { RW.press(a); RW.step(n); };
  const until = (fn, max = 400) => { let n = 0; while (!fn() && n++ < max) RW.step(1); return n; };
  const saved = JSON.stringify(RW.Save.data);
  try {
    RW.manual(true); RW.coach(false);       // the card coach has its own section at the end
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
    const old = RW.G; RW.step(120); press('pause'); for (let i = 0; i < 6; i++) press('down'); RW.step(30); press('ok'); RW.step(60);
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
    press('pause'); for (let i = 0; i < 7; i++) press('down'); RW.step(30); press('ok'); RW.step(60);
    ok('quit to title', RW.App.mode === 'title' && RW.G.rooms.length > 3, RW.G.rooms.length + ' showcase rooms');
    ok('the showcase never touches the save', Object.keys(RW.Save.data.rooms).length <= RW.STARTER_ROOMS.length + 1, Object.keys(RW.Save.data.rooms).length + ' cards');
    /* ---- the pause menu's Music grows row (#17) ---- */
    { RW.start(77, { hero: 'pip' }); RW.step(30); press('pause'); for (let i = 0; i < 5; i++) press('down'); RW.step(30);
      const row = () => RW.pauseLayout().items[5], seq = [row().value];
      for (let i = 0; i < 3; i++) { press('ok'); seq.push(row().value + '=' + RW.Save.data.opts.grow); }
      ok('options: Music grows goes from NO to WITH THE PLAN to BY ELEMENT and round again', row().label === 'Music grows' && seq.join(' ') === 'NO WITH THE PLAN=plan BY ELEMENT=element NO=full', seq.join(' '));
      press('ok'); ok('options: the choice is saved', JSON.parse(localStorage.getItem(RW.Save.KEY)).opts.grow === 'plan', RW.Save.data.opts.grow);
      press('left'); ok('options: LEFT goes back a step', RW.Save.data.opts.grow === 'full', RW.Save.data.opts.grow);
      press('back'); RW.toTitle(); RW.step(30); }
    /* ---- the title's small entries, and the changelog ---- */
    { RW.step(30); const T = RW.titleLayout(), ci = T.findIndex(e => e.id === 'changes');
      ok('title: the changelog is one of its entries', ci >= 0, T.map(e => e.id).join(' '));
      press('right'); ok('title: RIGHT alone leaves the choice on START', RW.App.titleSel === '', RW.App.titleSel);
      press('down'); for (let i = 0; i < ci; i++) press('right');
      ok('title: DOWN steps into the entries and RIGHT moves along them', RW.App.titleSel === 'changes' && RW.App.mode === 'title', RW.App.titleSel);
      press('up'); ok('title: UP steps back out to START', RW.App.titleSel === '', RW.App.titleSel); press('down'); for (let i = 0; i < ci; i++) press('right');
      press('ok'); RW.step(30); ok('changelog: ENTER on its entry opens it', RW.App.mode === 'changes', RW.App.mode);
      ok('changelog: it begins with the version of this game', RW.CHANGES.length > 1 && RW.CHANGES[0].v === RW.K.VERSION, RW.CHANGES.map(c => c.v).join(' ') + ' for ' + RW.K.VERSION);
      const L = RW.changesLayout(); RW.hold('down', true); RW.step(30); RW.hold('down', false);
      ok('changelog: DOWN scrolls', L.max === 0 || RW.App.changes.y > 0, Math.round(RW.App.changes.y) + ' of ' + L.max);
      for (let i = 0; i < 20; i++) press('ok'); ok('changelog: it stops at its end', RW.App.changes.y === L.max && RW.App.mode === 'changes', Math.round(RW.App.changes.y));
      press('back'); ok('changelog: ESC goes back to the title, with the choice on START again', RW.App.mode === 'title' && RW.App.titleSel === '', RW.App.mode + ' ' + RW.App.titleSel);
      press('down'); press('back'); ok('title: ESC puts the choice back on START', RW.App.titleSel === '', RW.App.titleSel); }
    /* ---- the music player ---- */
    { RW.toTitle(); RW.step(40); const T = RW.titleLayout(), mi = T.findIndex(e => e.id === 'music'), S = RW.Snd;
      ok('title: the music player is one of its entries', mi >= 0, T.map(e => e.id).join(' '));
      press('down'); for (let i = 0; i < mi; i++) press('right'); press('ok'); RW.step(30);
      ok('music player: ENTER on its entry opens it', RW.App.mode === 'music', RW.App.mode);
      let L = RW.playerLayout(); const ids = k => L.items.filter(i => i.id.startsWith(k + ':')).map(i => i.id.split(':')[1]);
      ok('music player: it lists every track of the game', ids('track').sort().join() === S.tracks.slice().sort().join(), ids('track').join(' '));
      RW.Player.sel = 'track:cellar'; press('ok');
      ok('music player: ENTER on a track plays it', S.track === 'cellar' && RW.Player.track === 'cellar', S.track);
      L = RW.playerLayout(); ok('music player: a written piece shows its voices and the eight elements', ids('voice').length === S.info('cellar').voices.length && ids('el').length === 8, ids('voice').length + ' voices, ' + ids('el').length + ' elements');
      RW.Player.sel = 'voice:lead'; press('ok'); const off = !S.sounds('lead') && S.sounds('bass'); press('ok');
      ok('music player: a voice\'s switch turns it off, and on again', off && S.sounds('lead'), off + ' ' + S.sounds('lead'));
      RW.Player.sel = 'el:fire'; press('ok'); ok('music player: an element\'s switch turns its voice on', S.sounds('fire') && !S.sounds('fire+') && !S.sounds('frost'));
      RW.Player.sel = 'full'; press('ok'); ok('music player: "resonating" adds the second layer of the elements that are on', S.sounds('fire+') && !S.sounds('frost+'));
      RW.Player.sel = 'track:cellar'; press('right'); const a = RW.Player.sel; press('right'); press('right'); const b = RW.Player.sel;
      ok('music player: the arrows walk from the tracks to the voices and on to the elements', a.startsWith('voice:') && (b.startsWith('el:') || b === 'full'), a + ' ' + b);
      RW.Player.sel = 'track:title'; press('down'); ok('music player: DOWN moves along the tracks', RW.Player.sel === 'track:cellar', RW.Player.sel);
      { const walk = (from, keys) => { RW.Player.sel = from; for (const k of keys) press(k); return RW.Player.sel; };
        ok('music player: RIGHT keeps to the row across the columns', walk('track:kiln', ['right']) === 'voice:lead' && walk('el:steel', ['right']) === 'el:frost' && walk('voice:lead', ['right', 'right']) === 'el:steel', walk('track:kiln', ['right']) + ' ' + walk('el:steel', ['right']));
        ok('music player: the top row walks BACK, MUSIC, SOUNDS and steps down into the page', walk('back', ['right']) === 'tab:0' && walk('tab:0', ['left']) === 'back' && walk('tab:0', ['right']) === 'tab:1' && walk('back', ['down']) === 'track:title' && walk('track:title', ['up']) === 'back', walk('back', ['right']) + ' ' + walk('back', ['down']));
        ok('music player: "resonating" lies under both element columns', walk('el:steel', ['down']) === 'full' && walk('el:frost', ['down']) === 'full' && walk('full', ['up']) === 'el:steel' && walk('full', ['left']) === 'voice:bell', walk('full', ['left']));
        const reach = new Set(), todo = ['track:title']; while (todo.length) { const id = todo.pop(); if (reach.has(id)) continue; reach.add(id); for (const k of ['up', 'down', 'left', 'right']) todo.push(walk(id, [k])); }
        const all = RW.playerLayout().items.map(i => i.id); ok('music player: the arrows reach every item of the page', all.every(id => reach.has(id)), all.filter(id => !reach.has(id)).join(' ') || all.length + ' items'); }
      RW.Player.sel = 'track:boss'; press('ok'); L = RW.playerLayout(); ok('music player: a pattern track has its own voices and no element', S.track === 'boss' && ids('voice').join() === 'bass,drum,arp,lead' && ids('el').length === 0, ids('voice').join(' '));
      RW.Player.sel = 'voice:lead'; press('ok'); ok('music player: a pattern\'s voices switch too', !S.sounds('lead') && S.sounds('bass'));
      press('alt'); L = RW.playerLayout(); ok('music player: Q turns to the sounds, one entry for every effect', RW.Player.page === 1 && ids('fx').length === S.names.length, ids('fx').length + ' of ' + S.names.length);
      RW.Player.sel = 'fx:boom'; press('ok'); press('right'); ok('music player: a sound can be played and the arrows move among them, the track plays on', S.track === 'boss' && RW.Player.sel.startsWith('fx:') && RW.Player.sel !== 'fx:boom', RW.Player.sel);
      { const walk = (from, keys) => { RW.Player.sel = from; for (const k of keys) press(k); return RW.Player.sel; }, reach = new Set(), todo = ['fx:boom'];
        while (todo.length) { const id = todo.pop(); if (reach.has(id)) continue; reach.add(id); for (const k of ['up', 'down', 'left', 'right']) todo.push(walk(id, [k])); }
        const all = RW.playerLayout().items.map(i => i.id); ok('music player: the arrows reach every sound and stay in their row', all.every(id => reach.has(id)) && walk('fx:hit', ['right', 'left']) === 'fx:hit', all.filter(id => !reach.has(id)).join(' ') || all.length + ' items'); }
      const lost = []; for (const t of S.tracks) for (const v of S.info(t).voices) { const who = (RW.DANCERS[t] || {})[v]; if (!who || !(who === '@' || RW.SPR[who + '0'] || RW.SPR[who + 'D0'])) lost.push(t + ':' + v); }
      ok('music player: every voice of every track has a dancer', lost.length === 0, lost.join(' ') || 'ok');
      RW.render(); press('alt'); RW.render();
      press('back'); ok('music player: ESC goes back to the title, its tune and every voice', RW.App.mode === 'title' && S.track === 'title' && S.sounds('lead') && !S.sounds('fire'), RW.App.mode + ' ' + S.track);
      RW.step(30); }
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
    RW.toTitle(); gstep(40);
    { const ci = RW.titleLayout().findIndex(e => e.id === 'changes'); pad.axes[1] = 1; gstep(2); pad.axes[1] = 0; gstep(2); for (let i = 0; i < ci; i++) { pad.axes[0] = 1; gstep(2); pad.axes[0] = 0; gstep(2); }
      tap(0); gstep(20); ok('pad: the stick and A open the changelog', RW.App.mode === 'changes', RW.App.mode + ' sel ' + RW.App.titleSel);
      const L = RW.changesLayout(); pad.axes[1] = 1; gstep(30); pad.axes[1] = 0; gstep(2); ok('pad: the stick scrolls it', L.max === 0 || RW.App.changes.y > 0, Math.round(RW.App.changes.y));
      tap(1); ok('pad: B closes it, and the choice is START', RW.App.mode === 'title' && RW.App.titleSel === '', RW.App.mode + ' ' + RW.App.titleSel);
      gstep(30); const mi = RW.titleLayout().findIndex(e => e.id === 'music'); pad.axes[1] = 1; gstep(2); pad.axes[1] = 0; gstep(2); for (let i = 0; i < mi; i++) { pad.axes[0] = 1; gstep(2); pad.axes[0] = 0; gstep(2); }
      tap(0); gstep(30); ok('pad: the stick and A open the music player', RW.App.mode === 'music', RW.App.mode);
      pad.axes[1] = 1; gstep(2); pad.axes[1] = 0; gstep(2); tap(0); ok('pad: the stick chooses a track and A plays it', RW.Snd.track === 'cellar', RW.Snd.track + ' ' + RW.Player.sel);
      tap(3); ok('pad: Y turns the page', RW.Player.page === 1, RW.Player.page); tap(1); ok('pad: B leaves the music player', RW.App.mode === 'title' && RW.Snd.track === 'title', RW.App.mode); }
    gstep(30); tap(0); gstep(40); ok('pad: A leaves the title', RW.App.mode === 'prep', RW.App.mode);
    gstep(30); tap(3); ok('pad: Y opens the deck builder', RW.App.mode === 'deck', RW.App.mode); tap(1); ok('pad: B closes it', RW.App.mode === 'prep', RW.App.mode);
    delete navigator.getGamepads;
    /* ---- the card coach: lessons on the draft card itself ---- */
    RW.coach(true); localStorage.removeItem(RW.Save.KEY); RW.Save.load(); RW.start(7); G = RW.G; P = G.P; G.dir.calm = 1e9; G.dir.ti = 99; P.inv = 1e9; P.keys = 30; RW.step(30);
    const parts = () => G.draft && G.draft.coach ? G.draft.coach.steps.map(s => s.part).join(',') : 'none', tips = RW.Save.data.tips;
    RW.openDraft(G.sealed[0]); RW.step(40);
    ok('coach: the first draft walks through room, boon, doors and the Stairwell', parts() === 'room,boon,doors,bar', parts());
    ok('coach: the Stairwell bar is locked and counts the rooms it needs', G.draft.locked === RW.K.STAIRS_MIN && !G.draft.stairs && RW.stairsLocked() === RW.K.STAIRS_MIN, G.draft.locked);
    const r0 = G.rooms.length; press('ok', 30); press('ok', 30);
    ok('coach: Enter turns the pages and builds nothing', !!G.draft.coach && G.draft.coach.i === 2 && G.rooms.length === r0 && RW.App.mode === 'draft', G.rooms.length - r0);
    press('ok', 30); press('ok', 30);
    ok('coach: after the last page the draft is yours again', !G.draft.coach && tips.c_card === 1 && RW.App.mode === 'draft');
    press('ok', 30); until(() => RW.App.mode === 'play'); ok('coach: the next Enter builds the room', G.rooms.length === r0 + 1, G.rooms.length - r0);
    RW.openDraft(G.sealed[0]); RW.step(40);
    ok('coach: the walkthrough does not repeat', parts().indexOf('room,boon') < 0, parts());
    if (G.draft.coach) press('back', 10);
    ok('coach: the locked bar counts down', G.draft.locked === RW.K.STAIRS_MIN - 1, G.draft.locked);
    press('help', 10); ok('coach: H explains the selected card again', parts().indexOf('room') === 0 && parts().indexOf('boon') > 0, parts());
    press('back', 10); ok('coach: Esc closes the lesson, not the draft', !G.draft.coach && RW.App.mode === 'draft', RW.App.mode);
    const c0 = G.draft.cards[0], keep = [c0.lv, c0.lvTo]; delete tips.c_stars; c0.lv = 1; c0.lvTo = 2;
    let plan = RW.coachPlan(G.draft, false); ok('coach: a card that levels up teaches stars', plan.length === 1 && plan[0].id === 'c_stars' && plan[0].card === 0, plan.map(s => s.id).join(','));
    tips.c_stars = 1; plan = RW.coachPlan(G.draft, false); ok('coach: each lesson comes once', !plan.some(s => s.id === 'c_stars'), plan.map(s => s.id).join(','));
    c0.lv = keep[0]; c0.lvTo = keep[1];
    for (const r of RW.Input.pressed) RW.Input.pressed.delete(r);
    const box = RW.cardPart({ x: 100, y: 30, w: 124, h: 175 }, 'room'), box2 = RW.cardPart({ x: 100, y: 30, w: 124, h: 175 }, 'boon'), box3 = RW.cardPart({ x: 100, y: 30, w: 124, h: 175 }, 'doors');
    ok('coach: the three parts of a card do not overlap', box.y + box.h <= box2.y && box2.y + box2.h <= box3.y && box3.y + box3.h <= 30 + 175, [box.y + box.h, box2.y, box2.y + box2.h, box3.y].join(','));
    press('back', 10); G.fstat.rooms = RW.K.STAIRS_MIN; delete tips.c_stairs; RW.openDraft(G.sealed[0]); RW.step(40);
    ok('coach: the open Stairwell gets its own lesson', G.draft.stairs && parts() === 'bar' && G.draft.coach.steps[0].id === 'c_stairs', parts());
    press('ok', 30); ok('coach: and it is remembered', !G.draft.coach && tips.c_stairs === 1);
    press('back', 10); RW.coach(false); RW.openDraft(G.sealed[0]); RW.step(40); ok('coach: RW.coach(false) switches it off', !G.draft.coach); press('back', 10); RW.coach(true);
    delete tips.c_back; RW.openDraft(G.sealed[0]); RW.step(40); plan = RW.coachPlan(G.draft, false);
    ok('coach: a draft with nothing else new teaches the free step back and the knock back', plan.length === 1 && plan[0].id === 'c_back', plan.map(s => s.id).join(',')); press('back', 10);
    /* ---- knock back: a new hand behind a door, at a price ---- */
    RW.coach(false); RW.start(9); G = RW.G; P = G.P; G.dir.calm = 1e9; G.dir.ti = 99; P.inv = 1e9; P.keys = 5; RW.step(30);
    const kd = G.sealed[0], isElite = q => !!RW.MON[q.id].elite, count = id => kd.queue.filter(q => q.id === id).length;
    RW.openDraft(kd); RW.step(30); const hand = kd.cards, lim0 = RW.clockLimit(), picks0 = G.picks.length, kills0 = G.stats.kills; press('reroll', 1);
    ok('knock back: R closes the draft, keeps the key and deals a new hand', RW.App.mode === 'play' && P.keys === 5 && kd.cards !== hand && G.fstat.knocks === 1, RW.App.mode + ', keys ' + P.keys);
    ok('knock back: the first answer is a moderate pack: no elite, no dice, the clock untouched', kd.queue.length === 8 && !kd.queue.some(isElite) && !count('die') && !kd.queue.some(q => q.rage) && RW.clockLimit() === lim0, kd.queue.length + ' queued');
    RW.step(200); let called = G.mons.filter(m => m.noLoot);
    ok('knock back: the pack comes out of that door', called.length + G.stats.kills - kills0 >= 8, called.length + ' alive, ' + (G.stats.kills - kills0) + ' dead');
    called.forEach(m => RW.killMon(m)); RW.step(3);
    ok('knock back: its monsters carry no glints', G.picks.length === picks0, G.picks.length - picks0);
    RW.openDraft(kd); RW.step(30); press('reroll', 1);
    ok('knock back: the second one makes you pay: a bigger enraged pack, an elite, two dice, a shorter clock', kd.queue.length === 21 && kd.queue.filter(isElite).length === 1 && count('die') === 2 && kd.queue.every(q => q.rage) && RW.clockLimit() === lim0 - 30,
      kd.queue.length + ' queued, ' + count('die') + ' dice, clock ' + (RW.clockLimit() - lim0));
    RW.step(160); const die = G.mons.find(m => m.type === 'die'), b0 = G.ebullets.length;
    if (die) { die.x = P.x + 60; die.y = P.y; die.shootT = 0.05; G.ebullets.length = 0; RW.step(8); }
    ok('knock back: a die rolls and throws a ring of 8 to 18 bullets', !!die && G.ebullets.length >= 8 && G.ebullets.length <= 18 && G.ebullets.length % 2 === 0, die ? G.ebullets.length : 'no die came out');
    G.mons.forEach(m => RW.killMon(m)); G.ebullets.length = 0; kd.queue.length = 0; RW.step(3);
    RW.openDraft(kd); RW.step(30); press('reroll', 1);
    ok('knock back: from the third on a loaded die leads the pack', count('bigdie') === 1 && count('die') === 3 && kd.queue.filter(q => q.id === G.F.elite).length === 2 && RW.clockLimit() === lim0 - 75, kd.queue.length + ' queued, clock ' + (RW.clockLimit() - lim0));
    RW.step(120); const bigd = G.mons.find(m => m.type === 'bigdie'), mons0 = G.mons.length; if (bigd) { RW.killMon(bigd); RW.step(2); }
    ok('knock back: a loaded die breaks into two dice with no loot', !!bigd && G.mons.filter(m => m.type === 'die' && m.noLoot).length >= 2 && G.picks.length === picks0, bigd ? G.mons.length - mons0 : 'no loaded die');
    G.mons.forEach(m => RW.killMon(m)); kd.queue.length = 0; RW.step(3);
    RW.enterFloor(1); ok('knock back: a new floor forgives', G.fstat.knocks === 0 && G.fstat.wrath === 0 && RW.knockTier() === 0);
    /* ---- Stakes: a win opens a step for that delver, the hero screen sets it, the run plays at it ---- */
    const winNow = () => { G = RW.G; P = G.P; RW.enterFloor(2); G.dir.calm = 1e9; RW.step(30); RW.summonBoss(null); RW.step(90); const w = G.dir.boss; w.emerge = 0; w.hp = 1; RW.hurtMon(w, 5, 0, 0, 0, 'room'); until(() => RW.App.mode === 'win', 900); RW.step(40); };
    const toHeroes = () => { press('down'); press('down'); press('ok'); RW.step(60); press('ok'); RW.step(40); };   // from the victory screen: back to the title, on to the hero screen
    RW.coach(false); localStorage.removeItem(RW.Save.KEY); RW.Save.load(); RW.Save.data.runs = 3; RW.toTitle(); RW.step(40); press('ok'); RW.step(40);
    ok('stakes: before a first win the hero screen has no Stakes lines', RW.App.mode === 'prep' && RW.prepLayout('pip').sk === 0 && RW.stakesOpen('pip') === 0, RW.App.mode);
    press('up'); ok('stakes: and UP changes nothing', RW.stakeOf('pip') === 0);
    press('ok'); RW.step(60); ok('stakes: the plain game is step 0', RW.App.mode === 'play' && RW.G.stakes === 0, RW.App.mode + ' ' + RW.G.stakes);
    winNow(); ok('stakes: a win opens the first step for that delver and sets it', RW.App.mode === 'win' && RW.Save.data.stakes.pip === 0 && RW.stakesOpen('pip') === 1 && RW.stakeOf('pip') === 1 && RW.App.stakesNew === 1 && RW.stakesOpen('wick') === 0, JSON.stringify(RW.Save.data.stakes));
    toHeroes(); ok('stakes: the hero screen shows the Stakes lines now, in a taller panel', RW.App.mode === 'prep' && RW.prepLayout('pip').sk > 0 && RW.prepLayout('pip').h > 188 && RW.prepLayout('pip').h <= RW.view().VH, RW.App.mode + ' ' + RW.prepLayout('pip').h);
    press('down'); const stA = RW.stakeOf('pip'); press('down'); const stB = RW.stakeOf('pip'); press('up'); const stC = RW.stakeOf('pip'); press('up');
    ok('stakes: DOWN and UP move the step between none and the highest open', stA === 0 && stB === 0 && stC === 1 && RW.stakeOf('pip') === 1, [stA, stB, stC, RW.stakeOf('pip')].join(','));
    ok('stakes: the choice is saved', JSON.parse(localStorage.getItem(RW.Save.KEY)).stake.pip === 1);
    press('right'); press('up'); ok('stakes: a delver who has not won has none', RW.prepLayout('wick').sk === 0 && RW.stakeOf('wick') === 0); press('left');
    press('ok'); RW.step(60); ok('stakes: the run plays at the chosen step', RW.App.mode === 'play' && RW.G.stakes === 1 && RW.stake(1) && !RW.stake(2), RW.App.mode + ' ' + RW.G.stakes);
    press('pause'); ok('stakes: the pause menu has a line for the step', RW.App.mode === 'pause' && RW.pauseLayout().h === RW.pauseLayout().items.length * RW.pauseLayout().lh + 122 && RW.pauseLayout().h <= RW.view().VH, RW.pauseLayout().h);
    ok('stakes: with that line the pause menu still fits the smallest view', RW.pauseLayout(225).h <= 225 && RW.pauseLayout(225).rects.every(r => r.y >= 0 && r.y + r.h <= 225), RW.pauseLayout(225).h + ' of 225'); press('back');
    winNow(); ok('stakes: a win at step 1 opens step 2', RW.Save.data.stakes.pip === 1 && RW.stakesOpen('pip') === 2 && RW.stakeOf('pip') === 2 && RW.App.stakesNew === 2 && RW.record(true).stakes === 1, JSON.stringify(RW.Save.data.stakes));
    RW.Save.data.stake.pip = 0; RW.Save.store(); toHeroes(); press('ok'); RW.step(60); winNow();
    ok('stakes: a win below the highest step opens nothing new', RW.stakesOpen('pip') === 2 && RW.App.stakesNew === 0 && RW.stakeOf('pip') === 0);
    { const old = JSON.parse(localStorage.getItem(RW.Save.KEY)); delete old.stakes; delete old.stake; localStorage.setItem(RW.Save.KEY, JSON.stringify(old)); RW.Save.load(); }
    ok('stakes: a save from before Stakes that has won opens the first step for its delvers', RW.Save.data.wins > 0 && RW.stakesOpen('pip') === 1 && RW.stakeOf('pip') === 0, JSON.stringify(RW.Save.data.stakes));
    RW.Save.data.stakes.pip = 1; RW.Save.data.stake.pip = 0; RW.Save.store(); RW.toTitle(); RW.step(40);
    /* ---- mouse and touch: simulated events exercise the mapping (not a real hand). Last, because one touch
            switches the labels to their touch wording for the rest of the page's life. ---- */
    const cvs = document.getElementById('game'), V = RW.view(), cbox = cvs.getBoundingClientRect();
    const at = (vx, vy) => ({ clientX: cbox.left + vx * cbox.width / V.VW, clientY: cbox.top + vy * cbox.height / V.VH });
    const mouse = (type, vx, vy, button = 0, buttons = 1) => cvs.dispatchEvent(new MouseEvent(type, { ...at(vx, vy), button, buttons, bubbles: true, cancelable: true }));
    const fresh = () => { RW.start(77, { hero: 'pip' }); G = RW.G; P = G.P; G.tut.step = 9; G.dir.calm = 1e9; G.dir.ti = 99; P.inv = 1e9; P.keys = 9; RW.step(5); };
    const here = () => ({ x: P.x - G.cam.x, y: P.y - 8 - G.cam.y }), lead = RW.Input.lead, stick = RW.Input.stick;   // here: the delver on screen
    const settle = () => { mouse('mouseup', 0, 0, 0, 0); RW.step(90); };                // let go and let the camera catch up
    fresh(); settle(); let at0 = here(), px0 = P.x, py0 = P.y;
    ok('mouse: walking toward the pointer is the default', RW.Save.data.opts.mouse === 'point' && RW.pauseLayout().items[4].value === 'TO POINTER', RW.Save.data.opts.mouse);
    mouse('mousedown', at0.x + 60, at0.y); RW.step(30);
    ok('mouse: holding the left button walks toward the pointer', lead.on && P.x > px0 + 20 && Math.abs(P.y - py0) < 4, Math.round(P.x - px0) + ',' + Math.round(P.y - py0) + 'px');
    ok('mouse: nothing is drawn for it: no stick', !stick.on);
    ok('mouse: a press in a run is no click', RW.App.mode === 'play' && !RW.Input.mouse.click);
    at0 = here(); py0 = P.y; mouse('mousemove', at0.x, at0.y - 60); RW.step(30); ok('mouse: the walk follows the pointer', P.y < py0 - 20, Math.round(P.y - py0) + 'px');
    settle(); px0 = P.x; py0 = P.y; RW.step(20);
    ok('mouse: letting go stops', !lead.on && Math.hypot(P.x - px0, P.y - py0) < 1, Math.hypot(P.x - px0, P.y - py0).toFixed(1) + 'px');
    at0 = here(); mouse('mousedown', at0.x + 2, at0.y - 2); RW.step(30); ok('mouse: with the pointer on the delver it stands', lead.on && Math.hypot(P.x - px0, P.y - py0) < 1, Math.hypot(P.x - px0, P.y - py0).toFixed(1) + 'px');
    mouse('mousemove', at0.x + 60, at0.y, 0, 0); RW.step(2); ok('mouse: a release the page never saw still lets go', !lead.on);
    settle(); at0 = here(); px0 = P.x; mouse('mousedown', at0.x - 60, 8); RW.step(30); ok('mouse: a press on the top strip walks too', P.x < px0 - 10, Math.round(P.x - px0) + 'px');
    settle(); P.dashCd = 0; mouse('mousedown', V.VW / 2, V.VH * 0.6, 2, 2); RW.step(2); ok('mouse: the right button dashes', P.dashCd > 0, P.dashCd.toFixed(2)); mouse('mouseup', 0, 0, 2, 0);
    RW.step(40); RW.openDraft(G.sealed[0]); RW.step(40); let cr = RW.draftLayout().rects[1], rooms0 = G.rooms.length;
    mouse('mousedown', cr.x + cr.w / 2, cr.y + cr.h / 2); RW.step(3);
    ok('mouse: a click on a card still builds it, and starts no walk', RW.App.mode === 'play' && G.rooms.length === rooms0 + 1 && !lead.on && !stick.on, RW.App.mode + ', ' + G.rooms.length + ' rooms');
    ok('hints: keys and the pointer on a desk', /WASD/.test(RW.hintFor(0)) && /toward the pointer/.test(RW.hintFor(0)) && /SPACE/.test(RW.hintFor(5)), RW.hintFor(0));
    /* the other way to walk with a mouse: the pause menu's "Mouse walk" on DRAG makes the button a stick, as a finger has */
    settle(); RW.step(60); press('pause'); for (let i = 0; i < 4; i++) press('down'); RW.step(30); press('ok');
    ok('mouse: the pause menu switches the walk to DRAG and saves it', RW.Save.data.opts.mouse === 'drag' && JSON.parse(localStorage.getItem(RW.Save.KEY)).opts.mouse === 'drag' && RW.pauseLayout().items[4].value === 'DRAG', RW.Save.data.opts.mouse);
    press('back'); ok('hints: DRAG has its own words', /and drag/.test(RW.hintFor(0)), RW.hintFor(0));
    fresh(); RW.step(20);                 // a new run, back in the middle of the first room: the walks above ended at a wall
    const mx = V.VW / 2, my = V.VH * 0.6; px0 = P.x; mouse('mousedown', mx, my); mouse('mousemove', mx + 40, my); RW.step(30);
    ok('mouse, DRAG: holding and dragging walks, with the stick shown', stick.on && !lead.on && P.x > px0 + 20, Math.round(P.x - px0) + 'px');
    py0 = P.y; mouse('mousemove', mx, my - 40); RW.step(30); ok('mouse, DRAG: the drag steers', P.y < py0 - 20, Math.round(P.y - py0) + 'px');
    mouse('mouseup', mx, my - 40, 0, 0); RW.step(2); px0 = P.x; py0 = P.y; RW.step(20);
    ok('mouse, DRAG: letting go stops', !stick.on && Math.hypot(P.x - px0, P.y - py0) < 1, Math.hypot(P.x - px0, P.y - py0).toFixed(1) + 'px');
    mouse('mousedown', mx, my); mouse('mousemove', mx + 40, my); RW.step(5); mouse('mousemove', mx + 60, my, 0, 0); RW.step(2);
    ok('mouse, DRAG: a release the page never saw still lets go', !stick.on);
    press('pause'); for (let i = 0; i < 4; i++) press('down'); RW.step(30); press('ok'); press('back');
    ok('mouse: the pause menu switches back', RW.Save.data.opts.mouse === 'point' && RW.App.mode === 'play', RW.Save.data.opts.mouse);
    RW.toTitle(); RW.step(40); press('ok'); RW.step(40); { const L = RW.prepLayout('pip'), cx = V.VW / 2, cy = L.sy + 9; const seq = [];
      for (let i = 0; i < 3; i++) { mouse('mousedown', cx, cy); RW.step(3); mouse('mouseup', cx, cy, 0, 0); seq.push(RW.stakeOf('pip')); }
      ok('stakes, mouse: a click on the Stakes lines goes up a step, and from the top back to none', RW.App.mode === 'prep' && seq.join() === '1,2,0', seq.join()); }
    { RW.toTitle(); RW.step(40); const e = RW.titleLayout().find(t => t.id === 'changes');
      mouse('mousemove', e.x + e.w / 2, e.y + 9, 0, 0); RW.step(2); ok('mouse: pointing at a title entry chooses it', RW.App.titleSel === 'changes', RW.App.titleSel);
      mouse('mousemove', V.VW / 2, V.VH / 2, 0, 0); RW.step(2); ok('mouse: moving off it gives the choice back to START', RW.App.titleSel === '', RW.App.titleSel);
      mouse('mousemove', e.x + e.w / 2, e.y + 9, 0, 0); RW.step(2);
      mouse('mousedown', e.x + e.w / 2, e.y + 9); RW.step(3); mouse('mouseup', 0, 0, 0, 0); RW.step(20); ok('mouse: a click on it opens the changelog', RW.App.mode === 'changes', RW.App.mode);
      const L = RW.changesLayout(); cvs.dispatchEvent(new WheelEvent('wheel', { deltaY: 120, bubbles: true, cancelable: true })); RW.step(2);
      ok('mouse: the wheel scrolls it', L.max === 0 || RW.App.changes.y > 0, Math.round(RW.App.changes.y) + ' of ' + L.max);
      mouse('mousedown', L.back.x + 8, L.back.y + 9); RW.step(3); mouse('mouseup', 0, 0, 0, 0); ok('mouse: BACK closes it, and the choice is START', RW.App.mode === 'title' && RW.App.titleSel === '', RW.App.mode + ' ' + RW.App.titleSel); mouse('mousemove', V.VW / 2, V.VH / 2, 0, 0); RW.step(2);
      const click = r => { mouse('mousemove', r.x + r.w / 2, r.y + r.h / 2, 0, 0); RW.step(2); mouse('mousedown', r.x + r.w / 2, r.y + r.h / 2); RW.step(3); mouse('mouseup', 0, 0, 0, 0); RW.step(2); };
      const item = id => RW.playerLayout().items.find(i => i.id === id);
      RW.step(30); click(RW.titleLayout().find(t => t.id === 'music')); RW.step(30); ok('mouse: a click on the title entry opens the music player', RW.App.mode === 'music', RW.App.mode);
      click(item('track:garden')); ok('mouse: a click on a track plays it and the choice follows', RW.Snd.track === 'garden' && RW.Player.sel === 'track:garden', RW.Snd.track + ' ' + RW.Player.sel);
      click(item('voice:bass')); click(item('el:water')); ok('mouse: clicks on the switches set the voices', !RW.Snd.sounds('bass') && RW.Snd.sounds('water') && RW.Snd.sounds('lead'));
      click(item('tab:1')); ok('mouse: a click on SOUNDS turns the page', RW.Player.page === 1, RW.Player.page);
      click(item('back')); ok('mouse: BACK leaves the music player', RW.App.mode === 'title' && RW.Snd.track === 'title', RW.App.mode); mouse('mousemove', V.VW / 2, V.VH / 2, 0, 0); RW.step(2); }
    if (typeof Touch === 'function' && typeof TouchEvent === 'function') {
      const touch = (type, pts) => { const ts = pts.map(([id, vx, vy]) => new Touch({ identifier: id, target: cvs, ...at(vx, vy) })); cvs.dispatchEvent(new TouchEvent(type, { changedTouches: ts, touches: type === 'touchstart' || type === 'touchmove' ? ts : [], bubbles: true, cancelable: true })); };
      const lx = V.VW * 0.25, ly = V.VH * 0.7, rx = V.VW * 0.8, ry = V.VH * 0.6;
      fresh(); px0 = P.x; touch('touchstart', [[1, lx, ly]]); touch('touchmove', [[1, lx + 40, ly]]); RW.step(30);
      ok('touch: a drag on the left half walks', RW.Input.touch && RW.Input.stick.on && P.x > px0 + 20, Math.round(P.x - px0) + 'px');
      P.dashCd = 0; touch('touchstart', [[2, rx, ry]]); RW.step(2); ok('touch: a second finger dashes while the stick is held', P.dashCd > 0 && RW.Input.stick.on, P.dashCd.toFixed(2)); touch('touchend', [[2, rx, ry]]);
      ok('touch: lifting the second finger keeps the stick', RW.Input.stick.on);
      touch('touchend', [[1, lx + 40, ly]]); RW.step(20); px0 = P.x; RW.step(20);   // 20 steps first: the dash above is still carrying the delver
      ok('touch: lifting the finger stops', !RW.Input.stick.on && Math.abs(P.x - px0) < 1, 'stick ' + (RW.Input.stick.on ? 'held' : 'free') + ', ' + (P.x - px0).toFixed(1) + 'px');
      RW.step(40); P.dashCd = 0; touch('touchstart', [[3, rx, ry]]); RW.step(2); ok('touch: a tap on the right half dashes', P.dashCd > 0 && !RW.Input.stick.on, P.dashCd.toFixed(2)); touch('touchend', [[3, rx, ry]]);
      ok('hints: a finger gets its own words', !/WASD|SPACE|mouse|click/.test(RW.hintFor(0) + RW.hintFor(5)) && /Drag/.test(RW.hintFor(0)) && /Tap/.test(RW.hintFor(5)), RW.hintFor(0) + ' / ' + RW.hintFor(5));
      RW.step(40); touch('touchstart', [[4, V.VW / 2 + 51, 11]]); RW.step(2); touch('touchend', [[4, V.VW / 2 + 51, 11]]); ok('touch: the pause mark pauses', RW.App.mode === 'pause', RW.App.mode);
      RW.step(30); const res = RW.pauseLayout().rects[0]; touch('touchstart', [[5, res.x + res.w / 2, res.y + res.h / 2]]); RW.step(2); touch('touchend', [[5, 0, 0]]); ok('touch: a tap on Resume resumes', RW.App.mode === 'play', RW.App.mode);
      RW.step(20); RW.openDraft(G.sealed[0]); RW.step(40); rooms0 = G.rooms.length; touch('touchstart', [[6, 3, V.VH - 3]]); RW.step(2); touch('touchend', [[6, 0, 0]]);
      ok('touch: a tap beside the cards steps back', RW.App.mode === 'play' && G.rooms.length === rooms0, RW.App.mode);
      RW.step(70); RW.openDraft(G.sealed[0]); RW.step(40); cr = RW.draftLayout().rects[0]; touch('touchstart', [[7, cr.x + cr.w / 2, cr.y + cr.h / 2]]); RW.step(3); touch('touchend', [[7, 0, 0]]);
      ok('touch: a tap on a card builds it, and starts no stick', RW.App.mode === 'play' && G.rooms.length === rooms0 + 1 && !RW.Input.stick.on, RW.App.mode + ', ' + G.rooms.length + ' rooms');
      { RW.toTitle(); RW.step(40); const e = RW.titleLayout().find(t => t.id === 'changes'); touch('touchstart', [[10, e.x + e.w / 2, e.y + 9]]); RW.step(3); touch('touchend', [[10, 0, 0]]); RW.step(20);
        ok('touch: a tap on the title entry opens the changelog', RW.App.mode === 'changes', RW.App.mode);
        const L = RW.changesLayout(); touch('touchstart', [[11, L.lower.x + L.lower.w / 2, L.lower.y + L.lower.h / 2]]); RW.step(3); touch('touchend', [[11, 0, 0]]);
        ok('touch: a tap on the lower half of the text reads on', L.max === 0 || RW.App.changes.y > 0, Math.round(RW.App.changes.y) + ' of ' + L.max);
        touch('touchstart', [[12, L.back.x + 8, L.back.y + 9]]); RW.step(3); touch('touchend', [[12, 0, 0]]); ok('touch: BACK closes it', RW.App.mode === 'title', RW.App.mode);
        const tapOn = r => { touch('touchstart', [[13, r.x + r.w / 2, r.y + r.h / 2]]); RW.step(3); touch('touchend', [[13, 0, 0]]); RW.step(2); }, item = id => RW.playerLayout().items.find(i => i.id === id);
        RW.step(30); tapOn(RW.titleLayout().find(t => t.id === 'music')); RW.step(30); ok('touch: a tap on the title entry opens the music player', RW.App.mode === 'music', RW.App.mode);
        tapOn(item('track:kiln')); const chose = RW.Player.sel; tapOn(item('voice:drum')); ok('touch: taps play a track and set a switch, and the choice follows the tap', RW.Snd.track === 'kiln' && chose === 'track:kiln' && !RW.Snd.sounds('drum') && RW.Snd.sounds('bass'), RW.Snd.track + ' ' + chose);
        tapOn(item('back')); ok('touch: BACK leaves the music player', RW.App.mode === 'title' && RW.Snd.track === 'title', RW.App.mode); }
      RW.toTitle(); RW.step(40); touch('touchstart', [[8, V.VW / 2, V.VH / 2]]); RW.step(3); touch('touchend', [[8, 0, 0]]); RW.step(40);
      { const L = RW.prepLayout('pip'), cx = V.VW / 2, cy = L.sy + 9, seq = []; for (let i = 0; i < 3; i++) { touch('touchstart', [[9, cx, cy]]); RW.step(3); touch('touchend', [[9, 0, 0]]); seq.push(RW.stakeOf('pip')); }
        ok('stakes, touch: a tap on the Stakes lines does the same', RW.App.mode === 'prep' && seq.join() === '1,2,0', RW.App.mode + ' ' + seq.join()); }
    } else out.push('SKIP touch checks: this browser has no Touch constructor');
  } catch (e) { out.push('EXCEPTION ' + String(e && e.stack || e).slice(0, 500)); }
  try { localStorage.setItem(RW.Save.KEY, saved); RW.Save.load(); RW.toTitle(); } catch (e) { /* ignore */ }
  return out.join('\n');
})()
