import * as React from "react";
import { View } from "react-native";
import { Accent } from "@lumioui/core";
import { Tooltip } from "../tooltip";
import { Icon } from "../../icon/icon";
import { Image } from "../../image/image";
import { Text } from "../../text/text";

const STEPS = ["Ordered", "Shipped", "Out for delivery", "Delivered"];

/** TooltipEta — a parcel tracker. Long-press the delivery window to see how
 *  the estimate was worked out; long-press a step for its timestamp.
 *  Shopping/rewards → amber. */
export function TooltipEta() {
  const current = 2;
  return (
    <Accent color="amber" className="w-full">
      <View className="w-full gap-5 rounded-3xl bg-card p-5">
        <View className="flex-row items-center gap-3">
          <Image
            source={{ uri: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=200&h=200&fit=crop&q=70&auto=format" }}
            alt="Parcel contents"
            rounded="lg"
            className="h-14 w-14"
          />
          <View className="flex-1">
            <Text className="text-[15px] font-semibold">Vitamin D3 and travel kit</Text>
            <Text variant="muted">Order #W-20481 · 2 items</Text>
          </View>
        </View>

        <Tooltip content="Courier is 6 stops away. Estimates update every 10 minutes.">
          <View className="gap-1">
            <Text variant="muted">Arriving today</Text>
            <View className="flex-row items-center gap-2">
              <Text className="text-4xl font-semibold tracking-tight tabular-nums">4:10 to 6:00</Text>
              <Icon name="info" size="sm" color="mutedForeground" />
            </View>
          </View>
        </Tooltip>

        <View className="gap-2">
          <View className="h-2 flex-row gap-1">
            {STEPS.map((s, i) => (
              <View key={s} className={`h-2 flex-1 rounded-full ${i <= current ? "bg-primary" : "bg-muted"}`} />
            ))}
          </View>
          <View className="flex-row justify-between">
            <Tooltip content="Shipped from Reno, NV · Mon 9:41 AM" side="bottom">
              <Text variant="muted">Shipped</Text>
            </Tooltip>
            <Tooltip content="Left the Oakland depot at 11:52 AM" side="bottom">
              <Text className="text-sm font-medium">Out for delivery</Text>
            </Tooltip>
          </View>
        </View>
      </View>
    </Accent>
  );
}
