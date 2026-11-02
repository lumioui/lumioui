import * as React from "react";
import { Image, Pressable, View } from "react-native";
import { Alert } from "../alert";
import { Icon } from "../../icon/icon";
import { Text } from "../../text/text";

const photo = (id: string) => `https://images.unsplash.com/${id}?w=300&h=300&fit=crop&q=70&auto=format`;

const ALL = [
  "photo-1506905925346-21bda4d32df4",
  "photo-1470071459604-3b5ec3a7fe05",
  "photo-1501785888041-af3ef285b470",
  "photo-1507525428034-b723cf961d3e",
  "photo-1476514525535-07fb3b4ae5f1",
  "photo-1509316785289-025f5b846b35",
];

/** AlertModal — a photo library in select mode. Delete asks first with the
 *  centred alert (two actions side by side); confirming removes the
 *  picked photos from the grid. */
export function AlertModal() {
  const [photos, setPhotos] = React.useState(ALL);
  const [picked, setPicked] = React.useState<string[]>([ALL[1]!, ALL[4]!]);
  const [confirm, setConfirm] = React.useState(false);

  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const n = picked.length;

  return (
    <View className="w-full gap-3">
      <View className="flex-row items-center justify-between px-1">
        <Text className="text-2xl font-bold tracking-tight">Recents</Text>
        <Pressable
          onPress={() => {
            setPhotos(ALL);
            setPicked([]);
          }}
          accessibilityRole="button"
          className="h-11 justify-center"
        >
          <Text className="text-base font-medium text-primary-text">Restore all</Text>
        </Pressable>
      </View>

      <View className="w-full flex-row flex-wrap gap-1 overflow-hidden rounded-2xl">
        {photos.map((id) => {
          const on = picked.includes(id);
          return (
            <Pressable
              key={id}
              onPress={() => toggle(id)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              accessibilityLabel="Photo"
              className="aspect-square w-[32.8%]"
            >
              <Image source={{ uri: photo(id) }} className={`h-full w-full bg-muted ${on ? "opacity-70" : ""}`} />
              {on ? (
                <View className="absolute bottom-2 right-2 h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-primary">
                  <Icon name="check" size="sm" color="primaryForeground" strokeWidth={3} />
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <View className="h-14 flex-row items-center justify-between rounded-2xl bg-card px-4">
        <Text className="text-[15px] font-medium">
          {n === 0 ? "Select photos" : `${n} photo${n === 1 ? "" : "s"} selected`}
        </Text>
        <Pressable
          onPress={() => n > 0 && setConfirm(true)}
          disabled={n === 0}
          accessibilityRole="button"
          accessibilityLabel="Delete selected photos"
          className={`h-11 w-11 items-center justify-center ${n === 0 ? "opacity-40" : ""}`}
        >
          <Icon name="trash" size="md" color="destructive" />
        </Pressable>
      </View>

      <Alert.Modal
        open={confirm}
        onOpenChange={setConfirm}
        title={`Delete ${n} Photo${n === 1 ? "" : "s"}?`}
        message="They'll stay in Recently Deleted for 30 days, then they're gone from all your devices."
        buttons={[
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => {
              setPhotos((p) => p.filter((id) => !picked.includes(id)));
              setPicked([]);
            },
          },
        ]}
      />
    </View>
  );
}
