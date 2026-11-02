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

/* Shared soft-file silhouette: rounded body, eased 45° dog-ear, L-bend
 * crease for the fold flap. file-clock keeps the same shape but opens the
 * bottom-left so the clock badge forms the corner. */
const DO = { pathLength: 1, "stroke-dasharray": 1 };
const draw = (a = 0.12, b = 0.7) => [an("stroke-dashoffset", ["1", "1", "0"], [0, a, b])];

export const icons = {
  "file-check": {
    auto: false,
    parts: [
      path("M7.7 3h4.9c.5.1 1 .3 1.4.7l4.3 4.3c.4.5.7 1 .7 1.6v8.7c0 1.5-1.2 2.7-2.7 2.7H7.7c-1.5 0-2.7-1.2-2.7-2.7V5.7c0-1.5 1.2-2.7 2.7-2.7z"),
      path("M13.5 3.2v2.9c0 1.8 1.5 3.2 3.3 3.2h2.2"),
      A(path("M8.4 15l3 3 5-6", DO), draw()),
    ],
  },
  "file-clock": {
    dur: 2.8,
    auto: false,
    pp: false,
    parts: [
      path("M5 11.6V5.7c0-1.5 1.2-2.7 2.7-2.7h4.9c.5.1 1 .3 1.4.7l4.3 4.3c.4.5.7 1 .7 1.6v8.7c0 1.5-1.2 2.7-2.7 2.7h-2.5"),
      path("M13.5 3.2v2.9c0 1.8 1.5 3.2 3.3 3.2h2.2"),
      circle(8.7, 16.8, 4.7),
      G("wind", [path("M8.7 14.6v2.4l1.6 1")]),
    ],
    gAnims: { wind: tn("rotate", ["0 8.7 16.8", "360 8.7 16.8"]) },
  },

  /* doc + padlock — the lock clicks shut */
  "file-lock": {
    auto: false,
    dur: 2.4,
    parts: [
      path("M12 20.6H7.7c-1.5 0-2.7-1.2-2.7-2.7V5.7C5 4.2 6.2 3 7.7 3h4.9c.5.1 1 .3 1.4.7l4.3 4.3c.4.5.7 1 .7 1.6v4.2"),
      path("M13.5 3.2v2.9c0 1.8 1.5 3.2 3.3 3.2h2.2"),
      G("lock", [
        path("M14.4 14.2v-1.6c0-1.2 1-2.2 2.2-2.2s2.2 1 2.2 2.2v1.6"),
        rect(12.8, 14.2, 7.6, 6, 1.4),
      ]),
    ],
    gAnims: { lock: tn("translate", ["0 -0.6", "0 0", "0 0"], [0, 0.35, 1]) },
  },

  /* doc + magnifier — the lens sweeps the page */
  "file-search": {
    auto: false,
    dur: 2.6,
    parts: [
      path("M12 20.6H7.7c-1.5 0-2.7-1.2-2.7-2.7V5.7C5 4.2 6.2 3 7.7 3h4.9c.5.1 1 .3 1.4.7l4.3 4.3c.4.5.7 1 .7 1.6v5.6"),
      path("M13.5 3.2v2.9c0 1.8 1.5 3.2 3.3 3.2h2.2"),
      G("lens", [
        circle(11.6, 14.6, 3.4),
        line(14, 17, 16.2, 19.2),
      ]),
    ],
    gAnims: { lens: tn("translate", ["0 0", "1.5 -1.5", "0 0", "-0.8 0.8", "0 0"], [0, 0.3, 0.55, 0.8, 1]) },
  },

  /* doc + warning triangle — the triangle traces on */
  "file-warning": {
    auto: false,
    parts: [
      path("M7.7 3h4.9c.5.1 1 .3 1.4.7l4.3 4.3c.4.5.7 1 .7 1.6v8.7c0 1.5-1.2 2.7-2.7 2.7H7.7c-1.5 0-2.7-1.2-2.7-2.7V5.7c0-1.5 1.2-2.7 2.7-2.7z"),
      path("M13.5 3.2v2.9c0 1.8 1.5 3.2 3.3 3.2h2.2"),
      A(path("M12 9.6l4.3 7.4H7.7z", DO), draw()),
      line(12, 12.4, 12, 14.4),
      circle(12, 15.9, 0.5, fill()),
    ],
  },

  /* doc + skeleton key — the key turns a few degrees */
  "file-key": {
    auto: false,
    dur: 2.2,
    parts: [
      path("M7.7 3h4.9c.5.1 1 .3 1.4.7l4.3 4.3c.4.5.7 1 .7 1.6v8.7c0 1.5-1.2 2.7-2.7 2.7H7.7c-1.5 0-2.7-1.2-2.7-2.7V5.7c0-1.5 1.2-2.7 2.7-2.7z"),
      path("M13.5 3.2v2.9c0 1.8 1.5 3.2 3.3 3.2h2.2"),
      G("key", [
        circle(9.9, 12.6, 2.1),
        path("M11.5 14.1l4.5 4.5M14.2 17l1.4-1.4M16.4 19.2l1.4-1.4"),
      ]),
    ],
    gAnims: { key: tn("rotate", ["0 9.9 12.6", "-12 9.9 12.6", "0 9.9 12.6"], [0, 0.4, 1]) },
  },

  /* doc + star — the star traces on */
  "file-star": {
    auto: false,
    parts: [
      path("M7.7 3h4.9c.5.1 1 .3 1.4.7l4.3 4.3c.4.5.7 1 .7 1.6v8.7c0 1.5-1.2 2.7-2.7 2.7H7.7c-1.5 0-2.7-1.2-2.7-2.7V5.7c0-1.5 1.2-2.7 2.7-2.7z"),
      path("M13.5 3.2v2.9c0 1.8 1.5 3.2 3.3 3.2h2.2"),
      A(path("M12 9.8l1.4 2.9 3.2.4-2.3 2.2.5 3.2-2.8-1.5-2.8 1.5.5-3.2-2.3-2.2 3.2-.4z", DO), draw(0.15, 0.75)),
    ],
  },

  /* doc + plus/minus diff rows */
  "file-diff": {
    auto: false,
    parts: [
      path("M7.7 3h4.9c.5.1 1 .3 1.4.7l4.3 4.3c.4.5.7 1 .7 1.6v8.7c0 1.5-1.2 2.7-2.7 2.7H7.7c-1.5 0-2.7-1.2-2.7-2.7V5.7c0-1.5 1.2-2.7 2.7-2.7z"),
      path("M13.5 3.2v2.9c0 1.8 1.5 3.2 3.3 3.2h2.2"),
      A(path("M8.4 10h2.2M9.5 8.9v2.2", DO), draw(0.1, 0.4)),
      path("M8.4 15.4h2.2"),
      line(13.6, 10, 17.4, 10),
      line(13.6, 15.4, 17.4, 15.4),
    ],
  },

  /* doc + question mark that inks itself */
  "file-question": {
    auto: false,
    dur: 2,
    parts: [
      path("M7.7 3h4.9c.5.1 1 .3 1.4.7l4.3 4.3c.4.5.7 1 .7 1.6v8.7c0 1.5-1.2 2.7-2.7 2.7H7.7c-1.5 0-2.7-1.2-2.7-2.7V5.7c0-1.5 1.2-2.7 2.7-2.7z"),
      path("M13.5 3.2v2.9c0 1.8 1.5 3.2 3.3 3.2h2.2"),
      A(path("M10.2 10.4c.2-1.1 1-1.9 2-1.9 1.2 0 2.1.9 2.1 2 0 1.3-1.3 1.7-2 2.4-.3.3-.3.5-.3.9", DO), draw()),
      circle(12, 16.4, 0.55, fill()),
    ],
  },
};
