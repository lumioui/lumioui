import * as React from "react";
import { View } from "react-native";
import { DropdownMenu } from "../dropdown-menu";
import { Avatar } from "../../avatar/avatar";
import { Icon } from "../../icon/icon";
import { Text } from "../../text/text";

/** DropdownThread — the overflow menu on an email thread (⋮ in
 *  the header, leading icons, a divider before the destructive item).
 *  Each choice visibly changes the thread. */
export function DropdownThread() {
  const [status, setStatus] = React.useState<string | null>(null);
  const [unread, setUnread] = React.useState(false);

  return (
    <View className="w-full overflow-hidden rounded-3xl bg-card">
      <View className="flex-row items-start gap-3 px-5 pb-3 pt-5">
        <View className="flex-1 gap-1">
          <Text className="text-[22px] font-semibold leading-tight tracking-tight">Venue shortlist for the offsite</Text>
          <View className="flex-row items-center gap-2">
            <View className="rounded-md bg-secondary px-2 py-0.5">
              <Text className="text-xs font-medium text-secondary-foreground">Planning</Text>
            </View>
            {status ? <Text variant="muted">{status}</Text> : null}
          </View>
        </View>
        <DropdownMenu>
          <DropdownMenu.Trigger
            lit
            accessibilityLabel="Thread options"
            className="h-11 w-11 items-center justify-center rounded-full"
          >
            <Icon name="more-vertical" size="md" color="foreground" />
          </DropdownMenu.Trigger>
          <DropdownMenu.Content align="end">
            <DropdownMenu.Item
              icon={<Icon name="mail" size="sm" color="mutedForeground" />}
              onPress={() => { setUnread((u) => !u); setStatus(null); }}
            >
              {unread ? "Mark as read" : "Mark as unread"}
            </DropdownMenu.Item>
            <DropdownMenu.Item
              icon={<Icon name="clock" size="sm" color="mutedForeground" />}
              onPress={() => setStatus("Snoozed until tomorrow, 8 AM")}
            >
              Snooze until tomorrow
            </DropdownMenu.Item>
            <DropdownMenu.Item
              icon={<Icon name="volume" size="sm" color="mutedForeground" />}
              onPress={() => setStatus("Muted · new replies stay archived")}
            >
              Mute thread
            </DropdownMenu.Item>
            <DropdownMenu.Separator />
            <DropdownMenu.Item
              destructive
              icon={<Icon name="trash" size="sm" color="destructive" />}
              onPress={() => setStatus("Moved to Trash")}
            >
              Move to Trash
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu>
      </View>

      <View className="flex-row gap-3 border-t border-border px-5 py-4">
        <Avatar size="md" source={{ uri: "https://i.pravatar.cc/150?img=47" }} fallback="HL" alt="Hannah Lindqvist" />
        <View className="flex-1 gap-1">
          <View className="flex-row items-baseline justify-between">
            <Text className={unread ? "text-base font-bold" : "text-base font-medium"}>Hannah Lindqvist</Text>
            <Text variant="muted">9:14 AM</Text>
          </View>
          <Text className="text-[15px] leading-snug text-muted-foreground" numberOfLines={3}>
            Narrowed it to three: the boathouse in Sausalito, Hotel Ardent, and the old mill in Petaluma. Boathouse holds 40 and has the best rate for a Thursday.
          </Text>
          <View className="flex-row items-center gap-1 pt-1">
            <Icon name="paperclip" size="sm" color="mutedForeground" />
            <Text variant="muted">venue-quotes.pdf</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
