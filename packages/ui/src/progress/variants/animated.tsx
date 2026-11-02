import * as React from "react";
import { View } from "react-native";
import { Accent } from "@lumioui/core";
import { Progress } from "../progress";
import { Button } from "../../button/button";
import { Text } from "../../text/text";

const GOAL = 2400;

/** ProgressAnimated — a savings pot in a banking app. The bar is the goal;
 *  each deposit glides the fill forward.
 *  The deposit that reaches the goal brightens the bar in place and blooms
 *  light under it; it holds, then folds into a
 *  "Goal reached" line that stays. */
export function ProgressAnimated() {
  const [saved, setSaved] = React.useState(1480);
  const pct = Math.min(100, (saved / GOAL) * 100);
  const reached = saved >= GOAL;

  return (
    <Accent color="green" className="w-full">
      <View className="w-full gap-5 rounded-3xl bg-card p-5">
        <View className="gap-1">
          <Text variant="muted">Road bike fund</Text>
          <Text className="text-5xl font-semibold tracking-tight tabular-nums">
            ${saved.toLocaleString("en-US")}
          </Text>
          <Text variant="muted">
            {reached ? "Goal reached. Time to ride." : `$${(GOAL - saved).toLocaleString("en-US")} to go · by 14 March`}
          </Text>
        </View>

        <View className="gap-2">
          <Progress value={pct} className="h-3" completeLabel="Goal reached · ready to ride" />
          <View className="flex-row justify-between">
            <Text className="text-xs text-muted-foreground tabular-nums">{Math.round(pct)}%</Text>
            <Text className="text-xs text-muted-foreground tabular-nums">${GOAL.toLocaleString("en-US")}</Text>
          </View>
        </View>

        <View className="flex-row gap-2">
          <Button
            size="lg"
            className="flex-1"
            disabled={reached}
            onPress={() => setSaved((s) => Math.min(GOAL, s + 200))}
          >
            Add $200
          </Button>
          <Button size="lg" variant="secondary" className="flex-1" onPress={() => setSaved(1480)}>
            Reset
          </Button>
        </View>
      </View>
    </Accent>
  );
}
