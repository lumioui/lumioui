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

/* ---- bespoke gesture idioms (same vocabulary as the craft batches) ---- */
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
/* the off-stroke slash that flashes (monitor-off / camera-off01 idiom). */
const SLASH = (x1, y1, x2, y2) => A(line(x1, y1, x2, y2), BLINK(0.15));
/* broadcast ripple — scale-pop from a base point, offset into the cycle. */
const RIPPLE = (cx, cy, t0, s = 1.18) => ({
  pivot: [cx, cy],
  anim: tn("scale", ["1", "1", `${s}`, "1", "1"], [0, t0, +(t0 + 0.13).toFixed(3), +(t0 + 0.3).toFixed(3), 1]),
});
/* continuous spin — 360≡0 so the last-key snap is invisible; needs pp:false. */
const SPIN = (cx, cy) => tn("rotate", [`0 ${cx} ${cy}`, `360 ${cx} ${cy}`, `0 ${cx} ${cy}`], [0, 0.97, 1]);
/* one opacity dip offset into the cycle — cascade it across parts. */
const PULSE = (t0) => [an("opacity", ["1", "1", "0.3", "1", "1"], [0, t0, +(t0 + 0.12).toFixed(3), +(t0 + 0.26).toFixed(3), 1])];

/* ---- shared silhouettes ---- */

/* canon file body + dogear fold — same family as file-plus / file-check. */
const FILE_BODY =
  "M7.7 3L12.6 3C13.1 3.1 13.6 3.3 14 3.7L18.3 8C18.7 8.5 19 9 19 9.6L19 18.3C19 19.8 17.8 21 16.3 21L7.7 21C6.2 21 5 19.8 5 18.3L5 5.7C5 4.2 6.2 3 7.7 3Z";
const FILE_FOLD = "M13.5 3.2L13.5 6.1C13.5 7.9 15 9.3 16.8 9.3L19 9.3";

/* closed folder — same tabbed family as folder-open, front panel shut. */
const FOLDER =
  "M3.6 18.6L3.6 6.2C3.6 5 4.6 4 5.8 4L9.6 4C10.2 4 10.7 4.2 11.1 4.7L12.1 5.9C12.5 6.4 13 6.6 13.6 6.6L18.2 6.6C19.4 6.6 20.4 7.6 20.4 8.9L20.4 18.6C20.4 19.8 19.4 20.8 18.2 20.8L5.8 20.8C4.6 20.8 3.6 19.8 3.6 18.6Z";

/* canon speaker cone — same as volume / volume-2. */
const CONE =
  "M11.5 4.7C12.3 4.7 12.9 5.3 12.9 6.1L12.9 17.9C12.9 18.7 12.3 19.3 11.5 19.3C11.1 19.3 10.7 19.1 10.3 18.8L7.3 15.4L5.4 15.4C4.2 15.4 3.4 14.6 3.4 13.4L3.4 10.6C3.4 9.4 4.2 8.6 5.4 8.6L7.3 8.6L10.3 5.2C10.7 4.9 11.1 4.7 11.5 4.7Z";

/* canon camera body — same as camera / camera-off01. */
const CAM_BODY =
  "M3.6 10.6c0-1.9 1.5-3.4 3.4-3.4h1.3l2.1-3.2h3.2l2.1 3.2h1.3c1.9 0 3.4 1.5 3.4 3.4v5.6c0 1.9-1.5 3.4-3.4 3.4H7c-1.9 0-3.4-1.5-3.4-3.4v-5.6z";

