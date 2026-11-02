import * as React from "react";
import { Image, StyleSheet, View } from "react-native";
import { SearchInput } from "../search-input";

const PHOTO =
  "https://images.unsplash.com/photo-1558370781-d6196949e317?w=800&h=1000&fit=crop&q=70&auto=format";

/** SearchInputGlass — a maps-style capsule floating over the map/photo
 *  layer at the bottom edge, where the thumb lives. Glass is earned: it
 *  rides over photographic content. Focus lights the capsule's rim; type and
 *  the clear button ignites in place. */
export function SearchInputGlass() {
  const [q, setQ] = React.useState("");
  return (
    <View className="relative h-[460px] w-full overflow-hidden rounded-3xl bg-muted">
      <Image source={{ uri: PHOTO }} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityIgnoresInvertColors />
      <View className="absolute inset-x-4 bottom-5">
        <SearchInput
          glass
          value={q}
          onChangeText={setQ}
          placeholder="Search for a place or address"
          accessibilityLabel="Search places"
        />
      </View>
    </View>
  );
}
