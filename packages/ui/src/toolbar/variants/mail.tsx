import * as React from "react";
import { View } from "react-native";
import { cn } from "@lumioui/core";
import { Toolbar } from "../toolbar";
import { Text } from "../../text/text";

const MAIL = [
  { from: "Harbor Credit Union", subject: "Your October statement is ready", preview: "Statement period Oct 1 – Oct 31. Log in to view…", time: "9:41 AM", unread: true },
  { from: "Imogen Clarke", subject: "Re: Saturday climbing", preview: "Wall opens at 10, I'll bring the spare harness.", time: "8:12 AM", unread: true },
  { from: "Parcelwise", subject: "Out for delivery", preview: "Your order #77120 arrives today between 1 and 3 PM.", time: "7:30 AM", unread: false },
  { from: "Dev Patel", subject: "Draft deck for Thursday", preview: "Slides 4–9 still need the new churn numbers.", time: "Yesterday", unread: true },
  { from: "Greenline Transit", subject: "Service change on Line 4", preview: "Weekend closures between Elm St and Riverside.", time: "Yesterday", unread: false },
  { from: "Sofia Marchetti", subject: "Photos from the wedding", preview: "Finally sorted them, link expires in a week!", time: "Mon", unread: true },
];

/** ToolbarMail — the bottom toolbar of a mail inbox. Filter
 *  toggles the unread-only view (the glyph pops and tints, the status line
 *  updates), Compose sits on the trailing edge. Ink chrome. */
export function ToolbarMail() {
  const [filtered, setFiltered] = React.useState(false);
  const rows = filtered ? MAIL.filter((m) => m.unread) : MAIL;
  const unread = MAIL.filter((m) => m.unread).length;

  return (
    <View className="w-full overflow-hidden rounded-3xl bg-card">
      <View className="gap-1 px-4 pb-2 pt-5">
        <Text className="text-3xl font-bold tracking-tight">Inbox</Text>
      </View>
      <View style={{ height: 460 }}>
        {rows.map((m, i) => (
          <View key={m.subject}>
            {i > 0 ? <View className="ml-8 h-px bg-border" /> : null}
            <View className="flex-row gap-3 py-3 pl-3 pr-4">
              <View className="w-2 items-center pt-2">
                {m.unread ? <View className="h-2 w-2 rounded-full bg-primary" /> : null}
              </View>
              <View className="flex-1 gap-0.5">
                <View className="flex-row items-center justify-between gap-2">
                  <Text numberOfLines={1} className={cn("flex-1 text-base", m.unread ? "font-semibold" : "font-medium")}>
                    {m.from}
                  </Text>
                  <Text className="text-sm text-muted-foreground">{m.time}</Text>
                </View>
                <Text numberOfLines={1} className="text-[15px]">
                  {m.subject}
                </Text>
                <Text numberOfLines={1} className="text-sm text-muted-foreground">
                  {m.preview}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>
      <Toolbar>
        <Toolbar.Item icon="list" label={filtered ? "Show all mail" : "Filter unread"} active={filtered} onPress={() => setFiltered((f) => !f)} />
        <Toolbar.Status
          title={filtered ? "Filtered by: Unread" : "Updated just now"}
          subtitle={filtered ? `${unread} messages` : `${unread} unread`}
        />
        <Toolbar.Item icon="edit" label="Compose" />
      </Toolbar>
    </View>
  );
}
