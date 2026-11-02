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

// sway shared by the bare music notes — same gesture as the canon `music` glyph
const sway = (children, pivot = "12 20") => ({
  auto: false,
  parts: [G("sway", children)],
  gAnims: { sway: tn("rotate", ["0 " + pivot, "-7 " + pivot, "6 " + pivot, "0 " + pivot], [0, 0.3, 0.65, 1]) },
});

export const icons = {
  // karaoke mic: ball head tilted 45°, capsule handle resting over a floor line —
  // it leans and rights itself on its handle
  "mic-vocal": {
    auto: false,
    dur: 1.7,
    parts: [
      G("mic", [
        circle(16.3, 7.4, 4.2),
        path("M12.9 9.6 6.3 16.2c-.9.9-.9 2.4 0 3.3.9.9 2.4.9 3.3 0l6.6-6.6"),
      ]),
      line(3.2, 21.2, 13.6, 21.2),
    ],
    gAnims: { mic: WIG(7.9, 18.5, 8) },
  },

  // vertical chip, 3 pins each side, two inner trace slots — pins ripple
  "microchip": {
    auto: false,
    dur: 1.7,
    parts: [
      rect(6, 3.4, 12, 17.2, 2.7),
      A(path("M3.4 7.6h2.6M3.4 12h2.6M3.4 16.4h2.6"), [an("opacity", ["1", "1", "0.3", "1", "1"], HOLD)]),
      A(path("M18 7.6h2.6M18 12h2.6M18 16.4h2.6"), [an("opacity", ["1", "1", "0.3", "1", "1"], [0, 0.5, 0.62, 0.75, 1])]),
      path("M9.6 9.4h4.8M9.6 14.6h4.8"),
    ],
  },

  // tilted tube, joint knob, C-arm, stage, foot, baseline — tube slides to focus
  "microscope": {
    auto: false,
    dur: 1.7,
    parts: [
      SHIFT(path("M10.2 3.7c1.1-.5 2.4 0 3 1.1l2.5 4.9c.6 1.2.2 2.6-1 3.2-1.1.6-2.5.2-3.1-1l-2.5-4.9c-.6-1.1-.1-2.5 1.1-3.3z"), 0.5, 0.9),
      circle(14.1, 14, 1.6),
      path("M15.4 15.9c0 2.4-1.9 4.3-4.3 4.3H8.6"),
      path("M9.6 10.2c-2.5 0-4.6 2-4.6 4.5 0 2.3 1.7 4 4 4h1"),
      path("M13 21.2l-1-3.1c-.2-.6-.8-1-1.4-1h-.6c-.6 0-1.2.4-1.4 1l-1 3.1"),
      line(4.4, 21.2, 19.6, 21.2),
    ],
  },

  // four soft panes — they cascade awake
  "microsoft-tiles": {
    auto: false,
    dur: 1.7,
    parts: [
      A(rect(3.4, 3.4, 7.3, 7.3, 2.1), [an("opacity", ["1", "1", "0.4", "1", "1"], [0, 0.08, 0.2, 0.34, 1])]),
      A(rect(13.3, 3.4, 7.3, 7.3, 2.1), [an("opacity", ["1", "1", "0.4", "1", "1"], [0, 0.17, 0.29, 0.43, 1])]),
      A(rect(3.4, 13.3, 7.3, 7.3, 2.1), [an("opacity", ["1", "1", "0.4", "1", "1"], [0, 0.26, 0.38, 0.52, 1])]),
      A(rect(13.3, 13.3, 7.3, 7.3, 2.1), [an("opacity", ["1", "1", "0.4", "1", "1"], [0, 0.35, 0.47, 0.61, 1])]),
    ],
  },

  // quartered shield — steady breathe
  "microsoft-admin": {
    auto: false,
    dur: 1.8,
    parts: [
      G("shield", [
        path("M12 3.4c2.1 1.3 4.6 2 7.1 2.2.6.1 1 .6 1 1.2v4.3c0 5.3-3.7 8.1-7.3 9.6-.5.2-1.1.2-1.6 0-3.6-1.5-7.3-4.3-7.3-9.6V6.8c0-.6.4-1.1 1-1.2 2.5-.2 5-.9 7.1-2.2z"),
        line(12, 5.6, 12, 19.4),
        line(5, 11, 19, 11),
      ]),
    ],
    sAnims: { shield: POP(12, 11.5, 1.07) },
  },

  // wide oven body, door window left, feet, two button dots — LEDs alternate
  "microwave": {
    auto: false,
    dur: 1.6,
    parts: [
      rect(3, 5.2, 18, 13.4, 2.7),
      rect(5.6, 7.7, 9.4, 8.4, 1.7),
      path("M6.5 18.6v1.9M17.5 18.6v1.9"),
      A(circle(18.4, 8.4, 0.9, fill()), [an("opacity", ["1", "1", "0.2", "1", "1"], [0, 0.3, 0.42, 0.55, 1])]),
      A(circle(18.4, 11.8, 0.9, fill()), [an("opacity", ["1", "1", "0.2", "1", "1"], [0, 0.55, 0.67, 0.8, 1])]),
    ],
  },

  // quaver head left + stem + flag
  "music01": sway([
    circle(9.2, 17.2, 3.6),
    path("M12.8 17.2V4.4c0 2.7 2.2 4.9 4.9 4.9"),
  ]),

  // beamed pair, left head lower
  "music02": sway([
    circle(6, 17.8, 2.9),
    circle(18, 15.8, 2.9),
    path("M8.9 17.8V9.9c0-1.7.2-2.6.9-3.3.6-.7 1.5-1 3-1.3l5-.9c.8-.1 1.6.2 2 .8.3.5.5 1.1.5 2.4v8.2"),
  ]),

  // beamed pair, bowed stem tops (alias of music-three)
  "music3": sway([
    circle(6.2, 18.2, 3),
    circle(18, 16, 2.9),
    path("M9.2 18.2V9.6c0-2 .3-3 1-3.8.6-.8 1.7-1.2 3.8-1.7l3.6-1c1-.3 2-.1 2.6.6.5.6.7 1.5.7 3.5v8.8"),
  ]),

  // scattered notes: quaver top-left + beamed pair bottom
  "music-note01": sway([
    circle(4.9, 8.8, 2.3),
    path("M7.2 8.8V3.6c.4.5.9 1.9 2.6 2.2"),
    circle(10.3, 19.2, 2.3),
    circle(18.9, 17.9, 2.2),
    path("M12.6 19.2V10.3c0-.5.3-.9.8-1l7.4-1.5c.4-.1.6.1.6.4v9.7"),
  ], "12 21"),

  // big single note with a droopy leaf flag
    "music-note02": { auto: false,
    parts: [
    G("sway", [
      circle(7.8, 17.21, 3.79),
      path("M11.59 17.21L11.59 3.95C14.9 4.07 17.74 5.61 19.4 8.09C19.99 9.04 19.87 10.23 18.93 10.94C16.68 12.48 13.72 12 11.59 9.87"),
    ]),
  ],
    gAnims: { sway: tn("rotate", ["0 13.72 20.29", "-7 13.72 20.29", "6 13.72 20.29", "0 13.72 20.29"], [0, 0.3, 0.65, 1]) } },

  // beamed pair, steep straight beam
    "music-note03": { auto: false,
    parts: [
    G("sway", [
      circle(6.3, 17.17, 3),
      circle(17.9, 14.97, 2.8),
      path("M9.3 17.17L9.3 6.37L20.7 3.97L20.7 14.97"),
      path("M9.3 9.57L20.7 7.17"),
    ]),
  ],
    gAnims: { sway: tn("rotate", ["0 11.7 18.77", "-7 11.7 18.77", "6 11.7 18.77", "0 11.7 18.77"], [0, 0.3, 0.65, 1]) } },

  // stem + head + curl flag at top
  "music-note04": sway([
    circle(8.2, 17.4, 3.4),
    path("M11.6 17.4V4.4C15.1 4.7 17.9 6.7 18.4 9.7 17.4 8.7 14.8 7.4 11.6 8.8"),
  ]),

  // note inside a squircle — it sways on its stem
  "music-note-square01": {
    auto: false,
    dur: 1.6,
    parts: [
      rect(3.2, 3.2, 17.6, 17.6, 4.6),
      G("note", [
        circle(10.6, 14.6, 1.6),
        path("M12.2 14.6V8.2c.3.4.7 2.1 2.5 2.5"),
      ]),
    ],
    gAnims: { note: WIG(11.5, 15.2, 7) },
  },

  // beamed pair inside a squircle — the notes sway together
  "music-note-square02": {
    auto: false,
    dur: 1.6,
    parts: [
      rect(3.2, 3.2, 17.6, 17.6, 4.6),
      G("note", [
        circle(8.6, 15.4, 1.4),
        circle(15.2, 14.2, 1.4),
        path("M10 15.4V9.7l6.6-1.4v5.9"),
      ]),
    ],
    gAnims: { note: WIG(12.5, 15.6, 7) },
  },

  // identical twin of music3
  "music-three": sway([
    circle(6.2, 18.2, 3),
    circle(18, 16, 2.9),
    path("M9.2 18.2V9.6c0-2 .3-3 1-3.8.6-.8 1.7-1.2 3.8-1.7l3.6-1c1-.3 2-.1 2.6.6.5.6.7 1.5.7 3.5v8.8"),
  ]),

  // two soft capsules — they pinch in like a held breath
  "pause": {
    auto: false,
    dur: 1.5,
    parts: [
      G("bars", [
        rect(4.4, 4.4, 5.4, 15.2, 2.7),
        rect(14.2, 4.4, 5.4, 15.2, 2.7),
      ]),
    ],
    sAnims: {
      bars: { pivot: [12, 12], anim: tn("scale", ["1 1", "1 1", "0.9 1", "1 1", "1 1"], HOLD) },
    },
  },

  "pause-circle": {
    auto: false,
    dur: 1.5,
    parts: [
      circle(12, 12, 8.5),
      G("bars", [line(9.7, 8.9, 9.7, 15.1), line(14.3, 8.9, 14.3, 15.1)]),
    ],
    sAnims: {
      bars: { pivot: [12, 12], anim: tn("scale", ["1 1", "1 1", "0.86 1", "1 1", "1 1"], HOLD) },
    },
  },

  // screen corners + arrow pointing SE into the pip window — the pip pops
  "picture-in-picture": {
    auto: false,
    dur: 1.5,
    parts: [
      path("M9.6 19.6H7c-2.3 0-4.2-1.9-4.2-4.2v-1.8"),
      path("M14.4 4.4H17c2.3 0 4.2 1.9 4.2 4.2v1.8"),
      line(3.4, 4.6, 9.4, 10.6),
      path("M9.6 7c.1 1.1.3 2.9-.4 3.6-.6.6-2.4.5-3.5.3"),
      G("pip", [rect(13.8, 14.2, 7.4, 6, 1.7)]),
    ],
    sAnims: { pip: POP(17.5, 17.2, 1.14) },
  },

  // screen + pip window + arrow escaping up-left — the pip slips out
  "picture-in-picture-exit": {
    auto: false,
    dur: 1.5,
    parts: [
      path("M11.6 19.8H7.4c-2.6 0-4.6-2-4.6-4.6V9.2c0-2.6 2-4.6 4.6-4.6h9.2c2.6 0 4.6 2 4.6 4.6v2.2"),
      SHIFT(rect(14, 14.2, 7.2, 5.8, 1.6), -1.5, -1.5),
      line(8.3, 9.7, 11.6, 13),
      path("M10.8 9.4H8.4c-.4 0-.7.3-.7.7v2.4"),
    ],
  },

  // screen + pip window + arrow pushing down-right into it — pip tucks in
  "picture-in-picture-on": {
    auto: false,
    dur: 1.5,
    parts: [
      path("M11.6 19.8H7.4c-2.6 0-4.6-2-4.6-4.6V9.2c0-2.6 2-4.6 4.6-4.6h9.2c2.6 0 4.6 2 4.6 4.6v2.2"),
      SHIFT(rect(14, 14.2, 7.2, 5.8, 1.6), 1.4, 1.4),
      line(6.4, 8.2, 10.4, 12.2),
      path("M10.8 9.8v2.3c0 .4-.3.7-.7.7H7.8"),
    ],
  },

  // screen open top-right, pip window tucked in the corner — it pops
  "picture-in-picture01": {
    auto: false,
    dur: 1.5,
    parts: [
      path("M11.4 19.8H7.4c-2.6 0-4.6-2-4.6-4.6V9.2c0-2.6 2-4.6 4.6-4.6h9.2c2.6 0 4.6 2 4.6 4.6v1.4"),
      G("pip", [rect(13.2, 13.2, 8, 6.6, 1.8)]),
    ],
    sAnims: { pip: POP(17.2, 16.5, 1.14) },
  },

  // play triangle pulses
  "play-circle": {
    auto: false,
    dur: 1.4,
    parts: [
      circle(12, 12, 8.5),
      G("play", [path("M10.2 8.7l4.9 2.9c.6.4.6 1.3 0 1.7l-4.9 2.9c-.6.4-1.4-.1-1.4-.8V9.6c0-.7.8-1.2 1.4-.9z")]),
    ],
    sAnims: { play: POP(11.7, 11.7, 1.16) },
  },

  // filled play glyph variant
  "play-circle02": {
    auto: false,
    dur: 1.4,
    parts: [
      circle(12, 12, 8.5),
      G("play", [path("M10.3 8.8l4.8 2.8c.7.4.7 1.4 0 1.8l-4.8 2.8c-.7.4-1.5-.1-1.5-.9V9.7c0-.8.8-1.3 1.5-.9z", fill())]),
    ],
    sAnims: { play: POP(11.8, 11.7, 1.16) },
  },

  // clapperboard + play — triangle pulses
  "play-list": {
    auto: false,
    dur: 1.4,
    parts: [
      rect(2.9, 3.4, 18.2, 17.4, 2.7),
      line(2.9, 8.2, 21.1, 8.2),
      path("M9.8 3.6 7.2 8.2M16.6 3.6 14 8.2"),
      G("play", [path("M10.2 10.9l4.4 2.6c.6.4.6 1.3 0 1.6l-4.4 2.6c-.6.4-1.4-.1-1.4-.8v-5.2c0-.7.8-1.2 1.4-.8z")]),
    ],
    sAnims: { play: POP(11.6, 13.5, 1.16) },
  },

  // clapperboard open at the corner + plus badge — the plus pops
  "play-list-add": {
    auto: false,
    dur: 1.5,
    parts: [
      path("M11.6 20.8H7.5c-2.6 0-4.6-2-4.6-4.6V8.6c0-2.6 2-4.6 4.6-4.6h9c2.6 0 4.6 2 4.6 4.6v2.8"),
      line(2.9, 8.2, 21.1, 8.2),
      path("M9.8 4.2 7.2 8.2M16.6 4.2 14 8.2"),
      G("plus", [path("M14.9 18h6.4M18.1 14.8v6.4")]),
    ],
    sAnims: { plus: POP(18.1, 18, 1.2) },
  },

  // clapperboard open at the corner + heart badge — the heart beats
  "play-list-favourite01": {
    auto: false,
    dur: 1.4,
    parts: [
      path("M12 20.8H7.5c-2.6 0-4.6-2-4.6-4.6V8.6c0-2.6 2-4.6 4.6-4.6h9c2.6 0 4.6 2 4.6 4.6v2.8"),
      line(2.9, 8.2, 21.1, 8.2),
      path("M9.8 4.2 7.2 8.2M16.6 4.2 14 8.2"),
      G("heart", [path("M18 21.2s-3.2-2-3.6-4.2c-.3-1.6.8-2.7 1.9-2.7.8 0 1.4.4 1.7 1 .3-.6.9-1 1.7-1 1.1 0 2.2 1.1 1.9 2.7-.4 2.2-3.6 4.2-3.6 4.2z")]),
    ],
    sAnims: { heart: POP(18, 17.7, 1.22) },
  },

  // open square + play inside + heart badge — the heart beats
  "play-list-favourite02": {
    auto: false,
    dur: 1.4,
    parts: [
      path("M12.6 21.2H7.6c-2.6 0-4.6-2-4.6-4.6V7.4c0-2.6 2-4.6 4.6-4.6h8.8c2.6 0 4.6 2 4.6 4.6v5.2"),
      path("M9.3 9.2l3.9 2.3c.5.3.5 1.1 0 1.4l-3.9 2.3c-.5.3-1.1-.1-1.1-.6V9.8c0-.5.6-.9 1.1-.6z"),
      G("heart", [path("M18.1 21.4s-3.3-2.1-3.6-4.2c-.3-1.5.7-2.6 1.9-2.6.7 0 1.4.4 1.7 1 .3-.6 1-1 1.7-1 1.2 0 2.2 1.1 1.9 2.6-.3 2.1-3.6 4.2-3.6 4.2z")]),
    ],
    sAnims: { heart: POP(18.1, 17.8, 1.22) },
  },

  // clapperboard + minus badge — the dash pinches away
  "play-list-minus": {
    auto: false,
    dur: 1.5,
    parts: [
      path("M11.6 20.8H7.5c-2.6 0-4.6-2-4.6-4.6V8.6c0-2.6 2-4.6 4.6-4.6h9c2.6 0 4.6 2 4.6 4.6v2.8"),
      line(2.9, 8.2, 21.1, 8.2),
      path("M9.8 4.2 7.2 8.2M16.6 4.2 14 8.2"),
      A(line(14.9, 18, 21.3, 18), [an("x1", ["14.9", "14.9", "18.1", "14.9", "14.9"], HOLD)]),
    ],
  },

  // clapperboard + x badge — the x shakes "no"
  "play-list-remove": {
    auto: false,
    dur: 1.6,
    parts: [
      path("M11.6 20.8H7.5c-2.6 0-4.6-2-4.6-4.6V8.6c0-2.6 2-4.6 4.6-4.6h9c2.6 0 4.6 2 4.6 4.6v2.8"),
      line(2.9, 8.2, 21.1, 8.2),
      path("M9.8 4.2 7.2 8.2M16.6 4.2 14 8.2"),
      G("x", [path("M15.6 15.4l5 5M20.6 15.4 15.6 20.4")]),
    ],
    gAnims: { x: WIG(18.1, 17.9, 10) },
  },

  "play-square": {
    auto: false,
    dur: 1.4,
    parts: [
      rect(3.2, 3.2, 17.6, 17.6, 4.6),
      G("play", [path("M10 8.6l5.4 3.1c.7.4.7 1.4 0 1.8L10 16.6c-.7.4-1.5-.1-1.5-.9V9.5c0-.8.8-1.3 1.5-.9z")]),
    ],
    sAnims: { play: POP(12.3, 12.3, 1.15) },
  },

  // store mark: play triangle with the facet X fold, in a squircle — it pops
  "play-store": {
    auto: false,
    dur: 1.5,
    parts: [
      rect(3.2, 3.2, 17.6, 17.6, 4.6),
      G("glyph", [
        path("M8.8 6.3l7.4 5.1c.8.5.8 1.6 0 2.1l-7.4 5.1c-.8.5-1.7 0-1.7-1V7.3c0-1 .9-1.5 1.7-1z"),
        path("M8.3 16.9l7-6.6M8.3 7.1l7 6.6"),
      ]),
    ],
    sAnims: { glyph: POP(12.5, 11.6, 1.12) },
  },

  // stacked sheets + note on the front one — the note sways
  "playlist01": {
    auto: false,
    dur: 1.6,
    parts: [
      rect(3.2, 8.6, 17.6, 12.6, 2.6),
      path("M5.4 8.6V7.4c0-1.4 1.1-2.5 2.5-2.5h8.2c1.4 0 2.5 1.1 2.5 2.5v1.2"),
      path("M7.6 4.9v-.4c0-1.2 1-2.1 2.1-2.1h4.6c1.2 0 2.1 1 2.1 2.1v.4"),
      G("note", [
        circle(10.4, 16.6, 1.5),
        path("M11.9 16.6v-5c.2.4.6 1.5 2.1 1.8"),
      ]),
    ],
    gAnims: { note: WIG(11, 16.8, 7) },
  },

  // front square + note, second square peeking bottom-right — note sways
    "playlist02": { dur: 1.6,
    auto: false,
    parts: [
    path("M18.1 6.6C19.3 6.8 20.2 7.2 20.8 7.8C21.6 8.6 22 9.8 22 12L22 16.6C22 18.8 21.6 20 20.8 20.8C20 21.6 18.8 22 16.6 22L12 22C9.8 22 8.6 21.6 7.8 20.8C7.2 20.2 6.8 19.3 6.6 18.1"),
    rect(2.4, 3, 15, 15, 3),
    G("note", [
      circle(8.8, 12.2, 1.7),
      path("M10.5 12.2L10.5 7C10.7 7.4 11.1 8.6 12.6 9"),
    ]),
  ],
    gAnims: { note: tn("rotate", ["0 9.7 12.4", "0 9.7 12.4", "-7 9.7 12.4", "5 9.7 12.4", "0 9.7 12.4"], [0, 0.3, 0.55, 0.8, 1]) } },

  // list lines + quaver — the note sways
  "playlist03": {
    auto: false,
    dur: 1.6,
    parts: [
      line(3.4, 4, 20.6, 4),
      line(3.4, 10.4, 15.2, 10.4),
      line(3.4, 16.8, 10, 16.8),
      G("note", [
        circle(15.3, 18.9, 2.9),
        path("M18.2 18.9V10.8c.4.6 1 2.6 3.3 3"),
      ]),
    ],
    gAnims: { note: WIG(15.8, 19.2, 7) },
  },

  // mic capsule inside a broadcast arc, caret foot — arc pulses outward
  "podcast": {
    auto: false,
    parts: [
      A(path("M4.2 16.8C3.5 15.4 3 13.8 3 12c0-5 4-9 9-9s9 4 9 9c0 1.8-.5 3.4-1.2 4.8"), [
        an("opacity", ["1", "0.45", "1"]),
      ]),
      path("M9.4 10.4a2.6 2.6 0 0 1 5.2 0v3.2a2.6 2.6 0 0 1-5.2 0z"),
      line(12, 16.4, 12, 19.2),
      path("M10.1 21.2l1.9-1.8 1.9 1.8z"),
    ],
  },

  // square receiver: antenna, speaker, two dashes — speaker thumps
  "radio": {
    auto: false,
    dur: 1.5,
    parts: [
      rect(2.9, 5.4, 18.2, 15.4, 3),
      A(circle(15.2, 13.1, 3.3), [an("r", ["3.3", "3.3", "3.9", "3.3", "3.3"], HOLD)]),
      line(9.8, 5.4, 14.2, 2.3),
      path("M5.4 11.4h1.8M5.4 14.6h1.8"),
    ],
  },

  // long-antenna receiver + slashed tuning dial (dial wiggles)
  "radio01": {
    auto: false,
    parts: [
      rect(2.9, 6.6, 18.2, 14.6, 2.8),
      circle(13.8, 13.9, 3.4),
      G("dial", [line(13.8, 13.9, 16.3, 11.4)]),
      line(6.8, 6.6, 16.6, 2.6),
      circle(6.4, 10.4, 0.9, fill()),
    ],
    gAnims: { dial: tn("rotate", ["0 13.8 13.9", "38 13.8 13.9", "-14 13.8 13.9", "0 13.8 13.9"], [0, 0.35, 0.7, 1]) },
  },

  // legged receiver + long antenna + dial + led — the LED blips
  "radio02": {
    auto: false,
    parts: [
      rect(2.9, 6.8, 18.2, 13, 2.6),
      path("M6.4 19.8v1.6M17.6 19.8v1.6"),
      line(5.6, 6.8, 18.4, 2.6),
      line(5.6, 11.4, 8.6, 11.4),
      circle(15.4, 13.4, 3),
      A(circle(6.4, 15.4, 0.9, fill()), BLINK(0.15)),
    ],
  },

  // concentric: checked radio state — the inner dot presses
  "radio-button": {
    auto: false,
    dur: 1.4,
    parts: [
      circle(12, 12, 8.7),
      A(circle(12, 12, 3.8), [an("r", ["3.8", "3.8", "3", "3.8", "3.8"], HOLD)]),
    ],
  },

  // broadcast waves muted by a slash — slash flashes
  "radio-off": {
    auto: false,
    parts: [
      SLASH(3, 3, 21, 21),
      path("M10.6 10.6c-.4.4-.6.9-.6 1.4s.2 1 .6 1.4.9.6 1.4.6 1-.2 1.4-.6"),
      path("M7.6 8.2c-1 1-1.6 2.3-1.6 3.8s.6 2.8 1.6 3.8"),
      path("M4.8 6c-1.5 1.5-2.4 3.6-2.4 6s.9 4.5 2.4 6"),
      path("M16.4 8.2c1 1 1.6 2.3 1.6 3.8 0 .5-.1 1-.2 1.5"),
      path("M19.2 6c1.5 1.5 2.4 3.6 2.4 6 0 1-.2 2-.5 2.9"),
    ],
  },

  // same receiver family, roomier dashes — speaker thumps
  "radio-receiver": {
    auto: false,
    dur: 1.5,
    parts: [
      rect(2.9, 5.6, 18.2, 15.2, 3),
      A(circle(15, 13.2, 3.4), [an("r", ["3.4", "3.4", "4", "3.4", "3.4"], HOLD)]),
      line(9.6, 5.6, 13.8, 2.2),
      path("M5.6 11.6h2M5.6 14.8h2"),
    ],
  },

  // tower mast + pulsing wave rings
  "radio-tower": {
    auto: false,
    parts: [
      circle(12, 8.2, 2),
      G("waveIn", [path("M8.8 11.4c-1.8-1.8-1.8-4.6 0-6.4M15.2 5c1.8 1.8 1.8 4.6 0 6.4")]),
      G("waveOut", [path("M6.4 13.8c-2.9-2.9-2.9-7.6 0-10.5M17.6 3.3c2.9 2.9 2.9 7.6 0 10.5")]),
      line(12, 10.6, 12, 20.8),
      line(8.8, 20.8, 15.2, 20.8),
    ],
    gAnims: {
      waveIn: an("opacity", ["1", "0.4", "1"], [0, 0.5, 1]),
      waveOut: an("opacity", ["0.4", "1", "0.4"], [0, 0.5, 1]),
    },
  },

  // trefoil: three fat arcs, gaps facing out — it rocks on its axis
  "radioactive-alert": {
    auto: false,
    dur: 1.9,
    parts: [
      G("rotor", [
        path("M9 3.4c-1.3.9-2.1 2.3-2.1 3.8 0 2.8 2.3 5.1 5.1 5.1s5.1-2.3 5.1-5.1c0-1.5-.8-2.9-2.1-3.8"),
        path("M20.9 12.9c-1-1.2-2.4-1.9-4-1.9-2.8 0-5 2.3-5 5s2.2 5 5 5c1.6 0 3-.7 4-1.9"),
        path("M3.1 12.9c1-1.2 2.4-1.9 4-1.9 2.8 0 5 2.3 5 5s-2.2 5-5 5c-1.6 0-3-.7-4-1.9"),
      ]),
    ],
    gAnims: {
      rotor: tn("rotate", ["0 12 12.6", "0 12 12.6", "-46 12 12.6", "34 12 12.6", "0 12 12.6"], HOLD),
    },
  },

  // one big soft dot, breathing
  "record": {
    auto: false,
    parts: [
      A(circle(12, 12, 8.4), [an("r", ["8.4", "8.9", "8.4"], [0, 0.55, 1])]),
    ],
  },

  // two chasing arrows, keeps turning
  "repeat": {
    pp: false,
    auto: false,
    parts: [
      G("spin", [
        path("M3.4 15.2C2.9 14.2 2.6 13.1 2.6 12c0-4 3.2-7.2 7.2-7.2h7.5"),
        path("M15.7 2.4l2.8 2.5-2.7 2.6"),
        path("M20.6 8.8c.5 1 .8 2.1.8 3.2 0 4-3.2 7.2-7.2 7.2H6.7"),
        path("M8.3 21.6l-2.8-2.5 2.7-2.6"),
      ]),
    ],
    gAnims: { spin: tn("rotate", ["0 12 12", "360 12 12"]) },
  },
};
