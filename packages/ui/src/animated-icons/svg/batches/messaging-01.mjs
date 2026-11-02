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

/* Shared silhouettes ------------------------------------------------ */

// Banana handset — smooth crescent, ear pad top-left, mouth pad bottom-right.
const BANANA =
  "M8.5 8.9C6.9 6.6 5.4 5.4 4.4 6.9 3.5 8.3 3.6 10.5 4.3 12.4 6.3 17.3 11 20 16.3 19.9c1.5 0 3.1-.9 3.3-2.3.1-1.2-1-2-2.4-2.2-2.4-.3-4.6-1.5-6.2-3.2-1-.9-1.8-2.1-2.5-3.3z";
// Padded handset — distinct earpiece/mouthpiece blocks (call02 family).
const HANDSET =
  "M5.3 4.2c.9-.1 1.8.3 2.3 1.1l1.2 1.9c.5.8.4 1.8-.2 2.4l-.9.8c-.6.5-.7 1.4-.2 2.1 1 1.6 2.3 2.9 3.9 3.7.7.4 1.6.3 2.2-.3l.8-.9c.6-.6 1.6-.7 2.4-.2l1.9 1.2c.8.5 1.3 1.4 1.2 2.3-.1 1-.9 1.9-1.9 2-8.8-.6-14-5.9-14.5-13.5-.1-1.6.6-3.1 1.8-3.6z";
// Cradle receiver — landline handset lying flat, ear bumps hanging at ends.
const RECEIVER =
  "M4.4 11.7v-1.8C4.4 7.3 7.8 5.1 12 5.1s7.6 2.2 7.6 4.8v1.8c0 .8-.7 1.5-1.5 1.5h-.4c-.8 0-1.5-.7-1.5-1.5v-.7c0-.6-.4-1.1-1-1.3-.9-.3-2-.4-3.2-.4-1.2 0-2.3.1-3.2.4-.6.2-1 .7-1 1.3v.7c0 .8-.7 1.5-1.5 1.5h-.4c-.8 0-1.5-.7-1.5-1.5z";
// Same receiver, shifted down for the missed-call pair (arrow sits above).
const RECEIVER_LO =
  "M4.4 19.6v-1.8C4.4 15.2 7.8 13 12 13s7.6 2.2 7.6 4.8v1.8c0 .8-.7 1.5-1.5 1.5h-.4c-.8 0-1.5-.7-1.5-1.5v-.7c0-.6-.4-1.1-1-1.3-.9-.3-2-.4-3.2-.4-1.2 0-2.3.1-3.2.4-.6.2-1 .7-1 1.3v.7c0 .8-.7 1.5-1.5 1.5h-.4c-.8 0-1.5-.7-1.5-1.5z";

// Bell dome — closed (full) and open top-right (badge pocket) variants.
const BELL =
  "M12 4.6c3.6 0 5.8 2.5 5.8 6 0 2.6.5 4 1.4 5.1.4.5-.1 1.1-.7 1.1H5.5c-.6 0-1.1-.6-.7-1.1.9-1.1 1.4-2.5 1.4-5.1 0-3.5 2.2-6 5.8-6z";
const BELL_CUT =
  "M14.2 4.9c-.7-.2-1.4-.3-2.2-.3-3.6 0-5.8 2.5-5.8 6 0 2.6-.5 4-1.4 5.1-.4.5.1 1.1.7 1.1h13c.6 0 1.1-.6.7-1.1-.9-1.1-1.4-2.5-1.4-5.1 0-.6 0-1.2-.1-1.7";
const CLAPPER = "M10.6 18.8a1.4 1.4 0 0 0 2.8 0";

