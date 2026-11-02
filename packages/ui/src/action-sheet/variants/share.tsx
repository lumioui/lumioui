import * as React from "react";
import { Pressable, View } from "react-native";
import { ActionSheet } from "../action-sheet";
import { Avatar } from "../../avatar/avatar";
import { Icon } from "../../icon/icon";
import { Image } from "../../image/image";
import { Text } from "../../text/text";

const PHOTO =
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80&auto=format&fit=crop";

/** ActionSheetShare — a shared-album photo's "…" menu. The photo carries the
 *  colour; chrome stays ink. The picked row holds lit, then the result reports back under the photo. */
export function ActionSheetShare() {
  const [open, setOpen] = React.useState(false);
  const [status, setStatus] = React.useState("Added by Tomás · 2 hours ago");

  return (
    <View className="w-full gap-4">
      <View className="overflow-hidden rounded-3xl bg-card">
        <Image
          source={{ uri: PHOTO }}
          alt="Ridge line above the clouds at sunrise"
          rounded="none"
          aspectRatio={4 / 4.4}
          className="w-full"
        />
        <View className="flex-row items-center gap-3 p-4">
          <Avatar size="sm" source={{ uri: "https://i.pravatar.cc/150?img=59" }} fallback="TH" alt="Tomás Herrera" />
          <View className="flex-1">
            <Text className="text-[15px] font-semibold">Dolomites, day 3</Text>
            <Text variant="muted" numberOfLines={1}>{status}</Text>
          </View>
          <Pressable
            onPress={() => setOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="More actions for this photo"
            className="h-11 w-11 items-center justify-center rounded-full bg-secondary active:opacity-70"
          >
            <Icon name="more-horizontal" size="md" color="foreground" />
          </Pressable>
        </View>
      </View>

      <ActionSheet
        open={open}
        onOpenChange={setOpen}
        title="Dolomites, day 3"
        message="Shared album · 14 people can see this photo"
        actions={[
          { label: "Copy Link", onPress: () => setStatus("Link copied · expires in 30 days") },
          { label: "Save to Device", onPress: () => setStatus("Saved to device › Trips") },
          { label: "Add to Favorites", onPress: () => setStatus("Added to Favorites") },
          { label: "Set as Wallpaper", disabled: true },
          { label: "Remove from Album", destructive: true, onPress: () => setStatus("Removed for everyone in the album") },
        ]}
      />
    </View>
  );
}
