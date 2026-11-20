"""Write story.json for the Roomwright intro: eight shots, 30 seconds, for pixel-cat's film renderer.

    uv run --no-project --with pillow intro/make_story.py

Reads plates/ and sprites/, writes story.json, captions.timing.json and the derived images
(the black frame, the floor-plan base plate and its room cut-outs).

Times inside a shot count from its cut. Cuts fall on whole drawings (12 per second) and on the music:
the soundtrack quotes the game's title theme at 80 bpm, so one beat is 0.75 s and one bar is 3 s.
"""

import json
from collections import Counter
from pathlib import Path

from PIL import Image

HERE = Path(__file__).resolve().parent
W, H, FPS, SCALE = 400, 225, 12, 4
GOLD, WARM, RED, TEAL, WHITE = [255, 215, 110], [255, 170, 70], [255, 70, 100], [120, 255, 240], [255, 250, 235]


def hz(midi):
    return round(440 * 2 ** ((midi - 69) / 12), 2)


def pose(t, x, y, sx=1, sy=1, turn=0, opacity=1):
    return [t, x, y, sx, sy, turn, opacity]


# ------------------------------------------------------------------ derived images
def derived_images():
    Image.new("RGB", (W, H), (0, 0, 0)).save(HERE / "sprites/black.png")
    plan = Image.open(HERE / "plates/06-plan.png").convert("RGB")
    # The painter gave the tiny Pip on the map a blue-grey hood. Put Pip back on model: teal hood,
    # cream tunic, pink cheeks (the game's own palette).
    pixels = plan.load()
    for y in range(PLAN_PIP[1], PLAN_PIP[3]):
        for x in range(PLAN_PIP[0], PLAN_PIP[2]):
            r, g, b = pixels[x, y]
            if b > r + 25 and b > 110:                      # the blues of the hood, by brightness
                light = (r + g + b) / 3
                pixels[x, y] = (143, 240, 214) if light > 175 else (63, 193, 173) if light > 105 else (36, 133, 127)
            elif min(r, g, b) > 200 and b >= r:             # the bluish white of the tunic
                pixels[x, y] = (255, 248, 232)
    for x in (196, 203):
        pixels[x, 111] = (255, 158, 196)
    void = Counter(plan.getdata()).most_common(1)[0][0]
    base = plan.copy()
    for name, box in ROOMS.items():
        plan.crop(box).save(HERE / f"sprites/plan-{name}.png")
        base.paste(void, box)
    base.save(HERE / "plates/06-plan-base.png")
    # the right half of the lock, drawn above the key so its bit slides out of sight behind the seam
    Image.open(HERE / "plates/04-lock.png").convert("RGB").crop(LOCK_COVER).save(HERE / "sprites/lock-cover.png")


# the six rooms that pop into the floor plan, in order: name -> box in the plate (even sizes, so a
# room scaled about its centre lands back on its own pixels)
ROOMS = {
    "ember": (154, 0, 246, 64),
    "fountain": (56, 55, 156, 137),
    "moss": (244, 55, 344, 137),
    "library": (154, 142, 246, 224),
    "frost": (66, 137, 154, 217),
    "vault": (246, 137, 336, 217),
}
ROOM_RING = {"ember": [255, 150, 60], "fountain": [120, 200, 255], "moss": [150, 230, 90],
             "library": [190, 130, 255], "frost": [190, 240, 255], "vault": [255, 220, 90]}
POP = 0.375   # one room every half beat
LOCK_COVER = (282, 60, 340, 156)
PLAN_PIP = (191, 99, 209, 120)   # the tiny Pip in the middle room of the floor plan


