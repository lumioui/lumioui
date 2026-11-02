/* ui-02 — badges, bookmarks, browser, brushes, certificates, cog,
   color tools, columns, crop, dashboards.
   Lumio voice: soft blob silhouettes, big radii, one playful accent.
   Every icon gets a bespoke SMIL gesture (auto:false) — one signature
   verb each: seals shimmer, ribbons tuck, corner marks pop/shake/blink,
   cogs ratchet one tooth, dashboard cells swell in a staggered cascade. */

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

/* cosine-modulated bloom — seals and cog teeth (same math as gen.mjs's
   flowerPath, redefined here so the batch stays self-contained). */
const bloom = (cx, cy, lobes, rMid, amp, steps = 12) => {
  const pts = [];
  for (let i = 0; i < lobes * steps; i++) {
    const t = (i / (lobes * steps)) * Math.PI * 2;
    const r = rMid + amp * Math.cos(lobes * t + Math.PI / 2);
    pts.push(`${(cx + r * Math.cos(t)).toFixed(1)} ${(cy + r * Math.sin(t)).toFixed(1)}`);
  }
  return `M${pts.join("L")}Z`;
};

/* ---- bespoke gesture idioms -------------------------------------------
   HOLD phrasing: rest ~30%, act through mid-cycle, settle back — pose at
   t=0 always equals pose at t=1 so the loop is seamless. Motion only;
   no part geometry is touched. */
const HOLD = [0, 0.3, 0.55, 0.8, 1];
/* scale-pop around a mark's own center (sAnims entry). */
const POP = (cx, cy, s = 1.24) => ({
  pivot: [cx, cy],
  anim: tn("scale", ["1", "1", `${s}`, "1", "1"], HOLD),
});
/* wiggle — rotate −a then +a around a pivot, with rest holds. */
const WIG = (cx, cy, a = 9) =>
  tn("rotate", [`0 ${cx} ${cy}`, `0 ${cx} ${cy}`, `-${a} ${cx} ${cy}`, `${a - 2} ${cx} ${cy}`, `0 ${cx} ${cy}`], HOLD);
/* dip — translate out along an axis and spring back. */
const DIP = (dx, dy) => tn("translate", ["0 0", "0 0", `${dx} ${dy}`, "0 0", "0 0"], HOLD);
/* blink — opacity dips once on a mark. */
const BLINK = (lo = 0.2) => [an("opacity", ["1", "1", `${lo}`, "1", "1"], [0, 0.32, 0.46, 0.6, 1])];
/* trace — the stroke writes itself on (checks, slashes, signatures).
   pathLength=1 normalizes so no measuring is needed. */
const DRAW = (p, t0 = 0.15, t1 = 0.62) =>
  A({ ...p, a: { ...p.a, pathLength: 1, "stroke-dasharray": 1 } },
    [an("stroke-dashoffset", ["1", "1", "0", "0"], [0, t0, t1, 1])]);
/* swell — a rect cell inflates around its center inside [a,b], staggered
   cascades like the canon grid icon. */
const INFLATE = (cx, cy, w, h, a0, b0, s = 1.14) => {
  const m = +((a0 + b0) / 2).toFixed(3);
  const xs = (k) => +(cx - (w * k) / 2).toFixed(2);
  const ys = (k) => +(cy - (h * k) / 2).toFixed(2);
  return [
    an("x", [xs(1), xs(1), xs(s), xs(1)], [0, a0, m, b0]),
    an("y", [ys(1), ys(1), ys(s), ys(1)], [0, a0, m, b0]),
    an("width", [w, w, +(w * s).toFixed(2), w], [0, a0, m, b0]),
    an("height", [h, h, +(h * s).toFixed(2), h], [0, a0, m, b0]),
  ];
};
/* ratchet — a 6-lobe cog turns one tooth pitch (60°) and rocks back. */
const RATCHET = (cx, cy, deg = 60) => tn("rotate", [`0 ${cx} ${cy}`, `${deg} ${cx} ${cy}`]);

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

/** Pen badge (STYLE.md accents): a hollow 45° pen, nib at (tx, ty), with a
 *  round back end. One shape for every *-pen / *-edit badge. */
const pen = (tx, ty, L = 9.4, w = 1.9, nl = 2.6) => {
  const r = (v) => +v.toFixed(2), k = Math.SQRT1_2;
  const P = (d, s) => `${r(tx + k * d + k * s)} ${r(ty - k * d + k * s)}`;
  return `M${tx} ${ty}L${P(nl, w)}L${P(L, w)}A${w} ${w} 0 0 0 ${P(L, -w)}L${P(nl, -w)}Z`;
};

/* ---- shared geometry ---- */

const SEAL = bloom(12, 12, 10, 7.7, 1); // wavy rosette
const COG = bloom(12, 12, 6, 7.3, 1.8); // 6 deep lobes = gear teeth
const MINICOG = bloom(17, 7, 6, 2.8, 0.7);
const PANELCOG = bloom(17.2, 17.2, 6, 3.3, 0.8);

/* wide ribbon bookmark, notch apex ~y17 */
const BW =
  "M7.9 3.1h8.2c1.4 0 2.5 1.1 2.5 2.5v13.6c0 1-1.1 1.5-1.9.9l-4-2.9c-.4-.3-1-.3-1.4 0l-4 2.9c-.8.6-1.9.1-1.9-.9V5.6c0-1.4 1.1-2.5 2.5-2.5z";
/* narrow bookmark shifted left so a mark floats top-right */
const NBM =
  "M6.4 3.1h6.2c1.3 0 2.4 1.1 2.4 2.5v13.5c0 1-1.1 1.5-1.8.9l-3.2-2.4c-.4-.3-1-.3-1.4 0l-3 2.4c-.7.6-1.8.1-1.8-.9V5.6c0-1.4 1.1-2.5 2.4-2.5z";
