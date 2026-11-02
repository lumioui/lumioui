import * as React from "react";
import { View } from "react-native";
import { Accent } from "@lumioui/core";
import { Tooltip } from "../tooltip";
import { Button } from "../../button/button";
import { Icon } from "../../icon/icon";
import { Text } from "../../text/text";

function Line({ label, value, hint }: { label: string; value: string; hint?: boolean }) {
  return (
    <View className="min-h-[44px] flex-row items-center justify-between">
      <View className="flex-row items-center gap-1.5">
        <Text className="text-[15px] text-muted-foreground">{label}</Text>
        {hint ? <Icon name="info" size="sm" color="mutedForeground" /> : null}
      </View>
      <Text className="text-[15px] font-medium tabular-nums">{value}</Text>
    </View>
  );
}

/** TooltipFees — an international transfer quote. Hold the fee or rate row:
 *  it charges with light, the rest of the quote dims around it, and the
 *  answer appears right where the doubt arose. Money → green. */
export function TooltipFees() {
  return (
    <Accent color="green" className="w-full">
      <View className="w-full gap-5 rounded-3xl bg-card p-5">
        <View className="gap-1">
          <Text variant="muted">You send</Text>
          <Text className="text-5xl font-semibold tracking-tight tabular-nums">£500.00</Text>
        </View>

        <View className="border-y border-border py-1">
          <Tooltip content="Our 0.41% fee plus a fixed £1.07. Already taken off what Lena gets.">
            <Line label="Fee" value="− £3.12" hint />
          </Tooltip>
          <Tooltip content="Mid-market rate from 10:42 AM. Locked for the next 24 hours.">
            <Line label="Rate" value="1 GBP = 1.1697 EUR" hint />
          </Tooltip>
          <Line label="Arrives" value="Today, by 3 PM" />
        </View>

        <View className="gap-1">
          <Text variant="muted">Lena Brandt gets</Text>
          <Text className="text-3xl font-semibold tracking-tight tabular-nums">€581.20</Text>
        </View>

        <Button size="lg" className="w-full">Continue</Button>
      </View>
    </Accent>
  );
}
