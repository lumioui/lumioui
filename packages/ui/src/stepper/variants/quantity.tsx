import * as React from "react";
import { View } from "react-native";
import { Accent } from "@lumioui/core";
import { Stepper } from "../stepper";
import { Button } from "../../button/button";
import { Icon, type IconName } from "../../icon/icon";
import { Text } from "../../text/text";

interface Line {
  id: string;
  name: string;
  unit: string;
  price: number;
  icon: IconName;
  tile: string;
  max: number;
}

const LINES: Line[] = [
  { id: "carrots", name: "Heirloom carrots", unit: "500 g bunch", price: 2.85, icon: "carrot", tile: "bg-tint-orange", max: 10 },
  { id: "sourdough", name: "Rye sourdough", unit: "800 g loaf", price: 5.4, icon: "wheat", tile: "bg-tint-amber", max: 4 },
  { id: "beans", name: "Espresso beans", unit: "1 kg · Brazil Cerrado", price: 21.9, icon: "coffee", tile: "bg-stone-700", max: 3 },
];

/** StepperQuantity — a grocery basket in orange. Each line owns a metered
 *  stepper: an orange fill behind the count grows toward the line's limit,
 *  the number lifts up or sinks with the step, the subtotal and the checkout
 *  button follow. The beans line reaches its 3-bag limit — the fill meets
 *  the edge and lights it — and a further + flickers that lit edge. */
export function StepperQuantity() {
  const [qty, setQty] = React.useState<Record<string, number>>({ carrots: 2, sourdough: 1, beans: 1 });
  const subtotal = LINES.reduce((sum, l) => sum + l.price * (qty[l.id] ?? 0), 0);
  const items = Object.values(qty).reduce((a, b) => a + b, 0);
  return (
    <Accent color="orange" className="w-full">
      <View className="w-full gap-4">
        <View className="flex-row items-end justify-between px-1">
          <Text className="text-3xl font-bold tracking-tight">Basket</Text>
          <Text variant="muted" className="pb-1">Delivery Thu, 8–10 AM</Text>
        </View>
        <View className="overflow-hidden rounded-2xl bg-card">
          {LINES.map((l, i) => {
            const n = qty[l.id] ?? 0;
            return (
              <View key={l.id}>
                {i > 0 ? <View className="ml-[76px] h-px bg-border" /> : null}
                <View className="flex-row items-center gap-3 px-4 py-3">
                  <View className={`h-12 w-12 items-center justify-center rounded-xl ${l.tile}`}>
                    <Icon name={l.icon} size="md" color="#FFFFFF" />
                  </View>
                  <View className="min-w-0 flex-1 gap-0.5">
                    <Text className="text-[15px] font-medium" numberOfLines={1}>{l.name}</Text>
                    <Text variant="muted" numberOfLines={1}>{l.unit}</Text>
                    <Text className="text-[15px] font-semibold tabular-nums">€{(l.price * n).toFixed(2)}</Text>
                  </View>
                  <Stepper
                    value={n}
                    onValueChange={(v) => setQty((s) => ({ ...s, [l.id]: v }))}
                    min={1}
                    max={l.max}
                    meter
                    accessibilityLabel={`${l.name} quantity`}
                  />
                </View>
              </View>
            );
          })}
        </View>
        <Button size="lg" className="w-full">
          {`Checkout · ${items} items · €${subtotal.toFixed(2)}`}
        </Button>
      </View>
    </Accent>
  );
}
