import * as React from "react";
import { View } from "react-native";
import { ThemeToggle } from "../theme-toggle";
import { Form } from "../../form/form";
import { Icon, type IconName } from "../../icon/icon";
import { Text } from "../../text/text";

/** Settings-style tile — the row's colour lives in its icon. */
function Tile({ name, className }: { name: IconName; className: string }) {
  return (
    <View className={`h-8 w-8 items-center justify-center rounded-lg ${className}`}>
      <Icon name={name} size="sm" color="#FFFFFF" />
    </View>
  );
}

/** ThemeToggleSwitch — the dark-mode switch in a Display settings group,
 *  next to the rows it lives with. Flip it and the screen follows. */
export function ThemeToggleSwitch() {
  return (
    <View className="w-full gap-6">
      <Text className="px-1 text-3xl font-bold tracking-tight">Display</Text>
      <View className="gap-2">
        <View className="overflow-hidden rounded-2xl bg-card">
          <Form.Row
            label="Dark Mode"
            leading={<Tile name="moon" className="bg-tint-teal" />}
            trailing={<ThemeToggle variant="switch" />}
          />
          <Form.Separator />
          <Form.Row
            label="Text Size"
            leading={<Tile name="type" className="bg-tint-orange" />}
            trailing={
              <View className="flex-row items-center gap-1">
                <Text variant="muted">Default</Text>
                <Icon name="chevron-right" size="sm" color="mutedForeground" />
              </View>
            }
          />
          <Form.Separator />
          <Form.Row
            label="Auto-Lock"
            leading={<Tile name="lock" className="bg-neutral-500" />}
            trailing={
              <View className="flex-row items-center gap-1">
                <Text variant="muted">30 seconds</Text>
                <Icon name="chevron-right" size="sm" color="mutedForeground" />
              </View>
            }
          />
        </View>
        <Text variant="muted" className="px-4">
          Dark Mode applies to every screen in the app.
        </Text>
      </View>
    </View>
  );
}
