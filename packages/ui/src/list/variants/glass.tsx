import * as React from "react";
import { Image, StyleSheet, View } from "react-native";
import { List } from "../list";
import { Switch } from "../../switch/switch";
import { Text } from "../../text/text";

const ART =
  "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80&auto=format&fit=crop";

/** ListGlass — playback settings on a glass section over the album art
 *  they belong to; the only place glass earns its keep is over content. */
export function ListGlass() {
  const [lossless, setLossless] = React.useState(true);
  const [autoplay, setAutoplay] = React.useState(false);
  return (
    <View className="relative h-[460px] w-full overflow-hidden rounded-3xl bg-muted">
      <Image source={{ uri: ART }} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityIgnoresInvertColors />
      <View className="absolute inset-x-0 bottom-2">
        <List glass inset>
          <List.Section>
            <List.Item
              title="Lossless audio"
              subtitle={lossless ? "24-bit / 48 kHz on Wi-Fi" : "High efficiency"}
              subtitleNumberOfLines={1}
              trailing={<Switch checked={lossless} onCheckedChange={setLossless} accessibilityLabel="Lossless audio" />}
            />
            <List.Separator />
            <List.Item
              title="Autoplay similar music"
              trailing={<Switch checked={autoplay} onCheckedChange={setAutoplay} accessibilityLabel="Autoplay similar music" />}
            />
            <List.Separator />
            <List.Item
              title="Crossfade"
              trailing={<Text className="text-[15px] text-muted-foreground">6 seconds</Text>}
              showChevron
              onPress={() => {}}
            />
            <List.Separator />
            <List.Item
              title="Downloads"
              trailing={<Text className="text-[15px] text-muted-foreground tabular-nums">2.4 GB</Text>}
              showChevron
              onPress={() => {}}
            />
          </List.Section>
        </List>
      </View>
    </View>
  );
}
