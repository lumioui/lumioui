import * as React from "react";
import { View } from "react-native";
import { Accent } from "@lumioui/core";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../tabs";
import { Image } from "../../image/image";
import { Text } from "../../text/text";

const U = (id: string) => `https://images.unsplash.com/${id}?w=240&h=240&fit=crop&q=70&auto=format`;

type Story = { title: string; source: string; when: string; img: string };

const FEED: Record<string, Story[]> = {
  top: [
    { title: "City council approves 24-hour transit pilot on three lines", source: "Bay Ledger", when: "12 min", img: "photo-1685391691429-d1a2e354cc42" },
    { title: "Markets edge higher as chipmakers rally into earnings week", source: "Market Desk", when: "40 min", img: "photo-1611974789855-9c2a0a7236a3" },
    { title: "Drought-hit farms turn to sensors to stretch every litre", source: "Field Report", when: "2 h", img: "photo-1500382017468-9049fed747ef" },
  ],
  tech: [
    { title: "The quiet return of the phone with a headphone jack", source: "Circuit", when: "25 min", img: "photo-1511707171634-5f897ff02aa9" },
    { title: "Inside the lab building chips that sip power", source: "Circuit", when: "1 h", img: "photo-1518770660439-4636190af475" },
  ],
  culture: [
    { title: "A retro arcade revival is filling old malls again", source: "Weekend", when: "3 h", img: "photo-1550745165-9bc0b252726f" },
    { title: "Five films to catch before festival season ends", source: "Screen Notes", when: "5 h", img: "photo-1489599849927-2ee91cede3ba" },
  ],
};

function Feed({ id }: { id: string }) {
  return (
    <View>
      {(FEED[id] ?? []).map((s, i) => (
        <View key={s.title} className={`flex-row gap-3 px-4 py-4 ${i > 0 ? "border-t border-border" : ""}`}>
          <View className="flex-1 gap-1.5">
            <Text className="text-[13px] font-medium text-muted-foreground">{s.source}</Text>
            <Text className="text-base font-semibold leading-snug" numberOfLines={3}>{s.title}</Text>
            <Text className="text-xs text-muted-foreground">{s.when} ago</Text>
          </View>
          <Image source={{ uri: U(s.img) }} className="h-20 w-20 rounded-xl" alt="" />
        </View>
      ))}
    </View>
  );
}

/** TabsLine — underline tabs on a news reader: the underline
 *  glides and morphs to each tab's width (transform only), the accent
 *  tints the active label. Red for the newsroom. */
export function TabsLine() {
  const [tab, setTab] = React.useState("top");
  return (
    <Accent color="red" className="w-full">
      <View className="w-full overflow-hidden rounded-3xl bg-card pt-5">
        <Text className="px-4 pb-2 text-2xl font-bold tracking-tight">Headlines</Text>
        <Tabs variant="line" value={tab} onValueChange={setTab} className="w-full gap-0">
          <TabsList>
            <TabsTrigger value="top">Top stories</TabsTrigger>
            <TabsTrigger value="tech">Tech</TabsTrigger>
            <TabsTrigger value="culture">Culture</TabsTrigger>
          </TabsList>
          <TabsContent value="top"><Feed id="top" /></TabsContent>
          <TabsContent value="tech"><Feed id="tech" /></TabsContent>
          <TabsContent value="culture"><Feed id="culture" /></TabsContent>
        </Tabs>
      </View>
    </Accent>
  );
}
