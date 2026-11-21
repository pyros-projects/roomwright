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

// "What Grows Without Light", floor 2 (The Undergarden): 48 bars in D minor at 100, on the tune the floor has had
// from the first version, all eight bars of it. Six sections of eight bars:
//    1-8   the pods: a slow arpeggio whose accents wobble, croaks, two cries from above; no tune yet
//    9-16  the tune
//   17-24  the tune again, the counter voice winding round it in contrary motion
//   25-32  the floor gives way: the bass sinks by half steps from D to A, a line a tenth above sinks with it,
//          one bell keeps striking the same A, and a cry answers every second bar
//   33-40  everything grows: the tune with every voice; its seventh bar buckles a half step (E flat for G minor)
//   41-48  under the roots: the bass has the tune at half speed, and the last cry hands back to the pods
function gardenScore() {
  const notes = [], put = (voice, bar, st, pitch, len, vel) => notes.push([(bar - 1) * 16 + st, voice, pitch, len, vel]);
  const bars = (a, b, f) => { for (let bar = a; bar <= b; bar++) f(bar, bar - a); };
  // one chord a bar, bars counted from 1; under the sinking bass (25-32) the chords are named by their roots
  const STILL = ['Dm', 'Dm', 'Bb', 'Bb', 'Dm', 'Dm', 'Gm', 'A'], TUNE = ['Dm', 'Bb', 'F', 'C', 'Dm', 'Bb', 'Gm', 'A'];
  const CH = [0, ...STILL, ...TUNE, ...TUNE, 'Dm', 'A', 'Am', 'G', 'Bb', 'Gm', 'A', 'A', ...TUNE, ...STILL];
  CH[39] = 'Eb';                      // the buckle

  /* ---- the tune, a bar at a time: [step in the bar, pitch, steps long] ---- */
  const THEME = [
    [[0, 74, 4], [4, 77, 4], [8, 81, 6], [14, 79, 2]],                 // Dm  D F A . G
    [[0, 77, 6], [6, 74, 2], [8, 70, 4], [12, 74, 2]],                 // Bb  F . D Bb D, a breath
    [[0, 72, 4], [4, 77, 4], [8, 81, 4], [12, 84, 4]],                 // F   C F A C'
    [[0, 79, 6], [6, 76, 2], [8, 72, 6]],                              // C   G . E C, a breath
    [[0, 74, 2], [2, 77, 2], [4, 81, 4], [8, 86, 6], [14, 84, 2]],     // Dm  D F A D' . C'
    [[0, 82, 4], [4, 77, 4], [8, 74, 4], [12, 77, 2]],                 // Bb  Bb F D F, a breath
    [[0, 79, 4], [4, 74, 4], [8, 70, 4], [12, 74, 4]],                 // Gm  G D Bb D
    [[0, 73, 4], [4, 76, 4], [8, 81, 6]],                              // A   C# E A, a breath
  ];
  const sing = (voice, bar, ns, vel) => { for (const [st, p, len] of ns) put(voice, bar, st, p, len, Math.min(118, vel + (st === 0 ? 5 : 0) + (p >= 84 ? 3 : 0))); };
  bars(9, 16, (bar, i) => sing('lead', bar, THEME[i], 84));
  bars(17, 24, (bar, i) => sing('lead', bar, THEME[i], 86));
  bars(33, 38, (bar, i) => sing('lead', bar, THEME[i], 92));
  sing('lead', 39, [[0, 79, 4], [4, 75, 4], [8, 70, 4], [12, 75, 4]], 94);          // G Eb Bb Eb: the tune's D gives way
  sing('lead', 40, [[0, 73, 4], [4, 76, 4], [8, 81, 8]], 96);                       // the last A is left to ring

  /* ---- the cry: three notes from above, each time ending on the same A ---- */
  const cry = (bar, top, mid, vel) => { put('answer', bar, 4, top, 2, vel); put('answer', bar, 6, mid, 6, vel - 4); put('answer', bar, 12, 81, 4, vel - 10); };
  const D6 = 86, CS6 = 85, BB5 = 82, B5 = 83;
  cry(4, D6, BB5, 70); cry(8, CS6, BB5, 74);                                         // over B flat: D Bb A; over A: C# Bb A
  cry(26, CS6, BB5, 76); cry(28, D6, B5, 74); cry(30, D6, BB5, 74); cry(32, CS6, BB5, 80);
  cry(34, D6, BB5, 78); cry(38, D6, BB5, 78);
  cry(44, D6, BB5, 66); cry(48, CS6, BB5, 70);

  /* ---- arpeggio: close voicings; its accents wobble between 3 + 3 + 2 and 2 + 3 + 3 from bar to bar ---- */
  const VOICING = { Dm: [62, 65, 69, 74, 77], Bb: [62, 65, 70, 74, 77], F: [60, 65, 69, 72, 77], C: [60, 64, 67, 72, 76], Gm: [62, 67, 70, 74, 79], A: [61, 64, 69, 73, 76],
    Eb: [63, 67, 70, 75, 79], Am: [60, 64, 69, 72, 76], G: [59, 62, 67, 71, 74] };
  const lean = bar => bar % 2 ? [0, 3, 6, 8, 11, 14] : [0, 2, 5, 8, 10, 13];
  const arp16 = (bar, order, vel) => { for (let st = 0; st < 16; st++) put('arp', bar, st, VOICING[CH[bar]][order[st % order.length]], 1, vel + (lean(bar).includes(st) ? 12 : 0)); };
  const arp8 = (bar, order, vel) => { for (let i = 0; i < 8; i++) put('arp', bar, 2 * i, VOICING[CH[bar]][order[i]], 2, vel + ((i + bar) % 3 ? 0 : 10)); };
  bars(1, 8, bar => arp8(bar, [0, 2, 1, 3, 2, 1, 2, 1], 50));
  bars(9, 16, bar => arp16(bar, [0, 2, 1, 2, 3, 2, 1, 2], 58));
  bars(17, 24, bar => arp16(bar, [0, 2, 1, 2, 3, 2, 4, 2], 60));
  bars(25, 32, bar => arp8(bar, [0, 1, 2, 3, 2, 1, 2, 1], 48));
  bars(33, 40, bar => arp16(bar, [0, 1, 2, 3, 4, 3, 2, 1], 64));
  bars(41, 48, bar => arp8(bar, [0, 2, 1, 3, 2, 1, 2, 1], 50));

  /* ---- bass ---- */
  const ROOT = { Dm: 38, Bb: 46, F: 41, C: 48, Gm: 43, A: 45, Eb: 39 };
  // the floor's first bass rhythm: the root, its fifth before the third beat, the octave, the fifth again
  const walk = (bar, vel, last) => { const r = ROOT[CH[bar]]; for (const [st, p, len, v] of [[0, r, 6, vel + 6], [6, r + 7, 2, vel - 8], [8, r + 12, 4, vel], [14, last || r + 7, 2, vel - 6]]) put('bass', bar, st, p, len, v); };
  bars(1, 8, bar => { const r = ROOT[CH[bar]]; put('bass', bar, 0, r, 8, 70); put('bass', bar, 8, r + 7, 6, 62); put('bass', bar, 14, r, 2, 60); });
  bars(9, 16, bar => walk(bar, 76, CH[bar] === 'A' ? 49 : 0));                     // under A the last eighth is C sharp, leading home
  bars(17, 24, bar => walk(bar, 78, CH[bar] === 'A' ? 49 : 0));
  [50, 49, 48, 47, 46, 46, 45].forEach((p, i) => { put('bass', 25 + i, 0, p, 8, 74); put('bass', 25 + i, 8, p, 8, 66); });   // D C# C B Bb Bb A
  for (const [st, p, len, v] of [[0, 45, 8, 74], [8, 45, 4, 66], [12, 49, 4, 72]]) put('bass', 32, st, p, len, v);
  bars(33, 40, bar => walk(bar, 82, CH[bar] === 'A' ? 49 : 0));
  const LOW = [                                                                    // the tune's first two bars and its fifth at half speed, then bars 7 and 8, two octaves down
    [[0, 74, 8], [8, 77, 8]], [[0, 81, 12], [12, 79, 4]], [[0, 77, 12], [12, 74, 4]], [[0, 70, 8], [8, 74, 8]],
    [[0, 74, 4], [4, 77, 4], [8, 81, 8]], [[0, 86, 12], [12, 84, 4]], THEME[6], [[0, 73, 4], [4, 76, 4], [8, 81, 8]],
  ];
  bars(41, 48, (bar, i) => { for (const [st, p, len] of LOW[i]) put('bass', bar, st, p - 24, len, st === 0 ? 76 : 70); });

  /* ---- drums ---- */
  const hit = (bar, st, sound, vel) => put('drum', bar, st, sound, 1, vel);
  const shake = (bar, sound, vel, accent) => { for (let st = 0; st < 16; st += 2) hit(bar, st, sound, vel + (lean(bar).includes(st) || lean(bar).includes(st + 1) ? accent : 0)); };
  const beat = (bar, kick, snare) => { hit(bar, 0, 'kick', kick); hit(bar, 8, 'kick', kick - 6); if (snare) { hit(bar, 4, 'snare', snare); hit(bar, 12, 'snare', snare + 2); } };
  bars(1, 8, bar => { shake(bar, 'cabasa', 44, 8); hit(bar, 6, 'thud', 52); if (bar % 2 === 0) hit(bar, 13, 'lowpop', 44); if (bar % 4 === 1) hit(bar, 0, 'boom', 60); });   // the croak
  hit(8, 14, 'pop', 50);
  bars(9, 16, bar => { shake(bar, 'hat', 54, 10); beat(bar, 72, 60); if (bar % 2 === 0) hit(bar, 14, 'thud', 50); });
  bars(17, 24, bar => { shake(bar, 'hat', 56, 10); beat(bar, 76, 64); hit(bar, 6, bar % 2 ? 'pop' : 'thud', 46); if (bar % 2 === 0) hit(bar, 14, 'lowpop', 46); });
  hit(24, 13, 'snare', 54); hit(24, 15, 'snare', 62);
  bars(25, 32, bar => { shake(bar, 'cabasa', 42, 8); hit(bar, 8, 'thud', 54); if (bar % 4 === 1) hit(bar, 0, 'boom', 64); });
  for (const [st, sound, vel] of [[10, 'tom1', 58], [13, 'tom2', 64], [14, 'tom3', 74], [15, 'tom2', 68]]) hit(32, st, sound, vel);
  bars(33, 40, bar => { shake(bar, 'hat', 62, 12); beat(bar, 82, 0); hit(bar, 6, 'kick', 56); hit(bar, 4, 'slap', 70); hit(bar, 12, 'slap', 72); if (bar % 2 === 0) hit(bar, 14, 'lowpop', 48); });
  hit(40, 8, 'boom', 78);
  bars(41, 48, bar => { shake(bar, 'cabasa', 44, 8); hit(bar, 0, 'kick', 66); hit(bar, 6, 'thud', 50); if (bar % 2 === 0) hit(bar, 14, 'thud', 46); });

  /* ---- counter voice ---- */
  const half = (a, b) => [[0, a, 8], [8, b, 8]];
  const VINE = [[[0, 69, 12], [12, 65, 4]], [[0, 62, 8], [8, 65, 4]], [[0, 69, 4], [4, 67, 4], [8, 65, 8]], [[0, 64, 12], [12, 67, 4]],             // against the tune, falling where it rises,
    [[4, 65, 4], [8, 62, 8]], half(62, 65), [[0, 70, 4], [4, 67, 4], [8, 62, 8]], [[0, 64, 8], [8, 61, 6]]];                                         // with room to breathe
  const SINK = [65, 64, 64, 62, 62, 62, 61, 61].map(p => half(p, p));                                                                               // a tenth above the sinking bass
  const ROOTS = [half(69, 69), half(65, 62), half(62, 62), half(62, 65), half(65, 65), half(69, 69), half(70, 70), half(64, 61)];                   // over the bass's tune
  const lay = (first, table, vels) => table.forEach((ns, i) => { for (const [st, p, len] of ns) put('counter', first + i, st, p, len, vels(i)); });
  lay(17, VINE, i => 76 + i);
  lay(25, SINK, i => 84 - 2 * i);
  lay(33, VINE.map((ns, i) => i === 6 ? half(67, 63) : ns), i => 92 + i);          // bar 39: G and E flat
  lay(41, ROOTS, i => 74 - i);

  /* ---- plucked two-note chords off the beat, and single bells ---- */
  const PAIR = { Dm: [62, 65], Bb: [62, 65], F: [60, 65], C: [60, 64], Eb: [63, 67], A: [61, 64] };
  bars(33, 40, bar => { for (const st of [4, 12]) for (const p of PAIR[CH[bar]]) put('pluck', bar, st, p, 2, 72); });
  for (const [bar, st, p, vel] of [[2, 12, 93, 46], [6, 12, 89, 44],                          // dust
    [25, 0, 93, 60], [27, 0, 93, 58], [29, 0, 93, 56], [31, 0, 93, 54],                       // the same A while the floor sinks
    [33, 0, 98, 62], [35, 8, 96, 64], [37, 8, 98, 66], [40, 8, 93, 72], [44, 12, 93, 46]]) put('bell', bar, st, p, 4, vel);
  return notes;
}

