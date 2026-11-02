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

/* shared bits -------------------------------------------------------- */

/* small left arrow all pointing-leftNN glyphs carry, top-left. */
const ARROW_L = [
  line(2.9, 4.6, 8.2, 4.6),
  path("M5.1 2.4 3 4.6l2.1 2.1"),
];
/* chevron-only arrow for the 05-08 set */
const CHEV_L = [path("M7 2.6 4.2 5 7 7.4")];
/* hands: right-pointing bases mirrored left (same as people-02) */
const ML = { transform: "translate(24 0) scale(-1 1)" };
const mir = (parts) => parts.map((p) => ({ ...p, a: { ...p.a, ...ML } }));
const FINGER = "H18a2 2 0 0 1 0 4H15a1.6 1.6 0 0 1 0 3.2h-.4a1.6 1.6 0 0 1-.2 3.2";
const HAND_PLAIN = "M14 9H18a2 2 0 0 1 0 4H15a1.6 1.6 0 0 1 0 3.2h-.4a1.6 1.6 0 0 1-.2 3.2H8.5A5 5 0 0 1 3.5 14.4V11.5A4.5 4.5 0 0 1 8 7H12a2 2 0 0 1 2 2Z";
const HAND_CUFF = "M14 9H18a2 2 0 0 1 0 4H15a1.6 1.6 0 0 1 0 3.2h-.4a1.6 1.6 0 0 1-.2 3.2H3.5M3.5 7H12a2 2 0 0 1 2 2";
const HANDS = {
  1: [path(HAND_CUFF), path("M7.5 7v12.4")],
  2: [path(HAND_PLAIN)],
  3: [path(HAND_PLAIN), path("M13.5 13C10.5 13 9 14 9 16")],
  4: [path(HAND_CUFF), path("M13.5 13C11.5 13 11 13.8 11 15.2"), path("M7.5 7v12.4")],
};

/* sounding-block base: flat line with a soft raised bump. */
const block = (x0) =>
  path(`M${x0} 21.5h1.6c.4-1.1 1-2 2.4-2h1c1.4 0 2 .9 2.4 2h${(21.5 - x0 - 8.4).toFixed(1)}`);

/* mini gavel (capsule head + handle + knob) used inside doc / shield. */
const miniGavel = (cx, cy) => {
  const [hx, hy] = [cx - 1.6, cy - 0.9];
  return [
    path(
      `M${(cx - 1.6).toFixed(1)} ${(cy + 0.1).toFixed(1)}` +
        `a1.3 1.3 0 0 1 1.8-1.8l1.5 1.5a1.3 1.3 0 0 1-1.8 1.8l-1.5-1.5z`
    ),
    line((cx - 0.9).toFixed(1), (cy + 0.9).toFixed(1), hx.toFixed(1), (cy + 5.3).toFixed(1)),
    circle((hx - 0.2).toFixed(1), (cy + 5.5).toFixed(1), 0.9),
  ];
};

/* a pointing-left hand jabs left along its finger axis. */
const jab = tn("translate", ["0 0", "0 0", "-2.2 0", "-2.2 0", "0 0", "0 0"], [0, 0.22, 0.38, 0.55, 0.75, 1]);

