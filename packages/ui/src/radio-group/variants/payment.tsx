import * as React from "react";
import { View } from "react-native";
import { Accent } from "@lumioui/core";
import { RadioGroup, RadioGroupItem } from "../radio-group";
import { ActionSwapText } from "../../action-swap/action-swap";
import { Button } from "../../button/button";
import { Text } from "../../text/text";

interface Plan {
  value: string;
  label: string;
  price: string;
  note: string;
  save?: string;
}

const PLANS: Plan[] = [
  { value: "yearly", label: "Yearly", price: "$79.99/yr", note: "$6.67 a month, billed once", save: "Save 33%" },
  { value: "monthly", label: "Monthly", price: "$9.99/mo", note: "Cancel anytime" },
  { value: "family", label: "Family", price: "$14.99/mo", note: "Up to 6 accounts, one bill" },
];

/** RadioPayment — a music app's plan picker in pink. Plans are card rows:
 *  the picked ring lights its row, the border and accent wash crossfade on
 *  timing.normal, and the line under the CTA swaps in place to restate
 *  what you'll be charged. */
export function RadioPayment() {
  const [plan, setPlan] = React.useState("yearly");
  const picked = PLANS.find((p) => p.value === plan) ?? PLANS[0]!;
  return (
    <Accent color="pink" className="w-full">
      <View className="w-full gap-5 rounded-3xl bg-card p-5">
        <View className="gap-1">
          <Text className="text-2xl font-bold tracking-tight">Try Fernway Plus free for 30 days</Text>
          <Text variant="muted">Ad-free listening, offline downloads, lossless audio.</Text>
        </View>
        <RadioGroup value={plan} onValueChange={setPlan} accessibilityLabel="Plan" className="gap-2">
          {PLANS.map((p) => {
            return (
              <RadioGroupItem
                key={p.value}
                value={p.value}
                accessibilityLabel={`${p.label}, ${p.price}`}
                indicatorPosition="trailing"
                surface="card"
              >
                <View className="min-w-0 flex-1 gap-0.5">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-base font-semibold">{p.label}</Text>
                    {p.save ? (
                      <View className="rounded-full bg-primary px-2 py-0.5">
                        <Text className="text-xs font-semibold text-primary-foreground">{p.save}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text variant="muted" numberOfLines={1}>{p.note}</Text>
                </View>
                <Text className="text-base font-semibold tabular-nums">{p.price}</Text>
              </RadioGroupItem>
            );
          })}
        </RadioGroup>
        <View className="gap-2">
          <Button size="lg" className="w-full">Start free trial</Button>
          <ActionSwapText value={picked.value} className="self-center text-center text-sm text-muted-foreground">
            {`Then ${picked.price} after Nov 6. Cancel in Settings.`}
          </ActionSwapText>
        </View>
      </View>
    </Accent>
  );
}
