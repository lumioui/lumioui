import * as React from "react";
import { forwardRef } from "react";
import { Modal, Platform, Pressable, View, Text, useWindowDimensions, type GestureResponderEvent, type PressableProps } from "react-native";
import Animated, { Easing, useSharedValue, useAnimatedStyle, withDelay, withTiming, withSpring, cancelAnimation } from "react-native-reanimated";
import { cn, ease, spring, timing, useHaptic, usePressAnimation, useReducedMotion, AnimatedPressable } from "@lumioui/core";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Tooltip — light follows the hold. While the finger rests on the trigger
// an ink light pools over it, charging with hold time. At the long-press
// the room dims first — four rects around the trigger, so the touched value
// stays lit — and the bubble ignites from the nub a beat later: rising 6px,
// growing 0.94 → 1 on spring.swap over timing.fast. Leaving reverses it:
// the bubble dims in place to 0.97 on timing.recede, the room clears last.
/** Peak of the hold light over the trigger — a charge you feel, not a fill. */
const CHARGE_PEAK = 0.12;
/** Scrim strength over the rest of the screen. */
const SCRIM_PEAK = 0.3;
/** Light before motion: the scrim leads the bubble by this beat. */
const SCRIM_LEAD = timing.instant.duration;
/** On exit the scrim clears half a dim after the bubble starts dimming. */
const SCRIM_TRAIL = timing.recede.duration / 2;
/** Breathing room between the lit trigger and the scrim. */
const CUTOUT_PAD = 4;
/** Phone-column width the scrim is confined to on wide (docs) canvases. */
const STAGE_MAX_W = 480;
/** Scale the bubble grows from. */
const ENTER_SCALE = 0.94;
/** Scale the bubble dims to on exit. */
const EXIT_SCALE = 0.97;
/** Rise from the trigger edge (px). */
const ENTER_DRIFT = 6;
const IGNITE = { duration: timing.fast.duration, easing: Easing.bezier(...ease.out) };
const DIM = { duration: timing.recede.duration, easing: Easing.bezier(...ease.in) };
/** The room dims on the recede beat — fast, so the bubble isn't kept waiting. */
const SCRIM_IN = { duration: timing.recede.duration, easing: Easing.bezier(...ease.out) };

/** Long-press delay — matches Pressable's default delayLongPress. */
const LONG_PRESS_MS = 500;
/** The hold light charges linearly across the whole long-press — it IS the wait. */
const CHARGE = { duration: LONG_PRESS_MS, easing: Easing.linear };
/** Finger travel that still counts as a hold (px). */
const MOVE_SLOP = 10;
/** Arrow nub — a square rotated 45° reads as a triangle on mobile. */
const ARROW = 10;
/** Space between the bubble (incl. arrow) and the trigger. */
const GAP = ARROW / 2 + 4;

