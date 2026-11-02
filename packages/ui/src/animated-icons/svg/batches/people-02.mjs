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

/* Direction helpers: bases point RIGHT; mirror for left, rotate for down. */
const L = { transform: "translate(24 0) scale(-1 1)" };
const D = { transform: "rotate(90 12 12)" };
const t = (parts, tr) => parts.map((p) => ({ ...p, a: { ...p.a, ...tr } }));

/* pathLength-normalized draw-on: invisible in the static render. */
const traced = (p, t0, t1) =>
  A({ ...p, a: { ...p.a, pathLength: 1, "stroke-dasharray": 1 } }, [
    an("stroke-dashoffset", ["1", "1", "0", "0"], [0, t0, t1, 1]),
  ]);

/* Pointing hands poke along their direction: lead jab, settle back. */
const poke = (dx, dy) => tn("translate", ["0 0", "0 0", `${dx} ${dy}`, `${dx} ${dy}`, "0 0", "0 0"], [0, 0.22, 0.38, 0.55, 0.75, 1]);

/* Right-pointing bases: fist, scalloped curled fingers, round-tipped index. */
const point01 = [
  path("M14 9H18a2 2 0 0 1 0 4H15a1.6 1.6 0 0 1 0 3.2h-.4a1.6 1.6 0 0 1-.2 3.2H3.5M3.5 7H12a2 2 0 0 1 2 2"),
  path("M7.5 7v12.4"),
];
const point02 = [
  path("M14 9H18a2 2 0 0 1 0 4H15a1.6 1.6 0 0 1 0 3.2h-.4a1.6 1.6 0 0 1-.2 3.2H8.5A5 5 0 0 1 3.5 14.4V11.5A4.5 4.5 0 0 1 8 7H12a2 2 0 0 1 2 2Z"),
];
const point03 = [
  path("M14 9H18a2 2 0 0 1 0 4H15a1.6 1.6 0 0 1 0 3.2h-.4a1.6 1.6 0 0 1-.2 3.2H8.5A5 5 0 0 1 3.5 14.4V11.5A4.5 4.5 0 0 1 8 7H12a2 2 0 0 1 2 2Z"),
  path("M13.5 13C10.5 13 9 14 9 16"),
];
const point04 = [
  path("M14 9H18a2 2 0 0 1 0 4H15a1.6 1.6 0 0 1 0 3.2h-.4a1.6 1.6 0 0 1-.2 3.2H3.5M3.5 7H12a2 2 0 0 1 2 2"),
  path("M13.5 13C11.5 13 11 13.8 11 15.2"),
  path("M7.5 7v12.4"),
];


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
/* wiggle — rotate -a then +a around a pivot, with rest holds (gAnims). */
const WIG = (cx, cy, a = 9) =>
  tn("rotate", [`0 ${cx} ${cy}`, `0 ${cx} ${cy}`, `-${a} ${cx} ${cy}`, `${a - 2} ${cx} ${cy}`, `0 ${cx} ${cy}`], HOLD);
/* dip — translate out along an axis and spring back (gAnims). */
const DIP = (dx, dy) => tn("translate", ["0 0", "0 0", `${dx} ${dy}`, "0 0", "0 0"], HOLD);
/* nudge one part along an axis, then spring back (for A()). */
const SHIFT = (p, dx, dy) =>
  A(p, [tn("translate", ["0 0", "0 0", `${dx} ${dy}`, "0 0", "0 0"], HOLD)]);
/* blink — opacity dips once on a mark (for A()). */
const BLINK = (lo = 0.2) => [an("opacity", ["1", "1", `${lo}`, "1", "1"], [0, 0.32, 0.46, 0.6, 1])];
/* trace — the stroke writes itself on (checks, waveforms, signatures). */
const DRAW = (p, t0 = 0.15, t1 = 0.62) =>
  A({ ...p, a: { ...p.a, pathLength: 1, "stroke-dasharray": 1 } },
    [an("stroke-dashoffset", ["1", "1", "0", "0"], [0, t0, t1, 1])]);
