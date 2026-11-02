import * as React from "react";
import { View } from "react-native";
import { Progress } from "../progress";
import { Button } from "../../button/button";
import { Text } from "../../text/text";

type Phase = "idle" | "preparing" | "downloading" | "ready";

/** ProgressIndeterminate — a system software update. While the size is
 *  unknown the bar breathes in place; once the download starts it hands over to a real
 *  fill. Tap "Download and install" to run it. */
export function ProgressIndeterminate() {
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [pct, setPct] = React.useState(0);

  React.useEffect(() => {
    if (phase === "preparing") {
      const t = setTimeout(() => setPhase("downloading"), 2200);
      return () => clearTimeout(t);
    }
    if (phase === "downloading") {
      if (pct >= 100) {
        const t = setTimeout(() => setPhase("ready"), 400);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setPct((p) => Math.min(100, p + 9)), 500);
      return () => clearTimeout(t);
    }
  }, [phase, pct]);

  const status =
    phase === "preparing"
      ? "Preparing update…"
      : phase === "downloading"
        ? `${((Math.min(pct, 100) / 100) * 3.1).toFixed(1)} GB of 3.1 GB · about ${Math.max(1, Math.round((100 - pct) / 12))} min left`
        : phase === "ready"
          ? "Ready to install tonight at 2:00 AM"
          : "3.1 GB · released 2 days ago";

  return (
    <View className="w-full gap-6">
      <Text className="px-1 text-2xl font-bold tracking-tight">Software Update</Text>
      <View className="w-full gap-4 rounded-2xl bg-card p-4">
        <View className="flex-row items-center gap-3">
          <View className="h-12 w-12 items-center justify-center rounded-xl bg-foreground">
            <Text className="text-lg font-bold text-background">26</Text>
          </View>
          <View className="flex-1">
            <Text className="text-[17px] font-semibold">System 26.1</Text>
            <Text variant="muted">Security fixes and battery improvements</Text>
          </View>
        </View>

        {phase === "preparing" || phase === "downloading" ? (
          <Progress value={pct} indeterminate={phase === "preparing"} />
        ) : null}
        <Text variant="muted">{status}</Text>

        {phase === "idle" ? (
          <Button size="lg" className="w-full" onPress={() => setPhase("preparing")}>
            Download and install
          </Button>
        ) : phase === "ready" ? (
          <Button size="lg" variant="secondary" className="w-full" onPress={() => { setPct(0); setPhase("idle"); }}>
            Install now
          </Button>
        ) : null}
      </View>
    </View>
  );
}
