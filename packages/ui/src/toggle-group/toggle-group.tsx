import * as React from "react";
import { createContext, forwardRef, useContext, useMemo } from "react";
import { View, type LayoutChangeEvent, type ViewProps, type Pressable } from "react-native";
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import {
  AnimatedPressable,
  cn,
  ease,
  spring,
  timing,
  useHaptic,
  usePressAnimation,
  useReducedMotion,
  useTheme,
} from "@lumioui/core";

/*
 * ToggleGroup — the selection is light laid under the labels.
 *
 *  single    one shared ink indicator glides between items on
 *            spring.indicator; each label's ink follows how much of the
 *            indicator covers it, so no label flips before the light arrives.
 *  multiple  every picked item lights; neighbours that are both lit join
 *            through a bridge that grows across the gap on spring.layout —
 *            their inner corners square off and the run reads as one bar,
 *            only its two ends stay round.
 *
 * Items report their frames to the group, which draws the resting pills, the
 * light and the bridges in one underlay behind them. Items should be direct
 * children of the group.
 */

/** Gaps wider than this are separate pills, never one run. */
const RUN_GAP_MAX = 16;
/** Disabled-tap kick — the 4px flicker, released into spring.shake. */
const FLICKER_KICK = 4;

type Frame = { x: number; y: number; w: number; h: number };
type Entry = Frame & { scale: SharedValue<number>; kick: SharedValue<number> };

interface ToggleGroupCtx {
  type: "single" | "multiple";
  value: string | string[] | undefined;
  onValueChange: (value: string | string[]) => void;
  disabled?: boolean;
  report: (value: string, entry: Entry) => void;
  measured: (value: string) => boolean;
  /** Indicator centre and size (single), read by labels for coverage. */
  ind: { cx: SharedValue<number>; cy: SharedValue<number>; w: SharedValue<number>; h: SharedValue<number>; sx: SharedValue<number>; on: SharedValue<number> };
}

const ToggleGroupCtx = createContext<ToggleGroupCtx | null>(null);

function useToggleGroupCtx() {
  const ctx = useContext(ToggleGroupCtx);
  if (!ctx) throw new Error("ToggleGroup.Item must be inside ToggleGroup");
  return ctx;
}

export interface ToggleGroupProps extends ViewProps {
  /** Single select or multiple select. */
  type: "single" | "multiple";
  /** Controlled selected value(s). Omit with defaultValue for uncontrolled use. */
  value?: string | string[];
  /** Initial value(s) for uncontrolled use. */
  defaultValue?: string | string[];
  /** Called when the selection changes. */
  onValueChange?: (value: string | string[]) => void;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export interface ToggleGroupItemProps extends Omit<ViewProps, "style"> {
  value: string;
  disabled?: boolean;
  className?: string;
  /** Extra classes for a string label (weight, style, decoration). */
  textClassName?: string;
  children?: React.ReactNode;
}

const igniteTo = (v: number) => withTiming(v, { ...timing.fast, easing: Easing.bezier(...ease.out) });
const dimTo = (v: number) => withTiming(v, { ...timing.recede, easing: Easing.bezier(...ease.in) });

/** A resting pill — the unlit slot under each item. */
function RestPill({ entry }: { entry: Entry }) {
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: entry.kick.value }, { scale: entry.scale.value }],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      className="absolute bg-secondary"
      style={[{ left: entry.x, top: entry.y, width: entry.w, height: entry.h, borderRadius: entry.h / 2 }, style]}
    />
  );
}

