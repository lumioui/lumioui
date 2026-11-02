import * as React from "react";
import { Pressable, ScrollView, View } from "react-native";
import Animated, {
  Easing,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Accent, AnimatedTextInput, ease, spring, timing, useHaptic, useReducedMotion, useTheme } from "@lumioui/core";
import { KeyboardAvoiding } from "./keyboard-avoiding";
import { Avatar } from "../avatar/avatar";
import { Icon } from "../icon/icon";
import { Text } from "../text/text";

interface Message {
  id: number;
  from: "me" | "them";
  body: string;
  /** Sent in this session — ignites at the composer instead of sitting there. */
  fresh?: boolean;
}

const THREAD: Message[] = [
  { id: 1, from: "them", body: "Hi Noor, this is Tomás from Greenline Plants. Your fiddle-leaf fig is packed and ready." },
  { id: 2, from: "them", body: "Want us to leave it with the concierge, or hold it for Saturday morning?" },
  { id: 3, from: "me", body: "Concierge is perfect. It's the glass door on Fenwick St." },
];

/** A fresh bubble rises this far from the composer's edge as it ignites. */
const BUBBLE_RISE = 8;
/** Swap scale — the draft dims to it, the bubble ignites from it. */
const SWAP_SCALE = 0.96;
/** Brightness of the send disc while there is nothing to send. */
const SEND_IDLE = 0.4;
/** Refused send — the disc kicks this far before the flicker spring takes it home. */
const FLICKER_KICK = 4;
const IGNITE = { ...timing.fast, easing: Easing.bezier(...ease.out) };
const DIM = { ...timing.recede, easing: Easing.bezier(...ease.in) };
const SHIFT = { ...timing.normal, easing: Easing.bezier(...ease.inOut) };
/** The thread makes room for the new bubble on the layout spring. */
const ROOM = LinearTransition.springify()
  .stiffness(spring.layout.stiffness)
  .damping(spring.layout.damping)
  .mass(spring.layout.mass);

/** One bubble. Sent ones ignite at the composer's right edge: a short rise,
 *  opacity on ignite, 0.96 → 1 on the swap spring. */
function Bubble({ m }: { m: Message }) {
  const reduce = useReducedMotion();
  const o = useSharedValue(m.fresh ? 0 : 1);
  const lift = useSharedValue(m.fresh && !reduce ? 1 : 0);
  React.useEffect(() => {
    if (!m.fresh) return;
    o.value = withTiming(1, IGNITE);
    lift.value = reduce ? 0 : withSpring(0, spring.swap);
  }, [m.fresh, reduce, o, lift]);
  const style = useAnimatedStyle(() => ({
    opacity: o.value,
    transform: [
      { translateY: lift.value * BUBBLE_RISE },
      { scale: 1 - lift.value * (1 - SWAP_SCALE) },
    ],
  }));
  const mine = m.from === "me";
  return (
    <Animated.View
      layout={reduce ? undefined : ROOM}
      style={[style, { transformOrigin: mine ? "right bottom" : "left bottom" }]}
      className={
        mine
          ? "max-w-[80%] self-end rounded-2xl rounded-br-md bg-primary px-4 py-2.5"
          : "max-w-[80%] self-start rounded-2xl rounded-bl-md bg-card px-4 py-2.5"
      }
    >
      <Text className={mine ? "text-base text-primary-foreground" : "text-base"}>{m.body}</Text>
    </Animated.View>
  );
}

/** KeyboardAvoidingDemo — a support thread where the composer lives at the
 *  bottom edge. KeyboardAvoiding wraps the whole screen so the composer rides
 *  above the keyboard on device. Sending is the draft becoming the bubble:
 *  the field text dims out as the bubble ignites at the composer's edge and
 *  the thread makes room. The send disc brightens as the draft fills; an
 *  empty send flickers once. */
