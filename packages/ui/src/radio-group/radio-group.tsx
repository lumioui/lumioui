import * as React from "react";
import { createContext, forwardRef, useContext } from "react";
import { View, Pressable, Text, type ViewProps, type PressableProps, type GestureResponderEvent } from "react-native";
import Animated, {
  Easing,
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming,
  interpolateColor,
} from "react-native-reanimated";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import { cn, ease, useHaptic, useReducedMotion, usePressAnimation, useTheme, spring, timing, AnimatedPressable } from "@lumioui/core";
import { Icon, type IconName } from "../icon";

interface RadioGroupCtx {
  value: string;
  onValueChange: (v: string) => void;
  disabled?: boolean;
}
const Ctx = createContext<RadioGroupCtx | null>(null);

export interface RadioGroupProps extends ViewProps {
  /** Controlled value. Omit with defaultValue for uncontrolled use. */
  value?: string;
  /** Uncontrolled initial value. */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

// Radio switch-on: each ring owns its dot. Picking an option ignites its dot
// (opacity on timing.fast, scale 0.4 → 1 on spring.pop — the pick landing is
// a spark) while the previous dot dims in place. Light doesn't travel
// between rings. Ring colour shifts on timing.fast alongside.
const RING = 24;
const DOT = 12;
/** The dot sparks up from a small core of light. */
const DOT_FROM = 0.4;
/** The ring dips like a checkbox while pressed — a small control needs depth. */
const RING_PRESSED = 0.94;
const IGNITE = { duration: timing.fast.duration, easing: Easing.bezier(...ease.out) };
const DIM = { duration: timing.recede.duration, easing: Easing.bezier(...ease.in) };

// The dot is a light source that lights its row: on pick a pool of accent
// light brightens behind the ring over timing.fast, then settles over
// timing.slow. A card row keeps it faintly lit (the evidence of the pick);
// a plain row lets it go out so a bare list rests exactly as before.
/** Pool diameter — a card row's ring lights most of its own row. */
const POOL = 120;
/** Plain rows have no surface to hold the light, so the pool stays small. */
const POOL_PLAIN = 88;
/** Peak alpha at the pool's centre. */
const POOL_PEAK = 0.18;
/** Resting share of the peak on a picked card row (0.08 of 0.18). */
const POOL_REST = 0.44;
const SETTLE = { duration: timing.slow.duration, easing: Easing.bezier(...ease.inOut) };
/** The picked card takes a faint accent wash — selected reads as lit. */
const CARD_WASH = 0.06;
const SHIFT = { duration: timing.normal.duration, easing: Easing.bezier(...ease.inOut) };

/** RadioGroup — controlled or uncontrolled group; the picked ring's dot ignites, with a selection haptic. */
export const RadioGroup = forwardRef<React.ElementRef<typeof View>, RadioGroupProps>(
  function RadioGroup({ value, defaultValue, onValueChange, disabled, className, children, accessibilityLabel, ...props }, ref) {
    const [internal, setInternal] = React.useState(defaultValue ?? value ?? "");
    // Active value resolves during render — never in a passive effect.
    const active = value ?? internal;
    const handleChange = React.useCallback(
      (v: string) => {
        if (value === undefined) setInternal(v);
        onValueChange?.(v);
      },
      [value, onValueChange]
    );

    return (
      <Ctx.Provider value={{ value: active, onValueChange: handleChange, disabled }}>
        <View
          ref={ref}
          className={cn("w-full gap-3", className)}
          accessibilityRole="radiogroup"
          accessibilityLabel={accessibilityLabel ?? "Radio group"}
          {...props}
        >
          {children}
        </View>
      </Ctx.Provider>
    );
  }
);

export interface RadioGroupItemProps extends Omit<PressableProps, "children"> {
  value: string;
  label?: string;
  /** Leading icon in the option row. */
  icon?: IconName;
  /** Secondary text under the label. */
  subtitle?: string;
  /** Custom leading node (brand mark, colour tile, artwork). Wins over `icon`. */
  leading?: React.ReactNode;
  /** Trailing node on the row's right edge (price, badge). */
  trailing?: React.ReactNode;
  /** Put the ring on the trailing edge instead of the leading one — a
   *  settings-list layout where the row content leads and the control follows. */
  indicatorPosition?: "leading" | "trailing";
  disabled?: boolean;
  className?: string;
  /** Custom content rendered next to the ring when `label` is absent. */
  children?: React.ReactNode;
  /** "card" draws the option as a bordered row whose border and accent wash
   *  crossfade on pick and whose ring keeps a faint light. Default "plain". */
  surface?: "plain" | "card";
}

/** The ring's light — a soft accent radial behind the dot. Decoration only. */
function RingLight({ size, opacityStyle, color, id }: { size: number; opacityStyle: object; color: string; id: string }) {
  return (
    <Animated.View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ position: "absolute", width: size, height: size, left: (RING - size) / 2, top: (RING - size) / 2 }, opacityStyle]}
    >
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" r="50%">
            <Stop offset={0} stopColor={color} stopOpacity={POOL_PEAK} />
            <Stop offset={0.5} stopColor={color} stopOpacity={POOL_PEAK * 0.35} />
            <Stop offset={1} stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width={size} height={size} fill={`url(#${id})`} />
      </Svg>
    </Animated.View>
  );
}

