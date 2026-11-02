import * as React from "react";
import { Text, View } from "react-native";
import { Accent, useTheme } from "@lumioui/core";
import { PostageStamp } from "./postage-stamp";
import { HANDWRITING, PAPER, paperShadow } from "../sticker/sticker";

const img = (id: string, w = 300, h = 380) => ({
  uri: `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&q=80&auto=format`,
});

/** Address lines — pale ink, since the postcard stays light in both schemes. */
const RULE = "rgba(43,41,38,0.18)";

/** Playground preview — the back of a postcard from Porto, part of a
 *  travel scrapbook: a handwritten note, the address, and two stamps, one
 *  already postmarked. Press a stamp to lift it off the card. Never shipped
 *  in the registry payload. */
export function PostageStampDemo() {
  const { scheme } = useTheme();
  const card = PAPER.stock[scheme];
  return (
    <Accent color="teal" className="w-full">
      <View className="w-full gap-3">
        <View className="flex-row items-baseline justify-between px-1">
          <Text className="text-xl font-semibold tracking-tight text-foreground">Postcards</Text>
          <Text className="text-sm text-muted-foreground">sent 2 of 5</Text>
        </View>

        <View
          className="w-full flex-row rounded-md p-4"
          style={[{ backgroundColor: card, minHeight: 300, transform: [{ rotate: "1deg" }] }, paperShadow(false)]}
        >
          <View className="flex-1 pr-3">
            <Text style={{ fontFamily: HANDWRITING, fontSize: 16, lineHeight: 23, color: PAPER.ink }}>
              Gran — the river here glows orange at 7pm and everyone just stops to watch it. Ate far too many
              francesinhas. Home Sunday!{"\n"}x Mia
            </Text>
          </View>

          <View className="w-px" style={{ backgroundColor: RULE }} />

          <View className="flex-1 pl-3">
            <View className="flex-row justify-end gap-1">
              <PostageStamp
                width={64}
                value="€0.95"
                tilt={4}
                accessibilityLabel="Postage stamp, Portugal, 95 cents"
              >
                <View className="flex-1 items-center justify-center bg-primary">
                  <Text className="text-2xl font-bold text-primary-foreground">PT</Text>
                </View>
              </PostageStamp>
              <PostageStamp
                image={img("1555881400-74d7acaacd8b")}
                width={72}
                value="€1.20"
                postmark="PORTO · 15 OUT"
                tilt={-5}
              />
            </View>

            <View className="mt-auto gap-5 pb-2">
              {["Margaret Hale", "14 Linden Road", "Bristol BS6 7RJ", "United Kingdom"].map((line) => (
                <View key={line} className="border-b pb-1" style={{ borderColor: RULE }}>
                  <Text numberOfLines={1} style={{ fontFamily: HANDWRITING, fontSize: 15, color: PAPER.ink }}>
                    {line}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View className="flex-row items-center justify-center gap-4 pt-2">
          <PostageStamp image={img("1507525428034-b723cf961d3e")} width={88} value="€0.95" country="Algarve" tilt={-4} />
          <PostageStamp image={img("1585208798174-6cedd86e019a")} width={88} value="€1.20" country="Lisboa" tilt={3} />
          <PostageStamp image={img("1513735492246-483525079686")} width={88} value="€2.00" country="Porto" tilt={-2} />
        </View>
      </View>
    </Accent>
  );
}
