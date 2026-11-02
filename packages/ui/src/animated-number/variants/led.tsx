import * as React from "react";
import { Text, View } from "react-native";
import {
  ACCENTS,
  Accent,
  AnimatedPressable,
  LightFall,
  cn,
  useHaptic,
  usePressAnimation,
  useTheme,
  type AccentName,
} from "@lumioui/core";
import { AnimatedNumber } from "../animated-number";

const SCENES: { name: string; hue: AccentName; target: number; note: string }[] = [
  { name: "Ember", hue: "coral", target: 23, note: "Warm and low for the evening" },
  { name: "Daylight", hue: "amber", target: 21, note: "Bright and steady for working" },
  { name: "Fresh", hue: "mint", target: 18, note: "Cool air for sleeping" },
];

function SceneButton({
  name,
  on,
  onPress,
}: {
  name: string;
  on: boolean;
  onPress: () => void;
}) {
  const press = usePressAnimation({ pressedScale: 0.95 });
  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      style={press.animatedStyle}
      className={cn("h-12 flex-1 items-center justify-center rounded-2xl", on ? "bg-primary" : "bg-secondary")}
      accessibilityRole="radio"
      accessibilityState={{ checked: on }}
      accessibilityLabel={`${name} scene`}
    >
      <Text className={cn("text-[15px] font-semibold", on ? "text-primary-foreground" : "text-secondary-foreground")}>
        {name}
      </Text>
    </AnimatedPressable>
  );
}

/** AnimatedNumberLed — a living-room thermostat. The room temperature is a
 *  dot-matrix LED figure that creeps toward the scene's target as the room
 *  heats or cools, one tenth at a time — only the LEDs that differ switch.
 *  Picking a scene re-lights the stage: the light from above glides over the
 *  chosen scene and takes its colour. */
export function AnimatedNumberLed() {
  const haptic = useHaptic();
  const { colors } = useTheme();
  const [pick, setPick] = React.useState(0);
  const [room, setRoom] = React.useState(19.4);
  const scene = SCENES[pick]!;

  // The room drifts a tenth toward the target every couple of seconds.
  React.useEffect(() => {
    const id = setInterval(() => {
      setRoom((t) => {
        const d = scene.target - t;
        if (Math.abs(d) < 0.05) return scene.target;
        return Math.round((t + Math.sign(d) * 0.1) * 10) / 10;
      });
    }, 1800);
    return () => clearInterval(id);
  }, [scene.target]);

  const heading = room < scene.target - 0.05 ? "Heating" : room > scene.target + 0.05 ? "Cooling" : "Holding";

  return (
    <Accent color={scene.hue} className="w-full">
      <View className="w-full overflow-hidden rounded-3xl bg-card">
        <LightFall color={ACCENTS[scene.hue].fill} at={(pick + 0.5) / SCENES.length} reach={0.85} />
        <View className="gap-6 p-6">
          <View className="flex-row items-center justify-between">
            <Text className="text-[15px] font-semibold text-foreground">Living room</Text>
            <Text className="text-sm text-muted-foreground">
              {heading} to {scene.target}°
            </Text>
          </View>

          <View className="items-center gap-3 py-6">
            <AnimatedNumber
              value={room}
              from={room}
              precision={1}
              format={(n) => `${n.toFixed(1)}°`}
              animation="roll"
              face="led"
              dot={8}
              color={colors.foreground}
              beatColor={colors.primaryText}
            />
            <Text className="text-sm text-muted-foreground">{scene.note}</Text>
          </View>

          <View className="w-full flex-row gap-2" accessibilityRole="radiogroup">
            {SCENES.map((s, i) => (
              <SceneButton
                key={s.name}
                name={s.name}
                on={i === pick}
                onPress={() => {
                  if (i === pick) return;
                  haptic.selection();
                  setPick(i);
                }}
              />
            ))}
          </View>
        </View>
      </View>
    </Accent>
  );
}
