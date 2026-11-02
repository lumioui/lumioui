import * as React from "react";
import { forwardRef, Children, isValidElement, cloneElement } from "react";
import { Text, View, type LayoutChangeEvent, type ViewProps } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { cn, ease, spring, timing, useReducedMotion } from "@lumioui/core";

/**
 * ButtonGroup — a horizontal row of connected Buttons sharing borders.
 *   <ButtonGroup>
 *     <Button variant="outline">Left</Button>
 *     <Button variant="outline">Right</Button>
 *   </ButtonGroup>
 * Pass `attached={false}` to render children with a gap instead.
 *
 * Selection: pass `value` / `defaultValue` (each child's React `key` is its
 * value) and the group becomes one control — a single rounded track with
 * short dividers between the answers, and an inset pill that glides to the
 * chosen one on the indicator spring while the label ink follows its
 * coverage on the UI thread. Dividers beside the pill dim away so the pill
 * never sits against a straight line.
 *   <ButtonGroup value={rsvp} onValueChange={setRsvp}>
 *     <Button key="yes" variant="outline">Going</Button> …
 *   </ButtonGroup>
 */

export interface ButtonGroupProps extends ViewProps {
  /** Attach buttons together (shared borders, merged radius). Default true. */
  attached?: boolean;
  /** Orientation of the group. Default "horizontal". */
  orientation?: "horizontal" | "vertical";
  /** Disable every child in the group. */
  disabled?: boolean;
  className?: string;
  /** Extra classes merged into each child element that accepts className. */
  itemClassName?: string;
  /** Selected child (matched against each child's React `key`). Controlled. */
  value?: string | null;
  /** Initial selection when uncontrolled. */
  defaultValue?: string | null;
  /** Fires when a child is pressed in selection mode, after its own onPress. */
  onValueChange?: (value: string) => void;
  children?: React.ReactNode;
}

type ChildShape = {
  className?: string;
  disabled?: boolean;
  pressedScale?: number;
  variant?: string;
  size?: "sm" | "md" | "lg" | "icon";
  textClassName?: string;
  children?: React.ReactNode;
  onPress?: (...args: never[]) => unknown;
  onLayout?: (e: LayoutChangeEvent) => void;
  accessibilityState?: Record<string, unknown>;
};

/** Label sizes mirror Button's own label scale so the lit copy sits exactly on it. */
const LABEL_SIZE = { sm: "text-sm", md: "text-base", lg: "text-[17px]", icon: "text-base" } as const;

/** Inset between the track's edge and the gliding pill (p-1). */
const TRACK_INSET = 4;
/** Divider height between answers — short, so it reads as a seam, not a wall. */
const DIVIDER_H = 18;

/** A seam between two answers; it dims away when either neighbour is chosen. */
function Divider({ x, hidden }: { x: number; hidden: boolean }) {
  const on = useSharedValue(hidden ? 0 : 1);
  React.useEffect(() => {
    on.value = withTiming(hidden ? 0 : 1, hidden ? { ...timing.recede, easing: Easing.bezier(...ease.in) } : { ...timing.fast, easing: Easing.bezier(...ease.out) });
  }, [hidden, on]);
  const style = useAnimatedStyle(() => ({ opacity: on.value }));
  return (
    <Animated.View
      pointerEvents="none"
      className="absolute bg-border"
      style={[{ left: x, width: 1, height: DIVIDER_H, top: "50%", marginTop: -DIVIDER_H / 2 }, style]}
    />
  );
}

/** Children.toArray prefixes keys (".$yes") — the value is the author's key. */
const valueOf = (key: React.Key | null) => (key == null ? null : String(key).replace(/^\.\$/, ""));

type Rect = { x: number; w: number };

