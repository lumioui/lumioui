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
const POP = (cx, cy, s = 1.24) => ({
  pivot: [cx, cy],
  anim: tn("scale", ["1", "1", `${s}`, "1", "1"], HOLD),
});
const WIG = (cx, cy, a = 9) =>
  tn("rotate", [`0 ${cx} ${cy}`, `0 ${cx} ${cy}`, `-${a} ${cx} ${cy}`, `${a - 2} ${cx} ${cy}`, `0 ${cx} ${cy}`], HOLD);
const DIP = (dx, dy) => tn("translate", ["0 0", "0 0", `${dx} ${dy}`, "0 0", "0 0"], HOLD);
const DRAW = (p, t0 = 0.15, t1 = 0.62) =>
  A({ ...p, a: { ...p.a, pathLength: 1, "stroke-dasharray": 1 } },
    [an("stroke-dashoffset", ["1", "1", "0", "0"], [0, t0, t1, 1])]);

/* steam wisp: rise + fade, reappear — same phrasing as coffee's wisps. */
const wisp = (x, y, t0) =>
  G(`w${x}`, [
    A(path(`M${x} ${y}c-.5.7-.5 1.6 0 2.3`), [
      an("opacity", ["1", "1", "0.15", "0.15", "1", "1"], [0, t0, t0 + 0.2, t0 + 0.5, t0 + 0.62, 1]),
    ]),
  ]);

