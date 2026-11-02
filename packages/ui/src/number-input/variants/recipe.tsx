import * as React from "react";
import { View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from "react-native-reanimated";
import { Accent, ROW_STAGGER, ease, spring, timing, useReducedMotion } from "@lumioui/core";
import { NumberInput } from "../number-input";
import { Text } from "../../text/text";

const BASE_SERVINGS = 4;
const INGREDIENTS: { name: string; qty: number; unit: string; step?: number }[] = [
  { name: "Ripe tomatoes", qty: 800, unit: "g" },
  { name: "Eggs", qty: 6, unit: "", step: 1 },
  { name: "Red pepper", qty: 2, unit: "", step: 0.5 },
  { name: "Feta", qty: 150, unit: "g" },
  { name: "Ground cumin", qty: 2, unit: "tsp", step: 0.25 },
  { name: "Olive oil", qty: 3, unit: "tbsp", step: 0.5 },
];

function scaled(qty: number, servings: number, step = 10) {
  const v = Math.round(((qty * servings) / BASE_SERVINGS) / step) * step;
  return Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/0$/, "");
}

/** While a held + is auto-stepping the cascade tightens so it keeps up. */
const HELD_STAGGER = 24;
/** A quantity's swap travel (pt) — the same as the stepper's figure. */
const TRAVEL = 4;

/** One quantity that swaps in place when it changes, on its turn in the
 *  cascade: the old figure dims while the new one ignites and settles in the
 *  direction of the change. */
function Qty({ text, delay, dir }: { text: string; delay: number; dir: 1 | -1 }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = React.useState({ text, prev: text });
  if (shown.text !== text) setShown({ text, prev: shown.text });
  const inT = useSharedValue(1);
  const rise = useSharedValue(1);
  const outT = useSharedValue(1);
  React.useEffect(() => {
    if (shown.prev === shown.text) return;
    outT.value = 0;
    outT.value = withDelay(delay, withTiming(1, { ...timing.recede, easing: Easing.bezier(...ease.in) }));
    inT.value = 0;
    inT.value = withDelay(delay, withTiming(1, { ...timing.fast, easing: Easing.bezier(...ease.out) }));
    if (reduce) rise.value = 1;
    else {
      rise.value = 0;
      rise.value = withDelay(delay, withSpring(1, spring.swap));
    }
  }, [shown, delay, reduce, inT, rise, outT]);
  const inStyle = useAnimatedStyle(() => ({
    opacity: inT.value,
    transform: [{ translateY: (1 - rise.value) * TRAVEL * dir }],
  }));
  const outStyle = useAnimatedStyle(() => ({
    opacity: 1 - outT.value,
    transform: reduce ? [] : [{ translateY: -outT.value * (TRAVEL / 2) * dir }],
  }));
  return (
    <View>
      <Animated.View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        className="absolute inset-y-0 right-0 justify-center"
        style={outStyle}
      >
        <Text numberOfLines={1} className="text-base font-medium tabular-nums">
          {shown.prev}
        </Text>
      </Animated.View>
      <Animated.View style={inStyle}>
        <Text className="text-base font-medium tabular-nums">{text}</Text>
      </Animated.View>
    </View>
  );
}

/** NumberInputRecipe — a recipe app scaling shakshuka. Step servings (or
 *  type a number, clamped to 1–12) and the change runs down the list from
 *  the stepper: each ingredient quantity swaps in place 40ms after the one
 *  above it, rising as servings go up and falling as they go down. Holding
 *  + tightens the cascade to 24ms so it keeps pace. Orange. */
export function NumberInputRecipe() {
  const [servings, setServings] = React.useState(BASE_SERVINGS);
  const [run, setRun] = React.useState<{ dir: 1 | -1; held: boolean }>({ dir: 1, held: false });
  return (
    <Accent color="orange" className="w-full">
      <View className="w-full gap-6">
        <View className="gap-1 px-1">
          <Text className="text-2xl font-bold tracking-tight">Shakshuka with feta</Text>
          <Text variant="muted">35 min · One pan · Vegetarian</Text>
        </View>

        <NumberInput
          label="Servings"
          value={servings}
          onValueChange={(n) => {
            // Typed commits carry their direction here; steps refine it in onStep.
            setRun((r) => ({ dir: n >= servings ? 1 : -1, held: r.held }));
            setServings(n);
          }}
          onStep={(_, { direction, repeating }) => setRun({ dir: direction, held: repeating })}
          min={1}
          max={12}
          unit={servings === 1 ? "serving" : "servings"}
          size="lg"
        />

        <View className="overflow-hidden rounded-2xl bg-card">
          {INGREDIENTS.map((ing, i) => (
            <View key={ing.name}>
              {i > 0 ? <View className="ml-4 h-px bg-border" /> : null}
              <View className="min-h-[48px] flex-row items-center px-4 py-2">
                <Text className="flex-1 text-base">{ing.name}</Text>
                <Qty
                  text={`${scaled(ing.qty, servings, ing.step)}${ing.unit ? ` ${ing.unit}` : ""}`}
                  delay={i * (run.held ? HELD_STAGGER : ROW_STAGGER)}
                  dir={run.dir}
                />
              </View>
            </View>
          ))}
        </View>
      </View>
    </Accent>
  );
}
