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

// Chasing-arrow repeat loop: stadium-shaped, one-wing hook tips (45° energy),
// big soft C curves down the sides. Second arrow is the first rotated 180°.
const LOOP = [
  path("M16.7 3 L17.9 4.3 C18.4 4.8 18.2 5.2 17.5 5.2 H9.8 C6.2 5.2 2.9 8.3 2.9 11.9 C2.9 13.5 3.6 15 4.8 16.2"),
  path("M7.3 21 L6.1 19.7 C5.6 19.2 5.8 18.8 6.5 18.8 H14.2 C17.8 18.8 21.1 15.7 21.1 12.1 C21.1 10.5 20.4 9 19.2 7.8"),
];

export const icons = {
  /* the loop tries to turn and rocks back — repeat is switched off */
  "repeat-off": {
    dur: 1.6,
    auto: false,
    parts: [
      G("try", [...LOOP, line(9.5, 12, 14.5, 12)]),
    ],
    gAnims: {
      try: tn("rotate", ["0 12 12", "0 12 12", "-9 12 12", "6 12 12", "0 12 12"], HOLD),
    },
  },

  /* the loop keeps winding while the "1" beats on top */
  "repeat-one01": {
    dur: 1.9,
    auto: false,
    parts: [
      G("spin", [...LOOP]),
      G("one", [path("M13 15.2 L13 9.7 C13 9.2 12.5 9 12 9.2 L10.7 10.2")]),
    ],
    gAnims: { spin: tn("rotate", ["0 12 12", "360 12 12"]) },
    sAnims: { one: POP(12, 12.1, 1.18) },
  },

  /* tape cassette — spooled reels inside a trapezoid window; reels turn */
  cassette: {
    dur: 3.4,
    auto: false,
    pp: false,
    parts: [
      rect(3.4, 6.4, 17.2, 12.6, 1.6),
      path("M6.6 11.6h10.8l1.6 4.6H5z"),
      G("ra", [circle(8.8, 9.4, 1.4), path("M8.8 8v2.8")]),
      G("rb", [circle(15.2, 9.4, 1.4), path("M15.2 8v2.8")]),
    ],
    gAnims: {
      ra: tn("rotate", ["0 8.8 9.4", "360 8.8 9.4"]),
      rb: tn("rotate", ["0 15.2 9.4", "360 15.2 9.4"]),
    },
  },

  /* boombox — handle bar, twin speaker cones, dial dashes */
  "boombox": { dur: 1.4, auto: true, parts: [
    rect(2.5, 8, 19, 12, 2.5),
    path("M7 8V5.5h10V8"),
    circle(7.8, 14, 2.3),
    circle(16.2, 14, 2.3),
    path("M10.8 12.2h2.4"),
  ] },
};
