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

const HOLD = [0, 0.3, 0.55, 0.8, 1];
const POP = (cx, cy, s = 1.24) => ({
  pivot: [cx, cy],
  anim: tn("scale", ["1", "1", `${s}`, "1", "1"], HOLD),
});
const WIG = (cx, cy, a = 9) =>
  tn("rotate", [`0 ${cx} ${cy}`, `0 ${cx} ${cy}`, `-${a} ${cx} ${cy}`, `${a - 2} ${cx} ${cy}`, `0 ${cx} ${cy}`], HOLD);
const DIP = (dx, dy) => tn("translate", ["0 0", "0 0", `${dx} ${dy}`, "0 0", "0 0"], HOLD);
const SHIFT = (p, dx, dy, t = HOLD) =>
  A(p, [tn("translate", ["0 0", "0 0", `${dx} ${dy}`, "0 0", "0 0"], t)]);
const DRAW = (p, t0 = 0.15, t1 = 0.62) =>
  A({ ...p, a: { ...p.a, pathLength: 1, "stroke-dasharray": 1 } },
    [an("stroke-dashoffset", ["1", "1", "0", "0"], [0, t0, t1, 1])]);

/* basics-01 — faces, git topology, user states, bare shapes, clocks,
   phone states, currency marks. Shared silhouettes:

   FACE   — head r8.6 @12,12; dot eyes; mouth is the personality.
   GIT    — nodes r2.4, curves merge into a x=6.5 trunk.
   USER*  — shifted-left user (head @10.3) + badge at lower right,
             same layout convention as user-plus.
   CLOCK  — face r8.5; long minute hand to 12, short hour hand to N.
*/

const FACE_HEAD = () => circle(12, 12, 8.6);
const EYE = (x) => line(x, 9.9, x, 10.3);           // round-cap dot
const SMILE_MOUTH = "M8.6 14.1c.9 1.3 2.1 1.9 3.4 1.9s2.5-.6 3.4-1.9";
const FROWN_MOUTH = "M8.7 15.9c.8-1.3 2-1.9 3.3-1.9s2.5.6 3.3 1.9";

const USER_HEAD = (cx = 10.3) => circle(cx, 8.2, 3.5);
const USER_BODY = "M10.3 13.3C7.1 13.3 4.8 15.6 4.8 18.6C4.8 19.2 5.3 19.7 5.9 19.7L12.4 19.7";
const ROUND_BODY = "M12 13.8c-3.9 0-6.6 2.6-6.6 6.2v.6c0 .4.3.7.7.7h11.8c.4 0 .7-.3.7-.7v-.6c0-3.6-2.7-6.2-6.6-6.2Z";
const ROUND_HEAD = () => circle(12, 8.2, 3.9);
const ROUND_HEAD_L = () => circle(10.2, 8.2, 3.8);
const ROUND_BODY_L = "M10.2 13.4c-3.6 0-6 2.4-6 5.7v.5c0 .4.3.7.7.7h7.3";

/** Pen badge (STYLE.md accents): a hollow 45° pen, nib at (tx, ty), with a
 *  round back end. One shape for every *-pen / *-edit badge. */
const pen = (tx, ty, L = 9.4, w = 1.9, nl = 2.6) => {
  const r = (v) => +v.toFixed(2), k = Math.SQRT1_2;
  const P = (d, s) => `${r(tx + k * d + k * s)} ${r(ty - k * d + k * s)}`;
  return `M${tx} ${ty}L${P(nl, w)}L${P(L, w)}A${w} ${w} 0 0 0 ${P(L, -w)}L${P(nl, -w)}Z`;
};

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

const BADGE = {
  check: path("M15.1 17.6l1.7 1.8 3.3-3.5"),
  x: path("M15.8 16.6l4.1 4.1M19.9 16.6l-4.1 4.1"),
  minus: line(15.2, 18.1, 20.2, 18.1),
  plus: path("M17.6 15.7L17.6 20.4M15.2 18L20 18"),
  pen: path(pen(15, 20.6, 7, 1.6, 2.2)),
  search: { parts: [circle(17.2, 17.2, 2.5), line(19, 19, 20.9, 20.9)], id: "lens" },
  cog: { parts: cog(18, 17.6, 0.78), id: "cog" },
};

const userWith = (badge, label) => ({
  dur: 1.8,
  parts: [USER_HEAD(), path(USER_BODY),
    badge.parts ? G(badge.id, badge.parts) : DRAW(badge, 0.32, 0.72)],
  gAnims: badge.parts ? { [badge.id]: DIP(0, -0.9) } : undefined,
});

