import * as React from "react";
import { Pressable, View } from "react-native";
import { useHaptic } from "@lumioui/core";
import { Image } from "../image";
import { Icon } from "../../icon/icon";
import { Text } from "../../text/text";

const PHOTO =
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80&auto=format&fit=crop";

/** ImagePhoto — the hero photo of a trail in a hiking app. It fades in
 *  over its placeholder; tap the heart to save the route. */
export function ImagePhoto() {
  const haptics = useHaptic();
  const [saved, setSaved] = React.useState(false);
  return (
    <View className="w-full gap-3">
        <View>
          <Image
            source={{ uri: PHOTO }}
            aspectRatio={4 / 5}
            rounded="3xl"
            accessibilityLabel="Peaks rising above a sea of clouds"
          />
          <Pressable
            onPress={() => {
              haptics.selection();
              setSaved((s) => !s);
            }}
            className="absolute right-3 top-3 h-11 w-11 items-center justify-center rounded-full bg-card"
            accessibilityRole="button"
            accessibilityLabel={saved ? "Remove from saved" : "Save route"}
            accessibilityState={{ selected: saved }}
          >
            <Icon name="heart" size="md" color={saved ? "destructive" : "foreground"} filled={saved} />
          </Pressable>
        </View>
        <View className="gap-1 px-1">
          <View className="flex-row items-center justify-between">
            <Text className="text-xl font-semibold tracking-tight">Sentinel Ridge Loop</Text>
            <View className="flex-row items-center gap-1">
              <Icon name="star" size="sm" color="foreground" filled />
              <Text className="text-[15px] font-medium tabular-nums">4.8</Text>
            </View>
          </View>
          <Text variant="muted">11.2 km · 940 m gain · Hard · Est. 5h 10m</Text>
        </View>
    </View>
  );
}
