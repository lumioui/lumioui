/* objects-02 — ~130 glyphs: household objects, tools, labware, tickets,
 * shields, lamps, trees, vehicles. Soft blob silhouettes, stroke 2,
 * live area [2.5, 21.5]. Default write-on draw everywhere except where
 * a bespoke gesture is noted on the entry. */
const path = (d, a = {}) => ({ e: "path", a: { d, ...a } });
const circle = (cx, cy, r, a = {}) => ({ e: "circle", a: { cx, cy, r, ...a } });
const line = (x1, y1, x2, y2, a = {}) => ({ e: "line", a: { x1, x2, y1, y2, ...a } });
const rect = (x, y, w, h, rx, a = {}) => ({ e: "rect", a: { x, y, width: w, height: h, rx, ...a } });
const ellipse = (cx, cy, rx, ry, a = {}) => ({ e: "ellipse", a: { cx, cy, rx, ry, ...a } });
const fill = (color = "currentColor") => ({ fill: color, stroke: "none" });
const an = (attr, values, times) => ({ kind: "attr", attr, values, times });
const tn = (type, values, times, extra = {}) => ({ kind: "transform", type, values, times, ...extra });
const A = (part, anims) => ({ ...part, anims });
const G = (id, children, a = {}) => ({ e: "g", g: id, a, children });

/* ---- bespoke gesture idioms (same vocabulary as the other batches)
   HOLD phrasing: rest ~30%+, act mid-cycle, settle back — pose at t=0
   always equals pose at t=1 so the loop is seamless. */
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
const SHIFT = (p, dx, dy, t = HOLD) =>
  A(p, [tn("translate", ["0 0", "0 0", `${dx} ${dy}`, "0 0", "0 0"], t)]);
/* trace — the stroke writes itself on; pathLength=1 normalizes. */
const DRAW = (p, t0 = 0.15, t1 = 0.62) =>
  A({ ...p, a: { ...p.a, pathLength: 1, "stroke-dasharray": 1 } },
    [an("stroke-dashoffset", ["1", "1", "0", "0"], [0, t0, t1, 1])]);
/* blink — opacity dips once on a mark (for A()). */
const BLINK = (lo = 0.2) => [an("opacity", ["1", "1", `${lo}`, "1", "1"], [0, 0.32, 0.46, 0.6, 1])];

/* ---- shared silhouettes ------------------------------------------------ */

/* the canon diagonal "off" bar — writes itself on after the body rests */
const SLASH = () => DRAW(line(3.6, 3.6, 20.4, 20.4), 0.2, 0.62);

/* soft shield belly — same silhouette as slice-g's shield family */
const SHIELD =
  "M12 3.4c2.3 1.4 4.9 2.2 7.3 2.4.9.1 1.7.9 1.7 1.8v4.1c0 4.2-3.6 6.7-7.3 8.9-1 .5-2.4.5-3.4 0-3.7-2.2-7.3-4.7-7.3-8.9V7.6c0-.9.8-1.7 1.7-1.8 2.4-.2 5-1 7.3-2.4z";

/* canon ticket — notched sides + perforation stub */
const TICKET =
  "M4.5 7.6h15c.5 0 .9.4.9.9v1.7c-1.4.6-2.4 1.9-2.4 3.4s1 2.8 2.4 3.4v1.7c0 .5-.4.9-.9.9h-15c-.5 0-.9-.4-.9-.9V17c1.4-.6 2.4-1.9 2.4-3.4S5 10.8 3.6 10.2V8.5c0-.5.4-.9.9-.9z";
const PERF = "M14.6 9.6v1.4M14.6 12.6v1.4M14.6 15.6v1.4";

/* canon sun ring; ray sets vary per variant */
const SUN_CORE = circle(12, 12, 4);

/* canon thermometer outline */
const THERM =
  "M12 4.5a2.2 2.2 0 0 0-2.2 2.2v7.4c-1.4 1-2.3 2.6-2.3 4.4a4.5 4.5 0 1 0 9 0c0-1.8-.9-3.4-2.3-4.4V6.7A2.2 2.2 0 0 0 12 4.5z";

/* canon wheat (matches gaps-a `wheat`): stem + staggered solid grains */
const WHEAT =
  "M12 21.4V8.8" +
  "M11 18.8c-2-.1-3.3-1.1-3.7-2.9 2 .1 3.3 1.1 3.7 2.9z" +
  "M13 16.2c2-.1 3.3-1.1 3.7-2.9-2 .1-3.3 1.1-3.7 2.9z" +
  "M11 13.6c-2-.1-3.3-1.1-3.7-2.9 2 .1 3.3 1.1 3.7 2.9z" +
  "M13 11c2-.1 3.3-1.1 3.7-2.9-2 .1-3.3 1.1-3.7 2.9z" +
  "M12 7.6c-.9-1.1-.9-2.6 0-3.8.9 1.2.9 2.7 0 3.8z";

/* canon flashlight head + body (rays dropped for the -off) */
const TORCH_HEAD =
  "M17.3 8.8H6.7l.85-1.55Q8.4 5.7 12 5.7q3.6 0 4.45 1.55L17.3 8.8z";
const TORCH_BODY =
  "M8.4 8.8v8.8c0 .8.6 1.4 1.4 1.4h4.4c.8 0 1.4-.6 1.4-1.4V8.8";

/* canon megaphone horn + handle (sound arcs dropped for the -off) */
const MEGA =
  "M4 10.6L14.4 5.4v13.2L4 13.4z" +
  "M6.8 14.2l.4 5.2c.1.9.9 1.6 1.8 1.6h.4c.9 0 1.7-.7 1.7-1.7v-4.5";

/* canon milk carton + droplet */
const MILK =
  "M8 21.5v-6q0-6 2-7.95L12 5.6l2 1.95q2 1.95 2 7.95v6z" +
  "M8 9.5h8M12 5.6V3.4";

/* canon wine glass + stem + foot */
const WINE =
  "M7.2 3.5V9c0 2.8 2.1 5 4.8 5s4.8-2.2 4.8-5V3.5" +
  "M12 14v5.5M8.4 20.6h7.2";

/* canon map-pin droplet */
const PIN =
  "M12 21.4S19 15.4 19 10.3a7 7 0 1 0-14 0c0 5.1 7 11.1 7 11.1z";

