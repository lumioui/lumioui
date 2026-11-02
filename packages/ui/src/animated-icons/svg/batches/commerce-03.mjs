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

/* Shared vocabulary — banknote bodies + corner flourishes redrawn in the
 * Lumio blob language. The straight note is a 19×14 soft rect; the wavy
 * one is the same flag mid-wave. Corner arcs sit on the note edges. */

const NOTE =
  "M5 5h14c1.4 0 2.5 1.1 2.5 2.5v9c0 1.4-1.1 2.5-2.5 2.5H5c-1.4 0-2.5-1.1-2.5-2.5v-9C2.5 6.1 3.6 5 5 5z";
const ARCS =
  "M2.5 8.5c1.7 0 3-1.3 3-3M18.5 5.5c0 1.7 1.3 3 3 3M21.5 15.5c-1.7 0-3 1.3-3 3M5.5 18.5c0-1.7-1.3-3-3-3";
const ARCS_NO_BR =
  "M2.5 8.5c1.7 0 3-1.3 3-3M18.5 5.5c0 1.7 1.3 3 3 3M5.5 18.5c0-1.7-1.3-3-3-3";
const NOTE_OPEN =
  "M21.5 12V7.5C21.5 6.1 20.4 5 19 5H5C3.6 5 2.5 6.1 2.5 7.5v9c0 1.4 1.1 2.5 2.5 2.5h10";
const WAVE =
  "M3.4 8.4c0-1 .7-1.6 1.7-1.5 4.4.6 9.3-1.7 13.8-2.3 1-.1 1.8.6 1.8 1.6v9.6c0 1-.8 1.7-1.8 1.6-4.5-.6-9.4-2.8-13.8-2.1-.9.1-1.7-.5-1.7-1.5V8.4z";
const WARCS =
  "M3.4 10c1.7-.1 3.1-1.5 3.4-3.3M16.5 4.8c.3 1.8 1.9 3.2 3.9 3.5M20.7 13.5c-.4 1.8-2 3.1-4 3.4M7.2 15.4c-.3-1.7-1.8-3-3.7-3.2";
const WAVE_OPEN =
  "M20.7 11.4V6.2c0-1-.8-1.7-1.8-1.6-4.5.6-9.4-2.9-13.8 2.3-1-.1-1.7.5-1.7 1.5v5.4c0 1 .8 1.6 1.7 1.5 4.2.7 7.6 1.6 10.4 2";
const WARCS_NO_BR =
  "M3.4 10c1.7-.1 3.1-1.5 3.4-3.3M16.5 4.8c.3 1.8 1.9 3.2 3.9 3.5M7.2 15.4c-.3-1.7-1.8-3-3.7-3.2";

/* Receipt zigzag — two soft humps dipping at ends + centre. */
const ZAG =
  "c0 1 .1 1.6.6 1.9.6.4 1.5-.1 2.1-.6.4-.4.8-.6 1.1-.6.3 0 .7.1 1.2.6l1.5 1.2c.5.4.8.6 1 .6.3 0 .5-.2 1-.6l1.5-1.2c.5-.5.9-.6 1.2-.6.3 0 .7.2 1.1.6.6.5 1.5 1 2.1.6.5-.3.6-.9.6-1.9";

/* Rolled top-right corner shared by invoice / invoice03. */
const ROLL = "M20 3.5c-1.4.2-2.5 1.9-2.5 4.3h4.1c.9 0 1.5-.6 1.2-1.4-.3-1.5-1.4-2.7-2.8-2.9z";

/* Big $ (circle/square receive) and mini $ (invoice lines). */
const DOLLAR_LG =
  "M13.7 10c-.4-.8-1-1.1-1.7-1.1-.9 0-1.5.6-1.5 1.3 0 .9.8 1.3 1.7 1.4.9.1 1.5.7 1.5 1.5 0 .7-.7 1.3-1.7 1.3-.8 0-1.5-.4-1.7-1.2M12 8.1v.7M12 15v.7";
