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
export const icons = {
  banana: {
    dur: 1.7,
    auto: false,
    parts: [
      G("hang", [
        path("M6.8 4.6c-2.5.4-3.9 3.6-3.4 7.5.5 4.1 3.5 7.9 8.1 8.9 3.2.7 6.6.3 9-1.6.5-.4.4-1.2-.2-1.5-3.2-1.4-5.5-3.7-6.9-7-.9-2-1.4-4-1.5-6-.1-.7-.9-1.2-1.6-1l-3.5.7z"),
        /* peel ridge */
        path("M8.3 8.6c-.2 2.6.5 5.2 2 7.3"),
        /* belly seam — second contour along the lower edge */
        path("M5.9 13.2c.9 3 3.7 5.9 7.5 6.8"),
        line(6.4, 4.5, 5.6, 3.1),
        /* blossom tip */
        path("M19.3 19.7l1.3-.6"),
      ]),
    ],
    /* swings on its stem tip */
    gAnims: { hang: tn("rotate", ["0 5.8 3.3", "6 5.8 3.3", "-4.5 5.8 3.3", "0 5.8 3.3"], [0, 0.3, 0.65, 1]) },
  },

  "bowling": { dur: 1.4, auto: true, parts: [
    circle(12, 5.4, 2.4, { transform: "translate(8.5 -0.5) scale(0.8)" }),
    path("M10.2 7.6C9 10 8.2 12 8.2 15.2 8.2 18 9.8 20.5 12 20.5s3.8-2.5 3.8-5.3c0-3.2-.8-5.2-2-7.6", { transform: "translate(8.5 -0.5) scale(0.8)" }),
    circle(8, 15.5, 5),
    path("M6.5 14h.01M9.5 14h.01M8 17h.01"),
  ] },

  "bowling-ball": {
    dur: 1.9,
    pp: false,
    auto: false,
    parts: [
      /* finger holes spin: the ball rolls forever */
      G("roll", [
        circle(12, 12, 8.5),
        circle(15.3, 8.3, 1, fill()),
        circle(17.5, 10.6, 1, fill()),
        circle(13.9, 10.9, 1, fill()),
      ]),
    ],
    gAnims: { roll: tn("rotate", ["0 12 12", "360 12 12"]) },
  },

    "bowling-pins": { dur: 1.4, auto: true, parts: [
      circle(12, 5.4, 2.4, { transform: "translate(-3.4 3.4) scale(0.8)" }),
      path("M10.2 7.6C9 10 8.2 12 8.2 15.2 8.2 18 9.8 20.5 12 20.5s3.8-2.5 3.8-5.3c0-3.2-.8-5.2-2-7.6", { transform: "translate(-3.4 3.4) scale(0.8)" }),
      circle(12, 5.4, 2.4, { transform: "translate(7.4 3.4) scale(0.8)" }),
      path("M10.2 7.6C9 10 8.2 12 8.2 15.2 8.2 18 9.8 20.5 12 20.5s3.8-2.5 3.8-5.3c0-3.2-.8-5.2-2-7.6", { transform: "translate(7.4 3.4) scale(0.8)" }),
    ] },

  bread01: {
    dur: 1.7,
    auto: false,
    parts: [
      path("M5.5 18.5c-1.5 1.5-3.5-.5-2.5-2l10-10.5c1.8-1.8 4.5-2.4 5.9-1.4 1.5 1.1 1.5 3.4 0 5.1l-10.4 9.3c-1.2 1.2-2.6 1.4-3.5.5z"),
      /* score marks shimmer down the baguette, heel to tip */
      A(path("M8.2 13.6c.8.3 1.5 1 1.9 1.9"), [
        an("opacity", ["1", "1", "0.3", "1", "1"], [0, 0.15, 0.28, 0.42, 1]),
      ]),
      A(path("M11.7 10.1c.8.3 1.5 1 1.9 1.9"), [
        an("opacity", ["1", "1", "0.3", "1", "1"], [0, 0.32, 0.45, 0.59, 1]),
      ]),
      A(path("M15.2 6.6c.8.3 1.5 1 1.9 1.9"), [
        an("opacity", ["1", "1", "0.3", "1", "1"], [0, 0.49, 0.62, 0.76, 1]),
      ]),
    ],
  },

  "bread02": { auto: false, dur: 1.5,
    parts: [G("toast", [path("M5 20.5V11.6c-1.2-.5-2-1.4-2-2.7C3 6.1 5.4 4 9 4c1.2 0 2.2.4 3 1 .8-.6 1.8-1 3-1 3.6 0 6 2.1 6 4.9 0 1.3-.8 2.2-2 2.7v8.9z")])],
    gAnims: { toast: tn("translate", ["0 0", "0 -1", "0 0"]) } },

  bread03: {
    dur: 1.65,
    auto: false,
    parts: [
      /* dome loaf rocks on the board, scored on top */
      G("loaf", [
        path("M4.5 16c0-5 3.4-9 7.5-9s7.5 4 7.5 9c0 .5-.4 1-1 1H5.5c-.6 0-1-.5-1-1z"),
        /* diagonal scoring */
        path("M8.3 12.8c.3-1.2 1.1-2.1 2.3-2.4"),
        path("M11.4 11.6c.3-1.2 1.1-2.1 2.3-2.4"),
        path("M14.6 12.8c.3-1.2 1.1-2.1 2.3-2.4"),
      ]),
      line(3.5, 18.5, 20.5, 18.5),
      /* heat wisp lifts off the fresh loaf */
      A(path("M16.6 4.4c-.5.7-.5 1.5 0 2.2"), [
        tn("translate", ["0 0", "0 -0.8", "0 0"], [0, 0.4, 1]),
        an("opacity", ["1", "0.35", "1"], [0, 0.4, 1]),
      ]),
    ],
    gAnims: { loaf: tn("rotate", ["0 12 17", "2.8 12 17", "-2.2 12 17", "0 12 17"], [0, 0.3, 0.65, 1]) },
  },

  "bread04": { auto: false, dur: 1.5,
    parts: [G("toast", [path("M5 20.5V11.6c-1.2-.5-2-1.4-2-2.7C3 6.1 5.4 4 9 4c1.2 0 2.2.4 3 1 .8-.6 1.8-1 3-1 3.6 0 6 2.1 6 4.9 0 1.3-.8 2.2-2 2.7v8.9z"), path("M9.2 8.4c.9-.7 1.9-1 2.8-1s1.9.3 2.8 1")])],
    gAnims: { toast: tn("translate", ["0 0", "0 -1", "0 0"]) } },

  cake: {
    dur: 1.65,
    auto: false,
    parts: [
      path("M4.5 13h15c.8 0 1.5.7 1.5 1.5V18c0 1.4-1.1 2.5-2.5 2.5h-13c-1.4 0-2.5-1.1-2.5-2.5v-3.5c0-.8.7-1.5 1.5-1.5z"),
      path("M3.5 13.2c.7.9 1.6 1.4 2.5 1.4 1.2 0 2-1 2-1s.8 1 2 1 2-1 2-1 .8 1 2 1 2-1 2-1 .8 1 2 1c.9 0 1.8-.5 2.5-1.4"),
      /* cherry hops on top */
      G("cherry", [
        circle(12, 8.2, 1.9),
        path("M12.4 6.4c.3-1 .9-1.7 1.8-2.1"),
      ]),
      line(3.5, 20.5, 20.5, 20.5),
    ],
    gAnims: { cherry: tn("translate", ["0 0", "0 -1.7", "0 -1.7", "0 0"], [0, 0.28, 0.58, 1]) },
  },

    "cake-slice": { dur: 1.65,
    auto: false,
    parts: [
    path("M4.85 14.3L16.85 7.6C17.75 7.2 18.55 7.8 18.55 8.7L18.55 17.6C18.55 19 17.45 20.1 16.05 20.1L7.35 20.1C5.95 20.1 4.85 19 4.85 17.6L4.85 14.3Z"),
    line(6.35, 16.9, 18.55, 16.9),
    G("cherry", [
      circle(16.65, 7, 1.7),
      path("M17.15 5.7C17.55 4.8 18.25 4.2 19.15 3.9"),
    ]),
  ],
    gAnims: { cherry: tn("translate", ["0 0", "0 -1.6", "0 -1.6", "0 0"], [0, 0.28, 0.58, 1]) } },

  candy: {
    dur: 1.9,
    pp: false,
    auto: false,
    parts: [
      /* wrapped sweet spins lazily — wrapper ends pinwheel */
      G("spin", [
        path("M8.6 9.2c1.9-.9 4.2-.9 6.1 0 1.3.6 2.1 1.7 2.1 3s-.8 2.4-2.1 3c-1.9.9-4.2.9-6.1 0-1.3-.6-2.1-1.7-2.1-3s.8-2.4 2.1-3z"),
        path("M8.7 9.7l-2.8-1.8c-.8-.5-1.8-.3-2.3.5-.5.7-.3 1.7.4 2.2l2 1.4-2 1.4c-.7.5-.9 1.5-.4 2.2.5.8 1.5 1 2.3.5l2.8-1.8"),
        path("M15.3 9.7l2.8-1.8c.8-.5 1.8-.3 2.3.5.5.7.3 1.7-.4 2.2l-2 1.4 2 1.4c.7.5.9 1.5.4 2.2-.5.8-1.5 1-2.3.5l-2.8-1.8"),
      ]),
    ],
    gAnims: { spin: tn("rotate", ["0 12 12", "360 12 12"]) },
  },

    "candy-cane": { dur: 1.7,
    auto: false,
    parts: [
    G("sway", [
      path("M7.18 20.48C6.58 20.48 6.18 20.08 6.18 19.48L6.18 9.28C6.18 5.68 8.88 2.98 12.28 2.98S18.38 5.68 18.38 9.08C18.38 9.68 17.98 10.08 17.38 10.08L16.08 10.08C15.48 10.08 15.08 9.68 15.08 9.08C15.08 6.98 13.78 5.38 12.18 5.38C10.48 5.38 9.28 6.98 9.28 9.08L9.28 19.68C9.28 20.28 8.88 20.48 8.28 20.48L7.18 20.48Z"),
      line(6.28, 16.48, 9.18, 14.98),
      line(6.28, 12.78, 9.18, 11.28),
      line(9.98, 4.88, 12.08, 6.88),
      line(14.58, 3.98, 17.38, 5.28),
    ]),
  ],
    gAnims: { sway: tn("rotate", ["0 7.18 20.48", "5 7.18 20.48", "-4 7.18 20.48", "0 7.18 20.48"], [0, 0.3, 0.65, 1]) } },

  "candy-off": {
    dur: 1.55,
    auto: false,
    parts: [
      path("M9 9c1.7-1.7 4.3-1.7 6 0s1.7 4.3 0 6-4.3 1.7-6 0-1.7-4.3 0-6z"),
      path("M15.5 8.5c.9-.6 1.6-1.5 2-2.4.3-.7 1.1-.8 1.5-.2.5.8.5 1.8.1 2.6-.4.7-1 1.3-1.7 1.6"),
      path("M8.5 15.5c-.9.6-1.6 1.5-2 2.4-.3.7-1.1.8-1.5.2-.5-.8-.5-1.8-.1-2.6.4-.7 1-1.3 1.7-1.6"),
      /* the strike draws itself on once per loop */
      A(line(4, 4, 20, 20, { pathLength: 1, "stroke-dasharray": 1 }), [
        an("stroke-dashoffset", ["1", "1", "0", "0"], [0, 0.25, 0.62, 1]),
      ]),
    ],
  },

  carrot: {
    dur: 1.65,
    auto: false,
    parts: [
      path("M4.9 19.4c-.7.7-.8 1.6-.1 2.1.6.6 1.6.5 2.1-.1l7.4-7.4c1.5-1.5 1.5-3.9 0-5.4s-3.9-1.5-5.4 0l-4 10.8z"),
      line(7.3, 17, 8.9, 18.6),
      line(11.3, 13, 12.9, 14.6),
      /* greens flutter on the crown */
      G("tops", [
        path("M15 9c.3-1.7 1.2-3.2 2.6-4.2"),
        path("M15.5 9.5c1.5-.8 3.1-1 4.7-.6"),
        path("M14.5 8.5c-.9-1.3-1.3-2.8-1.2-4.3"),
      ]),
    ],
    gAnims: { tops: tn("rotate", ["0 14.8 9", "7 14.8 9", "-5 14.8 9", "0 14.8 9"], [0, 0.3, 0.65, 1]) },
  },

  cheese: {
    dur: 1.6,
    auto: false,
    parts: [
      G("wob", [
        path("M4.6 13.4 18.9 6.7c.9-.4 1.8.3 1.8 1.3v8.5c0 1.4-1.1 2.5-2.5 2.5H7.1c-1.4 0-2.5-1.1-2.5-2.5v-3.1z"),
        circle(13.5, 11.8, 1.7),
        circle(8.6, 14.7, 1.2),
        circle(16.2, 15.7, 1.3),
      ]),
    ],
    /* wedge jiggle, soft-body */
    gAnims: { wob: tn("rotate", ["0 12 13", "3 12 13", "-2.4 12 13", "0 12 13"], [0, 0.3, 0.65, 1]) },
  },

  "cheese-cake01": {
    dur: 1.65,
    auto: false,
    parts: [
      path("M5.5 18c0-5.2 2.9-9 6.5-9s6.5 3.8 6.5 9c0 .6-.4 1-1 1H6.5c-.6 0-1-.4-1-1z"),
      path("M7 12.6c.7 1.2 1.6 1.8 2.5 1.8 1.1 0 1.9-.8 2.5-1.8.6 1 1.4 1.8 2.5 1.8.9 0 1.8-.6 2.5-1.8"),
      G("cherry", [
        circle(12, 5.9, 1.7),
        path("M12.5 4.4c.4-.8 1-1.3 1.8-1.6"),
      ]),
      line(3.5, 20.5, 20.5, 20.5),
    ],
    gAnims: { cherry: tn("translate", ["0 0", "0 -1.6", "0 -1.6", "0 0"], [0, 0.28, 0.58, 1]) },
  },

  "cheese-cake02": {
    dur: 1.65,
    auto: false,
    parts: [
      path("M5 14.5h14c.6 0 1 .4 1 1v2c0 1.4-1.1 2.5-2.5 2.5h-11c-1.4 0-2.5-1.1-2.5-2.5v-2c0-.6.4-1 1-1z"),
      path("M8 9.5h8c.6 0 1 .4 1 1v4H7v-4c0-.6.4-1 1-1z"),
      G("cherry", [
        circle(12, 6.5, 1.7),
        path("M12.5 5c.4-.8 1-1.4 1.9-1.7"),
      ]),
      path("M7.4 12c.6.8 1.3 1.2 2.1 1.2.9 0 1.6-.6 2.5-1.2.9.6 1.6 1.2 2.5 1.2.8 0 1.5-.4 2.1-1.2"),
    ],
    gAnims: { cherry: tn("translate", ["0 0", "0 -1.5", "0 -1.5", "0 0"], [0, 0.28, 0.58, 1]) },
  },

  chef: {
    dur: 1.65,
    auto: false,
    parts: [
      /* toque tips a nod */
      G("toque", [
        path("M8.3 11c-1.9 0-3.5-1.5-3.5-3.4 0-1.6 1.1-3 2.7-3.3C7.9 2.9 9.8 2.6 12 2.6s4.1.3 4.5 1.7c1.6.3 2.7 1.7 2.7 3.3 0 1.9-1.6 3.4-3.5 3.4"),
        line(8.3, 11, 8.3, 13.2),
        line(15.7, 11, 15.7, 13.2),
        path("M8.3 13.2c1.1-.5 2.4-.8 3.7-.8s2.6.3 3.7.8"),
      ]),
      path("M15.7 15.5c0 2.9-1.7 5.3-3.7 5.3s-3.7-2.4-3.7-5.3"),
    ],
    gAnims: { toque: tn("rotate", ["0 12 15.5", "-4 12 15.5", "3 12 15.5", "0 12 15.5"], [0, 0.3, 0.62, 1]) },
  },

  "chef-hat": {
    dur: 1.6,
    auto: false,
    parts: [
      G("puff", [
        /* lobed toque puff */
        path("M6.2 12.8c-2.2-.5-3.7-2.4-3.7-4.7 0-2.4 1.8-4.4 4.2-4.7C7.2 2.7 9.2 2 11.7 2.2c1.6.1 3 .9 3.8 2.2.3.5.7.8 1.3 1 2.1.7 3.6 2.6 3.6 4.8 0 2.1-1.2 3.1-2.6 2.6"),
        /* sides down to the band */
        path("M6.2 12.8v4.4c0 1.7 1.2 3 3.1 3.3 1 .2 1.9.3 2.7.3s1.7-.1 2.7-.3c1.9-.3 3.1-1.6 3.1-3.3v-4.4"),
        /* band seam */
        path("M6.8 17.2c1.7-.7 3.4-1 5.2-1s3.5.3 5.2 1"),
        /* pleat */
        path("M12 4.8c-.5 1.4-.5 2.9 0 4.3"),
      ]),
    ],
    /* hat inflates — the puff rising */
    sAnims: { puff: { pivot: [12, 9], anim: tn("scale", ["1", "1.07", "1", "1"], [0, 0.26, 0.52, 1]) } },
  },

  cherry: {
    dur: 1.7,
    auto: false,
    parts: [
      G("swing", [
        circle(16.5, 16.5, 5),
        circle(7.5, 16, 4.5),
        path("M15.9 12.2c-.8-3.6-.2-6.9 2.1-8.7"),
        path("M8.5 12.2c.3-4.4 3.9-7.5 9.5-8.7"),
        path("M17.8 4c1-1.2 2.5-1.8 4-1.5-.5 1.4-1.6 2.4-3 2.7-.7.2-1.3-.5-1-1.2z"),
      ]),
    ],
    /* the pair swings off the leaf stem junction */
    gAnims: { swing: tn("rotate", ["0 19 3", "5 19 3", "-4 19 3", "0 19 3"], [0, 0.3, 0.65, 1]) },
  },

  chocolate: {
    dur: 1.7,
    auto: false,
    parts: [
      path("M7.5 3.5h9c1.1 0 2 .9 2 2v13c0 1.1-.9 2-2 2h-9c-1.1 0-2-.9-2-2v-13c0-1.1.9-2 2-2z"),
      line(12, 4, 12, 10.5),
      line(5.5, 7.2, 18.5, 7.2),
      /* the snap line flashes — a square breaks off */
      A(path("M5.5 13.5l2.2-1.9 2.2 1.9 2.1-1.9 2.2 1.9 2.2-1.9 2.1 1.9"), [
        an("opacity", ["1", "1", "0.3", "1", "1"], [0, 0.3, 0.42, 0.6, 1]),
      ]),
    ],
  },

  "coffee-beans": {
    dur: 1.75,
    auto: false,
    parts: [
      /* beans tumble — the two beans roll in opposite phase */
      G("b1", [
        ellipse(8, 8.5, 4.6, 3.2, { transform: "rotate(45 8 8.5)" }),
        path("M5.6 6.1c1.9.5 3.8 2.5 4.6 5"),
      ]),
      G("b2", [
        ellipse(16, 15.5, 4.6, 3.2, { transform: "rotate(45 16 15.5)" }),
        path("M13.6 13.1c1.9.5 3.8 2.5 4.6 5"),
      ]),
    ],
    gAnims: {
      b1: tn("rotate", ["0 8 8.5", "16 8 8.5", "0 8 8.5"], [0, 0.4, 1]),
      b2: tn("rotate", ["0 16 15.5", "-16 16 15.5", "0 16 15.5"], [0, 0.4, 1]),
    },
  },

    "coffee01": { dur: 1.6,
    auto: false,
    parts: [
    G("tilt", [
      path("M6.5 7.95L7.5 17.25C7.7 19.05 9.1 20.45 11 20.45L13 20.45C14.9 20.45 16.3 19.05 16.5 17.25L17.5 7.95"),
      line(5.5, 7.95, 18.5, 7.95),
      path("M7.3 7.95L7.8 5.75C8.1 4.55 9.2 3.65 10.5 3.65L13.5 3.65C14.8 3.65 15.9 4.55 16.2 5.75L16.7 7.95"),
      ellipse(12, 13.25, 1.7, 2.2),
      path("M11.3 11.65C12.2 12.55 12.9 13.65 13 14.95"),
    ]),
  ],
    gAnims: { tilt: tn("rotate", ["0 12 20.45", "-4.5 12 20.45", "3.5 12 20.45", "0 12 20.45"], [0, 0.3, 0.62, 1]) } },

  coffee02: {
    dur: 1.7,
    auto: false,
    parts: [
      path("M3.5 9.5h13v1.3c0 4.4-2.2 8.2-5.5 9.7-.8.4-1.7.4-2.5 0-3.3-1.5-5-5.3-5-9.7V9.5z"),
      path("M16.5 11.2h1.5c1.5 0 2.7 1.1 2.7 2.6 0 2-1.3 3.7-3.2 4.2"),
      /* saucer */
      path("M5 21.4c2 .7 4.4 1 7 1s5-.3 7-1"),
      /* steam curls rise and fade, staggered */
      A(path("M7.3 3.2c-.5.8-.5 1.7 0 2.5"), [
        tn("translate", ["0 0", "0 -1", "0 0"], [0, 0.4, 1]),
        an("opacity", ["1", "0.35", "1"], [0, 0.4, 1]),
      ]),
      A(path("M10.3 3.2c-.5.8-.5 1.7 0 2.5"), [
        tn("translate", ["0 0", "0 0", "0 -1", "0 0"], [0, 0.18, 0.6, 1]),
        an("opacity", ["1", "1", "0.35", "1"], [0, 0.18, 0.6, 1]),
      ]),
      A(path("M13.3 3.2c-.5.8-.5 1.7 0 2.5"), [
        tn("translate", ["0 0", "0 0", "0 -1", "0 0"], [0, 0.36, 0.78, 1]),
        an("opacity", ["1", "1", "0.35", "1"], [0, 0.36, 0.78, 1]),
      ]),
    ],
  },

  coffee03: {
    dur: 1.7,
    auto: false,
    parts: [
      rect(4.5, 9.5, 12.5, 10.5, 2.6),
      path("M17 11.5h1.3c1.5 0 2.7 1.2 2.7 2.7s-1.2 2.7-2.7 2.7H17"),
      /* steam wisps stretch up and ease back */
      A(line(8, 3.4, 8, 5.6), [
        an("y1", ["3.4", "3.4", "2.5", "3.4", "3.4"], [0, 0.1, 0.38, 0.62, 1]),
      ]),
      A(line(11, 3.4, 11, 5.6), [
        an("y1", ["3.4", "3.4", "2.5", "3.4", "3.4"], [0, 0.26, 0.54, 0.78, 1]),
      ]),
      A(line(14, 3.4, 14, 5.6), [
        an("y1", ["3.4", "3.4", "2.5", "3.4", "3.4"], [0, 0.42, 0.7, 0.92, 1]),
      ]),
    ],
  },

  coffee04: {
    dur: 1.7,
    auto: false,
    parts: [
      path("M4.5 9.5h13v4c0 3.9-2.9 7-6.5 7s-6.5-3.1-6.5-7v-4z"),
      path("M17.5 10.5h1.2c1.6 0 2.8 1.2 2.8 2.7s-1.2 2.8-2.8 2.8h-1.2"),
      A(line(7.5, 3.4, 7.5, 5.6), [
        an("y1", ["3.4", "3.4", "2.5", "3.4", "3.4"], [0, 0.1, 0.38, 0.62, 1]),
      ]),
      A(line(11, 3.4, 11, 5.6), [
        an("y1", ["3.4", "3.4", "2.5", "3.4", "3.4"], [0, 0.26, 0.54, 0.78, 1]),
      ]),
      A(line(14.5, 3.4, 14.5, 5.6), [
        an("y1", ["3.4", "3.4", "2.5", "3.4", "3.4"], [0, 0.42, 0.7, 0.92, 1]),
      ]),
    ],
  },

  "cook-book": {
    dur: 1.65,
    auto: false,
    parts: [
      path("M4.5 19V5.8C4.5 4.3 5.7 3 7.2 3h9.6c1.5 0 2.7 1.2 2.7 2.8V16"),
      path("M19.5 16H7c-1.4 0-2.5 1.1-2.5 2.5S5.6 21 7 21h12.5"),
      path("M19.5 21c-1.4 0-2.5-1.1-2.5-2.5S18.1 16 19.5 16"),
      /* cover toque stamps on */
      G("cover", [
        path("M9.2 9.8c-1.2-.2-2-1.2-2-2.4 0-1.2.9-2.1 2-2.3.4-1 1.4-1.5 2.8-1.5s2.4.5 2.8 1.5c1.1.2 2 1.1 2 2.3 0 1.2-.8 2.2-2 2.4v3H9.2v-3z"),
        line(9.2, 12.8, 14.8, 12.8),
      ]),
    ],
    sAnims: { cover: { pivot: [11.7, 8.6], anim: tn("scale", ["1", "1.12", "1", "1"], [0, 0.24, 0.5, 1]) } },
  },

  cookie: {
    dur: 1.7,
    auto: false,
    parts: [
      path("M12 3.5c4.7 0 8.5 3.8 8.5 8.5 0 .8-.1 1.6-.3 2.3-.9-.5-2-.4-2.8.3-.2-1.3-1.3-2.3-2.6-2.3-1.5 0-2.7 1.2-2.7 2.7 0 .5.1.9.3 1.3-.9.5-1.5 1.4-1.5 2.5 0 .6.2 1.2.5 1.7-.8.2-1.7.3-2.4.3-2.2 0-4.7-3.8-5.2-8.3C3.8 7.6 7.3 3.5 12 3.5z"),
      /* choc chips catch the light, one after another */
      A(circle(9, 9.3, 1.1, fill()), [
        an("opacity", ["1", "1", "0.3", "1", "1"], [0, 0.15, 0.28, 0.42, 1]),
      ]),
      A(circle(7.6, 13.8, 1.1, fill()), [
        an("opacity", ["1", "1", "0.3", "1", "1"], [0, 0.35, 0.48, 0.62, 1]),
      ]),
      A(circle(12.5, 16.9, 1.1, fill()), [
        an("opacity", ["1", "1", "0.3", "1", "1"], [0, 0.55, 0.68, 0.82, 1]),
      ]),
    ],
  },

  "cooking-pot": {
    dur: 1.5,
    auto: false,
    parts: [
      /* boiling over: the lid rattles twice */
      G("lid", [
        path("M3.5 7.5h17"),
        path("M10 7.5c0-1.5.9-2.7 2-2.7s2 1.2 2 2.7"),
      ]),
      path("M4.5 11.5h15c.6 0 1 .4 1 1v2.5c0 3.3-2.7 6-6 6h-5c-3.3 0-6-2.7-6-6v-2.5c0-.6.4-1 1-1z"),
      line(2.5, 13.5, 4, 13.5),
      line(20, 13.5, 21.5, 13.5),
    ],
    gAnims: { lid: tn("translate", ["0 0", "0 -1", "0 -0.2", "0 -0.8", "0 0"], [0, 0.16, 0.3, 0.44, 0.6]),
    },
  },

  "cup-soda": {
    dur: 1.65,
    auto: false,
    parts: [
      path("M6.8 9.5h10.4l-.9 8.3c-.2 1.9-1.7 3.2-3.6 3.2h-1.4c-1.9 0-3.4-1.3-3.6-3.2l-.9-8.3z"),
      line(5, 9.5, 19, 9.5),
      path("M7.6 9.5l.5-2.7c.3-1.2 1.3-2.1 2.6-2.1h2.6c1.3 0 2.3.9 2.6 2.1l.5 2.7"),
      /* straw sways at the rim */
      A(path("M12.9 9.5l.5-4.4c.1-.9.9-1.6 1.8-1.7l2.3-.2"), [
        tn("rotate", ["0 12.9 9.5", "6 12.9 9.5", "-4.5 12.9 9.5", "0 12.9 9.5"], [0, 0.3, 0.65, 1]),
      ]),
    ],
  },

  cupcake01: {
    dur: 1.6,
    auto: false,
    parts: [
      path("M7.5 12.5c-1.9 0-3.5-1.4-3.5-3.2 0-1.5 1-2.7 2.4-3.1.4-1.5 2.2-2.7 5.6-2.7s5.2 1.2 5.6 2.7c1.4.4 2.4 1.6 2.4 3.1 0 1.8-1.6 3.2-3.5 3.2h-9z"),
      G("cherry", [circle(12, 3.9, 1.5)]),
      path("M7.3 12.5h9.4l-.9 5.8c-.2 1.3-1.3 2.2-2.6 2.2h-2.4c-1.3 0-2.4-.9-2.6-2.2l-.9-5.8z"),
    ],
    sAnims: { cherry: { pivot: [12, 4.6], anim: tn("scale", ["1", "1.2", "1", "1"], [0, 0.24, 0.5, 1]) } },
  },

    "cupcake02": { dur: 1.6,
    auto: false,
    parts: [
    path("M9.35 13.2C7.55 13.2 6.05 11.8 6.05 10.1C6.05 8.6 7.15 7.3 8.65 7C8.95 5 10.25 3.5 12.05 3.2C12.45 3.1 12.85 3.4 12.85 3.8C12.85 5 12.05 5.7 11.35 6.3C10.75 6.8 10.35 7.5 10.55 8.4C11.85 8.8 12.85 10 12.85 11.4C12.85 13.1 11.35 14.5 9.55 14.5L9.35 14.5Z"),
    A(path("M11.35 7.5C12.05 6.2 13.05 5.3 14.35 4.9"), [tn("rotate", ["0 11.35 7.5", "8 11.35 7.5", "-5 11.35 7.5", "0 11.35 7.5"], [0, 0.3, 0.65, 1])]),
    path("M9.15 13.2L17.95 13.2L17.15 18.8C16.95 20 15.95 20.9 14.75 20.9L12.35 20.9C11.15 20.9 10.15 20 9.95 18.8L9.15 13.2Z"),
    line(11.75, 13.9, 12.15, 19.3),
    line(15.35, 13.9, 14.95, 19.3),
  ] },

  cupcake03: {
    dur: 1.6,
    auto: false,
    parts: [
      G("cherry", [
        circle(12, 5.3, 1.8),
        path("M12.6 3.9c.5-.7 1.2-1.1 2-1.2"),
      ]),
      /* frosting piped in three swells */
      path("M5.8 13.5c-.6-2.2.7-4.3 2.7-5 .2-1.9 1.7-3.2 3.5-3.2s3.3 1.3 3.5 3.2c2 .7 3.3 2.8 2.7 5 0 .6-.5 1-1 1H6.8c-.5 0-1-.4-1-1z"),
      path("M6.8 14.5h10.4l-1 4.8c-.2 1.2-1.3 2.2-2.6 2.2h-3.2c-1.3 0-2.4-1-2.6-2.2l-1-4.8z"),
    ],
    sAnims: { cherry: { pivot: [12, 5.9], anim: tn("scale", ["1", "1.18", "1", "1"], [0, 0.24, 0.5, 1]) } },
  },

  "dish-washer": { dur: 1.4, auto: true, parts: [
    rect(3.5, 3.5, 17, 17, 3),
    path("M3.5 8H20.5"),
    path("M6.8 5.75h.01M10 5.75h.01"),
    circle(12, 14, 3.6),
  ] },

  dish01: {
    dur: 1.75,
    auto: false,
    parts: [
      /* cloche lifts to reveal, hovers, sets back down */
      G("lid", [
        path("M4 16.5c0-4.7 3.6-8.5 8-8.5s8 3.8 8 8.5"),
        line(12, 8, 12, 6.6),
        circle(12, 5.6, 1.1),
      ]),
      line(2.8, 16.5, 21.2, 16.5),
      path("M4.6 16.5l.7 2.4c.3.9 1.1 1.6 2.1 1.6h9.2c1 0 1.8-.7 2.1-1.6l.7-2.4"),
    ],
    gAnims: { lid: tn("translate", ["0 0", "0 -1.7", "0 -1.7", "0 0"], [0, 0.3, 0.62, 1]) },
  },

  dish02: {
    dur: 1.65,
    auto: false,
    parts: [
      /* fork dips toward the plate */
      G("fork", [
        path("M8.5 3.5v4c0 2.5-1.6 4-3 4s-3-1.5-3-4v-4"),
        line(5.5, 3.5, 5.5, 8),
        line(5.5, 11.5, 5.5, 20.5),
      ]),
      path("M20.5 7c-2.6 0-4.7 2.2-4.7 5s2.1 5 4.7 5"),
      path("M20.5 3.2c-4.9 0-8.8 3.9-8.8 8.8s3.9 8.8 8.8 8.8"),
    ],
    gAnims: { fork: tn("rotate", ["0 5.5 20.5", "6 5.5 20.5", "-4 5.5 20.5", "0 5.5 20.5"], [0, 0.3, 0.62, 1]) },
  },

  drink: {
    auto: false,
    dur: 1.7,
    parts: [
      path("M4.5 6.5h15l-6.1 6.8c-.8.9-2 .9-2.8 0l-6.1-6.8z"),
      line(12, 14, 12, 20),
      line(8.5, 20, 15.5, 20),
      G("garn", [circle(18.6, 6, 2.4)]),
    ],
    gAnims: { garn: DIP(0, 0.9) },
  },

  "glass-water": {
    auto: false,
    dur: 1.9,
    parts: [
      path("M6.5 3.5h11l-1.1 14.5c-.2 1.9-1.7 3.5-3.6 3.5h-1.6c-1.9 0-3.4-1.6-3.6-3.5L6.5 3.5z"),
      SHIFT(path("M7.5 10.5c1-.9 2.1-1.3 3.2-1.3 1.2 0 2.2.5 3 1 .8.5 1.8 1 2.8 1"), 0.9, 0),
    ],
  },

  glasses: {
    auto: false,
    dur: 1.8,
    parts: [
      G("specs", [
        path("M3.5 15c0-1.1.9-2 2-2h2.5c1.9 0 3.5 1.6 3.5 3.5v1c0 1.7-1.3 3-3 3H6.5c-1.7 0-3-1.3-3-3v-2.5z"),
        path("M20.5 15c0-1.1-.9-2-2-2H16c-1.9 0-3.5 1.6-3.5 3.5v1c0 1.7 1.3 3 3 3h2c1.7 0 3-1.3 3-3v-2.5z"),
        path("M11.5 16c.1-1 .3-1.7.5-1.7s.4.7.5 1.7"),
        path("M3.5 15 5.8 6.8c.3-1 1.2-1.6 2.2-1.4"),
        path("M20.5 15l-2.3-8.2c-.3-1-1.2-1.6-2.2-1.4"),
      ]),
    ],
    gAnims: { specs: DIP(0, 0.9) },
  },

  grape: {
    auto: false,
    dur: 1.9,
    parts: [
      G("bunch", [
        circle(7, 10.5, 2.4),
        circle(12, 10.5, 2.4),
        circle(17, 10.5, 2.4),
        circle(9.5, 14.8, 2.4),
        circle(14.5, 14.8, 2.4),
        circle(12, 19, 2.4),
      ]),
      path("M12 8.1V6.5c0-1.9-1.4-3.4-3.3-3.5"),
      path("M12.4 6.8c.4-2 1.9-3.6 3.9-4.1.6-.1 1.1.4 1 .9-.5 1.9-1.9 3.3-3.8 3.7-.5.1-1-.2-1.1-.5z"),
    ],
    gAnims: { bunch: WIG(12, 8.5, 7) },
  },

  /* rolled crescent — two seams mark the laminations, settles once */
  croissant: {
    auto: false,
    dur: 1.9,
    parts: [
      G("roll", [
        path("M4.4 15.2c-1-.8-1.6-2-1.4-3.4.4-2.8 2.7-4.8 5.8-5 1.2-.6 4.4-.6 5.6 0 3.1.2 5.4 2.2 5.8 5 .2 1.4-.4 2.6-1.4 3.4-.8.6-1.9.5-2.6-.2-.7-.7-1.5-.9-2.2-.4-1 .7-2.4.9-3.6.9-1.2 0-2.6-.2-3.6-.9-.7-.5-1.5-.3-2.2.4-.7.7-1.8.8-2.6.2z"),
        path("M8.6 6.9c.9 1.9 1 4.4.3 6.7"),
        path("M15.4 6.9c-.9 1.9-1 4.4-.3 6.7"),
      ]),
    ],
    gAnims: { roll: DIP(0, -1) },
  },

  /* sesame dome, patty line, wavy lettuce — the stack compresses once */
  burger: {
    auto: false,
    dur: 1.8,
    parts: [
      G("stack", [
        path("M4.6 10.8c0-3.5 3.3-6 7.4-6s7.4 2.5 7.4 6H4.6z"),
        path("M8.2 7.6l.7-.4M11.7 7l.7-.4M15.4 7.6l.7-.4"),
        path("M4 13.4h16"),
        path("M4.6 16.2c1.2.9 2.4.9 3.6 0s2.4-.9 3.6 0 2.4.9 3.6 0 2.4-.9 3.6 0"),
        path("M4.9 19.6c-.3-1.4.7-2.6 2.1-2.6h10c1.4 0 2.4 1.2 2.1 2.6H4.9z"),
      ]),
    ],
    gAnims: { stack: DIP(0, 0.9) },
  },

  /* fry carton with the scoop front — the sticks sway as one bunch */
  "french-fries": {
    auto: false,
    dur: 1.9,
    parts: [
      G("fries", [
        path("M8.2 10.8V5.4"),
        path("M11.2 10.8V3.6"),
        path("M14.2 10.8V4.8"),
        path("M16.8 10.8V6.6"),
      ]),
      path("M4.8 10.8l.8 8.6c.1 1.2 1 2 2.2 2h8.4c1.2 0 2.1-.8 2.2-2l.8-8.6"),
      path("M4.8 10.8c2 1.4 4.5 2.2 7.2 2.2s5.2-.8 7.2-2.2"),
    ],
    gAnims: { fries: WIG(12.4, 11, 4) },
  },

  /* sausage pokes past both bun halves, mustard zigzags on top */
  "hot-dog": {
    auto: false,
    dur: 1.8,
    parts: [
      G("dog", [
        path("M5.2 12.4c0-3 3-5.2 6.8-5.2s6.8 2.2 6.8 5.2"),
        path("M5.2 15.6c0 3 3 5.2 6.8 5.2s6.8-2.2 6.8-5.2"),
        ellipse(12, 14, 8.4, 1.9),
        path("M7.4 14c.9-.8 1.8-.8 2.7 0s1.8.8 2.7 0 1.8-.8 2.7 0 1.8.8 2.6.2"),
      ]),
    ],
    gAnims: { dog: WIG(12, 14, 4) },
  },

  /* hard shell with three filling bumps peeking over the rim */
  taco: {
    auto: false,
    dur: 1.8,
    parts: [
      path("M4 17.4c0-5.6 3.6-10.2 8-10.2s8 4.6 8 10.2H4z"),
      G("fill", [
        path("M6.7 11a1.7 1.7 0 0 1 3.4 0"),
        path("M10.3 9.8a1.7 1.7 0 0 1 3.4 0"),
        path("M13.9 11a1.7 1.7 0 0 1 3.4 0"),
      ]),
    ],
    gAnims: { fill: DIP(0, -0.8) },
  },

  /* greens mound settled into a shallow bowl */
  "salad-bowl": {
    auto: false,
    dur: 1.9,
    parts: [
      G("greens", [
        path("M6.2 12.6c-.6-1.9.1-3.8 1.8-4.7.3-1.8 1.9-3.2 3.8-3.2 1 0 1.9.4 2.6 1 1.6-.5 3.4.1 4.4 1.6 1 1.4 1.3 3.4.8 5.3"),
      ]),
      path("M3.4 12.6h17.2c0 4.4-3.8 8-8.6 8s-8.6-3.6-8.6-8z"),
    ],
    gAnims: { greens: DIP(0, 0.8) },
  },

  /* chopsticks hold two strands over a steaming bowl */
  "noodles": { dur: 1.4, auto: true, parts: [
    path("M3.5 12h17c0 4.5-3.5 8-8.5 8s-8.5-3.5-8.5-8Z"),
    path("M9.5 8.5 17 3.5M13 9l6-4.2"),
    path("M6.5 15.2c1.2-1.4 2.4-1.4 3.6 0s2.4 1.4 3.6 0 2.4-1.4 3.6 0"),
  ] },

  /* two maki rolls — big front roll flashes its filling */
  "sushi": { dur: 1.4, auto: true, parts: [
    path("M5 14.5h14v3.5a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2Z"),
    path("M4.5 14.5C4.5 10.5 8 8 12 8s7.5 2.5 7.5 6.5"),
    path("M9 9.2v5.3M12 8.4v6.1M15 9.2v5.3"),
  ] },

  /* ring donut with sprinkle dashes — gentle rock */
  donut: {
    auto: false,
    dur: 1.9,
    parts: [
      G("donut", [
        circle(12, 12.6, 8.2),
        circle(12, 12.6, 2.7),
        path("M8.2 8.6l1-.6M15 8.2l1-.5M16.9 12.4l1-.2M7.2 14.8l1 .4M13.6 17.4l1 .3"),
      ]),
    ],
    gAnims: { donut: WIG(12, 12.6, 5) },
  },

  /* twisted heart loop with the crossed strands */
  "pretzel": { dur: 1.4, auto: true, parts: [
    path("M12 20.5c-5 0-8-2.8-8-6.5C4 9.5 7 5 9.5 5c1.7 0 2.5 1.2 2.5 2.7 0 2-1.8 3.7-4 5M12 20.5c5 0 8-2.8 8-6.5C20 9.5 17 5 14.5 5c-1.7 0-2.5 1.2-2.5 2.7 0 2 1.8 3.7 4 5"),
  ] },

  /* oval with tip nubs and one leaf that flickers */
  lemon: {
    auto: false,
    dur: 1.8,
    parts: [
      path("M2.8 12.4s1.7-.4 2.8-2C6.9 8.4 9.2 7 12 7s5.1 1.4 6.4 3.4c1.1 1.6 2.8 2 2.8 2s-1.7.4-2.8 2c-1.3 2-3.6 3.4-6.4 3.4s-5.1-1.4-6.4-3.4c-1.1-1.6-2.8-2-2.8-2z"),
      path("M8.6 14.6c.9.8 2 1.2 3.4 1.2"),
      G("leaf", [path("M12 7c.2-2 1.7-3.4 3.7-3.3-.1 1.9-1.8 3.4-3.7 3.3z")]),
    ],
    gAnims: { leaf: WIG(14, 7, 8) },
  },

  /* seed flecks blink under a zigzag calyx cap */
  strawberry: {
    auto: false,
    dur: 1.9,
    parts: [
      path("M5.2 10.4c0-1.9 1.5-3.4 3.4-3.4h6.8c1.9 0 3.4 1.5 3.4 3.4 0 4-3 7.9-6.8 9.9-3.8-2-6.8-5.9-6.8-9.9z"),
      G("cap", [
        path("M6.4 9.2l2.3-1.9 1.7 1.9 1.6-1.9 1.6 1.9 1.7-1.9 2.3 1.9"),
        path("M12 5.6V3.6"),
      ]),
      path("M8.9 12.6v.6M12 14.8v.6M15.1 12.6v.6"),
    ],
    gAnims: { cap: DIP(0, -0.9) },
  },

  /* wedge slice: rind arc, flesh arc, seed ticks that blink */
  watermelon: {
    auto: false,
    dur: 1.8,
    parts: [
      path("M3.8 7.6h16.4"),
      path("M20.2 7.6a8.2 8.2 0 0 1-16.4 0"),
      path("M17.6 7.6a5.6 5.6 0 0 1-11.2 0"),
      A(path("M9.4 10.8v.5M12 12v.5M14.6 10.8v.5"), BLINK(0.25)),
    ],
  },

  /* cross-hatched body, crown spikes sway */
  pineapple: {
    auto: false,
    dur: 1.9,
    parts: [
      path("M12 9c2.6 0 4.4 2.5 4.4 5.7s-1.8 5.7-4.4 5.7-4.4-2.5-4.4-5.7S9.4 9 12 9z"),
      path("M9.2 11.8l5.6 4.4M14.8 11.8l-5.6 4.4"),
      G("crown", [
        path("M10 9l-1.6-4.2"),
        path("M12 8.8V3.6"),
        path("M14 9l1.6-4.2"),
      ]),
    ],
    gAnims: { crown: WIG(12, 9, 6) },
  },

  /* pear profile, pit pops once */
  avocado: {
    auto: false,
    dur: 1.8,
    parts: [
      path("M12 3.8c2.4 0 3.7 1.6 4 3.6 2.1 1.2 3.4 3.5 3.4 6 0 3.9-3.3 6.6-7.4 6.6s-7.4-2.7-7.4-6.6c0-2.5 1.3-4.8 3.4-6 .3-2 1.6-3.6 4-3.6z"),
      G("pit", [circle(12, 14.2, 3)]),
    ],
    sAnims: { pit: POP(12, 14.2, 1.15) },
  },

  /* squashed sphere, calyx brow + curved stem */
  tomato: {
    auto: false,
    dur: 1.8,
    parts: [
      ellipse(12, 13.8, 8, 6.4),
      G("top", [
        path("M12 8c0-1.4.8-2.6 2-3"),
        path("M8.2 9.4c1.2-.9 2.7-1.2 3.8-.7 1.1-.5 2.6-.2 3.8.7"),
      ]),
    ],
    gAnims: { top: WIG(12, 9, 5) },
  },

  /* cob with kernel ticks, husk leaves peel a touch */
  corn: {
    auto: false,
    dur: 1.9,
    parts: [
      path("M12 4.2c1.9 0 3.3 2.5 3.3 6.6s-1.4 6.6-3.3 6.6-3.3-2.5-3.3-6.6 1.4-6.6 3.3-6.6z"),
      path("M10.5 9.2v.5M13.5 9.2v.5M10.5 11.8v.5M13.5 11.8v.5M10.5 14.4v.5M13.5 14.4v.5"),
      path("M9 8.2c-2.4 1.6-3.3 4.2-2.6 7.2.6 2.5 2.4 4.1 5.6 4.6"),
      path("M15 8.2c2.4 1.6 3.3 4.2 2.6 7.2-.6 2.5-2.4 4.1-5.6 4.6"),
    ],
  },

  /* tapered pod with stem, tip pointing bottom-left */
  "chili-pepper": {
    auto: false,
    dur: 1.9,
    parts: [
      path("M19.2 8.4c1.5 3.7.3 7.9-3 10.6-3.4 2.7-8.2 3.1-11.5.8-1-.7-1.2-1.9-.5-2.8 1.9-2.4 3-5.5 3.2-8.7.2-2.4 2.1-4.3 4.5-4.2 3.2.1 6.2 1.8 7.3 4.3z"),
      path("M17.6 7.8c.8-1.6 2.2-2.7 3.9-2.9"),
      path("M14 5.4c1.6-1 3.6-1 5 .2-.6 1.7-2.1 2.8-3.9 2.9"),
    ],
  },

  /* cup with hanging tea bag, twin steam wisps */
  "tea-cup": {
    auto: false,
    dur: 1.9,
    parts: [
      path("M4.6 10h11.4v4c0 3.1-2.5 5.6-5.6 5.6h-.2c-3.1 0-5.6-2.5-5.6-5.6v-4z"),
      path("M16 11.2h1.2c1.5 0 2.6 1.2 2.6 2.6s-1.1 2.6-2.6 2.6h-1.4"),
      path("M3.4 21.4h14.4"),
      path("M9.6 10v3l1.7 1.4 1.7-1.4v-3"),
      A(path("M7.6 7c0-1 .8-1.4.8-2.4"), [
        tn("translate", ["0 0", "0 -0.9", "0 0"], [0, 0.4, 1]),
      ]),
      A(path("M10.6 7c0-1 .8-1.4.8-2.4"), [
        tn("translate", ["0 0", "0 0", "0 -0.9", "0 0"], [0, 0.25, 0.65, 1]),
      ]),
    ],
  },

  /* tapered glass, juice line, bent straw, orange wheel on the rim */
  juice: {
    auto: false,
    dur: 1.8,
    parts: [
      path("M6.4 8.8l.9 10.4c.1 1 .9 1.8 2 1.8h5.4c1.1 0 1.9-.8 2-1.8l.9-10.4H6.4z"),
      path("M7.1 13h9.8"),
      path("M11.8 12.6L13.4 3.4h3"),
      circle(17.8, 8.8, 2.6),
    ],
  },

  /* shallow bowl, foot line, spoon angled out, steam drifts */
  "soup-bowl": {
    auto: false,
    dur: 1.9,
    parts: [
      path("M3.4 12.6h17.2c0 4.2-3.8 7.6-8.6 7.6s-8.6-3.4-8.6-7.6z"),
      path("M9.2 20.4h5.6"),
      path("M18.4 12.6l.8-5.6"),
      ellipse(19.4, 5.4, 1.5, 1.9),
      A(path("M8 10.2c0-1.1.9-1.5.9-2.6"), [
        tn("translate", ["0 0", "0 -0.9", "0 0"], [0, 0.4, 1]),
      ]),
      A(path("M11.2 10.2c0-1.1.9-1.5.9-2.6"), [
        tn("translate", ["0 0", "0 0", "0 -0.9", "0 0"], [0, 0.25, 0.65, 1]),
      ]),
    ],
  },

  /* pan with a fried egg — handle gives a little shake */
  "frying-pan": {
    auto: false,
    dur: 1.9,
    parts: [
      G("pan", [
        circle(10.4, 13.6, 7),
        circle(10.4, 13.6, 4.2),
        circle(10.4, 13.6, 1.5, fill()),
        path("M15.5 8.5l4.9-4.7"),
      ]),
    ],
    gAnims: { pan: WIG(10.4, 13.6, 4) },
  },
};
