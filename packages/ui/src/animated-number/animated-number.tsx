import * as React from "react";
import { forwardRef, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Text,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type TextProps,
  type TextStyle,
} from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { cn, useReducedMotion, ease, spring, timing } from "@lumioui/core";
import { DotMatrixText } from "./dot-matrix";

/**
 * AnimatedNumber — a number that moves from the previous value to the new
 * one when `value` changes. Set in the system font with tabular numerals so
 * digits never jitter sideways.
 *   <AnimatedNumber value={1234} />
 *   <AnimatedNumber value={0.85} format={(n) => `${Math.round(n * 100)}%`} />
 *   <AnimatedNumber value={balance} format={usd} animation="roll" />
 *
 * Motion styles:
 *  - "ease" (default) counts the whole figure on the ease.out token.
 *  - "spring" counts it on the spring.roll token.
 *  - "roll" is the Lumio odometer: each character column swaps on its own,
 *    30ms apart from the right, on spring.roll. Only the columns that
 *    change move — the incoming digit ignites half-bright, travels at most
 *    6pt in the direction of the change and brightens as it settles, while
 *    the outgoing digit dims. Unchanged digits stay at rest.
 *
 * Faces: `face="led"` sets the figure in dot-matrix LEDs (DotMatrixText).
 * With "roll" only the dots that differ switch, column by column; counts
 * ("ease"/"spring") switch each step instantly, like a real panel.
 *   <AnimatedNumber value={steps} face="led" animation="roll" dot={6} />
 *
 * No count lands with a bounce: numbers are content, not a celebration.
 * With `startOnView` (default) the first change waits until the number is
 * actually visible on screen. Reduced motion keeps the brightening and
 * drops the travel (counts jump straight to the value). Screen readers hear
 * only the final value — never the mid-count chatter.
 *
 * Threading: counts tween on the UI thread; a worklet quantizes the tween to
 * the displayed precision and hops to JS only when that step changes. The
 * roll re-renders once per value change — every frame after that is a
 * shared value. `format` (often `toLocaleString`, not a worklet) runs on JS.
 */

/** Visibility re-check cadence while a first count is still waiting. One
 *  shared timer serves every waiting instance and stops when none are left. */
const VISIBILITY_POLL_MS = 500;

/** Decimal places to track by default — enough for cents and percentages. */
const MAX_INFERRED_PRECISION = 3;

/** Columns step on this rhythm, rightmost first (the number-ticker beat). */
export const ROLL_STAGGER = 30;
/** Directional travel of a swapping digit (pt) — the §5 count cap. */
const ROLL_TRAVEL = 6;
/** A changed digit ignites to this brightness, then brightens to full as it settles. */
const ROLL_IGNITE = 0.5;
/** Share of the column's settle spent igniting to ROLL_IGNITE (~70ms on spring.roll). */
const ROLL_IGNITE_AT = 0.15;
const DIM_EASING = Easing.bezier(...ease.in);
const IGNITE_EASING = Easing.bezier(...ease.out);

// ── Shared visibility ticker ────────────────────────────────────────────────
// One interval for the whole app instead of one per instance: a dashboard
// with twelve stat tiles waiting below the fold costs one timer, not twelve,
// and the timer is torn down the moment the last waiter starts or unmounts.
const visibilityWaiters = new Set<() => void>();
let visibilityTimer: ReturnType<typeof setInterval> | null = null;

function watchVisibility(check: () => void): () => void {
  visibilityWaiters.add(check);
  if (visibilityTimer == null) {
    visibilityTimer = setInterval(() => {
      // Copy first — a check that starts its count unsubscribes mid-loop.
      Array.from(visibilityWaiters).forEach((fn) => fn());
    }, VISIBILITY_POLL_MS);
  }
  return () => {
    visibilityWaiters.delete(check);
    if (visibilityWaiters.size === 0 && visibilityTimer != null) {
      clearInterval(visibilityTimer);
      visibilityTimer = null;
    }
  };
}

