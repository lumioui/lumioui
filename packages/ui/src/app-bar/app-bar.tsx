import * as React from "react";
import { forwardRef } from "react";
import { View, Text, Pressable, type ViewProps } from "react-native";
import Animated, {
  Easing,
  interpolate,
  Extrapolation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

import {
  cn,
  useHaptic,
  usePressAnimation,
  useReducedMotion,
  useTheme,
  AnimatedPressable,
  LitEdge,
  ease,
  spring,
  tempo,
  timing,
} from "@lumioui/core";
import { Icon, type IconName } from "../icon";
import { Glass, GlassContainer } from "../glass";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export interface AppBarActionItem {
  /** Icon name from the LumioUI icon set. */
  icon: IconName;
  /** Required — icon buttons carry no visible label. */
  accessibilityLabel: string;
  onPress?: () => void;
  /** Disabled state — dims and drops the haptic. */
  disabled?: boolean;
  /** Committed state (saved, liked, watching). The glyph fills, and turning
   *  on plays the commit: the glyph dips and re-ignites while an accent wash
   *  holds on the button. */
  active?: boolean;
}

export interface AppBarProps extends Omit<ViewProps, "className"> {
  /** Bar title. "small" centers it inline; "large" renders a large title below the row. */
  title?: string;
  /** Secondary line under the centered title (small mode only). */
  subtitle?: string;
  /** "small" = classic inline bar; "large" = large-title header. Default "small". */
  size?: "small" | "large";
  /** Show a back chevron + label on the leading edge. */
  showBack?: boolean;
  /** Label next to the back chevron — conventionally the previous screen's title. Default "Back". */
  backLabel?: string;
  onBack?: () => void;
  /** Leading slot — overrides the back button when set. */
  leading?: React.ReactNode;
  /** Trailing action icon buttons. */
  actions?: AppBarActionItem[];
  /** Trailing slot — overrides `actions` when set. */
  trailing?: React.ReactNode;
  /** Pad for the status bar. Default true. */
  safeArea?: boolean;
  /** Bottom hairline. Default true. */
  bordered?: boolean;
  /** Translucent bar: edge-to-edge glass material for content scrolling
   *  underneath, and the bar's buttons wear glass capsules — the bar is
   *  transparent and the controls carry the glass.
   *  Adjacent trailing actions union into one pill. */
  translucent?: boolean;
  /** Floating capsule bar — the bar detaches into a rounded glass capsule
   *  hovering over the content (island bar). Implies translucent. */
  floating?: boolean;
  /** Haptic on button presses. Default "light". */
  haptic?: "light" | "selection" | false;
  /** Scroll offset of the content under the bar. When passed, light follows
   *  scroll: the surface, its frost and the bottom hairline are clear at rest
   *  and fully on by 24pt (floating capsules sharpen instead). Drive it from
   *  `useAnimatedScrollHandler` — it is read on the UI thread. */
  scrollY?: SharedValue<number>;
  className?: string;
}

/** Scroll distance over which the bar's surface and hairline switch on. */
const SCROLL_LIGHT = 24;
/** How far a floating capsule's frost veil thickens once content is under it. */
const CAPSULE_FROST = 0.5;
/** Swapped titles ignite from this scale (DESIGN-TASTE §5 rule 3). */
const SWAP_FROM = 0.96;
/** A committed action holds its accent wash for one settle beat so the eye catches it. */
const WASH_HOLD = tempo.settle;
/** Peak alpha of that wash — a tint on the button, not a fill. */
const WASH_PEAK = 0.16;
/** The glyph dips to here before re-igniting on commit. */
const COMMIT_DIP = 0.84;

/** 0 at rest → 1 once content has scrolled SCROLL_LIGHT under the bar. */
function useScrollLight(scrollY: SharedValue<number> | undefined, peak = 1) {
  return useAnimatedStyle(() => ({
    opacity: scrollY
      ? interpolate(scrollY.value, [0, SCROLL_LIGHT], [0, peak], Extrapolation.CLAMP)
      : peak,
  }));
}

/** A line of text that swaps in place: the outgoing copy dims while the
 *  incoming one ignites. Only the incoming copy is read by screen readers. */
function SwapText({
  text,
  className,
  align = "center",
  header,
}: {
  text: string;
  className: string;
  align?: "center" | "left";
  header?: boolean;
}) {
  const reduce = useReducedMotion();
  const [shown, setShown] = React.useState(text);
  const [out, setOut] = React.useState<string | null>(null);
  if (text !== shown) {
    setOut(shown);
    setShown(text);
  }
  const lit = useSharedValue(1);
  const grow = useSharedValue(1);
  const leave = useSharedValue(0);
  const mounted = React.useRef(false);
  React.useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    lit.value = 0;
    lit.value = withTiming(1, { ...timing.fast, easing: Easing.bezier(...ease.out) });
    leave.value = 1;
    leave.value = withTiming(0, { ...timing.recede, easing: Easing.bezier(...ease.in) });
    if (reduce) {
      grow.value = 1;
      return;
    }
    grow.value = SWAP_FROM;
    grow.value = withSpring(1, spring.swap);
  }, [shown, reduce, lit, grow, leave]);
  const inStyle = useAnimatedStyle(() => ({
    opacity: lit.value,
    transform: [{ scale: grow.value }],
  }));
  const outStyle = useAnimatedStyle(() => ({
    opacity: leave.value,
    transform: [{ scale: reduce ? 1 : SWAP_FROM + (1 - SWAP_FROM) * leave.value }],
  }));
  const textAlign = align === "center" ? "center" : "left";
  return (
    <View className={align === "center" ? "items-center" : undefined}>
      <Animated.Text
        className={className}
        style={[{ textAlign }, inStyle]}
        numberOfLines={1}
        accessibilityRole={header ? "header" : undefined}
      >
        {shown}
      </Animated.Text>
      {out != null ? (
        <Animated.Text
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          className={cn("absolute left-0 right-0 top-0", className)}
          style={[{ textAlign }, outStyle]}
          numberOfLines={1}
        >
          {out}
        </Animated.Text>
      ) : null}
    </View>
  );
}

