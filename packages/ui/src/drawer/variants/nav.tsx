import * as React from "react";
import { Pressable, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { ease, spring, timing, useReducedMotion } from "@lumioui/core";
import { Drawer } from "../drawer";
import { Avatar } from "../../avatar/avatar";
import { Icon, type IconName } from "../../icon/icon";
import { Text } from "../../text/text";

type Box = { id: string; label: string; icon: IconName; count?: number };

const BOXES: Box[] = [
  { id: "inbox", label: "Inbox", icon: "mail", count: 24 },
  { id: "starred", label: "Starred", icon: "star" },
  { id: "snoozed", label: "Snoozed", icon: "clock", count: 3 },
  { id: "sent", label: "Sent", icon: "send" },
  { id: "drafts", label: "Drafts", icon: "file-text", count: 2 },
];

const LABELS = [
  { id: "receipts", label: "Receipts", dot: "bg-tint-green" },
  { id: "travel", label: "Trips", dot: "bg-tint-teal" },
  { id: "family", label: "Family", dot: "bg-tint-red" },
];

const THREADS: Record<string, { from: string; subject: string; when: string }[]> = {
  inbox: [
    { from: "Wren Bakery", subject: "Your Saturday pickup is ready", when: "9:12" },
    { from: "Theo Lindgren", subject: "Re: cabin weekend, final headcount", when: "8:40" },
    { from: "Fernhill Labs", subject: "October payslip is available", when: "Tue" },
  ],
};

/** A message that lands while the drawer is open the first time. */
const ARRIVAL = { from: "Mira Castell", subject: "Photos from the cabin", when: "now" };
/** It lands after the counts have switched on, so the roll is seen. */
const ARRIVAL_AFTER = 1200;

/** The screen title swaps in place: the new mailbox name ignites (opacity
 *  over timing.fast, 0.96 → 1 on spring.swap) — no travel. */
function SwapTitle({ children }: { children: string }) {
  const reduce = useReducedMotion();
  const on = useSharedValue(1);
  const bloom = useSharedValue(1);
  const prev = React.useRef(children);
  React.useEffect(() => {
    if (prev.current === children) return;
    prev.current = children;
    on.value = 0;
    on.value = withTiming(1, { ...timing.fast, easing: Easing.bezier(...ease.out) });
    if (reduce) return;
    bloom.value = 0.96;
    bloom.value = withSpring(1, spring.swap);
  }, [children, reduce, on, bloom]);
  const style = useAnimatedStyle(() => ({ opacity: on.value, transform: [{ scale: bloom.value }] }));
  return (
    <Animated.View style={[{ transformOrigin: "left center" }, style]} className="flex-1">
      <Text className="text-[22px] font-semibold" accessibilityRole="header">
        {children}
      </Text>
    </Animated.View>
  );
}

/** DrawerNav — a mail app's navigation drawer. The scrim dims first, the
 *  panel glides in and its mailboxes switch on 40ms apart, counts last. Pick
 *  one: its pill lights and holds, the drawer dims out and the screen behind
 *  swaps its title in place as the scrim clears. A message landing while the
 *  drawer is open rolls the Inbox count digit by digit. */
export function DrawerNav() {
  const [open, setOpen] = React.useState(false);
  const [box, setBox] = React.useState("inbox");
  const [arrived, setArrived] = React.useState(false);
  React.useEffect(() => {
    if (!open || arrived) return;
    const t = setTimeout(() => setArrived(true), ARRIVAL_AFTER);
    return () => clearTimeout(t);
  }, [open, arrived]);
  const current = [...BOXES, ...LABELS].find((b) => b.id === box)!;
  const threads = box === "inbox" && arrived ? [ARRIVAL, ...(THREADS.inbox ?? [])] : (THREADS[box] ?? []);
  const countOf = (b: Box) => (b.id === "inbox" && b.count != null && arrived ? b.count + 1 : b.count);
  return (
    <View className="w-full">
      <View className="w-full overflow-hidden rounded-3xl bg-background pb-4">
        <View className="flex-row items-center gap-1 px-2 pt-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open navigation"
            onPress={() => setOpen(true)}
            className="h-12 w-12 items-center justify-center rounded-full active:bg-muted"
          >
            <Icon name="menu" size="md" color="foreground" />
          </Pressable>
          <SwapTitle>{current.label}</SwapTitle>
          <View className="pr-3">
            <Avatar size="sm" source={{ uri: "https://i.pravatar.cc/150?img=26" }} fallback="JM" alt="Jules Moreau" />
          </View>
        </View>
        <View className="px-2 pt-2">
          {threads.length === 0 ? (
            <Text className="px-4 py-10 text-center text-[15px] text-muted-foreground">
              Nothing in {current.label}
            </Text>
          ) : (
            threads.map((t) => (
              <View key={t.subject} className="flex-row items-start gap-3 rounded-2xl px-3 py-3">
                <View className="h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <Text className="text-[15px] font-semibold">{t.from[0]}</Text>
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-[15px] font-semibold" numberOfLines={1}>{t.from}</Text>
                    <Text className="text-xs text-muted-foreground">{t.when}</Text>
                  </View>
                  <Text className="text-sm text-muted-foreground" numberOfLines={1}>{t.subject}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        <Drawer open={open} onOpenChange={setOpen}>
          <View className="flex-1">
          <Drawer.Header>
            <View className="flex-row items-center gap-3">
              <Avatar source={{ uri: "https://i.pravatar.cc/150?img=26" }} fallback="JM" alt="Jules Moreau" />
              <View className="flex-1">
                <Drawer.Title>Jules Moreau</Drawer.Title>
                <Text className="text-sm text-muted-foreground">jules@moreau.studio</Text>
              </View>
            </View>
          </Drawer.Header>
          {BOXES.map((b, i) => (
            <Drawer.Item
              key={b.id}
              index={i}
              label={b.label}
              active={box === b.id}
              trailing={countOf(b)}
              icon={<Icon name={b.icon} size="md" color={box === b.id ? "primaryText" : "mutedForeground"} />}
              onPress={() => setBox(b.id)}
            />
          ))}
          <View className="mx-7 my-2 h-px bg-border" />
          <Text className="px-7 pb-1 pt-2 text-[13px] font-medium text-muted-foreground">Labels</Text>
          {LABELS.map((l, i) => (
            <Drawer.Item
              key={l.id}
              index={BOXES.length + i}
              label={l.label}
              active={box === l.id}
              icon={
                <View className="h-6 w-6 items-center justify-center">
                  <View className={`h-3 w-3 rounded-full ${l.dot}`} />
                </View>
              }
              onPress={() => setBox(l.id)}
            />
          ))}
          </View>
        </Drawer>
      </View>
    </View>
  );
}
