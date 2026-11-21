"""Music checks: every track rendered in full by the game's own sequencer, faster than real time.

    uv run --with playwright tools/check-music.py [--url URL]

Checks index.html next to this folder, or a deployed copy with --url https://example.net/.
Prints one PASS/FAIL/SKIP line per check and exits non-zero on a failure.

How: before the game boots, the page gets an AudioContext that renders into memory and a sequencer clock
that this check turns by hand. The game's code then schedules a track in a moment, and the samples are
read back. A track shorter than half a minute is played twice, because a pattern track brings its lead in
on the second pass; a longer one is played once and two bars into its repeat. This reads levels and finds
gaps; it cannot tell whether a piece sounds good.

The browser is found as in tools/check-intro.py. Without a Chromium for Playwright it is skipped.
"""

import argparse
import importlib.util
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent
URL = HERE.parent.joinpath("index.html").as_uri()
_spec = importlib.util.spec_from_file_location("check_intro", HERE / "check-intro.py")
_intro = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_intro)                 # for its launch(): one way to find the browser
out, failed = [], False
QUIET = -50                 # a bar under this level counts as silent
LEVEL = (-48, -35)          # where a track's mean level has to lie, at the default music volume

# Runs before the game's script. The sequencer is the only 50 ms interval in the game.
BEFORE = """(() => {
  const M = window.__music = { now: 0, seconds: 0, ticks: [], ctx: null }, every = window.setInterval;
  window.setInterval = (fn, ms) => ms === 50 ? (M.ticks.push(fn), 0) : every(fn, ms);
  window.AudioContext = function () {
    M.ctx = new OfflineAudioContext(1, Math.ceil(M.seconds * 48000), 48000);
    return new Proxy(M.ctx, { get: (t, k) => k === 'state' ? 'running' : k === 'currentTime' ? M.now : typeof t[k] === 'function' ? t[k].bind(t) : t[k] });
  };
})()"""

# Renders a track and measures it bar by bar. A live start puts the first step 50 ms after a block boundary
# of the audio clock, which is a whole sample; the clock here starts the same way.
RENDER = """async (track) => {
  const M = window.__music, S = RW.Snd, pass = S.secs(track), bar = S.secs(track, 1), bars = Math.round(pass / bar);
  const played = pass < 30 ? 2 * bars : bars + 2;         // in bars
  M.seconds = played * bar + 2; M.now = 0.05;
  let threw = '';
  try {
    RW.manual(true); S.vol.sfx = 0; S.vol.music = 0.6; S.ensure(); S.applyVol(); S.music(null); S.music(track);
    for (; M.now < played * bar; M.now += 0.05) for (const tick of M.ticks) tick();
  } catch (e) { threw = String(e && e.stack || e).slice(0, 300); }
  const x = (await M.ctx.startRendering()).getChannelData(0), rate = 48000, t0 = 0.1;
  const levels = [];                                      // the level of each bar, in dBFS
  let peak = 0, square = 0;
  for (let b = 0; b < played; b++) {
    const i0 = Math.round((t0 + b * bar) * rate), i1 = Math.round((t0 + (b + 1) * bar) * rate);
    let sq = 0; for (let i = i0; i < i1; i++) { sq += x[i] * x[i]; peak = Math.max(peak, Math.abs(x[i])); }
    levels.push(+(10 * Math.log10(sq / (i1 - i0) + 1e-12)).toFixed(1));
    square += sq;
  }
  const db = v => +(20 * Math.log10(v + 1e-9)).toFixed(1);
  return { threw, bars, played, seconds: +pass.toFixed(1), levels, peak: db(peak), level: +(10 * Math.log10(square / (played * bar * rate) + 1e-12)).toFixed(1) };
}"""


def check(name, ok, info=""):
    global failed
    failed = failed or not ok
    out.append(("PASS " if ok else "FAIL ") + name + (f" ({info})" if info != "" else ""))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default=URL, help="the game's address (default: the local index.html)")
    args = parser.parse_args()
    with sync_playwright() as driver:
        browser = _intro.launch(driver, False)
        if browser is None:
            print("SKIP music checks: no Chromium for Playwright (uv run --with playwright playwright install chromium)")
            sys.exit(0)
        page = browser.new_context().new_page()
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.add_init_script(BEFORE)
        page.goto(args.url + "?intro=0", wait_until="domcontentloaded")
        tracks = page.evaluate("RW.Snd.tracks")
        for track in tracks:
            page.goto(args.url + f"?intro=0&track={track}", wait_until="domcontentloaded")      # a new page: one render per context
            r = page.evaluate(RENDER, track)
            what = f"{r['bars']} bars, {r['seconds']} s, {r['played']} bars played"
            check(f"{track}: plays through without an error", not r["threw"], r["threw"] or what)
            # A bar with notes reads -45 dBFS or more. An empty one reads -59 or less even right after a loud bar,
            # whose echo and ringing notes carry into it.
            quiet = [i + 1 for i, level in enumerate(r["levels"]) if level < QUIET]
            check(f"{track}: every bar sounds", not quiet, f"under {QUIET} dBFS: bars {quiet}" if quiet else f"quietest bar {min(r['levels'])} dBFS")
            # The music sits under the sound effects. The mean says so; the peak comes after the compressor and barely moves.
            low, high = LEVEL
            check(f"{track}: the level is in the music's range ({low} to {high} dBFS)", low < r["level"] < high, f"{r['level']} dBFS, peak {r['peak']}")
        check("no page errors", not errors, "; ".join(errors)[:200])
        browser.close()
    print("\n".join(out))
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
