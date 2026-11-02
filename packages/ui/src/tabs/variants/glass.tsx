import * as React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { Tabs, TabsList, TabsTrigger } from "../tabs";

const PHOTO =
  "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80&auto=format&fit=crop";

const PANELS: Record<string, { title: string; lines: string[] }> = {
  lineup: { title: "Saturday lineup", lines: ["Doors 6:00 PM", "Palomar · 7:15", "Nightjar Choir · 8:30", "Ivo Marsh · 10:00"] },
  venue: { title: "The Greenroom", lines: ["220 Harbor Ave, Oakland", "Standing room · 1,200 cap", "BART: Lake Merritt, 6 min walk"] },
  tickets: { title: "2 tickets", lines: ["General admission", "Section B · Row 4", "$78.00 total, fees included"] },
};

/** TabsGlass — glass pill tabs floating over an event photo. Each tab
 *  swaps the caption block above it; the glass only exists because the
 *  photo is beneath it. */
export function TabsGlass() {
  const [tab, setTab] = React.useState("lineup");
  const p = PANELS[tab] ?? PANELS.lineup!;
  return (
    <View className="relative h-[520px] w-full overflow-hidden rounded-3xl bg-muted">
      <Image source={{ uri: PHOTO }} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityIgnoresInvertColors />
      <View className="absolute inset-x-0 bottom-0 gap-1 bg-black/55 px-5 pb-24 pt-5">
        <Text className="text-2xl font-bold tracking-tight text-white">{p.title}</Text>
        {p.lines.map((l) => (
          <Text key={l} className="text-[15px] text-white">{l}</Text>
        ))}
      </View>
      <View className="absolute bottom-5 left-5 right-5">
        <Tabs glass value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="lineup">Lineup</TabsTrigger>
            <TabsTrigger value="venue">Venue</TabsTrigger>
            <TabsTrigger value="tickets">Tickets</TabsTrigger>
          </TabsList>
        </Tabs>
      </View>
    </View>
  );
}
