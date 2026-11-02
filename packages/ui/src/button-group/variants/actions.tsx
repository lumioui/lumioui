import * as React from "react";
import { Image, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { Accent, ease, spring, timing, useReducedMotion } from "@lumioui/core";
import { ButtonGroup } from "../button-group";
import { Button } from "../../button/button";
import { Icon } from "../../icon/icon";
import { Text } from "../../text/text";

type Rsvp = "yes" | "maybe" | "no";

const ANSWERS: { key: Rsvp; label: string; note: string }[] = [
  { key: "yes", label: "Going", note: "Tomás will see you're going" },
  { key: "maybe", label: "Maybe", note: "Marked tentative on your calendar" },
  { key: "no", label: "Decline", note: "Removed from your calendar" },
];

const GUESTS = [14, 33, 51, 68];

/** Swapped lines ignite from this scale (swap grammar). */
const SWAP_FROM = 0.96;

/** The confirmation under the group swaps in place — the old line dims, the
 *  new one ignites — and then stays as the evidence of the answer. */
function SwapLine({ text }: { text: string }) {
  const reduce = useReducedMotion();
  const lit = useSharedValue(1);
  const grow = useSharedValue(1);
  const first = React.useRef(true);
  React.useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    lit.value = 0;
    lit.value = withTiming(1, { ...timing.fast, easing: Easing.bezier(...ease.out) });
    if (reduce) return;
    grow.value = SWAP_FROM;
    grow.value = withSpring(1, spring.swap);
  }, [text, reduce, lit, grow]);
  const style = useAnimatedStyle(() => ({ opacity: lit.value, transform: [{ scale: grow.value }] }));
  return (
    <Animated.Text
      className="text-center text-sm text-muted-foreground"
      style={style}
      accessibilityLiveRegion="polite"
    >
      {text}
    </Animated.Text>
  );
}

/** ButtonGroupActions — an attached RSVP group on a calendar invite. The
 *  three answers sit in one rounded track: an inset orange pill glides to
 *  the chosen answer with the label ink following it, and the line under it
 *  swaps in place to confirm. */
export function ButtonGroupActions() {
  const [answer, setAnswer] = React.useState<Rsvp | null>(null);
  const picked = ANSWERS.find((a) => a.key === answer);
  return (
    <Accent color="orange" className="w-full">
      <View className="w-full gap-5 rounded-3xl bg-card p-5">
        <View className="gap-1">
          <Text variant="muted">Thu, Oct 16 · 2:30 – 3:15 PM</Text>
          <Text className="text-2xl font-bold tracking-tight">Pricing page crit</Text>
        </View>

        <View className="gap-3">
          <View className="flex-row items-center gap-3">
            <Icon name="map-pin" size="sm" color="mutedForeground" />
            <Text className="text-[15px]">Room 4B, Pier House</Text>
          </View>
          <View className="flex-row items-center gap-3">
            <Icon name="users" size="sm" color="mutedForeground" />
            <View className="flex-row">
              {GUESTS.map((g, i) => (
                <Image
                  key={g}
                  source={{ uri: `https://i.pravatar.cc/150?img=${g}` }}
                  className={`h-7 w-7 rounded-full border-2 border-card bg-muted ${i > 0 ? "-ml-2" : ""}`}
                  accessibilityIgnoresInvertColors
                />
              ))}
            </View>
            <Text variant="muted">Tomás Herrera + 5</Text>
          </View>
        </View>

        <View className="gap-2">
          <ButtonGroup
            className="w-full"
            accessibilityLabel="RSVP"
            value={answer}
            onValueChange={(v) => setAnswer(v as Rsvp)}
          >
            {ANSWERS.map((a) => (
              <Button key={a.key} variant="outline" className="flex-1">
                {a.label}
              </Button>
            ))}
          </ButtonGroup>
          <SwapLine text={picked ? picked.note : "Reply by tomorrow, 5:00 PM"} />
        </View>
      </View>
    </Accent>
  );
}
