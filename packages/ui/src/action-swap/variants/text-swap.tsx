import * as React from "react";
import { View } from "react-native";
import { Accent } from "@lumioui/core";
import { ActionSwapText } from "../action-swap";
import { Button } from "../../button/button";
import { Icon } from "../../icon/icon";
import { Text } from "../../text/text";

const INTERVALS = [
  { name: "Warm-up", time: "5:00", effort: "Easy, conversational" },
  { name: "Sprint", time: "0:45", effort: "All out, 9 of 10" },
  { name: "Recover", time: "1:30", effort: "Walk or slow jog" },
  { name: "Hill repeat", time: "1:00", effort: "Strong, 8 of 10" },
  { name: "Cool-down", time: "5:00", effort: "Easy, then stretch" },
];

/** ActionSwapTextSwap — a running coach's interval screen. The interval
 *  name is the hero; tap Next and the next block's name switches on
 *  letter by letter in reading order, while the time and
 *  effort swap with it. Red accent. */
export function ActionSwapTextSwap() {
  const [i, setI] = React.useState(1);
  const cur = INTERVALS[i] ?? INTERVALS[0]!;
  const next = INTERVALS[(i + 1) % INTERVALS.length]!;
  return (
    <Accent color="red" className="w-full">
      <View className="w-full gap-6 rounded-[20px] bg-card p-5">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-medium text-muted-foreground">
            Interval {i + 1} of {INTERVALS.length}
          </Text>
          <View className="flex-row items-center gap-1.5">
            <Icon name="footprints" size="sm" color="mutedForeground" />
            <Text className="text-sm tabular-nums text-muted-foreground">3.2 km</Text>
          </View>
        </View>

        <View className="gap-2">
          <ActionSwapText value={String(i)} mode="cascade" light className="text-5xl font-bold tracking-tight text-foreground">
            {cur.name}
          </ActionSwapText>
          <View className="flex-row items-center gap-2">
            <ActionSwapText value={String(i)} className="text-2xl font-semibold tabular-nums text-primary-text">
              {cur.time}
            </ActionSwapText>
            <ActionSwapText value={String(i)} mode="blur" className="text-base text-muted-foreground">
              {cur.effort}
            </ActionSwapText>
          </View>
        </View>

        <View className="flex-row items-center gap-3">
          <View className="flex-1">
            <Text className="text-xs text-muted-foreground">Up next</Text>
            <Text className="text-[15px] font-medium text-foreground">
              {next.name} · {next.time}
            </Text>
          </View>
          <Button size="lg" onPress={() => setI((v) => (v + 1) % INTERVALS.length)} className="px-6">
            Next
          </Button>
        </View>
      </View>
    </Accent>
  );
}
