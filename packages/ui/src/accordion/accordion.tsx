import * as React from "react";
import { forwardRef, useCallback, useMemo } from "react";
import { View, Text, Pressable, PanResponder, type ViewProps } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  interpolate,
  Easing,
} from "react-native-reanimated";
import { cn, ease, useHaptic, usePressAnimation, spring, timing, useReducedMotion, StaggeredItem, AnimatedPressable } from "@lumioui/core";
import { Icon, type IconName } from "../icon";

/**
 * Accordion — grouped accordion with controlled/uncontrolled state.
 *   <Accordion type="single" defaultValue="a">
 *     <AccordionItem value="a">
 *       <AccordionTrigger>Is it accessible?</AccordionTrigger>
 *       <AccordionContent>Yes — native semantics.</AccordionContent>
 *     </AccordionItem>
 *   </Accordion>
 * Open items animate their border radius so a connected group reads as one
 * surface that opens and closes, rather than a stack of independent cards.
 */

interface AccordionCtx {
  openItems: string[];
  toggle: (value: string) => void;
  type: "single" | "multiple";
  lit: boolean;
}

// Chevron turns on spring.indicator — chrome, so it lands without rebound.
// The panel grows in place on spring.surface and pushes the rows below
// (details on demand); it closes on spring.dismiss, ~60% of the opening.
// The copy ignites as the surface opens and dims as it closes.
const OPEN_SPRING = spring.surface;
const CLOSE_SPRING = spring.dismiss;
/** Copy settles this far down into place — the direction the panel opens. */
const CONTENT_SETTLE = 4;
const IGNITE = { duration: timing.fast.duration, easing: Easing.bezier(...ease.out) };
const DIM = { duration: timing.recede.duration, easing: Easing.bezier(...ease.in) };

// Lit mode (opt-in `lit`): the open answer reads as the one that is on.
// Light before motion — the row brightens first, the panel grows LIT_LEAD
// later, and the copy switches on COPY_LAG after the height starts.
// Closing reverses: copy dims, height closes, the wash clears last.
/** The row lights this long before the panel starts to grow. */
const LIT_LEAD = timing.instant.duration;
/** Container, then content — copy waits for the surface to open. */
const COPY_LAG = timing.recede.duration;
/** The wash clears after the copy has dimmed and the height is closing. */
const WASH_CLEAR_DELAY = timing.recede.duration;
/** Closed questions sit at this ink so the open one reads lit. */
const UNLIT_INK = 0.7;
/** Peak alpha of the accent wash behind the open item. */
const WASH = 0.06;
const Ctx = React.createContext<AccordionCtx | null>(null);

function useAccordion() {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("Accordion.* must be used within <Accordion>");
  return ctx;
}

export interface AccordionProps extends ViewProps {
  /** Single = only one open at a time. */
  type?: "single" | "multiple";
  /** Controlled open items. */
  value?: string[];
  /** Initial open items (uncontrolled). */
  defaultValue?: string[];
  /** Called when the open set changes. */
  onValueChange?: (value: string[]) => void;
  /** Allow collapsing the last open item in single mode. Default true. */
  collapsible?: boolean;
  /**
   * Lumio light (opt-in): closed questions sit at 70% ink, the open item
   * lights with a faint accent wash before its panel grows, and the copy
   * switches on once the surface has started to open. Default false.
   */
  lit?: boolean;
  className?: string;
}

export const Accordion = forwardRef<React.ElementRef<typeof View>, AccordionProps>(
  function Accordion(
    { type = "single", value, defaultValue, onValueChange, collapsible = true, lit = false, className, children, ...props },
    ref
  ) {
    const isControlled = value !== undefined;
    const [internal, setInternal] = React.useState<string[]>(defaultValue ?? []);
    const openItems = isControlled ? value : internal;

    const toggle = useCallback(
      (v: string) => {
        const next = openItems.includes(v)
          ? openItems.filter((i) => i !== v)
          : type === "single"
            ? [v]
            : [...openItems, v];
        // In single mode, respect collapsible — if toggling the only open item
        // closed would leave nothing open and collapsible is false, bail.
        if (type === "single" && !collapsible && next.length === 0) return;
        if (!isControlled) setInternal(next);
        onValueChange?.(next);
      },
      [openItems, type, collapsible, isControlled, onValueChange]
    );

    return (
      <Ctx.Provider value={{ openItems, toggle, type, lit }}>
        <View ref={ref} className={cn("w-full", className)} {...props}>
          {children}
        </View>
      </Ctx.Provider>
    );
  }
);

