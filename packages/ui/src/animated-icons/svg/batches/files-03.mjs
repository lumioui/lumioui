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

/* Shared soft silhouettes — every icon in the batch draws from these so the
 * family stays coherent: one plump cylinder, one folded-corner document, one
 * plain document, one trash can, one rounded square. */

const CYL_TOP = ellipse(12, 5.3, 8.1, 3);
const CYL_LEFT = path("M3.9 5.4v12.9c0 1.7 3.6 3.1 8.1 3.1");
const CYL_RIGHT = path("M20.1 5.4v5.6");
const CYL_BAND = path("M3.9 12c0 1.7 3.6 3 8.1 3");

const DOC_FOLD =
  "M8.2 3.2h4c.6 0 1.2.3 1.7.8l3.3 3.3c.5.5.8 1.1.8 1.7v9.9c0 1.6-1.3 2.9-2.9 2.9H8.2c-1.6 0-2.9-1.3-2.9-2.9V6.1c0-1.6 1.3-2.9 2.9-2.9z";
const DOC_CREASE = "M13.6 3.4v2.5c0 1 .8 1.8 1.8 1.8h2.1";
const DOC_PLAIN =
  "M8.2 3.2h6.9c1.6 0 2.9 1.3 2.9 2.9v11.8c0 1.6-1.3 2.9-2.9 2.9H8.2c-1.6 0-2.9-1.3-2.9-2.9V6.1c0-1.6 1.3-2.9 2.9-2.9z";

const CAN_LID = "M4.2 7.6h15.6";
const CAN_HANDLE = "M9.9 7.6V6.5c0-.9.7-1.6 1.6-1.6h1c.9 0 1.6.7 1.6 1.6v1.1";
const CAN_BODY =
  "M5.9 7.6l.9 10.3c.1 1.4 1.3 2.5 2.7 2.5h5c1.4 0 2.6-1.1 2.7-2.5l.9-10.3";

const SQ = rect(3.3, 3.3, 17.4, 17.4, 2.7);

/* gesture recipes — one signature verb per icon; pose(t=0) = pose(t=1).
 * draw: stroke traces on; lid: trash-can lid flips around its left hinge. */
const DO = { pathLength: 1, "stroke-dasharray": 1 };
const draw = (a = 0.12, b = 0.7) => [an("stroke-dashoffset", ["1", "1", "0"], [0, a, b])];
const lidFlip = (deg = -14) => tn("rotate", [`0 4.5 7.6`, `${deg} 4.5 7.6`, `0 4.5 7.6`], [0, 0.4, 1]);

/** Scalloped bloom for small gears — same cosine-lobe recipe as core settings. */
const flower = (cx, cy, lobes, rMid, amp, steps = 10) => {
  const pts = [];
  for (let i = 0; i < lobes * steps; i++) {
    const t = (i / (lobes * steps)) * Math.PI * 2;
    const r = rMid + amp * Math.cos(lobes * t + Math.PI / 2);
    pts.push(`${(cx + r * Math.cos(t)).toFixed(2)} ${(cy + r * Math.sin(t)).toFixed(2)}`);
  }
  return `M${pts.join("L")}Z`;
};

/** Small cog (STYLE.md accents): ring + 6 short spokes. A scalloped bloom
 *  under ~10px fuses into a blob; spokes stay readable down to 16px. */
const cog = (cx, cy, s = 1) => {
  const r = (v) => +v.toFixed(2);
  let d = "";
  for (let i = 0; i < 6; i++) {
    const t = (i / 6 + 1 / 12) * Math.PI * 2;
    d += `M${r(cx + 3.3 * s * Math.cos(t))} ${r(cy + 3.3 * s * Math.sin(t))}L${r(cx + 3.9 * s * Math.cos(t))} ${r(cy + 3.9 * s * Math.sin(t))}`;
  }
  return [circle(cx, cy, r(2.3 * s)), path(d)];
};

