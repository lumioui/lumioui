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

/* Shared Lumio cursor — plump arrow pointing up-left, ~16×16. */
const CURSOR =
  "M4.8 4.4C6.2 3.5 8.2 3.5 10 4.5l6.6 2.7c1.9.8 2.7 1.8 2.3 3-.4 1.1-1.8 1.6-3.5 2.1l-2.2.7c-.9.3-1.4.8-1.7 1.6l-1 2.3c-.8 1.7-1.7 2.8-2.8 2.5-1-.3-1.7-1.7-2.2-3.5l-1.6-6c-.4-1.7-.4-3.8.9-4.8z";
const CUR = (t) => G("cur", [path(CURSOR)], { transform: t });

/* Plump pointing hand (index up), ~12×15 — drag glyphs share it. */
const HAND =
  "M9.8 21.2v-1.1c0-.7-.2-1.3-.6-1.8l-3.2-4.3c-.9-1.2-.3-2.7 1.1-3 1-.2 2 .4 2.8 1.4l1.1 1.4V6.2a1.7 1.7 0 0 1 3.4 0v5.1l3.6.8c1.9.4 2.7 1.3 2.7 3.1v1.2c0 2.2-1.2 3.8-2.9 4.5-.7.3-1.5.4-2.4.4h-3.6z";
/* Two-finger hand — index + middle up. */
const HAND2 =
  "M8.6 21.2v-1.1c0-.7-.2-1.3-.6-1.8l-3.1-4.3c-.9-1.2-.4-2.7 1-3 1-.2 2 .4 2.7 1.4l1.1 1.4V6.4a1.5 1.5 0 0 1 3 0v4.1a1.5 1.5 0 0 1 3-.3v2.5l2.6.7c1.7.5 2.4 1.4 2.4 3v1.3c0 2-1.1 3.5-2.7 4.2-.7.3-1.4.3-2.2.3H8.6z";

const door = (extra = "") =>
  `M6.5 21V7.4C6.5 4.8 8.4 3.2 12 3.2s5.5 1.6 5.5 4.2V21${extra}`;
const dots = (cx, cy, r, gap = 3.1) =>
  circle(cx, cy, r, { "stroke-dasharray": `0.6 ${gap}`, "stroke-linecap": "round" });

/* Signpost sway — a board swinging on its post mount. */
const sway = (px, py, a1 = 6, a2 = -4.5) =>
  tn("rotate", [`0 ${px} ${py}`, `${a1} ${px} ${py}`, `${a2} ${px} ${py}`, `0 ${px} ${py}`], [0, 0.3, 0.65, 1]);