const ItemCtx = React.createContext<{
  value: string;
  open: boolean;
  disabled: boolean;
  /** Stable ids wiring trigger ↔ content for AT (aria-controls/labelledby). */
  triggerId: string;
  contentId: string;
} | null>(null);

export interface AccordionItemProps extends ViewProps {
  value: string;
  /** Disable this item's trigger. */
  disabled?: boolean;
  className?: string;
}

export const AccordionItem = forwardRef<React.ElementRef<typeof View>, AccordionItemProps>(
  function AccordionItem({ value, disabled = false, className, children, ...props }, ref) {
    const { openItems, lit } = useAccordion();
    const open = openItems.includes(value);
    const autoId = React.useId();
    // useId emits ":"-wrapped ids (":r1:") — legal in DOM ids but hostile to
    // CSS selectors; strip to alphanumerics for clean nativeID/aria wiring.
    const uid = autoId.replace(/[^a-zA-Z0-9]/g, "");
    const triggerId = `accordion-${uid}-trigger`;
    const contentId = `accordion-${uid}-content`;
    // Lit mode: the open item's wash ignites first and clears last.
    const wash = useSharedValue(open ? 1 : 0);
    React.useEffect(() => {
      if (!lit) return;
      wash.value = open
        ? withTiming(1, IGNITE)
        : withDelay(WASH_CLEAR_DELAY, withTiming(0, DIM));
    }, [lit, open, wash]);
    const washStyle = useAnimatedStyle(() => ({ opacity: wash.value * WASH }));
    return (
      <ItemCtx.Provider value={{ value, open, disabled, triggerId, contentId }}>
        <View ref={ref} className={cn("w-full", className)} {...props}>
          {lit ? (
            <Animated.View
              pointerEvents="none"
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={washStyle}
              className="absolute -left-3 -right-3 bottom-0 top-0 rounded-2xl bg-primary"
            />
          ) : null}
          {children}
        </View>
      </ItemCtx.Provider>
    );
  }
);

export interface AccordionTriggerProps extends ViewProps {
  /** Optional leading icon name. */
  icon?: IconName;
  /** Accessible label (defaults to children text). */
  accessibilityLabel?: string;
  /** Hint announced after the label. */
  accessibilityHint?: string;
  className?: string;
  textClassName?: string;
  iconClassName?: string;
  children?: React.ReactNode;
}

export const AccordionTrigger = forwardRef<
  React.ElementRef<typeof Pressable>,
  AccordionTriggerProps
