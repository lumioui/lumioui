import * as React from "react";
import { createContext, forwardRef, useContext } from "react";
import { Modal, PanResponder, Pressable, View, Text, useWindowDimensions, type ViewProps, type TextProps, type PressableProps, } from "react-native";
import Animated, {
  Easing,
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import {
  BAND_STAGGER,
  cn,
  ease,
  rowDelay,
  ROW_STAGGER_CAP,
  spring,
  SWITCH_DIM,
  tempo,
  timing,
  useHaptic,
  usePressAnimation,
  useReducedMotion,
} from "@lumioui/core";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RollingText } from "../animated-number/animated-number";

/*
 * Light before motion, container then content (DESIGN-TASTE §5c):
 *   open   scrim dims in → 80ms → the empty panel glides in → its rows switch
 *          on 40ms apart → unread counts switch on last.
 *   pick   the picked row's pill lights and holds 200ms → the panel dims out
 *          → the scrim clears last, while the screen behind swaps in place.
 */

/** Backdrop dims in over timing.normal. */
const SCRIM_IN = { duration: timing.normal.duration, easing: Easing.bezier(...ease.out) } as const;
/** The scrim's light leads the panel by this much. */
const SCRIM_LEAD = 80;
/** Rows switch on once the panel has mostly landed — container, then content. */
const CONTENT_AT = SCRIM_LEAD + BAND_STAGGER;
/** Counts switch on after every row has (the row stagger's cap). */
const COUNTS_AT = CONTENT_AT + ROW_STAGGER_CAP;
/** Pick → the lit pill holds this long before the drawer leaves. */
const PICK_HOLD = 200;
/** Exit: the scrim clears after the panel has started to dim. */
const SCRIM_TRAIL = 80;
/** Active pill light (an accent wash at 10%); a fresh pick lights it brighter for the hold. */
const PILL_REST = 0.1;
const PILL_PICK = 0.18;
/** Exit: the panel dims while sliding only half its width back toward the
 *  edge — ~60% of the spring.panel entrance, on ease.in. */
const PANEL_EXIT = { duration: tempo.flick, easing: Easing.bezier(...ease.in) } as const;
const EXIT_TRAVEL = 0.5;
/** Reduced motion — the panel ignites in place instead of sliding. */
const IGNITE = { duration: timing.fast.duration, easing: Easing.bezier(...ease.out) } as const;
/** Drag-to-dismiss: share of the panel width, and fling velocity (px/ms). */
const DISMISS_SHARE = 0.3;
const DISMISS_VELOCITY = 0.8;

interface DrawerCtx {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  side: "left" | "right";
  /** Bumps on every open — rows switch on again each time. */
  openSeq: number;
  /** ms a picked row's lit pill holds before the drawer leaves. */
  pickHold: number;
}
const Ctx = createContext<DrawerCtx | null>(null);

function useDrawer() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("Drawer.* must be inside <Drawer>");
  return ctx;
}

export interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Edge the drawer slides in from. Default "left". */
  side?: "left" | "right";
  /** Drawer width in pt. Default 300. */
  width?: number;
  /** Extra classes for the drawer panel. */
  className?: string;
  /** ms a picked item's lit pill holds before the drawer closes and the
   *  item's onPress runs — the user sees the pick land. 0 closes at once.
   *  Default 200. */
  pickHold?: number;
  children: React.ReactNode;
}

/**
 * Drawer — side navigation panel. The scrim dims first, then the empty panel
 * glides in from an edge on spring.panel and its rows switch on in reading
 * order (counts last). A pick lights the row's pill and holds it, then the
 * panel dims as it slides half-way back and the scrim clears last. Backdrop
 * taps and drags dismiss.
 */