/** Multiple: the light inside one picked item. Ignites in, dims out. */
function LitSegment({ entry, lit }: { entry: Entry; lit: boolean }) {
  const on = useSharedValue(lit ? 1 : 0);
  React.useEffect(() => {
    on.value = lit ? igniteTo(1) : dimTo(0);
  }, [lit, on]);
  const style = useAnimatedStyle(() => ({
    opacity: on.value,
    transform: [{ translateX: entry.kick.value }, { scale: entry.scale.value }],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      className="absolute bg-primary"
      style={[{ left: entry.x, top: entry.y, width: entry.w, height: entry.h, borderRadius: entry.h / 2 }, style]}
    />
  );
}

/** Multiple: the bridge joining two lit neighbours — centre of one to centre
 *  of the next, square, so the inner corners of the run square off. */
function Bridge({ a, b, linked }: { a: Entry; b: Entry; linked: boolean }) {
  const reduce = useReducedMotion();
  const link = useSharedValue(linked ? 1 : 0);
  React.useEffect(() => {
    if (reduce) link.value = linked ? igniteTo(1) : dimTo(0);
    else link.value = withSpring(linked ? 1 : 0, spring.layout);
  }, [linked, link, reduce]);
  const left = a.x + a.w - a.h / 2;
  const width = b.x + b.h / 2 - left;
  const style = useAnimatedStyle(() => ({
    opacity: Math.min(1, link.value * 2),
    transform: [{ scaleX: reduce ? 1 : Math.max(0.001, link.value) }],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      className="absolute bg-primary"
      style={[{ left, top: a.y, width, height: Math.min(a.h, b.h) }, style]}
    />
  );
}

/** Single: the one indicator. Size is set once per move, then the glide runs
 *  on transforms only (centre + a scale from the previous width). */
function Indicator({ ind, press }: { ind: ToggleGroupCtx["ind"]; press?: SharedValue<number> }) {
  const style = useAnimatedStyle(() => ({
    opacity: ind.on.value,
    width: ind.w.value,
    height: ind.h.value,
    borderRadius: ind.h.value / 2,
    transform: [
      { translateX: ind.cx.value - ind.w.value / 2 },
      { translateY: ind.cy.value - ind.h.value / 2 },
      { scaleX: ind.sx.value * (press ? press.value : 1) },
      { scaleY: press ? press.value : 1 },
    ],
  }));
  return <Animated.View pointerEvents="none" className="absolute left-0 top-0 bg-primary" style={style} />;
}

/** ToggleGroup — single or multiple selection; the selection is light. */
function ToggleGroupRoot(
  {
    type,
    value: controlledValue,
    defaultValue,
    onValueChange,
    disabled,
    className,
    children,
    accessibilityLabel,
    "aria-label": ariaLabel,
    ...props
  }: ToggleGroupProps,
  ref: React.ForwardedRef<React.ElementRef<typeof View>>
) {
  const reduce = useReducedMotion();
  // Single-select starts with no selection (undefined) — "" is a sentinel
  // that could collide with a real empty-string item value.
  const [uncontrolledValue, setUncontrolledValue] = React.useState<string | string[] | undefined>(
    defaultValue ?? (type === "single" ? undefined : [])
  );
  // Resolve active selection during render, never in a passive effect.
  const value = controlledValue ?? uncontrolledValue;
  const handleValueChange = React.useCallback(
    (v: string | string[]) => {
      if (controlledValue === undefined) setUncontrolledValue(v);
      onValueChange?.(v);
    },
    [controlledValue, onValueChange]
  );

  const [entries, setEntries] = React.useState<Record<string, Entry>>({});
  const report = React.useCallback((v: string, e: Entry) => {
    setEntries((prev) => {
      const p = prev[v];
      if (p && p.x === e.x && p.y === e.y && p.w === e.w && p.h === e.h) return prev;
      return { ...prev, [v]: e };
    });
  }, []);
  const measured = React.useCallback((v: string) => entries[v] != null, [entries]);

  const cx = useSharedValue(0);
  const cy = useSharedValue(0);
  const w = useSharedValue(0);
  const h = useSharedValue(0);
  const sx = useSharedValue(1);
  const on = useSharedValue(0);
  const ind = useMemo(() => ({ cx, cy, w, h, sx, on }), [cx, cy, w, h, sx, on]);

  const selected = useMemo(
    () => (type === "single" ? (typeof value === "string" && value !== "" ? [value] : []) : Array.isArray(value) ? value : []),
    [type, value]
  );
  const singleTarget = type === "single" ? entries[selected[0] ?? ""] : undefined;

  // Single: glide the indicator to the picked item's frame.
  const placed = React.useRef(false);
  React.useEffect(() => {
    if (type !== "single") return;
    if (!singleTarget) {
      on.value = dimTo(0);
      return;
    }
    const tx = singleTarget.x + singleTarget.w / 2;
    const ty = singleTarget.y + singleTarget.h / 2;
    const prevW = w.value;
    w.value = singleTarget.w;
    h.value = singleTarget.h;
    if (!placed.current || reduce || on.value === 0) {
      // First placement (or nothing lit): appear in place, no glide.
      placed.current = true;
      cx.value = tx;
      cy.value = ty;
      sx.value = 1;
      on.value = igniteTo(1);
      return;
    }
    sx.value = prevW > 0 ? prevW / singleTarget.w : 1;
    sx.value = withSpring(1, spring.indicator);
    cx.value = withSpring(tx, spring.indicator);
    cy.value = withSpring(ty, spring.indicator);
    on.value = igniteTo(1);
  }, [type, singleTarget, reduce, cx, cy, w, h, sx, on]);

  // Multiple: neighbours on the same row with a small gap can join into a run.
  const pairs = useMemo(() => {
    if (type !== "multiple") return [];
    const list = Object.entries(entries).sort(([, a], [, b]) => (Math.abs(a.y - b.y) < 1 ? a.x - b.x : a.y - b.y));
    const out: { key: string; a: Entry; b: Entry; linked: boolean }[] = [];
    for (let i = 0; i < list.length - 1; i++) {
      const [va, a] = list[i]!;
      const [vb, b] = list[i + 1]!;
      if (Math.abs(a.y - b.y) >= 1) continue;
      const gap = b.x - (a.x + a.w);
      if (gap < 0 || gap > RUN_GAP_MAX) continue;
      out.push({ key: `${va}|${vb}`, a, b, linked: selected.includes(va) && selected.includes(vb) });
    }
    return out;
  }, [type, entries, selected]);

  const ctx = useMemo(
    () => ({ type, value, onValueChange: handleValueChange, disabled, report, measured, ind }),
    [type, value, handleValueChange, disabled, report, measured, ind]
  );

  const list = Object.entries(entries);
  return (
    <ToggleGroupCtx.Provider value={ctx}>
      <View
        ref={ref}
        className={cn("flex-row flex-wrap gap-2", className)}
        // Honest grouping role: radiogroup for single-select, group for
        // multi. `role` carries the full ARIA union (accessibilityRole's
        // legacy union has no "group").
        role={type === "single" ? "radiogroup" : "group"}
        accessibilityLabel={accessibilityLabel ?? ariaLabel}
        aria-label={ariaLabel ?? accessibilityLabel}
        accessibilityState={{ disabled: disabled ?? false }}
        {...props}
      >
        {/* Underlay — resting pills, then the light, behind every label. */}
        {list.map(([v, e]) => (
          <RestPill key={`rest-${v}`} entry={e} />
        ))}
        {type === "multiple"
          ? list.map(([v, e]) => <LitSegment key={`lit-${v}`} entry={e} lit={selected.includes(v)} />)
          : null}
        {pairs.map((p) => (
          <Bridge key={p.key} a={p.a} b={p.b} linked={p.linked} />
        ))}
        {type === "single" ? <Indicator ind={ind} press={singleTarget?.scale} /> : null}
        {children}
      </View>
    </ToggleGroupCtx.Provider>
  );
}

export const ToggleGroupItem = forwardRef<React.ElementRef<typeof Pressable>, ToggleGroupItemProps>(
  function ToggleGroupItem({ value, disabled, className, textClassName, children, onLayout, accessibilityLabel, ...props }, ref) {
    const ctx = useToggleGroupCtx();
    const { colors } = useTheme();
    const haptics = useHaptic();
    const reduce = useReducedMotion();
    const press = usePressAnimation({ pressedScale: 0.94 });
    const isDisabled = disabled || ctx.disabled;
    const selected =
      ctx.type === "single" ? ctx.value === value : Array.isArray(ctx.value) && ctx.value.includes(value);

    const kick = useSharedValue(0);
    const fx = useSharedValue(0);
    const fy = useSharedValue(0);
    const fw = useSharedValue(0);
    const fh = useSharedValue(0);
    // Multiple: this label's own light, on the same ignite / dim as its segment.
    const lit = useSharedValue(selected ? 1 : 0);
    React.useEffect(() => {
      lit.value = selected ? igniteTo(1) : dimTo(0);
    }, [selected, lit]);

    const { report } = ctx;
    const handleLayout = (e: LayoutChangeEvent) => {
      const { x, y, width, height } = e.nativeEvent.layout;
      fx.value = x;
      fy.value = y;
      fw.value = width;
      fh.value = height;
      report(value, { x, y, w: width, h: height, scale: press.scale, kick });
      onLayout?.(e);
    };

    const single = ctx.type === "single";
    const { ind } = ctx;
    const inkStyle = useAnimatedStyle(() => {
      let cover = lit.value;
      if (single) {
        // Ink follows the indicator's coverage of this slot.
        const iw = ind.w.value * ind.sx.value;
        const ox = Math.max(0, Math.min(ind.cx.value + iw / 2, fx.value + fw.value) - Math.max(ind.cx.value - iw / 2, fx.value));
        const oy = Math.max(0, Math.min(ind.cy.value + ind.h.value / 2, fy.value + fh.value) - Math.max(ind.cy.value - ind.h.value / 2, fy.value));
        cover = fw.value > 0 && fh.value > 0 ? Math.min(1, (ox / fw.value) * (oy / fh.value)) * ind.on.value : 0;
      }
      return { color: interpolateColor(cover, [0, 1], [colors.secondaryForeground, colors.primaryForeground]) };
    });
    const bodyStyle = useAnimatedStyle(() => ({
      transform: [{ translateX: kick.value }, { scale: press.scale.value }],
    }));

    const handlePress = () => {
      if (isDisabled) {
        // Flicker for "can't": one 4px kick, released into the shake spring.
        haptics.warning();
        if (!reduce) {
          kick.value = FLICKER_KICK;
          kick.value = withSpring(0, spring.shake);
        }
        return;
      }
      haptics.selection();
      const pressed = !selected;
      if (single) {
        ctx.onValueChange(pressed ? value : "");
      } else {
        const arr = Array.isArray(ctx.value) ? [...ctx.value] : [];
        if (pressed) {
          if (!arr.includes(value)) arr.push(value);
        } else {
          const idx = arr.indexOf(value);
          if (idx > -1) arr.splice(idx, 1);
        }
        ctx.onValueChange(arr);
      }
    };

    const label = accessibilityLabel ?? (typeof children === "string" ? children : value);
    return (
      <AnimatedPressable
        ref={ref}
        onLayout={handleLayout}
        onPress={handlePress}
        onPressIn={isDisabled ? undefined : press.onPressIn}
        onPressOut={isDisabled ? undefined : press.onPressOut}
        hitSlop={6}
        style={bodyStyle}
        className={cn(
          "min-h-[44px] flex-row items-center justify-center gap-2 rounded-full px-4 py-2.5",
          // Until the group has measured this slot, the item wears its own pill.
          !ctx.measured(value) && (selected ? "bg-primary" : "bg-secondary"),
          isDisabled && "opacity-50",
          className
        )}
        // Honest selection semantics: radios in single-select, checkboxes in multi.
        accessibilityRole={single ? "radio" : "checkbox"}
        accessibilityState={{ checked: selected, disabled: isDisabled ?? false }}
        aria-checked={selected}
        aria-disabled={isDisabled ?? false}
        accessibilityLabel={label}
        {...props}
      >
        {typeof children === "string" ? (
          <Animated.Text style={inkStyle} className={cn("text-base font-medium", textClassName)}>
            {children}
          </Animated.Text>
        ) : (
          children
        )}
      </AnimatedPressable>
    );
  }
);

export const ToggleGroup = Object.assign(forwardRef(ToggleGroupRoot), {
  Item: ToggleGroupItem,
});

ToggleGroup.displayName = "ToggleGroup";
ToggleGroupItem.displayName = "ToggleGroupItem";
