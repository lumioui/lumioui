import * as React from "react";
import { forwardRef } from "react";
import { Pressable, Text, View, type PressableProps, type GestureResponderEvent } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  Easing,
  withDelay,
  withTiming,
  interpolateColor,
} from "react-native-reanimated";
import Svg from "react-native-svg";
import { cn, ease, useHaptic, usePressAnimation, useTheme, useReducedMotion, timing, AnimatedPath } from "@lumioui/core";
import { Icon, type IconName } from "../icon";

/** Lumio check on the 24 grid — short stroke, long stroke (length ≈17.7). */
const CHECK_PATH = "M6 12.5l4 4 8-9";
const CHECK_LEN = 18;
/** Indeterminate dash (length 10). */
const DASH_PATH = "M7 12h10";
const DASH_LEN = 10;
// Checking: the fill ignites over 120ms while the mark draws over 240ms on
// the ignite curve — both start on the tap, no beat. Clearing dims the
// mark and the fill together; the mark is never un-drawn.
const IGNITE = Easing.bezier(...ease.out);
const FILL_IGNITE = { duration: timing.recede.duration, easing: IGNITE };
const CHECK_DRAW = { duration: 240, easing: IGNITE };
/** The dash is ~half the check's length — it draws in proportion. */
const DASH_DRAW = { duration: timing.fast.duration, easing: IGNITE };
const DIM = { duration: timing.recede.duration, easing: Easing.bezier(...ease.in) };
/** The strike starts once the check is under way — the mark leads, the label follows. */
const STRIKE_AFTER = timing.recede.duration;

export interface CheckboxProps extends Omit<PressableProps, "onPress" | "children"> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** Renders a dash instead of a check (partial selection). Implies the filled state. */
  indeterminate?: boolean;
  /** Text label rendered beside the box — tapping it toggles too, and the
   *  box announces it via accessibilityLabelledBy/aria-labelledby. */
  label?: string;
  /** Leading icon rendered between the box and the label. */
  icon?: IconName;
  /** Secondary text under the label. */
  subtitle?: string;
  /** Custom leading node between the box and the label (brand mark, colour
   *  tile, avatar). Wins over `icon`. */
  leading?: React.ReactNode;
  /** Trailing node pinned to the row's right edge (price, count, badge).
   *  Only rendered with `label`. */
  trailing?: React.ReactNode;
  /** Strike the label through and mute it while checked — task-list idiom. */
  strikeWhenChecked?: boolean;
  disabled?: boolean;
  className?: string;
}

