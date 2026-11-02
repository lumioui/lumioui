import * as React from "react";
import { Pressable, View, type LayoutChangeEvent } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from "react-native-reanimated";
import { Accent, Sheen, ease, spring, timing, useHaptic, useReducedMotion, useTheme } from "@lumioui/core";
import { Textarea } from "../textarea";
import { Button } from "../../button/button";
import { Chip } from "../../chip/chip";
import { Icon } from "../../icon/icon";
import { Text } from "../../text/text";

const PROMPTS = ["What gave you energy?", "One thing you're grateful for", "What would you do differently?"];

/** The saved entry holds in place before it folds (act, hold, resolve). */
const SAVE_HOLD = 650;
/** Height of the folded "Saved" row. */
const SAVED_ROW = 64;
const DIM = { ...timing.recede, easing: Easing.bezier(...ease.in) };
const IGNITE = { ...timing.fast, easing: Easing.bezier(...ease.out) };

const clock = () => new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

/** TextareaNote — an evening journal entry in green. The field auto-grows
 *  as you write; tapping a prompt chip appends it as a new line. Save
 *  stamps the entry where it is: one sheen crosses the card, the words hold
 *  650ms, then the card folds on the surface spring into a "Saved" row that
 *  stays — tap it to keep writing. */
export function TextareaNote() {
  const haptic = useHaptic();
  const reduce = useReducedMotion();
  const { colors } = useTheme();
  const [entry, setEntry] = React.useState(
    "Walked the long way home along the canal. Finished the first draft of the grant before lunch."
  );
  const [phase, setPhase] = React.useState<"writing" | "holding" | "saved">("writing");
  const [savedAt, setSavedAt] = React.useState("");
  const [sheen, setSheen] = React.useState(0);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const full = React.useRef(0);
  const height = useSharedValue(-1);
  const body = useSharedValue(1);
  const row = useSharedValue(0);
  const cardStyle = useAnimatedStyle(() => (height.value < 0 ? {} : { height: height.value }));
  const bodyStyle = useAnimatedStyle(() => ({ opacity: body.value }));
  const rowStyle = useAnimatedStyle(() => ({ opacity: row.value }));

  const fold = (open: boolean) => {
    const to = open ? full.current : SAVED_ROW;
    height.value = height.value < 0 ? full.current : height.value;
    height.value = reduce ? withTiming(to, timing.normal) : withSpring(to, spring.surface);
    if (open) {
      row.value = withTiming(0, DIM);
      body.value = withDelay(timing.recede.duration, withTiming(1, IGNITE));
    } else {
      body.value = withTiming(0, DIM);
      row.value = withDelay(timing.recede.duration, withTiming(1, IGNITE));
    }
  };

  const save = () => {
    haptic.success();
    setSheen((n) => n + 1);
    setPhase("holding");
    timer.current = setTimeout(() => {
      setSavedAt(clock());
      setPhase("saved");
      fold(false);
    }, SAVE_HOLD);
  };

  const reopen = () => {
    haptic.light();
    setPhase("writing");
    fold(true);
    // Once open, the card hugs its content again so the field can keep growing.
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      height.value = -1;
    }, timing.slow.duration);
  };

  const saved = phase === "saved";
  return (
    <Accent color="green" className="w-full">
      <View className="w-full gap-5">
        <View className="gap-1 px-1">
          <Text variant="muted">Tuesday, October 7</Text>
          <Text className="text-3xl font-bold tracking-tight">How was today?</Text>
        </View>
        <Animated.View className="overflow-hidden rounded-3xl bg-card" style={cardStyle}>
          <Animated.View
            className="gap-4 p-5"
            style={bodyStyle}
            pointerEvents={saved ? "none" : "auto"}
            accessibilityElementsHidden={saved}
            importantForAccessibility={saved ? "no-hide-descendants" : "auto"}
            onLayout={(e: LayoutChangeEvent) => {
              if (phase === "writing") full.current = e.nativeEvent.layout.height;
            }}
          >
            <Textarea
              placeholder="Write freely, only you can see this."
              value={entry}
              onChangeText={setEntry}
              editable={phase === "writing"}
              autoGrow
              minHeight={140}
              className="text-[17px] leading-6"
              accessibilityLabel="Journal entry"
            />
            <View className="flex-row flex-wrap gap-2">
              {PROMPTS.map((p) => (
                <Chip
                  key={p}
                  variant="suggestion"
                  size="sm"
                  onPress={() => setEntry((e) => (e.trim() ? `${e.trim()}\n\n${p} ` : `${p} `))}
                >
                  {p}
                </Chip>
              ))}
            </View>
          </Animated.View>
          {saved ? (
            <Animated.View className="absolute left-0 right-0 top-0" style={rowStyle}>
              <Pressable
                onPress={reopen}
                accessibilityRole="button"
                accessibilityLabel={`Entry saved at ${savedAt}. Tap to keep writing.`}
                className="h-16 flex-row items-center gap-3 px-5"
              >
                <View className="h-8 w-8 items-center justify-center rounded-full bg-primary">
                  <Icon name="check" size="sm" color="primaryForeground" strokeWidth={3} />
                </View>
                <View className="flex-1">
                  <Text className="text-[15px] font-semibold text-foreground">Saved · {savedAt}</Text>
                  <Text className="text-sm text-muted-foreground" numberOfLines={1}>
                    {entry.trim()}
                  </Text>
                </View>
                <Icon name="chevron-right" size="sm" color="mutedForeground" />
              </Pressable>
            </Animated.View>
          ) : null}
          <Sheen run={sheen} color={colors.primary} strength={0.22} />
        </Animated.View>
        <Button size="lg" className="w-full" disabled={phase !== "writing" || entry.trim().length === 0} onPress={save}>
          {saved ? "Saved" : "Save entry"}
        </Button>
      </View>
    </Accent>
  );
}
