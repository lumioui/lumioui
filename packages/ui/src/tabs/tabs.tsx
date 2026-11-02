import * as React from "react";
import { createContext, forwardRef, useContext } from "react";
import { View, Pressable, type ViewProps, type LayoutChangeEvent } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useDerivedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
  interpolateColor,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import {
  cn,
  useHaptic,
  spring,
  tempo,
  timing,
  ease,
  useReducedMotion,
  usePressAnimation,
  useTheme,
  AnimatedPressable,
  LitEdge,
} from "@lumioui/core";
import { Icon, type IconName } from "../icon";
import { Glass } from "../glass";

type TabsVariant = "pill" | "line";

/** Press ink fade-in — quick tactile wash. */
const INK_IN = timing.recede;
/** Press ink fade-out — slightly slower than in so it reads as release, not snap. */
const INK_OUT = timing.fast;
/** The pill dims a touch as it leaves its tab and brightens back as it lands
 *  — light arriving with the selection. */
const PILL_DIM = 0.85;
/** Dark-mode pill — lifted above the muted track (same rule as the
 *  segmented control: `bg-background`/`bg-card` read as a hole in dark). */
const DARK_PILL = "rgba(255,255,255,0.14)";
/** Line indicator thickness. */
const LINE_H = 3;

/** Content panel enter — rise + fade on the ease.out decel token at the
 *  fast timing band; stays under the 300ms UI band while outrunning the
 *  indicator glide. */
const CONTENT_ENTER = { ...timing.fast, easing: Easing.bezier(...ease.out) };
/** Outgoing panel — dims in place for exactly the pill's flight
 *  (tempo.flick), so it hands off on the frame the incoming panel ignites:
 *  no blank beat between tabs. Never slides away. */
const CONTENT_EXIT = { duration: tempo.flick, easing: Easing.bezier(...ease.in) };

interface PanelFrame {
  x: number;
  y: number;
  width: number;
}

interface TabLayout {
  x: number;
  width: number;
}

interface TabsCtx {
  value: string;
  onValueChange: (v: string) => void;
  variant: TabsVariant;
  /** Glass capsule + raised glass indicator (pill variant only). */
  glass?: boolean;
  /** Stable id prefix — wires trigger↔panel via nativeID/aria-labelledby. */
  baseId: string;
  /** Trigger layouts keyed by tab value (relative to the TabsList). */
  layouts: React.MutableRefObject<Record<string, TabLayout>>;
  /** Bump to re-run the indicator effect after a layout lands. */
  reportLayout: (value: string, layout: TabLayout) => void;
  /** Indicator shared values (absolute px translateX / width). */
  indicatorX: ReturnType<typeof useSharedValue<number>>;
  indicatorW: ReturnType<typeof useSharedValue<number>>;
  /** Pill brightness — dims as it leaves a tab, brightens as it lands. */
  pillLight: ReturnType<typeof useSharedValue<number>>;
}

const Ctx = createContext<TabsCtx | null>(null);

export interface TabsProps extends ViewProps {
  /** Controlled selected value. Omit with defaultValue for uncontrolled use. */
  value?: string;
  /** Initial value for uncontrolled use. */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Visual variant: "pill" (default, gliding pill) or "line" (underlined list). */
  variant?: TabsVariant;
  /** Glass treatment — pill tabs ride inside a glass capsule and
   *  the gliding indicator is a raised glass pill. */
  glass?: boolean;
  className?: string;
}

