import * as React from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { ease, rowDelay, spring, timing, useReducedMotion } from "@lumioui/core";
import { SegmentedControl } from "../segmented-control";
import { ActionSwapText } from "../../action-swap/action-swap";
import { Text } from "../../text/text";

type Period = { total: string; caption: string; bars: number[]; ticks: string[]; delta: string };

const DATA: Record<string, Period> = {
  Day: {
    total: "3h 41m",
    caption: "Today",
    bars: [2, 0, 0, 1, 6, 9, 7, 5, 8, 10, 6, 3],
    ticks: ["12a", "6a", "12p", "6p"],
    delta: "38 min less than yesterday",
  },
  Week: {
    total: "4h 12m",
    caption: "Daily average",
    bars: [7, 5, 6, 8, 9, 4, 3],
    ticks: ["M", "T", "W", "T", "F", "S", "S"],
    delta: "12% lower than last week",
  },
  Month: {
    total: "4h 36m",
    caption: "Daily average, September",
    bars: [8, 7, 9, 6, 5],
    ticks: ["Wk 1", "Wk 2", "Wk 3", "Wk 4", "Wk 5"],
    delta: "Up 9% on August",
  },
};

/** The old chart dims to this scale as it leaves. */
const DIM_SCALE = 0.96;
const DIM = { duration: timing.recede.duration, easing: Easing.bezier(...ease.in) };

/** One bar growing from the baseline — scaleY from the bottom, rows 40ms apart. */
function Bar({ value, max, index }: { value: number; max: number; index: number }) {
  const reduce = useReducedMotion();
  const grow = useSharedValue(reduce ? 1 : 0);
  React.useEffect(() => {
    if (reduce) return;
    grow.value = withDelay(rowDelay(index), withSpring(1, spring.layout));
  }, [reduce, index, grow]);
  const style = useAnimatedStyle(() => ({
    transform: [{ scaleY: Math.max(0, grow.value) }],
  }));
  return (
    <Animated.View
      className={`flex-1 rounded-t-md ${value === max ? "bg-primary" : "bg-primary/30"}`}
      style={[{ height: `${Math.max(3, (value / max) * 100)}%`, transformOrigin: "bottom" }, style]}
    />
  );
}

/** A period's bars. `leaving` sets render as a dimming overlay. */
function Bars({ period, leaving }: { period: Period; leaving?: boolean }) {
  const reduce = useReducedMotion();
  const max = Math.max(...period.bars, 1);
  const out = useSharedValue(0);
  React.useEffect(() => {
    if (leaving) out.value = withTiming(1, DIM);
  }, [leaving, out]);
  const style = useAnimatedStyle(() => ({
    opacity: 1 - out.value,
    transform: [{ scale: reduce ? 1 : 1 - (1 - DIM_SCALE) * out.value }],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      className={leaving ? "absolute inset-0 flex-row items-end gap-1" : "h-full flex-row items-end gap-1"}
      style={style}
    >
      {period.bars.map((b, i) => (
        <Bar key={i} value={b} max={max} index={i} />
      ))}
    </Animated.View>
  );
}

/** SegmentedStrings — the chart-header habitat: Day / Week / Month on a
 *  screen-time chart. Tap or drag the thumb: it glides with a light trail,
 *  the old bars dim in place while the new ones grow from the baseline
 *  40ms apart, and the hero figure swaps in place. */
export function SegmentedStrings() {
  const [value, setValue] = React.useState("Week");
  const [leaving, setLeaving] = React.useState<{ key: string; period: Period } | null>(null);
  const d = DATA[value] ?? DATA.Week!;

  const change = (next: string) => {
    if (next === value) return;
    setLeaving({ key: value, period: d });
    setValue(next);
  };
  React.useEffect(() => {
    if (!leaving) return;
    const t = setTimeout(() => setLeaving(null), DIM.duration + timing.fast.duration);
    return () => clearTimeout(t);
  }, [leaving]);

  return (
    <View className="w-full">
      <View className="w-full gap-5 rounded-3xl bg-card p-5">
        <SegmentedControl options={["Day", "Week", "Month"]} value={value} onValueChange={change} draggable />
        <View className="gap-1">
          <ActionSwapText value={value} mode="blur" className="text-[13px] text-muted-foreground">
            {d.caption}
          </ActionSwapText>
          <ActionSwapText value={value} mode="roll" className="text-4xl font-semibold tracking-tight tabular-nums">
            {d.total}
          </ActionSwapText>
          <ActionSwapText value={value} mode="blur" className="text-sm text-muted-foreground">
            {d.delta}
          </ActionSwapText>
        </View>
        <View className="gap-2">
          <View className="h-36 border-b border-border">
            {leaving ? <Bars key={`out-${leaving.key}`} period={leaving.period} leaving /> : null}
            <Bars key={value} period={d} />
          </View>
          <View className="flex-row justify-between">
            {d.ticks.map((t, i) => (
              <Text key={`${value}-${t}-${i}`} className="text-xs text-muted-foreground">{t}</Text>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}
