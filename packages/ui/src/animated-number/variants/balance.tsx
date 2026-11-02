import * as React from "react";
import { View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { Accent, Sheen, spring, useReducedMotion, useTheme } from "@lumioui/core";
import { AnimatedNumber } from "../animated-number";
import { Button } from "../../button/button";
import { Icon } from "../../icon/icon";
import { Text } from "../../text/text";

const GOAL = 10000;
const usd = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** AnimatedBalance — a savings goal in a banking app. A deposit rolls only
 *  the digits that change, 30ms apart from the right; as the last column
 *  lands one sheen crosses the figure. A withdrawal rolls down with no
 *  light. The goal bar follows on a spring. */
export function AnimatedBalance() {
  const reduce = useReducedMotion();
  const [balance, setBalance] = React.useState(6482.17);
  const [last, setLast] = React.useState<string>("Round-ups · $3.60 yesterday");
  const [sheen, setSheen] = React.useState(0);
  const deposit = React.useRef(false);
  const fill = useSharedValue(balance / GOAL);

  const move = (delta: number, note: string) => {
    const next = Math.min(GOAL, Math.max(0, Math.round((balance + delta) * 100) / 100));
    const t = next / GOAL;
    fill.value = reduce ? t : withSpring(t, spring.layout);
    deposit.current = delta > 0;
    setBalance(next);
    setLast(note);
  };

  // Money in is the moment: light crosses the figure as it lands.
  const landed = () => {
    if (deposit.current) setSheen((n) => n + 1);
    deposit.current = false;
  };

  const fillStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: fill.value }],
  }));

  return (
    <Accent color="green" className="w-full">
      <View className="w-full gap-5 rounded-3xl bg-card p-5">
        <View className="flex-row items-center gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-primary">
            <Icon name="shield" size="sm" color="primaryForeground" />
          </View>
          <View className="flex-1">
            <Text className="text-[17px] font-semibold">Emergency fund</Text>
            <Text variant="muted">4.30% APY · Goal $10,000</Text>
          </View>
        </View>

        <View className="gap-1">
          <View className="self-start overflow-hidden">
            <AnimatedNumber
              value={balance}
              format={usd}
              animation="roll"
              onSettle={landed}
              className="text-5xl font-semibold tracking-tight"
            />
            <FigureSheen run={sheen} />
          </View>
          <Text variant="muted">{last}</Text>
        </View>

        <View className="gap-2">
          <View className="h-2 w-full overflow-hidden rounded-full bg-secondary">
            <Animated.View
              className="h-full w-full rounded-full bg-primary"
              style={[{ transformOrigin: "left" }, fillStyle]}
            />
          </View>
          <View className="flex-row justify-between">
            <Text className="text-xs text-muted-foreground tabular-nums">
              {Math.round((balance / GOAL) * 100)}% saved
            </Text>
            <Text className="text-xs text-muted-foreground tabular-nums">
              {usd(GOAL - balance)} to go
            </Text>
          </View>
        </View>

        <View className="flex-row gap-2">
          <Button
            size="lg"
            className="flex-1"
            onPress={() => move(250, "Deposit · $250.00 just now")}
            disabled={balance >= GOAL}
          >
            Add $250
          </Button>
          <Button
            size="lg"
            variant="secondary"
            className="flex-1"
            onPress={() => move(-120, "Moved $120.00 to Checking")}
            disabled={balance <= 0}
          >
            Withdraw
          </Button>
        </View>
      </View>
    </Accent>
  );
}

/** Sheen in the surrounding accent on paper, white light on a dark stage —
 *  rendered inside the Accent so it picks up the demo's hue. */
function FigureSheen({ run }: { run: number }) {
  const { colors, scheme } = useTheme();
  return <Sheen run={run} color={scheme === "dark" ? "#FFFFFF" : colors.primary} strength={0.24} />;
}
