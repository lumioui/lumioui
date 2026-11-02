/* ai-* family, part 1 (art → idea). Every glyph follows STYLE.md
 * "Accents and badges": the sparkle badge sits top-right at one size and
 * the host opens around it; inner sparkles are the same filled star. */
import {
  path, circle, line, rect, fill, A, G, an, tn, P,
  star, twinkle, badge, mini, BX, BY, BR, gapX, gapY, openRect, ringOpen, cutPoints,
  chip, BRAIN, brainHalf, bulb,
} from "./_ai-kit.mjs";

/** Arc of circle (cx, cy, r) from angle a0 to a1 (degrees, clockwise,
 *  y-down) with an arrowhead on the a1 end. */
function arcArrow(cx, cy, r, a0, a1, head = 2.4) {
  const rad = (a) => (a * Math.PI) / 180;
  const pt = (a) => [P(cx + r * Math.cos(rad(a))), P(cy + r * Math.sin(rad(a)))];
  const [x0, y0] = pt(a0), [x1, y1] = pt(a1);
  const large = a1 - a0 > 180 ? 1 : 0;
  // tangent at a1 (direction of travel), head wings swept back ±42°
  const t = rad(a1) + Math.PI / 2;
  const w = (s) => [P(x1 - head * Math.cos(t + s)), P(y1 - head * Math.sin(t + s))];
  const [l1, l2] = [w(rad(42)), w(rad(-42))];
  return `M${x0} ${y0}A${r} ${r} 0 ${large} 1 ${x1} ${y1}M${l1[0]} ${l1[1]}L${x1} ${y1}L${l2[0]} ${l2[1]}`;
}

/** Host square shared by the panel glyphs, opened for the badge. */
const PANEL = openRect(3.5, 4, 17, 16.5, 3.5);
/** Page with the corner folded (ai-file*, content generators): x 5–19. */
const PAGE = `M19 ${gapY(19)}v${P(17.5 - gapY(19))}a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-11a3 3 0 0 1 3-3h${P(gapX(3.5) - 8)}`;