/**
 * AppBar — navigation bar: back slot, centered title (or large title),
 * trailing action icons. Safe-area aware.
 *   <AppBar title="Album" showBack backLabel="Albums" onBack={goBack}
 *           actions={[{ icon: "share", accessibilityLabel: "Share" }]} />
 * Expo Go compatible.
 */
/** Translucent bars use Lumio glass (the native LiquidGlassView on iOS 26+
 *  when installed, frosted backdrop-blur fallback); solid bars keep the theme
 *  surface. The border keeps its separator role in both modes. */
const BarSurface = forwardRef<
  React.ElementRef<typeof View>,
  Omit<ViewProps, "className"> & {
    translucent?: boolean;
    bordered?: boolean;
    safeAreaTop: number;
    scrollY?: SharedValue<number>;
    className?: string;
  }
>(function BarSurface(
  { translucent, bordered, safeAreaTop, scrollY, className, children, ...props },
  ref
) {
  const lightStyle = useScrollLight(scrollY);
  if (scrollY) {
    // Light follows scroll — the material and its hairline are layers whose
    // opacity is the scroll offset, so the bar is clear over the hero and
    // fully frosted by the time content runs under it.
    return (
      <View
        ref={ref}
        className={cn("w-full", className)}
        style={safeAreaTop ? { paddingTop: safeAreaTop } : undefined}
        accessibilityRole="toolbar"
        {...props}
      >
        <Animated.View pointerEvents="none" className="absolute inset-0" style={lightStyle}>
          {translucent ? (
            <Glass effect="regular" className="h-full w-full" />
          ) : (
            <View className="h-full w-full bg-background" />
          )}
        </Animated.View>
        {children}
        {bordered ? (
          <Animated.View
            pointerEvents="none"
            className="absolute bottom-0 left-0 right-0 h-px bg-border"
            style={lightStyle}
          />
        ) : null}
      </View>
    );
  }
  if (translucent) {
    return (
      <Glass
        ref={ref}
        effect="regular"
        className={cn(
          "w-full",
          bordered && "border-b border-border",
          className
        )}
        style={safeAreaTop ? { paddingTop: safeAreaTop } : undefined}
        accessibilityRole="toolbar"
        {...props}
      >
        {children}
      </Glass>
    );
  }
  return (
    <View
      ref={ref}
      className={cn(
        "w-full",
        "bg-background",
        bordered && "border-b border-border",
        className
      )}
      style={safeAreaTop ? { paddingTop: safeAreaTop } : undefined}
      accessibilityRole="toolbar"
      {...props}
    >
      {children}
    </View>
  );
});

