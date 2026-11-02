import * as React from "react";
import { View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { Accent, ease, timing } from "@lumioui/core";
import { Collapsible, CollapsibleContent, CollapsibleItem, CollapsibleTrigger } from "../collapsible";
import { Text } from "../../text/text";

const ITEMS = [
  { qty: 2, name: "Sourdough loaf", price: "$13.00" },
  { qty: 1, name: "Oat milk, 1 L", price: "$4.29" },
  { qty: 6, name: "Free-range eggs", price: "$5.49" },
  { qty: 1, name: "Heirloom tomatoes, 500 g", price: "$6.80" },
  { qty: 3, name: "Greek yogurt", price: "$7.47" },
  { qty: 1, name: "Basil plant", price: "$3.99" },
];

const DELIVERY = ["88 Linden Ave, Apt 3R", "Courier: Dario · photo on arrival", "Note: buzz 3R, leave by the plant"];

/** While open the summary hands over to the rows — it dims to this, never out. */
const SUMMARY_DIM = 0.45;

function Section({
  title,
  meta,
  open,
  onOpenChange,
  divider,
  children,
}: {
  title: string;
  meta: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  divider?: boolean;
  children: React.ReactNode;
}) {
  // The summary carries the section while it's folded; open, the content
  // carries it, so the summary dims to muted.
  const lit = useSharedValue(open ? SUMMARY_DIM : 1);
  React.useEffect(() => {
    lit.value = withTiming(open ? SUMMARY_DIM : 1, { ...timing.normal, easing: Easing.bezier(...ease.inOut) });
  }, [open, lit]);
  const metaStyle = useAnimatedStyle(() => ({ opacity: lit.value }));
  return (
    <Collapsible open={open} onOpenChange={onOpenChange} className={divider ? "border-t border-border" : undefined}>
      <CollapsibleTrigger className="min-h-14 px-4" accessibilityLabel={`${title}, ${meta}`}>
        <View className="flex-1 flex-row items-center justify-between pr-2">
          <Text className="text-base font-semibold">{title}</Text>
          <Animated.View style={metaStyle}>
            <Text className="text-[15px] tabular-nums">{meta}</Text>
          </Animated.View>
        </View>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <View className="px-4 pb-4">{children}</View>
      </CollapsibleContent>
    </Collapsible>
  );
}

/** CollapsibleOrderDetails — a grocery order receipt: the item list and
 *  the delivery notes fold away under their summary rows, so the total
 *  stays in view. Opening grows the shape, then the rows switch on 40ms
 *  apart; the summary dims while the rows carry it. Orange for food. */
export function CollapsibleOrderDetails() {
  const [items, setItems] = React.useState(false);
  const [delivery, setDelivery] = React.useState(false);
  const count = ITEMS.reduce((n, i) => n + i.qty, 0);
  return (
    <Accent color="orange" className="w-full">
      <View className="w-full gap-4 rounded-3xl bg-background p-4 pt-6">
        <View className="gap-1 px-1">
          <Text className="text-[15px] font-semibold text-primary-text">Delivered at 6:42 PM</Text>
          <Text className="text-2xl font-bold tracking-tight">Order from Larder & Co.</Text>
          <Text className="text-[15px] text-muted-foreground">Tue, Oct 7 · #A-3381</Text>
        </View>
        <View className="overflow-hidden rounded-2xl bg-card">
          <Section title="Items" meta={`${count} items · $41.04`} open={items} onOpenChange={setItems}>
            {ITEMS.map((it, i) => (
              <CollapsibleItem key={it.name} index={i} className="flex-row items-center gap-3 py-2">
                <Text className="w-7 text-[15px] tabular-nums text-muted-foreground">{it.qty}×</Text>
                <Text className="flex-1 text-[15px]" numberOfLines={1}>{it.name}</Text>
                <Text className="text-[15px] tabular-nums">{it.price}</Text>
              </CollapsibleItem>
            ))}
          </Section>
          <Section title="Delivery" meta="Left at door" open={delivery} onOpenChange={setDelivery} divider>
            <View className="gap-1">
              {DELIVERY.map((line, i) => (
                <CollapsibleItem key={line} index={i}>
                  <Text className={i === 0 ? "text-[15px]" : "text-[15px] text-muted-foreground"}>{line}</Text>
                </CollapsibleItem>
              ))}
            </View>
          </Section>
        </View>
        <View className="gap-2 rounded-2xl bg-card p-4">
          {[
            ["Subtotal", "$41.04"],
            ["Delivery", "$3.99"],
            ["Tip", "$6.00"],
          ].map(([k, v]) => (
            <View key={k} className="flex-row justify-between">
              <Text className="text-[15px] text-muted-foreground">{k}</Text>
              <Text className="text-[15px] tabular-nums">{v}</Text>
            </View>
          ))}
          <View className="mt-1 flex-row justify-between border-t border-border pt-3">
            <Text className="text-[17px] font-semibold">Total</Text>
            <Text className="text-[17px] font-semibold tabular-nums">$51.03</Text>
          </View>
        </View>
      </View>
    </Accent>
  );
}
