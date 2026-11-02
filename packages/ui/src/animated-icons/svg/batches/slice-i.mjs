/* slice-i: the last canonical gaps (map / layers / shopping-bag / log-in / dot) */
const path = (d, a = {}) => ({ e: "path", a: { d, ...a } });
const circle = (cx, cy, r, a = {}) => ({ e: "circle", a: { cx, cy, r, ...a } });
const line = (x1, y1, x2, y2, a = {}) => ({ e: "line", a: { x1, y1, x2, y2, ...a } });
const fill = (color = "currentColor") => ({ fill: color, stroke: "none" });
const an = (attr, values, times) => ({ kind: "attr", attr, values, times });
const tn = (type, values, times, extra = {}) => ({ kind: "transform", type, values, times, ...extra });
const A = (part, anims) => ({ ...part, anims });
const G = (id, children, a = {}) => ({ e: "g", g: id, a, children });

const HOLD = [0, 0.3, 0.55, 0.8, 1];
const DIP = (dx, dy) => tn("translate", ["0 0", "0 0", `${dx} ${dy}`, "0 0", "0 0"], HOLD);
const SWAY = (cx, cy, a = 4) =>
  tn("rotate", [`0 ${cx} ${cy}`, `0 ${cx} ${cy}`, `-${a} ${cx} ${cy}`, `${a} ${cx} ${cy}`, `0 ${cx} ${cy}`], HOLD);

export const icons = {
  /* doorway C mirrored (opening left) + arrow entering from the left */
  "log-in": {
    auto: false,
    dur: 1.5,
    parts: [
      path("M9.4 3.4L16.4 3.4C18.3 3.4 19.7 4.8 19.7 6.7L19.7 17.3C19.7 19.2 18.3 20.6 16.4 20.6L9.4 20.6"),
      G("in", [line(3.2, 12, 14.1, 12), path("M9.4 7.4L14.2 12L9.4 16.6")]),
    ],
    gAnims: { in: DIP(1.8, 0) },
  },

  /* stacked soft diamonds — top plate + two under-edges, settle-bounce */
  layers: {
    auto: false,
    dur: 1.6,
    parts: [
      /* sheets on an even ~3.8 beat so the stack never fuses */
      path("M11.2 3.4L4 7.4c-.7.4-.7 1.4 0 1.8l7.2 4c.5.3 1.1.3 1.6 0l7.2-4c.7-.4.7-1.4 0-1.8l-7.2-4c-.5-.3-1.1-.3-1.6 0Z"),
      G("under", [
        path("M3.6 12.4l7.6 4.4c.5.3 1.1.3 1.6 0l7.6-4.4"),
        path("M3.6 16.2l7.6 4.4c.5.3 1.1.3 1.6 0l7.6-4.4"),
      ]),
    ],
    gAnims: { under: DIP(0, 1.1) },
  },

  /* soft bag + U handle; the bag sways like it's just been set down */
  "shopping-bag": {
    auto: false,
    dur: 1.7,
    parts: [
      G("bag", [
        path("M4.8 8.8L19.2 8.8C19.8 8.8 20.3 9.3 20.2 9.9L19.4 18.4C19.2 20 17.9 21.1 16.4 21.1L7.6 21.1C6.1 21.1 4.8 20 4.6 18.4L3.8 9.9C3.7 9.3 4.2 8.8 4.8 8.8Z"),
      ]),
      path("M8.6 11.4L8.6 7.6C8.6 5.7 10.1 4.2 12 4.2C13.9 4.2 15.4 5.7 15.4 7.6L15.4 11.4"),
    ],
    gAnims: { bag: SWAY(12, 21, 3) },
  },

  /* folded map — zigzag outline + two fold creases */
  map: {
    auto: true,
    dur: 1.7,
    parts: [
      path("M9.3 4.7L4.1 6.5C3.5 6.7 3.1 7.1 3.1 7.7L3.1 19.2C3.1 19.9 3.7 20.3 4.3 20.2L9.5 18.4L14.9 20.4C15.1 20.5 15.4 20.5 15.7 20.4L20 18.7C20.6 18.5 20.9 18.1 20.9 17.5L20.9 5.6C20.9 4.9 20.3 4.5 19.7 4.6L15.5 6.2L10 4.5C9.8 4.4 9.5 4.5 9.3 4.7Z"),
      line(9.5, 4.7, 9.5, 18.4),
      line(15.4, 6.2, 15.4, 20.4),
    ],
  },

  /* status dot — a filled round that breathes (scale around its center) */
  dot: {
    auto: false,
    dur: 1.6,
    parts: [G("d", [circle(12, 12, 4.2, fill())])],
    sAnims: { d: { pivot: [12, 12], anim: tn("scale", ["1", "1", "1.18", "1", "1"], HOLD) } },
  },
};
