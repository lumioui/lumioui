import * as React from "react";
import { forwardRef } from "react";
import { View, Text, type LayoutChangeEvent, type ViewProps } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSpring,
  withTiming,
  cancelAnimation,
  Easing,
  type SharedValue,
} from "react-native-reanimated";
import {
  cn,
  createVariant,
  useReducedMotion,
  useTheme,
  spring,
  ease,
  tempo,
  timing,
  type ColorTokens,
  type AnimatedViewStyle,
} from "@lumioui/core";
import { Icon, type IconName } from "../icon";
import { Glass } from "../glass";

/**
 * Badge — compact status label with variants, sizes, icons, a live dot, and
 * an in-place swap (dim / ignite) when `contentKey` changes.
 *   <Badge variant="success" size="md" icon="check">Done</Badge>
 *   <Badge variant="destructive" pulse>Live</Badge>
 *   <Badge loading>Syncing</Badge>
 * Badges sit still on first paint (a list of statuses never pops in at
 * once); motion is reserved for a change: the label swap + width glide on a
 * new `contentKey`, the icon swap on a new status glyph, `popIn` for a count
 * that just arrived.
 *
 * Light, not paint: a new `variant` crossfades its fill over timing.normal
 * (the meaning never snaps), entering success ignites the check in place, and
 * `loading` swaps the status glyph for three small dots that brighten in turn
 * — not a rotor, and nothing sweeps across the pill.
 */

const badgeVariants = createVariant({
  base: "flex-row items-center self-start rounded-full border",
  variants: {
    variant: {
      default: "border-transparent bg-primary",
      secondary: "border-transparent bg-secondary",
      destructive: "border-transparent bg-destructive",
      outline: "border-border bg-transparent",
      success: "border-transparent bg-success",
      warning: "border-transparent bg-warning",
      info: "border-primary/30 bg-primary/10",
      neutral: "border-border bg-card",
      glass: "border-transparent overflow-hidden",
    },
    size: {
      sm: "h-6 gap-1 px-2",
      md: "h-7 gap-1.5 px-2.5",
      lg: "h-8 gap-2 px-3",
    },
  },
  defaultVariants: { variant: "default", size: "md" },
});

const badgeTextVariants = createVariant({
  base: "font-semibold tabular-nums",
  variants: {
    variant: {
      default: "text-primary-foreground",
      secondary: "text-secondary-foreground",
      destructive: "text-destructive-foreground",
      outline: "text-foreground",
      success: "text-success-foreground",
      warning: "text-warning-foreground",
      info: "text-primary-text",
      neutral: "text-muted-foreground",
      glass: "text-foreground",
    },
    size: {
      // text-[11px] arbitrary often fails on native — use capped text-xs with tighter tracking.
      sm: "text-xs",
      md: "text-xs",
      lg: "text-sm",
    },
  },
  defaultVariants: { variant: "default", size: "md" },
});

/** Live-dot colour per variant — the dot is drawn in the label colour so it
 *  reads as part of the pill (a streaming "LIVE" tag), never a halo. */
const liveDotBg: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default: "bg-primary-foreground",
  secondary: "bg-destructive",
  destructive: "bg-destructive-foreground",
  outline: "bg-destructive",
  success: "bg-success-foreground",
  warning: "bg-warning-foreground",
  info: "bg-primary-text",
  neutral: "bg-destructive",
  glass: "bg-destructive",
};

/** Fill + border per variant — the outgoing layer a variant change dims away. */
const fillLayer: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default: "bg-primary",
  secondary: "bg-secondary",
  destructive: "bg-destructive",
  outline: "border border-border",
  success: "bg-success",
  warning: "bg-warning",
  info: "border border-primary/30 bg-primary/10",
  neutral: "border border-border bg-card",
  glass: "",
};

/** Icon glyph color per variant — mirrors badgeTextVariants one-for-one so
 *  icon + label always share a color and read as one unit. */