function DrawerRoot({
  open,
  onOpenChange,
  side = "left",
  width = 300,
  className,
  pickHold = PICK_HOLD,
  children,
}: DrawerProps) {
  const [openSeq, setOpenSeq] = React.useState(open ? 1 : 0);
  const [wasOpen, setWasOpen] = React.useState(open);
  if (wasOpen !== open) {
    setWasOpen(open);
    if (open) setOpenSeq((n) => n + 1);
  }
  const { width: winW } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const panelW = Math.min(width, winW * 0.85);
  const translateX = useSharedValue(side === "left" ? -panelW : panelW);
  const opacity = useSharedValue(0);
  // Panel brightness — dims on every exit; under reduced motion it also
  // carries the entrance in place of the slide.
  const panelOpacity = useSharedValue(1);
  const haptics = useHaptic();
  const reduceMotion = useReducedMotion();
  // Finger offset layered on the open/close animation — declared before the
  // effect so the open path can reset it (TDZ).
  const drag = useSharedValue(0);
  // Held mounted through the exit — `visible={open}` would drop the
  // Modal the instant close starts and the exit would never render.
  const [rendered, setRendered] = React.useState(open);
  React.useEffect(() => {
    // Fire on the initial mount too — opening into an already-open drawer
    // (e.g. restored state) should feel identical to a user-driven open.
    if (open) {
      haptics.light();
    }
    if (open) {
      setRendered(true);
      // Snap any leftover drag offset before springing in — a fling-out
      // leaves `drag` mid-travel and the panel must re-enter from clean.
      drag.value = 0;
      // Light before motion: the scrim dims in first, the panel follows.
      if (reduceMotion) {
        // No travel — the panel ignites in place instead.
        translateX.value = 0;
        panelOpacity.value = 0;
        panelOpacity.value = withDelay(SCRIM_LEAD, withTiming(1, IGNITE));
      } else {
        // Glide in on spring.panel — lands dead on the edge, no rebound.
        panelOpacity.value = 1;
        translateX.value = withDelay(SCRIM_LEAD, withSpring(0, spring.panel));
      }
      opacity.value = withTiming(1, SCRIM_IN);
    } else {
      if (!rendered) return;
      const offscreen = side === "left" ? -panelW : panelW;
      panelOpacity.value = withTiming(0, PANEL_EXIT);
      if (!reduceMotion) {
        translateX.value = withTiming(translateX.value + offscreen * EXIT_TRAVEL, PANEL_EXIT);
      }
      // The light restores last — the scrim clears after the panel dims.
      opacity.value = withDelay(SCRIM_TRAIL, withTiming(0, PANEL_EXIT));
      const t = setTimeout(() => {
        setRendered(false);
        // Park off-screen so the next open glides the full width.
        translateX.value = offscreen;
      }, SCRIM_TRAIL + PANEL_EXIT.duration);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, side, panelW, translateX, opacity, panelOpacity, reduceMotion, rendered, drag]);

  // Drag-to-dismiss: the panel tracks your finger toward its own edge,
  // rubber-bands the other way, backdrop dims proportionally; release past
  // 30% or with a ~800px/s fling to close.
  const pan = React.useMemo(
    () =>
      PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        side === "left" ? g.dx < -8 : g.dx > 8,
      onPanResponderMove: (_, g) => {
        // Reduced motion: skip finger-tracking entirely — the release
        // handler still reads g.dx/vx so a committed swipe dismisses,
        // but the panel never travels under the user's finger.
        if (reduceMotion) return;
        // 1:1 toward the closing edge; rubber-band at 20% when pushed
        // *into* the screen past the fully-open position.
        const toward = side === "left" ? g.dx < 0 : g.dx > 0;
        drag.value = toward ? g.dx : g.dx * 0.2;
      },
      onPanResponderRelease: (_, g) => {
        const dragged = side === "left" ? -g.dx : g.dx;
        // g.vx is px/ms — 0.8 ≈ 800px/s, the sheet-dismiss velocity.
        const flung = side === "left" ? -g.vx : g.vx;
        if (dragged > panelW * DISMISS_SHARE || flung > DISMISS_VELOCITY) {
          // Keep `drag` so the timing exit continues from the dragged
          // position — snapping to 0 would jerk the panel back mid-fling.
          haptics.selection();
          onOpenChange(false);
        } else {
          drag.value = reduceMotion ? 0 : withSpring(0, spring.panel);
        }
      },
      onPanResponderTerminate: () => {
        drag.value = reduceMotion ? 0 : withSpring(0, spring.panel);
      },
      }),
    [side, panelW, onOpenChange, drag, reduceMotion, haptics]
  );

  const panelStyle = useAnimatedStyle(() => ({
    opacity: panelOpacity.value,
    transform: [{ translateX: translateX.value + drag.value }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value * (1 - Math.abs(drag.value) / panelW),
  }));

  return (
    <Ctx.Provider value={{ open, onOpenChange, side, openSeq, pickHold }}>
      <Modal
        visible={rendered}
        transparent
        animationType="none"
        onRequestClose={() => onOpenChange(false)}
        statusBarTranslucent
      >
        <View
          // Phone-width modal surface — panel + scrim confined to a
          // centered column, matching the sheet components' 480 cap. On
          // phones (≤480px) this is a no-op.
          className="w-full max-w-[480px] self-center"
          style={{ height: "100%" }}
        >
          <Animated.View className="bg-overlay" style={[{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }, backdropStyle]}>
            <Pressable
              style={{ width: "100%", height: "100%" }}
              onPress={() => {
                haptics.selection();
                onOpenChange(false);
              }}
              accessibilityLabel="Close drawer" accessibilityRole="button"
            />
          </Animated.View>
          <Animated.View
            style={[
              {
                position: "absolute",
                top: 0,
                bottom: 0,
                width: panelW,
                paddingTop: insets.top,
                paddingBottom: insets.bottom,
                ...(side === "left" ? { left: 0 } : { right: 0 }),
                // EXCEPTION: no shadow token — a modal drawer needs real
                // elevation over the scrim (shadow-lg is web-only, so the
                // native shadow + edge hairline do the work here).
                shadowColor: "#000",
                shadowOpacity: 0.2,
                shadowRadius: 16,
                shadowOffset: { width: side === "left" ? 6 : -6, height: 0 },
                elevation: 16,
              },
              panelStyle,
            ]}
            {...pan.panHandlers}
            className={cn(
              // A solid surface over the scrim with its open edge rounded
              // (16pt). One depth treatment — the
              // scrim + shadow — so no edge hairline. (Was Lumio glass:
              // decorative glass over a scrim reads muddy and breaks dark.)
              "bg-card",
              side === "left" ? "rounded-r-2xl" : "rounded-l-2xl",
              className,
            )}
            accessibilityViewIsModal
            accessibilityRole="menu"
            accessibilityLabel="Navigation drawer"
          >
            <View className="flex-1 py-2">{children}</View>
          </Animated.View>
        </View>
      </Modal>
    </Ctx.Provider>
  );
}

