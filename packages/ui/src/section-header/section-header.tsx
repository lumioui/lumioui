import * as React from "react";
import { forwardRef } from "react";
import { View, type LayoutChangeEvent, type ViewProps } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import {
  AnimatedPressable,
  SWITCH_DIM,
  SWITCH_RISE,
  cn,
  createVariant,
  ease,
  spring,
  timing,
  useHaptic,
  usePressAnimation,
  useReducedMotion,
  type AnimatedViewStyle,
} from "@lumioui/core";
import { Icon } from "../icon/icon";
import { Text } from "../text/text";

/**
 * SectionHeader — the row that introduces a content section: a title with
 * an optional count, a one-line subtitle and a trailing action ("See all",
 * a chevron, a filter). Three sizes cover the habitats real screens need:
 *
 *   large    — editorial section opener on a home/discover feed (24pt bold)
 *   default  — card/section title in a detail page (17pt semibold)
 *   compact  — grouped-list label above an inset section (13pt muted)
 *
 *   <SectionHeader title="Weeknight dinners" subtitle="Under 30 minutes" action="See all" onAction={…} />
 *   <SectionHeader size="compact" title="Linked accounts" count={3} />
 *   <SectionHeader title="Leaderboard" accessory={<SectionHeader.Tabs … />} />
 *
 * Purely presentational except for the action, which presses with the
 * shared spring dip and a light haptic and keeps a 44pt target; its chevron
 * leans 3pt toward where it leads.
 *
 * Opt-in signature (the default render is unchanged):
 *   switchOn      the header leads its section's switch-on band — it starts
 *                 dim and lights with a 6pt rise; rails and rows follow 120ms
 *                 later on the 40ms row rhythm.
 *   animateCount  the count swaps in place digit by digit: the old digit
 *                 dims, the new one ignites with <=6pt travel in the
 *                 direction the number moved.
 */

const titleVariants = createVariant({
  base: "text-foreground",
  variants: {
    size: {
      large: "text-2xl font-bold tracking-tight",
      default: "text-[17px] font-semibold",
      compact: "text-[13px] font-normal text-muted-foreground",
    },
  },
  defaultVariants: { size: "default" },
});

const countVariants = createVariant({
  base: "font-normal text-muted-foreground tabular-nums",
  variants: {
    size: {
      large: "text-2xl tracking-tight",
      default: "text-[17px]",
      compact: "text-[13px]",
    },
  },
  defaultVariants: { size: "default" },
});

export type SectionHeaderSize = "large" | "default" | "compact";

export interface SectionHeaderProps extends Omit<ViewProps, "className"> {
  /** Section title, sentence case. */
  title: string;
  /** One quiet line under the title (truncates). */
  subtitle?: string;
  /** Figure set after the title in muted tabular numerals ("Reviews 214"). */
  count?: number | string;
  /** Visual weight. Default "default". */
  size?: SectionHeaderSize;
  /** Trailing text action, e.g. "See all". */
  action?: string;
  /** Called when the action is pressed. */
  onAction?: () => void;
  /** Show a chevron after the action label. Default true for "large". */
  chevron?: boolean;
  /** Custom trailing slot (filter button, segmented control). Replaces `action`. */
  trailing?: React.ReactNode;
  /** Rendered under the title row (inline tabs, chips). */
  accessory?: React.ReactNode;
  /**
   * Lead the section's switch-on: the header starts dim and lights with a
   * small rise on mount. Pass a number to wait that many ms. Default off.
   */
  switchOn?: boolean | number;
  /** Swap the count in place digit by digit when it changes. Default false. */
  animateCount?: boolean;
  className?: string;
  titleClassName?: string;
}

/** The header lighting as its section's first band (same feel as `SwitchOn`). */
function useSwitchOn(enabled: boolean, delay: number) {
  const reduce = useReducedMotion();
  const on = useSharedValue(enabled ? 0 : 1);
  const rise = useSharedValue(enabled && !reduce ? 0 : 1);
  React.useEffect(() => {
    if (!enabled) return;
    on.value = withDelay(delay, withTiming(1, { ...timing.fast, easing: Easing.bezier(...ease.out) }));
    if (!reduce) rise.value = withDelay(delay, withTiming(1, { ...timing.normal, easing: Easing.bezier(...ease.out) }));
    // Mount-only: the band lights once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return useAnimatedStyle(() => ({
    opacity: SWITCH_DIM + (1 - SWITCH_DIM) * on.value,
    transform: [{ translateY: (1 - rise.value) * SWITCH_RISE }],
  }));
}

