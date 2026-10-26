"use strict";

// Native photo links are the fallback. The enhanced view turns a single leaf
// at a time, and opens the original print only when its photograph is clicked.
(() => {
  const entries = [...document.querySelectorAll(".photo-entry")];
  const canvas = document.querySelector("#album-canvas");
  document.querySelector("#year").textContent = new Date().getFullYear();
  if (!entries.length || !canvas || !window.PixelAlbum) return;

  const renderer = new window.PixelAlbum(canvas);
  const scene = document.querySelector(".album-scene");
  const pages = document.querySelector(".album-pages");
  const filters = [...document.querySelectorAll(".photo-filter")];
  const picker = document.querySelector(".location-picker");
  const mapDots = [...picker.querySelectorAll(".location-map-dot")];
  const mapName = picker.querySelector(".location-map-name");
  const mapCoordinates = picker.querySelector(".location-coordinates");
  const mapDock = document.querySelector(".map-dock");
  const mapToggle = mapDock.querySelector(".map-toggle");
  const mapScroll = mapDock.querySelector(".location-scroll");
  const mapWindow = picker.querySelector(".location-map-window");
  const mapSheet = picker.querySelector(".location-map-sheet");
  const zoomButtons = [...picker.querySelectorAll("[data-map-zoom]")];
  const zoomLevels = [1, 1.6, 2.4];
  let zoomIndex = 0,
    panX = 0,
    panY = 0,
    mapDrag = null;
  let toggleActivated = false,
    suppressMapOpen = false,
    mapDismissing = false;
  let mapCloseTimer = null,
    mapHideTimer = null;
  mapScroll.inert = true;
  const cover = document.querySelector(".album-cover");
  const previous = document.querySelector(".album-previous");
  const next = document.querySelector(".album-next");
  const close = document.querySelector(".album-close");
  const status = document.querySelector(".album-status");
  const viewer = document.querySelector(".photo-viewer");
  let visible = entries;
  let current = -1;
  let busy = false;
  let touch = null;
  let ignoreClickUntil = 0;
  let opener = null;
  let bodyStyle = null;

  function lockControls() {
    previous.disabled = busy || current < 0;
    next.disabled = busy || !visible.length;
    cover.disabled = close.disabled = busy;
    filters.forEach((button) => {
      button.disabled = busy;
    });
    scene.dataset.turning = String(busy);
    scene.setAttribute("aria-busy", String(busy));
  }

  async function ready(entry) {
    if (!entry) return;
    const image = entry.querySelector("img");
    image.loading = "eager";
    try {
      await image.decode();
    } catch {
      /* The native link remains usable. */
    }
  }

  function settle() {
    const entry = visible[current] || null;
    entries.forEach((item) => {
      item.hidden = item !== entry;
    });
    pages.classList.remove("is-turning");
    cover.hidden = current >= 0;
    close.hidden = current < 0;
    next.setAttribute(
      "aria-label",
      current < 0
        ? "Open album"
        : current === visible.length - 1
          ? "Close album"
          : "Next page",
    );
    previous.setAttribute(
      "aria-label",
      current === 0 ? "Close album" : "Previous page",
    );
    status.textContent =
      current < 0
        ? `Cover · ${visible.length} photograph${visible.length === 1 ? "" : "s"}`
        : `Page ${String(current + 1).padStart(2, "0")} / ${String(visible.length).padStart(2, "0")}`;
    scene.dataset.page = current < 0 ? "cover" : String(current + 1);
    renderer.render(entry, current, visible);
    lockControls();
    void ready(visible[current + 1]);
  }

  async function turnTo(index, direction, fromOverride = null) {
    if (busy || index < -1 || index >= visible.length) return;
    const focused = document.activeElement;
    busy = true;
    lockControls();
    const from = fromOverride || {
      entry: visible[current] || null,
      index: current,
    };
    const to = { entry: visible[index] || null, index };
    const focusWasCover = focused === cover;
    const focusWasClose = focused === close;
    try {
      await Promise.all([ready(from.entry), ready(to.entry)]);
      cover.hidden = true;
      pages.classList.add("is-turning");
      await renderer.turn(from, to, direction, visible);
      current = index;
    } finally {
      busy = false;
      settle();
      if (focusWasCover || focusWasClose) next.focus({ preventScroll: true });
      else if (filters.includes(focused) && !mapScroll.inert)
        focused.focus({ preventScroll: true });
    }
  }

  function advance(direction) {
    if (busy || viewer.open) return;
    if (current < 0) {
      if (direction > 0) void turnTo(0, 1);
    } else {
      const target = current + direction;
      void turnTo(target >= visible.length ? -1 : target, direction);
    }
  }

  function applyMapTransform() {
    const scale = zoomLevels[zoomIndex];
    const limitX = (mapWindow.clientWidth * (scale - 1)) / 2;
    const limitY = (mapWindow.clientHeight * (scale - 1)) / 2;
    panX = Math.max(-limitX, Math.min(limitX, panX));
    panY = Math.max(-limitY, Math.min(limitY, panY));
    mapSheet.style.setProperty("--map-scale", scale);
    mapSheet.style.setProperty("--map-pan-x", `${panX}px`);
    mapSheet.style.setProperty("--map-pan-y", `${panY}px`);
    mapWindow.dataset.zoomed = String(zoomIndex > 0);
    picker.querySelector(".map-zoom-level").textContent = `${scale}×`;
    picker.querySelector(".map-drag-hint").textContent = zoomIndex
      ? "Drag to explore"
      : "Zoom to explore";
    zoomButtons[0].disabled = zoomIndex === 0;
    zoomButtons[1].disabled = zoomIndex === zoomLevels.length - 1;
  }

  function centerMapLocation() {
    const dot = mapDots.find((item) => item.classList.contains("is-current"));
    const scale = zoomLevels[zoomIndex];
    panX = dot
      ? (0.5 - parseFloat(dot.style.getPropertyValue("--pin-x")) / 100) *
        mapWindow.clientWidth *
        scale
      : 0;
    panY = dot
      ? (0.5 - parseFloat(dot.style.getPropertyValue("--pin-y")) / 100) *
        mapWindow.clientHeight *
        scale
      : 0;
    applyMapTransform();
  }

  function openMap(fromClick = false) {
    if (mapDismissing && !fromClick) return;
    mapDismissing = false;
    clearTimeout(mapCloseTimer);
    clearTimeout(mapHideTimer);
    suppressMapOpen = false;
    toggleActivated ||= fromClick;
    mapScroll.hidden = false;
    mapScroll.inert = false;
    // Measure the rolled state before starting the paper's unroll transition.
    void mapScroll.offsetHeight;
    mapDock.dataset.open = "true";
    mapToggle.setAttribute("aria-expanded", "true");
    mapToggle.setAttribute("aria-label", "Photo map, open");
    if (zoomIndex) centerMapLocation();
    else applyMapTransform();
  }

  function closeMap(returnFocus = false) {
    if (mapDock.dataset.open !== "true") return;
    clearTimeout(mapCloseTimer);
    clearTimeout(mapHideTimer);
    toggleActivated = false;
    mapDismissing = true;
    suppressMapOpen = true;
    mapDock.dataset.open = "false";
    mapToggle.setAttribute("aria-expanded", "false");
    mapToggle.setAttribute("aria-label", "Open photo map");
    mapScroll.inert = true;
    if (returnFocus) mapToggle.focus({ preventScroll: true });
    // Programmatic focus must not reopen a dismissed scroll; a new hover can.
    if (!mapDock.matches(":hover")) suppressMapOpen = false;
    mapHideTimer = setTimeout(
      () => {
        mapScroll.hidden = true;
        mapDismissing = false;
        if (!mapDock.matches(":hover")) suppressMapOpen = false;
      },
      matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 350,
    );
  }

  function scheduleMapClose(fromPointer = false) {
    clearTimeout(mapCloseTimer);
    mapCloseTimer = setTimeout(
      () => {
        if (
          !mapDock.matches(":hover") &&
          (fromPointer || !mapDock.contains(document.activeElement))
        )
          closeMap(mapScroll.contains(document.activeElement));
      },
      fromPointer ? 140 : 280,
    );
  }

  mapDock.addEventListener("pointerenter", (event) => {
    clearTimeout(mapCloseTimer);
    if (event.pointerType === "mouse" && !suppressMapOpen) openMap();
  });
  mapDock.addEventListener("pointerleave", (event) => {
    suppressMapOpen = false;
    if (event.pointerType !== "touch" && !mapDrag) scheduleMapClose(true);
  });
  mapDock.addEventListener("focusin", () => {
    clearTimeout(mapCloseTimer);
    if (!suppressMapOpen) openMap();
  });
  mapDock.addEventListener("focusout", (event) => {
    if (!mapDock.contains(event.relatedTarget)) {
      suppressMapOpen = false;
      scheduleMapClose();
    }
  });
  mapToggle.addEventListener("click", () => {
    if (toggleActivated && mapDock.dataset.open === "true") closeMap(true);
    else openMap(true);
  });
  mapScroll.addEventListener("dblclick", (event) => {
    if (event.target.closest("button, a, input, select, textarea")) return;
    event.preventDefault();
    event.stopPropagation();
    closeMap(true);
  });
  picker
    .querySelector(".map-dismiss")
    .addEventListener("click", () => closeMap(true));
  document.addEventListener("pointerdown", (event) => {
    if (mapDock.dataset.open === "true" && !mapDock.contains(event.target))
      closeMap();
  });
  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      !viewer.open &&
      mapDock.dataset.open === "true"
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
      closeMap(true);
    }
  });
  zoomButtons.forEach((button) =>
    button.addEventListener("click", () => {
      zoomIndex = Math.max(
        0,
        Math.min(
          zoomLevels.length - 1,
          zoomIndex + Number(button.dataset.mapZoom),
        ),
      );
      centerMapLocation();
    }),
  );
  mapWindow.addEventListener("pointerdown", (event) => {
    if (!zoomIndex || event.button !== 0) return;
    mapDrag = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      panX,
      panY,
    };
    mapWindow.setPointerCapture(event.pointerId);
    mapWindow.dataset.dragging = "true";
    event.preventDefault();
  });
  mapWindow.addEventListener("pointermove", (event) => {
    if (!mapDrag || event.pointerId !== mapDrag.id) return;
    panX = mapDrag.panX + event.clientX - mapDrag.x;
    panY = mapDrag.panY + event.clientY - mapDrag.y;
    applyMapTransform();
  });
  function releaseMapDrag(event) {
    if (!mapDrag || event.pointerId !== mapDrag.id) return;
    mapDrag = null;
    mapWindow.dataset.dragging = "false";
    if (
      event.pointerType !== "touch" &&
      !mapDock.contains(document.elementFromPoint(event.clientX, event.clientY))
    )
      scheduleMapClose(true);
  }
  mapWindow.addEventListener("pointerup", releaseMapDrag);
  mapWindow.addEventListener("pointercancel", releaseMapDrag);
  new ResizeObserver(applyMapTransform).observe(mapWindow);

  function showMapLocation(button) {
    const key = button?.dataset.place || "all";
    const previousKey =
      mapDots.find((dot) => dot.classList.contains("is-current"))?.dataset
        .place || "all";
    mapDots.forEach((dot) =>
      dot.classList.toggle("is-current", dot.dataset.place === key),
    );
    mapName.textContent = key === "all" ? "World map" : button.dataset.label;
    mapCoordinates.textContent =
      key === "all" ? `${mapDots.length} places` : button.dataset.coordinates;
    if (zoomIndex && key !== previousKey) centerMapLocation();
  }

  filters.forEach((button) => {
    const matching =
      button.dataset.place === "all"
        ? entries
        : entries.filter(
            (entry) => entry.dataset.place === button.dataset.place,
          );
    button.addEventListener("click", () => {
      if (busy) return;
      // A location change is a new action, not the delayed click from a page tap.
      ignoreClickUntil = 0;
      const from = { entry: visible[current] || null, index: current };
      visible = matching;
      picker.querySelector(".location-current").textContent =
        button.dataset.label;
      picker.querySelector(".location-current-count").textContent = String(
        matching.length,
      );
      filters.forEach((item) =>
        item.setAttribute("aria-pressed", String(item === button)),
      );
      mapToggle.querySelector(".map-toggle-place").textContent =
        button.dataset.label;
      if (button.dataset.place === "all") zoomIndex = 0;
      showMapLocation(button);
      applyMapTransform();
      // Return the photograph to view as soon as a location is chosen.
      closeMap(true);
      const retained = visible.indexOf(from.entry);
      if (current < 0 && button.dataset.place !== "all") {
        void turnTo(0, 1, from);
      } else if (current < 0 || retained >= 0) {
        current = retained;
        settle();
      } else {
        void turnTo(0, 1, from);
      }
    });
    button.addEventListener("pointerenter", () => showMapLocation(button));
    button.addEventListener("focus", () => showMapLocation(button));
  });

  function restoreMapLocation() {
    showMapLocation(
      filters.find((button) => button.getAttribute("aria-pressed") === "true"),
    );
  }
  picker.addEventListener("pointerleave", restoreMapLocation);
  picker.addEventListener("focusout", (event) => {
    if (!picker.contains(event.relatedTarget)) restoreMapLocation();
  });

  // All city choices stay visible; native buttons support touch and keyboard.
  picker.addEventListener("keydown", (event) => {
    const keys = [
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "Home",
      "End",
    ];
    if (!filters.includes(document.activeElement) || !keys.includes(event.key))
      return;
    event.preventDefault();
    event.stopPropagation();
    const index = filters.indexOf(document.activeElement);
    const target =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? filters.length - 1
          : (index +
              (["ArrowLeft", "ArrowUp"].includes(event.key) ? -1 : 1) +
              filters.length) %
            filters.length;
    filters[target].focus();
  });

  cover.addEventListener("click", () => advance(1));
  previous.addEventListener("click", () => advance(-1));
  next.addEventListener("click", () => advance(1));
  close.addEventListener("click", () => {
    void turnTo(-1, -1);
  });
  document.addEventListener("keydown", (event) => {
    if (
      viewer.open ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.target.closest("input, textarea, select, [contenteditable=true]") ||
      event.target.closest(".map-dock") ||
      !["ArrowLeft", "ArrowRight"].includes(event.key)
    )
      return;
    event.preventDefault();
    advance(event.key === "ArrowLeft" ? -1 : 1);
  });

  scene.addEventListener(
    "touchstart",
    (event) => {
      touch =
        !busy && event.touches.length === 1
          ? {
              x: event.touches[0].clientX,
              y: event.touches[0].clientY,
              startedAt: performance.now(),
            }
          : null;
    },
    { passive: true },
  );
  scene.addEventListener(
    "touchend",
    (event) => {
      if (!touch || !event.changedTouches.length) return;
      const end = event.changedTouches[0];
      const dx = end.clientX - touch.x,
        dy = end.clientY - touch.y;
      const duration = performance.now() - touch.startedAt;
      touch = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.25) {
        ignoreClickUntil = performance.now() + 400;
        advance(dx < 0 ? 1 : -1);
      } else if (
        Math.abs(dx) < 12 &&
        Math.abs(dy) < 12 &&
        duration < 400 &&
        !event.target.closest("button, input, select, textarea")
      ) {
        const direction = directionOnPaper(end.clientX, end.clientY);
        const photo = visible[current]
          ?.querySelector(".photo-open")
          .getBoundingClientRect();
        const onPhoto =
          photo &&
          end.clientX >= photo.left &&
          end.clientX <= photo.right &&
          end.clientY >= photo.top &&
          end.clientY <= photo.bottom;
        if (direction && !onPhoto) {
          // Use the finger's actual position; mobile browsers can retarget a
          // paper-margin tap to the nearby image link. Suppress that later click.
          ignoreClickUntil = performance.now() + 400;
          advance(direction);
        } else if (direction && onPhoto) {
          ignoreClickUntil = 0;
        }
      }
    },
    { passive: true },
  );
  scene.addEventListener(
    "touchcancel",
    () => {
      touch = null;
    },
    { passive: true },
  );
  scene.addEventListener(
    "click",
    (event) => {
      if (performance.now() < ignoreClickUntil) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    true,
  );

  function directionOnPaper(clientX, clientY) {
    if (busy || viewer.open || current < 0) return 0;
    const rect = scene.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * renderer.g.width;
    const y = ((clientY - rect.top) / rect.height) * 330;
    // Match the actual spread, including the endpaper on the first page.
    const hinge = renderer.g.hinge;
    if (y < 24 || y > 294 || x < hinge - 192 || x > hinge + 192) return 0;
    return x < hinge ? -1 : 1;
  }
  function pageDirection(event) {
    if (event.target.closest("a, button, input, select, textarea")) return 0;
    return directionOnPaper(event.clientX, event.clientY);
  }
  scene.addEventListener(
    "pointermove",
    (event) => {
      const direction = pageDirection(event);
      if (direction)
        scene.dataset.pageDirection = direction < 0 ? "previous" : "next";
      else delete scene.dataset.pageDirection;
    },
    { passive: true },
  );
  scene.addEventListener("pointerleave", () => {
    delete scene.dataset.pageDirection;
  });
  scene.addEventListener("click", (event) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.altKey ||
      event.shiftKey ||
      performance.now() < ignoreClickUntil
    )
      return;
    const selection = document.getSelection();
    if (selection && !selection.isCollapsed) return;
    const direction = pageDirection(event);
    if (direction) {
      event.preventDefault();
      delete scene.dataset.pageDirection;
      advance(direction);
    }
  });

  entries.forEach((entry) => {
    const link = entry.querySelector(".photo-open");
    link.addEventListener("click", (event) => {
      if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        !viewer.showModal
      )
        return;
      event.preventDefault();
      if (busy || entry !== visible[current]) return;
      opener = link;
      const image = viewer.querySelector(".viewer-image");
      image.dataset.rotation = entry.dataset.rotation || "0";
      image.alt = entry.querySelector("img").alt;
      image.src = link.href;
      viewer.querySelector(".viewer-title").textContent =
        entry.querySelector(".photo-place").textContent;
      const stamp = entry.querySelector("time");
      const date = viewer.querySelector(".viewer-date");
      date.textContent = stamp?.dataset.label || "";
      date.dateTime = stamp?.dateTime || "";
      date.hidden = !stamp;
      viewer.querySelector(".viewer-count").textContent =
        `${current + 1} / ${visible.length}`;
      bodyStyle = document.body.getAttribute("style");
      document.body.style.overflow = "hidden";
      viewer.showModal();
      // The lighter shares the dialog's top layer so it stays visible.
      const lighter = document.querySelector(".lighter-cursor");
      if (lighter) viewer.append(lighter);
    });
  });
  viewer
    .querySelector(".viewer-close")
    .addEventListener("click", () => viewer.close());
  viewer.addEventListener("close", () => {
    if (bodyStyle === null) document.body.removeAttribute("style");
    else document.body.setAttribute("style", bodyStyle);
    const lighter = viewer.querySelector(".lighter-cursor");
    if (lighter) document.body.append(lighter);
    opener?.focus({ preventScroll: true });
  });
  viewer.addEventListener("keydown", (event) => {
    if (["ArrowLeft", "ArrowRight"].includes(event.key)) event.preventDefault();
  });
  const stage = viewer.querySelector(".viewer-stage");
  stage.addEventListener("click", (event) => {
    if (event.target === stage) viewer.close();
  });

  document.body.classList.add("album-enhanced");
  for (const control of [
    canvas,
    cover,
    previous,
    next,
    document.querySelector(".album-controls"),
    mapDock,
  ])
    control.hidden = false;
  settle();
})();