# ------------------------------------------------------------------ the eight shots
def shot_room():
    """A close view of Pip by the fire; the camera pulls back to the lonely room and its four doors."""
    return {
        "plate": "plates/01-room.png", "seconds": 4.5,
        "camera": [[0, 199, 110, 1.7], [1.2, 199, 110, 1.7], [4.2, 200, 112, 1.0]],
        "layers": [{"image": "sprites/black.png", "pivot": [0, 0],
                    "pose": [pose(0, 0, 0), pose(0.25, 0, 0), pose(1.4, 0, 0, opacity=0)]}],
        "effects": [
            {"kind": "light", "xy": [199, 98], "radius": [52, 38], "color": WARM, "flicker": 0.3,
             "level": [[0, 0.32], [4.5, 0.32]]},
            {"kind": "particles", "shape": "dot", "box": [194, 90, 204, 98], "velocity": [0, -13], "count": 6,
             "life": 1.5, "color": [255, 210, 110], "alpha": 230, "drift": 2},
        ],
    }


def shot_knock():
    """The sealed door jumps twice. Dust falls, the glow under it flares."""
    knocks = [0.5, 0.67, 1.67, 1.83]
    move, cam, glow, flash = [[0, 0, 0]], [[0, 204, 112, 1.05]], [[0, 0.25]], []
    for t in knocks:
        move += [[t - 0.07, 0, 0], [t, 0, -9], [t + 0.08, 0, 4], [t + 0.16, 0, 0]]
        cam += [[t - 0.07, 204, 112, 1.05], [t, 206, 107, 1.15], [t + 0.08, 202, 114, 1.08], [t + 0.16, 204, 112, 1.05]]
        glow += [[t - 0.07, 0.25], [t, 1.9], [t + 0.3, 0.35]]
        flash.append({"kind": "stroke", "start": t - 0.04, "end": t + 0.2, "points": [[204, 22], [204, 204]],
                      "color": [255, 170, 190], "width": 3, "level": [[t - 0.04, 1], [t + 0.2, 1]]})
    move.sort(); cam.sort(); glow.sort()
    cam.append([3.0, 204, 108, 1.12])
    dust = {"kind": "particles", "shape": "dot", "box": [135, 18, 275, 34], "velocity": [0, 52], "count": 26,
            "life": 1.0, "color": [236, 215, 180], "alpha": 220, "drift": 1}
    return {
        "plate": "plates/02-knock.png", "seconds": 3.0, "camera": cam,
        "deform": {"center": [204, 112], "radius": [118, 118], "move": move},
        "effects": [
            {"kind": "light", "xy": [204, 206], "radius": [150, 26], "color": RED, "level": glow},
            {"kind": "light", "xy": [204, 98], "radius": [22, 24], "color": RED, "level": glow},
            *flash, dict(dust, start=0.5, end=1.5), dict(dust, start=1.67, end=2.8),
        ],
    }


def shot_glints():
    """Five glints fly into Pip's cupped hands and fuse into the key."""
    hands = (197, 181)
    starts = [(-16, 78), (416, 52), (58, 240), (352, 242), (418, 150)]   # none crosses the face
    layers, effects = [], [
        {"kind": "light", "xy": list(hands), "radius": [64, 46], "color": [255, 200, 90], "flicker": 0.12,
         "level": [[0, 0.2], [1.4, 0.5], [1.6, 0.5], [1.7, 1.7], [2.0, 0.75], [3.0, 0.6]]},
    ]
    for i, (x, y) in enumerate(starts):
        leave, land = 0.2 * i, 0.6 + 0.2 * i
        layers.append({"image": "sprites/glint-15.png", "pose": [
            pose(0, x, y, 2.4, 2.4), pose(leave, x, y, 2.4, 2.4), pose(land, *hands, 1.2, 1.2, 200),
            pose(land + 0.09, *hands, 0.4, 0.4, 240, 0)]})
        effects.append({"kind": "particles", "shape": "spark", "start": leave, "end": land, "box": [-3, -3, 3, 3],
                        "velocity": [0, 5], "count": 7, "life": 0.3, "color": [255, 226, 130], "alpha": 235,
                        "path": [[leave, x, y], [land, *hands]]})
        effects.append({"kind": "ring", "start": land, "end": land + 0.3, "xy": list(hands), "radius": [34, 24],
                        "color": GOLD, "width": 2})
    layers.append({"image": "sprites/key-44.png", "sway": [0.55, 0, 1.6, 0, 0, 2.5], "pose": [
        pose(0, 197, 178, 0.1, 0.1, -40, 0), pose(1.55, 197, 178, 0.1, 0.1, -40, 0), pose(1.7, 197, 168, 1.3, 1.3, -14),
        pose(1.92, 197, 160, 1, 1, -8), pose(3.0, 197, 154, 1, 1, -8)]})
    effects += [
        {"kind": "ring", "start": 1.6, "end": 2.15, "xy": [197, 170], "radius": [84, 58], "color": GOLD, "width": 2},
        {"kind": "particles", "shape": "spark", "start": 1.6, "box": [166, 140, 228, 186], "velocity": [0, -22],
         "count": 14, "life": 0.8, "color": [255, 236, 150], "alpha": 235, "drift": 3},
    ]
    return {"plate": "plates/03-glints.png", "seconds": 3.0, "layers": layers, "effects": effects,
            "camera": [[0, 197, 112, 1.0], [3.0, 197, 126, 1.12]]}


