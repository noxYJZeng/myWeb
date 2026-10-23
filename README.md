# Nox's personal website

Static HTML, CSS, and a terminal-style pixel habitat showing nine butterflies and moths
at a time, with twelve designs available through the filters. The greeting and the eight introductions from the original site type and delete
in the same large hero heading, repeating as one loop. The first word is white,
and shared prefixes stay visible while only the changed suffix is retyped. The closing section has
separate pixel animations for books, instant photography, painting, historic
sites, and a waxwing that looks around, preens, stretches its wings, hops along
its branch, and picks at berries. No package installation or build is needed to run the site.

An opening of about five seconds shows a pixel match striking its box and lighting
a flickering flame against black. After a brief low-light view of the homepage,
the flame grows into a warm flare that quickly illuminates the whole page and
brings the hero forward. The light then settles into the site's normal black and
green colors as the headline types. Exposure changes across the full screen.
Section links, reduced motion, and browsers without JavaScript go straight to the
site. Escape or Tab skips the opening; a timeout also ensures it cannot block entry.

```sh
python3 -m http.server 8001 --directory .
```

The website entry point is `index.html`. Keep its sibling `style.css`, `js`, and
`assets` directories together when hosting or downloading the site.

## Single-file preview

Some HTML preview panels only receive the selected file, so relative stylesheet,
script, font, and image URLs cannot load. Use `preview.html` in those panels, or
download it and open it directly in a browser. It contains the same site with
all resources embedded, including the project images and pixel animation.

Regenerate it after editing `index.html`, `style.css`, `js`, or the assets:

```sh
python3 scripts/export_preview.py
```

Edit the original source files; `preview.html` is generated. The site uses system
fonts and has no external CDN dependencies.

Animations run automatically, respect reduced-motion preferences, and stop
updating off screen or in a background tab. The complete greeting and
all page text remain available without JavaScript.

The pixel camera uses a straight-on view of the open SX-70 folding silhouette:
chrome frame, brown leather, black bellows, and a raised viewfinder. The film slot
and print share the camera's center; paper emerges inside the slot, behind its
upper roller and in front of the lower casing. Exterior reference:
[SX-70 project photograph](https://github.com/udut7/Polaroid-SX70-RPi/blob/master/SX70_Raspberry_Pi.jpg).
The reference photograph is not bundled with the site.
