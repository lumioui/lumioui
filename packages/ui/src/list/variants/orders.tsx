import * as React from "react";
import { View } from "react-native";
import { List } from "../list";
import { Icon, type IconName } from "../../icon/icon";
import { Text } from "../../text/text";

type Order = {
  id: string;
  store: string;
  items: string;
  status: string;
  total: string;
  icon: IconName;
  tile: string;
};

const ACTIVE: Order[] = [
  { id: "a1", store: "Fernway Coffee", items: "2 bags · Ethiopia Guji", status: "Arriving tomorrow", total: "$38.00", icon: "coffee", tile: "bg-tint-amber" },
];

const PAST: Order[] = [
  { id: "p1", store: "Field & Fern", items: "Monstera, ceramic pot", status: "Delivered Oct 2", total: "$64.50", icon: "leaf", tile: "bg-tint-green" },
  { id: "p2", store: "Paperline", items: "A5 dot notebook ×3", status: "Delivered Sep 24", total: "$27.00", icon: "book-open", tile: "bg-tint-orange" },
  { id: "p3", store: "Halden Running", items: "Trail socks, 3 pack", status: "Returned · refund sent", total: "$18.00", icon: "footprints", tile: "bg-tint-red" },
];

function StoreTile({ icon, tile }: { icon: IconName; tile: string }) {
  return (
    <View className={`h-11 w-11 items-center justify-center rounded-xl ${tile}`}>
      <Icon name={icon} size="md" color="#FFFFFF" />
    </View>
  );
}

/** ListOrders — an order history screen: an in-transit group above past
 *  orders, store marks in colour, totals right-aligned in tabular figures.
 *  The groups switch on a band apart, their rows 40ms apart, and a held
 *  row brightens rather than shades. */
export function ListOrders() {
  const [opened, setOpened] = React.useState<string | null>(null);
  const row = (o: Order) => (
    <List.Item
      key={o.id}
      title={o.store}
      titleClassName="font-medium"
      subtitle={`${o.items}\n${o.status}`}
      leading={<StoreTile icon={o.icon} tile={o.tile} />}
      trailing={
        <Text className="text-[15px] font-medium tabular-nums">{o.total}</Text>
      }
      showChevron
      onPress={() => setOpened(o.id)}
      accessibilityState={{ selected: opened === o.id }}
    />
  );
  return (
    <View className="w-full overflow-hidden rounded-3xl bg-background pt-5">
      <Text className="px-5 pb-4 text-3xl font-bold tracking-tight">Orders</Text>
      <List inset lit switchOn>
        <List.Section title="On the way">
          {ACTIVE.map(row)}
        </List.Section>
        <List.Section title="Past orders">
          {PAST.map((o, i) => (
            <React.Fragment key={o.id}>
              {i > 0 ? <List.Separator inset={72} /> : null}
              {row(o)}
            </React.Fragment>
          ))}
        </List.Section>
      </List>
    </View>
  );
}