export const RadioGroupItem = forwardRef<React.ElementRef<typeof Pressable>, RadioGroupItemProps>(
  function RadioGroupItem({ value, label, icon, subtitle, leading, trailing, indicatorPosition = "leading", surface = "plain", disabled, className, children, onPress, onPressIn, onPressOut, ...props }, ref) {
    const ctx = useContext(Ctx);
    if (!ctx) throw new Error("RadioGroupItem must be inside RadioGroup");
    const { colors } = useTheme();
    const haptics = useHaptic();
    const selected = ctx.value === value;
    const isDisabled = disabled || ctx.disabled;
    const reducedMotion = useReducedMotion();
    const ring = useSharedValue(selected ? 1 : 0);
    const dotLight = useSharedValue(selected ? 1 : 0);
    const dotScale = useSharedValue(1);
    const card = surface === "card";
    // Pool light (0–1 of the peak). A picked card mounts already lit at rest.
    const pool = useSharedValue(selected && card ? POOL_REST : 0);
    // Card border + wash crossfade, 0 → 1 as the row is picked.
    const lit = useSharedValue(selected ? 1 : 0);
    const gradientId = React.useId().replace(/[^a-zA-Z0-9]/g, "");
    // Row press feedback — opacity dip only (scale 1 keeps the row stable).
    const press = usePressAnimation({ pressedScale: 1, pressedOpacity: 0.6 });
    // Ring press — the control itself dips while the row stays put, so the
    // press reads on the thing being toggled.
    const ringPress = useSharedValue(1);

    // Only real changes animate — mount shows the resting state.
    const shown = React.useRef(selected);
    React.useEffect(() => {
      if (shown.current === selected) return;
      shown.current = selected;
      ring.value = withTiming(selected ? 1 : 0, timing.fast);
      lit.value = withTiming(selected ? 1 : 0, SHIFT);
      if (selected) {
        dotLight.value = withTiming(1, IGNITE);
        // Light before the dot lands: the pool brightens, then settles.
        pool.value = withSequence(withTiming(1, IGNITE), withTiming(card ? POOL_REST : 0, SETTLE));
        if (reducedMotion) {
          dotScale.value = 1;
        } else {
          dotScale.value = DOT_FROM;
          dotScale.value = withSpring(1, spring.pop);
        }
      } else {
        // Dims where it sits — no shrink, no travel.
        dotLight.value = withTiming(0, DIM);
        pool.value = withTiming(0, DIM);
      }
    }, [selected, ring, dotLight, dotScale, pool, lit, card, reducedMotion]);

  // Unselected ring takes mutedForeground — `input` is a hairline tone that
  // falls under 3:1 against cards.
  const ringStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(ring.value, [0, 1], [colors.mutedForeground, colors.primary]),
    transform: [{ scale: ringPress.value }],
  }));
  const dotStyle = useAnimatedStyle(() => ({
    opacity: dotLight.value,
    transform: [{ scale: dotScale.value }],
  }));
  const poolStyle = useAnimatedStyle(() => ({ opacity: pool.value }));
  const cardStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(lit.value, [0, 1], [colors.border, colors.primary]),
  }));
  const washStyle = useAnimatedStyle(() => ({ opacity: lit.value * CARD_WASH }));

  const ringNode = (
    <View style={{ width: RING, height: RING }}>
      <RingLight size={card ? POOL : POOL_PLAIN} opacityStyle={poolStyle} color={colors.primary} id={gradientId} />
      <Animated.View
        style={[
          {
            width: RING,
            height: RING,
            borderRadius: RING / 2,
            borderWidth: 2,
            alignItems: "center",
            justifyContent: "center",
          },
          ringStyle,
        ]}
      >
        <Animated.View
          pointerEvents="none"
          style={[{ width: DOT, height: DOT, borderRadius: DOT / 2, backgroundColor: colors.primary }, dotStyle]}
        />
      </Animated.View>
    </View>
  );

  return (
    <AnimatedPressable
      ref={ref}
      // The press style owns `opacity`, so a className opacity-50 would be
      // overridden — disabled rows take a static dim instead.
      style={[isDisabled ? { opacity: 0.5 } : press.animatedStyle, card ? { borderWidth: 2 } : null, card ? cardStyle : null]}
      className={cn(
        "min-h-11 w-full flex-row items-center gap-3",
        card && "overflow-hidden rounded-2xl px-4 py-3",
        className
      )}
      disabled={isDisabled}
      onPressIn={(e) => {
        press.onPressIn();
        if (!reducedMotion) ringPress.value = withSpring(RING_PRESSED, spring.press);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        press.onPressOut();
        if (!reducedMotion) ringPress.value = withSpring(1, spring.press);
        onPressOut?.(e);
      }}
      onPress={(e: GestureResponderEvent) => {
        haptics.selection();
        ctx.onValueChange(value);
        onPress?.(e);
      }}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, disabled: isDisabled }}
      // accessibilityState isn't forwarded to the DOM on web — mirror it.
      aria-checked={selected}
      aria-disabled={isDisabled ?? false}
      accessibilityLabel={label ?? value}
      hitSlop={10}
      {...props}
    >
      {card ? (
        <Animated.View
          pointerEvents="none"
          style={[{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.primary }, washStyle]}
        />
      ) : null}
      {indicatorPosition === "leading" ? ringNode : null}
      {leading ?? (icon ? (
        <View className="h-8 w-8 items-center justify-center rounded-lg bg-muted">
          <Icon name={icon} size="sm" color="foreground" />
        </View>
      ) : null)}
      {label ? (
        <View className="min-w-0 flex-1 gap-0.5">
          <Text className="text-base text-foreground" numberOfLines={1}>{label}</Text>
          {subtitle ? (
            <Text className="text-sm text-muted-foreground" numberOfLines={1}>{subtitle}</Text>
          ) : null}
        </View>
      ) : children}
      {trailing}
      {indicatorPosition === "trailing" ? ringNode : null}
    </AnimatedPressable>
  );
  }
);

RadioGroup.displayName = "RadioGroup";
RadioGroupItem.displayName = "RadioGroupItem";
