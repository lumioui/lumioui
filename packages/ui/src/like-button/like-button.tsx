import * as React from "react";
import { forwardRef } from "react";
import { Pressable, View, type PressableProps } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import {
  LightPool,
  cn,
  createVariant,
  ease,
  spring,
  tempo,
  timing,
  useHaptic,
  usePressAnimation,
  useReducedMotion,
  useTheme,
  type ColorTokens,
} from "@lumioui/core";

/**
 * LikeButton — the social heart. Tap to like: the outline heart dips, then
 * light rises through it from the bottom up until it is full, a small pool of
 * the like colour brightens under it and settles away, and the count swaps in
 * place one step up. Unlike drains the fill downward, with no light. Controlled
 * or uncontrolled; the moment plays on every false → true change whatever its
 * source, so a double-tap on a photo fills the button too.
 *
 *   <LikeButton defaultLiked={false} count={1284} />
 *   <LikeButton variant="overlay" liked={liked} onLikedChange={setLiked} count={48200} />
 *
 * Expo Go compatible.
 */

// The heart on the 24 grid — the outline and the fill share one path so the
// fill covers the outline exactly as it rises.
const HEART = "M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z";

/** The social red. Content colour, not chrome — pass `color="primary"` to
 *  follow the surrounding <Accent> instead. */
const LIKE_RED = "#FF3040";

const GLYPH = { sm: 20, md: 24, lg: 28 } as const;
const OVERLAY_GLYPH = { sm: 28, md: 32, lg: 36 } as const;
// Count line height — the swap layers stack inside it.
const LINE = { sm: 18, md: 20, lg: 22 } as const;

/** The outline heart dips this far before the light rises through it. */
const DIP = 0.86;
/** Light rising through the heart — the same length as a check drawing on, so
 *  the fill reads as one stroke of light rather than a pop. */
const FILL_RISE = { duration: 240, easing: Easing.bezier(...ease.out) };
/** Unlike — the light drains out the bottom faster than it rose. */
const FILL_DRAIN = { ...timing.recede, easing: Easing.bezier(...ease.in) };
/** The outline hands over to the fill only over the last stretch of the rise,
 *  so no dark rim shows while the light is still climbing. */
const OUTLINE_HANDOFF = 0.7;
/** The pool brightens and settles (LightPool's own peak + settle), then goes
 *  out — an event under the heart, never a resting halo. */
const POOL_MS = timing.slow.duration + tempo.roll;
/** Pool diameter as a multiple of the glyph, and its peak alpha. */
const POOL_SCALE = 3;
const POOL_STRENGTH = 0.3;
/** Count swap travel — direction carries meaning (up on like, down on unlike). */
const COUNT_TRAVEL = 6;
const SWAP_SCALE = 0.96;

const rootVariants = createVariant({
  base: "flex-row items-center",
  variants: {
    variant: {
      plain: "min-h-[44px] gap-1.5",
      pill: "h-9 gap-1.5 rounded-full border border-border bg-card px-3",
      overlay: "min-w-[44px] flex-col gap-1",
    },
    size: { sm: "", md: "", lg: "" },
  },
  compoundVariants: [
    { variant: "pill", size: "sm", class: "h-8 px-2.5" },
    { variant: "pill", size: "lg", class: "h-11 px-4" },
  ],
  defaultVariants: { variant: "plain", size: "md" },
});

const countVariants = createVariant({
  base: "tabular-nums",
  variants: {
    variant: {
      plain: "font-semibold text-foreground",
      pill: "font-medium text-foreground",
      overlay: "font-semibold text-white",
    },
    size: { sm: "text-sm", md: "text-[15px]", lg: "text-base" },
  },
  compoundVariants: [{ variant: "overlay", size: "sm", class: "text-xs" }, { variant: "overlay", size: "md", class: "text-[13px]" }],
  defaultVariants: { variant: "plain", size: "md" },
});

