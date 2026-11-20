"""Show a plate enlarged with a coordinate grid, to read native pixel positions for the story file.

    uv run --no-project --with pillow intro/tools/grid.py PLATE.png OUT.png [SCALE]
"""
import sys
from PIL import Image, ImageDraw

plate = Image.open(sys.argv[1]).convert("RGB")
scale = int(sys.argv[3]) if len(sys.argv) > 3 else 4
big = plate.resize((plate.width * scale, plate.height * scale), Image.Resampling.NEAREST)
pen = ImageDraw.Draw(big, "RGBA")
for x in range(0, plate.width, 10):
    strong = x % 50 == 0
    pen.line((x * scale, 0, x * scale, big.height), fill=(255, 255, 255, 150 if strong else 45))
    if strong:
        pen.text((x * scale + 2, 2), str(x), fill=(255, 255, 0, 255))
for y in range(0, plate.height, 10):
    strong = y % 50 == 0
    pen.line((0, y * scale, big.width, y * scale), fill=(255, 255, 255, 150 if strong else 45))
    if strong:
        pen.text((2, y * scale + 2), str(y), fill=(255, 255, 0, 255))
big.save(sys.argv[2])
