/* ============================= 15 GAME LOOP =========================== */
// modes: (intro ->) title -> prep (<-> deck) -> play <-> draft / pause -> descend -> play ... -> over | win
//        title <-> changes (the changelog), title <-> music (the music player, 62-music-player)
const App = { mode: 'title', prevMode: '', modeT: 0, sel: 0, fade: null, record: false, big: {}, manual: false, coach: true, titleT: 0, titleRoom: 0, titleSel: '', titlePtr: false,
  changes: { y: 0 }, prep: { i: 0 }, deck: { cur: 0, msg: '', msgT: 0 }, descend: null };

// ---- save data: options, records, and the meta-game (cards collected, heroes, one deck per hero) ----
const Save = {
  KEY: 'roomwright.v2' + ((location.pathname.match(/\/(v\d+(?:\.\d+)*)\//) || [])[1] ? '.' + location.pathname.match(/\/(v\d+(?:\.\d+)*)\//)[1] : ''),   // a preview served from a version folder (.../v0.3/) keeps its own save
  data: null,
  fresh() {
    const rooms = {}; for (const id of STARTER_ROOMS) rooms[id] = 1;
    return { v: 2, runs: 0, wins: 0, best: { time: 0, rooms: 0, kills: 0, floor: 0 }, opts: { music: 0.6, sfx: 0.8, shake: 1, mute: 0, mouse: 'point', grow: 'full' }, rooms, heroes: { pip: 1 }, hero: 'pip', decks: {}, tips: {}, census: [], daily: [],
      stakes: {}, stake: {} };          // Stakes per delver: the highest step won (0 = the plain game), and the step chosen for the next run
  },
  load() {
    this.data = this.fresh();
    try {
      const s = JSON.parse(localStorage.getItem(this.KEY));
      if (s && s.v === 2) {
        const d = this.data; d.runs = s.runs | 0; d.wins = s.wins | 0; Object.assign(d.best, s.best); Object.assign(d.opts, s.opts); if (!Object.keys(GROW_WAYS).includes(d.opts.grow)) d.opts.grow = 'full';
        for (const id in s.rooms || {}) if (ROOM_TYPES[id] && ROOM_TYPES[id].tier !== 'x') d.rooms[id] = 1;
        for (const id in s.heroes || {}) if (HEROES[id]) d.heroes[id] = 1;
        if (HEROES[s.hero] && d.heroes[s.hero]) d.hero = s.hero;
        for (const id in s.decks || {}) if (HEROES[id] && Array.isArray(s.decks[id])) d.decks[id] = s.decks[id].filter(r => typeof r === 'string');
        Object.assign(d.tips, s.tips);
        if (Array.isArray(s.census)) d.census = s.census.filter(r => r && typeof r === 'object').slice(-CENSUS_MAX);
        if (Array.isArray(s.daily)) d.daily = s.daily.filter(r => r && typeof r === 'object' && Number.isInteger(r.day) && HEROES[r.hero] && (r.open === true || (Number.isFinite(r.floor) && Number.isFinite(r.time)))).slice(-DAILY_KEEP);
        for (const id in s.stakes || {}) if (HEROES[id]) d.stakes[id] = clamp(s.stakes[id] | 0, 0, STAKES.length);
        if (!s.stakes && d.wins > 0) for (const id in d.heroes) d.stakes[id] = 0;       // a save from before Stakes that has won: the first step is open
        for (const id in s.stake || {}) if (HEROES[id]) d.stake[id] = clamp(s.stake[id] | 0, 0, stakesOpen(id));
      } else { const old = JSON.parse(localStorage.getItem('roomwright.v1')); if (old && old.opts) Object.assign(this.data.opts, old.opts); }   // keep v0.1 volume settings
    } catch (e) { /* storage unavailable or corrupt: play without persistence */ }
    this.apply();
  },
  store() { try { localStorage.setItem(this.KEY, JSON.stringify(this.data)); } catch (e) { /* ignore */ } },
  apply() { const o = this.data.opts; Snd.vol.music = o.mute ? 0 : o.music; Snd.vol.sfx = o.mute ? 0 : o.sfx; Snd.applyVol(); Snd.grow(o.grow); Intro.vol(); },
};
// Stakes: the highest step this delver may play (one above the highest won; 0 until a first win), and the step chosen
const stakesOpen = id => { const won = Save.data.stakes[id]; return won === undefined ? 0 : Math.min(STAKES.length, won + 1); };
const stakeOf = id => clamp(Save.data.stake[id] | 0, 0, stakesOpen(id));
// the deck a hero will bring: their saved list, cleaned up and topped up to DECK_SIZE from cards you own
function deckFor(hid) {
  const own = Save.data.rooms, hero = HEROES[hid], out = [];
  const add = id => { if (out.length < DECK_SIZE && own[id] && out.indexOf(id) < 0 && ROOM_TYPES[id] && ROOM_TYPES[id].tier !== 'x') out.push(id); };
  (Save.data.decks[hid] || hero.deck).forEach(add);
  if (!Save.data.decks[hid]) { hero.deck.forEach(add); STARTER_ROOMS.forEach(add); Object.keys(own).forEach(add); }
  return out;
}
function fullDeck(hid) { const d = deckFor(hid), own = Save.data.rooms; for (const id of HEROES[hid].deck.concat(STARTER_ROOMS, Object.keys(own))) if (d.length < DECK_SIZE && own[id] && d.indexOf(id) < 0) d.push(id); return d; }
function grantBossUnlocks(f) {
  if (G.demo) return; const u = BOSS_UNLOCKS[f], d = Save.data; if (!u) return;
  const card = id => { if (id && !d.rooms[id]) { d.rooms[id] = 1; G.newCards.push(id); } };
  if (!d.heroes[u.hero]) { d.heroes[u.hero] = 1; G.newHeroes.push(u.hero); card(HEROES[u.hero].sig); }
  u.rooms.forEach(card);
  d.best.floor = Math.max(d.best.floor, f + 1); Save.store();
  if (G.newHeroes.length || G.newCards.length) sfx('unlock');
}

function resize() {
  const ww = innerWidth, wh = innerHeight; let s = Math.min(ww / 400, wh / 225); s = s >= 1 ? Math.floor(s) : Math.max(0.2, s);
  VW = clamp(Math.ceil(ww / s), 400, 640); VH = clamp(Math.ceil(wh / s), 225, wh > ww ? 600 : 360); SCALE = s;   // portrait phones get a tall view
  cv.width = VW; cv.height = VH; cv.style.width = Math.round(VW * s) + 'px'; cv.style.height = Math.round(VH * s) + 'px';
  ctx.imageSmoothingEnabled = false; Intro.layout();
}
function startFade(cb) { if (!App.fade) App.fade = { t: 0, d: 0.38, phase: 0, cb }; }

// a little pre-built dungeon to drift over behind the title (never touches the save)
function makeShowcase() {
  newRun((Math.random() * 1e9) | 0, { hero: Save.data.hero }); G.demo = true;
  const deep = clamp(Save.data.best.floor + 1, 1, FLOORS.length); if (deep > 1) enterFloor(Math.floor(Math.random() * deep));
  G.P.hidden = true; G.P.keys = 99; G.dir.calm = 1e9;
  sfx.quiet = true;                   // nine rooms are built in this one instant: none of it is to be heard
  try { for (let i = 0; i < 9 && G.sealed.length; i++) { openDraft(pick(G.sealed)); const room = chooseCard(ri(0, G.draft.cards.length - 1)); room.reveal = 1; room.seen = true; onRoomReady(room); } }
  finally { sfx.quiet = false; }
  G.parts.length = 0; G.shake = 0; G.banner = null; G.draft = null; G.tipQ.length = 0;
  App.mode = 'title'; App.titleRoom = 0; App.titleT = 0; App.titleSel = '';
  G.cam.x = G.rooms[0].px + CWP / 2 - VW / 2; G.cam.y = G.rooms[0].py + CHP / 2 - VH / 2;
}
// ---- the daily delve (#18) ----
// Everyone gets the same run for a day. The seed comes from the date (UTC), and so do the delver and the deck: the
// four delvers take turns, each with its own ten cards, whatever the save holds. Day 1 is 2026-11-22. The first
// attempt of a day counts, also when it is left unfinished; later ones are practice. The save keeps the last
// DAILY_KEEP days. Nothing leaves the browser.
const DAILY_EPOCH = Date.UTC(2026, 10, 22) / 864e5, DAILY_KEEP = 14, DAILY_HEROES = ['pip', 'wick', 'brin', 'moss'];
const Daily = { now: null };          // Daily.now: a fixed moment in ms for the checks; null = the clock
const dailyInfo = ms => dailyOf(Math.floor((ms !== undefined ? ms : Daily.now !== null ? Daily.now : Date.now()) / 864e5) - DAILY_EPOCH + 1);
function dailyOf(day) {
  let h = Math.imul(day ^ 0x9e3779b9, 2654435761) >>> 0; h ^= h >>> 15; h = Math.imul(h, 2246822519) >>> 0; h ^= h >>> 13;
  const hero = DAILY_HEROES[((day % DAILY_HEROES.length) + DAILY_HEROES.length) % DAILY_HEROES.length];
  return { day, seed: (h >>> 0) % 2147483647, hero, deck: HEROES[hero].deck.slice() };
}
const dailyDone = day => Save.data.daily.find(r => r.day === day);
function startDaily(day) {            // today's delve; or, with a day's number, that day's again (as practice: it is on file)
  const d = day === undefined ? dailyInfo() : dailyOf(day), first = !dailyDone(d.day);
  newRun(d.seed, { hero: d.hero, deck: d.deck, tutorial: false, stakes: 0, daily: { day: d.day, practice: !first } });
  if (first) { const L = Save.data.daily; L.push({ day: d.day, hero: d.hero, won: false, floor: 1, time: 0, rooms: 0, open: true }); while (L.length > DAILY_KEEP) L.shift(); }
  Save.store();                       // (a daily does not count as one of the first runs: the tutorial waits for an ordinary one)
  App.mode = 'play'; App.sel = 0; App.record = false; floorMusic();
  banner('DAILY DELVE ' + d.day, first ? 'One try counts. Everyone gets these floors today.' : 'Practice. Your first try today has counted.', '#ffd95e', 3.4);
}
// the counted attempt ends: by a win, a death, or by leaving the run
function dailyClose(win) {
  if (!G.daily || G.daily.practice) return; const r = dailyDone(G.daily.day); if (!r || !r.open) return;
  r.won = !!win; r.floor = G.floor + 1; r.time = Math.round(G.tRun); r.rooms = G.stats.rooms; delete r.open; Save.store();
}
// what the end screen says about a daily run, and what the title says about today
function dailyEndLine() {
  const d = G.daily, r = d && dailyDone(d.day); if (!r) return '';
  return d.practice ? 'Daily delve ' + d.day + ', practice. First try: ' + (r.open ? 'begun' : r.won ? 'won' : 'floor ' + r.floor) + '.' : dailyLine(r) + '.';
}
function dailyTitleLine() {
  const d = dailyInfo(), r = dailyDone(d.day);
  return r ? dailyLine(r) + '. Again is practice.' : 'Daily delve ' + d.day + ' as ' + HEROES[d.hero].name + '. One try counts.';
}
// one line for the end screen and the title: the day's number and what came of it
function dailyLine(r) {
  if (!r) return '';
  return 'Daily delve ' + r.day + ': ' + (r.open ? 'begun' : r.won ? 'won in ' + fmtTime(r.time) : 'floor ' + r.floor + ' in ' + fmtTime(r.time)) + ', ' + HEROES[r.hero].name;
}
function toTitle() { Snd.hand(null); Snd.music('title'); makeShowcase(); }
function floorBanner() { banner('FLOOR ' + (G.floor + 1) + ': ' + G.F.name.toUpperCase(), G.floor === 0 ? 'Draft rooms. After ' + STAIRS_MIN + ', a draft offers the Stairwell down.' : 'New monsters. New rooms. Same idea.', '#ffd95e', 3.2); }
function startRun(seed, opts = {}) {
  if (seed === undefined) { const q = new URLSearchParams(location.search).get('seed'); seed = q !== null && q !== '' && isFinite(+q) ? +q : (Math.random() * 2147483647) | 0; }   // ?seed=123 pins the run
  const hero = opts.hero && HEROES[opts.hero] ? opts.hero : Save.data.hero;
  newRun(seed, { hero, deck: opts.deck || fullDeck(hero), tutorial: Save.data.runs < 2, stakes: opts.stakes === undefined ? stakeOf(hero) : opts.stakes });
  Save.data.runs++; Save.store();
  App.mode = 'play'; App.sel = 0; App.record = false; floorMusic();
  floorBanner();
}
// The census: what a run looked like when it ended. The save keeps the last CENSUS_MAX runs (RW.census() prints them),
// and the self-play bot reads the same record. Nothing here leaves the browser.
const CENSUS_MAX = 20;
function runRecord(win) {
  const P = G.P, S = G.stats;
  return { v: VERSION, hero: G.hero, stakes: G.stakes, seed: G.seed, won: !!win, floor: G.floor + 1, minute: Math.round(G.t / 6) / 10, time: Math.round(G.tRun),
    by: G.hits.map(h => h.by), how: G.hits.map(h => h.how), doors: G.sealed.length, rooms: G.fstat.rooms, drafted: S.rooms,
    weapons: P.weapons.map(w => w.id + (w.evo ? '*' : w.lv)).join(' '),
    top: tallyList().slice(0, 3).map(t => t.key + ' ' + Math.round(t.share * 100)).join(', '), roomShare: Math.round(tallyShare('r') * 100) };
}
function endRun(win) {
  const b = Save.data.best, S = G.stats, depth = G.floor + 1, c = Save.data.census;
  dailyClose(win);
  c.push(runRecord(win)); while (c.length > CENSUS_MAX) c.shift();
  App.record = Save.data.runs > 1 && (depth > b.floor || (depth === b.floor && Math.floor(G.tRun) > b.time));
  b.time = Math.max(b.time, Math.floor(G.tRun)); b.rooms = Math.max(b.rooms, S.rooms); b.kills = Math.max(b.kills, S.kills); b.floor = Math.max(b.floor, depth);
  App.stakesNew = 0;
  if (win) {                          // a win at a step opens the next one for this delver, and sets it for the next run
    const d = Save.data, had = stakesOpen(G.hero); d.wins++;
    if (!G.daily) {                   // (a daily delve is outside the ladder: its delver may not even be yours)
      d.stakes[G.hero] = Math.max(d.stakes[G.hero] === undefined ? -1 : d.stakes[G.hero], G.stakes);
      if (stakesOpen(G.hero) > had) { App.stakesNew = stakesOpen(G.hero); d.stake[G.hero] = App.stakesNew; }
    }
  }
  Save.store(); App.mode = win ? 'win' : 'over'; App.sel = 0;
}
// walking onto the open stairs
function beginDescent() {
  if (App.fade || App.mode !== 'play') return;
  sfx('stairs'); const fs = { next: G.floor + 1, time: G.t, rooms: G.fstat.rooms, swift: G.fstat.swift };
  startFade(() => { App.descend = fs; App.mode = 'descend'; Snd.music('title'); });
}
function arriveNextFloor() {
  const P = G.P;
  enterFloor(App.descend.next);
  P.costN = Math.floor(P.costN * CURVE.costKeep); P.keyCost = keyCostNow(); P.glints = 0; P.hp = Math.min(P.maxHp, P.hp + 2);
  App.mode = 'play'; floorMusic(); floorBanner();
}

// What the floor plan gives the music (#17). Its step counts the rooms built on this floor: 1 with the first, 2 with
// the third, 3 with the fifth, which is when the Stairwell is first offered. And the elements of those rooms, and
// which of them resonate: an element does when one of its rooms links to another room you built. The floor's first
// room and the Stairwell were not chosen for what they are, and count for none of it.
function musicPlan() {
  const els = {}, res = {}, mine = G.rooms.filter(r => r.type !== 'hearth' && r.type !== 'stairs');
  for (const r of mine) { els[r.el] = 1; for (let d = 0; d < 4; d++) if (r.resDir[d] && mine.includes(nbOf(r, d))) res[r.el] = 1; }
  return { step: mine.length >= 5 ? 3 : mine.length >= 3 ? 2 : mine.length >= 1 ? 1 : 0, els, res };
}
// a floor's piece starts, and with it what this floor's plan gives it, not the last floor's
function floorMusic() { G.planT = 0.5; Snd.hand(null); Snd.plan(musicPlan()); Snd.music(G.F.music); }
function updatePlay(dt) {
  const P = G.P;
  if ((G.planT = (G.planT || 0) - dt) <= 0) { G.planT = 0.5; Snd.plan(musicPlan()); }
  if (G.banner) { G.banner.t += dt; if (G.banner.t > G.banner.d) G.banner = null; }
  if (G.roomLabel) { G.roomLabel.t += dt; if (G.roomLabel.t > 2.4) G.roomLabel = null; }
  if (G.flashT > 0) G.flashT -= dt;
  if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 20);
  if (G.freeze > 0) { G.freeze -= dt; P.pose -= dt; updateSmall(dt); return; }      // the item-get beat
  if (G.over) { G.endT += dt; updateSmall(dt); return; }
  G.t += dt; G.tRun += dt;
  updateBuffs(dt);
  updatePlayer(dt); if (App.mode !== 'play') return;                                // a draft just opened
  computeFlow(false);
  if (G.won) G.endT += dt; else updateDirector(dt);
  updateDoors(dt); updateRooms(dt);
  rebuildHash(); updateMons(dt); updateWeapons(dt); updateShots(dt); updateEBullets(dt); updatePatches(dt); updateZones(dt); updateAllies(dt); updatePicks(dt); updateSmall(dt);
  const k = 1 - Math.exp(-dt * 9); G.cam.x += (P.x - VW / 2 - G.cam.x) * k; G.cam.y += (P.y - 8 - VH / 2 - G.cam.y) * k;
  const tu = G.tut;
  if (tu.step < 9) { tu.t += dt; if (tu.step === 0 && tu.moved > 0.7) { tu.step = 1; tu.t = 0; } else if (tu.step === 4 && (P.forged > 0 || tu.t > 22)) { tu.step = 5; tu.t = 0; } else if (tu.step === 5 && tu.t > 9) tu.step = 9; }
  let j = 0; for (let i = 0; i < G.mons.length; i++) if (!G.mons[i].dead) G.mons[j++] = G.mons[i]; G.mons.length = j;
}
function menuNav(n, rects) {          // shared menu input; returns the activated index or -1
  if (Input.hit('up')) { App.sel = (App.sel + n - 1) % n; sfx('tick'); }
  if (Input.hit('down')) { App.sel = (App.sel + 1) % n; sfx('tick'); }
  for (let i = 0; i < n; i++) if (Input.inRect(rects[i])) { if (Input.mouse.moved && App.sel !== i) { App.sel = i; sfx('tick'); } if (Input.mouse.click) { App.sel = i; return i; } }
  return App.modeT > 0.4 && Input.confirm() ? App.sel : -1;
}
const MODES = {
  intro(dt) { Intro.update(dt); },
  title(dt) {
    App.titleT += dt; if (App.titleT > 7) { App.titleT = 0; App.titleRoom = (App.titleRoom + 1) % G.rooms.length; }
    const r = G.rooms[App.titleRoom], k = 1 - Math.exp(-dt * 0.8);
    G.cam.x += (r.px + CWP / 2 - VW / 2 - G.cam.x) * k; G.cam.y += (r.py + CHP / 2 - VH / 2 - G.cam.y) * k;
    G.t += dt; updateDoors(dt); updateRooms(dt); updateAllies(dt); updateSmall(dt);
    // START is the whole screen and what ENTER does. The small entries sit in a row along the bottom: DOWN steps
    // into the row, LEFT and RIGHT move along it, UP or ESC step out again; the pointer chooses what it is on, and
    // nothing once it leaves. The choice is an entry's id, '' for START, and it goes back to START when an entry is used.
    const T = titleLayout(), m = Input.mouse, over = T.find(e => Input.inRect(e)); let at = T.findIndex(e => e.id === App.titleSel), act = '';
    if (at < 0) App.titleSel = '';
    const choose = i => { App.titleSel = i < 0 ? '' : T[i].id; at = i; sfx('tick'); };
    if (at < 0) { if (Input.hit('down') && T.length) choose(0); }
    else if (Input.hit('up') || Input.hit('back')) choose(-1);
    else if (Input.hit('right') && at < T.length - 1) choose(at + 1);
    else if (Input.hit('left') && at > 0) choose(at - 1);
    if (m.moved && (over ? over.id : '') !== App.titleSel && (over || T.some(e => e.id === App.titleSel && App.titlePtr))) choose(over ? T.indexOf(over) : -1);
    if (m.moved) App.titlePtr = !!over;                                  // the pointer put the choice there: it takes it away again
    if (App.modeT > 0.3) {
      if (Intro.ok && Input.hit('intro')) act = 'intro';
      else if (m.click) act = over ? over.id : 'start';
      else if (Input.confirm()) act = App.titleSel || 'start';
    }
    if (act && act !== 'start') { App.titleSel = ''; App.titlePtr = false; }
    if (act === 'intro') { Intro.begin(); return; }                      // watch the intro again
    if (act === 'changes') { Snd.ensure(); sfx('ok'); App.changes.y = 0; App.mode = 'changes'; return; }
    if (act === 'music') { Snd.ensure(); sfx('ok'); openPlayer(); return; }
    if (act === 'daily') { Snd.ensure(); sfx('ok'); startFade(startDaily); return; }
    if (act === 'start') {
      Snd.ensure(); sfx('ok');
      if (Save.data.runs === 0) startFade(() => startRun());             // very first run: straight in, with the tutorial
      else { App.prep.i = Math.max(0, HERO_ORDER.indexOf(Save.data.hero)); App.mode = 'prep'; }
    }
  },
  changes(dt) {
    G.t += dt; updateDoors(dt); updateRooms(dt); updateAllies(dt); updateSmall(dt);      // the title's rooms live on behind it
    const C = App.changes, L_ = changesLayout(), m = Input.mouse;
    let dy = Input.axis().y * 150 * dt + m.wheel * 0.5;                                  // keys, a stick or the wheel scroll
    if (Input.confirm() || Input.hit('right')) dy += L_.page; if (Input.hit('left')) dy -= L_.page;
    const click = m.click && App.modeT > 0.3;                                             // not the click that opened it
    if (click && (Input.inRect(L_.down) || Input.inRect(L_.lower))) dy += L_.page; else if (click && (Input.inRect(L_.up) || Input.inRect(L_.upper))) dy -= L_.page;
    C.y = clamp(C.y + dy, 0, L_.max);
    if (Input.hit('back') || Input.hit('alt') || (click && Input.inRect(L_.back))) { App.mode = 'title'; sfx('back'); }
  },
  prep(dt) {
    G.t += dt; updateDoors(dt); updateSmall(dt);
    const P_ = App.prep, n = HERO_ORDER.length, id = HERO_ORDER[P_.i], own = heroOwned(id), m = Input.mouse;
    let go = Input.hit('ok') || (App.modeT > 0.4 && Input.hit('dash')), edit = Input.hit('alt'), step = (Input.hit('right') ? 1 : 0) - (Input.hit('left') ? 1 : 0);
    const L_ = prepLayout(id), top = stakesOpen(id); let turn = top && own ? (Input.hit('up') ? 1 : 0) - (Input.hit('down') ? 1 : 0) : 0;
    if (m.click && App.modeT > 0.3) {
      if (m.y < L_.sy && m.x < VW / 2 - 40) step = 1; else if (L_.sk && m.y >= L_.sy && m.y < L_.sy + L_.sk) turn = stakeOf(id) >= top ? -top : 1;   // a tap goes up a step, and from the top back to none
      else if (m.y >= L_.dy - 6 && m.y < L_.dy + 44) edit = true; else go = true;
    }
    if (turn && own) { Save.data.stake[id] = clamp(stakeOf(id) + turn, 0, top); Save.store(); sfx('tick'); }
    if (step) { P_.i = (P_.i + step + n) % n; sfx('tick'); }
    if (Input.hit('back')) { App.mode = 'title'; sfx('back'); return; }
    if (edit && own) { App.deck.cur = 0; App.deck.msgT = 0; App.mode = 'deck'; sfx('ok'); return; }
    if (go) { if (!own) { sfx('nokey'); return; } Save.data.hero = id; Save.data.decks[id] = fullDeck(id); Save.store(); sfx('ok'); startFade(() => startRun()); }
  },
  deck(dt) {
    const D_ = App.deck, L_ = deckLayout(), hid = HERO_ORDER[App.prep.i], n = DECK_LIST.length, m = Input.mouse; let tog = Input.hit('ok') || Input.hit('dash');
    if (D_.msgT > 0) D_.msgT -= dt;
    const move = d => { const c = D_.cur + d; if (c >= 0 && c < n) { D_.cur = c; sfx('tick'); } };
    if (Input.hit('left')) move(-1); if (Input.hit('right')) move(1); if (Input.hit('up')) move(-DECK_COLS); if (Input.hit('down')) move(DECK_COLS);
    let onCell = false; L_.cells.forEach((c, i) => { if (Input.inRect(c)) { onCell = true; if (m.moved && D_.cur !== i) { D_.cur = i; sfx('tick'); } if (m.click) { D_.cur = i; tog = true; } } });
    if (tog) {
      const id = DECK_LIST[D_.cur], deck = deckFor(hid), at = deck.indexOf(id);
      if (!Save.data.rooms[id]) { sfx('nokey'); D_.msg = 'Not collected yet. ' + howToGet(id); D_.msgT = 2.5; }
      else if (at >= 0) { deck.splice(at, 1); Save.data.decks[hid] = deck; sfx('back'); }
      else if (deck.length >= DECK_SIZE) { sfx('nokey'); D_.msg = 'The deck is full: take a card out first.'; D_.msgT = 2; }
      else { deck.push(id); Save.data.decks[hid] = deck; sfx('ok'); }
      Save.store();
    }
    if (Input.hit('back') || Input.hit('alt') || (Input.touch && m.click && !onCell && App.modeT > 0.3)) { Save.data.decks[hid] = fullDeck(hid); Save.store(); App.mode = 'prep'; sfx('back'); }
  },
  play(dt) {
    const tapPause = Input.touch && Input.mouse.click && Input.inRect({ x: VW / 2 + 40, y: 0, w: 22, h: 22 });
    if ((Input.hit('pause') || Input.hit('back') || tapPause) && !G.over && !G.won && G.leaving <= 0) { App.mode = 'pause'; App.sel = 0; sfx('tick'); return; }
    updatePlay(dt);
    if (App.mode === 'play') { if (G.over && G.endT > 1.7) endRun(false); else if (G.won && G.endT > 4.2) endRun(true); }
  },
  draft(dt) {
    const D = G.draft, L_ = draftLayout(), rects = L_.rects, n = D.cards.length; D.t += dt; let go = -1, onCard = false, st = false;
    if (D.coach) { coachInput(D); return; }                              // a lesson is up: input turns its pages
    if (Input.hit('help') || (Input.mouse.click && Input.inRect(L_.help))) { coachStart(D, true); if (D.coach) { sfx('tick'); return; } }
    if (!D.onStairs) { if (Input.hit('left')) { D.sel = (D.sel + n - 1) % n; sfx('tick'); } if (Input.hit('right')) { D.sel = (D.sel + 1) % n; sfx('tick'); } }
    if (L_.bar) { if (Input.hit('down') && !D.onStairs) { D.onStairs = true; sfx('tick'); } else if (Input.hit('up') && D.onStairs) { D.onStairs = false; sfx('tick'); } }
    for (let i = 0; i < n; i++) {
      if (Input.hit('c' + (i + 1))) go = i;
      if (Input.inRect(rects[i])) { onCard = true; if (Input.mouse.moved && (D.sel !== i || D.onStairs)) { D.sel = i; D.onStairs = false; sfx('tick'); } if (Input.mouse.click) go = i; }
    }
    if (L_.bar && Input.inRect(L_.bar)) { onCard = true; if (Input.mouse.moved && !D.onStairs) { D.onStairs = true; sfx('tick'); } if (Input.mouse.click) st = true; }
    if (Input.hit('ok') || (D.t > 0.6 && Input.hit('dash'))) { if (D.onStairs) st = true; else go = D.sel; }   // space is dash, so it only confirms after a beat
    if (D.t > 0.25 && st) { chooseStairs(); return; }
    if (D.t > 0.25 && go >= 0) { chooseCard(go); return; }
    if (D.rerolls > 0 && (Input.hit('reroll') || (L_.re && Input.mouse.click && Input.inRect(L_.re)))) { rerollDraft(); return; }
    if (L_.kb && D.t > 0.25 && (Input.hit('reroll') || (Input.mouse.click && Input.inRect(L_.kb)))) { knockBack(); return; }   // no free deal: knock back
    if (Input.hit('back') || (Input.touch && Input.mouse.click && !onCard && D.t > 0.3)) { D.door.hold = true; closeDraft(); }
  },
  pause() {
    const L_ = pauseLayout(), o = Save.data.opts;
    if (Input.hit('back') || Input.hit('pause')) { App.mode = 'play'; sfx('back'); return; }
    const adj = (i, dir, wrap) => {
      const stepv = v => { let n = Math.round(v * 5) + dir; if (wrap && n > 5) n = 0; return clamp(n, 0, 5) / 5; };
      if (i === 1) o.music = stepv(o.music); else if (i === 2) o.sfx = stepv(o.sfx); else if (i === 3) o.shake = o.shake ? 0 : 1; else if (i === 4) o.mouse = o.mouse === 'drag' ? 'point' : 'drag';
      else if (i === 5) { const ways = Object.keys(GROW_WAYS); o.grow = ways[(ways.indexOf(o.grow) + (dir < 0 ? ways.length - 1 : 1)) % ways.length]; } else return;
      if (i < 4) o.mute = 0; Save.apply(); Save.store(); sfx('tick');
    };
    if (Input.hit('left')) adj(App.sel, -1); if (Input.hit('right')) adj(App.sel, 1);
    const a = menuNav(L_.items.length, L_.rects);
    if (a === 0) { App.mode = 'play'; sfx('ok'); }
    else if (a >= 1 && a <= 5) adj(a, 1, true);
    else if (a === 6) { sfx('ok'); const day = G.daily && G.daily.day; dailyClose(false); startFade(() => day ? startDaily(day) : startRun()); }      // a daily delve starts again as practice
    else if (a === 7) { sfx('back'); dailyClose(false); startFade(toTitle); }
  },
  descend() {
    if (App.modeT > 0.5 && (Input.confirm() || Input.mouse.click)) { sfx('ok'); startFade(arriveNextFloor); }
  },
  over(dt) {
    updateSmall(dt); const L_ = endLayout(), a = menuNav(L_.items.length, L_.rects);
    if (a === 0) { sfx('ok'); const day = G.daily && G.daily.day; startFade(() => day ? startDaily(day) : startRun()); } else if (a === 1 || Input.hit('back')) { sfx('back'); startFade(toTitle); }
  },
  win(dt) {
    updateSmall(dt); const L_ = endLayout(), a = menuNav(L_.items.length, L_.rects);
    if (a === 0) { sfx('ok'); G.won = false; G.endless = true; G.endT = 0; App.mode = 'play'; floorMusic(); banner('ENDLESS DELVE', 'The doors start knocking again...', '#9cecf2', 3); }
    else if (a === 1) { sfx('ok'); const day = G.daily && G.daily.day; startFade(() => day ? startDaily(day) : startRun()); }
    else if (a === 2 || Input.hit('back')) { sfx('back'); startFade(toTitle); }
  },
};
function tick(dt) {
  frameT += dt;
  if (App.mode !== App.prevMode) { App.prevMode = App.mode; App.modeT = 0; } else App.modeT += dt;
  if (App.mode !== 'intro' && Intro.state !== 'off') Intro.stop();     // a test hook left the intro: put the film away
  if (Input.hit('mute')) { const o = Save.data.opts; o.mute = o.mute ? 0 : 1; Save.apply(); Save.store(); }
  if (App.fade) {
    const f = App.fade; f.t += dt;
    if (f.t >= f.d) { if (f.phase === 0) { f.phase = 1; f.t = 0; f.cb(); } else App.fade = null; }
    if (App.fade && App.fade.phase === 0) return;      // hold everything while the iris closes
  }
  MODES[App.mode](dt);
}
let lastT = 0, acc = 0;
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.1, (now - lastT) / 1000 || 0); lastT = now;
  if (!App.manual) {
    acc += dt; let n = 0;
    while (acc >= STEP && n < 4) { Input.poll(); tick(STEP); Input.endFrame(); acc -= STEP; n++; }
    if (acc > STEP * 4) acc = 0;
  }
  render();
}
function boot() {
  buildArt();
  for (const id of HERO_ORDER) { App.big[id] = scaleCanvas(SPR[id + 'D0'].c, 3); App.big[id + '_sil'] = scaleCanvas(SPR[id + 'D0'].wh, 3); }
  App.big.key = scaleCanvas(SPR.key.c, 2); App.big.slime0 = scaleCanvas(SPR.slime0.c, 3); App.big.slime1 = scaleCanvas(SPR.slime1.c, 3);
  { const c = mkCanvas(32, 32), g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.fillStyle = '#241d3a'; g.fillRect(0, 0, 32, 32); g.drawImage(SPR.pipD0.c, 0, 0, 16, 16, 0, 0, 32, 32);
    const l = document.createElement('link'); l.rel = 'icon'; l.href = c.toDataURL(); document.head.appendChild(l); }
  Save.load(); resize(); addEventListener('resize', resize);
  makeShowcase(); Intro.load();
  if (!introWanted() || !Intro.begin()) Snd.music('title');   // the film first, on every boot
  const autoPause = () => { if (App.mode === 'play' && G && !G.over && !G.won && !App.manual) { App.mode = 'pause'; App.sel = 0; } };
  document.addEventListener('visibilitychange', () => { if (document.hidden) { autoPause(); Snd.suspend(); } else Snd.resume(); Intro.hold(document.hidden); });
  addEventListener('blur', autoPause);
  requestAnimationFrame(loop);
}
