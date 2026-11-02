import * as React from "react";
import { Pressable, View } from "react-native";
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { ease, spring, timing, useHaptic, useReducedMotion } from "@lumioui/core";
import { HStack, Spacer, VStack } from "../stack";
import { Text } from "../../text/text";

const WATCH = [
  { sym: "ORBT", name: "Orbital", price: 227.48, pct: 1.24, tile: "bg-muted", ink: "text-foreground" },
  { sym: "VYKO", name: "Vyko Robotics", price: 131.06, pct: -2.11, tile: "bg-tint-green", ink: "text-white" },
  { sym: "MRDN", name: "Meridian", price: 84.92, pct: 3.47, tile: "bg-tint-lime", ink: "text-white" },
  { sym: "BRSL", name: "Bristle", price: 412.3, pct: 0.38, tile: "bg-tint-green", ink: "text-white" },
];

const DIM = { ...timing.recede, easing: Easing.bezier(...ease.in) };
const IGNITE = { ...timing.fast, easing: Easing.bezier(...ease.out) };
/** Units change, not the value — a short 4px rise says "new reading". */
const SWAP_RISE = 4;

/** The change figure swaps in place: the old reading dims, the new one ignites. */
function Delta({ text, className }: { text: string; className: string }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = React.useState(text);
  const o = useSharedValue(1);
  const y = useSharedValue(0);
  const s = useSharedValue(1);
  React.useEffect(() => {
    if (text === shown) return;
    o.value = withTiming(0, DIM, (f) => {
      if (f) runOnJS(setShown)(text);
    });
    if (!reduce) s.value = withTiming(0.96, DIM);
  }, [text, shown, reduce, o, s]);
  const last = React.useRef(shown);
  React.useEffect(() => {
    if (last.current === shown) return;
    last.current = shown;
    o.value = withTiming(1, IGNITE);
    if (reduce) return;
    y.value = SWAP_RISE;
    y.value = withSpring(0, spring.swap);
    s.value = withSpring(1, spring.swap);
  }, [shown, reduce, o, y, s]);
  const style = useAnimatedStyle(() => ({ opacity: o.value, transform: [{ translateY: y.value }, { scale: s.value }] }));
  return (
    <Animated.View style={[{ transformOrigin: "right" }, style]}>
      <Text className={className}>{shown}</Text>
    </Animated.View>
  );
}

/** StackHStack — HStack + Spacer laying out a watchlist: logo, name, then
 *  the price pushed to the trailing edge. Tap any change pill to flip all
 *  of them between % and $; each figure dims and the new reading ignites in
 *  place. The rows switch on 40ms apart through `reveal="rows"`. */
export function StackHStack() {
  const haptics = useHaptic();
  const [asDollars, setAsDollars] = React.useState(false);
  return (
    <VStack gap={8} className="w-full">
      <HStack align="end" className="px-1">
        <Text className="text-2xl font-bold tracking-tight">Watchlist</Text>
        <Spacer />
        <Text variant="muted">Market open</Text>
      </HStack>
      <VStack reveal="rows" className="overflow-hidden rounded-2xl bg-card">
        {WATCH.map((w, i) => {
          const up = w.pct >= 0;
          const delta = asDollars
            ? `${up ? "+" : "−"}$${Math.abs((w.price * w.pct) / 100).toFixed(2)}`
            : `${up ? "+" : "−"}${Math.abs(w.pct).toFixed(2)}%`;
          return (
            <HStack
              key={w.sym}
              gap={12}
              align="center"
              className={`px-4 py-3 ${i > 0 ? "border-t border-border" : ""}`}
            >
              <View className={`h-10 w-10 items-center justify-center rounded-full ${w.tile}`}>
                <Text className={`text-xs font-bold ${w.ink}`}>{w.sym.slice(0, 2)}</Text>
              </View>
              <VStack>
                <Text className="text-base font-semibold">{w.sym}</Text>
                <Text variant="muted">{w.name}</Text>
              </VStack>
              <Spacer />
              <VStack align="end" gap={4}>
                <Text className="text-base font-medium tabular-nums">${w.price.toFixed(2)}</Text>
                <Pressable
                  onPress={() => {
                    haptics.selection();
                    setAsDollars((d) => !d);
                  }}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={`${w.sym} change ${delta}. Tap to show ${asDollars ? "percent" : "dollars"}`}
                  className={`min-w-[72px] items-end rounded-md px-2 py-1 ${up ? "bg-success/15" : "bg-destructive/15"}`}
                >
                  <Delta text={delta} className={`text-[13px] font-semibold tabular-nums ${up ? "text-success" : "text-destructive"}`} />
                </Pressable>
              </VStack>
            </HStack>
          );
        })}
      </VStack>
    </VStack>
  );
}
