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

/* ---- bespoke gesture idioms (same vocabulary as the other craft batches)
   HOLD phrasing: rest ~30%+, act mid-cycle, settle back — pose at t=0
   always equals pose at t=1 so the loop is seamless. Motion only; no
   part geometry is touched. */
const HOLD = [0, 0.3, 0.55, 0.8, 1];
/* wiggle — rotate −a then +a around a pivot, with rest holds (gAnims). */
const WIG = (cx, cy, a = 9) =>
  tn("rotate", [`0 ${cx} ${cy}`, `0 ${cx} ${cy}`, `-${a} ${cx} ${cy}`, `${a - 2} ${cx} ${cy}`, `0 ${cx} ${cy}`], HOLD);
/* dip — translate out along an axis and spring back (gAnims). */
const DIP = (dx, dy) => tn("translate", ["0 0", "0 0", `${dx} ${dy}`, "0 0", "0 0"], HOLD);

/* tilted paw beans — two rotated arc halves meeting at the tip points. */
const bean = (cx, cy, r, deg) => {
  const t = (deg * Math.PI) / 180, co = Math.cos(t), si = Math.sin(t);
  const ry = r * 1.28, rx = r;
  const P = (x, y) => [cx + x * co - y * si, cy + x * si + y * co];
  const [ax, ay] = P(0, -ry), [bx, by] = P(0, ry);
  const dx = (bx - ax).toFixed(2), dy = (by - ay).toFixed(2);
  return `M${ax.toFixed(2)} ${ay.toFixed(2)}a${rx} ${ry} ${deg} 1 1 ${dx} ${dy}a${rx} ${ry} ${deg} 1 1 ${-dx} ${-dy}Z`;
};

/* battery family silhouette — identical to battery/battery-*01/02. */
const BATT = [
  rect(2.6, 6.3, 15.9, 11.4, 3.4),
  path("M18.5 10.3a1.9 1.9 0 0 1 0 3.4"),
];

/* shared small cloud — the cloud-sun-rain/cloud-moon-rain family form. */
const CLOUD = "M6.4 18.9c-1.7 0-3-1.2-3-2.7 0-1.4 1-2.5 2.3-2.8.4-2 2-3.5 4-3.5 1.7 0 3.1 1.2 3.5 2.8h.5c1.7 0 3 1.3 3 2.9 0 1.8-1.4 3.3-3.2 3.3H6.4Z";

