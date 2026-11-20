// Self-play bot for Roomwright.
// Inject into the page (e.g. `agent-browser eval --stdin < tools/selfplay-bot.js`), then call:
//   BOT.full(seed, maxSeconds, opts)   play one whole run in fast-forward (deterministic) -> summary object
//                                      opts: { hero, deck, skill }
//   BOT.run(seconds)                   advance the current run by N seconds of game time   -> RW.state()
//   BOT.tick()                         one decision; call it every frame to let the bot play in real time
// The bot only uses what a player has: hold left/right/up/down, press dash / ok, and picking a draft card.
// It is a deliberately mediocre player (greedy, timid near doors) and is used to catch crashes and
// to sanity-check the difficulty curve, not to find optimal play.
(() => {
  const { T, GWT, GHT } = RW.K, PM = RW.K.F_WALK | RW.K.F_PLAYER;
  const dist = new Uint16Array(GWT * GHT), q = new Int32Array(GWT * GHT);
  const N8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  function bfs(G, sx, sy) {           // walking distance to (sx,sy) through everything the player can walk on
    dist.fill(65535); const F = G.flags; let h = 0, t = 0; const s = sy * GWT + sx; dist[s] = 0; q[t++] = s;
    while (h < t) {
      const i = q[h++], x = i % GWT, y = (i - x) / GWT, d = dist[i] + 1;
      for (let k = 0; k < 8; k++) {
        const nx = x + N8[k][0], ny = y + N8[k][1]; if (nx < 0 || ny < 0 || nx >= GWT || ny >= GHT) continue;
        const ni = ny * GWT + nx; if (dist[ni] !== 65535 || (F[ni] & PM)) continue;
        if (k >= 4 && ((F[y * GWT + nx] & PM) || (F[ny * GWT + x] & PM))) continue;
        dist[ni] = d; q[t++] = ni;
      }
    }
  }
  const tileOf = (x, y) => Math.floor(y / T) * GWT + Math.floor(x / T);
  const DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0];
  // the two mouths of a latched gate: [x, y, pushX, pushY]
  function jamMouths(j) {
    const out = [];
    for (const [room, dir] of [[j.a, j.dir], [j.b, (j.dir + 2) % 4]]) {
      const cx = room.px + (dir === 0 || dir === 2 ? 168 : dir === 3 ? 16 : 320), cy = room.py + (dir === 3 || dir === 1 ? 120 : dir === 0 ? 16 : 224);
      out.push([cx - DX[dir] * 22, cy - DY[dir] * 22, DX[dir], DY[dir]]);
    }
    return out;
  }
  const B = window.BOT = {
    goal: null, goalT: 0, log: [], picks: [], skill: 1, rs: 1, lastK: -1, pickK: -1,
    rnd() { B.rs = (B.rs * 1103515245 + 12345) & 0x7fffffff; return B.rs / 0x7fffffff; },
    wantStairs(G) { const D = G.draft; return D.stairs && (G.fstat.rooms >= 11 || G.t > RW.clockLimit() * 0.75); },
    pickCard(G) {
      const P = G.P, D = G.draft; let best = 0, bs = -1e9;
      D.cards.forEach((c, i) => {
        let s = B.rnd() * 0.5; const b = c.boon;
        if (c.hidden) s += 3.5;
        else if (b.kind === 'w') { const own = P.weapons.find(w => w.id === b.id); s += own ? 3 : (P.weapons.length < 4 ? [1.5, 3, 4][RW.evoReach(b.id)] : 0); }   // like a player reading the card: a weapon whose room is out of reach is worth less
        else if (b.kind === 'c') s += b.id === 'heart' ? (P.hp <= 4 ? 5 : 2.5) : b.id === 'might' || b.id === 'haste' || b.id === 'keen' ? 3 : 2;
        if (c.mul > 1 && !c.hidden) s += 2;
        if (['guardian', 'spikes', 'ember', 'frost', 'ballista', 'saw', 'furnace', 'powder', 'icicle', 'apiary', 'bramble', 'blizzard', 'glacier', 'fairy'].includes(c.type)) s += 1.5;
        if (c.type === 'fountain' || c.type === 'spring' || c.type === 'well') s += P.hp <= 5 ? 3 : 1.5;
        if (c.type === 'den' || c.type === 'grave' || c.type === 'altar') s += P.hp >= 6 ? 0.5 : -3;
        if (['vault', 'library', 'garden', 'counting', 'maproom', 'greenhouse'].includes(c.type)) s += 1;
        if (c.lv > 0 && c.lvTo > c.lv) s += 1.5;
        if (c.evo) s += c.evo.ready ? 5 : 1.5;                           // the room one of my weapons evolves in
        s += c.res * 0.8;
        const after = G.sealed.length - 1 - c.plan.links + c.plan.fresh;
        if (after < 2) s -= 3; if (after > 6) s -= 1 + (after - 6) * 0.7;
        if (s > bs) { bs = s; best = i; }
      });
      B.picks.push(D.cards[best].type + ':' + (D.cards[best].hidden ? '?' : D.cards[best].boon.id));
      return best;
    },
    chooseGoal(G) {
      const P = G.P; let g = null;
      // 1) grab boons
      let bd = 1e9; for (const b of G.boons) { const d = Math.hypot(b.x - P.x, b.y - P.y); if (d < bd) { bd = d; g = { k: 'boon', x: b.x, y: b.y, ref: b }; } }
      if (g && bd < 600) return g;
      // 2) a maxed weapon and its room is on this floor: go and evolve it
      for (const w of P.weapons) if (!w.evo && w.lv >= 5) { const r = G.rooms.find(r => r.type === RW.WEAPONS[w.id].evo.room && r.reveal >= 1 && r.hexT <= 0); if (r) return { k: 'evo', x: r.px + 168, y: r.py + 150 }; }
      // 3) spend keys on the nearest sealed door
      if (P.keys > 0 && G.sealed.length) {
        let best = null; bd = 1e9;
        for (const d of G.sealed) { if (d.room.reveal < 1) continue; const dd = Math.hypot(d.x - P.x, d.y - P.y) + (d.st ? 60 : 0) - (B.goal && B.goal.ref === d ? 260 : 0); if (dd < bd) { bd = dd; best = d; } }   // sticks with the door it is already walking to: the nearest door as the crow flies can flip-flop
        if (best) return { k: 'door', x: best.x + best.nx * 22, y: best.y + best.ny * 22, ref: best };
      }
      // 4) the warden is dead and the keys are spent: take the stairs
      if (G.stairs && G.stairs.open) return { k: 'stairs', x: G.stairs.x, y: G.stairs.y };
      // 5) heal at a fountain when hurt
      if (P.hp <= P.maxHp - 3) for (const r of G.rooms) if (r.type === 'fountain' && r.charge >= 1 && r.reveal >= 1) return { k: 'fountain', x: r.fountain.x, y: r.fountain.y + 14 };
      // 6) hoover glints (prefer the richest nearby)
      let bestP = null, bsc = -1e9;
      for (let i = 0; i < G.picks.length; i += Math.max(1, Math.floor(G.picks.length / 60))) { const p = G.picks[i]; const d = Math.hypot(p.x - P.x, p.y - P.y); const sc = (p.k === 'glint' ? p.v : p.k === 'key' ? 60 : (P.hp < P.maxHp ? 40 : -99)) * 6 - d; if (sc > bsc) { bsc = sc; bestP = p; } }
      if (bestP) return { k: 'pick', x: bestP.x, y: bestP.y, ref: bestP };
      // 7) idle near the middle of the current room
      const r = G.curRoom; return { k: 'idle', x: r.px + 168 + Math.sin(G.t * 0.7) * 60, y: r.py + 120 + Math.cos(G.t * 0.9) * 40 };
    },
    tick() {
      const G = RW.G, P = G.P, mode = RW.App.mode;
      for (const a of ['left', 'right', 'up', 'down']) RW.hold(a, false);
      if (mode === 'draft') { if (G.draft.t > 0.3) { if (B.wantStairs(G)) RW.chooseStairs(); else RW.chooseCard(B.pickCard(G)); } return; }
      if (mode === 'descend') { if (RW.App.modeT > 0.6 && !RW.App.fade) RW.press('ok'); return; }
      if (mode !== 'play' || G.over) return;
      B.goalT -= 1;
      const g0 = B.goal;
      if (!g0 || B.goalT <= 0 || (g0.k === 'pick' && g0.ref.gone) || (g0.k === 'boon' && G.boons.indexOf(g0.ref) < 0) || (g0.k === 'door' && (P.keys <= 0 || G.sealed.indexOf(g0.ref) < 0)) || (g0.k === 'jam' && G.jams.indexOf(g0.ref) < 0)) {
        B.goal = B.chooseGoal(G); B.goalT = 25;
        const gi = tileOf(B.goal.x, B.goal.y);
        if (!(G.flags[gi] & PM)) bfs(G, gi % GWT, Math.floor(gi / GWT)); else dist.fill(65535);
        if (dist[tileOf(P.x, P.y)] === 65535 && G.jams.length) {       // cut off by a latched gate: go and shove the nearest one open
          bfs(G, Math.floor(P.x / T), Math.floor(P.y / T));
          let bj = null, bm = null, bd2 = 65535;
          for (const j of G.jams) for (const m of jamMouths(j)) { const d = dist[tileOf(m[0], m[1])]; if (d < bd2) { bd2 = d; bj = j; bm = m; } }
          if (bj) { B.goal = { k: 'jam', x: bm[0], y: bm[1], ref: bj, px: bm[2], py: bm[3] }; bfs(G, Math.floor(bm[0] / T), Math.floor(bm[1] / T)); }
        }
      }
      const g = B.goal; let vx = 0, vy = 0;
      const ptx = Math.floor(P.x / T), pty = Math.floor(P.y / T), pd = dist[pty * GWT + ptx], gd = Math.hypot(g.x - P.x, g.y - P.y);
      const commit = (g.k === 'door' && gd < 18) ? [-g.ref.nx, -g.ref.ny] : (g.k === 'jam' && gd < 18) ? [g.px, g.py] : (g.k === 'stairs' && gd < 6) ? [0, 0] : null;   // close enough: lean on it
      if (pd !== 65535 && pd > 1) {
        let bestD = pd, bx = 0, by = 0;
        for (let k = 0; k < 8; k++) { const nx = ptx + N8[k][0], ny = pty + N8[k][1], nd = dist[ny * GWT + nx]; if (nd < bestD && !(k >= 4 && ((G.flags[pty * GWT + nx] & PM) || (G.flags[ny * GWT + ptx] & PM)))) { bestD = nd; bx = nx * T + 8 - P.x; by = ny * T + 8 - P.y; } }
        const l = Math.hypot(bx, by) || 1; vx = bx / l; vy = by / l;
      } else { const dx = g.x - P.x, dy = g.y - P.y, l = Math.hypot(dx, dy) || 1; if (l > 3) { vx = dx / l; vy = dy / l; } }
      // sampled steering: score the 8 directions (+ standing still) by progress vs. danger at where we'd end up
      const threats = []; let near = 1e9;
      for (const e of G.mons) { if (e.dead) continue; const d = Math.hypot(P.x - e.x, P.y - e.y) - e.r; if (d < 150) threats.push(e.x, e.y, e.def.boss ? 110 : e.def.ai === 'bomber' ? 60 : 46 + e.r, e.def.boss ? 4 : 1); if (d < near) near = d; }
      for (const b of G.ebullets) { if (Math.hypot(P.x - b.x, P.y - 4 - b.y) < 70) threats.push(b.x + b.vx * 0.25, b.y + 4 + b.vy * 0.25, 30, 1.6); }
      for (const z of G.zones) if (z.kind === 'fire' || z.kind === 'spore') threats.push(z.x, z.y, z.r + 16, 2.5);
      const boss = G.dir.boss; if (boss && !boss.dead && boss.pts) for (const p of boss.pts) threats.push(p[0], p[1], 30, 2.5);
      const K = B.skill * (g.k === 'door' && gd < 26 ? 0.7 : g.k === 'door' || g.k === 'jam' ? (P.keys >= 3 ? 1.2 : P.keys === 2 ? 1.8 : 2.4) : g.k === 'stairs' ? 1.5 : 3.2);
      let best = -1e9, bx2 = 0, by2 = 0;
      if (commit) { bx2 = commit[0]; by2 = commit[1]; best = 1e9; }
      for (let k = 0; k < 9 && best < 1e8; k++) {
        const a = k * Math.PI / 4, dx = k === 8 ? 0 : Math.cos(a), dy = k === 8 ? 0 : Math.sin(a);
        let sc = (dx * vx + dy * vy) * 1.0, danger = 0;
        for (const reach of [14, 30]) {
          const px = P.x + dx * reach, py = P.y + dy * reach;
          if (k < 8 && RW.blocked(px, py, PM)) { sc -= reach === 14 ? 3 : 0.8; continue; }
          for (let i = 0; i < threats.length; i += 4) { const R = threats[i + 2], d = Math.hypot(px - threats[i], py - threats[i + 1]); if (d < R) { const w = 1 - d / R; danger += w * w * threats[i + 3]; } }   // never saturates: farther is always better
        }
        sc -= danger * K;
        if (k === B.lastK) sc += 0.35;                       // hysteresis: stick with the current heading unless another is clearly better
        if (sc > best) { best = sc; bx2 = dx; by2 = dy; B.pickK = k; }
      }
      if (best < 1e8) B.lastK = B.pickK;
      if (bx2 > 0.38) RW.hold('right', true); if (bx2 < -0.38) RW.hold('left', true); if (by2 > 0.38) RW.hold('down', true); if (by2 < -0.38) RW.hold('up', true);
      if (near < 8 && P.dashCd <= 0 && P.inv <= 0 && B.skill > 0.5) RW.press('dash');
    },
    // play one whole run from a seed (deterministic); returns a summary row
    full(seed, maxSecs, opts = {}) {
      B.goal = null; B.goalT = 0; B.picks = []; B.rs = seed * 7 + 1; B.skill = opts.skill === undefined ? 1 : opts.skill; B.lastK = -1;
      RW.manual(true); RW.start(seed, opts); RW.G.tut.step = 9;
      const n = Math.round((maxSecs || 1800) * 60); let err = null; const floors = [];
      try {
        let lastFloor = 0, f0 = 0;
        for (let i = 0; i < n; i++) {
          B.tick(); RW.step(1);
          const m = RW.App.mode, G = RW.G; if (m === 'over' || m === 'win') break;
          if (G.floor !== lastFloor) { floors.push(Math.round(f0)); lastFloor = G.floor; }
          f0 = G.t;
        }
      } catch (e) { err = String(e && e.stack || e).slice(0, 500); }
      const s = RW.state(), G = RW.G;
      return { seed, end: s.mode, floor: s.floor + 1, t: Math.round(s.tRun), ft: Math.round(G.t), hp: s.hp + '/' + s.maxHp, rooms: s.rooms, drafted: s.drafted, doors: s.sealed, forged: s.forged, keysLeft: s.keys, kills: s.kills,
        W: s.weapons, C: s.charms, L: s.roomLv, boss: s.boss, floors, evos: G.stats.evos, err };
    },
    // run `secs` of game time; returns a compact report
    run(secs) {
      const n = Math.round(secs * 60); let i = 0;
      for (; i < n; i++) { B.tick(); RW.step(1); const m = RW.App.mode; if (m === 'over' || m === 'win') break; }
      const s = RW.state(); B.log.push(s); return s;
    },
  };
  return 'bot ready';
})()
