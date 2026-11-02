import * as React from "react";
import { View } from "react-native";
import { Accent, tempo } from "@lumioui/core";
import { AvatarGroup, type AvatarGroupItem } from "../avatar-group";
import { Button } from "../../button/button";
import { Icon } from "../../icon/icon";
import { Text } from "../../text/text";

const GUESTS: AvatarGroupItem[] = [
  { id: "ines", source: { uri: "https://i.pravatar.cc/150?img=47" }, fallback: "IL", alt: "Ines Laurent" },
  { id: "theo", source: { uri: "https://i.pravatar.cc/150?img=15" }, fallback: "TM", alt: "Theo Marchetti" },
  { id: "noor", source: { uri: "https://i.pravatar.cc/150?img=29" }, fallback: "NH", alt: "Noor Haddad" },
  { id: "kai", fallback: "KO", alt: "Kai Oduya" },
  { id: "ruth", source: { uri: "https://i.pravatar.cc/150?img=44" }, fallback: "RV", alt: "Ruth Vega" },
  { id: "bao", source: { uri: "https://i.pravatar.cc/150?img=8" }, fallback: "BT", alt: "Bao Tran" },
  { id: "lena", source: { uri: "https://i.pravatar.cc/150?img=33" }, fallback: "LB", alt: "Lena Beck" },
  { id: "omar", fallback: "OS", alt: "Omar Saleh" },
  { id: "yuki", source: { uri: "https://i.pravatar.cc/150?img=20" }, fallback: "YM", alt: "Yuki Mori" },
];

const ME: AvatarGroupItem = {
  id: "me",
  source: { uri: "https://i.pravatar.cc/150?img=68" },
  fallback: "SV",
  alt: "You",
};

/** Act, hold, resolve — the stack performs the join, and the button only
 *  confirms after two settle beats (~630ms) so the eye catches your face landing. */
const JOIN_HOLD = tempo.settle * 2;

/** AvatarGroupOverflow — who's going on an event invite. Tap "I'm going"
 *  and your face ignites at the front of the stack while the others slide
 *  over, the +N count ticks up in place and a light pass crosses the faces;
 *  the button confirms after the hold. The +N bubble opens the list. */
export function AvatarGroupOverflow() {
  const [going, setGoing] = React.useState(false);
  const [confirmed, setConfirmed] = React.useState(false);
  const [note, setNote] = React.useState<string | null>(null);
  const hold = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(
    () => () => {
      if (hold.current) clearTimeout(hold.current);
    },
    []
  );
  const guests = going ? [ME, ...GUESTS] : GUESTS;
  const lead = going ? "You, Ines" : "Ines, Theo";
  return (
    <Accent color="amber" className="w-full">
      <View className="w-full gap-5 rounded-3xl bg-card p-5">
        <View className="gap-1">
          <Text className="text-2xl font-bold tracking-tight">Rooftop film night</Text>
          <Text variant="muted">Fri, Oct 17 · 8:00 PM · Hosted by Noor</Text>
        </View>

        <View className="flex-row items-center gap-2">
          <Icon name="map-pin" size="sm" color="mutedForeground" />
          <Text className="flex-1 text-[15px]" numberOfLines={1}>Pier 9 Rooftop, Harbourside</Text>
        </View>

        <View className="flex-row items-center gap-3 border-t border-border pt-4">
          <AvatarGroup
            items={guests}
            // Three faces + the count bubble leaves the caption room to read in full.
            max={3}
            onItemPress={(item) => setNote(item.id === "me" ? "That's you" : `${item.alt} is going`)}
            onOverflowPress={(rest) => setNote(rest.map((r) => r.alt).join(", "))}
          />
          <View className="flex-1">
            <Text className="text-[15px] font-medium" numberOfLines={1}>{guests.length} going</Text>
            <Text variant="muted" numberOfLines={1}>{note ?? `${lead} and ${guests.length - 2} more`}</Text>
          </View>
        </View>

        <Button
          size="lg"
          variant={confirmed ? "secondary" : "default"}
          onPress={() => {
            if (going && !confirmed) return;
            setNote(null);
            if (going) {
              setGoing(false);
              setConfirmed(false);
              return;
            }
            setGoing(true);
            hold.current = setTimeout(() => {
              hold.current = null;
              setConfirmed(true);
            }, JOIN_HOLD);
          }}
          icon={confirmed ? <Icon name="check" size="sm" color="foreground" /> : undefined}
        >
          {confirmed ? "You're going" : "I'm going"}
        </Button>
      </View>
    </Accent>
  );
}
