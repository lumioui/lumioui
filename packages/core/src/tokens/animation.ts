/**
 * Lumio motion — motion that behaves like light.
 *
 *   Ignite, don't bounce. Things arrive fast and settle calmly; overshoot is
 *     saved for the few "spark" moments (a pick landing, a success).
 *   Dim to leave. Exits lead with opacity and run ~60% of the entrance.
 *   Swap in place. Outgoing content dims while the incoming content ignites
 *     with a small bloom — travel only when direction means something.
 *   Flicker for "can't". A refused action flickers like a light that won't
 *     switch on (`spring.shake` is the flicker spring).
 *
 * Every spring sits on one tempo scale (×1.25 steps from 160ms) and one of
 * four characters, so any number in the library can be traced back here.
 * Mass is always 1; `tune(period, ratio)` turns the pair into
 * stiffness/damping.
 */
import type { WithTimingConfig } from "react-native-reanimated";

/** Tempo scale (ms) — the natural period of each spring. */
export const tempo = {
  flick: 160,
  snap: 200,
  move: 250,
  settle: 315,
  glow: 390,
  drift: 490,
  roll: 610,
} as const;

/** Damping characters. */
const STEADY = 1; // lands dead on — light doesn't rebound
const CALM = 0.88; // a settle you feel more than see
const SPARK = 0.64; // one visible overshoot, for moments that earn it
const FLICKER = 0.3; // fast decaying tremor

/** A spring on the tempo scale — always concrete numbers, mass 1. */
export type LumioSpring = { stiffness: number; damping: number; mass: number };

function tune(periodMs: number, ratio: number): LumioSpring {
  const omega = (2 * Math.PI * 1000) / periodMs;
  return {
    stiffness: Math.round(omega * omega * 10) / 10,
    damping: Math.round(2 * ratio * omega * 10) / 10,
    mass: 1,
  };
}

export const spring = {
  /** Press feedback — quick and weighty, no wobble. */
  press: tune(tempo.snap, 0.9),
  /** Switch thumb — lands dead on its side. */
  switch: tune(tempo.glow, STEADY),
  /** Sheets, cards and other surfaces growing or moving. */
  surface: tune(tempo.settle, CALM),
  /** Layout and list changes. */
  layout: tune(tempo.move, CALM),
  /** Gliding selection (segments, pills, thumbs) — no rebound. */
  glide: tune(tempo.settle, STEADY),
  /** Tab / segment indicator — unhurried, no rebound. */
  indicator: tune(tempo.glow, STEADY),
  /** In-place swaps: the incoming label/icon igniting, width morphs. */
  swap: tune(tempo.snap, STEADY),
  /** Overlay panels summoned by a tap — modals, drawers, popovers, menus. */
  panel: tune(tempo.move, STEADY),
  /** Dragged thumbs released onto a value — a little life on landing. */
  bouncy: tune(tempo.move, SPARK),
  /** Swipe-to-dismiss — gone quickly. */
  dismiss: tune(tempo.snap, 0.9),
  /** Flicker — refused input and errors (start from a small offset). */
  shake: tune(tempo.flick, FLICKER),
  /** Spark — checkmarks, badges, picks landing on screen. */
  pop: tune(tempo.settle, SPARK),
  /** Odometer / ticker digits — slow, heavy settle per column. */
  roll: tune(tempo.roll, STEADY),
} as const;

export const timing = {
  /** Barely-there state changes. */
  instant: { duration: 80 } satisfies WithTimingConfig,
  /** Dim — overlay and content exits. */
  recede: { duration: 120 } satisfies WithTimingConfig,
  /** Ignite — opacity of anything arriving; press-level changes. */
  fast: { duration: 160 } satisfies WithTimingConfig,
  /** Crossfades and colour shifts. */
  normal: { duration: 250 } satisfies WithTimingConfig,
  /** Large surfaces and ambient changes. */
  slow: { duration: 390 } satisfies WithTimingConfig,
} as const;

/**
 * Easing — cubic-bezier control points. Wrap with Easing.bezier(...) for
 * withTiming, e.g. withTiming(1, { duration, easing: Easing.bezier(...ease.out) }).
 */
export const ease = {
  /** Ignite — a fast rise that eases into full brightness. Entrances. */
  out: [0.2, 0.85, 0.25, 1] as const,
  /** Dim — slips away, still moving when it's gone. Exits. */
  in: [0.45, 0, 0.8, 0.4] as const,
  /** Shift — slow to start, soft to land. In-place state changes. */
  inOut: [0.6, 0.05, 0.2, 1] as const,
} as const;
