import * as React from "react";
import { View } from "react-native";
import { Accent, SwitchOn, rowDelay } from "@lumioui/core";
import { ErrorState } from "../error-state";
import { Text } from "../../text/text";

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const DEPARTURES = [
  { line: "U2", to: "North Quay", mins: "2 min", tile: "bg-tint-orange" },
  { line: "13A", to: "Harbour Central", mins: "6 min", tile: "bg-tint-green" },
  { line: "U2", to: "Old Mill Square", mins: "9 min", tile: "bg-tint-orange" },
  { line: "D", to: "Harbour Gate", mins: "11 min", tile: "bg-tint-red" },
  { line: "13A", to: "Glassworks", mins: "14 min", tile: "bg-tint-green" },
  { line: "U2", to: "North Quay", mins: "17 min", tile: "bg-tint-orange" },
  { line: "D", to: "Riverside Park", mins: "21 min", tile: "bg-tint-red" },
  { line: "13A", to: "Harbour Central", mins: "24 min", tile: "bg-tint-green" },
];

/** The board — live, or as the dim shape the error sits on. */
function Board({ live }: { live: boolean }) {
  return (
    <View className="overflow-hidden rounded-2xl bg-card">
      {DEPARTURES.map((d, i) => {
        const row = (
          <View className={i > 0 ? "flex-row items-center gap-3 border-t border-border p-4" : "flex-row items-center gap-3 p-4"}>
            <View className={`h-8 min-w-[44px] items-center justify-center rounded-lg px-2 ${live ? d.tile : "bg-muted"}`}>
              <Text className={live ? "text-sm font-bold text-white" : "text-sm font-bold text-muted-foreground"}>{d.line}</Text>
            </View>
            <Text className="flex-1 text-base font-medium">{d.to}</Text>
            <Text className="text-base font-semibold tabular-nums">{live ? d.mins : "– min"}</Text>
          </View>
        );
        // Live rows switch on top to bottom, 40ms apart.
        return live ? (
          <SwitchOn key={`${i}-${d.line}`} delay={rowDelay(i)}>
            {row}
          </SwitchOn>
        ) : (
          <React.Fragment key={`${i}-${d.line}`}>{row}</React.Fragment>
        );
      })}
    </View>
  );
}

/** ErrorStateOffline — a transit app's Departures tab with no signal. The
 *  error sits over the board's own dim shape, not a blank page. The first
 *  "Try again" fails (spinner, a 4px flicker, warning buzz, "Still no
 *  connection"); the second gets through: the error dims, one sheen crosses
 *  the dim board and the live rows switch on 40ms apart. Teal accent. */
export function ErrorStateOffline() {
  const attempts = React.useRef(0);
  const [online, setOnline] = React.useState(false);
  const retry = async () => {
    await wait(1100);
    attempts.current += 1;
    if (attempts.current < 2) throw new Error("offline");
  };
  return (
    <Accent color="teal" className="w-full">
      <View className="min-h-[640px] w-full gap-2">
        <View className="gap-1">
          <Text className="text-3xl font-bold tracking-tight">Departures</Text>
          <Text variant="muted">Harbour Central · Platform 1</Text>
        </View>
        <View className="mt-4">
          {online ? (
            <Board live />
          ) : (
            <ErrorState
              kind="offline"
              description="Live departures need a connection. Timetables you saved still work offline."
              structure={<Board live={false} />}
              onRetry={retry}
              onRecover={() => setOnline(true)}
              secondaryAction={{ label: "Open saved timetables", onPress: () => undefined }}
            />
          )}
        </View>
      </View>
    </Accent>
  );
}