def shot_lock():
    """The key flies to the lock, slides in, turns. The red glow turns gold and floods the frame."""
    y = 107                         # keyhole height; the pivot is the tip of the key
    key = {"image": "sprites/key-64.png", "pivot": [0.98, 0.4], "pose": [
        pose(0, 84, y + 34, 2.2, 2.2, 12), pose(0.9, 262, y), pose(1.25, 313, y), pose(1.33, 313, y),
        pose(1.46, 313, y, 1, 0.22), pose(1.58, 313, y), pose(3.0, 313, y)]}
    turned = 1.58
    return {
        "plate": "plates/04-lock.png", "seconds": 3.0,
        "layers": [key, {"image": "sprites/lock-cover.png", "pivot": [0, 0],
                         "pose": [pose(0, LOCK_COVER[0], LOCK_COVER[1]), pose(3.0, LOCK_COVER[0], LOCK_COVER[1])]}],
        "camera": [[0, 200, 112, 1.0], [1.5, 222, 110, 1.07], [turned, 224, 110, 1.12], [1.72, 222, 110, 1.07],
                   [3.0, 232, 110, 1.14]],
        "effects": [
            {"kind": "light", "xy": [279, 108], "radius": [20, 24], "color": RED, "flicker": 0.3, "end": turned,
             "level": [[0, 0.55], [turned, 0.55]]},
            {"kind": "light", "start": turned, "xy": [279, 108], "radius": [96, 76], "color": GOLD,
             "level": [[turned, 0], [turned + 0.06, 1.6], [1.95, 0.9], [2.4, 1.2], [3.0, 1.6]]},
            {"kind": "stroke", "start": turned, "points": [[281, 62], [281, 0]], "color": [255, 232, 150], "width": 7,
             "level": [[turned, 0], [2.0, 1]]},
            {"kind": "stroke", "start": turned, "points": [[281, 152], [281, 225]], "color": [255, 232, 150], "width": 7,
             "level": [[turned, 0], [2.0, 1]]},
            {"kind": "ring", "start": turned, "end": turned + 0.5, "xy": [279, 108], "radius": [70, 70],
             "color": GOLD, "width": 2},
            {"kind": "particles", "shape": "spark", "start": turned, "box": [268, 94, 290, 122], "velocity": [-34, -10],
             "count": 14, "life": 0.7, "color": [255, 236, 150], "alpha": 235, "drift": 2},
            {"kind": "particles", "shape": "spark", "end": 1.25, "box": [-34, -6, -6, 8], "velocity": [-12, 4],
             "count": 10, "life": 0.35, "color": [255, 236, 150], "alpha": 235,
             "path": [[0, 84, y + 34], [0.9, 262, y], [1.25, 313, y]]},
            {"kind": "light", "start": 2.2, "xy": [279, 108], "radius": [470, 330], "color": WHITE,
             "level": [[2.2, 0], [2.75, 3], [2.92, 18], [3.0, 18]]},
        ],
    }


