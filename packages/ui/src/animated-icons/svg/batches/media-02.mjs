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
/* slash — the not-allowed bar flashes once (A() on the slash line). */
const SLASH = (x1, y1, x2, y2) => A(line(x1, y1, x2, y2), BLINK(0.15));

/* draw-on for a stroked part inside bespoke-gesture icons (auto:false) —
 * mirrors the default staggered draw gesture, shifted by s0. */
const draw = (part, s0 = 0) => ({
  ...part,
  a: { pathLength: 1, "stroke-dasharray": 1, ...part.a },
  anims: [an("stroke-dashoffset", ["1", "1", "0", "0"], [0, s0, Math.min(s0 + 0.42, 0.92), 1])],
});

/* image interiors */
const swoosh = "M4.5 18.6c2.6-3.2 5.2-6.9 8.5-8.9 1.4-.8 3.1-.4 4.1 1.1l2 2.8";
const zigzag = "M4.4 16.9l3.3-4c.5-.6 1.4-.7 1.9-.1l2.8 3.3 1.7-2c.5-.6 1.3-.6 1.8-.1l3.1 4.1";
const frame = () => rect(3.2, 4.4, 15.8, 15.8, 2.6); // x3.2-19, y4.4-20.2
/* the same frame with one corner opened for a badge (STYLE.md accents):
   strokes stop with 2px of air instead of running under the mark. */
const frameTR = () => path("M11 4.4H5.8c-1.4 0-2.6 1.2-2.6 2.6v10.6c0 1.4 1.2 2.6 2.6 2.6h10.6c1.4 0 2.6-1.2 2.6-2.6V12");
const frameBR = () => path("M12 20.2H5.8c-1.4 0-2.6-1.2-2.6-2.6V7c0-1.4 1.2-2.6 2.6-2.6h10.6c1.4 0 2.6 1.2 2.6 2.6v5");
const ridgeShort = "M4.4 16.9l3.3-4c.5-.6 1.4-.7 1.9-.1l2.8 3.3 1.4-1.6";

/* top-right badges, centered ~(17.7,4.7) over the frame corner */
const badgePlus = [line(17.7, 2.2, 17.7, 7.4), line(15.1, 4.8, 20.3, 4.8)];
const badgeX = [path("M15.9 2.9l3.8 3.9"), path("M19.7 2.9l-3.8 3.9")];
const badgeCheck = [path("M15.4 4.9l1.8 1.9 3.4-4.1")];
const badgeDash = [line(15.2, 4.8, 20.2, 4.8)];
/* arrows at top-right: up = poke out of frame, down = drop in */
const arrowUpTR = [line(17.6, 8.6, 17.6, 2.6), path("M15.4 4.8l2.2-2.2 2.2 2.2")];
const arrowDownTR = [line(17.6, 2.6, 17.6, 8.6), path("M15.4 6.4l2.2 2.2 2.2-2.2")];

/* the sun inside a photo rises a touch (A() on the sun circle) */
const SUNDIP = (cx, cy, r) =>
  A(circle(cx, cy, r), [an("cy", [`${cy}`, `${cy}`, `${cy - 0.9}`, `${cy}`, `${cy}`], HOLD)]);

