import * as React from "react";
import { forwardRef, useContext, useMemo, useState } from "react";
import { Modal, PanResponder, Pressable, ScrollView, Text, View, type PressableProps, type ViewProps, } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { cn, useHaptic, usePressAnimation, spring, tempo, timing, ease, useReducedMotion, AnimatedPressable } from "@lumioui/core";
import { Icon, type IconName } from "../icon";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Animated.View is cssInterop-registered via @lumioui/core/styled


/** Sheet exit — dims on ease.in at ~60% of the panel entrance and only
 *  drops half the entrance travel. */
const SHEET_EXIT = { duration: tempo.flick, easing: Easing.bezier(...ease.in) } as const;
/** Entrance travel from the bottom edge; the exit covers half of it. */
const SHEET_TRAVEL = 320;
/** Rows ignite top to bottom 24ms apart — opacity + 0.98→1, no travel. */
const ROW_STAGGER_MS = 24;
const ROW_FROM_SCALE = 0.98;
/** Cap so long lists don't keep igniting after the sheet has landed. */
const ROW_MAX_DELAY_MS = tempo.settle;
const ROW_IGNITE = { duration: timing.fast.duration, easing: Easing.bezier(...ease.out) } as const;
/** Fling-dismiss velocity (px/ms) and distance — bottom-sheet thresholds. */
const DISMISS_VELOCITY = 0.8;
const DISMISS_DISTANCE = 120;
/** Act, hold, resolve — a pick is a small act, so the picked row holds lit
 *  for one move beat before the sheet dims out. */
const PICK_HOLD = tempo.move;
/** The picked check sparks in from here on spring.pop. */
const CHECK_FROM = 0.4;
/** Trigger value swap: outgoing dims to this scale, incoming ignites from it. */
const SWAP_SCALE = 0.96;
const SWAP_DIM = { duration: timing.recede.duration, easing: Easing.bezier(...ease.in) } as const;
const SWAP_IGNITE = { duration: timing.fast.duration, easing: Easing.bezier(...ease.out) } as const;
/** The field ring lights once when a new value lands, holds, then settles. */
const RING_HOLD = tempo.drift;

/** One option row igniting in place. */
function IgniteRow({ index, children }: { index: number; children: React.ReactNode }) {
  const reduceMotion = useReducedMotion();
  const lit = useSharedValue(reduceMotion ? 1 : 0);
  React.useEffect(() => {
    if (reduceMotion) {
      lit.value = 1;
      return;
    }
    lit.value = withDelay(Math.min(index * ROW_STAGGER_MS, ROW_MAX_DELAY_MS), withTiming(1, ROW_IGNITE));
  }, [index, lit, reduceMotion]);
  const style = useAnimatedStyle(() => ({
    opacity: lit.value,
    transform: [{ scale: ROW_FROM_SCALE + (1 - ROW_FROM_SCALE) * lit.value }],
  }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

type SwapLayers = { key: string; node: React.ReactNode; out: React.ReactNode; gen: number };

/**
 * The trigger's value swapping in place: the old value dims (120ms → 0.96)
 * as an overlay while the new one ignites (160ms, 0.96 → 1 on spring.swap).
 * The leading tile rides with the label. First paint renders lit.
 */
function SwapValue({ swapKey, children }: { swapKey: string; children: React.ReactNode }) {
  const reduceMotion = useReducedMotion();
  const [layers, setLayers] = useState<SwapLayers>(() => ({ key: swapKey, node: children, out: null, gen: 0 }));
  // Resolved during render so the outgoing value mounts on the same commit.
  if (swapKey !== layers.key) {
    setLayers({ key: swapKey, node: children, out: layers.node, gen: layers.gen + 1 });
  } else if (children !== layers.node) {
    setLayers({ ...layers, node: children });
  }
  const dim = useSharedValue(1);
  const ignite = useSharedValue(1);
  const bloom = useSharedValue(1);
  React.useLayoutEffect(() => {
    if (layers.gen === 0) return;
    dim.value = 0;
    ignite.value = 0;
    dim.value = withTiming(1, SWAP_DIM);
    ignite.value = withTiming(1, SWAP_IGNITE);
    if (reduceMotion) {
      bloom.value = 1;
      return;
    }
    bloom.value = 0;
    bloom.value = withSpring(1, spring.swap);
  }, [layers.gen, reduceMotion, dim, ignite, bloom]);
  // Drop the spent layer once its dim has run.
  React.useEffect(() => {
    if (layers.out == null) return;
    const gen = layers.gen;
    const t = setTimeout(
      () => setLayers((l) => (l.gen === gen ? { ...l, out: null } : l)),
      SWAP_DIM.duration + SWAP_IGNITE.duration
    );
    return () => clearTimeout(t);
  }, [layers.out, layers.gen]);
  const inStyle = useAnimatedStyle(() => ({
    opacity: ignite.value,
    transform: [{ scale: SWAP_SCALE + (1 - SWAP_SCALE) * bloom.value }],
  }));
  const outStyle = useAnimatedStyle(() => ({
    opacity: 1 - dim.value,
    transform: [{ scale: reduceMotion ? 1 : 1 - (1 - SWAP_SCALE) * dim.value }],
  }));
  return (
    <View className="shrink">
      {layers.out != null ? (
        <Animated.View
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0, justifyContent: "center" }, outStyle]}
        >
          {layers.out}
        </Animated.View>
      ) : null}
      <Animated.View style={inStyle}>{layers.node}</Animated.View>
    </View>
  );
}

