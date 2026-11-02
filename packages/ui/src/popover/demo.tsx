import * as React from "react";
import { View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withSequence, withTiming } from "react-native-reanimated";
import { Accent, ROW_STAGGER, Sheen, ease, tempo, timing, useTheme } from "@lumioui/core";
import { Popover } from "./popover";
import { ActionSwapText } from "../action-swap/action-swap";
import { Button } from "../button/button";
import { Icon } from "../icon/icon";
import { Text } from "../text/text";

/** The new seat holds in accent ink this long before settling (act, hold, resolve). */
const HOLD = tempo.roll;

/** One pass of accent light across the stub — the pass is paper, so the light is the hue. */
function StubSheen({ run }: { run: number }) {
  const { colors } = useTheme();
  return <Sheen run={run} color={colors.primary} strength={0.22} />;
}

function Field({ label, value, align = "left" }: { label: string; value: string; align?: "left" | "right" }) {
  return (
    <View className={align === "right" ? "items-end" : undefined}>
      <Text variant="muted">{label}</Text>
      <Text className="text-[17px] font-semibold tabular-nums">{value}</Text>
    </View>
  );
}

/** Playground preview — a boarding pass where the seat is a lit trigger:
 *  it lights first, then the panel grows and its content switches on. Taking
 *  the upgrade dims the panel away and the seat becomes its result in place —
 *  "23F" dims while "11A" ignites, one sheen crosses the stub, the group
 *  swaps a beat later, and the new seat holds in accent ink before settling.
 *  Travel → teal. Not installed with the component. */
export function PopoverDemo() {
  const [open, setOpen] = React.useState(false);
  const [seat, setSeat] = React.useState("23F");
  const [group, setGroup] = React.useState("5");
  const [sheen, setSheen] = React.useState(0);
  const upgraded = seat === "11A";
  const timers = React.useRef<ReturnType<typeof setTimeout>[]>([]);
  React.useEffect(() => () => timers.current.forEach(clearTimeout), []);
  // Accent ink on the seat: 1 while the change holds, then settles to ink.
  const accent = useSharedValue(0);
  const accentStyle = useAnimatedStyle(() => ({ opacity: accent.value }));
  const inkStyle = useAnimatedStyle(() => ({ opacity: 1 - accent.value }));

  const commit = (next: string, nextGroup: string) => {
    setOpen(false);
    timers.current.forEach(clearTimeout);
    // The panel dims first (timing.recede), then the trigger performs.
    timers.current = [
      setTimeout(() => {
        setSeat(next);
        setSheen((n) => n + 1);
        accent.value = withSequence(
          withTiming(1, timing.fast),
          withDelay(HOLD, withTiming(0, { ...timing.normal, easing: Easing.bezier(...ease.inOut) }))
        );
      }, timing.recede.duration),
      setTimeout(() => setGroup(nextGroup), timing.recede.duration + ROW_STAGGER),
    ];
  };

  return (
    <Accent color="teal" className="w-full">
      <View className="w-full overflow-hidden rounded-3xl bg-card">
        <View className="gap-5 p-5">
          <View className="flex-row items-center justify-between">
            <Text className="text-[15px] font-semibold">Alder Air · AL 218</Text>
            <Text variant="muted">Sat, Oct 18</Text>
          </View>

          <View className="flex-row items-end justify-between">
            <View>
              <Text className="text-4xl font-semibold tracking-tight">SEA</Text>
              <Text variant="muted">Seattle · 7:05 AM</Text>
            </View>
            <View className="items-center pb-6">
              <Icon name="plane" size="md" color="mutedForeground" />
            </View>
            <View className="items-end">
              <Text className="text-4xl font-semibold tracking-tight">AUS</Text>
              <Text variant="muted">Austin · 1:22 PM</Text>
            </View>
          </View>
        </View>

        {/* The stub — the seat change lands here, so the sheen crosses it. */}
        <View className="overflow-hidden">
          <View className="flex-row items-center justify-between border-t border-dashed border-border px-5 py-4">
            <Field label="Gate" value="N14" />
            <Field label="Boards" value="6:25 AM" />
            <Popover open={open} onOpenChange={setOpen}>
              <Popover.Trigger lit accessibilityLabel={`Seat ${seat}, show seat details`}>
                <View className="items-end">
                  <Text variant="muted">Seat</Text>
                  <View className="flex-row items-center gap-1">
                    <View>
                      <Animated.View style={inkStyle}>
                        <ActionSwapText value={seat} className="text-[17px] font-semibold tabular-nums text-foreground">
                          {seat}
                        </ActionSwapText>
                      </Animated.View>
                      <Animated.View pointerEvents="none" className="absolute inset-0" style={accentStyle}>
                        <ActionSwapText value={seat} className="text-[17px] font-semibold tabular-nums text-primary-text">
                          {seat}
                        </ActionSwapText>
                      </Animated.View>
                    </View>
                    <Icon name="chevron-down" size="sm" color="mutedForeground" />
                  </View>
                </View>
              </Popover.Trigger>
              <Popover.Content align="end">
                {/* Overlays portal out of the tree — re-scope the accent inside. */}
                <Accent color="teal">
                  <View className="gap-3">
                    <View className="gap-1">
                      <Text className="text-[17px] font-semibold">
                        {upgraded ? "Seat 11A · Extra legroom" : "Seat 23F · Window"}
                      </Text>
                      <Text variant="muted">
                        {upgraded ? "34 in pitch · boards in group 2" : "31 in pitch · next to the wing, quieter cabin"}
                      </Text>
                    </View>
                    {upgraded ? (
                      <Button size="sm" variant="secondary" onPress={() => commit("23F", "5")}>
                        Switch back to 23F
                      </Button>
                    ) : (
                      <Button size="sm" onPress={() => commit("11A", "2")}>
                        Move to 11A for $39
                      </Button>
                    )}
                  </View>
                </Accent>
              </Popover.Content>
            </Popover>
          </View>
          <StubSheen run={sheen} />
        </View>

        <View className="flex-row items-center gap-3 bg-secondary px-5 py-4">
          <Icon name="user" size="sm" color="mutedForeground" />
          <Text className="flex-1 text-[15px]">Rosa Delgado</Text>
          <View className="flex-row items-center gap-1">
            <Text variant="muted">Group</Text>
            <ActionSwapText value={group} className="text-[15px] tabular-nums text-muted-foreground">
              {group}
            </ActionSwapText>
          </View>
        </View>
      </View>
    </Accent>
  );
}
