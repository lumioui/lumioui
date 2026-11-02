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
/* dip — translate out along an axis and spring back (gAnims). */
const DIP = (dx, dy) => tn("translate", ["0 0", "0 0", `${dx} ${dy}`, "0 0", "0 0"], HOLD);
/* blink — opacity dips once on a mark (for A()). */
const BLINK = (lo = 0.2) => [an("opacity", ["1", "1", `${lo}`, "1", "1"], [0, 0.32, 0.46, 0.6, 1])];
/* slash — the not-allowed bar flashes once (A() on the slash line). */
const SLASH = (x1, y1, x2, y2) => A(line(x1, y1, x2, y2), BLINK(0.15));

/* Shared chassis — every monitor in the batch rides on the same plump
 * screen silhouette + T-stand so the family reads as one set. */
const SCREEN =
  "M6.4 4.2h11.2c1.8 0 3.2 1.4 3.2 3.2v5.2c0 1.8-1.4 3.2-3.2 3.2H6.4c-1.8 0-3.2-1.4-3.2-3.2V7.4c0-1.8 1.4-3.2 3.2-3.2z";
const STAND = "M12 16v2.6M8.6 19.4h6.8";

export const icons = {
  /* the power LED breathes */
  monitor: {
    auto: false,
    dur: 1.7,
    parts: [
      path(SCREEN),
      path(STAND),
      A(circle(17.6, 13.4, 0.9, fill()), BLINK(0.25)), // power LED
    ],
  },

  /* the notification badge pops on the corner */
  "monitor-dot": {
    auto: false,
    dur: 1.5,
    parts: [
      path(SCREEN),
      path(STAND),
      G("badge", [circle(19.3, 5, 2.3, fill())]), // notification badge swallowing the corner
    ],
    sAnims: { badge: POP(19.3, 5, 1.25) },
  },

  /* the arrow drops a download in */
  "monitor-down": {
    auto: false,
    dur: 1.5,
    parts: [
      path(SCREEN),
      path(STAND),
      G("arr", [line(12, 6.6, 12, 12.5), path("M9 9.7l3 3 3-3")]),
    ],
    gAnims: { arr: DIP(0, 1.5) },
  },

  /* the off slash flashes */
  "monitor-off": {
    auto: false,
    parts: [
      path(SCREEN),
      path(STAND),
      SLASH(3.8, 3.4, 20.2, 20.6),
    ],
  },

  /* the pause bars pinch — a held breath */
  "monitor-pause": {
    auto: false,
    dur: 1.5,
    parts: [
      path(SCREEN),
      path(STAND),
      G("bars", [line(9.9, 7.4, 9.9, 12.7), line(14.1, 7.4, 14.1, 12.7)]),
    ],
    sAnims: {
      bars: { pivot: [12, 10], anim: tn("scale", ["1 1", "1 1", "0.86 1", "1 1", "1 1"], HOLD) },
    },
  },

  /* the play glyph pulses */
  "monitor-play": {
    auto: false,
    dur: 1.4,
    parts: [
      path(SCREEN),
      path(STAND),
      G("play", [path("M10.8 7.4l3.4 2c.5.3.5.9 0 1.2l-3.4 2c-.5.3-1.1 0-1.1-.6V8c0-.6.6-.9 1.1-.6z")]),
    ],
    sAnims: { play: POP(12.3, 10, 1.16) },
  },

  /* the handset's home dot pings */
  "monitor-smartphone": {
    auto: false,
    dur: 1.6,
    parts: [
      // screen dips behind the handset — right edge stops high, bottom
      // edge stops short; wireframe can't occlude so we leave the gap
      path("M13.8 14.8H6.2c-1.8 0-3.2-1.4-3.2-3.2V6.4c0-1.8 1.4-3.2 3.2-3.2h11.4c1.8 0 3.2 1.4 3.2 3.2v3.4"),
      path("M9.5 14.8v3.4M7 19h5"),
      path("M17 11.2h2c1.3 0 2.4 1.1 2.4 2.4v5c0 1.3-1.1 2.4-2.4 2.4h-2c-1.3 0-2.4-1.1-2.4-2.4v-5c0-1.3 1.1-2.4 2.4-2.4z"),
      A(circle(18, 19.4, 0.8, fill()), BLINK(0.2)), // home dot
    ],
  },

  /* the woofer cone thumps */
  "monitor-speaker": {
    auto: false,
    dur: 1.4,
    parts: [
      // left half of a screen peeking from behind the speaker tower
      path("M10.4 3.8H6.2c-1.8 0-3.2 1.4-3.2 3.2v4.2c0 1.8 1.4 3.2 3.2 3.2h4.2"),
      path("M6.6 14.4v3.4M4.4 19.4h4.4"),
      path("M14.6 4.6h4.4c1.3 0 2.4 1.1 2.4 2.4v10c0 1.3-1.1 2.4-2.4 2.4h-4.4c-1.3 0-2.4-1.1-2.4-2.4V7c0-1.3 1.1-2.4 2.4-2.4z"),
      A(circle(16.8, 14.9, 2.4), [an("r", ["2.4", "2.4", "2.9", "2.4", "2.4"], HOLD)]), // woofer
      circle(16.8, 8.8, 0.9, fill()), // tweeter
    ],
  },

  /* contactless mark — waves emit outward in cascade */
  nfc: {
    auto: false,
    dur: 1.6,
    parts: [
      circle(5.2, 12, 0.6, fill()),
      A(path("M8.6 9.4a3.7 3.7 0 0 1 0 5.2"), [an("opacity", ["1", "1", "0.25", "1", "1"], [0, 0.15, 0.3, 0.45, 1])]),
      A(path("M11.8 6.8a7.4 7.4 0 0 1 0 10.4"), [an("opacity", ["1", "1", "0.25", "1", "1"], [0, 0.3, 0.45, 0.6, 1])]),
      A(path("M15 4.2a11 11 0 0 1 0 15.6"), [an("opacity", ["1", "1", "0.25", "1", "1"], [0, 0.45, 0.6, 0.75, 1])]),
    ],
  },

  /* box + stub antenna + broadcast arcs + LED row */
  router: {
    auto: false,
    dur: 1.8,
    parts: [
      rect(3.4, 13.6, 17.2, 5.8, 1.9),
      line(12, 13.6, 12, 10.2),
      A(path("M10 8.2a2.9 2.9 0 0 1 4 0"), [an("opacity", ["1", "1", "0.25", "1", "1"], [0, 0.2, 0.35, 0.5, 1])]),
      A(path("M8.2 6a5.5 5.5 0 0 1 7.6 0"), [an("opacity", ["1", "1", "0.25", "1", "1"], [0, 0.35, 0.5, 0.65, 1])]),
      circle(6.6, 16.5, 0.6, fill()),
      circle(9.2, 16.5, 0.6, fill()),
      line(15.4, 16.5, 18, 16.5),
    ],
  },

  /* square watch: bands top/bottom, crown right, live hands */
  smartwatch: {
    auto: false,
    dur: 2.6,
    pp: false,
    parts: [
      path("M9.4 7.4V4.6c0-.9.7-1.6 1.6-1.6h2c.9 0 1.6.7 1.6 1.6v2.8"),
      path("M9.4 16.6v2.8c0 .9.7 1.6 1.6 1.6h2c.9 0 1.6-.7 1.6-1.6v-2.8"),
      rect(7, 7.4, 10, 9.2, 2.6),
      line(18.4, 10.4, 18.4, 12.4),
      G("hands", [
        line(12, 9.8, 12, 12),
        line(12, 12, 13.8, 12.9),
      ]),
    ],
    gAnims: { hands: tn("rotate", ["0 12 12", "360 12 12"]) },
  },

  /* visor with nose notch + strap stubs */
  "vr-headset": {
    auto: false,
    dur: 2.4,
    parts: [
      path("M3.4 9.6c0-1.7 1.4-3.1 3.1-3.1h11c1.7 0 3.1 1.4 3.1 3.1v3.4c0 1.7-1.4 3.1-3.1 3.1h-3.4c-1 0-1.9-.5-2.5-1.3l-.3-.4c-.3-.4-.8-.4-1.1 0l-.3.4c-.6.8-1.5 1.3-2.5 1.3H6.5c-1.7 0-3.1-1.4-3.1-3.1z"),
      line(3.4, 9.8, 2.4, 9.8),
      line(20.6, 9.8, 21.6, 9.8),
      A(circle(8.4, 11.4, 1), [an("opacity", ["1", "1", "0.2", "1", "1"], [0, 0.3, 0.45, 0.6, 1])]),
      A(circle(15.6, 11.4, 1), [an("opacity", ["1", "1", "0.2", "1", "1"], [0, 0.3, 0.45, 0.6, 1])]),
    ],
  },

  /* bot head: antenna, ear nubs, two eyes that blink */
  robot: {
    auto: false,
    dur: 2.6,
    parts: [
      line(12, 8.4, 12, 5.6),
      circle(12, 4.8, 0.7, fill()),
      rect(5.8, 8.4, 12.4, 9.8, 2.8),
      line(5.8, 12.2, 4.2, 12.2),
      line(18.2, 12.2, 19.8, 12.2),
      G("eyes", [
        circle(9.7, 12.2, 0.75, fill()),
        circle(14.3, 12.2, 0.75, fill()),
      ]),
      path("M9.8 15.4c.6.5 1.4.8 2.2.8s1.6-.3 2.2-.8"),
    ],
    gAnims: { eyes: tn("translate", ["0 0", "0 0", "0 0.8", "0 0"], [0, 0.42, 0.58, 1]) },
  },

  /* tall remote: power dot, d-pad ring, button rows */
  "remote-control": {
    auto: false,
    dur: 2.2,
    parts: [
      rect(8.6, 3.4, 6.8, 17.2, 2.6),
      A(circle(12, 6.4, 0.7, fill()), BLINK(0.15)),
      circle(12, 11, 1.9),
      circle(12, 11, 0.6, fill()),
      line(10.2, 15.6, 13.8, 15.6),
      line(10.2, 18.2, 13.8, 18.2),
    ],
  },
};
