#!/usr/bin/env node
/**
 * Emits the framework-agnostic distribution of the icon set — plain SVG
 * files anyone can use, no React Native required:
 *
 *   node packages/ui/src/animated-icons/svg/gen.mjs
 *
 *   static/<name>.svg    — rest pose, stroke="currentColor"
 *   animated/<name>.svg  — same geometry + SMIL motion (works in <img>,
 *                          inline, or opened directly; zero JS)
 *   index.html           — contact sheet of everything, animated variants
 *   sprite.svg           — <symbol> sprite: <svg><use href="sprite.svg#i-home"/>
 *                          — inline <use> inherits CSS `color` natively
 *
 *   Customization: `node gen.mjs --sw 2.5 --size 32 --speed 0.8 --color "#5E68E0"`
 *   --sw      stroke width (default 2)
 *   --size    output width/height px (default 24)
 *   --speed   duration multiplier, <1 faster >1 slower (default 1)
 *   --color   bake a hex onto the root <svg> — required to recolor icons
 *             inside <img> (external CSS can't reach in); inline SVG and
 *             sprite <use> inherit `color` for free
 *
 * Geometry mirrors the Reanimated glyphs one dir up — same 24px grid,
 * 2 stroke, soft blob silhouettes, one playful detail per glyph. Every animated file loops on
 * the icon's own duration; stagger lives in keyTimes, so the cycle stays
 * coherent. If you tune a glyph, tune it in both places.
 */
import fs from "node:fs";
import nodePath from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { smoothD } from "./smooth.mjs";

const argv = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => {
    if (a.startsWith("--")) acc.push([a.slice(2), arr[i + 1]]);
    return acc;
  }, [])
);
const OUT = argv.out ? nodePath.resolve(argv.out) : nodePath.dirname(fileURLToPath(import.meta.url));
const SW = parseFloat(argv.sw ?? "2");
const SIZE = parseInt(argv.size ?? "24", 10);
const SPEED = parseFloat(argv.speed ?? "1");
const COLOR = argv.color;
const EASE = "0.16 1 0.3 1"; // our ease.out token, as keySplines

/* Optical fit: fit.json holds per-icon [dx, dy] or [dx, dy, k, cx, cy]
 * (measured from the rendered ink bbox by measure-fit.cjs). dx/dy centre
 * lopsided glyphs; k grows a glyph about its ink centre (cx, cy) to the
 * set's ~20px live area (circles ~20, squares ~18.5, wide rects ~20x16).
 * Applied as one root <g transform> so every anim stays valid; leaf strokes
 * are divided by k so the drawn weight stays exactly --sw. `--nofit` skips
 * it (used by the measuring pass). */
const FIT = (() => {
  if (process.argv.includes("--nofit")) return {};
  try {
    return JSON.parse(fs.readFileSync(nodePath.join(nodePath.dirname(fileURLToPath(import.meta.url)), "fit.json"), "utf8"));
  } catch { return {}; }
})();
// `nofit: true` on a def opts out: glyphs composed around a fixed slot (the
// ai-* sparkle badge sits at the same spot in every sibling) must not drift.
const fitOf = (name) => (!ICONS[name]?.nofit && FIT[name]) || null;
const fitK = (name) => fitOf(name)?.[2] ?? 1;
const fitWrap = (name, inner) => {
  const t = fitOf(name);
  if (!t) return inner;
  const [dx, dy, k, cx, cy] = t;
  if (!k || k === 1) return `<g transform="translate(${dx} ${dy})">${inner}</g>`;
  const tx = +(cx + dx - k * cx).toFixed(3), ty = +(cy + dy - k * cy).toFixed(3);
  return `<g transform="translate(${tx} ${ty}) scale(${k})">${inner}</g>`;
};

const BASE = {
  stroke: "currentColor",
  "stroke-width": SW,
  "stroke-linecap": "round",
  "stroke-linejoin": "round",
  fill: "none",
};

/* ---------- animation descriptors ---------- */

/** attr anim descriptor: values[] sampled over the icon's full cycle;
 *  encode holds/stagger by repeating boundary values + keyTimes. */
const an = (attr, values, times) => ({ kind: "attr", attr, values, times });
/** transform anim on a <g>: type ∈ rotate|translate|scale. */
const tn = (type, values, times, extra = {}) => ({ kind: "transform", type, values, times, ...extra });

/* ---------- loop shaping ---------- */

/** Forward→hold→reverse→hold, preserving the gesture's internal phrasing. */
function pingPong(values, times) {
  const n = values.length;
  const t = times ?? values.map((_, i) => i / (n - 1));
  const fwd = t.map((x) => +(x * 0.45).toFixed(4));
  const rev = [...values].reverse();
  const revT = [...t].reverse().map((x) => +(0.6 + (1 - x) * 0.3).toFixed(4));
  const tail = values[values.length - 1];
  const head = values[0];
  return {
    values: [...values, tail, ...rev.slice(1), head],
    times: [...fwd, 0.6, ...revT.slice(1), 1],
  };
}

/** Decide the loop shape per anim: already returns to rest → raw loop;
 *  forward-only (draw-on, toggle state) → ping-pong. */
function shape(values, times, alwaysPP) {
  const [a, b] = [values[0], values[values.length - 1]];
  const out = !alwaysPP && String(a) === String(b) ? { values, times } : pingPong(values, times);
  let vs = out.values;
  let tv = out.times ?? vs.map((_, i) => +(i / (vs.length - 1)).toFixed(4));
  // SMIL requires keyTimes to span 0→1; Chrome discards the whole anim
  // otherwise. Pad with held first/last values so an author can write
  // "stay put until t" as a leading gap without a dead anim.
  if (tv[0] > 0) { vs = [vs[0], ...vs]; tv = [0, ...tv]; }
  if (tv[tv.length - 1] < 1) { vs = [...vs, vs[vs.length - 1]]; tv = [...tv, 1]; }
  return { values: vs, times: tv };
}

function emitAnim(d, dur, alwaysPP) {
  const { values, times } = shape(d.values, d.times, alwaysPP);
  const spl = Array(values.length - 1).fill(EASE).join(";");
  const kt = (times ?? values.map((_, i) => +(i / (values.length - 1)).toFixed(4))).join(";");
  const tag = d.kind === "transform" ? "animateTransform" : "animate";
  const type = d.kind === "transform" ? ` type="${d.type}"` : "";
  const additive = d.additive ? ` additive="${d.additive}"` : "";
  const attrName = d.kind === "transform" ? "transform" : d.attr;
  const secs = +dur.toFixed(3);
  return `<${tag} attributeName="${attrName}"${type} values="${values.join(";")}" keyTimes="${kt}" dur="${secs}s" repeatCount="indefinite" calcMode="spline" keySplines="${spl}"${additive}/>`;
}

/* ---------- elements ---------- */

