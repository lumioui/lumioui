import * as React from "react";
import { View } from "react-native";
import { Avatar } from "../avatar";
import { Button } from "../../button/button";
import { Icon } from "../../icon/icon";
import { Text } from "../../text/text";

const COMMENTS = [
  { img: 9, f: "MK", name: "Mina Kaur", body: "That celadon glaze is unreal. Is it a cone 6 recipe?" },
  { img: 13, f: "DP", name: "Dev Patel", body: "Picked up two cups at the market. Even better in person." },
];

/** AvatarSizes — each size in the spot it owns on a maker's profile: xl in
 *  the header, sm on the "followed by" line, lg on the event row, md in the
 *  comments. Tap Follow and the follower line updates. */
export function AvatarSizes() {
  const [following, setFollowing] = React.useState(false);
  return (
    <View className="w-full gap-5 rounded-3xl bg-card p-5">
      <View className="flex-row items-center gap-4">
        <Avatar size="xl" source={{ uri: "https://i.pravatar.cc/150?img=32" }} fallback="AL" alt="Ama Lindqvist" />
        <View className="flex-1 gap-1">
          <Text className="text-2xl font-bold tracking-tight">Ama Lindqvist</Text>
          <Text variant="muted">Ceramicist · Malmö</Text>
        </View>
      </View>

      <View className="flex-row items-center gap-2">
        <View className="flex-row">
          <Avatar size="sm" source={{ uri: "https://i.pravatar.cc/150?img=15" }} fallback="JT" alt="Jun Takeda" />
          <View className="-ml-2 rounded-full border-2 border-card" style={{ marginVertical: -2 }}>
            <Avatar size="sm" source={{ uri: "https://i.pravatar.cc/150?img=44" }} fallback="RV" alt="Ruth Vega" />
          </View>
        </View>
        <Text variant="muted" className="flex-1" numberOfLines={1}>
          {following ? "Followed by you, Jun and 214 others" : "Followed by Jun, Ruth and 214 others"}
        </Text>
      </View>

      <Button size="lg" variant={following ? "secondary" : "default"} onPress={() => setFollowing((f) => !f)}>
        {following ? "Following" : "Follow"}
      </Button>

      <View className="flex-row items-center gap-3 rounded-2xl bg-secondary p-3">
        <Avatar size="lg" source={{ uri: "https://i.pravatar.cc/150?img=59" }} fallback="OB" alt="Olu Bankole" />
        <View className="flex-1">
          <Text className="text-[15px] font-semibold">Studio visit with Olu Bankole</Text>
          <Text variant="muted">Live Thursday · 7:00 PM</Text>
        </View>
        <Icon name="bell" size="md" color="foreground" accessibilityLabel="Remind me" />
      </View>

      <View className="gap-4 border-t border-border pt-4">
        {COMMENTS.map((c) => (
          <View key={c.name} className="flex-row gap-3">
            <Avatar size="md" source={{ uri: `https://i.pravatar.cc/150?img=${c.img}` }} fallback={c.f} alt={c.name} />
            <View className="flex-1 gap-1">
              <Text className="text-sm font-semibold">{c.name}</Text>
              <Text className="text-[15px] leading-5">{c.body}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
