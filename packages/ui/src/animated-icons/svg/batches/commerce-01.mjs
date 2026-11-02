const path = (d, a = {}) => ({ e: "path", a: { d, ...a } });
const circle = (cx, cy, r, a = {}) => ({ e: "circle", a: { cx, cy, r, ...a } });
const line = (x1, y1, x2, y2, a = {}) => ({ e: "line", a: { x1, y1, x2, y2, ...a } });
const rect = (x, y, w, h, rx, a = {}) => ({ e: "rect", a: { x, y, width: w, height: h, rx, ...a } });
const ellipse = (cx, cy, rx, ry, a = {}) => ({ e: "ellipse", a: { cx, cy, rx, ry, ...a } });
const fill = (color = "currentColor") => ({ fill: color, stroke: "none" });
const an = (attr, values, times) => ({ kind: "attr", attr, values, times });
const tn = (type, values, times, extra = {}) => ({ kind: "transform", type, values, times, ...extra });
const A = (part, anims) => ({ ...part, anims });
const G = (id, children, a = {}) => ({ e: "g", g: id, a, children });

/* commerce-01 — 46 glyphs. Soft blob silhouettes, stroke 2, live area
 * [2.5, 21.5]. Bespoke SMIL gestures (`auto: false` everywhere). */

/* shared silhouettes */
const BANKNOTE =
  "M2.8 8.3c0-1.7 1.4-3 3-3h12.4c1.6 0 3 1.3 3 3v7.4c0 1.7-1.4 3-3 3H5.8c-1.6 0-3-1.3-3-3V8.3z";
const BANKNOTE_OPEN_R =
  "M13.6 18.7H5.8c-1.6 0-3-1.3-3-3V8.3c0-1.7 1.4-3 3-3h12.4c1.6 0 3 1.3 3 3v3.5";
const CASHBACK_ARC = "M3.8 14a8.6 8.6 0 1 1 .8-4.6";
const CASHBACK_HEAD = "M3.6 5.4l.9 3.9 3.9-1.1";
const COIN_BACK = (cx = 14, cy = 9.5, r = 7.4) => circle(cx, cy, r);
const COIN_FRONT_ARC =
  "M13.1 20.6c-1.1.6-2.3.9-3.6.9-4 0-7.2-3.2-7.2-7.2 0-1.3.3-2.6 1-3.7";

/* gesture idioms */
const dip = (dx, dy) => tn("translate", ["0 0", `${dx} ${dy}`, "0 0"]);
const sway = (cx, cy, deg) =>
  tn("rotate", [`0 ${cx} ${cy}`, `${-deg} ${cx} ${cy}`, `${deg * 0.8} ${cx} ${cy}`, `0 ${cx} ${cy}`], [0, 0.3, 0.65, 1]);
const flip = (cx, cy) => ({ pivot: [cx, cy], anim: tn("scale", ["1 1", "0.2 1", "1 1"]) });
const throb = (cx, cy, s = 1.22) => ({ pivot: [cx, cy], anim: tn("scale", ["1", `${s}`, "1"]) });
const spin = (cx, cy) => tn("rotate", [`0 ${cx} ${cy}`, `360 ${cx} ${cy}`]);
const shake = (cx, cy, deg = 9) =>
  tn("rotate", [`0 ${cx} ${cy}`, `${-deg} ${cx} ${cy}`, `${deg} ${cx} ${cy}`, `0 ${cx} ${cy}`], [0, 0.22, 0.5, 1]);
const scanDip = (t) => an("opacity", ["1", "0.25", "1"], [0, t, 1]);
const drawOn = (len, t0 = 0.1, t1 = 0.75) => an("stroke-dashoffset", [String(len), String(len), "0"], [0, t0, t1]);

