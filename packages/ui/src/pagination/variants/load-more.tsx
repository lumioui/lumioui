import * as React from "react";
import { View } from "react-native";
import { Accent, SwitchOn, rowDelay } from "@lumioui/core";
import { LoadMore } from "../pagination";
import { Avatar } from "../../avatar/avatar";
import { Icon } from "../../icon/icon";
import { Text } from "../../text/text";

interface Review {
  name: string;
  img: number;
  stars: number;
  when: string;
  body: string;
}

const ALL: Review[] = [
  { name: "Hana Okafor", img: 47, stars: 5, when: "2d", body: "Browned the butter a little longer and it tasted like toffee. Made it twice this week." },
  { name: "Luca Bianchi", img: 12, stars: 4, when: "4d", body: "Halved the sugar and it still set beautifully. Bake time ran 4 minutes over in my oven." },
  { name: "Tess Morgan", img: 32, stars: 5, when: "1w", body: "The flaky salt on top is not optional. Everyone at work asked for the recipe." },
  { name: "Arjun Mehta", img: 59, stars: 5, when: "1w", body: "Rested the dough overnight like the note says. Chewier middles, crisp edges." },
  { name: "Clara Jensen", img: 25, stars: 3, when: "2w", body: "Good flavour but mine spread a lot. Next time I'll chill the trays first." },
  { name: "Omar Farouk", img: 68, stars: 5, when: "2w", body: "Used dark rye flour for a third of the plain. Nutty and not too sweet." },
  { name: "Bea Lawson", img: 44, stars: 4, when: "3w", body: "Swapped in pecans. Would love a gluten-free version of this one." },
  { name: "Mateo Silva", img: 15, stars: 5, when: "1mo", body: "Fastest cookies I've ever made from scratch. Kids helped weigh everything." },
  { name: "Ines Duarte", img: 9, stars: 5, when: "1mo", body: "Doubled the batch and froze half the dough balls. Bake straight from frozen." },
];

const PAGE = 3;

/** PaginationLoadMore — reviews under a recipe. While the next page loads,
 *  "Show 6 more" swaps in place for three busy dots; the new
 *  reviews switch on from dim 40ms apart, and after the last page the
 *  footer ignites a quiet end line once. Orange for food. */
export function PaginationLoadMore() {
  const [shown, setShown] = React.useState(PAGE);
  // Rows from here on arrived with the last page and switch on in order.
  const [freshFrom, setFreshFrom] = React.useState(0);
  const rows = ALL.slice(0, shown);
  const remaining = ALL.length - shown;

  const loadMore = () =>
    new Promise<void>((resolve) =>
      setTimeout(() => {
        setFreshFrom(shown);
        setShown((n) => Math.min(ALL.length, n + PAGE));
        resolve();
      }, 900)
    );

  return (
    <Accent color="orange" className="w-full">
      <View className="w-full gap-4">
        <View className="flex-row items-end justify-between px-1">
          <View className="gap-1">
            <Text className="text-xl font-semibold tracking-tight">Reviews</Text>
            <Text variant="muted">Brown butter chocolate chip cookies</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Icon name="star" size="sm" color="primary" filled />
            <Text className="text-base font-semibold tabular-nums">4.7</Text>
            <Text className="text-sm text-muted-foreground tabular-nums">({ALL.length})</Text>
          </View>
        </View>

        <View className="overflow-hidden rounded-2xl bg-card">
          {rows.map((r, i) => (
            <SwitchOn key={r.name} delay={i >= freshFrom ? rowDelay(i - freshFrom) : 0}>
              {i > 0 ? <View className="ml-16 h-px bg-border" /> : null}
              <View className="flex-row gap-3 px-4 py-4">
                <Avatar size="md" source={{ uri: `https://i.pravatar.cc/150?img=${r.img}` }} fallback={r.name[0]} alt={r.name} />
                <View className="flex-1 gap-1">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-[15px] font-semibold">{r.name}</Text>
                    <Text className="text-xs text-muted-foreground">{r.when}</Text>
                  </View>
                  <View className="flex-row gap-0.5" accessibilityLabel={`${r.stars} out of 5 stars`}>
                    {Array.from({ length: 5 }, (_, s) => (
                      <Icon key={s} name="star" size="sm" color={s < r.stars ? "primary" : "border"} filled />
                    ))}
                  </View>
                  <Text className="text-[15px] leading-snug text-foreground">{r.body}</Text>
                </View>
              </View>
            </SwitchOn>
          ))}
        </View>

        <LoadMore
          onLoadMore={loadMore}
          hasMore={remaining > 0}
          remaining={remaining}
          endLabel="That's every review"
        />
      </View>
    </Accent>
  );
}
