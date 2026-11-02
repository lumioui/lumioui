import * as React from "react";
import { View } from "react-native";
import { Accent } from "@lumioui/core";
import { useToast } from "../toast";
import { Button } from "../../button/button";
import { Icon } from "../../icon/icon";
import { Text } from "../../text/text";

const GUESTS = ["Ines", "Tomás", "Wen", "Kofi", "Maren", "Arjun", "Leila", "Sam"];

/** ToastLoading — sending calendar invites. One toast starts as loading and
 *  morphs in place to success (no second toast), the status icon and copy
 *  crossfading while the card stays put. */
export function ToastLoading() {
  const { loading, update } = useToast();
  const [sent, setSent] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const send = () => {
    const id = loading("Sending 8 invites…", "Design review · Thu 16 Oct, 2:00 PM");
    timer.current = setTimeout(() => {
      update(id, {
        variant: "success",
        title: "Invites sent",
        description: "8 people will get an email with the agenda",
        duration: 3500,
        dismissible: true,
      });
      setSent(true);
    }, 2200);
  };

  return (
    <Accent color="orange" className="w-full">
      <View className="w-full gap-5 rounded-3xl bg-card p-5">
        <View className="gap-1">
          <Text className="text-2xl font-bold tracking-tight">Design review</Text>
          <Text variant="muted">Thursday 16 October · 2:00 to 3:00 PM</Text>
        </View>

        <View className="overflow-hidden rounded-2xl bg-secondary">
          <View className="flex-row items-center gap-3 px-4 py-3">
            <Icon name="map-pin" size="sm" color="mutedForeground" />
            <Text className="flex-1 text-[15px]">Room 4B, Harbour Building</Text>
          </View>
          <View className="flex-row items-center gap-3 border-t border-border px-4 py-3">
            <Icon name="users" size="sm" color="mutedForeground" />
            <Text className="flex-1 text-[15px]" numberOfLines={1}>{GUESTS.join(", ")}</Text>
            <Text className="text-[15px] text-muted-foreground tabular-nums">8</Text>
          </View>
        </View>

        <Button size="lg" className="w-full" onPress={send}>
          {sent ? "Send again" : "Send invites"}
        </Button>
      </View>
    </Accent>
  );
}
