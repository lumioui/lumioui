import * as React from "react";
import { createContext, useContext, useCallback, useRef, useMemo, useState, useEffect } from "react";
import { View, Text, Pressable, PanResponder, StyleSheet, type ViewProps } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  interpolate,
  runOnJS,
  Easing,
  withRepeat,
  useAnimatedProps,
} from "react-native-reanimated";
import Svg from "react-native-svg";
import {
  AnimatedPath,
  cn,
  useHaptic,
  useTheme,
  spring,
  tempo,
  timing,
  ease,
  useReducedMotion,
  usePressAnimation,
  type AnimatedViewStyle,
} from "@lumioui/core";
import { Icon, type IconName } from "../icon";
import { Glass } from "../glass";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Toast — rises 16px from its screen edge at 0.97 scale on spring.surface
 * and its face switches on 100ms after the container. Statuses swap in place;
 * loading → success stops the rotor and draws the check (240ms, ease.out) in
 * a full-strength status glyph. Collapsed
 * stack with slot reordering, swipe-to-dismiss that flings with the finger,
 * auto-dismiss that dims in place, and configurable position.
 *   <ToastProvider position="top">
 *     {children}
 *   </ToastProvider>
 *   const { show, success, error, warning } = useToast();
 *   show("Saved", { description: "Your changes are live", variant: "success" });
 */

type ToastVariant = "default" | "success" | "error" | "warning" | "info" | "loading";
type ToastPosition = "top" | "bottom";

interface ToastData {
  id: number;
  title: string;
  description?: string;
  variant: ToastVariant;
  /** Glyph for the icon well instead of the variant's default. */
  icon?: IconName;
  duration: number;
  dismissible: boolean;
  action?: ToastAction;
  /** Set by the provider to start the exit animation; removed from state once it finishes. */
  leaving?: boolean;
  /** Stack depth captured when the exit started — drives the dismissAll stagger. */
  exitIndex?: number;
}

interface ToastAction {
  label: string;
  onPress: () => void;
  /** Dismiss the toast after the action runs. Default true — set false for
   *  actions like Retry that swap the same toast in place. */
  dismiss?: boolean;
}

interface ToastApi {
  show: (
    title: string,
    opts?: {
      description?: string;
      variant?: ToastVariant;
      /** Glyph for the icon well (e.g. "archive"); defaults to the variant's. */
      icon?: IconName;
      duration?: number;
      dismissible?: boolean;
      action?: ToastAction;
    }
  ) => number;
  success: (title: string, description?: string) => number;
  error: (title: string, description?: string) => number;
  warning: (title: string, description?: string) => number;
  info: (title: string, description?: string) => number;
  loading: (title: string, description?: string) => number;
  dismiss: (id: number) => void;
  dismissAll: () => void;
  update: (id: number, patch: Partial<Omit<ToastData, "id">>) => void;
}

const Ctx = createContext<ToastApi | null>(null);

/** Imperative toast API — call `useToast()` anywhere inside <ToastProvider>. */
export function useToast(): ToastApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast must be inside <ToastProvider>");
  return ctx;
}

/** One neutral well for every status; the glyph carries the colour at full
 *  strength (no faint status washes). */
const variantIconBg: Record<ToastVariant, string> = {
  default: "bg-muted",
  success: "bg-muted",
  error: "bg-muted",
  warning: "bg-muted",
  info: "bg-muted",
  loading: "bg-muted",
};

const variantIconColor: Record<ToastVariant, string> = {
  default: "mutedForeground",
  success: "success",
  error: "destructive",
  warning: "warning",
  info: "primary",
  loading: "primary",
};

const variantIcon: Record<ToastVariant, IconName> = {
  default: "bell",
  success: "check",
  error: "x",
  warning: "alert-triangle",
  info: "info",
  loading: "loader",
};

const variantHaptic: Record<ToastVariant, "selection" | "success" | "error" | "warning" | "light"> = {
  default: "selection",
  success: "success",
  error: "error",
  warning: "warning",
  info: "light",
  loading: "light",
};

