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
/* soft opacity dip at staggered t0 — marquee dots, indicator lights. */
const PULSE = (t0) => [an("opacity", ["1", "1", "0.25", "1", "1"], [0, t0, +(t0 + 0.12).toFixed(3), +(t0 + 0.26).toFixed(3), 1])];

/* objects-05 — 7 remaining names: every other gap is covered by a
 * running or queued slice. Family shells reused (notebook, pill, tablet)
 * so the new marks sit in the same visual language.
 * Live area [2.5, 21.5], stroke 2, round caps. */

export const icons = {
  /* single bed — narrower pillow + tucked-blanket fold; pillow plumps */
  "bed-single": {
    dur: 1.8,
    parts: [
      path("M4.5 4.5L4.5 19.5"),                       // headboard
      path("M4.5 14.5L20.5 14.5"),                     // mattress
      path("M20.5 9.8L20.5 19.5"),                     // footboard
      SHIFT(path("M6.6 14.5L6.6 12.9C6.6 12.2 7.1 11.7 7.8 11.7L9.4 11.7C10.1 11.7 10.6 12.2 10.6 12.9L10.6 14.5"), 0, -0.6), // pillow
      path("M13.6 14.5L13.6 12.4"),                    // blanket fold
    ],
  },

  /* arrow cursor pointing up-left with motion streaks behind it */
  "mouse-pointer-2": {
    dur: 1.7,
    auto: false,
    parts: [G("cursor", [path("M5 4.5L19.4 11.3C19.9 11.5 19.9 12.1 19.4 12.3L16.3 13.25Q13.2 14.2 12.55 17.15L11.9 20.1C11.7 20.7 11 20.6 10.8 20.1L4.5 5.2C4.3 4.7 4.5 4.3 5 4.5Z")])],
    gAnims: { cursor: tn("translate", ["0 0", "-0.8 -0.8", "0 0"], [0, 0.4, 1]) },
  },

  /* notebook-text + sticker landed via files-05 (slice L) — not repeated
   * here so the name resolves to one glyph. */

  /* construction helmet — dome + wide brim + top ridges; tips its brim */
  "hard-hat": {
    dur: 1.8,
    parts: [
      G("hat", [
        path("M3 18H21"),                                                  // brim
        path("M5.2 18V14.6C5.2 9.8 8.2 6.2 12 6.2S18.8 9.8 18.8 14.6V18"),   // dome
        path("M10 6.6V11.2"),                                              // ridge L
        path("M14 6.6V11.2"),                                              // ridge R
      ]),
    ],
    gAnims: { hat: tn("rotate", ["0 12 18", "0 12 18", "-5 12 18", "3 12 18", "0 12 18"], HOLD) },
  },

  /* landscape frame */
  "rectangle-horizontal": {
    dur: 1.4,
    parts: [rect(2.5, 6, 19, 12, 2.2)],
  },

  /* portrait frame */
  "rectangle-vertical": {
    dur: 1.4,
    parts: [rect(6, 2.5, 12, 19, 2.2)],
  },

  /* landscape frame + marquee dots — the middle dot leads */
  "rectangle-ellipsis": {
    dur: 1.7,
    parts: [
      rect(2.5, 6, 19, 12, 2.2),
      A(circle(8.2, 12, 0.7, fill()), PULSE(0.3)),
      A(circle(12, 12, 0.7, fill()), PULSE(0.38)),
      A(circle(15.8, 12, 0.7, fill()), PULSE(0.46)),
    ],
  },

  /* tablet behind, smartphone in front — phone lifts on the handoff */
  "tablet-smartphone": {
    dur: 1.8,
    parts: [
      rect(3.5, 3.5, 13.5, 17, 2.2),
      line(8.4, 17.8, 11.6, 17.8),
      G("ph", [
        rect(13.5, 10.4, 7, 10.1, 1.7),
        line(15.8, 18.3, 18.2, 18.3),
      ]),
    ],
    gAnims: { ph: DIP(0, -0.8) },
  },

  /* round scored tablet + tilted capsule — capsule rolls */
  tablets: {
    dur: 1.8,
    parts: [
      circle(9.2, 15, 4.8),
      line(5.2, 15, 13.2, 15),
      G("cap", [
        path("M15.4 10.8L20.4 5.8A1.9 1.9 0 0 0 17.7 3.1L12.7 8.1A1.9 1.9 0 0 0 15.4 10.8Z"),
        line(15.2, 8.3, 17.9, 5.6),
      ]),
    ],
    gAnims: { cap: WIG(16.6, 7, 13) },
  },

  /* horizontal crawler — squiggle body, head + eye, whole thing wiggles */
  worm: {
    dur: 1.7,
    parts: [
      G("w", [
        path("M4.3 17.2Q6.8 14 9.3 16.6Q11.8 19.2 14.4 16.4Q16.2 14.6 17.9 15.1"),
        circle(19.4, 15.6, 1.6),
        circle(19.8, 15.2, 0.45, fill()),
      ]),
    ],
    gAnims: { w: tn("rotate", ["0 12 17", "0 12 17", "-5 12 17", "4 12 17", "0 12 17"], HOLD) },
  },
};
