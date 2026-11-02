import * as React from "react";
import { Pressable, type LayoutChangeEvent } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { ease, spring, timing, useReducedMotion } from "@lumioui/core";
import { Box } from "../stack";
import { Icon, type IconName } from "../../icon/icon";
import { Image } from "../../image/image";
import { Text } from "../../text/text";

const STEPS = ["Ordered", "Shipped", "Out for delivery", "Delivered"];

/** The light head leading a filling segment. */
const HEAD = 12;
const FILL = { ...timing.slow, easing: Easing.bezier(...ease.out) };
const DIM = { ...timing.recede, easing: Easing.bezier(...ease.in) };
const IGNITE = { ...timing.fast, easing: Easing.bezier(...ease.out) };

/** One leg of the track. Reaching it fills from the left behind a bright head;
 *  the body runs a little dim while the head travels, then switches fully on. */
function Segment({ on }: { on: boolean }) {
  const reduce = useReducedMotion();
  const w = useSharedValue(0);
  const fill = useSharedValue(on ? 1 : 0);
  const body = useSharedValue(1);
  const head = useSharedValue(0);
  // Only real changes animate — mount (and a strict-mode re-run) shows the resting state.
  const last = React.useRef(on);
  React.useEffect(() => {
    if (last.current === on) return;
    last.current = on;
    if (!on) {
      // Leaving: dim in place, never un-fill.
      body.value = withTiming(0, DIM, (f) => {
        if (f) fill.value = 0;
      });
      return;
    }
    if (reduce) {
      fill.value = 1;
      body.value = 0;
      body.value = withTiming(1, IGNITE);
      return;
    }
    fill.value = 0;
    body.value = 0.7;
    head.value = 1;
    fill.value = withTiming(1, FILL, (f) => {
      if (!f) return;
      head.value = withTiming(0, DIM);
      body.value = withTiming(1, IGNITE);
    });
  }, [on, reduce, fill, body, head]);
  const fillStyle = useAnimatedStyle(() => ({
    opacity: body.value,
    transform: [{ translateX: (fill.value - 1) * w.value }],
  }));
  const headStyle = useAnimatedStyle(() => ({
    opacity: head.value,
    transform: [{ translateX: fill.value * w.value - HEAD }],
  }));
  return (
    <Box
      className="h-1 flex-1 overflow-hidden rounded-full bg-muted"
      onLayout={(e: LayoutChangeEvent) => {
        w.value = e.nativeEvent.layout.width;
      }}
    >
      <Animated.View className="absolute inset-0 rounded-full bg-primary" style={fillStyle} />
      <Animated.View className="absolute bottom-0 top-0 rounded-full bg-primary" style={[{ width: HEAD }, headStyle]} />
    </Box>
  );
}

/** A line that swaps in place: the old text dims, the new one ignites with a 4px rise. */
function SwapText({ children, className, variant }: { children: string; className?: string; variant?: "muted" }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = React.useState(children);
  const o = useSharedValue(1);
  const y = useSharedValue(0);
  const s = useSharedValue(1);
  React.useEffect(() => {
    if (children === shown) return;
    o.value = withTiming(0, DIM, (f) => {
      if (f) runOnJS(setShown)(children);
    });
    if (!reduce) s.value = withTiming(0.96, DIM);
  }, [children, shown, reduce, o, s]);
  const lastShown = React.useRef(shown);
  React.useEffect(() => {
    if (lastShown.current === shown) return;
    lastShown.current = shown;
    o.value = withTiming(1, IGNITE);
    if (reduce) return;
    y.value = 4;
    y.value = withSpring(0, spring.swap);
    s.value = withSpring(1, spring.swap);
  }, [shown, reduce, o, y, s]);
  const style = useAnimatedStyle(() => ({ opacity: o.value, transform: [{ translateY: y.value }, { scale: s.value }] }));
  return (
    <Animated.View style={[{ transformOrigin: "left" }, style]}>
      <Text className={className} variant={variant}>
        {shown}
      </Text>
    </Animated.View>
  );
}

/** StackBox — Box surfaces composing a parcel-tracking card: product,
 *  status, a four-step track and an action row. "Delivered" is reachable —
 *  tap the status line to advance the parcel: the next leg fills behind a
 *  light head while the status swaps in place. Neutral ink. */
export function StackBox() {
  const [step, setStep] = React.useState(2);
  const done = step === STEPS.length - 1;
  const actions: [IconName, string][] = done
    ? [["star", "Review"], ["refresh", "Return"], ["message-circle", "Help"]]
    : [["map-pin", "Track"], ["calendar", "Reschedule"], ["message-circle", "Help"]];
  return (
    <Box className="w-full gap-5 rounded-3xl bg-card p-5">
      <Box className="flex-row items-center gap-3">
        <Image
          source={{ uri: "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&q=80&auto=format&fit=crop" }}
          rounded="xl"
          className="h-16 w-16 bg-muted"
          alt="Colour-block trainers"
        />
        <Box className="flex-1">
          <Text className="text-[17px] font-semibold">Prism runner, size 10</Text>
          <Text variant="muted">Order #LM-30417 · Parcelwise</Text>
        </Box>
      </Box>

      <Pressable
        onPress={() => setStep((s) => (s + 1) % STEPS.length)}
        accessibilityRole="button"
        accessibilityLabel={`Status: ${STEPS[step]}`}
        className="gap-3"
      >
        <Box className="gap-1">
          <SwapText className="text-2xl font-bold tracking-tight">
            {done ? "Delivered" : step === 2 ? "Arriving today" : STEPS[step]!}
          </SwapText>
          <SwapText variant="muted">
            {done ? "Left at front door · 2:14 PM" : step === 2 ? "By 8 PM · 6 stops away" : "Estimated Thu, Oct 9"}
          </SwapText>
        </Box>
        <Box className="flex-row gap-1">
          {STEPS.map((s, i) => (
            <Segment key={s} on={i <= step} />
          ))}
        </Box>
      </Pressable>

      <Box className="flex-row border-t border-border pt-3">
        {actions.map(([icon, label]) => (
          <Pressable
            key={label}
            className="h-14 flex-1 items-center justify-center gap-1"
            accessibilityRole="button"
            accessibilityLabel={label}
          >
            <Icon name={icon} size="md" color="foreground" />
            <Text className="text-[13px] font-medium">{label}</Text>
          </Pressable>
        ))}
      </Box>
    </Box>
  );
}
