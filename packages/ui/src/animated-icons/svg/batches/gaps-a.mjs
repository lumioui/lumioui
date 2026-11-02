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

/* Fundamental-concept coverage glyphs. Default `auto` draw-on everywhere;
 * only rocket / plane / tram-front carry a bespoke gesture (one each). */
const HOLD = [0, 0.3, 0.55, 0.8, 1];
const POP = (cx, cy, s = 1.24) => ({
  pivot: [cx, cy],
  anim: tn("scale", ["1", "1", `${s}`, "1", "1"], HOLD),
});

export const icons = {
  /* classic attachment loop — nested wire, diagonal */
  paperclip: {
    parts: [
      path("M21.3 11.3l-9 9a5.2 5.2 0 0 1-7.4-7.4l8.4-8.4a3.4 3.4 0 0 1 4.8 4.8l-8.4 8.4a1.6 1.6 0 0 1-2.3-2.3l7.4-7.4"),
    ],
  },

  /* closed parcel box — hexagon + top seam + tape */
  package: {
    parts: [
      path("M12 3.4l8 4.4v8.4l-8 4.4-8-4.4V7.8z"),
      path("M4 7.8l8 4.4 8-4.4"),
      path("M12 12.2v8.4"),
      path("M8.2 5.4l8 4.5"),
    ],
  },

  /* Erlenmeyer flask — neck, cone, liquid line, one bubble */
  flask: {
    parts: [
      path("M10.2 3.6V9c0 .4-.1.9-.4 1.2l-4.4 7.4c-.7 1.1 0 2.5 1.3 2.5h10.6c1.3 0 2-1.4 1.3-2.5l-4.4-7.4c-.3-.3-.4-.8-.4-1.2V3.6"),
      path("M8.6 3.6h6.8"),
      path("M7.6 15.4h8.8"),
      circle(13.2, 17.3, 0.9, fill()),
    ],
  },

  /* artist palette — blob with thumb scallop + paint dabs */
  palette: {
    parts: [
      path("M12 3.6c4.9 0 8.4 3.2 8.4 7 0 1.6-1.1 2.7-2.6 2.9h-2.3c-.9 0-1.6.8-1.6 1.7 0 .5.2.9.5 1.2.3.3.5.7.5 1.1 0 1.1-.9 2-2 2.1-5.3.7-9.4-2.5-9.4-8.2 0-4.5 3.8-7.8 8.5-7.8z"),
      circle(8.2, 8.8, 1.1, fill()),
      circle(12.4, 7.5, 1.1, fill()),
      circle(16, 9.4, 1.1, fill()),
      circle(8.7, 13.4, 1.1, fill()),
    ],
  },

  /* plain tee — collar dip, stub sleeves, hem */
  shirt: {
    parts: [
      path("M20.3 8.5l-3.3-3.1c-1-.9-2-1.4-2.9-1.7-.5.9-1.2 1.4-2.1 1.4s-1.6-.5-2.1-1.4c-.9.3-1.9.8-2.9 1.7l-3.3 3.1c-.4.4-.5 1-.2 1.4l1.9 2.4c.4.5 1.1.5 1.5.1l1.1-.9v6.3c0 1.4 1.2 2.6 2.6 2.6h2.8c1.4 0 2.6-1.2 2.6-2.6v-6.3l1.1.9c.4.4 1.1.4 1.5-.1l1.9-2.4c.3-.4.2-1-.2-1.4z"),
    ],
  },

  /* fork + knife, plump and side by side */
  utensils: {
    parts: [
      path("M5.2 3.5v4.4c0 2 1.6 3.4 3.6 3.4s3.6-1.4 3.6-3.4V3.5"),
      path("M8.8 3.5v3.6"),
      path("M8.8 11.3v9.3"),
      path("M17 20.6V3.5c2.4.5 4 3.4 4 6.9 0 2.5-1.7 4.3-4 4.3"),
    ],
  },

  /* medal — ribbon V + disc + inner ring */
  medal: {
    parts: [
      circle(12, 16, 4.3),
      circle(12, 16, 2),
      path("M9 12.4 6.7 3.7"),
      path("M15 12.4l2.3-8.7"),
    ],
  },

  /* trophy — cup with handles, stem, pedestal foot */
  trophy: {
    parts: [
      path("M7.4 4.4h9.2v4.6c0 2.8-2.1 5-4.6 5s-4.6-2.2-4.6-5V4.4z"),
      path("M7.4 6H6c-1.3 0-2.4 1.1-2.4 2.4.2 2.2 1.8 3.8 4 4.1"),
      path("M16.6 6h1.4c1.3 0 2.4 1.1 2.4 2.4-.2 2.2-1.8 3.8-4 4.1"),
      path("M12 14v2.6"),
      path("M9.6 16.6h4.8M8.8 20.9h6.4"),
    ],
  },

  /* crown — three peaks over a band, one jewel */
  crown: {
    parts: [
      path("M5.7 17.4L4.2 8.5c-.1-.6.5-1 1-.7l3.2 2.4 3.1-4.9c.3-.5 1-.5 1.3 0l3.1 4.9 3.2-2.4c.5-.3 1.1.1 1 .7l-1.5 8.9c-.1.7-.6 1.1-1.3 1.1H7c-.7 0-1.2-.4-1.3-1.1z"),
      circle(12, 13.6, 1, fill()),
    ],
  },

  /* rocket, nose up-right — exhaust flame flickers */
  rocket: {
    dur: 1.7,
    parts: [
      G("flame", [
        path("M6.1 16.6c-1.5 1.2-2.2 4.5-2.2 4.5s3.3-.7 4.5-2.2c.7-.8.7-2-.1-2.6-.7-.6-1.9-.5-2.2.3z"),
      ]),
      path("M10.1 11.9c.9-2.5 2.3-4.6 4.3-6.3 2.2-1.9 4.7-2.7 6.9-2.6.1 2.2-.7 4.7-2.6 6.9-1.7 2-3.8 3.4-6.3 4.3l-2.3-2.3z"),
      path("M10.1 11.9l-3 .3c-.8.1-1.6-.4-1.8-1.2-.3-1 .2-1.9 1.1-2.3 1.1-.4 2.4-.2 3.7.2"),
      path("M12.4 13.9l-.3 3c-.1.8.4 1.6 1.2 1.8 1 .3 1.9-.2 2.3-1.1.4-1.1.2-2.4-.2-3.7"),
      circle(15.2, 8.8, 1.7),
    ],
    sAnims: { flame: POP(6.6, 18.8, 1.28) },
  },

  /* jet, top view pointing NE — banks gently */
  "plane": { dur: 1.4, auto: true, parts: [
    path("M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"),
  ] },

  /* tram head-on — pantograph, windshield, rail feet; rolls on suspension */
  "tram-front": {
    dur: 1.7,
    parts: [
      G("roll", [
        path("M9.5 4.6l2.5-2.1 2.5 2.1M12 2.5v1.1"),
        path("M5.6 9.2c0-1.9.2-3.1.8-3.9.7-1 2-1.3 5.6-1.3s4.9.3 5.6 1.3c.6.8.8 2 .8 3.9v6.4c0 1.8-.3 2.6-1 3.3-.7.8-1.9 1.1-3.9 1.1h-3.7c-2 0-3.2-.3-3.9-1.1-.7-.7-1-1.5-1-3.3V9.2z"),
        path("M5.7 10.4c2.1.9 4.2 1.3 6.3 1.3s4.2-.4 6.3-1.3"),
        path("M7.3 15.6h1.8M14.9 15.6h1.8"),
        path("M8.5 20.4l-1.8 1.4M15.5 20.4l1.8 1.4"),
      ]),
    ],
    gAnims: {
      roll: tn("rotate", ["0 12 21", "0 12 21", "2.4 12 21", "-2 12 21", "0 12 21"], HOLD),
    },
  },

  /* briefcase — body, handle, lid seam, clasp */
  briefcase: {
    parts: [
      path("M3.2 10.8c0-1.4 1.1-2.5 2.5-2.5h12.6c1.4 0 2.5 1.1 2.5 2.5v6.4c0 1.4-1.1 2.5-2.5 2.5H5.7c-1.4 0-2.5-1.1-2.5-2.5v-6.4z"),
      path("M9.4 8.3V6.4c0-1.1.9-2 2-2h1.2c1.1 0 2 .9 2 2v1.9"),
      path("M3.2 12.4h17.6"),
      path("M10.9 12.4v2.1c0 .6.5 1.1 1.1 1.1s1.1-.5 1.1-1.1v-2.1"),
    ],
  },

  /* the bare shield — no emblem inside */
  shield: {
    parts: [
      path("M12 3.2c1.9 1.2 4.3 2.2 7.4 2.6 1 .1 1.7 1 1.7 2v3.9c0 4.3-3.5 7-7 8.8-1.3.6-3.1.6-4.4 0-3.5-1.8-7-4.5-7-8.8V7.8c0-1 .7-1.9 1.7-2 3.1-.4 5.5-1.4 7.6-2.6z"),
    ],
  },

  /* open book — two lobes meeting at the spine crease */
  "book-open": {
    parts: [
      path("M12 6.9c-1.6-1.3-3.8-1.8-6.3-1.6-1 .1-1.9 1-1.9 2v9.5c0 1 .8 1.9 1.9 2 2.4.1 4.7.8 6.3 2"),
      path("M12 6.9c1.6-1.3 3.8-1.8 6.3-1.6 1 .1 1.9 1 1.9 2v9.5c0 1-.8 1.9-1.9 2-2.4.1-4.7.8-6.3 2"),
    ],
  },

  /* document with folded corner + text lines */
  "file-text": {
    parts: [
      path("M8.3 3.4h5.4l4.6 4.6v10.2c0 1.3-1.1 2.4-2.4 2.4H8.3c-1.3 0-2.4-1.1-2.4-2.4V5.8c0-1.3 1.1-2.4 2.4-2.4z"),
      path("M13.7 3.8v3.6c0 .9.7 1.6 1.6 1.6h3"),
      path("M8.7 9.6h3"),
      path("M8.7 12.8h6.6"),
      path("M8.7 16h6.6"),
    ],
  },

  /* landmark — pediment triangle + attic dot + 4 columns + steps */
  landmark: {
    parts: [
      path("M4.4 8.6h15.2L12 4.2z"),
      path("M7 12.6v4.2M12 12.6v4.2M17 12.6v4.2"),
      path("M4 20.8h16"),
    ],
  },

  /* side-profile box truck */
  truck: {
    parts: [
      path("M3.4 15.6V7.2c0-.7.6-1.3 1.3-1.3h8.6c.7 0 1.3.6 1.3 1.3v8.4"),
      path("M15.1 15.6V9.7c0-.6.4-1 1-1h2.2c.5 0 .9.2 1.2.6l2.1 2.8c.2.3.4.7.4 1.1v1.7c0 .6-.5 1-1 1h-5.9z"),
      path("M3.2 18h2.1M8.9 18h6.2M18.9 18h1.9"),
      circle(7, 18, 1.9),
      circle(17.2, 18, 1.9),
    ],
  },

  /* side-profile sedan — soft blob body, two wheels, headlight */
  car: {
    parts: [
      path("M4.5 16.6c-.9 0-1.6-.7-1.6-1.6v-2.1c0-.6.3-1.1.8-1.4l1.6-1c.4-.3.8-.6 1-1l1.6-2.5c.4-.6 1-1 1.7-1h4.8c.7 0 1.3.3 1.8.8l2.1 2.7c.3.4.7.7 1.2.8l1.3.5c.6.2 1 .8 1 1.4v2.6c0 .9-.7 1.6-1.6 1.6H4.5z"),
      path("M9.2 18h5.6"),
      circle(7, 18, 1.9),
      circle(17, 18, 1.9),
      circle(19.3, 13.2, 0.7, fill()),
    ],
  },

  /* plain teardrop pin */
  pin: {
    parts: [
      path("M12 21.4s7-6 7-11.1a7 7 0 1 0-14 0c0 5.1 7 11.1 7 11.1z"),
      circle(12, 10.3, 1.9),
    ],
  },

  /* face-id scan — corner brackets + eyes + smile */
  "scan-face": {
    parts: [
      path("M3.4 7.3V6c0-1.4 1.1-2.6 2.6-2.6h1.3M16.7 3.4H18c1.4 0 2.6 1.1 2.6 2.6v1.3M20.6 16.7V18c0 1.4-1.1 2.6-2.6 2.6h-1.3M7.3 20.6H6c-1.4 0-2.6-1.1-2.6-2.6v-1.3"),
      path("M9.5 9.9v1.2M14.5 9.9v1.2"),
      path("M9.4 14.2c.8 1 1.6 1.5 2.6 1.5s1.8-.5 2.6-1.5"),
    ],
  },

  /* person bust + plus at bottom-right (user proportions) */
  "user-plus": {
    parts: [
      circle(10.3, 8.2, 3.5),
      path("M10.3 13.3c-3.2 0-5.5 2.3-5.5 5.3 0 .6.5 1.1 1.1 1.1h7.6"),
      path("M17.6 15.6v4.8M15.2 18h4.8"),
    ],
  },

  /* wheat ear — stalk + three leaf pairs */
  wheat: {
    parts: [
      path("M12 21.4V8.8"),
      /* staggered solid grains with air between them; the paired hollow
         lenses overlapped into one lump */
      path("M11 18.8c-2-.1-3.3-1.1-3.7-2.9 2 .1 3.3 1.1 3.7 2.9z", { fill: "currentColor" }),
      path("M13 16.2c2-.1 3.3-1.1 3.7-2.9-2 .1-3.3 1.1-3.7 2.9z", { fill: "currentColor" }),
      path("M11 13.6c-2-.1-3.3-1.1-3.7-2.9 2 .1 3.3 1.1 3.7 2.9z", { fill: "currentColor" }),
      path("M13 11c2-.1 3.3-1.1 3.7-2.9-2 .1-3.3 1.1-3.7 2.9z", { fill: "currentColor" }),
      path("M12 7.6c-.9-1.1-.9-2.6 0-3.8.9 1.2.9 2.7 0 3.8z", { fill: "currentColor" }),
    ],
  },

  /* backspace key — left-pointing pill with an × */
  delete: {
    parts: [
      path("M9.9 5.2h8.3c1.7 0 3 1.3 3 3v7.6c0 1.7-1.3 3-3 3H9.9c-.6 0-1.2-.2-1.7-.7l-4.5-5.3c-.6-.7-.6-1.7 0-2.4l4.5-5.3c.5-.5 1.1-.7 1.7-.7z"),
      path("M11.6 10.1l4.8 4.8M16.4 10.1l-4.8 4.8"),
    ],
  },
};
