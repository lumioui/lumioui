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
/* the handshake rocks — both parties settle into the clasp */
const SHAKE = tn("rotate", ["0 12 11", "0 12 11", "-3.5 12 11", "3 12 11", "0 12 11"], HOLD);

/* work-01 — 22 glyphs: agreements, audits, briefcase family, conference,
 * contracts, goal. Soft blob silhouettes, stroke 2, live area [2.5, 21.5].
 * Default draw-on gesture everywhere except where a bespoke gesture is
 * noted on the entry (magnifier tilt, flag wave, cross pulse, belt ride). */

/* shared briefcase anatomy — soft tub + arched handle */
const CASE = rect(2.9, 7, 18.2, 13, 2.7);
const HANDLE =
  "M9.5 7v-.9c0-1.1.1-1.8.5-2.3.4-.4 1.1-.5 2-.5s1.6.1 2 .5c.4.5.5 1.2.5 2.3V7";
/* lid seam used by 01/02 — flat middle, ends curling up to the case top */
const LID_SEAM =
  "M2.9 9.3c0 1.9 1.6 3.3 3.6 3.3h11c2 0 3.6-1.4 3.6-3.3";
/* hanging clasp under a seam at y ≈ 12.4 */
const CLASP_U =
  "M10.3 12.4v.7c0 1 .7 1.7 1.7 1.7s1.7-.7 1.7-1.7v-.7";
/* smile seam — flap edge dipping to a soft center low point ≈ y14.6 */
const SMILE_SEAM =
  "M3 10.3c2 2.9 5.4 4.3 9 4.3s7-1.4 9-4.3";

