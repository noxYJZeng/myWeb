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
  let lastScroll = Math.max(0, scrollY);
  let direction = 1;
  const entrances = new Map();
  const running = new Map();
  const seen = new WeakSet();
  const depth = new Set();
  const compact = () => innerWidth <= 620;
  const clamp = (value) => Math.max(0, Math.min(1, value));
  function sampleDirection() {
    const position = Math.max(0, scrollY);
    if (Math.abs(position - lastScroll) > 1) direction = position > lastScroll ? 1 : -1;
    lastScroll = position;
  }
  const mix = (a, b, p) => a + (b - a) * p;
  const lift = (node, x, y, pinFocus = true) => {
    if (node) {
      const focused = pinFocus && node.contains(document.activeElement);
      const value = focused ? "0px 0px" : `${Math.round(x)}px ${Math.round(y)}px`;
      if (node.style.translate !== value) node.style.translate = value;
    }
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
  register(".paper-stage", { y: 35, solid: true, duration: 950 });
  register(".paper-below", { y: 24, solid: true, duration: 750 });
  register(".contact-stack", { y: 76, solid: true, duration: 1100 });
  register(".contact-paper", { y: 30, delay: 90, solid: true, duration: 1000 });
  register(".contact-pen", { x: 32, y: -30, delay: 260, solid: true, duration: 950 });
  register(".interest-copy", { x: -30, y: 18, duration: 850 });
  register(".interest-visual", { art: true, x: 38, y: 26, solid: true, duration: 1000 });
  register(".dedication", { y: 28, duration: 1000 });
  register(".waxwing-scene", { y: 40, solid: true, duration: 1100 });

  const heroCopy = document.querySelector(".hero-copy");
  const garden = document.querySelector(".garden");
  const aboutMain = document.querySelector(".about-main");
  const paperBack = document.querySelector(".paper-layer-back");
  const paperMiddle = document.querySelector(".paper-layer-middle");
  const contactStack = document.querySelector(".contact-stack");
  const pen = document.querySelector(".contact-pen");
  const dedication = document.querySelector(".dedication");
  const waxwing = document.querySelector(".waxwing-scene");
  [heroCopy, garden, aboutMain, paperBack, paperMiddle, pen, dedication, waxwing].filter(Boolean).forEach((node) => {
    node.dataset.scrollDepth = "";
    depth.add(node);
  });
  const interests = [...document.querySelectorAll(".interest-row")].map((row) => {
    const art = row.querySelector(".interest-visual");
    art.dataset.scrollArt = "";
    const copy = row.querySelector(".interest-copy");
    copy.dataset.scrollDepth = "";
    depth.add(copy);
    depth.add(art);
    return { row, art, copy };
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
  const navigation = [...header.querySelectorAll('nav a[href^="#"]')].map((link) => ({
    link, node: document.querySelector(link.hash),
  })).filter(({ node }) => node);
  const stars = Array.from({ length: 88 }, (_, i) => ({
    x: ((i * 73 + 17) % 997) / 997,
    y: ((i * 139 + 53) % 991) / 991,
    depth: 0.04 + (i % 3) * 0.045,
  }));

  function drawAtmosphere(scroll, chapter, color) {
    if (!context) return;
    const unit = Math.max(4, Math.ceil(Math.max(innerWidth / 480, innerHeight / 320)));
    const width = Math.ceil(innerWidth / unit);
    const height = Math.ceil(innerHeight / unit);
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
    // Low-resolution curtains of light travel along the margins by chapter.
    // Row calculations and integer grain keep this scroll-only drawing small.
    const horizon = height * (0.36 + chapter * 0.045);
    const sweep = Math.sin(chapter * 1.45) * .10;
    for (let y = 0; y < height; y += 4) {
      const light = Math.max(0, 1 - Math.abs(y - horizon) / (height * 0.65));
      const bend = Math.sin(y / height * 3.4 + chapter * .85) * width * .075;
      const left = width * (.09 + sweep) + bend;
      const right = width * (.91 - sweep) - bend;
      const reach = width * .25;
      for (let x = 0; x < width; x += 4) {
        const edge = Math.abs((x / width - 0.5) * 2);
        const ribbon = Math.max(0, 1 - Math.min(Math.abs(x - left), Math.abs(x - right)) / reach);
        const grain = ((x * 37 + y * 17) % 13) / 13;
        const alpha = Math.round((light * edge ** 3 * .025 + ribbon ** 2 * edge * .095) * (0.82 + grain * .18) * 100) / 100;
        if (!alpha) continue;
        context.globalAlpha = alpha;
        context.fillStyle = x < width / 2 ? "#59886a" : "#737e59";
        context.fillRect(x, y, 4, 4);
      }
    }
    stars.forEach((star, i) => {
      const drift = Math.sin(scroll * .0014 + i * 2.3) * (i % 3 + 1) * 2;
      const y = ((star.y * height - scroll * star.depth / unit) % height + height) % height;
      context.globalAlpha = i % 5 ? 0.16 : 0.3;
      context.fillStyle = i % 7 ? "#7da58b" : "#b6b287";
      const x = Math.round(star.x * width + drift);
      context.fillRect(x, Math.round(y), i % 9 ? 1 : 2, 1);
      if (i % 11 === 0) {
        context.globalAlpha *= .35;
        context.fillRect(x, Math.round(y) + 2, 1, 2);
      }
    });
    context.globalAlpha = 1;
  }

  function syncPreference() {
    if (reduced === preference.matches) return;
    reduced = preference.matches;
    root.dataset.pageMotion = reduced ? "reduced" : "full";
    if (reduced) {
      running.forEach((animation) => animation.cancel());
      depth.forEach((node) => {
        node.style.removeProperty("translate");
        node.style.removeProperty("rotate");
      });
    }
  }

  function reveal(node, options) {
    if (seen.has(node)) return;
    seen.add(node);
    node.dataset.scrollState = "settled";
    const rect = node.getBoundingClientRect();
    const focused = document.activeElement !== document.body && node.contains(document.activeElement);
    if (reduced || document.hidden || focused || !node.animate) return;
    sampleDirection();
    let x = options.x || 0;
    let y = (options.y ?? 32) * direction;
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
      node.dataset.scrollDirection = direction > 0 ? "down" : "up";
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

  let observer = null;
  let observedCompact = compact();
  // Reset only beyond the viewport plus a gutter. An entrance cannot rearm
  // itself merely by translating across the visible edge during its animation.
  const resetObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) return;
      running.get(entry.target)?.cancel();
      seen.delete(entry.target);
      entry.target.dataset.scrollState = "waiting";
    });
  }, { rootMargin: "112px 0px", threshold: 0 });
  function observeEntrances() {
    observer?.disconnect();
    observedCompact = compact();
    observer = new IntersectionObserver((entries) => {
      syncPreference();
      entries.forEach((entry) => {
        if (entry.isIntersecting) reveal(entry.target, entrances.get(entry.target));
        else if (!running.has(entry.target)) {
          seen.delete(entry.target);
          entry.target.dataset.scrollState = "waiting";
        }
      });
    }, { rootMargin: `-${observedCompact ? 72 : 108}px 0px 0px 0px`, threshold: 0.01 });
    entrances.forEach((options, node) => observer.observe(node));
  }

  function update() {
    frame = null;
    if (!armed || document.hidden) return;
    syncPreference();
    sampleDirection();
    const scroll = Math.max(0, scrollY);
    const height = innerHeight;
    const small = compact();
    const rects = new Map(zones.map((zone) => [zone.node, zone.node.getBoundingClientRect()]));
    const artRects = interests.map(({ row }) => row.getBoundingClientRect());
    const entranceRects = [...running.keys()].map((node) => [node, node.getBoundingClientRect()]);
    header.classList.toggle("is-scrolled", scroll > 24);
    const heroRect = rects.get(hero);
    const exit = clamp(-heroRect.top / (heroRect.height * 0.85));
    if (!reduced) {
      lift(heroCopy, 0, -exit * (small ? 18 : 34));
      lift(garden, 0, exit * (small ? 20 : 62), false);
      const about = rects.get(document.querySelector("#about"));
      const aboutPassage = clamp((height - about.top) / (height + about.height));
      lift(aboutMain, 0, (.5 - aboutPassage) * (small ? 14 : 28));
      interests.forEach(({ art, copy }, index) => {
        const rect = artRects[index];
        const progress = clamp((height - rect.top) / (height + rect.height));
        const passage = .5 - progress;
        lift(art, 0, passage * (small ? 36 : 76));
        lift(copy, 0, -passage * (small ? 12 : 26));
      });
      const contact = rects.get(document.querySelector("#contact"));
      const spread = Math.sin(clamp((height - contact.top) / (height + contact.height)) * Math.PI);
      const tight = innerWidth <= 900;
      const held = contactStack?.contains(document.activeElement);
      const fan = held ? 0 : spread;
      lift(paperBack, -(tight ? 6 : 25) * fan, (tight ? 8 : 22) * fan);
      lift(paperMiddle, (tight ? 6 : 30) * fan, (tight ? 10 : 30) * fan);
      if (paperBack) paperBack.style.rotate = `${(-fan * (tight ? 1.3 : 3)).toFixed(2)}deg`;
      if (paperMiddle) paperMiddle.style.rotate = `${(fan * (tight ? 1.1 : 2.5)).toFixed(2)}deg`;
      lift(pen, (tight ? 3 : 9) * fan, -(tight ? 6 : 17) * fan);
      const closing = rects.get(document.querySelector(".visitor-note"));
      if (closing) {
        const passage = .5 - clamp((height - closing.top) / (height + closing.height));
        lift(dedication, 0, -passage * (small ? 16 : 38));
        lift(waxwing, 0, passage * (small ? 18 : 36));
      }
    }
    navigation.forEach(({ link, node }) => {
      const rect = rects.get(node);
      const progress = rect ? clamp((height * .48 - rect.top) / rect.height) : 0;
      const value = progress.toFixed(3);
      if (link.style.getPropertyValue("--chapter-progress") !== value) link.style.setProperty("--chapter-progress", value);
    });
    const focus = scroll + height * 0.48;
    const tops = zones.map((zone) => rects.get(zone.node).top + scroll);
    let chapter = 0;
    while (chapter < zones.length - 1 && focus >= tops[chapter + 1]) chapter++;
    const next = Math.min(chapter + 1, zones.length - 1);
    const blend = next === chapter ? 0 : clamp((focus - tops[chapter]) / (tops[next] - tops[chapter]));
    const color = reduced ? zones[0].color : zones[chapter].color.map((c, i) => mix(c, zones[next].color[i], blend));
    root.dataset.scrollChapter = zones[chapter].name;
    drawAtmosphere(reduced ? 0 : scroll, reduced ? 0 : chapter + blend, color);
    entranceRects.forEach(([node, rect]) => {
      if (rect.bottom < -80 || rect.top > height + 150) running.get(node)?.cancel();
    });
  }
  function requestUpdate() {
    if (frame === null && armed && !document.hidden) frame = requestAnimationFrame(update);
  }
  function arm() {
    if (armed || root.classList.contains("intro-active")) return;
    armed = true;
    root.classList.toggle("motion-suspended", document.hidden);
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
      }
      resetObserver.observe(node);
    });
    observeEntrances();
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
    if (armed && observedCompact !== compact()) observeEntrances();
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
    });
    requestUpdate();
  });
  function settleAtTarget(event) {
    running.forEach((animation, node) => {
      if (node.contains(event.target) || event.target.contains(node)) animation.cancel();
    });
    requestUpdate();
  }
  document.addEventListener("focusin", settleAtTarget);
  document.addEventListener("pointerdown", settleAtTarget, { passive: true });
  document.addEventListener("visibilitychange", () => {
    root.classList.toggle("motion-suspended", document.hidden);
    if (document.hidden) {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      running.forEach((animation) => animation.cancel());
    } else requestUpdate();
  });
  preference.addEventListener("change", requestUpdate);
})();
