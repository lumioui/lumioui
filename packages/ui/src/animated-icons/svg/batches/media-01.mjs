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
/* blink — opacity dips once on a mark (for A()). */
const BLINK = (lo = 0.2) => [an("opacity", ["1", "1", `${lo}`, "1", "1"], [0, 0.32, 0.46, 0.6, 1])];
/* trace — the stroke writes itself on (checks, waveforms, signatures). */
const DRAW = (p, t0 = 0.15, t1 = 0.62) =>
  A({ ...p, a: { ...p.a, pathLength: 1, "stroke-dasharray": 1 } },
    [an("stroke-dashoffset", ["1", "1", "0", "0"], [0, t0, t1, 1])]);
/* shutter — a lens iris blinks closed and reopens (A() on the lens circle). */
const IRIS = (cx, cy, r) =>
  A(circle(cx, cy, r), [an("r", [r, r, +(r * 0.55).toFixed(2), r, r], [0, 0.32, 0.42, 0.54, 1])]);
/* glint — a filled accent dot flashes once (A() on a fill() circle). */
const GLINT = (cx, cy, r) =>
  A(circle(cx, cy, r, fill()), [an("opacity", ["1", "1", "0.2", "1", "1"], [0, 0.34, 0.44, 0.56, 1])]);
/* VU bar — a waveform line squashes toward midline y=12 then rebounds (A()). */
const BAR = (x, y1, y2, t0, s = 0.55) => {
  const m = 12;
  const k = (v) => +(m - (m - v) * s).toFixed(2);
  const t1 = Math.min(+(t0 + 0.26).toFixed(3), 0.9);
  const t2 = Math.min(+(t0 + 0.52).toFixed(3), 0.96);
  return A(line(x, y1, x, y2), [
    an("y1", [y1, y1, k(y1), y1, y1], [0, t0, t1, t2, 1]),
    an("y2", [y2, y2, k(y2), y2, y2], [0, t0, t1, t2, 1]),
  ]);
};
/* slash — the not-allowed bar flashes once (A() on the slash line). */
const SLASH = (x1, y1, x2, y2) => A(line(x1, y1, x2, y2), BLINK(0.15));

// Canon camera body (matches the core `camera` silhouette).
const CAM_A =
  "M3.8 10.4c0-1.9 1.5-3.4 3.4-3.4h.9c.6 0 1.1-.3 1.4-.8l.7-1.1c.4-.6 1-1 1.7-1h4.2c.7 0 1.3.4 1.7 1l.7 1.1c.3.5.8.8 1.4.8h.9c.55 0 1 .45 1 1v7.6c0 1.9-1.5 3.4-3.4 3.4H7.2c-1.9 0-3.4-1.5-3.4-3.4v-5.2z";
// Flatter-top variant — the *02 body: stepped shoulder right, lens sits right.
const CAM_B =
  "M5 15.2V9.5C5 7.9 6.3 6.6 7.9 6.6h.7c.5 0 1-.3 1.4-.7l.7-.9c.5-.6 1.2-1 2-1h2.7c.8 0 1.5.4 2 1l.7.9c.4.4.9.7 1.4.7h.5c1.2 0 2.2 1 2.2 2.1v6c0 2.6-2.1 4.8-4.7 4.8H9.6c-2.6 0-4.6-2.2-4.6-4.8z";
// Taller, rounder variant — the *03 body.
const CAM_C =
  "M4.4 15.6v-4.6c0-1.9 1.5-3.4 3.4-3.4h.5c.5 0 .9-.2 1.2-.6l.8-1.1c.4-.6 1.1-.9 1.8-.9h.2c.7 0 1.3.3 1.7.9l.8 1.1c.3.4.7.6 1.2.6h1.1c1.9 0 3.4 1.5 3.4 3.4v4.6c0 2.6-2.1 4.7-4.7 4.7H9.1c-2.6 0-4.7-2.1-4.7-4.7z";
// Canon body with the top-right shoulder open — the + / sparkle lives in the notch.
const CAM_OPEN =
  "M21.3 9.2v5.9c0 2-1.6 3.6-3.6 3.6H7.2c-2 0-3.6-1.6-3.6-3.6v-4.7c0-1.9 1.5-3.4 3.4-3.4h.9c.6 0 1.1-.3 1.4-.8l.7-1.1c.4-.6 1-1 1.7-1h2.7";
const CAM_OPEN_B =
  "M21.3 9.4v5.3c0 2.6-2.1 4.8-4.7 4.8H9.6c-2.6 0-4.7-2.2-4.7-4.8V9.5c0-1.6 1.3-2.9 2.9-2.9h.7c.5 0 1-.3 1.4-.7l.7-.9c.5-.6 1.2-1 2-1h2.8";
// Audio-book base: cover face + page block + last-page curl.
const BOOK_COVER = "M5.2 18.2V6.4C5.2 4.3 6.9 2.6 9 2.6h6.6c1.8 0 3.2 1.4 3.2 3.2v12.4z";
const BOOK_PAGES = "M18.8 18.2v3.2H8.4c-1.8 0-3.2-1.4-3.2-3.2";
const BOOK_CURL = "M18.1 18.5c-.5.4-.8.8-.8 1.3s.3.9.8 1.3";

