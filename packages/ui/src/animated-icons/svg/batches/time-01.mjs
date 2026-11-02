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

/** Scalloped bloom — same construction as the canon settings gear. */
function flowerPath(cx, cy, lobes, rMid, amp, steps = 14) {
  const pts = [];
  for (let i = 0; i < lobes * steps; i++) {
    const t = (i / (lobes * steps)) * Math.PI * 2;
    const r = rMid + amp * Math.cos(lobes * t + Math.PI / 2);
    pts.push(`${(cx + r * Math.cos(t)).toFixed(2)} ${(cy + r * Math.sin(t)).toFixed(2)}`);
  }
  return `M${pts.join("L")}Z`;
}

/* The canon calendar silhouette, reused so the whole family reads as kin. */
const CAL = "M5.6 5.4h12.8c1.5 0 2.7 1.2 2.7 2.7v9.8c0 1.5-1.2 2.7-2.7 2.7H5.6c-1.5 0-2.7-1.2-2.7-2.7V8.1c0-1.5 1.2-2.7 2.7-2.7z";
/* Corner-open variant: bottom-right quadrant left free for a badge. */
const CAL_OPEN = "M21.1 13.4V8.1c0-1.5-1.2-2.7-2.7-2.7H5.6c-1.5 0-2.7 1.2-2.7 2.7v9.8c0 1.5 1.2 2.7 2.7 2.7h7.9";
const POSTS = "M8.2 3.6v4M15.8 3.6v4";
const cal = (body = CAL) => [path(body), path(POSTS), line(2.9, 9.8, 21.1, 9.8)];

const EARS = "M4.8 3.1c-.9.8-1.7 1.7-2.3 2.7M19.2 3.1c.9.8 1.7 1.7 2.3 2.7";
const LEGS = "M6.6 18.4l-2 2.5M17.4 18.4l2 2.5";
const alarm = (inner) => [circle(12, 12.6, 7.5), path(EARS), path(LEGS), inner];

/* ---- bespoke gesture idioms -------------------------------------------
   HOLD phrasing: rest ~30%, act mid-cycle, settle back. Seamless loops. */
const HOLD = [0, 0.3, 0.55, 0.8, 1];
const POP = (cx, cy, s = 1.24) => ({
  pivot: [cx, cy],
  anim: tn("scale", ["1", "1", `${s}`, "1", "1"], HOLD),
});
const WIG = (cx, cy, a = 9) =>
  tn("rotate", [`0 ${cx} ${cy}`, `0 ${cx} ${cy}`, `-${a} ${cx} ${cy}`, `${a - 2} ${cx} ${cy}`, `0 ${cx} ${cy}`], HOLD);
const DIP = (dx, dy) => tn("translate", ["0 0", "0 0", `${dx} ${dy}`, "0 0", "0 0"], HOLD);
const BLINK = (lo = 0.2) => [an("opacity", ["1", "1", `${lo}`, "1", "1"], [0, 0.32, 0.46, 0.6, 1])];
/* trace — the stroke writes itself on; pathLength=1 normalizes. */
const DRAW = (p, t0 = 0.15, t1 = 0.62) =>
  A({ ...p, a: { ...p.a, pathLength: 1, "stroke-dasharray": 1 } },
    [an("stroke-dashoffset", ["1", "1", "0", "0"], [0, t0, t1, 1])]);