def shot_newroom():
    """Out of the white: the doors stand open and a new room is still assembling itself."""
    drift = {"kind": "particles", "shape": "dot", "count": 9, "life": 1.5, "color": [170, 240, 235], "alpha": 220}
    return {
        "plate": "plates/05-newroom.png", "seconds": 4.5,
        "camera": [[0, 200, 112, 1.0], [4.5, 200, 102, 1.3]],
        "effects": [
            {"kind": "light", "xy": [200, 96], "radius": [100, 62], "color": TEAL, "flicker": 0.15,
             "level": [[0, 0.3], [4.5, 0.36]]},
            dict(drift, box=[40, 12, 130, 170], velocity=[24, 5]),
            dict(drift, box=[270, 12, 360, 170], velocity=[-24, 5]),
            {"kind": "particles", "shape": "spark", "box": [165, 60, 235, 105], "velocity": [0, -9], "count": 8,
             "life": 1.1, "color": [220, 255, 250], "alpha": 220, "drift": 3},
            {"kind": "ring", "start": 0.4, "end": 1.3, "xy": [200, 100], "radius": [190, 130], "color": TEAL, "width": 1},
            {"kind": "light", "end": 2.0, "xy": [200, 100], "radius": [470, 330], "color": WHITE,
             "level": [[0, 18], [0.17, 5], [0.5, 1.5], [1.2, 0.3], [2.0, 0]]},
        ],
    }


def shot_warden():
    """The Warden. A beat of stillness, then it roars: the frame punches in and shakes."""
    roar = 0.5
    shake = [[0, 200, 112, 1.0], [roar - 0.08, 200, 112, 1.0], [roar, 200, 101, 1.15], [roar + 0.08, 204, 98, 1.2],
             [roar + 0.17, 196, 102, 1.16], [roar + 0.25, 203, 99, 1.2], [roar + 0.33, 198, 101, 1.17],
             [roar + 0.5, 200, 100, 1.18], [3.0, 200, 96, 1.27]]
    eye = {"kind": "light", "radius": [34, 26], "color": [255, 90, 50], "flicker": 0.35,
           "level": [[0, 0.15], [roar - 0.08, 0.25], [roar, 1.2], [1.0, 0.6], [3.0, 0.75]]}
    return {
        "plate": "plates/07-warden.png", "seconds": 3.0, "camera": shake,
        "deform": {"center": [200, 98], "radius": [150, 105],
                   "move": [[0, 0, 0], [roar - 0.08, 0, 0], [roar, 0, 6], [roar + 0.1, 0, -2], [roar + 0.25, 0, 3],
                            [roar + 0.5, 0, 0], [1.8, 0, 2], [2.6, 0, 0]]},
        "effects": [
            dict(eye, xy=[155, 62]), dict(eye, xy=[225, 62]),
            {"kind": "light", "xy": [200, 114], "radius": [92, 48], "color": [255, 100, 40], "flicker": 0.25,
             "level": [[0, 0.1], [roar, 0.9], [1.2, 0.45], [3.0, 0.55]]},
            {"kind": "light", "xy": [213, 131], "radius": [24, 24], "color": GOLD, "flicker": 0.2,
             "level": [[0, 0.5], [3.0, 0.7]]},
            {"kind": "particles", "shape": "spark", "box": [10, 110, 390, 225], "velocity": [0, -34], "count": 18,
             "life": 1.4, "color": [255, 160, 70], "alpha": 235, "drift": 4},
        ],
    }


def shot_plan():
    """The answer: room after room pops onto the floor plan while the camera pulls back."""
    layers, effects = [], []
    for i, (name, (x0, y0, x1, y1)) in enumerate(ROOMS.items()):
        t, cx, cy = POP * (i + 1), (x0 + x1) / 2, (y0 + y1) / 2
        layers.append({"image": f"sprites/plan-{name}.png", "pose": [
            pose(0, cx, cy, 0.25, 0.25, 0, 0), pose(t, cx, cy, 0.25, 0.25, 0, 0), pose(t + 0.1, cx, cy, 1.14, 1.14),
            pose(t + 0.24, cx, cy), pose(4.5, cx, cy)]})
        effects.append({"kind": "ring", "start": t, "end": t + 0.4, "xy": [cx, cy], "radius": [62, 48],
                        "color": ROOM_RING[name], "width": 2})
        effects.append({"kind": "light", "start": t, "end": t + 0.5, "xy": [cx, cy], "radius": [56, 44],
                        "color": ROOM_RING[name], "level": [[t, 0], [t + 0.08, 0.7], [t + 0.5, 0]]})
    effects.append({"kind": "light", "xy": [199, 96], "radius": [18, 14], "color": WARM, "flicker": 0.3,
                    "level": [[0, 0.3], [4.5, 0.3]]})
    return {"plate": "plates/06-plan-base.png", "seconds": 4.5, "layers": layers, "effects": effects,
            "camera": [[0, 200, 103, 2.0], [0.3, 200, 103, 2.0], [3.0, 200, 112, 1.0]]}


