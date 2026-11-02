import * as React from "react";
import { forwardRef } from "react";
import { View, Text, PanResponder, Platform, type ViewProps } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  clamp,
} from "react-native-reanimated";
import { cn, useHaptic, usePressAnimation, AnimatedPressable, spring, useReducedMotion } from "@lumioui/core";
import { Icon, type IconName } from "../icon";

/**
 * SwipeableCard — a Card with swipe-revealed actions on either side.
 * Swipe left to reveal trailing actions (e.g. Delete), swipe right for
 * leading actions (e.g. Archive). Actions snap open or closed with spring.
 *   <SwipeableCard
 *     leftActions={[{ icon: "archive", label: "Archive", color: "#3B82F6", onPress: () => {} }]}
 *     rightActions={[{ icon: "trash", label: "Delete", color: "#EF4444", onPress: () => {} }]}
 *   >
 *     <Card.Content>…</Card.Content>
 *   </SwipeableCard>
 */

export interface SwipeableAction {
  icon?: IconName;
  label: string;
  color?: string;
  onPress?: () => void;
}

export interface SwipeableCardProps extends ViewProps {
  /** Actions revealed by swiping right-to-left. */
  rightActions?: SwipeableAction[];
  /** Actions revealed by swiping left-to-right. */
  leftActions?: SwipeableAction[];
  /** How far actions open on swipe. Default 80. */
  actionWidth?: number;
  /** Auto-open right actions on long press. Default false. */
  longPressToOpen?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const ACTION_W = 80;
const LONG_PRESS_MS = 400;

interface SwipeActionButtonProps {
  action: SwipeableAction;
  actionWidth: number;
  onPress: () => void;
}

/** Single revealed action — own component so each button gets its own
 *  usePressAnimation hook (hooks can't live inside a map callback). */
function SwipeActionButton({ action, actionWidth, onPress }: SwipeActionButtonProps) {
  const press = usePressAnimation({ pressedScale: 0.94 });
  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      style={[
        { width: actionWidth, height: "100%" },
        // Style overrides the bg-muted class, so a custom action color only
        // wins when actually provided (undefined keeps the muted fallback).
        action.color != null && { backgroundColor: action.color },
        press.animatedStyle,
      ]}
      className="items-center justify-center bg-muted"
      accessibilityRole="button"
      accessibilityLabel={action.label}
    >
      {action.icon ? <Icon name={action.icon} size="md" color="background" /> : null}
      <Text className="mt-1 text-xs font-semibold text-background">
        {action.label}
      </Text>
    </AnimatedPressable>
  );
}