// Badge marks for the top-right pocket.
const PLUS = [line(15.9, 6.5, 20.7, 6.5), line(18.3, 4.1, 18.3, 8.9)];
const MINUS = [line(15.9, 6.5, 20.7, 6.5)];
const CHECK = [path("M15.2 6.9l1.9 1.9 3.8-4.3")];
const CROSS = [line(15.9, 4.5, 20.3, 8.9), line(20.3, 4.5, 15.9, 8.9)];
const BLOCK = [circle(18.1, 6.6, 2.8), line(16.2, 4.7, 20, 8.5)];
const SLASH = [line(20.2, 3.6, 4.4, 19.6)];
const PAUSE = [line(16.6, 4, 16.6, 8.8), line(19.8, 4, 19.8, 8.8)];
const LOCK = [
  path("M15.7 6.6h4.6c.6 0 1 .4 1 1v1.9c0 .6-.4 1-1 1h-4.6c-.6 0-1-.4-1-1V7.6c0-.6.4-1 1-1z"),
  path("M16.7 6.6V5.4c0-1 .7-1.7 1.7-1.7s1.7.7 1.7 1.7v1.2"),
];

// Curly-tailed horizontal arrows (01 variants).
const IN_CURLY = [
  path("M16.4 9.5c-.9-.8-2.6-2-2.6-3.2s1.7-2.4 2.6-3.2"),
  line(14.6, 6.3, 21.1, 6.3),
];
const OUT_CURLY = [
  path("M17.4 9.5c.9-.8 2.6-2 2.6-3.2s-1.7-2.4-2.6-3.2"),
  line(13.9, 6.3, 20.4, 6.3),
];
// Diagonal arrows with soft wings (02 variants).
const IN_DIAG = [
  line(20.6, 3.7, 14.2, 10.1),
  path("M18.7 9.8c-1.4.2-3.9.6-4.7-.1-.7-.8-.3-3.3-.1-4.7"),
];
const OUT_DIAG = [
  line(14.4, 10.4, 20.6, 4.2),
  path("M15.3 4.1c1.4-.1 3.9-.5 4.7.2.7.8.2 3.3 0 4.7"),
];
// Straight arrows with chevron heads (03 variants).
const IN_ARROW = [
  line(14.8, 5.9, 21, 5.9),
  path("M17.2 3.6c-.8.8-1.6 1.5-2.4 2.3 0 0 1.6 1.5 2.4 2.3"),
];
const OUT_ARROW = [
  line(14.2, 5.9, 20.4, 5.9),
  path("M18 3.6c.8.8 1.6 1.5 2.4 2.3 0 0-1.6 1.5-2.4 2.3"),
];
// Diagonal arrows with crisp L-corner heads (04 variants).
const IN_CORNER = [
  line(20.7, 3.3, 15, 9),
  path("M14.6 4.6V9h4.4"),
];
const OUT_CORNER = [
  line(14.6, 10.1, 20.6, 4.1),
  path("M15.8 3.7h4.4v4.4"),
];
// Bounce arrows for missed calls.
const BOUNCE_HI = [
  path("M16.5 5.8h-3.7v3.7"),
  path("M13 6.2l3.7 3.7c.3.3.8.3 1.1 0l2.9-2.9"),
];
const BOUNCE_LO = [
  path("M10.9 5.5H7.2v3.7"),
  path("M7.5 5.8l4.1 4.1c.3.3.8.3 1.1 0l4.4-4.4"),
];
// Opposing curly heads = internal/transfer.
const INTERNAL_CURLY = [
  path("M14.9 9.3c-.8-.7-2.4-1.8-2.4-2.8s1.6-2.1 2.4-2.8"),
  path("M18.4 9.3c.8-.7 2.4-1.8 2.4-2.8s-1.6-2.1-2.4-2.8"),
  line(12.9, 6.5, 20.9, 6.5),
];
const INTERNAL_CHEVRON = [
  line(14.8, 6.5, 20.8, 6.5),
  path("M19.3 4.7l1.8 1.8-1.8 1.8"),
  path("M16.3 4.7l-1.8 1.8 1.8 1.8"),
];
// Down arrows under the cradle receiver.
const DOWN_SOFT = [
  path("M8.7 15.4c.9 1 2.4 3.4 3.3 3.4s2.4-2.4 3.3-3.4"),
  line(12, 18.6, 12, 11.8),
];
const DOWN_CHEVRON = [path("M9.7 16.5l2.3 2.4 2.3-2.4"), line(12, 12.2, 12, 19.1)];

