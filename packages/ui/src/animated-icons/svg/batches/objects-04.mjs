const path = (d, a = {}) => ({ e: "path", a: { d, ...a } });
const circle = (cx, cy, r, a = {}) => ({ e: "circle", a: { cx, cy, r, ...a } });
const line = (x1, y1, x2, y2, a = {}) => ({ e: "line", a: { x1, x2, y1, y2, ...a } });
const rect = (x, y, w, h, rx, a = {}) => ({ e: "rect", a: { x, y, width: w, height: h, rx, ...a } });
const ellipse = (cx, cy, rx, ry, a = {}) => ({ e: "ellipse", a: { cx, cy, rx, ry, ...a } });
const fill = (color = "currentColor") => ({ fill: color, stroke: "none" });
const A = (part, anims) => ({ ...part, anims });
const G = (id, children, a = {}) => ({ e: "g", g: id, a, children });
const an = (attr, values, times) => ({ kind: "attr", attr, values, times });
const tn = (type, values, times, extra = {}) => ({ kind: "transform", type, values, times, ...extra });

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
/* trace — the stroke writes itself on (checks, signatures, loops). */
const DRAW = (p, t0 = 0.15, t1 = 0.62) =>
  A({ ...p, a: { ...p.a, pathLength: 1, "stroke-dasharray": 1 } },
    [an("stroke-dashoffset", ["1", "1", "0", "0"], [0, t0, t1, 1])]);
/* the mute slash — blinks once, held by the rest phrasing (for *-off). */
const SLASH = (x1, y1, x2, y2) => A(line(x1, y1, x2, y2), BLINK(0.15));
/* a drop that falls out of a spout/head and fades (faucets, showers). */
const DROP = (cx, cy, fall = 2.4, t0 = 0.3) =>
  A(circle(cx, cy, 0.62, fill()), [
    an("cy", [`${cy}`, `${cy}`, `${cy + fall}`, `${cy + fall}`], [0, t0, Math.min(t0 + 0.3, 0.85), 1]),
    an("opacity", ["0", "1", "1", "0", "0"], [t0 - 0.08 > 0 ? t0 - 0.08 : 0, t0, Math.min(t0 + 0.22, 0.8), Math.min(t0 + 0.38, 0.9), 1]),
  ]);

/** Scalloped bloom — cosine radius modulation (same recipe as the core gear). */
function flowerPath(cx, cy, lobes, rMid, amp, steps = 14) {
  const pts = [];
  for (let i = 0; i < lobes * steps; i++) {
    const t = (i / (lobes * steps)) * Math.PI * 2;
    const r = rMid + amp * Math.cos(lobes * t + Math.PI / 2);
    pts.push(`${(cx + r * Math.cos(t)).toFixed(2)} ${(cy + r * Math.sin(t)).toFixed(2)}`);
  }
  return `M${pts.join("L")}Z`;
}

/* ---------- shared silhouettes (kept verbatim from canon glyphs) ---------- */

/** monitor: rounded screen + stem + foot. interior center ~ (12, 10.4). */
const SCREEN = rect(3, 4.2, 18, 12.4, 2.5);
const STAND = path("M12 16.6v2.6");
const FOOT = line(8.6, 19.8, 15.4, 19.8);

/** smartphone body: rounded bar, speaker slit + home dash. */
const PHONE = rect(7.6, 2.8, 8.8, 18.4, 2.7);

/** server row: rounded slab with led dot + slot line. */
const SERVER_TOP = rect(4.2, 4.4, 15.6, 6.6, 1.9);
const SERVER_BOT = rect(4.2, 13, 15.6, 6.6, 1.9);

/** map-pin body — teardrop, interior ring centre ~ (12, 10.2). */
const PIN = "M12 21.5S19.3 15.4 19.3 10.2A7.3 7.3 0 1 0 4.7 10.2C4.7 15.4 12 21.5 12 21.5Z";

/** shield body — badge curve, interior centre ~ (12, 12.4). */
const SHIELD = "M12 3.4C14.3 4.8 16.9 5.6 19.3 5.8C20.2 5.9 21 6.7 21 7.6L21 11.7C21 15.9 17.4 18.4 13.7 20.6C12.7 21.1 11.3 21.1 10.3 20.6C6.6 18.4 3 15.9 3 11.7L3 7.6C3 6.7 3.8 5.9 4.7 5.8C7.1 5.6 9.7 4.8 12 3.4Z";

/** shipping box — hex-ish carton; seam across the top face. */
const PKG = "M12 3.4L16 5.6Q20 7.8 20 12Q20 16.2 16 18.4Q12 20.6 8 18.4L4 16.2L4 7.8Z";
const PKG_SEAM = "M4 7.8L8 10Q12 12.2 16 10L20 7.8";
const PKG_EDGE = "M12 12.2L12 20.6";

/** ticket — side notches + centre space for a mark (~ (10.6, 13.6)). */
const TICKET =
  "M4.5 7.6L19.5 7.6C20 7.6 20.4 8 20.4 8.5L20.4 10.2C19 10.8 18 12.1 18 13.6S19 16.4 20.4 17L20.4 18.7C20.4 19.2 20 19.6 19.5 19.6L4.5 19.6C4 19.6 3.6 19.2 3.6 18.7L3.6 17C5 16.4 6 15.1 6 13.6S5 10.8 3.6 10.2L3.6 8.5C3.6 8 4 7.6 4.5 7.6Z";

/** bluetooth bind-rune — angular by nature, softened by round joins. */
const BT = "M6.8 7.4L16.4 17L12.4 20.9C12.2 21.1 11.9 21 11.9 20.6L11.9 3.4C11.9 3 12.2 2.9 12.4 3.1L16.4 7L6.8 16.6";

/** wifi fan — three arcs fanning up from the dot. */
const WIFI_A = "M9.3 16.3C10 15.6 11 15.1 12 15.1S14 15.6 14.7 16.3";
const WIFI_B = "M6.4 13.5C8 11.9 9.9 11 12 11S16 11.9 17.6 13.5";
const WIFI_C = "M3.4 10.5C5.9 8.1 8.9 6.8 12 6.8S18.1 8.1 20.6 10.5";
const WIFI_DOT = circle(12, 19.2, 1.15, fill());

/** speaker cone — the volume horn, open side right. */
const SPEAKER =
  "M11.5 4.7C12.3 4.7 12.9 5.3 12.9 6.1L12.9 17.9C12.9 18.7 12.3 19.3 11.5 19.3C11.1 19.3 10.7 19.1 10.3 18.8L8.8 17.1Q7.3 15.4 6.35 15.4L5.4 15.4C4.2 15.4 3.4 14.6 3.4 13.4L3.4 10.6C3.4 9.4 4.2 8.6 5.4 8.6L6.35 8.6Q7.3 8.6 8.8 6.9L10.3 5.2C10.7 4.9 11.1 4.7 11.5 4.7Z";

/** magnifier — ring at (11,11) r8 + handle to bottom-right. */
const GLASS = circle(11, 11, 8);
const GLASS_H = line(16.9, 16.9, 20.6, 20.6);

/** scan brackets — four rounded corner ticks. */
const SCAN_TL = path("M3.4 7.3L3.4 6C3.4 4.6 4.5 3.4 6 3.4L7.3 3.4");
const SCAN_TR = path("M16.7 3.4L18 3.4C19.4 3.4 20.6 4.5 20.6 6L20.6 7.3");
const SCAN_BR = path("M20.6 16.7L20.6 18C20.6 19.4 19.5 20.6 18 20.6L16.7 20.6");
const SCAN_BL = path("M7.3 20.6L6 20.6C4.6 20.6 3.4 19.5 3.4 18L3.4 16.7");

/** bug — dome body, head arc, antennae, six legs, centre seam. */
const BUG_BODY = "M12 8.5C9.1 8.5 6.8 10.8 6.8 13.7L6.8 15.8C6.8 18.7 9.1 21 12 21S17.2 18.7 17.2 15.8L17.2 13.7C17.2 10.8 14.9 8.5 12 8.5Z";
const BUG_HEAD = "M9.7 8.6A2.3 2.3 0 0 1 14.3 8.6";
const BUG_ANT = "M10.3 6.6C9.5 5.7 8.8 4.9 7.9 4.4M13.7 6.6C14.5 5.7 15.2 4.9 16.1 4.4";
const BUG_LEGS = "M7.2 13.5L4.4 13.5M7.4 16.4L4.6 18M7.6 11.2L5 9.7M16.8 13.5L19.6 13.5M16.6 16.4L19.4 18M16.4 11.2L19 9.7";

/** floppy body + shutter + label slot. */
const SAVE_BODY =
  "M5.4 3.4L14.8 3.4C15.4 3.4 16 3.6 16.4 4.1L19.9 7.6C20.3 8 20.6 8.6 20.6 9.2L20.6 18.6C20.6 19.6 19.8 20.6 18.8 20.6L5.2 20.6C4.2 20.6 3.4 19.6 3.4 18.6L3.4 5.4C3.4 4.4 4.2 3.4 5.4 3.4Z";
const SAVE_SHUT = rect(7.2, 3.4, 6.6, 5, 0.9);
const SAVE_SLOT = path("M7.6 20.6L7.6 16.4C7.6 16 8 15.6 8.4 15.6L15.6 15.6C16 15.6 16.4 16 16.4 16.4L16.4 20.6");

/** small marks (for pin/shield/box interiors). */
const CHECK_D = "M9.3 12.5l2 2 3.7-4.1";
const XMARK = "M9.6 10.2l4.8 4.8M14.4 10.2l-4.8 4.8";
const PLUS_D = "M12 9.9v5M9.5 12.4h5";
const MINUS_D = "M9.6 12.4h4.8";

/* objects-04 — devices / media / home objects / weather extras.
 * Soft blob silhouettes, stroke 2, live area [2.5, 21.5]. Default gesture is
 * draw-on (auto); entries with auto:false carry a bespoke gesture — the lamp
 * glows, the washer spins, the toggle slides, the pin drops. */

/** Small cog (STYLE.md accents): ring + 6 short spokes. A scalloped bloom
 *  under ~10px fuses into a blob; spokes stay readable down to 16px. */
