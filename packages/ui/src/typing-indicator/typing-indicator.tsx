import * as React from "react";
import { forwardRef, useEffect, useState } from "react";
import { View, type LayoutChangeEvent, type ViewProps } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { cn, ease, spring, timing, useReducedMotion, useTheme } from "@lumioui/core";

/**
 * TypingIndicator — someone is writing. The dots never hop: they sit still
 * and brighten in turn, in place, each 70ms after the last, once per ~1.2s
 * (the Button's busy-dots pattern — no band is drawn across them).
 *   <TypingIndicator />                         — bare dots
 *   <TypingIndicator bubble />                  — dots in a received-message bubble
 *   <TypingIndicator visible={x} />             — switches on / dims out in place
 *   <TypingIndicator bubble message={reply} />  — the bubble becomes the reply
 *
 * With `message` the bubble springs to the measured size of the reply while
 * the dots dim toward its leading edge, then the words ignite in reading
 * order (~50ms per word, each over 160ms with a 4pt rise). Typing that stops
 * without a message dims the dots, then the bubble. Reduced motion keeps the
 * light and drops the size spring, rise and scale.
 * Expo Go compatible.
 */

export interface TypingIndicatorProps extends Omit<ViewProps, "className"> {
  /** Show the dots. Switches on / dims out rather than hard-mounting. Default true. */
  visible?: boolean;
  /** Wrap the dots in a received-message bubble surface. Default false. */
  bubble?: boolean;
  /** Dot diameter in px. Default 8. */
  dotSize?: number;
  /** Multiplier on the ~1.2s light sweep. Default 1. */
  speed?: number;
  /** Dot color token. Default "mutedForeground". */
  color?: "primary" | "foreground" | "mutedForeground";
  /** The reply that ends the typing — the bubble grows into it, words igniting in order. */
  message?: string;
  /** Widest the reply text may wrap at, in pt. Default 260. */
  maxWidth?: number;
  /** Fires once the last word of `message` has ignited. */
  onRevealed?: () => void;
  /** Screen-reader announcement while typing. Default "Typing…". */
  accessibilityLabel?: string;
  className?: string;
}

/** One sweep of light across the dots, then a rest. */
const SWEEP_MS = 1200;
/** Each dot brightens this long after the one before it. */
const DOT_STEP = 70;
/** How long a dot stays lit as the band passes (rise + fall). */
const DOT_LIT = 420;
/** Dots rest at this brightness between passes. */
const DOT_REST = 0.35;
/** Words ignite on the AI-reply cadence (§5a): ~50ms apart, 160ms each, 4pt rise. */
const WORD_GAP = 50;
const WORD_RISE = 4;
/** The bubble's own padding when `bubble` is set (px-4 / py-2). */
const PAD_X = 16;
const PAD_Y = 8;
/** Dimmed bubble settles to this scale as it leaves. */
const EXIT_SCALE = 0.97;

const IGNITE = { ...timing.fast, easing: Easing.bezier(...ease.out) };
const DIM = { ...timing.recede, easing: Easing.bezier(...ease.in) };