/* wide bookmark with the top-right corner open for a floating mark */
const BWO =
  "M18.6 12.6v6.6c0 1-1.1 1.5-1.9.9l-4-2.9c-.4-.3-1-.3-1.4 0l-4 2.9c-.8.6-1.9.1-1.9-.9V5.6c0-1.4 1.1-2.5 2.5-2.5h5.4";
/* broken wide bookmark for the "off" variants — top-left and right-side gaps */
const OFFL =
  "M18.6 19.2c0 1-1.1 1.5-1.9.9l-4-2.9c-.4-.3-1-.3-1.4 0l-4 2.9c-.8.6-1.9.1-1.9-.9V7.8c0-1.6.2-2.9.7-3.8";
const OFFR = "M18.6 10.6V5.6c0-1.4-1.1-2.5-2.5-2.5H8.6";

const PLUS = "M18.4 3.6v4.4M16.2 5.8h4.4";
const MINUS = "M16.2 5.8h4.4";
const XMARK = "M16.4 3.8l4 4M20.4 3.8l-4 4";
const NBAND = "M3.8 7.3h6.6"; // partial left band on the narrow bookmark
const PENCIL =
  "M15 9.5l.4-1.6c.1-.4.3-.7.6-.9l3.3-3.3c.5-.5 1.2-.5 1.7 0 .5.5.5 1.2 0 1.7l-3.3 3.3c-.2.3-.5.5-.9.6l-1.6.4-.2-.2z";

const DC1 = circle(7, 7, 3.05);
const DC2 = circle(17, 7, 3.05);
const DC3 = circle(7, 17, 3.05);
const DC4 = circle(17, 17, 3.05);

const SQ1 = rect(3.4, 3.4, 7, 7, 2.4);
const SQ2 = rect(13.6, 3.4, 7, 7, 2.4);
const SQ3 = rect(3.4, 13.6, 7, 7, 2.4);
const SQ4 = rect(13.6, 13.6, 7, 7, 2.4);

/* the ribbon-tuck gesture for the plain bookmark pair — the whole ribbon
   presses in and springs back, like tapping "save". */
const TUCK = tn("translate", ["0 0", "0 0", "0 1.2", "0 -0.35", "0 0"], [0, 0.32, 0.52, 0.72, 1]);

const colsCog = {
  dur: 1.5,
  auto: false,
  parts: [
    path("M20.6 11.2V6.4c0-1.8-1.4-3.2-3.2-3.2H6.6c-1.8 0-3.2 1.4-3.2 3.2v11.2c0 1.8 1.4 3.2 3.2 3.2h4.8"),
    line(9.6, 3.2, 9.6, 20.8),
    line(15, 3.2, 15, 10.6),
    G("turn", cog(17.6, 17.6, 0.9)),
  ],
  gAnims: { turn: RATCHET(17.6, 17.6) },
};

