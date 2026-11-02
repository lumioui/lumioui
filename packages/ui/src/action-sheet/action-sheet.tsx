import * as React from "react";
import { forwardRef } from "react";
import { Modal, PanResponder, Pressable, View, Text } from "react-native";
import Animated, { Easing, useSharedValue, useAnimatedStyle, withDelay, withSpring, withTiming } from "react-native-reanimated";
import {
  BAND_STAGGER,
  cn,
  ease,
  rowDelay,
  spring,
  SWITCH_DIM,
  tempo,
  timing,
  useHaptic,
  usePressAnimation,
  useReducedMotion,
} from "@lumioui/core";
import { Glass } from "../glass";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export interface ActionSheetAction {
  /** Action label. */
  label: string;
  /** Render in destructive (red) style. Destructive actions are hoisted to
   * the top of the list; cancel stays last, on its own surface. */
  destructive?: boolean;
  /** Disable the action. */
  disabled?: boolean;
  /** Called when the action is picked — after the picked row's short hold, as the sheet closes. */
  onPress?: () => void;
}

export interface ActionSheetProps {
  /** Controlled open state. Omit for uncontrolled use with defaultOpen. */
  open?: boolean;
  /** Uncontrolled initial open state. Default false. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** List of actions; destructive ones render first. */
  actions: ActionSheetAction[];
  /** Optional title above the actions (13pt, muted). */
  title?: string;
  /** Optional descriptive message below the title. */
  message?: string;
  /** Label for the separated cancel button. Default "Cancel". */
  cancelLabel?: string;
  /** Surface material. "solid" (default) is an opaque popover surface that
   * reads in light and dark over any screen; "glass" opts into Lumio glass —
   * use it only when the sheet floats over photos or video. */
  material?: "solid" | "glass";
  /** Extra classes for the sheet container. */
  className?: string;
}

/** Off-screen travel floor before the sheet has been measured; once laid
 *  out, the entrance rises the sheet's own height. */
const OFFSCREEN_MIN = 600;
/** Light before motion: the backdrop dims this long before the groups rise. */
const BACKDROP_LEAD = timing.instant.duration;
/** Container, then content: labels switch on a band after the groups surface,
 *  then step on the row rhythm (opacity dim → on + 0.98→1, no travel). */
const LABEL_LEAD = BACKDROP_LEAD + BAND_STAGGER;
const ROW_FROM_SCALE = 0.98;
/** A picked row holds lit, the rest dimmed, this long before the sheet leaves. */
const PICK_HOLD = tempo.snap;
/** Rows passed over by the pick dim to this. */
const PASSED_DIM = SWITCH_DIM;
/** The picked row's wash — a 6% fill of its ink (the layer is the /10 tint at 0.6). */
const PICK_WASH = 0.6;
/** Exit order: the panel dims, the backdrop clears after it. */
const BACKDROP_TRAIL = 60;
const IGNITE = { duration: timing.fast.duration, easing: Easing.bezier(...ease.out) } as const;
/** Exit dims on timing.recede and drops only half the entrance travel. */
const DIM = { duration: timing.recede.duration, easing: Easing.bezier(...ease.in) } as const;
const BACKDROP_IN = { duration: timing.normal.duration, easing: Easing.bezier(...ease.out) } as const;
/** Drag-to-dismiss thresholds — bottom-sheet distance (px) and px/ms. */
const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 0.8;

/** Group radius — the large end of Lumio's radius scale. */
const GROUP_RADIUS = "rounded-[28px]";

