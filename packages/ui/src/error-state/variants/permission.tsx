import * as React from "react";
import { View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { Accent, BAND_STAGGER, SwitchOn, ease, timing, useReducedMotion } from "@lumioui/core";
import { ErrorState } from "../error-state";
import { Button } from "../../button/button";
import { Icon } from "../../icon/icon";
import { Text } from "../../text/text";

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Each corner arm draws out from its corner — the checkbox-mark draw beat. */
const DRAW = { ...timing.normal, easing: Easing.bezier(...ease.out) } as const;
/** Length of each corner arm. */
const ARM = 36;
const CORNERS = [
  { key: "tl", h: "left", v: "top" },
  { key: "tr", h: "right", v: "top" },
  { key: "bl", h: "left", v: "bottom" },
  { key: "br", h: "right", v: "bottom" },
] as const;

/** One corner bracket of the scan frame, drawing its two arms on. */
function Corner({ corner }: { corner: (typeof CORNERS)[number] }) {
  const reduce = useReducedMotion();
  const drawn = useSharedValue(reduce ? 1 : 0);
  React.useEffect(() => {
    if (!reduce) drawn.value = withTiming(1, DRAW);
  }, [drawn, reduce]);
  const { h, v } = corner;
  // Arms grow out of the corner point (scale, not size — transforms only).
  const across = useAnimatedStyle(() => ({ transformOrigin: `${h} center`, transform: [{ scaleX: drawn.value }] }));
  const down = useAnimatedStyle(() => ({ transformOrigin: `center ${v}`, transform: [{ scaleY: drawn.value }] }));
  return (
    <View
      style={{
        position: "absolute",
        width: ARM,
        height: ARM,
        [v]: 0,
        [h]: 0,
      }}
    >
      <Animated.View className="absolute h-1 rounded-full bg-primary" style={[{ [v]: 0, [h]: 0, width: ARM }, across]} />
      <Animated.View className="absolute w-1 rounded-full bg-primary" style={[{ [v]: 0, [h]: 0, height: ARM }, down]} />
    </View>
  );
}

/** ErrorStatePermission — an expense app's receipt scanner after camera
 *  access was denied. "Open Settings" hands off (simulated) and comes back
 *  granted: the error dims and, in its place, the scan frame draws its four
 *  corners on (240ms), then the hint switches on. Amber accent. */
export function ErrorStatePermission() {
  const [granted, setGranted] = React.useState(false);
  return (
    <Accent color="amber" className="w-full">
      <View className="min-h-[640px] w-full gap-2">
        <View className="gap-1">
          <Text className="text-3xl font-bold tracking-tight">Scan receipt</Text>
          <Text variant="muted">Business trip · Harbourside, Oct 14–16</Text>
        </View>
        {granted ? (
          <View className="mt-4 gap-4">
            <View className="h-[420px] items-center justify-center rounded-3xl bg-card p-6">
              <View className="h-full w-full items-center justify-center">
                {CORNERS.map((c) => (
                  <Corner key={c.key} corner={c} />
                ))}
                <SwitchOn delay={BAND_STAGGER * 2} className="items-center">
                  <Icon name="camera" size="xl" color="mutedForeground" />
                  <Text className="mt-3 text-base text-muted-foreground">Hold the receipt inside the frame</Text>
                </SwitchOn>
              </View>
            </View>
            <Button variant="ghost" onPress={() => setGranted(false)}>
              Reset demo
            </Button>
          </View>
        ) : (
          <ErrorState
            kind="permission"
            icon="camera"
            title="Allow camera to scan receipts"
            description="Tally reads totals, dates and VAT straight off the paper. Photos stay in this report."
            onRetry={() => wait(900)}
            onRecover={() => setGranted(true)}
            secondaryAction={{ label: "Enter amount manually", onPress: () => undefined }}
          />
        )}
      </View>
    </Accent>
  );
}
