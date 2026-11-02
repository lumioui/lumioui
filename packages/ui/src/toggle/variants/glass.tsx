import * as React from "react";
import { Image, StyleSheet, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { LightPool, ease, tempo, timing } from "@lumioui/core";
import { Toggle } from "../toggle";
import { Icon, type IconName } from "../../icon/icon";
import { Text } from "../../text/text";

const PHOTO =
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80&auto=format&fit=crop";

/** Night mode lowers the live frame to this brightness — the scene dims as
 *  the sensor settles into a long exposure. */
const NIGHT_FRAME = 0.85;
/** The flash fires one pool of light from the top edge, held this long. */
const FLASH_HOLD = tempo.roll;

/** ToggleGlass — glass pill toggles as camera viewfinder controls floating
 *  over the live frame. Each pill switches on from where it was pressed, and
 *  the frame answers: Night dims the scene, Flash fires one pool of light
 *  down from the top edge. The mode line reports what the next shot uses. */
export function ToggleGlass() {
  const [flash, setFlash] = React.useState(false);
  const [night, setNight] = React.useState(true);
  const [live, setLive] = React.useState(true);
  const [firing, setFiring] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const frame = useSharedValue(night ? NIGHT_FRAME : 1);
  React.useEffect(() => {
    frame.value = withTiming(night ? NIGHT_FRAME : 1, { ...timing.slow, easing: Easing.bezier(...ease.inOut) });
  }, [night, frame]);
  const frameStyle = useAnimatedStyle(() => ({ opacity: frame.value }));

  const onFlash = (on: boolean) => {
    setFlash(on);
    if (!on) return;
    setFiring(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setFiring(false), FLASH_HOLD);
  };

  const mode = [night && "Night 3s", live && "Live", flash && "Flash"].filter(Boolean).join(" · ") || "Photo";
  const icons = (name: IconName) => ({
    icon: <Icon name={name} size="sm" color="foreground" />,
    iconOn: <Icon name={name} size="sm" color="primaryForeground" />,
  });
  return (
    <View className="relative h-[460px] w-full overflow-hidden rounded-3xl bg-black">
      <Animated.View style={[StyleSheet.absoluteFill, frameStyle]}>
        <Image
          source={{ uri: PHOTO }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
      </Animated.View>
      <LightPool on={firing} color="#FFFFFF" size={520} strength={0.5} className="absolute -top-64 self-center" />
      <View className="absolute inset-x-4 top-4 flex-row flex-wrap gap-2">
        <Toggle glass style="button" pressed={flash} onPressedChange={onFlash} {...icons("zap")}>
          Flash
        </Toggle>
        <Toggle glass style="button" pressed={night} onPressedChange={setNight} {...icons("moon")}>
          Night
        </Toggle>
        <Toggle glass style="button" pressed={live} onPressedChange={setLive} {...icons("film")}>
          Live
        </Toggle>
      </View>
      <View className="absolute inset-x-0 bottom-8 items-center gap-4">
        <View className="rounded-full bg-black/50 px-3 py-1" accessibilityLiveRegion="polite">
          <Text className="text-[13px] font-medium text-white">{mode}</Text>
        </View>
        <View className="h-[72px] w-[72px] items-center justify-center rounded-full border-4 border-white">
          <View className="h-14 w-14 rounded-full bg-white" />
        </View>
      </View>
    </View>
  );
}
