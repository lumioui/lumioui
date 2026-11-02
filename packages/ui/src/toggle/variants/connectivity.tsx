import * as React from "react";
import { View } from "react-native";
import { Accent } from "@lumioui/core";
import { Toggle } from "../toggle";
import { Form } from "../../form/form";
import { Icon, type IconName } from "../../icon/icon";
import { Text } from "../../text/text";

function Tile({ name, className }: { name: IconName; className: string }) {
  return (
    <View className={`h-8 w-8 items-center justify-center rounded-lg ${className}`}>
      <Icon name={name} size="sm" color="#FFFFFF" />
    </View>
  );
}

/** ToggleConnectivity — switch-style toggles in a travel eSIM app's line
 *  settings. Roaming gates the rows below it; the usage meter on top shows
 *  what the plan is for. Teal for travel. */
export function ToggleConnectivity() {
  const [roaming, setRoaming] = React.useState(true);
  const [lowData, setLowData] = React.useState(false);
  const [hotspot, setHotspot] = React.useState(false);
  return (
    <Accent color="teal" className="w-full">
      <View className="w-full gap-6">
        <View className="w-full gap-3 rounded-2xl bg-card p-4">
          <View className="flex-row items-center gap-2">
            <Icon name="globe" size="sm" color="primary" />
            <Text className="flex-1 text-[17px] font-semibold">Japan · 10 GB</Text>
            <Text variant="muted">12 days left</Text>
          </View>
          <View className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <View className="h-full w-5/12 rounded-full bg-primary" />
          </View>
          <Text variant="muted" className="tabular-nums">4.2 GB of 10 GB used</Text>
        </View>

        <View className="gap-2">
          <View className="overflow-hidden rounded-2xl bg-card">
            <Form.Row
              label="Data roaming"
              description={roaming ? "Using Travelink on Sakura Mobile" : "Off · no data abroad"}
              leading={<Tile name="globe" className="bg-tint-teal" />}
              trailing={<Toggle pressed={roaming} onPressedChange={setRoaming} accessibilityLabel="Data roaming" />}
            />
            <Form.Separator />
            <Form.Row
              label="Low Data Mode"
              leading={<Tile name="droplet" className="bg-tint-amber" />}
              trailing={
                <Toggle pressed={lowData && roaming} onPressedChange={setLowData} disabled={!roaming} accessibilityLabel="Low Data Mode" />
              }
            />
            <Form.Separator />
            <Form.Row
              label="Personal Hotspot"
              leading={<Tile name="wifi" className="bg-tint-green" />}
              trailing={
                <Toggle pressed={hotspot && roaming} onPressedChange={setHotspot} disabled={!roaming} accessibilityLabel="Personal Hotspot" />
              }
            />
          </View>
          <Text variant="muted" className="px-4">
            Low Data Mode pauses photo backups and app updates until you're on Wi-Fi.
          </Text>
        </View>
      </View>
    </Accent>
  );
}
