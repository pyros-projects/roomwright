"""Phone checks: the game on six emulated devices, driven by touch through Playwright.

    uv run --with playwright tools/check-devices.py [--url URL] [--shots DIR]

Checks index.html next to this folder, or a deployed copy with --url https://example.net/.
Prints one PASS/FAIL/SKIP line per check and exits non-zero on a failure.

For each device (a touch screen with a coarse pointer, in the size the phone reports to a page):
the scale is a whole number of at least two CSS pixels per game pixel and the view fills the screen;
on every screen each thing a finger can tap lies inside the view and is at least 40 CSS pixels in its
smaller dimension; the draft's card is whole and no smaller than 93 by 124 game pixels (93 is a card's
width with four in a row on the smallest view of a desk); and a run is played by touch:
title, hero screen, a drag to walk, a card built by a tap, pause and resume, the phone turned while the
run goes on, the end screen and back. An emulated phone is not a hand on a real one: this shows that the
layouts fit and the taps land, not how it feels.

The browser: the one named by CHROMIUM, else Playwright's own Chromium, else one in its cache, else
Chrome or Chromium on this machine. With none of them every check is skipped.
"""

import argparse
import json
import os
import shutil
import sys
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

GAME = Path(__file__).resolve().parents[1]
URL = GAME.joinpath("index.html").as_uri()
# The six of issue #20 (iPhone 15 and Pixel 7 upright and turned, iPhone SE, iPad Mini), then the other way up for the
# last two, and the size most Android phones report (360 by 800), which gives the smallest views of all.
DEVICES = [("iPhone 15 upright", 393, 852), ("iPhone 15 turned", 852, 393), ("Pixel 7 upright", 412, 915),
           ("Pixel 7 turned", 915, 412), ("iPhone SE", 375, 667), ("iPad Mini", 768, 1024),
           ("iPhone SE turned", 667, 375), ("iPad Mini turned", 1024, 768), ("Android 360x800 upright", 360, 800),
           ("Android 360x800 turned", 800, 360)]
TAP_CSS = 40
out, failed = [], False

# In the page: a save that has played before, and helpers. rects(name) lists what can be tapped on a screen.
PRE = """
window.__dev = (() => {
  const S = RW.Save.data; S.runs = 5; S.wins = 1; S.heroes = { pip: 1, wick: 1, brin: 1, moss: 1 }; S.stakes = { pip: 2 }; S.stake = { pip: 0 };
  for (const id of ['hall', 'cross', 'ember', 'frost', 'spikes', 'guardian', 'fountain', 'garden', 'library', 'vault', 'maproom']) S.rooms[id] = 1;
  RW.coach(false);
  const V = () => RW.view(), clip = r => { const v = V(), x = Math.max(0, r.x), y = Math.max(0, r.y); return { x, y, w: Math.min(v.VW, r.x + r.w) - x, h: Math.min(v.VH, r.y + r.h) - y }; };
  const rects = {
    title: () => RW.titleLayout(),
    prep: () => { const L = RW.prepLayout('pip'); return [clip(L.next), clip(L.stakes), clip(L.deck), L.start]; },
    deck: () => RW.deckLayout().cells,
    play: () => [RW.pauseMark()],
    // the card in the middle whole; where one card is shown at a time, what shows of its neighbours is tapped too
    draft: () => { const L = RW.draftLayout(), D = RW.G.draft, v = V(), sides = L.narrow ? L.rects.filter((r, i) => i !== D.sel && r.x < v.VW && r.x + r.w > 0).map(clip) : [];
      return [{ x: L.rects[D.sel].x, y: L.rects[D.sel].y - 3, w: L.rects[D.sel].w, h: L.rects[D.sel].h + 3 }, ...sides, L.help, L.kb, L.re, L.bar, L.lock].filter(Boolean); },
    pause: () => RW.pauseLayout().rects,
    over: () => { const L = RW.endLayout(); return [...L.rects, L.share, L.text, { x: L.x, y: L.y, w: L.w, h: L.h }]; },      // the panel too: it must not leave the view
    win: () => { const L = RW.endLayout(); return [...L.rects, L.share, L.text, { x: L.x, y: L.y, w: L.w, h: L.h }]; },
    changes: () => { const L = RW.changesLayout(); return [L.back, L.up, L.down]; },
    music: () => RW.playerLayout().items,
  };
  // what is wrong with a screen's rects: outside the view, or too small for a finger
  const judge = name => { const v = V(), bad = []; for (const r of rects[name]()) {
      if (r.x < -0.5 || r.y < -0.5 || r.x + r.w > v.VW + 0.5 || r.y + r.h > v.VH + 0.5) bad.push('outside: ' + [r.x, r.y, r.w, r.h].map(Math.round).join(','));
      else if (Math.min(r.w, r.h) * v.SCALE < %d) bad.push('small: ' + Math.round(r.w) + 'x' + Math.round(r.h) + (r.id ? ' ' + r.id : '')); }
    return bad.slice(0, 4).join('; '); };
  const run = () => { RW.start(31, { hero: 'pip' }); const G = RW.G, P = G.P; G.tut.step = 9; G.dir.calm = 1e9; G.dir.ti = 99; P.inv = 1e9; P.keys = 9; G.banner = null; return G; };
  const css = (vx, vy) => { const r = document.getElementById('game').getBoundingClientRect(), v = V(); return [r.left + vx * r.width / v.VW, r.top + vy * r.height / v.VH]; };
  const mid = r => css(r.x + r.w / 2, r.y + r.h / 2);
  return { rects, judge, run, css, mid, V };
})();
""" % TAP_CSS


