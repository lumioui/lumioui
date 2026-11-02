import * as React from "react";
import { createContext, forwardRef, useContext } from "react";
import { View, Pressable, type ViewProps } from "react-native";
import Animated, {
  Easing,
  FadeOut,
  LinearTransition,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import {
  cn,
  ease,
  rowDelay,
  spring,
  timing,
  useHaptic,
  usePressAnimation,
  useReducedMotion,
  useTheme,
  AnimatedPressable,
} from "@lumioui/core";
import { Icon } from "../icon";

/** Root → crumb haptic channel so the compound (<Breadcrumb.Item>) path
 *  fires the same haptic as the data-driven path. */
type CrumbHaptic = "selection" | "light" | false;
const HapticCtx = createContext<CrumbHaptic>("selection");

/** A pushed crumb rises into the trail from this far below — the new level travels up. */
const CRUMB_RISE = 6;
/** Dropped crumbs dim right to left on the menu rhythm (§5b rows 24ms apart). */
const DROP_STAGGER = 24;

const igniteTiming = { ...timing.fast, easing: Easing.bezier(...ease.out) };

export interface BreadcrumbItemData {
  label: string;
  /** Tap handler — ignored on the last item (the current page). */
  onPress?: () => void;
  /** Overrides the default a11y label (the item label). */
  accessibilityLabel?: string;
}

export interface BreadcrumbProps extends Omit<ViewProps, "className" | "children"> {
  /** Data-driven trail — last item renders as the current page. */
  items?: BreadcrumbItemData[];
  /** Collapse middle items into a "…" button when the trail exceeds this. Default none. */
  maxItems?: number;
  /** Fired when the "…" button is pressed, after the trail expands. */
  onEllipsisPress?: (hidden: BreadcrumbItemData[]) => void;
  /** Haptic on crumb taps. Default "selection". */
  haptic?: "selection" | "light" | false;
  /** Compound composition: <Breadcrumb.Item> children, separators auto-inserted. */
  children?: React.ReactNode;
  className?: string;
}

/**
 * One crumb with the separator in front of it. Crumbs that mount after the
 * trail does switch on (a pushed level rises in; unfolded levels ignite 40ms
 * apart); the rest slide over on a layout spring; dropped crumbs dim in place.
 */
function CrumbSlot({
  arrive,
  delay,
  exitDelay,
  children,
}: {
  arrive: boolean;
  delay: number;
  exitDelay: number;
  children: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  const lit = useSharedValue(arrive ? 0 : 1);
  const rise = useSharedValue(arrive && !reduce ? CRUMB_RISE : 0);
  React.useEffect(() => {
    if (!arrive) return;
    lit.value = withDelay(delay, withTiming(1, igniteTiming));
    if (!reduce) rise.value = withDelay(delay, withSpring(0, spring.surface));
    // Arrival plays once, on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: lit.value,
    transform: [{ translateY: rise.value }],
  }));
  return (
    <Animated.View
      style={style}
      layout={reduce ? undefined : LinearTransition.springify().damping(spring.layout.damping).stiffness(spring.layout.stiffness)}
      exiting={FadeOut.duration(timing.recede.duration).delay(exitDelay)}
      className="flex-row items-center"
    >
      {children}
    </Animated.View>
  );
}

/**
 * Breadcrumb — nav trail with chevron separators. The current page is lit in
 * ink, ancestors stay dim; middle items collapse into "…". A pushed level
 * rises into the trail, popping back dims the dropped crumbs right to left,
 * and unfolding the ellipsis opens the gap while hidden levels ignite.
 *   <Breadcrumb items={[{ label: "Home" }, { label: "Library" }, { label: "Kyoto" }]} />
 *   <Breadcrumb><Breadcrumb.Item onPress={…}>Home</Breadcrumb.Item>…</Breadcrumb>
 * Expo Go compatible.
 */
export const BreadcrumbRoot = forwardRef<React.ElementRef<typeof View>, BreadcrumbProps>(
  function Breadcrumb(
    { items, maxItems, onEllipsisPress, haptic = "selection", children, className, ...props },
    ref,
  ) {
    const [expanded, setExpanded] = React.useState(false);

    // Keys on screen last commit — anything new after mount arrives.
    const seen = React.useRef<Set<string> | null>(null);
    const firstCommit = seen.current === null;

    const slots: { key: string; node: React.ReactNode }[] = [];

    if (items && items.length > 0) {
      const collapse = !expanded && maxItems != null && items.length > maxItems;
      const tail = collapse ? items.length - (maxItems! - 1) : 1;
      const hidden = collapse ? items.slice(1, tail) : [];
      // Keep each crumb's original index in its key so expanding doesn't remount the kept ones.
      const rendered: (number | null)[] = collapse
        ? [0, null, ...items.slice(tail).map((_, k) => tail + k)]
        : items.map((_, i) => i);

      rendered.forEach((idx, i) => {
        if (idx == null) {
          slots.push({
            key: "__ellipsis__",
            node: (
              <BreadcrumbEllipsis
                onPress={() => {
                  setExpanded(true);
                  onEllipsisPress?.(hidden);
                }}
              />
            ),
          });
          return;
        }
        const item = items[idx]!;
        const isLast = i === rendered.length - 1;
        slots.push({
          key: `${item.label}-${idx}`,
          node: (
            <BreadcrumbItem
              current={isLast}
              accessibilityLabel={item.accessibilityLabel}
              onPress={() => {
                if (isLast) return;
                item.onPress?.();
              }}
            >
              {item.label}
            </BreadcrumbItem>
          ),
        });
      });
    } else if (children != null) {
      // Children.toArray already drops null/undefined/booleans and assigns keys.
      React.Children.toArray(children).forEach((child, i) => {
        const key = React.isValidElement(child) && child.key != null ? String(child.key) : `crumb-${i}`;
        slots.push({ key, node: child });
      });
    }

    React.useEffect(() => {
      seen.current = new Set(slots.map((s) => s.key));
    });

    let arrivals = 0;
    const n = slots.length;

    return (
      <HapticCtx.Provider value={haptic}>
        <View
          ref={ref}
          // Breadcrumbs are a nav landmark: role="navigation" (ARIA) +
          // an explicit label — the bare row otherwise reads as loose text.
          role="navigation"
          accessibilityLabel="Breadcrumb"
          className={cn("min-h-11 w-full flex-row flex-wrap items-center", className)}
          {...props}
        >
          {slots.map((slot, i) => {
            const arrive = !firstCommit && !seen.current!.has(slot.key);
            const delay = arrive ? rowDelay(arrivals++) : 0;
            return (
              <CrumbSlot key={slot.key} arrive={arrive} delay={delay} exitDelay={(n - 1 - i) * DROP_STAGGER}>
                {/* Separators sit in front of every crumb but the first. */}
                {i > 0 ? <BreadcrumbSeparator /> : null}
                {slot.node}
              </CrumbSlot>
            );
          })}
        </View>
      </HapticCtx.Provider>
    );
  },
);

export interface BreadcrumbItemProps {
  /** Current page — non-interactive, lit in ink. */
  current?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  children?: React.ReactNode;
  className?: string;
}

export const BreadcrumbItem = forwardRef<React.ElementRef<typeof Pressable>, BreadcrumbItemProps>(
  function BreadcrumbItem({ current, onPress, accessibilityLabel, children, className }, ref) {
    const press = usePressAnimation({ pressedScale: 0.96, pressedOpacity: 0.55, fast: true });
    const haptics = useHaptic();
    const haptic = useContext(HapticCtx);
    const { colors } = useTheme();
    const text = typeof children === "string" ? children : undefined;
    const still = current || !onPress;

    // Light, not weight: the current crumb brightens to ink, ancestors dim.
    const lit = useSharedValue(current ? 1 : 0);
    React.useEffect(() => {
      lit.value = withTiming(current ? 1 : 0, { ...timing.normal, easing: Easing.bezier(...ease.inOut) });
    }, [current, lit]);
    const dim = colors.mutedForeground;
    const ink = colors.foreground;
    const inkStyle = useAnimatedStyle(() => ({
      color: interpolateColor(lit.value, [0, 1], [dim, ink]),
    }));

    return (
      <AnimatedPressable
        ref={ref}
        disabled={still}
        onPress={() => {
          if (still) return;
          if (haptic) haptics.fire(haptic);
          onPress?.();
        }}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        style={press.animatedStyle}
        hitSlop={6}
        className={cn("min-h-11 justify-center py-1", className)}
        // The current page is deliberately plain text, not a link — it can't
        // navigate. accessibilityState.selected + aria-current carry the
        // "you are here" semantics instead.
        accessibilityRole={still ? "text" : "link"}
        accessibilityState={current ? { selected: true } : undefined}
        aria-current={current ? "page" : undefined}
        accessibilityLabel={accessibilityLabel ?? text}
      >
        <Animated.Text className="text-[15px] font-medium" style={inkStyle} numberOfLines={1}>
          {children}
        </Animated.Text>
      </AnimatedPressable>
    );
  },
);

export interface BreadcrumbSeparatorProps {
  className?: string;
}

/** Chevron between crumbs — decorative, hidden from screen readers. */
export const BreadcrumbSeparator = forwardRef<React.ElementRef<typeof View>, BreadcrumbSeparatorProps>(
  function BreadcrumbSeparator({ className }, ref) {
    return (
      <View
        ref={ref}
        className={cn("h-11 items-center justify-center px-1", className)}
        accessibilityElementsHidden
        importantForAccessibility="no"
      >
        <Icon name="chevron-right" size="sm" color="mutedForeground" />
      </View>
    );
  },
);

export interface BreadcrumbEllipsisProps {
  onPress?: () => void;
  className?: string;
}

/** The "…" slot — expands the collapsed trail (or runs a custom handler). */
export const BreadcrumbEllipsis = forwardRef<React.ElementRef<typeof Pressable>, BreadcrumbEllipsisProps>(
  function BreadcrumbEllipsis({ onPress, className }, ref) {
    const press = usePressAnimation({ pressedScale: 0.9, fast: true });
    const haptics = useHaptic();
    const haptic = useContext(HapticCtx);
    return (
      <AnimatedPressable
        ref={ref}
        onPress={() => {
          if (haptic) haptics.fire(haptic);
          onPress?.();
        }}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        style={press.animatedStyle}
        hitSlop={6}
        className={cn("h-11 min-w-11 items-center justify-center", className)}
        accessibilityRole="button"
        accessibilityLabel="Show all levels"
      >
        <Icon name="ellipsis" size="sm" color="mutedForeground" />
      </AnimatedPressable>
    );
  },
);

export const Breadcrumb = Object.assign(BreadcrumbRoot, {
  Item: BreadcrumbItem,
  Separator: BreadcrumbSeparator,
  Ellipsis: BreadcrumbEllipsis,
});

Breadcrumb.displayName = "Breadcrumb";
BreadcrumbItem.displayName = "Breadcrumb.Item";
BreadcrumbSeparator.displayName = "Breadcrumb.Separator";
BreadcrumbEllipsis.displayName = "Breadcrumb.Ellipsis";
