# Animated Icons — the Lumio glyph set

A hand-tuned, spring-driven icon library for LumioUI. Stroke-drawn geometry on
a 24px grid, motion on the UI thread via Reanimated + react-native-svg —
native, web, and Expo Go alike.

The rules below are the craft bar every glyph is held to.

## Universal assets — no React Native required

`svg/` is the framework-agnostic distribution: 3,072 plain SVG
icons on the same 24px grid (catalog in `svg/catalog.json`, per-category batches in
`svg/batches/`, authoring contract in `svg/STYLE.md`, bounds checker `svg/validate.mjs`):
files that work anywhere — `<img>`, inline markup, design tools, any
framework.

```
svg/static/<name>.svg    rest pose, stroke="currentColor"
svg/animated/<name>.svg  same geometry + SMIL motion — animates with zero JS,
                         loops on the icon's own duration
svg/sprite.svg           <symbol> sprite of all static glyphs
svg/index.html           contact sheet

Weight variants (same contents, different stroke-width):
svg/thin/    stroke 1.5
svg/         stroke 2   (regular — the default set)
svg/bold/    stroke 2.5
```

### Customizing

| Knob | Inline SVG / sprite `<use>` | `<img>` |
|---|---|---|
| Color | `color` CSS on the parent — `currentColor` inherits | set the `color` attribute on the `<svg>` root in the file |
| Size | `width`/`height` attrs or CSS | `width`/`height` on the `<img>` |
| Stroke weight | `stroke-width` attr, or regenerate (`--sw`) | regenerate (`--sw`) |
| Speed | edit `dur`, or regenerate (`--speed`) | regenerate (`--speed`) |

```html
<!-- sprite: recolors via plain CSS -->
<svg width="24" height="24"><use href="sprite.svg#i-bell"/></svg>
<img src="animated/bell.svg" width="32" height="32"/><!-- self-animated -->
```

Regenerate any weight with different defaults:
`node svg/gen.mjs --sw 2.5 --size 32 --speed 0.8 --color "#5E68E0" --out dist`
(the table in that file mirrors the glyphs here one-for-one — keep them in sync).

## Geometry — what makes a glyph feel drawn, not traced

| Rule | Value |
|---|---|
| Grid | 24×24 viewBox, 20px live area (2px padding) |
| Stroke | 2px default — chunky enough to stay present at 16px |
| Terminals | `round` linecap everywhere — friendly, touch-native |
| Joins | `round`, except deliberate pointed apexes (below) |
| Fill | `none` — bare glyphs only. Fills appear only as a *state* (liked heart, starred star) |
| Optical mass | circles run ~20px, squares ~18.5px, wide rects 20×16 — equal visual weight, not equal bounds |

**The Lumio softness.** The brand mark is a solid lime squircle with a
zigzag drawn through it — friendly mass plus drawn energy. The icon set
follows that split: silhouettes are soft single-path *blobs* (the house is
one continuous shape, the bell is a dome, the gear is a scalloped bloom),
and the drawn energy shows up as one playful detail per glyph — an arched
door, a lens glint, a wristlet on the send plane, a flower instead of
teeth. Where a line wants a corner it gets a curve; weight comes from
stroke and optical size, not angularity.

**Hand-tuned tells.** Keyline shapes center on optical mass, not bounding
boxes; fills are reserved for *states* (liked heart, recording blip) —
no filled micro-details, no detail under 4px; small details are spaced by
eye — a 2px stroke wants 1.5–2px of air between strokes.

## Motion — what makes it feel physical

The quality bar:

1. **Name the verb.** Every animation communicates the icon's action — the
   bell *rings*, the gear *turns*, the arrow *travels*, the trash *opens*.
   An animation you can't name in one word is slop and gets cut. (This is
   also why a bare stroke-draw is never the whole gesture on an interactive
   glyph — on its own it reads as generic; ours pair a draw with a tilt,
   a pop, or a settle.)
2. **Preserve primitives.** Morphs interpolate the *same* element's
   endpoints — `Line` x1/y1/x2/y2, `Circle` cx/cy/r, `Rect` x/y/w/h,
   `G` rotation about a pivot. Never crossfade two icons. This is what makes
   our play→pause and menu→x real morphs instead of dissolves.
3. **Finite gestures return to rest.** Loops are reserved for genuinely
   ongoing states — the pulse dot, a recording blip, a sync. `animate="loop"`
   repeats only glyphs marked `live`; any other glyph plays once.
3a. **Lit strokes.** While a glyph moves, a short bead of its own ink runs
   across the strokes with `t` over a base dimmed to 0.85 — once, then rest.
   Durations sit on the tempo scale (nav move/settle, objects glow/drift,
   media up to roll).
4. **Springs, not tweens.** Interactive moves use the core spring tokens
   (`spring.pop` for landings/ticks, `spring.bouncy` for playful overshoot,
   `spring.press` for quick feedback). Ambient loops use `timing` tokens +
   `ease` curves. No one-off configs.
5. **Reduced motion is a pose, not a skip.** With reduce-motion on, glyphs
   render their settled rest state instantly; loops render their rest frame.

## API

```tsx
import { AnimatedIcon } from "@lumioui/ui";

<AnimatedIcon name="bell" size="md" color="primary" />          // still
<AnimatedIcon name="bell" animate="press" />                   // rings on tap
<AnimatedIcon name="mic" animate="loop" />                     // live: only while recording
<AnimatedIcon name="lumio-mark" animate="mount" />             // self-draw on mount
<AnimatedIcon name="play-pause" active={playing} />            // controlled morph
<AnimatedIcon name="heart" active={liked} color="#EC5C9E" />   // like pop + fill
```

| Prop | Type | Default |
|---|---|---|
| `name` | `AnimatedIconName` — 51 hand-tuned RN glyphs (svg/ ships the full 3,072-icon set) | required |
| `size` | `"sm"16 "md"22 "lg"28 "xl"34` or px number | `"md"` |
| `color` | theme token or hex — stroke ink | `foreground` |
| `strokeWidth` | number | `2` |
| `animate` | `"still" \| "mount" \| "press" \| "hover" \| "loop"` | `"still"` |
| `active` | boolean — controlled morph state (toggle glyphs) | `false` |
| `trigger` | number — replays the gesture on change | — |
| `speed` | number — tempo multiplier (<1 faster, >1 slower) | `1` |

`press`/`hover` wrap the glyph in a hit-slop'd pressable (web: real hover;
native: press-in). `active` drives toggle glyphs (play↔pause, menu↔x,
lock↔open, heart/star fill) with the `spring.pop` settle; `trigger` replays
one-shot gestures imperatively (e.g. bump it from a parent's onPress).
Icons are decorative for screen readers unless `accessibilityLabel` is set —
same contract as `Icon`.

## The set

**Wayfinding** — home, search, plus, x, check, check-circle, arrow-left,
arrow-right, arrow-up, chevron-left, chevron-right, chevron-up, chevron-down,
grid, filter, refresh

**Objects** — bell, heart, star, user, settings, message, mail, trash,
calendar, clock, lock, edit, download, share, globe, map-pin, wallet, chart,
zap, bookmark, phone

**Media & weather** — send, mic, camera, video, music, image, play, sun, moon

**Signature** — `lumio-mark` (the lime squircle's zigzag draws itself),
`pulse-dot` (breathing presence), `waveform` (EQ beat), `play-pause` + `menu`
(endpoint morphs — same primitives, no crossfade). `play-pause`, `menu`,
`heart`, `star` and `lock` are the toggle glyphs driven by `active`.
