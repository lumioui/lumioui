import * as React from "react";
import { View } from "react-native";
import { Accent } from "@lumioui/core";
import { NumberInput } from "../number-input";
import { Text } from "../../text/text";

interface SetRow {
  kg: number;
  reps: number;
}

/** NumberInputWorkout — a strength log for back squats. Each set row has
 *  two inline pill inputs (kg in 2.5 steps, reps in 1s); hold + to load
 *  plates fast. Volume for the session follows every change. Red. */
export function NumberInputWorkout() {
  const [sets, setSets] = React.useState<SetRow[]>([
    { kg: 80, reps: 8 },
    { kg: 85, reps: 6 },
    { kg: 87.5, reps: 5 },
  ]);
  const update = (i: number, patch: Partial<SetRow>) =>
    setSets((cur) => cur.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const volume = sets.reduce((sum, s) => sum + s.kg * s.reps, 0);
  return (
    <Accent color="red" className="w-full">
      <View className="w-full gap-5">
        <View className="flex-row items-end justify-between px-1">
          <View className="gap-1">
            <Text className="text-2xl font-bold tracking-tight">Back squat</Text>
            <Text variant="muted">Last time: 85 kg × 6</Text>
          </View>
          <View className="items-end">
            <Text className="text-2xl font-semibold tabular-nums">{volume.toLocaleString("en-GB")}</Text>
            <Text variant="muted">kg volume</Text>
          </View>
        </View>

        <View className="overflow-hidden rounded-2xl bg-card">
          <View className="flex-row items-center px-4 pb-1 pt-3">
            <Text className="w-10 text-[13px] text-muted-foreground">Set</Text>
            <Text className="flex-1 text-center text-[13px] text-muted-foreground">Weight</Text>
            <Text className="w-[120px] text-center text-[13px] text-muted-foreground">Reps</Text>
          </View>
          {sets.map((s, i) => (
            <View key={i}>
              {i > 0 ? <View className="ml-14 h-px bg-border" /> : null}
              <View className="min-h-[56px] flex-row items-center gap-2 px-4 py-2">
                <Text className="w-8 text-base font-semibold tabular-nums">{i + 1}</Text>
                <View className="flex-1 items-center">
                  <NumberInput
                    variant="inline"
                    size="sm"
                    value={s.kg}
                    onValueChange={(kg) => update(i, { kg })}
                    min={20}
                    max={300}
                    step={2.5}
                    precision={1}
                    unit="kg"
                    accessibilityLabel={`Set ${i + 1} weight`}
                  />
                </View>
                <NumberInput
                  variant="inline"
                  size="sm"
                  value={s.reps}
                  onValueChange={(reps) => update(i, { reps })}
                  min={1}
                  max={30}
                  accessibilityLabel={`Set ${i + 1} reps`}
                />
              </View>
            </View>
          ))}
        </View>
      </View>
    </Accent>
  );
}
