import * as React from "react";
import { View, type LayoutChangeEvent } from "react-native";
import Animated, { useAnimatedScrollHandler, useSharedValue, runOnJS } from "react-native-reanimated";
import { PageDots } from "../pagination";
import { Icon } from "../../icon/icon";
import { Text } from "../../text/text";

interface Card {
  name: string;
  last4: string;
  /** Card art is content colour — the chrome stays neutral. The ink card
   *  carries a hairline so it keeps its edge on a dark canvas. */
  tint: string;
  balance: string;
  cents: string;
  detail: string;
}

const CARDS: Card[] = [
  { name: "Everyday", last4: "4417", tint: "border border-border bg-neutral-900", balance: "$2,316", cents: ".08", detail: "Round-ups on · $41.20 saved this month" },
  { name: "Travel", last4: "9052", tint: "bg-tint-teal", balance: "€684", cents: ".50", detail: "No FX fees · Next trip: Porto, Nov 14" },
  { name: "Virtual", last4: "0311", tint: "bg-tint-pink", balance: "$120", cents: ".00", detail: "Subscriptions only · 4 merchants" },
  { name: "Joint", last4: "7726", tint: "bg-tint-green", balance: "$5,902", cents: ".44", detail: "Shared with Tomás · Rent due Nov 1" },
];

/** PaginationDots — swipe between cards in a banking wallet. The dots are
 *  lamps: brightness and the pill stretch
 *  follow the scroll offset on the UI thread, so they stretch and brighten with
 *  the finger mid-swipe; the balance below swaps only when a page settles.
 *  Tap either side of the dots to step a card. */
export function PaginationDots() {
  const [w, setW] = React.useState(0);
  const [index, setIndex] = React.useState(0);
  const progress = useSharedValue(0);
  const last = useSharedValue(0);
  const scrollRef = React.useRef<Animated.ScrollView>(null);

  const onScroll = useAnimatedScrollHandler(
    (e) => {
      if (w <= 0) return;
      const p = e.contentOffset.x / w;
      progress.value = p;
      const r = Math.round(p);
      if (r !== last.value) {
        last.value = r;
        runOnJS(setIndex)(r);
      }
    },
    [w]
  );

  const card = CARDS[index] ?? CARDS[0]!;

  return (
    <View className="w-full gap-5">
      <View className="flex-row items-center justify-between px-1">
        <Text className="text-2xl font-bold tracking-tight">Cards</Text>
        <View className="h-9 flex-row items-center gap-1.5 rounded-full bg-card px-3">
          <Icon name="plus" size="sm" color="foreground" />
          <Text className="text-sm font-medium">Add card</Text>
        </View>
      </View>

      <View onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)} className="w-full">
        <Animated.ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
        >
          {CARDS.map((c) => (
            <View key={c.last4} style={{ width: w || 358 }} className="px-1">
              <View style={{ aspectRatio: 1.586 }} className={`justify-between rounded-3xl p-5 ${c.tint}`}>
                <View className="flex-row items-center justify-between">
                  <Text className="text-[17px] font-semibold text-white">{c.name}</Text>
                  <Icon name="wifi" size="sm" color="#FFFFFF" />
                </View>
                <View className="flex-row items-end justify-between">
                  <Text className="text-base tracking-widest text-white/80 tabular-nums">•••• {c.last4}</Text>
                  <Text className="text-sm font-semibold text-white">Debit</Text>
                </View>
              </View>
            </View>
          ))}
        </Animated.ScrollView>
      </View>

      <PageDots
        count={CARDS.length}
        index={index}
        progress={progress}
        onIndexChange={(i) => scrollRef.current?.scrollTo({ x: i * w, animated: true })}
      />

      <View className="gap-1 rounded-2xl bg-card p-5" accessibilityLiveRegion="polite">
        <Text variant="muted">{card.name} balance</Text>
        <View className="flex-row items-baseline">
          <Text className="text-4xl font-semibold tracking-tight tabular-nums">{card.balance}</Text>
          <Text className="text-xl font-semibold text-muted-foreground tabular-nums">{card.cents}</Text>
        </View>
        <Text className="text-sm text-muted-foreground">{card.detail}</Text>
      </View>
    </View>
  );
}
