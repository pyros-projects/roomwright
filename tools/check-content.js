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
      { const w = l => (l.find(x => x[0] === 'die') || [0, 0])[1]; at(0); RW.enterFloor(2); G.t = 200; const plain = w(RW.floorMix()); at(3); RW.enterFloor(2); G.t = 200; const raised = w(RW.floorMix());
        ok('stakes 3: ...and there are more of them than the floor brings by itself', plain > 0 && raised > plain, plain + ' -> ' + raised); at(0); }
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
      ok('census: a hit says whether it was a touch or a bullet', G.hits[0].how === 'touch' && G.hits.some(h => h.by === 'spore' && h.how === 'bullet'), JSON.stringify(G.hits.map(h => h.how)));
      RW.killMon(sh); G.hits.length = 0; for (let i = 0; i < 5; i++) { P.inv = 0; P.hp = 8; RW.hurtPlayer(1, null, 'test' + i); }
      ok('census: only the last three hits are kept, oldest first', G.hits.map(h => h.by).join() === 'test2,test3,test4', G.hits.map(h => h.by).join());
      const before = RW.Save.data.census.length; P.inv = 0; P.shield = 0; P.hp = 1; G.endless = false; RW.hurtPlayer(5, null, 'the last straw'); RW.step(140);
      const rec = RW.Save.data.census[RW.Save.data.census.length - 1];
      ok('census: a run that ends leaves a record', RW.App.mode === 'over' && RW.Save.data.census.length === Math.min(20, before + 1) && rec && rec.floor === 1 && rec.won === false && rec.by[rec.by.length - 1] === 'the last straw' && Array.isArray(rec.how) && rec.how.length === rec.by.length && rec.how[rec.how.length - 1] === 'other' && rec.doors === G.sealed.length && /keyblade1/.test(rec.weapons), JSON.stringify(rec));
      ok('census: it is in the save, and RW.census() returns it', JSON.parse(localStorage.getItem(RW.Save.KEY)).census.length === RW.Save.data.census.length && RW.census() === RW.Save.data.census);
      for (let i = 0; i < 25; i++) RW.Save.data.census.push(rec); RW.Save.store(); RW.Save.load();
      ok('census: the save keeps the last 20 runs', RW.Save.data.census.length === 20, RW.Save.data.census.length);
    }
    /* ---- dice in ordinary waves (#11) ---- */
    { fresh(141); const names = () => RW.floorMix().map(x => x[0]), bad = [];
      const WHEN = [{ die: 5 }, { die: 3, bigdie: 5 }, { die: 2, bigdie: 4 }];           // the minutes docs/design.md gives
      WHEN.forEach((D, f) => { RW.enterFloor(f); G = RW.G; P = G.P;
        for (const id of ['die', 'bigdie']) { if (!D[id]) { G.t = 9999; if (names().includes(id)) bad.push('floor ' + (f + 1) + ': a ' + id); continue; }
          G.t = D[id] * 60 - 2; if (names().includes(id)) bad.push('floor ' + (f + 1) + ': ' + id + ' early'); G.t = D[id] * 60 + 2; if (!names().includes(id)) bad.push('floor ' + (f + 1) + ': no ' + id); } });
      ok('dice: a die joins the waves from minute 5, 3 and 2 on floors 1, 2 and 3, a loaded die from minute 5 and 4 on floors 2 and 3', bad.length === 0 && WHEN.length === RW.FLOORS.length, bad.join('; '));
      const shareOn = f => { RW.enterFloor(f); G = RW.G; P = G.P; G.t = 9999; const l = RW.floorMix(), sum = l.reduce((a, x) => a + x[1], 0); return l.filter(x => /die$/.test(x[0])).reduce((a, x) => a + x[1], 0) / sum; }, share = [0, 1, 2].map(shareOn);
      ok('dice: of 100 monsters in a wave about 1, 2 and 3 are dice', Math.abs(share[0] - 0.01) < 0.004 && Math.abs(share[1] - 0.018) < 0.006 && Math.abs(share[2] - 0.026) < 0.008, share.map(x => (x * 100).toFixed(1) + '%').join(' '));
      // a knock back: its pack is drawn from the same mix and is larger than any wave, and from the second knock on it brings dice of its own
      const less = []; for (let f = 0; f < 3; f++) RW.KNOCK.forEach((K, k) => { const wave = RW.CURVE.group(f, 99) * share[f], knock = K.dice + K.big + (K.n + f * Math.round(K.n / 4)) * share[f]; if (!(knock > wave * 1.25)) less.push('floor ' + (f + 1) + ', knock ' + (k + 1) + ': ' + knock.toFixed(2) + ' against ' + wave.toFixed(2)); });
      ok('dice: on every floor each knock back calls more dice than a wave brings', less.length === 0 && RW.KNOCK[0].dice + RW.KNOCK[0].big === 0 && RW.KNOCK[1].dice === 2 && RW.KNOCK[2].dice + RW.KNOCK[2].big === 4, less.join('; ') || 'dice a wave brings on average: ' + [0, 1, 2].map(f => (RW.CURVE.group(f, 99) * share[f]).toFixed(2)).join('/') + '; a knock brings 0/2/4 of its own on top of a larger pack');
      // a warden fights without them
      { fresh(144); RW.enterFloor(1); G = RW.G; P = G.P; G.dir.calm = 1e9; G.t = 9999; const before = names().includes('die');
        const wave = RW.spawnMon('bigdie', P.x + 40, P.y), called = RW.spawnMon('bigdie', P.x - 40, P.y), small = RW.spawnMon('die', P.x, P.y + 40), elite = RW.spawnMon(G.F.elite, P.x, P.y - 40); called.noLoot = true;
        const e = RW.summonBoss(null), during = names().includes('die') || names().includes('bigdie'); G.dir.bossDead = true; const after = names().includes('die');
        ok('dice: none join a warden\'s fight, and they are back once it is dead', before && !during && after && !!e, JSON.stringify({ before, during, after }));
        ok('dice: when the warden comes, the dice a wave brought flee; an elite and a loaded die that a knock called stay', wave.dead && small.dead && !called.dead && !elite.dead, JSON.stringify({ wave: wave.dead, small: small.dead, called: called.dead, elite: elite.dead })); }
      // Every kind of enemy bullet against a ground of any brightness: how many of its pixels differ from the ground in
      // brightness by 40 of 255 or more. (40 and 8 pixels are thresholds chosen by looking at bullets on the carpets, not a standard.)
      { const kinds = ['s_ebullet', 's_spore', 's_fire', 's_hexbolt', 's_card', 's_ball'], used = new Set(); for (const id in RW.MON) if (RW.MON[id].shot && RW.MON[id].shot.spr) used.add(RW.MON[id].shot.spr);
        // ...and every sprite named in a statement of the game's source that fires an enemy bullet
        for (const st of [...document.scripts].map(x => x.textContent).join(';').split(';')) if (/fire(EBullet|Fan)\(/.test(st)) for (const m of st.matchAll(/'(s_[a-z0-9_]+)'/g)) used.add(m[1]);
        const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)), lum = c => 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];
        const pixels = spr => { const s = RW.SPR[spr], d = s.c.getContext('2d').getImageData(0, 0, s.w, s.h).data, out = []; for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 200) out.push([d[i], d[i + 1], d[i + 2]]); return out; };
        const worst = px => { let w = [99, 0]; for (let g = 0; g < 256; g++) { const n = px.filter(c => Math.abs(lum(c) - g) >= 40).length; if (n < w[0]) w = [n, g]; } return w; };
        const res = kinds.map(k => [k, pixels(k).length, ...worst(pixels(k))]);
        ok('bullets: every kind an enemy fires is one of the six that are checked', used.size >= 6 && [...used].every(s => kinds.includes(s)), [...used].join(' '));
        ok('bullets: whatever the brightness of the ground, at least 8 pixels of each bullet stand off from it', res.every(r => r[2] >= 8), res.map(r => r[0] + ': ' + r[2] + ' of ' + r[1] + ' at worst, at brightness ' + r[3]).join('; '));
        // the rim they had before: a darker shade of their own colour, which a ground of that colour swallowed
        const k = rgb(RW.PAL.k), R = rgb(RW.PAL.R), old = pixels('s_ebullet').map(c => c[0] === k[0] && c[1] === k[1] && c[2] === k[2] ? R : c), was = worst(old);
        ok('bullets: ...which the red bullet with its old dark red rim does not', was[0] < 8, was[0] + ' pixels at brightness ' + was[1]);
        // and drawn by the game: over the hearth with its carpet, on each floor
        const cvs = document.getElementById('game'), c2 = cvs.getContext('2d'), V = RW.view(), low = []; let least = 99;
        const shot = () => { G.shake = 0; RW.render(); return c2.getImageData(0, 0, V.VW, V.VH).data; };
        for (const spr of kinds) for (let f = 0; f < RW.FLOORS.length; f++) { fresh(143 + f); RW.enterFloor(f); G = RW.G; P = G.P; P.inv = 1e9; RW.step(4); G.ebullets.length = 0; G.picks.length = 0; G.fxs.length = 0; G.parts.length = 0; G.texts.length = 0; G.flashT = 0; G.banner = null;
          const room = G.rooms[0], keep = room.props; room.props = []; const plain = shot(), cam = G.view, at = [];
          for (let j = 0; j < 5; j++) for (let i = 0; i < 7; i++) at.push([P.x - 66 + i * 22, P.y - 52 + j * 22]);
          for (const [x, y] of at) G.ebullets.push({ x, y, vx: 0, vy: 0, t: 0, spr, life: 99, by: 'check' });
          const drawn = shot(); room.props = keep; G.ebullets.length = 0;
          for (const [x, y] of at) { if (Math.hypot(x - P.x, y - 8 - P.y) < 14) continue;                 // the delver stands here
            const sp = RW.SPR[spr], x0 = Math.round(x - cam.cx) - sp.ax, y0 = Math.round(y - cam.cy) + 3 - sp.ay; let n = 0;
            for (let j = 0; j < sp.h; j++) for (let i = 0; i < sp.w; i++) { const q = ((y0 + j) * V.VW + x0 + i) * 4; if (Math.abs(lum([drawn[q], drawn[q + 1], drawn[q + 2]]) - lum([plain[q], plain[q + 1], plain[q + 2]])) >= 40) n++; }
            least = Math.min(least, n); if (n < 8) low.push(spr + ' on floor ' + (f + 1) + ': ' + n); } }
        ok('bullets: drawn over the hearth and its carpet on every floor, each one keeps at least 8 such pixels', low.length === 0 && least < 99, low.slice(0, 4).join('; ') || 'fewest: ' + least); }
      // a die's bullet that hits: the census names the die and says it was a bullet
      { fresh(142); const d = RW.spawnMon('die', P.x + 60, P.y); d.shootT = 0.05; let n = 0; for (let i = 0; i < 400 && !n; i++) { RW.step(1); n = G.ebullets.length; }
        RW.killMon(d); G.hits.length = 0; const b0 = G.ebullets[0]; if (b0) { b0.x = P.x - 3; b0.y = P.y - 4; b0.vx = 20; b0.vy = 0; } P.inv = 0; P.shield = 0; RW.step(3);
        ok('dice: a die throws a ring of bullets, and one that hits is filed as a bullet from a die', n >= 8 && G.hits.length === 1 && G.hits[0].by === 'die' && G.hits[0].how === 'bullet', n + ' bullets, ' + JSON.stringify(G.hits)); } }
    /* ---- room overloads (#15) ---- */
    { const EL = { fire: 'ember', frost: 'frost', steel: 'spikes', stone: 'hall', wild: 'garden', shadow: 'den', lore: 'library', water: 'fountain' }, O = RW.OVER;
      // a room of `type` at three stars between two rooms that resonate with it (Stone Halls resonate with everything)
      const rig = (type, seed) => { fresh(seed || 171); G.dir.ti = 99; const a = build('hall', [1, 1, 1, 1]), r = build(type, [1, 1, 1, 1], G.sealed.find(d => d.room === a)), b = build('hall', [1, 1, 1, 1], G.sealed.find(d => d.room === r)); G.roomLv[type] = 3; RW.recalcLinks(); return { a, r, b }; };
      ok('overload: the numbers the docs give', O.every === 20 && O.stars === 3 && O.links === 2 && Object.keys(O.dmg).sort().join() === Object.keys(RW.ELEMENTS).sort().join(), JSON.stringify(O));
      // when a room overloads: three stars and two links, both needed; never the hearth
      { const { r } = rig('ember'), links = RW.roomLinks(r), yes = RW.overloads(r); G.roomLv.ember = 2; const two = RW.overloads(r); G.roomLv.ember = 3; const d = r.resDir.indexOf(1); r.resDir[d] = 0; const one = RW.overloads(r); r.resDir[d] = 1;
        const h = G.rooms[0], hd = h.resDir.slice(); G.roomLv.hearth = 3; h.resDir = [1, 1, 0, 0]; const hearth = RW.overloads(h); h.resDir = hd; delete G.roomLv.hearth;
        ok('overload: a room overloads at three stars with two resonance links, and with less of either it does not; the hearth never does', links >= 2 && yes && !two && !one && !hearth, JSON.stringify({ links, yes, two, one, hearth })); }
      // the clock: it charges by itself, shows the charge, fires after 20 seconds whether or not the delver is there, and never hurts the delver
      { const { r } = rig('ember'); P.x = G.rooms[0].px + 60; P.y = G.rooms[0].py + 60; const m = RW.spawnMon('tin', r.px + RW.K.CWP / 2 + 30, r.py + RW.K.CHP / 2); m.emerge = 0; m.max = m.hp = 1e6; G.dir.calm = 1e9;
        const mx = m.x, my = m.y, hold = n => { for (let f = 0; f < n; f++) { m.x = mx; m.y = my; RW.step(1); } };
        r.over = 0; hold(60 * 10); const half = r.over; let fired = -1; const hp0 = m.hp; for (let f = 0; f < 60 * 12 && fired < 0; f++) { const was = r.over; hold(1); if (r.over < was) fired = f; }
        const away = fired >= 0 && m.hp < hp0 - 1 && m.burnT > 0;
        P.x = r.px + RW.K.CWP / 2; P.y = r.py + RW.K.CHP / 2; P.inv = 0; P.shield = 0; const hurt0 = G.stats.hurt; r.over = 0.999; RW.step(3); const safe = G.stats.hurt === hurt0;
        ok('overload: the room charges over 20 seconds, fires while the delver is elsewhere, and is safe to stand in', Math.abs(half - 0.5) < 0.03 && away && safe && Math.abs(10 + fired / 60 - 20) < 0.6, 'charge after 10 s: ' + half.toFixed(2) + ', fired after ' + (10 + fired / 60).toFixed(1) + ' s, the delver in the room took ' + (G.stats.hurt - hurt0)); }
      // a room that is switched off does not charge
      { const { r } = rig('ember'); G.dir.calm = 1e9; r.over = 0.5; r.hexT = 5; RW.step(120); ok('overload: a hexed room does not charge', Math.abs(r.over - 0.5) < 1e-6, r.over); }
      // each element's burst
      { const res = {}, bad = [];
        for (const el in EL) { const { r } = rig(EL[el], 172); G.dir.calm = 1e9; const cx = r.px + RW.K.CWP / 2, cy = r.py + RW.K.CHP / 2; let x = cx + 36, y = cy + 20; for (let k = 0; k < 40 && RW.blocked(x, y, RW.K.F_WALK); k++) { x = cx + 20 + k * 3; y = cy + 30; }
          const m = RW.spawnMon('bones', x, y); m.emerge = 0; m.max = m.hp = 1e6; const out = RW.spawnMon('bones', G.rooms[0].px + 80, G.rooms[0].py + 80); out.emerge = 0; out.max = out.hp = 1e6;
          const g0 = { k: 'glint', x: G.rooms[0].px + 200, y: G.rooms[0].py + 60, v: 1, vx: 0, vy: 0, t: 1, mag: false, ms: 70, gone: false }; G.picks.push(g0);
          P.x = cx - 30; P.y = cy + 40; for (let k = 0; k < 40 && RW.blocked(P.x, P.y, RW.K.F_WALK); k++) P.x += 4; P.inv = 0; P.shield = 0; P.hp = P.maxHp; const hurt0 = G.stats.hurt, hp0 = m.hp;
          r.over = 0.9999; RW.step(2);
          const want = O.dmg[el] * RW.roomPow(r), d0 = Math.hypot(m.x - cx, m.y - cy);
          res[el] = { dmg: Math.round(hp0 - m.hp), want: Math.round(want), stun: +m.stun.toFixed(1), burn: m.burnT > 0, root: +m.rootT.toFixed(1), mark: m.markT > 0 ? m.mark : 0, shield: P.shield, mag: g0.mag, outside: out.hp < 1e6, hurt: G.stats.hurt - hurt0 };
          m.stun = 0; RW.step(8); res[el].push = Math.round(Math.hypot(m.x - cx, m.y - cy) - d0);
          const q = res[el]; if (q.dmg < q.want * 0.95) bad.push(el + ': ' + q.dmg + ' damage, ' + q.want + ' expected'); if (q.outside) bad.push(el + ': reaches outside the room'); if (q.hurt) bad.push(el + ': hurts the delver'); }
        const q = res;
        ok('overload: every element has its burst, in the room only, and none hurts the delver', bad.length === 0, bad.join('; '));
        ok('overload: fire burns, frost freezes for three seconds, stone pins, wild roots and poisons, shadow and lore mark, lore calls the glints, water shields, steel hits hardest',
          q.fire.burn && q.frost.stun >= 2.9 && q.stone.root >= 0.9 && q.wild.root >= 2.9 && q.wild.burn && q.shadow.mark >= 0.5 && q.lore.mark >= 0.5 && q.lore.mag && !q.fire.mag && q.water.shield === 1 && q.fire.shield === 0 && Object.keys(q).every(el => el === 'steel' || q.steel.want > q[el].want),
          JSON.stringify(Object.fromEntries(Object.entries(q).map(([k, v]) => [k, v.dmg]))));
        ok('overload: stone and water throw the monsters back, the others do not', q.stone.push > 6 && q.water.push > 6 && ['fire', 'frost', 'steel', 'wild', 'shadow', 'lore'].every(el => q[el].push < 4), JSON.stringify(Object.fromEntries(Object.entries(q).map(([k, v]) => [k, v.push])))); }
      // a root is three seconds, also in a field that slows; a warden is not frozen, stunned, rooted or thrown; water shields only in the room and only without a shield
      { const { r } = rig('garden', 174); G.dir.calm = 1e9; const cx = r.px + RW.K.CWP / 2, cy = r.py + RW.K.CHP / 2; let x = cx + 36, y = cy + 20; for (let k = 0; k < 40 && RW.blocked(x, y, RW.K.F_WALK); k++) { x = cx + 20 + k * 3; y = cy + 30; }
        const m = RW.spawnMon('bones', x, y); m.emerge = 0; m.max = m.hp = 1e6; RW.addZone(x, y, 40, 30, 'drift', 0, { slow: 0.5 }); P.x = G.rooms[0].px + 60; P.y = G.rooms[0].py + 60; r.over = 0.9999; RW.step(2); const at0 = m.rootT; RW.step(60 * 3 + 12);
        ok('overload: a root lasts three seconds, also in a field that slows', at0 >= 2.9 && m.rootT <= 0, 'rooted for ' + at0.toFixed(1) + ' s, ' + m.rootT.toFixed(2) + ' s left after 3.2 s'); }
      { const out = {}; for (const [el, type] of [['frost', 'frost'], ['stone', 'hall'], ['wild', 'garden']]) { const { r } = rig(type, 175); G.dir.calm = 1e9; const cx = r.px + RW.K.CWP / 2, cy = r.py + RW.K.CHP / 2, w = RW.spawnMon('gatejaw', cx + 30, cy + 20); w.emerge = 0; w.st = 0; w.stT = 99; const hp0 = w.hp, x0 = w.x; P.x = G.rooms[0].px + 60; P.y = G.rooms[0].py + 60; r.over = 0.9999; RW.step(2); out[el] = { hurt: w.hp < hp0, stun: w.stun, root: w.rootT, moved: Math.abs(w.x - x0) > 3 }; }
        ok('overload: a warden takes the damage but is not frozen, pinned, rooted or thrown', Object.values(out).every(o => o.hurt && !o.stun && !o.root && !o.moved), JSON.stringify(out)); }
      { const shield = (inside, has) => { const { r } = rig('fountain', 176); G.dir.calm = 1e9; const cx = r.px + RW.K.CWP / 2, cy = r.py + RW.K.CHP / 2; if (inside) { P.x = cx - 30; P.y = cy + 40; for (let k = 0; k < 40 && RW.blocked(P.x, P.y, RW.K.F_WALK); k++) P.x += 4; } else { P.x = G.rooms[0].px + 60; P.y = G.rooms[0].py + 60; } RW.step(2); P.shield = has; r.over = 0.9999; RW.step(2); return P.shield; };
        const got = [shield(true, 0), shield(true, 1), shield(false, 0)]; ok('overload: water shields a delver who stands in the room and has no shield, and nobody else', got.join() === '1,1,0', got.join()); }
      // what is heard and filed: one sound and the tip in a run, the damage on the room's account; behind the title nothing sounds and nothing shakes
      { const run = demo => { const { r } = rig('library', 177); G.dir.calm = 1e9; G.demo = demo; const cx = r.px + RW.K.CWP / 2, cy = r.py + RW.K.CHP / 2, m = RW.spawnMon('bones', cx + 36, cy + 30); m.emerge = 0; m.max = m.hp = 1e6; P.x = cx - 30; P.y = cy + 40; delete RW.Save.data.tips.overload; G.shake = 0;
          const heard = [], play = RW.Snd.play; RW.Snd.play = (n, a) => { heard.push(n); return play(n, a); }; try { r.over = 0.9999; RW.step(2); } finally { RW.Snd.play = play; }
          const t = RW.state().tally.find(x => /library/.test(x.key)); return { sound: heard.filter(n => n === 'overload').length, shake: G.shake > 0, tip: !!RW.Save.data.tips.overload, credit: t ? Math.round(t.dmg) : 0, hit: m.hp < 1e6 }; };
        const play = run(false), demo = run(true); G.demo = false;
        ok('overload: in a run it sounds once, shakes, leaves its tip and files its damage under the room; behind the title it is silent and still', play.sound === 1 && play.shake && play.tip && play.credit > 0 && demo.sound === 0 && !demo.shake && !demo.tip && demo.hit, JSON.stringify({ play, demo })); }
      // what is drawn: the ring of pips on the floor (not on a hexed room), and OVERLOAD on the card
      { const { r } = rig('ember', 178); G.dir.calm = 1e9; const cvs = document.getElementById('game'), c2 = cvs.getContext('2d'), V = RW.view(); P.x = r.px + RW.K.CWP / 2 - 60; P.y = r.py + RW.K.CHP / 2 + 50; P.inv = 0; RW.step(40); G.fxs.length = 0; G.parts.length = 0; G.texts.length = 0;
        const look = (over, hex) => { r.over = over; r.hexT = hex; G.shake = 0; RW.render(); const cam = G.view, x = Math.round(r.px + RW.K.CWP / 2 - cam.cx) - 30, y = Math.round(r.py + RW.K.CHP / 2 - cam.cy) - 21; return Array.from(c2.getImageData(x, y, 60, 5).data).join(); };
        const none = look(0, 0), half = look(0.5, 0), hexed = look(0.5, 3), hexedNone = look(0, 3); r.hexT = 0; r.over = 0;
        ok('overload: the room shows its charge as a ring of pips on its floor, and a hexed room shows none', half !== none && hexed === hexedNone); }
      // the card: it says when a pick brings a room to overload
      { fresh(173); G.dir.ti = 99; const a = build('hall', [1, 1, 1, 1]), r = build('ember', [1, 1, 1, 1], G.sealed.find(d => d.room === a)); G.roomLv.ember = 3; RW.recalcLinks();
        const door = G.sealed.find(d => d.room === r); P.keys = 9; RW.openDraft(door); const D = G.draft, c = D.cards[0]; c.type = 'hall'; c.want = [1, 1, 1, 1]; RW.refreshCard(c, D.cx, D.cy, D.entry); const closes = c.over;
        c.type = 'frost'; RW.refreshCard(c, D.cx, D.cy, D.entry); const other = c.over; G.roomLv.ember = 2; c.type = 'hall'; RW.refreshCard(c, D.cx, D.cy, D.entry); const two = c.over; G.roomLv.ember = 3; RW.refreshCard(c, D.cx, D.cy, D.entry);
        D.sel = 0; const plan = RW.coachPlan(D, true).map(s => s.id); RW.closeDraft && RW.closeDraft();
        ok('overload: a card that gives a three-star room its second resonating neighbour says so, and the coach has a lesson for it', closes === 1 && other === 0 && two === 0 && plan.includes('c_over'), JSON.stringify({ closes, other, two, plan }));
        // the other two ways: a type's third star, and the new room itself between two rooms that resonate with it
        const R2 = rig('ember', 179); G.roomLv.ember = 2; const star = RW.previewOver(0, 0, 'ember', [0, 0, 0, 0], 3), noStar = RW.previewOver(0, 0, 'ember', [0, 0, 0, 0], 2); G.roomLv.ember = 3;
        const DIR = [[0, -1], [1, 0], [0, 1], [-1, 0]], GR = RW.K.GRID; let self = -1, selfTwo = -1;
        for (let d = 0; d < 4 && self < 0; d++) { const X = R2.b.cx + DIR[d][0], Y = R2.b.cy + DIR[d][1]; if (X < 1 || Y < 1 || X > GR - 2 || Y > GR - 2 || G.cells[Y * GR + X]) continue;
          // the empty cell beside the last hall, with a second hall put beside it for the moment
          const e2 = (d + 1) % 4, X2 = X + DIR[e2][0], Y2 = Y + DIR[e2][1], idx = Y2 * GR + X2; if (G.cells[idx]) continue; G.cells[idx] = R2.a;
          const doors = [0, 0, 0, 0]; doors[(d + 2) % 4] = 2; doors[e2] = 2; G.roomLv.frost = 3; self = RW.previewOver(X, Y, 'frost', doors, 3); selfTwo = RW.previewOver(X, Y, 'frost', doors, 2); G.cells[idx] = null; delete G.roomLv.frost; }
        ok('overload: the card also counts a type that gains its third star and the new room itself, and not a pick that leaves it at two stars', star === 1 && noStar === 0 && self === 1 && selfTwo === 0, JSON.stringify({ star, noStar, self, selfTwo }));
        { fresh(180); G.dir.ti = 99; const a2 = build('hall', [1, 1, 1, 1]); const door = G.sealed.find(d => d.room === a2); P.keys = 9; RW.openDraft(door); const D = G.draft, c = D.cards[0], cvs = document.getElementById('game'), c2 = cvs.getContext('2d'), V = RW.view(); D.t = 9; D.sel = 1; RW.step(40);
          const look = over => { c.over = over; RW.render(); return Array.from(c2.getImageData(0, 0, V.VW, V.VH).data).filter((v, i) => i % 97 === 0).join(); }, L = RW.draftLayout(), fits = L.rects[0].w;
          const frames = n => { const seen = new Set(); for (let i = 0; i < 8; i++) { RW.step(4); seen.add(look(n)); } return seen; }, with1 = frames(1), with0 = frames(0);
          ok('overload: the card writes OVERLOAD on its plan when the pick brings a room there', [...with1].some(x => !with0.has(x)) && fits > 60, with1.size + ' and ' + with0.size + ' pictures'); RW.closeDraft(); } }
    }
    /* ---- the house (#12): a dealer, a roulette wheel, a slot machine ---- */
    { const HZ = 60, wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
      const mk = (id, dist, seed) => { fresh(seed || 161); G.dir.calm = 1e9; G.rooms[0].props = []; const e = RW.spawnMon(id, P.x + dist, P.y); e.emerge = 0; e.shootT = 0.05; e.hp = e.max = 1e6; return e; };
      // how often a delver is hit over `frames`, moving by walk(e, f) (px per frame, at most its walking speed)
      const hitsOf = (e, frames, walk) => { let n = 0, was = G.stats.hurt; for (let f = 0; f < frames; f++) { P.inv = 0; P.shield = 0; P.hp = P.maxHp; if (walk) { const v = walk(e, f); if (v) { const d = Math.hypot(v[0], v[1]) || 1, s = Math.min(d, P.speedEff / HZ); P.x += v[0] / d * s; P.y += v[1] / d * s; } } RW.step(1); if (G.stats.hurt > was) { n++; was = G.stats.hurt; } } return n; };
      const heardBy = fn => { const heard = [], play = RW.Snd.play; RW.Snd.play = (n, a) => { heard.push(n); return play(n, a); }; try { fn(); } finally { RW.Snd.play = play; } return heard; };
      ok('house: each of the three has its sprites, its bullet and a sound of its own', ['dealer0', 'dealer1', 'wheel0', 'wheel1', 'slot0', 'slot1', 'sym0', 'sym1', 'sym2', 's_card', 's_ball'].every(n => RW.SPR[n]) && ['cards', 'wheel', 'slot'].every(n => RW.Snd.names.includes(n)), RW.Snd.names.length + ' effects');

      // the dealer: a wind-up of half a second, then five cards in a fan with the middle one at you; then it waits
      { let e = mk('dealer', 100), tell = 0; P.inv = 1e9; const heard = heardBy(() => { for (let f = 0; f < 240 && !G.ebullets.length; f++) { RW.step(1); if (e.st === 1) tell++; } });
        const B = G.ebullets.slice(), a0 = Math.atan2(P.y - 4 - (e.y - 4), P.x - e.x), offs = B.map(b => wrap(Math.atan2(b.vy, b.vx) - a0)).sort((x, y) => x - y), gaps = offs.slice(1).map((a, i) => a - offs[i]);
        let wait = 0; for (let f = 0; f < 600 && e.st !== 1; f++) { RW.step(1); wait++; }                // until it winds up again
        const far = mk('dealer', 200); far.spd = 0; P.inv = 1e9; for (let f = 0; f < 300; f++) { far.x = P.x + 200; far.y = P.y; RW.step(1); } const farShots = G.ebullets.length;
        ok('house: the dealer winds up for half a second, then throws five cards in a fan with the middle one at you, to its own sound', tell >= HZ * 0.45 && B.length === 5 && B.every(b => b.spr === 's_card' && b.by === 'dealer') && Math.abs(offs[2]) < 0.03 && gaps.every(g => Math.abs(g - 0.3) < 0.01) && heard.includes('cards'), 'tell ' + (tell / HZ).toFixed(2) + ' s, ' + B.length + ' cards, gaps ' + gaps.map(g => g.toFixed(2)).join(' '));
        ok('house: the dealer then waits three to four seconds, and from 200 px away it throws nothing', wait >= HZ * 3.1 && wait <= HZ * 4.1 && farShots === 0, 'waited ' + (wait / HZ).toFixed(1) + ' s, ' + farShots + ' cards from afar');
        e = mk('dealer', 100); const still = hitsOf(e, 200); e = mk('dealer', 100); let thrown = 0; const stepped = hitsOf(e, 200, () => { if (G.ebullets.length && thrown < 15) { thrown += P.speedEff / HZ; return [0, 99]; } return null; });
        ok('house: the dealer asks for a step through a gap: standing is hit, half a gap to the side is not', still >= 1 && stepped === 0, 'standing ' + still + ' hits, stepping ' + stepped); }

      // the roulette wheel: a rattle of half a second, then it turns in place and sweeps an arm of balls toward you and past you
      { let e = mk('wheel', 70), tell = 0, most = 0, moved = 0, x0, y0; P.inv = 1e9; const angs = [], seen = new Set(); let balls = true;
        const heard = heardBy(() => { for (let f = 0; f < 600; f++) { const st = e.st; RW.step(1); if (e.st === 1) tell++; let fresh1 = 0; for (const b of G.ebullets) if (!seen.has(b)) { seen.add(b); fresh1++; angs.push(Math.atan2(b.vy, b.vx)); if (b.spr !== 's_ball' || b.by !== 'wheel') balls = false; } most = Math.max(most, fresh1); if (e.st === 2 && x0 === undefined) { x0 = e.x; y0 = e.y; } if (st === 2) moved = Math.max(moved, Math.hypot(e.x - x0, e.y - y0)); if (st === 2 && e.st === 0) break; } });
        const toP = Math.atan2(P.y - 4 - (e.y - 5), P.x - e.x), steps = angs.slice(1).map((a, i) => wrap(a - angs[i])), dir = Math.sign(steps[0] || 0), S = RW.MON.wheel.shot;
        const first = wrap(angs[0] - toP), last = wrap(angs[angs.length - 1] - toP);
        ok('house: the wheel rattles for half a second, then turns in place: one ball at a time, each a small step further round, from one side of you to the other, to its own sound',
          tell >= HZ * 0.45 && most === 1 && angs.length === 15 && S.turn === 0.125 && S.spin === 2 && moved < 1 && steps.every(s => Math.abs(s - dir * S.turn) < 0.01) && Math.abs(first) > 0.9 && Math.sign(first) === -dir && Math.sign(last) === dir && heard.includes('wheel') && balls,
          'tell ' + (tell / HZ).toFixed(2) + ' s, ' + angs.length + ' balls, from ' + first.toFixed(2) + ' to ' + last.toFixed(2) + ' rad beside you; at most ' + most + ' in a frame, moved ' + moved.toFixed(1) + ' px, steps ' + [...new Set(steps.map(x => x.toFixed(3)))].join('/') + ', sound ' + heard.includes('wheel') + ', balls ' + balls);
        // circle it: a delver that walks round it ahead of the arm is not hit; one that stands is
        e = mk('wheel', 70); const still = hitsOf(e, 420); e = mk('wheel', 70); let way = 0;
        const round = hitsOf(e, 420, (e, f) => { if (e.st !== 2 && !way) return null; if (!way && G.ebullets.length >= 2) { const a = Math.atan2(G.ebullets[0].vy, G.ebullets[0].vx), b = Math.atan2(G.ebullets[1].vy, G.ebullets[1].vx); way = Math.sign(wrap(b - a)); } if (!way) return null; const ax = P.x - e.x, ay = P.y - e.y, d = Math.hypot(ax, ay), k = (70 - d) * 0.5; return [-ay / d * way * 9 + ax / d * k, ax / d * way * 9 + ay / d * k]; });
        ok('house: the wheel asks to be circled: standing is hit, walking round it ahead of the arm is not', still >= 1 && round === 0, 'standing ' + still + ' hits, circling ' + round); }

      // the slot machine: its reels roll, then three of a kind stand for over half a second, then it pays out what they name
      { const S = RW.MON.slot.shot, pays = [0, 1, 2].map(pay => { const e = mk('slot', 110); P.inv = 1e9; let shown = 0, rolled = 0, first = -1; const kinds = new Set(), angs = [], when = []; let seen = 0;
          const heard = heardBy(() => { for (let f = 0; f < 400; f++) { RW.step(1); if (e.st === 1) { rolled++; e.pay = pay; } if (e.st === 2 && first < 0) shown++; const n = G.ebullets.length; if (n > seen) { if (first < 0) first = f; for (let i = seen; i < n; i++) { kinds.add(G.ebullets[i].spr); angs.push(Math.atan2(G.ebullets[i].vy, G.ebullets[i].vx)); when.push(f); } seen = n; } if (first >= 0 && f > first + 60) break; } });
          return { shown, rolled, n: angs.length, kinds: [...kinds].join(), frames: new Set(when).size, spread: Math.max(...angs.map(a => Math.abs(wrap(a - Math.atan2(P.y - 4 - (e.y - 4), P.x - e.x))))), slot: heard.includes('slot') }; });
        ok('house: the slot machine shows three of a kind for at least half a second before it pays out', pays.every(p => p.shown >= HZ * 0.5 && p.rolled >= HZ * 0.3 && p.slot) && S.show >= 0.5, pays.map(p => (p.shown / HZ).toFixed(2) + ' s').join(' '));
        ok('house: cherries pay a ring, bells a fan at you, sevens three fast bolts at you, one after the other', pays[0].n === 14 && pays[0].kinds === 's_ebullet' && pays[0].frames === 1 && pays[0].spread > 2.8 && pays[1].n === 5 && pays[1].kinds === 's_fire' && pays[1].frames === 1 && pays[1].spread < 0.7 && pays[2].n === 3 && pays[2].kinds === 's_hexbolt' && pays[2].frames === 3 && pays[2].spread < 0.12, JSON.stringify(pays.map(p => [p.n, p.kinds, p.frames, +p.spread.toFixed(2)])));
        { const e = mk('slot', 110, 163); P.inv = 1e9; const seen = new Set(); for (let f = 0; f < 60 * 130 && seen.size < 3; f++) { RW.step(1); if (e.st === 2) seen.add(e.pay); G.ebullets.length = 0; }
          // hits on a delver `dist` px from a machine that rolls `pay`: standing, or walking round it at its ordinary speed from the moment the reels roll
          const run = (pay, dist, walk) => { const e = mk('slot', dist); let n = 0, was = G.stats.hurt; for (let f = 0; f < 330; f++) { P.inv = 0; P.shield = 0; P.hp = P.maxHp; if (e.st === 1) e.pay = pay; if (walk && (e.st >= 1 || G.ebullets.length)) { const dx = P.x - e.x, dy = P.y - e.y, d = Math.hypot(dx, dy) || 1, v = P.speedEff / HZ, k = (dist - d) * 0.3; P.x += -dy / d * v + dx / d * k; P.y += dx / d * v + dy / d * k; } RW.step(1); if (G.stats.hurt > was) { n++; was = G.stats.hurt; } if (e.st === 0 && f > 200) break; } return n; };
          const near = run(0, 30, false), fan = [run(1, 60, false), run(1, 60, true)], bolts = [run(2, 60, false), run(2, 60, true)];
          ok('house: the slot machine rolls all three by itself; its ring hits a delver that stands close, its fan and its bolts hit one that stands and miss one that keeps walking', seen.size === 3 && near >= 1 && fan[0] >= 1 && fan[1] === 0 && bolts[0] >= 1 && bolts[1] === 0, 'rolled ' + [...seen].sort().join('') + '; ring at 30 px: ' + near + ' hits; fan standing/walking ' + fan.join('/') + '; bolts ' + bolts.join('/')); }
        // the reels are on the screen, and they differ with what is coming
        const cvs = document.getElementById('game'), c2 = cvs.getContext('2d'), V = RW.view(), e = mk('slot', 60), look = (st, pay) => { e.st = st; e.pay = pay; e.stT = 9; e.anim = 0; G.shake = 0; RW.render(); const cam = G.view, x = Math.round(e.x - cam.cx) - 14, y = Math.round(e.y - cam.cy) - 30; return Array.from(c2.getImageData(x, y, 29, 14).data).join(); };
        const none = look(0, 0), reels = [0, 1, 2].map(p => look(2, p));
        ok('house: the reels stand above the machine and show a different picture for each of the three attacks', reels.every(r => r !== none) && new Set(reels).size === 3); }

      // each comes alone the first time, then joins the waves; a warden fights without it
      { const bad = [], H = RW.HOUSE;
        H.forEach((h, f) => { fresh(165 + f); RW.enterFloor(f); G = RW.G; P = G.P; G.dir.calm = 1e9; G.dir.ti = 99; const D = G.dir, names = () => RW.floorMix().map(x => x[0]), queued = () => G.sealed.reduce((a, d) => a.concat(d.queue), []);
          G.t = h.solo - 2; D.calm = 0; D.acc = -1e6; RW.updateDirector(1 / 60); if (D.house !== undefined || queued().includes(h.id) || names().includes(h.id)) bad.push(h.id + ': there before its time'); for (const d of G.sealed) d.queue.length = 0;
          G.t = 9999; if (names().includes(h.id)) bad.push(h.id + ': in the waves before it came alone');
          G.t = h.solo + 0.2; D.calm = 0; D.acc = -1e6; G.banner = null; for (const d of G.sealed) d.st = 2; RW.updateDirector(1 / 60); if (D.house !== undefined) bad.push(h.id + ': out of a door that is busy'); for (const d of G.sealed) { d.st = 0; d.queue.length = 0; }
          D.calm = 0; D.acc = 0; RW.updateDirector(1 / 60); const q = queued(), t1 = D.house; D.calm = 0; RW.updateDirector(1 / 60); if (queued().filter(x => x === h.id).length !== 1 || D.house !== t1) bad.push(h.id + ': a second first entrance');
          D.calm = 3;
          if (q.length !== 1 || q[0] !== h.id) bad.push(h.id + ': not alone at the door (' + q.join(',') + ')'); if (!G.banner || G.banner.text !== h.name) bad.push(h.id + ': no banner'); if (!(D.calm > 2.5)) bad.push(h.id + ': the waves do not wait (' + D.calm + ')');
          G.t = D.house + h.after - 1; if (names().includes(h.id)) bad.push(h.id + ': in the waves too early'); G.t = D.house + h.after + 1; const w = RW.floorMix().find(x => x[0] === h.id); if (!w || w[1] !== h.w) bad.push(h.id + ': not in the waves afterwards');
          D.boss = { def: {} }; if (names().includes(h.id)) bad.push(h.id + ': joins a warden\'s fight'); D.boss = null;
          fresh(168 + f); RW.enterFloor(f); G = RW.G; P = G.P; G.dir.calm = 1e9; G.dir.ti = 99; G.dir.boss = { def: {} }; G.t = h.solo + 5; RW.updateDirector(1 / 60); if (G.dir.house !== undefined) bad.push(h.id + ': its first entrance falls into a warden\'s fight'); G.dir.boss = null; });
        ok('house: each comes alone the first time (one of it, a banner, the waves wait), joins the waves 50 seconds later, and stays out of a warden\'s fight', bad.length === 0 && H.length === 3 && H.map(h => h.id).join() === 'dealer,wheel,slot' && H.map(h => h.solo).join() === '180,150,120' && H.every(h => h.after === 50) && H.map(h => h.w).join() === '0.2,0.2,0.3', bad.join('; ')); }
    }
    /* ---- a warden's bullet phase (#13) ---- */
    { const HZ = 60, T = RW.K.T, ids = ['gatejaw', 'morel', 'unmaker'];
      // One fight: the warden of `floor` in the hearth (or at o.at), the delver `dist` px from it at the angle o.ang, the
      // warden at the health where its phase starts. walk(e, ph) says where the delver wants to be; it walks there at
      // its ordinary speed, without a dash, and it keeps walking during the tell (o.stroll: straight on, away from its start).
      const fight = (floor, dist, walk, o) => {
        o = o || {}; fresh(151 + floor); RW.enterFloor(floor); G = RW.G; P = G.P; G.tut.step = 9; G.dir.calm = 1e9; G.dir.ti = 99;
        const room = G.rooms[0]; room.props = []; const e = RW.summonBoss(null); e.emerge = 0; e.evx = e.evy = 0; G.banner = null;
        e.x = room.px + RW.K.CWP / 2; e.y = room.py + RW.K.CHP / 2 - 10; if (o.at) { e.x = room.px + o.at[0]; e.y = room.py + o.at[1]; }
        const ang = o.ang || 0; P.x = e.x + Math.cos(ang) * dist; P.y = e.y + 4 + Math.sin(ang) * dist; if (o.P) { P.x = room.px + o.P[0]; P.y = room.py + o.P[1]; } if (o.rage) e.rage = true;
        e.st = 0; e.stT = 99; e.hp = Math.round(e.max * 0.6) - 1; e.fightT = o.fury ? 300 : 0;
        const out = { hits: 0, by: '', bys: [], tell: 0, frames: 0, shots: 0, bullets: 0, first: 0, name: '', moved: 0, side: -1, doors: [], hex: 0 }; let was = G.stats.hurt;
        for (let f = 0; f < HZ * 30; f++) {
          P.inv = 0; P.shield = 0; P.hp = P.maxHp; e.hp = Math.max(e.hp, 10); RW.step(1);
          if (G.stats.hurt > was) { out.hits++; was = G.stats.hurt; const h = G.hits[G.hits.length - 1]; out.by = h.by + ' ' + h.how; out.bys.push(out.by); }
          const ph = e.ph; if (!ph) { if (e.phased) break; continue; }
          out.frames++; if (ph.st === 0) out.tell++; out.shots = ph.shots.length; out.bullets = Math.max(out.bullets, G.ebullets.length); if (ph.shots.length === 1 && !out.first) out.first = G.ebullets.length;
          if (G.banner) out.name = G.banner.text; if (ph.side !== undefined) { out.side = ph.side; out.doors = ph.shots.map(s => s.door); out.box = ph.box; }
          if (o.each) o.each(e, ph, out);
          let to = walk && walk(e, ph); if (o.stroll && ph.st === 0) to = [P.x + Math.cos(ang + 1.6) * 20, P.y + Math.sin(ang + 1.6) * 20];
          if (to) { const dx = to[0] - P.x, dy = to[1] - P.y, d = Math.hypot(dx, dy), s = Math.min(d, P.speedEff / HZ); if (d > 0.5) { P.x += dx / d * s; P.y += dy / d * s; out.moved += s; } }
        }
        out.ended = !e.ph && !!e.phased; return out; };
      // the ring or the wall that reaches the delver next: all of it is on the screen
      const next = (ph, reach) => { let best = null, bt = 1e9; for (const s of ph.shots) { const t = reach(s); if (t > -0.15 && t < bt) { bt = t; best = s; } } return best; };
      const ringReach = s => (Math.hypot(P.x - s.x, P.y - 4 - s.y) - s.sp * s.t) / s.sp;
      const walks = {
        // Gatejaw: keep your distance and stand in the gap of the ring that comes next
        gatejaw: (e, ph) => { const s = next(ph, ringReach) || ph.shots[ph.shots.length - 1]; if (!s) return null; const d = Math.hypot(P.x - s.x, P.y - 4 - s.y); return [s.x + Math.cos(s.a) * d, s.y + 4 + Math.sin(s.a) * d]; },
        // Mother Morel: the nearest gap of the ring that comes next
        morel: (e, ph) => { const s = next(ph, ringReach); if (!s) return null; const d = Math.hypot(P.x - s.x, P.y - 4 - s.y), me = Math.atan2(P.y - 4 - s.y, P.x - s.x), k = Math.round((me - s.a) / s.step - 0.5) + 0.5, a = s.a + k * s.step; return [s.x + Math.cos(a) * d, s.y + 4 + Math.sin(a) * d]; },
        // The Unmaker: the doorway of the wall that comes next
        unmaker: (e, ph) => { const s = next(ph, s => { const at = s.from + (s.across ? s.vy : s.vx) * s.sp * s.t, me = s.across ? P.y - 4 : P.x; return (me - at) * (s.across ? s.vy : s.vx) / s.sp; }); if (!s) return null; return s.across ? [s.door, P.y] : [P.x, s.door + 4]; },
      };
      const bad = [], notes = [], N = [6, 7, 5];
      ok('wardens: the phase is at 60% of health, with a tell of nine tenths of a second, as the docs say', RW.PHASE.at === 0.6 && RW.PHASE.tell === 0.9 && RW.PHASE.fast === 1.3 && ids.every((id, f) => RW.PHASES[id].n === N[f]), JSON.stringify(RW.PHASE));
      ids.forEach((id, f) => {
        const still = fight(f, 60, null), plain = fight(f, 100, walks[id]), furious = fight(f, 100, walks[id], { fury: 1 });
        const calm = [], angry = []; for (const d of [70, 100, 130]) for (const ang of [0, 2.2, 4.3]) { calm.push(fight(f, d, walks[id], { ang })); angry.push(fight(f, d, walks[id], { ang, rage: 1 })); }
        const strolls = [0, 2.2, 4.3].map(ang => fight(f, 100, walks[id], { ang, stroll: 1 }));
        if (!still.ended || still.shots !== N[f]) bad.push(id + ': the phase did not run through (' + still.shots + ' volleys)');
        if (still.tell < HZ * 0.5) bad.push(id + ': a tell of ' + (still.tell / HZ).toFixed(2) + ' s');
        if (still.name !== RW.PHASES[id].name) bad.push(id + ': no announcement (' + still.name + ')');
        if (still.hits < 1) bad.push(id + ': standing still costs nothing');
        if (calm.some(r => r.hits) || angry.some(r => r.hits)) bad.push(id + ': the way through was hit, calm ' + calm.map(r => r.hits).join('') + ', enraged ' + angry.map(r => r.hits).join(''));
        if (strolls.some(r => r.hits)) bad.push(id + ': hit after walking on during the tell, ' + strolls.map(r => r.hits + (r.by ? ' ' + r.by : '')).join('/'));
        const enraged = fight(f, 100, walks[id], { rage: 1 });
        if (!(enraged.frames < plain.frames * 0.92)) bad.push(id + ': enraged it is not faster (' + enraged.frames + ' against ' + plain.frames + ' frames)');
        if (Math.abs(furious.frames - plain.frames) > 2) bad.push(id + ': fury changes the phase (' + furious.frames + ' against ' + plain.frames + ' frames)');
        notes.push(id + ': tell ' + (still.tell / HZ).toFixed(2) + ' s, ' + still.shots + ' volleys, up to ' + still.bullets + ' bullets, ' + (plain.frames / HZ).toFixed(1) + ' s (enraged ' + (enraged.frames / HZ).toFixed(1) + ' s), standing still ' + still.hits + ' hits, walking ' + Math.round(plain.moved) + ' px');
      });
      ok('wardens: each has a bullet phase with a tell and an announcement; a delver that only walks gets through unhurt from three sides at three distances, calm and enraged, also when it walked on during the tell; standing still is hit; enraged it is faster and fury leaves it alone', bad.length === 0, bad.join('; ') || notes.join(' | '));
      // a warden that stands right under the upper wall still fires its rings into the room
      { const top = 2 * T + 5, a = fight(0, 80, null, { at: [RW.K.CWP / 2, top], ang: 1.57 }), m = fight(1, 80, null, { at: [RW.K.CWP / 2, top], ang: 1.57 });
        ok('wardens: right under a wall, Gatejaw and Mother Morel still fill the room', a.first >= 10 && m.first >= 4, 'bullets alive after the first ring: ' + a.first + ' and ' + m.first); }
      // touching: Gatejaw hurts during its phase, the Unmaker is thin air while it builds (and solid during the tell)
      { const on = (f, when) => fight(f, 90, null, { each: (e, ph, out) => { if (ph.st === when && !out.done) { P.x = e.x; P.y = e.y; if (ph.st) out.done = 1; } if (out.done && ph.shots.length > 1 && ph.shots[0].t > 0.4) { P.x = e.x + 400; P.y = e.y; } } });
        const g = on(0, 1), u = on(2, 1), ut = on(2, 0);
        ok('wardens: Gatejaw hurts to touch during its phase; the Unmaker does not while it builds, but does during the tell', g.bys[0] === 'gatejaw touch' && u.hits === 0 && ut.bys[0] === 'unmaker touch', JSON.stringify({ gatejaw: g.bys[0], building: u.hits, tell: ut.bys[0] })); }
      // Mother Morel keeps smothering the room she stands in
      { fresh(157); RW.enterFloor(1); G = RW.G; P = G.P; const room = build('hall'); G.dir.calm = 1e9; const e = RW.summonBoss(null); e.emerge = 0; e.evx = e.evy = 0; e.x = room.px + RW.K.CWP / 2; e.y = room.py + RW.K.CHP / 2; P.x = G.rooms[0].px + 60; P.y = G.rooms[0].py + 60;
        e.st = 0; e.stT = 99; e.hp = Math.round(e.max * 0.6) - 1; RW.step(50); room.hexT = 0; RW.step(40); const during = !!e.ph && e.ph.st === 1 && room.hexT > 0;
        ok('wardens: Mother Morel smothers her room while she blooms', during, 'in her phase: ' + !!e.ph + ', the room is smothered for ' + room.hexT.toFixed(2) + ' s'); }
      // the Unmaker's walls: from the side farthest from the delver, whichever that is, each doorway inside the room and 30 to 46 px beside the last
      { const W = RW.K.CWP, H = RW.K.CHP, spots = [[W / 2, 2 * T + 20, 2], [W - 2 * T - 20, H / 2, 3], [W / 2, H - 2 * T - 20, 0], [2 * T + 20, H / 2, 1]], wrong = [];
        for (const [x, y, side] of spots) { const r = fight(2, 0, walks.unmaker, { at: [W / 2, H / 2], P: [x, y] }), d = r.doors, lo = r.box ? (side & 1 ? r.box[1] : r.box[0]) : 0, hi = r.box ? (side & 1 ? r.box[3] : r.box[2]) : 0;
          if (r.side !== side) wrong.push('from side ' + r.side + ', not ' + side); if (r.hits) wrong.push('side ' + side + ': ' + r.hits + ' hits (' + r.by + ')'); if (d.length !== 5) wrong.push('side ' + side + ': ' + d.length + ' walls');
          for (let i = 0; i < d.length; i++) { if (d[i] < lo + 22 || d[i] > hi - 22) wrong.push('side ' + side + ': a doorway at the edge'); if (i && (Math.abs(d[i] - d[i - 1]) < 29.9 || Math.abs(d[i] - d[i - 1]) > 46.1)) wrong.push('side ' + side + ': doorways ' + Math.abs(d[i] - d[i - 1]).toFixed(0) + ' px apart'); } }
        ok('wardens: the Unmaker\'s walls come from the side farthest from the delver, each with a doorway in the room, 30 to 46 px beside the last; walking gets through from every side', wrong.length === 0, wrong.join('; ')); }
      // it starts at a fixed share of health, once, and only between two attacks
      { const busy = [1, 4, 1], res = ids.map((id, f) => { fresh(155 + f); RW.enterFloor(f); G = RW.G; P = G.P; const e = RW.summonBoss(null); e.emerge = 0; G.dir.calm = 1e9; P.x = e.x + 150; e.st = 0; e.stT = 99; e.hp = Math.round(e.max * 0.6) + 5; RW.step(30); const before = !!e.ph;
          e.hp = Math.round(e.max * 0.6) - 1; e.st = busy[f]; e.stT = 0.3; e.shootT = 9; RW.step(5); const mid = !!e.ph; e.st = 0; e.stT = 99; RW.step(2); const now = !!e.ph;
          for (let i = 0; i < 60 * 30 && e.ph; i++) { e.hp = Math.max(e.hp, 10); RW.step(1); } e.st = 0; e.stT = 99; RW.step(60); return { before, mid, now, again: !!e.ph, phased: !!e.phased }; });
        ok('wardens: the phase starts at 60% of its health, between two attacks, and once in a fight', res.every(r => !r.before && !r.mid && r.now && !r.again && r.phased), JSON.stringify(res)); }
    }
    /* ---- the screen's rules (#14): a top layer that nothing covers, flashes kept apart, a beat for the big moments ---- */
    { fresh(131); RW.step(20); const cvs = document.getElementById('game'), c2 = cvs.getContext('2d'), V = RW.view();
      const shot = () => { G.shake = 0; RW.render(); return c2.getImageData(0, 0, V.VW, V.VH).data; };
      const opaque = s => { const d = s.c.getContext('2d').getImageData(0, 0, s.w, s.h).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 200) n++; return n; };
      G.ebullets.length = 0; G.picks.length = 0; G.fxs.length = 0; G.parts.length = 0; G.texts.length = 0; G.flashT = 0;
      for (let i = 0; i < 6; i++) G.ebullets.push({ x: P.x - 60 + i * 24, y: P.y - 44, vx: 0, vy: 0, t: 0, spr: 's_ebullet', life: 99, by: 'tin' });
      for (const [i, k] of ['key', 'heart', 'glint'].entries()) G.picks.push({ k, x: P.x - 30 + i * 30, y: P.y + 34, v: 1, vx: 0, vy: 0, t: 0, mag: false, ms: 70, gone: false });
      P.inv = 0;                           // an unhurt delver is drawn on every frame
      const room0 = G.rooms[0], props0 = room0.props; room0.props = [];        // nothing in front of the delver for now
      const plain = shot(), cam = G.view;
      // the heaviest things the game draws, right on top of each of them: a blast, a block of particles, a number, and the screen's flash
      for (const o of [...G.ebullets, ...G.picks, { x: P.x, y: P.y - 8 }]) {
        G.fxs.push({ k: 'boom', x: o.x, y: o.y, R: 40, t: 0.03, d: 0.3 });
        for (let i = 0; i < 49; i++) G.parts.push({ x: o.x - 10 + (i % 7) * 3, y: o.y - 12 + Math.floor(i / 7) * 3, vx: 0, vy: 0, life: 1, max: 1, col: '#fff8e8', size: 3, grav: 0 });
        G.texts.push({ x: o.x, y: o.y, n: 888, col: 'y', t: 0.2, d: 1 });
      }
      G.flashT = 0.3; const heavy = shot();
      // a pixel of the top layer is the same in both pictures; everything else in the box has the flash over it
      const same = (x, y, w, h) => { let n = 0; for (let j = Math.round(y); j < Math.round(y) + h; j++) for (let i = Math.round(x); i < Math.round(x) + w; i++) { const k = (j * V.VW + i) * 4; if (plain[k] === heavy[k] && plain[k + 1] === heavy[k + 1] && plain[k + 2] === heavy[k + 2]) n++; } return n; };
      const bs = RW.SPR.s_ebullet, hidden = G.ebullets.filter(b => same(b.x - cam.cx - bs.ax, b.y - cam.cy + 3 - bs.ay, bs.w, bs.h) < opaque(bs)).length;
      ok('top layer: every enemy bullet shows whole through a blast, particles, numbers and the flash', hidden === 0, hidden + ' of ' + G.ebullets.length + ' covered; a bullet is ' + opaque(bs) + ' pixels');
      const dv = RW.SPR[G.hero + 'D0'], seen = same(P.x - cam.cx - 10, P.y - cam.cy - 20, 20, 24);
      ok('top layer: so does the delver', seen >= opaque(dv) * 0.8, seen + ' pixels unchanged, the sprite has ' + opaque(dv));
      const ps = G.picks.map(q => same(q.x - cam.cx - 9, q.y - cam.cy - 18, 18, 26)), need = [opaque(RW.SPR.key), opaque(RW.SPR.heart), opaque(RW.SPR.glint0)];
      ok('top layer: and the pickups', ps.every((n, i) => n >= need[i]), ps.join(' ') + ' unchanged of ' + need.join(' '));
      // a pillar in front of the delver: there the second drawing is cut out, and the delver stays behind it
      G.picks.length = 0; G.ebullets.length = 0; room0.props = [{ kind: 'pillar', spr: 'pillar', x: P.x + 4, y: P.y + 9, room: room0 }];
      G.fxs.length = 0; G.parts.length = 0; G.texts.length = 0; G.flashT = 0; const plain2 = shot(); G.flashT = 0.3; const flash2 = shot();
      let whole = 0, behind = 0; { const pl = RW.SPR.pillar, px0 = Math.round(P.x + 4 - cam.cx) - pl.ax, py0 = Math.round(P.y + 9 - cam.cy) - pl.ay;
        for (let j = Math.round(P.y - cam.cy) - 20; j < Math.round(P.y - cam.cy) + 4; j++) for (let i = Math.round(P.x - cam.cx) - 10; i < Math.round(P.x - cam.cx) + 10; i++) {
          const k = (j * V.VW + i) * 4, eq = plain2[k] === flash2[k] && plain2[k + 1] === flash2[k + 1] && plain2[k + 2] === flash2[k + 2], inPillar = i >= px0 && i < px0 + pl.w && j >= py0 && j < py0 + pl.h;
          if (eq && !inPillar) whole++; if (eq && inPillar) behind++; } }
      ok('top layer: a prop in front of the delver still hides it, and the rest of the delver stays on top', whole > 20 && behind === 0, whole + ' pixels on top beside the pillar, ' + behind + ' over it');
      // the flash is a tint: how much of the way to its red a plain floor pixel moves
      { let n = 0, sum = 0, most = 0; for (let k = 0; k < plain2.length; k += 4 * 97) { const p0 = plain2[k], f0 = flash2[k]; if (p0 > 160 || f0 === p0) continue; const a = (f0 - p0) / (232 - p0); sum += a; n++; most = Math.max(most, a); }
        ok('flashes: the flash is a tint that covers at most 0.27 of the picture', n > 50 && most <= 0.3 && sum / n > 0.2 && sum / n <= 0.275, 'mean ' + (sum / n).toFixed(3) + ', most ' + most.toFixed(3) + ' over ' + n + ' pixels'); }
      room0.props = props0; G.flashT = 0; P.inv = 1e9;
      // flashes: hurt on every frame for three seconds, and count how often the screen's flash starts
      let starts = 0, was = 0, worst = 0; const at = [];
      for (let f = 0; f < 180; f++) { if (f % 5 === 0) { P.inv = 0; P.shield = 0; P.hp = P.maxHp; RW.hurtPlayer(1); } RW.step(1); if (G.flashT > was) { starts++; at.push(f); } was = G.flashT; }
      for (const f of at) worst = Math.max(worst, at.filter(x => x >= f && x < f + 60).length);
      ok('flashes: hurt twelve times a second, the screen still flashes at most three times in any second', starts > 3 && worst <= 3, starts + ' flashes in 3 s, at most ' + worst + ' in one second');
      // the beats: an elite's death against a small monster's
      fresh(132); const heard = [], play = RW.Snd.play; RW.Snd.play = (n, a) => { heard.push(n); return play(n, a); };
      try {
        let m = RW.spawnMon('slime', P.x + 30, P.y); heard.length = 0; G.shake = 0; G.freeze = 0; RW.killMon(m); const small = { boom: heard.includes('boom'), shake: G.shake, freeze: G.freeze, rings: G.fxs.length };
        m = RW.spawnMon('kslime', P.x + 30, P.y); heard.length = 0; G.shake = 0; G.freeze = 0; G.fxs.length = 0; RW.killMon(m); const big = { boom: heard.includes('boom'), shake: G.shake, freeze: G.freeze, rings: G.fxs.length };
        ok('beats: an elite\'s death has a boom, a ring and a shake; a small monster\'s has none', big.boom && big.rings > 0 && big.shake >= 6 && !small.boom && small.rings === 0 && small.shake < big.shake, JSON.stringify({ small, big }));
        ok('beats: neither holds the game, so no key press is lost to a kill', big.freeze === 0 && small.freeze === 0, big.freeze);
        fresh(133); const wid = P.weapons[0].id, er = Object.keys(RW.EVO_ROOM).find(r => RW.EVO_ROOM[r] === wid); P.weapons[0].lv = RW.WEAPONS[wid].max;
        const room = build(er); heard.length = 0; G.fxs.length = 0; tp(...mid(room)); let n = 0; while (!P.weapons[0].evo && n++ < 240) RW.step(1);
        ok('beats: an evolution holds the game for a moment, bursts a ring and has a sound of its own', P.weapons[0].evo && G.freeze > 0.5 && G.fxs.some(f => f.k === 'tide') && heard.includes('evolve'), wid + ' in ' + er + ': freeze ' + G.freeze.toFixed(2) + ', ' + heard.join(' '));
      } finally { RW.Snd.play = play; } }
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
