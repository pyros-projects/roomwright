/* ============================ 13b CARD COACH ========================== */
// Teaches the draft card on the card itself. The first draft walks through its parts: the room, the boon,
// the doors, the Stairwell. Later drafts explain one new thing each, the first time a card shows it: a
// level-up, resonance, an evolution, a dead end, the open Stairwell, and what to do with a hand you do not want. H (or the EXPLAIN chip) explains the
// selected card again at any time. A lesson is shown once per save (Save.data.tips). RW.coach(false)
// switches the coach off for automated runs.
const stairsLocked = () => (G.dir.boss || G.dir.stairsBuilt || G.bossDown) ? 0 : Math.max(0, STAIRS_MIN - G.fstat.rooms);   // rooms still to draft before the Stairwell is offered
const helpLabel = () => (Input.touch ? '?  ' : 'H  ') + 'EXPLAIN';

// the lessons for this draft: [{ id, card (-1 = the Stairwell bar), part, title, text }]
function coachPlan(D, all) {
  const seen = Save.data.tips, cards = D.cards, steps = [];
  const add = (id, card, part, title, text) => steps.push({ id, card, part, title, text });
  const room = i => add('c_card', i, 'room', 'THE ROOM', 'It is built behind this door. Its power works for the whole floor.');
  const boon = i => add('c_card', i, 'boon', 'THE BOON', 'A weapon, an upgrade or a charm. It waits in the new room: walk in and take it.');
  const doors = i => add('c_card', i, 'doors', 'NEW DOORS', 'Each sealed door is a later draft, and one more place monsters knock. The % is how much the knocking changes.');
  const dead = i => add('c_dead', i, 'doors', 'DEAD END', 'This room has no new doors. The knocking gets quieter, and you have one draft fewer.');
  const locked = () => add('c_card', -1, 'bar', 'THE STAIRWELL', 'The way down. It unlocks after ' + STAIRS_MIN + ' rooms on this floor and then shows up here, in a draft.');
  const stairs = () => add('c_stairs', -1, 'bar', 'THE STAIRWELL', 'It is open. Build it instead of a room and the warden comes. Beat the warden to go down. More rooms first make you stronger.');
  const stars = i => add('c_stars', i, 'stars', 'STARS', cards[i].lvTo > cards[i].lv
    ? 'You own this room. Draft it again and every room of its type gains a star: stronger for the whole run.'
    : 'This room type has all its stars. Another one still adds its power to the floor.');
  const res = i => add('c_res', i, 'plan', 'RESONANCE', 'The room next door has the same element. Joined by a doorway, each makes the other stronger: the +% on the map.');
  const evo = i => { const e = cards[i].evo, w = WEAPONS[e.id]; add('c_evo', i, 'plan', 'EVOLUTION', e.ready ? w.name + ' is ready. Walk into this room and it evolves.' : w.name + ' evolves in this room. Bring it to level ' + w.max + ', then walk in.'); };
  const back = () => add('c_back', -1, 'chip', 'NOTHING YOU WANT?', 'Esc is free, and every door holds its own cards. Or knock back (R): new cards here, and what waits behind the door comes out. A second knock on the same floor costs far more.');
  const first = f => cards.findIndex(f);
  let i = D.sel;
  if (all) {                          // H: everything the selected card shows
    const c = cards[i]; room(i); if (c.lv > 0) stars(i); if (c.res > 0) res(i); if (c.evo) evo(i); boon(i);
    if (c.plan.fresh === 0) dead(i); else doors(i);
    if (D.stairs) stairs(); else if (D.locked) locked();
    if (D.rerolls <= 0) back();
  } else if (!seen.c_card) {          // the first draft: the parts of a card, on one that has new doors
    if (cards[i].plan.fresh === 0 && first(c => c.plan.fresh > 0) >= 0) i = first(c => c.plan.fresh > 0);
    room(i); boon(i); doors(i); if (D.stairs) stairs(); else if (D.locked) locked();
  } else if (D.stairs && !seen.c_stairs) stairs();      // later drafts: one new thing, when it first shows
  else if (!seen.c_stars && (i = first(c => c.lv > 0 && c.lvTo > c.lv)) >= 0) stars(i);
  else if (!seen.c_res && (i = first(c => c.res > 0)) >= 0) res(i);
  else if (!seen.c_evo && (i = first(c => c.evo)) >= 0) evo(i);
  else if (!seen.c_dead && (i = first(c => c.plan.fresh === 0)) >= 0) dead(i);
  else if (!seen.c_back && D.rerolls <= 0) back();      // nothing else new: what to do with a hand you do not want
  return steps;
}
function coachFocus(D) { const s = D.coach.steps[D.coach.i]; if (s.card >= 0) { D.sel = s.card; D.onStairs = false; } else if (s.part === 'bar' && D.stairs) D.onStairs = true; }
function coachStart(D, all) {
  if (!App.coach || G.demo) return;
  const steps = coachPlan(D, all); if (!steps.length) return;
  D.coach = { steps, i: 0, t0: D.t }; coachFocus(D);
}
function coachEnd(D) { for (const s of D.coach.steps) Save.data.tips[s.id] = 1; Save.store(); D.coach = null; }
function coachInput(D) {              // while a lesson is up, input only turns its pages
  const C = D.coach;
  if (Input.hit('back') || Input.hit('help')) { coachEnd(D); sfx('back'); return; }
  const next = Input.hit('ok') || Input.hit('dash') || Input.hit('right') || Input.mouse.click || Input.hit('c1') || Input.hit('c2') || Input.hit('c3') || Input.hit('c4');
  if (!next || D.t < 0.55 || D.t - C.t0 < 0.35) return;
  sfx('tick'); if (++C.i >= C.steps.length) coachEnd(D); else { C.t0 = D.t; coachFocus(D); }
}
// the screen box of one section of a draft card; the selected card sits 3px higher (see drawCard)
function cardPart(r, part) {
  const y = r.y - 3, by = y + r.h - (r.w < 112 ? 75 : 72), fy = y + r.h - 13;
  if (part === 'room') return { x: r.x + 2, y: y + 2, w: r.w - 4, h: by - y - 4 };
  if (part === 'plan') return { x: r.x + 4, y: y + 18, w: r.w - 8, h: 44 };
  if (part === 'stars') return { x: r.x + 2, y: y + 62, w: r.w - 4, h: by - y - 64 };
  if (part === 'boon') return { x: r.x + 2, y: by - 1, w: r.w - 4, h: fy - 4 - by };
  return { x: r.x + 2, y: fy - 5, w: r.w - 4, h: y + r.h - fy + 3 };   // doors
}
function renderCoach(g, D, L_) {
  const C = D.coach; if (!C || D.t < 0.45) return;
  const s = C.steps[C.i], r = s.card >= 0 ? L_.rects[s.card] : null, box = r ? cardPart(r, s.part) : s.part === 'chip' ? (L_.kb || L_.re) : (L_.bar || L_.lock); if (!box) return;
  // dim everything except the part in question, and frame that part
  g.fillStyle = 'rgba(13,10,26,0.76)';
  g.fillRect(0, 0, VW, box.y); g.fillRect(0, box.y + box.h, VW, VH - box.y - box.h); g.fillRect(0, box.y, box.x, box.h); g.fillRect(box.x + box.w, box.y, VW - box.x - box.w, box.h);
  g.fillStyle = (Math.floor(frameT * 3) & 1) ? '#ffd95e' : '#fff8e8';
  g.fillRect(box.x - 1, box.y - 1, box.w + 2, 1); g.fillRect(box.x - 1, box.y + box.h, box.w + 2, 1); g.fillRect(box.x - 1, box.y, 1, box.h); g.fillRect(box.x + box.w, box.y, 1, box.h);
  // the note sits beside the card where there is room, and above the Stairwell bar
  const pw = Math.min(126, VW - 8), lines = wrapText(s.text, pw - 12), last = C.i === C.steps.length - 1, ph = 17 + lines.length * 9 + 13;
  const foot = (Input.touch ? 'TAP' : 'ENTER') + (last ? '  got it' : '  next') + (C.steps.length > 1 ? '   ' + (C.i + 1) + '/' + C.steps.length : '');
  let px = Math.round(VW / 2 - pw / 2), py = box.y - ph - 5;
  if (r) {
    if (r.x + r.w + 4 + pw <= VW - 2) px = r.x + r.w + 4; else if (r.x - pw - 4 >= 2) px = r.x - pw - 4;
    py = clamp(Math.round(box.y + box.h / 2 - ph / 2), 3, VH - ph - 3);
  } else if (s.part === 'chip') { px = clamp(box.x + box.w - pw, 2, VW - pw - 2); py = box.y + box.h + 5; }   // a chip sits at the top: the note hangs under it
  panel(g, px, py, pw, ph, '#ffd95e', '#241d3a');
  txt(g, s.title, px + 6, py + 5, '#ffd95e');
  lines.forEach((ln, k) => txt(g, ln, px + 6, py + 17 + k * 9, '#fff8e8'));
  txt(g, foot, px + pw - 6, py + ph - 11, '#9aa3b5', 1);
}
