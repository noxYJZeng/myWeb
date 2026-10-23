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
  const brushMarks = [
    [88, 69],
    [86, 65],
    [84, 61],
    [80, 56],
    [75, 52],
    [74, 57],
    [76, 63],
    [80, 68],
    [86, 73],
    [92, 77],
    [96, 81],
    [101, 82],
    [106, 80],
    [112, 76],
    [119, 72],
    [124, 66],
    [128, 59],
    [128, 53],
    [122, 56],
    [117, 62],
    [113, 68],
    [108, 74],
    [104, 78],
    [99, 83],
    [93, 91],
    [88, 97],
    [86, 91],
    [91, 85],
    [99, 80],
    [107, 84],
    [115, 91],
    [118, 97],
    [111, 95],
    [106, 88],
    [101, 82],
  ];
  function painting(ctx, t) {
    box(ctx, 50, 21, 118, 107, "#436945");
    box(ctx, 56, 27, 106, 95, "#b9c1a0");
    box(ctx, 63, 34, 92, 81, "#cdd1b4");
    line(ctx, 63, 129, 51, 143, "#869367", 3);
    line(ctx, 154, 129, 166, 143, "#869367", 3);
    box(ctx, 46, 126, 126, 5, "#829166");
    const step = Math.min(brushMarks.length - 1, Math.floor((t % 7) * 7));
    for (let i = 0; i <= step; i++) {
      const [x, y] = brushMarks[i];
      box(ctx, x, y, 4, 4, i % 5 === 0 ? "#b39e6c" : "#4e9364");
    }
    const [x, y] = brushMarks[step];
    line(ctx, x + 3, y + 1, x + 27, y - 23, "#8d7955", 3);
    line(ctx, x + 2, y + 2, x + 8, y - 4, "#396b49", 3);
    box(ctx, 183, 109, 28, 17, "#899772");
    box(ctx, 180, 113, 33, 10, "#899772");
    box(ctx, 186, 113, 5, 5, "#68a677");
    box(ctx, 194, 116, 5, 5, "#c29d64");
    box(ctx, 202, 112, 5, 5, "#749b9b");
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
    box(ctx, 32, 34, 3, 3, "#527b4d");
    box(ctx, 312, 49, 2, 2, "#8a9b67");
  }
  const painters = { reading: book, camera, painting, ruins, waxwing };

  function paint(state) {
    const { canvas, ctx, type, time } = state;
    backdrop(ctx, canvas.width, canvas.height);
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
  for (const canvas of document.querySelectorAll("[data-pixels]")) {
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;
    ctx.imageSmoothingEnabled = false;
    const state = {
      canvas,
      ctx,
      type: canvas.dataset.pixels,
      time: preference.matches && canvas.dataset.pixels !== "waxwing" ? 5 : 0,
      visible: false,
    };
    states.push(state);
    paint(state);
  }
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
