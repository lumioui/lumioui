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

/* gesture recipes — one signature verb per icon; pose(t=0) = pose(t=1).
 * draw: stroke traces on (checks, x, slash); FALL: drop slides down and
 * resets while invisible (needs pp:false); pop: pivot scale via sAnims. */
const DO = { pathLength: 1, "stroke-dasharray": 1 };
const draw = (a = 0.12, b = 0.7) => [an("stroke-dashoffset", ["1", "1", "0"], [0, a, b])];
const FALL = (dy = 1.7, dx = 0) => [
  tn("translate", [`${dx} ${-dy}`, `${dx} ${-dy}`, `${-dx} ${dy}`, `${dx} ${-dy}`], [0, 0.1, 0.7, 1]),
  an("opacity", ["0", "0", "1", "1", "0", "0"], [0, 0.1, 0.25, 0.55, 0.68, 1]),
];
const popAt = (px, py, s = 1.22) => ({
  pivot: [px, py],
  anim: tn("scale", ["1", "1", String(s), "1", "1"], [0, 0.3, 0.5, 0.7, 1]),
});

/* Shared silhouettes — one soft continuous puff per cloud size. */
const CLOUD =
  "M6.9 16.2c-2.3 0-4.1-1.7-4.1-3.9 0-1.9 1.4-3.5 3.3-3.8.5-2.7 2.8-4.7 5.5-4.7 2.4 0 4.4 1.7 4.9 4 .2-.1.5-.1.8-.1 2.4 0 4.2 1.8 4.2 4.1 0 2.4-2 4.4-4.4 4.4H6.9z";
const CLOUD_SM =
  "M7.2 13.9c-2 0-3.6-1.5-3.6-3.4 0-1.7 1.2-3 2.9-3.3.4-2.4 2.4-4.2 4.9-4.2 2.1 0 3.9 1.5 4.4 3.5.2 0 .5-.1.7-.1 2.1 0 3.7 1.6 3.7 3.6 0 2.1-1.7 3.9-3.9 3.9H7.2z";
const CLOUD_LG =
  "M6.7 18c-2.4 0-4.2-1.9-4.2-4.3 0-2.1 1.5-3.9 3.6-4.2.5-2.9 2.9-5 5.8-5 2.5 0 4.6 1.8 5.2 4.3.2-.1.5-.1.8-.1 2.5 0 4.4 1.9 4.4 4.3 0 2.6-2 4.7-4.6 4.7H6.7z";

/* Cylinder body + lid for the database family. */
const DB_BODY =
  "M4.8 5.4v12.6c0 1.6 3.2 2.9 7.2 2.9s7.2-1.3 7.2-2.9V5.4";
const DB_MID = "M4.8 11.9c0 1.6 3.2 2.9 7.2 2.9s7.2-1.3 7.2-2.9";
/* Smaller left-shifted cylinder for badged variants. */
const DB_BODY_SM =
  "M3.9 5.2v12.9c0 1.5 2.8 2.7 6.2 2.7h.8M16.5 5.2v6.6";
const DB_MID_SM = "M3.9 11.7c0 1.5 2.8 2.7 6.2 2.7h1.4";

/* Back page of the copy family: top-left square peeking out. */
const COPY_BACK =
  "M8.4 15.6H6.9c-1.5 0-2.7-1.2-2.7-2.7V6.9c0-1.5 1.2-2.7 2.7-2.7h6c1.5 0 2.7 1.2 2.7 2.7v1.5";

