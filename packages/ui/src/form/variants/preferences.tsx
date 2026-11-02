import * as React from "react";
import { View } from "react-native";
import { Form } from "../form";
import { Icon, type IconName } from "../../icon/icon";
import { Switch } from "../../switch/switch";
import { Text } from "../../text/text";

/** Settings-style tile — the row's colour lives in its icon, not the chrome. */
function Tile({ name, className }: { name: IconName; className: string }) {
  return (
    <View className={`h-8 w-8 items-center justify-center rounded-lg ${className}`}>
      <Icon name={name} size="sm" color="#FFFFFF" />
    </View>
  );
}

const ALERTS = ["None", "At time of event", "5 minutes before", "15 minutes before", "1 hour before"];
const ZONES = ["Central European", "Eastern", "Gulf", "Pacific"];

/** FormPreferences — a calendar app's settings page built from Form.Section,
 *  Form.Row and Form.Separator. Switch rows stay still when tapped (only
 *  navigating rows highlight); "Default alert" and "Time Zone" cycle their
 *  value on tap and the new value swaps in place (dim / ignite), and
 *  turning off Time Zone Override crossfades the zone row to disabled. */
export function FormPreferences() {
  const [override, setOverride] = React.useState(true);
  const [declined, setDeclined] = React.useState(false);
  const [birthdays, setBirthdays] = React.useState(true);
  const [alert, setAlert] = React.useState(3);
  const [zone, setZone] = React.useState(0);
  return (
    // Stretch across the column, then bleed into its padding so the grouped
    // sections line up with the column edges (Form.Section insets itself).
    <View className="-mx-4 self-stretch">
      <Text className="mx-4 mb-5 text-3xl font-bold tracking-tight">Calendar</Text>

      <Form.Section title="Events" footer="Applies to new events on every calendar.">
        <Form.Row
          label="Default alert"
          leading={<Tile name="bell" className="bg-tint-red" />}
          value={ALERTS[alert]}
          showChevron
          onPress={() => setAlert((a) => (a + 1) % ALERTS.length)}
        />
        <Form.Separator className="ml-[60px]" />
        <Form.Row
          label="Show declined events"
          leading={<Tile name="x" className="bg-zinc-500" />}
          trailing={<Switch checked={declined} onCheckedChange={setDeclined} />}
        />
        <Form.Separator className="ml-[60px]" />
        <Form.Row
          label="Birthdays"
          description="From your contacts"
          leading={<Tile name="star" className="bg-tint-amber" />}
          trailing={<Switch checked={birthdays} onCheckedChange={setBirthdays} />}
        />
      </Form.Section>

      <Form.Section title="Time zone" footer={override ? `Event times show in ${ZONES[zone]} time, wherever you are.` : "Event times follow your current location."}>
        <Form.Row
          label="Time Zone Override"
          leading={<Tile name="globe" className="bg-tint-teal" />}
          trailing={<Switch checked={override} onCheckedChange={setOverride} />}
        />
        <Form.Separator className="ml-[60px]" />
        <Form.Row
          label="Time Zone"
          leading={<Tile name="clock" className="bg-tint-slate" />}
          value={ZONES[zone]}
          showChevron
          disabled={!override}
          onPress={() => setZone((z) => (z + 1) % ZONES.length)}
        />
      </Form.Section>
    </View>
  );
}
