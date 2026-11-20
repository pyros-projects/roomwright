"""Generate or edit one image with a gpt-image deployment on Azure.

    uv run --no-project intro/tools/imagegen.py PROMPT_FILE OUT.png [--ref IMAGE ...]
        [--size 1536x1024] [--quality high] [--background opaque|transparent]

With --ref the request goes to the edits endpoint and the references steer the result.
The endpoint and the key come from an env file with AZURE_API_BASE and AZURE_API_KEY: intro/.env
(ignored by git), or the file named by INTRO_ENV. The key is never printed. Standard library only.
"""

import argparse
import base64
import json
import os
import sys
import time
import urllib.error
import urllib.request
import uuid
from pathlib import Path

ENV_FILE = Path(os.environ.get("INTRO_ENV", Path(__file__).resolve().parents[1] / ".env"))
DEPLOYMENT = os.environ.get("INTRO_IMAGE_MODEL", "gpt-image-2.5-flare")
API_VERSION = os.environ.get("INTRO_API_VERSION", "2025-04-01-preview")


def env():
    values = {}
    for line in ENV_FILE.read_text().splitlines():
        if "=" in line and not line.lstrip().startswith("#"):
            name, value = line.split("=", 1)
            values[name.strip()] = value.strip().strip("\"'")
    return values["AZURE_API_BASE"].rstrip("/"), values["AZURE_API_KEY"]


def multipart(fields, files):
    boundary = uuid.uuid4().hex
    body = bytearray()
    for name, value in fields.items():
        body += f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{value}\r\n'.encode()
    for name, path in files:
        body += (
            f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"; '
            f'filename="{path.name}"\r\nContent-Type: image/png\r\n\r\n'
        ).encode()
        body += path.read_bytes() + b"\r\n"
    body += f"--{boundary}--\r\n".encode()
    return bytes(body), f"multipart/form-data; boundary={boundary}"


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("prompt", type=Path)
    parser.add_argument("out", type=Path)
    parser.add_argument("--ref", type=Path, action="append", default=[])
    parser.add_argument("--size", default="1536x1024")
    parser.add_argument("--quality", default="high")
    parser.add_argument("--background", default="opaque")
    args = parser.parse_args()

    base, key = env()
    prompt = args.prompt.read_text().strip()
    fields = {
        "prompt": prompt,
        "size": args.size,
        "quality": args.quality,
        "background": args.background,
        "n": 1,
    }
    kind = "edits" if args.ref else "generations"
    url = f"{base}/openai/deployments/{DEPLOYMENT}/images/{kind}?api-version={API_VERSION}"
    if args.ref:
        data, content_type = multipart(fields, [("image[]", p) for p in args.ref])
    else:
        data, content_type = json.dumps(fields).encode(), "application/json"
    request = urllib.request.Request(
        url, data=data, headers={"api-key": key, "Content-Type": content_type}
    )
    started = time.time()
    for attempt in range(4):
        try:
            with urllib.request.urlopen(request, timeout=600) as response:
                payload = json.load(response)
            break
        except urllib.error.HTTPError as error:
            detail = error.read().decode(errors="replace")[:800]
            if error.code not in (429, 500, 502, 503, 504) or attempt == 3:
                sys.exit(f"HTTP {error.code}: {detail}")
        except (urllib.error.URLError, TimeoutError, ConnectionError) as error:
            if attempt == 3:
                sys.exit(f"network error: {error}")
        time.sleep(4 * (attempt + 1))  # a dropped connection or a busy deployment: try again
    item = payload["data"][0]
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_bytes(base64.b64decode(item["b64_json"]))
    usage = payload.get("usage", {})
    print(json.dumps({
        "out": str(args.out),
        "endpoint": kind,
        "seconds": round(time.time() - started, 1),
        "tokens": usage.get("total_tokens"),
    }))


if __name__ == "__main__":
    main()
