import * as React from "react";
import { forwardRef } from "react";
import { Pressable, Text, View, type PressableProps, type GestureResponderEvent } from "react-native";
import Animated, {
  Easing,
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { AnimatedPressable, cn, createVariant, ease, useAsyncPress, useHaptic, usePressAnimation, useReducedMotion, spring, timing, } from "@lumioui/core";

/** Selection is light: the fill switches on fast and dims faster (§5c rule 6). */
const FILL_ON = { ...timing.fast, easing: Easing.bezier(...ease.out) };
const FILL_OFF = { ...timing.recede, easing: Easing.bezier(...ease.in) };
/** The chip settles from a hair under size as its fill ignites — no overshoot on chrome. */
const IGNITE_FROM = 0.96;
import { Icon } from "../icon";
import { Glass } from "../glass";

const chipVariants = createVariant({
  base: "flex-row items-center rounded-full",
  variants: {
    variant: {
      assist: "bg-secondary",
      // Same depth language as a list card: a white pill on the grey canvas
      // (light), a lit surface (dark). No hairline, which sat under 3:1.
      filter: "bg-card dark:bg-secondary",
      input: "bg-card border border-input",
      suggestion: "bg-accent",
      glass: "",
    },
    // Selected = solid ink (or the scoped <Accent>) — the filter-chip
    // idiom. A 10% tint on a hairline read as "almost selected".
    selected: {
      // The fill itself is a layer that switches on (see `fillStyle`).
      true: "",
      false: "",
    },
    // Fixed heights so chips align with 36/44 controls: sm 32, md 36.
    size: {
      sm: "h-8 px-3 gap-1",
      md: "h-9 px-3.5 gap-1.5",
    },
  },
  defaultVariants: { variant: "assist", selected: "false", size: "md" },
});

const chipTextVariants = createVariant({
  base: "font-medium",
  variants: {
    variant: {
      assist: "text-secondary-foreground",
      filter: "text-foreground",
      input: "text-foreground",
      suggestion: "text-accent-foreground",
      glass: "text-foreground",
    },
    selected: {
      true: "text-primary-foreground",
      false: "",
    },
    size: {
      sm: "text-[13px]",
      md: "text-[15px]",
    },
  },
  defaultVariants: { variant: "assist", selected: "false", size: "md" },
});

export interface ChipProps extends Omit<PressableProps, "children" | "onPress"> {
  /** Chip visual intent — "glass" renders a glass pill. */
  variant?: "assist" | "filter" | "input" | "suggestion" | "glass";
  /** Density preset — "sm" for dense rails (filters, metadata tags). */
  size?: "sm" | "md";
  /** Controlled selected / active state. Omit for uncontrolled use with
   *  `defaultSelected`/`onSelectedChange`. */
  selected?: boolean;
  /** Initial selected state for uncontrolled use. Chips that opt into
   *  uncontrolled selection (via this prop or `onSelectedChange`) toggle
   *  themselves on press; plain action chips keep their current behavior. */
  defaultSelected?: boolean;
  /** Called when the user toggles selection. In controlled mode this is the
   *  change intent; in uncontrolled mode it also fires after the internal
   *  state flips. */
  onSelectedChange?: (selected: boolean) => void;
  /** Called on press. May return a Promise — when `asyncTracking` is on the
   *  chip enters its loading state until the promise resolves. */
  onPress?: (e: GestureResponderEvent) => void | Promise<unknown>;
  /** Delete handler — shows a trailing × button. */
  onDelete?: () => void;
  /** Leading icon or avatar. */
  icon?: React.ReactNode;
  /** Extra classes for the label. */
  textClassName?: string;
  /** Extra classes for the container. */
  className?: string;
  /** Extra classes for the container applied only while `selected` — the
   *  escape hatch for accent-idiom fills (e.g. a lime pill on a dark canvas)
   *  that the primary-tinted selected variant can't express. */
  selectedClassName?: string;
  /** Extra classes for the label applied only while `selected`. */
  selectedTextClassName?: string;
  /** Auto-track async onPress — when onPress returns a Promise, the chip
   *  automatically enters loading state until it resolves. Default true. */
  asyncTracking?: boolean;
  children?: React.ReactNode;
}

// Animated.View is cssInterop-registered via @lumioui/core/styled

/** Chip — assist/filter/input/suggestion with press animation and haptics. */
export const Chip = forwardRef<React.ElementRef<typeof Pressable>, ChipProps>(
  function Chip(
    {
      variant = "assist",
      size = "md",
      selected,
      defaultSelected,
      onSelectedChange,
      onDelete,
      icon,
      textClassName,
      className,
      selectedClassName,
      selectedTextClassName,
      onPress,
      disabled,
      asyncTracking = true,
      children,
      ...props
    },
    ref
  ) {
    const haptics = useHaptic();
    const press = usePressAnimation({ pressedScale: 0.96 });
    // The × is a small nested target — deeper dip + opacity so the touch reads.
    const deletePress = usePressAnimation({ pressedScale: 0.8, pressedOpacity: 0.5 });
    const reduceMotion = useReducedMotion();
    // Controlled when `selected` is passed; uncontrolled selection only kicks
    // in when the consumer opts in (defaultSelected/onSelectedChange) so plain
    // action chips never self-highlight.
    const isControlled = selected !== undefined;
    const isSelectable = defaultSelected !== undefined || onSelectedChange !== undefined;
    const [internalSelected, setInternalSelected] = React.useState(defaultSelected ?? false);
    const isSelected = isControlled ? selected : internalSelected;
    const selectedKey = isSelected ? "true" : ("false" as const);

    // Selection ignites: the accent fill switches on beneath the label and the
    // chip settles from a hair under size; deselecting dims it out.
    const selectPulse = useSharedValue(1);
    const fill = useSharedValue(isSelected ? 1 : 0);
    const firstRender = React.useRef(true);
    React.useEffect(() => {
      if (firstRender.current) {
        firstRender.current = false;
        return;
      }
      fill.value = withTiming(isSelected ? 1 : 0, isSelected ? FILL_ON : FILL_OFF);
      if (reduceMotion || !isSelected) return;
      selectPulse.value = withSequence(withTiming(IGNITE_FROM, timing.instant), withSpring(1, spring.swap));
    }, [isSelected, selectPulse, fill, reduceMotion]);
    const fillStyle = useAnimatedStyle(() => ({ opacity: fill.value }));

    // press.scale and the selection pulse share one transform slot.
    const chipStyle = useAnimatedStyle(() => ({
      transform: [{ scale: press.scale.value * selectPulse.value }],
    }));

    // Auto-track async onPress promises
    const asyncPress = useAsyncPress(
      asyncTracking ? onPress : undefined,
      {
        haptic: () => haptics.selection(),
      }
    );
    const isLoading = asyncPress.loading;
    const isDisabled = disabled || isLoading;

    // Held-state ink overlay — a faint wash that confirms contact instantly.
    const ink = useSharedValue(0);
    const inkStyle = useAnimatedStyle(() => ({ opacity: ink.value * 0.12 }));

    const handlePress = (e: GestureResponderEvent) => {
      if (!isControlled && isSelectable) setInternalSelected(!isSelected);
      onSelectedChange?.(!isSelected);
      if (asyncTracking) {
        asyncPress.handlePress(e);
      } else {
        haptics.selection();
        onPress?.(e);
      }
    };
    const handlePressIn = (_e: GestureResponderEvent) => {
      press.onPressIn();
      if (!reduceMotion) ink.value = withTiming(1, timing.instant);
    };
    const handlePressOut = () => {
      press.onPressOut();
      ink.value = withTiming(0, timing.normal);
    };

    const handleDelete = (e: GestureResponderEvent) => {
      e.stopPropagation?.();
      haptics.light();
      onDelete?.();
    };

    return (
      // The outer pill is the pressable: hitSlop on an inner node is clipped by
      // this overflow-hidden parent (Android never delivers touches outside a
      // parent's bounds), so the 44pt target must live here.
      <AnimatedPressable
        ref={ref}
        disabled={isDisabled}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected, disabled: isDisabled, busy: isLoading }}
        // accessibilityState isn't forwarded to the DOM on web — mirror it
        // with explicit aria-* like Switch/Toggle do.
        aria-pressed={isSelected}
        aria-disabled={isDisabled}
        aria-busy={isLoading}
        // 36pt visual height (32 sm) + 2×12 hitSlop clears the 44pt floor.
        hitSlop={12}
        {...props}
        style={chipStyle}
        className={cn(
          // overflow-hidden clips the square ink wash to the pill shape.
          "overflow-hidden",
          chipVariants({ variant, selected: selectedKey, size }),
          isDisabled && "opacity-50",
          className,
          isSelected && selectedClassName
        )}
      >

        {/* Selected glass chips drop the glass for the solid fill — a tinted
            pane over a photo can't carry a selected state legibly. */}
        {variant === "glass" && !isSelected ? (
          <Glass
            effect="clear"
            sheen={0.5}
            className="absolute inset-0 rounded-full"
            pointerEvents="none"
          />
        ) : null}
        {/* Selected fill — switches on beneath the label. */}
        <Animated.View
          pointerEvents="none"
          className="bg-primary"
          style={[{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }, fillStyle]}
        />
        {/* Ink overlay — held state. Lives on the outer pill so the wash
            covers the full chip (padding included), not just the content row. */}
        <Animated.View
          pointerEvents="none"
          className="bg-foreground"
          style={[
            { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
            inkStyle,
          ]}
        />
        <View pointerEvents="box-none" className="h-full flex-row items-center gap-1.5">
          {icon}
          <Text
            className={cn(
              chipTextVariants({ variant, selected: selectedKey, size }),
              textClassName,
              isSelected && selectedTextClassName
            )}
          >
            {children}
          </Text>
        </View>
        {onDelete ? (
          <Pressable
            onPress={handleDelete}
            onPressIn={deletePress.onPressIn}
            onPressOut={deletePress.onPressOut}
            // isDisabled (not disabled) — the × must also lock during the
            // async onPress loading window, same as the chip body.
            disabled={isDisabled}
            className="ml-0.5 h-5 w-5 items-center justify-center rounded-full"
            accessibilityRole="button"
            accessibilityLabel="Remove chip"
            hitSlop={12}
          >
            <Animated.View style={deletePress.animatedStyle}>
              <Icon name="x" size="sm" color={isSelected ? "primaryForeground" : "mutedForeground"} />
            </Animated.View>
          </Pressable>
        ) : null}
      </AnimatedPressable>
    );
  }
);

Chip.displayName = "Chip";
