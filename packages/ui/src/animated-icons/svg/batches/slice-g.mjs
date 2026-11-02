/* Batch slice-g — vehicles, tools, objects, wayfinding fundamentals.
 * All bespoke gestures where a verb reads; dice/road/barrier/milestone
 * keep the default staggered draw-on (auto:true). */

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

/* ---- shared gesture idioms ---- */
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
/* double-flash — two fast blinks mid-cycle (sirens, beacons). */
const FLASH = [an("opacity", ["1", "0.15", "1", "0.15", "1", "1"], [0, 0.12, 0.24, 0.36, 0.48, 1])];
/* trace — the stroke writes itself on (checks, ridges, routes). */
const DRAW = (p, t0 = 0.15, t1 = 0.62) =>
  A({ ...p, a: { ...p.a, pathLength: 1, "stroke-dasharray": 1 } },
    [an("stroke-dashoffset", ["1", "1", "0", "0"], [0, t0, t1, 1])]);
/* the off-stroke shared by every *-off glyph. */
const SLASH = line(3.6, 3.6, 20.4, 20.4);
/* small water squiggle for boats */
const WAVE_G = "M3.4 20.9c1.1-1.2 2.2-1.2 3.3 0s2.2 1.2 3.3 0c1.1-1.2 2.2-1.2 3.3 0s2.2 1.2 3.3 0c1.1-1.2 2.2-1.2 3.3 0";

/* soft shield silhouette — rounder belly than the bare `shield` canon */
const SHIELD = "M12 3.4c2.3 1.4 4.9 2.2 7.3 2.4.9.1 1.7.9 1.7 1.8v4.1c0 4.2-3.6 6.7-7.3 8.9-1 .5-2.4.5-3.4 0-3.7-2.2-7.3-4.7-7.3-8.9V7.6c0-.9.8-1.7 1.7-1.8 2.4-.2 5-1 7.3-2.4z";

/* die body — soft square shared by all six faces */
const DIE = rect(3.6, 3.6, 16.8, 16.8, 4.2);
/* die pip positions */
const P_TL = [8.2, 8.2], P_TR = [15.8, 8.2], P_ML = [8.2, 12], P_C = [12, 12], P_MR = [15.8, 12], P_BL = [8.2, 15.8], P_BR = [15.8, 15.8];
const pip = ([x, y]) => circle(x, y, 1.55, fill());
const dice = (pts) => ({ dur: 1.5, parts: [DIE, ...pts.map(pip)] });