export const Tabs = forwardRef<React.ElementRef<typeof View>, TabsProps>(
  function Tabs({ value: controlledValue, defaultValue, onValueChange, variant = "pill", glass = false, className, children, ...props }, ref) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue ?? "");
  // Resolve active value during render, never in a passive effect.
  const value = controlledValue ?? uncontrolledValue;
  const handleValueChange = React.useCallback(
    (v: string) => {
      if (controlledValue === undefined) setUncontrolledValue(v);
      onValueChange?.(v);
    },
    [controlledValue, onValueChange]
  );
  const reduceMotion = useReducedMotion();
  const baseId = React.useId();
  const layouts = React.useRef<Record<string, TabLayout>>({});
  const indicatorX = useSharedValue(0);
  const indicatorW = useSharedValue(0);
  const pillLight = useSharedValue(1);
  const [layoutTick, setLayoutTick] = React.useState(0);

  const reportLayout = React.useCallback((v: string, layout: TabLayout) => {
    const prev = layouts.current[v];
    if (!prev || prev.x !== layout.x || prev.width !== layout.width) {
      layouts.current[v] = layout;
      setLayoutTick((n) => n + 1);
    }
  }, []);

  React.useEffect(() => {
    const target = layouts.current[value];
    if (!target) return;
    // First measured position: snap without animating so there's no slide-in from 0.
    // Reduced motion (or first measured position): snap — no glide travel.
    if (indicatorW.value === 0 || reduceMotion) {
      indicatorX.value = target.x;
      indicatorW.value = target.width;
    } else {
      const moving = Math.abs(indicatorX.value - target.x) > 1;
      indicatorX.value = withSpring(target.x, spring.indicator);
      indicatorW.value = withSpring(target.width, spring.indicator);
      // The pill dims on the frame it leaves and brightens as it lands
      // (the indicator spring runs ≈ tempo.glow, so the ignite closes on arrival).
      if (moving) {
        pillLight.value = withSequence(
          withTiming(PILL_DIM, timing.instant),
          withDelay(tempo.flick, withTiming(1, { ...timing.fast, easing: Easing.bezier(...ease.out) }))
        );
      }
    }
  }, [value, layoutTick, indicatorX, indicatorW, pillLight, reduceMotion]);

  const ctx = React.useMemo<TabsCtx>(
    () => ({ value, onValueChange: handleValueChange, variant, glass, baseId, layouts, reportLayout, indicatorX, indicatorW, pillLight }),
    [value, handleValueChange, variant, glass, baseId, reportLayout, indicatorX, indicatorW, pillLight]
  );

  return (
    <Ctx.Provider value={ctx}>
      <View ref={ref} className={cn("gap-2", className)} {...props}>
        {children}
      </View>
    </Ctx.Provider>
  );
});

function useTabs() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("Tabs.* must be inside <Tabs>");
  return ctx;
}

export const TabsList = forwardRef<React.ElementRef<typeof View>, ViewProps & { className?: string }>(
  function TabsList({ className, children, ...props }, ref) {
  const { variant, glass, indicatorX, indicatorW, pillLight } = useTabs();
  const { scheme } = useTheme();
  const isLine = variant === "line";
  // Line: a 1px bar scaled to the tab width — transform only, so the
  // morphing underline never relayouts. Pill keeps `width` (scaleX would
  // squash its capsule ends); trigger widths are usually equal, so it
  // rarely animates at all.
  const indicatorStyle = useAnimatedStyle(() =>
    isLine
      ? {
          transform: [
            { translateX: indicatorX.value + indicatorW.value / 2 - 0.5 },
            { scaleX: indicatorW.value },
          ],
        }
      : {
          opacity: pillLight.value,
          transform: [{ translateX: indicatorX.value }],
          width: indicatorW.value,
        },
    [isLine],
  );
  const glassed = !!glass && !isLine;
  const list = (
    <View
      ref={ref}
      accessibilityRole="tablist"
      accessibilityLabel="Tabs"
      className={cn(
        isLine ? "w-full flex-row border-b border-border" : "w-full flex-row rounded-full p-1",
        !glassed && !isLine && "bg-muted",
        !glassed && className
      )}
      {...props}
    >
      <Animated.View
        style={[
          isLine
            ? { position: "absolute", bottom: -1, left: 0, width: 1, height: LINE_H }
            : {
                position: "absolute",
                top: 4,
                bottom: 4,
                left: 0,
                ...(!glassed
                  ? scheme === "dark"
                    ? { backgroundColor: DARK_PILL }
                    : // The pill lifts with a whisper of shadow (raw
                      // black; no shadow token).
                      { shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 1 }
                  : null),
              },
          indicatorStyle,
        ]}
        className={isLine ? "bg-primary" : glassed ? "rounded-full" : "rounded-full bg-card"}
      >
        {glassed ? (
          <Glass
            effect="regular"
            sheen={0.5}
            bend={0.3}
            className="absolute inset-0 rounded-full"
          />
        ) : !isLine && scheme === "dark" ? (
          // Dark scheme: the raised pill carries a lit top edge.
          <LitEdge tone="surface" radius={999} />
        ) : null}
      </Animated.View>
      {children}
    </View>
  );
  if (!glassed) return list;
  return (
    <Glass effect="clear" className={cn("w-full rounded-full", className)}>
      {list}
    </Glass>
  );
});
TabsList.displayName = "TabsList";