export const ButtonGroup = forwardRef<React.ElementRef<typeof View>, ButtonGroupProps>(
  function ButtonGroup(
    {
      attached = true,
      orientation = "horizontal",
      disabled,
      className,
      itemClassName,
      value: controlled,
      defaultValue,
      onValueChange,
      children,
      accessibilityLabel,
      "aria-label": ariaLabel,
      ...props
    },
    ref
  ) {
    const reduce = useReducedMotion();
    const horizontal = orientation === "horizontal";
    const items = Children.toArray(children).filter(isValidElement);
    const count = items.length;

    const selecting = controlled !== undefined || defaultValue !== undefined || onValueChange != null;
    const [internal, setInternal] = React.useState<string | null>(defaultValue ?? null);
    const value = controlled !== undefined ? controlled : internal;
    const select = (v: string) => {
      if (controlled === undefined) setInternal(v);
      onValueChange?.(v);
    };

    // The gliding fill needs every label as text and a horizontal weld; other
    // shapes fall back to the selected child switching to the filled variant.
    const labels = items.map((c) => (c.props as ChildShape).children);
    const glides =
      selecting && attached && horizontal && labels.every((l) => typeof l === "string" || typeof l === "number");

    const [rects, setRects] = React.useState<(Rect | undefined)[]>([]);
    const measure = (i: number) => (e: LayoutChangeEvent) => {
      const { x, width } = e.nativeEvent.layout;
      setRects((prev) => {
        const cur = prev[i];
        if (cur && cur.x === x && cur.w === width) return prev;
        const next = prev.slice();
        next[i] = { x, w: width };
        return next;
      });
    };

    const selIndex = value == null ? -1 : items.findIndex((c) => valueOf(c.key) === value);
    const target = selIndex >= 0 ? rects[selIndex] : undefined;

    // Indicator — the light glides; label ink follows the fill because the lit
    // labels live inside the fill's clipping window.
    const x = useSharedValue(0);
    const w = useSharedValue(0);
    const on = useSharedValue(0);
    const placed = React.useRef(false);
    React.useEffect(() => {
      if (!glides) return;
      if (!target) {
        on.value = withTiming(0, { ...timing.recede, easing: Easing.bezier(...ease.in) });
        placed.current = false;
        return;
      }
      if (!placed.current || reduce) {
        x.value = target.x;
        w.value = target.w;
      } else {
        x.value = withSpring(target.x, spring.indicator);
        w.value = withSpring(target.w, spring.indicator);
      }
      placed.current = true;
      on.value = withTiming(1, { ...timing.fast, easing: Easing.bezier(...ease.out) });
    }, [glides, target, reduce, x, w, on]);
    const windowStyle = useAnimatedStyle(() => ({
      opacity: on.value,
      width: w.value,
      transform: [{ translateX: x.value }],
    }));
    const innerStyle = useAnimatedStyle(() => ({ transform: [{ translateX: -x.value }] }));

    // Group-level disabled propagates down; a child's own `disabled` is
    // respected when the group prop is unset.
    const childDisabled = (childProps: ChildShape) =>
      disabled === true ? true : childProps.disabled;

    const selectionProps = (child: React.ReactElement, i: number): Partial<ChildShape> => {
      if (!selecting) return {};
      const childProps = child.props as ChildShape;
      const v = valueOf(child.key);
      const selected = v != null && v === value;
      return {
        onPress: ((...args: never[]) => {
          childProps.onPress?.(...args);
          if (v != null) select(v);
        }) as ChildShape["onPress"],
        onLayout: (e: LayoutChangeEvent) => {
          measure(i)(e);
          childProps.onLayout?.(e);
        },
        accessibilityState: { ...childProps.accessibilityState, selected },
        // Without the glide the picked child carries the fill itself.
        ...(glides ? null : { variant: selected ? "default" : childProps.variant }),
      };
    };

    const content = glides
      ? // One track: the answers are transparent pills inside it; the track
        // draws the outline and the seams, the gliding pill draws the choice.
        items.map((child, i) => {
          const childProps = child.props as ChildShape;
          return cloneElement(child as React.ReactElement<ChildShape>, {
            className: cn(childProps.className, "rounded-full", itemClassName),
            disabled: childDisabled(childProps),
            pressedScale: 1,
            ...selectionProps(child, i),
            variant: "ghost",
          });
        })
      : attached
      ? items.map((child, i) => {
          const isFirst = i === 0;
          const isLast = i === count - 1;
          const positional = horizontal
            ? cn(
                "rounded-none",
                isFirst && "rounded-l-full",
                isLast && "rounded-r-full",
                !isFirst && "-ml-px"
              )
            : cn(
                "rounded-none",
                isFirst && "rounded-t-full",
                isLast && "rounded-b-full",
                !isFirst && "-mt-px"
              );
          const childProps = child.props as ChildShape;
          return cloneElement(child as React.ReactElement<ChildShape>, {
            className: cn(positional, childProps.className, itemClassName),
            disabled: childDisabled(childProps),
            // A scaled segment would open a gap in the weld — attached
            // children press via ink/sheen only.
            pressedScale: 1,
            ...selectionProps(child, i),
          });
        })
      : itemClassName || disabled != null || selecting
        ? items.map((child, i) => {
            const childProps = child.props as ChildShape;
            // cloneElement preserves the existing key — only classes merge.
            return cloneElement(child as React.ReactElement<ChildShape>, {
              className: cn(childProps.className, itemClassName),
              disabled: childDisabled(childProps),
              ...selectionProps(child, i),
            });
          })
        : items;

    return (
      <View
        ref={ref}
        className={cn(
          horizontal ? "flex-row" : "flex-col",
          !attached && "gap-2",
          glides && "p-1",
          className
        )}
        // A related-action cluster is a group, not a toolbar — toolbars
        // imply arrow-key navigation semantics this control doesn't provide.
        // `role` carries the full ARIA union (accessibilityRole has no "group").
        role={selecting ? "radiogroup" : "group"}
        accessibilityLabel={accessibilityLabel ?? ariaLabel}
        aria-label={ariaLabel ?? accessibilityLabel}
        accessibilityState={{ disabled: disabled ?? false }}
        {...props}
      >
        {glides ? (
          <View pointerEvents="none" className="absolute inset-0 rounded-full border border-border" />
        ) : null}
        {glides
          ? rects.slice(1).map((r, k) =>
              r ? <Divider key={k} x={r.x} hidden={selIndex === k || selIndex === k + 1} /> : null
            )
          : null}
        {content}
        {glides ? (
          <Animated.View
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            className="absolute left-0 overflow-hidden rounded-full bg-primary"
            style={[{ top: TRACK_INSET, bottom: TRACK_INSET }, windowStyle]}
          >
            <Animated.View className="absolute left-0" style={[{ top: -TRACK_INSET, bottom: -TRACK_INSET }, innerStyle]}>
              {items.map((child, i) => {
                const r = rects[i];
                if (!r) return null;
                const cp = child.props as ChildShape;
                return (
                  <View
                    key={i}
                    className="absolute bottom-0 top-0 items-center justify-center"
                    style={{ left: r.x, width: r.w }}
                  >
                    <Text
                      className={cn(
                        "font-semibold text-primary-foreground",
                        LABEL_SIZE[cp.size ?? "md"],
                        cp.textClassName
                      )}
                      numberOfLines={1}
                    >
                      {labels[i] as string}
                    </Text>
                  </View>
                );
              })}
            </Animated.View>
          </Animated.View>
        ) : null}
      </View>
    );
  }
);

ButtonGroup.displayName = "ButtonGroup";
