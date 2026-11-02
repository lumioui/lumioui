import * as React from "react";
import { Pressable, View, type GestureResponderEvent } from "react-native";
import { Accent, darkColors, lightColors, useTheme } from "@lumioui/core";
import { CircleReveal, type CircleRevealHandle } from "../circle-reveal";
import { Icon, type IconName } from "../../icon/icon";
import { Switch } from "../../switch/switch";
import { Text } from "../../text/text";

type Scheme = "light" | "dark";
const PALETTE = { light: lightColors, dark: darkColors } as const;

interface RowProps {
  icon: IconName;
  tint: string;
  title: string;
  detail?: string;
  last?: boolean;
  children?: React.ReactNode;
}

/** Settings row — per-item colour disc, inset hairline. */
function Row({ icon, tint, title, detail, last, children }: RowProps) {
  return (
    <View className="min-h-[52px] flex-row items-center gap-3 pl-4">
      <View style={{ backgroundColor: tint }} className="h-8 w-8 items-center justify-center rounded-lg">
        <Icon name={icon} size="sm" color="#FFFFFF" strokeWidth={2.2} />
      </View>
      <View className={`min-h-[52px] flex-1 flex-row items-center gap-2 pr-4 ${last ? "" : "border-b border-border"}`}>
        <Text className="flex-1 text-base">{title}</Text>
        {detail ? <Text className="text-[15px] text-muted-foreground">{detail}</Text> : null}
        {children ?? <Icon name="chevron-right" size="sm" color="mutedForeground" />}
      </View>
    </View>
  );
}

/** CircleRevealTheme — Display settings in a reading app. Tap the sun/moon:
 *  the other scheme's canvas floods out of the button, the whole screen
 *  re-themes under the cover, and the circle melts away. Ink, because
 *  settings are chrome. */
export function CircleRevealTheme() {
  const reveal = React.useRef<CircleRevealHandle>(null);
  // Opens in the app's scheme; a tap pins the other one (resolved in
  // render, so a site-theme change before any tap is followed too).
  const { scheme: inherited } = useTheme();
  const [picked, setPicked] = React.useState<Scheme | null>(null);
  const scheme: Scheme = picked ?? inherited;
  const [warmTint, setWarmTint] = React.useState(true);
  const [dimImages, setDimImages] = React.useState(false);
  const next: Scheme = scheme === "light" ? "dark" : "light";

  const toggle = (e: GestureResponderEvent) => reveal.current?.reveal(e, PALETTE[next].background);

  return (
    <View className="min-h-[700px] w-full flex-1 overflow-hidden">
      <Accent color={PALETTE[scheme].primary} scheme={scheme} className="flex-1 bg-background">
        <View className="flex-1 gap-6 px-4 pb-8 pt-6">
          <View className="flex-row items-center justify-between pl-1">
            <Text className="text-3xl font-bold tracking-tight">Display</Text>
            <Pressable
              onPress={toggle}
              accessibilityRole="button"
              accessibilityLabel={scheme === "light" ? "Switch to dark mode" : "Switch to light mode"}
              className="h-11 w-11 items-center justify-center rounded-full bg-card"
            >
              <Icon name={scheme === "light" ? "moon" : "sun"} size="md" color="foreground" strokeWidth={2.2} />
            </Pressable>
          </View>

          <View className="gap-3 rounded-2xl bg-card p-5">
            <Text className="text-sm text-muted-foreground">Preview · Chapter 4</Text>
            <Text className="text-[17px] leading-6">
              The ferry left at dusk, and by the time the harbour lights had thinned to a single line, Mara had read the letter three
              times.
            </Text>
          </View>

          <View className="gap-2">
            <Text className="pl-4 text-sm text-muted-foreground">Appearance</Text>
            <View className="overflow-hidden rounded-2xl bg-card">
              <Row icon={scheme === "light" ? "sun" : "moon"} tint="#3F3F46" title="Theme" detail={scheme === "light" ? "Light" : "Dark"} />
              <Row icon="type" tint="#0F766E" title="Text size" detail="17 pt" />
              <Row icon="eye" tint="#C2410C" title="Warm tint">
                <Switch checked={warmTint} onCheckedChange={setWarmTint} accessibilityLabel="Warm tint" />
              </Row>
              <Row icon="image" tint="#DB2777" title="Dim images in dark" last>
                <Switch checked={dimImages} onCheckedChange={setDimImages} accessibilityLabel="Dim images in dark" />
              </Row>
            </View>
          </View>
        </View>
      </Accent>

      <CircleReveal ref={reveal} onCovered={() => setPicked(next)} />
    </View>
  );
}