const LEAF = new Set(["path", "circle", "line", "rect", "ellipse", "polyline", "polygon"]);
const path = (d, a = {}) => ({ e: "path", a: { d, ...a } });
const circle = (cx, cy, r, a = {}) => ({ e: "circle", a: { cx, cy, r, ...a } });
const line = (x1, y1, x2, y2, a = {}) => ({ e: "line", a: { x1, y1, x2, y2, ...a } });
const rect = (x, y, w, h, rx, a = {}) => ({ e: "rect", a: { x, y, width: w, height: h, rx, ...a } });
const ellipse = (cx, cy, rx, ry, a = {}) => ({ e: "ellipse", a: { cx, cy, rx, ry, ...a } });
const fill = (color = "currentColor") => ({ fill: color, stroke: "none" });
const A = (part, anims) => ({ ...part, anims });
const G = (id, children, a = {}) => ({ e: "g", g: id, a, children });

const ICONS = {};
const icon = (name, def) => (ICONS[name] = def);

/** Scalloped flower ring — cosine radius modulation gives soft lobes; the
 *  Lumio gear is a bloom, not machine teeth. */
function flowerPath(cx, cy, lobes, rMid, amp, steps = 14) {
  const pts = [];
  for (let i = 0; i < lobes * steps; i++) {
    const t = (i / (lobes * steps)) * Math.PI * 2;
    const r = rMid + amp * Math.cos(lobes * t + Math.PI / 2);
    pts.push(`${(cx + r * Math.cos(t)).toFixed(2)} ${(cy + r * Math.sin(t)).toFixed(2)}`);
  }
  return `M${pts.join("L")}Z`;
}

/* ============================ WAYFINDING ============================ */

icon("home", {
  dur: 1.05,
  parts: [
    G("lift", [
      path("M3.2 12.4c0-1.9.6-2.9 1.9-3.9l4.6-3.4c1.4-1 3.2-1 4.6 0l4.6 3.4c1.3 1 1.9 2 1.9 3.9v4.8c0 2.1-1.7 3.8-3.8 3.8H7c-2.1 0-3.8-1.7-3.8-3.8v-4.8z"),
      A(path("M10.2 21v-3.8c0-1 .8-1.8 1.8-1.8s1.8.8 1.8 1.8V21", { "stroke-dasharray": 13.5 }), [
        an("stroke-dashoffset", ["13.5", "13.5", "0"], [0, 0.15, 0.85]),
      ]),
    ]),
  ],
  gAnims: { lift: tn("translate", ["0 0", "0 -0.8", "0 0"]) },
});

icon("search", {
  dur: 1.3,
  parts: [
    G("tilt", [circle(11, 11, 8), path("M7.9 9.2a4.6 4.6 0 0 1 2.9-2")]),
    A(line(16.9, 16.9, 20.6, 20.6), [
      an("x2", ["20.6", "21.4", "20.6"]),
      an("y2", ["20.6", "21.4", "20.6"]),
    ]),
  ],
  gAnims: { tilt: tn("rotate", ["0 11 11", "-9 11 11", "0 11 11"]) },
});

icon("plus", {
  dur: 0.85,
  parts: [
    G("spin", [line(12, 5, 12, 19), line(5, 12, 19, 12)]),
  ],
  gAnims: { spin: tn("rotate", ["0 12 12", "90 12 12"]) },
});

icon("x", {
  dur: 0.95,
  parts: [
    A(path("M6 6l12 12", { "stroke-dasharray": 17 }), [
      an("stroke-dashoffset", ["17", "17", "0"], [0, 0.05, 0.7]),
    ]),
    A(path("M18 6 6 18", { "stroke-dasharray": 17 }), [
      an("stroke-dashoffset", ["17", "17", "0"], [0, 0.3, 1]),
    ]),
  ],
});

icon("check", {
  dur: 0.95,
  parts: [
    A(path("M4.8 12.5l4.5 4.5L19.5 7", { "stroke-dasharray": 20.7 }), [
      an("stroke-dashoffset", ["20.7", "0"]),
    ]),
  ],
});

icon("check-circle", {
  dur: 1.05,
  parts: [
    circle(12, 12, 8.5),
    A(path("M8.4 12.5l2.9 2.9 4.8-5.8", { "stroke-dasharray": 11.7 }), [
      an("stroke-dashoffset", ["11.7", "11.7", "0"], [0, 0.15, 1]),
    ]),
  ],
});

const arrow = (rot) => ({
  dur: 1.15,
  parts: [
    G("surge", [
      line(4.5, 12, 18.4, 12),
      path("M13.4 6.6l5.5 5.4-5.5 5.6"),
    ], { transform: `rotate(${rot} 12 12)` }),
  ],
  gAnims: { surge: tn("translate", ["0 0", "3.4 0", "0 0"], null, { additive: "sum" }) },
});
icon("arrow-right", arrow(0));
icon("arrow-up", arrow(-90));
icon("arrow-left", arrow(180));

const chevron = (rot) => ({
  dur: 1.0,
  parts: [
    G("nudge", [path("M9.5 6.3l5.7 5.7-5.7 6")], { transform: `rotate(${rot} 12 12)` }),
  ],
  gAnims: { nudge: tn("translate", ["0 0", "2.8 0", "0 0"], null, { additive: "sum" }) },
});
icon("chevron-right", chevron(0));
icon("chevron-down", chevron(90));
icon("chevron-left", chevron(180));
icon("chevron-up", chevron(-90));

{
  const pos = [[6.5, 6.5], [17.5, 6.5], [6.5, 17.5], [17.5, 17.5]];
  const range = [[0, 0.5], [0.15, 0.65], [0.15, 0.65], [0.3, 0.8]];
  icon("grid", {
    dur: 1.4,
    parts: pos.map(([cx, cy], i) => {
      const [a, b] = range[i];
      const mid = (a + b) / 2;
      const w = (s) => (7 * s).toFixed(3);
      return A(rect(cx - 3.5, cy - 3.5, 7, 7, 2.4), [
        an("x", [cx - 3.5, cx - 3.5, cx - 4.06, cx - 3.5], [0, a, mid, b]),
        an("y", [cy - 3.5, cy - 3.5, cy - 4.06, cy - 3.5], [0, a, mid, b]),
        an("width", [w(1), w(1), w(1.16), w(1)], [0, a, mid, b]),
        an("height", [w(1), w(1), w(1.16), w(1)], [0, a, mid, b]),
      ]);
    }),
  });
}

