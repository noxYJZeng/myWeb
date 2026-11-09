#!/usr/bin/env python3
"""Build lossless WebP copies sized for the project cards; keep originals."""

from pathlib import Path

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
SOURCES = ("claim2code.jpg", "lbm.png", "nasa.png", "healthtracker.png", "atlsfw.png")


def build():
    output = ROOT / "assets" / "project-thumbs"
    output.mkdir(exist_ok=True)
    for name in SOURCES:
        source = ROOT / "assets" / name
        target = output / (source.stem + ".webp")
        with Image.open(source) as original:
            picture = ImageOps.exif_transpose(original)
            picture.thumbnail((640, 640), Image.Resampling.LANCZOS)
            picture.save(target, format="WEBP", lossless=True, method=6, exact=True,
                         icc_profile=original.info.get("icc_profile", b""))
        target.chmod(0o644)
        print(f"{target.relative_to(ROOT)}: {target.stat().st_size:,} bytes")


if __name__ == "__main__":
    build()
