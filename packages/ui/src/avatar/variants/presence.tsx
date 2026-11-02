import * as React from "react";
import { Pressable, View } from "react-native";
import { useHaptic } from "@lumioui/core";
import { Avatar } from "../avatar";
import { Icon } from "../../icon/icon";
import { Text } from "../../text/text";

type Status = "online" | "away" | "busy" | "offline";

const MY_STATUS: { status: Status; label: string }[] = [
  { status: "online", label: "Active" },
  { status: "away", label: "Away" },
  { status: "busy", label: "Do not disturb" },
  { status: "offline", label: "Appear offline" },
];

const TEAM: { img: number; fallback: string; name: string; status: Status; meta: string }[] = [
  { img: 5, fallback: "JW", name: "Jonah Whitfield", status: "online", meta: "Reviewing the onboarding flow" },
  { img: 26, fallback: "MA", name: "Mireille Asante", status: "busy", meta: "In a meeting until 3:00 PM" },
  { img: 53, fallback: "KS", name: "Kofi Sarpong", status: "away", meta: "Back in 20 min" },
  { img: 41, fallback: "IL", name: "Ines Laurent", status: "offline", meta: "Last active yesterday" },
];

/** AvatarPresence — a team list in a chat app. Presence is light: online
 *  faces are fully on, away and offline faces sit dimmer, and each dot has
 *  its own shape. Tap your own row to cycle your status and watch your
 *  photo switch on or dim with it; teammates show theirs. */
export function AvatarPresence() {
  const haptics = useHaptic();
  const [mine, setMine] = React.useState(0);
  const me = MY_STATUS[mine]!;
  return (
    <View className="w-full gap-6">
      <Pressable
        onPress={() => {
          haptics.selection();
          setMine((i) => (i + 1) % MY_STATUS.length);
        }}
        className="flex-row items-center gap-3 rounded-2xl bg-card p-4"
        accessibilityRole="button"
        accessibilityLabel={`Your status: ${me.label}. Tap to change`}
      >
        <Avatar size="lg" source={{ uri: "https://i.pravatar.cc/150?img=68" }} fallback="SV" status={me.status} alt="You" lit />
        <View className="flex-1">
          <Text className="text-[17px] font-semibold">Sam Varga</Text>
          <Text variant="muted">{me.label}</Text>
        </View>
        <Icon name="chevron-down" size="sm" color="mutedForeground" />
      </Pressable>

      <View className="gap-2">
        <Text className="px-4 text-[13px] text-muted-foreground">Design team</Text>
        <View className="w-full overflow-hidden rounded-2xl bg-card">
          {TEAM.map((p, i) => (
            <View key={p.name} className="flex-row items-center gap-3 pl-4">
              <Avatar
                source={{ uri: `https://i.pravatar.cc/150?img=${p.img}` }}
                fallback={p.fallback}
                status={p.status}
                lit
                alt={`${p.name}, ${p.status}`}
              />
              <View className={`flex-1 py-3 pr-4 ${i > 0 ? "border-t border-border" : ""}`}>
                <Text className="text-base font-medium">{p.name}</Text>
                <Text variant="muted" numberOfLines={1}>{p.meta}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
