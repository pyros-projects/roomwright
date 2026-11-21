/* ============================== 11 WEAPONS ============================ */
// One function per weapon in WUPD: (w = instance, st = stats for its level or evolved form, P, dt).
// st.evo is set on the evolved form; evolved-only stats (homing, fork, shield...) are just absent before.
function slash(a, st) {
  const P = G.P, R = st.range * P.area, x = P.x, y = P.y - 3, full = st.arc > 6;
  nearMons(x, y, R, e => {
    const dx = e.x - x, dy = e.y - 3 - y, d = Math.hypot(dx, dy); if (d > R + e.r) return;
    if (!full && d > 10 && Math.abs(angDiff(Math.atan2(dy, dx), a)) > st.arc / 2) return;
    hurtMon(e, st.dmg * P.mightEff, dx / (d || 1) * 80, dy / (d || 1) * 80);
  });
  G.fxs.push({ k: 'slash', a, R, arc: Math.min(st.arc, 6.28), t: 0, d: 0.17 }); sfx('swing');
  for (let k = 0; k < (st.wave || 0); k++) { const wa = a + k * Math.PI; shoot({ k: 'wave', x, y, vx: Math.cos(wa) * 175, vy: Math.sin(wa) * 175, r: 7, dmg: st.dmg * 0.6 * P.mightEff, life: 0.55, inf: 1, hits: new Map(), a: wa }); }
}
// Welcome Mat: called whenever you walk through a doorway
function onDoorway(x, y) {
  const P = G.P, w = P.weapons.find(w => w.id === 'mat'); if (!w) return;
  if (G.mats.some(m => Math.abs(m.x - x) < 10 && Math.abs(m.y - y) < 10)) return;
  const st = wStat(w); while (G.mats.length >= st.max) G.mats.shift();
  G.mats.push({ x, y, cd: 0.4 }); sparkle(x, y, 6, PAL.r);
}
// Briar Whip: everything along a line from you
function lash(a, st) {
  const P = G.P, R = st.range * P.area, x = P.x, y = P.y - 3, ca = Math.cos(a), sa = Math.sin(a);
  nearMons(x + ca * R / 2, y + sa * R / 2, R / 2 + 4, e => {
    const dx = e.x - x, dy = e.y - 3 - y, along = dx * ca + dy * sa, off = Math.abs(dy * ca - dx * sa);
    if (along < -e.r || along > R + e.r || off > st.wid + e.r) return;
    hurtMon(e, st.dmg * P.mightEff, ca * 50, sa * 50);
  });
  if (st.thorn) for (let k = 1; k <= 3; k++) {                         // evolved: brambles along the lash
    const px = x + ca * R * k / 3.4, py = P.y + sa * R * k / 3.4;
    if (blocked(px, py, F_WALK) || G.patches.some(q => Math.abs(q.x - px) < 9 && Math.abs(q.y - py) < 7)) continue;
    if (G.patches.length > 48) G.patches.shift();
    G.patches.push({ x: px, y: py, r: 10, dmg: st.dmg * 0.35 * P.mightEff, life: 3, max: 3, tick: 0.15, slow: 0.3, big: false, by: BY });
  }
  G.fxs.push({ k: 'lash', a, R, t: 0, d: 0.2, rose: st.thorn }); sfx('swing');
}
const WUPD = {
  keyblade(w, st, P, dt) {
    for (let i = w.pend.length - 1; i >= 0; i--) { w.pend[i].t -= dt; if (w.pend[i].t <= 0) { slash(w.pend[i].a, st); w.pend.splice(i, 1); } }
    if (w.cd > 0) return;
    const tgt = nearestMon(P.x, P.y - 3, st.range * P.area + 3, false);         // only swing when it will connect
    if (!tgt) { w.cd = 0.08; return; }
    const a = Math.atan2(tgt.y - P.y, tgt.x - P.x);
    slash(a, st); if (st.n > 1) w.pend.push({ t: 0.17, a: a + Math.PI });
    w.cd = st.cd * P.hasteEff;
  },
  spark(w, st, P) {
    if (w.cd > 0) return;
    const n = st.n + P.extra, tg = nearestMons(P.x, P.y - 4, 175, n, true);
    if (!tg.length) { w.cd = 0.12; return; }
    for (let i = 0; i < n; i++) {
      const t = tg[i % tg.length]; let a = Math.atan2(t.y - 3 - (P.y - 4), t.x - P.x);
      if (i >= tg.length) a += Math.ceil((i - tg.length + 1) / 2) * 0.2 * (i % 2 ? 1 : -1);
      shoot({ k: 'spark', x: P.x, y: P.y - 4, vx: Math.cos(a) * 215, vy: Math.sin(a) * 215, r: 3, dmg: st.dmg * P.mightEff, life: 1.1, pierce: st.pierce, hits: st.pierce ? new Map() : null, homing: st.homing, burst: st.burst });
    }
    sfx('shoot'); w.cd = st.cd * P.hasteEff;
  },
  ricochet(w, st, P) {
    if (w.cd > 0) return;
    const t = nearestMon(P.x, P.y - 4, 230, false); if (!t) { w.cd = 0.15; return; }
    const n = st.n + P.extra, base = Math.atan2(t.y - P.y, t.x - P.x);
    for (let i = 0; i < n; i++) {
      const a = base + (i ? rr(-0.9, 0.9) : rr(-0.12, 0.12));
      shoot({ k: 'orb', x: P.x, y: P.y - 4, vx: Math.cos(a) * 165, vy: Math.sin(a) * 165, r: 4, dmg: st.dmg * P.mightEff, life: st.evo ? 7 : 5, inf: 1, bounces: st.bounces, hits: new Map(), rehit: 0.35, kb: 0.5, shard: st.shard });
    }
    sfx('shoot'); w.cd = st.cd * P.hasteEff;
  },
  halo(w, st, P, dt) {
    w.pulse = Math.max(0, w.pulse - dt);
    if (st.shield) { w.shT += dt; if (w.shT >= st.shield) { w.shT = 0; addShield(2); } }
    if (w.cd > 0) return; w.cd = st.tick * P.hasteEff; const R = st.r * P.area; let any = false;
    nearMons(P.x, P.y - 3, R, e => {
      const dx = e.x - P.x, dy = e.y - P.y, d = Math.hypot(dx, dy); if (d > R + e.r * 0.5) return;
      if (hurtMon(e, st.dmg * P.mightEff, dx / (d || 1) * 14, dy / (d || 1) * 14)) any = true;
      if (st.slow) { e.slow = Math.max(e.slowT > 0 ? e.slow : 0, st.slow); e.slowT = 0.6; }
    });
    // the light also snuffs out a few enemy shots that stray into it
    const B = G.ebullets, R2 = R * 0.62; let left = st.snuff;
    for (let i = B.length - 1; i >= 0 && left > 0; i--) {
      const b = B[i]; if (Math.hypot(b.x - P.x, b.y - (P.y - 4)) > R2) continue;
      sparkle(b.x, b.y, 3, PAL.y); B[i] = B[B.length - 1]; B.pop(); left--; any = true;
    }
    if (any) w.pulse = 0.2;
  },
  moons(w, st, P, dt) {
    w.ang += st.rot * dt; const n = st.n + P.extra, R = st.r * (0.6 + 0.4 * P.area); w.orbs.length = 0;
    const fire = st.shoot && (w.shootT -= dt) <= 0; if (fire) w.shootT = st.shoot * P.hasteEff;
    for (let i = 0; i < n; i++) {
      const a = w.ang + i / n * TAU, x = P.x + Math.cos(a) * R, y = P.y - 4 + Math.sin(a) * R * 0.85; w.orbs.push(x, y);
      nearMons(x, y, 6, e => { if (G.t - e.moonT < 0.4) return; const dx = e.x - x, dy = e.y - 3 - y; if (dx * dx + dy * dy < (e.r + 5) * (e.r + 5)) { e.moonT = G.t; hurtMon(e, st.dmg * P.mightEff, Math.cos(a) * 60, Math.sin(a) * 60); } });
      if (fire) { const tg = nearestMon(x, y, 115, true); if (tg) { const fa = Math.atan2(tg.y - 3 - y, tg.x - x); shoot({ k: 'guard', x, y, vx: Math.cos(fa) * 230, vy: Math.sin(fa) * 230, r: 3, dmg: st.dmg * 0.7 * P.mightEff, life: 0.6 }); } }
    }
  },
  bomb(w, st, P) {
    if (w.cd > 0) return;
    const c = []; for (const e of G.mons) if (!e.dead && e.emerge <= 0 && (e.x - P.x) * (e.x - P.x) + (e.y - P.y) * (e.y - P.y) < 140 * 140) c.push(e);
    if (!c.length) { w.cd = 0.2; return; }
    for (let i = 0, n = st.n + P.extra; i < n; i++) { const t = pick(c); G.shots.push({ k: 'bomb', x: P.x, y: P.y - 6, z: 0, sx: P.x, sy: P.y - 6, tx: t.x + rr(-6, 6), ty: t.y + rr(-6, 6), t: -i * 0.12, d: 0.5, R: st.r * P.area, dmg: st.dmg * P.mightEff, fire: st.fire, by: BY }); }
    w.cd = st.cd * P.hasteEff;
  },
  bell(w, st, P) {
    if (w.cd > 0) return;
    const first = nearestMon(P.x, P.y - 4, 125, false); if (!first) { w.cd = 0.15; return; }
    const seen = new Set([first]), segs = [[P.x, P.y - 10, first.x, first.y - 5]]; let front = [first], left = st.chain + P.extra * 2 - 1;
    const zap = e => { hurtMon(e, st.dmg * P.mightEff, 0, 0); if (st.stun && !e.def.boss) e.stun = Math.max(e.stun, st.stun); };
    zap(first);
    while (front.length && left > 0) {            // each struck monster passes the bolt on (to two others once evolved)
      const next = [];
      for (const cur of front) {
        for (let f = 0; f < (st.fork ? 2 : 1) && left > 0; f++) {
          let best = null, bd = 72 * 72;
          nearMons(cur.x, cur.y, 72, e => { if (e.dead || seen.has(e) || e.emerge > 0.2) return; const d = (e.x - cur.x) * (e.x - cur.x) + (e.y - cur.y) * (e.y - cur.y); if (d < bd) { bd = d; best = e; } });
          if (!best) break;
          seen.add(best); segs.push([cur.x, cur.y - 5, best.x, best.y - 5]); zap(best); next.push(best); left--;
        }
      }
      front = next;
    }
    G.fxs.push({ k: 'bolt', segs, t: 0, d: 0.16, seed: (fxr() * 999) | 0 }); sfx('zap'); w.cd = st.cd * P.hasteEff;
  },
  thorns(w, st, P) {
    if (w.cd > 0) return; w.cd = st.cd * P.hasteEff;
    for (const q of G.patches) if (Math.abs(q.x - P.x) < 9 && Math.abs(q.y - P.y) < 7) { q.life = q.max = st.life; q.dmg = st.dmg * P.mightEff; return; }   // refresh, never stack
    if (G.patches.length > 48) G.patches.shift();
    G.patches.push({ x: P.x + rr(-3, 3), y: P.y + rr(-2, 2), r: st.r * P.area, dmg: st.dmg * P.mightEff, life: st.life, max: st.life, tick: 0.15, slow: st.slow, big: st.evo, by: BY });
  },
  frostfan(w, st, P) {
    if (w.cd > 0) return;
    if (!nearestMon(P.x, P.y - 4, 150, false)) { w.cd = 0.15; return; }
    const n = st.n + P.extra * 2, base = st.ring ? w.ang : P.aim; if (st.ring) w.ang += 0.26;
    for (let i = 0; i < n; i++) {
      const a = st.ring ? base + i / n * TAU : base + (n > 1 ? (i / (n - 1) - 0.5) * st.spread : 0);
      shoot({ k: 'shard', x: P.x, y: P.y - 4, vx: Math.cos(a) * 190, vy: Math.sin(a) * 190, r: 3, dmg: st.dmg * P.mightEff, life: 0.75 * P.area, pierce: st.pierce, hits: new Map(), slow: st.slow, freeze: st.freeze });
    }
    sfx('shoot'); w.cd = st.cd * P.hasteEff;
  },
  boomer(w, st, P) {
    if (w.cd > 0) return;
    const range = st.range * P.area, t = nearestMon(P.x, P.y - 4, range + 30, false); if (!t) { w.cd = 0.15; return; }
    const n = st.n + P.extra, base = st.cross ? (w.ang += 0.4) : Math.atan2(t.y - 3 - (P.y - 4), t.x - P.x);
    for (let i = 0; i < n; i++) {
      const a = st.cross ? base + i / n * TAU : base + (i ? Math.ceil(i / 2) * 0.4 * (i % 2 ? 1 : -1) : 0);
      shoot({ k: 'bkey', x: P.x, y: P.y - 4, vx: Math.cos(a) * 175, vy: Math.sin(a) * 175, r: 5, dmg: st.dmg * P.mightEff, life: 5, inf: 1, hits: new Map(), out: range / 175, back: false, kb: 0.6 });
    }
    sfx('swing'); w.cd = st.cd * P.hasteEff;
  },
  mat(w, st, P, dt) {
    for (const m of G.mats) {
      if (m.cd > 0) { m.cd -= dt; continue; }
      let hit = false; nearMons(m.x, m.y, 12, e => { if (!hit && !e.dead && e.emerge <= 0 && !e.def.fly && !e.def.phase && Math.hypot(e.x - m.x, e.y - m.y) < 12 + e.r) hit = true; });
      if (hit) { explode(m.x, m.y, st.r * P.area, st.dmg * P.mightEff); m.cd = st.rearm * P.hasteEff; }
    }
  },
  moth(w, st, P, dt) {
    const n = st.n + P.extra;
    while (w.pets.length < n) w.pets.push({ x: P.x, y: P.y - 10, tg: null, cd: 0, ph: w.pets.length * 2.1 });
    w.pets.length = n;
    for (const m of w.pets) {
      m.cd -= dt;
      if (m.tg && (m.tg.dead || Math.hypot(m.tg.x - P.x, m.tg.y - P.y) > 190)) m.tg = null;
      if (!m.tg && m.cd <= 0) {                   // nearest monster to you that no other moth is already on
        let bd = 150 * 150;
        for (const e of G.mons) { if (e.dead || e.emerge > 0.2) continue; const d = (e.x - P.x) * (e.x - P.x) + (e.y - P.y) * (e.y - P.y); if (d < bd && !w.pets.some(o => o !== m && o.tg === e)) { bd = d; m.tg = e; } }
        if (!m.tg) m.tg = nearestMon(P.x, P.y, 150, false);
      }
      let tx = P.x + Math.cos(G.t * 2.4 + m.ph) * 18, ty = P.y - 14 + Math.sin(G.t * 2.4 + m.ph) * 9, sp = 110;
      if (m.tg && m.cd <= 0) { tx = m.tg.x; ty = m.tg.y - 5; sp = 175; }
      const dx = tx - m.x, dy = ty - m.y, d = Math.hypot(dx, dy) || 1;
      m.x += dx / d * Math.min(d, sp * dt); m.y += dy / d * Math.min(d, sp * dt); m.face = dx > 0 ? 1 : -1;
      if (m.tg && m.cd <= 0 && d < 8) {
        hurtMon(m.tg, st.dmg * P.mightEff, dx / d * 40, dy / d * 40);
        if (st.burn && !m.tg.dead) { m.tg.burnT = 2.2; m.tg.burn = st.dmg * 0.35 * P.mightEff; m.tg.burnBy = BY; }
        m.cd = st.cd * P.hasteEff; m.tg = null;
      }
    }
  },

  /* ---- the second dozen ---- */
  quarrel(w, st, P) {
    if (w.cd > 0) return;
    const n = st.n + P.extra, tg = nearestMons(P.x, P.y - 4, 210, n, true);
    if (!tg.length) { const t = nearestMon(P.x, P.y - 4, 120, false); if (!t) { w.cd = 0.15; return; } tg.push(t); }
    for (let i = 0; i < n; i++) {                                       // one bolt per monster in sight; with only one to shoot at, the second covers your back
      const t = tg[i % tg.length], a = Math.atan2(t.y - 3 - (P.y - 4), t.x - P.x) + (i < tg.length ? 0 : i === 1 ? Math.PI : (i - 1) * 0.22 * (i % 2 ? 1 : -1));
      shoot({ k: 'quarrel', x: P.x, y: P.y - 4, vx: Math.cos(a) * 310, vy: Math.sin(a) * 310, r: 4, dmg: st.dmg * P.mightEff, life: 0.8, inf: 1, hits: new Map(), kb: 1.3, boomR: st.boom ? st.boom * P.area : 0, boomD: st.dmg * 0.5 * P.mightEff });
    }
    sfx('shoot'); w.cd = st.cd * P.hasteEff;
  },
  rocket(w, st, P) {
    if (w.cd > 0) return;
    const t = nearestMon(P.x, P.y - 4, 190, false); if (!t) { w.cd = 0.15; return; }
    const base = Math.atan2(t.y - P.y, t.x - P.x);
    for (let i = 0, n = st.n + P.extra; i < n; i++) {
      const a = base + rr(-0.8, 0.8);
      shoot({ k: 'rocket', x: P.x, y: P.y - 6, vx: Math.cos(a) * 150, vy: Math.sin(a) * 150, r: 4, dmg: st.dmg * 0.5 * P.mightEff, life: 2.2, homing: 1, boomR: st.r * P.area, boomD: st.dmg * P.mightEff, sparks: st.sparks || 0 });
    }
    sfx('fuse'); w.cd = st.cd * P.hasteEff;
  },
  loaded(w, st, P) {
    if (w.cd > 0) return;
    const n = st.n + P.extra, tg = nearestMons(P.x, P.y - 4, 170, n, true); if (!tg.length) { w.cd = 0.15; return; }
    for (let i = 0; i < n; i++) {
      const t = tg[i % tg.length], a = Math.atan2(t.y - 3 - (P.y - 4), t.x - P.x) + (i >= tg.length ? rr(-0.3, 0.3) : 0);
      let roll = 1 + Math.floor(rand() * 6); if (st.best) roll = Math.max(roll, 1 + Math.floor(rand() * 6));
      const dmg = st.dmg * roll * P.mightEff, six = roll === 6 && st.six;
      shoot({ k: 'die', x: P.x, y: P.y - 4, vx: Math.cos(a) * 190, vy: Math.sin(a) * 190, r: 4, dmg, life: 1.4, pierce: 1, hits: new Map(), bounces: st.bounces, roll, boomR: six ? st.six * P.area : 0, boomD: dmg * 0.6 });
    }
    sfx('dice'); w.cd = st.cd * P.hasteEff;
  },
  tide(w, st, P) {
    if (w.cd > 0) return;
    const R = st.r * P.area; if (!nearestMon(P.x, P.y - 3, R + 6, false)) { w.cd = 0.15; return; }
    nearMons(P.x, P.y - 3, R, e => {
      const dx = e.x - P.x, dy = e.y - P.y, d = Math.hypot(dx, dy); if (d > R + e.r) return;
      if (hurtMon(e, st.dmg * P.mightEff, dx / (d || 1) * st.kb, dy / (d || 1) * st.kb) && st.scald && !e.dead) { e.burnT = 2.2; e.burn = st.dmg * 0.3 * P.mightEff; e.burnBy = BY; }
    });
    if (st.scald) { const B = G.ebullets; for (let i = B.length - 1; i >= 0; i--) if (Math.hypot(B[i].x - P.x, B[i].y - P.y) < R) { B[i] = B[B.length - 1]; B.pop(); } }
    G.fxs.push({ k: 'tide', x: P.x, y: P.y - 2, R, hot: st.scald, t: 0, d: 0.32 }); sfx('splash'); w.cd = st.cd * P.hasteEff;
  },
  honey(w, st, P) {
    if (w.cd > 0) return;
    const c = []; for (const e of G.mons) if (!e.dead && e.emerge <= 0 && (e.x - P.x) * (e.x - P.x) + (e.y - P.y) * (e.y - P.y) < 130 * 130) c.push(e);
    if (!c.length) { w.cd = 0.2; return; }
    for (let i = 0, n = st.n + P.extra; i < n; i++) {
      const t = pick(c);
      G.shots.push({ k: 'bomb', pot: { r: st.r * P.area, life: st.life, slow: st.slow, sticky: st.sticky || 0 }, x: P.x, y: P.y - 6, z: 0, sx: P.x, sy: P.y - 6, tx: t.x + rr(-5, 5), ty: t.y + rr(-5, 5), t: -i * 0.15, d: 0.55, R: 0, dmg: st.dmg * P.mightEff, by: BY });
    }
    w.cd = st.cd * P.hasteEff;
  },
  toad(w, st, P, dt) {
    const R = st.r * P.area;
    for (let i = w.pets.length - 1; i >= 0; i--) {                      // a toadstool pops when something steps close
      const m = w.pets[i]; m.t += dt; if (m.t < 0.4) continue;
      let hit = false; nearMons(m.x, m.y, 13, e => { if (!hit && !e.dead && e.emerge <= 0 && Math.hypot(e.x - m.x, e.y - m.y) < 13 + e.r) hit = true; });
      if (hit) { addZone(m.x, m.y, R, st.life, 'cloud', st.dmg * P.mightEff, { slow: st.slow || 0 }); burst(m.x, m.y - 3, 8, PAL.l, 50); sfx('squish'); w.pets.splice(i, 1); }
    }
    if (w.cd > 0) return; w.cd = st.cd * P.hasteEff;
    for (let k = 0; k < st.ring; k++) {
      const a = k / st.ring * TAU + G.t, x = P.x + (st.ring > 1 ? Math.cos(a) * 15 : 0), y = P.y + (st.ring > 1 ? Math.sin(a) * 12 : 0);
      if (blocked(x, y, F_WALK) || w.pets.some(m => Math.abs(m.x - x) < 10 && Math.abs(m.y - y) < 8)) continue;
      if (w.pets.length >= st.max + P.extra * 2) w.pets.shift();
      w.pets.push({ x, y, t: 0 });
    }
  },
  whip(w, st, P, dt) {
    for (let i = w.pend.length - 1; i >= 0; i--) { w.pend[i].t -= dt; if (w.pend[i].t <= 0) { lash(w.pend[i].a, st); w.pend.splice(i, 1); } }
    if (w.cd > 0) return;
    const tgt = nearestMon(P.x, P.y - 3, st.range * P.area + 4, false); if (!tgt) { w.cd = 0.08; return; }
    const a = Math.atan2(tgt.y - P.y, tgt.x - P.x);
    lash(a, st); for (let i = 1; i < st.n + P.extra; i++) w.pend.push({ t: 0.12 * i, a: a + (i === 1 ? Math.PI : i * 1.3) });
    w.cd = st.cd * P.hasteEff;
  },
  coin(w, st, P) {
    if (w.cd > 0) return;
    const n = st.n + P.extra, tg = nearestMons(P.x, P.y - 4, 170, n, true); if (!tg.length) { w.cd = 0.15; return; }
    for (let i = 0; i < n; i++) {
      const t = tg[i % tg.length], a = Math.atan2(t.y - 3 - (P.y - 4), t.x - P.x) + (i >= tg.length ? rr(-0.25, 0.25) : 0);
      shoot({ k: 'coin', x: P.x, y: P.y - 4, vx: Math.cos(a) * 220, vy: Math.sin(a) * 220, r: 4, dmg: st.dmg * P.mightEff, life: 1.0, inf: 1, hits: new Map(), hops: st.hops, pay: st.pay || 0, kb: 0.4 });
    }
    sfx('coin'); w.cd = st.cd * P.hasteEff;
  },
  snowball(w, st, P) {
    if (w.cd > 0) return;
    const far = nearestMons(P.x, P.y - 4, 150, 99, true); if (!far.length) { w.cd = 0.15; return; }
    const t = far[far.length - 1], base = Math.atan2(t.y - 3 - (P.y - 4), t.x - P.x);   // roll at the farthest one in sight: more room to grow
    for (let i = 0, n = st.n + P.extra; i < n; i++) {
      const a = base + (i ? Math.ceil(i / 2) * 0.4 * (i % 2 ? 1 : -1) : 0), d0 = st.dmg * P.mightEff;
      shoot({ k: 'snow', x: P.x + Math.cos(a) * 6, y: P.y - 3 + Math.sin(a) * 6, vx: Math.cos(a) * 115, vy: Math.sin(a) * 115, r: 3.5, r0: 3.5, dmg: d0, d0, life: 1.5 * P.area, inf: 1, hits: new Map(), grow: st.grow, slow: 0.3, kb: 1.6, drift: st.drift || 0 });
    }
    sfx('swing'); w.cd = st.cd * P.hasteEff;
  },
  pepper(w, st, P) {
    if (w.cd > 0) return;
    const R = st.range * P.area, tgt = nearestMon(P.x, P.y - 3, R + 8, false); if (!tgt) { w.cd = 0.1; return; }
    const a = Math.atan2(tgt.y - P.y, tgt.x - P.x); w.cd = st.tick * P.hasteEff; w.shT++;
    nearMons(P.x, P.y - 3, R, e => {
      const dx = e.x - P.x, dy = e.y - P.y, d = Math.hypot(dx, dy); if (d > R + e.r) return;
      if (d > 9 && Math.abs(angDiff(Math.atan2(dy, dx), a)) > st.arc / 2) return;
      if (hurtMon(e, st.dmg * P.mightEff, dx / (d || 1) * 10, dy / (d || 1) * 10) && !e.dead) { e.burnT = 2.2; e.burn = st.burn * P.mightEff; e.burnBy = BY; }
    });
    G.fxs.push({ k: 'breath', a, R, arc: st.arc, t: 0, d: st.tick * P.hasteEff + 0.06, seed: (fxr() * 999) | 0 });
    for (let i = 0; i < 2; i++) { const fa = a + (fxr() - 0.5) * st.arc; part(P.x + Math.cos(fa) * R * 0.8, P.y - 4 + Math.sin(fa) * R * 0.8, Math.cos(fa) * 30, Math.sin(fa) * 30 - 14, 0.35, fxr() < 0.5 ? PAL.o : PAL.g, 1); }
    if (st.trail && w.shT % 4 === 0) addZone(P.x + Math.cos(a) * R * 0.6, P.y + Math.sin(a) * R * 0.6, 15, 2.5, 'flame', st.dmg * 1.5 * P.mightEff);
    if (w.shT % 3 === 0) sfx('burn');
  },
  buzz(w, st, P) {
    if (w.cd > 0) return;
    const n = st.n + P.extra, tg = nearestMons(P.x, P.y - 4, 150, n, true); if (!tg.length) { w.cd = 0.15; return; }
    for (let i = 0; i < n; i++) {                                       // rolls out to where the monster is, then spins there
      const t = tg[i % tg.length], dx = t.x - P.x, dy = t.y - 3 - (P.y - 4), sp = clamp(Math.hypot(dx, dy), 30, 120) / 0.3, a = Math.atan2(dy, dx) + (i >= tg.length ? rr(-0.5, 0.5) : 0);
      shoot({ k: 'saw', x: P.x, y: P.y - 4, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: st.r * P.area, dmg: st.dmg * P.mightEff, life: st.life, inf: 1, hits: new Map(), rehit: 0.3, kb: 0.25, out: 0.3, stick: 1, crawl: st.crawl || 0 });
    }
    sfx('saw'); w.cd = st.cd * P.hasteEff;
  },
  sentry(w, st, P, dt) {
    for (let i = w.pets.length - 1; i >= 0; i--) {
      const s = w.pets[i]; s.life -= dt; s.cd -= dt; s.kick = Math.max(0, s.kick - dt);
      if (s.life <= 0) { burst(s.x, s.y - 5, 6, PAL.Y, 40); w.pets.splice(i, 1); continue; }
      if (s.cd > 0) continue;
      const tg = nearestMon(s.x, s.y - 7, 125, true); if (!tg) { s.cd = 0.15; continue; }
      const a = Math.atan2(tg.y - 3 - (s.y - 7), tg.x - s.x), v = st.volley || 1; s.face = tg.x < s.x ? -1 : 1; s.kick = 0.08;
      for (let k = 0; k < v; k++) { const fa = a + (k - (v - 1) / 2) * 0.16; shoot({ k: 'guard', x: s.x, y: s.y - 7, vx: Math.cos(fa) * 235, vy: Math.sin(fa) * 235, r: 3, dmg: st.dmg * P.mightEff, life: 0.6, pierce: st.pierce || 0, hits: st.pierce ? new Map() : null }); }
      sfx('shoot'); s.cd = st.cd * P.hasteEff;
    }
    if (w.cd > 0 || w.pets.length >= st.max + P.extra) return;
    if (!nearestMon(P.x, P.y - 4, 150, false)) { w.cd = 0.2; return; }
    const sx = P.x + (P.face === 1 ? -7 : 7); w.pets.push({ x: blocked(sx, P.y + 3, F_WALK) ? P.x : sx, y: P.y + 3, life: st.life, cd: 0.3, face: 1, kick: 0 }); sparkle(P.x, P.y - 4, 6, PAL.y); sfx('windup'); w.cd = st.wind * Math.max(0.5, P.hasteEff);
  },
};
// A maxed weapon evolves the moment you stand in the room that tempers it.
function evolveCheck() {
  const P = G.P, room = G.curRoom; if (!roomLive(room) || P.pose > 0 || G.freeze > 0) return;
  const id = EVO_ROOM[room.type]; if (!id) return;
  const w = P.weapons.find(w => w.id === id); if (!w || w.evo || w.lv < WEAPONS[id].max) return;
  const e = WEAPONS[id].evo;
  w.evo = true; w.cd = 0.3; G.stats.evos++;
  P.pose = 1.35; P.poseBoon = { kind: 'w', id }; P.poseEvo = true; P.face = 2; G.freeze = 1.25; sfx('evolve'); G.shake = Math.max(G.shake, 4);
  sparkle(P.x, P.y - 20, 40, PAL.y); sparkle(P.x, P.y - 20, 20, PAL.w); G.fxs.push({ k: 'tide', x: P.x, y: P.y - 10, R: 64, t: 0, d: 0.6, hot: 1 });   // the burst of its beat
  banner(e.name.toUpperCase(), WEAPONS[id].name + ' evolved! ' + e.desc, '#ffd95e', 3.6);
}
function updateWeapons(dt) {
  const P = G.P; if (G.over) return;
  for (const w of P.weapons) { w.cd -= dt; BY = 'w:' + w.id; WUPD[w.id](w, wStat(w), P, dt); }
  BY = null;
  evolveCheck();
}
