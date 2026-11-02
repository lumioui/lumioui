import * as React from "react";
import { forwardRef, useEffect } from "react";
import { View, type GestureResponderEvent, type Pressable, type PressableProps } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withDelay,
  withSpring,
  withTiming,
  interpolateColor,
  Easing,
} from "react-native-reanimated";
import Svg, { Defs, Mask, Rect } from "react-native-svg";
import {
  cn,
  ease,
  useTheme,
  useHaptic,
  useReducedMotion,
  usePressAnimation,
  spring,
  timing,
  AnimatedPressable,
  AnimatedCircle,
  AnimatedLine,
  LightPool,
} from "@lumioui/core";

/**
 * ThemeToggle — lights out / lights on. The glyph performs the change:
 *   <ThemeToggle />
 *   <ThemeToggle variant="pill" />
 *   <ThemeToggle variant="switch" />
 *   <ThemeToggle onSchemeChange={(next, e) => reveal.current?.reveal(e, bg[next])} />
 *
 * The sun is drawn as a disc and eight rays. Going dark: the rays dim toward
 * the centre (timing.recede, ease.in) while a shadow disc slides 6px across
 * the core on spring.swap, so the sun becomes the crescent — no icon
 * crossfade. Going light: a small accent pool brightens at the toggle first
 * (timing.instant), the shadow slides off and the rays draw back on 40ms
 * apart. Pass `onSchemeChange` to let the new scheme flood out of the toggle
 * (e.g. with CircleReveal: flood tempo.settle, content ignites 160ms after);
 * without it the toggle sets the ThemeProvider override itself. Reduced
 * motion keeps the light and colour, drops the slide and the ray travel.
 */

export type ThemeToggleVariant = "icon" | "pill" | "switch";
export type ThemeScheme = "light" | "dark";

export interface ThemeToggleProps extends Omit<PressableProps, "children"> {
  /** Visual style. Default "icon". */
  variant?: ThemeToggleVariant;
  /** Controlled scheme. Default: the ThemeProvider's scheme. */
  scheme?: ThemeScheme;
  /** Called with the next scheme and the press — use it to flood the new
   *  scheme out of the toggle. When set, the toggle does not change the
   *  ThemeProvider override itself. */
  onSchemeChange?: (next: ThemeScheme, event: GestureResponderEvent) => void;
  /** Accessible label. Default announces the action — "Switch to
   * light theme" / "Switch to dark theme" based on current state. */
  accessibilityLabel?: string;
  className?: string;
}

// Same proportions as Switch (51×31 track, 27pt thumb) so the switch
// variant sits in a settings row beside a Switch without looking off.
const TRACK_WIDTH = 51;
const THUMB_SIZE = 27;
const TRACK_PADDING = 2;
const THUMB_TRAVEL = TRACK_WIDTH - THUMB_SIZE - TRACK_PADDING * 2;

/** Track colour shift — an in-place state change. */
const TINT_SHIFT = { duration: timing.fast.duration, easing: Easing.bezier(...ease.inOut) };
const RAY_DIM = { duration: timing.recede.duration, easing: Easing.bezier(...ease.in) };
const RAY_IGNITE = { duration: timing.fast.duration, easing: Easing.bezier(...ease.out) };
/** Rays come back one at a time on the row rhythm. */
const RAY_STAGGER = 40;
/** Light leads going light: the pool brightens this long before the flood. */
const LIGHT_LEAD = timing.instant.duration;
/** Without a flood host the scheme commits once the glyph has performed. */
const COMMIT_AFTER = timing.normal.duration;

// Glyph geometry on a 24 grid.
const SUN_R = 4.5;
const MOON_R = 7;
/** The shadow disc slides this far across the core to make the crescent. */
const SHADOW_SLIDE = 6;
const SHADOW_R = 6;
const SHADOW_OFF_X = 12 + SUN_R + SHADOW_R + 1.5;
const SHADOW_Y = 9;
const RAYS = Array.from({ length: 8 }, (_, i) => (i * Math.PI) / 4);