const TRUNK = [circle(6.5, 5.6, 2.4), circle(6.5, 18.4, 2.4), line(6.5, 8, 6.5, 16)];

export const icons = {
  /* ---- faces ----------------------------------------------------- */
  smile: { dur: 1.8, parts: [
    FACE_HEAD(), EYE(9.1), EYE(14.9), DRAW(path(SMILE_MOUTH), 0.3, 0.7)] },
  "smile-plus": { dur: 1.8, parts: [
    circle(11.2, 12.4, 7.8), line(8.5, 10.2, 8.5, 10.6), line(13.9, 10.2, 13.9, 10.6),
    DRAW(path("M8.1 14.4c.9 1.2 2 1.8 3.1 1.8s2.2-.6 3.1-1.8"), 0.3, 0.68),
    G("plus", [line(18.6, 3.6, 18.6, 8.4), line(16.2, 6, 21, 6)])],
    gAnims: { plus: DIP(0, 0.8) } },
  frown: { dur: 1.8, parts: [
    FACE_HEAD(), EYE(9.1), EYE(14.9), DRAW(path(FROWN_MOUTH), 0.3, 0.7)] },
  meh: { dur: 1.8, parts: [
    FACE_HEAD(), EYE(9.1), EYE(14.9), A(line(8.8, 14.9, 15.2, 14.9),
    [an("opacity", [".4", ".4", "1", "1"], [0, 0.3, 0.55, 1])])] },
  angry: { dur: 1.8, parts: [
    FACE_HEAD(),
    G("brows", [path("M7.6 8.6l2.9 1.2"), path("M16.4 8.6l-2.9 1.2")]),
    line(9.3, 11.4, 9.3, 11.8), line(14.7, 11.4, 14.7, 11.8),
    DRAW(path(FROWN_MOUTH), 0.34, 0.72)],
    gAnims: { brows: DIP(0, 0.9) } },
  annoyed: { dur: 1.8, parts: [
    FACE_HEAD(), EYE(9.1), EYE(14.9),
    DRAW(path("M8.4 15.3l1.2-.9 1.2.9 1.2-.9 1.2.9 1.2-.9"), 0.32, 0.75)] },
  laugh: { dur: 1.8, parts: [
    FACE_HEAD(),
    DRAW(path("M7.9 10.6c.4-.7 1-1.1 1.7-1.1s1.3.4 1.7 1.1"), 0.24, 0.6),
    DRAW(path("M12.7 10.6c.4-.7 1-1.1 1.7-1.1s1.3.4 1.7 1.1"), 0.3, 0.66),
    G("mouth", [path("M8.4 13.3c1 .5 2.3.7 3.6.7s2.6-.2 3.6-.7c-.3 2.3-1.8 3.5-3.6 3.5s-3.3-1.2-3.6-3.5Z")])],
    gAnims: { mouth: DIP(0, 0.8) } },

  /* ---- git topology ---------------------------------------------- */
  "git-branch": { dur: 1.9, parts: [
    circle(6.5, 5.6, 2.4), circle(6.5, 18.4, 2.4), line(6.5, 8, 6.5, 16),
    circle(17.3, 5.6, 2.4),
    DRAW(path("M17.3 8c0 4.6-4.6 5.4-9 6.9"), 0.34, 0.78)] },
  "git-branch-plus": { dur: 1.9, parts: [
    circle(6.5, 5.6, 2.4), circle(6.5, 18.4, 2.4), line(6.5, 8, 6.5, 16),
    circle(16.6, 8.6, 2.4),
    DRAW(path("M16.6 11c0 3.8-4 4.4-7.6 5.6"), 0.34, 0.78),
    G("plus", [line(17.6, 3.2, 17.6, 7), line(15.7, 5.1, 19.5, 5.1)])],
    gAnims: { plus: DIP(0, 0.7) } },
  "git-commit-horizontal": { dur: 1.7, parts: [
    DRAW(path("M3.2 12h5.6"), 0.2, 0.5), DRAW(path("M15.2 12h5.6"), 0.3, 0.6),
    G("node", [circle(12, 12, 3)])],
    gAnims: { node: tn("scale", ["1", "1", "1.15", "1", "1"], HOLD, { pivot: [12, 12] }) } },
  "git-commit-vertical": { dur: 1.7, parts: [
    DRAW(path("M12 3.2v5.6"), 0.2, 0.5), DRAW(path("M12 15.2v5.6"), 0.3, 0.6),
    G("node", [circle(12, 12, 3)])],
    gAnims: { node: tn("scale", ["1", "1", "1.15", "1", "1"], HOLD, { pivot: [12, 12] }) } },
  "git-merge": { dur: 1.9, parts: [
    circle(6.5, 5.6, 2.4), circle(6.5, 18.4, 2.4), line(6.5, 8, 6.5, 16),
    circle(17.3, 9.6, 2.4),
    DRAW(path("M17.3 12c0 3.6-4.4 4.2-9.6 5.4"), 0.36, 0.8)] },
  "git-fork": { dur: 1.9, parts: [
    circle(12, 4.8, 2.4),
    DRAW(path("M12 7.2v3.4c0 3.4-3 4.2-5.6 6.8"), 0.3, 0.72),
    DRAW(path("M12 7.2v3.4c0 3.4 3 4.2 5.6 6.8"), 0.36, 0.78),
    circle(6.4, 19.6, 2.2), circle(17.6, 19.6, 2.2)] },
  "git-compare": { dur: 1.4, auto: true, parts: [
    circle(6, 5.5, 2.5),
    circle(18, 18.5, 2.5),
    path("M6 8V16a2 2 0 0 0 2 2h3M18 16V8a2 2 0 0 0-2-2h-3"),
    path("M13 3.8 10.8 6 13 8.2"),
    path("M11 15.8 13.2 18 11 20.2"),
  ] },
  "git-compare-arrows": { dur: 1.4, auto: true, parts: [
    circle(6, 5.5, 2.5),
    circle(18, 18.5, 2.5),
    path("M6 8V16a2 2 0 0 0 2 2h8.5"),
    path("M18 16V8a2 2 0 0 0-2-2H7.5"),
    path("M10 3.5 7.5 6 10 8.5"),
    path("M14 15.5 16.5 18 14 20.5"),
  ] },
  "git-graph": { dur: 2, parts: [
    line(6.5, 3.4, 6.5, 20.6), circle(6.5, 7.2, 2.4), circle(6.5, 16.8, 2.4),
    DRAW(path("M6.5 10.4c0 3.4 3.8 3.9 8.3 3.9h2.9"), 0.32, 0.72),
    circle(17.7, 14.3, 2.4)] },
  "git-pull-request": { dur: 2, parts: [
    circle(6.5, 5.6, 2.4), circle(6.5, 18.4, 2.4), line(6.5, 8, 6.5, 16),
    circle(17.5, 5.6, 2.4),
    DRAW(path("M17.5 8v5.5a3 3 0 0 1-3 3h-3.6"), 0.34, 0.66),
    G("tip", [path("M12.9 14.6l-1.9 1.9 1.9 1.9")])],
    gAnims: { tip: DIP(-0.9, 0) } },
  "git-pull-request-arrow": { dur: 2, parts: [
    circle(6.5, 5.6, 2.4), circle(6.5, 18.4, 2.4), line(6.5, 8, 6.5, 16),
    circle(17.5, 5.6, 2.4),
    DRAW(path("M17.5 8v5.5a3 3 0 0 1-3 3h-6"), 0.34, 0.66),
    G("tip", [path("M11 14.6l-2 1.9 2 1.9")])],
    gAnims: { tip: DIP(-1, 0) } },
  "git-pull-request-closed": { dur: 2, parts: [
    circle(6.5, 5.6, 2.4), circle(6.5, 18.4, 2.4), line(6.5, 8, 6.5, 16),
    circle(17.5, 5.6, 2.4),
    path("M17.5 8v5.5a3 3 0 0 1-3 3h-3.4"),
    G("x", [path("M10.2 15l2.9 2.9M13.1 15l-2.9 2.9")])],
    gAnims: { x: DIP(0, 0.9) } },
  "git-pull-request-create": { dur: 2, parts: [
    circle(6.5, 5.6, 2.4), circle(6.5, 18.4, 2.4), line(6.5, 8, 6.5, 16),
    circle(17.5, 5.6, 2.4),
    path("M17.5 8v5.5a3 3 0 0 1-3 3h-3.4"),
    G("plus", [line(11.5, 14.2, 11.5, 18.9), line(9.2, 16.5, 13.8, 16.5)])],
    gAnims: { plus: DIP(0, 0.9) } },
  "git-pull-request-create-arrow": { dur: 2, parts: [
    circle(6.5, 5.6, 2.4), circle(6.5, 18.4, 2.4), line(6.5, 8, 6.5, 16),
    circle(17.5, 5.6, 2.4),
    path("M17.5 8v5.5a3 3 0 0 1-3 3h-3.4"),
    G("plus", [line(11.5, 14.2, 11.5, 18.9), line(9.2, 16.5, 13.8, 16.5)]),
    G("tip", [path("M16.4 14.6l-1.9 1.9 1.9 1.9")])],
    gAnims: { plus: DIP(0, 0.9), tip: DIP(-0.9, 0) } },
  "git-pull-request-draft": { dur: 2, parts: [
    circle(6.5, 5.6, 2.4), circle(6.5, 18.4, 2.4), line(6.5, 8, 6.5, 16),
    circle(17.5, 5.6, 2.4),
    DRAW(path("M17.5 8v5.5a3 3 0 0 1-3 3h-3.4"), 0.34, 0.72),
    line(10.2, 15.1, 10.2, 15.5), line(13.1, 15.1, 13.1, 15.5)] },

  /* ---- user states ------------------------------------------------ */
  "user-check": userWith(BADGE.check),
  "user-x": userWith(BADGE.x),
  "user-minus": userWith(BADGE.minus),
  "user-pen": userWith(BADGE.pen),
  "user-cog": userWith(BADGE.cog),
  "user-search": userWith(BADGE.search),
  "user-round": { dur: 1.7, parts: [ROUND_HEAD(), path(ROUND_BODY)] },
  "user-round-check": { dur: 1.8, parts: [ROUND_HEAD_L(), path(ROUND_BODY_L), DRAW(BADGE.check, 0.32, 0.72)] },
  "user-round-x": { dur: 1.8, parts: [ROUND_HEAD_L(), path(ROUND_BODY_L), DRAW(BADGE.x, 0.32, 0.72)] },
  "user-round-minus": { dur: 1.8, parts: [ROUND_HEAD_L(), path(ROUND_BODY_L), DRAW(BADGE.minus, 0.32, 0.72)] },
  "user-round-plus": { dur: 1.8, parts: [ROUND_HEAD_L(), path(ROUND_BODY_L), DRAW(BADGE.plus, 0.32, 0.72)] },
  "user-round-pen": { dur: 1.8, parts: [ROUND_HEAD_L(), path(ROUND_BODY_L), DRAW(BADGE.pen, 0.32, 0.72)] },
  "user-round-cog": { dur: 1.8, parts: [ROUND_HEAD_L(), path(ROUND_BODY_L), G("cog", BADGE.cog.parts)], gAnims: { cog: DIP(0, -0.9) } },
  "user-round-search": { dur: 1.8, parts: [ROUND_HEAD_L(), path(ROUND_BODY_L), G("lens", BADGE.search.parts)], gAnims: { lens: DIP(0, -0.9) } },
  "users-round": { dur: 1.9, parts: [
    circle(9.4, 8.4, 3.4),
    path("M9.4 13.2c-3.3 0-5.6 2.3-5.6 5.5v.6c0 .4.3.6.6.6h10"),
    circle(16.6, 8.8, 2.6),
    path("M16.6 12.6c2.4 0 4.3 1.8 4.3 4.2v.5c0 .3-.2.5-.5.5h-1.4")] },

  /* ---- bare shapes ------------------------------------------------ */
  hexagon: { dur: 1.6, parts: [DRAW(path("M12 3.3l7.5 4.35v8.7L12 20.7l-7.5-4.35v-8.7Z"))] },
  octagon: { dur: 1.6, parts: [DRAW(path("M8.3 3.4h7.4l5 5v7.4l-5 5H8.3l-5-5V8.4Z"))] },
  "octagon-alert": { dur: 1.8, parts: [
    path("M8.3 3.4h7.4l5 5v7.4l-5 5H8.3l-5-5V8.4Z"),
    G("mark", [line(12, 8, 12, 12.8), line(12, 16.2, 12, 16.6)])],
    gAnims: { mark: tn("scale", ["1", "1", "1.2", "1", "1"], HOLD, { pivot: [12, 12] }) } },
  "octagon-x": { dur: 1.8, parts: [
    path("M8.3 3.4h7.4l5 5v7.4l-5 5H8.3l-5-5V8.4Z"),
    DRAW(path("M9.3 9.3l5.4 5.4M14.7 9.3l-5.4 5.4"), 0.3, 0.7)] },
  pentagon: { dur: 1.6, parts: [DRAW(path("M12 3.3l8.6 6.3-3.3 10H6.7l-3.3-10Z"))] },
  squircle: { dur: 1.6, parts: [DRAW(path(
    "M12 3.5c2.8 0 5.6.2 7.2 1.8C20.8 6.9 21 9.7 21 12s-.2 5.1-1.8 6.7c-1.6 1.6-4.4 1.8-7.2 1.8s-5.6-.2-7.2-1.8C3.2 17.1 3 14.3 3 12s.2-5.1 1.8-6.7C6.4 3.7 9.2 3.5 12 3.5Z"))] },
  triangle: { dur: 1.6, parts: [DRAW(path("M12 4.2l8.4 15.5H3.6Z"))] },
  "triangle-right": { dur: 1.6, parts: [DRAW(path("M7 4.6l12.4 7.4L7 19.4Z"))] },
  torus: { dur: 1.8, parts: [
    ellipse(12, 12.6, 8.4, 5.4),
    A(ellipse(12, 12.6, 3, 1.7), [an("opacity", [".55", ".55", "1", "1"], [0, 0.35, 0.6, 1])])] },
  cone: { dur: 1.7, parts: [
    DRAW(path("M12 3.6L19.4 16.6"), 0.25, 0.55), DRAW(path("M12 3.6L4.6 16.6"), 0.3, 0.6),
    path("M4.6 16.6a9 3.6 0 0 0 14.8 0")] },
  cuboid: { dur: 1.8, parts: [
    path("M4.2 7.6L12 3.8l7.8 3.8v8.8L12 20.2l-7.8-3.8Z"),
    DRAW(path("M4.2 7.6L12 11.4l7.8-3.8"), 0.3, 0.62), DRAW(path("M12 11.4v8.8"), 0.45, 0.75)] },
  cylinder: { dur: 1.8, parts: [
    ellipse(12, 5.8, 7.6, 2.9),
    DRAW(path("M4.4 5.8v12a7.6 2.9 0 0 0 15.2 0v-12"), 0.3, 0.7)] },
  pyramid: { dur: 1.8, parts: [
    path("M12 3.6L20.4 17.3 12 20.5 3.6 17.3Z"),
    DRAW(path("M12 3.6v16.9"), 0.4, 0.7),
    DRAW(path("M3.6 17.3L12 14.1l8.4 3.2"), 0.5, 0.8)] },
  shapes: { dur: 2, parts: [
    path("M12 3.4l4.2 7.4H7.8Z"),
    circle(7.4, 16.8, 3.7),
    rect(13.6, 13.3, 6.9, 6.9, 1.6)] },

  /* ---- clocks ----------------------------------------------------- */
  ...Object.fromEntries([
    ["clock-1", "M12 12l1.7-2.95"], ["clock-2", "M12 12l2.95-1.7"], ["clock-3", "M12 12h3.4"],
    ["clock-4", "M12 12l2.95 1.7"], ["clock-5", "M12 12l1.7 2.95"], ["clock-6", "M12 12v3.4"],
    ["clock-7", "M12 12l-1.7 2.95"], ["clock-8", "M12 12l-2.95 1.7"], ["clock-9", "M12 12H8.6"],
    ["clock-10", "M12 12l-2.95-1.7"], ["clock-11", "M12 12l-1.7-2.95"], ["clock-12", "M12 12V8.6"],
  ].map(([n, hand]) => [n, { dur: 1.9, parts: [
    circle(12, 12, 8.5),
    DRAW(path("M12 12V7.6"), 0.3, 0.55),
    DRAW(path(hand), 0.45, 0.7)] }])),
  "clock-alert": { dur: 1.9, parts: [
    circle(10.4, 12.4, 7.6), DRAW(path("M10.4 12.4V8"), 0.3, 0.55), DRAW(path("M10.4 12.4l2.6 1.5"), 0.45, 0.65),
    G("mark", [line(19, 14.8, 19, 18.6), line(19, 21, 19, 21.3)])],
    gAnims: { mark: tn("scale", ["1", "1", "1.2", "1", "1"], HOLD, { pivot: [19, 18] }) } },
  "clock-arrow-up": { dur: 1.9, parts: [
    circle(10.4, 12.4, 7.6), DRAW(path("M10.4 12.4V8"), 0.3, 0.55), DRAW(path("M10.4 12.4l2.6 1.5"), 0.45, 0.65),
    G("arr", [line(19, 21, 19, 14.8), path("M16.6 17.2l2.4-2.4 2.4 2.4")])],
    gAnims: { arr: DIP(0, -1) } },
  "clock-arrow-down": { dur: 1.9, parts: [
    circle(10.4, 12.4, 7.6), DRAW(path("M10.4 12.4V8"), 0.3, 0.55), DRAW(path("M10.4 12.4l2.6 1.5"), 0.45, 0.65),
    G("arr", [line(19, 14.8, 19, 21), path("M16.6 18.6l2.4 2.4 2.4-2.4")])],
    gAnims: { arr: DIP(0, 1) } },
  hourglass: { dur: 2, parts: [
    line(5.5, 3.4, 18.5, 3.4), line(5.5, 20.6, 18.5, 20.6),
    path("M7 3.4v3.4a2 2 0 0 0 .6 1.4L12 12.6l4.4-4.4a2 2 0 0 0 .6-1.4V3.4"),
    path("M7 20.6v-3.4a2 2 0 0 1 .6-1.4L12 11.4l4.4 4.4a2 2 0 0 1 .6 1.4v3.4"),
    A(line(12, 14.6, 12, 16.4), [an("opacity", ["0", "0", "1", "1", "0"], [0, 0.3, 0.45, 0.85, 1])])] },
  "timer-off": { dur: 1.9, parts: [
    line(9.9, 3.4, 14.1, 3.4),
    path("M5.4 7.6A7.7 7.7 0 0 1 17.9 6.1"),
    path("M4.3 13.6a7.7 7.7 0 0 0 14.2 5.4"),
    DRAW(path("M4 4.5l16 16"), 0.35, 0.7)] },
  "timer-reset": { dur: 2, parts: [
    line(9.9, 3.4, 14.1, 3.4), circle(12, 13.6, 7.7),
    DRAW(path("M12 13.6l3.1-3.1"), 0.35, 0.6),
    G("rst", [path("M6.9 9.4a7.4 7.4 0 0 1 8.5-1.2"), path("M15.9 5.9l.4 2.8-2.7-.6")])],
    gAnims: { rst: DIP(-0.6, 0.6) } },

  /* ---- phone states ------------------------------------------------ */
  "phone-call": { dur: 1.9, parts: [
    path("M5 4.5L8 4.5L9.6 8.9L7.6 10.5A13.5 13.5 0 0 0 13.6 16.5L15.2 14.5L19.6 16.1L19.6 19.1A1.5 1.5 0 0 1 18 20.6A16.5 16.5 0 0 1 3.5 6.1A1.5 1.5 0 0 1 5 4.5Z"),
    G("ring", [path("M12.6 3.6a8 8 0 0 1 6.9 6.9"), path("M12.8 6.8a4.7 4.7 0 0 1 4 4")])],
    gAnims: { ring: tn("scale", ["1", "1", "1.08", "1", "1"], HOLD, { pivot: [12.6, 11] }) } },
  "phone-forwarded": { dur: 1.9, parts: [
    path("M5 4.5L8 4.5L9.6 8.9L7.6 10.5A13.5 13.5 0 0 0 13.6 16.5L15.2 14.5L19.6 16.1L19.6 19.1A1.5 1.5 0 0 1 18 20.6A16.5 16.5 0 0 1 3.5 6.1A1.5 1.5 0 0 1 5 4.5Z"),
    G("fwd", [path("M13.5 5h3.4l-1.7-1.7M16.9 5l-1.7 1.7"), line(16.9, 5, 20.4, 5)])],
    gAnims: { fwd: DIP(0.9, 0) } },
  "phone-incoming": { dur: 1.9, parts: [
    path("M5 4.5L8 4.5L9.6 8.9L7.6 10.5A13.5 13.5 0 0 0 13.6 16.5L15.2 14.5L19.6 16.1L19.6 19.1A1.5 1.5 0 0 1 18 20.6A16.5 16.5 0 0 1 3.5 6.1A1.5 1.5 0 0 1 5 4.5Z"),
    G("in", [path("M20.5 3.5L15.9 8.1"), path("M18.9 8.3h-3v-3")])],
    gAnims: { in: DIP(-0.8, 0.8) } },
  "phone-outgoing": { dur: 1.9, parts: [
    path("M5 4.5L8 4.5L9.6 8.9L7.6 10.5A13.5 13.5 0 0 0 13.6 16.5L15.2 14.5L19.6 16.1L19.6 19.1A1.5 1.5 0 0 1 18 20.6A16.5 16.5 0 0 1 3.5 6.1A1.5 1.5 0 0 1 5 4.5Z"),
    G("out", [path("M15.9 8.1L20.5 3.5"), path("M16.6 3.7h3.9v3.9")])],
    gAnims: { out: DIP(0.8, -0.8) } },
  "phone-missed": { dur: 1.9, parts: [
    path("M5 4.5L8 4.5L9.6 8.9L7.6 10.5A13.5 13.5 0 0 0 13.6 16.5L15.2 14.5L19.6 16.1L19.6 19.1A1.5 1.5 0 0 1 18 20.6A16.5 16.5 0 0 1 3.5 6.1A1.5 1.5 0 0 1 5 4.5Z"),
    G("miss", [path("M16.4 3.8l4 4M20.4 3.8l-4 4")])],
    gAnims: { miss: tn("scale", ["1", "1", "1.15", "1", "1"], HOLD, { pivot: [18.4, 5.8] }) } },

  /* ---- currencies ------------------------------------------------- */
  "indian-rupee": { dur: 1.8, parts: [
    DRAW(path("M6 4.2h12"), 0.2, 0.45), DRAW(path("M6 8.4h12"), 0.28, 0.53),
    DRAW(path("M6 4.2h5c3.3 0 5 1.5 5 4.2s-1.7 4.2-5 4.2H8.2l6.8 7.2"), 0.4, 0.85)] },
  "japanese-yen": { dur: 1.8, parts: [
    DRAW(path("M5.5 4l6.5 7.8L18.5 4"), 0.22, 0.5), DRAW(path("M12 11.8V20"), 0.45, 0.65),
    DRAW(path("M6.4 14.6h11.2"), 0.5, 0.72), DRAW(path("M6.4 18h11.2"), 0.56, 0.8)] },
  "pound-sterling": { dur: 1.8, parts: [
    DRAW(path("M15.6 5.6c-.9-1.1-2-1.6-3.4-1.6-2.4 0-4.2 1.8-4.2 4.4v3.6c0 2.5-.8 4.7-2.6 6.4h12.2"), 0.25, 0.7),
    DRAW(path("M5.4 13.4h8.6"), 0.55, 0.8)] },
  "russian-ruble": { dur: 1.8, parts: [
    DRAW(path("M8 20.3V4h5a4.3 4.3 0 0 1 0 8.6H8"), 0.25, 0.6),
    DRAW(path("M5.6 15.4h9.4"), 0.55, 0.75), DRAW(path("M5.6 18.4h9.4"), 0.62, 0.82)] },
  "swiss-franc": { dur: 1.8, parts: [
    DRAW(path("M8 20.3V3.8h9.4"), 0.25, 0.55),
    DRAW(path("M5.6 15.8h7.4"), 0.5, 0.7), DRAW(path("M5.6 18.9h7.4"), 0.56, 0.78),
    DRAW(path("M10.4 10.9V14"), 0.65, 0.85)] },
  "philippine-peso": { dur: 1.8, parts: [
    DRAW(path("M8 20.3V4h5a4.3 4.3 0 0 1 0 8.6H8"), 0.25, 0.6),
    DRAW(path("M4.4 7.6h15.2"), 0.5, 0.72), DRAW(path("M4.4 10.6h15.2"), 0.56, 0.8)] },

  /* ---- misc essentials -------------------------------------------- */
  activity: { dur: 1.6, parts: [DRAW(path("M3.4 12h4l2.6-6.4 4 12.8 2.6-6.4h4"))] },
  ban: { dur: 1.7, parts: [circle(12, 12, 8.6), DRAW(path("M5.9 5.9l12.2 12.2"), 0.3, 0.65)] },
  "check-check": { dur: 1.7, parts: [
    DRAW(path("M3.6 12.8l4.2 4.2L16.5 8"), 0.22, 0.55),
    DRAW(path("M11.8 14.7l1.4 1.4L20.5 9"), 0.4, 0.75)] },
  blend: { dur: 1.9, parts: [
    circle(9.2, 9.8, 6.2), circle(14.8, 14.2, 6.2),
    A(path("M9.2 4.4a6.2 6.2 0 0 1 5.6 7.4 6.2 6.2 0 0 0-5.6-7.4Z"), [an("opacity", ["0","0",".9",".9"],[0,.4,.6,1])])] },
  gauge: { dur: 1.8, parts: [
    path("M4.6 15.8a8.4 8.4 0 1 1 14.8 0"),
    G("marks", [line(6.4, 14, 7.2, 13), line(17.6, 14, 16.8, 13), line(12, 5.6, 12, 6.8)]),
    G("needle", [path("M12 14.2l3.6-4")]), circle(12, 14.4, 1.5)],
    gAnims: { needle: WIG(12, 14.4, 16) } },
  skull: { dur: 1.9, parts: [
    path("M12 3.4c4.4 0 7.4 3 7.4 7 0 2.3-1.2 3.8-2.6 4.6l.6 3.9a1.6 1.6 0 0 1-1.6 1.7H8.2a1.6 1.6 0 0 1-1.6-1.7l.6-3.9C5.8 14.2 4.6 12.7 4.6 10.4c0-4 3-7 7.4-7Z"),
    G("eyes", [circle(9.2, 10.6, 1.15), circle(14.8, 10.6, 1.15)]),
    path("M10.4 17.4v2.2M13.6 17.4v2.2")],
    gAnims: { eyes: tn("scale", ["1", "1", "0.82", "1", "1"], HOLD, { pivot: [12, 10.6] }) } },
  space: { dur: 1.6, parts: [
    DRAW(path("M4.4 13.4v4.6h15.2v-4.6"), 0.25, 0.6),
    A(line(8.4, 13.2, 15.6, 13.2), [an("opacity", [".5", ".5", "1", "1"], [0, 0.4, 0.65, 1])])] },
  option: { dur: 1.7, parts: [
    DRAW(path("M4 19.5h5.2L13.6 4.5H19"), 0.25, 0.6),
    DRAW(path("M4 4.5h3.6"), 0.45, 0.7)] },
  "trending-up-down": { dur: 1.9, parts: [
    DRAW(path("M3.4 15.6l4.2-4.2 2.6 2.6 5.6-5.6"), 0.22, 0.58),
    G("ah", [path("M15.8 8.4h-3v3")]),
    DRAW(path("M3.4 19.6l4.2-4.2 2.6 2.6 5.6-5.6"), 0.4, 0.75),
    G("ad", [path("M12.8 12.4h3v3")])],
    gAnims: { ah: DIP(0.7, -0.7), ad: DIP(0.7, 0.7) } },
  "umbrella-off": { dur: 1.9, parts: [
    path("M6.8 5.6a8.5 8.5 0 0 1 13.7 6.4H12M12 3.9c-4.7 0-8.5 3.8-8.5 8.5"),
    DRAW(path("M12 12.4v6.3a2.1 2.1 0 0 0 4.2 0"), 0.35, 0.62),
    DRAW(path("M4 4.5l16 16"), 0.55, 0.85)] },
  scale: { dur: 1.9, parts: [
    G("beam", [line(4.6, 7, 19.4, 7), path("M12 7l-4-2.6M12 7l4-2.6")]),
    line(12, 7, 12, 4.4),
    G("lp", [path("M4.6 7l-1.8 4.6M4.6 7l1.8 4.6"), path("M2.8 11.6a3.6 1.7 0 0 0 3.6 0")]),
    G("rp", [path("M19.4 7l-1.8 4.6M19.4 7l1.8 4.6"), path("M17.6 11.6a3.6 1.7 0 0 0 3.6 0")]),
    path("M9 20.4h6")],
    gAnims: { beam: tn("rotate", ["0 12 7", "0 12 7", "-3 12 7", "2.4 12 7", "0 12 7"], HOLD),
              lp: tn("rotate", ["0 4.6 7", "0 4.6 7", "-5 4.6 7", "4 4.6 7", "0 4.6 7"], HOLD),
              rp: tn("rotate", ["0 19.4 7", "0 19.4 7", "-5 19.4 7", "4 19.4 7", "0 19.4 7"], HOLD) } },
  "scale-3d": { dur: 1.4, auto: true, parts: [
    path("M8.5 7.8 13.8 10.9V17.1L8.5 20.2 3.2 17.1V10.9Z"),
    path("M8.5 14V20.2M8.5 14 3.2 10.9M8.5 14 13.8 10.9"),
    path("M14.8 3.5H20.5V9.2M20.5 3.5 15.6 8.4"),
  ] },
  "webhook": { dur: 1.4, auto: true, parts: [
    circle(12, 5.8, 2.3),
    circle(5.5, 17, 2.3),
    circle(18.5, 17, 2.3),
    path("M10.7 7.7C9 9.6 7.5 12 6.6 14.8"),
    path("M7.8 17H16.2"),
    path("M13.3 7.7C15 9.6 16.5 12 17.4 14.8"),
  ] },
  "webhook-off": { dur: 1.4, auto: true, parts: [
    circle(12, 5.8, 2.3),
    circle(5.5, 17, 2.3),
    circle(18.5, 17, 2.3),
    path("M10.7 7.7C9 9.6 7.5 12 6.6 14.8"),
    path("M7.8 17H16.2"),
    path("M13.3 7.7C15 9.6 16.5 12 17.4 14.8"),
    line(3.5, 3.5, 20.5, 20.5),
  ] },
};