export const AppBarRoot = forwardRef<React.ElementRef<typeof View>, AppBarProps>(
  function AppBar(
    {
      title,
      subtitle,
      size = "small",
      showBack = false,
      backLabel = "Back",
      onBack,
      leading,
      actions,
      trailing,
      safeArea = true,
      bordered = true,
      translucent = false,
      haptic = "light",
      className,
      floating = false,
      scrollY,
      ...props
    },
    ref,
  ) {
    const insets = useSafeAreaInsets();
    const { scheme } = useTheme();
    const frostStyle = useScrollLight(scrollY, CAPSULE_FROST);
    const large = size === "large";
    const glassBar = floating || translucent;
    // The centered title clears whichever side slot is wider — a fixed inset
    // collides with a back label + three trailing actions. Both sides use the
    // same inset so the title stays optically centered on the bar.
    const [sideW, setSideW] = React.useState({ l: 0, r: 0 });
    const titleInset = Math.max(64, sideW.l, sideW.r) + 4;

    const barRow = (
      <View className="min-h-11 w-full flex-row items-center justify-between px-1">
        <View
          className="min-w-11 flex-row items-center"
          onLayout={(e) => {
            const l = Math.round(e.nativeEvent.layout.width);
            setSideW((p) => (p.l === l ? p : { ...p, l }));
          }}
        >
          {leading ??
            (showBack ? (
              glassBar ? (
                <Glass interactive effect="clear" className="rounded-full">
                  <AppBarBack label={backLabel} onPress={onBack} haptic={haptic} tone="foreground" />
                </Glass>
              ) : (
                <AppBarBack label={backLabel} onPress={onBack} haptic={haptic} />
              )
            ) : null)}
        </View>

        {title != null && !large ? (
          <View
            pointerEvents="none"
            className="absolute bottom-0 top-0 items-center justify-center"
            style={{ left: titleInset, right: titleInset }}
          >
            <SwapText
              text={title}
              header
              className="text-[17px] font-semibold leading-tight text-foreground"
            />
            {subtitle != null ? (
              <SwapText text={subtitle} className="text-xs leading-tight text-muted-foreground" />
            ) : null}
          </View>
        ) : null}

        <View
          className="min-w-11 flex-row items-center justify-end"
          onLayout={(e) => {
            const r = Math.round(e.nativeEvent.layout.width);
            setSideW((p) => (p.r === r ? p : { ...p, r }));
          }}
        >
          {trailing ??
            (glassBar && actions && actions.length > 0 ? (
              /* Adjacent bar items share one glass — a union
                 container melts the action discs into a single pill. */
              <GlassContainer
                spacing={4}
                effect="clear"
                className="flex-row items-center rounded-full"
              >
                {actions.map((action, i) => (
                  <Glass
                    key={`${action.icon}-${i}`}
                    interactive
                    effect="clear"
                    className="rounded-full"
                  >
                    <AppBarAction {...action} haptic={haptic} tone="foreground" />
                  </Glass>
                ))}
              </GlassContainer>
            ) : (
              actions?.map((action, i) => (
                <AppBarAction key={`${action.icon}-${i}`} {...action} haptic={haptic} />
              ))
            ))}
        </View>
      </View>
    );

    if (floating) {
      // Island bar — a glass capsule hovering over the content, no edge
      // background or hairline at all.
      return (
        <View
          ref={ref}
          className={cn("w-full px-3", className)}
          style={safeArea ? { paddingTop: insets.top + 6 } : undefined}
          {...props}
        >
          <Glass effect="regular" className="w-full rounded-full">
            {/* Frost thickens as content scrolls under the capsule. */}
            {scrollY ? (
              <Animated.View
                pointerEvents="none"
                className="absolute inset-0 rounded-full bg-background"
                style={frostStyle}
              />
            ) : null}
            {barRow}
            {large && title != null ? (
              <LargeTitle title={title} subtitle={subtitle} />
            ) : null}
            {/* Lit from above — the capsule's top edge catches light in dark scheme. */}
            {scheme === "dark" ? <LitEdge radius={999} /> : null}
          </Glass>
        </View>
      );
    }

    return (
      <BarSurface
        ref={ref}
        translucent={translucent}
        bordered={bordered}
        safeAreaTop={safeArea ? insets.top : 0}
        scrollY={scrollY}
        className={className}
        {...props}
      >
        {barRow}

        {/* Large title — the oversized heading parks under the row and
            collapses it into the inline slot on scroll. This bar renders it
            STATICALLY on purpose: scroll-linked collapse lives in
            CollapsibleHeader — use that component instead of stacking both. */}
        {large && title != null ? (
          <LargeTitle title={title} subtitle={subtitle} />
        ) : null}
      </BarSurface>
    );
  },
);

