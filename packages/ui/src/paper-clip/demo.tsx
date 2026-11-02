import * as React from "react";
import { Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Accent, useTheme } from "@lumioui/core";
import { PaperClip } from "./paper-clip";
import { Polaroid } from "../polaroid/polaroid";
import { HANDWRITING, PAPER, paperShadow } from "../sticker/sticker";

const DAYS = [
  {
    tab: "Day 3",
    title: "Porto",
    stops: [
      ["09:40", "Train from Santa Apolónia"],
      ["13:15", "Lunch at Mercado do Bolhão"],
      ["17:30", "Walk the Dom Luís bridge"],
      ["19:00", "Sunset at Ribeira"],
    ],
  },
  {
    tab: "Day 4",
    title: "Douro Valley",
    stops: [
      ["08:30", "Pick-up at São Bento"],
      ["11:00", "Quinta tasting, Pinhão"],
      ["14:30", "River boat to Régua"],
      ["18:45", "Back in Porto"],
    ],
  },
] as const;

/** Rule under each stop — pale ink, since the note stays light in both schemes. */
const RULE = "rgba(43,41,38,0.12)";

/** Playground preview — a notes card for a trip: the day's plan clipped
 *  together with a photo, an index tab on the right. Tap the tab to flip to
 *  the next day. Not installed with the component. */
export function PaperClipDemo() {
  const { scheme } = useTheme();
  const [day, setDay] = React.useState(0);
  const d = DAYS[day]!;
  const paper = PAPER.stock[scheme];

  return (
    <Accent color="teal" className="w-full">
      <View className="w-full pt-2">
        <PaperClip
          tab={d.tab}
          tabTone="kraft"
          position="right"
          tilt={3}
          onPress={() => setDay((v) => (v + 1) % DAYS.length)}
          accessibilityLabel={`${d.tab}. Show the next day`}
        >
          <View className="w-full rounded-md p-5" style={[{ backgroundColor: paper }, paperShadow(false)]}>
            <Animated.View key={d.tab} entering={FadeIn.duration(160)}>
              <Text className="text-sm font-medium" style={{ color: PAPER.ink, opacity: 0.6 }}>
                Thu 16 Oct · itinerary
              </Text>
              <Text style={{ fontFamily: HANDWRITING, fontSize: 30, color: PAPER.ink }}>{d.title}</Text>
              <View className="mt-2">
                {d.stops.map(([time, what]) => (
                  <View key={time} className="h-11 flex-row items-center gap-3 border-b" style={{ borderColor: RULE }}>
                    <Text className="w-12 text-[13px] font-semibold tabular-nums" style={{ color: PAPER.ink, opacity: 0.6 }}>
                      {time}
                    </Text>
                    <Text numberOfLines={1} className="flex-1" style={{ fontFamily: HANDWRITING, fontSize: 17, color: PAPER.ink }}>
                      {what}
                    </Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          </View>
        </PaperClip>

        <View className="-mt-6 ml-6 flex-row">
          <PaperClip position="left">
            <Polaroid
              image={{ uri: "https://images.unsplash.com/photo-1513735492246-483525079686?w=800&q=80&auto=format&fit=crop" }}
              width={140}
              caption="the bridge!"
              tilt={-4}
            />
          </PaperClip>
        </View>
      </View>
    </Accent>
  );
}
