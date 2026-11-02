import * as React from "react";
import { View } from "react-native";
import { AnimatedPressable, cn, useHaptic, usePressAnimation } from "@lumioui/core";
import { Icon, type IconName } from "../icon";
import { Text } from "../../text/text";

const MAILBOXES: { name: string; icon: IconName; count?: number }[] = [
  { name: "Inbox", icon: "mail", count: 12 },
  { name: "VIP", icon: "star", count: 3 },
  { name: "Flagged", icon: "flag", count: 1 },
  { name: "Drafts", icon: "file-text" },
  { name: "Sent", icon: "send" },
  { name: "Archive", icon: "archive" },
  { name: "Trash", icon: "trash" },
];

/** IconGallery — icons where they earn their keep: the leading glyph of
 *  every mailbox row, in the app's ink. Tap a
 *  mailbox to open it; the selected star fills. */
export function IconGallery() {
  const [open, setOpen] = React.useState("Inbox");
  return (
    <View className="w-full">
      <View className="w-full gap-3">
        <View className="flex-row items-center justify-between px-1">
          <Text className="text-3xl font-bold tracking-tight">Mailboxes</Text>
          <Icon name="edit" size="md" color="primaryText" accessibilityLabel="New message" />
        </View>
        <View className="w-full overflow-hidden rounded-2xl bg-card">
          {MAILBOXES.map((m, i) => (
            <MailboxRow
              key={m.name}
              {...m}
              first={i === 0}
              selected={open === m.name}
              onPress={() => setOpen(m.name)}
            />
          ))}
        </View>
        <Text variant="muted" className="px-4">Updated just now · 3 unread in VIP</Text>
      </View>
    </View>
  );
}

function MailboxRow({
  name,
  icon,
  count,
  first,
  selected,
  onPress,
}: {
  name: string;
  icon: IconName;
  count?: number;
  first: boolean;
  selected: boolean;
  onPress: () => void;
}) {
  const haptics = useHaptic();
  const press = usePressAnimation();
  return (
    <AnimatedPressable
      onPress={() => {
        haptics.selection();
        onPress();
      }}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      style={press.animatedStyle}
      className={cn("min-h-12 flex-row items-center gap-3 pl-4", selected && "bg-secondary")}
      accessibilityRole="button"
      accessibilityLabel={count ? `${name}, ${count} unread` : name}
      accessibilityState={{ selected }}
    >
      <Icon name={icon} size="md" color="primaryText" filled={icon === "star" && selected} />
      <View
        className={cn(
          "min-h-12 flex-1 flex-row items-center gap-2 pr-4",
          !first && "border-t border-border"
        )}
      >
        <Text className="flex-1 text-base">{name}</Text>
        {count ? <Text className="text-base text-muted-foreground tabular-nums">{count}</Text> : null}
        <Icon name="chevron-right" size="sm" color="mutedForeground" />
      </View>
    </AnimatedPressable>
  );
}
