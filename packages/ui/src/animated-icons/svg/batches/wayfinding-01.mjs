const path = (d, a = {}) => ({ e: "path", a: { d, ...a } });
const circle = (cx, cy, r, a = {}) => ({ e: "circle", a: { cx, cy, r, ...a } });
const line = (x1, y1, x2, y2, a = {}) => ({ e: "line", a: { x1, y1, x2, y2, ...a } });
const rect = (x, y, w, h, rx, a = {}) => ({ e: "rect", a: { x, y, width: w, height: h, rx, ...a } });
const fill = (color = "currentColor") => ({ fill: color, stroke: "none" });
const an = (attr, values, times) => ({ kind: "attr", attr, values, times });
const tn = (type, values, times, extra = {}) => ({ kind: "transform", type, values, times, ...extra });
const A = (part, anims) => ({ ...part, anims });
const G = (id, children, a = {}) => ({ e: "g", g: id, a, children });

/* Shared bits — every sort glyph carries the same left-hand down arrow. */
const SORT_ARROW = [
  line(7.6, 4.6, 7.6, 13.8),
  path("M4.7 12.4c1 1.4 2.1 3 2.9 3.2.8-.2 1.9-1.8 2.9-3.2"),
];

/* Expand corner caps — open rounded corners pointing into the 4 corners. */
const CAP_TL = "M8.2 3.6H5.6c-1 0-1.6.6-1.6 1.6v2.6";
const CAP_TR = "M15.8 3.6h2.6c1 0 1.6.6 1.6 1.6v2.6";
const CAP_BL = "M8.2 20.4H5.6c-1 0-1.6-.6-1.6-1.6v-2.6";
const CAP_BR = "M15.8 20.4h2.6c1 0 1.6-.6 1.6-1.6v-2.6";

/* Sort signature — one deliberate dip of the index arrow, then a long rest. */
const sortDip = (dir = 2.4) => tn("translate", ["0 0", `0 ${dir}`, "0 0", "0 0"], [0, 0.2, 0.45, 1]);
/* Expand signature — each corner arm stretches outward, holds, then releases. */
const cornerPull = (dx, dy) =>
  tn("translate", ["0 0", `${dx} ${dy}`, `${dx} ${dy}`, "0 0", "0 0"], [0, 0.28, 0.55, 0.82, 1]);