export const icons = {
  /* ------------------------------ files ------------------------------ */

  file: {
    dur: 1.5,
    parts: [path(FILE_BODY), path(FILE_FOLD)],
  },

  "file-minus": {
    dur: 1.5,
    parts: [path(FILE_BODY), path(FILE_FOLD), line(9.6, 15, 14.4, 15)],
  },

  "file-x": {
    dur: 1.5,
    parts: [path(FILE_BODY), path(FILE_FOLD), path("M10.1 12.9l3.8 3.8M13.9 12.9l-3.8 3.8")],
  },

  /* a little landscape tucked in the sheet */
  "file-image": {
    dur: 1.6,
    parts: [
      path(FILE_BODY),
      path(FILE_FOLD),
      circle(9.9, 12.2, 1),
      path("M8.2 17.4l2.4-2.4 1.5 1.5 1.3-1.3 2.4 2.4"),
    ],
  },

  "file-video": {
    dur: 1.5,
    parts: [path(FILE_BODY), path(FILE_FOLD), path("M10.3 12.5l4.5 2.5-4.5 2.5z")],
  },

  "file-code": {
    dur: 1.5,
    parts: [
      path(FILE_BODY),
      path(FILE_FOLD),
      path("M10.2 12.6 8.4 14.4l1.8 1.8"),
      path("M13.8 12.6l1.8 1.8-1.8 1.8"),
    ],
  },

  /* signed document — a signature scribble near the foot */
  "file-pdf": {
    dur: 1.6,
    parts: [
      path(FILE_BODY),
      path(FILE_FOLD),
      path("M8.2 16.9c.8-2.8 1.4-3.7 1.7-2.1.3 1.5 1.4 1.6 2.1.1.5-1 1.2-.9 1.7-.2.4.6 1 .8 2 .8"),
    ],
  },

  "file-spreadsheet": {
    dur: 1.6,
    parts: [
      path(FILE_BODY),
      path(FILE_FOLD),
      rect(8.8, 11.8, 6.4, 5, 0.8),
      path("M8.8 14.3h6.4M12 11.8v5"),
    ],
  },

  folder: {
    dur: 1.5,
    parts: [path(FOLDER)],
  },

  "folder-plus": {
    dur: 1.5,
    parts: [path(FOLDER), path("M12 12.6v4.4M9.8 14.8h4.4")],
  },

  "folder-minus": {
    dur: 1.5,
    parts: [path(FOLDER), line(9.8, 14.8, 14.2, 14.8)],
  },

  "folder-check": {
    dur: 1.6,
    parts: [path(FOLDER), path("M9.9 14.6l1.7 1.8 3-3.1")],
  },

  "folder-x": {
    dur: 1.5,
    parts: [path(FOLDER), path("M10.4 13.2l3.2 3.2M13.6 13.2l-3.2 3.2")],
  },

  /* the lid lifts off the can — trash's free-standing twin */
  "trash-2": {
    auto: false,
    dur: 1.5,
    parts: [
      G("lid", [
        line(4, 7.6, 20, 7.6),
        path("M9.8 7.6V6.3c0-.9.7-1.6 1.6-1.6h1.2c.9 0 1.6.7 1.6 1.6v1.3"),
      ]),
      path("M6 7.6l.9 10.3c.1 1.4 1.3 2.5 2.7 2.5h4.8c1.4 0 2.6-1.1 2.7-2.5L18 7.6"),
      path("M9.9 10.9l.3 5.2M14.1 10.9l-.3 5.2"),
    ],
    gAnims: { lid: DIP(0, -1.1) },
  },

  /* shutter up top, the magnetic hub spinning in the window */
  "floppy-disc": {
    auto: false,
    pp: false,
    dur: 2.4,
    parts: [
      path("M5.4 3.4L14.8 3.4C15.4 3.4 16 3.6 16.4 4.1L19.9 7.6C20.3 8 20.6 8.6 20.6 9.2L20.6 18.6C20.6 19.6 19.8 20.6 18.8 20.6L5.2 20.6C4.2 20.6 3.4 19.6 3.4 18.6L3.4 5.4C3.4 4.4 4.2 3.4 5.4 3.4Z"),
      rect(7.4, 3.4, 9, 5.4, 1),
      line(9.4, 4.8, 9.4, 7.4),
      G("hub", [circle(12, 16.4, 2.3), line(12, 16.4, 13.9, 16.4)]),
    ],
    gAnims: { hub: SPIN(12, 16.4) },
  },

  /* chamfered card seats into the slot */
  "sd-card": {
    auto: false,
    dur: 1.6,
    parts: [
      G("card", [
        path("M6.4 20.8L6.4 7.4L9.8 4L17.6 4C18.8 4 19.6 4.8 19.6 6L19.6 19C19.6 20 18.8 20.8 17.6 20.8Z"),
        path("M10.6 4.5v2.6M13.2 4.5v2.6M15.8 4.5v2.6"),
      ]),
    ],
    gAnims: { card: DIP(0, 1.1) },
  },

  /* the activity light breathes */
  "hard-drive": {
    auto: false,
    dur: 1.7,
    parts: [
      rect(3.6, 8.2, 16.8, 7.8, 2.4),
      line(6.4, 12.1, 14.4, 12.1),
      A(circle(17.4, 12.1, 0.6, fill()), BLINK(0.12)),
    ],
  },

  /* open drive, top view — the read arm sweeps the platter */
  "hard-disk": {
    auto: false,
    dur: 1.8,
    parts: [
      rect(4.2, 4.4, 15.6, 15.2, 2.2),
      circle(9.7, 12, 4.4),
      circle(9.7, 12, 0.7, fill()),
      circle(17.3, 7.4, 0.55, fill()),
      circle(16.9, 17.5, 1.1),
      G("arm", [path("M16.7 17.3L13.1 14.9")]),
    ],
    gAnims: { arm: tn("rotate", ["0 16.9 17.5", "0 16.9 17.5", "-14 16.9 17.5", "0 16.9 17.5", "0 16.9 17.5"], HOLD) },
  },

  /* ------------------------------ devices ------------------------------ */

  /* twin antenna ears — the set wiggles like it caught a signal */
  tv: {
    auto: false,
    dur: 1.7,
    parts: [
      rect(3.4, 6.6, 17.2, 11.8, 2.6),
      G("ant", [path("M8.2 3.4L10.9 6.6"), path("M15.8 3.4L13.1 6.6")]),
      path("M8.8 21l.9-2.2M15.2 21l-.9-2.2"),
    ],
    gAnims: { ant: tn("rotate", ["0 12 6.6", "0 12 6.6", "-7 12 6.6", "5 12 6.6", "0 12 6.6"], HOLD) },
  },

  /* it buzzes like a muted call */
  smartphone: {
    auto: false,
    dur: 1.5,
    parts: [
      G("buzz", [
        rect(7.6, 2.8, 8.8, 18.4, 2.7),
        line(10.8, 4.9, 13.2, 4.9),
        line(10.6, 18.8, 13.4, 18.8),
      ]),
    ],
    gAnims: { buzz: WIG(12, 12, 2.4) },
  },

  /* a tap rings the glass */
  tablet: {
    auto: false,
    dur: 1.9,
    parts: [
      rect(4.6, 4.2, 14.8, 15.8, 2.6),
      line(10.8, 17.8, 13.2, 17.8),
      A(circle(12, 11.4, 0.9), [
        an("r", ["0.9", "0.9", "3.4", "0.9"], [0, 0.3, 0.62, 1]),
        an("opacity", ["0", "0", "0.9", "0", "0"], [0, 0.3, 0.4, 0.62, 1]),
      ]),
    ],
  },

  /* the second hand ticks twice, then eases back */
  watch: {
    auto: false,
    pp: false,
    dur: 1.9,
    parts: [
      path("M9.7 7.4V4.8c0-1 .8-1.8 1.8-1.8h1c1 0 1.8.8 1.8 1.8v2.6"),
      path("M9.7 16.6v2.6c0 1 .8 1.8 1.8 1.8h1c1 0 1.8-.8 1.8-1.8v-2.6"),
      circle(12, 12, 5.2),
      G("hands", [path("M12 12V10M12 12l2.2 1.4")]),
    ],
    gAnims: {
      hands: tn("rotate", ["0 12 12", "0 12 12", "13 12 12", "13 12 12", "26 12 12", "0 12 12"], [0, 0.28, 0.34, 0.58, 0.64, 1]),
    },
  },

  /* the sheet feeds out of the slot */
  printer: {
    auto: false,
    dur: 1.8,
    parts: [
      path("M7.6 9.8V5c0-1 .8-1.8 1.8-1.8h5.2c1 0 1.8.8 1.8 1.8v4.8"),
      rect(3.6, 9.8, 16.8, 7.6, 2.4),
      line(7.4, 13.8, 16.6, 13.8),
      G("sheet", [
        path("M8.4 13.8h7.2v6c0 .5-.4.9-.9.9H9.3c-.5 0-.9-.4-.9-.9v-6z"),
        path("M10.4 16.4h3.4M10.4 18.6h2.6"),
      ]),
      circle(18.3, 11.8, 0.55, fill()),
    ],
    gAnims: { sheet: DIP(0, 1.3) },
  },

  /* the wheel dips — a scroll */
  mouse: {
    auto: false,
    dur: 1.6,
    parts: [
      rect(8, 3.6, 8, 16.8, 4),
      A(line(12, 6.8, 12, 9.4), [tn("translate", ["0 0", "0 0", "0 1", "0 0", "0 0"], HOLD)]),
    ],
  },

  /* status lights flicker in turn */
  server: {
    auto: false,
    dur: 1.9,
    parts: [
      rect(4.2, 4.4, 15.6, 6.6, 1.9),
      rect(4.2, 13, 15.6, 6.6, 1.9),
      A(circle(7.2, 7.7, 0.55, fill()), PULSE(0.28)),
      A(circle(7.2, 16.3, 0.55, fill()), PULSE(0.52)),
      path("M15.6 7.7h1.6M15.6 16.3h1.6"),
    ],
  },

  "server-off": {
    auto: false,
    dur: 1.6,
    parts: [
      rect(4.2, 4.4, 15.6, 6.6, 1.9),
      rect(4.2, 13, 15.6, 6.6, 1.9),
      circle(7.2, 7.7, 0.55, fill()),
      circle(7.2, 16.3, 0.55, fill()),
      path("M15.6 7.7h1.6M15.6 16.3h1.6"),
      SLASH(3.8, 3.4, 20.2, 20.6),
    ],
  },

  /* waves broadcast out of the corner dot */
  rss: {
    auto: false,
    dur: 1.9,
    parts: [
      G("dot", [circle(5.2, 18.6, 1.15, fill())]),
      G("a1", [path("M5.2 13a5.6 5.6 0 0 1 5.6 5.6")]),
      G("a2", [path("M5.2 7.7a10.9 10.9 0 0 1 10.9 10.9")]),
    ],
    sAnims: {
      dot: RIPPLE(5.2, 18.6, 0.08, 1.3),
      a1: RIPPLE(5.2, 18.6, 0.2),
      a2: RIPPLE(5.2, 18.6, 0.34),
    },
  },

  /* bars flick on one after another */
  signal: {
    auto: false,
    dur: 1.9,
    parts: [
      A(line(5.2, 18.6, 5.2, 15.6), PULSE(0.14)),
      A(line(9.4, 18.6, 9.4, 13), PULSE(0.28)),
      A(line(13.6, 18.6, 13.6, 10.2), PULSE(0.42)),
      A(line(17.8, 18.6, 17.8, 7.4), PULSE(0.56)),
    ],
  },

  /* winged bird — the transponder pings down-range */
  satellite: {
    auto: false,
    dur: 2,
    parts: [
      rect(4.6, 5, 4.8, 2.4, 0.8, { transform: "rotate(-45 7 6.2)" }),
      path("M12 8.6l3.4 3.4-3.4 3.4-3.4-3.4z"),
      rect(14.6, 16.6, 4.8, 2.4, 0.8, { transform: "rotate(-45 17 17.8)" }),
      G("p1", [path("M13.4 5.4a6.4 6.4 0 0 1 5.3 5.3")]),
      G("p2", [path("M13.9 3.2a9.3 9.3 0 0 1 7.4 7.4")]),
    ],
    sAnims: {
      p1: RIPPLE(12, 12, 0.2),
      p2: RIPPLE(12, 12, 0.36),
    },
  },

  /* the feed horn chirps skyward */
  "satellite-dish": {
    auto: false,
    dur: 1.9,
    parts: [
      path("M4.8 9.4a7.8 7.8 0 0 0 11 11L4.8 9.4z"),
      line(10.1, 14.7, 12.7, 12.1),
      circle(13.3, 11.5, 0.6, fill()),
      G("w1", [path("M14.8 8.2a3.9 3.9 0 0 1 2.4 2.4")]),
      G("w2", [path("M15.7 5.3a6.9 6.9 0 0 1 4.1 4.1")]),
    ],
    sAnims: {
      w1: RIPPLE(13.3, 11.5, 0.18),
      w2: RIPPLE(13.3, 11.5, 0.32),
    },
  },

  /* waves pushed from the corner of the screen */
  cast: {
    auto: false,
    dur: 1.9,
    parts: [
      path("M13.4 18h4.4c1.4 0 2.4-1 2.4-2.4V8.4c0-1.4-1-2.4-2.4-2.4H6.2C4.9 6 3.8 7 3.8 8.4v2.2"),
      G("dot", [circle(3.8, 18.6, 1.05, fill())]),
      G("a1", [path("M3.8 14.4a4.2 4.2 0 0 1 4.2 4.2")]),
      G("a2", [path("M3.8 10.6a8 8 0 0 1 8 8")]),
    ],
    sAnims: {
      dot: RIPPLE(3.8, 18.6, 0.08, 1.3),
      a1: RIPPLE(3.8, 18.6, 0.2),
      a2: RIPPLE(3.8, 18.6, 0.34),
    },
  },

  /* the trident seats into the port */
  "usb": { dur: 1.4, auto: true, parts: [
    path("M12 3.5V18"),
    path("M10 6.2 12 3.5 14 6.2"),
    circle(12, 19.6, 1.8),
    path("M12 14.5 7 11.8V9"),
    circle(7, 7.6, 1.5),
    path("M12 11.5 17 9V8"),
    rect(15.2, 5, 3.6, 3, 0.6),
  ] },

  /* the contacts strobe like live data */
  "ethernet-port": {
    auto: false,
    dur: 1.9,
    parts: [
      rect(4.4, 6.6, 15.2, 12, 1.9),
      A(line(8.2, 6.6, 8.2, 9.8), PULSE(0.12)),
      A(line(10.6, 6.6, 10.6, 9.8), PULSE(0.24)),
      A(line(13, 6.6, 13, 9.8), PULSE(0.36)),
      A(line(15.4, 6.6, 15.4, 9.8), PULSE(0.48)),
      path("M9.8 18.6v-1.5c0-.4.3-.7.7-.7h3c.4 0 .7.3.7.7v1.5"),
    ],
  },

  /* the stick rocks on its dome */
  joystick: {
    auto: false,
    dur: 1.7,
    parts: [
      G("tilt", [
        circle(12, 6.6, 2.7),
        path("M12 9.3v6.1"),
      ]),
      path("M6.6 20.4c0-2.7 2.4-4.8 5.4-4.8s5.4 2.1 5.4 4.8z"),
      line(4.4, 20.4, 19.6, 20.4),
    ],
    gAnims: { tilt: tn("rotate", ["0 12 15.6", "-9 12 15.6", "8 12 15.6", "0 12 15.6"], [0, 0.3, 0.65, 1]) },
  },

  /* ------------------------------ media ------------------------------ */

  /* autofocus breathes the lens */
  webcam: {
    auto: false,
    dur: 1.9,
    parts: [
      circle(12, 9.6, 6),
      A(circle(12, 9.6, 2.3), [an("r", ["2.3", "2.3", "1.5", "2.3", "2.3"], HOLD)]),
      circle(14.2, 7.5, 0.6, fill()),
      line(12, 15.6, 12, 18),
      path("M8 20.6c.8-1.8 2.3-2.8 4-2.8s3.2 1 4 2.8"),
    ],
  },

  /* the canon body + lens with the off slash */
  "camera-off": {
    auto: false,
    dur: 1.6,
    parts: [
      path(CAM_BODY),
      circle(12, 13.4, 3.2),
      SLASH(3.4, 3.8, 20.6, 20.2),
    ],
  },

  /* handheld capsule — it sways like a chorus */
  "mic-2": {
    auto: false,
    dur: 1.8,
    parts: [
      G("mic", [
        circle(12, 8.2, 4.6),
        path("M7.9 6.8c2.8-.5 5.5-.5 8.2 0M8.2 9.9c2.6.4 5 .4 7.6 0"),
        path("M10.2 12.3l-.9 5.6c-.2 1 .6 2 1.6 2h2.2c1 0 1.8-1 1.6-2l-.9-5.6"),
      ]),
    ],
    gAnims: { mic: WIG(12, 19.5, 5) },
  },

  /* the woofer thumps */
  speaker: {
    auto: false,
    dur: 1.6,
    parts: [
      rect(5.6, 3.4, 12.8, 17.2, 2.6),
      circle(12, 7.8, 1.7),
      G("woof", [circle(12, 15, 3.6), circle(12, 15, 0.8, fill())]),
    ],
    sAnims: { woof: POP(12, 15, 1.14) },
  },

  /* cone + one wave — volume-2's quieter sibling */
  "volume-1": {
    auto: false,
    dur: 1.7,
    parts: [
      path(CONE),
      G("w1", [path("M15.7 9.5C16.5 10.3 17 11.1 17 12S16.5 13.7 15.7 14.5")]),
    ],
    sAnims: { w1: RIPPLE(12.9, 12, 0.28, 1.16) },
  },

  "volume-x": {
    auto: false,
    dur: 1.5,
    parts: [
      path(CONE),
      G("x", [path("M16.2 10.2l3.6 3.6M19.8 10.2l-3.6 3.6")]),
    ],
    sAnims: { x: POP(18, 12, 1.2) },
  },

  /* shine arcs chase around the disc */
  disc: {
    auto: false,
    pp: false,
    dur: 2.4,
    parts: [
      circle(12, 12, 8.6),
      circle(12, 12, 2.5),
      G("spin", [
        path("M14.9 6.9a6.4 6.4 0 0 1 2.5 2.5"),
        path("M9.1 17.1a6.4 6.4 0 0 1-2.5-2.5"),
      ]),
    ],
    gAnims: { spin: SPIN(12, 12) },
  },

  /* counter-spin — single long shine and a tighter hub */
  "disc-2": {
    auto: false,
    pp: false,
    dur: 2.8,
    parts: [
      circle(12, 12, 8.6),
      circle(12, 12, 1.6),
      circle(12, 12, 0.5, fill()),
      G("spin", [
        path("M16.3 7a6.8 6.8 0 0 1 1.3 4.3"),
        path("M6.9 16.2a7.2 7.2 0 0 0 2.6 2.6"),
      ]),
    ],
    gAnims: { spin: tn("rotate", ["0 12 12", "-360 12 12", "0 12 12"], [0, 0.97, 1]) },
  },

  /* grooves orbit under the label */
  vinyl: {
    auto: false,
    pp: false,
    dur: 3.2,
    parts: [
      circle(12, 12, 8.8),
      circle(12, 12, 3.4),
      circle(12, 12, 0.7, fill()),
      G("spin", [
        path("M7.2 8.9a6.9 6.9 0 0 1 2.3-2.5"),
        path("M16.8 15.1a6.9 6.9 0 0 1-2.3 2.5"),
        line(12, 5.1, 12, 5.9),
      ]),
    ],
    gAnims: { spin: SPIN(12, 12) },
  },
};
