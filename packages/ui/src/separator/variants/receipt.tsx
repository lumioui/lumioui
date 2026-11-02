import * as React from "react";
import { Image, Pressable, View } from "react-native";
import { BAND_STAGGER, SwitchOn } from "@lumioui/core";
import { Separator } from "../separator";
import { Text } from "../../text/text";

const FARE: [string, string][] = [
  ["Trip fare · 7.8 mi, 22 min", "$17.40"],
  ["Booking fee", "$2.35"],
  ["Airport surcharge", "$4.00"],
];
const TIPS = [0, 2, 3, 5];

/** SeparatorReceipt — hairline rules grouping a ride receipt: who drove,
 *  what it cost, how it was paid. The receipt prints as structure switching
 *  on: each band lights 120ms after the last and each rule draws from its
 *  leading edge in its band slot; a perforated tear line sets off the stub.
 *  The tip row is live, so the total under the last rule updates. Neutral ink. */
export function SeparatorReceipt() {
  const [tip, setTip] = React.useState(3);
  const total = 17.4 + 2.35 + 4 + tip;
  return (
    <View className="w-full gap-4 rounded-3xl bg-card p-5">
      <SwitchOn className="flex-row items-center gap-3">
        <Image
          source={{ uri: "https://i.pravatar.cc/150?img=60" }}
          className="h-12 w-12 rounded-full bg-muted"
          accessibilityIgnoresInvertColors
        />
        <View className="flex-1">
          <Text className="text-[17px] font-semibold">Ride with Kwame</Text>
          <Text variant="muted">Grey hybrid · 7KJR 204 · Tue 6:42 PM</Text>
        </View>
      </SwitchOn>

      <Separator draw drawDelay={BAND_STAGGER} />

      <SwitchOn delay={BAND_STAGGER} className="gap-3">
        {FARE.map(([label, amt]) => (
          <View key={label} className="flex-row justify-between gap-3">
            <Text className="flex-1 text-[15px] text-muted-foreground">{label}</Text>
            <Text className="text-[15px] tabular-nums">{amt}</Text>
          </View>
        ))}
        <View className="flex-row items-center justify-between gap-3">
          <Text className="text-[15px] text-muted-foreground">Tip</Text>
          <View className="flex-row gap-1">
            {TIPS.map((t) => (
              <Pressable
                key={t}
                onPress={() => setTip(t)}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel={t === 0 ? "No tip" : `Tip $${t}`}
                accessibilityState={{ selected: tip === t }}
                className={`h-8 min-w-[48px] items-center justify-center rounded-full px-3 ${
                  tip === t ? "bg-primary" : "bg-secondary"
                }`}
              >
                <Text
                  className={`text-sm font-medium tabular-nums ${
                    tip === t ? "text-primary-foreground" : "text-secondary-foreground"
                  }`}
                >
                  {t === 0 ? "None" : `$${t}`}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </SwitchOn>

      <Separator draw drawDelay={BAND_STAGGER * 2} />

      <SwitchOn delay={BAND_STAGGER * 2} className="flex-row items-baseline justify-between">
        <Text className="text-[17px] font-semibold">Total</Text>
        <Text className="text-3xl font-semibold tracking-tight tabular-nums">${total.toFixed(2)}</Text>
      </SwitchOn>

      <Separator perforated draw drawDelay={BAND_STAGGER * 3} className="my-1" />

      <SwitchOn delay={BAND_STAGGER * 3}>
        <Text variant="muted">Charged to card •• 7731 · Receipt sent to your email</Text>
      </SwitchOn>
    </View>
  );
}