export const icons = {
  /* ------------------------------ nature ------------------------------ */

  /* two opposing comma arms — the cyclone never stops turning */
  "hurricane": { dur: 1.4, auto: true, parts: [
    path("M13.6 12.0L13.7 12.4L13.6 12.9L13.5 13.4L13.2 13.8L12.7 14.2L12.2 14.4L11.5 14.5L10.9 14.5L10.2 14.2L9.6 13.8L9.1 13.2L8.8 12.5L8.6 11.6L8.7 10.8L9.0 9.9L9.5 9.1L10.2 8.4L11.1 8.0L12.2 7.8L13.2 7.8L14.3 8.1L15.3 8.7L16.1 9.6L16.7 10.6L17.1 11.8L17.1 13.1L16.8 14.4L16.1 15.6L15.2 16.6L14.0 17.4L12.6 17.9L11.1 18.0L9.6 17.7L8.2 17.1L6.9 16.0L6.0 14.7L5.4 13.2L5.1 11.5L5.3 9.8L6.0 8.1L7.0 6.6L8.5 5.4L10.2 4.6L12.0 4.3L14.0 4.4L15.9 5.0L17.6 6.1L19.0 7.6L20.0 9.4L20.5 11.4L20.6 13.6L20.0 15.7L19.0 17.7L17.4 19.3L15.5 20.6L13.3 21.3L10.9 21.5"),
  ] },

  /* tube + bulb; the mercury column rises and falls */
  thermometer: {
    auto: false,
    dur: 2.1,
    parts: [
      path("M12 4.5a2.2 2.2 0 0 0-2.2 2.2v7.4c-1.4 1-2.3 2.6-2.3 4.4a4.5 4.5 0 1 0 9 0c0-1.8-.9-3.4-2.3-4.4V6.7A2.2 2.2 0 0 0 12 4.5Z"),
      circle(12, 18.5, 2.1, fill()),
      A(line(12, 19.2, 12, 15.2), [
        an("y2", ["15.2", "15.2", "8.6", "8.6", "15.2"], [0, 0.3, 0.55, 0.8, 1]),
      ]),
    ],
  },

  /* saguaro — pillar trunk, arm hooks, a bud on the shoulder */
  cactus: {
    auto: false,
    dur: 1.9,
    parts: [
      G("sway", [
        path("M12 3.4a2.4 2.4 0 0 1 2.4 2.4v15.7h-4.8V5.8A2.4 2.4 0 0 1 12 3.4Z"),
        path("M9.6 13.2H7.4a2 2 0 0 1-2-2V8.4a1.7 1.7 0 0 1 3.4 0v1"),
        path("M14.4 15.2h2.2a2 2 0 0 0 2-2v-2.6a1.7 1.7 0 0 0-3.4 0v1"),
        circle(8.9, 4.3, 1.2),
        circle(8.9, 4.3, 0.5, fill()),
      ]),
    ],
    gAnims: { sway: WIG(12, 21.5, 4) },
  },

  /* dome cap on a chord, stem flares at the base; cap spots are ours */
  mushroom: {
    auto: false,
    dur: 1.7,
    parts: [
      G("cap", [
        path("M4.5 13.5h15c0-5.2-3.4-9.5-7.5-9.5s-7.5 4.3-7.5 9.5Z"),
        circle(8.9, 8.6, 1.1, fill()),
        circle(13.5, 6.9, 0.9, fill()),
        circle(15.2, 10.3, 0.75, fill()),
      ]),
      path("M10 13.5c-.3 2.6-.3 4.4-1.4 5.6-.4.4-.6 1-.3 1.5h7.4c.3-.5.1-1.1-.3-1.5-1.1-1.2-1.1-3-1.4-5.6"),
    ],
    sAnims: { cap: { pivot: [12, 13.5], anim: tn("scale", ["1 1", "1 1", "1.07 0.9", "1 1", "1 1"], HOLD) } },
  },

  /* one outline: slope → crater notch → slope; lava dribble, puffs rise */
  volcano: {
    auto: false,
    pp: false,
    dur: 2.3,
    parts: [
      path("M3.5 20.5l5.4-10.7c1.1.8 2 1.3 3.1 1.3s2-.5 3.1-1.3l5.4 10.7"),
      path("M12 12.4v2.8"),
      G("p1", [
        A(circle(10.4, 6.6, 1.1), [
          an("opacity", ["0", "1", "1", "0", "0"], [0, 0.18, 0.5, 0.68, 1]),
          an("cy", ["6.6", "6.6", "5", "5", "6.6"], [0, 0.18, 0.5, 0.68, 1]),
        ]),
      ]),
      G("p2", [
        A(circle(14.2, 4.4, 1.5), [
          an("opacity", ["0", "1", "1", "0", "0"], [0.25, 0.43, 0.75, 0.93, 1]),
          an("cy", ["4.4", "4.4", "2.9", "2.9", "4.4"], [0.25, 0.43, 0.75, 0.93, 1]),
        ]),
      ]),
    ],
  },

  /* ------------------------------ animals ------------------------------ */

  /* hangs from a silk thread; the body rappels as the thread stretches */
  spider: {
    auto: false,
    dur: 1.9,
    parts: [
      A(line(12, 2.5, 12, 6.4), [
        an("y2", ["6.4", "6.4", "8.2", "6.4", "6.4"], HOLD),
      ]),
      G("body", [
        circle(12, 9.6, 2.5),
        circle(12, 15.4, 3.5),
        path("M9.9 10.9c-1.9-1.3-4-1.5-5.9-.7M9.2 13.4c-2-.5-4-.2-5.6 1M9.6 16.5c-1.8.8-3.2 2-3.9 3.7"),
        path("M14.1 10.9c1.9-1.3 4-1.5 5.9-.7M14.8 13.4c2-.5 4-.2 5.6 1M14.4 16.5c1.8.8 3.2 2 3.9 3.7"),
        circle(11, 9.2, 0.55, fill()),
        circle(13, 9.2, 0.55, fill()),
      ]),
    ],
    gAnims: { body: DIP(0, 1.8) },
  },

  /* paired wings over a slim body — they flap as one */
  butterfly: {
    auto: false,
    dur: 1.15,
    parts: [
      ellipse(12, 13.9, 1.15, 4.2),
      path("M11.4 10.2c-.8-1.1-1.5-2.1-1.8-3.4M12.6 10.2c.8-1.1 1.5-2.1 1.8-3.4"),
      G("wl", [
        path("M11 12.6C8.6 12.9 5.6 12.4 4.6 10.1c-.8-1.9.3-4 2.2-4.4 2.5-.5 4.4 2.9 4.4 5.7"),
        path("M11 14.9c-2.3.5-4.9 1.5-5.6 3.4-.6 1.5.3 3 1.8 3.3 2 .4 3.9-1.5 4.2-3.8"),
      ]),
      G("wr", [
        path("M13 12.6c2.4.3 5.4-.2 6.4-2.5.8-1.9-.3-4-2.2-4.4-2.5-.5-4.4 2.9-4.4 5.7"),
        path("M13 14.9c2.3.5 4.9 1.5 5.6 3.4.6 1.5-.3 3-1.8 3.3-2 .4-3.9-1.5-4.2-3.8"),
      ]),
    ],
    sAnims: {
      wl: { pivot: [12, 12.5], anim: tn("scale", ["1 1", "1 1", "0.55 1", "0.85 1", "0.55 1", "1 1", "1 1"], [0, 0.25, 0.36, 0.44, 0.52, 0.66, 1]) },
      wr: { pivot: [12, 12.5], anim: tn("scale", ["1 1", "1 1", "0.55 1", "0.85 1", "0.55 1", "1 1", "1 1"], [0, 0.25, 0.36, 0.44, 0.52, 0.66, 1]) },
    },
  },

  /* seated profile; the tail is a fat comma hooking over the back */
  "squirrel": { dur: 1.4, auto: true, parts: [
    path("M12.2 20.5H9C5.2 20.5 3 17.6 3.4 13.8C3.8 9.8 6.6 7 9.8 7C11.8 7 12.7 8.2 12.2 9.6"),
    path("M6.6 16.4C5.6 14.4 6.2 11.8 8.2 10.8"),
    path("M13.6 9.8C13.6 7.6 15.2 6 17.1 6S20.6 7.6 20.6 9.5C20.6 10.8 20 11.8 19.1 12.3"),
    path("M15.3 6.6 15.2 4 17.2 5.9"),
    path("M19.1 12.3C20.2 14.3 20.4 17.6 18.6 20.5H12.2C11.6 18 11.8 15.8 12.8 13.8"),
    circle(18.3, 9, 0.9, fill()),
  ] },

  /* beetle: oval carapace, split line, six leg strokes, antennae */
  bug: {
    auto: false,
    dur: 1.7,
    parts: [
      G("twitch", [
        path("M9.7 8.6a2.3 2.3 0 0 1 4.6 0"),
        path("M10.3 6.6c-.8-.9-1.5-1.7-2.4-2.2M13.7 6.6c.8-.9 1.5-1.7 2.4-2.2"),
        path("M12 8.5c-2.9 0-5.2 2.3-5.2 5.2v2.1c0 2.9 2.3 5.2 5.2 5.2s5.2-2.3 5.2-5.2v-2.1C17.2 10.8 14.9 8.5 12 8.5Z"),
        path("M12 11v8.5"),
        path("M7.2 13.5H4.4M7.4 16.4l-2.8 1.6M7.6 11.2L5 9.7M16.8 13.5h2.8M16.6 16.4l2.8 1.6M16.4 11.2l2.6-1.5"),
      ]),
    ],
    gAnims: { twitch: WIG(12, 14, 4) },
  },

  /* ------------------------------ food ------------------------------ */

  /* teacup on a saucer — the teabag tag swings on its string */
  cup: {
    auto: false,
    dur: 1.8,
    parts: [
      path("M6 9.5h10.5v4.6c0 2.6-2.1 4.7-4.7 4.7h-1.1c-2.6 0-4.7-2.1-4.7-4.7V9.5Z"),
      path("M16.5 10.8h.8c1.5 0 2.7 1.2 2.7 2.7s-1.2 2.7-2.7 2.7h-.8"),
      line(4, 21, 14.5, 21),
      G("tag", [
        path("M9.5 9.5c.5 1 .5 2 0 3"),
        rect(8.4, 12.6, 2.2, 2.6, 0.7),
      ]),
    ],
    gAnims: { tag: WIG(9.5, 9.5, 10) },
  },

  /* sturdy tavern mug: flat top, C handle, liquid line; lifts in a cheer */
  mug: {
    auto: false,
    dur: 1.7,
    parts: [
      G("lift", [
        path("M6.5 8.8h11v9.7c0 1.7-1.3 3-3 3H9.5c-1.7 0-3-1.3-3-3V8.8Z"),
        path("M17.5 10.2h.7c1.8 0 3.2 1.4 3.2 3.2s-1.4 3.2-3.2 3.2h-.7"),
        line(6.5, 12.4, 17.5, 12.4),
      ]),
    ],
    gAnims: { lift: DIP(0, -0.9) },
  },

  /* bun dome, sesame dots, cheese drips, base slab; the bun presses down */
  sandwich: {
    auto: false,
    dur: 1.7,
    parts: [
      G("bun", [
        path("M5.2 11.5c0-2.9 2.5-5.2 5.7-5.2h2.2c3.2 0 5.7 2.3 5.7 5.2"),
        circle(9.8, 8.5, 0.7, fill()),
        circle(13.9, 8.8, 0.7, fill()),
      ]),
      path("M4.5 13.8h15M7 13.8v1.6M12 13.8v1.6M17 13.8v1.6"),
      path("M4.5 13.8v2.7c0 1.4 1.1 2.5 2.5 2.5h10c1.4 0 2.5-1.1 2.5-2.5v-2.7"),
    ],
    gAnims: { bun: DIP(0, -0.7) },
  },

  /* gable-top carton, ridge pole, droplet on the front */
  milk: {
    auto: false,
    dur: 1.7,
    parts: [
      path("M8 21.5V9.5l4-3.9 4 3.9v12H8Z"),
      path("M8 9.5h8M12 5.6V3.4"),
      G("drop", [path("M12 13.2c-1.1 1.3-1.7 2.3-1.7 3.3 0 1 .8 1.8 1.7 1.8s1.7-.8 1.7-1.8c0-1-.6-2-1.7-3.3Z")]),
    ],
    sAnims: { drop: POP(12, 16, 1.16) },
  },

  /* striped tub, individual kernels heaped over the rim, one pops out */
  popcorn: {
    auto: false,
    dur: 1.9,
    parts: [
      circle(8.7, 7.9, 1.7),
      circle(12, 6.6, 1.9),
      circle(15.3, 7.9, 1.7),
      path("M6.5 9.5h11l-1.1 9.8c-.1 1.2-1.1 2.2-2.3 2.2H9.9c-1.2 0-2.2-1-2.3-2.2L6.5 9.5Z"),
      path("M9.4 9.5l-.5 12M12 9.5v12M14.6 9.5l.5 12"),
      A(circle(18.9, 4.6, 1.3), [
        an("cy", ["4.6", "4.6", "3.1", "4.6", "4.6"], HOLD),
      ]),
    ],
  },

  /* ------------------------------ health ------------------------------ */

  /* capsule diagonal with the mid split; rocks in place */
  pill: {
    auto: false,
    dur: 1.6,
    parts: [
      G("rock", [
        path("M6.5 13.4l5.4-5.4a3.4 3.4 0 0 1 4.8 4.8l-5.4 5.4a3.4 3.4 0 1 1-4.8-4.8Z"),
        path("M11.9 8l4.8 4.8"),
        circle(8.9, 15.8, 0.8, fill()),
      ]),
    ],
    gAnims: { rock: WIG(12, 13.2, 9) },
  },

  /* earpiece U feeding one lead down to the chestpiece — ours runs long */
  stethoscope: {
    auto: false,
    dur: 1.8,
    parts: [
      path("M7 4.2V2.6M16 4.2V2.6"),
      path("M7 4.2v3.8a4.5 4.5 0 0 0 9 0V4.2"),
      path("M11.5 12.5v3.2c0 2.6 2.1 4.7 4.7 4.7h1.3"),
      G("chest", [
        circle(18.9, 18.1, 2.4),
        circle(18.9, 18.1, 0.9, fill()),
      ]),
    ],
    gAnims: { chest: DIP(0, 1.2) },
  },

  /* flange, barrel, taper, needle; the plunger presses, the drop slips */
  syringe: {
    auto: false,
    dur: 2,
    parts: [
      G("plunger", [
        line(9.5, 3.2, 14.5, 3.2),
        line(12, 3.2, 12, 7),
      ]),
      line(7, 7, 17, 7),
      path("M8.5 7h7v7.5c0 .9-.7 1.5-1.5 1.5h-4c-.8 0-1.5-.6-1.5-1.5V7Z"),
      path("M10.2 16l1.8 2 1.8-2"),
      line(12, 18, 12, 20.4),
      line(8.5, 10.6, 15.5, 10.6),
      A(circle(12, 20.9, 0.7, fill()), [
        an("cy", ["20.9", "20.9", "21.7", "21.7", "20.9"], [0, 0.42, 0.62, 0.75, 1]),
        an("opacity", ["1", "1", "0", "0", "1"], [0, 0.42, 0.62, 0.85, 1]),
      ]),
    ],
    gAnims: { plunger: DIP(0, 2) },
  },

  /* rider silhouette seated in the chair; spokes roll continuously */
  "wheelchair": { dur: 1.4, auto: true, parts: [
    circle(9, 4.2, 1.8),
    path("M9 8V13.5H15L18 19"),
    path("M9 10.5H14.5"),
    path("M6.3 11.8A5.5 5.5 0 1 0 15 19"),
  ] },

  /* ------------------------------ objects ------------------------------ */

  /* slim tube on a tripod, panning slowly across the sky */
  telescope: {
    auto: false,
    dur: 2.4,
    parts: [
      G("scope", [
        G("t", [
          rect(3.8, 10.3, 14.6, 4, 2),
          rect(2.4, 11.2, 1.9, 2.2, 0.8),
          rect(18.1, 10.7, 1.5, 3.2, 0.7),
        ], { transform: "rotate(-26 11.7 12.3)" }),
        circle(12, 15.4, 1),
      ]),
      path("M12 16.4L7.9 21.5M12 16.4l4.1 5.1M12 16.4v5.1"),
      path("M19.8 3.6v1.8M18.9 4.5h1.8"),
    ],
    gAnims: { scope: tn("rotate", ["0 12 15.4", "0 12 15.4", "-4 12 15.4", "3 12 15.4", "0 12 15.4"], HOLD) },
  },

  /* five-face die, tumbling in quarter turns */
  dice: {
    auto: false,
    pp: false,
    dur: 2.4,
    parts: [
      G("tumble", [
        rect(4.5, 4.5, 15, 15, 3.4),
        circle(12, 12, 1.35, fill()),
        circle(8.3, 8.3, 1.15, fill()),
        circle(15.7, 8.3, 1.15, fill()),
        circle(8.3, 15.7, 1.15, fill()),
        circle(15.7, 15.7, 1.15, fill()),
      ]),
    ],
    gAnims: { tumble: tn("rotate", ["0 12 12", "0 12 12", "90 12 12", "90 12 12", "180 12 12", "180 12 12", "270 12 12", "270 12 12", "360 12 12"], [0, 0.22, 0.3, 0.47, 0.55, 0.72, 0.8, 0.97, 1]) },
  },

  /* paddle face + taper grip; the ball taps in and rebounds */
  "ping-pong": { dur: 1.4, auto: true, parts: [
    circle(10, 9.5, 6),
    path("M10 15.5V21"),
    circle(19, 6, 1.6),
  ] },

  /* ------------------------------ devices ------------------------------ */

  /* family arc + plunger, then the off slash writes itself */
  "power-off": {
    auto: false,
    dur: 1.9,
    parts: [
      DRAW(path("M18.6 6.8a8.5 8.5 0 1 1-13.2 0"), 0.08, 0.45),
      DRAW(line(12, 3, 12, 7), 0.4, 0.58),
      DRAW(line(4.4, 4.4, 19.6, 19.6), 0.58, 0.85),
    ],
  },

  /* family plug body carrying its own bolt; the bolt pulses */
  "plug-zap": {
    auto: false,
    dur: 1.5,
    parts: [
      line(9, 3, 9, 7.6),
      line(15, 3, 15, 7.6),
      path("M6.8 7.6h10.4v5a5.2 5.2 0 0 1-10.4 0v-5Z"),
      line(12, 17.8, 12, 21.5),
      G("bolt", [
        path("M12.9 9.2l-2.2 2.9c-.2.2 0 .5.3.5h1.3l-.5 2.3c-.1.4.4.6.7.3l2.4-3c.2-.3 0-.5-.3-.5h-1.3l.6-2.3c.1-.4-.4-.6-1-.2Z"),
      ]),
    ],
    sAnims: { bolt: POP(12.2, 12.5, 1.18) },
  },
};
