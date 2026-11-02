import * as React from "react";
import { Image, Pressable, StyleSheet, View, type GestureResponderEvent, type LayoutChangeEvent } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { ease, spring, timing, useHaptic, useReducedMotion } from "@lumioui/core";
import { Text } from "../text";
import { Icon, type IconName } from "../icon";
import { Glass, GlassContainer } from "./glass";

const ART = "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80&auto=format&fit=crop";

/** Track length in seconds (7:00). */
const LENGTH = 420;

const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/** One glyph that swaps in place: the outgoing dims to 0.96 while the
 *  incoming ignites (timing.fast, spring.swap). No travel. */
function SwapGlyph({ on, off, onName, size }: { on: boolean; off: IconName; onName: IconName; size: "md" | "xl" }) {
  const reduce = useReducedMotion();
  const t = useSharedValue(on ? 1 : 0);
  const s = useSharedValue(1);
  const shown = React.useRef(on);
  React.useEffect(() => {
    if (shown.current === on) return;
    shown.current = on;
    t.value = withTiming(on ? 1 : 0, { duration: timing.fast.duration, easing: Easing.bezier(...ease.out) });
    if (reduce) return;
    s.value = 0.96;
    s.value = withSpring(1, spring.swap);
  }, [on, reduce, t, s]);
  const offStyle = useAnimatedStyle(() => ({ opacity: 1 - t.value, transform: [{ scale: s.value }] }));
  const onStyle = useAnimatedStyle(() => ({ opacity: t.value, transform: [{ scale: s.value }] }));
  return (
    <View className="items-center justify-center">
      <Animated.View style={offStyle}>
        <Icon name={off} size={size} color="foreground" />
      </Animated.View>
      <Animated.View style={onStyle} className="absolute">
        <Icon name={onName} size={size} color="foreground" />
      </Animated.View>
    </View>
  );
}

/** Playground preview — a live-set player: the concert photo is the
 *  world, every control is glass chrome floating over it. Light follows
 *  input: press a top disc and its highlight gathers under your finger.
 *  Play/pause is one glyph that swaps in place, and "Add to library" keeps
 *  the check. The grouped
 *  discs melt into one union slab (native union on iOS 26+, a shared
 *  refractive slab on web). Not installed with the component. */
export function GlassDemo() {
  const haptic = useHaptic();
  const [playing, setPlaying] = React.useState(true);
  const [saved, setSaved] = React.useState(false);
  const [sec, setSec] = React.useState(171);
  const pos = useSharedValue(171 / LENGTH);
  const barW = React.useRef(0);

  // The playhead writes the shared value directly; React hears whole seconds only.
  const scrub = (e: GestureResponderEvent) => {
    if (!barW.current) return;
    const p = Math.min(1, Math.max(0, e.nativeEvent.locationX / barW.current));
    pos.value = p;
    const next = Math.round(p * LENGTH);
    if (next !== sec) setSec(next);
  };
  const fillStyle = useAnimatedStyle(() => ({ transform: [{ scaleX: pos.value }] }));

  return (
    <View className="h-[520px] w-full overflow-hidden rounded-[20px] bg-muted">
      <Image source={{ uri: ART }} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityIgnoresInvertColors />

      <View pointerEvents="box-none" className="flex-row items-center justify-between px-4 pt-4">
        <Glass interactive specular className="h-11 w-11 overflow-hidden rounded-full">
          <Pressable accessibilityRole="button" accessibilityLabel="Close player" className="h-11 w-11 items-center justify-center">
            <Icon name="chevron-down" size="md" color="foreground" />
          </Pressable>
        </Glass>
        <GlassContainer spacing={12} effect="regular" className="flex-row items-center rounded-full">
          <Glass interactive specular className="h-11 w-11 overflow-hidden rounded-full">
            <Pressable accessibilityRole="button" accessibilityLabel="Play on speaker" className="h-11 w-11 items-center justify-center">
              <Icon name="volume-2" size="sm" color="foreground" />
            </Pressable>
          </Glass>
          <Glass interactive specular className="h-11 w-11 overflow-hidden rounded-full">
            <Pressable accessibilityRole="button" accessibilityLabel="More options" className="h-11 w-11 items-center justify-center">
              <Icon name="more-horizontal" size="sm" color="foreground" />
            </Pressable>
          </Glass>
        </GlassContainer>
      </View>

      <View className="flex-1" />

      <View className="mx-3 mb-3 overflow-hidden rounded-[28px]">
        <Glass effect="regular" sheen={0.5} className="absolute inset-0 rounded-[28px]" pointerEvents="none" />
        <View className="gap-4 p-5">
          <View className="flex-row items-center gap-3">
            <View className="flex-1">
              <Text className="text-[17px] font-semibold text-foreground" numberOfLines={1}>
                Night Shift (Live)
              </Text>
              <Text className="text-[15px] text-muted-foreground" numberOfLines={1}>
                Halden · Kesselhaus, Brennholm
              </Text>
            </View>
            <Pressable
              onPress={() => {
                const next = !saved;
                setSaved(next);
                if (next) {
                  haptic.success();
                } else {
                  haptic.selection();
                }
              }}
              accessibilityRole="button"
              accessibilityLabel={saved ? "Remove from library" : "Add to library"}
              accessibilityState={{ selected: saved }}
              className="h-11 w-11 items-center justify-center"
            >
              <SwapGlyph on={saved} off="plus" onName="check-circle" size="md" />
            </Pressable>
          </View>

          <View className="gap-2">
            <View
              accessible
              accessibilityRole="adjustable"
              accessibilityLabel="Playback position"
              accessibilityValue={{ text: `${clock(sec)} of ${clock(LENGTH)}` }}
              onLayout={(e: LayoutChangeEvent) => {
                barW.current = e.nativeEvent.layout.width;
              }}
              onStartShouldSetResponder={() => true}
              onMoveShouldSetResponder={() => true}
              onResponderTerminationRequest={() => false}
              onResponderGrant={scrub}
              onResponderMove={scrub}
              className="h-6 justify-center"
            >
              <View pointerEvents="none" className="h-1 w-full overflow-hidden rounded-full bg-foreground/15">
                <Animated.View style={[{ transformOrigin: "left" }, fillStyle]} className="h-1 w-full rounded-full bg-foreground" />
              </View>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-xs tabular-nums text-muted-foreground">{clock(sec)}</Text>
              <Text className="text-xs tabular-nums text-muted-foreground">−{clock(LENGTH - sec)}</Text>
            </View>
          </View>

          <View className="flex-row items-center justify-center gap-8">
            <Pressable accessibilityRole="button" accessibilityLabel="Back 15 seconds" className="h-12 w-12 items-center justify-center">
              <Icon name="skip-back" size="lg" color="foreground" />
            </Pressable>
            <Pressable
              onPress={() => {
                haptic.light();
                setPlaying((v) => !v);
              }}
              accessibilityRole="button"
              accessibilityLabel={playing ? "Pause" : "Play"}
              className="h-16 w-16 items-center justify-center"
            >
              <SwapGlyph on={playing} off="play" onName="pause" size="xl" />
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Forward 15 seconds" className="h-12 w-12 items-center justify-center">
              <Icon name="skip-forward" size="lg" color="foreground" />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}
