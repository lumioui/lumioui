import * as React from "react";
import { View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { Accent, timing } from "@lumioui/core";
import { TypingIndicator } from "../typing-indicator";
import { Avatar } from "../../avatar/avatar";
import { Button } from "../../button/button";
import { Icon } from "../../icon/icon";
import { Text } from "../../text/text";

/** A message; `typed` ones arrive through the typing bubble, `arrived` once the reply lands. */
type Msg = { id: number; from: "them" | "me"; text: string; typed?: boolean; arrived?: boolean };

/** Scripted exchange — each quick reply gets a typed answer back. */
const SCRIPT: { reply: string; answer: string }[] = [
  { reply: "Still on for 7 AM?", answer: "Yes! I'll bring the 60 m rope and the quickdraws." },
  { reply: "I'll grab coffee on the way", answer: "Oat flat white please. Parking lot by the trailhead?" },
  { reply: "See you there", answer: "Perfect. Lot B at 6:50, look for the green van." },
];

/** Demo pacing — the opening typing bubble holds just long enough to read the light sweep. */
const OPENING_TYPING_MS = 2400;
/** How long Callum types an answer to each later reply. */
const ANSWER_TYPING_MS = 2200;

const AVATAR = { uri: "https://i.pravatar.cc/150?img=11" };

/** TypingThread — a DM about a weekend climb. Send the suggested reply and
 *  Callum's typing bubble appears, then grows into his answer word by word. */
export function TypingThread() {
  // Opens mid-conversation: the first reply is already sent and Callum is
  // typing, so the indicator is on screen at rest from the first frame.
  const [msgs, setMsgs] = React.useState<Msg[]>([
    { id: 0, from: "them", text: "Forecast for the Harrow Crags looks dry on Saturday" },
    { id: 1, from: "me", text: SCRIPT[0]!.reply },
    { id: 2, from: "them", text: SCRIPT[0]!.answer, typed: true },
  ]);
  const [step, setStep] = React.useState(0);
  const [rowW, setRowW] = React.useState(320);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const typing = msgs.some((m) => m.typed && !m.arrived);

  const arrive = React.useCallback((id: number, i: number, delay: number) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setMsgs((all) => all.map((m) => (m.id === id ? { ...m, arrived: true } : m)));
      setStep(i + 1);
    }, delay);
  }, []);

  React.useEffect(() => {
    arrive(2, 0, OPENING_TYPING_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [arrive]);

  const next = SCRIPT[step];
  const send = () => {
    if (!next || typing) return;
    const id = msgs.length;
    setMsgs((m) => [
      ...m,
      { id, from: "me", text: next.reply },
      { id: id + 1, from: "them", text: next.answer, typed: true },
    ]);
    arrive(id + 1, step, ANSWER_TYPING_MS);
  };

  // The avatar sits beside the bottom-most message from Callum.
  const lastThem = [...msgs].reverse().find((m) => m.from === "them")?.id;

  return (
    <Accent color="green" className="w-full">
      <View className="w-full overflow-hidden rounded-3xl bg-card">
        <View className="flex-row items-center gap-3 border-b border-border px-4 py-3">
          <Icon name="chevron-left" size="md" color="primaryText" accessibilityLabel="Back" />
          <Avatar size="md" source={AVATAR} fallback="CR" alt="Callum Reid" />
          <View className="flex-1">
            <Text className="text-base font-semibold">Callum Reid</Text>
            {/* Presence swaps in place: the old line dims while the new one ignites. */}
            <View className="h-5">
              <Animated.View
                key={typing ? "typing" : "active"}
                entering={FadeIn.duration(timing.fast.duration)}
                exiting={FadeOut.duration(timing.recede.duration)}
                className="absolute left-0 top-0"
              >
                <Text variant="muted">{typing ? "typing…" : "Active now"}</Text>
              </Animated.View>
            </View>
          </View>
          <Icon name="phone" size="md" color="primaryText" accessibilityLabel="Call" />
        </View>

        <View
          className="min-h-[300px] justify-end gap-2 px-4 py-4"
          onLayout={(e) => setRowW(e.nativeEvent.layout.width - 32)}
        >
          {msgs.map((m) =>
            m.from === "them" ? (
              <View key={m.id} className="w-full flex-row items-end gap-2">
                {m.id === lastThem ? (
                  <Avatar size="sm" source={AVATAR} fallback="CR" alt="Callum Reid" />
                ) : (
                  <View className="h-8 w-8" />
                )}
                {m.typed ? (
                  <TypingIndicator
                    bubble
                    message={m.arrived ? m.text : undefined}
                    maxWidth={Math.round(rowW * 0.8) - 32}
                    accessibilityLabel="Callum is typing"
                  />
                ) : (
                  <View className="max-w-[80%] rounded-3xl rounded-bl-md bg-secondary px-4 py-2">
                    <Text className="text-base leading-6">{m.text}</Text>
                  </View>
                )}
              </View>
            ) : (
              <View key={m.id} className="max-w-[80%] self-end rounded-3xl rounded-br-md bg-primary px-4 py-2">
                <Text className="text-base leading-6 text-primary-foreground">{m.text}</Text>
              </View>
            )
          )}
        </View>

        <View className="border-t border-border p-3">
          {next ? (
            <Button variant="secondary" onPress={send} disabled={typing}>
              {`Reply "${next.reply}"`}
            </Button>
          ) : (
            <Text variant="muted" className="py-2 text-center">Seen just now</Text>
          )}
        </View>
      </View>
    </Accent>
  );
}
