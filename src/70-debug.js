/* =============================== 16 DEBUG ============================= */
// Test hooks for automated playtests (see README.md and tools/). Nothing here is needed to play.
window.RW = {
  get G() { return G; }, App, SPR, Input, Save, Snd, Intro, WEAPONS, CHARMS, ROOM_TYPES, MON, CURVE, FLOORS, HEROES, ELEMENTS, EVO_ROOM, STARTER_ROOMS, DRAFTABLE,
  K: { T, GWT, GHT, CWP, CHP, GRID, STEP, DECK_SIZE, STAIRS_MIN, F_WALK, F_PLAYER, VERSION },
  start(seed, opts) { startRun(seed, opts); },                         // opts: { hero, deck }
  manual(on) { App.manual = !!on; },
  coach(on) { App.coach = !!on; },                                     // false = no card lessons in drafts (the checks and the bot use this)
  coachPlan, cardPart, stairsLocked, knockBack, knockTier, KNOCK, draftLayout, pauseLayout, hintFor, view: () => ({ VW, VH, SCALE }),
  titleLayout, changesLayout, CHANGES, CHANGELOG_MD, FONT,             // the title's entries and the changelog
  tallyList, tallyShare, record: runRecord, endLayout, siegeTarget, dreadMul, knocking, wardenShare, swiftLeft, doorPressure,
  STAKES, stake, stakesOpen, stakeOf, prepLayout, floorMix,           // the Stakes ladder                 // the damage tally, and the census record of the run as it stands
  census() { const c = Save.data.census; if (console.table) console.table(c.map(r => Object.assign({}, r, { by: r.by.join(' < ') }))); return c; },                                   // true = the page stops ticking itself; drive it with step()
  step(n = 1) { for (let i = 0; i < n; i++) { tick(STEP); Input.endFrame(); } },
  hold(a, on) { if (on) Input.down.add(a); else Input.down.delete(a); },
  press(a) { Input.pressed.add(a); },
  render, openDraft, chooseCard, chooseStairs, closeDraft, rerollDraft, stairsReady, spawnMon, applyBoon, hurtPlayer, hurtMon, summonBoss, fireEvent, blocked, los,
  enterFloor, arriveNextFloor, jamDoor, unjam, breachWall, canBreach, recalcLinks, roomMul, roomPow, clockLimit, doorPressure, deckFor, fullDeck, wStat, recalc, toTitle,
  refreshCard, makeCards, steelHaste, grantBossUnlocks, beginDescent, addShield, heal, gainGlints, killMon, keyCostNow, nbOf, roomAt, doorPos, syncBees, evolveCheck, evoReach, addZone, rollBoon, wrapText, textW, txt, txo,
  state() {
    const P = G.P;
    return { mode: App.mode, floor: G.floor, t: +G.t.toFixed(1), tRun: +G.tRun.toFixed(1), hp: P.hp, maxHp: P.maxHp, shield: P.shield, keys: P.keys, glints: Math.round(P.glints), keyCost: P.keyCost, forged: P.forged,
      rooms: G.rooms.length, drafted: G.stats.rooms, sealed: G.sealed.length, jams: G.jams.length, mons: G.mons.length, kills: G.stats.kills, picks: G.picks.length, boons: G.boons.length,
      weapons: P.weapons.map(w => w.id + (w.evo ? '*' : w.lv)).join(' '), charms: Object.entries(P.charms).map(([k, v]) => k + v).join(' '), roomLv: Object.entries(G.roomLv).filter(e => e[1] > 1).map(e => e[0] + e[1]).join(' '),
      dmg: G.stats.dmg, roomShare: +tallyShare('r').toFixed(3), tally: tallyList().map(t => ({ key: t.key, dmg: t.dmg, share: +t.share.toFixed(3) })),
      x: Math.round(P.x), y: Math.round(P.y), over: G.over, won: G.won, bossDown: G.bossDown, boss: G.dir.boss ? Math.round(G.dir.boss.hp) : null, stairs: G.stairs ? (G.stairs.open ? 'open' : 'shut') : null, tut: G.tut.step };
  },
  sheet(scale = 4) {                                                   // toggles a contact sheet of every sprite (art review)
    let c = document.getElementById('sheet'); if (c) { c.remove(); return false; }
    const W = 1260, H = 2600; let x = 8, y = 8, rowH = 0;
    c = document.createElement('canvas'); c.id = 'sheet'; c.width = W; c.height = H; c.style.cssText = 'position:fixed;left:0;top:0;transform:none;z-index:9';
    const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.fillStyle = '#6b7aa0'; g.fillRect(0, 0, W, H); g.font = '9px monospace';
    for (const n in SPR) {
      const s = SPR[n], w = s.w * scale, h = s.h * scale, cell = Math.max(w, n.length * 5.5) + 10;
      if (x + cell > W) { x = 8; y += rowH + 18; rowH = 0; }
      g.drawImage(s.c, x, y, w, h); g.fillStyle = '#fff'; g.fillText(n, x, y + h + 9); x += cell; rowH = Math.max(rowH, h);
    }
    x = 8; y += rowH + 18;
    for (const c2 of [DOORS.closed[0], DOORS.ajar[0], DOORS.closed[1], DOORS.gate[0], DOORS.gate[1]]) { g.drawImage(c2, x, y, c2.width * scale, c2.height * scale); x += c2.width * scale + 12; }
    document.body.appendChild(c); return true;
  },
};
boot();
