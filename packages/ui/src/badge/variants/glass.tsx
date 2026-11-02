import * as React from "react";
import { Image, StyleSheet, View } from "react-native";
import { Badge } from "../badge";

const PHOTO =
  "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&q=80&auto=format&fit=crop";

/** BadgeGlass — glass status pills over a sneaker product shot, the one place glass belongs: chrome floating on a photo. */
export function BadgeGlass() {
  return (
    <View className="relative h-[420px] w-full overflow-hidden rounded-2xl bg-muted">
      <Image source={{ uri: PHOTO }} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityIgnoresInvertColors />
      <View className="absolute left-4 top-4 flex-row gap-2">
        <Badge variant="glass" size="md">New</Badge>
        <Badge variant="glass" size="md">Handmade in Porto</Badge>
      </View>
      <View className="absolute bottom-5 right-4">
        <Badge variant="glass" size="lg">Only 2 left in 9.5</Badge>
      </View>
    </View>
  );
}
