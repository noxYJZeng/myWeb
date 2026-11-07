# Nox's personal website

Static HTML, CSS, and six overlapping specimen terminals containing nine pixel
butterflies and moths, with twelve designs available through the filters. The greeting, eight introductions from the original site, and an AI research introduction type and delete
in the same large hero heading, repeating as one loop. The first word is white,
and shared prefixes stay visible while only the changed suffix is retyped. The closing section has
separate pixel animations for books, instant photography, painting, historic
sites, and a waxwing that looks around, preens, stretches its wings, hops along
its branch, and picks at berries. No package installation or build is needed to run the site.

The six terminals have different sizes, muted graphite, sage, blue, violet, and
brass edges, mounting marks, and specimen labels. Each holds one or two original
pixel butterflies. Their wings move slowly through six poses and briefly flutter
when approached. The windows appear in a short stepped cascade as the homepage
emerges after the green flame clears. Title bars raise windows on focus or activation and support dragging or
arrow-key movement within the collage. Body touch gestures retain page scrolling.
The single filter row brings an existing species window forward, or mounts one
of the three additional designs in the large central window. All restores the
original arrangement. Nine specimens remain visible across the six windows.
The six cached canvas buffers redraw at up to 24 fps, pause outside the viewport
or in a hidden tab, and settle into open-wing poses with reduced motion.

The book, SX-70, and watercolor brush also respond to hovering their row, clicking
the artwork, or focusing and activating its keyboard control. The controls are
transparent native buttons over the existing objects, without additional visible
button panels. Each action finishes before it can be replayed. Automatic actions
are spaced apart: the book turns one double-sided page around its binding; the
camera trips its shutter, ejects an opaque print through the centered slot, and
develops the image in pixel cells; the brush dips into a small paint pan and paints
directly on the sketchbook. Finished photographs and watercolor remain visible.
Replaying the camera moves the previous print out below the frame; replaying the
brush re-wets the finished butterfly instead of clearing the paper. Active actions
repaint at up to 24 fps, while the existing waxwing keeps its original cadence.
Actions pause outside the viewport and while the document is hidden. Reduced
motion displays settled artwork and hides the decorative replay controls.

Motion references were Floor796's independent scene loops, Melonking's object
interactions, and PixelPlanets' pixel shading. The existing artwork and drawings
remain original to this site; no external sprites or animation library are bundled.

The homepage also has a scroll choreography in `js/scroll.js` and `scroll.css`.
The greeting and terminal move at different depths as the hero leaves. The paper
index and its reading area arrive with a short vertical movement. The six sheets
open into a fan as the section enters. The contact papers spread as their section
passes through the viewport, and Interests pair text entrances with a slower
artwork layer. A low-resolution night background
changes its dark green tone by section. The existing navigation stays at the top;
on phones its wordmark scrolls away while the navigation row remains available.
Scrolling keeps the browser's native wheel, touch, anchor, and history behavior.

Entrances run once with temporary Web Animations rather than permanently hidden
CSS states. Focusing a link or jumping to a section settles its entrance; hiding
the tab cancels active entrances. Reduced motion keeps the finished composition
and removes scroll depth and reveal effects. The scroll layer waits for the green
match opening to finish, and its background redraws only when the view changes.
No new runtime dependencies are needed.

An opening of about six seconds shows a pixel match striking its box and lighting
a flickering green flame against black. Green light stays around the match. The match,
box, and flame clear before the homepage develops from the same near-black
green as its background. Exposure and contrast rise gradually as the headline
types, without a yellow or white screen between the two scenes.
Section links, reduced motion, and browsers without JavaScript go straight to the
site. Escape or Tab skips the opening; a timeout also ensures it cannot block entry.

```sh
python3 -m http.server 8001 --directory .
```

The website entry point is `index.html`. Keep its sibling `style.css`, `js`, and
`assets` directories together when hosting or downloading the site.

