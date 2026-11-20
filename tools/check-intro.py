"""Intro cinematic checks, driven through a real browser with Playwright.

    uv run --with playwright tools/check-intro.py [--url URL] [--headed] [--shots DIR]

Checks index.html next to this folder, or a deployed copy with --url https://example.net/.
Prints one PASS/FAIL/SKIP line per check and exits non-zero on a failure. It presses real keys and
clicks, because a browser only lets a film start with sound from a real gesture.

The browser: the one named by CHROMIUM or PIXEL_CAT_CHROMIUM, else Playwright's own Chromium
(`uv run --with playwright playwright install chromium`), else a Chromium that an earlier Playwright
left in its cache, else Chrome or Chromium on this machine. With none of them every check is skipped.
"""

import argparse
import os
import shutil
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

GAME = Path(__file__).resolve().parents[1]
READY = "domcontentloaded"      # the game boots in its inline script; "load" would also wait for the film
URL = GAME.joinpath("index.html").as_uri()
out, failed = [], False


def check(name, ok, info=""):
    global failed
    failed = failed or not ok
    out.append(("PASS " if ok else "FAIL ") + name + (f" ({info})" if info != "" else ""))


def state(page):
    return page.evaluate(
        """() => ({ mode: RW.App.mode, intro: RW.Intro.state, gate: RW.Intro.gate, ok: RW.Intro.ok,
            t: RW.Intro.el.currentTime, paused: RW.Intro.el.paused,
            shown: getComputedStyle(RW.Intro.el).display !== 'none' && +getComputedStyle(RW.Intro.el).opacity > 0.5,
            dur: RW.Intro.el.duration, w: RW.Intro.el.videoWidth, h: RW.Intro.el.videoHeight })"""
    )


def until(page, test, ms=4000):
    """Poll the page until test(state) holds; return the last state."""
    waited, s = 0, state(page)
    while not test(s) and waited < ms:
        page.wait_for_timeout(100)
        waited += 100
        s = state(page)
    return s


