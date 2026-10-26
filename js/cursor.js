"use strict";

// A flip-top pixel lighter, with a native SVG fallback before scripts run.
(() => {
  const hardware = matchMedia("(any-hover: hover) and (any-pointer: fine)");
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const root = document.documentElement;
  const cursor = document.createElement("canvas");
  cursor.className = "lighter-cursor";
  cursor.width = 36;
  cursor.height = 48;
  cursor.hidden = true;
  cursor.setAttribute("aria-hidden", "true");
  const ctx = cursor.getContext("2d");
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  document.body.append(cursor);

  const controls =
    'a[href], button, summary, [role="button"], [role="link"], select, input:not([type="hidden"]), label[for], .album-scene[data-page-direction]';
  const flames = [
    [
      "...o...",
      "...oo..",
      "..oyo..",
      "..oyyo.",
      ".oywyo.",
      ".oywwyo",
      ".oywwyo",
      "..oyyo.",
      "...oo..",
    ],
    [
      "....o..",
      "...oo..",
      "...yo..",
      "..oyyo.",
      ".oywyo.",
      ".oywwyo",
      ".oywwyo",
      "..oyyo.",
      "...oo..",
    ],
    [
      "..o....",
      "..oo...",
      "..oyo..",
      "..oyyo.",
      ".oywyo.",
      ".oywwyo",
      "..owwyo",
      "..oyyo.",
      "...oo..",
    ],
  ];
  const colors = { o: "#ba6c38", y: "#e3a75b", w: "#ffe2a1" };
  const greenColors = { o: "#3f7548", y: "#88a969", w: "#e1d2a2" };
  let x = 0,
    y = 0;
  let seen = false;
  let frame = null;
  let flicker = null;
  let lit = false;
  let green = false;
  let lid = 0;
  let lastDraw = 0;

  function pixel(px, py, width, height, color) {
    ctx.fillStyle = color;
    ctx.fillRect(px, py, width, height);
  }
  function draw(now) {
    ctx.clearRect(0, 0, 36, 48);
    const goal = lit ? 1 : 0;
    const step = motion.matches ? 1 : Math.min(48, now - lastDraw || 16) / 120;
    lid += Math.max(-step, Math.min(step, goal - lid));
    lastDraw = now;
    const open = lid > 0.65;
    cursor.dataset.state = open ? "open" : lid > 0.2 ? "opening" : "closed";
    const palette = green ? greenColors : colors;
    if (lit && open) {
      const shape =
        flames[motion.matches ? 0 : Math.floor(now / 130) % flames.length];
      shape.forEach((row, py) =>
        [...row].forEach((cell, px) => {
          if (palette[cell])
            pixel(10 + px * 2, 4 + py * 2, 2, 2, palette[cell]);
        }),
      );
    }
    // Enamel case, brushed metal edges, and a tiny engraved butterfly.
    pixel(10, 28, 16, 18, "#42564c");
    pixel(9, 29, 18, 15, "#6f8379");
    pixel(10, 29, 16, 15, "#243e33");
    pixel(10, 29, 1, 14, "#c6d2c4");
    pixel(12, 30, 12, 1, "#547465");
    pixel(25, 30, 1, 13, "#102219");
    pixel(11, 44, 14, 1, "#afbcaa");
    pixel(12, 45, 12, 1, "#667f6c");
    pixel(13, 34, 2, 2, "#b8bea1");
    pixel(15, 35, 2, 2, "#a3b094");
    pixel(20, 34, 2, 2, "#b8bea1");
    pixel(18, 35, 2, 2, "#a3b094");
    pixel(14, 37, 3, 2, "#829b80");
    pixel(18, 37, 3, 2, "#829b80");
    pixel(17, 35, 1, 5, "#d0c69d");
    if (open) {
      // Open lid and the perforated windscreen above the lighter body.
      pixel(1, 18, 5, 1, "#d2d8c7");
      pixel(0, 19, 7, 8, "#718879");
      pixel(1, 20, 4, 6, "#b6c2b1");
      pixel(6, 23, 2, 6, "#485d4f");
      pixel(7, 27, 4, 3, "#96a691");
      pixel(11, 22, 12, 7, "#bac3ac");
      pixel(12, 21, 10, 1, "#e1e3c7");
      for (const px of [12, 17, 21]) {
        pixel(px, 23, 2, 1, "#405344");
        pixel(px, 26, 2, 1, "#405344");
      }
      pixel(23, 23, 3, 5, "#657565");
      pixel(24, 23, 1, 4, "#d0d0ae");
      pixel(15, 21, 4, 1, green ? "#adc38d" : lit ? "#e1b876" : "#d2d9c0");
    } else if (lid > 0.2) {
      pixel(5, 18, 15, 2, "#d5ddce");
      pixel(6, 20, 16, 5, "#879e8e");
      pixel(8, 24, 14, 3, "#526f5b");
      pixel(11, 27, 12, 1, "#c6cdb5");
    } else {
      pixel(10, 19, 16, 1, "#d5dfcd");
      pixel(9, 20, 18, 7, "#93a898");
      pixel(10, 20, 1, 6, "#d8e2d2");
      pixel(12, 21, 12, 1, "#bfcbb9");
      pixel(25, 21, 1, 5, "#5a7360");
      pixel(10, 27, 16, 1, "#0d1c14");
    }
  }
  function schedule() {
    clearTimeout(flicker);
    if (frame === null && seen && hardware.matches)
      frame = requestAnimationFrame(tick);
  }
  function tick(now) {
    frame = null;
    if (!seen || !hardware.matches || document.hidden) return hide();
    const target = document.elementFromPoint(x, y);
    const control = target?.closest(controls);
    green = root.classList.contains("has-text-selection");
    lit =
      green ||
      Boolean(
        control &&
          !control.closest('[disabled], [aria-disabled="true"], [inert]'),
      );
    cursor.dataset.lit = String(lit);
    cursor.dataset.flame = green ? "green" : lit ? "amber" : "none";
    cursor.style.transform = `translate3d(${Math.round(x) - 17}px, ${Math.round(y) - 23}px, 0)`;
    cursor.hidden = false;
    draw(now);
    root.classList.add("lighter-cursor-active");
    if (!motion.matches && (lit || Math.abs(lid - (lit ? 1 : 0)) > 0.01))
      flicker = setTimeout(
        schedule,
        Math.abs(lid - (lit ? 1 : 0)) > 0.01 ? 30 : 100,
      );
  }
  function hide() {
    seen = false;
    lid = 0;
    lastDraw = 0;
    clearTimeout(flicker);
    cancelAnimationFrame(frame);
    frame = null;
    cursor.hidden = true;
    root.classList.remove("lighter-cursor-active");
  }
  document.addEventListener(
    "pointermove",
    (event) => {
      if (event.pointerType !== "mouse" || !hardware.matches) return;
      x = event.clientX;
      y = event.clientY;
      seen = true;
      schedule();
    },
    { passive: true },
  );
  document.addEventListener(
    "pointerover",
    (event) => {
      if (event.pointerType === "mouse" && seen) schedule();
    },
    { passive: true },
  );
  document.addEventListener("pointerout", (event) => {
    if (!event.relatedTarget) hide();
  });
  document.addEventListener(
    "scroll",
    () => {
      if (seen) schedule();
    },
    { passive: true, capture: true },
  );
  document.addEventListener("keydown", (event) => {
    if (event.key === "Tab") hide();
  });
  document.addEventListener("selectionchange", () => {
    if (seen) schedule();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) hide();
  });
  window.addEventListener("blur", hide);
  hardware.addEventListener("change", hide);
  motion.addEventListener("change", () => {
    if (seen) schedule();
  });
})();
