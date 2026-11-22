/* ============================ 7b ART: v0.2 ============================ */
// Monsters, bosses, props and projectiles added with floors 2-3 and the larger room set.

// copy a sprite with some palette colours swapped (cheap variants of existing art)
function recolor(c, pairs) {
  const o = mkCanvas(c.width, c.height), g = o.getContext('2d'); g.drawImage(c, 0, 0);
  const im = g.getImageData(0, 0, c.width, c.height), d = im.data, map = pairs.map(([a, b]) => [hex2rgb(a), hex2rgb(b)]);
  for (let i = 0; i < d.length; i += 4) {
    if (!d[i + 3]) continue;
    for (const [a, b] of map) if (d[i] === a[0] && d[i + 1] === a[1] && d[i + 2] === a[2]) { d[i] = b[0]; d[i + 1] = b[1]; d[i + 2] = b[2]; break; }
  }
  g.putImageData(im, 0, 0); return o;
}
function buildArtMore() {
  const two = (name, rowsA, rowsB, o) => { A(name + '0', rowsA, o); A(name + '1', rowsB, o); };
  const swap = (name, from, pairs) => { for (const f of [0, 1]) reg(name + f, recolor(SPR[from + f].c, pairs)); };

  /* ---- monsters ---- */
  const beetle = [
    '....BBBBBB....',
    '..BBbbbbbbBB..',
    '.BbbcbbbbbbbB.',
    '.BbcbbbbbbbbB.',
    'BbbbbbBBbbbbbB',
    'BbbbbbBBbbbbbB',
    'kBbwbbBBbbwbBk',
    '.kkBBBBBBBBkk.'];
  two('beetle', beetle.concat(['.k.k..kk..k.k.', 'k..k......k..k']), beetle.concat(['k..k..kk..k..k', '.k.k......k.k.']));
  const thorn = [
    '..w......w..',
    '...nnnnnn...',
    'w.nnllnnnn.w',
    '.nnllnnnnnn.',
    '.nnlnnnnnnn.',
    'wnnknnnnknnw',
    '.nnknnnnknn.',
    '.nnnnppnnnN.',
    'w.nnnnnnNN.w',
    '..NnnnnNNN..',
    '...NNNNNN...'];
  two('thorn', thorn.concat(['...d....d...']), thorn.concat(['..d......d..']));
  const flowerTop = [
    '....pppp....',
    '..pppppppp..',
    '.ppyyyyyypp.',
    'pppykyykyppp',
    'pppyyyyyyppp'];
  const flowerBot = [
    '..pppppppp..',
    '....pppp....',
    '.....nn.....',
    '.nn..nn..nn.',
    'nNnn.nn.nnNn',
    '.nnnnnnnnnn.',
    '..NNNNNNNN..'];
  two('flower', flowerTop.concat(['.ppyykkyypp.'], flowerBot), flowerTop.concat(['.ppykkkkypp.'], flowerBot));
  const imp = [
    'r..........r',
    'rr........rr',
    '.rrrrrrrrrr.',
    '.rrrrrrrrrr.',
    'rrwkrrrrkwrr',
    'rrrrrrrrrrrr',
    '.rrrkkkkrrr.',
    '..rrrrrrrr..',
    '..RrrrrrrR..',
    '.R.RrrrrR.R.',
    '...RrrrrR...'];
  two('imp', imp.concat(['...RR..RR...', '..RR....RR..']), imp.concat(['...R....R...', '...RR..RR...']));
  const bomber = [
    '...KKKKKK...',
    '..KKKKKKKK..',
    '.KKGKKKKKKK.',
    '.KwkKKKKwkK.',
    '.KwkKKKKwkK.',
    '.KKKKrrKKKK.',
    '..KKKKKKKK..',
    '...KKKKKK...'];
  two('bomber', ['.......o....', '......T.....'].concat(bomber, ['..rr....rr..', '..rr....rr..']), ['......y.....', '......T.....'].concat(bomber, ['..rr....rr..', '........rr..']));
  const latch = [
    '...gggggg...',
    '..gg....gg..',
    '..gg....gg..',
    '..gg....gg..',
    '.yyyyyyyyyy.',
    'yyywkyywkyyY',
    'yyywkyywkyyY',
    'yyyyykkyyyyY',
    'yyyyykkyyyYY',
    'yyyyyykyyyYY',
    '.YYYYYYYYYY.'];
  two('latch', latch.concat(['..dd....dd..']), latch.concat(['...dd..dd...']));
  const sapper = [
    '...yyyyyy...',
    '..yywwyyyy..',
    '..yyyyyyyy..',
    '.TTTTTTTTTT.',
    '.TkTTTTTTkT.'];
  const sapperBot = [
    '.wTTTTTTTTw.',
    '..TTtTTtTT..',
    '..TTTTTTTT..',
    '..dd....dd..'];
  two('sapper', sapper.concat(['wTTTTppTTTTw', 'wwTTTppTTTww'], sapperBot), sapper.concat(['wwTTTppTTTww', '.wTTTppTTTw.'], sapperBot));
  const hexer = [
    '....vvvv....',
    '...vvvvvv...',
    '..vvPPPPvv..',
    '..vPkkkkPv..'];
  const hexerBot = [
    '..vvkkkkvv..',
    '.vvvvvvvvvv.',
    '.vPvvvvvvPv.',
    'vvPvvvvvvPvv',
    'vPPvvvvvvPPv',
    '.vvvvvvvvvv.',
    '.vvPvvvvPvv.'];
  two('hexer', hexer.concat(['..vPykkyPv..'], hexerBot, ['..vvvvvvvv..']), hexer.concat(['..vPwkkwPv..'], hexerBot, ['.vvv.vv.vvv.']));
  const golem = [
    '....GGGGGGGG....',
    '...GggggggggG...',
    '...GgoggggogG...',
    '...GgoggggogG...',
    '...GggggggggG...',
    '.GGGGGGGGGGGGGG.',
    'GggGgggoogggGggG',
    'GggGggoyyoggGggG',
    'GggGggoyyoggGggG',
    'GggGgggoogggGggG',
    'GGG.GggggggG.GGG',
    'GGG.GggggggG.GGG',
    '....GGGGGGGG....'];
  two('golem', golem.concat(['....Ggg..ggG....', '....Ggg..ggG....', '...GGGG..GGGG...']), golem.concat(['....Ggg..ggG....', '.........ggG....', '...GGGG..GGGG...']));
  two('bee', ['.w.w.', 'yKyKy', '.yKy.'], ['w...w', 'yKyKy', '.yKy.'], { ay: 3 });
  swap('moth', 'bat', [[PAL.P, '#d9a04a'], [PAL.v, '#8a5a2a']]);
  swap('cinder', 'slime', [[PAL.n, PAL.o], [PAL.l, PAL.y], [PAL.N, PAL.O]]);
  swap('wraith', 'ghost', [[PAL.w, '#e2d4ff'], [PAL.c, '#9a62d6'], [PAL.B, '#3b2d4f']]);
  for (const f of [0, 1]) reg('eshroom' + f, scaleCanvas(SPR['spore' + f].c, 2));
  for (const f of [0, 1]) reg('bigtin' + f, scaleCanvas(SPR['tin' + f].c, 2));
  // the dice a knock back calls: snake eyes on one frame, a five on the other, so it seems to roll as it hops
  /* ---- the house (#12): a dealer, a roulette wheel, a slot machine, and what they throw ---- */
  two('dealer', [
    '...NNNNNN...',
    '..NnnnnnnN..',
    '.nnnnnnnnnnn',
    '..ssssssss..',
    '..skssssks..',
    '..ssssssss..',
    '...wwrrww...',
    '..KKwwwwKK..',
    '.sKKwwwwKKww',
    '.sKKKwwKKKwr',
    '..KKKKKKKK..',
    '..KK....KK..',
    '..KK....KK..'], [
    '............',
    '...NNNNNN...',
    '..NnnnnnnN..',
    '.nnnnnnnnnnn',
    '..ssssssss..',
    '..skssssks..',
    '..ssssssss..',
    '...wwrrww...',
    '.sKKwwwwKKww',
    '.sKKKwwKKKwr',
    '..KKKKKKKK..',
    '..KK....KK..',
    '...KK..KK...']);
  { const rows = [
    '....YYYYYY....',
    '..YYrKrKrKYY..',
    '.YrKrKrKrKrKY.',
    '.YKrKwwwwrKrY.',
    'YrKrwTTTTwKrKY',
    'YKrwTTyyTTwrKY',
    'YrKwTyyyyTwKrY',
    'YKrwTyyyyTwrKY',
    'YrKwTTyyTTwKrY',
    'YKrKwTTTTwrKrY',
    '.YrKrwwwwKrKY.',
    '.YKrKrKrKrKrY.',
    '..YYKrKrKrYY..',
    '....YYYYYY....'];
    two('wheel', rows, rows.map(r => r.replace(/[rK]/g, c => c === 'r' ? 'K' : 'r')), { ay: 11 }); }
  two('slot', [
    '..YYYYYYYYYY....',
    '.YrrrrrrrrrrY.rr',
    '.YrwwwwwwwwrY.rr',
    '.YrwrwwywwPrY..g',
    '.YrwwwwwwwwrY..g',
    '.YrrrrrrrrrrYggg',
    '.YRRRRRRRRRRY...',
    '.YRyyRRRRyyRY...',
    '.YRRRRRRRRRRY...',
    '.YRkkkkkkkkRY...',
    '.YRyyyyyyyyRY...',
    '.YYYYYYYYYYYY...',
    '..KK......KK....'], [
    '..YYYYYYYYYY....',
    '.YrrrrrrrrrrY...',
    '.YrwwwwwwwwrY...',
    '.YrwywwPwwrrY.rr',
    '.YrwwwwwwwwrY.rr',
    '.YrrrrrrrrrrYggg',
    '.YRRRRRRRRRRY...',
    '.YRyyRRRRyyRY...',
    '.YRRRRRRRRRRY...',
    '.YRkkkkkkkkRY...',
    '.YRyyyyyyyyRY...',
    '.YYYYYYYYYYYY...',
    '..KK......KK....'], { ax: 6 });
  // what the slot machine's reels show: cherries (a ring), a bell (a fan), a seven (three fast bolts)
  A('sym0', ['..n..', '.n.n.', 'rr.rr', 'rr.rr', '.....'], { ay: 6 });
  A('sym1', ['..y..', '.yyy.', '.yyy.', 'yyyyy', '..Y..'], { ay: 6 });
  A('sym2', ['PPPPP', '...PP', '..PP.', '.PP..', '.PP..'], { ay: 6 });
  A('s_card', ['.ww.', 'wrww', 'wwrw', '.ww.'], { ol: 'k', ay: 3 });
  A('s_ball', ['.ww.', 'wwwW', 'wwWW', '.WW.'], { ol: 'k', ay: 3 });
  A('die0', [
    '.wwwwwwwwww.',
    'wwwwwwwwwwwW',
    'wwwwwwwwwwwW',
    'wwwwwwwwwwwW',
    'wwkkwwwkkwwW',
    'wwkkwwwkkwwW',
    'wwwwwwwwwwwW',
    'wwwwwwwwwwwW',
    'wwwwwwwwwwwW',
    'wwwwwwwwwwwW',
    'wWWWWWWWWWWW',
    '.WWWWWWWWWW.']);
  A('die1', [
    '.wwwwwwwwww.',
    'wwwwwwwwwwwW',
    'wwkkwwwkkwwW',
    'wwkkwwwkkwwW',
    'wwwwwwwwwwwW',
    'wwwwwkkwwwwW',
    'wwwwwkkwwwwW',
    'wwwwwwwwwwwW',
    'wwkkwwwkkwwW',
    'wwkkwwwkkwwW',
    'wWWWWWWWWWWW',
    '.WWWWWWWWWW.']);
  for (const f of [0, 1]) reg('bigdie' + f, scaleCanvas(SPR['die' + f].c, 2));

  /* ---- boss 2: Mother Morel (procedural 44x46) ---- */
  const mkMorel = (open, squash) => {
    const g = new CG(44, 46), cy = squash ? 18 : 16, ry = squash ? 13 : 14.5;
    g.rect(13, cy + 8, 18, 36 - cy, 't').rect(13, cy + 8, 3, 36 - cy, 'w').rect(27, cy + 8, 4, 36 - cy, 'T');
    g.ell(21.5, 43, 12, 2.5, 'T');
    g.ell(21.5, cy, 21, ry, 'O').ell(21.5, cy - 2, 19, ry - 2.5, 'o');
    for (const [px, py] of [[10, 10], [18, 6], [27, 8], [34, 13], [14, 16], [23, 14], [31, 19], [7, 17], [20, 21], [37, 20]]) { g.ell(px, py + cy - 16, 2.2, 1.6, 'd'); g.set(px - 1, py + cy - 17, 'O'); }
    g.ell(12, cy - 8, 3, 1.4, 'y');
    for (const [ex, s] of [[17, 1], [27, -1]]) { g.ell(ex, cy + 17, 3, 3, 'w'); g.rect(ex - 1 + s, cy + 16, 2, 3, 'k'); }
    g.line(13, cy + 12, 19, cy + 13, 'k').line(31, cy + 12, 25, cy + 13, 'k');
    if (open) g.rect(18, cy + 22, 8, 5, 'R').rect(18, cy + 22, 8, 1, 'k').rect(19, cy + 25, 6, 2, 'p'); else g.rect(18, cy + 23, 8, 1, 'k').set(17, cy + 22, 'k').set(26, cy + 22, 'k');
    g.rect(11, 43, 8, 3, 'd').rect(25, 43, 8, 3, 'd');
    return g.canvas('k');
  };
  reg('morel0', mkMorel(false, false)); reg('morel1', mkMorel(false, true)); reg('morel2', mkMorel(true, false)); reg('morel3', mkMorel(true, true));

  /* ---- boss 3: The Unmaker, a floating keystone (procedural 48x44) ---- */
  const mkUnmaker = (glow, lift) => {
    const g = new CG(48, 44);
    for (let y = 3; y < 36; y++) {
      const half = 16 - (y - 3) * 6 / 33, x0 = Math.round(24 - half), x1 = Math.round(24 + half) - 1;
      for (let x = x0; x <= x1; x++) g.set(x, y, x < x0 + 2 ? 'W' : x > x1 - 2 ? 'G' : 'g');
    }
    g.rect(8, 3, 32, 2, 'W').rect(14, 34, 20, 2, 'G');
    g.rect(7, 0, 7, 4, 'W').rect(20, 0, 8, 3, 'W').rect(34, 0, 7, 4, 'W').rect(7, 3, 7, 1, 'g').rect(34, 3, 7, 1, 'g');
    g.disc(24, 14, 5.2, 'k').rect(22, 17, 4, 11, 'k');
    g.disc(24, 14, 3.2, glow ? 'y' : 'o').rect(23, 17, 2, 9, glow ? 'y' : 'o'); if (glow) g.set(24, 13, 'w').set(23, 13, 'w');
    g.line(12, 8, 15, 14, 'G').line(15, 14, 13, 21, 'G').line(35, 20, 32, 27, 'G').line(30, 6, 33, 10, 'G');
    g.rect(13, 27, 2, 2, 'c').rect(33, 13, 2, 2, 'c').rect(17, 31, 2, 2, 'c');
    const hy = lift ? 23 : 26;
    for (const hx of [0, 39]) g.rect(hx, hy, 9, 9, 'g').rect(hx, hy, 9, 2, 'W').rect(hx, hy + 7, 9, 2, 'G').rect(hx + 2, hy + 3, 1, 3, 'G').rect(hx + 4, hy + 3, 1, 3, 'G').rect(hx + 6, hy + 3, 1, 3, 'G');
    return g.canvas('k');
  };
  reg('unmaker0', mkUnmaker(false, false)); reg('unmaker1', mkUnmaker(false, true)); reg('unmaker2', mkUnmaker(true, false)); reg('unmaker3', mkUnmaker(true, true));

  /* ---- props ---- */
  A('barrel', [
    '..TTTTTT..',
    '.TtttttTT.',
    'GGGGGGGGGG',
    'TtTtTTtTTd',
    'TtTrrrrTTd',
    'TtTrrrrTTd',
    'TtTtTTtTTd',
    'GGGGGGGGGG',
    'TtTtTTtTTd',
    '.TtTTtTTd.',
    '..dddddd..']);
  A('barrel_spent', [
    '..........',
    '..........',
    '..........',
    '..........',
    '..........',
    '..........',
    '.k..T...k.',
    'K.TdKd.T.K',
    '.dKTdKdTd.',
    'KdTdKTdKdK',
    '.KKdKKdKK.'], { ol: null });
  { const g = new CG(18, 14);                                           // ballista, pointing east; rotated per target
    g.rect(4, 4, 8, 6, 'G').rect(4, 4, 8, 1, 'g').rect(2, 6, 14, 2, 'T').rect(2, 6, 14, 1, 't');
    g.line(11, 1, 13, 4, 'd').line(13, 4, 13, 9, 'd').line(13, 9, 11, 12, 'd').line(11, 1, 5, 6, 'W').line(11, 12, 5, 7, 'W');
    g.rect(8, 6, 9, 1, 'w').set(17, 6, 'W');
    const c = g.canvas('k'); for (let d = 0; d < 4; d++) reg('ballista' + d, rotCanvas(c, d - 1), undefined, undefined); }
  for (const f of [0, 1]) { const g = new CG(13, 13); g.disc(6, 6, 4.6, 'g').disc(6, 6, 3, 'W').disc(6, 6, 1, 'G'); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + f * Math.PI / 8; g.set(Math.round(6 + Math.cos(a) * 5.7), Math.round(6 + Math.sin(a) * 5.7), 'W'); } reg('saw' + f, g.canvas('k'), 7, 9); }
  A('bench', [
    '...GGGGGGGG...',
    '..GWWWWWWWWg..',
    '...GGGGGGGG...',
    '.....GggG.....',
    '....GGggGG....',
    'TTTTTTTTTTTTTT',
    'TttttttttttttT',
    'Td..........dT',
    'Td..........dT']);
  for (const full of [1, 0]) { const g = new CG(18, 20);
    g.rect(2, 2, 2, 12, 'T').rect(14, 2, 2, 12, 'T').rect(1, 1, 16, 2, 'd').rect(1, 1, 16, 1, 'T').rect(8, 3, 2, 4, 'g');
    g.ell(8.5, 15, 8, 4.5, 'G').ell(8.5, 13.5, 8, 4.5, 'W').ell(8.5, 13.5, 6, 3, full ? 'b' : 'k');
    if (full) g.set(6, 13, 'c').set(10, 14, 'c').set(8, 12, 'w');
    reg(full ? 'well' : 'well_dry', g.canvas('k')); }
  A('hive', [
    '.....TT.....',
    '....yyyy....',
    '...yyyyyy...',
    '..YYYYYYYY..',
    '..yyyyyyyy..',
    '.yyyyyyyyyy.',
    '.YYYYYYYYYY.',
    '.yyyykkyyyy.',
    '.yyyykkyyyy.',
    '..YYYYYYYY..',
    '...yyyyyy...',
    '....TTTT....']);
  { const g = new CG(16, 20); g.rect(0, 4, 16, 16, 'N').ell(7.5, 6, 8, 5, 'n').rect(1, 6, 14, 12, 'n');
    for (let i = 0; i < 26; i++) { const x = (i * 7 + 3) % 15, y = 2 + (i * 5 + (i >> 1)) % 16; if (g.get(x, y) !== '.') g.set(x, y, i % 3 ? 'l' : 'N'); }
    g.rect(0, 18, 16, 2, 'N'); reg('hedge', g.canvas('k')); }
  A('planter', [
    '.....nn.......',
    '....nlnn..n...',
    '.....nn..nln..',
    'TTTTTTTTTTTTTT',
    'TddddddddddddT',
    'TtttttttttttdT',
    'TttttttttttTdT',
    '.TTTTTTTTTTTT.']);
  A('die', [
    '.wwwwwwww.',
    'wwwwwwwwwW',
    'wwkwwwwkwW',
    'wwwwwwwwwW',
    'wwwwkkwwwW',
    'wwwwkkwwwW',
    'wwwwwwwwwW',
    'wwkwwwwkwW',
    'wWWWWWWWWW',
    '.WWWWWWWW.']);
  A('altar', [
    '..o..........o..',
    '..y..wwwwww..y..',
    '..w.wwwwwwww.w..',
    '..w.wkkwwkkw.w..',
    '..w.wwwkkwww.w..',
    '..w..wkwkww..w..',
    'KKKKKKKKKKKKKKKK',
    'KvvvvvvvvvvvvvvK',
    'KvPvvvvvvvvvvPvK',
    'KvvvvvvvvvvvvvvK',
    '.KKKKKKKKKKKKKK.',
    '..KKvvvvvvvvKK..',
    '..KKKKKKKKKKKK..']);
  A('grave', [
    '..gggggg..',
    '.gWWWWWWg.',
    'gWWWWWWWWG',
    'gWWWGGWWWG',
    'gWGGGGGGWG',
    'gWWWGGWWWG',
    'gWWWGGWWWG',
    'gWWWWWWWWG',
    'gWWWWWWWWG',
    'NnNnnNnnNn']);
  for (const f of [0, 1]) { const g = new CG(22, 12); g.ell(10.5, 5.5, 10.5, 5.5, 'v').ell(10.5, 5.5, 8.5, 4.2, 'P').ell(10.5, 5.5, 6, 2.8, f ? 'c' : 'p').ell(10.5, 5.5, 3, 1.4, 'w');
    g.set(4 + f * 3, 3, 'w').set(16 - f * 2, 8, 'w').set(10, 1 + f, 'c'); reg('portal' + f, g.canvas(null), 11, 6); }
  for (const open of [0, 1]) { const g = new CG(32, 28);                // the way down (barred until the warden falls)
    g.rect(0, 0, 32, 28, 'G').rect(1, 1, 30, 26, 'g').rect(1, 1, 30, 1, 'W').rect(3, 3, 26, 22, 'k');
    for (let i = 0; i < 6; i++) { const y = 3 + i * 4, w = 26 - i * 2; g.rect(3 + i, y, w, 2, 'WggGGK'[i]).rect(3 + i, y + 2, w, 2, i < 3 ? 'G' : 'K'); }
    if (!open) { for (let x = 5; x < 28; x += 5) g.rect(x, 2, 2, 24, 'Y').rect(x, 2, 1, 24, 'y'); g.rect(2, 12, 28, 3, 'Y').rect(2, 12, 28, 1, 'y'); }
    reg(open ? 'stairs_open' : 'stairs_shut', g.canvas(null), 16, 14); }
  A('candle', [
    '..ww..',
    '..ww..',
    '..ww..',
    '..wW..',
    '.YYYY.',
    '..YY..',
    '..YY..',
    '..YY..',
    '.YYYY.',
    'YYYYYY']);
  A('scope', [
    '.........GG.',
    '........GggG',
    '.......GggG.',
    '......GggG..',
    '.....GggG...',
    '....GggG....',
    '...yyyG.....',
    '...yy.T.....',
    '......T.....',
    '.....TTT....',
    '....T.T.T...',
    '...T..T..T..',
    '..TT..T..TT.']);
  const table = ['TTTTTTTTTTTTTTTT', 'TttttttttttttttT', 'TttttttttttttttT', 'TTTTTTTTTTTTTTTT', 'Td............dT', 'Td............dT'];
  A('desk_map', ['..wwwwwwwwww....', '.wtttrttttbtw...', '.wtnttttrtttw...', '.wttttbtttntw...', '..wwwwwwwwww....'].concat(table));
  A('desk_coin', ['.....y....y.....', '..y..y.yy.y.....', '..y.yy.yy.yy.y..', '..yyyy.yy.yy.yy.', '..yyyy.yy.yyyyy.'].concat(table));
  A('desk_book', ['...........w....', '..rrrrrr..w.....', '.rwwwwwwr.w.....', '.rwkkwkwr.K.....', '.rrrrrrrr.......'].concat(table));
  A('snow', ['...wwww...', '..wwwwww..', '.wwcwwwww.', 'wwwwwwcwww', 'wcwwwwwwwc'], { ol: 'B' });
  A('fx_icicle', ['wccw', 'wccw', '.cc.', '.cc.', '.cc.', '.c..', '.c..'], { ol: 'B', ay: 7 });
  A('vent', [
    'KKKKKKKKKKKK',
    'KkkKkkKkkKkK',
    'KkkKkkKkkKkK',
    'KKKKKKKKKKKK',
    'KkkKkkKkkKkK',
    'KkkKkkKkkKkK',
    'KKKKKKKKKKKK'], { ol: null, ay: 3 });
  reg('heart_shield', recolor(SPR.heart.c, [[PAL.r, PAL.b], [PAL.R, PAL.B]]));
  for (const f of [0, 1]) reg('gflame' + f, recolor(SPR['sflame' + f].c, [[PAL.o, '#58d0a0'], [PAL.y, '#c8ffe0'], [PAL.R, '#1f6a5a']]));   // the Undergarden burns green

  /* ---- projectiles & weapon bits ---- */
  A('s_shard', ['..w..', '.wcw.', 'wcbcw', '.wcw.', '..w..'], { ol: 'B', ay: 3 });
  { const c = SPR.key.c; for (let d = 0; d < 4; d++) reg('s_bkey' + d, rotCanvas(c, d), undefined, undefined); for (let d = 0; d < 4; d++) { const s = SPR['s_bkey' + d]; s.ax = s.w >> 1; s.ay = s.h >> 1; } }
  A('s_mat', [
    '.rrrrrrrrrrrr.',
    'ryyyyyyyyyyyyr',
    'ryrrrrrrrrrryr',
    'ryrrrryyrrrryr',
    'ryrrrrrrrrrryr',
    'ryyyyyyyyyyyyr',
    '.rrrrrrrrrrrr.'], { ol: 'R', ay: 4 });
  reg('s_mat_off', recolor(SPR.s_mat.c, [[PAL.r, PAL.G], [PAL.y, PAL.g], [PAL.R, PAL.K]]), SPR.s_mat.ax, SPR.s_mat.ay);
  two('s_moth', ['w...w', 'wyoyw', '.yyy.', '..y..'], ['.....', 'wyoyw', 'wyyyw', '..y..'], { ol: 'O', ay: 3 });
  reg('s_spore', recolor(SPR.s_ebullet.c, [[PAL.r, PAL.n], [PAL.p, PAL.l]]), SPR.s_ebullet.ax, SPR.s_ebullet.ay);
  reg('s_fire', recolor(SPR.s_ebullet.c, [[PAL.r, PAL.o], [PAL.p, PAL.y]]), SPR.s_ebullet.ax, SPR.s_ebullet.ay);
  reg('s_hexbolt', recolor(SPR.s_ebullet.c, [[PAL.r, PAL.P], [PAL.p, PAL.c]]), SPR.s_ebullet.ax, SPR.s_ebullet.ay);
  A('s_bolt', ['wwwwwwwwwW', 'WWWWWWWWWg'], { ol: 'k', ay: 1 });

  /* ---- latched gate across a doorway (48x14), horizontal and vertical ---- */
  { const g = new CG(48, 14);
    g.rect(0, 2, 48, 2, 'G').rect(0, 10, 48, 2, 'G').rect(0, 2, 48, 1, 'g');
    for (let x = 2; x < 48; x += 6) g.rect(x, 0, 2, 14, 'g').rect(x, 0, 1, 14, 'W');
    g.rect(20, 3, 8, 8, 'Y').rect(20, 3, 8, 1, 'y').rect(23, 6, 2, 3, 'k').rect(21, 0, 1, 3, 'W').rect(26, 0, 1, 3, 'W').rect(21, 0, 6, 1, 'W');
    const c = g.canvas('k'); DOORS.gate = [c, rotCanvas(c, 1)]; }
}
