import * as React from "react";
import { View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { LightFall, ease, timing, useTheme } from "@lumioui/core";
import { ActionSwap, ActionSwapText, type ActionSwapProps } from "../action-swap";
import { Icon, type IconName } from "../../icon/icon";
import { Text } from "../../text/text";

/** The climate stage retints like a room changing temperature — a calm crossfade. */
const RETINT = { duration: timing.normal.duration, easing: Easing.bezier(...ease.inOut) };

const MODES: ActionSwapProps["states"] = [{ label: "Heat" }, { label: "Cool" }, { label: "Auto" }];
const MODE_COPY = ["Heating to 22°", "Cooling to 20°", "Holding 20–23°"];

/** One light per mode, crossfaded — the stage is lit from above in the mode's hue. */
function ModeLight({ active, color }: { active: boolean; color: string }) {
  const lit = useSharedValue(active ? 1 : 0);
  React.useEffect(() => {
    lit.value = withTiming(active ? 1 : 0, RETINT);
  }, [active, lit]);
  const style = useAnimatedStyle(() => ({ opacity: lit.value }));
  return (
    <Animated.View pointerEvents="none" style={[{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }, style]}>
      <LightFall color={color} reach={0.9} />
    </Animated.View>
  );
}

const ROWS: {
  icon: IconName;
  tile: string;
  title: string;
  sub: string;
  variant: NonNullable<ActionSwapProps["variant"]>;
  states: ActionSwapProps["states"];
}[] = [
  {
    icon: "sun",
    tile: "bg-tint-amber",
    title: "Ceiling lights",
    sub: "3 bulbs · 80%",
    variant: "pill",
    states: [{ label: "On", accent: "primary" }, { label: "Off" }],
  },
  {
    icon: "grid",
    tile: "bg-tint-slate",
    title: "Blinds",
    sub: "Bay window",
    variant: "plain",
    states: [{ label: "Open" }, { label: "Closed" }],
  },
];

/** ActionSwapStyles — a smart-home room. The climate card is the hero: its
 *  mode cycles Heat → Cool → Auto and the new word switches on letter by
 *  letter in place, while the card's light from above retints with the
 *  mode. Quieter swaps (lights, blinds) sit in the list below. */
export function ActionSwapStyles() {
  const { colors } = useTheme();
  const [mode, setMode] = React.useState(0);
  const hues = [colors.tintOrange, colors.tintTeal, colors.tintGreen];
  return (
    <View className="w-full gap-3">
      <View className="gap-0.5 px-1">
        <Text className="text-2xl font-bold tracking-tight text-foreground">Living room</Text>
        <Text className="text-sm text-muted-foreground">3 devices · all responding</Text>
      </View>

      <View className="w-full overflow-hidden rounded-[28px] bg-card">
        {hues.map((hue, i) => (
          <ModeLight key={i} active={mode === i} color={hue} />
        ))}
        <View className="gap-5 p-5">
          <View className="flex-row items-center gap-2">
            <Icon name="flame" size="sm" color="mutedForeground" />
            <Text className="text-sm font-medium text-muted-foreground">Thermostat</Text>
          </View>
          <View className="flex-row items-end justify-between">
            <View className="gap-1">
              <Text className="text-6xl font-semibold tabular-nums tracking-tight text-foreground">21°</Text>
              <ActionSwapText value={String(mode)} mode="blur" className="text-[15px] text-muted-foreground">
                {MODE_COPY[mode] ?? ""}
              </ActionSwapText>
            </View>
            <ActionSwap
              states={MODES}
              value={mode}
              onStateChange={setMode}
              mode="cascade"
              light
              variant="outline"
              accessibilityLabelPrefix="Climate mode:"
              className="min-w-[96px] bg-card px-5"
            />
          </View>
        </View>
      </View>

      <View className="w-full rounded-2xl bg-card">
        {ROWS.map((r, i) => (
          <View key={r.title} className="flex-row items-center gap-3 pl-4 pr-3">
            <View className={`h-8 w-8 items-center justify-center rounded-lg ${r.tile}`}>
              <Icon name={r.icon} size="sm" color="#FFFFFF" />
            </View>
            <View className={`flex-1 flex-row items-center gap-3 py-3 ${i > 0 ? "border-t border-border" : ""}`}>
              <View className="flex-1">
                <Text className="text-base font-medium text-foreground">{r.title}</Text>
                <Text className="text-sm text-muted-foreground" numberOfLines={1}>
                  {r.sub}
                </Text>
              </View>
              <ActionSwap
                variant={r.variant}
                states={r.states}
                accessibilityLabelPrefix={`${r.title}:`}
                className="min-w-[84px] px-4"
              />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