function Ray({ angle, index, on, color, reduce }: { angle: number; index: number; on: boolean; color: string; reduce: boolean }) {
  const t = useSharedValue(on ? 1 : 0);
  const first = React.useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    t.value = on ? withDelay(index * RAY_STAGGER, withTiming(1, RAY_IGNITE)) : withTiming(0, RAY_DIM);
  }, [on, index, t]);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const props = useAnimatedProps(() => {
    // Rays collapse toward the core as they dim; reduced motion only dims.
    const k = reduce ? 1 : t.value;
    const inner = 5 + 2.5 * k;
    const outer = 5 + 5 * k;
    return {
      x1: 12 + cos * inner,
      y1: 12 + sin * inner,
      x2: 12 + cos * outer,
      y2: 12 + sin * outer,
      opacity: t.value,
    };
  });
  return <AnimatedLine animatedProps={props} stroke={color} strokeWidth={2} strokeLinecap="round" />;
}

/** Sun ↔ crescent, one drawing. */
function SunMoon({ dark, size, color }: { dark: boolean; size: number; color: string }) {
  const reduce = useReducedMotion();
  const id = React.useId().replace(/[^a-zA-Z0-9]/g, "");
  const phase = useSharedValue(dark ? 1 : 0);
  useEffect(() => {
    phase.value = reduce ? withTiming(dark ? 1 : 0, timing.fast) : withSpring(dark ? 1 : 0, spring.swap);
  }, [dark, reduce, phase]);
  const coreProps = useAnimatedProps(() => ({ r: SUN_R + (MOON_R - SUN_R) * phase.value }));
  const shadowProps = useAnimatedProps(() => ({ cx: SHADOW_OFF_X - SHADOW_SLIDE * phase.value }));
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Defs>
        <Mask id={id} x="0" y="0" width="24" height="24" maskUnits="userSpaceOnUse">
          <Rect x="0" y="0" width="24" height="24" fill="#FFFFFF" />
          <AnimatedCircle animatedProps={shadowProps} cy={SHADOW_Y} r={SHADOW_R} fill="#000000" />
        </Mask>
      </Defs>
      <AnimatedCircle animatedProps={coreProps} cx={12} cy={12} fill={color} mask={`url(#${id})`} />
      {RAYS.map((a, i) => (
        <Ray key={i} angle={a} index={i} on={!dark} color={color} reduce={reduce} />
      ))}
    </Svg>
  );
}