def check(name, ok, info=""):
    global failed
    failed = failed or not ok
    out.append(("PASS " if ok else "FAIL ") + name + (f" ({info})" if info != "" else ""))


def launch(driver):
    named = os.environ.get("CHROMIUM")
    caches = [Path.home() / "Library/Caches/ms-playwright", Path.home() / ".cache/ms-playwright"]
    cached = sorted((p for c in caches if c.is_dir() for pattern in
                     ("chromium-*/chrome-mac*/*.app/Contents/MacOS/*", "chromium-*/chrome-linux*/chrome")
                     for p in c.glob(pattern)), reverse=True)
    system = ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", shutil.which("chromium"),
              shutil.which("google-chrome"), shutil.which("chromium-browser")]
    for exe in [named] if named else [None, *map(str, cached), *system]:
        if exe is not None and not Path(exe).is_file():
            continue
        try:
            return driver.chromium.launch(headless=True, executable_path=exe)
        except Exception:               # this one is missing or will not start: try the next
            continue
    return None


def until(page, js, ms=5000):
    """Wait until the expression is true in the page; False if it never is."""
    try:
        page.wait_for_function(js, timeout=ms)
        return True
    except Exception:
        return False


def tap(page, js_rect):
    """Tap the middle of a rect that the page computes (in view pixels)."""
    x, y = page.evaluate(f"__dev.mid({js_rect})")
    page.touchscreen.tap(x, y)


