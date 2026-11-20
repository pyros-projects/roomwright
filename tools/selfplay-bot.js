// Self-play bot for Roomwright.
// Inject into the page (e.g. `agent-browser eval --stdin < tools/selfplay-bot.js`), then call:
//   BOT.full(seed, maxSeconds, opts)   play one whole run in fast-forward (deterministic) -> summary object
//                                      opts: { hero, deck, skill, policy, persona, stairs }
//                                      policy: how it picks a draft card. 'score' (its own reading of the card, the
//                                      default), 'random', or 'first' (always the left card). The gap between them
//                                      is the pick gap: how much the draft decides (docs/checks.md).
//   BOT.batch(first, n, maxSeconds, opts)   play seeds first..first+n-1 and keep the rows; BOT.report(label) prints them
//   BOT.run(seconds)                   advance the current run by N seconds of game time   -> RW.state()
//   BOT.tick()                         one decision; call it every frame to let the bot play in real time
// The bot only uses what a player has: hold left/right/up/down, press dash / ok, and picking a draft card.
// Two personas (opts.persona):
//   'kiter'  the first bot, a deliberately mediocre player: greedy, timid near doors, slow to read a warden. It
//            catches crashes and shows what a newcomer's first runs look like.
//   'dodger' walks every heading 0.8 s into the future against where the bullets, the monsters and the warden's
//            attacks will be, takes the one that stays unhurt longest, and dashes when no walk does. It stands
//            for a practised player. Neither is the truth alone: the gap between them is what movement is worth.
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
    goal: null, goalT: 0, log: [], picks: [], skill: 1, rs: 1, lastK: -1, pickK: -1, policy: 'score', persona: 'kiter', stairs: 'mid', rows: [], held: 8, holdT: 0,
    rnd() { B.rs = (B.rs * 1103515245 + 12345) & 0x7fffffff; return B.rs / 0x7fffffff; },
    // when to build the Stairwell (opts.stairs): 'early' as soon as it is offered, 'mid' after eleven rooms or three quarters of the clock, 'late' when the clock is nearly out
    wantStairs(G) { const D = G.draft, k = G.t / RW.clockLimit(); return D.stairs && (B.stairs === 'early' ? true : B.stairs === 'late' ? k > 0.92 : G.fstat.rooms >= 11 || k > 0.75); },
    pickCard(G) {
      const P = G.P, D = G.draft; let best = 0, bs = -1e9;
      if (B.policy === 'random') best = Math.floor(B.rnd() * D.cards.length);
      else if (B.policy !== 'first') D.cards.forEach((c, i) => {
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
      // 2b) an elite camps in a room and has switched it off: go and fight it there, in good health
      if (P.hp > P.maxHp * 0.5) for (const e of G.mons) if (!e.dead && e.def.siege && e.camped && e.tr && e.tr.siegeT > 0) return { k: 'siege', x: e.x, y: e.y + 26 };
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
    // ---- the dodger ----
    // When does a walk in direction (dx, dy) first get hurt? Returns [seconds until the first hit (9 = none in sight),
    // how crowded the place is where the walk ends]. dash: the walk starts with a dash (fast, and unhurt for 0.3 s).
    walk(G, T_, dx, dy, dash) {
      const P = G.P, sp = P.speedEff, DT = 0.1, N = 8; let px = P.x, py = P.y, free = Math.max(P.inv, dash ? 0.3 : 0);
      for (let i = 1; i <= N; i++) {
        const t = i * DT, v = sp * (dash && t <= 0.2 + 1e-9 ? 3.2 : 1), nx = px + dx * v * DT, ny = py + dy * v * DT;
        if (!RW.blocked(nx, ny, PM)) { px = nx; py = ny; } else if (!RW.blocked(nx, py, PM)) px = nx; else if (!RW.blocked(px, ny, PM)) py = ny;
        if (t <= free) continue;
        for (const b of T_.bul) { if (Math.abs(b.x + b.vx * t - px) < 6.5 && Math.abs(b.y + b.vy * t - (py - 4)) < 7.5) return [t, 9]; }
        for (const m of T_.mons) {                                        // [x, y, speed, reach, kind, a, b, c]
          const k = m[4];
          if (k === 0) { if (Math.hypot(m[0] - px, m[1] - py) - m[2] * t < m[3]) return [t, 9]; }                      // a walker: could it be here by now?
          else if (k === 1) { const tt = Math.max(0, t - m[7]); if (Math.hypot(m[0] + m[5] * tt - px, m[1] + m[6] * tt - py) < m[3]) return [t, 9]; }   // a charge along a line, after a wind-up
          else if (k === 2) { if (Math.abs(t - m[7]) < DT * 0.75 && Math.hypot(m[0] - px, m[1] - py) < m[3]) return [t, 9]; }   // a blast at a known moment
        }
        if (!(dash && t <= 0.2 + 1e-9)) for (const z of T_.zones) { if (t >= z[3] && Math.hypot(z[0] - px, z[1] - py) < z[2]) return [t, 9]; }   // ground that burns from a known moment
      }
      let crowd = 0; for (const m of T_.mons) if (m[4] === 0) { const d = Math.hypot(m[0] - px, m[1] - py) - m[3]; if (d < 70) crowd += (1 - d / 70) * (m[3] > 20 ? 3 : 1); }
      for (const b of T_.bul) { const d = Math.hypot(b.x + b.vx * 0.8 - px, b.y + b.vy * 0.8 - py); if (d < 26) crowd += 1 - d / 26; }
      return [9, crowd];
    },
    threats(G) {
      const P = G.P, mons = [], bul = [], zones = [];
      for (const e of G.mons) {
        if (e.dead) continue; const def = e.def, d = Math.hypot(e.x - P.x, e.y - P.y); if (d > (def.boss ? 300 : 170)) continue;
        const reach = e.r + P.r + 2.5, spd = e.stun > 0 || e.emerge > 0.3 ? 0 : def.spd * (e.haste || 1) * (def.hop ? 1.2 : 1);
        if (def.boss) {
          const id = def.id, f = 1 + 0.1 * (e.fury || 0);                 // a furious warden does everything faster
          if (id === 'gatejaw' && e.st === 1) { mons.push([e.x, e.y, 0, reach + 4, 1, e.cx * 200 * f, e.cy * 200 * f, Math.max(0, e.stT) / f]); continue; }   // winding up a charge
          if (id === 'gatejaw' && e.st === 2) { mons.push([e.x, e.y, 0, reach + 4, 1, e.cx * 200 * f, e.cy * 200 * f, 0]); continue; }
          if (id === 'morel' && e.st === 5) { zones.push([e.jx, e.jy, 30, Math.max(0, e.stT / f - 0.1)]); continue; }                                 // airborne: do not be where she lands
          if (id === 'morel' && e.st === 3) { mons.push([e.x, e.y, 0, reach, 0]); zones.push([P.x, P.y, 26, (Math.max(0, e.stT) + 0.6) / f]); continue; }   // crouching: she will leap at where you stand
          if (e.pts) for (const p of e.pts) zones.push([p[0], p[1], 19, Math.max(0, e.stT / f - 0.05)]);                                              // spore rain, falling masonry
          mons.push([e.x, e.y, def.spd * 1.35 * f, reach + 3, 0]); continue;
        }
        if (def.ai === 'charge' && e.st === 1) { mons.push([e.x, e.y, 0, reach + 2, 1, e.cx * 205, e.cy * 205, Math.max(0, e.stT)]); continue; }
        if (def.ai === 'charge' && e.st === 2) { mons.push([e.x, e.y, 0, reach + 2, 1, e.cx * 205, e.cy * 205, 0]); continue; }
        if (def.ai === 'bomber' && e.st === 1) { mons.push([e.x, e.y, 0, 34, 2, 0, 0, Math.max(0, e.stT)]); continue; }
        mons.push([e.x, e.y, def.ai === 'turret' ? 0 : spd, reach, 0]);
      }
      for (const b of G.ebullets) if (Math.abs(b.x - P.x) < 170 && Math.abs(b.y - P.y) < 170) bul.push(b);
      for (const z of G.zones) if ((z.kind === 'fire' || z.kind === 'spore') && Math.hypot(z.x - P.x, z.y - P.y) < 150) zones.push([z.x, z.y, z.r + 3, 0]);
      return { mons, bul, zones };
    },
    // pick a heading (0..7, or 8 = stand) and say whether to dash: (vx, vy) is where the goal lies, commit a move that must be made
    dodge(G, vx, vy, urgent) {
      const P = G.P, T_ = B.threats(G); let best = -1e9, bk = 8, bt = 0; const calm = !T_.mons.length && !T_.bul.length && !T_.zones.length;
      for (let k = 0; k < 9; k++) {
        const a = k * Math.PI / 4, dx = k === 8 ? 0 : Math.cos(a), dy = k === 8 ? 0 : Math.sin(a);
        if (k < 8 && RW.blocked(P.x + dx * 10, P.y + dy * 10, PM)) continue;
        const [t, crowd] = calm ? [9, 0] : B.walk(G, T_, dx, dy, false);
        let sc = (t >= 9 ? 0 : -60 / (t + 0.15)) + (dx * vx + dy * vy) * urgent - crowd * 0.9;
        if (k === B.held) sc += 0.3;                                      // do not dither between two headings that are as good
        if (sc > best) { best = sc; bk = k; bt = t; }
      }
      let dash = false;
      if (bt < 0.45 && P.dashCd <= 0 && P.pose <= 0) {                    // every walk gets hurt soon: is there a dash that does not?
        let db = bt, dk = -1;
        for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4, dx = Math.cos(a), dy = Math.sin(a); if (RW.blocked(P.x + dx * 12, P.y + dy * 12, PM)) continue; const t = B.walk(G, T_, dx, dy, true)[0]; if (t > db + 0.2) { db = t; dk = k; } }
        if (dk >= 0) { bk = dk; dash = true; }
      }
      B.held = bk;
      if (bk < 8) { const a = bk * Math.PI / 4, dx = Math.cos(a), dy = Math.sin(a); if (dx > 0.38) RW.hold('right', true); if (dx < -0.38) RW.hold('left', true); if (dy > 0.38) RW.hold('down', true); if (dy < -0.38) RW.hold('up', true); }
      if (dash) RW.press('dash');
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
      if (B.persona === 'dodger') {
        if (commit) { if (commit[0] > 0.38) RW.hold('right', true); if (commit[0] < -0.38) RW.hold('left', true); if (commit[1] > 0.38) RW.hold('down', true); if (commit[1] < -0.38) RW.hold('up', true); return; }
        B.dodge(G, vx, vy, g.k === 'door' || g.k === 'jam' ? 2.2 : g.k === 'stairs' || g.k === 'boon' || g.k === 'evo' ? 1.6 : 1.0); return;
      }
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
      B.policy = opts.policy || 'score'; B.persona = opts.persona || 'kiter'; B.stairs = opts.stairs || 'mid'; B.held = 8; B.holdT = 0;
      RW.manual(true); RW.coach(false); RW.start(seed, opts); RW.G.tut.step = 9;
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
      const s = RW.state(), G = RW.G, rec = RW.record(s.mode === 'win');
      return { seed, end: s.mode, floor: s.floor + 1, t: Math.round(s.tRun), ft: Math.round(G.t), hp: s.hp + '/' + s.maxHp, rooms: s.rooms, drafted: s.drafted, doors: s.sealed, forged: s.forged, keysLeft: s.keys, kills: s.kills,
        W: s.weapons, C: s.charms, L: s.roomLv, boss: s.boss, floors, evos: G.stats.evos, err,
        by: rec.by, minute: rec.minute, roomShare: rec.roomShare, top: rec.top, tally: s.tally };
    },
    // seeds first..first+n-1 with a fresh collection each, kept in B.rows (call it in small chunks: one call blocks the page)
    batch(first, n, maxSecs, opts = {}) {
      const hero = opts.hero || 'pip';
      for (let seed = first; seed < first + n; seed++) { RW.Save.data.rooms = RW.Save.fresh().rooms; B.rows.push(B.full(seed, maxSecs, Object.assign({ deck: RW.HEROES[hero].deck }, opts))); }
      return B.rows.length;
    },
    // the numbers of a batch: how deep the runs got, and the census of how they ended
    stats(rows) {
      const n = rows.length || 1, won = r => r.end === 'win', dead = rows.filter(r => r.end === 'over'), count = (list, key) => { const m = {}; for (const r of list) { const k = key(r); m[k] = (m[k] || 0) + 1; } return Object.entries(m).sort((a, b) => b[1] - a[1]); };
      const dmg = {}; let total = 0; for (const r of rows) for (const t of r.tally || []) { dmg[t.key] = (dmg[t.key] || 0) + t.dmg; total += t.dmg; }
      return { runs: rows.length, wins: rows.filter(won).length, floor1: rows.filter(r => won(r) || r.floor >= 2).length, floor2: rows.filter(r => won(r) || r.floor >= 3).length,
        minutes: +(rows.reduce((a, r) => a + r.t, 0) / n / 60).toFixed(1), rooms: +(rows.reduce((a, r) => a + r.drafted, 0) / n).toFixed(1), evos: +(rows.reduce((a, r) => a + r.evos, 0) / n).toFixed(1),
        roomShare: Math.round(rows.reduce((a, r) => a + (r.roomShare || 0), 0) / n), unfinished: rows.filter(r => r.end !== 'win' && r.end !== 'over').length, errors: rows.filter(r => r.err).length,
        deathsByFloor: [1, 2, 3].map(f => dead.filter(r => r.floor === f).length), killers: count(dead, r => r.by[r.by.length - 1] || 'unknown'),
        damage: Object.entries(dmg).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, Math.round(v / (total || 1) * 100)]) };
    },
    // one line per run, then the summary and the census, as text; clears the rows
    report(label) {
      const rows = B.rows, st = B.stats(rows), out = []; B.rows = [];
      for (const r of rows) out.push(['seed ' + r.seed, r.end, 'floor ' + r.floor, 't=' + r.t + 's', 'hp=' + r.hp, 'rooms=' + r.drafted, 'keys=' + r.forged, 'kills=' + r.kills, 'evo=' + r.evos, 'boss=' + r.boss, '[' + r.W + ']', 'lv[' + r.L + ']', 'floors@' + r.floors.join('/'),
        r.end === 'over' ? 'died at ' + r.minute + ' min with ' + r.doors + ' doors sealed; last hits, newest first: ' + (r.by.slice().reverse().join(', ') || 'unknown') : '', 'rooms did ' + r.roomShare + '%', r.err ? 'ERR ' + r.err : ''].join('  '));
      out.push('SUMMARY ' + (label || '') + ' runs=' + st.runs + ' wins=' + st.wins + ' beatFloor1=' + st.floor1 + ' beatFloor2=' + st.floor2 + ' avgLength=' + st.minutes + 'min rooms=' + st.rooms + ' evolutions=' + st.evos + ' roomDamage=' + st.roomShare + '% unfinished=' + st.unfinished + ' errors=' + st.errors);
      out.push('CENSUS deaths on floor 1/2/3: ' + st.deathsByFloor.join('/') + '   killing blows: ' + (st.killers.map(k => k[0] + ' ' + k[1]).join(', ') || 'none'));
      out.push('DAMAGE ' + st.damage.slice(0, 8).map(d => d[0] + ' ' + d[1] + '%').join(', '));
      return out.join('\n');
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
