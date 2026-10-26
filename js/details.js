"use strict";

(() => {
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  const states = [];
  let frame = null;
  let previous = 0;
  let lastPaint = 0;

  function box(ctx, x, y, width, height, color) {
    ctx.fillStyle = color;
    ctx.fillRect(
      Math.round(x),
      Math.round(y),
      Math.round(width),
      Math.round(height),
    );
  }
  function line(ctx, x1, y1, x2, y2, color, size = 2) {
    const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)) / size;
    for (let i = 0; i <= steps; i++) {
      const p = steps ? i / steps : 0;
      box(
        ctx,
        Math.round((x1 + (x2 - x1) * p) / size) * size,
        Math.round((y1 + (y2 - y1) * p) / size) * size,
        size,
        size,
        color,
      );
    }
  }
  function polygon(ctx, points, color, cell = 2) {
    const minX = Math.floor(Math.min(...points.map((p) => p[0])));
    const maxX = Math.ceil(Math.max(...points.map((p) => p[0])));
    const minY = Math.floor(Math.min(...points.map((p) => p[1])));
    const maxY = Math.ceil(Math.max(...points.map((p) => p[1])));
    for (let y = minY; y <= maxY; y += cell) {
      for (let x = minX; x <= maxX; x += cell) {
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
        if (inside) box(ctx, x, y, cell, cell, color);
      }
    }
  }
  function backdrop(ctx, width, height) {
    box(ctx, 0, 0, width, height, "#09170f");
    for (let x = 12; x < width; x += 18) {
      for (let y = 12; y < height; y += 18) box(ctx, x, y, 1, 1, "#305c3a55");
    }
  }
  function book(ctx, t) {
    box(ctx, 42, 118, 156, 5, "#163821");
    polygon(
      ctx,
      [
        [42, 39],
        [112, 47],
        [190, 39],
        [190, 116],
        [112, 125],
        [42, 116],
      ],
      "#3f7149",
    );
    polygon(
      ctx,
      [
        [48, 32],
        [112, 41],
        [112, 116],
        [48, 107],
      ],
      "#adb89b",
    );
    polygon(
      ctx,
      [
        [112, 41],
        [184, 32],
        [184, 107],
        [112, 116],
      ],
      "#c1c8aa",
    );
    line(ctx, 112, 42, 112, 120, "#718267");
    for (let i = 0; i < 6; i++) {
      line(ctx, 58, 48 + i * 8, 101, 53 + i * 8, "#7a9371");
      line(ctx, 124, 53 + i * 8, 174, 47 + i * 8, "#8ba07d");
    }
    const turn = Math.floor((t % 6) * 3);
    if (turn < 12) {
      const edge = 170 - turn * 10;
      polygon(
        ctx,
        [
          [112, 41],
          [edge, 33 + Math.abs(edge - 112) * 0.05],
          [edge, 107],
          [112, 116],
        ],
        turn < 6 ? "#d0d4b8" : "#b5c1a0",
      );
      line(ctx, edge, 36, edge, 105, "#94a784");
    }
    box(ctx, 128, 109, 5, 22, "#bb9a61");
    box(ctx, 128, 129, 2, 4, "#bb9a61");
  }
  function camera(ctx, t) {
    const center = 110;
    const slot = { x: center - 35, y: 94, width: 70, height: 8, exitY: 97 };
    const paper = { x: center - 26, width: 52, height: 56 };
    const cycle = t % 9;
    const eject = Math.min(1, Math.max(0, (cycle - 0.55) / 2.8));
    const visiblePaper = Math.round(eject * paper.height);
    const photoY = slot.exitY - paper.height + visiblePaper;
    const photoOpacity = 1 - Math.min(1, Math.max(0, (cycle - 7.7) / 1.1));
    const develop = Math.min(1, Math.max(0, (cycle - 2) / 3));

    // One straight-on view. Horizontal edges stay level, and every part of
    // the folding body, film slot, and photograph shares the same center.
    polygon(
      ctx,
      [
        [48, 88],
        [172, 88],
        [180, 96],
        [180, 103],
        [40, 103],
        [40, 96],
      ],
      "#91a99a",
    );
    polygon(
      ctx,
      [
        [49, 88],
        [62, 50],
        [78, 63],
        [78, 88],
      ],
      "#10251b",
    );
    polygon(
      ctx,
      [
        [171, 88],
        [158, 50],
        [142, 63],
        [142, 88],
      ],
      "#10251b",
    );
    line(ctx, 62, 51, 50, 88, "#91ae98", 2);
    line(ctx, 158, 51, 170, 88, "#91ae98", 2);
    for (let i = 0; i < 3; i++) {
      const y = 65 + i * 7;
      line(ctx, 60 - i * 2, y, 76, y + 3, "#304a36", 1);
      line(ctx, 160 + i * 2, y, 144, y + 3, "#304a36", 1);
    }

    // Brown leather deck and the ribbed bellows behind the lens standard.
    polygon(
      ctx,
      [
        [62, 52],
        [158, 52],
        [172, 69],
        [48, 69],
      ],
      "#b4c3b2",
    );
    polygon(
      ctx,
      [
        [67, 55],
        [153, 55],
        [163, 65],
        [57, 65],
      ],
      "#96755a",
    );
    polygon(
      ctx,
      [
        [85, 39],
        [135, 39],
        [143, 65],
        [77, 65],
      ],
      "#0b1b13",
    );
    for (let i = 0; i < 4; i++) {
      const inset = 85 - i * 2;
      box(ctx, inset, 44 + i * 5, (center - inset) * 2, 2, "#304431");
    }

    // Raised leather-covered finder, centered rather than skewed to one side.
    polygon(
      ctx,
      [
        [83, 16],
        [137, 16],
        [149, 37],
        [145, 44],
        [75, 44],
        [71, 37],
      ],
      "#a8bca9",
    );
    polygon(
      ctx,
      [
        [87, 20],
        [133, 20],
        [141, 35],
        [79, 35],
      ],
      "#ac805b",
    );
    line(ctx, 87, 20, 133, 20, "#c29970", 1);
    box(ctx, 76, 38, 68, 6, "#c4d0ba");
    box(ctx, 78, 38, 64, 2, "#e0dfc5");
    box(ctx, 78, 43, 64, 1, "#657c68");

    // Flat chrome front panel, one lens, red release, and a small exposure dial.
    polygon(
      ctx,
      [
        [55, 62],
        [165, 62],
        [169, 66],
        [169, 91],
        [165, 95],
        [55, 95],
        [51, 91],
        [51, 66],
      ],
      "#bdcbb7",
    );
    box(ctx, 56, 66, 108, 25, "#9aaf9d");
    box(ctx, 57, 63, 106, 2, "#d5dbc2");
    box(ctx, 57, 91, 106, 2, "#c9d3bd");
    for (let x = 101; x < 121; x += 4) box(ctx, x, 61, 2, 3, "#314c38");
    polygon(
      ctx,
      [
        [102, 63],
        [118, 63],
        [125, 70],
        [125, 84],
        [118, 91],
        [102, 91],
        [95, 84],
        [95, 70],
      ],
      "#597a65",
    );
    polygon(
      ctx,
      [
        [104, 66],
        [116, 66],
        [122, 72],
        [122, 82],
        [116, 88],
        [104, 88],
        [98, 82],
        [98, 72],
      ],
      "#0a1b13",
    );
    polygon(
      ctx,
      [
        [106, 70],
        [114, 70],
        [118, 74],
        [118, 80],
        [114, 84],
        [106, 84],
        [102, 80],
        [102, 74],
      ],
      "#3b6c55",
    );
    box(ctx, 106, 74, 8, 7, "#102e23");
    box(ctx, 103, 68, 4, 4, "#b7d1b4");
    box(ctx, 117, 81, 2, 2, "#7ca58b");
    polygon(
      ctx,
      [
        [69, 73],
        [77, 73],
        [81, 77],
        [81, 83],
        [77, 87],
        [69, 87],
        [65, 83],
        [65, 77],
      ],
      "#64765b",
    );
    polygon(
      ctx,
      [
        [70, 76],
        [76, 76],
        [78, 78],
        [78, 82],
        [76, 84],
        [70, 84],
        [68, 82],
        [68, 78],
      ],
      "#b96952",
    );
    box(ctx, 70, 76, 5, 2, "#dc9977");
    box(ctx, 146, 69, 10, 12, "#58715d");
    box(ctx, 148, 71, 6, 8, "#263e2b");
    box(ctx, 151, 71, 2, 2, "#a7b997");
    if (cycle < 0.28) box(ctx, 105, 68, 4, 3, "#e6d7a2");

    box(ctx, 42, 95, 136, 9, "#9eb3a0");
    box(ctx, 44, 104, 132, 2, "#54715a");
    box(ctx, slot.x, slot.y, slot.width, slot.height, "#0a1c13");

    // The lower edge of the paper leads. Its top stays clipped inside the
    // black slot, then passes in front of the lower casing without a gap.
    ctx.save();
    ctx.beginPath();
    ctx.rect(paper.x, slot.exitY, paper.width, paper.height);
    ctx.clip();
    ctx.globalAlpha = photoOpacity;
    box(ctx, paper.x, photoY, paper.width, paper.height, "#dddcc3");
    box(ctx, paper.x + 7, photoY + 5, 38, 38, "#263a30");
    ctx.globalAlpha = photoOpacity * develop;
    box(ctx, paper.x + 7, photoY + 5, 38, 38, "#3a6650");
    polygon(
      ctx,
      [
        [91, photoY + 41],
        [102, photoY + 19],
        [113, photoY + 33],
        [121, photoY + 25],
        [129, photoY + 41],
      ],
      "#819974",
    );
    box(ctx, 119, photoY + 12, 4, 4, "#d4bd82");
    ctx.globalAlpha = photoOpacity;
    if (visiblePaper > 0)
      box(
        ctx,
        paper.x,
        slot.exitY,
        paper.width,
        Math.min(2, visiblePaper),
        "#9ba88c",
      );
    ctx.restore();

    // Only the upper roller overlaps the print; black slot ends remain visible.
    box(ctx, slot.x, slot.y, slot.width, 2, "#597b60");
    box(ctx, slot.x, slot.exitY - 1, slot.width, 1, "#07140d");

    // A separate roll of 35 mm film for the film-photography interest.
    box(ctx, 187, 60, 20, 42, "#526844");
    box(ctx, 190, 55, 14, 5, "#9da57c");
    box(ctx, 190, 71, 14, 19, "#c0aa70");
    box(ctx, 190, 102, 14, 5, "#9da57c");
    for (let y = 64; y < 101; y += 9) box(ctx, 186, y, 3, 3, "#b5bf9b");
    line(ctx, 207, 68, 215, 68, "#687e53");
    line(ctx, 215, 68, 215, 110, "#687e53");
  }
  // One continuous route includes short pen lifts between separate strokes.
  function sampleCurve(a, b, c, d, count = 20) {
    return Array.from({ length: count + 1 }, (_, i) => {
      const p = i / count;
      const q = 1 - p;
      return [0, 1].map(
        (axis) =>
          q ** 3 * a[axis] +
          3 * q * q * p * b[axis] +
          3 * q * p * p * c[axis] +
          p ** 3 * d[axis],
      );
    });
  }
  function joinedCurves(start, curves) {
    const result = [start];
    for (const [b, c, d] of curves) {
      result.push(...sampleCurve(result[result.length - 1], b, c, d).slice(1));
    }
    return result;
  }
  const leftForewing = joinedCurves(
    [168, 140],
    [
      [
        [150, 110],
        [118, 84],
        [88, 91],
      ],
      [
        [77, 105],
        [88, 130],
        [107, 141],
      ],
      [
        [128, 153],
        [151, 149],
        [168, 144],
      ],
    ],
  );
  const leftHindwing = joinedCurves(
    [167, 148],
    [
      [
        [142, 144],
        [118, 149],
        [107, 167],
      ],
      [
        [108, 186],
        [128, 197],
        [143, 183],
      ],
      [
        [152, 174],
        [154, 157],
        [167, 148],
      ],
    ],
  );
  const mirrorWing = (points) => points.map(([x, y]) => [340 - x, y]);
  const butterflyWings = [
    leftForewing,
    mirrorWing(leftForewing),
    leftHindwing,
    mirrorWing(leftHindwing),
  ];
  // Broad wet brush passes supply pigment; the wing shapes only mask the wash.
  const leftForewash = joinedCurves(
    [163, 140],
    [
      [
        [142, 125],
        [113, 100],
        [93, 101],
      ],
      [
        [88, 112],
        [100, 129],
        [120, 138],
      ],
      [
        [139, 147],
        [145, 136],
        [126, 120],
      ],
      [
        [117, 112],
        [104, 109],
        [101, 117],
      ],
      [
        [111, 133],
        [137, 140],
        [158, 141],
      ],
    ],
  );
  const leftHindwash = joinedCurves(
    [161, 153],
    [
      [
        [145, 153],
        [122, 158],
        [116, 172],
      ],
      [
        [119, 186],
        [133, 184],
        [142, 174],
      ],
      [
        [151, 161],
        [143, 156],
        [128, 169],
      ],
      [
        [123, 179],
        [137, 181],
        [150, 163],
      ],
    ],
  );
  const washPaths = [
    leftForewash,
    mirrorWing(leftForewash),
    leftHindwash,
    mirrorWing(leftHindwash),
  ];
  const detailPaths = [
    [
      [169, 123],
      [167, 143],
      [170, 178],
      [173, 144],
      [171, 123],
    ],
    joinedCurves(
      [169, 124],
      [
        [
          [164, 115],
          [158, 112],
          [157, 106],
        ],
      ],
    ),
    joinedCurves(
      [172, 124],
      [
        [
          [178, 116],
          [183, 111],
          [185, 107],
        ],
      ],
    ),
    [
      [166, 142],
      [128, 116],
      [100, 104],
    ],
    [
      [162, 146],
      [123, 135],
      [103, 119],
    ],
    [
      [164, 152],
      [137, 172],
      [122, 182],
    ],
    [
      [174, 142],
      [212, 116],
      [240, 104],
    ],
    [
      [178, 146],
      [217, 135],
      [237, 119],
    ],
    [
      [176, 152],
      [203, 172],
      [218, 182],
    ],
  ];
  const paintingStrokes = [
    ...washPaths.map((points, wing) => ({ points, wing })),
    ...detailPaths.map((points) => ({ points, wing: -1 })),
  ];
  const drawingRoute = [];
  const washRanges = [];
  let routeLength = 0;
  let lastPoint = null;
  for (const { points, wing } of paintingStrokes) {
    let start;
    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      if (lastPoint) {
        const length = Math.hypot(
          point[0] - lastPoint[0],
          point[1] - lastPoint[1],
        );
        if (length) {
          if (i === 1) start = routeLength;
          drawingRoute.push({
            from: lastPoint,
            to: point,
            start: routeLength,
            end: routeLength + length,
            ink: i > 0,
            wing,
          });
          routeLength += length;
        }
      }
      lastPoint = point;
    }
    if (wing >= 0) washRanges[wing] = { start, end: routeLength };
  }
  function insideWing(x, y, points) {
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
    return inside;
  }
  function segmentDistance(x, y, a, b) {
    const dx = b[0] - a[0],
      dy = b[1] - a[1];
    const p = Math.max(
      0,
      Math.min(
        1,
        ((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy || 1),
      ),
    );
    return Math.hypot(x - a[0] - dx * p, y - a[1] - dy * p);
  }
  function pigmentNoise(x, y, seed) {
    const value = Math.sin(x * 12.9898 + y * 78.233 + seed * 37.1) * 43758.5453;
    return value - Math.floor(value);
  }
  // Cache paper-grain pigment cells and their first contact with the wet brush.
  const watercolorCells = butterflyWings.map((wing, index) => {
    const path = washPaths[index];
    const lengths = [0];
    for (let i = 1; i < path.length; i++)
      lengths.push(
        lengths[i - 1] +
          Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]),
      );
    const cells = [];
    const xs = wing.map((p) => p[0]),
      ys = wing.map((p) => p[1]);
    for (
      let y = Math.floor((Math.min(...ys) - 3) / 2) * 2;
      y <= Math.max(...ys) + 3;
      y += 2
    ) {
      for (
        let x = Math.floor((Math.min(...xs) - 3) / 2) * 2;
        x <= Math.max(...xs) + 3;
        x += 2
      ) {
        const inside = insideWing(x + 1, y + 1, wing);
        let edge = Infinity;
        for (let i = 0; i < wing.length; i++)
          edge = Math.min(
            edge,
            segmentDistance(x, y, wing[i], wing[(i + 1) % wing.length]),
          );
        const grain = pigmentNoise(x, y, index);
        if (!inside && (edge > 2.5 || grain > 0.55)) continue;
        let firstTouch = 0.88;
        for (let i = 0; i < path.length; i++) {
          if (Math.hypot(x - path[i][0], y - path[i][1]) < 18) {
            firstTouch = Math.min(
              0.88,
              (lengths[i] / lengths[lengths.length - 1]) * 0.88,
            );
            break;
          }
        }
        const cloud =
          0.5 +
          0.25 * Math.sin(x * 0.16 + y * 0.09) +
          0.25 * Math.sin(y * 0.21 - x * 0.06);
        const warmSpot =
          index < 2 &&
          Math.hypot(x - (index ? 226 : 114), (y - 116) * 1.2) < 12;
        const color = warmSpot
          ? grain > 0.45
            ? "#ba9754"
            : "#cfb46c"
          : edge < 3
            ? "#367d70"
            : cloud > 0.6
              ? "#4b9b91"
              : cloud > 0.35
                ? "#72ac94"
                : "#98b59a";
        let alpha = inside ? 0.34 + cloud * 0.2 + grain * 0.13 : 0.09;
        if (edge < 3 && inside) alpha += 0.12;
        if (warmSpot) alpha += 0.12;
        if (grain > 0.94) alpha *= 0.18;
        cells.push({ x, y, color, alpha, touch: firstTouch });
      }
    }
    return cells;
  });
  function brush(ctx, tip, angle, lifted) {
    const direction = [Math.cos(angle), Math.sin(angle)];
    const point = (along, across = 0) => [
      Math.round(tip[0] + along * direction[0] - across * direction[1]),
      Math.round(tip[1] + along * direction[1] + across * direction[0]),
    ];
    const shape = (points, color) =>
      polygon(
        ctx,
        points.map(([a, b]) => point(a, b)),
        color,
        1,
      );
    // A page-only shadow shows the brush lifting without painting a new panel.
    ctx.save();
    ctx.beginPath();
    ctx.rect(21, 46, 276, 197);
    ctx.clip();
    ctx.globalAlpha = lifted ? 0.09 : 0.16;
    polygon(
      ctx,
      [
        [0, 2],
        [18, -4],
        [108, -1],
        [110, 4],
        [24, 8],
      ].map(([a, b]) => {
        const p = point(a, b);
        return [p[0] + 4, p[1] + (lifted ? 9 : 4)];
      }),
      "#353d2d",
      1,
    );
    ctx.restore();
    // Long faceted wooden handle, metal ferrule, individual bristles, wet tip.
    shape(
      [
        [25, -5],
        [98, -3],
        [109, -1],
        [110, 1],
        [98, 3],
        [25, 5],
      ],
      "#4b3b2b",
    );
    shape(
      [
        [28, -2],
        [99, -2],
        [108, 0],
        [99, 1],
        [28, 2],
      ],
      "#a58250",
    );
    line(ctx, ...point(33, -2), ...point(98, -2), "#d2b77c", 1);
    line(ctx, ...point(38, 2), ...point(94, 2), "#735039", 1);
    shape(
      [
        [13, -4],
        [27, -5],
        [30, -4],
        [30, 4],
        [27, 5],
        [13, 4],
      ],
      "#738174",
    );
    shape(
      [
        [15, -2],
        [28, -3],
        [28, 0],
        [15, 1],
      ],
      "#c2c9b0",
    );
    line(ctx, ...point(17, -4), ...point(17, 4), "#8e9277", 1);
    line(ctx, ...point(25, -4), ...point(25, 4), "#e1dcc0", 1);
    shape(
      [
        [0, 0],
        [5, -2],
        [13, -4],
        [15, 4],
        [6, 2],
      ],
      "#6c7953",
    );
    for (let i = -1; i <= 1; i++)
      line(
        ctx,
        ...point(4, i),
        ...point(13, i * 2),
        i ? "#9b9a6b" : "#b5b58a",
        1,
      );
    shape(
      [
        [0, 0],
        [5, -1],
        [7, 1],
        [2, 2],
      ],
      "#315a41",
    );
    line(ctx, ...point(96, -2), ...point(96, 2), "#b3b798", 1);
  }
  function painting(ctx, t) {
    const cycle = t % 12;
    const progress = Math.min(1, Math.max(0, (cycle - 0.55) / 8.1));
    const distance = progress * routeLength;
    const fade = cycle > 11.4 ? Math.max(0, (12 - cycle) / 0.6) : 1;
    ctx.save();
    // The transparent pigment bleeds into the page, without a pencil outline.
    ctx.beginPath();
    ctx.rect(21, 46, 276, 197);
    ctx.clip();
    for (let wing = 0; wing < watercolorCells.length; wing++) {
      const range = washRanges[wing];
      const amount = Math.max(
        0,
        Math.min(1, (distance - range.start) / (range.end - range.start)),
      );
      for (const cell of watercolorCells[wing]) {
        const wet = Math.max(0, Math.min(1, (amount - cell.touch) / 0.12));
        if (!wet) continue;
        ctx.globalAlpha = fade * cell.alpha * wet;
        box(ctx, cell.x, cell.y, 2, 2, cell.color);
      }
    }
    let tip = drawingRoute[0].from;
    let lifted = cycle < 0.55 || progress === 1;
    for (const segment of drawingRoute) {
      if (distance < segment.start) break;
      const amount = Math.min(
        1,
        (distance - segment.start) / (segment.end - segment.start),
      );
      tip = segment.from.map((n, axis) => n + (segment.to[axis] - n) * amount);
      lifted = !segment.ink;
      if (segment.ink && segment.wing < 0) {
        ctx.globalAlpha = fade * 0.55;
        line(ctx, ...segment.from, ...tip, "#487968", 1);
      }
      if (amount < 1) break;
    }
    ctx.restore();
    // Lift smoothly to a resting position outside the sheet, then return.
    const rest = [256, 102];
    let drawingAngle = 1;
    if (progress === 1) {
      const p = Math.min(1, (cycle - 8.65) / 0.75);
      const eased = p * p * (3 - 2 * p);
      drawingAngle = 1 - eased;
      tip = tip.map((n, i) => n + (rest[i] - n) * eased);
      lifted = true;
    } else if (cycle < 0.55) {
      const p = cycle / 0.55;
      const eased = p * p * (3 - 2 * p);
      drawingAngle = eased;
      tip = rest.map((n, i) => n + (drawingRoute[0].from[i] - n) * eased);
      lifted = true;
    }
    const lift = lifted ? 3 + Math.sin(t * 2) : 0;
    const angle = -0.56 + (-0.23 + Math.sin(t * 0.9) * 0.04) * drawingAngle;
    brush(ctx, [tip[0], tip[1] - lift], angle, lifted);
  }

  function ruins(ctx, t) {
    box(ctx, 30, 132, 182, 6, "#3b5339");
    box(ctx, 45, 127, 151, 5, "#6a7a59");
    polygon(
      ctx,
      [
        [63, 127],
        [63, 65],
        [72, 44],
        [89, 30],
        [151, 30],
        [169, 44],
        [177, 65],
        [177, 127],
      ],
      "#74816a",
    );
    for (let y = 44; y < 127; y += 15) {
      line(ctx, 64, y, 176, y, "#384e37");
      for (let x = 70 + (y % 2) * 12; x < 177; x += 24)
        line(ctx, x, y, x, y + 13, "#43583d");
    }
    polygon(
      ctx,
      [
        [92, 127],
        [92, 72],
        [99, 58],
        [109, 49],
        [131, 49],
        [141, 58],
        [148, 72],
        [148, 127],
      ],
      "#102218",
    );
    polygon(
      ctx,
      [
        [98, 127],
        [98, 74],
        [104, 63],
        [114, 55],
        [127, 55],
        [137, 64],
        [142, 74],
        [142, 127],
      ],
      "#07110b",
    );
    box(ctx, 91, 125, 59, 3, "#8e9472");
    for (const [x, y] of [
      [73, 46],
      [77, 41],
      [84, 35],
      [151, 33],
      [158, 39],
      [164, 43],
      [67, 111],
      [171, 103],
    ]) {
      box(ctx, x, y, 7, 3, "#4f7850");
      box(ctx, x + 3, y + 3, 3, 3, "#38693e");
    }
    box(ctx, 115, 112, 13, 8, "#5c6749");
    const flicker = Math.floor(t * 4) % 3;
    box(ctx, 118, 101 - flicker, 5, 10 + flicker, "#c29b5a");
    box(ctx, 119, 105, 3, 7, "#e2d09b");
    line(ctx, 48, 131, 44, 117, "#507149");
    line(ctx, 184, 130, 192, 111, "#507149");
    box(ctx, 39, 119, 6, 3, "#608156");
    box(ctx, 191, 112, 7, 3, "#608156");
  }
  // A quiet 23-second sequence with independent head, wing, tail and leg poses.
  function waxwingPose(t) {
    const phase = t % 23;
    const pose = {
      offset: 0,
      lift: 0,
      crouch: 0,
      turn: false,
      angle: 0,
      headX: 0,
      headY: 0,
      wing: 0,
      fluff: 0,
      beak: false,
      snack: false,
    };
    if (phase >= 2.4 && phase < 4.2) {
      pose.turn = true;
      pose.angle = [-0.12, 0, 0.15, 0][Math.floor((phase - 2.4) * 3) % 4];
    } else if (phase >= 4.2 && phase < 6.6) {
      pose.turn = true;
      pose.angle = [-0.9, -1.1, -1.3, -1.1][Math.floor((phase - 4.2) * 4) % 4];
      pose.headY = 2;
    } else if (phase >= 6.6 && phase < 8) {
      pose.wing = [1, 2, 1, 0][Math.floor((phase - 6.6) * 7) % 4];
      pose.crouch = pose.wing ? -2 : 1;
    }
    if (phase >= 8 && phase < 8.8) {
      const progress = (phase - 8) / 0.8;
      pose.offset = Math.round(progress * 40);
      pose.lift = Math.round(Math.sin(progress * Math.PI) * 12);
      pose.wing = progress > 0.2 && progress < 0.8 ? 2 : 0;
    } else if (phase >= 8.8 && phase < 13.4) {
      pose.offset = 40;
      if (phase < 9.2) pose.crouch = 2;
      if (phase >= 10.4 && phase < 11.6) {
        pose.fluff = [1, -1, 1, 0][Math.floor((phase - 10.4) * 8) % 4];
        pose.wing = pose.fluff > 0 ? 2 : 0;
        pose.headY = pose.fluff;
      } else if (phase >= 11.6) {
        pose.angle = Math.round(Math.sin((phase - 11.6) * 4) * 2) * 0.08;
      }
    } else if (phase >= 13.4 && phase < 15.6) {
      const reach = Math.min(1, (phase - 13.4) / 0.6);
      pose.offset = 40 + Math.round(reach * 20);
      pose.crouch = Math.round(reach * 6);
      pose.headX = Math.round(reach * 3);
      pose.headY = Math.round(reach * 7);
      pose.angle = reach * [0.75, 0.9, 1, 0.9][Math.floor(phase * 5) % 4];
      pose.beak = Math.floor(phase * 6) % 2 === 0;
    } else if (phase >= 15.6 && phase < 18) {
      pose.offset = 60;
      pose.headY = 1;
      pose.beak = Math.floor(phase * 5) % 3 === 0;
      pose.snack = phase < 16.6;
    } else if (phase >= 18 && phase < 19.2) {
      const progress = (phase - 18) / 1.2;
      pose.offset = Math.round(60 * (1 - progress));
      pose.lift = Math.round(Math.abs(Math.sin(progress * Math.PI * 2)) * 11);
      pose.wing = pose.lift > 6 ? 1 : 0;
      pose.turn = true;
    } else if (phase >= 19.2 && phase < 20.5) {
      pose.crouch = phase < 19.5 ? 2 : 0;
      pose.turn = true;
    }
    return pose;
  }

  function waxwing(ctx, t) {
    const pose = waxwingPose(t);
    const wind = Math.round(Math.sin(t * 0.65));
    line(ctx, 24, 193, 340, 153, "#617a4e", 3);
    line(ctx, 277, 161, 302 + wind, 134, "#4c6743", 2);
    if (t % 23 < 15.6) box(ctx, 299 + wind, 129, 5, 5, "#bd9e69");
    box(ctx, 309 + wind, 134, 4, 4, "#ae925e");
    polygon(
      ctx,
      [
        [280, 160],
        [291 + wind, 145],
        [305 + wind, 144],
        [295, 156],
      ],
      "#4b7950",
    );
    polygon(
      ctx,
      [
        [53, 188],
        [43 + wind, 170],
        [61 + wind, 176],
        [66, 185],
      ],
      "#416c45",
    );

    const breath = Math.floor(Math.sin(t * 1.2) * 0.8);
    const shake = pose.fluff ? Math.sign(pose.fluff) : 0;
    const originY = Math.round(
      17 - pose.offset * 0.12 - pose.lift + pose.crouch + breath,
    );
    ctx.save();
    ctx.translate(101 + pose.offset + shake, originY);
    ctx.scale(4, 4);
    const tailSwing = Math.round(
      Math.sin(t * 2) * 0.4 + (t % 3 < 0.45 ? Math.sin((t % 3) * 16) * 1.4 : 0),
    );
    polygon(
      ctx,
      [
        [9, 22],
        [15, 25],
        [10 + tailSwing, 33],
        [7 + tailSwing, 36],
        [2 + tailSwing, 34],
        [7, 27],
      ],
      "#737e68",
      1,
    );
    polygon(
      ctx,
      [
        [2 + tailSwing, 34],
        [7 + tailSwing, 36],
        [8 + tailSwing, 33],
        [4 + tailSwing, 31],
      ],
      "#d2b86a",
      1,
    );
    // A far wing opens behind the body before the nearer wing stretches.
    if (pose.wing)
      polygon(
        ctx,
        [
          [21, 14],
          [29, 7],
          [37, 8],
          [33, 16],
          [24, 21],
        ],
        "#62755f",
        1,
      );
    const body = [
      [12, 11],
      [22, 10],
      [27, 16],
      [25, 23],
      [19, 28],
      [11, 25],
      [7, 18],
    ];
    polygon(
      ctx,
      body.map(([x, y]) => [
        Math.round(17 + (x - 17) * (1 + Math.abs(pose.fluff) * 0.1)),
        y,
      ]),
      "#b4b39b",
      1,
    );
    polygon(
      ctx,
      [
        [14, 20],
        [23, 18],
        [25, 23],
        [19, 28],
        [13, 25],
      ],
      "#c8bc91",
      1,
    );

    if (pose.wing === 1) {
      polygon(
        ctx,
        [
          [11, 14],
          [-4, 9],
          [-8, 1],
          [-2, 0],
          [7, 4],
          [18, 10],
          [22, 18],
          [18, 23],
        ],
        "#8f9d86",
        1,
      );
      for (let i = 0; i < 4; i++)
        line(ctx, -5 + i * 3, 3 + i, 13 + i * 2, 17 + i, "#c1c7aa", 1);
      box(ctx, 12, 16, 1, 2, "#bc7055");
      box(ctx, 15, 18, 1, 2, "#bc7055");
    } else if (pose.wing === 2) {
      polygon(
        ctx,
        [
          [11, 15],
          [-5, 17],
          [-6, 8],
          [0, 6],
          [11, 9],
          [21, 16],
          [19, 23],
        ],
        "#84967c",
        1,
      );
      for (let i = 0; i < 4; i++)
        line(ctx, -3 + i * 2, 10 + i, 13 + i, 20 + i, "#b9c4a5", 1);
      box(ctx, 16, 21, 1, 2, "#bc7055");
      box(ctx, 18, 20, 1, 2, "#bc7055");
    } else {
      polygon(
        ctx,
        [
          [9, 13],
          [18, 14],
          [23, 19],
          [18, 24],
          [11, 23],
        ],
        "#7b8875",
        1,
      );
      line(ctx, 11, 17, 18, 23, "#aeb7a0", 1);
      line(ctx, 13, 15, 21, 21, "#aeb7a0", 1);
      box(ctx, 18, 22, 1, 2, "#bc7055");
      box(ctx, 20, 21, 1, 2, "#bc7055");
    }

    // Transform logical head pixels, keeping every drawn cell square and crisp.
    const headPoint = ([x, y]) => {
      const dx = (x - 23) * (pose.turn ? -1 : 1);
      const dy = y - 10;
      return [
        Math.round(
          23 +
            pose.headX +
            dx * Math.cos(pose.angle) -
            dy * Math.sin(pose.angle),
        ),
        Math.round(
          10 +
            pose.headY +
            dx * Math.sin(pose.angle) +
            dy * Math.cos(pose.angle),
        ),
      ];
    };
    const headShape = (points, color) =>
      polygon(ctx, points.map(headPoint), color, 1);
    if (pose.headY > 2)
      polygon(
        ctx,
        [
          [18, 10],
          [25, 11],
          [31, 17],
          [26, 22],
          [21, 18],
        ],
        "#b1b19a",
        1,
      );
    headShape(
      [
        [18, 7],
        [15, 0],
        [22, 3],
        [27, 6],
      ],
      "#9d9f89",
    );
    headShape(
      [
        [22, 4],
        [28, 5],
        [31, 10],
        [30, 15],
        [23, 15],
        [18, 11],
        [18, 7],
      ],
      "#b1b19a",
    );
    headShape(
      [
        [23, 8],
        [30, 8],
        [33, 10],
        [31, 12],
        [26, 11],
        [23, 10],
      ],
      "#243426",
    );
    headShape(
      [
        [31, 10],
        [35, 11],
        [32, 12],
      ],
      "#8a8b67",
    );
    if (pose.beak)
      headShape(
        [
          [31, 12],
          [35, 13],
          [31, 14],
        ],
        "#a6a17a",
      );
    const eye = headPoint([27, 9]);
    const glint = headPoint([27, 8]);
    const blink = t % 5.4 > 5.05;
    box(ctx, eye[0], eye[1], 2, 1, blink ? "#8f9b7e" : "#050e09");
    if (!blink) box(ctx, glint[0], glint[1], 1, 1, "#d2d5b6");
    if (pose.snack) {
      const tip = headPoint([35, 12]);
      box(ctx, tip[0], tip[1], 1, 1, "#d0a36b");
    }
    if (pose.lift > 3) {
      line(ctx, 19, 27, 21, 31, "#9b9972", 1);
      line(ctx, 23, 25, 24, 30, "#9b9972", 1);
      line(ctx, 20, 31, 23, 31, "#9b9972", 1);
    } else {
      const footWorldX = 101 + pose.offset + shake + 19 * 4;
      const perchY = 193 - ((footWorldX - 24) * 40) / 316;
      const footY = Math.round((perchY - originY) / 4);
      line(ctx, 19, 27, 19, footY, "#9b9972", 1);
      line(ctx, 23, 25, 24, footY - 1, "#9b9972", 1);
      line(ctx, 17, footY, 21, footY, "#9b9972", 1);
      line(ctx, 22, footY - 1, 26, footY - 1, "#9b9972", 1);
    }
    ctx.restore();
  }

  // Transparent scenery grows across the page instead of filling a panel.
  function curve(ctx, a, b, c, d, color, size = 2) {
    let previous = a;
    for (let i = 1; i <= 40; i++) {
      const p = i / 40;
      const q = 1 - p;
      const next = [0, 1].map(
        (axis) =>
          q ** 3 * a[axis] +
          3 * q * q * p * b[axis] +
          3 * q * p * p * c[axis] +
          p ** 3 * d[axis],
      );
      line(ctx, ...previous, ...next, color, size);
      previous = next;
    }
  }
  function sceneLeaf(ctx, x, y, dx, dy, color) {
    polygon(
      ctx,
      [
        [x, y],
        [x + dx * 0.3 - dy * 0.23, y + dy * 0.3 + dx * 0.23],
        [x + dx, y + dy],
        [x + dx * 0.6 + dy * 0.2, y + dy * 0.6 - dx * 0.2],
      ],
      color,
    );
    line(ctx, x, y, x + dx * 0.85, y + dy * 0.85, "#8b9a6955", 1);
  }
  function sceneSprig(ctx, x, y, dx, dy, t, color = "#3f664b") {
    const sway = Math.sin(t * 0.6 + x) * 2;
    curve(
      ctx,
      [x, y],
      [x + dx * 0.3, y + dy * 0.25],
      [x + dx * 0.8 + sway, y + dy * 0.7],
      [x + dx + sway, y + dy],
      "#4e684b",
    );
    for (let i = 1; i <= 5; i++) {
      const p = i / 6;
      const side = i % 2 ? 1 : -1;
      const leafX = x + dx * p + sway * p;
      const leafY = y + dy * p;
      sceneLeaf(
        ctx,
        leafX,
        leafY,
        dx * 0.12 - dy * 0.25 * side,
        dy * 0.12 + dx * 0.25 * side,
        color,
      );
    }
  }
  function sceneFlower(ctx, x, y, color = "#bfb399") {
    for (const [dx, dy] of [
      [-5, -2],
      [0, -6],
      [5, -2],
      [3, 4],
      [-3, 4],
    ]) {
      box(ctx, x + dx, y + dy, 4, 4, color);
    }
    box(ctx, x, y, 3, 3, "#b79459");
    box(ctx, x + 1, y, 1, 1, "#e5cf99");
  }
  const birdLayer = document.createElement("canvas");
  birdLayer.width = 360;
  birdLayer.height = 220;
  const birdContext = birdLayer.getContext("2d");
  birdContext.imageSmoothingEnabled = false;

  function waxwingScene(ctx, t) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const scale = Math.min(width > 900 ? 1.1 : 1, (width - 22) / 360);
    const anchorX = width - 360 * scale - 16;
    const anchorY = height - 292 * scale;
    const perch = (x, y) => [anchorX + x * scale, anchorY + y * scale];
    const start = perch(24, 193);
    const end = perch(340, 153);

    curve(
      ctx,
      [12, height - 21],
      [Math.max(16, start[0] * 0.4), height - 6],
      [Math.max(16, start[0] - 80), start[1] + 15],
      start,
      "#3c513d",
      4,
    );
    curve(
      ctx,
      [14, height - 23],
      [Math.max(16, start[0] * 0.4), height - 8],
      [Math.max(16, start[0] - 80), start[1] + 13],
      start,
      "#6f7851",
      1,
    );
    curve(
      ctx,
      end,
      [width - 35, end[1] - 4],
      [width - 20, end[1] - 42],
      [width - 9, end[1] - 58],
      "#4e6747",
      2,
    );

    sceneSprig(ctx, 42, height - 22, 55, -71, t, "#385e45");
    sceneSprig(ctx, width * 0.4, height - 26, -39, -66, t, "#42664b");
    sceneSprig(ctx, width - 48, end[1] - 5, 16, -95, t, "#3e6149");
    sceneSprig(ctx, width - 87, end[1] + 10, 53, -46, t, "#587653");
    sceneSprig(ctx, width - 72, end[1] + 8, -26, -74, t, "#345840");
    if (width > 650) {
      sceneSprig(ctx, start[0] - 29, start[1] + 8, -64, -96, t, "#294c39");
      sceneSprig(ctx, start[0] - 18, start[1] + 8, -6, -113, t, "#426448");
    } else {
      sceneSprig(ctx, 30, height - 23, 10, -106, t, "#294c39");
    }

    // A few small blossoms and hanging berries keep the decoration airy.
    const blossomX = Math.max(38, width * 0.52);
    curve(
      ctx,
      [blossomX - 17, height - 31],
      [blossomX - 25, height - 76],
      [blossomX + 30, height - 86],
      [blossomX + 12, height - 115],
      "#657452",
      1,
    );
    sceneFlower(ctx, blossomX + 12, height - 116);
    sceneFlower(ctx, width - 35, end[1] - 82, "#b59384");
    sceneFlower(ctx, width - 72, end[1] - 62, "#b6ba9c");
    sceneFlower(ctx, width - 53, end[1] - 47, "#b3a480");
    sceneFlower(ctx, 96, height - 95, "#a5b195");

    const berryX = Math.max(35, anchorX + 42 * scale);
    const berryY = start[1] + 12;
    curve(
      ctx,
      [berryX, berryY - 7],
      [berryX + 14, berryY + 4],
      [berryX + 2, berryY + 14],
      [berryX + 12, berryY + 23],
      "#697052",
      1,
    );
    for (const [dx, dy] of [
      [10, 23],
      [16, 18],
      [20, 25],
    ]) {
      box(ctx, berryX + dx, berryY + dy, 5, 5, "#9c6456");
      box(ctx, berryX + dx, berryY + dy, 2, 1, "#d1a07c");
    }

    // Draw at integer coordinates first; nearest-neighbor scaling keeps the
    // feathers solid on narrow screens and prevents seams between pixel cells.
    birdContext.clearRect(0, 0, birdLayer.width, birdLayer.height);
    waxwing(birdContext, t);
    ctx.drawImage(
      birdLayer,
      Math.round(anchorX),
      Math.round(anchorY),
      Math.round(360 * scale),
      Math.round(220 * scale),
    );

    for (let i = 0; i < 7; i++) {
      const x = width * (0.48 + (i % 4) * 0.13) + Math.sin(t * 0.3 + i * 4) * 6;
      const y =
        31 +
        ((i * 47) % Math.max(80, height - 140)) +
        Math.cos(t * 0.4 + i) * 5;
      const shimmer = 0.2 + (Math.sin(t * 1.1 + i * 2.1) + 1) * 0.3;
      ctx.globalAlpha = shimmer;
      box(ctx, x, y, 2, 2, i % 2 ? "#bdad7d" : "#94b486");
      if (i % 3 === 0) {
        box(ctx, x - 2, y + 1, 6, 1, "#94b48655");
        box(ctx, x + 1, y - 2, 1, 6, "#94b48655");
      }
    }
    ctx.globalAlpha = 1;
  }
  const painters = {
    reading: book,
    camera,
    painting,
    ruins,
    waxwing: waxwingScene,
  };

  function paint(state) {
    const { canvas, ctx, type, time } = state;
    if (type === "waxwing") ctx.clearRect(0, 0, canvas.width, canvas.height);
    else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (type === "camera") backdrop(ctx, canvas.width, canvas.height);
    }
    painters[type](ctx, time);
  }
  function active() {
    return (
      !document.hidden &&
      !preference.matches &&
      states.some((state) => state.visible)
    );
  }
  function schedule() {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    previous = 0;
    if (active()) frame = requestAnimationFrame(tick);
  }
  function tick(now) {
    frame = null;
    if (!active()) return;
    const delta = previous ? Math.min(now - previous, 100) / 1000 : 0;
    previous = now;
    const repaint = now - lastPaint >= 1000 / 9;
    for (const state of states) {
      if (!state.visible) continue;
      state.time += delta;
      if (repaint) paint(state);
    }
    if (repaint) lastPaint = now;
    frame = requestAnimationFrame(tick);
  }
  function fitScene(state) {
    const bounds = state.canvas.getBoundingClientRect();
    const width = Math.max(1, Math.round(bounds.width));
    const height = Math.max(1, Math.round(bounds.height));
    if (state.canvas.width === width && state.canvas.height === height) return;
    state.canvas.width = width;
    state.canvas.height = height;
    state.ctx.imageSmoothingEnabled = false;
    paint(state);
  }
  for (const canvas of document.querySelectorAll("[data-pixels]")) {
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;
    ctx.imageSmoothingEnabled = false;
    const state = {
      canvas,
      ctx,
      type: canvas.dataset.pixels,
      time: preference.matches
        ? canvas.dataset.pixels === "waxwing"
          ? 0
          : canvas.dataset.pixels === "painting"
            ? 10
            : 5
        : 0,
      visible: false,
    };
    states.push(state);
    if (state.type === "waxwing") fitScene(state);
    paint(state);
  }
  const sceneResize = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const state = states.find((state) => state.canvas === entry.target);
      if (state) fitScene(state);
    }
  });
  states
    .filter((state) => state.type === "waxwing")
    .forEach((state) => sceneResize.observe(state.canvas));
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const state = states.find((state) => state.canvas === entry.target);
        state.visible = entry.isIntersecting;
      }
      schedule();
    },
    { rootMargin: "80px" },
  );
  states.forEach((state) => observer.observe(state.canvas));
  preference.addEventListener("change", schedule);
  document.addEventListener("visibilitychange", schedule);
})();
