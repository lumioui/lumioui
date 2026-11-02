import * as React from "react";
import { View } from "react-native";
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated";
import { Accent, ease, rowDelay, SWITCH_DIM, timing } from "@lumioui/core";
import { Switch } from "../switch";
import { Icon, type IconName } from "../../icon/icon";
import { Text } from "../../text/text";

const IGNITE = { duration: timing.fast.duration, easing: Easing.bezier(...ease.out) };
const DIM = { duration: timing.recede.duration, easing: Easing.bezier(...ease.in) };

/** The master row's tile is the lamp: unlit it is grey, switched on it fills
 *  with the accent. Dependent rows keep a neutral tile; only one light source. */
function RowTile({ name, lit: on, lamp }: { name: IconName; lit: boolean; lamp: boolean }) {
  const lit = useSharedValue(lamp && on ? 1 : 0);
  React.useEffect(() => {
    lit.value = withTiming(lamp && on ? 1 : 0, lamp && on ? IGNITE : DIM);
  }, [on, lamp, lit]);
  const fillStyle = useAnimatedStyle(() => ({ opacity: lit.value }));
  const offStyle = useAnimatedStyle(() => ({ opacity: 1 - lit.value }));
  return (
    <View className="h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-secondary">
      <Animated.View style={fillStyle} className="absolute inset-0 bg-primary" />
      <Animated.View style={offStyle} className="absolute">
        <Icon name={name} size="sm" color={lamp ? "mutedForeground" : "foreground"} />
      </Animated.View>
      <Animated.View style={fillStyle} className="absolute">
        <Icon name={name} size="sm" color="primaryForeground" />
      </Animated.View>
    </View>
  );
}

/** Dims its children when the master is off and switches them back on in
 *  order. Used on a row's tile and text only — a disabled Switch dims itself,
 *  so the control is never dimmed twice. */
function Follows({ on, index, children }: { on: boolean; index: number; children: React.ReactNode }) {
  const level = useSharedValue(on ? 1 : SWITCH_DIM);
  React.useEffect(() => {
    level.value = withDelay(rowDelay(index), withTiming(on ? 1 : SWITCH_DIM, on ? IGNITE : DIM));
  }, [on, index, level]);
  const style = useAnimatedStyle(() => ({ opacity: level.value }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

/** A detail line that swaps in place: the old text dims, the new one ignites. */
function SwapText({ text }: { text: string }) {
  const [shown, setShown] = React.useState(text);
  const o = useSharedValue(1);
  React.useEffect(() => {
    if (text === shown) return;
    // The string changes when the dim lands, then the new one ignites.
    o.value = withTiming(0, DIM, (finished) => {
      if (finished) runOnJS(setShown)(text);
    });
  }, [text, shown, o]);
  // Ignite the new string after a swap; the first paint stays still.
  const mounted = React.useRef(false);
  React.useEffect(() => {
    if (mounted.current) o.value = withTiming(1, IGNITE);
    mounted.current = true;
  }, [shown, o]);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <Animated.View style={style}>
      <Text variant="muted" className="text-sm">{shown}</Text>
    </Animated.View>
  );
}

interface RowProps {
  icon: IconName;
  label: string;
  detail: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  /** This row's tile is the lamp that lights with the switch. */
  lamp?: boolean;
  /** Off: the master schedule is off, so this rule can't run. */
  active?: boolean;
  index?: number;
}

function LightRow({ icon, label, detail, checked, onCheckedChange, lamp = false, active = true, index = 0 }: RowProps) {
  return (
    <View className="min-h-[64px] flex-row items-center gap-3 px-4 py-3">
      <Follows on={active} index={index}>
        <RowTile name={icon} lit={checked && active} lamp={lamp} />
      </Follows>
      <View className="flex-1">
        <Follows on={active} index={index}>
          <View className="gap-1">
            <Text className="text-base font-medium">{label}</Text>
            <SwapText text={detail} />
          </View>
        </Follows>
      </View>
      <Switch
        checked={checked && active}
        onCheckedChange={onCheckedChange}
        disabled={!active}
        accessibilityLabel={label}
      />
    </View>
  );
}

/** SwitchSettings — a home-lighting schedule. The master switch pulls the
 *  amber light across its track and its tile lights like the lamp it
 *  controls; the rules that depend on it dim when it goes off and switch back
 *  on 40ms apart when it comes back. */
export function SwitchSettings() {
  const [porch, setPorch] = React.useState(true);
  const [late, setLate] = React.useState(true);
  const [motion, setMotion] = React.useState(false);
  const [hall, setHall] = React.useState(false);
  return (
    <Accent color="amber" className="w-full">
      <View className="w-full gap-6">
        <View className="gap-2">
          <Text variant="muted" className="px-4 text-[13px] font-medium">
            Porch
          </Text>
          <View className="overflow-hidden rounded-2xl bg-card">
            <LightRow
              icon="sun"
              label="Porch light at sunset"
              detail={porch ? "On at 7:42 PM tonight" : "Off tonight"}
              checked={porch}
              onCheckedChange={setPorch}
              lamp
            />
            <View className="ml-[68px] h-px bg-border" />
            <LightRow
              icon="moon"
              label="Dim to 30% at 11 PM"
              detail="Until sunrise at 6:51 AM"
              checked={late}
              onCheckedChange={setLate}
              active={porch}
              index={1}
            />
            <View className="ml-[68px] h-px bg-border" />
            <LightRow
              icon="footprints"
              label="Brighten on motion"
              detail="Full for 3 minutes"
              checked={motion}
              onCheckedChange={setMotion}
              active={porch}
              index={2}
            />
          </View>
          <Follows on={porch} index={3}>
            <View className="px-4">
              <SwapText
                text={
                  porch
                    ? "Sunset moves with the season, so tonight's comes 2 minutes earlier."
                    : "Turn the schedule on to light the porch when it gets dark."
                }
              />
            </View>
          </Follows>
        </View>

        <View className="gap-2">
          <Text variant="muted" className="px-4 text-[13px] font-medium">
            Hallway
          </Text>
          <View className="overflow-hidden rounded-2xl bg-card">
            <LightRow
              icon="home"
              label="Night light"
              detail={hall ? "10% warm white, 9 PM to 6 AM" : "Not scheduled"}
              checked={hall}
              onCheckedChange={setHall}
              lamp
            />
          </View>
        </View>
      </View>
    </Accent>
  );
}
