import * as React from "react";
import { Pressable, View } from "react-native";
import { Accent, useHaptic } from "@lumioui/core";
import { Image, type ImageProps } from "../image";
import { Icon } from "../../icon/icon";
import { Text } from "../../text/text";

const img = (id: string) => `https://images.unsplash.com/${id}?w=300&h=300&fit=crop&q=70&auto=format`;

/** Radius follows what the image IS: a playlist is a square tile, an
 *  artist is a circle, a podcast is a rounded app-icon-like square. */
const ITEMS: { id: string; title: string; meta: string; uri: string; rounded: ImageProps["rounded"]; alt: string }[] = [
  { id: "mix", title: "Late Night Drive", meta: "Playlist · 48 songs", uri: img("photo-1493225457124-a3eb161ffa5f"), rounded: "lg", alt: "Concert crowd under stage lights" },
  { id: "artist", title: "Solenne", meta: "Artist", uri: img("photo-1470225620780-dba8ba36b745"), rounded: "full", alt: "DJ at a mixing desk" },
  { id: "pod", title: "Signal & Noise", meta: "Podcast · Ep. 112", uri: img("photo-1478737270239-2f02b77fc618"), rounded: "2xl", alt: "Studio microphone" },
];

/** ImageRounded — a music app's "Pick up again" row, where each radius says
 *  what you're looking at. Tap one and it starts in the player bar. */
export function ImageRounded() {
  const haptics = useHaptic();
  const [playing, setPlaying] = React.useState("mix");
  const now = ITEMS.find((i) => i.id === playing) ?? ITEMS[0]!;
  return (
    <Accent color="pink" className="w-full">
      <View className="w-full gap-4">
        <Text className="px-1 text-xl font-semibold tracking-tight">Pick up again</Text>
        <View className="flex-row gap-3">
          {ITEMS.map((it) => (
            <Pressable
              key={it.id}
              onPress={() => {
                haptics.selection();
                setPlaying(it.id);
              }}
              className="flex-1 gap-2"
              accessibilityRole="button"
              accessibilityLabel={`Play ${it.title}`}
              accessibilityState={{ selected: playing === it.id }}
            >
              <Image source={{ uri: it.uri }} rounded={it.rounded} aspectRatio={1} accessibilityLabel={it.alt} />
              <View className={it.rounded === "full" ? "items-center" : undefined}>
                <Text className="text-[15px] font-medium" numberOfLines={1}>{it.title}</Text>
                <Text className="text-xs text-muted-foreground" numberOfLines={1}>{it.meta}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        <View className="flex-row items-center gap-3 rounded-2xl bg-card p-2 pr-4">
          <Image source={{ uri: now.uri }} rounded={now.rounded === "full" ? "full" : "md"} className="h-12 w-12" accessibilityLabel={now.alt} />
          <View className="flex-1">
            <Text className="text-[15px] font-medium" numberOfLines={1}>{now.title}</Text>
            <Text variant="muted" numberOfLines={1}>{now.meta}</Text>
          </View>
          <Icon name="pause" size="md" color="primaryText" accessibilityLabel="Pause" />
        </View>
      </View>
    </Accent>
  );
}
