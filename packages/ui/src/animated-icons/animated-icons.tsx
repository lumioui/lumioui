/**
 * AnimatedIcon — hand-drawn animated icon set (see README.md).
 * Static by default; `animate` picks the driver, `trigger` replays a
 * gesture imperatively, `active` drives toggle glyphs (heart, lock,
 * play-pause, menu). One shared value `t` runs through each glyph — no
 * icon ever crossfades.
 *
 * Lit strokes: while `t` moves, a short bright bead of the glyph's own ink
 * runs across the strokes with it (a masked full-strength copy over a base
 * that dims to 0.85), once per gesture, then rests. Durations sit on the
 * tempo scale. `animate="loop"` repeats only glyphs bound to a live state
 * (mic, refresh, pulse-dot, waveform); any other glyph plays once.
 */
import * as React from "react";
import { forwardRef, useCallback, useEffect, useRef } from "react";
import { View, type ColorValue, type ViewProps } from "react-native";
import Svg, { Defs, G, Mask } from "react-native-svg";
import {
  Easing,
  cancelAnimation,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import {
  AnimatedG,
  AnimatedRect,
  cn,
  ease,
  spring,
  tempo,
  useReducedMotion,
  useTheme,
  type ColorTokens,
} from "@lumioui/core";
import { navGlyphs } from "./glyphs-nav";
import { objectGlyphs } from "./glyphs-objects";
import { mediaGlyphs } from "./glyphs-media";
import { signatureGlyphs } from "./glyphs-signature";
import type { GlyphDef } from "./motion";

export const animatedIconMap = {
  ...navGlyphs,
  ...objectGlyphs,
  ...mediaGlyphs,
  ...signatureGlyphs,
} satisfies Record<string, GlyphDef>;

export type AnimatedIconName = keyof typeof animatedIconMap;

const px = { sm: 16, md: 22, lg: 28, xl: 34 } as const;

/** The base ink dims this much at mid-gesture so the bead reads as light. */
const BASE_DIM = 0.15;
/** Bead width in the 24px grid — about 15% of a stroke's run. */
const BEAD_W = 4;
/** Bead travel: fully off the glyph at t=0 and t=1 (the band leans 20°). */
const BEAD_FROM = -18;
const BEAD_TRAVEL = 52;

export interface AnimatedIconProps extends ViewProps {
  /** Glyph name — e.g. "bell", "play-pause", "lumio-mark". */
  name: AnimatedIconName;
  /** Size preset or an explicit pixel size. */
  size?: keyof typeof px | number;
  /** Color: a theme token ("foreground", "primary", …) or hex. */
  color?: keyof ColorTokens | ColorValue;
  /** Stroke width in the 24px grid — default 1.9. */
  strokeWidth?: number;
  /**
   * Motion driver:
   * - `"still"` (default) renders the settled pose, never moves.
   * - `"mount"` plays the gesture once when the icon mounts.
   * - `"hover"` replays on hover (web) or touch (native).
   * - `"press"` replays while pressed.
   * - `"loop"` runs continuously for glyphs bound to a live state (mic,
   *   refresh, pulse-dot, waveform) — pass it only while that state is live.
   *   Other glyphs play once, as with `"mount"`.
   */
  animate?: "still" | "mount" | "hover" | "press" | "loop";
  /** Toggle-glyph state (heart/star filled, lock open, play→pause, menu→x). */
  active?: boolean;
  /** Bump this number to replay the gesture from a parent (e.g. onPress). */
  trigger?: number;
  /** Tempo multiplier — <1 faster, >1 slower. Default 1. */
  speed?: number;
  /**
   * Icons are decorative by default (hidden from screen readers). Provide a
   * label for a standalone semantic icon — it is exposed with role "image".
   */
  accessibilityLabel?: string;
  className?: string;
}

interface Driver {
  t: SharedValue<number>;
  replay: () => void;
}

function useGlyphDriver(
  def: GlyphDef,
  animate: NonNullable<AnimatedIconProps["animate"]>,
  active: boolean,
  trigger: number | undefined,
  reduced: boolean,
  speed: number
): Driver {
  const rest = def.rest ?? 0;
  const t = useSharedValue<number>(rest);
  const duration = (def.duration ?? tempo.glow) * speed;
  const cfg = { duration, easing: Easing.bezier(...ease.out) };
  const isToggle = def.kind === "toggle";

  const replay = useCallback(() => {
    if (isToggle) return;
    if (reduced) {
      t.value = rest;
      return;
    }
    t.value = 0;
    t.value = withTiming(1, cfg);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cfg is derived, stable per def
  }, [isToggle, reduced, rest, duration, t]);

  // mount / loop run once; animate="loop" keeps running until the driver
  // changes. Gesture glyphs restart (poses match at t=0/1); draw and
  // toggle glyphs ping-pong so they never snap.
  // Idle motion is banned: only a live glyph loops; anything else plays once.
  const loops = animate === "loop" && def.live === true;
  useEffect(() => {
    if (animate === "mount" || (animate === "loop" && !loops)) replay();
    else if (loops && !reduced) {
      t.value = 0;
      t.value = withRepeat(withTiming(1, cfg), -1, rest === 1 || isToggle);
    } else if (!isToggle) {
      // Leaving "loop" (or reduced motion turning on) must stop the repeat
      // and settle on the rest pose, not freeze mid-gesture.
      cancelAnimation(t);
      t.value = rest;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run on driver change only
  }, [animate, reduced]);

  // Toggle glyphs track `active` with the pop spring.
  useEffect(() => {
    if (!isToggle) return;
    t.value = reduced ? (active ? 1 : 0) : withSpring(active ? 1 : 0, spring.pop);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- spring.pop is static
  }, [active, isToggle, reduced]);

  // Imperative replay via `trigger`.
  const prev = useRef(trigger);
  useEffect(() => {
    if (trigger !== undefined && trigger !== prev.current) replay();
    prev.current = trigger;
  }, [trigger, replay]);

  return { t, replay };
}

export const AnimatedIcon = forwardRef<React.ElementRef<typeof View>, AnimatedIconProps>(
  function AnimatedIcon(
    {
      name,
      size = "md",
      color,
      strokeWidth = 2,
      animate = "still",
      active = false,
      trigger,
      speed = 1,
      accessibilityLabel,
      className,
      ...props
    },
    ref
  ) {
    const { colors } = useTheme();
    const reduced = useReducedMotion();
    const resolved: ColorValue =
      typeof color === "string" && color in colors
        ? colors[color as keyof ColorTokens]
        : ((color ?? colors.foreground) as ColorValue);
    const dim = typeof size === "number" ? size : px[size];
    const def = animatedIconMap[name] ?? navGlyphs["check"]!;
    const { t, replay } = useGlyphDriver(def, animate, active, trigger, reduced, speed);
    const meaningful = accessibilityLabel != null;
    const maskId = React.useId().replace(/[^a-zA-Z0-9]/g, "");
    // A still icon never moves, so it never carries the bead.
    const lights = animate !== "still" || trigger !== undefined || def.kind === "toggle";

    const baseProps = useAnimatedProps(() => ({
      opacity: lights ? 1 - BASE_DIM * 4 * t.value * (1 - t.value) : 1,
    }));
    const beadProps = useAnimatedProps(() => ({ x: BEAD_FROM + BEAD_TRAVEL * t.value }));

    const ctx = {
      t,
      color: resolved as string,
      sw: strokeWidth,
      filled: active,
      accent: colors.primary,
      accentInk: colors.primaryForeground,
    };
    const svg = (
      <Svg width={dim} height={dim} viewBox="0 0 24 24">
        <AnimatedG animatedProps={baseProps}>
          <def.component {...ctx} />
        </AnimatedG>
        {lights ? (
          <>
            <Defs>
              <Mask id={maskId} x="0" y="0" width="24" height="24" maskUnits="userSpaceOnUse">
                <G transform="rotate(20 12 12)">
                  <AnimatedRect y={-10} width={BEAD_W} height={44} fill="#FFFFFF" animatedProps={beadProps} />
                </G>
              </Mask>
            </Defs>
            <G mask={`url(#${maskId})`}>
              <def.component {...ctx} />
            </G>
          </>
        ) : null}
      </Svg>
    );

    return (
      <View
        ref={ref}
        className={cn("items-center justify-center", className)}
        style={{ width: dim, height: dim }}
        accessibilityElementsHidden={!meaningful}
        importantForAccessibility={meaningful ? "yes" : "no"}
        aria-hidden={!meaningful}
        accessibilityRole={meaningful ? "image" : undefined}
        accessibilityLabel={accessibilityLabel}
        {...props}
      >
        {/* Hover/press drivers listen without claiming the touch: a plain
            View with onTouchStart never becomes the responder, so an icon
            inside a parent Pressable (a row, a tab, an action button) no
            longer swallows that parent's press. */}
        {animate === "hover" || animate === "press" ? (
          <View
            onTouchStart={replay}
            onPointerEnter={
              animate === "hover"
                ? (e) => {
                    if (e.nativeEvent.pointerType === "mouse") replay();
                  }
                : undefined
            }
          >
            {svg}
          </View>
        ) : (
          svg
        )}
      </View>
    );
  }
);

AnimatedIcon.displayName = "AnimatedIcon";
