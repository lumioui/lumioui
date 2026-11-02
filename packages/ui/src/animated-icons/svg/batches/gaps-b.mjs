const path = (d, a = {}) => ({ e: "path", a: { d, ...a } });
const circle = (cx, cy, r, a = {}) => ({ e: "circle", a: { cx, cy, r, ...a } });
const line = (x1, y1, x2, y2, a = {}) => ({ e: "line", a: { x1, y1, x2, y2, ...a } });
const rect = (x, y, w, h, rx, a = {}) => ({ e: "rect", a: { x, y, width: w, height: h, rx, ...a } });
const ellipse = (cx, cy, rx, ry, a = {}) => ({ e: "ellipse", a: { cx, cy, rx, ry, ...a } });
const fill = (color = "currentColor") => ({ fill: color, stroke: "none" });
const an = (attr, values, times) => ({ kind: "attr", attr, values, times });
const tn = (type, values, times, extra = {}) => ({ kind: "transform", type, values, times, ...extra });
const A = (part, anims) => ({ ...part, anims });
const G = (id, children, a = {}) => ({ e: "g", g: id, a, children });

/* ---- bespoke gesture idioms (same vocabulary as the other craft batches)
   HOLD phrasing: rest ~30%+, act mid-cycle, settle back — pose at t=0
   always equals pose at t=1 so the loop is seamless. Motion only; no
   part geometry is touched. */
const HOLD = [0, 0.3, 0.55, 0.8, 1];
/* scale-pop around a mark's own center (sAnims entry). */
const POP = (cx, cy, s = 1.24) => ({
  pivot: [cx, cy],
  anim: tn("scale", ["1", "1", `${s}`, "1", "1"], HOLD),
});
/* wiggle — rotate −a then +a around a pivot, with rest holds (gAnims). */
const WIG = (cx, cy, a = 9) =>
  tn("rotate", [`0 ${cx} ${cy}`, `0 ${cx} ${cy}`, `-${a} ${cx} ${cy}`, `${a - 2} ${cx} ${cy}`, `0 ${cx} ${cy}`], HOLD);
/* dip — translate out along an axis and spring back (gAnims). */
const DIP = (dx, dy) => tn("translate", ["0 0", "0 0", `${dx} ${dy}`, "0 0", "0 0"], HOLD);
/* blink — opacity dips once on a mark (for A()). */
const BLINK = (lo = 0.2) => [an("opacity", ["1", "1", `${lo}`, "1", "1"], [0, 0.32, 0.46, 0.6, 1])];
/* broadcast ripple — scale-pop from a base point, offset into the cycle. */
const RIPPLE = (cx, cy, t0, s = 1.18) => ({
  pivot: [cx, cy],
  anim: tn("scale", ["1", "1", `${s}`, "1", "1"], [0, t0, +(t0 + 0.13).toFixed(3), +(t0 + 0.3).toFixed(3), 1]),
});

/* Closed capsule along axis a→b, radius r — a chain-link loop. */
const capsule = (ax, ay, bx, by, r) => {
  const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy);
  const nx = (-dy / L) * r, ny = (dx / L) * r, f = (v) => +v.toFixed(2);
  return `M${f(ax + nx)} ${f(ay + ny)}L${f(bx + nx)} ${f(by + ny)}A${r} ${r} 0 0 1 ${f(bx - nx)} ${f(by - ny)}L${f(ax - nx)} ${f(ay - ny)}A${r} ${r} 0 0 1 ${f(ax + nx)} ${f(ay + ny)}Z`;
};

/* Wifi fan — dot + three concentric arcs, centered on the dot. */
const WIFI_ARCS = [
  path("M9.3 16.3C10 15.6 11 15.1 12 15.1S14 15.6 14.7 16.3"),
  path("M6.4 13.5C8 11.9 9.9 11 12 11S16 11.9 17.6 13.5"),
  path("M3.4 10.5C5.9 8.1 8.9 6.8 12 6.8S18.1 8.1 20.6 10.5"),
];

