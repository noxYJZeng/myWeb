"use strict";

// Page choreography follows native scrolling. All content starts visible;
// entrances are temporary animations, never a hidden starting stylesheet.
(() => {
  const root = document.documentElement;
  const preference = matchMedia("(prefers-reduced-motion: reduce)");
  const header = document.querySelector(".site-header");
  const hero = document.querySelector(".hero");
  if (!header || !hero) return;

  let reduced = preference.matches;
  let armed = false;
  let frame = null;
  let backdropKey = "";
  const entrances = new Map();
  const running = new Map();
  const seen = new WeakSet();
  const depth = new Set();
  const compact = () => innerWidth <= 620;
  const clamp = (value) => Math.max(0, Math.min(1, value));
  const mix = (a, b, p) => a + (b - a) * p;
  const lift = (node, x, y) => {
    if (node) node.style.translate = `${Math.round(x)}px ${Math.round(y)}px`;
  };
  const fullMask = "polygon(0 0,100% 0,100% 100%,80% 100%,80% 100%,60% 100%,60% 100%,40% 100%,40% 100%,20% 100%,20% 100%,0 100%)";
  const pixelMask = "polygon(0 0,100% 0,100% 30%,80% 30%,80% 38%,60% 38%,60% 46%,40% 46%,40% 54%,20% 54%,20% 62%,0 62%)";

  function register(selector, options = {}) {
    document.querySelectorAll(selector).forEach((node, index) => {
      node.dataset.scrollReveal = "";
      if (options.mask) node.dataset.scrollMask = "";
      node.dataset.scrollState = "waiting";
      entrances.set(node, { ...options, index });
    });
  }
  register(".about .section-marker", { x: -22, y: 0, duration: 650 });
  register(".about-main h2", { y: 30, duration: 700 });
  register(".about-copy", { y: 46, delay: 80, duration: 850 });
  register(".work .section-heading, .offscreen .section-heading", { y: 34 });
  register(".project-group-title", { y: 20, duration: 650 });
  register(".project-list > li", { y: 24, solid: true, duration: 650 });
  register(".contact-stack", { y: 76, solid: true, duration: 1100 });
  register(".contact-paper", { y: 30, delay: 90, solid: true, duration: 1000 });
  register(".contact-pen", { x: 32, y: -30, delay: 260, solid: true, duration: 950 });
  register(".interest-copy", { x: -30, y: 18, duration: 850 });
  register(".interest-visual", { art: true, x: 38, y: 26, solid: true, duration: 1000 });
  register(".dedication", { y: 28, duration: 1000 });
  register(".waxwing-scene", { y: 40, solid: true, duration: 1100 });

  const heroCopy = document.querySelector(".hero-copy");
  const garden = document.querySelector(".garden");
  const paperBack = document.querySelector(".paper-layer-back");
  const paperMiddle = document.querySelector(".paper-layer-middle");
  [heroCopy, garden, paperBack, paperMiddle].filter(Boolean).forEach((node) => {
    node.dataset.scrollDepth = "";
    depth.add(node);
  });
  const interests = [...document.querySelectorAll(".interest-row")].map((row) => {
    const art = row.querySelector(".interest-visual");
    art.dataset.scrollArt = "";
    depth.add(art);
    return { row, art };
  });

  const atmosphere = document.createElement("canvas");
  atmosphere.className = "scroll-atmosphere";
  atmosphere.setAttribute("aria-hidden", "true");
  const context = atmosphere.getContext("2d");
  if (context) document.body.prepend(atmosphere);
  const zones = [
    { node: hero, name: "home", color: [5, 11, 8] },
    { node: document.querySelector("#about"), name: "about", color: [5, 16, 11] },
    { node: document.querySelector("#projects"), name: "projects", color: [6, 19, 13] },
    { node: document.querySelector("#contact"), name: "contact", color: [11, 19, 14] },
    { node: document.querySelector("#offscreen"), name: "interests", color: [5, 16, 15] },
    { node: document.querySelector(".visitor-note"), name: "closing", color: [5, 11, 8] },
  ].filter((zone) => zone.node);
  const stars = Array.from({ length: 64 }, (_, i) => ({
    x: ((i * 73 + 17) % 997) / 997,
    y: ((i * 139 + 53) % 991) / 991,
    depth: 0.04 + (i % 3) * 0.045,
  }));

  function drawAtmosphere(scroll, chapter, color) {
    if (!context) return;
    const width = Math.ceil(innerWidth / 4);
    const height = Math.ceil(innerHeight / 4);
    const key = [width, height, Math.round(scroll), Math.round(chapter * 100), ...color.map(Math.round)].join(",");
    if (backdropKey === key) return;
    backdropKey = key;
    if (atmosphere.width !== width || atmosphere.height !== height) {
      atmosphere.width = width;
      atmosphere.height = height;
      context.imageSmoothingEnabled = false;
    }
    context.fillStyle = `rgb(${color.map(Math.round).join(",")})`;
    context.fillRect(0, 0, width, height);
    // A quiet, dithered light field lives at the margins, behind the content.
    // It changes with the chapter rather than flashing over the next page.
    const horizon = height * (0.36 + chapter * 0.045);
    context.fillStyle = "#6e9d77";
    for (let y = 0; y < height; y += 4) {
      const light = Math.max(0, 1 - Math.abs(y - horizon) / (height * 0.65));
      for (let x = 0; x < width; x += 4) {
        const edge = Math.abs((x / width - 0.5) * 2) ** 4;
        const alpha = Math.round(light * edge * 2) / 100;
        if (!alpha) continue;
        context.globalAlpha = alpha;
        context.fillRect(x, y, 3, 3);
      }
    }
    stars.forEach((star, i) => {
      const y = ((star.y * height - scroll * star.depth / 4) % height + height) % height;
      context.globalAlpha = i % 5 ? 0.1 : 0.18;
      context.fillStyle = i % 7 ? "#7da58b" : "#b6b287";
      context.fillRect(Math.round(star.x * width), Math.round(y), 1, 1);
    });
    context.globalAlpha = 1;
  }

  function syncPreference() {
    if (reduced === preference.matches) return;
    reduced = preference.matches;
    root.dataset.pageMotion = reduced ? "reduced" : "full";
    if (reduced) {
      running.forEach((animation) => animation.cancel());
      depth.forEach((node) => node.style.removeProperty("translate"));
    }
  }

  function reveal(node, options) {
    if (seen.has(node)) return;
    seen.add(node);
    node.dataset.scrollState = "settled";
    const rect = node.getBoundingClientRect();
    if (reduced || document.hidden || rect.bottom <= 80 || !node.animate) return;
    let x = options.x || 0;
    let y = options.y ?? 32;
    let delay = options.delay || 0;
    if (compact()) {
      x = Math.max(-12, Math.min(12, x));
      y *= 0.65;
      delay *= 0.7;
    }
    // Keep incoming objects within the real viewport, including at tablet
    // widths where a two-column card has less outside margin than on desktop.
    const room = x < 0 ? rect.left - 8 : innerWidth - rect.right - 8;
    x = Math.sign(x) * Math.min(Math.abs(x), Math.max(0, room));
    const property = options.art ? "transform" : "translate";
    const position = (x, y) => options.art
      ? `translate3d(${Math.round(x)}px,${Math.round(y)}px,0)`
      : `${Math.round(x)}px ${Math.round(y)}px`;
    const start = { [property]: position(x, y), opacity: options.solid ? 1 : 0.6 };
    const middle = { [property]: position(x * 0.08, y * 0.08), opacity: 1, offset: 0.75 };
    const end = { [property]: position(0, 0), opacity: 1 };
    if (options.mask && CSS.supports("clip-path", pixelMask)) {
      start.clipPath = pixelMask;
      middle.clipPath = end.clipPath = fullMask;
    }
    try {
      const animation = node.animate([start, middle, end], {
        duration: options.duration || 800,
        delay,
        easing: "cubic-bezier(0.22,0.8,0.25,1)",
        fill: "backwards",
      });
      node.dataset.scrollState = "entering";
      running.set(node, animation);
      const settle = () => {
        if (running.get(node) !== animation) return;
        running.delete(node);
        node.dataset.scrollState = "settled";
      };
      animation.addEventListener("finish", () => {
        settle();
        animation.cancel();
      }, { once: true });
      animation.addEventListener("cancel", settle, { once: true });
    } catch {
      // The unchanged, visible HTML is also the animation fallback.
    }
  }

  const observer = new IntersectionObserver((entries) => {
    syncPreference();
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      reveal(entry.target, entrances.get(entry.target));
      observer.unobserve(entry.target);
    });
  }, { rootMargin: "0px", threshold: 0.01 });

  function update() {
    frame = null;
    if (!armed || document.hidden) return;
    syncPreference();
    const scroll = Math.max(0, scrollY);
    const height = innerHeight;
    const small = compact();
    const rects = new Map(zones.map((zone) => [zone.node, zone.node.getBoundingClientRect()]));
    const artRects = interests.map(({ row }) => row.getBoundingClientRect());
    header.classList.toggle("is-scrolled", scroll > 24);
    const heroRect = rects.get(hero);
    const exit = clamp(-heroRect.top / (heroRect.height * 0.85));
    if (!reduced) {
      lift(heroCopy, 0, -exit * (small ? 18 : 28));
      lift(garden, 0, exit * (small ? 16 : 40));
      interests.forEach(({ art }, index) => {
        const rect = artRects[index];
        const progress = clamp((height - rect.top) / (height + rect.height));
        lift(art, 0, (0.5 - progress) * (small ? 14 : 26));
      });
      const contact = rects.get(document.querySelector("#contact"));
      const spread = Math.sin(clamp((height - contact.top) / (height + contact.height)) * Math.PI);
      const tight = innerWidth <= 900;
      lift(paperBack, -(tight ? 4 : 14) * spread, (tight ? 6 : 14) * spread);
      lift(paperMiddle, (tight ? 4 : 18) * spread, (tight ? 8 : 20) * spread);
    }
    const focus = scroll + height * 0.48;
    const tops = zones.map((zone) => rects.get(zone.node).top + scroll);
    let chapter = 0;
    while (chapter < zones.length - 1 && focus >= tops[chapter + 1]) chapter++;
    const next = Math.min(chapter + 1, zones.length - 1);
    const blend = next === chapter ? 0 : clamp((focus - tops[chapter]) / (tops[next] - tops[chapter]));
    const color = reduced ? zones[0].color : zones[chapter].color.map((c, i) => mix(c, zones[next].color[i], blend));
    root.dataset.scrollChapter = zones[chapter].name;
    drawAtmosphere(reduced ? 0 : scroll, reduced ? 0 : chapter + blend, color);
    running.forEach((animation, node) => {
      const rect = node.getBoundingClientRect();
      if (rect.bottom < -80 || rect.top > height + 150) animation.cancel();
    });
  }
  function requestUpdate() {
    if (frame === null && armed && !document.hidden) frame = requestAnimationFrame(update);
  }
  function arm() {
    if (armed || root.classList.contains("intro-active")) return;
    armed = true;
    root.classList.add("has-scroll-scene");
    root.dataset.pageMotion = reduced ? "reduced" : "full";
    const sectionEntry = location.hash && !["#top", "#home"].includes(location.hash);
    const anchor = sectionEntry ? document.getElementById(location.hash.slice(1)) : null;
    entrances.forEach((options, node) => {
      const rect = node.getBoundingClientRect();
      const beforeAnchor = anchor && (
        anchor.contains(node) ||
        Boolean(node.compareDocumentPosition(anchor) & Node.DOCUMENT_POSITION_FOLLOWING)
      );
      if (rect.bottom <= 80 || beforeAnchor || (sectionEntry && rect.top < innerHeight)) {
        seen.add(node);
        node.dataset.scrollState = "settled";
      } else observer.observe(node);
    });
    update();
  }
  const opening = new MutationObserver(() => {
    arm();
    if (armed) opening.disconnect();
  });
  if (root.classList.contains("intro-active")) {
    opening.observe(root, { attributes: true, attributeFilter: ["class"] });
  } else arm();

  addEventListener("scroll", requestUpdate, { passive: true });
  addEventListener("resize", () => {
    running.forEach((animation) => animation.cancel());
    requestUpdate();
  }, { passive: true });
  addEventListener("focus", requestUpdate);
  addEventListener("hashchange", () => {
    const target = document.getElementById(location.hash.slice(1));
    if (target) entrances.forEach((options, node) => {
      if (!target.contains(node)) return;
      seen.add(node);
      running.get(node)?.cancel();
      node.dataset.scrollState = "settled";
      observer.unobserve(node);
    });
    requestUpdate();
  });
  function settleAtTarget(event) {
    running.forEach((animation, node) => {
      if (node.contains(event.target) || event.target.contains(node)) animation.cancel();
    });
  }
  document.addEventListener("focusin", settleAtTarget);
  document.addEventListener("pointerdown", settleAtTarget, { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      running.forEach((animation) => animation.cancel());
    } else requestUpdate();
  });
  preference.addEventListener("change", requestUpdate);
})();
