import * as React from "react";
import { View } from "react-native";
import { AvatarGroup, type AvatarGroupItem } from "../avatar-group";
import { Icon, type IconName } from "../../icon/icon";
import { Text } from "../../text/text";

const p = (img: number, fallback: string, alt: string): AvatarGroupItem => ({
  id: alt,
  source: { uri: `https://i.pravatar.cc/150?img=${img}` },
  fallback,
  alt,
});

const ROWS: {
  size: "sm" | "md" | "lg";
  icon: IconName;
  tile: string;
  title: string;
  meta: string;
  people: AvatarGroupItem[];
}[] = [
  {
    size: "sm",
    icon: "file-text",
    tile: "bg-tint-teal",
    title: "Q4 pricing proposal",
    meta: "Edited 12 min ago",
    people: [p(12, "AD", "Aiden Doyle"), p(45, "SC", "Sofia Castro"), { id: "Wen Li", fallback: "WL", alt: "Wen Li" }],
  },
  {
    size: "md",
    icon: "users",
    tile: "bg-tint-pink",
    title: "Growth squad",
    meta: "2 of 6 online",
    people: [p(36, "MB", "Marta Bianchi"), p(60, "JN", "Jomo Ndungu"), p(24, "EK", "Elif Kaya"), p(57, "RG", "Rafael Gomes"), p(49, "HS", "Hana Sato"), p(3, "LD", "Luc Dubois")],
  },
  {
    size: "lg",
    icon: "calendar",
    tile: "bg-tint-orange",
    title: "Design crit",
    meta: "Today · 2:00 PM",
    people: [p(16, "PA", "Pablo Arce"), p(38, "GM", "Grace Mensah")],
  },
];

/** AvatarGroupSizes — the stack at sm, md and lg in the rows that use
 *  them: a shared doc, a team, a meeting about to start. */
export function AvatarGroupSizes() {
  return (
    <View className="w-full overflow-hidden rounded-2xl bg-card">
      {ROWS.map((r, i) => (
        <View key={r.size} className="flex-row items-center gap-3 pl-4">
          <View className={`h-10 w-10 items-center justify-center rounded-xl ${r.tile}`}>
            <Icon name={r.icon} size="sm" color="#FFFFFF" />
          </View>
          <View
            className={`min-h-[76px] flex-1 flex-row items-center gap-3 py-3 pr-4 ${i > 0 ? "border-t border-border" : ""}`}
          >
            <View className="flex-1">
              <Text className="text-base font-medium" numberOfLines={1}>{r.title}</Text>
              <Text variant="muted" numberOfLines={1}>{r.meta}</Text>
            </View>
            <AvatarGroup items={r.people} size={r.size} max={3} />
          </View>
        </View>
      ))}
    </View>
  );
}