export const icons = {
  /* ------------------------------ devices ------------------------------ */

  /* the arcs ripple outward from the dot, slowest last */
  wifi: {
    auto: false,
    dur: 2.0,
    parts: [
      G("dot", [circle(12, 19.2, 1.15, fill())]),
      G("a1", [WIFI_ARCS[0]]),
      G("a2", [WIFI_ARCS[1]]),
      G("a3", [WIFI_ARCS[2]]),
    ],
    sAnims: {
      dot: RIPPLE(12, 19.2, 0.08, 1.3),
      a1: RIPPLE(12, 19.2, 0.18),
      a2: RIPPLE(12, 19.2, 0.3),
      a3: RIPPLE(12, 19.2, 0.42),
    },
  },

  "wifi-off": {
    parts: [
      ...WIFI_ARCS,
      circle(12, 19.2, 1.15, fill()),
      line(4.6, 4.4, 19.4, 19.6),
    ],
  },

  /* the bind-rune — angular by nature, softened by round joins */
  bluetooth: {
    dur: 1.5,
    parts: [
      path("M6.8 7.4L16.4 17L12.4 20.9C12.2 21.1 11.9 21 11.9 20.6L11.9 3.4C11.9 3 12.2 2.9 12.4 3.1L16.4 7L6.8 16.6"),
    ],
  },

  /* signal dashes shimmy while the phone rattles */
  vibrate: {
    auto: false,
    dur: 1.6,
    parts: [
      G("dev", [rect(8.8, 3.2, 6.4, 17.6, 2.2)]),
      G("wL", [line(5.7, 10, 5.7, 14), line(3.1, 8.2, 3.1, 15.8)]),
      G("wR", [line(18.3, 10, 18.3, 14), line(20.9, 8.2, 20.9, 15.8)]),
    ],
    gAnims: {
      dev: tn("translate", ["0 0", "0 0", "-0.9 0", "0.9 0", "-0.55 0", "0.55 0", "0 0", "0 0"], [0, 0.3, 0.38, 0.46, 0.54, 0.62, 0.72, 1]),
      wL: tn("translate", ["0 0", "0 0", "-0.5 0", "0 0", "0 0"], [0, 0.34, 0.44, 0.58, 1]),
      wR: tn("translate", ["0 0", "0 0", "0.5 0", "0 0", "0 0"], [0, 0.36, 0.46, 0.6, 1]),
    },
  },

  /* ------------------------------ media ------------------------------ */

  /* speaker cone + one sound arc */
  volume: {
    dur: 1.5,
    parts: [
      path("M11.5 4.7C12.3 4.7 12.9 5.3 12.9 6.1L12.9 17.9C12.9 18.7 12.3 19.3 11.5 19.3C11.1 19.3 10.7 19.1 10.3 18.8L7.3 15.4L5.4 15.4C4.2 15.4 3.4 14.6 3.4 13.4L3.4 10.6C3.4 9.4 4.2 8.6 5.4 8.6L7.3 8.6L10.3 5.2C10.7 4.9 11.1 4.7 11.5 4.7Z"),
      path("M15.9 9.3C16.8 10.2 17.3 11.1 17.3 12S16.8 13.8 15.9 14.7"),
    ],
  },

  /* cone + two arcs that breathe outward on the beat */
  "volume-2": {
    auto: false,
    dur: 1.6,
    parts: [
      path("M11.5 4.7C12.3 4.7 12.9 5.3 12.9 6.1L12.9 17.9C12.9 18.7 12.3 19.3 11.5 19.3C11.1 19.3 10.7 19.1 10.3 18.8L7.3 15.4L5.4 15.4C4.2 15.4 3.4 14.6 3.4 13.4L3.4 10.6C3.4 9.4 4.2 8.6 5.4 8.6L7.3 8.6L10.3 5.2C10.7 4.9 11.1 4.7 11.5 4.7Z"),
      G("w1", [path("M15.7 9.5C16.5 10.3 17 11.1 17 12S16.5 13.7 15.7 14.5")]),
      G("w2", [path("M18.4 6.8C19.8 8.2 20.7 10 20.7 12S19.8 15.8 18.4 17.2")]),
    ],
    sAnims: {
      w1: RIPPLE(12.9, 12, 0.24, 1.16),
      w2: RIPPLE(12.9, 12, 0.36, 1.1),
    },
  },

  /* two crossing swoops; each nudges along its own slope */
  shuffle: {
    auto: false,
    dur: 1.5,
    parts: [
      G("up", [
        path("M3 17.6L6.2 17.6C7.8 17.6 9.1 16.9 10.2 15.7L14.5 10.4C15.7 9 17.2 8.3 18.9 8.3L20.6 8.3"),
        path("M17.2 4.7L20.9 8.3L17.2 11.9"),
      ]),
      G("dn", [
        path("M3 6.4L6.2 6.4C7.8 6.4 9.1 7.1 10.2 8.3L14.5 13.6C15.7 15 17.2 15.7 18.9 15.7L20.6 15.7"),
        path("M17.2 12.1L20.9 15.7L17.2 19.3"),
      ]),
    ],
    gAnims: {
      up: DIP(0.9, -0.9),
      dn: DIP(0.9, 0.9),
    },
  },

  /* bar + plump triangle, apex left */
  "skip-back": {
    dur: 1.3,
    parts: [
      line(5.4, 6.4, 5.4, 17.6),
      path("M16.9 7.5L9.6 11.3C8.9 11.7 8.9 12.3 9.6 12.7L16.9 16.5C17.6 16.9 18.4 16.4 18.4 15.5L18.4 8.5C18.4 7.6 17.6 7.1 16.9 7.5Z"),
    ],
  },

  /* plump triangle + bar, apex right */
  "skip-forward": {
    dur: 1.3,
    parts: [
      path("M7.1 7.5L14.4 11.3C15.1 11.7 15.1 12.3 14.4 12.7L7.1 16.5C6.4 16.9 5.6 16.4 5.6 15.5L5.6 8.5C5.6 7.6 6.4 7.1 7.1 7.5Z"),
      line(18.6, 6.4, 18.6, 17.6),
    ],
  },

  /* landscape strip: side columns, center frame, sprocket dashes */
  film: {
    dur: 1.5,
    parts: [
      rect(3.4, 4.8, 17.2, 14.4, 2.4),
      line(8.2, 4.8, 8.2, 19.2),
      line(15.8, 4.8, 15.8, 19.2),
      line(3.4, 12, 20.6, 12),
      line(4.6, 7.6, 7, 7.6),
      line(4.6, 16.4, 7, 16.4),
      line(17, 7.6, 19.4, 7.6),
      line(17, 16.4, 19.4, 16.4),
    ],
  },

  /* ------------------------------ ui ------------------------------ */

  /* comet arc + bulb head, spins continuously */
  loader: {
    auto: false,
    pp: false,
    dur: 1.15,
    parts: [
      G("spin", [
        path("M19.4 7.2A8.8 8.8 0 1 0 20.7 12.8"),
        circle(19.4, 7.2, 1.05, fill()),
      ]),
    ],
    gAnims: { spin: tn("rotate", ["0 12 12", "360 12 12", "0 12 12"], [0, 0.97, 1]) },
  },

  /* three plump dots, popping in sequence */
  "more-horizontal": {
    dur: 1.5,
    parts: [circle(5.3, 12, 1.7, fill()), circle(12, 12, 1.7, fill()), circle(18.7, 12, 1.7, fill())],
  },

  "more-vertical": {
    dur: 1.5,
    parts: [circle(12, 5.3, 1.7, fill()), circle(12, 12, 1.7, fill()), circle(12, 18.7, 1.7, fill())],
  },

  /* doorway C + arrow that slips out through the open side */
  "log-out": {
    auto: false,
    dur: 1.5,
    parts: [
      path("M14.6 20.6L7.6 20.6C5.7 20.6 4.3 19.2 4.3 17.3L4.3 6.7C4.3 4.8 5.7 3.4 7.6 3.4L14.6 3.4"),
      G("out", [line(9.8, 12, 20.7, 12), path("M16.2 7.4L20.8 12L16.2 16.6")]),
    ],
    gAnims: { out: DIP(1.8, 0) },
  },

  /* </> chevrons + a leaning slash */
  code: {
    dur: 1.5,
    parts: [
      path("M9.6 7L5 12L9.6 17"),
      path("M14.4 7L19 12L14.4 17"),
      line(13.7, 5.4, 10.3, 18.6),
    ],
  },

  /* bullet dots + rule lines; middle line a touch shorter */
  list: {
    dur: 1.4,
    parts: [
      circle(4.3, 6.6, 0.95, fill()),
      circle(4.3, 12, 0.95, fill()),
      circle(4.3, 17.4, 0.95, fill()),
      line(7.6, 6.6, 19.8, 6.6),
      line(7.6, 12, 18.2, 12),
      line(7.6, 17.4, 19.8, 17.4),
    ],
  },

  /* serif-capped T on a baseline */
  type: {
    dur: 1.4,
    parts: [
      path("M5 7.4C5 6 5.8 5 7 5L17 5C18.2 5 19 6 19 7.4"),
      line(12, 5, 12, 18.6),
      line(8.6, 18.6, 15.4, 18.6),
    ],
  },

  /* bare arrow down — same surge idiom as arrow-up/left/right */
  "arrow-down": {
    auto: false,
    dur: 1.15,
    parts: [
      G("surge", [line(4.5, 12, 18.4, 12), path("M13.4 6.6l5.5 5.4-5.5 5.6")], { transform: "rotate(90 12 12)" }),
    ],
    gAnims: { surge: tn("translate", ["0 0", "3.4 0", "0 0"], null, { additive: "sum" }) },
  },

  /* ------------------------------ messaging ------------------------------ */

  /* round bubble with a soft tail, bottom-left */
  "message-circle": {
    dur: 1.5,
    parts: [
      path("M8.6 19.6A8.6 8.6 0 1 0 4.5 16.1L3.3 21.2Z"),
    ],
  },

  /* ? rocks gently inside its circle */
  "question-circle": {
    auto: false,
    dur: 1.6,
    parts: [
      circle(12, 12, 8.6),
      G("q", [
        path("M10.1 9.2C10.2 7.9 11.2 7 12.3 7.1C13.4 7.2 14.2 8.1 14.2 9.2C14.2 10.6 12.8 10.8 12.3 11.9C12.1 12.3 12 12.8 12 13.4"),
        circle(12, 16.4, 1.05, fill()),
      ]),
    ],
    gAnims: { q: WIG(12, 12, 7) },
  },

  /* soft triangle + the family bang pop */
  "alert-triangle": {
    auto: false,
    dur: 1.6,
    parts: [
      path("M10.7 4.5C11.4 3.3 12.6 3.3 13.3 4.5L20.4 16.2C21.2 17.6 20.4 19.3 18.9 19.3L5.1 19.3C3.6 19.3 2.8 17.6 3.6 16.2L10.7 4.5Z"),
      G("bang", [line(12, 8.6, 12, 12.8), circle(12, 16, 1.15, fill())]),
    ],
    sAnims: { bang: POP(12, 12, 1.15) },
  },

  /* two interlocked chain loops — closed capsules on one diagonal */
  link: {
    dur: 1.6,
    parts: [
      path("M10.2 13.8a4.6 4.6 0 0 0 6.9.5l2.6-2.6a4.6 4.6 0 0 0-6.5-6.5l-1.5 1.5"),
      path("M13.8 10.2a4.6 4.6 0 0 0-6.9-.5l-2.6 2.6a4.6 4.6 0 0 0 6.5 6.5l1.5-1.5"),
    ],
  },

  /* ------------------------------ commerce ------------------------------ */

  /* basket + two plump wheels */
  "shopping-cart": {
    dur: 1.5,
    parts: [
      path("M2.9 4.1L4.5 4.1C5.2 4.1 5.7 4.5 5.9 5.2L8.2 13.5C8.6 14.9 9.8 15.9 11.3 15.9L16.9 15.9C18.3 15.9 19.4 15.1 19.8 13.7L21.1 8.5C21.4 7.6 20.7 6.7 19.8 6.7L6.4 6.7"),
      circle(10.2, 19.8, 1.7),
      circle(17.6, 19.8, 1.7),
    ],
  },

  /* ------------------------------ software ------------------------------ */

  /* big 4-point star, small star, one glint dot — twinkle cascade */
  sparkles: {
    auto: false,
    dur: 2.0,
    parts: [
      G("s1", [path("M9.8 4.6C10.3 8.8 11.4 10 15.6 10.6 11.4 11.2 10.3 12.4 9.8 16.6 9.3 12.4 8.2 11.2 4 10.6 8.2 10 9.3 8.8 9.8 4.6Z")]),
      G("s2", [path("M17.4 13.2C17.7 15.6 18.4 16.3 20.8 16.6 18.4 16.9 17.7 17.6 17.4 20 17.1 17.6 16.4 16.9 14 16.6 16.4 16.3 17.1 15.6 17.4 13.2Z")]),
    ],
    sAnims: {
      s1: { pivot: [9.8, 10.6], anim: tn("scale", ["1", "1", "1.12", "1", "1"], [0, 0.18, 0.34, 0.5, 1]) },
      s2: { pivot: [17.4, 16.6], anim: tn("scale", ["1", "1", "1.25", "1", "1"], [0, 0.38, 0.53, 0.68, 1]) },
    },
  },

  /* the classic cursor arrowhead */
  pointer: {
    dur: 1.4,
    parts: [
      path("M5 4.5L19.4 11.3C19.9 11.5 19.9 12.1 19.4 12.3L13.2 14.2L11.9 20.1C11.7 20.7 11 20.6 10.8 20.1L4.5 5.2C4.3 4.7 4.5 4.3 5 4.5Z"),
    ],
  },
};