export const icons = {
  /* wrists in from both sides, hands clasped bottom-center */
  agreement01: {
    dur: 1.6,
    auto: false,
    parts: [
      G("shake", [
        path("M2.8 7h3"),
        path("M21.2 7h-3"),
        /* right hand over the top, thumb hooked round the other palm */
        path("M18.2 7c-1.5 0-2.7-1.2-4.6-1.2-1 0-1.9.4-2.6 1L8.4 9.4c-.8.7-.8 1.9 0 2.6.7.6 1.7.5 2.3-.1l1.5-1.5 5.2 5.2"),
        /* left hand under: wrist, palm, two big knuckles (small ones blob) */
        path("M5.8 7 3.6 13.8l5.4 5.4c.8.8 2 .8 2.8 0 .8-.8.8-2 0-2.8"),
        path("M11.8 16.4c.8.8 2 .8 2.8 0 .8-.8.8-2 0-2.8"),
        path("M18.2 7l2.2 6.6-2.9 2"),
      ]),
    ],
    gAnims: { shake: SHAKE },
  },

  /* diagonal clasp — interlocked fingers cascading down-left */
  /* the same clasp, mirrored — left hand on top */
  agreement02: {
    dur: 1.6,
    auto: false,
    parts: [
      G("mirror", [
        G("shake", [
          path("M2.8 7h3"),
          path("M21.2 7h-3"),
          /* right hand over the top, thumb hooked round the other palm */
          path("M18.2 7c-1.5 0-2.7-1.2-4.6-1.2-1 0-1.9.4-2.6 1L8.4 9.4c-.8.7-.8 1.9 0 2.6.7.6 1.7.5 2.3-.1l1.5-1.5 5.2 5.2"),
          /* left hand under: wrist, palm, two big knuckles (small ones blob) */
          path("M5.8 7 3.6 13.8l5.4 5.4c.8.8 2 .8 2.8 0 .8-.8.8-2 0-2.8"),
          path("M11.8 16.4c.8.8 2 .8 2.8 0 .8-.8.8-2 0-2.8"),
          path("M18.2 7l2.2 6.6-2.9 2"),
        ]),
      ], { transform: "matrix(-1 0 0 1 24 0)" }),
    ],
    gAnims: { shake: tn("rotate", ["0 12 12.4", "0 12 12.4", "-3.5 12 12.4", "3 12 12.4", "0 12 12.4"], [0, 0.3, 0.55, 0.8, 1]) },
  },

  /* dog-eared contract page + signature flourish */
  agreement03: {
    parts: [
      path("M8.4 3.7h4.6l5.2 5.2v8.2c0 1.5-1.2 2.7-2.7 2.7H8.4c-1.5 0-2.7-1.2-2.7-2.7V6.4c0-1.5 1.2-2.7 2.7-2.7z"),
      path("M13 3.7v3.3c0 1 .8 1.8 1.8 1.8h3.4"),
      DRAW(path("M8.2 15.9c1-1.3 1.8-1.9 2.5-1.9.6 0 .9.5 1.1 1 .3.6.7.9 1.3.9.7 0 1.3-.6 1.8-1.4"), 0.25, 0.72),
      line(8.2, 11.2, 11.6, 11.2),
    ],
    auto: false,
    dur: 1.6,
  },

  /* L-axes, two text ticks, trend wave */
  "analysis-text-link": {
    parts: [
      path("M3.9 3.6v11.9c0 1.5.1 2.8.9 3.6.7.7 2 .8 3.7.8h11.9"),
      line(7.6, 5.4, 9.2, 5.4),
      line(7.6, 9.2, 12.4, 9.2),
      DRAW(path("M7.6 16.2c.9-1.8 2.2-3.8 4.2-3.8 1.8 0 2.2 2 4 2 2.2 0 3-2.8 4.4-3.6"), 0.2, 0.7),
    ],
    auto: false,
    dur: 1.6,
  },

  /* report page + person badge overlapping the corner */
  audit01: {
    parts: [
      path("M15.8 10.4V7.2c0-1.5-.2-2.5-.7-3.1-.7-.8-1.8-1.2-3-1.2H8c-1.2 0-2.3.4-3 1.2-.5.6-.7 1.6-.7 3.1v8.6c0 1.2.2 2.2.8 2.8.6.7 1.6 1 2.8 1h2.5"),
      path("M7.5 7.2h5.2M7.5 10.6h3.7"),
      G("badge", [
        circle(15.6, 14.6, 2.3),
        path("M11.8 20.7c0-1.9 1.7-3.4 3.8-3.4s3.8 1.5 3.8 3.4c0 .4-.3.7-.7.7h-6.2c-.4 0-.7-.3-.7-.7z"),
      ]),
    ],
    sAnims: { badge: POP(15.6, 17, 1.14) },
    auto: false,
    dur: 1.4,
  },

  /* report page + magnifier inspecting the corner */
  audit02: {
    dur: 1.5,
    parts: [
      path("M15.7 10.6V7.4c0-1.5-.2-2.5-.7-3.1-.7-.8-1.8-1.2-3-1.2H8c-1.2 0-2.3.4-3 1.2-.5.6-.7 1.6-.7 3.1v8.8c0 1.4.2 2.4.8 3.1.6.7 1.7 1.1 2.9 1.1h3"),
      path("M7.5 7.2h5.2M7.5 10.6h3.7"),
      G("scan", [circle(15.9, 15.8, 3.3), line(18.3, 18.3, 20.6, 20.6)]),
    ],
    gAnims: { scan: tn("rotate", ["0 16 16", "-9 16 16", "0 16 16"]) },
  },

  /* shallow-V flap closing over the front + tiny tie stub */
  "briefcase-business": {
    parts: [
      CASE,
      path(HANDLE),
      path("M3 10.2l7.2 3.1c.6.3 1.2.4 1.8.4s1.2-.1 1.8-.4l7.2-3.1"),
      SHIFT(line(12, 14.4, 12, 16.4), 0, 0.8),
    ],
    auto: false,
    dur: 1.5,
  },

  /* small case riding a conveyor belt — bobs gently */
  "briefcase-conveyor-belt": {
    dur: 1.6,
    parts: [
      G("ride", [
        rect(4.4, 6.8, 15.2, 9.4, 2.5),
        path("M9.7 6.8v-.7c0-1 .8-1.9 1.9-1.9h.8c1 0 1.9.9 1.9 1.9v.7"),
        line(4.4, 11.4, 19.6, 11.4),
        line(8.2, 10.3, 8.2, 12.5),
        line(15.8, 10.3, 15.8, 12.5),
      ]),
      line(2.9, 18.6, 21.1, 18.6),
      path("M6 18.6v1.9M10 18.6v1.9M14 18.6v1.9M18 18.6v1.9"),
    ],
    gAnims: { ride: tn("translate", ["0 0", "0 -0.8", "0 0"]) },
  },

  /* case + $ mark + side band ticks */
  "briefcase-dollar": {
    parts: [
      CASE,
      path(HANDLE),
      G("buck", [path("M14 11c-.4-.6-1-.9-1.9-.9-1.1 0-2 .7-2 1.6 0 2.3 4 1.2 4 3.4 0 .9-.9 1.6-2 1.6-1 0-1.7-.5-2.1-1.2M12.1 9v8.8")]),
      line(2.9, 11.6, 5, 11.6),
      line(19, 11.6, 21.1, 11.6),
    ],
    sAnims: { buck: POP(12.1, 13.8, 1.16) },
    auto: false,
    dur: 1.35,
  },

  /* case + two straps + soft cross */
  "briefcase-medical": {
    dur: 1.6,
    parts: [
      CASE,
      path(HANDLE),
      path("M7 7v13M17 7v13"),
      G("pulse", [path("M12 10.8v4.9M9.55 13.25h4.9")]),
    ],
    sAnims: {
      pulse: { pivot: [12, 13.25], anim: tn("scale", ["1", "1.18", "1"], [0, 0.55, 1]) },
    },
  },

  /* lid seam with flat-bottom dip + hanging clasp — the clasp tugs down */
  briefcase01: {
    dur: 1.5,
    auto: false,
    parts: [CASE, path(HANDLE), path(LID_SEAM), SHIFT(path(CLASP_U), 0, 0.8)],
  },

  /* same lid + two strap ticks crossing the seam */
  briefcase02: {
    parts: [
      CASE,
      path(HANDLE),
      path(LID_SEAM),
      A(line(7.4, 11.2, 7.4, 14.1), [
        an("y1", ["11.2", "11.2", "12.1", "11.2", "11.2"], HOLD),
        an("y2", ["14.1", "14.1", "15", "14.1", "14.1"], HOLD),
      ]),
      A(line(16.6, 11.2, 16.6, 14.1), [
        an("y1", ["11.2", "11.2", "12.1", "11.2", "11.2"], HOLD),
        an("y2", ["14.1", "14.1", "15", "14.1", "14.1"], HOLD),
      ]),
    ],
    auto: false,
    dur: 1.5,
  },

  /* straight mid seam + hanging clasp — the clasp tugs down */
  briefcase03: {
    dur: 1.5,
    auto: false,
    parts: [
      CASE,
      path(HANDLE),
      line(2.9, 12.2, 21.1, 12.2),
      SHIFT(path(CLASP_U), 0, 0.8),
    ],
  },

  /* envelope flaps converging on a bucket clasp */
  briefcase04: {
    parts: [
      CASE,
      path(HANDLE),
      path("M3 10.2c1.8 1.6 4.2 2.9 7 3.5M21 10.2c-1.8 1.6-4.2 2.9-7 3.5"),
      G("clasp", [path("M10.4 13.6h3.2v.3c0 .9-.7 1.6-1.6 1.6s-1.6-.7-1.6-1.6v-.3z")]),
    ],
    auto: false,
    dur: 1.5,
    gAnims: { clasp: DIP(0, 0.8) },
  },

  /* smile flap seam + tiny latch — the latch dips */
  briefcase05: {
    dur: 1.5,
    auto: false,
    parts: [CASE, path(HANDLE), path(SMILE_SEAM), SHIFT(line(12, 14.4, 12, 16.2), 0, 0.8)],
  },

  /* smile flap seam + clasp dot on the flap */
  briefcase06: {
    parts: [
      CASE,
      path(HANDLE),
      path(SMILE_SEAM),
      A(circle(12, 11.4, 0.9, fill()), [an("r", ["0.9", "0.9", "1.4", "0.9", "0.9"], HOLD)]),
    ],
    auto: false,
    dur: 1.4,
  },

  /* straight seam + two strap ticks straddling it */
  briefcase07: {
    parts: [
      CASE,
      path(HANDLE),
      line(2.9, 11.9, 21.1, 11.9),
      A(line(7.4, 10.6, 7.4, 13.4), [
        an("y1", ["10.6", "10.6", "11.5", "10.6", "10.6"], HOLD),
        an("y2", ["13.4", "13.4", "14.3", "13.4", "13.4"], HOLD),
      ]),
      A(line(16.6, 10.6, 16.6, 13.4), [
        an("y1", ["10.6", "10.6", "11.5", "10.6", "10.6"], HOLD),
        an("y2", ["13.4", "13.4", "14.3", "13.4", "13.4"], HOLD),
      ]),
    ],
    auto: false,
    dur: 1.5,
  },

  /* minimal case — the handle lifts like a hand on the grip */
  briefcase08: {
    dur: 1.5,
    auto: false,
    parts: [CASE, SHIFT(path(HANDLE), 0, -0.8), line(6.4, 10.8, 17.6, 10.8)],
  },

  /* two full-height straps — the case lands with a settle */
  briefcase09: {
    dur: 1.6,
    auto: false,
    parts: [G("settle", [CASE, path(HANDLE), path("M7.3 7v13M16.7 7v13")])],
    gAnims: { settle: tn("translate", ["0 0", "0 0", "0 0.8", "0 -0.25", "0 0"], HOLD) },
  },

  /* video-call screen between stage pillars, person inside */
  "conference": { dur: 1.4, auto: true, parts: [
    circle(12, 7, 2.8),
    path("M7.2 19.5V18a4.8 4.8 0 0 1 9.6 0v1.5"),
    circle(5, 10, 2),
    path("M2.3 17.5v-.7a3 3 0 0 1 3-3"),
    circle(19, 10, 2),
    path("M21.7 17.5v-.7a3 3 0 0 0-3-3"),
  ] },

  /* contract page + diagonal pen + signature zigzag */
    "contracts": { dur: 1.6,
    auto: false,
    parts: [
    rect(3.62, 4.15, 9.7, 15.7, 2.2),
    G("pen", [
      path("M17.82 6.75C18.42 6.15 19.32 6.15 19.82 6.75C20.42 7.35 20.42 8.25 19.82 8.75L15.32 13.25C15.02 13.55 14.72 13.75 14.32 13.85L12.22 14.45L12.72 12.35C12.82 11.95 13.02 11.55 13.32 11.35L17.82 6.75Z"),
    ]),
    path("M5.92 7.75L10.12 7.75M5.92 10.75L9.12 10.75"),
    A(path("M5.92 17.35L6.62 17.35L7.82 15.15L8.92 17.35L9.82 17.35", { pathLength: 1, "stroke-dasharray": 1 }), [an("stroke-dashoffset", ["1", "1", "0", "0"], [0, 0.28, 0.72, 1])]),
  ],
    gAnims: { pen: tn("rotate", ["0 13.42 10.65", "0 13.42 10.65", "-8 13.42 10.65", "7 13.42 10.65", "0 13.42 10.65"], [0, 0.3, 0.55, 0.8, 1]) } },

  /* pennant on a pole planted in an oval ring — flag sways */
  goal: {
    auto: false,
    dur: 1.6,
    parts: [
      path("M15.7 15.6c3 .6 4.9 1.7 4.9 3.1 0 1.8-3.9 2.9-8.6 2.9s-8.6-1.1-8.6-2.9c0-1.4 1.9-2.5 4.9-3.1"),
      line(12, 17.4, 12, 8.4),
      G("wave", [
        path("M12 4.1c0-.4.4-.7.8-.5l5 2.4c.5.2.5.9 0 1.1l-5 2.4c-.4.2-.8-.1-.8-.5V4.1z"),
      ]),
    ],
    gAnims: { wave: tn("rotate", ["0 12 6.6", "0 12 6.6", "-9 12 6.6", "7 12 6.6", "0 12 6.6"], HOLD) },
  },

  /* ---- depth additions: meeting-room stock real apps need ---- */

  /* presentation — easel screen with a chart line, tripod legs */
  presentation: { dur: 1.8,
    parts: [
      rect(4.2, 4.2, 15.6, 10.4, 1.6),
      line(12, 14.6, 12, 16.6),
      path("M12 16.6L8.2 20.4M12 16.6L15.8 20.4"),
      A(path("M6.8 11.4L9.6 9.2L11.8 11L16.4 7"), [
        tn("translate", ["0 0","0 0","0 -0.7","0 0","0 0"], HOLD)
      ]),
      line(12, 4.2, 12, 3)
    ],
  },

  /* org chart — one root box feeding three leaves */
  "org-chart": { dur: 1.7,
    parts: [
      rect(9.6, 3.6, 4.8, 3.8, 1.2),
      path("M12 7.4L12 15.4M6.6 15.4L6.6 13.4L17.4 13.4L17.4 15.4"),
      G("b1", [rect(4.6, 15.4, 4, 4, 1.2)]),
      G("b2", [rect(10, 15.4, 4, 4, 1.2)]),
      G("b3", [rect(15.4, 15.4, 4, 4, 1.2)])
    ],
    sAnims: { b1: POP(6.6, 17.4, 1.12), b2: POP(12, 17.4, 1.12), b3: POP(17.4, 17.4, 1.12) },
  },

  /* target — three rings, the center lands a beat late */
  target: { dur: 1.7, auto: false,
    parts: [
      circle(12, 12, 8.2),
      circle(12, 12, 4.9),
      A(circle(12, 12, 1.6, fill()), [
        an("opacity", ["0","0","1","1"], [0,0.35,0.55,1])
      ])
    ],
  },

  /* pie chart — slice eased off the pie */
  "pie-chart": { dur: 1.7,
    parts: [
      path("M12 12L12 4A8 8 0 1 0 20 12L12 12Z"),
      G("slice", [
        path("M12.8 11.2L12.8 3.2A8 8 0 0 1 20.8 11.2Z")
      ])
    ],
    gAnims: { slice: tn("translate", ["0 0","0 0","0.9 -0.9","0 0","0 0"], HOLD) },
  },

  /* stamp — presses down onto its base line */
  stamp: { dur: 1.7,
    parts: [
      G("head", [
        path("M12 3.6C13.5 3.6 14.5 4.8 14.5 6.3C14.5 7.7 13.7 9 13.2 10.4L13.6 12.6L10.4 12.6L10.8 10.4C10.3 9 9.5 7.7 9.5 6.3C9.5 4.8 10.5 3.6 12 3.6Z"),
        path("M7.4 12.6L16.6 12.6C17.7 12.6 18.5 13.4 18.5 14.5L18.5 16.8L5.5 16.8L5.5 14.5C5.5 13.4 6.3 12.6 7.4 12.6Z")
      ]),
      line(4.2, 20.6, 19.8, 20.6),
      A(path("M7.6 20h8.8"), [an("opacity", ["0","0","1","1"], [0,0.42,0.6,1])])
    ],
    gAnims: { head: tn("translate", ["0 0","0 0","0 1.6","0 0","0 0"], HOLD) },
  },

  /* sticky note — the bottom corner peels */
  "sticky-note": { dur: 1.6,
    parts: [
      path("M5.2 20L5.2 5.6C5.2 4.7 5.9 4 6.8 4L17.2 4C18.1 4 18.8 4.7 18.8 5.6L18.8 13.6L14.6 19.9C14.3 20.4 13.8 20.6 13.2 20.6L6.8 20.6C5.9 20.6 5.2 19.9 5.2 20Z"),
      G("peel", [
        path("M18.8 13.6L14.9 13.6C14.3 13.6 13.8 14 13.8 14.7L13.8 19.4")
      ])
    ],
    gAnims: { peel: WIG(16.2, 16.8, 7) },
  },
};
