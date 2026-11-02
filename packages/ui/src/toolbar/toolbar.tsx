import * as React from "react";
import { forwardRef } from "react";
import { View, type ViewProps } from "react-native";
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import {
  AnimatedPressable,
  cn,
  createVariant,
  ease,
  rowDelay,
  spring,
  timing,
  useHaptic,
  usePressAnimation,
  useReducedMotion,
  useSafeAreaInsetsSafe,
  useTheme,
  type ColorTokens,
} from "@lumioui/core";
import { Glass } from "../glass/glass";
import { Icon, type IconName } from "../icon/icon";
import { Text } from "../text/text";

/**
 * Toolbar — the bar of contextual actions at the bottom of a screen: an
 * edge-to-edge bar, a taller bar with a docked FAB, or a floating capsule.
 *   <Toolbar>
 *     <Toolbar.Item icon="edit" label="Filter" onPress={…} />
 *     <Toolbar.Status title="Updated just now" subtitle="3 unread" />
 *     <Toolbar.Item icon="send" label="Compose" onPress={…} />
 *   </Toolbar>
 *   <Toolbar variant="docked">… <Toolbar.Fab icon="plus" label="New note" /></Toolbar>
 *
 * Motion: changing `contentKey` (entering a selection mode) swaps the bar in
 * place — the outgoing set dims to 0.96 in 120ms while the incoming parts
 * ignite left → right, 40ms apart. An item waking from disabled brings its
 * ink up over `timing.normal`; a toggled item ignites, never pops. Status
 * lines swap in place (≤4pt travel when a count has a direction). `hidden`
 * dims the bar first, then lowers it. Expo Go compatible.
 */

const toolbarVariants = createVariant({
  base: "w-full flex-row items-center",
  variants: {
    variant: {
      // Edge: 50pt bar, items spread edge to edge, hairline on top.
      edge: "min-h-[50px] justify-between px-3",
      // Docked: 80pt bar, actions packed left, FAB docked right.
      docked: "min-h-[80px] gap-1 px-2",
      // Detached capsule — sits above content with a gutter.
      floating: "min-h-[56px] justify-between px-2",
    },
  },
  defaultVariants: { variant: "edge" },
});

const surface = {
  edge: "bg-card border-t border-border",
  docked: "bg-secondary",
  floating: "bg-card border border-border",
} as const;

type ToolbarVariant = "edge" | "docked" | "floating";

/** Legacy variant names map onto the neutral ones. */
const LEGACY_VARIANT: Record<"ios" | "material", ToolbarVariant> = { ios: "edge", material: "docked" };

/** Swapped content settles from this scale on spring.swap; outgoing dims to it. */
const IGNITE_FROM = 0.96;
/** Incoming parts wait for the outgoing set to start dimming — light first. */
const SWAP_LEAD = timing.instant.duration;
/** A toggled glyph ignites from this brightness. */
const ACTIVE_FROM = 0.5;
/** A swapped status line travels this far when its count has a direction. */
const STATUS_TRAVEL = 4;

const igniteEase = Easing.bezier(...ease.out);
const dimEase = Easing.bezier(...ease.in);
const shiftEase = Easing.bezier(...ease.inOut);

interface ToolbarCtx {
  variant: ToolbarVariant;
  labels: boolean;
}
const Ctx = React.createContext<ToolbarCtx>({ variant: "edge", labels: false });

/** Which swap generation is on screen; `still` marks the outgoing copy. */
const SwapCtx = React.createContext<{ gen: number; still: boolean }>({ gen: 0, still: true });
/** Left-to-right position of a part inside the bar. */
const SlotCtx = React.createContext(0);

/** Flatten fragments so every part gets its own slot in reading order. */
function flatten(children: React.ReactNode): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  React.Children.forEach(children, (child) => {
    if (React.isValidElement<{ children?: React.ReactNode }>(child) && child.type === React.Fragment) {
      out.push(...flatten(child.props.children));
    } else if (child != null && typeof child !== "boolean") {
      out.push(child);
    }
  });
  return out;
}

/**
 * A part ignites when its bar swaps: opacity 0→1 over timing.fast and
 * 0.96→1 on spring.swap, delayed by its slot on the 40ms row rhythm.
 */
