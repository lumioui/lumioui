import * as React from "react";
import { View } from "react-native";
import { Icon } from "../icon/icon";
import { Text } from "../text/text";
import { CopyField } from "./copy-field";

/** CopyFieldDemo — the guest Wi-Fi card at a coworking studio's front desk.
 *  The network name copies in one tap; the password stays masked until a
 *  guest asks to see it, but copies either way. */
export function CopyFieldDemo() {
  return (
    <View className="w-full gap-5 rounded-3xl bg-card p-5">
      <View className="flex-row items-center gap-3">
        <View className="h-12 w-12 items-center justify-center rounded-2xl bg-tint-teal">
          <Icon name="wifi" size="md" color="#FFFFFF" />
        </View>
        <View className="flex-1">
          <Text className="text-xl font-bold tracking-tight">Guest Wi-Fi</Text>
          <Text variant="muted">Saltworks Studio · floors 2 and 3</Text>
        </View>
      </View>
      <CopyField label="Network" value="Saltworks-Guest" />
      <CopyField
        label="Password"
        value="tidal-ember-4417"
        masked
        mono
        description="Changes every Monday at 9 AM"
      />
    </View>
  );
}
