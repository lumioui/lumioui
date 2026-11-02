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

/* --- border family shared geometry: 17px rounded frame, dashed sides are
 *  hand-drawn segments (never dasharray — the draw-on gesture owns that) --- */
const FRAME = "M6.6 3.5h10.8c1.7 0 3.1 1.4 3.1 3.1v10.8c0 1.7-1.4 3.1-3.1 3.1H6.6c-1.7 0-3.1-1.4-3.1-3.1V6.6c0-1.7 1.4-3.1 3.1-3.1z";
const D_TL = "M3.5 6.6C3.5 4.8 4.8 3.5 6.6 3.5";
const D_TR = "M17.4 3.5c1.8 0 3.1 1.3 3.1 3.1";
const D_BL = "M6.6 20.5c-1.8 0-3.1-1.3-3.1-3.1";
const D_BR = "M20.5 17.4c0 1.8-1.3 3.1-3.1 3.1";
const D_TOP = "M8.6 3.5h2.4M13 3.5h2.4";
const D_BOT = "M8.6 20.5h2.4M13 20.5h2.4";
const D_LEFT = "M3.5 8.6v2.4M3.5 13v2.4";
const D_RIGHT = "M20.5 8.6v2.4M20.5 13v2.4";
const DASH_ALL = D_TL + D_TR + D_BL + D_BR + D_TOP + D_BOT + D_LEFT + D_RIGHT;
const DASH_TOP = D_TL + D_TR + D_TOP + D_LEFT + D_RIGHT;   // bottom edge solid
const DASH_BOT = D_BL + D_BR + D_BOT + D_LEFT + D_RIGHT;   // top edge solid
const DASH_LEFT = D_TL + D_BL + D_TOP + D_BOT + D_LEFT;    // right edge solid
const DASH_RIGHT = D_TR + D_BR + D_TOP + D_BOT + D_RIGHT;  // left edge solid
const EDGE_TOP = "M3.5 7c0-1.9 1.6-3.5 3.5-3.5h10c1.9 0 3.5 1.6 3.5 3.5";
const EDGE_BOT = "M20.5 17c0 1.9-1.6 3.5-3.5 3.5H7c-1.9 0-3.5-1.6-3.5-3.5";
const EDGE_LEFT = "M7 3.5c-1.9 0-3.5 1.6-3.5 3.5v10c0 1.9 1.6 3.5 3.5 3.5";
const EDGE_RIGHT = "M17 3.5c1.9 0 3.5 1.6 3.5 3.5v10c0 1.9-1.6 3.5-3.5 3.5";
const PLUS = "M12 9.7v4.6M9.7 12h4.6";
const TICKS4 = "M12 3.5v1.8M12 18.7v1.8M3.5 12h1.8M18.7 12h1.8";

/* shared corner brackets (scan frame) */
const BRACKETS =
  "M9.4 3.6H6.4a2.6 2.6 0 0 0-2.6 2.6v3M14.6 3.6h3a2.6 2.6 0 0 1 2.6 2.6v3" +
  "M20.2 14.8v3a2.6 2.6 0 0 1-2.6 2.6h-3M9.4 20.4H6.4a2.6 2.6 0 0 1-2.6-2.6v-3";

/* portrait badge card open at bottom-right (id verified variants) */
const ID_CARD_OPEN =
  "M16.6 20.4H7.4a2.9 2.9 0 0 1-2.9-2.9V6.7a2.9 2.9 0 0 1 2.9-2.9h7.8a2.9 2.9 0 0 1 2.9 2.9v6.4";
const ID_CLIP = "M9.7 3.8V2.9c0-.5.4-.9.9-.9h2.4c.5 0 .9.4.9.9v.9";

