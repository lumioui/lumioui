import * as React from "react";
import { View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from "react-native-reanimated";
import { Accent, ease, rowDelay, spring, timing, useReducedMotion } from "@lumioui/core";
import { Card } from "../card";
import { Icon } from "../../icon/icon";
import { Text } from "../../text/text";

const DETAILS: [string, string][] = [
  ["Platform", "14b"],
  ["Coach", "6"],
  ["Seat", "42A"],
];

/** Container, then content — cells wait for the panel to start opening. */
const CELL_LAG = timing.recede.duration;
const IGNITE = { duration: timing.fast.duration, easing: Easing.bezier(...ease.out) };
const DIM = { duration: timing.recede.duration, easing: Easing.bezier(...ease.in) };

/** One boarding detail — switches on 40ms after its left neighbour. */
function DetailCell({ k, v, i, open }: { k: string; v: string; i: number; open: boolean }) {
  const on = useSharedValue(open ? 1 : 0);
  React.useEffect(() => {
    on.value = open ? withDelay(CELL_LAG + rowDelay(i), withTiming(1, IGNITE)) : withTiming(0, DIM);
  }, [open, i, on]);
  const style = useAnimatedStyle(() => ({ opacity: on.value }));
  return (
    <Animated.View style={style} className={`flex-1 items-center ${i > 0 ? "border-l border-border" : ""}`}>
      <Text className="text-[13px] text-muted-foreground">{k}</Text>
      <Text className="text-xl font-semibold tabular-nums">{v}</Text>
    </Animated.View>
  );
}

/** The boarding panel grows in place on spring.surface and pushes the
 *  footer down; closing dims the cells first, then folds on spring.dismiss. */
function BoardingDetails({ open }: { open: boolean }) {
  const reduce = useReducedMotion();
  const [h, setH] = React.useState(0);
  const height = useSharedValue(0);
  React.useEffect(() => {
    if (!h) return;
    const target = open ? h : 0;
    height.value = reduce ? target : withSpring(target, open ? spring.surface : spring.dismiss);
  }, [open, h, reduce, height]);
  const style = useAnimatedStyle(() => ({ height: height.value, overflow: "hidden" }));
  return (
    <Animated.View style={style} accessibilityElementsHidden={!open} importantForAccessibility={open ? "yes" : "no-hide-descendants"}>
      <View
        className="absolute left-0 right-0 top-0 pb-5"
        onLayout={(e) => setH(e.nativeEvent.layout.height)}
      >
        <View className="flex-row rounded-2xl bg-secondary py-3">
          {DETAILS.map(([k, v], i) => (
            <DetailCell key={k} k={k} v={v} i={i} open={open} />
          ))}
        </View>
      </View>
    </Animated.View>
  );
}

/** CardTicket — a rail ticket that switches on as it arrives (dim parts, one
 *  sheen, then header → times → footer). The whole card is one press target
 *  whose lit edge brightens with the press; it grows the boarding details in
 *  place (platform, coach, seat igniting 40ms apart). Teal for travel. */
export function CardTicket() {
  const [open, setOpen] = React.useState(false);
  return (
    <Accent color="teal" className="w-full">
      <Card
        appear
        pressLight
        className="w-full"
        onPress={() => setOpen((v) => !v)}
        accessibilityLabel="Northgate to Marlow Bay ticket"
        accessibilityHint={open ? "Hides boarding details" : "Shows boarding details"}
        accessibilityState={{ expanded: open }}
      >
        <View className="flex-row items-center justify-between px-5 pt-5">
          <View className="flex-row items-center gap-2">
            <View className="h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Icon name="tram-front" size="sm" color="primaryForeground" />
            </View>
            <Text className="text-[15px] font-semibold">Harbourline Direct</Text>
          </View>
          <Text className="text-[13px] text-muted-foreground">Fri, Oct 17</Text>
        </View>

        <View className="flex-row items-end justify-between px-5 pb-5 pt-5">
          <View>
            <Text className="text-3xl font-semibold tracking-tight tabular-nums">09:36</Text>
            <Text className="text-[15px] text-muted-foreground">Northgate C.</Text>
          </View>
          <View className="items-center pb-1">
            <Text className="text-[13px] text-muted-foreground">1 h 16 min</Text>
            <View className="mt-1 h-px w-20 bg-border" />
          </View>
          <View className="items-end">
            <Text className="text-3xl font-semibold tracking-tight tabular-nums">10:52</Text>
            <Text className="text-[15px] text-muted-foreground">Marlow Bay</Text>
          </View>
        </View>

        <View className="px-5">
          <BoardingDetails open={open} />
        </View>

        <View className="mx-5 mb-5 flex-row items-center justify-between border-t border-border pt-4">
          <Text className="text-[15px] text-muted-foreground">1 adult · 2nd class</Text>
          <View className="flex-row items-center gap-1">
            <Text className="text-[15px] font-semibold text-primary-text">{open ? "Hide details" : "Boarding details"}</Text>
            <Icon name={open ? "chevron-up" : "chevron-down"} size="sm" color="primaryText" />
          </View>
        </View>
      </Card>
    </Accent>
  );
}
