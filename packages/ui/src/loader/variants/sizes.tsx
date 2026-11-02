import * as React from "react";
import { Pressable, View } from "react-native";
import { Loader } from "../loader";
import { Icon, type IconName } from "../../icon/icon";
import { Text } from "../../text/text";

const BOXES: { name: string; icon: IconName; count?: string }[] = [
  { name: "Inbox", icon: "mail" },
  { name: "Drafts", icon: "file-text", count: "2" },
  { name: "Archive", icon: "archive", count: "1,318" },
];

/** LoaderSizes — every size where a mail app actually needs it: 16 inline in
 *  the send status, 22 trailing a syncing mailbox row, 40 opening a message.
 *  Tap Inbox to sync it again. */
export function LoaderSizes() {
  const [syncing, setSyncing] = React.useState(true);
  React.useEffect(() => {
    if (!syncing) return;
    const t = setTimeout(() => setSyncing(false), 2600);
    return () => clearTimeout(t);
  }, [syncing]);

  return (
    <View className="w-full gap-6">
      <View className="gap-2">
        <Text className="px-1 text-2xl font-bold tracking-tight">Mailboxes</Text>
        <View className="overflow-hidden rounded-2xl bg-card">
          {BOXES.map((b, i) => (
            <Pressable
              key={b.name}
              onPress={b.name === "Inbox" ? () => setSyncing(true) : undefined}
              accessibilityRole="button"
              accessibilityLabel={b.name === "Inbox" && syncing ? "Inbox, syncing" : b.name}
              className="flex-row items-center gap-3 pl-4"
            >
              <Icon name={b.icon} size="md" color="primary" />
              <View className={`h-12 flex-1 flex-row items-center gap-2 pr-4 ${i > 0 ? "border-t border-border" : ""}`}>
                <Text className="flex-1 text-base">{b.name}</Text>
                {b.name === "Inbox" ? (
                  syncing ? (
                    <Loader size={22} color="mutedForeground" label="Syncing inbox" />
                  ) : (
                    <Text className="text-base text-muted-foreground tabular-nums">14</Text>
                  )
                ) : (
                  <Text className="text-base text-muted-foreground tabular-nums">{b.count}</Text>
                )}
                <Icon name="chevron-right" size="sm" color="mutedForeground" />
              </View>
            </Pressable>
          ))}
        </View>
        <View className="flex-row items-center justify-center gap-2 pt-1">
          <Loader size={16} color="mutedForeground" label="Sending" />
          <Text variant="muted">Sending to Theo Marchetti…</Text>
        </View>
      </View>

      <View className="items-center gap-3 rounded-2xl bg-card px-5 py-8">
        <Loader size={40} label="Opening message" />
        <View className="items-center gap-1">
          <Text className="text-[17px] font-semibold">Opening message</Text>
          <Text variant="muted">Lease renewal · 3 attachments</Text>
        </View>
      </View>
    </View>
  );
}
