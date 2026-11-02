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

/* Closed-book silhouette shared by every book-* glyph: soft cover above,
 * page band below — spine bulge at left, fore-edge curl inside the band. */
const COVER = "M20.1 16.7V6.4c0-1.8-1.5-3.3-3.4-3.3H7.7C5.8 3.1 4.3 4.6 4.3 6.4v12.7";
const BAND = "M20.1 16.7H7.7c-1.9 0-3.4 1-3.4 2.4s1.5 2.4 3.4 2.4h12.4v-4.8";
const CURL = "M19.6 17c-.7.5-1.1 1.2-1.1 2.1s.4 1.6 1.1 2.1";
const book = (curl = true) => (curl ? [path(COVER), path(BAND), path(CURL)] : [path(COVER), path(BAND)]);

/* Open-book halves — the left path carries the spine so it never doubles. */
const OPEN_L = "M12 6.2C10.3 4.8 8.1 4.3 5.6 4.5c-1.1.1-2.1 1-2.1 2.1v10.7c0 1.1.8 2 1.9 2.1 2.2 0 4.6.8 6.6 2";
const OPEN_R = "M12 6.2c1.7-1.4 3.9-1.9 6.4-1.7 1.1.1 2.1 1 2.1 2.1v10.7c0 1.1-.8 2-1.9 2.1-2.2 0-4.6.8-6.6 2";

/* pathLength-normalized draw-on: invisible in the static render. */
const traced = (p, t0, t1) =>
  A({ ...p, a: { ...p.a, pathLength: 1, "stroke-dasharray": 1 } }, [
    an("stroke-dashoffset", ["1", "1", "0", "0"], [0, t0, t1, 1]),
  ]);

/* a bookmark ribbon pulls down, then releases. */
const tug = tn("translate", ["0 0", "0 0", "0 1.1", "0 1.1", "0 0", "0 0"], [0, 0.25, 0.45, 0.6, 0.8, 1]);

/* an arrow rides along its axis (dy: -1.4 up, +1.4 down). */
const ride = (dy) => tn("translate", ["0 0", "0 0", `0 ${dy}`, `0 ${dy}`, "0 0", "0 0"], [0, 0.25, 0.45, 0.62, 0.82, 1]);

/* a right-hand page turns toward the spine. */
const flip = { pivot: [12, 13], anim: tn("scale", ["1 1", "1 1", "0.55 1", "1 1", "1 1"], [0, 0.28, 0.5, 0.74, 1]) };

/* text lines fade in, reading order. */
const reading = (t0) => [an("opacity", ["0.3", "0.3", "1", "1"], [0, t0, t0 + 0.25, 1])];

/** Pen badge (STYLE.md accents): a hollow 45° pen, nib at (tx, ty), with a
 *  round back end. One shape for every *-pen / *-edit badge. */
const pen = (tx, ty, L = 9.4, w = 1.9, nl = 2.6) => {
  const r = (v) => +v.toFixed(2), k = Math.SQRT1_2;
  const P = (d, s) => `${r(tx + k * d + k * s)} ${r(ty - k * d + k * s)}`;
  return `M${tx} ${ty}L${P(nl, w)}L${P(L, w)}A${w} ${w} 0 0 0 ${P(L, -w)}L${P(nl, -w)}Z`;
};

