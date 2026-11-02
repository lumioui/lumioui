/* time-02 — calendar variants. Canon calendar silhouette carried over from
 * gen.mjs; corner-badge variants use an open silhouette so the mark sits in
 * the gap, inside-mark variants keep the closed body. */

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

/* ---- bespoke gesture idioms ------------------------------------------- */
const HOLD = [0, 0.3, 0.55, 0.8, 1];
const WIG = (cx, cy, a = 9) =>
  tn("rotate", [`0 ${cx} ${cy}`, `0 ${cx} ${cy}`, `-${a} ${cx} ${cy}`, `${a - 2} ${cx} ${cy}`, `0 ${cx} ${cy}`], HOLD);

/* Spoked gear ring at (cx,cy): circle + 6 spokes as one multi-subpath. */
function gear(cx, cy) {
  const pts = (r) => [0, 1, 2, 3, 4, 5].map((i) => {
    const t = (i * Math.PI) / 3;
    return `${(cx + r * Math.cos(t)).toFixed(1)} ${(cy + r * Math.sin(t)).toFixed(1)}`;
  });
  const inner = pts(2.4), outer = pts(3.5);
  return `M${inner.map((p, i) => `${p}L${outer[i]}M`).join("").slice(0, -1)}`;
}

const BODY = "M5.6 5.4h12.8c1.5 0 2.7 1.2 2.7 2.7v9.8c0 1.5-1.2 2.7-2.7 2.7H5.6c-1.5 0-2.7-1.2-2.7-2.7V8.1c0-1.5 1.2-2.7 2.7-2.7z";
/* Open silhouette — bottom-right corner left open for a badge mark. */
const BODY_OPEN = "M11.5 20.9H5.6c-1.5 0-2.7-1.2-2.7-2.7V8.1c0-1.5 1.2-2.7 2.7-2.7h12.8c1.5 0 2.7 1.2 2.7 2.7v4.7";
const cal = (body) => [
  path(body),
  line(2.9, 9.8, 21.1, 9.8),
  line(8.2, 3.6, 8.2, 7.6),
  line(15.8, 3.6, 15.8, 7.6),
];

export const icons = {
  /* the range's endpoint dots light up in turn — start, then end */
  "calendar-range": {
    dur: 1.6,
    auto: false,
    parts: [
      ...cal(BODY),
      A(circle(7, 13.6, 1.1, fill()), [an("r", ["1.1", "1.1", "1.7", "1.1", "1.1"], [0, 0.06, 0.24, 0.44, 1])]),
      line(10.6, 13.6, 16.9, 13.6),
      line(7, 17.5, 13.4, 17.5),
      A(circle(16.8, 17.5, 1.1, fill()), [an("r", ["1.1", "1.1", "1.7", "1.1", "1.1"], [0, 0.32, 0.5, 0.7, 1])]),
    ],
  },

  /* the x-mark shakes — deletion denied */
  "calendar-remove01": {
    dur: 1.4,
    auto: false,
    parts: [
      ...cal(BODY_OPEN),
      G("deny", [line(16.1, 15.8, 20.3, 20), line(20.3, 15.8, 16.1, 20)]),
    ],
    gAnims: { deny: WIG(18.2, 17.9, 10) },
  },

  "calendar-remove02": {
    dur: 1.4,
    auto: false,
    parts: [
      ...cal(BODY),
      G("deny", [line(9.8, 13.7, 14.2, 18.1), line(14.2, 13.7, 9.8, 18.1)]),
    ],
    gAnims: { deny: WIG(12, 15.9, 10) },
  },

  "calendar-search": {
    dur: 1.5,
    parts: [
      ...cal(BODY_OPEN),
      G("tilt", [circle(17.6, 17.4, 2.7), circle(16.6, 16.5, 0.55, fill())]),
      A(line(19.5, 19.4, 21.4, 21.3), [
        an("x2", ["21.4", "22.1", "21.4"]),
        an("y2", ["21.3", "22", "21.3"]),
      ]),
    ],
    gAnims: { tilt: tn("rotate", ["0 17.6 17.4", "-12 17.6 17.4", "0 17.6 17.4"]) },
  },

  "calendar-setting01": {
    parts: [
      ...cal(BODY_OPEN),
      G("gear", [path(gear(18, 18)), circle(18, 18, 1.7)]),
    ],
    gAnims: { gear: tn("rotate", ["0 18 18", "60 18 18"]) },
  },

  "calendar-setting02": {
    parts: [
      ...cal(BODY),
      G("gear", [path(gear(12, 15.9)), circle(12, 15.9, 1.7)]),
    ],
    gAnims: { gear: tn("rotate", ["0 12 15.9", "60 12 15.9"]) },
  },

  "calendar-sync": {
    dur: 1.5,
    parts: [
      ...cal(BODY_OPEN),
      G("swirl", [
        path("M14.5 18a3.5 3.5 0 0 1 5.9-2.6l1 1.1"),
        path("M21.4 14.4v2.1h-2.1"),
        path("M21.5 18a3.5 3.5 0 0 1-5.9 2.6l-1-1.1"),
        path("M14.6 21.5v-2h2.1"),
      ]),
    ],
    gAnims: { swirl: tn("rotate", ["0 18 18", "28 18 18", "0 18 18"]) },
  },

  "calendar-upload01": {
    dur: 1.3,
    parts: [
      ...cal(BODY_OPEN),
      G("lift", [
        path("M15.6 17.6c.5-.7 1.6-2.2 2.3-2.4.7.2 1.8 1.7 2.3 2.4"),
        line(17.9, 15.6, 17.9, 21.2),
      ]),
    ],
    gAnims: { lift: tn("translate", ["0 0", "0 -1.2", "0 0"]) },
  },

  "calendar-upload02": {
    dur: 1.3,
    parts: [
      ...cal(BODY),
      G("lift", [
        path("M9.8 15.6c.5-.7 1.6-2.2 2.2-2.4.6.2 1.7 1.7 2.2 2.4"),
        line(12, 13.6, 12, 18.6),
      ]),
    ],
    gAnims: { lift: tn("translate", ["0 0", "0 -1.2", "0 0"]) },
  },
};