export const icons = {
  /* ============================ CLOUD ============================ */

    "cloud": { dur: 1.9,
    auto: false,
    parts: [
    G("drift", [
      path("M6.4 18C4 18 2.2 16.1 2.2 13.7C2.2 11.6 3.7 9.8 5.8 9.5C6.3 6.6 8.7 4.5 11.6 4.5C14.1 4.5 16.2 6.3 16.8 8.8C17 8.7 17.3 8.7 17.6 8.7C20.1 8.7 22 10.6 22 13C22 15.6 20 17.7 17.4 17.7L6.4 17.7Z"),
      circle(15.6, 8.1, 0.9, { fill: "currentColor", stroke: "none" }),
    ]),
  ],
    gAnims: { drift: tn("translate", ["0 0", "0 -1.3", "0 0"], [0, 0.5, 1]) } },

  "cloud-rain": {
    auto: false,
    pp: false,
    dur: 1.5,
    parts: [
      path(CLOUD_SM),
      G("rain", [
        line(8.6, 16.6, 7.9, 19.8),
        line(12.6, 17.4, 11.9, 20.6),
        line(16.6, 16.6, 15.9, 19.8),
      ]),
    ],
    gAnims: { rain: FALL(1.8) },
  },

  "cloud-little-rain": {
    auto: false,
    pp: false,
    dur: 1.5,
    parts: [
      path(CLOUD_SM),
      G("rain", [
        line(9, 16.4, 8.6, 18.4),
        line(15.4, 16.4, 15, 18.4),
        line(12.2, 19.2, 11.8, 21.2),
      ]),
    ],
    gAnims: { rain: FALL(1.6) },
  },

    "cloud-mid-rain": { dur: 1.6,
    pp: false,
    auto: false,
    parts: [
    path("M7.3 13.65C5.3 13.65 3.7 12.15 3.7 10.25C3.7 8.55 4.9 7.25 6.6 6.95C7 4.55 9 2.75 11.5 2.75C13.6 2.75 15.4 4.25 15.9 6.25C16.1 6.25 16.4 6.15 16.6 6.15C18.7 6.15 20.3 7.75 20.3 9.75C20.3 11.85 18.6 13.65 16.4 13.65L7.3 13.65Z"),
    G("rain", [
      path("M12.1 14.95C11.3 15.95 10.6 16.75 10.6 17.55A1.5 1.5 0 0 0 13.6 17.55C13.6 16.75 12.9 15.95 12.1 14.95Z"),
      path("M7.5 17.95C6.8 18.85 6.3 19.45 6.3 20.05A1.2 1.2 0 0 0 8.7 20.05C8.7 19.45 8.2 18.85 7.5 17.95Z"),
      path("M16.7 17.95C16 18.85 15.5 19.45 15.5 20.05A1.2 1.2 0 0 0 17.9 20.05C17.9 19.45 17.4 18.85 16.7 17.95Z"),
    ]),
  ],
    gAnims: { rain: [tn("translate", ["0 -1.5", "0 -1.5", "0 1.5", "0 -1.5"], [0, 0.1, 0.7, 1]), an("opacity", ["0", "0", "1", "1", "0", "0"], [0, 0.1, 0.25, 0.55, 0.68, 1])] } },

  "cloud-hailstone": {
    auto: false,
    pp: false,
    dur: 1.5,
    parts: [
      path(CLOUD_SM),
      G("hail", [
        circle(8.4, 17, 1.05, fill()),
        circle(12.6, 16.2, 1.05, fill()),
        circle(16.6, 17, 1.05, fill()),
        circle(10.4, 20.2, 1.05, fill()),
        circle(14.6, 20.2, 1.05, fill()),
      ]),
    ],
    gAnims: { hail: FALL(1.5) },
  },

  "cloud-snow": {
    auto: false,
    pp: false,
    dur: 1.8,
    parts: [
      path(CLOUD_SM),
      G("snow", [
        circle(8.4, 17, 0.95),
        circle(12.6, 16.2, 0.95),
        circle(16.6, 17, 0.95),
        circle(10.4, 20.2, 0.95),
        circle(14.6, 20.2, 0.95),
      ]),
    ],
    gAnims: { snow: FALL(1.6, 0.6) },
  },

  "cloud-little-snow": {
    auto: false,
    pp: false,
    dur: 1.8,
    parts: [
      path(CLOUD_SM),
      G("snow", [
        line(8.2, 16.8, 9.8, 18.4),
        line(9.8, 16.8, 8.2, 18.4),
        line(11.7, 19.6, 13.3, 21.2),
        line(13.3, 19.6, 11.7, 21.2),
        line(15.2, 16.8, 16.8, 18.4),
        line(16.8, 16.8, 15.2, 18.4),
      ]),
    ],
    gAnims: { snow: FALL(1.6, 0.5) },
  },

  "cloud-mid-snow": {
    auto: false,
    dur: 1.9,
    parts: [
      path(CLOUD_SM),
      G("flake", [
        line(12, 15.9, 12, 21.3),
        line(9.7, 17.2, 14.3, 19.9),
        line(9.7, 19.9, 14.3, 17.2),
      ]),
    ],
    gAnims: { flake: tn("rotate", ["0 11.9 18.6", "18 11.9 18.6", "-18 11.9 18.6", "0 11.9 18.6"], [0, 0.3, 0.65, 1]) },
  },

  "cloud-lightning": {
    auto: false,
    parts: [
      path(CLOUD_SM),
      A(path("M13.6 14.2l-3 3.8h2.6l-1.7 3.7"), [
        an("opacity", ["1", "0.15", "1", "0.45", "1"], [0, 0.12, 0.3, 0.5, 1]),
      ]),
    ],
  },

  "cloud-loading": {
    auto: false,
    dur: 1.5,
    parts: [
      path(CLOUD),
      A(line(6.4, 19.9, 8.4, 19.9), [an("opacity", ["0.25", "1", "0.25"], [0, 0.25, 0.5])]),
      A(line(11, 19.9, 13, 19.9), [an("opacity", ["0.25", "0.25", "1", "0.25"], [0, 0.2, 0.5, 0.75])]),
      A(line(15.6, 19.9, 17.6, 19.9), [an("opacity", ["0.25", "0.25", "1", "0.25"], [0, 0.4, 0.7, 1])]),
    ],
  },

  "cloud-slow-wind": {
    auto: false,
    dur: 1.9,
    parts: [
      path(CLOUD_SM),
      G("wind", [
        path("M4.6 17.9c1.1-1 2.6-1 3.7 0s2.6 1 3.7 0"),
        path("M11.8 20.9c1.1-1 2.6-1 3.7 0s2.6 1 3.7 0"),
      ]),
    ],
    gAnims: { wind: tn("translate", ["-1.4 0", "1.4 0", "-1.4 0"], [0, 0.5, 1]) },
  },

  "cloud-rain-wind": {
    auto: false,
    pp: false,
    dur: 1.5,
    parts: [
      path(CLOUD_SM),
      G("rain", [
        line(9.4, 16.4, 7.4, 20.4),
        line(13.6, 16.4, 11.6, 20.4),
        line(17.8, 16.4, 15.8, 20.4),
      ]),
    ],
    gAnims: { rain: FALL(2) },
  },

    "cloud-off": { auto: false,
    parts: [
    path("M6.4 18C4 18 2.2 16.1 2.2 13.7C2.2 11.6 3.7 9.8 5.8 9.5C6.3 6.6 8.7 4.5 11.6 4.5C14.1 4.5 16.2 6.3 16.8 8.8C17 8.7 17.3 8.7 17.6 8.7C20.1 8.7 22 10.6 22 13C22 15.6 20 17.7 17.4 17.7L6.4 17.7Z"),
    A(line(4.1, 4.4, 19.3, 19.6, { pathLength: 1, "stroke-dasharray": 1 }), [an("stroke-dashoffset", ["1", "1", "0"], [0, 0.12, 0.7])]),
  ] },

  "cloud-server": {
    auto: false,
    parts: [
      path(CLOUD_SM),
      A(line(12, 15.2, 12, 17.6), [an("opacity", ["1", "0.3", "1"], [0, 0.45, 1])]),
      rect(9.2, 17.6, 5.6, 3.4, 1.2),
      A(line(4.4, 19.3, 9.2, 19.3), [an("opacity", ["1", "1", "0.3", "1", "1"], [0, 0.2, 0.4, 0.6, 1])]),
      A(line(14.8, 19.3, 19.6, 19.3), [an("opacity", ["1", "1", "0.3", "1", "1"], [0, 0.5, 0.7, 0.9, 1])]),
    ],
  },

  "cloud-sync": {
    auto: false,
    dur: 1.9,
    pp: false,
    parts: [
      path(CLOUD_SM),
      G("spin", [
        path("M9.1 18.1a3 3 0 0 1 5.5-.8"),
        path("M13.3 16.8l1.3.5-.4-1.8"),
        path("M14.9 18.9a3 3 0 0 1-5.5.8"),
        path("M10.7 20.2l-1.3-.5.4 1.8"),
      ]),
    ],
    gAnims: { spin: tn("rotate", ["0 12 18.6", "360 12 18.6"]) },
  },

  /* a big cloud opened at the bottom; the arrow rises through the gap
   * with air on both sides (it never touches the puff) */
  "cloud-upload": {
    auto: false,
    parts: [
      path("M8 17H6.6a4.22 4.22 0 0 1-.5-8.4A6 6 0 0 1 17.7 10h.6a3.5 3.5 0 0 1 0 7h-2.3"),
      G("arr", [line(12, 20.6, 12, 10.8), path("M8.8 14l3.2-3.2 3.2 3.2")]),
    ],
    gAnims: { arr: tn("translate", ["0 0", "0 -1.8", "0 0"], [0, 0.5, 1]) },
  },

  "cloud-saving-done01": {
    auto: false,
    parts: [path(CLOUD_SM), A(path("M9.3 18l1.9 1.9 4.3-4.6", DO), draw())],
  },

  "cloud-saving-done02": {
    auto: false,
    parts: [
      path(CLOUD_SM),
      circle(12, 18.6, 3),
      A(path("M10.5 18.6l1.1 1.1 2.3-2.4", DO), draw(0.2, 0.85)),
    ],
  },

  "cloud-moon-rain": {
    auto: false,
    pp: false,
    dur: 1.5,
    parts: [
      path("M20 9.4a4.5 4.5 0 1 1-5.7-5.7 3.7 3.7 0 0 0 5.7 5.7z"),
      path("M6.4 18.9c-1.7 0-3-1.2-3-2.7 0-1.4 1-2.5 2.3-2.8.4-2 2-3.5 4-3.5 1.7 0 3.1 1.2 3.5 2.8h.5c1.7 0 3 1.3 3 2.9 0 1.8-1.4 3.3-3.2 3.3H6.4z"),
      G("rain", [line(8.4, 19.9, 8, 21.4), line(12.4, 19.9, 12, 21.4)]),
    ],
    gAnims: { rain: FALL(1.3) },
  },

  "cloud-sun-rain": {
    auto: false,
    pp: false,
    dur: 1.5,
    parts: [
      circle(16.4, 7.6, 2.6),
      line(16.4, 3.7, 16.4, 4.4),
      line(14.4, 5, 14.9, 5.5),
      line(18.4, 5, 17.9, 5.5),
      line(19.1, 7.6, 19.9, 7.6),
      line(18.2, 9.8, 18.7, 10.3),
      path("M6.4 18.9c-1.7 0-3-1.2-3-2.7 0-1.4 1-2.5 2.3-2.8.4-2 2-3.5 4-3.5 1.7 0 3.1 1.2 3.5 2.8h.5c1.7 0 3 1.3 3 2.9 0 1.8-1.4 3.3-3.2 3.3H6.4z"),
      G("rain", [line(8.4, 19.9, 8, 21.4), line(12.4, 19.9, 12, 21.4)]),
    ],
    gAnims: { rain: FALL(1.3) },
  },

  cloudy: {
    auto: false,
    dur: 1.9,
    parts: [
      G("back", [path("M14.7 12.3c-1.4 0-2.4-1-2.4-2.3 0-1.1.8-2 1.8-2.2.2-1.4 1.2-2.5 2.6-2.5 1.2 0 2.2.8 2.6 1.9.1 0 .3-.1.4-.1 1 0 1.8.8 1.8 1.9 0 1.2-1 2.2-2.2 2.2h-4.6z")]),
      G("front", [path("M5.9 19.6c-1.9 0-3.3-1.4-3.3-3.1 0-1.6 1.1-2.8 2.6-3.1.4-2.2 2.2-3.9 4.4-3.9 1.9 0 3.5 1.3 3.9 3.1h.6c1.9 0 3.3 1.4 3.3 3.1 0 1.9-1.6 3.5-3.5 3.5H5.9z")]),
    ],
    gAnims: {
      back: tn("translate", ["0 0", "-1 0", "0 0"], [0, 0.5, 1]),
      front: tn("translate", ["0 0", "0.8 0", "0 0"], [0, 0.5, 1]),
    },
  },

  /* ============================ CONTAINER ============================ */

  container: {
    auto: false,
    dur: 1.6,
    parts: [
      rect(3, 6.5, 18, 11, 2.5),
      A(line(7.2, 9.3, 7.2, 14.7), [an("opacity", ["1", "0.3", "1"], [0, 0.15, 0.35])]),
      A(line(10.4, 9.3, 10.4, 14.7), [an("opacity", ["1", "0.3", "1"], [0.15, 0.3, 0.5])]),
      A(line(13.6, 9.3, 13.6, 14.7), [an("opacity", ["1", "0.3", "1"], [0.3, 0.45, 0.65])]),
      A(line(16.8, 9.3, 16.8, 14.7), [an("opacity", ["1", "0.3", "1"], [0.45, 0.6, 0.8])]),
    ],
  },

  "container-truck": {
    auto: false,
    parts: [
      G("haul", [
        rect(3, 5.6, 8.4, 9.1, 1.8),
        line(5.8, 7.7, 5.8, 12.6),
        line(8.6, 7.7, 8.6, 12.6),
        path("M11.4 14.7V8.6c0-1.2 1-2.1 2.1-2.1h2c.8 0 1.5.4 1.9 1.1l1.7 2.8c.3.5.4 1 .4 1.5v1.8c0 1.1-.9 2-2 2h-1.4"),
        line(3.2, 14.7, 20.9, 14.7),
        circle(6.8, 17.6, 1.9),
        circle(16.6, 17.6, 1.9),
      ]),
    ],
    gAnims: { haul: tn("translate", ["0 0", "0 0", "0.9 0", "0 0", "0 0"], [0, 0.2, 0.5, 0.75, 1]) },
  },

  "container-truck01": {
    auto: false,
    parts: [
      G("haul", [
        rect(3, 5.2, 8.4, 9.5, 1.8),
        line(5.8, 7.4, 5.8, 12.5),
        line(8.6, 7.4, 8.6, 12.5),
        path("M11.4 14.7V8.9c0-1.3 1.1-2.4 2.4-2.4h1.5c1.5 0 2.8.9 3.4 2.3l1.2 2.8c.2.5.3 1 .3 1.5v.6c0 1.1-.9 2-2 2h-1.5"),
        line(3.2, 14.7, 20.9, 14.7),
        circle(6.8, 17.6, 1.9),
        circle(16.6, 17.6, 1.9),
      ]),
    ],
    gAnims: { haul: tn("translate", ["0 0", "0 0", "0.9 0", "0 0", "0 0"], [0, 0.2, 0.5, 0.75, 1]) },
  },

  "container-truck02": {
    auto: false,
    parts: [
      G("haul", [
        rect(3, 5.6, 8.4, 9.1, 1.8),
        line(5.8, 7.7, 5.8, 12.6),
        line(8.6, 7.7, 8.6, 12.6),
        path("M11.4 14.7V7.9c0-.9.7-1.6 1.6-1.6h2.4c.7 0 1.4.4 1.8 1.1l2.6 4c.3.5.4 1 .4 1.5v.6c0 1.1-.9 2-2 2h-1.7"),
        line(3.2, 14.7, 20.9, 14.7),
        circle(6.8, 17.6, 1.9),
        circle(16.6, 17.6, 1.9),
      ]),
    ],
    gAnims: { haul: tn("translate", ["0 0", "0 0", "0.9 0", "0 0", "0 0"], [0, 0.2, 0.5, 0.75, 1]) },
  },

  /* ============================ COPY ============================ */

  copy: {
    auto: false,
    parts: [G("front", [rect(8.4, 8.4, 11.2, 11.2, 2.5)]), path(COPY_BACK)],
    gAnims: { front: tn("translate", ["0 0", "1.6 1.6", "0 0"], [0, 0.5, 1]) },
  },

    "copy01": { auto: false,
    parts: [
    G("front", [
      rect(7.08, 7.11, 13.99, 13.99, 4.3),
    ]),
    path("M7.08 15.29L5.63 15.29C3.78 15.29 2.33 13.84 2.33 12L2.33 5.4C2.33 3.55 3.78 2.1 5.63 2.1L12.23 2.1C14.08 2.1 15.53 3.55 15.53 5.4L15.53 7.11"),
  ],
    gAnims: { front: tn("translate", ["0 0", "1.98 1.98", "0 0"], [0, 0.5, 1]) } },

    "copy02": { auto: false,
    parts: [
    G("front", [
      rect(7.85, 7.64, 14.04, 14.04, 3.24),
    ]),
    path("M7.85 4.13L5.55 4.13C3.93 4.13 2.71 5.34 2.71 6.96L2.71 9.12"),
    path("M13.79 4.13L15.81 4.13C17.43 4.13 18.65 5.34 18.65 6.96L18.65 8.72"),
    path("M2.72 13.58L2.72 15.6C2.72 17.22 3.93 18.44 5.55 18.44L7.71 18.44"),
  ],
    gAnims: { front: tn("translate", ["0 0", "2.03 2.03", "0 0"], [0, 0.5, 1]) } },

  "copy-check": {
    auto: false,
    parts: [
      rect(8.4, 8.4, 11.2, 11.2, 2.5),
      path(COPY_BACK),
      A(path("M11.2 13.9l1.8 1.8 3.6-3.8", DO), draw()),
    ],
  },

  "copy-link": {
    auto: false,
    parts: [
      rect(8.4, 8.4, 11.2, 11.2, 2.5),
      path(COPY_BACK),
      G("link", [
        path("M13.7 12l1.1-1.1a1.5 1.5 0 0 1 2.3 2.3l-1.1 1.1"),
        path("M12 13.7l-1.1 1.1a1.5 1.5 0 0 0 2.3 2.3l1.1-1.1"),
      ]),
    ],
    gAnims: { link: tn("rotate", ["0 14 14", "-8 14 14", "8 14 14", "0 14 14"], [0, 0.3, 0.6, 1]) },
  },

  "copy-minus": {
    auto: false,
    parts: [
      rect(8.4, 8.4, 11.2, 11.2, 2.5),
      path(COPY_BACK),
      A(line(11.4, 14, 16.6, 14, DO), draw()),
    ],
  },

  "copy-plus": {
    auto: false,
    parts: [
      rect(8.4, 8.4, 11.2, 11.2, 2.5),
      path(COPY_BACK),
      G("plus", [line(14, 11.4, 14, 16.6), line(11.4, 14, 16.6, 14)]),
    ],
    gAnims: { plus: tn("rotate", ["0 14 14", "90 14 14"]) },
  },

  "copy-slash": {
    auto: false,
    parts: [
      rect(8.4, 8.4, 11.2, 11.2, 2.5),
      path(COPY_BACK),
      A(line(16.6, 11.4, 11.4, 16.6, DO), draw()),
    ],
  },

  "copy-x": {
    auto: false,
    parts: [
      rect(8.4, 8.4, 11.2, 11.2, 2.5),
      path(COPY_BACK),
      A(line(11.4, 11.4, 16.6, 16.6, DO), draw(0.08, 0.5)),
      A(line(16.6, 11.4, 11.4, 16.6, DO), draw(0.25, 0.7)),
    ],
  },

    "copyleft": { dur: 1.9,
    pp: false,
    auto: false,
    parts: [
    circle(12.59, 12, 8.6),
    G("c", [
      path("M9.19 9.3A4.1 4.1 0 1 0 9.19 14.7"),
    ]),
  ],
    gAnims: { c: tn("rotate", ["0 12.59 12", "-120 12.59 12", "-240 12.59 12", "0 12.59 12"]) } },

  copyright: {
    auto: false,
    pp: false,
    dur: 1.9,
    parts: [
      circle(12, 12, 8.6),
      G("c", [path("M15.4 9.3a4.1 4.1 0 1 0 0 5.4")]),
    ],
    gAnims: { c: tn("rotate", ["0 12 12", "120 12 12", "240 12 12", "0 12 12"]) },
  },

  /* ============================ DATABASE ============================ */

  database: {
    auto: false,
    parts: [
      ellipse(12, 5.4, 7.2, 2.7),
      path(DB_BODY),
      G("mid", [path(DB_MID)]),
      path("M4.8 15.7c0 1.5 3.2 2.8 7.2 2.8s7.2-1.3 7.2-2.8"),
    ],
    gAnims: { mid: tn("translate", ["0 0", "0 1.2", "0 0"], [0, 0.5, 1]) },
  },

  database01: {
    auto: false,
    parts: [
      rect(4, 4, 16, 16, 2.6),
      line(4, 12, 20, 12),
      A(circle(7.2, 8, 0.9, fill()), [an("opacity", ["1", "0.25", "1"], [0, 0.2, 0.45])]),
      line(10.5, 8, 16.5, 8),
      A(circle(7.2, 16, 0.9, fill()), [an("opacity", ["1", "0.25", "1"], [0.4, 0.6, 0.85])]),
      line(10.5, 16, 16.5, 16),
    ],
  },

  database02: {
    auto: false,
    parts: [
      ellipse(12, 5.4, 7.2, 2.7),
      path(DB_BODY),
      path(DB_MID),
      A(line(7.8, 8.6, 7.8, 10.4), [an("opacity", ["1", "0.25", "1"], [0, 0.2, 0.45])]),
      A(line(7.8, 15.4, 7.8, 17.2), [an("opacity", ["1", "0.25", "1"], [0.4, 0.6, 0.85])]),
    ],
  },

  "database-add": {
    auto: false,
    parts: [
      ellipse(10.1, 5.2, 6.2, 2.6),
      path(DB_BODY_SM),
      G("plus", [circle(17.1, 17.1, 3.6), line(17.1, 15.4, 17.1, 18.8), line(15.4, 17.1, 18.8, 17.1)]),
    ],
    sAnims: { plus: popAt(17.1, 17.1) },
  },

  "database-backup": {
    auto: false,
    pp: false,
    dur: 1.8,
    parts: [
      ellipse(10.1, 5.2, 6.2, 2.6),
      path(DB_BODY_SM),
      G("spin", [
        path("M19.8 15.2a3.6 3.6 0 1 0 .5 2.6"),
        path("M20.7 12.9l-.5 2.1-2.1-.4"),
      ]),
    ],
    gAnims: { spin: tn("rotate", ["0 18.4 16.7", "360 18.4 16.7"]) },
  },

  "database-expand": {
    auto: false,
    parts: [
      ellipse(12, 9.2, 4.2, 1.9),
      path("M7.8 9.2v5.2c0 1 1.9 1.9 4.2 1.9s4.2-.9 4.2-1.9V9.2"),
      G("tl", [path("M8.8 3.6H6.4c-1.2 0-2.2 1-2.2 2.2v2.4")]),
      G("tr", [path("M15.2 3.6h2.4c1.2 0 2.2 1 2.2 2.2v2.4")]),
      G("br", [path("M19.8 15.8v2.4c0 1.2-1 2.2-2.2 2.2h-2.4")]),
      G("bl", [path("M8.8 20.4H6.4c-1.2 0-2.2-1-2.2-2.2v-2.4")]),
    ],
    gAnims: {
      tl: tn("translate", ["0 0", "-0.9 -0.9", "0 0"], [0, 0.5, 1]),
      tr: tn("translate", ["0 0", "0.9 -0.9", "0 0"], [0, 0.5, 1]),
      br: tn("translate", ["0 0", "0.9 0.9", "0 0"], [0, 0.5, 1]),
      bl: tn("translate", ["0 0", "-0.9 0.9", "0 0"], [0, 0.5, 1]),
    },
  },

  "database-export": {
    auto: false,
    parts: [
      ellipse(10.1, 5.2, 6.2, 2.6),
      path(DB_BODY_SM),
      G("arr", [line(17.5, 20.9, 17.5, 15.2), path("M15.1 17.6l2.4-2.4 2.4 2.4")]),
    ],
    gAnims: { arr: tn("translate", ["0 0", "0 -1.5", "0 0"], [0, 0.5, 1]) },
  },

  "database-import": {
    auto: false,
    parts: [
      ellipse(10.1, 5.2, 6.2, 2.6),
      path(DB_BODY_SM),
      G("arr", [line(17.5, 15.2, 17.5, 20.9), path("M15.1 18.5l2.4 2.4 2.4-2.4")]),
    ],
    gAnims: { arr: tn("translate", ["0 0", "0 1.5", "0 0"], [0, 0.5, 1]) },
  },

  "database-lightning": {
    auto: false,
    parts: [
      ellipse(10.1, 5.2, 6.2, 2.6),
      path(DB_BODY_SM),
      A(path("M18.6 13.2l-2.4 3.1h2.3l-1.5 3.1"), [
        an("opacity", ["1", "0.15", "1", "0.45", "1"], [0, 0.12, 0.3, 0.5, 1]),
      ]),
    ],
  },

  "database-locked": {
    auto: false,
    parts: [
      ellipse(10.1, 5.2, 6.2, 2.6),
      path(DB_BODY_SM),
      G("lock", [rect(14.8, 17, 4.6, 3.8, 1.1), path("M15.9 17v-1.4a1.7 1.7 0 0 1 3.4 0V17")]),
    ],
    sAnims: { lock: popAt(17.1, 18.9, 1.15) },
  },

};