/** Large title + subtitle under the row; both swap in place on change. */
function LargeTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View className="w-full px-4 pb-2 pt-0.5">
      <SwapText
        text={title}
        header
        align="left"
        className="text-[34px] font-bold leading-10 text-foreground"
      />
      {subtitle != null ? (
        <SwapText text={subtitle} align="left" className="text-sm leading-tight text-muted-foreground" />
      ) : null}
    </View>
  );
}

/** Control tint — "primary" (the accent, classic solid bars) or
 *  "foreground" (monochrome glass capsules over content). */
type AppBarTone = "primary" | "foreground";

export interface AppBarBackProps {
  /** Visible label next to the chevron. Default "Back". */
  label?: string;
  /** Chevron + label tint. Default "primary"; glass bars pass "foreground". */
  tone?: AppBarTone;
  onPress?: () => void;
  haptic?: "light" | "selection" | false;
  className?: string;
  accessibilityLabel?: string;
}

/** Back chevron + label — also usable standalone in the `leading` slot. */
// Refs land on the Pressable host instance inside AnimatedPressable
// (React.ElementRef<typeof AnimatedPressable> isn't valid — the shared
// singleton is typed ComponentType, not a ref-forwarding component).
export const AppBarBack = forwardRef<React.ElementRef<typeof Pressable>, AppBarBackProps>(
  function AppBarBack({ label = "Back", tone = "primary", onPress, haptic = "light", className, accessibilityLabel }, ref) {
    const haptics = useHaptic();
    const press = usePressAnimation({ pressedScale: 0.94, pressedOpacity: 0.6 });
    return (
      <AnimatedPressable
        ref={ref}
        onPress={() => {
          if (haptic) haptics[haptic]();
          onPress?.();
        }}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        style={press.animatedStyle}
        hitSlop={8}
        className={cn("h-11 flex-row items-center gap-0.5 pr-2", className)}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? `Back${label && label !== "Back" ? ` to ${label}` : ""}`}
      >
        <Icon name="chevron-left" size="lg" color={tone === "foreground" ? "foreground" : "primaryText"} />
        {label ? (
          <Text
            className={cn("text-[17px] leading-tight", tone === "foreground" ? "text-foreground" : "text-primary-text")}
            numberOfLines={1}
          >
            {label}
          </Text>
        ) : null}
      </AnimatedPressable>
    );
  },
);

