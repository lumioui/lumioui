import * as React from "react";
import { View } from "react-native";
import { ThemeToggle } from "../theme-toggle";
import { Avatar } from "../../avatar/avatar";
import { Icon, type IconName } from "../../icon/icon";
import { Text } from "../../text/text";

const ROWS: { icon: IconName; label: string; trailing?: string }[] = [
  { icon: "user", label: "Profile" },
  { icon: "bell", label: "Notifications", trailing: "Mentions only" },
  { icon: "settings", label: "Workspace settings" },
];

/** ThemeTogglePill — the labeled toggle in a project tool's account menu,
 *  between the settings rows and sign out. */
export function ThemeTogglePill() {
  return (
    <View className="w-full overflow-hidden rounded-3xl bg-card">
      <View className="flex-row items-center gap-3 px-4 py-4">
        <Avatar size="md" source={{ uri: "https://i.pravatar.cc/150?img=52" }} fallback="RK" alt="Rhea Kapoor" />
        <View className="flex-1">
          <Text className="text-base font-semibold">Rhea Kapoor</Text>
          <Text variant="muted" numberOfLines={1}>rhea@northbeam.io</Text>
        </View>
      </View>

      {ROWS.map((r) => (
        <View key={r.label} className="min-h-12 flex-row items-center gap-3 border-t border-border px-4">
          <Icon name={r.icon} size="md" color="mutedForeground" />
          <Text className="flex-1 text-base">{r.label}</Text>
          {r.trailing ? <Text variant="muted">{r.trailing}</Text> : null}
          <Icon name="chevron-right" size="sm" color="mutedForeground" />
        </View>
      ))}

      <View className="min-h-14 flex-row items-center gap-3 border-t border-border px-4">
        <Icon name="palette" size="md" color="mutedForeground" />
        <Text className="flex-1 text-base">Theme</Text>
        <ThemeToggle variant="pill" />
      </View>

      <View className="min-h-12 flex-row items-center gap-3 border-t border-border px-4">
        <Icon name="log-out" size="md" color="destructive" />
        <Text className="flex-1 text-base text-destructive">Sign out</Text>
      </View>
    </View>
  );
}