export const TabsTrigger = forwardRef<
  React.ElementRef<typeof Pressable>,
  ViewProps & { value: string; className?: string; disabled?: boolean; icon?: IconName }
>(function TabsTrigger(
  {
    value,
    className,
    children,
    disabled,
    icon,
    ...props
  },
  ref
) {
  const { value: selected, onValueChange, variant, reportLayout, baseId, indicatorX, indicatorW } = useTabs();
  const { colors } = useTheme();
  const haptics = useHaptic();
  const reduceMotion = useReducedMotion();
  const active = selected === value;
  const press = usePressAnimation({ pressedScale: 0.94 });
  // Press ink overlay — faint dark wash that fades in/out on press.
  const inkOpacity = useSharedValue(0);
  const inkStyle = useAnimatedStyle(() => ({ opacity: inkOpacity.value }));
  // This trigger's own frame on the UI thread — the label colour reads it
  // against the gliding indicator every frame.
  const selfX = useSharedValue(0);
  const selfW = useSharedValue(0);
  const onLayout = (e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout;
    selfX.value = x;
    selfW.value = width;
    reportLayout(value, { x, width });
  };
  // Label ink follows the indicator, not the tap (an inverted label is clipped
  // label to the moving pill): coverage = how much of the indicator sits
  // over this trigger. A label darkens as the pill arrives and fades as it
  // leaves, so text never flips before the pill gets there.
  const coverage = useDerivedValue(() => {
    if (selfW.value <= 0 || indicatorW.value <= 0) return active ? 1 : 0;
    const overlap =
      Math.min(indicatorX.value + indicatorW.value, selfX.value + selfW.value) -
      Math.max(indicatorX.value, selfX.value);
    return Math.max(0, Math.min(1, overlap / Math.min(selfW.value, indicatorW.value)));
  }, [active]);
  const label = typeof children === "string" ? children : value;
  // Pill: ink label on the raised pill (selection is the pill itself).
  // Line: the accent carries the active label + underline.
  const isLine = variant === "line";
  const labelBase = isLine ? "text-[15px] font-medium" : "text-[15px] font-semibold";
  const activeColor = isLine ? colors.primaryText : colors.foreground;
  const activeIcon = isLine ? "primaryText" : "foreground";
  const labelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(coverage.value, [0, 1], [colors.mutedForeground, activeColor]),
  }), [activeColor, colors.mutedForeground]);
  const activeIconStyle = useAnimatedStyle(() => ({ opacity: coverage.value }));
  const labelNode =
    typeof children === "string" ? (
      <Animated.Text style={labelStyle} className={cn(labelBase, "text-muted-foreground")} numberOfLines={1}>
        {children}
      </Animated.Text>
    ) : (
      children
    );
  return (
    <AnimatedPressable
      ref={ref}
      disabled={disabled}
      className={cn(
        isLine ? "min-h-12 flex-1 items-center justify-center px-3 py-2" : "min-h-9 flex-1 items-center justify-center px-3 py-1.5",
        variant === "pill" && "rounded-full",
        disabled && "opacity-50",
        className
      )}
      style={press.animatedStyle}
      onLayout={onLayout}
      onPressIn={() => {
        if (disabled) return;
        press.onPressIn();
        // Reduced motion: snap the ink — opacity feedback stays, no fade travel.
        inkOpacity.value = reduceMotion ? 0.06 : withTiming(0.06, INK_IN);
      }}
      onPressOut={() => {
        if (disabled) return;
        press.onPressOut();
        inkOpacity.value = reduceMotion ? 0 : withTiming(0, INK_OUT);
      }}
      onPress={() => {
        if (disabled) return;
        haptics.selection();
        onValueChange(value);
      }}
      // The matching TabsContent is labelled-by this trigger's id.
      nativeID={`${baseId}-tab-${value}`}
      accessibilityRole="tab"
      accessibilityState={{ selected: active, disabled: disabled ?? false }}
      // accessibilityState isn't forwarded to the DOM on web — mirror it.
      aria-selected={active}
      aria-disabled={disabled ?? false}
      accessibilityLabel={label}
      {...props}
    >
      <Animated.View
        style={inkStyle}
        pointerEvents="none"
        className={cn("absolute inset-0 bg-foreground", variant === "pill" ? "rounded-full" : "rounded-md")}
      />
      {icon ? (
        <View className="flex-row items-center gap-1.5">
          {/* Two stacked glyphs crossfade on the same coverage as the label. */}
          <View>
            <Icon name={icon} size="sm" color="mutedForeground" />
            <Animated.View style={activeIconStyle} pointerEvents="none" className="absolute inset-0">
              <Icon name={icon} size="sm" color={activeIcon} />
            </Animated.View>
          </View>
          {labelNode}
        </View>
      ) : (
        labelNode
      )}
    </AnimatedPressable>
  );
});
TabsTrigger.displayName = "TabsTrigger";