/* canon star */
const STAR =
  "M12 4.5l1.9 4.1c.2.4.6.7 1 .7l4.5.5-3.4 3c-.3.3-.5.8-.4 1.2l.9 4.4-3.9-2.2c-.4-.2-.9-.2-1.2 0l-3.9 2.2.9-4.4c.1-.4-.1-.9-.4-1.2l-3.4-3 4.5-.5c.4 0 .8-.3 1-.7z";

/* canon server stack: two trays + status dots */
const SERVER_TOP = rect(4.2, 4.4, 15.6, 6.6, 1.9);
const SERVER_BOT = rect(4.2, 13, 15.6, 6.6, 1.9);
const SERVER_DOTS = path("M7 7.7h.4M7 16.3h.4", { "stroke-width": 2.6 });
const SERVER_TICKS = "M15.6 7.7h1.6M15.6 16.3h1.6";

/* canon conical flask */
const FLASK =
  "M10.2 3.6V9c0 .4-.1.9-.4 1.2l-4.4 7.4c-.7 1.1 0 2.5 1.3 2.5h10.6c1.3 0 2-1.4 1.3-2.5l-4.4-7.4c-.3-.3-.4-.8-.4-1.2V3.6";
const FLASK_RIM = "M8.6 3.6h6.8";
const FLASK_LEVEL = "M7.6 15.4h8.8";

/* small snowflake asterisk */
const FLAKE = (cx, cy, r) =>
  path(`M${cx} ${cy - r}v${2 * r}M${cx - r * 0.87} ${cy - r * 0.5}l${2 * r * 0.87} ${r}M${cx + r * 0.87} ${cy - r * 0.5}l${-2 * r * 0.87} ${r}`);

/* rising bubble that pops out of existence (for labware/drinks) */
const BUBBLE = (cx, cy0, dy, r = 0.8) =>
  A(circle(cx, cy0, r, fill()), [
    an("cy", [String(cy0), String(cy0), String(cy0 - dy), String(cy0 - dy)], [0, 0.2, 0.7, 1]),
    an("opacity", ["0", "1", "1", "0", "0"], [0, 0.2, 0.55, 0.75, 1]),
  ]);

