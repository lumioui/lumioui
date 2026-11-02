import * as React from "react";
import { Image, View } from "react-native";
import { Accent } from "@lumioui/core";
import { LikeButton } from "../like-button";
import { Text } from "../../text/text";

const COVER = "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&q=80&auto=format&fit=crop";

const TRACKS = [
  { title: "Salt in the Gutters", length: "3:41" },
  { title: "Low Tide Hours", length: "4:12", explicit: true },
  { title: "Paper Lanterns, Pier 9", length: "3:58" },
  { title: "Halyard", length: "2:47" },
  { title: "Come Back Brighter", length: "5:06" },
  { title: "The Long Way Round", length: "4:30" },
];

/** LikeButtonTracks — save-to-library hearts on an album tracklist. Count-less
 *  small hearts in the pink media accent; the saved tally under the header
 *  follows each tap. */
export function LikeButtonTracks() {
  const [saved, setSaved] = React.useState<Record<number, boolean>>({ 1: true });
  const savedCount = Object.values(saved).filter(Boolean).length;
  return (
    <Accent color="pink" className="w-full">
      <View className="w-full gap-5">
        <View className="flex-row items-center gap-4">
          <Image source={{ uri: COVER }} className="h-24 w-24 rounded-xl bg-muted" accessibilityIgnoresInvertColors />
          <View className="flex-1 gap-1">
            <Text className="text-xl font-bold tracking-tight" numberOfLines={1}>Low Tide Hours</Text>
            <Text className="text-[15px] text-muted-foreground">Marrow &amp; Vale</Text>
            <Text className="text-xs text-muted-foreground tabular-nums">
              Album · 2024 · {savedCount === 0 ? "None saved" : `${savedCount} of ${TRACKS.length} saved`}
            </Text>
          </View>
        </View>

        <View className="overflow-hidden rounded-2xl bg-card">
          {TRACKS.map((t, i) => (
            <View key={t.title}>
              {i > 0 ? <View className="ml-12 h-px bg-border" /> : null}
              <View className="min-h-[56px] flex-row items-center pl-4 pr-2">
                <Text className="w-8 text-[15px] text-muted-foreground tabular-nums">{i + 1}</Text>
                <View className="flex-1 gap-0.5">
                  <Text className="text-base font-medium" numberOfLines={1}>{t.title}</Text>
                  <View className="flex-row items-center gap-1.5">
                    {t.explicit ? (
                      <View className="h-4 w-4 items-center justify-center rounded-sm bg-muted-foreground">
                        <Text className="text-xs font-bold leading-none text-card">E</Text>
                      </View>
                    ) : null}
                    <Text className="text-sm text-muted-foreground tabular-nums">{t.length}</Text>
                  </View>
                </View>
                <LikeButton
                  size="sm"
                  color="primary"
                  className="w-11 justify-center"
                  liked={!!saved[i]}
                  onLikedChange={(v) => setSaved((s) => ({ ...s, [i]: v }))}
                  accessibilityLabel={`Save ${t.title}`}
                />
              </View>
            </View>
          ))}
        </View>
      </View>
    </Accent>
  );
}