export const icons = {
  /* ---------- badges ---------- */

  /* wax-seal shimmer — the rosette turns one lobe notch and rocks back */
  "badge-turkish-lira": { dur: 1.8, auto: false,
    parts: [
      G("turn", [
        path("M19.7 12L19.2 12.4L18.8 12.4L18.6 13.4L18.7 14L19 14.4L19.7 15L19.7 15.5L19.8 16L19.4 16.25L18.9 16.25L18.2 16.5L17.6 16.5L17.1 16.5L16.7 16.6L16.7 17.1L16.6 17.6L16.5 18.25L16.5 18.9L16.5 19.4L15.9 19.75L15.5 19.75L14.9 19.75L14.4 19.25L13.9 19.25L13.4 19L13 18.75L12.7 19.25L12 19.75L11.6 20.25L11.1 20.25L10.6 20.5L10.2 20.6L10.2 19.9L9.9 19.25L9.6 18.75L9.4 18.25L8.6 18L8.1 17.9L7.5 18L6.8 18.25L6.3 18.4L5.8 18.4L5.8 17.75L5.6 17.25L5.6 16.5L5.8 16L6 15.4L6.1 15L5.3 14.75L4.7 14.6L4.1 14.4L3.6 14L3.6 13.4L3.4 13L3.5 12.4L4.3 12L4.8 11.6L5.2 11.6L5.4 10.6L5.3 10L5 9.6L4.3 9L4.3 8.5L4.2 8L4.6 7.75L5.1 7.75L5.8 7.5L6.4 7.5L6.9 7.5L7.3 7.4L7.3 7L7.4 6.4L7.5 5.75L7.5 5L7.5 4.6L8.1 4.25L8.5 4.25L9.1 4.25L9.6 4.75L10.1 4.75L10.6 5L11 5.25L11.3 4.75L12 4.25L12.4 3.75L12.9 3.75L13.4 3.5L13.8 3.4L13.8 4L14.1 4.75L14.4 5.25L14.6 5.75L15.4 6L15.9 6L16.5 6L17.2 5.75L17.7 5.6L18.2 5.6L18.2 6.25L18.4 6.75L18.4 7.5L18.2 8L18 8.6L17.9 9L18.7 9.25L19.3 9.4L19.9 9.6L20.4 10L20.4 10.6L20.6 11L20.5 11.6Z")
      ]),
      path("M10.6 8.2L10.6 15.6L11.8 15.6C13.6 15.6 14.9 14.3 14.9 12.6"),
      path("M9 12.2L13.4 9.9M9.6 14.2L14 11.9")
    ],
    gAnims: { turn: tn("rotate", ["0 12 12","36 12 12"]) },
  },
  /* denied seal — the X shakes its head */
  "badge-x": { dur: 1.4, auto: false,
    parts: [
      path("M19.7 12L19.2 12.4L18.8 12.4L18.6 13.4L18.7 14L19 14.4L19.7 15L19.7 15.5L19.8 16L19.4 16.25L18.9 16.25L18.2 16.5L17.6 16.5L17.1 16.5L16.7 16.6L16.7 17.1L16.6 17.6L16.5 18.25L16.5 18.9L16.5 19.4L15.9 19.75L15.5 19.75L14.9 19.75L14.4 19.25L13.9 19.25L13.4 19L13 18.75L12.7 19.25L12 19.75L11.6 20.25L11.1 20.25L10.6 20.5L10.2 20.6L10.2 19.9L9.9 19.25L9.6 18.75L9.4 18.25L8.6 18L8.1 17.9L7.5 18L6.8 18.25L6.3 18.4L5.8 18.4L5.8 17.75L5.6 17.25L5.6 16.5L5.8 16L6 15.4L6.1 15L5.3 14.75L4.7 14.6L4.1 14.4L3.6 14L3.6 13.4L3.4 13L3.5 12.4L4.3 12L4.8 11.6L5.2 11.6L5.4 10.6L5.3 10L5 9.6L4.3 9L4.3 8.5L4.2 8L4.6 7.75L5.1 7.75L5.8 7.5L6.4 7.5L6.9 7.5L7.3 7.4L7.3 7L7.4 6.4L7.5 5.75L7.5 5L7.5 4.6L8.1 4.25L8.5 4.25L9.1 4.25L9.6 4.75L10.1 4.75L10.6 5L11 5.25L11.3 4.75L12 4.25L12.4 3.75L12.9 3.75L13.4 3.5L13.8 3.4L13.8 4L14.1 4.75L14.4 5.25L14.6 5.75L15.4 6L15.9 6L16.5 6L17.2 5.75L17.7 5.6L18.2 5.6L18.2 6.25L18.4 6.75L18.4 7.5L18.2 8L18 8.6L17.9 9L18.7 9.25L19.3 9.4L19.9 9.6L20.4 10L20.4 10.6L20.6 11L20.5 11.6Z"),
      G("deny", [
        path("M9.4 9.4L14.6 14.6M14.6 9.4L9.4 14.6")
      ])
    ],
    gAnims: { deny: tn("rotate", ["0 12 12","0 12 12","-10 12 12","8 12 12","0 12 12"], [0,0.3,0.55,0.8,1]) },
  },

  /* ---------- bookmarks ---------- */

  bookmark01: { dur: 1.35, auto: false,
    parts: [
      G("tuck", [
        path("M7.9 3.1L16.1 3.1C17.5 3.1 18.6 4.2 18.6 5.6L18.6 19.25C18.6 20.2 17.5 20.7 16.7 20L12.7 17.25C12.3 16.9 11.7 16.9 11.3 17.25L7.3 20C6.5 20.7 5.4 20.2 5.4 19.25L5.4 5.6C5.4 4.2 6.5 3 7.9 3Z"),
        line(5.4, 7.25, 18.6, 7.25)
      ])
    ],
    gAnims: { tuck: tn("translate", ["0 0","0 0","0 1.2","0 -0.35","0 0"], [0,0.32,0.52,0.72,1]) },
  },
  bookmark02: { dur: 1.35, auto: false,
    parts: [
      G("tuck", [
        path("M7.9 3.1L16.1 3.1C17.5 3.1 18.6 4.2 18.6 5.6L18.6 19.25C18.6 20.2 17.5 20.7 16.7 20L12.7 17.25C12.3 16.9 11.7 16.9 11.3 17.25L7.3 20C6.5 20.7 5.4 20.2 5.4 19.25L5.4 5.6C5.4 4.2 6.5 3 7.9 3Z")
      ])
    ],
    gAnims: { tuck: tn("translate", ["0 0","0 0","0 1.2","0 -0.35","0 0"], [0,0.32,0.52,0.72,1]) },
  },
  /* the ribbon tab gets pulled out of the card edge */
  bookmark03: { dur: 1.35, auto: false,
    parts: [
      rect(3.6, 3.6, 16.75, 16.75, 4.4),
      G("pull", [
        path("M9.6 3.6L9.6 9.4C9.6 10.1 10.3 10.4 10.8 10L12 9L13.2 10C13.7 10.4 14.4 10.1 14.4 9.4L14.4 3.6")
      ])
    ],
    gAnims: { pull: tn("translate", ["0 0","0 0","0 1.6","0 0","0 0"], [0,0.3,0.55,0.8,1]) },
  },
  "bookmark-add01": { dur: 1.25, auto: false,
    parts: [
      path("M6.4 3.1L12.6 3.1C13.9 3.1 15 4.2 15 5.6L15 19.1C15 20.1 13.9 20.6 13.2 20L10 17.6C9.6 17.6 9 17.6 8.6 17.6L5.6 20C4.9 20.6 3.8 20.1 3.8 19.1L3.8 5.6C3.8 4.2 4.9 3 6.2 3Z"),
      path("M3.8 7.3L10.4 7.25"),
      G("pop", [
        path("M18.4 3.6L18.4 8M16.2 5.8L20.6 5.75")
      ])
    ],
    sAnims: { pop: { pivot: [18.4, 5.8], anim: tn("scale", ["1","1","1.24","1","1"], [0,0.3,0.55,0.8,1]) } },
  },
  "bookmark-add02": { dur: 1.25, auto: false,
    parts: [
      path("M6.4 3.1L12.6 3.1C13.9 3.1 15 4.2 15 5.6L15 19.1C15 20.1 13.9 20.6 13.2 20L10 17.6C9.6 17.6 9 17.6 8.6 17.6L5.6 20C4.9 20.6 3.8 20.1 3.8 19.1L3.8 5.6C3.8 4.2 4.9 3 6.2 3Z"),
      G("pop", [
        path("M18.4 3.6L18.4 8M16.2 5.8L20.6 5.75")
      ])
    ],
    sAnims: { pop: { pivot: [18.4, 5.8], anim: tn("scale", ["1","1","1.24","1","1"], [0,0.3,0.55,0.8,1]) } },
  },
  "bookmark-block01": { dur: 1.4, auto: false,
    parts: [
      path("M6.4 3.1L12.6 3.1C13.9 3.1 15 4.2 15 5.6L15 19.1C15 20.1 13.9 20.6 13.2 20L10 17.6C9.6 17.6 9 17.6 8.6 17.6L5.6 20C4.9 20.6 3.8 20.1 3.8 19.1L3.8 5.6C3.8 4.2 4.9 3 6.2 3Z"),
      path("M3.8 7.3L10.4 7.25"),
      G("deny", [
        rect(15.8, 3.6, 5.2, 5.2, 1.8),
        line(17, 4.6, 19.8, 7.4)
      ])
    ],
    gAnims: { deny: tn("rotate", ["0 18.4 6.2","0 18.4 6.2","-11 18.4 6.2","9 18.4 6.2","0 18.4 6.2"], [0,0.3,0.55,0.8,1]) },
  },
  "bookmark-block02": { dur: 1.4, auto: false,
    parts: [
      path("M6.4 3.1L12.6 3.1C13.9 3.1 15 4.2 15 5.6L15 19.1C15 20.1 13.9 20.6 13.2 20L10 17.6C9.6 17.6 9 17.6 8.6 17.6L5.6 20C4.9 20.6 3.8 20.1 3.8 19.1L3.8 5.6C3.8 4.2 4.9 3 6.2 3Z"),
      G("deny", [
        rect(15.8, 3.6, 5.2, 5.2, 1.8),
        line(17, 4.6, 19.8, 7.4)
      ])
    ],
    gAnims: { deny: tn("rotate", ["0 18.4 6.2","0 18.4 6.2","-11 18.4 6.2","9 18.4 6.2","0 18.4 6.2"], [0,0.3,0.55,0.8,1]) },
  },
  "bookmark-check01": { dur: 1.3, auto: false,
    parts: [
      path("M7.9 3.1L16.1 3.1C17.5 3.1 18.6 4.2 18.6 5.6L18.6 19.25C18.6 20.2 17.5 20.7 16.7 20L12.7 17.25C12.3 16.9 11.7 16.9 11.3 17.25L7.3 20C6.5 20.7 5.4 20.2 5.4 19.25L5.4 5.6C5.4 4.2 6.5 3 7.9 3Z"),
      line(5.4, 7.25, 18.6, 7.25),
      A(path("M9.2 12.6L11.1 14.5L14.2 11", {"pathLength":1,"stroke-dasharray":1}), [an("stroke-dashoffset", [7.36,7.36,0,0], [0,0.15,0.62,1])])
    ],
  },
  "bookmark-check02": { dur: 1.3, auto: false,
    parts: [
      path("M7.9 3.1L16.1 3.1C17.5 3.1 18.6 4.2 18.6 5.6L18.6 19.25C18.6 20.2 17.5 20.7 16.7 20L12.7 17.25C12.3 16.9 11.7 16.9 11.3 17.25L7.3 20C6.5 20.7 5.4 20.2 5.4 19.25L5.4 5.6C5.4 4.2 6.5 3 7.9 3Z"),
      A(path("M8.4 11.8L10.9 14.25L15.9 8.75", {"pathLength":1,"stroke-dasharray":1}), [an("stroke-dashoffset", [10.93,10.93,0,0], [0,0.15,0.62,1])])
    ],
  },
  "bookmark-minus01": { dur: 1.4, auto: false,
    parts: [
      path("M7.9 3.1L16.1 3.1C17.5 3.1 18.6 4.2 18.6 5.6L18.6 19.25C18.6 20.2 17.5 20.7 16.7 20L12.7 17.25C12.3 16.9 11.7 16.9 11.3 17.25L7.3 20C6.5 20.7 5.4 20.2 5.4 19.25L5.4 5.6C5.4 4.2 6.5 3 7.9 3Z"),
      line(5.4, 7.25, 18.6, 7.25),
      A(line(9.2, 12.2, 14.8, 12.2, { pathLength: 1, "stroke-dasharray": 1 }), [an("stroke-dashoffset", [1, 1, 0, 0], [0, 0.15, 0.62, 1])]),
    ] },
  "bookmark-minus02": { dur: 1.4, auto: false,
    parts: [
      path("M7.9 3.1L16.1 3.1C17.5 3.1 18.6 4.2 18.6 5.6L18.6 19.25C18.6 20.2 17.5 20.7 16.7 20L12.7 17.25C12.3 16.9 11.7 16.9 11.3 17.25L7.3 20C6.5 20.7 5.4 20.2 5.4 19.25L5.4 5.6C5.4 4.2 6.5 3 7.9 3Z"),
      A(line(9, 10.6, 15, 10.6, { pathLength: 1, "stroke-dasharray": 1 }), [an("stroke-dashoffset", [1, 1, 0, 0], [0, 0.15, 0.62, 1])]),
    ] },
  /* crossing-out — the slash strikes through the ribbon */
  "bookmark-off01": { dur: 1.5, auto: false,
    parts: [
      path("M8.4 3H16.1C17.5 3 18.6 4.2 18.6 5.6V13"),
      path("M5.4 10.8V19.25C5.4 20.2 6.5 20.7 7.3 20L11.3 17.25C11.7 16.9 12.3 16.9 12.7 17.25L14.4 18.4"),
      line(11.6, 7.25, 18.6, 7.25),
      A(line(3.8, 3.8, 20.2, 20.2, { pathLength: 1, "stroke-dasharray": 1 }), [an("stroke-dashoffset", ["1", "1", "0", "0"], [0, 0.2, 0.7, 1])]),
    ] },
  "bookmark-off02": { dur: 1.5, auto: false,
    parts: [
      path("M8.4 3H16.1C17.5 3 18.6 4.2 18.6 5.6V13"),
      path("M5.4 10.8V19.25C5.4 20.2 6.5 20.7 7.3 20L11.3 17.25C11.7 16.9 12.3 16.9 12.7 17.25L14.4 18.4"),
      A(line(3.8, 3.8, 20.2, 20.2, { pathLength: 1, "stroke-dasharray": 1 }), [an("stroke-dashoffset", ["1", "1", "0", "0"], [0, 0.2, 0.7, 1])]),
    ] },
  "bookmark-plus": { dur: 1.25, auto: false,
    parts: [
      path("M18.6 12.6L18.6 19.25C18.6 20.2 17.5 20.7 16.7 20L12.7 17.25C12.3 16.9 11.7 16.9 11.3 17.25L7.3 20C6.5 20.7 5.4 20.2 5.4 19.25L5.4 5.6C5.4 4.2 6.5 3 7.9 3L13.3 3"),
      G("pop", [
        path("M18.2 3.6L18.2 8M16 5.8L20.4 5.75")
      ])
    ],
    sAnims: { pop: { pivot: [18.1, 5.8], anim: tn("scale", ["1","1","1.24","1","1"], [0,0.3,0.55,0.8,1]) } },
  },
  "bookmark-remove01": { dur: 1.4, auto: false,
    parts: [
      path("M6.4 3.1L12.6 3.1C13.9 3.1 15 4.2 15 5.6L15 19.1C15 20.1 13.9 20.6 13.2 20L10 17.6C9.6 17.6 9 17.6 8.6 17.6L5.6 20C4.9 20.6 3.8 20.1 3.8 19.1L3.8 5.6C3.8 4.2 4.9 3 6.2 3Z"),
      path("M3.8 7.3L10.4 7.25"),
      G("deny", [
        path("M16.4 3.8L20.4 7.75M20.4 3.8L16.4 7.75")
      ])
    ],
    gAnims: { deny: tn("rotate", ["0 18.4 5.8","0 18.4 5.8","-10 18.4 5.8","8 18.4 5.8","0 18.4 5.8"], [0,0.3,0.55,0.8,1]) },
  },
  "bookmark-remove02": { dur: 1.4, auto: false,
    parts: [
      path("M6.4 3.1L12.6 3.1C13.9 3.1 15 4.2 15 5.6L15 19.1C15 20.1 13.9 20.6 13.2 20L10 17.6C9.6 17.6 9 17.6 8.6 17.6L5.6 20C4.9 20.6 3.8 20.1 3.8 19.1L3.8 5.6C3.8 4.2 4.9 3 6.2 3Z"),
      G("deny", [
        path("M16.4 3.8L20.4 7.75M20.4 3.8L16.4 7.75")
      ])
    ],
    gAnims: { deny: tn("rotate", ["0 18.4 5.8","0 18.4 5.8","-10 18.4 5.8","8 18.4 5.8","0 18.4 5.8"], [0,0.3,0.55,0.8,1]) },
  },
  "bookmark-x": { dur: 1.35, auto: false,
    parts: [
      path("M18.6 12.6L18.6 19.25C18.6 20.2 17.5 20.7 16.7 20L12.7 17.25C12.3 16.9 11.7 16.9 11.3 17.25L7.3 20C6.5 20.7 5.4 20.2 5.4 19.25L5.4 5.6C5.4 4.2 6.5 3 7.9 3L13.3 3"),
      A(path("M16.2 3.8L20.2 7.75M20.2 3.8L16.2 7.75", {"pathLength":1,"stroke-dasharray":1}), [an("stroke-dashoffset", [15.19,15.19,0,0], [0,0.15,0.62,1])])
    ],
  },

  /* ---------- objects ---------- */

  /* page loading — the divider dips as content reflows, tab dot blinks */
  browser: { dur: 1.5, auto: false,
    parts: [
      rect(3.4, 4, 17.25, 16, 3.6),
      line(5.7, 6.3, 10.3, 6.3),
      A(line(3.4, 8.6, 20.6, 8.6), [an("y1", ["8.6","8.6","9.7","8.6","8.6"], [0,0.3,0.55,0.8,1]), an("y2", ["8.6","8.6","9.7","8.6","8.6"], [0,0.3,0.55,0.8,1])])
    ],
  },
  /* painting a stroke — sweeps around the brush tip */
  brush: { dur: 1.5, auto: false,
    parts: [
      G("sweep", [
        path("M4.3 20.9C5.1 18.9 5.1 17.7 5.1 16C5.1 15.1 6 13.9 7.1 13.9C8.6 13.4 10.2 14.2 10.7 15.6C11.3 17.2 10.5 18.9 9.2 19.75C7.6 20.9 5.3 21.4 4.3 20.9Z"),
        path("M9.5 14.5C11.8 11.8 16.8 6.2 19.6 5C20.5 4.6 20.9 4.9 20.9 5.75C20.3 8.4 15 13.4 12.3 15.75"),
        line(10.6, 12.25, 13.25, 14.75)
      ])
    ],
    gAnims: { sweep: tn("rotate", ["0 4.8 20.4","0 4.8 20.4","-8 4.8 20.4","5 4.8 20.4","0 4.8 20.4"], [0,0.3,0.55,0.8,1]) },
  },
  /* scrub brush — rapid back-and-forth strokes */
  "brush-cleaning": { dur: 1.35, auto: false,
    parts: [
      G("scrub", [
        path("M5.3 4.6L7.2 4.6L8.3 6L9.5 4.6L10.7 6L11.8 4.6L16.6 4.6C18 4.6 19.1 5.7 19.1 7L19.1 9C19.1 10.4 18 11.5 16.6 11.5L7.8 11.5C6.4 11.5 5.3 10.4 5.3 9L5.3 7C5.3 5.7 6.4 4.6 7.8 4.6Z"),
        path("M9.5 11.5L9.5 15.75C9.2 17.4 9.7 18.75 10.8 18.75L13.2 18.75C14.3 18.75 14.8 17.4 14.8 15.75L14.8 11.5")
      ])
    ],
    gAnims: { scrub: tn("translate", ["0 0","0 0","1.4 0","-1.3 0","0.8 0","0 0"], [0,0.25,0.42,0.6,0.76,1]) },
  },
  /* the medal dangles — ribbon swings on its mount */
  certificate01: { dur: 1.6, auto: false,
    parts: [
      path("M11.8 20.8L6.2 20.75C4.7 20.75 3.5 19.6 3.5 18.1L3.5 5.5C3.5 4 4.7 2.75 6.2 2.75L15.8 2.75C17.3 2.75 18.5 4 18.5 5.5L18.5 10"),
      line(6.6, 8.25, 13.25, 8.25),
      line(6.6, 12.25, 10.6, 12.25),
      G("sway", [
        circle(17.25, 15.4, 2.6),
        path("M15.6 17.3L14.8 20.25C14.8 20.8 15.3 20.9 15.8 20.9L17.3 19.9L18.8 20.9C19.3 20.9 19.8 20.8 19.8 20.25L19 17.25")
      ])
    ],
    gAnims: { sway: tn("rotate", ["0 17.3 14.4","0 17.3 14.4","-8 17.3 14.4","6 17.3 14.4","0 17.3 14.4"], [0,0.3,0.55,0.8,1]) },
  },
  /* ribbon tails flap under the medallion */
  certificate02: { dur: 1.6, auto: false,
    parts: [
      circle(12, 8.6, 4),
      G("tails", [
        path("M9.8 11.7L8.4 18.1C8.4 18.7 9 19.1 9.5 18.75L12 16.75L14.5 18.75C15 19.1 15.6 18.7 15.6 18.1L14.2 11.75")
      ]),
      path("M8.7 5.9C7.1 5.5 4.8 4.5 3.5 5.25C2.1 6.2 2.1 10.2 3.5 11.1C4.8 11.9 7.1 10.9 8.7 10.5"),
      path("M15.3 5.9C16.9 5.5 19.2 4.5 20.5 5.25C21.9 6.2 21.9 10.2 20.5 11.1C19.2 11.9 16.9 10.9 15.3 11.75")
    ],
    gAnims: { tails: tn("rotate", ["0 12 10.5","0 12 10.5","-7 12 10.5","7 12 10.5","0 12 10.5"], [0,0.3,0.55,0.8,1]) },
  },
  cog: { dur: 1.4, auto: false,
    parts: [
      G("turn", [
        /* toothed ring + spokes + hub — reads gear, not flower */
        circle(12, 12, 6.6),
        path("M12 5V2.6M12 21.4V19M19 12h2.4M5 12H2.6M16.2 7.8l2.2-2.2M7.8 16.2l-2.2 2.2M16.2 16.2l2.2 2.2M7.8 7.8L5.6 5.6"),
        path("M13.7 10.3l2.7-2.7M10.3 13.7l-2.7 2.7M13.7 13.7l2.7 2.7M10.3 10.3l-2.7-2.7"),
        circle(12, 12, 2.1)
      ])
    ],
    gAnims: { turn: tn("rotate", ["0 12 12","90 12 12"]) },
  },
  /* eyedropper dips onto the swatch; the swatch swells on contact */
  "color-picker": { dur: 1.5, auto: false,
    parts: [
      G("dip", [
        path("M4.6 19.4L5.7 16.75C5.7 16.3 6.2 15.5 6.7 15.5L14.6 7.6L16.1 9L8.2 17C8.2 17.5 7.4 18 6.9 18L4.6 19.4Z"),
        circle(17.6, 6.1, 2.25),
        line(12.3, 8.5, 14.5, 10.65)
      ])
    ],
    gAnims: { dip: tn("translate", ["0 0","0 0","-0.9 0.9","0 0","0 0"], [0,0.3,0.55,0.8,1]) },
  },
  /* three swatch discs rotate like a color wheel being spun */
  colors: { dur: 1.8, auto: false,
    parts: [
      G("turn", [
        circle(12, 7.6, 5.25),
        circle(7.5, 15.5, 5.25),
        circle(16.5, 15.5, 5.25)
      ])
    ],
    gAnims: { turn: tn("rotate", ["0 12 12.9","0 12 12.9","-15 12 12.9","13 12 12.9","0 12 12.9"], [0,0.3,0.55,0.8,1]) },
  },

  /* ---------- columns & crop ---------- */

  "column-delete": { dur: 1.4, auto: false,
    parts: [
      rect(3.6, 4.25, 4.6, 15.6, 2.25),
      rect(10.6, 4.25, 4.6, 15.6, 2.25),
      G("deny", [
        path("M16.6 4.2L20.4 8M20.4 4.2L16.6 8")
      ])
    ],
    gAnims: { deny: tn("rotate", ["0 18.5 6.1","0 18.5 6.1","-11 18.5 6.1","9 18.5 6.1","0 18.5 6.1"], [0,0.3,0.55,0.8,1]) },
  },
  /* the arrow presses down into the column slot */
  "column-insert": { dur: 1.4, auto: false,
    parts: [
      rect(3.4, 9.4, 4.6, 10.4, 2.25),
      rect(16, 9.4, 4.6, 10.4, 2.25),
      G("in", [
        line(12, 3, 12, 6.4),
        path("M9.6 4.2L12 6.6L14.4 4.25")
      ])
    ],
    gAnims: { in: tn("translate", ["0 0","0 0","0 1.6","0 0","0 0"], [0,0.3,0.55,0.8,1]) },
  },
  "columns3-cog": colsCog,
  "columns-three-cog": { ...colsCog },
  /* crop corners pinch inward — the crop box shrinks */
  crop: { dur: 1.5, auto: false,
    parts: [
      G("tl", [
        path("M4 4.8L15.2 4.75C17.1 4.75 18.6 6.3 18.6 8.25L18.6 20.6")
      ]),
      G("br", [
        path("M20 19.2L8.8 19.25C6.9 19.25 5.4 17.7 5.4 15.75L5.4 3.4")
      ])
    ],
    gAnims: { tl: tn("translate", ["0 0","0 0","-1 1","0 0","0 0"], [0,0.3,0.55,0.8,1]), br: tn("translate", ["0 0","0 0","1 -1","0 0","0 0"], [0,0.3,0.55,0.8,1]) },
  },

  /* ---------- dashboards ---------- */

  /* gauge needle dances: sweeps left, swings right, settles center */
  "dashboard-browsing": { dur: 1.7, auto: false,
    parts: [
      rect(3.4, 3.75, 17.25, 16.4, 3.6),
      line(3.4, 8.4, 20.6, 8.4),
      path("M7.8 17.2A4.2 4.2 0 0 1 16.2 17.25"),
      G("ndl", [
        line(12, 16.9, 14.25, 14.75)
      ])
    ],
    gAnims: { ndl: tn("rotate", ["0 12 16.9","0 12 16.9","-24 12 16.9","18 12 16.9","-6 12 16.9","0 12 16.9"], [0,0.22,0.45,0.65,0.82,1]) },
  },
  /* dots swell in a cascade */
  "dashboard-circle": { dur: 1.5, auto: false,
    parts: [
      A(circle(7, 7, 3), [an("r", ["3.05","3.05","3.7","3.05","3.05"], [0,0.05,0.22,0.45,1])]),
      A(circle(17, 7, 3), [an("r", ["3.05","3.05","3.7","3.05","3.05"], [0,0.17,0.34,0.57,1])]),
      A(circle(7, 17, 3), [an("r", ["3.05","3.05","3.7","3.05","3.05"], [0,0.29,0.46,0.69,1])]),
      A(circle(17, 17, 3), [an("r", ["3.05","3.05","3.7","3.05","3.05"], [0,0.41,0.58,0.81,1])])
    ],
  },
  "dashboard-circle-add": { dur: 1.25, auto: false,
    parts: [
      circle(7, 7, 3.5),
      circle(7, 17, 3.5),
      circle(17, 17, 3.5),
      G("pop", [
        path("M17 4L17 10M14 7L20 7")
      ])
    ],
    sAnims: { pop: { pivot: [17, 7], anim: tn("scale", ["1","1","1.24","1","1"], [0,0.3,0.55,0.8,1]) } },
  },
  "dashboard-circle-edit": { dur: 1.4, auto: false,
    parts: [
      circle(7, 7, 3.5),
      circle(7, 17, 3.5),
      circle(17, 17, 3.5),
      G("wig", [path(pen(14.4, 9.6, 8, 1.7, 2.2))]),
    ],
    gAnims: { wig: tn("rotate", ["0 14.4 9.6","0 14.4 9.6","-10 14.4 9.6","8 14.4 9.6","0 14.4 9.6"], [0,0.3,0.55,0.8,1]) },
  },
  "dashboard-circle-remove": { dur: 1.4, auto: false,
    parts: [
      circle(7, 7, 3.5),
      circle(7, 17, 3.5),
      circle(17, 17, 3.5),
      A(line(14.4, 7, 19.6, 7), [an("opacity", ["1","1","0.2","1","1"], [0,0.32,0.46,0.6,1])])
    ],
  },
  "dashboard-circle-settings": { dur: 1.5, auto: false,
    parts: [
      circle(7, 7, 3.5),
      circle(7, 17, 3.5),
      circle(17, 17, 3.5),
      G("turn", cog(17, 7, 0.9)),
    ],
    gAnims: { turn: tn("rotate", ["0 17 7","60 17 7"]) },
  },
  "dashboard-speed01": { dur: 1.8, auto: false, pp: false,
    parts: [
      rect(3.25, 3.25, 17.6, 17.6, 4),
      path("M6.9 12.9A5.4 5.4 0 0 1 15.5 8.5"),
      circle(12, 15.4, 1.9),
      G("ndl", [
        line(12, 15.4, 15.75, 11)
      ])
    ],
    gAnims: { ndl: tn("rotate", ["0 12 15.4","-24 12 15.4","0 12 15.4"], [0,0.4,1]) },
  },
  "dashboard-speed02": { dur: 1.8, auto: false, pp: false,
    parts: [
      path("M3.8 14A8.2 8.2 0 0 1 20.2 14"),
      circle(12, 17.6, 2.9),
      G("ndl", [
        line(12, 14.75, 12, 10.6)
      ])
    ],
    gAnims: { ndl: tn("rotate", ["0 12 17.6","-28 12 17.6","24 12 17.6","0 12 17.6"], [0,0.32,0.68,1]) },
  },
  "dashboard-square-add": { dur: 1.25, auto: false,
    parts: [
      rect(3.4, 3.4, 7, 7, 2.4),
      rect(3.4, 13.6, 7, 7, 2.4),
      rect(13.6, 13.6, 7, 7, 2.4),
      G("pop", [
        path("M17 4.2L17 9.75M14.2 7L19.8 7")
      ])
    ],
    sAnims: { pop: { pivot: [17, 7], anim: tn("scale", ["1","1","1.24","1","1"], [0,0.3,0.55,0.8,1]) } },
  },
  "dashboard-square-edit": { dur: 1.4, auto: false,
    parts: [
      rect(3.4, 3.4, 7, 7, 2.4),
      rect(3.4, 13.6, 7, 7, 2.4),
      rect(13.6, 13.6, 7, 7, 2.4),
      G("wig", [path(pen(14.4, 9.6, 8, 1.7, 2.2))]),
    ],
    gAnims: { wig: tn("rotate", ["0 14.4 9.6","0 14.4 9.6","-10 14.4 9.6","8 14.4 9.6","0 14.4 9.6"], [0,0.3,0.55,0.8,1]) },
  },
  "dashboard-square-remove": {
    dur: 1.4,
    auto: false,
    parts: [SQ1, SQ3, SQ4, A(line(14.4, 7, 19.6, 7), BLINK())],
  },
  /* cells inflate one after another — a widget-fill cascade */
  "dashboard-square01": {
    dur: 1.6,
    auto: false,
    parts: [
      A(SQ1, INFLATE(6.9, 6.9, 7, 7, 0.05, 0.5)),
      A(SQ2, INFLATE(17.1, 6.9, 7, 7, 0.15, 0.6)),
      A(SQ3, INFLATE(6.9, 17.1, 7, 7, 0.15, 0.6)),
      A(SQ4, INFLATE(17.1, 17.1, 7, 7, 0.3, 0.75)),
    ],
  },
  "dashboard-square02": { dur: 1.6, auto: false,
    parts: [
      A(rect(3.4, 3.4, 6.75, 9, 2.4), [an("x", [3.4,3.4,3.13,3.4], [0,0.05,0.275,0.5]), an("y", [3.4,3.4,3.04,3.4], [0,0.05,0.275,0.5]), an("width", [6.8,6.8,7.34,6.8], [0,0.05,0.275,0.5]), an("height", [9,9,9.72,9], [0,0.05,0.275,0.5])]),
      A(rect(3.4, 14.6, 6.75, 6, 2.25), [an("x", [3.4,3.4,3.06,3.4], [0,0.15,0.375,0.6]), an("y", [14.6,14.6,14.3,14.6], [0,0.15,0.375,0.6]), an("width", [6.8,6.8,7.48,6.8], [0,0.15,0.375,0.6]), an("height", [6,6,6.6,6], [0,0.15,0.375,0.6])]),
      A(rect(12.6, 3.4, 8, 5.75, 2.25), [an("x", [12.6,12.6,12.2,12.6], [0,0.15,0.375,0.6]), an("y", [3.4,3.4,3.11,3.4], [0,0.15,0.375,0.6]), an("width", [8,8,8.8,8], [0,0.15,0.375,0.6]), an("height", [5.8,5.8,6.38,5.8], [0,0.15,0.375,0.6])]),
      A(rect(12.6, 11.4, 8, 9.25, 2.4), [an("x", [12.6,12.6,12.28,12.6], [0,0.3,0.525,0.75]), an("y", [11.4,11.4,11.03,11.4], [0,0.3,0.525,0.75]), an("width", [8,8,8.64,8], [0,0.3,0.525,0.75]), an("height", [9.2,9.2,9.94,9.2], [0,0.3,0.525,0.75])])
    ],
  },
  "dashboard-square03": { dur: 1.6, auto: false,
    parts: [
      A(rect(3.4, 3.4, 7.6, 6.6, 2.25), [an("x", [3.4,3.4,3.05,3.4], [0,0.05,0.275,0.5]), an("y", [3.4,3.4,3.07,3.4], [0,0.05,0.275,0.5]), an("width", [7.6,7.6,8.36,7.6], [0,0.05,0.275,0.5]), an("height", [6.6,6.6,7.26,6.6], [0,0.05,0.275,0.5])]),
      A(rect(3.4, 12.2, 7.6, 8.3, 2.4), [an("x", [3.4,3.4,3.05,3.4], [0,0.15,0.375,0.6]), an("y", [12.2,12.2,11.87,12.2], [0,0.15,0.375,0.6]), an("width", [7.6,7.6,8.36,7.6], [0,0.15,0.375,0.6]), an("height", [8.3,8.3,9.13,8.3], [0,0.15,0.375,0.6])]),
      A(rect(13.2, 3.4, 7.4, 9.6, 2.4), [an("x", [13.2,13.2,12.89,13.2], [0,0.15,0.375,0.6]), an("y", [3.4,3.4,3.07,3.4], [0,0.15,0.375,0.6]), an("width", [7.4,7.4,8.14,7.4], [0,0.15,0.375,0.6]), an("height", [9.6,9.6,10.56,9.6], [0,0.15,0.375,0.6])]),
      A(rect(13.2, 15.2, 7.4, 5.3, 2.4), [an("x", [13.2,13.2,12.89,13.2], [0,0.3,0.525,0.75]), an("y", [15.2,15.2,14.87,15.2], [0,0.3,0.525,0.75]), an("width", [7.4,7.4,8.14,7.4], [0,0.3,0.525,0.75]), an("height", [5.3,5.3,5.83,5.3], [0,0.3,0.525,0.75])])
    ],
  },
};
