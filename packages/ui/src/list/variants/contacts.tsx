import * as React from "react";
import { Pressable, View } from "react-native";
import Animated, { Easing, useAnimatedProps, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from "react-native-reanimated";
import Svg from "react-native-svg";
import { Accent, AnimatedPath, ease, spring, timing, useHaptic, useReducedMotion, useTheme } from "@lumioui/core";
import { List } from "../list";
import { Avatar } from "../../avatar/avatar";
import { Button } from "../../button/button";
import { ActionSwapText } from "../../action-swap/action-swap";
import { Text } from "../../text/text";

const PEOPLE = [
  { id: "noor", name: "Noor Haddad", sub: "+1 415 555 0182", img: 5, initials: "NH" },
  { id: "kenji", name: "Kenji Watanabe", sub: "kenji@fieldnotes.studio", img: 13, initials: "KW" },
  { id: "sofia", name: "Sofia Marchetti", sub: "+39 347 210 4410", img: 44, initials: "SM" },
  { id: "mateo", name: "Mateo Alvarez", sub: "Last shared Sunday", img: 59, initials: "MA" },
];

/** Check path in a 24 box and its length — the stroke draws along it. */
const CHECK = "M7 12.5 L10.5 16 L17 9";
const CHECK_LEN = 14;
/** The fill ignites over 120ms while the check draws over 240ms (fast + instant). */
const FILL_ON = { duration: timing.recede.duration, easing: Easing.bezier(...ease.out) };
const DRAW = { duration: timing.fast.duration + timing.instant.duration, easing: Easing.bezier(...ease.out) };
const DIM = { ...timing.recede, easing: Easing.bezier(...ease.in) };
/** After sending, the result holds this long, then the picks clear (act,
 *  hold, resolve). */
const SENT_HOLD = 1800;
/** The pill's check draws once its label has swapped in. */
const CHECK_AFTER_SWAP = timing.recede.duration + timing.fast.duration;
/** The check's slot in the pill opens to this width as the result lands, so
 *  the label slides over on the same curve instead of jumping. */
const CHECK_SLOT = 28;
const SLOT_OPEN = { duration: timing.fast.duration, easing: Easing.bezier(...ease.out) };
/** A refused Send kicks this far, then flickers home. */
const FLICKER_KICK = 4;

/** Pick circle: picking ignites the fill while the check draws on; clearing
 *  dims it — the check is never un-drawn. */
function PickCircle({ on }: { on: boolean }) {
  const { colors } = useTheme();
  const fill = useSharedValue(on ? 1 : 0);
  const draw = useSharedValue(on ? 1 : 0);
  const first = React.useRef(true);
  React.useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (on) {
      draw.value = 0;
      fill.value = withTiming(1, FILL_ON);
      draw.value = withTiming(1, DRAW);
    } else {
      fill.value = withTiming(0, DIM);
    }
  }, [on, fill, draw]);
  const fillStyle = useAnimatedStyle(() => ({ opacity: fill.value }));
  const checkProps = useAnimatedProps(() => ({ strokeDashoffset: CHECK_LEN * (1 - draw.value) }));
  return (
    <View className="h-6 w-6">
      {/* Unpicked ring in muted ink at full strength: it has to read (≥3:1). */}
      <View className="absolute inset-0 rounded-full" style={{ borderWidth: 1.5, borderColor: colors.mutedForeground }} />
      <Animated.View style={fillStyle} className="absolute inset-0 items-center justify-center rounded-full bg-primary">
        <Svg width={24} height={24} viewBox="0 0 24 24">
          <AnimatedPath
            d={CHECK}
            stroke={colors.primaryForeground}
            strokeWidth={2.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            strokeDasharray={CHECK_LEN}
            animatedProps={checkProps}
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

/** The check the Send pill lands with. Its slot opens as the result lands
 *  and the stroke draws once the label has swapped in; on the way out it
 *  dims, then the slot closes. Nothing shows until the stroke moves. */
function SentCheck({ on }: { on: boolean }) {
  const { colors } = useTheme();
  const reduce = useReducedMotion();
  const draw = useSharedValue(0);
  const slot = useSharedValue(0);
  const glow = useSharedValue(0);
  React.useEffect(() => {
    if (on) {
      glow.value = 1;
      if (reduce) {
        slot.value = CHECK_SLOT;
        draw.value = 1;
        return;
      }
      draw.value = 0;
      slot.value = withTiming(CHECK_SLOT, SLOT_OPEN);
      draw.value = withDelay(CHECK_AFTER_SWAP, withTiming(1, DRAW));
    } else if (reduce) {
      glow.value = 0;
      slot.value = 0;
    } else {
      glow.value = withTiming(0, DIM, (done) => {
        if (done) slot.value = withTiming(0, SLOT_OPEN);
      });
    }
  }, [on, reduce, draw, slot, glow]);
  const slotStyle = useAnimatedStyle(() => ({ width: slot.value, opacity: glow.value }));
  const props = useAnimatedProps(() => ({
    strokeDashoffset: CHECK_LEN * (1 - draw.value),
    strokeOpacity: draw.value > 0 ? 1 : 0,
  }));
  return (
    <Animated.View style={slotStyle} className="h-5 overflow-hidden">
      <Svg width={20} height={20} viewBox="0 0 24 24">
        <AnimatedPath d={CHECK} stroke={colors.primaryForeground} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" fill="none" strokeDasharray={[CHECK_LEN, CHECK_LEN]} animatedProps={props} />
      </Svg>
    </Animated.View>
  );
}

/** ListContacts — a share-sheet recipient picker on a lit list: rows switch
 *  on 40ms apart and brighten under the finger. Picking someone ignites
 *  their circle while the check draws on; the Send pill's count swaps in
 *  place. Send does the sending: the pill becomes "Sent to Kenji" with a
 *  check that draws in, the picked rows say "Sent just now", the result
 *  holds, then the picks clear. A send with nobody picked flickers. */
export function ListContacts() {
  const haptics = useHaptic();
  const reduce = useReducedMotion();
  const [picked, setPicked] = React.useState<string[]>(["kenji"]);
  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const [sent, setSent] = React.useState<string[] | null>(null);
  const ready = picked.length > 0;

  const kick = useSharedValue(0);
  const sendStyle = useAnimatedStyle(() => ({ transform: [{ translateX: kick.value }] }));
  const refuse = () => {
    haptics.warning();
    if (reduce) return;
    kick.value = FLICKER_KICK;
    kick.value = withSpring(0, spring.shake);
  };
  // Resolve in one beat: the check dims and its slot closes, the label
  // swaps "Sent to 2 people" to "Choose people", the pill goes unlit and the
  // row fills dim, all on the same frame.
  const timers = React.useRef<ReturnType<typeof setTimeout>[]>([]);
  React.useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const send = () => {
    if (sent) return;
    if (!ready) return refuse();
    haptics.success();
    setSent(picked);
    timers.current.forEach(clearTimeout);
    timers.current = [
      setTimeout(() => {
        setSent(null);
        setPicked([]);
      }, SENT_HOLD),
    ];
  };
  const firstName = (id: string) => PEOPLE.find((p) => p.id === id)?.name.split(" ")[0] ?? "";
  const label = sent
    ? sent.length === 1 ? `Sent to ${firstName(sent[0]!)}` : `Sent to ${sent.length} people`
    : picked.length === 0 ? "Choose people" : `Send to ${picked.length} ${picked.length === 1 ? "person" : "people"}`;

  return (
    <Accent color="coral" className="w-full">
      <View className="w-full overflow-hidden rounded-3xl bg-background pb-4 pt-5">
        <View className="gap-1 px-4 pb-4">
          <Text className="text-2xl font-bold tracking-tight">Share video</Text>
          <Text variant="muted">Spring recital.mov, 2:48</Text>
        </View>
        {/* The list holds still while the result is showing. */}
        <View pointerEvents={sent ? "none" : "auto"}>
        <List inset lit switchOn>
          <List.Section title="Suggested" footer="People you share with most often.">
            {PEOPLE.map((p, i) => {
              const on = picked.includes(p.id);
              return (
                <React.Fragment key={p.id}>
                  {i > 0 ? <List.Separator inset={68} /> : null}
                  <List.Item
                    title={p.name}
                    titleClassName="font-medium"
                    subtitle={sent?.includes(p.id) ? "Sent just now" : p.sub}
                    subtitleNumberOfLines={1}
                    leading={
                      <Avatar
                        size="md"
                        source={{ uri: `https://i.pravatar.cc/150?img=${p.img}` }}
                        fallback={p.initials}
                        alt={p.name}
                      />
                    }
                    trailing={<PickCircle on={on} />}
                    onPress={() => toggle(p.id)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: on }}
                  />
                </React.Fragment>
              );
            })}
          </List.Section>
        </List>
        </View>
        <Animated.View style={sendStyle} className="px-4">
          {/* Idle is the pill unlit, not a faded accent: it lights the moment
              someone is picked and goes unlit again in place, never a
              snapped variant. A tap on the unlit pill is caught here and
              refused with a flicker. */}
          <Pressable onPress={ready ? undefined : refuse} accessible={false}>
            <Button
              size="lg"
              className="w-full"
              haptic={false}
              disabled={!ready && !sent}
              onPress={send}
              accessibilityLabel={label}
            >
              <View className="flex-row items-center">
                <SentCheck on={!!sent} />
                {/* The label swaps in place as the count or the result changes. */}
                <ActionSwapText value={label}>
                  <Text className={`text-[17px] font-semibold ${ready || sent ? "text-primary-foreground" : "text-muted-foreground"}`}>
                    {label}
                  </Text>
                </ActionSwapText>
              </View>
            </Button>
          </Pressable>
        </Animated.View>
      </View>
    </Accent>
  );
}
