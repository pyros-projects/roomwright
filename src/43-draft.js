/* =============================== 13 DRAFT ============================= */
// Pushing a key into a sealed door deals cards: most from your deck, the last one native to the
// floor. Each card is a room (element, power, level), a boon, and a set of new doors.
// Exits are relative to the way you walk in: [straight, left, right].
const EXITS = [{ m: [0, 0, 0], w: 0.5 }, { m: [1, 0, 0], w: 3 }, { m: [0, 1, 0], w: 2 }, { m: [0, 0, 1], w: 2 }, { m: [0, 1, 1], w: 2 }, { m: [1, 1, 0], w: 2 }, { m: [1, 0, 1], w: 2 }, { m: [1, 1, 1], w: 1.5 }];
const mapLevel = () => G.rooms.some(r => r.type === 'maproom' && roomLive(r)) ? roomLevel('maproom') : 0;
const stairsReady = () => G.fstat.rooms >= STAIRS_MIN && !G.dir.boss && !G.dir.stairsBuilt && !G.bossDown;
const draftSize = () => 3 + (mapLevel() > 0 ? 1 : 0);

function rollExits(type, cx, cy, entry, minAfter) {
  const def = ROOM_TYPES[type]; let want, plan, tries = 0;
  do {
    const ex = def.dead ? EXITS[0] : def.exits ? { m: def.exits } : wpick(def.exits0 ? EXITS : EXITS.slice(1), e => e.w);
    want = [0, 0, 0, 0]; want[(entry + 2) % 4] = ex.m[0]; want[(entry + 1) % 4] = ex.m[1]; want[(entry + 3) % 4] = ex.m[2];
    plan = planDoors(cx, cy, entry, want);
  } while (++tries < 40 && !def.dead && !def.exits && G.sealed.length - 1 - plan.links + plan.fresh < minAfter);
  return { want, plan };
}
function makeCards(door) {
  const cx = door.room.cx + DIRS[door.dir].x, cy = door.room.cy + DIRS[door.dir].y, entry = (door.dir + 2) % 4;
  const first = G.stats.rooms === 0, n = draftSize(), minAfter = G.rooms.length < 4 ? 2 : 1;
  const used = new Set(), usedB = new Set(), cards = [];
  // a dead end is only dealt when it would not leave the floor without a single knocking door
  const okType = id => !used.has(id) && !(id === 'den' && G.rooms.length < 4) && !(ROOM_TYPES[id].dead && G.sealed.length - 1 < minAfter);
  for (let i = 0; i < n; i++) {
    const wantNative = i === n - 1;
    let pool = (wantNative ? G.F.natives : G.deck).filter(okType);
    if (!pool.length) pool = G.deck.concat(G.F.natives).filter(okType);
    if (!pool.length) pool = ['hall'];
    const type = wpick(pool, id => ROOM_TYPES[id].w); used.add(type);
    const ex = rollExits(type, cx, cy, entry, minAfter);
    const boon = rollBoon(usedB, first && i < 2); usedB.add(boon.kind + boon.id);
    cards.push({ type, want: ex.want, boon, plan: ex.plan, native: wantNative && G.F.natives.indexOf(type) >= 0 });
  }
  return cards;
}
// everything the card face needs that depends on the dungeon as it is right now
function refreshCard(c, cx, cy, entry) {
  const def = ROOM_TYPES[c.type], own = G.owned[c.type] || 0, lv = own ? roomLevel(c.type) : 0;
  c.plan = planDoors(cx, cy, entry, c.want);
  c.lv = lv; c.lvTo = own ? Math.min(def.max, lv + 1) : Math.min(def.max, 1 + (charm('blueprint') ? 1 : 0));
  c.res = previewRes(cx, cy, c.type, c.plan.doors);
  c.over = previewOver(cx, cy, c.type, c.plan.doors, c.lvTo);
  c.mul = 1; c.hidden = c.type === 'dice';
  if (c.hidden) c.mul = 2;
  for (let d = 0; d < 4; d++) { const nx = cx + DIRS[d].x, ny = cy + DIRS[d].y, nb = inGrid(nx, ny) ? G.cells[ny * GRID + nx] : null; if (nb && nb.type === 'script' && roomLive(nb)) c.mul = 2; }
  c.fresh = !Save.data.rooms[c.type];
  const ev = EVO_ROOM[c.type], w = ev && G.P.weapons.find(w => w.id === ev);
  c.evo = w && !w.evo ? { id: ev, ready: w.lv >= WEAPONS[ev].max, lv: w.lv } : null;
  const before = G.sealed.length, after = before - 1 - c.plan.links + c.plan.fresh;
  c.pressure = Math.round((CURVE.pressure(after, charm('wedge'), G.floor) / CURVE.pressure(before, charm('wedge'), G.floor) - 1) * 100);
}
function openDraft(door) {
  const cx = door.room.cx + DIRS[door.dir].x, cy = door.room.cy + DIRS[door.dir].y, entry = (door.dir + 2) % 4;
  if (!door.cards || door.cards.length !== draftSize()) door.cards = makeCards(door);
  const used = new Set();
  for (const c of door.cards) {       // cards persist per door, so refresh anything that went stale since the last peek
    if (!boonValid(c.boon) || used.has(c.boon.kind + c.boon.id)) c.boon = rollBoon(used, false);
    used.add(c.boon.kind + c.boon.id); refreshCard(c, cx, cy, entry);
  }
  const stairs = stairsReady();
  G.draft = { door, cards: door.cards, sel: Math.min(1, door.cards.length - 1), t: 0, cx, cy, entry, stairs, locked: stairs ? 0 : stairsLocked(), coach: null, onStairs: false, rerolls: Math.max(0, mapLevel() - 1 - door.rerolled) };
  App.mode = 'draft'; sfx('draft'); coachStart(G.draft, false);
  if (G.tut.step <= 1) G.tut.step = 2;
  if (stairs) tip('stairs', 'The STAIRWELL is on offer now (press DOWN in a draft). Its warden guards the way to the next floor.');
}
function closeDraft() { G.draft = null; App.mode = 'play'; sfx('back'); }
// Knock back (R in a draft, once a Map Room has no free deal left): new cards behind this door, the key stays,
// and the door answers. KNOCK[k] is the price of the k-th knock on a floor: a pack out of this very door.
// The first is moderate. From the second on you pay: a bigger pack, all of it enraged, led by the floor's elite
// and by dice that throw rings of bullets (from the third knock on, a loaded die twice the size), and the
// warden's clock runs shorter. Monsters called this way carry no glints and no hearts, so a knock never farms.
const KNOCK = [{ n: 8, elites: 0, dice: 0, big: 0, clock: 0 }, { n: 18, elites: 1, dice: 2, big: 0, clock: 30 }, { n: 26, elites: 2, dice: 3, big: 1, clock: 45 }];
const knockTier = () => Math.min(G.fstat.knocks, KNOCK.length - 1);
function knockBack() {
  const D = G.draft; if (!D) return false;
  const d = D.door, k = G.fstat.knocks, K = KNOCK[knockTier()], mixl = floorMix(), more = Math.max(0, k - (KNOCK.length - 1));
  const n = K.n + G.floor * Math.round(K.n / 4) + more * 6, elites = Math.min(3, K.elites + more), big = Math.min(3, K.big + more);
  G.fstat.knocks++; G.fstat.wrath += K.clock; d.cards = makeCards(d); d.hold = true;
  for (let i = 0; i < K.dice; i++) d.queue.push({ id: 'die', rage: true });
  for (let i = 0; i < big; i++) d.queue.push({ id: 'bigdie', rage: true });
  for (let i = 0; i < elites; i++) d.queue.push({ id: G.F.elite, rage: true });
  for (let i = 0; i < n; i++) d.queue.push({ id: wpick(mixl, x => x[1])[0], rage: k > 0 });
  d.shake = 1.2; G.shake = Math.max(G.shake, k > 0 ? 8 : 4); sfx('breach'); if (k > 0) sfx('roar');
  banner(k === 0 ? 'KNOCK BACK' : k === 1 ? 'KNOCK BACK!' : 'KNOCK BACK!!',
    k === 0 ? 'The door answers.' : k === 1 ? 'The dice are cast. They are angry, and the warden stirs.' : 'The house always wins. Everything behind that door is coming.', k === 0 ? '#ff9ec4' : '#ff7a7a', 3);
  G.draft = null; App.mode = 'play';
  return true;
}
function rerollDraft() {
  const D = G.draft; if (!D || D.rerolls <= 0) return false;
  D.door.rerolled++; D.door.cards = makeCards(D.door); D.cards = D.door.cards; D.rerolls--; D.t = 0; D.sel = Math.min(D.sel, D.cards.length - 1);
  for (const c of D.cards) refreshCard(c, D.cx, D.cy, D.entry);
  sfx('draft'); return true;
}
// put a room behind the door being drafted, link it to its neighbours and return it
function placeRoom(type, want) {
  const D = G.draft, door = D.door, P = G.P;
  P.keys--; openDoor(door.room, door.dir);
  const plan = planDoors(D.cx, D.cy, D.entry, want);
  const room = buildRoom(D.cx, D.cy, type, plan.doors, D.entry);
  for (let s = 0; s < 4; s++) if (s !== D.entry && plan.doors[s] === 2) { const nb = G.cells[(D.cy + DIRS[s].y) * GRID + D.cx + DIRS[s].x]; if (nb) openDoor(nb, (s + 2) % 4); }
  refreshSealed(); recalcLinks(); computeFlow(true);
  G.draft = null; App.mode = 'play'; sfx('build'); G.shake = Math.max(G.shake, 3);
  for (let k = 0; k < 14; k++) part(door.x + (fxr() - 0.5) * 44, door.y + (fxr() - 0.5) * 30, (fxr() - 0.5) * 60, -fxr() * 50, 0.5, PAL.W, 2, 90);
  return room;
}
function chooseCard(i) {
  const card = G.draft.cards[i], type = card.type, def = ROOM_TYPES[type], had = G.owned[type] || 0;
  let levelled = false;
  G.owned[type] = had + 1;
  if (!had) G.roomLv[type] = Math.min(def.max, 1 + (charm('blueprint') ? 1 : 0));
  else if (G.roomLv[type] < def.max) { G.roomLv[type]++; levelled = true; }
  const room = placeRoom(type, card.want);
  room.boon = card.boon; room.boonMul = card.mul || 1;
  G.stats.rooms++; G.fstat.rooms++;
  if (levelled) {
    repaintType(type); recalcLinks(); syncBees(); recalc(); sfx('star');
    banner(def.name.toUpperCase() + ' ' + '```'.slice(0, G.roomLv[type]), 'Every ' + def.name + ' you own is stronger: ' + def.lv[G.roomLv[type] - 1], '#ffd95e', 2.8);
    tip('lvl', 'Drafting a room type you already own levels it up for the whole run.');
  }
  if (!G.demo && !Save.data.rooms[type]) {       // found in the wild: it joins your collection for future decks
    Save.data.rooms[type] = 1; Save.store(); G.newCards.push(type); sfx('unlock');
    banner('NEW CARD: ' + def.name.toUpperCase(), 'Added to your collection. You can put it in a deck.', '#9cecf2', 3);
  }
  if (room.res > 0) tip('res', 'Connected rooms of the same element resonate: each makes the other stronger.');
  if (G.tut.step === 2) { G.tut.step = 3; G.tut.t = 0; }
  return room;
}
function chooseStairs() {
  const room = placeRoom('stairs', [0, 0, 0, 0]);
  G.dir.stairsBuilt = true;
  banner('THE STAIRWELL', 'Something climbs the steps to meet you...', '#c8c8e0', 2.6);
  return room;
}
