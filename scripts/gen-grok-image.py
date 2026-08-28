#!/usr/bin/env python3
"""Generate a production lesson illustration with xAI Grok Imagine.

The provider uses Hermes' existing xAI OAuth/API-key resolution. The output is
normalized to a real PNG after generation so the public asset extension cannot
lie about the payload.
"""
from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
import urllib.request
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--slug", required=True, help="lesson slug")
    parser.add_argument("--name", required=True, help="asset basename")
    parser.add_argument("--prompt", required=True, help="complete image prompt")
    parser.add_argument("--aspect-ratio", default="landscape", choices=("landscape", "square", "portrait", "4:3", "3:4", "3:2", "2:3"))
    parser.add_argument("--output-root", default="public/images")
    args = parser.parse_args()

    repo = Path(__file__).resolve().parents[1]
    destination = repo / args.output_root / args.slug / f"{args.name}.png"
    destination.parent.mkdir(parents=True, exist_ok=True)

    hermes_root = Path.home() / ".hermes" / "hermes-agent"
    sys.path.insert(0, str(hermes_root))
    from plugins.image_gen.xai import XAIImageGenProvider  # type: ignore

    provider = XAIImageGenProvider()
    if not provider.is_available():
        raise RuntimeError("xAI image provider is unavailable; check `hermes auth list`.")
    result = provider.generate(args.prompt, aspect_ratio=args.aspect_ratio)
    if not result.get("success"):
        raise RuntimeError(f"xAI generation failed: {result}")

    source = result.get("image")
    if not source:
        raise RuntimeError(f"xAI returned no image path: {result}")
    if str(source).startswith(("http://", "https://")):
        temporary = destination.with_suffix(".source")
        urllib.request.urlretrieve(str(source), temporary)
        source_path = temporary
    else:
        source_path = Path(str(source))
    if not source_path.exists():
        raise RuntimeError(f"xAI returned a missing image path: {source_path}")

    shutil.copy2(source_path, destination)
    magic = destination.read_bytes()[:12]
    if not magic.startswith(b"\\x89PNG\\r\\n\\x1a\\n"):
        converted = destination.with_suffix(".normalized.png")
        subprocess.run(["sips", "-s", "format", "png", str(destination), "--out", str(converted)], check=True, capture_output=True, text=True)
        converted.replace(destination)
    if destination.with_suffix(".source").exists():
        destination.with_suffix(".source").unlink()
    print(destination)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
