import * as React from "react";
import { Image, StyleSheet, View } from "react-native";
import { Textarea } from "../textarea";
import { Button } from "../../button/button";

const PHOTO =
  "https://images.unsplash.com/photo-1513735492246-483525079686?w=800&q=80&auto=format&fit=crop";

/** TextareaGlass — the caption step of a photo post: the glass field rides
 *  over the photo being shared (the one place glass is earned), grows with
 *  the caption, and Share wakes up once there's text. */
export function TextareaGlass() {
  const [caption, setCaption] = React.useState("");
  return (
    <View className="relative h-[460px] w-full overflow-hidden rounded-3xl bg-muted">
      <Image source={{ uri: PHOTO }} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityIgnoresInvertColors />
      <View className="absolute inset-x-4 bottom-5 gap-3">
        <Textarea
          glass
          value={caption}
          onChangeText={setCaption}
          placeholder="Write a caption…"
          minHeight={88}
          autoGrow
          maxLength={220}
          accessibilityLabel="Caption"
        />
        <Button size="lg" className="w-full" disabled={caption.trim().length === 0}>
          Share
        </Button>
      </View>
    </View>
  );
}
