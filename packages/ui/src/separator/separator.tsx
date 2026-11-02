import * as React from "react";
import { forwardRef } from "react";
import { View, type ViewProps } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated";
import Svg, { Line } from "react-native-svg";
import { cn, ease, timing, useReducedMotion, useTheme } from "@lumioui/core";

export interface SeparatorProps extends ViewProps {
  orientation?: "horizontal" | "vertical";
  /**
   * Hide the rule from assistive tech (default true). Set `decorative={false}`
   * to expose it as a semantic separator — e.g. when it carries meaning
   * between landmark sections rather than pure decoration.
   */
  decorative?: boolean;
  /**
   * Draw the rule on mount: it grows from its leading edge (top for vertical)
   * so a receipt or page build reads as structure switching on. Default false.
   */
  draw?: boolean;
  /** With `draw`: wait before drawing, in ms — use the rule's band slot (e.g. 120 × band). */
  drawDelay?: number;
  /**
   * Perforated tear line — a row of punched holes for tickets, passes and
   * receipt stubs, instead of the hairline. Default false.
   */
  perforated?: boolean;
  className?: string;
}

/** Hole pitch and size of the perforated line, in points. */
const HOLE_GAP = 6;
const HOLE_SIZE = 2;
/** Holes sit a step lighter than body ink so the line reads as punched, not printed. */
const HOLE_ALPHA = 0.45;

/** The drawn or perforated rule — only these opt-in looks pay for theme and motion hooks. */
function RuleFace({ horizontal, draw, drawDelay, perforated }: { horizontal: boolean; draw: boolean; drawDelay: number; perforated: boolean }) {
  const { colors } = useTheme();
  const reduce = useReducedMotion();
  const p = useSharedValue(draw ? 0 : 1);
  React.useEffect(() => {
    if (!draw) return;
    // The hairline grows from its leading edge on the ignite curve.
    p.value = withDelay(drawDelay, withTiming(1, { ...timing.normal, easing: Easing.bezier(...ease.out) }));
  }, [draw, drawDelay, p]);
  // Reduced motion: the rule switches on in place (opacity only, no growth).
  const drawStyle = useAnimatedStyle(() =>
    reduce
      ? { opacity: p.value }
      : { opacity: Math.min(1, p.value * 3), transform: [horizontal ? { scaleX: p.value } : { scaleY: p.value }] }
  );
  const origin = { transformOrigin: horizontal ? "left" : "top" } as const;
  return (
    <Animated.View
      className={cn("absolute inset-0", perforated ? "" : "bg-border")}
      style={draw ? [origin, drawStyle] : undefined}
    >
      {perforated ? (
        <Svg width="100%" height="100%">
          <Line
            x1={horizontal ? HOLE_SIZE : "50%"}
            y1={horizontal ? "50%" : HOLE_SIZE}
            x2={horizontal ? "100%" : "50%"}
            y2={horizontal ? "50%" : "100%"}
            stroke={colors.mutedForeground}
            strokeOpacity={HOLE_ALPHA}
            strokeWidth={HOLE_SIZE}
            strokeLinecap="round"
            strokeDasharray={`0.01 ${HOLE_GAP}`}
          />
        </Svg>
      ) : null}
    </Animated.View>
  );
}

export const Separator = forwardRef<React.ElementRef<typeof View>, SeparatorProps>(
  function Separator(
    { orientation = "horizontal", decorative = true, draw = false, drawDelay = 0, perforated = false, className, style, ...props },
    ref
  ) {
    const horizontal = orientation === "horizontal";
    const a11y = {
      // Decorative rule — hidden from the a11y tree (divider pattern).
      // When decorative={false} it's exposed with role "separator" (RN's
      // accessibilityRole union lacks "separator" — `role` is the typed
      // path; RNW forwards it as the ARIA role).
      // RNW ignores accessibilityElementsHidden, so aria-hidden too.
      accessible: !decorative,
      accessibilityElementsHidden: decorative,
      importantForAccessibility: decorative ? ("no" as const) : ("yes" as const),
      "aria-hidden": decorative,
      role: decorative ? undefined : ("separator" as const),
    };

    // The plain hairline renders exactly as it always has.
    if (!draw && !perforated) {
      return (
        <View
          ref={ref}
          className={cn("bg-border shrink-0", horizontal ? "h-px w-full" : "h-full w-px", className)}
          {...a11y}
          style={style}
          {...props}
        />
      );
    }

    return (
      <View
        ref={ref}
        className={cn(
          "shrink-0",
          horizontal ? (perforated ? "h-1 w-full" : "h-px w-full") : perforated ? "h-full w-1" : "h-full w-px",
          className
        )}
        {...a11y}
        style={style}
        {...props}
      >
        <RuleFace horizontal={horizontal} draw={draw} drawDelay={drawDelay} perforated={perforated} />
      </View>
    );
  }
);

Separator.displayName = "Separator";