/** Incoming count digits travel this far; outgoing ones half of it. */
const SWAP_TRAVEL = 6;

/** One digit column of a swapping count: outgoing dims, incoming ignites. */
function SwapChar({ ch, dir, className }: { ch: string; dir: number; className?: string }) {
  const reduce = useReducedMotion();
  const [pair, setPair] = React.useState<{ cur: string; prev: string | null; n: number }>({ cur: ch, prev: null, n: 0 });
  // Resolve the swap during render so the incoming digit is never a frame late.
  if (pair.cur !== ch) setPair({ cur: ch, prev: pair.cur, n: pair.n + 1 });
  const inOp = useSharedValue(1);
  const inMove = useSharedValue(1);
  const outOp = useSharedValue(0);
  React.useEffect(() => {
    if (!pair.n) return;
    inOp.value = 0;
    inOp.value = withTiming(1, { ...timing.fast, easing: Easing.bezier(...ease.out) });
    outOp.value = 1;
    outOp.value = withTiming(0, { ...timing.recede, easing: Easing.bezier(...ease.in) });
    inMove.value = 0;
    inMove.value = reduce ? 1 : withSpring(1, spring.swap);
  }, [pair.n, reduce, inOp, inMove, outOp]);
  const inStyle = useAnimatedStyle(() => ({
    opacity: inOp.value,
    transform: [{ translateY: (1 - inMove.value) * SWAP_TRAVEL * dir }, { scale: 0.96 + 0.04 * inMove.value }],
  }));
  const outStyle = useAnimatedStyle(() => ({
    opacity: outOp.value,
    transform: reduce
      ? []
      : [{ translateY: -(1 - outOp.value) * (SWAP_TRAVEL / 2) * dir }, { scale: 0.96 + 0.04 * outOp.value }],
  }));
  return (
    <View>
      <Animated.Text className={className} style={inStyle}>
        {pair.cur}
      </Animated.Text>
      {pair.prev !== null ? (
        <Animated.Text className={cn("absolute left-0 top-0", className)} style={outStyle}>
          {pair.prev}
        </Animated.Text>
      ) : null}
    </View>
  );
}

/** A count that swaps in place; digits keyed from the right so units stay put. */
function SwapCount({ value, className }: { value: number | string; className?: string }) {
  const text = typeof value === "number" ? value.toLocaleString("en-US") : value;
  const [last, setLast] = React.useState<{ value: number | string; dir: number }>({ value, dir: 1 });
  // Direction is resolved during render: up rises from below, down drops in from above.
  if (last.value !== value) {
    const a = Number(last.value);
    const b = Number(value);
    setLast({ value, dir: Number.isFinite(a) && Number.isFinite(b) && b < a ? -1 : 1 });
  }
  const chars = text.split("");
  return (
    <View className="flex-row" accessible accessibilityLabel={text}>
      {chars.map((c, i) => (
        <SwapChar key={chars.length - i} ch={c} dir={last.dir} className={className} />
      ))}
    </View>
  );
}

