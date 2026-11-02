import * as React from "react";
import { View } from "react-native";
import { Accent } from "@lumioui/core";
import { RadioGroup, RadioGroupItem } from "../radio-group";
import { ActionSwapText } from "../../action-swap/action-swap";
import { Button } from "../../button/button";
import { Icon, type IconName } from "../../icon/icon";
import { Text } from "../../text/text";

interface Slot {
  value: string;
  label: string;
  note: string;
  fee: number;
  icon: IconName;
  /** Short form for the confirm button. */
  short: string;
}

const SLOTS: Slot[] = [
  { value: "tonight", label: "Today, 6–8pm", note: "Rider leaves Fernhill Market at 5:40", fee: 3.5, icon: "clock", short: "tonight" },
  { value: "morning", label: "Tomorrow morning", note: "8–11am · chilled bags kept cold", fee: 1.9, icon: "sun", short: "tomorrow" },
  { value: "locker", label: "Pickup at locker", note: "Locker 14, Mill Lane · ready by 4pm", fee: 0, icon: "package", short: "locker pickup" },
  { value: "express", label: "Within the hour", note: "No riders free nearby right now", fee: 6.9, icon: "zap", short: "express" },
];

const fee = (n: number) => (n === 0 ? "Free" : `€${n.toFixed(2)}`);
const SUBTOTAL = 42.6;

/** RadioDelivery — the delivery-window step of a grocery checkout sheet in
 *  green. Each window is a card row: the picked ring lights its row (a pool
 *  of accent light that settles faint), the border and wash crossfade, and
 *  the pay button's label swaps in place to the new window and total. The
 *  express window is out of riders and stays disabled. */
export function RadioDelivery() {
  const [slot, setSlot] = React.useState("tonight");
  const picked = SLOTS.find((s) => s.value === slot) ?? SLOTS[0]!;
  const total = `€${(SUBTOTAL + picked.fee).toFixed(2)}`;
  return (
    <Accent color="green" className="w-full">
      <View className="w-full gap-4 rounded-3xl bg-card p-5">
        <View className="gap-1">
          <Text className="text-2xl font-bold tracking-tight">When should it arrive?</Text>
          <Text variant="muted">14 items · 22 Orchard Row, flat 3</Text>
        </View>
        <RadioGroup value={slot} onValueChange={setSlot} accessibilityLabel="Delivery window" className="gap-2">
          {SLOTS.map((s) => (
            <RadioGroupItem
              key={s.value}
              value={s.value}
              label={s.label}
              subtitle={s.note}
              surface="card"
              disabled={s.value === "express"}
              indicatorPosition="trailing"
              accessibilityLabel={`${s.label}, ${fee(s.fee)}`}
              leading={
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-muted">
                  <Icon name={s.icon} size="sm" color="foreground" />
                </View>
              }
              trailing={
                <Text className="text-base font-semibold tabular-nums">{fee(s.fee)}</Text>
              }
            />
          ))}
        </RadioGroup>
        <Button size="lg" className="w-full" accessibilityLabel={`Pay ${total}, ${picked.label}`}>
          <ActionSwapText value={picked.value} className="text-[17px] font-semibold text-primary-foreground">
            {`Pay ${total} · ${picked.short}`}
          </ActionSwapText>
        </Button>
      </View>
    </Accent>
  );
}
