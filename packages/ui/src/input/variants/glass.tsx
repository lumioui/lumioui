import * as React from "react";
import { Image, StyleSheet, View } from "react-native";
import { Input } from "../input";
import { Icon } from "../../icon/icon";

const PHOTO =
  "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&h=1000&fit=crop&q=70&auto=format";

/** InputGlass — a trip planner's route fields floating over the destination
 *  photo: start point and destination as glass capsules. Glass is earned
 *  here because the field sits on photographic content, not a flat card. */
export function InputGlass() {
  const [from, setFrom] = React.useState("Current location");
  const [to, setTo] = React.useState("");
  return (
    <View className="relative h-[460px] w-full overflow-hidden rounded-3xl bg-muted">
      <Image source={{ uri: PHOTO }} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityIgnoresInvertColors />
      <View className="absolute inset-x-4 top-5 gap-2">
        <Input
          glass
          value={from}
          onChangeText={setFrom}
          accessibilityLabel="Starting point"
          leftIcon={<Icon name="pointer" size="sm" color="foreground" />}
        />
        <Input
          glass
          value={to}
          onChangeText={setTo}
          placeholder="Destination"
          accessibilityLabel="Destination"
          leftIcon={<Icon name="map-pin" size="sm" color="foreground" />}
          success={to.trim().length > 2}
        />
      </View>
    </View>
  );
}