export const icons = {  football: {
    auto: false,
    dur: 1.5,
    parts: [
      G("ball", [
        circle(12, 12, 8.5),
        path("M12 8l3.6 2.7-1.4 4.3H9.8L8.4 10.7z"),
        path("M12 8V3.8M15.6 10.7l3.5-1.6M14.2 15l2.4 3M9.8 15l-2.4 3M8.4 10.7l-3.5-1.6"),
        path("M9 3l3 1.9 3-1.9M4.6 16.9l3.7.1.1 3.9M19.9 5.7l-1.2 3.1 3 2.1"),
      ]),
    ],
    gAnims: { ball: DIP(0, -1.4) },
  },

  "football-pitch": {
    auto: false,
    dur: 1.5,
    parts: [
      rect(2.7, 4.7, 18.6, 14.6, 2.5),
      G("spot", [circle(12, 12, 2.1)]),
      path("M12 4.7v5.2M12 14.1v5.2"),
      path("M21.3 9.2h-2.4c-.4 0-.8.3-.8.8v4c0 .5.4.8.8.8h2.4M2.7 9.2h2.4c.4 0 .8.3.8.8v4c0 .5-.4.8-.8.8H2.7"),
    ],
    sAnims: { spot: POP(12, 12, 1.25) },
  },

  "footprints": { dur: 1.4, auto: true, parts: [
    path("M7 4.5c1.8 0 2.8 1.8 2.8 4 0 2.2-.8 3.6-2.8 3.6S4.2 10.7 4.2 8.5c0-2.2 1-4 2.8-4Z M7 15.4h.01", { transform: "translate(0 0) scale(1)" }),
    circle(7, 16.5, 1.6),
    path("M7 4.5c1.8 0 2.8 1.8 2.8 4 0 2.2-.8 3.6-2.8 3.6S4.2 10.7 4.2 8.5c0-2.2 1-4 2.8-4Z M7 15.4h.01", { transform: "translate(10 3) scale(1)" }),
    circle(17, 19.5, 1.6),
  ] },

  group: {
    auto: false,
    dur: 1.5,
    parts: [
      G("box", [path("M14.6 18.3h-2.1c-1.4 0-2.5-1.1-2.5-2.5v-2.1c0-1.4 1.1-2.5 2.5-2.5h2.1c1.4 0 2.5 1.1 2.5 2.5v2.1c0 1.4-1.1 2.5-2.5 2.5z")]),
      path("M10 13.2c-1.7 0-3-1.3-3-3V8.7c0-1.7 1.3-3 3-3h1.6c1.7 0 3 1.3 3 3"),
      path("M16 21h.8c1.9 0 3.2-1.3 3.2-3.2V17M8 3h-.8C5.3 3 4 4.3 4 6.2V7M8 21h-.8C5.3 21 4 19.7 4 17.8V17M16 3h.8c1.9 0 3.2 1.3 3.2 3.2V7"),
    ],
    sAnims: { box: POP(12.4, 14.8, 1.18) },
  },

  "group-items": {
    auto: false,
    dur: 1.6,
    parts: [
      circle(4, 4, 1.7),
      circle(20, 4, 1.7),
      circle(20, 20, 1.7),
      circle(4, 20, 1.7),
      path("M20 6.5v11M17.5 20h-11M17.5 4h-11M4 6.5v11"),
      G("items", [
        rect(8.3, 8.4, 7.4, 2.6, 1.3),
        rect(8.3, 13.9, 7.4, 2.6, 1.3),
      ]),
    ],
    gAnims: { items: DIP(0, -0.7) },
  },

  "group-layers": {
    auto: false,
    dur: 1.7,
    parts: [
      circle(4, 4, 1.7),
      circle(20, 4, 1.7),
      circle(20, 20, 1.7),
      circle(4, 20, 1.7),
      path("M20 6.5v11M17.5 20h-11M17.5 4h-11M4 6.5v11"),
      G("layer", [path("M12 8.3l3.8 2.2c.4.2.4.8 0 1l-3.8 2.2-3.8-2.2c-.4-.2-.4-.8 0-1z")]),
      path("M8.4 13.9l3.6 2.1 3.6-2.1"),
    ],
    gAnims: { layer: DIP(0, 0.9) },
  },

  group01: {
    auto: false,
    dur: 1.5,
    parts: [
      circle(4.5, 5.5, 1.15, fill()),
      circle(9, 12, 1.15, fill()),
      circle(9, 18.5, 1.15, fill()),
      SHIFT(path("M8.5 5.5h11M13.5 12h6M13.5 18.5h6"), 0.8, 0),
    ],
  },

    "hand": { dur: 1.7,
    auto: false,
    parts: [
    G("hand", [
      path("M8.65 11.1L8.65 5.1M11.95 11.1L11.95 3.4M15.25 11.1L15.25 4.3M18.45 11.9L18.45 6.8"),
      path("M5.85 12.3L5.85 15.2C5.85 18.5 8.55 20.6 11.95 20.6L15.55 20.6C18.65 20.6 20.45 18.6 20.45 15.6L20.45 11.9"),
      path("M5.85 14.9C4.95 14.4 4.15 13.5 3.85 12.5C3.55 11.8 3.75 11 4.45 10.6C5.05 10.3 5.85 10.4 6.35 11L8.05 13"),
    ]),
  ],
    gAnims: { hand: tn("rotate", ["0 11.95 19.7", "0 11.95 19.7", "-8 11.95 19.7", "6 11.95 19.7", "0 11.95 19.7"], [0, 0.3, 0.55, 0.8, 1]) } },

  "hand-bag01": {
    auto: false,
    dur: 1.8,
    parts: [
      path("M6.4 9.5h11.2c.8 0 1.5.5 1.7 1.3l.9 4.1c.7 2.9.4 5.1-.5 5.8-.8.7-2.4 1.3-5.7 1.3H10c-3.3 0-4.9-.6-5.7-1.3-.9-.7-1.2-2.9-.5-5.8l.9-4.1c.2-.8.9-1.3 1.7-1.3z"),
      G("handle", [path("M8.5 9.5c0-3.5 1.5-5.9 3.5-5.9s3.5 2.4 3.5 5.9")]),
      path("M12 15.6c.9 0 1.9 1.5 1 1.9-.6.2-1.6.2-2.2 0-.9-.4.1-1.9 1.2-1.9z"),
      path("M13.4 17.4c1.3-.2 3.1-.9 4.4-2.1M10.6 17.4c-1.3-.2-3.1-.9-4.4-2.1"),
    ],
    gAnims: { handle: WIG(12, 9.5, 8) },
  },

  "hand-bag02": {
    auto: false,
    dur: 1.8,
    parts: [
      path("M6.7 9.5h10.6c.7 0 1.3.4 1.5 1.1.9 2.8 1.6 5.7.4 7.7-1 1.7-3.2 2.2-7.2 2.2s-6.2-.5-7.2-2.2c-1.2-2-.5-4.9.4-7.7.2-.7.8-1.1 1.5-1.1z"),
      G("handle", [path("M8.2 9.5c0-3.3 1.5-5.7 3.8-5.7s3.8 2.4 3.8 5.7")]),
      path("M7.4 10.6c1.3 1.3 2.9 2 4.6 2s3.3-.7 4.6-2"),
      path("M12 14.8c.9 0 1.8 1.4 1 1.8-.6.2-1.5.2-2.1 0-.8-.4.1-1.8 1.1-1.8z"),
      path("M12 14.8V9.5"),
    ],
    gAnims: { handle: WIG(12, 9.5, 8) },
  },

    "hand-beater": { dur: 1.5,
    auto: false,
    parts: [
    G("beater", [
      path("M13.19 4.09C14.59 2.69 16.59 2.59 17.99 3.79L19.99 5.79C21.19 6.99 21.09 9.09 19.69 10.49L17.39 12.79C15.99 14.19 13.89 14.19 12.59 12.79L10.59 10.79C9.19 9.39 9.19 7.29 10.59 5.99L13.19 4.09Z"),
      circle(15.19, 7.49, 0.9, { fill: "currentColor", stroke: "none" }),
    ]),
    line(11.59, 12.89, 6.19, 18.29),
    path("M3.89 17.79C2.99 18.69 2.89 19.99 3.59 20.69C4.29 21.39 5.59 21.29 6.49 20.39L7.49 19.39L3.89 17.79Z"),
  ],
    gAnims: { beater: tn("translate", ["0 0", "0 0", "-0.7 0.7", "0 0", "0 0"], [0, 0.3, 0.55, 0.8, 1]) } },

  "hand-coins": {
    auto: false,
    dur: 1.7,
    parts: [
      rect(2.6, 10.3, 3.5, 8.3, 1.2),
      path("M6.1 11.4h2.1c.8 0 1.6.2 2.4.5l4.2 1.4c.7.3 1.2 1 1.2 1.7 0 .8-.7 1.5-1.5 1.5h-.6c-.8 0-1.5-.2-2.2-.5l-1.4-.6"),
      path("M13.9 16.6h6c.8 0 1.5.7 1.5 1.5 0 .6-.4 1.2-1 1.4l-4.8 1.4c-.5.1-1 .2-1.5.2-.5 0-1-.1-1.4-.3l-6.6-2.2"),
      G("coin", [circle(17.3, 6.6, 3.4)]),
    ],
    gAnims: { coin: DIP(0, 1.3) },
  },

  "hand-fist": {
    auto: false,
    dur: 1.6,
    parts: [
      G("fist", [
        path("M5.9 10.8V7.3M9.2 10.8V5.4M12.5 10.8V4.9M15.8 11.3V6.4"),
        path("M4.3 11.4v2.9c0 4.1 2.8 6.7 6.9 6.7h1.6c4.1 0 6.9-2.6 6.9-6.7v-2.4"),
        path("M5.6 13.4h6.9c1 0 1.9-.8 1.9-1.8s-.8-1.8-1.8-1.8H7.9c-1.6 0-2.9 1-3.3 2.4"),
      ]),
    ],
    gAnims: { fist: DIP(0, -1.1) },
  },

    "hand-grab": { dur: 1.6,
    auto: false,
    parts: [
    A(path("M9.05 10.85L9.05 7.65C9.05 6.85 9.65 6.15 10.55 6.15L11.75 6.15M12.75 10.85L12.75 6.15C12.75 5.35 13.35 4.65 14.25 4.65L15.45 4.65M16.45 10.85L16.45 6.85C16.45 6.05 17.05 5.35 17.95 5.35L19.15 5.35"), [tn("translate", ["0 0", "0 0", "0 0.9", "0 0", "0 0"], [0, 0.3, 0.55, 0.8, 1])]),
    path("M4.35 17.55L4.35 11.15C4.35 10.15 5.15 9.25 6.25 9.25S8.15 10.05 8.15 11.15L8.15 12.25"),
    path("M6.15 15.05C6.45 17.75 8.75 19.35 11.85 19.35L14.25 19.35C17.55 19.35 19.65 17.45 19.65 14.75L19.65 11.25"),
  ] },

  "hand-grip": {
    auto: false,
    dur: 1.7,
    parts: [
      circle(12, 4.9, 2.4),
      SHIFT(path("M3.7 19.4c1.4-1.1 2.3-3.4 2.8-5.7.2-.9.5-1.9 1.2-2.1.8-.3 1.7 0 2.6.6.9.6 1.6 1.1 1.8 1.9.2 1.1-1 1.7-1 2.8 0 1.5-.5 2.4-1.6 3.2-1.4 1.1-3.2 1-4.2-.2-.4-.5-.6-1.3-.4-1.5z"), 0.7, 0),
      SHIFT(path("M20.3 19.4c-1.4-1.1-2.3-3.4-2.8-5.7-.2-.9-.5-1.9-1.2-2.1-.8-.3-1.7 0-2.6.6-.9.6-1.6 1.1-1.8 1.9-.2 1.1 1 1.7 1 2.8 0 1.5.5 2.4 1.6 3.2 1.4 1.1 3.2 1 4.2-.2.4-.5.6-1.3.4-1.5z"), -0.7, 0),
      path("M8.8 11.8l.8-2.9M15.2 11.8l-.8-2.9"),
    ],
  },

    "hand-heart": { dur: 1.6,
    auto: false,
    parts: [
    rect(2.6, 10.65, 3.5, 8.3, 1.2),
    path("M6.1 11.75L8.2 11.75C9 11.75 9.8 11.95 10.6 12.25L14.8 13.65C15.5 13.95 16 14.65 16 15.35C16 16.15 15.3 16.85 14.5 16.85L13.9 16.85C13.1 16.85 12.4 16.65 11.7 16.35L10.3 15.75"),
    path("M13.9 16.95L19.9 16.95C20.7 16.95 21.4 17.65 21.4 18.45C21.4 19.05 21 19.65 20.4 19.85L15.6 21.25C15.1 21.35 14.6 21.45 14.1 21.45C13.6 21.45 13.1 21.35 12.7 21.15L6.1 18.95"),
    G("heart", [
      path("M16.2 9.25C14.9 8.25 13 6.45 13 4.65C13 3.45 13.9 2.55 15 2.55C15.6 2.55 16 2.75 16.2 3.25C16.4 2.75 16.9 2.55 17.4 2.55C18.5 2.55 19.4 3.45 19.4 4.65C19.4 6.45 17.5 8.25 16.2 9.25Z"),
    ]),
  ],
    sAnims: { heart: { pivot: [16.2, 6.35], anim: tn("scale", ["1", "1", "1.16", "1", "1"], [0, 0.3, 0.55, 0.8, 1]) } } },

    "hand-helping": { dur: 1.6,
    auto: false,
    parts: [
    rect(2.6, 6.6, 3.5, 8.3, 1.2),
    circle(4.35, 10.45, 0.8, { fill: "currentColor", stroke: "none" }),
    G("palm", [
      path("M6.1 7.7L8.2 7.7C9 7.7 9.8 7.9 10.6 8.2L14.8 9.6C15.5 9.9 16 10.6 16 11.3C16 12.1 15.3 12.8 14.5 12.8L13.9 12.8C13.1 12.8 12.4 12.6 11.7 12.3L10.3 11.7"),
      path("M13.9 12.9L19.9 12.9C20.7 12.9 21.4 13.6 21.4 14.4C21.4 15 21 15.6 20.4 15.8L15.6 17.2C15.1 17.3 14.6 17.4 14.1 17.4C13.6 17.4 13.1 17.3 12.7 17.1L6.1 14.9"),
    ]),
  ],
    gAnims: { palm: tn("translate", ["0 0", "0 0", "0 -0.9", "0 0", "0 0"], [0, 0.3, 0.55, 0.8, 1]) } },

  "hand-metal": {
    auto: false,
    dur: 1.5,
    parts: [
      G("horns", [
        path("M5.4 12.2V6.2M9.2 12.8v-2.6M12.6 12.8v-2.6M16.4 11.4V4.9"),
        path("M5.4 12.5v1.9c0 3.7 2.5 6.1 6.4 6.1h.5c4 0 6.4-2.4 6.4-6.1v-1.5c0-1.6-1-2.7-2.4-2.7"),
      ]),
    ],
    gAnims: { horns: WIG(12, 20.5, 7) },
  },

  "hand-platter": {
    auto: false,
    dur: 1.7,
    parts: [
      G("dome", [
        path("M8 10.4a6 6 0 0 1 12 0"),
        line(14, 4.4, 14, 3.2),
      ]),
      line(6.5, 10.4, 21.5, 10.4),
      path("M3.6 20.8c1-1.8 2.2-4.2 2.7-5.6"),
      path("M6.6 14.6c.9-.5 1.9-.8 3-.8h2.5c.9 0 1.6.7 1.6 1.6s-.7 1.5-1.6 1.5h-2.3"),
      path("M12.1 16.9h.8c.5 0 .9.1 1.3.3l2.3 1.6c.6-.4 1-.9 1-1.6 0-.9-.7-1.5-1.5-1.5h-1"),
    ],
    gAnims: { dome: DIP(0, -0.9) },
  },

    "hand-pointing-down01": { auto: false, dur: 1.4, parts: [G("poke", t(point01, D))], gAnims: { poke: DIP(0, 1.3) } },
  /* the finger pokes down */

  "hand-pointing-down02": { auto: false, dur: 1.4, parts: [G("poke", t(point02, D))], gAnims: { poke: DIP(0, 1.3) } },
  /* the finger pokes down */

  "hand-pointing-down03": { auto: false, dur: 1.4, parts: [G("poke", t(point03, D))], gAnims: { poke: DIP(0, 1.3) } },
  /* the finger pokes down */

  "hand-pointing-down04": { auto: false, dur: 1.4, parts: [G("poke", t(point04, D))], gAnims: { poke: DIP(0, 1.3) } },
  /* the finger pokes left */

    "hand-pointing-left01": { auto: false, dur: 1.4, parts: [G("poke", t(point01, L))], gAnims: { poke: DIP(-1.3, 0) } },
  /* the finger pokes left */

  "hand-pointing-left02": { auto: false, dur: 1.4, parts: [G("poke", t(point02, L))], gAnims: { poke: DIP(-1.3, 0) } },
  /* the finger pokes left */

  "hand-pointing-left03": { auto: false, dur: 1.4, parts: [G("poke", t(point03, L))], gAnims: { poke: DIP(-1.3, 0) } },
  /* the finger pokes left */

  "hand-pointing-left04": { auto: false, dur: 1.4, parts: [G("poke", t(point04, L))], gAnims: { poke: DIP(-1.3, 0) } },
  /* the finger pokes right */

    "hand-pointing-right01": { auto: false, dur: 1.4, parts: [G("poke", point01)], gAnims: { poke: DIP(1.3, 0) } },
  /* the finger pokes right */

  "hand-pointing-right02": { auto: false, dur: 1.4, parts: [G("poke", point02)], gAnims: { poke: DIP(1.3, 0) } },
  /* the finger pokes right */

  "hand-pointing-right03": { auto: false, dur: 1.4, parts: [G("poke", point03)], gAnims: { poke: DIP(1.3, 0) } },
  /* the finger pokes right */

  "hand-pointing-right04": { auto: false, dur: 1.4, parts: [G("poke", point04)], gAnims: { poke: DIP(1.3, 0) } },
  /* pump bottle + nozzle + droplet */

  "hand-sanitizer": {
    auto: false,
    dur: 1.7,
    parts: [
      path("M9.7 9.1c-2.3.3-4 1.9-4.4 4.3l-.5 4.4c-.3 1.8.5 3.3 2.4 3.7h5.6c1.9-.4 2.7-1.9 2.4-3.7l-.5-4.4c-.4-2.4-2.1-4-4.4-4.3"),
      path("M9.9 13.5v3.9M7.95 15.45h3.9"),
      path("M12.7 9.4V8.6c0-1.3-.6-1.9-1.4-2.2H8.1c-.8.3-1.4.9-1.4 2.2v.8"),
      G("pump", [
        path("M10.9 6.4V4c0-.7-.5-1.2-1.2-1.2S8.5 3.3 8.5 4v2.4"),
        path("M10.9 4.2l2.7-.7c1.5-.4 2.2-.5 2.8-.4.7.2 1.1.6 1.9 1.5l.3.4"),
      ]),
      SHIFT(path("M20.9 10.5c0 1-.7 1.4-1.4 1.4s-1.3-.4-1.3-1.4c0-1 1.3-2.4 1.3-2.4s1.4 1.4 1.4 2.4z"), 0, 1.2),
    ],
    gAnims: { pump: DIP(0, 0.9) },
  },

  handbag: {
    auto: false,
    dur: 1.8,
    parts: [
      path("M8.3 9.6h7.4c1.4 0 2 .3 2.5.8.5.5.7 1.3.9 2.5.6 3.8.9 5.5.1 6.7-.7 1.1-2.3 1.6-4.8 1.6H9.6c-2.5 0-4.1-.5-4.8-1.6-.8-1.2-.5-2.9.1-6.7.2-1.2.4-2 .9-2.5.5-.5 1.1-.8 2.5-.8z"),
      path("M5.7 10l.9 1.9c.8 1.7 1.2 2.4 1.9 2.9.7.5 1.6.5 3.4.5h.2c1.8 0 2.7 0 3.4-.5.7-.5 1.1-1.2 1.9-2.9l.9-1.9"),
      G("handle", [path("M8.5 9.6V7.9c0-2 1.5-3.5 3.5-3.5s3.5 1.5 3.5 3.5v1.7")]),
      line(12, 14.6, 12, 16.2),
    ],
    gAnims: { handle: WIG(12, 9.6, 8) },
  },

  handcuffs: {
    auto: false,
    dur: 1.8,
    parts: [
      path("M2.9 14.3c0 3 2.5 5.5 5.6 5.5s5.6-2.5 5.6-5.5c0-1.9-.9-3.5-2.4-4.5-.3-.2-.4-.4-.4-.7 0-.8 0-1.2-.1-1.5-.4-1-1.5-1-2.5-1h-.6c-1 0-2.1 0-2.5 1-.1.3-.1.7-.1 1.5 0 .3-.1.5-.4.7-1.5 1-2.2 2.6-2.2 4.5z"),
      circle(8.5, 14.3, 1.9),
      G("rcuff", [
        path("M14.3 8.4c.4-.1.8-.1 1.2-.1h.6c1 0 2.1 0 2.5 1 .1.3.1.7.1 1.5 0 .3.1.5.4.7 1.5 1 2.4 2.6 2.4 4.5 0 3-2.5 5.5-5.6 5.5-1 0-1.9-.2-2.7-.6"),
        path("M16.3 18c1-.1 1.8-.9 1.8-1.9 0-.7-.4-1.3-.9-1.7"),
      ]),
      path("M15.6 9.3V7.2c0-1.6 0-2.4-.4-2.9-.4-.6-1.1-.8-2.6-1.2l-.2 0c-2.1-.6-3.1-.8-3.8-.3-.6.6-.6 1.8-.6 4.3"),
    ],
    gAnims: { rcuff: WIG(14.8, 9.3, 9) },
  },

  "hands-clapping": {
    auto: false,
    dur: 1.5,
    parts: [
      path("M14 13.5v-3c0-.8.7-1.5 1.5-1.5s1.5.7 1.5 1.5v5.9c0 3.3-2.6 5.6-5.9 5.6h-.7c-2.1 0-4.1-.8-5.5-2.3l-2.1-2.1c-.3-.3-.4-.6-.4-1 0-.8.6-1.4 1.4-1.4.4 0 .7.1 1 .4l1.5 1.5-3.4-3.4c-.3-.3-.4-.6-.4-1 0-.8.6-1.4 1.4-1.4.4 0 .7.1 1 .4l3.4 3.4-4.4-4.4c-.3-.3-.4-.6-.4-1 0-.8.6-1.4 1.4-1.4.4 0 .7.1 1 .4l4.4 4.4-2.9-2.9c-.3-.3-.4-.6-.4-1 0-.8.6-1.4 1.4-1.4.4 0 .7.1 1 .4l4.6 4.6z"),
      SHIFT(path("M17 19.4c3.2 0 4.5-1.6 4.5-4.8V8.1c0-.8-.6-1.5-1.4-1.5-.7 0-1.3.4-1.5 1"), -1, -0.5),
      A(path("M6.6 2.6v1.8M3.2 5.6h1.8"), BLINK(0.15)),
    ],
  },

  handshake: {
    auto: false,
    dur: 1.6,
    parts: [
      G("shake", [
        path("M14.3 8.5c-.8.4-3.2 1.2-5.6 1.1-.6 0-1.1-.5-1.1-1.1 0-.5.3-.9.7-1.1 1-.5 2.5-1.3 3.9-2 .8-.5 1.2-.7 1.5-.8.8-.3 1.5-.3 2.3 0 .3.1.7.3 1.5.7l.8.4c.1 0 .1.1.2.1.3.1.5.1.7.1.6 0 .9 0 1.2.1.6.2 1.1.7 1.3 1.3.1.2.1.5.1 1.1v5.3c0 .7-.6 1.2-1.2 1.2-.1 0-.2 0-.4.1l-.3.2c-.7.5-1 .7-1.7.9-.4.1-.9.1-1.7.1h-2.3"),
        path("M14.3 8.6l3 3.3c.5.5.5 1.4-.1 1.9-.5.5-1.4.5-1.9 0 .5.5.6 1.4 0 1.9-.5.5-1.4.5-1.9 0l-.5-.5c.5.5.5 1.4 0 1.9-.5.5-1.4.5-1.9 0 .5.5.5 1.4 0 1.9v.1c-.3.3-.6.4-1 .4h-.1c-.5 0-.9-.2-1.2-.5L4.6 15.6c-.3-.3-.6-.4-1-.4-.7 0-1.3-.6-1.3-1.3V9.9c0-1.8 0-2.7.5-3.3.5-.5 1.5-.5 3.2-.5h4.8"),
      ]),
    ],
    gAnims: { shake: DIP(0, 1) },
  },

  heading: {
    auto: false,
    dur: 1.4,
    parts: [G("h", [path("M6.2 4.6v14.8M17.8 4.6v14.8M6.2 12h11.6")])],
    sAnims: { h: POP(12, 12, 1.1) },
  },

  heading01: {
    auto: false,
    dur: 1.4,
    parts: [
      path("M4.3 5v14M13.7 5v14M4.3 12h9.4"),
      G("num", [path("M17 19.4h3.4M18.7 19.4v-7.2l-1.6 1.1")]),
    ],
    sAnims: { num: POP(18.7, 15.8, 1.16) },
  },

  heading02: {
    auto: false,
    dur: 1.4,
    parts: [
      path("M4.3 5v14M13.7 5v14M4.3 12h9.4"),
      G("num", [path("M20.5 19.4h-3.9v-.3c0-.4 0-.6.1-.8.1-.2.3-.3.5-.6l2.5-2.2c.4-.4.7-1 .7-1.6 0-1.1-.9-1.9-1.9-1.9s-1.9.8-1.9 1.9")]),
    ],
    sAnims: { num: POP(18.6, 16, 1.16) },
  },

  heading03: {
    auto: false,
    dur: 1.4,
    parts: [
      path("M4.3 5v14M13.7 5v14M4.3 12h9.4"),
      G("num", [path("M16.6 12.3c0-1.1.8-1.9 1.9-1.9 1 0 1.9.8 1.9 1.9s-.9 1.9-1.9 1.9c1 0 1.9.9 1.9 1.9s-.9 1.9-1.9 1.9c-1.1 0-1.9-.9-1.9-1.9")]),
    ],
    sAnims: { num: POP(18.5, 16.2, 1.16) },
  },

  heading04: {
    auto: false,
    dur: 1.4,
    parts: [
      path("M4.3 5v14M13.7 5v14M4.3 12h9.4"),
      G("num", [path("M16.6 11.6v3.9h3.8M20.4 11.6v7.8")]),
    ],
    sAnims: { num: POP(18.5, 15.5, 1.16) },
  },

  heading05: {
    auto: false,
    dur: 1.4,
    parts: [
      path("M4.3 5v14M13.7 5v14M4.3 12h9.4"),
      G("num", [path("M16.6 16.4v.6c0 1.1.9 2 2 2s2-.9 2-2v-.5c0-1.3-1.1-2.4-2.4-2.4h-1.6v-3h3.9")]),
    ],
    sAnims: { num: POP(18.7, 15.8, 1.16) },
  },

  heading06: {
    auto: false,
    dur: 1.4,
    parts: [
      path("M4.3 5v14M13.7 5v14M4.3 12h9.4"),
      G("num", [path("M18.5 19c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2zM16.5 17v-3.9c0-1.1.9-2 2-2h.2")]),
    ],
    sAnims: { num: POP(18.4, 15.6, 1.16) },
  },

  "heart-pulse": {
    auto: false,
    dur: 1.7,
    parts: [
      path("M12 19.8S4.6 14.9 3.6 10.4c-.8-3.5 1.6-5.8 4.1-5.8 1.8 0 3.4 1 4.3 2.4.9-1.4 2.5-2.4 4.3-2.4 2.5 0 4.9 2.3 4.1 5.8-1 4.5-8.4 9.4-8.4 9.4z"),
      DRAW(path("M3.8 13.2h3.7l1.3-2.5 2 4.3 1.4-2.9c.1-.3.4-.4.7-.4h7.3"), 0.12, 0.55),
    ],
  },

  kid: {
    auto: false,
    dur: 1.7,
    parts: [
      circle(12, 12.2, 8.2),
      path("M12 3.9c1.8 0 3.1 1.1 3.1 2.5 0 .9-.4 2.1-1.8 2.1-.7 0-1.2-.5-1.3-1"),
      A(path("M9.3 11.4v.7M14.7 11.4v.7"), BLINK(0.1)),
      path("M8.9 15.8c.9 1.1 2 1.7 3.1 1.7s2.2-.6 3.1-1.7"),
    ],
  },

  kidneys: {
    auto: false,
    dur: 1.8,
    parts: [
      SHIFT(path("M10 6.2c.2-1.5-1-3.1-3.4-3.1C4 3.1 2 5.6 2 8.7c0 3.1 1.6 5.6 4.1 5.6 1.6 0 2.5-1.3 2.3-2.4"), -0.5, 0),
      SHIFT(path("M14 6.2c-.2-1.5 1-3.1 3.4-3.1C20 3.1 22 5.6 22 8.7c0 3.1-1.6 5.6-4.1 5.6-1.6 0-2.5-1.3-2.3-2.4"), 0.5, 0),
      path("M7 8.2c1.5 0 3.5.5 3.5 3.7 0 4.2-2 5.8-.5 9.4M17 8.2c-1.5 0-3.5.5-3.5 3.7 0 4.2 2 5.8.5 9.4"),
      path("M6.6 6.2c.2.6.6 1.9.3 2.9-.1.4-.4 1.1-.9 1.1M17.4 6.2c-.2.6-.6 1.9-.3 2.9.1.4.4 1.1.9 1.1"),
    ],
  },

  /* two adults flanking a smaller kid — the kid bobs */
  family: {
    auto: false,
    dur: 1.9,
    parts: [
      circle(7, 5.4, 2),
      rect(4.8, 8.4, 4.4, 6.6, 2.2),
      rect(6, 15, 2, 4.6, 1),
      circle(17, 5.4, 2),
      rect(14.8, 8.4, 4.4, 6.6, 2.2),
      rect(16, 15, 2, 4.6, 1),
      G("kid", [
        circle(12, 11.2, 1.7),
        rect(10.4, 13.6, 3.2, 4.8, 1.5),
        rect(11.2, 18.4, 1.6, 2.2, 0.8),
      ]),
    ],
    gAnims: { kid: DIP(0, -0.8) },
  },

  /* round thin frames, temple arms fold back */
  eyeglasses: {
    auto: false,
    dur: 1.8,
    parts: [
      G("specs", [
        circle(7.4, 13.8, 3.6),
        circle(16.6, 13.8, 3.6),
        path("M11 13.2c.3-.7.7-1 1-1s.7.3 1 1"),
        path("M3.8 13.4l-1.4-3.8"),
        path("M20.2 13.4l1.4-3.8"),
      ]),
    ],
    gAnims: { specs: DIP(0, 0.9) },
  },

  /* mid-stride figure leaning forward — bounces on the step */
  "runner": { dur: 1.4, auto: true, parts: [
    circle(14.5, 4.5, 1.8),
    path("M14 8.5 11.2 13.2 14.4 16V21"),
    path("M11.2 13.2 7 16 4.5 15"),
    path("M14 8.7l3.6 2.8M13.8 9 9.8 9.8"),
  ] },

  /* pram: canopy dome over a basket, angled handle, two wheels */
  "baby-stroller": {
    auto: false,
    dur: 1.9,
    parts: [
      path("M4.4 12.8c0-3.1 2.5-5.6 5.6-5.6s5.6 2.5 5.6 5.6"),
      path("M4.4 12.8h15.2c0 2.7-2.2 4.9-4.9 4.9H9.3c-2.7 0-4.9-2.2-4.9-4.9z"),
      path("M19.6 12.8l1.9-4.6"),
      G("wheels", [
        circle(8.2, 19.7, 1.7),
        circle(14.4, 19.7, 1.7),
      ]),
    ],
    gAnims: { wheels: DIP(0.6, 0) },
  },

};
