import * as React from "react";
import { View } from "react-native";
import { Accent } from "@lumioui/core";
import { ProgressRing } from "../progress-ring";
import { Button } from "../../button/button";
import { Text } from "../../text/text";

const GOAL = 620;

/** ProgressRingLabeled — the daily energy ring in a fitness app. The number
 *  inside is the hero; logging a workout glides the arc forward with a lit
 *  head. The workout that closes the ring blooms its light, draws a check
 *  over the figure and holds it before the figure returns marked "Closed"
 *  and the button resolves. */
export function ProgressRingLabeled() {
  const [kcal, setKcal] = React.useState(412);
  const pct = Math.min(100, (kcal / GOAL) * 100);
  const closed = kcal >= GOAL;
  /** The close has played and held — the button may move on. */
  const [resolved, setResolved] = React.useState(false);

  return (
    <Accent color="red" className="w-full">
      <View className="w-full gap-6 rounded-3xl bg-card p-5">
        <View className="flex-row items-center justify-between">
          <Text className="text-[17px] font-semibold">Energy</Text>
          <Text variant="muted">Tuesday</Text>
        </View>

        <View className="items-center">
          <ProgressRing value={pct} size={188} strokeWidth={16} label={`Energy, ${kcal} of ${GOAL} calories`} onClosed={() => setResolved(true)}>
            <Text className="text-5xl font-semibold tracking-tight tabular-nums">{kcal}</Text>
            <Text variant="muted" className="tabular-nums">of {GOAL} kcal</Text>
          </ProgressRing>
        </View>

        <View className="overflow-hidden rounded-2xl bg-secondary">
          {[
            ["Active", "38 of 45 min"],
            ["Distance", "6.2 km"],
            ["Steps", "8,214"],
          ].map(([label, val], i) => (
            <View key={label} className={`flex-row items-center justify-between px-4 py-3 ${i > 0 ? "border-t border-border" : ""}`}>
              <Text className="text-[15px]">{label}</Text>
              <Text className="text-[15px] font-medium tabular-nums text-muted-foreground">{val}</Text>
            </View>
          ))}
        </View>

        <Button
          size="lg"
          className="w-full"
          disabled={closed && !resolved}
          onPress={() => {
            if (closed) {
              setResolved(false);
              setKcal(412);
              return;
            }
            setKcal((k) => Math.min(GOAL, k + 70));
          }}
        >
          {closed && resolved ? "Ring closed. Start over" : "Log 20 min cycling"}
        </Button>
      </View>
    </Accent>
  );
}