def shot_title():
    """Pip raises the key. The logo drops in where the title screen will hold it."""
    drop, tag = 1.25, 1.9
    torch = {"kind": "light", "radius": [26, 28], "color": WARM, "flicker": 0.5, "level": [[0, 0.28], [4.5, 0.28]]}
    return {
        "plate": "plates/08-title.png", "seconds": 4.5,
        "camera": [[0, 200, 132, 1.16], [0.9, 200, 112, 1.0]],     # still once the lettering is on screen
        "layers": [
            {"image": "sprites/logo.png", "pivot": [0, 0], "pose": [
                pose(0, 78, -60), pose(1.0, 78, -60), pose(drop, 78, 33), pose(drop + 0.1, 78, 25),
                pose(drop + 0.22, 78, 28), pose(4.5, 78, 28)]},
            {"image": "sprites/tagline.png", "pivot": [0, 0], "pose": [
                pose(0, 148, 69, opacity=0), pose(tag, 148, 69, opacity=0), pose(tag + 0.4, 148, 69), pose(4.5, 148, 69)]},
        ],
        "effects": [
            {"kind": "light", "xy": [217, 140], "radius": [54, 42], "color": GOLD, "flicker": 0.15,
             "level": [[0, 0.5], [drop - 0.05, 0.5], [drop + 0.05, 1.4], [1.8, 0.75], [4.5, 0.75]]},
            dict(torch, xy=[50, 106]), dict(torch, xy=[350, 106]), dict(torch, xy=[102, 118]), dict(torch, xy=[297, 118]),
            {"kind": "particles", "shape": "spark", "box": [198, 118, 238, 160], "velocity": [0, -11], "count": 9,
             "life": 0.9, "color": [255, 240, 170], "alpha": 235, "drift": 3},
            {"kind": "ring", "start": drop, "end": drop + 0.55, "xy": [217, 140], "radius": [150, 100], "color": GOLD,
             "width": 2},
            {"kind": "particles", "shape": "spark", "start": drop + 0.05, "box": [84, 30, 316, 66], "velocity": [0, -5],
             "count": 12, "life": 0.9, "color": [255, 248, 220], "alpha": 235, "drift": 2},
        ],
    }


SHOTS = [("room", shot_room), ("knock", shot_knock), ("glints", shot_glints), ("lock", shot_lock),
         ("newroom", shot_newroom), ("warden", shot_warden), ("plan", shot_plan), ("title", shot_title)]


# ------------------------------------------------------------------ sound
MIN, MAJ = (0, 3, 7), (0, 4, 7)
# (start, seconds, root, triad): the title theme's Am F C G, a tense E under the Warden, then F G G -> C
HARMONY = [(0, 3, 45, MIN), (3, 3, 41, MAJ), (6, 3, 48, MAJ), (9, 3, 43, MAJ), (12, 3, 45, MIN), (15, 3, 41, MAJ),
           (18, 3, 40, None), (21, 1.5, 41, MAJ), (22.5, 1.5, 43, MAJ), (24, 1.5, 43, MAJ), (25.5, 4.5, 48, MAJ)]
LEAD = [(6, 79, 1.5), (7.5, 76, 1.5), (9, 74, 2.7), (12, 76, 1.5), (13.5, 81, 1.5), (15, 77, 1.5), (16.5, 84, 1.5),
        (21, 81, 1.5), (22.5, 83, 1.5), (24, 86, 1.5), (25.5, 88, 3.2)]


