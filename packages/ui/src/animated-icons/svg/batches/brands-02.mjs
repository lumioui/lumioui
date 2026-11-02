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
/* scale-pop around a mark's own center (sAnims entry). */
const POP = (cx, cy, s = 1.24) => ({
  pivot: [cx, cy],
  anim: tn("scale", ["1", "1", `${s}`, "1", "1"], HOLD),
});
/* wiggle — rotate -a then +a around a pivot, with rest holds (gAnims). */
const WIG = (cx, cy, a = 9) =>
  tn("rotate", [`0 ${cx} ${cy}`, `0 ${cx} ${cy}`, `-${a} ${cx} ${cy}`, `${a - 2} ${cx} ${cy}`, `0 ${cx} ${cy}`], HOLD);
/* dip — translate out along an axis and spring back (gAnims). */
const DIP = (dx, dy) => tn("translate", ["0 0", "0 0", `${dx} ${dy}`, "0 0", "0 0"], HOLD);
/* nudge one part along an axis, then spring back (for A()). */
const SHIFT = (p, dx, dy) =>
  A(p, [tn("translate", ["0 0", "0 0", `${dx} ${dy}`, "0 0", "0 0"], HOLD)]);
/* blink — opacity dips once on a mark (for A()). */
const BLINK = (lo = 0.2) => [an("opacity", ["1", "1", `${lo}`, "1", "1"], [0, 0.32, 0.46, 0.6, 1])];
/* trace — the stroke writes itself on (checks, waveforms, signatures). */
const DRAW = (p, t0 = 0.15, t1 = 0.62) =>
  A({ ...p, a: { ...p.a, pathLength: 1, "stroke-dasharray": 1 } },
    [an("stroke-dashoffset", ["1", "1", "0", "0"], [0, t0, t1, 1])]);
/* staggered scale-pop for one cell in a cascade (sAnims entry). */
const POPAT = (cx, cy, t0, s = 1.18) => ({
  pivot: [cx, cy],
  anim: tn("scale", ["1", "1", `${s}`, "1", "1"], [0, t0, t0 + 0.18, t0 + 0.36, 1]),
});

/* brands/dev coverage slice — same voice as brands-01: silhouette as a
   single soft stroke path, one bespoke gesture per mark. */
