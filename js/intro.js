"use strict";

// Run before the body is painted, so the opening starts on true black.
// Without JavaScript, with reduced motion, or on a section link, go straight in.
(() => {
  const root = document.documentElement;
  const preference = matchMedia("(prefers-reduced-motion: reduce)");
  if (preference.matches || location.hash) return;

  let frame = null;
  let stage = null;
  let revealed = false;
  let finished = false;
  const failSafe = setTimeout(finish, 7500);
  root.classList.add("intro-active");

  function reveal() {
    if (revealed) return;
    revealed = true;
    root.classList.add("intro-revealing");
    document.dispatchEvent(new Event("intro:reveal"));
  }

  function finish() {
    if (finished) return;
    finished = true;
    clearTimeout(failSafe);
    cancelAnimationFrame(frame);
    reveal();
    root.classList.remove("intro-active", "intro-revealing");
    for (const property of [
      "--intro-shade",
      "--intro-exposure",
      "--intro-saturation",
      "--intro-flare",
      "--intro-scale",
      "--intro-rise",
    ])
      root.style.removeProperty(property);
    stage?.remove();
    document.removeEventListener("keydown", onKey);
    preference.removeEventListener("change", onPreference);
    window.removeEventListener("pagehide", finish);
  }

  function onKey(event) {
    if (event.key === "Escape" || event.key === "Tab") finish();
  }
  function onPreference(event) {
    if (event.matches) finish();
  }
  document.addEventListener("keydown", onKey);
  preference.addEventListener("change", onPreference);
  window.addEventListener("pagehide", finish);

  function start() {
    if (finished) return;
    stage = document.getElementById("match-intro");
    const canvas = document.getElementById("match-canvas");
    const ctx = canvas?.getContext("2d");
    if (!ctx || !stage) return finish();
    ctx.imageSmoothingEnabled = false;

    const clamp = (n) => Math.min(1, Math.max(0, n));
    const ease = (n) => {
      const p = clamp(n);
      return p * p * (3 - 2 * p);
    };
    const mix = (a, b, p) => a + (b - a) * p;

    // A short low-light pause, then the flame brings the whole page forward.
    function illuminate(t) {
      const lowLight = ease((t - 2) / 0.3);
      const flare = ease((t - 2.3) / 0.26);
      const settle = ease((t - 2.56) / 0.7);
      const exposure =
        t < 2.3
          ? mix(0.04, 0.13, lowLight)
          : mix(mix(0.13, 1.22, flare), 1, settle);
      const arrival = 1 - Math.pow(1 - clamp((t - 2.3) / 0.65), 3);
      const warmth = ease((t - 2.3) / 0.2) * (1 - ease((t - 2.5) / 0.7));
      root.style.setProperty("--intro-shade", String(1 - ease((t - 2) / 0.42)));
      root.style.setProperty("--intro-exposure", exposure.toFixed(4));
      root.style.setProperty(
        "--intro-saturation",
        mix(mix(0.45, 1.12, flare), 1, settle).toFixed(4),
      );
      root.style.setProperty("--intro-flare", (warmth * 0.16).toFixed(4));
      root.style.setProperty("--intro-scale", mix(0.94, 1, arrival).toFixed(5));
      root.style.setProperty(
        "--intro-rise",
        `${mix(22, 0, arrival).toFixed(2)}px`,
      );
      canvas.style.opacity = String(1 - ease((t - 2.48) / 0.26));
    }
    function pixel(x, y, w, h, color) {
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(x), Math.round(y), w, h);
    }
    // Scan lines and integer coordinates keep every edge on the pixel grid.
    function polygon(points, color) {
      const min = Math.floor(Math.min(...points.map((p) => p[1])));
      const max = Math.ceil(Math.max(...points.map((p) => p[1])));
      ctx.fillStyle = color;
      for (let y = min; y < max; y++) {
        const intersections = [];
        for (let i = 0; i < points.length; i++) {
          const a = points[i];
          const b = points[(i + 1) % points.length];
          if (a[1] > y + 0.5 === b[1] > y + 0.5) continue;
          intersections.push(
            a[0] + ((y + 0.5 - a[1]) * (b[0] - a[0])) / (b[1] - a[1]),
          );
        }
        intersections.sort((a, b) => a - b);
        for (let i = 0; i + 1 < intersections.length; i += 2) {
          const left = Math.round(intersections[i]);
          ctx.fillRect(left, y, Math.round(intersections[i + 1]) - left, 1);
        }
      }
    }
    function line(x1, y1, x2, y2, color, width = 1) {
      const steps = Math.ceil(Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)));
      for (let i = 0; i <= steps; i++) {
        const p = steps ? i / steps : 0;
        pixel(mix(x1, x2, p), mix(y1, y2, p), width, width, color);
      }
    }

    function matchbox(opacity) {
      ctx.globalAlpha = opacity;
      polygon(
        [
          [39, 79],
          [69, 91],
          [69, 104],
          [39, 92],
        ],
        "#26352b",
      );
      polygon(
        [
          [69, 91],
          [113, 78],
          [113, 91],
          [69, 104],
        ],
        "#4b3c2f",
      );
      polygon(
        [
          [39, 79],
          [82, 67],
          [113, 78],
          [69, 91],
        ],
        "#7a7860",
      );
      polygon(
        [
          [44, 79],
          [82, 69],
          [107, 78],
          [70, 88],
        ],
        "#b7b296",
      );
      line(40, 79, 69, 90, "#a09a78");
      line(70, 91, 112, 79, "#87775a");
      polygon(
        [
          [73, 93],
          [109, 82],
          [109, 88],
          [73, 99],
        ],
        "#28251f",
      );
      for (let x = 75; x < 108; x += 3) {
        const y = 94 - (x - 75) * 0.305;
        pixel(x, y, 1, 1, "#9a7250");
        pixel(x + 1, y + 2, 1, 1, "#76553d");
      }
      // A tiny butterfly printed on the paper label.
      polygon(
        [
          [74, 77],
          [74, 74],
          [78, 76],
          [81, 79],
          [77, 81],
        ],
        "#364e3d",
      );
      polygon(
        [
          [82, 78],
          [84, 74],
          [88, 73],
          [87, 77],
          [84, 81],
        ],
        "#364e3d",
      );
      line(81, 77, 81, 82, "#51634b");
      ctx.globalAlpha = 1;
    }

    function glow(x, y, strength, t, spread = 1) {
      const pulse = 0.94 + Math.sin(t * 13) * 0.06;
      const radius = Math.ceil((25 * spread) / 2) * 2;
      for (let py = -radius; py <= radius; py += 2) {
        for (let px = -radius; px <= radius; px += 2) {
          const distance = (px * px + py * py * 0.85) / (260 * spread * spread);
          if (distance > 2.3) continue;
          ctx.globalAlpha = Math.exp(-distance * 2) * 0.105 * strength * pulse;
          pixel(x + px, y + py - 4, 2, 2, "#d4934e");
        }
      }
      ctx.globalAlpha = 1;
    }

    const flameFrames = [
      [
        [-1, 0],
        [-4, -3],
        [-4, -7],
        [-2, -10],
        [-1, -15],
        [1, -12],
        [2, -8],
        [4, -5],
        [3, -2],
        [1, 0],
      ],
      [
        [-1, 0],
        [-4, -3],
        [-3, -8],
        [0, -12],
        [1, -16],
        [2, -11],
        [2, -8],
        [4, -5],
        [3, -2],
        [1, 0],
      ],
      [
        [-1, 0],
        [-3, -3],
        [-4, -6],
        [-2, -10],
        [-3, -14],
        [0, -12],
        [2, -8],
        [3, -5],
        [3, -2],
        [1, 0],
      ],
      [
        [-1, 0],
        [-4, -3],
        [-3, -7],
        [0, -11],
        [0, -14],
        [2, -12],
        [3, -8],
        [4, -4],
        [2, -1],
        [1, 0],
      ],
    ];
    function flame(x, y, strength, t, scale = 1) {
      const points = flameFrames[Math.floor(t * 9) % flameFrames.length];
      const shape = (form) =>
        form.map(([px, py]) => [
          x + (px + Math.sin(t * 11) * 0.3 * (-py / 16)) * strength * scale,
          y + py * strength * scale,
        ]);
      ctx.globalAlpha = strength;
      polygon(shape(points), "#9d5b2c");
      polygon(
        shape([
          [-1, 0],
          [-3, -3],
          [-2, -7],
          [0, -11],
          [1, -7],
          [2, -4],
          [2, -2],
          [1, 0],
        ]),
        "#dba15b",
      );
      polygon(
        shape([
          [-1, -1],
          [-1, -5],
          [0, -7],
          [1, -4],
          [1, -1],
        ]),
        "#f0d3a0",
      );
      pixel(x - 1, y, 3, 1, "#b76d36");
      ctx.globalAlpha = 1;
    }

    function render(t, motionTime) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const appear = ease((t - 0.18) / 0.45);
      if (!appear) return;
      ctx.save();
      ctx.translate(0, 28);
      const strike = clamp((t - 0.82) / 0.35);
      const lift = ease((t - 1.17) / 0.48);
      const burn = ease((t - 1.12) / 0.3);
      let x = mix(73, 107, strike * strike);
      let y = mix(94, 83, strike * strike);
      x = mix(x, 110, lift);
      y = mix(y, 57, lift);
      const angle = mix(0.38, 0.7, lift);

      const flare = ease((t - 2.26) / 0.29);
      glow(x, y - 4, burn * (1.2 + flare * 4), motionTime, 1.25 + flare * 2);
      matchbox(appear * mix(0.68, 0.24, lift) * (1 - flare));
      ctx.globalAlpha = appear * (1 - flare * 0.7);
      const endX = x + Math.cos(angle) * 42;
      const endY = y + Math.sin(angle) * 42;
      line(x + 1, y + 1, endX, endY, "#716047", 2);
      line(x + 1, y, endX, endY - 1, "#c0a273");
      line(x + 1, y, x + 7, y + 3, burn ? "#b47741" : "#a58a60", 2);
      pixel(x - 2, y - 2, 4, 4, burn ? "#a97141" : "#794937");
      pixel(x - 1, y - 2, 2, 1, burn ? "#dfb078" : "#9b5f42");
      ctx.globalAlpha = 1;

      // Small embers follow the initial strike.
      const sparkTime = t - 1.13;
      if (sparkTime > 0 && sparkTime < 0.52) {
        const p = sparkTime / 0.52;
        const sparks = [
          [-13, -9],
          [5, -16],
          [15, -6],
          [-8, 8],
          [18, 3],
          [1, -10],
        ];
        ctx.globalAlpha = (1 - p) * 0.85;
        for (let i = 0; i < sparks.length; i++) {
          const [vx, vy] = sparks[i];
          pixel(
            104 + vx * p,
            84 + vy * p + p * p * 8,
            i % 3 === 0 ? 2 : 1,
            1,
            i % 2 ? "#e7bd7c" : "#b9773f",
          );
        }
        ctx.globalAlpha = 1;
      }
      if (burn)
        flame(
          Math.round(x),
          Math.round(y - 2),
          burn,
          motionTime,
          1.7 + flare * 2.8,
        );
      ctx.restore();
    }

    let began = null;
    let lastFrame = -1;
    function tick(now) {
      if (finished) return;
      began ??= now;
      const elapsed = (now - began) / 1000;
      // Give the lit match, flare, and settling light more time to register.
      // Keep the strike and the flame's flicker at their original speed.
      const t = elapsed <= 1.65 ? elapsed : 1.65 + (elapsed - 1.65) / 1.5;
      if (t >= 2) reveal();
      if (now - lastFrame > 1000 / 24) {
        render(t, elapsed);
        lastFrame = now;
      }
      if (revealed) illuminate(t);
      if (t >= 3.65) return finish();
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
