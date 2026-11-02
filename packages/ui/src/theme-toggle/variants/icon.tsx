import * as React from "react";
import { View } from "react-native";
import { Accent, darkColors, lightColors, useTheme } from "@lumioui/core";
import { ThemeToggle, type ThemeScheme } from "../theme-toggle";
import { CircleReveal, type CircleRevealHandle } from "../../circle-reveal/circle-reveal";
import { Icon } from "../../icon/icon";
import { Text } from "../../text/text";

const PALETTE = { light: lightColors, dark: darkColors } as const;

/** ThemeToggleIcon — the reader is the hero. Tap the sun in the article
 *  toolbar: its rays dim, the shadow slides across and it becomes the moon,
 *  then night floods out of the toggle through the article text. Tap the
 *  moon and a small light comes up at the toggle first, the day floods back
 *  and the rays draw on one by one. */
export function ThemeToggleIcon() {
  const reveal = React.useRef<CircleRevealHandle>(null);
  const { scheme: inherited } = useTheme();
  const [picked, setPicked] = React.useState<ThemeScheme | null>(null);
  const scheme: ThemeScheme = picked ?? inherited;
  const pending = React.useRef<ThemeScheme>(scheme);

  return (
    <Accent color={PALETTE[scheme].primary} scheme={scheme} className="w-full overflow-hidden rounded-3xl bg-background">
      <View className="flex-row items-center gap-1 border-b border-border px-2 py-1">
        <View className="h-11 w-11 items-center justify-center">
          <Icon name="chevron-left" size="md" accessibilityLabel="Back to library" />
        </View>
        <Text className="flex-1 text-center text-[15px] font-semibold" numberOfLines={1}>
          Reader
        </Text>
        <View className="h-11 w-11 items-center justify-center">
          <Icon name="type" size="md" accessibilityLabel="Text settings" />
        </View>
        <ThemeToggle
          variant="icon"
          scheme={scheme}
          onSchemeChange={(next, e) => {
            pending.current = next;
            reveal.current?.reveal(e, PALETTE[next].background);
          }}
        />
      </View>

      <View className="gap-4 px-5 pb-8 pt-6">
        <View className="gap-2">
          <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Long read · Rail</Text>
          <Text className="text-[30px] font-bold leading-tight tracking-tight">
            The sleeper trains are full again
          </Text>
          <Text variant="muted">Halden Review · Ada Okoro · 14 min read</Text>
        </View>
        <Text className="text-[17px] leading-7">
          At 21:38 the night service to Carrow leaves Marrin Central with every couchette sold. Five years ago the route did not
          exist; the carriages were parked in a siding outside Venn, waiting for scrap.
        </Text>
        <Text className="text-[17px] leading-7">
          Operators that retired their sleepers are now buying them back, and the waiting list for the winter timetable already
          runs into spring.
        </Text>
        <Text className="text-[17px] leading-7 text-muted-foreground">
          “People want to arrive rested,” says the line's planner, who has added a third couchette car twice since March.
        </Text>
      </View>

      <CircleReveal ref={reveal} className="top-[53px]" onCovered={() => setPicked(pending.current)} />
    </Accent>
  );
}
