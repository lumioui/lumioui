import * as React from "react";
import { Text, View } from "react-native";
import { Accent, useTheme } from "@lumioui/core";
import { HANDWRITING, PAPER, Sticker } from "./sticker";
import { Tape } from "../tape/tape";
import { PostageStamp } from "../postage-stamp/postage-stamp";

const TRAM = { uri: "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=400&h=400&fit=crop&q=80&auto=format" };
const PORTO = { uri: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=400&h=400&fit=crop&q=80&auto=format" };
const BEACH = { uri: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300&h=380&fit=crop&q=80&auto=format" };

/** Playground preview — a travel scrapbook page from a week in Portugal.
 *  Every sticker lifts and peels under your finger; the Lisboa label sits
 *  with its corner already curling. Not installed with the component. */
export function StickerDemo() {
  const { scheme, colors } = useTheme();
  // A cream page by day, a black photo-album page by night.
  const page = scheme === "dark" ? colors.card : PAPER.stock.light;
  const ink = scheme === "dark" ? colors.foreground : PAPER.ink;
  return (
    <Accent color="teal" className="w-full">
      <View className="w-full gap-3">
        <View className="flex-row items-baseline justify-between px-1">
          <Text className="text-xl font-semibold tracking-tight text-foreground">Portugal</Text>
          <Text className="text-sm text-muted-foreground">12–19 Oct · page 3</Text>
        </View>

        <View className="h-[440px] w-full overflow-hidden rounded-3xl border border-border" style={{ backgroundColor: page }}>
          {/* Notebook dots */}
          <View pointerEvents="none" className="absolute inset-0 flex-row flex-wrap gap-5 p-4 opacity-30">
            {Array.from({ length: 140 }, (_, i) => (
              <View key={i} className="h-1 w-1 rounded-full" style={{ backgroundColor: ink }} />
            ))}
          </View>

          <Text
            className="absolute left-6 top-5"
            style={{ fontFamily: HANDWRITING, fontSize: 26, color: ink, transform: [{ rotate: "-2deg" }] }}
          >
            Lisbon → Porto
          </Text>

          <Sticker
            image={TRAM}
            shape="circle"
            size={128}
            tilt={-7}
            className="absolute left-5 top-20"
            accessibilityLabel="Sticker: the yellow 28 tram in Lisbon"
          />
          <Sticker
            image={PORTO}
            size={132}
            tilt={5}
            backdrop={page}
            className="absolute right-5 top-16"
            accessibilityLabel="Sticker: Porto's riverfront"
          />
          <Tape className="absolute right-12 top-12" width={70} tilt={-14} />

          <PostageStamp
            image={BEACH}
            width={92}
            value="€0.95"
            country="Portugal"
            tilt={-5}
            className="absolute left-8 top-[240px]"
          />

          <Sticker
            shape="rounded"
            tilt={-3}
            backdrop={page}
            contentClassName="bg-card px-4 py-3"
            className="absolute right-6 top-[258px]"
            accessibilityLabel="Sticker: 6 days, 412 km, 3 trains"
          >
            <Text className="text-[28px] font-bold leading-none tracking-tight text-card-foreground">412 km</Text>
            <Text className="mt-1 text-[13px] font-medium text-muted-foreground">6 days · 3 trains</Text>
          </Sticker>

          <Sticker
            shape="pill"
            tilt={6}
            peel={0.45}
            backdrop={page}
            contentClassName="bg-primary px-5 py-2"
            className="absolute left-[30%] top-[196px]"
            accessibilityLabel="Sticker: Lisboa"
          >
            <Text className="text-lg font-bold tracking-tight text-primary-foreground">Lisboa</Text>
          </Sticker>

          <Text
            className="absolute bottom-5 left-[44%] right-5"
            style={{ fontFamily: HANDWRITING, fontSize: 17, color: ink, transform: [{ rotate: "-1deg" }] }}
          >
            pastéis at 8am, every day. no regrets.
          </Text>
        </View>
      </View>
    </Accent>
  );
}
