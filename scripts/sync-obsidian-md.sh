#!/usr/bin/env bash
# Recreate hardlinks content/modules/*/{en,es}.md → same inode as *.mdx
# so Obsidian can edit the live iAguide lessons. Safe to re-run.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)/content/modules"
python3 - "$ROOT" <<'PY'
import os, sys
from pathlib import Path
root = Path(sys.argv[1])
made = 0
for mdx in root.glob("*/*.mdx"):
    md = mdx.with_suffix(".md")
    if md.exists():
        try:
            if md.stat().st_ino == mdx.stat().st_ino:
                continue
        except OSError:
            pass
        if md.is_symlink() or md.stat().st_nlink == 1:
            md.unlink()
        else:
            continue
    os.link(mdx, md)
    made += 1
print(f"linked {made} new aliases under {root}")
PY