const DOLLAR_MED =
  "M13.6 10.3c-.3-.8-.9-1.2-1.5-1.2-.8 0-1.4.5-1.4 1.3 0 .7.7 1.2 1.5 1.3.8.1 1.4.6 1.4 1.3 0 .7-.7 1.3-1.5 1.3-.7 0-1.3-.4-1.5-1.1M12 8.9v.7M12 14.9v.8";
const DOLLAR_SM =
  "M14.9 11.2c-.2-.5-.6-.8-1-.8-.5 0-1 .4-1 .9 0 .6.5.9 1.1 1 .6.1 1.1.5 1.1 1.1 0 .5-.5 1-1.1 1-.5 0-.9-.3-1.1-.8M14 10v.6M13.9 14.6v.6";

/* Receive arrowhead — a soft chevron pointing down. */
const ARROW_DOWN = "M9.6 5.2c.9 1.1 1.7 2 2.4 2s1.5-.9 2.4-2";
/* Diagonal receive arrow + its open-corner head (in from top-right). */
const ARROW_IN = "M21 3l-3.6 3.7";
const ARROW_IN_HEAD = "M16.8 4.2l.1 1.8c0 .7.5 1.2 1.1 1.3l2.5.2";

/* gesture idioms */
const dip = (dx, dy) => tn("translate", ["0 0", `${dx} ${dy}`, "0 0"]);
const sway = (cx, cy, deg) =>
  tn("rotate", [`0 ${cx} ${cy}`, `${-deg} ${cx} ${cy}`, `${deg * 0.8} ${cx} ${cy}`, `0 ${cx} ${cy}`], [0, 0.3, 0.65, 1]);
const throb = (cx, cy, s = 1.22) => ({ pivot: [cx, cy], anim: tn("scale", ["1", `${s}`, "1"]) });
const shake = (cx, cy, deg = 9) =>
  tn("rotate", [`0 ${cx} ${cy}`, `${-deg} ${cx} ${cy}`, `${deg} ${cx} ${cy}`, `0 ${cx} ${cy}`], [0, 0.22, 0.5, 1]);
const drawOn = (len, t0 = 0.1, t1 = 0.75) => an("stroke-dashoffset", [String(len), String(len), "0"], [0, t0, t1]);
const sealPulse = (cx, cy, r) => A(circle(cx, cy, r), [an("r", [String(r), String(r + 0.5), String(r)])]);
const drip = (t) => [
  tn("translate", ["0 0", "0 1.4", "0 1.4"], [0, t, 1]),
  an("opacity", ["0.25", "1", "0.25"], [0, t, 1]),
];