/** Content inside the panel starts dim and switches on `delay` ms after each open. */
function useSwitchOnAt(delay: number) {
  const { openSeq } = useDrawer();
  const on = useSharedValue(SWITCH_DIM);
  React.useEffect(() => {
    on.value = SWITCH_DIM;
    on.value = withDelay(delay, withTiming(1, IGNITE));
  }, [openSeq, delay, on]);
  return useAnimatedStyle(() => ({ opacity: on.value }));
}

const DrawerHeader = forwardRef<React.ElementRef<typeof View>, ViewProps & { className?: string }>(
  function DrawerHeader({ className, style, ...props }, ref) {
    const lit = useSwitchOnAt(CONTENT_AT);
    return (
      <Animated.View
        ref={ref}
        style={[lit, style]}
        className={cn("px-5 pb-3 pt-4", className)}
        {...props}
      />
    );
  }
);

/** Per-digit unread count — only the digits that change roll, in the
 *  direction the count moved. */
function DrawerCount({ value, active }: { value: number; active: boolean }) {
  const [last, setLast] = React.useState({ value, dir: 1 as 1 | -1 });
  if (last.value !== value) setLast({ value, dir: value > last.value ? 1 : -1 });
  return (
    <RollingText
      text={String(value)}
      direction={last.dir}
      glyphClassName={cn("text-sm", active ? "font-semibold text-primary-text" : "text-muted-foreground")}
    />
  );
}

const DrawerTitle = forwardRef<React.ElementRef<typeof Text>, TextProps & { className?: string }>(
  function DrawerTitle({ className, ...props }, ref) {
    return (
      <Text
        ref={ref}
        className={cn("text-lg font-semibold text-card-foreground", className)}
        accessibilityRole="header"
        {...props}
      />
    );
  }
);

export interface DrawerItemProps extends Omit<PressableProps, "children"> {
  /** Item label. */
  label: string;
  /** Optional icon slot before the label. */
  icon?: React.ReactNode;
  /** Highlight as the active destination. */
  active?: boolean;
  /** Trailing slot — an unread count or badge, right-aligned. Strings
   *  render as a muted label (bold when active); numbers roll per digit
   *  when they change. */
  trailing?: React.ReactNode;
  /** Reading-order position — the row switches on 40ms after the one
   *  above it on each open. Without it the rows switch on together. */
  index?: number;
  className?: string;
}