The live site is https://noxyjzeng.github.io/myWeb/. GitHub Pages publishes the
repository root from `main`; `.nojekyll` keeps deployment static. Before pushing
site changes, run `python3 scripts/export_preview.py` to rebuild the gallery and
previews. This also versions hosted CSS and script URLs from their file contents
so visitors receive updated assets after a release. Commit the editable site
files, generated pages, and required assets together.

## Private visitor analytics

The production homepage and photo album use Cloudflare Web Analytics with the
public website token from the owner's account in `js/analytics.js`. Emptying
`siteToken` disables collection. There is no public visitor counter or
analytics dashboard on this website.

To configure it for another Cloudflare account:

1. Sign in to [Cloudflare](https://dash.cloudflare.com/) with your own account.
2. Open **Web Analytics**, select **Add a site**, and enter
   `noxyjzeng.github.io` as the hostname. Select the matching hostname, then
   **Done**. GitHub Pages stays the hosting provider; no DNS change is needed.
3. In **Manage site**, copy the JavaScript snippet. Its `data-cf-beacon`
   attribute contains a `token`: this is the public website identifier,
   **not** an account API token. Put that value in `siteToken`.
4. Run `python3 scripts/export_preview.py`, commit, and push to `main`.
5. Visit the live website, then check **Web Analytics** in your Cloudflare
   dashboard. Data may take a few minutes to appear.

Only HTTPS visits to `/myWeb/`, `/myWeb/index.html`, and
`/myWeb/polaroids.html` on the production hostname load the beacon. Local
development, portable files, and `preview/` are excluded. The exporter omits
scripts marked `data-production-only` from every portable preview. Section
navigation does not create extra page views, and a blocked analytics script
does not prevent the website from working. View analytics by signing in to
Cloudflare; the public site token provides no dashboard access. Statistics
start after activation, and browsers that block the beacon will be missing
from the totals.

## Single-file preview

Some HTML preview panels only receive the selected file, so relative stylesheet,
script, font, and image URLs cannot load. Use `preview.html` in those panels, or
download it and open it directly in a browser. It contains the same site with
all resources embedded, including the project images and pixel animation.
Preview images are resized and compressed for file viewers. Hosted photographs
keep their full-size assets. Regenerating previews requires Pillow
(`python3 -m pip install Pillow`).
The homepage preview also contains the Polaroid gallery, so its entry works
when the preview panel only has this file. `polaroids-preview.html` is a separate
portable preview of the gallery.
The generated `preview/` folder contains the same standalone pages with relative
navigation for GitHub Pages. Publishing this directory makes the review version
available at `https://noxyjzeng.github.io/myWeb/preview/`.

Regenerate it after editing `index.html`, `style.css`, `js`, or the assets:

```sh
python3 scripts/export_preview.py
```

Edit the original source files; `preview.html` is generated. The site uses system
fonts. Its appearance and interactions have no external CDN dependencies;
optional production analytics loads separately.

## Polaroid gallery

`polaroids.html` opens a black, pixel-drawn photo album. Its cover and individual
double-sided leaves turn around the binding and rest on the left; each page
holds one photograph. Clicking the left or right paper turns to the previous or
next page; clicking the photograph still enlarges it. Buttons, arrow keys, and
horizontal touch swipes also turn the pages. Reduced-motion preferences
skip the turning animation. Photographs retain their original colored borders
and proportions. The same native image and caption remain on each leaf during
movement and at rest; photographs never pass through the low-resolution canvas.
The browser animates the 3D rotation continuously, with no frame-rate cap or
fade-out of the paper at the end of a turn.
The location filter lives in a small pixel scroll at the edge of the screen.
Hovering or clicking unrolls it, including a tap on touch screens. Moving the
mouse outside rolls it back up, even after clicking or using its controls. It
overlays the page without shifting the album. Choosing a city rolls it back up
and opens the filtered album. Escape, the close control, or an outside click
also dismisses it; double-clicking the map or blank paper closes it as well.
The open scroll includes every city in a visible index and
a world map with three zoom levels and bounded pointer/touch dragging.
The recognizable continent silhouettes use public-domain Natural Earth 1:110m
land geometry (https://www.naturalearthdata.com/), without national borders or
country names. Pixel waves, grass, mountains, forests, and a tiny sail add game
terrain while retaining the coastline. Decorative pixel pins use real latitude
and longitude and retain a readable size at every zoom level. Selecting or
hovering a city in the index highlights its larger pin and city label; pins do
not act as buttons. All restores the complete
collection. Nearby city labels stay separate in the index.
Clicking a print opens a full-screen
view; Escape closes it and returns focus to the print. Without JavaScript, all
photographs and the links to larger images remain usable.
The stepped pixel page keys sit outside the book on desktop and below it on
small screens. Three patterned butterflies and a waxwing animate behind the
book in the margins. The bird hops, turns its head, pecks, preens, and stretches
its wings around a stable ground anchor. Head and wing poses ease between
actions, and the entire bird never mirrors or jumps across its canvas.
A pixel night background adds distant ground,
plants, stars, and fireflies at the edges. The artwork pauses off screen, in a
hidden tab, or while a print is enlarged; reduced motion keeps it still.

Photo metadata lives in `assets/polaroids/collection.json`. Each entry refers to
a display image, `<id>.webp`, and a larger image, `<id>-large.webp`, in the same
directory. The metadata includes the original print number, location, month,
display dimensions, and descriptive alt text. Location, capture month, and print
number can be omitted. Captions and enlarged-photo headings consistently show
only the location and capture date; stored titles and print numbers stay out of
the visible captions.
All thirty photographs have supplied locations and capture months, spanning
May 2025 to October 2026 across thirteen places. Both the collection and builder
sort by capture month, preserving the existing order within the same month.
The May 2026 sequence starts with Atlanta. A photograph's optional `rotation`
metadata corrects its display direction in the album and enlarged view.
The New York photograph is included once despite its duplicate upload.
The Tree branches and Light on pavement scans were taken in Atlanta in March
2026, Portrait in September 2026, and Garden skeleton in October 2026.
Scanner filenames remain separate from confirmed capture dates. To add a photograph, add these
two image sizes and its metadata, then run `python3 scripts/export_preview.py`.
This rebuilds the gallery and both portable previews. To build just the hosted
gallery, run `python3 scripts/build_gallery.py`.

Animations run automatically, respect reduced-motion preferences, and stop
updating off screen or in a background tab. The static greeting, core content,
and navigation remain available without JavaScript.

The pixel camera uses a straight-on view of the open SX-70 folding silhouette:
chrome frame, brown leather, black bellows, and a raised viewfinder. The film slot
and print share the camera's center; paper emerges inside the slot, behind its
upper roller and in front of the lower casing. Exterior reference:
[SX-70 project photograph](https://github.com/udut7/Polaroid-SX70-RPi/blob/master/SX70_Raspberry_Pi.jpg).
The reference photograph is not bundled with the site.

The biography includes the Georgia Tech B.S. and M.S. in Computer Science,
current RSI research, and experience with LLM agents and reinforcement learning
at ZTE. It records a first-author paper under review at NAACL and the current
team-matching stage for Google's 2027 SWE internship.

Projects retain three subject groups: **ML & AI** (Claim2Code and LBM), **SWE**
(NASA Explorer, HealthTracker, ATLSFW), and **C & Systems** (Pacman GBA).
`js/projects.js` builds a 3D paper index from these six readable HTML notes;
`project-gallery.css` is scoped to the enhanced homepage component. The papers
fan diagonally into depth, open as the section enters, and respond to pointer
movement. Hovering a sheet pulls it forward and switches the full introduction
below it. Descriptions and project links stay in an untransformed reading area.

Each sheet has its own original SVG material in `assets/project-papers/`: ivory
cotton, lavender graph paper, sage laid stock, rose fiber paper, mint vellum, and
kraft board. Different torn outlines, loose fibers, grain, ruling, and creases
make the surfaces distinct. Backing planes at different depths give them varied
thickness, with contour shadows rather than rectangular frames. Existing project
artwork is printed into each face; the Claim2Code image remains its real UI.
Each sheet composites as a whole in its own 3D context, with the selected sheet
in front, so neighboring edges cannot cut through its face during transitions.
The stage allows paper and shadows to overflow its layout box, and the fan scales
to fit narrower screens instead of clipping its outer sheets. The heading, hint,
GitHub link, and counter form one compact group at the upper left of the diagonal
fan. The active introduction occupies the lower-right space, with the subject
catalog below the left side. Phones use a single reading column without a fixed
blank area beneath short introductions.

A grouped catalog provides native tabs with arrow-key and Home/End navigation.
Touch users can tap sheets or catalog names and swipe horizontally through the
stack; vertical page scrolling and pinch zoom retain browser behavior. Reduced
motion removes the fan transitions, pointer drift, and introduction animation.
The component has no perpetual animation loop. Without JavaScript or supported
3D transforms, all six grouped notes and links remain readable, using the earlier
fiber-edged paper material in `assets/project-rag-paper.svg`.

The visual reference is the user-provided screenshot of
[Jacob How's index](https://www.jcubhow.com/). The live site was blocked by this
environment's destination policy, so its animation was not inspected live and
none of its code or assets are bundled. The implementation uses CSS perspective
and native browser APIs, with no new runtime library.

The [Claim2Code project](https://github.com/noxYJZeng/claim2code) is marked
completed and describes paper-to-code verification, cited evidence, mismatch
explanations, and optional reference tests. Its note links to the actual LoRA
verification screenshot in the project repository. `assets/gba-pixel.svg` is an
original console illustration rather than a screenshot of the game.

Contact uses three visibly offset sheets: ivory lace, deckled sage paper,
and smoky rose writing paper with a folded corner. The lower stocks have
locally drawn fibers and relief grain, with faint ruling and crease highlights. A green and brass pixel fountain pen rests
across the lower right edge. Its diagonal is drawn on an integer grid, with
stepped edges and a small fixed palette. GitHub and LinkedIn use accessible icon links from
[Bootstrap Icons](https://icons.getbootstrap.com/), licensed under MIT (see
`assets/bootstrap-icons-LICENSE.txt`). The email stays a direct text link.
The navigation includes all four sections. Small section labels use Intro,
Selected Projects, Find Me, and Know More About Me.
The butterfly habitat is a frameless cluster of overlapping terminal windows
that double as living specimen cases. Projects use a fan of
different torn paper stocks; Contact and Interests keep their own tactile
materials. The page keeps direct section titles.
Interests use four full-width rows, with personal text on the left and pixel
artwork on the right, including on narrow screens. A clothbound book, film strip,
sketchbook, and folded field note hold the artwork. The sketchbook has no inner
picture frame: a detailed pixel brush lays translucent watercolor washes into
butterfly wings, with pigment grain, pooled edges, and overlapping color. It
lifts between strokes and extends beyond the paper. Reduced motion shows the
completed painting. The film strip is level. All four scenes remain automatic
and responsive.
The waxwing has a transparent canvas spanning the page: flowering branches,
berries, and drifting fireflies surround its original movement sequence. Its
canvas resizes with the layout and has no frame, label, or filled backdrop.
Green borders remain on selected elements. There is no skills section.

Mouse users see a flip-top pixel lighter with an enamel body, a metal lid,
windshield vents, and a small butterfly engraving. Hovering a clickable control
opens the lid and lights an amber flame. Selecting text turns it green. Keyboard
navigation and touch input retain their normal behavior. The three native SVG
cursor states provide a fallback, and reduced motion uses a steady flame.

Text selection uses the original native green background (`--green`) and dark
text (`--bg`) throughout the site. There are no custom selection overlays or
per-surface color inversions. Browser selection and clipboard behavior stay
native. The lighter cursor keeps its green flame while text is selected.