export const icons = {
  /* ----------------------------- vessels & objects ----------------------------- */

  /* amphora — lip, twin handles, plump belly tapering to the foot */
  amphora: {
    auto: true,
    dur: 1.7,
    parts: [
      path("M8.8 3.6h6.4"),
      path("M10 3.6v2.6c0 1.1-.5 2.1-1.3 3-1.3 1.4-2.1 3.3-2.1 5.3 0 3 2.4 5.4 5.4 5.4s5.4-2.4 5.4-5.4c0-2-.8-3.9-2.1-5.3-.8-.9-1.3-1.9-1.3-3V3.6"),
      /* two ear handles loop from the neck to the shoulder, outside the body */
      path("M10 5.6H8.6C7.4 5.6 6.4 6.6 6.4 7.8c0 .8.4 1.5 1 1.9"),
      path("M14 5.6h1.4c1.2 0 2.2 1 2.2 2.2 0 .8-.4 1.5-1 1.9"),
      path("M7.2 14.4h9.6"),
    ],
  },

  /* anvil — horn tapers left, waist, stepped base; lands with a settle */
  anvil: {
    auto: false,
    dur: 1.7,
    parts: [
      G("drop", [
        path("M3.2 6.8c.6-1 1.9-1.6 3.4-1.6h10.6c1.2 0 2.2 1 2.2 2.2v.4c0 1.2-1 2.2-2.2 2.2H8.8C5.8 10 4 8.8 3.2 6.8z"),
        path("M10.4 10c.2 1.8-.4 3.2-1.4 4.2h6c-1-1-1.6-2.4-1.4-4.2"),
        path("M6.8 18.4c0-1.3 1.1-2.4 2.4-2.4h5.6c1.3 0 2.4 1.1 2.4 2.4v.4c0 .9-.7 1.6-1.6 1.6H8.4c-.9 0-1.6-.7-1.6-1.6v-.4z"),
      ]),
    ],
    gAnims: { drop: tn("translate", ["0 0", "0 0", "0 0.8", "0 -0.3", "0 0"], HOLD) },
  },

  /* aperture — iris blades rotate a notch open/closed */
  aperture: {
    auto: false,
    dur: 1.8,
    parts: [
      circle(12, 12, 8.4),
      G("iris", [
        path("M7.4 4.8l6.4 3.6"),
        path("M19.8 8.8l-5.8 4.4"),
        path("M16.6 19.2l-6.4-3.6"),
        path("M4.2 15.2l5.8-4.4"),
      ]),
    ],
    gAnims: { iris: WIG(12, 12, 11) },
  },

  /* beaker — lipped cylinder, wavy liquid line, bubble rising */
  beaker: {
    auto: false,
    dur: 1.9,
    parts: [
      line(6.4, 3.4, 17.6, 3.4),
      path("M7.8 3.4v3.8l-2.2 9.4c-.4 1.4.7 2.7 2.1 2.7h8.6c1.4 0 2.5-1.3 2.1-2.7l-2.2-9.4V3.4"),
      path("M6.6 14.8c1.2-.9 2.4-.9 3.6 0s2.4.9 3.6 0 2.4-.9 3.6 0"),
      BUBBLE(11, 12.4, 4, 0.75),
    ],
  },

  /* bean — plump kidney blob with a soft crease */
  bean: {
    auto: false,
    dur: 1.6,
    parts: [
      G("tilt", [
        G("rot", [ellipse(12, 12, 5.6, 8.4), path("M12 3.6c-2.2 2.6 2.2 4.6 0 8.4s2.2 5.8 0 8.4")], { transform: "rotate(28 12 12)" }),
      ]),
    ],
    gAnims: { tilt: tn("rotate", ["0 12 12", "-6 12 12", "4 12 12", "0 12 12"], [0, 0.3, 0.65, 1]) },
  },

  /* bean-off — same bean + the bar writes on */
  "bean-off": {
    auto: false,
    dur: 1.6,
    parts: [
      path("M14.6 4.4c3.6.8 5.4 4.2 4.6 7.8-.8 4.2-4.6 7.2-9 7.2-4.2 0-7.2-3.1-7.2-7 0-2.7 1.7-4.9 4-5.9 1.3-.6 2.3-1.4 3.1-2.5 1-1.3 2.7-1.6 4.5-.4z"),
      SLASH(),
    ],
  },

  /* biceps-flexed — curled arm; the whole mass flexes */
  "biceps-flexed": { dur: 1.4, auto: true, parts: [
    path("M4 20.5V8.2A3.4 3.4 0 0 1 7.4 4.8 3.4 3.4 0 0 1 10.8 8.2V9.6C12.4 6.6 17 6.2 19.2 9.6 20.4 11.6 21 13.2 21 15.8V18.5A2 2 0 0 1 19 20.5Z"),
    path("M10.8 15.2C12.6 15.2 13.8 14.2 14.2 12.4"),
    path("M7.4 8.6V11"),
  ] },

  /* biohazard — center ring + three sweeping arcs; arcs sway */
  biohazard: {
    auto: false,
    dur: 2.0,
    parts: [
      circle(12, 12, 2.6),
      G("arms", [
        path("M8.6 4.4a8.6 8.6 0 0 0-5 10.4"),
        path("M15.4 4.4a8.6 8.6 0 0 1 5 10.4"),
        path("M7.2 18.6a8.6 8.6 0 0 0 9.6 0"),
        path("M8.4 9.8a4.8 4.8 0 0 0-1.4 4"),
        path("M15.6 9.8a4.8 4.8 0 0 1 1.4 4"),
        path("M12 15.6v-1.4"),
      ]),
    ],
    gAnims: { arms: tn("rotate", ["0 12 12", "0 12 12", "-7 12 12", "5 12 12", "0 12 12"], HOLD) },
  },

  /* blocks — two base cubes, one on top; the top block hops */
  blocks: {
    auto: false,
    dur: 1.6,
    parts: [
      rect(3.4, 12.2, 8.4, 8.4, 2),
      rect(12.2, 12.2, 8.4, 8.4, 2),
      G("top", [rect(7.8, 3.6, 8.4, 8.4, 2)]),
    ],
    gAnims: { top: DIP(0, -1.3) },
  },

  /* bomb — round body, curling fuse, spark that flickers */
  bomb: {
    auto: false,
    dur: 1.8,
    parts: [
      circle(10.2, 14, 7),
      path("M13.9 7.6c.8-1 1.9-1.7 3.1-2 1.4-.3 2.7 0 3.8.8"),
      path("M14.6 8.2l1.2-1.8c.4-.7 1.2-.9 1.9-.7"),
      A(path("M20 4.4l.9-.9M18.2 3l.2-1.4M21.8 5.6l1-.6"), BLINK(0.1)),
      path("M7 11.4a4.8 4.8 0 0 1 2.8-2.6"),
    ],
  },

  /* building-2 — tall block, two window columns, arched door */
  "building-2": {
    auto: true,
    dur: 1.7,
    parts: [
      rect(5.2, 3.4, 13.6, 17.2, 1.9),
      path("M8.6 7.4h1.6M13.8 7.4h1.6M8.6 10.8h1.6M13.8 10.8h1.6M8.6 14.2h1.6M13.8 14.2h1.6"),
      path("M10.8 20.6v-2.4c0-.7.5-1.2 1.2-1.2s1.2.5 1.2 1.2v2.4"),
      path("M12 3.4V2.4"),
    ],
  },

  /* cannabis — seven pointed leaflets fanning off a stem */
  cannabis: {
    auto: true,
    dur: 1.9,
    parts: [
      path("M12 21.4v-4.6"),
      path("M12 3.2c1.5 2.7 2.2 6 2 9.6-1.9-1.9-3-5.4-2-9.6z"),
      path("M11.4 13.4c-.9-2.9-2.9-4.9-5.8-5.9.3 2.9 2 5.4 4.8 6.6"),
      path("M12.6 13.4c.9-2.9 2.9-4.9 5.8-5.9-.3 2.9-2 5.4-4.8 6.6"),
      path("M11.2 16.8c-1.8-1.6-4.1-2-6.6-1.2 1.4 2.3 3.8 3.4 6.6 3.2"),
      path("M12.8 16.8c1.8-1.6 4.1-2 6.6-1.2-1.4 2.3-3.8 3.4-6.6 3.2"),
    ],
  },

  /* cigarette — body + filter tip, smoke wisp writes on */
  cigarette: {
    auto: false,
    dur: 1.8,
    parts: [
      rect(2.8, 15.2, 15.6, 3.4, 1.2),
      line(18.6, 15.2, 18.6, 18.6),
      DRAW(path("M20.8 12.6c.9-.9 1.1-2.2.4-3.4-.6-1-1.7-1.4-2.3-2.4-.5-.9-.3-2 .5-2.8"), 0.3, 0.8),
    ],
  },

  /* cigarette-off — body + slash */
  "cigarette-off": {
    auto: false,
    dur: 1.6,
    parts: [
      rect(2.8, 15.2, 15.6, 3.4, 1.2),
      line(18.6, 15.2, 18.6, 18.6),
      SLASH(),
    ],
  },

  /* citrus — half-wheel bowl with segment spokes */
  citrus: {
    auto: true,
    dur: 1.7,
    parts: [
      line(4.2, 10.8, 19.8, 10.8),
      path("M4.2 10.8a7.8 7.8 0 0 0 15.6 0"),
      path("M12 10.8v7.8M6.8 12.6l3.4 4.4M17.2 12.6l-3.4 4.4"),
    ],
  },

  /* clover — shamrock: three round lobes + curving stem */
  clover: {
    auto: true,
    dur: 1.7,
    parts: [
      circle(12, 7, 3.4),
      circle(8, 12.8, 3.4),
      circle(16, 12.8, 3.4),
      path("M12 15.4c0 2.8-.9 4.8-2.6 6.2"),
    ],
  },

  /* club — suit of clubs: three lobes + stem triangle */
  club: {
    auto: true,
    dur: 1.6,
    parts: [
      circle(12, 8, 3.4),
      circle(8.4, 13.2, 3.4),
      circle(15.6, 13.2, 3.4),
      path("M12 14.4l1.4 6h-2.8l1.4-6z"),
    ],
  },

  /* concierge-bell — dome dings when the plunger presses */
  "concierge-bell": {
    auto: false,
    dur: 1.7,
    parts: [
      G("ring", [path("M5 15.6a7 7 0 0 1 14 0")]),
      G("plunger", [line(12, 6.8, 12, 8.6), line(10.4, 6.8, 13.6, 6.8)]),
      line(3.4, 15.6, 20.6, 15.6),
      line(4.8, 18.4, 19.2, 18.4),
    ],
    gAnims: {
      ring: WIG(12, 15.6, 4),
      plunger: tn("translate", ["0 0", "0 0", "0 0.9", "0 0", "0 0"], HOLD),
    },
  },

  /* creative-commons — ring + twin c arcs */
  "creative-commons": {
    auto: true,
    dur: 1.7,
    parts: [
      circle(12, 12, 8.4),
      path("M10 9.4a2.9 2.9 0 1 0 0 5.2"),
      path("M15.6 9.4a2.9 2.9 0 1 0 0 5.2"),
    ],
  },

  /* cross — plain Latin cross, softened joins */
  cross: {
    auto: true,
    dur: 1.5,
    parts: [
      path("M10.8 3.6h2.4v5h4.6v2.4h-4.6v9.4h-2.4V11H6.2V8.6h4.6z"),
    ],
  },

  /* dam — stepped wall, water pooling at the foot */
  "dam": { dur: 1.4, auto: true, parts: [
    path("M3.5 5H20.5V9L18 20.5H6L3.5 9Z"),
    path("M9 9v11.5M15 9v11.5"),
  ] },

  /* dessert — sundae bowl on a stem, cherry pops on top */
  dessert: {
    auto: false,
    dur: 1.7,
    parts: [
      line(4.4, 10.2, 19.6, 10.2),
      path("M5.4 10.2c0 3.2 2.6 5.8 5.8 5.8h1.6c3.2 0 5.8-2.6 5.8-5.8"),
      path("M12 16v3.4M8.8 20.6h6.4"),
      path("M9.2 10.2a2.8 2.8 0 0 1 5.6 0"),
      G("cherry", [circle(12, 6.2, 1.3, fill())]),
    ],
    sAnims: { cherry: POP(12, 6.2, 1.2) },
  },

  /* dices — two dice rattling in the cup */
  dices: {
    auto: false,
    dur: 1.6,
    parts: [
      G("shake", [
        rect(3.6, 9.6, 10.6, 10.6, 2.6),
        rect(9.8, 3.8, 10.6, 10.6, 2.6),
        circle(15.1, 9.1, 1.15, fill()),
        circle(7.7, 16.7, 1.15, fill()),
      ]),
    ],
    gAnims: { shake: tn("rotate", ["0 12 12.5", "0 12 12.5", "-6 12 12.5", "5 12 12.5", "0 12 12.5"], HOLD) },
  },

  /* drafting-compass — hinge + two legs over a swept arc; legs breathe */
  "drafting-compass": {
    auto: false,
    dur: 1.8,
    parts: [
      circle(12, 4.6, 1.7),
      G("legL", [path("M11.4 6.4L6.4 18.6")]),
      G("legR", [path("M12.6 6.4l5 12.2")]),
      path("M4.2 14.6a9.6 9.6 0 0 0 15.6 0"),
      path("M6.4 18.6l-1 1.8M17.6 18.6l1 1.8"),
    ],
    gAnims: {
      legL: tn("rotate", ["0 11.4 6.4", "0 11.4 6.4", "5 11.4 6.4", "0 11.4 6.4", "0 11.4 6.4"], HOLD),
      legR: tn("rotate", ["0 12.6 6.4", "0 12.6 6.4", "-5 12.6 6.4", "0 12.6 6.4", "0 12.6 6.4"], HOLD),
    },
  },

  /* drama — comedy & tragedy masks, overlapping */
  drama: {
    auto: true,
    dur: 1.9,
    parts: [
      path("M4.2 5.4c2.4-.9 4.8-1 7.2-.2.6.2 1 .8 1 1.4v3.2c0 3.2-2.1 5.6-4.9 5.6s-4.9-2.4-4.9-5.6V7c0-.6.5-1.2 1.6-1.6z"),
      path("M4.8 9h.2M8.8 9h.2", { "stroke-width": 2.6 }),
      path("M5.4 12.2c.5.9 1.3 1.4 2.3 1.4s1.8-.5 2.3-1.4"),
      path("M13.4 8.4c1.9-.7 3.8-.8 5.6-.2.5.2.9.7.9 1.3v2.5c0 2.5-1.7 4.4-3.9 4.4s-3.9-1.9-3.9-4.4V9.9c0-.6.4-1.2 1.3-1.5z"),
      path("M13.9 11.4h.2M17 11.4h.2", { "stroke-width": 2.6 }),
      path("M14.4 14.4c.4-.7 1-1.1 1.8-1.1.7 0 1.4.4 1.8 1.1"),
    ],
  },

  /* ferris-wheel — hub, spokes, rim rocking gently on the stand */
  "ferris-wheel": {
    auto: false,
    dur: 2.1,
    parts: [
      G("wheel", [
        /* three spokes, not four: eight radii in a 7-unit wheel left no air */
        circle(12, 10, 7),
        path("M12 3v14M5.94 6.5l12.12 7M18.06 6.5l-12.12 7"),
        circle(12, 10, 1.5, fill()),
      ]),
      path("M12 10L8 21.4M12 10l4 11.4M5.4 21.4h13.2"),
    ],
    gAnims: { wheel: tn("rotate", ["0 12 10", "0 12 10", "8 12 10", "-6 12 10", "0 12 10"], HOLD) },
  },

  /* flask-conical — canon flask, liquid line, a bubble rises */
  "flask-conical": {
    auto: false,
    dur: 1.9,
    parts: [
      path(FLASK),
      path(FLASK_RIM),
      path(FLASK_LEVEL),
      BUBBLE(11.4, 13.8, 4.4, 0.8),
    ],
  },

  /* flask-conical-off — flask + slash */
  "flask-conical-off": {
    auto: false,
    dur: 1.6,
    parts: [
      path(FLASK),
      path(FLASK_RIM),
      SLASH(),
    ],
  },

  /* flask-round — round bottom + slim neck, bubble rising */
  "flask-round": {
    auto: false,
    dur: 1.9,
    parts: [
      circle(12, 14.4, 6.2),
      path("M9.7 9.4V3.6h4.6v5.8"),
      line(8.6, 3.6, 15.4, 3.6),
      path("M7.6 15.2h8.8"),
      BUBBLE(12.6, 13.4, 3.6, 0.7),
    ],
  },

  /* forklift — cab body, mast, fork lifting a crate */
  forklift: {
    auto: false,
    dur: 1.9,
    parts: [
      path("M3.2 14.8V9.6c0-1 .8-1.8 1.8-1.8h2.4c1 0 1.8.8 1.8 1.8v5.2h1.8v3H3.2z"),
      path("M5.2 10h2.4v3H5.2z"),
      path("M14.6 5v13.6"),
      G("lift", [path("M17.4 5.6v11h3.2M17.4 16.6h3.6"), rect(18.2, 12.4, 3.6, 3.6, 0.8)]),
      circle(6.8, 19, 1.9),
      circle(14.6, 19, 1.9),
    ],
    gAnims: { lift: tn("translate", ["0 0", "0 0", "0 -1.4", "0 0", "0 0"], HOLD) },
  },

  /* gavel — head + handle swing down onto the block */
  gavel: {
    auto: false,
    dur: 1.7,
    parts: [
      G("strike", [
        path("M6.2 5.6c.9-.9 2.3-.9 3.2 0l3.4 3.4c.9.9.9 2.3 0 3.2l-.6.6c-.9.9-2.3.9-3.2 0l-3.4-3.4c-.9-.9-.9-2.3 0-3.2z"),
        path("M11.8 10.4l5.8 7"),
      ]),
      path("M15.8 20.4h4.8M17.4 18.6l1.6 1.8"),
    ],
    gAnims: { strike: tn("rotate", ["0 18.5 19", "0 18.5 19", "-13 18.5 19", "2 18.5 19", "0 18.5 19"], HOLD) },
  },

  /* ham — roast joint with the bone sticking out */
  "ham": { dur: 1.4, auto: true, parts: [
    path("M16 4.5c3 1 4.5 4 3.5 7.5s-4.5 6-8 6.5S5 17 4.5 14.5C4 12 6 8.5 9 6.5S14 3.7 16 4.5Z"),
    path("M8.5 15.5 4.5 19.5"),
    circle(3.8, 20.3, 1.2),
  ] },

  /* haze — sun arc over drifting fog bars */
  haze: {
    auto: false,
    dur: 2.0,
    parts: [
      path("M7.6 10.4a4.4 4.4 0 0 1 8.8 0"),
      path("M12 3.4v1.6M4.6 10.4H3M21 10.4h-1.6M7 5.8l1.2 1.2M17 5.8l-1.2 1.2"),
      SHIFT(path("M4.4 13.6h15.2"), 1, 0),
      SHIFT(path("M6.4 16.8h11.2"), -1, 0),
      SHIFT(path("M4.6 20h14.8"), 0.8, 0),
    ],
  },

  /* hop — conical bud with overlapping scale rows */
  hop: {
    auto: true,
    dur: 1.7,
    parts: [
      path("M12 4.4c-2.4.8-4.2 2.9-4.9 5.5-.4 1.6-.4 3.4 0 5 .7 2.3 2.1 4.2 4.1 5.2.6.3 1.1.3 1.6 0 2-1 3.4-2.9 4.1-5.2.4-1.6.4-3.4 0-5-.7-2.6-2.5-4.7-4.9-5.5z"),
      path("M12 4.4V2.6"),
      path("M8.2 10.6c1 1.1 2.5 1.7 4 1.4M15.8 10.6c-1 1.1-2.5 1.7-4 1.4"),
      path("M9.4 15.8c1.7.9 3.5.9 5.2 0"),
    ],
  },

  /* hop-off — bud + slash */
  "hop-off": {
    auto: false,
    dur: 1.6,
    parts: [
      path("M12 4.4c-2.4.8-4.2 2.9-4.9 5.5-.4 1.6-.4 3.4 0 5 .7 2.3 2.1 4.2 4.1 5.2.6.3 1.1.3 1.6 0 2-1 3.4-2.9 4.1-5.2.4-1.6.4-3.4 0-5-.7-2.6-2.5-4.7-4.9-5.5z"),
      SLASH(),
    ],
  },

  /* import — tray with open top, arrow drops in */
  import: {
    auto: false,
    dur: 1.6,
    parts: [
      path("M3.8 15v2.6c0 1.4 1.1 2.5 2.5 2.5h11.4c1.4 0 2.5-1.1 2.5-2.5V15"),
      path("M3.8 15V8.4c0-1.4 1.1-2.5 2.5-2.5h1.6M20.2 15V8.4c0-1.4-1.1-2.5-2.5-2.5h-1.6"),
      G("in", [line(12, 3.6, 12, 12.8), path("M7.6 9.4l4.4 4.4 4.4-4.4")]),
    ],
    gAnims: { in: tn("translate", ["0 0", "0 0", "0 1.6", "0 0", "0 0"], HOLD) },
  },

  /* lectern — slanted top, mic, column, foot */
  lectern: {
    auto: true,
    dur: 1.8,
    parts: [
      path("M5.6 9.4l12-2.6c.9-.2 1.8.4 2 1.3l.3 1.4c.2.9-.4 1.8-1.3 2l-12 2.6c-.9.2-1.8-.4-2-1.3l-.3-1.4c-.2-.9.4-1.8 1.3-2z"),
      path("M10.6 14.4l.8 5.4M8.4 20.6h7.2"),
      path("M14.8 8.8l1.8-3"),
      circle(17.2, 5, 0.9, fill()),
    ],
  },

  /* library-big — pediment, four columns, stacked steps */
  "library-big": {
    auto: true,
    dur: 1.9,
    parts: [
      path("M12 3.4l8.4 4.2H3.6L12 3.4z"),
      path("M6 11.4v4M10 11.4v4M14 11.4v4M18 11.4v4"),
      path("M4.6 18h14.8M3.4 21.2h17.2"),
    ],
  },

  /* life-buoy — ring + quarter straps; the buoy rocks on waves */
  "life-buoy": {
    auto: false,
    dur: 1.9,
    parts: [
      G("bob", [
        circle(12, 12, 8.2),
        circle(12, 12, 4.4),
        path("M6.3 6.3l2.5 2.5M17.7 6.3l-2.5 2.5M6.3 17.7l2.5-2.5M17.7 17.7l-2.5-2.5"),
      ]),
    ],
    gAnims: { bob: tn("rotate", ["0 12 12", "0 12 12", "-7 12 12", "6 12 12", "0 12 12"], HOLD) },
  },

  /* lollipop — swirl head on a stick */
  lollipop: {
    auto: true,
    dur: 1.6,
    parts: [
      circle(12, 9.4, 6.8),
      path("M12 9.4A1.5 1.5 0 0 1 15 9.4A3 3 0 0 1 9 9.4"),
      line(12, 16.2, 12, 21.2),
    ],
  },

  /* milk-off — canon carton + slash */
  "milk-off": {
    auto: false,
    dur: 1.6,
    parts: [
      path(MILK),
      SLASH(),
    ],
  },

  /* nut — hex bolt ring that ratchets a notch */
  nut: {
    auto: false,
    dur: 1.8,
    parts: [
      G("turn", [
        path("M12 3.6l7.2 4.2v8.4l-7.2 4.2-7.2-4.2V7.8z"),
        circle(12, 12, 3),
      ]),
    ],
    gAnims: { turn: tn("rotate", ["0 12 12", "0 12 12", "30 12 12", "30 12 12", "0 12 12"], [0, 0.3, 0.5, 0.8, 1]) },
  },

  /* nut-off — hex nut + slash */
  "nut-off": {
    auto: false,
    dur: 1.6,
    parts: [
      path("M12 3.6l7.2 4.2v8.4l-7.2 4.2-7.2-4.2V7.8z"),
      SLASH(),
    ],
  },

  /* paintbrush-vertical — brush dips into the cup */
  "paintbrush-vertical": {
    auto: false,
    dur: 1.7,
    parts: [
      G("brush", [
        path("M10.2 3.4h3.6v7.4"),
        path("M9 10.8h6v2.6c0 2.6-1.4 4.9-3 6-.4.3-1 .3-1.4-.2-1.2-1.7-1.8-3.7-1.6-5.8z"),
      ]),
      line(7.4, 21, 16.6, 21),
    ],
    gAnims: { brush: DIP(0, 1.2) },
  },

  /* parking-meter — dome head, dial, post, foot */
  "parking-meter": {
    auto: true,
    dur: 1.6,
    parts: [
      path("M8.4 4.8a3.6 3.6 0 0 1 7.2 0v2.4c0 1.2-1 2.2-2.2 2.2h-2.8c-1.2 0-2.2-1-2.2-2.2z"),
      path("M12 6.2v1.4"),
      line(12, 9.4, 12, 17.8),
      line(8.4, 20.6, 15.6, 20.6),
      line(9.4, 18, 14.6, 18),
    ],
  },

  /* pin-off — map pin + slash */
  "pin-off": {
    auto: false,
    dur: 1.6,
    parts: [
      path(PIN),
      circle(12, 10.3, 2.2),
      SLASH(),
    ],
  },

  /* plug-2 — twin pins into a barrel plug, cord hanging */
  "plug-2": {
    auto: true,
    dur: 1.5,
    parts: [
      path("M9 3.4v3.2M15 3.4v3.2"),
      path("M7.2 6.6h9.6v4.6c0 2.9-2.1 5.2-4.8 5.2s-4.8-2.3-4.8-5.2z"),
      line(12, 16.4, 12, 20.6),
    ],
  },

  /* popsicle — twin-line ice bar on a stick */
  popsicle: {
    auto: true,
    dur: 1.6,
    parts: [
      path("M8.2 13.4V6.6a3.8 3.8 0 0 1 7.6 0v6.8c0 1.8-1.4 3.2-3.2 3.2h-1.2c-1.8 0-3.2-1.4-3.2-3.2z"),
      line(12, 16.6, 12, 21.2),
      path("M10.6 10.4v3M13.4 10.4v3"),
    ],
  },

  /* rat — hunched body, round ear, long tail curling out */
  rat: {
    auto: true,
    dur: 1.8,
    parts: [
      path("M4.4 16.6c0-3.5 2.8-6.3 6.3-6.3 2.3 0 4.2 1.2 5.3 3l1.4 2.1h3c.7 0 1.2.7 1 1.4-.4 1.1-1.5 1.8-2.7 1.8h-2c-1.1 0-2 .9-2 2v.7H7.2c-1.5 0-2.8-1.2-2.8-2.7z"),
      circle(11.6, 10, 1.9),
      path("M4.4 18.8c-1.6.4-2.5 1.4-2.6 2.8"),
    ],
  },

  /* ratio — division: two rings split by the bar */
  ratio: {
    auto: true,
    dur: 1.5,
    parts: [
      circle(12, 6.6, 2.6),
      line(4.6, 12, 19.4, 12),
      circle(12, 17.4, 2.6),
    ],
  },

  /* roller-coaster — two humps of track on posts */
  "roller-coaster": {
    auto: true,
    dur: 1.9,
    parts: [
      path("M4.4 20.4v-6.8a3.2 3.2 0 0 1 6.4 0v.6c0 1.9 1.6 3.4 3.4 3.4s3.4-1.5 3.4-3.4v-2c0-2.2 1.8-4 4-4h0"),
      line(3.4, 20.4, 20.6, 20.4),
      path("M7.6 14.2v6.2M17.6 11.2v9.2"),
    ],
  },

  /* route-off — endpoint pins + connector + slash */
  "route-off": {
    auto: false,
    dur: 1.7,
    parts: [
      circle(17.4, 6.4, 2.4),
      circle(6.6, 17.6, 2.2),
      path("M17.4 8.8v1.6c0 1.4-1.1 2.6-2.6 2.6H9.2c-1.4 0-2.6 1.1-2.6 2.6v.2"),
      SLASH(),
    ],
  },

  /* shell — scallop fan with rib lines */
  "shell": { dur: 1.4, auto: true, parts: [
    path("M12 20 4.5 12C4.5 7.6 7.8 4.5 12 4.5s7.5 3.1 7.5 7.5Z"),
    path("M12 20V4.5M12 20 8.2 5.4M12 20l3.8-14.6"),
  ] },

  /* ship-wheel — helm: hub, rim, eight spokes; it turns */
  "ship-wheel": {
    auto: false,
    dur: 2.0,
    parts: [
      G("helm", [
        circle(12, 12, 5.2),
        path("M12 3.2v4M12 16.8v4M3.2 12h4M16.8 12h4M5.8 5.8l2.8 2.8M18.2 5.8l-2.8 2.8M5.8 18.2l2.8-2.8M18.2 18.2l-2.8-2.8"),
        circle(12, 12, 1.4),
      ]),
    ],
    gAnims: { helm: tn("rotate", ["0 12 12", "0 12 12", "32 12 12", "-24 12 12", "0 12 12"], HOLD) },
  },

  /* signpost-big — one big arrow board swinging on the post */
  "signpost-big": {
    auto: false,
    dur: 1.8,
    parts: [
      G("board", [path("M4.6 5.2h11.8l3.2 3.4-3.2 3.4H4.6c-1 0-1.8-.8-1.8-1.8V7c0-1 .8-1.8 1.8-1.8z")]),
      line(12, 12, 12, 20.2),
      line(8.4, 20.6, 15.6, 20.6),
    ],
    gAnims: { board: tn("rotate", ["0 12 8.6", "0 12 8.6", "-5 12 8.6", "4 12 8.6", "0 12 8.6"], HOLD) },
  },

  /* slice — wedge of pie, seed dots on top */
  slice: {
    auto: true,
    dur: 1.6,
    parts: [
      path("M6.2 6.8c3.8-1.8 7.8-1.8 11.6 0 1 .4 1.4 1.5.9 2.5l-5.4 9.8c-.5.9-1.7.9-2.2 0L5.3 9.3c-.5-1-.1-2.1.9-2.5z"),
      path("M10 8.8h.4M13.4 10.2h.4M11.4 12.8h.4", { "stroke-width": 2.6 }),
    ],
  },

  /* soup — bowl on a foot, three steam wisps rising */
  soup: {
    auto: false,
    dur: 2.0,
    parts: [
      path("M4.2 12.4h15.6c0 4-3.3 7.2-7.6 7.2h-.4c-4.3 0-7.6-3.2-7.6-7.2z"),
      line(8.6, 20.6, 15.4, 20.6),
      SHIFT(path("M9 9.6c-.6-1-.2-2 .4-2.8"), 0, -0.7),
      SHIFT(path("M12 9.6c-.6-1-.2-2 .4-2.8"), 0, -0.9),
      SHIFT(path("M15 9.6c-.6-1-.2-2 .4-2.8"), 0, -0.7),
    ],
  },

  /* spray-can — can with cap; mist puffs drift right */
  "spray-can": {
    auto: false,
    dur: 1.8,
    parts: [
      rect(7.4, 8, 7, 12.6, 1.8),
      path("M9.4 8V5.6h3.2V8"),
      path("M10 5.6h2V3.8h-2z"),
      A(circle(17.4, 5.2, 0.8, fill()), [an("cx", ["16.4", "16.4", "18.6", "18.6"], [0, 0.2, 0.65, 1]), an("opacity", ["0", "1", "1", "0"], [0, 0.2, 0.65, 1])]),
      A(circle(16.6, 7.6, 0.7, fill()), [an("cx", ["15.6", "15.6", "18", "18"], [0, 0.35, 0.8, 1]), an("opacity", ["0", "1", "1", "0"], [0, 0.35, 0.8, 1])]),
    ],
  },

  /* swatch-book — cascade of three swatch cards */
  "swatch-book": {
    auto: true,
    dur: 1.8,
    parts: [
      rect(3.8, 4.2, 8.4, 8.4, 1.8),
      rect(7.8, 8.2, 8.4, 8.4, 1.8),
      rect(11.8, 12.2, 8.4, 8.4, 1.8),
      circle(16, 16.4, 1, fill()),
    ],
  },

  /* swords — crossed blades that clash */
  swords: {
    auto: false,
    dur: 1.7,
    parts: [
      G("clash", [
        /* single-stroke blades, guards and grips — the outlined blades
           were 1.4 apart and filled in */
        line(4.4, 4.4, 14.4, 14.4),
        line(12.4, 16.4, 16.4, 12.4),
        line(16.2, 16.2, 19.4, 19.4),
        line(19.6, 4.4, 9.6, 14.4),
        line(7.6, 12.4, 11.6, 16.4),
        line(7.8, 16.2, 4.6, 19.4),
      ]),
    ],
    gAnims: { clash: tn("rotate", ["0 12 12", "0 12 12", "-3 12 12", "3 12 12", "0 12 12"], HOLD) },
  },

  /* theater — twin spotlights washing a little mask */
  "theater": { dur: 1.4, auto: true, parts: [
    path("M3.5 6.2Q8.5 4.6 13.5 6.2V11.8C13.5 15.4 11.3 18.6 8.5 18.6S3.5 15.4 3.5 11.8Z"),
    path("M6 10.2q.9-1.1 1.8 0M9.2 10.2q.9-1.1 1.8 0"),
    path("M6.1 13.6q2.4 2.4 4.8 0"),
    path("M14.6 4.9Q17.6 3.8 20.5 5V10.4C20.5 14 18.6 16.9 16.2 17"),
    path("M17.8 9.6h1.6M17.6 13.4q1.1-1 2.2 0"),
  ] },

  /* toy-brick — stud brick that lands with a settle */
  "toy-brick": {
    auto: false,
    dur: 1.6,
    parts: [
      G("drop", [
        rect(4.2, 9.4, 15.6, 10.2, 1.7),
        path("M7.4 9.4V6.6h3.4v2.8M13.2 9.4V6.6h3.4v2.8"),
      ]),
    ],
    gAnims: { drop: tn("translate", ["0 0", "0 0", "0 0.9", "0 -0.3", "0 0"], HOLD) },
  },

  /* tractor — big rear wheel, little front, cab + exhaust puff */
  tractor: {
    auto: false,
    dur: 2.0,
    parts: [
      circle(7.2, 15.8, 4.6),
      circle(7.2, 15.8, 1.6),
      circle(18, 17.6, 2.4),
      path("M9.8 15.8V9.2c0-.9.7-1.6 1.6-1.6h1.4V5.4c0-.9.7-1.6 1.6-1.6h3c.9 0 1.7.7 1.8 1.6l.4 4.4h1.2c.8 0 1.4.6 1.4 1.4v2.4c0 .8-.6 1.4-1.4 1.4h-.8"),
      path("M18.6 9.8V7.6"),
      A(circle(18.6, 6, 0.7, fill()), [
        an("cy", ["6.6", "6.6", "4.2", "4.2"], [0, 0.25, 0.75, 1]),
        an("opacity", ["0", "1", "1", "0"], [0, 0.25, 0.75, 1]),
      ]),
    ],
  },

  /* train-front — head-on rail car, lights blinking */
  "train-front": {
    auto: false,
    dur: 1.8,
    parts: [
      path("M6.4 3.6h11.2c1.4 0 2.6 1.2 2.6 2.6v8.4c0 2-1.6 3.6-3.6 3.6H9.4c-2 0-3.6-1.6-3.6-3.6V6.2c0-1.4.2-2.6.6-2.6z"),
      path("M5.8 10.4h12.4"),
      path("M9.4 6.8h5.2"),
      A(path("M8.2 14.8h.4M15.4 14.8h.4", { "stroke-width": 2.6 }), BLINK(0.15)),
      path("M8.6 18.2L7 21M15.4 18.2L17 21"),
    ],
  },

  /* train-front-tunnel — the same car framed in a tunnel arch */
  "train-front-tunnel": {
    auto: false,
    dur: 1.8,
    parts: [
      path("M4.2 20.8v-8a7.8 7.8 0 0 1 15.6 0v8"),
      path("M8.6 8.6h6.8c1 0 1.9.8 1.9 1.9v5c0 1.3-1 2.4-2.4 2.4H9c-1.4 0-2.4-1.1-2.4-2.4v-5c0-1.1.9-1.9 2-1.9z"),
      path("M7.4 13.4h9.2"),
      A(path("M9 16.2h.3M14.7 16.2h.3", { "stroke-width": 2.6 }), BLINK(0.15)),
    ],
  },

  /* train-track — converging rails on widening ties */
  "train-track": {
    auto: true,
    dur: 1.8,
    parts: [
      path("M9.4 3.4L5.2 20.6M14.6 3.4l4.2 17.2"),
      path("M8.6 7.2h6.8M7.8 11.2h8.4M6.9 15.2h10.2M5.9 19.2h12.2"),
    ],
  },

  /* unplug — plug drifting free of the socket */
  "unplug": { dur: 1.4, auto: true, parts: [
    path("M16.56 9.56L14.09 12.04M14.44 7.44L11.96 9.91M19.39 4.61L20.1 3.9"),
    path("M16.35 9.35L14.65 7.65A2 2 0 0 1 14.65 4.82L15.71 3.76A2 2 0 0 1 18.54 3.76L20.24 5.46A2 2 0 0 1 20.24 8.29L19.18 9.35A2 2 0 0 1 16.35 9.35Z"),
    path("M9.06 12.82L11.18 14.94A2 2 0 0 1 11.18 17.77L9.41 19.54A2 2 0 0 1 6.59 19.54L4.46 17.41A2 2 0 0 1 4.46 14.59L6.23 12.82A2 2 0 0 1 9.06 12.82Z"),
    path("M7.58 14.44L6.73 15.29M9.56 16.42L8.71 17.27M5.53 18.47L3.4 20.6"),
  ] },

  /* utensils-crossed — fork & knife in an X */
  "utensils-crossed": {
    auto: true,
    dur: 1.8,
    parts: [
      path("M17.2 3.8l1.6 3.6 1.6-3.6M18.8 7.4L7.2 19.6M7.2 19.6l-1.4 1.4"),
      path("M6.8 3.8c.4 1.9 1.3 3.5 2.7 4.8l7 7.6"),
      path("M16.5 16.2l1.8 4"),
    ],
  },

  /* utility-pole — pole, crossarm, sagging wires that breathe */
  "utility-pole": {
    auto: false,
    dur: 2.0,
    parts: [
      line(12, 4, 12, 20.6),
      line(6.8, 6.8, 17.2, 6.8),
      path("M8 6.8v1.6M16 6.8v1.6"),
      SHIFT(path("M8 8.4c-2.3 1.3-4.2 1.3-5.8.4M16 8.4c2.3 1.3 4.2 1.3 5.8.4"), 0, 0.5),
    ],
  },

  /* vegan — leaf with the center vein */
  vegan: {
    auto: true,
    dur: 1.7,
    parts: [
      path("M4.6 19.4C4.6 11.9 10.4 5.6 19.4 4.6c-.9 9-7.5 14.8-14.8 14.8z"),
      path("M7.4 16.6c2.9-3.1 6.2-5.7 10.4-7.4"),
    ],
  },

  /* venetian-mask — mask with eye slits + the holding stick */
  "venetian-mask": {
    auto: true,
    dur: 1.8,
    parts: [
      path("M3.4 8.2c2.7-1.3 6.4-1.5 8.6-.6 2.2-.9 5.9-.7 8.6.6.9.4 1.4 1.2 1.4 2.2 0 3.4-2.8 5.5-6.6 5.5-1.9 0-3.4-.7-3.4-.7s-1.5.7-3.4.7c-3.8 0-6.6-2.1-6.6-5.5 0-1 .5-1.8 1.4-2.2z"),
      path("M7.2 11c.9-.8 2.3-.8 3.1 0M13.7 11c.9-.8 2.3-.8 3.1 0"),
      line(19.8, 14.6, 20.6, 20.4),
    ],
  },

  /* volleyball — seam swooshes; the ball spins continuously */
  volleyball: {
    auto: false,
    dur: 2.2,
    pp: false,
    parts: [
      G("spin", [
        circle(12, 12, 8.2),
        path("M8.6 4.6c-2.5 2.5-3.4 5.9-2.9 9.4"),
        path("M18.8 7.2c-3.3.2-6.2 2.2-8.1 5.1"),
        path("M13.6 20.1c-1.3-3-1.3-6.5.1-9.5"),
      ]),
    ],
    gAnims: { spin: tn("rotate", ["0 12 12", "360 12 12"]) },
  },

  /* weight — ring-handled weight that lifts and settles */
  weight: {
    auto: false,
    dur: 1.8,
    parts: [
      G("lift", [
        circle(12, 14.8, 6.6),
        path("M9.4 9V7a2.6 2.6 0 0 1 5.2 0v2"),
      ]),
    ],
    gAnims: { lift: tn("translate", ["0 0", "0 0", "0 -1.6", "0 -1.6", "0 0"], [0, 0.3, 0.55, 0.8, 1]) },
  },

  /* wheat-off — canon wheat + slash */
  "wheat-off": {
    auto: false,
    dur: 1.6,
    parts: [
      path(WHEAT, { fill: "currentColor" }),
      SLASH(),
    ],
  },

  /* wind-arrow-down — gust lines + an arrow dipping down */
  "wind-arrow-down": {
    auto: false,
    dur: 1.8,
    parts: [
      path("M3.4 9.2h7.4c1.4 0 2.5-1.1 2.5-2.5s-1.1-2.5-2.5-2.5c-1.2 0-2.2.8-2.4 1.9"),
      path("M3.4 13.4h8.6c1.6 0 2.8-1.2 2.8-2.7"),
      G("down", [line(18.2, 8.8, 18.2, 17.8), path("M15 14.6l3.2 3.2 3.2-3.2")]),
    ],
    gAnims: { down: DIP(0, 1.6) },
  },

  /* wine-off — canon glass + slash */
  "wine-off": {
    auto: false,
    dur: 1.6,
    parts: [
      path(WINE),
      SLASH(),
    ],
  },
};