/** Decimal places in a number's shortest representation, capped. */
function decimalsOf(n: number): number {
  if (!Number.isFinite(n) || Number.isInteger(n)) return 0;
  const s = String(n);
  const e = s.indexOf("e-");
  if (e !== -1) return MAX_INFERRED_PRECISION;
  const dot = s.indexOf(".");
  return dot === -1 ? 0 : Math.min(MAX_INFERRED_PRECISION, s.length - dot - 1);
}

// ── RollingText — the per-column odometer ───────────────────────────────────

export interface RollingTextProps {
  /** The figure to show, already formatted ("$6,482.17"). */
  text: string;
  /** 1 = the value went up (digits rise into place), -1 = down. Default 1. */
  direction?: 1 | -1;
  /** Row container — placement only (margins, alignment). */
  className?: string;
  /** Typography for every glyph (size, weight, ink). */
  glyphClassName?: string;
  glyphStyle?: StyleProp<TextStyle>;
  /** Characters from this index on use `minorClassName` — cents set smaller. */
  minorFrom?: number;
  minorClassName?: string;
  /** Swap without motion (e.g. animation turned off by the caller). */
  instant?: boolean;
  /** Fires on JS once the last changed column has settled. */
  onSettle?: () => void;
}

interface RollState {
  text: string;
  prev: string;
  gen: number;
}

/**
 * RollingText — renders a formatted figure as one column per character and
 * swaps only the columns whose character changed. Columns are keyed from the
 * right so units stay units as the figure grows ("999" → "1,000" adds
 * columns on the left). Decorative glyphs; give the parent the a11y label.
 */
export function RollingText({
  text,
  direction = 1,
  className,
  glyphClassName,
  glyphStyle,
  minorFrom,
  minorClassName,
  instant = false,
  onSettle,
}: RollingTextProps) {
  const reduce = useReducedMotion();
  // Previous text + a generation per change, resolved during render so the
  // changed columns and their delays are known in the same pass.
  const [roll, setRoll] = useState<RollState>({ text, prev: text, gen: 0 });
  let current = roll;
  if (roll.text !== text) {
    current = { text, prev: roll.text, gen: roll.gen + 1 };
    setRoll(current);
  }

  const settleRef = useRef(onSettle);
  settleRef.current = onSettle;
  const genRef = useRef(current.gen);
  genRef.current = current.gen;
  // Stable across renders so a column's effect never restarts mid-roll; a
  // stale generation (interrupted by a newer change) is ignored.
  const land = React.useCallback((gen: number) => {
    if (gen === genRef.current) settleRef.current?.();
  }, []);

  const { prev, gen } = current;
  const len = text.length;
  const slots: { ch: string; old: string; changed: boolean; rank: number }[] = [];
  let changedCount = 0;
  // Walk from the right so the rank (stagger order) starts at the units.
  for (let r = 0; r < len; r++) {
    const ch = text[len - 1 - r]!;
    const old = prev[prev.length - 1 - r] ?? "";
    const changed = gen > 0 && ch !== old;
    slots.push({ ch, old, changed, rank: changed ? changedCount++ : -1 });
  }
  slots.reverse();

  // A change that moved no column (or only removed columns) settles at once.
  useEffect(() => {
    if (gen > 0 && changedCount === 0) land(gen);
  }, [gen, changedCount, land]);

  return (
    <View className={cn("flex-row items-baseline", className)}>
      {slots.map((slot, i) => {
        const minor = minorFrom !== undefined && minorFrom >= 0 && i >= minorFrom;
        return (
          <RollColumn
            key={len - 1 - i}
            ch={slot.ch}
            old={slot.old}
            changed={slot.changed}
            delay={Math.max(0, slot.rank) * ROLL_STAGGER}
            isLast={slot.changed && slot.rank === changedCount - 1}
            gen={gen}
            dir={direction}
            instant={instant}
            reduce={reduce}
            onLand={land}
            className={cn("tabular-nums text-foreground", glyphClassName, minor && minorClassName)}
            style={glyphStyle}
          />
        );
      })}
    </View>
  );
}
RollingText.displayName = "RollingText";

