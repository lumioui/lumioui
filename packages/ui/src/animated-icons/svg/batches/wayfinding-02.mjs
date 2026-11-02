const path = (d, a = {}) => ({ e: "path", a: { d, ...a } });
const circle = (cx, cy, r, a = {}) => ({ e: "circle", a: { cx, cy, r, ...a } });
const line = (x1, y1, x2, y2, a = {}) => ({ e: "line", a: { x1, y1, x2, y2, ...a } });
const rect = (x, y, w, h, rx, a = {}) => ({ e: "rect", a: { x, y, width: w, height: h, rx, ...a } });
const fill = (color = "currentColor") => ({ fill: color, stroke: "none" });
const an = (attr, values, times) => ({ kind: "attr", attr, values, times });
const tn = (type, values, times, extra = {}) => ({ kind: "transform", type, values, times, ...extra });
const A = (part, anims) => ({ ...part, anims });
const G = (id, children, a = {}) => ({ e: "g", g: id, a, children });

/* Sort signature — one deliberate lift of the index arrow, then a long rest. */
const sortLift = tn("translate", ["0 0", "0 -2.4", "0 0", "0 0"], [0, 0.2, 0.45, 1]);
/* Shrink signature — the heads squeeze in toward center, hold, release. */
const squeeze = (dx, dy) =>
  tn("translate", ["0 0", `${dx} ${dy}`, `${dx} ${dy}`, "0 0", "0 0"], [0, 0.28, 0.55, 0.82, 1]);

