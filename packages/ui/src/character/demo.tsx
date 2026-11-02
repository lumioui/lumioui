import * as React from "react";
import { Text, View } from "react-native";
import { Accent, LightFall, type AccentName } from "@lumioui/core";
import { Button } from "../button/button";
import { Slider } from "../slider/slider";
import { Character, expressionFor, type CharacterExpression, type CharacterShape } from "./character";

interface Step {
  shape: CharacterShape;
  accent: AccentName;
  expression: CharacterExpression;
  lead: string;
  tail: string;
  body: string;
}

const STEPS: Step[] = [
  {
    shape: "squircle",
    accent: "mint",
    expression: "calm",
    lead: "Meet",
    tail: "Pip, your wind-down buddy",
    body: "Pip keeps you company for the last hour before bed.",
  },
  {
    shape: "cloud",
    accent: "coral",
    expression: "sleepy",
    lead: "Pip",
    tail: "gets drowsy at 22:30",
    body: "When your bedtime nears, Pip dims and yawns so you notice.",
  },
  {
    shape: "blob",
    accent: "amber",
    expression: "happy",
    lead: "Six nights,",
    tail: "and counting",
    body: "Every night you keep, Pip brightens a little more.",
  },
  {
    shape: "circle",
    accent: "green",
    expression: "calm",
    lead: "How was",
    tail: "today?",
    body: "Slide to tell Pip. It wears your answer.",
  },
];

const MOODS = ["Rough", "Tired", "Okay", "Good", "Great"];

/** Playground preview — first run of a sleep app. Each step the character
 *  takes a new shape and the step's hue; the last step hands it to you: the
 *  mood value is its expression and its brightness. */
export function CharacterDemo() {
  const [index, setIndex] = React.useState(0);
  const [mood, setMood] = React.useState(60);
  const step = STEPS[index]!;
  const last = index === STEPS.length - 1;
  const expression = last ? expressionFor(mood / 100) : step.expression;
  const light = last ? 0.35 + 0.65 * (mood / 100) : 1;
  const moodLabel = MOODS[Math.min(MOODS.length - 1, Math.floor((mood / 100) * MOODS.length))]!;

  return (
    <Accent color={step.accent} className="w-full">
      <View className="w-full overflow-hidden rounded-3xl bg-card">
        <LightFall reach={0.7} />
        <View className="gap-6 p-5">
          <View
            className="flex-row items-center gap-2"
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel={`Step ${index + 1} of ${STEPS.length}`}
            accessibilityValue={{ min: 1, max: STEPS.length, now: index + 1 }}
          >
            {STEPS.map((s, i) => (
              <View
                key={s.shape}
                className={i <= index ? "h-1 flex-1 rounded-full bg-primary" : "h-1 flex-1 rounded-full bg-muted"}
              />
            ))}
          </View>

          <View className="items-center py-2">
            <Character shape={step.shape} expression={expression} light={light} size="xl" label={`Pip, ${expression}`} />
          </View>

          <View className="gap-2">
            {/* The character sits inline in the headline and follows it. */}
            <View className="flex-row flex-wrap items-center gap-x-2">
              {[...step.lead.split(" "), null, ...step.tail.split(" ")].map((word, i) =>
                word === null ? (
                  <Character key="pip" shape={step.shape} expression={expression} size="inline" label="" />
                ) : (
                  <Text key={i} className="text-2xl font-bold tracking-tight text-foreground">
                    {word}
                  </Text>
                )
              )}
            </View>
            <Text className="text-base text-muted-foreground">{step.body}</Text>
          </View>

          {last ? (
            <View className="gap-2">
              <Slider value={mood} onValueChange={setMood} min={0} max={100} step={1} accessibilityLabel="Today's mood" />
              <Text className="text-center text-sm font-semibold text-foreground">{moodLabel}</Text>
            </View>
          ) : null}

          <View className="w-full flex-row gap-3">
            {index > 0 ? (
              <Button size="lg" variant="secondary" className="flex-1" onPress={() => setIndex((i) => i - 1)}>
                Back
              </Button>
            ) : null}
            <Button
              size="lg"
              className="flex-1"
              onPress={() => setIndex((i) => (i + 1) % STEPS.length)}
            >
              {last ? "Start over" : "Continue"}
            </Button>
          </View>
        </View>
      </View>
    </Accent>
  );
}