const DrawerItem = forwardRef<React.ElementRef<typeof Pressable>, DrawerItemProps>(
  function DrawerItem(
    { label, icon, active, trailing, index, disabled, className, onPress, onPressIn, onPressOut, ...props },
    ref
  ) {
    const { onOpenChange, openSeq, pickHold } = useDrawer();
    const haptics = useHaptic();
    const press = usePressAnimation({ pressedScale: 0.96 });
    const ink = useSharedValue(0);
    const inkStyle = useAnimatedStyle(() => ({ opacity: ink.value * 0.06 }));

    // Switch-on: the row in reading order, its count after every row.
    const rowStyle = useSwitchOnAt(index == null ? CONTENT_AT : CONTENT_AT + rowDelay(index + 1));
    const countStyle = useSwitchOnAt(COUNTS_AT);

    // The pick lights this row's pill at once (before `active` catches up)
    // and holds it; the drawer leaves after the hold.
    const [pickedSeq, setPickedSeq] = React.useState(-1);
    const picked = pickedSeq === openSeq;
    const on = !!active || picked;
    const pill = useSharedValue(on ? PILL_REST : 0);
    React.useEffect(() => {
      const to = picked ? PILL_PICK : on ? PILL_REST : 0;
      pill.value = withTiming(to, on ? IGNITE : timing.recede);
    }, [on, picked, pill]);
    const pillStyle = useAnimatedStyle(() => ({ opacity: pill.value }));
    const labelInk = useSharedValue(on ? 1 : 0);
    React.useEffect(() => {
      labelInk.value = withTiming(on ? 1 : 0, on ? IGNITE : timing.recede);
    }, [on, labelInk]);
    const idleInkStyle = useAnimatedStyle(() => ({ opacity: 1 - labelInk.value }));
    const activeInkStyle = useAnimatedStyle(() => ({ opacity: labelInk.value }));
    const holdTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    React.useEffect(
      () => () => {
        if (holdTimer.current) clearTimeout(holdTimer.current);
      },
      []
    );

    return (
      <Pressable
        ref={ref}
        disabled={disabled}
        onPress={(e) => {
          haptics.selection();
          if (pickHold <= 0) {
            onOpenChange(false);
            onPress?.(e);
            return;
          }
          setPickedSeq(openSeq);
          if (holdTimer.current) clearTimeout(holdTimer.current);
          holdTimer.current = setTimeout(() => {
            onOpenChange(false);
            onPress?.(e);
          }, pickHold);
        }}
        onPressIn={(e) => {
          press.onPressIn();
          ink.value = withTiming(1, timing.instant);
          onPressIn?.(e);
        }}
        onPressOut={(e) => {
          press.onPressOut();
          ink.value = withTiming(0, timing.fast);
          onPressOut?.(e);
        }}
        // Destination: a 56pt pill inset 12pt from the panel edge.
        className={cn("mx-3 min-h-14 overflow-hidden rounded-full", disabled && "opacity-50", className)}
        // The panel is role "menu" — children must be menu items, not buttons.
        accessibilityRole="menuitem"
        accessibilityLabel={label}
        accessibilityState={{ selected: active ?? false, disabled: disabled ?? false }}
        // accessibilityState isn't forwarded to the DOM on web — mirror it.
        aria-selected={active ?? false}
        aria-disabled={disabled ?? false}
        {...props}
      >
        <Animated.View
          pointerEvents="none"
          style={[{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }, pillStyle]}
          className="bg-primary"
        />
        <Animated.View style={press.animatedStyle} className="min-h-14 flex-row items-center gap-3 pl-4 pr-6">
          <Animated.View style={rowStyle} className="flex-1 flex-row items-center gap-3">
            {icon}
            {/* Label ink crossfades with the pill light — never flips by class. */}
            <View className="flex-1 justify-center">
              <Animated.Text
                style={idleInkStyle}
                className="text-[15px] font-medium text-card-foreground"
                numberOfLines={1}
              >
                {label}
              </Animated.Text>
              <Animated.Text
                style={activeInkStyle}
                className="absolute left-0 right-0 text-[15px] font-semibold text-primary-text"
                numberOfLines={1}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              >
                {label}
              </Animated.Text>
            </View>
          </Animated.View>
          {trailing != null && trailing !== false ? (
            <Animated.View style={countStyle}>
              {typeof trailing === "number" ? (
                <DrawerCount value={trailing} active={on} />
              ) : typeof trailing === "string" ? (
                <Text
                  className={cn("text-sm tabular-nums", on ? "font-semibold text-primary-text" : "text-muted-foreground")}
                >
                  {trailing}
                </Text>
              ) : (
                trailing
              )}
            </Animated.View>
          ) : null}
        </Animated.View>
        <Animated.View
          pointerEvents="none"
          style={[{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }, inkStyle]}
          className="bg-foreground"
        />
      </Pressable>
    );
  }
);

export const Drawer = Object.assign(DrawerRoot, {
  Header: DrawerHeader,
  Title: DrawerTitle,
  Item: DrawerItem,
});

DrawerRoot.displayName = "Drawer";
DrawerHeader.displayName = "DrawerHeader";
DrawerTitle.displayName = "DrawerTitle";
DrawerItem.displayName = "DrawerItem";
