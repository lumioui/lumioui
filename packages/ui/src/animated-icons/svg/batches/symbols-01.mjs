const path = (d, a = {}) => ({ e: "path", a: { d, ...a } });
const circle = (cx, cy, r, a = {}) => ({ e: "circle", a: { cx, cy, r, ...a } });
const line = (x1, y1, x2, y2, a = {}) => ({ e: "line", a: { x1, x2, y1, y2, ...a } });
const rect = (x, y, w, h, rx, a = {}) => ({ e: "rect", a: { x, y, width: w, height: h, rx, ...a } });
const ellipse = (cx, cy, rx, ry, a = {}) => ({ e: "ellipse", a: { cx, cy, rx, ry, ...a } });
const fill = (color = "currentColor") => ({ fill: color, stroke: "none" });
const A = (part, anims) => ({ ...part, anims });
const G = (id, children, a = {}) => ({ e: "g", g: id, a, children });
const an = (attr, values, times) => ({ kind: "attr", attr, values, times });
const tn = (type, values, times, extra = {}) => ({ kind: "transform", type, values, times, ...extra });

/* ---- bespoke gesture idioms -------------------------------------------
   HOLD phrasing: rest ~30%, act mid-cycle, settle back. Seamless loops. */
const HOLD = [0, 0.3, 0.55, 0.8, 1];
/* scale-pop around a mark's own center (sAnims entry). */
const POP = (cx, cy, s = 1.24) => ({
  pivot: [cx, cy],
  anim: tn("scale", ["1", "1", `${s}`, "1", "1"], HOLD),
});
/* wiggle — rotate −a then +a around a pivot, with rest holds. */
const WIG = (cx, cy, a = 9) =>
  tn("rotate", [`0 ${cx} ${cy}`, `0 ${cx} ${cy}`, `-${a} ${cx} ${cy}`, `${a - 2} ${cx} ${cy}`, `0 ${cx} ${cy}`], HOLD);
/* dip — translate out along an axis and spring back (for gAnims). */
const DIP = (dx, dy) => tn("translate", ["0 0", "0 0", `${dx} ${dy}`, "0 0", "0 0"], HOLD);
/* nudge one part along an axis, then spring back (for A()). */
const SHIFT = (p, dx, dy, t = HOLD) =>
  A(p, [tn("translate", ["0 0", "0 0", `${dx} ${dy}`, "0 0", "0 0"], t)]);
/* trace — the stroke writes itself on; pathLength=1 normalizes. */
const DRAW = (p, t0 = 0.15, t1 = 0.62) =>
  A({ ...p, a: { ...p.a, pathLength: 1, "stroke-dasharray": 1 } },
    [an("stroke-dashoffset", ["1", "1", "0", "0"], [0, t0, t1, 1])]);

/* symbols-01 — 57 glyphs: sort/move arrows, charts, loops & refresh, a
 * batch of editor/object strays (badge-help, bolt, orbit, origami,
 * package-2, pointer-off, radiation, scissors-line-dashed, slash, spade,
 * spell-check*, spline, ungroup, unlink-2, vote, wallet-*).
 * Arrows surge along their direction; loops keep turning; charts grow. */

/* ---- shared anatomy ----------------------------------------------------
   SORT_*: the arrow column of the sort glyphs — same stem + soft chevron
   head the wayfinding batches use, so the twin names match. */
const SORT_DN = [
  line(7, 4.5, 7, 19.2),
  path("M3.6 15.6L7 19.2L10.4 15.6"),
];
const SORT_UP = [
  line(7, 19.5, 7, 4.8),
  path("M3.6 8.4L7 4.8L10.4 8.4"),
];
const SURGE_DN = tn("translate", ["0 0", "0 2.4", "0 0", "0 0"], [0, 0.2, 0.45, 1]);
const SURGE_UP = tn("translate", ["0 0", "0 -2.4", "0 0", "0 0"], [0, 0.2, 0.45, 1]);
/* digit/letter stamps at the right of a sort arrow — one set shared by all
 * eight sort glyphs: 4.6 wide, 6 tall, slots at y 4–10 and 14–20 so the two
 * glyphs keep 4px of air between them. */
const zero = (y) => rect(15.6, y, 4.8, 6, 2.2);
const one = (y) => [path(`M16.2 ${y + 1.4}L18 ${y}V${y + 6}`), line(16, y + 6, 20, y + 6)];
const letA = (y) => [path(`M15.4 ${y + 6}L18 ${y}L20.6 ${y + 6}`), line(16.5, y + 3.9, 19.5, y + 3.9)];
const letZ = (y) => [path(`M15.8 ${y}H20.2L15.8 ${y + 6}H20.2`)];
const ZERO_T = zero(4);
const ZERO_B = zero(14);
const ONE_T = one(4);
const ONE_B = one(14);
const A_T = letA(4);
const A_B = letA(14);
const Z_T = letZ(4);
const Z_B = letZ(14);
/* L-axes with a rounded corner. Marks inside the chart keep 2px of air to
 * both axes: nothing left of x 7.8, nothing below the FLOOR (4px of
 * centreline clearance above the baseline at y 20.2). */
