import * as React from "react";
import { View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { cn, timing } from "@lumioui/core";
import { ToggleGroup, ToggleGroupItem } from "../toggle-group";
import { Text } from "../../text/text";

const MARKS = [
  { value: "bold", glyph: "B", label: "Bold", text: "font-bold" },
  { value: "italic", glyph: "I", label: "Italic", text: "italic" },
  { value: "underline", glyph: "U", label: "Underline", text: "underline" },
  { value: "strike", glyph: "S", label: "Strikethrough", text: "line-through" },
] as const;

function summary(marks: string[]) {
  if (marks.length === 0) return "Plain text";
  return MARKS.filter((m) => marks.includes(m.value))
    .map((m) => m.label)
    .join(" + ");
}

/** ToggleGroupMultiple — the formatting bar of a field-notes editor. Picked
 *  marks light up; neighbours that are both on join into one bar of light.
 *  The selected phrase restyles live and the summary swaps in place. */
export function ToggleGroupMultiple() {
  const [marks, setMarks] = React.useState<string[]>(["bold", "italic"]);
  const ordered = MARKS.map((m) => m.value).filter((v) => marks.includes(v));
  const phrase = cn(
    "text-[17px] leading-7 text-foreground",
    MARKS.filter((m) => marks.includes(m.value)).map((m) => m.text)
  );
  const line = summary(ordered);
  return (
    <View className="w-full">
      <View className="w-full gap-5 rounded-3xl bg-card p-5">
        <View className="gap-1">
          <Text className="text-[13px] font-medium text-muted-foreground">Field notes · Tue 14 Oct</Text>
          <Text className="text-[22px] font-bold tracking-tight">Low tide at Harrow Point</Text>
        </View>

        <Text className="text-[17px] leading-7 text-muted-foreground">
          The pools filled again by noon.{" "}
          <Text className={cn(phrase, "bg-primary/10")}>Three sea hares under the kelp ledge</Text>
          , none of them there on Sunday.
        </Text>

        <View className="flex-row items-center justify-between">
          <ToggleGroup
            type="multiple"
            value={ordered}
            onValueChange={(v) => setMarks(v as string[])}
            accessibilityLabel="Text style"
            className="flex-nowrap gap-1"
          >
            {MARKS.map((m) => (
              <ToggleGroupItem
                key={m.value}
                value={m.value}
                className="h-11 w-12 px-0"
                textClassName={cn("text-[17px]", m.text)}
                accessibilityLabel={m.label}
              >
                {m.glyph}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          {/* Summary — the outgoing line dims while the new one ignites. */}
          <View className="h-6 flex-1 items-end justify-center" accessibilityLiveRegion="polite">
            <Animated.View
              key={line}
              entering={FadeIn.duration(timing.fast.duration)}
              exiting={FadeOut.duration(timing.recede.duration)}
              className="absolute right-0"
            >
              <Text className="text-[13px] font-medium text-muted-foreground">{line}</Text>
            </Animated.View>
          </View>
        </View>
      </View>
    </View>
  );
}
