import * as React from "react";
import { Image, StyleSheet, View } from "react-native";
import { Slider } from "../slider";
import { Text } from "../../text/text";

const ART =
  "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&h=1000&fit=crop&q=70&auto=format";

/** SliderGlass — a glass lane + disc scrubber over album artwork. */
export function SliderGlass() {
  const [v, setV] = React.useState(38);
  const total = 222;
  const cur = Math.round((v / 100) * total);
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  return (
    <View className="relative h-[420px] w-full overflow-hidden rounded-2xl bg-muted">
      <Image source={{ uri: ART }} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityIgnoresInvertColors />
      <View className="absolute inset-x-0 bottom-0 gap-1 bg-black/40 px-5 pb-6 pt-4">
        <Text className="text-base font-semibold text-white">Night Drive</Text>
        <Text className="mb-2 text-sm text-white/90">Aurora Fields</Text>
        <Slider glass value={v} onValueChange={setV} min={0} max={100} />
        <View className="flex-row justify-between">
          <Text className="text-xs tabular-nums text-white">{fmt(cur)}</Text>
          <Text className="text-xs tabular-nums text-white">{fmt(total)}</Text>
        </View>
      </View>
    </View>
  );
}
