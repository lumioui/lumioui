/* ai-* family, part 2 (image → template). Same kit and rules as
 * software-01: badge top-right, the host opens around it; inner sparkles
 * are the same filled star; "AI" lettering only where it fits at ≥6.5px. */
import {
  path, circle, line, rect, fill, A, G, an, tn, P,
  sparkD, star, twinkle, badge, BX, BY, BR, gapX, gapY, openRect, ringOpen,
  chip, bulb,
} from "./_ai-kit.mjs";

const PANEL = openRect(3.5, 4, 17, 16.5, 3.5);
/** Shield shared by the security glyphs. */
const SHIELD = "M12 3.2c1.8 1.3 4 2.3 6.4 2.8.9.2 1.6 1 1.6 2v3.8c0 4.5-3 8.2-7.3 9.4-.5.1-.9.1-1.4 0C7 20 4 16.3 4 11.8V8c0-1 .7-1.8 1.6-2 2.4-.5 4.6-1.5 6.4-2.8z";
/** Envelope body opened for the badge. */
const ENVELOPE = openRect(2.5, 5, 19, 14, 3);
/** "AI" at 6.2px cap height, centred on (cx, cy): soft-apex A + crossbar, I stem. */
const aiType = (cx, cy) => [
  path(`M${P(cx - 3.95)} ${P(cy + 3)}l1.6-5.5c.2-.6 1-.6 1.2 0l1.6 5.5M${P(cx - 3.05)} ${P(cy + 1.2)}h2.6`),
  line(P(cx + 3.95), P(cy - 3), P(cx + 3.95), P(cy + 3)),
];
/** Scalloped bloom — the Lumio gear, same cosine modulation as gen.mjs. */
function flower(cx, cy, lobes, rMid, amp, steps = 14) {
  const pts = [];
  for (let i = 0; i < lobes * steps; i++) {
    const t = (i / (lobes * steps)) * Math.PI * 2;
    const r = rMid + amp * Math.cos(lobes * t + Math.PI / 2);
    pts.push(`${P(cx + r * Math.cos(t))} ${P(cy + r * Math.sin(t))}`);
  }
  return `M${pts.join("L")}Z`;
}
const pulse = (t) => an("opacity", ["1", "1", "0.3", "1", "1"], [0, t, t + 0.14, t + 0.3, 1]);