const badgeIconColors: Record<NonNullable<BadgeProps["variant"]>, keyof ColorTokens> = {
  default: "primaryForeground",
  secondary: "secondaryForeground",
  destructive: "destructiveForeground",
  outline: "foreground",
  success: "successForeground",
  warning: "warningForeground",
  info: "primary",
  neutral: "mutedForeground",
  glass: "foreground",
};

// Icons scale with the badge — lg with an sm icon looked lost.
const iconSize: Record<NonNullable<BadgeProps["size"]>, "sm" | "md"> = {
  sm: "sm",
  md: "sm",
  lg: "md",
};

const STATUS_ICON: Partial<Record<NonNullable<BadgeProps["variant"]>, IconName>> = {
  success: "check",
  warning: "alert-triangle",
  destructive: "x",
  info: "info",
  // Neutral/outline/secondary/default stay icon-free unless callers pass one —
  // a bell on "Archived" or a price tag reads as noise, not signal.
};

// Live loops, not UI transitions: the busy dots and live dot repeat while
// their state lasts, so they run on slow beats rather than the UI tokens.
/** One cycle of the busy dots — the same beat a busy Button's dots run at. */
const BUSY_CYCLE_MS = tempo.roll * 2;
/** Resting brightness of a busy dot; the size suits a 16px glyph slot. */
const DOT_REST = 0.3;
const DOT_SIZE = 3;
/** Live-dot half-period — two drift beats, a calm on-air rhythm, not an alarm. */
const PULSE_DURATION = tempo.drift * 2;

/**
 * Content swap — in place. When the key changes, the outgoing label/icon
 * dims (timing.recede, →0.96) while the incoming one ignites (opacity
 * timing.fast ease.out, 0.96 → 1 on spring.swap). Numeric keys add a ≤6px
 * lift in the direction of the change: up counts rise, down counts sink.
 */
const SWAP_SCALE = 0.96;
/** A 12–16px glyph needs a wider bloom than a label to read as arriving. */
const ICON_SWAP_SCALE = 0.86;
/** Directional travel (px) for a count change; the exit goes half as far. */
const COUNT_LIFT = 5;
const SWAP_DIM = { duration: timing.recede.duration, easing: Easing.bezier(...ease.in) };
const SWAP_IGNITE = { duration: timing.fast.duration, easing: Easing.bezier(...ease.out) };
/** `popIn` — a count arriving sparks from this scale on spring.pop. */
const POP_FROM = 0.6;

const SLOT_HEIGHT = { sm: 16, md: 18, lg: 20 } as const;
const ICON_BOX = { sm: 16, md: 24 } as const;

const isTextChild = (c: React.ReactNode): c is string | number =>
  typeof c === "string" || typeof c === "number";

/** Width of the off-layout box the label is measured in — wide enough that
 *  no badge label wraps or clips while measuring. */
const MEASURE_W = 1000;

export interface BadgeProps extends ViewProps {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" | "neutral" | "glass";
  size?: "sm" | "md" | "lg";
  className?: string;
  textClassName?: string;
  /** Leading icon name. Ignored when `loading` is true. */
  /** Leading glyph — pass `null` to suppress the variant's auto status icon. */
  icon?: IconName | null;
  /** Busy: the status glyph swaps in place for three dots that brighten in turn. Default false. */
  loading?: boolean;
  /**
   * Live state — a small dot inside the pill that blinks while live (on-air,
   * recording, in progress). Only pass it while the state is genuinely live.
   */
  pulse?: boolean;
  /** Ignite with a spark on mount — for a count that just arrived. Default false. */
  popIn?: boolean;
  /** When this key changes, the content swaps in place (numeric keys lift ≤6px in the direction of change). */
  contentKey?: string | number;
  /** Accessible label — announced instead of the visible text. */
  accessibilityLabel?: string;
  children?: React.ReactNode;
}

