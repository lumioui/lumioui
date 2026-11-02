/* buildings-01 — 46 glyphs. Soft blob silhouettes, stroke-2, one accent each. */

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

const f = (n) => +n.toFixed(1);

/* Rounded fan blade: leaf from hub edge out to `len`, `w` half-width at
 * mid-blade, softly capped tip. */
const blade = (cx, cy, deg, len, w) => {
  const r = (deg * Math.PI) / 180;
  const ux = Math.cos(r), uy = Math.sin(r);
  const px = -uy, py = ux;
  const bx = cx + ux * 1.8, by = cy + uy * 1.8;
  const tx = cx + ux * len, ty = cy + uy * len;
  const s1x = cx + ux * len * 0.55 + px * w, s1y = cy + uy * len * 0.55 + py * w;
  const s2x = cx + ux * len * 0.55 - px * w, s2y = cy + uy * len * 0.55 - py * w;
  const cLx = tx - ux * 1.2 + px * 1.0, cLy = ty - uy * 1.2 + py * 1.0;
  const cRx = tx - ux * 1.2 - px * 1.0, cRy = ty - uy * 1.2 - py * 1.0;
  return `M${f(bx)} ${f(by)}C${f(s1x)} ${f(s1y)} ${f(cLx)} ${f(cLy)} ${f(tx)} ${f(ty)}C${f(cRx)} ${f(cRy)} ${f(s2x)} ${f(s2y)} ${f(bx)} ${f(by)}Z`;
};


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
/* wiggle — rotate −a then +a around a pivot, with rest holds (gAnims). */
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

const flick = (s = 0.32, lo = 0.35) =>
  [an("opacity", ["1", "1", String(lo), "1", "1"], [0, s, s + 0.12, s + 0.3, 1])];

const rock = (cx, cy, a = 3) =>
  tn("rotate", [`0 ${cx} ${cy}`, `${-a} ${cx} ${cy}`, `${a * 0.8} ${cx} ${cy}`, `0 ${cx} ${cy}`], [0, 0.3, 0.62, 1]);

