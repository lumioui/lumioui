import * as React from "react";
import { View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { Accent, timing } from "@lumioui/core";
import { Alert } from "../alert";
import { Button } from "../../button/button";
import { Text } from "../../text/text";

type Phase = "needed" | "resolved" | "folded";

/** Saving the passport is a short round trip — the button's light band runs. */
const SAVE_MS = 900;
/** Act → hold → resolve: the checked-in card holds before it folds. */
const HOLD_MS = 700;

const ignite = FadeIn.duration(timing.fast.duration);
const dim = FadeOut.duration(timing.recede.duration);

/** AlertInline — a trip page where one inline alert blocks check-in. The
 *  alert carries its own fix, and fixing it resolves the same card: the
 *  triangle shrinks to a dot and opens into a check that draws on, the
 *  edge retints amber → green under one sheen, the copy swaps in place,
 *  and after a 700ms hold the card folds into a single line. */
export function AlertInline() {
  const [phase, setPhase] = React.useState<Phase>("needed");
  const timers = React.useRef<ReturnType<typeof setTimeout>[]>([]);
  React.useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const addPassport = () =>
    new Promise<void>((done) => {
      timers.current.push(
        setTimeout(() => {
          setPhase("resolved");
          done();
          timers.current.push(setTimeout(() => setPhase("folded"), HOLD_MS));
        }, SAVE_MS)
      );
    });

  return (
    <Accent color="teal" className="w-full">
      <View className="w-full gap-4">
        <View className="gap-1 px-1">
          <Text className="text-3xl font-bold tracking-tight">Norhaven</Text>
          <Text variant="muted">Fri 14 Nov · ELD → NHV · Flight LM 680</Text>
        </View>

        <Alert variant={phase === "needed" ? "warning" : "success"} animateLayout className="gap-3 p-4">
          <View className="flex-row gap-3">
            <Alert.Glyph />
            {phase === "needed" ? (
              <Animated.View key="needed" entering={ignite} exiting={dim} className="flex-1">
                <Alert.Title>Passport details needed</Alert.Title>
                <Alert.Description>
                  Norhaven requires them before online check-in opens. It takes about a minute.
                </Alert.Description>
              </Animated.View>
            ) : phase === "resolved" ? (
              <Animated.View key="resolved" entering={ignite} exiting={dim} className="flex-1">
                <Alert.Title>You're checked in</Alert.Title>
                <Alert.Description>Seat 14A. Your boarding pass is in your wallet.</Alert.Description>
              </Animated.View>
            ) : (
              <Animated.View key="folded" entering={ignite} exiting={dim} className="flex-1 justify-center">
                <Alert.Title className="mb-0">Checked in · Seat 14A</Alert.Title>
              </Animated.View>
            )}
          </View>
          {phase === "needed" ? (
            <Animated.View key="fix" entering={ignite} exiting={dim} className="ml-9 self-start">
              <Button size="sm" onPress={addPassport}>
                Add passport
              </Button>
            </Animated.View>
          ) : null}
        </Alert>

        <View className="overflow-hidden rounded-2xl bg-card">
          {[
            { label: "Departs", value: "8:25 PM", sub: "Elden International, Gate S9" },
            { label: "Arrives", value: "6:40 AM", sub: "Norhaven, next day" },
            { label: "Bags", value: "1 checked", sub: "23 kg included" },
          ].map((r, i) => (
            <View key={r.label} className={`flex-row items-center px-4 py-3 ${i > 0 ? "border-t border-border" : ""}`}>
              <View className="flex-1">
                <Text className="text-[15px] font-medium">{r.label}</Text>
                <Text variant="muted">{r.sub}</Text>
              </View>
              <Text className="text-base font-semibold tabular-nums">{r.value}</Text>
            </View>
          ))}
        </View>

        {phase === "folded" ? (
          <Animated.View entering={ignite}>
            <Button size="lg" variant="secondary" className="w-full" onPress={() => setPhase("needed")}>
              Undo check-in
            </Button>
          </Animated.View>
        ) : null}
      </View>
    </Accent>
  );
}
