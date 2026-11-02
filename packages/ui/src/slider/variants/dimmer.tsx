import * as React from "react";
import { Image, StyleSheet, View } from "react-native";
import { Accent, LightFall } from "@lumioui/core";
import { Slider } from "../slider";
import { Text } from "../../text/text";

const ROOM = {
  uri: "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80&auto=format&fit=crop",
};

/** SliderDimmer — a pendant dimmer over the room it lights. The value is the
 *  light: the room's shade lifts and the warm light-fall from the pendant
 *  reaches further down the scene as the thumb rises (§5c rule 7). */
export function SliderDimmer() {
  const [level, setLevel] = React.useState(60);
  const v = level / 100;
  return (
    <Accent color="amber" scheme="dark" className="w-full">
      <View className="h-[440px] w-full overflow-hidden rounded-3xl bg-background">
        <Image source={ROOM} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityIgnoresInvertColors />
        {/* The room's shade — lifts as the light comes up. */}
        <View pointerEvents="none" className="absolute inset-0 bg-black" style={{ opacity: 0.72 - 0.52 * v }} />
        <LightFall reach={0.15 + 0.85 * v} strength={0.12 + 0.38 * v} />

        <View className="absolute inset-x-0 bottom-0 gap-4 p-5">
          <View className="flex-row items-end justify-between">
            <View className="gap-1">
              <Text className="text-sm font-medium text-white/80">Living room · Pendant</Text>
              <Text className="text-4xl font-bold tabular-nums tracking-tight text-white">
                {level === 0 ? "Off" : `${level}%`}
              </Text>
            </View>
            <Text className="pb-1 text-sm text-white/80">2700K warm</Text>
          </View>
          <Slider
            value={level}
            onValueChange={setLevel}
            min={0}
            max={100}
            step={5}
            showValue
            formatValue={(n) => (n === 0 ? "Off" : `${n}%`)}
            flickerAtEnds
            accessibilityLabel="Pendant brightness"
          />
        </View>
      </View>
    </Accent>
  );
}
