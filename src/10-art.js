/* ================================ 7 ART =============================== */
// Everything visible is built here at boot. Small things are ASCII grids (one char = one
// pixel, see PAL); big symmetric things are painted procedurally with the CG helper.
const DOORS = { closed: [], ajar: [], gate: [] };   // sealed-door / latched-gate sprites per wall direction (N E S W)
const GLOW = {};
// Hero looks: palette overrides for the hood (h/H/i) and ear-inner (p), plus optional ear rows per facing.
const HERO_LOOK = {
  pip:  { map: {} },
  wick: { map: { h: '#f39a3e', H: '#c0602a', i: '#ffc57a', p: '#fff8e8' }, ears: { D: ['.hh........hh.', '.hphh....hhph.'], R: ['..hh.....hh...', '..hphh..hhph..'], U: ['.hh........hh.', '.hhhh....hhhh.'] } },
  brin: { map: { h: '#9a6cd8', H: '#6a44a8', i: '#c8a4f0' }, ears: { D: ['.hh........hh.', 'hpph......hpph'], R: ['..hh.....hh...', '.hpph...hpph..'], U: ['.hh........hh.', 'hhhh......hhhh'] } },
  moss: { map: { h: '#6cc24a', H: '#3f8a3a', i: '#a6e86a' }, ears: { D: ['..ww......ww..', '.hwkh....hkwh.'], R: ['...ww....ww...', '..hwkh..hwkh..'], U: ['..hh......hh..', '.hhhh....hhhh.'] } },
};
function buildArt() {
  /* ---- hero: Pip, a cat-hooded key squire (14x16 + outline) ---- */
  // one body per facing; each hero is a palette + a pair of ear rows on top of it
  const hero = (dir, body, idle, a, b) => {
    for (const hid in HERO_LOOK) {
      const look = HERO_LOOK[hid], bd = body.slice(), o = { map: look.map };
      if (look.ears && look.ears[dir]) { bd[0] = look.ears[dir][0]; bd[1] = look.ears[dir][1]; }
      A(hid + dir + '0', bd.concat(idle), o); A(hid + dir + '1', bd.concat(a), o); A(hid + dir + '2', bd.concat(b), o);
    }
  };
  hero('D', [
    '..hh......hh..',
    '.hphh....hhph.',
    '.hhhhhhhhhhhh.',
    'hhhiihhhhhhhhh',
    'hhihhhhhhhhhhH',
    'hhsssssssssshH',
    'hHsssssssssshH',
    'hHssksssskssHH',
    'hHssksssskssHH',
    '.HspsssssspsH.',
    '..HssssssssH..',
    '..swwwyywwws..',
    '..swwwwwwwws..',
    '...wwWWWWww...',
  ], ['...dd....dd...', '...dd....dd...'], ['...dd....dd...', '...dd.........'], ['...dd....dd...', '.........dd...']);
  hero('R', [
    '...hh....hh...',
    '..hphh..hhph..',
    '..hhhhhhhhhhh.',
    '.hhhhhhhhhhhhh',
    '.hhhhhhhihhhhH',
    '.hhhhhsssssshH',
    '.hHhhsssssssH.',
    '.hHhhssskssss.',
    '.hHhhsssksssp.',
    '..HHhssssssH..',
    '...HHhssssH...',
    '..yywwwwws....',
    '.yyYwwwwwws...',
    '..y.wWWWww....',
  ], ['....dd.dd.....', '....dd.dd.....'], ['...dd...dd....', '...dd....dd...'], ['....dddd......', '....dddd......']);
  hero('U', [
    '..hh......hh..',
    '.hhhh....hhhh.',
    '.hhhhhhhhhhhh.',
    'hhhihhhhhhhhhh',
    'hhihhhhhhhhhhH',
    'hhhhhhhhhhhhhH',
    'hHhhhhhhhhhhHH',
    'hHhhhhhhhhhhHH',
    'hHHhhhhhhhhHHH',
    '.HHHHhhhhHHHH.',
    '..HHyyyyHHHH..',
    '..swyYYywwws..',
    '..swwyywwwws..',
    '...wwYyWWww...',
  ], ['...dd....dd...', '...dd....dd...'], ['...dd....dd...', '...dd.........'], ['...dd....dd...', '.........dd...']);

  /* ---- monsters ---- */
  const slimeA = [
    '....nnnn....',
    '..nnllllnn..',
    '.nllwlllnnn.',
    '.nlwllnnnnn.',
    'nnllnnnnnnnn',
    'nnnknnnnknnN',
    'nnnknnnnknnN',
    'nnnnnnnnnnNN',
    '.nnnnnnnnNN.',
    '..NNNNNNNN..'];
  const slimeB = [
    '............',
    '....nnnn....',
    '.nnnllllnnn.',
    'nnllwllnnnnn',
    'nnlwlnnnnnnn',
    'nnnknnnnknnN',
    'nnnknnnnknnN',
    'nnnnnnnnnnNN',
    'nnnnnnnnnNNN',
    '.NNNNNNNNNN.'];
  A('slime0', slimeA); A('slime1', slimeB);
  const blue = { n: PAL.b, l: PAL.c, N: PAL.B };
  A('bslime0', slimeA, { map: blue }); A('bslime1', slimeB, { map: blue });
  reg('kslime0', scaleCanvas(SPR.slime0.c, 2)); reg('kslime1', scaleCanvas(SPR.slime1.c, 2));
  A('crown', [
    'y...yy...y',
    'yy.yyyy.yy',
    'yyyyyyyyyy',
    'yryybbyyry',
    'YYYYYYYYYY']);
  A('bat0', [
    'P............P',
    'PP...P..P...PP',
    'PPP..PPPP..PPP',
    'PvPPPPPPPPPPvP',
    '.PPPwkPPkwPPP.',
    '.vPPPPPPPPPPv.',
    '..vvPwPPwPvv..',
    '....vPPPPv....',
    '.....v..v.....',
    '..............']);
  A('bat1', [
    '..............',
    '.....P..P.....',
    '.....PPPP.....',
    '..PPPPPPPPPP..',
    '.PPPwkPPkwPPP.',
    'PPPPPPPPPPPPPP',
    'PPvvPwPPwPvvPP',
    'PP..vPPPPv..PP',
    'P....v..v....P',
    '..............']);
  const bonesTop = [
    '...wwwwww...',
    '..wwwwwwww..',
    '.wwwwwwwwww.',
    '.wkkwwwwkkw.',
    '.wkkwwwwkkw.',
    '.wwwwkkwwwW.',
    '..wWwWwWwW..',
    '...WWWWWW...',
    '....wWWw....'];
  A('bones0', bonesTop.concat(['.w.wWwwWw.w.', '.w..wWWw..w.', '....wWWw....', '...ww..ww...', '...Ww..wW...']));
  A('bones1', bonesTop.concat(['w..wWwwWw..w', 'w...wWWw...w', '....wWWw....', '..ww....ww..', '..W......W..']));
  const sporeA = [
    '....rrrr....',
    '..rrwrrrrr..',
    '.rrwwrrrwrr.',
    'rrrrrrrwwrrR',
    'rwrrrrrrrrrR',
    'rrrrrwrrrrRR',
    '.RRRRRRRRRR.',
    '...tttttt...',
    '..ttkttktt..',
    '..ttkttktt..',
    '..tttppttt..',
    '...tttttt...',
    '...dd..dd...'];
  A('spore0', sporeA);
  A('spore1', ['............'].concat(sporeA.slice(0, 7), sporeA.slice(8)));
  const ghostTop = [
    '....wwww....',
    '..wwwwwwww..',
    '.wwwwwwwwwc.',
    '.wwwwwwwwwc.',
    'wwkkwwwkkwwc',
    'wwkkwwwkkwwc',
    'wwwwwwwwwwwc',
    'wwpwwkkwwpwc',
    'wwwwwkkwwwcc',
    'wwwwwwwwwwcc',
    'wwwwwwwwwccc',
    'wwwwwwwwwccc'];
  A('ghost0', ghostTop.concat(['wcw.wccw.wcc', 'c....cc...c.']), { ol: 'B' });
  A('ghost1', ghostTop.concat(['.wcw.wcw.wcc', '..c...c...c.']), { ol: 'B' });
  const tinTop = [
    '......rr......',
    '.....rrrr.....',
    '....gggggg....',
    '...gWWWWWWg...',
    '...gWwWWWWg...',
    '...gkkkkkkg...',
    '...gWWkkWWg...',
    '...GggggggG...',
    '..GgWWWWWWgG..',
    '.bbbWWWWWWgGw.',
    '.bybgWWWWggGw.',
    '.bbbggggggG.w.',
    '..b.GggggGGTT.'];
  A('tin0', tinTop.concat(['....gg..gg....', '....GG..GG....']));
  A('tin1', tinTop.concat(['....gg..gg....', '....GG........']));
  const chestClosed = [
    '..dddddddddddd..',
    '.dTTTTTTTTTTTTd.',
    'dTtTTTTTTTTTTtTd',
    'dTTTTTTTTTTTTTTd',
    'dYYYYYYyyYYYYYYd',
    'dTTTTTTykTTTTTTd',
    'dTtTTTTyyTTTTtTd',
    'dTTTTTTTTTTTTTTd',
    'dTTTTTTTTTTTTTTd',
    '.dddddddddddddd.'];
  A('chest0', chestClosed); A('mimic0', chestClosed);
  A('chest1', [
    '..dddddddddddd..',
    '.dTTTTTTTTTTTTd.',
    'dTtTTTTTTTTTTtTd',
    'dddddddddddddddd',
    'dkyykyyykyyykykd',
    'dyyyyyyyyyyyyyyd',
    'dYYYYYYyyYYYYYYd',
    'dTTTTTTTTTTTTTTd',
    'dTtTTTTTTTTTTtTd',
    'dTTTTTTTTTTTTTTd',
    '.dddddddddddddd.']);
  A('mimic1', [
    '..dddddddddddd..',
    '.dTTTTTTTTTTTTd.',
    'dTtTTTTTTTTTTtTd',
    'dYYYYYYYYYYYYYYd',
    'dwkwkwkwkwkwkwkd',
    'dkkykkkkkkkkykkd',
    'dkkkkkppppkkkkkd',
    'dkwkwkppppkwkwkd',
    'dYYYYYYppYYYYYYd',
    'dTTTTTTppTTTTTTd',
    'dTtTTTTTTTTTTtTd',
    'dTTTTTTTTTTTTTTd',
    '.dddddddddddddd.']);

  /* ---- boss: Gatejaw, the hungry door (procedural, 40x44) ---- */
  const mkBoss = (open, stepL) => {
    const g = new CG(40, 44), ly = stepL ? 38 : 39, ry = stepL ? 39 : 38;
    g.rect(7, ly, 9, 5, 'd').rect(7, ly, 9, 1, 'T').rect(24, ry, 9, 5, 'd').rect(24, ry, 9, 1, 'T');
    g.ell(19.5, 13, 17.5, 12, 'T').rect(2, 13, 36, 26, 'T');
    for (let y = 1; y < 39; y++) for (let x = 0; x < 40; x++) {
      if (g.get(x, y) !== 'T') continue;
      if (x % 6 === 1) g.set(x, y, 'd'); else if (x % 6 === 2) g.set(x, y, 't'); else if (x >= 35) g.set(x, y, 'd');
    }
    for (const by of [8, 36]) for (let x = 0; x < 40; x++) if (g.get(x, by) !== '.') { g.set(x, by, x % 6 === 4 ? 'W' : 'G'); g.set(x, by + 1, 'G'); }
    for (const [ex, s] of [[12, 1], [27, -1]]) { g.ell(ex, 19, 5, 4.4, 'w'); g.rect(ex - 1 + s, 18, 3, 4, 'k'); g.set(ex + s, 18, 'w'); }
    g.line(6, 11, 16, 15, 'k').line(6, 12, 16, 16, 'k').line(33, 11, 23, 15, 'k').line(33, 12, 23, 16, 'k');
    g.rect(18, 20, 4, 6, 'Y').rect(19, 21, 2, 4, 'k').rect(18, 20, 4, 1, 'y');
    if (open) {
      g.rect(6, 26, 28, 10, 'R').rect(6, 26, 28, 1, 'k').rect(13, 31, 14, 5, 'p').rect(13, 31, 14, 1, 'm');
      for (let i = 0; i < 7; i++) { const x = 7 + i * 4; g.rect(x, 27, 3, 2, 'w').set(x + 1, 29, 'w').rect(x, 34, 3, 2, 'w').set(x + 1, 33, 'w'); }
    } else {
      g.rect(6, 28, 28, 6, 'k');
      for (let i = 0; i < 7; i++) { const x = 7 + i * 4; g.rect(x, 28, 2, 3, 'w').rect(x + 2, 31, 2, 3, 'w'); }
    }
    return g.canvas('k');
  };
  reg('boss0', mkBoss(false, false)); reg('boss1', mkBoss(false, true)); reg('boss2', mkBoss(true, false)); reg('boss3', mkBoss(true, true));

  /* ---- pickups & projectiles ---- */
  const glint = ['..y..', '.ywy.', 'ywwyY', '.yyY.', '..Y..'];
  A('glint0', glint, { ol: 'O', ay: 5 });
  A('glint1', glint, { ol: 'B', map: { y: PAL.c, Y: PAL.b }, ay: 5 });
  A('glint2', glint, { ol: 'R', map: { y: PAL.p, Y: PAL.m }, ay: 5 });
  A('heart', [
    '.rr...rr.',
    'rwrr.rrrr',
    'rwrrrrrrr',
    'rrrrrrrrr',
    '.rrrrrrR.',
    '..rrrrR..',
    '...rrR...',
    '....R....']);
  A('heart_half', [
    '.rr...KK.',
    'rwrr.KKKK',
    'rwrrrKKKK',
    'rrrrrKKKK',
    '.rrrrKKK.',
    '..rrrKK..',
    '...rrK...',
    '....r....']);
  A('heart_empty', [
    '.KK...KK.',
    'KKKK.KKKK',
    'KKKKKKKKK',
    'KKKKKKKKK',
    '.KKKKKKK.',
    '..KKKKK..',
    '...KKK...',
    '....K....']);
  A('key', [
    '.yyy.........',
    'y...yyyyyyyyy',
    'y...y....Y.Y.',
    '.yyy.....y.y.'], { ay: 4 });
  A('key_dim', [
    '.KKK.........',
    'K...KKKKKKKKK',
    'K...K....K.K.',
    '.KKK.....K.K.'], { ay: 4 });
  A('s_spark', ['..w..', '.wcw.', 'wcccw', '.wcw.', '..w..'], { ol: 'b', ay: 3 });
  A('s_guard', ['.cc.', 'cwwc', 'cwwc', '.cc.'], { ol: 'B', ay: 3 });
  // an enemy bullet: a bright core in a near-black rim, so it stands off from light ground and from dark (#11)
  A('s_ebullet', ['.rr.', 'rppr', 'rpwr', '.rr.'], { ol: 'k', ay: 3 });
  { const g = new CG(8, 8); g.disc(3.5, 3.5, 3.6, 'p'); g.set(2, 2, 'w').set(3, 2, 'w').set(2, 3, 'w'); g.set(5, 5, 'm').set(6, 4, 'm').set(4, 6, 'm').set(5, 6, 'm'); reg('s_orb', g.canvas('v'), 4, 5); }
  { const g = new CG(8, 8); g.disc(3.5, 3.5, 3.6, 'y'); g.disc(5.2, 2.6, 2.6, '.'); g.set(1, 3, 'w').set(1, 4, 'w'); reg('s_moon', g.canvas('O'), 4, 5); }
  A('s_bomb', [
    '.....o..',
    '....T...',
    '..kkkk..',
    '.kGkkkk.',
    '.kkkkkk.',
    '.kkkkkk.',
    '..kkkk..'], { ol: 'K', ay: 5 });
  A('s_thorn', [
    '..N..n...N..',
    '.NnN.nN.NnN.',
    'NnlnNnnNnlnN',
    '.NnNnllnNnN.',
    '..NnNnnNnN..',
    '...N.NN.N...'], { ol: 'k', ay: 4 });
  A('s_wave', ['.ww.', 'wyyw', 'wyyw', 'wyyw', 'wyyw', '.ww.'], { ol: 'Y', ay: 4 });

  /* ---- props ---- */
  { const g = new CG(14, 26);                                           // pillar
    g.rect(0, 0, 14, 4, 'W').rect(0, 0, 14, 1, 'w').rect(0, 3, 14, 1, 'g');
    g.rect(2, 4, 10, 18, 'W').rect(2, 4, 2, 18, 'w').rect(9, 4, 3, 18, 'g').rect(5, 4, 1, 18, 'g').rect(7, 4, 1, 18, 'g');
    g.rect(0, 22, 14, 4, 'W').rect(0, 22, 14, 1, 'w').rect(0, 25, 14, 1, 'G').rect(11, 22, 3, 4, 'g');
    reg('pillar', g.canvas('k')); }
  A('statue', [
    '...gg....gg...',
    '..gWWg..gWWg..',
    '..gWWWggWWWg..',
    '.gWWWWWWWWWWg.',
    '.gWccWWWWccWg.',
    '.gWccWWWWccWg.',
    '.gWWWWyyWWWWg.',
    '..gWWWyyWWWg..',
    '..gWWWWWWWWg..',
    '.gGWWWWWWWWGg.',
    '.gGGWWgWWWGGg.',
    '.gGGWWWWgWGGg.',
    '.gGGWgWWWWGGg.',
    '..gGGWWWWGGg..',
    '...gggggggg...',
    '..GGGGGGGGGG..',
    '.gWWWWWWWWWWg.',
    '.gWWWWWWWWWGg.',
    '.gGGGGGGGGGGg.']);
  A('pedestal', [
    '..WWWWWWWWWW..',
    '.WwwwwwwwwwwW.',
    '.WWWWWWWWWWWW.',
    '..gggggggggg..',
    '...gWWWWWWg...',
    '...gWWWWWWg...',
    '..GggggggggG..',
    '.GGGGGGGGGGGG.']);
  A('brazier', [
    'GGGGGGGGGGGG',
    'GoOoOoOoOoOG',
    '.GggggggggG.',
    '..GGggggGG..',
    '....GggG....',
    '....GggG....',
    '...GGggGG...',
    '..GGGGGGGG..']);
  const flameA = [
    '...o....',
    '...oo...',
    '..ooo...',
    '..oyoo..',
    '.ooyyo..',
    '.oyyyoo.',
    'ooywyyo.',
    'oyywwyoo',
    'oyywwyyo',
    '.oyyyyo.'];
  A('flame0', flameA, { ol: 'R' }); reg('flame1', SPR.flame0.f);
  A('flame2', [
    '....o...',
    '..o.o...',
    '..ooo...',
    '.ooyoo..',
    '.oyyyo..',
    'ooyyyoo.',
    'oyywyyo.',
    'oyywwyoo',
    'oyywwyyo',
    '.oyyyyo.'], { ol: 'R' });
  A('sflame0', ['.o..', '.oo.', 'oyo.', 'oyyo', 'oywo', '.yy.'], { ol: 'R' });
  A('sflame1', ['..o.', '.oo.', '.oyo', 'oyyo', 'owyo', '.yy.'], { ol: 'R' });
  A('sconce', ['GGGGGG', '.GggG.', '..GG..', '..GG..']);
  A('logs', [
    '.d..........d.',
    'dTd...dd...dTd',
    '.dTd.dTTd.dTd.',
    '..dTdTTTTdTd..',
    '..GdTTTTTTdG..',
    '.GWGddddddGWG.',
    '..GG.GWWG.GG..']);
  A('pot', [
    '..tttttt..',
    '.tTTTTTTt.',
    '..TttttT..',
    '.TttttttT.',
    'TtwtttttTd',
    'TtwtttttTd',
    'TttttttTTd',
    'TttttttTTd',
    '.TTTTTTTd.',
    '..dddddd..']);
  A('crystal', [
    '......c.....',
    '.....cwc....',
    '.....cwc....',
    '....cwwcb...',
    '..c.cwwcb...',
    '.cwccwwcb.c.',
    '.cwccwccbcwc',
    'cwwccwccbcwc',
    'cwwcbwccbcwb',
    'cwcbbwccbwcb',
    'cwcbbcccbccb',
    '.cbbbcbbbcb.',
    '.bbbbbbbbbb.',
    '..BBBBBBBB..'], { ol: 'B' });
  A('shroom', [
    '....rrr.......',
    '...rwrrr...rr.',
    '..rrrrwrr.rwrr',
    '...ttttt..rrrr',
    '....ttt....tt.',
    '.rr.ttt....tt.',
    'rwrr.t..n..n..',
    '.tt..n.nnn.n.n',
    'nnnnnnnnnnnnnn']);
  A('bonepile', ['w........w', 'ww.wwww.ww', '.wwwWWwww.', 'ww.wwww.ww', 'w........w'], { ol: 'K' });
  { const g = new CG(16, 24);                                           // bookshelf with random spines
    g.rect(0, 0, 16, 24, 'd').rect(1, 1, 14, 22, 'T').rect(0, 0, 16, 1, 't');
    const cols = 'rbnyPowc'; let s = 7;
    for (let row = 0; row < 3; row++) {
      const y0 = 2 + row * 7; g.rect(1, y0, 14, 6, 'k');
      for (let x = 1; x < 15; x++) { s = (s * 31 + 17) % 97; const hgt = 4 + (s % 3 === 0 ? 0 : 1), c = cols[(s >> 1) % cols.length]; if (s % 11 === 0) continue; g.rect(x, y0 + 6 - hgt, 1, hgt, c); if (s % 5 === 0) g.set(x, y0 + 7 - hgt, 'w'); }
      g.rect(1, y0 + 6, 14, 1, 't');
    }
    reg('shelf', g.canvas('k')); }
  const mkFountain = (frame, full) => {                                 // 46x38 basin with spout
    const g = new CG(46, 38), wc = full ? 'b' : 'B';
    g.ell(22.5, 26, 22, 11, 'G'); g.ell(22.5, 23, 22, 11, 'W'); g.ell(22.5, 22, 22, 10.5, 'w'); g.ell(22.5, 23, 20, 9.5, 'W');
    g.ell(22.5, 23.5, 18, 8, wc);
    if (full) for (let i = 0; i < 9; i++) { const a = i * 0.7 + frame * 0.35, x = 22.5 + Math.cos(a * 2.3) * (6 + (i * 5) % 11), y = 23.5 + Math.sin(a * 1.7) * (2 + i % 5); g.set(x, y, 'c').set(x + 1, y, 'c'); if (i % 3 === 0) g.set(x, y - 1, 'w'); }
    g.rect(19, 8, 8, 16, 'W').rect(19, 8, 2, 16, 'w').rect(25, 8, 2, 16, 'g').ell(22.5, 24, 5, 2, 'g');
    g.ell(22.5, 8, 9, 3.5, 'g').ell(22.5, 7, 9, 3, 'W').ell(22.5, 6.5, 7, 2, full ? 'c' : 'B');
    if (full) { g.set(22 + (frame ? 1 : 0), 3, 'c').set(22, 4, 'w').set(23, 4, 'c').set(21 - frame, 5, 'c').set(24 + frame, 5, 'c'); g.set(13 + frame, 12 + frame, 'c').set(32 - frame, 13 - frame, 'c'); }
    return g.canvas('k');
  };
  reg('fountain0', mkFountain(0, true), 23, 33); reg('fountain1', mkFountain(1, true), 23, 33); reg('fountain_dry', mkFountain(0, false), 23, 33);
  { const mk = (lvl) => { const g = new CG(16, 16); for (const [x, y] of [[4, 5], [11, 5], [4, 12], [11, 12]]) { if (lvl === 1) g.rect(x, y - 2, 1, 2, 'W'); else { g.rect(x - 1, y - 1, 3, 2, 'g').rect(x, y - 5, 1, 5, 'W').set(x, y - 6, 'w').set(x - 1, y - 2, 'W').set(x + 1, y - 2, 'G').set(x + 1, y - 3, 'g'); } } return g.canvas(lvl === 2 ? 'k' : null); };
    reg('spike1', mk(1), 0, 0); reg('spike2', mk(2), 1, 1); }

  /* ---- icons (12x12 + outline = 14x14) ---- */
  const I = (name, rows, o) => A('i_' + name, rows, Object.assign({ ol: 'k', ax: 7, ay: 7 }, o));
  I('keyblade', [
    '........yyy.',
    '.......y..Yy',
    '.......y..Yy',
    '.......yyYy.',
    '......yyY...',
    '.....yyY....',
    '....yyY.....',
    '...yyY......',
    '..yyYy......',
    '.yyY.yy.....',
    '.yY..y......',
    '............']);
  I('spark', [
    '.....w......',
    '.....w......',
    '....wcw.....',
    '....wcw.....',
    'wwwwcccwwww.',
    '.wcccccccw..',
    '..wcccccw...',
    '...wcccw....',
    '..wccwccw...',
    '..wcw.wcw...',
    '.ww.....ww..',
    '............'], { ol: 'B' });
  I('ricochet', [
    '....pppp....',
    '..ppppppmm..',
    '.ppwwpppppm.',
    '.pwwppppppm.',
    'ppwpppppppmm',
    'ppppppppppmm',
    'ppppppppppmm',
    'pppppppppmmm',
    '.pppppppmmm.',
    '.mpppppmmmm.',
    '..mmmmmmmm..',
    '....mmmm....'], { ol: 'v' });
  I('halo', [
    '....GGGG....',
    '...G....G...',
    '...GGGGGG...',
    '..GyyyyyyG..',
    '..GywwyyYG..',
    '..GywwyyYG..',
    '..GyyyyyYG..',
    '..GyyyyYYG..',
    '..GyyYYYYG..',
    '...GGGGGG...',
    '..GGGGGGGG..',
    '............']);
  I('moons', [
    '....yyyy....',
    '..yyyyy.....',
    '.yywyy......',
    '.ywyy.......',
    'yyyyy.......',
    'yyyyy.......',
    'yyyyy.......',
    'yyyyyy......',
    '.yyyyyy...Y.',
    '.yyyyyyyYYY.',
    '..yyyyyYYY..',
    '....YYYY....'], { ol: 'O' });
  I('bomb', [
    '........o...',
    '.......y.o..',
    '......T.....',
    '....KTKK....',
    '..KKKKKKKK..',
    '.KKGGKKKKKK.',
    '.KGwGKKKKKK.',
    'KKGGKKKKKKKK',
    'KKKKKKKKKKKK',
    '.KKKKKKKKKK.',
    '.KKKKKKKKKK.',
    '...KKKKKK...']);
  I('bell', [
    '.....YY.....',
    '....yyyy....',
    '...yyyyyy...',
    '...ywyyyY...',
    '..yywyyyYY..',
    '..ywyyyyYY..',
    '..ywyyyyYY..',
    '.yyyyyyyyYY.',
    'yyyyyyyyyYYY',
    'YYYYYYYYYYYY',
    '.....YY.....',
    '............'], { ol: 'd' });
  I('thorns', [
    '...N....n...',
    '..NnN..nln..',
    '.Nnln.NnnN..',
    '..NnNNnlnN.n',
    '...NnnnnNNnl',
    '.n.NnllnnNnN',
    'nlnNnlnnN.N.',
    '.nNNnnnNN...',
    '..NnNNnnN...',
    '.NnlN.NnlN..',
    '..nN...NnN..',
    '............']);
  I('heart', [
    '..rr....rr..',
    '.rrrr..rrrr.',
    'rrwrrrrrrrrr',
    'rwwrrrrrrrrR',
    'rwrrrrrrrrrR',
    'rrrrrrrrrrRR',
    '.rrrrrrrrRR.',
    '..rrrrrrRR..',
    '...rrrrRR...',
    '....rrRR....',
    '.....RR.....',
    '............']);
  I('boots', [
    '............',
    '..TTTT......',
    '..TttT......',
    '..TttT...c..',
    '..TttT..c...',
    '..TttTT...c.',
    '..TtttTTT...',
    '..TtttttTTT.',
    '..TttttttttT',
    '..TTTTTTTTTT',
    '..dddddddddd',
    '............']);
  I('magnet', [
    '............',
    '.www....www.',
    '.www....www.',
    '.rrr....rrr.',
    '.rrr....rrr.',
    '.rrr....rrr.',
    '.rrrr..rrrr.',
    '..rrrrrrrr..',
    '...RRRRRR...',
    '............',
    '............',
    '............']);
  I('might', [
    '..........ww',
    '.........wWw',
    '........wWw.',
    '.......wWw..',
    '......wWw...',
    '.....wWw....',
    '.T..wWw.....',
    '.TTwWw......',
    '..TTw.......',
    '.dTTT.......',
    'dd..TT......',
    'd...........']);
  I('haste', [
    '.TTTTTTTTTT.',
    '..wwwwwwww..',
    '..wyyyyyyw..',
    '...wyyyyw...',
    '....wyyw....',
    '.....ww.....',
    '.....ww.....',
    '....w..w....',
    '...w.yy.w...',
    '..wyyyyyyw..',
    '..wwwwwwww..',
    '.TTTTTTTTTT.']);
  I('reach', [
    '...cccccc...',
    '..c......c..',
    '.c..cccc..c.',
    'c..c....c..c',
    'c.c..ww..c.c',
    'c.c.wwww.c.c',
    'c.c.wwww.c.c',
    'c.c..ww..c.c',
    'c..c....c..c',
    '.c..cccc..c.',
    '..c......c..',
    '...cccccc...'], { ol: 'B' });
  I('twin', [
    '............',
    '..yy........',
    '.yyyy.......',
    'yywyyy......',
    'yyyyyy..pp..',
    '.yyyy..pppp.',
    '..yy..ppwppp',
    '......pppppp',
    '.......pppp.',
    '........pp..',
    '............',
    '............']);
  I('pouch', [
    '....TTTT....',
    '...T.dd.T...',
    '....TddT....',
    '...TTTTTT...',
    '..TttttttT..',
    '.TttyyytttT.',
    '.TtyywyyttT.',
    '.TttyyytttT.',
    '.TtttttttTT.',
    '.TttttttTTT.',
    '..TTTTTTTT..',
    '............']);
  I('seal', [
    '..GGGGGGG...',
    '.GWWWWWWWG..',
    '.GWwWWWWWG..',
    '.GGGGGGGGG..',
    '....TT......',
    '....Tt......',
    '....TT...y..',
    '....Tt..yyy.',
    '....TT...y..',
    '....Tt......',
    '....dd......',
    '............']);
  I('feast', [
    '............',
    '....rrrr....',
    '..rrRRRRrr..',
    '.rRRrrrrRRr.',
    '.rRrrwwrrRr.',
    '.rRrrrrrrRr.',
    '..rRRRRRRr..',
    '...rrrrrr...',
    '....tt......',
    '...tt.......',
    '..ww........',
    '..ww........']);
  I('cache', [
    '............',
    '..c.....p...',
    '.cwc...pwp..',
    'cwccb.pwppm.',
    '.ccb...ppm..',
    '..b..y..m...',
    '....ywy.....',
    '...ywwyY....',
    '....yyY.....',
    '.....Y......',
    '............',
    '............']);
  // room feature icons
  I('fountain', [
    '.....cc.....',
    '.....cc.....',
    '....cccc....',
    '....cbbc....',
    '...cbbbbc...',
    '...cbbbbc...',
    '..cbwbbbbc..',
    '..cbwbbbbc..',
    '..cbbbbbbc..',
    '..cbbbbbbc..',
    '...cbbbbc...',
    '....cccc....'], { ol: 'B' });
  I('spikes', [
    '............',
    '..w...w...w.',
    '..w...w...w.',
    '.wWw.wWw.wWw',
    '.wWw.wWw.wWw',
    '.wWg.wWg.wWg',
    'wWWgwWWgwWWg',
    'wWWgwWWgwWWg',
    'GGGGGGGGGGGG',
    'GGGGGGGGGGGG',
    '............',
    '............']);
  I('guardian', [
    '............',
    '....cccc....',
    '..ccwwwwcc..',
    '.cwwwbbwwwc.',
    'cwwwbkkbwwwc',
    'cwwwbkkbwwwc',
    '.cwwwbbwwwc.',
    '..ccwwwwcc..',
    '....cccc....',
    '............',
    '............',
    '............'], { ol: 'B' });
  I('ember', [
    '.....o......',
    '.....oo.....',
    '....ooo.....',
    '...oooo..o..',
    '...oyyoo.o..',
    '..ooyyyooo..',
    '..oyyyyyoo..',
    '.ooyywyyyo..',
    '.oyywwwyyo..',
    '.oyywwwyyo..',
    '..oyyyyyo...',
    '...ooooo....'], { ol: 'R' });
  I('frost', [
    '.....c......',
    '...c.c.c....',
    '....ccc.....',
    '.c...c...c..',
    '..c..c..c...',
    'cccccwccccc.',
    '..c..c..c...',
    '.c...c...c..',
    '....ccc.....',
    '...c.c.c....',
    '.....c......',
    '............'], { ol: 'B' });
  I('library', [
    '............',
    '.rrrrrrrrr..',
    '.rRRRRRRRrw.',
    '.rRyyyyyRrw.',
    '.rRRRRRRRrw.',
    '.rRRRRRRRrw.',
    '.rRyyyyyRrw.',
    '.rRRRRRRRrw.',
    '.rRRRRRRRrw.',
    '.rrrrrrrrrw.',
    '..wwwwwwwww.',
    '............']);
  I('vault', [
    '............',
    '.dddddddddd.',
    'dTTTTTTTTTTd',
    'dTtTTTTTTtTd',
    'dYYYYyyYYYYd',
    'dTTTTykTTTTd',
    'dTtTTyyTTtTd',
    'dTTTTTTTTTTd',
    '.dddddddddd.',
    '............',
    '............',
    '............']);
  I('garden', [
    '....pp......',
    '...pppp.pp..',
    '.pp.pp.pppp.',
    'pppppyyppp..',
    'pppyyyyyp...',
    '.ppyyyyppp..',
    '..ppyypppp..',
    '.pppp.npp...',
    '.ppp..n.....',
    '....nnn.....',
    '...nn.n.....',
    '.....n......']);
  I('den', [
    '...wwwwww...',
    '..wwwwwwww..',
    '.wwwwwwwwww.',
    '.wkkwwwwkkw.',
    '.wkkwwwwkkw.',
    '.wwwwkkwwww.',
    '..wwwwwwww..',
    '..wkwkwkww..',
    '...wwwwww...',
    '............',
    '............',
    '............']);
  I('hall', [
    '...GGGGGG...',
    '..GWWWWWWG..',
    '.GWWGGGGWWG.',
    '.GWG....GWG.',
    '.GWG....GWG.',
    '.GWG....GWG.',
    '.GWG....GWG.',
    '.GWG....GWG.',
    '.GWG....GWG.',
    '.GWG....GWG.',
    'GGGG....GGGG',
    '............']);
  I('nook', [
    '......wwww..',
    '.........w..',
    '........w...',
    '.......w....',
    '......wwww..',
    '............',
    '.wwww.......',
    '....w.......',
    '...w........',
    '..w.........',
    '.wwww.......',
    '............'], { ol: 'B' });
  reg('i_hearth', SPR.i_ember.c, 7, 7);
  A('door_icon', [
    '.TTTTT.',
    'TtTTTtT',
    'TtTTTtT',
    'TtTyTtT',
    'TtTTTtT',
    'TtTTTtT'], { ol: 'k' });

  buildArtMore(); buildIconsMore();

  /* ---- soft sprites: shadows & glows ---- */
  for (const [name, rx, ry] of [['sh_s', 5, 2], ['sh_m', 7, 3], ['sh_l', 11, 4], ['sh_xl', 19, 6]]) {
    const c = mkCanvas(rx * 2 + 1, ry * 2 + 1), g = c.getContext('2d'); g.fillStyle = 'rgba(16,10,30,0.38)';
    for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) if ((x * x) / (rx * rx + 1) + (y * y) / (ry * ry + 1) <= 1) g.fillRect(x + rx, y + ry, 1, 1);
    reg(name, c, rx, ry);
  }
  for (const [name, col, r] of [['warm', '255,170,80', 40], ['cool', '120,220,255', 40], ['dark', '150,90,255', 36], ['gold', '255,220,110', 28], ['green', '130,255,150', 36], ['red', '255,80,90', 36]]) {
    const c = mkCanvas(r * 2, r * 2), g = c.getContext('2d'), gr = g.createRadialGradient(r, r, 0, r, r, r);
    gr.addColorStop(0, 'rgba(' + col + ',0.55)'); gr.addColorStop(0.5, 'rgba(' + col + ',0.18)'); gr.addColorStop(1, 'rgba(' + col + ',0)');
    g.fillStyle = gr; g.fillRect(0, 0, r * 2, r * 2); GLOW[name] = c;
  }

  /* ---- sealed doors: 64x32 facing south, then rotated for the other walls ---- */
  const mkDoor = (ajar) => {
    const g = new CG(64, 32);
    g.rect(0, 0, 64, 8, 'G').rect(0, 0, 64, 1, 'k').rect(1, 1, 62, 1, 'g').rect(0, 7, 64, 1, 'K');
    g.rect(27, 1, 10, 6, 'Y').rect(28, 1, 8, 1, 'y').rect(31, 3, 2, 2, 'k');
    for (const x0 of [0, 56]) g.rect(x0, 8, 8, 24, 'g').rect(x0, 8, 8, 2, 'W').rect(x0 + 1, 10, 2, 20, 'W').rect(x0 + 6, 10, 2, 20, 'G').rect(x0, 30, 8, 2, 'G').rect(x0 === 0 ? 7 : 56, 8, 1, 24, 'K');
    g.rect(8, 8, 48, 24, 'k');
    const leaf = (x0, w) => {
      for (let x = x0; x < x0 + w; x++) for (let y = 9; y < 32; y++) g.set(x, y, (x - x0) % 6 === 5 ? 'd' : (y === 9 ? 't' : 'T'));
      for (const by of [12, 27]) for (let x = x0; x < x0 + w; x++) { g.set(x, by, (x - x0) % 6 === 2 ? 'W' : 'G'); g.set(x, by + 1, 'G'); }
    };
    if (!ajar) {
      leaf(9, 22); leaf(33, 22); g.rect(31, 9, 2, 23, 'k');
      g.rect(17, 16, 30, 4, 'k');                                     // peephole slit (eyes are drawn live)
      g.rect(29, 21, 6, 6, 'Y').rect(29, 21, 6, 1, 'y').rect(31, 22, 2, 2, 'k').rect(31, 24, 2, 2, 'k');
      g.rect(25, 23, 2, 2, 'Y').rect(37, 23, 2, 2, 'Y');
    } else {
      leaf(9, 14); leaf(41, 14); g.rect(23, 9, 1, 23, 'v').rect(40, 9, 1, 23, 'v');
    }
    return g.canvas(null);
  };
  const dc = mkDoor(false), da = mkDoor(true);
  for (let d = 0; d < 4; d++) { DOORS.closed.push(rotCanvas(dc, d)); DOORS.ajar.push(rotCanvas(da, d)); }
}