export const icons = {
  "apartment": {
    dur: 1.7,
    auto: false,
    parts: [
      path("M3.6 20.8V6.6c0-2 1.6-3.6 3.6-3.6h2.4c2 0 3.6 1.6 3.6 3.6V9h2.9c1.8 0 3.3 1.5 3.3 3.3v8.5z"),
      A(path("M6 6.8h1.6M9.6 6.8h1.6M6 10.8h1.6M9.6 10.8h1.6M15.4 12.9h1.7M15.4 16.4h1.7"), flick()),
      path("M8.1 20.8v-2.7c0-1 .8-1.8 1.8-1.8h.4c1 0 1.8.8 1.8 1.8v2.7"),
    ],
  },

  "blinds": {
    dur: 1.65,
    auto: false,
    parts: [
      path("M6.2 3.2h11.6c1.7 0 3 1.3 3 3v11.6c0 1.7-1.3 3-3 3H6.2c-1.7 0-3-1.3-3-3V6.2c0-1.7 1.3-3 3-3z"),
      line(3.6, 7.6, 20.4, 7.6),
      line(3.6, 11.4, 20.4, 11.4),
      /* pull-cord: cord stretches, knob dips, both ease back */
      A(line(15.5, 11.4, 15.5, 15), [
        an("y2", ["15", "15", "16.4", "15", "15"], [0, 0.2, 0.4, 0.62, 1]),
      ]),
      A(circle(15.5, 16.8, 1.7), [
        an("cy", ["16.8", "16.8", "18.1", "16.8", "16.8"], [0, 0.2, 0.4, 0.62, 1]),
      ]),
    ],
  },

  "brick-wall": {
    dur: 1.85,
    auto: false,
    parts: [
      path("M5.4 3.5h13.2c1.6 0 2.9 1.3 2.9 2.9v11.2c0 1.6-1.3 2.9-2.9 2.9H5.4c-1.6 0-2.9-1.3-2.9-2.9V6.4c0-1.6 1.3-2.9 2.9-2.9z"),
      /* courses lay themselves: mortar lines draw staggered */
      A(line(2.5, 9, 21.5, 9, { pathLength: 1, "stroke-dasharray": 1 }), [
        an("stroke-dashoffset", ["1", "1", "0", "0"], [0, 0.08, 0.42, 1]),
      ]),
      A(line(2.5, 15, 21.5, 15, { pathLength: 1, "stroke-dasharray": 1 }), [
        an("stroke-dashoffset", ["1", "1", "0", "0"], [0, 0.2, 0.55, 1]),
      ]),
      A(path("M8.3 3.6V9M15.7 3.6V9M12 9v6M8.3 15v5.4M15.7 15v5.4", { pathLength: 1, "stroke-dasharray": 1 }), [
        an("stroke-dashoffset", ["1", "1", "0", "0"], [0, 0.32, 0.68, 1]),
      ]),
    ],
  },

  "brick-wall-fire": {
    dur: 1.6,
    auto: false,
    parts: [
      path("M9 20.5H5.4c-1.6 0-2.9-1.3-2.9-2.9V6.4c0-1.6 1.3-2.9 2.9-2.9h8.2c1.6 0 2.9 1.3 2.9 2.9v2.1"),
      path("M2.5 9.4h9.7M2.5 14.4h7.9M7.8 3.6v5.8M12.4 9.4v5M7.8 14.4v6.1"),
      G("flame", [
        path("M16.8 21.5c2.6 0 4.6-2 4.6-4.6 0-2.7-2.2-4.1-3.1-6.3-.4 1-1.1 1.7-2 2.3-1.3 1-3.1 2.1-3.1 4 0 2.6 1 4.6 3.6 4.6z"),
      ]),
    ],
    /* flame dances: breathes taller with a sway */
    sAnims: {
      flame: {
        pivot: [17, 21],
        anim: tn("scale", ["1", "1.1", "0.96", "1"], [0, 0.3, 0.65, 1]),
        extra: tn("rotate", ["0 17 21", "3 17 21", "-2.5 17 21", "0 17 21"], [0, 0.3, 0.65, 1]),
      },
    },
  },

  "brick-wall-shield": {
    dur: 1.7,
    auto: false,
    parts: [
      path("M9 20.5H5.4c-1.6 0-2.9-1.3-2.9-2.9V6.4c0-1.6 1.3-2.9 2.9-2.9h8.2c1.6 0 2.9 1.3 2.9 2.9v1.7"),
      path("M2.5 9.4h9.7M2.5 14.4h7.9M7.8 3.6v5.8M12.4 9.4v5M7.8 14.4v6.1"),
      G("guard", [
        path("M17.5 21.3c-2.5-.8-4-2.7-4.2-5.1-.1-1.2-.1-2.6 0-3.2 1.4-.6 2.7-1 4.2-1s2.8.4 4.2 1c.1.6.1 2 0 3.2-.2 2.4-1.7 4.3-4.2 5.1z"),
      ]),
    ],
    /* shield thumps once — protection asserting */
    sAnims: { guard: { pivot: [17.5, 17], anim: tn("scale", ["1", "1.11", "1", "1"], [0, 0.24, 0.5, 1]) } },
  },

  "bulb": {
    dur: 1.55,
    auto: false,
    parts: [
      path("M17.4 15.6c1.4-1.5 2.1-3.3 2.1-5.3a7.5 7.5 0 1 0-15 0c0 2 .7 3.8 2.1 5.3"),
      /* filament warms on with a double flicker */
      A(path("M10.8 12.4l1.2 1.9 1.2-1.9"), [
        an("opacity", ["1", "0.3", "1", "0.45", "1", "1"], [0, 0.18, 0.3, 0.42, 0.56, 1]),
      ]),
      line(8.7, 19, 15.3, 19),
      line(10.3, 21.6, 13.7, 21.6),
    ],
  },

  "bulb-charging": {
    dur: 1.5,
    auto: false,
    parts: [
      path("M17.4 15.6c1.4-1.5 2.1-3.3 2.1-5.3a7.5 7.5 0 1 0-15 0c0 2 .7 3.8 2.1 5.3"),
      /* the charge bolt snaps twice */
      A(path("M12.9 7.4l-2 3h2.2l-2 3"), [
        an("opacity", ["1", "0.25", "1", "0.25", "1", "1"], [0, 0.15, 0.3, 0.45, 0.6, 1]),
      ]),
      line(8.7, 19, 15.3, 19),
      line(10.3, 21.6, 13.7, 21.6),
    ],
  },

  "cabinet01": {
    dur: 1.7,
    auto: false,
    parts: [
      path("M5.4 3.5h13.2c1.6 0 2.9 1.3 2.9 2.9v7.6c0 1.6-1.3 2.9-2.9 2.9H5.4c-1.6 0-2.9-1.3-2.9-2.9V6.4c0-1.6 1.3-2.9 2.9-2.9z"),
      line(2.5, 13.4, 21.5, 13.4),
      line(12, 3.5, 12, 13.4),
      path("M6.4 16.9 5.4 20.8M17.6 16.9l1 3.9"),
      /* knob ticks glint */
      A(path("M8.8 9.2v1.4M15.2 9.2v1.4"), flick(0.35, 0.3)),
    ],
  },

  "cabinet02": {
    dur: 1.7,
    auto: false,
    parts: [
      path("M3.4 4.2h17.2l-.4 5.7c-.2 3.2-.3 4.6-1.1 5.5-.8 1-2.2 1-4.9 1H9.8c-2.7 0-4.1 0-4.9-1-.8-.9-.9-2.3-1.1-5.5L3.4 4.2z"),
      line(2.5, 4.2, 21.5, 4.2),
      line(12, 4.2, 12, 16.4),
      path("M6.8 16.4 5.5 20.2M17.2 16.4l1.3 3.8"),
      A(path("M9 10.3v.01M15 10.3v.01"), flick(0.45, 0.3)),
    ],
  },

  "cabinet03": {
    dur: 1.7,
    auto: false,
    parts: [
      line(2.5, 3.8, 21.5, 3.8),
      path("M4.2 3.8v9.2c0 1.9 1.5 3.4 3.4 3.4h8.8c1.9 0 3.4-1.5 3.4-3.4V3.8"),
      line(4.2, 10.2, 19.8, 10.2),
      /* drawer pulls glint top then bottom */
      A(path("M10.1 6.9c.5.4 1.2.6 1.9.6s1.4-.2 1.9-.6"), flick(0.28, 0.3)),
      A(path("M10.1 13.3c.5.4 1.2.6 1.9.6s1.4-.2 1.9-.6"), flick(0.52, 0.3)),
      path("M6.2 16.4v3.7M17.8 16.4v3.7"),
    ],
  },

  "cabinet04": { dur: 1.4, auto: true, parts: [
    rect(3, 5.5, 18, 11.5, 2.4),
    path("M9 5.5V17M15 5.5V17"),
    path("M6 11.2h.01M12 11.2h.01M18 11.2h.01"),
    path("M6 17v3M18 17v3"),
  ] },

  "castle": {
    dur: 1.7,
    auto: false,
    parts: [
      path("M8.2 4.6h7.6c.5 0 .9.4.9.9v1.3c0 .5-.4.9-.9.9H8.2c-.5 0-.9-.4-.9-.9V5.5c0-.5.4-.9.9-.9z"),
      path("M8.4 4.6V2.9M12 4.6V2.9M15.6 4.6V2.9"),
      path("M8.3 7.5 6.1 20.8h11.8L15.7 7.5"),
      /* crenellated curtain walls — fortress silhouette, not a lone silo */
      path("M2.4 20.8v-4.6h1.1v-1.1h1.1v1.1h1.3v4.6M17 20.8v-4.6h1.3v-1.1h1.1v1.1h1.1v4.6"),
      /* torchlit doorway breathes */
      A(path("M10.1 20.8v-2.5c0-1.1.9-2 2-2s1.9.9 1.9 2v2.5"), flick(0.4, 0.45)),
      line(2.4, 20.8, 21.6, 20.8),
    ],
  },

  "castle01": {
    dur: 1.7,
    auto: false,
    parts: [
      path("M7.7 6h8.6c.5 0 .9.4.9.9v1.1c0 .5-.4.9-.9.9H7.7c-.5 0-.9-.4-.9-.9V6.9c0-.5.4-.9.9-.9z"),
      path("M8.2 6V4.3M12 6V4.1M15.8 6V4.3"),
      path("M7.9 8.9l-1.7 11.9h11.6L16.1 8.9"),
      A(path("M10.1 20.8v-2.4c0-1.1.9-2 1.9-2s1.9.9 1.9 2v2.4"), flick(0.4, 0.45)),
      path("M9.2 12.4h1.3M13.5 12.4h1.3"),
      line(4.4, 20.8, 19.6, 20.8),
    ],
  },

  "castle02": { dur: 1.4, auto: true, parts: [
    path("M7 20.5V6.5h3v2h4v-2h3v14"),
    path("M10.2 20.5v-4a1.8 1.8 0 0 1 3.6 0v4"),
    path("M4.5 20.5h15"),
  ] },

  "chair-barber": {
    dur: 1.6,
    auto: false,
    parts: [
      G("rock", [
        path("M15.7 14.8H8.2c-1.1 0-1.9-.9-1.9-1.9 0-1 .8-1.9 1.9-1.9 4.5.2 7 1.1 8 1.6.4.2.6.6.6 1 0 .6-.5 1.2-1.1 1.2z"),
        path("M16.8 13.9l3.6-10c.2-.6-.1-1.2-.7-1.4-1.6-.4-3.2.2-3.8 1.6-.6 1.6-1.2 4.1-1.2 7.8"),
        path("M6.3 12.9v3c0 .9 0 1.4-.2 1.7-.2.5-.6.8-1 1-.4.2-.9.2-1.8.2"),
        line(12, 14.8, 12, 20.8),
        line(10, 20.8, 14, 20.8),
      ]),
    ],
    /* barber chair reclines slightly off its pump post */
    gAnims: { rock: rock(12, 20.8, 3) },
  },

  "chair01": {
    dur: 1.6,
    auto: false,
    parts: [
      G("rock", [
        path("M7.3 11.9l.6-6.3c.2-1.7.3-2.5.8-3 .5-.5 1.3-.6 2.9-.6h.8c1.6 0 2.4.1 2.9.6.5.5.6 1.3.8 3l.6 6.3"),
        path("M12 11c-1.4 0-2.9.3-4.1.7-.9.3-1.6 1.5-1.5 2.6 0 .4.3.6.7.6h9.8c.4 0 .7-.2.7-.6.1-1.1-.6-2.3-1.5-2.6-1.2-.4-2.7-.7-4.1-.7z"),
        path("M8.2 14.9 6.4 21.3M15.8 14.9l1.8 6.4"),
      ]),
    ],
    gAnims: { rock: rock(12, 21.3, 3) },
  },

  "chair02": {
    dur: 1.6,
    auto: false,
    parts: [
      G("rock", [
        path("M7.2 11.9l-.4-3.6c-.3-2.5-.4-3.7.1-4.6C7.8 2.2 9.9 2.1 12 2.1s4.2.1 5.1 1.6c.5.9.4 2.1.1 4.6l-.4 3.6"),
        path("M12 11c-1.4 0-2.9.3-4.1.7-.9.3-1.6 1.5-1.5 2.6 0 .4.3.6.7.6h9.8c.4 0 .7-.2.7-.6.1-1.1-.6-2.3-1.5-2.6-1.2-.4-2.7-.7-4.1-.7z"),
        path("M7.4 14.9v6.4M16.6 14.9v6.4"),
        line(7.4, 18, 16.6, 18),
      ]),
    ],
    gAnims: { rock: rock(12, 21.3, 3) },
  },

  "chair03": {
    dur: 1.6,
    auto: false,
    parts: [
      G("rock", [
        path("M12 2.6c-1.4 0-2.9.3-4.1.6-.9.3-1.6 1.5-1.5 2.6 0 .4.3.6.7.6h9.8c.4 0 .7-.2.7-.6.1-1.1-.6-2.3-1.5-2.6-1.2-.3-2.7-.6-4.1-.6z"),
        path("M7.7 6.4 6.2 21.4M16.3 6.4l1.5 15"),
        path("M7.3 11.5h9.4M6.9 15h10.2"),
      ]),
    ],
    /* ladderback tilt — a touch livelier */
    gAnims: { rock: rock(12, 21.4, 3.5) },
  },

  "chair04": {
    dur: 1.6,
    auto: false,
    parts: [
      G("rock", [
        path("M5.4 2.9c1.9.5 4.2.8 6.6.8s4.7-.3 6.6-.8"),
        path("M5.9 13.6c1.7.5 3.9.8 6.1.8s4.4-.3 6.1-.8"),
        path("M12 13.9V3.9M8.1 13.6 7.5 3.5M15.9 13.6l.6-10.1"),
        path("M7.9 14 6.3 21.4M16.1 14l1.6 7.4"),
        line(7.1, 18, 16.9, 18),
      ]),
    ],
    gAnims: { rock: rock(12, 21.4, 3) },
  },

  "chair05": {
    dur: 1.6,
    auto: false,
    parts: [
      G("rock", [
        path("M15.9 13.9C17.1 12.3 18 10.3 18 8.4 18 4.4 15.3 2.1 12 2.1S6 4.4 6 8.4c0 1.9.9 3.9 2.1 5.5"),
        path("M12 12.8c-1.4 0-2.9.3-4.1.6-.9.3-1.6 1.5-1.5 2.6 0 .4.3.6.7.6h9.8c.4 0 .7-.2.7-.6.1-1.1-.6-2.3-1.5-2.6-1.2-.3-2.7-.6-4.1-.6z"),
        path("M13.7 2.8c.2 1 .3 2.1.3 3.3 0 2.2-.3 4.5-.8 6.4"),
        path("M8.3 16.5 7.2 21.3M15.7 16.5l1.1 4.8"),
      ]),
    ],
    /* bistro chair — round back tips a touch further */
    gAnims: { rock: rock(12, 21.3, 3.5) },
  },

  "city01": {
    dur: 1.7,
    auto: false,
    parts: [
      path("M7.2 21V10.6c0-1.5.5-2 2-2h3.6c1.5 0 2 .5 2 2V21"),
      path("M20.5 21V8.8c0-1.2 0-1.8-.3-2.2-.2-.4-.7-.7-1.7-1.1l-3.3-1.7c-.6-.3-1.2-.1-1.2.7v3.6"),
      path("M3.2 21v-7.5c0-.8.2-1 1-1h3"),
      line(2.6, 21, 21.4, 21),
      A(path("M9.6 12.4h1.8M9.6 15.4h1.8M9.6 18.4h1.8"), flick(0.4)),
    ],
  },

  "city02": {
    dur: 1.7,
    auto: false,
    parts: [
      path("M9.4 21V6.2c0-1.4.6-1.9 1.9-1.9h1.4c1.3 0 1.9.5 1.9 1.9V21"),
      path("M4.2 21v-6.3c0-1.2.5-1.7 1.7-1.7h3.5"),
      path("M19.8 21v-6.3c0-1.2-.5-1.7-1.7-1.7h-3.5"),
      line(12, 4.3, 12, 2.8),
      line(2.8, 21, 21.2, 21),
      A(path("M10.8 8.4h2.4M10.8 11.9h2.4M10.8 15.4h2.4"), flick(0.25)),
      line(12, 21, 12, 18.4),
    ],
  },

  "city03": {
    dur: 1.75,
    auto: false,
    parts: [
      path("M5 21V5.4c0-1.5.6-2.1 2.1-2.1h3.8c1.5 0 2.1.6 2.1 2.1V21"),
      path("M13.4 21v-3.8c0-.9.2-1.4.5-1.8.3-.3.7-.6 1.6-1l.6-.3c.8-.4 1.2-.5 1.6-.5s.8.1 1.6.5l.6.3c.9.4 1.3.7 1.6 1 .3.4.5.9.5 1.8V21"),
      line(2.6, 21, 21.4, 21),
      A(path("M7.3 7.4h1.8M7.3 10.9h1.8M7.3 14.4h1.8"), flick(0.5)),
      line(17.4, 21, 17.4, 18.7),
    ],
  },

  "construction": {
    dur: 1.5,
    auto: false,
    parts: [
      rect(2.8, 6.5, 18.4, 8, 2.4),
      /* caution stripes strobe */
      A(path("M7.2 14.5l3.4-8M12 14.5l3.4-8M16.8 14.5l3.4-8"), flick(0.25, 0.25)),
      path("M6.6 3.3v3.2M6.6 14.5v6.2M17.4 3.3v3.2M17.4 14.5v6.2"),
    ],
  },

    "crane": { dur: 1.8,
    auto: false,
    parts: [
    circle(4.6, 17.6, 2.3),
    circle(13.7, 17.6, 2.3),
    line(3, 15, 16, 15),
    path("M7.3 15L7.3 8.9C7.3 7.5 8.4 6.4 9.8 6.4L10.3 6.4C11.7 6.4 12.8 7.5 12.8 8.9L12.8 15"),
    path("M12.6 7.4L20 4.4"),
    G("hook", [
      line(20.1, 4.7, 20.1, 11),
      circle(20.1, 12.9, 1.9),
    ]),
  ],
    gAnims: { hook: tn("rotate", ["0 20.1 4.7", "5 20.1 4.7", "-3.5 20.1 4.7", "0 20.1 4.7"], [0, 0.3, 0.65, 1]) } },

  "crane-tower": {
    dur: 1.8,
    auto: false,
    parts: [
      path("M6.8 21.3V4.4c0-.9.7-1.7 1.7-1.7s1.7.8 1.7 1.7v16.9"),
      path("M10.2 5.2l10 1.8c.5.1.8.5.8 1v.4c0 .5-.4.9-.9.9h-9.9"),
      path("M6.8 5.2 3.7 7.5c-.3.2-.5.5-.5.9v.1c0 .5.4.9.9.9h2.7"),
      /* hook block swings off the jib tip */
      G("hook", [
        line(19.7, 9.4, 19.7, 14.7),
        circle(19.7, 16.6, 1.8),
      ]),
      line(4.2, 21.3, 13, 21.3),
    ],
    gAnims: { hook: tn("rotate", ["0 19.7 9.4", "4.5 19.7 9.4", "-3.5 19.7 9.4", "0 19.7 9.4"], [0, 0.3, 0.65, 1]) },
  },

  "curtains": {
    dur: 1.9,
    auto: false,
    parts: [
      line(2.5, 3.5, 21.5, 3.5),
      /* panels billow outward off the rail, alternately */
      G("lft", [
        path("M4.2 3.5V15c0 1.8.1 2.7.5 3.5.4 1 1.3 1.7 2.3 2 .4.1.8.1 1.5.1.1-1.5-.4-4.6-1.8-6.6 2.6-2 4.3-6.4 4.3-10.5"),
      ]),
      G("rgt", [
        path("M19.8 3.5V15c0 1.8-.1 2.7-.5 3.5-.4 1-1.3 1.7-2.3 2-.4.1-.8.1-1.5.1-.1-1.5.4-4.6 1.8-6.6-2.6-2-4.3-6.4-4.3-10.5"),
      ]),
      A(path("M5 13.9c.6-.7 1.7-2.6 1.9-4.9"), [
        tn("rotate", ["0 4.2 3.5", "-2.6 4.2 3.5", "1.8 4.2 3.5", "0 4.2 3.5"], [0, 0.3, 0.65, 1]),
      ]),
      A(path("M19 13.9c-.6-.7-1.7-2.6-1.9-4.9"), [
        tn("rotate", ["0 19.8 3.5", "2.6 19.8 3.5", "-1.8 19.8 3.5", "0 19.8 3.5"], [0, 0.42, 0.75, 1]),
      ]),
    ],
    gAnims: {
      lft: tn("rotate", ["0 4.2 3.5", "-2.6 4.2 3.5", "1.8 4.2 3.5", "0 4.2 3.5"], [0, 0.3, 0.65, 1]),
      rgt: tn("rotate", ["0 19.8 3.5", "2.6 19.8 3.5", "-1.8 19.8 3.5", "0 19.8 3.5"], [0, 0.42, 0.75, 1]),
    },
  },

  "desk": {
    dur: 1.6,
    auto: false,
    parts: [
      line(2.8, 8.5, 21.2, 8.5),
      path("M4.2 8.5v3.7c0 1.8 1.4 3.2 3.2 3.2h9.2c1.8 0 3.2-1.4 3.2-3.2V8.5"),
      path("M6.4 15.4v5.2M17.6 15.4v5.2"),
      /* the riser on the desktop bobs once — a laptop waking */
      A(path("M8.5 8.5V5.6c0-.8.6-1.4 1.4-1.4h4.2c.8 0 1.4.6 1.4 1.4v2.9"), [
        tn("translate", ["0 0", "0 -0.9", "0 -0.9", "0 0"], [0, 0.28, 0.6, 1]),
      ]),
    ],
  },

  "desk01": {
    dur: 1.65,
    auto: false,
    parts: [
      line(2.8, 4.3, 21.2, 4.3),
      line(3.5, 8.3, 20.5, 8.3),
      /* drawer slides out and back */
      G("drawer", [
        path("M14.2 8.3v8.2c0 1 .8 1.8 1.8 1.8h1.4c1 0 1.8-.8 1.8-1.8V8.3"),
        line(14.2, 12, 19.2, 12),
      ]),
      path("M4.2 4.3v16.2M19.8 4.3v4"),
    ],
    gAnims: { drawer: tn("translate", ["0 0", "1.5 0", "1.5 0", "0 0"], [0, 0.3, 0.62, 1]) },
  },

  "desk02": {
    dur: 1.65,
    auto: false,
    parts: [
      line(2.8, 4.3, 21.2, 4.3),
      line(3.5, 8.3, 20.5, 8.3),
      G("drawer", [
        path("M14.5 8.3v4.6c0 1 .8 1.8 1.8 1.8h1.5c1 0 1.8-.8 1.8-1.8V8.3"),
        line(14.5, 11, 19.6, 11),
      ]),
      path("M4.2 4.3v16.2M19.8 4.3v16.2"),
    ],
    gAnims: { drawer: tn("translate", ["0 0", "1.4 0", "1.4 0", "0 0"], [0, 0.3, 0.62, 1]) },
  },

  "factory": {
    auto: false,
    dur: 1.7,
    parts: [
      path("M4 8.8c0-1 .8-1.8 1.8-1.8h.4V5.4c0-.6.5-1.1 1.1-1.1h1.2c.6 0 1.1.5 1.1 1.1V7h1.6c1 0 1.8.8 1.8 1.8v1.4l3.2-1.9c.6-.4 1.4 0 1.4.7v1.1l2.8-1.6c.5-.3 1.1.1 1.1.7v9.4c0 1-.8 1.8-1.8 1.8H5.8c-1 0-1.8-.8-1.8-1.8V8.8z"),
      path("M9.6 20.4v-2.7c0-.9.7-1.6 1.6-1.6h.6c.9 0 1.6.7 1.6 1.6v2.7"),
      A(path("M15.4 13.5h1.7"), BLINK(0.25)),
    ],
  },

  "factory01": {
    auto: false,
    dur: 1.9,
    parts: [
      path("M4.4 20.5c1.3-2.7 2.1-6.3 2.1-11.8h6.2c0 5.5.8 9.1 2.1 11.8"),
      path("M13.2 12.8h2.7c.1 1.6.3 4.4 3.3 7.7"),
      SHIFT(path("M11.8 5.4c.9-1.4 2.2-1.4 3.1 0 .6.8 1.4.9 2.1 0 .9-1.4 2.2-1.4 3.1 0"), 0.6, -1.2),
      line(3, 20.5, 21, 20.5),
    ],
  },

  "factory02": {
    auto: false,
    dur: 1.7,
    parts: [
      path("M3.2 20.4 5 5.4c.1-.9.6-1.4 1.5-1.4h.3c.9 0 1.4.5 1.5 1.4l1.8 15"),
      path("M4.9 7h3.5"),
      path("M9.8 20.4v-9l3.9-2.8c.5-.4 1.2 0 1.2.6v2.2l4-2.9c.5-.4 1.2 0 1.2.6v10.3c0 .8-.6 1.4-1.4 1.4H9.8z"),
      A(path("M12.8 15.4h1.7M17 15.4h1.7"), BLINK(0.3)),
    ],
  },

    "fan01": { dur: 1.4, auto: true, parts: [
      circle(12, 10, 7.5),
      path("M12 10C10.2 7 10.8 5 12 4M12 10c3 .2 4.5 1.8 4.5 3M12 10c-2.5 1.8-4.5 1.5-5.5.5"),
      path("M12 17.5v3M8.5 20.5h7"),
    ] },

    "fan02": { dur: 2,
    pp: false,
    auto: false,
    parts: [
    G("spin", [
      path("M13.76 13.76C12.68 18.08 16.05 17.94 18.08 18.08C17.94 16.05 18.08 12.68 13.76 13.76Z"),
      path("M10.25 13.76C5.93 12.68 6.06 16.05 5.93 18.08C7.95 17.94 11.33 18.08 10.25 13.76Z"),
      path("M10.25 10.25C11.33 5.93 7.95 6.06 5.93 5.93C6.06 7.95 5.93 11.33 10.25 10.25Z"),
      path("M13.76 10.25C18.08 11.33 17.94 7.95 18.08 5.93C16.05 6.06 12.68 5.93 13.76 10.25Z"),
      circle(12, 12, 3.51),
    ]),
  ],
    gAnims: { spin: tn("rotate", ["0 12 12", "360 12 12", "0 12 12"], [0, 0.97, 1]) } },

  "fence": { dur: 1.4, auto: true, parts: [
    path("M4 21V8l2-2.5L8 8v13M11 21V8l2-2.5L15 8v13M18 21V8l2-2.5"),
    path("M2.5 13h19"),
  ] },

  "floor-plan": {
    auto: false,
    dur: 1.7,
    parts: [
      path("M6.8 3.5h10.4c1.8 0 3.3 1.5 3.3 3.3v10.4c0 1.8-1.5 3.3-3.3 3.3H6.8c-1.8 0-3.3-1.5-3.3-3.3V6.8c0-1.8 1.5-3.3 3.3-3.3z"),
      path("M3.5 9.7h6.3M9.8 6.7V3.5M9.8 9.7v10.8M17.9 9.7h2.6"),
      G("door", [path("M17.2 17.4c-1.9 0-3.5 1.6-3.5 3.1")]),
    ],
    gAnims: { door: WIG(17.2, 17.4, 14) },
  },

  "frame": {
    auto: false,
    dur: 1.6,
    parts: [
      SHIFT(line(2.8, 6.3, 21.2, 6.3), 0, 0.9),
      SHIFT(line(2.8, 17.7, 21.2, 17.7), 0, -0.9),
      SHIFT(line(6.3, 2.8, 6.3, 21.2), 0.9, 0),
      SHIFT(line(17.7, 2.8, 17.7, 21.2), -0.9, 0),
    ],
  },

  "framer": {
    auto: false,
    dur: 1.6,
    parts: [
      SHIFT(path("M12.2 9.3l5.6 5.6H6.5v-4.4c0-.8.3-1.2 1.1-1.2h4.6z"), 0.7, 0),
      SHIFT(path("M12.2 9.3 6.5 3.6h10c.8 0 1.2.3 1.2 1.1v3.4c0 .8-.4 1.2-1.2 1.2h-4.3z"), -0.7, 0),
      SHIFT(path("M12.2 20.5l-5.7-5.6h5.7v5.6z"), 0, -0.8),
    ],
  },

  "heater": {
    auto: false,
    dur: 1.9,
    parts: [
      path("M9.2 9h5.6c2.5 0 3.8.2 4.7 1 .9.9 1 2.1 1 4.4s-.1 3.5-1 4.4c-.9.8-2.2 1-4.7 1H9.2c-2.5 0-3.8-.2-4.7-1-.9-.9-1-2.1-1-4.4s.1-3.5 1-4.4c.9-.8 2.2-1 4.7-1z"),
      path("M8 12.4v4.2M12 12.4v4.2M16 12.4v4.2"),
      path("M6.4 19.8v1.7M17.6 19.8v1.7"),
      G("steam", [path("M9.5 8.2c1.5-2.6-1.5-2.6 0-5.2M14.5 8.2c1.5-2.6-1.5-2.6 0-5.2")]),
    ],
    gAnims: { steam: DIP(0, -1.3) },
  },

  "house-heart": {
    auto: false,
    dur: 1.5,
    parts: [
      path("M11.3 21H9.4c-3.2 0-4.8 0-5.8-1-1-1-1-2.6-1-5.9v-2.4c0-1.6 0-2.4.3-3.1.3-.7.9-1.2 2.1-2.2l1.9-1.5c2-1.5 3-2.3 4.1-2.3s2.1.8 4.1 2.3l1.9 1.5c1.2 1 1.8 1.5 2.1 2.2.3.7.3 1.5.3 3.1v.6"),
      G("hb", [path("M16.6 21.4c-1.1-.9-2.9-2.6-2.9-4.2 0-1.2.8-2.1 1.9-2.1.6 0 1.1.2 1.9 1 .8-.8 1.3-1 1.9-1 1.1 0 1.9.9 1.9 2.1 0 1.6-1.8 3.3-2.9 4.2-.5.5-1.3.5-1.8 0z")]),
    ],
    sAnims: { hb: POP(17.5, 17.6, 1.18) },
  },

  "house01": {
    auto: false,
    dur: 1.7,
    parts: [
      path("M12.8 3.2 3.4 7.6"),
      path("M12.8 3.8V21H7.4c-1.8 0-3.2-1.4-3.2-3.2V8.4"),
      path("M12.8 7.7l8.2 4.3"),
      path("M20.8 11.8v6c0 1.8-1.4 3.2-3.2 3.2h-4.8"),
      line(18.4, 10.2, 18.4, 7.8),
      A(path("M7.2 11.4h1.4M7.2 14.9h1.4"), BLINK(0.3)),
      line(16.6, 21, 16.6, 17.6),
    ],
  },

  "house02": {
    auto: false,
    dur: 1.7,
    parts: [
      path("M3.4 15.1v2.4c0 1.8 1.4 3.2 3.2 3.2h.8c1.8 0 3.2-1.4 3.2-3.2v-2.4"),
      path("M2.5 15.1l2.2-2.1c1.2-1.1 1.8-1.7 2.4-1.7s1.2.6 2.4 1.7l2.2 2.1"),
      line(7, 17.5, 7, 20.7),
      line(11.6, 10.5, 11.6, 8.2),
      path("M9.9 8.4l3.1-2.9c1.1-1 1.7-1.5 2.3-1.5s1.2.5 2.3 1.5l3.1 2.9"),
      path("M20.7 8.6v8.9c0 1.8-1.4 3.2-3.2 3.2h-3.6"),
      line(19.5, 3.6, 19.5, 6.4),
      G("win", [path("M14.9 9.5h1.7v1.7h-1.7z")]),
    ],
    sAnims: { win: POP(15.7, 10.3, 1.3) },
  },

  "house03": {
    auto: false,
    dur: 1.7,
    parts: [
      path("M2.6 10.3 7.4 5l4.2 4.7c.5.5.9.9 1.3 1 .4.2.8.2 1.5.2h7L17.2 6.2c-.5-.5-.9-.9-1.3-1-.4-.2-.8-.2-1.5-.2H7.9z"),
      path("M11.2 9.9V20.6H7.6c-1.8 0-3.2-1.4-3.2-3.2V10"),
      path("M11.2 20.6h5.8c1.8 0 3.2-1.4 3.2-3.2v-6.5"),
      line(4.8, 7.4, 4.8, 4.6),
      SHIFT(line(7.4, 20.6, 7.4, 17.4), 0, 0.9),
      line(15.4, 14.2, 17.2, 14.2),
    ],
  },

  "house04": {
    auto: false,
    dur: 1.8,
    parts: [
      path("M7.2 9.3l4.3-3.9c1.2-1.1 1.8-1.6 2.5-1.6s1.3.5 2.5 1.6l4.3 3.9"),
      line(8.6, 8.6, 8.6, 20.4),
      line(20.4, 8.6, 20.4, 20.4),
      line(2.5, 20.4, 21.5, 20.4),
      path("M12.6 20.4v-3.6c0-.9.7-1.7 1.7-1.7h.6c.9 0 1.7.8 1.7 1.7v3.6"),
      G("tree", [ellipse(4.4, 11.7, 1.4, 1.5), line(4.4, 13.2, 4.4, 20.4)]),
      path("M13.9 11.3h1.9M13.9 8.7h1.9"),
    ],
    gAnims: { tree: WIG(4.4, 19.5, 8) },
  },

  "house05": {
    auto: false,
    dur: 1.6,
    parts: [
      rect(4.4, 11, 15.2, 10.5, 1.4),
      path("M2.9 9.7c0-.5.2-.9.7-1.1l7.4-2.6c.8-.3 1-.7 1-1.4 0-.7-.1-1.8 1-1.8.3 0 .6.3 1.2.8l6.3 5.1c.4.3.5.6.5 1 0 .8-.4 1.4-1.3 1.4H3.9c-.6 0-1-.4-1-1.4z"),
      line(3, 21.5, 21, 21.5),
      G("door", [path("M13.8 21.5v-2.9c0-.9-.7-1.6-1.6-1.6h-.4c-.9 0-1.6.7-1.6 1.6v2.9")]),
      path("M7 15h1.4M16.8 15h-1.4"),
      line(5.6, 7.6, 5.6, 3.7),
    ],
    sAnims: { door: POP(13.8, 19.3, 1.16) },
  },
};
