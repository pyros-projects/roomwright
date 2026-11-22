/* =============================== 5 AUDIO ============================== */
const Snd = (() => {
  let ac = null, master, sfxBus, musBus, noiseBuf;
  const vol = { music: 0.6, sfx: 0.8 };
  const last = {};
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  function ensure() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return true; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    try { ac = new AC(); } catch (e) { return false; }
    master = ac.createGain(); master.gain.value = 0.8;
    const comp = ac.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 5;
    master.connect(comp); comp.connect(ac.destination);
    sfxBus = ac.createGain(); sfxBus.connect(master);
    musBus = ac.createGain(); musBus.connect(master);
    // a little feedback echo on the music bus for that 16-bit cartridge reverb
    const dl = ac.createDelay(0.6); dl.delayTime.value = 0.27;
    const fb = ac.createGain(); fb.gain.value = 0.3;
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1700;
    const wet = ac.createGain(); wet.gain.value = 0.32;
    musBus.connect(dl); dl.connect(lp); lp.connect(fb); fb.connect(dl); lp.connect(wet); wet.connect(master);
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    applyVol(); return true;
  }
  function applyVol() { if (!ac) return; sfxBus.gain.value = vol.sfx * 0.9; musBus.gain.value = vol.music * 0.5; }
  // A gain node passes everything until its first scheduled value. A source that starts on the very sample of that
  // value could slip one sample through at full level (a tick in a hat, on steps that land on a whole sample), so
  // the gain is shut before the envelope is written.
  function env(g, t0, d, v, a) { g.gain.value = 0; g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(v, t0 + a); g.gain.exponentialRampToValueAtTime(0.0001, t0 + Math.max(d, a + 0.01)); }
  function tone(f, d, o = {}) {
    const t0 = (o.at !== undefined ? o.at : ac.currentTime) + (o.t || 0), osc = ac.createOscillator(), g = ac.createGain();
    osc.type = o.type || 'square'; osc.frequency.setValueAtTime(f, t0);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.f2), t0 + d);
    if (o.vib) { const l = ac.createOscillator(), lg = ac.createGain(); l.frequency.value = 5.5; lg.gain.value = f * 0.006; l.connect(lg); lg.connect(osc.frequency); l.start(t0); l.stop(t0 + d + 0.05); }
    env(g, t0, d, o.v === undefined ? 0.15 : o.v, o.a || 0.004);
    osc.connect(g); g.connect(o.bus || sfxBus); osc.start(t0); osc.stop(t0 + d + 0.05);
  }
  function noise(d, o = {}) {
    const t0 = (o.at !== undefined ? o.at : ac.currentTime) + (o.t || 0), src = ac.createBufferSource(), flt = ac.createBiquadFilter(), g = ac.createGain();
    src.buffer = noiseBuf; src.loop = true; flt.type = o.ft || 'lowpass'; flt.frequency.setValueAtTime(o.f || 2000, t0);
    if (o.f2) flt.frequency.exponentialRampToValueAtTime(o.f2, t0 + d);
    env(g, t0, d, o.v === undefined ? 0.2 : o.v, o.a || 0.003);
    src.connect(flt); flt.connect(g); g.connect(o.bus || sfxBus); src.start(t0, Math.random() * 0.5); src.stop(t0 + d + 0.05);
  }
  const GAP = { hit: 0.05, kill: 0.045, glint: 0.035, shoot: 0.07, bounce: 0.06, zap: 0.09, boom: 0.07, knock: 0.14, spike: 0.25, swing: 0.08, burn: 0.3, tick: 0.05, ebullet: 0.12,
    freeze: 0.09, dig: 0.3, fuse: 0.25, sting: 0.12, saw: 0.3, shield: 0.2, hex: 0.5, cards: 0.2, wheel: 0.1, slot: 0.3 };
  const FX = {
    hit() { noise(0.05, { v: 0.1, f: 1700, ft: 'bandpass' }); tone(180, 0.05, { v: 0.05, f2: 100 }); },
    kill() { tone(500 + fxr() * 180, 0.09, { v: 0.06, f2: 900 + fxr() * 200, type: 'triangle' }); noise(0.05, { v: 0.05, f: 3200, ft: 'highpass' }); },
    glint(n) { tone(880 * Math.pow(1.0595, Math.min(n || 0, 14)), 0.07, { v: 0.05, type: 'triangle' }); },
    key() { [72, 76, 79, 84].forEach((m, i) => tone(mtof(m), 0.14, { v: 0.1, t: i * 0.07 })); tone(mtof(88), 0.35, { v: 0.09, t: 0.28, type: 'triangle' }); },
    swing() { noise(0.09, { v: 0.07, f: 900, f2: 3500, ft: 'bandpass' }); },
    shoot() { tone(900, 0.07, { v: 0.035, f2: 500, type: 'triangle' }); },
    bounce() { tone(660 + fxr() * 200, 0.04, { v: 0.035, type: 'triangle' }); },
    zap() { tone(1400, 0.12, { v: 0.05, f2: 180, type: 'sawtooth' }); noise(0.08, { v: 0.05, f: 4000, ft: 'highpass' }); },
    boom() { tone(120, 0.28, { v: 0.2, f2: 40, type: 'sine' }); noise(0.25, { v: 0.16, f: 900, f2: 200 }); },
    hurt() { tone(330, 0.22, { v: 0.14, f2: 110, type: 'sawtooth' }); noise(0.12, { v: 0.12, f: 1200 }); },
    dash() { noise(0.14, { v: 0.09, f: 500, f2: 4000, ft: 'bandpass' }); },
    heal() { [76, 79, 84, 88].forEach((m, i) => tone(mtof(m), 0.18, { v: 0.08, t: i * 0.06, type: 'sine' })); },
    knock() { tone(95, 0.09, { v: 0.16, f2: 55, type: 'sine' }); tone(95, 0.09, { v: 0.14, f2: 55, type: 'sine', t: 0.13 }); noise(0.05, { v: 0.06, f: 500 }); },
    nokey() { tone(140, 0.1, { v: 0.09 }); tone(105, 0.14, { v: 0.09, t: 0.1 }); },
    draft() { noise(0.3, { v: 0.07, f: 300, f2: 5000, ft: 'bandpass' }); [67, 72, 76].forEach((m, i) => tone(mtof(m), 0.2, { v: 0.07, t: 0.05 + i * 0.05, type: 'triangle' })); },
    tick() { tone(700, 0.035, { v: 0.05, type: 'triangle' }); },
    ok() { tone(660, 0.06, { v: 0.07 }); tone(990, 0.1, { v: 0.07, t: 0.06 }); },
    back() { tone(500, 0.06, { v: 0.06 }); tone(330, 0.1, { v: 0.06, t: 0.06 }); },
    build() { tone(70, 0.5, { v: 0.16, f2: 45, type: 'sine' }); noise(0.5, { v: 0.1, f: 400, f2: 1500 }); [60, 64, 67, 72, 76].forEach((m, i) => tone(mtof(m), 0.12, { v: 0.06, t: 0.1 + i * 0.07, type: 'triangle' })); },
    boon() { [67, 72, 76, 79].forEach((m, i) => tone(mtof(m), 0.16, { v: 0.1, t: i * 0.09 })); tone(mtof(84), 0.5, { v: 0.11, t: 0.36 }); tone(mtof(76), 0.5, { v: 0.07, t: 0.36, type: 'triangle' }); },
    chest() { [84, 88, 91, 96, 91, 96].forEach((m, i) => tone(mtof(m), 0.09, { v: 0.06, t: i * 0.05, type: 'triangle' })); },
    spike() { noise(0.1, { v: 0.05, f: 5000, ft: 'highpass' }); tone(1800, 0.06, { v: 0.025, f2: 2600, type: 'triangle' }); },
    burn() { noise(0.2, { v: 0.035, f: 1200, f2: 400 }); },
    ebullet() { tone(300, 0.12, { v: 0.05, f2: 180, type: 'square' }); },
    breach() { for (let i = 0; i < 4; i++) tone(i % 2 ? 392 : 311, 0.16, { v: 0.1, t: i * 0.17, type: 'sawtooth' }); },
    roar() { tone(110, 1.1, { v: 0.22, f2: 38, type: 'sawtooth' }); noise(1.0, { v: 0.14, f: 300, f2: 90 }); },
    bosshit() { tone(90, 0.1, { v: 0.1, f2: 60, type: 'square' }); },
    win() { [72, 76, 79, 84, 79, 84, 88].forEach((m, i) => tone(mtof(m), 0.2, { v: 0.11, t: i * 0.13 })); tone(mtof(91), 0.9, { v: 0.11, t: 0.95, vib: 1 }); tone(mtof(84), 0.9, { v: 0.08, t: 0.95, type: 'triangle' }); },
    lose() { [76, 72, 69, 65, 64].forEach((m, i) => tone(mtof(m), 0.3, { v: 0.1, t: i * 0.22, type: 'triangle' })); tone(mtof(45), 1.0, { v: 0.12, t: 1.1, type: 'sine' }); },
    evolve() { [60, 64, 67, 72, 76, 79, 84].forEach((m, i) => tone(mtof(m), 0.22, { v: 0.1, t: i * 0.07 })); tone(mtof(88), 0.9, { v: 0.11, t: 0.55, vib: 1 }); tone(mtof(76), 0.9, { v: 0.08, t: 0.55, type: 'triangle' }); noise(0.5, { v: 0.06, f: 800, f2: 6000, ft: 'bandpass', t: 0.1 }); },
    star() { [79, 84, 88, 91].forEach((m, i) => tone(mtof(m), 0.14, { v: 0.09, t: i * 0.06, type: 'triangle' })); },
    unlock() { [72, 79, 84, 79, 84, 91].forEach((m, i) => tone(mtof(m), 0.12, { v: 0.08, t: i * 0.08 })); },
    jam() { tone(220, 0.07, { v: 0.12 }); tone(165, 0.12, { v: 0.12, t: 0.07 }); noise(0.15, { v: 0.1, f: 3000, ft: 'highpass', t: 0.05 }); },
    unjam() { noise(0.2, { v: 0.1, f: 2500, f2: 600 }); tone(330, 0.1, { v: 0.08, f2: 520, type: 'triangle' }); },
    dig() { noise(0.25, { v: 0.09, f: 300, f2: 700 }); tone(70, 0.2, { v: 0.1, type: 'sine' }); },
    crack() { noise(0.45, { v: 0.16, f: 500, f2: 120 }); tone(90, 0.4, { v: 0.16, f2: 40, type: 'sine' }); },
    stairs() { [67, 64, 60, 57, 52, 48].forEach((m, i) => tone(mtof(m), 0.16, { v: 0.09, t: i * 0.11, type: 'triangle' })); },
    hex() { tone(300, 0.3, { v: 0.07, f2: 150, type: 'sawtooth' }); tone(450, 0.3, { v: 0.05, f2: 225, type: 'sawtooth', t: 0.05 }); },
    shield() { tone(660, 0.12, { v: 0.07, type: 'sine' }); tone(990, 0.2, { v: 0.07, type: 'sine', t: 0.08 }); },
    bell() { tone(523, 0.9, { v: 0.12, type: 'sine' }); tone(1046, 0.6, { v: 0.05, type: 'sine' }); tone(784, 0.7, { v: 0.04, type: 'triangle' }); },
    freeze() { tone(1800, 0.15, { v: 0.04, f2: 2600, type: 'triangle' }); noise(0.1, { v: 0.04, f: 6000, ft: 'highpass' }); },
    fuse() { noise(0.3, { v: 0.05, f: 4000, ft: 'highpass' }); },
    sting() { tone(1200, 0.04, { v: 0.03, f2: 1600, type: 'triangle' }); },
    saw() { tone(140, 0.2, { v: 0.03, f2: 180, type: 'sawtooth' }); },
    splash() { noise(0.28, { v: 0.09, f: 700, f2: 2600, ft: 'bandpass' }); tone(220, 0.2, { v: 0.05, f2: 110, type: 'sine' }); },
    coin() { tone(1568, 0.05, { v: 0.05, type: 'triangle' }); tone(2093, 0.09, { v: 0.05, type: 'triangle', t: 0.04 }); },
    squish() { noise(0.14, { v: 0.07, f: 500, f2: 250 }); tone(160, 0.1, { v: 0.05, f2: 90, type: 'sine' }); },
    windup() { for (let i = 0; i < 4; i++) tone(500 + i * 90, 0.04, { v: 0.04, t: i * 0.05, type: 'square' }); },
    dice() { for (let i = 0; i < 3; i++) tone(900 + fxr() * 500, 0.03, { v: 0.04, t: i * 0.04, type: 'triangle' }); },
    // the house (#12): a riffle of cards, the ball clicking over the wheel's frets, a machine's reels and its bell
    cards() { for (let i = 0; i < 5; i++) noise(0.03, { v: 0.09, f: 3400, ft: 'highpass', t: i * 0.035 }); },
    wheel() { tone(1250 + fxr() * 250, 0.025, { v: 0.05, type: 'square' }); noise(0.02, { v: 0.04, f: 4200, ft: 'highpass' }); },
    slot() { for (let i = 0; i < 6; i++) tone(520 + (i % 3) * 140, 0.035, { v: 0.045, t: i * 0.075, type: 'square' }); tone(1760, 0.2, { v: 0.06, t: 0.5, type: 'triangle' }); },
    warp() { tone(200, 0.3, { v: 0.08, f2: 1200, type: 'sine' }); tone(300, 0.3, { v: 0.05, f2: 1800, type: 'triangle', t: 0.03 }); },
    revive() { [60, 67, 72, 76, 79, 84].forEach((m, i) => tone(mtof(m), 0.25, { v: 0.1, t: i * 0.09, type: 'sine' })); },
  };
  function play(name, a) {
    if (!ac || ac.state !== 'running' || vol.sfx <= 0) return;
    const now = ac.currentTime, gap = GAP[name] || 0;
    if (gap && last[name] !== undefined && now - last[name] < gap) return;
    last[name] = now; FX[name](a);
  }

  // ---- music: a step sequencer. A track is a pattern (three voices: bass / harp arpeggio / flute lead, and noise
  // drums) or a written score (below), whose voices can follow the floor plan (further below)
  const MIN = [0, 3, 7], MAJ = [0, 4, 7];
  const TRACKS = {
    title: { bpm: 80, chords: [[45, MIN], [41, MAJ], [48, MAJ], [43, MAJ]], arp: [0, -1, 1, -1, 2, -1, 3, -1, 2, -1, 1, -1, 2, -1, 1, -1], bass: { 0: 0, 8: 7 }, drums: 0, leadVol: 0.07,
      lead: [[[0, 76, 8], [8, 81, 8]], [[0, 77, 8], [8, 72, 8]], [[0, 79, 8], [8, 76, 8]], [[0, 74, 14]]] },
    cellar: { bpm: 112, bars: 48, score: cellarScore },       // the three floors are written out: src/25-music.js
    garden: { bpm: 100, bars: 48, score: gardenScore },
    kiln: { bpm: 128, bars: 56, score: kilnScore },
    boss: { bpm: 148, chords: [[45, MIN], [45, MIN], [41, MAJ], [40, MAJ]], arp: [0, 2, 1, 2, 0, 2, 1, 2, 0, 2, 1, 2, 3, 2, 1, 2], bass: { 0: 0, 2: 0, 4: 12, 6: 0, 8: 0, 10: 0, 12: 12, 14: 7 }, drums: 2, leadVol: 0.08,
      lead: [
        [[0, 81, 2], [2, 84, 2], [4, 81, 2], [6, 88, 2], [8, 86, 2], [10, 84, 2], [12, 83, 2], [14, 84, 2]],
        [[0, 81, 2], [2, 84, 2], [4, 81, 2], [6, 88, 2], [8, 89, 4], [12, 88, 4]],
        [[0, 84, 2], [2, 81, 2], [4, 77, 2], [6, 81, 2], [8, 84, 2], [10, 86, 2], [12, 84, 2], [14, 81, 2]],
        [[0, 83, 4], [4, 80, 4], [8, 83, 2], [10, 86, 2], [12, 88, 4]]] },
  };
  // ---- a written score: seven voices and a drum kit. Bass, arpeggio, lead, kick, snare and hat sound as the
  // patterns' do; the others are built from the same waves. A note's loudness is a velocity: the level goes with
  // its square, around the velocity named here.
  const VOICES = {   // voice: [level, at this velocity, wave, attack, seconds from (steps long, seconds per step), vibrato on long notes]
    bass: [0.2, 78, 'triangle', 0.01, (len, spb) => spb * (len <= 6 ? 2.4 : len * 0.95)],     // short notes are the pattern's pluck, long ones ring for their length
    arp: [0.03, 66, 'square', 0, (len, spb) => spb * len * 1.6],
    lead: [0.085, 86, 'triangle', 0.02, (len, spb) => spb * len * 0.98, 1],
    answer: [0.048, 80, 'square', 0.02, (len, spb) => spb * len * 0.98, 1],
    counter: [0.06, 90, 'triangle', 0.03, (len, spb) => spb * len * 0.98, 1],
    pluck: [0.022, 74, 'square', 0, (len, spb) => spb * 1.6],
    bell: [0.04, 62, 'triangle', 0, (len, spb) => spb * 6],
  };
  const DRUMS = {    // sound: [level, at this velocity, seconds, then a falling sine (from Hz, to Hz) or noise (filter, Hz)]
    kick: [0.26, 76, 0.13, 140, 42], boom: [0.26, 76, 0.22, 140, 42], thud: [0.08, 46, 0.08, 200, 120],
    tom1: [0.14, 70, 0.09, 260, 150], tom2: [0.14, 70, 0.09, 330, 190], tom3: [0.14, 70, 0.09, 420, 240], pop: [0.1, 50, 0.07, 520, 300], lowpop: [0.1, 50, 0.07, 390, 220],
    snare: [0.07, 66, 0.1, 'bandpass', 1900], slap: [0.07, 72, 0.1, 'bandpass', 1900], clap: [0.07, 72, 0.12, 'bandpass', 2400], claves: [0.06, 60, 0.04, 'bandpass', 2600],
    hat: [0.022, 58, 0.03, 'highpass', 7000], cabasa: [0.022, 54, 0.03, 'highpass', 7000], shaker: [0.022, 50, 0.05, 'highpass', 5000], cymbal: [0.03, 60, 0.3, 'highpass', 8000],
  };
  // ---- element voices (#17): one figure per element, written once and played over any piece's chords. A figure gets
  // the bar's root, third and fifth as pitch classes, the bar's number and the bass's pitch class, and gives its notes
  // for that bar as [step, pitch, steps long, velocity]. Each has a register and steps of its own, so that several can
  // sound together. near(pc, lo) is the pitch of that class at or above lo.
  const near = (pc, lo) => lo + ((pc - lo) % 12 + 12) % 12;
  const ELEMENT_VOICES = {   // element: [level, wave, attack, seconds per step of length, vibrato on long notes, figure, where its second layer lies]
    stone:  [0.07, 'triangle', 0.01, 0.95, 0, (r, t, f, bar, b) => [[0, near(b, 48), 6, 80], [8, near(f, 48), 6, 72]], 12],               // footing: low, on one and three
    shadow: [0.05, 'triangle', 0.03, 0.98, 1, (r, t, f) => [[4, near(t, 52), 4, 80], [12, near(t, 52), 4, 74]], 12],                     // the third, low, on two and four
    water:  [0.035, 'triangle', 0.01, 1.4, 0, (r, t, f) => { const a = near(r, 60), b = near(t, a), c = near(f, b); return [[0, a, 1, 80], [1, b, 1, 74], [2, c, 2, 78], [8, a, 1, 74], [9, b, 1, 70], [10, c, 2, 76]]; }, 12],   // a ripple up the chord from its root, twice a bar
    steel:  [0.02, 'square', 0, 1.2, 0, (r, t, f) => [2, 6, 10, 14].map((st, i) => [st, near(f, 64), 1, i % 2 ? 72 : 80]), 12],         // ticks off the beat
    lore:   [0.035, 'triangle', 0.03, 0.98, 1, (r, t, f) => [[0, near(t, 67), 8, 80], [8, near(r, 67), 8, 74]], -12],                    // two long notes a bar
    wild:   [0.022, 'square', 0, 1.3, 0, (r, t, f, bar) => [3, 6, 11, 14].map((st, i) => [st, near(i % 2 ? r : f, 67 + 5 * ((i + bar) % 2)), 1, 80]), -12],   // hops between the beats
    fire:   [0.02, 'square', 0, 0.9, 0, (r, t, f) => [[2, near(f, 76), 1, 80], [3, near(r, 79), 1, 70], [10, near(f, 76), 1, 78], [11, near(t, 79), 1, 68]], -12],   // a flicker, high
    frost:  [0.03, 'triangle', 0, 1.5, 0, (r, t, f, bar) => bar % 2 ? [[4, near(t, 84), 4, 80]] : [[4, near(t, 84), 4, 80], [12, near(f, 88), 4, 70]], -12],   // single high notes that ring
  };
  // an element's voice has a second layer, the same notes an octave away and softer, for when its rooms resonate: "fire+"
  const ELEMENT_OF = {}; for (const el in ELEMENT_VOICES) { ELEMENT_OF[el] = { el, full: 0 }; ELEMENT_OF[el + '+'] = { el, full: 1 }; }
  const PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }, pcOf = s => (PC[s[0]] + (s[1] === 'b' ? 11 : s[1] === '#' ? 1 : 0)) % 12;
  // ---- which voices sound (#17). FULL: the piece as written. PLAN: bass, arpeggio and drums always, the other voices
  // once the floor plan has earned them. ELEMENT: the whole piece, and the voice of every element in the plan. The
  // music player sets the voices by hand instead.
  const GROWS = { lead: 1, answer: 1, counter: 2, pluck: 2, bell: 3 };      // the plan's step at which a voice enters (musicPlan in 60-game)
  const mix = { mode: 'full', step: 0, els: {}, res: {}, hand: null };
  function sounds(voice) {
    if (mix.hand) return !!mix.hand[voice];
    const E = ELEMENT_OF[voice];
    if (E) return mix.mode === 'element' && !!mix.els[E.el] && (!E.full || !!mix.res[E.el]);
    return mix.mode !== 'plan' || (GROWS[voice] || 0) <= mix.step;
  }
  // when each voice last started a note, for whoever wants to move in time with it (the music player's dancers)
  const hits = {}, heard = (voice, t) => { const h = hits[voice] || (hits[voice] = []); h.push(t); if (h.length > 8) h.shift(); };
  function note(n, t, spb) {                                // n: [step, voice, pitch or drum sound, steps long, velocity]
    const [, voice, p, len, vel] = n, E = ELEMENT_OF[voice];
    if (E) { const [lv, type, a, k, vib] = ELEMENT_VOICES[E.el]; tone(mtof(p), spb * len * k, { at: t, v: lv * (E.full ? 0.6 : 1) * (vel / 80) ** 2, type, bus: musBus, a, vib: vib && len >= 4 }); return; }
    if (voice === 'drum') {
      const [lv, ref, d, a, b] = DRUMS[p], v = lv * (vel / ref) ** 2;
      if (typeof a === 'number') tone(a, d, { at: t, v, f2: b, type: 'sine', bus: musBus }); else noise(d, { at: t, v, f: b, ft: a, bus: musBus });
      return;
    }
    const [lv, ref, type, a, dur, vib] = VOICES[voice];
    tone(mtof(p), dur(len, spb), { at: t, v: lv * (vel / ref) ** 2, type, bus: musBus, a, vib: vib && len >= 4 });
  }
  let cur = null, curName = null, step = 0, nextT = 0;
  function sched(tr, s, t, spb) {
    if (tr.score) { for (const n of tr.steps[s % tr.steps.length]) if (sounds(n[1])) { note(n, t, spb); heard(n[1], t); } return; }
    const len = tr.chords.length, bar = Math.floor(s / 16) % len, st = s % 16, ch = tr.chords[bar];
    const by = v => !mix.hand || !!mix.hand[v];            // a pattern takes no part in the plan: only the music player switches its voices
    const b = tr.bass[st]; if (b !== undefined && by('bass')) { heard('bass', t); tone(mtof(ch[0] + b), spb * 2.4, { at: t, v: 0.2, type: 'triangle', bus: musBus, a: 0.01 }); }
    const ai = tr.arp[st]; if (ai >= 0 && by('arp')) { heard('arp', t); tone(mtof(ch[0] + 24 + (ai === 3 ? 12 : ch[1][ai])), spb * 1.6, { at: t, v: 0.03, type: 'square', bus: musBus }); }
    if (tr.lead && by('lead')) for (const n of tr.lead[bar]) if (n[0] === st) { heard('lead', t); tone(mtof(n[1]), spb * n[2] * 0.98, { at: t, v: tr.leadVol, type: 'triangle', bus: musBus, a: 0.02, vib: n[2] >= 4 }); }
    if (tr.drums && by('drum')) {
      if (st % 8 === 0 || (tr.drums > 1 && st % 8 === 6)) { heard('drum', t); tone(140, 0.13, { at: t, v: 0.26, f2: 42, type: 'sine', bus: musBus }); }
      if (st % 8 === 4) { heard('drum', t); noise(0.1, { at: t, v: 0.07, f: 1900, ft: 'bandpass', bus: musBus }); }
      if (st % 2 === 0) noise(0.03, { at: t, v: 0.022, f: 7000, ft: 'highpass', bus: musBus });
    }
  }
  setInterval(() => {
    if (!ac || !cur || ac.state !== 'running' || vol.music <= 0) return;
    const spb = 60 / cur.bpm / 4;
    if (nextT < ac.currentTime) nextT = ac.currentTime + 0.05;
    while (nextT < ac.currentTime + 0.25) { sched(cur, step, nextT, spb); step++; nextT += spb; }
  }, 50);
  function laid(tr) {                                       // a written score is laid out by step the first time it is asked for
    if (tr.score && !tr.steps) {
      const sc = tr.score(), steps = Array.from({ length: 16 * tr.bars }, () => []);
      for (const n of sc.notes) steps[n[0]].push(n);
      sc.chords.forEach((ch, bar) => {                      // the element voices, over the same chords
        // Am is minor, F/E has E in the bass, E5 has no third (its voices take the root there)
        const [name, bass] = ch.split('/'), r = pcOf(name), t = name.endsWith('5') ? r : (r + (/^[A-G][b#]?m(?!aj)/.test(name) ? 3 : 4)) % 12, f = (r + 7) % 12;
        for (const el in ELEMENT_VOICES) for (const [st, p, len, vel] of ELEMENT_VOICES[el][5](r, t, f, bar, bass ? pcOf(bass) : r))
          steps[bar * 16 + st].push([bar * 16 + st, el, p, len, vel], [bar * 16 + st, el + '+', p + ELEMENT_VOICES[el][6], len, vel]);
      });
      tr.steps = steps; tr.title = sc.name; tr.parts = sc.parts;
    }
    return tr;
  }
  function music(name) {
    if (curName === name) return; curName = name; cur = name ? laid(TRACKS[name]) : null; step = 0; nextT = 0;
    for (const v in hits) delete hits[v];
  }
  // test hooks (tools/check-audio.js, tools/check-music.py): the peak level on the master bus, what there is to play,
  // and how many seconds one pass of a track takes (or, with `bars`, that many of its bars)
  let tap = null;
  function probe() {
    if (!ac) return null;
    if (!tap) { tap = ac.createAnalyser(); tap.fftSize = 2048; master.connect(tap); }
    const buf = new Float32Array(tap.fftSize);
    return () => { tap.getFloatTimeDomainData(buf); let p = 0; for (let i = 0; i < buf.length; i++) p = Math.max(p, Math.abs(buf[i])); return p; };
  }
  // what a track is, for the music player and the checks: its piece's name, length, parts and the voices it has
  function info(name) {
    const tr = laid(TRACKS[name]), voices = [];
    if (tr.score) { for (const st of tr.steps) for (const n of st) if (!ELEMENT_OF[n[1]] && !voices.includes(n[1])) voices.push(n[1]); }
    else voices.push('bass', 'arp', ...(tr.lead ? ['lead'] : []), ...(tr.drums ? ['drum'] : []));
    return { title: tr.title || '', written: !!tr.score, bars: tr.bars || tr.chords.length, bpm: tr.bpm, parts: tr.parts || [], voices, elements: tr.score ? Object.keys(ELEMENT_VOICES) : [] };
  }
  return { ensure, play, music, info, vol, applyVol, probe,
    // #17: how the music follows the plan ('full', 'plan' or 'element'), what the plan is now ({ step, els, res }), and the voices set by hand (an object of voice names, or null)
    grow(mode) { mix.mode = mode === 'plan' || mode === 'element' ? mode : 'full'; }, plan(p) { mix.step = p.step | 0; mix.els = p.els || {}; mix.res = p.res || {}; }, hand(set) { mix.hand = set || null; }, sounds,
    // where the piece is ({ step, steps }, null when nothing plays), and the seconds since a voice last sounded
    pos() { if (!ac || !cur) return null; const at = step - Math.max(0, nextT - ac.currentTime) / (60 / cur.bpm / 4); return { step: Math.max(0, Math.floor(at)), steps: cur.steps ? cur.steps.length : 16 * cur.chords.length }; },
    since(voice) { const h = hits[voice]; let best = Infinity; if (ac && h) for (const t of h) if (t <= ac.currentTime) best = Math.min(best, ac.currentTime - t); return best; }, get names() { return Object.keys(FX); }, get tracks() { return Object.keys(TRACKS); }, get track() { return curName; }, secs(name, bars) { const tr = TRACKS[name]; return (bars || tr.bars || tr.chords.length) * 240 / tr.bpm; }, get on() { return !!ac && ac.state === 'running'; }, suspend() { if (ac && ac.state === 'running') ac.suspend(); }, resume() { if (ac && ac.state === 'suspended') ac.resume(); } };
})();
// How the game plays an effect. While sfx.quiet is set it plays none: the title's showcase builds nine rooms in one
// instant, and their sounds on top of each other were deafening when a run was left for the title.
const sfx = (n, a) => { if (!sfx.quiet) Snd.play(n, a); };
