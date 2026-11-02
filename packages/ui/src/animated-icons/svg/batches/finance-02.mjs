const path = (d, a = {}) => ({ e: "path", a: { d, ...a } });
const circle = (cx, cy, r, a = {}) => ({ e: "circle", a: { cx, cy, r, ...a } });
const line = (x1, y1, x2, y2, a = {}) => ({ e: "line", a: { x1, y1, x2, y2, ...a } });
const rect = (x, y, w, h, rx, a = {}) => ({ e: "rect", a: { x, y, width: w, height: h, rx, ...a } });
const ellipse = (cx, cy, rx, ry, a = {}) => ({ e: "ellipse", a: { cx, cy, rx, ry, ...a } });
const fill = (color = "currentColor") => ({ fill: color, stroke: "none" });
const A = (part, anims) => ({ ...part, anims });
const G = (id, children, a = {}) => ({ e: "g", g: id, a, children });
const an = (attr, values, times) => ({ kind: "attr", attr, values, times });
const tn = (type, values, times, extra = {}) => ({ kind: "transform", type, values, times, ...extra });

/** Soft blob ₿ mark: one closed silhouette (stem + two lobes with a
 *  pinched waist) plus the twin stubs above/below. h = body height,
 *  w = lobe width; stubs auto-scale. Bottom lobe runs a hair wider. */
const B = (cx, cy, h = 7, w = 4.8) => {
  const x0 = +(cx - w * 0.55).toFixed(2); // stem x
  const yT = +(cy - h / 2).toFixed(2);
  const yM = +cy.toFixed(2);
  const yB = +(cy + h / 2).toFixed(2);
  const xi = +(x0 + w * 0.52).toFixed(2); // top edge of bars / pinch
  const xr = +(x0 + w).toFixed(2); // top bowl outer
  const xr2 = +(x0 + w * 1.08).toFixed(2); // bottom bowl outer
  const c1 = +(w * 0.52).toFixed(2); // bowl tension
  const t1 = +(x0 + w * 0.24).toFixed(2); // stub pair x's
  const t2 = +(x0 + w * 0.46).toFixed(2);
  const tk = +(h * 0.2).toFixed(2); // stub length
  const d =
    `M${x0} ${yT}H${xi}` +
    `C${xi + c1} ${yT} ${xr} ${yT + (yM - yT) * 0.3} ${xr} ${(yT + yM) / 2}` +
    `C${xr} ${yM - (yM - yT) * 0.3} ${xi + c1} ${yM} ${xi} ${yM}` +
    `C${xi + c1 * 1.15} ${yM} ${xr2} ${yM + (yB - yM) * 0.3} ${xr2} ${(yM + yB) / 2}` +
    `C${xr2} ${yB - (yB - yM) * 0.3} ${xi + c1 * 1.15} ${yB} ${xi} ${yB}` +
    `H${x0}Z` +
    `M${t1} ${yT - tk}V${yT}M${t2} ${yT - tk}V${yT}` +
    `M${t1} ${yB}V${yB + tk}M${t2} ${yB}V${yB + tk}`;
  return path(d);
};

/** Round-cap zero-length stroke = soft dot (keypads, scatter points). */
const dot = (x, y, sw = 2.7) => line(x, y, x, y, { "stroke-width": sw });

/** Scalloped bloom ring (same recipe as the core gear): cosine radius
 *  modulation gives soft lobes, not machine teeth. */
const bloom = (cx, cy, lobes, rMid, amp, steps = 14) => {
  const pts = [];
  for (let i = 0; i < lobes * steps; i++) {
    const t = (i / (lobes * steps)) * Math.PI * 2;
    const r = rMid + amp * Math.cos(lobes * t + Math.PI / 2);
    pts.push(`${(cx + r * Math.cos(t)).toFixed(2)} ${(cy + r * Math.sin(t)).toFixed(2)}`);
  }
  return `M${pts.join("L")}Z`;
};

/** Soft L axis for chart glyphs: vertical, rounded corner, baseline. */
const AXIS = "M4 4.2v12.6c0 1.6 1.3 2.9 2.9 2.9h13.4";

/* gesture idioms */
const dip = (dx, dy) => tn("translate", ["0 0", `${dx} ${dy}`, "0 0"]);
const throb = (cx, cy, s = 1.18) => ({ pivot: [cx, cy], anim: tn("scale", ["1", `${s}`, "1"]) });
const drawOn = (len, t0 = 0.1, t1 = 0.75) => an("stroke-dashoffset", [String(len), String(len), "0"], [0, t0, t1]);