icon("filter", {
  dur: 1.75,
  parts: [
    path("M4.8 5.4h14.4c.8 0 1.2.9.7 1.5l-5.2 5.9v5.4c0 .5-.3.9-.8 1.1l-3.2 1.3c-.7.3-1.5-.2-1.5-1v-7.3l-5.2-5.9c-.5-.6-.2-1.5.7-1.5z"),
    A(circle(12, 8, 0.01, { opacity: "0" }), [ // a stroke dot, not a fill
      an("cy", ["8", "8", "17.5", "17.5"], [0, 0.1, 0.78, 1]),
      an("opacity", ["0", "1", "1", "0", "0"], [0, 0.25, 0.72, 0.82, 1]),
    ]),
  ],
});

icon("refresh", {
  dur: 1.6,
  pp: false, // continuous spin, no reverse
  parts: [
    G("spin", [
      path("M3.5 12a8.5 8.5 0 0 1 14.4-6.2l2.6 2.7"),
      path("M20.5 3.5v5h-5"),
      path("M20.5 12a8.5 8.5 0 0 1-14.4 6.2l-2.6-2.7"),
      path("M3.5 20.5v-5h5"),
    ]),
  ],
  gAnims: { spin: tn("rotate", ["0 12 12", "360 12 12"]) },
});

/* ============================ OBJECTS ============================ */

icon("bell", {
  dur: 1.75,
  parts: [
    G("shell", [path("M6.4 9.4a5.6 5.6 0 0 1 11.2 0c0 4.9 1.5 6.4 2.5 7.7.5.7.1 1.5-.7 1.5H4.6c-.8 0-1.2-.8-.7-1.5 1-1.3 2.5-2.8 2.5-7.7z")]),
    G("clapper", [path("M10.2 18.6a1.8 1.8 0 0 0 3.6 0")]),
  ],
  gAnims: {
    shell: tn("rotate", ["0 12 4", "-11 12 4", "8 12 4", "-4 12 4", "0 12 4"], [0, 0.25, 0.55, 0.8, 1]),
    clapper: tn("rotate", ["0 12 18.6", "15 12 18.6", "-11 12 18.6", "6 12 18.6", "0 12 18.6"], [0, 0.25, 0.55, 0.8, 1]),
  },
});

const HEART_D = "M12 19.8S4.6 14.9 3.6 10.4c-.8-3.5 1.6-5.8 4.1-5.8 1.8 0 3.4 1 4.3 2.4.9-1.4 2.5-2.4 4.3-2.4 2.5 0 4.9 2.3 4.1 5.8-1 4.5-8.4 9.4-8.4 9.4z";
icon("heart", {
  dur: 1.4,
  parts: [
    G("pop", [
      A(path(HEART_D, { ...fill(), opacity: 0 }), [an("opacity", ["0", "1"])]),
      path(HEART_D),
    ]),
  ],
  sAnims: { pop: { pivot: [12, 12], anim: tn("scale", ["1", "1.22", "1"], [0, 0.55, 1]) } },
});

const STAR_D = "M12 4.5l1.9 4.1c.2.4.6.7 1 .7l4.5.5-3.4 3c-.3.3-.5.8-.4 1.2l.9 4.4-3.9-2.2c-.4-.2-.9-.2-1.2 0l-3.9 2.2.9-4.4c.1-.4-.1-.9-.4-1.2l-3.4-3 4.5-.5c.4 0 .8-.3 1-.7z";
icon("star", {
  dur: 1.4,
  parts: [
    G("pop", [
      A(path(STAR_D, { ...fill(), opacity: 0 }), [an("opacity", ["0", "1"])]),
      path(STAR_D),
    ]),
  ],
  sAnims: {
    pop: {
      pivot: [12, 12],
      anim: tn("scale", ["1", "1.18", "1"], [0, 0.55, 1]),
      extra: tn("rotate", ["0 0 0", "-18 0 0", "0 0 0"], [0, 0.55, 1], { additive: "sum" }),
    },
  },
});

icon("user", {
  dur: 1.2,
  parts: [
    A(circle(12, 8.4, 3.6), [an("cy", ["8.4", "9.2", "8.4"])]),
    G("body", [path("M12 13.6c-3.3 0-5.6 2.3-5.6 5.4 0 .6.5 1.2 1.2 1.2h8.8c.7 0 1.2-.6 1.2-1.2 0-3.1-2.3-5.4-5.6-5.4z")]),
  ],
  gAnims: { body: tn("translate", ["0 0", "0 -1", "0 0"]) },
});

icon("settings", {
  dur: 1.4,
  parts: [
    G("turn", [path(flowerPath(12, 12, 8, 7.9, 0.95)), circle(12, 12, 3)]),
  ],
  gAnims: { turn: tn("rotate", ["0 12 12", "90 12 12"]) },
});

{
  const dots = [[8.5, 0.05, 0.5], [12, 0.28, 0.73], [15.5, 0.51, 0.96]];
  icon("message", {
    dur: 2.2,
    parts: [
      path("M5.4 4.9h13.2c1.5 0 2.7 1.2 2.7 2.7v6.4c0 1.5-1.2 2.7-2.7 2.7h-4.4l-3.4 3c-.6.5-1.5 0-1.5-.8v-2.2H5.4c-1.5 0-2.7-1.2-2.7-2.7V7.6c0-1.5 1.2-2.7 2.7-2.7z"),
      ...dots.map(([x, a, b]) =>
        A(line(x, 10.7, x, 10.7, { "stroke-width": SW + 0.6 }), [
          an("y1", ["10.7", "10.7", "8.9", "10.7", "10.7"], [0, a, (a + b) / 2, b, 1]),
          an("y2", ["10.7", "10.7", "8.9", "10.7", "10.7"], [0, a, (a + b) / 2, b, 1]),
        ])
      ),
    ],
  });
}

icon("mail", {
  dur: 1.2,
  parts: [
    path("M4.8 5.4h14.4c1.5 0 2.7 1.2 2.7 2.7v7.8c0 1.5-1.2 2.7-2.7 2.7H4.8c-1.5 0-2.7-1.2-2.7-2.7V8.1c0-1.5 1.2-2.7 2.7-2.7z"),
    A(line(2.9, 8.3, 12, 13.5), [an("y2", ["13.5", "7"])]),
    A(line(12, 13.5, 21.1, 8.3), [an("y1", ["13.5", "7"])]),
  ],
});

icon("trash", {
  dur: 1.3,
  parts: [
    G("lid", [
      line(4, 7.6, 20, 7.6),
      path("M9.8 7.6V6.3c0-.9.7-1.6 1.6-1.6h1.2c.9 0 1.6.7 1.6 1.6v1.3"),
    ]),
    path("M6 7.6l.9 10.3c.1 1.4 1.3 2.5 2.7 2.5h4.8c1.4 0 2.6-1.1 2.7-2.5L18 7.6"),
    A(line(10, 11, 10, 16.2), [an("y1", ["11", "11.8", "11"]), an("y2", ["16.2", "15.4", "16.2"])]),
    A(line(14, 11, 14, 16.2), [an("y1", ["11", "11.8", "11"]), an("y2", ["16.2", "15.4", "16.2"])]),
  ],
  gAnims: { lid: tn("rotate", ["0 5 7", "-14 5 7", "0 5 7"]) },
});

