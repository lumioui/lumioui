import * as React from "react";
import { Image, Pressable, ScrollView, View } from "react-native";
import { Accent, BAND_STAGGER, SwitchOn } from "@lumioui/core";
import { SectionHeader } from "../section-header";
import { Text } from "../../text/text";

const img = (id: string) => `https://images.unsplash.com/${id}?w=400&h=500&fit=crop&q=70&auto=format`;

const DINNERS = [
  { title: "Miso butter noodles", meta: "22 min · 4 servings", photo: img("photo-1569718212165-3a8278d5f624") },
  { title: "Charred greens bowl", meta: "18 min · 2 servings", photo: img("photo-1512621776951-a57141f2eefd") },
  { title: "Brown butter rigatoni", meta: "25 min · 4 servings", photo: img("photo-1621996346565-e3dbc646d9a9") },
];

const SEASON = [
  { title: "Squash & sage tacos", meta: "30 min", photo: img("photo-1551504734-5ee1c4a1479b") },
  { title: "Harvest grain bowl", meta: "20 min", photo: img("photo-1546069901-ba9599a7e63c") },
  { title: "Pear frangipane", meta: "55 min", photo: img("photo-1551024506-0bccd828d307") },
];

function Rail({ items, wide }: { items: typeof DINNERS; wide?: boolean }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="gap-3 px-5"
    >
      {items.map((it) => (
        <Pressable
          key={it.title}
          accessibilityRole="button"
          accessibilityLabel={`${it.title}, ${it.meta}`}
          className={wide ? "w-[220px] gap-2" : "w-[148px] gap-2"}
        >
          <Image
            source={{ uri: it.photo }}
            className={wide ? "h-[160px] w-full rounded-2xl bg-muted" : "h-[148px] w-full rounded-2xl bg-muted"}
            accessibilityIgnoresInvertColors
          />
          <View className="gap-1">
            <Text numberOfLines={1} className="text-[15px] font-medium text-foreground">
              {it.title}
            </Text>
            <Text className="text-sm text-muted-foreground">{it.meta}</Text>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

/** SectionHeaderEditorial — a recipe app's home feed: large editorial
 *  openers with a one-line subtitle and a chevron "See all", each
 *  introducing a photo rail. Each opener lights first and its rail follows
 *  a band later. Orange accent (food) on the actions only. */
export function SectionHeaderEditorial() {
  return (
    <Accent color="orange" className="w-full">
      <View className="w-full gap-8 overflow-hidden rounded-3xl bg-background py-6">
        <View className="gap-4">
          <SectionHeader
            size="large"
            switchOn
            title="Weeknight dinners"
            subtitle="Under 30 minutes, picked for October"
            action="See all"
            className="px-5"
          />
          <SwitchOn delay={BAND_STAGGER}>
            <Rail items={DINNERS} wide />
          </SwitchOn>
        </View>
        <View className="gap-4">
          <SectionHeader
            size="large"
            switchOn={BAND_STAGGER * 2}
            title="Back in season"
            subtitle="Squash, pears and sage"
            action="See all"
            className="px-5"
          />
          <SwitchOn delay={BAND_STAGGER * 3}>
            <Rail items={SEASON} />
          </SwitchOn>
        </View>
      </View>
    </Accent>
  );
}
