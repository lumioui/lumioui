import * as React from "react";
import { View } from "react-native";
import { AnimatedNumber } from "../animated-number";
import { SegmentedControl } from "../../segmented-control/segmented-control";
import { Text } from "../../text/text";

type Range = "week" | "month" | "year";

const DATA: Record<Range, { km: number; minutes: number; climb: number; note: string }> = {
  week: { km: 32.4, minutes: 171, climb: 412, note: "Longest run 12.1 km on Sunday" },
  month: { km: 118.6, minutes: 642, climb: 1580, note: "14 runs · best 5K 23:48" },
  year: { km: 1204.9, minutes: 6390, climb: 15220, note: "On pace for 1,450 km this year" },
};

const km = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const hm = (n: number) => {
  const m = Math.round(n);
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m`;
};
const meters = (n: number) => Math.round(n).toLocaleString("en-US");

/** AnimatedStats — a running log's totals. Switch the range and every
 *  number counts from the old total to the new one. */
export function AnimatedStats() {
  const [range, setRange] = React.useState<Range>("week");
  const d = DATA[range];
  const stats = [
    { label: "Distance", unit: "km", value: d.km, format: km, precision: 1 },
    { label: "Time", unit: "", value: d.minutes, format: hm, precision: 0 },
    { label: "Elevation", unit: "m", value: d.climb, format: meters, precision: 0 },
  ];
  return (
    <View className="w-full gap-4 rounded-3xl bg-card p-5">
      <View className="flex-row items-center justify-between">
        <Text className="text-[17px] font-semibold">Running</Text>
        <Text variant="muted">Oct 6 – 12</Text>
      </View>
      <SegmentedControl
        size="sm"
        options={[
          { value: "week", label: "Week" },
          { value: "month", label: "Month" },
          { value: "year", label: "Year" },
        ]}
        value={range}
        onValueChange={(v) => setRange(v as Range)}
      />
      <View className="flex-row">
        {stats.map((s, i) => (
          <View key={s.label} className={`flex-1 gap-1 ${i > 0 ? "border-l border-border pl-4" : ""}`}>
            <Text variant="muted">{s.label}</Text>
            <View className="flex-row items-baseline gap-1">
              <AnimatedNumber
                value={s.value}
                format={s.format}
                precision={s.precision}
                duration={700}
                className="text-xl font-semibold tracking-tight"
              />
              {s.unit ? <Text className="text-sm text-muted-foreground">{s.unit}</Text> : null}
            </View>
          </View>
        ))}
      </View>
      <Text variant="muted" className="border-t border-border pt-3">{d.note}</Text>
    </View>
  );
}