export const icons = {
  /* clipboard + pencil — pencil dips, the check draws itself */
  assignments: {
    auto: false,
    dur: 1.7,
    parts: [
      G("pen", [
        path("M3.5 5.1c0-1 .8-1.7 1.7-1.7s1.7.7 1.7 1.7v12.4l-1.7 2.8-1.7-2.8z"),
        line(3.6, 7.6, 6.8, 7.6),
      ]),
      rect(9.4, 3.4, 11, 14.2, 2.4),
      path("M12.3 7.4h4.4M12.3 10.8h4.4"),
      traced(path("M13.6 15l1.6 1.6 3.2-3.4"), 0.28, 0.58),
    ],
    gAnims: { pen: tn("translate", ["0 0", "0 0", "0 0.9", "0 0", "0 0"], [0, 0.25, 0.45, 0.68, 1]) },
  },
  /* Bohr atom: three intersecting ellipses + nucleus, electrons ride the orbits */
  atom01: {
    auto: false,
    dur: 1.9,
    parts: [
      /* slimmer orbits and a solid nucleus: the r1.9 ring at the crossing
         point closed up, and r1 electrons vanished into the orbit stroke */
      ellipse(12, 12, 8.6, 3.3),
      ellipse(12, 12, 8.6, 3.3, { transform: "rotate(60 12 12)" }),
      ellipse(12, 12, 8.6, 3.3, { transform: "rotate(120 12 12)" }),
      circle(12, 12, 1.5, fill()),
      A(circle(20.6, 12, 1.5, fill()), [an("r", ["1.5", "1.5", "1.9", "1.5", "1.5"], [0, 0.1, 0.24, 0.4, 1])]),
      A(circle(16.3, 4.55, 1.5, fill()), [an("r", ["1.5", "1.5", "1.9", "1.5", "1.5"], [0, 0.4, 0.54, 0.7, 1])]),
      A(circle(7.7, 4.55, 1.5, fill()), [an("r", ["1.5", "1.5", "1.9", "1.5", "1.5"], [0, 0.7, 0.84, 0.98, 1])]),
    ],
  },
  /* crossed orbits + nucleus — orbits precess against each other */
    "atom02": { dur: 1.9,
    auto: false,
    parts: [
    G("o1", [
      path("M20.1 20.1C18.21 21.99 13.08 19.83 8.63 15.38S2.01 5.79 3.9 3.9C5.79 2.01 10.92 4.17 15.38 8.63S21.99 18.21 20.1 20.1Z"),
    ]),
    G("o2", [
      path("M20.1 3.9C21.99 5.79 19.83 10.92 15.38 15.38S5.79 21.99 3.9 20.1C2.01 18.21 4.17 13.08 8.63 8.63S18.21 2.01 20.1 3.9Z"),
    ]),
    circle(12, 12, 1.89, { fill: "currentColor", stroke: "none" }),
  ],
    gAnims: { o1: tn("rotate", ["0 12 12", "14 12 12", "14 12 12", "0 12 12", "0 12 12"], [0, 0.35, 0.55, 0.85, 1]), o2: tn("rotate", ["0 12 12", "-14 12 12", "-14 12 12", "0 12 12", "0 12 12"], [0, 0.35, 0.55, 0.85, 1]) } },
  /* orbital swoosh + bolt — the bolt flickers */
    "atomic-power": { dur: 1.6,
    auto: false,
    parts: [
    path("M19.92 7.66C20.49 6.06 20.4 4.55 19.55 3.7C17.85 2 13.04 3.32 8.6 7.75C7.19 9.17 5.96 10.68 5.11 12.28"),
    path("M4.08 16.34C3.51 17.94 3.6 19.45 4.45 20.3C6.15 22 10.96 20.68 15.4 16.25C16.81 14.83 18.04 13.32 18.89 11.72"),
    A(path("M12.94 8.79L10.77 12.09C10.58 12.38 10.77 12.75 11.15 12.75L12.57 12.75L11.15 15.4C10.96 15.77 11.53 16.15 11.91 15.87L14.08 12.57C14.26 12.28 14.08 11.91 13.7 11.91L12.28 11.91L13.7 9.26C13.89 8.89 13.32 8.51 12.94 8.79Z"), [an("opacity", ["1", "0.5", "1", "0.7", "1"], [0, 0.3, 0.5, 0.68, 1])]),
  ] },
  "book-a": {
    auto: false,
    dur: 1.7,
    parts: [...book(), traced(path("M9.4 13.4l2.6-5.6 2.6 5.6M10.5 11.6h3"), 0.15, 0.6)],
  },
  "book-alert": {
    auto: false,
    dur: 1.6,
    parts: [...book(), G("bang", [path("M12 6.8v3.8"), circle(12, 13, 1, fill())])],
    sAnims: { bang: { pivot: [12, 10.2], anim: tn("scale", ["1", "1", "1.2", "1", "1"], [0, 0.28, 0.46, 0.7, 1]) } },
  },
  "book-bookmark01": {
    auto: false,
    dur: 1.6,
    parts: [...book(), G("ribbon", [path("M9.5 3.5v6.2l2.5-2 2.5 2V3.5")])],
    gAnims: { ribbon: tug },
  },
  "book-bookmark02": {
    auto: false,
    dur: 1.6,
    parts: [...book(), G("ribbon", [path("M9.5 2.7v7.7l2.5-2.1 2.5 2.1V2.7")])],
    gAnims: { ribbon: tug },
  },
  "book-check": {
    auto: false,
    dur: 1.6,
    parts: [...book(), traced(path("M9.1 10.6l2.4 2.4 4.6-5"), 0.2, 0.55)],
  },
  /* two overlapping books — the front copy slides clear */
  "book-copy": {
    auto: false,
    dur: 1.6,
    parts: [
      G("back", [
        path("M9.4 6.9c0-1.7 1.4-3.1 3.1-3.1h5.9c1.7 0 3.1 1.4 3.1 3.1v6.2"),
      ]),
      path("M14.9 15.2V11c0-1.4-1.1-2.5-2.5-2.5H6.4c-1.4 0-2.5 1.1-2.5 2.5v7.4"),
      path("M14.9 15.2H6.9c-1.6 0-2.9.9-2.9 2.1s1.3 2.1 2.9 2.1h8v-4.2"),
    ],
    gAnims: { back: tn("translate", ["0 0", "0 0", "0.9 -0.9", "0.9 -0.9", "0 0", "0 0"], [0, 0.25, 0.45, 0.6, 0.8, 1]) },
  },
  "book-dashed": {
    auto: false,
    pp: false,
    parts: [
      A(path("M20.1 16.7V6.4c0-1.8-1.5-3.3-3.4-3.3H7.7C5.8 3.1 4.3 4.6 4.3 6.4v12.7", { "stroke-dasharray": "3.1 2.4" }), [
        an("stroke-dashoffset", ["0", "-11"]),
      ]),
      A(path("M20.1 16.7H7.7c-1.9 0-3.4 1-3.4 2.4s1.5 2.4 3.4 2.4h12.4v-4.8", { "stroke-dasharray": "3.1 2.4" }), [
        an("stroke-dashoffset", ["0", "-11"]),
      ]),
    ],
  },
  "book-down": {
    auto: false,
    dur: 1.5,
    parts: [...book(), G("dn", [path("M17.2 3.4v5"), path("M14.7 6.2l2.5 2.5 2.5-2.5")])],
    gAnims: { dn: ride(1.4) },
  },
  "book-download": {
    auto: false,
    dur: 1.5,
    parts: [...book(), G("dn", [path("M12 7v4.4M9.8 9.2l2.2 2.2 2.2-2.2")])],
    gAnims: { dn: ride(1.4) },
  },
  /* open book + pencil — the pencil scribbles */
  "book-edit": {
    auto: false,
    dur: 1.6,
    parts: [
      path("M11.4 17.9V5.9c-.8-1.4-2.1-2.3-3.9-2.3H4.9c-1.1 0-2 .9-2 2v7.6c0 1.2.8 2.1 2 2.2l4.2.3c1.2.1 2.2 1.1 2.3 2.2"),
      path("M11.4 5.9c.8-1.4 2.1-2.3 3.9-2.3h2.6c1.1 0 2 .9 2 2v3.4"),
      G("scribble", [path(pen(13.2, 21.2))]),
    ],
    gAnims: { scribble: tn("translate", ["0 0", "0 0", "-0.9 -0.9", "0.4 0.4", "0 0"], [0, 0.25, 0.45, 0.62, 1]) },
  },
  "book-headphones": {
    auto: false,
    dur: 1.6,
    parts: [
      ...book(false),
      G("cans", [
        path("M8.6 11.2a3.4 3.4 0 0 1 6.8 0"),
        rect(7.9, 10.8, 1.5, 2.8, 0.75),
        rect(14.6, 10.8, 1.5, 2.8, 0.75),
      ]),
    ],
    gAnims: { cans: tn("translate", ["0 0", "0 -0.6", "0 0", "0 -0.4", "0 0"], [0, 0.2, 0.4, 0.56, 1]) },
  },
  "book-heart": {
    auto: false,
    dur: 1.6,
    parts: [
      ...book(),
      G("beat", [path("M12 14.3s-3.4-2.3-3.9-4.3c-.3-1.4.8-2.6 2.1-2.6.8 0 1.4.4 1.8 1 .4-.6 1-1 1.8-1 1.3 0 2.4 1.2 2.1 2.6-.5 2-3.9 4.3-3.9 4.3z")]),
    ],
    sAnims: { beat: { pivot: [12, 10.8], anim: tn("scale", ["1", "1.16", "1"]) } },
  },
  "book-image": {
    auto: false,
    dur: 1.6,
    parts: [
      ...book(),
      A(circle(9.4, 7.3, 1, fill()), [an("r", ["1", "1", "1.5", "1", "1"], [0, 0.3, 0.5, 0.75, 1])]),
      path("M7.6 14.4l2.7-2.7 2.2 2.2 1.9-1.9 2.2 2.2"),
    ],
  },
  "book-key": {
    auto: false,
    dur: 1.6,
    parts: [
      ...book(false),
      G("turn", [circle(10.7, 9.8, 1.9), path("M12.3 8.2l4.2-4.2M14.7 5.8l1.6 1.6")]),
    ],
    gAnims: { turn: tn("rotate", ["0 10.7 9.8", "0 10.7 9.8", "-14 10.7 9.8", "0 10.7 9.8", "0 10.7 9.8"], [0, 0.25, 0.45, 0.7, 1]) },
  },
  "book-lock": {
    auto: false,
    dur: 1.6,
    parts: [
      ...book(),
      G("shackle", [path("M10.4 10.6V9.2a1.6 1.6 0 0 1 3.2 0v1.4")]),
      rect(8.9, 10.6, 6.2, 4.9, 1.9),
    ],
    gAnims: { shackle: tn("translate", ["0 0", "0 0", "0 -0.8", "0 -0.8", "0 0", "0 0"], [0, 0.25, 0.45, 0.6, 0.8, 1]) },
  },
  "book-marked": {
    auto: false,
    dur: 1.6,
    parts: [...book(), G("ribbon", [path("M14.8 2.9v7.3l2.4-2 2.4 2V2.9")])],
    gAnims: { ribbon: tug },
  },
  "book-minus": {
    auto: false,
    dur: 1.6,
    parts: [...book(), traced(path("M9.4 10h5.2"), 0.25, 0.55)],
  },
  "book-open-check": {
    auto: false,
    dur: 1.7,
    parts: [path(OPEN_L), path(OPEN_R), traced(path("M15.4 18.2l1.5 1.5 3.2-3.4"), 0.25, 0.55)],
  },
  "book-open-text": {
    auto: false,
    dur: 1.8,
    parts: [
      path(OPEN_L),
      path(OPEN_R),
      A(path("M6.2 8.6h3M6.2 11.6h3M6.2 14.6h3"), reading(0.15)),
      A(path("M14.8 8.6h3M14.8 11.6h3M14.8 14.6h3"), reading(0.45)),
    ],
  },
  "book-open01": {
    auto: false,
    dur: 1.7,
    parts: [path(OPEN_L), G("pg", [path(OPEN_R)])],
    sAnims: { pg: flip },
  },
  "book-open02": {
    auto: false,
    dur: 1.7,
    parts: [
      path(OPEN_L),
      path(OPEN_R),
      G("pg", [
        path("M12 6.5c1.1-1.7 2.9-2.6 5-2.2.7.1 1.1.7 1.1 1.3v7.6c0 .7-.5 1.2-1.1 1.4-1.8.6-3.6 1.4-5 2.8"),
      ]),
    ],
    sAnims: { pg: flip },
  },
  "book-plus": {
    auto: false,
    dur: 1.5,
    parts: [...book(), G("pop", [path("M12 7.4v5.2M9.4 10h5.2")])],
    sAnims: { pop: { pivot: [12, 10], anim: tn("scale", ["1", "1", "1.22", "1", "1"], [0, 0.28, 0.48, 0.72, 1]) } },
  },
  "book-search": {
    auto: false,
    dur: 1.7,
    parts: [
      ...book(false),
      G("scan", [circle(15.4, 14.2, 2.8), line(17.8, 16.6, 20.2, 19)]),
    ],
    gAnims: { scan: tn("translate", ["0 0", "0 0", "-1.1 -1.4", "-1.1 -1.4", "0 0", "0 0"], [0, 0.28, 0.5, 0.65, 0.85, 1]) },
  },
  "book-text": {
    auto: false,
    dur: 1.8,
    parts: [...book(), A(path("M8.8 7.2h6.4M8.8 10.8h6.4M8.8 14.4h3.6"), reading(0.15))],
  },
  "book-type": {
    auto: false,
    dur: 1.7,
    parts: [...book(), traced(path("M9.3 6.6h5.4M12 6.6v6.8M10.5 13.4h3"), 0.15, 0.6)],
  },
  "book-up-two": {
    auto: false,
    dur: 1.5,
    parts: [...book(), G("up", [path("M14.7 5.4l2.5-2.5 2.5 2.5"), path("M14.7 8.8l2.5-2.5 2.5 2.5")])],
    gAnims: { up: ride(-1.2) },
  },
  "book-up2": {
    auto: false,
    dur: 1.5,
    parts: [...book(), G("up", [path("M17.2 3.4v5"), path("M14.7 5.9l2.5-2.5 2.5 2.5")])],
    gAnims: { up: ride(-1.4) },
  },
  "book-upload": {
    auto: false,
    dur: 1.5,
    parts: [...book(), G("up", [path("M12 11.4V7M9.8 9.2l2.2-2.2 2.2 2.2")])],
    gAnims: { up: ride(-1.4) },
  },
  "book-user": {
    auto: false,
    dur: 1.7,
    parts: [
      ...book(),
      G("bob", [circle(12, 8.3, 1.8), path("M8.8 13.8c0-2 1.4-3.4 3.2-3.4s3.2 1.4 3.2 3.4")]),
    ],
    gAnims: { bob: tn("translate", ["0 0", "0 0", "0 -0.8", "0 0", "0 0"], [0, 0.3, 0.5, 0.75, 1]) },
  },
  "book-x": {
    auto: false,
    dur: 1.6,
    parts: [...book(), traced(path("M9.9 8l4.2 4.2M14.1 8l-4.2 4.2"), 0.2, 0.55)],
  },
  book01: {
    auto: false,
    dur: 1.6,
    parts: [...book(), G("ribbon", [path("M9.4 3.4v3.6")])],
    gAnims: { ribbon: tug },
  },
  book02: {
    auto: false,
    dur: 1.8,
    parts: [...book(), A(path("M8.6 7.2h6.6M8.6 10.6h4"), reading(0.15))],
  },
  /* spine line runs top to bottom — the bookmark edge pulses */
  book03: {
    auto: false,
    dur: 1.8,
    parts: [...book(), A(path("M8.3 3.4v13.3"), [an("opacity", ["0.4", "0.4", "1", "1"], [0, 0.3, 0.6, 1])])],
  },
  book04: {
    auto: false,
    dur: 1.8,
    parts: [...book(), A(path("M8.6 9.8h6.6M8.6 13.2h4"), reading(0.15))],
  },
  /* horizontal stack of three — the middle one slips out */
  "books01": { dur: 1.4, auto: true, parts: [
    /* the three spines were 1.6 apart and fused; now 2px of air each */
    rect(5, 2.8, 14.6, 3.8, 1.6),
    rect(3.6, 10.2, 14.6, 3.8, 1.6),
    rect(5.8, 17.6, 14.6, 3.8, 1.6),
  ] },
  /* stack + dangling ribbon — the ribbon sways */
    "books02": { dur: 1.8, auto: false,
      /* library row: three spines and one leaning against them */
      parts: [
        line(4.5, 4, 4.5, 20.5),
        line(9, 7.5, 9, 20.5),
        line(13.5, 5, 13.5, 20.5),
        G("lean", [line(17.2, 7, 20.6, 20.5)]),
      ],
      gAnims: { lean: tn("rotate", ["0 20.6 20.5", "-7 20.6 20.5", "3 20.6 20.5", "0 20.6 20.5"], [0, 0.3, 0.65, 1]) } },

  /* mortarboard + band — the tassel swings */
  "graduation-cap": {
    auto: false,
    dur: 1.8,
    parts: [
      path("M12 4.8L2.6 9.2l9.4 4.3 9.4-4.3z"),
      path("M6.9 11.7v4.5c0 1.4 2.3 2.6 5.1 2.6s5.1-1.2 5.1-2.6v-4.5"),
      G("tassel", [
        line(21.4, 9.2, 21.4, 14.2),
        circle(21.4, 15.4, 0.7, fill()),
      ]),
    ],
    gAnims: { tassel: tn("rotate", ["0 21.4 9.2", "-9 21.4 9.2", "7 21.4 9.2", "0 21.4 9.2"], [0, 0.3, 0.65, 1]) },
  },

  /* two tubes racked at different levels — bubbles rise */
  "test-tubes": {
    auto: false,
    dur: 2.4,
    parts: [
      line(3.8, 8.4, 20.2, 8.4),
      path("M6.4 4.2v12.9c0 1.5 1.2 2.7 2.7 2.7s2.7-1.2 2.7-2.7V4.2"),
      path("M14.2 4.2v12.9c0 1.5 1.2 2.7 2.7 2.7s2.7-1.2 2.7-2.7V4.2"),
      line(6.8, 11, 11.4, 11),
      line(14.6, 13, 19.2, 13),
      A(circle(8.6, 15.4, 0.55, fill()), [
        an("opacity", ["0", "0", "1", "0", "0"], [0, 0.3, 0.5, 0.7, 1]),
        tn("translate", ["0 0", "0 0", "0 -2.4", "0 -2.4"], [0, 0.3, 0.7, 1]),
      ]),
      A(circle(17.4, 16.2, 0.55, fill()), [
        an("opacity", ["0", "0", "1", "0", "0"], [0, 0.55, 0.75, 0.95, 1]),
        tn("translate", ["0 0", "0 0", "0 -2", "0 -2"], [0, 0.55, 0.95, 1]),
      ]),
    ],
  },

  /* schoolhouse — pennant flaps on the peak */
  "school": { dur: 1.4, auto: true, parts: [
    path("M3.5 20.5V10L12 5.5 20.5 10v10.5Z"),
    path("M12 5.5V2.5h3"),
    circle(12, 11.5, 1.5),
    path("M10 20.5v-3.2a2 2 0 0 1 4 0v3.2"),
  ] },

  /* easel board + tripod — the chart line draws itself */
  presentation: {
    auto: false,
    dur: 2,
    parts: [
      rect(3.4, 3.8, 17.2, 11.8, 1.6),
      traced(path("M7 12.4l2.5-3 1.9 1.9 2.6-3.4"), 0.2, 0.6),
      line(12, 15.6, 12, 17.4),
      line(12, 17.4, 9, 20.4),
      line(12, 17.4, 15, 20.4),
    ],
  },

  /* spiral-bound pad — binding ticks march down the left edge */
  notebook: {
    auto: false,
    dur: 2,
    parts: [
      path("M7.8 3h10.4c1.1 0 2 1 2 2.1v13.8c0 1.1-.9 2.1-2 2.1H7.8c-1.1 0-2-1-2-2.1V5.1c0-1.1.9-2.1 2-2.1z"),
      path("M10.4 3v18"),
      line(3.6, 7.4, 5.8, 7.4),
      line(3.6, 10.6, 5.8, 10.6),
      line(3.6, 13.8, 5.8, 13.8),
      line(3.6, 17, 5.8, 17),
    ],
  },

  /* three-atom molecule — bonds first, atoms pop on */
  molecule: {
    auto: false,
    dur: 2.1,
    parts: [
      line(9.4, 7.6, 10.8, 11.9),
      line(17.4, 8.6, 13.9, 11.8),
      line(10, 15.5, 8, 18.6),
      G("core", [circle(12.3, 13.8, 3)]),
      G("a1", [circle(8.2, 5.6, 2.3)]),
      G("a2", [circle(19.2, 7, 2)]),
      G("a3", [circle(6.8, 20.2, 1.8)]),
    ],
    sAnims: {
      core: { pivot: [12.3, 13.8], anim: tn("scale", ["1", "1", "1.15", "1", "1"], [0, 0.15, 0.33, 0.51, 1]) },
      a1: { pivot: [8.2, 5.6], anim: tn("scale", ["1", "1", "1.2", "1", "1"], [0, 0.35, 0.53, 0.71, 1]) },
      a2: { pivot: [19.2, 7], anim: tn("scale", ["1", "1", "1.2", "1", "1"], [0, 0.5, 0.68, 0.86, 1]) },
      a3: { pivot: [6.8, 20.2], anim: tn("scale", ["1", "1", "1.2", "1", "1"], [0, 0.62, 0.78, 0.94, 1]) },
    },
  },

  /* owl — brow line, big eyes, pupils blink */
  "owl": { dur: 1.4, auto: true, parts: [
    path("M5.5 9.5V4.5l3.6 2.2h5.8l3.6-2.2v5c0 5-2.8 9.5-6.5 11-3.7-1.5-6.5-6-6.5-11Z"),
    circle(9, 10.5, 2),
    circle(15, 10.5, 2),
    path("M12 12.8 11 14.4h2Z"),
  ] },
};