/* gesture idioms */
const dip = (dx, dy) => tn("translate", ["0 0", `${dx} ${dy}`, "0 0"]);
const throb = (cx, cy, s = 1.18) => ({ pivot: [cx, cy], anim: tn("scale", ["1", `${s}`, "1"]) });
const drawOn = (len, t0 = 0.1, t1 = 0.75) => an("stroke-dashoffset", [String(len), String(len), "0"], [0, t0, t1]);
const shake = (cx, cy, deg = 9) =>
  tn("rotate", [`0 ${cx} ${cy}`, `${-deg} ${cx} ${cy}`, `${deg} ${cx} ${cy}`, `0 ${cx} ${cy}`], [0, 0.22, 0.5, 1]);
/* marching ants — dashed frame segments lit in a clockwise sweep */
const ant = (d, t) => A(path(d), [an("opacity", ["1", "0.3", "1"], [0, t, 1])]);

/* border family: solid sides are real strokes, inactive sides are 2px dots on a
 * 4.25px pitch (reads as a table guide, never stubby dashes). */
const BORDER_FRAME = "M6.7 3.5H17.3a3.2 3.2 0 0 1 3.2 3.2V17.3a3.2 3.2 0 0 1-3.2 3.2H6.7a3.2 3.2 0 0 1-3.2-3.2V6.7a3.2 3.2 0 0 1 3.2-3.2z";
const BP = [3.5, 7.75, 12, 16.25, 20.5];
const bdot = (x, y, t) => A(circle(x, y, 1, fill()), [an("opacity", ["1", "0.25", "1"], [0, t, 1])]);
/* solid: any of top|right|bottom|left|h|v ; cross: dotted inner guides */
function borderParts(solid, cross) {
  const S = new Set(solid), out = [];
  let k = 0;
  const t = () => Math.min(0.12 + (k++) * 0.045, 0.8);
  if (S.has("top")) out.push(line(3.5, 3.5, 20.5, 3.5));
  if (S.has("bottom")) out.push(line(3.5, 20.5, 20.5, 20.5));
  if (S.has("left")) out.push(line(3.5, 3.5, 3.5, 20.5));
  if (S.has("right")) out.push(line(20.5, 3.5, 20.5, 20.5));
  if (S.has("h")) out.push(line(3.5, 12, 20.5, 12));
  if (S.has("v")) out.push(line(12, 3.5, 12, 20.5));
  const cov = (x, y) =>
    (y === 3.5 && S.has("top")) || (y === 20.5 && S.has("bottom")) ||
    (x === 3.5 && S.has("left")) || (x === 20.5 && S.has("right")) ||
    (y === 12 && S.has("h")) || (x === 12 && S.has("v"));
  const pts = [];
  for (const x of BP) { pts.push([x, 3.5]); }
  for (const y of BP.slice(1)) { pts.push([20.5, y]); }
  for (const x of [...BP].reverse().slice(1)) { pts.push([x, 20.5]); }
  for (const y of [...BP].reverse().slice(1, -1)) { pts.push([3.5, y]); }
  for (const [x, y] of pts) if (!cov(x, y)) out.push(bdot(x, y, t()));
  if (cross) {
    for (const [x, y] of [[7.75, 12], [12, 12], [16.25, 12], [12, 7.75], [12, 16.25]]) if (!cov(x, y)) out.push(bdot(x, y, t()));
  }
  return out;
}

