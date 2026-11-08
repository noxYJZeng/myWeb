"use strict";

(() => {
  const stage = document.querySelector(".garden-stage");
  if (!stage) return;
  const surfaces = [...stage.querySelectorAll(".specimen-window")].map((node, index) => {
    const canvas = node.querySelector("canvas");
    return { node, canvas, ctx: canvas.getContext("2d"), index,
      original: node.dataset.forms.split(" "), members: [], pointer: null, pointerUntil: 0 };
  });
  if (!surfaces.length || surfaces.some((surface) => !surface.ctx)) return;
  let canvas = surfaces[0].canvas;
  let ctx = surfaces[0].ctx;
  let W = canvas.width, H = canvas.height;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reduced = reducedMotion.matches;
  let visible = true;
  let frameId = null;
  let time = 0;
  let previous = 0;
  let lastDraw = 0;
  let randomState = 43;
  const random = () => {
    randomState = (randomState * 1664525 + 1013904223) >>> 0;
    return randomState / 4294967296;
  };

  function pixel(x, y, color, size = 2) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), size, size);
  }

  function line(x1, y1, x2, y2, color, size = 2) {
    const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)) / size;
    for (let i = 0; i <= steps; i++) {
      const f = steps ? i / steps : 0;
      pixel(
        Math.round((x1 + (x2 - x1) * f) / size) * size,
        Math.round((y1 + (y2 - y1) * f) / size) * size,
        color,
        size,
      );
    }
  }

  // Distinct silhouettes and markings, rather than recoloring one sprite.
  const forms = [
    {
      id: "luna",
      name: "LUNA MOTH",
      speed: 2.5,
      upper: [
        [0, 1],
        [3, -7],
        [11, -15],
        [18, -14],
        [20, -10],
        [16, -3],
        [9, 3],
        [3, 4],
      ],
      lower: [
        [1, 1],
        [9, 0],
        [13, 5],
        [11, 11],
        [7, 12],
        [8, 23],
        [6, 24],
        [4, 13],
        [2, 8],
      ],
      palette: ["#245f3a", "#60c57e", "#b4f4ae", "#e4e2a9"],
      pattern: "eyes",
    },
    {
      id: "swallowtail",
      name: "SWALLOWTAIL",
      speed: 3.2,
      upper: [
        [0, 1],
        [5, -6],
        [15, -16],
        [19, -18],
        [18, -6],
        [14, 0],
        [7, 4],
      ],
      lower: [
        [2, 0],
        [9, 1],
        [15, 4],
        [14, 10],
        [10, 11],
        [12, 19],
        [9, 18],
        [7, 11],
        [4, 12],
        [2, 7],
      ],
      palette: ["#1c3826", "#aac98a", "#e4e7aa", "#72d6ac"],
      pattern: "stripes",
    },
    {
      id: "morpho",
      name: "BLUE MORPHO",
      speed: 2.9,
      upper: [
        [0, 0],
        [2, -7],
        [9, -13],
        [15, -14],
        [20, -10],
        [21, -4],
        [18, 1],
        [10, 4],
        [2, 4],
      ],
      lower: [
        [1, 2],
        [12, 2],
        [17, 5],
        [17, 11],
        [13, 15],
        [8, 15],
        [3, 11],
      ],
      palette: ["#164b55", "#368d9c", "#77cfd5", "#b9e6df"],
      pattern: "rays",
    },
    {
      id: "monarch",
      name: "MONARCH",
      speed: 3.6,
      upper: [
        [0, 1],
        [4, -8],
        [14, -18],
        [18, -17],
        [19, -9],
        [15, -2],
        [8, 4],
      ],
      lower: [
        [1, 2],
        [9, 1],
        [14, 4],
        [15, 10],
        [11, 15],
        [6, 14],
        [2, 8],
      ],
      palette: ["#393828", "#b2844d", "#dfb36e", "#e9dfba"],
      pattern: "veins",
    },
    {
      id: "glasswing",
      name: "GLASSWING",
      speed: 4.1,
      upper: [
        [0, 0],
        [3, -9],
        [10, -20],
        [14, -20],
        [16, -14],
        [13, -4],
        [6, 4],
      ],
      lower: [
        [1, 2],
        [7, 2],
        [11, 6],
        [11, 12],
        [7, 16],
        [3, 13],
      ],
      palette: ["#72a58c", "#143923", "#245f40", "#a6d9bc"],
      pattern: "glass",
    },
    {
      id: "atlas",
      name: "ATLAS MOTH",
      speed: 2.1,
      upper: [
        [0, 1],
        [4, -6],
        [15, -13],
        [23, -12],
        [22, -7],
        [17, -5],
        [20, -1],
        [11, 5],
        [3, 4],
      ],
      lower: [
        [1, 2],
        [10, 1],
        [17, 5],
        [16, 12],
        [10, 16],
        [4, 12],
        [2, 7],
      ],
      palette: ["#574943", "#a07e68", "#c4a48a", "#e3cbb1"],
      pattern: "windows",
    },
    {
      id: "peacock",
      name: "PEACOCK BUTTERFLY",
      speed: 2.8,
      upper: [
        [0, 1],
        [3, -7],
        [9, -14],
        [16, -15],
        [21, -11],
        [20, -4],
        [14, 2],
        [6, 4],
      ],
      lower: [
        [1, 2],
        [10, 1],
        [16, 5],
        [15, 12],
        [10, 16],
        [5, 14],
        [2, 9],
      ],
      palette: ["#3c3543", "#9f655e", "#cd8e76", "#9ed8d1"],
      pattern: "peacock",
    },
    {
      id: "zebra",
      name: "ZEBRA LONGWING",
      speed: 3.8,
      upper: [
        [0, 2],
        [3, -10],
        [9, -22],
        [14, -25],
        [17, -22],
        [16, -13],
        [10, -1],
        [4, 5],
      ],
      lower: [
        [1, 3],
        [7, 2],
        [11, 7],
        [10, 15],
        [7, 22],
        [3, 19],
      ],
      palette: ["#173c2b", "#294c35", "#d2ddb0", "#e7e6c9"],
      pattern: "zebra",
    },
    {
      id: "paper-kite",
      name: "PAPER KITE",
      speed: 2.4,
      upper: [
        [0, 2],
        [2, -7],
        [7, -17],
        [13, -20],
        [18, -18],
        [20, -12],
        [18, -5],
        [11, 3],
        [3, 5],
      ],
      lower: [
        [1, 3],
        [8, 1],
        [14, 5],
        [16, 11],
        [13, 17],
        [9, 20],
        [4, 16],
        [2, 10],
      ],
      palette: ["#354d3b", "#9db39a", "#d3dfba", "#eff0d3"],
      pattern: "kite",
    },
    {
      id: "emperor",
      name: "PURPLE EMPEROR",
      speed: 3.1,
      upper: [
        [0, 1],
        [4, -6],
        [12, -15],
        [19, -18],
        [21, -12],
        [18, -3],
        [11, 3],
        [3, 5],
      ],
      lower: [
        [1, 3],
        [10, 2],
        [15, 6],
        [14, 12],
        [10, 16],
        [5, 14],
        [2, 9],
      ],
      palette: ["#343c50", "#6c668d", "#aaa0c9", "#dfdbc7"],
      pattern: "band",
    },
    {
      id: "sunset",
      name: "SUNSET MOTH",
      speed: 3.5,
      upper: [
        [0, 1],
        [5, -5],
        [16, -16],
        [22, -15],
        [21, -6],
        [14, 1],
        [6, 4],
      ],
      lower: [
        [1, 2],
        [9, 1],
        [15, 5],
        [15, 11],
        [12, 15],
        [13, 21],
        [10, 20],
        [8, 15],
        [5, 16],
        [2, 10],
      ],
      palette: ["#254e3c", "#6bc09d", "#d7b674", "#b999b8"],
      pattern: "sunset",
    },
    {
      id: "comet",
      name: "COMET MOTH",
      speed: 2.2,
      upper: [
        [0, 1],
        [4, -6],
        [12, -15],
        [19, -14],
        [22, -9],
        [17, -2],
        [9, 3],
        [3, 4],
      ],
      lower: [
        [1, 2],
        [8, 1],
        [13, 5],
        [11, 10],
        [8, 13],
        [10, 29],
        [8, 34],
        [6, 32],
        [5, 14],
        [2, 8],
      ],
      palette: ["#58633b", "#c0bd76", "#e6dba0", "#aa946b"],
      pattern: "comet",
    },
  ];

  function inside(x, y, polygon) {
    let contained = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const a = polygon[i];
      const b = polygon[j];
      if (
        a[1] > y !== b[1] > y &&
        x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]
      )
        contained = !contained;
    }
    return contained;
  }

  function shadeFor(form, x, y, edge) {
    if (edge) return (x + y * 2) % 5 === 0 ? 3 : 0;
    const vein =
      Math.abs(y + x * 0.8) < 0.75 ||
      Math.abs(y + x * 1.7 + 1) < 0.7 ||
      Math.abs(y - x * 0.8 + 1) < 0.6;
    const eye = Math.hypot(x - 10, y + 7);
    switch (form.pattern) {
      case "eyes":
        if (eye < 1.5) return 0;
        if (eye < 3.5) return 3;
        return vein ? 0 : (x + y) % 5 === 0 ? 2 : 1;
      case "stripes":
        return (x + Math.floor(y * 0.55)) % 7 < 2 ? 0 : y > 8 ? 3 : 2;
      case "rays":
        return vein ? 1 : x < 14 ? 2 : (x + y) % 3 === 0 ? 3 : 0;
      case "veins":
        return vein || (x + Math.floor(y * 0.5)) % 8 === 0
          ? 0
          : (x + y) % 7 === 0
            ? 1
            : 2;
      case "glass":
        return vein ? 0 : (x + y) % 6 === 0 ? 2 : 1;
      case "windows":
        if (Math.abs(x - 11) + Math.abs(y + 4) < 4) return 3;
        return vein ? 0 : Math.abs(y + x * 0.45 - 1) < 2 ? 2 : 1;
      case "peacock": {
        const upperEye = Math.hypot(x - 13, y + 8);
        const lowerEye = Math.hypot(x - 9, y - 9);
        const spot = Math.min(upperEye, lowerEye);
        if (spot < 1.5) return 0;
        if (spot < 3.5) return 3;
        return vein ? 0 : (x + y) % 5 === 0 ? 2 : 1;
      }
      case "zebra":
        return ((Math.floor(y + x * 0.45) % 9) + 9) % 9 < 3 ? 2 : 0;
      case "kite":
        return vein || (x * 3 + y * 2) % 11 === 0 ? 0 : x > 13 ? 1 : 2;
      case "band":
        return Math.abs(y + x * 0.42 - 2) < 2
          ? 3
          : vein
            ? 0
            : (x + y) % 5 === 0
              ? 2
              : 1;
      case "sunset":
        return vein ? 0 : y < -5 ? 1 : y < 4 ? 2 : (x + y) % 6 < 2 ? 1 : 3;
      case "comet": {
        const spot = Math.hypot(x - 11, y + 7);
        if (spot < 1.5) return 0;
        if (spot < 3) return 3;
        return y > 12 ? 1 : vein ? 0 : 2;
      }
      default:
        return 1;
    }
  }

  for (const form of forms) {
    form.pixels = [];
    const points = [...form.upper, ...form.lower];
    const minY = Math.floor(Math.min(...points.map((point) => point[1])));
    const maxY = Math.ceil(Math.max(...points.map((point) => point[1])));
    const maxX = Math.ceil(Math.max(...points.map((point) => point[0])));
    form.bounds = { minY, maxY, maxX };
    for (let y = minY; y <= maxY; y++) {
      for (let x = 1; x <= maxX; x++) {
        const polygon = inside(x, y, form.upper) ? form.upper : form.lower;
        if (!inside(x, y, polygon)) continue;
        const edge =
          !inside(x + 1, y, polygon) ||
          !inside(x - 1, y, polygon) ||
          !inside(x, y + 1, polygon) ||
          !inside(x, y - 1, polygon);
        form.pixels.push([x, y, shadeFor(form, x, y, edge)]);
      }
    }
  }

  function butterfly(form, x, y, scale, phase, rest = 0, bank = 0, attention = 0) {
    const beat = [1, 0.8, 0.48, 0.24, 0.48, 0.8][Math.floor(phase) % 6];
    const restingFlap = beat * (1 - rest) + (0.84 + Math.sin(time * 0.9) * 0.06) * rest;
    const flap = restingFlap + (1 - restingFlap) * attention;
    const cellW = Math.max(1, Math.ceil(scale * flap));
    x = Math.round(x);
    y = Math.round(y);
    for (const [px, py, shade] of form.pixels) {
      ctx.fillStyle = form.palette[shade];
      const distance = Math.round(px * scale * flap);
      for (const direction of [-1, 1]) {
        ctx.fillRect(
          x +
            Math.round(py * scale * bank) +
            Math.round(direction * distance * (1 + direction * bank)) -
            (direction < 0 ? cellW : 0),
          y + py * scale,
          cellW,
          scale,
        );
      }
    }
    const bodyWidth = form.id === "atlas" ? 2 : 1;
    line(
      x,
      y - scale * 4,
      x + Math.round(scale * 10 * bank),
      y + scale * 10,
      form.palette[3],
      Math.max(1, scale * bodyWidth),
    );
    line(x, y - scale * 3, x - scale * 3, y - scale * 7, form.palette[1], 1);
    line(x, y - scale * 3, x + scale * 3, y - scale * 7, form.palette[1], 1);
    pixel(x - scale * 3, y - scale * 7, form.palette[3], 1);
    pixel(x + scale * 3, y - scale * 7, form.palette[3], 1);
    if (rest > 0.8) {
      for (const side of [-1, 1]) {
        line(
          x,
          y + scale * 5,
          x + side * scale * 3,
          y + scale * 9,
          form.palette[0],
          1,
        );
      }
    }
  }

  const foliage = {
    laurel: ["#2b4732", "#607d50", "#8fa075", "#b1bb90"],
    silver: ["#2e4940", "#668373", "#9baa91", "#bdc2a4"],
    olive: ["#454a2f", "#7e8953", "#a8ac70", "#c4c28e"],
    blue: ["#2b4841", "#557e70", "#86a18c", "#b0bdab"],
  };
  const petals = {
    cream: ["#7c7962", "#b7ad8e", "#ded0ad", "#eee0bd"],
    blush: ["#70565e", "#a37f88", "#c8a1aa", "#e2bcc0"],
    lilac: ["#594f6d", "#8d7d9f", "#b4a0bf", "#d3bdd4"],
  };

  function laurelLeaf(x, y, dx, dy, palette, broad = 1) {
    const length = Math.hypot(dx, dy), ux = dx / length, uy = dy / length;
    const width = length * .24 * broad;
    const outline = [[0, 0], [.18, .56], [.47, 1], [.78, .66], [1, 0], [.78, -.66], [.47, -1], [.18, -.56]]
      .map(([along, across]) => [x + dx * along - uy * width * across, y + dy * along + ux * width * across]);
    const xs = outline.map(p => p[0]), ys = outline.map(p => p[1]);
    for (let py = Math.floor(Math.min(...ys)); py <= Math.ceil(Math.max(...ys)); py++) {
      for (let px = Math.floor(Math.min(...xs)); px <= Math.ceil(Math.max(...xs)); px++) {
        if (!inside(px + .5, py + .5, outline)) continue;
        const edge = [[-1, 0], [1, 0], [0, -1], [0, 1]].some(([ox, oy]) => !inside(px + .5 + ox, py + .5 + oy, outline));
        const across = (px - x) * -uy + (py - y) * ux;
        pixel(px, py, palette[edge ? 0 : across < -.5 ? 2 : 1], 1);
      }
    }
    line(x + dx * .12, y + dy * .12, x + dx * .87, y + dy * .87, palette[3], 1);
  }

  function curvePoint(points, t) {
    const s = 1 - t, [a, b, c, d] = points;
    return [s ** 3 * a[0] + 3 * s ** 2 * t * b[0] + 3 * s * t ** 2 * c[0] + t ** 3 * d[0],
      s ** 3 * a[1] + 3 * s ** 2 * t * b[1] + 3 * s * t ** 2 * c[1] + t ** 3 * d[1]];
  }
  function laurelSpray(points, palette, length, spacing, seed = 0) {
    // Arc-length spacing keeps each overlapping leaf pair on the curved branch.
    const samples = Array.from({ length: 97 }, (_, n) => curvePoint(points, n / 96));
    for (let n = 1; n < samples.length; n++) line(...samples[n - 1], ...samples[n], palette[1], 1);
    let traveled = 0, next = 10, count = 0;
    for (let n = 1; n < samples.length - 1; n++) {
      const [ax, ay] = samples[n - 1], [x, y] = samples[n];
      const segment = Math.hypot(x - ax, y - ay);
      traveled += segment;
      if (traveled < next) continue;
      next += spacing;
      const dx = (x - ax) / segment, dy = (y - ay) / segment;
      const taper = 1 - Math.max(0, n / 96 - .68) * .7;
      const reach = length * taper * (1 + Math.sin(count++ * 2.1 + seed) * .08);
      for (const side of [-1, 1]) {
        const l = reach * (side < 0 ? .88 : 1);
        laurelLeaf(x, y, (dx * .64 - dy * side * .77) * l, (dy * .64 + dx * side * .77) * l, palette);
      }
    }
    const [x, y] = points[3], near = curvePoint(points, .96);
    const distance = Math.hypot(x - near[0], y - near[1]);
    laurelLeaf(x - (x - near[0]) / distance * 3, y - (y - near[1]) / distance * 3,
      (x - near[0]) / distance * length * .65, (y - near[1]) / distance * length * .65, palette);
  }

  function blossom(x, y, radius, palette, phase = 0) {
    // Staggered, shaded petals retain a legible rosette on the small pixel buffers.
    for (const layer of [1, .62]) {
      for (let n = 0; n < 5; n++) {
        const angle = n * Math.PI * .4 + phase + (layer < 1 ? .35 : 0);
        const ux = Math.cos(angle), uy = Math.sin(angle);
        const cx = x + ux * radius * layer * .48, cy = y + uy * radius * layer * .48;
        const long = radius * layer * .56, wide = radius * layer * .38;
        for (let py = Math.floor(cy - radius * layer); py <= Math.ceil(cy + radius * layer); py++) {
          for (let px = Math.floor(cx - radius * layer); px <= Math.ceil(cx + radius * layer); px++) {
            const along = (px - cx) * ux + (py - cy) * uy;
            const across = (px - cx) * -uy + (py - cy) * ux;
            const d = along ** 2 / long ** 2 + across ** 2 / wide ** 2;
            if (d <= 1) pixel(px, py, palette[d > .7 ? 0 : across < 0 ? 3 : 2], 1);
          }
        }
      }
    }
    pixel(x - 1, y - 1, "#8c7546", 3);
    pixel(x - 1, y - 1, "#d9bd78", 2);
    pixel(x, y - 2, "#f0d59a", 1);
  }
  function flowerCluster(x, y, radius, palette, angle = 0, green = foliage.silver) {
    const dx = Math.cos(angle), dy = Math.sin(angle);
    // A small bouquet follows the wreath instead of becoming a row of dots.
    for (const side of [-1, 1]) {
      laurelLeaf(x + dx * side * radius * .4, y + dy * side * radius * .4,
        dx * side * radius * 1.8 - dy * radius * .7, dy * side * radius * 1.8 + dx * radius * .7, green, 1.3);
    }
    blossom(x + dx * radius * 1.02 - dy * radius * .35, y + dy * radius * 1.02 + dx * radius * .35, radius * .62, palette, .7);
    blossom(x - dx * radius * 1.06 - dy * radius * .2, y - dy * radius * 1.06 + dx * radius * .2, radius * .7, petals.cream, .2);
    blossom(x, y, radius, palette, .1);
    pixel(x - dy * radius * 1.15, y + dx * radius * 1.15, palette[1], 3);
    pixel(x - dy * radius * 1.15, y + dx * radius * 1.15 - 1, palette[3], 1);
  }
  function lavenderTip(x, y, dx, dy, length) {
    line(x, y, x + dx * length, y + dy * length, foliage.silver[1], 1);
    for (let n = 0; n < 6; n++) {
      const reach = length * (.48 + n * .09), span = n === 5 ? 1 : 2;
      const cx = x + dx * reach, cy = y + dy * reach;
      pixel(cx - dy * span, cy + dx * span, petals.lilac[1], 2);
      pixel(cx + dy * span, cy - dx * span, petals.lilac[2], 2);
      pixel(cx, cy - 1, petals.lilac[3], 1);
    }
  }
  function rosemarySprig(x, y, dx, dy, length) {
    line(x, y, x + dx * length, y + dy * length, "#7b7d5e", 1);
    for (let n = 1; n < 8; n++) {
      const reach = n / 8, cx = x + dx * length * reach, cy = y + dy * length * reach;
      const needle = 6 * (1.2 - reach * .4);
      for (const side of [-1, 1]) {
        line(cx, cy, cx + (dx * .55 - dy * side) * needle,
          cy + (dy * .55 + dx * side) * needle, side < 0 ? "#5d826c" : "#9baa8e", 1);
      }
    }
    blossom(x + dx * length, y + dy * length, 3, petals.lilac);
  }
  function tiedStems(x, y, size = 1) {
    line(x - 12 * size, y - 3 * size, x + 9 * size, y + 6 * size, "#938668", size);
    line(x + 12 * size, y - 3 * size, x - 9 * size, y + 6 * size, "#aca07b", size);
    for (const side of [-1, 1]) {
      line(x, y, x + side * 5 * size, y - 3 * size, "#b8b294", size);
      line(x + side * 5 * size, y - 3 * size, x + side * 7 * size, y + size, "#b8b294", size);
      line(x + side * 7 * size, y + size, x, y, "#9b967c", size);
    }
    pixel(x - size, y - size, "#d0c8a6", size * 2);
  }

  const arrangements = {
    swallowtail: { botany: "a small rosemary sprig and a single cream flower", specimens: [{ x: .50, y: .42, scale: 3 }] },
    morpho: { botany: "a silver-leaf floral wreath", specimens: [{ x: .29, y: .42, scale: 3 }, { x: .73, y: .44, scale: 2 }] },
    luna: { botany: "a full sage-green wreath with cream and blush flower clusters", specimens: [{ x: .54, y: .39, scale: 5 }] },
    atlas: { botany: "two loose wildflower stems and a few olive leaves", specimens: [{ x: .27, y: .41, scale: 3 }, { x: .74, y: .43, scale: 3 }] },
    peacock: { botany: "a small lavender sprig and a few silver-green leaves", specimens: [{ x: .30, y: .40, scale: 2 }, { x: .70, y: .40, scale: 2 }] },
    comet: { botany: "a short rosemary sprig and a pale blossom", specimens: [{ x: .50, y: .38, scale: 2 }] },
  };
  function composePlants(surface) {
    // Wreaths belong to the two large cases. Smaller cases keep loose botanical
    // accents and open space around their wings, all inside their terminals.
    switch (surface.original[0]) {
      case "swallowtail":
        rosemarySprig(47, 225, .27, -.96, 58);
        laurelLeaf(48, 220, -21, -13, foliage.silver, 1.4);
        laurelLeaf(50, 213, 20, -18, foliage.silver, 1.4);
        line(161, 222, 171, 206, foliage.silver[1], 1);
        laurelLeaf(166, 215, -9, -9, foliage.silver, 1.3);
        blossom(171, 206, 4, petals.cream);
        break;
      case "morpho":
        laurelSpray([[210, 149], [-24, 158], [-22, 12], [210, 16]], foliage.blue, 14, 15);
        laurelSpray([[210, 149], [444, 158], [442, 12], [210, 16]], foliage.silver, 14, 15, 2);
        flowerCluster(62, 130, 7, petals.lilac, .55);
        flowerCluster(358, 130, 7, petals.cream, -.55);
        blossom(210, 16, 6, petals.blush);
        flowerCluster(210, 150, 5, petals.cream);
        break;
      case "luna":
        laurelSpray([[180, 287], [18, 294], [9, 90], [99, 43]], foliage.silver, 26, 20);
        laurelSpray([[180, 287], [340, 294], [353, 96], [268, 45]], foliage.laurel, 26, 20, 2);
        laurelSpray([[99, 43], [135, 22], [184, 19], [215, 26]], foliage.silver, 15, 14, 1);
        laurelSpray([[268, 45], [254, 34], [238, 29], [215, 26]], foliage.laurel, 14, 14, 3);
        lavenderTip(55, 210, -.35, -.94, 31);
        lavenderTip(303, 208, .27, -.96, 30);
        flowerCluster(99, 43, 10, petals.cream, -.55);
        flowerCluster(268, 45, 9, petals.blush, .6);
        flowerCluster(191, 25, 7, petals.cream);
        flowerCluster(93, 260, 10, petals.blush, .55);
        flowerCluster(275, 261, 9, petals.cream, -.55);
        flowerCluster(180, 289, 8, petals.cream);
        tiedStems(180, 300);
        break;
      case "atlas":
        line(169, 157, 158, 126, foliage.olive[1], 1);
        line(169, 157, 184, 132, foliage.olive[1], 1);
        laurelLeaf(165, 145, -16, -9, foliage.olive, 1.4);
        laurelLeaf(175, 145, 13, -7, foliage.olive, 1.4);
        blossom(158, 126, 6, petals.cream);
        blossom(184, 132, 4, petals.blush);
        laurelLeaf(299, 151, 13, -9, foliage.olive, 1.3);
        break;
      case "peacock":
        lavenderTip(203, 160, .35, -.94, 39);
        lavenderTip(209, 162, .75, -.66, 31);
        lavenderTip(198, 163, -.06, -1, 24);
        laurelLeaf(203, 160, -15, -12, foliage.silver, .8);
        laurelLeaf(209, 162, 15, -8, foliage.silver, .8);
        laurelLeaf(51, 155, -18, -11, foliage.silver, 1.5);
        laurelLeaf(51, 155, 15, -14, foliage.silver, 1.5);
        blossom(49, 149, 4, petals.lilac);
        break;
      case "comet":
        rosemarySprig(29, 178, -.1, -.995, 32);
        laurelLeaf(30, 176, 13, -10, foliage.silver, 1.4);
        line(108, 178, 108, 169, foliage.silver[1], 1);
        laurelLeaf(108, 176, -8, -4, foliage.silver, 1.4);
        blossom(108, 169, 4, petals.cream);
        break;
    }
  }

  // Each terminal has its own pixel buffer, mounting marks, and one or two forms.
  function selectSurface(surface) {
    canvas = surface.canvas;
    ctx = surface.ctx;
    W = canvas.width;
    H = canvas.height;
    ctx.imageSmoothingEnabled = false;
  }
  function mount(surface, ids) {
    surface.arrangement = arrangements[ids[0]];
    surface.members = ids.map((id, index) => ({ form: forms.find((form) => form.id === id), placement: surface.arrangement.specimens[index], x: 0, y: 0, alert: 0 }));
    surface.node.dataset.forms = ids.join(" ");
    surface.canvas.setAttribute("aria-label", `Pixel specimens: ${surface.members.map((m) => m.form.name.toLowerCase()).join(" and ")}, arranged with ${surface.arrangement.botany}. Their wings move gently.`);
    surface.node.querySelector(".specimen-label").textContent = surface.members.map((m) => m.form.name).join(" · ");
    surface.node.querySelector(".specimen-titlebar").setAttribute("aria-label", `Bring ${surface.members.map((m) => m.form.name.toLowerCase()).join(" and ")} window to front; drag or use arrow keys to move`);
  }
  function makeBackground(surface) {
    selectSurface(surface);
    ctx.fillStyle = "#07130d";
    ctx.fillRect(0, 0, W, H);
    const glow = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * .7);
    glow.addColorStop(0, surface.index === 3 ? "#252b183b" : "#153d254a");
    glow.addColorStop(1, "#06120c00");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);
    for (let x = 10; x < W; x += 12) for (let y = 10; y < H; y += 12) pixel(x, y, "#64816b20", 1);
    for (let n = 0; n < W * H / 110; n++) pixel(random() * W, random() * H, "#c5d5ae08", 1);
    for (const { placement } of surface.members) {
      const x = placement.x * W, y = placement.y * H;
      line(x - 4, y, x + 4, y, "#72967a38", 1);
      line(x, y - 4, x, y + 4, "#72967a38", 1);
      line(x, 13, x, 19, "#829b7344", 1);
      pixel(x - 1, 12, "#aabb8c66", 2);
    }
    for (const [x, y, dx, dy] of [[8, 8, 1, 1], [W - 9, 8, -1, 1], [8, H - 9, 1, -1], [W - 9, H - 9, -1, -1]]) {
      line(x, y, x + dx * 7, y, "#67856c55", 1);
      line(x, y, x, y + dy * 7, "#67856c55", 1);
    }
    composePlants(surface);
    surface.background = document.createElement("canvas");
    surface.background.width = W;
    surface.background.height = H;
    surface.background.getContext("2d").drawImage(canvas, 0, 0);
  }
  function render(t, delta = .033) {
    if (reduced) t = 0;
    for (const surface of surfaces) {
      selectSurface(surface);
      ctx.drawImage(surface.background, 0, 0);
      if (surface.pointer && t > surface.pointerUntil) surface.pointer = null;
      surface.members.forEach((member, index) => {
        const form = member.form;
        const scale = member.placement.scale;
        const x = member.placement.x * W;
        const y = member.placement.y * H;
        const dx = surface.pointer ? x - surface.pointer.x : 0;
        const dy = surface.pointer ? y - surface.pointer.y : 0;
        const distance = Math.hypot(dx, dy);
        const attention = surface.pointer && !reduced ? Math.max(0, 1 - distance / (40 + scale * 12)) : 0;
        const ease = 1 - Math.exp(-delta * 3);
        member.alert += (attention - member.alert) * ease;
        member.x += (dx / (distance + 24) * attention * 2 - member.x) * ease;
        member.y += (dy / (distance + 24) * attention * 1.5 - member.y) * ease;
        const phase = surface.index * .8 + index * 1.7;
        butterfly(form,
          x + (reduced ? 0 : Math.sin(t * .7 + phase) * .6 + member.x),
          y + (reduced ? 0 : Math.sin(t * .6 + phase) * .4 + member.y),
          // Hover changes the pose, never the clock driving the wing cycle.
          scale, reduced ? 0 : t * (2.2 + form.speed * .08) + phase,
          reduced ? 0 : .9, 0, reduced ? 0 : member.alert * .55);
      });
    }
  }
  let opened = false;
  let drag = null;
  function raise(surface) {
    // Rank the six complete windows; z values stay bounded across long sessions.
    const ordered = [...surfaces].sort((a, b) => (Number(a.node.style.zIndex) || a.index + 1) - (Number(b.node.style.zIndex) || b.index + 1));
    ordered.splice(ordered.indexOf(surface), 1);
    ordered.push(surface);
    ordered.forEach((item, i) => {
      item.node.style.zIndex = i + 1;
      item.node.dataset.front = String(item === surface);
    });
  }
  function reveal() {
    const root = document.documentElement;
    if (opened || !visible || document.hidden || (root.classList.contains("intro-active") && !root.classList.contains("intro-revealing"))) return;
    opened = true;
    openingObserver.disconnect();
    if (reduced) return;
    for (const [i, surface] of surfaces.entries()) {
      surface.node.animate([
        { opacity: 0, transform: "translate(8px, 6px) scale(.97)" },
        { opacity: 1, transform: "translate(0, 0) scale(1)" },
      ], { duration: 240, delay: i * 90, easing: "steps(4, end)", fill: "backwards" });
    }
  }
  function tick(now) {
    frameId = null;
    if (reduced || !visible || document.hidden) return;
    if (previous) time += Math.min(now - previous, 100) / 1000;
    previous = now;
    if (now - lastDraw >= 1000 / 24) {
      render(time, Math.min((now - lastDraw) / 1000, .1));
      lastDraw = now;
    }
    frameId = requestAnimationFrame(tick);
  }
  function schedule() {
    reduced = reducedMotion.matches;
    if (frameId !== null) cancelAnimationFrame(frameId);
    frameId = null;
    previous = 0;
    if (reduced || document.hidden) {
      for (const surface of surfaces) {
        surface.pointer = null;
        surface.node.getAnimations().forEach((animation) => animation.cancel());
        for (const member of surface.members) member.x = member.y = member.alert = 0;
      }
      if (reduced) render(0);
    }
    reveal();
    if (!reduced && visible && !document.hidden) frameId = requestAnimationFrame(tick);
  }
  function move(surface, x, y) {
    const stageRect = stage.getBoundingClientRect();
    const w = surface.node.offsetWidth, h = surface.node.offsetHeight;
    // Dragging stays inside the collage, clear of the greeting and controls.
    x = Math.max(0, Math.min(stageRect.width - w, x));
    y = Math.max(0, Math.min(Math.max(0, stageRect.height - h), y));
    surface.node.style.left = `${x / stageRect.width * 100}%`;
    surface.node.style.top = `${y / stageRect.height * 100}%`;
  }
  for (const surface of surfaces) {
    mount(surface, surface.original);
    makeBackground(surface);
    const bar = surface.node.querySelector(".specimen-titlebar");
    bar.addEventListener("focus", () => raise(surface));
    bar.addEventListener("click", () => raise(surface));
    bar.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      raise(surface);
      const rect = surface.node.getBoundingClientRect(), bounds = stage.getBoundingClientRect();
      drag = { surface, id: event.pointerId, x: event.clientX, y: event.clientY, left: rect.left - bounds.left, top: rect.top - bounds.top };
      bar.setPointerCapture(event.pointerId);
    });
    bar.addEventListener("pointermove", (event) => {
      if (!drag || drag.surface !== surface || drag.id !== event.pointerId) return;
      move(surface, drag.left + event.clientX - drag.x, drag.top + event.clientY - drag.y);
    });
    const endDrag = () => { if (drag?.surface === surface) drag = null; };
    bar.addEventListener("pointerup", endDrag);
    bar.addEventListener("pointercancel", endDrag);
    bar.addEventListener("lostpointercapture", endDrag);
    bar.addEventListener("keydown", (event) => {
      const offsets = { ArrowLeft: [-8, 0], ArrowRight: [8, 0], ArrowUp: [0, -8], ArrowDown: [0, 8] };
      if (!offsets[event.key]) return;
      event.preventDefault();
      raise(surface);
      move(surface, surface.node.offsetLeft + offsets[event.key][0], surface.node.offsetTop + offsets[event.key][1]);
    });
    surface.canvas.addEventListener("pointermove", (event) => {
      if (reduced || event.pointerType !== "mouse") return;
      const rect = surface.canvas.getBoundingClientRect();
      surface.pointer = { x: (event.clientX - rect.left) / rect.width * surface.canvas.width, y: (event.clientY - rect.top) / rect.height * surface.canvas.height };
      surface.pointerUntil = Infinity;
    });
    surface.canvas.addEventListener("pointerdown", (event) => {
      if (reduced || event.pointerType === "mouse") return;
      const rect = surface.canvas.getBoundingClientRect();
      surface.pointer = { x: (event.clientX - rect.left) / rect.width * surface.canvas.width, y: (event.clientY - rect.top) / rect.height * surface.canvas.height };
      surface.pointerUntil = time + 1.4;
    });
    // Native clicks distinguish a tap from a page pan; touchstart cannot.
    surface.canvas.addEventListener("click", () => raise(surface));
    surface.canvas.addEventListener("pointercancel", () => { surface.pointer = null; });
    surface.canvas.addEventListener("pointerleave", () => { surface.pointer = null; });
  }
  const openingObserver = new MutationObserver(reveal);
  openingObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  reducedMotion.addEventListener("change", schedule);
  document.addEventListener("visibilitychange", schedule);
  window.addEventListener("focus", schedule);
  new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    schedule();
  }, { rootMargin: "100px" }).observe(stage);
  render(0);
  schedule();
})();
