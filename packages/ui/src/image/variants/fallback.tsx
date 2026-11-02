import * as React from "react";
import { View } from "react-native";
import { Image } from "../image";
import { Avatar } from "../../avatar/avatar";
import { Button } from "../../button/button";
import { Icon } from "../../icon/icon";
import { Text } from "../../text/text";

const BROKEN = "https://invalid.example.invalid/IMG_2291.jpg";
const PHOTO =
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80&auto=format&fit=crop";

/** ImageFallback — a photo in a group chat that didn't download. The
 *  fallback slot keeps the bubble's shape and offers a retry; tap it and
 *  the photo loads in place. */
export function ImageFallback() {
  const [attempt, setAttempt] = React.useState(0);
  const uri = attempt === 0 ? BROKEN : PHOTO;
  return (
    <View className="w-full gap-3 rounded-3xl bg-card p-4">
      <View className="flex-row items-end gap-2">
        <Avatar size="sm" source={{ uri: "https://i.pravatar.cc/150?img=45" }} fallback="CA" alt="Clara Ainsworth" />
        <View className="flex-1 gap-1">
          <Text className="pl-3 text-xs text-muted-foreground">Clara · Beach weekend</Text>
          <View className="w-4/5">
            <Image
              key={attempt}
              source={{ uri }}
              aspectRatio={4 / 5}
              rounded="2xl"
              accessibilityLabel="Turquoise water on a quiet beach"
              fallback={
                <View className="items-center gap-3 px-6">
                  <Icon name="image" size="lg" color="mutedForeground" />
                  <Text variant="muted" className="text-center">Photo didn't download</Text>
                  <Button
                    size="sm"
                    variant="secondary"
                    onPress={() => setAttempt((a) => a + 1)}
                    icon={<Icon name="refresh" size="sm" color="foreground" />}
                  >
                    Try again
                  </Button>
                </View>
              }
            />
          </View>
        </View>
      </View>
      <View className="max-w-[80%] self-start rounded-2xl bg-secondary px-4 py-2 ml-10">
        <Text className="text-[15px]">Found the cove from the map. Bring snorkels!</Text>
      </View>
    </View>
  );
}