export interface TooltipProps extends Omit<PressableProps, "children"> {
  /** Tooltip text shown above the wrapped element. */
  content: string;
  /** Wrapped element; long-press reveals the tooltip. */
  children: React.ReactNode;
  /** Auto-dismiss delay in ms. Default 2000. */
  dismissDelay?: number;
  /** Extra classes for the tooltip bubble. */
  className?: string;
  /** Preferred side of the trigger. Flips when it doesn't fit. Default "top". */
  side?: "top" | "bottom";
  /** Controlled visibility. Omit to let long-press + auto-dismiss manage it. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Tooltip — small floating label shown on long-press, auto-dismisses.
 */
export const Tooltip = forwardRef<React.ElementRef<typeof Pressable>, TooltipProps>(
  function Tooltip(
    { content, children, dismissDelay = 2000, className, side = "top", open, onOpenChange, onLongPress, ...props },
    ref
  ) {
    const haptics = useHaptic();
    const { width: winW, height: winH } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const reduceMotion = useReducedMotion();
    const isControlled = open !== undefined;
    const [internal, setInternal] = React.useState(false);
    const shown = isControlled ? open === true : internal;
    const setShown = React.useCallback(
      (next: boolean) => {
        if (!isControlled) setInternal(next);
        onOpenChange?.(next);
      },
      [isControlled, onOpenChange]
    );
    // Modal stays mounted through the recede so the exit is visible.
    const [rendered, setRendered] = React.useState(false);
    const [anchor, setAnchor] = React.useState<{ x: number; y: number; width: number; height: number } | null>(null);
    const [bubble, setBubble] = React.useState({ width: 0, height: 0 });
    const innerRef = React.useRef<React.ComponentRef<typeof View>>(null);
    const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const exitTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    // Own long-press timer — Pressable's onLongPress only runs on the
    // responder, and a pressable child (the common case: tooltip on a
    // button) always wins the grant, so a wrapper onLongPress never fires.
    // Touch events still bubble to ancestors on native, and RNW forwards
    // onMouse* props straight to DOM listeners, so tracking the press
    // ourselves works whether or not the child is interactive.
    const lpTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const lpOrigin = React.useRef<{ x: number; y: number } | null>(null);
    const lpEvent = React.useRef<GestureResponderEvent | null>(null);
    /** Hold light over the trigger, 0–1 (scaled by CHARGE_PEAK). */
    const charge = useSharedValue(0);
    const clearLp = () => {
      // A hold let go before the long-press dims its light back out.
      if (lpTimer.current) charge.value = withTiming(0, DIM);
      if (lpTimer.current) clearTimeout(lpTimer.current);
      lpTimer.current = null;
      lpOrigin.current = null;
    };
    const startLp = (e: GestureResponderEvent) => {
      clearLp();
      lpOrigin.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY };
      lpEvent.current = e;
      // The light pools with hold time — the press reads as charging.
      charge.value = withTiming(1, CHARGE);
      lpTimer.current = setTimeout(() => {
        lpTimer.current = null;
        haptics.medium();
        setShown(true);
        if (lpEvent.current) onLongPress?.(lpEvent.current);
      }, LONG_PRESS_MS);
    };
    const moveLp = (e: GestureResponderEvent) => {
      const o = lpOrigin.current;
      if (!o) return;
      if (Math.hypot(e.nativeEvent.pageX - o.x, e.nativeEvent.pageY - o.y) > MOVE_SLOP) clearLp();
    };
    // RNW-only props — untyped on Pressable but forwarded to the DOM.
    // DOM MouseEvent also carries pageX/pageY on nativeEvent, so the same
    // handlers work for both touch and mouse.
    const webLp =
      Platform.OS === "web"
        ? {
            onMouseDown: startLp,
            onMouseMove: moveLp,
            onMouseUp: clearLp,
            onMouseLeave: clearLp,
          }
        : undefined;
    const opacity = useSharedValue(0);
    const scale = useSharedValue(ENTER_SCALE);
    // Rise out of the trigger — the native substitute for
    // transformOrigin so the bubble slides out of the element, not the air.
    const drift = useSharedValue(0);
    /** Room dim around the lit trigger, 0–1 (scaled by SCRIM_PEAK). */
    const scrim = useSharedValue(0);
    const press = usePressAnimation({ pressedScale: 0.95 });

    React.useEffect(() => {
      if (shown) {
        // Measure the trigger async, then reveal. Controlled `open` flips
        // land here too — the long-press path just flips `shown`.
        innerRef.current?.measureInWindow((x, y, width, height) => {
          setAnchor({ x, y, width, height });
          setRendered(true);
          // The flat preview stage shifts the demo column when an overlay
          // mounts (padTop) — re-measure once settled or the bubble anchors
          // to stale coordinates and floats off its trigger.
          setTimeout(() => {
            innerRef.current?.measureInWindow((ax, ay, aw, ah) => {
              setAnchor({ x: ax, y: ay, width: aw, height: ah });
            });
          }, 350);
          // Light before motion: the room dims around the trigger first…
          scrim.value = withTiming(1, SCRIM_IN);
          // …then the bubble ignites from the nub a beat later.
          opacity.value = withDelay(SCRIM_LEAD, withTiming(1, IGNITE));
          // Rise out of the trigger edge while growing into place.
          scale.value = ENTER_SCALE;
          scale.value = reduceMotion ? 1 : withDelay(SCRIM_LEAD, withSpring(1, spring.swap));
          drift.value = side === "top" ? ENTER_DRIFT : -ENTER_DRIFT;
          drift.value = reduceMotion ? 0 : withDelay(SCRIM_LEAD, withSpring(0, spring.swap));
          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => setShown(false), dismissDelay);
        });
        return;
      }
      if (!rendered) return;
      // Dim in place — quicker than the entrance, no retreat. The room
      // (and the hold light) clears last.
      opacity.value = withTiming(0, DIM);
      if (!reduceMotion) scale.value = withTiming(EXIT_SCALE, DIM);
      scrim.value = withDelay(SCRIM_TRAIL, withTiming(0, DIM));
      charge.value = withDelay(SCRIM_TRAIL, withTiming(0, DIM));
      if (timerRef.current) clearTimeout(timerRef.current);
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
      exitTimerRef.current = setTimeout(() => setRendered(false), DIM.duration + SCRIM_TRAIL);
      return () => {
        if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
      };
    }, [shown, rendered, side, dismissDelay, opacity, scale, drift, scrim, charge, reduceMotion, setShown]);

