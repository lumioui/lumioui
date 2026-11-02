import * as React from "react";
import { Image, View } from "react-native";
import { ActionSwap } from "../action-swap";
import { Text } from "../../text/text";

const img = (id: string, w = 300, h = 300) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&q=70&auto=format`;

const PHOTOS = [
  { id: "1506905925346-21bda4d32df4", name: "Ridge at first light", when: "Jun 12, 5:48 AM" },
  { id: "1501785888041-af3ef285b470", name: "Lake, west shore", when: "Jun 12, 7:15 PM" },
  { id: "1441974231531-c6227db76b6e", name: "Forest trail", when: "Jun 13, 9:02 AM" },
  { id: "1470071459604-3b5ec3a7fe05", name: "Valley overlook", when: "Jun 14, 11:40 AM" },
  { id: "1507525428034-b723cf961d3e", name: "Beach day off", when: "Jun 15, 3:21 PM" },
  { id: "1611978891391-c7e65da1b749", name: "Boats at the dock", when: "Jun 16, 8:10 AM" },
];

/** ActionSwapViewModes — an album header whose view toggle swaps
 *  List → Grid → Gallery and the photos below really re-lay out. */
export function ActionSwapViewModes() {
  const [mode, setMode] = React.useState(1);
  return (
    <View className="w-full gap-3">
      <View className="flex-row items-end justify-between px-1">
        <View className="gap-0.5">
          <Text className="text-2xl font-bold tracking-tight text-foreground">Summer on foot</Text>
          <Text className="text-sm text-muted-foreground">214 photos · 9 videos</Text>
        </View>
        <ActionSwap
          states={[
            { label: "List", icon: "list" },
            { label: "Grid", icon: "grid" },
            { label: "Gallery", icon: "image" },
          ]}
          value={mode}
          onStateChange={setMode}
          accessibilityLabelPrefix="View as"
          className="h-9 min-w-[112px] px-4"
        />
      </View>

      {mode === 0 ? (
        <View className="w-full rounded-2xl bg-card">
          {PHOTOS.slice(0, 4).map((p, i) => (
            <View key={p.id} className="flex-row items-center gap-3 pl-3 pr-4">
              <Image source={{ uri: img(p.id, 120, 120) }} className="h-12 w-12 rounded-lg" accessibilityIgnoresInvertColors />
              <View className={`flex-1 py-3 ${i > 0 ? "border-t border-border" : ""}`}>
                <Text className="text-[15px] font-medium text-foreground">{p.name}</Text>
                <Text className="text-sm text-muted-foreground">{p.when}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : mode === 1 ? (
        <View className="w-full gap-1 overflow-hidden rounded-2xl">
          {[PHOTOS.slice(0, 3), PHOTOS.slice(3, 6)].map((row, r) => (
            <View key={r} className="w-full flex-row gap-1">
              {row.map((p) => (
                <Image
                  key={p.id}
                  source={{ uri: img(p.id) }}
                  className="flex-1"
                  style={{ aspectRatio: 1 }}
                  accessibilityLabel={p.name}
                />
              ))}
            </View>
          ))}
        </View>
      ) : (
        <View className="w-full gap-2">
          <Image
            source={{ uri: img(PHOTOS[0]!.id, 800, 600) }}
            className="w-full rounded-2xl"
            style={{ aspectRatio: 4 / 3 }}
            accessibilityLabel={PHOTOS[0]!.name}
          />
          <View className="px-1">
            <Text className="text-[15px] font-medium text-foreground">{PHOTOS[0]!.name}</Text>
            <Text className="text-sm text-muted-foreground">{PHOTOS[0]!.when} · 1 of 214</Text>
          </View>
        </View>
      )}
    </View>
  );
}