export const icons = {
  /* ▲ deploy triangle — draws itself on */
  vercel: {
    auto: false,
    dur: 1.6,
    parts: [DRAW(path("M12 4.8 L20.1 19 H3.9 Z"), 0.12, 0.6)],
  },

  /* faceted diamond + inner mesh */
  netlify: {
    auto: false,
    dur: 1.8,
    parts: [
      path("M12 3.4 L20.2 11.6 L12 20.6 L3.8 11.6 Z"),
      G("mesh", [
        path("M12 8 L15.4 11.6 L12 15.2 L8.6 11.6 Z"),
        path("M12 3.4 V8 M12 15.2 V20.6 M3.8 11.6 H8.6 M15.4 11.6 H20.2"),
      ]),
    ],
    sAnims: { mesh: POP(12, 11.6, 1.14) },
  },

  /* flame + inner flamelet that flickers */
  firebase: {
    auto: false,
    dur: 1.7,
    parts: [
      G("flame", [
        path("M12.2 3.6 c.2 2.8-.8 4.6-2.1 6-1.4 1.4-2.6 3.1-2.6 5.3a4.9 4.9 0 0 0 9.8 0c0-1.7-.8-3.1-1.8-3.9-.1 1-.7 1.8-1.6 2 .4-3.3-.4-6.8-1.7-9.4z"),
      ]),
      G("inner", [
        path("M10.1 15c0-1.7 1-2.9 2-3.6 1 .8 1.7 2 1.7 3.4a1.9 1.9 0 0 1-3.7-.2z"),
      ]),
    ],
    gAnims: { flame: WIG(12, 18, 3) },
    sAnims: { inner: POP(12, 15, 1.2) },
  },

  /* bolt in two halves that charge apart */
  supabase: {
    auto: false,
    dur: 1.6,
    parts: [
      SHIFT(path("M14.4 3.8 L8.4 11.6 H12.9"), 0, -0.5),
      SHIFT(path("M9.6 20.2 L15.6 12.4 H11.1"), 0, 0.5),
    ],
  },

  /* whale hull + container stack that bobs */
  docker: {
    auto: false,
    dur: 1.9,
    parts: [
      G("boxes", [
        rect(6.6, 9.6, 2.7, 2.7, 0.5),
        rect(9.7, 9.6, 2.7, 2.7, 0.5),
        rect(12.8, 9.6, 2.7, 2.7, 0.5),
        rect(9.7, 6.5, 2.7, 2.7, 0.5),
        rect(12.8, 6.5, 2.7, 2.7, 0.5),
      ]),
      path("M3.3 15.7c-.3 3.1 2.7 5.3 6.9 5.3 4.8 0 8.8-2.3 10.2-5.9"),
      G("tail", [path("M19.9 15.3c.5-1.8 1.5-3.2 3-4-.1 1.4-.9 2.9-2.1 3.7")]),
      circle(6.2, 16.9, 0.55, fill()),
    ],
    gAnims: { boxes: DIP(0, -0.7), tail: WIG(20.4, 15.1, 8) },
  },

  /* helm wheel — turns a notch and settles */
  kubernetes: {
    auto: false,
    dur: 2.1,
    parts: [
      G("wheel", [
        circle(12, 12, 8.5),
        path("M12 8.5V3.5M14.8 9.7l3.8-2.9M15.5 12.8l4.7 1.1M13.6 15.2l2.1 4.4M10.4 15.2l-2.1 4.4M8.5 12.8l-4.7 1.1M9.2 9.7L5.4 6.8"),
        circle(12, 12, 1.4),
      ]),
    ],
    gAnims: { wheel: tn("rotate", ["0 12 12", "0 12 12", "51 12 12", "51 12 12", "0 12 12"], HOLD) },
  },

  /* two offset prisms that trade places */
  terraform: {
    auto: false,
    dur: 1.8,
    parts: [
      SHIFT(path("M9.8 3.6 L4.4 6.7 V14.7 L9.8 11.7 Z"), 0, 0.7),
      SHIFT(path("M14.2 9.3 L19.6 12 V20 L14.2 17 Z"), 0, -0.7),
    ],
  },

  /* wordmark + smile arrow that draws itself */
  "aws": { dur: 1.4, auto: true, parts: [
    circle(5.6, 10, 2.5),
    path("M8.1 7.5V12.5"),
    path("M10.6 7.5 12 12.5 13.4 9.5 14.8 12.5 16.2 7.5"),
    path("M21.2 8.4C20.4 7.6 18.2 7.7 18.2 9.2C18.2 10.8 21.4 10.3 21.4 11.8C21.4 13.2 19.1 13.3 18 12.3"),
    path("M3.5 16C8 19.6 15 19.6 19.5 16.4M16.8 16.2l2.9.2-.5 2.8"),
  ] },

  /* cloud ring + hollow core */
  "google-cloud": {
    auto: false,
    dur: 1.8,
    parts: [
      path("M7.2 18.4h8.3a4.2 4.2 0 0 0 .8-8.3 5.5 5.5 0 0 0-10.7 1.6 3.9 3.9 0 0 0 1.6 6.7z"),
      G("core", [circle(12.9, 11.4, 2.3)]),
    ],
    sAnims: { core: POP(12.9, 11.4, 1.22) },
  },

  /* angular A with extended right base — strokes draw on */
  azure: {
    auto: false,
    dur: 1.8,
    parts: [
      DRAW(path("M13.6 4.2 L6.4 19.6"), 0.1, 0.5),
      DRAW(path("M13.6 4.2 L18.4 15.2"), 0.3, 0.65),
      DRAW(path("M8.4 15.2 H19.6 L17 19.6"), 0.55, 0.9),
    ],
  },

  /* broken-ring swirl + inner arc */
  digitalocean: {
    auto: false,
    dur: 1.9,
    parts: [
      path("M12 3.6a8.4 8.4 0 1 0 8.4 8.4"),
      G("inner", [
        path("M16.6 12a4.6 4.6 0 0 1-4.6 4.6"),
        line(12, 16.6, 12, 14.2),
      ]),
    ],
    gAnims: { inner: tn("rotate", ["0 12 12", "0 12 12", "-28 12 12", "0 12 12"], HOLD) },
  },

  /* badge + fern stem whose branches sway */
  heroku: {
    auto: false,
    dur: 1.9,
    parts: [
      rect(5, 3.4, 14, 17.2, 3.4),
      path("M11.4 17.4V7.6"),
      G("fern", [
        path("M11.4 9.4c1.5-.9 2.9-1 4.3-.5"),
        path("M11.4 12.6c1.6-.9 3.2-1 4.7-.4"),
        path("M11.4 15.4c-1.2-.6-2.4-.6-3.5 0"),
      ]),
    ],
    gAnims: { fern: WIG(11.4, 8.6, 5) },
  },

  /* cloud + chasing arcs inside */
  cloudflare: {
    auto: false,
    dur: 2,
    parts: [
      path("M7 18.4h8.4a4.1 4.1 0 0 0 .8-8.1A5.4 5.4 0 0 0 5.7 11.9a3.8 3.8 0 0 0 1.3 6.5z"),
      G("swirl", [
        path("M8.9 14.9a3.1 3.1 0 0 1 4.5-2.7"),
        path("M15.1 14.1a3.1 3.1 0 0 1-2.7 3.6"),
      ]),
    ],
    gAnims: { swirl: tn("rotate", ["0 12 14", "0 12 14", "120 12 14", "120 12 14", "0 12 14"], HOLD) },
  },

  /* tux — whole body rocks on its feet, flippers stay still */
  linux: {
    auto: false,
    dur: 2.2,
    parts: [
      G("tux", [
        path("M12 3C9.6 3 8.3 4.9 8.3 7.5c0 1.6-.6 2.5-1.6 4.1C5.5 13.5 4.8 15.2 4.8 16.8c0 2.2 3 3.7 7.2 3.7s7.2-1.5 7.2-3.7c0-1.6-.7-3.3-1.9-5.2-1-1.6-1.6-2.5-1.6-4.1C15.7 4.9 14.4 3 12 3z"),
        circle(10.4, 7.3, 0.9, fill()),
        circle(13.6, 7.3, 0.9, fill()),
        path("M10.7 9.7c.4-.5.9-.7 1.3-.7s.9.2 1.3.7c-.4.8-.9 1.1-1.3 1.1s-.9-.3-1.3-1.1z", fill()),
        path("M6.9 11.9c-1.8 1.3-2.5 3.2-2 5.2"),
        path("M17.1 11.9c1.8 1.3 2.5 3.2 2 5.2"),
      ]),
    ],
    gAnims: { tux: tn("rotate", ["0 12 20.5", "-3.5 12 20.5", "3.5 12 20.5", "0 12 20.5"], [0, 0.3, 0.65, 1]) },
  },

  /* circle of friends — ring + three filled heads riding its rim */
  ubuntu: {
    auto: false,
    dur: 2,
    parts: [
      G("ring", [
        circle(12, 12, 6.7),
        circle(12, 3.6, 1.6, fill()),
        circle(19.3, 16.2, 1.6, fill()),
        circle(4.7, 16.2, 1.6, fill()),
      ]),
    ],
    gAnims: { ring: tn("rotate", ["0 12 12", "0 12 12", "30 12 12", "0 12 12"], HOLD) },
  },

  /* four-pane flag that swells like cloth */
  "windows": { dur: 1.4, auto: true, parts: [
    path("M3 5.6 10.6 4.5V11H3z"),
    path("M13 4.2 21 3V11H13z"),
    path("M3 13H10.6V19.5L3 18.4z"),
    path("M13 13H21V21L13 19.8z"),
  ] },

  /* globe + the fox's tail hugging the left arc, ear at top-right */
  firefox: {
    auto: false,
    dur: 1.9,
    parts: [
      circle(12, 13, 6.6),
      G("tail", [
        path("M4.6 17.4C3 13.6 3.6 8.9 6.9 5.9C10.2 2.9 15 2.8 18.3 5.4"),
        path("M18.3 5.4c.4-1 .5-2 .3-3"),
        path("M5.4 18.9c1.9 1.8 4.5 2.7 7.2 2.5"),
      ]),
    ],
    gAnims: { tail: tn("rotate", ["0 12 13", "0 12 13", "-8 12 13", "0 12 13"], HOLD) },
  },

  /* compass — needle overshoots north then settles */
  safari: {
    auto: false,
    dur: 1.8,
    parts: [
      circle(12, 12, 8.3),
      G("needle", [path("M14.9 9.1 L13.1 13.1 L9.1 14.9 L10.9 10.9 Z")]),
    ],
    gAnims: {
      needle: tn("rotate", ["0 12 12", "0 12 12", "150 12 12", "-20 12 12", "0 12 12"], [0, 0.22, 0.55, 0.78, 1]),
    },
  },

  /* e-wave — inner curl surges */
  edge: {
    auto: false,
    dur: 2,
    parts: [
      path("M19.8 12.5c0-5.2-3.6-8.7-8-8.7-4.3 0-7.7 3.6-7.7 8.3 0 4.8 3.7 8 7.9 7.9 3.2-.1 5.7-1.9 6.8-4.6"),
      G("curl", [path("M8.3 10.1c1.7-2.9 5-3.7 7.1-2.2 1.7 1.2 2.2 3.3 1.4 5")]),
    ],
    gAnims: { curl: tn("rotate", ["0 12 11", "0 12 11", "14 12 11", "0 12 11"], HOLD) },
  },

  /* O ring + drifting inner ellipse */
  opera: {
    auto: false,
    dur: 2,
    parts: [
      circle(12, 12, 8.3),
      SHIFT(ellipse(12.7, 12, 4.7, 6.9), 0.8, 0),
    ],
  },

  /* roundel + stripes that sweep diagonally */
  linear: {
    auto: false,
    dur: 1.7,
    parts: [
      circle(12, 12, 8.2),
      G("stripes", [
        line(5.6, 13.4, 13.4, 5.6),
        line(6.9, 16.4, 16.4, 6.9),
        line(9.6, 18.8, 18.8, 9.6),
      ]),
    ],
    gAnims: { stripes: tn("translate", ["0 0", "0 0", "0.8 -0.8", "0 0", "0 0"], HOLD) },
  },

  /* rounded badge + inner wireframe cube */
  codesandbox: {
    auto: false,
    dur: 1.8,
    parts: [
      rect(3.8, 3.8, 16.4, 16.4, 4.4),
      G("cube", [
        path("M12 7.6 L15.4 9.6 V13.6 L12 15.6 L8.6 13.6 V9.6 Z"),
        path("M12 7.6V11.6M8.6 9.6L12 11.6 15.4 9.6"),
      ]),
    ],
    sAnims: { cube: POP(12, 11.6, 1.15) },
  },

  /* shard hook + diamond chip that drops in */
  jira: {
    auto: false,
    dur: 1.8,
    parts: [
      path("M15.8 3.6 L8.7 10.7c-1.4 1.4-1.4 3.7 0 5.1l2.8 2.8"),
      A(path("M15.4 6.8 L18.5 9.9 L15.4 13 L12.3 9.9 Z"), [
        tn("translate", ["0 0", "0 -1.1", "0 0", "0 0"], [0, 0.35, 0.6, 1]),
      ]),
    ],
  },

  /* kanban cards that trade heights */
  trello: {
    auto: false,
    dur: 1.9,
    parts: [
      rect(3.4, 4.4, 17.2, 15.2, 3),
      A(rect(6.2, 7.4, 4.6, 9.6, 1.2), [
        an("height", ["9.6", "9.6", "5.6", "5.6", "9.6"], HOLD),
      ]),
      A(rect(13.4, 7.4, 4.6, 5.6, 1.2), [
        an("height", ["5.6", "5.6", "9.6", "9.6", "5.6"], HOLD),
      ]),
    ],
  },

  /* three dots cascade — the mark literally is filled circles */
  asana: {
    auto: false,
    dur: 1.6,
    parts: [
      G("d1", [circle(12, 6.7, 2.7, fill())]),
      G("d2", [circle(7.3, 15.8, 3.3, fill())]),
      G("d3", [circle(16.7, 15.8, 3.3, fill())]),
    ],
    sAnims: {
      d1: POPAT(12, 6.7, 0.1, 1.14),
      d2: POPAT(7.3, 15.8, 0.24, 1.14),
      d3: POPAT(16.7, 15.8, 0.38, 1.14),
    },
  },

  /* infinity loop — each lobe draws on */
  meta: {
    auto: false,
    dur: 2,
    parts: [
      DRAW(path("M12 12c-1.4-2.2-3-3.4-4.6-3.4-2.6 0-4 2-4 4.4 0 2.2 1.3 3.6 3.1 3.6 1.9 0 3.6-2.1 5.5-4.6z"), 0.1, 0.55),
      DRAW(path("M12 12c1.4 2.2 3 3.4 4.6 3.4 2.6 0 4-2 4-4.4 0-2.2-1.3-3.6-3.1-3.6-1.9 0-3.6 2.1-5.5 4.6z"), 0.35, 0.8),
    ],
  },

  /* blossom knot — the OpenAI mark, same weave as chat-gpt; steps a petal */
  openai: {
    auto: false,
    dur: 2.2,
    parts: [
      G("knot", [
        path("M11.64 15.12L6.48 12.12L6.48 7.2C6.48 4.08 8.64 2.16 11.52 2.16C12.96 2.16 14.28 2.88 15.12 3.96"),
        path("M9.12 13.25L9.13 7.28L13.39 4.82C16.1 3.26 18.84 4.18 20.28 6.66C21 7.91 21.04 9.42 20.52 10.68"),
        path("M9.48 10.13L14.65 7.16L18.91 9.62C21.62 11.18 22.2 14.02 20.76 16.5C20.04 17.75 18.76 18.54 17.4 18.72"),
        path("M12.36 8.88L17.52 11.88L17.52 16.8C17.52 19.92 15.36 21.84 12.48 21.84C11.04 21.84 9.72 21.12 8.88 20.04"),
        path("M14.88 10.75L14.87 16.72L10.61 19.18C7.9 20.74 5.16 19.82 3.72 17.34C3 16.09 2.96 14.58 3.48 13.32"),
        path("M14.52 13.87L9.35 16.84L5.09 14.38C2.38 12.82 1.8 9.98 3.24 7.5C3.96 6.25 5.24 5.46 6.6 5.28"),
      ]),
    ],
    gAnims: { knot: tn("rotate", ["0 12 12", "0 12 12", "60 12 12", "60 12 12", "0 12 12"], HOLD) },
  },

  /* sunburst fan — rays trace out one by one */
  anthropic: {
    auto: false,
    dur: 1.9,
    parts: [
      DRAW(path("M12 19 L3.2 12.7"), 0.08, 0.4),
      DRAW(path("M12 19 L7 9.3"), 0.18, 0.5),
      DRAW(path("M12 19 V8.2"), 0.28, 0.6),
      DRAW(path("M12 19 L17 9.3"), 0.38, 0.7),
      DRAW(path("M12 19 L20.8 12.7"), 0.48, 0.8),
    ],
  },

  /* circle + W that writes itself */
  wordpress: {
    auto: false,
    dur: 1.8,
    parts: [
      circle(12, 12, 8.4),
      DRAW(path("M7.8 8.6 L9.8 15.6 L12 9.4 L14.2 15.6 L16.2 8.6"), 0.15, 0.7),
    ],
  },

  /* shopping bag that sways on its handle */
  shopify: {
    auto: false,
    dur: 1.9,
    parts: [
      G("bag", [
        path("M7.6 8.4 L6.8 19c0 .8.6 1.4 1.4 1.4h7.6c.8 0 1.4-.6 1.4-1.4l-.8-10.6"),
        path("M9.6 8.4V7.2c0-2 .9-3.4 2.4-3.4s2.4 1.4 2.4 3.4v1.2"),
        path("M10.6 12.4c-.9-.4-1.8-.1-1.9.7 0 1.5 2.3 1.3 2.4 2.7.1 1.1-1.1 1.5-2.1 1.2"),
      ]),
    ],
    gAnims: { bag: WIG(12, 4.4, 4) },
  },

  /* W ribbon — signature stroke writes on */
  webflow: {
    auto: false,
    dur: 1.8,
    parts: [
      DRAW(path("M4.4 8.8c1.2 4.5 2.4 8 3.4 8.6 1.2.7 2.4-.6 3.2-3.6.6 2.6 1.6 4.2 3 3.5 1.2-.6 2.6-4.5 3.6-7.5.6-1.6 1.4-3 2.2-3.6"), 0.12, 0.72),
    ],
  },

  /* badge + D-V strokes */
  devto: {
    auto: false,
    dur: 1.7,
    parts: [
      rect(4.2, 3.6, 15.6, 16.8, 2.2),
      path("M7.6 8.8v6.4c2.4.4 3.8-.9 3.8-3.2s-1.4-3.6-3.8-3.2z"),
      DRAW(path("M13.6 8.8l1.7 6.4 1.7-6.4"), 0.2, 0.7),
    ],
  },

  /* circle + P that draws on */
  producthunt: {
    auto: false,
    dur: 1.7,
    parts: [
      circle(12, 12, 8.3),
      DRAW(path("M9.6 17V7.2h3.1c2.1 0 3.5 1.2 3.5 3s-1.4 3-3.5 3H9.6"), 0.15, 0.65),
    ],
  },

  /* badge + Y branches that fold in */
  hackernews: {
    auto: false,
    dur: 1.7,
    parts: [
      rect(3.8, 3.8, 16.4, 16.4, 3.4),
      DRAW(path("M8 7.6l4 4.2 4-4.2"), 0.15, 0.5),
      DRAW(path("M12 11.8v4.6"), 0.5, 0.75),
    ],
  },

  /* stacked slabs that slide in alternately */
  substack: {
    auto: false,
    dur: 1.7,
    parts: [
      A(line(5.4, 7.2, 18.6, 7.2), [
        tn("translate", ["-1.8 0", "0 0", "0 0"], [0, 0.4, 1]),
      ]),
      A(line(10.2, 12, 18.6, 12), [
        tn("translate", ["1.8 0", "0 0", "0 0"], [0, 0.55, 1]),
      ]),
      A(line(5.4, 16.8, 18.6, 16.8), [
        tn("translate", ["-1.8 0", "0 0", "0 0"], [0, 0.7, 1]),
      ]),
    ],
  },

  /* hex shell + center dot pop */
  hashnode: {
    auto: false,
    dur: 1.8,
    parts: [
      G("hex", [path("M12 3.4 L19.4 7.7 V16.3 L12 20.6 L4.6 16.3 V7.7 Z")]),
      G("dot", [circle(12, 12, 2.5)]),
    ],
    gAnims: { hex: tn("rotate", ["0 12 12", "0 12 12", "12 12 12", "0 12 12"], HOLD) },
    sAnims: { dot: POP(12, 12, 1.2) },
  },

  /* ghost blob that floats */
  ghost: {
    auto: false,
    dur: 2.1,
    parts: [
      G("body", [
        path("M5.6 20.2v-9.4c0-4.2 2.8-7 6.4-7s6.4 2.8 6.4 7v9.4l-2.4-1.7-1.9 1.7-2.1-1.5-2.1 1.5-1.9-1.7z"),
        circle(9.9, 9.8, 0.6, fill()),
        circle(14.1, 9.8, 0.6, fill()),
      ]),
    ],
    gAnims: { body: DIP(0, -1) },
  },

  /* pinwheel diamonds cascade */
  binance: {
    auto: false,
    dur: 1.9,
    parts: [
      G("c", [path("M12 9.6 L14.4 12 L12 14.4 L9.6 12 Z")]),
      G("nw", [path("M7.2 4.8 L8.4 6 L7.2 7.2 L6 6 Z")]),
      G("ne", [path("M16.8 4.8 L18 6 L16.8 7.2 L15.6 6 Z")]),
      G("sw", [path("M7.2 16.8 L8.4 18 L7.2 19.2 L6 18 Z")]),
      G("se", [path("M16.8 16.8 L18 18 L16.8 19.2 L15.6 18 Z")]),
    ],
    sAnims: {
      c: POPAT(12, 12, 0.08, 1.15),
      nw: POPAT(7.2, 6, 0.2, 1.2),
      ne: POPAT(16.8, 6, 0.32, 1.2),
      se: POPAT(16.8, 18, 0.44, 1.2),
      sw: POPAT(7.2, 18, 0.56, 1.2),
    },
  },

  /* chat bubble + bolt that strikes */
  messenger: {
    auto: false,
    dur: 1.8,
    parts: [
      path("M12 3.8c4.6 0 8.2 3.4 8.2 7.6s-3.6 7.6-8.2 7.6c-1 0-1.9-.1-2.8-.4l-3.4 1.7c-.5.2-1-.3-.9-.8l1-3.1c-1.5-1.4-2.3-3.2-2.3-5.2 0-4.2 3.8-7.4 8.4-7.4z"),
      DRAW(path("M12.8 8.2 L9.8 12.4 H12 L11.4 15.6 L14.6 11.2 H12.4 Z"), 0.2, 0.6),
    ],
  },

  /* camera bubble — lens nudges */
  zoom: {
    auto: false,
    dur: 1.8,
    parts: [
      circle(12, 12, 8.4),
      G("cam", [
        rect(7.2, 9.6, 6.6, 4.9, 1.5),
        path("M13.8 10.8 L17.2 8.9 V15.1 L13.8 13.2 Z"),
      ]),
    ],
    sAnims: { cam: POP(12, 12, 1.12) },
  },

  /* four-point sparkle — swells then settles */
  gemini: {
    auto: false,
    dur: 1.9,
    parts: [
      G("star", [
        path("M12 2.6c1.1 5.6 3.8 8.3 9.4 9.4-5.6 1.1-8.3 3.8-9.4 9.4-1.1-5.6-3.8-8.3-9.4-9.4 5.6-1.1 8.3-3.8 9.4-9.4z"),
      ]),
    ],
    sAnims: { star: POP(12, 12, 1.14) },
  },

  /* four-square pinwheel — steps a quarter turn */
  pnpm: {
    auto: false,
    dur: 2,
    parts: [
      G("pin", [
        rect(4.4, 4.4, 6.4, 6.4, 1.6),
        rect(13.2, 4.4, 6.4, 6.4, 1.6),
        rect(4.4, 13.2, 6.4, 6.4, 1.6),
        rect(13.2, 13.2, 6.4, 6.4, 1.6),
      ]),
    ],
    gAnims: { pin: tn("rotate", ["0 12 12", "0 12 12", "90 12 12", "90 12 12", "0 12 12"], HOLD) },
  },

  /* boxed blocky "npm" letters — they write on */
  npm: {
    auto: false,
    dur: 2,
    parts: [
      rect(3.4, 5.4, 17.2, 13.2, 1.6),
      G("n", [
        DRAW(path("M6.8 15.6V10h2.2v5.6"), 0.1, 0.4),
        DRAW(path("M11 15.6V10h2.4v2.8H11"), 0.3, 0.6),
        DRAW(path("M15.4 15.6V10l1.2 2 1.2-2v5.6"), 0.5, 0.8),
      ]),
    ],
  },
};