export const icons = {

  /* ------------------------------ travel ------------------------------ */

  /* side-profile jet climbing right — banks gently (plane is top-view) */
  airplane: {
    dur: 1.9,
    auto: false,
    parts: [
      G("fly", [
        /* one soft top-view silhouette — nose, swept wings, tailplane —
           banked 45° toward the top-right */
        G("bank", [
          path("M12 2.8c1 0 1.6 1 1.6 2.4v4.2l6.6 3.8c.4.2.6.6.6 1v1.2l-7.2-2.2v4.4l2 1.6v1.6L12 19.8l-3.6 1v-1.6l2-1.6v-4.4l-7.2 2.2v-1.2c0-.4.2-.8.6-1l6.6-3.8V5.2c0-1.4.6-2.4 1.6-2.4z"),
        ], { transform: "rotate(45 12 12)" }),
      ]),
    ],
    gAnims: { fly: tn("rotate", ["0 12 13", "0 12 13", "-7 12 13", "4 12 13", "0 12 13"], HOLD) },
  },

  /* side sedan with a roof sign — rocks on its suspension */
  taxi: {
    dur: 1.7,
    auto: false,
    parts: [
      G("rock", [
        path("M8 11.1l1-2.4c.3-.8 1-1.2 1.8-1.2h2.4c.8 0 1.5.4 1.8 1.2l1 2.4"),
        path("M3.4 16.9v-1.7c0-.8.5-1.4 1.2-1.7l1.7-.7c.5-.2 1-.5 1.3-.9l.5-.7h6.8l.5.7c.3.4.8.7 1.3.9l1.7.7c.7.3 1.2.9 1.2 1.7v1.7c0 .8-.7 1.5-1.5 1.5H4.9c-.8 0-1.5-.7-1.5-1.5z"),
        path("M8.6 18.4h6.8"),
        circle(6.9, 18.3, 1.6),
        circle(17.1, 18.3, 1.6),
        rect(10.5, 5.4, 3, 2.1, 0.9),
      ]),
    ],
    gAnims: { rock: tn("rotate", ["0 12 18.6", "0 12 18.6", "2 12 18.6", "-1.7 12 18.6", "0 12 18.6"], HOLD) },
  },

  /* side railcar on rails — the chimney puff drifts off */
  train: {
    dur: 1.9,
    auto: false,
    parts: [
      path("M4.4 15.9V9.1c0-1.1.9-2 2-2h11.2c1.1 0 2 .9 2 2v6.8h-15.2z"),
      path("M6.6 10.9h2.4M10.4 10.9h2.4M14.2 10.9h2.4"),
      path("M6.4 7.1V5.4"),
      circle(7.3, 17.8, 1.4),
      circle(16.7, 17.8, 1.4),
      path("M8.7 17.8h6.6"),
      line(3, 20.4, 21, 20.4),
      A(circle(6.4, 4, 1.05), [
        tn("translate", ["0 0", "0 0", "-0.7 -1.3", "-1.1 -2", "-1.1 -2"], [0, 0.25, 0.5, 0.62, 1]),
        an("opacity", ["1", "1", "0", "0"], [0, 0.3, 0.62, 1]),
      ]),
    ],
  },

  /* side tram with pantograph — sways on the rail */
  tram: {
    dur: 1.8,
    auto: false,
    parts: [
      G("sway", [
        path("M12 5.7V4.2M10 4.2l2-1.8 2 1.8"),
        path("M5.4 15.4V7.9c0-1.2 1-2.1 2.1-2.1h9c1.1 0 2.1.9 2.1 2.1v7.5h-13.2z"),
        path("M6.6 9.5h10.8"),
        circle(8.2, 16.9, 1.3),
        circle(15.8, 16.9, 1.3),
        path("M9.5 16.9h5"),
        line(4.4, 19.9, 19.6, 19.9),
      ]),
    ],
    gAnims: { sway: tn("rotate", ["0 12 19.9", "0 12 19.9", "2.2 12 19.9", "-1.8 12 19.9", "0 12 19.9"], HOLD) },
  },

  /* side cargo ship with funnel — rolls on the swell, wake slides by */
  ship: {
    dur: 1.95,
    auto: false,
    parts: [
      G("hull", [
        path("M3.2 14.6h17.6l-2.1 3.3c-.6.9-1.7 1.5-2.8 1.5H8.1c-1.1 0-2.2-.6-2.8-1.5l-2.1-3.3z"),
        path("M6.6 14.6v-3.2c0-.7.6-1.3 1.3-1.3h5.8c.7 0 1.3.6 1.3 1.3v3.2"),
        path("M15.7 14.6V7.9c0-.5.4-.9.9-.9h1.7c.5 0 .9.4.9.9v6.7"),
        path("M8.2 12.4h4.2"),
      ]),
      A(path(WAVE_G), [tn("translate", ["0 0", "-0.9 0", "0 0"], [0, 0.5, 1])]),
    ],
    gAnims: { hull: tn("rotate", ["0 12 16", "2.6 12 16", "-2.2 12 16", "0 12 16"], [0, 0.3, 0.65, 1]) },
  },

  /* twin soft sails — heels over in the gust */
  sailboat: {
    dur: 1.85,
    auto: false,
    parts: [
      G("heel", [
        /* sails hang off the mast itself — a separate inner edge 0.9 from
           the mast fused into one bar */
        line(12, 4.2, 12, 14.8),
        path("M12 4.6c2.3 2.9 4.3 6.3 5.6 10.2H12"),
        path("M12 7.6c-1.7 2.2-2.9 4.6-3.6 7.2H12"),
        path("M4.8 16.6h14.4l-1.7 2.7c-.5.8-1.4 1.3-2.3 1.3H8.8c-.9 0-1.8-.5-2.3-1.3l-1.7-2.7z"),
      ]),
    ],
    gAnims: { heel: tn("rotate", ["0 12 16", "0 12 16", "-4.5 12 16", "3 12 16", "0 12 16"], HOLD) },
  },

  /* flat-top ferry side view — bobs on a wave */
  ferry: {
    dur: 1.9,
    auto: false,
    parts: [
      G("bob", [
        path("M3.4 15.2h17.2l-1.5 2.8c-.5.9-1.5 1.4-2.5 1.4H7.4c-1 0-2-.5-2.5-1.4l-1.5-2.8z"),
        path("M6.2 15.2v-4.4c0-.7.6-1.3 1.3-1.3h9c.7 0 1.3.6 1.3 1.3v4.4"),
        path("M8.4 12.1h7.2"),
      ]),
    ],
    gAnims: { bob: DIP(0, 0.9) },
  },

  /* motorcycle profile — idles with a rock */
  "motorcycle": { dur: 1.4, auto: true, parts: [
    circle(5.5, 16.5, 3),
    circle(18.5, 16.5, 3),
    path("M5.5 16.5 9 11h6l3.5 5.5"),
    path("M15 11l-1.2-3.5h3"),
    path("M9 11H6.5"),
  ] },

  /* dome beacon — light dome pulses, rays flash twice */
  siren: {
    dur: 1.6,
    auto: false,
    parts: [
      path("M7.8 15.6v-4.8a4.2 4.2 0 0 1 8.4 0v4.8"),
      line(5.6, 15.6, 18.4, 15.6),
      path("M7.2 15.6h9.6v2.6c0 .7-.6 1.2-1.2 1.2H8.4c-.7 0-1.2-.5-1.2-1.2v-2.6z"),
      A(circle(12, 11.4, 1.2, fill()), FLASH),
      A(path("M12 3.4v1.6M5.9 5.7l1.1 1.1M18.1 5.7L17 6.8"), FLASH),
    ],
  },

  /* ladder truck — the roof beacon blips */
  "fire-truck": {
    dur: 1.7,
    auto: false,
    parts: [
      path("M4.2 6.4h10.8M4.2 7.9h10.8M6.4 6.4v1.5M9.3 6.4v1.5M12.2 6.4v1.5"),
      path("M3.4 16.6V9.9c0-.8.7-1.5 1.5-1.5h7.6v8.2h-9.1z"),
      path("M12.5 16.6v-6.1h2.9c.5 0 1 .2 1.3.6l2.2 2.6c.3.4.5.8.5 1.3v1.6h-6.9z"),
      path("M13.9 12.2h3.2"),
      A(circle(15.4, 8.6, 0.95, fill()), FLASH),
      circle(6.8, 18.2, 1.6),
      circle(16.6, 18.2, 1.6),
      path("M8.4 18.2h6.6M19.4 18.2h1.4"),
    ],
  },

  /* sedan with a two-dot lightbar — alternating flash */
  "police-car": {
    dur: 1.6,
    auto: false,
    parts: [
      path("M8.6 10.6l1.1-2.3c.3-.7.9-1.1 1.6-1.1h1.4c.7 0 1.3.4 1.6 1.1l1.1 2.3"),
      path("M3.6 16.8v-1.7c0-.8.5-1.4 1.2-1.7l1.8-.7c.5-.2.9-.5 1.2-.9l.8-1h6.8l.8 1c.3.4.7.7 1.2.9l1.8.7c.7.3 1.2.9 1.2 1.7v1.7c0 .8-.6 1.4-1.4 1.4h-.7"),
      path("M8.8 18.4h6.6"),
      circle(7.2, 18.4, 1.5),
      circle(16.8, 18.4, 1.5),
      path("M10.3 6.9V6.2c0-.9.7-1.6 1.6-1.6h.2c.9 0 1.6.7 1.6 1.6v.7"),
      A(circle(10.9, 6, 0.75, fill()), [an("opacity", ["1", "0.1", "1", "1"], [0, 0.18, 0.34, 1])]),
      A(circle(13.1, 6, 0.75, fill()), [an("opacity", ["1", "1", "0.1", "1", "1"], [0, 0.42, 0.56, 0.7, 1])]),
    ],
  },

  "traffic-cone": {
    parts: [
      path("M12 4.4c.4 0 .8.3.9.7l3.3 12.7c.1.4-.1.8-.5.9H8.3c-.4-.1-.6-.5-.5-.9l3.3-12.7c.1-.4.5-.7.9-.7z"),
      path("M9.8 9.8h4.4M8.8 13.8h6.4"),
      line(4.6, 20.6, 19.4, 20.6),
    ],
  },

  /* road running back — dashes draw on */
  road: {
    parts: [
      path("M4.2 20.6l4.9-15.8c.1-.5.6-.9 1.1-.9h3.6c.5 0 1 .4 1.1.9l4.9 15.8"),
      path("M12 6.6v1.9M12 10.9v2.5M12 16v3"),
    ],
  },

  /* striped plank barrier — wobbles once, as if brushed */
  "barrier": { dur: 1.4, auto: true, parts: [
    rect(3, 6, 18, 6, 1.5),
    path("M8.5 6 6 12M13.5 6 11 12M18.5 6 16 12"),
    path("M6 12v8.5M18 12v8.5"),
  ] },

  /* ------------------------------ tools / objects (ui) ------------------------------ */

  /* open-end wrench, jaw up-left — tightens with a turn */
  "wrench": { dur: 1.4, auto: true, parts: [
    path("M14.6 6.4a1.1 1.1 0 0 0 0 1.5l1.6 1.6a1.1 1.1 0 0 0 1.5 0l3.7-3.7a5.9 5.9 0 0 1-7.8 7.8l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a5.9 5.9 0 0 1 7.8-7.8l-3.7 3.7z"),
  ] },

  /* flathead driver diagonal — capsule grip, twists a screw */
  screwdriver: {
    dur: 1.6,
    auto: false,
    parts: [
      G("twist", [
        path("M4.6 19.4l3.6-3.6c.6-.6.6-1.6 0-2.2-.6-.6-1.6-.6-2.2 0l-3.6 3.6c-.6.6-.6 1.6 0 2.2.6.6 1.6.6 2.2 0z"),
        path("M9.6 14.4l6-6"),
        path("M15.6 8.4l2.8-2.8M16.9 6.4l1.7 1.7"),
      ]),
    ],
    gAnims: { twist: WIG(10, 14, 11) },
  },

  /* axe — winds up and chops */
  axe: {
    auto: false,
    dur: 1.6,
    parts: [
      G("swing", [
        line(5.2, 20.2, 14.6, 10.8),
        path("M11.4 7.4C12.4 4.8 15 3.6 18 4c1 2.4.5 4.2-.4 6.2-1 2.2-3.4 3.2-5.6 3"),
      ]),
    ],
    gAnims: { swing: tn("rotate", ["0 5.2 20.2", "-9 5.2 20.2", "4 5.2 20.2", "0 5.2 20.2"], [0, 0.3, 0.65, 1]) },
  },

  /* pickaxe — double-pointed head over a long handle; swings like the axe */
  "pickaxe": { dur: 1.4, auto: true, parts: [
    path("M3 11C4.5 6.5 8 4.5 12 4.5s7.5 2 9 6.5C18.5 8.5 15.5 7.5 12 7.5S5.5 8.5 3 11Z"),
    path("M12 7.5V21"),
  ] },

  /* hand saw — strokes back and forth */
  "saw": { dur: 1.4, auto: true, parts: [
    rect(2.5, 5, 6, 11, 2),
    path("M5.5 8.5v4"),
    path("M8.5 6.5 21.5 8.8"),
    path("M21.5 8.8L21.0 10.9L19.0 10.0L18.5 12.1L16.5 11.1L16.0 13.2L14.0 12.3L13.5 14.4L11.5 13.4L11.0 15.6L9.0 14.6"),
  ] },

  /* drill — the bit bores forward */
  "drill": { dur: 1.4, auto: true, parts: [
    rect(3.5, 6, 14, 6, 2),
    path("M17.5 9H21.5"),
    path("M7 12v8.5h4.5V12"),
    path("M11.5 15.5h2.5"),
  ] },

  /* shovel — D-grip, shaft, spade; thrusts down to dig */
  shovel: {
    dur: 1.7,
    auto: false,
    parts: [
      G("dig", [
        path("M7.26 7.72L4.93 5.4c-0.65 -0.65 -0.65 -1.67 0 -2.33l0.19 -0.19c0.65 -0.65 1.67 -0.65 2.33 0l1.77 1.77"),
        path("M7.91 8.84l6.14 6.14"),
        path("M14.6 14.42c0.47 -0.47 1.3 -0.47 1.77 0l3.44 3.44c0.84 0.84 0.84 2.23 0 3.07l-0.28 0.28c-0.84 0.84 -2.23 0.84 -3.07 0l-3.44 -3.44c-0.47 -0.47 -0.47 -1.3 0 -1.77l1.58 -1.58z"),
      ]),
    ],
    gAnims: { dig: DIP(1.4, 1.4) },
  },

  /* sofa — settles with a sit-down bounce */
  sofa: {
    dur: 1.7,
    auto: false,
    parts: [
      G("sit", [
        path("M4.6 13.2v-3.4c0-1.6 1.3-2.9 2.9-2.9h9c1.6 0 2.9 1.3 2.9 2.9v3.4"),
        path("M4.6 13.2c-1.1.1-1.9 1-1.9 2.1v1.9c0 .8.6 1.4 1.4 1.4h15.8c.8 0 1.4-.6 1.4-1.4v-1.9c0-1.1-.8-2-1.9-2.1"),
        path("M6.6 13.2v5.4M17.4 13.2v5.4"),
        path("M6.6 18.6v1.6M17.4 18.6v1.6"),
      ]),
    ],
    gAnims: { sit: tn("translate", ["0 0", "0 0", "0 0.9", "0 -0.3", "0 0"], HOLD) },
  },

  /* round-bow key at 45° — turns in the lock */
  key: {
    dur: 1.7,
    auto: false,
    parts: [
      G("turn", [
        circle(7.6, 7.6, 3.2),
        circle(7.6, 7.6, 1.05),
        path("M10.1 10.1l8.7 8.7"),
        path("M15.9 15.9l1.9-1.9M18.1 18.1l1.9-1.9"),
      ]),
    ],
    gAnims: { turn: tn("rotate", ["0 7.6 7.6", "0 7.6 7.6", "-24 7.6 7.6", "0 7.6 7.6"], HOLD) },
  },

  /* ------------------------------ security ------------------------------ */

  /* padlock with the shackle swung fully open — it bounces once */
  "lock-open": {
    dur: 1.7,
    auto: false,
    parts: [
      G("shackle", [
        path("M7.8 10.4V8a4.2 4.2 0 0 1 8.2-1.3"),
      ]),
      path("M7.6 10.4h8.8a3 3 0 0 1 3 3v4a3 3 0 0 1-3 3H7.6a3 3 0 0 1-3-3v-4a3 3 0 0 1 3-3z"),
      line(12, 14.2, 12, 16.6),
    ],
    gAnims: { shackle: tn("rotate", ["0 7.8 10.4", "0 7.8 10.4", "-20 7.8 10.4", "0 7.8 10.4"], HOLD) },
  },

  /* shield + check — the check writes itself on */
  "shield-check": {
    dur: 1.7,
    auto: false,
    parts: [
      path(SHIELD),
      DRAW(path("M8.7 12.1l2.3 2.3 4.3-4.3"), 0.22, 0.6),
    ],
  },

  /* shield + slash — the slash strikes through */
  "shield-off": {
    dur: 1.7,
    auto: false,
    parts: [
      path(SHIELD),
      DRAW(SLASH, 0.18, 0.55),
    ],
  },

  /* shield + ! — the mark blips a warning */
  "shield-alert": {
    dur: 1.7,
    auto: false,
    parts: [
      path(SHIELD),
      A(path("M12 9.4v4.4"), BLINK(0.25)),
      A(circle(12, 16.4, 1.05, fill()), BLINK(0.15)),
    ],
  },

  /* ------------------------------ people ------------------------------ */

  /* whorl ridges trace on, inside out */
  fingerprint: {
    dur: 2,
    auto: false,
    parts: [
      DRAW(path("M8.6 5.9c2.2-1.1 4.8-.8 6.8.7 1.9 1.4 3 3.6 3.1 5.9v1.4"), 0.02, 0.34),
      DRAW(path("M5.9 9.6c.3-1.4 1-2.7 2.1-3.7"), 0.08, 0.3),
      DRAW(path("M9.9 8.8c1.3-.7 2.9-.5 4.1.4 1.2.9 1.9 2.2 1.9 3.7v1.8c0 1.2-.1 2.4-.4 3.5"), 0.14, 0.52),
      DRAW(path("M8.4 12.6c0-1.1.4-2.2 1.1-3.1"), 0.2, 0.44),
      DRAW(path("M12.1 12.2v2.3c-.1 1.5-.5 2.9-1.2 4.1"), 0.26, 0.58),
      DRAW(path("M5.6 14.3c.1 1.3.5 2.5 1.1 3.6"), 0.32, 0.56),
      DRAW(path("M8.6 16.1c.1 1.1 0 2.1-.4 3.1"), 0.38, 0.62),
    ],
  },

  /* ------------------------------ buildings ------------------------------ */

  /* pear-globe bulb with pinch neck — filament flickers */
  lightbulb: {
    dur: 1.8,
    auto: false,
    parts: [
      path("M12 3.8a6.8 6.8 0 0 1 4.3 12.1c-.6.5-.9 1.2-.9 1.9v.4H8.6v-.4c0-.7-.3-1.4-.9-1.9A6.8 6.8 0 0 1 12 3.8z"),
      path("M10.3 18.2l.1-3c0-.5.4-.9.9-.9h1.4c.5 0 .9.4.9.9l.1 3"),
      path("M9.6 19.5h4.8M10.7 21.2h2.6"),
      A(path("M11 14.3v-2.6M13 14.3v-2.6M11 11.7c.3-.6.7-.6 1-.1.3.5.7.5 1 .1"), BLINK(0.35)),
    ],
  },

  /* upright torch — beam rays flick on */
  flashlight: {
    dur: 1.6,
    auto: false,
    parts: [
      path("M8.4 5.7h7.2l1.7 3.1H6.7l1.7-3.1z"),
      path("M8.4 8.8v8.8c0 .8.6 1.4 1.4 1.4h4.4c.8 0 1.4-.6 1.4-1.4V8.8"),
      path("M11 12.1h2"),
      A(path("M9.2 3.6l-.7-1.2M12 3.2V1.8M14.8 3.6l.7-1.2"), BLINK(0.12)),
    ],
  },

  /* pillar candle — the flame dances */
  candle: {
    dur: 1.9,
    auto: false,
    parts: [
      path("M7.6 11.2c0-.8.6-1.4 1.4-1.4h6c.8 0 1.4.6 1.4 1.4v7.6c0 .8-.6 1.4-1.4 1.4H9c-.8 0-1.4-.6-1.4-1.4v-7.6z"),
      path("M7.6 12.2c1.4.8 2.4-.4 3.8.3 1.1.5 2.2.2 5-.4"),
      line(12, 9.8, 12, 8.3),
      line(5.2, 20.2, 18.8, 20.2),
      G("flame", [
        path("M12 3.4c1.2 1.3 1.8 2.4 1.8 3.4 0 1-.8 1.8-1.8 1.8s-1.8-.8-1.8-1.8c0-1 .6-2.1 1.8-3.4z"),
      ]),
    ],
    sAnims: { flame: { pivot: [12, 8.4], anim: tn("scale", ["1", "1.14", "0.92", "1"], HOLD) } },
  },

  /* ------------------------------ sports — dice ------------------------------ */

  "dice-1": dice([P_C]),
  "dice-2": dice([P_TL, P_BR]),
  "dice-3": dice([P_TL, P_C, P_BR]),
  "dice-4": dice([P_TL, P_TR, P_BL, P_BR]),
  "dice-5": dice([P_TL, P_TR, P_C, P_BL, P_BR]),
  "dice-6": dice([P_TL, P_TR, P_ML, P_MR, P_BL, P_BR]),

  /* ------------------------------ ui ------------------------------ */

  /* single piece, top knob + right socket — rocks in place */
  puzzle: {
    dur: 1.7,
    auto: false,
    parts: [
      G("rock", [
        path("M5.6 19.6V9.4c0-.7.6-1.3 1.3-1.3h4.2c-.6-1-.6-2.2 0-3.1.6-.9 1.6-1.4 2.7-1.4 1.8 0 3 1.5 2.9 3.2 0 .7-.3 1.4-.8 1.9h4.4c.7 0 1.3.6 1.3 1.3v3.8c-1.1-.5-2.4-.4-3.3.3-.9.6-1.4 1.6-1.4 2.7 0 1.9 1.5 3.1 3.2 2.9.6-.1 1.1-.3 1.5-.7v1.5c0 .7-.6 1.3-1.3 1.3H5.6z"),
      ]),
    ],
    gAnims: { rock: WIG(12, 12, 5) },
  },

  /* cone with confetti bursting out the mouth */
  "party-popper": { dur: 1.4, auto: true, parts: [
    path("M4 20 7.8 8.8l7.4 7.4Z"),
    path("M12.5 4.5v2.5M17 8l1.8-1.8M18.5 12.5H21M14.5 3.5h.01M20 9.5h.01"),
  ] },

  /* half-filled star — the dark half shimmers */
  "star-half": {
    keepFill: true,
    dur: 1.7,
    auto: false,
    parts: [
      path("M12 4.4l2 4.1c.2.4.6.7 1 .8l4.5.7-3.3 3.1c-.3.3-.5.8-.4 1.2l.8 4.5-4.1-2.1c-.4-.2-.9-.2-1.2 0l-4.1 2.1.8-4.5c.1-.4-.1-.9-.4-1.2L4 10l4.5-.7c.4-.1.8-.4 1-.8l2-4.1z"),
      A(path("M12 4.4v12.3l-4.8 2.5.9-4.9c.1-.4-.1-.9-.4-1.2L4.2 9.8l4.8-.7c.4-.1.8-.4 1-.8l2-3.9z", fill()), [
        an("opacity", ["1", "1", "0.3", "1", "1"], HOLD),
      ]),
    ],
  },

  /* pennant on a pole — waves */
  "flag-triangle": {
    dur: 1.7,
    auto: false,
    parts: [
      line(6, 3.6, 6, 20.8),
      G("wave", [
        path("M6 4.8c4.3.6 8.2 1.9 11.7 3.9-3.5 1.9-7.4 3.2-11.7 3.7V4.8z"),
      ]),
    ],
    gAnims: { wave: tn("rotate", ["0 6 8.4", "0 6 8.4", "-7 6 8.4", "5 6 8.4", "0 6 8.4"], HOLD) },
  },

  /* ------------------------------ social ------------------------------ */

  /* cuff + thumb up — bobs an approval */
  "thumbs-up": {
    dur: 1.6,
    auto: false,
    parts: [
      G("bob", [
        rect(3.2, 10.7, 3.6, 9.4, 1.4),
        path("M7.4 10.9c1.8-.9 3.1-2.2 4-4 .7-1.5 1-3.2 1.4-4.4.2-.6.8-1 1.4-.9.8.1 1.4.8 1.4 1.6 0 1.6-.6 3.3-1.6 4.8l-.5.9h4.6c1.2 0 2.1 1 2 2.1l-.8 5.6c-.2 1.3-1.3 2.3-2.6 2.3h-8.1c-1 0-1.8-.8-1.8-1.8v-6.3z"),
      ]),
    ],
    gAnims: { bob: DIP(0, -1.3) },
  },

  /* cuff + thumb down — dips a disapproval */
  "thumbs-down": {
    dur: 1.6,
    auto: false,
    parts: [
      G("bob", [
        rect(3.2, 3.9, 3.6, 9.4, 1.4),
        path("M7.4 13.1c1.8.9 3.1 2.2 4 4 .7 1.5 1 3.2 1.4 4.4.2.6.8 1 1.4.9.8-.1 1.4-.8 1.4-1.6 0-1.6-.6-3.3-1.6-4.8l-.5-.9h4.6c1.2 0 2.1-1 2-2.1l.8-5.6c-.2-1.3-1.3-2.3-2.6-2.3h-8.1c-1 0-1.8.8-1.8 1.8v6.1z"),
      ]),
    ],
    gAnims: { bob: DIP(0, 1.3) },
  },

  /* ------------------------------ wayfinding ------------------------------ */

  /* domed mile-marker stone with two etched lines */
  milestone: {
    parts: [
      path("M8.4 20.4v-9.6a3.6 3.6 0 0 1 7.2 0v9.6"),
      path("M10.4 11.6h3.2M10.4 14.4h3.2"),
      line(5.4, 20.4, 18.6, 20.4),
    ],
  },

  /* pole with two opposing arrow boards — they sway */
  signpost: {
    dur: 1.8,
    auto: false,
    parts: [
      line(12, 3.2, 12, 20.8),
      G("signs", [
        path("M7.4 5.6h8.4l2.1 2-2.1 2H7.4c-.6 0-1-.4-1-1v-2c0-.6.4-1 1-1z"),
        path("M16.6 11.6H8.2l-2.1 2 2.1 2h8.4c.6 0 1-.4 1-1v-2c0-.6-.4-1-1-1z"),
      ]),
    ],
    gAnims: { signs: tn("rotate", ["0 12 10", "0 12 10", "-5 12 10", "4 12 10", "0 12 10"], HOLD) },
  },

  /* winding route from a dot to a pin — the path traces itself */
  route: {
    dur: 1.9,
    auto: false,
    parts: [
      circle(6.2, 18.9, 1.5),
      path("M17.6 4.4a1.9 1.9 0 1 1-.1 3.8l-.1 1.3-.9-1.2"),
      DRAW(path("M6.2 17.3v-2.1c0-1.4 1.1-2.5 2.5-2.5h6.6c1.4 0 2.5-1.1 2.5-2.5 0-1-.6-1.8-1.4-2.2"), 0.15, 0.65),
    ],
  },

  /* paper-plane needle seeking NE — tilts to find north */
  navigation: {
    dur: 1.8,
    auto: false,
    parts: [
      G("seek", [
        path("M20.2 4c.4-.2.9.1.8.7l-4.4 15.4c-.2.6-.9.7-1.3.3l-4.2-4.5c-.2-.3-.5-.5-.9-.5l-8.9-1.9c-.6-.1-.7-.8-.2-1.1L20.2 4z"),
      ]),
    ],
    gAnims: { seek: tn("rotate", ["0 12 12", "0 12 12", "-8 12 12", "6 12 12", "0 12 12"], HOLD) },
  },

  /* up-pointing nav dart with a forked tail — same seek, own silhouette */
  "navigation-2": {
    dur: 1.8,
    auto: false,
    parts: [
      G("seek", [
        path("M12 3.4l7.6 15.9c.3.6-.2 1.2-.8 1l-5.9-2.2c-.4-.2-.9-.2-1.3 0l-5.9 2.2c-.6.2-1.1-.4-.8-1L12 3.4z"),
      ]),
    ],
    gAnims: { seek: tn("rotate", ["0 12 12", "0 12 12", "8 12 12", "-6 12 12", "0 12 12"], HOLD) },
  },
};
