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

/* Scalloped bloom — same radius modulation as the core settings gear. */
const bloom = (cx, cy, lobes, rMid, amp, steps = 14) => {
  const pts = [];
  for (let i = 0; i < lobes * steps; i++) {
    const t = (i / (lobes * steps)) * Math.PI * 2;
    const r = rMid + amp * Math.cos(lobes * t + Math.PI / 2);
    pts.push(`${(cx + r * Math.cos(t)).toFixed(2)} ${(cy + r * Math.sin(t)).toFixed(2)}`);
  }
  return `M${pts.join("L")}Z`;
};

/* ---- shared commerce bits ---- */
const CARD = rect(2.6, 4.6, 18.8, 14.8, 2.5);
const CARD_STRIPE = line(2.6, 8.4, 21.4, 8.4);
/* card open at bottom-right so a badge can sit in the gap */
const CARD_OPEN = path(
  "M21.4 10.4v-1c0-2.3-.6-3.7-1.6-4.7-1-1-2.6-1.5-5.7-1.5H9.9c-3.1 0-4.7.5-5.7 1.5-1 1-1.6 2.4-1.6 4.7v4.2c0 2.3.6 3.7 1.6 4.7 1 1 2.6 1.5 5.7 1.5h1.8"
);
const CARD_STRIPE_OPEN = line(2.6, 7.7, 21.4, 7.7);
const BADGE = circle(17.2, 16.3, 4.3);
const CARD_DASH = line(5.4, 12.6, 8.8, 12.6);

/* box 01: overhanging trapezoid lid + tape seam + U body */
const LID1 = path("M3.1 8.9h17.8l-.9-2.5c-.6-1.7-1.5-2.5-2.9-2.5H7c-1.4 0-2.3.8-2.9 2.5z");
const TAPE = line(12, 8.9, 12, 4.4);
const BODY1 = path("M3.1 8.9v7.3c0 2.4 1.9 4.3 4.3 4.3h9.2c2.4 0 4.3-1.9 4.3-4.3V8.9");
/* box 01 open at bottom-right for a badge */
const BODY1_OPEN = [
  path("M3.1 8.9v7.3c0 2.4 1.9 4.3 4.3 4.3h5"),
  path("M20.9 8.9v2.6"),
];
/* box 02: flush lid, single silhouette + seam */
const BOX2 = path(
  "M3.4 16.4V6.7c0-1.2 1-2.2 2.2-2.2h12.8c1.2 0 2.2 1 2.2 2.2v9.7c0 2.4-1.9 4.3-4.3 4.3H7.7c-2.4 0-4.3-1.9-4.3-4.3z"
);
const BOX2_OPEN = path(
  "M20.6 11.2V6.7c0-1.2-1-2.2-2.2-2.2H5.6c-1.2 0-2.2 1-2.2 2.2v9.7c0 2.4 1.9 4.3 4.3 4.3h5.1"
);
const SEAM2 = line(3.4, 8.9, 20.6, 8.9);

/* percent mark — slash + two plump dots */
const pct = (cx, cy) => [
  line(cx - 2.4, cy + 2.4, cx + 2.4, cy - 2.4),
  circle(cx - 2.5, cy - 2.5, 0.95, fill()),
  circle(cx + 2.5, cy + 2.5, 0.95, fill()),
];

/* hooked return arrow ↩ */
const RETURN_ARROW = [
  path("M13.9 20.4h4.6c1.4 0 2.6-1.1 2.6-2.5s-1.2-2.5-2.6-2.5h-3.4"),
  path("M17.5 13.2l-2.4 2.2 2.4 2.2"),
];
const LOCK = [
  path("M16.6 16.2v-1.5c0-1.1.9-2 2-2s2 .9 2 2v1.5"),
  rect(15.3, 16.2, 6.2, 4.7, 1.3),
];
/* location pin badge: teardrop + filled dot (a stroked r1 ring blobs) */
const PIN = [
  path("M17.9 21.4s2.8-2.6 2.8-5a2.8 2.8 0 1 0-5.6 0c0 2.4 2.8 5 2.8 5z"),
  circle(17.9, 16.4, 1.1, fill()),
];
/* box silhouettes cut back further so the taller pin keeps 2px of air */
const BODY1_PIN = [path("M3.1 8.9v7.3c0 2.4 1.9 4.3 4.3 4.3h3.8")];
const BOX2_PIN = path("M20.6 9.6V6.7c0-1.2-1-2.2-2.2-2.2H5.6c-1.2 0-2.2 1-2.2 2.2v9.7c0 2.4 1.9 4.3 4.3 4.3h3.9");
const EYE = [
  path("M21 17.4c-1-1.7-2.6-2.7-4.4-2.7s-3.4 1-4.4 2.7c1 1.7 2.6 2.7 4.4 2.7s3.4-1 4.4-2.7z"),
  circle(16.6, 17.4, 1.2, fill()),
];

