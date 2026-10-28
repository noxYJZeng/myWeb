#!/usr/bin/env python3
"""Build the static photo page from assets/polaroids/collection.json."""

from datetime import datetime
from html import escape
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def build():
    photos = json.loads((ROOT / "assets/polaroids/collection.json").read_text())
    if not photos or len({photo["id"] for photo in photos}) != len(photos):
        raise ValueError("The collection must contain unique photographs.")
    # Months are the supplied capture precision; keep the existing order for ties.
    photos = sorted(photos, key=lambda photo: photo.get("date") or "9999-12")
    places = {}
    figures = []
    for index, photo in enumerate(photos):
        key = photo.get("place_key", "")
        if key and photo.get("place"):
            places[key] = escape(photo["place"])
        # Captions use one consistent format, including older titled scans.
        caption = photo.get("place") or "Location not recorded"
        label = [caption]
        time_markup = ""
        if photo.get("date"):
            stamp = datetime.strptime(photo["date"], "%Y-%m")
            short_date = stamp.strftime("%b %Y").upper()
            long_date = stamp.strftime("%B %Y")
            label.append(long_date)
            time_markup = f'<time datetime="{photo["date"]}" data-label="{escape(long_date, quote=True)}">{escape(short_date)}</time>'
        accessible_label = escape("Enlarge " + ", ".join(label), quote=True)
        stem = f'assets/polaroids/{photo["id"]}'
        for suffix in (".webp", "-large.webp"):
            if not (ROOT / (stem + suffix)).is_file():
                raise ValueError(f"Missing photograph: {stem + suffix}")
        loading = "eager" if index < 3 else "lazy"
        rotation = photo.get("rotation", 0)
        if rotation not in (0, 180):
            raise ValueError(f"Unsupported display rotation: {photo['id']}")
        orientation = f' data-rotation="{rotation}"' if rotation else ""
        figures.append(f'''
          <figure class="photo-entry" data-place="{escape(key, quote=True)}" data-photo-id="{escape(photo['id'], quote=True)}"{orientation}>
            <a class="photo-open" href="{stem}-large.webp"
              aria-label="{accessible_label}"
              aria-haspopup="dialog">
              <img src="{stem}.webp" width="{photo['width']}" height="{photo['height']}"
                alt="{escape(photo['alt'], quote=True)}" loading="{loading}" decoding="async" />
            </a>
            <figcaption>
              <div><span class="photo-place">{escape(caption)}</span></div>
              {time_markup}
            </figcaption>
          </figure>''')
    # Match the equirectangular world silhouette with actual city coordinates.
    # Keep labels in a visible index: nearby cities should not cover each other.
    map_coordinates = {
        "seattle": (47.6062, -122.3321), "bellevue": (47.6101, -122.2015),
        "new-york": (40.7128, -74.0060), "atlanta": (33.7490, -84.3880),
        "xianyang": (34.3296, 108.7088), "xian": (34.3416, 108.9398),
        "yuncheng": (35.0264, 111.0075), "taiyuan": (37.8706, 112.5489),
        "luoyang": (34.6197, 112.4540), "beijing": (39.9042, 116.4074),
        "shenyang": (41.8057, 123.4315), "changsha": (28.2282, 112.9388),
        "xiangtan": (27.8297, 112.9440),
    }
    pins, cities = [], []
    for key, place in sorted(places.items(), key=lambda item: item[1].casefold()):
        lat, lon = map_coordinates[key]
        x, y = (lon + 180) / 360 * 100, (90 - lat) / 180 * 100
        coordinates = f'{abs(lat):.2f}°N · {abs(lon):.2f}°{"W" if lon < 0 else "E"}'
        pins.append(f'<span class="location-map-dot" data-place="{key}" style="--pin-x:{x:.4f}%;--pin-y:{y:.4f}%"><span class="location-pin-label">{place}</span></span>')
        count = sum(photo["place_key"] == key for photo in photos)
        cities.append(f'''<button class="photo-filter location-city" type="button" data-place="{key}" data-label="{place}" data-coordinates="{coordinates}" aria-label="{place}, {count} photographs" aria-pressed="false">
          <span class="location-city-name">{place}</span>
        </button>''')
    dates = sorted(photo["date"] for photo in photos if photo.get("date"))
    archive_note = f"{len(places):02} PLACES"
    if len(dates) == len(photos):
        start = datetime.strptime(dates[0], "%Y-%m")
        end = datetime.strptime(dates[-1], "%Y-%m")
        first = start.strftime("%b %Y" if start.year != end.year else "%b").upper()
        last = end.strftime("%b %Y").upper()
        archive_note = f"{first} — {last}<br />{archive_note}"
    page = f'''<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#050b08" />
    <meta name="description" content="Nox Zeng’s instant film photo archive." />
    <title>Polaroids — Nox Zeng</title>
    <link rel="icon" type="image/svg+xml" href="assets/butterfly.svg" />
    <link rel="stylesheet" href="style.css" />
    <link rel="stylesheet" href="gallery.css" />
    <script src="js/cursor.js" defer></script>
    <script src="js/selection.js" defer></script>
    <script src="js/album.js" defer></script>
    <script src="js/gallery.js" defer></script>
    <script src="js/album-ambient.js" defer></script>
    <script src="js/analytics.js" defer data-production-only></script>
  </head>
  <body class="gallery-page" id="top">
    <canvas class="album-backdrop" data-album-art="night" width="480" height="300" aria-hidden="true"></canvas>
    <a class="skip-link" href="#photos">Skip to photographs</a>
    <header class="photo-header">
      <a class="wordmark" href="index.html#home" data-gallery-return aria-label="Nox Zeng, home">
        <img src="assets/butterfly.svg" width="32" height="26" alt="" />
        <span>nox<span class="wordmark-dot">.sys</span></span>
      </a>
      <a class="photo-return" href="index.html#offscreen" data-gallery-return><span aria-hidden="true">←</span> Back to Interests</a>
    </header>
    <main class="photo-main" id="photos">
      <div class="photo-heading">
        <div>
          <p class="eyebrow">PHOTO ALBUM</p>
          <h1>Polaroids</h1>
        </div>
        <div class="photo-archive-note">{archive_note}</div>
      </div>
      <aside class="photo-toolbar map-dock" aria-label="Photo locations" data-open="false" hidden>
        <button class="map-toggle" type="button" aria-label="Open photo map" aria-expanded="false" aria-controls="location-scroll" aria-haspopup="dialog">
          <svg viewBox="0 0 48 54" shape-rendering="crispEdges" aria-hidden="true">
            <path fill="#343d2d" d="M7 4h33v3h4v7h-4v29h3v7h-4v3H7v-3H3v-7h4V14H3V7h4z"/>
            <path fill="#a58b58" d="M5 6h36v7H5zm0 37h36v7H5z"/><path fill="#d4bb80" d="M7 6h32v2H7zm0 37h32v2H7z"/>
            <path fill="#d3c79c" d="M10 13h28v30H10z"/><path fill="#e8d9ab" d="M10 13h4v30h-4z"/><path fill="#a99a70" d="M34 13h4v30h-4z"/>
            <path fill="#67845a" d="M16 20h7v3h5v-3h5v10h-5v5h-5v-6h-7z"/><path fill="#42614b" d="M16 20h7v3h-4v4h-3zm12 10h5v3h-5z"/>
            <path fill="#b56e4c" d="M25 23h4v4h-4z"/><path fill="#f2dfac" d="M26 22h2v2h-2z"/>
          </svg>
          <span>MAP</span><span class="map-toggle-place">All places</span>
        </button>
        <div class="location-scroll" id="location-scroll" role="dialog" aria-label="Photo map" hidden>
          <div class="scroll-rod scroll-rod--top" aria-hidden="true"></div>
          <section class="location-picker" aria-label="Filter photographs by city">
          <div class="location-map-header">
            <p class="location-status" role="status"><span class="location-current">All places</span><span class="location-current-count">{len(photos)}</span><span>photos</span></p>
            <div class="location-map-actions"><button class="photo-filter location-reset" type="button" data-place="all" data-label="All places" aria-label="Show all photographs" aria-pressed="true">
              <svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true"><path d="M1 1h5v5H1zm9 0h5v5h-5zM1 10h5v5H1zm9 0h5v5h-5z"/></svg><span>All</span>
            </button><button class="map-dismiss" type="button" aria-label="Close photo map"><svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true"><path d="M2 2h2v2H2zm2 2h2v2H4zm2 2h4v4H6zm4-2h2v2h-2zm2-2h2v2h-2zM4 10h2v2H4zm-2 2h2v2H2zm8-2h2v2h-2zm2 2h2v2h-2z"/></svg></button></div>
          </div>
          <div class="location-map-surface">
            <div class="location-world">
              <div class="location-map-window" data-zoomed="false"><div class="location-map-sheet" aria-hidden="true">
                <img class="location-map-art" src="assets/location-world-map.svg" alt="" width="480" height="240" />
                {''.join(pins)}
              </div></div>
              <p class="location-map-caption" aria-hidden="true"><span class="location-map-name">World map</span><span class="location-coordinates">{len(places)} places</span></p>
              <div class="map-zoom" role="group" aria-label="Map zoom"><button type="button" data-map-zoom="-1" aria-label="Zoom out" disabled>−</button><output class="map-zoom-level" aria-live="polite">1×</output><button type="button" data-map-zoom="1" aria-label="Zoom in">+</button><span class="map-drag-hint">Zoom to explore</span></div>
            </div>
            <div class="location-city-index" role="group" aria-label="Choose a city">{''.join(cities)}</div>
          </div>
          </section>
          <div class="scroll-rod scroll-rod--bottom" aria-hidden="true"></div>
        </div>
      </aside>
      <section class="album" aria-label="A pixel photo album with one photograph per page">
        <canvas class="album-margin-art album-margin-art--moths" data-album-art="moths" width="224" height="200" aria-hidden="true"></canvas>
        <canvas class="album-margin-art album-margin-art--waxwing" data-album-art="waxwing" width="210" height="156" aria-hidden="true"></canvas>
        <div class="album-scene">
          <canvas id="album-canvas" width="360" height="330" aria-hidden="true" hidden></canvas>
          <div class="album-pages">{''.join(figures)}</div>
          <button class="album-cover" type="button" aria-label="Open photo album" hidden>
            <span>Open album <span aria-hidden="true">↗</span></span>
          </button>
          <button class="album-arrow album-previous" type="button" aria-label="Previous page" hidden>
            <svg viewBox="0 0 28 24" shape-rendering="crispEdges" aria-hidden="true"><path d="M12 2h12v2h2v18H12v-2H8v-2H4v-2H2v-2h2v-2h4v-2h4V2zm2 2v8h-4v2H6v2h4v2h4v2h10V4H14z"/><path class="album-turn-rule" d="M17 7h5v2h-5zm0 4h5v2h-5zm0 4h5v2h-5z"/></svg>
            <span>PREV</span><i aria-hidden="true"></i>
          </button>
          <button class="album-arrow album-next" type="button" aria-label="Open album" hidden>
            <svg viewBox="0 0 28 24" shape-rendering="crispEdges" aria-hidden="true"><g transform="translate(28 0) scale(-1 1)"><path d="M12 2h12v2h2v18H12v-2H8v-2H4v-2H2v-2h2v-2h4v-2h4V2zm2 2v8h-4v2H6v2h4v2h4v2h10V4H14z"/><path class="album-turn-rule" d="M17 7h5v2h-5zm0 4h5v2h-5zm0 4h5v2h-5z"/></g></svg>
            <span>NEXT</span><i aria-hidden="true"></i>
          </button>
        </div>
        <div class="album-controls" hidden>
          <button class="album-close" type="button" hidden>Close album</button>
          <p class="album-status" role="status" aria-live="polite">Cover · {len(photos)} photographs</p>
        </div>
      </section>
    </main>
    <footer class="photo-footer">
      <span>© <span id="year">2026</span> Nox Zeng</span>
      <a href="#top">BACK TO TOP ↑</a>
    </footer>
    <dialog class="photo-viewer" aria-labelledby="viewer-title" aria-describedby="viewer-date">
      <div class="viewer-top">
        <div>
          <h2 class="viewer-title" id="viewer-title"></h2>
          <time class="viewer-date" id="viewer-date"></time>
        </div>
        <button class="viewer-control viewer-close" type="button" aria-label="Close photograph" autofocus>
          <svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true"><path d="M2 1h2v2h2v2h2V3h2V1h2v2h-2v2H8v2H6v2H4v2H2V9h2V7h2V5H4V3H2zm6 6h2v2h2v2h-2V9H8z" /></svg>
        </button>
      </div>
      <div class="viewer-stage"><img class="viewer-image" alt="" decoding="async" /></div>
      <div class="viewer-bottom">
        <span class="viewer-count" aria-live="polite"></span>
      </div>
    </dialog>
  </body>
</html>
'''
    (ROOT / "polaroids.html").write_text(page, encoding="utf-8")
    print(f"Built polaroids.html: {len(photos)} photographs, {len(places)} locations.")


if __name__ == "__main__":
    build()
