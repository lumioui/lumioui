import * as React from "react";
import { View } from "react-native";
import { SearchInput } from "../search-input";
import { Button } from "../../button/button";
import { Icon } from "../../icon/icon";
import { Text } from "../../text/text";

const EPISODES = [
  { title: "The quiet economics of night trains", show: "Slow Money", length: "42 min", tile: "bg-tint-green" },
  { title: "Why sourdough rises, and when it won't", show: "Proof", length: "58 min", tile: "bg-tint-orange" },
  { title: "Mapping the deep Atlantic", show: "Undercurrent", length: "37 min", tile: "bg-tint-teal" },
];

/** SearchDisabled — a podcast app gone offline. Search can't reach the
 *  catalogue, so the field is disabled with the reason underneath, and the
 *  screen falls back to what's downloaded. Tap "Try again" to reconnect and
 *  the field becomes editable. */
export function SearchDisabled() {
  const [online, setOnline] = React.useState(false);
  const [q, setQ] = React.useState("");
  return (
    <View className="w-full gap-4">
      <Text className="px-1 text-3xl font-bold tracking-tight">Search</Text>
      <SearchInput
        placeholder="Shows, episodes, people"
        value={q}
        onChangeText={setQ}
        editable={online}
        helper={online ? undefined : "You're offline. Showing downloads only."}
        accessibilityLabel="Search podcasts"
      />
      {!online ? (
        <Button variant="secondary" size="sm" className="self-start" onPress={() => setOnline(true)}
          icon={<Icon name="refresh" size="sm" color="secondaryForeground" />}
        >
          Try again
        </Button>
      ) : null}
      <View className="gap-2">
        <Text className="px-4 text-[13px] text-muted-foreground">Downloaded</Text>
        <View className="overflow-hidden rounded-2xl bg-card">
          {EPISODES.map((e, i) => (
            <View key={e.title}>
              {i > 0 ? <View className="ml-[76px] h-px bg-border" /> : null}
              <View className="flex-row items-center gap-3 px-4 py-3">
                <View className={`h-12 w-12 items-center justify-center rounded-xl ${e.tile}`}>
                  <Icon name="mic" size="md" color="#FFFFFF" />
                </View>
                <View className="min-w-0 flex-1">
                  <Text className="text-[15px] font-medium" numberOfLines={1}>{e.title}</Text>
                  <Text variant="muted" numberOfLines={1}>{e.show} · {e.length}</Text>
                </View>
                <Icon name="play" size="sm" color="foreground" />
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