export const icons = {
  /* suitcase on a carousel line — soft handle + one tag dot */
  "baggage-claim": {
    auto: false,
    dur: 1.7,
    parts: [
      G("ride", [
        rect(4.3, 8.2, 15.4, 10.3, 2.6),
        path("M9.6 8.2V6.4c0-1 .8-1.9 1.9-1.9h1c1 0 1.9.9 1.9 1.9v1.8"),
        circle(16.8, 12.4, 0.9, fill()),
      ]),
      line(3.2, 20.8, 20.8, 20.8),
    ],
    gAnims: { ride: dip("-1.8", "0") },
  },

  /* pediment + three columns + stepped base */
  bank: {
    auto: false,
    dur: 1.6,
    parts: [
      path("M12 3.4c.8 0 1.5.2 2.1.6l6.1 3.5c.9.5.6 1.8-.4 1.8H4.3c-1 0-1.3-1.3-.4-1.8l6.1-3.5c.6-.4 1.3-.6 2-.6z"),
      path("M6.4 11.6v5.4M12 11.6v5.4M17.6 11.6v5.4"),
      path("M4.4 19.6c.5-.9 1.4-1.4 2.4-1.4h10.4c1 0 1.9.5 2.4 1.4M3.4 21h17.2"),
      A(circle(12, 6.4, 0.8, fill()), [an("r", ["0.8", "1.2", "0.8"])]),
    ],
  },

  banknote: {
    auto: false,
    dur: 1.5,
    parts: [
      path(BANKNOTE),
      A(circle(12, 12, 2.9), [an("r", ["2.9", "3.4", "2.9"])]),
      path("M4.9 15.6h1.7M17.4 8.4h1.7"),
    ],
  },

  "banknote-arrow-down": {
    auto: false,
    dur: 1.4,
    parts: [
      path(BANKNOTE_OPEN_R),
      circle(11.6, 10.4, 2.6),
      path("M4.9 15.7h1.6M17.6 8.2h1.6"),
      G("drop", [path("M19.3 13.4v6.9M16.7 17.7l2.6 2.6 2.6-2.6")]),
    ],
    gAnims: { drop: dip("0", "1.5") },
  },

  "banknote-arrow-up": {
    auto: false,
    dur: 1.4,
    parts: [
      path(BANKNOTE_OPEN_R),
      circle(11.6, 10.4, 2.6),
      path("M4.9 15.7h1.6M17.6 8.2h1.6"),
      G("lift", [path("M19.3 20.3v-6.9M16.7 16l2.6-2.6 2.6 2.6")]),
    ],
    gAnims: { lift: dip("0", "-1.5") },
  },

  "banknote-x": {
    auto: false,
    dur: 1.3,
    parts: [
      path(BANKNOTE_OPEN_R),
      circle(11.6, 10.4, 2.6),
      path("M4.9 15.7h1.6M17.6 8.2h1.6"),
      G("no", [path("M17.2 15.6l4.4 4.4M21.6 15.6l-4.4 4.4")]),
    ],
    gAnims: { no: shake("19.4", "17.8", 10) },
  },

  /* varied bars + two quiet dots under the short ones */
  barcode: {
    auto: false,
    dur: 1.9,
    parts: [
      A(line(4.4, 5.4, 4.4, 18.6), [scanDip(0.18)]),
      A(line(8.2, 5.4, 8.2, 14.6), [scanDip(0.32)]),
      A(line(12, 5.4, 12, 18.6), [scanDip(0.46)]),
      A(line(15.8, 5.4, 15.8, 14.6), [scanDip(0.6)]),
      A(line(19.6, 5.4, 19.6, 18.6), [scanDip(0.74)]),
      circle(8.2, 17.4, 0.7, fill()),
      circle(15.8, 17.4, 0.7, fill()),
    ],
  },

  /* scan corners + three bars */
  "barcode-scan": {
    auto: false,
    dur: 1.8,
    parts: [
      path("M8.6 3.2H6.4c-1.8 0-3.2 1.4-3.2 3.2v2.2M15.4 3.2h2.2c1.8 0 3.2 1.4 3.2 3.2v2.2M20.8 15.4v2.2c0 1.8-1.4 3.2-3.2 3.2h-2.2M8.6 20.8H6.4c-1.8 0-3.2-1.4-3.2-3.2v-2.2"),
      A(path("M8.4 8.2v7.6"), [scanDip(0.25)]),
      A(path("M12 8.2v5.4"), [scanDip(0.45)]),
      A(path("M15.6 8.2v7.6"), [scanDip(0.65)]),
      circle(12, 16.6, 0.7, fill()),
    ],
  },

  /* backboard + rim arc + soft net */
  "basketball-hoop": { dur: 1.4, auto: true, parts: [
    rect(5, 3, 14, 9, 1.5),
    rect(9, 6, 6, 4, 0.8),
    path("M8 12.5h8"),
    path("M9 12.5l1.2 5.5M15 12.5l-1.2 5.5M12 12.5V18M9.7 15.2h4.6"),
  ] },

  /* ball + three flowing seam curves */
  basketball01: {
    auto: false,
    dur: 1.5,
    parts: [
      G("dribble", [
        circle(12, 12, 8.7),
        path("M3.3 13.4c6 .5 10.3-4 9.6-10.1"),
        path("M11 20.8c-.5-6 4-10.3 10-9.6"),
        path("M16.9 20c.2-6.4-4.8-11.7-11.3-11.9"),
      ]),
    ],
    gAnims: { dribble: tn("translate", ["0 0", "0 1.7", "0 0"], [0, 0.4, 1]) },
  },

  /* ball + vertical seam + horizon seam + two side bows */
  basketball02: {
    auto: false,
    dur: 1.6,
    parts: [
      G("rock", [
        circle(12, 12, 8.7),
        path("M3.4 11.6c2.4 2.3 5.3 3.4 8.6 3.4s6.2-1.1 8.6-3.4"),
        line(12, 3.4, 12, 20.6),
        path("M6.6 4.6c-1.5 2.4-1.5 5 0 7.7 1.5 2.7 1.5 4.8 0 7.1"),
        path("M17.4 4.6c1.5 2.4 1.5 5 0 7.7-1.5 2.7-1.5 4.8 0 7.1"),
      ]),
    ],
    gAnims: { rock: tn("rotate", ["0 12 20.4", "-14 12 20.4", "12 12 20.4", "0 12 20.4"], [0, 0.3, 0.65, 1]) },
  },

  /* cue (two converging lines) + arc ball with a shine */
  "billiard01": { dur: 1.4, auto: true, parts: [
    circle(16.5, 7.5, 4.5),
    circle(16.5, 7.5, 1.4),
    path("M3.5 20.5 11.5 12.5"),
  ] },

  /* striped 8-ball — outer ring, inner ring, tiny 8 */
  billiard02: {
    auto: false,
    dur: 1.6,
    parts: [
      G("roll", [
        circle(12, 12, 8.6),
        circle(12, 12, 5.3),
        circle(12, 10.8, 1.15),
        circle(12, 13.6, 1.35),
      ]),
    ],
    gAnims: { roll: tn("rotate", ["0 12 20.4", "-13 12 20.4", "11 12 20.4", "0 12 20.4"], [0, 0.3, 0.65, 1]) },
  },

  /* two offset cards + two circling arrows */
  "card-exchange01": { dur: 1.4, auto: true, parts: [
    rect(3, 3.5, 11.5, 7.5, 2),
    path("M3 7H14.5"),
    rect(9.5, 13, 11.5, 7.5, 2),
    path("M9.5 16.5H21"),
    path("M17.5 7.2H21M19 5.2l2 2-2 2"),
    path("M6.5 16.8H3M5 14.8l-2 2 2 2"),
  ] },

  "card-exchange02": { dur: 1.4, auto: true, parts: [
    rect(9.5, 3.5, 11.5, 7.5, 2),
    path("M9.5 7H21"),
    rect(3, 13, 11.5, 7.5, 2),
    path("M3 16.5H14.5"),
    path("M6.5 7.2H3M5 5.2l-2 2 2 2"),
    path("M17.5 16.8H21M19 14.8l2 2-2 2"),
  ] },

  /* sim card — clipped shoulder, chip + four pins */
  "card-sim": {
    auto: false,
    dur: 1.7,
    parts: [
      path("M6.6 3.4h6.6c.7 0 1.3.3 1.8.8l3.4 3.5c.5.5.8 1.1.8 1.8v8.3c0 2.1-1.7 3.8-3.8 3.8H8.8c-2.1 0-3.8-1.7-3.8-3.8V7.2c0-2.1.6-3.8 1.6-3.8z"),
      rect(8, 10.6, 8, 7, 2),
      A(path("M10.7 10.6v2.3"), [scanDip(0.2)]),
      A(path("M10.7 14.9v2.7"), [scanDip(0.4)]),
      A(path("M13.7 10.6v2.3"), [scanDip(0.55)]),
      A(path("M13.7 14.9v2.7"), [scanDip(0.7)]),
    ],
  },

  /* sweater: shoulders, V-neck, cuffs above hem */
  cardigan: {
    auto: false,
    dur: 1.8,
    parts: [
      G("hang", [
        path("M9.4 3.4c1.1 1.5 4.1 1.5 5.2 0l4.3 1.9c.9.4 1.6 1.3 1.7 2.3l.9 7.5c0 .6-.5 1.1-1.1 1.1h-1.7c-.6 0-1-.4-1.1-1l-1.4-4.7v8.7c0 .6-.5 1.1-1.1 1.1H9.8c-.6 0-1.1-.5-1.1-1.1v-8.7l-1.4 4.7c-.1.6-.5 1-1.1 1H4.6c-.6 0-1.1-.5-1.1-1.1l.9-7.5c.1-1 .8-1.9 1.7-2.3l3.3-1.9z"),
        path("M9.6 3.6c.5 3.3 1.6 4.6 2.4 5.1v11.5M14.4 3.6c-.5 3.3-1.6 4.6-2.4 5.1"),
      ]),
    ],
    gAnims: { hang: sway("12", "3.4", 5) },
  },

  /* monitor-ish card with midline + trace + two dots */
  cardiogram01: {
    auto: false,
    dur: 1.6,
    parts: [
      rect(3.2, 3.8, 17.6, 16.4, 2.6),
      line(3.2, 15.2, 20.8, 15.2),
      A(path("M5.4 11.9h2l1.5-3.1 2.5 5.4 1.4-2.3h3.4", { "stroke-dasharray": 17.4 }), [drawOn(17.4, 0.08, 0.7)]),
      circle(6.9, 17.9, 0.7, fill()),
      circle(10.6, 17.9, 0.7, fill()),
    ],
  },

  /* heart silhouette with a single trace across */
  cardiogram02: {
    auto: false,
    dur: 1.35,
    parts: [
      G("beat", [
        path("M12 19.8S4.6 14.9 3.6 10.4c-.8-3.5 1.6-5.8 4.1-5.8 1.8 0 3.4 1 4.3 2.4.9-1.4 2.5-2.4 4.3-2.4 2.5 0 4.9 2.3 4.1 5.8-1 4.5-8.4 9.4-8.4 9.4z"),
        path("M5.6 11.8h2.1l1.4-2.5 2.2 4.4 1.4-1.9h5.7"),
      ]),
    ],
    sAnims: { beat: throb(12, 11.4, 1.1) },
  },

  /* straight card + tilted card peeking + diamond pip */
  cards01: {
    auto: false,
    dur: 1.6,
    parts: [
      G("fan", [
        rect(3.4, 5.6, 12.4, 15.6, 2.6),
        path("M10 9.9l1.8 2.4c.3.3.3.8 0 1.1L10 15.8c-.3.4-.9.4-1.2 0l-1.8-2.4c-.3-.3-.3-.8 0-1.1l1.8-2.4c.3-.4.9-.4 1.2 0z", fill()),
      ]),
      path("M16.2 18.8c1.2-.6 1.6-2.2 2-3.9l.8-3.2c.5-2.2.8-3.6 0-4.6-.7-1-2.2-1.3-4.3-1.8l-1.9-.5c-2.1-.6-3.7-.9-4.7-.2-.8.5-1.2 1.5-1.5 2.7"),
    ],
    gAnims: { fan: tn("rotate", ["0 4 20.6", "-7 4 20.6", "0 4 20.6"], [0, 0.45, 1]) },
  },

  /* same pair, heart pip */
  cards02: {
    auto: false,
    dur: 1.6,
    parts: [
      G("fan", [
        rect(3.4, 5.6, 12.4, 15.6, 2.6),
        path("M9.9 15.6s-2.5-1.7-2.8-3.1c-.2-1.1.6-2 1.5-2 .6 0 1 .3 1.3.8.3-.5.7-.8 1.3-.8.9 0 1.7.9 1.5 2-.3 1.4-2.8 3.1-2.8 3.1z", fill()),
      ]),
      path("M16.2 18.8c1.2-.6 1.6-2.2 2-3.9l.8-3.2c.5-2.2.8-3.6 0-4.6-.7-1-2.2-1.3-4.3-1.8l-1.9-.5c-2.1-.6-3.7-.9-4.7-.2-.8.5-1.2 1.5-1.5 2.7"),
    ],
    gAnims: { fan: tn("rotate", ["0 4 20.6", "-7 4 20.6", "0 4 20.6"], [0, 0.45, 1]) },
  },

  /* framed note + corner fans + seal + shadow note */
  cash01: {
    auto: false,
    dur: 1.5,
    parts: [
      rect(2.9, 4.6, 18.2, 12.6, 2.4),
      A(circle(12, 10.9, 2.8), [an("r", ["2.8", "3.3", "2.8"])]),
      path("M3.4 8.4c1.9-.4 3.1-1.6 3.5-3.4M20.6 13.4c-1.9.4-3.1 1.6-3.5 3.4"),
      line(5.5, 20.4, 18.5, 20.4),
    ],
  },

  /* gently bowed bill + seal + shadow note */
    "cash02": { dur: 1.5,
    auto: false,
    parts: [
    /* banknote: rounded bill + guilloche corner arcs + seal + shadow note */
    path("M2.8 7.6c0-.7.5-1.2 1.2-1.2h16c.7 0 1.2.5 1.2 1.2v8.8c0 .7-.5 1.2-1.2 1.2H4c-.7 0-1.2-.5-1.2-1.2V7.6z"),
    path("M6.4 6.4c0 1.6-1.3 2.9-2.9 2.9M6.4 17.6c0-1.6-1.3-2.9-2.9-2.9M17.6 6.4c0 1.6 1.3 2.9 2.9 2.9M17.6 17.6c0-1.6 1.3-2.9 2.9-2.9"),
    A(circle(12, 12, 2.9), [an("r", ["2.9", "3.3", "2.9"])]),
    line(5.5, 19.9, 18.5, 19.9),
  ] },

  /* circular-arrow ring + $ */
    "cashback": { dur: 1.9,
    pp: false,
    auto: false,
    parts: [
    /* return arc enclosing a centered $ */
    G("circ", [
      path("M4.3 14.8A8.2 8.2 0 1 0 4.3 9.2"),
      path("M4.4 5.2l.2 3.9 3.7-.6"),
    ]),
    path("M14.6 9.2c-.6-.8-1.6-1.2-2.6-1.2-1.4 0-2.5.8-2.5 2 0 2.6 5 1.6 5 4 0 1.2-1.1 2-2.5 2-1 0-1.9-.5-2.6-1.3M12 6.3v1.7M12 16v1.7"),
  ],
    gAnims: { circ: tn("rotate", ["0 12 12", "360 12 12"]) } },

    "cashback-bitcoin": { dur: 1.9,
    pp: false,
    auto: false,
    parts: [
    G("circ", [
      path("M4.3 14.8A8.2 8.2 0 1 0 4.3 9.2"),
      path("M4.4 5.2l.2 3.9 3.7-.6"),
    ]),
    path("M10 8.2v7.7M10 8.2h3.3c1.1 0 1.9.9 1.9 1.9s-.8 1.9-1.9 1.9H10M10 12h3.7c1.1 0 1.9.9 1.9 1.9s-.8 1.9-1.9 1.9H10"),
    path("M11.2 6.5v1.7M13.8 6.5v1.7M11.2 15.8v1.7M13.8 15.8v1.7"),
  ],
    gAnims: { circ: tn("rotate", ["0 12 12", "360 12 12"]) } },

    "cashback-euro": { dur: 1.9,
    pp: false,
    auto: false,
    parts: [
    G("circ", [
      path("M4.3 14.8A8.2 8.2 0 1 0 4.3 9.2"),
      path("M4.4 5.2l.2 3.9 3.7-.6"),
    ]),
    path("M14.8 9.2c-.7-.8-1.7-1.2-2.7-1.2-1.8 0-3.3 1.7-3.3 4s1.5 4 3.3 4c1 0 2-.4 2.7-1.2M8.4 10.9h4.4M8.4 13.2h4.4"),
  ],
    gAnims: { circ: tn("rotate", ["0 12 12", "360 12 12"]) } },

    "cashback-pound": { dur: 1.9,
    pp: false,
    auto: false,
    parts: [
    G("circ", [
      path("M4.3 14.8A8.2 8.2 0 1 0 4.3 9.2"),
      path("M4.4 5.2l.2 3.9 3.7-.6"),
    ]),
    path("M14.3 9.3c-.4-.7-1.1-1.1-1.9-1.1-1.2 0-2.1.9-2.1 2.1 0 1.4.7 2.2.7 3.3 0 .8-.4 1.6-1 2.1-.3.2-.2.6.2.6h4.6M9.5 12.2h3.5"),
  ],
    gAnims: { circ: tn("rotate", ["0 12 12", "360 12 12"]) } },

    "cashback-yen": { dur: 1.9,
    pp: false,
    auto: false,
    parts: [
    G("circ", [
      path("M4.3 14.8A8.2 8.2 0 1 0 4.3 9.2"),
      path("M4.4 5.2l.2 3.9 3.7-.6"),
    ]),
    path("M9.3 7.8l2.7 3.3 2.7-3.3M12 11.1v4.9M9.5 12.9h5M9.5 15.1h5"),
  ],
    gAnims: { circ: tn("rotate", ["0 12 12", "360 12 12"]) } },

  /* register: sloped body, display flag, smile drawer pull */
  cashier: {
    auto: false,
    dur: 1.5,
    parts: [
      G("drawer", [
        path("M3 17c0-1.9 1.5-3.4 3.4-3.4h11.2c1.9 0 3.4 1.5 3.4 3.4v3.2c0 .4-.3.8-.8.8H3.8c-.5 0-.8-.4-.8-.8V17z"),
        path("M9.6 17.3c.4.9 1.3 1.4 2.4 1.4s2-.5 2.4-1.4"),
      ]),
      path("M4.3 13.6l.8-4.7c.3-1.5 1.5-2.6 3-2.6h7.8c1.5 0 2.7 1.1 3 2.6l.8 4.7"),
      line(10.4, 10.7, 13.6, 10.7),
      path("M12 6.3V4.5M10 2.7h4"),
    ],
    gAnims: { drawer: tn("translate", ["0 0", "0 1", "0 0"], [0, 0.4, 1]) },
  },

  /* register: tray base, sloped face with three key dots, price flag */
  cashier02: {
    auto: false,
    dur: 1.5,
    parts: [
      G("drawer", [path("M3.4 17.6h17.2v1.7c0 1.2-1 2.2-2.2 2.2H5.6c-1.2 0-2.2-1-2.2-2.2v-1.7z")]),
      path("M4.6 17.6l1.2-5.5c.3-1.3 1.3-2.4 2.6-2.4h7.2c1.3 0 2.3 1.1 2.6 2.4l1.2 5.5"),
      line(16.5, 9.7, 16.5, 6),
      rect(14.1, 2.9, 4.8, 3.1, 1.1),
      circle(8, 13.4, 0.6, fill()),
      circle(12, 13.4, 0.6, fill()),
      circle(16, 13.4, 0.6, fill()),
    ],
    gAnims: { drawer: tn("translate", ["0 0", "0 1", "0 0"], [0, 0.4, 1]) },
  },

  /* coinbase C-coin */
    "coinbase": { dur: 1.7,
    auto: false,
    parts: [
    G("flip", [
      path("M20.2 10.4C19.6 6.6 16.1 3.6 12 3.6c-4.6 0-8.4 3.8-8.4 8.4s3.8 8.4 8.4 8.4c4.1 0 7.6-3 8.2-6.8h-4.1c-.6 1.8-2.2 2.9-4.1 2.9-2.4 0-4.3-2-4.3-4.5s1.9-4.5 4.3-4.5c1.9 0 3.5 1.1 4.1 2.9h4.1z"),
    ]),
  ],
    sAnims: { flip: { pivot: [12, 12], anim: tn("scale", ["1 1", "0.3 1", "1 1"]) } } },

  /* tall stack + short stack */
  coins01: {
    auto: false,
    dur: 1.7,
    parts: [
      A(ellipse(8.4, 4.9, 5.7, 1.9), [
        tn("translate", ["0 -2.2", "0 0.3", "0 -0.15", "0 0"], [0, 0.5, 0.72, 1]),
      ]),
      path("M2.7 4.9v13.8c0 1.1 2.6 2 5.7 2s5.7-.9 5.7-2V4.9"),
      path("M2.7 9.5c0 1.1 2.6 2 5.7 2s5.7-.9 5.7-2M2.7 14.1c0 1.1 2.6 2 5.7 2s5.7-.9 5.7-2"),
      ellipse(16.8, 12.7, 4.4, 1.6),
      path("M12.4 12.7v5.5c0 .9 2 1.6 4.4 1.6s4.4-.7 4.4-1.6v-5.5M12.4 15.4c0 .9 2 1.6 4.4 1.6s4.4-.7 4.4-1.6"),
    ],
  },

  /* overlapping pair */
    "coins02": { dur: 1.4, auto: true, parts: [
      circle(9.5, 14.5, 5.5),
      circle(9.5, 14.5, 2.2),
      path("M8.6 8.5A6 6 0 1 1 15.5 15.4"),
    ] },

    "coins-bitcoin": { dur: 1.7,
    auto: false,
    parts: [
    G("flip", [
      circle(14, 9.5, 7.4),
      path("M13.1 20.6c-1.1.6-2.3.9-3.6.9-4 0-7.2-3.2-7.2-7.2 0-1.3.3-2.6 1-3.7"),
      path("M12.6 6.2v7h3.1c.9 0 1.7-.8 1.7-1.7 0-.8-.5-1.5-1.2-1.7.6-.2 1.1-.8 1.1-1.6 0-.9-.8-1.7-1.7-1.7h-3z"),
      path("M13.5 4.8v1.4M13.5 13.2v1.4M15.6 4.8v1.4M15.6 13.2v1.4"),
    ]),
  ],
    sAnims: { flip: { pivot: [12, 11.5], anim: tn("scale", ["1 1", "0.3 1", "1 1"]) } } },

    "coins-dollar": { dur: 1.7,
    auto: false,
    parts: [
    G("flip", [
      circle(14, 9.5, 7.4),
      path("M13.1 20.6c-1.1.6-2.3.9-3.6.9-4 0-7.2-3.2-7.2-7.2 0-1.3.3-2.6 1-3.7"),
      path("M14.2 5.4v1.1M16.2 7.6c-.3-.8-1.1-1.3-2-1.3-1.1 0-1.9.7-1.9 1.6 0 2.1 4.2 1.3 4.2 3.4 0 1-.9 1.8-2.1 1.8-1 0-1.9-.6-2.2-1.5M14.2 13v1.1"),
    ]),
  ],
    sAnims: { flip: { pivot: [12, 11.5], anim: tn("scale", ["1 1", "0.3 1", "1 1"]) } } },

    "coins-euro": { dur: 1.7,
    auto: false,
    parts: [
    G("flip", [
      circle(14, 9.5, 7.4),
      path("M13.1 20.6c-1.1.6-2.3.9-3.6.9-4 0-7.2-3.2-7.2-7.2 0-1.3.3-2.6 1-3.7"),
      path("M16.9 7.8c-.6-.8-1.5-1.2-2.4-1.2-1.7 0-3.1 1.5-3.1 3.4s1.4 3.4 3.1 3.4c.9 0 1.8-.4 2.4-1.2"),
      path("M9.8 9.7h3.5M9.8 11.5h3.5"),
    ]),
  ],
    sAnims: { flip: { pivot: [12, 11.5], anim: tn("scale", ["1 1", "0.3 1", "1 1"]) } } },

    "coins-pound": { dur: 1.7,
    auto: false,
    parts: [
    G("flip", [
      circle(14, 9.5, 7.4),
      path("M13.1 20.6c-1.1.6-2.3.9-3.6.9-4 0-7.2-3.2-7.2-7.2 0-1.3.3-2.6 1-3.7"),
      path("M16.4 7.2c-.3-.8-1-1.4-1.9-1.4-1.1 0-2 .9-2 2 0 1.7.8 2.6.8 3.6 0 .8-.4 1.6-1.1 2.1-.2.2-.1.5.2.5h4.4"),
      line(11.3, 10.1, 14.8, 10.1),
    ]),
  ],
    sAnims: { flip: { pivot: [12, 11.5], anim: tn("scale", ["1 1", "0.3 1", "1 1"]) } } },

  /* two coins + chasing arrows */
    "coins-swap": { dur: 1.9,
    pp: false,
    auto: false,
    parts: [
    G("turn", [
      circle(15.9, 8.1, 5.5),
      circle(8.1, 15.9, 5.5),
      path("M4.2 9.6a7.6 7.6 0 0 1 8.2-6.2l-1.2 1.7"),
      path("M19.8 14.4a7.6 7.6 0 0 1-8.2 6.2l1.2-1.7"),
    ]),
  ],
    gAnims: { turn: tn("rotate", ["0 12 12", "360 12 12"]) } },

    "coins-yen": { dur: 1.7,
    auto: false,
    parts: [
    G("flip", [
      circle(14, 9.5, 7.4),
      path("M13.1 20.6c-1.1.6-2.3.9-3.6.9-4 0-7.2-3.2-7.2-7.2 0-1.3.3-2.6 1-3.7"),
      path("M11.7 6.4l1.8 2.4 1.8-2.4M13.5 8.8v4.2M11.9 10.4h3.2M11.9 12h3.2"),
    ]),
  ],
    sAnims: { flip: { pivot: [12, 11.5], anim: tn("scale", ["1 1", "0.3 1", "1 1"]) } } },

  /* ticket, side notches + % */
  "coupon-percent": {
    auto: false,
    dur: 1.5,
    parts: [
      path("M5.2 5.4h13.6c1 0 1.8.8 1.8 1.8v1.6c-1.3.3-2.3 1.5-2.3 2.9s1 2.6 2.3 2.9v1.6c0 1-.8 1.8-1.8 1.8H5.2c-1 0-1.8-.8-1.8-1.8v-1.6c1.3-.3 2.3-1.5 2.3-2.9s-1-2.6-2.3-2.9V7.2c0-1 .8-1.8 1.8-1.8z"),
      G("pct", [line(9.6, 14.4, 14.4, 9.6), circle(9.7, 9.8, 0.75, fill()), circle(14.3, 14.2, 0.75, fill())]),
    ],
    gAnims: { pct: dip("0", "1") },
  },

  /* vertical receipt coupon, torn bottom + % */
  coupon01: {
    auto: false,
    dur: 1.8,
    parts: [
      G("hang", [
        path("M6.9 3.4h10.2c1.1 0 2 .9 2 2v13.1c0 .7-.8 1.1-1.4.7l-1.4-1-1.5 1c-.4.3-1 .3-1.4 0l-1.5-1-1.4 1c-.4.3-1 .3-1.4 0l-1.5-1-1.4 1c-.6.4-1.4 0-1.4-.7V5.4c0-1.1.9-2 2-2z"),
        line(9.8, 13.4, 13.8, 9.4),
        circle(10, 9.6, 0.7, fill()),
        circle(14, 13.2, 0.7, fill()),
      ]),
    ],
    gAnims: { hang: sway("12", "3.4", 4.5) },
  },

  /* wide coupon with stub line + % */
  coupon02: {
    auto: false,
    dur: 1.7,
    parts: [
      G("tear", [
        path("M6.9 7.4h11.8c1.3 0 2.4 1.1 2.4 2.4v4.4c0 1.3-1.1 2.4-2.4 2.4H6.9c-.9 0-1.7-.6-2-1.4 1-.5 1.7-1.4 1.7-2.8 0-1.4-.7-2.3-1.7-2.8.3-1.1 1.1-2 2-2.2z"),
        line(7.6, 13.9, 11.2, 10.1),
        circle(7.8, 10.3, 0.7, fill()),
        circle(11, 13.8, 0.7, fill()),
      ]),
      line(15.4, 7.4, 15.4, 16.6),
    ],
    gAnims: { tear: tn("rotate", ["0 15.4 12", "-5 15.4 12", "0 15.4 12"], [0, 0.45, 1]) },
  },

  /* ticket, punch-notches top & bottom — bare */
  coupon03: {
    auto: false,
    dur: 1.4,
    parts: [
      G("punch", [
        path("M5.6 5.4h5c.3 1.1 1.2 1.8 2.3 1.8s2-.7 2.3-1.8h5c1 0 1.8.8 1.8 1.8v9.6c0 1-.8 1.8-1.8 1.8h-5c-.3-1.1-1.2-1.8-2.3-1.8s-2 .7-2.3 1.8h-5c-1 0-1.8-.8-1.8-1.8V7.2c0-1 .8-1.8 1.8-1.8z"),
      ]),
    ],
    sAnims: { punch: { pivot: [12, 12], anim: tn("scale", ["1", "0.9", "1"], [0, 0.4, 1]) } },
  },

  /* card + check */
  "credit-card-accept": {
    auto: false,
    dur: 1.5,
    parts: [
      path("M11.6 19.6H7.2c-2.4 0-4.3-1.9-4.3-4.3V8.8c0-2.4 1.9-4.3 4.3-4.3h9.6c2.4 0 4.3 1.9 4.3 4.3v2.4"),
      line(2.9, 8.6, 21.1, 8.6),
      A(path("M14.4 16.6l2 2 4.3-4.9", { "stroke-dasharray": 9.3 }), [drawOn(9.3, 0.12, 0.7)]),
    ],
  },

  /* card + plus */
  "credit-card-add": {
    auto: false,
    dur: 1.5,
    parts: [
      path("M12.6 19.6H7.2c-2.4 0-4.3-1.9-4.3-4.3V8.8c0-2.4 1.9-4.3 4.3-4.3h9.6c2.4 0 4.3 1.9 4.3 4.3v1.7"),
      line(2.9, 8.6, 21.1, 8.6),
      G("plus", [path("M18 13.2v6.6M14.7 16.5h6.6")]),
    ],
    sAnims: { plus: throb(18, 16.5, 1.25) },
  },

  /* card + two chasing arrows */
  "credit-card-change": {
    auto: false,
    dur: 1.5,
    parts: [
      path("M11.4 19.4H7.2c-2.4 0-4.3-1.9-4.3-4.3V9c0-2.4 1.9-4.3 4.3-4.3h9.6c2.4 0 4.3 1.9 4.3 4.3v.9"),
      line(2.9, 8.4, 21.1, 8.4),
      A(path("M15.2 14.4h5.2M18.9 12.9l1.5 1.5-1.5 1.5"), [tn("translate", ["0 0", "1.6 0", "0 0"])]),
      A(path("M20.8 18.8h-5.2M17.1 20.3l-1.5-1.5 1.5-1.5"), [tn("translate", ["0 0", "-1.6 0", "0 0"])]),
    ],
  },
};