/* compact $ — plump S + stem variants */
const S_SMALL = path(
  "M10.6 8.5c-.1-1.8-1.6-3.2-3.7-3.2-2.3 0-3.9 1.4-3.9 3.3 0 1.8 1.1 2.8 3.9 2.8 3 0 4.4 1.4 4.4 3.5 0 2-2 3.4-4.4 3.4-2.6 0-4.2-1.5-4.3-3.6"
);
const ARROW_LEFT = [line(21.4, 12, 15.2, 12), path("M18.1 9.4l-2.9 2.6 2.9 2.6")];
const ARROW_RIGHT = [line(14.9, 12, 21.4, 12), path("M18.5 9.4l2.9 2.6-2.9 2.6")];
/* small € inside a badge/square */
const EURO_SMALL = [
  path("M15.1 9.2c-.8-1.2-2-1.9-3.4-1.9-2.4 0-4.2 1.9-4.2 4.7v1.4c0 2.8 1.8 4.7 4.2 4.7 1.4 0 2.6-.7 3.4-1.9"),
  line(6.9, 10.9, 11.4, 10.9),
  line(6.9, 13.1, 11.4, 13.1),
];
const EURO_SIDE = [
  path("M11.6 7.2c-.9-1.3-2.1-2-3.6-2-2.7 0-4.6 2.1-4.6 5.4v2.8c0 3.3 1.9 5.4 4.6 5.4 1.5 0 2.7-.7 3.6-2"),
  line(2.7, 10.6, 9, 10.6),
  line(2.7, 13.4, 9, 13.4),
];

/* box truck = cargo box + stepped cab; van = unibody sloped front */
const TRUCK_CARGO = rect(2.8, 6, 9.4, 9.6, 1.6);
const TRUCK_CAB = path(
  "M12.2 15.6V7.4c0-.8.6-1.4 1.4-1.4h2.1c.6 0 1.1.3 1.5.8l1.7 2.5c.3.4.4.9.4 1.4v3.4c0 .8-.6 1.5-1.5 1.5h-.8"
);
const VAN_BODY = path(
  "M3 15.6V7.2c0-1 .8-1.8 1.8-1.8h7c1 0 1.8.8 1.8 1.8v.9h1.8c.6 0 1.1.3 1.5.8l1.6 2.1c.3.4.4.9.4 1.4v2.1c0 .6-.5 1.1-1.1 1.1h-1.2"
);
const WHEELS = [circle(6.9, 17.6, 2), circle(15, 17.6, 2)];
const ROAD = line(2.8, 15.6, 17.8, 15.6);
const CHEVRONS = path("M5.1 8.9l1.9 1.9-1.9 1.9M8.1 8.9l1.9 1.9-1.9 1.9");
const VAN_CHEVRONS = path("M5 8.7l1.8 1.8L5 12.3M7.9 8.7l1.8 1.8-1.8 1.8");
const VAN_WINDOW = path("M14.3 9v2h2.3");
const SPEED3 = [line(4.9, 8.7, 8.1, 8.7), line(4.9, 11, 7.3, 11), line(4.9, 13.3, 6.9, 13.3)];

/* gesture idioms */
const dip = (dx, dy) => tn("translate", ["0 0", `${dx} ${dy}`, "0 0"]);
const sway = (cx, cy, deg) =>
  tn("rotate", [`0 ${cx} ${cy}`, `${-deg} ${cx} ${cy}`, `${deg * 0.8} ${cx} ${cy}`, `0 ${cx} ${cy}`], [0, 0.3, 0.65, 1]);
const flip = (cx, cy) => ({ pivot: [cx, cy], anim: tn("scale", ["1 1", "0.2 1", "1 1"]) });
const throb = (cx, cy, s = 1.22) => ({ pivot: [cx, cy], anim: tn("scale", ["1", `${s}`, "1"]) });
const shake = (cx, cy, deg = 9) =>
  tn("rotate", [`0 ${cx} ${cy}`, `${-deg} ${cx} ${cy}`, `${deg} ${cx} ${cy}`, `0 ${cx} ${cy}`], [0, 0.22, 0.5, 1]);