    // User-initiated dismiss (backdrop tap / hardware back) gets the close
    // haptic; the auto-dismiss timer hides silently.
    const dismiss = () => {
      haptics.selection();
      setShown(false);
    };

    React.useEffect(
      () => () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
        if (lpTimer.current) clearTimeout(lpTimer.current);
        cancelAnimation(opacity);
        cancelAnimation(scale);
        cancelAnimation(drift);
        cancelAnimation(scrim);
        cancelAnimation(charge);
      },
      [opacity, scale, drift, scrim, charge]
    );

    // Positioning — measure the bubble (onLayout) and clamp inside the
    // window + safe area, flipping sides when the preferred one won't fit.
    const anchorCX = anchor ? anchor.x + anchor.width / 2 : winW / 2;
    const minTop = insets.top + 8;
    const maxTop = winH - insets.bottom - 8 - bubble.height;
    const minLeft = 8 + insets.left;
    const maxLeft = winW - bubble.width - 8 - insets.right;

    let resolvedSide = side;
    let top = minTop;
    if (anchor) {
      const above = anchor.y - GAP - bubble.height;
      const below = anchor.y + anchor.height + GAP;
      if (side === "top" && above < minTop) resolvedSide = "bottom";
      if (side === "bottom" && below > maxTop) resolvedSide = "top";
      const desired = resolvedSide === "top" ? above : below;
      top = Math.max(minTop, Math.min(desired, maxTop));
    }
    const left = anchor
      ? Math.max(minLeft, Math.min(anchorCX - bubble.width / 2, maxLeft))
      : minLeft;

    // Scale origin sits at the arrow nub — the anchor's position inside the
    // bubble, clamped so a clamped bubble still grows from its nearest edge.
    const originXFrac = anchor && bubble.width > 0 ? Math.max(0, Math.min(1, (anchorCX - left) / bubble.width)) : 0.5;
    const originYFrac = resolvedSide === "top" ? 1 : 0;

    // Arrow x (relative to the bubble) — tracks the anchor's center, clamped
    // inside the bubble so a clamped bubble doesn't slide the arrow off.
    const arrowLeft = anchor
      ? Math.max(6, Math.min(anchorCX - left - ARROW / 2, Math.max(bubble.width - ARROW - 6, 6)))
      : 6;

    const bubbleStyle = useAnimatedStyle(() => {
      if (Platform.OS === "web") {
        return {
          opacity: opacity.value,
          // Pop out of the anchor — the transform origin sits at the arrow
          // nub so the bubble reads as emerging from the element.
          transformOrigin: `${originXFrac * 100}% ${originYFrac * 100}%`,
          transform: [{ scale: scale.value }, { translateY: drift.value }],
        };
      }
      // transformOrigin is web-only — on native, emulate the arrow-anchored
      // scale by translating toward the origin point by (origin - center)
      // * (1 - scale), plus the rise.
      const s = scale.value;
      return {
        opacity: opacity.value,
        transform: [
          { translateX: (originXFrac - 0.5) * bubble.width * (1 - s) },
          { translateY: (originYFrac - 0.5) * bubble.height * (1 - s) + drift.value },
          { scale: s },
        ],
      };
    });
    // The room dims on its own clock — ahead of the bubble in, behind it out.
    const dimStyle = useAnimatedStyle(() => ({ opacity: scrim.value * SCRIM_PEAK }));
    const chargeStyle = useAnimatedStyle(() => ({ opacity: charge.value * CHARGE_PEAK }));

    // Scrim as four rects around the trigger, confined to the phone column,
    // so the value the finger asked about stays lit.
    const stageL = Math.max(0, (winW - STAGE_MAX_W) / 2);
    const stageR = winW - stageL;
    const scrimRects: { top: number; left: number; width: number; height: number }[] = [];
    if (anchor) {
      const cy0 = Math.max(0, anchor.y - CUTOUT_PAD);
      const cy1 = Math.min(winH, anchor.y + anchor.height + CUTOUT_PAD);
      const cx0 = Math.max(stageL, anchor.x - CUTOUT_PAD);
      const cx1 = Math.min(stageR, anchor.x + anchor.width + CUTOUT_PAD);
      scrimRects.push(
        { top: 0, left: stageL, width: stageR - stageL, height: cy0 },
        { top: cy1, left: stageL, width: stageR - stageL, height: Math.max(0, winH - cy1) },
        { top: cy0, left: stageL, width: Math.max(0, cx0 - stageL), height: cy1 - cy0 },
        { top: cy0, left: cx1, width: Math.max(0, stageR - cx1), height: cy1 - cy0 }
      );
    }

    return (
      <>
        <AnimatedPressable
          ref={(node) => {
            innerRef.current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) ref.current = node;
          }}
          onPressIn={press.onPressIn}
          onPressOut={press.onPressOut}
          style={press.animatedStyle}
          onTouchStart={startLp}
          onTouchMove={moveLp}
          onTouchEnd={clearLp}
          onTouchCancel={clearLp}
          {...webLp}
          accessibilityRole="button"
          accessibilityState={{ expanded: shown }}
          // accessibilityState isn't forwarded to the DOM on web — mirror it.
          aria-expanded={shown}
          // Cross-platform describedby: the hint reads the tooltip content,
          // and the bubble itself carries role="tooltip" for web.
          accessibilityHint={props.accessibilityHint ?? `Long press for hint: ${content}`}
          {...props}
        >
          {children}
          {/* Hold light — pools over the trigger as the long-press charges. */}
          <Animated.View
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={[{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0 }, chargeStyle]}
            className="rounded-xl bg-foreground"
          />
        </AnimatedPressable>
        <Modal
          visible={rendered && !!anchor}
          transparent
          animationType="none"
          statusBarTranslucent
          onRequestClose={dismiss}
        >
          <Pressable
            className="flex-1"
            onPress={dismiss}
            accessibilityRole="button"
            accessibilityLabel="Dismiss tooltip"
          >
            {/* The room dims around the trigger — the touched value stays lit. */}
            <Animated.View
              pointerEvents="none"
              style={[{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0 }, dimStyle]}
            >
              {scrimRects.map((r, i) => (
                <View key={i} style={{ position: "absolute", ...r }} className="bg-overlay" />
              ))}
            </Animated.View>
            <Animated.View
              onLayout={(e) => {
                const { width, height } = e.nativeEvent.layout;
                if (width !== bubble.width || height !== bubble.height) {
                  setBubble({ width, height });
                }
              }}
              // Claim taps on the bubble so they can't reach the dismiss
              // backdrop — reading a tooltip shouldn't close it.
              onStartShouldSetResponder={() => true}
              style={[{ position: "absolute", top, left }, bubbleStyle]}
              // Ink bubble (inverts per scheme) — never the accent: a tooltip
              // is chrome, and it must read the same in every subtree.
              className={cn("max-w-[280px] rounded-xl bg-foreground px-3 py-2", className)}
              // RN's accessibilityRole enum has no "tooltip" — `role` carries
              // it (web + supported native); "text" is the native fallback so
              // the label still reads plainly.
              accessibilityRole="text"
              role="tooltip"
              accessibilityLabel={content}
              // Polite live region: TalkBack announces the tooltip when it
              // appears instead of requiring manual focus.
              accessibilityLiveRegion="polite"
            >
              <Text className="text-[13px] font-medium leading-snug text-background">{content}</Text>
              {/* Arrow — rotated square pointing at the anchor. */}
              <View
                style={{
                  position: "absolute",
                  ...(resolvedSide === "top" ? { bottom: -ARROW / 2 } : { top: -ARROW / 2 }),
                  left: arrowLeft,
                  width: ARROW,
                  height: ARROW,
                  borderRadius: 1.5,
                  transform: [{ rotate: "45deg" }],
                }}
                className="bg-foreground"
              />
            </Animated.View>
          </Pressable>
        </Modal>
      </>
    );
  }
);

Tooltip.displayName = "Tooltip";
