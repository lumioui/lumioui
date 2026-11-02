import * as React from "react";
import { View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { Accent, Sheen, SwitchOn, ease, timing, useHaptic, useTheme } from "@lumioui/core";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../dialog";
import { Button } from "../../button/button";
import { Icon } from "../../icon/icon";
import { Text } from "../../text/text";

function Stat({ value, unit, label }: { value: string; unit?: string; label: string }) {
  return (
    <View className="flex-1 gap-1">
      <View className="flex-row items-baseline gap-1">
        <Text className="text-3xl font-semibold tracking-tight tabular-nums">{value}</Text>
        {unit ? <Text className="text-[15px] text-muted-foreground">{unit}</Text> : null}
      </View>
      <Text variant="muted">{label}</Text>
    </View>
  );
}

/** The dialog dims out before the run card performs (panel dim + scrim trail). */
const AFTER_DIALOG = timing.recede.duration + timing.recede.duration / 2;
/** The saved figure holds its sheen this long before the card resolves. */
const HOLD_MS = 700;

type Phase = "live" | "saving" | "saved";

/** DialogConfirm — "End workout?" on a live run. The run screen is the
 *  habitat; ending asks first, then the card itself performs the save: the
 *  dialog dims away, one red sheen crosses the 28:14 figure while the
 *  footprints glyph dims from accent to muted, the result holds 700ms, then
 *  "Saved to Activity" switches on in place. */
export function DialogConfirm() {
  return (
    <Accent color="red" className="w-full">
      <RunCard />
    </Accent>
  );
}

function RunCard() {
  const { colors } = useTheme();
  const haptics = useHaptic();
  const [open, setOpen] = React.useState(false);
  const [phase, setPhase] = React.useState<Phase>("live");
  const [sheen, setSheen] = React.useState(0);
  const timers = React.useRef<ReturnType<typeof setTimeout>[]>([]);
  React.useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // Accent → muted on the glyph, crossfaded rather than snapped.
  const lit = useSharedValue(1);
  const accentGlyph = useAnimatedStyle(() => ({ opacity: lit.value }));
  const mutedGlyph = useAnimatedStyle(() => ({ opacity: 1 - lit.value }));
  const setLit = (on: boolean) => {
    lit.value = withTiming(on ? 1 : 0, { ...timing.normal, easing: Easing.bezier(...ease.inOut) });
  };

  const endAndSave = () => {
    timers.current.push(
      setTimeout(() => {
        setPhase("saving");
        setSheen((n) => n + 1);
        setLit(false);
        haptics.success();
      }, AFTER_DIALOG),
      setTimeout(() => setPhase("saved"), AFTER_DIALOG + HOLD_MS)
    );
  };

  const startAnother = () => {
    setPhase("live");
    setLit(true);
  };

  return (
    <View className="w-full gap-5 rounded-3xl bg-card p-5">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <View>
            <Animated.View style={accentGlyph}>
              <Icon name="footprints" size="sm" color="primary" />
            </Animated.View>
            <Animated.View style={[{ position: "absolute", top: 0, left: 0 }, mutedGlyph]}>
              <Icon name="footprints" size="sm" color="mutedForeground" />
            </Animated.View>
          </View>
          <Text className="text-[15px] font-medium">Tempo run</Text>
        </View>
        {phase === "saved" ? (
          <SwitchOn key="saved" accessibilityLiveRegion="polite">
            <Text variant="muted">Saved to Activity</Text>
          </SwitchOn>
        ) : (
          <Text variant="muted">In progress</Text>
        )}
      </View>

      <View className="gap-1">
        <View className="self-start overflow-hidden rounded-xl">
          <Text className="text-5xl font-semibold tracking-tight tabular-nums">28:14</Text>
          <Sheen run={sheen} color={colors.primary} strength={0.3} />
        </View>
        <Text variant="muted">Elapsed · Harbour Park loop</Text>
      </View>

      <View className="flex-row gap-4 border-t border-border pt-4">
        <Stat value="5.21" unit="km" label="Distance" />
        <Stat value="5:25" unit="/km" label="Avg pace" />
        <Stat value="162" unit="bpm" label="Heart rate" />
      </View>

      {phase === "saved" ? (
        <SwitchOn key="again">
          <Button size="lg" variant="secondary" className="w-full" onPress={startAnother}>
            Start another run
          </Button>
        </SwitchOn>
      ) : (
        <View className="flex-row gap-2">
          <Button
            size="lg"
            variant="secondary"
            className="flex-1"
            disabled={phase === "saving"}
            icon={<Icon name="pause" size="sm" color="foreground" />}
          >
            Pause
          </Button>
          <Button size="lg" className="flex-1" disabled={phase === "saving"} onPress={() => setOpen(true)}>
            End
          </Button>
        </View>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End workout?</DialogTitle>
            <DialogDescription>
              You've run 5.21 km in 28:14. Ending now saves it to your log and counts it toward today's goals.
            </DialogDescription>
          </DialogHeader>
          {/* Overlays portal out of the tree, so the accent is re-scoped here. */}
          <Accent color="red">
            <DialogFooter>
              <DialogClose>
                <Button variant="ghost">Keep going</Button>
              </DialogClose>
              <DialogClose>
                <Button onPress={endAndSave}>End and save</Button>
              </DialogClose>
            </DialogFooter>
          </Accent>
        </DialogContent>
      </Dialog>
    </View>
  );
}
