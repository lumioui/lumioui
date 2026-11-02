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

export const icons = {
  // lowercase i in a ring — straight soft stem + filled tittle accent
  "info": {
    auto: false,
    parts: [
      circle(12, 12, 9),
      G("i", [line(12, 11.3, 12, 16.4), circle(12, 7.6, 1.15, fill())]),
    ],
    gAnims: { i: tn("translate", ["0 0", "0 -1", "0 0"], [0, 0.45, 1]) },
  },
  // serif-flavored i — stem hooks in from the left and tails out right
  "information-circle": {
    auto: false,
    parts: [
      circle(12, 12, 9),
      G("i", [
        path("M10.6 11.2c.6-.4 1.3-.5 1.8-.3v3.4c0 1.2.7 2.1 1.9 2.2"),
        circle(12.3, 7.5, 1.1, fill()),
      ]),
    ],
    gAnims: { i: tn("translate", ["0 0", "0 -1", "0 0"], [0, 0.45, 1]) },
  },
};