export const icons = {
  /* ------------------------------ albums ------------------------------ */
  /* bookmark ribbon sways on the cover's top edge */
  album: {
    auto: false,
    dur: 1.7,
    parts: [
      rect(3.4, 3.4, 17.2, 17.2, 3.4),
      G("ribbon", [
        path("M11.3 3.4v5.6c0 .8.3 1.3.7 1.5.4.2.9-.3 1.7-1.5.3-.4.7-.4 1 0 .8 1.2 1.3 1.7 1.7 1.5.4-.2.7-.7.7-1.5V3.6"),
      ]),
    ],
    gAnims: { ribbon: WIG(12.9, 3.5, 7) },
  },
  /* sun dips behind the photo ridge */
  album01: {
    auto: false,
    pp: false,
    dur: 1.7,
    parts: [
      rect(2.8, 7.6, 14.2, 13.2, 2.2),
      path("M17.4 16.4c1.4-.3 2.5-1.5 2.5-3V8.4c0-2.3-.9-3.8-1.7-4.5-.9-.7-2.3-.9-4.4-.9h-4c-1.2 0-2.3.8-2.6 1.9"),
      path("M3.6 18.2l4.3-4.3 2.9 2.9 2.3-2.3 3.4 3.4"),
      A(circle(12.4, 11.3, 0.8, fill()), [an("cy", ["11.3", "11.3", "10.3", "11.3", "11.3"], HOLD)]),
    ],
  },
  /* sun dips behind the photo ridge */
    "album02": { dur: 1.7,
    pp: false,
    auto: false,
    parts: [
    rect(9, 2.8, 11.8, 14.4, 2.4),
    /* the second print peeks out behind, its edge held 2px off the front */
    path("M5.4 6.8C4.2 7 3.2 8 3.2 9.2V19.2C3.2 20.5 4.3 21.6 5.6 21.6H15C16.1 21.6 17 20.9 17.3 19.9"),
    path("M11 14.2L13.6 11.6C14.3 10.9 15.3 10.9 16 11.6L18.8 14.4"),
    A(circle(17.3, 6, 0.75, { fill: "currentColor", stroke: "none" }), [an("cy", ["6", "6", "5.1", "6", "6"], [0, 0.3, 0.55, 0.8, 1])]),
  ] },
  /* the not-found slash flashes */
  "album-not-found01": {
    auto: false,
    parts: [
      rect(2.8, 7.6, 14.2, 13.2, 2.2),
      path("M17.4 16.4c1.4-.3 2.5-1.5 2.5-3V8.4c0-2.3-.9-3.8-1.7-4.5-.9-.7-2.3-.9-4.4-.9h-4c-1.2 0-2.3.8-2.6 1.9"),
      path("M3.6 18.2l4.3-4.3 2.9 2.9 2.3-2.3 3.4 3.4"),
      SLASH(3.1, 3.1, 20.9, 20.9),
    ],
  },
    "album-not-found02": { auto: false,
    parts: [
    rect(9, 2.8, 11.8, 14.4, 2.4),
    /* the second print peeks out behind, its edge held 2px off the front */
    path("M5.4 6.8C4.2 7 3.2 8 3.2 9.2V19.2C3.2 20.5 4.3 21.6 5.6 21.6H15C16.1 21.6 17 20.9 17.3 19.9"),
    path("M11 14.2L13.6 11.6C14.3 10.9 15.3 10.9 16 11.6L18.8 14.4"),
    A(line(3.1, 2.8, 20.9, 20.6), [an("opacity", ["1", "1", "0.15", "1", "1"], [0, 0.32, 0.46, 0.6, 1])]),
  ] },

  /* ------------------------------ audio ------------------------------- */
  /* the play triangle pulses — the book is listening */
  "audio-book01": {
    auto: false,
    dur: 1.5,
    parts: [
      path(BOOK_COVER),
      path(BOOK_PAGES),
      path(BOOK_CURL),
      G("play", [path("M10.3 7.6l4.2 2.4c.5.3.5 1 0 1.3l-4.2 2.4c-.5.3-1.1-.1-1.1-.6V8.2c0-.5.6-.9 1.1-.6z")]),
    ],
    sAnims: { play: POP(11.9, 10.4, 1.16) },
  },
  /* the music note sways on its stem */
  "audio-book02": {
    auto: false,
    dur: 1.7,
    parts: [
      path(BOOK_COVER),
      path(BOOK_PAGES),
      path(BOOK_CURL),
      G("note", [
        path("M10.5 13.5V8.1l4.3-.9v4.6"),
        circle(9.1, 13.4, 1.4),
        circle(13.4, 11.9, 1.4),
      ]),
    ],
    gAnims: { note: WIG(11, 14, 7) },
  },
  /* the speaker's wave blips out */
  "audio-book03": {
    auto: false,
    dur: 1.5,
    parts: [
      path(BOOK_COVER),
      path(BOOK_PAGES),
      path(BOOK_CURL),
      path("M9.3 9.4c-.3 0-.6.3-.6.6v1.4c0 .3.3.6.6.6h1.3l2.5 1.9c.4.3.9 0 .9-.5V7.6c0-.5-.5-.8-.9-.5l-2.5 1.9H9.3z"),
      A(path("M16 9.6c.8.7 1.2 1.5 1.2 2.4s-.4 1.7-1.2 2.4"), [an("opacity", ["1", "1", "0.3", "1", "1"], HOLD)]),
    ],
  },
  /* the headphones bounce onto the book */
  "audio-book04": {
    auto: false,
    dur: 1.5,
    parts: [
      path(BOOK_COVER),
      path(BOOK_PAGES),
      path(BOOK_CURL),
      G("cans", [
        path("M7.6 11.9v-1.6c0-2.4 2-4.4 4.4-4.4s4.4 2 4.4 4.4v1.6"),
        rect(6.7, 11.4, 1.9, 3.3, 0.9),
        rect(15.4, 11.4, 1.9, 3.3, 0.9),
      ]),
    ],
    gAnims: { cans: DIP(0, 1.1) },
  },
  /* equalizer bars pump outward from the middle */
  "audio-lines": {
    auto: false,
    dur: 1.4,
    parts: [
      BAR(12, 3.2, 20.8, 0.05, 0.5),
      BAR(8.3, 7, 17, 0.13),
      BAR(15.7, 7, 17, 0.13),
      BAR(4.6, 10.6, 13.4, 0.21),
      BAR(19.4, 10.6, 13.4, 0.21),
    ],
  },
  /* equalizer bars pump outward from the middle */
  "audio-wave01": {
    auto: false,
    dur: 1.4,
    parts: [
      BAR(9.4, 3.5, 20.5, 0.12),
      BAR(6.4, 7, 17, 0.2),
      BAR(12.4, 6, 18, 0.05),
      BAR(15.4, 9.5, 14.5, 0.12),
      BAR(18.4, 7, 17, 0.2),
      BAR(3.4, 11, 13, 0.28),
      BAR(20.6, 11, 13, 0.28),
    ],
  },
  /* the ribbon wave swells vertically and relaxes */
  "audio-wave02": {
    auto: false,
    dur: 1.6,
    parts: [
      G("wave", [
        path("M3 13.8v-3.4c0-.8.6-1.4 1.4-1.4s1.4.6 1.4 1.4v6.2c0 .8.6 1.4 1.4 1.4s1.4-.6 1.4-1.4V5.1c0-.8.6-1.4 1.4-1.4s1.4.6 1.4 1.4v14.1c0 .8.6 1.4 1.4 1.4s1.4-.6 1.4-1.4V9.3c0-.8.6-1.4 1.4-1.4s1.4.6 1.4 1.4v6.1c0 .8.6 1.4 1.4 1.4s1.4-.6 1.4-1.4v-2.9"),
      ]),
    ],
    sAnims: {
      wave: { pivot: [12, 12], anim: tn("scale", ["1 1", "1 1", "1 1.2", "1 1", "1 1"], HOLD) },
    },
  },
  /* the heartbeat trace draws itself on */
    "audio-waveform": { dur: 1.8,
    auto: false,
    parts: [
    A(path("M2.7 11.35L5.4 11.35C5.9 11.35 6.3 11.05 6.5 10.65L7.3 8.55C7.6 7.75 8.7 7.75 9 8.55L11.6 16.75C11.9 17.85 13.1 17.85 13.4 16.75L16 7.85C16.3 6.95 17.5 6.95 17.8 7.85L18.6 10.35C18.8 10.75 19.2 11.05 19.7 11.05L21.3 11.05", { pathLength: 1, "stroke-dasharray": 1 }), [an("stroke-dashoffset", ["1", "1", "0", "0"], [0, 0.1, 0.6, 1])]),
  ] },

  /* ------------------------------ cameras ----------------------------- */
  /* shutter blink — iris snaps shut, glint fires */
  camera01: {
    auto: false,
    pp: false,
    dur: 1.6,
    parts: [path(CAM_A), IRIS(12.3, 13.1, 3.2), GLINT(18.5, 10.5, 0.85)],
  },
    "camera02": { dur: 1.6,
    pp: false,
    auto: false,
    parts: [
    path("M3.4 15.45L3.4 9.75C3.4 8.15 4.7 6.85 6.3 6.85L7 6.85C7.5 6.85 8 6.55 8.4 6.15L9.1 5.25C9.6 4.65 10.3 4.25 11.1 4.25L13.8 4.25C14.6 4.25 15.3 4.65 15.8 5.25L16.5 6.15C16.9 6.55 17.4 6.85 17.9 6.85L18.4 6.85C19.6 6.85 20.6 7.85 20.6 8.95L20.6 14.95C20.6 17.55 18.5 19.75 15.9 19.75L8 19.75C5.4 19.75 3.4 17.55 3.4 14.95Z"),
    A(circle(12.9, 13.55, 3.4), [an("r", ["3.4", "3.4", "1.87", "3.4", "3.4"], [0, 0.32, 0.42, 0.54, 1])]),
    line(5.2, 10.15, 7, 10.15),
  ] },
  camera03: {
    auto: false,
    pp: false,
    dur: 1.6,
    parts: [path(CAM_C), IRIS(12.2, 13.9, 3.4), GLINT(17.4, 10.6, 0.8)],
  },
  /* the + badge pops in the open shoulder */
  "camera-add01": {
    auto: false,
    dur: 1.5,
    parts: [
      path(CAM_OPEN),
      circle(11.9, 13.1, 3.2),
      G("plus", [line(18.4, 3.6, 18.4, 8), line(16.2, 5.8, 20.6, 5.8)]),
    ],
    sAnims: { plus: POP(18.4, 5.8, 1.2) },
  },
    "camera-add02": { dur: 1.5,
    auto: false,
    parts: [
    path("M20.2 9.85L20.2 15.15C20.2 17.75 18.1 19.95 15.5 19.95L8.5 19.95C5.9 19.95 3.8 17.75 3.8 15.15L3.8 9.95C3.8 8.35 5.1 7.05 6.7 7.05L7.4 7.05C7.9 7.05 8.4 6.75 8.8 6.35L9.5 5.45C10 4.85 10.7 4.45 11.5 4.45L14.3 4.45"),
    circle(13.2, 13.95, 3.4),
    G("plus", [
      line(17.3, 4.05, 17.3, 8.45),
      line(15.1, 6.25, 19.5, 6.25),
    ]),
    line(5.7, 10.55, 7.5, 10.55),
  ],
    sAnims: { plus: { pivot: [17.3, 6.25], anim: tn("scale", ["1", "1", "1.2", "1", "1"], [0, 0.3, 0.55, 0.8, 1]) } } },
  "camera-add03": {
    auto: false,
    dur: 1.5,
    parts: [
      path(CAM_A),
      G("plus", [line(12.4, 9.6, 12.4, 16.4), line(9, 13, 15.8, 13)]),
    ],
    sAnims: { plus: POP(12.4, 13, 1.16) },
  },
  /* the AI sparkle twirls in the notch */
    "camera-ai": { dur: 1.7,
    auto: false,
    parts: [
    path("M20.85 11.6L20.85 16.1C20.85 18.1 19.25 19.7 17.25 19.7L6.75 19.7C4.75 19.7 3.15 18.1 3.15 16.1L3.15 11.4C3.15 9.5 4.65 8 6.55 8L7.45 8C8.05 8 8.55 7.7 8.85 7.2L9.55 6.1C9.95 5.5 10.55 5.1 11.25 5.1L13.75 5.1"),
    circle(11.15, 14.3, 3.2),
    G("twinkle", [
      path("M17.35 4.3C17.65 5.7 18.75 6.8 20.15 7.1C18.75 7.4 17.65 8.5 17.35 9.9C17.05 8.5 15.95 7.4 14.55 7.1C15.95 6.8 17.05 5.7 17.35 4.3Z"),
    ]),
  ],
    sAnims: { twinkle: { pivot: [17.35, 5.8], anim: tn("scale", ["1", "1", "1.22", "1", "1"], [0, 0.3, 0.55, 0.8, 1]), extra: tn("rotate", ["0 17.35 5.8", "0 17.35 5.8", "-20 17.35 5.8", "10 17.35 5.8", "0 17.35 5.8"], [0, 0.3, 0.55, 0.8, 1], { additive: "sum" }) } } },
  /* the "A" breathes — auto mode idling */
  "camera-automatically01": {
    auto: false,
    dur: 1.8,
    parts: [
      path(CAM_A),
      G("mode", [
        path("M9.6 16.6l2.5-6.3c.15-.4.5-.6.9-.6s.75.2.9.6l2.5 6.3"),
        line(11.1, 14.3, 14.9, 14.3),
      ]),
      circle(18.5, 10.5, 0.8, fill()),
    ],
    gAnims: { mode: an("opacity", ["1", "1", "0.45", "1", "1"], HOLD) },
  },
    "camera-automatically02": { dur: 1.8,
    auto: false,
    parts: [
    path("M3.4 15.45L3.4 9.75C3.4 8.15 4.7 6.85 6.3 6.85L7 6.85C7.5 6.85 8 6.55 8.4 6.15L9.1 5.25C9.6 4.65 10.3 4.25 11.1 4.25L13.8 4.25C14.6 4.25 15.3 4.65 15.8 5.25L16.5 6.15C16.9 6.55 17.4 6.85 17.9 6.85L18.4 6.85C19.6 6.85 20.6 7.85 20.6 8.95L20.6 14.95C20.6 17.55 18.5 19.75 15.9 19.75L8 19.75C5.4 19.75 3.4 17.55 3.4 14.95Z"),
    G("mode", [
      path("M10.4 16.85L12.6 10.55C12.75 10.15 13.1 9.95 13.5 9.95C13.9 9.95 14.25 10.15 14.4 10.55L16.6 16.85"),
      line(11.7, 14.55, 15.1, 14.55),
    ]),
    line(5.2, 10.15, 7, 10.15),
  ],
    gAnims: { mode: an("opacity", ["1", "1", "0.45", "1", "1"], [0, 0.3, 0.55, 0.8, 1]) } },
  /* aperture blades twist */
  "camera-lens": {
    auto: false,
    dur: 1.7,
    parts: [
      circle(12, 12, 8.8),
      circle(12, 12, 3.5),
      G("blades", [
        line(8.5, 12, 8.5, 4),
        line(12, 8.5, 20, 8.5),
        line(15.5, 12, 15.5, 20),
        line(12, 15.5, 4, 15.5),
      ]),
    ],
    gAnims: { blades: WIG(12, 12, 14) },
  },
  /* the mic's capture arc breathes */
  "camera-microphone01": {
    auto: false,
    dur: 1.7,
    parts: [
      path(CAM_A),
      path("M10.6 9.8c0-.8.7-1.4 1.5-1.4s1.5.6 1.5 1.4v2.3c0 .8-.7 1.4-1.5 1.4s-1.5-.6-1.5-1.4V9.8z"),
      A(path("M9.3 13.8c.7 1.4 1.7 2 2.8 2 1.1 0 2.1-.6 2.8-2"), [an("opacity", ["1", "1", "0.35", "1", "1"], HOLD)]),
      line(12.1, 15.8, 12.1, 17.3),
    ],
  },
    "camera-microphone02": { dur: 1.7,
    auto: false,
    parts: [
    path("M3.4 15.45L3.4 9.75C3.4 8.15 4.7 6.85 6.3 6.85L7 6.85C7.5 6.85 8 6.55 8.4 6.15L9.1 5.25C9.6 4.65 10.3 4.25 11.1 4.25L13.8 4.25C14.6 4.25 15.3 4.65 15.8 5.25L16.5 6.15C16.9 6.55 17.4 6.85 17.9 6.85L18.4 6.85C19.6 6.85 20.6 7.85 20.6 8.95L20.6 14.95C20.6 17.55 18.5 19.75 15.9 19.75L8 19.75C5.4 19.75 3.4 17.55 3.4 14.95Z"),
    path("M11.4 10.15C11.4 9.35 12.1 8.75 12.9 8.75S14.4 9.35 14.4 10.15L14.4 12.45C14.4 13.25 13.7 13.85 12.9 13.85S11.4 13.25 11.4 12.45L11.4 10.15Z"),
    A(path("M10.1 14.15C10.8 15.55 11.8 16.15 12.9 16.15S15 15.55 15.7 14.15"), [an("opacity", ["1", "1", "0.35", "1", "1"], [0, 0.3, 0.55, 0.8, 1])]),
    line(12.9, 16.15, 12.9, 17.65),
    line(5.2, 10.15, 7, 10.15),
  ] },
  /* the moon sways inside the lens */
  "camera-night-mode01": { dur: 1.4, auto: true, parts: [
    path("M3.6 10.6C3.6 8.7 5.1 7.2 7 7.2L7.65 7.2Q8.3 7.2 9.35 5.6Q10.4 4 12 4Q13.6 4 14.65 5.6Q15.7 7.2 16.35 7.2L17 7.2C18.9 7.2 20.4 8.7 20.4 10.6L20.4 16.2C20.4 18.1 18.9 19.6 17 19.6L7 19.6C5.1 19.6 3.6 18.1 3.6 16.2L3.6 10.6Z"),
    path("M13.8 10.3A3.5 3.5 0 1 0 15.5 14.6 3.5 3.5 0 0 1 13.8 10.3Z"),
  ] },
    "camera-night-mode02": { dur: 1.4, auto: true, parts: [
      path("M3.6 10.6C3.6 8.7 5.1 7.2 7 7.2L7.65 7.2Q8.3 7.2 9.35 5.6Q10.4 4 12 4Q13.6 4 14.65 5.6Q15.7 7.2 16.35 7.2L17 7.2C18.9 7.2 20.4 8.7 20.4 10.6L20.4 16.2C20.4 18.1 18.9 19.6 17 19.6L7 19.6C5.1 19.6 3.6 18.1 3.6 16.2L3.6 10.6Z"),
      path("M13.8 10.3A3.5 3.5 0 1 0 15.5 14.6 3.5 3.5 0 0 1 13.8 10.3Z"),
      circle(17, 10.5, 0.9, fill()),
    ] },
  /* the off slash flashes */
  "camera-off01": {
    auto: false,
    parts: [
      path(CAM_A),
      path("M9.6 10.6c-.9.9-1.4 2-1.4 3.2 0 2.5 2 4.5 4.5 4.5.9 0 1.7-.3 2.4-.7"),
      path("M14.5 9.9c.9.7 1.5 1.7 1.6 2.8"),
      circle(18.3, 9.5, 0.9, fill()),
      SLASH(3.1, 3.1, 20.9, 20.9),
    ],
  },
    "camera-off02": { auto: false,
    parts: [
    path("M4.8 15.2L4.8 9.5C4.8 7.9 6.1 6.6 7.7 6.6L8.4 6.6C8.9 6.6 9.4 6.3 9.8 5.9L10.5 5C11 4.4 11.7 4 12.5 4L15.2 4C16 4 16.7 4.4 17.2 5L17.9 5.9C18.3 6.3 18.8 6.6 19.3 6.6L19.8 6.6C21 6.6 22 7.6 22 8.7L22 14.7C22 17.3 19.9 19.5 17.3 19.5L9.4 19.5C6.8 19.5 4.8 17.3 4.8 14.7Z"),
    path("M11.9 11C11 11.9 10.5 13 10.5 14.2C10.5 16.7 12.5 18.7 15 18.7C15.9 18.7 16.7 18.4 17.4 18"),
    path("M17.3 9.6c.8.8 1.4 1.9 1.4 3"),
    A(line(2.9, 3.1, 20.7, 20.9), [an("opacity", ["1", "1", "0.15", "1", "1"], [0, 0.32, 0.46, 0.6, 1])]),
    line(6.6, 9.9, 8.4, 9.9),
  ] },
  /* the rotation arrow winds the lens around */
  "camera-rotated01": {
    auto: false,
    pp: false,
    dur: 1.9,
    parts: [
      path(CAM_A),
      G("spin", [
        path("M15.7 11.1c-.9-.9-2-1.4-3.3-1.4-2.2 0-4 1.8-4 4 0 2.2 1.8 4 4 4 .9 0 1.7-.3 2.4-.8"),
        path("M14.4 11.3l1.6 1.1 1.4-1.8"),
      ]),
    ],
    gAnims: { spin: tn("rotate", ["0 12.4 13.7", "360 12.4 13.7"]) },
  },
    "camera-rotated02": { dur: 1.9,
    pp: false,
    auto: false,
    parts: [
    path("M3.4 15.45L3.4 9.75C3.4 8.15 4.7 6.85 6.3 6.85L7 6.85C7.5 6.85 8 6.55 8.4 6.15L9.1 5.25C9.6 4.65 10.3 4.25 11.1 4.25L13.8 4.25C14.6 4.25 15.3 4.65 15.8 5.25L16.5 6.15C16.9 6.55 17.4 6.85 17.9 6.85L18.4 6.85C19.6 6.85 20.6 7.85 20.6 8.95L20.6 14.95C20.6 17.55 18.5 19.75 15.9 19.75L8 19.75C5.4 19.75 3.4 17.55 3.4 14.95Z"),
    G("spin", [
      path("M16.6 11.85C15.7 10.95 14.6 10.45 13.3 10.45C11.1 10.45 9.3 12.25 9.3 14.45S11.1 18.45 13.3 18.45C14.2 18.45 15 18.15 15.7 17.65"),
      path("M15.3 12.05L16.9 13.15L18.3 11.35"),
    ]),
    line(5.2, 10.15, 7, 10.15),
  ],
    gAnims: { spin: tn("rotate", ["0 13.3 15.85", "360 13.3 15.85"]) } },
  /* the camera's eyes blink */
  "camera-smile01": {
    auto: false,
    dur: 1.7,
    parts: [
      path(CAM_A),
      path("M8.9 14.4c.9 1.4 2.2 2.1 3.6 2.1s2.7-.7 3.6-2.1"),
      A(circle(9.3, 10.9, 0.85, fill()), [an("opacity", ["1", "1", "0.1", "1", "1"], [0, 0.34, 0.42, 0.5, 1])]),
      A(circle(15.4, 10.9, 0.85, fill()), [an("opacity", ["1", "1", "0.1", "1", "1"], [0, 0.34, 0.42, 0.5, 1])]),
    ],
  },
    "camera-smile02": { dur: 1.7,
    auto: false,
    parts: [
    path("M3.4 15.45L3.4 9.75C3.4 8.15 4.7 6.85 6.3 6.85L7 6.85C7.5 6.85 8 6.55 8.4 6.15L9.1 5.25C9.6 4.65 10.3 4.25 11.1 4.25L13.8 4.25C14.6 4.25 15.3 4.65 15.8 5.25L16.5 6.15C16.9 6.55 17.4 6.85 17.9 6.85L18.4 6.85C19.6 6.85 20.6 7.85 20.6 8.95L20.6 14.95C20.6 17.55 18.5 19.75 15.9 19.75L8 19.75C5.4 19.75 3.4 17.55 3.4 14.95Z"),
    path("M10.1 14.65C10.9 16.05 12.2 16.75 13.6 16.75S16.3 16.05 17.1 14.65"),
    A(circle(10.8, 11.15, 0.85, { fill: "currentColor", stroke: "none" }), [an("opacity", ["1", "1", "0.1", "1", "1"], [0, 0.34, 0.42, 0.5, 1])]),
    A(circle(15.7, 11.15, 0.85, { fill: "currentColor", stroke: "none" }), [an("opacity", ["1", "1", "0.1", "1", "1"], [0, 0.34, 0.42, 0.5, 1])]),
    line(5.2, 10.15, 7, 10.15),
  ] },
  /* the tripod head pans side to side */
  "camera-tripod": {
    auto: false,
    dur: 1.8,
    parts: [
      G("head", [rect(3.4, 3.4, 17.2, 12.4, 2.8), circle(12, 9.6, 3)]),
      path("M7.7 20.9l3.1-3.9M16.3 20.9l-3.1-3.9"),
      line(12, 15.8, 12, 20.9),
    ],
    gAnims: { head: tn("rotate", ["0 12 15.8", "0 12 15.8", "-4 12 15.8", "3 12 15.8", "0 12 15.8"], HOLD) },
  },
  /* the video head pans on its stick */
  "camera-video": {
    auto: false,
    dur: 1.8,
    parts: [
      G("head", [
        circle(7.6, 5.2, 2.5),
        circle(12.7, 5.6, 2.1),
        rect(3.2, 8.2, 12.4, 8.2, 2.6),
        path("M15.6 10.6l3.3-1.9c.6-.3 1.2 0 1.2.7v5.2c0 .7-.6 1-1.2.7l-3.3-1.9"),
      ]),
      path("M6.4 20.9l2.4-3.4M14.4 20.9l-2.4-3.4"),
      line(9.4, 16.4, 9.4, 20.9),
    ],
    gAnims: { head: tn("rotate", ["0 9.4 16.4", "0 9.4 16.4", "-4 9.4 16.4", "3 9.4 16.4", "0 9.4 16.4"], HOLD) },
  },

  /* ------------------------------ misc -------------------------------- */
  /* the clothespin bites */
    "clip": { dur: 1.5,
    auto: false,
    parts: [
    G("bite", [
      path("M5.5 18.42L4.4 14.32C3.8 11.92 3.5 10.62 4.1 9.72C4.8 8.82 6 8.72 8.2 8.72L15.8 8.72C18 8.72 19.2 8.82 19.9 9.72C20.5 10.62 20.2 11.92 19.6 14.32L19.2 18.42"),
      path("M9.9 17.42C9.9 15.22 10.3 13.02 10.5 11.72C10.7 10.02 7.9 8.22 9.4 6.72C10.9 5.22 12.6 5.22 14.1 6.72C15.6 8.22 12.8 10.02 13 11.72C13.2 13.02 13.6 15.22 13.6 17.42"),
      path("M5.7 18.42L7.5 18.42C7.9 18.42 8.1 18.12 8.2 17.72C8.4 17.02 9 16.52 9.6 16.52S10.8 17.02 11 17.72C11.1 18.12 11.3 18.42 11.7 18.42L13.9 18.42C14.3 18.42 14.5 18.12 14.6 17.72C14.8 17.02 15.4 16.52 16 16.52S17.2 17.02 17.4 17.72C17.5 18.12 17.7 18.42 18.1 18.42L20.4 18.42"),
    ]),
  ],
    sAnims: { bite: { pivot: [12.3, 18.42], anim: tn("scale", ["1 1", "1 1", "1 0.92", "1 1", "1 1"], [0, 0.3, 0.55, 0.8, 1]) } } },
  /* the swirl sweeps the ring like a radar */
  cliparts: {
    auto: false,
    pp: false,
    dur: 2.1,
    parts: [
      circle(11.9, 12.1, 8.7),
      G("sweep", [path("M11.9 3.4c0 4.6 0 6.6 1.5 8.1 1.5 1.5 3.4 1.4 7.3.6")]),
    ],
    gAnims: { sweep: tn("rotate", ["0 11.9 12.1", "360 11.9 12.1"]) },
  },
  /* the stick comes down on the drum */
  drum: {
    auto: false,
    dur: 1.4,
    parts: [
      ellipse(11.9, 8.4, 8.6, 4.6),
      path("M3.3 8.4v7.4c0 2.5 3.9 4.5 8.6 4.5s8.6-2 8.6-4.5V8.4"),
      line(8, 14.6, 8, 19),
      line(15.8, 14.6, 15.8, 19),
      G("stick", [line(11.2, 9.2, 20.3, 2.7)]),
    ],
    gAnims: {
      stick: tn("rotate", ["0 11.2 9.2", "0 11.2 9.2", "14 11.2 9.2", "0 11.2 9.2", "0 11.2 9.2"], HOLD),
    },
  },
  /* the mallet taps its tip */
  drumstick: {
    auto: false,
    dur: 1.5,
    parts: [
      G("swing", [
        /* meat leg: plump drumette, exposed bone, two knobs */
        path("M9.6 12.4c.4-1.5.4-3 1.2-4.3 1.1-1.8 3-2.9 5.1-3.1 3-.3 5.9 1.6 6.4 4.6.5 3.1-1 6.1-4 7.2-1.6.6-3.4.5-4.9-.1l-2.3-1.2c-.8-.4-1.6-1.3-1.5-3.1z"),
        line(9.9, 14.6, 6.2, 18.3),
        circle(4.9, 18.2, 1.4),
        circle(6.2, 19.9, 1.1),
      ]),
    ],
    gAnims: { swing: tn("rotate", ["0 5.5 19.2", "0 5.5 19.2", "-10 5.5 19.2", "7 5.5 19.2", "0 5.5 19.2"], HOLD) },
  },
  /* fast-forward surges right */
    "fast-forward": { dur: 1.4,
    auto: false,
    parts: [
    G("ff", [
      path("M5.75 7.2L11.35 10.9C12.15 11.4 12.15 12.6 11.35 13.1L5.75 16.8C4.95 17.3 3.95 16.7 3.95 15.8L3.95 8.3C3.95 7.3 4.95 6.7 5.75 7.2Z"),
      path("M13.65 7.2L19.25 10.9C20.05 11.4 20.05 12.6 19.25 13.1L13.65 16.8C12.85 17.3 11.85 16.7 11.85 15.8L11.85 8.3C11.85 7.3 12.85 6.7 13.65 7.2Z"),
    ]),
  ],
    gAnims: { ff: tn("translate", ["0 0", "0 0", "2.4 0", "0 0", "0 0"], [0, 0.3, 0.55, 0.8, 1]) } },
  /* the wind gusts through */
  "fast-wind": {
    auto: false,
    dur: 1.6,
    parts: [
      G("gust", [
        path("M3.2 6.4C5.6 9 10.5 7.7 11.6 6c.3-.4.5-.9.5-1.4 0-1.1-.9-2-2-2s-1.9.9-1.9 2"),
        path("M15.5 9.4c0-1.7 1.1-2.9 2.5-2.9 1.4 0 2.5 1.2 2.5 2.8 0 .7-.2 1.4-.6 1.9-1.8 3-11 2.4-15.9 1.4"),
        path("M13.2 19.7c.2.6.7 1 1.4 1 .8 0 1.4-.7 1.4-1.6 0-.3-.1-.6-.2-.8-1.1-2.3-7.3-3.9-12.9-.5"),
        line(18.4, 15.2, 20.7, 15.2),
      ]),
    ],
    gAnims: { gust: DIP(2.2, 0) },
  },
  /* projector flicker */
  film01: {
    auto: false,
    dur: 1.7,
    parts: [
      G("flicker", [
        rect(3.2, 3.2, 17.6, 17.6, 3),
        line(3.2, 8, 20.8, 8),
        line(3.2, 16, 20.8, 16),
        line(12, 8, 12, 16),
        path("M8.2 7.9V4M15.8 7.9V4"),
        path("M8.2 20.8v-3.9M15.8 20.8v-3.9"),
      ]),
    ],
    gAnims: { flicker: an("opacity", ["1", "1", "0.55", "1", "0.55", "1"], [0, 0.28, 0.38, 0.48, 0.58, 1]) },
  },
  /* the frame advances through the sprockets */
  film02: {
    auto: false,
    dur: 1.7,
    parts: [
      rect(3.2, 3.2, 17.6, 17.6, 3),
      line(7.6, 3.2, 7.6, 20.8),
      line(16.4, 3.2, 16.4, 20.8),
      G("advance", [
        line(7.6, 12, 16.4, 12),
        path("M3.9 7.8h3.7M3.9 16.2h3.7"),
        path("M16.4 7.8h3.7M16.4 16.2h3.7"),
      ]),
    ],
    gAnims: { advance: DIP(0, 1.5) },
  },
  /* the loose tail waves */
  "film-roll01": {
    auto: false,
    dur: 1.7,
    parts: [
      rect(4.6, 5.4, 8.2, 15.6, 1.6),
      path("M6.6 5.4l.4-.8c.2-.5.6-.9 1.1-1h.2c.5.1.9.5 1.1 1l.4.8"),
      line(3.6, 5.4, 13.8, 5.4),
      line(3.6, 21, 13.8, 21),
      G("tail", [path("M12.8 7.4h4.9c1.2 0 1.8.2 2.2.6.4.4.4 1 .4 2.1v1.2c0 .8-.3 1.3-.9 1.6-.6.3-1.3.3-2.3.3h-.9")]),
    ],
    gAnims: { tail: WIG(12.8, 7.4, 8) },
  },
  /* the reel winds */
  "film-roll02": {
    auto: false,
    pp: false,
    dur: 2,
    parts: [
      G("reel", [
        circle(10.3, 10.3, 7.9),
        circle(10.3, 10.3, 0.9, fill()),
        path("M13.6 7.2l-1.2 1.2M7 13.4l1.2-1.2"),
        path("M7 7.2l1.2 1.2M13.6 13.4l-1.2-1.2"),
      ]),
      path("M13.4 17.5l5.3-.9c1.2-.2 2.3.7 2.3 1.9 0 1.2-1 2.1-2.1 2.1h-1.2"),
    ],
    gAnims: { reel: tn("rotate", ["0 10.3 10.3", "360 10.3 10.3"]) },
  },
  /* the end card settles against the rail */
  "gallery-horizontal-end": {
    auto: false,
    dur: 1.5,
    parts: [
      G("settle", [
        rect(11.4, 4.4, 9.2, 15.2, 2.4),
        line(7.4, 6.4, 7.4, 17.6),
        line(3.6, 8.6, 3.6, 15.4),
      ]),
    ],
    gAnims: { settle: DIP(-1.4, 0) },
  },
};