icon("calendar", {
  dur: 1.2,
  parts: [
    G("settle", [
      path("M5.6 5.4h12.8c1.5 0 2.7 1.2 2.7 2.7v9.8c0 1.5-1.2 2.7-2.7 2.7H5.6c-1.5 0-2.7-1.2-2.7-2.7V8.1c0-1.5 1.2-2.7 2.7-2.7z"),
      line(2.9, 9.8, 21.1, 9.8),
      line(8.2, 3.6, 8.2, 7.6),
      line(15.8, 3.6, 15.8, 7.6),
      A(circle(12, 15, 1.2), [an("r", ["1.2", "1.5", "1.2"])]),
    ]),
  ],
  gAnims: { settle: tn("translate", ["0 0", "0 0.7", "0 0"]) },
});

icon("clock", {
  dur: 1.8,
  pp: false, // keeps winding — a rewind would read wrong; 360≡0 snaps invisibly
  parts: [
    circle(12, 12, 8.5),
    G("wind", [path("M12 7v5.2l3.2 2")]),
  ],
  gAnims: { wind: tn("rotate", ["0 12 12", "360 12 12"]) },
});

icon("lock", {
  dur: 1.4,
  parts: [
    G("lift", [
      G("swing", [
        A(path("M7.8 10.4V8a4.2 4.2 0 0 1 8.4 0v2.4"), [
          an("opacity", ["1", "1", "0.55"], [0, 0.45, 1]),
        ]),
      ]),
    ]),
    // outlined body, the keyhole a single short line
    path("M7.6 10.4h8.8a3 3 0 0 1 3 3v4a3 3 0 0 1-3 3H7.6a3 3 0 0 1-3-3v-4a3 3 0 0 1 3-3z"),
    line(12, 14.2, 12, 16.6),
  ],
  gAnims: {
    lift: tn("translate", ["0 0", "0 -1.4", "0 -1.4"], [0, 0.45, 1]),
    swing: tn("rotate", ["0 16.2 10", "-62 16.2 10"], [0.25, 1]),
  },
});

icon("edit", {
  dur: 1.3,
  parts: [
    G("wiggle", [
      path("M4.8 19.2l1-3.9L15.7 5.5a2.4 2.4 0 0 1 3.4 0l.1.1a2.4 2.4 0 0 1 0 3.4L9.3 18.8l-3.8.9z"),
      path("M14.4 6.7l3.2 3.2"),
    ]),
  ],
  gAnims: { wiggle: tn("rotate", ["0 5 19", "-10 5 19", "5 5 19", "0 5 19"], [0, 0.3, 0.65, 1]) },
});

icon("download", {
  dur: 1.25,
  parts: [
    G("arrow", [line(12, 3.8, 12, 15), path("M7 10l5 5 5-5")]),
    G("tray", [path("M3.9 15.4v2.2c0 1.5 1.2 2.7 2.7 2.7h10.8c1.5 0 2.7-1.2 2.7-2.7v-2.2")]),
  ],
  gAnims: {
    arrow: tn("translate", ["0 0", "0 2.6", "0 0"], [0, 0.5, 1]),
    tray: tn("translate", ["0 0", "0 0", "0 1", "0 0"], [0, 0.45, 0.6, 1]),
  },
});

icon("share", {
  dur: 1.4,
  parts: [
    circle(18, 5.2, 2.5),
    G("pop", [circle(6, 12, 2.5)]),
    circle(18, 18.8, 2.5),
    A(path("M8.5 10.9l7.1-4.5", { "stroke-dasharray": 8.4 }), [
      an("stroke-dashoffset", ["8.4", "8.4", "0"], [0, 0.05, 0.55]),
    ]),
    A(path("M8.5 13.1l7.1 4.5", { "stroke-dasharray": 8.4 }), [
      an("stroke-dashoffset", ["8.4", "8.4", "0"], [0, 0.3, 0.85]),
    ]),
  ],
  sAnims: { pop: { pivot: [6, 12], anim: tn("scale", ["1", "1.1", "1"]) } },
});

icon("globe", {
  dur: 2.0,
  parts: [
    circle(12, 12, 8.5),
    A(ellipse(12, 12, 3.6, 8.5), [an("rx", ["3.6", "0.4", "3.6"])]),
    line(3.5, 12, 20.5, 12),
  ],
});

icon("map-pin", {
  dur: 1.55,
  parts: [
    G("drop", [
      path("M12 21.5s7.3-6.1 7.3-11.3a7.3 7.3 0 1 0-14.6 0c0 5.2 7.3 11.3 7.3 11.3z"),
      A(circle(12, 10.2, 2.5), [an("r", ["2.5", "2.5", "3.3", "2.5"], [0, 0.5, 0.75, 1])]),
    ]),
  ],
  gAnims: { drop: tn("translate", ["0 -4", "0 0.6", "0 -0.3", "0 0"], [0, 0.6, 0.8, 1]) },
});

icon("wallet", {
  dur: 1.5,
  parts: [
    path("M4.5 8.4c0-2 1.6-3.6 3.6-3.6h7.8c2 0 3.6 1.6 3.6 3.6v7.6c0 2-1.6 3.6-3.6 3.6H8.1c-2 0-3.6-1.6-3.6-3.6V8.4z"),
    G("slot", [
      path("M19.5 9.8v5h-4.4c-1.4 0-2.5-1.1-2.5-2.5s1.1-2.5 2.5-2.5h4.4z"),
      A(circle(15.4, 12.3, 0.9, fill()), [an("r", ["0.9", "1.2", "0.9"])]),
    ]),
  ],
  gAnims: { slot: tn("translate", ["0 0", "0.7 0", "0 0"]) },
});

{
  const bars = [[8.5, 10.5, 0, 0.5], [12.5, 7, 0.2, 0.7], [16.5, 13, 0.4, 0.9]];
  icon("chart", {
    dur: 1.6,
    parts: [
      path("M4 4.5v14a1 1 0 0 0 1 1h15"),
      ...bars.map(([x, top, a, b]) =>
        A(line(x, 17.5, x, top), [
          an("y2", ["17.5", "17.5", String(top)], [0, a, b]),
        ])
      ),
    ],
  });
}

icon("zap", {
  dur: 1.05,
  parts: [
    A(path("M13.3 3.7 6.6 13.1c-.5.6 0 1.4.8 1.4h3.8l-1.3 5.6c-.2.9 1 1.4 1.5.7l6.7-9.4c.5-.6 0-1.4-.8-1.4h-3.8l1.3-5.6c.2-.9-1-1.4-1.5-.7z", { "stroke-dasharray": 51 }), [
      an("stroke-dashoffset", ["51", "0"]),
    ]),
  ],
});

