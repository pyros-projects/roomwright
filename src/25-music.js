/* ========================= 8e CONTENT: music scores =================== */
// Music written out note by note, for a track that is more than a pattern. Snd plays it ("a written score" in
// 02-audio). Everything counts in steps: a step is a sixteenth, 16 to the bar, from 0.
// A note is [step in the piece, voice, pitch, steps long, loudness]: the pitch is a MIDI number (for the drum
// voice the name of a sound), the loudness a MIDI velocity.

// "What the Cellar Keeps", floor 1: 48 bars in A minor at 112, on the tune the floor has had from the first
// version (bars 1, 2, 7 and 8 of the theme are that tune, bars 3 to 6 answer it). Six sections of eight bars:
//    1-8   the theme over arpeggio, bass and a light pulse
//    9-16  the theme passed between two voices, half a bar each, with a counter voice under it
//   17-24  C major, no kick: the counter voice has the tune over a shaker, one bell a bar
//   25-32  the climb back: one figure rising in three steps to the dominant
//   33-40  the theme at its fullest (every voice but the answering one), ending on the piece's highest note
//   41-48  the way back down: arpeggio, bass and claves, the answering voice remembering the theme
function cellarScore() {
  const notes = [], put = (voice, bar, st, pitch, len, vel) => notes.push([(bar - 1) * 16 + st, voice, pitch, len, vel]);
  const bars = (a, b, f) => { for (let bar = a; bar <= b; bar++) f(bar, bar - a); };
  // one chord a bar, bars counted from 1
  const A = ['Am', 'F', 'C', 'G', 'Am', 'F', 'G', 'E'];
  const CH = [0, ...A, ...A, 'C', 'C', 'F', 'F', 'C', 'C', 'G', 'G', 'Am', 'Am', 'F', 'F', 'Dm', 'Dm', 'E7', 'E7', ...A, 'Am', 'Am', 'F', 'F', 'Am', 'Am', 'F', 'E'];
  CH[40] = 'E7';                      // the counter voice's D makes the high point a dominant seventh

  /* ---- the tune, a bar at a time: [step in the bar, pitch, steps long] ---- */
  const THEME = [
    [[0, 76, 4], [4, 81, 2], [6, 79, 2], [8, 76, 4], [12, 72, 2], [14, 74, 2]],     // Am  E A G | E C D
    [[0, 77, 6], [6, 76, 2], [8, 74, 2], [10, 72, 2], [12, 69, 2]],                // F   F . E | D C A, a breath
    [[0, 79, 4], [4, 84, 2], [6, 83, 2], [8, 79, 4], [12, 76, 2], [14, 77, 2]],     // C   bar 1 a third up
    [[0, 83, 6], [6, 81, 2], [8, 79, 2], [10, 77, 2], [12, 74, 2]],                // G   bar 2 up
    [[0, 76, 4], [4, 81, 2], [6, 79, 2], [8, 76, 4], [12, 81, 2], [14, 84, 2]],     // Am  bar 1, its tail rising
    [[0, 84, 6], [6, 81, 2], [8, 77, 2], [10, 81, 2], [12, 84, 4]],                // F   bar 2's rhythm
    [[0, 83, 4], [4, 79, 4], [8, 86, 6], [14, 83, 2]],                             // G
    [[0, 80, 4], [4, 83, 4], [8, 76, 6]],                                          // E   a breath
  ];
  const CLIMB = [
    [[4, 76, 4], [8, 81, 4], [12, 84, 4]], [[0, 83, 8], [8, 81, 4], [12, 76, 4]],   // Am  . E A C' | B - A E
    [[4, 77, 4], [8, 81, 4], [12, 84, 4]], [[0, 86, 8], [8, 84, 4], [12, 81, 4]],   // F   . F A C' | D' - C' A
    [[4, 74, 4], [8, 77, 4], [12, 81, 4]], [[0, 86, 8], [8, 81, 4], [12, 77, 4]],   // Dm  . D F A  | D' - A F
    [[0, 80, 4], [4, 83, 4], [8, 86, 8]], [[0, 83, 4], [4, 80, 4], [8, 83, 6]],     // E7  G# B D'  | B G# B, a breath
  ];
  // a bar of melody: its first note a little stronger, and the high notes
  const sing = (voice, bar, ns, vel) => { for (const [st, p, len] of ns) put(voice, bar, st, p, len, Math.min(118, vel + (st === 0 ? 5 : 0) + (p >= 84 ? 3 : 0))); };
  bars(1, 8, (bar, i) => sing('lead', bar, THEME[i], 84));
  bars(9, 14, (bar, i) => { sing('lead', bar, THEME[i].filter(n => n[0] < 8), 82); sing('answer', bar, THEME[i].filter(n => n[0] >= 8), 80); });
  sing('lead', 15, THEME[6], 86); sing('lead', 16, THEME[7], 84);
  bars(25, 32, (bar, i) => sing('lead', bar, CLIMB[i], 76 + 2 * i));
  bars(33, 39, (bar, i) => sing('lead', bar, THEME[i], i >= 4 ? 92 : 90));
  sing('lead', 40, [[0, 80, 4], [4, 83, 4], [8, 88, 8]], 94);                       // the last note is left to ring
  sing('answer', 42, [[4, 76, 2], [6, 81, 2], [8, 79, 4], [12, 76, 4]], 62);
  sing('answer', 46, [[4, 76, 2], [6, 81, 2], [8, 79, 8]], 58);

  /* ---- arpeggio: close voicings that keep common tones from chord to chord, accents in 3 + 3 + 2 ---- */
  const VOICING = { Am: [69, 72, 76, 81, 84], F: [69, 72, 77, 81, 84], C: [67, 72, 76, 79, 84], G: [67, 71, 74, 79, 83], E: [68, 71, 76, 80, 83], E7: [68, 71, 74, 76, 80], Dm: [69, 74, 77, 81, 86] };
  const WIDE = { C: [60, 67, 76, 79, 88, 79, 76, 67], F: [65, 72, 81, 84, 88, 84, 81, 72], G: [67, 74, 79, 83, 88, 83, 79, 74] };   // up two octaves and down, E on top of each
  const TURNS = [0, 3, 6, 8, 11, 14];
  const arp16 = (bar, order, vel) => { for (let st = 0; st < 16; st++) put('arp', bar, st, VOICING[CH[bar]][order[st % order.length]], 1, vel + (TURNS.includes(st) ? 12 : 0)); };
  const arp8 = (bar, ps, vels) => ps.forEach((p, i) => put('arp', bar, 2 * i, p, 2, vels[i]));
  bars(1, 8, bar => arp16(bar, [0, 1, 2, 3, 2, 1, 2, 1], 60));
  bars(9, 16, bar => arp16(bar, [0, 2, 1, 2, 3, 2, 1, 2], 60));
  bars(17, 24, bar => arp8(bar, WIDE[CH[bar]], [58, 54, 58, 62, 74, 60, 56, 52]));
  bars(25, 28, bar => { const v = VOICING[CH[bar]]; arp8(bar, [v[0], v[2], v[1], v[3], v[2], v[3], v[2], v[1]], [62, 56, 56, 64, 58, 62, 54, 58]); });
  bars(29, 32, (bar, i) => arp16(bar, [0, 1, 2, 3, 2, 1, 2, 1], 60 + 3 * i));       // eighths tighten into sixteenths as the climb nears the top
  bars(33, 40, bar => arp16(bar, [0, 1, 2, 3, 4, 3, 2, 1], 66));
  bars(41, 47, bar => arp16(bar, [0, 1, 2, 0, 1, 2, 0, 1, 1, 2, 3, 1, 2, 3, 1, 2], 62));   // a three-note cell that turns one place on in the second half of the bar
  arp8(48, [64, 71, 76, 81, 64, 71, 76, 80], [60, 56, 60, 70, 62, 60, 66, 76]);     // the fourth on top falls to the leading tone, and the loop is home

  /* ---- bass ---- */
  const ROOT = { Am: 45, F: 41, C: 48, G: 43, E: 40, E7: 40, Dm: 50 }, FIFTH = { Am: 52, F: 48, C: 55, G: 50, E: 47, E7: 47, Dm: 57 };
  // the floor's first bass rhythm: the root, the root again before the third beat, its octave, the fifth, then `last` (the root unless named)
  const walk = (bar, vel, last) => { const r = ROOT[CH[bar]]; for (const [st, p, len, v] of [[0, r, 6, vel + 6], [6, r, 2, vel - 8], [8, r + 12, 4, vel], [12, FIFTH[CH[bar]], 2, vel - 4], [14, last || r, 2, vel - 6]]) put('bass', bar, st, p, len, v); };
  bars(1, 16, bar => walk(bar, 78, CH[bar] === 'E' ? 44 : 0));                      // under E the last eighth leads up to A
  bars(17, 24, bar => { put('bass', bar, 0, ROOT[CH[bar]], 8, 68); put('bass', bar, 8, FIFTH[CH[bar]], 8, 62); });   // two steps a bar
  bars(25, 28, bar => { put('bass', bar, 0, ROOT[CH[bar]], 8, 72); put('bass', bar, 8, ROOT[CH[bar]], 6, 66); put('bass', bar, 14, FIFTH[CH[bar]], 2, 64); });
  bars(29, 32, (bar, i) => walk(bar, 74 + 3 * i, bar === 31 ? 50 : bar === 32 ? 44 : 0));
  bars(33, 40, bar => walk(bar, 80));
  bars(41, 47, bar => { put('bass', bar, 0, ROOT[CH[bar]], 12, 78); put('bass', bar, 12, FIFTH[CH[bar]], 4, 70); });
  for (const [st, p, len, v] of [[0, 40, 8, 72], [8, 52, 4, 70], [12, 47, 2, 70], [14, 44, 2, 76]]) put('bass', 48, st, p, len, v);

  /* ---- drums (the sounds are Snd's) ---- */
  const hit = (bar, st, sound, vel) => put('drum', bar, st, sound, 1, vel);
  const shake = (bar, sound, vel, accent) => { for (let st = 0; st < 16; st += 2) hit(bar, st, sound, vel + (st % 6 ? 0 : accent)); };   // eighths, turning in threes
  const beat = (bar, kick, snare) => { hit(bar, 0, 'kick', kick); hit(bar, 8, 'kick', kick - 6); if (snare) { hit(bar, 4, 'snare', snare); hit(bar, 12, 'snare', snare + 2); } };
  bars(1, 8, bar => { shake(bar, 'hat', 58, 14); beat(bar, 76, 64); if (bar % 4 === 0) hit(bar, 14, 'pop', 54); });
  bars(9, 16, bar => { shake(bar, 'hat', 60, 14); beat(bar, 78, 66); hit(bar, 6, 'pop', 44); hit(bar, 10, 'thud', 46); hit(bar, 14, 'lowpop', 48); });
  bars(17, 24, bar => { for (const st of [0, 4, 8, 12]) hit(bar, st, 'shaker', st ? 44 : 50); if (bar % 4 === 1) hit(bar, 0, 'cymbal', 60); });
  hit(24, 12, 'snare', 58); hit(24, 14, 'snare', 66);
  bars(25, 32, (bar, i) => { shake(bar, 'hat', 56 + 2 * i, 14); beat(bar, 72 + i, bar >= 29 ? 62 + i : 0); if (bar >= 31) hit(bar, 6, 'pop', 46); });   // the drum comes back and gathers
  for (const [st, sound, vel] of [[10, 'tom1', 62], [13, 'tom2', 68], [14, 'tom3', 78], [15, 'tom2', 70]]) hit(32, st, sound, vel);
  bars(33, 40, bar => { const back = bar >= 37 ? 'clap' : 'slap'; shake(bar, 'hat', 66, 14); beat(bar, 84, 0); hit(bar, 6, 'kick', 58); hit(bar, 4, back, 72); hit(bar, 12, back, 74); if (bar < 40) hit(bar, 14, 'lowpop', 50); });
  hit(40, 10, 'boom', 80);                                                         // under the top note
  bars(41, 48, bar => { shake(bar, 'cabasa', 48, 12); hit(bar, 4, 'claves', 58); hit(bar, 12, 'claves', 60); if (bar % 4 === 1) hit(bar, 0, 'boom', 62); });
  for (const [st, sound, vel] of [[8, 'snare', 60], [10, 'snare', 64], [13, 'tom1', 66], [14, 'tom2', 76], [15, 'tom3', 70]]) hit(48, st, sound, vel);

  /* ---- counter voice, bars 9 to 41 ---- */
  const quarters = (...ps) => ps.map((p, i) => [4 * i, p, 4]);
  const COUNTER = [
    // 9-16: long notes under the passed theme, in tenths and sixths with it
    [[0, 60, 8], [8, 57, 8]], [[0, 57, 12], [12, 60, 4]], [[0, 64, 8], [8, 60, 8]], [[0, 62, 8], [8, 59, 8]], [[0, 60, 8], [8, 64, 8]], [[0, 57, 8], [8, 60, 8]], [[0, 62, 8], [8, 59, 8]], [[0, 59, 8], [8, 56, 8]],
    // 17-24: a tune of its own
    [[0, 64, 8], [8, 67, 4], [12, 64, 4]], [[0, 62, 12], [12, 60, 4]], [[0, 57, 8], [8, 60, 4], [12, 65, 4]], [[0, 64, 12], [12, 62, 4]], [[0, 64, 8], [8, 67, 4], [12, 72, 4]], [[0, 71, 8], [8, 69, 4], [12, 67, 4]], [[0, 62, 8], [8, 67, 4], [12, 71, 4]], [[0, 69, 8], [8, 67, 8]],
    // 25-32: one note a bar, rising
    [[0, 57, 16]], [[0, 60, 16]], [[0, 57, 16]], [[0, 60, 16]], [[0, 53, 16]], [[0, 57, 16]], [[0, 56, 16]], [[0, 59, 8], [8, 52, 8]],
    // 33-40: quarters against the theme, in contrary motion where the two meet; 41: the leading tone comes home
    quarters(57, 60, 64, 57), quarters(53, 60, 57, 60), quarters(60, 64, 67, 60), quarters(55, 59, 62, 59), [[0, 57, 4], [4, 60, 4], [8, 64, 8]], quarters(53, 57, 60, 65), quarters(67, 62, 59, 62), quarters(64, 62, 59, 56), [[0, 57, 4]],
  ];
  // its loudness is one curve over the piece: [bars from the start, loudness], straight lines between
  const SWELL = [[8, 66], [15.9, 70], [16, 78], [20, 92], [22, 90], [23.9, 76], [24, 58], [31.9, 100], [32, 90], [36, 98], [39.9, 104], [40, 80], [41, 60]];
  const swell = at => { let i = 1; while (at > SWELL[i][0]) i++; const [x0, y0] = SWELL[i - 1], [x1, y1] = SWELL[i]; const y = y0 + (y1 - y0) * (at - x0) / (x1 - x0), r = Math.round(y); return r - y === 0.5 && r % 2 ? r - 1 : r; };   // a half goes to the even number
  COUNTER.forEach((ns, i) => { for (const [st, p, len] of ns) put('counter', 9 + i, st, p, len, swell(8 + i + st / 16)); });

  /* ---- plucked two-note chords off the beat, and single bells ---- */
  const PAIR = { Am: [60, 64], F: [60, 65], C: [64, 67], G: [59, 62], E7: [59, 62], Dm: [62, 65] };
  bars(27, 40, (bar, i) => { for (const st of [4, 12]) for (const p of PAIR[CH[bar]]) put('pluck', bar, st, p, 2, bar < 33 ? 56 + 3 * i : 74); });
  [96, 91, 93, 89, 88, 84, 86, 83].forEach((p, i) => put('bell', 17 + i, 12, p, 4, 58 - i));       // one a bar, falling from C7 to B5
  for (const [bar, st, p, vel] of [[33, 0, 93, 62], [35, 8, 96, 66], [37, 0, 93, 64], [39, 8, 98, 68], [40, 8, 100, 72], [43, 8, 96, 50], [47, 8, 93, 48]]) put('bell', bar, st, p, 4, vel);
  return notes;
}