export const SwipeableCard = forwardRef<React.ElementRef<typeof View>, SwipeableCardProps>(
  function SwipeableCard(
    { rightActions = [], leftActions = [], actionWidth = ACTION_W, longPressToOpen = false, className, children, ...props },
    ref
  ) {
    const haptics = useHaptic();
    const reduce = useReducedMotion();
    const translateX = useSharedValue(0);
    const ctxStartX = useSharedValue(0);
    const actionProgress = useSharedValue(0);

    const maxRight = rightActions.length * actionWidth;
    const maxLeft = leftActions.length * actionWidth;
    // Fires once per gesture when the drag crosses the commit threshold —
    // the "you've got it" tick as swipe actions pass their point
    // of no return. Reset on every grant.
    const crossedRef = React.useRef(false);

    // `velocity` carries the release fling into the spring (PanResponder's
    // vx is px/ms, Reanimated wants px/s) so a fast swipe snaps open with
    // momentum instead of restarting from zero.
    const openLeft = React.useCallback((velocity = 0) => {
      translateX.value = withSpring(maxLeft, { ...spring.dismiss, velocity });
      actionProgress.value = 1;
    }, [maxLeft, translateX, actionProgress]);
    const openRight = React.useCallback((velocity = 0) => {
      translateX.value = withSpring(-maxRight, { ...spring.dismiss, velocity });
      actionProgress.value = 1;
    }, [maxRight, translateX, actionProgress]);
    const close = React.useCallback((velocity = 0) => {
      translateX.value = withSpring(0, { ...spring.dismiss, velocity });
      actionProgress.value = 0;
    }, [translateX, actionProgress]);

    // PanResponder (not gesture-handler — free components must stay Expo Go
    // compatible). Claims only horizontal-dominant swipes so inner
    // Pressables and vertical scrolling still work.
    const pan = React.useMemo(
      () =>
        PanResponder.create({
          onMoveShouldSetPanResponder: (_, g) =>
            !reduce &&
            (maxLeft > 0 || maxRight > 0) &&
            Math.abs(g.dx) > 10 &&
            Math.abs(g.dx) > Math.abs(g.dy),
          onPanResponderGrant: () => {
            ctxStartX.value = translateX.value;
            crossedRef.current = false;
            haptics.selection();
          },
          onPanResponderMove: (_, g) => {
            const next = ctxStartX.value + g.dx;
            // Rubber-band past the open edge.
            translateX.value =
              next > maxLeft
                ? maxLeft + (next - maxLeft) * 0.3
                : next < -maxRight
                  ? -maxRight + (next + maxRight) * 0.3
                  : next;
            actionProgress.value = clamp(
              Math.abs(translateX.value) / Math.max(maxLeft, maxRight, 1),
              0,
              1
            );
            // Commit-point tick: the moment the drag crosses the 40% release
            // threshold, the finger learns the swipe will stick.
            const commitDist = Math.max(maxLeft, maxRight) * 0.4;
            const willCommit =
              (translateX.value > commitDist && maxLeft > 0) ||
              (-translateX.value > commitDist && maxRight > 0);
            if (willCommit && !crossedRef.current) {
              crossedRef.current = true;
              haptics.selection();
            } else if (!willCommit && crossedRef.current) {
              // Dragged back under the threshold — re-arm so re-crossing ticks.
              crossedRef.current = false;
            }
          },
          onPanResponderRelease: (_, g) => {
            const threshold = Math.max(maxLeft, maxRight) * 0.4;
            const velocity = g.vx * 1000;
            // vx is px/ms — 0.8 ≈ the ~800px/s sheet-dismiss convention.
            if ((g.dx > threshold || g.vx > 0.8) && maxLeft > 0) {
              openLeft(velocity);
              haptics.light();
            } else if ((g.dx < -threshold || g.vx < -0.8) && maxRight > 0) {
              openRight(velocity);
              haptics.light();
            } else {
              close(velocity);
            }
          },
          onPanResponderTerminate: () => close(),
        }),
      [reduce, maxLeft, maxRight, haptics, ctxStartX, translateX, actionProgress, openLeft, openRight, close]
    );

    // Long-press-to-open via a touch timer — lives alongside the responder
    // system without stealing it from children or the pan.
    const lpTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const clearLp = React.useCallback(() => {
      if (lpTimer.current) {
        clearTimeout(lpTimer.current);
        lpTimer.current = null;
      }
    }, []);
    const lpEnabled = longPressToOpen && !reduce && maxRight > 0;
    // Track the press origin so a slow drag (which the pan responder owns)
    // cancels the hold instead of falsely opening the actions.
    const lpOrigin = React.useRef<{ x: number; y: number } | null>(null);
    const startLp = React.useCallback(
      (x: number, y: number) => {
        clearLp();
        lpOrigin.current = { x, y };
        lpTimer.current = setTimeout(() => {
          lpTimer.current = null;
          openRight();
          haptics.medium();
        }, LONG_PRESS_MS);
      },
      [clearLp, openRight, haptics]
    );
    const moveLp = React.useCallback(
      (x: number, y: number) => {
        const o = lpOrigin.current;
        if (o && Math.hypot(x - o.x, y - o.y) > 10) clearLp();
      },
      [clearLp]
    );
    const touchHandlers = lpEnabled
      ? {
          onTouchStart: (e: { nativeEvent: { pageX: number; pageY: number } }) =>
            startLp(e.nativeEvent.pageX, e.nativeEvent.pageY),
          onTouchEnd: clearLp,
          onTouchMove: clearLp,
          onTouchCancel: clearLp,
          // RNW forwards onMouse* to real DOM listeners — the onTouch*
          // props never fire for a desktop mouse, so long-press needs both.
          ...(Platform.OS === "web"
            ? {
                onMouseDown: (e: { nativeEvent: { pageX: number; pageY: number } }) =>
                  startLp(e.nativeEvent.pageX, e.nativeEvent.pageY),
                onMouseMove: (e: { nativeEvent: { pageX: number; pageY: number } }) =>
                  moveLp(e.nativeEvent.pageX, e.nativeEvent.pageY),
                onMouseUp: clearLp,
                onMouseLeave: clearLp,
              }
            : {}),
        }
      : {};
    React.useEffect(() => clearLp, [clearLp]);

    const cardStyle = useAnimatedStyle(() => ({
      transform: [{ translateX: translateX.value }],
    }));

    // Action trays are fixed-width and slide in attached to the card's
    // edge (transform only) — animating their `width` relaid out every
    // button on every drag frame.
    const leftActionStyle = useAnimatedStyle(() => ({
      transform: [{ translateX: Math.min(0, translateX.value - maxLeft) }],
      opacity: interpolate(translateX.value, [0, maxLeft * 0.5], [0.5, 1], "clamp"),
    }));

    const rightActionStyle = useAnimatedStyle(() => ({
      transform: [{ translateX: Math.max(0, maxRight + translateX.value) }],
      opacity: interpolate(-translateX.value, [0, maxRight * 0.5], [0.5, 1], "clamp"),
    }));

    const renderActions = (actions: SwipeableAction[], side: "left" | "right") => (
      <Animated.View
        style={[
          {
            position: "absolute",
            top: 0,
            bottom: 0,
            flexDirection: "row",
            width: side === "left" ? maxLeft : maxRight,
            [side]: 0,
          },
          side === "left" ? leftActionStyle : rightActionStyle,
        ]}
        pointerEvents="box-none"
      >
        {actions.map((action, i) => (
          <SwipeActionButton
            key={i}
            action={action}
            actionWidth={actionWidth}
            onPress={() => {
              haptics.light();
              action.onPress?.();
              close();
            }}
          />
        ))}
      </Animated.View>
    );

    const hasActions = maxLeft > 0 || maxRight > 0;

    return (
      <View
        ref={ref}
        className={cn("relative overflow-hidden rounded-2xl", className)}
        {...pan.panHandlers}
        {...touchHandlers}
        {...props}
      >
        {/* Left actions (revealed by swiping right) */}
        {leftActions.length > 0 && renderActions(leftActions, "left")}
        {/* Right actions (revealed by swiping left) */}
        {rightActions.length > 0 && renderActions(rightActions, "right")}

        {/* Card content — the swipeable surface. "adjustable" is RN's role
            for swipe-driven elements; the hint tells AT users the hidden
            actions exist (the action buttons themselves are labeled). */}
        <Animated.View
          style={[{ flex: 1 }, cardStyle]}
          collapsable={false}
          accessibilityRole={hasActions ? "adjustable" : undefined}
          accessibilityHint={hasActions ? "Swipe left or right to reveal actions" : undefined}
        >
          {children}
        </Animated.View>
      </View>
    );
  }
);

SwipeableCard.displayName = "SwipeableCard";
