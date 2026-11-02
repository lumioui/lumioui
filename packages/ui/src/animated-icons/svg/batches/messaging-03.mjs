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

/* Shared silhouettes — chat/comment/inbox family cohesion. */

// chat bubble, tail bottom-left (same silhouette as the canon `message`)
const BUB =
  "M5.4 4.9h13.2c1.5 0 2.7 1.2 2.7 2.7v6.4c0 1.5-1.2 2.7-2.7 2.7h-4.4l-3.4 3c-.6.5-1.5 0-1.5-.8v-2.2H5.4c-1.5 0-2.7-1.2-2.7-2.7V7.6c0-1.5 1.2-2.7 2.7-2.7z";

// chat bubble open at top-right, for the badge-dot variants
const BUB1 =
  "M13.4 3.4c-.5 0-.9 0-1.4 0H7.6c-2.2 0-3.9 1.7-3.9 4v6c0 2.3 1.7 4 3.9 4h1v2.7c0 .8 1 1.2 1.6.7l2.6-2.5c.4-.4 1-.7 1.7-.7h5.6c.9 0 1.2-.5 1.2-1.5v-2.5";

// rectangular comment bubble with the curled tail at bottom-left
const CBUB =
  "M6.3 19.5c-1.4-.2-2.4-.6-3-1.2-1.1-1.1-1.1-3-1.1-6.7v-.9c0-3.7 0-5.5 1.1-6.6 1.1-1.1 2.9-1.1 6.6-1.1h4.2c3.7 0 5.5 0 6.6 1.1 1.1 1.1 1.1 2.9 1.1 6.6v.9c0 3.7 0 5.6-1.1 6.7-1.1 1.1-2.9 1.1-6.6 1.1h-.7c-.4 0-.8.1-1.2.2-1.1.3-2 .9-3 1.3-1.4.7-2.2 1-2.7.7-.8-.6-.3-2.5 0-3.9";

// same, open at top-right for a corner badge
const CBUB_OPEN =
  "M6.3 19.5c-1.4-.2-2.4-.6-3-1.2-1.1-1.1-1.1-3-1.1-6.7v-.9c0-3.7 0-5.5 1.1-6.6 1.1-1.1 2.9-1.1 6.6-1.1h1.6M6.6 18.1c-.3 1.1-1 2.9-.3 3.6.5.5 1.4.2 2.8-.4 1-.5 2.1-1 3.2-1.4.4-.1.8-.2 1.3-.2 3.7 0 5.5 0 6.6-1.1 1-1 1.1-2.8 1.1-6.1";

// oval comment bubble, tail drop at bottom
const OBUB =
  "M12 3.4c5.4 0 9.7 3.1 9.7 7.5s-4.3 7.5-9.7 7.5c-.4 0-.8 0-1.1 0v2.4c-.9-.3-1.9-.9-2.7-1.5C6.4 18.5 2.3 15.6 2.3 10.9 2.3 6.5 6.6 3.4 12 3.4z";

// inbox tray: rounded box with the scoop cut across the front
const IB_OPEN_TOP =
  "M7 3.3c-1.3.1-2.2.5-2.8 1.1-1 1-1.1 2.7-1.1 5.1v5.4c0 2.4.1 4.1 1.1 5.1 1 1 2.7 1.1 5.1 1.1h5.4c2.4 0 4.1-.1 5.1-1.1 1-1 1.1-2.7 1.1-5.1V9.5c0-2.4-.1-4.1-1.1-5.1-.6-.6-1.5-1-2.8-1.1";
const IB_OPEN_RIGHT =
  "M11.6 3.2H9.5c-2.4 0-4.1.1-5.1 1.1-1 1-1.1 2.7-1.1 5.1v5.4c0 2.4.1 4.1 1.1 5.1 1 1 2.7 1.1 5.1 1.1h4.8c2.4 0 4.1-.1 5.1-1.1 1-1 1.1-2.7 1.1-5.1v-3.6";
const IB_SCOOP =
  "M20.9 13.7h-4.2c-.7 0-1.3.5-1.6 1.2-.4.8-1.2 1.6-3.1 1.6s-2.7-.8-3.1-1.6c-.3-.7-.9-1.2-1.6-1.2H3.1";
const IB_SCOOP_CHECK =
  "M20.5 13.8h-3.6c-.7 0-1.3.5-1.6 1.2-.4.8-1.2 1.6-3.1 1.6s-2.7-.8-3.1-1.6c-.3-.7-.9-1.2-1.6-1.2H3.3";

// two typing dots inside a 01-bubble
const DOTS = [circle(8.4, 11.2, 1.05, fill()), circle(12.4, 11.2, 1.05, fill())];

