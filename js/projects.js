"use strict";

// A tactile 3D index built from the readable, grouped project notes below it.
// The catalog provides the same selection for keyboard and assistive technology.
(() => {
  const index = document.querySelector(".project-index");
  if (!index) return;
  const directory = index.querySelector(".project-directory");
  const groups = [...directory.querySelectorAll(".project-group")];
  const notes = groups.flatMap((group) => [...group.querySelectorAll(".project-note")]);
  if (!notes.length || !CSS.supports("transform-style", "preserve-3d")) return;
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const coarse = matchMedia("(hover: none), (pointer: coarse)");
  const thickness = [4.6, 2, 3.2, 2.8, 1.3, 6];
  const items = notes.map((note, n) => ({
    note, n, key: note.dataset.project,
    title: note.querySelector("h4").textContent.replace(/↗/g, "").replace(/\s+/g, " ").trim(),
    group: note.closest(".project-group").querySelector("h3").textContent,
    image: note.querySelector(".project-thumb").getAttribute("src"),
    stack: note.querySelector(".project-stack").textContent,
  }));
  const element = (tag, name, text) => {
    const node = document.createElement(tag);
    if (name) node.className = name;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const gallery = element("div", "paper-gallery");
  const stage = element("div", "paper-stage");
  const scene = element("div", "paper-scene");
  const hint = element("p", "paper-hint");
  const count = element("span", "paper-position");
  const below = element("div", "paper-below");
  const catalog = element("div", "paper-catalog");
  catalog.setAttribute("role", "tablist");
  catalog.setAttribute("aria-label", "Projects by subject");
  const details = element("div", "paper-details");
  let current = -1;
  let opened = false;
  let visible = false;
  let frame = null;
  let driftX = 0, driftY = 0;
  let touch = null;
  let ignoreClickUntil = 0;
  const cards = [], tabs = [];

  groups.forEach((group) => {
    const column = element("div", "paper-catalog-group");
    column.setAttribute("role", "presentation");
    const heading = element("h3", "", group.querySelector("h3").textContent);
    heading.setAttribute("aria-hidden", "true");
    column.append(heading);
    items.filter((item) => item.group === group.querySelector("h3").textContent).forEach((item) => {
      const tab = element("button", "paper-tab", item.title);
      tab.type = "button";
      tab.id = `paper-tab-${item.key}`;
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-label", `${item.group}: ${item.title}`);
      tab.setAttribute("aria-controls", `paper-info-${item.key}`);
      tab.dataset.paperIndex = item.n;
      tab.addEventListener("click", () => select(item.n));
      tab.addEventListener("focus", () => select(item.n));
      tabs[item.n] = tab;
      column.append(tab);
    });
    catalog.append(column);
  });
  items.forEach((item) => {
    // This visual mirror is operated through the accessible catalog above.
    const card = element("div", "paper-card");
    card.dataset.paperIndex = item.n;
    card.dataset.kind = item.key;
    card.setAttribute("aria-hidden", "true");
    card.style.setProperty("--paper-depth", `${thickness[item.n]}px`);
    ["shadow", "edge-back", "edge-mid"].forEach((layer) => card.append(element("span", `paper-${layer}`)));
    const face = element("span", "paper-face");
    face.append(element("span", "paper-code", `${String(item.n + 1).padStart(2, "0")} / ${item.group}`));
    face.append(element("span", "paper-title", item.title));
    const art = element("span", "paper-art");
    const img = element("img");
    img.src = item.image;
    img.alt = "";
    img.draggable = false;
    art.append(img);
    face.append(art, element("span", "paper-imprint", item.stack));
    card.append(face);
    card.addEventListener("pointermove", (event) => {
      if (event.pointerType !== "touch" && !coarse.matches) select(item.n);
    });
    card.addEventListener("click", () => {
      if (performance.now() >= ignoreClickUntil) select(item.n);
    });
    cards.push(card);
    scene.append(card);
  });
  stage.append(scene, hint, count);
  below.append(catalog, details);
  gallery.append(stage, below);

  function select(n, focus = false) {
    n = Math.max(0, Math.min(items.length - 1, n));
    if (current !== n) {
      current = n;
      cards.forEach((card, i) => {
        card.dataset.selected = String(i === n);
        // Order complete sheets, including their shadows and backing planes.
        // Shared 3D depth sorting can otherwise cut a neighbor through a face.
        card.style.zIndex = i === n ? items.length + 1 : items.length - i;
      });
      tabs.forEach((tab, i) => {
        tab.tabIndex = i === n ? 0 : -1;
        tab.setAttribute("aria-selected", String(i === n));
      });
      notes.forEach((note, i) => {
        note.hidden = i !== n;
        note.dataset.active = String(i === n);
      });
      gallery.dataset.group = items[n].group;
      count.textContent = `${String(n + 1).padStart(2, "0")} / ${String(items.length).padStart(2, "0")}`;
      if (!motion.matches && notes[n].animate) {
        details.getAnimations().forEach((animation) => animation.cancel());
        details.animate([{ opacity: .65, translate: "0 7px" }, { opacity: 1, translate: "0 0" }], {
          duration: 260, easing: "cubic-bezier(.2,.7,.3,1)",
        });
      }
      requestPose();
    }
    if (focus) tabs[n].focus({ preventScroll: true });
  }
  function pose() {
    frame = null;
    const width = stage.clientWidth;
    const small = width < 640;
    const paperWidth = small ? Math.min(240, Math.max(190, width * .66)) : Math.min(320, width * .3);
    const spread = small ? width * .12 : Math.min(154, width * .135);
    const center = (items.length - 1) / 2;
    const pan = -(current - center) * (small ? 28 : 18);
    const rect = stage.getBoundingClientRect();
    const passage = motion.matches ? 0 : Math.max(-1, Math.min(1, (innerHeight * .5 - rect.top - rect.height * .5) / innerHeight));
    stage.style.setProperty("--paper-width", `${Math.round(paperWidth)}px`);
    scene.style.transform = `translate3d(${Math.round(pan + driftX)}px,${Math.round(driftY + passage * 9)}px,0) rotateX(${motion.matches ? 0 : (3 + passage * 2).toFixed(2)}deg) rotateZ(-5deg)`;
    cards.forEach((card, i) => {
      const relative = i - center;
      const active = i === current;
      const gap = active ? 0 : (i < current ? -1 : 1) * (small ? 8 : 24);
      const x = relative * spread * (opened ? 1 : .18) + gap;
      const y = -relative * (small ? 13 : 23) - (active ? (small ? 23 : 38) : 0);
      const z = -relative * 24 + (active ? 135 : 0);
      const yaw = active ? -19 : -49;
      card.style.transform = `translate3d(${Math.round(x)}px,${Math.round(y)}px,${Math.round(z)}px) rotateY(${yaw}deg) rotateZ(${active ? -1 : (i % 2 ? 1.5 : -1.5)}deg)`;
    });
  }
  function requestPose() {
    if (frame === null && !document.hidden) frame = requestAnimationFrame(pose);
  }
  catalog.addEventListener("keydown", (event) => {
    let n = current;
    if (["ArrowRight", "ArrowDown"].includes(event.key)) n = (n + 1) % items.length;
    else if (["ArrowLeft", "ArrowUp"].includes(event.key)) n = (n + items.length - 1) % items.length;
    else if (event.key === "Home") n = 0;
    else if (event.key === "End") n = items.length - 1;
    else return;
    event.preventDefault();
    select(n, true);
  });
  stage.addEventListener("pointermove", (event) => {
    if (event.pointerType === "touch" || coarse.matches || motion.matches) return;
    const rect = stage.getBoundingClientRect();
    driftX = ((event.clientX - rect.left) / rect.width - .5) * -22;
    driftY = ((event.clientY - rect.top) / rect.height - .5) * -10;
    requestPose();
  }, { passive: true });
  stage.addEventListener("pointerleave", () => {
    driftX = driftY = 0;
    requestPose();
  });
  stage.addEventListener("pointerdown", (event) => {
    if (event.pointerType !== "touch") return;
    // Use the visible contact point rather than a browser-adjusted touch target.
    const hit = document.elementFromPoint(event.clientX, event.clientY);
    touch = { x: event.clientX, y: event.clientY, n: hit?.closest(".paper-card")?.dataset.paperIndex };
    stage.setPointerCapture(event.pointerId);
  }, { passive: true });
  stage.addEventListener("pointerup", (event) => {
    if (!touch) return;
    const dx = event.clientX - touch.x, dy = event.clientY - touch.y;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.25) {
      select(current + (dx < 0 ? 1 : -1));
      ignoreClickUntil = performance.now() + 450;
    } else if (Math.abs(dx) < 12 && Math.abs(dy) < 12 && touch.n !== undefined) {
      select(Number(touch.n));
      ignoreClickUntil = performance.now() + 450;
    }
    touch = null;
  }, { passive: true });
  stage.addEventListener("pointercancel", () => { touch = null; }, { passive: true });

  // Commit the enhancement after every control and visual has been constructed.
  items.forEach((item) => {
    item.note.id = `paper-info-${item.key}`;
    item.note.setAttribute("role", "tabpanel");
    item.note.setAttribute("aria-labelledby", tabs[item.n].id);
    details.append(item.note);
  });
  index.prepend(gallery);
  directory.hidden = true;
  index.querySelector(".project-stage")?.remove();
  index.classList.add("paper-enhanced");
  function preference() {
    driftX = driftY = 0;
    details.getAnimations().forEach((animation) => animation.cancel());
    hint.textContent = coarse.matches ? "SWIPE OR TAP A SHEET" : "HOVER A SHEET TO EXPLORE";
    if (motion.matches) opened = true;
    requestPose();
  }
  const observer = new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    if (visible) {
      opened = true;
      requestPose();
    }
  }, { threshold: .15 });
  observer.observe(stage);
  addEventListener("scroll", () => { if (visible) requestPose(); }, { passive: true });
  addEventListener("resize", preference, { passive: true });
  motion.addEventListener("change", preference);
  coarse.addEventListener("change", preference);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && frame !== null) { cancelAnimationFrame(frame); frame = null; }
    if (document.hidden) details.getAnimations().forEach((animation) => animation.cancel());
    if (!document.hidden) requestPose();
  });
  select(0);
  preference();
})();