export const Badge = forwardRef<React.ElementRef<typeof View>, BadgeProps>(
  function Badge(
    { variant = "default", size = "md", icon, loading = false, pulse, popIn = false, contentKey, accessibilityLabel, className, textClassName, children, ...props },
    ref
  ) {
    const reduce = useReducedMotion();
    const { colors } = useTheme();
    const progress = useSharedValue(0);

    // Opt-in arrival spark: the pill ignites and lands with one overshoot.
    // Off by default so static status pills are visible at rest from the
    // first frame. A new contentKey never punches the pill: the swap +
    // width glide is the one thing that leads.
    const popping = popIn && !reduce;
    const popLight = useSharedValue(popping ? 0 : 1);
    const pop = useSharedValue(popping ? POP_FROM : 1);
    React.useEffect(() => {
      if (!popping || popLight.value !== 0) return;
      popLight.value = withTiming(1, SWAP_IGNITE);
      pop.value = withSpring(1, spring.pop);
    }, [popping, popLight, pop]);
    const popStyle = useAnimatedStyle(() => ({
      opacity: popLight.value,
      transform: [{ scale: pop.value }],
    }));

    // ── Fill crossfade ────────────────────────────────────────────────────
    // A new variant is the badge's meaning changing, so the fill never snaps:
    // the outgoing fill sits over the new one and dims over timing.normal.
    // Resolved during render so the old fill exists on the same commit the
    // new one paints.
    const [fill, setFill] = React.useState<{
      variant: NonNullable<BadgeProps["variant"]>;
      prev: NonNullable<BadgeProps["variant"]> | null;
      gen: number;
    }>({ variant, prev: null, gen: 0 });
    if (variant !== fill.variant) {
      setFill({ variant, prev: fill.variant, gen: fill.gen + 1 });
    }
    const fillOut = useSharedValue(1);
    React.useLayoutEffect(() => {
      if (fill.gen === 0) return;
      fillOut.value = 0;
      fillOut.value = withTiming(1, { duration: timing.normal.duration, easing: Easing.bezier(...ease.inOut) });
    }, [fill.gen, fillOut]);
    const fillOutStyle = useAnimatedStyle(() => ({ opacity: 1 - fillOut.value }));

    // ── Busy dots ─────────────────────────────────────────────────────────
    // Loading is not a rotor: the glyph slot swaps in place for three small
    // dots that brighten in turn. Reduced motion holds the dots half lit.
    const busy = useSharedValue(loading ? 1 : 0);
    const lap = useSharedValue(0);
    React.useEffect(() => {
      busy.value = withTiming(loading ? 1 : 0, loading ? SWAP_IGNITE : SWAP_DIM);
      if (!loading || reduce) {
        cancelAnimation(lap);
        return;
      }
      lap.value = 0;
      lap.value = withRepeat(withTiming(1, { duration: BUSY_CYCLE_MS, easing: Easing.linear }), -1, false);
      return () => cancelAnimation(lap);
    }, [loading, reduce, busy, lap]);
    const glyphBusyStyle = useAnimatedStyle(() => ({ opacity: 1 - busy.value }));
    const dotsBusyStyle = useAnimatedStyle(() => ({ opacity: busy.value }));

    // Live dot — opacity only (no scale halo), runs only while `pulse` is
    // set and stops on unmount. Reduced motion keeps a steady dot.
    React.useEffect(() => {
      if (pulse && !reduce) {
        progress.value = 0;
        progress.value = withRepeat(
          withTiming(1, { duration: PULSE_DURATION, easing: Easing.bezier(...ease.inOut) }),
          -1,
          true
        );
      } else {
        cancelAnimation(progress);
        progress.value = 0;
      }
      return () => cancelAnimation(progress);
    }, [pulse, reduce, progress]);

    const liveDotStyle = useAnimatedStyle(() => ({
      opacity: 1 - progress.value * 0.65,
    }));

    // ── Label swap ────────────────────────────────────────────────────────
    // Resolved during render (React's "previous props in state" pattern) so
    // the outgoing copy exists on the same commit the incoming one appears —
    // a passive effect left one frame where the old label vanished first.
    const [roll, setRoll] = React.useState<{
      key: string | number | undefined;
      incoming: React.ReactNode;
      outgoing: React.ReactNode;
      gen: number;
      lift: number;
    }>({ key: contentKey, incoming: children, outgoing: null, gen: 0, lift: 0 });
    if (contentKey !== roll.key) {
      // Direction only means something for counts: up rises, down sinks,
      // any other key change swaps flat in place.
      const a = roll.key;
      const lift =
        typeof a === "number" && typeof contentKey === "number" ? (contentKey > a ? 1 : -1) * COUNT_LIFT : 0;
      setRoll({ key: contentKey, incoming: children, outgoing: roll.incoming, gen: roll.gen + 1, lift });
    } else if (isTextChild(children) && children !== roll.incoming) {
      // Same key, new label (e.g. a localized string) — swap without motion.
      setRoll({ ...roll, incoming: children });
    }

    const textLift = roll.lift;

    const textBloom = useSharedValue(1); // 0 → 1: incoming settles on spring.swap
    const textLight = useSharedValue(1); // 0 → 1: incoming ignites
    const textOut = useSharedValue(1); // 0 → 1: outgoing dims
    const slotH = SLOT_HEIGHT[size];

    React.useLayoutEffect(() => {
      if (roll.gen === 0) return;
      textOut.value = 0;
      textOut.value = withTiming(1, SWAP_DIM);
      textLight.value = 0;
      textLight.value = withTiming(1, SWAP_IGNITE);
      if (reduce) {
        // Reduced motion: a plain crossfade — no travel, no scale.
        textBloom.value = 1;
        return;
      }
      textBloom.value = 0;
      textBloom.value = withSpring(1, spring.swap);
    }, [roll.gen, reduce, textBloom, textLight, textOut]);

    const inStyle = useAnimatedStyle(() => ({
      opacity: textLight.value,
      transform: [
        { translateY: (1 - textBloom.value) * textLift },
        { scale: SWAP_SCALE + (1 - SWAP_SCALE) * textBloom.value },
      ],
    }));
    const outStyle = useAnimatedStyle(() => ({
      opacity: 1 - textOut.value,
      transform: reduce
        ? []
        : [
            { translateY: -textOut.value * textLift * 0.5 },
            { scale: 1 - (1 - SWAP_SCALE) * textOut.value },
          ],
    }));

    // Width morph: a hidden copy measures the
    // incoming label, the slot springs to it on spring.swap — "Syncing" →
    // "Done" glides narrower instead of snapping, and the outgoing label is
    // never squeezed into the new width.
    const slotW = useSharedValue(-1);
    const onMeasure = React.useCallback(
      (e: LayoutChangeEvent) => {
        // Round up with a pixel of slack: a fractional label width (73.3)
        // clipped to 73 ellipsizes at some pixel densities.
        const w = Math.ceil(e.nativeEvent.layout.width) + 1;
        if (w <= 1) return;
        slotW.value = slotW.value < 0 || reduce ? w : withSpring(w, spring.swap);
      },
      [reduce, slotW]
    );
    const slotStyle = useAnimatedStyle(() => (slotW.value < 0 ? {} : { width: slotW.value }));

    // A pulsing badge already carries its signal (live / recording) — the
    // variant's auto status glyph ("x" on destructive) would misread "Live"
    // as "Failed", so pulse badges only show an icon the caller asks for.
    const resolvedIcon =
      icon === null ? undefined : icon ?? (loading ? "loader" : pulse ? undefined : STATUS_ICON[variant]);
    const resolvedIconColor = badgeIconColors[variant];
    const iconPx = ICON_BOX[iconSize[size]];

    // ── Icon swap ─────────────────────────────────────────────────────────
    // The icon is keyed by status: a new glyph ignites in place while the
    // old one dims. Appearing/disappearing icons don't swap.
    const [iconRoll, setIconRoll] = React.useState<{
      name: IconName | undefined;
      prev: IconName | undefined;
      prevSpin: boolean;
      spin: boolean;
      gen: number;
    }>({ name: resolvedIcon, prev: undefined, prevSpin: false, spin: loading, gen: 0 });
    if (resolvedIcon !== iconRoll.name || loading !== iconRoll.spin) {
      const rolls = resolvedIcon !== undefined && iconRoll.name !== undefined && resolvedIcon !== iconRoll.name;
      setIconRoll({
        name: resolvedIcon,
        spin: loading,
        prev: rolls ? iconRoll.name : undefined,
        prevSpin: iconRoll.spin,
        gen: rolls ? iconRoll.gen + 1 : iconRoll.gen,
      });
    }

    const iconBloom = useSharedValue(1);
    const iconLight = useSharedValue(1);
    const iconOut = useSharedValue(1);

    React.useLayoutEffect(() => {
      if (iconRoll.gen === 0) return;
      iconOut.value = 0;
      iconOut.value = withTiming(1, SWAP_DIM);
      iconLight.value = 0;
      iconLight.value = withTiming(1, SWAP_IGNITE);
      if (reduce) {
        iconBloom.value = 1;
        return;
      }
      iconBloom.value = 0;
      iconBloom.value = withSpring(1, spring.swap);
    }, [iconRoll.gen, reduce, iconBloom, iconLight, iconOut]);

    const iconInStyle = useAnimatedStyle(() => ({
      opacity: iconLight.value,
      transform: [{ scale: ICON_SWAP_SCALE + (1 - ICON_SWAP_SCALE) * iconBloom.value }],
    }));
    const iconOutStyle = useAnimatedStyle(() => ({
      opacity: 1 - iconOut.value,
      transform: reduce ? [] : [{ scale: 1 - (1 - ICON_SWAP_SCALE) * iconOut.value }],
    }));

    // The auto "loader" glyph is only a slot holder — busy shows dots in it.
    const renderGlyph = (name: IconName, waiting: boolean) =>
      waiting || name === "loader" ? (
        <View style={{ width: iconPx, height: iconPx }}>
          {name !== "loader" ? (
            <Animated.View style={glyphBusyStyle}>
              <Icon name={name} size={iconSize[size]} color={resolvedIconColor} />
            </Animated.View>
          ) : null}
          <BusyDots lap={lap} color={lightColor} still={reduce} style={dotsBusyStyle} />
        </View>
      ) : (
        <Icon name={name} size={iconSize[size]} color={resolvedIconColor} />
      );

    const textClass = cn(badgeTextVariants({ variant, size }), textClassName);
    // The outgoing label keeps the ink of the fill it is leaving with.
    const changed = fill.prev !== null && fill.gen > 0;
    const outTextClass = changed && fill.prev ? cn(badgeTextVariants({ variant: fill.prev, size }), textClassName) : textClass;
    const lightColor = colors[resolvedIconColor];

    const body = (
      <Animated.View
        ref={ref}
        style={popStyle}
        className={cn(badgeVariants({ variant, size }), className)}
        accessibilityRole="text"
        accessibilityLabel={accessibilityLabel ?? (typeof children === "string" ? children : undefined)}
        accessibilityState={loading ? { busy: true } : undefined}
        {...props}
      >
        {changed && fill.prev ? (
          <Animated.View
            key={`fill-${fill.gen}`}
            pointerEvents="none"
            className={cn("rounded-full", fillLayer[fill.prev])}
            // Over the border too, so the old outline dims with its fill.
            style={[{ position: "absolute", top: -1, left: -1, right: -1, bottom: -1 }, fillOutStyle]}
          />
        ) : null}
        {variant === "glass" ? (
          <Glass
            effect="clear"
            sheen={0.5}
            className="absolute inset-0 rounded-full"
            pointerEvents="none"
          />
        ) : null}
        {pulse ? (
          <Animated.View
            style={liveDotStyle}
            className={cn("h-2 w-2 rounded-full", liveDotBg[variant])}
            accessibilityElementsHidden
            importantForAccessibility="no"
            aria-hidden
          />
        ) : null}
        {resolvedIcon ? (
          <View
            style={{ width: iconPx, height: iconPx, overflow: "hidden" }}
            accessibilityElementsHidden
            importantForAccessibility="no"
            aria-hidden
          >
            <Animated.View key={`in-${iconRoll.gen}`} style={iconInStyle}>
              {renderGlyph(resolvedIcon, loading)}
            </Animated.View>
            {iconRoll.prev ? (
              <Animated.View
                key={`out-${iconRoll.gen}`}
                pointerEvents="none"
                style={[iconOutStyle, { position: "absolute", top: 0, left: 0 }]}
              >
                {iconRoll.prev === "loader" ? (
                  // The busy dots dim out where they were, held still.
                  <View style={{ width: iconPx, height: iconPx }}>
                    <BusyDots lap={lap} color={changed && fill.prev ? colors[badgeIconColors[fill.prev]] : lightColor} still />
                  </View>
                ) : (
                  <Icon
                    name={iconRoll.prev}
                    size={iconSize[size]}
                    color={changed && fill.prev ? badgeIconColors[fill.prev] : resolvedIconColor}
                  />
                )}
              </Animated.View>
            ) : null}
          </View>
        ) : null}
        {isTextChild(children) ? (
          contentKey !== undefined ? (
            <Animated.View
              style={[slotStyle, { height: slotH, overflow: "hidden", flexDirection: "row" }]}
            >
              {/* Hidden measuring copy. It sits in a wide unconstrained box —
                  measured inside the slot it would be capped at the slot's
                  current width and a longer incoming label ("Synced" →
                  "Syncing") would never get room. */}
              <View
                pointerEvents="none"
                style={{ position: "absolute", top: 0, left: 0, width: MEASURE_W, opacity: 0, alignItems: "flex-start" }}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                aria-hidden
              >
                <Text onLayout={onMeasure} numberOfLines={1} className={textClass}>
                  {roll.incoming}
                </Text>
              </View>
              <Animated.Text key={`in-${roll.gen}`} numberOfLines={1} style={inStyle} className={textClass}>
                {roll.incoming}
              </Animated.Text>
              {roll.outgoing !== null && roll.gen > 0 ? (
                <Animated.Text
                  key={`out-${roll.gen}`}
                  numberOfLines={1}
                  style={[outStyle, { position: "absolute", top: 0, left: 0 }]}
                  className={outTextClass}
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                  aria-hidden
                >
                  {roll.outgoing}
                </Animated.Text>
              ) : null}
            </Animated.View>
          ) : (
            <Text className={textClass}>{children}</Text>
          )
        ) : (
          children
        )}
      </Animated.View>
    );

    return body;
  }
);

