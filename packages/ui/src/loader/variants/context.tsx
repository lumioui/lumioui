import * as React from "react";
import { View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { Accent, timing } from "@lumioui/core";
import { Loader } from "../loader";
import { Button } from "../../button/button";
import { Icon } from "../../icon/icon";
import { Text } from "../../text/text";

/** How long the demo waits before a driver accepts — a believable match. */
const MATCH_AFTER = 3200;

type Phase = "searching" | "matched" | "resolved" | "cancelled";

const COPY: Record<Phase, { title: string; body: string }> = {
  searching: { title: "Finding your driver", body: "Comfort · usually under 2 min" },
  matched: { title: "Finding your driver", body: "Comfort · usually under 2 min" },
  resolved: { title: "Noor is on the way", body: "Grey Coda · 7KX 214 · 3 min" },
  cancelled: { title: "Request cancelled", body: "You weren't charged for this trip" },
};

/** LoaderContext — a ride request waiting for a driver. The ring is the hero
 *  of the sheet while matching. When a driver accepts, the same ring stops,
 *  closes and ignites with a check, holds, then the headline swaps in place. */
export function LoaderContext() {
  const [phase, setPhase] = React.useState<Phase>("searching");

  React.useEffect(() => {
    if (phase !== "searching") return;
    const t = setTimeout(() => setPhase("matched"), MATCH_AFTER);
    return () => clearTimeout(t);
  }, [phase]);

  const waiting = phase === "searching" || phase === "matched";
  const copy = COPY[phase];

  return (
    <Accent color="teal" className="w-full">
      <View className="w-full gap-5 rounded-3xl bg-card p-5">
        <View className="items-center gap-4 pt-3">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-secondary">
            {phase === "cancelled" ? (
              <Icon name="car" size="lg" color="mutedForeground" />
            ) : (
              <>
                <Loader
                  variant="ring"
                  size={56}
                  label="Finding a driver"
                  doneLabel="Driver found"
                  done={phase === "matched" || phase === "resolved"}
                  onResolved={() => setPhase("resolved")}
                  className="absolute"
                />
                {waiting ? (
                  <Animated.View exiting={FadeOut.duration(timing.recede.duration)}>
                    <Icon name="car" size="lg" color="primary" />
                  </Animated.View>
                ) : null}
              </>
            )}
          </View>
          {/* Headline swaps in place: the old line dims, the new one ignites. */}
          <Animated.View
            key={copy.title}
            entering={FadeIn.duration(timing.fast.duration)}
            exiting={FadeOut.duration(timing.recede.duration)}
            className="items-center gap-1"
            accessibilityLiveRegion="polite"
          >
            <Text className="text-2xl font-bold tracking-tight">{copy.title}</Text>
            <Text variant="muted" className="text-center">
              {copy.body}
            </Text>
          </Animated.View>
        </View>

        <View className="overflow-hidden rounded-2xl bg-secondary">
          <View className="flex-row items-center gap-3 px-4 py-3">
            <View className="h-2 w-2 rounded-full bg-foreground" />
            <Text className="flex-1 text-[15px]" numberOfLines={1}>Harbour Hall, Pier 4</Text>
          </View>
          <View className="ml-9 h-px bg-border" />
          <View className="flex-row items-center gap-3 px-4 py-3">
            <View className="h-2 w-2 bg-primary" />
            <Text className="flex-1 text-[15px]" numberOfLines={1}>18 Lantern Row</Text>
            <Text className="text-[15px] font-semibold tabular-nums">$23.80</Text>
          </View>
        </View>

        {waiting ? (
          <Button size="lg" variant="secondary" className="w-full" onPress={() => setPhase("cancelled")}>
            Cancel request
          </Button>
        ) : phase === "resolved" ? (
          <Button size="lg" variant="secondary" className="w-full" onPress={() => setPhase("searching")}>
            Request another ride
          </Button>
        ) : (
          <Button size="lg" className="w-full" onPress={() => setPhase("searching")}>
            Request again
          </Button>
        )}
      </View>
    </Accent>
  );
}