export const icons = {
  /* B + send arrow */
    "bitcoin-send": { dur: 1.4,
    auto: false,
    parts: [
    path("M4.28 7.6L6.88 7.6C9.48 7.6 9.28 8.92 9.28 9.8C9.28 10.68 9.48 12 6.88 12C9.87 12 9.68 13.32 9.68 14.2C9.68 15.08 9.87 16.4 6.88 16.4L4.28 16.4ZM5.48 5.84L5.48 7.6M6.58 5.84L6.58 7.6M5.48 16.4L5.48 18.16M6.58 16.4L6.58 18.16"),
    G("out", [
      line(13.43, 12, 19.52, 12),
      path("M15.73 8.6C17.13 10 18.42 11.3 19.73 12.5L15.73 16.8"),
    ]),
  ],
    gAnims: { out: tn("translate", ["0 0", "1.6 0", "0 0"]) } },

  /* bloom gear + B hub */
  "bitcoin-setting": {
    dur: 1.4,
    auto: false,
    parts: [
      G("turn", [path(bloom(12, 12, 8, 7.7, 1.05))]),
      B(12, 12, 7, 4.6),
    ],
    gAnims: { turn: tn("rotate", ["0 12 12", "90 12 12"]) },
  },

  /* shield + B */
  "bitcoin-shield": {
    auto: false,
    dur: 1.7,
    parts: [
      G("brace", [
        path("M12 3.3c1.9 1.2 4.4 2.3 7.6 2.7 1 .1 1.7 1 1.7 2v3.6c0 4.3-3.4 6.9-7 8.7-1.3.7-3.3.7-4.6 0-3.6-1.8-7-4.4-7-8.7V8c0-1 .7-1.9 1.7-2 3.2-.4 5.7-1.5 7.6-2.7z"),
        B(12, 12.4, 6.6, 4.4),
      ]),
    ],
    sAnims: { brace: throb(12, 12, 1.06) },
  },

  /* bucket bag + B inside */
  "bitcoin-shopping": {
    auto: false,
    dur: 1.8,
    parts: [
      G("swing", [
        path("M5.6 9.7h12.8c.8 0 1.4.7 1.3 1.5l-.6 5.2c-.4 2.9-2.1 4.4-5.2 4.4h-3.8c-3.1 0-4.8-1.5-5.2-4.4l-.6-5.2c-.1-.8.5-1.5 1.3-1.5z"),
        B(12, 15, 5.2, 3.6),
      ]),
      path("M8.6 9.7V8.2c0-2.4 1.5-4.3 3.4-4.3s3.4 1.9 3.4 4.3v1.5"),
    ],
    gAnims: { swing: tn("rotate", ["0 12 8.6", "-5 12 8.6", "4 12 8.6", "0 12 8.6"], [0, 0.3, 0.65, 1]) },
  },

  /* phone, coin on the top-right corner */
  "bitcoin-smartphone01": {
    auto: false,
    dur: 1.5,
    parts: [
      path("M13.9 3.2H7.4c-1.7 0-3 1.4-3 3v11.6c0 1.7 1.4 3 3 3h5.4c1.7 0 3-1.4 3-3v-7.6"),
      dot(10.1, 17.6),
      G("badge", [B(18, 6.7, 5.6, 3.9)]),
    ],
    sAnims: { badge: throb(18, 6.7, 1.2) },
  },

  /* phone + B on screen */
  "bitcoin-smartphone02": {
    auto: false,
    dur: 1.5,
    parts: [
      rect(6.5, 3.2, 11, 17.6, 2.8),
      G("app", [B(12, 10.6, 6, 4.2)]),
      dot(12, 17.4),
    ],
    sAnims: { app: throb(12, 10.6, 1.18) },
  },

  /* B in a soft square */
  "bitcoin-square": {
    auto: false,
    dur: 1.5,
    parts: [
      rect(3.4, 3.4, 17.2, 17.2, 4.2),
      G("mark", [B(12, 12, 8.2, 5.4)]),
    ],
    sAnims: { mark: throb(12, 12, 1.15) },
  },

  /* awning shop + B window */
  "bitcoin-store": {
    parts: [
      path("M5.4 4.4h14.1c.5 0 .9.4.9.9v1.5a1.95 1.95 0 0 1-3.9 0 1.95 1.95 0 0 1-3.9 0 1.95 1.95 0 0 1-3.9 0 1.95 1.95 0 0 1-3.9 0V5.3c0-.5.4-.9.9-.9z"),
      path("M5.7 10.6v6.9c0 1.9 1.6 3.5 3.5 3.5h6.6c1.9 0 3.5-1.6 3.5-3.5v-6.9"),
      G("win", [B(12.4, 15.8, 5.4, 3.7)]),
    ],
    auto: false,
    dur: 1.5,
    sAnims: { win: throb(12.4, 15.8, 1.18) },
  },

  /* price tag + B */
  "bitcoin-tag": {
    auto: false,
    dur: 1.8,
    parts: [
      G("hang", [
        path("M4 10V6.3C4 5 5 4 6.3 4h3.4c.9 0 1.7.3 2.3.9l7.3 7.3c1 1 1 2.6 0 3.6l-4.7 4.7c-1 1-2.6 1-3.6 0l-7.3-7.3C4.6 12.7 4 11.4 4 10z"),
        circle(15.6, 8.4, 1.5),
        B(9.8, 13.8, 5.6, 3.8),
      ]),
    ],
    gAnims: { hang: tn("rotate", ["0 15.6 8.4", "-8 15.6 8.4", "6.5 15.6 8.4", "0 15.6 8.4"], [0, 0.3, 0.65, 1]) },
  },

  /* target ring + ticks + B */
  "bitcoin-target": {
    auto: false,
    dur: 1.5,
    parts: [
      circle(12, 12, 8.3),
      path("M12 2.9v1.9M12 19.2v1.9M2.9 12h1.9M19.2 12h1.9"),
      G("snap", [B(12, 12, 6.6, 4.4)]),
    ],
    sAnims: { snap: { pivot: [12, 12], anim: tn("scale", ["0.4", "0.4", "1.15", "1"], [0, 0.1, 0.6, 0.85]) } },
  },

  /* two swap arcs + B hub */
  "bitcoin-transaction": {
    dur: 1.8,
    auto: false,
    parts: [
      G("swap", [
        path("M4.4 13.6a8.1 8.1 0 0 1 13.6-6.6l1.8 1.9"),
        path("M19.9 4.4v4.3h-4.3"),
        path("M19.6 10.4a8.1 8.1 0 0 1-13.6 6.6l-1.8-1.9"),
        path("M4.1 19.6v-4.3h4.3"),
      ]),
      B(12, 12, 6.2, 4.2),
    ],
    gAnims: { swap: tn("rotate", ["0 12 12", "360 12 12"]) },
    pp: false,
  },

  /* coin circle + upload arrow */
  "bitcoin-up01": {
    auto: false,
    dur: 1.4,
    parts: [
      circle(12, 15.4, 6.3),
      B(12, 15.4, 5.4, 3.7),
      G("lift", [line(12, 2.6, 12, 7.4), path("M9 5.3c.9-1 1.9-1.9 3-2.7 1.1.8 2.1 1.7 3 2.7")]),
    ],
    gAnims: { lift: dip("0", "-1.4") },
  },

  /* coin circle + trend arrow out top */
    "bitcoin-up02": { dur: 1.4, auto: true, parts: [
      circle(9.5, 14.5, 6.5),
      path("M7.88 10.9V18.1M7.88 10.9H10.4A1.8 1.8 0 0 1 10.4 14.5H7.88M7.88 14.5H10.94A1.8 1.8 0 0 1 10.94 18.1H7.88"),
      path("M16.2 3.5H20.5V7.8M20.5 3.5 15.5 8.5"),
    ] },

  /* wallet body + B badge low-left */
    "bitcoin-wallet": { dur: 1.5,
    auto: false,
    parts: [
    path("M9.09 7.53C9.09 5.63 10.6 4.13 12.5 4.13L17.39 4.13C19.29 4.13 20.79 5.63 20.79 7.53L20.79 14.23C20.79 16.13 19.29 17.63 17.39 17.63L12.49 17.63C10.59 17.63 9.09 16.13 9.09 14.23L9.09 7.53Z"),
    G("slot", [
      path("M20.8 9.53L20.8 12.93L17.4 12.93C16.1 12.93 15.1 11.93 15.1 10.63S16.1 9.53 17.4 9.53L20.8 9.53Z"),
      circle(17.7, 11.23, 0.85, { fill: "currentColor", stroke: "none" }),
    ]),
    path("M3.2 11.23L5.75 11.23C8.3 11.23 8.1 12.31 8.1 13.03C8.1 13.75 8.3 14.83 5.75 14.83C8.69 14.83 8.49 15.91 8.49 16.63C8.49 17.35 8.69 18.43 5.75 18.43L3.2 18.43ZM4.38 9.79L4.38 11.23M5.45 9.79L5.45 11.23M4.38 18.43L4.38 19.87M5.45 18.43L5.45 19.87"),
  ],
    gAnims: { slot: tn("translate", ["0 0", "0.7 0", "0 0"]) } },

  /* purse bin + arch lid + B */
  "bitcoin-withdraw": {
    parts: [
      path("M6.4 9.9h11.2c.9 0 1.7.6 1.9 1.5l.7 3.9c.6 3.1-.8 5.4-3.1 5.4H6.9c-2.3 0-3.7-2.3-3.1-5.4l.7-3.9c.2-.9 1-1.5 1.9-1.5z"),
      path("M7.6 9.9c0-3.1 2-5.6 4.4-5.6s4.4 2.5 4.4 5.6"),
      G("out", [B(12, 15.3, 5.4, 3.7)]),
    ],
    auto: false,
    dur: 1.6,
    gAnims: { out: dip("0", "-2.2") },
  },

  /* four-op math grid */
  calculator: {
    auto: false,
    dur: 1.9,
    parts: [
      line(2.8, 12, 21.2, 12),
      line(12, 2.8, 12, 21.2),
      A(path("M5.2 4.4v4.2M3.1 6.5h4.2"), [an("opacity", ["1", "0.3", "1"], [0, 0.25, 1])]),
      A(line(15.9, 6.5, 20.9, 6.5), [an("opacity", ["1", "0.3", "1"], [0, 0.42, 1])]),
      A(path("M15.7 15.7l4.4 4.4M20.1 15.7l-4.4 4.4"), [an("opacity", ["1", "0.3", "1"], [0, 0.58, 1])]),
      A(path("M15.9 16.9h4M15.9 19.6h4"), [an("opacity", ["1", "0.3", "1"], [0, 0.74, 1])]),
    ],
  },

  /* calc body: display + key dots */
  calculator01: {
    parts: [
      rect(3.6, 3, 16.8, 18, 3.4),
      line(3.6, 10.2, 20.4, 10.2),
      line(15.4, 6.6, 18.2, 6.6),
      A(path("M7.4 14.2v.01", { "stroke-width": 2.7 }), [an("opacity", ["1", "0.25", "1"], [0, 0.2, 1])]),
      A(path("M12 14.2v.01", { "stroke-width": 2.7 }), [an("opacity", ["1", "0.25", "1"], [0, 0.35, 1])]),
      A(path("M16.6 14.2v.01", { "stroke-width": 2.7 }), [an("opacity", ["1", "0.25", "1"], [0, 0.5, 1])]),
      A(path("M7.4 17.9v.01", { "stroke-width": 2.7 }), [an("opacity", ["1", "0.25", "1"], [0, 0.6, 1])]),
      A(path("M12 17.9v.01", { "stroke-width": 2.7 }), [an("opacity", ["1", "0.25", "1"], [0, 0.7, 1])]),
      A(path("M16.6 17.9v.01", { "stroke-width": 2.7 }), [an("opacity", ["1", "0.25", "1"], [0, 0.8, 1])]),
    ],
    auto: false,
    dur: 1.9,
  },

  /* three soft columns */
  chart01: {
    auto: false,
    dur: 1.7,
    parts: [
      /* four free-standing round-capped bars — too narrow to outline cleanly */
      A(line(4.5, 20, 4.5, 11), [an("y2", ["20", "20", "11"], [0, 0.05, 0.55])]),
      A(line(9.5, 20, 9.5, 4.5), [an("y2", ["20", "20", "4.5"], [0, 0.15, 0.65])]),
      A(line(14.5, 20, 14.5, 9), [an("y2", ["20", "20", "9"], [0, 0.25, 0.75])]),
      A(line(19.5, 20, 19.5, 13.5), [an("y2", ["20", "20", "13.5"], [0, 0.35, 0.85])]),
    ],
  },

  /* columns + dot-line combo */
  chart02: {
    auto: false,
    dur: 1.7,
    parts: [
      line(5, 20.4, 5, 12.8),
      line(12, 20.4, 12, 14.8),
      line(19, 20.4, 19, 11.4),
      A(path("M6.7 6.9l3.6 1.3", { "stroke-dasharray": 3.9 }), [drawOn(3.9, 0.3, 0.6)]),
      A(path("M13.5 7.9l3.7-2.6", { "stroke-dasharray": 4.6 }), [drawOn(4.6, 0.5, 0.8)]),
      A(circle(5, 6.5, 1.5), [an("r", ["0.3", "0.3", "1.5"], [0, 0.05, 0.5])]),
      A(circle(12, 8.5, 1.5), [an("r", ["0.3", "0.3", "1.5"], [0, 0.25, 0.7])]),
      A(circle(19, 4.6, 1.5), [an("r", ["0.3", "0.3", "1.5"], [0, 0.45, 0.9])]),
    ],
  },

  /* axis + zigzag trend */
  chart03: {
    auto: false,
    dur: 1.7,
    parts: [
      path(AXIS),
      A(path("M6.6 15.4l3.2-3.2c.6-.6 1.6-.6 2.2 0l1.4 1.4c.6.6 1.6.6 2.2 0l4.4-4.5", { "stroke-dasharray": 18 }), [
        drawOn(18, 0.08, 0.75),
      ]),
    ],
  },

  /* zigzag over bar stems */
  "chart-analysis": {
    auto: false,
    dur: 1.8,
    parts: [
      A(path("M3.6 11.4l2.5-2.5c.7-.7 1.8-.7 2.5 0l1.5 1.5c.7.7 1.8.7 2.5 0l2-2 4-4.2", { "stroke-dasharray": 20 }), [
        drawOn(20, 0.08, 0.7),
      ]),
      A(path("M3.6 15.4V21"), [an("d", ["M3.6 21V21", "M3.6 21V21", "M3.6 15.4V21"], [0, 0.15, 0.6])]),
      A(path("M9.5 13.4V21"), [an("d", ["M9.5 21V21", "M9.5 21V21", "M9.5 13.4V21"], [0, 0.3, 0.75])]),
      A(path("M15.5 16.4V21"), [an("d", ["M15.5 21V21", "M15.5 21V21", "M15.5 16.4V21"], [0, 0.45, 0.9])]),
      A(path("M20.6 9.8V21"), [an("d", ["M20.6 21V21", "M20.6 21V21", "M20.6 9.8V21"], [0, 0.6, 1])]),
    ],
  },

  /* axis + filled-looking area silhouette */
  "chart-area": {
    auto: false,
    dur: 1.8,
    parts: [
      path(AXIS),
      A(path("M6.6 17.6v-3.5c0-.5.2-.9.6-1.2l2.3-1.6c.6-.4 1.4-.3 1.9.2l1 1c.5.5 1.4.5 1.9 0l2.7-2.7c.9-.9 2.2-.6 2.2.8v7c0 .6-.5 1-1.1 1H7.7c-.6 0-1.1-.4-1.1-1z"), [
        an("opacity", ["0.15", "0.15", "1"], [0, 0.15, 0.7]),
      ]),
    ],
  },

  /* axis + wave + dashed average */
  "chart-average": { dur: 1.4, auto: true, parts: [
    path("M3.5 3.5V20.5H20.5"),
    path("M6.5 16 9.5 9.5 12.5 13.5 15.5 7 18.5 11"),
    path("M6.5 13.2h1.2M10 13.2h1.2M13.5 13.2h1.2M17 13.2h1.2"),
  ] },

  /* axis + two pill bars */
  "chart-bar-big": {
    auto: false,
    dur: 1.7,
    parts: [
      path(AXIS),
      A(rect(7.4, 4.6, 11.2, 4.2, 1.1), [an("width", ["0.1", "0.1", "11.2"], [0, 0.05, 0.6])]),
      A(rect(7.4, 12.2, 7, 4.2, 1.1), [an("width", ["0.1", "0.1", "7"], [0, 0.25, 0.8])]),
    ],
  },

  /* axis + shrinking bars */
  "chart-bar-decreasing": {
    auto: false,
    dur: 1.7,
    parts: [
      path(AXIS),
      A(path("M6.8 6.4h11.6"), [an("d", ["M6.8 6.4h0.1", "M6.8 6.4h0.1", "M6.8 6.4h11.6"], [0, 0.05, 0.55])]),
      A(path("M6.8 11.4h7.6"), [an("d", ["M6.8 11.4h0.1", "M6.8 11.4h0.1", "M6.8 11.4h7.6"], [0, 0.2, 0.7])]),
      A(path("M6.8 16.4h3.8"), [an("d", ["M6.8 16.4h0.1", "M6.8 16.4h0.1", "M6.8 16.4h3.8"], [0, 0.35, 0.85])]),
    ],
  },

  /* axis + growing bars */
  "chart-bar-increasing": {
    auto: false,
    dur: 1.7,
    parts: [
      path(AXIS),
      A(path("M6.8 6.4h3.8"), [an("d", ["M6.8 6.4h0.1", "M6.8 6.4h0.1", "M6.8 6.4h3.8"], [0, 0.05, 0.55])]),
      A(path("M6.8 11.4h7.6"), [an("d", ["M6.8 11.4h0.1", "M6.8 11.4h0.1", "M6.8 11.4h7.6"], [0, 0.2, 0.7])]),
      A(path("M6.8 16.4h11.6"), [an("d", ["M6.8 16.4h0.1", "M6.8 16.4h0.1", "M6.8 16.4h11.6"], [0, 0.35, 0.85])]),
    ],
  },

  /* stems + connected dots */
  "chart-bar-line": {
    auto: false,
    dur: 1.8,
    parts: [
      line(3, 20.6, 21, 20.6),
      A(path("M5 14.8v5.8"), [an("d", ["M5 20.6v-0.1", "M5 20.6v-0.1", "M5 14.8v5.8"], [0, 0.05, 0.55])]),
      A(path("M12 9.8v10.8"), [an("d", ["M12 20.6v-0.1", "M12 20.6v-0.1", "M12 9.8v10.8"], [0, 0.2, 0.7])]),
      A(path("M19 13.2v7.4"), [an("d", ["M19 20.6v-0.1", "M19 20.6v-0.1", "M19 13.2v7.4"], [0, 0.35, 0.85])]),
      A(path("M6.3 9.2l4-2.7", { "stroke-dasharray": 4.9 }), [drawOn(4.9, 0.3, 0.62)]),
      A(path("M13.6 6.1l3.9 2.1", { "stroke-dasharray": 4.5 }), [drawOn(4.5, 0.5, 0.82)]),
      A(circle(4.9, 9.6, 1.5), [an("r", ["0.3", "0.3", "1.5"], [0, 0.15, 0.6])]),
      A(circle(12, 5.8, 1.5), [an("r", ["0.3", "0.3", "1.5"], [0, 0.35, 0.8])]),
      A(circle(19.1, 8.9, 1.5), [an("r", ["0.3", "0.3", "1.5"], [0, 0.55, 1])]),
    ],
  },

  /* pill bars + stack dividers */
  "chart-bar-stacked": {
    auto: false,
    dur: 1.8,
    parts: [
      path(AXIS),
      A(rect(7.4, 4.6, 11.2, 4.2, 1.1), [an("width", ["0.1", "0.1", "11.2"], [0, 0.05, 0.55])]),
      A(rect(7.4, 12.2, 7, 4.2, 1.1), [an("width", ["0.1", "0.1", "7"], [0, 0.2, 0.7])]),
      A(line(13.4, 4.6, 13.4, 8.8), [an("y2", ["4.6", "4.6", "8.8"], [0, 0.4, 0.75])]),
      A(line(11, 12.2, 11, 16.4), [an("y2", ["12.2", "12.2", "16.4"], [0, 0.55, 0.9])]),
    ],
  },

  /* ring + breakout curve + sparks */
    "chart-breakout-circle": { dur: 1.4, auto: true, parts: [
      path("M20 13A8 8 0 1 1 11 4"),
      path("M7.5 14.5 10.5 11.5 12.5 13.5 19 7"),
      path("M15.3 6.8H19.2V10.7"),
    ] },

  /* piggy bank — the coin drops into the slot */
  "piggy-bank": {
    auto: false,
    dur: 1.9,
    parts: [
      ellipse(11.7, 14.5, 7.4, 5),
      circle(4.9, 14.1, 1.8),
      circle(4.9, 14.1, 0.55, fill()),
      path("M6.8 10.2l1.4-2.9 2.2 1.9z"),
      path("M7.8 18.9l-.4 1.9M15.8 18.9l.4 1.9"),
      path("M19.4 13.4c.9-.5 1.9-.3 2.2.4.3.7-.1 1.4-.9 1.6"),
      circle(7.7, 12.4, 0.55, fill()),
      line(10.4, 9.4, 13.2, 9.4),
      G("coin", [circle(11.8, 5.2, 1.8)]),
    ],
    gAnims: { coin: tn("translate", ["0 0", "0 2.6", "0 0", "0 0"], [0, 0.35, 0.6, 1]) },
  },

  /* ring vault door — the wheel keeps turning */
  vault: {
    auto: false,
    dur: 2.4,
    parts: [
      circle(12, 12, 8.7),
      circle(12, 12, 5.6),
      G("wheel", [
        line(12, 12, 12, 7.6),
        line(12, 12, 8.4, 14.2),
        line(12, 12, 15.6, 14.2),
      ]),
      circle(12, 12, 1.1, fill()),
    ],
    gAnims: { wheel: tn("rotate", ["0 12 12", "120 12 12"], [0, 1]) },
  },

  /* zigzag climbing arrow — draws itself, head pops on */
  "trending-up": {
    auto: false,
    dur: 1.9,
    parts: [
      A(path("M3.2 17l5.6-5.6 3.3 3.3 6.6-6.6", { "stroke-dasharray": 22 }), [drawOn(22, 0.15, 0.7)]),
      A(path("M14.3 8.1h4.4v4.4"), [an("opacity", ["0", "0", "1", "1"], [0, 0.55, 0.7, 1])]),
    ],
  },

  "trending-down": {
    auto: false,
    dur: 1.9,
    parts: [
      A(path("M3.2 7l5.6 5.6 3.3-3.3 6.6 6.6", { "stroke-dasharray": 22 }), [drawOn(22, 0.15, 0.7)]),
      A(path("M14.3 15.9h4.4v-4.4"), [an("opacity", ["0", "0", "1", "1"], [0, 0.55, 0.7, 1])]),
    ],
  },

  /* three candles with wicks — the last one draws on */
  candlestick: {
    auto: false,
    dur: 2,
    parts: [
      path("M6.4 5.4v2M6.4 15.8v2"),
      rect(5, 7.4, 2.8, 8.4, 0.5),
      path("M12 3.4v2.6M12 14.6v2.2"),
      rect(10.6, 6, 2.8, 8.6, 0.5),
      A(path("M17.6 8.4v2M17.6 17.8v1.4"), [an("opacity", ["1", "1", "0", "0", "1"], [0, 0.55, 0.6, 0.95, 1])]),
      A(rect(16.2, 10.4, 2.8, 7.4, 0.5), [
        an("opacity", ["1", "1", "0.15", "0.15", "1"], [0, 0.55, 0.65, 0.95, 1]),
      ]),
    ],
  },

  /* bank cheque — signature line inks itself */
  cheque: {
    auto: false,
    dur: 2,
    parts: [
      rect(3.2, 6.6, 17.6, 10.8, 1.6),
      line(5.8, 10, 11, 10),
      line(16.4, 10, 18.2, 10),
      A(path("M6 14.8c.8-1.4 1.4.2 2.4-.6.9-.8 1.8.5 2.8-.3", { "stroke-dasharray": 8 }), [drawOn(8, 0.2, 0.6)]),
      line(14.6, 14.8, 18.2, 14.8),
    ],
  },

  /* diamond glyph — top facet + lower chevron */
  ethereum: {
    auto: false,
    dur: 1.8,
    parts: [
      G("gem", [
        path("M12 3.4L6.6 11.9 12 15.2l5.4-3.3z"),
        path("M6.6 13.6L12 20.8l5.4-7.2"),
      ]),
    ],
    sAnims: { gem: throb(12, 12, 1.08) },
  },

  /* three ingots stacked — top bar bobs */
  "gold-bars": {
    auto: false,
    dur: 1.8,
    parts: [
      path("M3.8 19.8l1.4-3.6h5l1.4 3.6z"),
      path("M12.4 19.8l1.4-3.6h5l1.4 3.6z"),
      G("top", [path("M8.2 16.2l1.2-3.8h5.2l1.2 3.8z")]),
    ],
    gAnims: { top: dip(0, 1.1) },
  },
};