export const icons = {
  /* ---------- databases: cylinder + corner badge ---------- */

  "database-restore": {
    auto: false,
    pp: false,
    dur: 1.8,
    parts: [
      CYL_TOP,
      CYL_LEFT,
      CYL_RIGHT,
      CYL_BAND,
      G("rewind", [
        path("M13.5 17.4a3.7 3.7 0 1 0 3.7-3.7c-1 0-2 .4-2.7 1.1l-1.2 1"),
        path("M13.3 12.4v3.4h3.4"),
      ]),
    ],
    gAnims: { rewind: tn("rotate", ["0 17.2 17.4", "-360 17.2 17.4"]) },
  },

  "database-search": {
    auto: false,
    parts: [
      CYL_TOP,
      CYL_LEFT,
      CYL_RIGHT,
      CYL_BAND,
      G("glass", [
        circle(17.2, 17, 3.4),
        line(19.6, 19.4, 21.4, 21.2),
        circle(15.8, 15.7, 0.9, fill()),
      ]),
    ],
    gAnims: { glass: tn("rotate", ["0 17.2 17", "-9 17.2 17", "0 17.2 17"], [0, 0.45, 1]) },
  },

  "database-setting": {
    auto: false,
    parts: [
      CYL_TOP,
      CYL_LEFT,
      CYL_RIGHT,
      CYL_BAND,
      G("turn", cog(17.8, 17.8, 0.85)),
    ],
    gAnims: { turn: tn("rotate", ["0 17.8 17.8", "120 17.8 17.8"]) },
  },

  "database-sync": {
    auto: false,
    pp: false,
    dur: 1.8,
    parts: [
      path("M5.8 3.4h8.4c1.6 0 2.9 1.3 2.9 2.9v8.4c0 1.6-1.3 2.9-2.9 2.9H5.8c-1.6 0-2.9-1.3-2.9-2.9V6.3c0-1.6 1.3-2.9 2.9-2.9z"),
      path("M3.2 10.5h13.7"),
      circle(5.9, 6.9, 0.9, fill()),
      line(8.5, 6.9, 13.3, 6.9),
      circle(5.9, 14, 0.9, fill()),
      G("spin", [
        path("M14.6 15.5a3.4 3.4 0 0 1 5.7-.3l1.1 1.1"),
        path("M21.9 14.2v2.5h-2.5"),
        path("M20.2 19.7a3.4 3.4 0 0 1-5.7.3l-1.1-1.1"),
        path("M12.9 21.1v-2.5h2.5"),
      ]),
    ],
    gAnims: { spin: tn("rotate", ["0 17.4 17.7", "360 17.4 17.7"]) },
  },

  "database-sync01": {
    auto: false,
    pp: false,
    dur: 1.8,
    parts: [
      CYL_TOP,
      CYL_LEFT,
      CYL_RIGHT,
      CYL_BAND,
      G("spin", [
        path("M14.5 15.6a3.4 3.4 0 0 1 5.7-.3l1.1 1.1"),
        path("M21.8 14.2v2.5h-2.5"),
        path("M20.1 19.7a3.4 3.4 0 0 1-5.7.3l-1.1-1.1"),
        path("M12.8 21.1v-2.5h2.5"),
      ]),
    ],
    gAnims: { spin: tn("rotate", ["0 17.3 17.7", "360 17.3 17.7"]) },
  },

  "database-zap": {
    auto: false,
    parts: [
      CYL_TOP,
      CYL_LEFT,
      path("M20.1 5.4v4.2"),
      CYL_BAND,
      /* a stroked bolt outline this small fills in; an open zigzag stays crisp */
      A(path("M19.6 13.2L16.8 17.4H20.2L17.4 21.4"), [
        an("opacity", ["1", "0.15", "1", "0.45", "1"], [0, 0.12, 0.3, 0.5, 1]),
      ]),
    ],
  },

  /* ---------- deletes ---------- */

  "delete-column": {
    auto: false,
    parts: [
      SQ,
      path("M10.6 3.6v16.8"),
      path("M3.6 9h7"),
      path("M3.6 15h7"),
      A(path("M13.6 10.7l3 3M16.6 10.7l-3 3", DO), draw()),
    ],
  },

  "delete-put-back": {
    auto: false,
    parts: [
      G("lid", [path(CAN_LID), path(CAN_HANDLE)]),
      path(CAN_BODY),
      G("arr", [
        path("M16.2 10v4.6c0 2-1.6 3.6-3.6 3.6H9.4"),
        path("M11.9 15.9l-2.6 2.2 2.6 2.2"),
      ]),
    ],
    gAnims: {
      lid: lidFlip(-12),
      arr: tn("translate", ["0 0", "-1.4 0", "0 0"], [0, 0.5, 1]),
    },
  },

  "delete-row": {
    auto: false,
    parts: [
      SQ,
      path("M3.6 10.6h16.8"),
      path("M9 3.6v7"),
      path("M15 3.6v7"),
      A(path("M10.9 14.4l2.8 2.8M13.7 14.4l-2.8 2.8", DO), draw()),
    ],
  },

  "delete-throw": {
    auto: false,
    parts: [
      G("lid", [path(CAN_LID), path(CAN_HANDLE)]),
      path(CAN_BODY),
      G("arr", [path("M12 17.9v-6.2"), path("M9.8 13.8l2.2-2.4 2.2 2.4")]),
    ],
    gAnims: {
      lid: lidFlip(-12),
      arr: tn("translate", ["0 0", "0 -2", "0 0"], [0, 0.45, 1]),
    },
  },

  delete01: {
    auto: false,
    parts: [G("lid", [path(CAN_LID), path(CAN_HANDLE)]), path(CAN_BODY)],
    gAnims: { lid: lidFlip() },
  },

  delete02: {
    auto: false,
    parts: [
      G("lid", [path(CAN_LID), path(CAN_HANDLE)]),
      path(CAN_BODY),
      line(10, 11.4, 10, 16.2),
      line(14, 11.4, 14, 16.2),
    ],
    gAnims: { lid: lidFlip() },
  },

  delete03: {
    auto: false,
    parts: [
      G("lid", [path(CAN_LID), path(CAN_HANDLE)]),
      path(CAN_BODY),
      line(9.4, 12, 14.6, 12),
      line(10.4, 15.8, 13.6, 15.8),
    ],
    gAnims: { lid: lidFlip() },
  },

  delete04: {
    auto: false,
    parts: [
      G("lid", [path(CAN_LID), path(CAN_HANDLE)]),
      path("M5.9 7.6l.9 10.3c.1 1.4 1.3 2.5 2.7 2.5h3.1"),
      path("M18.1 7.6l-.5 5.8"),
      A(path("M15.4 15.5l4.2 4.2M19.6 15.5l-4.2 4.2", DO), draw()),
    ],
    gAnims: { lid: lidFlip(-10) },
  },

  /* ---------- documents: plain soft doc ---------- */

  "document-attachment": {
    auto: false,
    parts: [
      path(DOC_PLAIN),
      path("M8.1 8.1h5.8"),
      path("M8.1 11.6h3.8"),
      G("clip", [path("M19.9 13.4c.6.6.6 1.5 0 2.1l-3.1 3.1c-1 .9-2.5.9-3.4-.1-.9-1-.9-2.5.1-3.4l3.1-3.1c.5-.5 1.4-.5 1.9 0 .5.5.5 1.4 0 1.9l-3.1 3.1")]),
    ],
    gAnims: { clip: tn("rotate", ["0 17 16", "7 17 16", "-7 17 16", "0 17 16"], [0, 0.3, 0.6, 1]) },
  },

  "document-code": {
    auto: false,
    parts: [
      path(DOC_PLAIN),
      path("M8.1 8.1h5.8"),
      G("brackets", [path("M11.2 15.5l-1.9 1.9 1.9 1.9M15 15.5l1.9 1.9-1.9 1.9")]),
    ],
    gAnims: { brackets: tn("translate", ["0 0", "0 0", "0.8 0", "0 0", "0 0"], [0, 0.2, 0.5, 0.8, 1]) },
  },

    "document-validation": { auto: false,
    parts: [
    path("M7.14 3.19L14.04 3.19C15.64 3.19 16.94 4.49 16.94 6.09L16.94 17.89C16.94 19.49 15.64 20.79 14.04 20.79L7.14 20.79C5.54 20.79 4.24 19.49 4.24 17.89L4.24 6.09C4.24 4.49 5.54 3.19 7.14 3.19Z"),
    circle(16.24, 7.09, 3.5),
    A(path("M14.54 7.19L15.74 8.39L17.94 5.89", { pathLength: 1, "stroke-dasharray": 1 }), [an("stroke-dashoffset", ["1", "1", "0"], [0, 0.2, 0.85])]),
    path("M6.84 13.39L11.24 13.39"),
    path("M6.84 16.89L14.44 16.89"),
  ] },

  /* ---------- downloads ---------- */

  "download-circle01": {
    auto: false,
    parts: [
      circle(12, 12, 8.4),
      G("arr", [line(12, 7.4, 12, 15.6), path("M8.5 12.5l3.5 3.5 3.5-3.5")]),
    ],
    gAnims: { arr: tn("translate", ["0 0", "0 1.7", "0 0"], [0, 0.45, 1]) },
  },

  "download-circle02": {
    auto: false,
    parts: [
      circle(12, 12, 8.4),
      G("arr", [line(12, 7.6, 12, 13.4), path("M9.4 10.8c1 1.3 2 2.6 2.6 2.6s1.6-1.3 2.6-2.6")]),
      line(8.8, 17, 15.2, 17),
    ],
    gAnims: { arr: tn("translate", ["0 0", "0 1.7", "0 0"], [0, 0.45, 1]) },
  },

  "download-square01": {
    auto: false,
    parts: [
      SQ,
      G("arr", [line(12, 7.4, 12, 15.6), path("M8.5 12.5l3.5 3.5 3.5-3.5")]),
    ],
    gAnims: { arr: tn("translate", ["0 0", "0 1.7", "0 0"], [0, 0.45, 1]) },
  },

  "download-square02": {
    auto: false,
    parts: [
      SQ,
      G("arr", [line(12, 7.6, 12, 13.4), path("M9.4 10.8c1 1.3 2 2.6 2.6 2.6s1.6-1.3 2.6-2.6")]),
      line(8.8, 17, 15.2, 17),
    ],
    gAnims: { arr: tn("translate", ["0 0", "0 1.7", "0 0"], [0, 0.45, 1]) },
  },

  download01: {
    auto: false,
    parts: [
      G("arrow", [line(12, 4.5, 12, 14.2), path("M7.7 10.2l4.3 4.3 4.3-4.3")]),
      path("M4.3 15.4v1.9c0 1.6 1.3 2.9 2.9 2.9h9.6c1.6 0 2.9-1.3 2.9-2.9v-1.9"),
    ],
    gAnims: { arrow: tn("translate", ["0 0", "0 2.3", "0 0"], [0, 0.5, 1]) },
  },

  download02: {
    auto: false,
    parts: [
      path("M17.4 9c1.9 0 3.3 1.4 3.3 3.3v3.4c0 1.9-1.4 3.3-3.3 3.3H6.6c-1.9 0-3.3-1.4-3.3-3.3v-3.4C3.3 10.4 4.7 9 6.6 9"),
      G("arr", [line(12, 3.4, 12, 13.6), path("M8.4 10.6c1.5 1.9 2.8 3.4 3.6 3.4s2.1-1.5 3.6-3.4")]),
    ],
    gAnims: { arr: tn("translate", ["0 0", "0 1.8", "0 0"], [0, 0.45, 1]) },
  },

  download03: {
    auto: false,
    parts: [
      path("M6.4 9.6V6.7c0-1.3 1-2.3 2.3-2.3h6.6c1.3 0 2.3 1 2.3 2.3v2.9"),
      path("M5.4 9.6h13.2c1.3 0 2.3 1 2.3 2.3v6.6c0 1.3-1 2.3-2.3 2.3H5.4c-1.3 0-2.3-1-2.3-2.3v-6.6c0-1.3 1-2.3 2.3-2.3z"),
      G("arr", [line(12, 12, 12, 16.6), path("M9.9 14.7l2.1 2.1 2.1-2.1")]),
    ],
    gAnims: { arr: tn("translate", ["0 0", "0 1.6", "0 0"], [0, 0.45, 1]) },
  },

  download04: {
    auto: false,
    parts: [
      G("arr", [path("M10.4 3h3.2c.5 0 .9.4.9.9v7h2.3c.7 0 1.1.9.6 1.4l-4.8 5c-.3.3-.9.3-1.2 0l-4.8-5c-.5-.5-.1-1.4.6-1.4h2.3v-7c0-.5.4-.9.9-.9z")]),
      line(5.5, 20.4, 18.5, 20.4),
    ],
    gAnims: { arr: tn("translate", ["0 0", "0 1.9", "0 0"], [0, 0.45, 1]) },
  },

  download05: {
    auto: false,
    parts: [
      path("M5.6 6.9h12.8c1.2 0 2.2 1 2.2 2.2v9.6c0 1.2-1 2.2-2.2 2.2H5.6c-1.2 0-2.2-1-2.2-2.2V9.1c0-1.2 1-2.2 2.2-2.2z"),
      path("M4.9 6.9l1.3-2.1c.5-.8 1.3-1.2 2.2-1.2h7.2c.9 0 1.7.4 2.2 1.2l1.3 2.1"),
      G("arr", [line(12, 10.1, 12, 15.7), path("M9.9 13.8l2.1 2.2 2.1-2.2")]),
    ],
    gAnims: { arr: tn("translate", ["0 0", "0 1.6", "0 0"], [0, 0.45, 1]) },
  },

  download06: {
    auto: false,
    parts: [
      path("M16.9 9.4c1.7 0 3 1.3 3 3v4.5c0 1.7-1.3 3-3 3H7.1c-1.7 0-3-1.3-3-3v-4.5c0-1.7 1.3-3 3-3"),
      G("arr", [line(12, 3.2, 12, 14), path("M8.6 11.5c1.4 1.8 2.7 3.2 3.4 3.2s2-1.4 3.4-3.2")]),
    ],
    gAnims: { arr: tn("translate", ["0 0", "0 1.8", "0 0"], [0, 0.45, 1]) },
  },

  /* ---------- files: folded-corner doc ---------- */

  "file-add": {
    auto: false,
    parts: [
      path(DOC_FOLD),
      path(DOC_CREASE),
      G("plus", [path("M7.6 6.9h3.6M9.4 5.1v3.6")]),
    ],
    gAnims: { plus: tn("rotate", ["0 9.4 6.9", "90 9.4 6.9"]) },
  },

  "file-archive": {
    auto: false,
    parts: [
      path(DOC_FOLD),
      path(DOC_CREASE),
      A(path("M9.6 8.6v1.4M9.6 11.4v1.4M9.6 14.2v1.4", DO), draw(0.1, 0.55)),
      A(circle(9.6, 17.8, 1.4), [an("opacity", ["0", "0", "1", "1"], [0, 0.45, 0.6, 1])]),
    ],
  },

  "file-attachment": {
    auto: false,
    parts: [
      path(DOC_FOLD),
      path(DOC_CREASE),
      G("clip", [path("M11.7 13.1c.6.6.6 1.5 0 2.1l-2.6 2.6c-1 .9-2.4.9-3.3-.1-.9-1-.9-2.4.1-3.3l2.6-2.6c.5-.5 1.4-.5 1.9 0 .5.5.5 1.4 0 1.9l-2.6 2.6")]),
    ],
    gAnims: { clip: tn("rotate", ["0 9 16", "7 9 16", "-7 9 16", "0 9 16"], [0, 0.3, 0.6, 1]) },
  },

  "file-audio": {
    auto: false,
    parts: [
      path(DOC_FOLD),
      path(DOC_CREASE),
      G("note", [
        circle(10.4, 17.2, 1.5, fill()),
        line(11.9, 17.2, 11.9, 11.2),
        path("M11.9 11.2c1.3.2 2.5.9 3.1 2"),
      ]),
    ],
    gAnims: { note: tn("translate", ["0 0", "0 -1", "0 0"], [0, 0.45, 1]) },
  },

  "file-axis-three-d": {
    auto: false,
    parts: [
      path(DOC_FOLD),
      path(DOC_CREASE),
      G("axes", [path("M8.9 17.4v-4.1M8.9 17.4l3.9 1.1M8.9 17.4l-2.6 2.5")]),
    ],
    gAnims: { axes: tn("rotate", ["0 8.9 17.4", "5 8.9 17.4", "-5 8.9 17.4", "0 8.9 17.4"], [0, 0.3, 0.6, 1]) },
  },

  "file-badge": {
    auto: false,
    parts: [
      path(DOC_FOLD),
      path(DOC_CREASE),
      G("medal", [circle(9.7, 14.4, 2.1), path("M8.5 16.1l-.8 3.1 2-1.2 2 1.2-.8-3.1")]),
    ],
    gAnims: { medal: tn("rotate", ["0 9.7 14.4", "8 9.7 14.4", "-8 9.7 14.4", "0 9.7 14.4"], [0, 0.3, 0.6, 1]) },
  },

  "file-bitcoin": {
    auto: false,
    parts: [
      path(DOC_FOLD),
      path(DOC_CREASE),
      G("coin", [
        path("M9.9 13.2v6.6M9.9 13.2h2.2c1 0 1.9.8 1.9 1.8s-.9 1.8-1.9 1.8H9.9M9.9 16.8h2.6c1 0 1.9.8 1.9 1.8s-.9 1.8-1.9 1.8H9.9"),
        path("M11.2 12v1.2M11.2 19.8v1.2"),
      ]),
    ],
    sAnims: { coin: { pivot: [11.5, 16.5], anim: tn("scale", ["1", "1", "1.15", "1", "1"], [0, 0.3, 0.5, 0.7, 1]) } },
  },

  "file-block": {
    auto: false,
    parts: [
      path(DOC_FOLD),
      path(DOC_CREASE),
      circle(9.7, 16, 3.1),
      A(path("M7.6 13.9l4.2 4.2", DO), draw()),
    ],
  },

  "file-bookmark": {
    auto: false,
    parts: [
      path(DOC_FOLD),
      path(DOC_CREASE),
      G("mark", [path("M8.5 4.4c0-.3.3-.6.7-.6h1.9c.4 0 .7.3.7.6v4.4c0 .4-.5.7-.8.4l-1-.7c-.1-.1-.3-.1-.4 0l-1 .7c-.3.3-.8 0-.8-.4V4.4z")]),
    ],
    gAnims: { mark: tn("translate", ["0 0", "0 1.2", "0 0"], [0, 0.45, 1]) },
  },

  "file-box": {
    auto: false,
    parts: [
      path(DOC_FOLD),
      path(DOC_CREASE),
      G("cube", [
        path("M9.7 13.1l3 1.7v3.4l-3 1.7-3-1.7v-3.4z"),
        path("M6.7 14.8l3 1.7 3-1.7M9.7 16.5v3.4"),
      ]),
    ],
    gAnims: { cube: tn("rotate", ["0 9.7 16.5", "-6 9.7 16.5", "6 9.7 16.5", "0 9.7 16.5"], [0, 0.3, 0.6, 1]) },
  },

  "file-braces": {
    auto: false,
    parts: [
      path(DOC_FOLD),
      path(DOC_CREASE),
      G("braces", [path("M10.6 12.8c-.7 0-1.1.4-1.1 1v1.2c0 .8-.7 1.4-1.4 1.4.7 0 1.4.6 1.4 1.4v1.2c0 .6.4 1 1.1 1M13.4 12.8c.7 0 1.1.4 1.1 1v1.2c0 .8.7 1.4 1.4 1.4-.7 0-1.4.6-1.4 1.4v1.2c0 .6-.4 1-1.1 1")]),
    ],
    gAnims: { braces: tn("rotate", ["0 12 16", "-4 12 16", "4 12 16", "0 12 16"], [0, 0.3, 0.6, 1]) },
  },

  "file-braces-corner": {
    auto: false,
    parts: [
      path(DOC_FOLD),
      path(DOC_CREASE),
      G("bl", [path("M8.2 18.3v-2.2c0-.6.5-1.1 1.1-1.1h2.2")]),
      G("tr", [path("M15.8 12.7v2.2c0 .6-.5 1.1-1.1 1.1h-2.2")]),
    ],
    gAnims: {
      bl: tn("translate", ["0 0", "0.8 -0.8", "0 0"], [0, 0.5, 1]),
      tr: tn("translate", ["0 0", "-0.8 0.8", "0 0"], [0, 0.5, 1]),
    },
  },

  "file-chart-column": {
    auto: false,
    parts: [
      path(DOC_FOLD),
      path(DOC_CREASE),
      G("b1", [path("M8.3 17.7v-2.2")]),
      G("b2", [path("M11.3 17.7v-4.6")]),
      G("b3", [path("M14.3 17.7v-3.2")]),
    ],
    sAnims: {
      b1: { pivot: [8.3, 17.7], anim: tn("scale", ["1 1", "1 0.45", "1 1"], [0, 0.25, 0.55]) },
      b2: { pivot: [11.3, 17.7], anim: tn("scale", ["1 1", "1 0.45", "1 1"], [0.15, 0.4, 0.7]) },
      b3: { pivot: [14.3, 17.7], anim: tn("scale", ["1 1", "1 0.45", "1 1"], [0.3, 0.55, 0.85]) },
    },
  },

  "file-chart-column-increasing": {
    auto: false,
    parts: [
      path(DOC_FOLD),
      path(DOC_CREASE),
      G("b1", [path("M8.3 17.7v-1.6")]),
      G("b2", [path("M11.3 17.7v-3.4")]),
      G("b3", [path("M14.3 17.7v-5.2")]),
    ],
    sAnims: {
      b1: { pivot: [8.3, 17.7], anim: tn("scale", ["1 0.55", "1 1", "1 0.55"], [0, 0.3, 0.65]) },
      b2: { pivot: [11.3, 17.7], anim: tn("scale", ["1 0.55", "1 0.55", "1 1", "1 0.55"], [0, 0.12, 0.45, 0.8]) },
      b3: { pivot: [14.3, 17.7], anim: tn("scale", ["1 0.55", "1 0.55", "1 1", "1 0.55"], [0, 0.24, 0.6, 0.95]) },
    },
  },

  "file-chart-line": {
    auto: false,
    parts: [
      path(DOC_FOLD),
      path(DOC_CREASE),
      A(path("M7.9 16.9l2.3-2.3 1.7 1.7 3.5-3.5", DO), draw()),
    ],
  },

  "file-chart-pie": {
    auto: false,
    pp: false,
    dur: 1.8,
    parts: [
      path(DOC_FOLD),
      path(DOC_CREASE),
      circle(9.8, 15.9, 2.9),
      G("slice", [path("M12.6 17.1l-2.8-1.2v-2.9")]),
    ],
    gAnims: { slice: tn("rotate", ["0 9.8 15.9", "360 9.8 15.9"]) },
  },

  "file-check-corner": {
    auto: false,
    parts: [
      path(DOC_FOLD),
      path(DOC_CREASE),
      A(path("M11.3 17.8l1.6 1.5 3.2-3.7", DO), draw()),
    ],
  },

  file01: {
    auto: false,
    parts: [
      path("M7.2 3.2h9.6c1.5 0 2.7 1.2 2.7 2.7v7.4c0 .6-.2 1.1-.6 1.5l-4.2 4.2c-.4.4-1 .6-1.5.6H7.2c-1.5 0-2.7-1.2-2.7-2.7V5.9c0-1.5 1.2-2.7 2.7-2.7z"),
      path("M13.9 19.5v-2.9c0-1 .8-1.8 1.8-1.8h2.9"),
      A(path("M8.2 7.8h7.6", DO), draw(0.08, 0.5)),
      A(path("M8.2 11.4h4.6", DO), draw(0.3, 0.75)),
    ],
  },

  file02: {
    auto: false,
    parts: [
      path(DOC_FOLD),
      path(DOC_CREASE),
      A(path("M8.2 13.6h4.4", DO), draw(0.08, 0.5)),
      A(path("M8.2 16.9h7.4", DO), draw(0.3, 0.75)),
    ],
  },

};
