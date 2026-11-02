import * as React from "react";
import { Pressable, View } from "react-native";
import { AppBar } from "../app-bar";
import { Icon } from "../../icon/icon";
import { Image } from "../../image/image";
import { Text } from "../../text/text";

const U = (id: string) => `https://images.unsplash.com/${id}?w=300&h=300&fit=crop&q=70&auto=format`;
const SHOTS = [
  "photo-1506905925346-21bda4d32df4",
  "photo-1470071459604-3b5ec3a7fe05",
  "photo-1500530855697-b586d89ba3ee",
  "photo-1500382017468-9049fed747ef",
  "photo-1483412033650-1015ddeb83d1",
  "photo-1519681393784-d120267933ba",
  "photo-1488646953014-85cb44e25828",
  "photo-1506126613408-eca07ce68773",
  "photo-1446776811953-b23d57bd21aa",
];

/** AppBarLargeTitle — a photo album: large title over the grid it names.
 *  "Select" flips the bar into selection mode — tap tiles to pick them and
 *  the subtitle counts the picks. */
export function AppBarLargeTitle() {
  const [selecting, setSelecting] = React.useState(false);
  const [picked, setPicked] = React.useState<number[]>([]);
  const toggle = (i: number) =>
    setPicked((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]));
  const live = selecting && picked.length > 0;
  return (
    <View className="w-full overflow-hidden rounded-3xl bg-background">
      <AppBar
        size="large"
        safeArea={false}
        bordered={false}
        title="Cliff Road, June"
        subtitle={
          selecting
            ? picked.length === 0
              ? "Select items"
              : `${picked.length} selected`
            : "128 photos · 6 videos"
        }
        showBack
        backLabel="Albums"
        trailing={
          <Pressable
            onPress={() => {
              setSelecting((s) => !s);
              setPicked([]);
            }}
            accessibilityRole="button"
            accessibilityLabel={selecting ? "Cancel selection" : "Select photos"}
            className="mr-2 h-8 min-w-11 items-center justify-center rounded-full bg-muted px-3"
            hitSlop={6}
          >
            <Text className="text-[15px] font-semibold">{selecting ? "Cancel" : "Select"}</Text>
          </Pressable>
        }
      />
      <View className="flex-row flex-wrap gap-0.5 pt-2">
        {SHOTS.map((id, i) => {
          const on = picked.includes(i);
          return (
            <Pressable
              key={id}
              onPress={() => (selecting ? toggle(i) : undefined)}
              accessibilityRole={selecting ? "checkbox" : "image"}
              accessibilityState={selecting ? { checked: on } : undefined}
              accessibilityLabel={`Photo ${i + 1}`}
              className="aspect-square w-[32.9%]"
            >
              <Image source={{ uri: U(id) }} className="h-full w-full" alt={`Photo ${i + 1}`} />
              {selecting ? (
                <View className="absolute bottom-2 right-2">
                  {on ? (
                    <View className="h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-primary">
                      <Icon name="check" size="sm" color="primaryForeground" strokeWidth={3} />
                    </View>
                  ) : (
                    <View className="h-6 w-6 rounded-full border-2 border-white bg-black/20" />
                  )}
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
      <View className="flex-row items-center justify-between px-5 py-4">
        <Icon name="share" size="md" color={live ? "foreground" : "mutedForeground"} />
        <Text className="text-[13px] text-muted-foreground">Updated just now</Text>
        <Icon name="trash" size="md" color={live ? "destructive" : "mutedForeground"} />
      </View>
    </View>
  );
}
