import * as React from "react";
import { Text, View } from "react-native";
import { useTheme } from "@lumioui/core";
import { Polaroid } from "./polaroid";
import { Tape } from "../tape/tape";
import { HANDWRITING, PAPER } from "../sticker/sticker";

const img = (id: string) => ({ uri: `https://images.unsplash.com/photo-${id}?w=480&h=480&fit=crop&q=80&auto=format` });

const MEMORIES = [
  { key: "bridge", image: img("1513735492246-483525079686"), caption: "Ribeira at dusk", tilt: -6, left: "2%", top: 20, tape: -10 },
  { key: "friends", image: img("1529156069898-49953e39b3ac"), caption: "the whole crew", tilt: 5, left: "44%", top: 0, tape: 8 },
  { key: "tram", image: img("1585208798174-6cedd86e019a"), caption: "tram 28, again", tilt: -2, left: "20%", top: 220, tape: -4 },
] as const;

/** Playground preview — a memories board. Prints develop as they load;
 *  tap one to pick it up and it comes to the front of the pile. Never
 *  shipped in the registry payload. */
export function PolaroidDemo() {
  const { scheme, colors } = useTheme();
  const [order, setOrder] = React.useState<string[]>(MEMORIES.map((m) => m.key));
  const ink = scheme === "dark" ? colors.foreground : PAPER.ink;

  const bringForward = (key: string) => setOrder((o) => [...o.filter((k) => k !== key), key]);

  return (
    <View className="w-full gap-2">
      <View className="flex-row items-end justify-between px-1">
        <View>
          <Text className="text-sm font-medium text-muted-foreground">Summer ’26</Text>
          <Text className="text-2xl font-semibold tracking-tight text-foreground">Memories</Text>
        </View>
        <Text style={{ fontFamily: HANDWRITING, fontSize: 18, color: ink, transform: [{ rotate: "-3deg" }] }}>
          3 of 41
        </Text>
      </View>

      <View className="h-[470px] w-full">
        {MEMORIES.map((m) => (
          <View
            key={m.key}
            className="absolute"
            style={{ left: m.left, top: m.top, zIndex: order.indexOf(m.key) + 1 }}
          >
            <Polaroid
              image={m.image}
              caption={m.caption}
              tilt={m.tilt}
              width={176}
              onPress={() => bringForward(m.key)}
              accessibilityLabel={`Photo: ${m.caption}. Bring to front`}
            />
            <Tape
              width={64}
              height={24}
              tilt={m.tape}
              className="absolute -top-2 left-14"
              accessibilityLabel="Tape"
            />
          </View>
        ))}
      </View>
    </View>
  );
}