const AXIS = "M3.8 3.8v13.4c0 1.7 1.3 3 3 3h13.4";
const FLOOR = 16.2;
/* column = one round-capped bar that rises from the floor */
const colbar = (x, top, t0, t1, floor = FLOOR) =>
  A(line(x, floor, x, top), [an("y2", [String(floor), String(floor), String(top)], [0, t0, t1])]);
/* wide column = open rounded slab (hole ≥ 2px) rising from the floor */
const slab = (x, top, t0, t1, w = 4.2) =>
  A(rect(x, top, w, FLOOR - top, 1.1), [
    an("y", [String(FLOOR - 1), String(FLOOR - 1), String(top)], [0, t0, t1]),
    an("height", ["1", "1", String(FLOOR - top)], [0, t0, t1]),
  ]);
/* row = one round-capped bar that grows right from its start */
const rowbar = (x, y, w, t0, t1) =>
  A(line(x, y, x + w, y), [an("x2", [String(x), String(x), String(x + w)], [0, t0, t1])]);
/* scatter dot that swells in — filled, so it stays a crisp point */
const dot = (cx, cy, r, t0, t1) =>
  A(circle(cx, cy, r, fill()), [an("r", ["0.3", "0.3", String(r)], [0, t0, t1])]);
/* network node — open ring (r ≥ 1.8) that swells in */
const node = (cx, cy, r, t0, t1) =>
  A(circle(cx, cy, r), [an("r", ["0.3", "0.3", String(r)], [0, t0, t1])]);
/* gentle push in the arrow's direction, then spring back (gAnims entry) */
const NUDGE = (dx, dy) => tn("translate", ["0 0", "0 0", `${dx} ${dy}`, "0 0", "0 0"], HOLD);

