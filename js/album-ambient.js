"use strict";

// A quiet pixel night around the album. Original photographs and page motion
// are separate DOM layers; margin art stays behind the book and its controls.
(() => {
  const preference = matchMedia("(prefers-reduced-motion: reduce)");
  const states = [...document.querySelectorAll("[data-album-art]")]
    .map((canvas) => ({
      canvas,
      ctx: canvas.getContext("2d"),
      type: canvas.dataset.albumArt,
      visible: false,
      time: 0,
    }))
    .filter((state) => state.ctx);
  if (!states.length) return;
  const viewer = document.querySelector(".photo-viewer");
  const pointer = { x: -1000, y: -1000 };
  let frame = null,
    previous = 0,
    lastPaint = 0;
  document.addEventListener(
    "pointermove",
    (event) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
    },
    { passive: true },
  );

  function pixel(c, x, y, width, height, color) {
    c.fillStyle = color;
    c.fillRect(Math.round(x), Math.round(y), width, height);
  }
  function sprite(c, rows, palette, x, y, scale = 1) {
    rows.forEach((row, dy) =>
      [...row].forEach((cell, dx) => {
        if (palette[cell])
          pixel(c, x + dx * scale, y + dy * scale, scale, scale, palette[cell]);
      }),
    );
  }
  function sprig(c, x, y, height, color, accent = "#9d9f6b") {
    for (let i = 0; i < height; i += 3) {
      pixel(c, x + Math.floor(i / 9), y - i, 1, 3, color);
      const side = i % 2 ? -1 : 1;
      pixel(c, x + Math.floor(i / 9) + side, y - i - 2, 3, 1, color);
      if (i > height - 5)
        pixel(c, x + Math.floor(i / 9), y - i - 4, 2, 2, accent);
    }
  }

  function night(c, t, w, h) {
    // Sparse stars and fireflies leave the photograph's central area quiet.
    for (let i = 0; i < 42; i++) {
      const x = Math.round((((i * 73 + 19) % 997) / 997) * w);
      const y = Math.round((((i * 137 + 31) % 613) / 613) * h * 0.76);
      if (x > w * 0.17 && x < w * 0.84 && y > h * 0.09) continue;
      c.globalAlpha = 0.2 + (Math.sin(t * 0.65 + i * 2.7) + 1) * 0.15;
      pixel(c, x, y, 1, 1, i % 5 ? "#80967b" : "#c9b57d");
      if (i % 9 === 0) {
        c.globalAlpha *= 0.35;
        pixel(c, x - 1, y, 3, 1, "#aebc8a");
        pixel(c, x, y - 1, 1, 3, "#aebc8a");
      }
    }
    c.globalAlpha = 1;
    for (let layer = 0; layer < 3; layer++) {
      const color = ["#102319", "#14291d", "#193022"][layer];
      const spread = Math.round(w * (0.18 - layer * 0.035));
      for (let x = 0; x < spread; x += 3) {
        const slope = 1 - x / spread;
        const rise =
          2 + Math.round((Math.sin(x * 0.17 + layer) + Math.cos(x * 0.31)) * 2);
        const ground = Math.round(
          h - h * (0.1 - layer * 0.015) * slope * slope - rise * slope,
        );
        pixel(c, x, ground, 3, h - ground, color);
        pixel(c, w - x - 3, ground, 3, h - ground, color);
      }
    }
    // Ferns, seed heads, and a few distant pine silhouettes at the outer edges.
    for (let side of [0, 1]) {
      c.save();
      if (side) {
        c.translate(w, 0);
        c.scale(-1, 1);
      }
      for (let i = 0; i < 7; i++) {
        const x = 3 + i * 5;
        sprig(c, x, h - 3 + (i % 3), 8 + ((i * 7) % 21), "#2a4230", "#5c6740");
      }
      for (let i = 0; i < 3; i++) {
        const x = 5 + i * 13,
          y = Math.round(h * 0.85) + i * 5;
        sprite(
          c,
          ["..a..", ".aaa.", "aaaaa", "..b.."],
          { a: "#142b20", b: "#243829" },
          x,
          y,
          2,
        );
      }
      c.restore();
    }
    for (let i = 0; i < 7; i++) {
      const side = i % 2;
      const x =
        (side ? w * 0.91 : w * 0.07) + Math.sin(t * 0.24 + i * 3) * w * 0.025;
      const y = h * (0.55 + (i % 3) * 0.12) + Math.sin(t * 0.32 + i) * 7;
      c.globalAlpha = 0.14;
      pixel(c, x - 1, y - 1, 3, 3, "#92a35c");
      c.globalAlpha = 0.35 + (Math.sin(t * 1.1 + i) + 1) * 0.2;
      pixel(c, x, y, 1, 1, i % 3 ? "#b0bd83" : "#d6b276");
    }
    c.globalAlpha = 1;
  }

  function butterfly(c, t, x, y, kind, scale = 2) {
    const palettes = [
      { a: "#344e43", b: "#67977d", c: "#a3bfa2", d: "#ded4aa", e: "#33594f" },
      { a: "#62543e", b: "#ae9361", c: "#dbcb95", d: "#f0e0af", e: "#796a4e" },
      { a: "#3e5050", b: "#708f91", c: "#b3c8b1", d: "#dddcaf", e: "#d2a26f" },
    ];
    const palette = palettes[kind];
    const spread = [0.42, 0.7, 1, 0.76, 0.5, 0.3][(Math.floor(t * 11) + 2) % 6];
    const rows =
      kind === 1
        ? [
            "...abb",
            "..abcd",
            ".abddd",
            "abcddd",
            "abbcdb",
            ".abbcb",
            "..abcb",
            "..abdb",
            "...abb",
            "....ab",
          ]
        : [
            "...abb",
            "..abcb",
            ".abcdb",
            "abcdeb",
            "abcdbb",
            ".abcbb",
            "..abbb",
            ".abcd.",
            ".abeb.",
            "..abb.",
            "...ab.",
            "...a..",
          ];
    for (const side of [-1, 1]) {
      rows.forEach((row, dy) =>
        [...row].forEach((cell, dx) => {
          if (!palette[cell]) return;
          const unit = Math.max(1, Math.round(scale * spread));
          const distance = (6 - dx) * unit;
          pixel(
            c,
            x + side * distance - (side < 0 ? unit : 0),
            y + dy * scale,
            unit,
            scale,
            palette[cell],
          );
        }),
      );
    }
    pixel(c, x - 1, y + scale * 2, 2, scale * 8, "#d1d0a4");
    pixel(c, x - 3, y - 1, 1, 4, "#9daf91");
    pixel(c, x + 2, y - 1, 1, 4, "#9daf91");
    pixel(c, x - 4, y - 2, 2, 1, "#c8cc9e");
    pixel(c, x + 2, y - 2, 2, 1, "#c8cc9e");
  }

  function moths(c, t) {
    const x = Math.round(82 + Math.sin(t * 0.34) * 39);
    const y = Math.round(40 + Math.sin(t * 0.67) * 21);
    butterfly(c, t, x, y, 0, 3);
    butterfly(
      c,
      t + 1.2,
      Math.round(156 + Math.sin(t * 0.42 + 1.2) * 28),
      Math.round(91 + Math.sin(t * 0.57 + 2) * 26),
      1,
      2,
    );
    butterfly(
      c,
      t + 0.65,
      Math.round(58 + Math.sin(t * 0.3 + 2) * 22),
      Math.round(145 + Math.sin(t * 0.51 + 1) * 14),
      2,
      2,
    );
    sprig(c, 18, 184, 24, "#476443", "#b2a77b");
    sprig(c, 33, 191, 13, "#344f39", "#c2b78a");
    sprig(c, 84, 177, 16, "#3f5940", "#b49c73");
    for (let i = 0; i < 3; i++) {
      c.globalAlpha = 0.25 + (Math.sin(t * 1.2 + i * 3) + 1) * 0.2;
      pixel(
        c,
        21 + i * 52 + Math.sin(t * 0.4 + i) * 5,
        23 + i * 40,
        2,
        2,
        "#c4bf88",
      );
    }
    c.globalAlpha = 1;
  }

  function birdPolygon(c, points, color) {
    const xs = points.map(([x]) => x),
      ys = points.map(([, y]) => y);
    for (
      let y = Math.floor(Math.min(...ys));
      y <= Math.ceil(Math.max(...ys));
      y++
    ) {
      for (
        let x = Math.floor(Math.min(...xs));
        x <= Math.ceil(Math.max(...xs));
        x++
      ) {
        let inside = false;
        for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
          const a = points[i],
            b = points[j];
          if (
            a[1] > y !== b[1] > y &&
            x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]
          )
            inside = !inside;
        }
        if (inside) pixel(c, x, y, 1, 1, color);
      }
    }
  }
  function birdLine(c, a, b, color) {
    const steps = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]));
    for (let i = 0; i <= steps; i++) {
      const p = steps ? i / steps : 0;
      pixel(c, a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p, 1, 1, color);
    }
  }
  function birdPose(t) {
    const phase = t % 24;
    const envelope = (start, end) =>
      phase > start && phase < end
        ? Math.sin(((phase - start) / (end - start)) * Math.PI) ** 2
        : 0;
    const pose = {
      offset: 0,
      lift: 0,
      preen: envelope(7, 10),
      wing: envelope(11, 13),
      peck: envelope(18, 20),
    };
    const hop = (start, end, returning) => {
      const p = (phase - start) / (end - start);
      const progress = p * p * (3 - 2 * p);
      pose.offset = 20 * (returning ? 1 - progress : progress);
      pose.lift = Math.sin(p * Math.PI) * 13;
      pose.wing = Math.sin(p * Math.PI) * 0.25;
    };
    if (phase >= 4.5 && phase < 5.4) hop(4.5, 5.4, false);
    else if (phase >= 5.4 && phase < 15.5) pose.offset = 20;
    else if (phase >= 15.5 && phase < 16.6) hop(15.5, 16.6, true);
    pose.angle = -pose.preen * 1.15 + pose.peck * 0.72 + envelope(1, 4) * 0.16;
    return pose;
  }

  function waxwing(c, t, attention) {
    const pose = birdPose(t);
    // A fixed ground anchor and a connected neck keep the bird in one place.
    // Only the head turns: never mirror the complete bird across the canvas.
    const x = Math.round(28 + pose.offset);
    const y = Math.round(
      30 - pose.lift + pose.peck * 2 + Math.sin(t * 0.85) * 0.6,
    );
    const tail = Math.round(Math.sin(t * 1.7) * 0.8);
    sprig(c, 29, 143, 20, "#3d593f", "#a6a46f");
    sprig(c, 182, 141, 25, "#3b553e", "#ac9d6f");
    sprig(c, 171, 148, 13, "#2d4936", "#b5ad7c");
    c.globalAlpha = 0.3;
    pixel(c, 65 + Math.round(pose.offset * 0.4), 129, 57, 2, "#465b3d");
    pixel(c, 52, 131, 9, 1, "#667048");
    pixel(c, 144, 130, 4, 1, "#aca26b");
    c.globalAlpha = 1;
    c.save();
    c.translate(x, y);
    c.scale(3, 3);
    birdPolygon(
      c,
      [
        [9, 22],
        [15, 25],
        [10 + tail, 29],
        [7 + tail, 33],
        [2 + tail, 31],
        [7, 27],
      ],
      "#71816c",
    );
    birdPolygon(
      c,
      [
        [2 + tail, 31],
        [7 + tail, 33],
        [8 + tail, 30],
        [4 + tail, 29],
      ],
      "#d3bb72",
    );
    const wing = pose.wing;
    if (wing > 0.02)
      birdPolygon(
        c,
        [
          [21, 14],
          [27 + wing * 2, 12 - wing * 5],
          [29 + wing * 8, 13 - wing * 5],
          [30 + wing * 3, 16],
          [24, 21],
        ],
        "#647961",
      );
    birdPolygon(
      c,
      [
        [12, 11],
        [22, 10],
        [27, 16],
        [25, 23],
        [19, 28],
        [11, 25],
        [7, 18],
      ],
      "#b8b79e",
    );
    birdPolygon(
      c,
      [
        [14, 20],
        [23, 18],
        [25, 23],
        [19, 28],
        [13, 25],
      ],
      "#d0bf94",
    );
    const folded = [
      [9, 13],
      [14, 14],
      [19, 16],
      [22, 20],
      [21, 23],
      [18, 25],
      [12, 23],
      [10, 18],
    ];
    const extended = [
      [11, 14],
      [-3, 10],
      [-8, 2],
      [-2, 0],
      [7, 4],
      [18, 10],
      [23, 17],
      [18, 23],
    ];
    birdPolygon(
      c,
      folded.map(([a, b], i) => [
        Math.round(a + (extended[i][0] - a) * wing),
        Math.round(b + (extended[i][1] - b) * wing),
      ]),
      "#82927c",
    );
    birdLine(c, [11 - wing * 12, 16 - wing * 10], [18, 23], "#bac4a9");
    birdLine(c, [14 - wing * 12, 15 - wing * 10], [21, 21], "#a6b59a");
    pixel(c, 18, 22, 1, 2, "#bc715a");
    pixel(c, 20, 21, 1, 2, "#bc715a");
    const angle = pose.angle + attention * 0.12;
    const headPoint = ([a, b]) => {
      const dx = a - 23,
        dy = b - 10;
      return [
        Math.round(23 + dx * Math.cos(angle) - dy * Math.sin(angle)),
        Math.round(
          10 + pose.peck * 4 + dx * Math.sin(angle) + dy * Math.cos(angle),
        ),
      ];
    };
    // Join the head to the chest in every preening and pecking pose.
    birdPolygon(
      c,
      [headPoint([21, 12]), headPoint([28, 13]), [26, 20], [18, 18]],
      "#b8b79e",
    );
    const head = (points, color) =>
      birdPolygon(c, points.map(headPoint), color);
    head(
      [
        [18, 7],
        [15, 0],
        [22, 3],
        [27, 6],
      ],
      "#9eaa91",
    );
    head(
      [
        [22, 4],
        [28, 5],
        [31, 10],
        [30, 15],
        [23, 15],
        [18, 11],
        [18, 7],
      ],
      "#b8b79e",
    );
    head(
      [
        [23, 8],
        [30, 8],
        [33, 10],
        [31, 12],
        [26, 11],
        [23, 10],
      ],
      "#24372b",
    );
    head(
      [
        [31, 10],
        [35, 11],
        [32, 12],
      ],
      "#a39a70",
    );
    const eye = headPoint([27, 9]),
      glint = headPoint([27, 8]);
    const blink = t % 5.4 > 5.12;
    pixel(c, eye[0], eye[1], 2, 1, blink ? "#8e9d81" : "#08130c");
    if (!blink) pixel(c, glint[0], glint[1], 1, 1, "#e0dec0");
    const foot = pose.lift > 1 ? 32 : Math.round((129 - y) / 3);
    birdLine(c, [19, 27], [19, foot], "#9d9d77");
    birdLine(c, [23, 26], [24, foot - 1], "#9d9d77");
    birdLine(c, [17, foot], [21, foot], "#c6b98e");
    birdLine(c, [22, foot - 1], [26, foot - 1], "#c6b98e");
    c.restore();
  }

  function paint(state) {
    const { ctx: c, canvas, time: t } = state;
    c.clearRect(0, 0, canvas.width, canvas.height);
    c.imageSmoothingEnabled = false;
    if (state.type === "night") night(c, t, canvas.width, canvas.height);
    else if (state.type === "moths") moths(c, t);
    else {
      const r = canvas.getBoundingClientRect();
      const near =
        pointer.x > r.left &&
        pointer.x < r.right &&
        pointer.y > r.top &&
        pointer.y < r.bottom;
      const target = near && !preference.matches ? 1 : 0;
      state.attention = preference.matches
        ? 0
        : (state.attention || 0) + (target - (state.attention || 0)) * 0.22;
      waxwing(c, t, state.attention);
    }
  }
  function active() {
    return (
      !document.hidden &&
      !preference.matches &&
      !viewer?.open &&
      states.some((state) => state.visible)
    );
  }
  function schedule() {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    previous = 0;
    if (preference.matches) states.forEach(paint);
    if (active()) frame = requestAnimationFrame(tick);
  }
  function tick(now) {
    frame = null;
    if (!active()) return;
    const delta = previous ? Math.min(now - previous, 120) / 1000 : 0;
    previous = now;
    states.forEach((state) => {
      if (state.visible) state.time += delta;
    });
    if (now - lastPaint >= 1000 / 12) {
      states.forEach((state) => {
        if (state.visible) paint(state);
      });
      lastPaint = now;
    }
    frame = requestAnimationFrame(tick);
  }
  function fitBackdrop() {
    const backdrop = states.find((state) => state.type === "night");
    if (backdrop) {
      backdrop.canvas.width = Math.ceil(innerWidth / 3);
      backdrop.canvas.height = Math.ceil(innerHeight / 3);
      paint(backdrop);
    }
  }
  fitBackdrop();
  window.addEventListener("resize", fitBackdrop, { passive: true });
  states.forEach(paint);
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        states.find((state) => state.canvas === entry.target).visible =
          entry.isIntersecting;
      });
      schedule();
    },
    { rootMargin: "30px" },
  );
  states.forEach((state) => observer.observe(state.canvas));
  preference.addEventListener("change", schedule);
  document.addEventListener("visibilitychange", schedule);
  viewer?.addEventListener("toggle", schedule);
  viewer?.addEventListener("close", schedule);
})();
