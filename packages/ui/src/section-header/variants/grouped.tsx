import * as React from "react";
import { Pressable, View } from "react-native";
import { SectionHeader } from "../section-header";
import { Icon } from "../../icon/icon";
import { Text } from "../../text/text";

interface Row {
  title: string;
  detail: string;
  value?: string;
  initials: string;
  /** Per-item disc colour — the institution's own colour (content, not chrome). */
  disc: string;
}

const ACCOUNTS: Row[] = [
  { title: "Halden Savings", detail: "Checking ·· 4821", value: "$6,204.18", initials: "H", disc: "#0F766E" },
  { title: "Norrow Credit Union", detail: "Savings ·· 0937", value: "$18,950.00", initials: "N", disc: "#B45309" },
  { title: "Pell & Vance", detail: "Brokerage ·· 2210", value: "$41,382.66", initials: "P", disc: "#15803D" },
];

const SCHEDULED: Row[] = [
  { title: "Rent, 14 Larch Street", detail: "1st of every month", value: "$1,450.00", initials: "R", disc: "#BE185D" },
  { title: "Brightline Energy", detail: "Oct 18 · autopay", value: "$86.40", initials: "B", disc: "#CA8A04" },
];

function Group({ rows }: { rows: Row[] }) {
  return (
    <View className="mx-4 overflow-hidden rounded-2xl bg-card">
      {rows.map((r, i) => (
        <Pressable
          key={r.title}
          accessibilityRole="button"
          accessibilityLabel={`${r.title}, ${r.detail}${r.value ? `, ${r.value}` : ""}`}
          className="min-h-[60px] flex-row items-center gap-3 pl-4"
        >
          <View className="h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: r.disc }}>
            <Text className="text-[15px] font-semibold text-white">{r.initials}</Text>
          </View>
          <View className={i > 0 ? "flex-1 flex-row items-center border-t border-border py-3 pr-3" : "flex-1 flex-row items-center py-3 pr-3"}>
            <View className="min-w-0 flex-1">
              <Text numberOfLines={1} className="text-base text-foreground">
                {r.title}
              </Text>
              <Text numberOfLines={1} className="text-sm text-muted-foreground">
                {r.detail}
              </Text>
            </View>
            {r.value ? <Text className="text-[15px] tabular-nums text-foreground">{r.value}</Text> : null}
            <Icon name="chevron-right" size="sm" color="mutedForeground" className="ml-1" />
          </View>
        </Pressable>
      ))}
    </View>
  );
}

/** SectionHeaderGrouped — a banking app's accounts screen: compact 13pt
 *  sentence-case labels with a muted count above inset grouped lists, the
 *  label carrying a quiet trailing action. Neutral ink. */
export function SectionHeaderGrouped() {
  return (
    <View className="w-full gap-2 overflow-hidden rounded-3xl bg-background py-6">
      <Text accessibilityRole="header" className="px-5 pb-4 text-3xl font-bold tracking-tight text-foreground">
        Accounts
      </Text>
      <SectionHeader size="compact" title="Linked accounts" count={3} action="Edit" />
      <Group rows={ACCOUNTS} />
      <SectionHeader size="compact" title="Scheduled payments" count={2} action="Add" className="mt-6" />
      <Group rows={SCHEDULED} />
      <Text className="px-5 pt-1 text-[13px] text-muted-foreground">Payments leave the morning they are due.</Text>
    </View>
  );
}
