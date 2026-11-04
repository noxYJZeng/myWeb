"use strict";

// Grouped notes remain ordinary HTML. Scroll, pointer, and keyboard attention
// choose one cotton-paper note; a shared image accompanies it on wide screens.
(() => {
  const directory = document.querySelector(".project-index");
  if (!directory) return;
  const notes = [...directory.querySelectorAll(".project-note")];
  const previews = new Map([...directory.querySelectorAll("[data-preview]")]
    .map((node) => [node.dataset.preview, node]));
  if (!notes.length) return;
  const desktop = matchMedia("(min-width: 901px)");
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  let current = null;
  let pointed = null;
  let focused = null;
  let intent = "focus";
  let animation = null;
  let frame = null;

  function cancelAnimation() {
    animation?.cancel();
    animation = null;
  }

  function select(note) {
    if (current === note) return;
    const preview = previews.get(note.dataset.project);
    if (!preview) return;
    cancelAnimation();
    current = note;
    notes.forEach((item) => { item.dataset.active = String(item === note); });
    previews.forEach((node) => { node.hidden = node !== preview; });
    if (!desktop.matches || motion.matches || document.hidden || !preview.animate) return;
    animation = preview.animate([
      { opacity: 0.65, translate: "0 8px" },
      { opacity: 1, translate: "0 0" },
    ], { duration: 280, easing: "cubic-bezier(.2,.7,.3,1)" });
    const arrival = animation;
    arrival.addEventListener("finish", () => {
      if (animation === arrival) cancelAnimation();
    }, { once: true });
  }

  function update() {
    frame = null;
    if (document.hidden) return;
    const rect = directory.getBoundingClientRect();
    if (rect.bottom < 100 || rect.top > innerHeight) return;
    const geometry = notes.map((note) => ({ note, rect: note.getBoundingClientRect() }));
    const visible = (note) => geometry.some((item) => item.note === note &&
      item.rect.bottom > 100 && item.rect.top < innerHeight - 40);
    const preferred = intent === "pointer" ? pointed || focused : focused || pointed;
    if (preferred && visible(preferred)) {
      select(preferred);
      return;
    }
    const target = innerHeight * 0.5;
    const nearest = geometry.reduce((best, item) => {
      const distance = Math.abs(item.rect.top + item.rect.height / 2 - target);
      return !best || distance < best.distance ? { note: item.note, distance } : best;
    }, null);
    if (nearest) select(nearest.note);
  }

  function requestUpdate() {
    if (frame === null && !document.hidden) frame = requestAnimationFrame(update);
  }

  notes.forEach((note) => {
    note.addEventListener("pointermove", (event) => {
      if (event.pointerType === "touch") return;
      if (pointed === note && intent === "pointer") return;
      pointed = note;
      intent = "pointer";
      requestUpdate();
    });
    note.addEventListener("pointerleave", () => {
      if (pointed === note) pointed = null;
      requestUpdate();
    });
    note.addEventListener("focusin", () => {
      focused = note;
      intent = "focus";
      requestUpdate();
    });
    note.addEventListener("focusout", () => {
      if (focused === note) focused = null;
      requestUpdate();
    });
  });

  function resize() {
    cancelAnimation();
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    pointed = null;
    focused = notes.find((note) => note.contains(document.activeElement)) || null;
    directory.classList.toggle("is-preview-ready", desktop.matches);
    requestUpdate();
  }

  directory.classList.add("has-project-interaction");
  addEventListener("scroll", requestUpdate, { passive: true });
  addEventListener("resize", resize, { passive: true });
  motion.addEventListener("change", cancelAnimation);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelAnimation();
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
    } else requestUpdate();
  });
  resize();
})();
