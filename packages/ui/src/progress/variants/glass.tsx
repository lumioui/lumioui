import * as React from "react";
import { Image, StyleSheet, View, Text } from "react-native";
import { Progress } from "../progress";

const PHOTO =
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80&auto=format&fit=crop";

/** ProgressGlass — a frosted lane over the photo being posted, the way a
 *  social app shows an upload riding over the media itself. */
export function ProgressGlass() {
  const [v, setV] = React.useState(12);
  React.useEffect(() => {
    const t = setInterval(() => setV((x) => (x >= 96 ? 12 : x + 7)), 900);
    return () => clearInterval(t);
  }, []);
  const sent = Math.max(1, Math.round((v / 100) * 18));
  return (
    <View className="relative h-[440px] w-full overflow-hidden rounded-2xl bg-muted">
      <Image source={{ uri: PHOTO }} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityIgnoresInvertColors />
      <View className="absolute inset-x-0 bottom-0 gap-3 bg-black/40 px-5 pb-6 pt-5">
        <View className="flex-row items-baseline justify-between">
          <View>
            <Text className="text-[17px] font-semibold text-white">Posting to Ridge Weekend</Text>
            <Text className="text-sm text-white/80 tabular-nums">{sent} of 18 photos</Text>
          </View>
          <Text className="text-[17px] font-semibold tabular-nums text-white">{v}%</Text>
        </View>
        {/* Fill pinned white: it rides a dark scrim over the photo in both
            app schemes, where ink primary turns into a near-black bar. */}
        <Progress glass value={v} indicatorClassName="bg-white" />
      </View>
    </View>
  );
}