export const icons = {
  /* ---------- gallery ---------- */
  /* carousel swipe — the center frame slides between its rails */
  "gallery-horizontal": {
    auto: false,
    dur: 1.5,
    parts: [
      line(3.4, 6.8, 3.4, 17.2),
      SHIFT(rect(6.6, 3.9, 10.8, 16.2, 2.6), 1.5, 0),
      line(20.6, 6.8, 20.6, 17.2),
    ],
  },
  /* thumbnails cascade-select left to right */
  "gallery-thumbnails": {
    auto: false,
    dur: 1.6,
    parts: [
      rect(3.2, 3.7, 17.6, 11.2, 2.6),
      A(rect(3.9, 17.3, 3, 3.1, 0.9), [an("opacity", ["1", "1", "0.3", "1", "1"], [0, 0.08, 0.2, 0.34, 1])]),
      A(rect(8.5, 17.3, 3, 3.1, 0.9), [an("opacity", ["1", "1", "0.3", "1", "1"], [0, 0.16, 0.28, 0.42, 1])]),
      A(rect(13.1, 17.3, 3, 3.1, 0.9), [an("opacity", ["1", "1", "0.3", "1", "1"], [0, 0.24, 0.36, 0.5, 1])]),
      A(rect(17.7, 17.3, 3, 3.1, 0.9), [an("opacity", ["1", "1", "0.3", "1", "1"], [0, 0.32, 0.44, 0.58, 1])]),
    ],
  },
  /* carousel swipe — the center frame slides between its rails */
  "gallery-vertical": {
    auto: false,
    dur: 1.5,
    parts: [
      line(6.8, 3.4, 17.2, 3.4),
      SHIFT(rect(3.9, 6.6, 16.2, 10.8, 2.6), 0, 1.5),
      line(6.8, 20.6, 17.2, 20.6),
    ],
  },
  /* the end card settles up against the rails */
  "gallery-vertical-end": {
    auto: false,
    dur: 1.5,
    parts: [
      G("settle", [
        line(6.4, 3.1, 17.6, 3.1),
        line(4.8, 6.2, 19.2, 6.2),
        rect(4.4, 9.4, 15.2, 10.8, 2.6),
      ]),
    ],
    gAnims: { settle: DIP(0, -1.3) },
  },

  /* ---------- instruments / audio ---------- */
  /* a strum rings out of the sound hole */
    "guitar": { dur: 1.5,
    auto: false,
    parts: [
    path("M9.49 9.76C11.29 9.86 12.59 11.06 12.49 12.46C12.39 13.56 11.99 14.46 11.19 14.86C12.09 15.76 12.39 17.06 12.09 18.56C11.79 20.46 9.79 21.76 7.49 21.76C4.79 21.76 3.09 20.06 3.29 18.16C3.39 16.76 4.29 15.56 5.49 14.86C6.09 13.96 6.19 12.56 6.19 11.56C6.39 10.46 7.59 9.66 9.49 9.76Z"),
    A(circle(8.49, 16.26, 1.5), [an("r", ["1.5", "1.5", "1.95", "1.5", "1.5"], [0, 0.3, 0.55, 0.8, 1])]),
    line(5.89, 19.36, 8.29, 20.56),
    line(11.19, 11.96, 18.69, 4.46),
    line(17.69, 3.46, 19.69, 5.46),
  ] },
  /* the headphones bounce onto the ears */
    "headphones": { dur: 1.4, auto: true, parts: [
      path("M4.5 15V12a7.5 7.5 0 0 1 15 0v3"),
      rect(3, 13.5, 4, 6.5, 2),
      rect(17, 13.5, 4, 6.5, 2),
    ] },
  /* the mute x shakes "no" */
  "headphone-mute": { dur: 1.4, auto: true, parts: [
    path("M4.5 15V12a7.5 7.5 0 0 1 11-6.6"),
    rect(3, 13.5, 4, 6.5, 2),
    rect(17, 13.5, 4, 6.5, 2),
    path("M18 4l3.5 3.5M21.5 4 18 7.5"),
  ] },
  "headphone-off": { dur: 1.4, auto: true, parts: [
    path("M4.5 15V12a7.5 7.5 0 0 1 13-5.1M19.5 12v3"),
    rect(3, 13.5, 4, 6.5, 2),
    rect(17, 13.5, 4, 6.5, 2),
    line(3.5, 3.5, 20.5, 20.5),
  ] },
  /* the mic capsule pops — a vocal pickup thump */
  mic01: {
    auto: false,
    dur: 1.5,
    parts: [
      G("cap", [path("M9.4 6.1a2.6 2.6 0 0 1 5.2 0v4.6a2.6 2.6 0 0 1-5.2 0V6.1z")]),
      path("M6.2 10.9a5.8 5.8 0 0 0 11.6 0"),
      line(12, 16.7, 12, 20.2),
    ],
    sAnims: { cap: POP(12, 8.4, 1.12) },
  },
  /* the capture arc breathes — listening */
  mic02: {
    auto: false,
    dur: 1.7,
    parts: [
      path("M9.8 6.5a2.2 2.2 0 0 1 4.4 0v4.2a2.2 2.2 0 0 1-4.4 0V6.5z"),
      A(path("M6.6 10.8a5.4 5.4 0 0 0 10.8 0"), [an("opacity", ["1", "1", "0.35", "1", "1"], HOLD)]),
      line(12, 16.2, 12, 19.6),
      line(9.3, 19.6, 14.7, 19.6),
    ],
  },
  "mic-off01": {
    auto: false,
    parts: [
      path("M9.4 6.1a2.6 2.6 0 0 1 5.2 0v4.6a2.6 2.6 0 0 1-5.2 0V6.1z"),
      path("M6.2 10.9a5.8 5.8 0 0 0 11.6 0"),
      line(12, 16.7, 12, 20.2),
      SLASH(3.6, 3.6, 20.4, 20.4),
    ],
  },
  "mic-off02": {
    auto: false,
    parts: [
      path("M9.8 6.5a2.2 2.2 0 0 1 4.4 0v4.2a2.2 2.2 0 0 1-4.4 0V6.5z"),
      path("M6.6 10.8a5.4 5.4 0 0 0 10.8 0"),
      line(12, 16.2, 12, 19.6),
      line(9.3, 19.6, 14.7, 19.6),
      SLASH(3.6, 3.6, 20.4, 20.4),
    ],
  },

  /* ---------- base images ---------- */
  /* the sun rises over the ridge */
  image01: {
    auto: false,
    pp: false,
    dur: 1.7,
    parts: [frame(), path(swoosh), SUNDIP(8.7, 9, 1.5)],
  },
  /* the photo develops — landscape draws on, sun fades in */
  image02: {
    auto: false,
    dur: 1.9,
    parts: [
      frame(),
      draw(path(zigzag), 0.1),
      A(circle(15.5, 8.4, 1.2, fill()), [an("opacity", ["0", "0", "1", "1"], [0, 0.55, 0.75, 1])]),
    ],
  },
  /* the photo develops — landscape draws on, sun settles */
  image03: {
    auto: false,
    dur: 1.9,
    parts: [
      rect(2.9, 5.6, 18.2, 12.8, 2.6),
      draw(path("M4 16.6l4.2-5.1c.6-.7 1.6-.7 2.2-.1l3.1 3.6 1.9-2.3c.5-.6 1.4-.6 1.9 0l3.4 4"), 0.1),
      SUNDIP(16.9, 8.6, 1.4),
    ],
  },
  /* the front photo lifts off the stack */
  images: {
    auto: false,
    dur: 1.6,
    parts: [
      path("M16.4 9.4V6.8c0-1.9-1.5-3.4-3.4-3.4H6.8c-1.9 0-3.4 1.5-3.4 3.4v5.4c0 1.9 1.5 3.4 3.4 3.4h0.8"),
      G("card", [
        rect(7.6, 9.4, 12.8, 11, 2.4),
        path("M8.7 18.1l2.6-3.1c.5-.6 1.3-.6 1.8-.1l2.2 2.6 1.4-1.7c.5-.5 1.2-.5 1.7 0l1.5 3.1"),
        circle(10.9, 12.4, 1.1),
      ]),
    ],
    gAnims: { card: DIP(0, -1.1) },
  },

  /* ---------- image + badge ---------- */
  "image-add01": {
    auto: false,
    dur: 1.5,
    parts: [frameTR(), path(swoosh), circle(8.7, 9, 1.4, fill()), G("badge", [...badgePlus])],
    sAnims: { badge: POP(17.7, 4.8, 1.2) },
  },
  "image-add02": {
    auto: false,
    dur: 1.5,
    parts: [frameTR(), path(zigzag), circle(8.6, 8.8, 1.2, fill()), G("badge", [...badgePlus])],
    sAnims: { badge: POP(17.7, 4.8, 1.2) },
  },
  "image-delete01": {
    auto: false,
    dur: 1.6,
    parts: [frameTR(), path(swoosh), circle(8.7, 9, 1.4, fill()), G("badge", [...badgeX])],
    gAnims: { badge: WIG(17.8, 4.85, 10) },
  },
  "image-delete02": {
    auto: false,
    dur: 1.6,
    parts: [frameTR(), path(zigzag), circle(8.6, 8.8, 1.2, fill()), G("badge", [...badgeX])],
    gAnims: { badge: WIG(17.8, 4.85, 10) },
  },
  "image-done01": {
    auto: false,
    dur: 1.7,
    parts: [frameTR(), path(swoosh), circle(8.7, 9, 1.4, fill()), draw(badgeCheck[0], 0.35)],
  },
  "image-done02": {
    auto: false,
    dur: 1.7,
    parts: [frameTR(), path(zigzag), circle(8.6, 8.8, 1.2, fill()), draw(badgeCheck[0], 0.35)],
  },
  "image-remove01": {
    auto: false,
    parts: [
      frameTR(),
      path(swoosh),
      circle(8.7, 9, 1.4, fill()),
      A(badgeDash[0], [an("x1", ["15.2", "15.2", "17.7", "15.2", "15.2"], HOLD)]),
    ],
  },
  "image-remove02": {
    auto: false,
    parts: [
      frameTR(),
      path(zigzag),
      circle(8.6, 8.8, 1.2, fill()),
      A(badgeDash[0], [an("x1", ["15.2", "15.2", "17.7", "15.2", "15.2"], HOLD)]),
    ],
  },
  "image-minus": {
    auto: false,
    parts: [
      frameBR(),
      path(ridgeShort),
      circle(8.6, 8.8, 1.2, fill()),
      A(line(15.8, 18.2, 20.6, 18.2), [an("x1", ["15.8", "15.8", "18.2", "15.8", "15.8"], HOLD)]),
    ],
  },
  "image-plus": {
    auto: false,
    dur: 1.5,
    parts: [
      frameBR(),
      path(ridgeShort),
      circle(8.6, 8.8, 1.2, fill()),
      G("plus", [line(18.2, 15.8, 18.2, 20.6), line(15.8, 18.2, 20.6, 18.2)]),
    ],
    sAnims: { plus: POP(18.2, 18.2, 1.2) },
  },
  /* arrow lifts the photo up out of frame */
  "image-up": {
    auto: false,
    dur: 1.5,
    parts: [
      frameBR(),
      path(ridgeShort),
      circle(8.6, 8.8, 1.2, fill()),
      G("arr", [line(18.2, 21, 18.2, 15.4), path("M16 17.6l2.2-2.2 2.2 2.2")]),
    ],
    gAnims: { arr: DIP(0, -1.7) },
  },
  "image-down": {
    auto: false,
    dur: 1.5,
    parts: [
      frameBR(),
      path(ridgeShort),
      circle(8.6, 8.8, 1.2, fill()),
      G("arr", [line(18.2, 15.2, 18.2, 20.8), path("M16 18.6l2.2 2.2 2.2-2.2")]),
    ],
    gAnims: { arr: DIP(0, 1.7) },
  },
  "image-upload": {
    auto: false,
    dur: 1.5,
    parts: [
      frameTR(),
      path(zigzag),
      circle(8.6, 8.8, 1.2, fill()),
      G("arr", [...arrowUpTR]),
    ],
    gAnims: { arr: DIP(0, -1.7) },
  },
  "image-upload01": {
    auto: false,
    dur: 1.5,
    parts: [frameTR(), path(swoosh), circle(8.7, 9, 1.4, fill()), G("arr", [...arrowUpTR])],
    gAnims: { arr: DIP(0, -1.7) },
  },
  "image-download": {
    auto: false,
    dur: 1.5,
    parts: [
      frameTR(),
      path(zigzag),
      circle(8.6, 8.8, 1.2, fill()),
      G("arr", [...arrowDownTR]),
    ],
    gAnims: { arr: DIP(0, 1.7) },
  },
  "image-download02": {
    auto: false,
    dur: 1.5,
    parts: [
      frameTR(),
      path(zigzag),
      circle(8.6, 8.8, 1.2, fill()),
      G("arr", [...arrowDownTR]),
    ],
    gAnims: { arr: DIP(0, 1.7) },
  },

  /* ---------- image variants ---------- */
  /* the loupe tilts in for a closer look */
    "image-actual-size": { dur: 1.7,
    auto: false,
    parts: [
    G("lens", [
      circle(10.8, 10.8, 7.7),
      line(16.5, 16.5, 20.6, 20.6),
    ]),
    path("M7.5 9.7l1.1-.9V14"),
    path("M14.4 9.7l1.1-.9V14"),
    circle(11.1, 9.9, 0.9, { fill: "currentColor", stroke: "none" }),
  ],
    gAnims: { lens: tn("rotate", ["0 10.8 10.8", "0 10.8 10.8", "-9 10.8 10.8", "7 10.8 10.8", "0 10.8 10.8"], [0, 0.3, 0.55, 0.8, 1]) } },
  /* the horizon line breathes */
  "image-composition": {
    auto: false,
    dur: 1.8,
    parts: [
      rect(2.8, 5.8, 18.4, 12.6, 2.6),
      SHIFT(path("M4.4 16.8c2.8-1.4 5.2-3.8 6.8-7 1.1-2.2 3.3-3.2 5.6-2.5"), 0, -0.8),
      circle(16.6, 8.7, 1.4),
    ],
  },
  /* the photo develops inside the oval mask */
  "image-composition-oval": {
    auto: false,
    dur: 1.9,
    parts: [
      ellipse(12, 12, 9.3, 7.4),
      draw(path("M4.7 15.4l2.9-3.5c.5-.6 1.3-.6 1.8-.1l2.6 3 1.6-1.9c.5-.6 1.3-.5 1.8 0l3 3.5"), 0.1),
      A(circle(15.6, 8.1, 1.1, fill()), [an("opacity", ["0", "0", "1", "1"], [0, 0.55, 0.75, 1])]),
    ],
  },
  /* the crop handles pinch in */
  "image-crop": { dur: 1.4, auto: true, parts: [
    path("M6 2.5V18H21.5M2.5 6H18V21.5"),
    path("M8.5 15 11 11.8 13 14.2l1.5-2 1.8 2.8"),
  ] },
  /* the play badge pulses */
  "image-play": {
    auto: false,
    dur: 1.5,
    parts: [
      rect(2.8, 3.4, 14.4, 13.2, 2.5),
      path("M3.9 14.2l3.1-3.8c.5-.6 1.3-.6 1.8-.1l2.5 2.9 1.5-1.8c.5-.6 1.3-.5 1.7 0l1.8 2.2"),
      circle(7.3, 6.9, 1.2),
      G("play", [path("M17.3 13.2l4.2 2.5c.8.5.8 1.6 0 2.1l-4.2 2.5c-.8.5-1.9-.1-1.9-1v-5c0-.9 1.1-1.5 1.9-1.1z")]),
    ],
    sAnims: { play: POP(18.3, 16.3, 1.16) },
  },
  "image-to-video": {
    auto: false,
    dur: 1.5,
    parts: [
      path("M14 11.6V6.1c0-1.8-1.5-3.2-3.2-3.2H5.8C4 2.9 2.6 4.3 2.6 6.1v4c0 1.8 1.4 3.2 3.2 3.2h4.8"),
      path("M3.5 11.7l2.4-2.9c.4-.5 1.1-.5 1.6-.1l1.9 2.2 1-1.2c.4-.5 1.1-.5 1.5-.1l1.2 1.4"),
      circle(5.9, 5.6, 1),
      rect(10.6, 11.6, 10.8, 9.6, 2.4),
      G("play", [path("M14.7 14.6l3.2 1.9c.6.4.6 1.2 0 1.6l-3.2 1.9c-.6.4-1.3-.1-1.3-.8v-3.8c0-.7.7-1.2 1.3-.8z")]),
    ],
    sAnims: { play: POP(16.4, 16.4, 1.16) },
  },
  /* the corner arrows push out — upscaling */
  "image-upscale": {
    auto: false,
    dur: 1.6,
    parts: [
      rect(3.4, 9.4, 11.2, 11.2, 2.4),
      path("M4.6 18.6l2.8-3.2c.5-.5 1.2-.5 1.7 0l1.8 2 1-1.1c.5-.5 1.2-.5 1.7 0l1 1.1"),
      circle(6.9, 12.9, 1.1, fill()),
      G("tr", [line(16.8, 7.2, 20.4, 3.6), path("M15.6 3.6h4.8v4.8")]),
    ],
    gAnims: { tr: DIP(0.9, -0.9) },
  },

  /* ---------- image + state marks ---------- */
  "image-not-found01": {
    auto: false,
    parts: [frame(), path(swoosh), circle(8.7, 9, 1.4, fill()), SLASH(3.6, 3.6, 20.4, 20.4)],
  },
  "image-not-found02": {
    auto: false,
    parts: [frame(), path(zigzag), circle(8.6, 8.8, 1.2, fill()), SLASH(3.6, 3.6, 20.4, 20.4)],
  },
  "image-off": {
    auto: false,
    parts: [
      frame(),
      path("M4.4 16.9l3.3-4c.5-.6 1.4-.7 1.9-.1l2.8 3.3 1.7-2c.5-.6 1.3-.6 1.8-.1l3.1 4.1"),
      circle(8.5, 8.6, 1.3),
      SLASH(3.6, 3.6, 20.4, 20.4),
    ],
  },

  /* ---------- gestures (bespoke) ---------- */
    "image-flip-horizontal": { dur: 1.6,
    auto: false,
    parts: [
    G("flip", [
      path("M10.1 5.87L5.1 10.57C4.5 11.17 4.5 12.27 5.1 12.87L10.1 17.87C10.7 18.47 11.7 18.07 11.7 17.07L11.7 6.67C11.7 5.67 10.7 5.27 10.1 5.87Z"),
      path("M13.9 5.87L18.9 10.57C19.5 11.17 19.5 12.27 18.9 12.87L13.9 17.87C13.3 18.47 12.3 18.07 12.3 17.07L12.3 6.67C12.3 5.67 13.3 5.27 13.9 5.87Z"),
    ]),
  ],
    sAnims: { flip: { pivot: [12, 10.97], anim: tn("scale", ["1 1", "-1 1", "1 1"], [0, 0.5, 1]) } } },
  "image-flip-vertical": {
    dur: 1.6,
    auto: false,
    parts: [
      G("flip", [
        path("M6.9 10.1 11.6 5.1c.6-.6 1.7-.6 2.3 0l5 5c.6.6.2 1.6-.8 1.6H7.7c-1 0-1.4-1-.8-1.6z"),
        path("M6.9 13.9l4.7 5c.6.6 1.7.6 2.3 0l5-5c.6.6.2 1.6-.8 1.6H7.7c-1 0-1.4-1-.8-1.6z"),
      ]),
    ],
    sAnims: { flip: { pivot: [12, 12], anim: tn("scale", ["1 1", "1 -1", "1 1"], [0, 0.5, 1]) } },
  },
  "image-rotation-clockwise": {
    dur: 2.2,
    auto: false,
    parts: [
      draw(rect(10.3, 9, 11.2, 11.2, 2.4)),
      draw(path("M11.4 17.7l2.3-2.7c.5-.6 1.2-.6 1.7-.1l2 2.3 1.3-1.5c.5-.5 1.2-.5 1.6 0l1.2 1.4"), 0.15),
      G("spin", [
        draw(path("M10.1 4.5a4.1 4.1 0 1 0 1 5.2"), 0.25),
        draw(path("M9.6 2.6 10.1 4.5 8.1 4.3"), 0.35),
      ]),
    ],
    gAnims: { spin: tn("rotate", ["0 7.5 7.6", "360 7.5 7.6"]) },
  },
  "image-counter-clockwise": {
    dur: 2.2,
    auto: false,
    parts: [
      draw(rect(2.5, 9, 11.2, 11.2, 2.4)),
      draw(path("M12.6 17.7l-2.3-2.7c-.5-.6-1.2-.6-1.7-.1l-2 2.3-1.3-1.5c-.5-.5-1.2-.5-1.6 0l-1.2 1.4"), 0.15),
      G("spin", [
        draw(path("M13.9 4.5a4.1 4.1 0 1 1 -0.9 5.2"), 0.25),
        draw(path("M14.4 2.6 13.9 4.5 15.9 4.3"), 0.35),
      ]),
    ],
    gAnims: { spin: tn("rotate", ["0 16.5 7.6", "-360 16.5 7.6"]) },
  },
};
