"""Contact sheet: tile images into one picture for review.

    uv run --no-project --with pillow intro/tools/sheet.py OUT.png COLS CELL_WIDTH IMAGE...
"""
import sys
from PIL import Image

out, cols, width = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
images = [Image.open(p).convert("RGB") for p in sys.argv[4:]]
height = round(width * images[0].height / images[0].width)
rows = -(-len(images) // cols)
sheet = Image.new("RGB", (cols * width, rows * height), "#202020")
resample = Image.Resampling.NEAREST if images[0].width < width else Image.Resampling.LANCZOS
for i, image in enumerate(images):
    sheet.paste(image.resize((width, height), resample), ((i % cols) * width, (i // cols) * height))
sheet.save(out)
print(out, sheet.size)
