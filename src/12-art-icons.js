/* ========================== 7c ART: v0.2 icons ======================== */
// 12x12 icons (+outline) for the new rooms, weapons and charms, 7x7 element glyphs,
// and star-badged copies of every weapon icon for its evolved form.
function buildIconsMore() {
  const I = (name, rows, o) => A('i_' + name, rows, Object.assign({ ol: 'k', ax: 7, ay: 7 }, o));

  /* ---- rooms ---- */
  I('cross', ['.....ww.....', '....wwww....', '.....ww.....', '..w..ww..w..', '.ww..ww..ww.', 'wwwwwwwwwwww', 'wwwwwwwwwwww', '.ww..ww..ww.', '..w..ww..w..', '.....ww.....', '....wwww....', '.....ww.....'], { ol: 'G' });
  I('grand', ['..y..yy..y..', '..yyyyyyyy..', '..yryybyry..', '..YYYYYYYY..', '...GGGGGG...', '..GWWWWWWG..', '.GWWGGGGWWG.', '.GWG....GWG.', '.GWG....GWG.', '.GWG....GWG.', 'GGGG....GGGG', '............']);
  I('powder', ['......o.....', '.....T......', '..TTTTTTTT..', '.TttttttttT.', '.GGGGGGGGGG.', '.TtTrrrrTtT.', '.TtTrrrrTtT.', '.TtTrrrrTtT.', '.GGGGGGGGGG.', '.TttttttttT.', '..TTTTTTTT..', '............']);
  I('furnace', ['.GGGGGGGGGG.', 'GggggggggggG', 'GgKKKKKKKKgG', 'GgKooyyooKgG', 'GgKoyyyyoKgG', 'GgKoywwyoKgG', 'GgKoyyyyoKgG', 'GgKKooooKKgG', 'GggggggggggG', 'GGGGGGGGGGGG', '.GG......GG.', '............']);
  I('chapel', ['.....o......', '....oyo.....', '....oyo.....', '.....w......', '....wwww....', '....wwWw....', '....wwWw....', '....wwWw....', '....wwWw....', '..YYYYYYYY..', '...YYYYYY...', '............']);
  I('icicle', ['cccccccccccc', 'wccwccwwccwc', '.cc.cc.wc.c.', '.cc.cc.wc.c.', '.c..cc.wc...', '.c..c..cc...', '....c..cc...', '....c..c....', '.......c....', '.......c....', '............', '............'], { ol: 'B' });
  I('glacier', ['..cccccccc..', '.cwwcccccwc.', 'cwwccccccccb', 'cwccccccccbb', 'cccckcckcccb', 'cccckcckcccb', 'ccccccccccbb', 'cccccwwccccb', 'ccccccccccbb', '.ccccccccbb.', '..bbbbbbbb..', '............'], { ol: 'B' });
  I('blizzard', ['...wwww.....', '..wwwwwww...', '.wwwwwwwwww.', 'wwwwwwwwwwww', '.WWWWWWWWWW.', '............', '.c...c...c..', '...c...c....', '.c...c...c..', '...c...c....', '............', '............'], { ol: 'B' });
  I('ballista', ['T........T..', '.T......T...', '..T....T....', '...TwwT.....', '...wTTw.....', 'wwwwwwwwwwwW', '...wTTw.....', '...TwwT.....', '..T....T....', '.T......T...', 'T........T..', '............']);
  I('saw', ['....W..W....', '..W.gggg.W..', '...gWWWWg...', '.WgWWWWWWgW.', '..gWWGGWWg..', 'WgWWGkkGWWgW', 'WgWWGkkGWWgW', '..gWWGGWWg..', '.WgWWWWWWgW.', '...gWWWWg...', '..W.gggg.W..', '....W..W....']);
  I('workshop', ['..gg........', '.gg..g......', '.ggggg......', '..gggg......', '...gggg.....', '....gggg....', '.....gggg...', '......gggg..', '.......ggggg', '......g..gg.', '........gg..', '............']);
  I('spring', ['...w...w....', '....w...w...', '...w...w....', '............', '..GGGGGGGG..', '.GccccccccG.', 'GccwcccccccG', 'GcccccccwccG', 'GccccccccccG', '.GccccccccG.', '..GGGGGGGG..', '............']);
  I('well', ['dddddddddddd', '.T........T.', '.T...gg...T.', '.T...gg...T.', '.T...TT...T.', '.GGGGGGGGGG.', 'GWWWWWWWWWWG', 'GWbbbbbbbbWG', 'GWbbcbbbbbWG', 'GWWWWWWWWWWG', '.GGGGGGGGGG.', '............']);
  I('maproom', ['............', '.wwwwwwwwww.', 'wtttttttttTw', 'wttrtttttttw', 'wtttrttbbttw', 'wttttrtbtttw', 'wtnntttttttw', 'wtnttttrtttw', 'wtttttttrttw', '.wwwwwwwwww.', '............', '............']);
  I('counting', ['............', '........yy..', '.......yyyy.', '...yy..YYYY.', '..yyyy.yyyy.', '..YYYY.YYYY.', '..yyyy.yyyy.', '..YYYY.YYYY.', '..yyyy.yyyy.', '..YYYY.YYYY.', '............', '............'], { ol: 'd' });
  I('observ', ['.........w..', '...w....www.', '..www....w..', '...w........', '.......GG...', '......GggG..', '.....GggG...', '....GggG....', '...yyG......', '...yy.T.....', '.....TTT....', '....T.T.T...']);
  I('script', ['.........ww.', '........wwc.', '.......wwc..', '......wwc...', '.....wwc....', '....wwc.....', '...kw.......', '..k.........', '.wwwwwwww...', '.wkkwkkkw...', '.wwwwwwww...', '............']);
  I('apiary', ['............', '..ww....ww..', '.wwww..wwww.', '.wwwwyywwww.', '..wwyKKyww..', '...yyKKyy...', '...yKyyKy...', '...yyKKyy...', '....yKKy....', '.....yy.....', '......k.....', '............']);
  I('fairy', ['....rr......', '...rwrr.....', '....tt..rr..', '........rwr.', '.rr......t..', 'rwrr........', '.tt.....rr..', '.......rrwr.', '...rr...tt..', '..rwrr......', '...tt.......', '............']);
  I('bramble', ['NNNNNNNNNNNN', 'Nn........nN', 'Nn.NNNNNN.nN', 'Nn.Nn.....nN', 'Nn.Nn.NNNNnN', 'Nn.Nn.Nn..nN', 'Nn.Nn.Nn.NnN', 'Nn....Nn..nN', 'NnNNNNNn.NnN', 'Nn........nN', 'NNNNNNNNNNNN', '............']);
  I('greenhouse', ['.....cc.....', '....cwwc....', '...cw..wc...', '..cw....wc..', '.cw..nn..wc.', '.c..nlln..c.', '.c...nn...c.', '.c...nn...c.', '.c..TTTT..c.', '.cccccccccc.', '............', '............'], { ol: 'B' });
  I('dice', ['..wwwwwwww..', '.wwwwwwwwwW.', '.wkkwwwwkkW.', '.wkkwwwwkkW.', '.wwwwwwwwwW.', '.wwwwkkwwwW.', '.wwwwkkwwwW.', '.wwwwwwwwwW.', '.wkkwwwwkkW.', '.wkkwwwwkkW.', '..WWWWWWWW..', '............']);
  I('altar', ['.....rr.....', '....rrrr....', '....rRRr....', '.....rr.....', '............', '.KKKKKKKKKK.', 'KvvvvvvvvvvK', 'KvPvvvvvvPvK', 'KvvvvvvvvvvK', '.KKKKKKKKKK.', '..KKvvvvKK..', '..KKKKKKKK..']);
  I('grave', ['....gggg....', '...gWWWWg...', '..gWWWWWWg..', '..gWWGGWWg..', '..gWGGGGWg..', '..gWWGGWWg..', '..gWWGGWWg..', '..gWWWWWWg..', '..gWWWWWWg..', '.NnNnnNnnNn.', '............', '............']);
  I('waygate', ['...PPPPPP...', '..PvvvvvvP..', '.PvPPPPPPvP.', 'PvPvccccvPvP', 'PvPcwwwwcPvP', 'PvPcwccwcPvP', 'PvPcwwwwcPvP', 'PvPvccccvPvP', '.PvPPPPPPvP.', '..PvvvvvvP..', '...PPPPPP...', '............'], { ol: 'K' });
  I('stairs', ['GGGGGGGGGGGG', 'GWWWWWWWWWWG', 'GkkkkkkkkkkG', 'GkWWWWWWWWkG', 'GkkkkkkkkkkG', 'GkkggggggkkG', 'GkkkkkkkkkkG', 'GkkkGGGGkkkG', 'GkkkkkkkkkkG', 'GkkkkKKkkkkG', 'GGGGGGGGGGGG', '............']);

  /* ---- weapons ---- */
  I('frostfan', ['w....w....w.', 'wc...c...cw.', '.wc..c..cw..', '..wc.c.cw...', '...wcccw....', '....wcw.....', '....bcb.....', '....bbb.....', '.....b......', '.....T......', '.....T......', '............'], { ol: 'B' });
  I('boomer', ['..........w.', '.........wy.', '........wyy.', '.......wyy..', '......wyy...', '.....wyy....', '....wyy.....', '...wyyy.....', '..wyyyyyyyw.', '.wyyyyyyyyw.', '.wwwwwwwww..', '............'], { ol: 'O' });
  I('mat', ['............', '............', '...w.w.w.w..', '..wWwWwWwW..', '.rrrrrrrrrr.', 'ryyyyyyyyyyr', 'ryrrrrrrrryr', 'ryrryyyyrryr', 'ryrrrrrrrryr', 'ryyyyyyyyyyr', '.rrrrrrrrrr.', '............'], { ol: 'R' });
  I('moth', ['............', 'ww........ww', 'wyw......wyw', 'wyyw.oo.wyyw', 'wyyywoowyyyw', '.wyyyoooyyw.', '..wyyooyyw..', '.wyyw.o.wyyw', '.wyw..o..wyw', '..w...o...w.', '............', '............'], { ol: 'O' });

  /* ---- weapons: the second dozen ---- */
  I('quarrel', ['.TT.........', '..TT........', '...TT.......', '....TT......', '....TT...w..', 'dTTTTTggggww', '....TT...w..', '....TT......', '...TT.......', '..TT........', '.TT.........', '............']);
  I('rocket', ['.........rr.', '........rrr.', '.......rwrr.', '......rwwr..', '.....rwwr...', '...rrwwr....', '...rrrr.....', '..oorrr.....', '.oyo.r......', '.yo.........', 'y...........', '............'], { ol: 'R' });
  I('loaded', ['............', '.wwwww......', '.wkwww......', '.wwkww......', '.wwwkw......', '.wwwwwrrrrr.', '......rwrwr.', '......rrrrr.', '......rwrwr.', '......rrrrr.', '............', '............']);
  I('tide', ['............', '....cccc....', '..ccwwwwc...', '.cwwbbbbwc..', '.cwb....bw..', 'cwb......w..', 'cwb.........', 'cwbb......c.', 'cwwbbb..ccb.', '.cwwwbbbbbb.', '..cccwwwwb..', '............'], { ol: 'B' });
  I('honey', ['............', '...TTTTTT...', '..TyyyyyyT..', '...TTTTTT...', '..YyyyyyyY..', '.YyywyyyyyY.', '.YywyyyyyyY.', '.YyyyyyyyyY.', '.YyyyyyyyyY.', '..YyyyyyyY..', '...YYYYYY...', '............'], { ol: 'd' });
  I('toad', ['............', '....rrrr....', '..rrrwwrrr..', '.rrwrrrrrrr.', '.rrrrrrwwrr.', 'rrwwrrrrwwrr', 'rrrrrrrrrrrr', '...tttttt...', '....tttt....', '....tttt....', '...tttttt...', '............']);
  I('whip', ['............', '..nnnnnn....', '.nn....nn...', '.n..nn..nn..', '.n.p..n..n..', '.n.n.nn..n..', '.nn.....nn..', '..nnnnnnn...', '........TT..', '.........TT.', '..........TT', '............'], { ol: 'N' });
  I('coin', ['............', '...yyyyyy...', '..yyyyyyyy..', '.yywyyYYyyy.', '.ywyyYyyYyy.', '.yyyyYyyYyy.', '.yyyyyYYyyY.', '.yyyyyYyyyY.', '.yyyyyYYyYY.', '..yyyyyyYY..', '...yyYYYY...', '............'], { ol: 'd' });
  I('snowball', ['............', '....wwww....', '..wwwwwwww..', '.wwwwwwwwwc.', '.wwwwwwwwcc.', 'wwwwwwwwwwcc', 'wwwwwwwwwccc', '.wwwwwwwccc.', '.wwwwwcccc..', '..wwcccccc..', '....cccc....', '............'], { ol: 'B' });
  I('pepper', ['.........nn.', '........nn..', '.......rn...', '......rrr...', '.....rrwr...', '....rrwrr...', '...rrrrr....', '..rrrrr.....', '.rrrrr......', '.rrrr.......', '..rr........', '............'], { ol: 'R' });
  I('buzz', ['............', 'TT..........', 'TTTT........', 'TdTWW.......', 'TTWWWWW.....', '.TWWWWWWW...', '..gWWWWWWWW.', '...g.gWWWWWW', '......g.gWWW', '.........g.g', '............', '............']);
  I('sentry', ['............', '....YYYY....', '...YyyyyY...', '..YyywyyyGGG', '..YyyyyyyGGG', '..YYYYYYYY..', '...GggggG...', '....GggG....', '...TT..TT...', '..TT....TT..', '.TT......TT.', '............']);
  // their little world sprites
  A('s_pot', ['.TTT.', 'yyyyy', 'ywyyy', 'yyyyY', '.yyY.'], { ol: 'd', ay: 4 });
  A('s_toad', ['..rrr..', '.rwrrr.', 'rrrrwrr', 'rrrrrrr', '..ttt..', '..ttt..']);
  A('s_coin0', ['.yyy.', 'yywyy', 'yyyYy', 'yyYYy', '.yyy.'], { ol: 'd', ay: 4 });
  A('s_coin1', ['..y..', '..y..', '..y..', '..Y..', '..Y..'], { ol: 'd', ay: 4 });
  A('s_sentry', ['....YYYY...', '...YyyyyY..', '..YyywyyyY.', '..YyyyyyyGG', '..YyyyyyyGG', '..YYYYYYYY.', '...GgggG...', '...GgggG...', '..TTGGGTT..', '..TT...TT..', '.TT.....TT.', '.TT.....TT.']);

  /* ---- charms ---- */
  I('soles', ['............', 'c...........', '.c..TTTTT...', 'c..TtttttT..', '..TtttttttT.', 'c.TttttttttT', '..TTTTTTTTTT', '..dddddddddd', '..dKdKdKdKdK', '............', '............', '............']);
  I('clover', ['...nn..nn...', '..nlln.lnn..', '..nlnnnnnn..', '...nnnnnn...', '.nn.nnnn.nn.', 'nlnnnnnnnnnn', 'nlnnnnnnnlnn', '.nn.nNNn.nn.', '....nNNn....', '.....NN.....', '......NN....', '............'], { ol: 'N' });
  I('keyring', ['...gggggg...', '..g......g..', '.g........g.', '.g........g.', '..g......g..', '...gggggg...', '...y....y...', '..yyy..yyy..', '...y....y...', '...yy...yy..', '...y....y...', '...yy...yy..']);
  I('wedge', ['............', '............', '..........T.', '........TTT.', '......TTTtT.', '....TTTtttT.', '..TTTtttttT.', 'TTTtttttttT.', 'TTTTTTTTTTT.', 'ddddddddddd.', '............', '............']);
  I('trowel', ['..........TT', '.........TT.', '........TT..', '.......gg...', '......gg....', '...wwwWg....', '..wwwWWW....', '.wwwWWWW....', '.wwWWWW.....', '..wWWW......', '...WW.......', '............']);
  I('blueprint', ['............', '.bbbbbbbbbb.', 'bBccccccccBb', 'bBcwwwwwwcBb', 'bBcwccccwcBb', 'bBcwcwwcwcBb', 'bBcwccccwcBb', 'bBcwwwwwwcBb', 'bBccccccccBb', '.bbbbbbbbbb.', '............', '............'], { ol: 'K' });
  I('vest', ['w..........w', '.GG......GG.', 'GGGG....GGGG', 'wGGGGGGGGGGw', '.GGgGGGGgGG.', 'wGGGGGGGGGGw', '.GGgGGGGgGG.', 'wGGGGGGGGGGw', '.GGGGGGGGGG.', '..GGGGGGGG..', '............', '............']);
  I('wind', ['............', '...cccccc...', '..c......c..', '.c..cccc..c.', '.c.c....c...', '.c.c.cc.....', '.c..c..c....', '..c....c....', '...cccc.....', '............', '............', '............'], { ol: 'B' });
  I('sweet', ['............', '............', 'p..........p', 'pp..pppp..pp', 'ppppwwpppppp', 'pppwpppppmpp', 'ppppppppmmpp', 'pp..pmmm..pp', 'p..........p', '............', '............', '............'], { ol: 'R' });
  I('keen', ['.....rr.....', '.....rr.....', '...rrrrrr...', '..rr.rr.rr..', '..r..rr..r..', 'rrrrr..rrrrr', 'rrrrr..rrrrr', '..r..rr..r..', '..rr.rr.rr..', '...rrrrrr...', '.....rr.....', '.....rr.....'], { ol: 'R' });
  I('oil', ['............', '.........gg.', '........gg..', '..GGGG.gg...', '.GggggGg....', 'GggggggG....', 'GgwggggG....', 'GgwggggG....', 'GggggggG....', '.GGGGGG.....', '............', '............']);
  const ring = ['....oooo....', '...oyyyyo...', '....oyyo....', '...YYYYYY...', '..YY....YY..', '.YY......YY.', '.YY......YY.', '.YY......YY.', '..YY....YY..', '...YYYYYY...', '............', '............'];
  I('emberring', ring, { ol: 'd' });
  I('frostring', ring, { ol: 'B', map: { o: PAL.b, y: PAL.c, Y: PAL.W } });
  I('magpie', ['.........KK.', '........KbK.', '.......KbbK.', '......KbbK..', '.....KbbwK..', '....KbbwK...', '...KbbwK....', '..KbbwK.....', '..KbwK......', '.KwK........', '.K..........', '............']);
  I('pride', ['......rr....', '......rrr...', '......r.....', '....GGGGGG..', '...GWWWWWWG.', '...GWGWWGWG.', '...GWWWWWWG.', '...GWGWWGWG.', '...GWWWWWWG.', '...GWWddWWG.', '...GWWddWWG.', '............']);
  I('threshold', ['..GGGGGGGG..', '.GG......GG.', '.G........G.', '.G...yy...G.', '.G..yyyy..G.', '.G.yyyyyy.G.', '.G...yy...G.', '.G...yy...G.', '.G...yy...G.', '.G........G.', 'GG........GG', '............']);

  I('tinder', ['.....o......', '....oyo.....', '....oyyo....', '.....oo.....', '..TTTTTTTT..', '.TttttttttT.', '.TtrrrrrrtT.', '.TtrwrrrrtT.', '.TtrrrrrrtT.', '.TttttttttT.', '..TTTTTTTT..', '............']);
  I('snuffer', ['............', '.........gg.', '........gg..', '.......gg...', '......gg....', '..YYYYgg....', '..YyyyY.....', '.YyyyyyY....', '.YyyyyyY....', 'YyyyyyyyY...', 'YYYYYYYYY...', '............'], { ol: 'd' });

  /* ---- element glyphs (7x7 + outline) ---- */
  const E = (name, rows) => A('e_' + name, rows, { ol: 'k', ax: 4, ay: 4 });
  E('fire', ['...o...', '..oo...', '..oyo..', '.oyyo..', '.oywyo.', '.oyyyo.', '..ooo..']);
  E('frost', ['...c...', '.c.c.c.', '..ccc..', 'cccwccc', '..ccc..', '.c.c.c.', '...c...']);
  E('steel', ['.g.g.g.', 'ggggggg', '.gg.gg.', 'gg...gg', '.gg.gg.', 'ggggggg', '.g.g.g.']);
  E('water', ['...b...', '...b...', '..bbb..', '.bbcbb.', '.bcbbb.', '.bbbbb.', '..bbb..']);
  E('lore', ['.......', 'rrr.rrr', 'rwwrwwr', 'rwwrwwr', 'rwwrwwr', 'rrrrrrr', '.......']);
  E('wild', ['....nn.', '..nnln.', '.nnlnn.', '.nlnnn.', 'nnnnn..', '.nn....', 'n......']);
  E('shadow', ['.wwwww.', 'wwwwwww', 'wkwwwkw', 'wwwkwww', '.wwwww.', '.wkwkw.', '.......']);
  E('stone', ['.......', 'ggggggg', 'gWWgWWg', 'ggggggg', 'WgWWgWW', 'ggggggg', '.......']);

  /* ---- evolved weapons: the base icon with a gold star badge ---- */
  const star = drawGrid(['..y..', 'yyyyy', '.yyy.', 'yy.yy'].map(r => r.split('')), PAL, 'k');
  for (const id in WEAPONS) {
    const b = SPR['i_' + id]; if (!b) { console.warn('missing weapon icon i_' + id); continue; }
    const c = mkCanvas(b.w, b.h), g = c.getContext('2d'); g.drawImage(b.c, 0, 0); g.drawImage(star, b.w - 7, 0);
    reg('i_' + id + '_evo', c, b.ax, b.ay);
  }
}
