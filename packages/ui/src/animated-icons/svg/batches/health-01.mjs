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

const HEART = "M12 19.8S4.6 14.9 3.6 10.4c-.8-3.5 1.6-5.8 4.1-5.8 1.8 0 3.4 1 4.3 2.4.9-1.4 2.5-2.4 4.3-2.4 2.5 0 4.9 2.3 4.1 5.8-1 4.5-8.4 9.4-8.4 9.4z";

/* offset heart shared by heart-add/check/minus/off/plus/remove — its own beat pivot. */
const HEART_SIDE = "M10.6 18.9S4.3 14.5 3.5 10.6C2.8 7.5 4.7 5.3 7 5.3c1.6 0 2.9.8 3.5 2 .6-1.2 2-2 3.6-2 2.3 0 4.2 2.2 3.5 5.3-.8 4-7 8.3-7 8.3z";

/* pathLength-normalized draw-on: invisible in the static render. */
const traced = (p, t0, t1) =>
  A({ ...p, a: { ...p.a, pathLength: 1, "stroke-dasharray": 1 } }, [
    an("stroke-dashoffset", ["1", "1", "0", "0"], [0, t0, t1, 1]),
  ]);

/* heartbeat wrapped around a pivot: thump-thump per cycle. */
const beat = (px, py) => ({ pivot: [px, py], anim: tn("scale", ["1", "1.16", "1"]) });

