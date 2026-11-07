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

  function leaf(x, y, dx, dy, color, size = 2) {
    const length = Math.hypot(dx, dy);
    for (let i = 0; i < length; i += size) {
      const progress = i / length;
      const width = Math.sin(progress * Math.PI) * length * .19;
      for (let j = -width; j <= width; j += size) {
        pixel(x + dx * progress - dy / length * j, y + dy * progress + dx / length * j, color, size);
      }
    }
  }
  function fern(x, y, height, bend, size = 2) {
    line(x, y, x + bend, y - height, "#435a38", size);
    for (let rise = height * .15; rise < height * .92; rise += height * .1) {
      const stem = x + bend * rise / height;
      const reach = (1 - rise / height) * height * .19 + 3;
      leaf(stem, y - rise, -reach, -reach * .68, "#354e35", size);
      leaf(stem + size, y - rise - height * .035, reach * .85, -reach * .6, "#526847", size);
    }
  }
  function flower(x, y, color = "#c8bda3", size = 2) {
    for (const [dx, dy] of [[0, -2], [2, -1], [2, 1], [0, 2], [-2, 1], [-2, -1]]) pixel(x + dx * size, y + dy * size, color, size + 1);
    pixel(x, y, "#b99d60", size + 1);
    pixel(x, y - size, "#dfd3aa", size);
  }
  function sprig(x, y, height, bend, color, size = 2) {
    line(x, y, x + bend, y - height, "#546b43", size);
    leaf(x + bend * .4, y - height * .4, -height * .24, -height * .19, "#516843", size);
    leaf(x + bend * .65, y - height * .65, height * .2, -height * .16, "#6c8050", size);
    flower(x + bend, y - height, color, size);
  }
  function rosemary(x, y, height, bend, size = 2) {
    // Woody stems and paired, narrow needles with a silver upper edge.
    line(x, y, x + bend, y - height, "#756b4b", size);
    for (const [side, reach] of [[-1, .68], [1, .84], [0, 1]]) {
      const rootY = y - height * .18;
      const tipX = x + bend + side * height * .15;
      const tipY = y - height * reach;
      line(x + bend * .18, rootY, tipX, tipY, "#4f6b53", size);
      for (let p = .14; p < 1; p += .1) {
        const sx = x + bend * .18 + (tipX - x - bend * .18) * p;
        const sy = rootY + (tipY - rootY) * p;
        const length = height * .065 * (1.2 - p * .4);
        line(sx, sy, sx - length * .65, sy - length, "#5f836d", size);
        line(sx + size, sy, sx + length * .75, sy - length * .9, "#91a18a", size);
      }
      pixel(tipX, tipY, "#b4b5cb", size + 1);
    }
  }
  function sageLeaf(x, y, dx, dy, size) {
    const length = Math.hypot(dx, dy);
    for (let i = 0; i < length; i += size) {
      const p = i / length, width = Math.sin(p * Math.PI) * length * .34;
      for (let j = -width; j <= width; j += size) {
        const light = (Math.round(i / size) + Math.round(j / size)) % 4 === 0;
        pixel(x + dx * p - dy / length * j, y + dy * p + dx / length * j, light ? "#9ca88e" : "#637f6d", size);
      }
    }
    line(x, y, x + dx * .85, y + dy * .85, "#b0baa033", size);
  }
  function sage(x, y, height, bend, size = 2) {
    // Broad, softly mottled leaves and tiered violet flower whorls.
    line(x, y, x + bend, y - height, "#7a8961", size);
    for (const rise of [.18, .35, .52]) {
      const sx = x + bend * rise, sy = y - height * rise;
      const reach = height * .28 * (1 - rise * .55);
      sageLeaf(sx, sy, -reach, -reach * .42, size);
      sageLeaf(sx + size, sy - size * 3, reach * .9, -reach * .55, size);
    }
    for (let i = 0; i < 5; i++) {
      const sx = x + bend * (1 - i * .055), sy = y - height + i * size * 5;
      const spread = size * (i < 2 ? 1 : 2);
      pixel(sx - spread, sy, "#8f7f9f", size * 2);
      pixel(sx + size, sy - size, "#b5a3be", size * 2);
      pixel(sx, sy - size * 2, "#d0bbca", size);
    }
  }
  function lavender(x, y, height, bend, size = 2) {
    for (const [side, reach] of [[-1, .78], [0, 1], [1, .86]]) {
      const tipX = x + bend + side * height * .14, tipY = y - height * reach;
      line(x, y, tipX, tipY, "#738164", size);
      leaf(x, y - height * .12, side ? side * height * .16 : -height * .08, -height * .34, "#687d64", size);
      for (let i = 0; i < 6; i++) {
        const yy = tipY + i * size * 3;
        pixel(tipX - (i % 2 ? size : 0), yy, i % 2 ? "#b39bc7" : "#8779a3", size * 2);
        pixel(tipX + size, yy - size, "#cbb7d2", size);
      }
    }
  }
  function thyme(x, y, width, size = 2) {
    // A low creeping stem, round paired leaves, and blush flower clusters.
    const heightAt = (step) => y - step * .1 - Math.sin(step / width * Math.PI) * size * 5;
    for (let step = 0; step < width; step += size * 3) {
      const next = Math.min(width, step + size * 3);
      line(x + step, heightAt(step), x + next, heightAt(next), "#526e4c", size);
    }
    for (let step = 0; step < width; step += size * 6) {
      const sy = heightAt(step), n = Math.round(step / (size * 6));
      pixel(x + step, sy - size * 3, "#82936b", size * 2);
      pixel(x + step + size, sy + size, "#5d7f59", size * 2);
      if (n % 3 !== 1) {
        const tip = sy - size * [6, 10, 5, 8][n % 4];
        line(x + step, sy, x + step - size, tip, "#697b58", size);
        flower(x + step - size, tip, n % 3 ? "#c7bca7" : "#b99aa9", size);
      }
    }
  }
  const arrangements = {
    swallowtail: { botany: "flowering sage and rosemary", specimens: [{ x: .43, y: .35, scale: 3 }] },
    morpho: { botany: "one sweeping rosemary branch", specimens: [{ x: .28, y: .43, scale: 3 }, { x: .74, y: .45, scale: 3 }] },
    luna: { botany: "a crescent of sage, rosemary, and pale flowers", specimens: [{ x: .54, y: .39, scale: 5 }] },
    atlas: { botany: "a shared bouquet of thyme and cream flowers", specimens: [{ x: .27, y: .41, scale: 3 }, { x: .74, y: .43, scale: 3 }] },
    peacock: { botany: "lavender spikes and soft sage leaves", specimens: [{ x: .25, y: .35, scale: 2 }, { x: .74, y: .41, scale: 2 }] },
    comet: { botany: "a curved flowering rosemary stem", specimens: [{ x: .57, y: .40, scale: 2 }] },
  };
  function stem(points, color = "#687e58", size = 1) {
    for (let n = 1; n < points.length; n++) line(...points[n - 1], ...points[n], color, size);
  }
  function needleStem(points, length = 10, size = 1) {
    stem(points, "#647359", size);
    for (let n = 1; n < points.length; n++) {
      const [ax, ay] = points[n - 1], [bx, by] = points[n];
      const distance = Math.hypot(bx - ax, by - ay);
      const dx = (bx - ax) / distance, dy = (by - ay) / distance;
      for (let step = 7; step < distance; step += 8) {
        const x = ax + dx * step, y = ay + dy * step;
        const reach = length * (.78 + ((n + Math.round(step)) % 3) * .11);
        line(x, y, x - dy * reach + dx * 4, y + dx * reach + dy * 4, "#577a61", size);
        line(x, y, x + dy * reach + dx * 5, y - dx * reach + dy * 5, "#8ca08a", size);
      }
    }
  }
  function violetSpike(x, y, size = 1) {
    line(x, y + 19 * size, x, y - 3 * size, "#798364", size);
    for (let n = 0; n < 5; n++) {
      pixel(x - (n % 2 ? 2 : 1) * size, y + n * 4 * size, "#9b87ad", size * 2);
      pixel(x + size, y + n * 4 * size - size, "#c4adcc", size);
    }
  }
  function composePlants(surface) {
    // Coordinates belong to each complete plate, including the specimen poses.
    // No shared corner decorations: stems, flowers, and wings share a silhouette.
    switch (surface.original[0]) {
      case "swallowtail":
        sage(137, 224, 156, 20, 2);
        rosemary(50, 221, 67, 8, 1);
        stem([[50, 221], [38, 188], [44, 151]], "#788461");
        sageLeaf(39, 188, -17, -10, 1);
        sageLeaf(40, 184, 14, -13, 1);
        flower(44, 149, "#d3c9ad", 2);
        thyme(53, 228, 89, 1);
        break;
      case "morpho":
        needleStem([[24, 148], [103, 135], [206, 147], [298, 133], [397, 143]], 9);
        stem([[116, 135], [120, 111]], "#738568");
        stem([[309, 136], [310, 115]], "#738568");
        flower(81, 125, "#b0a1b8", 1);
        flower(229, 135, "#d0c5a7", 1);
        flower(375, 128, "#c0b3c4", 1);
        break;
      case "luna": {
        const left = [[184, 288], [114, 273], [64, 227], [38, 171], [42, 112], [65, 63], [101, 35]];
        const right = [[184, 288], [253, 273], [302, 230], [326, 177], [327, 117], [307, 63], [271, 37]];
        stem(left, "#758164");
        for (const [x, y, dx, dy] of [[113, 272, -30, -12], [111, 270, 15, -28], [64, 226, -21, -23], [65, 225, 23, -20], [39, 170, -18, -21], [40, 169, 22, -18], [43, 112, -14, -20], [44, 110, 25, -12], [66, 63, 1, -22]]) sageLeaf(x, y, dx, dy, 1);
        needleStem(right, 12);
        violetSpike(102, 27, 2);
        flower(270, 35, "#d4c5ad", 2);
        flower(283, 46, "#b7a7ae", 1);
        stem([[183, 285], [179, 255], [191, 221], [194, 182]], "#657754");
        leaf(181, 252, -22, -16, "#708260", 1);
        leaf(185, 239, 19, -14, "#657d5e", 1);
        fern(247, 286, 62, -12, 1);
        flower(166, 281, "#c8a4ae", 2);
        flower(202, 283, "#d1c4a4", 2);
        thyme(140, 294, 81, 1);
        break;
      }
      case "atlas":
        stem([[39, 152], [121, 151], [188, 138], [298, 146]], "#857958");
        sprig(180, 151, 96, 4, "#d5c8a7", 1);
        flower(184, 55, "#d5c8a7", 2);
        stem([[182, 99], [171, 72]], "#7d805b");
        stem([[183, 115], [193, 88]], "#7d805b");
        flower(172, 71, "#c6ab9d", 1);
        flower(193, 87, "#dbd0b4", 1);
        sageLeaf(68, 145, -24, -10, 1);
        sageLeaf(109, 149, 19, -16, 1);
        sageLeaf(235, 141, 18, -19, 1);
        sageLeaf(287, 145, -13, -17, 1);
        thyme(105, 155, 62, 1);
        thyme(206, 153, 51, 1);
        break;
      case "peacock":
        stem([[35, 157], [94, 151], [133, 164], [222, 147]], "#6c7b5b");
        lavender(131, 155, 99, -2, 2);
        sageLeaf(128, 154, -35, -20, 1);
        sageLeaf(136, 157, 29, -17, 1);
        leaf(71, 152, -18, -13, "#74876b", 1);
        leaf(192, 152, 21, -15, "#617d64", 1);
        thyme(105, 164, 59, 1);
        break;
      case "comet":
        needleStem([[24, 175], [19, 125], [27, 77], [38, 37], [50, 24]], 7);
        sageLeaf(22, 151, 17, -12, 1);
        sageLeaf(24, 163, 21, -8, 1);
        flower(50, 24, "#d6c9a8", 2);
        flower(36, 58, "#bba4b5", 1);
        thyme(31, 176, 73, 1);
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
      raise(surface);
      if (reduced || event.pointerType === "mouse") return;
      const rect = surface.canvas.getBoundingClientRect();
      surface.pointer = { x: (event.clientX - rect.left) / rect.width * surface.canvas.width, y: (event.clientY - rect.top) / rect.height * surface.canvas.height };
      surface.pointerUntil = time + 1.4;
    });
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