const drawOn = (len, t0 = 0.1, t1 = 0.75) => an("stroke-dashoffset", [String(len), String(len), "0"], [0, t0, t1]);
/* shackle lifts and swings off its right post (canon lock gesture) */
const lockBadge = () => [
  G("lift", [
    G("swing", [path("M16.6 16.2v-1.5c0-1.1.9-2 2-2s2 .9 2 2v1.5")]),
  ]),
  rect(15.3, 16.2, 6.2, 4.7, 1.3),
];
const lockAnims = {
  lift: tn("translate", ["0 0", "0 -1", "0 -1"], [0, 0.45, 1]),
  swing: tn("rotate", ["0 20.6 16.2", "0 20.6 16.2", "-55 20.6 16.2"], [0, 0.25, 1]),
};

export const icons = {
  /* ---------- credit cards ---------- */
  "credit-card": {
    auto: false,
    dur: 1.5,
    parts: [
      G("tap", [
        CARD,
        CARD_STRIPE,
        rect(5.4, 11, 3, 2.8, 0.9),
        line(5.4, 16.3, 8.2, 16.3),
        line(10.6, 16.3, 14.8, 16.3),
      ]),
    ],
    gAnims: { tap: tn("rotate", ["0 3 19.4", "-5 3 19.4", "0 3 19.4"], [0, 0.42, 1]) },
  },
  "credit-card-defrost": {
    auto: false,
    pp: false,
    dur: 1.9,
    parts: [
      CARD_OPEN,
      CARD_STRIPE_OPEN,
      CARD_DASH,
      BADGE,
      A(path("M15.2 14.4c-.8 1 .8 1.8 0 2.8"), [
        tn("translate", ["0 0", "0 -1.1", "0 0", "0 0"], [0, 0.3, 0.85, 1]),
        an("opacity", ["1", "0.35", "1", "1"], [0, 0.3, 0.85, 1]),
      ]),
      A(path("M17.2 14.4c-.8 1 .8 1.8 0 2.8"), [
        tn("translate", ["0 0", "0 -1.1", "0 0"], [0, 0.5, 1]),
        an("opacity", ["1", "0.35", "1"], [0, 0.5, 1]),
      ]),
      A(path("M19.2 14.4c-.8 1 .8 1.8 0 2.8"), [
        tn("translate", ["0 0", "0 -1.1", "0 0"], [0, 0.7, 1]),
        an("opacity", ["1", "0.35", "1"], [0, 0.7, 1]),
      ]),
    ],
  },
  "credit-card-freeze": { dur: 1.4, auto: true, parts: [
    rect(2.5, 5, 19, 14, 2.5),
    path("M2.5 9.5H21.5"),
    path("M15.5 12v5.2M13.3 13.3l4.4 2.6M17.7 13.3l-4.4 2.6"),
  ] },
  "credit-card-not-accept": {
    auto: false,
    dur: 1.3,
    parts: [CARD_OPEN, CARD_STRIPE_OPEN, CARD_DASH, BADGE, G("no", [path("M15.6 14.7l3.2 3.2M18.8 14.7l-3.2 3.2")])],
    gAnims: { no: shake(17.2, 16.3, 10) },
  },
  "credit-card-not-found": {
    auto: false,
    dur: 1.6,
    parts: [
      CARD,
      A(line(5, 3.7, 19, 20.3, { "stroke-dasharray": 22 }), [drawOn(22, 0.08, 0.55)]),
      line(2.6, 8.4, 7.3, 8.4),
      line(10.3, 8.4, 21.4, 8.4),
      line(5.4, 16.3, 9.8, 16.3),
    ],
  },
  "credit-card-pos": {
    auto: false,
    dur: 1.6,
    parts: [
      G("swipe", [
        path("M12 3.2c.7 0 1.3.3 1.8.8l4.7 4.7c1 1 1 2.7 0 3.7l-4.7 4.7c-1 1-2.7 1-3.7 0l-4.7-4.7c-1-1-1-2.7 0-3.7l4.7-4.7c.5-.5 1.1-.8 1.9-.8z"),
      ]),
      line(6.6, 15.7, 16.9, 5.4),
      line(4.6, 20.7, 19.4, 20.7),
    ],
    gAnims: { swipe: dip("-1.3", "1.3") },
  },
  "credit-card-validation": {
    auto: false,
    dur: 1.5,
    parts: [
      CARD_OPEN,
      CARD_STRIPE_OPEN,
      CARD_DASH,
      BADGE,
      A(path("M15.4 16.5l1.3 1.3 2.5-2.7", { "stroke-dasharray": 5.6 }), [drawOn(5.6, 0.12, 0.7)]),
    ],
  },
    "currency": { dur: 1.4, auto: true, parts: [
      circle(12, 12, 4),
      path("M5.2 5.2 9.2 9.2M18.8 5.2 14.8 9.2M5.2 18.8 9.2 14.8M18.8 18.8 14.8 14.8"),
    ] },

  /* ---------- boxes ---------- */
  "delivery-box01": {
    auto: false,
    dur: 1.5,
    parts: [G("lid", [LID1, TAPE]), BODY1, line(7.4, 13.4, 10.2, 13.4), line(7.4, 16.2, 9.4, 16.2)],
    gAnims: { lid: dip("0", "0.9") },
  },
  "delivery-box02": {
    auto: false,
    dur: 1.5,
    parts: [BOX2, SEAM2, G("arr", [path("M15 15.2l1.1-1.1 1.1 1.1M16.1 14.3v3")]), line(7.4, 12.8, 10.2, 12.8)],
    gAnims: { arr: dip("0", "-1") },
  },
  "delivery-return01": {
    auto: false,
    dur: 1.6,
    parts: [LID1, TAPE, ...BODY1_OPEN, G("ret", RETURN_ARROW)],
    gAnims: { ret: dip("-1.2", "0") },
  },
  "delivery-return02": {
    auto: false,
    dur: 1.6,
    parts: [BOX2_OPEN, SEAM2, G("ret", RETURN_ARROW)],
    gAnims: { ret: dip("-1.2", "0") },
  },
  "delivery-secure01": {
    auto: false,
    dur: 1.6,
    parts: [LID1, TAPE, ...BODY1_OPEN, ...lockBadge()],
    gAnims: lockAnims,
  },
  "delivery-secure02": {
    auto: false,
    dur: 1.6,
    parts: [BOX2_OPEN, SEAM2, ...lockBadge()],
    gAnims: lockAnims,
  },
  "delivery-tracking01": {
    auto: false,
    dur: 1.6,
    parts: [LID1, TAPE, ...BODY1_PIN, G("pin", PIN)],
    gAnims: { pin: tn("translate", ["0 -2.4", "0 0.4", "0 -0.15", "0 0"], [0, 0.5, 0.72, 1]) },
  },
  "delivery-tracking02": {
    auto: false,
    dur: 1.6,
    parts: [BOX2_PIN, SEAM2, G("pin", PIN)],
    gAnims: { pin: tn("translate", ["0 -2.4", "0 0.4", "0 -0.15", "0 0"], [0, 0.5, 0.72, 1]) },
  },
    "delivery-view01": { dur: 1.8,
    auto: false,
    parts: [
    path("M3.1 8.9h17.8l-.9-2.5c-.6-1.7-1.5-2.5-2.9-2.5H7c-1.4 0-2.3.8-2.9 2.5z"),
    line(12, 8.9, 12, 4.4),
    path("M3.1 8.9v7.3c0 2.4 1.9 4.3 4.3 4.3h5"),
    path("M20.9 8.9v2.6"),
    G("eye", [
      path("M21 17.4c-1-1.7-2.6-2.7-4.4-2.7s-3.4 1-4.4 2.7c1 1.7 2.6 2.7 4.4 2.7s3.4-1 4.4-2.7z"),
      circle(16.6, 17.4, 1.2, { fill: "currentColor", stroke: "none" }),
    ]),
  ],
    sAnims: { eye: { pivot: [16.6, 17.4], anim: tn("scale", ["1 1", "1 0.3", "1 1", "1 1"], [0, 0.18, 0.42, 1]) } } },
    "delivery-view02": { dur: 1.8,
    auto: false,
    parts: [
    path("M20.6 11.2V6.7c0-1.2-1-2.2-2.2-2.2H5.6c-1.2 0-2.2 1-2.2 2.2v9.7c0 2.4 1.9 4.3 4.3 4.3h5.1"),
    line(3.4, 8.9, 20.6, 8.9),
    G("eye", [
      path("M21 17.4c-1-1.7-2.6-2.7-4.4-2.7s-3.4 1-4.4 2.7c1 1.7 2.6 2.7 4.4 2.7s3.4-1 4.4-2.7z"),
      circle(16.6, 17.4, 1.2, { fill: "currentColor", stroke: "none" }),
    ]),
  ],
    sAnims: { eye: { pivot: [16.6, 17.4], anim: tn("scale", ["1 1", "1 0.3", "1 1", "1 1"], [0, 0.18, 0.42, 1]) } } },

  /* ---------- trucks ---------- */
  "delivery-delay01": {
    dur: 2,
    pp: false,
    parts: [
      circle(6.1, 6.1, 3.7),
      G("wind", [path("M6.1 4.4v1.7l1.2.9")]),
      rect(9.9, 9.9, 6, 6.5, 1.2),
      path("M15.9 16.4v-5.2c0-.4.3-.7.7-.7h1.7c.5 0 .9.2 1.2.6l1.3 1.9c.2.3.3.6.3 1v1.5c0 .5-.4.9-.9.9h-.8"),
      line(9.9, 16.4, 19.2, 16.4),
      circle(11.9, 18.3, 1.9),
      circle(17, 18.3, 1.9),
    ],
    gAnims: { wind: tn("rotate", ["0 6.1 6.1", "360 6.1 6.1"]) },
  },
  "delivery-delay02": {
    dur: 2,
    pp: false,
    parts: [
      circle(6.1, 6.1, 3.7),
      G("wind", [path("M6.1 4.4v1.7l-1.2.9")]),
      path(
        "M9.9 16.4v-4.6c0-1 .7-1.8 1.7-1.8h4c1 0 1.8.8 1.8 1.8v.5h1.2c.5 0 .9.2 1.2.6l1.1 1.6c.2.3.3.6.3 1v1.9c0 .5-.4.9-.9.9h-.9"
      ),
      line(9.9, 16.4, 19.4, 16.4),
      circle(11.9, 18.3, 1.9),
      circle(17, 18.3, 1.9),
    ],
    gAnims: { wind: tn("rotate", ["0 6.1 6.1", "360 6.1 6.1"]) },
  },
  "delivery-sent01": {
    parts: [G("go", [TRUCK_CARGO, TRUCK_CAB, ROAD, ...WHEELS, CHEVRONS])],
    gAnims: { go: tn("translate", ["0 0", "1.6 0", "0 0"]) },
  },
    "delivery-sent02": { parts: [
    G("go", [
      path("M4.15 15.1L4.15 6.7C4.15 5.7 4.95 4.9 5.95 4.9L12.95 4.9C13.95 4.9 14.75 5.7 14.75 6.7L14.75 7.6L16.55 7.6C17.15 7.6 17.65 7.9 18.05 8.4L19.65 10.5C19.95 10.9 20.05 11.4 20.05 11.9L20.05 14C20.05 14.6 19.55 15.1 18.95 15.1L17.75 15.1"),
      line(3.95, 15.1, 18.95, 15.1),
      circle(8.05, 17.1, 2),
      circle(16.15, 17.1, 2),
      path("M6.15 8.2L7.95 10L6.15 11.8M9.05 8.2L10.85 10L9.05 11.8"),
      path("M15.45 8.5L15.45 10.5L17.75 10.5"),
    ]),
  ],
    gAnims: { go: tn("translate", ["0 0", "1.6 0", "0 0"]) } },
  "delivery-truck01": {
    auto: false,
    dur: 1.5,
    parts: [
      G("go", [TRUCK_CARGO, TRUCK_CAB, ...WHEELS]),
      ROAD,
      A(SPEED3[0], [tn("translate", ["0 0", "-2.4 0", "0 0", "0 0"], [0, 0.3, 0.85, 1]), an("opacity", ["1", "0.25", "1", "1"], [0, 0.3, 0.85, 1])]),
      A(SPEED3[1], [tn("translate", ["0 0", "-2.4 0", "0 0"], [0, 0.5, 1]), an("opacity", ["1", "0.25", "1"], [0, 0.5, 1])]),
      A(SPEED3[2], [tn("translate", ["0 0", "-2.4 0", "0 0"], [0, 0.68, 1]), an("opacity", ["1", "0.25", "1"], [0, 0.68, 1])]),
    ],
    gAnims: { go: dip("1.2", "0") },
  },
    "delivery-truck02": { dur: 1.5,
    auto: false,
    parts: [
    G("go", [
      path("M4.15 15.1L4.15 6.7C4.15 5.7 4.95 4.9 5.95 4.9L12.95 4.9C13.95 4.9 14.75 5.7 14.75 6.7L14.75 7.6L16.55 7.6C17.15 7.6 17.65 7.9 18.05 8.4L19.65 10.5C19.95 10.9 20.05 11.4 20.05 11.9L20.05 14C20.05 14.6 19.55 15.1 18.95 15.1L17.75 15.1"),
      circle(8.05, 17.1, 2),
      circle(16.15, 17.1, 2),
      path("M15.45 8.5L15.45 10.5L17.75 10.5"),
    ]),
    line(3.95, 15.1, 18.95, 15.1),
    A(line(6.05, 8.2, 9.25, 8.2), [tn("translate", ["0 0", "-2.4 0", "0 0", "0 0"], [0, 0.3, 0.85, 1]), an("opacity", ["1", "0.25", "1", "1"], [0, 0.3, 0.85, 1])]),
    A(line(6.05, 10.5, 8.45, 10.5), [tn("translate", ["0 0", "-2.4 0", "0 0"], [0, 0.5, 1]), an("opacity", ["1", "0.25", "1"], [0, 0.5, 1])]),
    A(line(6.05, 12.8, 8.05, 12.8), [tn("translate", ["0 0", "-2.4 0", "0 0"], [0, 0.68, 1]), an("opacity", ["1", "0.25", "1"], [0, 0.68, 1])]),
  ],
    gAnims: { go: tn("translate", ["0 0", "1.2 0", "0 0"]) } },

  /* ---------- discount ---------- */
  discount: {
    auto: false,
    dur: 1.8,
    parts: [G("twirl", [path(bloom(12, 12, 8, 7.9, 1.15))]), ...pct(12, 12)],
    gAnims: { twirl: tn("rotate", ["0 12 12", "45 12 12"]) },
  },
  discount01: {
    auto: false,
    dur: 1.8,
    parts: [G("twirl", [path(bloom(12, 12, 6, 7.7, 1.5))]), ...pct(12, 12)],
    gAnims: { twirl: tn("rotate", ["0 12 12", "60 12 12"]) },
  },
  "discount-tag01": {
    auto: false,
    dur: 1.8,
    parts: [
      G("hang", [
        path(
          "M7.3 20.9c-1.5 0-2.7-1.2-2.7-2.7v-8.1c0-1 .4-2 1.2-2.6l4.5-3.9c1-.9 2.4-.9 3.4 0l4.5 3.9c.8.6 1.2 1.6 1.2 2.6v8.1c0 1.5-1.2 2.7-2.7 2.7H7.3z"
        ),
        circle(12, 7.6, 1, fill()),
        ...pct(12, 14.8),
      ]),
    ],
    gAnims: { hang: sway(12, 7.6, 7) },
  },
  "discount-tag02": {
    auto: false,
    dur: 1.8,
    parts: [
      G("hang", [
        path(
          "M10.3 3.2H5.9c-1.5 0-2.7 1.2-2.7 2.7v4.4c0 .7.3 1.4.8 1.9l7.6 7.6c1.2 1.2 3.1 1.2 4.3 0l3.4-3.4c1.2-1.2 1.2-3.1 0-4.3l-7.6-7.6c-.5-.5-1.1-.8-1.4-.8z"
        ),
        circle(6.9, 6.9, 1, fill()),
        ...pct(12.2, 12.2),
      ]),
    ],
    gAnims: { hang: sway(6.9, 6.9, 8) },
  },

  /* ---------- dollar ---------- */
    "dollar-circle": { dur: 1.7,
    auto: false,
    parts: [
    G("flip", [
      circle(12, 12, 8.6),
      path("M15.1 9.9c-.2-1.5-1.5-2.6-3.3-2.6-2 0-3.4 1.1-3.4 2.5 0 1.3 1 2.1 3.4 2.1 2.7 0 3.9 1 3.9 2.6 0 1.6-1.8 2.7-3.9 2.7-2.3 0-3.7-1.2-3.8-2.7"),
      line(11.9, 6.2, 11.9, 7.1),
      line(11.9, 16.7, 11.9, 17.6),
    ]),
  ],
    sAnims: { flip: { pivot: [12, 12], anim: tn("scale", ["1 1", "0.3 1", "1 1"]) } } },
  "dollar-square": {
    auto: false,
    dur: 1.5,
    parts: [
      rect(3.3, 3.3, 17.4, 17.4, 4.6),
      G("mark", [
        path(
          "M15.1 9.9c-.2-1.5-1.5-2.6-3.3-2.6-2 0-3.4 1.1-3.4 2.5 0 1.3 1 2.1 3.4 2.1 2.7 0 3.9 1 3.9 2.6 0 1.6-1.8 2.7-3.9 2.7-2.3 0-3.7-1.2-3.8-2.7"
        ),
        line(11.9, 6.2, 11.9, 7.1),
        line(11.9, 16.7, 11.9, 17.6),
      ]),
    ],
    sAnims: { mark: throb(12, 12, 1.15) },
  },
  "dollar-sign": {
    auto: false,
    dur: 1.5,
    parts: [
      G("mark", [
        path(
          "M17.6 8.6c-.1-2.2-2.5-3.9-5.6-3.9-3.2 0-5.5 1.7-5.5 3.8 0 2 1.5 3.1 5.5 3.1 4.2 0 6 1.6 6 4 0 2.4-2.7 3.9-6 3.9-3.5 0-5.8-1.7-5.9-4.1"
        ),
        line(12, 3, 12, 21),
      ]),
    ],
    sAnims: { mark: throb(12, 12, 1.12) },
  },
  dollar01: {
    auto: false,
    dur: 1.5,
    parts: [
      G("mark", [
        path(
          "M17.6 8.6c-.1-2.2-2.5-3.9-5.6-3.9-3.2 0-5.5 1.7-5.5 3.8 0 2 1.5 3.1 5.5 3.1 4.2 0 6 1.6 6 4 0 2.4-2.7 3.9-6 3.9-3.5 0-5.8-1.7-5.9-4.1"
        ),
        line(12, 3, 12, 4.4),
        line(12, 19.6, 12, 21),
      ]),
    ],
    sAnims: { mark: throb(12, 12, 1.12) },
  },
  dollar02: {
    auto: false,
    dur: 1.5,
    parts: [
      G("mark", [
        path(
          "M17.3 8.9c-.2-2-2.3-3.6-5.3-3.6-3 0-5.2 1.6-5.2 3.5 0 1.9 1.5 3 5.2 3 4 0 5.7 1.5 5.7 3.8 0 2.3-2.6 3.7-5.7 3.7-3.3 0-5.5-1.6-5.6-3.9"
        ),
        line(12, 2.7, 12, 21.3),
      ]),
    ],
    sAnims: { mark: throb(12, 12, 1.12) },
  },
  "dollar-receive01": {
    auto: false,
    dur: 1.4,
    parts: [S_SMALL, line(6.9, 3.4, 6.9, 4.8), line(6.9, 19.2, 6.9, 20.6), G("inn", ARROW_LEFT)],
    gAnims: { inn: dip("-1.6", "0") },
  },
  "dollar-receive02": {
    auto: false,
    dur: 1.4,
    parts: [S_SMALL, line(6.9, 2.9, 6.9, 21.1), G("inn", ARROW_LEFT)],
    gAnims: { inn: dip("-1.6", "0") },
  },
  "dollar-send01": {
    auto: false,
    dur: 1.4,
    parts: [S_SMALL, line(6.9, 3.4, 6.9, 4.8), line(6.9, 19.2, 6.9, 20.6), G("out", ARROW_RIGHT)],
    gAnims: { out: dip("1.6", "0") },
  },
  "dollar-send02": {
    auto: false,
    dur: 1.4,
    parts: [S_SMALL, line(6.9, 2.9, 6.9, 21.1), G("out", ARROW_RIGHT)],
    gAnims: { out: dip("1.6", "0") },
  },

  /* ---------- euro ---------- */
    "euro": { dur: 1.5,
    auto: false,
    parts: [
    G("mark", [
      path("M18.5 6.9C17.4 5.2 15.7 4.2 13.7 4.2C10.2 4.2 7.7 7 7.7 11L7.7 13C7.7 17 10.2 19.8 13.7 19.8C15.7 19.8 17.4 18.8 18.5 17.1"),
      line(5.5, 10.2, 12.9, 10.2),
      line(5.5, 13.8, 12.9, 13.8),
    ]),
  ],
    sAnims: { mark: { pivot: [12.2, 12], anim: tn("scale", ["1", "1.12", "1"]) } } },
    "euro-circle": { dur: 1.7,
    auto: false,
    parts: [
    G("flip", [
      circle(12, 12, 8.6),
      path("M15.1 9.2c-.8-1.2-2-1.9-3.4-1.9-2.4 0-4.2 1.9-4.2 4.7v1.4c0 2.8 1.8 4.7 4.2 4.7 1.4 0 2.6-.7 3.4-1.9"),
      line(6.9, 10.9, 11.4, 10.9),
      line(6.9, 13.1, 11.4, 13.1),
    ]),
  ],
    sAnims: { flip: { pivot: [12, 12], anim: tn("scale", ["1 1", "0.3 1", "1 1"]) } } },
  "euro-square": {
    auto: false,
    dur: 1.5,
    parts: [rect(3.3, 3.3, 17.4, 17.4, 4.6), G("mark", EURO_SMALL)],
    sAnims: { mark: throb(11.4, 12.7, 1.15) },
  },
  "euro-receive": {
    auto: false,
    dur: 1.4,
    parts: [...EURO_SIDE, G("inn", ARROW_LEFT)],
    gAnims: { inn: dip("-1.6", "0") },
  },
  "euro-send": {
    auto: false,
    dur: 1.4,
    parts: [...EURO_SIDE, G("out", ARROW_RIGHT)],
    gAnims: { out: dip("1.6", "0") },
  },

  /* ---------- gifts & invoice ---------- */
  gift: {
    auto: false,
    dur: 1.5,
    parts: [
      path("M5 11.6v5.2c0 1.9 1.5 3.4 3.4 3.4h7.2c1.9 0 3.4-1.5 3.4-3.4v-5.2"),
      line(12, 11.6, 12, 20.2),
      G("lidpop", [
        rect(3.4, 7, 17.2, 4.6, 1.5),
        path("M7.3 4.7c0-1.1.9-2 2-2h.2c2.1 0 2.9 1.7 2.9 3.8v.7H9.9c-1.4 0-2.6-1.1-2.6-2.5z"),
        path("M16.7 4.7c0-1.1-.9-2-2-2h-.2c-2.1 0-2.9 1.7-2.9 3.8v.7h2.5c1.4 0 2.6-1.1 2.6-2.5z"),
      ]),
    ],
    gAnims: { lidpop: tn("translate", ["0 0", "0 0", "0 -0.7", "0 0", "0 0"], [0, 0.3, 0.55, 0.8, 1]) },
  },
  "gift-card": { dur: 1.4, auto: true, parts: [
    rect(3, 7, 18, 13, 2.5),
    path("M12 7V20"),
    path("M12 7C10.4 3.8 7 4.2 7.5 5.9S11 7 12 7C13 7 16.5 7.6 16.5 5.9S13.6 3.8 12 7Z"),
  ] },
  "gift-card02": {
    auto: false,
    dur: 1.5,
    parts: [
      CARD,
      line(2.6, 12.2, 21.4, 12.2),
      line(9.9, 4.6, 9.9, 19.4),
      G("pip", [path("M9.9 11l1.2 1.2-1.2 1.2-1.2-1.2z", fill())]),
    ],
    sAnims: { pip: throb(9.9, 12.2, 1.35) },
  },
  invoice01: {
    auto: false,
    dur: 1.7,
    parts: [
      path(
        "M16.9 5.4c0-1-.8-1.8-1.8-1.8H8.2c-1 0-1.8.8-1.8 1.8v13.3l1.9 1.6 1.9-1.6 1.9 1.6 1.9-1.6 1.9 1.6 1.9-1.6V5.4z"
      ),
      A(line(8.6, 8.2, 12.4, 8.2), [an("x2", ["8.6", "8.6", "12.4", "12.4"], [0, 0.08, 0.45, 1])]),
      A(line(8.6, 11.4, 11.1, 11.4), [an("x2", ["8.6", "8.6", "11.1", "11.1"], [0, 0.25, 0.6, 1])]),
      A(line(12.9, 11.4, 15.2, 11.4), [an("x2", ["12.9", "12.9", "15.2", "15.2"], [0, 0.4, 0.72, 1])]),
    ],
  },
};