export const icons = {
  /* flat receipt, zigzag bottom, $ centrepiece */
    "invoice": { dur: 1.5,
    auto: false,
    parts: [
    path("M18.24 2.75L4.94 2.75C3.74 2.75 2.74 3.75 2.74 4.95L2.74 18.15C2.74 19.15 2.84 19.75 3.34 20.05C3.94 20.45 4.84 19.95 5.44 19.45C5.84 19.05 6.24 18.85 6.54 18.85C6.84 18.85 7.24 18.95 7.74 19.45L9.24 20.65C9.74 21.05 10.04 21.25 10.24 21.25C10.54 21.25 10.74 21.05 11.24 20.65L12.74 19.45C13.24 18.95 13.64 18.85 13.94 18.85C14.24 18.85 14.64 19.05 15.04 19.45C15.64 19.95 16.54 20.45 17.14 20.05C17.64 19.75 17.74 19.15 17.74 18.15L17.74 7.05"),
    path("M18.24 2.75C16.84 2.95 15.74 4.65 15.74 7.05L19.84 7.05C20.74 7.05 21.34 6.45 21.04 5.65C20.74 4.15 19.64 2.95 18.24 2.75Z"),
    G("stamp", [
      path("M11.84 9.55C11.54 8.75 10.94 8.35 10.34 8.35C9.54 8.35 8.94 8.85 8.94 9.65C8.94 10.35 9.64 10.85 10.44 10.95C11.24 11.05 11.84 11.55 11.84 12.25C11.84 12.95 11.14 13.55 10.34 13.55C9.64 13.55 9.04 13.15 8.84 12.45M10.24 8.15L10.24 8.85M10.24 14.15L10.24 14.95"),
    ]),
  ],
    sAnims: { stamp: { pivot: [10.24, 11.65], anim: tn("scale", ["1", "1.18", "1"]) } } },

  /* plain receipt + text + $ */
    "invoice02": { dur: 1.7,
    auto: false,
    parts: [
    path("M16.2 2.5L5.6 2.5C4.4 2.5 3.4 3.5 3.4 4.7L3.4 18.4C3.4 19.4 3.5 20 4 20.3C4.6 20.7 5.5 20.2 6.1 19.7C6.5 19.3 6.9 19.1 7.2 19.1C7.5 19.1 7.9 19.2 8.4 19.7L9.9 20.9C10.4 21.3 10.7 21.5 10.9 21.5C11.2 21.5 11.4 21.3 11.9 20.9L13.4 19.7C13.9 19.2 14.3 19.1 14.6 19.1C14.9 19.1 15.3 19.3 15.7 19.7C16.3 20.2 17.2 20.7 17.8 20.3C18.3 20 18.4 19.4 18.4 18.4L18.4 4.7C18.4 3.5 19.4 2.5 20.6 2.5Z"),
    A(path("M6.9 6L14.9 6", { "stroke-dasharray": 8 }), [an("stroke-dashoffset", ["8", "8", "0"], [0, 0.08, 0.5])]),
    A(path("M6.9 9.5L9.4 9.5", { "stroke-dasharray": 2.5 }), [an("stroke-dashoffset", ["2.5", "2.5", "0"], [0, 0.3, 0.62])]),
    path("M13.8 10.7C13.6 10.2 13.2 9.9 12.8 9.9C12.3 9.9 11.8 10.3 11.8 10.8C11.8 11.4 12.3 11.7 12.9 11.8C13.5 11.9 14 12.3 14 12.9C14 13.4 13.5 13.9 12.9 13.9C12.4 13.9 12 13.6 11.8 13.1M12.9 9.5L12.9 10.1M12.8 14.1L12.8 14.7"),
  ] },

  /* rolled receipt + text + $ */
    "invoice03": { dur: 1.7,
    auto: false,
    parts: [
    path("M18.24 2.75L4.94 2.75C3.74 2.75 2.74 3.75 2.74 4.95L2.74 18.15C2.74 19.15 2.84 19.75 3.34 20.05C3.94 20.45 4.84 19.95 5.44 19.45C5.84 19.05 6.24 18.85 6.54 18.85C6.84 18.85 7.24 18.95 7.74 19.45L9.24 20.65C9.74 21.05 10.04 21.25 10.24 21.25C10.54 21.25 10.74 21.05 11.24 20.65L12.74 19.45C13.24 18.95 13.64 18.85 13.94 18.85C14.24 18.85 14.64 19.05 15.04 19.45C15.64 19.95 16.54 20.45 17.14 20.05C17.64 19.75 17.74 19.15 17.74 18.15L17.74 7.05"),
    path("M18.24 2.75C16.84 2.95 15.74 4.65 15.74 7.05L19.84 7.05C20.74 7.05 21.34 6.45 21.04 5.65C20.74 4.15 19.64 2.95 18.24 2.75Z"),
    A(path("M5.24 5.75L10.24 5.75", { "stroke-dasharray": 5 }), [an("stroke-dashoffset", ["5", "5", "0"], [0, 0.08, 0.5])]),
    A(path("M5.24 9.25L7.74 9.25", { "stroke-dasharray": 2.5 }), [an("stroke-dashoffset", ["2.5", "2.5", "0"], [0, 0.3, 0.62])]),
    path("M13.14 10.45C12.94 9.95 12.54 9.65 12.14 9.65C11.64 9.65 11.14 10.05 11.14 10.55C11.14 11.15 11.64 11.45 12.24 11.55C12.84 11.65 13.34 12.05 13.34 12.65C13.34 13.15 12.84 13.65 12.24 13.65C11.74 13.65 11.34 13.35 11.14 12.85M12.24 9.25L12.24 9.85M12.14 13.85L12.14 14.45"),
  ] },

  /* receipt torn from a slot */
  invoice04: {
    auto: false,
    dur: 1.6,
    parts: [
      path("M3.4 9.2C3 8.7 2.9 8.2 2.9 7V5.3C2.9 4 4 2.9 5.3 2.9h13.4c1.3 0 2.4 1.1 2.4 2.4V7c0 1.2-.1 1.7-.5 2.2"),
      G("feed", [
        path(
          "M6.5 8.8v10.1c0 1 .1 1.6.5 1.9.5.4 1.4-.1 1.9-.6.3-.4.7-.6 1-.6.2 0 .6.1 1.1.6l.5.5c.2.2.3.4.5.4.2 0 .3-.2.5-.4l.5-.5c.5-.5.9-.6 1.1-.6.3 0 .7.2 1 .6.5.5 1.4 1 1.9.6.4-.3.5-.9.5-1.9V8.8"
        ),
        path("M9 13h6M9 16h3.5"),
      ]),
    ],
    gAnims: { feed: dip("0", "1.2") },
  },

  /* card + tiny heart */
  "loyalty-card": {
    auto: false,
    dur: 1.4,
    parts: [
      path("M4.8 4.8h14.4c1.2 0 2.2 1 2.2 2.2v10c0 1.2-1 2.2-2.2 2.2H4.8c-1.2 0-2.2-1-2.2-2.2V7c0-1.2 1-2.2 2.2-2.2z"),
      G("beat", [
        path("M9 15.4s-3.2-2.4-3.6-4.5c-.3-1.7.8-2.8 1.9-2.8.8 0 1.4.4 1.7 1.1.3-.7.9-1.1 1.7-1.1 1.1 0 2.2 1.1 1.9 2.8-.4 2.1-3.6 4.5-3.6 4.5z"),
      ]),
      path("M14.8 16h3.6"),
    ],
    sAnims: { beat: throb(9, 12.4, 1.18) },
  },

  /* straight banknote + 4 corner flourishes + centre seal */
  money01: {
    auto: false,
    dur: 1.5,
    parts: [path(NOTE), path(ARCS), sealPulse(12, 12, 2.9)],
  },

  /* straight banknote + side dots + centre seal */
  money02: {
    auto: false,
    dur: 1.5,
    parts: [
      path(NOTE),
      circle(5.6, 12, 0.9, fill()),
      circle(18.4, 12, 0.9, fill()),
      sealPulse(12, 12, 2.9),
    ],
  },

  /* waving banknote + corner flourishes + centre seal */
    "money03": { dur: 1.5,
    auto: false,
    parts: [
    path("M3.35 9.86C3.35 8.86 4.05 8.26 5.05 8.36C9.45 8.96 14.35 6.66 18.85 6.06C19.85 5.96 20.65 6.66 20.65 7.66L20.65 17.26C20.65 18.26 19.85 18.96 18.85 18.86C14.35 18.26 9.45 16.06 5.05 16.76C4.15 16.86 3.35 16.26 3.35 15.26L3.35 9.86Z"),
    path("M3.35 11.46C5.05 11.36 6.45 9.96 6.75 8.16M16.45 6.26C16.75 8.06 18.35 9.46 20.35 9.76M20.65 14.96C20.25 16.76 18.65 18.06 16.65 18.36M7.15 16.86C6.85 15.16 5.35 13.86 3.45 13.66"),
    A(circle(11.95, 12.46, 3.2), [an("r", ["3.2", "3.7", "3.2"])]),
  ] },

  /* waving banknote + side dots + centre seal */
    "money04": { dur: 1.5,
    auto: false,
    parts: [
    path("M3.35 9.86C3.35 8.86 4.05 8.26 5.05 8.36C9.45 8.96 14.35 6.66 18.85 6.06C19.85 5.96 20.65 6.66 20.65 7.66L20.65 17.26C20.65 18.26 19.85 18.96 18.85 18.86C14.35 18.26 9.45 16.06 5.05 16.76C4.15 16.86 3.35 16.26 3.35 15.26L3.35 9.86Z"),
    circle(5.75, 12.46, 0.9, { fill: "currentColor", stroke: "none" }),
    circle(18.15, 12.46, 0.9, { fill: "currentColor", stroke: "none" }),
    A(circle(11.95, 12.46, 3.2), [an("r", ["3.2", "3.7", "3.2"])]),
  ] },

  /* banknote + plus at the bottom-right corner */
  "money-add01": {
    auto: false,
    dur: 1.5,
    parts: [
      path(NOTE_OPEN),
      path(ARCS_NO_BR),
      circle(12, 12, 2.9),
      G("plus", [path("M19 14.8v5M16.5 17.3h5")]),
    ],
    sAnims: { plus: throb(19, 17.3, 1.28) },
  },

  /* waving banknote + plus */
    "money-add02": { dur: 1.5,
    auto: false,
    parts: [
    path("M20.15 12.5L20.15 7.3C20.15 6.3 19.35 5.6 18.35 5.7C13.85 6.3 8.95 2.8 4.55 8C3.55 7.9 2.85 8.5 2.85 9.5L2.85 14.9C2.85 15.9 3.65 16.5 4.55 16.4C8.75 17.1 12.15 18 14.95 18.4"),
    path("M2.85 11.1C4.55 11 5.95 9.6 6.25 7.8M15.95 5.9C16.25 7.7 17.85 9.1 19.85 9.4M6.65 16.5C6.35 14.8 4.85 13.5 2.95 13.3"),
    circle(11.45, 12.1, 2.9),
    G("plus", [
      path("M18.65 16.2L18.65 21.2M16.15 18.7L21.15 18.7"),
    ]),
  ],
    sAnims: { plus: { pivot: [18.65, 18.7], anim: tn("scale", ["1", "1.28", "1"]) } } },

  /* cinched money bag */
  "money-bag01": {
    auto: false,
    dur: 1.8,
    parts: [
      G("sag", [
        path("M9.9 7.4c-.3-1.1-1.3-3-.9-3.7.3-.5.8-.6 1.4-.3.7.4 1.4.2 1.9-.5.3-.4.7-.4 1-.1.4.5.8.6 1.4.4.6-.2 1.2-.1 1.5.4.3.7-.6 2.7-.9 3.8"),
        path("M9.7 7.4c-3.2 1.7-5.2 5-5.2 8.6 0 2.9 2.2 5.3 5 5.3h5c2.8 0 5-2.4 5-5.3 0-3.6-2-6.9-5.2-8.6"),
      ]),
    ],
    gAnims: { sag: sway(12, 7, 5) },
  },

  /* cinched money bag + $ */
  "money-bag02": {
    auto: false,
    dur: 1.8,
    parts: [
      G("sag", [
        path("M9.9 7.4c-.3-1.1-1.3-3-.9-3.7.3-.5.8-.6 1.4-.3.7.4 1.4.2 1.9-.5.3-.4.7-.4 1-.1.4.5.8.6 1.4.4.6-.2 1.2-.1 1.5.4.3.7-.6 2.7-.9 3.8"),
        path("M9.7 7.4c-3.2 1.7-5.2 5-5.2 8.6 0 2.9 2.2 5.3 5 5.3h5c2.8 0 5-2.4 5-5.3 0-3.6-2-6.9-5.2-8.6"),
        path("M13.2 12.9c-.2-.6-.7-1-1.2-1-.6 0-1.1.4-1.1 1 0 .6.6 1 1.2 1.1.6.1 1.2.5 1.2 1.2 0 .6-.6 1-1.3 1-.6 0-1-.3-1.2-.9M12 11.5v.7M11.9 16.4v.7"),
      ]),
    ],
    gAnims: { sag: sway(12, 7, 5) },
  },

  /* banknote + swap arrows at the corner */
  "money-exchange01": { dur: 1.4, auto: true, parts: [
    rect(3, 3, 18, 9, 2.4),
    circle(12, 7.5, 2),
    path("M4.5 16.2H19.5M17 13.7l2.5 2.5-2.5 2.5"),
    path("M19.5 20.2H4.5M7 17.7l-2.5 2.5 2.5 2.5"),
  ] },

  /* waving banknote + swap arrows */
    "money-exchange02": { dur: 1.4, auto: true, parts: [
      rect(2.5, 7, 12.5, 10, 2.4),
      circle(8.75, 12, 2.1),
      path("M19 4.5V19.5M16.5 7 19 4.5 21.5 7M16.5 17 19 19.5 21.5 17"),
    ] },

  /* two notes orbited by loop arrows */
  "money-exchange03": { dur: 1.4, auto: true, parts: [
    rect(11, 3.5, 10, 6.5, 2),
    circle(16, 6.75, 1.4),
    rect(3, 14, 10, 6.5, 2),
    circle(8, 17.25, 1.4),
    path("M3.5 6.7H8M6 4.7l2 2-2 2"),
    path("M20.5 17.2H16M18 15.2l-2 2 2 2"),
  ] },

  /* banknote with a padlock at the corner */
  "money-lock": {
    auto: false,
    dur: 1.6,
    parts: [
      path(NOTE_OPEN),
      path(ARCS_NO_BR),
      circle(12, 12, 2.9),
      G("lift", [G("swing", [path("M17 16.6v-1.7a1.6 1.6 0 0 1 3.2 0v1.7")])]),
      path("M16.9 16.6h3.4c.8 0 1.4.6 1.4 1.4v2.2c0 .8-.6 1.4-1.4 1.4h-3.4c-.8 0-1.4-.6-1.4-1.4v-2.2c0-.8.6-1.4 1.4-1.4z"),
      circle(18.6, 18.9, 0.9, fill()),
    ],
    gAnims: {
      lift: tn("translate", ["0 0", "0 -0.9", "0 -0.9"], [0, 0.45, 1]),
      swing: tn("rotate", ["0 20.2 16.6", "0 20.2 16.6", "-55 20.2 16.6"], [0, 0.25, 1]),
    },
  },

  /* banknote crossed out */
  "money-not-found01": { dur: 1.4, auto: true, parts: [
    rect(2.5, 6.5, 19, 11, 2.5),
    circle(12, 12, 2.4),
    line(3.5, 3.5, 20.5, 20.5),
  ] },

  /* banknote + dots crossed out */
  "money-not-found02": { dur: 1.4, auto: true, parts: [
    rect(2.5, 6, 16, 11, 2.5),
    circle(10.5, 11.5, 2.2),
    circle(17.5, 16.5, 4),
    line(14.7, 19.3, 20.3, 13.7),
  ] },

  /* waving banknote crossed out */
  "money-not-found03": { dur: 1.4, auto: true, parts: [
    rect(2.5, 6.5, 19, 11, 2.5),
    path("M10.3 10.7a1.8 1.8 0 1 1 2.7 1.5C12.4 12.6 12 13 12 13.8M12 15.8h.01"),
  ] },

  /* waving banknote + dots crossed out */
  "money-not-found04": { dur: 1.4, auto: true, parts: [
    rect(2.5, 6.5, 19, 11, 2.5),
    path("M10.2 10.2l3.6 3.6M13.8 10.2l-3.6 3.6"),
  ] },

  /* banknote taking an arrow through its top slot */
  "money-receive01": { dur: 1.4, auto: true, parts: [
    rect(2.5, 10, 19, 10.5, 2.4),
    circle(12, 15.25, 2.2),
    path("M12 3V8.5M9.5 6 12 8.5 14.5 6"),
  ] },

  /* waving banknote taking an arrow */
    "money-receive02": { dur: 1.4, auto: true, parts: [
      rect(8, 6.5, 13.5, 11, 2.4),
      circle(14.75, 12, 2.2),
      path("M2.5 12H5.5M4 10l2 2-2 2"),
    ] },

  /* $ inside a broken circle, arrow coming in */
  "money-receive-circle": {
    auto: false,
    parts: [
      path("M20.6 9.6a8.8 8.8 0 1 1-6.3-6.3"),
      path(DOLLAR_LG),
      G("dip", [path(ARROW_IN), path(ARROW_IN_HEAD)]),
    ],
    gAnims: { dip: tn("translate", ["0 0", "0 0", "-0.9 0.9", "0 0", "0 0"], [0, 0.3, 0.55, 0.8, 1]) },
  },

  /* three drips feeding a banknote */
  "money-receive-flow01": { dur: 1.4, auto: true, parts: [
    rect(2.5, 10, 19, 10.5, 2.4),
    circle(12, 15.25, 2.2),
    path("M12 3.5V7M7.5 5V7M16.5 5V7"),
  ] },

  /* three drips feeding a waving note */
  "money-receive-flow02": { dur: 1.4, auto: true, parts: [
    rect(2.5, 11.5, 19, 9, 2.4),
    circle(12, 16, 2),
    path("M9.5 3.5 12 6 14.5 3.5M9.5 7 12 9.5 14.5 7"),
  ] },

  /* $ inside a broken square, arrow coming in */
  "money-receive-square": {
    auto: false,
    parts: [
      path("M12.5 3.6H9C5.4 3.6 2.5 6.5 2.5 10.1v4C2.5 17.6 5.4 20.5 9 20.5h6c3.6 0 6.5-2.9 6.5-6.5v-3"),
      path(DOLLAR_LG),
      G("dip", [path(ARROW_IN), path(ARROW_IN_HEAD)]),
    ],
    gAnims: { dip: tn("translate", ["0 0", "0 0", "-0.9 0.9", "0 0", "0 0"], [0, 0.3, 0.55, 0.8, 1]) },
  },

  /* banknote + x mark at the corner */
  "money-remove01": {
    auto: false,
    dur: 1.3,
    parts: [
      path(NOTE_OPEN),
      path(ARCS_NO_BR),
      circle(12, 12, 2.9),
      G("no", [path("M17.2 15.5l3.6 3.6M20.8 15.5l-3.6 3.6")]),
    ],
    gAnims: { no: shake(19, 17.3, 10) },
  },

  /* scalloped-bottom receipt with a % drawn on it */
  "receipt-percent": {
    auto: false,
    dur: 1.6,
    parts: [
      path("M6.6 3.8h10.8c.8 0 1.4.6 1.4 1.4v13.4l-1.7-1.1-1.7 1.1-1.7-1.1-1.7 1.1-1.7-1.1-1.7 1.1-1.8-1.1-1.7 1.1V5.2c0-.8.6-1.4 1.4-1.4z"),
      A(path("M9.8 14.2l4.6-5", { "stroke-dasharray": 6.8 }), [drawOn(6.8, 0.15, 0.65)]),
      circle(9.8, 9.5, 0.7, fill()),
      circle(14.4, 14, 0.7, fill()),
    ],
  },

  /* open basket, two converging carry handles — they sway */
  "shopping-basket": {
    auto: false,
    dur: 1.6,
    parts: [
      path("M4.2 10h15.6l-1.4 8.4c-.2 1.2-1.2 2.1-2.4 2.1H8c-1.2 0-2.2-.9-2.4-2.1z"),
      line(5.6, 13.2, 18.4, 13.2),
      line(9.2, 13.2, 9.2, 18.9),
      line(14.8, 13.2, 14.8, 18.9),
      G("handles", [
        line(9.6, 10, 11.4, 4.2),
        line(14.4, 10, 12.6, 4.2),
      ]),
    ],
    gAnims: { handles: tn("rotate", ["0 12 7", "-4 12 7", "4 12 7", "0 12 7"], [0, 0.3, 0.7, 1]) },
  },

  /* corner store: scalloped awning, door + window */
  store: {
    auto: false,
    dur: 1.7,
    parts: [
      path("M5.4 20.4V9.9M18.6 20.4V9.9"),
      line(4.4, 20.4, 19.6, 20.4),
      G("awn", [
        path("M4.2 8.6L5.8 3.8h12.4l1.6 4.8"),
        path("M4.2 8.6c.2 1.2 1.1 2 2.3 2s2.1-.8 2.3-2c.2 1.2 1.1 2 2.3 2s2.1-.8 2.3-2c.2 1.2 1.1 2 2.3 2s2.1-.8 2.3-2c.2 1.2 1.1 2 2.3 2s2.1-.8 2.3-2"),
      ]),
      path("M8 20.4v-4.6c0-.9.7-1.6 1.6-1.6s1.6.7 1.6 1.6v4.6"),
      rect(13.4, 13.8, 3, 3, 0.6),
    ],
    gAnims: { awn: tn("translate", ["0 0", "0 0.7", "0 0"], [0, 0.5, 1]) },
  },

  /* two price tags — the back one peeks out top-right, pair swings */
  tags: {
    auto: false,
    dur: 2.2,
    parts: [
      path("M15.4 3.6h3c1.1 0 2 .9 2 2v3.8c0 .7-.3 1.4-.8 1.9l-2.4 2.4"),
      G("tag", [
        path("M12.4 4.4l6.4 6.4c.8.8.8 2.1 0 2.9l-5.6 5.6c-.8.8-2.1.8-2.9 0l-6.4-6.4c-.5-.5-.8-1.3-.8-2V6.4c0-1.1.9-2 2-2h4.4c.7 0 1.4.3 1.8.8z"),
        circle(7.8, 8.2, 0.7, fill()),
      ]),
    ],
    gAnims: { tag: sway(7.8, 8.2, 7) },
  },

  /* event ticket — side notches, perf line, text rows */
  ticket: {
    auto: false,
    dur: 2,
    parts: [
      path("M3.2 9.2V7.4c0-1.1.9-2 2-2h13.6c1.1 0 2 .9 2 2v1.8a2.8 2.8 0 0 0 0 5.6v1.8c0 1.1-.9 2-2 2H5.2c-1.1 0-2-.9-2-2v-1.8a2.8 2.8 0 0 0 0 -5.6z"),
      path("M8.6 5.6v1.6M8.6 10.4v3.2M8.6 16.8v1.6"),
      A(path("M11.4 9.8h5.6M11.4 14.2h5.6"), [
        an("opacity", ["0.35", "0.35", "1", "1"], [0, 0.3, 0.55, 1]),
      ]),
    ],
  },

  /* ticket + percent — the slash draws on */
  "ticket-percent": {
    auto: false,
    dur: 2,
    parts: [
      path("M3.2 9.2V7.4c0-1.1.9-2 2-2h13.6c1.1 0 2 .9 2 2v1.8a2.8 2.8 0 0 0 0 5.6v1.8c0 1.1-.9 2-2 2H5.2c-1.1 0-2-.9-2-2v-1.8a2.8 2.8 0 0 0 0 -5.6z"),
      path("M8.6 5.6v1.6M8.6 10.4v3.2M8.6 16.8v1.6"),
      A(path("M12.2 14.6l4.4-4.4", { "stroke-dasharray": 6.3 }), [drawOn(6.3, 0.15, 0.6)]),
      circle(12.6, 10.2, 0.65, fill()),
      circle(16.2, 13.8, 0.65, fill()),
    ],
  },

  /* scalloped receipt + ruled lines that ink in */
  "receipt-text": {
    auto: false,
    dur: 1.9,
    parts: [
      path("M6.6 3.8h10.8c.8 0 1.4.6 1.4 1.4v13.4l-1.7-1.1-1.7 1.1-1.7-1.1-1.7 1.1-1.7-1.1-1.7 1.1-1.8-1.1-1.7 1.1V5.2c0-.8.6-1.4 1.4-1.4z"),
      A(path("M9.4 8.4h5.2", { "stroke-dasharray": 5.2 }), [drawOn(5.2, 0.1, 0.4)]),
      A(path("M9.4 11.8h5.2", { "stroke-dasharray": 5.2 }), [drawOn(5.2, 0.25, 0.55)]),
      A(path("M9.4 15.2h3.4", { "stroke-dasharray": 3.4 }), [drawOn(3.4, 0.4, 0.7)]),
    ],
  },
};
