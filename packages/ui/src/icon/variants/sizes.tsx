import * as React from "react";
import { Pressable, View } from "react-native";
import { Accent, useHaptic } from "@lumioui/core";
import { Icon, type IconName } from "../icon";
import { Text } from "../../text/text";
import { ActionSwapText } from "../../action-swap/action-swap";

/** IconSizes — each size where it lives on a maps place sheet: xl in the
 *  category disc, md in the sheet toolbar, lg on the action tiles, sm in
 *  the metadata line. Tap Save and the fill ignites inside the bookmark
 *  while the label swaps to "Saved" in place; tap again and the fill dims. */
export function IconSizes() {
  const haptics = useHaptic();
  const [saved, setSaved] = React.useState(false);
  const actions: { label: string; icon: IconName; onPress?: () => void; active?: boolean }[] = [
    { label: "Directions", icon: "car" },
    { label: "Call", icon: "phone" },
    { label: "Website", icon: "globe" },
    {
      label: saved ? "Saved" : "Save",
      icon: "bookmark",
      active: saved,
      onPress: () => {
        haptics.selection();
        setSaved((s) => !s);
      },
    },
  ];
  return (
    <Accent color="orange" className="w-full">
      <View className="w-full gap-5 rounded-3xl bg-card p-5">
        {/* Icon and actions share the top row; the name gets the full width
            below, so it never wraps word by word on a narrow phone. */}
        <View className="flex-row items-start justify-between gap-3">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-tint-orange">
            <Icon name="coffee" size="xl" color="#FFFFFF" />
          </View>
          <View className="flex-row gap-2">
            <View className="h-11 w-11 items-center justify-center rounded-full bg-secondary">
              <Icon name="share" size="md" accessibilityLabel="Share place" />
            </View>
            <View className="h-11 w-11 items-center justify-center rounded-full bg-secondary">
              <Icon name="x" size="md" accessibilityLabel="Close" />
            </View>
          </View>
        </View>
        <View className="-mt-2 gap-1">
          <Text className="text-2xl font-bold tracking-tight">Juniper & Rye</Text>
          <Text variant="muted">Coffee shop · Mill Quarter</Text>
        </View>

        <View className="flex-row gap-2">
          {actions.map((a) => (
            <Pressable
              key={a.icon}
              onPress={a.onPress}
              className="h-16 flex-1 items-center justify-center gap-1 rounded-xl bg-secondary"
              accessibilityRole="button"
              accessibilityLabel={a.label}
              accessibilityState={a.active != null ? { selected: a.active } : undefined}
            >
              <Icon name={a.icon} size="lg" color={a.active ? "primaryText" : "foreground"} filled={a.active} />
              {a.onPress ? (
                <ActionSwapText
                  value={a.label}
                  className={a.active ? "text-xs font-medium text-primary-text" : "text-xs font-medium text-foreground"}
                >
                  {a.label}
                </ActionSwapText>
              ) : (
                <Text className="text-xs font-medium">{a.label}</Text>
              )}
            </Pressable>
          ))}
        </View>

        <View className="flex-row flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-4">
          <View className="flex-row items-center gap-1">
            <Icon name="star" size="sm" color="foreground" filled />
            <Text className="text-sm font-medium tabular-nums">4.7</Text>
            <Text variant="muted">(312)</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Icon name="clock" size="sm" color="success" />
            <Text className="text-sm">Open until 4 PM</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Icon name="map-pin" size="sm" color="mutedForeground" />
            <Text variant="muted">0.6 mi</Text>
          </View>
        </View>
      </View>
    </Accent>
  );
}