def device(browser, url, name, w, h, shots):
    ctx = browser.new_context(viewport={"width": w, "height": h}, has_touch=True, is_mobile=True, device_scale_factor=2)
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    # a new address on every run: a copy from before a deploy would otherwise be what is checked
    page.goto(url + ("&" if "?" in url else "?") + f"intro=0&run={int(time.time())}", wait_until="domcontentloaded")
    until(page, "window.RW && RW.App.mode === 'title'")
    page.evaluate(PRE)
    shot = (lambda n: page.screenshot(path=str(Path(shots) / f"{name.replace(' ', '-')}-{n}.png"))) if shots else (lambda n: None)

    v = page.evaluate("__dev.V()")
    box = page.evaluate("(() => { const r = document.getElementById('game').getBoundingClientRect(); return [r.width, r.height]; })()")
    check(f"{name}: a whole-number scale of at least two, and the view fills the screen",
          v["SCALE"] >= 2 and v["SCALE"] == int(v["SCALE"]) and 0 <= box[0] - w < v["SCALE"] and 0 <= box[1] - h < v["SCALE"],
          f"view {v['VW']}x{v['VH']} at {v['SCALE']}, canvas {box[0]:.0f}x{box[1]:.0f} on {w}x{h}")

    # every screen: what can be tapped is inside the view and large enough
    screens = {
        "title": "RW.toTitle()",
        "prep": "RW.toTitle(); RW.App.mode = 'prep'; RW.App.prep.i = 0",
        "deck": "RW.toTitle(); RW.App.prep.i = 0; RW.App.deck.cur = 0; RW.App.mode = 'deck'",
        "play": "__dev.run()",
        "draft": "(() => { const G = __dev.run(); RW.openDraft(G.sealed[0]); })()",
        "pause": "__dev.run(); RW.App.mode = 'pause'; RW.App.sel = 0",
        "over": "(() => { const G = __dev.run(); G.P.inv = 0; RW.hurtPlayer(99); })()",
        # a win after a daily's practice at Stakes: three rows, a Stakes row and the longest line under the headline
        "win": "(() => { const G = __dev.run(); G.stakes = 2; G.daily = { day: 33, practice: true }; RW.Save.data.daily = [{ day: 33, hero: 'pip', won: false, floor: 2, time: 500, rooms: 9 }]; G.won = true; G.endT = 9; })()",
        "changes": "RW.toTitle(); RW.App.changes.y = 0; RW.App.mode = 'changes'",
        "music": "RW.toTitle(); RW.openPlayer()",
    }
    wrong = []
    for sname, js in screens.items():
        page.evaluate(js)
        if sname in ("over", "win"):
            until(page, f"RW.App.mode === '{sname}'", 8000)
        page.wait_for_timeout(250)
        bad = page.evaluate(f"__dev.judge('{sname}')")
        if bad:
            wrong.append(f"{sname}: {bad}")
        if sname == "music":            # its second page too
            page.evaluate("RW.Player.page = 1"); page.wait_for_timeout(120)
            bad = page.evaluate("__dev.judge('music')")
            if bad:
                wrong.append(f"sounds: {bad}")
            page.evaluate("RW.closePlayer && RW.closePlayer()")
        shot(sname)
    check(f"{name}: on every screen what a finger taps is inside the view and at least {TAP_CSS} CSS px", not wrong, " | ".join(wrong)[:400])

    # the draft's card: whole, and large enough to read (four cards too)
    three = page.evaluate("""(() => { const G = __dev.run(); RW.openDraft(G.sealed[0]); const three = RW.draftLayout().rects[G.draft.sel]; RW.closeDraft();
        RW.openDraft(G.sealed[0]); const c = G.draft.cards[0]; c.type = 'maproom'; c.want = [1, 1, 1, 1]; RW.refreshCard(c, G.draft.cx, G.draft.cy, G.draft.entry); RW.chooseCard(0); return three; })()""")
    until(page, "RW.G.rooms.length === 2 && RW.G.rooms[1].reveal >= 1")       # a Map Room, once it stands, deals four cards
    card = page.evaluate("""(() => { const G = RW.G, three = %s; RW.openDraft(G.sealed[0]); const n = G.draft.cards.length, four = RW.draftLayout().rects[G.draft.sel], v = __dev.V(); RW.closeDraft();
        const inside = r => r.x >= 0 && r.y - 3 >= 0 && r.x + r.w <= v.VW && r.y + r.h <= v.VH;
        return { three, four, n, ok: inside(three) && inside(four) }; })()""" % json.dumps(three))
    check(f"{name}: the draft's card is whole in the view and large enough to read, with three cards and with four",
          card["ok"] and card["n"] == 4 and min(card["three"]["w"], card["four"]["w"]) >= 93 and min(card["three"]["h"], card["four"]["h"]) >= 124,
          f"{card['three']['w']:.0f}x{card['three']['h']:.0f} and {card['four']['w']:.0f}x{card['four']['h']:.0f}")

    # a run by touch
    page.evaluate("RW.toTitle()"); page.wait_for_timeout(500)
    page.touchscreen.tap(w / 2, h * 0.45)
    on_prep = until(page, "RW.App.mode === 'prep'")
    page.wait_for_timeout(500)
    tap(page, "RW.prepLayout('pip').start")      # the line that says: tap here to start
    in_run = until(page, "RW.App.mode === 'play'")
    check(f"{name}: a tap on the title leads to the hero screen and a tap there into a run", on_prep and in_run, page.evaluate("RW.App.mode"))
    page.evaluate("(() => { const G = RW.G; G.tut.step = 9; G.dir.calm = 1e9; G.dir.ti = 99; G.P.inv = 1e9; G.P.keys = 9; window.__x0 = G.P.x; })()")
    # a finger down on the left, dragged to the right: the delver walks
    cdp = ctx.new_cdp_session(page)
    x0, y0 = w * 0.25, h * 0.7
    cdp.send("Input.dispatchTouchEvent", {"type": "touchStart", "touchPoints": [{"x": x0, "y": y0}]})
    for i in range(1, 6):
        cdp.send("Input.dispatchTouchEvent", {"type": "touchMove", "touchPoints": [{"x": x0 + i * 12, "y": y0}]})
    page.wait_for_timeout(700)
    cdp.send("Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": []})
    moved = page.evaluate("RW.G.P.x - window.__x0")
    check(f"{name}: a drag walks the delver", moved > 15, f"{moved:.0f} px")
    # a card built by a tap
    rooms = page.evaluate("(() => { RW.openDraft(RW.G.sealed[0]); return RW.G.rooms.length; })()")
    page.wait_for_timeout(700)
    tap(page, "RW.draftLayout().rects[RW.G.draft.sel]")
    built = until(page, f"RW.App.mode === 'play' && RW.G.rooms.length === {rooms + 1}")
    check(f"{name}: a tap on the draft's card builds the room", built, page.evaluate("RW.App.mode + ' ' + RW.G.rooms.length"))
    # pause by the mark, resume by its row
    page.wait_for_timeout(300)
    tap(page, "RW.pauseMark()")
    paused = until(page, "RW.App.mode === 'pause'")
    page.wait_for_timeout(500)
    tap(page, "RW.pauseLayout().rects[0]")
    resumed = until(page, "RW.App.mode === 'play'")
    check(f"{name}: the pause mark pauses and a tap on Resume resumes", paused and resumed, page.evaluate("RW.App.mode"))
    # the phone is turned while the run goes on
    before = page.evaluate("({ t: RW.G.tRun, rooms: RW.G.rooms.length, seed: RW.G.seed })")
    page.set_viewport_size({"width": h, "height": w}); page.wait_for_timeout(600)
    after = page.evaluate("({ t: RW.G.tRun, rooms: RW.G.rooms.length, seed: RW.G.seed, mode: RW.App.mode, v: __dev.V() })")
    turned = after["v"]
    check(f"{name}: turning the phone keeps the run, at a whole-number scale again",
          after["seed"] == before["seed"] and after["rooms"] == before["rooms"] and after["t"] > before["t"] and after["mode"] == "play"
          and turned["SCALE"] >= 2 and turned["SCALE"] == int(turned["SCALE"]) and (turned["VW"] > turned["VH"]) == (h > w),
          f"view {turned['VW']}x{turned['VH']} at {turned['SCALE']}, {after['rooms']} rooms, {after['t'] - before['t']:.1f} s on")
    page.set_viewport_size({"width": w, "height": h}); page.wait_for_timeout(400)
    # the end screen, and back to the title by a tap
    page.evaluate("RW.G.P.inv = 0; RW.G.P.shield = 0; RW.hurtPlayer(99)")
    over = until(page, "RW.App.mode === 'over'", 8000)
    page.wait_for_timeout(700)
    tap(page, "(() => { const L = RW.endLayout(); return L.rects[L.rects.length - 1]; })()")
    home = until(page, "RW.App.mode === 'title'")
    check(f"{name}: the run ends on the end screen, and a tap on its last row leads back to the title", over and home, page.evaluate("RW.App.mode"))
    check(f"{name}: no errors on the page", not errors, "; ".join(errors)[:300])
    ctx.close()


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--url", default=URL)
    ap.add_argument("--shots", default="", help="a directory for a screenshot of every screen on every device")
    args = ap.parse_args()
    if args.shots:
        Path(args.shots).mkdir(parents=True, exist_ok=True)
    with sync_playwright() as driver:
        browser = launch(driver)
        if browser is None:
            print("SKIP device checks: no Chromium found (set CHROMIUM, or run: uv run --with playwright playwright install chromium)")
            return 0
        try:
            for name, w, h in DEVICES:
                try:
                    device(browser, args.url, name, w, h, args.shots)
                except Exception as e:      # one device must not hide the others
                    check(f"{name}: the checks ran through", False, str(e).split("\n")[0][:300])
        finally:
            browser.close()
    print("\n".join(out))
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
