/* Batch ui-03 — dashboards, drawing tools, droppers, edits, erasers,
   eyes, faces, facebook, filters, fingerprint, flags, funnels.
   Lumio voice: soft blob silhouettes, big radii, one playful accent.
   Every icon gets a bespoke SMIL gesture (auto:false) — pencils wiggle,
   erasers scrub, eyes blink, filter knobs slide, flags wave. */

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

/* ---- bespoke gesture idioms -------------------------------------------
   HOLD phrasing: rest ~30%, act through mid-cycle, settle back to rest —
   pose(t0) == pose(t1) so every loop is seamless. Geometry untouched. */
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
/* pencil wiggle about its own tip — the shared edit-tool gesture. */
const PENWIG = (cx, cy) => WIG(cx, cy, 11);

/* cosine-modulated bloom — mini cog for the "setting" badges (same math
   as gen.mjs's flowerPath, redefined so the batch stays self-contained). */
const bloom = (cx, cy, lobes, rMid, amp, steps = 12) => {
  const pts = [];
  for (let i = 0; i < lobes * steps; i++) {
    const t = (i / (lobes * steps)) * Math.PI * 2;
    const r = rMid + amp * Math.cos(lobes * t + Math.PI / 2);
    pts.push(`${(cx + r * Math.cos(t)).toFixed(1)} ${(cy + r * Math.sin(t)).toFixed(1)}`);
  }
  return `M${pts.join("L")}Z`;
};

/* soft four-point sparkle — quadratic pinch, round tips */
const spark = (cx, cy, r) => {
  const k = +(r * 0.22).toFixed(2);
  return `M${cx} ${cy - r}` +
    `Q${cx + k} ${cy - k} ${cx + r} ${cy}` +
    `Q${cx + k} ${cy + k} ${cx} ${cy + r}` +
    `Q${cx - k} ${cy + k} ${cx - r} ${cy}` +
    `Q${cx - k} ${cy - k} ${cx} ${cy - r}Z`;
};

/* ---- shared geometry ---- */

const MINICOG = bloom(17.4, 6.6, 6, 2.9, 0.8);
const PLUS_TR = "M18.2 3.8v4.4M16 6h4.4";
const MINUS_TR = "M16 6h4.4";
const X_TR = "M16.2 3.8l4 4M20.2 3.8l-4 4";
const SLASH = "M3.6 3.6l16.8 16.8";

/* mini pencil mark floating top-right */
const PENCIL_TR =
  "M15 9.5l.4-1.6c.1-.4.3-.7.6-.9l3.3-3.3c.5-.5 1.2-.5 1.7 0 .5.5.5 1.2 0 1.7l-3.3 3.3c-.2.3-.5.5-.9.6l-1.6.4-.2-.2z";
/* mini pencil mark floating bottom-right */
const PENCIL_BR =
  "M14.4 20.9l.6-1.6c.1-.3.3-.6.6-.8l3.4-3.4c.5-.5 1.2-.5 1.7 0s.5 1.2 0 1.7l-3.4 3.4c-.2.3-.5.5-.8.6l-1.7.5-.4-.4z";

/* canon quill (gen.mjs "edit") — reused for the off/edit family */
const QUILL =
  "M4.8 19.2l1-3.9L15.7 5.5a2.4 2.4 0 0 1 3.4 0l.1.1a2.4 2.4 0 0 1 0 3.4L9.3 18.8l-3.8.9z";
const QUILL_BAND = "M14.4 6.7l3.2 3.2";

/* crayon — pointed corner tip at bottom-left */
const CRAYON =
  "M5.4 16.4l-1.1 3.4c-.2.5.2 1 .7.9l3.4-1.1c.7-.2 1.4-.6 1.9-1.1l8.9-8.9c.6-.6.6-1.6 0-2.2l-1.4-1.4c-.6-.6-1.6-.6-2.2 0l-8.9 8.9c-.5.5-.9 1.2-1.1 1.9z";
const CRAYON_BAND = "M14.6 6.2l3.2 3.2";

/* squared-tail pencil — body ends in a 90° corner at bottom-left */
const SQ_PENCIL =
  "M4.2 20.2v-3c0-.8.3-1.5.9-2l10-10c.6-.6 1.6-.6 2.2 0l1.3 1.3c.6.6.6 1.6 0 2.2l-10 10c-.5.6-1.2.9-2 .9H4.2z";
const SQ_BAND = "M14.9 5.7l3.2 3.2";

/* tilted eraser lozenge — rounded rhombus + sleeve seam */
const ERASER_LOZ =
  "M8.9 17.9l10.3-10.3c.9-.9.9-2.3 0-3.2l-1.4-1.4c-.9-.9-2.3-.9-3.2 0L4.3 13.3c-.9.9-.9 2.3 0 3.2l1.4 1.4c.9.9 2.3.9 3.2 0z";
const ERASER_SEAM = "M11.6 8.6l5.2 5.2";

/* tag-shaped eraser — flat rounded left, pointed nose right */
const ERASER_TAG =
  "M6.2 5.6h7.2c1.2 0 2.4.5 3.2 1.4l2.6 2.9c1.1 1.2 1.1 3 0 4.2l-2.6 2.9c-.8.9-2 1.4-3.2 1.4H6.2c-1.7 0-3-1.3-3-3V8.6c0-1.7 1.3-3 3-3z";

/* eye almond, centered on 12 */
const EYE =
  "M3.6 12c1.6-3.6 4.8-5.8 8.4-5.8s6.8 2.2 8.4 5.8c-1.6 3.6-4.8 5.8-8.4 5.8s-6.8-2.2-8.4-5.8z";

