import * as React from "react";
import { Image, StyleSheet, View, Text } from "react-native";
import { Button } from "../button";
import { Icon } from "../../icon/icon";

const PHOTO =
  "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&h=1000&fit=crop&q=70&auto=format";

/** ButtonGlass — glass CTAs over a full-bleed photo, where glass earns its keep. */
export function ButtonGlass() {
  return (
    <View className="relative h-[420px] w-full overflow-hidden rounded-2xl bg-muted">
      <Image source={{ uri: PHOTO }} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityIgnoresInvertColors />
      <View className="absolute inset-x-0 bottom-0 gap-3 bg-black/40 px-5 pb-6 pt-5">
        <View>
          <Text className="text-xl font-semibold text-white">Gion after dark</Text>
          <Text className="mt-0.5 text-sm text-white/90">Walking tour · 2 h · 4.9 (812)</Text>
        </View>
        <Button variant="glass" size="lg" icon={<Icon name="play" size="sm" color="foreground" />}>
          Watch preview
        </Button>
        <View className="flex-row gap-2">
          <Button variant="glass" size="sm" className="flex-1">Save</Button>
          <Button
            variant="glass"
            size="icon"
            accessibilityLabel="Share"
            icon={<Icon name="share" size="sm" color="foreground" />}
          />
        </View>
      </View>
    </View>
  );
}