icon("bookmark", {
  dur: 1.4,
  parts: [
    A(path("M6.8 3.8h10.4c.9 0 1.6.7 1.6 1.6v14.6l-6.8-4.4-6.8 4.4V5.4c0-.9.7-1.6 1.6-1.6z", { "stroke-dasharray": 61 }), [
      an("stroke-dashoffset", ["61", "0"]),
    ]),
  ],
});

icon("phone", {
  dur: 1.6,
  parts: [
    G("ring", [
      path("M5 4.5h3l1.6 4.4-2 1.6a13.5 13.5 0 0 0 6 6l1.6-2 4.4 1.6v3a1.5 1.5 0 0 1-1.6 1.5A16.5 16.5 0 0 1 3.5 6.1 1.5 1.5 0 0 1 5 4.5z"),
    ]),
  ],
  gAnims: { ring: tn("rotate", ["0 12 14", "-9 12 14", "7 12 14", "-4 12 14", "0 12 14"], [0, 0.22, 0.5, 0.78, 1]) },
});

/* ============================ ACTIONS II ============================ */

icon("minus", {
  dur: 0.85,
  parts: [
    A(line(5, 12, 19, 12, { "stroke-dasharray": 14 }), [
      an("stroke-dashoffset", ["14", "0"]),
    ]),
  ],
});

// upload mirrors download: same tray, arrow rises out instead of dropping in —
// the tray recoils UP with it (download's presses down).
icon("upload", {
  dur: 1.25,
  parts: [
    G("arrow", [line(12, 15, 12, 4.6), path("M7 9l5-5 5 5")]),
    G("tray", [path("M3.9 15.4v2.2c0 1.5 1.2 2.7 2.7 2.7h10.8c1.5 0 2.7-1.2 2.7-2.7v-2.2")]),
  ],
  gAnims: {
    arrow: tn("translate", ["0 0", "0 -2.4", "0 0"], [0, 0.5, 1]),
    tray: tn("translate", ["0 0", "0 0", "0 -0.7", "0 0"], [0, 0.45, 0.6, 1]),
  },
});

// unlock shares lock's body + keyhole; the shackle rests just off the latch
// and springs wider on the gesture.
icon("unlock", {
  dur: 1.4,
  parts: [
    G("swing", [path("M7.8 10.4V8a4.2 4.2 0 0 1 8.2-1.3")]),
    path("M7.6 10.4h8.8a3 3 0 0 1 3 3v4a3 3 0 0 1-3 3H7.6a3 3 0 0 1-3-3v-4a3 3 0 0 1 3-3z"),
    line(12, 14.2, 12, 16.6),
  ],
  gAnims: { swing: tn("rotate", ["0 7.8 10.4", "-38 7.8 10.4", "0 7.8 10.4"], [0, 0.5, 1]) },
});

// users = our user silhouette plus a second, smaller person peeking behind —
// the rear figure slides in rather than popping.
icon("users", {
  dur: 1.5,
  parts: [
    G("back", [
      circle(16.9, 8.9, 2.5),
      path("M16.9 13.2c2.2 0 3.8 1.6 3.8 3.7"),
    ]),
    A(circle(9.6, 8.4, 3.6), [an("cy", ["8.4", "9.2", "8.4"])]),
    G("body", [path("M9.6 13.6c-3.3 0-5.6 2.3-5.6 5.4 0 .6.5 1.2 1.2 1.2h8.8c.7 0 1.2-.6 1.2-1.2 0-3.1-2.3-5.4-5.6-5.4z")]),
  ],
  gAnims: {
    back: tn("translate", ["1.2 0", "0 0"], [0.2, 1]),
    body: tn("translate", ["0 0", "0 -1", "0 0"]),
  },
});

// tag is a home-plate pentagon pointing right, string hole up at the anchor —
// it swings on the hole like a tag on a string.
icon("tag", {
  dur: 1.6,
  parts: [
    G("swing", [
      path("M6.2 4.7H12l7.3 6.8c.7.7.7 1.9 0 2.6l-7.3 6.8c-.3.3-.7.4-1.1.4H6.2c-1 0-1.8-.8-1.8-1.8V6.5c0-1 .8-1.8 1.8-1.8z"),
      circle(8.1, 7.7, 1.35),
    ]),
  ],
  gAnims: { swing: tn("rotate", ["0 8.1 7.7", "-11 8.1 7.7", "8 8.1 7.7", "0 8.1 7.7"], [0, 0.35, 0.7, 1]) },
});

// external-link: the box's top-right corner is open — the escape hatch —
// and the arrow darts through it on the gesture.
icon("external-link", {
  dur: 1.25,
  parts: [
    path("M13.4 4.6H7c-1.3 0-2.4 1.1-2.4 2.4v10c0 1.3 1.1 2.4 2.4 2.4h10c1.3 0 2.4-1.1 2.4-2.4v-6.4"),
    G("dart", [
      line(11, 13, 18.9, 5.1),
      path("M14.6 4.8h4.4v4.4"),
    ]),
  ],
  gAnims: { dart: tn("translate", ["0 0", "1.1 -1.1", "0 0"], [0, 0.5, 1]) },
});

// maximize: four corner brackets (not arrows) that
// breathe outward toward the canvas corners.
icon("maximize", {
  dur: 1.3,
  parts: [
    G("tl", [path("M4.6 9.2V6.2c0-.9.7-1.6 1.6-1.6h3")]),
    G("tr", [path("M19.4 9.2V6.2c0-.9-.7-1.6-1.6-1.6h-3")]),
    G("bl", [path("M4.6 14.8v3c0 .9.7 1.6 1.6 1.6h3")]),
    G("br", [path("M19.4 14.8v3c0 .9-.7 1.6-1.6 1.6h-3")]),
  ],
  gAnims: {
    tl: tn("translate", ["0 0", "-0.9 -0.9", "0 0"]),
    tr: tn("translate", ["0 0", "0.9 -0.9", "0 0"]),
    bl: tn("translate", ["0 0", "-0.9 0.9", "0 0"]),
    br: tn("translate", ["0 0", "0.9 0.9", "0 0"]),
  },
});

// move: four symmetric-chevron arrows that take turns nudging outward,
// travelling clockwise — reads as "grab and drag anywhere".
icon("move", {
  dur: 1.6,
  parts: [
    G("up", [line(12, 9.8, 12, 4.4), path("M9.2 7.2 12 4.4l2.8 2.8")]),
    G("rt", [line(14.2, 12, 19.6, 12), path("M16.8 9.2l2.8 2.8-2.8 2.8")]),
    G("dn", [line(12, 14.2, 12, 19.6), path("M9.2 16.8l2.8 2.8 2.8-2.8")]),
    G("lf", [line(9.8, 12, 4.4, 12), path("M7.2 9.2 4.4 12l2.8 2.8")]),
  ],
  gAnims: {
    up: tn("translate", ["0 0", "0 -0.9", "0 0"], [0, 0.25, 0.5]),
    rt: tn("translate", ["0 0", "0.9 0", "0 0"], [0.25, 0.5, 0.75]),
    dn: tn("translate", ["0 0", "0 0.9", "0 0"], [0.5, 0.75, 1]),
    lf: tn("translate", ["0 0", "-0.9 0", "0 0"], [0.75, 0.88, 1]),
  },
});

