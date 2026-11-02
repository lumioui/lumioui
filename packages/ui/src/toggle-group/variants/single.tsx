import * as React from "react";
import { View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { Accent, ease, timing, useTheme } from "@lumioui/core";
import { ToggleGroup, ToggleGroupItem } from "../toggle-group";
import { Text } from "../../text/text";

type Layer = "standard" | "transit" | "satellite";
const LAYERS: { value: Layer; label: string }[] = [
  { value: "standard", label: "Standard" },
  { value: "transit", label: "Transit" },
  { value: "satellite", label: "Satellite" },
];
const NOTES: Record<Layer, string> = {
  standard: "Streets and places",
  transit: "Lines 4, 11 and the harbour ferry",
  satellite: "Imagery from 9 days ago",
};

// One street plan shared by every layer, so a swap changes the light, not the place.
const ROADS = "M-10 70 C 80 60 140 90 400 80 M-10 150 L 400 140 M 90 -10 L 120 240 M 250 -10 C 240 80 260 150 230 240";
const LANES = "M-10 110 L 400 105 M 170 -10 L 180 240 M 320 -10 L 330 240";
const WATER = "M-10 190 C 80 170 160 200 240 185 C 300 175 360 190 400 180 L 400 240 L -10 240 Z";

/** One map layer, drawn in react-native-svg. It dims out and ignites in place. */
function MapLayer({ layer, on }: { layer: Layer; on: boolean }) {
  const { colors, scheme } = useTheme();
  const lit = useSharedValue(on ? 1 : 0);
  React.useEffect(() => {
    lit.value = on
      ? withTiming(1, { ...timing.fast, easing: Easing.bezier(...ease.out) })
      : withTiming(0, { ...timing.recede, easing: Easing.bezier(...ease.in) });
  }, [on, lit]);
  const style = useAnimatedStyle(() => ({ opacity: lit.value }));
  const dark = scheme === "dark";
  const sat = layer === "satellite";
  // Map paper and imagery tones are physical colours, not theme tokens.
  const land = sat ? (dark ? "#1F2A1C" : "#4E6340") : dark ? "#1C1C20" : "#ECEAE4";
  const water = sat ? "#1E3A4C" : dark ? "#18283A" : "#C9DDEC";
  const road = sat ? "rgba(255,255,255,0.35)" : dark ? "#34343A" : "#FFFFFF";
  return (
    <Animated.View pointerEvents="none" className="absolute inset-0" style={style}>
      <Svg width="100%" height="100%" viewBox="0 0 390 230" preserveAspectRatio="xMidYMid slice">
        <Rect x="0" y="0" width="390" height="230" fill={land} />
        {sat ? (
          <>
            <Path d="M 20 20 L 80 30 L 70 60 L 15 50 Z M 200 20 L 240 15 L 245 60 L 195 55 Z" fill="#5C7650" />
            <Path d="M 280 95 L 360 90 L 365 130 L 285 132 Z M 30 95 L 85 92 L 88 135 L 35 138 Z" fill="#6B5E48" />
          </>
        ) : (
          <Path d="M 200 20 L 240 15 L 245 60 L 195 55 Z" fill={dark ? "#1E2A20" : "#D6E5CF"} />
        )}
        <Path d={WATER} fill={water} />
        <Path d={LANES} stroke={road} strokeWidth={sat ? 2 : 4} fill="none" />
        <Path d={ROADS} stroke={road} strokeWidth={sat ? 3 : 8} fill="none" strokeLinecap="round" />
        {layer === "transit" ? (
          <>
            <Path d="M -10 150 L 400 140" stroke={colors.primary} strokeWidth={4} fill="none" />
            <Path d="M 90 -10 L 120 240" stroke={colors.warning} strokeWidth={4} fill="none" />
            <Path d="M 60 205 C 160 190 260 215 400 200" stroke={colors.primary} strokeWidth={2} strokeDasharray="6 6" fill="none" />
            {[
              [115, 146],
              [235, 143],
              [104, 60],
            ].map(([x, y]) => (
              <Circle key={`${x}-${y}`} cx={x} cy={y} r={6} fill={colors.card} stroke={colors.foreground} strokeWidth={2} />
            ))}
          </>
        ) : null}
        <Circle cx={196} cy={112} r={9} fill={colors.primary} stroke={colors.card} strokeWidth={3} />
      </Svg>
    </Animated.View>
  );
}

/** ToggleGroupSingle — a map's layer picker. One ink indicator glides
 *  between Standard, Transit and Satellite, each label's ink following it,
 *  and the map above swaps layers in place. */
export function ToggleGroupSingle() {
  const [layer, setLayer] = React.useState<Layer>("transit");
  return (
    <Accent color="teal" className="w-full">
      <View className="w-full gap-4 rounded-3xl bg-card p-4">
        <View className="h-56 w-full overflow-hidden rounded-2xl bg-muted" accessibilityRole="image" accessibilityLabel={`Map of Wren Harbour, ${layer} layer`}>
          {LAYERS.map((l) => (
            <MapLayer key={l.value} layer={l.value} on={l.value === layer} />
          ))}
        </View>
        <View className="gap-1 px-1">
          <Text className="text-[22px] font-bold tracking-tight">Wren Harbour</Text>
          <Text variant="muted">{NOTES[layer]}</Text>
        </View>
        <ToggleGroup
          type="single"
          value={layer}
          // A map always shows one layer — a tap on the lit one keeps it.
          onValueChange={(v) => typeof v === "string" && v && setLayer(v as Layer)}
          accessibilityLabel="Map layer"
          className="w-full flex-nowrap"
        >
          {LAYERS.map((l) => (
            <ToggleGroupItem key={l.value} value={l.value} className="flex-1 px-0">
              {l.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </View>
    </Accent>
  );
}