/** 1,284 · 12.4K · 482K · 1.2M — the compact form feeds and reels use. */
export function formatLikeCount(n: number): string {
  const abs = Math.abs(n);
  const unit = (v: number, s: string) => {
    const fixed = v < 10 ? v.toFixed(1) : Math.floor(v).toString();
    return `${fixed.replace(/\.0$/, "")}${s}`;
  };
  if (abs >= 1_000_000) return unit(Math.floor(n / 100_000) / 10, "M");
  if (abs >= 10_000) return unit(Math.floor(n / 100) / 10, "K");
  return n.toLocaleString("en-US");
}

export interface LikeButtonProps
  extends Omit<PressableProps, "onPress" | "children" | "style" | "accessibilityRole"> {
  /** Controlled liked state. Omit and use `defaultLiked` for uncontrolled. */
  liked?: boolean;
  /** Uncontrolled initial state. Default false. */
  defaultLiked?: boolean;
  /** Fires with the next state on every tap. */
  onLikedChange?: (liked: boolean) => void;
  /** Likes from everyone else. The viewer's own like is added on top, so
   *  toggling never needs the parent to recompute the total. Omit to hide the count. */
  count?: number;
  /** Count formatter. Default `formatLikeCount` (1,284 · 12.4K · 1.2M). */
  formatCount?: (n: number) => string;
  /** Hide the count even when `count` is set. */
  hideCount?: boolean;
  /** plain — icon + inline count (feeds). pill — bordered chip (comments,
   *  reactions). overlay — white stacked icon over video/photo (reels). */
  variant?: "plain" | "pill" | "overlay";
  /** Glyph + count scale. Default "md". */
  size?: "sm" | "md" | "lg";
  /** Liked fill colour: a theme token ("primary", "destructive"…) or any
   *  colour. Default the social red. */
  color?: keyof ColorTokens | (string & {});
  /** Skip the light pool under the heart — for dense rows (comments, lists).
   *  The rising fill and the count swap stay. */
  noBurst?: boolean;
  /** Haptic on like. Default true. */
  haptic?: boolean;
  disabled?: boolean;
  /** Screen-reader name. Default "Like". */
  accessibilityLabel?: string;
  className?: string;
  /** Extra classes for the count text. */
  countClassName?: string;
}

