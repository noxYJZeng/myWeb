"use strict";

// Only the cloth, binding, and pockets use a pixel canvas. Every photograph and
// caption stays in its native DOM element on a persistent, double-sided leaf.
window.PixelAlbum = class PixelAlbum {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = canvas.parentElement;
    this.ctx = canvas.getContext("2d");
    this.compact = matchMedia("(max-width: 620px)");
    this.motion = matchMedia("(prefers-reduced-motion: reduce)");
    this.entries = [...this.scene.querySelectorAll(".photo-entry")];
    this.order = this.entries;
    this.entry = null;
    this.index = -1;
    this.animating = false;

    this.viewport = document.createElement("div");
    this.viewport.className = "album-viewport";
    this.book = document.createElement("div");
    this.book.className = "album-book";
    this.scene.prepend(this.viewport);
    this.viewport.append(this.book);
    this.book.append(canvas);
    const pages = this.scene.querySelector(".album-pages");
    this.book.append(pages);
    this.leaves = new Map();
    this.entries.forEach((entry) => {
      const leaf = this.makeLeaf("album-leaf");
      leaf.front.append(entry);
      const folio = document.createElement("span");
      folio.className = "album-folio";
      folio.setAttribute("aria-hidden", "true");
      leaf.front.append(folio);
      leaf.folio = folio;
      pages.append(leaf.node);
      this.leaves.set(entry, leaf);
    });
    this.cover = this.makeLeaf("album-cover-leaf");
    this.cover.node.setAttribute("aria-hidden", "true");
    const invitation = document.createElement("span");
    invitation.className = "album-cover-invitation";
    invitation.textContent = "Open album ↗";
    this.cover.front.append(invitation);
    this.book.append(this.cover.node);

    this.makeTextures();
    this.resize = this.resize.bind(this);
    this.compact.addEventListener("change", this.resize);
    this.resize();
  }

  makeLeaf(className) {
    const node = document.createElement("div");
    node.className = className;
    const front = document.createElement("div");
    front.className = "album-face album-face-front";
    const back = document.createElement("div");
    back.className = "album-face album-face-back";
    const shade = document.createElement("div");
    shade.className = "album-leaf-shade";
    shade.setAttribute("aria-hidden", "true");
    node.append(front, back, shade);
    return { node, front, back, shade };
  }

  resize() {
    const width = this.compact.matches ? 280 : 430;
    const hinge = this.compact.matches ? 78 : 215;
    this.canvas.width = width;
    this.canvas.height = 330;
    this.ctx.imageSmoothingEnabled = false;
    this.g = { width, hinge, y: 24, px: hinge, py: 31, pw: 176, ph: 250 };
    const s = this.scene.style;
    s.aspectRatio = width + " / 330";
    const values = {
      "--page-left": (hinge / width) * 100 + "%",
      "--page-top": (31 / 330) * 100 + "%",
      "--page-width": (176 / width) * 100 + "%",
      "--page-height": (250 / 330) * 100 + "%",
      "--cover-left": (hinge / width) * 100 + "%",
      "--cover-top": (24 / 330) * 100 + "%",
      "--cover-width": (192 / width) * 100 + "%",
      "--cover-height": (270 / 330) * 100 + "%",
      "--closed-shift": (((width - 192) / 2 - hinge) / width) * 100 + "%",
    };
    Object.entries(values).forEach(([name, value]) =>
      s.setProperty(name, value),
    );
    this.base();
    if (!this.animating) this.render(this.entry, this.index, this.order);
  }

  rect(c, x, y, w, h, color) {
    c.fillStyle = color;
    c.fillRect(
      Math.round(x),
      Math.round(y),
      Math.max(1, Math.round(w)),
      Math.max(1, Math.round(h)),
    );
  }

  text(c, message, x, y, scale = 1, color = "#d8dfce") {
    const letters = {
      A: [14, 17, 17, 31, 17, 17, 17],
      B: [30, 17, 17, 30, 17, 17, 30],
      D: [30, 17, 17, 17, 17, 17, 30],
      E: [31, 16, 16, 30, 16, 16, 31],
      G: [14, 17, 16, 23, 17, 17, 15],
      H: [17, 17, 17, 31, 17, 17, 17],
      I: [31, 4, 4, 4, 4, 4, 31],
      L: [16, 16, 16, 16, 16, 16, 31],
      M: [17, 27, 21, 21, 17, 17, 17],
      N: [17, 25, 21, 19, 17, 17, 17],
      O: [14, 17, 17, 17, 17, 17, 14],
      P: [30, 17, 17, 30, 16, 16, 16],
      R: [30, 17, 17, 30, 20, 18, 17],
      S: [15, 16, 16, 14, 1, 1, 30],
      T: [31, 4, 4, 4, 4, 4, 4],
      U: [17, 17, 17, 17, 17, 17, 14],
      X: [17, 17, 10, 4, 10, 17, 17],
      Z: [31, 1, 2, 4, 8, 16, 31],
      0: [14, 17, 19, 21, 25, 17, 14],
      1: [4, 12, 4, 4, 4, 4, 14],
      2: [14, 17, 1, 2, 4, 8, 31],
      3: [30, 1, 1, 14, 1, 1, 30],
      4: [2, 6, 10, 18, 31, 2, 2],
      5: [31, 16, 16, 30, 1, 1, 30],
      6: [14, 16, 16, 30, 17, 17, 14],
      7: [31, 1, 2, 4, 8, 8, 8],
      8: [14, 17, 17, 14, 17, 17, 14],
      9: [14, 17, 17, 15, 1, 1, 14],
      "/": [1, 1, 2, 4, 8, 16, 16],
    };
    [...message.toUpperCase()].forEach((letter, i) => {
      (letters[letter] || []).forEach((row, py) => {
        for (let px = 0; px < 5; px++)
          if (row & (1 << (4 - px)))
            this.rect(
              c,
              x + (i * 6 + px) * scale,
              y + py * scale,
              scale,
              scale,
              color,
            );
      });
    });
  }

  texture(width, height, paint) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    paint(canvas.getContext("2d"));
    return 'url("' + canvas.toDataURL() + '")';
  }

  paper(c, width, height, cover = false) {
    this.rect(c, 0, 0, width, height, cover ? "#162019" : "#20281f");
    for (let y = 4; y < height - 4; y += 4)
      for (let x = 4; x < width - 4; x += 4) {
        const n = (x * 73 + y * 151) % 31;
        if (n < 4)
          this.rect(c, x, y, n === 0 ? 2 : 1, 1, cover ? "#293329" : "#2c3429");
      }
    this.rect(c, 0, 0, 1, height, "#48543f");
    this.rect(c, width - 1, 0, 1, height, "#111c12");
    this.rect(c, 0, height - 1, width, 1, "#65715b");
  }

  makeTextures() {
    this.book.style.setProperty(
      "--leaf-texture",
      this.texture(176, 250, (c) => {
        this.paper(c, 176, 250);
        this.rect(c, 9, 10, 158, 1, "#77816b");
        this.rect(c, 9, 11, 1, 190, "#56624d");
        this.rect(c, 166, 11, 1, 190, "#3c4737");
        this.rect(c, 10, 201, 156, 1, "#354031");
        this.rect(c, 13, 203, 150, 1, "#87907a");
      }),
    );
    this.book.style.setProperty(
      "--leaf-back-texture",
      this.texture(176, 250, (c) => {
        this.paper(c, 176, 250);
        this.rect(c, 5, 8, 1, 234, "#36422f");
        this.rect(c, 170, 8, 1, 234, "#283522");
        for (let y = 12; y < 238; y += 7) this.rect(c, 172, y, 1, 2, "#536348");
      }),
    );
    this.cover.front.style.backgroundImage = this.texture(192, 270, (c) => {
      this.paper(c, 192, 270, true);
      this.rect(c, 7, 2, 4, 266, "#0d1710");
      this.rect(c, 12, 3, 1, 264, "#34432f");
      for (let y = 8; y < 260; y += 6) this.rect(c, 16, y, 1, 2, "#4c5840");
      this.text(c, "POLAROIDS", 43, 88, 2);
      this.text(c, "NOX ZENG", 73, 121, 1, "#91a08b");
      const colors = ["#ba6e72", "#c28b61", "#c6b778", "#82a88b", "#819eaf"];
      colors.forEach((color, i) =>
        this.rect(c, 47 + i * 23, 240, 23, 3, color),
      );
    });
    this.cover.back.style.backgroundImage = this.texture(192, 270, (c) => {
      this.paper(c, 192, 270, true);
      // An endpaper beneath the turned leaves also keeps filter changes seamless.
      c.save();
      c.translate(16, 7);
      this.paper(c, 176, 250);
      c.restore();
      for (let y = 10; y < 260; y += 7) this.rect(c, 187, y, 1, 2, "#536348");
    });
    this.coverCount = document.createElement("span");
    this.coverCount.className = "album-cover-count";
    this.cover.front.append(this.coverCount);
  }

  base() {
    const c = this.ctx,
      g = this.g;
    c.clearRect(0, 0, g.width, 330);
    this.rect(c, g.hinge + 5, 36, 191, 269, "#00000045");
    this.rect(c, g.hinge, 24, 192, 274, "#18241a");
    for (let x = 0; x < 4; x++) {
      this.rect(
        c,
        g.px + 176 + x * 2,
        g.py + 4 + x * 2,
        1,
        246 - x * 2,
        x % 2 ? "#64715a" : "#384733",
      );
      this.rect(
        c,
        g.px + 2 + x,
        g.py + 250 + x * 2,
        174 + x,
        1,
        x % 2 ? "#43533b" : "#78816b",
      );
    }
    this.rect(c, g.hinge - 1, 25, 2, 270, "#0b150e");
  }

  positionLeaves(index, order) {
    this.entries.forEach((entry) => {
      const leaf = this.leaves.get(entry);
      const i = order.indexOf(entry);
      leaf.node.hidden = i < 0;
      const turned = index >= 0 && i < index;
      leaf.node.style.transform = "rotateY(" + (turned ? -180 : 0) + "deg)";
      leaf.node.style.zIndex = String(
        turned ? 100 + i : 100 + order.length - i,
      );
      leaf.node.dataset.side = turned ? "left" : "right";
      leaf.folio.textContent = String(i + 1).padStart(2, "0");
      leaf.node.inert = entry !== order[index];
      entry.hidden = entry !== order[index];
    });
  }

  render(entry, index, order) {
    this.entry = entry;
    this.index = index;
    this.order = order;
    this.positionLeaves(index, order);
    this.coverCount.textContent =
      String(order.length).padStart(2, "0") + " PHOTOS";
    this.cover.node.style.transform = "rotateY(" + (entry ? -180 : 0) + "deg)";
    this.cover.node.style.zIndex = entry ? "10" : "2000";
    this.book.style.transform = entry
      ? "translateX(0%)"
      : "translateX(var(--closed-shift))";
    this.scene.dataset.open = String(!!entry);
    this.base();
  }

  async turn(from, to, direction, order) {
    if (this.motion.matches) {
      this.render(to.entry, to.index, order);
      return;
    }
    this.animating = true;
    const opening = !from.entry;
    const closing = !to.entry;
    // Stage the next native photograph below the leaf before movement starts.
    this.positionLeaves(closing ? from.index : to.index, order);
    if (from.entry) from.entry.hidden = false;
    if (to.entry) to.entry.hidden = false;
    const leaf =
      opening || closing
        ? this.cover
        : this.leaves.get(direction > 0 ? from.entry : to.entry);
    leaf.node.hidden = false;
    leaf.node.inert = true;
    leaf.node.style.zIndex = "2000";
    leaf.node.classList.add("is-moving");
    const startAngle = opening ? 0 : closing ? -180 : direction > 0 ? 0 : -180;
    const endAngle = startAngle === 0 ? -180 : 0;
    leaf.node.style.transform = "rotateY(" + endAngle + "deg)";
    this.coverCount.textContent =
      String(order.length).padStart(2, "0") + " PHOTOS";
    const timing = {
      duration: opening || closing ? 1050 : 900,
      easing: "cubic-bezier(.42, 0, .2, 1)",
    };
    const animations = [
      leaf.node.animate(
        [
          { transform: "rotateY(" + startAngle + "deg)" },
          { transform: "rotateY(" + endAngle + "deg)" },
        ],
        timing,
      ),
      leaf.shade.animate(
        [{ opacity: 0 }, { opacity: 0.22, offset: 0.5 }, { opacity: 0 }],
        timing,
      ),
    ];
    if (opening || closing) {
      this.book.classList.add("is-moving");
      const closed = "translateX(var(--closed-shift))";
      const open = "translateX(0%)";
      this.book.style.transform = closing ? closed : open;
      animations.push(
        this.book.animate(
          [
            { transform: opening ? closed : open },
            { transform: closing ? closed : open },
          ],
          timing,
        ),
      );
    }
    if (closing) {
      // The leaves already on the left close with the cover as one bundle.
      // They remain physically present rather than resetting at the last frame.
      order.slice(0, from.index).forEach((entry) => {
        const node = this.leaves.get(entry).node;
        node.style.transform = "rotateY(0deg)";
        animations.push(
          node.animate(
            [{ transform: "rotateY(-180deg)" }, { transform: "rotateY(0deg)" }],
            timing,
          ),
        );
      });
    }
    try {
      await Promise.all(animations.map((animation) => animation.finished));
    } finally {
      // Keep the exact same leaf and its back face in the spread after landing.
      this.animating = false;
      animations.forEach((animation) => animation.cancel());
      leaf.node.classList.remove("is-moving");
      this.book.classList.remove("is-moving");
      this.render(to.entry, to.index, order);
    }
  }
};
