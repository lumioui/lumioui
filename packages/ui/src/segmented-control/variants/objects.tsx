import * as React from "react";
import { View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, type SharedValue } from "react-native-reanimated";
import { Accent, useReducedMotion } from "@lumioui/core";
import { SegmentedControl } from "../segmented-control";
import { Button } from "../../button/button";
import { Icon } from "../../icon/icon";
import { Text } from "../../text/text";

type Route = { minutes: number; via: string; note: string };
type Mode = { value: string; best: Route; other: Route };

const MODES: Mode[] = [
  {
    value: "drive",
    best: { minutes: 18, via: "via I-280 N", note: "Light traffic" },
    other: { minutes: 23, via: "via Alemany Blvd", note: "No tolls" },
  },
  {
    value: "transit",
    best: { minutes: 34, via: "J Church to 24th St BART", note: "Leaves in 4 min, $2.50" },
    other: { minutes: 41, via: "Bus 49", note: "Every 8 minutes" },
  },
  {
    value: "walk",
    best: { minutes: 72, via: "via Valencia St", note: "Mostly flat, 5.6 km" },
    other: { minutes: 26, via: "Bay Wheels bike", note: "Dock on Market St" },
  },
];

/** Content follows the thumb: at most 6pt of travel, in the direction the
 *  thumb is moving (directional travel only, per the swap rule). */
const TRAVEL = 6;

const duration = (m: number) => `${m} min`;
const arriveAt = (m: number) =>
  new Date(Date.now() + m * 60_000).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

/** One mode's routes. Its brightness and offset are a function of the
 *  thumb's position on the UI thread, so a drag between two modes blends
 *  them 1:1 with the finger and a tap lands with the thumb. */
function ModeRoutes({ mode, slot, progress, active }: { mode: Mode; slot: number; progress: SharedValue<number>; active: boolean }) {
  const reduced = useReducedMotion();
  const style = useAnimatedStyle(() => {
    const d = slot - progress.value;
    return {
      // Steep falloff: the leaving set is dark by the midpoint and the
      // arriving one ignites after it, so two layouts never overlap legibly.
      opacity: Math.max(0, 1 - 2 * Math.abs(d)),
      transform: [{ translateX: reduced ? 0 : Math.max(-1, Math.min(1, d)) * TRAVEL }],
    };
  });
  return (
    <Animated.View
      style={style}
      className="absolute inset-0"
      pointerEvents={active ? "auto" : "none"}
      accessibilityElementsHidden={!active}
      importantForAccessibility={active ? "auto" : "no-hide-descendants"}
    >
      <View className="flex-row items-center gap-3 pb-3">
        <View className="flex-1 gap-1">
          <View className="flex-row items-baseline gap-2">
            <Text className="text-[36px] font-semibold tracking-tight tabular-nums">{duration(mode.best.minutes)}</Text>
            <Text variant="muted" className="text-[15px] tabular-nums">Arrive {arriveAt(mode.best.minutes)}</Text>
          </View>
          <Text className="text-[15px]">{mode.best.via}</Text>
          <Text variant="muted" className="text-[13px]">{mode.best.note}</Text>
        </View>
        <Button size="md" className="min-w-[72px]" accessibilityLabel={`Start ${mode.value} directions`}>
          Go
        </Button>
      </View>
      <View className="flex-row items-center gap-3 border-t border-border pt-3">
        <View className="flex-1 gap-1">
          <Text className="text-[15px]">{mode.other.via}</Text>
          <Text variant="muted" className="text-[13px]">{mode.other.note}</Text>
        </View>
        <Text className="text-[17px] font-semibold tabular-nums">{duration(mode.other.minutes)}</Text>
      </View>
    </Animated.View>
  );
}

/** SegmentedObjects — choosing how to get to the Ferry Building. The thumb
 *  can be dragged, and the routes below ride it: as the thumb passes from
 *  Drive to Transit the two sets of routes blend with your finger, then the
 *  chosen one lands with the thumb. Teal for travel, on the Go button only. */
export function SegmentedObjects() {
  const [mode, setMode] = React.useState("drive");
  const progress = useSharedValue(0);
  return (
    <Accent color="teal" className="w-full">
      <View className="w-full gap-5 rounded-[20px] bg-card p-5">
        <View className="gap-1">
          <Text className="text-[22px] font-bold tracking-tight">Ferry Building</Text>
          <Text variant="muted" className="text-[15px]">1 Ferry Plaza, San Francisco</Text>
        </View>
        <SegmentedControl
          options={[
            { value: "drive", label: "Drive", icon: <Icon name="car" size="sm" color="mutedForeground" /> },
            { value: "transit", label: "Transit", icon: <Icon name="tram-front" size="sm" color="mutedForeground" /> },
            { value: "walk", label: "Walk", icon: <Icon name="footprints" size="sm" color="mutedForeground" /> },
          ]}
          value={mode}
          onValueChange={setMode}
          draggable
          progress={progress}
        />
        {/* All three modes share one place; the thumb decides which is lit. */}
        <View className="h-[168px] w-full">
          {MODES.map((m, i) => (
            <ModeRoutes key={m.value} mode={m} slot={i} progress={progress} active={mode === m.value} />
          ))}
        </View>
      </View>
    </Accent>
  );
}
