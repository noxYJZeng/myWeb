"use strict";

(() => {
  const canvas = document.getElementById("pixel-garden");
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  const W = 720;
  const H = 500;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reduced = reducedMotion.matches;
  let visible = true;
  let frameId = null;
  let time = 0;
  let previous = 0;
  let lastDraw = 0;
  let pointer = null;
  let selectedSpecies = "all";
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

  function leaf(x, y, dx, dy, color, size = 2) {
    const length = Math.hypot(dx, dy);
    for (let i = 0; i < length; i += size) {
      const progress = i / length;
      const width = Math.sin(progress * Math.PI) * length * 0.19;
      for (let j = -width; j <= width; j += size) {
        pixel(
          x + dx * progress - (dy / length) * j,
          y + dy * progress + (dx / length) * j,
          color,
          size,
        );
      }
    }
  }

  // Cache the still layers; only repaint the low-resolution pixel display.
  const background = document.createElement("canvas");
  background.width = W;
  background.height = H;
  function makeBackground() {
    ctx.save();
    ctx.scale(W / 560, H / 450);
    ctx.fillStyle = "#06110b";
    ctx.fillRect(0, 0, W, H);
    const glow = ctx.createRadialGradient(305, 205, 10, 305, 205, 270);
    glow.addColorStop(0, "#0b2c18");
    glow.addColorStop(1, "#06110b");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);
    for (let x = 20; x < W; x += 24) {
      for (let y = 18; y < H; y += 24) pixel(x, y, "#35845135", 1);
    }
    for (let i = 0; i < 2000; i++) {
      pixel(
        random() * W,
        random() * H,
        random() > 0.5 ? "#c8d5a907" : "#00000012",
        1,
      );
    }
    // Rectangular traces and registration marks on a small electronic display.
    const traces = [
      [
        [21, 112],
        [21, 61],
        [92, 61],
        [105, 48],
        [191, 48],
      ],
      [
        [365, 43],
        [474, 43],
        [489, 58],
        [539, 58],
        [539, 129],
      ],
      [
        [24, 235],
        [24, 351],
        [39, 366],
        [66, 366],
      ],
      [
        [491, 344],
        [527, 344],
        [539, 332],
        [539, 205],
      ],
    ];
    for (const trace of traces) {
      for (let i = 1; i < trace.length; i++) {
        line(...trace[i - 1], ...trace[i], "#276a3c55", 1);
      }
      const [x, y] = trace[trace.length - 1];
      pixel(x - 2, y - 2, "#4ed68b80", 4);
      pixel(x - 1, y - 1, "#09180d", 2);
    }
    for (const [x, y] of [
      [70, 100],
      [472, 153],
      [296, 283],
      [475, 308],
    ]) {
      line(x - 4, y, x + 4, y, "#3f9b5e66", 1);
      line(x, y - 4, x, y + 4, "#3f9b5e66", 1);
    }
    for (let x = 113; x < 453; x += 10) {
      line(x, 56, x, x % 3 === 0 ? 61 : 59, "#3f9b5e55", 1);
    }
    ctx.font = "7px monospace";
    ctx.fillStyle = "#6bbc8255";
    ctx.fillText("X: 0280 / Y: 0225", 203, 72);
    ctx.fillText("ENV_01", 457, 388);
    // Pixel botanicals: fine stems, fern-like leaves, and a few seed heads.
    const plants = [
      [63, 401, -7, 125, "#344b2b"],
      [105, 406, 18, 81, "#4e6440"],
      [139, 399, -8, 104, "#3c5831"],
      [181, 406, 15, 62, "#4c6139"],
      [356, 408, -8, 81, "#425a31"],
      [400, 407, 14, 131, "#53693d"],
      [455, 400, -8, 91, "#3d5532"],
      [501, 406, 16, 149, "#374e2c"],
    ];
    for (const [x, y, bend, height, color] of plants) {
      line(x, y, x + bend, y - height, color, 2);
      for (let i = 16; i < height - 9; i += 15) {
        const stemX = x + (bend * i) / height;
        const reach = (1 - i / height) * 23 + 5;
        leaf(stemX, y - i, -reach, -reach * 0.8, color);
        leaf(stemX + 2, y - i - 5, reach * 0.85, -reach * 0.6, color);
      }
      pixel(x + bend - 1, y - height - 3, "#8b956655", 3);
    }
    // A low horizon made of individual, uneven pixels.
    for (let x = 23; x < 538; x += 4) {
      const y = 401 + Math.round(random() * 6);
      pixel(x, y, "#4c623539", 2);
      if (random() > 0.6) pixel(x + 1, y + 6, "#697e4333", 1);
    }
    ctx.restore();
    background.getContext("2d").drawImage(canvas, 0, 0);
  }

  // Distinct silhouettes and markings, rather than recoloring one sprite.
  const forms = [
    {
      id: "luna",
      name: "LUNA MOTH",
      x: 365,
      y: 185,
      scale: 4,
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
      x: 157,
      y: 138,
      scale: 3,
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
      x: 555,
      y: 255,
      scale: 3,
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
      x: 264,
      y: 329,
      scale: 2,
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
      x: 562,
      y: 114,
      scale: 2,
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
      x: 126,
      y: 292,
      scale: 2,
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
      x: 474,
      y: 338,
      scale: 2,
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
      x: 79,
      y: 193,
      scale: 2,
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
      x: 631,
      y: 323,
      scale: 2,
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
      x: 269,
      y: 87,
      scale: 2,
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
      x: 390,
      y: 355,
      scale: 1,
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
      x: 468,
      y: 115,
      scale: 2,
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

  const overviewIds = new Set([
    "luna",
    "swallowtail",
    "morpho",
    "monarch",
    "glasswing",
    "atlas",
  ]);

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

  function butterfly(form, x, y, scale, phase) {
    const flap = [1, 0.8, 0.48, 0.24, 0.48, 0.8][Math.floor(phase) % 6];
    const cellW = Math.max(1, Math.ceil(scale * flap));
    x = Math.round(x);
    y = Math.round(y);
    for (const [px, py, shade] of form.pixels) {
      ctx.fillStyle = form.palette[shade];
      const distance = Math.round(px * scale * flap);
      for (const direction of [-1, 1]) {
        ctx.fillRect(
          x + direction * distance - (direction < 0 ? cellW : 0),
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
      x,
      y + scale * 10,
      form.palette[3],
      Math.max(1, scale * bodyWidth),
    );
    line(x, y - scale * 3, x - scale * 3, y - scale * 7, form.palette[1], 1);
    line(x, y - scale * 3, x + scale * 3, y - scale * 7, form.palette[1], 1);
    pixel(x - scale * 3, y - scale * 7, form.palette[3], 1);
    pixel(x + scale * 3, y - scale * 7, form.palette[3], 1);
  }

  const motes = Array.from({ length: 32 }, () => ({
    x: 55 + random() * (W - 110),
    y: 70 + random() * (H - 140),
    phase: random() * Math.PI * 2,
    speed: 0.2 + random() * 0.35,
  }));
  function fire(t) {
    const glow = ctx.createRadialGradient(264, 374, 0, 264, 374, 72);
    glow.addColorStop(0, "#bf8a4430");
    glow.addColorStop(1, "#bf8a4400");
    ctx.fillStyle = glow;
    ctx.fillRect(192, 302, 144, 144);
    const flameRows = [
      ".....a....",
      ".....aa...",
      "....aaa...",
      "....aba...",
      "...abbaa..",
      "..aabbaa..",
      "..abbcbaa.",
      ".aabbcbaa.",
      ".abcccbba.",
      "..bbccba..",
      "...bbbb...",
    ];
    const flamePalette = { a: "#8d703f", b: "#ceaa67", c: "#ece1b2" };
    const flicker = [0, 1, 0, -1][Math.floor(t * 4) % 4];
    for (let y = 0; y < flameRows.length; y++) {
      for (let x = 0; x < flameRows[y].length; x++) {
        const color = flamePalette[flameRows[y][x]];
        if (color)
          pixel(248 + x * 3 + (y < 5 ? flicker * 3 : 0), 360 + y * 3, color, 3);
      }
    }
    line(252, 395, 278, 395, "#6e7750", 2);
    line(255, 399, 275, 399, "#4b5539", 2);
    for (let i = 0; i < 5; i++) {
      const rise = (t * 13 + i * 17) % 67;
      ctx.globalAlpha = (1 - rise / 67) * 0.65;
      pixel(265 + Math.round(Math.sin(i + t) * 9), 356 - rise, "#c9b077", 2);
    }
    ctx.globalAlpha = 1;
  }

  function render(t) {
    ctx.drawImage(background, 0, 0);
    for (const mote of motes) {
      const light = 0.3 + Math.sin(t * mote.speed + mote.phase) * 0.2;
      ctx.globalAlpha = light;
      pixel(
        mote.x + Math.round(Math.sin(t * 0.25 + mote.phase) * 4),
        mote.y + Math.round(Math.cos(t * 0.3 + mote.phase) * 5),
        "#c0d08f",
        2,
      );
      ctx.globalAlpha = 1;
    }
    // Small stepped data streams recall the original terminal animation.
    ctx.font = "7px monospace";
    ctx.fillStyle = "#46be6d40";
    for (let i = 0; i < 12; i++) {
      ctx.fillText((i + Math.floor(t * 2)) % 2 ? "01" : "10", 30, 112 + i * 9);
      ctx.fillText(
        (i + Math.floor(t * 3)) % 3 ? "1" : "0",
        W - 36,
        150 + i * 9,
      );
    }
    for (let i = 0; i < forms.length; i++) {
      const form = forms[i];
      if (selectedSpecies === "all" && !overviewIds.has(form.id)) continue;
      if (selectedSpecies !== "all" && selectedSpecies !== form.id) continue;
      const focused = selectedSpecies !== "all";
      const driftX = focused ? 6 : 11 + (i % 4) * 3;
      const driftY = focused ? 5 : 7 + (i % 3) * 3;
      let x =
        (focused ? W / 2 : form.x) +
        Math.round(
          Math.sin(t * (0.33 + i * 0.013) + i * 1.7) * driftX +
            Math.sin(t * 0.17 + i) * 3,
        );
      let y =
        (focused ? 210 : form.y) +
        Math.round(Math.sin(t * (0.51 + i * 0.019) + i * 0.9) * driftY);
      if (pointer) {
        x += Math.round((pointer.x - W / 2) * 0.02);
        y += Math.round((pointer.y - H / 2) * 0.02);
      }
      const focusedScale = form.id === "comet" || form.id === "zebra" ? 5 : 7;
      butterfly(
        form,
        x,
        y,
        focused ? focusedScale : form.scale,
        reduced ? 0 : t * form.speed + i,
      );
      if (focused) {
        ctx.fillStyle = "#83ca98";
        ctx.font = "8px monospace";
        ctx.fillText(form.name, 32, 78);
        line(32, 88, 105, 88, "#3e8c5766", 1);
      }
    }
    if (selectedSpecies === "all") {
      const extras = [
        { type: "morpho", x: 641, y: 192 },
        { type: "glasswing", x: 463, y: 347 },
        { type: "swallowtail", x: 463, y: 84 },
      ];
      for (const [i, extra] of extras.entries()) {
        const form = forms.find((form) => form.id === extra.type);
        butterfly(
          form,
          extra.x + Math.round(Math.sin(t * 0.6 + i) * 7),
          extra.y + Math.round(Math.cos(t * 0.7 + i) * 5),
          1,
          reduced ? 0 : t * 3.2 + i,
        );
      }
    }
    ctx.save();
    ctx.translate(80, 55);
    fire(t);
    ctx.restore();
  }

  function tick(now) {
    frameId = null;
    if (reduced || !visible || document.hidden) return;
    if (previous) time += Math.min(now - previous, 100) / 1000;
    previous = now;
    if (now - lastDraw >= 1000 / 12) {
      render(time);
      lastDraw = now;
    }
    frameId = requestAnimationFrame(tick);
  }
  function schedule() {
    if (frameId !== null) cancelAnimationFrame(frameId);
    frameId = null;
    previous = 0;
    if (!reduced && visible && !document.hidden)
      frameId = requestAnimationFrame(tick);
  }
  reducedMotion.addEventListener("change", (event) => {
    reduced = event.matches;
    schedule();
  });
  document.addEventListener("visibilitychange", schedule);
  new IntersectionObserver(
    (entries) => {
      visible = entries[0].isIntersecting;
      schedule();
    },
    { rootMargin: "100px" },
  ).observe(canvas);
  canvas.addEventListener("pointermove", (event) => {
    if (reduced || event.pointerType !== "mouse") return;
    const rect = canvas.getBoundingClientRect();
    pointer = {
      x: ((event.clientX - rect.left) / rect.width) * W,
      y: ((event.clientY - rect.top) / rect.height) * H,
    };
  });
  canvas.addEventListener("pointerleave", () => {
    pointer = null;
  });
  for (const button of document.querySelectorAll("[data-species]")) {
    button.addEventListener("focus", () => {
      button.scrollIntoView({ block: "nearest", inline: "nearest" });
    });
    button.addEventListener("click", () => {
      selectedSpecies = button.dataset.species;
      for (const option of document.querySelectorAll("[data-species]")) {
        option.setAttribute("aria-pressed", String(option === button));
      }
      canvas.dataset.activeSpecies = selectedSpecies;
      const form = forms.find((form) => form.id === selectedSpecies);
      document.querySelector(".pixel-species-status").textContent = form
        ? form.name
        : "ALL FORMS";
      document.querySelector(".flight-count").textContent =
        selectedSpecies === "all" ? "09 IN FLIGHT" : "01 IN VIEW";
      render(time); // Filters also work with reduced motion enabled.
    });
  }
  canvas.dataset.activeSpecies = selectedSpecies;
  makeBackground();
  render(0);
  schedule();
})();