export const LikeButton = forwardRef<React.ElementRef<typeof Pressable>, LikeButtonProps>(
  function LikeButton(
    {
      liked: controlledLiked,
      defaultLiked = false,
      onLikedChange,
      count,
      formatCount = formatLikeCount,
      hideCount = false,
      variant = "plain",
      size = "md",
      color = LIKE_RED,
      noBurst = false,
      haptic = true,
      disabled,
      accessibilityLabel = "Like",
      className,
      countClassName,
      onPressIn,
      onPressOut,
      ...props
    },
    ref
  ) {
    const { colors } = useTheme();
    const haptics = useHaptic(haptic);
    const reduce = useReducedMotion();
    // Icon-sized press — light enough that the like dip still reads after it.
    const press = usePressAnimation({ pressedScale: 0.94, disabled });

    const [internal, setInternal] = React.useState(defaultLiked);
    const liked = controlledLiked ?? internal;

    const tint = (color in colors ? colors[color as keyof ColorTokens] : color) as string;
    const overlay = variant === "overlay";
    const glyph = overlay ? OVERLAY_GLYPH[size] : GLYPH[size];
    const idleStroke = overlay ? "#FFFFFF" : colors.foreground;
    const strokeWidth = overlay ? 2.2 : 2;

    // rise: how far the light has climbed through the heart, 0 empty … 1 full.
    // lit: brightness of the fill layer (reduced motion crossfades on this).
    const rise = useSharedValue(liked ? 1 : 0);
    const lit = useSharedValue(liked ? 1 : 0);
    const dip = useSharedValue(1);
    const [pool, setPool] = React.useState(false);
    const poolTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    React.useEffect(
      () => () => {
        if (poolTimer.current) clearTimeout(poolTimer.current);
      },
      []
    );

    // Animate on real transitions only — first paint lands settled.
    const prevLiked = React.useRef(liked);
    React.useEffect(() => {
      if (prevLiked.current === liked) return;
      prevLiked.current = liked;
      if (poolTimer.current) clearTimeout(poolTimer.current);

      if (!liked) {
        // Unlike: the light drains out downward. No pool, no dip.
        setPool(false);
        if (reduce) {
          lit.value = withTiming(0, timing.recede);
        } else {
          lit.value = 1;
          rise.value = withTiming(0, FILL_DRAIN);
        }
        return;
      }

      // Like: the pool is light, not travel — it plays under reduced motion too.
      if (!noBurst) {
        setPool(true);
        poolTimer.current = setTimeout(() => setPool(false), POOL_MS);
      }
      if (reduce) {
        rise.value = 1;
        lit.value = withTiming(1, timing.fast);
        return;
      }
      lit.value = 1;
      rise.value = 0;
      rise.value = withDelay(timing.instant.duration, withTiming(1, FILL_RISE));
      dip.value = withSequence(withTiming(DIP, timing.instant), withSpring(1, spring.pop));
    }, [liked, reduce, noBurst, rise, lit, dip]);

    const toggle = () => {
      if (disabled) return;
      const next = !liked;
      if (next) haptics.light();
      else haptics.selection();
      if (controlledLiked === undefined) setInternal(next);
      onLikedChange?.(next);
    };

    const outlineStyle = useAnimatedStyle(() => ({
      opacity: 1 - lit.value * interpolate(rise.value, [OUTLINE_HANDOFF, 1], [0, 1], "clamp"),
    }));
    // The fill sits in a window that slides up from below while the heart
    // inside counter-slides, so the heart stays put and is revealed bottom-up.
    const windowStyle = useAnimatedStyle(
      () => ({ opacity: lit.value, transform: [{ translateY: (1 - rise.value) * glyph }] }),
      [glyph]
    );
    const fillStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -(1 - rise.value) * glyph }] }), [glyph]);
    const dipStyle = useAnimatedStyle(() => ({ transform: [{ scale: dip.value }] }));

    const total = (count ?? 0) + (liked ? 1 : 0);
    const showCount = count !== undefined && !hideCount;
    const label = formatCount(total);

    // Pill: the liked state tints the chip with the heart colour.
    const hex = /^#[0-9a-fA-F]{6}$/.test(tint) ? tint : null;
    const pillStyle =
      variant === "pill" && liked && hex ? { borderColor: `${hex}55`, backgroundColor: `${hex}14` } : undefined;

    const poolSize = glyph * POOL_SCALE;

    return (
      <Pressable
        ref={ref}
        onPress={toggle}
        onPressIn={(e) => {
          press.onPressIn();
          onPressIn?.(e);
        }}
        onPressOut={(e) => {
          press.onPressOut();
          onPressOut?.(e);
        }}
        disabled={disabled}
        hitSlop={variant === "plain" ? { left: 10, right: 10 } : 6}
        className={cn(rootVariants({ variant, size }), disabled && "opacity-50", className)}
        style={pillStyle}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ selected: liked, disabled: !!disabled }}
        accessibilityValue={showCount ? { text: `${total.toLocaleString("en-US")} likes` } : undefined}
        aria-pressed={liked}
        {...props}
      >
        <Animated.View style={[{ width: glyph, height: glyph }, press.animatedStyle]}>
          {!noBurst ? (
            <LightPool
              on={pool}
              color={tint}
              size={poolSize}
              strength={POOL_STRENGTH}
              style={{ position: "absolute", left: (glyph - poolSize) / 2, top: (glyph - poolSize) / 2 }}
            />
          ) : null}
          <Animated.View style={dipStyle}>
            <Animated.View style={outlineStyle}>
              <Svg width={glyph} height={glyph} viewBox="0 0 24 24">
                <Path
                  d={HEART}
                  stroke={idleStroke}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill={overlay ? "rgba(0,0,0,0.12)" : "none"}
                />
              </Svg>
            </Animated.View>
            <View pointerEvents="none" style={{ position: "absolute", left: 0, top: 0, width: glyph, height: glyph, overflow: "hidden" }}>
              <Animated.View style={[{ width: glyph, height: glyph, overflow: "hidden" }, windowStyle]}>
                <Animated.View style={fillStyle}>
                  <Svg width={glyph} height={glyph} viewBox="0 0 24 24">
                    <Path d={HEART} fill={tint} stroke={tint} strokeWidth={strokeWidth} strokeLinejoin="round" />
                  </Svg>
                </Animated.View>
              </Animated.View>
            </View>
          </Animated.View>
        </Animated.View>

        {showCount ? (
          <SwapCount
            value={total}
            text={label}
            lineHeight={LINE[size]}
            reduce={reduce}
            className={cn(countVariants({ variant, size }), countClassName)}
            shadow={overlay}
          />
        ) : null}
      </Pressable>
    );
  }
);