export const icons = {
  /* art: a paint palette — thumb hole, three dabs — with the badge in the
   * bite of the palette's open edge. The palette tilts, the star flicks. */
  "ai-art": {
    dur: 1.6,
    auto: false,
    parts: [
      G("palette", [
        path(ringOpen(11, 12.8, 8, 7.2)),
        circle(13.5, 14.6, 1.5),
        circle(7.05, 14.25, 1.25, fill()),
        circle(7.55, 10.4, 1.25, fill()),
        circle(11, 8.6, 1.25, fill()),
      ]),
      badge(0.35),
    ],
    gAnims: { palette: tn("rotate", ["0 11 12.8", "-7 11 12.8", "3 11 12.8", "0 11 12.8"], [0, 0.3, 0.6, 1]) },
  },

  /* audio panel: three level bars pump like a visualizer */
  "ai-audio": {
    dur: 1.55,
    auto: false,
    parts: [
      path(PANEL),
      A(line(8, 14.2, 8, 10.6), [an("y2", ["10.6", "10.6", "12.2", "10.6", "10.6"], [0, 0.1, 0.3, 0.5, 1])]),
      A(line(12, 16.5, 12, 8.2), [an("y2", ["8.2", "8.2", "11", "8.2", "8.2"], [0, 0.28, 0.48, 0.68, 1])]),
      A(line(16, 14.2, 16, 12.2), [an("y2", ["12.2", "12.2", "13.2", "12.2", "12.2"], [0, 0.46, 0.66, 0.86, 1])]),
      badge(0.5),
    ],
  },

  /* auto-rotate: two arrowed arcs chase each other between screen corners */
  "ai-auto-rotate": {
    auto: false,
    dur: 1.6,
    pp: false,
    parts: [
      path("M3.5 8.2V6.5a3 3 0 0 1 3-3h1.7"),
      path("M20.5 15.8v1.7a3 3 0 0 1-3 3h-1.7"),
      G("spin", [
        path(arcArrow(10.6, 13.4, 5.2, 175, 285, 2)),
        path(arcArrow(10.6, 13.4, 5.2, 355, 465, 2)),
      ]),
      badge(0.4),
    ],
    gAnims: { spin: tn("rotate", ["0 10.6 13.4", "180 10.6 13.4"]) },
  },

  /* background: hatched canvas, stripes sweep bottom-left to top-right */
  "ai-background": {
    dur: 1.7,
    auto: false,
    parts: [
      path(PANEL),
      A(line(7.5, 8, 16, 16.5), [an("opacity", ["1", "1", "0.3", "1", "1"], [0, 0.32, 0.45, 0.59, 1])]),
      A(line(7.5, 13.6, 10.4, 16.5), [an("opacity", ["1", "1", "0.3", "1", "1"], [0, 0.15, 0.28, 0.42, 1])]),
      badge(0.6),
    ],
  },

  /* background eraser: marching-ants frame around a lifted-out person */
  "ai-background-eraser": {
    dur: 1.7,
    auto: false,
    parts: [
      A(path(PANEL, { "stroke-dasharray": "2.4 2.6" }), [an("stroke-dashoffset", ["0", "0", "5", "5"], [0, 0.1, 0.7, 1])]),
      circle(10.8, 10.4, 2.2),
      path("M6.8 16.8c.8-2.2 2.3-3.4 4-3.4s3.2 1.2 4 3.4"),
      badge(0.5),
    ],
  },

  /* beautify: a wand pointing at the badge, a small star trailing it */
  "ai-beautify": {
    dur: 1.7,
    auto: false,
    parts: [
      G("wand", [
        rect(7.5, 8.2, 4, 13, 2, { transform: "rotate(45 9.5 14.7)" }),
        line(10.3, 10.3, 13.1, 13.1),
      ]),
      badge(0.3),
      mini(7.6, 5.4, 0.5),
    ],
    gAnims: { wand: tn("rotate", ["0 6 18.2", "-6 6 18.2", "2 6 18.2", "0 6 18.2"], [0, 0.25, 0.55, 1]) },
  },

  /* book: soft cover over a curled page block, the inner sparkle printed
   * on the cover glows */
  "ai-book": {
    dur: 1.65,
    auto: false,
    parts: [
      path("M5 18V6.5a3 3 0 0 1 3-3h10a1 1 0 0 1 1 1V15.5"),
      path("M19 15.5H7.5a2.5 2.5 0 0 0 0 5H19z"),
      G("mark", [star(12, 9.5, 2.6)]),
    ],
    sAnims: { mark: { pivot: [12, 9.5], anim: tn("scale", ["1", "1", "1.18", "1", "1"], [0, 0.3, 0.46, 0.64, 1]) } },
  },

  /* brain01: whole brain, central fissure, one fold a side that flickers */
  "ai-brain01": {
    dur: 1.7,
    auto: false,
    parts: [
      path(BRAIN),
      line(12, 6.3, 12, 18.4),
      A(path("M4 12c1.4.7 3 .6 4.4-.4"), [an("opacity", ["1", "1", "0.25", "1", "1"], [0, 0.15, 0.3, 0.45, 1])]),
      A(path("M20 12c-1.4.7-3 .6-4.4-.4"), [an("opacity", ["1", "1", "0.25", "1", "1"], [0, 0.45, 0.6, 0.75, 1])]),
    ],
  },

  /* brain02: one brain, one spark — the inner sparkle flicks */
  "ai-brain02": {
    dur: 1.6,
    auto: false,
    parts: [
      path(BRAIN),
      A(star(12, 12.6, 3.2), [tn("rotate", ["0 12 12.6", "24 12 12.6", "-14 12 12.6", "0 12 12.6"], [0, 0.35, 0.68, 1])]),
    ],
  },

  /* brain03: a neural fork lighting node by node */
  "ai-brain03": {
    dur: 1.65,
    auto: false,
    parts: [
      path(BRAIN),
      path("M12 18.4v-5.2M12 13.2l-3-2.9M12 13.2l3-2.9"),
      A(circle(8.4, 9.7, 1.3, fill()), [an("opacity", ["1", "1", "0.25", "1", "1"], [0, 0.2, 0.35, 0.5, 1])]),
      A(circle(15.6, 9.7, 1.3, fill()), [an("opacity", ["1", "1", "0.25", "1", "1"], [0, 0.45, 0.6, 0.75, 1])]),
    ],
  },

  /* brain04: left hemisphere wiring out to three nodes */
  "ai-brain04": {
    dur: 1.65,
    auto: false,
    parts: [
      path(`${brainHalf(-1, 11.6)}Z`),
      path("M13.4 7.6h3.2M13.4 12.4h3.2M13.4 17.2h3.2"),
      A(circle(18.4, 7.6, 1.5, fill()), [an("opacity", ["1", "1", "0.25", "1", "1"], [0, 0.15, 0.3, 0.45, 1])]),
      A(circle(18.4, 12.4, 1.5, fill()), [an("opacity", ["1", "1", "0.25", "1", "1"], [0, 0.35, 0.5, 0.65, 1])]),
      A(circle(18.4, 17.2, 1.5, fill()), [an("opacity", ["1", "1", "0.25", "1", "1"], [0, 0.55, 0.7, 0.85, 1])]),
    ],
  },

  /* brain05: left hemisphere wired to a chip that pings */
  "ai-brain05": {
    dur: 1.6,
    auto: false,
    parts: [
      path(`${brainHalf(-1, 12)}Z`),
      line(12, 12.4, 14, 12.4),
      G("chip", chip(17.8, 12.4, 4.6, 1.6)),
    ],
    sAnims: { chip: { pivot: [17.8, 12.4], anim: tn("scale", ["1", "1.12", "1", "1"], [0, 0.25, 0.5, 1]) } },
  },

  /* browser window opened for the badge; the tab dot blinks */
  "ai-browser": {
    dur: 1.65,
    auto: false,
    parts: [
      path(PANEL),
      A(line(3.5, 9, P(gapX(9)), 9), [an("opacity", ["1", "0.35", "1", "1"], [0, 0.2, 0.38, 1])]),
      badge(0.42),
    ],
  },

  /* camera: soft body with a viewfinder hump, opened at the badge corner */
  "ai-camera": {
    dur: 1.55,
    auto: false,
    parts: [
      path(`M${gapX(8.8)} 8.8c-.5 0-.9-.2-1.2-.6l-.6-.9c-.3-.4-.7-.6-1.2-.6h-2.4c-.5 0-.9.2-1.2.6l-.6.9c-.3.4-.7.6-1.2.6A2.6 2.6 0 0 0 2.9 11.4v6.5a2.6 2.6 0 0 0 2.6 2.6h13a2.6 2.6 0 0 0 2.6-2.6V${gapY(21.1)}`),
      A(circle(11.6, 14.6, 2.6), [an("r", ["2.6", "2.6", "2", "2.6", "2.6"], [0, 0.22, 0.36, 0.52, 1])]),
      badge(0.3),
    ],
  },

  /* chat01: bubble with a chip inside that pings — an answer landing */
  "ai-chat01": {
    dur: 1.6,
    auto: false,
    parts: [
      path("M6 4.5h12a3 3 0 0 1 3 3v6.6a3 3 0 0 1-3 3h-3.6l-2.9 2.6c-.6.5-1.5.1-1.5-.7v-1.9H6a3 3 0 0 1-3-3V7.5a3 3 0 0 1 3-3z"),
      G("chip", chip(12, 10.8, 4, 1)),
    ],
    sAnims: { chip: { pivot: [12, 10.8], anim: tn("scale", ["1", "1.13", "1", "1"], [0, 0.24, 0.5, 1]) } },
  },

  /* chat02: bubble with "AI" lettered inside, typed a beat at a time */
  "ai-chat02": {
    dur: 1.6,
    auto: false,
    parts: [
      path("M6 4.5h12a3 3 0 0 1 3 3v6.6a3 3 0 0 1-3 3h-3.6l-2.9 2.6c-.6.5-1.5.1-1.5-.7v-1.9H6a3 3 0 0 1-3-3V7.5a3 3 0 0 1 3-3z"),
      A(path("M7.6 14l2.1-5.6c.2-.5.9-.5 1.1 0l2.1 5.6M8.5 12h3"), [an("opacity", ["1", "1", "0.3", "1", "1"], [0, 0.28, 0.42, 0.58, 1])]),
      A(line(16.4, 7.9, 16.4, 14), [an("opacity", ["1", "1", "0.3", "1", "1"], [0, 0.42, 0.56, 0.72, 1])]),
    ],
  },

  /* chemistry01: test tube with a sloshing meniscus */
  "ai-chemistry01": {
    dur: 1.7,
    auto: false,
    parts: [
      path(`M8 3.6v12.2a3.6 3.6 0 0 0 7.2 0V${gapY(15.2)}`),
      line(6.2, 3.6, 11.4, 3.6),
      A(line(8.6, 12.4, 14.6, 12.4), [tn("rotate", ["0 11.6 12.4", "2.6 11.6 12.4", "-2 11.6 12.4", "0 11.6 12.4"], [0, 0.3, 0.65, 1])]),
      badge(0.45),
    ],
  },

  /* chemistry02: conical flask, meniscus sloshing */
  "ai-chemistry02": {
    dur: 1.7,
    auto: false,
    parts: [
      path("M9 3.6v5.8l-5 8.4c-.8 1.3.2 2.7 1.6 2.7h8.4c1.4 0 2.4-1.4 1.6-2.7l-3-5.1"),
      path("M7.2 3.6h3.8v3.4"),
      A(line(6.6, 15.6, 13, 15.6), [tn("rotate", ["0 9.8 15.6", "-2.6 9.8 15.6", "2 9.8 15.6", "0 9.8 15.6"], [0, 0.3, 0.65, 1])]),
      badge(0.45),
    ],
  },

  /* chemistry03: round flask on a neck, liquid chord sloshing */
  "ai-chemistry03": {
    dur: 1.7,
    auto: false,
    parts: [
      path("M7.8 9.4V3.6h3.4v5.8"),
      path("M7.8 9.4A6.4 6.4 0 1 0 15.5 13.3"),
      line(6.6, 3.6, 12.4, 3.6),
      A(line(4.4, 15.2, 14.8, 15.2), [tn("rotate", ["0 9.6 15.2", "2.4 9.6 15.2", "-2 9.6 15.2", "0 9.6 15.2"], [0, 0.3, 0.65, 1])]),
      badge(0.45),
    ],
  },

  /* chip: pinned die with the sparkle as its mark — the die waking */
  "ai-chip": {
    dur: 1.6,
    auto: false,
    parts: [
      rect(5.5, 5.5, 13, 13, 3),
      path("M9.5 3v2.5M14.5 3v2.5M9.5 18.5V21M14.5 18.5V21M3 9.5h2.5M3 14.5h2.5M18.5 9.5H21M18.5 14.5H21"),
      G("core", [star(12, 12, 3)]),
    ],
    sAnims: { core: { pivot: [12, 12], anim: tn("scale", ["1", "1.16", "1", "1"], [0, 0.25, 0.5, 1]) } },
  },

  /* clothes: a soft tee swaying on its hanger point, the inner sparkle
   * printed on its chest */
  "ai-clothes": {
    dur: 1.7,
    auto: false,
    parts: [
      G("tee", [
        path("M9.5 4c.4 1.3 1.3 2 2.5 2s2.1-.7 2.5-2l4.1 1.6c.5.2.9.6 1.1 1.1l1.3 2.9c.2.5 0 1-.5 1.2l-2.5.8v6.9a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-6.9l-2.5-.8c-.5-.2-.7-.7-.5-1.2l1.3-2.9c.2-.5.6-.9 1.1-1.1L9.5 4z"),
        star(12, 13.4, 3),
      ]),
    ],
    gAnims: { tee: tn("rotate", ["0 12 4", "4 12 4", "-3 12 4", "0 12 4"], [0, 0.3, 0.65, 1]) },
  },

  /* cloud puff carrying the inner sparkle, drifting */
  "ai-cloud": {
    dur: 1.8,
    auto: false,
    parts: [
      G("drift", [
        path("M7 19h10.5a3.9 3.9 0 0 0 .6-7.7A6.1 6.1 0 0 0 6.5 9.6 4.7 4.7 0 0 0 7 19z"),
        star(12, 13.4, 2.6),
      ]),
    ],
    gAnims: { drift: tn("translate", ["0 0", "1.1 -0.5", "-0.6 -0.9", "0 0"], [0, 0.35, 0.7, 1]) },
  },

  /* cloud01: puff with a chip hanging off its belly */
  "ai-cloud01": {
    dur: 1.65,
    auto: false,
    parts: [
      path("M7 15h10.5a3.6 3.6 0 0 0 .5-7.1A5.6 5.6 0 0 0 7.1 6.6 4.2 4.2 0 0 0 7 15z"),
      line(12, 15, 12, 16.2),
      G("chip", chip(12, 18.6, 4, 1.1)),
    ],
    sAnims: { chip: { pivot: [12, 18.6], anim: tn("scale", ["1", "1.12", "1", "1"], [0, 0.25, 0.5, 1]) } },
  },

  /* cloud02: puff raining down onto three nodes */
  "ai-cloud02": {
    dur: 1.7,
    auto: false,
    parts: [
      path("M7 14.6h10.5a3.6 3.6 0 0 0 .5-7.1A5.6 5.6 0 0 0 7.1 6.2 4.2 4.2 0 0 0 7 14.6z"),
      path("M8.4 14.6l-1.5 3.6M12 14.6v3.8M15.6 14.6l1.5 3.6"),
      A(circle(6.6, 19.8, 1.5, fill()), [an("opacity", ["0", "1", "1", "0"], [0, 0.25, 0.7, 0.9])]),
      A(circle(12, 19.8, 1.5, fill()), [an("opacity", ["0", "0", "1", "1", "0"], [0, 0.12, 0.37, 0.8, 0.95])]),
      A(circle(17.4, 19.8, 1.5, fill()), [an("opacity", ["0", "0", "1", "1", "0"], [0, 0.24, 0.49, 0.85, 1])]),
    ],
  },

  /* co-editing: two collaborators bob in offset under one sparkle */
  "ai-co-editing": {
    dur: 1.75,
    auto: false,
    parts: [
      G("p1", [circle(6.8, 11, 2), path("M3.2 20.5c.4-2.6 1.6-4.1 3.6-4.1s3.2 1.5 3.6 4.1")]),
      G("p2", [circle(17.2, 11, 2), path("M13.6 20.5c.4-2.6 1.6-4.1 3.6-4.1s3.2 1.5 3.6 4.1")]),
      A(star(12, 5.4, 3.0), twinkle(12, 5.4, 0.3)),
    ],
    gAnims: {
      p1: tn("translate", ["0 0", "0 -0.9", "0 -0.9", "0 0"], [0, 0.22, 0.5, 1]),
      p2: tn("translate", ["0 0", "0 0", "0 -0.9", "0 0"], [0, 0.38, 0.66, 1]),
    },
  },

  /* collage template: panel split into three panes */
  "ai-collage-template": {
    dur: 1.6,
    auto: false,
    parts: [
      path(PANEL),
      line(3.5, 13.4, 20.5, 13.4),
      line(10.6, 13.4, 10.6, 20.5),
      line(10.6, 4, 10.6, 13.4),
      badge(0.4),
    ],
  },

  /* computer: monitor on a stand, a chip on screen pings */
  "ai-computer": {
    dur: 1.6,
    auto: false,
    parts: [
      rect(3, 3.5, 18, 13, 3),
      line(12, 16.5, 12, 20.2),
      line(8.4, 20.5, 15.6, 20.5),
      G("chip", chip(12, 10, 4, 1.2)),
    ],
    sAnims: { chip: { pivot: [12, 10], anim: tn("scale", ["1", "1.13", "1", "1"], [0, 0.24, 0.5, 1]) } },
  },

  /* concert: mic capsule over the crowd swoosh; the mic bobs */
  "ai-concert": {
    dur: 1.6,
    auto: false,
    parts: [
      G("mic", [
        rect(7.8, 8.2, 5.2, 6.6, 2.6),
        line(10.4, 14.8, 10.4, 16.6),
      ]),
      path("M5.5 14.4c-1.6.8-2.5 1.8-2.5 2.9 0 1.9 4 3.3 9 3.3s9-1.4 9-3.3c0-1.1-.9-2.1-2.5-2.9"),
      badge(0.3),
    ],
    gAnims: { mic: tn("translate", ["0 0", "0 -1", "0 -1", "0 0"], [0, 0.26, 0.55, 1]) },
  },

  /* content generator 01: a page that types itself, line after line */
  "ai-content-generator01": {
    dur: 1.8,
    auto: false,
    parts: [
      path(PAGE),
      A(line(8.6, 8.4, 11.4, 8.4, { pathLength: 1, "stroke-dasharray": 1 }), [an("stroke-dashoffset", ["1", "1", "0", "0"], [0, 0.08, 0.3, 1])]),
      A(line(8.6, 12.2, 15.4, 12.2, { pathLength: 1, "stroke-dasharray": 1 }), [an("stroke-dashoffset", ["1", "1", "0", "0"], [0, 0.28, 0.5, 1])]),
      A(line(8.6, 16, 13, 16, { pathLength: 1, "stroke-dasharray": 1 }), [an("stroke-dashoffset", ["1", "1", "0", "0"], [0, 0.48, 0.68, 1])]),
      badge(0.66),
    ],
  },

  /* content generator 02: a page with a big T, its caret foot blinking */
  "ai-content-generator02": {
    dur: 1.6,
    auto: false,
    parts: [
      path(PAGE),
      line(8.5, 10, 12.5, 10),
      line(10.5, 10, 10.5, 16.2),
      A(line(9, 16.2, 12, 16.2), [an("opacity", ["1", "0.15", "1", "0.15", "1", "1"], [0, 0.18, 0.34, 0.5, 0.66, 1])]),
      badge(0.5),
    ],
  },

  /* crop: two L frames snapping inward — the frame tightening */
  "ai-crop": {
    dur: 1.6,
    auto: false,
    parts: [
      A(path("M6.5 6.5v9a2.5 2.5 0 0 0 2.5 2.5h9"), [tn("translate", ["0 0", "0.7 -0.7", "0.7 -0.7", "0 0"], [0, 0.26, 0.55, 1])]),
      A(path("M14.4 21v-8.3a2.5 2.5 0 0 0-2.5-2.5H3.4"), [tn("translate", ["0 0", "-0.7 0.7", "-0.7 0.7", "0 0"], [0, 0.26, 0.55, 1])]),
      badge(0.5),
    ],
  },

  /* dna: a helix with rungs that twists once, the badge beside it */
  "ai-dna": {
    dur: 1.8,
    auto: false,
    parts: [
      G("helix", [
        path("M3.5 3.5c0 4.5 8 4.5 8 9s-8 4.5-8 9"),
        path("M11.5 3.5c0 4.5-8 4.5-8 9s8 4.5 8 9"),
        line(5.4, 6.8, 9.6, 6.8),
        line(5.4, 18.2, 9.6, 18.2),
      ]),
      badge(0.35),
    ],
    gAnims: { helix: tn("rotate", ["0 7.5 12.5", "5 7.5 12.5", "-4 7.5 12.5", "0 7.5 12.5"], [0, 0.3, 0.65, 1]) },
  },

  /* drawing: a pencil laying down a swoosh that draws itself */
  "ai-drawing": {
    dur: 1.8,
    auto: false,
    parts: [
      path("M4.2 18.4l.5-3.4 5.6-5.6a1.8 1.8 0 0 1 2.6 2.6L7.3 17.6 4.2 18.4z"),
      line(4.8, 14.9, 7.7, 17.8),
      A(path("M9.6 20.2c1.8 0 3-1 4.8-1s2.8 1 4.6 1c.6 0 1-.1 1.5-.3", { pathLength: 1, "stroke-dasharray": 1 }), [an("stroke-dashoffset", ["1", "1", "0", "0"], [0, 0.06, 0.6, 1])]),
      badge(0.6),
    ],
  },

  /* editing: a pencil that nudges forward, the badge over its head */
  "ai-editing": {
    dur: 1.65,
    auto: false,
    parts: [
      G("pen", [
        path("M4 20l.71-3.54 6.37-6.36a2 2 0 0 1 2.82 2.82l-6.36 6.37L4 20z"),
        line(9.64, 11.54, 12.47, 14.36),
      ]),
      badge(0.45),
    ],
    gAnims: { pen: tn("translate", ["0 0", "-0.6 0.6", "-0.6 0.6", "0 0"], [0, 0.28, 0.55, 1]) },
  },

  /* elements: triangle + circle primitives lighting in turn */
  "ai-elements": {
    dur: 1.7,
    auto: false,
    parts: [
      A(path("M3.9 16.6l4.2-9.4c.5-1.1 1.9-1.1 2.4 0l1.6 3.6"), [an("opacity", ["1", "1", "0.35", "1", "1"], [0, 0.2, 0.34, 0.5, 1])]),
      A(path("M10.6 18.4H5.2c-1 0-1.7-1-1.3-1.8"), [an("opacity", ["1", "1", "0.35", "1", "1"], [0, 0.2, 0.34, 0.5, 1])]),
      A(circle(15.2, 16.4, 4), [an("opacity", ["1", "1", "0.35", "1", "1"], [0, 0.42, 0.56, 0.72, 1])]),
      badge(0.6),
    ],
  },

  /* eraser: a tilted block scrubbing over the ground line */
  "ai-eraser": {
    dur: 1.6,
    auto: false,
    parts: [
      G("scrub", [
        rect(6.9, 8.6, 7, 9.4, 2.2, { transform: "rotate(45 10.4 13.2)" }),
        line(7.08, 11.58, 12.02, 16.52),
      ]),
      line(12.4, 20.5, 20.5, 20.5),
      badge(0.55),
    ],
    gAnims: { scrub: tn("translate", ["0 0", "-1 0", "0.6 0", "0 0"], [0, 0.28, 0.55, 1]) },
  },

  /* expand: a frame around a square that breathes outward */
  "ai-expand": {
    auto: false,
    dur: 1.5,
    parts: [
      path(PANEL),
      G("pop", [rect(8, 9.5, 6.5, 6.5, 1.8)]),
      badge(0.5),
    ],
    sAnims: { pop: { pivot: [11.25, 12.75], anim: tn("scale", ["1", "1.16", "1"], [0, 0.5, 1]) } },
  },

  /* file: a page, opened for the badge where the dog-ear would be */
  "ai-file": {
    dur: 1.65,
    auto: false,
    parts: [
      A(path(PAGE), [an("opacity", ["1", "1", "0.45", "1", "1"], [0, 0.28, 0.42, 0.58, 1])]),
      badge(0.5),
    ],
  },

  /* file01: dog-eared page that leans; the badge rides its corner */
  "ai-file01": {
    dur: 1.65,
    auto: false,
    parts: [
      G("page", [
        path(PAGE),
        line(8.6, 13, 15.4, 13),
        line(8.6, 16.6, 12.6, 16.6),
      ]),
      badge(0.3),
    ],
    gAnims: { page: tn("rotate", ["0 12 20.5", "-3 12 20.5", "2 12 20.5", "0 12 20.5"], [0, 0.3, 0.62, 1]) },
  },

  /* folder01: a folder feeding three nodes below */
  "ai-folder01": {
    dur: 1.7,
    auto: false,
    parts: [
      path("M3.5 6.5a2.5 2.5 0 0 1 2.5-2.5h2.6c.6 0 1.2.3 1.6.8l.9 1.2c.4.5 1 .8 1.6.8H18a2.5 2.5 0 0 1 2.5 2.5v3.9a2.5 2.5 0 0 1-2.5 2.5H6a2.5 2.5 0 0 1-2.5-2.5V6.5z"),
      path("M8 13.7l-1.6 3.9M12 13.7v4M16 13.7l1.6 3.9"),
      A(circle(6.2, 19.4, 1.5, fill()), [an("opacity", ["0", "1", "1", "0"], [0, 0.25, 0.7, 0.9])]),
      A(circle(12, 19.4, 1.5, fill()), [an("opacity", ["0", "0", "1", "1", "0"], [0, 0.12, 0.37, 0.8, 0.95])]),
      A(circle(17.8, 19.4, 1.5, fill()), [an("opacity", ["0", "0", "1", "1", "0"], [0, 0.24, 0.49, 0.85, 1])]),
    ],
  },

  /* folder02: a folder with a chip inside that pings */
  "ai-folder02": {
    dur: 1.6,
    auto: false,
    parts: [
      path("M3 7a3 3 0 0 1 3-3h2.7c.7 0 1.3.3 1.8.9l.8 1c.5.6 1.1.9 1.8.9H18a3 3 0 0 1 3 3v7.4a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7z"),
      G("chip", chip(12, 13.2, 4.2, 1.4)),
    ],
    sAnims: { chip: { pivot: [12, 13.2], anim: tn("scale", ["1", "1.13", "1", "1"], [0, 0.24, 0.5, 1]) } },
  },

  /* game: gamepad wings, two buttons pressing in turn */
  "ai-game": {
    dur: 1.65,
    auto: false,
    parts: [
      path("M12.2 9H8c-2.3 0-3.6.9-4.2 3.4l-.9 4.1c-.4 1.9.8 3.5 2.5 3.5 1.1 0 1.9-.5 2.4-1.6l.5-1c.3-.6.8-.9 1.4-.9h4.6c.6 0 1.1.3 1.4.9l.5 1c.5 1.1 1.3 1.6 2.4 1.6 1.7 0 2.9-1.6 2.5-3.5l-.6-3"),
      A(circle(8.2, 13, 1.1, fill()), [an("r", ["1.1", "1.1", "0.7", "1.1", "1.1"], [0, 0.18, 0.3, 0.44, 1])]),
      A(circle(15.8, 13, 1.1, fill()), [an("r", ["1.1", "1.1", "0.7", "1.1", "1.1"], [0, 0.45, 0.57, 0.72, 1])]),
      badge(0.55),
    ],
  },

  /* generate: an open frame and the badge popping in to fill it */
  "ai-generate": {
    dur: 1.6,
    auto: false,
    parts: [
      path(PANEL),
      G("star", [star(BX, BY, BR)]),
    ],
    sAnims: { star: { pivot: [BX, BY], anim: tn("scale", ["1", "1.22", "1", "1"], [0, 0.22, 0.48, 1]) } },
  },

  /* generative: a closed frame, the inner sparkle flaring */
  "ai-generative": {
    dur: 1.7,
    auto: false,
    parts: [
      rect(3.5, 5, 17, 14, 3.5),
      G("core", [star(12, 12, 3.4)]),
    ],
    sAnims: { core: { pivot: [12, 12], anim: tn("scale", ["1", "1.18", "1", "1"], [0, 0.24, 0.5, 1]) } },
  },

  /* hd resolution: screen with chunky HD letters glinting in turn */
  "ai-hd-resolution": {
    dur: 1.65,
    auto: false,
    parts: [
      path(openRect(3, 5, 18, 14.5, 3.2)),
      A(path("M5.4 10.4v5.2M8.8 10.4v5.2M5.4 13h3.4"), [an("opacity", ["1", "1", "0.3", "1", "1"], [0, 0.22, 0.36, 0.52, 1])]),
      A(path("M12 10.4v5.2h1a2.6 2.6 0 0 0 0-5.2h-1z"), [an("opacity", ["1", "1", "0.3", "1", "1"], [0, 0.42, 0.56, 0.72, 1])]),
      badge(0.6),
    ],
  },

  /* idea: the bulb glows and the badge lands in its opened glass */
  "ai-idea": {
    dur: 1.7,
    auto: false,
    parts: [
      ...bulb(true).map((p, i) => (i < 2 ? A(p, [an("opacity", ["1", "1", "0.55", "1", "1"], [0, 0.3, 0.46, 0.64, 1])]) : p)),
      G("star", [star(BX, BY, BR)]),
    ],
    sAnims: { star: { pivot: [BX, BY], anim: tn("scale", ["1", "1", "1.3", "1", "1"], [0, 0.34, 0.52, 0.7, 1]) } },
  },
};

// Every ai-* glyph is composed on-grid around the badge slot — keep
// gen.mjs's optical nudge off so siblings' badges never drift apart.
for (const d of Object.values(icons)) d.nofit = true;
