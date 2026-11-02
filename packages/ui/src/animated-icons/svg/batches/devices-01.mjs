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
/* nudge one part along an axis, then spring back (for A()). */
const SHIFT = (p, dx, dy) =>
  A(p, [tn("translate", ["0 0", "0 0", `${dx} ${dy}`, "0 0", "0 0"], HOLD)]);
/* blink — opacity dips once on a mark (for A()). */
const BLINK = (lo = 0.2) => [an("opacity", ["1", "1", `${lo}`, "1", "1"], [0, 0.32, 0.46, 0.6, 1])];
/* trace — the stroke writes itself on (checks, waveforms, signatures). */
const DRAW = (p, t0 = 0.15, t1 = 0.62) =>
  A({ ...p, a: { ...p.a, pathLength: 1, "stroke-dasharray": 1 } },
    [an("stroke-dashoffset", ["1", "1", "0", "0"], [0, t0, t1, 1])]);
/* cell — a battery segment lights up on a cascade beat (fill() rect). */
const CELL = (x, t0) =>
  A(cell(x), [an("opacity", ["0", "0", "1", "1", "0", "0"], [0, t0, Math.min(t0 + 0.16, 0.7), 0.74, 0.86, 1])]);

/** Scalloped bloom — cosine radius modulation (same recipe as the core gear). */
function flowerPath(cx, cy, lobes, rMid, amp, steps = 14) {
  const pts = [];
  for (let i = 0; i < lobes * steps; i++) {
    const t = (i / (lobes * steps)) * Math.PI * 2;
    const r = rMid + amp * Math.cos(lobes * t + Math.PI / 2);
    pts.push(`${(cx + r * Math.cos(t)).toFixed(2)} ${(cy + r * Math.sin(t)).toFixed(2)}`);
  }
  return `M${pts.join("L")}Z`;
}

/** Partial bloom along an angle range — the half-gear for ai07. */
function flowerArc(cx, cy, lobes, rMid, amp, a0, a1, steps = 12) {
  const pts = [];
  const n = Math.max(6, Math.round((Math.abs(a1 - a0) / (Math.PI * 2)) * lobes * steps));
  for (let i = 0; i <= n; i++) {
    const t = a0 + (a1 - a0) * (i / n);
    const r = rMid + amp * Math.cos(lobes * t + Math.PI / 2);
    pts.push(`${(cx + r * Math.cos(t)).toFixed(2)} ${(cy + r * Math.sin(t)).toFixed(2)}`);
  }
  return `M${pts.join("L")}Z`;
}

/* ---------- shared silhouettes ---------- */

/** battery shell: rounded body + side nub. */
const BATTERY_BODY = rect(2.6, 6.3, 15.9, 11.4, 3.4);
const BATTERY_CAP = path("M18.5 10.3a1.9 1.9 0 0 1 0 3.4");
const cell = (x) => rect(x, 9.8, 2.2, 4.4, 1, fill());

/** monitor: rounded screen + stem + foot. interior center ~ (12, 10.4). */
const SCREEN = rect(3, 4.2, 18, 12.4, 2.5);
const STAND = path("M12 16.6v2.6");
const FOOT = line(8.6, 19.8, 15.4, 19.8);

/** desk: tabletop + legs. */
const DESK_TOP = line(2.6, 12.2, 21.4, 12.2);
const DESK_LEGS = path("M4.2 12.2v8.6M19.8 12.2v8.6");
const DESK_RETURN = path("M19.8 16.8h-3.4c-1.4 0-2.6-1.2-2.6-2.6v-2");

/** head profile facing right, neck open at bottom. */
const HEAD = path(
  "M7 21v-3.4c-1.7-1.3-2.7-3.3-2.7-5.4 0-3.8 3.1-6.8 6.9-6.8 3.5 0 6.4 2.6 6.8 6l1.7 1.5c.4.4.3 1-.2 1.2l-1.7.8c.2 1.1-.1 2.1-.8 2.9-.6.6-1.4 1-2 1.5-.5.5-.8 1.1-.8 1.7V21"
);

