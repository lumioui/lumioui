import * as React from "react";
import { forwardRef } from "react";
import { View, Text, type ViewProps } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { cn, ease, timing, useTheme } from "@lumioui/core";

/**
 * Divider — a hairline separator with an optional centered label.
 *   <Divider />
 *   <Divider label="or continue with" />
 *   <Divider label="or" seam />          lit seam: light gathers on the word
 *   <Divider label="or" seam lit />      brightened one step (e.g. while a path is pressed)
 *   <Divider orientation="vertical" />
 *
 * The plain rule is unchanged plumbing; the seam is opt-in.
 */

export interface DividerProps extends ViewProps {
  /** Text rendered in the middle of the line. */
  label?: string;
  /** Line direction. Default "horizontal". */
  orientation?: "horizontal" | "vertical";
  className?: string;
  /** Extra classes for the label text. */
  labelClassName?: string;
  /**
   * Labeled rule only: draw it as a lit seam — each rule fades in from its
   * outer end to full strength at the label. Default false.
   */
  seam?: boolean;
  /** Seam only: brighten the seam one step (crossfades over `timing.fast`). */
  lit?: boolean;
}

/** One step brighter: the lit seam lifts from border ink toward muted ink at this alpha. */
const LIT_STEP = 0.55;
/** Dark scheme: the seam carries a 1px highlight beneath it, like a lit edge. */
const DARK_HIGHLIGHT = 0.06;

const useGradientId = () => React.useId().replace(/[^a-zA-Z0-9]/g, "");

/** One half of the seam — transparent at the outer end, full at the label. */
function SeamRule({ side, lit }: { side: "left" | "right"; lit: boolean }) {
  const { colors, scheme } = useTheme();
  const base = useGradientId();
  const bright = useGradientId();
  const glow = useSharedValue(lit ? 1 : 0);
  React.useEffect(() => {
    glow.value = lit
      ? withTiming(1, { ...timing.fast, easing: Easing.bezier(...ease.out) })
      : withTiming(0, { ...timing.recede, easing: Easing.bezier(...ease.in) });
  }, [lit, glow]);
  const litStyle = useAnimatedStyle(() => ({ opacity: glow.value }));
  // Left rule brightens left → right toward the label; right rule the reverse.
  const left = side === "left";
  const grad = (id: string, color: string, alpha: number) => (
    <LinearGradient id={id} x1="0" y1="0" x2="1" y2="0">
      <Stop offset={0} stopColor={color} stopOpacity={left ? 0 : alpha} />
      <Stop offset={1} stopColor={color} stopOpacity={left ? alpha : 0} />
    </LinearGradient>
  );
  const dark = scheme === "dark";
  return (
    <View
      className="flex-1"
      style={{ height: dark ? 2 : 1 }}
      accessibilityElementsHidden
      importantForAccessibility="no"
      aria-hidden
    >
      <Svg width="100%" height={dark ? 2 : 1} style={{ position: "absolute" }}>
        <Defs>
          {grad(base, colors.border, 1)}
          {dark ? grad(`${base}h`, "#FFFFFF", DARK_HIGHLIGHT) : null}
        </Defs>
        <Rect x="0" y="0" width="100%" height={1} fill={`url(#${base})`} />
        {dark ? <Rect x="0" y="1" width="100%" height={1} fill={`url(#${base}h)`} /> : null}
      </Svg>
      <Animated.View style={[{ position: "absolute", left: 0, right: 0, top: 0, height: 1 }, litStyle]}>
        <Svg width="100%" height={1}>
          <Defs>{grad(bright, colors.mutedForeground, LIT_STEP)}</Defs>
          <Rect x="0" y="0" width="100%" height={1} fill={`url(#${bright})`} />
        </Svg>
      </Animated.View>
    </View>
  );
}

export const Divider = forwardRef<React.ElementRef<typeof View>, DividerProps>(
  function Divider(
    { label, orientation = "horizontal", className, labelClassName, seam = false, lit = false, ...props },
    ref
  ) {
    const horizontal = orientation === "horizontal";

    if (!horizontal) {
      // self-stretch only when the caller hasn't pinned a height — an
      // explicit h-* class must win over alignSelf (style-order alone can't
      // express that, so detect the class and drop the stretch).
      const hasHeightClass = /(^|[\s:])h-/.test(className ?? "");
      return (
        <View
          ref={ref}
          className={cn("w-px bg-border", !hasHeightClass && "self-stretch", className)}
          accessibilityElementsHidden
          importantForAccessibility="no"
          aria-hidden
          {...props}
        />
      );
    }

    if (label == null) {
      return (
        <View
          ref={ref}
          className={cn("h-px w-full bg-border", className)}
          accessibilityElementsHidden
          importantForAccessibility="no"
          aria-hidden
          {...props}
        />
      );
    }

    return (
      <View
        ref={ref}
        className={cn("w-full flex-row items-center gap-3", className)}
        // The hairlines are hidden below, so the root carries the label as a
        // single text element — AT announces "or continue with" once.
        accessible
        accessibilityRole="text"
        accessibilityLabel={label}
        {...props}
      >
        {seam ? (
          <SeamRule side="left" lit={lit} />
        ) : (
          <View
            className="h-px flex-1 bg-border"
            accessibilityElementsHidden
            importantForAccessibility="no"
            aria-hidden
          />
        )}
        <Text
          className={cn("text-sm text-muted-foreground", labelClassName)}
          // The root already announces the label — hide the inner Text so
          // screen readers don't read it twice.
          accessibilityElementsHidden
          importantForAccessibility="no"
          aria-hidden
        >
          {label}
        </Text>
        {seam ? (
          <SeamRule side="right" lit={lit} />
        ) : (
          <View
            className="h-px flex-1 bg-border"
            accessibilityElementsHidden
            importantForAccessibility="no"
            aria-hidden
          />
        )}
      </View>
    );
  }
);

Divider.displayName = "Divider";
