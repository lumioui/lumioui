import * as React from "react";
import { View } from "react-native";
import { Accent } from "@lumioui/core";
import { Select, type SelectOption } from "../select";
import { ActionSwapText } from "../../action-swap/action-swap";
import { Button } from "../../button/button";
import { Icon, type IconName } from "../../icon/icon";
import { Text } from "../../text/text";

function Tile({ name, className }: { name: IconName; className: string }) {
  return (
    <View className={`h-9 w-9 items-center justify-center rounded-xl ${className}`}>
      <Icon name={name} size="sm" color="#FFFFFF" />
    </View>
  );
}

const ACCOUNTS: (SelectOption & { balance: number })[] = [
  { value: "main", label: "Everyday", subtitle: "€2,318.06 available", balance: 2318.06, leading: <Tile name="credit-card" className="bg-tint-slate" /> },
  { value: "bills", label: "Bills pot", subtitle: "€640.00 · rent due Nov 1", balance: 640, leading: <Tile name="home" className="bg-tint-amber" /> },
  { value: "save", label: "Rainy day", subtitle: "€5,902.41 · 2.6% AER", balance: 5902.41, leading: <Tile name="leaf" className="bg-tint-green" /> },
  { value: "travel", label: "Japan 2027", subtitle: "€1,120.00 of €3,000", balance: 1120, leading: <Tile name="plane" className="bg-tint-orange" /> },
];

/** SelectPayment — "Move money" between pots in a banking app, green accent.
 *  Two field selects open the bottom sheet of accounts (each with its own
 *  colour tile and balance); the destination list drops whatever is chosen
 *  as the source, and the hero amount checks itself against the balance. */
export function SelectPayment() {
  const [from, setFrom] = React.useState("main");
  const [to, setTo] = React.useState("travel");
  const amount = 750;
  const source = ACCOUNTS.find((a) => a.value === from);
  const short = (source?.balance ?? 0) < amount;
  return (
    <Accent color="green" className="w-full">
      <View className="w-full gap-5 rounded-3xl bg-card p-5">
        <View className="items-center gap-1 py-2">
          <Text variant="muted">Move</Text>
          <Text className="text-5xl font-semibold tracking-tight tabular-nums">€750.00</Text>
          {/* The verdict swaps in place as the source changes. */}
          <ActionSwapText
            value={short ? "short" : "ok"}
            mode="blur"
            className={short ? "text-sm text-destructive" : "text-sm text-muted-foreground"}
          >
            {short ? "More than this pot holds" : "Arrives instantly"}
          </ActionSwapText>
        </View>

        <View className="gap-3">
          <View className="gap-1.5">
            <Text className="text-sm font-medium">From</Text>
            <Select
              value={from}
              onValueChange={(v) => {
                setFrom(v);
                if (v === to) setTo(ACCOUNTS.find((a) => a.value !== v)!.value);
              }}
              options={ACCOUNTS}
              title="Move from"
            />
          </View>
          <View className="gap-1.5">
            <Text className="text-sm font-medium">To</Text>
            <Select
              value={to}
              onValueChange={setTo}
              options={ACCOUNTS.filter((a) => a.value !== from)}
              title="Move to"
            />
          </View>
        </View>

        <Button size="lg" className="w-full" disabled={short}>
          Move €750.00
        </Button>
      </View>
    </Accent>
  );
}
