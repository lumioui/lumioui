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
/* caret blink — on, off, on; mostly lit. */
const BLINK = (lo = 0.15) => [an("opacity", ["1", "1", `${lo}`, "1", "1"], [0, 0.42, 0.5, 0.58, 1])];
/* soft opacity dip at staggered t0 — marquee dots, indicator lights. */
const PULSE = (t0) => [an("opacity", ["1", "1", "0.3", "1", "1"], [0, t0, +(t0 + 0.12).toFixed(3), +(t0 + 0.26).toFixed(3), 1])];

/* ui-06 — 82 glyphs: bare circle/square + every compound mark the set was
 * missing. Two shells, one mark language — arrows nudge along their
 * direction, chevrons tip, gauge needle sweeps, scissors snip, dashed
 * edges march, everything else writes itself on (auto draw-on).
 * Live area [2.5, 21.5], stroke 2, round caps. */

/* ---- shared shells ---------------------------------------------------- */
const RING = circle(12, 12, 8.6);
const BOX = rect(3.5, 3.5, 17, 17, 3);

/* ---- shared marks ----------------------------------------------------- */
/* soft arrowheads — curves bow into the shaft, tips keep 45° energy */
const AH_U = "M8.8 11.5C10 10.3 11 9.2 12 8.4C13 9.2 14 10.3 15.2 11.5";
const AH_D = "M8.8 12.5C10 13.7 11 14.8 12 15.6C13 14.8 14 13.7 15.2 12.5";
const AH_R = "M12.5 8.8C13.7 10 14.8 11 15.6 12C14.8 13 13.7 14 12.5 15.2";
const AH_L = "M11.5 8.8C10.3 10 9.2 11 8.4 12C9.2 13 10.3 14 11.5 15.2";
/* corner-arm heads for the diagonal set (square-* only) */
const AH_UR = "M10.8 9.8L14.4 9.6C14.8 9.6 15 9.9 15 10.3L14.8 13.9";
const AH_UL = "M13.2 9.8L9.6 9.6C9.2 9.6 9 9.9 9 10.3L9.2 13.9";
const AH_DR = "M10.8 14.2L14.4 14.4C14.8 14.4 15 14.1 15 13.7L14.8 10.1";
const AH_DL = "M13.2 14.2L9.6 14.4C9.2 14.4 9 14.1 9 13.7L9.2 10.1";
/* chevrons — the open V from the wayfinding family, sized for the shells */
const CHV_D = "M8.8 10.8C10 12 11.1 13.1 12 13.8C12.9 13.1 14 12 15.2 10.8";
const CHV_U = "M8.8 13.2C10 12 11.1 10.9 12 10.2C12.9 10.9 14 12 15.2 13.2";
const CHV_R = "M10.8 8.8C12 10 13.1 11.1 13.8 12C13.1 12.9 12 14 10.8 15.2";
const CHV_L = "M13.2 8.8C12 10 10.9 11.1 10.2 12C10.9 12.9 12 14 13.2 15.2";
/* the family check, a touch bigger */
const CHECK_BIG = "M8 12.6L11 15.5L16.2 9.1";
/* dollar mark — commerce family S, scaled into the shells */
const DOLLAR =
  "M14.4 10.4c-.2-1.2-1.2-2-2.6-2-1.6 0-2.7.9-2.7 2 0 1 .8 1.6 2.7 1.6 2.1 0 3 .8 3 2 0 1.3-1.4 2.1-3 2.1-1.8 0-2.9-.9-3-2.1";