// "What the Fire Leaves", floor 3 (The Kiln): 56 bars in E minor at 128, on the tune the floor has had from the
// first version, all eight bars of it. Seven sections of eight bars:
//    1-8   the works start: a kick on every beat, a bass that leans on the half step above E and on the tritone;
//          the tune is far off, in bells
//    9-16  the tune, close
//   17-24  the chase: the tune again, short runs scurrying up at the bar ends, a pluck every three steps against the four
//   25-32  the bowl: no kick, hollow fifths, the counter voice low and slow, bell drops that climb (B C D D#);
//          in its middle the chord a tritone away
//   33-40  the roller comes back: the tune's first three notes climb a step at a time, first every two bars,
//          then every bar, over a bass in even eighths
//   41-48  the tune with every voice, the lead doubled an octave below
//   49-56  curling up: every second bar the tune's first bar comes back with its intervals pulled in further,
//          until it turns on one half step
function kilnScore() {
  const notes = [], put = (voice, bar, st, pitch, len, vel) => notes.push([(bar - 1) * 16 + st, voice, pitch, len, vel]);
  const bars = (a, b, f) => { for (let bar = a; bar <= b; bar++) f(bar, bar - a); };
  // one chord a bar, bars counted from 1
  const TUNE = ['Em', 'C', 'G', 'B', 'Em', 'C', 'Am', 'B'];
  const CH = [0, 'Em', 'Em', 'F', 'F', 'Em', 'Em', 'Am', 'B', ...TUNE, ...TUNE, 'Em', 'Em', 'F', 'F', 'Bb', 'Bb', 'B', 'B',
    'Em', 'Em', 'F', 'F', 'G', 'Am', 'B', 'B', ...TUNE, 'Em', 'C', 'Em', 'C', 'Em', 'Em', 'Am', 'B'];

  /* ---- the tune, a bar at a time: [step in the bar, pitch, steps long] ---- */
  const THEME = [
    [[0, 76, 2], [2, 79, 2], [4, 83, 4], [8, 81, 2], [10, 79, 2], [12, 76, 4]],     // Em  E G B . A G E
    [[0, 79, 4], [4, 76, 2], [6, 72, 2], [8, 76, 6]],                              // C   G E C E, a breath
    [[0, 74, 2], [2, 79, 2], [4, 83, 4], [8, 86, 4], [12, 83, 4]],                 // G   D G B D' B
    [[0, 78, 4], [4, 75, 4], [8, 71, 4], [12, 75, 2]],                             // B   F# D# B D#, a breath
    [[0, 76, 2], [2, 79, 2], [4, 83, 4], [8, 88, 6], [14, 86, 2]],                 // Em  E G B E' . D'
    [[0, 84, 4], [4, 79, 4], [8, 76, 4], [12, 79, 2]],                             // C   C' G E G, a breath
    [[0, 81, 4], [4, 76, 4], [8, 72, 4], [12, 76, 4]],                             // Am  A E C E
    [[0, 78, 4], [4, 83, 4], [8, 87, 6]],                                          // B   F# B D#', a breath
  ];
  const sing = (voice, bar, ns, vel, up = 0) => { for (const [st, p, len] of ns) put(voice, bar, st, p + up, len, Math.min(118, vel + (st === 0 ? 5 : 0) + (p >= 84 ? 3 : 0))); };
  bars(9, 16, (bar, i) => sing('lead', bar, THEME[i], 84));
  bars(17, 24, (bar, i) => sing('lead', bar, THEME[i], 86));
  // the climb: three notes up the chord, the last one held; an echo an octave below in the same bar
  const RISE = { 33: [76, 79, 83], 35: [77, 81, 84], 37: [79, 83, 86], 38: [81, 84, 88], 39: [83, 87, 90] };
  for (const [bar, [a, b, c]] of Object.entries(RISE)) {
    const v = 78 + 2 * (bar - 33);
    sing('lead', +bar, [[0, a, 2], [2, b, 2], [4, c, 8]], v);
    sing('answer', +bar, [[8, a - 12, 2], [10, b - 12, 2], [12, c - 12, 4]], v - 14);
  }
  sing('lead', 40, [[0, 90, 4], [4, 87, 4], [8, 83, 8]], 92);                       // F#' D#' B over the roll
  const LAST = [[0, 78, 4], [4, 83, 4], [8, 87, 8]];                                // at the high point the tune's last note rings
  bars(41, 48, (bar, i) => { const ns = i === 7 ? LAST : THEME[i]; sing('lead', bar, ns, 94); sing('answer', bar, ns, 70, -12); });
  // the tune's first bar, its intervals pulled in further each time it comes back
  sing('lead', 49, THEME[0], 84);
  sing('lead', 51, [[0, 76, 2], [2, 79, 2], [4, 81, 4], [8, 79, 2], [10, 78, 2], [12, 76, 4]], 80);    // E G A . G F# E
  sing('lead', 53, [[0, 76, 2], [2, 78, 2], [4, 79, 4], [8, 78, 2], [10, 76, 6]], 76);               // E F# G . F# E
  sing('lead', 55, [[0, 76, 4], [4, 77, 4], [8, 76, 8]], 72);                                       // E F E
  sing('lead', 56, [[0, 75, 8], [8, 78, 8]], 70);                                                   // D# F#, and home

  /* ---- the answering voice in the chase: a run up the chord at the end of every second bar ---- */
  const RUN = { 18: [72, 76, 79, 84], 20: [71, 75, 78, 83], 22: [72, 76, 79, 84], 24: [71, 75, 78, 83] };
  for (const [bar, ps] of Object.entries(RUN)) ps.forEach((p, i) => put('answer', +bar, 12 + i, p, 1, 70 + 3 * i));

  /* ---- arpeggio: close voicings, the accent on every beat ---- */
  const VOICING = { Em: [64, 67, 71, 76, 79], C: [64, 67, 72, 76, 79], G: [62, 67, 71, 74, 79], B: [63, 66, 71, 75, 78], Am: [64, 69, 72, 76, 81], F: [65, 69, 72, 77, 81] };
  const HOLLOW = { Em: [64, 71, 76, 83], F: [65, 72, 77, 84], Bb: [65, 70, 77, 82], B: [63, 66, 71, 78] };       // fifths and octaves for the still part (B keeps its third)
  const arp16 = (bar, order, vel) => { for (let st = 0; st < 16; st++) put('arp', bar, st, VOICING[CH[bar]][order[st % order.length]], 1, vel + (st % 4 ? 0 : 12)); };
  const arp8 = (bar, ps, vel) => ps.forEach((p, i) => put('arp', bar, 2 * i, p, 2, vel + (i % 4 ? 0 : 8)));
  bars(1, 8, bar => arp16(bar, [0, 1, 2, 1, 3, 1, 2, 1], 54));
  bars(9, 16, bar => arp16(bar, [0, 1, 2, 1, 3, 1, 2, 1], 58));
  bars(17, 24, bar => arp16(bar, [0, 1, 2, 3, 2, 1, 2, 1], 60));
  bars(25, 32, bar => { const h = HOLLOW[CH[bar]]; arp8(bar, [h[0], h[1], h[2], h[1], h[3], h[1], h[2], h[1]], 48); });
  bars(33, 40, (bar, i) => arp16(bar, [0, 1, 2, 1, 3, 1, 2, 1], 54 + 2 * i));
  bars(41, 48, bar => arp16(bar, [0, 1, 2, 3, 4, 3, 2, 1], 66));
  bars(49, 56, bar => arp16(bar, [0, 1, 2, 1, 3, 1, 2, 1], 56));

  /* ---- bass ---- */
  const ROOT = { Em: 40, C: 48, G: 43, B: 47, Am: 45, F: 41 };
  // the floor's first bass rhythm, 3 + 3 + 2 twice: root, root, octave, root, root, then `last` (the fifth unless named)
  const riff = (bar, r, vel, last) => { for (const [st, p, len, v] of [[0, r, 3, vel + 6], [3, r, 3, vel - 6], [6, r + 12, 2, vel], [8, r, 3, vel + 2], [11, r, 3, vel - 6], [14, last || r + 7, 2, vel - 2]]) put('bass', bar, st, p, len, v); };
  // the works: E under everything, each bar ending on the half step above (F) or, under the F chord, on the tritone (B flat)
  bars(1, 6, bar => riff(bar, 40, 74, CH[bar] === 'F' ? 46 : 41));
  riff(7, 45, 76, 46); riff(8, 47, 78, 51);                                         // A A . Bb | B B . D#, and up to E
  bars(9, 16, bar => riff(bar, ROOT[CH[bar]], 78, CH[bar] === 'B' ? 51 : 0));
  bars(17, 24, bar => riff(bar, ROOT[CH[bar]], 80, CH[bar] === 'B' ? 51 : 0));
  [40, 40, 40, 40, 46, 46].forEach((p, i) => put('bass', 25 + i, 0, p, 16, 70));                                    // E (also under F), then B flat
  bars(31, 32, bar => { put('bass', bar, 0, 47, 8, 72); put('bass', bar, 8, 47, 8, 66); });                         // B
  bars(33, 40, (bar, i) => { const r = ROOT[CH[bar]]; for (let st = 0; st < 16; st += 2) put('bass', bar, st, st === 14 && bar < 40 ? r + 1 : r, 2, 68 + 2 * i + (st % 4 ? 0 : 8)); });   // even eighths, a half step up at the bar's end
  bars(41, 48, bar => riff(bar, ROOT[CH[bar]], 84, CH[bar] === 'B' ? 51 : 0));
  bars(49, 54, bar => riff(bar, ROOT[CH[bar]], 74, CH[bar] === 'C' ? 0 : 41));            // under E the bar ends on F again
  riff(55, 45, 74, 46); riff(56, 47, 76, 51);

  /* ---- drums ---- */
  const hit = (bar, st, sound, vel) => put('drum', bar, st, sound, 1, vel);
  const shake = (bar, sound, vel, accent) => { for (let st = 0; st < 16; st += 2) hit(bar, st, sound, vel + (st % 4 ? 0 : accent)); };
  const four = (bar, vel) => { for (const st of [0, 4, 8, 12]) hit(bar, st, 'kick', vel - (st ? 6 : 0)); };          // the roller: a kick on every beat
  const drive = (bar, kick, snare) => { for (const [st, v] of [[0, kick], [6, kick - 18], [8, kick - 6], [14, kick - 20]]) hit(bar, st, 'kick', v); hit(bar, 4, 'snare', snare); hit(bar, 12, 'snare', snare + 2); };   // the floor's first drum pattern
  bars(1, 8, bar => { four(bar, 72); shake(bar, 'hat', 52, 8); hit(bar, 6, 'claves', 54); hit(bar, 14, 'claves', 58); });
  bars(9, 16, bar => { drive(bar, 76, 64); shake(bar, 'hat', 56, 8); });
  for (const [st, sound, vel] of [[13, 'tom1', 62], [14, 'tom2', 68], [15, 'tom3', 74]]) hit(16, st, sound, vel);
  bars(17, 24, bar => { drive(bar, 78, 66); shake(bar, 'hat', 58, 8); hit(bar, 10, 'claves', 52); });
  for (const [st, sound, vel] of [[10, 'tom1', 60], [13, 'tom2', 66], [14, 'tom3', 76], [15, 'tom2', 70]]) hit(24, st, sound, vel);
  bars(25, 32, bar => { for (const st of [0, 4, 8, 12]) hit(bar, st, 'shaker', st ? 44 : 50); if (bar % 2) hit(bar, 0, 'thud', 56); if (bar % 4 === 1) hit(bar, 0, 'cymbal', 60); });
  bars(33, 36, (bar, i) => { four(bar, 68 + 2 * i); shake(bar, 'hat', 50 + 2 * i, 8); if (bar >= 35) { hit(bar, 4, 'snare', 58); hit(bar, 12, 'snare', 60); } });
  bars(37, 39, (bar, i) => { four(bar, 76 + 2 * i); for (let st = 0; st < 16; st++) hit(bar, st, 'hat', 50 + 2 * i + (st % 4 ? 0 : 10)); hit(bar, 4, 'snare', 64 + 2 * i); hit(bar, 12, 'snare', 66 + 2 * i); hit(bar, 14, 'kick', 60); });
  for (let st = 0; st < 8; st += 2) hit(40, st, 'kick', 78);                         // the roll: kicks in eighths, then snare and toms in sixteenths
  for (let st = 8; st < 12; st++) hit(40, st, 'snare', 56 + 5 * (st - 8));
  for (const [st, sound, vel] of [[12, 'tom1', 72], [13, 'tom2', 76], [14, 'tom3', 80], [15, 'tom3', 84]]) hit(40, st, sound, vel);
  bars(41, 48, bar => { four(bar, 84); hit(bar, 6, 'kick', 58); hit(bar, 14, 'kick', 56); shake(bar, 'hat', 64, 10); hit(bar, 4, 'clap', 72); hit(bar, 12, 'clap', 74); hit(bar, 10, 'claves', 56); });
  hit(48, 8, 'boom', 80);
  bars(49, 56, bar => { four(bar, 68); shake(bar, 'cabasa', 46, 8); hit(bar, 4, 'claves', 56); hit(bar, 12, 'claves', 58); });

  /* ---- counter voice ---- */
  const half = (a, b) => [[0, a, 8], [8, b, 8]];
  const UNDER = [[[0, 64, 12], [12, 59, 4]], half(60, 67), [[0, 59, 8], [8, 62, 4]], [[0, 63, 4], [4, 66, 4], [8, 59, 8]],            // long notes under the tune, moving against it
    [[0, 59, 12], [12, 64, 4]], half(64, 60), [[4, 60, 4], [8, 64, 8]], half(59, 66)];
  const BOWL = [half(64, 64), [[0, 64, 12], [12, 67, 4]], half(65, 65), [[0, 65, 12], [12, 69, 4]], half(65, 62), [[0, 58, 8], [8, 62, 4]], half(63, 66), half(59, 63)];    // E and F, a half step apart, then the tritone's chord
  const STEPS = [half(59, 59), half(59, 59), half(60, 60), half(60, 60), half(62, 62), half(64, 64), half(66, 66), half(66, 63)];   // B C D E F#, a step at a time
  const HOME = [half(52, 52), half(52, 55), half(52, 52), half(55, 52), half(52, 52), half(52, 52), half(57, 57), half(59, 63)];
  const lay = (first, table, vels) => table.forEach((ns, i) => { for (const [st, p, len] of ns) put('counter', first + i, st, p, len, vels(i)); });
  lay(17, UNDER, i => 78 + i);
  lay(25, BOWL, i => 80 + (i < 4 ? 2 * i : 14 - 2 * i));
  lay(33, STEPS, i => 76 + 3 * i);
  lay(41, UNDER, i => 94 + i);
  lay(49, HOME, i => 76 - i);

  /* ---- a pluck every three steps, against the four: it lands somewhere else in every bar ---- */
  const PAIR = { Em: [59, 64], C: [60, 64], G: [59, 62], B: [59, 63], Am: [60, 64] };
  const dice = (a, b, vel) => { for (let s = (a - 1) * 16, n = 0; s < b * 16; s += 3, n++) { const bar = (s >> 4) + 1; put('pluck', bar, s % 16, PAIR[CH[bar]][n % 2], s % 16 === 15 ? 1 : 2, vel + (n % 2 ? 0 : 6)); } };
  dice(17, 24, 64); dice(41, 48, 70);

  /* ---- bells: the tune far off, the drops, the peaks ---- */
  for (const [bar, i] of [[2, 0], [4, 1], [6, 4], [8, 7]]) for (const [st, p, len] of THEME[i]) put('bell', bar, st, p + 12, len, 50);     // an octave up, soft
  for (const [bar, st, p, vel] of [[25, 8, 95, 56], [27, 8, 96, 58], [29, 8, 98, 60], [30, 12, 94, 54], [31, 8, 99, 62],         // B C D . D#: the glass heats
    [41, 0, 100, 66], [43, 8, 98, 66], [45, 0, 100, 68], [48, 8, 99, 72], [52, 12, 95, 46], [54, 12, 88, 44]]) put('bell', bar, st, p, 4, vel);
  return notes;
}