/* face-id corner brackets — one path, four rounded corners */
const CORNERS =
  "M8.6 3.6H7c-1.9 0-3.4 1.5-3.4 3.4v1.6M15.4 3.6H17c1.9 0 3.4 1.5 3.4 3.4v1.6M20.4 15.4V17c0 1.9-1.5 3.4-3.4 3.4h-1.6M8.6 20.4H7c-1.9 0-3.4-1.5-3.4-3.4v-1.6";

/* narrow funnel, top edge ends left of the floating mark */
const FUNNEL_OPEN =
  "M4.6 5.4h9.9c.6 0 .9.6.6 1.1l-4 5v5.8c0 .5-.3.9-.8 1.1l-2.6 1.1c-.7.3-1.4-.2-1.4-1v-6.9l-4-5.4c-.5-.6-.1-1.5.7-1.7l.4-.1z";

/* eraser scrub — the lozenge slides along its own diagonal axis */
const SCRUB = tn("translate", ["0 0", "0 0", "1.1 -1.1", "-1 1", "0 0"], HOLD);

/* the "crossing-out" slash for every *-off icon — strikes through, holds */
const SLASH_DRAW = (t0 = 0.2, t1 = 0.72) => DRAW(path(SLASH), t0, t1);

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

export const icons = {
  /* ---- dashboards & drawing ---- */

  "dashboard-square-setting": { dur: 1.5, auto: false,
    parts: [
      rect(3.4, 3.4, 7, 7, 3.2),
      rect(3.4, 13.6, 7, 7, 3.2),
      rect(13.6, 13.6, 7, 7, 3.2),
      G("turn", cog(17.1, 6.9, 0.9)),
    ],
    gAnims: { turn: tn("rotate", ["0 17.1 6.9","60 17.1 6.9"]) },
  },

  /* the compass legs open and close around the hinge */
  "drawing-compass": { dur: 1.6, auto: false,
    parts: [
      line(12, 3.25, 12, 4.4),
      circle(12, 7, 2.5),
      G("legL", [
        path("M10.3 9.2C8.9 12.6 7.7 16.2 6.5 20.4")
      ]),
      G("legR", [
        path("M13.7 9.2C15.1 12.6 16.3 16.2 17.5 20.4")
      ]),
      path("M4 14.4C6.5 17.2 9.1 18.5 12 18.5C14.9 18.5 17.5 17.2 20 14.4"),
      line(12, 18.5, 12, 20.4)
    ],
    gAnims: { legL: tn("rotate", ["0 12 8","0 12 8","6 12 8","0 12 8","0 12 8"], [0,0.3,0.55,0.8,1]), legR: tn("rotate", ["0 12 8","0 12 8","-6 12 8","0 12 8","0 12 8"], [0,0.3,0.55,0.8,1]) },
  },

  /* drawing mode: the pen arc rocks while the square gets drawn */
  "drawing-mode": { dur: 1.5, auto: false,
    parts: [
      G("rock", [
        path("M14.6 8.8A5.8 5.8 0 1 0 8.8 14.6")
      ]),
      A(rect(9.4, 9.4, 11.25, 11.25, 3.4, {"pathLength":1,"stroke-dasharray":1}), [an("stroke-dashoffset", [32.22,32.22,0,0], [0,0.3,0.8,1])])
    ],
    gAnims: { rock: tn("rotate", ["0 11.5 8","0 11.5 8","-10 11.5 8","0 11.5 8","0 11.5 8"], [0,0.3,0.55,0.8,1]) },
  },

  /* dropper dips onto the swatch dot; the dot swells on contact */
  dropper: { dur: 1.5, auto: false,
    parts: [
      G("dip", [
        circle(18.75, 5.25, 2.25),
        path("M9.9 16.9L16.8 10A1.9 1.9 0 0 0 14.1 7.25L7.2 14.25A1.9 1.9 0 0 0 9.9 16.9Z"),
        line(6.6, 17.4, 4.75, 19.25),
        line(12.4, 8.15, 14.6, 10.3)
      ])
    ],
    gAnims: { dip: tn("translate", ["0 0","0 0","-0.8 0.8","0 0","0 0"], [0,0.3,0.55,0.8,1]) },
  },

  /* ---- edit family ---- */

  "edit-off": { dur: 1.5, auto: false,
    parts: [
      path("M4.8 19.2L5.8 15.25L15.7 5.5A2.4 2.4 0 0 1 19.1 5.5A2.4 2.4 0 0 1 19.2 9L9.3 18.75L5.5 19.75Z"),
      path("M14.4 6.7L17.6 10"),
      A(path("M3.6 3.6L20.4 20.4", {"pathLength":1,"stroke-dasharray":1}), [an("stroke-dashoffset", [23.76,23.76,0,0], [0,0.2,0.72,1])])
    ],
  },
  "edit-off03": { dur: 1.5, auto: false,
    parts: [
      path("M5.4 16.4L4.3 19.75C4.3 20.3 4.5 20.75 5 20.75L8.4 19.6C9.1 19.6 9.8 19 10.3 18.5L19.2 9.6C19.8 9 19.8 8 19.2 7.4L17.8 6C17.2 5.4 16.2 5.4 15.6 6L6.7 14.9C6.2 15.4 5.6 16.1 5.6 16.75Z"),
      path("M14.6 6.2L17.8 9.4"),
      A(path("M3.6 3.6L20.4 20.4", {"pathLength":1,"stroke-dasharray":1}), [an("stroke-dashoffset", [23.76,23.76,0,0], [0,0.2,0.72,1])])
    ],
  },
  "edit-off04": { dur: 1.5, auto: false,
    parts: [
      path("M4.2 20.2L4.2 17.25C4.2 16.4 4.5 15.7 5.1 15.25L15.1 5.25C15.7 4.6 16.7 4.6 17.3 5.25L18.6 6.5C19.2 7.1 19.2 8.1 18.6 8.75L8.6 18.75C8.1 19.3 7.4 19.6 6.6 19.6L4.2 19.6Z"),
      path("M14.9 5.7L18.1 9"),
      A(path("M3.6 3.6L20.4 20.4", {"pathLength":1,"stroke-dasharray":1}), [an("stroke-dashoffset", [23.76,23.76,0,0], [0,0.2,0.72,1])])
    ],
  },

  /* the editor pencil marks the road */
  "edit-road": { dur: 1.4, auto: false,
    parts: [
      line(4, 3.6, 4, 20.4),
      line(9.75, 3.6, 9.75, 6.6),
      line(9.75, 10, 9.75, 13),
      line(9.75, 16.4, 9.75, 19.4),
      line(15.25, 3.6, 15.25, 10.4),
      G("pen", [
        path("M14.4 20.9L15 19.25C15 19.25 15.6 18.5 15.6 18.5L19 15C19.5 14.6 20.2 14.6 20.7 15C21.2 15.6 21.2 16.3 20.7 16.75L17.3 20.25C17.3 20.25 16.5 20.75 16.5 20.75L14.8 21.25L14.4 20.9Z")
      ])
    ],
    gAnims: { pen: tn("rotate", ["0 17.6 18.2","0 17.6 18.2","-11 17.6 18.2","9 17.6 18.2","0 17.6 18.2"], [0,0.3,0.55,0.8,1]) },
  },

  "edit-table": { dur: 1.4, auto: false,
    parts: [
      /* table opens its corner for the pen */
      path("M9.6 20.6H7.1c-2 0-3.7-1.7-3.7-3.7V7.1c0-2 1.7-3.7 3.7-3.7h9.8c2 0 3.7 1.7 3.7 3.7v3.2"),
      line(3.4, 9.4, 20.6, 9.4),
      line(9.4, 9.4, 9.4, 20.6),
      line(3.4, 15, 9.4, 15),
      G("pen", [path(pen(12.8, 21.2))]),
    ],
    gAnims: { pen: tn("rotate", ["0 12.8 21.2","0 12.8 21.2","-11 12.8 21.2","9 12.8 21.2","0 12.8 21.2"], [0,0.3,0.55,0.8,1]) },
  },

  "edit-user02": { dur: 1.4, auto: false,
    parts: [
      circle(9.75, 7.4, 3.6),
      path("M9.8 13.6C6.5 13.6 4.1 15.9 4.1 19C4.1 19.6 4.6 20.25 5.3 20.25L14.3 20.25C14.9 20.25 15.4 19.7 15.4 19C15.4 18.6 15 17.75 15 17.75"),
      G("pen", [path(pen(15.4, 13.6, 7.4, 1.7, 2.2))]),
    ],
    gAnims: { pen: tn("rotate", ["0 15.4 13.6","0 15.4 13.6","-11 15.4 13.6","9 15.4 13.6","0 15.4 13.6"], [0,0.3,0.55,0.8,1]) },
  },

  /* quill scribbles over its underline */
  edit01: { dur: 1.4, auto: false,
    parts: [
      G("pen", [
        path("M6.9 16.6L7.8 13.1L16.8 4.1C17.4 3.5 18.4 3.5 19 4.1L20.1 5.25C20.7 5.8 20.7 6.8 20.1 7.4L11.1 16.4L7.6 17.25Z"),
        path("M15.5 5.3L18.7 8.5")
      ]),
      path("M4.2 19.6C6.6 17.7 8.8 17.7 11.1 19.6C13.4 21.5 15.5 21.5 17.9 19.6")
    ],
    gAnims: { pen: tn("rotate", ["0 5.8 19","0 5.8 19","-11 5.8 19","9 5.8 19","0 5.8 19"], [0,0.3,0.55,0.8,1]) },
  },

  edit02: { dur: 1.4, auto: false,
    parts: [
      G("pen", [
        path("M4.8 19.2L5.8 15.25L15.7 5.5A2.4 2.4 0 0 1 19.1 5.5A2.4 2.4 0 0 1 19.2 9L9.3 18.75L5.5 19.75Z"),
        path("M14.4 6.7L17.6 10")
      ]),
      line(13.6, 20.6, 19.75, 20.6)
    ],
    gAnims: { pen: tn("rotate", ["0 4.8 19.2","0 4.8 19.2","-11 4.8 19.2","9 4.8 19.2","0 4.8 19.2"], [0,0.3,0.55,0.8,1]) },
  },

  edit03: { dur: 1.4, auto: false,
    parts: [
      G("pen", [
        path("M5.4 16.4L4.3 19.75C4.3 20.3 4.5 20.75 5 20.75L8.4 19.6C9.1 19.6 9.8 19 10.3 18.5L19.2 9.6C19.8 9 19.8 8 19.2 7.4L17.8 6C17.2 5.4 16.2 5.4 15.6 6L6.7 14.9C6.2 15.4 5.6 16.1 5.6 16.75Z"),
        path("M14.6 6.2L17.8 9.4")
      ])
    ],
    gAnims: { pen: tn("rotate", ["0 4.5 19.5","0 4.5 19.5","-11 4.5 19.5","9 4.5 19.5","0 4.5 19.5"], [0,0.3,0.55,0.8,1]) },
  },

  edit04: { dur: 1.4, auto: false,
    parts: [
      G("pen", [
        path("M4.2 20.2L4.2 17.25C4.2 16.4 4.5 15.7 5.1 15.25L15.1 5.25C15.7 4.6 16.7 4.6 17.3 5.25L18.6 6.5C19.2 7.1 19.2 8.1 18.6 8.75L8.6 18.75C8.1 19.3 7.4 19.6 6.6 19.6L4.2 19.6Z"),
        path("M14.9 5.7L18.1 9")
      ]),
      line(13.6, 20.9, 18.6, 20.9)
    ],
    gAnims: { pen: tn("rotate", ["0 4.2 20.2","0 4.2 20.2","-11 4.2 20.2","9 4.2 20.2","0 4.2 20.2"], [0,0.3,0.55,0.8,1]) },
  },

  /* ---- erasers ---- */

  /* the lozenge scrubs back and forth over the baseline */
  eraser: { dur: 1.35, auto: false,
    parts: [
      G("scrub", [
        path("M8.9 17.9L19.2 7.6C20.1 6.7 20.1 5.3 19.2 4.4L17.8 3C16.9 2.1 15.5 2.1 14.6 3L4.3 13.25C3.4 14.2 3.4 15.6 4.3 16.5L5.7 17.9C6.6 18.8 8 18.8 8.9 17.9Z"),
        path("M11.6 8.6L16.8 13.75")
      ]),
      line(11, 20.75, 20.6, 20.75)
    ],
    gAnims: { scrub: tn("translate", ["0 0","0 0","1.1 -1.1","-1 1","0 0"], [0,0.3,0.55,0.8,1]) },
  },
  "eraser-add": { dur: 1.25, auto: false,
    parts: [
      path("M6.2 5.6L13.4 5.6C14.6 5.6 15.8 6.1 16.6 7L19.2 10C20.3 11.1 20.3 12.9 19.2 14.1L16.6 17C15.8 17.9 14.6 18.4 13.4 18.4L6.2 18.4C4.5 18.4 3.2 17.1 3.2 15.4L3.2 8.6C3.2 6.9 4.5 5.6 6.2 5.6Z"),
      G("pop", [
        path("M10.2 9.2L10.2 14.75M7.4 12L13 12")
      ])
    ],
    sAnims: { pop: { pivot: [10.2, 12], anim: tn("scale", ["1","1","1.24","1","1"], [0,0.3,0.55,0.8,1]) } },
  },
  "eraser-auto": { dur: 1.35, auto: false,
    parts: [
      path("M4.8 9.8L7.1 4.4C7.1 4.4 7.7 4.4 7.7 4.4L10 9.75M5.9 8L9.5 8"),
      G("scrub", [
        path("M8.9 17.9L19.2 7.6C20.1 6.7 20.1 5.3 19.2 4.4L17.8 3C16.9 2.1 15.5 2.1 14.6 3L4.3 13.25C3.4 14.2 3.4 15.6 4.3 16.5L5.7 17.9C6.6 18.8 8 18.8 8.9 17.9Z"),
        path("M11.6 8.6L16.8 13.75")
      ])
    ],
    gAnims: { scrub: tn("translate", ["0 0","0 0","1.1 -1.1","-1 1","0 0"], [0,0.3,0.55,0.8,1]) },
  },
  eraser01: { dur: 1.4, auto: false,
    parts: [
      path("M6.2 5.6L13.4 5.6C14.6 5.6 15.8 6.1 16.6 7L19.2 10C20.3 11.1 20.3 12.9 19.2 14.1L16.6 17C15.8 17.9 14.6 18.4 13.4 18.4L6.2 18.4C4.5 18.4 3.2 17.1 3.2 15.4L3.2 8.6C3.2 6.9 4.5 5.6 6.2 5.6Z"),
      G("deny", [
        path("M8 9.4L12.4 14.6M12.4 9.4L8 14.6")
      ])
    ],
    gAnims: { deny: tn("rotate", ["0 10.2 12","0 10.2 12","-11 10.2 12","9 10.2 12","0 10.2 12"], [0,0.3,0.55,0.8,1]) },
  },

  /* ---- eyes ---- */

  /* blink — the almond + pupil flatten shut and reopen */
  eye: { dur: 1.7, auto: false,
    parts: [
      G("blink", [
        path("M4.4 12C5.8 9 8.8 7 12 7C15.2 7 18.2 9 19.6 12C18.2 15 15.2 16.9 12 16.9C8.8 16.9 5.8 15 4.4 12Z"),
        circle(12, 12, 2.9)
      ])
    ],
    sAnims: { blink: { pivot: [12, 12], anim: tn("scale", ["1 1","1 1","1 0.1","1 1","1 1"], [0,0.38,0.5,0.62,1]) } },
  },
  /* sleepy eye — the closed lid sags lower and recovers */
  "eye-closed": { dur: 1.8, auto: false,
    parts: [
      G("sag", [
        path("M3.8 9.4C5.7 12.8 8.6 14.6 12 14.6C15.4 14.6 18.3 12.8 20.2 9.4"),
        line(12, 14.6, 12, 17.25),
        line(7.6, 13.75, 6.6, 16),
        line(16.4, 13.75, 17.4, 16),
        line(4.6, 11.6, 3.4, 13),
        line(19.4, 11.6, 20.6, 13)
      ])
    ],
    gAnims: { sag: tn("translate", ["0 0","0 0","0 0.9","0 0","0 0"], [0,0.3,0.55,0.8,1]) },
  },
  "eye-off": { dur: 1.5, auto: false,
    parts: [
      path("M3.6 12C5.2 8.4 8.4 6.25 12 6.25C15.6 6.25 18.8 8.4 20.4 12C18.8 15.6 15.6 17.75 12 17.75C8.4 17.75 5.2 15.6 3.6 12Z"),
      circle(12, 12, 2.9),
      A(path("M3.6 3.6L20.4 20.4", {"pathLength":1,"stroke-dasharray":1}), [an("stroke-dashoffset", [23.76,23.76,0,0], [0,0.2,0.72,1])])
    ],
  },

  /* ---- faces ---- */

  /* face-id scan — the corner brackets tighten inward, then release */
  "face-id": { dur: 1.6, auto: false,
    parts: [
      G("scan", [
        path("M8.6 3.6L7 3.6C5.1 3.6 3.6 5.1 3.6 7L3.6 8.6M15.4 3.6L17 3.6C18.9 3.6 20.4 5.1 20.4 7L20.4 8.6M20.4 15.4L20.4 17C20.4 18.9 18.9 20.4 17 20.4L15.4 20.4M8.6 20.4L7 20.4C5.1 20.4 3.6 18.9 3.6 17L3.6 15.4")
      ]),
      ellipse(12, 9.75, 2.75, 3.1),
      path("M7.6 17.4C8.1 15.8 9.2 14.8 10.6 14.4L12 14L13.4 14.4C14.8 14.8 15.9 15.8 16.4 17.4")
    ],
    sAnims: { scan: { pivot: [12, 12], anim: tn("scale", ["1","1","0.92","1","1"], [0,0.3,0.55,0.8,1]) } },
  },
  /* the sparkle winks — pops and dims, smile stays put */
  "face-mimic": { dur: 1.5, auto: false,
    parts: [
      path("M8.6 3.6L7 3.6C5.1 3.6 3.6 5.1 3.6 7L3.6 8.6M15.4 3.6L17 3.6C18.9 3.6 20.4 5.1 20.4 7L20.4 8.6M20.4 15.4L20.4 17C20.4 18.9 18.9 20.4 17 20.4L15.4 20.4M8.6 20.4L7 20.4C5.1 20.4 3.6 18.9 3.6 17L3.6 15.4"),
      line(8.25, 8.6, 8.25, 10.6),
      G("wink", [
        path("M15.8 7.8Q16.2 9.2 17.6 9.6Q16.2 10 15.8 11.4Q15.4 10 14 9.6Q15.4 9.2 15.8 7.75Z")
      ]),
      path("M7.4 14.6C8.7 16.7 10.4 17.75 12 17.75C13.6 17.75 15.3 16.7 16.6 14.6")
    ],
    sAnims: { wink: { pivot: [15.8, 9.6], anim: tn("scale", ["1","1","1.35","1","1"], [0,0.3,0.55,0.8,1]), extra: an("opacity", ["1","1","0.5","1","1"], [0,0.35,0.5,0.65,1]) } },
  },

  /* ---- facebook ---- */

  facebook01: { dur: 1.5, auto: false,
    parts: [
      rect(3.4, 3.4, 17.25, 17.25, 4.4),
      G("pop", [
        path("M16.2 8.4L13.8 8.4C12.7 8.4 11.9 9.3 11.9 10.4L11.9 20.6M9.9 13.6L14.8 13.6")
      ])
    ],
    sAnims: { pop: { pivot: [12.4, 12.6], anim: tn("scale", ["1","1","1.12","1","1"], [0,0.3,0.55,0.8,1]) } },
  },
  facebook02: { dur: 1.5, auto: false,
    parts: [
      G("pop", [
        path("M12.4 4.4C12.4 3.5 13.4 2.75 14.4 2.75L17.8 2.75C18.6 2.75 19.2 3.4 19.2 4.25L19.2 5.75C19.2 6.6 18.6 7.25 17.8 7.25L15.6 7.25C14.9 7.25 14.4 7.7 14.4 8.4L14.4 10.25L17.3 10.25C18 10.25 18.3 11 18.3 11.75L17.6 13.75C17.6 14.3 16.9 14.75 16.3 14.75L14.1 14.75L14.1 21C14.1 21.8 13.5 22.4 12.7 22.4L9.9 22.4C9.1 22.4 8.5 21.8 8.5 21L8.5 14.75L6.6 14.75C5.8 14.75 5.2 14.1 5.2 13.25L5.2 11.6C5.2 10.8 5.8 10.25 6.6 10.25L8.5 10.25L8.5 8.6C8.5 6.6 10.1 4.9 12.4 4.4Z")
      ])
    ],
    sAnims: { pop: { pivot: [12, 11.6], anim: tn("scale", ["1","1","1.1","1","1"], [0,0.3,0.55,0.8,1]) } },
  },

  /* ---- filter: funnel-with-mark family ---- */

  "filter-add": { dur: 1.25, auto: false,
    parts: [
      path("M4.6 5.4L14.5 5.4C15.1 5.4 15.1 6 15.1 6.5L11.1 11.5L11.1 17.25C11.1 17.8 10.8 18.4 10.3 18.4L7.7 19.5C7 19.5 6.3 19.3 6.3 18.5L6.3 11.6L2.3 6.25C1.8 5.6 2.2 4.5 3 4.5L3.4 4.5Z"),
      G("pop", [
        path("M18.2 3.8L18.2 8.25M16 6L20.4 6")
      ])
    ],
    sAnims: { pop: { pivot: [18.2, 6], anim: tn("scale", ["1","1","1.24","1","1"], [0,0.3,0.55,0.8,1]) } },
  },
  "filter-edit": { dur: 1.4, auto: false,
    parts: [
      /* funnel drawn clean and shifted left so the pen has its own corner */
      path("M4.4 4.2h9.6c.9 0 1.3 1 .8 1.7L11 10.6v6.1c0 .5-.2.9-.6 1.1l-2 1.2c-.7.4-1.4-.1-1.4-.8v-7.6L2.8 5.9C2.3 5.2 2.7 4.2 3.6 4.2Z"),
      G("pen", [path(pen(13.6, 21, 9, 1.8, 2.4))]),
    ],
    gAnims: { pen: tn("rotate", ["0 13.6 21","0 13.6 21","-11 13.6 21","9 13.6 21","0 13.6 21"], [0,0.3,0.55,0.8,1]) },
  },
  "filter-remove": { dur: 1.4, auto: false,
    parts: [
      path("M4.6 5.4L14.5 5.4C15.1 5.4 15.1 6 15.1 6.5L11.1 11.5L11.1 17.25C11.1 17.8 10.8 18.4 10.3 18.4L7.7 19.5C7 19.5 6.3 19.3 6.3 18.5L6.3 11.6L2.3 6.25C1.8 5.6 2.2 4.5 3 4.5L3.4 4.5Z"),
      G("deny", [
        path("M16.2 3.8L20.2 7.75M20.2 3.8L16.2 7.75")
      ])
    ],
    gAnims: { deny: tn("rotate", ["0 18.2 5.8","0 18.2 5.8","-10 18.2 5.8","8 18.2 5.8","0 18.2 5.8"], [0,0.3,0.55,0.8,1]) },
  },
  /* the reset arc winds around and springs back */
  "filter-reset": { dur: 1.5, auto: false,
    parts: [
      path("M4.6 5.4L14.5 5.4C15.1 5.4 15.1 6 15.1 6.5L11.1 11.5L11.1 17.25C11.1 17.8 10.8 18.4 10.3 18.4L7.7 19.5C7 19.5 6.3 19.3 6.3 18.5L6.3 11.6L2.3 6.25C1.8 5.6 2.2 4.5 3 4.5L3.4 4.5Z"),
      G("wind", [
        path("M20.9 5A3.5 3.5 0 1 0 21.2 9.4"),
        path("M21.3 3L21.3 5.4L19 5.4")
      ])
    ],
    gAnims: { wind: tn("rotate", ["0 17.9 6.2","0 17.9 6.2","-100 17.9 6.2","0 17.9 6.2","0 17.9 6.2"], [0,0.3,0.55,0.8,1]) },
  },

  /* ---- filter: slider lines — knobs ride their tracks ---- */

  "filter-horizontal": { dur: 1.6, auto: false,
    parts: [
      line(3.4, 7, 5.4, 7),
      line(12.6, 7, 20.6, 7),
      A(rect(5.4, 4.6, 7.25, 4.75, 1.75), [an("x", ["5.4","5.4","9.6","5.4","5.4"], [0,0.3,0.55,0.8,1])]),
      line(3.4, 17, 11.4, 17),
      line(18.6, 17, 20.6, 17),
      A(rect(11.4, 14.6, 7.25, 4.75, 1.75), [an("x", ["11.4","11.4","7.2","11.4","11.4"], [0,0.3,0.55,0.8,1])])
    ],
  },
  "filter-vertical": { dur: 1.6, auto: false,
    parts: [
      line(7, 3.4, 7, 5.4),
      line(7, 12.6, 7, 20.6),
      A(rect(4.6, 5.4, 4.75, 7.25, 1.75), [an("y", ["5.4","5.4","9.6","5.4","5.4"], [0,0.3,0.55,0.8,1])]),
      line(17, 3.4, 17, 11.4),
      line(17, 18.6, 17, 20.6),
      A(rect(14.6, 11.4, 4.75, 7.25, 1.75), [an("y", ["11.4","11.4","7.2","11.4","11.4"], [0,0.3,0.55,0.8,1])])
    ],
  },

  /* ---- filter: mail lines — the bars squeeze inward, filtering ---- */

  "filter-mail": { dur: 1.6, auto: false,
    parts: [
      A(line(4, 6.25, 20, 6.25), [an("x1", ["4","4","5.2","4","4"], [0,0.1,0.32,0.55,1]), an("x2", ["20","20","18.8","20","20"], [0,0.1,0.32,0.55,1])]),
      A(line(6.75, 12, 17.25, 12), [an("x1", ["6.8","6.8","8","6.8","6.8"], [0,0.24,0.46,0.69,1]), an("x2", ["17.2","17.2","16","17.2","17.2"], [0,0.24,0.46,0.69,1])]),
      A(line(9.6, 17.75, 14.4, 17.75), [an("x1", ["9.6","9.6","10.6","9.6","9.6"], [0,0.38,0.6,0.83,1]), an("x2", ["14.4","14.4","13.4","14.4","14.4"], [0,0.38,0.6,0.83,1])]),
      line(12, 19.4, 12, 20.6)
    ],
  },
  "filter-mail-circle": { dur: 1.6, auto: false,
    parts: [
      circle(12, 12, 8.5),
      A(line(8.25, 8.75, 15.75, 8.75), [an("x1", ["8.2","8.2","9.2","8.2","8.2"], [0,0.1,0.32,0.55,1]), an("x2", ["15.8","15.8","14.8","15.8","15.8"], [0,0.1,0.32,0.55,1])]),
      A(line(9.4, 12, 14.6, 12), [an("x1", ["9.4","9.4","10.4","9.4","9.4"], [0,0.24,0.46,0.69,1]), an("x2", ["14.6","14.6","13.6","14.6","14.6"], [0,0.24,0.46,0.69,1])]),
      A(line(10.6, 15.25, 13.4, 15.25), [an("x1", ["10.6","10.6","11.4","10.6","10.6"], [0,0.38,0.6,0.83,1]), an("x2", ["13.4","13.4","12.6","13.4","13.4"], [0,0.38,0.6,0.83,1])])
    ],
  },
  "filter-mail-square": { dur: 1.6, auto: false,
    parts: [
      rect(3.4, 3.4, 17.25, 17.25, 4.4),
      A(line(8.25, 8.75, 15.75, 8.75), [an("x1", ["8.2","8.2","9.2","8.2","8.2"], [0,0.1,0.32,0.55,1]), an("x2", ["15.8","15.8","14.8","15.8","15.8"], [0,0.1,0.32,0.55,1])]),
      A(line(9.4, 12, 14.6, 12), [an("x1", ["9.4","9.4","10.4","9.4","9.4"], [0,0.24,0.46,0.69,1]), an("x2", ["14.6","14.6","13.6","14.6","14.6"], [0,0.24,0.46,0.69,1])]),
      A(line(10.6, 15.25, 13.4, 15.25), [an("x1", ["10.6","10.6","11.4","10.6","10.6"], [0,0.38,0.6,0.83,1]), an("x2", ["13.4","13.4","12.6","13.4","13.4"], [0,0.38,0.6,0.83,1])])
    ],
  },
  "filter-mail-edit": { dur: 1.4, auto: false,
    parts: [
      line(3.6, 6.2, 20.4, 6.2),
      line(6.4, 12, 14.4, 12),
      line(8.4, 17.8, 10.6, 17.8),
      G("pen", [path(pen(14, 21.4, 8.6, 1.8, 2.4))]),
    ],
    gAnims: { pen: tn("rotate", ["0 14 21.4","0 14 21.4","-11 14 21.4","9 14 21.4","0 14 21.4"], [0,0.3,0.55,0.8,1]) },
  },
  "filter-mail-remove": { dur: 1.4, auto: false,
    parts: [
      line(4, 6.25, 20, 6.25),
      line(6.75, 12, 12.4, 12),
      line(9.6, 17.75, 12.4, 17.75),
      G("deny", [
        path("M15.4 12.4L20.4 17.4M20.4 12.4L15.4 17.4")
      ])
    ],
    gAnims: { deny: tn("rotate", ["0 17.9 15.4","0 17.9 15.4","-10 17.9 15.4","8 17.9 15.4","0 17.9 15.4"], [0,0.3,0.55,0.8,1]) },
  },

  /* ---- fingerprint ---- */

  /* biometric scan — a shimmer runs down the ridges */
  "fingerprint-pattern": { dur: 1.9, auto: false,
    parts: [
      A(path("M4.4 8.6A8.6 8.6 0 0 1 12 3.4C14.2 3.4 16.2 4.2 17.8 5.6"), [an("opacity", ["1","1","0.3","1","1"], [0,0.05,0.2,0.38,1])]),
      A(path("M3.4 17C3.9 15.7 4.4 14.3 4.4 12.75C4.4 10.8 5.3 9 6.6 7.75"), [an("opacity", ["1","1","0.3","1","1"], [0,0.17,0.32,0.5,1])]),
      A(path("M20.6 12.4C20.6 15 19.7 17.4 18.3 19.5"), [an("opacity", ["1","1","0.3","1","1"], [0,0.29,0.44,0.62,1])]),
      A(path("M7.8 12.6A4.2 4.2 0 0 1 16.2 12.4C16.2 14.5 15.9 16.6 15.1 18.5"), [an("opacity", ["1","1","0.3","1","1"], [0,0.41,0.56,0.74,1])]),
      A(path("M10.6 12.4C10.6 11.6 11.2 11 12 11C12.8 11 13.4 11.6 13.4 12.4C13.4 14.4 13.1 16.4 12.5 18.25"), [an("opacity", ["1","1","0.3","1","1"], [0,0.53,0.68,0.86,1])])
    ],
  },

  /* ---- flags ---- */

  "flag-off": { dur: 1.5, auto: false,
    parts: [
      path("M5 20.8L5 4.4"),
      path("M5 5C6.6 3.8 8.9 3.6 11.2 4.75C13.3 5.9 15.4 6.2 17.4 5.6C18.3 5.6 19.2 5.8 19.2 6.75L19.2 14C19.2 15 18.3 15.4 17.4 15.4C15.2 14.7 13.1 15 10.9 16.1C8.7 15.6 6.6 15.5 5 16.4"),
      A(path("M3.6 3.6L20.4 20.4", {"pathLength":1,"stroke-dasharray":1}), [an("stroke-dashoffset", [23.76,23.76,0,0], [0,0.2,0.72,1])])
    ],
  },
  /* pennants wave on their poles */
  "flag-triangle-left": { dur: 1.5, auto: false,
    parts: [
      line(18.25, 9, 18.25, 21.4),
      G("wave", [
        path("M9.2 5.7L14 3.25C15.5 2.6 16.7 2.2 17.4 2.6C18.2 3.1 18.2 4.3 18.2 5.75L18.2 14.75L9.4 11C7.4 10 6.4 9.4 6.4 8.5C6.4 7.6 7.4 7 9.2 5.75Z")
      ])
    ],
    gAnims: { wave: tn("rotate", ["0 18.2 8","0 18.2 8","-6 18.2 8","5 18.2 8","0 18.2 8"], [0,0.3,0.55,0.8,1]) },
  },
  "flag-triangle-right": { dur: 1.5, auto: false,
    parts: [
      line(5.75, 3, 5.75, 21.4),
      G("wave", [
        path("M14.8 5.7L10 3.25C8.5 2.6 7.3 2.2 6.6 2.6C5.8 3.1 5.8 4.3 5.8 5.75L5.8 14.75L14.6 11C16.6 10 17.6 9.4 17.6 8.5C17.6 7.6 16.6 7 14.8 5.75Z")
      ])
    ],
    gAnims: { wave: tn("rotate", ["0 5.8 8","0 5.8 8","6 5.8 8","-5 5.8 8","0 5.8 8"], [0,0.3,0.55,0.8,1]) },
  },
  /* single-path pennant: whole flag sways gently on its planted pole */
  flag01: { dur: 1.6, auto: false,
    parts: [
      G("sway", [
        path("M5 21L5 4.6C5.4 2.9 9.4 4.3 13.8 6L16 7C18.4 8 20.4 9.2 19.5 10.5C19 11.2 17.9 11.8 16.4 12.5L5 15.6")
      ])
    ],
    gAnims: { sway: tn("rotate", ["0 5 21","0 5 21","-3.5 5 21","3 5 21","0 5 21"], [0,0.3,0.55,0.8,1]) },
  },
  flag02: { dur: 1.5, auto: false,
    parts: [
      line(4.6, 6.4, 4.6, 20.75),
      G("wave", [
        path("M4.6 5.6C6.2 4.3 8.6 4 11 5.25C13.4 6.5 15.7 6.7 17.7 5.9C18.6 5.5 19.6 6 19.6 7L19.6 14C19.6 14.7 19.1 15.5 18.4 15.5C16.5 16.2 14 15.9 11.5 14.6C9.2 13.4 6.9 13.3 4.6 14.5")
      ])
    ],
    gAnims: { wave: tn("rotate", ["0 4.6 7","0 4.6 7","6 4.6 7","-5 4.6 7","0 4.6 7"], [0,0.3,0.55,0.8,1]) },
  },
  flag03: { dur: 1.5, auto: false,
    parts: [
      line(4.4, 5.4, 4.4, 20.75),
      circle(4.4, 4.4, 1.05),
      G("wave", [
        path("M4.4 5.4C4.4 4.4 5.2 3.6 6.2 3.6L15.6 3.6C17.5 3.6 18.5 3.8 19 4.4C19.4 4.9 19.3 5.6 18.6 6.5L17.3 8C16.6 9 16.6 10.3 17.3 11.25L18.6 12.75C19.3 13.7 19.4 14.4 19 14.9C18.5 15.5 17.5 15.75 15.6 15.75L4.4 15.75")
      ])
    ],
    gAnims: { wave: tn("rotate", ["0 4.4 7","0 4.4 7","-6 4.4 7","5 4.4 7","0 4.4 7"], [0,0.3,0.55,0.8,1]) },
  },

  /* ---- funnels ---- */

  /* the funnel tips to pour — tilts left and rights itself */
  funnel: { dur: 1.6, auto: false,
    parts: [
      G("pour", [
        path("M4.6 5.4L19.4 5.4C20.1 5.4 20.5 6.2 20.1 6.75L15.2 13L15.2 18.75C15.2 19.2 14.9 19.75 14.4 19.75L11.5 21C10.8 21 10.1 20.8 10.1 20L10.1 13L5.1 6.75C4.7 6.2 5.1 5.4 5.8 5.4Z")
      ])
    ],
    gAnims: { pour: tn("rotate", ["0 12 5","0 12 5","-8 12 5","0 12 5","0 12 5"], [0,0.3,0.55,0.8,1]) },
  },
  "funnel-plus": { dur: 1.25, auto: false,
    parts: [
      path("M4.6 5.4L14.5 5.4C15.1 5.4 15.1 6 15.1 6.5L11.1 11.5L11.1 17.25C11.1 17.8 10.8 18.4 10.3 18.4L7.7 19.5C7 19.5 6.3 19.3 6.3 18.5L6.3 11.6L2.3 6.25C1.8 5.6 2.2 4.5 3 4.5L3.4 4.5Z"),
      G("pop", [
        path("M18.2 3.8L18.2 8.25M16 6L20.4 6")
      ])
    ],
    sAnims: { pop: { pivot: [18.2, 6], anim: tn("scale", ["1","1","1.24","1","1"], [0,0.3,0.55,0.8,1]) } },
  },
  "funnel-x": { dur: 1.4, auto: false,
    parts: [
      path("M4.6 5.4L14.5 5.4C15.1 5.4 15.1 6 15.1 6.5L11.1 11.5L11.1 17.25C11.1 17.8 10.8 18.4 10.3 18.4L7.7 19.5C7 19.5 6.3 19.3 6.3 18.5L6.3 11.6L2.3 6.25C1.8 5.6 2.2 4.5 3 4.5L3.4 4.5Z"),
      G("deny", [
        path("M16.2 3.8L20.2 7.75M20.2 3.8L16.2 7.75")
      ])
    ],
    gAnims: { deny: tn("rotate", ["0 18.2 5.8","0 18.2 5.8","-10 18.2 5.8","8 18.2 5.8","0 18.2 5.8"], [0,0.3,0.55,0.8,1]) },
  },
};