/* ============================ MEDIA & WEATHER ============================ */

icon("send", {
  dur: 1.75,
  parts: [
    G("fly", [
      path("M19.8 5.1 5.1 9.9c-.9.3-.9 1.5 0 1.8l4.6 1.6c.3.1.6.4.7.7l1.6 4.6c.3.9 1.5.9 1.8 0l6.7-12.8c.3-.7-.3-1.3-.9-.9z"),
      path("M9.6 12.9 15.5 9"),
    ]),
  ],
  gAnims: {
    fly: [
      tn("translate", ["0 0", "0 0", "11 -11", "-4 0", "0 0"], [0, 0.1, 0.55, 0.65, 1]),
      an("opacity", ["1", "1", "0", "0", "1", "1"], [0, 0.45, 0.62, 0.7, 0.95, 1]),
    ],
  },
});

icon("mic", {
  dur: 2.25,
  parts: [
    path("M9 5a3 3 0 0 1 6 0v5.7a3 3 0 0 1-6 0V5z"),
    path("M5.6 10.8a6.4 6.4 0 0 0 12.8 0"),
    line(12, 17.2, 12, 20.6),
    line(8.6, 20.6, 15.4, 20.6),
    G("arcL", [path("M3.2 9.8a9 9 0 0 0 0 4.6", { "stroke-width": (SW * 0.8).toFixed(2) })], { opacity: "0" }),
    G("arcR", [path("M20.8 9.8a9 9 0 0 1 0 4.6", { "stroke-width": (SW * 0.8).toFixed(2) })], { opacity: "0" }),
  ],
  gAnims: {
    arcL: [
      tn("translate", ["0 0", "0 0", "-1.2 0", "-1.2 0"], [0, 0.1, 0.7, 1]),
      an("opacity", ["0", "1", "1", "0", "0"], [0.1, 0.4, 0.75, 0.9, 1]),
    ],
    arcR: [
      tn("translate", ["0 0", "0 0", "1.2 0", "1.2 0"], [0, 0.3, 0.9, 1]),
      an("opacity", ["0", "0", "1", "1", "0"], [0, 0.3, 0.6, 0.9, 1]),
    ],
  },
});

icon("camera", {
  dur: 1.3,
  parts: [
    // clean body with a soft hump; one outlined lens whose iris stops down
    path("M2.8 9.6a3 3 0 0 1 3-3h1c.6 0 1.1-.3 1.4-.8l.9-1.4c.4-.6 1-.9 1.7-.9h2.4c.7 0 1.3.3 1.7.9l.9 1.4c.3.5.8.8 1.4.8h1a3 3 0 0 1 3 3V17a3 3 0 0 1-3 3H5.8a3 3 0 0 1-3-3V9.6z"),
    A(circle(12, 13.3, 3.4), [an("r", ["3.4", "2.6", "3.4"])]),
  ],
});

icon("video", {
  dur: 2.0,
  parts: [
    path("M6.7 5.6h7.4c1.9 0 3.4 1.5 3.4 3.4v6c0 1.9-1.5 3.4-3.4 3.4H6.7c-1.9 0-3.4-1.5-3.4-3.4V9c0-1.9 1.5-3.4 3.4-3.4z"),
    path("M17.5 10.6l3-1.7c.6-.3 1.2 0 1.2.7v4.8c0 .7-.6 1-1.2.7l-3-1.7"),
    A(circle(8.2, 12, 1.1, fill()), [
      an("opacity", ["0", "1", "0.25", "1"], [0, 0.2, 0.5, 1]),
      an("r", ["1.1", "1.5", "1.1"]),
    ]),
  ],
});

icon("music", {
  dur: 1.6,
  parts: [
    G("sway", [
      path("M9.4 17.9V5.6l11.2-1.9v12.3"),
      line(9.4, 9.3, 20.6, 7.5),
      circle(6.4, 17.9, 2.8),
      circle(17.8, 16, 2.8),
    ]),
  ],
  gAnims: { sway: tn("rotate", ["0 12 20", "-7 12 20", "6 12 20", "0 12 20"], [0, 0.3, 0.65, 1]) },
});

icon("image", {
  dur: 1.6,
  parts: [
    path("M4.8 4.6h14.4c1.2 0 2.2 1 2.2 2.2v10.4c0 1.2-1 2.2-2.2 2.2H4.8c-1.2 0-2.2-1-2.2-2.2V6.8c0-1.2 1-2.2 2.2-2.2z"),
    A(circle(9.2, 9.2, 1.8), [an("cy", ["10.2", "9.2"])]),
    A(path("M3.2 17.2l5.3-5.3c.4-.4 1.1-.4 1.5 0l3.4 3.4 1.9-1.9c.4-.4 1.1-.4 1.5 0l4 4", { "stroke-dasharray": 24 }), [
      an("stroke-dashoffset", ["24", "24", "0"], [0, 0.1, 0.9]),
    ]),
  ],
});

icon("play", {
  dur: 1.05,
  parts: [G("pop", [path("M8.4 5.2l8.9 5.6c.9.6.9 1.8 0 2.4l-8.9 5.6c-.9.6-2.2-.1-2.2-1.2V6.4c0-1.1 1.3-1.8 2.2-1.2z")])],
  sAnims: {
    pop: {
      pivot: [12, 12],
      anim: tn("scale", ["1", "1.12", "1"]),
      extra: tn("translate", ["0 0", "0.7 0", "0 0"], null, { additive: "sum" }),
    },
  },
});

{
  const rays = [
    [12, 3, 12, 5, 0, -1.4], [12, 19, 12, 21, 0, 1.4],
    [3, 12, 5, 12, -1.4, 0], [19, 12, 21, 12, 1.4, 0],
    [5.7, 5.7, 7.1, 7.1, -1, -1], [16.9, 16.9, 18.3, 18.3, 1, 1],
    [5.7, 18.3, 7.1, 16.9, -1, 1], [16.9, 7.1, 18.3, 5.7, 1, -1],
  ];
  icon("sun", {
    dur: 1.6,
    parts: [
      A(circle(12, 12, 4), [an("r", ["4", "4.35", "4"])]),
      ...rays.map(([x1, y1, x2, y2, dx, dy]) =>
        A(line(x1, y1, x2, y2), [
          an("x2", [x2, x2 + dx, x2].map(String)),
          an("y2", [y2, y2 + dy, y2].map(String)),
        ])
      ),
    ],
  });
}