function useIgnite() {
  const { gen, still } = React.useContext(SwapCtx);
  const slot = React.useContext(SlotCtx);
  const reduce = useReducedMotion();
  const born = !still && gen > 0;
  const lit = useSharedValue(born ? 0 : 1);
  const grow = useSharedValue(born ? IGNITE_FROM : 1);
  const seen = React.useRef<number | null>(born ? null : gen);
  React.useLayoutEffect(() => {
    if (still || seen.current === gen) return;
    seen.current = gen;
    const delay = SWAP_LEAD + rowDelay(slot);
    lit.value = 0;
    lit.value = withDelay(delay, withTiming(1, { ...timing.fast, easing: igniteEase }));
    if (reduce) {
      grow.value = 1;
      return;
    }
    grow.value = IGNITE_FROM;
    grow.value = withDelay(delay, withSpring(1, spring.swap));
  }, [gen, still, slot, reduce, lit, grow]);
  return useAnimatedStyle(() => ({ opacity: lit.value, transform: [{ scale: grow.value }] }));
}

/** Ink that follows `on` (0/1) over timing.normal — disabled ⇄ enabled never flips. */
function useWake(enabled: boolean) {
  const awake = useSharedValue(enabled ? 1 : 0);
  React.useEffect(() => {
    awake.value = withTiming(enabled ? 1 : 0, { ...timing.normal, easing: shiftEase });
  }, [enabled, awake]);
  return awake;
}

export interface ToolbarProps extends Omit<ViewProps, "className"> {
  /**
   * "edge" edge-to-edge bar · "docked" taller bar with a docked FAB ·
   * "floating" capsule. Default "edge".
   * `"ios"` and `"material"` are deprecated aliases — use "edge" and "docked".
   */
  variant?: ToolbarVariant | "ios" | "material";
  /** Surface. "solid" (default) or "glass" — glass only when content scrolls under the bar. */
  material?: "solid" | "glass";
  /** Show text labels under item glyphs (tablet style). Default false. */
  labels?: boolean;
  /** Pad the bottom safe-area inset into the bar. Default false. */
  safeArea?: boolean;
  /** Dim and lower the bar off-screen (scroll-to-hide). */
  hidden?: boolean;
  /** Change this to swap the bar's contents in place — e.g. "browse" → "select". */
  contentKey?: string | number;
  className?: string;
  children?: React.ReactNode;
}

