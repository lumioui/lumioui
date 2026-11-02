import * as React from "react";
import { View } from "react-native";
import { Easing, useAnimatedProps, useSharedValue, withDelay, withTiming } from "react-native-reanimated";
import Svg from "react-native-svg";
import { AnimatedPath, ease, timing, useHaptic, useReducedMotion, useTheme } from "@lumioui/core";
import { Button } from "../button";
import { Icon, type IconName } from "../../icon/icon";
import { Text } from "../../text/text";

/** Other apps from the same studio. App icons are content, so each keeps its
 *  own colour; the chrome around them stays ink. */
const MORE: { name: string; blurb: string; glyph: IconName; tile: string; action: string }[] = [
  { name: "Darkroom Notes", blurb: "Film logs and contact sheets", glyph: "book-open", tile: "bg-neutral-900 dark:bg-neutral-700", action: "Open" },
  { name: "Lightmeter", blurb: "Spot and incident metering", glyph: "sun", tile: "bg-tint-amber", action: "$4.99" },
  { name: "Grain Lab", blurb: "Film stock looks", glyph: "film", tile: "bg-tint-orange", action: "Get" },
];

/** The check the CTA lands with: it draws itself in (ease.out over
 *  timing.normal) once the button's label layer is visible again (the old
 *  label dims over timing.recede, the new one ignites over timing.fast), so
 *  the stroke is seen drawing, then holds. Reduced motion shows it whole. */
const CHECK_PATH = "M6 12.5l4 4 8-9";
const CHECK_LEN = 18;
const CHECK_DRAW = { duration: timing.normal.duration, easing: Easing.bezier(...ease.out) };
const CHECK_AFTER_SWAP = timing.recede.duration + timing.fast.duration;

function DrawnCheck() {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const draw = useSharedValue(reduced ? 1 : 0);
  React.useEffect(() => {
    if (!reduced) draw.value = withDelay(CHECK_AFTER_SWAP, withTiming(1, CHECK_DRAW));
  }, [reduced, draw]);
  const pathProps = useAnimatedProps(() => ({ strokeDashoffset: (1 - draw.value) * CHECK_LEN }));
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <AnimatedPath
        d={CHECK_PATH}
        stroke={colors.primaryForeground}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        strokeDasharray={CHECK_LEN}
        animatedProps={pathProps}
      />
    </Svg>
  );
}

/** ButtonSizes — one app listing, every size doing its real job: sm pills on
 *  the "More from" rows, md for the quiet secondary actions, lg as the one
 *  filled CTA in thumb reach. Get is async: the label swaps for three dots
 *  that brighten in turn, then the button becomes its own result: still the
 *  filled primary, now "Open", with a check that draws itself in and holds. */
export function ButtonSizes() {
  const haptic = useHaptic();
  const [installed, setInstalled] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const install = async () => {
    if (installed) return;
    await new Promise((r) => setTimeout(r, 1400));
    setInstalled(true);
  };

  return (
    <View className="w-full gap-6">
      <View className="flex-row items-center gap-4">
        <View className="h-[72px] w-[72px] items-center justify-center rounded-[18px] bg-neutral-900 dark:bg-neutral-700">
          <Icon name="camera" size="lg" color="#FFFFFF" />
        </View>
        <View className="flex-1 gap-1">
          <Text className="text-[22px] font-bold tracking-tight">Aperture One</Text>
          <Text variant="muted" className="text-[15px]">Pixelforge Studio</Text>
        </View>
      </View>

      <View className="w-full gap-2">
        <Text className="text-[17px] font-semibold">More from Pixelforge</Text>
        <View className="w-full rounded-2xl bg-card px-4">
          {MORE.map((app, i) => (
            <View
              key={app.name}
              className={`flex-row items-center gap-3 py-3 ${i > 0 ? "border-t border-border" : ""}`}
            >
              <View className={`h-12 w-12 items-center justify-center rounded-xl ${app.tile}`}>
                <Icon name={app.glyph} size="md" color="#FFFFFF" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold">{app.name}</Text>
                <Text variant="muted" numberOfLines={1}>{app.blurb}</Text>
              </View>
              <Button size="sm" variant="secondary" className="min-w-[64px]" textClassName="tabular-nums">
                {app.action}
              </Button>
            </View>
          ))}
        </View>
      </View>

      <View className="w-full gap-3">
        <View className="w-full flex-row items-center gap-2">
          <Button
            size="md"
            variant="secondary"
            className="flex-1"
            icon={<Icon name={saved ? "check" : "bookmark"} size="sm" color="foreground" />}
            onPress={() => setSaved((s) => !s)}
            accessibilityState={{ selected: saved }}
          >
            {saved ? "On your wishlist" : "Add to wishlist"}
          </Button>
          <Button
            size="icon"
            variant="secondary"
            icon={<Icon name="share" size="sm" color="foreground" />}
            // The share sheet belongs to the host app; the demo only confirms the tap.
            onPress={() => haptic.light()}
            accessibilityLabel="Share Aperture One"
          />
        </View>
        <Button
          size="lg"
          className="w-full"
          icon={installed ? <DrawnCheck /> : undefined}
          onPress={install}
          accessibilityLabel={installed ? "Open Aperture One" : "Get Aperture One"}
        >
          {installed ? "Open" : "Get"}
        </Button>
      </View>
    </View>
  );
}
