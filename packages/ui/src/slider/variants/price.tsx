import * as React from "react";
import { View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, type SharedValue } from "react-native-reanimated";
import { Slider } from "../slider";
import { AnimatedNumber } from "../../animated-number/animated-number";
import { Text } from "../../text/text";

// Nightly-price distribution, $40 buckets from $40 to $680: the histogram
// above the track shows where the stays actually are (stays-filter idiom).
const BUCKETS = [6, 14, 28, 41, 52, 47, 38, 31, 24, 19, 15, 11, 9, 7, 5, 4, 3];
const MIN = 40;
const STEP = 40;
const MAX = MIN + STEP * (BUCKETS.length - 1);
const PEAK = Math.max(...BUCKETS);
/** A bar ahead of the thumb rests this bright: dim but still legible data. */
const BAR_DIM = 0.22;

/** Single thumb, so the readout is the cap: "Up to $320", or no cap at the top. */
const capText = (n: number) => (n >= MAX ? "Any price" : `Up to $${n}`);
/** Thumb radius: the track's first and last detents sit this far in. */
const EDGE = 14;

/** One bucket. It switches on as the thumb passes it, on the UI thread, so
 *  the histogram follows the finger frame by frame. */
function Bar({ count, at, progress, left, width }: { count: number; at: number; progress: SharedValue<number>; left: number; width: number }) {
  const style = useAnimatedStyle(() => {
    const on = Math.min(1, Math.max(0, (progress.value - at) / 0.02 + 1));
    return { opacity: BAR_DIM + (1 - BAR_DIM) * on };
  });
  return (
    <Animated.View
      className="absolute bottom-0 rounded-t-sm bg-foreground"
      style={[{ left, width, height: `${Math.max(6, (count / PEAK) * 100)}%` }, style]}
    />
  );
}

/** SliderPrice — a max-price filter for stays. The number of stays that
 *  match is the hero and rolls as you drag; the histogram's bars switch on
 *  behind the thumb, the rest stay dim. */
export function SliderPrice() {
  const [budget, setBudget] = React.useState(320);
  const progress = useSharedValue((320 - MIN) / (MAX - MIN));
  // Bars sit exactly over the slider's detents: centred on each stop.
  const [rowW, setRowW] = React.useState(0);
  const gap = rowW ? (rowW - EDGE * 2) / (BUCKETS.length - 1) : 0;
  const barW = Math.max(2, gap - 4);
  const inRange = BUCKETS.reduce((sum, n, i) => (MIN + i * STEP <= budget ? sum + n : sum), 0);

  return (
    <View className="w-full gap-5 rounded-2xl bg-card p-5">
      <View className="flex-row items-baseline justify-between">
        <Text className="text-[22px] font-bold tracking-tight">Price per night</Text>
        <Text className="text-[17px] font-bold tabular-nums">{capText(budget)}</Text>
      </View>

      <View>
        <View className="mb-1 h-16 w-full" onLayout={(e) => setRowW(e.nativeEvent.layout.width)}>
          {rowW
            ? BUCKETS.map((n, i) => (
                <Bar key={i} count={n} at={i / (BUCKETS.length - 1)} progress={progress} left={EDGE + i * gap - barW / 2} width={barW} />
              ))
            : null}
        </View>
        <Slider
          value={budget}
          onValueChange={setBudget}
          min={MIN}
          max={MAX}
          step={STEP}
          progress={progress}
          flickerAtEnds
          className="w-full"
          accessibilityLabel="Maximum price per night"
        />
      </View>

      <View className="flex-row items-baseline gap-2">
        <AnimatedNumber value={inRange} animation="roll" className="text-[28px] font-bold tracking-tight tabular-nums" />
        <Text variant="muted" className="text-[15px]">stays in Harbour Quarter</Text>
      </View>
    </View>
  );
}
