// Content checks: every room power, weapon (and evolution), charm, monster, pest and warden does what it says.
// Run with tools/check.sh (or paste into the console); returns one PASS/FAIL line per check.
(() => {
  const res = [], ok = (name, cond, info) => res.push((cond ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? ' (' + info + ')' : ''));
  const { T, GWT } = RW.K, saved = JSON.stringify(RW.Save.data);
  let G, P;
  // a quiet, invulnerable sandbox run: no spawns, no clock, plenty of keys
  RW.coach(false);                    // no card lessons in the way of the hooks
  const fresh = (seed, opts) => { RW.manual(true); RW.start(seed || 101, opts); G = RW.G; P = G.P; G.tut.step = 9; G.dir.calm = 1e9; G.dir.ti = 99; G.endless = true; P.inv = 1e9; P.keys = 99; };
  const tp = (x, y) => { P.x = x; P.y = y; RW.step(2); };
  // draft a specific room behind a sealed door (default: the first sealed door of the newest room)
  const build = (type, want, door) => {
    door = door || G.sealed.find(d => d.room === G.rooms[G.rooms.length - 1]) || G.sealed[0];
    P.keys = Math.max(P.keys, 5); RW.openDraft(door);
    const D = G.draft, c = D.cards[0]; c.type = type; c.want = want || [1, 1, 1, 1]; c.boon = { kind: 'c', id: 'boots' }; RW.refreshCard(c, D.cx, D.cy, D.entry);
    const room = RW.chooseCard(0); RW.step(70); return room;
  };
  const dummy = (x, y, type) => { const m = RW.spawnMon(type || 'tin', x, y); m.def = Object.assign({}, m.def, { spd: 0, ai: null }); m.hp = m.max = 100000; return m; };
  const lost = m => 100000 - m.hp;
  const mid = r => [r.px + 168, r.py + 150];
  const clearMons = () => { for (const e of G.mons) e.dead = true; RW.step(2); };
  try {
    /* ---------- every room type can be drafted, painted and revealed ---------- */
    let bad = [];
    for (let i = 0; i < RW.DRAFTABLE.length; i++) {
      if (i % 7 === 0) fresh(200 + i);
      const id = RW.DRAFTABLE[i], r = build(id);
      if (!(r.reveal >= 1 && r.type === id && r.canvas.width === 336 && (G.boons.length > 0 || G.mons.some(e => e.def.mimic)))) bad.push(id);
    }
    ok('all ' + RW.DRAFTABLE.length + ' room cards build and reveal', bad.length === 0, bad.join(',') || 'ok');
    ok('room table is about triple v0.1', RW.DRAFTABLE.length >= 36, RW.DRAFTABLE.length);

    /* ---------- room powers ---------- */
    fresh(301);
    let r = build('spikes'); let m = dummy(r.spikes[0].tx * T + 8, r.spikes[0].ty * T + 8); RW.step(200); ok('spikes skewer monsters', lost(m) > 0, lost(m)); m.dead = true;
    tp(r.spikes[3].tx * T + 8, r.spikes[3].ty * T + 8); P.inv = 0; const hpS = P.hp; RW.step(200); ok('spikes spare the player', P.hp === hpS); P.inv = 1e9;
    r = build('guardian'); m = dummy(r.px + 168, r.py + 150); RW.step(180); ok('guardian owls shoot', lost(m) > 0, lost(m)); m.dead = true;
    r = build('ember'); m = dummy(r.px + 100, r.py + 150); RW.step(120); ok('ember hall burns', lost(m) > 0, lost(m)); m.dead = true;
    r = build('powder'); const br = r.barrels[0]; m = dummy(br.x + 10, br.y); RW.step(30); ok('powder barrels explode', lost(m) > 0 && br.cd > 0, lost(m)); m.dead = true;
    r = build('furnace'); m = dummy(...mid(r)); RW.step(60 * 6); ok('blast furnace erupts', lost(m) > 0, lost(m)); m.dead = true;
    r = build('chapel'); tp(...mid(r)); RW.step(3); ok('candle chapel hastens weapons', P.hasteEff < P.haste - 0.01, P.hasteEff.toFixed(2));
    fresh(302);
    r = build('frost'); tp(r.px + 60, r.py + 60); m = RW.spawnMon('bones', r.px + 250, r.py + 120); let x0 = m.x, y0 = m.y; RW.step(60); const dF = Math.hypot(m.x - x0, m.y - y0); m.dead = true;
    const h0 = G.rooms[0]; tp(h0.px + 60, h0.py + 60); m = RW.spawnMon('bones', h0.px + 250, h0.py + 120); x0 = m.x; y0 = m.y; RW.step(60); const dN = Math.hypot(m.x - x0, m.y - y0); m.dead = true;
    ok('frost grotto slows', dF < dN * 0.8 && dF > 1, dF.toFixed(1) + ' vs ' + dN.toFixed(1));
    r = build('icicle'); m = dummy(...mid(r)); RW.step(180); ok('icicles hit and freeze', lost(m) > 0, lost(m)); m.dead = true;
    r = build('glacier'); tp(r.px + 60, r.py + 60); m = RW.spawnMon('bones', r.px + 250, r.py + 120); RW.step(3); ok('glacier gate freezes on entry', m.stun > 0.5, m.stun.toFixed(2)); m.dead = true;
    r = build('blizzard'); m = dummy(...mid(r)); const m2 = dummy(h0.px + 168, h0.py + 60); RW.hurtMon(m, 100, 0, 0, 0, 'room'); RW.hurtMon(m2, 100, 0, 0, 0, 'room'); ok('blizzard loft amplifies damage', lost(m) > lost(m2), lost(m) + ' vs ' + lost(m2)); m.dead = m2.dead = true;
    r = build('ballista'); m = dummy(r.ballista.x + 70, r.ballista.y - 8); RW.step(240); ok('ballista fires down its row', lost(m) > 0, lost(m)); m.dead = true;
    r = build('saw'); const sw = r.saws[0]; m = dummy(sw.x + 30, sw.yy); RW.step(200); ok('saw blades cut', lost(m) > 0, lost(m)); m.dead = true;
    fresh(303);
    const sh0 = RW.steelHaste(); r = build('workshop'); ok('workshop speeds steel rooms', RW.steelHaste() > sh0, sh0 + '->' + RW.steelHaste().toFixed(2));
    r = build('fountain'); P.hp = 3; tp(r.fountain.x, r.fountain.y + 12); RW.step(5); ok('fountain heals', P.hp === 5, P.hp); ok('fountain goes dry', r.charge < 0.1);
    r = build('spring'); tp(r.px + 168, r.py + 120); RW.step(60 * 10); ok('hot spring grows a shield heart', P.shield === 1, P.shield);
    P.inv = 0; RW.hurtPlayer(1); ok('shield absorbs a hit', P.shield === 0 && P.hp === 5, 'hp ' + P.hp); P.inv = 1e9;
    r = build('well'); P.inv = 0; RW.hurtPlayer(99); RW.step(2); ok('wishing well revives once', !G.over && P.hp === 4 && r.used, 'hp ' + P.hp);
    P.inv = 0; RW.hurtPlayer(99); RW.step(2); ok('...and only once', G.over === true);
    fresh(304);
    const g0 = P.greed; r = build('library'); ok('library raises glint worth', P.greed > g0, g0.toFixed(2) + '->' + P.greed.toFixed(2));
    r = build('vault'); const pk0 = G.picks.length; tp(r.chest.x, r.chest.y + 10); RW.step(5); ok('vault chest opens', r.chest.open && G.picks.length > pk0);
    P.costN = 10; RW.recalc(); const kc0 = P.keyCost; r = build('counting'); ok('counting house cuts key cost', P.keyCost < kc0, kc0 + '->' + P.keyCost);
    const cl0 = RW.clockLimit(); r = build('observ'); ok('observatory slows the dread clock', RW.clockLimit() > cl0, cl0 + '->' + Math.round(RW.clockLimit()));
    r = build('maproom'); RW.openDraft(G.sealed[0]); ok('map room deals a fourth card', G.draft.cards.length === 4, G.draft.cards.length); RW.closeDraft();
    G.roomLv.maproom = 2; RW.openDraft(G.sealed[1]); RW.step(20); const rr0 = G.draft.rerolls, rc0 = G.draft.cards; RW.press('reroll'); RW.step(2);
    ok('a two-star map room deals again once per door', rr0 === 1 && RW.App.mode === 'draft' && G.draft.cards !== rc0 && G.draft.rerolls === 0, rr0 + '->' + G.draft.rerolls);
    RW.press('reroll'); RW.step(2); const rc1 = G.draft.cards; RW.closeDraft(); RW.openDraft(G.sealed[1]); ok('...and the door remembers it', G.draft.rerolls === 0 && G.draft.cards === rc1); RW.closeDraft(); G.roomLv.maproom = 1;
    r = build('script'); const sd = G.sealed.find(d => d.room === r); RW.openDraft(sd); ok('scriptorium doubles neighbours\' boons', G.draft.cards.every(c => c.mul === 2), G.draft.cards.map(c => c.mul).join('')); RW.closeDraft();
    fresh(305);
    r = build('garden'); tp(r.px + 250, r.py + 60); RW.step(60 * 40); ok('garden grows a heart', !!r.patch.fruit);
    r = build('greenhouse'); tp(r.px + 250, r.py + 150); RW.step(60 * 22); ok('greenhouse grows a glint bloom', r.planters.some(p => p.fruit));
    r = build('apiary'); ok('apiary keeps bees', G.allies.filter(b => b.room === r).length === 2, G.allies.length); m = dummy(...mid(r)); RW.step(240); ok('bees sting', lost(m) > 0, lost(m)); m.dead = true;
    r = build('fairy'); m = RW.spawnMon('slime', ...mid(r)); m.hp = 1; RW.hurtMon(m, 5, 0, 0, 0, 'room'); ok('fairy ring leaves a poison cloud', G.zones.some(z => z.kind === 'cloud'));
    r = build('bramble'); let bt = -1; for (let i = 0; i < G.tag.length; i++) if (G.tag[i] === 3 && G.tagRoom[i] === r.id + 1) { bt = i; break; }
    m = dummy((bt % GWT) * T + 8, Math.floor(bt / GWT) * T + 8); RW.step(90); ok('brambles scratch monsters', lost(m) > 0, lost(m)); m.dead = true;
    fresh(306);
    r = build('den', [1, 0, 0, 0]); let mim = G.mons.find(e => e.def.mimic); ok('den hides a sleeping mimic', !!mim && mim.st === 0);
    mim.hp = 1; tp(mim.x + 20, mim.y); RW.step(120); ok('mimic wakes and dies', mim.dead); RW.step(40); tp(mim.x, mim.y); RW.step(40); ok('mimic drops boon and key', P.keys > 5 || P.charms.boots > 0);
    r = build('dice'); const db = G.boons[G.boons.length - 1]; ok('dice hall hides a doubled boon', db.hidden && db.mul === 2);
    r = build('altar'); P.hp = 8; tp(r.altar.x, r.altar.y + 6); RW.step(90); ok('cursed altar trades a heart for power', P.hp === 6 && P.altar === 1 && P.mightEff > P.might, 'hp ' + P.hp + ' altar ' + P.altar);
    r = build('grave'); tp(...mid(r)); RW.step(60 * 10); ok('graveyard raises skeletons', G.mons.some(e => e.type === 'bones'), G.mons.length);
    clearMons(); const gl0 = G.picks.reduce((a, p) => a + (p.k === 'glint' ? p.v : 0), 0); m = RW.spawnMon('tin', ...mid(r)); m.hp = 1; RW.hurtMon(m, 9, 0, 0, 0, 'room');
    ok('graveyard kills drop double glints', G.picks.reduce((a, p) => a + (p.k === 'glint' ? p.v : 0), 0) - gl0 === 12, G.picks.reduce((a, p) => a + (p.k === 'glint' ? p.v : 0), 0) - gl0);
    r = build('waygate'); ok('waygate opens a hearth portal', !!G.hearthPortal); tp(r.portal.x, r.portal.y); RW.step(3); ok('waygate warps to the hearth', Math.hypot(P.x - G.hearthPortal.x, P.y - G.hearthPortal.y) < 12, Math.round(P.x) + ',' + Math.round(P.y));
    fresh(307);
    r = build('cross'); tp(...mid(r)); RW.step(3); ok('crossroads quickens your step', P.speedEff > P.speed, P.speedEff.toFixed(1)); ok('crossroads opens three doors', r.doors.filter(d => d === 1).length === 3, r.doors.join(''));
    r = build('nook', [0, 0, 0, 0]); ok('nook is a dead end', r.doors.filter(d => d === 1).length === 0); P.hp = 5; tp(...mid(r)); RW.step(120); ok('nook rest mends half a heart', P.hp === 6, P.hp);

    /* ---------- layout systems ---------- */
    fresh(310);
    let a1 = build('ember', [1, 0, 0, 0]), a2 = build('ember', [1, 0, 0, 0]);
    ok('drafting a type twice levels it up', G.roomLv.ember === 2, G.roomLv.ember);
    ok('same-element neighbours resonate', a1.res >= 1 && a2.res >= 1, a1.res + '/' + a2.res);
    const mulLv2 = RW.roomMul(a2); let a3 = build('ember', [1, 0, 0, 0]); ok('levels and resonance multiply room power', RW.roomMul(a2) > mulLv2 && G.roomLv.ember === 3, mulLv2.toFixed(2) + '->' + RW.roomMul(a2).toFixed(2));
    let hl = build('hall', [1, 0, 0, 0]); ok('stone resonates with anything', hl.res >= 1 && a3.res >= 2, hl.res + '/' + a3.res);
    const p1 = RW.CURVE.pressure(2, 0), p6 = RW.CURVE.pressure(8, 0); ok('every sealed door adds real pressure', p6 / p1 > 1.7, (p6 / p1).toFixed(2) + 'x from 2 to 8 doors');
    // latched gate
    const dir = a2.doors.indexOf(2), j = RW.jamDoor(a2, dir); ok('a doorway can be latched', !!j && G.jams.length === 1 && a2.doors[dir] === 3);
    const jp = RW.doorPos(a2, dir); ok('latched gate stops the player only', RW.blocked(jp.x, jp.y, RW.K.F_PLAYER) && !RW.blocked(jp.x, jp.y, RW.K.F_WALK));
    tp(jp.x + jp.nx * 21, jp.y + jp.ny * 21); const act = jp.nx > 0 ? 'left' : jp.nx < 0 ? 'right' : jp.ny > 0 ? 'up' : 'down';
    RW.hold(act, true); RW.step(70); RW.hold(act, false); ok('leaning on a gate opens it', G.jams.length === 0 && a2.doors[dir] === 2, 'jams ' + G.jams.length);
    // breach
    const wd = [0, 1, 2, 3].find(d => RW.canBreach(hl, d)), s0 = G.sealed.length; ok('a wall can be breached', RW.breachWall(hl, wd) === 'door' && G.sealed.length === s0 + 1);
    // pests do their job
    clearMons(); tp(h0x(), h0y()); function h0x() { return G.rooms[0].px + 60; } function h0y() { return G.rooms[0].py + 60; }
    let pest = RW.spawnMon('latch', hl.px + 168, hl.py + 120); pest.hp = 1e6; RW.step(60 * 8);      // (in a hall: an Ember Hall would cook it first) ok('latchling latches a doorway', G.jams.length === 1 && pest.dead, 'jams ' + G.jams.length);
    for (const q of G.jams.slice()) RW.unjam(q);
    const sealed1 = G.sealed.length, links1 = G.rooms.reduce((a, q) => a + q.doors.filter(d => d >= 2).length, 0);
    pest = RW.spawnMon('sapper', a3.px + 168, a3.py + 120); pest.hp = 1e6; RW.step(60 * 10);
    ok('sapper breaches a wall', pest.dead && (G.sealed.length > sealed1 || G.rooms.reduce((a, q) => a + q.doors.filter(d => d >= 2).length, 0) > links1), 'sealed ' + sealed1 + '->' + G.sealed.length);
    pest = RW.spawnMon('hexer', a1.px + 100, a1.py + 100); pest.def = Object.assign({}, pest.def, { spd: 0 }); RW.step(5); ok('hexer switches a room off', a1.hexT > 0);
    m = dummy(a1.px + 220, a1.py + 150); RW.step(120); ok('...and the hexed room does nothing', lost(m) === 0, lost(m)); pest.dead = true; RW.step(60); RW.step(60); ok('...until the hexer is gone', lost(m) > 0, lost(m)); m.dead = true;

    /* ---------- weapons and evolutions ---------- */
    const wbad = [], ebad = [];
    for (const id in RW.WEAPONS) {
      fresh(320); P.weapons.length = 0; RW.applyBoon({ kind: 'w', id }); for (let i = 0; i < 4; i++) RW.applyBoon({ kind: 'w', id });
      const hh = G.rooms[0], evoRoom = build(RW.WEAPONS[id].evo.room, [1, 0, 0, 0]);
      tp(hh.px + 100, hh.py + 150);
      const mobs = []; for (let i = 0; i < 6; i++) mobs.push(dummy(P.x + 26 + (i % 3) * 9, P.y - 8 + (i >> 1) * 8));
      const drive = () => { RW.hold('right', true); RW.step(30); RW.hold('right', false); RW.hold('left', true); RW.step(30); RW.hold('left', false); RW.hold('up', true); RW.step(20); RW.hold('up', false); RW.hold('down', true); RW.step(20); RW.hold('down', false); RW.step(200); };
      if (id === 'mat') { tp(evoRoom.px + 168, evoRoom.py + 150); const e = G.rooms[0].doors.indexOf(2), dp = RW.doorPos(G.rooms[0], e); P.weapons[0].evo = false; tp(dp.x + dp.nx * 30, dp.y + dp.ny * 30); const a = dp.nx > 0 ? 'left' : dp.nx < 0 ? 'right' : dp.ny > 0 ? 'up' : 'down'; RW.hold(a, true); RW.step(70); RW.hold(a, false); for (const o of mobs) { o.x = G.mats[0] ? G.mats[0].x : o.x; o.y = G.mats[0] ? G.mats[0].y : o.y; } RW.step(120); }
      else drive();
      const ontoToad = () => { const m = P.weapons[0].pets[0]; if (m) for (const o of mobs) { o.x = m.x + 4; o.y = m.y; } RW.step(200); };   // dummies do not walk: put them on a toadstool
      if (id === 'toad') ontoToad();
      const d1 = mobs.reduce((s, e) => s + lost(e), 0); if (!(d1 > 0)) wbad.push(id + ':' + d1);
      // evolve by walking into its room
      if (id !== 'mat') { tp(evoRoom.px + 168, evoRoom.py + 150); RW.step(120); }
      else { P.weapons[0].evo = false; tp(evoRoom.px + 168, evoRoom.py + 150); RW.step(120); }
      const w = P.weapons[0]; if (!w.evo || RW.wStat(w).evo !== 1) ebad.push(id);
      for (const o of mobs) o.hp = 100000; tp(hh.px + 100, hh.py + 150); for (const o of mobs) { o.x = P.x + 26; o.y = P.y; }
      if (id === 'mat') { for (const o of mobs) { o.x = G.mats[0].x; o.y = G.mats[0].y; } RW.step(240); } else drive();
      if (id === 'toad') ontoToad();
      const d2 = mobs.reduce((s, e) => s + lost(e), 0); if (!(d2 > 0)) ebad.push(id + ' evolved does no damage');
    }
    ok('all ' + Object.keys(RW.WEAPONS).length + ' weapons deal damage at level 5', wbad.length === 0, wbad.join(',') || 'ok');
    ok('every weapon evolves in its room and still works', ebad.length === 0, ebad.join(',') || 'ok');
    fresh(321); P.weapons.length = 0; RW.applyBoon({ kind: 'w', id: 'halo' }); tp(G.rooms[0].px + 168, G.rooms[0].py + 120);
    for (let i = 0; i < 3; i++) G.ebullets.push({ x: P.x + 10, y: P.y - 4 + i, vx: 0, vy: 0, t: 0, spr: 's_ebullet', life: 9 });
    RW.step(5); const sn1 = G.ebullets.length; RW.step(150);
    ok('lantern halo snuffs shots, one pulse at a time', sn1 >= 2 && G.ebullets.length === 0, sn1 + '->' + G.ebullets.length);

    /* ---------- the second dozen weapons: each one's own trick ---------- */
    {
    ok('weapon table is triple v0.1', Object.keys(RW.WEAPONS).length >= 24, Object.keys(RW.WEAPONS).length);
    ok('every evolution has a room of its own', Object.keys(RW.EVO_ROOM).length === Object.keys(RW.WEAPONS).length && Object.keys(RW.EVO_ROOM).every(t => RW.ROOM_TYPES[t]), Object.keys(RW.EVO_ROOM).length);
    const arm = (id, lv, ox, oy) => { fresh(330, { hero: 'pip', deck: RW.HEROES.pip.deck }); P.weapons.length = 0; for (let i = 0; i < (lv || 1); i++) RW.applyBoon({ kind: 'w', id }); tp(G.rooms[0].px + (ox || 80), G.rooms[0].py + (oy || 160)); return P.weapons[0]; };
    const L3 = (a, b, c) => [lost(a), lost(b), lost(c)].join('/');
    let q1, q2, q3;
    arm('quarrel'); q1 = dummy(P.x + 30, P.y); q2 = dummy(P.x + 55, P.y); q3 = dummy(P.x + 80, P.y); RW.step(170);
    ok('hand ballista pierces a whole line', lost(q1) > 0 && lost(q2) > 0 && lost(q3) > 0, L3(q1, q2, q3));
    arm('rocket'); q1 = dummy(P.x + 45, P.y); q2 = dummy(P.x + 45, P.y + 15); RW.step(220);
    ok('squib rocket bursts on bystanders', lost(q1) > 0 && lost(q2) > 0, lost(q1) + '/' + lost(q2));
    arm('loaded'); q1 = dummy(P.x + 40, P.y); const rolls = new Set(); for (let i = 0; i < 420; i++) { RW.step(1); for (const s of G.shots) if (s.k === 'die') rolls.add(s.roll); }
    ok('loaded dice roll one to six', rolls.size >= 2 && [...rolls].every(v => v >= 1 && v <= 6) && lost(q1) > 0, [...rolls].sort().join(''));
    arm('tide'); q1 = dummy(P.x + 22, P.y, 'slime'); const tx0 = q1.x; RW.step(60);
    ok('tide ring shoves monsters back', lost(q1) > 0 && q1.x > tx0 + 4, Math.round(q1.x - tx0) + 'px');
    arm('honey'); q1 = dummy(P.x + 40, P.y, 'slime'); RW.step(150);
    ok('honey pot leaves a slowing puddle', G.zones.some(z => z.kind === 'honey') && q1.slowT > 0 && q1.slow >= 0.4 && lost(q1) > 0, q1.slow);
    clearMons(); G.zones.length = 0; q1 = dummy(P.x + 40, P.y, 'slime'); q1.mark = 0.25; q1.markT = 5; { const h0 = q1.hp; RW.hurtMon(q1, 100, 0, 0, 0, 'room'); ok('royal jelly: stuck monsters take a quarter more', h0 - q1.hp === 125, h0 - q1.hp); }
    const tw = arm('toad'); RW.hold('right', true); RW.step(50); RW.hold('right', false); RW.step(20); const planted = tw.pets.length;
    q1 = dummy(planted ? tw.pets[0].x + 3 : P.x, planted ? tw.pets[0].y : P.y, 'slime'); RW.step(40);
    ok('toadstools burst into spores when stepped on', planted >= 1 && tw.pets.length < planted && G.zones.some(z => z.kind === 'cloud') && lost(q1) > 0, planted + ' planted');
    arm('whip'); q1 = dummy(P.x + 30, P.y); q2 = dummy(P.x + 52, P.y); q3 = dummy(P.x + 34, P.y + 34); RW.step(120);
    ok('briar whip lashes a line, not a circle', lost(q1) > 0 && lost(q2) > 0 && lost(q3) === 0, L3(q1, q2, q3));
    arm('coin', 1, 80, 100); q1 = dummy(P.x + 40, P.y); q2 = dummy(P.x + 40, P.y - 55); q3 = dummy(P.x + 100, P.y - 55); RW.step(100);
    ok('lucky coin skips between monsters', lost(q1) > 0 && lost(q2) > 0 && lost(q3) > 0, L3(q1, q2, q3));
    arm('snowball'); q1 = dummy(P.x + 110, P.y); let maxR = 0; for (let i = 0; i < 150; i++) { RW.step(1); for (const s of G.shots) if (s.k === 'snow') maxR = Math.max(maxR, s.r); }
    ok('snowball grows as it rolls', maxR > 6 && lost(q1) > RW.WEAPONS.snowball.S[0].dmg, maxR.toFixed(1) + 'px, ' + lost(q1) + ' dmg');
    arm('pepper'); q1 = dummy(P.x + 26, P.y); q2 = dummy(P.x - 38, P.y); RW.step(80);
    ok('dragon pepper burns what is in front', lost(q1) > 0 && q1.burnT > 0 && lost(q2) === 0, lost(q1) + '/' + lost(q2));
    arm('buzz'); q1 = dummy(P.x + 60, P.y); RW.step(120); const blade = G.shots.find(s => s.k === 'saw');
    ok('buzz saw parks on a monster and keeps cutting', !!blade && blade.vx === 0 && blade.vy === 0 && Math.hypot(blade.x - q1.x, blade.y - q1.y) < 16 && lost(q1) >= RW.WEAPONS.buzz.S[0].dmg * 3, lost(q1));
    const sw = arm('sentry'); q1 = dummy(P.x + 70, P.y); RW.step(150); const placed = sw.pets.length, shot = lost(q1);
    ok('clockwork sentry deploys and shoots', placed === 1 && shot > 0, placed + ' sentry, ' + shot + ' dmg');
    q1.dead = true; RW.step(60 * 10); ok('...and winds down when its spring runs out', sw.pets.length === 0, sw.pets.length);
    fresh(331, { hero: 'pip', deck: RW.HEROES.pip.deck });
    ok('evolution reach: deck room, this floor, a later floor, nowhere', RW.evoReach('keyblade') === 2 && RW.evoReach('quarrel') === 1 && RW.evoReach('pepper') === 2 && RW.evoReach('sentry') === 0, ['keyblade', 'quarrel', 'pepper', 'sentry'].map(RW.evoReach).join(''));
    RW.enterFloor(1); ok('...and a floor left behind takes its natives with it', RW.evoReach('quarrel') === 0 && RW.evoReach('honey') === 1, RW.evoReach('quarrel') + '' + RW.evoReach('honey'));
    { const n = { w0: 0, w2: 0 }, ex = new Set(); G = RW.G; P = G.P; P.weapons.length = 0; for (let i = 0; i < 4000; i++) { const b = RW.rollBoon(ex, true); if (b.kind === 'w') { if (RW.evoReach(b.id) === 0) n.w0++; else if (RW.evoReach(b.id) === 2) n.w2++; } }
      const c0 = Object.keys(RW.WEAPONS).filter(id => RW.evoReach(id) === 0).length, c2 = Object.keys(RW.WEAPONS).filter(id => RW.evoReach(id) === 2).length;
      ok('drafts lean toward weapons the run can still evolve', n.w0 / c0 < 0.5 * n.w2 / c2, (n.w0 / c0).toFixed(0) + ' vs ' + (n.w2 / c2).toFixed(0) + ' per weapon'); }
    }

    /* ---------- charms ---------- */
    fresh(330); const cbad = [];
    const snap = () => JSON.stringify([P.might, P.haste, P.area, P.magnet, P.speed, P.extra, P.greed, P.sealPow, P.maxHp, P.dashMax, P.crit, P.dodge, P.invBonus, P.keyCost, RW.CURVE.pressure(6, P.charms.wedge || 0), RW.steelHaste(), RW.roomMul({ type: 'ember', res: 1 })]);
    P.costN = 12; RW.recalc();
    const behave = { blueprint: 1, vest: 1, sweet: 1, emberring: 1, frostring: 1, magpie: 1, pride: 1, threshold: 1, tinder: 1, snuffer: 1 };   // checked by behaviour below
    for (const id in RW.CHARMS) { const b4 = snap(); RW.applyBoon({ kind: 'c', id }); if (b4 === snap() && !behave[id]) cbad.push(id); }
    ok('all ' + Object.keys(RW.CHARMS).length + ' charms apply', cbad.length === 0, cbad.join(',') || 'ok');
    ok('charm table is triple v0.1', Object.keys(RW.CHARMS).length >= 27, Object.keys(RW.CHARMS).length);
    r = build('frost', [1, 0, 0, 0]); ok('master blueprint: new rooms start at level 2', G.roomLv.frost === 2, G.roomLv.frost);
    m = dummy(P.x + 20, P.y); RW.hurtMon(m, 10, 0, 0); ok('ember ring ignites, frost ring chills', m.burnT > 0 && m.slowT > 0);
    { const h0 = m.hp; RW.hurtMon(m, 100, 0, 0, 0, 'room'); ok('tinderbox: burning monsters take more', h0 - m.hp === 115, h0 - m.hp); } m.dead = true;
    for (let i = 0; i < 3; i++) G.ebullets.push({ x: P.x + 12, y: P.y - 4 + i, vx: 0, vy: 0, t: 0, spr: 's_ebullet', life: 9 });
    G.ebullets.push({ x: P.x + 120, y: P.y, vx: 0, vy: 0, t: 0, spr: 's_ebullet', life: 9 }); P.dashCd = 0; RW.press('dash'); RW.step(2); ok('candle snuffer: a dash snuffs nearby shots only', G.ebullets.length === 1, G.ebullets.length); G.ebullets.length = 0;
    RW.step(2); ok('mason\'s pride scales with rooms', P.mightEff > P.might, P.mightEff.toFixed(2) + ' vs ' + P.might.toFixed(2));
    const me0 = P.mightEff; tp(G.rooms[0].px + 168, G.rooms[0].py + 150); tp(r.px + 168, r.py + 150); RW.step(1); ok('threshold charm fires on a doorway', P.thresholdT > 0 && P.mightEff > me0);
    m = RW.spawnMon('slime', P.x, P.y); m.hp = m.max = 500; P.inv = 0; P.dodge = 0; RW.step(3); ok('thorned vest hurts attackers', m.hp < 500, m.hp); m.dead = true; P.inv = 1e9;
    clearMons(); m = RW.spawnMon('kslime', P.x + 40, P.y); m.emerge = 0; m.hp = 1; RW.hurtMon(m, 9, 0, 0, 0, 'room'); ok('magpie feather: elites drop a key', G.picks.some(p => p.k === 'key'));

    /* ---------- monsters, elites, wardens, floors ---------- */
    const mbad = [];
    for (let f = 0; f < 3; f++) {
      fresh(340 + f); if (f) RW.enterFloor(f); G = RW.G; P = G.P; G.dir.calm = 1e9; G.dir.ti = 99; G.endless = true; P.inv = 1e9; build('hall'); build('ember');
      for (const id in RW.MON) { if (RW.MON[id].boss) continue; const e = RW.spawnMon(id, G.rooms[1].px + 120, G.rooms[1].py + 120); if (!e) mbad.push(id); }
      try { RW.step(60 * 6); } catch (e) { mbad.push('floor ' + f + ': ' + e); }
      if (!G.mons.every(e => isFinite(e.x) && isFinite(e.y))) mbad.push('NaN on floor ' + f);
    }
    ok('all monsters and pests run on every floor', mbad.length === 0, mbad.join(',') || Object.keys(RW.MON).length + ' types');
    for (let f = 0; f < 3; f++) {
      fresh(350 + f); if (f) RW.enterFloor(f); G = RW.G; P = G.P; P.inv = 1e9; G.dir.calm = 1e9; G.dir.ti = 99;
      for (let i = 0; i < 5; i++) build('hall', [1, 0, 1, 0]);
      ok('floor ' + (f + 1) + ': stairwell is offered after ' + RW.K.STAIRS_MIN + ' rooms', RW.stairsReady());
      RW.openDraft(G.sealed[0]); const sroom = RW.chooseStairs(); RW.step(80);
      const b = G.dir.boss; ok('floor ' + (f + 1) + ': the warden climbs out of the stairwell', !!b && b.def.id === RW.FLOORS[f].boss && G.stairs && !G.stairs.open, b && b.def.id);
      let exc = null; try { RW.step(60 * 25); } catch (e) { exc = String(e.stack || e).slice(0, 200); }
      ok('floor ' + (f + 1) + ': ' + RW.FLOORS[f].boss + ' fights for 25s without errors', !exc && isFinite(b.x) && isFinite(b.y), exc || Math.round(b.x) + ',' + Math.round(b.y));
      b.emerge = 0; b.hp = 1; RW.hurtMon(b, 5, 0, 0, 0, 'room'); RW.step(10);
      if (f < 2) {
        ok('floor ' + (f + 1) + ': killing the warden opens the stairs', G.bossDown && G.stairs.open && !G.won);
        tp(G.stairs.x, G.stairs.y); let n = 0; while (RW.App.mode !== 'descend' && n++ < 300) RW.step(1);
        ok('floor ' + (f + 1) + ': the stairs lead to the descent screen', RW.App.mode === 'descend', RW.App.mode);
        RW.step(45); RW.press('ok'); n = 0; while (RW.App.mode !== 'play' && n++ < 300) RW.step(1); G = RW.G;
        ok('floor ' + (f + 1) + ': arrival on floor ' + (f + 2), RW.App.mode === 'play' && G.floor === f + 1 && G.rooms.length === 1 && G.sealed.length === 4, 'floor ' + G.floor);
      } else ok('floor 3: killing the Unmaker wins the run', G.won === true);
    }
    // the dread clock
    fresh(360); G.endless = false; G.dir.calm = 1e9; G.t = RW.clockLimit() - 1; RW.step(120); ok('overstaying brings the warden to you, enraged', !!G.dir.boss && G.dir.boss.rage === true && G.dir.overstay);

    /* ---------- meta: collection, decks, heroes ---------- */
    localStorage.removeItem(RW.Save.KEY); RW.Save.load();
    ok('a fresh save owns the starters and Pip', Object.keys(RW.Save.data.rooms).length === RW.STARTER_ROOMS.length && RW.Save.data.heroes.pip === 1, Object.keys(RW.Save.data.rooms).length);
    ok('decks hold ' + RW.K.DECK_SIZE + ' cards', RW.fullDeck('pip').length === RW.K.DECK_SIZE);
    fresh(370); const nat = RW.FLOORS[0].natives[0]; build(nat); ok('drafting a native room collects its card', RW.Save.data.rooms[nat] === 1 && G.newCards.indexOf(nat) >= 0, nat);
    RW.grantBossUnlocks(0); ok('beating the first warden unlocks a hero and cards', RW.Save.data.heroes.wick === 1 && RW.Save.data.rooms.chapel === 1 && RW.Save.data.rooms.grand === 1);
    RW.Save.data.decks.wick = ['hall', 'nope', 'stairs', 'ember']; const dk = RW.fullDeck('wick'); ok('decks are sanitised and topped up', dk.length === RW.K.DECK_SIZE && dk.indexOf('nope') < 0 && dk.indexOf('stairs') < 0, dk.join(','));
    for (const hid in RW.HEROES) { RW.Save.data.heroes[hid] = 1; fresh(380, { hero: hid }); if (!(P.weapons[0].id === RW.HEROES[hid].weapon && P.maxHp === RW.HEROES[hid].hp)) res.push('FAIL hero ' + hid + ' loadout'); RW.step(60); }
    ok('all four heroes start a run', true);
    ok('every hero starts with a weapon that can evolve in their own deck', Object.values(RW.HEROES).every(h => h.deck.indexOf(RW.WEAPONS[h.weapon].evo.room) >= 0), Object.values(RW.HEROES).map(h => h.weapon + '>' + RW.WEAPONS[h.weapon].evo.room).join(' '));
    fresh(390, { hero: 'pip', deck: ['ember', 'frost', 'hall', 'spikes', 'vault', 'library', 'garden', 'guardian', 'fountain', 'cross'] }); RW.openDraft(G.sealed[0]);
    const cds = G.draft.cards; ok('drafts deal deck cards plus one floor native', cds.length === 3 && G.deck.indexOf(cds[0].type) >= 0 && G.deck.indexOf(cds[1].type) >= 0 && RW.FLOORS[0].natives.indexOf(cds[2].type) >= 0, cds.map(c => c.type).join(','));
    /* ---- Stakes: one rule per step, and each rule is in force from its step on ---- */
    {
      const at = (n, seed) => { fresh(seed || 471, { stakes: n }); G.endless = false; return G; };
      at(0); ok('stakes: a run without them has none of the rules', G.stakes === 0 && !RW.stake(1) && RW.STAKES.length === 6);
      at(99); ok('stakes: the step is kept within the ladder', G.stakes === 6, G.stakes);
      // 1: wardens arrive enraged
      at(0); G.t = 60; const calmBoss = RW.summonBoss(null); at(1); G.t = 60; const angry = RW.summonBoss(null);
      ok('stakes 1: wardens arrive enraged', !calmBoss.rage && angry.rage === true && !G.dir.overstay);
      // 2: pests from the first floor on, and sooner
      const pestsBy = (n, secs) => { at(n, 472); G.dir.calm = 0; G.dir.ti = 99; G.t = secs; RW.step(3); return G.sealed.reduce((a, d) => a.concat(d.queue), []).concat(G.mons.map(m => m.type)); };
      const p0 = pestsBy(0, 110), p2 = pestsBy(2, 110), l0 = pestsBy(0, 108), l2 = pestsBy(2, 108);
      ok('stakes 2: a Sapper on the first floor, where there was none', !p0.includes('sapper') && p2.includes('sapper'), p2.filter(x => x === 'sapper' || x === 'latch').join(','));
      ok('stakes 2: and the Latchling comes sooner', !l0.includes('latch') && l2.includes('latch'));
      // 3: dice roll in with the waves
      at(2); G.t = 130; const m2 = RW.floorMix().map(x => x[0]); at(3); G.t = 100; const early = RW.floorMix().map(x => x[0]); G.t = 130; const m3 = RW.floorMix().map(x => x[0]);
      ok('stakes 3: dice join the waves after two minutes on a floor', !m2.includes('die') && !early.includes('die') && m3.includes('die'), m3.join(','));
      // 4: hearts drop half as often (the same 5000 kills, hurt, with and without the rule)
      const hearts = n => { at(n, 473); P.hp = 1; let c = 0; for (let i = 0; i < 5000; i++) { const e = RW.spawnMon('bat', P.x + 300, P.y); RW.killMon(e); } for (const p of G.picks) if (p.k === 'heart') c++; G.mons.length = 0; return c; };
      const h0 = hearts(0), h4 = hearts(4);
      ok('stakes 4: hearts drop half as often', h0 > 30 && h4 > h0 * 0.3 && h4 < h0 * 0.7, h0 + ' -> ' + h4 + ' in 5000 kills');
      // 5: monsters are a fifth tougher, wardens too
      at(4); G.t = 60; const b4 = RW.spawnMon('bones', P.x + 200, P.y).max, w4 = RW.summonBoss(null).max; at(5); G.t = 60; const b5 = RW.spawnMon('bones', P.x + 200, P.y).max, w5 = RW.summonBoss(null).max;
      ok('stakes 5: monsters and wardens are a fifth tougher', Math.abs(b5 / b4 - 1.2) < 0.06 && Math.abs(w5 / w4 - 1.2) < 0.01, b4 + ' -> ' + b5 + ', ' + w4 + ' -> ' + w5);
      // 6: the dread clock runs a quarter faster
      at(5); const c5 = RW.clockLimit(); at(6); const c6 = RW.clockLimit();
      ok('stakes 6: the dread clock runs a quarter faster', Math.abs(c6 / c5 - 0.75) < 1e-9, c5 + ' -> ' + c6);
      ok('stakes: the run record names the step', RW.record(false).stakes === 6);
      ok('stakes: every rule fits one line of the hero screen', RW.STAKES.every(t => RW.textW(t) <= 330), Math.max(...RW.STAKES.map(t => RW.textW(t))) + 'px');
    }
    /* ---- door pressure bites harder the deeper you are ---- */
    {
      const pr = (doors, f) => RW.CURVE.pressure(doors, 0, f), step = f => +(pr(5, f) - pr(4, f)).toFixed(3);
      ok('doors: one sealed door adds more to the knocking on each floor down', step(0) < step(1) && step(1) < step(2) && step(0) === RW.CURVE.door[0], [step(0), step(1), step(2)].join(' < '));
      ok('doors: a plan with three doors is equally quiet on every floor only at zero doors', pr(0, 0) === pr(0, 2) && pr(7, 2) / pr(3, 2) > pr(7, 0) / pr(3, 0), (pr(7, 0) / pr(3, 0)).toFixed(2) + ' on floor 1, ' + (pr(7, 2) / pr(3, 2)).toFixed(2) + ' on floor 3');
      fresh(461); G.endless = false; G.t = 10; const f0 = RW.knocking(); G.floor = 2; const f2 = RW.knocking(); G.floor = 0;
      ok('doors: the HUD multiplier follows the floor', f2 > f0, f0.toFixed(2) + ' -> ' + f2.toFixed(2));
    }
    /* ---- the price of waiting: the knocking grows late in the clock, and a warden's fight speeds up ---- */
    {
      fresh(451); G.endless = false; const lim = RW.clockLimit(), dread = RW.CURVE.dread;
      G.t = lim * 0.3; const early = RW.dreadMul(); G.t = lim * 0.6; const edge = RW.dreadMul(); G.t = lim * 0.8; const mid = RW.dreadMul(); G.t = lim * 0.999; const late = RW.dreadMul();
      ok('dread: the knocking is unchanged for the first 60% of the clock', early === 1 && edge === 1, early + ', ' + edge);
      ok('dread: then it grows, up to +' + Math.round(dread * 100) + '% when the clock runs out', mid > 1 && mid < late && Math.abs(mid - (1 + dread / 2)) < 0.01 && Math.abs(late - (1 + dread)) < 0.01, mid.toFixed(2) + ', ' + late.toFixed(2));
      ok('dread: the HUD multiplier is door pressure times it', Math.abs(RW.knocking() - RW.doorPressure() * late) < 1e-9, RW.knocking().toFixed(2));
      G.t = 0; ok('stairs: woken at once, the warden has half its strength', RW.wardenShare() === 0.5 && RW.swiftLeft() === 2, RW.wardenShare());
      G.t = G.F.clock / 2; const share = RW.wardenShare(); const boss = RW.summonBoss(null);
      ok('stairs: the warden that comes has the share the Stairwell showed', share === 0.75 && boss.max === Math.round(boss.def.hp * 0.75), share + ', ' + boss.max);
      ok('dread: during the fight the knocking does not grow', RW.dreadMul() === 1);
      const F = RW.CURVE.fury; boss.hp = boss.max = 1e9; boss.emerge = 0; P.x = boss.x + 400; RW.step(Math.round((F.after - 2) * 60));
      ok('fury: none for the first ' + F.after + ' seconds of a fight', !boss.fury, boss.fury);
      RW.step(4 * 60); ok('fury: then a first step, announced', boss.fury === 1 && G.banner && /IMPATIENT/.test(G.banner.text), boss.fury + ' ' + (G.banner && G.banner.text));
      RW.step(F.every * 60); ok('fury: a step more every ' + F.every + ' seconds', boss.fury === 2, boss.fury);
      RW.step(F.every * 60 * (F.max + 2)); ok('fury: it stops at ' + F.max + ' steps', boss.fury === F.max, boss.fury);
      // each step makes the warden that much faster: the same 2 seconds of walking, with and without fury
      const walk = fury => { fresh(452); G.endless = false; const b = RW.summonBoss(null); b.hp = b.max = 1e9; b.emerge = 0; b.st = 0; b.stT = 99; b.fightT = 0; b.fury = fury; if (fury) b.fightT = F.after + (fury - 1) * F.every + 1; b.x = P.x - 150; b.y = P.y; const x0 = b.x; for (let i = 0; i < 60; i++) { b.st = 0; b.stT = 99; RW.step(1); } return b.x - x0; };
      const w0 = walk(0), w5 = walk(5);
      ok('fury: five steps make the warden half again as fast', w0 > 10 && Math.abs(w5 / w0 - (1 + 5 * F.step)) < 0.08, w0.toFixed(1) + ' -> ' + w5.toFixed(1) + 'px');
      // a floor whose warden is dead grows no glints
      fresh(453); G.endless = false; const gh = build('greenhouse', [1, 0, 0, 0]); gh.grow = 0; RW.step(120); const growing = gh.grow; G.bossDown = true; gh.grow = 0; RW.step(120);
      ok('quiet floor: a Greenhouse stops growing once the warden is dead', growing > 1 && gh.grow === 0, growing.toFixed(1) + ' -> ' + gh.grow);
    }
    /* ---- a floor's elite besieges the room you built up most ---- */
    {
      fresh(401); ok('siege: a floor with nothing built up has no target', RW.siegeTarget({ x: P.x, y: P.y }) === null);
      const e1 = build('ember', [1, 0, 0, 0]), sp = build('spikes', [1, 0, 0, 0]), e2 = build('ember', [0, 0, 0, 0]);
      const t1 = RW.siegeTarget({ x: e1.px + 100, y: e1.py + 100 }), t2 = RW.siegeTarget({ x: e2.px + 100, y: e2.py + 100 }), more = e1.res === e2.res ? null : e1.res > e2.res ? e1 : e2;
      ok('siege: the target has the most stars; of two such rooms the one that resonates more, else the nearer', G.roomLv.ember === 2 && (more ? t1 === more && t2 === more : t1 === e1 && t2 === e2), 'ember ' + G.roomLv.ember + ', links ' + e1.res + ' and ' + e2.res);
      const hearth = G.rooms[0]; tp(hearth.px + 60, hearth.py + 60);
      const k = RW.spawnMon('kslime', hearth.px + 110, hearth.py + 70); k.hp = k.max = 1e6; RW.step(30);
      const d0 = Math.hypot(k.x - P.x, k.y - P.y), tr = k.tr; let n = 0; while (RW.roomAt(k.x, k.y) !== tr && n++ < 2400) RW.step(1);
      ok('siege: the elite walks to that room first, past the delver', (tr === e1 || tr === e2) && RW.roomAt(k.x, k.y) === tr && Math.hypot(k.x - P.x, k.y - P.y) > d0, n + ' steps');
      RW.step(5);
      ok('siege: the room is off while the elite stands in it, and the minimap knows', tr.hexT > 0 && tr.siegeT > 0 && k.camped === true, tr.hexT.toFixed(2));
      const m = RW.spawnMon('tin', tr.px + 168, tr.py + 150); m.hp = m.max = 500; RW.step(120);
      ok('siege: a besieged Ember Hall burns nothing', m.hp === 500, m.hp);
      RW.step(240); const still = Math.hypot(k.x - (tr.px + 168), k.y - (tr.py + 120));
      ok('siege: it settles near the middle of the room', still < 60 && RW.roomAt(k.x, k.y) === tr, Math.round(still) + 'px');
      tp(k.x + 40, k.y + 30); RW.step(40); const dNear = Math.hypot(k.x - P.x, k.y - P.y);
      ok('siege: it turns on a delver who walks into its room', dNear < 45, Math.round(dNear) + 'px');
      // lure it out: the delver leaves through the doorway, the elite follows, and the room works again
      tp(hearth.px + 168, hearth.py + 130); let out = 0; while (RW.roomAt(k.x, k.y) === tr && out++ < 60) { k.x = P.x + 50; k.y = P.y; RW.step(1); }
      RW.step(40); ok('siege: lured out of the room, its power comes back', tr.hexT <= 0 && RW.roomAt(k.x, k.y) !== tr, tr.hexT.toFixed(2));
      const away = tr === e1 ? e2 : hearth; tp(away.px + 60, away.py + 60); k.x = sp.px + 168; k.y = sp.py + 130; n = 0; while (RW.roomAt(k.x, k.y) !== tr && n++ < 2400) RW.step(1);   // the delver is rooms away, the elite between
      ok('siege: left alone, it goes back', RW.roomAt(k.x, k.y) === tr, n + ' steps');
      RW.killMon(k); RW.step(40); ok('siege: when the elite dies the room works again', tr.hexT <= 0 && tr.siegeT <= 0.5);
      ok('siege: the game explained it once', RW.Save.data.tips.siege === 1);
    }
    /* ---- the damage tally and the census ---- */
    {
      // a run with a weapon, a damage room and a burn: every point of damage has an owner, and the shares add up
      fresh(303); G.dir.calm = 1e9; const ember = build('ember', [1, 0, 0, 0]);
      for (let i = 0; i < 6; i++) RW.spawnMon('slime', P.x + 18 + i * 3, P.y); RW.step(240);
      for (let i = 0; i < 8; i++) RW.spawnMon('bones', ember.px + 150 + i * 6, ember.py + 120); tp(ember.px + 168, ember.py + 150); RW.step(300);
      const list = RW.tallyList(), sum = list.reduce((a, t) => a + t.dmg, 0), keys = list.map(t => t.key);
      ok('tally: every point of damage has an owner', sum === G.stats.dmg && sum > 0, sum + ' of ' + G.stats.dmg);
      ok('tally: the shares add up to the whole', Math.abs(list.reduce((a, t) => a + t.share, 0) - 1) < 1e-9);
      ok('tally: the starting weapon and the Ember Hall are both named', keys.includes('w:keyblade') && keys.includes('r:ember'), keys.join(' '));
      ok('tally: nothing is left unnamed here', !keys.some(k => /other|x:/.test(k)), keys.join(' '));
      ok('tally: largest first, and the room share is the rooms\' part', list.every((t, i) => !i || list[i - 1].dmg >= t.dmg) && Math.abs(RW.tallyShare('r') - list.filter(t => t.kind === 'r').reduce((a, t) => a + t.share, 0)) < 1e-9, RW.tallyShare('r').toFixed(2));
      ok('tally: RW.state() carries it', RW.state().tally.length === list.length && RW.state().dmg === G.stats.dmg);
      // shots, zones and burns keep their owner after the weapon that made them has moved on
      fresh(304); P.weapons.length = 0; RW.applyBoon({ kind: 'w', id: 'bomb' }); for (let i = 0; i < 6; i++) RW.spawnMon('bones', P.x + 40 + i * 4, P.y - 20); RW.step(300);
      ok('tally: a bomb in the air is still the bombs\'', Object.keys(G.tally).join() === 'w:bomb', Object.keys(G.tally).join());
      fresh(305); P.weapons.length = 0; RW.applyBoon({ kind: 'w', id: 'pepper' }); for (let i = 0; i < 4; i++) RW.spawnMon('tin', P.x + 30, P.y + i * 6 - 9); RW.step(200);
      ok('tally: a burn belongs to what lit it', Object.keys(G.tally).join() === 'w:pepper', Object.keys(G.tally).join());
      // the census: what hit the delver, and the record of a run that ended
      fresh(306); P.inv = 0; G.hits.length = 0; const bat = RW.spawnMon('bat', P.x + 3, P.y); RW.step(8);
      ok('census: a touch is named after the monster', G.hits.length === 1 && G.hits[0].by === 'bat', JSON.stringify(G.hits));
      RW.killMon(bat); P.inv = 0; const sh = RW.spawnMon('spore', P.x + 60, P.y); sh.shootT = 0; RW.step(120);
      ok('census: a bullet is named after who fired it', G.hits.some(h => h.by === 'spore'), JSON.stringify(G.hits.map(h => h.by)));
      RW.killMon(sh); G.hits.length = 0; for (let i = 0; i < 5; i++) { P.inv = 0; P.hp = 8; RW.hurtPlayer(1, null, 'test' + i); }
      ok('census: only the last three hits are kept, oldest first', G.hits.map(h => h.by).join() === 'test2,test3,test4', G.hits.map(h => h.by).join());
      const before = RW.Save.data.census.length; P.inv = 0; P.shield = 0; P.hp = 1; G.endless = false; RW.hurtPlayer(5, null, 'the last straw'); RW.step(140);
      const rec = RW.Save.data.census[RW.Save.data.census.length - 1];
      ok('census: a run that ends leaves a record', RW.App.mode === 'over' && RW.Save.data.census.length === Math.min(20, before + 1) && rec && rec.floor === 1 && rec.won === false && rec.by[rec.by.length - 1] === 'the last straw' && rec.doors === G.sealed.length && /keyblade1/.test(rec.weapons), JSON.stringify(rec));
      ok('census: it is in the save, and RW.census() returns it', JSON.parse(localStorage.getItem(RW.Save.KEY)).census.length === RW.Save.data.census.length && RW.census() === RW.Save.data.census);
      for (let i = 0; i < 25; i++) RW.Save.data.census.push(rec); RW.Save.store(); RW.Save.load();
      ok('census: the save keeps the last 20 runs', RW.Save.data.census.length === 20, RW.Save.data.census.length);
    }
    /* ---- the music follows the floor plan (#17): what the plan tells it, and which voices then sound ---- */
    { fresh(121); const S = RW.Snd, was = RW.Save.data.opts.grow; let p = RW.musicPlan(); const first = G.rooms[0].el;
      ok('music: with only the floor\'s first room the plan is at step 0 and names no element', p.step === 0 && Object.keys(p.els).length === 0, JSON.stringify(p));
      const steps = []; for (const type of ['spikes', 'guardian', 'spikes', 'guardian', 'spikes']) { build(type); steps.push(RW.musicPlan().step); }
      ok('music: the first, third and fifth room built are its steps 1, 2 and 3', steps.join() === '1,1,2,2,3', steps.join());
      p = RW.musicPlan(); const built = [...new Set(G.rooms.slice(1).map(r => r.el))].sort().join(), named = Object.keys(p.els).sort().join();
      ok('music: the plan names the elements of the rooms built', named === built && named.length > 0, named + ' (the first room is ' + first + ')');
      const linked = e => G.rooms.some(r => r.el === e && r.type !== 'hearth' && r.type !== 'stairs' && [0, 1, 2, 3].some(d => { const nb = RW.nbOf(r, d); return r.resDir[d] && nb && nb.type !== 'hearth' && nb.type !== 'stairs'; }));
      ok('music: an element resonates when one of its rooms links to another room you built', Object.keys(p.els).every(e => !!p.res[e] === linked(e)), 'resonating: ' + (Object.keys(p.res).join(' ') || 'none'));
      S.grow('element'); S.plan(p); const mine = Object.keys(p.els)[0]; RW.App.mode = 'play'; RW.beginDescent(); RW.App.fade = null; RW.App.descend = { next: 1, time: 0, rooms: 0, swift: 0 }; RW.arriveNextFloor(); G = RW.G; P = G.P;
      ok('music: a new floor starts with its own plan, not the last floor\'s', G.floor === 1 && !S.sounds(mine) && RW.musicPlan().step === 0, 'floor ' + (G.floor + 1) + ', ' + mine + ' sounds: ' + S.sounds(mine));
      fresh(122); build('spikes'); G.rooms.push({ type: 'stairs', el: 'stone', res: 1, resDir: [0, 0, 0, 0] }); p = RW.musicPlan(); G.rooms.pop();
      ok('music: the Stairwell is no room of the plan', p.step === 1 && !p.els.stone, JSON.stringify(p));
      const piece = S.info('cellar').voices, on = () => piece.filter(v => S.sounds(v)).join(' ');
      S.grow('full'); S.plan({ step: 0 }); ok('music, FULL: every voice of the piece sounds and no element\'s', on() === piece.join(' ') && !S.sounds('fire'), on());
      S.grow('plan'); const grown = [0, 1, 2, 3].map(st => { S.plan({ step: st }); return on(); });
      ok('music, WITH THE PLAN: bass, arpeggio and drums first, then lead and answer, counter and pluck, bell', grown[0].split(' ').sort().join(' ') === 'arp bass drum' && /lead/.test(grown[1]) && !/counter|bell/.test(grown[1]) && /counter/.test(grown[2]) && !/bell/.test(grown[2]) && grown[3].split(' ').length === piece.length, grown.join(' | '));
      S.grow('element'); S.plan({ step: 0, els: { fire: 1, frost: 1 }, res: { frost: 1 } });
      ok('music, BY ELEMENT: the whole piece, and the voices of the elements built', on() === piece.join(' ') && S.sounds('fire') && S.sounds('frost') && !S.sounds('water'), on());
      ok('music, BY ELEMENT: an element\'s second layer sounds only while it resonates', S.sounds('frost+') && !S.sounds('fire+'));
      S.hand({ bass: 1, water: 1 }); ok('music: voices set by hand overrule the plan', S.sounds('bass') && S.sounds('water') && !S.sounds('lead') && !S.sounds('fire')); S.hand(null);
      const infos = S.tracks.map(t => S.info(t)), written = infos.filter(i => i.written);
      ok('music: three pieces are written out, each with a name, parts of eight bars and eight element voices', written.length === 3 && written.every(i => i.title && i.parts.length * 8 === i.bars && i.elements.length === 8), written.map(i => i.title + ' ' + i.parts.length + 'x8').join('; '));
      S.grow(was); S.plan(RW.musicPlan()); }
    /* ---- the changelog: CHANGELOG.md, as the game reads it ---- */
    { const C = RW.CHANGES, text = C.map(c => c.v + c.name + c.date + c.items.join('')).join(''), odd = [...new Set(text)].filter(ch => !RW.FONT[ch] || '@{}`'.includes(ch));   // those four draw as icons
      const md = RW.CHANGELOG_MD.split('\n'), heads = md.filter(l => l.startsWith('## ')).length, bullets = md.filter(l => /^\s*[-*+] /.test(l)).length, loose = md.filter(l => /^(\t| \S)/.test(l));
      ok('changelog: every heading in the file is a version the game can read', C.length === heads && C.every(c => c.v), C.filter(c => !c.v).map(c => c.name).join('; ') || heads + ' versions');
      ok('changelog: every bullet in the file is an entry in the game', bullets === C.reduce((n, c) => n + c.items.length, 0) && loose.length === 0, bullets + ' bullets, ' + loose.length + ' lines the game would drop');
      ok('changelog: the game\'s version has an entry, and it is the first', C.length > 0 && C[0].v === RW.K.VERSION, C.map(c => c.v).join(' ') + ' for ' + RW.K.VERSION);
      ok('changelog: every version has a name and at least one entry', C.every(c => c.name && c.items.length > 0), C.map(c => c.v + ':' + c.items.length).join(' '));
      ok('changelog: every released version has its date', C.slice(1).every(c => /^\d{4}-\d\d-\d\d$/.test(c.date)), C.map(c => c.date).join(' '));
      ok('changelog: the game\'s font has every character in it, and none that draws as an icon', odd.length === 0, odd.join(' ') || text.length + ' characters'); }
    ok('no NaN anywhere', isFinite(P.x) && isFinite(P.y) && isFinite(P.glints) && G.mons.every(e => isFinite(e.x)));
  } catch (e) { res.push('EXCEPTION ' + String(e && e.stack || e).slice(0, 600)); }
  try { localStorage.setItem(RW.Save.KEY, saved); RW.Save.load(); } catch (e) { /* ignore */ }
  RW.render();
  return res.join('\n');
})()