export const TypingIndicator = forwardRef<React.ElementRef<typeof View>, TypingIndicatorProps>(
  function TypingIndicator(
    {
      visible = true,
      bubble = false,
      dotSize = 8,
      speed = 1,
      color = "mutedForeground",
      message,
      maxWidth = 260,
      onRevealed,
      accessibilityLabel = "Typing…",
      className,
      ...props
    },
    ref
  ) {
    const { colors } = useTheme();
    const reduce = useReducedMotion();
    const words = React.useMemo(() => (message ? message.split(/\s+/).filter(Boolean) : []), [message]);
    const replying = words.length > 0;

    // Sizes: the dot bubble as it stands, and the reply's measured text block.
    const [from, setFrom] = useState({ w: 0, h: 0 });
    const [text, setText] = useState({ w: 0, h: 0 });
    const padX = bubble ? PAD_X : 0;
    const padY = bubble ? PAD_Y : 0;
    const ready = replying && from.w > 0 && text.w > 0;

    // Container first, then content: the bubble ignites, the dots switch on
    // 120ms later. Leaving runs the other way round.
    const shell = useSharedValue(0);
    const dots = useSharedValue(0);
    const grow = useSharedValue(0);
    // The callback rides a ref — a new identity must not replay the reveal.
    const revealed = React.useRef(onRevealed);
    revealed.current = onRevealed;
    useEffect(() => {
      if (replying) return;
      if (visible) {
        shell.value = withTiming(1, IGNITE);
        dots.value = withDelay(timing.recede.duration, withTiming(1, IGNITE));
      } else {
        dots.value = withTiming(0, DIM);
        shell.value = withDelay(timing.recede.duration, withTiming(0, DIM));
      }
    }, [visible, replying, shell, dots]);

    // The reply: dots dim toward the leading edge while the bubble springs
    // to the reply's size; words follow once the dots are out.
    useEffect(() => {
      if (!ready) return;
      shell.value = withTiming(1, IGNITE);
      dots.value = withTiming(0, DIM);
      grow.value = reduce ? 1 : withSpring(1, spring.swap);
      const total = timing.recede.duration + (words.length - 1) * WORD_GAP + timing.fast.duration;
      const id = setTimeout(() => revealed.current?.(), total);
      return () => clearTimeout(id);
    }, [ready, words.length, reduce, shell, dots, grow]);

    const shellStyle = useAnimatedStyle(() => {
      const base = {
        opacity: shell.value,
        transform: [{ scale: reduce ? 1 : EXIT_SCALE + (1 - EXIT_SCALE) * shell.value }],
      };
      if (!ready) return base;
      const w = text.w + padX * 2;
      const h = text.h + padY * 2;
      return {
        ...base,
        width: from.w + (w - from.w) * grow.value,
        height: from.h + (h - from.h) * grow.value,
      };
    });
    const dotsStyle = useAnimatedStyle(() => ({
      opacity: dots.value,
      transform: [{ translateX: replying && !reduce ? (dots.value - 1) * WORD_RISE : 0 }],
    }));

    const onShellLayout = (e: LayoutChangeEvent) => {
      if (replying && from.w > 0) return;
      const { width, height } = e.nativeEvent.layout;
      if (width !== from.w || height !== from.h) setFrom({ w: width, h: height });
    };

    return (
      <Animated.View
        ref={ref}
        style={shellStyle}
        onLayout={onShellLayout}
        accessibilityRole={replying ? "text" : "progressbar"}
        accessibilityLabel={replying ? message : accessibilityLabel}
        accessibilityState={replying ? undefined : { busy: visible }}
        accessibilityLiveRegion={replying ? "polite" : "none"}
        className={cn(
          // 40pt-tall received bubble, same radius family as message bubbles.
          bubble && "h-10 self-start justify-center overflow-hidden rounded-3xl rounded-bl-md bg-secondary px-4",
          className
        )}
        {...props}
      >
        <Animated.View className="flex-row items-center" style={[{ gap: dotSize * 0.7 }, dotsStyle]}>
          {[0, 1, 2].map((i) => (
            <Dot
              key={i}
              index={i}
              size={dotSize}
              speed={speed}
              color={colors[color]}
              active={visible && !replying}
            />
          ))}
        </Animated.View>

        {replying ? (
          <>
            {/* Hidden twin of the reply at its final wrap — the size the bubble grows to. */}
            <View
              pointerEvents="none"
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={{ position: "absolute", left: 0, top: 0, width: maxWidth, opacity: 0 }}
            >
              <View
                className="flex-row flex-wrap self-start"
                onLayout={(e) => {
                  const { width, height } = e.nativeEvent.layout;
                  if (width !== text.w || height !== text.h) setText({ w: width, h: height });
                }}
              >
                {words.map((w, i) => (
                  <Animated.Text key={i} className="text-base leading-6 text-foreground">
                    {i < words.length - 1 ? `${w} ` : w}
                  </Animated.Text>
                ))}
              </View>
            </View>
            {ready ? (
              <View
                pointerEvents="none"
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                className="flex-row flex-wrap"
                style={{ position: "absolute", left: padX, top: padY, width: text.w }}
              >
                {words.map((w, i) => (
                  <Word key={i} delay={timing.recede.duration + i * WORD_GAP} reduce={reduce}>
                    {i < words.length - 1 ? `${w} ` : w}
                  </Word>
                ))}
              </View>
            ) : null}
          </>
        ) : null}
      </Animated.View>
    );
  }
);

TypingIndicator.displayName = "TypingIndicator";

interface DotProps {
  index: number;
  size: number;
  speed: number;
  color: string;
  /** The sweep only runs while someone is typing — a hidden or answered
   *  indicator costs no UI-thread frames. */
  active: boolean;
}

function Dot({ index, size, speed, color, active }: DotProps) {
  const clock = useSharedValue(0);
  const cycle = SWEEP_MS * speed;
  const peak = (DOT_LIT / 2 + index * DOT_STEP) * speed;
  const half = (DOT_LIT / 2) * speed;

  useEffect(() => {
    if (!active) {
      cancelAnimation(clock);
      return;
    }
    clock.value = 0;
    clock.value = withRepeat(withTiming(1, { duration: cycle, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(clock);
  }, [active, cycle, clock]);

  const style = useAnimatedStyle(() => ({ opacity: lightAt(clock, cycle, peak, half) }));

  return (
    <Animated.View
      style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }, style]}
    />
  );
}

/** Brightness of a dot as the band passes: a soft cosine bump around its peak time. */
function lightAt(clock: SharedValue<number>, cycle: number, peak: number, half: number): number {
  "worklet";
  const x = (clock.value * cycle - peak) / half;
  const b = Math.abs(x) < 1 ? 0.5 * (1 + Math.cos(Math.PI * x)) : 0;
  return DOT_REST + (1 - DOT_REST) * b;
}

/** One word of the reply — ignites with a 4pt rise after `delay`. */
function Word({ delay, reduce, children }: { delay: number; reduce: boolean; children: string }) {
  const on = useSharedValue(0);
  useEffect(() => {
    on.value = withDelay(delay, withTiming(1, IGNITE));
  }, [delay, on]);
  const style = useAnimatedStyle(() => ({
    opacity: on.value,
    transform: [{ translateY: reduce ? 0 : (1 - on.value) * WORD_RISE }],
  }));
  return (
    <Animated.Text style={style} className="text-base leading-6 text-foreground">
      {children}
    </Animated.Text>
  );
}