/* ------------------------------------------------------------------- */


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
export const icons = {  "legal-document01": {
    auto: false,
    dur: 1.7,
    parts: [
      rect(4.2, 2.5, 15.6, 19, 2.8),
      G("gavel", miniGavel(12.4, 7.6)),
      line(8.5, 18, 15.5, 18),
    ],
    gAnims: { gavel: WIG(10.6, 13.1, 9) },
  },

  "legal-document02": {
    auto: false,
    dur: 1.8,
    /* dog-eared document with a text line and a notary seal */
    parts: [
      path("M13.6 2.8H8.2A3.2 3.2 0 0 0 5 6v12a3.2 3.2 0 0 0 3.2 3.2h7.6A3.2 3.2 0 0 0 19 18V8.2z"),
      path("M13.6 2.8v2.8a2.6 2.6 0 0 0 2.6 2.6H19"),
      line(8.8, 11.4, 15.2, 11.4),
      G("seal", [circle(12, 16.3, 2.3)]),
    ],
    sAnims: { seal: { pivot: [12, 16.3], anim: tn("scale", ["1", "1", "1.18", "1", "1"], [0, 0.3, 0.55, 0.8, 1]) } },
  },

  "legal-hammer": {
    auto: false,
    dur: 1.7,
    parts: [
      path(
        "M12 2.4c.9 0 3.6 1.6 5.4 2.3 1.6.6 2.8.9 2.8 2.3v4.2c0 5.4-3.8 8.5-6.9 9.9-.8.4-1.8.4-2.6 0-3.1-1.4-6.9-4.5-6.9-9.9V7c0-1.4 1.2-1.7 2.8-2.3C8.4 4 11.1 2.4 12 2.4z"
      ),
      G("gavel", miniGavel(12.4, 9.6)),
    ],
    gAnims: { gavel: WIG(10.6, 15.1, 9) },
  },

  legal01: {
    auto: false,
    dur: 1.6,
    parts: [
      G("swing", [
        G("head", [rect(8.2, 6.9, 10, 5, 1.8)], { transform: "rotate(45 13.2 9.4)" }),
        line(11.4, 11.2, 4.6, 18),
      ]),
      line(11, 20, 20.5, 20),
    ],
    gAnims: { swing: tn("rotate", ["0 4.6 18", "-10 4.6 18", "6 4.6 18", "0 4.6 18"], [0, 0.3, 0.58, 1]) },
  },

  legal02: {
    auto: false,
    dur: 1.8,
    parts: [
      line(12, 5.4, 12, 20.6),
      line(8, 20.6, 16, 20.6),
      G("beam", [
        path("M5.8 8.2C8.4 8.2 10 6.8 12 5.4C14 6.8 15.6 8.2 18.2 8.2"),
        path("M3.2 15.4L5.8 8.2L8.4 15.4c-.7.6-1.6.9-2.6.9s-1.9-.3-2.6-.9z"),
        path("M15.6 15.4L18.2 8.2L20.8 15.4c-.7.6-1.6.9-2.6.9s-1.9-.3-2.6-.9z"),
      ]),
    ],
    gAnims: { beam: tn("rotate", ["0 12 5.4", "-4 12 5.4", "3 12 5.4", "0 12 5.4"], [0, 0.3, 0.65, 1]) },
  },

  man: {
    auto: false,
    dur: 1.8,
    parts: [
      G("figure", [
        circle(12, 4.4, 2.2),
        rect(8.2, 8.6, 7.6, 7.4, 2.4),
        rect(10.1, 16, 3.8, 5.5, 1.9),
      ]),
    ],
    gAnims: { figure: WIG(12, 21.5, 4) },
  },

  "man-woman": {
    auto: false,
    dur: 1.8,
    parts: [
      G("m", [
        circle(6.5, 4.3, 1.9),
        rect(3, 8.7, 7, 7.3, 2.2),
        rect(4.7, 16, 3.6, 5.4, 1.8),
      ]),
      G("w", [
        circle(17.5, 4.3, 1.9),
        path(
          "M17.5 8.6c-.9 0-1.6.6-1.9 1.6l-1.2 3.3c-.4 1.2-.6 1.8-.4 2.2.2.4.8.5 1.6.5h3.8c.8 0 1.4-.1 1.6-.5.2-.4 0-1-.4-2.2l-1.2-3.3c-.3-1-1-1.6-1.9-1.6z"
        ),
        rect(15.7, 16.4, 3.6, 5.1, 1.7),
      ]),
    ],
    gAnims: {
      m: WIG(6.5, 21.5, 4),
      w: tn("rotate", ["0 17.5 21.5", "0 17.5 21.5", "4 17.5 21.5", "-2 17.5 21.5", "0 17.5 21.5"], HOLD),
    },
  },

  manager: {
    auto: false,
    dur: 1.7,
    parts: [
      rect(8.6, 2.3, 6.8, 7.9, 3.1),
      path(
        "M19.7 21.5v-4.7c0-1.7 0-2.6-.6-3.2-.6-.6-1.5-.6-3.2-.6L12 21.5 8.1 13c-1.7 0-2.6 0-3.2.6-.6.6-.6 1.5-.6 3.2v4.7"
      ),
      G("tie", [
        path(
          "M12 15.1l-.7-1.3c-.1-.2 0-.5.2-.5h1c.2 0 .3.3.2.5l-.7 1.3zm0 .3-.5 3.4c0 .5.3 1.3.5 1.3s.5-.8.5-1.3L12 15.4z",
          fill()
        ),
      ]),
    ],
    gAnims: { tie: WIG(12, 14.8, 12) },
  },

  nose: {
    auto: false,
    dur: 1.7,
    parts: [
      path("M8.6 3.2c0 2.3-1.4 7-2.8 9.1-1.6 2.4-3 6.2 0 7.6 1.5.7 3.3-.7 3.3-.7"),
      path("M15.4 3.2c0 2.3 1.4 7 2.8 9.1 1.6 2.4 3 6.2 0 7.6-1.5.7-3.3-.7-3.3-.7"),
      SHIFT(path("M7.4 17.4c1.9 0 2.4 3.5 4.6 3.5s2.7-3.5 4.6-3.5"), 0, 0.6),
    ],
  },

  "person-standing": {
    auto: false,
    dur: 1.8,
    parts: [
      G("figure", [
        circle(12, 4.4, 2),
        path(
          "M4.4 5.6l1.8 1.4c1 .8 1.6 1.2 2.3 1.4.7.2 1.4.2 2.7.2h1.6c1.3 0 2 0 2.7-.2.7-.2 1.3-.6 2.3-1.4l1.8-1.4"
        ),
        path("M10.4 8.6v4.3c0 .5 0 .8-.1 1.1-.1.4-.2.7-.5 1.3L7.9 20.6"),
        path("M13.6 8.6v4.3c0 .5 0 .8.1 1.1.1.4.2.7.5 1.3l1.9 5.3"),
        line(10.7, 14.4, 13.3, 14.4),
      ]),
    ],
    gAnims: { figure: WIG(12, 20.6, 4) },
  },

    "pointing-left01": { auto: false, dur: 1.4, gAnims: { arrow: DIP(-1.2, 0) }, parts: [G("arrow", ARROW_L), ...mir(HANDS[1])] },

    "pointing-left02": { auto: false, dur: 1.4, gAnims: { arrow: DIP(-1.2, 0) }, parts: [G("arrow", ARROW_L), ...mir(HANDS[2])] },

  "pointing-left03": { auto: false, dur: 1.4, gAnims: { arrow: DIP(-1.2, 0) }, parts: [G("arrow", ARROW_L), ...mir(HANDS[3])] },

    "pointing-left04": { auto: false, dur: 1.4, gAnims: { arrow: DIP(-1.2, 0) }, parts: [G("arrow", ARROW_L), ...mir(HANDS[4])] },

    "pointing-left05": { auto: false, dur: 1.4, gAnims: { arrow: DIP(-1.2, 0) }, parts: [G("arrow", CHEV_L), ...mir(HANDS[1])] },

    "pointing-left06": { auto: false, dur: 1.4, gAnims: { arrow: DIP(-1.2, 0) }, parts: [G("arrow", CHEV_L), ...mir(HANDS[2])] },

  "pointing-left07": { auto: false, dur: 1.4, gAnims: { arrow: DIP(-1.2, 0) }, parts: [G("arrow", CHEV_L), ...mir(HANDS[3])] },

  "pointing-left08": { auto: false, dur: 1.4, gAnims: { arrow: DIP(-1.2, 0) }, parts: [G("arrow", CHEV_L), ...mir(HANDS[4])] },

};