export const ThemeToggle = forwardRef<React.ElementRef<typeof Pressable>, ThemeToggleProps>(
  function ThemeToggle({ variant = "icon", scheme: controlled, onSchemeChange, accessibilityLabel, className, ...props }, ref) {
    const { scheme: themeScheme, setSchemeOverride, colors } = useTheme();
    const haptics = useHaptic();
    const reduce = useReducedMotion();
    // Shared across variants — only one pressable renders at a time.
    const press = usePressAnimation({ pressedScale: 0.94 });
    const isDark = (controlled ?? themeScheme) === "dark";
    // The glyph performs on press, ahead of the scheme commit.
    const [acting, setActing] = React.useState<boolean | null>(null);
    const shownDark = acting ?? isDark;
    if (acting !== null && acting === isDark) setActing(null);
    const [pool, setPool] = React.useState(false);
    // The icons and pill text are hidden from AT, so the label carries the
    // state — announce the action a press will take, not a static role.
    const stateLabel = accessibilityLabel ?? (isDark ? "Switch to light theme" : "Switch to dark theme");

    const tint = useSharedValue(isDark ? 1 : 0);
    const thumbX = useSharedValue(isDark ? THUMB_TRAVEL : 0);
    // Held state — the switch-variant thumb squishes and leans like Switch.
    const thumbPressed = useSharedValue(0);

    useEffect(() => {
      tint.value = withTiming(shownDark ? 1 : 0, TINT_SHIFT);
      thumbX.value = reduce
        ? shownDark ? THUMB_TRAVEL : 0
        : withSpring(shownDark ? THUMB_TRAVEL : 0, spring.switch);
    }, [shownDark, reduce, tint, thumbX]);

    const timers = React.useRef<ReturnType<typeof setTimeout>[]>([]);
    useEffect(() => () => timers.current.forEach(clearTimeout), []);

    const thumbStyle = useAnimatedStyle(() => {
      const stretch = 1 + thumbPressed.value * 0.15;
      const squish = 1 - thumbPressed.value * 0.1;
      const lean = thumbPressed.value * (thumbX.value < THUMB_TRAVEL / 2 ? 2 : -2);
      return {
        transform: [{ translateX: thumbX.value + lean }, { scaleX: stretch }, { scaleY: squish }],
      };
    });

    // Track colour shifts on its own short clock while the thumb lands.
    const trackStyle = useAnimatedStyle(() => ({
      backgroundColor: interpolateColor(tint.value, [0, 1], [colors.muted, colors.primary]),
    }));

    const handlePress = (e: GestureResponderEvent) => {
      haptics.selection();
      const next: ThemeScheme = isDark ? "light" : "dark";
      setActing(next === "dark");
      e.persist?.();
      if (next === "light") {
        // Lights on: the pool brightens at the toggle before the flood.
        setPool(true);
        timers.current.push(setTimeout(() => setPool(false), timing.slow.duration + timing.normal.duration));
      }
      const commit = () => {
        if (onSchemeChange) onSchemeChange(next, e);
        else setSchemeOverride(next);
      };
      const wait = onSchemeChange ? (next === "light" ? LIGHT_LEAD : 0) : COMMIT_AFTER;
      if (wait) timers.current.push(setTimeout(commit, wait));
      else commit();
    };

    const handlePressIn = () => {
      press.onPressIn();
      if (!reduce) thumbPressed.value = withSpring(1, spring.press);
    };
    const handlePressOut = () => {
      press.onPressOut();
      if (!reduce) thumbPressed.value = withSpring(0, spring.press);
    };

    const a11y = {
      accessibilityRole: "switch" as const,
      accessibilityLabel: stateLabel,
      accessibilityState: { checked: isDark },
      // accessibilityState isn't forwarded to the DOM on web — mirror it.
      "aria-checked": isDark,
    };

    const lightPool = (size: number) => (
      <LightPool
        on={pool}
        size={size}
        color={colors.primary}
        strength={0.5}
        className="absolute"
        style={{ left: "50%", top: "50%", marginLeft: -size / 2, marginTop: -size / 2 }}
      />
    );

    if (variant === "pill") {
      return (
        <AnimatedPressable
          ref={ref}
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={press.animatedStyle}
          {...a11y}
          className={cn("h-11 flex-row items-center gap-2 rounded-full bg-secondary px-3", className)}
          {...props}
        >
          <View className="h-4 w-4 items-center justify-center" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            {lightPool(64)}
            <SunMoon dark={shownDark} size={16} color={colors.foreground} />
          </View>
          <Animated.Text className="text-sm font-medium text-foreground" accessibilityElementsHidden>
            {shownDark ? "Dark" : "Light"}
          </Animated.Text>
        </AnimatedPressable>
      );
    }

    if (variant === "switch") {
      return (
        <AnimatedPressable
          ref={ref}
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          {...a11y}
          className={cn("justify-center rounded-full", className)}
          style={[{ width: TRACK_WIDTH, height: THUMB_SIZE + TRACK_PADDING * 2 }, trackStyle, press.animatedStyle]}
          hitSlop={8}
          {...props}
        >
          <Animated.View
            style={[
              {
                width: THUMB_SIZE,
                height: THUMB_SIZE,
                borderRadius: THUMB_SIZE / 2,
                // Keep the thumb tied to the active track foreground so
                // custom themes do not inherit an arbitrary white surface.
                backgroundColor: colors.primaryForeground,
                marginLeft: TRACK_PADDING,
                alignItems: "center",
                justifyContent: "center",
                // The thumb's contact shadow — the only thing separating a
                // white thumb from a pale track in light mode.
                shadowColor: "#000",
                shadowOpacity: 0.15,
                shadowRadius: 3,
                shadowOffset: { width: 0, height: 2 },
                elevation: 2,
              },
              thumbStyle,
            ]}
          >
            <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <SunMoon dark={shownDark} size={16} color={colors.primary} />
            </View>
          </Animated.View>
        </AnimatedPressable>
      );
    }

    // Default icon variant
    return (
      <AnimatedPressable
        ref={ref}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={press.animatedStyle}
        {...a11y}
        className={cn("h-11 w-11 items-center justify-center rounded-full", className)}
        hitSlop={4}
        {...props}
      >
        <View className="items-center justify-center" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {lightPool(88)}
          <SunMoon dark={shownDark} size={24} color={colors.foreground} />
        </View>
      </AnimatedPressable>
    );
  }
);

ThemeToggle.displayName = "ThemeToggle";
