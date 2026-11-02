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
export const icons = {  "house-plug": {
    auto: false,
    dur: 1.6,
    parts: [
      // house outline whose floor sweeps up into the plug's cord
      path("M7.6 20.2c-2.2 0-4-1.8-4-4v-4.6c0-1.6.6-2.6 1.7-3.4L9.6 5c1.4-1 3.4-1 4.8 0l4.3 3.2c1.1.8 1.7 1.8 1.7 3.4v4.6c0 1.9-.7 2.9-1.9 3.5-.5.3-1.3.5-2.3.5h-1.6c-1.6 0-2.6-1.2-2.6-2.9v-.9"),
      G("plug", [
        path("M9.1 11.9h5.8c.4 0 .8.3.8.8v.5c0 2-1.7 3.7-3.7 3.7s-3.7-1.7-3.7-3.7v-.5c0-.5.4-.8.8-.8z"),
        line(10.4, 9.8, 10.4, 11.9),
        line(13.6, 9.8, 13.6, 11.9),
      ]),
    ],
    gAnims: { plug: DIP(0, 0.8) },
  },

  "house-plus": {
    auto: false,
    dur: 1.5,
    parts: [
      path("M12 19.2H8.8c-3 0-4.6-1.6-4.6-4.6v-3.9c0-1.5.5-2.4 1.5-3.2l4.5-3.3c1.1-.8 2.5-.8 3.6 0l4.5 3.3c1 .8 1.5 1.7 1.5 3.2v2.6"),
      G("plus", [line(17.6, 14.9, 17.6, 20.9), line(14.6, 17.9, 20.6, 17.9)]),
    ],
    sAnims: { plus: POP(17.6, 17.9, 1.22) },
  },

  "house-solar-panel": {
    auto: false,
    dur: 1.6,
    parts: [
      path("M8.4 4.6h7.2c.9 0 1.7.5 2 1.4l2.2 4.7c.4.9-.3 1.9-1.3 1.9H5.5c-1 0-1.7-1-1.3-1.9l2.2-4.7c.3-.9 1.1-1.4 2-1.4z"),
      line(5.6, 8.6, 18.4, 8.6),
      line(10, 5.2, 9.3, 11.9),
      line(14, 5.2, 14.7, 11.9),
      path("M5.8 12.6v3c0 1.6 1.2 2.8 2.8 2.8"),
      path("M18.2 12.6v3c0 1.6-1.2 2.8-2.8 2.8"),
      A(path("M12.7 14.2l-2.5 3h3.6l-2.5 3"), BLINK(0.3)),
    ],
  },

  "house-wifi": {
    auto: false,
    dur: 1.8,
    parts: [
      path("M3.6 11.6c0-1.6.6-2.6 1.7-3.4l4.3-3.2c1.4-1 3.4-1 4.8 0l4.3 3.2c1.1.8 1.7 1.8 1.7 3.4v4.6c0 2.2-1.8 4-4 4H7.6c-2.2 0-4-1.8-4-4v-4.6z"),
      A(path("M6.1 12.4a8.3 8.3 0 0 1 11.8 0"), [an("opacity", ["1", "1", "0.3", "1", "1"], [0, 0.35, 0.47, 0.6, 1])]),
      A(path("M8 14.3a5.6 5.6 0 0 1 8 0"), [an("opacity", ["1", "1", "0.3", "1", "1"], [0, 0.2, 0.32, 0.45, 1])]),
      A(path("M10.1 16.4a2.7 2.7 0 0 1 3.8 0"), [an("opacity", ["1", "1", "0.3", "1", "1"], [0, 0.05, 0.17, 0.3, 1])]),
      circle(12, 18.3, 1, fill()),
    ],
  },

  lamp01: {
    auto: false,
    dur: 1.9,
    parts: [
      G("hang", [
        line(12, 3, 12, 6.6),
        path("M12 6.6c-3.9 0-6.8 2.7-6.8 6.4 0 .4.4.8.8.8h12c.4 0 .8-.4.8-.8 0-3.7-2.9-6.4-6.8-6.4z"),
        line(4.6, 13.5, 19.4, 13.5),
        path("M9.9 13.8c0 1.5 1 2.6 2.1 2.6s2.1-1.1 2.1-2.6"),
        line(12, 19.2, 12, 21),
        line(9.2, 18.4, 7.6, 20),
        line(14.8, 18.4, 16.4, 20),
      ]),
    ],
    gAnims: { hang: WIG(12, 3, 6) },
  },

  lamp02: {
    auto: false,
    dur: 1.9,
    parts: [
      G("hang", [
        line(12, 3, 12, 6.4),
        path("M12 6.3c-4.5 0-7.7 3-7.9 6.5 0 .5.5 1 1.1.9 1.2-.2 2.1-.8 2.9-.4.7.4 1.8.7 3.9.7s3.2-.3 3.9-.7c.8-.4 1.7.2 2.9.4.6.1 1.1-.4 1.1-.9-.2-3.5-3.4-6.5-7.9-6.5z"),
        path("M10 14.2c0 1.4 1 2.4 2 2.4s2-1 2-2.4"),
        line(12, 19, 12, 20.8),
        line(9.3, 18.2, 7.7, 19.8),
        line(14.7, 18.2, 16.3, 19.8),
      ]),
    ],
    gAnims: { hang: WIG(12, 3, 5) },
  },

  lamp03: {
    auto: false,
    dur: 1.8,
    parts: [
      path("M9.6 3.8h4.8c.8 0 1.5.5 1.8 1.3l2 4.5c.4.9-.2 1.9-1.2 1.9H7c-1 0-1.6-1-1.2-1.9l2-4.5c.3-.8 1-1.3 1.8-1.3z"),
      line(12, 11.5, 12, 18.8),
      path("M8 20.9h2.2c.3-1.3 1-2.1 1.8-2.1s1.5.8 1.8 2.1H16"),
      G("chain", [line(15.2, 11.5, 15.2, 13.9), circle(15.2, 14.6, 0.7, fill())]),
    ],
    gAnims: { chain: WIG(15.2, 11.5, 11) },
  },

  lamp04: {
    auto: false,
    dur: 1.8,
    parts: [
      path("M9.8 4.4h4.4c.8 0 1.5.4 1.8 1.1l1.9 4.3c.4.9-.2 1.9-1.2 1.9H7.3c-1 0-1.6-1-1.2-1.9l1.9-4.3c.3-.7 1-1.1 1.8-1.1z"),
      G("bulb", [
        line(12, 11.7, 12, 14.9),
        circle(12, 16.6, 1.7),
        line(12, 18.3, 12, 19.2),
      ]),
      path("M8.6 20.9h1.6c.3-1.2 1-2 1.8-2s1.5.8 1.8 2h1.6"),
    ],
    gAnims: { bulb: WIG(12, 11.7, 8) },
  },

  lamp05: {
    auto: false,
    dur: 1.7,
    parts: [
      path("M10 4.4h4c.7 0 1.4.4 1.7 1.1l1.6 3.4c.4.9-.2 1.9-1.2 1.9H7.9c-1 0-1.6-1-1.2-1.9l1.6-3.4c.3-.7 1-1.1 1.7-1.1z"),
      line(12, 10.7, 12, 14),
      line(9.2, 14, 14.8, 14),
      path("M9.9 14c-1.2 1.5-1.6 3.4-1.1 5.3.3 1.1.9 1.8 2 1.8h2.6c1.1 0 1.7-.7 2-1.8.5-1.9.1-3.8-1.1-5.3"),
      A(circle(12, 18.2, 1.1, fill()), BLINK(0.2)),
    ],
  },

  /* ---- depth additions: civic/commercial stock real apps need ---- */

  /* generic office block — window grid pops over the facade */
  building: { dur: 1.7,
    parts: [
      path("M7.2 21L7.2 5.6C7.2 4.2 8.2 3.2 9.6 3.2L14.4 3.2C15.8 3.2 16.8 4.2 16.8 5.6L16.8 21"),
      G("win", [
        path("M9.6 6.8h1.6M12.8 6.8h1.6M9.6 10.4h1.6M12.8 10.4h1.6M9.6 14h1.6M12.8 14h1.6")
      ]),
      path("M10.9 21L10.9 18.3C10.9 17.7 11.4 17.4 12 17.4C12.6 17.4 13.1 17.7 13.1 18.3L13.1 21"),
      line(4.4, 21, 19.6, 21)
    ],
    sAnims: { win: POP(12, 10.4, 1.14) },
  },

  /* storefront — scalloped awning over window + door */
  store: { dur: 1.7,
    parts: [
      path("M4.9 9.7L6.1 5.4C6.4 4.6 7.1 4.1 7.9 4.1L16.1 4.1C16.9 4.1 17.6 4.6 17.9 5.4L19.3 9.7"),
      G("awn", [
        path("M4.9 9.7A1.8 1.8 0 0 0 8.5 9.7A1.8 1.8 0 0 0 12.1 9.7A1.8 1.8 0 0 0 15.7 9.7A1.8 1.8 0 0 0 19.3 9.7")
      ]),
      path("M6 13.4L6 21L18 21L18 13.4"),
      path("M7.9 15.7L7.9 18.5L11.6 18.5L11.6 15.7Z"),
      path("M13.9 21L13.9 16.8C13.9 16.2 14.4 15.7 15 15.7L15.7 15.7C16.3 15.7 16.8 16.2 16.8 16.8L16.8 21"),
      line(3.4, 21, 20.6, 21)
    ],
    gAnims: { awn: tn("translate", ["0 0","0 0","0 0.5","0 0","0 0"], HOLD) },
  },

  /* schoolhouse — gabled front, flag on the ridge, arched door */
  "school": { dur: 1.4, auto: true, parts: [
    path("M3.5 20.5V10L12 5.5 20.5 10v10.5Z"),
    path("M12 5.5V2.5h3"),
    circle(12, 11.5, 1.5),
    path("M10 20.5v-3.2a2 2 0 0 1 4 0v3.2"),
  ] },

  /* chapel — gabled steeple with cross, side wings, arched door */
  church: { dur: 1.8,
    parts: [
      path("M9.8 21L9.8 9.6L12 6.2L14.2 9.6L14.2 21"),
      G("cross", [
        path("M12 6.2L12 3.4M10.9 4.3L13.1 4.3")
      ]),
      path("M9.8 12.6L6.4 12.6C5.4 12.6 4.7 13.2 4.7 14.2L4.7 21M14.2 12.6L17.6 12.6C18.6 12.6 19.3 13.2 19.3 14.2L19.3 21"),
      path("M11.1 21L11.1 18.4A0.9 0.9 0 0 1 12.9 18.4L12.9 21"),
      path("M11.2 13.6L11.2 12.4A0.8 0.8 0 0 1 12.8 12.4L12.8 13.6Z"),
      line(3.2, 21, 20.8, 21)
    ],
    sAnims: { cross: POP(12, 4.8, 1.14) },
  },

  /* mosque — onion dome, finial dot, twin minarets, arched door */
  mosque: { dur: 1.8,
    parts: [
      /* narrower dome + single-stroke minarets: the 1-unit-wide towers and
         the slot door were filling in solid */
      path("M12 5.2C13.4 6.4 14.9 7.8 15.7 9.5C16.4 10.9 16.8 12.3 16.8 13.6L16.8 14.8L7.2 14.8L7.2 13.6C7.2 12.3 7.6 10.9 8.3 9.5C9.1 7.8 10.6 6.4 12 5.2Z"),
      line(12, 5.2, 12, 3.6),
      A(circle(12, 3, 0.6, fill()), BLINK(0.25)),
      path("M7.2 14.8V21M16.8 14.8V21"),
      path("M3.8 21V10M20.2 21V10"),
      path("M10.4 21v-2.6a1.6 1.6 0 0 1 3.2 0V21"),
      line(3, 21, 21, 21)
    ],
  },

  /* warehouse — wide gable, roll-up door rides open on its slats */
  warehouse: { dur: 1.8,
    parts: [
      path("M3.8 21L3.8 9.9L12 4.4L20.2 9.9L20.2 21"),
      G("door", [
        path("M8.6 21L8.6 13.4L15.4 13.4L15.4 21"),
        path("M8.6 15.7h6.8M8.6 18h6.8")
      ]),
      path("M10.6 8.6h2.8"),
      line(3, 21, 21, 21)
    ],
    gAnims: { door: tn("translate", ["0 0","0 0","0 -1","0 0","0 0"], HOLD) },
  },

  /* university — pediment over four columns, stepped base */
  university: { dur: 1.8,
    parts: [
      /* four columns on an even 4-unit beat; one plinth instead of three
         stacked steps that fused into a slab */
      path("M4 8.4L12 3.6L20 8.4Z"),
      path("M6 12.2v4.4M10 12.2v4.4M14 12.2v4.4M18 12.2v4.4"),
      path("M3.6 20.6h16.8")
    ],
  },

  /* lighthouse — tapered tower, lamp room, beam sweeps its arc */
  lighthouse: { dur: 1.9,
    parts: [
      path("M9.2 21L9.9 10.8L14.1 10.8L14.8 21"),
      path("M9.7 14.2h4.6M9.45 17.6h5.1"),
      path("M9.6 10.8L9.6 8.4C9.6 7.9 10 7.5 10.5 7.5L13.5 7.5C14 7.5 14.4 7.9 14.4 8.4L14.4 10.8Z"),
      path("M9.9 7.5L12 5.8L14.1 7.5"),
      circle(12, 9.1, 0.7, fill()),
      G("beam", [
        path("M14.8 8.3L20.4 6.4L20.4 11.8L14.8 10Z")
      ]),
      path("M6.1 21L7.3 19.4L8.7 21M15.3 21L16.7 19.4L17.9 21")
    ],
    gAnims: { beam: tn("rotate", ["0 14.8 9.1","0 14.8 9.1","-13 14.8 9.1","10 14.8 9.1","0 14.8 9.1"], HOLD) },
  },
};