const SectionHeaderRoot = forwardRef<React.ElementRef<typeof View>, SectionHeaderProps>(
  function SectionHeader(
    {
      title,
      subtitle,
      count,
      size = "default",
      action,
      onAction,
      chevron,
      trailing,
      accessory,
      switchOn,
      animateCount = false,
      className,
      titleClassName,
      style,
      ...props
    },
    ref
  ) {
    const lights = switchOn !== undefined && switchOn !== false;
    const switchStyle = useSwitchOn(lights, typeof switchOn === "number" ? switchOn : 0);
    const compact = size === "compact";
    const showChevron = chevron ?? size === "large";
    const countText = typeof count === "number" ? count.toLocaleString("en-US") : count;
    const trailingNode =
      trailing ??
      (action ? (
        <SectionHeaderAction
          label={action}
          onPress={onAction}
          chevron={showChevron}
          contextLabel={title}
        />
      ) : null);

    const titleNode =
      animateCount && count !== undefined ? (
        <View className="min-w-0 flex-row items-center gap-2">
          <Text
            accessibilityRole="header"
            numberOfLines={1}
            className={cn("shrink", titleVariants({ size }), titleClassName)}
          >
            {title}
          </Text>
          <SwapCount value={count} className={countVariants({ size })} />
        </View>
      ) : (
        <Text
          accessibilityRole="header"
          numberOfLines={1}
          className={cn(titleVariants({ size }), titleClassName)}
        >
          {title}
          {countText !== undefined ? (
            <Text className={countVariants({ size })}>{`  ${countText}`}</Text>
          ) : null}
        </Text>
      );
    // One element type for both branches, typed so the animated style the
    // lit variant adds is accepted (Animated.View) on every React Native.
    const Root = (lights ? Animated.View : View) as React.ComponentType<
      Omit<ViewProps, "style"> & { className?: string; style?: AnimatedViewStyle; ref?: React.Ref<React.ComponentRef<typeof View>> }
    >;

    return (
      <Root
        ref={ref}
        className={cn("w-full", compact ? "gap-1 px-4" : "gap-3", className)}
        style={lights ? [style, switchStyle] : style}
        {...props}
      >
        <View className={cn("w-full flex-row justify-between gap-3", subtitle ? "items-start" : "items-center")}>
          <View className="min-w-0 flex-1 gap-1">
            {titleNode}
            {subtitle ? (
              <Text numberOfLines={1} className="text-sm text-muted-foreground">
                {subtitle}
              </Text>
            ) : null}
          </View>
          {trailingNode}
        </View>
        {accessory}
      </Root>
    );
  }
);
SectionHeaderRoot.displayName = "SectionHeader";

export interface SectionHeaderActionProps {
  label: string;
  onPress?: () => void;
  chevron?: boolean;
  /** Muted ink (compact headers) instead of the accent text colour. */
  muted?: boolean;
  /** Section title, read after the label ("See all, Weeknight dinners"). */
  contextLabel?: string;
  className?: string;
}

/** How far the chevron leans toward its destination on press, in points. */
const CHEVRON_LEAN = 3;

/** The trailing text action. Accent text by default; 44pt tall target. */
export const SectionHeaderAction = forwardRef<React.ElementRef<typeof View>, SectionHeaderActionProps>(
  function SectionHeaderAction({ label, onPress, chevron, muted, contextLabel, className }, ref) {
    const press = usePressAnimation({ pressedScale: 0.94, pressedOpacity: 0.7 });
    const haptic = useHaptic();
    const reduce = useReducedMotion();
    // The chevron leans toward where the action leads while it is held.
    const lean = useSharedValue(0);
    const leanStyle = useAnimatedStyle(() => ({ transform: [{ translateX: lean.value * CHEVRON_LEAN }] }));
    return (
      <AnimatedPressable
        ref={ref}
        onPress={() => {
          haptic.light();
          onPress?.();
        }}
        onPressIn={() => {
          press.onPressIn();
          if (!reduce) lean.value = withSpring(1, spring.press);
        }}
        onPressOut={() => {
          press.onPressOut();
          lean.value = reduce ? 0 : withSpring(0, spring.press);
        }}
        accessibilityRole="button"
        accessibilityLabel={contextLabel ? `${label}, ${contextLabel}` : label}
        hitSlop={{ top: 6, bottom: 6, left: 8, right: 8 }}
        style={press.animatedStyle}
        className={cn("h-8 flex-row items-center gap-1", className)}
      >
        <Text className={cn("text-[15px] font-medium", muted ? "text-muted-foreground" : "text-primary-text")}>
          {label}
        </Text>
        {chevron ? (
          <Animated.View style={leanStyle}>
            <Icon name="chevron-right" size="sm" color={muted ? "mutedForeground" : "primaryText"} />
          </Animated.View>
        ) : null}
      </AnimatedPressable>
    );
  }
);
SectionHeaderAction.displayName = "SectionHeaderAction";

