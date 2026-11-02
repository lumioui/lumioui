import * as React from "react";
import { View } from "react-native";
import { Select, type SelectOption } from "../select";
import { Text } from "../../text/text";

function Dot({ className }: { className: string }) {
  return <View className={`h-3 w-3 rounded-full ${className}`} />;
}

const CALENDARS: SelectOption[] = [
  { value: "work", label: "Work", subtitle: "ines@fernway.co", leading: <Dot className="bg-tint-pink" /> },
  { value: "home", label: "Home", subtitle: "iCloud", leading: <Dot className="bg-tint-teal" /> },
  { value: "climb", label: "Climbing club", subtitle: "Shared by Ravi", leading: <Dot className="bg-tint-orange" /> },
];

const ALERTS: SelectOption[] = [
  { value: "none", label: "None" },
  { value: "0", label: "At time of event" },
  { value: "10", label: "10 minutes before" },
  { value: "30", label: "30 minutes before" },
  { value: "60", label: "1 hour before" },
];

const REPEAT: SelectOption[] = [
  { value: "never", label: "Never" },
  { value: "daily", label: "Every day" },
  { value: "weekly", label: "Every week" },
  { value: "biweekly", label: "Every 2 weeks" },
  { value: "monthly", label: "Every month" },
];

/** SelectSlot — the "New event" sheet of a calendar app in neutral ink. Select's
 *  row variant is a value row: label left, current value + chevron
 *  right; tapping opens the option sheet and the chevron turns to point at
 *  it. Calendars carry their own colour dot; the guest-permissions row is
 *  disabled until there are guests. */
export function SelectSlot() {
  const [calendar, setCalendar] = React.useState("work");
  const [alert, setAlert] = React.useState("10");
  const [repeat, setRepeat] = React.useState("biweekly");
  return (
    <View className="w-full">
      <View className="w-full gap-5">
        <View className="gap-1 rounded-3xl bg-card p-5">
          <Text className="text-2xl font-bold tracking-tight">Design crit</Text>
          <Text variant="muted">Thu, Oct 9 · 2:00–3:00 PM</Text>
          <Text variant="muted">Room 4B, Fernway HQ</Text>
        </View>

        <View className="overflow-hidden rounded-2xl bg-card px-4">
          <Select variant="row" label="Calendar" value={calendar} onValueChange={setCalendar} options={CALENDARS} title="Calendar" />
          <View className="h-px bg-border" />
          <Select variant="row" label="Repeat" value={repeat} onValueChange={setRepeat} options={REPEAT} title="Repeat" />
          <View className="h-px bg-border" />
          <Select variant="row" label="Alert" value={alert} onValueChange={setAlert} options={ALERTS} title="Alert" />
          <View className="h-px bg-border" />
          <Select
            variant="row"
            label="Guests can"
            value=""
            options={[{ value: "invite", label: "Invite others" }]}
            placeholder="Add guests first"
            disabled
          />
        </View>
      </View>
    </View>
  );
}