/* a vehicle settles on its suspension. */
const settle = (dy = 0.7) => tn("translate", ["0 0", "0 0", `0 ${dy}`, "0 0", "0 0"], [0, 0.25, 0.45, 0.7, 1]);


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
export const icons = {    "ambulance": { dur: 1.5,
    auto: false,
    parts: [
    G("ride", [
      /* body outline stops at each wheel instead of running through it */
      path("M5.8 18C4.6 18 3.6 17 3.6 15.8V7.8C3.6 6.4 4.8 5.2 6.2 5.2H12C13 5.2 14 5.7 14.6 6.5L16.8 9.5C17.3 10.1 18 10.6 18.8 10.9C20 11.4 20.4 12.3 20.4 13.5V15.8C20.4 17 19.4 18 18.2 18"),
      line(9.8, 18, 14.2, 18),
      path("M8.4 8.2V13M6 10.6H10.8"),
      circle(7.8, 18, 2),
      circle(16.2, 18, 2),
    ]),
  ],
    gAnims: { ride: tn("translate", ["0 0", "0 -0.7", "0 0", "0 -0.4", "0 0"], [0, 0.18, 0.36, 0.5, 1]) } },

  bacteria: {
    auto: false,
    dur: 1.8,
    parts: [
      G("squirm", [
        circle(12, 12, 8.5),
        /* wavy microbe strand, lower right */
        path("M10.8 15.6c.7-1 1.9-1 2.6 0s1.9 1 2.6 0"),
        /* bent rod microbe, upper right */
        path("M13.4 6.4c.8-.3 1.7 0 2.2.7"),
        /* ring microbe, upper left */
        circle(9.3, 9.4, 2),
        circle(15.9, 8.5, 0.95, fill()),
        circle(7.3, 15.5, 0.85, fill()),
        circle(15.2, 13, 0.6, fill()),
      ]),
    ],
    gAnims: { squirm: tn("rotate", ["0 12 12", "-4 12 12", "3.5 12 12", "0 12 12"], [0, 0.3, 0.65, 1]) },
  },

    "bandage": { dur: 1.6,
    auto: false,
    parts: [
    G("press", [
      path("M5.3 12.3C3.5 14.1 3.5 16.9 5.3 18.7S9.9 20.5 11.7 18.7L18.7 11.7C20.5 9.9 20.5 7.1 18.7 5.3S14.1 3.5 12.3 5.3Z"),
      path("M7.8 12.8L10.7 15.7M13.9 6.7L16.8 9.6"),
      circle(11.2, 10.1, 0.9, { fill: "currentColor", stroke: "none" }),
      circle(13, 11.9, 0.9, { fill: "currentColor", stroke: "none" }),
    ]),
  ],
    gAnims: { press: tn("rotate", ["0 12 10.9", "0 12 10.9", "-3.5 12 10.9", "0 12 10.9", "0 12 10.9"], [0, 0.25, 0.45, 0.7, 1]) } },

  bed: {
    auto: false,
    dur: 1.8,
    parts: [
      G("settle", [
        path("M3.5 5v15"),
        path("M3.5 14.5h17"),
        path("M20.5 10v10"),
        path("M5.6 14.5v-1.9c0-.8.6-1.4 1.4-1.4h2c.8 0 1.4.6 1.4 1.4v1.9"),
      ]),
    ],
    gAnims: { settle: settle(0.6) },
  },

  "bed-bunk": {
    auto: false,
    dur: 1.8,
    parts: [
      G("settle", [
        path("M3.5 3.5v17"),
        path("M20.5 3.5v17"),
        /* stacked mattresses */
        path("M3.5 10.3h17M3.5 16.9h17"),
        /* pillows on each bunk */
        path("M5.4 10.3V9c0-.6.5-1.1 1.1-1.1h1.6c.6 0 1.1.5 1.1 1.1v1.3"),
        path("M5.4 16.9v-1.3c0-.6.5-1.1 1.1-1.1h1.6c.6 0 1.1.5 1.1 1.1v1.3"),
        /* ladder rail + rungs on the right */
        path("M17.8 3.5v17"),
        path("M17.8 7.4h2.7M17.8 13.4h2.7M17.8 19.4h2.7"),
      ]),
    ],
    gAnims: { settle: settle(0.5) },
  },

  "bed-double": {
    auto: false,
    dur: 1.8,
    parts: [
      G("settle", [
        path("M4.5 12.5V8.2c0-.9.4-1.5 1-1.9 1.9-1.3 4.2-2 6.5-2s4.6.7 6.5 2c.6.4 1 1 1 1.9v4.3"),
        path("M7.2 12.5v-1.1c0-.7.6-1.2 1.2-1.2h1.4c.7 0 1.2.5 1.2 1.2v1.1M13.2 12.5v-1.1c0-.7.6-1.2 1.2-1.2h1.4c.7 0 1.2.5 1.2 1.2v1.1"),
        path("M3.8 18.2v-2.4c0-1.5 1.2-2.7 2.7-2.7h11c1.5 0 2.7 1.2 2.7 2.7v2.4"),
        path("M5.5 18.2v2.3M18.5 18.2v2.3"),
      ]),
    ],
    gAnims: { settle: settle(0.6) },
  },

  "bed-single01": {
    auto: false,
    dur: 1.8,
    parts: [
      G("settle", [
        path("M4.5 12.5V8.2c0-.9.4-1.5 1-1.9 1.9-1.3 4.2-2 6.5-2s4.6.7 6.5 2c.6.4 1 1 1 1.9v4.3"),
        path("M9.7 12.5v-1.1c0-.7.6-1.2 1.3-1.2h2c.7 0 1.3.5 1.3 1.2v1.1"),
        path("M3.8 18.2v-2.4c0-1.5 1.2-2.7 2.7-2.7h11c1.5 0 2.7 1.2 2.7 2.7v2.4"),
        path("M5.5 18.2v2.3M18.5 18.2v2.3"),
      ]),
    ],
    gAnims: { settle: settle(0.6) },
  },

  "bed-single02": {
    auto: false,
    dur: 1.8,
    parts: [
      G("settle", [
        path("M4.5 12.8V7.6c0-1.4 1.1-2.5 2.5-2.5h10c1.4 0 2.5 1.1 2.5 2.5v5.2"),
        path("M9.7 12.8v-1.2c0-.7.6-1.2 1.3-1.2h2c.7 0 1.3.5 1.3 1.2v1.2"),
        path("M3.8 18.2v-2.1c0-1.5 1.2-2.7 2.7-2.7h11c1.5 0 2.7 1.2 2.7 2.7v2.1"),
        path("M5.5 18.2v2.3M18.5 18.2v2.3"),
      ]),
    ],
    gAnims: { settle: settle(0.6) },
  },

  bedug01: {
    auto: false,
    dur: 1.4,
    parts: [
      G("thump", [
        /* barrel drum: body with head ellipse on top, X-laced sides */
        path("M5.4 8.8c0-1.9 3-3.4 6.6-3.4s6.6 1.5 6.6 3.4v5.6c0 1.9-3 3.4-6.6 3.4s-6.6-1.5-6.6-3.4V8.8z"),
        path("M5.4 8.8c0 1.9 3 3.4 6.6 3.4s6.6-1.5 6.6-3.4"),
        path("M6.3 13.8l11.4 3M17.7 13.8l-11.4 3"),
      ]),
      /* padded beaters crossed onto the head */
      line(7.4, 2.1, 12.4, 5.1),
      line(16.6, 2.1, 11.6, 5.1),
      circle(12.9, 5.4, 0.85),
      circle(11.1, 5.4, 0.85),
    ],
    sAnims: { thump: { pivot: [12, 12.5], anim: tn("scale", ["1", "1", "1.1", "1", "1"], [0, 0.2, 0.36, 0.6, 1]) } },
  },

  bedug02: {
    auto: false,
    dur: 1.4,
    parts: [
      G("thump", [
        /* drum head viewed front-on + two beaters reaching in */
        circle(12, 14.8, 6.4),
        circle(12, 14.8, 4.2),
        path("M5.4 3.6l4.4 4.2"),
        circle(4.9, 3.1, 1.1),
        path("M18.6 3.6l-4.4 4.2"),
        circle(19.1, 3.1, 1.1),
      ]),
    ],
    sAnims: { thump: { pivot: [12, 14.8], anim: tn("scale", ["1", "1", "1.1", "1", "1"], [0, 0.2, 0.36, 0.6, 1]) } },
  },

    "blood": { dur: 1.6,
    auto: false,
    parts: [
    G("drop", [
      path("M14.95 20.24C11.15 20.24 8.75 17.44 8.75 14.24C8.75 11.14 10.95 8.04 12.95 5.94C13.75 5.04 15.05 5.04 15.85 5.94C17.85 8.04 20.05 11.14 20.05 14.24C20.05 17.44 17.75 20.24 14.95 20.24Z"),
      path("M17.05 13.44C17.25 15.04 16.25 16.14 14.85 16.44"),
    ]),
    path("M6.85 14.74C5.05 14.04 3.95 12.34 3.95 10.34C3.95 8.04 5.45 5.74 6.85 4.24C7.55 3.54 8.65 3.54 9.35 4.24C10.05 4.94 10.75 5.84 11.35 6.74"),
  ],
    sAnims: { drop: { pivot: [14.95, 13.34], anim: tn("scale", ["1", "1", "1.08", "1", "1"], [0, 0.3, 0.5, 0.75, 1]) } } },

  "blood-bag": {
    auto: false,
    dur: 1.8,
    parts: [
      path("M6.2 5.8c0-1.3 1-2.3 2.3-2.3h7c1.3 0 2.3 1 2.3 2.3v7.4c0 3.4-2.4 5.6-5.8 5.6s-5.8-2.2-5.8-5.6V5.8z"),
      G("level", [path("M6.2 9.6c2-1.2 3.9-1.2 5.8 0s3.8 1.2 5.8 0")]),
      path("M12 18.8v.7c0 1.2-1 2.2-2.2 2.2"),
    ],
    gAnims: { level: tn("translate", ["0 0", "0 0.7", "0 0", "0 0"], [0, 0.35, 0.7, 1]) },
  },

  "blood-bottle": {
    auto: false,
    dur: 1.8,
    parts: [
      /* bottle hangs from an arm hooked over a rail */
      path("M14.4 5.7V3.2H9.4c-2.7 0-4.9 2-4.9 4.6V21"),
      path("M8.6 10.6c0-1.8 0-2.9.7-3.7.6-.8 1.5-1.2 2.7-1.2h4.8c1.2 0 2.1.4 2.7 1.2.7.8.7 1.9.7 3.7v2.6c0 1.8 0 2.9-.7 3.7-.6.8-1.5 1.2-2.7 1.2h-4.8c-1.2 0-2.1-.4-2.7-1.2-.7-.8-.7-1.9-.7-3.7v-2.6z"),
      G("level", [path("M8.9 12.3c1.7-1 3.4-1 5.1 0s3.4 1 5.1 0")]),
      /* drip tube curling out the bottom */
      path("M14.4 18.4c0 1.5-1.2 2.7-2.7 2.7"),
    ],
    gAnims: { level: tn("translate", ["0 0", "0 0.7", "0 0", "0 0"], [0, 0.35, 0.7, 1]) },
  },

  "blood-pressure": {
    auto: false,
    dur: 1.7,
    parts: [
      path("M12 3.2c2.5 2.3 6.9 6.2 6.9 10.3 0 4.3-3.1 7.3-6.9 7.3s-6.9-3-6.9-7.3c0-4.1 4.4-8 6.9-10.3z"),
      traced(path("M6.4 13.6h2.3l1.2-2.4 2.1 4.6 1.3-3.2.9 1h3.4"), 0.12, 0.62),
    ],
  },

  "blood-type": {
    auto: false,
    dur: 1.7,
    parts: [
      path("M12 3.5c2.5 2.3 6.8 6 6.8 9.8 0 4-3 6.7-6.8 6.7s-6.8-2.7-6.8-6.7c0-3.8 4.3-7.5 6.8-9.8z"),
      traced(path("M9.9 15.6l2.1-4.8 2.1 4.8M10.5 14h3"), 0.15, 0.6),
    ],
  },

  "clean": { dur: 1.4, auto: true, parts: [
    path("M19 4 12.5 11.5"),
    path("M12.5 11.5 15.5 14.5C14 18.2 10.5 20.5 4 20.5 4 14 7.2 10.8 12.5 11.5Z"),
    path("M8.5 15.5 6.7 17.3"),
    path("M5.5 3.5v3M4 5h3"),
  ] },

  "cleaning-bucket": {
    auto: false,
    dur: 1.7,
    parts: [
      path("M4.5 9h15l-1.2 10c-.2 1.5-1.4 2.5-2.9 2.5H8.6c-1.5 0-2.7-1-2.9-2.5L4.5 9z"),
      path("M7.5 9c0-3.3 2-5.3 4.5-5.3s4.5 2 4.5 5.3"),
      A(circle(9.6, 13, 0.9, fill()), [an("cy", ["13", "13", "11.9", "13", "13"], [0, 0.2, 0.45, 0.7, 1])]),
      A(circle(14.4, 13, 0.9, fill()), [an("cy", ["13", "13", "11.9", "13", "13"], [0, 0.35, 0.6, 0.85, 1])]),
    ],
  },

    "clinic": { dur: 1.4, auto: true, parts: [
      path("M4 20.5V9.5L12 4l8 5.5V20.5Z"),
      path("M12 11.2v5M9.5 13.7h5"),
    ] },

  "doctor01": {
    auto: false,
    dur: 1.7,
    parts: [
      circle(12, 7.3, 3.4),
      path("M5 20.9c.4-3.9 3.2-6.2 7-6.2s6.6 2.3 7 6.2"),
      path("M10.6 14.9l1.4 2.1 1.4-2.1"),
      G("scope", [
        path("M8.4 15.6v1.9c0 1.6 1.3 2.9 2.9 2.9"),
        circle(16.7, 18.2, 1.2),
      ]),
    ],
    gAnims: { scope: WIG(8.4, 15.6, 8) },
  },

  "doctor02": {
    auto: false,
    dur: 1.6,
    parts: [
      path("M8.6 5.3c0-1.4 1.1-2.5 2.5-2.5h1.8c1.4 0 2.5 1.1 2.5 2.5v3.3c0 1.9-1.5 3.4-3.4 3.4s-3.4-1.5-3.4-3.4V5.3z"),
      path("M8.6 5.7h6.8"),
      G("mirror", [circle(12, 5.7, 0.9)]),
      path("M5 20.9c.4-3.9 3.2-6.2 7-6.2s6.6 2.3 7 6.2"),
      path("M10.6 14.9l1.4 2.1 1.4-2.1"),
    ],
    sAnims: { mirror: POP(12, 5.7, 1.4) },
  },

  "doctor03": {
    auto: false,
    dur: 1.5,
    parts: [
      circle(12, 7.3, 3.4),
      path("M5 20.9c.4-3.9 3.2-6.2 7-6.2s6.6 2.3 7 6.2"),
      path("M10.6 14.9l1.4 2.1 1.4-2.1"),
      G("plus", [path("M16.3 15.9v3.8M14.4 17.8h3.8")]),
    ],
    sAnims: { plus: POP(16.3, 17.8, 1.22) },
  },

  "dumbbell01": {
    auto: false,
    dur: 1.6,
    parts: [
      G("bell", [
        path("M7.3 16.7l9.4-9.4"),
        path("M5.9 14.5l3.5 3.5"),
        path("M3.6 16.8l3.5 3.5"),
        path("M14.6 5.9l3.5 3.5"),
        path("M16.9 3.6l3.5 3.5"),
      ]),
    ],
    gAnims: { bell: DIP(0.9, -0.9) },
  },

  "dumbbell02": {
    auto: false,
    parts: [
      G("lift", [
        path("M6 12h12"),
        rect(2.9, 8.4, 3.1, 7.2, 1.5),
        rect(18, 8.4, 3.1, 7.2, 1.5),
        rect(7.6, 9.6, 2.4, 4.8, 1.2),
        rect(14, 9.6, 2.4, 4.8, 1.2),
      ]),
    ],
    gAnims: { lift: tn("translate", ["0 0", "0 0", "0 -1.1", "0 0", "0 0"], HOLD) },
  },

  "dumbbell03": {
    auto: false,
    dur: 1.7,
    parts: [
      G("bell", [
        path("M4.8 12h14.4"),
        path("M6.9 8v8M3.3 9.7v4.6"),
        path("M17.1 8v8M20.7 9.7v4.6"),
      ]),
    ],
    gAnims: { bell: DIP(0, -1.2) },
  },

  "energy": {
    auto: false,
    dur: 1.4,
    parts: [
      G("bolt", [path("M13.2 3.6 7.3 12.7c-.5.7-.1 1.6.7 1.6h3.5l-1 5.5c-.2.9 1 1.4 1.6.6l6.2-9.1c.5-.7.1-1.6-.7-1.6h-3.5l1-5.5c.2-.9-1-1.4-1.9-.6z")]),
    ],
    sAnims: { bolt: { pivot: [12, 12], anim: tn("scale", ["1", "1", "1.14", "1", "1"], [0, 0.35, 0.47, 0.62, 1]) } },
  },

  "energy-ellipse": {
    auto: false,
    dur: 1.4,
    parts: [
      ellipse(12, 12, 9, 8.4),
      G("bolt", [path("M12.8 7.6l-3.3 4.7c-.3.4 0 1 .6 1h2.1l-.7 3.3c-.1.6.7.9 1.1.4l3.4-4.7c.3-.4 0-1-.6-1h-2.1l.7-3.3c.1-.6-.6-.9-1.2-.4z")]),
    ],
    sAnims: { bolt: { pivot: [12, 11.8], anim: tn("scale", ["1", "1", "1.16", "1", "1"], [0, 0.35, 0.47, 0.62, 1]) } },
  },

  "energy-rectangle": {
    auto: false,
    dur: 1.4,
    parts: [
      rect(3.3, 3.3, 17.4, 17.4, 4.4),
      G("bolt", [path("M12.8 7.6l-3.3 4.7c-.3.4 0 1 .6 1h2.1l-.7 3.3c-.1.6.7.9 1.1.4l3.4-4.7c.3-.4 0-1-.6-1h-2.1l.7-3.3c.1-.6-.6-.9-1.2-.4z")]),
    ],
    sAnims: { bolt: { pivot: [12, 11.8], anim: tn("scale", ["1", "1", "1.16", "1", "1"], [0, 0.35, 0.47, 0.62, 1]) } },
  },

  "first-aid-kit": {
    auto: false,
    dur: 1.6,
    parts: [
      rect(3, 7.2, 18, 12.8, 2.6),
      G("cross", [path("M12 10.6v5.4M9.3 13.3h5.4")]),
      path("M9.2 7.2V5.8c0-.9.7-1.6 1.6-1.6h2.4c.9 0 1.6.7 1.6 1.6v1.4"),
    ],
    sAnims: { cross: POP(12, 13.3, 1.18) },
  },

  "gymnastic": {
    auto: false,
    dur: 1.8,
    parts: [
      path("M7 2.5v3M17 2.5v3"),
      G("ringL", [circle(7, 7.9, 2.4)]),
      G("ringR", [circle(17, 7.9, 2.4)]),
      /* arms from the rings meeting at the shoulders */
      path("M9.3 8.4c.7 1.3 1.6 2.3 2.7 2.9 1.1-.6 2-1.6 2.7-2.9"),
      circle(12, 13.2, 1.5),
      /* hanging body */
      path("M12 15c.5 2 .5 4-.1 5.9"),
    ],
    gAnims: {
      ringL: WIG(7, 5.5, 9),
      ringR: WIG(17, 5.5, 9),
    },
  },

    "gymnastic-rings": { auto: false,
    parts: [
    G("swing", [
      path("M8 5.85L8 10.15M16 5.85L16 10.15"),
      circle(8, 14.65, 3.5),
      circle(16, 14.65, 3.5),
    ]),
  ],
    gAnims: { swing: tn("rotate", ["0 12 5.85", "0 12 5.85", "-5 12 5.85", "4 12 5.85", "0 12 5.85"], [0, 0.3, 0.55, 0.8, 1]) } },

  "health": {
    auto: false,
    dur: 1.4,
    parts: [
      G("heart", [path(HEART)]),
      path("M12 9.4v5.4M9.3 12.1h5.4"),
    ],
    sAnims: { heart: POP(12, 12, 1.12) },
  },

  "heart-add": {
    auto: false,
    dur: 1.5,
    parts: [
      path("M10.6 18.9S4.3 14.5 3.5 10.6C2.8 7.5 4.7 5.3 7 5.3c1.6 0 2.9.8 3.5 2 .6-1.2 2-2 3.6-2 2.3 0 4.2 2.2 3.5 5.3-.8 4-7 8.3-7 8.3z"),
      G("plus", [path("M17.6 13.6v5.8M14.7 16.5h5.8")]),
    ],
    sAnims: { plus: POP(17.6, 16.5, 1.2) },
  },

  "heart-check": {
    auto: false,
    dur: 1.7,
    parts: [
      path("M10.6 18.9S4.3 14.5 3.5 10.6C2.8 7.5 4.7 5.3 7 5.3c1.6 0 2.9.8 3.5 2 .6-1.2 2-2 3.6-2 2.3 0 4.2 2.2 3.5 5.3-.8 4-7 8.3-7 8.3z"),
      DRAW(path("M15.3 16.3l1.9 1.9 3.4-4"), 0.2, 0.55),
    ],
  },

  "heart-crack": {
    auto: false,
    dur: 1.6,
    parts: [
      path(HEART),
      A(path("M12.2 6.9l1.7 2.7-2.5 2.3 2.1 2.5-1.4 2.6"), BLINK(0.1)),
    ],
  },

  "heart-handshake": {
    auto: false,
    dur: 1.4,
    parts: [
      G("heart", [path(HEART)]),
      path("M8.4 13l2.4-2.4c.6-.6 1.6-.6 2.2 0l1.7 1.7"),
      path("M9.6 15.4l1.5-1.5M12.4 16.2l1.4-1.4"),
    ],
    sAnims: { heart: POP(12, 12, 1.12) },
  },

  "heart-minus": {
    auto: false,
    dur: 1.6,
    parts: [
      path("M10.6 18.9S4.3 14.5 3.5 10.6C2.8 7.5 4.7 5.3 7 5.3c1.6 0 2.9.8 3.5 2 .6-1.2 2-2 3.6-2 2.3 0 4.2 2.2 3.5 5.3-.8 4-7 8.3-7 8.3z"),
      SHIFT(path("M15 16.5h5.8"), 0.7, 0),
    ],
  },

    "heart-off": { dur: 1.7,
    auto: false,
    parts: [
    path("M11.9 18.8S5.6 14.4 4.8 10.5C4.1 7.4 6 5.2 8.3 5.2C9.9 5.2 11.2 6 11.8 7.2C12.4 6 13.8 5.2 15.4 5.2C17.7 5.2 19.6 7.4 18.9 10.5C18.1 14.5 11.9 18.8 11.9 18.8Z"),
    A(path("M6.7 5.3L19.9 18.5", { pathLength: 1, "stroke-dasharray": 1 }), [an("stroke-dashoffset", ["1", "1", "0", "0"], [0, 0.12, 0.48, 1])]),
  ] },

  "heart-plus": {
    auto: false,
    dur: 1.5,
    parts: [
      path("M10.6 18.9S4.3 14.5 3.5 10.6C2.8 7.5 4.7 5.3 7 5.3c1.6 0 2.9.8 3.5 2 .6-1.2 2-2 3.6-2 2.3 0 4.2 2.2 3.5 5.3-.8 4-7 8.3-7 8.3z"),
      G("plus", [path("M17.6 13.6v5.8M14.7 16.5h5.8")]),
    ],
    sAnims: { plus: POP(17.6, 16.5, 1.2) },
  },

  "heart-remove": {
    auto: false,
    dur: 1.5,
    parts: [
      path("M10.6 18.9S4.3 14.5 3.5 10.6C2.8 7.5 4.7 5.3 7 5.3c1.6 0 2.9.8 3.5 2 .6-1.2 2-2 3.6-2 2.3 0 4.2 2.2 3.5 5.3-.8 4-7 8.3-7 8.3z"),
      G("x", [path("M15.3 15.3l4.4 4.4M19.7 15.3l-4.4 4.4")]),
    ],
    sAnims: { x: POP(17.5, 17.5, 1.16) },
  },

  "heartbreak": {
    auto: false,
    dur: 1.5,
    parts: [
      G("heart", [path(HEART)]),
      path("M13 6.4l-2.6 3.2 2.8 2.3-2.7 3.2 1.9 2.6"),
    ],
    gAnims: { heart: WIG(12, 12, 4) },
  },

  "hospital-bed01": { dur: 1.4, auto: true, parts: [
    path("M3 5.5V19M3 17H21V13a2 2 0 0 0-2-2H10v6"),
    circle(6.5, 12.5, 1.7),
    path("M17 3.5v4M15 5.5h4"),
  ] },

  "hospital-bed02": { dur: 1.4, auto: true, parts: [
    rect(4, 7.5, 16, 3.5, 1.7),
    path("M6 11v5M18 11v5"),
    circle(6, 18.6, 1.6),
    circle(18, 18.6, 1.6),
  ] },

  "hospital-location": {
    auto: false,
    parts: [
      G("drop", [
        path("M12 21.4s6.9-5.9 6.9-11.3a6.9 6.9 0 1 0-13.8 0c0 5.4 6.9 11.3 6.9 11.3z"),
        path("M12 7.1v6M9 10.1h6"),
      ]),
    ],
    gAnims: { drop: tn("translate", ["0 0", "0 0", "0 -3", "0 0.5", "0 0"], [0, 0.25, 0.55, 0.72, 1]) },
  },

  "hospital01": {
    auto: false,
    dur: 1.6,
    parts: [
      path("M4.5 21V9.7C4.5 6.8 6.2 4.6 8.7 3.9c1.1-.3 2.2-.5 3.3-.5s2.2.2 3.3.5c2.5.7 4.2 2.9 4.2 5.8V21"),
      path("M2.9 21h18.2"),
      path("M10 21v-2.8c0-1.1.9-2 2-2s2 .9 2 2V21"),
      G("cross", [path("M12 7.4v3.8M10.1 9.3h3.8")]),
      path("M7.8 12.4h1.7M14.5 12.4h1.7M7.8 15.4h1.7M14.5 15.4h1.7"),
    ],
    sAnims: { cross: POP(12, 9.3, 1.2) },
  },

  "hospital02": {
    auto: false,
    dur: 1.6,
    parts: [
      path("M8.2 21V5.6c0-1.4 1.1-2.5 2.5-2.5h2.6c1.4 0 2.5 1.1 2.5 2.5V21"),
      path("M8.2 10.5H6c-1 0-1.9.8-1.9 1.9V21M15.8 10.5H18c1 0 1.9.8 1.9 1.9V21"),
      path("M2.9 21h18.2"),
      path("M10.6 21v-2.7c0-.8.6-1.5 1.4-1.5s1.4.7 1.4 1.5V21"),
      G("cross", [path("M12 6.2v3.6M10.2 8h3.6")]),
    ],
    sAnims: { cross: POP(12, 8, 1.2) },
  },

  /* spiked ring with knobbed tips and inner flecks — slow rotation */
  virus: {
    auto: false,
    pp: false,
    dur: 5,
    parts: [
      G("spin", [
        circle(12, 12, 5.2),
        path("M12 6.8V5.2M15.7 8.3l1.1-1.1M17.2 12h1.6M15.7 15.7l1.1 1.1M12 17.2v1.6M8.3 15.7l-1.1 1.1M6.8 12H5.2M8.3 8.3L7.2 7.2M9.9 11.2v.4M12.2 13.6v.4M14.1 10.6v.4"),
        path("M11 4.4a1 1 0 1 0 2 0 1 1 0 1 0-2 0M16.6 6.4a1 1 0 1 0 2 0 1 1 0 1 0-2 0M18.6 12a1 1 0 1 0 2 0 1 1 0 1 0-2 0M16.6 17.6a1 1 0 1 0 2 0 1 1 0 1 0-2 0M11 19.6a1 1 0 1 0 2 0 1 1 0 1 0-2 0M5.4 17.6a1 1 0 1 0 2 0 1 1 0 1 0-2 0M3.4 12a1 1 0 1 0 2 0 1 1 0 1 0-2 0M5.4 6.4a1 1 0 1 0 2 0 1 1 0 1 0-2 0", fill()),
      ]),
    ],
    gAnims: { spin: tn("rotate", ["0 12 12", "360 12 12"], [0, 1]) },
  },

  /* curved mask with two pleat lines and ear loops */
  "face-mask": { dur: 1.4, auto: true, parts: [
    path("M6 8.5Q12 6.5 18 8.5V14c0 2.5-3 4.5-6 4.5S6 16.5 6 14Z"),
    path("M6 9.5H4.5a2 2 0 0 0-2 2v1a2 2 0 0 0 2 2H6M18 9.5h1.5a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2H18"),
    path("M8.8 11.8h6.4M8.8 14.3h6.4"),
  ] },

  /* molar crown with two roots and a crown glint */
  tooth: {
    auto: false,
    dur: 1.9,
    parts: [
      path("M7.4 4.2c-1.9 0-3.4 1.6-3.4 3.6 0 1.4.6 2.7 1.4 3.7.4 2.5.8 5.2 1.6 7.7.2.7.9 1.1 1.5.9 1.2-.4 1.6-2.6 1.9-4.3.2-1.3.8-2.2 1.6-2.2s1.4.9 1.6 2.2c.3 1.7.7 3.9 1.9 4.3.6.2 1.3-.2 1.5-.9.8-2.5 1.2-5.2 1.6-7.7.8-1 1.4-2.3 1.4-3.7 0-2-1.5-3.6-3.4-3.6-1.6 0-2.6.8-4.6.8-2 0-3-.8-4.6-.8z"),
      A(path("M9 6.2c.9-.4 1.9-.5 2.8-.4"), [
        tn("translate", ["0 0", "0.4 -0.4", "0 0"], [0, 0.4, 1]),
        an("opacity", ["1", "0.4", "1"], [0, 0.4, 1]),
      ]),
    ],
  },

  /* bathroom scale: window on top, dial arc inside */
  "body-scale": { dur: 1.4, auto: true, parts: [
    rect(3.5, 3.5, 17, 17, 3),
    path("M7.8 10.5a4.2 4.2 0 0 1 8.4 0"),
    path("M12 10.5 13.6 8.6"),
    path("M8.5 16.5h7"),
  ] },

  /* cane — hooked grip on a long shaft */
  "walking-stick": {
    auto: false,
    dur: 1.8,
    parts: [
      G("cane", [
        path("M9.6 5.6c0-1.8 1.5-3.2 3.3-3.2s3.3 1.4 3.3 3.2c0 .9-.3 1.7-.9 2.3l-4.6 13.3c-.2.6-.9.9-1.5.7-.6-.2-.9-.9-.7-1.5"),
      ]),
    ],
    gAnims: { cane: WIG(12.5, 20.8, 4) },
  },

};
