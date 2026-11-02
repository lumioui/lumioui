import * as React from "react";
import { View } from "react-native";
import { Button } from "../button";
import { Icon } from "../../icon/icon";
import { Text } from "../../text/text";

/** ButtonStyles — every voice on one real surface, loudest to quietest: the
 *  filled accent CTA, a secondary beside it, tinted and outline for inline
 *  choices, a link, and destructive kept apart at the bottom. */
export function ButtonStyles() {
  return (
    <View className="w-full">
      <View className="w-full gap-5 rounded-3xl bg-card p-5">
        <View className="items-center gap-1 pt-2">
          <Text variant="muted">You're sending</Text>
          <Text className="text-5xl font-semibold tracking-tight tabular-nums">$240.00</Text>
          <Text variant="muted">to Maya Okafor · arrives instantly</Text>
        </View>

        <View className="flex-row gap-2">
          <Button variant="tinted" size="sm" className="flex-1">Split it</Button>
          <Button variant="outline" size="sm" className="flex-1">Add note</Button>
          <Button variant="outline" size="sm" className="flex-1">Schedule</Button>
        </View>

        <View className="gap-2">
          <Button size="lg" className="w-full" icon={<Icon name="send" size="sm" color="primaryForeground" />}>
            Send now
          </Button>
          <Button size="lg" variant="secondary" className="w-full">Edit amount</Button>
        </View>

        <View className="flex-row items-center justify-between border-t border-border pt-3">
          <Button variant="link" size="sm">Fees and limits</Button>
          <Button variant="ghost" size="sm" textClassName="text-destructive">Cancel transfer</Button>
        </View>
      </View>
    </View>
  );
}
