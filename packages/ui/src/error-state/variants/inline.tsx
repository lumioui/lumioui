import * as React from "react";
import { View } from "react-native";
import { SwitchOn, rowDelay } from "@lumioui/core";
import { ErrorState } from "../error-state";
import { Text } from "../../text/text";

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const SPRINT = [
  { name: "Checkout redesign", done: 18, total: 22 },
  { name: "Android widget", done: 7, total: 15 },
];

const RELEASES = [
  { name: "iOS 4.18.0 · in review", meta: "Submitted Tuesday 16:40 · build 2291" },
  { name: "Android 4.18.0 · rolling out", meta: "20% of users · since Monday 09:15" },
  { name: "Web 2026.41 · live", meta: "Shipped Friday 11:02 · 3 fixes" },
];

/** The releases list — live, or as the dim shape the error sits on. */
function Releases({ live }: { live: boolean }) {
  return (
    <View>
      {RELEASES.map((r, i) => {
        const row = (
          <View className={i > 0 ? "gap-1 border-t border-border py-4" : "gap-1 py-4"}>
            <Text className="text-base font-medium">{r.name}</Text>
            <Text className="text-sm text-muted-foreground">{r.meta}</Text>
          </View>
        );
        // Live rows switch on in reading order, 40ms apart.
        return live ? (
          <SwitchOn key={r.name} delay={rowDelay(i)}>
            {row}
          </SwitchOn>
        ) : (
          <React.Fragment key={r.name}>{row}</React.Fragment>
        );
      })}
    </View>
  );
}

/** ErrorStateInline — one section of a project dashboard failed with a 503
 *  while the rest loaded. The error sits over the section's dim shape and
 *  counts down "Retrying in 8s", the seconds swapping in place; the first
 *  automatic retry fails (a 4px flicker, countdown restarts), "Retry now" or
 *  the next one succeeds: the error dims, a sheen crosses the dim rows and
 *  the releases switch on 40ms apart. Neutral ink. */
export function ErrorStateInline() {
  const attempts = React.useRef(0);
  const [loaded, setLoaded] = React.useState(false);
  const retry = async () => {
    await wait(900);
    attempts.current += 1;
    if (attempts.current < 2) throw new Error("503");
  };
  return (
    <View className="w-full">
      <View className="w-full gap-6">
        <View className="gap-1">
          <Text className="text-3xl font-bold tracking-tight">This week</Text>
          <Text variant="muted">Mobile team · Sprint 41</Text>
        </View>

        <View className="gap-2">
          <Text className="px-1 text-[13px] font-medium text-muted-foreground">Projects</Text>
          <View className="overflow-hidden rounded-2xl bg-card">
            {SPRINT.map((p, i) => (
              <View key={p.name} className={i > 0 ? "gap-2 border-t border-border p-4" : "gap-2 p-4"}>
                <View className="flex-row items-center justify-between">
                  <Text className="text-base font-medium">{p.name}</Text>
                  <Text className="text-sm text-muted-foreground tabular-nums">{`${p.done}/${p.total}`}</Text>
                </View>
                <View className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <View className="h-full rounded-full bg-primary" style={{ width: `${(p.done / p.total) * 100}%` }} />
                </View>
              </View>
            ))}
          </View>
        </View>

        <View className="gap-2">
          <Text className="px-1 text-[13px] font-medium text-muted-foreground">Releases</Text>
          <View className="overflow-hidden rounded-2xl bg-card px-4">
            {loaded ? (
              <Releases live />
            ) : (
              <ErrorState
                kind="server"
                layout="inline"
                title="Couldn't load releases"
                description="The store sync timed out."
                code="Error 503 · Ref 7Q2-K9"
                autoRetry={8}
                structure={<Releases live={false} />}
                onRetry={retry}
                onRecover={() => setLoaded(true)}
              />
            )}
          </View>
        </View>
      </View>
    </View>
  );
}