/** Checkbox — fill ignites while the check draws on, indeterminate dash, press dip, haptic. */
export const Checkbox = forwardRef<React.ElementRef<typeof Pressable>, CheckboxProps>(
  function Checkbox({ checked, onCheckedChange, indeterminate = false, label, icon, subtitle, leading, trailing, strikeWhenChecked = false, disabled, className, ...props }, ref) {
    const { colors } = useTheme();
    const haptics = useHaptic();
    const reducedMotion = useReducedMotion();
    const active = checked || indeterminate;
    // Label association — the rendered text carries a nativeID the
    // Pressable points back to (accessibilityLabelledBy / aria-labelledby).
    const autoId = React.useId();
    const labelId = `${autoId}-label`;

    const press = usePressAnimation({ pressedScale: 0.94 });
    /** 0 → mark hidden, 1 → mark fully drawn. */
    const draw = useSharedValue(active ? 1 : 0);
    /** Mark opacity — clearing dims it so the stroke is never un-drawn. */
    const markO = useSharedValue(active ? 1 : 0);
    /** 0 → empty box, 1 → filled box. Drives the fill + border crossfade so
     *  the check lands on a surface that's already arriving, not snapping. */
    const fill = useSharedValue(active ? 1 : 0);
    /** The label strike: drawn across from the left a beat after the check, never un-drawn. */
    const struck = strikeWhenChecked && checked;
    const strike = useSharedValue(struck ? 1 : 0);
    const strikeO = useSharedValue(struck ? 1 : 0);

    // Only animate real changes — mount (and a strict-mode re-run) shows the
    // resting state, so already-checked rows don't all draw on at once.
    const shownRef = React.useRef({ active, indeterminate });
    React.useEffect(() => {
      const prev = shownRef.current;
      if (prev.active === active && prev.indeterminate === indeterminate) return;
      shownRef.current = { active, indeterminate };
      if (reducedMotion) {
        // Opacity and colour only — the mark appears whole.
        draw.value = 1;
        markO.value = withTiming(active ? 1 : 0, active ? FILL_IGNITE : DIM);
        fill.value = withTiming(active ? 1 : 0, active ? FILL_IGNITE : DIM);
        return;
      }
      if (active) {
        // The fill ignites fast so the mark draws onto a lit surface.
        // Fresh draw each time — including check ↔ dash swaps.
        fill.value = withTiming(1, FILL_IGNITE);
        markO.value = 1;
        draw.value = 0;
        draw.value = withTiming(1, indeterminate ? DASH_DRAW : CHECK_DRAW);
      } else {
        fill.value = withTiming(0, DIM);
        markO.value = withTiming(0, DIM);
      }
    }, [active, indeterminate, draw, markO, fill, reducedMotion]);

    // The task performs the action: the check lands, then a strike draws
    // across the label and the label dims. Clearing dims the strike away.
    const struckRef = React.useRef(struck);
    React.useEffect(() => {
      if (struckRef.current === struck) return;
      struckRef.current = struck;
      if (!struck) {
        strikeO.value = withTiming(0, DIM);
        return;
      }
      strikeO.value = 1;
      if (reducedMotion) {
        strike.value = 1;
        return;
      }
      strike.value = 0;
      strike.value = withDelay(STRIKE_AFTER, withTiming(1, CHECK_DRAW));
    }, [struck, strike, strikeO, reducedMotion]);
    const strikeStyle = useAnimatedStyle(() => ({
      opacity: strikeO.value,
      transform: [{ scaleX: Math.max(0.0001, strike.value) }],
    }));
    // A done task dims as a whole (title and subtitle together) so the
    // secondary line never ends up louder than the struck title.
    const labelStyle = useAnimatedStyle(() => ({ opacity: 1 - 0.45 * strike.value * strikeO.value }));

    const boxStyle = useAnimatedStyle(() => ({
      transform: [{ scale: press.scale.value }],
      // Empty box takes mutedForeground — `muted` is a fill tone and
      // vanished against cards.
      // No coloured shadow: depth is never a glow.
      borderColor: interpolateColor(fill.value, [0, 1], [colors.mutedForeground, colors.primary]),
    }));

    // Primary fill lives on its own layer so it can fade in — interpolating
    // a backgroundColor to "transparent" muddies the midpoint.
    const fillStyle = useAnimatedStyle(() => ({
      opacity: fill.value,
    }));

    const markStyle = useAnimatedStyle(() => ({
      opacity: markO.value,
    }));

    const markLen = indeterminate ? DASH_LEN : CHECK_LEN;
    const pathProps = useAnimatedProps(() => ({
      strokeDashoffset: (1 - draw.value) * markLen,
    }));

    const handlePress = (_e: GestureResponderEvent) => {
      haptics.selection();
      onCheckedChange(!checked);
    };

    return (
      <Pressable
        ref={ref}
        disabled={disabled}
        onPress={handlePress}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        className={cn(label != null && "flex-row items-center gap-3", disabled && "opacity-50", className)}

        accessibilityRole="checkbox"
        accessibilityLabel={label ?? props.accessibilityLabel}
        accessibilityLabelledBy={label != null ? labelId : undefined}
        aria-labelledby={label != null ? labelId : undefined}
        accessibilityState={{ checked: indeterminate ? "mixed" : checked, disabled }}
        // accessibilityState isn't forwarded to the DOM on web — mirror it
        // with explicit aria-* props like Switch/Toggle do.
        aria-checked={indeterminate ? "mixed" : checked}
        aria-disabled={disabled ?? false}
        hitSlop={10}
        {...props}
        // minHeight in style, not a class: it must hold on the outer box
        // whatever padding the caller adds, so a bare label is never under 44.
        // Merged after the spread so a caller's style keeps it.
        style={
          typeof props.style === "function"
            ? props.style
            : [label != null ? { minHeight: 44 } : null, props.style]
        }
      >
        <Animated.View
          style={[{ width: 24, height: 24, borderRadius: 6, borderWidth: 2 }, boxStyle]}
          className="items-center justify-center"
        >
          {/* Fill layer — fades in beneath the mark */}
          <Animated.View
            pointerEvents="none"
            style={[
              // Covers the border too, so the filled box has no light seam
              // where the fill's edge would meet the border's inner edge.
              { position: "absolute", top: -2, left: -2, right: -2, bottom: -2, borderRadius: 6, backgroundColor: colors.primary },
              fillStyle,
            ]}
          />
          <Animated.View style={markStyle}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <AnimatedPath
                d={indeterminate ? DASH_PATH : CHECK_PATH}
                stroke={colors.primaryForeground}
                strokeWidth={3.2}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={markLen}
                animatedProps={pathProps}
              />
            </Svg>
          </Animated.View>
        </Animated.View>
        {leading ?? (icon ? (
          <View className="h-8 w-8 items-center justify-center rounded-lg bg-muted">
            <Icon name={icon} size="sm" color="foreground" />
          </View>
        ) : null)}
        {label != null ? (
          <Animated.View style={labelStyle} className="min-w-0 shrink gap-0.5">
            <View className="self-start">
              <Text nativeID={labelId} className="text-base text-foreground" numberOfLines={2}>
                {label}
              </Text>
              {strikeWhenChecked ? (
                <Animated.View
                  pointerEvents="none"
                  style={[{ transformOrigin: "left", top: "50%" }, strikeStyle]}
                  className="absolute inset-x-0 h-[2px] rounded-full bg-muted-foreground"
                />
              ) : null}
            </View>
            {subtitle ? (
              <Text className="text-sm text-muted-foreground" numberOfLines={1}>{subtitle}</Text>
            ) : null}
          </Animated.View>
        ) : null}
        {label != null && trailing != null ? <View className="ml-auto pl-3">{trailing}</View> : null}
      </Pressable>
    );
  }
);

Checkbox.displayName = "Checkbox";