export const icons = {
  /* ------------------------------ weather ------------------------------ */

  /* dome pops open on the shaft — scale-x fold about the hem */
  umbrella: {
    auto: false,
    pp: false,
    dur: 1.9,
    parts: [
      line(12, 2.6, 12, 3.6),
      G("canopy", [
        path("M3.4 12.5c0-4.8 3.8-8.6 8.6-8.6s8.6 3.8 8.6 8.6c-1.9-1-3.8-1-5.7 0-1.9-1-3.9-1-5.8 0-1.9-1-3.8-1-5.7 0Z"),
      ]),
      path("M12 12.5v4.8c0 1.4 1 2.4 2.3 2.4s2.3-1 2.3-2.4"),
    ],
    sAnims: { canopy: { pivot: [12, 12.5], anim: tn("scale", ["1 1", "1 1", "0.28 1", "1 1", "1 1"], HOLD) } },
  },

  /* six spokes + tip forks; the 60° spin lands on the same silhouette */
  snowflake: {
    auto: false,
    pp: false,
    dur: 2.4,
    parts: [
      G("flake", [
        line(12, 3.4, 12, 20.6),
        line(4.6, 7.7, 19.4, 16.3),
        line(19.4, 7.7, 4.6, 16.3),
        path("M10.8 4.9l1.2-1.5 1.2 1.5M10.8 19.1l1.2 1.5 1.2-1.5M18.8 9.5l.6-1.8-1.9-.4M17.8 17.3l1.6-1-1.2-1.5M5.2 14.5l-.6 1.8 1.9.3M6.2 6.7l-1.6 1 1.2 1.5"),
        circle(12, 12, 1.05, fill()),
      ]),
    ],
    gAnims: { flake: tn("rotate", ["0 12 12", "60 12 12", "0 12 12"], [0, 0.97, 1]) },
  },

  /* three streaks, hooks up top and under — gusts sweep through staggered */
  wind: {
    auto: false,
    pp: false,
    dur: 1.9,
    parts: [
      G("s1", [path("M3 9.5h8.8c1.8 0 3-1.2 3-2.9 0-1.5-1.1-2.6-2.6-2.6-1.3 0-2.3.9-2.5 2.1")]),
      G("s2", [path("M3 13.5h12.8c1.9 0 3.2-1.3 3.2-3 0-1.5-1.2-2.8-2.8-2.8-1.4 0-2.5 1-2.7 2.3")]),
      G("s3", [path("M3 17.5h9.2c1.7 0 2.8 1.1 2.8 2.6 0 1.3-1 2.4-2.4 2.4-1.2 0-2.1-.8-2.4-1.9")]),
    ],
    gAnims: {
      s1: tn("translate", ["0 0", "0 0", "1.5 0", "0 0", "0 0"], [0, 0.2, 0.34, 0.5, 1]),
      s2: tn("translate", ["0 0", "0 0", "1.5 0", "0 0", "0 0"], [0, 0.28, 0.42, 0.58, 1]),
      s3: tn("translate", ["0 0", "0 0", "1.5 0", "0 0", "0 0"], [0, 0.36, 0.5, 0.66, 1]),
    },
  },

  /* tapered funnel; the wobble travels band to band */
  tornado: {
    auto: false,
    pp: false,
    dur: 2.0,
    parts: [
      G("t1", [line(3.5, 4.5, 20.5, 4.5), line(5.5, 7.4, 19.5, 7.4)]),
      G("t2", [line(4.5, 10.3, 17.5, 10.3), line(7.5, 13.2, 17, 13.2)]),
      G("t3", [line(8.5, 16.1, 14.5, 16.1), line(10.5, 19, 13, 19)]),
    ],
    gAnims: {
      t1: tn("translate", ["0 0", "0 0", "-1.2 0", "0 0", "0 0"], [0, 0.3, 0.44, 0.58, 1]),
      t2: tn("translate", ["0 0", "0 0", "1.4 0", "0 0", "0 0"], [0, 0.36, 0.5, 0.64, 1]),
      t3: tn("translate", ["0 0", "0 0", "-1 0", "0 0", "0 0"], [0, 0.42, 0.56, 0.7, 1]),
    },
  },

  /* nested arcs tracing in, outside-in */
  rainbow: {
    auto: false,
    dur: 1.9,
    parts: [
      A(path("M4.2 18a7.8 7.8 0 0 1 15.6 0", { pathLength: 1, "stroke-dasharray": 1 }), [
        an("stroke-dashoffset", ["1", "1", "0", "0"], [0, 0.18, 0.5, 1]),
      ]),
      A(path("M7 18a5 5 0 0 1 10 0", { pathLength: 1, "stroke-dasharray": 1 }), [
        an("stroke-dashoffset", ["1", "1", "0", "0"], [0, 0.3, 0.62, 1]),
      ]),
      A(path("M9.8 18a2.2 2.2 0 0 1 4.4 0", { pathLength: 1, "stroke-dasharray": 1 }), [
        an("stroke-dashoffset", ["1", "1", "0", "0"], [0, 0.42, 0.74, 1]),
      ]),
    ],
  },

  /* half-sun + rays + horizon; sun lifts off the line behind the arrow */
  sunrise: {
    auto: false,
    pp: false,
    dur: 1.9,
    parts: [
      G("sun", [
        path("M7.5 17.9a4.5 4.5 0 0 1 9 0"),
        path("M4.3 14.6h1.7M18 14.6h1.7M6 11.6l1.4 1.4M18 11.6l-1.4 1.4"),
      ]),
      line(3.5, 19.9, 20.5, 19.9),
      G("arr", [path("M12 3.2v4.4M9.8 5.4l2.2-2.2 2.2 2.2")]),
    ],
    gAnims: {
      arr: tn("translate", ["0 0", "0 0", "0 -1.2", "0 0", "0 0"], [0, 0.3, 0.46, 0.62, 1]),
      sun: tn("translate", ["0 0", "0 0", "0 -1.4", "0 0", "0 0"], [0, 0.36, 0.52, 0.68, 1]),
    },
  },

  /* twin of sunrise — arrow down, sun sinks to the line */
  sunset: {
    auto: false,
    pp: false,
    dur: 1.9,
    parts: [
      G("sun", [
        path("M7.5 17.9a4.5 4.5 0 0 1 9 0"),
        path("M4.3 14.6h1.7M18 14.6h1.7M6 11.6l1.4 1.4M18 11.6l-1.4 1.4"),
      ]),
      line(3.5, 19.9, 20.5, 19.9),
      G("arr", [path("M12 3.2v4.4M9.8 5.4l2.2 2.2 2.2-2.2")]),
    ],
    gAnims: {
      arr: tn("translate", ["0 0", "0 0", "0 1.2", "0 0", "0 0"], [0, 0.3, 0.46, 0.62, 1]),
      sun: tn("translate", ["0 0", "0 0", "0 1.5", "0 0", "0 0"], [0, 0.36, 0.52, 0.68, 1]),
    },
  },

  /* peeking sun — the cloud-sun-rain set minus the drops */
  "cloud-sun": {
    dur: 1.6,
    parts: [
      circle(16.4, 7.6, 2.6),
      path("M16.4 3.7v.7M14.4 5l.5.5M18.4 5l-.5.5M19.1 7.6h.8M18.2 9.8l.5.5"),
      path(CLOUD),
    ],
  },

  /* peeking moon — the moon-cloud family form */
  "cloud-moon": {
    dur: 1.6,
    parts: [
      path("M20 9.4a4.5 4.5 0 1 1-5.7-5.7 3.7 3.7 0 0 0 5.7 5.7Z"),
      path(CLOUD),
    ],
  },

  /* three swell rows sloshing against each other */
  waves: {
    auto: false,
    pp: false,
    dur: 2.1,
    parts: [
      G("w1", [path("M3 7c1.5-2 3-2 4.5 0s3 2 4.5 0 3-2 4.5 0 3 2 4.5 0")]),
      G("w2", [path("M3 12c1.5-2 3-2 4.5 0s3 2 4.5 0 3-2 4.5 0 3 2 4.5 0")]),
      G("w3", [path("M3 17c1.5-2 3-2 4.5 0s3 2 4.5 0 3-2 4.5 0 3 2 4.5 0")]),
    ],
    gAnims: {
      w1: DIP(1.3, 0),
      w2: DIP(-1.3, 0),
      w3: DIP(1.3, 0),
    },
  },

  /* ------------------------------ nature ------------------------------ */

  /* A-frame + inner door, sitting on the ground line */
  tent: {
    dur: 1.5,
    parts: [
      path("M4.2 20.4l7.2-15.4c.4-.8 1.3-.8 1.6 0l7.4 15.4"),
      path("M9.6 20.4l2.4-4.8 2.4 4.8"),
      line(3, 20.4, 21, 20.4),
    ],
  },

  /* two bough tiers with the shelf notches */
  "tree-pine": {
    dur: 1.5,
    parts: [
      path("M12 3.4c-1 2.1-2.3 4-3.7 5.9h1.8c-1.7 2.2-3.5 4.4-4.8 6.6h13.4c-1.3-2.2-3.1-4.4-4.8-6.6h1.8c-1.4-1.9-2.7-3.8-3.7-5.9Z"),
      line(12, 15.9, 12, 20.8),
    ],
  },

  /* soft canopy blob, trunk splitting into curved branches */
  "tree-deciduous": {
    dur: 1.6,
    parts: [
      path("M12 3.2c-1.7 0-3.2.9-4 2.3-2.4.3-4.2 2.2-4.2 4.5 0 2.5 2.1 4.6 4.7 4.6h7c2.6 0 4.7-2.1 4.7-4.6 0-2.3-1.8-4.2-4.2-4.5-.8-1.4-2.3-2.3-4-2.3Z"),
      path("M12 21.2v-6.6M12 15.6l-2.4-1.6"),
    ],
  },

  /* leaning trunk, crown swaying off its tip */
  palmtree: {
    auto: false,
    pp: false,
    dur: 1.9,
    parts: [
      /* fronds as single arching strokes: five closed leaves stacked on one
         point filled into a blot */
      path("M10.8 21.4c.5-4.8 1.5-9.4 3.2-13.6"),
      G("crown", [
        path("M14 7.8c-2.2-1.9-5.6-2.3-8.6-.6"),
        path("M14 7.8c-3-.4-5.8 1-7.2 3.8"),
        path("M14 7.8c.3-2 1.5-3.6 3.6-4.6"),
        path("M14 7.8c2.4-1.4 5.2-1.4 7.4.4"),
        path("M14 7.8c2.8.4 5 2.4 5.8 5.2"),
      ]),
    ],
    gAnims: { crown: WIG(14, 7.8, 6) },
  },

  /* tulip: notched cup + stem + one leaf */
  "flower-2": {
    dur: 1.6,
    parts: [
      path("M9 4.4c0 2.6 1.4 4.6 3 4.6s3-2 3-4.6c0-.5-.1-1-.3-1.5l-1.6 1.9c-.4.5-1 .5-1.4 0L9.6 2.9C9.2 3.4 9 3.9 9 4.4Z"),
      line(12, 9, 12, 20.5),
      path("M12 16.3c-1.7-1.5-4-1.7-6.2-.8.6 2.1 2.3 3.4 4.4 3.4 1.6 0 1.8-1.1 1.8-2.6Z"),
    ],
  },

  /* blade to upper-right, vein running through to the stem */
  leaf: {
    dur: 1.5,
    parts: [
      path("M6.2 18.3C6.5 11 11 5.8 18.6 5.2c.5 7.6-4.5 12.6-12.4 13.1Z"),
      path("M3.8 20.4c1.9-5.2 5.5-9.1 11-11.6"),
    ],
  },

  /* forked sprout; lobes pop out of the stem staggered */
  sprout: {
    auto: false,
    pp: false,
    dur: 1.8,
    parts: [
      line(7, 20.5, 17, 20.5),
      line(12, 20.5, 12, 13.5),
      G("lo", [path("M12 14.2c-1.1-2.3-3.2-3.7-5.9-3.8-.3 3.4 1.3 5.9 4.2 6.4 1.4.2 2.5-.4 2.7-1.6l-1-1Z")]),
      G("ro", [path("M12 14.2c1.1-2.3 3.2-3.7 5.9-3.8.3 3.4-1.3 5.9-4.2 6.4-1.4.2-2.5-.4-2.7-1.6l1-1Z")]),
    ],
    sAnims: {
      lo: { pivot: [9.5, 13], anim: tn("scale", ["1", "1", "1.2", "1", "1"], [0, 0.28, 0.42, 0.56, 1]) },
      ro: { pivot: [14.5, 13], anim: tn("scale", ["1", "1", "1.2", "1", "1"], [0, 0.4, 0.54, 0.68, 1]) },
    },
  },

  /* ------------------------------ animals ------------------------------ */

  /* front face, floppy ears — the cat's sibling */
  "dog": { dur: 1.4, auto: true, parts: [
    path("M7.5 7.5C8.5 5.5 10 5 12 5s3.5.5 4.5 2.5"),
    path("M7.5 7.5C5.5 6.5 3.5 8 3.5 11c0 2 1 3 2.5 3M16.5 7.5c2-1 4 .5 4 3.5 0 2-1 3-2.5 3"),
    path("M6 14c0 3.5 2.7 6 6 6s6-2.5 6-6V8"),
    circle(9.6, 11.2, 0.9, fill()),
    circle(14.4, 11.2, 0.9, fill()),
    path("M10.8 14.4h2.4L12 15.8Z"),
  ] },

  /* tall ears + egg head; the left ear flicks */
  rabbit: {
    auto: false,
    pp: false,
    dur: 1.8,
    parts: [
      G("ear", [ellipse(9.5, 5.9, 1.4, 3.2)]),
      ellipse(14.5, 5.9, 1.4, 3.2),
      path("M12 8.6c3 0 5.2 1.7 5.2 4.2 0 2.8-2.3 4.7-5.2 4.7s-5.2-1.9-5.2-4.7c0-2.5 2.2-4.2 5.2-4.2Z"),
      line(9.8, 12.4, 9.8, 13.2),
      line(14.2, 12.4, 14.2, 13.2),
      path("M11 14.2h2l-1 1z", fill()),
    ],
    gAnims: { ear: tn("rotate", ["0 9.5 9", "0 9.5 9", "-9 9.5 9", "6 9.5 9", "0 9.5 9"], HOLD) },
  },

  /* dome shell, head poking right, stub feet */
  turtle: {
    dur: 1.6,
    parts: [
      path("M4.6 15.4a7.6 7.6 0 0 1 15.2 0"),
      line(12.2, 7.8, 12.2, 15.4),
      line(3.8, 15.4, 16.6, 15.4),
      line(7.2, 15.4, 7.2, 17.7),
      line(16.2, 15.4, 16.2, 17.7),
      path("M4 15.4l-1.6 1.4"),
      circle(20.1, 13.8, 1.3),
    ],
  },

  /* spiral shell riding on the foot, eye-stalks up front */
  snail: {
    dur: 1.7,
    parts: [
      circle(10.6, 12, 5.6),
      path("M10.6 12c.8 0 1.4-.5 1.4-1.3 0-.9-.7-1.6-1.6-1.6-1.1 0-2 .9-2 2 0 1.4 1.1 2.5 2.6 2.5 1.8 0 3.2-1.4 3.2-3.3"),
      path("M4.2 18.6c0-1.5 1.1-2.6 2.6-2.6h9.9c1.4 0 2.6 1 2.9 2.3"),
      path("M19.6 18.6c.2-1.7 1-3.1 2.4-4M18.9 15.1l1-2.4"),
      circle(20.4, 12.2, 0.8, fill()),
    ],
  },

  /* big pad + four fanned beans */
  "paw-print": {
    dur: 1.5,
    parts: [
      path(bean(6.3, 11, 1.1, -28)),
      path(bean(9.1, 8.4, 1.1, -8)),
      path(bean(14.9, 8.4, 1.1, 8)),
      path(bean(17.7, 11, 1.1, 28)),
      path("M12 13.9c-2.9 0-5 2-5 4.4 0 1.7 1.3 3 3 3h4c1.7 0 3-1.3 3-3 0-2.4-2.1-4.4-5-4.4Z"),
    ],
  },

  /* ------------------------------ food ------------------------------ */

  /* mug + handle; steam rises and fades staggered */
  coffee: {
    auto: false,
    pp: false,
    dur: 2.1,
    parts: [
      G("w1", [A(path("M7.4 3.2c-.5.7-.5 1.6 0 2.3"), [
        an("opacity", ["1", "1", "0.15", "0.15", "1", "1"], [0, 0.3, 0.5, 0.8, 0.92, 1]),
      ])]),
      G("w2", [A(path("M10.4 3.2c-.5.7-.5 1.6 0 2.3"), [
        an("opacity", ["1", "1", "0.15", "0.15", "1", "1"], [0, 0.38, 0.58, 0.86, 0.95, 1]),
      ])]),
      G("w3", [A(path("M13.4 3.2c-.5.7-.5 1.6 0 2.3"), [
        an("opacity", ["1", "1", "0.15", "0.15", "1", "1"], [0, 0.46, 0.66, 0.92, 0.98, 1]),
      ])]),
      path("M4 9.3h12.6v6.4c0 2.7-2.1 4.8-4.8 4.8H8.8c-2.7 0-4.8-2.1-4.8-4.8V9.3Z"),
      path("M16.6 10.8h.9c1.7 0 3 1.3 3 3s-1.3 3-3 3h-.9"),
    ],
    gAnims: {
      w1: tn("translate", ["0 0", "0 0", "0 -1.6", "0 -1.6", "0 0", "0 0"], [0, 0.3, 0.52, 0.8, 0.9, 1]),
      w2: tn("translate", ["0 0", "0 0", "0 -1.6", "0 -1.6", "0 0", "0 0"], [0, 0.38, 0.6, 0.86, 0.94, 1]),
      w3: tn("translate", ["0 0", "0 0", "0 -1.6", "0 -1.6", "0 0", "0 0"], [0, 0.46, 0.68, 0.92, 0.97, 1]),
    },
  },

  /* goblet bowl, liquid line, stem, foot */
  wine: {
    dur: 1.5,
    parts: [
      path("M7.2 3.5V9c0 2.8 2.1 5 4.8 5s4.8-2.2 4.8-5V3.5"),
      line(8.4, 7.2, 15.6, 7.2),
      line(12, 14, 12, 19.6),
      line(8.6, 19.8, 15.4, 19.8),
    ],
  },

  /* V glass, rim, stem, foot — olive on a pick */
  martini: {
    dur: 1.6,
    parts: [
      line(5.2, 4.2, 18.8, 4.2),
      path("M5.2 4.2l6.8 7.5 6.8-7.5"),
      line(12, 11.7, 12, 19.3),
      line(8.7, 19.8, 15.3, 19.8),
      path("M13.6 3l4.4 3.9", { "stroke-width": 1.4 }),
      circle(16.6, 6, 1, fill()),
    ],
  },

  /* crust arc + wedge + two pepperoni */
  pizza: {
    dur: 1.5,
    parts: [
      path("M6.4 7.2C8 5.6 10 4.8 12 4.8s4 .8 5.6 2.4l-5.2 13.3c-.3.6-.6.6-.9 0L6.4 7.2Z"),
      circle(11.2, 10, 1.1, fill()),
      circle(12.6, 14.4, 1, fill()),
    ],
  },

  /* half bowl, greens arcing over the rim */
  salad: {
    dur: 1.5,
    parts: [
      path("M3.5 12.5h17a8.5 8.5 0 0 1-17 0Z"),
      path("M7.8 12.4c-.5-2.2-2-3.8-4.2-4.3M12.1 12.4c-.1-2.7 1.5-4.8 4-5.4M16.3 12.4c.6-2 2-3.3 4-3.7"),
    ],
  },

  /* scoop dome + cone + cherry on top */
  "ice-cream": {
    dur: 1.5,
    parts: [
      path("M7.2 11.5a4.8 4.8 0 0 1 9.6 0l-4.4 9.1c-.2.5-.6.5-.8 0l-4.4-9.1Z"),
      circle(12, 5.3, 1.15, fill()),
    ],
  },

  /* ------------------------------ home ------------------------------ */

  /* cushioned box silhouette with arm rolls and legs */
  sofa: {
    dur: 1.5,
    parts: [
      path("M6.4 11.6V8c0-2 1.7-3.5 3.9-3.5h3.4c2.2 0 3.9 1.5 3.9 3.5v3.6"),
      path("M4.9 12.2c-1.1 0-2 .9-2 2v2.5c0 1.7 1.4 3.1 3.1 3.1h12c1.7 0 3.1-1.4 3.1-3.1v-2.5c0-1.1-.9-2-2-2s-2 .9-2 2v.6H6.9v-.6c0-1.1-.9-2-2-2Z"),
      line(6.5, 19.8, 6.5, 21.2),
      line(17.5, 19.8, 17.5, 21.2),
    ],
  },

  /* bedside lamp: trapezoid shade, stem, foot, pull-chain dot */
  lamp: {
    dur: 1.5,
    parts: [
      path("M8.7 3.8c-1.9 2.7-3 5.5-3.5 8.5h13.6c-.5-3-1.6-5.8-3.5-8.5H8.7Z"),
      line(12, 12.3, 12, 18.2),
      path("M9.2 20.8v-.4c0-1.1.9-2 2-2h1.6c1.1 0 2 .9 2 2v.4H9.2Z"),
      line(17, 13.8, 17, 15.4),
      circle(17, 16.4, 0.7, fill()),
    ],
  },

  /* ------------------------------ tools ------------------------------ */

  /* the canon shield carrying a check */
  "shield-check": {
    dur: 1.5,
    parts: [
      path("M12 3.2c1.9 1.2 4.3 2.2 7.4 2.6 1 0 1.7 1 1.7 2v3.9c0 4.3-3.5 7-7 8.8-1.3.6-3.1.6-4.4 0-3.5-1.8-7-4.5-7-8.8V7.8c0-1 .7-2 1.7-2 3.1-.4 5.5-1.4 7.6-2.6Z"),
      path("M8.9 11.6l2.1 2.1 4.1-4.6"),
    ],
  },

  /* diagonal blade, crossguard, grip, pommel */
  sword: {
    dur: 1.6,
    parts: [
      path("M14.6 17.6L4.1 7.1V4.1h3l10.9 10.5-3.4 3Z"),
      line(13.4, 19.4, 19.2, 13.6),
      line(16.6, 16.6, 20.6, 20.6),
      line(19.9, 21.3, 21.4, 19.8),
    ],
  },

  /* C-jaw open on the right, wedge mouth, handle capsule */
  "wrench": { dur: 1.4, auto: true, parts: [
    path("M14.6 6.4a1.1 1.1 0 0 0 0 1.5l1.6 1.6a1.1 1.1 0 0 0 1.5 0l3.7-3.7a5.9 5.9 0 0 1-7.8 7.8l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a5.9 5.9 0 0 1 7.8-7.8l-3.7 3.7z"),
  ] },

  /* flat tip, shaft, capsule handle — one diagonal */
  screwdriver: {
    dur: 1.5,
    parts: [
      path("M16.9 7.1l3.4-3.4-1.4-1.4-3.4 3.4"),
      line(10.4, 13.6, 16, 8),
      path("M8.6 12.5l-3.7 3.7c-.8.8-.8 2 0 2.8s2 .8 2.8 0l3.7-3.7c.8-.8.8-2 0-2.8s-2-.8-2.8 0Z"),
    ],
  },

  /* upright horseshoe, pole caps on top */
  magnet: {
    dur: 1.5,
    parts: [
      path("M5.6 3.8h4.2v10.4a2.2 2.2 0 0 0 4.4 0V3.8h4.2v10.4a6.4 6.4 0 0 1-12.8 0z"),
      path("M5.6 8.2h4.2M14.2 8.2h4.2"),
    ],
  },

  /* two prongs, box body, cord out the bottom */
  plug: {
    dur: 1.5,
    parts: [
      line(9, 3, 9, 7.6),
      line(15, 3, 15, 7.6),
      path("M6.8 7.6h10.4v5a5.2 5.2 0 0 1-10.4 0v-5Z"),
      line(12, 17.8, 12, 21.5),
    ],
  },

  /* family body + the family's bolt */
  "battery-charging": {
    dur: 1.5,
    parts: [
      ...BATT,
      path("M10.7 8.7l-2.3 3.2c-.2.3 0 .6.3.6h1.5l-.7 2.6c-.1.4.4.6.7.3l2.6-3.4c.2-.3 0-.6-.3-.6h-1.5l.7-2.6c.1-.4-.4-.6-1-.1Z"),
    ],
  },

  /* family body + two bars */
  "battery-medium": {
    dur: 1.5,
    parts: [
      ...BATT,
      rect(5.2, 9.8, 2.2, 4.4, 1, fill()),
      rect(8.4, 9.8, 2.2, 4.4, 1, fill()),
    ],
  },

  /* arc + plunger; the button presses down */
  power: {
    auto: false,
    pp: false,
    dur: 1.5,
    parts: [
      A(line(12, 3, 12, 7), [
        an("y2", ["7", "7", "8.6", "7", "7"], HOLD),
      ]),
      path("M18.6 6.8a8.5 8.5 0 1 1-13.2 0"),
    ],
  },

  /* bolt sketch, then the slash */
  "zap-off": {
    auto: false,
    dur: 1.8,
    parts: [
      A(path("M13.3 3.7L6.6 13.1c-.5.6 0 1.4.8 1.4h3.8l-1.3 5.6c-.2.9 1 1.4 1.5.7l6.7-9.4c.5-.6 0-1.4-.8-1.4h-3.8l1.3-5.6c.2-.9-1-1.4-1.5-.7Z", { pathLength: 1, "stroke-dasharray": 1 }), [
        an("stroke-dashoffset", ["1", "1", "0", "0"], [0, 0.12, 0.5, 1]),
      ]),
      A(line(4.4, 4.4, 19.6, 19.6, { pathLength: 1, "stroke-dasharray": 1 }), [
        an("stroke-dashoffset", ["1", "1", "0", "0"], [0, 0.55, 0.82, 1]),
      ]),
    ],
  },
};
