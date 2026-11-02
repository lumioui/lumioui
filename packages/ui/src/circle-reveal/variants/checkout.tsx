import * as React from "react";
import { View, type GestureResponderEvent, type LayoutChangeEvent } from "react-native";
import { Accent, LightFall, SwitchOn, rowDelay, useTheme } from "@lumioui/core";
import { CircleReveal, type CircleRevealHandle } from "../circle-reveal";
import { Button } from "../../button/button";
import { Icon, type IconName } from "../../icon/icon";
import { SuccessSeal } from "../../success-seal/success-seal";
import { Text } from "../../text/text";

const ITEMS = [
  ["2×", "Lemongrass chicken bánh mì", "$23.00"],
  ["1×", "Crispy tofu vermicelli bowl", "$14.50"],
  ["2×", "Iced condensed-milk coffee", "$11.00"],
] as const;

const TOTALS = [
  ["Subtotal", "$48.50"],
  ["Delivery", "$2.99"],
  ["Tip", "$6.00"],
] as const;

const TRACKING: [IconName, string, string][] = [
  ["clock", "Estimated arrival", "6:48 PM"],
  ["utensils", "Saigon Corner is cooking", "Now"],
  ["map-pin", "418 Valencia St, Apt 3", ""],
];

/** Card corner radius — the stamp's light stays inside it. */
const CARD_RADIUS = 16;

/** The order itself — the hero that stays lit above the flood. */
function OrderCard() {
  return (
    <View className="gap-4 bg-card p-4">
      {ITEMS.map(([qty, name, price]) => (
        <View key={name} className="flex-row items-center gap-3">
          <Text className="w-7 text-[15px] font-semibold text-primary-text tabular-nums">{qty}</Text>
          <Text className="flex-1 text-[15px]" numberOfLines={1}>
            {name}
          </Text>
          <Text className="text-[15px] tabular-nums">{price}</Text>
        </View>
      ))}
      <View className="flex-row justify-between border-t border-border pt-3">
        <Text className="text-lg font-semibold">Total</Text>
        <Text className="text-lg font-semibold tabular-nums">$57.49</Text>
      </View>
    </View>
  );
}

function Checkout() {
  const { colors } = useTheme();
  const reveal = React.useRef<CircleRevealHandle>(null);
  /** The page under the flood has turned into the placed page. */
  const [placed, setPlaced] = React.useState(false);
  /** The flood has cleared — the stamp lands on the card. */
  const [stamped, setStamped] = React.useState(false);
  /** The stamp has held — tracking builds in below the card. */
  const [tracking, setTracking] = React.useState(false);
  /** The card's slot in the page (measured), so the hero can sit above the flood. */
  const [slot, setSlot] = React.useState<{ y: number; h: number } | null>(null);
  const [cardH, setCardH] = React.useState(0);

  const place = (e: GestureResponderEvent) => reveal.current?.reveal(e, colors.primary);
  const back = (e: GestureResponderEvent) => reveal.current?.conceal(e, colors.background);

  return (
    <View className="min-h-[700px] w-full flex-1 overflow-hidden bg-background">
      {placed ? <LightFall reach={0.55} /> : null}
      <View className="flex-1 px-5 pb-8 pt-14">
        <View className="gap-1 pb-6">
          <Text className="text-3xl font-bold tracking-tight">{placed ? "Order placed" : "Your order"}</Text>
          <Text className="text-sm text-muted-foreground">
            {placed ? "Arriving 6:40–6:55 PM" : "Saigon Corner · 1.2 mi away"}
          </Text>
        </View>

        {/* The card's slot — the card itself renders above the flood. */}
        <View
          style={{ height: cardH }}
          onLayout={(e: LayoutChangeEvent) => setSlot({ y: e.nativeEvent.layout.y, h: e.nativeEvent.layout.height })}
        />

        {placed ? (
          <View className="flex-1 justify-between pt-6">
            {tracking ? (
              <View className="overflow-hidden rounded-2xl bg-card">
                {TRACKING.map(([icon, label, value], i) => (
                  <SwitchOn
                    key={label}
                    delay={rowDelay(i)}
                    className={`min-h-[52px] flex-row items-center gap-3 px-4 ${i < TRACKING.length - 1 ? "border-b border-border" : ""}`}
                  >
                    <Icon name={icon} size="sm" color="mutedForeground" />
                    <Text className="flex-1 text-[15px]" numberOfLines={1}>
                      {label}
                    </Text>
                    {value ? <Text className="text-[15px] font-semibold tabular-nums">{value}</Text> : null}
                  </SwitchOn>
                ))}
              </View>
            ) : (
              <View />
            )}
            {tracking ? (
              <SwitchOn delay={rowDelay(TRACKING.length)}>
                <Button size="lg" variant="secondary" onPress={back}>
                  Back to menu
                </Button>
              </SwitchOn>
            ) : null}
          </View>
        ) : (
          <View className="flex-1 justify-between pt-6">
            <View className="gap-2 px-1">
              {TOTALS.map(([label, value]) => (
                <View key={label} className="flex-row justify-between">
                  <Text className="text-[15px] text-muted-foreground">{label}</Text>
                  <Text className="text-[15px] text-muted-foreground tabular-nums">{value}</Text>
                </View>
              ))}
            </View>
            <View className="gap-3">
              <View className="h-11 flex-row items-center gap-3 px-1">
                <Icon name="credit-card" size="sm" color="foreground" />
                <Text className="flex-1 text-[15px] font-medium">Visa •••• 4417</Text>
                <Text className="text-sm text-muted-foreground">Change</Text>
              </View>
              <Button size="lg" onPress={place}>
                Place order · $57.49
              </Button>
            </View>
          </View>
        )}
      </View>

      <CircleReveal
        ref={reveal}
        onCovered={(revealed) => {
          setPlaced(revealed);
          if (!revealed) {
            setStamped(false);
            setTracking(false);
          }
        }}
        onDone={(revealed) => setStamped(revealed)}
      >
        {/* The hero rides above the flood: it is the thing that was placed. */}
        <View
          pointerEvents="box-none"
          style={{ position: "absolute", left: 20, right: 20, top: slot?.y ?? 0, opacity: slot ? 1 : 0 }}
          onLayout={(e: LayoutChangeEvent) => setCardH(e.nativeEvent.layout.height)}
        >
          <SuccessSeal tone="primary" size="md" on={stamped} radius={CARD_RADIUS} onSettled={() => setTracking(true)}>
            <OrderCard />
          </SuccessSeal>
        </View>
      </CircleReveal>
    </View>
  );
}

/** CircleRevealCheckout — food delivery checkout. Place order: an orange
 *  flood with a lit rim pours out of the button while the order card stays
 *  above it. The flood clears onto a page lit from above, the card is
 *  stamped and catches one sheen, holds, and tracking switches on below it.
 *  Back to menu wipes the canvas back over from where you tapped. Orange,
 *  for food. */
export function CircleRevealCheckout() {
  return (
    <Accent color="orange" className="w-full flex-1">
      <Checkout />
    </Accent>
  );
}