interface RollColumnProps {
  ch: string;
  old: string;
  changed: boolean;
  delay: number;
  isLast: boolean;
  gen: number;
  dir: 1 | -1;
  instant: boolean;
  reduce: boolean;
  onLand: (gen: number) => void;
  className?: string;
  style?: StyleProp<TextStyle>;
}

function RollColumn({
  ch,
  old,
  changed,
  delay,
  isLast,
  gen,
  dir,
  instant,
  reduce,
  onLand,
  className,
  style,
}: RollColumnProps) {
  // t: incoming 0 → 1 on spring.roll. out: outgoing dims 0 → 1.
  const t = useSharedValue(changed && !instant ? 0 : 1);
  const out = useSharedValue(changed && !instant ? 0 : 1);

  useEffect(() => {
    if (!changed) return;
    if (instant) {
      t.value = 1;
      out.value = 1;
      if (isLast) onLand(gen);
      return;
    }
    t.value = 0;
    out.value = 0;
    out.value = withDelay(delay, withTiming(1, { ...timing.recede, easing: DIM_EASING }));
    t.value = withDelay(
      delay,
      withSpring(1, spring.roll, (finished) => {
        if (finished && isLast) runOnJS(onLand)(gen);
      })
    );
  }, [gen, changed, delay, instant, isLast, onLand, t, out]);

  const inStyle = useAnimatedStyle(() => ({
    opacity: interpolate(t.value, [0, ROLL_IGNITE_AT, 1], [0, ROLL_IGNITE, 1], "clamp"),
    transform: [{ translateY: reduce ? 0 : (1 - t.value) * ROLL_TRAVEL * dir }],
  }));
  const outStyle = useAnimatedStyle(() => ({
    opacity: 1 - out.value,
    // Exits travel half as far as the entrance, the other way.
    transform: [{ translateY: reduce ? 0 : -out.value * (ROLL_TRAVEL / 2) * dir }],
  }));

  return (
    <View>
      {changed && old !== "" ? (
        <Animated.Text
          className={className}
          style={[style, { position: "absolute", left: 0, right: 0, textAlign: "center" }, outStyle]}
        >
          {old}
        </Animated.Text>
      ) : null}
      <Animated.Text className={className} style={[style, inStyle]}>
        {ch}
      </Animated.Text>
    </View>
  );
}

// ── AnimatedNumber ──────────────────────────────────────────────────────────

export interface AnimatedNumberProps extends TextProps {
  /** Target value. */
  value: number;
  /** Value the first count starts from. Default 0. */
  from?: number;
  /** Count duration in ms for "ease". Default 1000. Ignored by "spring" and "roll". */
  duration?: number;
  /**
   * Motion style — "ease" (default) counts with the ease.out token over
   * `duration` ms; "spring" counts on the spring.roll token; "roll" swaps
   * each changed digit column in place, 30ms apart from the right.
   */
  animation?: "ease" | "spring" | "roll";
  /** Format the displayed number. Default rounds and locale-formats. Runs on the JS thread. */
  format?: (n: number) => string;
  /**
   * Decimal places the count re-renders at. Defaults to the precision of
   * `value` / `from` (an integer target re-renders once per whole number).
   * Raise it if your `format` shows more decimals than the value carries.
   */
  precision?: number;
  /** Wait until the number is visible before the first count. Default true. */
  startOnView?: boolean;
  /** Fires on JS when a change has landed — the moment to hold, sheen or move on. */
  onSettle?: () => void;
  /** Glyph typography (size, weight, ink). In "roll" mode it styles every column. */
  className?: string;
  /** "roll" and "led" — placement classes for the row of columns. */
  containerClassName?: string;
  /** "type" (default) sets the figure in the system font; "led" in dot-matrix LEDs. */
  face?: "type" | "led";
  /** "led" only — LED diameter in pt. Default 5. */
  dot?: number;
  /** "led" only — lit colour. Default the theme ink. */
  color?: string;
  /** "led" only — changed dots light in this colour for a beat, then settle.
   *  `animation="roll"` only — the ease/spring count-up switches instantly every
   *  frame, so it has no beat. */
  beatColor?: string;
}

