import * as React from "react";
import { View } from "react-native";
import { ProgressRing } from "../progress-ring";
import { Button } from "../../button/button";
import { Icon } from "../../icon/icon";
import { Text } from "../../text/text";

type Phase = "searching" | "pairing" | "done";

/** ProgressRingIndeterminate — pairing a smart speaker. A comet laps the
 *  ring while the device is being found, then hands over to a real fill as
 *  the setup steps complete. The last step closes the ring: the speaker
 *  glyph dims while a check draws and holds, then the glyph returns as a
 *  check and the copy resolves to "ready". */
export function ProgressRingIndeterminate() {
  const [phase, setPhase] = React.useState<Phase>("searching");
  const [pct, setPct] = React.useState(0);

  React.useEffect(() => {
    if (phase === "searching") {
      const t = setTimeout(() => setPhase("pairing"), 2400);
      return () => clearTimeout(t);
    }
    if (phase === "pairing") {
      if (pct >= 100) return;
      const t = setTimeout(() => setPct((p) => Math.min(100, p + 20)), 450);
      return () => clearTimeout(t);
    }
  }, [phase, pct]);

  const restart = () => {
    setPct(0);
    setPhase("searching");
  };

  const title = phase === "searching" ? "Looking for your speaker" : phase === "pairing" ? "Connecting to Wi-Fi" : "Kitchen speaker is ready";
  const body =
    phase === "searching"
      ? "Keep your phone within a metre of the speaker."
      : phase === "pairing"
        ? "Sending the password for Brennan Home."
        : "Say \"Play some jazz\" to try it out.";

  return (
    <View className="w-full items-center gap-8 rounded-3xl bg-card px-5 pb-5 pt-10">
      <ProgressRing
        size={148}
        strokeWidth={6}
        indeterminate={phase === "searching"}
        value={phase === "done" ? 100 : pct}
        label={title}
        closedLabel={null}
        onClosed={() => setPhase("done")}
      >
        <View className="h-20 w-20 items-center justify-center rounded-full bg-secondary">
          <Icon name={phase === "done" ? "check" : "volume-2"} size="xl" color="foreground" />
        </View>
      </ProgressRing>

      <View className="items-center gap-2">
        <Text className="text-center text-2xl font-bold tracking-tight">{title}</Text>
        <Text className="text-center text-base text-muted-foreground">{body}</Text>
      </View>

      <Button
        size="lg"
        variant={phase === "done" ? "default" : "secondary"}
        className="w-full"
        onPress={restart}
      >
        {phase === "done" ? "Done" : "Cancel"}
      </Button>
    </View>
  );
}