/* same trick for <line> parts — pathLength is path-only, so length is explicit. */
const DRAWLINE = (x1, y1, x2, y2, t0 = 0.2, t1 = 0.72) => {
  const len = +Math.hypot(x2 - x1, y2 - y1).toFixed(1);
  return A(line(x1, y1, x2, y2, { "stroke-dasharray": len }),
    [an("stroke-dashoffset", [`${len}`, `${len}`, "0", "0"], [0, t0, t1, 1])]);
};
/* the alarm rings — the whole clock rocks on its feet */
const RING = tn("rotate", ["0 12 20.9", "0 12 20.9", "-6 12 20.9", "5 12 20.9", "0 12 20.9"], HOLD);
const ringAlarm = (inner) => [
  G("ring", [circle(12, 12.6, 7.5), path(EARS), path(LEGS)]),
  inner,
];
/* clock hands tick — four discrete quarter-steps per loop (needs pp:false) */
const TICK4 = (cx, cy) =>
  tn("rotate",
    [0, 0, 90, 90, 180, 180, 270, 270, 360].map((a) => `${a} ${cx} ${cy}`),
    [0, 0.2, 0.2, 0.4, 0.4, 0.6, 0.6, 0.8, 1]);

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
  "alarm-clock": {
    pp: false,
    parts: [
      circle(12, 12.6, 7.5),
      path(EARS),
      path(LEGS),
      G("wind", [path("M12 8.8v3.9l2.6 1.7")]),
    ],
    gAnims: { wind: tn("rotate", ["0 12 12.6", "360 12 12.6"]) },
  },

  "alarm-clock-check": {
    dur: 1.5,
    auto: false,
    parts: ringAlarm(DRAW(path("M8.7 12.9c.8.8 1.6 1.6 2.4 2.4 1.5-1.8 3.1-3.6 4.8-4.9"))),
    gAnims: { ring: RING },
  },

  "alarm-clock-minus": {
    dur: 1.5,
    auto: false,
    parts: ringAlarm(A(line(9.3, 12.6, 14.7, 12.6), BLINK())),
    gAnims: { ring: RING },
  },

  "alarm-clock-off": {
    dur: 1.5,
    auto: false,
    parts: alarm(DRAWLINE(5.2, 4.6, 19.6, 20.2)),
  },

  "alarm-clock-plus": {
    dur: 1.35,
    auto: false,
    parts: ringAlarm(G("pop", [path("M12 9.6v6M9 12.6h6")])),
    gAnims: { ring: RING },
    sAnims: { pop: POP(12, 12.6, 1.2) },
  },

  "alarm-smoke": {
    parts: [
      /* ceiling-mounted detector disc; smoke wisps rise toward it */
      path("M4.6 8.6V7.2c0-1.7 1.4-3.1 3.1-3.1h8.6c1.7 0 3.1 1.4 3.1 3.1v1.4c0 .8-.7 1.5-1.5 1.5H6.1c-.8 0-1.5-.7-1.5-1.5z"),
      circle(12, 7.4, 1.1, fill()),
      G("wisps", [
        path("M7.6 13c-.6 1.2-.6 2.4 0 3.6s.6 2.4 0 3.6"),
        path("M12 13c-.6 1.2-.6 2.4 0 3.6s.6 2.4 0 3.6"),
        path("M16.4 13c-.6 1.2-.6 2.4 0 3.6s.6 2.4 0 3.6"),
      ]),
    ],
    auto: false,
    dur: 1.6,
    gAnims: {
      wisps: tn("rotate", ["0 12 14.5", "0 12 14.5", "-6 12 14.5", "5 12 14.5", "0 12 14.5"], HOLD),
    },
  },

  "calendar-add01": {
    parts: [...cal(CAL_OPEN), G("pop", [path("M17.2 14.8v6M14.2 17.8h6")])],
    sAnims: { pop: POP(17.2, 17.8) },
    auto: false,
    dur: 1.25,
  },

  "calendar-add02": {
    parts: [...cal(), G("pop", [path("M12 13v5.4M9.3 15.7h5.4")])],
    sAnims: { pop: POP(12, 15.7) },
    auto: false,
    dur: 1.25,
  },

  "calendar-analysis": {
    parts: [...cal(), DRAW(path("M7.2 18l2.6-2.8c.5-.5 1.3-.5 1.7.1l.9 1.2c.4.6 1.2.6 1.7.1l2.7-2.9"), 0.2, 0.7)],
    auto: false,
    dur: 1.6,
  },

  "calendar-arrow-down": {
    parts: [
      ...cal(CAL_OPEN),
      G("arrow", [line(17.2, 14.4, 17.2, 20.2), path("M14.8 17.6l2.4 2.6 2.4-2.6")]),
    ],
    gAnims: { arrow: DIP(0, 1.4) },
    auto: false,
    dur: 1.4,
  },

  "calendar-arrow-up": {
    parts: [
      ...cal(CAL_OPEN),
      G("arrow", [line(17.2, 20.8, 17.2, 15), path("M14.8 17.4l2.4-2.6 2.4 2.6")]),
    ],
    gAnims: { arrow: DIP(0, -1.4) },
    auto: false,
    dur: 1.4,
  },

  "calendar-block01": {
    parts: [
      ...cal(CAL_OPEN),
      G("deny", [circle(17.2, 17.6, 3.4), line(15, 19.8, 19.4, 15.4)]),
    ],
    gAnims: { deny: WIG(17.2, 17.6, 9) },
    auto: false,
    dur: 1.4,
  },

  "calendar-block02": {
    parts: [
      ...cal(),
      G("deny", [circle(12, 15.9, 2.9), line(10.1, 17.8, 13.9, 14)]),
    ],
    gAnims: { deny: WIG(12, 15.9, 9) },
    auto: false,
    dur: 1.4,
  },

  "calendar-check": {
    parts: [...cal(), DRAW(path("M8.4 15.7c.9.9 1.7 1.8 2.5 2.7 1.7-2 3.4-4 5.3-5.5"))],
    auto: false,
    dur: 1.5,
  },

  "calendar-check-in01": {
    parts: [
      ...cal(CAL_OPEN),
      G("in", [line(14.6, 19, 20.6, 19), path("M17.2 16.7c-.9.8-1.8 1.6-2.6 2.3.8.7 1.7 1.5 2.6 2.3")]),
    ],
    gAnims: { in: DIP(-1.2, 0) },
    auto: false,
    dur: 1.4,
  },

  "calendar-check-in02": {
    parts: [
      ...cal(),
      G("in", [line(9.9, 16, 15.8, 16), path("M12.5 13.7c-.8.8-1.7 1.5-2.6 2.3.9.8 1.8 1.5 2.6 2.3")]),
    ],
    gAnims: { in: DIP(-1.2, 0) },
    auto: false,
    dur: 1.4,
  },

  "calendar-check-out01": {
    parts: [
      ...cal(CAL_OPEN),
      G("out", [line(14.4, 19, 19.7, 19), path("M17.4 16.7c.9.8 1.8 1.6 2.6 2.3-.8.7-1.7 1.5-2.6 2.3")]),
    ],
    gAnims: { out: DIP(1.2, 0) },
    auto: false,
    dur: 1.4,
  },

  "calendar-check-out02": {
    parts: [
      ...cal(),
      G("out", [line(8.4, 16, 14.1, 16), path("M11.5 13.7c.8.8 1.7 1.5 2.6 2.3-.9.8-1.8 1.5-2.6 2.3")]),
    ],
    gAnims: { out: DIP(1.2, 0) },
    auto: false,
    dur: 1.4,
  },

  "calendar-check01": {
    parts: [...cal(CAL_OPEN), DRAW(path("M14.6 18.6c.7.7 1.4 1.4 2 2.2 1.5-1.8 3-3.6 4.6-4.8"))],
    auto: false,
    dur: 1.5,
  },

  "calendar-clock": {
    pp: false,
    parts: [
      ...cal(CAL_OPEN),
      circle(17, 17.3, 3.6),
      G("wind", [path("M17 15.2v2.2l1.5 1")]),
    ],
    gAnims: { wind: tn("rotate", ["0 17 17.3", "360 17 17.3"]) },
  },

  "calendar-cog": {
    parts: [
      ...cal("M21.1 11.7V8.1c0-1.5-1.2-2.7-2.7-2.7H5.6c-1.5 0-2.7 1.2-2.7 2.7v9.8c0 1.5 1.2 2.7 2.7 2.7h5.9"),
      G("turn", cog(17.6, 17.6, 0.9)),
    ],
    gAnims: { turn: tn("rotate", ["0 17.6 17.6", "60 17.6 17.6"]) },
  },

  /* the date digit pops into place */
  "calendar-date-one": {
    dur: 1.35,
    auto: false,
    parts: [...cal(), G("pop", [path("M10.9 14l1.7-1v5.5M10.3 18.6h3.4")])],
    sAnims: { pop: POP(12, 16, 1.14) },
  },

  "calendar-date1": {
    dur: 1.35,
    auto: false,
    parts: [...cal(), G("pop", [path("M10.9 14l1.7-1v5.5M10.3 18.6h3.4")])],
    sAnims: { pop: POP(12, 16, 1.14) },
  },

  "calendar-days": {
    parts: [
      ...cal(),
      A(path("M7.8 13.9h.01M12 13.9h.01M16.2 13.9h.01M7.8 17.9h.01M12 17.9h.01"), BLINK(0.4)),
    ],
    auto: false,
    dur: 1.6,
  },

  "calendar-download01": {
    parts: [
      ...cal(CAL_OPEN),
      G("arrow", [line(17.2, 14.4, 17.2, 20), path("M14.6 18.2c.9.8 1.7 1.6 2.6 2.2.9-.6 1.7-1.4 2.6-2.2")]),
    ],
    gAnims: { arrow: DIP(0, 1.3) },
    auto: false,
    dur: 1.4,
  },

  "calendar-download02": {
    parts: [
      ...cal(),
      G("arrow", [line(12, 13, 12, 17.9), path("M9.5 15.9c.9.8 1.7 1.6 2.5 2.3.8-.7 1.6-1.5 2.5-2.3")]),
    ],
    gAnims: { arrow: DIP(0, 1.3) },
    auto: false,
    dur: 1.4,
  },

  "calendar-favorite01": {
    /* the star twirls as it pops */
    parts: [
      ...cal(CAL_OPEN),
      G("star", [path("M17.2 14.3l.9 1.9c.1.2.3.4.5.4l2.1.3-1.6 1.4c-.2.2-.2.4-.2.6l.5 2-1.9-1c-.2-.1-.4-.1-.6 0l-1.9 1 .5-2c.1-.2 0-.5-.2-.6l-1.6-1.4 2.1-.3c.2 0 .4-.2.5-.4z")]),
    ],
    sAnims: {
      star: {
        pivot: [17.2, 17.4],
        anim: tn("scale", ["1", "1", "1.24", "1", "1"], HOLD),
        extra: tn("rotate", ["0", "0", "-20", "0", "0"], HOLD),
      },
    },
    auto: false,
    dur: 1.35,
  },

  "calendar-favorite02": {
    parts: [
      ...cal(),
      G("star", [path("M12 12.9l.9 1.9c.1.2.3.4.5.4l2.1.3-1.6 1.4c-.2.2-.2.4-.2.6l.5 2-1.9-1c-.2-.1-.4-.1-.6 0l-1.9 1 .5-2c.1-.2 0-.5-.2-.6l-1.6-1.4 2.1-.3c.2 0 .4-.2.5-.4z")]),
    ],
    sAnims: {
      star: {
        pivot: [12, 16],
        anim: tn("scale", ["1", "1", "1.24", "1", "1"], HOLD),
        extra: tn("rotate", ["0", "0", "-20", "0", "0"], HOLD),
      },
    },
    auto: false,
    dur: 1.35,
  },

  "calendar-fold": {
    parts: [
      path("M5.6 5.4h12.8c1.5 0 2.7 1.2 2.7 2.7v6.4l-6 6H5.6c-1.5 0-2.7-1.2-2.7-2.7V8.1c0-1.5 1.2-2.7 2.7-2.7z"),
      path(POSTS),
      line(2.9, 9.8, 21.1, 9.8),
      G("peel", [path("M15.3 20.5c.1-1.9.4-2.9 1.1-3.6.7-.7 1.7-1.2 3.5-1.3")]),
    ],
    auto: false,
    dur: 1.5,
    gAnims: { peel: DIP(-0.9, -0.9) },
  },

  "calendar-heart": {
    parts: [
      ...cal(CAL_OPEN),
      G("heart", [path("M17.2 20.5s-3.5-2.3-4.1-4.5c-.5-1.7.7-2.9 2-2.9.9 0 1.6.5 2.1 1.2.5-.7 1.2-1.2 2.1-1.2 1.3 0 2.5 1.2 2 2.9-.6 2.2-4.1 4.5-4.1 4.5z")]),
    ],
    sAnims: { heart: POP(17.2, 16.8, 1.2) },
    auto: false,
    dur: 1.35,
  },

  "calendar-lock01": {
    parts: [
      ...cal(CAL_OPEN),
      A(path("M15.6 16.6v-1.1c0-1 .8-1.8 1.7-1.8s1.7.8 1.7 1.8v1.1"), [
        tn("translate", ["0 0", "0 0", "0 -0.9", "0 0", "0 0"], HOLD),
      ]),
      path("M14.7 16.6h5.2c.7 0 1.3.6 1.3 1.3v2.4c0 .7-.6 1.3-1.3 1.3h-5.2c-.7 0-1.3-.6-1.3-1.3v-2.4c0-.7.6-1.3 1.3-1.3z"),
      circle(17.3, 18.4, 0.75, fill()),
    ],
    auto: false,
    dur: 1.5,
  },

  "calendar-lock02": {
    parts: [
      ...cal(),
      A(path("M10.8 15.3v-.9c0-.7.5-1.3 1.2-1.3s1.2.6 1.2 1.3v.9"), [
        tn("translate", ["0 0", "0 0", "0 -0.8", "0 0", "0 0"], HOLD),
      ]),
      rect(9.6, 15.3, 4.8, 4, 1.2),
    ],
    auto: false,
    dur: 1.5,
  },

  "calendar-love01": {
    parts: [
      ...cal(CAL_OPEN),
      G("heart", [path("M17.4 21.1s-3.9-2.5-4.4-4.9c-.4-1.9.8-3 2.1-3 .9 0 1.7.5 2.2 1.3.5-.8 1.3-1.3 2.2-1.3 1.3 0 2.4 1.1 2 3-.5 2.4-4.1 4.9-4.1 4.9z")]),
    ],
    sAnims: { heart: POP(17.3, 17.4, 1.2) },
    auto: false,
    dur: 1.35,
  },

  "calendar-love02": {
    parts: [
      ...cal(),
      G("heart", [path("M12 19.2s-3-1.9-3.5-3.8c-.4-1.4.6-2.4 1.7-2.4.7 0 1.4.4 1.8 1 .4-.6 1.1-1 1.8-1 1.1 0 2.1 1 1.7 2.4-.5 1.9-3.5 3.8-3.5 3.8z")]),
    ],
    sAnims: { heart: POP(12, 15.9, 1.2) },
    auto: false,
    dur: 1.35,
  },

  "calendar-minus": {
    parts: [...cal(), A(line(9.4, 16, 14.6, 16), BLINK())],
    auto: false,
    dur: 1.4,
  },

  "calendar-minus01": {
    dur: 1.4,
    auto: false,
    parts: [...cal(CAL_OPEN), A(line(14.4, 17.8, 20, 17.8), BLINK())],
  },

  "calendar-minus02": {
    dur: 1.4,
    auto: false,
    parts: [...cal(), A(line(9.4, 16, 14.6, 16), BLINK())],
  },

  "calendar-mortarboard": {
    parts: [
      ...cal(CAL_OPEN),
      G("cap", [path("M17 14.6c.2 0 .4 0 .6.1l3.2 1.4c.3.1.3.6 0 .8l-3.2 1.4c-.2.1-.4.1-.6.1s-.4 0-.6-.1l-3.2-1.4c-.3-.1-.3-.6 0-.8l3.2-1.4c.2-.1.4-.1.6-.1z")]),
      path("M15.1 18.3v1.3c0 .5.3.9.8 1.1.8.3 1.5.3 2.3 0 .5-.2.8-.6.8-1.1v-1.3"),
      G("tassel", [line(20.9, 16.4, 20.9, 19.4)]),
    ],
    auto: false,
    dur: 1.5,
    gAnims: {
      cap: WIG(17, 15.8, 8),
      tassel: tn("rotate", ["0 20.9 16.4", "0 20.9 16.4", "-8 20.9 16.4", "7 20.9 16.4", "0 20.9 16.4"], HOLD),
    },
  },

  "calendar-off": {
    parts: [...cal(), DRAWLINE(4.6, 4.6, 19.4, 19.4)],
    auto: false,
    dur: 1.5,
  },

  "calendar-plus": {
    parts: [...cal(CAL_OPEN), G("pop", [path("M17.2 14.9v5.8M14.3 17.8h5.8")])],
    sAnims: { pop: POP(17.2, 17.8) },
    auto: false,
    dur: 1.25,
  },

  "calendar-plus01": {
    parts: [...cal(), G("pop", [path("M12 13.4v5.2M9.4 16h5.2")])],
    sAnims: { pop: POP(12, 16) },
    auto: false,
    dur: 1.25,
  },

  "calendar01": {
    dur: 1.35,
    auto: false,
    parts: [...cal(), G("pop", [path("M11 14l1.7-1v5.5M10.4 18.5h3.4")])],
    sAnims: { pop: POP(12, 16, 1.14) },
  },

  "calendar02": {
    parts: [
      ...cal(),
      path("M8.2 14h7.4M8.2 17.6h4.8"),
      A(circle(15.4, 17.6, 0.9, fill()), [an("r", ["0.9", "0.9", "1.5", "0.9", "0.9"], HOLD)]),
    ],
    auto: false,
    dur: 1.5,
  },

  "calendar03": {
    parts: [
      ...cal(),
      A(circle(7.8, 13.9, 1), [an("r", ["1", "1", "1.5", "1", "1"], [0, 0.04, 0.2, 0.38, 1])]),
      A(circle(12, 13.9, 1), [an("r", ["1", "1", "1.5", "1", "1"], [0, 0.13, 0.29, 0.47, 1])]),
      A(circle(16.2, 13.9, 1), [an("r", ["1", "1", "1.5", "1", "1"], [0, 0.22, 0.38, 0.56, 1])]),
      A(circle(7.8, 17.9, 1), [an("r", ["1", "1", "1.5", "1", "1"], [0, 0.31, 0.47, 0.65, 1])]),
      A(circle(12, 17.9, 1), [an("r", ["1", "1", "1.5", "1", "1"], [0, 0.4, 0.56, 0.74, 1])]),
    ],
    auto: false,
    dur: 1.8,
  },

  /* the blank calendar settles like a stamp */
  "calendar04": {
    dur: 1.6,
    auto: false,
    parts: [G("settle", cal())],
    gAnims: { settle: tn("translate", ["0 0", "0 0", "0 0.7", "0 -0.25", "0 0"], HOLD) },
  },

  /* the mini clock ticks in quarter-steps */
  "calendar05": {
    dur: 1.9,
    auto: false,
    pp: false,
    parts: [
      ...cal(),
      circle(14.6, 16, 2.8),
      G("tick", [path("M14.6 14.4v1.7l1.3.9")]),
    ],
    gAnims: { tick: TICK4(14.6, 16) },
  },
};
