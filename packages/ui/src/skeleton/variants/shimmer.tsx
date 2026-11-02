import * as React from "react";
import { Image, Pressable, View } from "react-native";
import { Skeleton } from "../skeleton";
import { Text } from "../../text/text";

const photo = (id: string) => `https://images.unsplash.com/${id}?w=400&h=500&fit=crop&q=70&auto=format`;

const PRODUCTS = [
  { name: "Wool overcoat", brand: "Norse Field", price: "$340", id: "photo-1619603364937-8d7af41ef206" },
  { name: "Sherpa denim jacket", brand: "Arlo & Co", price: "$128", id: "photo-1543076447-215ad9ba6923" },
  { name: "Organic cotton tee", brand: "Common Thread", price: "$38", id: "photo-1489987707025-afc232f7ea0f" },
  { name: "Quilted puffer", brand: "Halden", price: "$215", id: "photo-1601924994987-69e26d50dc26" },
];

const FILTERS = ["New in", "Outerwear", "Knitwear"];

/** SkeletonShimmer — a fashion store grid loading under a filter change.
 *  The tiles wait as still, dim shapes however long the wait runs — nothing
 *  moves across them. Pick a filter to reload; tap the grid to let it land. */
export function SkeletonShimmer() {
  const [filter, setFilter] = React.useState("Outerwear");
  const [loaded, setLoaded] = React.useState(false);

  return (
    // The grid sits on a card sheet: muted placeholders read as shapes on
    // white, where on the grey canvas they nearly disappeared in light mode.
    <View className="w-full gap-4 rounded-3xl bg-card p-4">
      <View className="flex-row gap-2">
        {FILTERS.map((f) => {
          const on = f === filter;
          return (
            <Pressable
              key={f}
              onPress={() => {
                setFilter(f);
                setLoaded(false);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              className={`h-9 justify-center rounded-full px-4 ${on ? "bg-primary" : "bg-secondary"}`}
            >
              <Text className={`text-sm font-medium ${on ? "text-primary-foreground" : "text-secondary-foreground"}`}>{f}</Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={() => setLoaded(true)}
        disabled={loaded}
        accessibilityRole={loaded ? undefined : "button"}
        accessibilityLabel={loaded ? undefined : `Loading ${filter}. Tap to finish`}
        accessibilityState={{ busy: !loaded }}
        className="w-full flex-row flex-wrap justify-between gap-y-5"
      >
        {PRODUCTS.map((p) => (
          <View key={p.name} className="w-[48%] gap-2">
            {loaded ? (
              <Image source={{ uri: photo(p.id) }} className="aspect-[4/5] w-full rounded-2xl bg-muted" />
            ) : (
              <Skeleton className="aspect-[4/5] w-full rounded-2xl" />
            )}
            {loaded ? (
              <View className="gap-0.5">
                <Text className="text-[15px] font-medium" numberOfLines={1}>{p.name}</Text>
                <Text variant="muted" numberOfLines={1}>{p.brand}</Text>
                <Text className="text-[15px] font-semibold tabular-nums">{p.price}</Text>
              </View>
            ) : (
              <View className="gap-2 pt-1">
                <Skeleton className="h-3.5 w-4/5 rounded" />
                <Skeleton className="h-3 w-1/2 rounded" />
                <Skeleton className="h-3.5 w-1/4 rounded" />
              </View>
            )}
          </View>
        ))}
      </Pressable>
    </View>
  );
}
