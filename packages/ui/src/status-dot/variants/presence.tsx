import * as React from "react";
import { View } from "react-native";
import { StatusDot, type PresenceStatus } from "../status-dot";
import { Avatar } from "../../avatar/avatar";
import { Form } from "../../form/form";
import { Icon } from "../../icon/icon";
import { Text } from "../../text/text";

const OPTIONS: { status: PresenceStatus; label: string; note: string }[] = [
  { status: "online", label: "Active", note: "Notifications on" },
  { status: "away", label: "Away", note: "Shown after 10 min idle" },
  { status: "dnd", label: "Do not disturb", note: "Until 4:00 PM" },
  { status: "offline", label: "Appear offline", note: "Messages still arrive" },
];

const TEAM: { name: string; note: string; img: number; status: PresenceStatus }[] = [
  { name: "Mara Okafor", note: "Reviewing the onboarding flow", img: 47, status: "online" },
  { name: "Jonas Lindqvist", note: "In a meeting until 3:30", img: 12, status: "dnd" },
  { name: "Sofia Brandt", note: "Back from lunch at 2", img: 32, status: "away" },
  { name: "Kenji Watanabe", note: "Last seen yesterday", img: 59, status: "offline" },
];

function Person({ img, status }: { img: number; status: PresenceStatus }) {
  return (
    <View className="h-10 w-10">
      <Avatar size="md" source={{ uri: `https://i.pravatar.cc/150?img=${img}` }} alt="" />
      <StatusDot status={status} size="sm" ring glow className="absolute -bottom-0.5 -right-0.5" />
    </View>
  );
}

/** StatusDotPresence — a team chat's "set your status" sheet. Pick a row and
 *  your own dot swaps to the new shape in place (the old one dims as the new
 *  one switches on) while the pill re-sizes to its label. Statuses read as
 *  light: active is a lit point with a faint halo, away and offline are
 *  unlit filaments — shape + colour, never colour alone. */
export function StatusDotPresence() {
  const [mine, setMine] = React.useState<PresenceStatus>("online");
  const current = OPTIONS.find((o) => o.status === mine)!;
  return (
    <View className="w-full">
      <View className="w-full gap-6">
        <View className="flex-row items-center gap-3 px-1">
          <View className="h-14 w-14">
            <Avatar size="lg" source={{ uri: "https://i.pravatar.cc/150?img=68" }} alt="Your photo" />
            <StatusDot status={mine} size="lg" ring glow className="absolute -bottom-0.5 -right-0.5" />
          </View>
          <View className="flex-1 gap-1">
            <Text className="text-lg font-semibold">Theo Marchetti</Text>
            <StatusDot status={mine} variant="pill" label={current.label} />
          </View>
        </View>

        <View className="gap-2">
          <Text className="px-4 text-[13px] text-muted-foreground">Set yourself as</Text>
          <View className="overflow-hidden rounded-2xl bg-card">
            {OPTIONS.map((o, i) => (
              <React.Fragment key={o.status}>
                {i > 0 ? <Form.Separator className="ml-12" /> : null}
                <Form.Row
                  label={o.label}
                  description={o.note}
                  leading={
                    <View className="w-5 items-center">
                      <StatusDot status={o.status} size="md" />
                    </View>
                  }
                  trailing={
                    mine === o.status ? <Icon name="check" size="sm" color="primaryText" /> : null
                  }
                  onPress={() => setMine(o.status)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: mine === o.status }}
                />
              </React.Fragment>
            ))}
          </View>
        </View>

        <View className="gap-2">
          <Text className="px-4 text-[13px] text-muted-foreground">Design team</Text>
          <View className="overflow-hidden rounded-2xl bg-card">
            {TEAM.map((p, i) => (
              <React.Fragment key={p.name}>
                {i > 0 ? <Form.Separator className="ml-16" /> : null}
                <View className="flex-row items-center gap-3 px-4 py-3">
                  <Person img={p.img} status={p.status} />
                  <View className="flex-1">
                    <Text className="text-[15px] font-medium">{p.name}</Text>
                    <Text variant="muted" numberOfLines={1}>{p.note}</Text>
                  </View>
                </View>
              </React.Fragment>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}
