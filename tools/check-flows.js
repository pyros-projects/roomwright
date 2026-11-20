// Flow checks: first run, pause and options, drafting (step back, stairs), game over, the hero and deck
// screens, victory, endless, back to title. Driven purely by input actions.
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
    const old = RW.G; RW.step(120); press('pause'); for (let i = 0; i < 5; i++) press('down'); RW.step(30); press('ok'); RW.step(60);
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
    press('pause'); for (let i = 0; i < 6; i++) press('down'); RW.step(30); press('ok'); RW.step(60);
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
    } else out.push('SKIP touch checks: this browser has no Touch constructor');
  } catch (e) { out.push('EXCEPTION ' + String(e && e.stack || e).slice(0, 500)); }
  try { localStorage.setItem(RW.Save.KEY, saved); RW.Save.load(); RW.toTitle(); } catch (e) { /* ignore */ }
  return out.join('\n');
})()