export const icons = {
  "cursor-move02": { dur: 1.7, auto: false, pp: false,
    parts: [
      G("cur", [
        path("M4.8 4.4C6.2 3.5 8.2 3.5 10 4.5L16.6 7.25C18.5 8 19.3 9 18.9 10.25C18.5 11.3 17.1 11.8 15.4 12.25L13.2 13C12.3 13 11.5 13.8 11.5 14.6L10.5 16.9C9.7 18.6 8.8 19.4 7.7 19.4C6.7 19.4 6 17.7 5.5 15.9L3.9 9.9C3.5 8.2 3.5 6.1 4.8 5Z")
      ], {"transform":"translate(-1 -1) scale(0.74)"}),
      G("roam", [
        line(17.5, 13.6, 17.5, 21.4),
        line(13.6, 17.5, 21.4, 17.5),
        path("M16.3 14.8L17.5 13.6L18.7 14.75M16.3 20.2L17.5 21.4L18.7 20.25"),
        path("M14.8 16.3L13.6 17.5L14.8 18.75M20.2 16.3L21.4 17.5L20.2 18.75")
      ])
    ],
    gAnims: { roam: tn("translate", ["0 0","0 -1.3","1.3 0","0 1.3","-1.3 0","0 0"], [0,0.2,0.4,0.6,0.8,1]) },
  },
  "cursor-pointer01": { dur: 1.45, auto: false, pp: false,
    parts: [
      A(circle(9, 9, 6.4), [an("r", ["6.4","6.9","6.4","6.4"], [0,0.3,0.6,1])]),
      A(circle(9, 9, 3.4), [an("r", ["3.4","2.5","3.4","3.4"], [0,0.3,0.6,1])]),
      G("cur", [
        path("M4.8 4.4C6.2 3.5 8.2 3.5 10 4.5L16.6 7.25C18.5 8 19.3 9 18.9 10.25C18.5 11.3 17.1 11.8 15.4 12.25L13.2 13C12.3 13 11.5 13.8 11.5 14.6L10.5 16.9C9.7 18.6 8.8 19.4 7.7 19.4C6.7 19.4 6 17.7 5.5 15.9L3.9 9.9C3.5 8.2 3.5 6.1 4.8 5Z")
      ], {"transform":"translate(5.4 5.4) scale(0.72)"})
    ],
  },
  "cursor-pointer02": { dur: 1.45, auto: false, pp: false,
    parts: [
      A(circle(12, 12, 7.4), [an("r", ["7.4","6.5","7.4","7.4"], [0,0.3,0.6,1]), an("opacity", ["1","0.55","1","1"], [0,0.3,0.6,1])]),
      /* NW cursor arrow centered inside the click ring (canonical arrow, scaled in) */
      G("cur", [
        path("M4.8 4.4C6.2 3.5 8.2 3.5 10 4.5L16.6 7.25C18.5 8 19.3 9 18.9 10.25C18.5 11.3 17.1 11.8 15.4 12.25L13.2 13C12.3 13 11.5 13.8 11.5 14.6L10.5 16.9C9.7 18.6 8.8 19.4 7.7 19.4C6.7 19.4 6 17.7 5.5 15.9L3.9 9.9C3.5 8.2 3.5 6.1 4.8 5Z")
      ], {"transform":"translate(6.5 6.5) scale(0.55)"})
    ],
  },
  "cursor-progress01": { dur: 1.8, auto: false, pp: false,
    parts: [
      G("cur", [
        path("M4.8 4.4C6.2 3.5 8.2 3.5 10 4.5L16.6 7.25C18.5 8 19.3 9 18.9 10.25C18.5 11.3 17.1 11.8 15.4 12.25L13.2 13C12.3 13 11.5 13.8 11.5 14.6L10.5 16.9C9.7 18.6 8.8 19.4 7.7 19.4C6.7 19.4 6 17.7 5.5 15.9L3.9 9.9C3.5 8.2 3.5 6.1 4.8 5Z")
      ], {"transform":"translate(-1 -1) scale(0.8)"}),
      G("spin", [
        path("M15.9 3.9A4.8 4.8 0 0 1 20.9 9.75", {"stroke-dasharray":"0.8 2.3","stroke-linecap":"round"})
      ])
    ],
    gAnims: { spin: tn("rotate", ["0 16.1 8.7","360 16.1 8.7"]) },
  },
  "cursor-progress02": { dur: 1.8, auto: false, pp: false,
    parts: [
      G("cur", [
        path("M4.8 4.4C6.2 3.5 8.2 3.5 10 4.5L16.6 7.25C18.5 8 19.3 9 18.9 10.25C18.5 11.3 17.1 11.8 15.4 12.25L13.2 13C12.3 13 11.5 13.8 11.5 14.6L10.5 16.9C9.7 18.6 8.8 19.4 7.7 19.4C6.7 19.4 6 17.7 5.5 15.9L3.9 9.9C3.5 8.2 3.5 6.1 4.8 5Z")
      ], {"transform":"translate(-1 -1) scale(0.8)"}),
      circle(16, 7.25, 3.75),
      G("hands", [
        path("M16 7.2L16 5.25M16 7.2L17.7 8.25")
      ])
    ],
    gAnims: { hands: tn("rotate", ["0 16 7.2","360 16 7.2"]) },
  },
  "cursor-progress03": { dur: 1.8, auto: false, pp: false,
    parts: [
      G("cur", [
        path("M4.8 4.4C6.2 3.5 8.2 3.5 10 4.5L16.6 7.25C18.5 8 19.3 9 18.9 10.25C18.5 11.3 17.1 11.8 15.4 12.25L13.2 13C12.3 13 11.5 13.8 11.5 14.6L10.5 16.9C9.7 18.6 8.8 19.4 7.7 19.4C6.7 19.4 6 17.7 5.5 15.9L3.9 9.9C3.5 8.2 3.5 6.1 4.8 5Z")
      ], {"transform":"translate(-1 -1) scale(0.8)"}),
      G("spin", [
        circle(17, 17, 4, {"stroke-dasharray":"0.6 3.1","stroke-linecap":"round"})
      ])
    ],
    gAnims: { spin: tn("rotate", ["0 17 17","360 17 17"]) },
  },
  "cursor-progress04": { dur: 1.8, auto: false, pp: false,
    parts: [
      G("cur", [
        path("M4.8 4.4C6.2 3.5 8.2 3.5 10 4.5L16.6 7.25C18.5 8 19.3 9 18.9 10.25C18.5 11.3 17.1 11.8 15.4 12.25L13.2 13C12.3 13 11.5 13.8 11.5 14.6L10.5 16.9C9.7 18.6 8.8 19.4 7.7 19.4C6.7 19.4 6 17.7 5.5 15.9L3.9 9.9C3.5 8.2 3.5 6.1 4.8 5Z")
      ], {"transform":"translate(-1 -1) scale(0.8)"}),
      rect(13.5, 13.5, 7, 7, 2.3),
      G("hands", [
        path("M17 17L17 14.75M17 17L19 18.25")
      ])
    ],
    gAnims: { hands: tn("rotate", ["0 17 17","360 17 17"]) },
  },
  "cursor-rectangle-selection01": { dur: 1.6, auto: false,
    parts: [
      A(rect(3.6, 3.6, 15.75, 15.25, 3, {"stroke-dasharray":"3.4 3.4","stroke-linecap":"round"}), [an("stroke-dashoffset", [0,-50.73])]),
      G("cur", [
        path("M4.8 4.4C6.2 3.5 8.2 3.5 10 4.5L16.6 7.25C18.5 8 19.3 9 18.9 10.25C18.5 11.3 17.1 11.8 15.4 12.25L13.2 13C12.3 13 11.5 13.8 11.5 14.6L10.5 16.9C9.7 18.6 8.8 19.4 7.7 19.4C6.7 19.4 6 17.7 5.5 15.9L3.9 9.9C3.5 8.2 3.5 6.1 4.8 5Z")
      ], {"transform":"translate(6 6.4) scale(0.68)"})
    ],
  },
  "cursor-rectangle-selection02": { dur: 1.6, auto: false,
    parts: [
      A(rect(3.4, 4.25, 15.4, 14.4, 3.25, {"stroke-dasharray":"3.4 3.4","stroke-linecap":"round"}), [an("stroke-dashoffset", [0,-47.39])]),
      G("cur", [
        path("M4.8 4.4C6.2 3.5 8.2 3.5 10 4.5L16.6 7.25C18.5 8 19.3 9 18.9 10.25C18.5 11.3 17.1 11.8 15.4 12.25L13.2 13C12.3 13 11.5 13.8 11.5 14.6L10.5 16.9C9.7 18.6 8.8 19.4 7.7 19.4C6.7 19.4 6 17.7 5.5 15.9L3.9 9.9C3.5 8.2 3.5 6.1 4.8 5Z")
      ], {"transform":"translate(6.4 7) scale(0.66)"})
    ],
  },
  "cursor-remove-selection01": { dur: 1.3, auto: false, pp: false,
    parts: [
      G("cur", [
        path("M4.8 4.4C6.2 3.5 8.2 3.5 10 4.5L16.6 7.25C18.5 8 19.3 9 18.9 10.25C18.5 11.3 17.1 11.8 15.4 12.25L13.2 13C12.3 13 11.5 13.8 11.5 14.6L10.5 16.9C9.7 18.6 8.8 19.4 7.7 19.4C6.7 19.4 6 17.7 5.5 15.9L3.9 9.9C3.5 8.2 3.5 6.1 4.8 5Z")
      ], {"transform":"translate(-1.5 -1.5) scale(0.82)"}),
      A(line(15.25, 7, 19.6, 7), [an("opacity", ["1","1","0.2","1","1"], [0,0.42,0.5,0.58,1])])
    ],
  },
  "cursor-remove-selection02": { dur: 1.3, auto: false, pp: false,
    parts: [
      G("cur", [
        path("M4.8 4.4C6.2 3.5 8.2 3.5 10 4.5L16.6 7.25C18.5 8 19.3 9 18.9 10.25C18.5 11.3 17.1 11.8 15.4 12.25L13.2 13C12.3 13 11.5 13.8 11.5 14.6L10.5 16.9C9.7 18.6 8.8 19.4 7.7 19.4C6.7 19.4 6 17.7 5.5 15.9L3.9 9.9C3.5 8.2 3.5 6.1 4.8 5Z")
      ], {"transform":"translate(-1.5 -1.5) scale(0.82)"}),
      A(line(14.75, 18.6, 19.25, 18.6), [an("opacity", ["1","1","0.2","1","1"], [0,0.42,0.5,0.58,1])])
    ],
  },
  // centered I-beam caret blinking between two ragged text lines — the old
  // "A + caret" read as literal "AI" letters. Blink IS the caret gesture.
  "cursor-text": { dur: 1.4, auto: false, pp: false,
    parts: [
      line(3.6, 7.4, 6.8, 7.4),
      line(3.6, 12, 6.2, 12),
      line(3.6, 16.6, 5.4, 16.6),
      line(17.6, 7.4, 20.4, 7.4),
      line(18.2, 12, 20.4, 12),
      line(17.6, 16.6, 20.4, 16.6),
      A(path("M9.4 4.2c.8 0 1.6.4 1.9 1.1M11.3 5.3c.3-.7 1.1-1.1 1.9-1.1M11.3 5.3v13.4M9.4 19.8c.8 0 1.6-.4 1.9-1.1M11.3 18.7c.3.7 1.1 1.1 1.9 1.1"), [
        an("opacity", ["1","1","0.15","1","1"], [0,0.42,0.5,0.58,1]),
      ]),
    ],
  },
  "direction-left01": { dur: 1.4, auto: true, parts: [
    path("M20 5.5H9L4.5 9 9 12.5h11Z"),
    path("M14.5 12.5V21"),
  ] },
  "direction-left02": { dur: 1.4, auto: true, parts: [
    path("M17 3.5H8.5L5 6.5 8.5 9.5H17Z"),
    path("M8 12.5h8.5l3.5 3-3.5 3H8Z"),
    path("M12.5 9.5v3M12.5 18.5V21"),
  ] },
  "direction-right01": { dur: 1.6, auto: false,
    parts: [line(12, 3.5, 12, 20.5), G("board", [path("M12 5.2h6.4l2.4 2.4-2.4 2.4H12")])],
    gAnims: { board: tn("translate", ["0 0", "0.8 0", "0 0"]) } },
  "direction-right02": { dur: 1.6, auto: false,
    parts: [line(12, 3.5, 12, 20.5), line(8.5, 20.5, 15.5, 20.5), G("board", [path("M12 5.2h6.4l2.4 2.4-2.4 2.4H12")])],
    gAnims: { board: tn("translate", ["0 0", "0.8 0", "0 0"]) } },
  "directions01": { dur: 1.7, auto: false,
    parts: [line(12, 3.5, 12, 20.5), G("r", [path("M12 5.2h6.4l2.4 2.4-2.4 2.4H12")]), G("l", [path("M12 11.8H5.6L3.2 14.2l2.4 2.4H12")])],
    gAnims: { r: tn("translate", ["0 0", "0.8 0", "0 0"]), l: tn("translate", ["0 0", "-0.8 0", "0 0"]) } },
  "directions02": { dur: 1.7, auto: false,
    parts: [line(12, 3.5, 12, 20.5), line(8.5, 20.5, 15.5, 20.5), G("r", [path("M12 5.2h6.4l2.4 2.4-2.4 2.4H12")]), G("l", [path("M12 11.8H5.6L3.2 14.2l2.4 2.4H12")])],
    gAnims: { r: tn("translate", ["0 0", "0.8 0", "0 0"]), l: tn("translate", ["0 0", "-0.8 0", "0 0"]) } },
  door: { dur: 1.35, auto: false,
    parts: [
      G("panel", [
        path("M6.5 21L6.5 7.4C6.5 4.8 8.4 3.25 12 3.25C15.6 3.25 17.5 4.8 17.5 7.4L17.5 21"),
        rect(9.4, 6.6, 5.2, 4.8, 1.4),
        circle(9.4, 15.4, 1, fill())
      ]),
      line(3.25, 21, 20.75, 21)
    ],
    gAnims: { panel: tn("translate", ["0 0","-0.5 0","0.5 0","0 0"], [0,0.12,0.24,1]) },
  },
  "door-closed": { dur: 1.4, auto: false, pp: false,
    parts: [
      G("panel", [
        path("M6.5 21L6.5 7.4C6.5 4.8 8.4 3.25 12 3.25C15.6 3.25 17.5 4.8 17.5 7.4L17.5 21"),
        rect(9.4, 6.4, 5.2, 3.8, 1.3),
        A(circle(9.4, 14.2, 1, fill()), [an("r", ["1","1.3","1","1"], [0,0.3,0.55,1])])
      ]),
      line(3.25, 21, 20.75, 21)
    ],
    gAnims: { panel: tn("translate", ["0 0","0.5 0","-0.4 0","0 0","0 0"], [0,0.1,0.22,0.34,1]) },
  },
  "door-closed-locked": { dur: 1.7, auto: false,
    parts: [
      /* door arch stops short of the lock; the cramped window is dropped */
      path("M5.5 21L5.5 7.4C5.5 4.9 7.3 3.4 10.5 3.4C13.5 3.4 15.2 4.8 15.2 7.25L15.2 9.8"),
      circle(8.4, 13, 1.1, fill()),
      G("lock", [
        path("M16.6 16.2v-1.5c0-1.1.9-2 2-2s2 .9 2 2v1.5"),
        rect(15.3, 16.2, 6.2, 4.7, 1.3),
      ]),
      line(3.25, 21, 11.2, 21)
    ],
    gAnims: { lock: tn("rotate", ["0 18.4 16.2","7 18.4 16.2","-5 18.4 16.2","0 18.4 16.2"], [0,0.3,0.65,1]) },
  },
  "door-lock": { dur: 1.6, auto: false,
    parts: [
      path("M6.5 21L6.5 7.4C6.5 4.8 8.4 3.25 12 3.25C15.6 3.25 17.5 4.8 17.5 7.4L17.5 21"),
      G("lift", [
        G("swing", [
          path("M10.3 13.6L10.3 12.25A1.7 1.7 0 0 1 13.7 12.25L13.7 13.6")
        ])
      ]),
      circle(12, 15.6, 2.75),
      circle(12, 15.6, 0.7, fill()),
      line(3.25, 21, 20.75, 21)
    ],
    gAnims: { lift: tn("translate", ["0 0","0 -1","0 -1"], [0,0.45,1]), swing: tn("rotate", ["0 13.7 13.6","0 13.7 13.6","-50 13.7 13.6"], [0,0.25,1]) },
  },
  "door-open": { dur: 1.8, auto: false,
    parts: [
      G("leaf", [
        path("M5.5 20.2L5.5 7.6C5.5 6.1 6 5.3 7.3 4.75L10.5 3.75C12.1 3.1 13.3 4 13.3 5.75L13.3 18.25C13.3 20 12.1 20.8 10.5 20.25L7.3 19C6 18.6 5.5 17.8 5.5 16.25Z")
      ]),
      path("M16.6 4.6L17.5 4.6C19 4.6 19.9 5.5 19.9 7L19.9 17C19.9 18.5 19 19.4 17.5 19.4L16.6 19.4"),
      A(line(9.75, 11.25, 9.75, 13.25), [tn("rotate", ["0 5.5 13","6 5.5 13","-4 5.5 13","0 5.5 13"], [0,0.3,0.65,1])])
    ],
    gAnims: { leaf: tn("rotate", ["0 5.5 13","6 5.5 13","-4 5.5 13","0 5.5 13"], [0,0.3,0.65,1]) },
  },
  door01: { dur: 1.8, auto: false,
    parts: [
      G("leaf", [
        path("M4.6 7.6L4.6 17C4.6 18.7 5 19.6 6.2 20.1L9 21.25C10.6 21.8 11.7 21.3 11.7 19.5L11.7 5C11.7 3.1 10.6 2.6 9 3.25L6.2 4.5C5 5 4.6 5.9 4.6 7.6Z")
      ]),
      path("M17.4 20.4L18 20.4C19.4 20.4 20.3 19.5 20.3 18.25L20.3 5.75C20.3 4.5 19.4 3.6 18 3.6L17.4 3.6"),
      A(circle(10, 12, 0.8, fill()), [tn("rotate", ["0 4.6 12.5","6 4.6 12.5","-4 4.6 12.5","0 4.6 12.5"], [0,0.3,0.65,1])])
    ],
    gAnims: { leaf: tn("rotate", ["0 4.6 12.5","6 4.6 12.5","-4 4.6 12.5","0 4.6 12.5"], [0,0.3,0.65,1]) },
  },
  door02: { dur: 1.35, auto: false,
    parts: [
      G("panel", [
        path("M7 21L7 10.25C7 6.3 8.7 3.75 12 3.75C15.3 3.75 17 6.3 17 10.25L17 21"),
        circle(14.8, 12.4, 0.8, fill())
      ]),
      line(3.25, 21, 20.75, 21)
    ],
    gAnims: { panel: tn("translate", ["0 0","0.5 0","-0.5 0","0 0"], [0,0.12,0.24,1]) },
  },
  "drag-drop": {
    dur: 1.7,
    auto: false,
    pp: false,
    parts: [
      /* dashed drop zone; the arrow dips into it */
      rect(4.6, 11.4, 14.8, 9.4, 2.2, { "stroke-dasharray": "2.8 2.4" }),
      G("pick", [
        path("M12 3.6v7.4"),
        path("M8.5 7.6l3.5 3.5 3.5-3.5"),
      ]),
    ],
    gAnims: { pick: tn("translate", ["0 0", "0 1.7", "0 1.7", "0 0", "0 0"], [0, 0.25, 0.5, 0.78, 1]) },
  },
  "drag-drop-horizontal": {
    dur: 1.7,
    auto: false,
    pp: false,
    parts: [
      G("pick", [
        circle(6, 9, 1.6),
        circle(12, 9, 1.6),
        circle(18, 9, 1.6),
        circle(6, 15, 1.6),
        circle(12, 15, 1.6),
        circle(18, 15, 1.6),
      ]),
    ],
    gAnims: { pick: tn("translate", ["0 0", "2.6 0", "2.6 0", "0 0", "0 0"], [0, 0.25, 0.5, 0.78, 1]) },
  },
  "drag-drop-vertical": {
    dur: 1.7,
    auto: false,
    pp: false,
    parts: [
      G("pick", [
        circle(9, 6, 1.6),
        circle(15, 6, 1.6),
        circle(9, 12, 1.6),
        circle(15, 12, 1.6),
        circle(9, 18, 1.6),
        circle(15, 18, 1.6),
      ]),
    ],
    gAnims: { pick: tn("translate", ["0 0", "0 2.6", "0 2.6", "0 0", "0 0"], [0, 0.25, 0.5, 0.78, 1]) },
  },
  drag01: { dur: 1.7, auto: false, pp: false,
    parts: [
      G("swipe", [
        path("M8.6 21.2L8.6 20C8.6 19.4 8.4 18.8 8 18.25L4.9 14C4 12.8 4.5 11 5.9 11C6.9 11 7.9 11.4 8.6 12.4L9.7 13.75L9.7 6.4A1.5 1.5 0 0 1 12.7 6.4L12.7 10.5A1.5 1.5 0 0 1 15.7 10.25L15.7 12.75L18.3 13.4C20 13.9 20.7 14.8 20.7 16.4L20.7 17.75C20.7 19.7 19.6 21.2 18 21.9C17.3 21.9 16.6 22.25 15.8 22.25L8.6 22.25Z")
      ]),
      path("M6.6 3.5L3.4 3.5M4.6 2.3L3.3 3.5L4.6 4.75"),
      path("M17.4 3.5L20.6 3.5M19.4 2.3L20.7 3.5L19.4 4.75")
    ],
    gAnims: { swipe: tn("translate", ["0 0","-2.4 0","2.4 0","0 0"], [0,0.32,0.68,1]) },
  },
  drag02: { dur: 1.8, auto: false, pp: false,
    parts: [
      G("tilt", [
        path("M9.8 21.2L9.8 20C9.8 19.4 9.6 18.8 9.2 18.25L6 14C5.1 12.8 5.7 11 7.1 11C8.1 11 9.1 11.4 9.9 12.4L11 13.75L11 6.25A1.7 1.7 0 0 1 14.4 6.25L14.4 11.25L18 12.1C19.9 12.5 20.7 13.4 20.7 15.25L20.7 16.4C20.7 18.6 19.5 20.2 17.8 21C17.1 21 16.3 21.25 15.4 21.25L11.8 21.25Z")
      ], {"transform":"rotate(-32 12 15)"}),
      G("ring", [
        circle(6.4, 5.2, 2.2, {"stroke-dasharray":"0.6 2.9","stroke-linecap":"round"})
      ]),
      G("ring2", [
        circle(3.7, 10.4, 1.5, {"stroke-dasharray":"0.6 2.3","stroke-linecap":"round"})
      ]),
      path("M5.2 8L4.4 9")
    ],
    gAnims: { tilt: tn("rotate", ["0 12 15","10 12 15","0 12 15"], undefined, {"additive":"sum"}), ring: tn("rotate", ["0 6.4 5.2","360 6.4 5.2"]), ring2: tn("rotate", ["360 3.7 10.4","0 3.7 10.4"]) },
  },
  drag03: { dur: 1.7, auto: false,
    parts: [
      G("tilt", [
        path("M9.8 21.2L9.8 20C9.8 19.4 9.6 18.8 9.2 18.25L6 14C5.1 12.8 5.7 11 7.1 11C8.1 11 9.1 11.4 9.9 12.4L11 13.75L11 6.25A1.7 1.7 0 0 1 14.4 6.25L14.4 11.25L18 12.1C19.9 12.5 20.7 13.4 20.7 15.25L20.7 16.4C20.7 18.6 19.5 20.2 17.8 21C17.1 21 16.3 21.25 15.4 21.25L11.8 21.25Z")
      ]),
      path("M6.6 3.5L3.4 3.5M4.6 2.3L3.3 3.5L4.6 4.75"),
      path("M17.4 3.5L20.6 3.5M19.4 2.3L20.7 3.5L19.4 4.75")
    ],
    gAnims: { tilt: tn("rotate", ["0 12 21","-6 12 21","5 12 21","0 12 21"], [0,0.3,0.65,1]) },
  },
  drag04: { dur: 1.8, auto: false, pp: false,
    parts: [
      G("tilt", [
        path("M9.8 21.2L9.8 20C9.8 19.4 9.6 18.8 9.2 18.25L6 14C5.1 12.8 5.7 11 7.1 11C8.1 11 9.1 11.4 9.9 12.4L11 13.75L11 6.25A1.7 1.7 0 0 1 14.4 6.25L14.4 11.25L18 12.1C19.9 12.5 20.7 13.4 20.7 15.25L20.7 16.4C20.7 18.6 19.5 20.2 17.8 21C17.1 21 16.3 21.25 15.4 21.25L11.8 21.25Z")
      ], {"transform":"rotate(-32 12 15)"}),
      G("arc", [
        path("M6.8 3.4A3.2 3.2 0 0 0 3.8 8", {"stroke-dasharray":"0.6 2.8","stroke-linecap":"round"})
      ]),
      G("arc2", [
        path("M4.4 10.6A2.8 2.8 0 0 0 8.6 13.6", {"stroke-dasharray":"0.6 2.3","stroke-linecap":"round"})
      ])
    ],
    gAnims: { tilt: tn("rotate", ["0 12 15","-10 12 15","0 12 15"], undefined, {"additive":"sum"}), arc: tn("rotate", ["0 6.4 6.2","360 6.4 6.2"]), arc2: tn("rotate", ["360 5.9 11.6","0 5.9 11.6"]) },
  },

  /* ---- depth additions: pin/map status + tracking ---- */

  /* map pin — drops in, the check lands a beat after */
  "map-pin-check": { dur: 1.9, auto: false,
    parts: [
      G("drop", [
        path("M12 21.5s7.3-6.1 7.3-11.3a7.3 7.3 0 1 0-14.6 0c0 5.2 7.3 11.3 7.3 11.3z"),
        A(path("M9.8 10.3L11.4 11.9L14.4 8.7", {"pathLength":1,"stroke-dasharray":1}), [an("stroke-dashoffset", [1,1,0,0], [0,0.6,0.82,1])])
      ])
    ],
    gAnims: { drop: tn("translate", ["0 -4","0 0.6","0 -0.3","0 0"], [0,0.6,0.8,1]) },
  },

  /* map pin — drops in, the x lands a beat after */
  "map-pin-x": { dur: 1.9, auto: false,
    parts: [
      G("drop", [
        path("M12 21.5s7.3-6.1 7.3-11.3a7.3 7.3 0 1 0-14.6 0c0 5.2 7.3 11.3 7.3 11.3z"),
        A(path("M10.2 8.4L13.8 12M13.8 8.4L10.2 12", {"pathLength":1,"stroke-dasharray":1}), [an("stroke-dashoffset", [1,1,0,0], [0,0.6,0.82,1])])
      ])
    ],
    gAnims: { drop: tn("translate", ["0 -4","0 0.6","0 -0.3","0 0"], [0,0.6,0.8,1]) },
  },

  /* map pin — drops in, the slash cancels it */
  "map-pin-off": { dur: 1.9, auto: false,
    parts: [
      G("drop", [
        path("M12 21.5s7.3-6.1 7.3-11.3a7.3 7.3 0 1 0-14.6 0c0 5.2 7.3 11.3 7.3 11.3z"),
        circle(12, 10.2, 2.5)
      ]),
      A(path("M3.8 3.8L20.2 20.2", {"pathLength":1,"stroke-dasharray":1}), [an("stroke-dashoffset", [1,1,0,0], [0,0.4,0.82,1])])
    ],
    gAnims: { drop: tn("translate", ["0 -4","0 0.6","0 -0.3","0 0"], [0,0.6,0.8,1]) },
  },

  /* nav dart struck through */
  "navigation-off": { dur: 1.8,
    parts: [
      path("M20.2 4c.4-.2.9.1.8.7l-4.4 15.4c-.2.6-.9.7-1.3.3l-4.2-4.5c-.2-.3-.5-.5-.9-.5l-8.9-1.9c-.6-.1-.7-.8-.2-1.1L20.2 4z"),
      A(path("M3.8 3.8L20.2 20.2", {"pathLength":1,"stroke-dasharray":1}), [an("stroke-dashoffset", [1,1,0,0], [0,0.35,0.8,1])])
    ],
  },

  /* folded map struck through */
  "map-off": { dur: 1.9,
    parts: [
      path("M9.3 4.7L4.1 6.5C3.5 6.7 3.1 7.1 3.1 7.7L3.1 19.2C3.1 19.9 3.7 20.3 4.3 20.2L9.5 18.4L14.9 20.4C15.1 20.5 15.4 20.5 15.7 20.4L20 18.7C20.6 18.5 20.9 18.1 20.9 17.5L20.9 5.6C20.9 4.9 20.3 4.5 19.7 4.6L15.5 6.2L10 4.5C9.8 4.4 9.5 4.5 9.3 4.7Z"),
      line(9.5, 4.7, 9.5, 18.4),
      line(15.4, 6.2, 15.4, 20.4),
      A(path("M3.8 3.8L20.2 20.2", {"pathLength":1,"stroke-dasharray":1}), [an("stroke-dashoffset", [1,1,0,0], [0,0.4,0.82,1])])
    ],
  },

  /* waypoints — stops on a winding route, destination lights last */
  waypoints: { dur: 1.9,
    parts: [
      /* three stops instead of four crowded ones; the route runs between
         the rings, never through them */
      circle(5.4, 18.2, 2),
      line(6.6, 16.6, 9.6, 12.2),
      circle(10.8, 10.6, 2),
      line(12.7, 11.2, 16.7, 12.6),
      circle(18.6, 13.2, 2, fill())
    ],
  },

  /* radar — rings + a sweeping arm over two contacts */
  radar: { dur: 2.1, pp: false,
    parts: [
      circle(12, 12, 8.4),
      path("M7.7 12A4.3 4.3 0 0 1 16.3 12"),
      G("arm", [line(12, 12, 16.9, 7.1)]),
      A(circle(15.6, 14.6, 1.1, fill()), [an("opacity", ["1","1","0.15","1","1"], [0,0.3,0.5,0.68,1])]),
      A(circle(8.6, 8.9, 0.9, fill()), [an("opacity", ["1","1","0.15","1","1"], [0,0.55,0.75,0.9,1])])
    ],
    gAnims: { arm: tn("rotate", ["0 12 12","360 12 12"]) },
  },
};