const D_STEM_U = line(11.9, 7.5, 11.9, 8.2);
const D_STEM_D = line(11.9, 15.7, 11.9, 16.4);
/* parking P — the travel family's letterform */
const PARKING = "M10 16.8V9c0-.6.4-1 1-1h2.5c1.7 0 3.1 1.3 3.1 3s-1.4 3-3.1 3H10";
/* power — arc + plunger, scaled into the shells */
const PWR_ARC = "M15.9 10.4a4.5 4.5 0 1 1-7.8 0";
const PWR_STEM = line(12, 7.7, 12, 10.7);
/* the plunger presses down into the arc */
const PWR_DIP = [an("y2", ["10.7", "10.7", "12", "10.7", "10.7"], HOLD)];
/* prohibition diagonal — crosses the shell corner-to-corner */
const NO = line(6.6, 6.6, 17.4, 17.4);
/* user anatomy — head dot + open shoulder arc */
const USER_HEAD = circle(12, 9.4, 2.35);
const USER_BODY = "M7.8 16.7c.6-2.2 2.2-3.4 4.2-3.4s3.6 1.2 4.2 3.4";
const USER_HEAD_R = circle(12, 9.7, 2.6);
const USER_BODY_R = "M7.2 17.3c.7-2.7 2.5-4.1 4.8-4.1s4.1 1.4 4.8 4.1";
/* scissors blades — the family snip, scaled into the shells */
const SC_L = [circle(9.5, 15, 1.35), path("M10.7 14.2C12.4 12.4 14.2 10.1 15.6 8.3")];
const SC_R = [circle(14.5, 15, 1.35), path("M13.3 14.2C11.6 12.4 9.8 10.1 8.4 8.3")];
/* marching dashed ring for the dashed/fading circle family */
const DASH_RING = circle(12, 12, 8.6, {
  "stroke-dasharray": "0.7 3.6",
  "stroke-linecap": "round",
});
/* four broken arcs — the "fading" ring that slowly sweeps */
const FADE_RING = [
  path("M13 3.75a8.4 8.4 0 0 1 5 2.5"),
  path("M20.25 11.7a8.4 8.4 0 0 1-1.5 4.9"),
  path("M10.9 20.2a8.4 8.4 0 0 1-4.5-1.9"),
  path("M3.8 11.3a8.4 8.4 0 0 1 2.3-4.7"),
];
/* square with only its bottom edge dashed — three solid sides */
const BOX_OPEN = path(
  "M20.5 17.6V7.5C20.5 5.7 19.4 4.5 17.6 4.5H6.4C4.6 4.5 3.5 5.7 3.5 7.5V17.6"
);
const DASH_FOOT = line(4.6, 20.3, 19.4, 20.3, {
  "stroke-dasharray": "0.7 3.4",
  "stroke-linecap": "round",
});