def launch(driver, headed):
    """Start Chromium from the first place that has one; None if there is none."""
    named = os.environ.get("CHROMIUM") or os.environ.get("PIXEL_CAT_CHROMIUM")
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
            return driver.chromium.launch(headless=not headed, executable_path=exe)
        except Exception:               # this one is missing or will not start: try the next
            continue
    return None


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default=URL, help="the game's address (default: the local index.html)")
    parser.add_argument("--headed", action="store_true")
    parser.add_argument("--shots", type=Path, help="save a screenshot of each stage here")
    args = parser.parse_args()
    url = args.url
    with sync_playwright() as driver:
        browser = launch(driver, args.headed)
        if browser is None:
            print("SKIP intro checks: no Chromium for Playwright (uv run --with playwright playwright install chromium)")
            sys.exit(0)
        page = browser.new_context(viewport={"width": 1600, "height": 900}).new_page()
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))

        def shot(name):
            if args.shots:
                args.shots.mkdir(parents=True, exist_ok=True)
                page.screenshot(path=str(args.shots / f"{name}.png"))

        # ---- ?intro=0 never plays it
        page.goto(url + "?intro=0", wait_until=READY)
        broken = "!!RW.Intro.el.error"        # the browser gave up on the file: it is missing, or not H.264
        s = until(page, lambda s: s["ok"] or page.evaluate(broken), 10000)
        check("?intro=0 boots to the title", s["mode"] == "title" and s["intro"] == "off", s["mode"])
        if not s["ok"]:
            if page.evaluate(broken):
                out.append("SKIP this browser cannot load intro.mp4 (missing file or no H.264): the game plays without it")
                check("without the film the game still starts on the title", s["mode"] == "title")
            else:
                check("the film's metadata arrives within 10 seconds", False, "still loading")
            print("\n".join(out)); browser.close(); sys.exit(1 if failed else 0)
        check("the film is 30 seconds of 1600x900", abs(s["dur"] - 30) < 0.2 and (s["w"], s["h"]) == (1600, 900),
              f"{s['dur']:.2f}s {s['w']}x{s['h']}")

        # ---- every boot plays the film before the title
        page.evaluate("localStorage.removeItem(RW.Save.KEY)")
        page.goto(url, wait_until=READY)
        s = until(page, lambda s: s["intro"] == "play" or s["gate"])
        check("the game boots into the intro", s["mode"] == "intro", s["mode"])
        if s["gate"]:                   # the browser wants a gesture before sound: the prompt is up
            shot("1-gate")
            check("held for a first key, the film is not playing yet", s["paused"] and not s["shown"])
            page.keyboard.press("x")    # any key will do
            s = until(page, lambda s: s["intro"] == "play")
        check("the film plays", s["intro"] == "play" and not s["paused"], s["intro"])
        s = until(page, lambda s: s["t"] > 1.0)
        check("it is on screen and running", s["shown"] and s["t"] > 1.0, f"t={s['t']:.2f}")
        check("it plays with sound", page.evaluate("!RW.Intro.el.muted && RW.Intro.el.volume > 0.5"))
        check("the title music waits", page.evaluate("RW.Snd.track") is None, page.evaluate("RW.Snd.track"))
        shot("2-playing")

        # ---- M mutes it, like the rest of the game
        page.keyboard.press("m"); page.wait_for_timeout(150)
        check("M mutes the film", page.evaluate("RW.Intro.el.muted"))
        page.keyboard.press("m"); page.wait_for_timeout(150)
        check("M unmutes it", page.evaluate("!RW.Intro.el.muted"))

        # ---- skip
        page.keyboard.press("Enter")
        s = until(page, lambda s: s["mode"] == "title")
        check("Enter skips to the title", s["mode"] == "title" and s["intro"] == "off" and s["paused"], s["mode"])
        check("the title music starts", page.evaluate("RW.Snd.track") == "title", page.evaluate("RW.Snd.track"))
        check("nothing about the intro is stored", page.evaluate(
            "!document.cookie && !Object.keys(localStorage).some(k => /intro/i.test(k + localStorage.getItem(k)))"))
        s = until(page, lambda s: not s["shown"], 1500)
        page.wait_for_timeout(500)
        check("the film leaves the screen", not s["shown"] and page.evaluate("RW.Intro.el.style.display") == "none")
        shot("3-title")

        # ---- the next boot plays it again, also for a save written by the version that kept a flag
        page.evaluate("localStorage.setItem(RW.Save.KEY, JSON.stringify(Object.assign({}, RW.Save.data, { intro: 1 })))")
        page.goto(url, wait_until=READY)
        s = until(page, lambda s: s["intro"] == "play" or s["gate"])
        check("the second boot plays it again", s["mode"] == "intro", s["mode"])
        if s["gate"]:
            page.keyboard.press("x"); s = until(page, lambda s: s["intro"] == "play")
        page.wait_for_timeout(800)
        page.keyboard.press("Enter")
        s = until(page, lambda s: s["mode"] == "title")
        page.wait_for_timeout(500)

        # ---- the title offers it again
        page.keyboard.press("i")
        s = until(page, lambda s: s["intro"] == "play" or s["gate"])
        if s["gate"]:
            page.keyboard.press("x"); s = until(page, lambda s: s["intro"] == "play")
        check("I on the title plays it again", s["mode"] == "intro" and s["intro"] == "play", s["intro"])
        page.wait_for_timeout(800)
        page.keyboard.press("Escape")
        s = until(page, lambda s: s["mode"] == "title")
        check("Esc skips too", s["mode"] == "title")

        # ---- a click on the corner label, and a click to skip
        page.wait_for_timeout(500)
        box = page.evaluate("(() => { const r = document.getElementById('game').getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; })()")
        page.mouse.move(box["x"] + 30, box["y"] + box["h"] - 20); page.wait_for_timeout(100)
        page.mouse.click(box["x"] + 30, box["y"] + box["h"] - 20)
        s = until(page, lambda s: s["intro"] == "play" or s["gate"])
        if s["gate"]:
            page.mouse.click(box["x"] + 400, box["y"] + 300); s = until(page, lambda s: s["intro"] == "play")
        check("a click on the INTRO label plays it", s["mode"] == "intro" and s["intro"] == "play", s["mode"] + "/" + s["intro"])
        page.wait_for_timeout(900)
        page.mouse.click(box["x"] + 500, box["y"] + 300)
        s = until(page, lambda s: s["mode"] == "title")
        check("a click skips", s["mode"] == "title")

        # ---- it ends by itself on the title
        page.evaluate("RW.Intro.begin()")
        s = until(page, lambda s: s["intro"] == "play" or s["gate"])
        if s["gate"]:
            page.keyboard.press("x"); s = until(page, lambda s: s["intro"] == "play")
        page.evaluate("RW.Intro.el.currentTime = 28.6")
        s = until(page, lambda s: s["mode"] == "title", 6000)
        check("the film ends on the title by itself", s["mode"] == "title" and s["intro"] == "off", s["mode"])

        # ---- leaving the intro any other way puts the film away
        page.evaluate("RW.Intro.begin()")
        s = until(page, lambda s: s["intro"] == "play" or s["gate"])
        page.evaluate("RW.start(5)")
        page.wait_for_timeout(300)
        s = state(page)
        check("starting a run by test hook stops the film", s["mode"] == "play" and s["intro"] == "off" and s["paused"], s["mode"] + "/" + s["intro"])
        page.keyboard.press("x"); page.wait_for_timeout(400)
        check("and a later key does not bring it back", state(page)["paused"] and state(page)["intro"] == "off")
        page.evaluate("RW.toTitle()")
        page.wait_for_timeout(500)

        # ---- a missing film is skipped quietly
        page.evaluate("RW.Intro.load('no-such-film.mp4'); RW.Intro.begin()")
        s = until(page, lambda s: s["mode"] == "title", 9000)
        check("a missing film falls back to the title", s["mode"] == "title" and not s["ok"], s["mode"])
        page.wait_for_timeout(500)      # the title ignores input for its first moments
        page.keyboard.press("Enter")
        page.wait_for_timeout(1200)
        check("and the game starts as usual", page.evaluate("RW.App.mode") in ("prep", "play"), page.evaluate("RW.App.mode"))

        check("no page errors", not errors, "; ".join(errors)[:200])
        browser.close()
    print("\n".join(out))
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
