import * as React from "react";
import { View, Text } from "react-native";
import Animated, { FadeOutUp, LinearTransition } from "react-native-reanimated";
import { ROW_STAGGER, spring, timing, useReducedMotion } from "@lumioui/core";
import { Chip } from "../chip";
import { Button } from "../button";
import { TagInput } from "./tag-input";

const MAX = 5;
const SUGGESTED = ["Urbanism", "Cycling", "Housing", "Climate", "Local politics"];
/** A used suggestion lifts toward the field and dims; the rest close the gap. */
const LEAVE = FadeOutUp.duration(timing.recede.duration);
const closeGap = (i: number) =>
  LinearTransition.springify().damping(spring.layout.damping).stiffness(spring.layout.stiffness).delay(i * ROW_STAGGER);

/** Playground preview. Not installed with the component.
 *
 *  Publish step of a newsletter app, ink only. Type a topic and press
 *  return, comma or space: the text becomes the chip in place. A duplicate
 *  flickers the chip it repeats; a sixth topic flickers the counter.
 *  Suggestions add in one tap — the chip lifts toward the field as it lands
 *  there, and the row closes behind it 40ms apart. */
export function TagInputDemo() {
  const reduce = useReducedMotion();
  const [topics, setTopics] = React.useState<string[]>(["Transit", "Waterfront"]);
  const [note, setNote] = React.useState<string | null>(null);
  const left = SUGGESTED.filter((s) => !topics.some((t) => t.toLowerCase() === s.toLowerCase()));
  return (
    <View className="w-full gap-5 rounded-3xl bg-card p-5">
      <View className="gap-1">
        <Text className="text-2xl font-bold tracking-tight text-foreground">Add topics</Text>
        <Text className="text-sm text-muted-foreground">
          Readers find “The 15-minute canal city” through these.
        </Text>
      </View>

      <View className="gap-2">
        <TagInput
          label="Topics"
          placeholder="Add a topic"
          value={topics}
          onChange={(next) => {
            setTopics(next);
            setNote(null);
          }}
          maxTags={MAX}
          counter
          autoCapitalize="words"
          onReject={(tag, reason) =>
            setNote(reason === "duplicate" ? `“${tag}” is already added` : `Up to ${MAX} topics per post`)
          }
        />
        {note ? <Text className="text-[13px] text-muted-foreground">{note}</Text> : null}
      </View>

      {left.length > 0 ? (
        <View className="gap-2">
          <Text className="text-[13px] text-muted-foreground">Suggested</Text>
          <View className="flex-row flex-wrap gap-2">
            {left.map((s, i) => (
              <Animated.View key={s} exiting={LEAVE} layout={reduce ? undefined : closeGap(i)}>
                <Chip
                  variant="suggestion"
                  size="sm"
                  disabled={topics.length >= MAX}
                  onPress={() => {
                    setNote(null);
                    setTopics((cur) => (cur.length < MAX ? [...cur, s] : cur));
                  }}
                >
                  {s}
                </Chip>
              </Animated.View>
            ))}
          </View>
        </View>
      ) : null}

      <Button size="lg" className="w-full" disabled={topics.length === 0}>
        Publish
      </Button>
    </View>
  );
}