const ToolbarRoot = forwardRef<React.ElementRef<typeof View>, ToolbarProps>(function Toolbar(
  { variant: variantProp = "edge", material = "solid", labels = false, safeArea = false, hidden = false, contentKey, className, children, style, ...props },
  ref
) {
  const variant: ToolbarVariant =
    variantProp === "ios" || variantProp === "material" ? LEGACY_VARIANT[variantProp] : variantProp;
  const reduceMotion = useReducedMotion();
  const insets = useSafeAreaInsetsSafe();
  const glass = material === "glass";

  // Hide: the bar dims first, then lowers by its own height (+ gutter for
  // the floating capsule). Returning rises on spring.surface and ignites.
  const [h, setH] = React.useState(80);
  const lower = useSharedValue(hidden ? 1 : 0);
  const shown = useSharedValue(hidden ? 0 : 1);
  React.useEffect(() => {
    shown.value = withTiming(
      hidden ? 0 : 1,
      hidden ? { ...timing.recede, easing: dimEase } : { ...timing.fast, easing: igniteEase }
    );
    if (reduceMotion) {
      lower.value = 0;
      return;
    }
    lower.value = hidden ? withTiming(1, { ...timing.normal, easing: dimEase }) : withSpring(0, spring.surface);
  }, [hidden, reduceMotion, lower, shown]);
  const barStyle = useAnimatedStyle(() => ({
    opacity: shown.value,
    transform: [{ translateY: lower.value * (h + 24) }],
  }), [h]);

  // Content swap, resolved during render so the incoming set never paints a
  // frame at full brightness: remember what was on screen, bump the
  // generation, and keep the outgoing copy until it has dimmed.
  const committed = React.useRef<React.ReactNode>(children);
  const [swap, setSwap] = React.useState<{ key: ToolbarProps["contentKey"]; gen: number; out: React.ReactNode }>({
    key: contentKey,
    gen: 0,
    out: null,
  });
  if (swap.key !== contentKey) {
    setSwap({ key: contentKey, gen: swap.gen + 1, out: committed.current });
  }
  React.useEffect(() => {
    committed.current = children;
  });

  const outLit = useSharedValue(0);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => {
    if (swap.gen === 0) return;
    outLit.value = 1;
    outLit.value = withTiming(0, { ...timing.recede, easing: dimEase });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setSwap((st) => ({ ...st, out: null })), timing.recede.duration);
  }, [swap.gen, outLit]);
  React.useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );
  const outStyle = useAnimatedStyle(() => ({
    opacity: outLit.value,
    transform: [{ scale: reduceMotion ? 1 : IGNITE_FROM + (1 - IGNITE_FROM) * outLit.value }],
  }), [reduceMotion]);

  const slots = (nodes: React.ReactNode) =>
    flatten(nodes).map((child, i) => (
      <SlotCtx.Provider key={React.isValidElement(child) && child.key != null ? child.key : i} value={i}>
        {child}
      </SlotCtx.Provider>
    ));

  return (
    <Ctx.Provider value={{ variant, labels }}>
      <Animated.View
        ref={ref}
        onLayout={(e) => setH(e.nativeEvent.layout.height)}
        style={[barStyle, safeArea ? { paddingBottom: insets.bottom } : null, style]}
        className={cn(
          "overflow-hidden",
          variant === "floating" && "mx-4 rounded-full",
          !glass && surface[variant],
          glass && variant === "edge" && "border-t border-border",
          className
        )}
        accessibilityRole="toolbar"
        pointerEvents={hidden ? "none" : "auto"}
        {...props}
      >
        {glass ? <Glass effect="regular" className="absolute inset-0" pointerEvents="none" /> : null}
        <View>
          <SwapCtx.Provider value={{ gen: swap.gen, still: false }}>
            <View className={toolbarVariants({ variant })}>{slots(children)}</View>
          </SwapCtx.Provider>
          {swap.out ? (
            <SwapCtx.Provider value={{ gen: swap.gen, still: true }}>
              <Animated.View
                pointerEvents="none"
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                style={outStyle}
                className={cn("absolute inset-0", toolbarVariants({ variant }))}
              >
                {slots(swap.out)}
              </Animated.View>
            </SwapCtx.Provider>
          ) : null}
        </View>
      </Animated.View>
    </Ctx.Provider>
  );
});
ToolbarRoot.displayName = "Toolbar";

/* ------------------------------------------------------------------ */

export interface ToolbarItemProps {
  /** Glyph name, or a custom element. */
  icon: IconName | React.ReactElement;
  /** Accessibility label, and the visible label when the bar has `labels`. */
  label: string;
  onPress?: () => void;
  /** Toggle state (bookmark, flag). Filled glyph + selected state. */
  active?: boolean;
  disabled?: boolean;
  /** Count badge on the glyph. */
  badge?: number;
  /** "default" ink, "primary" accent tint, "destructive". Default "default". */
  tone?: "default" | "primary" | "destructive";
  className?: string;
}

