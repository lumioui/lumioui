import * as React from "react";
import { View } from "react-native";
import { ActionSwapButton, type ActionSwapButtonVariant, type ActionSwapItem, type ActionSwapMode } from "../action-swap";
import { Icon, type IconName } from "../../icon/icon";
import { Text } from "../../text/text";

type IconColor = "primaryForeground" | "secondaryForeground" | "foreground";

function items(list: [string, string, IconName][], color: IconColor): ActionSwapItem[] {
  return list.map(([id, label, icon]) => ({ id, label, icon: <Icon name={icon} size="sm" color={color} /> }));
}

const ROWS: {
  mode: ActionSwapMode;
  title: string;
  sub: string;
  variant: ActionSwapButtonVariant;
  items: ActionSwapItem[];
}[] = [
  {
    mode: "roll",
    title: "Layout",
    sub: "How files appear in this folder",
    variant: "secondary",
    items: items([["list", "List", "list"], ["grid", "Grid", "grid"], ["gallery", "Gallery", "image"]], "secondaryForeground"),
  },
  {
    mode: "blur",
    title: "Sort by",
    sub: "Applies to every view",
    variant: "outline",
    items: items([["date", "Date", "calendar"], ["name", "Name", "type"], ["size", "Size", "archive"]], "foreground"),
  },
  {
    mode: "cascade",
    title: "Offline access",
    sub: "1.2 GB on this phone",
    variant: "primary",
    items: items([["off", "Download", "download"], ["on", "Offline", "check"]], "primaryForeground"),
  },
];

/** ActionSwapModes — a shared folder's settings group. Each row's
 *  control swaps its label a different way (lift, in place, lit letter by letter), so
 *  tapping down the list compares all three in a real context. */
export function ActionSwapModes() {
  return (
    <View className="w-full gap-4">
      <View className="gap-0.5 px-1">
        <Text className="text-2xl font-bold tracking-tight text-foreground">Q3 brand review</Text>
        <Text className="text-sm text-muted-foreground">24 files · shared with Studio North</Text>
      </View>
      <View className="w-full rounded-2xl bg-card">
        {ROWS.map((row, i) => (
          <View key={row.mode} className="flex-row items-center gap-3 pl-4 pr-3">
            <View className={`flex-1 py-3.5 ${i > 0 ? "border-t border-border" : ""}`}>
              <Text className="text-base font-medium text-foreground">{row.title}</Text>
              <Text className="text-sm text-muted-foreground" numberOfLines={1}>
                {row.sub}
              </Text>
            </View>
            <ActionSwapButton
              items={row.items}
              mode={row.mode}
              light={row.mode === "cascade"}
              variant={row.variant}
              size="sm"
              className="w-[128px]"
            />
          </View>
        ))}
      </View>
    </View>
  );
}
