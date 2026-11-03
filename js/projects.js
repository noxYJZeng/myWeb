"use strict";

// The work directory is a normal list of links. Its shared desktop preview is
// optional: touch layouts and script failures keep thumbnails beside each link.
(() => {
  const directory = document.querySelector(".project-index");
  if (!directory) return;
  const rows = [...directory.querySelectorAll(".project-row")];
  const previews = new Map([...directory.querySelectorAll("[data-preview]")]
    .map((node) => [node.dataset.preview, node]));
  const track = [...directory.querySelectorAll(".project-stage-track > i")];
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

  function select(row, animate = true) {
    if (!desktop.matches || current === row) return;
    const preview = previews.get(row.dataset.project);
    if (!preview) return;
    cancelAnimation();
    current = row;
    rows.forEach((item, index) => {
      item.dataset.active = String(item === row);
      track[index]?.classList.toggle("is-active", item === row);
    });
    previews.forEach((node) => { node.hidden = node !== preview; });
    if (!animate || motion.matches || document.hidden || !preview.animate) return;
    // One short arrival, without stacking outgoing images or blurring text.
    animation = preview.animate([
      { opacity: 0.55, translate: "0 8px" },
      { opacity: 1, translate: "0 0" },
    ], { duration: 240, easing: "cubic-bezier(.2,.7,.3,1)" });
    const arrival = animation;
    arrival.addEventListener("finish", () => {
      if (animation === arrival) cancelAnimation();
    }, { once: true });
  }

  function update() {
    frame = null;
    if (!desktop.matches || document.hidden) return;
    if (focused || pointed) {
      select(intent === "pointer" ? pointed || focused : focused || pointed);
      return;
    }
    const rect = directory.getBoundingClientRect();
    if (rect.bottom < 100 || rect.top > innerHeight) return;
    const target = innerHeight * 0.5;
    const nearest = rows.reduce((best, row) => {
      const rect = row.getBoundingClientRect();
      const distance = Math.abs(rect.top + rect.height / 2 - target);
      return !best || distance < best.distance ? { row, distance } : best;
    }, null);
    if (nearest) select(nearest.row);
  }

  function requestUpdate() {
    if (desktop.matches && frame === null && !document.hidden) {
      frame = requestAnimationFrame(update);
    }
  }

  rows.forEach((row) => {
    row.addEventListener("pointerenter", (event) => {
      if (event.pointerType === "touch") return;
      pointed = row;
      intent = "pointer";
      requestUpdate();
    });
    row.addEventListener("pointerleave", () => {
      if (pointed === row) pointed = null;
      requestUpdate();
    });
    row.addEventListener("focusin", () => {
      focused = row;
      intent = "focus";
      requestUpdate();
    });
    row.addEventListener("focusout", () => {
      if (focused === row) focused = null;
      requestUpdate();
    });
  });

  function resize() {
    cancelAnimation();
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    directory.classList.toggle("is-preview-ready", desktop.matches);
    if (!desktop.matches) {
      rows.forEach((row) => { delete row.dataset.active; });
      current = pointed = focused = null;
    } else {
      focused = rows.find((row) => row.contains(document.activeElement)) || null;
      if (!current) select(focused || rows[0], false);
      requestUpdate();
    }
  }

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
