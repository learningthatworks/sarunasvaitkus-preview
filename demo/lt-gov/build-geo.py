#!/usr/bin/env python3
"""Build demo/lt-gov/data/education-geo.json: outlines of the 60 municipalities.

Source: geoBoundaries LTU ADM2 (gbOpen, simplified), built from OpenStreetMap.
Licence: Open Database License 1.0. Credit "© OpenStreetMap contributors".
The output is a derived database under the same licence.

Usage: python3 build-geo.py path/to/geoBoundaries-LTU-ADM2_simplified.geojson
Download: https://media.githubusercontent.com/media/wmgeolab/geoBoundaries/main/releaseData/gbOpen/LTU/ADM2/geoBoundaries-LTU-ADM2_simplified.geojson

What this file changes: coordinates are projected to a flat 1000-unit-wide
drawing, snapped to whole units and very small islands are dropped. Names are
matched to the ids used in education.json.
"""
from __future__ import annotations

import json
import math
import re
import sys
import unicodedata
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "data" / "education-geo.json"
EDU = ROOT / "data" / "education.json"
WIDTH = 1000
MIN_RING_AREA = 12  # square drawing units; the largest ring of a shape is always kept


def norm(s: str) -> str:
    s = unicodedata.normalize("NFKD", s.lower())
    s = "".join(c for c in s if not unicodedata.combining(c))
    return re.sub(r"\s+", " ", s).strip()


def area(ring):
    return abs(sum(a[0] * b[1] - b[0] * a[1] for a, b in zip(ring, ring[1:] + ring[:1]))) / 2


def clean(ring):
    out = []
    for p in ring:
        if not out or out[-1] != p:
            out.append(p)
    if len(out) > 1 and out[0] == out[-1]:
        out.pop()
    keep = []
    n = len(out)
    for i, p in enumerate(out):
        a, b = out[i - 1], out[(i + 1) % n]
        if (p[0] - a[0]) * (b[1] - a[1]) != (p[1] - a[1]) * (b[0] - a[0]):
            keep.append(p)
    return keep


def main(src: str) -> int:
    geo = json.loads(Path(src).read_text(encoding="utf-8"))
    edu = json.loads(EDU.read_text(encoding="utf-8"))["municipalities"]
    ids = {}
    for m in edu:
        ids[norm(m["name"]["lt"])] = m["id"]
        ids[norm(m["name"]["en"])] = m["id"]

    feats = []
    for f in geo["features"]:
        mid = ids.get(norm(f["properties"]["shapeName"]))
        if not mid:
            print("no match:", f["properties"]["shapeName"], file=sys.stderr)
            return 1
        g = f["geometry"]
        polys = g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]
        feats.append((mid, [poly[0] for poly in polys]))  # outer rings only
    if len({m for m, _ in feats}) != len(edu):
        print("municipality count mismatch", file=sys.stderr)
        return 1

    pts = [p for _, rings in feats for r in rings for p in r]
    lon0, lon1 = min(p[0] for p in pts), max(p[0] for p in pts)
    lat0, lat1 = min(p[1] for p in pts), max(p[1] for p in pts)
    k = math.cos(math.radians((lat0 + lat1) / 2))
    scale = WIDTH / ((lon1 - lon0) * k)
    height = round((lat1 - lat0) * scale)

    def proj(p):
        return (round((p[0] - lon0) * k * scale), round((lat1 - p[1]) * scale))

    shapes = []
    for mid, rings in sorted(feats):
        done = [clean([proj(p) for p in r]) for r in rings]
        done = [r for r in done if len(r) >= 3]
        done.sort(key=area, reverse=True)
        done = [r for i, r in enumerate(done) if i == 0 or area(r) >= MIN_RING_AREA]
        d = "".join("M" + " ".join(f"{x},{y}" for x, y in r) + "Z" for r in done)
        big = done[0]
        a = sum(p[0] * q[1] - q[0] * p[1] for p, q in zip(big, big[1:] + big[:1])) / 2
        cx = sum((p[0] + q[0]) * (p[0] * q[1] - q[0] * p[1]) for p, q in zip(big, big[1:] + big[:1])) / (6 * a)
        cy = sum((p[1] + q[1]) * (p[0] * q[1] - q[0] * p[1]) for p, q in zip(big, big[1:] + big[:1])) / (6 * a)
        shapes.append({"id": mid, "d": d, "c": [round(cx), round(cy)]})

    out = {
        "schema_version": "3.1.0",
        "updated_at": date.today().isoformat(),
        "attribution": {"en": "Boundaries: © OpenStreetMap contributors, via geoBoundaries", "lt": "Ribos: © „OpenStreetMap“ dalyviai, per „geoBoundaries“"},
        "licence": "ODbL-1.0",
        "url": "https://www.openstreetmap.org/copyright",
        "source": "https://www.geoboundaries.org/",
        "size": [WIDTH, height],
        "shapes": shapes,
    }
    OUT.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"{OUT.name}: {len(shapes)} shapes, {OUT.stat().st_size} bytes, {WIDTH}x{height}")
    return 0


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(__doc__)
        sys.exit(2)
    sys.exit(main(sys.argv[1]))
