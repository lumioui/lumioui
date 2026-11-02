import * as React from "react";
import { View } from "react-native";
import { BAND_STAGGER, Sheen, SwitchOn } from "@lumioui/core";
import { Grid } from "../grid";
import { Icon } from "../../icon/icon";
import { Image } from "../../image/image";
import { ActionSwapText } from "../../action-swap/action-swap";
import { LikeButton } from "../../like-button/like-button";
import { Text } from "../../text/text";

const PRODUCTS = [
  { name: "Boxy linen overshirt", price: "$118", photo: "photo-1740711152088-88a009e877bb" },
  { name: "Colour-block trainer", price: "$145", photo: "photo-1560769629-975ec94e6a86" },
  { name: "Relaxed wool coat", price: "$290", photo: "photo-1619603364937-8d7af41ef206" },
  { name: "Everyday tee, 3-pack", price: "$64", photo: "photo-1489987707025-afc232f7ea0f" },
];

/** One product tile. Saving fills the heart in place and a single sheen
 *  crosses the photo — the saved thing is what lights up. */
function ProductTile({
  p,
  saved,
  onSavedChange,
}: {
  p: (typeof PRODUCTS)[number];
  saved: boolean;
  onSavedChange: (saved: boolean) => void;
}) {
  const [sheen, setSheen] = React.useState(0);
  return (
    <View className="gap-2">
      <View className="overflow-hidden rounded-xl">
        <Image
          source={{ uri: `https://images.unsplash.com/${p.photo}?w=400&h=500&fit=crop&q=70&auto=format` }}
          aspectRatio={4 / 5}
          rounded="xl"
          className="w-full bg-muted"
          alt={p.name}
        />
        <Sheen run={sheen} />
        <View className="absolute right-1 top-1">
          <LikeButton
            variant="overlay"
            size="sm"
            color="destructive"
            hideCount
            liked={saved}
            onLikedChange={(next) => {
              if (next) setSheen((n) => n + 1);
              onSavedChange(next);
            }}
            accessibilityLabel={saved ? `Remove ${p.name} from saved` : `Save ${p.name}`}
          />
        </View>
      </View>
      <View>
        <Text className="text-[15px] font-medium" numberOfLines={1}>{p.name}</Text>
        <Text className="text-[15px] tabular-nums text-muted-foreground">{p.price}</Text>
      </View>
    </View>
  );
}

/** GridMenu — a two-column product grid in a clothing store: photo tile,
 *  name, price. Tiles switch on in reading order under the header. The
 *  heart on each tile fills in place and the header count swaps with a
 *  short rise or fall. Ink on neutral, the fashion-retail idiom. Built
 *  from free parts only (like-button, action-swap). */
export function GridMenu() {
  const [saved, setSaved] = React.useState<string[]>(["Relaxed wool coat"]);
  const set = (name: string, on: boolean) =>
    setSaved((s) => (on ? (s.includes(name) ? s : [...s, name]) : s.filter((x) => x !== name)));
  return (
    <View className="w-full gap-3">
      <SwitchOn className="flex-row items-end justify-between px-1">
        <View>
          <Text className="text-2xl font-bold tracking-tight">New this week</Text>
          <Text variant="muted">Northbound Supply · 48 items</Text>
        </View>
        <View className="flex-row items-center gap-1 pb-1">
          <Icon name="heart" size="sm" color="foreground" filled={saved.length > 0} />
          <ActionSwapText value={String(saved.length)}>
            <Text className="text-[15px] font-medium tabular-nums text-foreground">{saved.length}</Text>
          </ActionSwapText>
        </View>
      </SwitchOn>
      <Grid columns={2} gap={12} cascade cascadeDelay={BAND_STAGGER} className="w-full">
        {PRODUCTS.map((p) => (
          <ProductTile
            key={p.name}
            p={p}
            saved={saved.includes(p.name)}
            onSavedChange={(on) => set(p.name, on)}
          />
        ))}
      </Grid>
    </View>
  );
}