Badge.displayName = "Badge";

/** Three busy dots filling the glyph slot. Each brightens as the cycle passes
 *  its turn, then rests — opacity only, they never travel. `still` holds them
 *  half lit (reduced motion, or a set of dots dimming out). */
function BusyDots({
  lap,
  color,
  still,
  style,
}: {
  lap: SharedValue<number>;
  color: string;
  still: boolean;
  style?: AnimatedViewStyle;
}) {
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: DOT_SIZE - 1 },
        style,
      ]}
    >
      {[0, 1, 2].map((i) => (
        <BusyDot key={i} index={i} lap={lap} color={color} still={still} />
      ))}
    </Animated.View>
  );
}

function BusyDot({ index, lap, color, still }: { index: number; lap: SharedValue<number>; color: string; still: boolean }) {
  const style = useAnimatedStyle(() => {
    if (still) return { opacity: 0.6 };
    const t = (((lap.value - index / 3) % 1) + 1) % 1;
    const peak = t < 0.5 ? Math.sin(t * 2 * Math.PI) : 0;
    return { opacity: DOT_REST + (1 - DOT_REST) * Math.max(0, peak) };
  });
  return <Animated.View style={[{ width: DOT_SIZE, height: DOT_SIZE, borderRadius: DOT_SIZE / 2, backgroundColor: color }, style]} />;
}