export function KeyboardAvoidingDemo() {
  const { colors } = useTheme();
  const haptics = useHaptic();
  const reduce = useReducedMotion();
  const [messages, setMessages] = React.useState<Message[]>(THREAD);
  const [draft, setDraft] = React.useState("");
  const scrollRef = React.useRef<React.ComponentRef<typeof ScrollView>>(null);
  const clearTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const canSend = draft.trim().length > 0;

  React.useEffect(() => () => {
    if (clearTimer.current) clearTimeout(clearTimer.current);
  }, []);

  // Draft text — dims while its bubble ignites, then the field clears.
  const ink = useSharedValue(1);
  const inkStyle = useAnimatedStyle(() => ({ opacity: ink.value }));

  // Send disc — its fill crossfades with the draft, never pops.
  const lit = useSharedValue(SEND_IDLE);
  const kick = useSharedValue(0);
  React.useEffect(() => {
    lit.value = withTiming(canSend ? 1 : SEND_IDLE, SHIFT);
  }, [canSend, lit]);
  const discStyle = useAnimatedStyle(() => ({
    opacity: lit.value,
    transform: [{ translateX: kick.value }],
  }));

  const refuse = () => {
    haptics.warning();
    if (reduce) {
      lit.value = withSequence(withTiming(SEND_IDLE * 0.6, timing.instant), withTiming(SEND_IDLE, SHIFT));
      return;
    }
    kick.value = FLICKER_KICK;
    kick.value = withSpring(0, spring.shake);
  };

  const send = () => {
    if (!canSend) {
      refuse();
      return;
    }
    haptics.light();
    const body = draft.trim();
    setMessages((m) => [...m, { id: Date.now(), from: "me", body, fresh: true }]);
    ink.value = withTiming(0, DIM);
    if (clearTimer.current) clearTimeout(clearTimer.current);
    clearTimer.current = setTimeout(() => {
      setDraft("");
      ink.value = 1;
    }, timing.recede.duration);
  };

  return (
    <Accent color="green" className="w-full">
      <View className="h-[560px] w-full overflow-hidden rounded-3xl border border-border bg-background">
        <KeyboardAvoiding offset={0}>
          <View className="flex-row items-center gap-3 border-b border-border bg-card px-4 py-3">
            <Avatar size="md" source={{ uri: "https://i.pravatar.cc/150?img=12" }} fallback="TM" alt="Tomás Meyer" />
            <View className="flex-1">
              <Text className="text-[17px] font-semibold">Greenline Plants</Text>
              <Text variant="muted">Tomás · usually replies in 5 min</Text>
            </View>
            <Icon name="phone" size="md" color="foreground" />
          </View>

          <ScrollView
            ref={scrollRef}
            className="flex-1"
            contentContainerClassName="gap-2 px-4 py-4"
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          >
            <Text className="mb-2 self-center text-xs text-muted-foreground">Today 9:41</Text>
            {messages.map((m) => (
              <Bubble key={m.id} m={m} />
            ))}
          </ScrollView>

          <View className="flex-row items-end gap-2 border-t border-border bg-card px-3 py-2">
            <View className="min-h-11 flex-1 justify-center rounded-3xl border border-border bg-background">
              <AnimatedTextInput
                value={draft}
                onChangeText={setDraft}
                placeholder="Message"
                placeholderTextColor={colors.mutedForeground}
                multiline
                onSubmitEditing={send}
                style={inkStyle}
                className="px-4 py-2.5 text-base text-foreground"
                accessibilityLabel="Message Greenline Plants"
              />
            </View>
            <Pressable
              onPress={send}
              hitSlop={4}
              className="h-11 w-11"
              accessibilityRole="button"
              accessibilityLabel="Send message"
              accessibilityState={{ disabled: !canSend }}
            >
              <Animated.View style={discStyle} className="h-11 w-11 items-center justify-center rounded-full bg-primary">
                <Icon name="arrow-up" size="md" color="primaryForeground" />
              </Animated.View>
            </Pressable>
          </View>
        </KeyboardAvoiding>
      </View>
    </Accent>
  );
}
