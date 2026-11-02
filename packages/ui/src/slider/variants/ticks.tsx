import * as React from "react";
import { View } from "react-native";
import { Slider } from "../slider";
import { Text } from "../../text/text";

const SIZES = [13, 15, 17, 19, 21, 24, 28];

/** SliderTicks — a "Text size" setting: seven stepped detents with tick marks, a
 *  small and large A as end caps, and the preview text resizing live. */
export function SliderTicks() {
  const [level, setLevel] = React.useState(2);
  const size = SIZES[level] ?? 17;
  return (
    <View className="w-full">
      <View className="w-full gap-4">
        <View className="min-h-[148px] justify-center rounded-3xl bg-card p-5">
          <Text style={{ fontSize: size, lineHeight: size * 1.3 }} className="font-medium">
            Apps that support Dynamic Type will adjust to your preferred reading size below.
          </Text>
        </View>

        <View className="flex-row items-center gap-3 rounded-2xl bg-card px-4 py-2">
          <Text className="text-sm font-medium">A</Text>
          <Slider
            value={level}
            onValueChange={setLevel}
            min={0}
            max={SIZES.length - 1}
            step={1}
            showTicks
            flickerAtEnds
            className="flex-1"
            accessibilityLabel="Text size"
          />
          <Text className="text-2xl font-medium">A</Text>
        </View>
        <Text variant="muted" className="px-4 tabular-nums">
          {size}pt · {level === 2 ? "Default" : level < 2 ? "Smaller" : "Larger"}
        </Text>
      </View>
    </View>
  );
}
