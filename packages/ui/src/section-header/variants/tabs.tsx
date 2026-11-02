import * as React from "react";
import { Image, View } from "react-native";
import { Accent, BAND_STAGGER, SwitchOn, rowDelay } from "@lumioui/core";
import { SectionHeader } from "../section-header";
import { Text } from "../../text/text";

type Scope = "Friends" | "Club" | "Everyone";

interface Runner {
  name: string;
  km: number;
  avatar: number;
  you?: boolean;
}

const BOARD: Record<Scope, Runner[]> = {
  Friends: [
    { name: "Ines Carvalho", km: 48.2, avatar: 47 },
    { name: "You", km: 41.6, avatar: 12, you: true },
    { name: "Tomás Reyes", km: 36.9, avatar: 33 },
    { name: "Wen Liu", km: 29.4, avatar: 44 },
    { name: "Dara Okafor", km: 21.0, avatar: 15 },
  ],
  Club: [
    { name: "Priya Nair", km: 92.7, avatar: 49 },
    { name: "Malik Grant", km: 88.1, avatar: 52 },
    { name: "Ines Carvalho", km: 48.2, avatar: 47 },
    { name: "You", km: 41.6, avatar: 12, you: true },
    { name: "Sven Aalto", km: 40.3, avatar: 60 },
  ],
  Everyone: [
    { name: "Kemi Adebayo", km: 164.5, avatar: 26 },
    { name: "Jonah Feld", km: 158.0, avatar: 57 },
    { name: "Rosa Lindqvist", km: 151.2, avatar: 23 },
    { name: "Arjun Mehta", km: 149.8, avatar: 68 },
    { name: "Lea Moreau", km: 147.3, avatar: 41 },
  ],
};

/** Runners in each scope — the header's count swaps digit by digit. */
const RUNNERS: Record<Scope, number> = { Friends: 14, Club: 238, Everyone: 12408 };

/** SectionHeaderTabs — a running club's weekly leaderboard: the header
 *  leads the switch-on and the ranking follows a band later, row by row.
 *  The inline filter's pill glides and each label's ink follows its
 *  coverage; the runner count swaps in place, rising as it grows. Red
 *  accent (fitness) marks only your own row. */
export function SectionHeaderTabs() {
  const [scope, setScope] = React.useState<Scope>("Friends");
  const rows = BOARD[scope];
  return (
    <Accent color="red" className="w-full">
      <View className="w-full gap-4 overflow-hidden rounded-3xl bg-background px-5 py-6">
        <SectionHeader
          size="large"
          switchOn
          animateCount
          count={RUNNERS[scope]}
          title="Leaderboard"
          subtitle="This week · total distance"
          action="Rules"
          accessory={
            <SectionHeader.Tabs
              options={["Friends", "Club", "Everyone"]}
              value={scope}
              onValueChange={(v) => setScope(v as Scope)}
              className="-ml-4"
            />
          }
        />
        <View className="w-full">
          {rows.map((r, i) => (
            <SwitchOn
              key={`${scope}-${r.name}`}
              delay={BAND_STAGGER + rowDelay(i)}
              className={i > 0 ? "flex-row items-center gap-3 border-t border-border py-3" : "flex-row items-center gap-3 py-3"}
              accessible
              accessibilityLabel={`${i + 1}. ${r.name}, ${r.km.toFixed(1)} kilometres`}
            >
              <Text className="w-6 text-[15px] font-semibold tabular-nums text-muted-foreground">{i + 1}</Text>
              <Image
                source={{ uri: `https://i.pravatar.cc/120?img=${r.avatar}` }}
                className="h-10 w-10 rounded-full bg-muted"
                accessibilityIgnoresInvertColors
              />
              <Text
                numberOfLines={1}
                className={r.you ? "flex-1 text-base font-semibold text-primary-text" : "flex-1 text-base text-foreground"}
              >
                {r.name}
              </Text>
              <Text className="text-base font-medium tabular-nums text-foreground">
                {r.km.toFixed(1)}
                <Text className="text-sm font-normal text-muted-foreground"> km</Text>
              </Text>
            </SwitchOn>
          ))}
        </View>
      </View>
    </Accent>
  );
}
