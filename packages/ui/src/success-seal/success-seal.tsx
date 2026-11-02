import * as React from "react";
import { forwardRef } from "react";
import { Text, View, type ViewProps } from "react-native";
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import {
  AnimatedPath,
  LightPool,
  cn,
  createVariant,
  ease,
  spring,
  tempo,
  timing,
  useHaptic,
  useReducedMotion,
  useTheme,
  type ColorTokens,
} from "@lumioui/core";

export type SuccessSealSize = "md" | "lg" | "xl";
export type SuccessSealTone = "success" | "primary" | "destructive" | "warning";

/** Drawing space — the seal is authored on a 200 x 200 grid. */
const VIEW = 200;
const CENTER = VIEW / 2;
/** Scalloped silhouette: base radius + a 12-lobe cosine ripple, filling the grid. */
const LOBES = 12;
const SEAL_R = 88;
const SEAL_RIPPLE = 7;
const SEAL_STEPS = 144;

/** Seal diameter per size, as a hero. */
const HERO_PX: Record<SuccessSealSize, number> = { md: 92, lg: 116, xl: 144 };
/** Seal diameter per size, stamped onto a card corner. */
const STAMP_PX: Record<SuccessSealSize, number> = { md: 56, lg: 68, xl: 80 };

/** The glyph draws on just after contact, inside the UI band. */
const DRAW = { duration: tempo.move, easing: Easing.bezier(...ease.out) };
/** A stamp arrives slightly oversized and translucent, then presses down. */
const STAMP_FROM = 1.12;
/** Act, hold, resolve (DESIGN-TASTE §5c rule 5): the stamped object is left to be read. */
const HOLD_MS = 700;

const TONES: Record<SuccessSealTone, { fill: keyof ColorTokens; glyph: keyof ColorTokens; label: string }> = {
  success: { fill: "success", glyph: "successForeground", label: "Success" },
  primary: { fill: "primary", glyph: "primaryForeground", label: "Done" },
  destructive: { fill: "destructive", glyph: "destructiveForeground", label: "Failed" },
  warning: { fill: "warning", glyph: "warningForeground", label: "Attention" },
};

/** Check mark and (for destructive) cross — drawn on via strokeDashoffset. */
const CHECK_PATH = "M70 104 L92 126 L134 80";
const CHECK_LEN = 94;
const CROSS_PATH = "M76 76 L124 124 M124 76 L76 124";
const CROSS_LEN = 136;

/** Built once — the lobed outline never changes. */
const SEAL_D = (() => {
  let d = "";
  for (let i = 0; i <= SEAL_STEPS; i++) {
    const t = (i / SEAL_STEPS) * Math.PI * 2;
    const r = SEAL_R + SEAL_RIPPLE * Math.cos(LOBES * t);
    const x = CENTER + r * Math.sin(t);
    const y = CENTER - r * Math.cos(t);
    d += `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)} `;
  }
  return `${d}Z`;
})();

const titleVariants = createVariant({
  base: "text-center font-semibold tracking-tight text-foreground",
  variants: {
    size: {
      md: "text-xl",
      lg: "text-2xl",
      xl: "text-3xl",
    },
  },
  defaultVariants: { size: "lg" },
});

export interface SuccessSealProps extends Omit<ViewProps, "className" | "children"> {
  /** Seal size. Default "lg". */
  size?: SuccessSealSize;
  /** Colour story. "destructive" swaps the check for a cross and refuses with a flicker. Default "success". */
  tone?: SuccessSealTone;
  /** Play the choreography. Default true. */
  animated?: boolean;
  /**
   * Stamp mode: the object that was paid, sent or signed. The seal presses
   * onto its corner, the object dips under it as light pools behind, then
   * holds. Without children the seal is a hero above `title`.
   */
  children?: React.ReactNode;
  /** Stamp mode: lands when this turns true. Default true (lands on mount). */
  on?: boolean;
  /** Stamp mode: corner radius of the stamped object (its clip). Default 24. */
  radius?: number;
  /** Headline under the seal (hero mode). Pass nested <Text> to emphasise an amount. */
  title?: React.ReactNode;
  /** Supporting line under the headline (hero mode). */
  description?: React.ReactNode;
  /** Fires once the result has landed and held (immediately when not animated). */
  onSettled?: () => void;
  /** Land a notification haptic at contact. Default true. */
  haptic?: boolean;
  className?: string;
}

/**
 * SuccessSeal — the result lands on the thing it is about.
 *
 * Stamp mode (preferred): wrap the receipt, ticket or card that was just paid
 * or sent. The seal presses onto its top corner, the object dips under the
 * contact while its accent light pools behind (nothing sweeps across it), and it
 * holds 700ms before `onSettled` — the screen resolves around it.
 *   <SuccessSeal on={paid}><InvoiceCard /></SuccessSeal>
 *
 * Hero mode: the seal lands in its own pool of light above a title.
 *   <SuccessSeal title="Payment sent" description="You sent $1,000.00" />
 *
 * Destructive never celebrates: the object flickers once and the cross draws.
 * Reduced motion keeps the fades and the light, drops the press and travel.
 */