LikeButton.displayName = "LikeButton";

// --- Count swap ----------------------------------------------------------------

interface SwapState {
  key: number;
  value: number;
  text: string;
  prev: string | null;
  dir: 1 | -1;
}

/** The count swaps in place: the outgoing figure dims and lifts away, the
 *  incoming one ignites from a few points below (reversed on unlike). */
function SwapCount({
  value,
  text,
  lineHeight,
  reduce,
  className,
  shadow,
}: {
  value: number;
  text: string;
  lineHeight: number;
  reduce: boolean;
  className?: string;
  shadow?: boolean;
}) {
  const [swap, setSwap] = React.useState<SwapState>({ key: 0, value, text, prev: null, dir: 1 });
  // Derive the next layer pair during render (no passive-effect lag).
  if (swap.text !== text) {
    setSwap({ key: swap.key + 1, value, text, prev: swap.text, dir: value >= swap.value ? 1 : -1 });
  }
  const textShadow = shadow
    ? { textShadowColor: "rgba(0,0,0,0.45)", textShadowRadius: 4, textShadowOffset: { width: 0, height: 1 } }
    : null;
  return (
    <View style={{ height: lineHeight }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {swap.prev !== null ? (
        <SwapLayer
          key={`out-${swap.key}`}
          mode="out"
          dir={swap.dir}
          reduce={reduce}
          className={className}
          style={[{ position: "absolute", left: 0, top: 0, lineHeight }, textShadow]}
        >
          {swap.prev}
        </SwapLayer>
      ) : null}
      <SwapLayer
        key={`in-${swap.key}`}
        mode="in"
        animate={swap.key > 0}
        dir={swap.dir}
        reduce={reduce}
        className={className}
        style={[{ lineHeight }, textShadow]}
      >
        {text}
      </SwapLayer>
    </View>
  );
}

const IGNITE = { ...timing.fast, easing: Easing.bezier(...ease.out) };
const DIM = { ...timing.recede, easing: Easing.bezier(...ease.in) };

function SwapLayer({
  mode,
  animate = true,
  dir,
  reduce,
  className,
  style,
  children,
}: {
  mode: "in" | "out";
  animate?: boolean;
  dir: 1 | -1;
  reduce: boolean;
  className?: string;
  style?: React.ComponentProps<typeof Animated.Text>["style"];
  children: string;
}) {
  // Each layer mounts fresh at its own start value — no one-frame flash of
  // the settled state before the swap begins.
  const settled = mode === "in" ? !animate : true;
  const opacity = useSharedValue(settled ? 1 : 0);
  // move: 0 at rest; 1 = displaced by COUNT_TRAVEL and SWAP_SCALE.
  const move = useSharedValue(mode === "in" && animate ? 1 : 0);
  React.useEffect(() => {
    if (mode === "in") {
      if (!animate) return;
      opacity.value = withTiming(1, IGNITE);
      move.value = reduce ? 0 : withSpring(0, spring.swap);
    } else {
      opacity.value = withTiming(0, DIM);
      move.value = reduce ? 0 : withTiming(1, DIM);
    }
  }, [mode, animate, reduce, opacity, move]);
  const animated = useAnimatedStyle(() => {
    const m = reduce ? 0 : move.value;
    // In: arrives from below (count up) or above (count down). Out: leaves the other way.
    const y = (mode === "in" ? 1 : -1) * dir * COUNT_TRAVEL * m;
    return {
      opacity: opacity.value,
      transform: [{ translateY: y }, { scale: 1 - (1 - SWAP_SCALE) * m }],
    };
  }, [mode, reduce, dir]);
  return (
    <Animated.Text className={className} style={[style, animated]} numberOfLines={1}>
      {children}
    </Animated.Text>
  );
}

export { rootVariants as likeButtonVariants };
