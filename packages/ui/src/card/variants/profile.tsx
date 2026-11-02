import * as React from "react";
import { View } from "react-native";
import { Easing, useAnimatedProps, useSharedValue, withDelay, withTiming } from "react-native-reanimated";
import Svg from "react-native-svg";
import { Accent, AnimatedPath, ease, timing, useHaptic, useReducedMotion, useTheme } from "@lumioui/core";
import { Card } from "../card";
import { Avatar } from "../../avatar/avatar";
import { Button } from "../../button/button";
import { Icon } from "../../icon/icon";
import { ActionSwapText } from "../../action-swap/action-swap";
import { Text } from "../../text/text";

const CHECK_PATH = "M6 12.5l4 4 8-9";
const CHECK_LEN = 18;
/** The check draws once the button's label has swapped in (dim, then ignite). */
const CHECK_AFTER_SWAP = timing.recede.duration + timing.fast.duration;

function DrawnCheck() {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const draw = useSharedValue(reduced ? 1 : 0);
  React.useEffect(() => {
    if (!reduced) draw.value = withDelay(CHECK_AFTER_SWAP, withTiming(1, { duration: timing.normal.duration, easing: Easing.bezier(...ease.out) }));
  }, [reduced, draw]);
  const props = useAnimatedProps(() => ({ strokeDashoffset: (1 - draw.value) * CHECK_LEN }));
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <AnimatedPath d={CHECK_PATH} stroke={colors.primaryForeground} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" fill="none" strokeDasharray={CHECK_LEN} animatedProps={props} />
    </Svg>
  );
}

/** CardProfile — a tutor's card in a language-lessons app. Book trial does
 *  its own work: three dots while it books, then it swaps in place to
 *  "Booked" with a check that draws in, while the caption under the price
 *  swaps from the lesson length to the booked slot. Nothing leaves or
 *  reflows: Message stays, because right after booking is when you'd use
 *  it. Coral is the product. */
export function CardProfile() {
  const haptic = useHaptic();
  const [booked, setBooked] = React.useState(false);
  const book = async () => {
    if (booked) return;
    await new Promise((r) => setTimeout(r, 1200));
    haptic.success();
    setBooked(true);
  };
  return (
    <Accent color="coral" className="w-full">
      <Card variant="elevated" className="w-full">
        <Card.Header className="gap-4">
          <View className="flex-row items-center gap-4">
            <Avatar size="lg" source={{ uri: "https://i.pravatar.cc/150?img=68" }} fallback="TH" alt="Tomás Herrera" />
            <View className="flex-1 gap-1">
              <View className="flex-row items-center justify-between gap-2">
                <Card.Title>Tomás Herrera</Card.Title>
                <View className="flex-row items-center gap-1" accessibilityLabel="Rated 4.9 from 1,240 lessons">
                  <Icon name="star" size="sm" color="foreground" filled />
                  <Text className="text-[15px] font-semibold tabular-nums">4.9</Text>
                </View>
              </View>
              <Card.Description numberOfLines={1}>Spanish, Northern accent</Card.Description>
            </View>
          </View>
          <Text className="text-[15px] leading-[22px]">
            Conversation-first lessons for travellers and heritage speakers. Lots of slang, very little grammar homework.
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {["Beginner friendly", "Evenings", "Business"].map((t) => (
              <View key={t} className="h-8 justify-center rounded-full bg-secondary px-3">
                <Text className="text-[13px] text-secondary-foreground">{t}</Text>
              </View>
            ))}
          </View>
        </Card.Header>
        <Card.Footer className="items-center gap-3 border-t border-border pt-4">
          <View className="flex-1">
            <Text className="text-2xl font-semibold tracking-tight tabular-nums">$28</Text>
            <ActionSwapText value={booked ? "slot" : "length"}>
              <Text className="text-[13px] text-muted-foreground">{booked ? "Thu 7 PM" : "50 min"}</Text>
            </ActionSwapText>
          </View>
          <Button variant="secondary" accessibilityLabel="Message Tomás">
            Message
          </Button>
          <Button
            onPress={book}
            icon={booked ? <DrawnCheck /> : undefined}
            accessibilityLabel={booked ? "Trial booked for Thursday at 7 PM" : "Book a trial lesson"}
          >
            {booked ? "Booked" : "Book trial"}
          </Button>
        </Card.Footer>
      </Card>
    </Accent>
  );
}
