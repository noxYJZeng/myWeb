#!/usr/bin/env python3
"""Export compact, portable previews, with no network requests.

Run `python3 scripts/export_preview.py` from any directory. The normal website
keeps its separate, editable source files; preview.html embeds those same files.
"""

import base64
from functools import lru_cache
import hashlib
from html.parser import HTMLParser
import json
import io
import mimetypes
from pathlib import Path
import re
import sys
from urllib.parse import parse_qsl, unquote, urlencode, urlsplit

sys.dont_write_bytecode = True
from build_gallery import build
from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]


def local_path(url):
    """Only bundle existing local files within this checkout."""
    parts = urlsplit(url)
    if parts.scheme or parts.netloc or not parts.path:
        raise ValueError(f"Expected a local resource: {url}")
    path = (ROOT / unquote(parts.path)).resolve()
    if not path.is_relative_to(ROOT) or not path.is_file():
        raise ValueError(f"Missing or unsupported resource: {url}")
    return path


def version_local_assets(filename):
    """Refresh browser caches when a hosted stylesheet or script changes."""
    path = ROOT / filename
    page = path.read_text(encoding="utf-8")

    def version(match):
        url = match.group(2)
        parts = urlsplit(url)
        if parts.scheme or parts.netloc:
            return match.group(0)
        digest = hashlib.sha256(local_path(url).read_bytes()).hexdigest()[:12]
        query = [(key, value) for key, value in parse_qsl(parts.query) if key != "v"]
        query.append(("v", digest))
        url = parts._replace(query=urlencode(query)).geturl()
        return match.group(1) + url + match.group(3)

    page = re.sub(r'(\b(?:src|href)=")([^"<>]+\.(?:css|js)(?:\?[^"<>]*)?)(")', version, page)
    path.write_text(page, encoding="utf-8")


@lru_cache(maxsize=None)
def data_url(url):
    path = local_path(url)
    mime = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
    data = path.read_bytes()
    if path.suffix.lower() in (".png", ".jpg", ".jpeg", ".webp"):
        # Browser previews use display-sized copies; hosted assets stay full size.
        with Image.open(path) as original:
            picture = ImageOps.exif_transpose(original)
            mode = "RGBA" if "A" in picture.getbands() or "transparency" in picture.info else "RGB"
            picture = picture.convert(mode)
            picture.thumbnail((900, 900), Image.Resampling.LANCZOS)
            buffer = io.BytesIO()
            quality = 72 if "polaroids" in path.parts else 78
            picture.save(buffer, format="WEBP", quality=quality, method=6)
            data = buffer.getvalue()
            mime = "image/webp"
    encoded = base64.b64encode(data).decode("ascii")
    return f"data:{mime};base64,{encoded}"


class Attributes(HTMLParser):
    def handle_starttag(self, tag, attrs):
        self.values = dict(attrs)


def attributes(tag):
    parser = Attributes()
    parser.feed(tag)
    return parser.values


def inline_css_url(match):
    url = match.group(1).strip().strip("\"'")
    if url.startswith(("data:", "#")):
        return match.group(0)
    return f'url("{data_url(url)}")'


def inline_link(match):
    tag = match.group(0)
    attrs = attributes(tag)
    rel = attrs.get("rel", "")
    if rel == "stylesheet":
        css = local_path(attrs["href"]).read_text(encoding="utf-8")
        css = re.sub(r"url\(([^)]+)\)", inline_css_url, css)
        return f"<style>\n{css}\n</style>"
    if rel == "preload":
        # The embedded font needs no separate URL or preload request.
        return ""
    if rel in ("icon", "apple-touch-icon"):
        return tag.replace(attrs["href"], data_url(attrs["href"]))
    raise ValueError(f"Unhandled link: {tag}")


def inline_image(match):
    tag = match.group(0)
    src = attributes(tag).get("src")
    if not src:
        return tag
    return tag.replace(src, data_url(src))


def inline_photo_link(match):
    tag = match.group(0)
    href = attributes(tag).get("href", "")
    if href.startswith("assets/polaroids/") and href.endswith(".webp"):
        # Reuse the already embedded print instead of storing a second image.
        return tag.replace(f'href="{href}"', 'href="#photos" data-preview-image')
    return tag


