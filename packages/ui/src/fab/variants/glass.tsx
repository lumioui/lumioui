import * as React from "react";
import { Image, StyleSheet, View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { Fab } from "../fab";
import { Icon } from "../../icon/icon";
import { Text } from "../../text/text";

const PHOTO =
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80&auto=format&fit=crop";

/** FabGlass — a photo viewer: the save action floats as a glass disc
 *  over the image (glass earns its place on imagery). Tap to save; the
 *  bookmark fills and the caption confirms the album. */
export function FabGlass() {
  const [saved, setSaved] = React.useState(false);
  return (
    <View className="relative h-[460px] w-full overflow-hidden rounded-3xl bg-muted">
      <Image
        source={{ uri: PHOTO }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      />
      {/* Bottom scrim so the white caption reads on any photo. */}
      <Svg pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 180 }} width="100%" height={180}>
        <Defs>
          <LinearGradient id="fab-glass-scrim" x1="0" y1="0" x2="0" y2="1">
            <Stop offset={0} stopColor="#000" stopOpacity={0} />
            <Stop offset={1} stopColor="#000" stopOpacity={0.55} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#fab-glass-scrim)" />
      </Svg>
      <View className="absolute bottom-6 left-5 right-24">
        <Text className="text-xl font-semibold text-white">Lake trip, day three</Text>
        <Text className="text-sm text-white/80">
          {saved ? "Saved to Summer 2026" : "Shot by Elif Kaya · 2 days ago"}
        </Text>
      </View>
      <View className="absolute bottom-5 right-5">
        <Fab
          glass
          position="none"
          haptic="light"
          onPress={() => setSaved((s) => !s)}
          accessibilityLabel={saved ? "Remove from album" : "Save to album"}
          icon={<Icon name="bookmark" size="md" color="foreground" filled={saved} />}
        />
      </View>
    </View>
  );
}