icon("moon", {
  dur: 1.6,
  parts: [
    G("tilt", [path("M19.6 14.8A8.3 8.3 0 1 1 9.2 4.4a6.9 6.9 0 0 0 10.4 10.4z")]),
    G("twinkle", [line(16.9, 5.2, 18.7, 5.2), line(17.8, 4.3, 17.8, 6.1)]),
  ],
  sAnims: { twinkle: { pivot: [17.8, 5.2], anim: tn("scale", ["1", "1.35", "1"], [0, 0.45, 1]) } },
  gAnims: { tilt: tn("rotate", ["0 12 13", "-9 12 13", "0 12 13"]) },
});

/* ============================ SIGNATURE ============================ */

icon("lumio-mark", {
  keepFill: true, // the brand mark is a solid squircle
  dur: 1.6,
  pp: false,
  parts: [
    A(rect(3, 3, 18, 18, 5, fill("#BEF04C")), [
      an("opacity", ["0", "1", "1", "0"], [0, 0.15, 0.85, 1]),
    ]),
    A(path("M5.8 15.6 9.2 8.3l3.4 7.3 3.3-7.3 3.4 7.3 2.3-6.7", {
      stroke: "#111114",
      "stroke-width": (SW * 1.1).toFixed(2),
      "stroke-dasharray": 24,
    }), [an("stroke-dashoffset", ["24", "0", "0", "24"], [0.12, 0.55, 0.85, 1])]),
  ],
});

icon("pulse-dot", {
  dur: 1.4,
  pp: false, // ring expands and restarts while invisible — never shrinks
  parts: [
    A(circle(12, 12, 4, { "stroke-width": (SW * 0.8).toFixed(2) }), [
      an("r", ["4", "9.5", "9.5"], [0, 0.75, 1]),
      an("opacity", ["0.5", "0", "0"], [0, 0.75, 1]),
    ]),
    A(circle(12, 12, 3.2, fill()), [an("r", ["3.2", "3.7", "3.2"], [0, 0.4, 0.8])]),
  ],
});

{
  icon("play-pause", {
    dur: 1.1,
    parts: [
      A(line(9, 5.8, 18.4, 12), [
        an("x2", ["18.4", "9"]),
        an("y2", ["12", "18.2"]),
      ]),
      A(line(9, 5.8, 9, 18.2), [
        an("x1", ["9", "15"]),
        an("x2", ["9", "15"]),
      ]),
      A(line(9, 18.2, 18.4, 12), [
        an("x1", ["9", "18.4"]),
        an("y1", ["18.2", "12"]),
        an("x2", ["18.4", "18.4"]),
        an("y2", ["12", "18.2"]),
        an("opacity", ["1", "0"]),
      ]),
    ],
  });
}

{
  icon("menu", {
    dur: 1.1,
    parts: [
      A(line(4, 7, 20, 7), [
        an("x1", ["4", "6.6"]),
        an("y1", ["7", "6.6"]),
        an("x2", ["20", "17.4"]),
        an("y2", ["7", "17.4"]),
      ]),
      A(line(4, 12, 20, 12), [
        an("x1", ["4", "12"]),
        an("x2", ["20", "12"]),
        an("opacity", ["1", "0.001"]),
      ]),
      A(line(4, 17, 20, 17), [
        an("x1", ["4", "6.6"]),
        an("y1", ["17", "17.4"]),
        an("x2", ["20", "17.4"]),
        an("y2", ["17", "6.6"]),
      ]),
    ],
  });
}

{
  const bars = [[6, 6, 0.1, 0.7], [9.5, 12, 0, 0.6], [13, 8, 0.3, 0.9], [16.5, 14, 0.15, 0.75], [20, 7, 0.35, 0.95]];
  icon("waveform", {
    dur: 2.0,
    parts: bars.map(([x, h, a, b]) => {
      const mid = (a + b) / 2;
      const y = (s) => (12 - (h * s) / 2).toFixed(2);
      const y2 = (s) => (12 + (h * s) / 2).toFixed(2);
      return A(line(x, y(1), x, y2(1)), [
        an("y1", [y(1), y(1), y(1.9), y(1), y(1)], [0, a, mid, b, 1]),
        an("y2", [y2(1), y2(1), y2(1.9), y2(1), y2(1)], [0, a, mid, b, 1]),
      ]);
    }),
  });
}

/* ============================ BATCHES ============================ */
/* Icons authored at scale live in batches/*.mjs: `export const icons =
 * { name: { dur?, pp?, parts: [...], auto?: bool } }`. Batch files are
 * written by independent authoring sessions — one file per batch so they
 * never collide. `auto: true` gives a part the default draw-on gesture;
 * omit for a bespoke anims-based gesture like the core 51. */
{
  const batchDir = nodePath.join(nodePath.dirname(fileURLToPath(import.meta.url)), "batches");
  if (fs.existsSync(batchDir)) {
    for (const f of fs.readdirSync(batchDir).sort().filter((f) => f.endsWith(".mjs") && !f.startsWith("_"))) {
      const mod = await import(pathToFileURL(nodePath.join(batchDir, f)).href);
      for (const [n, d] of Object.entries(mod.icons ?? {})) {
        if (!d.dur) d.dur = 1.4;
        if (d.auto === undefined) d.auto = true;
        icon(n, d);
      }
    }
  }
}

/* ============================ EMIT ============================ */

function emitGroupAnims(list, dur, pp) {
  return (Array.isArray(list) ? list : list ? [list] : [])
    .map((d) => emitAnim(d, dur, pp))
    .join("");
}

/** Line icons carry no filled micro-details: a filled accent is emitted as
 *  outline. A dot (circle r <= 2) becomes a round stroke dot exactly one
 *  stroke wide; a bigger disc becomes a ring with the same outer edge; any
 *  other filled shape keeps its outline and drops the fill. Fills survive
 *  only as *state*: a part marked `state: true`, a hidden state layer
 *  (`opacity: 0`, e.g. the liked heart), or a def with `keepFill: true`
 *  where the fill is the concept (contrast, star-half, the brand mark).
 *  Returns a mapper for `r` anim values when a circle was converted. */
function unfill(p, a, def) {
  if (!a.fill || a.fill === "none") return null;
  if (def.keepFill || p.state || String(a.opacity) === "0") return null;
  a.fill = "none";
  a.stroke = "currentColor";
  if (p.e !== "circle") return null;
  const r0 = +a.r;
  const map = r0 <= 2
    ? (v) => +Math.max(0.01, +v - r0 + 0.01).toFixed(2)
    : (v) => +Math.max(0.01, +v - 1).toFixed(2);
  a.r = map(r0);
  return map;
}

