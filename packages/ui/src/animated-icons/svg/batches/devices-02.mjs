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
/* block cursor — a hard square-wave blink (for A() on the cursor line). */
const CURSOR = (p) =>
  A(p, [an("opacity", ["1", "1", "0", "0", "1", "1"], [0, 0.4, 0.46, 0.72, 0.78, 1])]);

/* Scalloped bloom — same cosine modulation as the core gear. */
const bloom = (cx, cy, lobes, rMid, amp, steps = 14) => {
  const pts = [];
  for (let i = 0; i < lobes * steps; i++) {
    const t = (i / (lobes * steps)) * Math.PI * 2;
    const r = rMid + amp * Math.cos(lobes * t + Math.PI / 2);
    pts.push(`${(cx + r * Math.cos(t)).toFixed(2)} ${(cy + r * Math.sin(t)).toFixed(2)}`);
  }
  return `M${pts.join("L")}Z`;
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

/* Shared furniture — the desk monitor shell every computer-* sits on. */
const SCREEN = rect(3.2, 4.2, 17.6, 12.2, 2.6);
const STAND = [
  line(12, 16.4, 12, 19.6),
  path("M8.2 20.5c1.2-.5 2.5-.8 3.8-.8s2.6.3 3.8.8"),
];

/* The laptop shell every laptop-* shares: open screen + keyboard wedge. */
const LAPTOP = [
  path("M4.4 16.4V7c0-1.6 1.3-2.8 2.8-2.8h9.6c1.5 0 2.8 1.2 2.8 2.8v9.4"),
  path("M3.6 20.4h16.8c.7 0 1.2-.8.8-1.5l-1.6-2.5H4.4l-1.6 2.5c-.4.7.1 1.5.8 1.5z"),
];

/* The TV-monitor shell for monitor-*: screen + splayed feet + rail. */
const MONITOR = [
  rect(2.6, 4, 18.8, 12.6, 2.6),
  path("M10.2 16.6 9.4 20.4M13.8 16.6l.8 3.8"),
  line(7.8, 20.7, 16.2, 20.7),
];

export const icons = {
  /* ---------------- computer family ---------------- */

  /* the power LED breathes */
  computer: {
    auto: false,
    dur: 1.7,
    parts: [
      SCREEN,
      ...STAND,
      A(circle(18.2, 15.1, 0.8, fill()), BLINK(0.25)),
    ],
  },

  /* the phone docks in toward the screen */
  "computer-phone-sync": {
    auto: false,
    dur: 1.6,
    parts: [
      path("M3.2 15.8V7c0-1.6 1.3-2.8 2.8-2.8h9.4c1.4 0 2.6 1.1 2.6 2.5"),
      line(9.6, 15.8, 9.6, 18.4),
      path("M6.2 19.5c1.1-.4 2.2-.7 3.4-.7s2.3.3 3.4.7"),
      G("phone", [rect(14.8, 10.4, 6, 10.2, 2), circle(17.8, 18.7, 0.8, fill())]),
    ],
    gAnims: { phone: DIP(-0.9, 0) },
  },

  /* the brackets pinch in around the caret */
  "computer-programming01": {
    auto: false,
    dur: 1.6,
    parts: [
      SCREEN,
      ...STAND,
      SHIFT(path("M9.4 8.2 7.6 10l1.8 1.8"), 0.7, 0),
      SHIFT(path("M14.6 8.2l1.8 1.8-1.8 1.8"), -0.7, 0),
      line(12.9, 7.6, 11.1, 12.4),
    ],
  },

  /* the pencil wiggles on its tip */
    "computer-programming02": { dur: 1.6,
    auto: false,
    parts: [
    rect(2.7, 4.2, 17.6, 12.2, 2.6),
    line(11.5, 16.4, 11.5, 19.6),
    path("M7.7 20.5C8.9 20 10.2 19.7 11.5 19.7S14.1 20 15.3 20.5"),
    line(6.7, 10.4, 11.9, 10.4),
    G("pencil", [
      path("M14.3 13.2L15.8 11L19.8 7C20.2 6.6 20.9 6.6 21.3 7L21.6 7.3C22 7.7 22 8.4 21.5 8.8L17.5 12.8L15.3 14.3Z"),
    ]),
  ],
    gAnims: { pencil: tn("rotate", ["0 14.7 12.8", "0 14.7 12.8", "-8 14.7 12.8", "6 14.7 12.8", "0 14.7 12.8"], [0, 0.3, 0.55, 0.8, 1]) } },

  /* the shield stands guard — a slow breathe */
  "computer-protection": {
    auto: false,
    dur: 1.8,
    parts: [
      SCREEN,
      ...STAND,
      G("shield", [
        path("M12 6.8c.9.4 2.4 1 3.2 1.4v2.5c0 2-1.6 3.2-3.2 4-1.6-.8-3.2-2-3.2-4V8.2c.8-.4 2.3-1 3.2-1.4z"),
      ]),
    ],
    sAnims: { shield: POP(12, 10.6, 1.08) },
  },

  /* the x shakes "no" */
  "computer-remove": {
    auto: false,
    dur: 1.6,
    parts: [
      SCREEN,
      ...STAND,
      G("x", [path("M10 8.4l4 4"), path("M14 8.4l-4 4")]),
    ],
    gAnims: { x: WIG(12, 10.4, 10) },
  },

  /* the arrow flings the screen share out */
  "computer-screen-share": {
    auto: false,
    dur: 1.5,
    parts: [
      SCREEN,
      ...STAND,
      G("share", [
        path("M8.8 13.6c.1-2.7 1.8-4.5 4.6-4.5h2.1"),
        path("M13.7 7.2l2.9 2.4-2.8 2.8"),
      ]),
    ],
    gAnims: { share: DIP(1.2, -0.5) },
  },

  "computer-settings": {
    auto: false,
    parts: [
      SCREEN,
      ...STAND,
      G("turn", [
        ...cog(12, 10.3, 0.86),
      ]),
    ],
    gAnims: { turn: tn("rotate", ["0 12 10.3", "60 12 10.3"]) },
  },

  /* the block cursor blinks */
  "computer-terminal01": {
    auto: false,
    dur: 1.3,
    parts: [
      rect(3.4, 3.4, 17.2, 17.2, 3.4),
      path("M7.6 8l2.4 2.3-2.4 2.3"),
      CURSOR(line(11.6, 12.4, 15.8, 12.4)),
    ],
  },

  "computer-terminal02": {
    auto: false,
    dur: 1.3,
    parts: [
      rect(2.8, 4.4, 18.4, 15.2, 2.6),
      line(2.8, 8.8, 21.2, 8.8),
      circle(5.2, 6.6, 0.7, fill()),
      path("M7 11.8l2 1.9-2 1.9"),
      CURSOR(line(11.4, 15.6, 15.6, 15.6)),
    ],
  },

  /* the user nods */
  "computer-user": {
    auto: false,
    dur: 1.7,
    parts: [
      SCREEN,
      ...STAND,
      A(circle(12, 8.7, 1.9), [an("cy", ["8.7", "8.7", "9.4", "8.7", "8.7"], HOLD)]),
      SHIFT(path("M8.4 14.4c.2-1.9 1.7-3.3 3.6-3.3s3.4 1.4 3.6 3.3"), 0, -0.6),
    ],
  },

  /* the caller nods */
  "computer-video-call": {
    auto: false,
    dur: 1.7,
    parts: [
      rect(3, 3.4, 18, 13.2, 2.8),
      path("M9.8 16.6 9.1 20.4M14.2 16.6l.7 3.8"),
      line(7.4, 20.6, 16.6, 20.6),
      A(circle(12, 8.4, 1.9), [an("cy", ["8.4", "8.4", "9.1", "8.4", "8.4"], HOLD)]),
      SHIFT(path("M8.6 13.8c.2-1.9 1.6-3.3 3.4-3.3s3.2 1.4 3.4 3.3"), 0, -0.6),
    ],
  },

  /* the play glyph pulses */
  "computer-video": {
    auto: false,
    dur: 1.4,
    parts: [
      SCREEN,
      ...STAND,
      G("play", [path("M10.9 8.4l3.3 2c.4.3.4.8 0 1.1l-3.3 2c-.4.3-.9 0-.9-.5V9c0-.5.5-.8.9-.6z")]),
    ],
    sAnims: { play: POP(12.2, 10.4, 1.16) },
  },

  /* ---------------- chips & hardware ---------------- */

  /* the two diagonal notches slide like faders */
  "console": { dur: 1.4, auto: true, parts: [
    rect(5.5, 3, 13, 18, 2.8),
    rect(8.5, 6, 7, 5.5, 1.2),
    path("M8.5 16.8h3M10 15.3v3"),
    circle(15.2, 16.9, 0.9, fill()),
  ] },

  /* the core pulses under the pins */
  cpu: {
    auto: false,
    dur: 1.6,
    parts: [
      rect(4.2, 4.2, 15.6, 15.6, 2.6),
      G("core", [
        rect(9, 9, 6, 6, 1.6),
        path("M13.6 10.4 10.4 13.6"),
      ]),
      path("M8.4 2.6v1.6M12 2.6v1.6M15.6 2.6v1.6M8.4 19.8v1.6M12 19.8v1.6M15.6 19.8v1.6M2.6 8.4h1.6M2.6 12h1.6M2.6 15.6h1.6M19.8 8.4h1.6M19.8 12h1.6M19.8 15.6h1.6"),
    ],
    sAnims: { core: POP(12, 12, 1.1) },
  },

  /* the charge bolt blips */
  "cpu-charge": {
    auto: false,
    dur: 1.6,
    parts: [
      rect(4.2, 4.2, 15.6, 15.6, 2.6),
      A(path("M12.9 8.4l-2.7 3.4c-.2.3 0 .7.4.7h1.7l-.8 2.9c-.1.4.4.7.7.4l2.7-3.4c.2-.3 0-.7-.4-.7h-1.7l.8-2.9c.1-.4-.4-.7-.7-.4z"), BLINK(0.3)),
      path("M8.4 2.6v1.6M12 2.6v1.6M15.6 2.6v1.6M8.4 19.8v1.6M12 19.8v1.6M15.6 19.8v1.6M2.6 8.4h1.6M2.6 12h1.6M2.6 15.6h1.6M19.8 8.4h1.6M19.8 12h1.6M19.8 15.6h1.6"),
    ],
  },

  "cpu-settings": {
    auto: false,
    parts: [
      /* chip opens its corner for the cog — no stroke runs under the badge */
      path("M11.3 15.4H7c-1.3 0-2.4-1.1-2.4-2.4V7c0-1.3 1.1-2.4 2.4-2.4h6c1.3 0 2.4 1.1 2.4 2.4v4.3"),
      path("M8 8.6h4"),
      path("M7.6 2.2v2.4M11 2.2v2.4M2.2 7.6h2.4M2.2 11h2.4"),
      G("turn", [...cog(17.8, 17.8, 0.9)]),
    ],
    gAnims: { turn: tn("rotate", ["0 17.8 17.8", "60 17.8 17.8"]) },
  },

  /* hard drive: platter + read arm; the activity LED blinks */
  drive: {
    auto: false,
    dur: 1.6,
    parts: [
      rect(3, 8, 18, 10, 2.2),
      circle(8.6, 13, 3.4),
      circle(8.6, 13, 1, fill()),
      path("M14.6 16.2l3-3"),
      A(circle(18, 10.8, 0.9, fill()), [an("opacity", ["1", "1", "0.2", "1", "1"], [0, 0.3, 0.42, 0.55, 1])]),
    ],
  },

  drone: {
    dur: 2.2,
    pp: false,
    auto: false,
    parts: [
      G("r1", [path("M8.5 5.6a2.9 2.9 0 1 0-2.9 2.9")]),
      G("r2", [path("M15.5 5.6a2.9 2.9 0 1 1 2.9 2.9")]),
      G("r3", [path("M5.6 15.5a2.9 2.9 0 1 0 2.9 2.9")]),
      G("r4", [path("M18.4 15.5a2.9 2.9 0 1 1-2.9 2.9")]),
      path("M9.6 9.6 7.6 7.6M14.4 9.6l1.8-2M9.6 14.4l-2 2M14.4 14.4l2 2"),
      rect(9.6, 9.6, 4.8, 4.8, 1.7),
      circle(12, 12, 0.9, fill()),
    ],
    gAnims: {
      r1: tn("rotate", ["0 5.6 5.6", "360 5.6 5.6"]),
      r2: tn("rotate", ["0 18.4 5.6", "360 18.4 5.6"]),
      r3: tn("rotate", ["0 5.6 18.4", "360 5.6 18.4"]),
      r4: tn("rotate", ["0 18.4 18.4", "360 18.4 18.4"]),
    },
  },

  /* ---------------- gamepads & joysticks ---------------- */

  /* the action buttons get mashed */
  gamepad: {
    auto: false,
    dur: 1.4,
    parts: [
      rect(2.6, 6.4, 18.8, 11.2, 5.6),
      path("M8 9.4v4.4M5.8 11.6h4.4"),
      A(circle(15.4, 13.2, 0.9, fill()), [an("r", ["0.9", "0.9", "0.4", "0.9", "0.9"], HOLD)]),
      A(circle(17.6, 10, 0.9, fill()), [an("r", ["0.9", "0.9", "0.4", "0.9", "0.9"], [0, 0.44, 0.56, 0.7, 1])]),
    ],
  },

  /* the d-pad dances clockwise */
  "gamepad-directional": {
    auto: false,
    dur: 1.6,
    parts: [
      A(path("M12 3.5c.4 0 .8.2 1 .5l2 2.3c.5.6.1 1.5-.8 1.5H9.8c-.9 0-1.3-.9-.8-1.5l2-2.3c.2-.3.6-.5 1-.5z"), [an("opacity", ["1", "1", "0.35", "1", "1"], [0, 0.05, 0.17, 0.3, 1])]),
      A(path("M12 20.5c-.4 0-.8-.2-1-.5l-2-2.3c-.5-.6-.1-1.5.8-1.5h4.4c.9 0 1.3.9.8 1.5l-2 2.3c-.2.3-.6.5-1 .5z"), [an("opacity", ["1", "1", "0.35", "1", "1"], [0, 0.29, 0.41, 0.54, 1])]),
      A(path("M3.5 12c0-.4.2-.8.5-1l2.3-2c.6-.5 1.5-.1 1.5.8v4.4c0 .9-.9 1.3-1.5.8l-2.3-2c-.3-.2-.5-.6-.5-1z"), [an("opacity", ["1", "1", "0.35", "1", "1"], [0, 0.41, 0.53, 0.66, 1])]),
      A(path("M20.5 12c0 .4-.2.8-.5 1l-2.3 2c-.6.5-1.5.1-1.5-.8V9.8c0-.9.9-1.3 1.5-.8l2.3 2c.3.2.5.6.5 1z"), [an("opacity", ["1", "1", "0.35", "1", "1"], [0, 0.17, 0.29, 0.42, 1])]),
      circle(12, 12, 0.9, fill()),
    ],
  },

  /* the action buttons get mashed */
  gamepad01: {
    auto: false,
    dur: 1.4,
    parts: [
      path("M7.2 5.8h9.6c3.3 0 4.9 4.3 5 8.4.1 2.9-1.6 5-3.8 5-1.6 0-2.6-1-3.2-2.2l-.5-.9c-.3-.6-.9-1-1.6-1h-1.4c-.7 0-1.3.4-1.6 1l-.5.9c-.6 1.2-1.6 2.2-3.2 2.2-2.2 0-3.9-2.1-3.8-5 .1-4.1 1.7-8.4 5-8.4z"),
      path("M8 8.8v4.2M5.9 10.9h4.2"),
      A(circle(15.4, 9.4, 0.85, fill()), [an("r", ["0.85", "0.85", "0.4", "0.85", "0.85"], HOLD)]),
      A(circle(17.4, 11.6, 0.85, fill()), [an("r", ["0.85", "0.85", "0.4", "0.85", "0.85"], [0, 0.44, 0.56, 0.7, 1])]),
    ],
  },

  /* the memory traces shimmer */
  gpu: {
    auto: false,
    dur: 1.7,
    parts: [
      rect(5.6, 5.4, 15.6, 13.4, 2.4),
      path("M4.4 20.6V5.4c0-.8-.6-1.4-1.4-1.4H2.6"),
      circle(16.6, 12, 3),
      circle(16.6, 12, 0.8, fill()),
      A(path("M8 9.4h2M8 12h2M8 14.6h2"), BLINK(0.4)),
    ],
  },

  /* the stick tilts on its base */
    "joystick01": { dur: 1.6,
    auto: false,
    parts: [
    G("tilt", [
      path("M11.5 14.21L11.5 7.01"),
      path("M9.3 7.01L13.7 7.01C14.5 7.01 15.1 6.41 15.1 5.61S14.5 4.21 13.7 4.21L9.3 4.21C8.5 4.21 7.9 4.81 7.9 5.61S8.5 7.01 9.3 7.01Z"),
    ]),
    path("M6.1 19.41L16.9 19.41C17.9 19.41 18.6 18.51 18.3 17.61L17.4 15.41C17.1 14.71 16.4 14.21 15.6 14.21L8.4 14.21C7.6 14.21 6.9 14.71 6.6 15.41L5.7 17.61C5.4 18.51 6.1 19.41 7.1 19.41Z"),
  ],
    gAnims: { tilt: tn("rotate", ["0 11.5 14.21", "-8 11.5 14.21", "8 11.5 14.21", "0 11.5 14.21"], [0, 0.3, 0.65, 1]) } },

  joystick02: {
    auto: false,
    parts: [
      G("tilt", [
        circle(12, 5.6, 2.9),
        line(12, 8.5, 12, 14),
      ]),
      path("M8.2 15.2h7.6c.8 0 1.5.5 1.7 1.3l1.1 3.4c.3 1-.5 1.9-1.5 1.9H6.9c-1 0-1.8-.9-1.5-1.9l1.1-3.4c.2-.8.9-1.3 1.7-1.3z"),
      circle(15.4, 19.4, 0.8, fill()),
    ],
    gAnims: { tilt: tn("rotate", ["0 12 14.5", "-8 12 14.5", "8 12 14.5", "0 12 14.5"], [0, 0.3, 0.65, 1]) },
  },

  joystick03: {
    auto: false,
    parts: [
      G("tilt", [
        circle(7.6, 5.8, 2.8),
        line(7.6, 8.6, 7.6, 15.4),
      ]),
      rect(3.4, 15.4, 17.2, 5, 1.8),
      circle(16.4, 17.9, 1, fill()),
    ],
    gAnims: { tilt: tn("rotate", ["0 7.6 15.4", "-8 7.6 15.4", "8 7.6 15.4", "0 7.6 15.4"], [0, 0.3, 0.65, 1]) },
  },

  joystick04: {
    auto: false,
    parts: [
      G("tilt", [
        circle(12, 5.2, 2.9),
        line(12, 8.1, 12, 16),
      ]),
      ellipse(12, 14.4, 5.4, 1.8),
      path("M5.6 18.2v1c0 1.6 2.9 2.8 6.4 2.8s6.4-1.2 6.4-2.8v-1"),
      ellipse(12, 18.2, 6.4, 1.7),
    ],
    gAnims: { tilt: tn("rotate", ["0 12 14.5", "-7 12 14.5", "7 12 14.5", "0 12 14.5"], [0, 0.3, 0.65, 1]) },
  },

  joystick05: {
    auto: false,
    parts: [
      G("tilt", [
        circle(12, 5.4, 3),
        line(12, 8.4, 12, 14.2),
      ]),
      path("M6.8 21.6h10.4c1.2 0 2-1 1.7-2.1l-1.5-4.2c-.3-.9-1.2-1.5-2.2-1.5H9c-1 0-1.9.6-2.2 1.5l-1.5 4.2c-.3 1.1.5 2.1 1.5 2.1z"),
      line(10.2, 18.6, 13.8, 18.6),
    ],
    gAnims: { tilt: tn("rotate", ["0 12 15.5", "-8 12 15.5", "8 12 15.5", "0 12 15.5"], [0, 0.3, 0.65, 1]) },
  },

  /* ---------------- laptop family ---------------- */

  /* the deck LED blinks */
  laptop: {
    auto: false,
    dur: 1.7,
    parts: [
      ...LAPTOP,
      A(line(10.6, 18.5, 13.4, 18.5), BLINK(0.25)),
    ],
  },

  /* the plus pops on screen */
  "laptop-add": {
    auto: false,
    dur: 1.5,
    parts: [
      ...LAPTOP,
      G("plus", [path("M12 7.8v5M9.5 10.3h5")]),
    ],
    sAnims: { plus: POP(12, 10.3, 1.18) },
  },

  /* the charge bolt blips */
  "laptop-charging": {
    auto: false,
    dur: 1.6,
    parts: [
      ...LAPTOP,
      A(path("M13 7.4 10.4 11h2.2l-1.4 3.6L14 11h-2.2z"), BLINK(0.3)),
    ],
  },

  /* the check writes itself on */
  "laptop-check": {
    auto: false,
    dur: 1.7,
    parts: [
      ...LAPTOP,
      DRAW(path("M9.4 10.8l2 2 3.4-4"), 0.18, 0.55),
    ],
  },

  /* the cloud floats on screen */
  "laptop-cloud": {
    auto: false,
    dur: 1.8,
    parts: [
      ...LAPTOP,
      SHIFT(path("M9.3 13.6c-1.3 0-2.3-1-2.3-2.2 0-1.1.8-2 1.9-2.2.3-1.3 1.5-2.3 2.9-2.3 1.5 0 2.7 1 2.9 2.4 1 .2 1.7 1 1.7 2 0 1.2-.9 2.1-2 2.1z"), 0, -0.8),
    ],
  },

  /* the bang thumps */
  "laptop-issue": {
    auto: false,
    dur: 1.5,
    parts: [
      ...LAPTOP,
      G("warn", [line(12, 7.4, 12, 10.8), circle(12, 13.1, 0.9, fill())]),
    ],
    sAnims: { warn: POP(12, 10.8, 1.15) },
  },

  /* the lid breathes open */
  "laptop-minimal": {
    auto: false,
    dur: 1.7,
    parts: [
      SHIFT(path("M4.8 18.6V7.4c0-1.6 1.3-2.9 2.9-2.9h8.6c1.6 0 2.9 1.3 2.9 2.9v11.2"), 0, -0.8),
      rect(2.6, 17.6, 18.8, 3, 1.5),
    ],
  },

  /* the check writes itself on */
  "laptop-minimal-check": {
    auto: false,
    dur: 1.7,
    parts: [
      path("M4.8 18.6V7.4c0-1.6 1.3-2.9 2.9-2.9h8.6c1.6 0 2.9 1.3 2.9 2.9v11.2"),
      rect(2.6, 17.6, 18.8, 3, 1.5),
      DRAW(path("M9.4 11l2 2 3.4-4"), 0.18, 0.55),
    ],
  },

  /* the perf trace draws itself on */
  "laptop-performance": {
    auto: false,
    dur: 1.8,
    parts: [
      ...LAPTOP,
      DRAW(path("M7.4 10.8h2.2l1.5-2.8 2.2 5 1.4-2.2h1.9"), 0.12, 0.6),
    ],
  },

  /* the phone docks in toward the laptop */
  "laptop-phone-sync": {
    auto: false,
    dur: 1.6,
    parts: [
      path("M4.4 16.4V7c0-1.6 1.3-2.8 2.8-2.8h9c1.2 0 2.3.8 2.6 2"),
      path("M3.6 20.4h10.4c.7 0 1.2-.8.8-1.5l-1.5-2.5H4.4l-1.6 2.5c-.4.7.1 1.5.8 1.5z"),
      G("phone", [rect(15.4, 10.8, 5.4, 9.6, 1.8), line(17.2, 18.9, 18.8, 18.9)]),
    ],
    gAnims: { phone: DIP(-0.9, 0) },
  },

  /* the brackets pinch in around the caret */
  "laptop-programming": {
    auto: false,
    dur: 1.6,
    parts: [
      ...LAPTOP,
      SHIFT(path("M9.2 8.4 7.6 10l1.6 1.6"), 0.7, 0),
      SHIFT(path("M14.8 8.4l1.6 1.6-1.6 1.6"), -0.7, 0),
      line(12.7, 7.8, 11.3, 13),
    ],
  },

  /* the x shakes "no" */
  "laptop-remove": {
    auto: false,
    dur: 1.6,
    parts: [
      ...LAPTOP,
      G("x", [path("M10.2 8.6l3.6 3.6"), path("M13.8 8.6l-3.6 3.6")]),
    ],
    gAnims: { x: WIG(12, 10.4, 10) },
  },

  "laptop-settings": {
    auto: false,
    parts: [
      ...LAPTOP,
      G("turn", [
        ...cog(12, 10.2, 0.8),
      ]),
    ],
    gAnims: { turn: tn("rotate", ["0 12 10.2", "60 12 10.2"]) },
  },

  /* the play glyph pulses */
  "laptop-video": {
    auto: false,
    dur: 1.4,
    parts: [
      ...LAPTOP,
      G("play", [path("M10.9 8.4l3.3 2c.4.3.4.8 0 1.1l-3.3 2c-.4.3-.9 0-.9-.5V9c0-.5.5-.8.9-.6z")]),
    ],
    sAnims: { play: POP(12.2, 10.4, 1.16) },
  },

  /* ---------------- stick & monitor family ---------------- */

  /* the stick slides into its port */
  "memory-stick": {
    auto: false,
    dur: 1.6,
    parts: [
      G("stick", [
        path("M4.8 5.4h14.4c1.1 0 2 .9 2 2v1.9c-1.1 0-2 .9-2 2s.9 2 2 2v1.9c0 1.1-.9 2-2 2H4.8c-1.1 0-2-.9-2-2v-1.9c1.1 0 2-.9 2-2s-.9-2-2-2V7.4c0-1.1.9-2 2-2z"),
        path("M8.8 8.4v5.6M12 8.4v5.6M15.2 8.4v5.6"),
        path("M6.2 17.4v2.4M9.1 17.4v2.4M12 17.4v2.4M14.9 17.4v2.4M17.8 17.4v2.4"),
      ]),
    ],
    gAnims: { stick: DIP(1.3, 0) },
  },

  /* the check writes itself on */
  "monitor-check": {
    auto: false,
    dur: 1.7,
    parts: [
      ...MONITOR,
      DRAW(path("M9.2 10.6l2.2 2.2 3.8-4.4"), 0.18, 0.55),
    ],
  },

  /* the cloud floats on screen */
  "monitor-cloud": {
    auto: false,
    dur: 1.8,
    parts: [
      ...MONITOR,
      SHIFT(path("M8.8 13.6c-1.4 0-2.5-1-2.5-2.4 0-1.2.9-2.2 2-2.4.4-1.4 1.6-2.4 3.1-2.4 1.6 0 2.9 1.1 3.1 2.6 1 .2 1.8 1.1 1.8 2.2 0 1.3-1 2.4-2.2 2.4z"), 0, -0.8),
    ],
  },

  "monitor-cog": {
    auto: false,
    parts: [
      ...MONITOR,
      G("turn", [
        ...cog(12, 10.3, 0.92),
      ]),
    ],
    gAnims: { turn: tn("rotate", ["0 12 10.3", "60 12 10.3"]) },
  },
};
