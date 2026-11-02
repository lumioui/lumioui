import * as React from "react";
import { Image, View } from "react-native";
import { Accent } from "@lumioui/core";
import { CopyField } from "../copy-field";
import { Text } from "../../text/text";

const PHOTO = "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=480&fit=crop&q=70&auto=format";

/** CopyFieldPromo — a meal-kit offer shaped like a torn coupon. The code
 *  is the hero: big, dashed, one tap to copy, with the terms underneath. */
export function CopyFieldPromo() {
  return (
    <Accent color="orange" className="w-full">
      <View className="w-full overflow-hidden rounded-3xl bg-card">
        <Image
          source={{ uri: PHOTO }}
          className="h-40 w-full bg-muted"
          resizeMode="cover"
          accessibilityIgnoresInvertColors
          accessibilityLabel="Grain bowl with greens and roasted vegetables"
        />
        <View className="gap-1 px-5 pt-5">
          <Text className="text-2xl font-bold tracking-tight">15% off your next 3 boxes</Text>
          <Text className="text-[15px] text-muted-foreground">Harvest Table · autumn menu is live</Text>
        </View>

        {/* Perforation between the offer and the code stub. */}
        <View className="my-5 h-6 flex-row items-center">
          <View className="absolute -left-3 h-6 w-6 rounded-full bg-background" />
          <View className="mx-5 flex-1 border-t border-dashed border-border" />
          <View className="absolute -right-3 h-6 w-6 rounded-full bg-background" />
        </View>

        <View className="px-5 pb-5">
          <CopyField
            appearance="box"
            value="HARVEST15"
            mono
            copyLabel="Copy code"
            copiedLabel="Code copied"
            description="Ends Sunday · minimum order $40"
          />
        </View>
      </View>
    </Accent>
  );
}