def music():
    cues = []
    for start, seconds, root, triad in HARMONY:
        quiet = start < 6
        if triad is None:           # the Warden: no tune, a growl of notes a semitone apart
            cues += [{"at": start, "voice": "tone", "hz": hz(28), "seconds": 3.0, "gain": 0.3},
                     {"at": start + 0.1, "voice": "tone", "hz": hz(41), "seconds": 2.8, "gain": 0.12, "pan": -0.3},
                     {"at": start + 0.1, "voice": "tone", "hz": hz(52), "seconds": 2.8, "gain": 0.1, "pan": 0.3},
                     {"at": start + 0.15, "voice": "tone", "hz": hz(53), "seconds": 2.7, "gain": 0.1, "pan": -0.2}]
            continue
        final = start >= 25.5
        bass = [(start, root, 4.2 if final else min(seconds, 1.6))]
        if seconds >= 3 and not final:
            bass.append((start + 1.5, root + 7, 1.5))
        for at, note, length in bass:          # doubled an octave up so small speakers carry it too
            cues.append({"at": at, "voice": "tone", "hz": hz(note), "seconds": length, "gain": 0.15 if quiet else 0.2})
            cues.append({"at": at, "voice": "tone", "hz": hz(note + 12), "seconds": length, "gain": 0.09 if quiet else 0.12})
        tones = [triad[0], triad[1], triad[2], 12, triad[2], triad[1], triad[2], triad[1]]
        steps = 4 if final else round(seconds / 0.375)
        for i in range(steps):
            cues.append({"at": round(start + i * 0.375, 4), "voice": "bell", "hz": hz(root + 24 + tones[i % 8]),
                         "seconds": 1.6 if final else 0.6, "gain": 0.085 if quiet else 0.12,
                         "pan": -0.35 if i % 2 else 0.35, "echo": 0.28})
    for at, note, seconds in LEAD:
        cues.append({"at": at, "voice": "tone", "hz": hz(note), "seconds": seconds, "gain": 0.17, "pan": 0.1})
        cues.append({"at": at, "voice": "bell", "hz": hz(note), "seconds": 0.9, "gain": 0.09, "pan": 0.1, "echo": 0.3})
    return cues