export const SuccessSeal = forwardRef<React.ElementRef<typeof View>, SuccessSealProps>(function SuccessSeal(
  {
    size = "lg",
    tone = "success",
    animated = true,
    children,
    on = true,
    radius = 24,
    title,
    description,
    onSettled,
    haptic = true,
    className,
    ...props
  },
  ref
) {
  const { colors } = useTheme();
  const reduce = useReducedMotion();
  const haptics = useHaptic();
  const t = TONES[tone];
  const fill = colors[t.fill];
  const glyph = colors[t.glyph];
  const stamp = children != null;
  const refuse = tone === "destructive";
  const px = stamp ? STAMP_PX[size] : HERO_PX[size];

  const land = useSharedValue(animated ? 0 : 1);
  const press = useSharedValue(animated && !reduce ? STAMP_FROM : 1);
  const draw = useSharedValue(animated && !reduce ? 0 : 1);
  const dip = useSharedValue(0);
  const flicker = useSharedValue(0);
  const [lit, setLit] = React.useState(!animated);

  const settledRef = React.useRef(onSettled);
  settledRef.current = onSettled;
  const notify = React.useCallback(() => settledRef.current?.(), []);

  const go = animated && on;
  React.useEffect(() => {
    if (!animated) {
      settledRef.current?.();
      return;
    }
    if (!on) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    if (haptic) {
      if (refuse) haptics.error();
      else if (tone === "warning") haptics.warning();
      else haptics.success();
    }
    land.value = withTiming(1, timing.fast);
    if (reduce) {
      draw.value = 1;
    } else {
      press.value = withSpring(1, spring.pop);
      draw.value = withDelay(timing.fast.duration / 2, withTiming(1, DRAW));
      if (refuse) {
        flicker.value = withSequence(withTiming(1, timing.instant), withSpring(0, spring.shake));
      } else if (stamp) {
        dip.value = withSequence(withTiming(1, timing.instant), withSpring(0, spring.press));
      }
    }
    if (!refuse) setLit(true);
    timers.push(setTimeout(notify, stamp ? HOLD_MS : DRAW.duration + timing.fast.duration));
    return () => timers.forEach(clearTimeout);
    // The choreography runs once per landing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [go]);

  const sealStyle = useAnimatedStyle(() => ({
    opacity: land.value,
    transform: [{ scale: press.value }, { rotate: stamp ? "-10deg" : "0deg" }],
  }));
  const objectStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - dip.value * 0.03 }, { translateX: flicker.value * 4 }],
  }));
  const glyphProps = useAnimatedProps(() => ({
    strokeDashoffset: (1 - draw.value) * (refuse ? CROSS_LEN : CHECK_LEN),
  }));

  const label = typeof title === "string" ? title : t.label;
  const seal = (
    <Animated.View
      pointerEvents="none"
      accessible={!stamp}
      accessibilityRole={stamp ? undefined : "image"}
      accessibilityLabel={stamp ? undefined : label}
      style={[{ width: px, height: px }, sealStyle]}
    >
      <Svg width={px} height={px} viewBox={`0 0 ${VIEW} ${VIEW}`}>
        <Path d={SEAL_D} fill={fill} />
        <AnimatedPath
          d={refuse ? CROSS_PATH : CHECK_PATH}
          fill="none"
          stroke={glyph}
          strokeWidth={14}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={refuse ? CROSS_LEN : CHECK_LEN}
          animatedProps={glyphProps}
        />
      </Svg>
    </Animated.View>
  );

  if (stamp) {
    return (
      <View ref={ref} className={cn("w-full", className)} accessibilityLabel={on ? label : undefined} {...props}>
        <LightPool on={lit && on} color={fill} size={360} strength={0.32} className="absolute -left-10 -top-16" />
        <Animated.View style={objectStyle}>
          <View style={{ borderRadius: radius, overflow: "hidden" }}>
            {children}
          </View>
        </Animated.View>
        {on ? <View className="absolute -right-3 -top-4">{seal}</View> : null}
      </View>
    );
  }

  return (
    <View ref={ref} className={cn("items-center", className)} {...props}>
      <View className="items-center justify-center" style={{ width: px * 2, height: px * 1.4 }}>
        <LightPool on={lit && !refuse} color={fill} size={px * 2.6} strength={0.34} className="absolute self-center" />
        <Animated.View style={objectStyle}>{seal}</Animated.View>
      </View>
      {title != null || description != null ? (
        <View className="mt-2 max-w-[320px] items-center gap-1.5 px-4">
          {title != null ? (
            <Text
              className={titleVariants({ size })}
              style={{ fontVariant: ["tabular-nums"] }}
              accessibilityRole="header"
              accessibilityLiveRegion="polite"
            >
              {title}
            </Text>
          ) : null}
          {description != null ? (
            <Text className="text-center text-base leading-snug text-muted-foreground" style={{ fontVariant: ["tabular-nums"] }}>
              {description}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
});

SuccessSeal.displayName = "SuccessSeal";