const cog = (cx, cy, s = 1) => {
  const r = (v) => +v.toFixed(2);
  let d = "";
  for (let i = 0; i < 6; i++) {
    const t = (i / 6 + 1 / 12) * Math.PI * 2;
    d += `M${r(cx + 3.3 * s * Math.cos(t))} ${r(cy + 3.3 * s * Math.sin(t))}L${r(cx + 3.9 * s * Math.cos(t))} ${r(cy + 3.9 * s * Math.sin(t))}`;
  }
  return [circle(cx, cy, r(2.3 * s)), path(d)];
};

export const icons = {
  /* ============================ DEVICES ============================ */

  /* vent grille up top; three warm streams drift down and fade */
  "air-vent": {
    dur: 2.1,
    auto: false,
    parts: [
      rect(3.4, 4, 17.2, 6.6, 1.9),
      path("M6.6 7.3h10.8"),
      G("flow", [
        path("M7.2 13c.7 1.1-.5 2 .3 3.2"),
        path("M12 13c.7 1.1-.5 2 .3 3.2"),
        path("M16.8 13c.7 1.1-.5 2 .3 3.2"),
      ]),
    ],
    gAnims: {
      flow: [
        tn("translate", ["0 0", "0 0", "0 1.5", "0 1.5"], [0, 0.15, 0.62, 1]),
        an("opacity", ["0.35", "1", "1", "0.35", "0.35"], [0, 0.15, 0.55, 0.8, 1]),
      ],
    },
  },

  /* beaming screen — the wedge lifts up out of the display */
  airplay: {
    dur: 1.7,
    auto: false,
    parts: [
      rect(3.4, 4.2, 17.2, 10.8, 2.4),
      G("beam", [path("M9.1 19.6L12 15.6L14.9 19.6Z", fill())]),
    ],
    sAnims: { beam: { pivot: [12, 17.6], anim: tn("scale", ["0.7", "0.7", "1", "1"], [0, 0.3, 0.62, 1]) } },
  },

  /* tub + faucet; a drop beads and falls */
  bath: {
    dur: 2.0,
    auto: false,
    parts: [
      path("M3.6 12.4h16.8"),
      path("M4.8 12.4v1.7c0 2.6 2 4.8 4.6 4.8h5.2c2.6 0 4.6-2.2 4.6-4.8v-1.7"),
      path("M6.8 10.4V7.4c0-1.5 1.2-2.7 2.7-2.7 1 0 1.9.6 2.3 1.4"),
      path("M6.4 19.4l-.9 1.5M17.6 19.4l.9 1.5"),
      G("drip", [circle(9.5, 10.8, 0.6, fill(), { opacity: 0 })]),
    ],
    gAnims: {
      drip: [
        tn("translate", ["0 0", "0 0", "0 3.4", "0 3.4"], [0, 0.32, 0.68, 1]),
        an("opacity", ["0", "1", "1", "0", "0"], [0, 0.32, 0.55, 0.7, 1]),
      ],
    },
  },

  /* rune + paired dots — the link blinks in from both sides */
  "bluetooth-connected": {
    dur: 1.7,
    auto: false,
    parts: [
      path(BT),
      A(circle(4.2, 12, 0.95, fill()), [an("opacity", ["1", "1", "0.2", "1", "1"], [0, 0.1, 0.5, 0.62, 1])]),
      A(circle(19.8, 12, 0.95, fill()), [an("opacity", ["1", "0.2", "1", "1"], [0.1, 0.45, 0.68, 1])]),
    ],
  },

  "bluetooth-off": {
    parts: [path(BT), SLASH(4.2, 4.2, 19.8, 19.8)],
    auto: false,
    dur: 1.5,
  },

  /* searching — a radar arc sweeps at the rune's edge */
  "bluetooth-searching": {
    dur: 1.8,
    auto: false,
    parts: [
      path(BT),
      A(path("M17.4 9.2a4.2 4.2 0 0 1 0 5.6"), [an("opacity", ["0.25", "1", "0.25", "0.25"], [0, 0.3, 0.6, 1])]),
      A(path("M19.6 7a7.6 7.6 0 0 1 0 10"), [an("opacity", ["0.25", "0.25", "1", "0.25"], [0, 0.35, 0.7, 1])]),
    ],
  },

  /* shoulder box — woofers thump */
  "boom-box": { dur: 1.4, auto: true, parts: [
    rect(2.5, 8, 19, 12, 2.5),
    path("M7 8V5.5h10V8"),
    circle(7.8, 14, 2.3),
    circle(16.2, 14, 2.3),
    path("M10.8 12.2h2.4"),
  ] },

  /* rounded bot head + antenna nub + eyes, struck through */
  "bot-off": {
    auto: false,
    dur: 1.6,
    parts: [
      rect(5.2, 8.2, 13.6, 10.2, 3),
      path("M12 8.2V5.8"),
      circle(12, 4.6, 1, fill()),
      circle(9.4, 13.2, 0.85, fill()),
      circle(14.6, 13.2, 0.85, fill()),
      SLASH(3.8, 3.8, 20.2, 20.2),
    ],
  },

  "bug-off": {
    auto: false,
    dur: 1.6,
    parts: [path(BUG_BODY), path(BUG_HEAD), path(BUG_ANT), path("M12 11L12 19.5"), path(BUG_LEGS), SLASH(3.6, 3.4, 20.4, 20.6)],
  },

  /* play glyph sits inside the shell — pops once */
  "bug-play": {
    auto: false,
    dur: 1.6,
    parts: [
      path(BUG_BODY),
      path(BUG_HEAD),
      path(BUG_ANT),
      path(BUG_LEGS),
      G("play", [path("M10.7 12.1l3.6 2.5-3.6 2.5z", fill())]),
    ],
    sAnims: { play: POP(12.5, 14.6, 1.3) },
  },

  /* CC card — the letters write on */
  captions: {
    auto: false,
    dur: 1.6,
    parts: [
      rect(3, 5.6, 18, 12.8, 2.4),
      DRAW(path("M10 10.5c-1.2-.7-2.6.2-2.6 1.5s1.4 2.2 2.6 1.5"), 0.18, 0.6),
      DRAW(path("M16.8 10.5c-1.2-.7-2.6.2-2.6 1.5s1.4 2.2 2.6 1.5"), 0.32, 0.72),
    ],
  },

  "captions-off": {
    auto: false,
    dur: 1.6,
    parts: [
      rect(3, 5.6, 18, 12.8, 2.4),
      path("M10 10.5c-1.2-.7-2.6.2-2.6 1.5s1.4 2.2 2.6 1.5"),
      path("M16.8 10.5c-1.2-.7-2.6.2-2.6 1.5s1.4 2.2 2.6 1.5"),
      SLASH(3.6, 3.6, 20.4, 20.4),
    ],
  },

  /* board + copper traces — the traces route themselves on */
  "circuit-board": {
    auto: false,
    dur: 1.8,
    parts: [
      rect(3.6, 3.6, 16.8, 16.8, 2.4),
      DRAW(path("M8 16.8V12l3.4-3.4h2"), 0.12, 0.55),
      DRAW(path("M16.4 7.4v3.8L13.8 14"), 0.28, 0.7),
      circle(8, 16.8, 0.9, fill()),
      circle(16.4, 7.4, 0.9, fill()),
      circle(13.4, 8.6, 0.9, fill()),
      circle(13.8, 14, 0.9, fill()),
    ],
  },

  /* vinyl — outer rim, label, two sheen arcs that slowly sweep */
  "disc-3": {
    dur: 2.1,
    pp: false,
    auto: false,
    parts: [
      circle(12, 12, 8.6),
      circle(12, 12, 2.6),
      circle(12, 12, 0.6, fill()),
      G("spin", [
        path("M15.6 7.4a6.2 6.2 0 0 1 1.4 3.8"),
        path("M8.4 16.6a6.2 6.2 0 0 1-1.4-3.8"),
      ]),
    ],
    gAnims: { spin: tn("rotate", ["0 12 12", "360 12 12"]) },
  },

  /* printed sleeve — the disc slides a peek out of the jacket */
  "disc-album": {
    dur: 1.8,
    auto: false,
    parts: [
      rect(3.4, 4.4, 13.8, 15.2, 2.2),
      G("disc", [circle(16.6, 12, 4.6), circle(16.6, 12, 1.5)]),
      path("M6.8 8.4h4.6"),
    ],
    gAnims: { disc: tn("translate", ["0 0", "0 0", "1.6 0", "1.6 0", "0 0", "0 0"], [0, 0.15, 0.5, 0.72, 0.95, 1]) },
  },

  /* dock connector — wide puck, centre slot breathes */
  dock: {
    auto: false,
    dur: 1.6,
    parts: [
      rect(3.4, 8.4, 17.2, 8.4, 2.4),
      A(path("M9.2 12.6h5.6"), [an("opacity", ["1", "1", "0.3", "1", "1"], [0, 0.3, 0.5, 0.75, 1])]),
      circle(7.2, 12.6, 0.6, fill()),
    ],
  },

  "flashlight-off": {
    auto: false,
    dur: 1.6,
    parts: [
      path("M17.3 8.8L6.7 8.8L7.55 7.25Q8.4 5.7 12 5.7Q15.6 5.7 16.45 7.25L17.3 8.8Z"),
      path("M8.4 8.8L8.4 17.6C8.4 18.4 9 19 9.8 19L14.2 19C15 19 15.6 18.4 15.6 17.6L15.6 8.8"),
      path("M11 12.1L13 12.1"),
      SLASH(3.6, 3.2, 20.4, 20.8),
    ],
  },

  /* focus brackets + centre ring locks on with a pop */
  focus: {
    auto: false,
    dur: 1.6,
    parts: [
      SCAN_TL,
      SCAN_TR,
      SCAN_BR,
      SCAN_BL,
      G("dot", [circle(12, 12, 2.9), circle(12, 12, 0.7, fill())]),
    ],
    sAnims: { dot: POP(12, 12, 1.22) },
  },

  /* tray drive + arrow that drops a payload in */
  "hard-drive-download": {
    auto: false,
    dur: 1.7,
    parts: [
      path("M5.6 10.6l2.1-5c.3-.7.9-1.2 1.7-1.2h5.2c.8 0 1.4.5 1.7 1.2l2.1 5"),
      rect(3.4, 10.6, 17.2, 9, 2),
      G("arrow", [path("M12 4.4v3.4M10.3 6.1l1.7 1.7 1.7-1.7")]),
      circle(17.6, 15.1, 0.55, fill()),
      path("M6.6 15.1h4"),
    ],
    gAnims: { arrow: tn("translate", ["0 0", "0 0", "0 2", "0 2", "0 0", "0 0"], [0, 0.15, 0.5, 0.66, 0.92, 1]) },
  },

  "hard-drive-upload": {
    auto: false,
    dur: 1.7,
    parts: [
      path("M5.6 10.6l2.1-5c.3-.7.9-1.2 1.7-1.2h5.2c.8 0 1.4.5 1.7 1.2l2.1 5"),
      rect(3.4, 10.6, 17.2, 9, 2),
      G("arrow", [path("M12 8.4V5.6M10.3 7.2L12 5.5l1.7 1.7")]),
      circle(17.6, 15.1, 0.55, fill()),
      path("M6.6 15.1h4"),
    ],
    gAnims: { arrow: tn("translate", ["0 1.6", "0 1.6", "0 0", "0 0", "0 1.6", "0 1.6"], [0, 0.15, 0.5, 0.66, 0.92, 1]) },
  },

  /* hdmi socket — keyed trapezoid, pin row */
  "hdmi-port": {
    auto: false,
    dur: 1.5,
    parts: [
      path("M4.6 9.2h14.8c.5 0 .8.4.7.9l-1.4 4.5c-.2.5-.5.8-1 .8H6.3c-.5 0-.8-.3-1-.8l-1.4-4.5c-.1-.5.2-.9.7-.9z"),
      path("M7.6 12h8.8"),
      path("M9.2 12v-1.6M12 12v-1.6M14.8 12v-1.6"),
    ],
  },

  /* pendant lamp — cord, dome, glow rays that fade up */
  "lamp-ceiling": {
    auto: false,
    dur: 1.8,
    parts: [
      path("M12 2.8v4.4"),
      path("M6.4 13.2c0-3 2.5-5.4 5.6-5.4s5.6 2.4 5.6 5.4z"),
      circle(12, 14.6, 0.7, fill()),
      G("glow", [path("M8.2 16.4l-1.4 2M12 17.2v2.4M15.8 16.4l1.4 2")]),
    ],
    gAnims: { glow: [an("opacity", ["0.25", "1", "0.25", "0.25"], [0, 0.3, 0.65, 1])] },
  },

  /* anglepoise — arm + tilted shade + a warm cone of light */
  "lamp-desk": {
    auto: false,
    dur: 1.8,
    parts: [
      path("M9 20.5h8.5"),
      path("M13.5 20.5L15.9 12.4"),
      path("M12 11C11.7 6.6 15.4 4 18.3 5.5C21.2 7 21.5 10.9 20.4 13.2L12 11Z"),
      G("glow", [path("M14.6 15.6l-.6 1.9M17.8 15.9l.2 2")]),
    ],
    gAnims: { glow: [an("opacity", ["0.25", "1", "0.25", "0.25"], [0, 0.3, 0.65, 1])] },
  },

  /* floor lamp — pole, drum shade, glow pooling beneath */
  "lamp-floor": {
    auto: false,
    dur: 1.8,
    parts: [
      path("M12 20.6V10"),
      path("M8.4 20.6h7.2"),
      path("M8.2 9.8l1-5.4h5.6l1 5.4z"),
      G("glow", [path("M9.4 12.4l-.9 1.8M12 13v2.2M14.6 12.4l.9 1.8")]),
    ],
    gAnims: { glow: [an("opacity", ["0.25", "1", "0.25", "0.25"], [0, 0.3, 0.65, 1])] },
  },

  /* sconce firing down the wall — shade + warm wash below */
  "lamp-wall-down": { dur: 1.4, auto: true, parts: [
    path("M7.5 9h9l3 6.5h-15Z"),
    path("M3.5 7v10M3.5 12h4"),
    path("M9 19v1.5M12 19v2M15 19v1.5"),
  ] },

  /* uplight sconce — glow washes up the wall */
  "lamp-wall-up": { dur: 1.4, auto: true, parts: [
    path("M7.5 15h9l3-6.5h-15Z"),
    path("M3.5 7v10M3.5 12h4"),
    path("M9 5v-1.5M12 5V3M15 5v-1.5"),
  ] },

  /* survey plot — flag flutters on the peg */
  "land-plot": {
    auto: false,
    dur: 1.9,
    parts: [
      path("M3.6 19.8h16.8"),
      path("M9.6 19.8V7.8"),
      G("flag", [path("M9.6 8l5.8 1.8-5.8 1.8z")]),
      path("M5 19.8c.1-1.5.9-2.6 2-3M16.4 19.8c.1-1.3.8-2.3 1.8-2.8"),
      path("M13.6 15.6l2.4 1"),
    ],
    gAnims: { flag: WIG(9.6, 9.9, 7) },
  },

  /* hanzi meets latin — the A writes on beside the strokes */
  languages: {
    auto: false,
    dur: 1.8,
    parts: [
      path("M3.4 5.4h7.6"),
      path("M7.2 3.8v1.6"),
      path("M4.8 13.2l4.4-5.4M6 9.6c1.3 1.5 2.7 2.6 4.4 3.4"),
      DRAW(path("M13.6 20.4l3.4-8.4 3.4 8.4"), 0.2, 0.68),
      path("M14.9 17.4h4.2"),
    ],
  },

  /* freehand loop draws itself closed, tail flicks */
  lasso: {
    auto: false,
    dur: 1.9,
    parts: [
      DRAW(path("M12.6 4.6c-4.9-.6-8.8 1.6-8.8 5 0 3.2 3.6 5.4 7.8 5.4 3.9 0 7.4-2 7.4-5 0-3.3-3.9-5.9-8.4-5.6"), 0.05, 0.6),
      path("M8.4 14.2c-2.2.8-3.8 2.4-4.2 4.6-.3 1.4.2 2.4 1.4 2.4"),
    ],
  },

  "lasso-select": {
    auto: false,
    dur: 1.9,
    parts: [
      DRAW(path("M12 3.6c-4.6 0-8.2 2.1-8.2 5 0 2.8 3.3 5 7.6 5 4 0 7.4-2.1 7.4-4.8 0-3-3.6-5.2-8-5.2"), 0.05, 0.58),
      path("M7.4 12.8c-1.9.8-3.1 2.1-3.6 4"),
      G("corners", [
        path("M15 20.2h2.6v-2.6M20.6 20.2H18v-2.6"),
      ]),
    ],
    sAnims: { corners: POP(17.8, 18.9, 1.2) },
  },

  /* pinwheel — four swept vanes on a hub, free-spinning */
  "loader-pinwheel": {
    dur: 1.6,
    pp: false,
    auto: false,
    parts: [
      G("spin", [
        path("M12 12V4.6c2.9.3 5 2.7 5.2 5.6z"),
        path("M12 12h7.4c-.3 2.9-2.7 5-5.6 5.2z"),
        path("M12 12v7.4c-2.9-.3-5-2.7-5.2-5.6z"),
        path("M12 12H4.6c.3-2.9 2.7-5 5.6-5.2z"),
      ]),
      circle(12, 12, 0.8, fill()),
    ],
    gAnims: { spin: tn("rotate", ["0 12 12", "360 12 12"]) },
  },

  /* crosshair locked on — square dot pops into place */
  "locate-fixed": {
    auto: false,
    dur: 1.6,
    parts: [
      circle(12, 12, 6.6),
      path("M12 2.9L12 5.2M12 18.8L12 21.1M2.9 12L5.2 12M18.8 12L21.1 12"),
      G("pin", [rect(10.7, 10.7, 2.6, 2.6, 0.5, fill())]),
    ],
    sAnims: { pin: POP(12, 12, 1.35) },
  },

  "locate-off": {
    auto: false,
    dur: 1.6,
    parts: [
      circle(12, 12, 6.6),
      path("M12 2.9L12 5.2M12 18.8L12 21.1M2.9 12L5.2 12M18.8 12L21.1 12"),
      SLASH(4, 4, 20, 20),
    ],
  },

  /* map-pin-house/minus/plus/pinned are drawn in files-05 — not re-shipped here. */

  /* monitor family — screen + stem + foot, interior mark animates */
  "monitor-stop": {
    auto: false,
    dur: 1.6,
    parts: [SCREEN, STAND, FOOT, G("stop", [rect(10.1, 8.5, 3.8, 3.8, 0.9, fill())])],
    sAnims: { stop: POP(12, 10.4, 1.28) },
  },

  "monitor-up": {
    auto: false,
    dur: 1.6,
    parts: [
      SCREEN,
      STAND,
      FOOT,
      A(path("M12 12.9V8.3M9.8 10.4l2.2-2.3 2.2 2.3"), [tn("translate", ["0 0", "0 0", "0 -0.9", "0 0", "0 0"], HOLD)]),
    ],
  },

  "monitor-x": {
    auto: false,
    dur: 1.6,
    parts: [SCREEN, STAND, FOOT, DRAW(path("M10.2 8.5l3.6 3.8M13.8 8.5l-3.6 3.8"), 0.2, 0.66)],
  },

  "mouse-off": {
    auto: false,
    dur: 1.6,
    parts: [
      rect(8, 3.6, 8, 16.8, 4),
      line(12, 6.8, 12, 9.4),
      SLASH(3.8, 3.4, 20.2, 20.6),
    ],
  },

  /* cursor arrow — presses down-left like a click */
  "mouse-pointer": {
    auto: false,
    dur: 1.6,
    parts: [G("cursor", [path("M5 4.5L19.4 11.3C19.9 11.5 19.9 12.1 19.4 12.3L16.3 13.25Q13.2 14.2 12.55 17.15L11.9 20.1C11.7 20.7 11 20.6 10.8 20.1L4.5 5.2C4.3 4.7 4.5 4.3 5 4.5Z"), line(14.6, 15.4, 19.6, 20.4)])],
    gAnims: { cursor: DIP(-0.7, -0.7) },
  },

  /* pointer + click rings rippling out of the tip */
  "mouse-pointer-click": {
    auto: false,
    dur: 1.8,
    /* pointer lands, three rays flick off the tip */
    parts: [
      G("cursor", [path("M9.80 9.43L20.46 14.46C20.83 14.61 20.83 15.05 20.46 15.20L18.16 15.90Q15.87 16.61 15.39 18.79L14.91 20.97C14.76 21.42 14.24 21.34 14.09 20.97L9.43 9.95C9.28 9.58 9.43 9.28 9.80 9.43Z")]),
      A(line(8.8, 2.8, 8.8, 4.8), [an("opacity", ["1", "1", "0.2", "1", "1"], [0, 0.3, 0.45, 0.6, 1])]),
      A(line(2.8, 8.8, 4.8, 8.8), [an("opacity", ["1", "1", "0.2", "1", "1"], [0, 0.3, 0.45, 0.6, 1])]),
      A(line(4.7, 4.7, 6, 6), [an("opacity", ["1", "1", "0.2", "1", "1"], [0, 0.3, 0.45, 0.6, 1])]),
    ],
    gAnims: { cursor: tn("translate", ["0 0", "0 0", "-0.7 -0.7", "0 0", "0 0"], [0, 0.3, 0.45, 0.6, 1]) },
  },

  /* single eighth — flag curls, head bobs */
  "music-2": {
    auto: false,
    dur: 1.7,
    parts: [
      circle(6.6, 17.8, 2.9),
      path("M9.5 17.8V5.6c0-.6.4-1 1-1.1"),
      path("M10.5 4.5c2.6.2 4.8 1.4 6 3.3"),
    ],
  },

  /* note with a doubled flag — brighter cousin of music-2 */
  "music-3": {
    auto: false,
    dur: 1.7,
    parts: [
      G("bob", [
        circle(7.6, 18, 2.8),
        path("M10.4 18V4.8"),
        path("M10.4 4.8c2.4.2 4.4 1.2 5.6 2.8M10.4 8.6c1.9.2 3.4 1 4.4 2.2"),
      ]),
    ],
    gAnims: { bob: tn("rotate", ["0 12 20", "-5 12 20", "4 12 20", "0 12 20"], [0, 0.3, 0.65, 1]) },
  },

  /* beamed pair, double bar — sways like the core music glyph */
  "music-4": {
    auto: false,
    dur: 1.7,
    parts: [
      G("sway", [
        path("M8.6 17.8V5.8l11.2-2v12.4"),
        line(8.6, 8.4, 19.8, 6.6),
        line(8.6, 11.6, 19.8, 9.8),
        circle(5.8, 17.8, 2.8),
        circle(17, 15.8, 2.8),
      ]),
    ],
    gAnims: { sway: tn("rotate", ["0 12 20", "-6 12 20", "5 12 20", "0 12 20"], [0, 0.3, 0.65, 1]) },
  },

  /* nav arrow struck through */
  "navigation-2-off": {
    auto: false,
    dur: 1.6,
    parts: [
      path("M12 3.4L19.6 19.3C19.9 19.9 19.4 20.5 18.8 20.3L12.9 18.1C12.5 17.9 12 17.9 11.6 18.1L5.7 20.3C5.1 20.5 4.6 19.9 4.9 19.3L12 3.4Z"),
      SLASH(3.8, 3.6, 20.2, 20.4),
    ],
  },

  /* little LAN — three nodes wire up in turn */
  network: {
    auto: false,
    dur: 1.9,
    parts: [
      DRAW(path("M10.2 5.6l-3.8 9.4"), 0.14, 0.5),
      DRAW(path("M13.8 5.6l3.8 9.4"), 0.26, 0.62),
      DRAW(path("M7.4 17.2h9.2"), 0.38, 0.72),
      circle(12, 4.6, 2.4),
      circle(5, 17.2, 2.4),
      circle(19, 17.2, 2.4),
    ],
  },

  /* package family — carton + one mark on the face */
  "package-check": {
    auto: false,
    dur: 1.6,
    parts: [path(PKG), path(PKG_SEAM), path("M8.2 5.4L16.2 9.9"), DRAW(path("M9.6 14.6l1.8 1.8 3.4-3.8"), 0.22, 0.68)],
  },

  "package-minus": {
    auto: false,
    dur: 1.5,
    parts: [path(PKG), path(PKG_SEAM), path("M8.2 5.4L16.2 9.9"), DRAW(path("M9.8 14.6h4.4"), 0.22, 0.6)],
  },

  /* the lid flaps swing open and settle */
  "package-open": {
    auto: false,
    dur: 1.9,
    parts: [
      path("M4.4 10.4v6.4c0 1.5 1.2 2.8 2.7 2.8h9.8c1.5 0 2.7-1.3 2.7-2.8v-6.4"),
      G("flapL", [path("M4.4 10.4l-2-3.6c-.3-.6.1-1.4.8-1.5l5.4-1 1.4 3z")]),
      G("flapR", [path("M19.6 10.4l2-3.6c.3-.6-.1-1.4-.8-1.5l-5.4-1-1.4 3z")]),
      path("M12 15.6v-3.4M10.4 13.8l1.6-1.6 1.6 1.6"),
    ],
    gAnims: {
      flapL: tn("rotate", ["0 4.4 10.4", "0 4.4 10.4", "-14 4.4 10.4", "-14 4.4 10.4", "0 4.4 10.4"], [0, 0.2, 0.55, 0.78, 1]),
      flapR: tn("rotate", ["0 19.6 10.4", "0 19.6 10.4", "14 19.6 10.4", "14 19.6 10.4", "0 19.6 10.4"], [0, 0.2, 0.55, 0.78, 1]),
    },
  },

  "package-plus": {
    auto: false,
    dur: 1.5,
    parts: [path(PKG), path(PKG_SEAM), path("M8.2 5.4L16.2 9.9"), DRAW(path("M12 12.4v4.4M9.8 14.6h4.4"), 0.22, 0.66)],
  },

  /* carton + magnifier parked at the corner — tilts as it inspects */
  "package-search": {
    auto: false,
    dur: 1.8,
    parts: [
      path(PKG),
      path(PKG_SEAM),
      path("M8.2 5.4L16.2 9.9"),
      G("glass", [circle(12, 14.6, 3), line(14.2, 16.8, 16.4, 19)]),
    ],
    gAnims: { glass: tn("rotate", ["0 12 14.6", "0 12 14.6", "-9 12 14.6", "7 12 14.6", "0 12 14.6"], HOLD) },
  },

  "package-x": {
    auto: false,
    dur: 1.6,
    parts: [path(PKG), path(PKG_SEAM), path("M8.2 5.4L16.2 9.9"), DRAW(path("M9.9 12.7l4.4 4.4M14.3 12.7l-4.4 4.4"), 0.2, 0.66)],
  },

  /* roller sweeps right along its bar */
  "paint-roller": {
    auto: false,
    dur: 1.7,
    parts: [
      G("roll", [rect(3.2, 4.2, 13.4, 5.2, 2.2)]),
      path("M16.6 6.8h3.2c.7 0 1.2.5 1.2 1.2v3c0 .7-.5 1.2-1.2 1.2h-8.4v1.4"),
      rect(10.4, 13.6, 2.2, 6.8, 1),
    ],
    gAnims: { roll: tn("translate", ["0 0", "0 0", "1.3 0", "1.3 0", "0 0"], [0, 0.2, 0.55, 0.75, 1]) },
  },

  /* tower case — power button pulses */
  "pc-case": {
    auto: false,
    dur: 1.9,
    parts: [
      rect(5.4, 3.4, 13.2, 17.2, 1.8),
      path("M8 6.6h4.6M8 9.2h4.6"),
      path("M8.4 19.4h7.2M8.4 17.6h7.2"),
      A(circle(15.8, 13.6, 1.7), [an("opacity", ["1", "1", "0.4", "1", "1"], [0, 0.3, 0.55, 0.8, 1])]),
      circle(15.8, 13.6, 0.5, fill()),
    ],
  },

  /* pen/pencil family — writing tools struck through or paired */
  "pen-off": {
    auto: false,
    dur: 1.6,
    parts: [
      path("M5.4 20.6L6.4 18.2C6.7 17.6 7.2 17.1 7.8 16.7L17.8 6.7C18.6 5.9 19.9 5.9 20.7 6.7C21.5 7.5 21.5 8.8 20.7 9.6L10.7 19.6C10.3 20 9.8 20.5 9.2 20.8L6.8 21.8"),
      path("M14.6 8.2L18.4 4.4"),
      SLASH(3.4, 3.2, 20.6, 20.8),
    ],
  },

  "pencil-line": {
    auto: false,
    dur: 1.7,
    parts: [
      path("M5.2 18.8L5.8 15.7C6 15 6.4 14.4 7 13.9L16.5 4.4C17.3 3.6 18.6 3.6 19.4 4.4C20.2 5.2 20.2 6.5 19.4 7.3L9.9 16.8"),
      path("M15.6 5.3L18.8 8.5"),
      DRAW(path("M4.4 21h10"), 0.3, 0.75),
    ],
  },

  "pencil-off": {
    auto: false,
    dur: 1.6,
    parts: [
      path("M5.2 18.8L5.8 15.7C6 15 6.4 14.4 7 13.9L16.5 4.4C17.3 3.6 18.6 3.6 19.4 4.4C20.2 5.2 20.2 6.5 19.4 7.3L9.9 16.8"),
      path("M15.6 5.3L18.8 8.5"),
      SLASH(3.4, 3.2, 20.6, 20.8),
    ],
  },

  /* pencil across a ticked ruler */
  "pencil-ruler": {
    auto: false,
    dur: 1.8,
    parts: [
      G("ruler", [
        rect(8.6, 11.4, 11.6, 3.8, 0.9, { transform: "rotate(-45 14.4 13.3)" }),
        path("M12.4 11.9l1.4 1.4M14.8 9.5l1.4 1.4M17.2 7.1l1.4 1.4"),
      ]),
      path("M4.6 19.4L5.2 16.5C5.4 15.9 5.8 15.4 6.3 15L15 6.3C15.8 5.5 17.1 5.5 17.9 6.3C18.7 7.1 18.7 8.4 17.9 9.2L9.2 17.9"),
      path("M14.3 7.2l3.5 3.5"),
    ],
  },

  /* upright piano — black keys settle in a little arpeggio */
  piano: {
    auto: false,
    dur: 1.9,
    parts: [
      rect(3.2, 5.2, 17.6, 13.6, 2),
      A(rect(6.5, 5.2, 1.9, 6.6, 0.7, fill()), [tn("translate", ["0 0", "0 0", "0 0.8", "0 0.8", "0 0"], [0, 0.15, 0.32, 0.5, 0.66])]),
      A(rect(11.05, 5.2, 1.9, 6.6, 0.7, fill()), [tn("translate", ["0 0", "0 0", "0 0.8", "0 0.8", "0 0"], [0, 0.3, 0.47, 0.65, 0.81])]),
      A(rect(15.6, 5.2, 1.9, 6.6, 0.7, fill()), [tn("translate", ["0 0", "0 0", "0 0.8", "0 0.8", "0 0"], [0, 0.45, 0.62, 0.8, 0.96])]),
      path("M3.2 13.4h17.6"),
    ],
  },

  /* apothecary bottle — pills rattle */
  "pill-bottle": {
    auto: false,
    dur: 1.9,
    parts: [
      rect(7, 7.6, 10, 13, 2),
      rect(6.2, 3.4, 11.6, 3.2, 1.1),
      path("M8.2 12.4h7.6"),
      G("pills", [
        circle(9.8, 16.8, 1.1, fill()),
        circle(13.4, 15.4, 1.1, fill()),
        circle(12.6, 18.4, 1.1, fill()),
      ]),
    ],
    gAnims: { pills: tn("translate", ["0 0", "0 0", "0 -0.8", "0 0.4", "0 0"], [0, 0.3, 0.55, 0.75, 1]) },
  },

  /* eyedropper — bulb on top, drop wells at the tip */
  pipette: {
    auto: false,
    dur: 1.9,
    parts: [
      path("M4.8 19.2L13.6 10.4"),
      path("M12.8 8.8l2.8 2.8"),
      circle(16.6, 5.4, 2.2),
      path("M15.4 6.6l3 3"),
      G("drop", [circle(4.4, 20.4, 0.65, fill(), { opacity: 0 })]),
    ],
    gAnims: {
      drop: [
        tn("translate", ["0 0", "0 0", "0 1.6", "0 1.6"], [0, 0.35, 0.68, 1]),
        an("opacity", ["0", "1", "1", "0", "0"], [0, 0.35, 0.55, 0.72, 1]),
      ],
    },
  },

  /* chest pocket — top band + soft U */
  pocket: {
    parts: [
      path("M4.6 4.4h14.8v6c0 3.6-3.3 6.4-7.4 6.4s-7.4-2.8-7.4-6.4z"),
      path("M4.6 7.2h14.8"),
      circle(12, 10.8, 0.7, fill()),
    ],
  },

  /* folder knife — blade swings out of the handle */
  "pocket-knife": {
    auto: false,
    dur: 2,
    parts: [
      path("M5.4 12.4v3.6a4.4 4.4 0 0 0 8.8 0v-3.6"),
      circle(6.6, 12.4, 0.7, fill()),
      G("blade", [
        path("M6.6 12.4V6.2c0-1.4.8-2.5 2.1-2.8l1.8 2.6c.4.6.6 1.3.6 2v4.4"),
      ]),
    ],
    gAnims: { blade: tn("rotate", ["0 6.6 12.4", "0 6.6 12.4", "-38 6.6 12.4", "-38 6.6 12.4", "0 6.6 12.4"], [0, 0.22, 0.55, 0.78, 1]) },
  },

  /* beamer — lens glows, cone flickers up */
  projector: {
    auto: false,
    dur: 1.9,
    parts: [
      rect(3.2, 9.4, 17.6, 7.6, 2.2),
      A(circle(15.8, 13.2, 2.5), [an("r", ["2.5", "2.5", "2.8", "2.5", "2.5"], HOLD)]),
      circle(15.8, 13.2, 0.7, fill()),
      path("M6.6 13.2h2.4M6.6 11h2.4"),
      path("M6.4 17v1.8M17.6 17v1.8"),
      G("beam", [path("M15.2 6.4l-1.6-2.2M16.6 6.2l.6-2.4M18 7l2-1.6")]),
    ],
    gAnims: { beam: [an("opacity", ["0.2", "0.9", "0.2", "0.2"], [0, 0.3, 0.66, 1])] },
  },

  /* rail marker — converging rails + ties */
  "rail-symbol": {
    parts: [
      path("M7.6 4.4L5.6 19.6M16.4 4.4l2 15.2"),
      path("M7 7.8h10M6.4 11.8h11.2M5.9 15.8h12.2"),
    ],
  },

  /* fridge — tall box, freezer seam, two pull handles */
  refrigerator: {
    auto: false,
    dur: 1.7,
    parts: [
      rect(6.4, 3.4, 11.2, 17.2, 1.7),
      path("M6.4 9.6h11.2"),
      path("M8.7 6.4v1.7M8.7 12.2v2.2"),
      G("frost", [path("M14.6 4.6v1.2M14 5.2h1.2M15.2 5.2h1.2")], { opacity: 0 }),
    ],
    gAnims: { frost: an("opacity", ["0", "0", "0.9", "0", "0"], [0, 0.35, 0.55, 0.78, 1]) },
  },

  /* twin triangles hop left */
  rewind: {
    auto: false,
    dur: 1.5,
    parts: [
      G("hop", [
        path("M19.8 6.9l-7 4.4c-.7.5-.7 1.4 0 1.9l7 4.4c.8.5 1.8-.1 1.8-1V8c0-.9-1-1.5-1.8-1.1z"),
        path("M11.2 6.9l-7 4.4c-.7.5-.7 1.4 0 1.9l7 4.4c.8.5 1.8-.1 1.8-1V8c0-.9-1-1.5-1.8-1.1z"),
      ]),
    ],
    gAnims: { hop: DIP(-1, 0) },
  },

  /* awareness ribbon — loop up top, crossed tails below */
  ribbon: {
    auto: false,
    dur: 1.9,
    parts: [
      DRAW(path("M12 2.8c-2.1 0-3.6 1.4-3.6 3.2 0 1.7 1.5 3.1 3.6 3.1s3.6-1.4 3.6-3.1c0-1.8-1.5-3.2-3.6-3.2z"), 0.05, 0.5),
      G("tails", [path("M10.4 8.4l-4 9.2 2.8-1 1.6 2.2"), path("M13.6 8.4l4 9.2-2.8-1-1.6 2.2")]),
    ],
    gAnims: { tails: WIG(12, 9.2, 4) },
  },

  /* rocker — the chair rocks on its arc */
  "rocking-chair": {
    auto: false,
    dur: 2.0,
    parts: [
      G("chair", [
        path("M7.8 11V5.6c0-1 .8-1.8 1.8-1.8h4.2c1 0 1.8.8 1.8 1.8V11"),
        path("M6.4 11h11.2c.9 0 1.6.7 1.6 1.6v.4"),
        path("M8 12.8l-1.2 4.6M16 12.8l1.2 4.6"),
      ]),
      path("M4.4 19.6c4.9 1.5 10.3 1.5 15.2 0"),
    ],
    gAnims: { chair: tn("rotate", ["0 12 20.4", "0 12 20.4", "-4 12 20.4", "4 12 20.4", "0 12 20.4"], HOLD) },
  },

  /* rounded square + inner circular arrow, ccw — arrow sweeps round */
  "rotate-ccw-square": {
    auto: false,
    dur: 1.8,
    parts: [
      rect(4.4, 4.4, 15.2, 15.2, 3.2),
      G("arc", [
        path("M15.6 8.6a4.4 4.4 0 1 0 .4 5"),
        path("M16 8l.2 2.9-2.9-1.1"),
      ]),
    ],
    gAnims: { arc: tn("rotate", ["0 12 12", "0 12 12", "-26 12 12", "-26 12 12", "0 12 12"], [0, 0.2, 0.55, 0.75, 1]) },
  },

  "rotate-cw-square": {
    auto: false,
    dur: 1.8,
    parts: [
      rect(4.4, 4.4, 15.2, 15.2, 3.2),
      G("arc", [
        path("M8.4 8.6a4.4 4.4 0 1 1-.4 5"),
        path("M8 8l-.2 2.9 2.9-1.1"),
      ]),
    ],
    gAnims: { arc: tn("rotate", ["0 12 12", "0 12 12", "26 12 12", "26 12 12", "0 12 12"], [0, 0.2, 0.55, 0.75, 1]) },
  },

  /* two floppies queued — the back one slips up into place */
  "save-all": {
    auto: false,
    dur: 1.8,
    parts: [
      G("back", [line(8, 2.8, 16, 2.8)]),
      path("M5.4 5.8h9.4c.6 0 1.2.2 1.6.7l3.5 3.5c.4.4.7 1 .7 1.6v7c0 1-.8 2-1.8 2H5.2c-1 0-1.8-1-1.8-2V7.8c0-1.1.9-2 1.9-2z"),
      rect(6.8, 5.8, 6, 4.4, 0.9),
      path("M7.2 20.6v-4.2c0-.4.4-.8.8-.8h7.2c.4 0 .8.4.8.8v4.2"),
    ],
    gAnims: { back: tn("translate", ["0 1.2", "0 1.2", "0 0", "0 0"], [0, 0.3, 0.62, 1]) },
  },

  "save-off": {
    auto: false,
    dur: 1.6,
    parts: [path(SAVE_BODY), SAVE_SHUT, SAVE_SLOT, SLASH(3.6, 3.4, 20.4, 20.6)],
  },

  /* share arrow arcs up out of the screen */
  "screen-share": {
    auto: false,
    dur: 1.8,
    parts: [
      SCREEN,
      STAND,
      FOOT,
      G("arrow", [
        path("M8.8 13.2c.3-3 2.3-4.4 5.4-4.4l1.6.1"),
        path("M14.6 5.6l2.6 3.2-2.6 3"),
      ]),
    ],
    gAnims: {
      arrow: [
        tn("translate", ["0 0.6", "0 0.6", "0 -0.7", "0 -0.7", "0 0.6"], [0, 0.2, 0.55, 0.8, 1]),
      ],
    },
  },

  "screen-share-off": {
    auto: false,
    dur: 1.8,
    parts: [
      SCREEN,
      STAND,
      FOOT,
      path("M8.8 13.2c.3-3 2.3-4.4 5.4-4.4l1.6.1"),
      path("M14.6 5.6l2.6 3.2-2.6 3"),
      SLASH(3.4, 3, 20.6, 21),
    ],
  },

  /* search-check/code/slash/x are drawn in files-05 — not re-shipped here. */

  /* server slabs + a little bloom gear that turns */
  "server-cog": {
    dur: 2.0,
    pp: false,
    auto: false,
    parts: [
      path("M4.2 9.3V6.7c0-1.2 1-2.2 2.2-2.2h11.2c1.2 0 2.2 1 2.2 2.2v2.6c0 1.2-1 2.2-2.2 2.2H6.4c-1.2 0-2.2-1-2.2-2.2z"),
      circle(7.2, 7.5, 0.55, fill()),
      path("M15.6 7.5h1.6"),
      path("M4.2 17.6v-2.6c0-1.2 1-2.2 2.2-2.2h5.8"),
      circle(7.2, 16.1, 0.55, fill()),
      G("gear", cog(17.6, 18, 0.9)),
    ],
    gAnims: { gear: tn("rotate", ["0 17.6 18", "360 17.6 18"]) },
  },

  /* crash — burst lines snap on above the rack */
  "server-crash": {
    auto: false,
    dur: 1.7,
    parts: [
      SERVER_TOP,
      SERVER_BOT,
      circle(7.2, 7.7, 0.55, fill()),
      circle(7.2, 16.3, 0.55, fill()),
      path("M15.6 7.7h1.6M15.6 16.3h1.6"),
      G("burst", [
        path("M16.8 3.4l.9-1.4M18.6 4.4l1.4-.9M15.2 4.2l-.9-1.3"),
      ]),
    ],
    gAnims: { burst: an("opacity", ["0", "1", "0.4", "1", "0", "0"], [0, 0.28, 0.42, 0.5, 0.72, 1]) },
  },

  /* shields — one interior mark each */
  "shield-ban": {
    auto: false,
    dur: 1.7,
    parts: [
      path(SHIELD),
      circle(12, 12.3, 3.2),
      DRAW(path("M9.9 14.6l4.4-4.6"), 0.3, 0.7),
    ],
  },

  "shield-ellipsis": {
    auto: false,
    dur: 1.6,
    parts: [
      path(SHIELD),
      A(circle(9, 12.4, 0.7, fill()), [an("opacity", ["1", "0.25", "1", "1"], [0, 0.18, 0.42, 1])]),
      A(circle(12, 12.4, 0.7, fill()), [an("opacity", ["1", "1", "0.25", "1"], [0, 0.34, 0.58, 1])]),
      A(circle(15, 12.4, 0.7, fill()), [an("opacity", ["1", "1", "0.25", "1"], [0, 0.5, 0.74, 1])]),
    ],
  },

  "shield-half": {
    parts: [path(SHIELD), path("M12 5.9v13.4")],
  },

  "shield-minus": {
    auto: false,
    dur: 1.5,
    parts: [path(SHIELD), DRAW(path("M9.5 12.4h5"), 0.2, 0.6)],
  },

  "shield-plus": {
    auto: false,
    dur: 1.5,
    parts: [path(SHIELD), DRAW(path("M12 9.9v5M9.5 12.4h5"), 0.2, 0.66)],
  },

  "shield-question": {
    auto: false,
    dur: 1.7,
    parts: [
      path(SHIELD),
      DRAW(path("M10.4 10.6c.1-1.1 1-1.9 2.1-1.8 1.1.1 1.9 1 1.8 2-.1 1-.9 1.5-1.7 2v.7"), 0.18, 0.62),
      circle(12.6, 15.4, 0.62, fill()),
    ],
  },

  "shield-x": {
    auto: false,
    dur: 1.6,
    parts: [path(SHIELD), DRAW(path(XMARK), 0.2, 0.66)],
  },

  /* wall pipe + tilted head; water ticks fall */
  "shower-head": {
    auto: false,
    dur: 2.0,
    parts: [
      path("M6.2 20.6V6.4c0-2.2 1.8-4 4-4 1.6 0 3 1 3.6 2.4"),
      path("M12.9 4.6l4.4 4.4-1.8 1.8-4.4-4.4z"),
      G("water", [
        path("M13.6 12.8v1.4M16.2 14.6v1.4M18.8 12.8v1.4"),
      ]),
    ],
    gAnims: {
      water: [
        tn("translate", ["0 0", "0 0", "0 1.6", "0 1.6"], [0, 0.15, 0.6, 1]),
        an("opacity", ["0.3", "1", "1", "0.3", "0.3"], [0, 0.15, 0.5, 0.78, 1]),
      ],
    },
  },

  /* low tuft — three bumps on a baseline, gentle sway */
  shrub: {
    auto: false,
    dur: 1.9,
    parts: [
      G("bush", [
        path("M12 20.4v-4.8"),
        path("M4.8 20.4c0-2.6 1.9-4.4 4.2-4.4 1.2 0 2.3.6 3 1.5"),
        path("M19.2 20.4c0-2.6-1.9-4.4-4.2-4.4-1.2 0-2.3.6-3 1.5"),
        path("M8.8 14.4c.6-2.4 2-3.8 4-3.8s3.4 1.4 4 3.8"),
      ]),
      path("M3.4 20.4h17.2"),
    ],
    gAnims: { bush: WIG(12, 20.4, 3.5) },
  },

  /* signal ladders — bars light in a cascade */
  "signal-high": {
    auto: false,
    dur: 1.8,
    parts: [
      A(line(5.2, 18.6, 5.2, 15.8), [an("opacity", ["0.3", "1", "1", "0.3"], [0, 0.12, 0.85, 1])]),
      A(line(9.4, 18.6, 9.4, 13.2), [an("opacity", ["0.3", "0.3", "1", "1", "0.3"], [0, 0.16, 0.3, 0.87, 1])]),
      A(line(13.6, 18.6, 13.6, 10.4), [an("opacity", ["0.3", "0.3", "1", "1", "0.3"], [0, 0.3, 0.44, 0.89, 1])]),
      A(line(17.8, 18.6, 17.8, 7.4), [an("opacity", ["0.3", "0.3", "1", "1", "0.3"], [0, 0.44, 0.58, 0.91, 1])]),
    ],
  },

  "signal-low": { dur: 1.4, auto: true, parts: [
    path("M5.5 19.5V15"),
    path("M10 19.5h.01M14.5 19.5h.01M19 19.5h.01"),
  ] },

  "signal-medium": { dur: 1.4, auto: true, parts: [
    path("M5.5 19.5V15M10 19.5V12"),
    path("M14.5 19.5h.01M19 19.5h.01"),
  ] },

  "signal-zero": {
    auto: false,
    dur: 1.8,
    parts: [
      A(circle(5.2, 18.6, 0.6, fill()), [an("opacity", ["1", "0.3", "1"], [0, 0.4, 1])]),
      circle(9.4, 18.6, 0.6, fill()),
      circle(13.6, 18.6, 0.6, fill()),
      circle(17.8, 18.6, 0.6, fill()),
    ],
  },

  /* handset + bolt — the charge flashes */
  "smartphone-charging": {
    auto: false,
    dur: 1.7,
    parts: [
      PHONE,
      path("M10.8 4.9h2.4"),
      G("bolt", [path("M12.7 9.2l-2.5 3.6h2l-.7 3.8 2.8-3.8h-2z", fill())]),
    ],
    gAnims: { bolt: an("opacity", ["1", "1", "0.25", "1", "1"], [0, 0.34, 0.48, 0.66, 1]) },
  },

  /* phone + nfc chevrons pulsing outward */
  "smartphone-nfc": {
    auto: false,
    dur: 1.8,
    parts: [
      PHONE,
      path("M10.8 4.9h2.4"),
      A(path("M10.4 9.6a4.4 4.4 0 0 1 0 4.8"), [an("opacity", ["0.3", "1", "0.3", "0.3"], [0, 0.25, 0.5, 1])]),
      A(path("M12.4 8.2a7.6 7.6 0 0 1 0 7.6"), [an("opacity", ["0.3", "0.3", "1", "0.3"], [0, 0.3, 0.58, 1])]),
    ],
  },

  "star-off": {
    auto: false,
    dur: 1.6,
    parts: [
      path("M12 4.5L13.9 8.6C14.1 9 14.5 9.3 14.9 9.3L19.4 9.8L16 12.8C15.7 13.1 15.5 13.6 15.6 14L16.5 18.4L12.6 16.2C12.2 16 11.7 16 11.4 16.2L7.5 18.4L8.4 14C8.5 13.6 8.3 13.1 8 12.8L4.6 9.8L9.1 9.3C9.5 9.3 9.9 9 10.1 8.6Z"),
      SLASH(3.8, 3.6, 20.2, 20.4),
    ],
  },

  /* bar + triangle — triangle hops into the rail */
  "step-back": {
    auto: false,
    dur: 1.5,
    parts: [
      line(6.2, 6.4, 6.2, 17.6),
      G("tri", [path("M19.6 6.9l-7.4 4.6c-.7.4-.7 1.3 0 1.7l7.4 4.6c.8.5 1.8-.1 1.8-1V8c0-.9-1-1.5-1.8-1.1z")]),
    ],
    gAnims: { tri: DIP(-1.2, 0) },
  },

  "step-forward": {
    auto: false,
    dur: 1.5,
    parts: [
      line(17.8, 6.4, 17.8, 17.6),
      G("tri", [path("M4.4 6.9l7.4 4.6c.7.4.7 1.3 0 1.7L4.4 17.8c-.8.5-1.8-.1-1.8-1V8c0-.9 1-1.5 1.8-1.1z")]),
    ],
    gAnims: { tri: DIP(1.2, 0) },
  },

  /* dim sun — core + tick rays that breathe */
  "sun-dim": {
    auto: false,
    dur: 1.7,
    parts: [
      circle(12, 12, 4),
      A(path("M12 4.2v1.1M12 18.7v1.1M4.2 12h1.1M18.7 12h1.1M6.5 6.5l.8.8M16.7 16.7l.8.8M6.5 17.5l.8-.8M16.7 7.3l.8-.8"), [
        an("opacity", ["0.45", "1", "0.45", "0.45"], [0, 0.3, 0.66, 1]),
      ]),
    ],
  },

  "sun-medium": {
    auto: false,
    dur: 1.7,
    parts: [
      A(circle(12, 12, 4), [an("r", ["4", "4", "4.3", "4", "4"], HOLD)]),
      path("M12 3.4v1.7M12 18.9v1.7M3.4 12h1.7M18.9 12h1.7M5.9 5.9l1.2 1.2M16.9 16.9l1.2 1.2M5.9 18.1l1.2-1.2M16.9 7.1l1.2-1.2"),
    ],
  },

  /* sun + snowflake — the flake twirls slowly */
  "sun-snow": {
    auto: false,
    dur: 2.1,
    parts: [
      circle(9, 9, 3.4),
      path("M9 3.4v1.3M3.4 9h1.3M5.1 5.1l.9.9"),
      G("flake", [
        path("M15.8 12.6v6.4M13 13.8l5.6 3.6M18.6 13.8l-5.6 3.6"),
      ]),
    ],
    gAnims: { flake: tn("rotate", ["0 15.8 15.8", "0 15.8 15.8", "60 15.8 15.8", "60 15.8 15.8", "0 15.8 15.8"], [0, 0.2, 0.55, 0.8, 1]) },
  },

  /* campsite — tent pitched under a small pine */
  "tent-tree": {
    auto: false,
    dur: 1.9,
    parts: [
      path("M3.6 19.8l5-9.6c.3-.6 1-.6 1.3 0l5 9.6"),
      path("M8.2 19.8l1.7-3.4 1.7 3.4"),
      G("pine", [
        path("M17.6 6.2c-.6 1.3-1.4 2.4-2.2 3.5h1.1c-1 1.4-2.2 2.8-3.1 4.3h8.6c-.9-1.5-2.1-2.9-3.1-4.3h1.1c-.8-1.1-1.6-2.2-2.2-3.5z"),
        line(17.6, 14, 17.6, 19.8),
      ]),
      path("M2.8 19.8h18.4"),
    ],
    gAnims: { pine: WIG(17.6, 19.8, 3) },
  },

  /* upright tube — meniscus + a bubble that rises */
  "test-tube": {
    auto: false,
    dur: 2.0,
    parts: [
      path("M9 3.4h6"),
      path("M10 3.4v11.6c0 1.7.9 2.8 2 2.8s2-1.1 2-2.8V3.4"),
      path("M10 10.6h4"),
      A(circle(12, 15.8, 0.55, fill()), [
        an("cy", ["15.8", "15.8", "11.8", "11.8"], [0, 0.3, 0.7, 1]),
        an("opacity", ["1", "1", "0", "0"], [0, 0.3, 0.68, 1]),
      ]),
    ],
  },

  /* same tube tilted — bubble rises along the wall */
  "test-tube-diagonal": {
    auto: false,
    dur: 2.0,
    parts: [
      G("tilt", [
        path("M9 3.4h6"),
        path("M10 3.4v11.6c0 1.7.9 2.8 2 2.8s2-1.1 2-2.8V3.4"),
        path("M10 10.6h4"),
        A(circle(12, 15.8, 0.55, fill()), [
          an("cy", ["15.8", "15.8", "11.8", "11.8"], [0, 0.3, 0.7, 1]),
          an("opacity", ["1", "1", "0", "0"], [0, 0.3, 0.68, 1]),
        ]),
      ], { transform: "rotate(28 12 12)" }),
    ],
  },

  /* thermometer + flake at the bulb side */
  "thermometer-snowflake": {
    auto: false,
    dur: 2.0,
    parts: [
      path("M14.6 4.5a2.2 2.2 0 0 0-2.2 2.2v7.4c-1.4 1-2.3 2.6-2.3 4.4a4.5 4.5 0 1 0 9 0c0-1.8-.9-3.4-2.3-4.4V6.7a2.2 2.2 0 0 0-2.2-2.2z"),
      circle(14.6, 18.5, 2.1, fill()),
      line(14.6, 19.2, 14.6, 15.2),
      G("flake", [path("M5.4 13.2v6M2.8 14.4l5.2 3.4M8 14.4l-5.2 3.4")]),
    ],
    gAnims: { flake: WIG(5.4, 16.2, 12) },
  },

  /* thermometer + a little sun — mercury climbs */
  "thermometer-sun": {
    auto: false,
    dur: 2.0,
    parts: [
      path("M8.6 3.6A2.2 2.2 0 0 0 6.4 5.8v6.5c-1.3.9-2.1 2.4-2.1 4.1a4.3 4.3 0 1 0 8.6 0c0-1.7-.8-3.2-2.1-4.1V5.8A2.2 2.2 0 0 0 8.6 3.6z"),
      circle(8.6, 16.4, 1.9, fill()),
      A(line(8.6, 16.4, 8.6, 14), [an("y2", ["16.4", "16.4", "9.6", "9.6", "16.4"], [0, 0.2, 0.55, 0.8, 1])]),
      circle(16.4, 7.6, 2.1, fill()),
      path("M16.4 3.1v.7M20.6 7.6h-.7M19.4 4.6l-.5.5M16.4 11.4v.7M19.4 10.6l-.5-.5"),
    ],
  },

  /* ticket stubs — the mark draws on centre-left of the perf */
  "ticket-check": {
    auto: false,
    dur: 1.6,
    parts: [path(TICKET), DRAW(path("M8.4 13.7l1.9 1.9 3.4-3.9"), 0.2, 0.65)],
  },

  "ticket-minus": {
    auto: false,
    dur: 1.5,
    parts: [path(TICKET), DRAW(path("M9.2 13.6h4.4"), 0.2, 0.6)],
  },

  "ticket-plus": {
    auto: false,
    dur: 1.5,
    parts: [path(TICKET), DRAW(path("M11.4 11.4v4.4M9.2 13.6h4.4"), 0.2, 0.66)],
  },

  "ticket-slash": {
    auto: false,
    dur: 1.6,
    parts: [path(TICKET), SLASH(4.4, 6.4, 19.6, 20.8)],
  },

  "ticket-x": {
    auto: false,
    dur: 1.6,
    parts: [path(TICKET), DRAW(path("M9.5 11.7l4 4M13.5 11.7l-4 4"), 0.2, 0.66)],
  },

  /* a second stub peeks from behind — slides up to show */
  tickets: {
    auto: false,
    dur: 1.8,
    parts: [
      G("back", [line(5.6, 4, 18.4, 4)]),
      path(TICKET),
      path("M14.2 10.4v1.5M14.2 13.4v1.5M14.2 16.4v1.5"),
    ],
    gAnims: { back: tn("translate", ["0 0.9", "0 0.9", "0 0", "0 0"], [0, 0.25, 0.6, 1]) },
  },

  /* pill switch — knob glides across and back */
  "toggle-left": {
    auto: false,
    dur: 1.9,
    parts: [
      rect(2.8, 6.6, 18.4, 10.8, 5.4),
      A(circle(8.2, 12, 3.2), [an("cx", ["8.2", "8.2", "15.8", "15.8", "8.2"], [0, 0.2, 0.5, 0.7, 0.92])]),
    ],
  },

  "toggle-right": {
    auto: false,
    dur: 1.9,
    parts: [
      rect(2.8, 6.6, 18.4, 10.8, 5.4),
      A(circle(15.8, 12, 3.2), [an("cx", ["15.8", "15.8", "8.2", "8.2", "15.8"], [0, 0.2, 0.5, 0.7, 0.92])]),
    ],
  },

  /* cistern + seat + pedestal */
  "toilet": { dur: 1.4, auto: true, parts: [
    rect(5.5, 3.5, 7, 6.5, 1.5),
    path("M4 10.5H20C20 14 18 16.5 15.5 17.3V20.5H9.5V17.3C6 16.5 4 14 4 10.5Z"),
  ] },

  /* pad + click zones — the touch dot glides across */
  touchpad: {
    auto: false,
    dur: 1.9,
    parts: [
      rect(3, 5.4, 18, 13.2, 2.4),
      path("M3 15.4h18"),
      A(circle(12, 10.4, 0.7, fill()), [an("cx", ["10", "10", "14", "14", "10"], [0, 0.15, 0.55, 0.7, 0.95])]),
      path("M9.2 17.8h.8M14 17.8h.8"),
    ],
  },

  "touchpad-off": {
    auto: false,
    dur: 1.8,
    parts: [
      rect(3, 5.4, 18, 13.2, 2.4),
      path("M3 15.4h18"),
      circle(12, 10.4, 0.7, fill()),
      path("M9.2 17.8h.8M14 17.8h.8"),
      SLASH(4, 4, 20, 20),
    ],
  },

  /* control tower — cab on a tapered shaft, beacon blinks */
  "tower-control": {
    auto: false,
    dur: 2.0,
    parts: [
      path("M9.2 20.8l.7-8.8h4.2l.7 8.8"),
      path("M7.2 8.6l.7 3.4h8.2l.7-3.4z"),
      path("M8.4 10.2h7.2"),
      path("M12 8.6V5.6"),
      A(circle(12, 4.2, 1, fill()), BLINK(0.15)),
      path("M7.4 20.8h9.2"),
    ],
  },

  /* leaning trunk + drooping fronds + coconuts — sway */
  "tree-palm": {
    auto: false,
    dur: 2.1,
    parts: [
      path("M10.4 20.8c.6-3.6.7-7 0-10.4"),
      G("fronds", [
        path("M10.4 10.4C8.8 7.8 6.2 7 3.8 7.8c1.9 1.1 3.5 2.6 4.7 4"),
        path("M10.4 10.4c1.6-2.6 4.2-3.4 6.6-2.6-1.9 1.1-3.5 2.6-4.7 4"),
        path("M10.4 10.4c-2.8.6-5.2 2.2-6.6 4.6 2.3.2 4.7-.3 6.6-1.7"),
        path("M10.4 10.4c2.8.6 5.2 2.2 6.6 4.6-2.3.2-4.7-.3-6.6-1.7"),
      ]),
      circle(9.3, 11.3, 0.6, fill()),
      circle(11.6, 11.3, 0.6, fill()),
    ],
    gAnims: { fronds: WIG(10.4, 10.4, 4) },
  },

  /* pine + round tree sharing a baseline — one sways */
  trees: {
    auto: false,
    dur: 2.0,
    parts: [
      G("decid", [
        path("M16 9.2c-1.2 0-2.2.6-2.8 1.6-1.6.2-2.8 1.5-2.8 3.1 0 1.8 1.4 3.2 3.2 3.2h4.6c1.8 0 3.3-1.4 3.3-3.2 0-1.6-1.2-2.9-2.8-3.1-.5-1-1.6-1.6-3.3-1.6z"),
        path("M16 20.8v-3.7M16 18.6l-1.6-1.2"),
      ]),
      path("M7 4.6c-.7 1.5-1.6 2.8-2.5 4h1.2c-1.2 1.6-2.5 3.2-3.5 4.8H9.6c-1-1.6-2.3-3.2-3.5-4.8h1.2c-.9-1.2-1.8-2.5-2.5-4z"),
      line(7, 13.4, 7, 20.8),
      path("M3 20.8h18"),
    ],
    gAnims: { decid: WIG(16, 20.8, 3.5) },
  },

  /* flat panel on two feet */
  "tv-minimal": {
    parts: [
      rect(3.4, 5.6, 17.2, 11.4, 2.2),
      path("M8.4 20.4l1-3.4M15.6 20.4l-1-3.4"),
    ],
  },

  "tv-minimal-play": {
    auto: false,
    dur: 1.7,
    parts: [
      rect(3.4, 5.6, 17.2, 11.4, 2.2),
      path("M8.4 20.4l1-3.4M15.6 20.4l-1-3.4"),
      G("play", [path("M10.6 9.4l3.6 2.4-3.6 2.4z", fill())]),
    ],
    sAnims: { play: POP(12, 11.4, 1.26) },
  },

  /* curved arrow settling into place + the reference dot */
  "undo-dot": {
    auto: false,
    dur: 1.7,
    parts: [
      circle(18.6, 17.6, 0.9, fill()),
      DRAW(path("M18.6 17.6H9.4c-2.8 0-4.8-1.8-4.8-4.4s2-4.4 4.8-4.4H15"), 0.1, 0.55),
      DRAW(path("M11.8 5.6l3.4 3.2-3.4 3.4"), 0.5, 0.8),
    ],
  },

  "redo-dot": {
    auto: false,
    dur: 1.7,
    parts: [
      circle(5.4, 17.6, 0.9, fill()),
      DRAW(path("M5.4 17.6h9.2c2.8 0 4.8-1.8 4.8-4.4s-2-4.4-4.8-4.4H9"), 0.1, 0.55),
      DRAW(path("M12.2 5.6l-3.4 3.2 3.4 3.4"), 0.5, 0.8),
    ],
  },

  /* speaker, wave zone struck through */
  "volume-off": {
    auto: false,
    dur: 1.6,
    parts: [
      path(SPEAKER),
      SLASH(15.2, 8.6, 19.8, 15.4),
    ],
  },

  /* print + rolled right edge — the little sun pops */
  wallpaper: {
    auto: false,
    dur: 1.8,
    parts: [
      path("M3.4 6.6c0-1.2 1-2.2 2.2-2.2h9.8c1.2 0 2.2 1 2.2 2.2v10.8c0 1.2-1 2.2-2.2 2.2H5.6c-1.2 0-2.2-1-2.2-2.2z"),
      path("M17.6 4.6c1.7 0 3 1.3 3 2.9v9.3c0 1.6-1.3 2.9-3 2.9"),
      path("M3.4 15.8l3.6-4c.6-.7 1.6-.7 2.2 0l4 4.4"),
      G("sun", [circle(8.4, 9, 1.4)]),
    ],
    sAnims: { sun: POP(8.4, 9, 1.3) },
  },

  /* front-loader — the drum arc turns */
  "washing-machine": {
    dur: 2.0,
    pp: false,
    auto: false,
    parts: [
      rect(4.4, 3.6, 15.2, 17, 2),
      circle(12, 13.8, 4.4),
      G("drum", [path("M9.4 12.6a3.4 3.4 0 0 1 5.2-2.2"), path("M14.6 15a3.4 3.4 0 0 1-5.2 2.2")]),
      path("M6.6 5.8h3"),
      circle(17.4, 5.8, 0.55, fill()),
      path("M4.4 8h15.2"),
    ],
    gAnims: { drum: tn("rotate", ["0 12 13.8", "360 12 13.8"]) },
  },

  /* wifi ladder — arcs light in sequence */
  "wifi-high": {
    auto: false,
    dur: 1.9,
    parts: [
      WIFI_DOT,
      A(path(WIFI_A), [an("opacity", ["0.25", "1", "1", "0.25"], [0, 0.14, 0.85, 1])]),
      A(path(WIFI_B), [an("opacity", ["0.25", "0.25", "1", "1", "0.25"], [0, 0.18, 0.34, 0.88, 1])]),
      A(path(WIFI_C), [an("opacity", ["0.25", "0.25", "1", "1", "0.25"], [0, 0.36, 0.52, 0.9, 1])]),
    ],
  },

  "wifi-low": {
    auto: false,
    dur: 1.9,
    parts: [
      WIFI_DOT,
      A(path(WIFI_A), [an("opacity", ["0.25", "1", "1", "0.25"], [0, 0.15, 0.85, 1])]),
      path(WIFI_B, { opacity: 0.16 }),
      path(WIFI_C, { opacity: 0.16 }),
    ],
  },

  "wifi-zero": {
    auto: false,
    dur: 1.9,
    parts: [
      A(WIFI_DOT, [an("opacity", ["1", "0.35", "1"], [0, 0.45, 1])]),
      path(WIFI_A, { opacity: 0.16 }),
      path(WIFI_B, { opacity: 0.16 }),
      path(WIFI_C, { opacity: 0.16 }),
    ],
  },

  /* ================= media extras ================= */

  /* VHS — twin spools turn inside the shell */
  videotape: {
    dur: 2.0,
    pp: false,
    auto: false,
    parts: [
      rect(3, 6.4, 18, 11.2, 1.8),
      path("M6.4 9.2h11.2"),
      G("reelL", [circle(8.4, 13.8, 1.8), path("M8.4 12.4v-0.6M8.4 15.2v0.6M7 13.8h-.6M9.8 13.8h.6")]),
      G("reelR", [circle(15.6, 13.8, 1.8), path("M15.6 12.4v-0.6M15.6 15.2v0.6M14.2 13.8h-.6M16.9 13.8h.6")]),
    ],
    gAnims: {
      reelL: tn("rotate", ["0 8.4 13.8", "360 8.4 13.8"]),
      reelR: tn("rotate", ["0 15.6 13.8", "360 15.6 13.8"]),
    },
  },

  /* compact cassette — window trapezoid, reels spin */
  "cassette-tape": { dur: 1.4, auto: true, parts: [
    rect(2.5, 5.5, 19, 13, 2.5),
    rect(6.5, 9, 11, 4.6, 2.3),
    path("M7 18.5l1.5-2.4h7l1.5 2.4"),
  ] },

  /* synth keys + a note drifting off the top row */
  "keyboard-music": {
    auto: false,
    dur: 1.9,
    parts: [
      rect(3.4, 10.4, 17.2, 9.2, 1.9),
      path("M7 13.2v2.6M10.4 13.2v2.6M13.8 13.2v2.6M17.2 13.2v2.6"),
      G("note", [
        circle(14.6, 6.4, 1.5),
        path("M16.1 6.4V2.9c1.7.2 3 .9 3.6 2.1"),
      ]),
    ],
    gAnims: { note: tn("translate", ["0 0.7", "0 0.7", "0 0", "0 0", "0 0.7"], [0, 0.2, 0.55, 0.8, 1]) },
  },

  /* horn + handle, struck through */
  "megaphone-off": {
    auto: false,
    dur: 1.7,
    parts: [
      path("M4.4 9.8v4.4h2.4"),
      path("M6.8 9.8l8.6-4.2c.7-.4 1.5.1 1.5.9v11c0 .8-.8 1.3-1.5.9L6.8 14.2z"),
      path("M8 14.4v2.8c0 .9.7 1.6 1.6 1.6h1"),
      SLASH(3.4, 3.2, 20.6, 20.8),
    ],
  },

  /* body + swap arrows chasing each other inside */
  "switch-camera": { dur: 1.4, auto: true, parts: [
    path("M3.5 8.5a2 2 0 0 1 2-2h2l1-2h7l1 2h2a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2Z"),
    path("M9.2 12.6a3 3 0 0 1 5.2-1.7M14.8 12.4a3 3 0 0 1-5.2 1.7"),
    path("M14.6 9.4v1.7h-1.7M9.4 15.6v-1.7h1.7"),
  ] },

  /* handset + tremble waves, struck through */
  "vibrate-off": {
    auto: false,
    dur: 1.7,
    parts: [
      rect(8, 4.4, 8, 15.2, 2.6),
      path("M4.6 9.6a7.6 7.6 0 0 0 0 4.8M19.4 9.6a7.6 7.6 0 0 1 0 4.8"),
      SLASH(3.6, 3.4, 20.4, 20.6),
    ],
  },

  /* paper feed + the check stamps on */
  "printer-check": {
    auto: false,
    dur: 1.8,
    parts: [
      path("M7.6 9.8L7.6 5c0-1 .8-1.8 1.8-1.8h5.2c1 0 1.8.8 1.8 1.8v4.8"),
      rect(3.6, 9.8, 16.8, 7.6, 2.4),
      path("M8.4 13.8h7.2v5.9c0 .5-.4.9-.9.9h-5.4c-.5 0-.9-.4-.9-.9z"),
      DRAW(path("M10 16.9l1.3 1.3 2.4-2.8"), 0.3, 0.72),
      circle(18.3, 11.8, 0.55, fill()),
    ],
  },

  /* scan-eye/search/text are drawn in editor-01 — not re-shipped here. */

  /* bulb, struck through */
  "lightbulb-off": {
    auto: false,
    dur: 1.6,
    parts: [
      path("M17.4 15.6C18.8 14.1 19.5 12.3 19.5 10.3A7.5 7.5 0 1 0 4.5 10.3C4.5 12.3 5.2 14.1 6.6 15.6"),
      path("M10.8 12.4L12 14.3L13.2 12.4"),
      line(8.7, 19, 15.3, 19),
      line(10.3, 21.6, 13.7, 21.6),
      SLASH(3.4, 3.2, 20.6, 20.8),
    ],
  },

  /* wand + tip star flares */
  "wand-sparkles": {
    auto: false,
    dur: 1.9,
    parts: [
      DRAW(path("M4.6 19.4L14.8 9.2"), 0.08, 0.45),
      G("star", [path("M17.4 4.4l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z")]),
      G("tw1", [path("M8.6 4.6l.5 1.3 1.3.5-1.3.5-.5 1.3-.5-1.3-1.3-.5 1.3-.5z")]),
      G("tw2", [path("M19.4 14.4l.4 1 1 .4-1 .4-.4 1-.4-1-1-.4 1-.4z")]),
    ],
    sAnims: {
      star: { pivot: [17.4, 7.4], anim: tn("scale", ["0.6", "0.6", "1.15", "1", "1"], [0, 0.32, 0.55, 0.75, 1]) },
      tw1: { pivot: [8.6, 6.4], anim: tn("scale", ["0.6", "0.6", "1.2", "1", "1"], [0, 0.42, 0.65, 0.85, 1]) },
      tw2: { pivot: [19.4, 16.2], anim: tn("scale", ["0.6", "0.6", "1.2", "1", "1"], [0, 0.5, 0.72, 0.9, 1]) },
    },
  },
};