export interface SectionHeaderFilterTabsProps {
  /** Tab labels. Values are the labels themselves. */
  options: string[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

/**
 * Inline text tabs for a section — a quiet filter (Friends / Club / Global)
 * that sits under or beside the title. A neutral pill glides between the
 * measured tabs on `spring.indicator` (translate + stretch, never width), and
 * each label's ink follows how much of the pill covers it, on the UI thread —
 * the ink never flips before the pill arrives. Reduced motion snaps the pill.
 */
export const SectionHeaderFilterTabs = forwardRef<React.ElementRef<typeof View>, SectionHeaderFilterTabsProps>(
  function SectionHeaderFilterTabs({ options, value, onValueChange, className }, ref) {
    const reduce = useReducedMotion();
    const haptic = useHaptic();
    const frames = React.useRef<Record<string, { x: number; w: number }>>({});
    const x = useSharedValue(0);
    const w = useSharedValue(0);
    // The pill's drawn width; scaleX stretches it to the target (set once, at layout time).
    const [base, setBase] = React.useState(0);
    const placed = React.useRef(false);

    const place = React.useCallback(
      (key: string, animate: boolean) => {
        const f = frames.current[key];
        if (!f) return;
        if (!placed.current) setBase(f.w);
        if (!animate || reduce || !placed.current) {
          x.value = f.x;
          w.value = f.w;
          placed.current = true;
          return;
        }
        x.value = withSpring(f.x, spring.indicator);
        w.value = withSpring(f.w, spring.indicator);
      },
      [reduce, x, w]
    );

    React.useEffect(() => {
      place(value, true);
    }, [value, place]);

    const pill = useAnimatedStyle(() => ({
      opacity: w.value > 0 && base > 0 ? 1 : 0,
      transform: [{ translateX: x.value }, { scaleX: base > 0 ? w.value / base : 1 }],
    }));

    return (
      <View ref={ref} accessibilityRole="tablist" className={cn("flex-row self-start", className)}>
        <Animated.View
          pointerEvents="none"
          className="absolute left-0 top-1 h-9 rounded-full bg-secondary"
          style={[{ width: base, transformOrigin: "left" }, pill]}
        />
        {options.map((opt) => (
          <FilterTab
            key={opt}
            label={opt}
            active={opt === value}
            pillX={x}
            pillW={w}
            onLayout={(f) => {
              frames.current[opt] = f;
              if (opt === value) place(opt, false);
            }}
            onPress={() => {
              if (opt === value) return;
              haptic.selection();
              onValueChange(opt);
            }}
          />
        ))}
      </View>
    );
  }
);
SectionHeaderFilterTabs.displayName = "SectionHeaderFilterTabs";

interface FilterTabProps {
  label: string;
  active: boolean;
  pillX: SharedValue<number>;
  pillW: SharedValue<number>;
  onLayout: (frame: { x: number; w: number }) => void;
  onPress: () => void;
}

/**
 * One tab. A hidden copy in the resting weight sizes the cell exactly as
 * before; the visible ink is two layers — muted and selected — whose mix is
 * the pill's coverage of this cell.
 */
function FilterTab({ label, active, pillX, pillW, onLayout, onPress }: FilterTabProps) {
  const fx = useSharedValue(0);
  const fw = useSharedValue(0);
  // Share of this cell under the pill, 0-1 (before layout: the resting state).
  // Styles read the shared values themselves — a style only re-runs for
  // values it reads directly, never for ones read inside a helper.
  const coverage = (x: number, w: number, px: number, pw: number) => {
    "worklet";
    if (w <= 0) return active ? 1 : 0;
    const overlap = Math.min(x + w, px + pw) - Math.max(x, px);
    return Math.min(1, Math.max(0, overlap) / w);
  };
  const cover = useAnimatedStyle(() => ({ opacity: coverage(fx.value, fw.value, pillX.value, pillW.value) }));
  const base = useAnimatedStyle(() => ({ opacity: 1 - coverage(fx.value, fw.value, pillX.value, pillW.value) }));
  return (
    <AnimatedPressable
      onLayout={(e: LayoutChangeEvent) => {
        const f = { x: e.nativeEvent.layout.x, w: e.nativeEvent.layout.width };
        fx.value = f.x;
        fw.value = f.w;
        onLayout(f);
      }}
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      className="h-11 justify-center px-4"
    >
      <Text className={cn("text-[15px] opacity-0", active ? "font-semibold" : "font-medium")}>{label}</Text>
      <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
        <Animated.Text className="text-[15px] font-medium text-muted-foreground" style={base}>
          {label}
        </Animated.Text>
      </View>
      <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
        <Animated.Text className="text-[15px] font-semibold text-foreground" style={cover}>
          {label}
        </Animated.Text>
      </View>
    </AnimatedPressable>
  );
}

export const SectionHeader = Object.assign(SectionHeaderRoot, {
  Action: SectionHeaderAction,
  Tabs: SectionHeaderFilterTabs,
});