/** Horizontal swipe distance that dismisses (72px). */
const DISMISS_DX = 72;
const DISMISS_DY = 40;
/** Fling-to-dismiss velocity — 520px/s expressed in PanResponder's px/ms. */
const DISMISS_VX = 0.52;
/** Collapsed stack: each older toast peeks this far past the card in front. */
const STACK_GAP = 14;
/** Collapsed stack: scale shrink per level of depth. */
const STACK_SCALE_STEP = 0.04;
/** Collapsed stack: older cards dim a step per level so the front one leads. */
const STACK_DIM_STEP = 0.28;
/** Per-depth delay so a dismissAll collapse dims front-to-back. */
const EXIT_STAGGER_MS = 40;
const EASE_OUT = Easing.bezier(...ease.out);
/** Entrance: rises 16px at 0.97 on spring.surface while igniting. */
const ENTER_RISE = 16;
const ENTER_SCALE = 0.97;
const IGNITE = { duration: timing.fast.duration, easing: EASE_OUT };
/** Auto / tap dismiss: the card dims in place over 160ms. */
const DIM = { duration: tempo.flick, easing: Easing.bezier(...ease.in) };
/** Swipe dismiss: the card keeps going the way it was flung. */
const FLING = { duration: tempo.flick, easing: EASE_OUT };
const FLING_DISTANCE = 400;
/** Content swap: outgoing dims to 0.96, incoming ignites 0.96→1. */
const SWAP_SCALE = 0.96;
const SWAP_DIM = { duration: timing.recede.duration, easing: Easing.bezier(...ease.in) };
/** Soft, low shadow under the light-scheme card (raw black reads in both
 *  schemes; on dark it simply disappears into the canvas). */
const CARD_SHADOW = { shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 6 } as const;
/** The face switches on 60ms into the container's 160ms ignite (§5c rule 2),
 *  overlapping, so the card is never full-bright and empty. */
const FACE_AFTER = 60;
/** The check draws at the mark-drawing pace shared with Checkbox (240ms). */
const CHECK_DRAW = { duration: timing.recede.duration * 2, easing: EASE_OUT };
const CHECK_PATH = "M5 12.5l4.5 4.5L19 7.5";
const CHECK_LEN = 22;
/** Loading rotor — one lap every 1.1s, linear. */
const SPIN_CYCLE = { duration: 1100, easing: Easing.linear };

/** The success mark draws itself in rather than appearing. */
function DrawnCheck({ color }: { color: string }) {
  const reduce = useReducedMotion();
  const draw = useSharedValue(reduce ? 1 : 0);
  useEffect(() => {
    if (!reduce) draw.value = withTiming(1, CHECK_DRAW);
  }, [reduce, draw]);
  const props = useAnimatedProps(() => ({ strokeDashoffset: CHECK_LEN * (1 - draw.value) }));
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24">
      <AnimatedPath
        d={CHECK_PATH}
        stroke={color}
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        strokeDasharray={`${CHECK_LEN} ${CHECK_LEN}`}
        animatedProps={props}
      />
    </Svg>
  );
}

/** Animated.View as registered with NativeWind cssInterop in core/styled.ts. */
const AnimatedView = Animated.View as React.ComponentType<
  Omit<ViewProps, "style"> & { className?: string; style?: AnimatedViewStyle; ref?: React.Ref<React.ComponentRef<typeof View>> }
>;

/** Depth map over active (non-leaving) toasts — newest is depth 0. Leaving
 *  toasts are skipped so siblings can reorder while the exit plays. */
function depthOrder(list: ToastData[]) {
  const map = new Map<number, number>();
  let d = 0;
  for (let i = list.length - 1; i >= 0; i--) {
    const t = list[i]!;
    if (!t.leaving) map.set(t.id, d++);
  }
  return map;
}

/** The face currently rendered inside the card — staged so variant/title
 *  changes can crossfade in place instead of remounting. */