export const icons = {
  "arrow-all-direction": { dur: 1.6, auto: false, pp: false,
    parts: [
      G("spread", [
        line(12, 4.75, 12, 19.25),
        line(4.75, 12, 19.25, 12),
        path("M8.6 5.9C9.9 4.7 11.2 3.5 12 3.5C12.8 3.5 14.1 4.7 15.4 6"),
        path("M8.6 18.1C9.9 19.3 11.2 20.5 12 20.5C12.8 20.5 14.1 19.3 15.4 18.1"),
        path("M5.9 8.6C4.7 9.9 3.5 11.2 3.5 12C3.5 12.8 4.7 14.1 5.9 15.4"),
        path("M18.1 8.6C19.3 9.9 20.5 11.2 20.5 12C20.5 12.8 19.3 14.1 18.1 15.4")
      ])
    ],
    sAnims: { spread: { pivot: [12, 12], anim: tn("scale", ["1","1.08","1","1"], [0,0.3,0.58,1]) } },
  },
  "arrow-big-down-dash": { dur: 1.2, auto: false,
    parts: [
      line(9.4, 3.6, 14.6, 3.6),
      G("drop", [
        path("M10.2 8.4C10.2 7.4 11 6.6 12 6.6C13 6.6 13.8 7.4 13.8 8.4L13.8 12.4L17.2 12.4C18.5 12.4 19.2 13.9 18.4 15L12.7 20.75C11.9 21.5 10.7 21.5 9.9 20.75L4.2 14.9C3.4 13.9 4.1 12.4 5.4 12.4L10.2 12.4Z")
      ])
    ],
    gAnims: { drop: tn("translate", ["0 0","0 3.2","0 0"]) },
  },
  "arrow-big-left-dash": { dur: 1.2, auto: false,
    parts: [
      line(20.4, 9.4, 20.4, 14.6),
      G("drop", [
        path("M15.6 10.2C16.6 10.25 17.4 11 17.4 12C17.4 13 16.6 13.75 15.6 13.75L11.6 13.75L11.6 17.25C11.6 18.5 10.1 19.2 9.1 18.4L3.3 12.75C2.5 11.9 2.5 10.7 3.3 9.9L9.1 4.25C10.1 3.4 11.6 4.1 11.6 5.4L11.6 10.25Z")
      ])
    ],
    gAnims: { drop: tn("translate", ["0 0","-3.2 0","0 0"]) },
  },
  "arrow-big-right-dash": { dur: 1.2, auto: false,
    parts: [
      line(3.6, 9.4, 3.6, 14.6),
      G("drop", [
        path("M8.4 10.2C7.4 10.25 6.6 11 6.6 12C6.6 13 7.4 13.75 8.4 13.75L12.4 13.75L12.4 17.25C12.4 18.5 13.9 19.2 14.9 18.4L20.7 12.75C21.5 11.9 21.5 10.7 20.7 9.9L14.9 4.25C13.9 3.4 12.4 4.1 12.4 5.4L12.4 10.25Z")
      ])
    ],
    gAnims: { drop: tn("translate", ["0 0","3.2 0","0 0"]) },
  },
  "arrow-big-up-dash": { dur: 1.2, auto: false,
    parts: [
      line(9.4, 20.4, 14.6, 20.4),
      G("drop", [
        path("M10.2 15.6C10.2 16.6 11 17.4 12 17.4C13 17.4 13.8 16.6 13.8 15.6L13.8 11.6L17.2 11.6C18.5 11.6 19.2 10.1 18.4 9L12.7 3.25C11.9 2.5 10.7 2.5 9.9 3.25L4.2 9C3.4 10.1 4.1 11.6 5.4 11.6L10.2 11.6Z")
      ])
    ],
    gAnims: { drop: tn("translate", ["0 0","0 -3.2","0 0"]) },
  },
  "arrow-data-transfer-diagonal": { dur: 1.4, auto: true, parts: [
    path("M4.5 14 13 5.5M8.5 5.5H13V10"),
    path("M19.5 10 11 18.5M15.5 18.5H11V14"),
  ] },
  "arrow-data-transfer-horizontal": { dur: 1.6, auto: false, pp: false,
    parts: [
      G("west", [
        line(6.6, 8, 19.4, 8),
        path("M9.9 4.9C8.2 6.05 6.4 7.35 6.4 8C6.4 8.65 8.2 9.95 9.9 11")
      ]),
      G("east", [
        line(4.6, 16, 17.4, 16),
        path("M14.1 12.9C15.8 14.05 17.6 15.35 17.6 16C17.6 16.65 15.8 17.95 14.1 19.1")
      ])
    ],
    gAnims: { west: tn("translate", ["0 0","-2.4 0","0 0","0 0"], [0,0.18,0.38,1]), east: tn("translate", ["0 0","0 0","2.4 0","0 0","0 0"], [0,0.5,0.68,0.9,1]) },
  },
  "arrow-data-transfer-vertical": { dur: 1.6, auto: false, pp: false,
    parts: [
      G("down", [
        line(8.4, 4.6, 8.4, 14.6),
        path("M5.5 13.9C6.7 15.5 8 17.25 8.4 17.25C8.8 17.25 10.1 15.5 11.3 14")
      ]),
      G("up", [
        line(15.6, 19.4, 15.6, 9.4),
        path("M12.7 10.1C13.9 8.5 15.2 6.75 15.6 6.75C16 6.75 17.3 8.5 18.5 10")
      ])
    ],
    gAnims: { down: tn("translate", ["0 0","0 2.4","0 0","0 0"], [0,0.18,0.38,1]), up: tn("translate", ["0 0","0 0","0 -2.4","0 0","0 0"], [0,0.5,0.68,0.9,1]) },
  },
  "arrow-diagonal": { dur: 1.3, auto: false,
    parts: [
      G("nudge", [
        line(4.6, 19.4, 19.4, 4.6),
        path("M15.8 3.6L18.4 3.6C19.4 3.6 20 4.2 20 5.25L20 7.75"),
        path("M8.2 20.4L5.6 20.4C4.6 20.4 4 19.8 4 18.75L4 16.25")
      ])
    ],
    gAnims: { nudge: tn("translate", ["0 0","2.2 -2.2","0 0"]) },
  },
  "arrow-down01": { dur: 1.1, auto: false,
    parts: [
      G("nudge", [
        path("M6.2 7.6C8 10.6 10.4 15 12 15C13.6 15 16 10.6 17.8 7.6")
      ])
    ],
    gAnims: { nudge: tn("translate", ["0 0","0 3","0 0"]) },
  },
  "arrow-down02": { dur: 1.15, auto: false,
    parts: [
      G("nudge", [
        line(12, 4.6, 12, 12.25),
        path("M6.6 10.8C8.4 13.7 10.8 17.4 12 17.4C13.2 17.4 15.6 13.7 17.4 10.75")
      ])
    ],
    gAnims: { nudge: tn("translate", ["0 0","0 3","0 0"]) },
  },
  "arrow-down03": { dur: 1.25, auto: false,
    parts: [
      G("nudge", [
        line(12, 4.6, 12, 13.75),
        path("M6.9 11.4C8.7 13.9 10.9 16.25 12 16.25C13.1 16.25 15.3 13.9 17.1 11.4")
      ]),
      line(6.25, 20, 17.75, 20)
    ],
    gAnims: { nudge: tn("translate", ["0 0","0 2.6","0 0"]) },
  },
  "arrow-down04": { dur: 1.2, auto: false,
    parts: [
      G("nudge", [
        line(12, 4.4, 12, 12.75),
        path("M8 13.4L16 13.4C17.6 13.4 18.5 15.2 17.4 16.4L13.5 20.4C12.6 21.3 11.3 21.3 10.4 20.4L6.5 16.4C5.4 15.2 6.3 13.4 7.9 13.4Z")
      ])
    ],
    gAnims: { nudge: tn("translate", ["0 0","0 2.6","0 0"]) },
  },
  "arrow-down05": { dur: 1.25, auto: false,
    parts: [
      G("nudge", [
        line(12, 4.6, 12, 10.75),
        path("M8.7 11.4L15.3 11.4C16.6 11.4 17.3 12.9 16.4 14L12.3 18.1C11.8 18.6 11 18.6 10.5 18.1L6.4 14C5.5 12.9 6.3 11.4 7.6 11.4Z")
      ]),
      line(6.25, 20, 17.75, 20)
    ],
    gAnims: { nudge: tn("translate", ["0 0","0 2.6","0 0"]) },
  },
  "arrow-down-az": { dur: 1.5, auto: false, pp: false,
    parts: [
      G("sort", [
        line(7.6, 4.6, 7.6, 13.75),
        path("M4.7 12.4C5.7 13.8 6.8 15.6 7.6 15.6C8.4 15.6 9.5 13.8 10.5 12.4")
      ]),
      path("M15.8 10L18 4.6L20.2 10"),
      line(17, 8.4, 19, 8.4),
      path("M15.8 13.9L20.2 14L15.8 19.6L20.2 19.6")
    ],
    gAnims: { sort: tn("translate", ["0 0","0 2.4","0 0","0 0"], [0,0.2,0.45,1]) },
  },
  "arrow-down-big": { dur: 1.2, auto: false,
    parts: [
      G("nudge", [
        path("M10.2 6.6C10.2 5.6 11 4.75 12 4.75C13 4.75 13.8 5.6 13.8 6.6L13.8 11.25L17.4 11.25C18.7 11.25 19.4 12.7 18.6 13.75L12.7 19.75C11.9 20.5 10.7 20.5 9.9 19.75L4 13.75C3.2 12.7 3.9 11.25 5.2 11.25L10.2 11.25Z")
      ])
    ],
    gAnims: { nudge: tn("translate", ["0 0","0 3.2","0 0"]) },
  },
  "arrow-down-double": { dur: 1.35, auto: false, pp: false,
    parts: [
      G("c2", [
        path("M6.4 12.4C8 14.5 10.2 17.1 12 17.1C13.8 17.1 16 14.5 17.6 12.4")
      ]),
      G("c1", [
        path("M6.4 5C8 7.1 10.2 9.75 12 9.75C13.8 9.75 16 7.1 17.6 5")
      ])
    ],
    gAnims: { c1: tn("translate", ["0 0","0 2.2","0 0","0 0"], [0,0.18,0.4,1]), c2: tn("translate", ["0 0","0 0","0 2.2","0 0","0 0"], [0,0.15,0.35,0.55,1]) },
  },
  "arrow-down-from-line": { dur: 1.3, auto: false,
    parts: [
      line(6.5, 4.4, 17.5, 4.4),
      G("nudge", [
        line(12, 7.75, 12, 14.6),
        path("M6.6 13.2C8.5 15.6 10.8 18.25 12 18.25C13.2 18.25 15.5 15.6 17.4 13.2")
      ])
    ],
    gAnims: { nudge: tn("translate", ["0 0","0 2.8","0 0"]) },
  },
  "arrow-down-left01": { dur: 1.3, auto: false,
    parts: [
      G("nudge", [
        line(8.4, 15.6, 17.4, 6.6),
        path("M6.5 9.7C6.5 11.6 6.5 14.3 7.1 15.25C7.8 16.3 10.9 16.6 13 16.6")
      ])
    ],
    gAnims: { nudge: tn("translate", ["0 0","-2.2 2.2","0 0"]) },
  },
  "arrow-down-left02": { dur: 1.3, auto: false,
    parts: [
      G("nudge", [
        path("M6.5 16.7L7.15 12.75C7.15 12.25 7.85 11.88 8.47 12.35L12.03 15.85C12.5 16.25 12.33 17.12 11.61 17.12L7.5 17.75C6.9 17.75 6.5 17.25 6.5 16.75Z"),
        line(10.25, 14.25, 18.25, 6.75)
      ])
    ],
    gAnims: { nudge: tn("translate", ["0 0","-2.2 2.2","0 0"]) },
  },
  "arrow-down-narrow-wide": { dur: 1.5, auto: false, pp: false,
    parts: [
      G("sort", [
        line(7.6, 4.6, 7.6, 13.75),
        path("M4.7 12.4C5.7 13.8 6.8 15.6 7.6 15.6C8.4 15.6 9.5 13.8 10.5 12.4")
      ]),
      line(12.6, 4.75, 15.6, 4.75),
      line(12.6, 9, 18.6, 9),
      line(12.6, 13.25, 21, 13.25)
    ],
    gAnims: { sort: tn("translate", ["0 0","0 2.4","0 0","0 0"], [0,0.2,0.45,1]) },
  },
  "arrow-down-one-zero": { dur: 1.5, auto: false, pp: false,
    parts: [
      G("sort", [
        line(7.6, 4.6, 7.6, 13.75),
        path("M4.7 12.4C5.7 13.8 6.8 15.6 7.6 15.6C8.4 15.6 9.5 13.8 10.5 12.4")
      ]),
      path("M15.9 6.4L17.6 5L17.6 10"),
      rect(16, 13.75, 4.4, 5.75, 1.9)
    ],
    gAnims: { sort: tn("translate", ["0 0","0 2.4","0 0","0 0"], [0,0.2,0.45,1]) },
  },
  "arrow-down-right01": { dur: 1.3, auto: false,
    parts: [
      G("nudge", [
        line(15.6, 15.6, 6.6, 6.6),
        path("M17.5 9.7C17.5 11.6 17.4 14.3 16.8 15.25C16.1 16.3 13.1 16.6 10.9 16.6")
      ])
    ],
    gAnims: { nudge: tn("translate", ["0 0","2.2 2.2","0 0"]) },
  },
  "arrow-down-right02": { dur: 1.3, auto: false,
    parts: [
      G("nudge", [
        path("M17.5 16.7L16.85 12.75C16.85 12.25 16.15 11.88 15.53 12.35L11.97 15.85C11.5 16.25 11.67 17.12 12.39 17.12L16.5 17.75C17.1 17.75 17.5 17.25 17.5 16.75Z"),
        line(13.75, 14.25, 5.75, 6.75)
      ])
    ],
    gAnims: { nudge: tn("translate", ["0 0","2.2 2.2","0 0"]) },
  },
  "arrow-down-to-dot": { dur: 1.35, auto: false, pp: false,
    parts: [
      G("nudge", [
        line(12, 4.4, 12, 12.4),
        path("M7.6 10.8C9.1 12.8 11 15.25 12 15.25C13 15.25 14.9 12.8 16.4 10.75")
      ]),
      A(circle(12, 19.4, 1.4, fill()), [an("r", ["1.4","1.4","1.9","1.4"], [0,0.28,0.4,1])])
    ],
    gAnims: { nudge: tn("translate", ["0 0","0 2.8","0 0","0 0"], [0,0.18,0.36,1]) },
  },
  "arrow-down-to-line": { dur: 1.3, auto: false,
    parts: [
      G("nudge", [
        line(12, 4.25, 12, 13.4),
        path("M7.2 11.8C8.9 14 10.9 16.75 12 16.75C13.1 16.75 15.1 14 16.8 11.75")
      ]),
      line(6.4, 20.25, 17.6, 20.25)
    ],
    gAnims: { nudge: tn("translate", ["0 0","0 2.8","0 0"]) },
  },
  "arrow-down-wide-narrow": { dur: 1.5, auto: false, pp: false,
    parts: [
      G("sort", [
        line(7.6, 4.6, 7.6, 13.75),
        path("M4.7 12.4C5.7 13.8 6.8 15.6 7.6 15.6C8.4 15.6 9.5 13.8 10.5 12.4")
      ]),
      line(12.6, 4.75, 21, 4.75),
      line(12.6, 9, 18.6, 9),
      line(12.6, 13.25, 15.6, 13.25)
    ],
    gAnims: { sort: tn("translate", ["0 0","0 2.4","0 0","0 0"], [0,0.2,0.45,1]) },
  },
  "arrow-down-za": { dur: 1.5, auto: false, pp: false,
    parts: [
      G("sort", [
        line(7.6, 4.6, 7.6, 13.75),
        path("M4.7 12.4C5.7 13.8 6.8 15.6 7.6 15.6C8.4 15.6 9.5 13.8 10.5 12.4")
      ]),
      path("M15.8 4L20.2 4L15.8 9.75L20.2 9.75"),
      path("M15.8 19.6L18 14.25L20.2 19.6"),
      line(17, 18, 19, 18)
    ],
    gAnims: { sort: tn("translate", ["0 0","0 2.4","0 0","0 0"], [0,0.2,0.45,1]) },
  },
  "arrow-down-zero-one": { dur: 1.5, auto: false, pp: false,
    parts: [
      G("sort", [
        line(7.6, 4.6, 7.6, 13.75),
        path("M4.7 12.4C5.7 13.8 6.8 15.6 7.6 15.6C8.4 15.6 9.5 13.8 10.5 12.4")
      ]),
      rect(16, 4.25, 4.4, 5.75, 1.9),
      path("M15.9 15.4L17.6 14L17.6 19.6"),
      line(15.6, 19.6, 20.25, 19.6)
    ],
    gAnims: { sort: tn("translate", ["0 0","0 2.4","0 0","0 0"], [0,0.2,0.45,1]) },
  },
  "arrow-expand": { dur: 1.7, auto: false, pp: false,
    parts: [
      A(path("M8.2 3.6L5.6 3.6C4.6 3.6 4 4.2 4 5.25L4 7.75"), [tn("translate", ["0 0","-1.8 -1.8","-1.8 -1.8","0 0","0 0"], [0,0.28,0.55,0.82,1])]),
      A(path("M15.8 3.6L18.4 3.6C19.4 3.6 20 4.2 20 5.25L20 7.75"), [tn("translate", ["0 0","1.8 -1.8","1.8 -1.8","0 0","0 0"], [0,0.28,0.55,0.82,1])]),
      A(path("M8.2 20.4L5.6 20.4C4.6 20.4 4 19.8 4 18.75L4 16.25"), [tn("translate", ["0 0","-1.8 1.8","-1.8 1.8","0 0","0 0"], [0,0.28,0.55,0.82,1])]),
      A(path("M15.8 20.4L18.4 20.4C19.4 20.4 20 19.8 20 18.75L20 16.25"), [tn("translate", ["0 0","1.8 1.8","1.8 1.8","0 0","0 0"], [0,0.28,0.55,0.82,1])]),
      A(line(14, 10, 18.6, 5.4), [tn("translate", ["0 0","1.8 -1.8","1.8 -1.8","0 0","0 0"], [0,0.28,0.55,0.82,1])]),
      A(line(10, 10, 5.4, 5.4), [tn("translate", ["0 0","-1.8 -1.8","-1.8 -1.8","0 0","0 0"], [0,0.28,0.55,0.82,1])]),
      A(line(10, 14, 5.4, 18.6), [tn("translate", ["0 0","-1.8 1.8","-1.8 1.8","0 0","0 0"], [0,0.28,0.55,0.82,1])]),
      A(line(14, 14, 18.6, 18.6), [tn("translate", ["0 0","1.8 1.8","1.8 1.8","0 0","0 0"], [0,0.28,0.55,0.82,1])])
    ],
  },
  "arrow-expand-diagonal01": { dur: 1.6, auto: false, pp: false,
    parts: [
      G("tr", [
        path("M15.8 3.6L18.4 3.6C19.4 3.6 20 4.2 20 5.25L20 7.75"),
        line(15.25, 8.75, 19.4, 4.6)
      ]),
      G("bl", [
        path("M8.2 20.4L5.6 20.4C4.6 20.4 4 19.8 4 18.75L4 16.25"),
        line(8.75, 15.25, 4.6, 19.4)
      ]),
      line(9, 9, 15, 15)
    ],
    gAnims: { tr: tn("translate", ["0 0","1.8 -1.8","1.8 -1.8","0 0","0 0"], [0,0.28,0.55,0.82,1]), bl: tn("translate", ["0 0","-1.8 1.8","-1.8 1.8","0 0","0 0"], [0,0.28,0.55,0.82,1]) },
  },
  "arrow-expand-diagonal02": { dur: 1.6, auto: false, pp: false,
    parts: [
      G("tl", [
        path("M8.2 3.6L5.6 3.6C4.6 3.6 4 4.2 4 5.25L4 7.75"),
        line(8.75, 8.75, 4.6, 4.6)
      ]),
      G("br", [
        path("M15.8 20.4L18.4 20.4C19.4 20.4 20 19.8 20 18.75L20 16.25"),
        line(15.25, 15.25, 19.4, 19.4)
      ]),
      line(9, 15, 15, 9)
    ],
    gAnims: { tl: tn("translate", ["0 0","-1.8 -1.8","-1.8 -1.8","0 0","0 0"], [0,0.28,0.55,0.82,1]), br: tn("translate", ["0 0","1.8 1.8","1.8 1.8","0 0","0 0"], [0,0.28,0.55,0.82,1]) },
  },
  "arrow-expand01": { dur: 1.6, auto: false, pp: false,
    parts: [
      G("tr", [
        path("M15.8 3.6L18.4 3.6C19.4 3.6 20 4.2 20 5.25L20 7.75"),
        line(11.5, 12.5, 19.4, 4.6)
      ]),
      G("bl", [
        path("M8.2 20.4L5.6 20.4C4.6 20.4 4 19.8 4 18.75L4 16.25"),
        line(12.5, 11.5, 4.6, 19.4)
      ])
    ],
    gAnims: { tr: tn("translate", ["0 0","1.8 -1.8","1.8 -1.8","0 0","0 0"], [0,0.28,0.55,0.82,1]), bl: tn("translate", ["0 0","-1.8 1.8","-1.8 1.8","0 0","0 0"], [0,0.28,0.55,0.82,1]) },
  },
  "arrow-expand02": { dur: 1.6, auto: false, pp: false,
    parts: [
      G("tl", [
        path("M8.2 3.6L5.6 3.6C4.6 3.6 4 4.2 4 5.25L4 7.75"),
        line(12.5, 12.5, 19.4, 19.4)
      ]),
      G("br", [
        path("M15.8 20.4L18.4 20.4C19.4 20.4 20 19.8 20 18.75L20 16.25"),
        line(11.5, 11.5, 4.6, 4.6)
      ])
    ],
    gAnims: { tl: tn("translate", ["0 0","-1.8 -1.8","-1.8 -1.8","0 0","0 0"], [0,0.28,0.55,0.82,1]), br: tn("translate", ["0 0","1.8 1.8","1.8 1.8","0 0","0 0"], [0,0.28,0.55,0.82,1]) },
  },
  "arrow-horizontal": { dur: 1.5, auto: false, pp: false,
    parts: [
      line(4.4, 12, 19.6, 12),
      G("w", [
        path("M7.4 8.4C5.2 9.9 3.6 11.2 3.6 12C3.6 12.8 5.2 14.1 7.4 15.6")
      ]),
      G("e", [
        path("M16.6 8.4C18.8 9.9 20.4 11.2 20.4 12C20.4 12.8 18.8 14.1 16.6 15.6")
      ])
    ],
    gAnims: { w: tn("translate", ["0 0","-2.4 0","-2.4 0","0 0","0 0"], [0,0.28,0.55,0.82,1]), e: tn("translate", ["0 0","2.4 0","2.4 0","0 0","0 0"], [0,0.28,0.55,0.82,1]) },
  },
  "arrow-left01": { dur: 1.1, auto: false,
    parts: [
      G("nudge", [
        path("M16.8 5.8C13.4 7.7 9.3 10.3 9.3 12C9.3 13.7 13.4 16.3 16.8 18.25")
      ])
    ],
    gAnims: { nudge: tn("translate", ["0 0","-3 0","0 0"]) },
  },
  "arrow-left02": { dur: 1.15, auto: false,
    parts: [
      G("nudge", [
        line(5, 12, 19.6, 12),
        path("M9.7 6.5C7.4 8.2 4.5 10.6 4.5 12C4.5 13.2 7.4 15.5 9.7 17.5")
      ])
    ],
    gAnims: { nudge: tn("translate", ["0 0","-3 0","0 0"]) },
  },
  "arrow-left03": { dur: 1.25, auto: false,
    parts: [
      line(4.25, 6, 4.25, 18),
      G("nudge", [
        line(8.6, 12, 20.25, 12),
        path("M12.4 7.8C10.8 9.1 8.6 10.7 8.6 12C8.6 13.3 10.8 14.9 12.4 16.25")
      ])
    ],
    gAnims: { nudge: tn("translate", ["0 0","-2.6 0","0 0"]) },
  },
  "arrow-left04": { dur: 1.2, auto: false,
    parts: [
      G("nudge", [
        line(13.4, 12, 20, 12),
        path("M13.4 8L13.4 16C13.4 17.6 11.6 18.5 10.4 17.4L6.4 13.5C5.5 12.6 5.5 11.3 6.4 10.4L10.4 6.5C11.6 5.4 13.4 6.3 13.4 7.9Z")
      ])
    ],
    gAnims: { nudge: tn("translate", ["0 0","-2.6 0","0 0"]) },
  },
  "arrow-left05": { dur: 1.25, auto: false,
    parts: [
      line(4.25, 6, 4.25, 18),
      G("nudge", [
        line(13, 12, 20, 12),
        path("M12.6 8.4L12.6 15.6C12.6 17 11 17.8 9.9 17L6.7 14.1C5.9 13.4 5.9 12.2 6.7 11.5L9.9 8.75C11 7.8 12.6 8.6 12.6 10Z")
      ])
    ],
    gAnims: { nudge: tn("translate", ["0 0","-2.4 0","0 0"]) },
  },
  "arrow-left-big": { dur: 1.2, auto: false,
    parts: [
      G("nudge", [
        path("M17.4 10.2C18.4 10.25 19.2 11 19.2 12C19.2 13 18.4 13.75 17.4 13.75L12.8 13.75L12.8 17.4C12.8 18.7 11.3 19.4 10.3 18.6L4.3 12.75C3.5 11.9 3.5 10.7 4.3 10L10.3 4C11.3 3.2 12.8 3.9 12.8 5.25L12.8 10.25Z")
      ])
    ],
    gAnims: { nudge: tn("translate", ["0 0","-3.2 0","0 0"]) },
  },
  "arrow-left-double": { dur: 1.35, auto: false, pp: false,
    parts: [
      G("c2", [
        path("M11 6.4C9 7.9 6.5 9.9 6.5 12C6.5 14.1 9 16.1 11 17.6")
      ]),
      G("c1", [
        path("M18.2 6.4C16.2 7.9 13.7 9.9 13.7 12C13.7 14.1 16.2 16.1 18.2 17.6")
      ])
    ],
    gAnims: { c1: tn("translate", ["0 0","-2.2 0","0 0","0 0"], [0,0.18,0.4,1]), c2: tn("translate", ["0 0","0 0","-2.2 0","0 0","0 0"], [0,0.15,0.35,0.55,1]) },
  },
  "arrow-left-from-line": { dur: 1.3, auto: false,
    parts: [
      line(20.25, 7, 20.25, 17),
      G("nudge", [
        line(5, 12, 16.4, 12),
        path("M9.4 7.2C7.7 8.5 5.4 10.3 5.4 11.6C5.4 12.9 7.7 14.7 9.4 16")
      ])
    ],
    gAnims: { nudge: tn("translate", ["0 0","-2.6 0","0 0"]) },
  },
  "arrow-left-right": { dur: 1.6, auto: false, pp: false,
    parts: [
      G("west", [
        line(4.25, 7, 19.75, 7),
        path("M7.6 4.4C6.2 5.4 4.3 6.6 4.3 7C4.3 7.6 6.2 8.8 7.6 9.75")
      ]),
      G("east", [
        line(4.25, 17.1, 19.75, 17.1),
        path("M16.4 14.4C17.8 15.4 19.7 16.6 19.7 17.1C19.7 17.6 17.8 18.8 16.4 19.75")
      ])
    ],
    gAnims: { west: tn("translate", ["0 0","-2.2 0","0 0","0 0"], [0,0.18,0.38,1]), east: tn("translate", ["0 0","0 0","2.2 0","0 0","0 0"], [0,0.5,0.68,0.9,1]) },
  },
  "arrow-left-to-line": { dur: 1.3, auto: false,
    parts: [
      line(3.75, 6.4, 3.75, 17.6),
      G("nudge", [
        line(7.75, 12, 20.4, 12),
        path("M12.4 7.8C10.7 9 8.4 10.7 8.4 12C8.4 13.3 10.7 15 12.4 16.25")
      ])
    ],
    gAnims: { nudge: tn("translate", ["0 0","-2.4 0","0 0"]) },
  },
  "arrow-move-down-left": { dur: 1.5, auto: false,
    parts: [
      G("hook", [
        path("M20 4.4L20 7.6C20 11 18.6 13.6 15.8 15.5C13.6 17 10.8 17.6 7.8 17.6L5.4 17.6"),
        path("M8.8 14.4C7 15.7 5.4 16.9 5.4 17.6C5.4 18.3 7 19.5 8.8 20.75")
      ])
    ],
    gAnims: { hook: tn("translate", ["0 0","0 1.6","-2 1.6","0 0"]) },
  },
};
