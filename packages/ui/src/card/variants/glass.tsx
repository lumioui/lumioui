import * as React from "react";
import { Image, StyleSheet, View } from "react-native";
import { Card } from "../card";
import { Button } from "../../button/button";
import { Text } from "../../text/text";

const PHOTO =
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80&auto=format&fit=crop";

/** CardGlass — the one place a glass card belongs: floating over the photo
 *  it describes, as a place card on a trail map. Save toggles in place. */
export function CardGlass() {
  const [saved, setSaved] = React.useState(false);
  return (
    <View className="relative h-[480px] w-full overflow-hidden rounded-3xl bg-muted">
      <Image source={{ uri: PHOTO }} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityIgnoresInvertColors />
      <View className="absolute inset-x-4 bottom-4">
        <Card variant="glass">
          <Card.Header>
            <Card.Title>Kestrel Lake lookout</Card.Title>
            <Card.Description>Ashfall Range · 2.4 km loop</Card.Description>
            <Text className="pt-1 text-sm font-medium">Sunrise 7:18 · 6°C, clear</Text>
          </Card.Header>
          <Card.Footer className="gap-2">
            <Button variant="glass" className="flex-1">Directions</Button>
            <Button variant="glass" className="flex-1" onPress={() => setSaved((v) => !v)}>
              {saved ? "Saved" : "Save"}
            </Button>
          </Card.Footer>
        </Card>
      </View>
    </View>
  );
}