export const icons = {
  /* ======================= bare shapes ======================= */

  circle: {
    dur: 1.4,
    parts: [RING],
  },

  square: {
    dur: 1.4,
    parts: [BOX],
  },

  /* ======================= circle compounds ======================= */

  /* arrows ride their own direction — head stays pointed */
  "circle-arrow-down": {
    dur: 1.4,
    parts: [
      RING,
      G("arr", [line(12, 8.2, 12, 15.6), path(AH_D)]),
    ],
    gAnims: { arr: DIP(0, 1.3) },
  },
  "circle-arrow-left": {
    dur: 1.4,
    parts: [
      RING,
      G("arr", [line(8.4, 12, 15.6, 12), path(AH_L)]),
    ],
    gAnims: { arr: DIP(-1.3, 0) },
  },
  "circle-arrow-right": {
    dur: 1.4,
    parts: [
      RING,
      G("arr", [line(8.4, 12, 15.6, 12), path(AH_R)]),
    ],
    gAnims: { arr: DIP(1.3, 0) },
  },
  "circle-arrow-up": {
    dur: 1.4,
    parts: [
      RING,
      G("arr", [line(12, 8.4, 12, 15.9), path(AH_U)]),
    ],
    gAnims: { arr: DIP(0, -1.3) },
  },

  "circle-check-big": {
    dur: 1.45,
    parts: [RING, G("chk", [path(CHECK_BIG)])],
    sAnims: { chk: POP(12, 12.3, 1.18) },
  },

  /* chevrons tip toward their direction */
  "circle-chevron-down": {
    dur: 1.35,
    parts: [RING, G("ch", [path(CHV_D)])],
    gAnims: { ch: DIP(0, 1.1) },
  },
  "circle-chevron-left": {
    dur: 1.35,
    parts: [RING, G("ch", [path(CHV_L)])],
    gAnims: { ch: DIP(-1.1, 0) },
  },
  "circle-chevron-right": {
    dur: 1.35,
    parts: [RING, G("ch", [path(CHV_R)])],
    gAnims: { ch: DIP(1.1, 0) },
  },
  "circle-chevron-up": {
    dur: 1.35,
    parts: [RING, G("ch", [path(CHV_U)])],
    gAnims: { ch: DIP(0, -1.1) },
  },

  /* marching-ants selection ring */
  "circle-dashed": {
    dur: 1.9,
    auto: false,
    pp: false,
    parts: [A(DASH_RING, [an("stroke-dashoffset", ["0", "8.6"])])],
  },

  "circle-divide": {
    dur: 1.4,
    parts: [
      RING,
      circle(12, 8.5, 0.95, fill()),
      line(8, 12, 16, 12),
      circle(12, 15.5, 0.95, fill()),
    ],
  },

  "circle-dollar-sign": {
    dur: 1.5,
    parts: [RING, G("mark", [path(DOLLAR), D_STEM_U, D_STEM_D])],
    sAnims: { mark: POP(12, 12, 1.12) },
  },

  /* dashed ring marches while the hub dot breathes */
  "circle-dot-dashed": {
    dur: 1.9,
    auto: false,
    pp: false,
    parts: [
      A(DASH_RING, [an("stroke-dashoffset", ["0", "8.6"])]),
      A(circle(12, 12, 1.5, fill()), PULSE(0.3)),
    ],
  },

  /* typing dots breathe left to right */
  "circle-ellipsis": {
    dur: 2,
    auto: false,
    parts: [
      RING,
      A(circle(8.9, 12, 0.8, fill()), PULSE(0.14)),
      A(circle(12, 12, 0.8, fill()), PULSE(0.26)),
      A(circle(15.1, 12, 0.8, fill()), PULSE(0.38)),
    ],
  },

  "circle-equal": {
    dur: 1.35,
    parts: [RING, line(8.4, 10.1, 15.6, 10.1), line(8.4, 13.9, 15.6, 13.9)],
  },

  /* fading ring sweeps around while the arrow writes on */
  "circle-fading-arrow-up": {
    dur: 2.1,
    auto: false,
    pp: false,
    parts: [
      G("ring", FADE_RING),
      DRAW(
        path(
          "M12 15.6V8.8M9.2 11.5C10.2 10.5 11.1 9.6 12 8.7C12.9 9.6 13.8 10.5 14.8 11.5"
        ),
        0.4,
        0.75
      ),
    ],
    gAnims: { ring: tn("rotate", ["0 12 12", "360 12 12"]) },
  },

  "circle-fading-plus": {
    dur: 2.1,
    auto: false,
    pp: false,
    parts: [
      G("ring", FADE_RING),
      DRAW(path("M12 9.2V14.8M9.2 12H14.8"), 0.4, 0.75),
    ],
    gAnims: { ring: tn("rotate", ["0 12 12", "360 12 12"]) },
  },

  /* gauge — the needle sweeps left then settles */
  "circle-gauge": { dur: 1.4, auto: true, parts: [
    circle(12, 12, 9.5),
    path("M7.3 15.2a5.6 5.6 0 1 1 9.4 0"),
    path("M12 13.4 14.8 9.8"),
    circle(12, 13.4, 1.1, fill()),
  ] },

  "circle-minus": {
    dur: 1.3,
    parts: [RING, line(8.8, 12, 15.2, 12)],
  },

  /* the crossed circle — slash writes on last */
  "circle-off": {
    dur: 1.5,
    parts: [RING, NO],
  },

  "circle-parking": {
    dur: 1.5,
    parts: [RING, G("p", [path(PARKING)])],
    sAnims: { p: POP(12.5, 12.4, 1.15) },
  },

  "circle-parking-off": {
    dur: 1.6,
    parts: [RING, path(PARKING), NO],
  },

  "circle-percent": {
    dur: 1.5,
    parts: [
      RING,
      line(15.6, 8.4, 8.4, 15.6),
      circle(9.6, 9.6, 1.4),
      circle(14.4, 14.4, 1.4),
    ],
  },

  "circle-plus": {
    dur: 1.3,
    parts: [RING, line(12, 8.8, 12, 15.2), line(8.8, 12, 15.2, 12)],
  },

  /* power — arc writes on, then the plunger presses in */
  "circle-power": {
    dur: 1.9,
    auto: false,
    parts: [
      RING,
      DRAW(path(PWR_ARC), 0.2, 0.55),
      A(line(12, 7.7, 12, 10.7), PWR_DIP),
    ],
  },

  /* ring + a short rising slash inside */
  "circle-slash": {
    dur: 1.45,
    parts: [RING, line(9.5, 14.5, 14.5, 9.5)],
  },

  /* same idea, slash falls the other way */
  "circle-slash-2": {
    dur: 1.45,
    parts: [RING, line(9.5, 9.5, 14.5, 14.5)],
  },

  "circle-stop": {
    dur: 1.5,
    parts: [RING, G("stop", [rect(9.6, 9.6, 4.8, 4.8, 1.1)])],
    sAnims: { stop: POP(12, 12, 1.18) },
  },

  "circle-user": {
    dur: 1.5,
    parts: [RING, USER_HEAD, path(USER_BODY)],
  },

  "circle-user-round": {
    dur: 1.5,
    parts: [RING, USER_HEAD_R, path(USER_BODY_R)],
  },

  "circle-x": {
    dur: 1.4,
    parts: [RING, path("M9.7 9.7L14.3 14.3"), path("M14.3 9.7L9.7 14.3")],
  },

  /* ======================= square compounds ======================= */

  /* heartbeat pulse writes its zigzag */
  "square-activity": {
    dur: 1.6,
    parts: [
      BOX,
      path("M7.7 12.4H9.7L11.3 8.6L13.5 15.6L14.8 12.4H16.3"),
    ],
  },

  "square-arrow-down": {
    dur: 1.4,
    parts: [BOX, G("arr", [line(12, 8.2, 12, 15.6), path(AH_D)])],
    gAnims: { arr: DIP(0, 1.3) },
  },
  "square-arrow-down-left": {
    dur: 1.4,
    parts: [BOX, G("arr", [line(14.5, 9.5, 9.1, 14.9), path(AH_DL)])],
    gAnims: { arr: DIP(-0.95, 0.95) },
  },
  "square-arrow-down-right": {
    dur: 1.4,
    parts: [BOX, G("arr", [line(9.5, 9.5, 14.9, 14.9), path(AH_DR)])],
    gAnims: { arr: DIP(0.95, 0.95) },
  },
  "square-arrow-left": {
    dur: 1.4,
    parts: [BOX, G("arr", [line(8.4, 12, 15.6, 12), path(AH_L)])],
    gAnims: { arr: DIP(-1.3, 0) },
  },
  "square-arrow-right": {
    dur: 1.4,
    parts: [BOX, G("arr", [line(8.4, 12, 15.6, 12), path(AH_R)])],
    gAnims: { arr: DIP(1.3, 0) },
  },
  "square-arrow-up": {
    dur: 1.4,
    parts: [BOX, G("arr", [line(12, 8.4, 12, 15.9), path(AH_U)])],
    gAnims: { arr: DIP(0, -1.3) },
  },
  "square-arrow-up-left": {
    dur: 1.4,
    parts: [BOX, G("arr", [line(14.5, 14.5, 9.1, 9.1), path(AH_UL)])],
    gAnims: { arr: DIP(-0.95, -0.95) },
  },
  "square-arrow-up-right": {
    dur: 1.4,
    parts: [BOX, G("arr", [line(9.5, 14.5, 14.9, 9.1), path(AH_UR)])],
    gAnims: { arr: DIP(0.95, -0.95) },
  },

  "square-asterisk": {
    dur: 1.5,
    parts: [
      BOX,
      line(12, 7.9, 12, 16.1),
      line(8.5, 9.9, 15.5, 14.1),
      line(15.5, 9.9, 8.5, 14.1),
    ],
  },

  /* dashed bottom edge marches; scissors snip above it */
  "square-bottom-dashed-scissors": {
    dur: 1.9,
    auto: false,
    pp: false,
    parts: [
      BOX_OPEN,
      A(line(4.6, 20.3, 19.4, 20.3, {
        "stroke-dasharray": "0.7 3.4",
        "stroke-linecap": "round",
      }), [an("stroke-dashoffset", ["0", "8.2"])]),
      G("lft", [
        circle(9.6, 13.4, 1.25),
        path("M10.7 12.6C12.3 10.9 14 8.6 15.3 7"),
      ]),
      G("rgt", [
        circle(14.4, 13.4, 1.25),
        path("M13.3 12.6C11.7 10.9 10 8.6 8.7 7"),
      ]),
    ],
    gAnims: {
      lft: tn("rotate", ["0 12 9.4", "0 12 9.4", "6 12 9.4", "0 12 9.4", "0 12 9.4"], HOLD),
      rgt: tn("rotate", ["0 12 9.4", "0 12 9.4", "-6 12 9.4", "0 12 9.4", "0 12 9.4"], HOLD),
    },
  },

  /* gantt — three bars offset in time */
  "square-chart-gantt": {
    dur: 1.5,
    parts: [
      BOX,
      line(7.9, 8.7, 13.3, 8.7),
      line(10.2, 12.1, 15.9, 12.1),
      line(7.9, 15.5, 11.5, 15.5),
    ],
  },

  "square-check-big": {
    dur: 1.45,
    parts: [BOX, G("chk", [path(CHECK_BIG)])],
    sAnims: { chk: POP(12, 12.3, 1.18) },
  },

  "square-chevron-down": {
    dur: 1.35,
    parts: [BOX, G("ch", [path(CHV_D)])],
    gAnims: { ch: DIP(0, 1.1) },
  },
  "square-chevron-left": {
    dur: 1.35,
    parts: [BOX, G("ch", [path(CHV_L)])],
    gAnims: { ch: DIP(-1.1, 0) },
  },
  "square-chevron-right": {
    dur: 1.35,
    parts: [BOX, G("ch", [path(CHV_R)])],
    gAnims: { ch: DIP(1.1, 0) },
  },
  "square-chevron-up": {
    dur: 1.35,
    parts: [BOX, G("ch", [path(CHV_U)])],
    gAnims: { ch: DIP(0, -1.1) },
  },

  /* angle brackets, no slash — room is tight */
  "square-code": {
    dur: 1.45,
    parts: [
      BOX,
      path("M9.9 9.5L7.5 12L9.9 14.5"),
      path("M14.1 9.5L16.5 12L14.1 14.5"),
    ],
  },

  /* three solid sides, bottom edge marches */
  "square-dashed-bottom": {
    dur: 1.9,
    auto: false,
    pp: false,
    parts: [
      BOX_OPEN,
      A(DASH_FOOT, [an("stroke-dashoffset", ["0", "8.2"])]),
    ],
  },

  "square-divide": {
    dur: 1.4,
    parts: [
      BOX,
      circle(12, 8.5, 0.95, fill()),
      line(8, 12, 16, 12),
      circle(12, 15.5, 0.95, fill()),
    ],
  },

  "square-dot": {
    dur: 1.4,
    parts: [BOX, G("dot", [circle(12, 12, 1.4, fill())])],
    sAnims: { dot: POP(12, 12, 1.3) },
  },

  "square-equal": {
    dur: 1.35,
    parts: [BOX, line(8.4, 10.1, 15.6, 10.1), line(8.4, 13.9, 15.6, 13.9)],
  },

  /* italic ƒ — curled ascender, crossbar */
  "square-function": {
    dur: 1.5,
    parts: [
      BOX,
      path("M14.7 8.5c-.1-1.2-.9-1.9-1.9-1.9-1.1 0-1.7.7-1.9 1.9l-1.4 7.2c-.2 1.2-1 1.9-2 1.9"),
      line(9.4, 11.5, 14, 11.5),
    ],
  },

  /* kanban — three columns stretch to different depths */
  "square-kanban": {
    dur: 1.8,
    auto: false,
    parts: [
      BOX,
      A(line(8.2, 7.8, 8.2, 12.2), [
        an("y2", ["12.2", "12.2", "14", "12.2", "12.2"], [0, 0.1, 0.34, 0.58, 1]),
      ]),
      A(line(12, 7.8, 12, 14.6), [
        an("y2", ["14.6", "14.6", "16", "14.6", "14.6"], [0, 0.22, 0.46, 0.7, 1]),
      ]),
      A(line(15.8, 7.8, 15.8, 10.4), [
        an("y2", ["10.4", "10.4", "12.6", "10.4", "10.4"], [0, 0.34, 0.58, 0.82, 1]),
      ]),
    ],
  },

  /* three upright books + one leaning */
  "square-library": {
    dur: 1.5,
    parts: [
      BOX,
      line(8.3, 8, 8.3, 16.4),
      line(11.1, 9, 11.1, 16.4),
      line(13.9, 8.2, 13.9, 16.4),
      path("M15.5 8.6L17.2 16"),
    ],
  },

  "square-m": {
    dur: 1.45,
    parts: [BOX, path("M8.4 16.2V8.8L12 13.4L15.6 8.8V16.2")],
  },

  "square-menu": {
    dur: 1.4,
    parts: [
      BOX,
      line(8.2, 9.2, 15.8, 9.2),
      line(8.2, 12, 15.8, 12),
      line(8.2, 14.8, 15.8, 14.8),
    ],
  },

  "square-minus": {
    dur: 1.3,
    parts: [BOX, line(8.8, 12, 15.2, 12)],
  },

  /* the family pointer, scaled in — wanders a step */
  "square-mouse-pointer": {
    dur: 1.6,
    parts: [
      BOX,
      G("cur", [
        path(
          "M8.2 7.9L16.1 11.6C16.3 11.7 16.3 12.1 16.1 12.2L12.7 13.2L12 16.5C11.8 16.8 11.5 16.7 11.3 16.5L7.9 8.3C7.8 8 8.1 7.9 8.2 7.9Z"
        ),
      ]),
    ],
    gAnims: { cur: DIP(0.9, 0.9) },
  },

  "square-parking": {
    dur: 1.5,
    parts: [BOX, G("p", [path(PARKING)])],
    sAnims: { p: POP(12.5, 12.4, 1.15) },
  },

  "square-parking-off": {
    dur: 1.6,
    parts: [BOX, path(PARKING), NO],
  },

  "square-pen": {
    dur: 1.6,
    parts: [
      BOX,
      G("pen", [
        path("M9.4 14.6l.5-1.6 4.6-4.6c.4-.4 1.1-.4 1.5 0s.4 1.1 0 1.5l-4.6 4.6-1.6.5c-.3.1-.5-.2-.4-.4z"),
        path("M13.6 9.6l1.4 1.4"),
      ]),
    ],
    gAnims: { pen: DIP(-0.7, 0.7) },
  },

  "square-percent": {
    dur: 1.5,
    parts: [
      BOX,
      line(15.6, 8.4, 8.4, 15.6),
      circle(9.6, 9.6, 1.4),
      circle(14.4, 14.4, 1.4),
    ],
  },

  "square-pi": {
    dur: 1.5,
    parts: [
      BOX,
      path("M8.6 9.4C8.6 8.8 9.1 8.3 9.7 8.3H14.3C14.9 8.3 15.4 8.8 15.4 9.4"),
      line(10.6, 9.6, 10.6, 16.2),
      line(13.4, 9.6, 13.4, 16.2),
    ],
  },

  /* pilcrow — long right stem, short inner stem, left bowl */
  "square-pilcrow": {
    dur: 1.5,
    parts: [
      BOX,
      path("M16.2 17.4V7.8H11.4"),
      path("M13.4 7.8V12.7"),
      path("M11.4 7.8a2.45 2.45 0 1 0 0 4.9h2"),
    ],
  },

  "square-plus": {
    dur: 1.3,
    parts: [BOX, line(12, 8.8, 12, 15.2), line(8.8, 12, 15.2, 12)],
  },

  "square-power": {
    dur: 1.9,
    auto: false,
    parts: [
      BOX,
      DRAW(path(PWR_ARC), 0.2, 0.55),
      A(line(12, 7.7, 12, 10.7), PWR_DIP),
    ],
  },

  /* radical — check leg runs up into the overbar */
  "square-radical": {
    dur: 1.45,
    parts: [BOX, path("M8.1 12.7L10.3 15.3L13.6 8.3H16.1")],
  },

  /* blades snip at the shared pivot */
  "square-scissors": {
    dur: 1.7,
    auto: false,
    parts: [
      BOX,
      G("lft", SC_L),
      G("rgt", SC_R),
    ],
    gAnims: {
      lft: tn("rotate", ["0 12 10.7", "0 12 10.7", "7 12 10.7", "0 12 10.7", "0 12 10.7"], HOLD),
      rgt: tn("rotate", ["0 12 10.7", "0 12 10.7", "-7 12 10.7", "0 12 10.7", "0 12 10.7"], HOLD),
    },
  },

  "square-sigma": {
    dur: 1.5,
    parts: [
      BOX,
      path("M14.8 9.3V8.2H9.2L12 11.6C12.2 11.8 12.2 12.2 12 12.4L9.2 15.8H14.8V14.7"),
    ],
  },

  "square-slash": {
    dur: 1.45,
    parts: [BOX, line(9.5, 14.5, 14.5, 9.5)],
  },

  /* side-by-side panels ease apart off the divider */
  "square-split-horizontal": {
    dur: 1.7,
    auto: false,
    parts: [
      G("l", [
        path("M9.8 20.4H6.7C5 20.4 4 19.4 4 17.8V6.2C4 4.6 5 3.6 6.7 3.6h3.1"),
      ]),
      G("r", [
        path("M14.2 3.6h3.1C19 3.6 20 4.6 20 6.2v11.6c0 1.6-1 2.6-2.7 2.6h-3.1"),
      ]),
      line(12, 3.6, 12, 20.4),
    ],
    gAnims: { l: DIP(-0.8, 0), r: DIP(0.8, 0) },
  },

  /* stacked panels ease apart vertically */
  "square-split-vertical": {
    dur: 1.7,
    auto: false,
    parts: [
      G("t", [
        path("M3.6 9.8V6.7C3.6 5 4.6 4 6.2 4h11.6c1.6 0 2.6 1 2.6 2.7v3.1"),
      ]),
      G("b", [
        path("M20.4 14.2v3.1c0 1.7-1 2.7-2.6 2.7H6.2c-1.6 0-2.6-1-2.6-2.7v-3.1"),
      ]),
      line(3.6, 12, 20.4, 12),
    ],
    gAnims: { t: DIP(0, -0.8), b: DIP(0, 0.8) },
  },

  "square-square": {
    dur: 1.45,
    parts: [BOX, rect(8.9, 8.9, 6.2, 6.2, 1.4)],
  },

  /* front card + a back sheet peeking top-right */
  "square-stack": {
    dur: 1.5,
    parts: [
      path("M7.6 6.6V5.4c0-1.1.9-2 2-2h8.2c1.1 0 2 .9 2 2v8.2c0 1.1-.9 2-2 2h-1"),
      rect(4.4, 6.8, 13, 13, 2.4),
    ],
  },

  /* prompt draws on, caret blinks */
  "square-terminal": {
    dur: 1.8,
    auto: false,
    parts: [
      BOX,
      DRAW(path("M8.3 9.7L10.5 11.9L8.3 14.1"), 0.2, 0.5),
      A(line(11.8, 14.4, 15.4, 14.4), BLINK()),
    ],
  },

  "square-user": {
    dur: 1.5,
    parts: [BOX, USER_HEAD, path(USER_BODY)],
  },

  "square-user-round": {
    dur: 1.5,
    parts: [BOX, USER_HEAD_R, path(USER_BODY_R)],
  },

  "square-x": {
    dur: 1.4,
    parts: [BOX, path("M9.7 9.7L14.3 14.3"), path("M14.3 9.7L9.7 14.3")],
  },
};