export const icons = {
  /* image: sun + ridge in a frame; the sun pulses, the badge flicks */
  "ai-image": {
    dur: 1.7,
    auto: false,
    parts: [
      path(PANEL),
      A(circle(8.6, 9.4, 1.5, fill()), [an("r", ["1.5", "1.5", "2", "1.5", "1.5"], [0, 0.25, 0.4, 0.55, 1])]),
      path("M20.5 16.6l-3-3a2 2 0 0 0-2.8 0l-6.4 6.4"),
      badge(0.5),
    ],
  },

  /* image edit: a frame opened at two corners — the badge, and a pencil
   * that nudges in to retouch */
  "ai-image-edit": {
    dur: 1.65,
    auto: false,
    parts: [
      path(`M${gapX(4)} 4H7a3.5 3.5 0 0 0-3.5 3.5V17A3.5 3.5 0 0 0 7 20.5h2.8`),
      path("M3.6 16.4l3.3-3.3a1.8 1.8 0 0 1 2.5 0l2.4 2.4"),
      circle(8.6, 8.6, 1.4, fill()),
      G("pen", [
        path("M13.4 20.6l.3-2.8 4.5-4.5a1.8 1.8 0 0 1 2.5 2.5l-4.5 4.5-2.8.3z"),
        line(13.7, 17.8, 16.2, 20.3),
      ]),
      badge(0.5),
    ],
    gAnims: { pen: tn("translate", ["0 0", "-0.7 0.7", "-0.7 0.7", "0 0"], [0, 0.26, 0.52, 1]) },
  },

  /* image01: the ridge line traces itself — the picture rendering */
  "ai-image01": {
    dur: 1.7,
    auto: false,
    parts: [
      path(PANEL),
      A(path("M3.5 15.6l3.3-3.3a1.8 1.8 0 0 1 2.5 0l2.2 2.2a1.4 1.4 0 0 0 2 0l1.2-1.2a1.8 1.8 0 0 1 2.5 0l3.3 3.3", { pathLength: 1, "stroke-dasharray": 1 }), [
        an("stroke-dashoffset", ["1", "1", "0", "0"], [0, 0.08, 0.5, 1]),
      ]),
      badge(0.55),
    ],
  },

  /* imagine: a thought cloud trailing two beads, the idea sparkling inside */
  "ai-imagine": {
    dur: 1.85,
    auto: false,
    parts: [
      G("cloud", [
        path("M8.6 16h9a3.6 3.6 0 0 0 .5-7A5.6 5.6 0 0 0 7.7 7.6 4.3 4.3 0 0 0 8.6 16z"),
        A(star(13, 11, 2.2), twinkle(13, 11, 0.5)),
      ]),
      circle(6.4, 19.2, 1.4, fill()),
      circle(3.4, 21, 1.1, fill()),
    ],
    sAnims: { cloud: { pivot: [13, 11.5], anim: tn("scale", ["1", "1.05", "1", "1"], [0, 0.3, 0.62, 1]) } },
  },

  /* innovation01: the bulb lights and a chip answers from the badge slot */
  "ai-innovation01": {
    dur: 1.7,
    auto: false,
    parts: [
      ...bulb(true).map((p, i) => (i < 2 ? A(p, [an("opacity", ["1", "1", "0.5", "1", "1"], [0, 0.25, 0.4, 0.58, 1])]) : p)),
      G("chip", chip(BX, BY, 4, 1.3)),
    ],
    sAnims: { chip: { pivot: [BX, BY], anim: tn("scale", ["1", "1", "1.16", "1", "1"], [0, 0.5, 0.66, 0.85, 1]) } },
  },

  /* innovation02: a closed bulb with the inner sparkle flaring inside */
  "ai-innovation02": {
    dur: 1.7,
    auto: false,
    parts: [
      ...bulb(false),
      G("core", [star(12, 9.6, 2.7)]),
    ],
    sAnims: { core: { pivot: [12, 9.6], anim: tn("scale", ["1", "1", "1.18", "1", "1"], [0, 0.3, 0.46, 0.64, 1]) } },
  },

  /* innovation03: a circuit fork inside the bulb, nodes pinging like eyes */
  "ai-innovation03": {
    dur: 1.7,
    auto: false,
    parts: [
      ...bulb(false),
      path("M12 13.6v-2.2M12 11.4L9.8 9.2M12 11.4l2.2-2.2"),
      A(circle(9.4, 8.6, 1.3, fill()), [an("r", ["1.3", "1.3", "1.6", "1.3", "1.3"], [0, 0.2, 0.32, 0.46, 1])]),
      A(circle(14.6, 8.6, 1.3, fill()), [an("r", ["1.3", "1.3", "1.6", "1.3", "1.3"], [0, 0.46, 0.58, 0.72, 1])]),
    ],
  },

  /* laptop: screen and base; the chip on screen lifts once */
  "ai-laptop": {
    dur: 1.65,
    auto: false,
    parts: [
      rect(4.5, 4, 15, 12, 2.6),
      path("M2.5 19.4h19"),
      G("chip", chip(12, 10, 4, 1.1)),
    ],
    gAnims: { chip: tn("translate", ["0 0", "0 -0.8", "0 -0.8", "0 0"], [0, 0.26, 0.55, 1]) },
  },

  /* learning: an open book, the sparkle glowing on its right page */
  "ai-learning": {
    dur: 1.7,
    auto: false,
    parts: [
      path("M12 7.2c-1.7-1.7-4-2.7-6.4-2.7H4a1 1 0 0 0-1 1V17a1 1 0 0 0 1 1h2.2c2.3 0 4.4.9 5.8 2.5 1.4-1.6 3.5-2.5 5.8-2.5H20a1 1 0 0 0 1-1V5.5a1 1 0 0 0-1-1h-1.6c-2.4 0-4.7 1-6.4 2.7z"),
      line(12, 7.2, 12, 20.2),
      A(star(16.5, 11.6, 1.6), [an("opacity", ["1", "0.3", "1", "1"], [0, 0.22, 0.4, 1]), ...twinkle(16.5, 11.6, 0.45)]),
    ],
  },

  /* lock: the shackle dips shut over a body carrying the inner sparkle */
  "ai-lock": {
    dur: 1.65,
    auto: false,
    parts: [
      G("shackle", [path("M8 10V7.5a4 4 0 0 1 8 0V10")]),
      rect(4.5, 10, 15, 11, 3),
      G("core", [star(12, 15.5, 2.3)]),
    ],
    gAnims: { shackle: tn("translate", ["0 0", "0 -0.9", "0 -0.9", "0 0"], [0, 0.26, 0.52, 1]) },
    sAnims: { core: { pivot: [12, 15.5], anim: tn("scale", ["1", "1", "1.15", "1", "1"], [0, 0.5, 0.64, 0.8, 1]) } },
  },

  /* magic: a big drawn star blooms and the badge answers */
  "ai-magic": {
    dur: 1.6,
    auto: false,
    parts: [
      G("big", [path(sparkD(10.4, 13.4, 7.4, 0.2))]),
      G("small", [star(BX, BY, BR)]),
    ],
    sAnims: {
      big: { pivot: [10.4, 13.4], anim: tn("scale", ["1", "1.1", "1", "1"], [0, 0.22, 0.46, 1]) },
      small: { pivot: [BX, BY], anim: tn("scale", ["1", "1", "1.3", "1", "1"], [0, 0.4, 0.56, 0.75, 1]) },
    },
  },

  /* mail: a letter carrying the sparkle slides up out of the envelope */
  "ai-mail": {
    dur: 1.65,
    auto: false,
    parts: [
      G("sheet", [path(`M7 10.6V5.5A2.5 2.5 0 0 1 9.5 3h${P(gapX(3) - 9.5)}`)]),
      path("M3 11.4v6.1a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3v-6.1"),
      path("M3.4 12.2l7 4.6c1 .6 2.2.6 3.2 0l7-4.6"),
      badge(0.5),
    ],
    gAnims: { sheet: tn("translate", ["0 0", "0 -1", "0 -1", "0 0"], [0, 0.28, 0.55, 1]) },
  },

  /* mail01: envelope opened for the badge, its flap nodding once */
  "ai-mail01": {
    dur: 1.65,
    auto: false,
    parts: [
      path(ENVELOPE),
      A(path("M3.6 7.2l6.8 4.7c1 .7 2.2.7 3.2 0l.5-.4"), [tn("translate", ["0 0", "0 0.8", "0 0.8", "0 0"], [0, 0.28, 0.55, 1])]),
      badge(0.5),
    ],
  },

  /* mail02: the back of an envelope — seams from the bottom corners */
  "ai-mail02": {
    dur: 1.65,
    auto: false,
    parts: [
      G("body", [
        path(ENVELOPE),
        path("M3.6 17.6l5.6-4.6M20.4 17.6l-5.6-4.6"),
        path("M3.6 7.2l6.8 4.7c1 .7 2.2.7 3.2 0l.5-.4"),
      ]),
      badge(0.55),
    ],
    sAnims: { body: { pivot: [12, 12], anim: tn("scale", ["1", "1.03", "1", "1"], [0, 0.26, 0.5, 1]) } },
  },

  /* mic: the capsule breathes — a take coming in */
  "ai-mic": {
    dur: 1.6,
    auto: false,
    parts: [
      G("cap", [
        rect(5.9, 4.4, 5, 9.4, 2.5),
        path("M2.6 11.6a5.8 5.8 0 0 0 11.6 0"),
      ]),
      line(8.4, 17.4, 8.4, 20.5),
      line(5.8, 20.5, 11, 20.5),
      badge(0.5),
    ],
    sAnims: { cap: { pivot: [8.4, 9], anim: tn("scale", ["1", "1.06", "1", "1"], [0, 0.25, 0.5, 1]) } },
  },

  /* network: a sparkle hub firing its four nodes, clockwise */
  "ai-network": {
    dur: 1.8,
    auto: false,
    parts: [
      G("hub", [star(12, 12, 3)]),
      path("M6.3 6.3L9 9M17.7 6.3L15 9M6.3 17.7L9 15M17.7 17.7L15 15"),
      A(circle(5, 5, 1.8), [an("r", ["1.8", "1.8", "2.2", "1.8", "1.8"], [0, 0.1, 0.24, 0.4, 1])]),
      A(circle(19, 5, 1.8), [an("r", ["1.8", "1.8", "2.2", "1.8", "1.8"], [0, 0.25, 0.39, 0.55, 1])]),
      A(circle(19, 19, 1.8), [an("r", ["1.8", "1.8", "2.2", "1.8", "1.8"], [0, 0.4, 0.54, 0.7, 1])]),
      A(circle(5, 19, 1.8), [an("r", ["1.8", "1.8", "2.2", "1.8", "1.8"], [0, 0.55, 0.69, 0.85, 1])]),
    ],
    sAnims: { hub: { pivot: [12, 12], anim: tn("scale", ["1", "1.15", "1", "1"], [0, 0.2, 0.45, 1]) } },
  },

  /* paintbrush: a loaded brush dabbing once, the badge above its handle */
  "ai-paintbrush": {
    dur: 1.65,
    auto: false,
    parts: [
      G("brush", [
        line(13.6, 10.4, 11.4, 12.6),
        path("M10 12.4c-2-.6-3.9 0-4.9 1.6-1.1 1.7-.9 4.1-1.7 6.1 2.2-.2 4.5-.4 6.1-1.6 1.5-1.1 2.1-3 1.5-4.9z"),
      ]),
      badge(0.5),
    ],
    gAnims: { brush: tn("translate", ["0 0", "-0.8 0.8", "-0.8 0.8", "0 0"], [0, 0.26, 0.52, 1]) },
  },

  /* phone01: handset opened for the badge, home bar pulsing as it lands */
  "ai-phone01": {
    dur: 1.65,
    auto: false,
    parts: [
      path(`M${gapX(3)} 3H8.5a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V${gapY(17.5)}`),
      A(line(10.2, 17.8, 12.8, 17.8), [pulse(0.3)]),
      badge(0.3),
    ],
  },

  /* phone02: a full handset, the on-screen sparkle blooming */
  "ai-phone02": {
    dur: 1.6,
    auto: false,
    parts: [
      rect(6, 2.5, 12, 19, 3),
      line(10.6, 18, 13.4, 18),
      G("star", [star(12, 10.6, 3)]),
    ],
    sAnims: { star: { pivot: [12, 10.6], anim: tn("scale", ["1", "1.2", "1", "1"], [0, 0.24, 0.48, 1]) } },
  },

  /* programming: angle brackets breathe apart — code being written */
  "ai-programming": {
    dur: 1.7,
    auto: false,
    parts: [
      path(PANEL),
      G("code", [path("M9 11.6l-2.4 2.6 2.4 2.6M14.4 11.6l2.4 2.6-2.4 2.6M12.6 10.8l-1.8 6.8")]),
      badge(0.5),
    ],
    sAnims: { code: { pivot: [12, 13.2], anim: tn("scale", ["1", "1.08", "1", "1"], [0, 0.25, 0.5, 1]) } },
  },

  /* replace: two panels either side of a divider, dimming in turn */
  "ai-replace": {
    dur: 1.7,
    auto: false,
    parts: [
      A(rect(3, 13, 5.5, 7.5, 2.2), [pulse(0.2)]),
      A(rect(15.5, 13, 5.5, 7.5, 2.2), [pulse(0.4)]),
      line(12, 9, 12, 21),
      badge(0.6),
    ],
  },

  /* scan: four corner brackets around a bot face; the reader dot pulses */
  "ai-scan": {
    dur: 1.7,
    auto: false,
    parts: [
      path("M3.5 8V6.5a3 3 0 0 1 3-3H8M16 3.5h1.5a3 3 0 0 1 3 3V8M20.5 16v1.5a3 3 0 0 1-3 3H16M8 20.5H6.5a3 3 0 0 1-3-3V16"),
      A(rect(7, 9.6, 10, 7.4, 2.4), [an("opacity", ["1", "1", "0.45", "1", "1"], [0, 0.3, 0.46, 0.62, 1])]),
      circle(10.4, 13.3, 1, fill()),
      circle(13.6, 13.3, 1, fill()),
      line(12, 9.6, 12, 7.4),
      A(circle(12, 6.4, 1.2, fill()), [an("r", ["1.2", "1.2", "1.5", "1.2", "1.2"], [0, 0.3, 0.46, 0.62, 1])]),
    ],
  },

  /* scan-text: three brackets and the badge; the scanline drops a line */
  "ai-scan-text": {
    dur: 1.7,
    auto: false,
    parts: [
      path("M3.5 8V6.5a3 3 0 0 1 3-3H8M20.5 16v1.5a3 3 0 0 1-3 3H16M8 20.5H6.5a3 3 0 0 1-3-3V16"),
      A(line(7.6, 10, 12.4, 10), [pulse(0.2)]),
      A(line(7.6, 14, 16.4, 14), [pulse(0.44)]),
      badge(0.6),
    ],
  },

  /* scheduling: a calendar whose chosen day is stamped with the sparkle */
  "ai-scheduling": {
    dur: 1.65,
    auto: false,
    parts: [
      rect(3, 4.5, 18, 16.5, 3),
      line(3, 9.2, 21, 9.2),
      path("M8 2.8v3M16 2.8v3"),
      G("stamp", [star(12, 15.1, 2.6)]),
    ],
    sAnims: { stamp: { pivot: [12, 15.1], anim: tn("scale", ["1", "1", "1.2", "1", "1"], [0, 0.35, 0.52, 0.72, 1]) } },
  },

  /* search: the lens drops and finds — the inner sparkle pings on the hit */
  "ai-search": {
    dur: 1.65,
    auto: false,
    parts: [
      G("lens", [circle(10.6, 10.6, 7), line(15.8, 15.8, 20.5, 20.5)]),
      G("core", [star(10.6, 10.6, 3.5)]),
    ],
    gAnims: { lens: tn("translate", ["0 0", "0.7 0.7", "0.7 0.7", "0 0"], [0, 0.26, 0.55, 1]) },
    sAnims: { core: { pivot: [10.6, 10.6], anim: tn("scale", ["1", "1", "1.16", "1", "1"], [0, 0.4, 0.56, 0.75, 1]) } },
  },

  /* search-lines: a page of found lines lighting in turn */
  "ai-search-lines": {
    dur: 1.7,
    auto: false,
    parts: [
      path(openRect(4, 4, 15.5, 16.5, 3)),
      A(line(7.6, 12.4, 13, 12.4), [pulse(0.25)]),
      A(line(7.6, 16.4, 15.8, 16.4), [pulse(0.45)]),
      badge(0.3),
    ],
  },

  /* search01: the ring opens where the badge marks the hit, and keeps scanning */
  "ai-search01": {
    dur: 1.7,
    auto: false,
    parts: [
      A(path(ringOpen(10.4, 11, 7)), [tn("rotate", ["0 10.4 11", "8 10.4 11", "0 10.4 11"], [0, 0.35, 1])]),
      line(15.6, 16.2, 20.4, 21),
      badge(0.5),
    ],
  },

  /* search02: a whole lens hunting below the badge — a sweep and hold */
  "ai-search02": {
    dur: 1.65,
    auto: false,
    parts: [
      G("lens", [circle(9, 13.4, 5.6), line(12.96, 17.36, 17, 21.4)]),
      badge(0.5),
    ],
    gAnims: { lens: tn("translate", ["0 0", "-0.8 0.5", "0.5 -0.3", "0 0"], [0, 0.3, 0.62, 1]) },
  },

  /* security01: a guarded chip pinging inside the shield */
  "ai-security01": {
    dur: 1.65,
    auto: false,
    parts: [
      path(SHIELD),
      G("chip", chip(12, 11.8, 4.4, 1.5)),
    ],
    sAnims: { chip: { pivot: [12, 11.8], anim: tn("scale", ["1", "1.12", "1", "1"], [0, 0.24, 0.5, 1]) } },
  },

  /* security02: "AI" lettered on the shield, which braces once */
  "ai-security02": {
    dur: 1.65,
    auto: false,
    parts: [
      G("shield", [path(SHIELD), ...aiType(11.9, 11.8)]),
    ],
    sAnims: { shield: { pivot: [12, 12], anim: tn("scale", ["1", "1.04", "1", "1"], [0, 0.25, 0.5, 1]) } },
  },

  /* security03: the ward sparkle flares inside the shield */
  "ai-security03": {
    dur: 1.7,
    auto: false,
    parts: [
      path(SHIELD),
      G("star", [star(12, 11.8, 3.9)]),
    ],
    sAnims: { star: { pivot: [12, 11.8], anim: tn("scale", ["1", "1.18", "1", "1"], [0, 0.25, 0.5, 1]) } },
  },

  /* setting: the bloom gear turns a notch around a sparkle hub */
  "ai-setting": {
    dur: 1.9,
    auto: false,
    pp: false,
    parts: [
      G("gear", [path(flower(12, 12, 8, 7.4, 0.9)), star(12, 12, 3.2)]),
    ],
    gAnims: { gear: tn("rotate", ["0 12 12", "45 12 12"]) },
  },

  /* sheets: a grid filling in, the badge in its open corner */
  "ai-sheets": {
    dur: 1.7,
    auto: false,
    parts: [
      path(openRect(3, 4, 18, 16.5, 3)),
      A(line(3, 9.6, gapX(9.6), 9.6), [pulse(0.2)]),
      A(line(9, 9.6, 9, 20.5), [pulse(0.4)]),
      line(3, 15, 21, 15),
      badge(0.6),
    ],
  },

  /* sketch: a loose scribble drawing itself under the badge */
  "ai-sketch": {
    dur: 1.85,
    auto: false,
    parts: [
      A(path("M3.8 18.8c2.8-4.4 6.2-7.4 8.4-6.8 1.6.4.8 2.6-1.4 4.4-1.6 1.3-1.6 2.6.2 2.4 2.6-.4 5-3.6 8.6-3.8", { pathLength: 1, "stroke-dasharray": 1 }), [an("stroke-dashoffset", ["1", "1", "0", "0"], [0, 0.05, 0.6, 1])]),
      badge(0.6),
    ],
  },

  /* smartwatch: straps and face, the sparkle on the dial */
  "ai-smartwatch": {
    dur: 1.8,
    auto: false,
    parts: [
      rect(5.5, 6, 13, 12, 3.4),
      path("M8.6 6l.4-2c.1-.6.6-1 1.2-1h3.6c.6 0 1.1.4 1.2 1l.4 2M8.6 18l.4 2c.1.6.6 1 1.2 1h3.6c.6 0 1.1-.4 1.2-1l.4-2"),
      A(star(12, 12, 2.8), twinkle(12, 12, 0.4)),
    ],
  },

  /* sparkles: a drawn hero star with two filled companions, flicking in turn */
  "ai-sparkles": {
    dur: 1.7,
    auto: false,
    parts: [
      A(path(sparkD(9.4, 13.4, 6.4, 0.2)), twinkle(9.4, 13.4, 0.2)),
      badge(0.45),
      A(star(18.2, 18, 2.3), twinkle(18.2, 18, 0.62)),
    ],
  },

  /* speech: voice bars rising and falling under the badge */
  "ai-speech": {
    dur: 1.6,
    auto: false,
    parts: [
      A(path("M3.8 10.8v4M7.6 7.3v11M11.4 9.4v6.8M15.2 12v3.6M19 13.2v1.4"), [an("opacity", ["1", "1", "0.4", "1", "0.55", "1", "1"], [0, 0.16, 0.3, 0.46, 0.58, 0.74, 1])]),
      badge(0.55),
    ],
  },

  /* swap: two tiles trade places along the bent arrow */
  "ai-swap": {
    dur: 1.7,
    auto: false,
    parts: [
      A(rect(3.5, 3.5, 6, 6, 2), [tn("translate", ["0 0", "1.4 1.4", "1.4 1.4", "0 0"], [0, 0.28, 0.55, 1])]),
      A(rect(14.5, 14.5, 6, 6, 2), [tn("translate", ["0 0", "-1.4 -1.4", "-1.4 -1.4", "0 0"], [0, 0.28, 0.55, 1])]),
      path("M6.5 12.6V15a2.5 2.5 0 0 0 2.5 2.5h2M9.4 15.9l1.6 1.6-1.6 1.6"),
      badge(0.5),
    ],
  },

  /* template: a cursor picks a layout from the frame */
  "ai-template": {
    dur: 1.65,
    auto: false,
    parts: [
      path(PANEL),
      A(path("M8 10.2c-.2-.5.3-1 .8-.8l6.6 2.7c.5.2.5.9 0 1.1l-2.5.9c-.3.1-.6.4-.7.7l-.9 2.5c-.2.5-.9.5-1.1 0L8 10.2z"), [tn("translate", ["0 0", "-0.8 -0.8", "-0.8 -0.8", "0 0"], [0, 0.26, 0.52, 1])]),
      badge(0.5),
    ],
  },
};

// Composed on-grid around the badge slot — no optical nudge (see gen.mjs).
for (const d of Object.values(icons)) d.nofit = true;