def render(filename):
    page = (ROOT / filename).read_text(encoding="utf-8")
    scripts = []

    def collect_script(match):
        attrs = attributes(match.group(1))
        if "data-production-only" in attrs:
            return ""
        src = attrs["src"]
        source = local_path(src).read_text(encoding="utf-8")
        source = re.sub(r"</script", r"<\/script", source, flags=re.IGNORECASE)
        scripts.append(f"<script>\n{source}\n</script>")
        return ""

    page = re.sub(r"<link\b[^>]*>", inline_link, page, flags=re.IGNORECASE)
    page = re.sub(r"<img\b[^>]*>", inline_image, page, flags=re.IGNORECASE)
    page = re.sub(r"<a\b[^>]*>", inline_photo_link, page, flags=re.IGNORECASE)
    page = re.sub(
        r"[ \t]*(<script\b[^>]*>)\s*</script\s*>",
        collect_script,
        page,
        flags=re.IGNORECASE,
    )
    if "data-preview-image" in page:
        scripts.insert(0, '''<script>
document.querySelectorAll("a[data-preview-image]").forEach(link => {
  link.href = link.querySelector("img").src;
});
</script>''')
    page = page.replace("</body>", "\n".join(scripts) + "\n</body>")
    page = page.replace(
        "<!doctype html>",
        "<!doctype html>\n<!-- Portable preview. Generated by scripts/export_preview.py; edit the original site files. -->",
        1,
    )
    return page


def attach_gallery_preview(home, gallery):
    """Keep the gallery reachable when a preview panel receives just one file.

    The hosted site uses ordinary page navigation. The portable preview opens
    that same gallery document in an iframe, with all of its images embedded.
    """
    return_bridge = '''<script>
(() => {
  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[data-gallery-return]");
    if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    parent.postMessage({type: "nox:gallery-return", home: link.hash === "#home"}, "*");
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !event.defaultPrevented && !document.querySelector(".photo-viewer[open]"))
      parent.postMessage({type: "nox:gallery-return"}, "*");
  });
})();
</script>'''
    gallery = gallery.replace("</body>", return_bridge + "\n</body>")
    payload = '<script type="application/json" id="portable-gallery-document">' + json.dumps(gallery, ensure_ascii=False).replace("</", "<\\/") + '</script>'
    opener = '''<script>
(() => {
  const link = document.querySelector(".interest-gallery-link");
  if (!link || !HTMLDialogElement.prototype.showModal) return;
  const overlay = document.createElement("dialog");
  overlay.setAttribute("aria-label", "Polaroid gallery");
  overlay.style.cssText = "position:fixed;inset:0;width:100vw;height:100vh;height:100dvh;max-width:none;max-height:none;margin:0;padding:0;border:0;background:#050b08";
  const frame = document.createElement("iframe");
  frame.title = "Polaroid gallery";
  frame.style.cssText = "display:block;width:100%;height:100%;border:0";
  overlay.append(frame);
  document.body.append(overlay);
  let overflow = "";
  let hadStyle = false;
  link.addEventListener("click", (event) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    overflow = document.body.style.overflow;
    hadStyle = document.body.hasAttribute("style");
    document.body.style.overflow = "hidden";
    frame.srcdoc = JSON.parse(document.getElementById("portable-gallery-document").textContent);
    overlay.showModal();
  });
  overlay.addEventListener("close", () => {
    frame.srcdoc = "";
    document.body.style.overflow = overflow;
    if (!hadStyle && !document.body.style.length) document.body.removeAttribute("style");
    link.focus({preventScroll: true});
  });
  window.addEventListener("message", (event) => {
    if (event.source !== frame.contentWindow || event.data?.type !== "nox:gallery-return") return;
    overlay.close();
    if (event.data.home) document.getElementById("home").scrollIntoView();
  });
})();
</script>'''
    home = home.replace('href="polaroids.html"', 'href="polaroids-preview.html"')
    return home.replace("</body>", payload + "\n" + opener + "\n</body>")


def export():
    build()
    for filename in ("index.html", "polaroids.html"):
        version_local_assets(filename)
    gallery = render("polaroids.html")
    home = attach_gallery_preview(render("index.html"), gallery)
    standalone_gallery = gallery.replace('href="index.html#', 'href="preview.html#')
    for filename, page in (("preview.html", home), ("polaroids-preview.html", standalone_gallery)):
        output = ROOT / filename
        output.write_text(page, encoding="utf-8")
        output.chmod(0o644)
        print(f"Exported {output.name}: {output.stat().st_size:,} bytes, all resources embedded.")
    web_preview = ROOT / "preview"
    web_preview.mkdir(exist_ok=True)
    web_pages = {
        "index.html": home.replace('href="polaroids-preview.html"', 'href="polaroids.html"'),
        "polaroids.html": gallery,
    }
    for filename, page in web_pages.items():
        output = web_preview / filename
        output.write_text(page, encoding="utf-8")
        output.chmod(0o644)
    print("Prepared the standalone web preview in preview/.")


if __name__ == "__main__":
    export()