export const icons = {
  /* a key reaching two open slots */
  "access": {
    auto: false,
    dur: 1.6,
    parts: [
      G("turn", [
        circle(7, 7, 3.6),
        circle(7, 7, 1.1, fill()),
        path("M7 10.8v8.2"),
        path("M7 16.4h2.2M7 18.8h2.8"),
      ]),
      path("M14.8 5h4.2a2.5 2.5 0 0 1 0 5h-4.2"),
      path("M14.8 14h4.2a2.5 2.5 0 0 1 0 5h-4.2"),
    ],
    gAnims: { turn: tn("rotate", ["0 7 7", "0 7 7", "38 7 7"], [0, 0.2, 1]) },
  },

  /* dynamic wheelchair figure leaning forward over the wheel */
  "accessibility": {
    auto: false,
    pp: false,
    dur: 1.9,
    parts: [
      circle(16.6, 4.9, 1.7),
      path("M9.2 9.6c.9-1.5 2.2-2.1 3.9-1.7l2.8.8c1.4.4 2 1.5 1.5 2.9l-1.7 4"),
      path("M14.4 16.2h2.6c.9 0 1.5.7 1.3 1.5l-1.2 3.2"),
      G("wheel", [path("M13.3 13.8a4.3 4.3 0 1 0 1.7 6.7")]),
    ],
    gAnims: { wheel: tn("rotate", ["0 11.3 17.7", "360 11.3 17.7"]) },
  },

  /* padlock with fingerprint ridges inside */
  "biometric-access": {
    parts: [
      path("M8.3 10V7.6a3.7 3.7 0 0 1 7.4 0V10"),
      path("M7.5 10h9c1.4 0 2.6 1.2 2.6 2.6v4.4c0 1.6-1.3 2.9-2.9 2.9H7.8c-1.6 0-2.9-1.3-2.9-2.9v-4.4c0-1.4 1.2-2.6 2.6-2.6z"),
      A(path("M9.2 16.8v-1.6a2.8 2.8 0 0 1 5.6 0v1.6"), [an("opacity", ["1", "0.3", "1"], [0, 0.3, 1])]),
      A(path("M11.3 17.4v-1.5a.7.7 0 0 1 1.4 0v1.9"), [an("opacity", ["1", "0.3", "1"], [0, 0.55, 1])]),
    ],
    auto: false,
    dur: 1.7,
  },

  /* phone with fingerprint sensor + home bar */
  "biometric-device": {
    parts: [
      path("M8.2 3.4h7.6c1.8 0 3.3 1.5 3.3 3.3v10.6c0 1.8-1.5 3.3-3.3 3.3H8.2c-1.8 0-3.3-1.5-3.3-3.3V6.7c0-1.8 1.5-3.3 3.3-3.3z"),
      A(path("M9.5 13.4v-1.7a2.5 2.5 0 0 1 5 0v1.7"), [an("opacity", ["1", "0.3", "1"], [0, 0.3, 1])]),
      A(path("M11.4 13.8v-1.3a.6.6 0 0 1 1.2 0v1.7"), [an("opacity", ["1", "0.3", "1"], [0, 0.55, 1])]),
      line(11, 17.8, 13, 17.8),
    ],
    auto: false,
    dur: 1.7,
  },

  "border-all01": {
    auto: false,
    dur: 1.6,
    parts: [path(BORDER_FRAME), ...[[7.75, 12], [12, 12], [16.25, 12], [12, 7.75], [12, 16.25]].map(([x, y], i) => bdot(x, y, 0.2 + i * 0.12))],
  },
  "border-all02": {
    auto: false,
    dur: 1.8,
    parts: [G("frame", [path(BORDER_FRAME)])],
    sAnims: { frame: throb(12, 12, 1.05) },
  },
  "border-bottom01": {
    auto: false,
    dur: 1.9,
    parts: borderParts(["bottom"], true),
  },
  "border-bottom02": {
    auto: false,
    dur: 1.9,
    parts: borderParts(["bottom"], false),
  },
  "border-full": {
    auto: false,
    dur: 1.8,
    parts: [path(BORDER_FRAME), G("grid", [line(12, 3.5, 12, 20.5), line(3.5, 12, 20.5, 12)])],
    sAnims: { grid: throb(12, 12, 1.08) },
  },
  "border-horizontal": {
    auto: false,
    dur: 1.9,
    parts: borderParts(["h"], true),
  },
  "border-inner": {
    auto: false,
    dur: 1.9,
    parts: borderParts(["h","v"], false),
  },
  "border-left01": {
    auto: false,
    dur: 1.9,
    parts: borderParts(["left"], true),
  },
  "border-left02": {
    auto: false,
    dur: 1.9,
    parts: borderParts(["left"], false),
  },
  "border-none01": {
    auto: false,
    dur: 1.9,
    parts: borderParts([], true),
  },
  "border-none02": {
    auto: false,
    dur: 1.9,
    parts: borderParts([], false),
  },
  "border-right01": {
    auto: false,
    dur: 1.9,
    parts: borderParts(["right"], true),
  },
  "border-right02": {
    auto: false,
    dur: 1.9,
    parts: borderParts(["right"], false),
  },
  "border-top01": {
    auto: false,
    dur: 1.9,
    parts: borderParts(["top"], true),
  },
  "border-top02": {
    auto: false,
    dur: 1.9,
    parts: borderParts(["top"], false),
  },
  "border-vertical": {
    auto: false,
    dur: 1.9,
    parts: borderParts(["v"], true),
  },

  /* dome camera hanging under a mount bar */
  "cctv": {
    auto: false,
    dur: 1.9,
    parts: [
      path("M4.4 4h15.2a1.8 1.8 0 0 1 0 3.6H4.4a1.8 1.8 0 0 1 0-3.6z"),
      G("pan", [
        path("M4.4 7.6v4c0 4.3 3.4 7.8 7.6 7.8s7.6-3.5 7.6-7.8v-4"),
        circle(12, 13.6, 2.6),
        circle(12, 13.6, 0.8, fill()),
      ]),
    ],
    gAnims: { pan: tn("rotate", ["0 12 7.6", "-9 12 7.6", "9 12 7.6", "0 12 7.6"], [0, 0.3, 0.7, 1]) },
  },

  /* wall-mounted bullet camera tilted down */
    "cctv-camera": { dur: 1.9,
    auto: false,
    parts: [
    path("M3.25 12.49L3.25 17.89"),
    path("M10.25 11.09L9.55 12.79C9.25 13.89 8.75 14.49 8.05 14.99C7.15 15.69 6.35 15.99 3.25 15.99"),
    G("cam", [
      rect(8.85, 5.69, 11.6, 5.8, 2.7),
      circle(18.95, 8.59, 1, { fill: "currentColor", stroke: "none" }),
    ], { transform: "rotate(14 14.55 8.59)" }),
  ],
    gAnims: { cam: tn("rotate", ["14 14.55 8.59", "22 14.55 8.59", "14 14.55 8.59"], [0, 0.45, 1]) } },

  /* dome camera struck through */
  "cctv-off": {
    auto: false,
    dur: 1.5,
    parts: [
      path("M4.4 4h15.2a1.8 1.8 0 0 1 0 3.6H4.4a1.8 1.8 0 0 1 0-3.6z"),
      path("M4.4 7.6v4c0 4.3 3.4 7.8 7.6 7.8s7.6-3.5 7.6-7.8v-4"),
      circle(12, 13.6, 2.6),
      circle(12, 13.6, 0.75, fill()),
      A(line(3.4, 3.4, 20.6, 20.6), [an("opacity", ["1", "0.2", "1"], [0, 0.35, 1])]),
    ],
  },

  /* temple front: pediment, colonnade, steps */
  "court-house": {
    parts: [
      path("M4.6 9.8l7-5.2c.3-.2.5-.2.8 0l7 5.2"),
      path("M5.2 11.1h13.6"),
      path("M7.4 12.2v6.4M12 12.2v6.4M16.6 12.2v6.4"),
      path("M5 18.8h14"),
      path("M3.8 21h16.4"),
      A(circle(12, 7.8, 0.85, fill()), [an("r", ["0.85", "1.3", "0.85"])]),
    ],
    auto: false,
    dur: 1.6,
  },

  /* gavel with ridged head over a strike bar */
    "court-law": { dur: 1.4,
    auto: false,
    parts: [
    G("strike", [
      line(8.35, 5.79, 14.56, 12, { "stroke-width": 3.2 }),
      path("M6.6 7.54L10.11 4.03M12.81 13.76L16.32 10.25"),
      line(10.24, 10.11, 4.03, 16.32),
    ]),
    path("M12.67 19.97L19.96 19.97"),
  ],
    gAnims: { strike: tn("rotate", ["-22 4.03 16.32", "0 4.03 16.32", "-4 4.03 16.32", "0 4.03 16.32"], [0, 0.45, 0.6, 1]) } },

  /* soft skull */
  "danger": {
    parts: [
      path("M12 3.6c-4.3 0-7.4 2.9-7.4 7 0 2.4 1.1 4.3 3 5.5v2.2c0 1 .8 1.9 1.9 1.9h5c1 0 1.9-.9 1.9-1.9v-2.2c1.9-1.2 3-3.1 3-5.5 0-4.1-3.1-7-7.4-7z"),
      A(circle(8.9, 10.9, 1.6), [an("r", ["1.6", "1.6", "0.4", "1.6", "1.6"], [0, 0.05, 0.22, 0.42, 1])]),
      A(circle(15.1, 10.9, 1.6), [an("r", ["1.6", "1.6", "0.4", "1.6", "1.6"], [0, 0.05, 0.22, 0.42, 1])]),
      path("M12 14.2v1.5"),
      path("M10.3 18.2v1.8M13.7 18.2v1.8"),
    ],
    auto: false,
    dur: 1.9,
  },

  /* cipher rails, one knob is a lock, key below */
  "encrypt": {
    auto: false,
    dur: 1.7,
    parts: [
      path("M4.2 3.8v4.4M16 3.8v4.4M20.8 3.8v4.4"),
      A(rect(8.6, 3.6, 2.8, 5, 1.3), [dip("2.4", "0")]),
      circle(6.2, 17.8, 2.7),
      path("M8.9 17.8h10.7"),
      path("M16.4 17.8v2M18.8 17.8v2"),
    ],
  },

  /* hex badge + offset-bar H */
  "hackerrank": {
    parts: [
      path("M12 3.4c.5 0 1 .1 1.4.4l5.2 3.2c1.2.7 1.9 2.5 1.9 4.9s-.7 4.2-1.9 4.9l-5.2 3.2c-.8.5-2 .5-2.8 0l-5.2-3.2c-1.2-.7-1.9-2.5-1.9-4.9s.7-4.2 1.9-4.9l5.2-3.2c.4-.3.9-.4 1.4-.4z"),
      A(path("M9.5 8.2v6.2"), [an("opacity", ["1", "0.3", "1"], [0, 0.25, 1])]),
      A(path("M14.5 9.6v6.2"), [an("opacity", ["1", "0.3", "1"], [0, 0.45, 1])]),
      A(path("M9.5 11.9h5"), [an("opacity", ["1", "0.3", "1"], [0, 0.65, 1])]),
      path("M8.6 8.2h1.8l-.9-1.1z"),
      path("M15.4 15.8h-1.8l.9 1.1z"),
    ],
    auto: false,
    dur: 1.8,
  },

  /* portrait badge with clip tab */
    "id": { dur: 1.6,
    auto: false,
    parts: [
    path("M7.5 5.55L16.5 5.55A2.8 2.8 0 0 1 19.3 8.35L19.3 17.95A2.8 2.8 0 0 1 16.5 20.75L7.5 20.75A2.8 2.8 0 0 1 4.7 17.95L4.7 8.35A2.8 2.8 0 0 1 7.5 5.55Z"),
    path("M10.1 5.55L10.1 4.35C10.1 3.75 10.6 3.25 11.2 3.25L12.8 3.25C13.4 3.25 13.9 3.75 13.9 4.35L13.9 5.55"),
    G("bob", [
      circle(12, 11.95, 2),
      path("M8.2 20.15C9.1 17.75 10.4 16.55 12 16.55S14.9 17.75 15.8 20.15"),
    ]),
  ],
    gAnims: { bob: tn("translate", ["0 0", "0 0.9", "0 0"]) } },

  /* landscape card: person left, lines right */
  "id-card": {
    parts: [
      rect(2.6, 5, 18.8, 14, 2.8),
      G("bob", [circle(9, 10.2, 1.9), path("M5.6 15.8c.8-1.9 2-2.9 3.4-2.9s2.6 1 3.4 2.9")]),
      path("M14.6 9.4h4.2M14.6 12.8h4.2"),
    ],
    auto: false,
    dur: 1.6,
    gAnims: { bob: dip("0", "0.9") },
  },

  /* badge hanging from a lanyard V */
  "id-card-lanyard": {
    parts: [
      path("M7.6 2.4l3.6 4.8M16.4 2.4l-3.6 4.8"),
      circle(12, 8.2, 1),
      G("sway", [
        path("M7.2 10.4h9.6c.7 0 1.2.5 1.2 1.2v7.4c0 1.3-1 2.4-2.4 2.4H9.6c-1.3 0-2.4-1-2.4-2.4v-7.4c0-.7.5-1.2 1.2-1.2z"),
        circle(12, 14.8, 1.6),
        path("M9.4 20.6c.6-1.7 1.5-2.6 2.6-2.6s2 .9 2.6 2.6"),
      ]),
    ],
    auto: false,
    dur: 1.9,
    gAnims: { sway: tn("rotate", ["0 12 8.2", "-7 12 8.2", "6 12 8.2", "0 12 8.2"], [0, 0.3, 0.65, 1]) },
  },

    "id-not-verified": { dur: 1.4,
    auto: false,
    parts: [
    path("M15.52 21.1L6.32 21.1A2.9 2.9 0 0 1 3.42 18.2L3.42 7.4A2.9 2.9 0 0 1 6.32 4.5L14.12 4.5A2.9 2.9 0 0 1 17.02 7.4L17.02 13.8"),
    path("M8.62 4.5L8.62 3.6C8.62 3.1 9.02 2.7 9.52 2.7L11.92 2.7C12.42 2.7 12.82 3.1 12.82 3.6L12.82 4.5"),
    circle(9.72, 10.6, 1.7),
    path("M6.12 15.3C6.92 13.5 8.22 12.6 9.72 12.6S12.52 13.5 13.32 15.3"),
    G("no", [
      circle(16.42, 17.9, 3.4),
      path("M15.02 16.5L17.82 19.3M17.82 16.5L15.02 19.3"),
    ]),
  ],
    gAnims: { no: tn("rotate", ["0 16.42 17.9", "-10 16.42 17.9", "10 16.42 17.9", "0 16.42 17.9"], [0, 0.22, 0.5, 1]) } },

  "id-verified": {
    parts: [
      path(ID_CARD_OPEN),
      path(ID_CLIP),
      circle(10.8, 9.9, 1.7),
      path("M7.2 14.6c.8-1.8 2.1-2.7 3.6-2.7s2.8.9 3.6 2.7"),
      circle(17.5, 17.2, 3.4),
      A(path("M15.9 17.3l1.2 1.3 2.1-2.6", { "stroke-dasharray": 5.2 }), [drawOn(5.2, 0.15, 0.7)]),
    ],
    auto: false,
    dur: 1.5,
  },

  /* person inside scan brackets */
  "identification": {
    parts: [
      G("scan", [path(BRACKETS)]),
      circle(12, 9.7, 1.9),
      path("M7.8 16.8c1-2.3 2.5-3.5 4.2-3.5s3.2 1.2 4.2 3.5"),
    ],
    auto: false,
    dur: 1.7,
    sAnims: { scan: { pivot: [12, 12], anim: tn("scale", ["1", "0.88", "1"]) } },
  },

  /* landscape card, person left, three lines right */
  "identity-card": {
    parts: [
      rect(2.6, 4.6, 18.8, 14.8, 2.8),
      circle(8.6, 9.7, 1.8),
      path("M5.2 15.6c.8-1.9 2-2.9 3.4-2.9s2.6 1 3.4 2.9"),
      A(path("M14.2 8.6h4.6"), [an("d", ["M14.2 8.6h0.1", "M14.2 8.6h0.1", "M14.2 8.6h4.6"], [0, 0.1, 0.5])]),
      A(path("M14.2 12h4.6"), [an("d", ["M14.2 12h0.1", "M14.2 12h0.1", "M14.2 12h4.6"], [0, 0.3, 0.7])]),
      A(path("M14.2 15.4h2.8"), [an("d", ["M14.2 15.4h0.1", "M14.2 15.4h0.1", "M14.2 15.4h2.8"], [0, 0.5, 0.9])]),
    ],
    auto: false,
    dur: 1.8,
  },

  /* landscape card + bottom-right check */
  "identity-card-check": {
    parts: [
      path("M14.6 20.2H7a3 3 0 0 1-3-3V7.6a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v5.2"),
      circle(8.6, 9.9, 1.7),
      path("M5.4 15.2c.8-1.8 1.9-2.7 3.2-2.7s2.4.9 3.2 2.7"),
      path("M14.2 8.8h4.4M14.2 12h4.4"),
      A(path("M14.8 17.2l1.5 1.7 3.3-3.9", { "stroke-dasharray": 7.4 }), [drawOn(7.4, 0.15, 0.7)]),
    ],
    auto: false,
    dur: 1.5,
  },

  /* document + magnifier overlapping the corner */
  "investigation": {
    parts: [
      path("M15.4 20.4H7a3.1 3.1 0 0 1-3.1-3.1V6.3A3.1 3.1 0 0 1 7 3.2h7.2a3.1 3.1 0 0 1 3.1 3.1v7.2"),
      path("M7.4 7.4h6.6M7.4 10.8h4.2"),
      G("lens", [circle(15.8, 15.8, 3.6), line(18.3, 18.3, 21.1, 21.1)]),
    ],
    auto: false,
    dur: 1.7,
    gAnims: { lens: tn("translate", ["0 0", "-0.9 -0.9", "0 0"]) },
  },

  /* scan brackets + iris ring crossed by the scan line */
  "iris-scan": {
    parts: [
      path(BRACKETS),
      circle(12, 12, 4.6),
      circle(12, 12, 1.6, fill()),
      A(line(3.6, 12, 20.4, 12), [tn("translate", ["0 -4", "0 4", "0 -4"])]),
    ],
    auto: false,
    dur: 1.7,
  },

  /* wig, chin, collar tabs, robe flare */
  "judge": {
    parts: [
      G("nod", [
        path("M8.4 12.8c-1 0-1.9-.6-2.3-1.5-.4-.9-.2-1.9.4-2.6-.5-.7-.6-1.6-.2-2.4.5-.9 1.4-1.4 2.4-1.4.5-1.2 1.8-2 3.3-2s2.8.8 3.3 2c1 0 1.9.5 2.4 1.4.4.8.3 1.7-.2 2.4.6.7.8 1.7.4 2.6-.4.9-1.3 1.5-2.3 1.5"),
        path("M8.4 12.8c0 2.6 1.6 4.6 3.6 4.6s3.6-2 3.6-4.6"),
      ]),
      path("M10.5 18l.4 3.2M13.5 18l-.4 3.2"),
      path("M7 14.6l-2.4 2c-.9.8-1.2 1.4-1.4 2.3-.2.9-.2 1.6-.2 2.6M17 14.6l2.4 2c.9.8 1.2 1.4 1.4 2.3.2.9.2 1.6.2 2.6"),
    ],
    auto: false,
    dur: 1.7,
    gAnims: { nod: dip("0", "0.8") },
  },

  /* balance: post, arched beam, two pan bowls */
  "justice-scale01": {
    auto: false,
    dur: 1.9,
    parts: [
      circle(12, 4.2, 1.4),
      path("M12 5.6v15"),
      path("M8.6 20.6h6.8"),
      G("beam", [
        path("M4.6 9c2.2-3 4.6-3.6 7.4-3.6s5.2.6 7.4 3.6"),
        path("M2.6 13.8l2-4.8 2 4.8"),
        path("M2.6 13.8h4c0 1.9-1 3.4-2 3.4s-2-1.5-2-3.4z"),
        path("M17.4 13.8l2-4.8 2 4.8"),
        path("M17.4 13.8h4c0 1.9-1 3.4-2 3.4s-2-1.5-2-3.4z"),
      ]),
    ],
    gAnims: { beam: tn("rotate", ["0 12 4.2", "7 12 4.2", "-6 12 4.2", "0 12 4.2"], [0, 0.3, 0.68, 1]) },
  },
};