interface ShownContent {
  variant: ToastVariant;
  title: string;
  description?: string;
}

interface ToastItemProps {
  toast: ToastData;
  position: ToastPosition;
  /** Index from the front of the stack — 0 is the newest, fully visible card. */
  depth: number;
  /** Stack levels that stay visible; deeper toasts fade out behind the pile. */
  maxVisible: number;
  /** Card material — "solid" card (default) or liquid "glass". */
  surface: "solid" | "glass";
  onRequestDismiss: (id: number) => void;
  onDone: (id: number) => void;
}

function ToastItem({ toast, position, depth, maxVisible, surface, onRequestDismiss, onDone }: ToastItemProps) {
  const haptics = useHaptic();
  const reduce = useReducedMotion();
  const { colors } = useTheme();
  // Slot transform — where this toast sits in the collapsed stack. Driven
  // per depth so removing a sibling settles everyone into their new slot.
  const stackY = useSharedValue(0);
  const stackScale = useSharedValue(1);
  const stackOpacity = useSharedValue(1);
  const prevDepth = useRef(depth);
  // Entrance + drag layers compose on top of the slot transform.
  // The toast rises 16px from its edge at 0.97 scale.
  const enterY = useSharedValue(reduce ? 0 : position === "top" ? -ENTER_RISE : ENTER_RISE);
  const enterScale = useSharedValue(reduce ? 1 : ENTER_SCALE);
  const opacity = useSharedValue(0);
  /** The face switches on after the container. */
  const faceOn = useSharedValue(0);
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const spin = useSharedValue(0);
  const morphIn = useSharedValue(1);
  const morphInScale = useSharedValue(1);
  const morphOut = useSharedValue(0);
  const exited = useRef(false);
  // Press scale feedback for the action + dismiss buttons.
  const actionPress = usePressAnimation({ pressedScale: 0.92 });
  const dismissPress = usePressAnimation({ pressedScale: 0.92 });

  const signature = `${toast.variant}|${toast.title}|${toast.description ?? ""}`;
  const [shown, setShown] = useState<ShownContent>({
    variant: toast.variant,
    title: toast.title,
    description: toast.description,
  });
  const [outgoing, setOutgoing] = useState<ShownContent | null>(null);

  // Only the front card is touchable — stacked slivers behind it don't
  // steal gestures, and a leaving toast ignores input while it exits.
  const interactive = !toast.leaving && depth === 0;

  // Status swap in place (icon + content). The previous face renders in an
  // overlay that dims out while the new face ignites — the card surface
  // itself never remounts.
  useEffect(() => {
    if (shown.variant === toast.variant && shown.title === toast.title && shown.description === toast.description) return;
    const next: ShownContent = { variant: toast.variant, title: toast.title, description: toast.description };
    if (reduce) {
      setShown(next);
      setOutgoing(null);
      morphIn.value = 1;
      return;
    }
    setOutgoing(shown);
    setShown(next);
    morphIn.value = 0;
    morphIn.value = withTiming(1, IGNITE);
    morphInScale.value = SWAP_SCALE;
    morphInScale.value = withSpring(1, spring.swap);
    morphOut.value = 1;
    morphOut.value = withTiming(0, SWAP_DIM, (finished) => {
      if (finished) runOnJS(setOutgoing)(null);
    });
    // `shown` is read for the outgoing copy — `signature` is the real trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, reduce]);

  // Entrance — mount only. The variant haptic lives in the provider's
  // show() so toast.update() can't refire it.
  useEffect(() => {
    if (reduce) {
      enterY.value = 0;
      enterScale.value = 1;
      opacity.value = withTiming(1, IGNITE);
      faceOn.value = withDelay(FACE_AFTER, withTiming(1, IGNITE));
    } else {
      enterY.value = withSpring(0, spring.surface);
      enterScale.value = withSpring(1, spring.surface);
      opacity.value = withTiming(1, IGNITE);
      faceOn.value = withDelay(FACE_AFTER, withTiming(1, IGNITE));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-dismiss timer — re-keys on duration so update() can extend/reset it.
  useEffect(() => {
    if (toast.leaving || toast.duration <= 0) return;
    const t = setTimeout(() => onRequestDismiss(toast.id), toast.duration);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast.duration, toast.leaving]);

  // Exit — the provider flags `leaving`, the item plays its exit, then
  // reports back so the provider unmounts it. A swiped card keeps going the
  // way it was flung; every other dismissal dims in place. Slight per-depth
  // stagger makes a dismissAll collapse run front-to-back.
  useEffect(() => {
    if (!toast.leaving || exited.current) return;
    exited.current = true;
    const delay = reduce ? 0 : (toast.exitIndex ?? depth) * EXIT_STAGGER_MS;
    // dragX/dragY still hold the release position after a swipe.
    if (!reduce && dragX.value !== 0) {
      dragX.value = withTiming(Math.sign(dragX.value) * FLING_DISTANCE, FLING);
    } else if (!reduce && dragY.value !== 0) {
      dragY.value = withTiming(Math.sign(dragY.value) * FLING_DISTANCE, FLING);
    }
    opacity.value = withDelay(
      delay,
      withTiming(0, DIM, (finished) => {
        if (finished) runOnJS(onDone)(toast.id);
      })
    );
    // Fallback unmount if the worklet completion callback is dropped.
    const t = setTimeout(() => onDone(toast.id), delay + DIM.duration + 60);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast.leaving]);

  // Loading rotor — keyed on the shown face so a loading→success swap stops
  // the spin with the swap, not before.
  useEffect(() => {
    if (shown.variant === "loading" && !reduce) {
      spin.value = 0;
      spin.value = withRepeat(withTiming(360, SPIN_CYCLE), -1, false);
    }
    return () => { spin.value = 0; };
  }, [shown.variant, reduce, spin]);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value}deg` }],
  }));

  // Slot choreography — every toast springs to its slot, so removing one
  // makes the rest settle into place. Leaving toasts freeze at their last
  // slot while the exit plays so siblings can settle in behind them.
  useEffect(() => {
    if (toast.leaving) return;
    if (reduce) {
      // Reduced motion: collapse becomes opacity-only — no lift or scale.
      stackY.value = 0;
      stackScale.value = 1;
      stackOpacity.value = depth >= maxVisible ? 0 : 1;
      return;
    }
    const dir = position === "top" ? 1 : -1;
    // Moving forward (a card in front left) waits for the leaving card's dim,
    // so two faces are never legible on top of each other.
    const forward = depth < prevDepth.current;
    prevDepth.current = depth;
    const wait = forward ? timing.recede.duration : 0;
    // Restacking is a layout change — spring.layout settles cards into
    // their slots without bouncing past them.
    stackY.value = withDelay(wait, withSpring(dir * depth * STACK_GAP, spring.layout));
    stackScale.value = withDelay(wait, withSpring(Math.max(1 - depth * STACK_SCALE_STEP, 0), spring.layout));
    stackOpacity.value = withDelay(wait, withTiming(depth >= maxVisible ? 0 : 1 - depth * STACK_DIM_STEP, timing.fast));
  }, [depth, position, maxVisible, reduce, toast.leaving, stackY, stackScale, stackOpacity]);

  function requestDismissWithHaptic() {
    haptics.light();
    onRequestDismiss(toast.id);
  }

  // Swipe-to-dismiss via PanResponder — free components stay Expo Go
  // compatible, so no react-native-gesture-handler here. Capture on move
  // lets the pan steal the responder from the inner Pressable only once
  // the gesture is clearly a swipe, so taps still dismiss normally.
  const panResponder = useMemo(() => {
    if (reduce || !interactive || !toast.dismissible) return null;
    return PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_e, g) =>
        Math.abs(g.dx) > 8 || (position === "top" ? g.dy < -8 : g.dy > 8),
      onPanResponderMove: (_e, g) => {
        dragX.value = g.dx;
        dragY.value = position === "top" ? Math.min(g.dy, 0) : Math.max(g.dy, 0);
      },
      onPanResponderRelease: (_e, g) => {
        if (
          Math.abs(g.dx) > DISMISS_DX ||
          Math.abs(g.vx) > DISMISS_VX ||
          (position === "top" ? -g.dy > DISMISS_DY : g.dy > DISMISS_DY)
        ) {
          requestDismissWithHaptic();
        } else {
          // Carry the release fling into the snap-back (vx is px/ms,
          // Reanimated velocity is px/s) so a fast abort whips home.
          const v = g.vx * 1000;
          dragX.value = withSpring(0, { ...spring.layout, velocity: v });
          dragY.value = withSpring(0, { ...spring.layout, velocity: g.vy * 1000 });
        }
      },
      onPanResponderTerminate: () => {
        dragX.value = withSpring(0, spring.layout);
        dragY.value = withSpring(0, spring.layout);
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce, interactive, toast.dismissible, position, dragX, dragY]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: dragX.value },
      { translateY: stackY.value + enterY.value + dragY.value },
      { scale: stackScale.value * enterScale.value },
      // Slight tilt while swiping sideways — the card feels held, not on rails.
      { rotate: `${interpolate(dragX.value, [-160, 0, 160], [-2.5, 0, 2.5], "clamp")}deg` },
    ],
    opacity: stackOpacity.value,
  }));
  const cardStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const morphInStyle = useAnimatedStyle(() => ({
    opacity: morphIn.value * faceOn.value,
    transform: [{ scale: morphInScale.value }],
  }));
  const morphOutStyle = useAnimatedStyle(() => ({
    opacity: morphOut.value,
    transform: [{ scale: SWAP_SCALE + (1 - SWAP_SCALE) * morphOut.value }],
  }));

  // The card face — icon + text rendered from a `ShownContent` snapshot so
  // the outgoing copy can crossfade under the incoming one.
  const renderFace = (face: ShownContent) => (
    <View className="flex-1 flex-row items-start gap-3">
      {/* Status icon */}
      <View className={cn("h-8 w-8 shrink-0 items-center justify-center rounded-full", variantIconBg[face.variant])}>
        <Animated.View style={face.variant === "loading" ? spinStyle : undefined}>
          {face.variant === "success" ? (
            <DrawnCheck color={colors.success} />
          ) : (
            <Icon name={toast.icon ?? variantIcon[face.variant]} size="sm" color={variantIconColor[face.variant]} />
          )}
        </Animated.View>
      </View>
      {/* Content */}
      <View className="flex-1">
        <Text className="text-[15px] font-semibold text-popover-foreground" numberOfLines={1}>
          {face.title}
        </Text>
        {face.description ? (
          <Text className="mt-1 text-sm leading-snug text-muted-foreground" numberOfLines={toast.action ? 1 : 2}>
            {face.description}
          </Text>
        ) : null}
      </View>
      {/* The action sits on the right, centred on the row: one compact line. */}
        {toast.action ? (
          <Animated.View style={actionPress.animatedStyle} className="self-center">
            <Pressable
              onPressIn={actionPress.onPressIn}
              onPressOut={actionPress.onPressOut}
              onPress={() => {
                toast.action?.onPress();
                if (toast.action?.dismiss === false) haptics.light();
                else requestDismissWithHaptic();
              }}
              className="h-9 flex-row items-center rounded-full bg-primary px-4"
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={toast.action.label}
            >
              <Text className="text-[15px] font-semibold text-primary-foreground">{toast.action.label}</Text>
            </Pressable>
          </Animated.View>
        ) : null}
    </View>
  );

  // Status lives in the icon well; the card edge stays neutral. Solid is an
  // opaque card that reads in both schemes; glass is opt-in for apps whose
  // content behind the stack is photographic or moving.
  // One depth treatment per scheme: light = hairline plus a soft shadow;
  // dark = surface lightness (the popover token, a step above cards), no
  // hairline. The toast is a layer over content, never the same surface.
  const renderSurface = (inner: React.ReactNode) =>
    surface === "glass" ? (
      <Glass effect="regular" className="rounded-2xl">
        {inner}
      </Glass>
    ) : (
      <View className="rounded-2xl border border-border bg-popover dark:border-transparent" style={CARD_SHADOW}>
        {inner}
      </View>
    );

  const toastContent = (
    <Pressable
      onPress={toast.dismissible ? requestDismissWithHaptic : undefined}
      accessibilityRole="alert"
      accessibilityLabel={`${shown.variant}: ${shown.title}${shown.description ? `. ${shown.description}` : ""}`}
    >
      {renderSurface(
      <View className={cn("flex-row items-start gap-3 p-4")}>
        {/* Swap zone — icon + text swap in place here when the status or
            content changes; the action rides along, the dismiss button
            stays put. */}
        <View className="relative flex-1">
          <AnimatedView style={morphInStyle}>{renderFace(shown)}</AnimatedView>
          {outgoing ? (
            <AnimatedView
              pointerEvents="none"
              style={[StyleSheet.absoluteFill, morphOutStyle]}
            >
              {renderFace(outgoing)}
            </AnimatedView>
          ) : null}
        </View>
        {/* Dismiss button */}
        {toast.dismissible && !toast.action ? (
          <Animated.View style={dismissPress.animatedStyle}>
            <Pressable
              onPressIn={dismissPress.onPressIn}
              onPressOut={dismissPress.onPressOut}
              onPress={requestDismissWithHaptic}
              hitSlop={8}
              className="h-7 w-7 shrink-0 items-center justify-center rounded-full"
              accessibilityRole="button"
              accessibilityLabel="Dismiss toast"
            >
              <Icon name="x" size="sm" color="mutedForeground" />
            </Pressable>
          </Animated.View>
        ) : null}
      </View>
      )}
    </Pressable>
  );

  return (
    <AnimatedView
      pointerEvents={interactive ? "auto" : "none"}
      style={[
        // Absolute slot anchored to the stack's screen edge — every toast
        // lives at the same anchor and animates to its slot via stackY.
        {
          position: "absolute",
          left: 0,
          right: 0,
          zIndex: 100 - depth,
        },
        position === "top" ? { top: 0, transformOrigin: "top" } : { bottom: 0, transformOrigin: "bottom" },
        style,
      ]}
    >
      <AnimatedView style={cardStyle}>
        {panResponder ? (
          <View collapsable={false} {...panResponder.panHandlers}>
            {toastContent}
          </View>
        ) : (
          toastContent
        )}
      </AnimatedView>
    </AnimatedView>
  );
}

export interface ToastProviderProps {
  children: React.ReactNode;
  /** Where toasts appear. Default "top". */
  position?: ToastPosition;
  /** Auto-dismiss duration in ms. 0 = manual dismiss only. Default 4000. */
  defaultDuration?: number;
  /** Max simultaneous toasts. Older ones are dismissed with an exit animation. Default 4. */
  limit?: number;
  /** Stack levels that peek out behind the front toast. Deeper toasts stay
   *  queued (timers running) until a slot frees. Default 3. */
  maxVisible?: number;
  /** Card material. "solid" (default) is an opaque card with a hairline
   *  and soft shadow that reads in both schemes; "glass" is the Lumio glass
   *  material for apps whose content behind is photographic / moving. */
  surface?: "solid" | "glass";
}

/**
 * Mount once at the app root. Toasts land on a collapsed stack — the newest
 * card is full-size, older ones scale down, dim and peek past it. When one
 * leaves (swipe, tap, timeout, limit overflow, dismissAll), the rest settle
 * into their new slots.
 */
export const ToastProvider = React.forwardRef<React.ComponentRef<typeof View>, ToastProviderProps>(function ToastProvider(
  { children, position = "top", defaultDuration = 4000, limit = 4, maxVisible = 3, surface = "solid" },
  ref
) {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const idRef = useRef(0);
  const insets = useSafeAreaInsets();
  const haptics = useHaptic();

  // Flag-based dismissal: mark `leaving` and let the item run its exit
  // animation; `remove` is the callback that actually unmounts it.
  const requestDismiss = useCallback((id: number) => {
    setToasts((prev) => {
      const order = depthOrder(prev);
      return prev.map((t) =>
        t.id === id && !t.leaving ? { ...t, leaving: true, exitIndex: order.get(id) ?? 0 } : t
      );
    });
  }, []);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts((prev) => {
      const order = depthOrder(prev);
      return prev.map((t) => (t.leaving ? t : { ...t, leaving: true, exitIndex: order.get(t.id) ?? 0 }));
    });
  }, []);

  const update = useCallback((id: number, patch: Partial<Omit<ToastData, "id">>) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);

  const show = useCallback<ToastApi["show"]>(
    (title, opts) => {
      const id = ++idRef.current;
      const variant = opts?.variant ?? "default";
      // Mount haptic fires once at creation — updates swap in place quietly.
      haptics[variantHaptic[variant]]();
      setToasts((prev) => {
        const next: ToastData[] = [
          ...prev,
          {
            id,
            title,
            description: opts?.description,
            variant,
            icon: opts?.icon,
            duration: opts?.duration ?? defaultDuration,
            dismissible: opts?.dismissible ?? true,
            action: opts?.action,
          },
        ];
        const active = next.filter((t) => !t.leaving);
        if (active.length <= limit) return next;
        // Over limit: instead of hard-dropping the oldest, flag them leaving
        // so they dim out like any other dismissal.
        const order = depthOrder(next);
        const overflow = new Set(active.slice(0, active.length - limit).map((t) => t.id));
        return next.map((t) =>
          overflow.has(t.id) ? { ...t, leaving: true, exitIndex: order.get(t.id) ?? 0 } : t
        );
      });
      return id;
    },
    [defaultDuration, limit, haptics]
  );

  const api = React.useMemo<ToastApi>(
    () => ({
      show,
      success: (title, description) => show(title, { description, variant: "success" }),
      error: (title, description) => show(title, { description, variant: "error" }),
      warning: (title, description) => show(title, { description, variant: "warning" }),
      info: (title, description) => show(title, { description, variant: "info" }),
      loading: (title, description) => show(title, { description, variant: "loading", duration: 0, dismissible: false }),
      dismiss: requestDismiss,
      dismissAll,
      update,
    }),
    [show, requestDismiss, dismissAll, update]
  );

  const depthById = depthOrder(toasts);

  return (
    <Ctx.Provider value={api}>
      {children}
      {/* Single live region for the whole stack — screen readers announce
          arrivals/morphs once, not per-toast. Items are absolutely slotted
          so reorder never reflows the container. */}
      <View
        ref={ref}
        pointerEvents="box-none"
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        // max-w + mx-auto keeps the stack phone-width on wide canvases
        // (docs stage, tablets) while staying edge-inset on phones.
        className="absolute left-4 right-4 z-[9999] mx-auto max-w-[440px]"
        // Only the edge offset is dynamic (safe-area aware) — the rest
        // lives in className.
        style={
          position === "top"
            ? { top: insets.top + 8 }
            : { bottom: insets.bottom + 8 }
        }
      >
        {toasts.map((t) => (
          <ToastItem
            key={t.id}
            toast={t}
            position={position}
            depth={depthById.get(t.id) ?? t.exitIndex ?? 0}
            maxVisible={maxVisible}
            surface={surface}
            onRequestDismiss={requestDismiss}
            onDone={remove}
          />
        ))}
      </View>
    </Ctx.Provider>
  );
});
ToastProvider.displayName = "ToastProvider";