export const AnimatedNumber = forwardRef<React.ElementRef<typeof Text>, AnimatedNumberProps>(
  function AnimatedNumber(
    {
      value,
      from = 0,
      duration = 1000,
      animation = "ease",
      format,
      precision,
      startOnView = true,
      onSettle,
      className,
      containerClassName,
      face = "type",
      dot,
      color,
      beatColor,
      onLayout,
      style,
      ...props
    },
    ref
  ) {
    const reduce = useReducedMotion();
    const fmt = React.useMemo(
      () => format ?? ((n: number) => Math.round(n).toLocaleString()),
      [format]
    );
    // Latest formatter / settle handler for JS-side callbacks without re-subscribing.
    const fmtRef = useRef(fmt);
    fmtRef.current = fmt;
    const settleRef = useRef(onSettle);
    settleRef.current = onSettle;
    const rolling = animation === "roll";

    // Quantization scale: 10^decimals. The worklet works in integer steps
    // (Math.round(v * scale)) so it can tell "the visible number changed"
    // without ever calling the formatter on the UI thread.
    const decimals = precision ?? Math.max(decimalsOf(value), decimalsOf(from));
    const scale = Math.pow(10, Math.max(0, Math.min(6, Math.round(decimals))));

    const [text, setText] = useState(() => fmt(from));
    // Roll mode: the value the columns show and which way it last moved.
    const [rollTo, setRollTo] = useState<{ to: number; dir: 1 | -1 }>({ to: from, dir: 1 });
    const fromRef = useRef(from);
    const anim = useSharedValue(from);
    const started = useRef(false);
    const hostRef = useRef<React.ElementRef<typeof Text> | null>(null);

    // Re-render only when the visible string actually changes.
    const setTextIfChanged = React.useCallback((next: string) => {
      setText((prev) => (prev === next ? prev : next));
    }, []);

    /** JS side of the hop: an integer step index → formatted string. */
    const onStep = React.useCallback(
      (step: number, stepScale: number) => {
        setTextIfChanged(fmtRef.current(step / stepScale));
      },
      [setTextIfChanged]
    );

    /** Landing: format the exact target (not the quantized step) on JS. */
    const land = React.useCallback(
      (to: number) => {
        setTextIfChanged(fmtRef.current(to));
        settleRef.current?.();
      },
      [setTextIfChanged]
    );

    const rollSettled = React.useCallback(() => settleRef.current?.(), []);

    const animateTo = React.useCallback(
      (to: number) => {
        if (rolling) {
          // The columns own the motion (and reduced motion); just move the target.
          setRollTo({ to, dir: to >= fromRef.current ? 1 : -1 });
          fromRef.current = to;
          return;
        }
        if (reduce) {
          cancelAnimation(anim);
          anim.value = to;
          fromRef.current = to;
          setTextIfChanged(fmtRef.current(to));
          settleRef.current?.();
          return;
        }
        anim.value = fromRef.current;
        if (animation === "spring") {
          // spring.roll — the heavy odometer settle, so the count glides in
          // like a reel instead of a fixed-duration tween.
          anim.value = withSpring(to, spring.roll, (finished) => {
            if (finished) runOnJS(land)(to);
          });
        } else {
          anim.value = withTiming(to, { duration, easing: IGNITE_EASING }, (finished) => {
            if (finished) runOnJS(land)(to);
          });
        }
        fromRef.current = to;
      },
      [anim, duration, animation, rolling, reduce, land, setTextIfChanged]
    );

    const start = React.useCallback(() => {
      if (started.current) return;
      started.current = true;
      animateTo(value);
    }, [animateTo, value]);

    // First count: immediately, or once visible. measureInWindow is async
    // and can report garbage (0 height, NaN on web) before first layout —
    // untrusted readings are skipped, not treated as "off screen".
    const checkVisible = React.useCallback(() => {
      if (started.current) return;
      if (!startOnView) {
        start();
        return;
      }
      const node = hostRef.current as unknown as {
        measureInWindow?: (cb: (x: number, y: number, w: number, h: number) => void) => void;
      } | null;
      if (!node?.measureInWindow) {
        start();
        return;
      }
      try {
        node.measureInWindow((_x, y, _w, h) => {
          if (started.current) return;
          if (!Number.isFinite(y) || !Number.isFinite(h) || h <= 0) return;
          const screenH = Dimensions.get("window").height;
          if (y + h > 0 && y < screenH) start();
        });
      } catch {
        start();
      }
    }, [start, startOnView]);

    // Latest checker for the shared ticker — subscribing once per waiting
    // period instead of on every callback identity change.
    const checkRef = useRef(checkVisible);
    checkRef.current = checkVisible;

    useEffect(() => {
      // Catch the already-on-screen case at mount, then join the shared
      // ticker until the first count starts (covers mount-time layout races
      // and scroll-into-view). Unsubscribes on start and on unmount.
      checkRef.current();
      if (!startOnView || started.current) return;
      let unwatch: (() => void) | null = null;
      unwatch = watchVisibility(() => {
        if (started.current) {
          unwatch?.();
          unwatch = null;
          return;
        }
        checkRef.current();
      });
      return () => unwatch?.();
    }, [startOnView]);

    // Later value changes always animate (covers lists that scrolled into
    // view without a fresh layout pass). Skipped on mount — the mount
    // effect above owns the first count so startOnView is honored.
    const mounted = useRef(false);
    useEffect(() => {
      if (!mounted.current) {
        mounted.current = true;
        return;
      }
      if (!started.current) {
        started.current = true;
      }
      animateTo(value);
      return () => cancelAnimation(anim);
    }, [value, animateTo, anim]);

    // UI thread: quantize the tween to the displayed precision and hop to
    // JS only when that integer step changes — never per frame for nothing,
    // and never a JS-only formatter inside the worklet.
    useAnimatedReaction(
      () => Math.round(anim.value * scale),
      (step, prev) => {
        if (step !== prev) runOnJS(onStep)(step, scale);
      },
      [scale, onStep]
    );

    const setHost = (node: unknown) => {
      const host = node as React.ElementRef<typeof Text> | null;
      hostRef.current = host;
      if (typeof ref === "function") ref(host as React.ElementRef<typeof Text>);
      else if (ref) ref.current = host;
    };
    const handleLayout = (e: LayoutChangeEvent) => {
      checkVisible();
      onLayout?.(e);
    };

    if (face === "led") {
      return (
        <View
          ref={setHost}
          onLayout={handleLayout}
          accessible
          accessibilityRole="text"
          accessibilityLabel={fmt(value)}
          accessibilityLiveRegion="none"
          testID={props.testID}
        >
          <DotMatrixText
            text={rolling ? fmt(rollTo.to) : text}
            instant={!rolling}
            dot={dot}
            color={color}
            beatColor={beatColor}
            className={containerClassName}
            onSettle={rolling ? rollSettled : undefined}
          />
        </View>
      );
    }

    if (rolling) {
      return (
        <View
          ref={setHost}
          onLayout={handleLayout}
          accessible
          accessibilityRole="text"
          accessibilityLabel={fmt(value)}
          accessibilityLiveRegion="none"
          testID={props.testID}
        >
          <RollingText
            text={fmt(rollTo.to)}
            direction={rollTo.dir}
            className={containerClassName}
            glyphClassName={className}
            glyphStyle={style}
            onSettle={rollSettled}
          />
        </View>
      );
    }

    return (
      <Text
        ref={setHost}
        onLayout={handleLayout}
        className={cn("tabular-nums text-foreground", className)}
        style={style}
        accessibilityRole="text"
        accessibilityLabel={fmt(value)}
        accessibilityLiveRegion="none"
        {...props}
      >
        {text}
      </Text>
    );
  }
);

AnimatedNumber.displayName = "AnimatedNumber";
