import * as React from "react";
import { Image, Pressable, View } from "react-native";
import { Accent } from "@lumioui/core";
import { SectionHeader } from "../section-header";
import { Icon } from "../../icon/icon";
import { Text } from "../../text/text";

const img = (id: string, w = 600, h = 600) =>
  `https://images.unsplash.com/${id}?w=${w}&h=${h}&fit=crop&q=70&auto=format`;

const PHOTOS = [
  { uri: img("photo-1566073771259-6a8506099945", 600, 700), alt: "Pool deck at dusk" },
  { uri: img("photo-1590490360182-c33d57733427", 400, 300), alt: "Main bedroom with linen bedding" },
  { uri: img("photo-1505409628601-edc9af17fda6", 400, 300), alt: "Dining room with oak table" },
];

/** SectionHeaderMedia — a stay listing's detail page: section titles carry
 *  their media and review counts in muted numerals, with "See all" leading
 *  to the full set. Teal accent (travel) on the actions. */
export function SectionHeaderMedia() {
  return (
    <Accent color="teal" className="w-full">
      <View className="w-full gap-5 overflow-hidden rounded-3xl bg-background px-5 py-6">
        <SectionHeader title="Photos" count={86} action="See all" chevron />
        <View className="h-[220px] w-full flex-row gap-2">
          <Pressable accessibilityRole="imagebutton" accessibilityLabel={PHOTOS[0]!.alt} className="flex-1">
            <Image source={{ uri: PHOTOS[0]!.uri }} className="h-full w-full rounded-l-2xl bg-muted" accessibilityIgnoresInvertColors />
          </Pressable>
          <View className="flex-1 gap-2">
            <Pressable accessibilityRole="imagebutton" accessibilityLabel={PHOTOS[1]!.alt} className="flex-1">
              <Image source={{ uri: PHOTOS[1]!.uri }} className="h-full w-full rounded-tr-2xl bg-muted" accessibilityIgnoresInvertColors />
            </Pressable>
            <Pressable accessibilityRole="imagebutton" accessibilityLabel={`${PHOTOS[2]!.alt}, 83 more photos`} className="flex-1">
              <Image source={{ uri: PHOTOS[2]!.uri }} className="h-full w-full rounded-br-2xl bg-muted" accessibilityIgnoresInvertColors />
              <View className="absolute inset-0 items-center justify-center rounded-br-2xl bg-black/40">
                <Text className="text-lg font-semibold text-white">+83</Text>
              </View>
            </Pressable>
          </View>
        </View>

        <SectionHeader
          title="Reviews"
          count={214}
          subtitle="4.92 average · 97% would stay again"
          action="See all"
          chevron
          className="mt-4"
        />
        <View className="gap-3">
          <View className="flex-row items-center gap-3">
            <Image source={{ uri: "https://i.pravatar.cc/120?img=32" }} className="h-10 w-10 rounded-full bg-muted" accessibilityIgnoresInvertColors />
            <View className="flex-1">
              <Text className="text-[15px] font-semibold text-foreground">Hanna Velde</Text>
              <Text className="text-sm text-muted-foreground">Stayed 4 nights in September</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Icon name="star" size="sm" color="foreground" filled />
              <Text className="text-[15px] font-medium tabular-nums text-foreground">5.0</Text>
            </View>
          </View>
          <Text numberOfLines={3} className="text-[15px] leading-6 text-foreground">
            The pool gets the last of the sun around six, and the kitchen had everything we needed for long dinners.
            Quiet road, easy walk to the bakery in the village.
          </Text>
        </View>
      </View>
    </Accent>
  );
}
