import * as React from "react";
import { createContext, forwardRef, useContext } from "react";
import { View, Pressable, Text, type ViewProps, type PressableProps } from "react-native";
import Animated, {
  Easing,
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import {
  cn,
  ease,
  rowDelay,
  spring,
  SWITCH_DIM,
  SWITCH_RISE,
  timing,
  useHaptic,
  usePressAnimation,
  useReducedMotion,
  AnimatedPressable,
} from "@lumioui/core";
import { Icon } from "../icon";

interface CollapsibleCtx {
  open: boolean;
  setOpen: (open: boolean) => void;
  /** DOM ids wiring trigger ↔ content for aria-controls / aria-labelledby. */
  triggerId: string;
  contentId: string;
}
const Ctx = createContext<CollapsibleCtx | null>(null);

function useCollapsible() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("Collapsible* must be inside <Collapsible>");
  return ctx;
}

export interface CollapsibleProps extends ViewProps {
  /** Controlled open state. */
  open?: boolean;
  /** Uncontrolled initial state. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

/**
 * Collapsible — details on demand that grow in place: the shape opens first,
 * then its content switches on (rows 40ms apart with CollapsibleItem); closing
 * dims the content before the shape folds.
 * Compose with CollapsibleTrigger, CollapsibleContent and CollapsibleItem.
 */
export const Collapsible = forwardRef<React.ElementRef<typeof View>, CollapsibleProps>(
  function Collapsible({ open, defaultOpen = false, onOpenChange, className, children, ...props }, ref) {
    const [internal, setInternal] = React.useState(defaultOpen);
    const isControlled = open !== undefined;
    const value = isControlled ? open : internal;
    // useId colons are valid HTML ids but awkward in selectors — sanitize.
    const baseId = React.useId().replace(/[^a-zA-Z0-9]/g, "");

    const setOpen = React.useCallback(
      (next: boolean) => {
        if (!isControlled) setInternal(next);
        onOpenChange?.(next);
      },
      [isControlled, onOpenChange]
    );

    return (
      <Ctx.Provider
        value={{
          open: value,
          setOpen,
          triggerId: `${baseId}-trigger`,
          contentId: `${baseId}-content`,
        }}
      >
        <View ref={ref} className={cn(className)} {...props}>
          {children}
        </View>
      </Ctx.Provider>
    );
  }
);

export interface CollapsibleTriggerProps extends Omit<PressableProps, "children"> {
  children: React.ReactNode;
  /** Hide the chevron. */
  hideChevron?: boolean;
  className?: string;
}

export const CollapsibleTrigger = forwardRef<React.ElementRef<typeof Pressable>, CollapsibleTriggerProps>(
  function CollapsibleTrigger({ children, hideChevron, className, onPress, onPressIn, onPressOut, accessibilityLabel, ...props }, ref) {
    const { open, setOpen, triggerId, contentId } = useCollapsible();
    const haptics = useHaptic();
    const reduce = useReducedMotion();
    // Dim-on-press only: pressedScale 1 keeps the trigger from shrinking —
    // a full-width row squashing under the finger reads as a bug, not feedback.
    const press = usePressAnimation({ pressedScale: 1, pressedOpacity: 0.6 });
    const rotation = useSharedValue(open ? 90 : 0);

    React.useEffect(() => {
      // Reduced motion: jump to the settled rotation, no travel.
      rotation.value = reduce ? (open ? 90 : 0) : withSpring(open ? 90 : 0, spring.indicator);
    }, [open, reduce, rotation]);

    const chevronStyle = useAnimatedStyle(() => ({
      transform: [{ rotate: `${rotation.value}deg` }],
    }));

    return (
      <AnimatedPressable
        ref={ref}
        style={press.animatedStyle}
        onPress={(e) => {
          // Toggle semantics → selection tick (haptic conventions).
          haptics.selection();
          setOpen(!open);
          onPress?.(e);
        }}
        onPressIn={(e) => {
          press.onPressIn();
          onPressIn?.(e);
        }}
        onPressOut={(e) => {
          press.onPressOut();
          onPressOut?.(e);
        }}
        className={cn("min-h-[44px] w-full flex-row items-center justify-between py-2", className)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        // accessibilityState isn't forwarded to the DOM on web — mirror it.
        aria-expanded={open}
        // nativeID → real DOM id on web so aria-labelledby can point back.
        nativeID={triggerId}
        aria-controls={contentId}
        accessibilityLabel={accessibilityLabel ?? (typeof children === "string" ? children : "Toggle section")}
        {...props}
      >
        {typeof children === "string" ? (
          <Text className="text-base font-semibold text-foreground">{children}</Text>
        ) : (
          children
        )}
        {!hideChevron ? (
          <Animated.View style={chevronStyle} accessibilityElementsHidden>
            <Icon name="chevron-right" size="sm" color="mutedForeground" />
          </Animated.View>
        ) : null}
      </AnimatedPressable>
    );
  }
);

/*
 * Container, then content (DESIGN-TASTE §5c rule 2). Opening, the height grows
 * on `spring.surface` as a dim shape and the content switches on CONTENT_LAG
 * later; `CollapsibleItem` rows ignite 40ms apart from there. Closing reverses
 * it: the content dims over `timing.recede` first, then the height folds on
 * `spring.dismiss`.
 */

/** Content waits this long behind the opening height — container first. */
const CONTENT_LAG = 120;
const IGNITE = { ...timing.fast, easing: Easing.bezier(...ease.out) };
const DIM_OUT = { ...timing.recede, easing: Easing.bezier(...ease.in) };

export interface CollapsibleContentProps extends ViewProps {
  className?: string;
}

export const CollapsibleContent = forwardRef<React.ElementRef<typeof View>, CollapsibleContentProps>(
  function CollapsibleContent({ className, children, ...props }, ref) {
    const { open, triggerId, contentId } = useCollapsible();
    const reduce = useReducedMotion();
    const [measured, setMeasured] = React.useState(0);
    const measuredRef = React.useRef(0);
    measuredRef.current = measured;
    const height = useSharedValue(open ? -1 : 0); // -1 = auto until measured
    const opacity = useSharedValue(open ? 1 : 0);
    // The content rises its last few points as it switches on, so the
    // section reads as lighting up inside the shape, not clipping in.
    const rise = useSharedValue(0);

    // Open / close transitions only — mount settles without motion.
    const was = React.useRef(open);
    React.useEffect(() => {
      if (was.current === open) return;
      was.current = open;
      const h = measuredRef.current;
      if (reduce) {
        // Reduced motion: settle the height, keep the light (dim / switch on).
        height.value = open ? (h > 0 ? h : -1) : 0;
        rise.value = 0;
        if (open) opacity.value = SWITCH_DIM;
        opacity.value = withTiming(open ? 1 : 0, open ? IGNITE : DIM_OUT);
        return;
      }
      if (open) {
        height.value = h > 0 ? withSpring(h, spring.surface) : -1;
        opacity.value = SWITCH_DIM;
        opacity.value = withDelay(CONTENT_LAG, withTiming(1, IGNITE));
        rise.value = SWITCH_RISE;
        rise.value = withDelay(CONTENT_LAG, withSpring(0, spring.swap));
      } else {
        // Content dims first; the shape folds once the light is out.
        opacity.value = withTiming(0, DIM_OUT);
        height.value = withDelay(timing.recede.duration, withSpring(0, spring.dismiss));
      }
    }, [open, reduce, height, opacity, rise]);

    // Content changed size while open — follow it (no motion from auto).
    React.useEffect(() => {
      if (!was.current || measured <= 0) return;
      height.value = reduce || height.value < 0 ? measured : withSpring(measured, spring.surface);
    }, [measured, reduce, height]);

    const containerStyle = useAnimatedStyle(() => ({
      height: height.value < 0 ? undefined : height.value,
      opacity: opacity.value,
      overflow: "hidden",
    }));
    // Transform lives on a separate inner view so it never perturbs the
    // onLayout height measurement.
    const slideStyle = useAnimatedStyle(() => ({
      transform: [{ translateY: rise.value }],
    }));

    return (
      <Animated.View
        style={containerStyle}
        ref={ref}
        pointerEvents={open ? "auto" : "none"}
        accessibilityElementsHidden={!open}
        // Region labelled by its trigger — mirrors the aria-controls on
        // CollapsibleTrigger so SR users can jump trigger ↔ panel.
        // `role` (not accessibilityRole) carries the full ARIA union.
        role="region"
        nativeID={contentId}
        aria-labelledby={triggerId}
        {...props}
      >
        <View
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height;
            if (h > 0 && h !== measured) setMeasured(h);
          }}
        >
          <Animated.View style={slideStyle} className={cn(className)}>
            {children}
          </Animated.View>
        </View>
      </Animated.View>
    );
  }
);