const ToolbarItem = forwardRef<React.ElementRef<typeof View>, ToolbarItemProps>(function ToolbarItem(
  { icon, label, onPress, active, disabled = false, badge, tone = "default", className },
  ref
) {
  const { variant, labels } = React.useContext(Ctx);
  const haptics = useHaptic();
  const reduceMotion = useReducedMotion();
  const { colors } = useTheme();
  const press = usePressAnimation({ pressedScale: 0.88, disabled });
  const ignite = useIgnite();
  const awake = useWake(!disabled);

  // A toggle turning on ignites its glyph in place — no overshoot on chrome.
  const act = useSharedValue(1);
  const actGrow = useSharedValue(1);
  const prev = React.useRef(active);
  React.useEffect(() => {
    if (prev.current === active) return;
    prev.current = active;
    if (!active) return;
    act.value = ACTIVE_FROM;
    act.value = withTiming(1, { ...timing.fast, easing: igniteEase });
    if (reduceMotion) return;
    actGrow.value = IGNITE_FROM;
    actGrow.value = withSpring(1, spring.swap);
  }, [active, reduceMotion, act, actGrow]);
  const actStyle = useAnimatedStyle(() => ({ opacity: act.value, transform: [{ scale: actGrow.value }] }));
  const onInk = useAnimatedStyle(() => ({ opacity: awake.value }));
  const offInk = useAnimatedStyle(() => ({ opacity: 1 - awake.value }));

  const lit: keyof ColorTokens =
    tone === "destructive" ? "destructive" : tone === "primary" || active ? "primaryText" : "foreground";
  const litColor = colors[lit];
  const mutedColor = colors.mutedForeground;
  const labelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(awake.value, [0, 1], [mutedColor, litColor]),
  }));

  // Two inks stacked: the lit glyph and its muted twin crossfade with `awake`.
  const glyph =
    typeof icon === "string" ? (
      <View>
        <Animated.View style={onInk}>
          <Icon name={icon} size="md" color={lit} filled={active} />
        </Animated.View>
        <Animated.View style={[{ position: "absolute", top: 0, left: 0 }, offInk]}>
          <Icon name={icon} size="md" color="mutedForeground" filled={active} />
        </Animated.View>
      </View>
    ) : (
      icon
    );
  const docked = variant === "docked";

  return (
    <Animated.View style={ignite}>
      <AnimatedPressable
        ref={ref}
        onPress={() => {
          haptics.light();
          onPress?.();
        }}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        disabled={disabled}
        hitSlop={4}
        style={press.animatedStyle}
        className={cn(
          "items-center justify-center",
          labels ? "min-h-[50px] min-w-[64px] gap-0.5 py-1" : docked ? "h-12 w-12 rounded-full" : "h-11 w-11",
          className
        )}
        accessibilityRole="button"
        accessibilityLabel={badge ? `${label}, ${badge}` : label}
        accessibilityState={{ disabled, selected: active }}
      >
        <Animated.View style={actStyle}>
          {glyph}
          {badge ? (
            <View className="absolute -right-2 -top-1 h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1">
              <Text className="text-xs font-semibold leading-none text-destructive-foreground tabular-nums" allowFontScaling={false}>
                {badge > 99 ? "99+" : badge}
              </Text>
            </View>
          ) : null}
        </Animated.View>
        {labels ? (
          <Animated.Text style={labelStyle} className="text-xs font-medium">
            {label}
          </Animated.Text>
        ) : null}
      </AnimatedPressable>
    </Animated.View>
  );
});
ToolbarItem.displayName = "Toolbar.Item";

/* ------------------------------------------------------------------ */

export interface ToolbarTextButtonProps {
  /** Visible label — "Select", "Done", "Edit". */
  children: string;
  onPress?: () => void;
  /** Bold the label (confirm actions like Done). */
  emphasized?: boolean;
  disabled?: boolean;
  tone?: "primary" | "destructive" | "default";
  className?: string;
}

/** Text bar button — "Select", "Done", "Delete All". */
const ToolbarTextButton = forwardRef<React.ElementRef<typeof View>, ToolbarTextButtonProps>(function ToolbarTextButton(
  { children, onPress, emphasized = false, disabled = false, tone = "primary", className },
  ref
) {
  const haptics = useHaptic();
  const { colors } = useTheme();
  const press = usePressAnimation({ pressedScale: 0.94, pressedOpacity: 0.6, disabled });
  const ignite = useIgnite();
  const awake = useWake(!disabled);
  const litColor = colors[tone === "destructive" ? "destructive" : tone === "default" ? "foreground" : "primaryText"];
  const mutedColor = colors.mutedForeground;
  const labelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(awake.value, [0, 1], [mutedColor, litColor]),
  }));
  return (
    <Animated.View style={ignite}>
      <AnimatedPressable
        ref={ref}
        onPress={() => {
          haptics.light();
          onPress?.();
        }}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        disabled={disabled}
        hitSlop={4}
        style={press.animatedStyle}
        className={cn("h-11 min-w-[44px] items-center justify-center px-2", className)}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
      >
        <Animated.Text style={labelStyle} className={cn("text-[17px]", emphasized ? "font-semibold" : "font-normal")}>
          {children}
        </Animated.Text>
      </AnimatedPressable>
    </Animated.View>
  );
});
ToolbarTextButton.displayName = "Toolbar.TextButton";

/* ------------------------------------------------------------------ */

export interface ToolbarStatusProps {
  /** Main line — "Updated just now", "3 Photos Selected". */
  title: string;
  /** Second line — "12 unread". */
  subtitle?: string;
  /**
   * Direction of a count in the title. When set, the new line arrives
   * from that side (≤4pt) as it swaps in; omit for a pure in-place swap.
   */
  trend?: "up" | "down";
  className?: string;
}

