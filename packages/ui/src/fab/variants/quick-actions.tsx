import * as React from "react";
import { View } from "react-native";
import { Accent } from "@lumioui/core";
import { Fab } from "../fab";
import { Icon } from "../../icon/icon";
import { Text } from "../../text/text";
import { RollingText } from "../../animated-number/animated-number";

/** FabQuickActions — circular FABs as live-workout controls: a 56pt
 *  pause/resume flanked by 44pt lap and lock minis. Pause lights the hero
 *  disc (an inner ring pulses once, then holds lit while paused); the lap
 *  count rolls per digit; lock disables the other two. Red for fitness. */
export function FabQuickActions() {
  const [paused, setPaused] = React.useState(false);
  const [laps, setLaps] = React.useState(3);
  const [locked, setLocked] = React.useState(false);
  return (
    <Accent color="red" className="w-full">
      <View className="w-full gap-8 rounded-3xl bg-card px-5 py-6">
        <View className="flex-row items-center justify-between">
          <Text className="text-[17px] font-semibold">Outdoor run</Text>
          <View
            className="flex-row items-baseline"
            accessibilityLiveRegion="polite"
            accessibilityLabel={`${paused ? "Paused, " : ""}lap ${laps + 1}`}
          >
            {paused ? <Text className="text-[15px] font-medium text-primary-text">Paused · </Text> : null}
            <Text className="text-[15px] text-muted-foreground">Lap </Text>
            <RollingText text={String(laps + 1)} glyphClassName="text-[15px] text-muted-foreground tabular-nums" />
          </View>
        </View>

        <View className="items-center gap-1">
          <Text className="text-5xl font-semibold tracking-tight tabular-nums">5.42</Text>
          <Text variant="muted">kilometres</Text>
        </View>

        <View className="flex-row">
          {[
            ["32:18", "Time"],
            ["5'57\"", "Avg pace"],
            ["152", "Heart rate"],
          ].map(([v, l]) => (
            <View key={l} className="flex-1 items-center gap-1">
              <Text className="text-xl font-semibold tabular-nums">{v}</Text>
              <Text className="text-xs text-muted-foreground">{l}</Text>
            </View>
          ))}
        </View>

        <View className="flex-row items-center justify-center gap-8">
          <Fab
            position="none"
            size="sm"
            className="bg-secondary"
            haptic="light"
            disabled={locked}
            onPress={() => setLaps((n) => n + 1)}
            accessibilityLabel="Mark lap"
            icon={<Icon name="flag" size="sm" color="foreground" />}
          />
          <Fab
            position="none"
            disabled={locked}
            lit={paused}
            onPress={() => setPaused((p) => !p)}
            accessibilityLabel={paused ? "Resume run" : "Pause run"}
            icon={<Icon name={paused ? "play" : "pause"} size="md" color="primaryForeground" />}
          />
          <Fab
            position="none"
            size="sm"
            className={locked ? "bg-foreground" : "bg-secondary"}
            haptic="light"
            onPress={() => setLocked((l) => !l)}
            accessibilityLabel={locked ? "Unlock controls" : "Lock controls"}
            icon={<Icon name="lock" size="sm" color={locked ? "background" : "foreground"} />}
          />
        </View>
      </View>
    </Accent>
  );
}
