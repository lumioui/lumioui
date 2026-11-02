import * as React from "react";
import { forwardRef } from "react";
import { Pressable, View, type GestureResponderEvent, type LayoutChangeEvent, type PressableProps } from "react-native";
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import {
  AnimatedPressable,
  cn,
  createVariant,
  ease,
  spring,
  timing,
  useHaptic,
  usePressAnimation,
  useReducedMotion,
  useTheme,
} from "@lumioui/core";
import { Glass } from "../glass";
import { Switch } from "../switch";

export interface ToggleProps extends Omit<PressableProps, "onPress" | "children" | "style"> {
  /** Controlled pressed/checked state. Omit with defaultPressed for
   *  uncontrolled use. */
  pressed?: boolean;
  /** Initial pressed state (uncontrolled). Default false. */
  defaultPressed?: boolean;
  /** Called when the user toggles. */
  onPressedChange?: (pressed: boolean) => void;
  /** Toggle style — "button" renders a pill toggle, "switch" renders a Switch. */
  style?: "button" | "switch";
  /** Glass pill (button style only). */
  glass?: boolean;
  /** Haptic feedback. Default "selection". Set false to disable. */
  haptic?: "selection" | "light" | false;
  /** Icon rendered before the label (button style only). */
  icon?: React.ReactNode;
  /**
   * Icon in its "on" ink (button style only). When given, it crossfades
   * over `icon` as the fill covers the pill, so the glyph's ink follows
   * the light instead of flipping before it arrives.
   */
  iconOn?: React.ReactNode;
  /** Extra classes for the label. */
  textClassName?: string;
  /** Extra classes for the container. */
  className?: string;
  /** Optional label text. In switch style, renders to the left of the switch. */
  children?: React.ReactNode;
  /** Disable interaction. A tap flickers and warns. */
  disabled?: boolean;
}

const toggleVariants = createVariant({
  // Colour rides the ink fill layer below — the container keeps a constant
  // secondary bg, and overflow-hidden clips the fill to the pill.
  // min-h-[44px] keeps the whole pill inside the 44pt touch-target floor.
  base: "flex-row min-h-[44px] items-center justify-center rounded-full px-4 py-2.5 gap-2 bg-secondary overflow-hidden",
  variants: {
    pressed: {
      true: "",
      false: "",
    },
  },
  defaultVariants: { pressed: "false" },
});

const toggleTextVariants = createVariant({
  // Text colour follows fill coverage (see textStyle) — the variant only
  // carries typography so the ink never snaps.
  base: "text-base font-medium text-secondary-foreground",
  variants: {
    pressed: {
      true: "",
      false: "",
    },
  },
  defaultVariants: { pressed: "false" },
});

/** Disabled flicker — one kick this far, released into spring.shake. */
const FLICKER_KICK = 4;
/** Reduced-motion flicker — an opacity dip instead of travel. */
const FLICKER_DIM = 0.6;
/** The fill ignites from the touch at this share of its full size, so the
 *  first frame already reads as a lamp switching on, not a growing dot. */
const FILL_SEED = 0.12;

/**
 * Toggle — a two-state control.
 *
 * - `style="switch"` (default): delegates to `Switch`. If `children` is a
 *   string it renders as the label to the left.
 *
 * - `style="button"`: a pill that switches on like a lamp — the ink fill
 *   grows out of the point you pressed (a clipped circle on `spring.swap`
 *   while it ignites over `timing.fast`), and the label and icon ink follow
 *   the fill's coverage on the UI thread. Off dims the fill in place in
 *   120ms. No overshoot. A tap while disabled flickers once and warns.
 */
