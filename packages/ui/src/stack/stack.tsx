import * as React from "react";
import { forwardRef } from "react";
import { View, type ViewProps, type ViewStyle } from "react-native";

type FlexAlignType = NonNullable<ViewStyle["alignItems"]>;
import Animated, { FadeIn, FadeOut, LinearTransition } from "react-native-reanimated";
import { BAND_STAGGER, SwitchOn, cn, rowDelay, spring, timing, useReducedMotion } from "@lumioui/core";

/**
 * Stack — layout primitives.
 *   <VStack gap={12} align="center">…</VStack>
 *   <HStack gap={8} justify="between">…</HStack>
 *   <Spacer />
 *   <Box className="p-4">…</Box>
 *
 * Opt-in switch-on (DESIGN-TASTE §5c rule 6):
 *   <VStack reveal="bands">…</VStack>   each direct child switches on 120ms apart
 *   <VStack reveal="rows">…</VStack>    40ms apart, capped at 300ms
 *   <VStack animateLayout>…</VStack>    inserts ignite, removals dim, the rest reflow
 * Without these props a stack is a plain View — nothing is wrapped.
 */

type Align = "start" | "center" | "end" | "stretch" | "baseline";
type Justify = "start" | "center" | "end" | "between" | "around" | "evenly";

const alignMap: Record<Align, FlexAlignType> = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  stretch: "stretch",
  baseline: "baseline",
};

const justifyMap: Record<Justify, ViewStyle["justifyContent"]> = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  between: "space-between",
  around: "space-around",
  evenly: "space-evenly",
};

export interface StackProps extends ViewProps {
  /** Gap between children in px (applied via style for reliability). */
  gap?: number;
  /** Cross-axis alignment. */
  align?: Align;
  /** Main-axis distribution. */
  justify?: Justify;
  className?: string;
  /**
   * Switch each direct child on as the stack mounts: children start dim
   * (readable) with a 6px rise and brighten in order — "bands" on the 120ms
   * page rhythm, "rows" on the 40ms list rhythm (capped at 300ms). Each
   * child is wrapped in its own view, so `flex-1` children should carry
   * their sizing on an outer element. Reduced motion keeps the brightening.
   */
  reveal?: "bands" | "rows";
  /**
   * Inserted children ignite in place, removed children dim out, and the
   * siblings reflow on `spring.layout`. Children are wrapped like `reveal`.
   */
  animateLayout?: boolean;
}

/** Exits dim on the recede beat; inserts ignite on the fast one. */
const ENTER = FadeIn.duration(timing.fast.duration);
const EXIT = FadeOut.duration(timing.recede.duration);

/** True once the stack has mounted — children that appear after it are inserts. */
function useMounted(enabled: boolean) {
  const [mounted, setMounted] = React.useState(false);
  // Plain stacks never re-render for this.
  React.useEffect(() => {
    if (enabled) setMounted(true);
  }, [enabled]);
  return mounted;
}

/** One wrapped child. Its delay is fixed at mount so a later reorder never re-dims it. */
function StackItem({
  delay,
  late,
  reveal,
  animateLayout,
  children,
}: {
  delay: number;
  late: boolean;
  reveal: boolean;
  animateLayout: boolean;
  children: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  // An insert ignites at once; children present at mount keep their place in the order.
  const [insert] = React.useState(late);
  const [startAt] = React.useState(late ? 0 : delay);
  const inner = reveal ? <SwitchOn delay={startAt}>{children}</SwitchOn> : children;
  if (!animateLayout) return <>{inner}</>;
  return (
    <Animated.View
      entering={insert ? ENTER : undefined}
      exiting={EXIT}
      layout={reduce ? undefined : LinearTransition.springify().damping(spring.layout.damping).stiffness(spring.layout.stiffness)}
    >
      {inner}
    </Animated.View>
  );
}

/** Wraps direct children only when a motion prop asks for it. */
function wrapChildren(
  children: React.ReactNode,
  reveal: StackProps["reveal"],
  animateLayout: boolean | undefined,
  mounted: boolean
) {
  if (!reveal && !animateLayout) return children;
  const items = React.Children.toArray(children).map((child, i) => (
    <StackItem
      key={React.isValidElement(child) && child.key != null ? child.key : i}
      delay={reveal === "bands" ? i * BAND_STAGGER : rowDelay(i)}
      late={mounted}
      reveal={reveal != null}
      animateLayout={!!animateLayout}
    >
      {child}
    </StackItem>
  ));
  return items;
}

export const VStack = forwardRef<React.ElementRef<typeof View>, StackProps>(
  function VStack({ gap, align, justify, className, style, reveal, animateLayout, children, ...props }, ref) {
    const mounted = useMounted(!!reveal || !!animateLayout);
    const content = wrapChildren(children, reveal, animateLayout, mounted);
    return (
      <View
        ref={ref}
        className={cn("flex-col", className)}
        // Consumer style first — explicit gap/align/justify props come last
        // so they always win over className utilities and inline style.
        style={[
          style,
          gap != null && { gap },
          align != null && { alignItems: alignMap[align] },
          justify != null && { justifyContent: justifyMap[justify] },
        ]}
        {...props}
      >
        {content}
      </View>
    );
  }
);

export const HStack = forwardRef<React.ElementRef<typeof View>, StackProps>(
  function HStack({ gap, align, justify, className, style, reveal, animateLayout, children, ...props }, ref) {
    const mounted = useMounted(!!reveal || !!animateLayout);
    const content = wrapChildren(children, reveal, animateLayout, mounted);
    return (
      <View
        ref={ref}
        className={cn("flex-row", className)}
        // Same precedence as VStack: explicit props beat style and className.
        style={[
          style,
          gap != null && { gap },
          align != null && { alignItems: alignMap[align] },
          justify != null && { justifyContent: justifyMap[justify] },
        ]}
        {...props}
      >
        {content}
      </View>
    );
  }
);

export const Spacer = forwardRef<React.ElementRef<typeof View>, ViewProps & { className?: string }>(
  function Spacer({ className, ...props }, ref) {
    return (
      <View
        ref={ref}
        className={cn("flex-1", className)}
        accessibilityElementsHidden
        importantForAccessibility="no"
        aria-hidden
        {...props}
      />
    );
  }
);

export const Box = forwardRef<React.ElementRef<typeof View>, ViewProps & { className?: string }>(
  function Box({ className, ...props }, ref) {
    return <View ref={ref} className={cn(className)} {...props} />;
  }
);

VStack.displayName = "VStack";
HStack.displayName = "HStack";
Spacer.displayName = "Spacer";
Box.displayName = "Box";