export interface AppBarActionProps extends AppBarActionItem {
  haptic?: "light" | "selection" | false;
  /** Icon tint. Default "primary"; glass bars pass "foreground". */
  tone?: AppBarTone;
  className?: string;
}

/** Trailing action icon button — also usable standalone in the `trailing` slot. */
export const AppBarAction = forwardRef<React.ElementRef<typeof Pressable>, AppBarActionProps>(
  function AppBarAction(
    { icon, accessibilityLabel, onPress, disabled, active, haptic = "light", tone = "primary", className },
    ref,
  ) {
    const haptics = useHaptic();
    const reduce = useReducedMotion();
    const press = usePressAnimation({ pressedScale: 0.9, pressedOpacity: 0.6, disabled });
    const wash = useSharedValue(0);
    const glyph = useSharedValue(1);
    const was = React.useRef(active);
    React.useEffect(() => {
      // Commit — act, hold, resolve: the wash ignites, holds a beat, dims;
      // the glyph dips and re-ignites filled. Turning off just dims back.
      if (active && !was.current) {
        wash.value = withSequence(
          withTiming(1, { ...timing.fast, easing: Easing.bezier(...ease.out) }),
          withDelay(WASH_HOLD, withTiming(0, { ...timing.normal, easing: Easing.bezier(...ease.in) }))
        );
        if (!reduce) {
          glyph.value = withSequence(withTiming(COMMIT_DIP, timing.instant), withSpring(1, spring.swap));
        }
      }
      was.current = active;
    }, [active, reduce, wash, glyph]);
    const washStyle = useAnimatedStyle(() => ({ opacity: wash.value * WASH_PEAK }));
    const glyphStyle = useAnimatedStyle(() => ({ transform: [{ scale: glyph.value }] }));
    return (
      <AnimatedPressable
        ref={ref}
        disabled={disabled}
        onPress={() => {
          if (disabled) return;
          if (haptic) haptics[haptic]();
          onPress?.();
        }}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        style={press.animatedStyle}
        className={cn(
          "h-11 min-w-11 items-center justify-center px-1",
          disabled && "opacity-40",
          className,
        )}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={active === undefined ? { disabled: !!disabled } : { disabled: !!disabled, selected: active }}
      >
        <Animated.View
          pointerEvents="none"
          className="absolute h-10 w-10 rounded-full bg-primary"
          style={washStyle}
        />
        <Animated.View style={glyphStyle}>
          <Icon
            name={icon}
            size="md"
            filled={!!active}
            color={tone === "foreground" ? "foreground" : "primaryText"}
          />
        </Animated.View>
      </AnimatedPressable>
    );
  },
);

/** Large/inline title for children-first composition in the `leading`/`trailing` slots. */
export const AppBarTitle = forwardRef<React.ElementRef<typeof Text>, { children?: React.ReactNode; className?: string }>(
  function AppBarTitle({ children, className }, ref) {
    return (
      <Text
        ref={ref}
        className={cn("text-[17px] font-semibold leading-tight text-foreground", className)}
        numberOfLines={1}
        accessibilityRole="header"
      >
        {children}
      </Text>
    );
  },
);

export const AppBar = Object.assign(AppBarRoot, {
  Back: AppBarBack,
  Action: AppBarAction,
  Title: AppBarTitle,
});

AppBar.displayName = "AppBar";
AppBarBack.displayName = "AppBar.Back";
AppBarAction.displayName = "AppBar.Action";
AppBarTitle.displayName = "AppBar.Title";