export const Toggle = forwardRef<React.ElementRef<typeof Pressable>, ToggleProps>(
  function Toggle(
    {
      pressed,
      defaultPressed = false,
      onPressedChange,
      style: toggleStyle = "switch",
      glass = false,
      haptic = "selection",
      icon,
      iconOn,
      textClassName,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) {
    // Hooks run before the style branch — `style` can change between
    // renders, and an early return would break hook ordering.
    const haptics = useHaptic();
    const press = usePressAnimation({ pressedScale: 0.94 });
    const reduceMotion = useReducedMotion();
    const { colors } = useTheme();

    // Resolve pressed during render — controlled wins, else internal state.
    const isControlled = pressed !== undefined;
    const [internalPressed, setInternalPressed] = React.useState(defaultPressed);
    const isOn = isControlled ? pressed : internalPressed;

    // Fill: lit (opacity) and reach (circle scale, 0–1), grown from origin.
    const lit = useSharedValue(isOn ? 1 : 0);
    const reach = useSharedValue(isOn ? 1 : 0);
    const kick = useSharedValue(0);
    const dip = useSharedValue(1);
    const [box, setBox] = React.useState({ w: 0, h: 0 });
    // Where the light starts — the press point, else the pill's centre.
    const [seed, setSeed] = React.useState<{ x: number; y: number } | null>(null);

    const firstRender = React.useRef(true);
    React.useEffect(() => {
      if (firstRender.current) {
        firstRender.current = false;
        return;
      }
      if (isOn) {
        lit.value = withTiming(1, { ...timing.fast, easing: Easing.bezier(...ease.out) });
        if (reduceMotion) reach.value = 1;
        else {
          reach.value = FILL_SEED;
          reach.value = withSpring(1, spring.swap);
        }
      } else {
        // Off dims in place — the circle keeps its size while the light goes.
        lit.value = withTiming(0, { ...timing.recede, easing: Easing.bezier(...ease.in) });
      }
    }, [isOn, lit, reach, reduceMotion]);

    // Circle big enough to cover the pill from the seed point.
    const sx = seed?.x ?? box.w / 2;
    const sy = seed?.y ?? box.h / 2;
    const radius = Math.hypot(Math.max(sx, box.w - sx), Math.max(sy, box.h - sy));
    const diameter = Math.max(1, radius * 2);

    const containerAnim = useAnimatedStyle(() => ({
      opacity: dip.value,
      transform: [{ translateX: kick.value }, { scale: press.scale.value }],
    }));
    const fillStyle = useAnimatedStyle(() => ({
      opacity: lit.value,
      transform: [{ scale: reach.value }],
    }));
    // Coverage — how much of the pill the light owns right now.
    const textStyle = useAnimatedStyle(() => ({
      color: interpolateColor(
        lit.value * reach.value,
        [0, 1],
        [colors.secondaryForeground, colors.primaryForeground]
      ),
    }));
    const iconOffStyle = useAnimatedStyle(() => ({ opacity: 1 - lit.value * reach.value }));
    const iconOnStyle = useAnimatedStyle(() => ({ opacity: lit.value * reach.value }));

    // --- Switch style (default) ---
    if (toggleStyle === "switch") {
      return (
        <Switch
          ref={ref}
          checked={isOn}
          onCheckedChange={(next) => {
            if (!isControlled) setInternalPressed(next);
            onPressedChange?.(next);
          }}
          disabled={disabled}
          haptic={haptic}
          label={typeof children === "string" ? children : undefined}
          className={className}
          {...props}
        />
      );
    }

    // --- Button style ---
    const pressedKey = isOn ? "true" : ("false" as const);

    const flicker = () => {
      haptics.warning();
      if (reduceMotion) {
        dip.value = FLICKER_DIM;
        dip.value = withTiming(1, timing.normal);
        return;
      }
      kick.value = FLICKER_KICK;
      kick.value = withSpring(0, spring.shake);
    };

    const handlePress = () => {
      if (disabled) {
        flicker();
        return;
      }
      if (haptic) haptics[haptic === "selection" ? "selection" : "light"]();
      if (!isControlled) setInternalPressed(!isOn);
      onPressedChange?.(!isOn);
    };

    const handlePressIn = (e: GestureResponderEvent) => {
      // Seed only while off: a lit pill is fully covered from any point, so
      // moving the seed then is invisible.
      if (!isOn) setSeed({ x: e.nativeEvent.locationX, y: e.nativeEvent.locationY });
      if (!disabled) press.onPressIn();
    };
    const handlePressOut = () => {
      press.onPressOut();
    };
    const onLayout = (e: LayoutChangeEvent) => {
      const { width, height } = e.nativeEvent.layout;
      if (width !== box.w || height !== box.h) setBox({ w: width, h: height });
    };

    const hasOnIcon = icon != null && iconOn != null;

    return (
      <AnimatedPressable
        ref={ref}
        // Deliberately not `disabled` — a tap on a disabled toggle must still
        // land so it can flicker. a11y reports disabled below.
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onLayout={onLayout}
        style={containerAnim}
        className={cn(
          toggleVariants({ pressed: pressedKey }),
          glass && "bg-transparent",
          disabled && "opacity-50",
          className
        )}
        accessibilityRole="button"
        accessibilityState={{ selected: isOn, disabled: disabled ?? false }}
        // accessibilityState isn't forwarded to the DOM on web — mirror it.
        // role=button takes aria-pressed; checkbox/radio callers (e.g.
        // ToggleGroupItem) take aria-checked instead.
        aria-pressed={
          props.accessibilityRole == null || props.accessibilityRole === "button"
            ? isOn
            : undefined
        }
        aria-checked={
          props.accessibilityRole === "checkbox" || props.accessibilityRole === "radio"
            ? isOn
            : undefined
        }
        aria-disabled={disabled ?? false}
        accessibilityLabel={typeof children === "string" ? children : props.accessibilityLabel}
        hitSlop={6}
        {...props}
      >
        {glass ? (
          <Glass
            effect="regular"
            sheen={0.5}
            className="absolute inset-0 rounded-full"
            pointerEvents="none"
          />
        ) : null}
        {/* Ink fill — a circle of light grown from the press point. */}
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: "absolute",
              left: sx - diameter / 2,
              top: sy - diameter / 2,
              width: diameter,
              height: diameter,
              borderRadius: diameter / 2,
              backgroundColor: colors.primary,
            },
            fillStyle,
          ]}
        />
        {/* Content takes no touches, so press points are always measured
            against the pill itself. */}
        <View pointerEvents="none" className="flex-row items-center justify-center gap-2">
          {hasOnIcon ? (
            <View>
              <Animated.View style={iconOffStyle}>{icon}</Animated.View>
              <Animated.View style={[{ position: "absolute", top: 0, left: 0 }, iconOnStyle]}>{iconOn}</Animated.View>
            </View>
          ) : (
            icon
          )}
          {typeof children === "string" ? (
            <Animated.Text
              style={textStyle}
              className={cn(toggleTextVariants({ pressed: pressedKey }), textClassName)}
            >
              {children}
            </Animated.Text>
          ) : (
            children
          )}
        </View>
      </AnimatedPressable>
    );
  }
);

Toggle.displayName = "Toggle";

