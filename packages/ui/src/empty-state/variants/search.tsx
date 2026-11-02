import * as React from "react";
import { Pressable, View } from "react-native";
import { Accent } from "@lumioui/core";
import { EmptyState } from "../empty-state";
import { SearchInput } from "../../search-input/search-input";
import { Icon } from "../../icon/icon";
import { Text } from "../../text/text";

const CATALOG = [
  { title: "Nightcall", artist: "Kavos", tile: "bg-tint-pink" },
  { title: "Midnight Harbour", artist: "M-Line", tile: "bg-tint-teal" },
  { title: "Night Owl", artist: "Galimar", tile: "bg-tint-amber" },
  { title: "Night Swim", artist: "Frank Oyelaran", tile: "bg-tint-orange" },
];

/** EmptyStateSearch — a music app search. Matches list as you type; a query
 *  with no hits swaps the list for the search empty state, whose action
 *  clears the field. Try typing "nightz". */
export function EmptyStateSearch() {
  const [q, setQ] = React.useState("nightz");
  const hits = CATALOG.filter((s) => `${s.title} ${s.artist}`.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <Accent color="pink" className="w-full">
      <View className="w-full gap-4">
        <Text className="px-1 text-3xl font-bold tracking-tight">Search</Text>
        <SearchInput value={q} onChangeText={setQ} onClear={() => setQ("")} placeholder="Artists, songs, podcasts" />

        {hits.length === 0 ? (
          <EmptyState
            variant="search"
            title={`No results for "${q.trim()}"`}
            description="Check the spelling, or try an artist or album name instead."
            action={
              <Pressable onPress={() => setQ("night")} accessibilityRole="button" className="h-11 justify-center px-2">
                <Text className="text-base font-semibold text-primary-text">Search "night" instead</Text>
              </Pressable>
            }
            className="px-6 py-10"
          />
        ) : (
          <View className="overflow-hidden rounded-2xl bg-card">
            {hits.map((s, i) => (
              <View key={s.title} className="flex-row items-center gap-3 pl-3">
                <View className={`h-12 w-12 items-center justify-center rounded-lg ${s.tile}`}>
                  <Icon name="music" size="sm" color="#FFFFFF" />
                </View>
                <View className={`flex-1 py-3 pr-4 ${i > 0 ? "border-t border-border" : ""}`}>
                  <Text className="text-base font-medium">{s.title}</Text>
                  <Text variant="muted">Song · {s.artist}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </Accent>
  );
}
