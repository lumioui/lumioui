import * as React from "react";
import { View } from "react-native";
import { ActionSwap } from "../action-swap";
import { Text } from "../../text/text";

const EPISODES = [
  { n: 214, title: "The tide-pool economists", date: "Oct 6", mins: 52 },
  { n: 213, title: "Why bridges hum in the wind", date: "Sep 29", mins: 38 },
  { n: 212, title: "A short history of the night shift", date: "Sep 22", mins: 61 },
  { n: 211, title: "Inside a seed vault", date: "Sep 15", mins: 27 },
];

const SORTS = [
  { label: "Newest", icon: "arrow-down" as const },
  { label: "Oldest", icon: "arrow-up" as const },
  { label: "Shortest", icon: "clock" as const },
];

/** ActionSwapSort — a podcast's episode list with a sort cycler in the
 *  section header. Each tap swaps the label to the next order and the
 *  list underneath really re-sorts. */
export function ActionSwapSort() {
  const [sort, setSort] = React.useState(0);
  const rows = React.useMemo(() => {
    const list = [...EPISODES];
    if (sort === 1) list.reverse();
    if (sort === 2) list.sort((a, b) => a.mins - b.mins);
    return list;
  }, [sort]);
  return (
    <View className="w-full gap-3">
      <View className="flex-row items-end justify-between px-1">
        <View className="gap-0.5">
          <Text className="text-2xl font-bold tracking-tight text-foreground">Episodes</Text>
          <Text className="text-sm text-muted-foreground">Deep Field · 214 episodes</Text>
        </View>
        <ActionSwap
          states={SORTS}
          value={sort}
          onStateChange={setSort}
          accessibilityLabelPrefix="Sorted by"
          className="h-9 px-4"
        />
      </View>
      <View className="w-full rounded-2xl bg-card">
        {rows.map((e, i) => (
          <View key={e.n} className="flex-row items-center gap-3 pl-4 pr-4">
            <View className={`flex-1 flex-row items-center gap-3 py-3 ${i > 0 ? "border-t border-border" : ""}`}>
              <View className="flex-1 gap-0.5">
                <Text className="text-[15px] font-medium text-foreground" numberOfLines={1}>
                  {e.title}
                </Text>
                <Text className="text-sm text-muted-foreground">
                  #{e.n} · {e.date}
                </Text>
              </View>
              <Text className="text-sm tabular-nums text-muted-foreground">{e.mins} min</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
