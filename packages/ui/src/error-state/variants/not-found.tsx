import * as React from "react";
import { View } from "react-native";
import { SwitchOn, rowDelay } from "@lumioui/core";
import { ErrorState } from "../error-state";
import { Button } from "../../button/button";
import { Icon } from "../../icon/icon";
import { Text } from "../../text/text";

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const SIMILAR = [
  { name: "Waxed cotton field jacket", meta: "Size M · Good condition", price: "$88", tile: "bg-stone-500" },
  { name: "Quilted barn jacket", meta: "Size M · Like new", price: "$64", tile: "bg-tint-green" },
  { name: "Corduroy-collar work coat", meta: "Size M · Worn in", price: "$52", tile: "bg-tint-amber" },
];

/** ErrorStateNotFound — a resale marketplace opened from a shared link to
 *  a listing that's gone. Compact back-chevron header, the 404 code
 *  kept small, "Browse similar" spins, the error dims in place and the
 *  matches switch on 40ms apart. Ink, no accent. */
export function ErrorStateNotFound() {
  const [similar, setSimilar] = React.useState(false);
  return (
    <View className="min-h-[640px] w-full">
      <View className="h-11 flex-row items-center">
        <Icon name="chevron-left" size="md" color="foreground" />
        <Text className="flex-1 text-center text-[17px] font-semibold">{similar ? "Similar listings" : "Listing"}</Text>
        <View className="w-6" />
      </View>
      {similar ? (
        <View className="mt-4 gap-4">
          <View className="overflow-hidden rounded-2xl bg-card">
            {SIMILAR.map((s, i) => (
              // Matches switch on 40ms apart where the error dimmed away.
              <SwitchOn key={s.name} delay={rowDelay(i)} className={i > 0 ? "flex-row items-center gap-3 border-t border-border p-3" : "flex-row items-center gap-3 p-3"}>
                <View className={`h-16 w-16 items-center justify-center rounded-xl ${s.tile}`}>
                  <Icon name="shirt" size="md" color="#FFFFFF" />
                </View>
                <View className="flex-1 gap-0.5">
                  <Text className="text-[15px] font-semibold">{s.name}</Text>
                  <Text className="text-sm text-muted-foreground">{s.meta}</Text>
                </View>
                <Text className="text-base font-semibold tabular-nums">{s.price}</Text>
              </SwitchOn>
            ))}
          </View>
          <Button variant="ghost" onPress={() => setSimilar(false)}>
            Back to the sold listing
          </Button>
        </View>
      ) : (
        <ErrorState
          kind="not-found"
          title="This listing has sold"
          description="The waxed field jacket from @mirela.k sold yesterday. Similar ones in size M are still around."
          code="404 · loopmarket.app/l/8812-KQ"
          retryLabel="Browse similar"
          onRetry={() => wait(900)}
          onRecover={() => setSimilar(true)}
          secondaryAction={{ label: "Save a search for this jacket", onPress: () => undefined }}
        />
      )}
    </View>
  );
}