export interface SelectOption {
  value: string;
  label: string;
  /** Leading icon shown in the option row and in the trigger when selected. */
  icon?: IconName;
  /** Secondary text under the label in the option row. */
  subtitle?: string;
  /** Custom leading node (brand mark, colour tile, avatar). Wins over `icon`
   *  in the option row; the trigger keeps using `icon`. */
  leading?: React.ReactNode;
}

interface SelectCtxValue {
  value?: string;
  onValueChange?: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  /** Close once the pick has held for its beat. */
  closeAfterPick: () => void;
  disabled?: boolean;
}

const SelectCtx = React.createContext<SelectCtxValue | null>(null);

function useSelectCtx() {
  const ctx = useContext(SelectCtx);
  if (!ctx) throw new Error("Select.Item must be used inside Select");
  return ctx;
}

export interface SelectItemProps extends Omit<PressableProps, "onPress" | "children"> {
  value: string;
  label?: string;
  /** Leading icon in the option row (and in the trigger when selected). */
  icon?: IconName;
  /** Secondary text under the label. */
  subtitle?: string;
  /** Custom leading node — wins over `icon`. */
  leading?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

export const SelectItem = forwardRef<React.ElementRef<typeof Pressable>, SelectItemProps>(
  function SelectItem({ value, label, icon, subtitle, leading, className, children, disabled, ...props }, ref) {
    const ctx = useSelectCtx();
    const haptics = useHaptic();
    const reduceMotion = useReducedMotion();
    const selected = ctx.value === value;
    const isDisabled = disabled || ctx.disabled;
    const check = useSharedValue(selected ? 1 : 0);
    const checkScale = useSharedValue(1);
    const lit = useSharedValue(0);
    const wasSelected = React.useRef(selected);
    // Row press feedback — scale + opacity wash, handles reduced motion
    // internally (opacity only, no travel).
    const press = usePressAnimation({ pressedScale: 0.98, pressedOpacity: 0.7 });

    React.useEffect(() => {
      if (selected === wasSelected.current) return;
      wasSelected.current = selected;
      if (selected) {
        // The pick lands: the check sparks in and the row ignites to a lit slab.
        check.value = withTiming(1, timing.fast);
        lit.value = withTiming(1, timing.fast);
        if (reduceMotion) checkScale.value = 1;
        else {
          checkScale.value = CHECK_FROM;
          checkScale.value = withSpring(1, spring.pop);
        }
      } else {
        // The previous pick dims in place — it never un-pops.
        check.value = withTiming(0, timing.recede);
        lit.value = withTiming(0, timing.recede);
      }
    }, [selected, check, checkScale, lit, reduceMotion]);

    const checkStyle = useAnimatedStyle(() => ({
      transform: [{ scale: checkScale.value }],
      opacity: check.value,
    }));
    const litStyle = useAnimatedStyle(() => ({ opacity: lit.value }));

    const handlePress = () => {
      if (isDisabled) return;
      haptics.selection();
      // Re-picking the current value has nothing to perform — just close.
      if (selected) {
        ctx.setOpen(false);
        return;
      }
      ctx.onValueChange?.(value);
      ctx.closeAfterPick();
    };

    return (
      <Pressable
        ref={ref}
        disabled={isDisabled}
        onPress={handlePress}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        // Single-select option — RN has no "option"/"listbox" role; "radio"
        // is the closest semantic (checked state inside a radiogroup).
        accessibilityRole="radio"
        accessibilityState={{ checked: selected, disabled: isDisabled }}
        // accessibilityState isn't forwarded to the DOM on web — mirror it.
        aria-checked={selected}
        aria-disabled={isDisabled ?? false}
        accessibilityLabel={label ?? (typeof children === "string" ? children : value)}
        hitSlop={6}
        {...props}
      >
        <Animated.View
          style={press.animatedStyle}
          className={cn(
            "flex-row items-center rounded-xl px-3.5 py-3",
            "min-h-[48px]",
            isDisabled && "opacity-50",
            className
          )}
        >
          {/* Lit slab — the picked row holds this light while the sheet waits. */}
          <Animated.View pointerEvents="none" className="absolute inset-0 rounded-xl bg-primary/10" style={litStyle} />
          {leading != null ? (
            <View className="mr-3">{leading}</View>
          ) : icon ? (
            <View className="mr-3 h-8 w-8 items-center justify-center rounded-lg bg-muted">
              <Icon name={icon} size="sm" color="foreground" />
            </View>
          ) : null}
          <View className="flex-1 gap-0.5">
            <Text
              className={cn(
                "text-base leading-tight",
                selected ? "font-semibold text-primary-text" : "text-foreground"
              )}
              numberOfLines={1}
            >
              {children ?? label ?? value}
            </Text>
            {subtitle ? (
              <Text className="text-sm leading-tight text-muted-foreground" numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>
          <Animated.View
            style={[{ width: 22, height: 22, alignItems: "center", justifyContent: "center" }, checkStyle]}
          >
            <Icon name="check" size="sm" color="primary" strokeWidth={3} />
          </Animated.View>
        </Animated.View>
      </Pressable>
    );
  }
);

SelectItem.displayName = "SelectItem";

export interface SelectProps extends ViewProps {
  /** Controlled value. Omit with defaultValue for uncontrolled use. */
  value?: string;
  /** Uncontrolled initial value. */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Controlled open state. Omit with defaultOpen for uncontrolled use. */
  open?: boolean;
  /** Uncontrolled initial open state. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  options?: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  /** Title shown at the top of the options sheet. */
  title?: string;
  /** Trigger style: "field" renders a form input, "row" renders a settings
   *  row (label left, value + chevron right). Default "field". */
  variant?: "field" | "row";
  /** Leading icon on the trigger when no option is selected (field variant). */
  icon?: IconName;
  /** Visible label on the row variant. Ignored on field. */
  label?: string;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Select — trigger opens a bottom option sheet (the phone-native pattern):
 * backdrop dims + tap-dismisses, the sheet rises from the bottom edge on
 * spring.panel, rows ignite top to bottom, the chevron turns on
 * spring.indicator.
 *
 * The pick is the moment: the touched row ignites to a lit slab while its
 * check sparks in (spring.pop) and the previous check dims; the row holds
 * one beat (250ms), then the sheet dims out and the trigger's value swaps in
 * place (old dims, new ignites) while the field ring lights once.
 * `onValueChange` fires on the tap; the sheet closes after the hold.
 */
function SelectRoot(
  { value, defaultValue, onValueChange, open: controlledOpen, defaultOpen, onOpenChange, options, placeholder = "Select…", disabled, title, variant = "field", icon, label, className, children, ...props }: SelectProps,
  ref: React.ForwardedRef<React.ElementRef<typeof View>>
) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  // Resolve the value during render — controlled wins, uncontrolled falls
  // back to internal state. handleValueChange always notifies.
  const currentValue = value ?? internalValue;
  const handleValueChange = React.useCallback(
    (next: string) => {
      if (value === undefined) setInternalValue(next);
      onValueChange?.(next);
    },
    [value, onValueChange]
  );
  const [internalOpen, setInternalOpen] = useState(defaultOpen ?? false);
  // Resolve open during render — controlled wins, uncontrolled falls back
  // to internal state. setOpen always notifies via onOpenChange.
  const open = controlledOpen ?? internalOpen;
  const setOpen = React.useCallback(
    (next: boolean) => {
      if (controlledOpen === undefined) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [controlledOpen, onOpenChange]
  );
  // The trigger shows the value it last saw while closed: a pick made in the
  // sheet lands on the trigger as the sheet dims, where it can be seen.
  const [shownValue, setShownValue] = useState(currentValue);
  if (!open && shownValue !== currentValue) setShownValue(currentValue);
  // Kept mounted through the close animation so the sheet can animate out
  // instead of vanishing (PresenceGate pattern).
  const [rendered, setRendered] = useState(false);
  const haptics = useHaptic();
  const reduceMotion = useReducedMotion();
  const insets = useSafeAreaInsets();
  const press = usePressAnimation({ pressedScale: 0.98 });
  const sheet = useSharedValue(0);
  const backdrop = useSharedValue(0);
  const chevron = useSharedValue(0);
  const ink = useSharedValue(0);
  // Finger offset layered on the open/close animation for drag-to-dismiss.
  const drag = useSharedValue(0);
  const travel = useSharedValue(SHEET_TRAVEL);
  // The field ring lights once when a picked value lands on the trigger.
  const ring = useSharedValue(0);
  const pickTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(
    () => () => {
      if (pickTimer.current) clearTimeout(pickTimer.current);
    },
    []
  );
  const closeAfterPick = React.useCallback(() => {
    if (pickTimer.current) clearTimeout(pickTimer.current);
    pickTimer.current = setTimeout(() => {
      pickTimer.current = null;
      setOpen(false);
    }, PICK_HOLD);
  }, [setOpen]);
  const lastValue = React.useRef(shownValue);
  React.useEffect(() => {
    if (lastValue.current === shownValue) return;
    lastValue.current = shownValue;
    ring.value = withSequence(withTiming(1, timing.fast), withDelay(RING_HOLD, withTiming(0, timing.normal)));
  }, [shownValue, ring]);
  const ringStyle = useAnimatedStyle(() => ({ opacity: ring.value }));

  const selected = useMemo(() => {
    if (!shownValue) return null;
    const found = options?.find((o) => o.value === shownValue);
    return found
      ? { label: found.label, icon: found.icon, leading: found.leading }
      : { label: shownValue, icon: undefined, leading: undefined };
  }, [shownValue, options]);

  React.useEffect(() => {
    if (open) {
      setRendered(true);
      // Snap any leftover drag offset before rising — a fling-out leaves
      // `drag` mid-travel and the sheet must re-enter from clean.
      drag.value = 0;
      travel.value = SHEET_TRAVEL;
      backdrop.value = withTiming(1, timing.fast);
      // Reduced motion: ignite in place — no travel (sheetStyle drops it).
      sheet.value = reduceMotion ? withTiming(1, timing.fast) : withSpring(1, spring.panel);
      chevron.value = reduceMotion ? 1 : withSpring(1, spring.indicator);
    } else {
      // Dim out; the sheet only drops half its entrance travel.
      travel.value = SHEET_TRAVEL / 2;
      if (reduceMotion) {
        sheet.value = withTiming(0, timing.recede);
        chevron.value = 0;
      } else {
        sheet.value = withTiming(0, SHEET_EXIT);
        chevron.value = withSpring(0, spring.indicator);
      }
      backdrop.value = withTiming(0, timing.recede);
      const t = setTimeout(() => setRendered(false), SHEET_EXIT.duration);
      return () => clearTimeout(t);
    }
  }, [open, sheet, backdrop, chevron, reduceMotion, drag, travel]);

  // Drag-to-dismiss: grabbing the handle/title strip tracks the finger 1:1
  // downward, rubber-bands against upward pulls, and a release past 120px
  // or an 800px/s fling closes the sheet (bottom-sheet thresholds,
  // DESIGN-TASTE §5b). Snap-back rides spring.panel — no rebound. The ScrollView keeps scroll
  // gestures because this strip doesn't wrap it.
  const pan = React.useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => g.dy > 8,
        onPanResponderMove: (_, g) => {
          // Rubber-band: pulling the sheet *up* past rest resists at 20%.
          drag.value = g.dy > 0 ? g.dy : g.dy * 0.2;
        },
        onPanResponderRelease: (_, g) => {
          // g.vy is px/ms — 0.8 = 800px/s, the sheet-dismiss velocity.
          if (g.dy > DISMISS_DISTANCE || g.vy > DISMISS_VELOCITY) {
            // Keep `drag` so the exit continues from the dragged position —
            // snapping to 0 would jump the sheet up mid-fling.
            haptics.selection();
            setOpen(false);
          } else {
            drag.value = reduceMotion ? 0 : withSpring(0, spring.panel);
          }
        },
        onPanResponderTerminate: () => {
          drag.value = reduceMotion ? 0 : withSpring(0, spring.panel);
        },
      }),
    [setOpen, haptics, drag, reduceMotion]
  );

  const sheetStyle = useAnimatedStyle(
    () => ({
      transform: [{ translateY: (reduceMotion ? 0 : (1 - sheet.value) * travel.value) + drag.value }],
      opacity: sheet.value,
    }),
    [reduceMotion]
  );
  const backdropStyle = useAnimatedStyle(() => ({
    // The scrim lifts in step with the dragged sheet.
    opacity: backdrop.value * Math.max(0, 1 - drag.value / 300),
  }));
  // Field chevron (down) flips 180° to point up; the row's disclosure
  // chevron (right) turns 90° to point down at the sheet — a 180° turn
  // would aim it backwards.
  const chevronTurn = variant === "row" ? 90 : 180;
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevron.value * chevronTurn}deg` }],
  }));
  const inkStyle = useAnimatedStyle(() => ({ opacity: ink.value * 0.08 }));

  const handleTriggerPressIn = () => {
    press.onPressIn();
    if (!reduceMotion) ink.value = withTiming(1, timing.instant);
  };
  const handleTriggerPressOut = () => {
    press.onPressOut();
    ink.value = withTiming(0, timing.normal);
  };

  const handleOpen = () => {
    if (disabled) return;
    // Open is a light tap; the selection tick belongs to picking an item.
    haptics.light();
    setOpen(true);
  };
  // Close haptic on the dismiss paths (backdrop / hardware back) — item
  // presses already fire their own selection haptic.
  const close = () => {
    if (pickTimer.current) clearTimeout(pickTimer.current);
    pickTimer.current = null;
    haptics.selection();
    setOpen(false);
  };

  const isRow = variant === "row";

  return (
    <SelectCtx.Provider value={{ value: currentValue, onValueChange: handleValueChange, open, setOpen, closeAfterPick, disabled }}>
      <View ref={ref} className={cn("gap-1.5", className)} {...props}>
        <AnimatedPressable
          disabled={disabled}
          onPress={handleOpen}
          onPressIn={handleTriggerPressIn}
          onPressOut={handleTriggerPressOut}
          style={press.animatedStyle}
          className={cn(
            isRow
              ? "min-h-[44px] flex-row items-center justify-between py-2"
              : "h-12 flex-row items-center justify-between rounded-xl border border-input bg-card px-3.5",
            disabled && "opacity-50"
          )}
          accessibilityRole="combobox"
          accessibilityState={{ expanded: open, disabled }}
          // accessibilityState isn't forwarded to the DOM on web — mirror it.
          aria-expanded={open}
          aria-disabled={disabled ?? false}
          accessibilityLabel={selected?.label ?? placeholder}
          accessibilityHint="Opens a list of options"
          hitSlop={6}
        >
          {isRow ? (
            <>
              <Text className="text-base text-foreground" numberOfLines={1}>
                {label ?? placeholder}
              </Text>
              <View className="shrink flex-row items-center gap-1.5">
                <SwapValue swapKey={shownValue ?? ""}>
                  <View className="flex-row items-center gap-1.5">
                    {selected?.leading != null ? (
                      selected.leading
                    ) : selected?.icon ? (
                      <View className="h-6 w-6 items-center justify-center rounded-md bg-muted">
                        <Icon name={selected.icon} size="sm" color="foreground" />
                      </View>
                    ) : null}
                    <Text
                      className={cn(
                        "shrink text-base",
                        selected ? "font-medium text-foreground" : "text-muted-foreground"
                      )}
                      numberOfLines={1}
                    >
                      {selected?.label ?? placeholder}
                    </Text>
                  </View>
                </SwapValue>
                <Animated.View style={chevronStyle}>
                  <Icon name="chevron-right" size="sm" color="mutedForeground" />
                </Animated.View>
              </View>
            </>
          ) : (
            <>
              <SwapValue swapKey={shownValue ?? ""}>
                <View className="flex-row items-center gap-2.5">
                  {selected?.leading != null ? (
                    selected.leading
                  ) : (selected?.icon ?? icon) ? (
                    <View className="h-7 w-7 items-center justify-center rounded-md bg-muted">
                      <Icon name={selected?.icon ?? icon!} size="sm" color="foreground" />
                    </View>
                  ) : null}
                  <Text
                    className={cn(
                      "shrink text-base leading-tight",
                      selected ? "text-foreground font-medium" : "text-muted-foreground"
                    )}
                    numberOfLines={1}
                  >
                    {selected?.label ?? placeholder}
                  </Text>
                </View>
              </SwapValue>
              <Animated.View style={chevronStyle}>
                <Icon name="chevron-down" size="sm" color="mutedForeground" />
              </Animated.View>
            </>
          )}
          {/* Press ink overlay — faint foreground wash (8% at full press),
              theme-aware instead of a hardcoded black. */}
          <Animated.View
            pointerEvents="none"
            style={[
              {
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderRadius: isRow ? 0 : 12,
              },
              inkStyle,
            ]}
            className="bg-foreground"
          />
          {/* Ring — lights once as a new value lands, then settles back to the input edge. */}
          {!isRow ? (
            <Animated.View pointerEvents="none" className="absolute inset-0 rounded-xl border border-ring" style={ringStyle} />
          ) : null}
        </AnimatedPressable>

        <Modal
          visible={rendered}
          transparent
          animationType="none"
          onRequestClose={close}
          statusBarTranslucent
        >
          <View className="flex-1 justify-end" style={{ width: "100%", height: "100%" }}>
            {/* Dim backdrop — tap anywhere to dismiss */}
            <Pressable onPress={close} className="absolute inset-0" accessibilityLabel="Dismiss" accessibilityRole="button">
              <Animated.View
                style={[{ flex: 1 }, backdropStyle]}
                className="bg-overlay"
              />
            </Pressable>

            {/* Bottom sheet of options — a solid popover surface. It sits on a
                dimmed scrim, not moving content, so glass would only blur
                grey (and loses text contrast in dark mode). */}
            <Animated.View
              style={sheetStyle}
              className="w-full max-w-[480px] self-center"
              // Items announce as "radio" — the group matches.
              accessibilityRole="radiogroup"
            >
            <View
              className="w-full rounded-t-[28px] bg-popover px-2 pt-2"
              style={{ paddingBottom: insets.bottom + 8 }}
            >
              {/* Drag handle + title strip — the swipe-to-dismiss zone.
                  Wide py so the grab target is generous (≥44pt incl. hitSlop). */}
              <View {...pan.panHandlers} className="items-stretch py-1" hitSlop={8} accessibilityLabel="Drag to dismiss">
                <View className="mb-1 items-center">
                  <View className="h-1 w-9 rounded-full bg-muted-foreground/40" />
                </View>
                {title ? (
                  <Text
                    className="px-3.5 pb-2 pt-1 text-[17px] font-semibold leading-tight text-popover-foreground"
                    accessibilityRole="header"
                  >
                    {title}
                  </Text>
                ) : null}
              </View>
              <ScrollView
                showsVerticalScrollIndicator={false}
                bounces={false}
                style={{ maxHeight: 320 }}
              >
                <View className="gap-0.5 pb-1">
                  {options?.map((option, i) => (
                    <IgniteRow key={i} index={i}>
                      <SelectItem value={option.value} label={option.label} icon={option.icon} subtitle={option.subtitle} leading={option.leading}>
                        {option.label}
                      </SelectItem>
                    </IgniteRow>
                  ))}
                  {children}
                </View>
              </ScrollView>
            </View>
            </Animated.View>
          </View>
        </Modal>
      </View>
    </SelectCtx.Provider>
  );
}

const Select = Object.assign(forwardRef(SelectRoot), { Item: SelectItem });
Select.displayName = "Select";
Select.Item.displayName = "SelectItem";

export { Select };
