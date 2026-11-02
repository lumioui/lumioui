/**
 * Motion contract for the animated icon set.
 *
 * Every glyph receives one shared value `t` and maps it onto its own
 * keyframes. Two glyph kinds:
 *
 *   gesture — t=0 AND t=1 are the rest pose; the glyph's gesture plays out
 *             over the sweep (a bell rings and settles, an arrow travels
 *             and returns). `rest: 0`.
 *   draw    — t=0 is erased, t=1 is drawn; rest pose sits at t=1 so a
 *             "still" render shows the finished glyph. `rest: 1`.
 *   toggle  — t IS the state (0→1 is a real morph: play→pause, menu→x,
 *             lock→open). `active` drives it with spring.pop.
 *
 * The wrapper in animated-icons.tsx owns t; glyphs only interpret it. It
 * also lights the stroke: while t moves, a short bright bead runs along the
 * glyph with t and the base ink dims to 0.85 — once per gesture, then rests.
 */
import type { SharedValue } from "react-native-reanimated";

export interface GlyphCtx {
  /** Gesture progress / morph state. See contract above. */
  t: SharedValue<number>;
  /** Resolved ink color (theme token already resolved). */
  color: string;
  /** Stroke width in px — default 1.9. */
  sw: number;
  /** Fill-aware glyphs paint their fill when true (heart, star). */
  filled?: boolean;
  /** The surface accent (`colors.primary`) — brand tiles follow it. */
  accent: string;
  /** Ink on the accent (`colors.primaryForeground`). */
  accentInk: string;
}

export type GlyphComponent = (props: GlyphCtx) => React.ReactElement;

export interface GlyphDef {
  /** 0 = gesture glyph resting at t=0, 1 = draw glyph resting at t=1. */
  rest?: 0 | 1;
  /** "toggle" = t is a persistent state driven by `active`/internal press. */
  kind?: "gesture" | "toggle";
  /** One full play, ms, on the tempo scale. Defaults to tempo.glow. */
  duration?: number;
  /** Bound to a live state (recording, syncing) — the only glyphs `animate="loop"` repeats. */
  live?: boolean;
  component: GlyphComponent;
}

/** rotate(deg) about a pivot — SVG transform-string form for AnimatedG. */
export const rotateAbout = (deg: number, cx = 12, cy = 12) =>
  `rotate(${deg} ${cx} ${cy})`;

/** scale(s) about a pivot — SVG has no scale-center, emulate via translate. */
export const scaleAbout = (s: number, cx = 12, cy = 12) =>
  `translate(${cx} ${cy}) scale(${s}) translate(${-cx} ${-cy})`;

/** translate(x, y) transform string. */
export const translateXY = (x: number, y: number) => `translate(${x} ${y})`;
