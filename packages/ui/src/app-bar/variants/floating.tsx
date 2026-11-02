import * as React from "react";
import { Image, View } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import { Accent } from "@lumioui/core";
import { AppBar } from "../app-bar";
import { Text } from "../../text/text";

const PHOTO =
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80&auto=format&fit=crop";
/** The trail name moves into the capsule once the hero heading has scrolled under it. */
const TITLE_AT = 200;

const STATS: [string, string][] = [
  ["Distance", "11.4 km"],
  ["Climb", "620 m"],
  ["Time", "4h 10m"],
];

/** AppBarFloating — a hiking-trail detail screen. The floating capsule is
 *  clear over the photo and sharpens as the page scrolls under it; the trail
 *  name swaps into it once the heading has gone. Saving the trail fills the
 *  heart and holds an accent wash on the button. */
export function AppBarFloating() {
  const [saved, setSaved] = React.useState(false);
  const [titled, setTitled] = React.useState(false);
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });
  // Only the threshold crossing reaches React — not every scroll frame.
  useAnimatedReaction(
    () => scrollY.value > TITLE_AT,
    (past, prev) => {
      if (past !== prev) runOnJS(setTitled)(past);
    }
  );
  return (
    <Accent color="green" className="w-full">
      <View className="relative h-[480px] w-full overflow-hidden rounded-3xl bg-background">
        <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false}>
          <Image
            source={{ uri: PHOTO }}
            style={{ width: "100%", height: 280 }}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
          <View className="-mt-6 gap-5 rounded-t-3xl bg-background px-5 pb-10 pt-6">
            <View className="gap-1">
              <Text className="text-[13px] font-semibold uppercase tracking-wide text-primary-text">
                Hard · Loop
              </Text>
              <Text className="text-3xl font-bold tracking-tight">Kestrel Ridge Loop</Text>
              <Text className="text-[15px] text-muted-foreground">
                {saved ? "Saved to Weekend hikes" : "Alder Valley Reserve · 4.8 from 312 walkers"}
              </Text>
            </View>
            <View className="flex-row gap-3">
              {STATS.map(([label, value]) => (
                <View key={label} className="flex-1 gap-1 rounded-2xl bg-card px-4 py-3">
                  <Text className="text-[13px] text-muted-foreground">{label}</Text>
                  <Text className="text-lg font-semibold tabular-nums">{value}</Text>
                </View>
              ))}
            </View>
            <Text className="text-[15px] leading-[22px] text-muted-foreground">
              A steady climb through larch forest to an open ridge with views over both lakes. The
              descent follows the old quarry track; poles help on the loose section after the
              second stile.
            </Text>
            <Text className="text-[15px] leading-[22px] text-muted-foreground">
              Water at the trailhead only. The ridge is exposed — turn back if the wind picks up
              past the cairn.
            </Text>
          </View>
        </Animated.ScrollView>
        <AppBar
          floating
          safeArea={false}
          scrollY={scrollY}
          className="absolute left-0 right-0 top-0 pt-3"
          showBack
          backLabel=""
          title={titled ? "Kestrel Ridge" : ""}
          actions={[
            {
              icon: "heart",
              active: saved,
              accessibilityLabel: saved ? "Remove from saved" : "Save trail",
              onPress: () => setSaved((v) => !v),
            },
            { icon: "share", accessibilityLabel: "Share trail", onPress: () => {} },
          ]}
        />
      </View>
    </Accent>
  );
}