function StatusLines({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <>
      <Text numberOfLines={1} className={cn("text-center", subtitle ? "text-xs font-medium" : "text-[13px] font-semibold")}>
        {title}
      </Text>
      {subtitle ? (
        <Text numberOfLines={1} className="text-center text-xs text-muted-foreground">
          {subtitle}
        </Text>
      ) : null}
    </>
  );
}

/** Centre status text ("Updated just now"). Swaps in place; announces politely. */
const ToolbarStatus = forwardRef<React.ElementRef<typeof View>, ToolbarStatusProps>(function ToolbarStatus(
  { title, subtitle, trend, className },
  ref
) {
  const reduce = useReducedMotion();
  const ignite = useIgnite();

  // Resolve the swap during render so the new line never paints at full.
  const [line, setLine] = React.useState<{
    title: string;
    subtitle?: string;
    prev: { title: string; subtitle?: string } | null;
    n: number;
  }>({ title, subtitle, prev: null, n: 0 });
  if (line.title !== title || line.subtitle !== subtitle) {
    setLine({ title, subtitle, prev: { title: line.title, subtitle: line.subtitle }, n: line.n + 1 });
  }

  const inLit = useSharedValue(1);
  const inY = useSharedValue(0);
  const outLit = useSharedValue(0);
  React.useLayoutEffect(() => {
    if (line.n === 0) return;
    outLit.value = 1;
    outLit.value = withTiming(0, { ...timing.recede, easing: dimEase });
    inLit.value = 0;
    inLit.value = withTiming(1, { ...timing.fast, easing: igniteEase });
    // A count going down rolls in from above; going up, from below.
    const travel = reduce || !trend ? 0 : trend === "down" ? -STATUS_TRAVEL : STATUS_TRAVEL;
    inY.value = travel;
    inY.value = withSpring(0, spring.swap);
    // Only the swap counter drives this; trend is read at the moment it fires.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [line.n]);
  const inStyle = useAnimatedStyle(() => ({ opacity: inLit.value, transform: [{ translateY: inY.value }] }));
  const outStyle = useAnimatedStyle(() => ({ opacity: outLit.value }));

  return (
    <Animated.View
      ref={ref}
      style={ignite}
      className={cn("flex-1 items-center justify-center px-2", className)}
      accessibilityLiveRegion="polite"
    >
      <View className="w-full items-center justify-center">
        <Animated.View style={inStyle} className="w-full items-center">
          <StatusLines title={line.title} subtitle={line.subtitle} />
        </Animated.View>
        {line.prev ? (
          <Animated.View
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={outStyle}
            className="absolute inset-0 items-center justify-center"
          >
            <StatusLines title={line.prev.title} subtitle={line.prev.subtitle} />
          </Animated.View>
        ) : null}
      </View>
    </Animated.View>
  );
});
ToolbarStatus.displayName = "Toolbar.Status";

/* ------------------------------------------------------------------ */

export interface ToolbarFabProps {
  icon: IconName;
  /** Accessibility label. */
  label: string;
  onPress?: () => void;
  className?: string;
}

/** Docked FAB — 56pt, 16pt corners, pushed to the bar's trailing edge. */
const ToolbarFab = forwardRef<React.ElementRef<typeof View>, ToolbarFabProps>(function ToolbarFab(
  { icon, label, onPress, className },
  ref
) {
  const haptics = useHaptic();
  const press = usePressAnimation({ pressedScale: 0.94 });
  const ignite = useIgnite();
  return (
    <Animated.View style={ignite} className="ml-auto mr-2">
      <AnimatedPressable
        ref={ref}
        onPress={() => {
          haptics.medium();
          onPress?.();
        }}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        style={press.animatedStyle}
        className={cn("h-14 w-14 items-center justify-center rounded-2xl bg-primary", className)}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <Icon name={icon} size="md" color="primaryForeground" />
      </AnimatedPressable>
    </Animated.View>
  );
});
ToolbarFab.displayName = "Toolbar.Fab";

/** Flexible gap — pushes neighbours apart. */
function ToolbarSpacer({ className }: { className?: string }) {
  return <View className={cn("flex-1", className)} />;
}
ToolbarSpacer.displayName = "Toolbar.Spacer";

export const Toolbar = Object.assign(ToolbarRoot, {
  Item: ToolbarItem,
  TextButton: ToolbarTextButton,
  Status: ToolbarStatus,
  Fab: ToolbarFab,
  Spacer: ToolbarSpacer,
});
export { toolbarVariants };