export const icons = {
  /* ============================ sort arrows ============================ */

  /* down-stem + 0 over 1 — sorts ascending down the column */
  "arrow-down-0-1": {
    dur: 1.5, auto: false, pp: false,
    parts: [G("sort", SORT_DN), ZERO_T, ...ONE_B],
    gAnims: { sort: SURGE_DN },
  },

  /* down-stem + 1 over 0 — descending */
  "arrow-down-1-0": {
    dur: 1.5, auto: false, pp: false,
    parts: [G("sort", SORT_DN), ...ONE_T, ZERO_B],
    gAnims: { sort: SURGE_DN },
  },

  /* down-stem + A over Z */
  "arrow-down-a-z": {
    dur: 1.5, auto: false, pp: false,
    parts: [G("sort", SORT_DN), ...A_T, ...Z_B],
    gAnims: { sort: SURGE_DN },
  },

  /* down-stem + Z over A */
  "arrow-down-z-a": {
    dur: 1.5, auto: false, pp: false,
    parts: [G("sort", SORT_DN), ...Z_T, ...A_B],
    gAnims: { sort: SURGE_DN },
  },

  /* up-stem + 0 over 1 */
  "arrow-up-0-1": {
    dur: 1.5, auto: false, pp: false,
    parts: [G("sort", SORT_UP), ZERO_T, ...ONE_B],
    gAnims: { sort: SURGE_UP },
  },

  /* up-stem + 1 over 0 */
  "arrow-up-1-0": {
    dur: 1.5, auto: false, pp: false,
    parts: [G("sort", SORT_UP), ...ONE_T, ZERO_B],
    gAnims: { sort: SURGE_UP },
  },

  /* up-stem + A over Z */
  "arrow-up-a-z": {
    dur: 1.5, auto: false, pp: false,
    parts: [G("sort", SORT_UP), ...A_T, ...Z_B],
    gAnims: { sort: SURGE_UP },
  },

  /* up-stem + Z over A */
  "arrow-up-z-a": {
    dur: 1.5, auto: false, pp: false,
    parts: [G("sort", SORT_UP), ...Z_T, ...A_B],
    gAnims: { sort: SURGE_UP },
  },

  /* ============================ move arrows ============================ */

  /* full-height arrow drifting down */
  "move-down": {
    dur: 1.5, auto: false,
    parts: [
      G("nudge", [line(12, 3.9, 12, 19.6), path("M8.6 16.2L12 19.6L15.4 16.2")]),
    ],
    gAnims: { nudge: NUDGE(0, 1.1) },
  },

  /* diagonal drop to the lower-left corner */
  "move-down-left": {
    dur: 1.5, auto: false,
    parts: [
      G("nudge", [
        line(18.4, 5.6, 6.6, 17.4),
        path("M12.2 17.6L7.3 17.6C6.6 17.6 6.4 17.4 6.4 16.7L6.4 11.8"),
      ]),
    ],
    gAnims: { nudge: NUDGE(-0.9, 0.9) },
  },

  /* diagonal drop to the lower-right corner */
  "move-down-right": {
    dur: 1.5, auto: false,
    parts: [
      G("nudge", [
        line(5.6, 5.6, 17.4, 17.4),
        path("M11.8 17.6L16.7 17.6C17.4 17.6 17.6 17.4 17.6 16.7L17.6 11.8"),
      ]),
    ],
    gAnims: { nudge: NUDGE(0.9, 0.9) },
  },

  /* full-width arrow drifting left */
  "move-left": {
    dur: 1.5, auto: false,
    parts: [
      G("nudge", [line(20.1, 12, 4.4, 12), path("M7.8 8.6L4.4 12L7.8 15.4")]),
    ],
    gAnims: { nudge: NUDGE(-1.1, 0) },
  },

  /* full-width arrow drifting right */
  "move-right": {
    dur: 1.5, auto: false,
    parts: [
      G("nudge", [line(3.9, 12, 19.6, 12), path("M16.2 8.6L19.6 12L16.2 15.4")]),
    ],
    gAnims: { nudge: NUDGE(1.1, 0) },
  },

  /* full-height arrow drifting up */
  "move-up": {
    dur: 1.5, auto: false,
    parts: [
      G("nudge", [line(12, 20.1, 12, 4.4), path("M8.6 7.8L12 4.4L15.4 7.8")]),
    ],
    gAnims: { nudge: NUDGE(0, -1.1) },
  },

  /* diagonal lift to the upper-left corner */
  "move-up-left": {
    dur: 1.5, auto: false,
    parts: [
      G("nudge", [
        line(18.4, 18.4, 6.6, 6.6),
        path("M11.8 6.4L7.3 6.4C6.6 6.4 6.4 6.6 6.4 7.3L6.4 12.2"),
      ]),
    ],
    gAnims: { nudge: NUDGE(-0.9, -0.9) },
  },

  /* diagonal lift to the upper-right corner */
  "move-up-right": {
    dur: 1.5, auto: false,
    parts: [
      G("nudge", [
        line(5.6, 18.4, 17.4, 6.6),
        path("M12.2 6.4L16.7 6.4C17.4 6.4 17.6 6.6 17.6 7.3L17.6 11.8"),
      ]),
    ],
    gAnims: { nudge: NUDGE(0.9, -0.9) },
  },

  /* ============================ loops & edits ============================ */

  /* hooked arc sweeping right with a corner head — arc traces, head lands */
  "undo-2": {
    dur: 1.8, auto: false,
    parts: [
      DRAW(path("M9.2 3.8L4.2 8.6L9.2 13.6"), 0.55, 0.8),
      DRAW(path("M4.2 8.6L14.1 8.6C17.8 8.6 20.4 11.1 20.4 14.4S17.8 20.2 14.1 20.2L10.6 20.2"), 0.12, 0.55),
    ],
  },

  /* same hook mirrored forward */
  "redo-2": {
    dur: 1.8, auto: false,
    parts: [
      DRAW(path("M14.8 3.8L19.8 8.6L14.8 13.6"), 0.55, 0.8),
      DRAW(path("M19.8 8.6L9.9 8.6C6.2 8.6 3.6 11.1 3.6 14.4S6.2 20.2 9.9 20.2L13.4 20.2"), 0.12, 0.55),
    ],
  },

  /* two corner-headed arcs chasing counter-clockwise — keeps turning */
  "refresh-ccw": {
    dur: 1.8, auto: false, pp: false,
    parts: [
      G("spin", [
        path("M20.6 12.2c0-4.8-3.8-8.6-8.6-8.6-3.2 0-6 1.8-7.4 4.4L3.2 9.6"),
        path("M3.2 3.6L3.2 8.8L8.4 8.8"),
        path("M3.4 11.8c0 4.8 3.8 8.6 8.6 8.6 3.2 0 6-1.8 7.4-4.4l1.4-1.6"),
        path("M20.8 20.4L20.8 15.2L15.6 15.2"),
      ]),
    ],
    gAnims: { spin: tn("rotate", ["0 12 12", "360 12 12"]) },
  },

  /* same counter-clockwise pair + a center dot that stays put */
  "refresh-ccw-dot": {
    dur: 1.8, auto: false, pp: false,
    parts: [
      G("spin", [
        path("M20.6 12.2c0-4.8-3.8-8.6-8.6-8.6-3.2 0-6 1.8-7.4 4.4L3.2 9.6"),
        path("M3.2 3.6L3.2 8.8L8.4 8.8"),
        path("M3.4 11.8c0 4.8 3.8 8.6 8.6 8.6 3.2 0 6-1.8 7.4-4.4l1.4-1.6"),
        path("M20.8 20.4L20.8 15.2L15.6 15.2"),
      ]),
      circle(12, 12, 1.3, fill()),
    ],
    gAnims: { spin: tn("rotate", ["0 12 12", "360 12 12"]) },
  },

  /* broken circular arrows + strike — the loop tries to turn and rocks back */
  "refresh-cw-off": {
    dur: 1.7, auto: false,
    parts: [
      G("try", [
        path("M20.8 8.2L18.8 6.1C17.1 4.3 14.6 3.2 12 3.2 11 3.2 10.1 3.4 9.3 3.7"),
        path("M8.2 15.6L3.4 15.6L3.4 20.4"),
        path("M3.4 11.9c0-2.5 1-4.7 2.6-6.3"),
        path("M3.4 16.1l2.2 2.2C7.3 20 9.7 21 12.2 21c2.5 0 4.7-1 6.3-2.6"),
        path("M20.6 12c0 1-.2 1.9-.5 2.8"),
        path("M20.8 3.4L20.8 8.2L16 8.2"),
      ]),
      DRAW(path("M20.6 20.6L3.4 3.4"), 0.5, 0.85),
    ],
    gAnims: {
      try: tn("rotate", ["0 12 12", "0 12 12", "8 12 12", "-5 12 12", "0 12 12"], HOLD),
    },
  },

  /* flat loop with a pulsing "1" — the badge beats while arrows chase */
  "repeat-1": {
    dur: 1.9, auto: false,
    parts: [
      G("fwd", [
        path("M2.9 11.2L2.9 9.6C2.9 7.4 4.7 5.6 6.9 5.6L17.4 5.6"),
        path("M14.6 2.8L17.6 5.6L14.6 8.4"),
      ]),
      G("bck", [
        path("M21.1 12.8L21.1 14.4C21.1 16.6 19.3 18.4 17.1 18.4L6.6 18.4"),
        path("M9.4 21.2L6.4 18.4L9.4 15.6"),
      ]),
      G("one", [path("M10.8 10.4L12.2 9.4L12.2 14.6")]),
    ],
    gAnims: { fwd: NUDGE(0.9, 0), bck: NUDGE(-0.9, 0) },
    sAnims: { one: POP(12.2, 12, 1.18) },
  },

  /* two-column loop — left column rises, right column falls */
  "repeat-2": {
    dur: 1.9, auto: false,
    parts: [
      G("up", [
        path("M13.4 18.4L7.6 18.4C6.4 18.4 5.9 17.7 5.9 16.6L5.9 7.3"),
        path("M3.2 10L5.9 7.3L8.6 10"),
      ]),
      G("dn", [
        path("M10.6 5.6L16.4 5.6C17.6 5.6 18.1 6.3 18.1 7.4L18.1 16.7"),
        path("M15.4 14L18.1 16.7L20.8 14"),
      ]),
    ],
    gAnims: { up: NUDGE(0, -0.9), dn: NUDGE(0, 0.9) },
  },

  /* corner ticks + arrow dropping into a filled-in square below */
  replace: {
    dur: 1.8, auto: false,
    parts: [
      /* the target slot: a dotted square — round-cap dots every 3.2
         (corners + midpoints), so it reads as "empty" at any size */
      rect(14, 3.6, 6.4, 6.4, 0, { "stroke-dasharray": "0 3.2" }),
      DRAW(path("M6.4 10.2L6.4 6C6.4 4.8 7.3 3.9 8.4 3.9L10.8 3.9"), 0.1, 0.5),
      DRAW(path("M4.1 7.9L6.4 10.2L8.7 7.9"), 0.45, 0.68),
      G("box", [rect(3.4, 13.6, 7.2, 7.2, 1.7)]),
    ],
    sAnims: { box: POP(7, 17.2, 1.14) },
  },

  /* ============================ charts ============================ */

  /* axes + two wick'd candlesticks; bodies grow from their top edge */
  "chart-candlestick": {
    dur: 1.9, auto: false,
    parts: [
      path(AXIS),
      DRAW(path("M9.4 5.2L9.4 8.4M9.4 13.4L9.4 15.8"), 0.45, 0.8),
      DRAW(path("M16.6 3.8L16.6 6M16.6 11.2L16.6 13.8"), 0.55, 0.9),
      A(rect(7.4, 8.4, 4, 5, 1.1), [an("height", ["1", "1", "5"], [0, 0.15, 0.65])]),
      A(rect(14.6, 6, 4, 5.2, 1.1), [an("height", ["1", "1", "5.2"], [0, 0.3, 0.85])]),
    ],
  },

  /* axes + three rising columns */
  "chart-column": {
    dur: 1.8, auto: false,
    parts: [
      path(AXIS),
      colbar(8.6, 12.4, 0.05, 0.55),
      colbar(12.8, 5.6, 0.18, 0.7),
      colbar(17, 9.2, 0.32, 0.85),
    ],
  },

  /* axes + two fat columns */
  "chart-column-big": {
    dur: 1.8, auto: false,
    parts: [
      path(AXIS),
      slab(7.8, 9, 0.05, 0.6),
      slab(15.2, 5, 0.2, 0.8),
    ],
  },

  /* axes + columns stepping down */
  "chart-column-decreasing": {
    dur: 1.8, auto: false,
    parts: [
      path(AXIS),
      colbar(8.6, 5.6, 0.05, 0.55),
      colbar(12.8, 9.2, 0.18, 0.7),
      colbar(17, 12.8, 0.32, 0.85),
    ],
  },

  /* axes + columns stepping up */
  "chart-column-increasing": {
    dur: 1.8, auto: false,
    parts: [
      path(AXIS),
      colbar(8.6, 12.8, 0.05, 0.55),
      colbar(12.8, 9.2, 0.18, 0.7),
      colbar(17, 5.6, 0.32, 0.85),
    ],
  },

  /* axes + two fat columns, each split by a seam that writes on */
  "chart-column-stacked": {
    dur: 1.9, auto: false,
    parts: [
      path(AXIS),
      slab(7.8, 7.4, 0.05, 0.6),
      slab(15.2, 4.4, 0.2, 0.8),
      A(line(7.8, 11.8, 12, 11.8), [an("x2", ["7.8", "7.8", "12"], [0, 0.4, 0.75])]),
      A(line(15.2, 9.4, 19.4, 9.4), [an("x2", ["15.2", "15.2", "19.4"], [0, 0.55, 0.9])]),
    ],
  },

  /* axes + three staggered timeline bars growing right */
  "chart-gantt": {
    dur: 1.9, auto: false,
    parts: [
      path(AXIS),
      rowbar(11.4, 6.4, 7, 0.05, 0.6),
      rowbar(8, 10.8, 7, 0.2, 0.75),
      rowbar(13, 15.2, 6.4, 0.35, 0.9),
    ],
  },

  /* axes + zigzag trend that traces on */
  "chart-line": {
    dur: 1.8, auto: false,
    parts: [
      path(AXIS),
      DRAW(path("M7.8 14.6L11 11L14.2 13.8L19.8 7.4"), 0.15, 0.75),
    ],
  },

  /* axes + a little constellation — links trace, nodes pop */
  "chart-network": {
    dur: 1.9, auto: false,
    parts: [
      path(AXIS),
      DRAW(path("M10.3 12.1L11.5 8.5"), 0.2, 0.6),
      DRAW(path("M14.3 7.9L16.1 9.5"), 0.35, 0.75),
      DRAW(path("M11.7 13.5L15.7 12.1"), 0.45, 0.85),
      node(12.4, 6.2, 1.9, 0.05, 0.4),
      node(18, 11.2, 1.9, 0.3, 0.65),
      node(9.4, 14.4, 1.9, 0.5, 0.9),
    ],
  },

  /* three bare columns, no axes — middle one towers */
  "chart-no-axes-column": {
    dur: 1.8, auto: false,
    parts: [
      colbar(6, 13.6, 0.05, 0.55, 20),
      colbar(12, 4, 0.18, 0.7, 20),
      colbar(18, 9.4, 0.32, 0.85, 20),
    ],
  },

  /* axes + five dots swelling in */
  "chart-scatter": {
    dur: 1.9, auto: false,
    parts: [
      path(AXIS),
      dot(9.6, 7.8, 1.5, 0.08, 0.42),
      dot(17.6, 5.4, 1.5, 0.2, 0.55),
      dot(13.4, 11.2, 1.5, 0.32, 0.68),
      dot(9.4, 14.8, 1.5, 0.45, 0.8),
      dot(17.8, 14.2, 1.5, 0.58, 0.92),
    ],
  },

  /* axes + a smooth S-curve tracing on */
  "chart-spline": {
    dur: 1.9, auto: false,
    parts: [
      path(AXIS),
      DRAW(path("M7.8 15.8C8.4 13.6 9.4 9.4 11.6 9.4C13.8 9.4 14.2 12.6 16.4 12.6C18.4 12.6 19.6 9.2 20.2 6.6"), 0.15, 0.78),
    ],
  },

  /* ============================ flips ============================ */

  /* dashed fold line across the middle; the half-arrows press toward it */
  "flip-horizontal-2": {
    dur: 1.8, auto: false,
    parts: [
      line(4, 12, 20, 12, { "stroke-dasharray": "2.4 4.4" }),
      G("tp", [path("M8 3.8L16 3.8C16.7 3.8 17 4.6 16.6 5.1L12.8 8.9C12.4 9.3 11.6 9.3 11.2 8.9L7.4 5.1C7 4.6 7.3 3.8 8 3.8Z")]),
      G("bt", [path("M8 20.2L16 20.2C16.7 20.2 17 19.4 16.6 18.9L12.8 15.1C12.4 14.7 11.6 14.7 11.2 15.1L7.4 18.9C7 19.4 7.3 20.2 8 20.2Z")]),
    ],
    gAnims: { tp: NUDGE(0, 0.7), bt: NUDGE(0, -0.7) },
  },

  /* same fold turned upright */
  "flip-vertical-2": {
    dur: 1.8, auto: false,
    parts: [
      line(12, 4, 12, 20, { "stroke-dasharray": "2.4 4.4" }),
      G("lf", [path("M3.8 8L3.8 16C3.8 16.7 4.6 17 5.1 16.6L8.9 12.8C9.3 12.4 9.3 11.6 8.9 11.2L5.1 7.4C4.6 7 3.8 7.3 3.8 8Z")]),
      G("rt", [path("M20.2 8L20.2 16C20.2 16.7 19.4 17 18.9 16.6L15.1 12.8C14.7 12.4 14.7 11.6 15.1 11.2L18.9 7.4C19.4 7 20.2 7.3 20.2 8Z")]),
    ],
    gAnims: { lf: NUDGE(0.7, 0), rt: NUDGE(-0.7, 0) },
  },

  /* ============================ editor & symbol strays ============================ */

  /* rosette badge + a "?" that rocks like it's thinking */
  "badge-help": {
    dur: 1.9, auto: false,
    parts: [
      path("M4.1 8.9a4 4 0 0 1 4.6-4.6 4 4 0 0 1 6.6 0 4 4 0 0 1 4.6 4.6 4 4 0 0 1 0 6.6 4 4 0 0 1-4.6 4.6 4 4 0 0 1-6.6 0 4 4 0 0 1-4.6-4.6 4 4 0 0 1 0-6.6z"),
      G("q", [
        path("M9.6 9.4c0-1.6 1.1-2.7 2.5-2.7s2.5 1.1 2.5 2.7c0 2-2.5 2.3-2.5 4.1"),
        circle(12.1, 16.3, 1.05, fill()),
      ]),
    ],
    gAnims: { q: tn("rotate", ["0 12 12", "0 12 12", "-8 12 12", "7 12 12", "0 12 12"], HOLD) },
  },

  /* hex nut + bore — tightens a quarter-turn and settles */
  bolt: {
    dur: 1.8, auto: false,
    parts: [
      G("turn", [
        path("M12 3.2L19.2 7.4C19.8 7.7 20.1 8.3 20.1 9L20.1 15C20.1 15.7 19.8 16.3 19.2 16.6L12 20.8C11.7 21 11.2 21.1 10.8 21L4.8 16.6C4.2 16.3 3.9 15.7 3.9 15L3.9 9C3.9 8.3 4.2 7.7 4.8 7.4L11.4 3.3C11.6 3.2 11.8 3.2 12 3.2Z"),
        circle(12, 12, 3.4),
      ]),
    ],
    gAnims: { turn: tn("rotate", ["0 12 12", "0 12 12", "15 12 12", "-3 12 12", "0 12 12"], HOLD) },
  },

  /* two orbit arcs + satellites that keep circling a core */
  orbit: {
    dur: 2.2, auto: false, pp: false,
    parts: [
      circle(12, 12, 3),
      G("spin", [
        /* the ring opens around each satellite — 2px of air, no blob */
        path("M20.7 9.7A9 9 0 0 1 9.7 20.7"),
        path("M3.3 14.3A9 9 0 0 1 14.3 3.3"),
        circle(18.4, 5.6, 1.9),
        circle(5.6, 18.4, 1.9),
      ]),
    ],
    gAnims: { spin: tn("rotate", ["0 12 12", "360 12 12"]) },
  },

  /* paper crane — folded facets write themselves on */
  origami: {
    dur: 2.1,
    parts: [
      /* one folded silhouette — beak, neck, raised wing, tail — and the
         single crease where the wing meets the body */
      path("M3 9.6L4.4 7.6L8 14.4L11.6 3.6L14.6 14.4L21 7.8L17.6 17H9.6Z"),
      path("M8 14.4H14.6"),
    ],
  },

  /* packing box — lid seam + tape strip that settles */
  "package-2": {
    dur: 1.7,
    parts: [
      path("M3.4 9.4L5.7 5C6 4.4 6.6 4.1 7.3 4.1L16.7 4.1C17.4 4.1 18 4.4 18.3 5L20.6 9.4L20.6 18.6C20.6 20 19.5 21.1 18.1 21.1L5.9 21.1C4.5 21.1 3.4 20 3.4 18.6Z"),
      line(3.4, 9.4, 20.6, 9.4),
      SHIFT(path("M10.9 4.1L13.1 4.1L13.1 9.4L10.9 9.4Z"), 0, 0.7),
    ],
  },

  /* pointing hand with a strike through — index rises, slash lands */
  "pointer-off": {
    dur: 1.9, auto: false,
    parts: [
      G("hand", [
        /* index finger up, one knuckle run, soft palm — few nodes so it
           holds together at 16px under the strike */
        path("M9.2 13.2V5.6C9.2 4.5 10 3.7 11.1 3.7S13 4.5 13 5.6V10.2"),
        path("M13 10.2V9.4C13 8.4 13.8 7.6 14.8 7.6S16.6 8.4 16.6 9.4V10.6C17.7 10.6 18.6 11.5 18.6 12.6V15.4C18.6 18.6 16.4 20.6 13.4 20.6H12.4C10.9 20.6 9.5 20 8.4 18.9L5.6 16.1C4.9 15.4 4.9 14.3 5.6 13.6C6.3 12.9 7.4 12.9 8.1 13.6L9.2 14.6"),
      ]),
      DRAW(path("M20.8 3.2L3.2 20.8"), 0.5, 0.85),
    ],
    gAnims: { hand: DIP(0, 0.7) },
  },

  /* trefoil — three blades that keep sweeping around the core dot */
  radiation: {
    dur: 2.2, auto: false, pp: false,
    parts: [
      circle(12, 12, 1.5, fill()),
      G("spin", [
        /* three equal 60° blades on r 4.4 → 9.2, exact about the core */
        path("M9.8 8.2A4.4 4.4 0 0 1 14.2 8.2L16.6 4A9.2 9.2 0 0 0 7.4 4Z"),
        path("M16.4 12A4.4 4.4 0 0 1 14.2 15.8L16.6 20A9.2 9.2 0 0 0 21.2 12Z"),
        path("M9.8 15.8A4.4 4.4 0 0 1 7.6 12L2.8 12A9.2 9.2 0 0 0 7.4 20Z"),
      ]),
    ],
    gAnims: { spin: tn("rotate", ["0 12 12", "360 12 12"]) },
  },

  /* open blades + dashed cut line — the halves snip toward each other */
  "scissors-line-dashed": {
    dur: 1.8, auto: false,
    parts: [
      G("up", [
        circle(4.8, 8.6, 1.8),
        path("M6.1 14.2L14.6 6.6"),
      ]),
      G("dn", [
        circle(4.8, 15.4, 1.8),
        path("M6.1 9.8L8.8 12M10.6 13.8L14.4 17.6"),
      ]),
      line(17, 12, 17.6, 12),
      line(20.4, 12, 21, 12),
    ],
    gAnims: {
      up: tn("rotate", ["0 9 12", "0 9 12", "7 9 12", "0 9 12", "0 9 12"], HOLD),
      dn: tn("rotate", ["0 9 12", "0 9 12", "-7 9 12", "0 9 12", "0 9 12"], HOLD),
    },
  },

  /* one diagonal strike */
  slash: {
    dur: 1.3,
    parts: [path("M20.6 3.4L3.4 20.6")],
  },

  /* plump spade — twin lobes meeting a stem */
  spade: {
    dur: 1.6,
    parts: [
      path("M12 3.6C13.4 5.2 15 6.9 16.6 8.4C18.5 10.2 20.2 11.9 20.2 14.2C20.2 17 18.2 19 15.6 19C14.2 19 13.1 18.4 12.3 17.4L12 17.1L11.7 17.4C10.9 18.4 9.8 19 8.4 19C5.8 19 3.8 17 3.8 14.2C3.8 11.9 5.5 10.2 7.4 8.4C9 6.9 10.6 5.2 12 3.6Z"),
      SHIFT(path("M12 17.4L12 20.6"), 0, -0.6),
    ],
  },

  /* big A + a check that ticks on low-right */
  "spell-check": {
    dur: 1.7,
    parts: [
      path("M4.2 16.6L9.9 4.8L14.2 13.2"),
      line(6.2, 12.4, 13.4, 12.4),
      DRAW(path("M20.4 14.6L15.2 20.4C14.8 20.9 14.1 20.8 13.8 20.2L12.4 18"), 0.45, 0.85),
    ],
  },

  /* big A + a wavy spellcheck underline that shimmies */
  "spell-check-2": {
    dur: 1.7,
    parts: [
      path("M5.2 15L12 3.4L18.8 15"),
      line(7.6, 11, 16.4, 11),
      /* a wave big enough to stay a wave at 16px: 1.6 tall, 4.8 period */
      SHIFT(path("M4.8 20.2C6 20.2 6 18.6 7.2 18.6S8.4 20.2 9.6 20.2 10.8 18.6 12 18.6 13.2 20.2 14.4 20.2 15.6 18.6 16.8 18.6 18 20.2 19.2 20.2"), 0.6, 0),
    ],
  },

  /* quarter-spline + endpoint handles that pop */
  spline: {
    dur: 1.8, auto: false,
    parts: [
      DRAW(path("M5.6 16.6C5.6 10.4 10.4 5.6 16.6 5.6"), 0.25, 0.75),
      G("p1", [circle(5.4, 18.4, 2.1)]),
      G("p2", [circle(18.6, 5.4, 2.1)]),
    ],
    sAnims: { p1: POP(5.4, 18.4, 1.25), p2: POP(18.6, 5.4, 1.25) },
  },

  /* two overlapping squares easing apart */
  ungroup: {
    dur: 1.7, auto: false,
    parts: [
      G("tl", [rect(3.6, 3.6, 9.6, 7.6, 1.9)]),
      G("br", [rect(10.8, 12.8, 9.6, 7.6, 1.9)]),
    ],
    gAnims: { tl: NUDGE(-0.8, -0.8), br: NUDGE(0.8, 0.8) },
  },

  /* two C-hooks facing off — they tug apart */
  "unlink-2": {
    dur: 1.7, auto: false,
    parts: [
      A(path("M9.4 17.2L7.2 17.2C4.5 17.2 2.9 14.9 2.9 12.2S4.5 7.2 7.2 7.2L9.4 7.2"), [
        tn("translate", ["0 0", "0 0", "-0.9 0", "0 0", "0 0"], HOLD),
      ]),
      A(path("M14.6 7.2L16.8 7.2C19.5 7.2 21.1 9.5 21.1 12.2S19.5 17.2 16.8 17.2L14.6 17.2"), [
        tn("translate", ["0 0", "0 0", "0.9 0", "0 0", "0 0"], HOLD),
      ]),
    ],
  },

  /* ballot standing on the counter, a check lands inside */
  vote: {
    dur: 1.8, auto: false,
    parts: [
      G("box", [
        path("M5 19.2L5 7.4C5 6.3 5.9 5.4 7 5.4L17 5.4C18.1 5.4 19 6.3 19 7.4L19 19.2"),
      ]),
      line(2.9, 19.2, 21.1, 19.2),
      DRAW(path("M8.8 12.4L11.2 14.8L15.6 9.6"), 0.35, 0.75),
    ],
    gAnims: { box: DIP(0, 0.8) },
  },

  /* wallet slab + card groove that dips */
  "wallet-cards": {
    dur: 1.7,
    parts: [
      rect(3.2, 3.4, 17.6, 17.6, 2.6),
      line(3.2, 7.4, 20.8, 7.4),
      SHIFT(path("M3.2 11.6L8.1 11.6C9 11.6 9.7 11.9 10.2 12.5C10.9 13.4 11.4 14.1 12.9 14.1C14.4 14.1 14.9 13.4 15.6 12.5C16.1 11.9 16.8 11.6 17.6 11.6L20.8 11.6"), 0, 0.7),
    ],
  },

  /* open-top wallet with a small card notch */
  "wallet-minimal": {
    dur: 1.6,
    parts: [
      path("M7 7L19 7C20.1 7 21 7.9 21 9L21 19C21 20.1 20.1 21 19 21L5 21C3.9 21 3 20.1 3 19L3 5C3 3.9 3.9 3 5 3L19 3"),
      A(path("M16.4 14.4h.01"), [an("opacity", ["1", "1", "0.25", "1", "1"], HOLD)]),
    ],
  },

  /* ============================ links ============================ */

  /* severed chain — half-hooks drift apart, the strike writes on */
  "link-2-off": {
    dur: 1.8, auto: false,
    parts: [
      A(path("M9 17L7.2 17C4.5 17 3 14.7 3 12.2S4.5 7.2 7.2 7.2L9.4 7.2"), [
        tn("translate", ["0 0", "0 0", "-0.8 0", "0 0", "0 0"], HOLD),
      ]),
      A(path("M15 7.2L16.8 7.2C19.5 7.2 21 9.7 21 12.2C21 13.6 20.4 14.9 19.5 15.9"), [
        tn("translate", ["0 0", "0 0", "0.8 0", "0 0", "0 0"], HOLD),
      ]),
      line(8.4, 12.2, 11.4, 12.2),
      DRAW(path("M3.4 3.4L20.6 20.6"), 0.5, 0.85),
    ],
  },
};