export interface CollapsibleItemProps extends ViewProps {
  /** Reading-order position inside the content — sets the 40ms ignite step. */
  index: number;
  className?: string;
}

/**
 * CollapsibleItem — a row inside CollapsibleContent that switches on in
 * reading order: dim on open, then bright at CONTENT_LAG + rowDelay(index).
 * On close it rides the content's dim; nothing un-staggers.
 */
export const CollapsibleItem = forwardRef<React.ElementRef<typeof View>, CollapsibleItemProps>(
  function CollapsibleItem({ index, className, style, children, ...props }, ref) {
    const { open } = useCollapsible();
    const lit = useSharedValue(1);
    const was = React.useRef(open);
    React.useEffect(() => {
      if (was.current === open) return;
      was.current = open;
      if (!open) return;
      lit.value = SWITCH_DIM;
      lit.value = withDelay(CONTENT_LAG + rowDelay(index), withTiming(1, IGNITE));
    }, [open, index, lit]);
    const litStyle = useAnimatedStyle(() => ({ opacity: lit.value }));
    return (
      <Animated.View ref={ref} style={[litStyle, style]} className={cn(className)} {...props}>
        {children}
      </Animated.View>
    );
  }
);

Collapsible.displayName = "Collapsible";
CollapsibleItem.displayName = "CollapsibleItem";
CollapsibleTrigger.displayName = "CollapsibleTrigger";
CollapsibleContent.displayName = "CollapsibleContent";