/* gesture recipes — one signature verb per icon; pose(t=0) = pose(t=1).
 * typ: typing-dot bounce; draw: stroke traces on; pop: pivot scale-in. */
const DO = { pathLength: 1, "stroke-dasharray": 1 };
const draw = (a = 0.12, b = 0.7) => [an("stroke-dashoffset", ["1", "1", "0"], [0, a, b])];
const typ = (x, y, t0) => A(circle(x, y, 1.05, fill()), [
  an("cy", [String(y), String(y - 1.4), String(y)], [t0, t0 + 0.22, t0 + 0.45]),
]);
const popAt = (px, py, s = 1.18) => ({
  pivot: [px, py],
  anim: tn("scale", ["1", "1", String(s), "1", "1"], [0, 0.3, 0.5, 0.7, 1]),
});
const bob = (dy = -1) => tn("translate", ["0 0", `0 ${dy}`, "0 0"], [0, 0.45, 1]);

export const icons = {
  /* ---------- chat-* : glyph inside the bubble ---------- */

  "chat-question": {
    auto: false,
    parts: [
      path(BUB),
      G("q", [
        path("M10.2 8.7c.1-1.1 1-2 2.1-1.9 1.1.1 1.9 1 1.9 2.1-.1 1.3-1.4 1.6-1.9 2.6-.2.4-.3.9-.3 1.4"),
        circle(12, 15, 1, fill()),
      ]),
    ],
    gAnims: { q: bob(-1.1) },
  },
  "chat-search": {
    auto: false,
    parts: [
      path(BUB),
      G("glass", [circle(11.5, 9.9, 2.5), line(13.7, 12.1, 15.6, 14)]),
    ],
    gAnims: { glass: tn("rotate", ["0 11.5 9.9", "-9 11.5 9.9", "0 11.5 9.9"], [0, 0.45, 1]) },
  },
  "chat-secure": {
    auto: false,
    parts: [
      path(BUB),
      G("shield", [path("M12 6.3c.9.5 1.9.8 2.9.9.4 0 .6.3.6.7v1.9c0 2.5-1.6 4-3.5 4.6-1.9-.6-3.5-2.1-3.5-4.6V7.9c0-.4.2-.7.6-.7 1-.1 2-.4 2.9-.9z")]),
    ],
    sAnims: { shield: popAt(12, 10.3, 1.15) },
  },
  "chat-spark": {
    auto: false,
    parts: [
      path(BUB),
      G("spark", [path("M12 6.5c.4 2.3 1.6 3.5 3.9 3.9-2.3.4-3.5 1.6-3.9 3.9-.4-2.3-1.6-3.5-3.9-3.9 2.3-.4 3.5-1.6 3.9-3.9z", fill())]),
    ],
    sAnims: { spark: popAt(12, 10.5, 1.25) },
  },
  "chat-translate": {
    auto: false,
    parts: [
      path(BUB),
      path("M9.2 7.3h5.8"),
      G("letters", [
        path("M9.6 14.9c2.4-1.6 4.3-3.7 5-6.9"),
        path("M13 14.4c-1.2-1-2.1-2.2-2.6-3.3"),
      ]),
    ],
    gAnims: { letters: bob(-0.8) },
  },
  "chat-unlock": {
    auto: false,
    parts: [
      path(BUB),
      G("shackle", [path("M10 9.9V8c0-1.4 1-2.5 2.4-2.5 1.3 0 2.3 1 2.3 2.2")]),
      rect(8.9, 9.9, 6.3, 5.1, 1.6),
      circle(12.05, 12.5, 0.9, fill()),
    ],
    gAnims: { shackle: tn("rotate", ["0 10 9.9", "-20 10 9.9", "0 10 9.9"], [0, 0.4, 1]) },
  },
  "chat-upload": {
    auto: false,
    parts: [
      path(BUB),
      G("arr", [line(12, 14, 12, 7.4), path("M8.8 10.6 12 7.4l3.2 3.2")]),
    ],
    gAnims: { arr: bob(-1.4) },
  },
  "chat-user": {
    auto: false,
    parts: [
      path(BUB),
      G("person", [circle(12, 8.9, 2), path("M8.6 14.7c.5-1.9 1.9-3 3.4-3s2.9 1.1 3.4 3")]),
    ],
    gAnims: { person: bob(-0.9) },
  },

  /* ---------- chat-*01 : bubble + corner badge + typing dots ---------- */

  "chat-search01": {
    auto: false,
    parts: [
      path(BUB1),
      G("glass", [circle(18.1, 5.4, 2.7), line(20.2, 7.5, 21.6, 8.9)]),
      typ(8.4, 11.2, 0),
      typ(12.4, 11.2, 0.18),
    ],
    gAnims: { glass: tn("rotate", ["0 18.1 5.4", "-9 18.1 5.4", "0 18.1 5.4"], [0, 0.45, 1]) },
  },
  "chat-secure01": {
    auto: false,
    parts: [
      path(BUB1),
      G("shield", [path("M18.5 2.4c.7.4 1.5.6 2.3.7.3 0 .5.2.5.6v1.5c0 1.9-1.3 3.2-2.8 3.7-1.5-.5-2.8-1.8-2.8-3.7V3.7c0-.4.2-.6.5-.6.8-.1 1.6-.3 2.3-.7z")]),
      typ(8.4, 11.2, 0),
      typ(12.4, 11.2, 0.18),
    ],
    sAnims: { shield: popAt(18.5, 5.5, 1.15) },
  },
  "chat-spark01": {
    auto: false,
    parts: [
      path(BUB1),
      G("spark", [path("M18.5 2.5c.3 1.7 1.3 2.7 3 3-1.7.3-2.7 1.3-3 3-.3-1.7-1.3-2.7-3-3 1.7-.3 2.7-1.3 3-3z")]),
      typ(8.4, 11.2, 0),
      typ(12.4, 11.2, 0.18),
    ],
    sAnims: { spark: popAt(18.5, 5.5, 1.25) },
  },
  "chat-translate01": {
    auto: false,
    parts: [
      path(BUB1),
      G("letters", [
        path("M16.2 3.6h4.6"),
        path("M16.6 9.3c1.8-1.3 3.3-3 3.9-5.5"),
        path("M18.8 8.6c-.9-.8-1.6-1.7-2-2.6"),
      ]),
      typ(8.4, 11.2, 0),
      typ(12.4, 11.2, 0.18),
    ],
    gAnims: { letters: bob(-0.7) },
  },
  "chat-unlock01": {
    auto: false,
    parts: [
      path(BUB1),
      G("shackle", [path("M16.9 5V4.1c0-.8.6-1.4 1.4-1.4.7 0 1.3.4 1.4 1.1")]),
      rect(15.6, 5, 5.4, 4.4, 1.3),
      typ(8.4, 11.2, 0),
      typ(12.4, 11.2, 0.18),
    ],
    gAnims: { shackle: tn("rotate", ["0 16.9 5", "-20 16.9 5", "0 16.9 5"], [0, 0.4, 1]) },
  },
  "chat-upload01": {
    auto: false,
    parts: [
      path(BUB1),
      G("arr", [line(18.5, 9, 18.5, 3.2), path("M16.4 5.2c.7-.8 1.5-1.7 2.1-2.2.6.5 1.4 1.4 2.1 2.2")]),
      typ(8.4, 11.2, 0),
      typ(12.4, 11.2, 0.18),
    ],
    gAnims: { arr: bob(-1.2) },
  },
  "chat-user01": {
    auto: false,
    parts: [
      path(BUB1),
      G("person", [circle(18.6, 3.9, 1.7), path("M15.9 8.6c0-1.5 1.2-2.7 2.7-2.7s2.7 1.2 2.7 2.7")]),
      typ(8.4, 11.2, 0),
      typ(12.4, 11.2, 0.18),
    ],
    gAnims: { person: bob(-0.8) },
  },

  "chatting01": {
    auto: false,
    parts: [
      path("M18.9 8.8C17.9 5.6 15 3.5 11.6 3.5c-4.6 0-8.2 3.3-8.2 7.5 0 1.7.6 3.2 1.7 4.4.3.3.4.7.4 1.1 0 .9-.4 1.7-.9 2.4.8.1 1.7-.1 2.4-.5.4-.2.9-.3 1.4-.2"),
      G("reply", [path("M11.4 15.9c0-2.9 2.3-5.3 5.2-5.3s5 2.3 5 5.2c0 1.2-.4 2.2-1 3.1-.2.3-.3.6-.2 1 .1.5.3.9.6 1.3-.8.2-1.6 0-2.3-.4-.3-.1-.5-.1-.8 0-.5.2-1 .3-1.5.3-2.8 0-5-2.4-5-5.2z")]),
    ],
    sAnims: { reply: { pivot: [16.6, 15.9], anim: tn("scale", ["1", "1", "1.12", "1", "1"], [0, 0.3, 0.5, 0.7, 1]) } },
  },

  /* ---------- comments ---------- */

  comment01: {
    auto: false,
    parts: [
      path(CBUB),
      A(line(8.2, 8.7, 12.4, 8.7, DO), draw(0.08, 0.5)),
      A(line(8.2, 13.3, 15.8, 13.3, DO), draw(0.32, 0.75)),
    ],
  },
  comment02: { auto: false, parts: [G("bub", [path(CBUB)])], gAnims: { bub: bob(-1) } },
  comment03: {
    auto: false,
    parts: [
      path(OBUB),
      A(line(8.2, 8.8, 15.8, 8.8, DO), draw(0.08, 0.5)),
      A(line(8.2, 12.9, 12.2, 12.9, DO), draw(0.32, 0.75)),
    ],
  },
    "comment-add01": { auto: false,
    parts: [
    path("M6.3 19.3C4.9 19.1 3.9 18.7 3.3 18.1C2.2 17 2.2 15.1 2.2 11.4L2.2 10.5C2.2 6.8 2.2 5 3.3 3.9C4.4 2.8 6.2 2.8 9.9 2.8L11.5 2.8M6.6 17.9C6.3 19 5.6 20.8 6.3 21.5C6.8 22 7.7 21.7 9.1 21.1C10.1 20.6 11.2 20.1 12.3 19.7C12.7 19.6 13.1 19.5 13.6 19.5C17.3 19.5 19.1 19.5 20.2 18.4C21.2 17.4 21.3 15.6 21.3 12.3"),
    G("plus", [
      line(18.3, 2.6, 18.3, 8.6),
      line(15.3, 5.6, 21.3, 5.6),
    ]),
    A(line(8.2, 9, 11.4, 9, { pathLength: 1, "stroke-dasharray": 1 }), [an("stroke-dashoffset", ["1", "1", "0"], [0, 0.08, 0.5])]),
    A(line(8.2, 14, 14.2, 14, { pathLength: 1, "stroke-dasharray": 1 }), [an("stroke-dashoffset", ["1", "1", "0"], [0, 0.32, 0.75])]),
  ],
    gAnims: { plus: tn("rotate", ["0 18.3 5.6", "90 18.3 5.6"]) } },
    "comment-add02": { auto: false,
    parts: [
    path("M6.3 19.3C4.9 19.1 3.9 18.7 3.3 18.1C2.2 17 2.2 15.1 2.2 11.4L2.2 10.5C2.2 6.8 2.2 5 3.3 3.9C4.4 2.8 6.2 2.8 9.9 2.8L11.5 2.8M6.6 17.9C6.3 19 5.6 20.8 6.3 21.5C6.8 22 7.7 21.7 9.1 21.1C10.1 20.6 11.2 20.1 12.3 19.7C12.7 19.6 13.1 19.5 13.6 19.5C17.3 19.5 19.1 19.5 20.2 18.4C21.2 17.4 21.3 15.6 21.3 12.3"),
    G("plus", [
      line(18.3, 2.6, 18.3, 8.6),
      line(15.3, 5.6, 21.3, 5.6),
    ]),
  ],
    gAnims: { plus: tn("rotate", ["0 18.3 5.6", "90 18.3 5.6"]) } },
  "comment-add03": {
    auto: false,
    parts: [
      path(OBUB),
      G("plus", [line(12, 7.6, 12, 14.2), line(8.7, 10.9, 15.3, 10.9)]),
    ],
    gAnims: { plus: tn("rotate", ["0 12 10.9", "90 12 10.9"]) },
  },
    "comment-block01": { auto: false,
    parts: [
    path("M6.3 19.3C4.9 19.1 3.9 18.7 3.3 18.1C2.2 17 2.2 15.1 2.2 11.4L2.2 10.5C2.2 6.8 2.2 5 3.3 3.9C4.4 2.8 6.2 2.8 9.9 2.8L11.5 2.8M6.6 17.9C6.3 19 5.6 20.8 6.3 21.5C6.8 22 7.7 21.7 9.1 21.1C10.1 20.6 11.2 20.1 12.3 19.7C12.7 19.6 13.1 19.5 13.6 19.5C17.3 19.5 19.1 19.5 20.2 18.4C21.2 17.4 21.3 15.6 21.3 12.3"),
    circle(18.2, 5.7, 3.4),
    A(line(15.8, 3.3, 20.6, 8.1, { pathLength: 1, "stroke-dasharray": 1 }), [an("stroke-dashoffset", ["1", "1", "0"], [0, 0.15, 0.7])]),
    A(line(8.2, 9, 11.4, 9, { pathLength: 1, "stroke-dasharray": 1 }), [an("stroke-dashoffset", ["1", "1", "0"], [0, 0.08, 0.45])]),
    A(line(8.2, 14, 14.2, 14, { pathLength: 1, "stroke-dasharray": 1 }), [an("stroke-dashoffset", ["1", "1", "0"], [0, 0.3, 0.7])]),
  ] },
    "comment-block02": { auto: false,
    parts: [
    path("M6.3 19.3C4.9 19.1 3.9 18.7 3.3 18.1C2.2 17 2.2 15.1 2.2 11.4L2.2 10.5C2.2 6.8 2.2 5 3.3 3.9C4.4 2.8 6.2 2.8 9.9 2.8L11.5 2.8M6.6 17.9C6.3 19 5.6 20.8 6.3 21.5C6.8 22 7.7 21.7 9.1 21.1C10.1 20.6 11.2 20.1 12.3 19.7C12.7 19.6 13.1 19.5 13.6 19.5C17.3 19.5 19.1 19.5 20.2 18.4C21.2 17.4 21.3 15.6 21.3 12.3"),
    circle(18.2, 5.7, 3.4),
    A(line(15.8, 3.3, 20.6, 8.1, { pathLength: 1, "stroke-dasharray": 1 }), [an("stroke-dashoffset", ["1", "1", "0"], [0, 0.15, 0.7])]),
  ] },
  "comment-block03": {
    auto: false,
    parts: [
      path(OBUB),
      circle(12.2, 10.9, 3.6),
      A(line(9.6, 8.3, 14.8, 13.5, DO), draw(0.15, 0.7)),
    ],
  },
    "comment-remove01": { auto: false,
    parts: [
    path("M6.3 19.3C4.9 19.1 3.9 18.7 3.3 18.1C2.2 17 2.2 15.1 2.2 11.4L2.2 10.5C2.2 6.8 2.2 5 3.3 3.9C4.4 2.8 6.2 2.8 9.9 2.8L11.5 2.8M6.6 17.9C6.3 19 5.6 20.8 6.3 21.5C6.8 22 7.7 21.7 9.1 21.1C10.1 20.6 11.2 20.1 12.3 19.7C12.7 19.6 13.1 19.5 13.6 19.5C17.3 19.5 19.1 19.5 20.2 18.4C21.2 17.4 21.3 15.6 21.3 12.3"),
    A(path("M16.2 3.5L20.4 7.7M20.4 3.5L16.2 7.7", { pathLength: 1, "stroke-dasharray": 1 }), [an("stroke-dashoffset", ["1", "1", "0"], [0, 0.12, 0.7])]),
    A(line(8.2, 9, 11.4, 9, { pathLength: 1, "stroke-dasharray": 1 }), [an("stroke-dashoffset", ["1", "1", "0"], [0, 0.08, 0.45])]),
    A(line(8.2, 14, 14.2, 14, { pathLength: 1, "stroke-dasharray": 1 }), [an("stroke-dashoffset", ["1", "1", "0"], [0, 0.3, 0.7])]),
  ] },
    "comment-remove02": { auto: false,
    parts: [
    path("M6.3 19.3C4.9 19.1 3.9 18.7 3.3 18.1C2.2 17 2.2 15.1 2.2 11.4L2.2 10.5C2.2 6.8 2.2 5 3.3 3.9C4.4 2.8 6.2 2.8 9.9 2.8L11.5 2.8M6.6 17.9C6.3 19 5.6 20.8 6.3 21.5C6.8 22 7.7 21.7 9.1 21.1C10.1 20.6 11.2 20.1 12.3 19.7C12.7 19.6 13.1 19.5 13.6 19.5C17.3 19.5 19.1 19.5 20.2 18.4C21.2 17.4 21.3 15.6 21.3 12.3"),
    A(path("M16.2 3.5L20.4 7.7M20.4 3.5L16.2 7.7", { pathLength: 1, "stroke-dasharray": 1 }), [an("stroke-dashoffset", ["1", "1", "0"], [0, 0.12, 0.7])]),
  ] },
  "comment-remove03": {
    auto: false,
    parts: [path(OBUB), A(path("M9.7 8.4l5 5M14.7 8.4l-5 5", DO), draw())],
  },

  /* ---------- contacts ---------- */

  contact: {
    auto: false,
    parts: [
      rect(3.6, 4.4, 16.8, 16.8, 2.6),
      line(8.4, 2.7, 8.4, 5.2),
      line(15.6, 2.7, 15.6, 5.2),
      G("person", [circle(12, 10, 2.1), path("M8.3 17.8c.6-2.3 2-3.4 3.7-3.4s3.1 1.1 3.7 3.4")]),
    ],
    gAnims: { person: bob(-0.9) },
  },
  contact01: {
    auto: false,
    parts: [
      rect(4.6, 3.1, 16.6, 17.8, 2.7),
      line(2.6, 7, 4.6, 7),
      line(2.6, 12, 4.6, 12),
      line(2.6, 17, 4.6, 17),
      G("person", [circle(13, 8.9, 2.1), path("M9.4 16.9c.7-2.3 2-3.4 3.6-3.4s2.9 1.1 3.6 3.4")]),
    ],
    gAnims: { person: bob(-0.9) },
  },
  contact02: {
    auto: false,
    parts: [
      rect(4.6, 3.1, 16.6, 17.8, 2.7),
      line(2.6, 7, 4.6, 7),
      line(2.6, 12, 4.6, 12),
      line(2.6, 17, 4.6, 17),
      G("handset", [path("M10.4 9.6c.3-.4.9-.5 1.3-.1l.8.7c.4.4.4 1 0 1.4l-.4.4c.6 1.2 1.5 2.2 2.7 2.8l.4-.4c.4-.4 1-.4 1.4 0l.7.8c.4.4.3 1-.1 1.3-.6.6-1.4.8-2.2.5-2.8-1.2-4.6-4-4.6-7.4z")]),
    ],
    gAnims: { handset: tn("rotate", ["0 13 13", "-8 13 13", "6 13 13", "0 13 13"], [0, 0.25, 0.55, 1]) },
  },
  "contact-book": {
    auto: false,
    parts: [
      rect(4.8, 3.1, 16.4, 17.8, 2.7),
      line(7.6, 3.1, 7.6, 20.9),
      line(2.6, 7, 4.8, 7),
      line(2.6, 17, 4.8, 17),
      G("person", [circle(14, 9, 2.1), path("M10.4 16.9c.7-2.3 2-3.4 3.6-3.4s2.9 1.1 3.6 3.4")]),
    ],
    gAnims: { person: bob(-0.9) },
  },
  "contact-round": {
    auto: false,
    parts: [
      rect(3.6, 4.4, 16.8, 17, 2.8),
      line(8.2, 2.7, 8.2, 5),
      line(15.8, 2.7, 15.8, 5),
      line(8.2, 8.4, 15.8, 8.4),
      G("person", [circle(12, 14.6, 2.5), path("M7 21.4c.3-2.8 2.5-4.3 5-4.3s4.7 1.5 5 4.3")]),
    ],
    gAnims: { person: bob(-0.9) },
  },

  "device-access": {
    auto: false,
    parts: [
      path("M16.3 5.4c-.2-.8-.6-1.4-1.2-1.9-1-.9-2.6-.9-4.4-.9h-.9c-1.8 0-3.4 0-4.4.9-1 .9-1 2.6-1 4.4v8.4c0 1.8 0 3.4 1 4.4 1 .9 2.6.9 4.4.9h.9c1.8 0 3.4 0 4.4-.9.7-.6 1.1-1.5 1.2-2.5"),
      A(path("M8.2 11h7.4M9.8 11v1.6M12.6 11v1", DO), draw()),
      A(circle(18.3, 11, 2.7), [an("opacity", ["1", "1", "0.3", "1", "1"], [0, 0.5, 0.68, 0.85, 1])]),
      line(9.4, 18.9, 11.4, 18.9),
    ],
  },

  /* ---------- forward (media skip) ---------- */

    "forward01": { auto: false,
    parts: [
    line(4.36, 7, 4.36, 19.8),
    G("play", [
      path("M9.36 9L9.36 17.8C9.36 19.1 10.76 19.8 11.76 19.2L18.76 13.4C19.66 12.6 19.66 11.3 18.76 10.6L11.76 4.8C10.76 4.2 9.36 4.9 9.36 6.2Z"),
    ]),
  ],
    gAnims: { play: tn("translate", ["0 0", "1.2 0", "0 0"], [0, 0.45, 1]) } },
  forward02: {
    auto: false,
    parts: [
      G("t1", [path("M4.4 7.9v8.2c0 1.2 1.3 1.9 2.3 1.3l5.5-4.2c.8-.6.8-1.7 0-2.3l-5.5-4.2c-1-.6-2.3.1-2.3 1.4z")]),
      G("t2", [path("M11.8 7.9v8.2c0 1.2 1.3 1.9 2.3 1.3l5.5-4.2c.8-.6.8-1.7 0-2.3l-5.5-4.2c-1-.6-2.3.1-2.3 1.4z")]),
    ],
    gAnims: {
      t1: tn("translate", ["0 0", "1.1 0", "0 0"], [0, 0.4, 0.8]),
      t2: tn("translate", ["0 0", "0 0", "1.1 0", "0 0"], [0, 0.15, 0.55, 1]),
    },
  },

  /* ---------- headsets ---------- */

  headset: {
    auto: false,
    parts: [
      G("set", [
        path("M4.4 14.2v-3c0-4.2 3.4-7.6 7.6-7.6s7.6 3.4 7.6 7.6v4.4c0 1.6 0 2.6-.3 3.4-.4.9-1 1.6-1.9 2-.7.3-1.7.3-3.4.3h-2.4"),
        path("M7.4 10.7c-1.7 0-3 1.5-3 3.5s1.3 3.5 3 3.5c.8 0 1.5-.6 1.5-1.5v-4c0-.9-.7-1.5-1.5-1.5z"),
        path("M16.6 10.7c1.7 0 3 1.5 3 3.5s-1.3 3.5-3 3.5c-.8 0-1.5-.6-1.5-1.5v-4c0-.9.7-1.5 1.5-1.5z"),
      ]),
    ],
    gAnims: { set: bob(-0.9) },
  },
  "headset-connected": {
    auto: false,
    parts: [
      path("M4.4 16.8C3.9 15.4 3.7 13.7 3.7 12c0-4.6 3.7-8.3 8.3-8.3s8.3 3.7 8.3 8.3c0 1.7-.2 3.4-.7 4.8"),
      ellipse(5.6, 17.4, 1.8, 3),
      ellipse(18.4, 17.4, 1.8, 3),
      A(path("M9.6 12.4l2 2 3.8-4.4", DO), draw()),
    ],
  },
  "headset-off": {
    auto: false,
    parts: [
      path("M4.4 14.2v-3c0-4.2 3.4-7.6 7.6-7.6s7.6 3.4 7.6 7.6v4.4c0 1.6 0 2.6-.3 3.4-.4.9-1 1.6-1.9 2-.7.3-1.7.3-3.4.3h-2.4"),
      path("M7.4 10.7c-1.7 0-3 1.5-3 3.5s1.3 3.5 3 3.5c.8 0 1.5-.6 1.5-1.5v-4c0-.9-.7-1.5-1.5-1.5z"),
      path("M16.6 10.7c1.7 0 3 1.5 3 3.5s-1.3 3.5-3 3.5c-.8 0-1.5-.6-1.5-1.5v-4c0-.9.7-1.5 1.5-1.5z"),
      A(line(3.4, 3.4, 20.6, 20.6, DO), draw()),
    ],
  },

  /* ---------- help ---------- */

  "help-circle": {
    auto: false,
    parts: [
      circle(12, 12, 9.3),
      G("q", [
        path("M9.9 9.3c.1-1.3 1.1-2.2 2.3-2.1 1.2.1 2 1 2 2.2 0 1.5-1.5 1.7-2 2.7-.2.4-.3.9-.3 1.4"),
        circle(12, 16.6, 1, fill()),
      ]),
    ],
    gAnims: { q: bob(-1.1) },
  },
  "help-square": {
    auto: false,
    parts: [
      rect(2.7, 2.7, 18.6, 18.6, 5.2),
      G("q", [
        path("M9.9 9.3c.1-1.3 1.1-2.2 2.3-2.1 1.2.1 2 1 2 2.2 0 1.5-1.5 1.7-2 2.7-.2.4-.3.9-.3 1.4"),
        circle(12, 16.6, 1, fill()),
      ]),
    ],
    gAnims: { q: bob(-1.1) },
  },

  /* ---------- inbox ---------- */

  inbox: {
    auto: false,
    parts: [
      rect(2.8, 2.8, 18.4, 18.4, 4.4),
      G("scoop", [path("M21.2 13.6h-4.3c-.7 0-1.3.5-1.6 1.2-.4.8-1.2 1.7-3.3 1.7s-2.9-.9-3.3-1.7c-.3-.7-.9-1.2-1.6-1.2H2.8")]),
    ],
    gAnims: { scoop: tn("translate", ["0 0", "0 1.2", "0 0"], [0, 0.45, 1]) },
  },
  "inbox-check": {
    auto: false,
    parts: [
      path(IB_OPEN_RIGHT),
      path(IB_SCOOP_CHECK),
      circle(17.6, 6, 3.5),
      A(path("M15.9 6.1l1.2 1.2 2.1-2.5", DO), draw(0.2, 0.85)),
    ],
  },
  "inbox-download": {
    auto: false,
    parts: [
      path(IB_OPEN_TOP),
      path(IB_SCOOP),
      G("arr", [line(12, 3.1, 12, 10.4), path("M9.3 8c.9 1 2 2.1 2.7 2.6.7-.5 1.8-1.6 2.7-2.6")]),
    ],
    gAnims: { arr: tn("translate", ["0 0", "0 1.5", "0 0"], [0, 0.45, 1]) },
  },
  "inbox-unread": {
    auto: false,
    parts: [
      path(IB_OPEN_RIGHT),
      path(IB_SCOOP_CHECK),
      A(circle(17.6, 6, 3.1, fill()), [
        an("r", ["3.1", "3.1", "3.7", "3.1", "3.1"], [0, 0.3, 0.5, 0.7, 1]),
        an("opacity", ["1", "1", "0.6", "1", "1"], [0, 0.3, 0.5, 0.7, 1]),
      ]),
    ],
  },
  "inbox-upload": {
    auto: false,
    parts: [
      path(IB_OPEN_TOP),
      path(IB_SCOOP),
      G("arr", [line(12, 10.4, 12, 3.4), path("M9.3 5.9c.9-1 2-2.1 2.7-2.6.7.5 1.8 1.6 2.7 2.6")]),
    ],
    gAnims: { arr: bob(-1.5) },
  },

  /* left-turn arrow over a tail that sweeps down-right — hops back once */
  reply: {
    auto: false,
    dur: 1.7,
    parts: [
      G("head", [
        path("M9.4 9.8L4.6 14.4l4.8 4.4"),
      ]),
      path("M4.6 14.4h9.4c3 0 5.4 2.4 5.4 5.4v.6"),
    ],
    gAnims: { head: tn("translate", ["0 0", "0 0", "-1 0", "0 0", "0 0"], [0, 0.3, 0.5, 0.7, 1]) },
  },

  /* twin chevrons, one shared tail — the pair steps back */
  "reply-all": {
    auto: false,
    dur: 1.7,
    parts: [
      G("heads", [
        path("M8.6 9.8L3.8 14.2l4.8 4.4"),
        path("M13.4 9.8l-4.8 4.4 4.8 4.4"),
      ]),
      path("M8.6 14.2h6.2c2.7 0 4.8 2.2 4.8 4.8v.6"),
    ],
    gAnims: { heads: tn("translate", ["0 0", "0 0", "-1 0", "0 0", "0 0"], [0, 0.3, 0.5, 0.7, 1]) },
  },

  /* front square bubble + tail, back bubble peeking top-right */
  "messages-square": {
    auto: false,
    dur: 1.8,
    parts: [
      G("back", [
        path("M9.2 4.4h8.6c1.4 0 2.6 1.2 2.6 2.6v4.8c0 1.4-1.2 2.6-2.6 2.6h-1"),
      ]),
      path("M6.8 9C5.3 9 4.4 10.2 4.4 11.7v6.9c0 .8.9 1.2 1.5.7l2.8-2.1h5.5c1.5 0 2.8-1.3 2.8-2.8v-2.6c0-1.5-1.3-2.8-2.8-2.8H6.8z"),
    ],
    gAnims: { back: tn("translate", ["0 0", "0 0", "0.8 -0.8", "0 0", "0 0"], [0, 0.3, 0.5, 0.7, 1]) },
  },

  /* closed envelope, plus mark at the right edge pops in */
  "mail-plus": {
    auto: false,
    dur: 1.7,
    parts: [
      rect(3, 6.8, 14.4, 12.4, 2),
      path("M3.4 7.6l7.2 5.2c.7.5 1.7.5 2.4 0l4.7-3.5"),
      G("plus", [
        path("M19.8 13.2v5M17.3 15.7h5"),
      ]),
    ],
    sAnims: { plus: popAt(19.8, 15.7, 1.25) },
  },

  /* closed envelope, check strokes on at the right edge */
  "mail-check": {
    auto: false,
    dur: 1.7,
    parts: [
      rect(3, 6.8, 14.4, 12.4, 2),
      path("M3.4 7.6l7.2 5.2c.7.5 1.7.5 2.4 0l4.7-3.5"),
      A(path("M16.4 14.8l1.7 1.8 3.4-3.8", DO), draw(0.2, 0.7)),
    ],
  },

  /* twin reels joined at the tangent — rings pulse in turn */
  voicemail: {
    auto: false,
    dur: 1.8,
    parts: [
      A(circle(6.6, 12.6, 3.9), [
        an("r", ["3.9", "4.4", "3.9", "3.9"], [0, 0.25, 0.5, 1]),
      ]),
      A(circle(17.4, 12.6, 3.9), [
        an("r", ["3.9", "3.9", "4.4", "3.9"], [0, 0.45, 0.65, 0.9]),
      ]),
      path("M6.6 16.5h10.8"),
    ],
  },
};