def foley(cut):
    """Sound cues at seconds from the start of the film; `cut` maps a shot name to its first second."""
    cues = []

    def add(shot, t, voice, pitch, seconds, gain, **more):
        cues.append(dict({"at": round(cut[shot] + t, 4), "voice": voice, "hz": pitch, "seconds": seconds, "gain": gain}, **more))

    for t in (0.9, 1.5, 2.3, 2.9, 3.6, 4.1):                        # the campfire
        add("room", t, "hiss", 900, 0.12, 0.045, pan=0.05)
    for i, t in enumerate((0.5, 0.67, 1.67, 1.83)):                # knock knock
        add("knock", t, "knock", 95, 0.32, 0.62 + 0.08 * (i > 1), to_hz=52, pan=0.12, echo=0.21)
    for t in (0.5, 1.67):
        add("knock", t, "tone", 58, 1.0, 0.13, to_hz=46)
        add("knock", t + 0.25, "hiss", 400, 0.7, 0.05, pan=0.2)
    for i in range(5):                                             # each glint lands a little higher
        add("glints", 0.6 + 0.2 * i, "bell", round(880 * 1.0595 ** (2 * i), 1), 0.4, 0.13, pan=(-0.4, 0.4)[i % 2])
    for i, note in enumerate((72, 76, 79, 84)):                    # the game's own key jingle
        add("glints", 1.6 + 0.07 * i, "bell", hz(note), 0.55, 0.16)
    add("glints", 1.88, "bell", hz(88), 1.2, 0.15, echo=0.3)
    add("lock", 0.05, "hiss", 300, 0.9, 0.08, pan=-0.5)
    add("lock", 1.33, "knock", 900, 0.07, 0.3, to_hz=500, pan=0.3, echo=0.05)
    add("lock", 1.58, "knock", 170, 0.28, 0.58, to_hz=80, pan=0.3)
    add("lock", 1.6, "tone", hz(55), 1.4, 0.13, to_hz=hz(74), pan=0.2)
    for i, note in enumerate((79, 84, 88, 91)):
        add("lock", 1.7 + 0.14 * i, "bell", hz(note), 0.7, 0.09, pan=0.3)
    add("newroom", 0, "hiss", 200, 1.3, 0.17)
    add("newroom", 0.05, "knock", 70, 0.5, 0.42, to_hz=44)
    for i, note in enumerate((67, 72, 76)):                        # the draft chime
        add("newroom", 0.1 + 0.05 * i, "bell", hz(note), 1.1, 0.15)
    add("newroom", 0.9, "hiss", 2400, 3.4, 0.035, pan=-0.1)        # the fountain
    for i, (t, note) in enumerate(((1.4, 96), (2.0, 91), (2.7, 98), (3.4, 93), (3.9, 100))):
        add("newroom", t, "bell", hz(note), 0.5, 0.045, pan=(-0.5, 0.5)[i % 2], echo=0.33)
    add("warden", 0.45, "tone", 110, 1.4, 0.5, to_hz=38)           # the roar
    add("warden", 0.45, "hiss", 180, 1.2, 0.26)
    add("warden", 0.5, "knock", 62, 0.7, 0.75, to_hz=34, echo=0.24)
    add("warden", 1.75, "knock", 60, 0.6, 0.5, to_hz=36, echo=0.24)
    for i, note in enumerate((72, 77, 81, 83, 86, 91)):            # one thud and one rising note per room
        t = POP * (i + 1)
        add("plan", t, "knock", 84, 0.26, 0.36, to_hz=50, pan=(-0.3, 0.3)[i % 2], echo=0.1)
        add("plan", t, "bell", hz(note), 0.8, 0.14, pan=(-0.3, 0.3)[i % 2])
    for i, note in enumerate((60, 67, 72, 76)):                    # arrival
        add("title", 0.02 * i, "bell", hz(note), 2.2, 0.1, pan=(-0.2, 0.2)[i % 2], echo=0.3)
    add("title", 1.25, "knock", 92, 0.45, 0.6, to_hz=44)           # the logo lands
    for i, note in enumerate((72, 76, 79, 84)):
        add("title", 1.27 + 0.02 * i, "bell", hz(note), 2.4, 0.13, pan=(-0.3, 0.3)[i % 2], echo=0.3)
    for i, note in enumerate((79, 84, 88, 91)):                    # the tagline
        add("title", 1.9 + 0.09 * i, "bell", hz(note), 0.9, 0.08, echo=0.3)
    add("title", 2.3, "bell", hz(96), 1.9, 0.07, echo=0.33)
    for cue in cues:                # chimes and air sit a little forward of the thuds
        cue["gain"] = round(cue["gain"] * {"bell": 1.35, "hiss": 1.3}.get(cue["voice"], 1), 3)
    return cues


def main():
    derived_images()
    shots, cut, clock = [], {}, 0.0
    for name, build in SHOTS:
        shot = build()
        cut[name] = clock
        clock += shot["seconds"]
        shots.append(shot)
    cues = sorted(music() + foley(cut), key=lambda cue: cue["at"])
    story = {"size": [W, H], "fps": FPS, "scale": SCALE, "seed": 7, "shots": shots,
             "sound": {"root": 55, "drone": 0.016, "air": 0.05, "cues": cues}}
    (HERE / "story.json").write_text(json.dumps(story, indent=1) + "\n")

    # captions are burned in after the render (build.sh), so camera moves never touch the lettering
    lines = json.loads((HERE / "captions.json").read_text())
    timing = []
    for name, shot in zip(cut, shots):
        if name in lines:
            start = cut[name] + (1.5 if name == "room" else 0.45)
            timing.append({"name": name, "text": lines[name], "image": f"sprites/cap-{name}.png",
                           "from": round(start, 3), "to": round(cut[name] + shot["seconds"] - 0.3, 3)})
    (HERE / "captions.timing.json").write_text(json.dumps(timing, indent=1) + "\n")
    print(json.dumps({"seconds": clock, "shots": len(shots), "cues": len(cues), "cuts": cut}))


if __name__ == "__main__":
    main()
