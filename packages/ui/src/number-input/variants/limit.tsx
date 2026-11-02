import * as React from "react";
import { View } from "react-native";
import { Accent } from "@lumioui/core";
import { NumberInput } from "../number-input";
import { Button } from "../../button/button";
import { Progress } from "../../progress/progress";
import { Text } from "../../text/text";

const SPENT = 1240;

/** NumberInputLimit — a card's monthly spending limit in a banking app.
 *  $50 steps from $250 to $10,000; type 20000 and the field shakes back
 *  to the cap with the allowed range spelled out. The bar shows how much
 *  of the new limit this month has used. Green, for money. */
export function NumberInputLimit() {
  const [limit, setLimit] = React.useState(2000);
  const used = Math.min(100, (SPENT / limit) * 100);
  return (
    <Accent color="green" className="w-full">
      <View className="w-full gap-6">
        <View className="gap-1 px-1">
          <Text className="text-2xl font-bold tracking-tight">Monthly limit</Text>
          <Text variant="muted">Debit card ending 7314</Text>
        </View>

        <NumberInput
          value={limit}
          onValueChange={setLimit}
          min={250}
          max={10000}
          step={50}
          prefix="$"
          size="lg"
          accessibilityLabel="Monthly spending limit"
          helper="Card payments and ATM withdrawals count toward this."
        />

        <View className="gap-2 rounded-2xl bg-card p-4">
          <View className="flex-row justify-between">
            <Text className="text-[15px] font-medium">Spent in November</Text>
            <Text className="text-[15px] font-semibold tabular-nums">{`$${SPENT.toLocaleString("en-US")}`}</Text>
          </View>
          <Progress value={used} className="h-1.5" />
          <Text variant="muted">
            {SPENT >= limit
              ? "New payments will be declined until 1 December."
              : `$${(limit - SPENT).toLocaleString("en-US")} left until 1 December`}
          </Text>
        </View>

        <Button size="lg" className="w-full">
          Save limit
        </Button>
      </View>
    </Accent>
  );
}
