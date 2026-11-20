"""Cut one prop out of the model sheet, or harden the edge of a converted sprite.

    uv run --no-project --with pillow intro/tools/cut_sprite.py cut SHEET.png OUT.png LEFT TOP RIGHT BOTTOM
    uv run --no-project --with pillow intro/tools/cut_sprite.py edge SPRITE.png...

cut   crops the box and turns the flat sheet background transparent.
edge  makes every pixel fully opaque or fully transparent, so a sprite has a hard pixel edge.
"""
import sys
from PIL import Image

mode = sys.argv[1]
if mode == "cut":
    sheet, out = sys.argv[2], sys.argv[3]
    box = tuple(int(v) for v in sys.argv[4:8])
    image = Image.open(sheet).convert("RGBA")
    back = image.getpixel((8, 8))[:3]
    crop = image.crop(box)
    pixels = crop.load()
    for y in range(crop.height):
        for x in range(crop.width):
            r, g, b, _ = pixels[x, y]
            if abs(r - back[0]) + abs(g - back[1]) + abs(b - back[2]) < 110:
                pixels[x, y] = (0, 0, 0, 0)
    crop = crop.crop(crop.getchannel("A").getbbox())
    crop.save(out)
    print(out, crop.size)
else:
    for path in sys.argv[2:]:
        image = Image.open(path).convert("RGBA")
        image.putalpha(image.getchannel("A").point(lambda a: 255 if a >= 200 else 0))
        image = image.crop(image.getchannel("A").getbbox())
        image.save(path)
        print(path, image.size)
