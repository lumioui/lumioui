import * as React from "react";
import { Image, StyleSheet, View, ScrollView } from "react-native";
import { Chip } from "../chip";
import { Icon } from "../../icon/icon";
import { Text } from "../../text/text";

const PHOTO =
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=1000&fit=crop&q=70&auto=format";

/** `label` is the chip (short, so all four fit one row with the 16pt
 *  gutters); `noun` is what the info card counts. */
type Layer = { label: string; noun: string; count: number; nearest: string };
const TRAILS: Layer = { label: "Trails", noun: "trails", count: 42, nearest: "Wildwood Loop · 6.4 mi" };
const LAYERS: Layer[] = [
  TRAILS,
  { label: "Camps", noun: "campsites", count: 9, nearest: "Cedar Flat · 2.1 mi away" },
  { label: "Falls", noun: "waterfalls", count: 6, nearest: "Bridal Veil Falls · 0.8 mi" },
  { label: "Views", noun: "viewpoints", count: 14, nearest: "Pittock Overlook · 3.2 mi" },
];

/** ChipGlass — glass map-layer chips floating over the trail photo they
 *  filter (glass only because it sits on imagery). The selected chip goes
 *  solid ink; the info card below answers the tap. */
export function ChipGlass() {
  const [sel, setSel] = React.useState("Trails");
  const layer = LAYERS.find((l) => l.label === sel) ?? TRAILS;
  return (
    <View className="relative h-[460px] w-full overflow-hidden rounded-3xl bg-muted">
      <Image
        source={{ uri: PHOTO }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      />
      <View className="absolute inset-x-0 top-4">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        >
          {LAYERS.map((l) => (
            <Chip
              key={l.label}
              variant="glass"
              selected={sel === l.label}
              onPress={() => setSel(l.label)}
            >
              {l.label}
            </Chip>
          ))}
        </ScrollView>
      </View>
      <View className="absolute inset-x-4 bottom-4 flex-row items-center gap-3 rounded-2xl bg-card p-4">
        <View className="h-11 w-11 items-center justify-center rounded-full bg-tint-green">
          <Icon name="footprints" size="sm" color="#FFFFFF" />
        </View>
        <View className="flex-1">
          <Text className="text-[15px] font-semibold">
            {layer.count} {layer.noun} in Forest Park
          </Text>
          <Text variant="muted" numberOfLines={1}>Nearest: {layer.nearest}</Text>
        </View>
      </View>
    </View>
  );
}
