# Lumio icon authoring contract

Every glyph must read as the same family as the core 51 in `gen.mjs`.
Study `static/home.svg`, `static/settings.svg`, `static/camera.svg`,
`static/wallet.svg`, `static/bell.svg` before writing — those are canon.

## Grid & stroke (non-negotiable)

- 24×24 viewBox, origin 0,0 top-left. Y grows down.
- Live area: **20px of 24** (2px padding): geometry inside x/y ∈ [2, 22],
  ink (with the stroke) never past 1px from the edge. Never clip.
- Stroke 2, round caps, round joins — the renderer sets this; you only
  write geometry.
- Optical mass, not bounding-box sameness (geometry, centre of stroke):
  circles ~20 across, square-ish bodies ~18.5, wide rects up to ~20×16.
  You can author a little smaller — `measure-fit.cjs` grows every glyph
  (never shrinks) to those targets, measured as ink (round 21.6, square
  20.4, capped at ×1.25), and writes `[dx, dy, k, cx, cy]` into
  fit.json. gen.mjs applies it as one root transform and divides the
  stroke by k, so the drawn weight stays exactly 2. Re-run it after any
  geometry change: `node gen.mjs --nofit 1 --out /tmp/nf && node
  measure-fit.cjs /tmp/nf/static`.
- **No fills.** Line icons are outline only. Fills are allowed solely as
  a *state* — the liked heart, the starred star — marked by a hidden
  state layer (`opacity: 0` animated in), `state: true` on the part, or
  `keepFill: true` on the def when the fill *is* the concept (contrast,
  star-half, the brand mark). gen.mjs enforces it: any other `fill()`
  is emitted as outline — a dot (r ≤ 2) becomes a round stroke dot one
  stroke wide, a bigger disc becomes a ring, any other shape keeps its
  outline. Don't author fills expecting them to survive.
- **Minimum detail: 4px at 24px.** A hole, gap, bar or mark smaller than
  that blots at 16px — drop it or merge it into a neighbour. An outlined
  bar needs ≥ 4.2 of width (a 2px hole); narrower bars are single
  round-capped strokes. No dot inside a ring (the "target" lens): one
  outlined lens is the idea.

## The Lumio soft language

- Silhouettes are **soft blobs**: prefer a single continuous `path` with
  `c` curves over many primitives and sharp corners. The house is one
  path; the bell is a dome; the gear is a scalloped bloom.
- Corners want big radii: `rect` rx ≈ 2.2–2.7; arcs r ≈ 2.4–3.6.
- One **playful detail** per glyph, max: an arched door, a glint dot, a
  crease, a slot, a droplet. It should feel found, not decorated.
- Arrows/chevrons keep pointed 45° energy — the one allowed sharpness.
- No doubled edges (don't stack two outlines on the same silhouette).
- No compound booleans that leave artifacts; every junction rounds.

## Accents and badges (one convention for the whole family)

A modifier (sparkle, plus, check, gear…) is part of the drawing, not a
sticker on top of it. Every sibling uses the same size, the same corner
and the same treatment, and the host shape always makes room.

- **Air.** No two strokes come closer than 1.5px of air (≥ 3.5px between
  stroke centrelines at stroke 2); 2px is the target wherever it fits. A host outline that would run into a
  badge is *opened* — the path ends with a round cap before the badge —
  never drawn underneath it.
- **AI sparkle badge** — top-right, always. An **outlined** four-point
  star with soft cubic arms, `star(17.6, 6.4, 3.4)` from the kit (waist
  0.36 of the radius), plain stroke, no fill — it reads as a star at 16px
  instead of a blot, and follows the thin/bold weights. Visual size ≈ 9px.
  Host strokes keep ≥ 1.2px of real air to the star's outline (the kit's
  `CLR` 6.2 from its centre is the quick rule for opened edges).
- **Inner sparkle** — when the sparkle sits *inside* a container (chip,
  shield, bubble, screen, lens): the same outlined star, `r` 2.2–3.4,
  sized so it keeps ≥ 1.5px air to the container (r ≈ container
  half-size − 3.5), centred on the container's optical centre.
- **Hero sparkle** — when the sparkle *is* the subject (`sparkles`,
  `ai-sparkles`, `ai-magic`): a large outlined star, r ≥ 6, with any
  companions using the badge or a smaller outlined star. Never more than
  three stars.
- **Secondary sparkles** are optional and at most one: the same outlined
  star at r 2.4 (smaller blots), placed in open space.
- **"AI" lettering** — only where the letters are the idea, and never
  smaller than 6.5px cap height. A is a soft chevron with a crossbar, I is
  a single stem, 2px of air between them. If the container can't fit
  that, use the inner sparkle instead.
- **Status badges** (plus, minus, check, x, slash-off, clock, gear, lock
  modifiers) sit bottom-right in a ~7px box centred near (18, 18), drawn
  at the normal stroke; the host is cut back so its strokes clear the
  badge by 2px. Small gears are a simple ring with 6 short spokes — never
  a scalloped bloom under 10px, it blobs.
- Repeated dots/beads (abacus, nodes, scatter points) are round stroke
  dots (one stroke wide) or open rings r ≥ 1.8 — nothing in between,
  which renders as a smudge.
- **Shared kit.** The ai-* family (`batches/software-01/02.mjs`) draws
  every badge, inner star, opened host, chip, bulb and brain from
  `batches/_ai-kit.mjs` (`badge()`, `star()`, `openRect()`, `ringOpen()`,
  `gapX()/gapY()`, `chip()`, `bulb()`, `BRAIN`). Reuse it instead of
  re-deriving coordinates. Those glyphs set `nofit: true`, so gen.mjs's
  optical nudge (fit.json) never moves the badge slot between siblings.

## Writing paths

- Numbers to 1 decimal. Coordinates are eyed — nudge until the shape
  *looks* right at 24px, not until it's mathematically clean.
- `c` cubic curves: control points should make tension feel hand-tuned —
  a lobe that eases out reads better than a circular arc.
- Draw every path from scratch: softer, plumper, fewer nodes.

## Element API (identical helpers as gen.mjs)

    path("M...Z", {extraAttrs?})           // d string
    circle(cx, cy, r, {extraAttrs?})       // stroked
    line(x1, y1, x2, y2, {extraAttrs?})
    rect(x, y, w, h, rx, {extraAttrs?})
    ellipse(cx, cy, rx, ry, {extraAttrs?})
    fill()                                 // legacy: emitted as outline (see No fills)
    A(part, [anims])                       // bespoke-animated part
    G(id, [children], {attrs?})            // group for group transforms
    an(attr, [values], [keyTimes])         // attr anim over the cycle
    tn("rotate"|"translate"|"scale", [values], [keyTimes], {additive?})

Batch entry shape:

```js
export const icons = {
  "icon-name": {
    dur: 1.4,               // seconds per loop; default 1.4
    parts: [ ... ],         // the helpers above — plain objects, serializable
    auto: true,             // default: every stroked part draws on staggered,
                            // dots pop in late. Omit bespoke anims.
  },
};
```

To write a bespoke gesture instead, set `auto: false` and use `A()`/`G()`
with `an()`/`tn()` exactly like the core table — keep the verb minimal
(one gesture per icon) and the pose identical at t=0 and t=1.

## Self-check (run before finishing)

    cd packages/ui/src/animated-icons/svg
    node gen.mjs --out /tmp/iconcheck && node validate.mjs /tmp/iconcheck/static

Validator must report 0 errors; then eyeball your batch in the browser
(contact sheet) at ≥150px render size — geometry that reads mushy or
lopsided at that size gets redrawn, not shipped.
