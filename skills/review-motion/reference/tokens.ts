/**
 * Motion tokens for React Native (Reanimated): drop this file into your
 * project (e.g. `src/theme/motion.ts`) and import springs and timings from it
 * instead of writing numbers inline.
 *
 * Motion that behaves like light: things arrive fast and settle calmly, leave
 * by dimming, change in place, and answer every touch.
 *
 * Every spring is a (period, damping ratio) pair on one tempo scale, mass 1.
 */
import { Easing, type WithTimingConfig } from "react-native-reanimated";

/** Tempo scale (ms): the natural period of each spring. */
export const tempo = {
  flick: 160,
  snap: 200,
  move: 250,
  settle: 315,
  glow: 390,
  drift: 490,
  roll: 610,
} as const;

const STEADY = 1; // lands dead on
const CALM = 0.88; // a settle you feel more than see
const SPARK = 0.64; // one visible overshoot, for moments that earn it
const FLICKER = 0.3; // fast decaying tremor, for refusals

export type Spring = { stiffness: number; damping: number; mass: number };

/** Turn a period (ms) and damping ratio into a concrete spring config. */
export function tune(periodMs: number, ratio: number): Spring {
  const omega = (2 * Math.PI * 1000) / periodMs;
  return {
    stiffness: Math.round(omega * omega * 10) / 10,
    damping: Math.round(2 * ratio * omega * 10) / 10,
    mass: 1,
  };
}

export const spring = {
  /** Press feedback: quick and weighty, no wobble. */
  press: tune(tempo.snap, 0.9),
  /** Switch thumb: lands dead on its side. */
  switch: tune(tempo.glow, STEADY),
  /** Cards and surfaces growing or moving. */
  surface: tune(tempo.settle, CALM),
  /** List and layout changes. */
  layout: tune(tempo.move, CALM),
  /** Gliding selection (segments, pills, thumbs). */
  glide: tune(tempo.settle, STEADY),
  /** Tab or segment indicator. */
  indicator: tune(tempo.glow, STEADY),
  /** In-place swaps: the incoming label or icon, width morphs. */
  swap: tune(tempo.snap, STEADY),
  /** Overlays summoned by a tap: sheets, modals, drawers, menus. */
  panel: tune(tempo.move, STEADY),
  /** Swipe-to-dismiss: gone quickly. */
  dismiss: tune(tempo.snap, 0.9),
  /** Spark: checkmarks, badges, a pick landing. Never for chrome. */
  pop: tune(tempo.settle, SPARK),
  /** Refusal flicker: start from a small offset (4px) and release. */
  shake: tune(tempo.flick, FLICKER),
} as const;

export const timing = {
  /** Barely-there state changes. */
  instant: { duration: 80 } satisfies WithTimingConfig,
  /** Dim: exits of content and overlays. */
  recede: { duration: 120 } satisfies WithTimingConfig,
  /** Ignite: opacity of anything arriving, press-level changes. */
  fast: { duration: 160 } satisfies WithTimingConfig,
  /** Crossfades and colour shifts. */
  normal: { duration: 250 } satisfies WithTimingConfig,
  /** Large surfaces and ambient changes. */
  slow: { duration: 390 } satisfies WithTimingConfig,
} as const;

export const ease = {
  /** Entrances: a fast rise that eases into place. */
  out: Easing.bezier(0.2, 0.85, 0.25, 1),
  /** Exits: slips away, still moving when it's gone. */
  in: Easing.bezier(0.45, 0, 0.8, 0.4),
  /** In-place changes: slow to start, soft to land. */
  inOut: Easing.bezier(0.6, 0.05, 0.2, 1),
} as const;
