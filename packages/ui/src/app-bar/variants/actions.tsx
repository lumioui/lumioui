import * as React from "react";
import { View } from "react-native";
import { AppBar } from "../app-bar";
import { Avatar } from "../../avatar/avatar";
import { Text } from "../../text/text";

/** AppBarActions — an issue-tracker detail screen: compact centred title
 *  with a status subtitle, accent back link, and trailing actions that
 *  change state. Watching commits on the bell (accent wash, held) and the
 *  subtitle swaps in place; done disables itself. */
export function AppBarActions() {
  const [watching, setWatching] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const rows: [string, React.ReactNode][] = [
    [
      "Status",
      <View key="s" className="flex-row items-center gap-2">
        <View className={`h-2.5 w-2.5 rounded-full ${done ? "bg-tint-green" : "bg-tint-amber"}`} />
        <Text className="text-[15px]">{done ? "Done" : "In progress"}</Text>
      </View>,
    ],
    [
      "Assignee",
      <View key="a" className="flex-row items-center gap-2">
        <Avatar size="sm" source={{ uri: "https://i.pravatar.cc/150?img=33" }} fallback="RL" alt="Rhea Lindqvist" />
        <Text className="text-[15px]">Rhea Lindqvist</Text>
      </View>,
    ],
    ["Cycle", <Text key="c" className="text-[15px]">Cycle 42 · ends Fri</Text>],
    ["Estimate", <Text key="e" className="text-[15px] tabular-nums">3 points</Text>],
  ];
  return (
    <View className="w-full">
      <View className="w-full overflow-hidden rounded-3xl bg-background">
        <AppBar
          safeArea={false}
          title="ENG-2481"
          subtitle={done ? "Closed just now" : watching ? "Watching" : "Mobile · Backlog"}
          showBack
          backLabel="Backlog"
          actions={[
            {
              icon: "bell",
              active: watching,
              accessibilityLabel: watching ? "Stop watching" : "Watch issue",
              onPress: () => setWatching((v) => !v),
            },
            {
              icon: "check-circle",
              accessibilityLabel: done ? "Marked done" : "Mark done",
              disabled: done,
              onPress: () => setDone(true),
            },
          ]}
        />
        <View className="gap-5 px-5 pb-6 pt-5">
          <View className="gap-2">
            <Text className="text-2xl font-bold tracking-tight">
              Offline drafts lose attachments after relaunch
            </Text>
            <Text className="text-[15px] leading-[22px] text-muted-foreground">
              Photos added to a draft while offline are dropped if the app is closed before it syncs. Seen on phones and tablets since build 4.2.
            </Text>
          </View>
          <View className="overflow-hidden rounded-2xl bg-card">
            {rows.map(([label, value], i) => (
              <View
                key={label}
                className={`min-h-12 flex-row items-center justify-between px-4 py-2 ${i > 0 ? "border-t border-border" : ""}`}
              >
                <Text className="text-[15px] text-muted-foreground">{label}</Text>
                {value}
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}