>(function AccordionTrigger(
  { icon, accessibilityLabel, accessibilityHint, className, textClassName, iconClassName, children, ...props },
  ref
) {
  const item = React.useContext(ItemCtx);
  const { toggle, lit } = useAccordion();
  const haptics = useHaptic();
  const reduce = useReducedMotion();
  const press = usePressAnimation({ pressedScale: 0.98 });
  if (!item) throw new Error("AccordionTrigger must be inside <AccordionItem>");

  const chevron = useSharedValue(item.open ? 1 : 0);
  // Lit mode: the question brightens to full ink as it opens and settles
  // back to UNLIT_INK after its copy has dimmed. Opacity only — kept under
  // reduced motion.
  const ink = useSharedValue(item.open ? 1 : 0);
  React.useEffect(() => {
    if (!lit) return;
    ink.value = item.open
      ? withTiming(1, IGNITE)
      : withDelay(WASH_CLEAR_DELAY, withTiming(0, DIM));
  }, [lit, item.open, ink]);
  const inkTextStyle = useAnimatedStyle(() => ({
    opacity: UNLIT_INK + (1 - UNLIT_INK) * ink.value,
  }));
  const swipeX = useSharedValue(0);
  const swipeHint = useSharedValue(0);
  // Press ink overlay — faint dark wash that fades in/out on press.
  const inkOpacity = useSharedValue(0);

  React.useEffect(() => {
    chevron.value = reduce
      ? item.open ? 1 : 0
      : withSpring(item.open ? 1 : 0, spring.indicator);
  }, [item.open, chevron, reduce]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(chevron.value, [0, 1], [0, 180])}deg` }],
  }));

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: press.scale.value }, { translateX: swipeX.value }],
  }));

  const hintStyle = useAnimatedStyle(() => ({
    opacity: swipeHint.value,
    transform: [{ translateX: swipeX.value * 0.3 }],
  }));

  const inkStyle = useAnimatedStyle(() => ({ opacity: inkOpacity.value }));

  // Swipe-to-expand gesture: swipe right to open, left to close.
  // PanResponder runs on the JS thread — shared-value writes are direct
  // assignments, no runOnJS needed.
  const pan = useMemo(() => {
    if (reduce || item.disabled) return null;
    return PanResponder.create({
      // Only claim horizontal-dominant swipes so vertical scroll still wins.
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onMoveShouldSetPanResponderCapture: (_, g) =>
        Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderMove: (_, g) => {
        // Allow swipe right when closed, swipe left when open — bounded at 40px.
        if (!item.open && g.dx > 0) {
          swipeX.value = Math.min(g.dx, 40);
          swipeHint.value = Math.min(swipeX.value / 40, 1);
        } else if (item.open && g.dx < 0) {
          swipeX.value = Math.max(g.dx, -40);
          swipeHint.value = Math.min(Math.abs(swipeX.value) / 40, 1);
        }
      },
      onPanResponderRelease: (_, g) => {
        // Trigger on a 30px travel or a ~800px/s fling in the right direction.
        if (!item.open && (g.dx > 30 || g.vx > 0.8)) {
          haptics.light();
          toggle(item.value);
        } else if (item.open && (g.dx < -30 || g.vx < -0.8)) {
          haptics.light();
          toggle(item.value);
        }
        swipeX.value = withSpring(0, spring.press);
        swipeHint.value = withTiming(0, timing.fast);
      },
      onPanResponderTerminate: () => {
        swipeX.value = withSpring(0, spring.press);
        swipeHint.value = withTiming(0, timing.fast);
      },
    });
  }, [reduce, item.disabled, item.open, item.value, swipeX, swipeHint, haptics, toggle]);

  const handlePressIn = () => {
    press.onPressIn();
    if (!reduce) inkOpacity.value = withTiming(0.06, timing.fast);
  };
  const handlePressOut = () => {
    press.onPressOut();
    inkOpacity.value = withTiming(0, timing.fast);
  };
  const handlePress = () => {
    if (item.disabled) return;
    haptics.light();
    toggle(item.value);
  };

  const triggerContent = (
    <AnimatedPressable
      ref={ref}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={item.disabled}
      style={pressStyle}
      className={cn(
        "min-h-14 flex-row items-center gap-3 py-4",
        item.disabled && "opacity-50",
        className
      )}
      accessibilityRole="button"
      accessibilityState={{ expanded: item.open, disabled: item.disabled }}
      // Trigger ↔ region wiring: nativeID gives the content's
      // accessibilityLabelledBy a target; aria-controls links them on web.
      nativeID={item.triggerId}
      aria-controls={item.contentId}
      // accessibilityState isn't forwarded to the DOM on web — mirror it.
      aria-expanded={item.open}
      aria-disabled={item.disabled ?? false}
      accessibilityLabel={accessibilityLabel ?? (typeof children === "string" ? children : undefined)}
      accessibilityHint={accessibilityHint ?? "Double tap or swipe to toggle"}
      hitSlop={8}
      {...props}
    >
      <Animated.View
        style={inkStyle}
        pointerEvents="none"
        className="absolute inset-0 rounded-md bg-foreground"
      />
      {icon ? (
        <Icon name={icon} size="md" color="mutedForeground" className={iconClassName} />
      ) : null}
      {lit ? (
        <Animated.Text
          className={cn("flex-1 text-base font-semibold leading-snug text-foreground", textClassName)}
          style={inkTextStyle}
          numberOfLines={2}
        >
          {children}
        </Animated.Text>
      ) : (
        <Text
          // Two lines: real FAQ questions run long — truncating them hides
          // the question itself.
          className={cn("flex-1 text-base font-semibold leading-snug text-foreground", textClassName)}
          numberOfLines={2}
        >
          {children}
        </Text>
      )}
      {/* Swipe hint indicator */}
      <Animated.View style={hintStyle} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no">
        <Icon name={item.open ? "chevron-left" : "chevron-right"} size="sm" color="mutedForeground" className={iconClassName} />
      </Animated.View>
      <Animated.View style={chevronStyle} accessibilityElementsHidden importantForAccessibility="no">
        <Icon name="chevron-down" size="sm" color="mutedForeground" className={iconClassName} />
      </Animated.View>
    </AnimatedPressable>
  );

  if (pan) {
    return (
      <View collapsable={false} {...pan.panHandlers}>
        {triggerContent}
      </View>
    );
  }

  return triggerContent;
});

export interface AccordionContentProps extends ViewProps {
  /** Optional description shown above the main content. */
  description?: string;
  className?: string;
  textClassName?: string;
  descriptionClassName?: string;
  children?: React.ReactNode;
}

export const AccordionContent = forwardRef<React.ElementRef<typeof View>, AccordionContentProps>(
  function AccordionContent({ description, className, textClassName, descriptionClassName, children, ...props }, ref) {
    const item = React.useContext(ItemCtx);
    if (!item) throw new Error("AccordionContent must be inside <AccordionItem>");
    const { lit } = useAccordion();

    const reduce = useReducedMotion();
    // Lit mode staggers the arrival: row lights → surface grows → copy on.
    const growDelay = lit ? LIT_LEAD : 0;
    const copyDelay = lit ? LIT_LEAD + COPY_LAG : 0;
    // Lazy-measured content height (cached across open/close). -1 = auto until measured.
    const [measured, setMeasured] = React.useState(0);
    const height = useSharedValue(item.open ? -1 : 0);
    const opacity = useSharedValue(item.open ? 1 : 0);
    // Inner content settle — the copy drifts 4px into place while the
    // measured surface opens, so the reveal reads as arrival, not a wipe.
    const rise = useSharedValue(item.open ? 1 : 0);

    React.useEffect(() => {
      if (reduce) {
        // Reduced motion: jump straight to the settled height/opacity.
        height.value = item.open ? (measured > 0 ? measured : -1) : 0;
        opacity.value = item.open ? 1 : 0;
        rise.value = item.open ? 1 : 0;
        return;
      }
      if (item.open) {
        // First measure of an item that mounted open: pin the height
        // directly. Springing from the -1 "auto" sentinel re-opened the item
        // from ~0 on mount, clipping the copy and jumping the rows below.
        height.value = measured > 0
          ? height.value < 0
            ? measured
            : withDelay(growDelay, withSpring(measured, OPEN_SPRING))
          : -1;
        opacity.value = withDelay(copyDelay, withTiming(1, IGNITE));
        // Same spring as the height so the copy travels with the surface.
        rise.value = withDelay(copyDelay, withSpring(1, OPEN_SPRING));
      } else {
        // Exit outruns the entrance: the height closes on the quicker
        // spring while the copy dims in place (no travel back).
        height.value = withSpring(0, CLOSE_SPRING);
        opacity.value = withTiming(0, DIM);
      }
    }, [item.open, measured, height, opacity, rise, reduce, growDelay, copyDelay]);

    const containerStyle = useAnimatedStyle(() => ({
      height: height.value < 0 ? undefined : height.value,
      opacity: opacity.value,
      overflow: "hidden",
    }));

    const riseStyle = useAnimatedStyle(() => ({
      transform: [{ translateY: -CONTENT_SETTLE * (1 - rise.value) }],
    }));

    return (
      <Animated.View
        ref={ref}
        style={containerStyle}
        pointerEvents={item.open ? "auto" : "none"}
        // "region" isn't in RN's accessibilityRole union — the `role` prop
        // is the typed path (RNW forwards it as the ARIA role).
        role="region"
        nativeID={item.contentId}
        accessibilityLabelledBy={item.triggerId}
        aria-labelledby={item.triggerId}
        accessibilityElementsHidden={!item.open}
        importantForAccessibility={item.open ? "yes" : "no-hide-descendants"}
      >
        {/* Inner wrapper carries the rise — transforms never affect the
            onLayout measurement, so `measured` stays the true rest height. */}
        <Animated.View
          style={riseStyle}
          className={cn("pb-4 pt-1", className)}
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height;
            if (h > 0 && h !== measured) setMeasured(h);
          }}
          {...props}
        >
          {description ? (
            <Text className={cn("mb-2 text-sm font-medium text-foreground", descriptionClassName)}>
              {description}
            </Text>
          ) : null}
          {typeof children === "string" ? (
            <Text className={cn("text-[15px] leading-[22px] text-muted-foreground", textClassName)}>
              {children}
            </Text>
          ) : (
            React.Children.toArray(children).map((child, index) => (
              <StaggeredItem key={index} index={index} active={item.open} initialDelayMs={copyDelay}>
                {child}
              </StaggeredItem>
            ))
          )}
        </Animated.View>
      </Animated.View>
    );
  }
);

Accordion.displayName = "Accordion";
AccordionItem.displayName = "AccordionItem";
AccordionTrigger.displayName = "AccordionTrigger";
AccordionContent.displayName = "AccordionContent";