export const icons = {
  /* ---- move: bent shafts, head keeps the 45° point ---- */
  "arrow-move-down-right": { dur: 1.5, auto: false,
    parts: [
      G("hook", [
        path("M5.5 4.5L5.5 9C5.5 13.4 9.1 17 13.5 17L16.5 17"),
        path("M14.5 13.5C16.1 15.1 17.5 16.5 18.5 17L14.5 20.5")
      ])
    ],
    gAnims: { hook: tn("translate", ["0 0","0 1.6","2 1.6","0 0"]) },
  },
  "arrow-move-left-down": { dur: 1.5, auto: false,
    parts: [
      G("hook", [
        path("M7 7L10 7C14.1 7 17.5 10.4 17.5 14.5L17.5 16.75"),
        path("M9 11.5C7.2 9.7 5.7 8.2 4.5 7L9 2.5"),
        path("M14 15.8C15.4 17.4 16.6 18.8 17.5 19.75L21 15.75")
      ])
    ],
    gAnims: { hook: tn("translate", ["0 0","-1.4 1.4","0 0"]) },
  },
  "arrow-move-right-down": { dur: 1.5, auto: false,
    parts: [
      G("hook", [
        path("M17 7L14 7C9.9 7 6.5 10.4 6.5 14.5L6.5 16.75"),
        path("M15 2.5C16.8 4.3 18.3 5.8 19.5 7L15 11.5"),
        path("M3 15.8C4.4 17.4 5.6 18.8 6.5 19.75L10 15.75")
      ])
    ],
    gAnims: { hook: tn("translate", ["0 0","1.4 1.4","0 0"]) },
  },
  "arrow-move-up-left": { dur: 1.5, auto: false,
    parts: [
      G("hook", [
        path("M18.5 19.5L18.5 15C18.5 10.6 14.9 7 10.5 7L7.5 7"),
        path("M9.5 10.5C7.9 8.9 6.5 7.5 5.5 7L9.5 3.5")
      ])
    ],
    gAnims: { hook: tn("translate", ["0 0","0 -1.6","-2 -1.6","0 0"]) },
  },
  "arrow-move-up-right": { dur: 1.5, auto: false,
    parts: [
      G("hook", [
        path("M5.5 19.5L5.5 15C5.5 10.6 9.1 7 13.5 7L16.5 7"),
        path("M14.5 10.5C16.1 8.9 17.5 7.5 18.5 7L14.5 3.5")
      ])
    ],
    gAnims: { hook: tn("translate", ["0 0","0 -1.6","2 -1.6","0 0"]) },
  },

  /* ---- reload: two chasing arrows ---- */
  "arrow-reload-horizontal": { dur: 1.9, auto: false, pp: false,
    parts: [
      G("spin", [
        path("M18.5 6.5L10.5 6.5C7.9 6.5 6 8.4 6 11"),
        path("M15 2.5C16.7 4.2 18.1 5.6 19 6.5L15 10.5"),
        path("M5.5 17.5L13.5 17.5C16.1 17.5 18 15.6 18 13"),
        path("M9 21.5C7.3 19.8 5.9 18.4 5 17.5L9 13.5")
      ])
    ],
    gAnims: { spin: tn("rotate", ["0 12 12","360 12 12"]) },
  },
  "arrow-reload-vertical": { dur: 1.9, auto: false, pp: false,
    parts: [
      G("spin", [
        path("M6.5 5L6.5 13C6.5 15.6 8.4 17.5 11 17.5"),
        path("M2.5 8.5C4.2 6.8 5.6 5.4 6.5 4.5L10.5 8.5"),
        path("M17.5 19L17.5 11C17.5 8.4 15.6 6.5 13 6.5"),
        path("M13.5 15.8C15.2 17.5 16.6 18.9 17.5 19.75L21.5 15.75")
      ])
    ],
    gAnims: { spin: tn("rotate", ["0 12 12","360 12 12"]) },
  },

  /* ---- right family ---- */
  "arrow-right01": { dur: 1.1, auto: false,
    parts: [
      G("nudge", [
        path("M9.8 6.2C11.7 8.1 13.5 9.9 15.3 11.75L9.8 17.75")
      ])
    ],
    gAnims: { nudge: tn("translate", ["0 0","3 0","0 0"]) },
  },
  "arrow-right02": { dur: 1.15, auto: false,
    parts: [
      G("nudge", [
        line(4.5, 12, 18.75, 12),
        path("M13.6 6.7C15.6 8.7 17.2 10.2 18.9 11.75L13.6 17.25")
      ])
    ],
    gAnims: { nudge: tn("translate", ["0 0","3.2 0","0 0"]) },
  },
  "arrow-right03": { dur: 1.25, auto: false,
    parts: [
      G("nudge", [
        line(4.5, 12, 14.5, 12),
        path("M10.5 7.5C12.3 9.3 13.8 10.8 15 12L10.5 16.5")
      ]),
      line(19.5, 6.25, 19.5, 17.75)
    ],
    gAnims: { nudge: tn("translate", ["0 0","2.6 0","0 0"]) },
  },
  "arrow-right04": { dur: 1.2, auto: false,
    parts: [
      G("nudge", [
        line(4.5, 12, 14, 12),
        path("M13.8 7.9C15.5 9.2 17.2 10.5 19 11.75C19 11.75 19 12.6 19 12.6C17.2 13.9 15.5 15.2 13.8 16.5Z")
      ])
    ],
    gAnims: { nudge: tn("translate", ["0 0","2.6 0","0 0"]) },
  },
  "arrow-right05": { dur: 1.25, auto: false,
    parts: [
      G("nudge", [
        line(4.5, 12, 11.5, 12),
        path("M11.5 8.9L15.4 11.4L15.4 12.6L11.5 15.1Z")
      ]),
      line(19.5, 6.5, 19.5, 17.5)
    ],
    gAnims: { nudge: tn("translate", ["0 0","2.4 0","0 0"]) },
  },
  "arrow-right-big": { dur: 1.4, auto: true, parts: [
    path("M4 9.5h8V5.5L20.5 12 12 18.5v-4H4z"),
  ] },
  "arrow-right-double": { dur: 1.35, auto: false, pp: false,
    parts: [
      G("c2", [
        path("M6.5 6.5C8.4 8.4 10.1 10.1 11.5 12L6.5 17.5")
      ]),
      G("c1", [
        path("M13 6.5C14.9 8.4 16.6 10.1 18 12L13 17.5")
      ])
    ],
    gAnims: { c1: tn("translate", ["0 0","2.2 0","0 0","0 0"], [0,0.18,0.4,1]), c2: tn("translate", ["0 0","0 0","2.2 0","0 0","0 0"], [0,0.15,0.35,0.55,1]) },
  },
  "arrow-right-from-line": { dur: 1.3, auto: false,
    parts: [
      line(4.5, 6.75, 4.5, 17.25),
      G("nudge", [
        line(9, 12, 18.6, 12),
        path("M13.4 6.7C15.3 8.6 17 10.3 18.6 11.75L13.4 17.25")
      ])
    ],
    gAnims: { nudge: tn("translate", ["0 0","2.6 0","0 0"]) },
  },
  "arrow-right-to-line": { dur: 1.3, auto: false,
    parts: [
      G("nudge", [
        line(3.5, 12, 15.5, 12),
        path("M11 7.5C12.8 9.3 14.3 10.8 15.5 12L11 16.5")
      ]),
      line(19.75, 6.5, 19.75, 17.5)
    ],
    gAnims: { nudge: tn("translate", ["0 0","2.6 0","0 0"]) },
  },

  /* ---- shrink: corner-bracket heads on the diagonal ---- */
  "arrow-shrink": { dur: 1.7, auto: false, pp: false,
    parts: [
      G("tl", [
        line(3.75, 3.75, 10, 10),
        path("M10.4 6.6L10.4 8.9C10.4 9.7 9.7 10.4 8.9 10.4L6.6 10.4")
      ]),
      G("tr", [
        line(20.25, 3.75, 14, 10),
        path("M13.6 6.6L13.6 8.9C13.6 9.7 14.3 10.4 15.1 10.4L17.4 10.4")
      ]),
      G("bl", [
        line(3.75, 20.25, 10, 14),
        path("M10.4 17.4L10.4 15C10.4 14.3 9.7 13.6 8.9 13.6L6.6 13.6")
      ]),
      G("br", [
        line(20.25, 20.25, 14, 14),
        path("M13.6 17.4L13.6 15C13.6 14.3 14.3 13.6 15.1 13.6L17.4 13.6")
      ])
    ],
    gAnims: { tl: tn("translate", ["0 0","1.6 1.6","1.6 1.6","0 0","0 0"], [0,0.28,0.55,0.82,1]), tr: tn("translate", ["0 0","-1.6 1.6","-1.6 1.6","0 0","0 0"], [0,0.28,0.55,0.82,1]), bl: tn("translate", ["0 0","1.6 -1.6","1.6 -1.6","0 0","0 0"], [0,0.28,0.55,0.82,1]), br: tn("translate", ["0 0","-1.6 -1.6","-1.6 -1.6","0 0","0 0"], [0,0.28,0.55,0.82,1]) },
  },
  "arrow-shrink01": { dur: 1.6, auto: false, pp: false,
    parts: [
      G("tl", [
        line(3.5, 3.5, 10.25, 10.25),
        path("M10.6 6.4L10.6 9.4C10.6 10.1 10 10.6 9.3 10.6L6.4 10.6")
      ]),
      G("br", [
        line(20.5, 20.5, 13.75, 13.75),
        path("M13.4 17.6L13.4 14.6C13.4 13.9 14 13.4 14.7 13.4L17.6 13.4")
      ])
    ],
    gAnims: { tl: tn("translate", ["0 0","1.6 1.6","1.6 1.6","0 0","0 0"], [0,0.28,0.55,0.82,1]), br: tn("translate", ["0 0","-1.6 -1.6","-1.6 -1.6","0 0","0 0"], [0,0.28,0.55,0.82,1]) },
  },
  "arrow-shrink02": { dur: 1.6, auto: false, pp: false,
    parts: [
      G("tr", [
        line(20.5, 3.5, 13.75, 10.25),
        path("M13.4 6.4L13.4 9.4C13.4 10.1 14 10.6 14.7 10.6L17.6 10.6")
      ]),
      G("bl", [
        line(3.5, 20.5, 10.25, 13.75),
        path("M10.6 17.6L10.6 14.6C10.6 13.9 10 13.4 9.3 13.4L6.4 13.4")
      ])
    ],
    gAnims: { tr: tn("translate", ["0 0","-1.6 1.6","-1.6 1.6","0 0","0 0"], [0,0.28,0.55,0.82,1]), bl: tn("translate", ["0 0","1.6 -1.6","1.6 -1.6","0 0","0 0"], [0,0.28,0.55,0.82,1]) },
  },

  /* ---- turns: big soft elbows ---- */
  "arrow-turn-backward": { dur: 1.35, auto: false,
    parts: [
      G("nudge", [
        path("M11.5 6.5L15.5 6.5C18.3 6.5 20 8.5 20 10.75C20 13.1 18.3 15 15.5 15L7.5 15"),
        path("M9.2 10.8C7.5 12.5 6 14 5 15L9.2 19.25")
      ])
    ],
    gAnims: { nudge: tn("translate", ["0 0","-2.2 0","0 0"]) },
  },
  "arrow-turn-down": { dur: 1.35, auto: false,
    parts: [
      G("nudge", [
        path("M6.5 12.5L6.5 9C6.5 6.4 8.4 4.5 11 4.5C13.6 4.5 15.5 6.4 15.5 9L15.5 17"),
        path("M11.5 15.5C13.1 17.2 14.5 18.7 15.5 19.5L19.5 15.5")
      ])
    ],
    gAnims: { nudge: tn("translate", ["0 0","0 2.4","0 0"]) },
  },
  "arrow-turn-forward": { dur: 1.35, auto: false,
    parts: [
      G("nudge", [
        path("M12.5 6.5L8.5 6.5C5.7 6.5 4 8.5 4 10.75C4 13.1 5.7 15 8.5 15L16.5 15"),
        path("M14.8 10.8C16.5 12.5 18 14 19 15L14.8 19.25")
      ])
    ],
    gAnims: { nudge: tn("translate", ["0 0","2.2 0","0 0"]) },
  },
  "arrow-turn-up": { dur: 1.35, auto: false,
    parts: [
      G("nudge", [
        path("M6.5 11.5L6.5 15C6.5 17.6 8.4 19.5 11 19.5C13.6 19.5 15.5 17.6 15.5 15L15.5 7"),
        path("M11.5 8.5C13.1 6.8 14.5 5.3 15.5 4.5L19.5 8.5")
      ])
    ],
    gAnims: { nudge: tn("translate", ["0 0","0 -2.4","0 0"]) },
  },

  /* ---- up family ---- */
  "arrow-up01": { dur: 1.1, auto: false,
    parts: [
      G("nudge", [
        path("M6.3 14.7C8.2 12.8 10 11 11.9 9L17.9 14.75")
      ])
    ],
    gAnims: { nudge: tn("translate", ["0 0","0 -3","0 0"]) },
  },
  "arrow-up02": { dur: 1.15, auto: false,
    parts: [
      G("nudge", [
        line(12, 19, 12, 5.4),
        path("M6.8 10.6C8.8 8.6 10.4 7 12 5.4L17.2 10.6")
      ])
    ],
    gAnims: { nudge: tn("translate", ["0 0","0 -3.2","0 0"]) },
  },
  "arrow-up03": { dur: 1.25, auto: false,
    parts: [
      line(5, 4.25, 19, 4.25),
      G("nudge", [
        line(12, 20, 12, 8.5),
        path("M8 12.5C9.6 10.8 11 9.3 12 8.5L16 12.5")
      ])
    ],
    gAnims: { nudge: tn("translate", ["0 0","0 -2.6","0 0"]) },
  },
  "arrow-up04": { dur: 1.2, auto: false,
    parts: [
      G("nudge", [
        line(12, 20.5, 12, 13.75),
        path("M8.1 13.8C9.4 12.1 10.7 10.4 12 8.6C12 8.6 12.8 8.6 12.8 8.6C14.1 10.4 15.4 12.1 16.7 13.75Z")
      ])
    ],
    gAnims: { nudge: tn("translate", ["0 0","0 -2.6","0 0"]) },
  },
  "arrow-up05": { dur: 1.25, auto: false,
    parts: [
      line(6.25, 4.25, 17.75, 4.25),
      G("nudge", [
        line(12, 20.5, 12, 12.25),
        path("M8.9 12.3L11.4 8.6L12.6 8.6L15.1 12.25Z")
      ])
    ],
    gAnims: { nudge: tn("translate", ["0 0","0 -2.4","0 0"]) },
  },
  "arrow-up-az": { dur: 1.5, auto: false, pp: false,
    parts: [
      G("sort", [
        line(7, 19.5, 7, 5.5),
        path("M3.6 9.5C5 8.1 6.2 6.9 7 5.5L10.4 9.5")
      ]),
      path("M15.2 10L17.2 5.25L19.2 10"),
      line(16, 8.4, 18.5, 8.4),
      path("M15.3 14.5L19.5 14.5L15.5 19.5L19.8 19.5")
    ],
    gAnims: { sort: tn("translate", ["0 0","0 -2.4","0 0","0 0"], [0,0.2,0.45,1]) },
  },
  "arrow-up-big": { dur: 1.2, auto: false,
    parts: [
      G("nudge", [
        path("M10 19.4L10 13L7.4 13C6.5 13 6.1 12 6.7 11.4L11.3 6C11.7 5.5 12.4 5.5 12.8 6L17.4 11.4C18 12 17.6 13 16.7 13L14.1 13L14.1 19.4Z")
      ])
    ],
    gAnims: { nudge: tn("translate", ["0 0","0 -3.2","0 0"]) },
  },
  "arrow-up-double": { dur: 1.35, auto: false, pp: false,
    parts: [
      G("c1", [
        path("M6 10.5C7.9 8.6 9.7 6.8 11.5 5.5L17 10.5")
      ]),
      G("c2", [
        path("M6 17.5C7.9 15.6 9.7 13.8 11.5 12.5L17 17.5")
      ])
    ],
    gAnims: { c1: tn("translate", ["0 0","0 -2.2","0 0","0 0"], [0,0.18,0.4,1]), c2: tn("translate", ["0 0","0 0","0 -2.2","0 0","0 0"], [0,0.15,0.35,0.55,1]) },
  },
  "arrow-up-down": { dur: 1.6, auto: false, pp: false,
    parts: [
      G("up", [
        line(7.5, 19.5, 7.5, 5.75),
        path("M4 9.3C5.4 7.9 6.6 6.7 7.5 5.75L11 9.25")
      ]),
      G("down", [
        line(16.5, 4.5, 16.5, 18.25),
        path("M13 14.7C14.4 16.1 15.6 17.3 16.5 18.25L20 14.75")
      ])
    ],
    gAnims: { up: tn("translate", ["0 0","0 -2","0 0","0 0"], [0,0.18,0.38,1]), down: tn("translate", ["0 0","0 0","0 2","0 0","0 0"], [0,0.5,0.68,0.9,1]) },
  },
  "arrow-up-from-dot": { dur: 1.35, auto: false, pp: false,
    parts: [
      G("nudge", [
        line(12, 15.5, 12, 6),
        path("M7.5 10.5C9.3 8.7 10.8 7.2 12 6L16.5 10.5")
      ]),
      A(circle(12, 19.7, 1.3, fill()), [an("r", ["1.3","1.3","0.9","1.3"], [0,0.28,0.4,1])])
    ],
    gAnims: { nudge: tn("translate", ["0 0","0 -2.8","0 0","0 0"], [0,0.18,0.36,1]) },
  },
  "arrow-up-from-line": { dur: 1.5, auto: false, pp: false,
    parts: [
      line(4.5, 19.75, 19.5, 19.75),
      G("c1", [
        line(7.5, 16, 7.5, 6.5),
        path("M4.3 9.7C5.6 8.4 6.7 7.3 7.5 6.5L10.7 9.75")
      ]),
      G("c2", [
        line(16.5, 16, 16.5, 6.5),
        path("M13.3 9.7C14.6 8.4 15.7 7.3 16.5 6.5L19.7 9.75")
      ])
    ],
    gAnims: { c1: tn("translate", ["0 0","0 -2.4","0 0","0 0"], [0,0.18,0.4,1]), c2: tn("translate", ["0 0","0 0","0 -2.4","0 0","0 0"], [0,0.15,0.35,0.55,1]) },
  },
  "arrow-up-left01": { dur: 1.3, auto: false,
    parts: [
      G("nudge", [
        path("M15.5 6.6L9.8 6.6C8.2 6.6 6.9 7.9 6.9 9.5L6.9 15.25"),
        line(16.75, 16.75, 7.6, 7.6)
      ])
    ],
    gAnims: { nudge: tn("translate", ["0 0","-1.8 -1.8","0 0"]) },
  },
  "arrow-up-left02": { dur: 1.3, auto: false,
    parts: [
      G("nudge", [
        path("M7.4 6.8L11.3 7.25C11.9 7.25 12.2 7.9 11.8 8.4L7.8 12.4C7.3 12.8 6.6 12.5 6.6 12L6.2 8C6.2 7.3 6.7 6.75 7.4 6.75Z"),
        line(17.5, 17.5, 9.75, 9.75)
      ])
    ],
    gAnims: { nudge: tn("translate", ["0 0","-1.8 -1.8","0 0"]) },
  },
  "arrow-up-narrow-wide": { dur: 1.5, auto: false, pp: false,
    parts: [
      G("sort", [
        line(7, 19.5, 7, 5.5),
        path("M3.6 9.5C5 8.1 6.2 6.9 7 5.5L10.4 9.5")
      ]),
      line(13, 11.5, 17.5, 11.5),
      line(13, 15.5, 19, 15.5),
      line(13, 19.5, 20.5, 19.5)
    ],
    gAnims: { sort: tn("translate", ["0 0","0 -2.4","0 0","0 0"], [0,0.2,0.45,1]) },
  },
  "arrow-up-one-zero": { dur: 1.5, auto: false, pp: false,
    parts: [
      G("sort", [
        line(7, 19.5, 7, 5.5),
        path("M3.6 9.5C5 8.1 6.2 6.9 7 5.5L10.4 9.5")
      ]),
      path("M15.8 6.4L17.8 4.75L17.8 10"),
      line(15.25, 10, 20.6, 10),
      rect(16, 14, 4, 6, 2)
    ],
    gAnims: { sort: tn("translate", ["0 0","0 -2.4","0 0","0 0"], [0,0.2,0.45,1]) },
  },
  "arrow-up-right01": { dur: 1.3, auto: false,
    parts: [
      G("nudge", [
        path("M8.5 6.6L14.2 6.6C15.8 6.6 17.1 7.9 17.1 9.5L17.1 15.25"),
        line(7.25, 16.75, 16.4, 7.6)
      ])
    ],
    gAnims: { nudge: tn("translate", ["0 0","1.8 -1.8","0 0"]) },
  },
  "arrow-up-right02": { dur: 1.3, auto: false,
    parts: [
      G("nudge", [
        path("M16.6 6.8L12.7 7.25C12.1 7.25 11.8 7.9 12.2 8.4L16.2 12.4C16.7 12.8 17.4 12.5 17.4 12L17.8 8C17.8 7.3 17.3 6.75 16.6 6.75Z"),
        line(6.5, 17.5, 14.25, 9.75)
      ])
    ],
    gAnims: { nudge: tn("translate", ["0 0","1.8 -1.8","0 0"]) },
  },
  "arrow-up-right03": { dur: 1.3, auto: false,
    parts: [
      G("nudge", [
        path("M8.2 6.6L12.4 6.6C15.2 6.6 17.3 8.5 17.3 11.25L17.3 16.25"),
        line(6.25, 17.75, 16.5, 7.5)
      ])
    ],
    gAnims: { nudge: tn("translate", ["0 0","1.8 -1.8","0 0"]) },
  },
  "arrow-up-right-stack": { dur: 1.5, auto: false, pp: false,
    parts: [
      G("inner", [
        path("M6 9.5L10.8 9.5C12.8 9.5 14.4 11.1 14.4 13L14.4 18.5")
      ]),
      G("outer", [
        path("M6 5L14.6 5C17.9 5 20 7.1 20 10.4L20 18.5")
      ]),
      A(line(5.75, 18.75, 13.25, 10.25), [tn("translate", ["0 0","1.2 -1.2","0 0","0 0"], [0,0.18,0.4,1])])
    ],
    gAnims: { inner: tn("translate", ["0 0","1.2 -1.2","0 0","0 0"], [0,0.18,0.4,1]), outer: tn("translate", ["0 0","0 0","1.6 -1.6","0 0","0 0"], [0,0.15,0.38,0.58,1]) },
  },
  "arrow-up-to-line": { dur: 1.3, auto: false,
    parts: [
      line(5.5, 4.25, 18.5, 4.25),
      G("nudge", [
        line(12, 20.5, 12, 7.5),
        path("M7.5 11.8C9.3 10.1 10.8 8.6 12 7.5L16.5 11.75")
      ])
    ],
    gAnims: { nudge: tn("translate", ["0 0","0 -2.8","0 0"]) },
  },
  "arrow-up-wide-narrow": { dur: 1.5, auto: false, pp: false,
    parts: [
      G("sort", [
        line(7, 19.5, 7, 5.5),
        path("M3.6 9.5C5 8.1 6.2 6.9 7 5.5L10.4 9.5")
      ]),
      line(13, 11.5, 20.5, 11.5),
      line(13, 15.5, 19, 15.5),
      line(13, 19.5, 17.5, 19.5)
    ],
    gAnims: { sort: tn("translate", ["0 0","0 -2.4","0 0","0 0"], [0,0.2,0.45,1]) },
  },
  "arrow-up-za": { dur: 1.5, auto: false, pp: false,
    parts: [
      G("sort", [
        line(7, 19.5, 7, 5.5),
        path("M3.6 9.5C5 8.1 6.2 6.9 7 5.5L10.4 9.5")
      ]),
      path("M15.3 4.6L19.5 4.6L15.5 9.6L19.8 9.6"),
      path("M15.2 19.7L17.2 14.9L19.2 19.75"),
      line(16, 18.1, 18.5, 18.1)
    ],
    gAnims: { sort: tn("translate", ["0 0","0 -2.4","0 0","0 0"], [0,0.2,0.45,1]) },
  },
  "arrow-up-zero-one": { dur: 1.5, auto: false, pp: false,
    parts: [
      G("sort", [
        line(7, 19.5, 7, 5.5),
        path("M3.6 9.5C5 8.1 6.2 6.9 7 5.5L10.4 9.5")
      ]),
      rect(16, 4, 4, 6, 2),
      path("M15.8 16.5L17.8 14.75L17.8 20"),
      line(15.25, 20, 20.6, 20)
    ],
    gAnims: { sort: tn("translate", ["0 0","0 -2.4","0 0","0 0"], [0,0.2,0.45,1]) },
  },
};
