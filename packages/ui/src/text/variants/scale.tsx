import * as React from "react";
import { View } from "react-native";
import { BAND_STAGGER, SwitchOn } from "@lumioui/core";
import { Text } from "../text";

/** TextScale — the type scale doing its job in a long-read: display title,
 *  dek, byline, body, a subhead, the accent pull quote and a caption. The
 *  page switches on band by band; the next issue, not out yet, stays dim. */
export function TextScale() {
  return (
    <View className="w-full gap-4 rounded-3xl bg-card p-5">
      <SwitchOn className="gap-2">
        <Text variant="h2">The bees on the roof of 401 Mercer</Text>
        <Text variant="lead">
          Forty thousand honeybees live six floors above a parking garage. They make better honey than the farm upstate.
        </Text>
      </SwitchOn>
      <SwitchOn delay={BAND_STAGGER} className="flex-row items-center gap-2 border-y border-border py-3">
        <Text variant="small">By Hana Kowalczyk</Text>
        <Text variant="muted">· Oct 4 · 9 min read</Text>
      </SwitchOn>
      <SwitchOn delay={BAND_STAGGER * 2} className="gap-4">
        <Text className="leading-6">
          Joel Ambrose checks the hives every Tuesday before the office fills up. The colony arrived in a cardboard box in April; by August it had outgrown two supers.
        </Text>
        <Text variant="h4">Why rooftops work</Text>
        <Text className="leading-6">
          Cities bloom longer than farmland. Street trees, balcony planters and the linden on Spring Street keep forage coming from March to October.
        </Text>
      </SwitchOn>
      <SwitchOn delay={BAND_STAGGER * 3} className="gap-4">
        <Text variant="quote" className="leading-7">
          “Nobody sprays a window box. That is the whole secret.”
        </Text>
        <Text variant="muted">Ambrose sells 60 jars a season from the lobby.</Text>
      </SwitchOn>
      <SwitchOn delay={BAND_STAGGER * 4} className="gap-1 border-t border-border pt-3">
        <Text variant="muted">Next in Rooftops · Friday</Text>
        <Text variant="large" tone="dim" accessibilityLabel="Next issue, out Friday: The hive that wintered on a water tower">
          The hive that wintered on a water tower
        </Text>
      </SwitchOn>
    </View>
  );
}