/** Uniform scale magnitude of a static `transform` (1 when none). A scaled
 *  group or leaf would thin its strokes with it — a 0.52 cursor drew at a
 *  1px weight beside 2px neighbours — so emitNode divides it back out. */
function scaleOf(t) {
  const m = /scale\(\s*(-?[\d.]+)(?:[\s,]+(-?[\d.]+))?\s*\)/.exec(t ?? "");
  if (!m) return 1;
  const sx = Math.abs(+m[1]), sy = Math.abs(m[2] !== undefined ? +m[2] : +m[1]);
  return Math.sqrt(sx * sy) || 1;
}

/** Recursive emit — <g> parts carry group anim ids; nested groups work. */
function emitNode(p, ctx, def) {
  if (p.e === "g") {
    const prevK = ctx.k ?? 1;
    ctx.k = prevK * scaleOf(p.a?.transform);
    const inner = p.children.map((c) => emitNode(c, ctx, def)).join("");
    ctx.k = prevK;
    const anims = ctx.withAnim ? emitGroupAnims(def.gAnims?.[p.g], ctx.dur, ctx.pp) : "";
    const ga = attrs(p.a ?? {});
    let html = `<g${ga ? ` ${ga}` : ""}>${anims}${inner}</g>`;
    const s = def.sAnims?.[p.g];
    if (ctx.withAnim && s) {
      const [px, py] = s.pivot;
      const scaleA = emitAnim(s.anim, ctx.dur, ctx.pp);
      const extra = s.extra ? emitAnim(s.extra, ctx.dur, ctx.pp) : "";
      html = `<g transform="translate(${px} ${py})"><g>${scaleA}${extra}<g transform="translate(${-px} ${-py})">${html}</g></g></g>`;
    }
    return html;
  }
  const a = { ...BASE, ...p.a };
  const rMap = unfill(p, a, def);
  {
    const k = (ctx.k ?? 1) * scaleOf(p.a.transform);
    const base = p.a["stroke-width"] !== undefined ? +p.a["stroke-width"] : SW;
    if (k !== 1) a["stroke-width"] = +(base / k).toFixed(3);
  }
  if (a.d) a.d = smoothD(a.d); // de-facet polylines → real curves
  const list = (ctx.withAnim ? (p.anims ?? []) : []).map((d) =>
    rMap && d.kind === "attr" && d.attr === "r" ? { ...d, values: d.values.map(rMap) } : d);
  // Default gesture for batch icons: strokes draw on with a stagger
  // (pathLength=1 normalizes, no measuring needed); fill accents pop in late.
  if (ctx.withAnim && ctx.auto && LEAF.has(p.e) && !p.anims) {
    const i = ctx.i++;
    if (a.stroke === "none") {
      const s = 0.6 + Math.min(i * 0.04, 0.2);
      list.push(an("opacity", [0, 0, 1], [0, s, Math.min(s + 0.2, 0.95)]));
    } else {
      a.pathLength = 1;
      a["stroke-dasharray"] = 1;
      const s0 = Math.min(i * 0.07, 0.4);
      list.push(an("stroke-dashoffset", [1, 1, 0, 0], [0, s0, Math.min(s0 + 0.42, 0.92), 1]));
    }
  }
  const anims = list.map((d) => emitAnim(d, ctx.dur, ctx.pp)).join("");
  return `<${p.e} ${attrs(a)}>${anims}</${p.e}>`;
}

function renderIcon(def, withAnim, name) {
  const ctx = { withAnim, dur: def.dur * SPEED, pp: def.pp !== false, auto: def.auto === true, i: 0, k: fitK(name) };
  const out = [fitWrap(name, def.parts.map((p) => emitNode(p, ctx, def)).join(""))];
  const colorAttr = COLOR ? ` color="${COLOR}"` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 24 24" fill="none"${colorAttr}>${out.join("")}</svg>`;
}

function attrs(o) {
  return Object.entries(o)
    .filter(([, v]) => v !== undefined && v !== null && v !== false)
    .map(([k, v]) => `${k}="${v}"`)
    .join(" ");
}

const staticDir = nodePath.join(OUT, "static");
const animDir = nodePath.join(OUT, "animated");
for (const d of [staticDir, animDir]) {
  fs.rmSync(d, { recursive: true, force: true });
  fs.mkdirSync(d, { recursive: true });
}

const names = Object.keys(ICONS);
for (const name of names) {
  const def = ICONS[name];
  fs.writeFileSync(nodePath.join(staticDir, `${name}.svg`), renderIcon(def, false, name) + "\n");
  fs.writeFileSync(nodePath.join(animDir, `${name}.svg`), renderIcon(def, true, name) + "\n");
}

/* <symbol> sprite — inline <use href="sprite.svg#i-<name>"> inherits CSS color. */
{
  const symbols = names
    .map((n) => {
      const ctx = { withAnim: false, k: fitK(n) };
      const inner = fitWrap(n, ICONS[n].parts.map((p) => emitNode(p, ctx, ICONS[n])).join(""));
      return `<symbol id="i-${n}" viewBox="0 0 24 24">${inner}</symbol>`;
    })
    .join("");
  const colorAttr = COLOR ? ` color="${COLOR}"` : "";
  fs.writeFileSync(
    nodePath.join(OUT, "sprite.svg"),
    `<svg xmlns="http://www.w3.org/2000/svg"${colorAttr}>${symbols}</svg>\n`
  );
}

const cells = (src) =>
  names.map((n) => `<div class="cell"><img src="${src}/${n}.svg" width="36" height="36"/><span>${n}</span></div>`).join("\n");
fs.writeFileSync(
  nodePath.join(OUT, "index.html"),
  `<!doctype html><meta charset="utf-8"><title>Lumio animated icons</title>
<style>
  body{font-family:ui-monospace,monospace;background:#F4F5F9;color:#111114;margin:0;padding:32px}
  h1{font-family:Georgia,serif;font-weight:400;font-size:40px;margin:0 0 4px}
  p{color:#555;font-size:12px;margin:0 0 24px}
  .grid{display:grid;grid-template-columns:repeat(8,1fr);gap:8px;max-width:960px}
  .cell{display:flex;flex-direction:column;align-items:center;gap:6px;padding:12px 4px}
  .cell span{font-size:9px;color:#777}
  .dark{background:#111114;color:#F4F5F9;border-radius:24px;padding:20px;margin-bottom:24px}
  .dark .cell img:not([src*="lumio-mark"]){filter:invert(1)}
  .dark .cell span{color:#888}
</style>
<h1>Icons that move.</h1>
<p>${names.length} glyphs · 24px grid · 2 stroke · SMIL-animated — no JS needed. Static set in static/.</p>
<div class="dark"><div class="grid">${cells("animated")}</div></div>
<div class="grid">${cells("static")}</div>`
);

console.log(`emitted ${names.length} icons → svg/static/ + svg/animated/ + svg/index.html`);