/** descending sort arrow (right rail). */
const SORT_ARROW = path("M17.4 4.6v14.8m-2.6-2.7 2.6 2.7 2.6-2.7");

export const icons = {
  /* twin buds with inward stems — they nod in turn */
  airpods: {
    auto: false,
    dur: 1.8,
    parts: [
      G("l", [
        path("M6.4 10.4c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3z"),
        path("M8.4 9.6l1.9 8.8"),
        circle(7.6, 6.6, 0.55, fill()),
      ]),
      G("r", [
        path("M16.6 10.4c1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3 1.3 3 3 3z"),
        path("M15.6 9.6l-1.9 8.8"),
        circle(15.4, 6.6, 0.55, fill()),
      ]),
    ],
    gAnims: {
      l: tn("translate", ["0 0", "0 0.9", "0 0", "0 0", "0 0"], [0, 0.2, 0.4, 0.6, 1]),
      r: tn("translate", ["0 0", "0 0", "0 0.9", "0 0", "0 0"], [0, 0.3, 0.55, 0.75, 1]),
    },
  },

  /* ---------------- browsers & arrows ---------------- */

  "arc-browser": {
    dur: 1.9,
    auto: false,
    parts: [
      path("M12 5.4c.7 0 1.3.4 1.6 1l4.7 9.8c.4.8-.1 1.7-1 1.7-.5 0-1-.3-1.3-.8l-3.6-7.4c-.2-.4-.7-.4-.9 0l-3.6 7.4c-.3.5-.8.8-1.3.8-.9 0-1.4-.9-1-1.7l4.7-9.8c.3-.6.9-1 1.6-1z"),
      G("orbit", [
        path("M4.4 14.8c.7 2.4 2.8 4.3 5.4 4.9"),
        path("M19.6 9.2c-.7-2.4-2.8-4.3-5.4-4.9"),
      ]),
    ],
    gAnims: { orbit: tn("rotate", ["0 12 12", "10 12 12", "0 12 12"], [0, 0.5, 1]) },
  },

  /* the arrow draws back on the string */
  "archer": {
    auto: false,
    dur: 1.7,
    parts: [
      // bow belly + string
      path("M7 4.8c4.9 1.9 7.2 4.4 7.2 7.2s-2.3 5.3-7.2 7.2"),
      line(7, 4.8, 7, 19.2),
      // arrow: shaft + pointed head + tail fletch
      G("arrow", [
        line(5, 12, 18.6, 12),
        path("M16.1 9.9 19.2 12l-3.1 2.1"),
        path("M5.5 10.4 3.7 12l1.8 1.6"),
      ]),
    ],
    gAnims: { arrow: DIP(-1.7, 0) },
  },

  /* ---------------- arrange / sort ---------------- */

  /* the two free corners pinch toward the middle */
  "arrange": {
    auto: false,
    dur: 1.6,
    parts: [
      rect(3.2, 3.2, 4.2, 4.2, 1.2),
      SHIFT(rect(16.6, 3.2, 4.2, 4.2, 1.2), -1, -1),
      SHIFT(rect(3.2, 16.6, 4.2, 4.2, 1.2), 1, 1),
      line(7.4, 5.3, 16.6, 5.3),
      line(8.1, 7.9, 15.9, 15.7),
      line(7.4, 18.7, 18.6, 18.7),
      path("M17.4 15.9l3.4 2.8-3.4 2.9"),
    ],
  },

  /* the sort arrow steps down the rail */
  "arrange-by-letters-az": {
    auto: false,
    dur: 1.5,
    parts: [
      path("M4.6 9.4l2-4.8c.2-.5.8-.5 1 0l2 4.8M5.7 7.6h2.7"),
      path("M4.8 14.4h4.2l-4.2 5h4.4"),
      G("sort", [SORT_ARROW]),
    ],
    gAnims: { sort: DIP(0, 1.4) },
  },

  "arrange-by-letters-za": {
    auto: false,
    dur: 1.5,
    parts: [
      path("M4.8 4.4h4.2l-4.2 5h4.4"),
      path("M4.6 19.4l2-4.8c.2-.5.8-.5 1 0l2 4.8M5.7 17.6h2.7"),
      G("sort", [SORT_ARROW]),
    ],
    gAnims: { sort: DIP(0, 1.4) },
  },

  "arrange-by-numbers-nine-one": {
    auto: false,
    dur: 1.5,
    parts: [
      path("M9.3 6.9c0 .9-.8 1.6-1.9 1.6s-1.9-.7-1.9-1.6.8-1.6 1.9-1.6 1.9.7 1.9 1.6zM9.3 6.9v1.3c0 1.5-1.2 2.7-2.7 2.7h-.4"),
      path("M6 15.6l1.4-1.1v5.6m-1.5 0h3.1"),
      G("sort", [SORT_ARROW]),
    ],
    gAnims: { sort: DIP(0, 1.4) },
  },

  "arrange-by-numbers-one-nine": {
    auto: false,
    dur: 1.5,
    parts: [
      path("M6 4.9l1.4-1.1v5.6m-1.5 0h3.1"),
      path("M9.3 16.9c0 .9-.8 1.6-1.9-1.6s-1.9-.7-1.9-1.6.8-1.6 1.9-1.6 1.9.7 1.9 1.6zM9.3 16.9v1.3c0 1.5-1.2 2.7-2.7 2.7h-.4"),
      G("sort", [SORT_ARROW]),
    ],
    gAnims: { sort: DIP(0, 1.4) },
  },

  /* ---------------- artboards ---------------- */

  /* the ruler ticks shimmer awake */
  "artboard": {
    auto: false,
    dur: 1.7,
    parts: [
      rect(8.6, 8.6, 6.8, 6.8, 1.4),
      A(path("M8.6 6.2V3.4M15.4 6.2V3.4M8.6 17.8v2.8M15.4 17.8v2.8M6.2 8.6H3.4M6.2 15.4H3.4M17.8 8.6h2.8M17.8 15.4h2.8"), BLINK(0.4)),
    ],
  },

  /* dashed artboard frame; its corner handles pop */
  "artboard-tool": {
    auto: false,
    dur: 1.5,
    parts: [
      path("M8.4 9.9h9.6v9.9H8.4z", { "stroke-dasharray": "2.6 2" }),
      G("plus", [
        rect(6.95, 8.45, 2.9, 2.9, 0.7),
        rect(16.55, 8.45, 2.9, 2.9, 0.7),
        rect(6.95, 18.35, 2.9, 2.9, 0.7),
        rect(16.55, 18.35, 2.9, 2.9, 0.7),
      ]),
    ],
    sAnims: { plus: POP(13.2, 14.9, 1.1) },
  },

  /* ---------------- artificial intelligence ---------------- */

  /* the chip in the head pings */
    "artificial-intelligence01": { dur: 1.6,
    auto: false,
    parts: [
    path("M6.8 19.8L6.8 16.4C5.1 15.1 4.1 13.1 4.1 11C4.1 7.2 7.2 4.2 11 4.2C14.5 4.2 17.4 6.8 17.8 10.2L19.5 11.7C19.9 12.1 19.8 12.7 19.3 12.9L17.6 13.7C17.8 14.8 17.5 15.8 16.8 16.6C16.2 17.2 15.4 17.6 14.8 18.1C14.3 18.6 14 19.2 14 19.8L14 19.8"),
    G("chip", [
      rect(9, 7.6, 4.4, 4.4, 1.1),
      path("M10.4 7.6L10.4 5.8M12.4 7.6L12.4 5.8M9 9.2L7.2 9.2M9 11L7.2 11"),
    ]),
  ],
    sAnims: { chip: { pivot: [11.2, 9.8], anim: tn("scale", ["1", "1", "1.14", "1", "1"], [0, 0.3, 0.55, 0.8, 1]) } } },

  /* the AI glyphs breathe */
    "artificial-intelligence02": { dur: 1.8,
    auto: false,
    parts: [
    path("M6.8 19.8L6.8 16.4C5.1 15.1 4.1 13.1 4.1 11C4.1 7.2 7.2 4.2 11 4.2C14.5 4.2 17.4 6.8 17.8 10.2L19.5 11.7C19.9 12.1 19.8 12.7 19.3 12.9L17.6 13.7C17.8 14.8 17.5 15.8 16.8 16.6C16.2 17.2 15.4 17.6 14.8 18.1C14.3 18.6 14 19.2 14 19.8L14 19.8"),
    G("ai", [
      path("M8.4 13L9.7 9.1C9.9 8.6 10.5 8.6 10.7 9.1L12 13M9.1 11.5L11.3 11.5"),
      line(13.7, 9.2, 13.7, 13),
    ]),
  ],
    gAnims: { ai: an("opacity", ["1", "1", "0.45", "1", "1"], [0, 0.3, 0.55, 0.8, 1]) } },

  /* the two circuit nodes ping */
    "artificial-intelligence03": { dur: 1.6,
    auto: false,
    parts: [
    path("M6.8 19.8L6.8 16.4C5.1 15.1 4.1 13.1 4.1 11C4.1 7.2 7.2 4.2 11 4.2C14.5 4.2 17.4 6.8 17.8 10.2L19.5 11.7C19.9 12.1 19.8 12.7 19.3 12.9L17.6 13.7C17.8 14.8 17.5 15.8 16.8 16.6C16.2 17.2 15.4 17.6 14.8 18.1C14.3 18.6 14 19.2 14 19.8L14 19.8"),
    A(circle(8.2, 7.6, 1), [an("r", ["1", "1", "1.4", "1", "1"], [0, 0.3, 0.55, 0.8, 1])]),
    path("M9.2 7.6L10.8 9.2L14 9.2"),
    A(circle(8.2, 12.4, 1), [an("r", ["1", "1", "1.4", "1", "1"], [0, 0.42, 0.54, 0.66, 1])]),
    line(9.2, 12.4, 14.2, 12.4),
  ] },

  /* the AI glyphs breathe inside the chip */
  "artificial-intelligence04": {
    auto: false,
    dur: 1.8,
    parts: [
      rect(5, 5, 14, 14, 2.4),
      G("ai", [
        path("M8.6 14.8l1.4-4.1c.2-.5.8-.5 1 0l1.4 4.1M9.4 13.2h2.4"),
        line(14.2, 10.7, 14.2, 14.8),
      ]),
      path("M8.2 5V2.8M12 5V2.8M15.8 5V2.8M8.2 19v2.2M12 19v2.2M15.8 19v2.2"),
      path("M5 8.2H2.8M5 12H2.8M5 15.8H2.8M19 8.2h2.2M19 12h2.2M19 15.8h2.2"),
    ],
    gAnims: { ai: an("opacity", ["1", "1", "0.45", "1", "1"], HOLD) },
  },

  "artificial-intelligence05": {
    auto: false,
    parts: [
      G("turn", [
        path(flowerPath(12, 12, 10, 7.7, 0.95)),
        path("M8.9 14.7l1.3-3.9c.2-.5.7-.5.9 0l1.3 3.9M9.6 13.2h2.2"),
        line(14.2, 10.8, 14.2, 14.7),
      ]),
    ],
    gAnims: { turn: tn("rotate", ["0 12 12", "36 12 12"]) },
  },

  "artificial-intelligence06": {
    auto: false,
    parts: [
      G("turn", [
        path(flowerPath(12, 12, 8, 7.5, 1.25)),
        path("M8.9 14.7l1.3-3.9c.2-.5.7-.5.9 0l1.3 3.9M9.6 13.2h2.2"),
        line(14.2, 10.8, 14.2, 14.7),
      ]),
    ],
    gAnims: { turn: tn("rotate", ["0 12 12", "45 12 12"]) },
  },

  /* the three out-nodes fire in sequence */
  "artificial-intelligence07": {
    auto: false,
    dur: 1.7,
    parts: [
      path(flowerArc(12.8, 12, 7, 7.6, 1.1, -Math.PI / 2, -Math.PI * 1.5)),
      path("M12.9 8.2h3l1.9-1.9"),
      line(12.9, 12, 18.6, 12),
      path("M12.9 15.8h3l1.9 1.9"),
      A(circle(18.9, 5.6, 1), [an("r", ["1", "1", "1.45", "1", "1"], [0, 0.08, 0.2, 0.34, 1])]),
      A(circle(19.7, 12, 1), [an("r", ["1", "1", "1.45", "1", "1"], [0, 0.2, 0.32, 0.46, 1])]),
      A(circle(18.9, 18.4, 1), [an("r", ["1", "1", "1.45", "1", "1"], [0, 0.32, 0.44, 0.58, 1])]),
    ],
  },

    "artificial-intelligence08": { auto: false,
    parts: [
    G("pop", [
      path("M9.69 5.81C9.99 4.91 11.09 4.91 11.39 5.81L12.19 8.01C12.69 9.41 13.89 10.61 15.29 11.11L17.39 11.81C18.29 12.11 18.29 13.31 17.39 13.61L15.29 14.31C13.89 14.81 12.69 16.01 12.19 17.41L11.39 19.61C11.09 20.51 9.99 20.51 9.69 19.61L8.89 17.41C8.39 16.01 7.19 14.81 5.79 14.31L3.69 13.61C2.79 13.31 2.79 12.11 3.69 11.81L5.79 11.11C7.19 10.61 8.39 9.41 8.89 8.01L9.69 5.81Z"),
    ]),
    A(path("M17.79 3.61L18.39 5.11C18.59 5.61 19.09 6.01 19.59 6.21L21.09 6.81L19.59 7.41C19.09 7.61 18.59 8.01 18.39 8.51L17.79 10.01L17.19 8.51C16.99 8.01 16.49 7.61 15.99 7.41L14.49 6.81L15.99 6.21C16.49 6.01 16.99 5.61 17.19 5.11L17.79 3.61Z"), [an("opacity", ["1", "0.35", "1"])]),
  ],
    sAnims: { pop: { pivot: [10.49, 13.01], anim: tn("scale", ["1", "1.09", "1"], [0, 0.5, 1]) } } },

  /* ---------------- AR ---------------- */

  /* the AR card floats with a slow sway */
  "augmented-reality-ar": {
    auto: false,
    dur: 1.9,
    parts: [
      G("card", [
        rect(2.6, 4.6, 18.8, 14.8, 3),
        path("M5.9 15.9l1.9-5.3c.2-.5.8-.5 1 0l1.9 5.3m-3.5-1.8h3.2"),
        path("M13.4 15.9v-5.3h1.9c1 0 1.7.7 1.7 1.6s-.7 1.6-1.7 1.6h-1.9m2.8 0 1.3 2.1"),
      ]),
    ],
    gAnims: { card: WIG(12, 12, 3.5) },
  },

  /* ---------------- batteries ---------------- */

  /* the charge drains away then tops back up */
  "battery": {
    auto: false,
    pp: false,
    dur: 1.9,
    parts: [
      BATTERY_BODY,
      BATTERY_CAP,
      A(rect(5.4, 9.8, 8.8, 4.4, 1.6, fill()), [
        an("width", ["8.8", "8.8", "2.4", "8.8", "8.8"], [0, 0.3, 0.62, 0.88, 1]),
      ]),
    ],
  },

  "battery-charging01": {
    auto: false,
    parts: [
      BATTERY_BODY,
      BATTERY_CAP,
      A(path("M10.7 8.7l-2.3 3.2c-.2.3 0 .6.3.6h1.5l-.7 2.6c-.1.4.4.6.7.3l2.6-3.4c.2-.3 0-.6-.3-.6h-1.5l.7-2.6c.1-.4-.4-.6-1-.1z"), [
        an("opacity", ["1", "0.35", "1"]),
      ]),
    ],
  },

  "battery-charging02": {
    auto: false,
    parts: [
      BATTERY_BODY,
      BATTERY_CAP,
      A(path("M12.3 5.7 9.1 10.9h2.5l-3.2 7.4"), [an("opacity", ["1", "0.35", "1"])]),
    ],
  },

  /* the leaf grows a touch */
  "battery-eco-charging": {
    auto: false,
    dur: 1.7,
    parts: [
      BATTERY_BODY,
      BATTERY_CAP,
      G("leaf", [
        /* a leaf this small reads as a solid mark; the hollow one with a vein clogged */
        path("M8.1 15.6c-.5-3 1.8-5.3 4.9-5.5.4 0 .6.3.6.6.1 2.9-2 5.2-4.9 5.4-.4 0-.6-.2-.6-.5z", { fill: "currentColor" }),
      ]),
    ],
    sAnims: { leaf: POP(10.8, 13, 1.1) },
  },

  /* the empty nub blinks for a charge */
  "battery-empty": {
    auto: false,
    dur: 1.6,
    parts: [BATTERY_BODY, A(BATTERY_CAP, BLINK(0.25))],
  },

  /* the cells light up in a cascade */
  "battery-full": {
    auto: false,
    pp: false,
    dur: 2,
    parts: [BATTERY_BODY, BATTERY_CAP, CELL(5.2, 0.08), CELL(8.4, 0.2), CELL(11.6, 0.32), CELL(14.8, 0.44)],
  },

  /* the last cell flickers, running on fumes */
  "battery-low": {
    auto: false,
    pp: false,
    dur: 1.5,
    parts: [
      BATTERY_BODY,
      BATTERY_CAP,
      A(cell(5.2), [an("opacity", ["1", "0.2", "1", "0.2", "1"], [0, 0.2, 0.4, 0.6, 1])]),
    ],
  },

  /* the cells breathe in turn */
  "battery-medium01": {
    auto: false,
    dur: 1.7,
    parts: [
      BATTERY_BODY,
      BATTERY_CAP,
      A(cell(5.2), [an("opacity", ["1", "1", "0.45", "1", "1"], HOLD)]),
      A(cell(8.4), [an("opacity", ["1", "1", "0.45", "1", "1"], [0, 0.44, 0.56, 0.7, 1])]),
    ],
  },

  "battery-medium02": {
    auto: false,
    dur: 1.7,
    parts: [
      BATTERY_BODY,
      BATTERY_CAP,
      A(cell(5.2), [an("opacity", ["1", "1", "0.45", "1", "1"], HOLD)]),
      A(cell(8.4), [an("opacity", ["1", "1", "0.45", "1", "1"], [0, 0.4, 0.52, 0.66, 1])]),
      A(cell(11.6), [an("opacity", ["1", "1", "0.45", "1", "1"], [0, 0.5, 0.62, 0.76, 1])]),
    ],
  },

  /* the plus pops in the cell */
  "battery-plus": {
    auto: false,
    dur: 1.5,
    parts: [BATTERY_BODY, BATTERY_CAP, G("plus", [path("M10.5 9.5v5m-2.5-2.5h5")])],
    sAnims: { plus: POP(10.5, 12, 1.18) },
  },

  /* the warning bang thumps */
  "battery-warning": {
    auto: false,
    dur: 1.5,
    parts: [BATTERY_BODY, BATTERY_CAP, G("warn", [path("M10.5 9.4v3.4"), circle(10.5, 14.7, 1, fill())])],
    sAnims: { warn: POP(10.5, 12.3, 1.16) },
  },

  /* ---------------- cables & chips ---------------- */

  /* the two plugs reach for each other */
  "cable": {
    auto: false,
    dur: 1.7,
    parts: [
      G("plugL", [rect(2.6, 14.6, 5.6, 4.6, 1.3), path("M4 19.2v2M6.8 19.2v2")]),
      G("plugR", [rect(15.8, 4.6, 5.6, 4.6, 1.3), path("M17.2 4.6v-2M20 4.6v-2")]),
      path("M5.4 14.6V7.2c0-1.6 1.3-2.9 2.9-2.9h3.2c1.6 0 2.9 1.3 2.9 2.9v9.4c0 1.6 1.3 2.9 2.9 2.9h.2c1.6 0 2.9-1.3 2.9-2.9V9.2"),
    ],
    gAnims: { plugL: DIP(0.7, -0.7), plugR: DIP(-0.7, 0.7) },
  },

  "cable-car": {
    dur: 2.2,
    auto: false,
    parts: [
      line(2.8, 3, 21.2, 3),
      G("cab", [
        path("M13.2 3l-1.2 3.2M9.6 6.2h4.8"),
        path("M6.4 8.4h11.2c1.4 0 2.4.9 2.7 2.2.3 1.3.5 2.7.5 4.1 0 1.4-.1 2.7-.4 3.9-.3 1.3-1.4 2.4-2.7 2.4H6.3c-1.4 0-2.4-1-2.7-2.4-.3-1.2-.4-2.5-.4-3.9 0-1.4.2-2.8.5-4.1.3-1.3 1.3-2.2 2.7-2.2z"),
        path("M4.7 15.6h14.9M12 9.6v6"),
      ]),
    ],
    gAnims: { cab: tn("rotate", ["0 12 3", "2.4 12 3", "-1.8 12 3", "0 12 3"], [0, 0.35, 0.7, 1]) },
  },

  /* the core pulses under the pins */
  "chip": {
    auto: false,
    dur: 1.6,
    parts: [
      rect(4.6, 4.6, 14.8, 14.8, 2.6),
      G("core", [rect(8.4, 8.4, 7.2, 7.2, 1.9)]),
      path("M8.4 4.6V2.6M12 4.6V2.6M15.6 4.6V2.6M8.4 19.4v2M12 19.4v2M15.6 19.4v2"),
      path("M4.6 8.4H2.6M4.6 12H2.6M4.6 15.6H2.6M19.4 8.4h2M19.4 12h2M19.4 15.6h2"),
    ],
    sAnims: { core: POP(12, 12, 1.1) },
  },

  /* the die dot pings */
  "chip02": {
    auto: false,
    dur: 1.6,
    parts: [
      circle(12, 12, 9),
      circle(12, 12, 5.4),
      A(circle(12, 12, 1.3, fill()), [an("r", ["1.3", "1.3", "1.8", "1.3", "1.3"], HOLD)]),
      path("M12 3.4v3M12 17.6v3M3.4 12h3M17.6 12h3"),
    ],
  },

  /* ---------------- computers ---------------- */

  /* the activity trace draws itself on */
  "computer-activity": {
    auto: false,
    dur: 1.8,
    parts: [SCREEN, STAND, FOOT, DRAW(path("M6.6 10.4h2l1.4-2.6 2.1 5.2 1.4-3.4h3.9"), 0.12, 0.6)],
  },

  /* the plus pops on screen */
  "computer-add": {
    auto: false,
    dur: 1.5,
    parts: [SCREEN, STAND, FOOT, G("plus", [path("M12 8.2v4.4M9.8 10.4h4.4")])],
    sAnims: { plus: POP(12, 10.4, 1.18) },
  },

  "computer-arrow-down": {
    auto: false,
    parts: [
      SCREEN,
      STAND,
      FOOT,
      G("bob", [path("M12 7.4v5.2m-2.7-2.7 2.7 2.7 2.7-2.7")]),
    ],
    gAnims: { bob: tn("translate", ["0 0", "0 1.1", "0 0"]) },
  },

  "computer-arrow-up": {
    auto: false,
    parts: [
      SCREEN,
      STAND,
      FOOT,
      G("bob", [path("M12 13.4V8.2m-2.7 2.7L12 8.2l2.7 2.7")]),
    ],
    gAnims: { bob: tn("translate", ["0 0", "0 -1.1", "0 0"]) },
  },

  /* the trend line draws itself */
  "computer-chart-down": {
    auto: false,
    dur: 1.8,
    parts: [
      SCREEN,
      STAND,
      FOOT,
      DRAW(path("M6.8 7.6l2.6 2.6 1.9-1.9 4.2 4.2M12.8 12.5h2.7V9.8"), 0.12, 0.62),
    ],
  },

  "computer-chart-up": {
    auto: false,
    dur: 1.8,
    parts: [
      SCREEN,
      STAND,
      FOOT,
      DRAW(path("M6.8 13.2l2.6-2.6 1.9 1.9 4.2-4.2M12.8 8.3h2.7V11"), 0.12, 0.62),
    ],
  },

  /* the check writes itself on */
  "computer-check": {
    auto: false,
    dur: 1.7,
    parts: [SCREEN, STAND, FOOT, DRAW(path("M8.7 10.4l2.2 2.2 4.4-4.6"), 0.18, 0.55)],
  },

  /* the cloud floats in the screen */
  "computer-cloud": {
    auto: false,
    dur: 1.8,
    parts: [
      SCREEN,
      STAND,
      FOOT,
      SHIFT(path("M9.2 13.1h5.5c1.1 0 2-.8 2-1.9 0-.9-.7-1.7-1.5-1.9-.3-1.2-1.4-2-2.7-2-1.6 0-2.9 1.1-3 2.6-.9.1-1.6.9-1.6 1.8 0 .8.6 1.4 1.3 1.4z"), 0, -0.9),
    ],
  },

  /* the desk monitor flickers on */
  "computer-desk01": {
    auto: false,
    pp: false,
    dur: 1.8,
    parts: [
      DESK_TOP,
      DESK_LEGS,
      A(rect(8, 3.4, 8.6, 6.2, 1.5), [an("opacity", ["1", "0.45", "1", "0.45", "1", "1"], [0, 0.2, 0.3, 0.4, 0.52, 1])]),
      path("M9.9 9.6l-.4 2.6M14.7 9.6l.4 2.6"),
      DESK_RETURN,
    ],
  },

  /* the desk lamp sways */
  "computer-desk02": {
    auto: false,
    dur: 1.8,
    parts: [
      DESK_TOP,
      DESK_LEGS,
      rect(3.6, 3.4, 8.6, 6.2, 1.5),
      path("M5.5 9.6l-.4 2.6M10.3 9.6l.4 2.6"),
      G("lamp", [path("M16.6 12.2V9.6c0-.9.7-1.6 1.6-1.6h1.4c.9 0 1.6.7 1.6 1.6v2.6")]),
      DESK_RETURN,
    ],
    gAnims: { lamp: WIG(16.6, 12.2, 6) },
  },

  /* the lamp head tilts */
  "computer-desk03": {
    auto: false,
    dur: 1.8,
    parts: [
      DESK_TOP,
      DESK_LEGS,
      rect(3.6, 3.4, 8.6, 6.2, 1.5),
      path("M5.5 9.6l-.4 2.6M10.3 9.6l.4 2.6"),
      G("lamp", [
        path("M19.9 12.2c.5-1.8.9-3.4.9-4.6 0-1.7-1.2-2.8-2.9-3.1"),
        path("M15.4 7.2c.3-1.2 1.5-2 2.8-1.7 1.2.3 1.9 1.4 1.8 2.7l-4.7-1z"),
      ]),
    ],
    gAnims: { lamp: WIG(19.9, 12.2, 5) },
  },

  /* the dollar sign pops on screen */
  "computer-dollar": {
    auto: false,
    dur: 1.5,
    parts: [
      SCREEN,
      STAND,
      FOOT,
      G("dollar", [
        path("M13.8 8.6c-.4-.7-1-1-1.8-1-1 0-1.8.7-1.8 1.5 0 2.1 3.6 1.1 3.6 3.1 0 .9-.8 1.5-1.8 1.5-.7 0-1.4-.3-1.8-1"),
        path("M12 6.7v.8m0 6.2v.8"),
      ]),
    ],
    sAnims: { dollar: POP(12, 10.4, 1.14) },
  },

  /* the ethernet hook pulses its link */
  "computer-ethernet": {
    auto: false,
    dur: 1.7,
    parts: [
      rect(2.8, 4.4, 14.4, 12.2, 2.5),
      path("M10 16.6v2.6"),
      line(6.6, 19.8, 13.4, 19.8),
      rect(17.6, 2.8, 3.8, 2.6, 0.8),
      A(path("M18.6 5.4v1.1c0 .8.6 1.5 1.4 1.5h0c.8 0 1.4-.7 1.4-1.5V5.4"), BLINK(0.35)),
      line(20, 8, 20, 20.6),
    ],
  },
};
