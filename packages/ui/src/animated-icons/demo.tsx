import * as React from "react";
import { Pressable, View } from "react-native";
import { Accent, useTheme } from "@lumioui/core";
import { Text } from "../text";
import { AnimatedIcon, type AnimatedIconName } from "./animated-icons";

/** Playground preview — a reading app's page and its toolbar. Every tool
 *  plays its own gesture with a bead of light running along its strokes:
 *  highlight marks the passage, bookmark dips and fills in the accent,
 *  share draws on, and night mode turns the page dark as the sun becomes a
 *  moon. Not installed with the component. */
export function AnimatedIconsDemo() {
  // Start in the app's own scheme; the Night mode action still flips it.
  const { scheme } = useTheme();
  const [night, setNight] = React.useState(scheme === "dark");
  const [saved, setSaved] = React.useState(false);
  const [marked, setMarked] = React.useState(false);
  const [beats, setBeats] = React.useState<Record<string, number>>({});
  const beat = (k: string) => setBeats((b) => ({ ...b, [k]: (b[k] ?? 0) + 1 }));

  const tools: { key: string; icon: AnimatedIconName; label: string; on?: boolean; press: () => void }[] = [
    {
      key: "highlight",
      icon: "edit",
      label: marked ? "Remove highlight" : "Highlight passage",
      on: marked,
      press: () => {
        setMarked((v) => !v);
        beat("highlight");
      },
    },
    {
      key: "bookmark",
      icon: "bookmark",
      label: saved ? "Remove bookmark" : "Bookmark page",
      on: saved,
      press: () => {
        setSaved((v) => !v);
        beat("bookmark");
      },
    },
    { key: "share", icon: "share", label: "Share quote", press: () => beat("share") },
    {
      key: "night",
      icon: night ? "moon" : "sun",
      label: night ? "Day mode" : "Night mode",
      on: night,
      press: () => {
        setNight((v) => !v);
        beat("night");
      },
    },
  ];

  return (
    <Accent color="amber" scheme={night ? "dark" : "light"} className="w-full">
      <View className="w-full overflow-hidden rounded-[20px] bg-card">
        <View className="flex-row items-center px-2 pt-2">
          <View className="h-11 w-11 items-center justify-center">
            <AnimatedIcon name="chevron-left" size="md" color="mutedForeground" />
          </View>
          <Text className="flex-1 text-center text-[13px] text-muted-foreground">The Lantern Keeper · Chapter 4</Text>
          <View className="h-11 w-11" />
        </View>
        <View className="gap-4 px-6 pb-6 pt-3">
          <Text className="text-[22px] font-bold tracking-tight text-foreground">The north light</Text>
          <Text className="text-[17px] leading-7 text-foreground">
            Every evening Wren climbed the ninety steps with a can of oil and a rag.{" "}
            <Text className={marked ? "bg-primary/30 text-[17px] leading-7 text-foreground" : "text-[17px] leading-7 text-foreground"}>
              The lamp did not care whether anyone was at sea; it only asked to be lit, and she had never once said no.
            </Text>{" "}
            Below her the harbour folded into dark water, one window at a time.
          </Text>
          <Text className="text-[13px] text-muted-foreground">Page 61 of 212 · 14 min left in chapter</Text>
        </View>

        <View className="flex-row border-t border-border px-4 pb-2 pt-1">
          {tools.map((tool) => (
            <Pressable
              key={tool.key}
              onPress={tool.press}
              accessibilityRole="button"
              accessibilityLabel={tool.label}
              accessibilityState={tool.on === undefined ? undefined : { selected: tool.on }}
              className="h-12 flex-1 items-center justify-center"
            >
              <AnimatedIcon
                name={tool.icon}
                size="md"
                trigger={beats[tool.key]}
                color={tool.on && tool.key !== "night" ? "primaryText" : "foreground"}
              />
            </Pressable>
          ))}
        </View>
      </View>
    </Accent>
  );
}
