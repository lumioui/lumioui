// orphans-orphans-dna-yt-01 — hand-authored icons in the dna01→youtube range
// that never got a batches/*.mjs entry (music family). Parts re-derived
// verbatim from static/*.svg; gestures are bespoke.
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
/* beat-pop at a custom phase — notes land on off-beats like a melody. */
const POPAT = (cx, cy, t0, s = 1.22) => ({
  pivot: [cx, cy],
  anim: tn("scale", ["1", "1", `${s}`, "1", "1"], [0, t0, t0 + 0.14, t0 + 0.32, 1]),
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

export const icons = {
  /* the heads bounce on off-beats */
  "music-note01": {
    auto: false,
    dur: 1.8,
    parts: [
      G("note", [
        circle(4.9, 8.8, 2.3),
        path("M7.2 8.8L7.2 3.6C7.6 4.1 8.1 5.5 9.8 5.8"),
        A(circle(10.3, 19.2, 2.3), [tn("translate", ["0 0", "0 0", "0 -1.1", "0 0", "0 0"], HOLD)]),
        A(circle(18.9, 17.9, 2.2), [tn("translate", ["0 0", "0 0", "0 -1.1", "0 0", "0 0"], [0, 0.5, 0.7, 0.9, 1])]),
        path("M12.6 19.2L12.6 10.3C12.6 9.8 12.9 9.4 13.4 9.3L20.8 7.8C21.2 7.7 21.4 7.9 21.4 8.2L21.4 17.9"),
      ]),
    ],
  },

  /* the note sways to the tune */
    "music-note02": { dur: 1.7,
    auto: false,
    parts: [
    G("note", [
      circle(7.8, 17.21, 3.79),
      path("M11.59 17.21L11.59 3.95C14.9 4.07 17.74 5.61 19.4 8.09C19.99 9.04 19.87 10.23 18.93 10.94C16.68 12.48 13.72 12 11.59 9.87"),
    ]),
  ],
    gAnims: { note: tn("rotate", ["0 11.59 17.21", "0 11.59 17.21", "-5 11.59 17.21", "3 11.59 17.21", "0 11.59 17.21"], [0, 0.3, 0.55, 0.8, 1]) } },

  /* the heads bounce in rhythm */
    "music-note03": { dur: 1.8,
    auto: false,
    parts: [
    G("note", [
      A(circle(6.3, 17.17, 3), [tn("translate", ["0 0", "0 0", "0 -1.1", "0 0", "0 0"], [0, 0.3, 0.55, 0.8, 1])]),
      A(circle(17.9, 14.97, 2.8), [tn("translate", ["0 0", "0 0", "0 -1.1", "0 0", "0 0"], [0, 0.5, 0.7, 0.9, 1])]),
      path("M9.3 17.17L9.3 6.37L20.7 3.97L20.7 14.97"),
    ]),
  ] },

  /* the note bounces on the beat */
  "music-note04": {
    auto: false,
    dur: 1.5,
    parts: [
      G("note", [
        circle(8.2, 17.4, 3.4),
        path("M11.6 17.4L11.6 4.2C14.9 4.5 17.3 6.2 17.8 8.8C18 10 17.2 11.1 16 11.3C14.4 11.5 12.9 10.8 11.6 9.5"),
      ]),
    ],
    gAnims: { note: DIP(0, -1) },
  },

  /* the note bounces on the beat */
  "music-three": {
    auto: false,
    dur: 1.5,
    parts: [
      G("note", [
        circle(6.2, 18.2, 3),
        circle(18, 16, 2.9),
        path("M9.2 18.2L9.2 9.6C9.2 7.6 9.5 6.6 10.2 5.8C10.8 5 11.9 4.6 14 4.1L17.6 3.1C18.6 2.8 19.6 3 20.2 3.7C20.7 4.3 20.9 5.2 20.9 7.2L20.9 16"),
      ]),
    ],
    gAnims: { note: DIP(0, -0.9) },
  },

  /* the stem rocks on its head */
  music01: {
    auto: false,
    dur: 1.7,
    parts: [
      G("note", [
        circle(9.2, 17.2, 3.6),
        path("M12.8 17.2L12.8 4.4C12.8 7.1 15 9.3 17.7 9.3"),
      ]),
    ],
    gAnims: { note: WIG(9.2, 17.2, 6) },
  },

  /* the heads bounce in rhythm */
  music02: {
    auto: false,
    dur: 1.8,
    parts: [
      G("note", [
        A(circle(6, 17.8, 2.9), [tn("translate", ["0 0", "0 0", "0 -1.1", "0 0", "0 0"], HOLD)]),
        A(circle(18, 15.8, 2.9), [tn("translate", ["0 0", "0 0", "0 -1.1", "0 0", "0 0"], [0, 0.5, 0.7, 0.9, 1])]),
        path("M8.9 17.8L8.9 9.9C8.9 8.2 9.1 7.3 9.8 6.6C10.4 5.9 11.3 5.6 12.8 5.3L17.8 4.4C18.6 4.3 19.4 4.6 19.8 5.2C20.1 5.7 20.3 6.3 20.3 7.6L20.3 15.8"),
      ]),
    ],
  },

  /* the note bounces on the beat */
  music3: {
    auto: false,
    dur: 1.5,
    parts: [
      G("note", [
        circle(6.2, 18.2, 3),
        circle(18, 16, 2.9),
        path("M9.2 18.2L9.2 9.6C9.2 7.6 9.5 6.6 10.2 5.8C10.8 5 11.9 4.6 14 4.1L17.6 3.1C18.6 2.8 19.6 3 20.2 3.7C20.7 4.3 20.9 5.2 20.9 7.2L20.9 16"),
      ]),
    ],
    gAnims: { note: DIP(0, -0.9) },
  },
};