/* gesture recipes — one signature verb per icon; pose(t=0) = pose(t=1). */
const DO = { pathLength: 1, "stroke-dasharray": 1 };
const draw = (a = 0.12, b = 0.7) => [an("stroke-dashoffset", ["1", "1", "0"], [0, a, b])];
const popAt = (px, py, s = 1.18) => ({
  pivot: [px, py],
  anim: tn("scale", ["1", "1", String(s), "1", "1"], [0, 0.3, 0.5, 0.7, 1]),
});
const BELL_SWING = tn("rotate", ["0 12 4.5", "-9 12 4.5", "6 12 4.5", "0 12 4.5"], [0, 0.3, 0.6, 1]);

export const icons = {
  /* ---------- contacts & alerts ---------- */

    "address-book": { dur: 1.6,
    auto: false,
    parts: [
    rect(5.5, 3.1, 14.6, 17.8, 2.6),
    line(5.5, 6.6, 3.9, 6.6),
    line(5.5, 12, 3.9, 12),
    line(5.5, 17.4, 3.9, 17.4),
    /* a contact card figure — the old @ glyph turned to mush below 24px */
    G("at", [
      circle(12.8, 10.2, 2.4),
      path("M9 16.8c.7-2 2.1-3.1 3.8-3.1s3.1 1.1 3.8 3.1"),
    ]),
  ],
    gAnims: { at: tn("rotate", ["0 12.8 13", "-8 12.8 13", "8 12.8 13", "0 12.8 13"], [0, 0.3, 0.6, 1]) } },

  "alert-circle": {
    auto: false,
    parts: [circle(12, 12, 8.8), G("bang", [line(12, 7.6, 12, 12.4), circle(12, 16.3, 1.15, fill())])],
    sAnims: { bang: popAt(12, 12, 1.15) },
  },

  "alert-diamond": {
    auto: false,
    parts: [
      path(
        "M12 3c.9 0 1.7.3 2.3.9l5.7 5.7c.6.6.9 1.4.9 2.3s-.3 1.7-.9 2.3l-5.7 5.7c-.6.6-1.4.9-2.3.9s-1.7-.3-2.3-.9l-5.7-5.7c-.6-.6-.9-1.4-.9-2.3s.3-1.7.9-2.3L9.7 3.9C10.3 3.3 11.1 3 12 3z"
      ),
      G("bang", [line(12, 8.2, 12, 12.6), circle(12, 15.9, 1.15, fill())]),
    ],
    sAnims: { bang: popAt(12, 12, 1.15) },
  },

  "alert-square": {
    auto: false,
    parts: [
      rect(3.2, 3.2, 17.6, 17.6, 4.6),
      G("bang", [line(12, 8, 12, 12.4), circle(12, 16, 1.15, fill())]),
    ],
    sAnims: { bang: popAt(12, 12, 1.15) },
  },

  alert01: {
    auto: false,
    parts: [
      path(
        "M12 3.4c.8 0 1.6.5 2.1 1.2l5.7 10.2c.6 1.1.5 2.5-.4 3.5-.5.5-1.2.9-1.9.9H6.5c-.7 0-1.4-.4-1.9-.9-.9-1-1-2.4-.4-3.5l5.7-10.2c.5-.7 1.3-1.2 2.1-1.2z"
      ),
      G("bang", [circle(12, 9.6, 1.15, fill()), line(12, 13.2, 12, 16.8)]),
    ],
    sAnims: { bang: popAt(12, 13, 1.15) },
  },

  alert02: {
    auto: false,
    parts: [
      path(
        "M12 3.4c.8 0 1.6.5 2.1 1.2l5.7 10.2c.6 1.1.5 2.5-.4 3.5-.5.5-1.2.9-1.9.9H6.5c-.7 0-1.4-.4-1.9-.9-.9-1-1-2.4-.4-3.5l5.7-10.2c.5-.7 1.3-1.2 2.1-1.2z"
      ),
      G("bang", [line(12, 8.4, 12, 12.6), circle(12, 16.1, 1.15, fill())]),
    ],
    sAnims: { bang: popAt(12, 12, 1.15) },
  },

  antenna: {
    auto: false,
    dur: 1.7,
    parts: [
      line(12, 4.5, 12, 20.5),
      line(8, 20.5, 16, 20.5),
      A(line(5, 7, 19, 7), [an("opacity", ["1", "0.3", "1", "1"], [0, 0.2, 0.4, 1])]),
      A(line(7, 11, 17, 11), [an("opacity", ["1", "1", "0.3", "1", "1"], [0, 0.25, 0.4, 0.6, 1])]),
      A(line(9, 15, 15, 15), [an("opacity", ["1", "1", "0.3", "1", "1"], [0, 0.45, 0.6, 0.8, 1])]),
    ],
  },

  /* ---------- bells ---------- */

  "bell-dot": {
    auto: false,
    parts: [
      G("swing", [path(BELL_CUT), path(CLAPPER)]),
      A(circle(19, 5, 1.8, fill()), [an("r", ["1.8", "1.8", "2.3", "1.8", "1.8"], [0, 0.3, 0.5, 0.7, 1])]),
    ],
    gAnims: { swing: BELL_SWING },
  },

  "bell-electric": {
    auto: false,
    dur: 1.6,
    parts: [
      circle(9.4, 9.2, 6.4),
      circle(9.4, 9.2, 1.15, fill()),
      rect(3.4, 15.4, 10.8, 4.8, 1.9),
      G("striker", [circle(19.2, 13.6, 1.85), path("M18.9 15.3c-.8 1.2-2.2 2.2-3.9 2.5")]),
    ],
    gAnims: {
      striker: tn("translate", ["0 0", "-0.9 0", "0 0", "-0.9 0", "0 0", "0 0"], [0, 0.12, 0.24, 0.36, 0.5, 1]),
    },
  },

  "bell-minus": {
    auto: false,
    parts: [
      G("swing", [path(BELL_CUT), path(CLAPPER)]),
      A(line(15.9, 6.5, 20.7, 6.5, DO), draw()),
    ],
    gAnims: { swing: BELL_SWING },
  },

  "bell-off": {
    auto: false,
    parts: [
      G("swing", [path(BELL), path(CLAPPER)]),
      A(line(3.8, 2.8, 20.4, 21.2, DO), draw()),
    ],
    gAnims: { swing: BELL_SWING },
  },

  "bell-plus": {
    auto: false,
    parts: [
      G("swing", [path(BELL_CUT), path(CLAPPER)]),
      G("plus", PLUS),
    ],
    gAnims: {
      swing: BELL_SWING,
      plus: tn("rotate", ["0 18.3 6.5", "90 18.3 6.5"]),
    },
  },

  "bell-ring": {
    auto: false,
    dur: 1.75,
    parts: [
      G("swing", [path(BELL), path(CLAPPER)]),
      A(path("M19.9 3.4c1.2 1.6 1.8 3.5 1.8 5.6"), [
        an("opacity", ["1", "0.35", "1"], [0, 0.5, 1]),
      ]),
      A(path("M4.1 3.4c-1.2 1.6-1.8 3.5-1.8 5.6"), [
        an("opacity", ["1", "0.35", "1"], [0, 0.5, 1]),
      ]),
    ],
    gAnims: {
      swing: tn("rotate", ["0 12 4.5", "-10 12 4.5", "7 12 4.5", "-3 12 4.5", "0 12 4.5"], [
        0, 0.25, 0.55, 0.8, 1,
      ]),
    },
  },

  /* ---------- banana handset family ---------- */

  call: {
    auto: false,
    dur: 1.6,
    parts: [
      G("ring", [
        /* crescent handset with distinct ear/mouth pads and seams */
        path("M6.9 4.2c.8-.4 1.8-.3 2.5.4l1.2 1.4c.6.7.7 1.7.2 2.4l-.7.9c-.5.6-.5 1.4 0 2.1 1.2 1.7 2.8 3.1 4.6 3.9.7.3 1.5.2 2-.4l.9-.8c.7-.6 1.7-.6 2.4 0l1.4 1.2c.7.6.9 1.7.4 2.5-1 2-3.1 3.1-5.3 2.9-7.1-.5-12.8-6.2-13.2-13.3-.2-1.6.7-3.1 2.3-3.7l1.5-.5z"),
        path("M8.6 6.7l1.7 1.5"),
        path("M15.4 15.1l1.6 1.7"),
      ]),
    ],
    gAnims: {
      ring: tn("rotate", ["0 12 14", "-8 12 14", "6 12 14", "-3 12 14", "0 12 14"], [
        0, 0.22, 0.5, 0.78, 1,
      ]),
    },
  },

  "call-add": {
    auto: false,
    parts: [path(BANANA), G("badge", PLUS)],
    gAnims: { badge: tn("rotate", ["0 18.3 6.5", "90 18.3 6.5"]) },
  },
  "call-blocked": {
    auto: false,
    parts: [path(BANANA), circle(18.1, 6.6, 2.8), A(line(16.2, 4.7, 20, 8.5, DO), draw())],
  },
  "call-disabled": { dur: 1.4, auto: true, parts: [
    path("M6.9 4.2C7.7 3.8 8.7 3.9 9.4 4.6L10.6 6C11.2 6.7 11.3 7.7 10.8 8.4L10.1 9.3C9.6 9.9 9.6 10.7 10.1 11.4C11.3 13.1 12.9 14.5 14.7 15.3C15.4 15.6 16.2 15.5 16.7 14.9L17.6 14.1C18.3 13.5 19.3 13.5 20 14.1L21.4 15.3C22.1 15.9 22.3 17 21.8 17.8C20.8 19.8 18.7 20.9 16.5 20.7C9.4 20.2 3.7 14.5 3.3 7.4C3.1 5.8 4 4.3 5.6 3.7L7.1 3.2Z", { transform: "translate(0.3 1) scale(0.88)" }),
    line(3.5, 3.5, 20.5, 20.5),
  ] },
  "call-done": {
    auto: false,
    parts: [path(BANANA), A(path("M15.2 6.9l1.9 1.9 3.8-4.3", DO), draw())],
  },
  "call-end01": {
    auto: false,
    parts: [
      path(BANANA),
      A(line(15.9, 4.5, 20.3, 8.9, DO), draw(0.08, 0.5)),
      A(line(20.3, 4.5, 15.9, 8.9, DO), draw(0.25, 0.7)),
    ],
  },
  "call-locked": {
    auto: false,
    parts: [path(BANANA), G("badge", LOCK)],
    sAnims: { badge: popAt(18, 7.5) },
  },
  "call-minus": {
    auto: false,
    parts: [path(BANANA), A(line(15.9, 6.5, 20.7, 6.5, DO), draw())],
  },
  "call-missed01": {
    auto: false,
    parts: [path(BANANA), G("miss", BOUNCE_HI)],
    gAnims: { miss: tn("translate", ["0 0", "0 1.3", "0 0"], [0, 0.45, 1]) },
  },

  "call-incoming01": {
    auto: false,
    parts: [path(BANANA), G("io", IN_CURLY)],
    gAnims: { io: tn("translate", ["0 0", "-1.1 0", "0 0"], [0, 0.45, 1]) },
  },
  "call-incoming02": {
    auto: false,
    parts: [path(BANANA), G("io", IN_DIAG)],
    gAnims: { io: tn("translate", ["0 0", "-1.1 1.1", "0 0"], [0, 0.45, 1]) },
  },
  "call-internal": {
    auto: false,
    parts: [
      path(BANANA),
      G("l", [path("M14.9 9.3c-.8-.7-2.4-1.8-2.4-2.8s1.6-2.1 2.4-2.8")]),
      G("r", [path("M18.4 9.3c.8-.7 2.4-1.8 2.4-2.8s-1.6-2.1-2.4-2.8")]),
      line(12.9, 6.5, 20.9, 6.5),
    ],
    gAnims: {
      l: tn("translate", ["0 0", "0.9 0", "0 0"], [0, 0.45, 1]),
      r: tn("translate", ["0 0", "-0.9 0", "0 0"], [0, 0.45, 1]),
    },
  },
  "call-outgoing01": {
    auto: false,
    parts: [path(BANANA), G("io", OUT_CURLY)],
    gAnims: { io: tn("translate", ["0 0", "1.1 0", "0 0"], [0, 0.45, 1]) },
  },
  "call-outgoing02": {
    auto: false,
    parts: [path(BANANA), G("io", OUT_DIAG)],
    gAnims: { io: tn("translate", ["0 0", "1.1 -1.1", "0 0"], [0, 0.45, 1]) },
  },

  /* ---------- padded handset family ---------- */

  call02: {
    auto: false,
    dur: 1.6,
    parts: [G("ring", [path(HANDSET)])],
    gAnims: {
      ring: tn("rotate", ["0 12 14", "-8 12 14", "6 12 14", "-3 12 14", "0 12 14"], [
        0, 0.22, 0.5, 0.78, 1,
      ]),
    },
  },

  "call-add02": {
    auto: false,
    parts: [path(HANDSET), G("badge", PLUS)],
    gAnims: { badge: tn("rotate", ["0 18.3 6.5", "90 18.3 6.5"]) },
  },
  "call-blocked02": {
    auto: false,
    parts: [path(HANDSET), circle(18.1, 6.6, 2.8), A(line(16.2, 4.7, 20, 8.5, DO), draw())],
  },
  "call-disabled02": { dur: 1.4, auto: true, parts: [
    path("M6.9 4.2C7.7 3.8 8.7 3.9 9.4 4.6L10.6 6C11.2 6.7 11.3 7.7 10.8 8.4L10.1 9.3C9.6 9.9 9.6 10.7 10.1 11.4C11.3 13.1 12.9 14.5 14.7 15.3C15.4 15.6 16.2 15.5 16.7 14.9L17.6 14.1C18.3 13.5 19.3 13.5 20 14.1L21.4 15.3C22.1 15.9 22.3 17 21.8 17.8C20.8 19.8 18.7 20.9 16.5 20.7C9.4 20.2 3.7 14.5 3.3 7.4C3.1 5.8 4 4.3 5.6 3.7L7.1 3.2Z", { transform: "translate(-0.2 3) scale(0.8)" }),
    circle(17.5, 6.5, 4),
    line(14.7, 9.3, 20.3, 3.7),
  ] },
  "call-done02": {
    auto: false,
    parts: [path(HANDSET), A(path("M15.2 6.9l1.9 1.9 3.8-4.3", DO), draw())],
  },
  "call-end03": {
    auto: false,
    parts: [
      path(HANDSET),
      A(line(15.9, 4.5, 20.3, 8.9, DO), draw(0.08, 0.5)),
      A(line(20.3, 4.5, 15.9, 8.9, DO), draw(0.25, 0.7)),
    ],
  },
  "call-locked02": {
    auto: false,
    parts: [path(HANDSET), G("badge", LOCK)],
    sAnims: { badge: popAt(18, 7.5) },
  },
  "call-minus02": {
    auto: false,
    parts: [path(HANDSET), A(line(15.9, 6.5, 20.7, 6.5, DO), draw())],
  },
  "call-missed03": {
    auto: false,
    parts: [path(HANDSET), G("miss", BOUNCE_HI)],
    gAnims: { miss: tn("translate", ["0 0", "0 1.3", "0 0"], [0, 0.45, 1]) },
  },

  "call-incoming03": {
    auto: false,
    parts: [path(HANDSET), G("io", IN_ARROW)],
    gAnims: { io: tn("translate", ["0 0", "-1.1 0", "0 0"], [0, 0.45, 1]) },
  },
  "call-incoming04": {
    auto: false,
    parts: [path(HANDSET), G("io", IN_CORNER)],
    gAnims: { io: tn("translate", ["0 0", "-1.1 1.1", "0 0"], [0, 0.45, 1]) },
  },
  "call-internal02": {
    auto: false,
    parts: [
      path(HANDSET),
      line(14.8, 6.5, 20.8, 6.5),
      G("r", [path("M19.3 4.7l1.8 1.8-1.8 1.8")]),
      G("l", [path("M16.3 4.7l-1.8 1.8 1.8 1.8")]),
    ],
    gAnims: {
      l: tn("translate", ["0 0", "0.9 0", "0 0"], [0, 0.45, 1]),
      r: tn("translate", ["0 0", "-0.9 0", "0 0"], [0, 0.45, 1]),
    },
  },
  "call-outgoing03": {
    auto: false,
    parts: [path(HANDSET), G("io", OUT_ARROW)],
    gAnims: { io: tn("translate", ["0 0", "1.1 0", "0 0"], [0, 0.45, 1]) },
  },
  "call-outgoing04": {
    auto: false,
    parts: [path(HANDSET), G("io", OUT_CORNER)],
    gAnims: { io: tn("translate", ["0 0", "1.1 -1.1", "0 0"], [0, 0.45, 1]) },
  },
  "call-paused02": {
    auto: false,
    parts: [
      path(HANDSET),
      A(line(16.6, 4, 16.6, 8.8), [an("opacity", ["1", "0.25", "1"], [0, 0.25, 0.55])]),
      A(line(19.8, 4, 19.8, 8.8), [an("opacity", ["1", "0.25", "1"], [0.35, 0.6, 0.9])]),
    ],
  },

  /* ---------- cradle receiver family ---------- */

  "call-end02": { dur: 1.4, auto: true, parts: [
    path("M2.8 14.3C4.6 9.3 19.4 9.3 21.2 14.3 21.5 15.1 21 16 20.1 16.4L17.5 17.4C16.6 17.7 15.8 17.3 15.5 16.5L14.9 15C14.7 14.3 14.1 14 13.5 13.9 12.4 13.7 11.6 13.7 10.5 13.9 9.9 14 9.3 14.3 9.1 15L8.5 16.5C8.2 17.3 7.4 17.7 6.5 17.4L3.9 16.4C3 16 2.5 15.1 2.8 14.3Z"),
  ] },
  "call-end04": { dur: 1.4, auto: true, parts: [
    circle(12, 12, 9.5),
    path("M6.4 13.4C7.6 10.4 16.4 10.4 17.6 13.4 17.8 13.9 17.5 14.5 17 14.7L15.5 15.3C15 15.5 14.5 15.2 14.3 14.8L14 14C13.9 13.6 13.5 13.4 13.1 13.3 12.4 13.2 11.6 13.2 10.9 13.3 10.5 13.4 10.1 13.6 10 14L9.7 14.8C9.5 15.2 9 15.5 8.5 15.3L7 14.7C6.5 14.5 6.2 13.9 6.4 13.4Z"),
  ] },
    "call-missed02": { auto: false,
    parts: [
    path("M4.4 18.21L4.4 16.41C4.4 13.81 7.8 11.61 12 11.61S19.6 13.81 19.6 16.41L19.6 18.21C19.6 19.01 18.9 19.71 18.1 19.71L17.7 19.71C16.9 19.71 16.2 19.01 16.2 18.21L16.2 17.51C16.2 16.91 15.8 16.41 15.2 16.21C14.3 15.91 13.2 15.81 12 15.81C10.8 15.81 9.7 15.91 8.8 16.21C8.2 16.41 7.8 16.91 7.8 17.51L7.8 18.21C7.8 19.01 7.1 19.71 6.3 19.71L5.9 19.71C5.1 19.71 4.4 19.01 4.4 18.21Z"),
    G("miss", [
      path("M10.9 4.11L7.2 4.11L7.2 7.81"),
      path("M7.5 4.41L11.6 8.51C11.9 8.81 12.4 8.81 12.7 8.51L17.1 4.11"),
    ]),
  ],
    gAnims: { miss: tn("translate", ["0 0", "0 1.3", "0 0"], [0, 0.45, 1]) } },
    "call-missed04": { auto: false,
    parts: [
    path("M4.4 18.33L4.4 16.53C4.4 13.93 7.8 11.73 12 11.73S19.6 13.93 19.6 16.53L19.6 18.33C19.6 19.13 18.9 19.83 18.1 19.83L17.7 19.83C16.9 19.83 16.2 19.13 16.2 18.33L16.2 17.63C16.2 17.03 15.8 16.53 15.2 16.33C14.3 16.03 13.2 15.93 12 15.93C10.8 15.93 9.7 16.03 8.8 16.33C8.2 16.53 7.8 17.03 7.8 17.63L7.8 18.33C7.8 19.13 7.1 19.83 6.3 19.83L5.9 19.83C5.1 19.83 4.4 19.13 4.4 18.33Z"),
    G("miss", [
      path("M10.9 4.23L7.2 4.23L7.2 7.93"),
      path("M7.5 4.53L11.6 8.63C11.9 8.93 12.4 8.93 12.7 8.63L17.1 4.23"),
    ]),
  ],
    gAnims: { miss: tn("translate", ["0 0", "0 1.3", "0 0"], [0, 0.45, 1]) } },

};
