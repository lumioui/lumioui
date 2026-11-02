import * as React from "react";
import { View } from "react-native";
import { Switch } from "../switch";
import { Icon } from "../../icon/icon";
import { Text } from "../../text/text";

/** SwitchStandalone — one consequential toggle on its own card, the copy
 *  under it following the state; plus the built-in label prop and the
 *  disabled flicker when a toggle is locked by policy. */
export function SwitchStandalone() {
  const [sharing, setSharing] = React.useState(true);
  const [cellular, setCellular] = React.useState(true);
  return (
    <View className="w-full gap-4">
      <View className="w-full gap-4 rounded-2xl bg-card p-5">
        <View className="flex-row items-start gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-secondary">
            <Icon name="map-pin" size="sm" color="foreground" />
          </View>
          <View className="flex-1 gap-1">
            <Text className="text-[17px] font-semibold">Share my location</Text>
            <Text variant="muted">
              {sharing
                ? "Jonas and Priya can see where you are until you turn this off."
                : "Nobody can see your location."}
            </Text>
          </View>
          <Switch
            checked={sharing}
            onCheckedChange={setSharing}
            accessibilityLabel="Share my location"
          />
        </View>
      </View>

      <View className="w-full gap-1 rounded-2xl bg-card px-4 py-1">
        <Switch checked={cellular} onCheckedChange={setCellular} label="Back up over cellular" />
        <View className="h-px bg-border" />
        <Switch checked={false} onCheckedChange={() => {}} disabled label="Wi-Fi calling" />
      </View>
      <Text variant="muted" className="px-4">
        Wi-Fi calling is managed by your carrier.
      </Text>
    </View>
  );
}