export const TabsContent = forwardRef<React.ElementRef<typeof View>, ViewProps & { value: string; className?: string }>(
  function TabsContent({ value, className, children, style: styleProp, onLayout, ...props }, ref) {
    const { value: selected, baseId } = useTabs();
    const reducedMotion = useReducedMotion();
    const opacity = useSharedValue(0);
    const ty = useSharedValue(4);
    const scale = useSharedValue(1);
    const active = selected === value;
    // The panel's own frame while shown. When it loses the tab it is pinned
    // there (absolutely) so it can dim in place under the incoming panel.
    const frame = React.useRef<PanelFrame | null>(null);
    const [leaving, setLeaving] = React.useState<PanelFrame | null>(null);
    const [wasActive, setWasActive] = React.useState(active);
    // Resolved during render: on the frame the tab changes, pin the outgoing panel.
    if (wasActive !== active) {
      setWasActive(active);
      setLeaving(!active && frame.current ? frame.current : null);
    }

    React.useEffect(() => {
      if (active) {
        scale.value = 1;
        if (reducedMotion) {
          opacity.value = 1;
          ty.value = 0;
          return;
        }
        opacity.value = 0;
        ty.value = 4;
        // The tab becomes the panel: the content switches on as the pill
        // lands (the pill brightens tempo.flick after it leaves), not on tap.
        opacity.value = withDelay(tempo.flick, withTiming(1, CONTENT_ENTER));
        ty.value = withDelay(tempo.flick, withTiming(0, CONTENT_ENTER));
        return;
      }
      if (!leaving) return;
      // Dim to leave: the outgoing panel fades and recedes to 0.96 in place
      // while the pill is still on its way.
      const release = () => setLeaving(null);
      if (!reducedMotion) scale.value = withTiming(0.96, CONTENT_EXIT);
      opacity.value = withTiming(0, CONTENT_EXIT, (finished) => {
        if (finished) runOnJS(release)();
      });
    }, [active, leaving, opacity, ty, scale, reducedMotion]);

    const style = useAnimatedStyle(() => ({
      opacity: opacity.value,
      transform: [{ translateY: ty.value }, { scale: scale.value }],
    }));

    // Inactive panels stay MOUNTED so local state survives tab switches —
    // hidden from layout (display:none), hit-testing, and screen readers.
    // A panel that just lost the tab stays drawn (pinned, absolute) for its
    // 120ms dim, then hides.
    return (
      <Animated.View
        ref={ref}
        role="tabpanel"
        nativeID={`${baseId}-panel-${value}`}
        // Points back at the owning TabsTrigger's nativeID.
        aria-labelledby={`${baseId}-tab-${value}`}
        accessibilityElementsHidden={!active}
        importantForAccessibility={active ? "auto" : "no-hide-descendants"}
        // accessibilityElementsHidden isn't forwarded to the DOM — mirror it.
        aria-hidden={!active}
        pointerEvents={active ? "auto" : "none"}
        onLayout={(e) => {
          if (active) {
            const { x, y, width } = e.nativeEvent.layout;
            frame.current = { x, y, width };
          }
          onLayout?.(e);
        }}
        style={[
          styleProp,
          style,
          !active &&
            (leaving
              ? { position: "absolute", top: leaving.y, left: leaving.x, width: leaving.width }
              : { display: "none" }),
        ]}
        className={cn(className)}
        {...props}
      >
        {children}
      </Animated.View>
    );
  }
);
TabsContent.displayName = "TabsContent";

Tabs.displayName = "Tabs";
