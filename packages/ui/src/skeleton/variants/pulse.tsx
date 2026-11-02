import * as React from "react";
import { Image, Pressable, View } from "react-native";
import { Skeleton, SkeletonSwitch } from "../skeleton";
import { Icon } from "../../icon/icon";
import { Text } from "../../text/text";

const CHATS = [
  { name: "Hana Kobayashi", text: "Sent the floor plan, take a look", time: "9:41", img: 47, unread: true },
  { name: "Climbing crew", text: "Marcus: Saturday at 8 still on?", time: "9:12", img: 12, unread: true },
  { name: "Olu Adeyemi", text: "Haha yes, that one", time: "Yesterday", img: 15 },
  { name: "Sofía Marín", text: "Voice message · 0:42", time: "Mon", img: 20 },
];
/** How long the inbox takes to sync in the demo (the network's, not a UI duration). */
const SYNC_MS = 1400;

function Row({ first, lead, children }: { first: boolean; lead: React.ReactNode; children: React.ReactNode }) {
  return (
    <View className="flex-row items-center gap-3 pl-4">
      {lead}
      <View className={`flex-1 gap-1 py-3 pr-4 ${first ? "" : "border-t border-border"}`}>{children}</View>
    </View>
  );
}

/** SkeletonPulse — a messaging inbox while threads sync. The dim layout is the
 *  exact shape of the rows; when the sync lands the rows switch on in
 *  order, in place. Refresh brings the dim layout back. */
export function SkeletonPulse() {
  const [loaded, setLoaded] = React.useState(false);
  React.useEffect(() => {
    if (loaded) return;
    const id = setTimeout(() => setLoaded(true), SYNC_MS);
    return () => clearTimeout(id);
  }, [loaded]);

  return (
    <View className="w-full gap-3">
      <View className="flex-row items-center justify-between px-1">
        <Text className="text-3xl font-bold tracking-tight">Chats</Text>
        <Pressable
          onPress={() => setLoaded(false)}
          accessibilityRole="button"
          accessibilityLabel="Refresh chats"
          className="h-11 w-11 items-center justify-center rounded-full bg-card"
        >
          <Icon name="refresh" size="sm" color="foreground" />
        </Pressable>
      </View>

      <SkeletonSwitch
        loaded={loaded}
        className="w-full rounded-2xl bg-card"
        accessibilityLabel={loaded ? "Chats" : "Loading chats"}
        placeholder={CHATS.map((c, i) => (
          <Row key={c.name} first={i === 0} lead={<Skeleton className="h-12 w-12 rounded-full" />}>
            <View className="h-5 flex-row items-center justify-between">
              <Skeleton className="h-3.5 w-32 rounded" />
              <Skeleton className="h-3 w-10 rounded" />
            </View>
            <View className="h-5 justify-center">
              <Skeleton className={`h-3 rounded ${i % 2 ? "w-3/5" : "w-4/5"}`} />
            </View>
          </Row>
        ))}
      >
        {CHATS.map((c, i) => (
          <Row key={c.name} first={i === 0} lead={<Image source={{ uri: `https://i.pravatar.cc/150?img=${c.img}` }} className="h-12 w-12 rounded-full bg-muted" />}>
            <View className="h-5 flex-row items-center justify-between">
              <Text className="text-base font-semibold">{c.name}</Text>
              <Text className="text-xs text-muted-foreground">{c.time}</Text>
            </View>
            <View className="h-5 flex-row items-center gap-2">
              <Text variant="muted" className="flex-1" numberOfLines={1}>
                {c.text}
              </Text>
              {c.unread ? <View className="h-2.5 w-2.5 rounded-full bg-primary" /> : null}
            </View>
          </Row>
        ))}
      </SkeletonSwitch>
    </View>
  );
}