/** One row switching on in place (replays each open); dims when a pick passes it over. */
function IgniteRow({
  index,
  active,
  passed = false,
  children,
}: {
  index: number;
  active: boolean;
  passed?: boolean;
  children: React.ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  const lit = useSharedValue(SWITCH_DIM);
  const bloom = useSharedValue(reduceMotion ? 1 : 0);
  React.useEffect(() => {
    if (!active) return;
    // Labels wait dim (readable) inside the risen group, then switch on.
    const wait = LABEL_LEAD + rowDelay(index);
    lit.value = SWITCH_DIM;
    lit.value = withDelay(wait, withTiming(1, IGNITE));
    if (reduceMotion) {
      bloom.value = 1;
      return;
    }
    bloom.value = 0;
    bloom.value = withDelay(wait, withTiming(1, IGNITE));
  }, [active, index, lit, bloom, reduceMotion]);
  React.useEffect(() => {
    if (passed) lit.value = withTiming(PASSED_DIM, DIM);
  }, [passed, lit]);
  const style = useAnimatedStyle(() => ({
    opacity: lit.value,
    transform: [{ scale: ROW_FROM_SCALE + (1 - ROW_FROM_SCALE) * bloom.value }],
  }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

/** One group surface (actions, or cancel). One depth treatment: the
 * popover surface on the dimmed backdrop — no border, no glow. */
function SheetGroup({
  material,
  className,
  children,
}: {
  material: "solid" | "glass";
  className?: string;
  children: React.ReactNode;
}) {
  if (material === "glass") {
    return (
      <Glass effect="regular" className={cn("overflow-hidden", GROUP_RADIUS, className)}>
        {children}
      </Glass>
    );
  }
  return <View className={cn("overflow-hidden bg-popover", GROUP_RADIUS, className)}>{children}</View>;
}

/** Single action row — its own component so it can hold a usePressAnimation hook. */
function SheetActionRow({
  action,
  bordered,
  picked,
  onSelect,
}: {
  action: ActionSheetAction;
  bordered: boolean;
  picked: boolean;
  onSelect: (action: ActionSheetAction) => void;
}) {
  const press = usePressAnimation({ pressedScale: 0.98 });
  // The picked row stays lit: a wash of its own ink fills it while the rest dim.
  const wash = useSharedValue(0);
  React.useEffect(() => {
    wash.value = picked ? withTiming(PICK_WASH, IGNITE) : 0;
  }, [picked, wash]);
  const washStyle = useAnimatedStyle(() => ({ opacity: wash.value }));
  return (
    <Pressable
      disabled={action.disabled}
      accessibilityState={{ disabled: action.disabled, selected: picked }}
      onPress={() => onSelect(action)}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      className={cn(
        // 56pt rows, full-width hit area.
        "min-h-[56px] items-center justify-center px-5",
        bordered && "border-t border-border",
        !action.disabled && "active:bg-accent",
        action.disabled && "opacity-40"
      )}
      accessibilityRole="button"
      accessibilityLabel={action.label}
      // accessibilityState isn't forwarded to the DOM on web — mirror it.
      aria-disabled={action.disabled ?? false}
    >
      <Animated.View
        pointerEvents="none"
        className={cn("absolute inset-0", action.destructive ? "bg-destructive/10" : "bg-primary/10")}
        style={washStyle}
      />
      <Animated.View style={press.animatedStyle}>
        <Text
          numberOfLines={1}
          // Actions in the tint (ink, or a scoped accent), destructive in
          // red, both regular weight — only Cancel is bold.
          className={cn(
            "text-center text-[17px]",
            action.destructive ? "text-destructive" : "text-primary-text"
          )}
        >
          {action.label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

/**
 * ActionSheet — a detached sheet of actions (8pt inset, fully rounded
 * groups). Light before motion: the backdrop dims first, the groups rise on
 * spring.panel 80ms later, and their labels switch on a band after that,
 * 40ms apart, Cancel last. A pick leads: the chosen row stays lit under a
 * wash of its ink while the rest dim, holds, then the sheet dims out and the
 * backdrop clears after it. Backdrop tap or drag down dismisses.
 *
 * Drag runs on PanResponder (free tier stays Expo Go compatible, so no
 * gesture-handler); the finger writes a shared value directly — no React
 * state per move.
 */
export const ActionSheet = forwardRef<React.ElementRef<typeof View>, ActionSheetProps>(
  function ActionSheet(
    {
      open,
      defaultOpen = false,
      onOpenChange,
      actions,
      title,
      message,
      cancelLabel = "Cancel",
      material = "solid",
      className,
    },
    ref
  ) {
    const haptics = useHaptic();
    const insets = useSafeAreaInsets();
    const reduce = useReducedMotion();
    const cancelPress = usePressAnimation({ pressedScale: 0.98 });
    const translateY = useSharedValue(OFFSCREEN_MIN);
    // Measured sheet height (+ bottom gap) — the exit travel distance.
    const offscreen = useSharedValue(OFFSCREEN_MIN);
    const opacity = useSharedValue(0);
    // Sheet brightness — ignites on open, dims on close.
    const lit = useSharedValue(0);
    // Finger offset layered on top of the open/close animation — declared
    // before the effect so the open path can reset it (TDZ).
    const drag = useSharedValue(0);
    const isControlled = open !== undefined;
    const [internal, setInternal] = React.useState(defaultOpen);
    const value = isControlled ? open === true : internal;
    // Kept mounted through the dim so the sheet leaves instead of blinking
    // away (deferred-unmount pattern).
    const [rendered, setRendered] = React.useState(value);
    // Skip the open haptic when mounted already-open (defaultOpen) — the
    // sheet didn't just appear in response to a user gesture.
    const firstRender = React.useRef(true);
    // The row a pick landed on — it holds lit while the others dim.
    const [picked, setPicked] = React.useState<number | null>(null);
    const pickTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const setOpen = React.useCallback(
      (next: boolean) => {
        if (!isControlled) setInternal(next);
        onOpenChange?.(next);
      },
      [isControlled, onOpenChange]
    );

    // Single user-initiated dismiss path — backdrop tap, hardware back,
    // cancel, and the drag-to-dismiss fling all get the close haptic.
    const dismiss = React.useCallback(() => {
      // A pick is already holding — it closes the sheet itself.
      if (pickTimer.current) return;
      haptics.selection();
      setOpen(false);
    }, [haptics, setOpen]);

    React.useEffect(
      () => () => {
        if (pickTimer.current) clearTimeout(pickTimer.current);
      },
      []
    );

    React.useEffect(() => {
      if (value) {
        if (firstRender.current) firstRender.current = false;
        else haptics.light();
        setRendered(true);
        setPicked(null);
        // Snap any leftover drag offset before rising — a fling-out leaves
        // `drag` mid-travel and the sheet must re-enter from clean.
        drag.value = 0;
        // Light before motion: the backdrop dims first, then the groups
        // rise on spring.panel (no overshoot). Reduced motion drops the
        // travel and keeps the ignite.
        opacity.value = withTiming(1, BACKDROP_IN);
        translateY.value = reduce ? 0 : withDelay(BACKDROP_LEAD, withSpring(0, spring.panel));
        lit.value = withDelay(BACKDROP_LEAD, withTiming(1, IGNITE));
        return;
      }
      firstRender.current = false;
      // Dim out on timing.recede, dropping only half the entrance travel;
      // the backdrop clears after the panel — the light restores last.
      if (!reduce) translateY.value = withTiming(translateY.value + offscreen.value / 2, DIM);
      lit.value = withTiming(0, DIM);
      opacity.value = withDelay(BACKDROP_TRAIL, withTiming(0, DIM));
      const t = setTimeout(() => {
        setRendered(false);
        // Park off-screen so the next open rises the full height.
        translateY.value = offscreen.value;
      }, DIM.duration + BACKDROP_TRAIL);
      return () => clearTimeout(t);
    }, [value, reduce, translateY, opacity, lit, offscreen, drag, haptics]);

    // Drag-to-dismiss: the sheet tracks a downward finger 1:1, rubber-bands
    // against upward pulls, the backdrop dims proportionally, and release
    // past 120px or an 800px/s fling closes it.
    const pan = React.useMemo(
      () =>
        PanResponder.create({
          onMoveShouldSetPanResponder: (_, g) => g.dy > 8 && Math.abs(g.dy) > Math.abs(g.dx),
          onPanResponderMove: (_, g) => {
            // Rubber-band: pulling the sheet *up* past rest resists at 20%.
            drag.value = g.dy > 0 ? g.dy : g.dy * 0.2;
          },
          onPanResponderRelease: (_, g) => {
            // g.vy is px/ms.
            if (g.dy > DISMISS_DISTANCE || g.vy > DISMISS_VELOCITY) {
              // Keep `drag` so the timing exit continues from the dragged
              // position — snapping to 0 would jump the sheet up mid-fling.
              dismiss();
            } else {
              drag.value = reduce ? 0 : withSpring(0, spring.panel);
            }
          },
          onPanResponderTerminate: () => {
            drag.value = reduce ? 0 : withSpring(0, spring.panel);
          },
        }),
      [dismiss, drag, reduce]
    );

    const sheetStyle = useAnimatedStyle(
      () => ({
        opacity: lit.value,
        transform: [{ translateY: translateY.value + drag.value }],
      }),
      []
    );
    const backdropStyle = useAnimatedStyle(() => ({
      opacity: opacity.value * Math.max(0, 1 - drag.value / 300),
    }));

    // Destructive actions lead the list (stable partition keeps
    // authored order within each group); cancel stays last on its own
    // surface below.
    const orderedActions = React.useMemo(
      () => [...actions.filter((a) => a.destructive), ...actions.filter((a) => !a.destructive)],
      [actions]
    );

    const handleAction = (action: ActionSheetAction) => {
      if (picked !== null) return;
      // Destructive confirmations answer with a warning buzz; everything
      // else gets a light selection tick.
      if (action.destructive) haptics.warning();
      else haptics.selection();
      // The touched row leads: it stays lit while the rest dim, holds, then
      // the sheet leaves and the action runs.
      setPicked(orderedActions.indexOf(action));
      pickTimer.current = setTimeout(() => {
        pickTimer.current = null;
        setOpen(false);
        action.onPress?.();
      }, PICK_HOLD);
    };

    // The title block switches on first, so action rows step after it.
    const head = title || message ? 1 : 0;

    return (
      <Modal
        visible={rendered}
        transparent
        animationType="none"
        onRequestClose={dismiss}
        statusBarTranslucent
      >
        <View ref={ref} className="flex-1 justify-end" style={{ width: "100%", height: "100%" }} accessibilityViewIsModal>
          <Animated.View style={[{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }, backdropStyle]} className="bg-overlay">
            <Pressable
              style={{ width: "100%", height: "100%" }}
              onPress={dismiss}
              accessibilityLabel="Close action sheet" accessibilityRole="button"
            />
          </Animated.View>
          <Animated.View
            // Detached sheet: 8pt side inset and a bottom gap that clears
            // the home indicator — the sheet floats, it doesn't dock.
            style={[sheetStyle, { paddingBottom: Math.max(16, insets.bottom + 8) }]}
            onLayout={(e) => {
              offscreen.value = Math.max(OFFSCREEN_MIN, e.nativeEvent.layout.height + 16);
            }}
            className={cn("w-full max-w-[480px] self-center px-2", className)}
            {...pan.panHandlers}
            // A sheet of actions is menu-shaped — "menu" on native, `role`
            // carries it to web alongside aria-modal.
            accessibilityRole="menu"
            role="menu"
            aria-modal
            accessibilityViewIsModal
          >
            <SheetGroup material={material}>
              {title || message ? (
                <IgniteRow index={0} active={value} passed={picked !== null}>
                  <View className="items-center gap-1 border-b border-border px-6 py-4">
                    {title ? (
                      <Text
                        className="text-center text-[13px] font-semibold text-muted-foreground"
                        accessibilityRole="header"
                      >
                        {title}
                      </Text>
                    ) : null}
                    {message ? (
                      <Text className="text-center text-[13px] leading-snug text-muted-foreground">
                        {message}
                      </Text>
                    ) : null}
                  </View>
                </IgniteRow>
              ) : null}
              {orderedActions.map((action, i) => (
                // Labels switch on top to bottom once the group has surfaced.
                <IgniteRow
                  key={`${action.label}-${i}`}
                  index={i + head}
                  active={value}
                  passed={picked !== null && picked !== i}
                >
                  <SheetActionRow action={action} bordered={i > 0} picked={picked === i} onSelect={handleAction} />
                </IgniteRow>
              ))}
            </SheetGroup>
            {/* Cancel is its own group — it switches on last. */}
            <IgniteRow index={orderedActions.length + head} active={value} passed={picked !== null}>
              <SheetGroup material={material} className="mt-2">
                <Pressable
                  onPress={dismiss}
                  onPressIn={cancelPress.onPressIn}
                  onPressOut={cancelPress.onPressOut}
                  className="min-h-[56px] items-center justify-center active:bg-accent"
                  accessibilityRole="button"
                  accessibilityLabel={cancelLabel}
                >
                  <Animated.View style={cancelPress.animatedStyle}>
                    <Text className="text-[17px] font-semibold text-foreground">{cancelLabel}</Text>
                  </Animated.View>
                </Pressable>
              </SheetGroup>
            </IgniteRow>
          </Animated.View>
        </View>
      </Modal>
    );
  }
);

ActionSheet.displayName = "ActionSheet";
