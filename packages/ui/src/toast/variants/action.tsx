import * as React from "react";
import { Pressable, View, type LayoutChangeEvent } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { ease, spring, timing, useReducedMotion } from "@lumioui/core";
import { ToastProvider, useToast } from "../toast";
import { Icon } from "../../icon/icon";
import { Text } from "../../text/text";

interface Mail {
  id: string;
  from: string;
  subject: string;
  preview: string;
  time: string;
}

const INBOX: Mail[] = [
  { id: "1", from: "Harrow Rail", subject: "Your seat for the 07:52 to Lindqvist", preview: "Coach C, seat 41, platform 6", time: "8:02" },
  { id: "2", from: "Elena Vasquez", subject: "Re: Lease renewal", preview: "Signed and sent back, thanks for chasing", time: "7:15" },
  { id: "3", from: "Fieldnotes Weekly", subject: "The case for slower software", preview: "This week: why the best tools feel calm", time: "Tue" },
  { id: "4", from: "Bramble Dental", subject: "Reminder: cleaning on Friday", preview: "10:30 AM with Dr. Osei", time: "Mon" },
];

const DIM = { duration: timing.recede.duration, easing: Easing.bezier(...ease.in) };
const IGNITE = { duration: timing.fast.duration, easing: Easing.bezier(...ease.out) };

/** Space under the list for the toast (pb-11): it covers the last line. */
const RESERVE = 44;
/** The mount archive fires at 500ms and folds on spring.surface; the stage
 *  starts measuring once it has settled. */
const MOUNT_ARCHIVE_SETTLED = 1300;

/** The restored row's surface switches on and settles back over this long. */
const RESTORED_SETTLE = { duration: 900, easing: Easing.bezier(...ease.out) };

/** An archived row dims, then folds its height away on spring.surface; Undo
 *  unfolds the slot and the row comes back by light: its surface switches on
 *  (a flat lit fill, same in both schemes) and settles back to the list over
 *  900ms, so the eye finds where it landed. */
function FoldRow({ archived, children }: { archived: boolean; children: React.ReactNode }) {
  const reduce = useReducedMotion();
  const lit = useSharedValue(0);
  const was = React.useRef(archived);
  React.useEffect(() => {
    if (was.current && !archived) {
      lit.value = 1;
      lit.value = withTiming(0, RESTORED_SETTLE);
    }
    was.current = archived;
  }, [archived, lit]);
  const litStyle = useAnimatedStyle(() => ({ opacity: lit.value }));
  const [h, setH] = React.useState(0);
  const open = useSharedValue(archived ? 0 : 1);
  const light = useSharedValue(archived ? 0 : 1);
  React.useEffect(() => {
    light.value = withTiming(archived ? 0 : 1, archived ? DIM : IGNITE);
    open.value = reduce ? (archived ? 0 : 1) : withSpring(archived ? 0 : 1, spring.surface);
  }, [archived, reduce, open, light]);
  const style = useAnimatedStyle(() => ({
    height: h ? h * open.value : undefined,
    opacity: light.value,
  }));
  return (
    <Animated.View style={style} className="overflow-hidden" pointerEvents={archived ? "none" : "auto"}>
      <Animated.View pointerEvents="none" style={litStyle} className="absolute inset-0 bg-secondary" />
      <View onLayout={(e: LayoutChangeEvent) => setH(e.nativeEvent.layout.height)}>{children}</View>
    </Animated.View>
  );
}

/** ToastAction — archiving mail. Tap a row's archive button: the row dims
 *  and folds out of the list as the toast rises at the bottom; Undo unfolds
 *  its slot and the row switches back on where it was. The demo owns its
 *  toast stack, so the toast lands inside the demo, under the list. */
export function ToastAction() {
  // The stage only grows, never shrinks: archiving a row leaves space at the
  // bottom of the list instead of shrinking the demo, so the toast's edge
  // never moves while it arrives (and the docs frame never resizes). It
  // starts measuring once the mount archive has folded, so the opening still
  // has the toast over the last line with no gap.
  const [stageH, setStageH] = React.useState(0);
  const latest = React.useRef(0);
  const ready = React.useRef(false);
  React.useEffect(() => {
    const t = setTimeout(() => {
      ready.current = true;
      setStageH((cur) => Math.max(cur, latest.current + RESERVE));
    }, MOUNT_ARCHIVE_SETTLED);
    return () => clearTimeout(t);
  }, []);
  const onMeasured = (h: number) => {
    latest.current = h;
    if (ready.current) setStageH((cur) => Math.max(cur, h + RESERVE));
  };
  return (
    <View className="relative w-full pb-11" style={stageH ? { minHeight: stageH } : undefined}>
      <ToastProvider position="bottom">
        <Inbox onMeasured={onMeasured} />
      </ToastProvider>
    </View>
  );
}

function Inbox({ onMeasured }: { onMeasured: (height: number) => void }) {
  const { show } = useToast();
  const [archived, setArchived] = React.useState<Set<string>>(new Set());
  const setOne = (id: string, on: boolean) =>
    setArchived((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  const archive = (m: Mail, duration = 5000) => {
    setOne(m.id, true);
    show("Conversation archived", {
      description: m.from,
      duration,
      icon: "archive",
      action: { label: "Undo", onPress: () => setOne(m.id, false) },
    });
  };

  // Archive the newsletter once on mount so the preview opens on the toast
  // (it dims in place after 8s); every later archive auto-hides after 5s.
  React.useEffect(() => {
    const t = setTimeout(() => archive(INBOX[2]!, 8000), 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const firstVisible = INBOX.find((m) => !archived.has(m.id))?.id;

  return (
    <View className="w-full gap-3" onLayout={(e) => onMeasured(e.nativeEvent.layout.height)}>
      <View className="px-1">
        <Text className="text-3xl font-bold tracking-tight">Inbox</Text>
      </View>
      <View className="overflow-hidden rounded-2xl bg-card">
        {INBOX.map((m) => (
          <FoldRow key={m.id} archived={archived.has(m.id)}>
            <View className={`flex-row items-center gap-2 py-3 pl-4 pr-2 ${m.id !== firstVisible ? "border-t border-border" : ""}`}>
              <View className="flex-1 gap-1">
                <View className="flex-row items-center justify-between gap-2">
                  <Text className="flex-1 text-base font-semibold" numberOfLines={1}>{m.from}</Text>
                  <Text className="text-[13px] text-muted-foreground tabular-nums">{m.time}</Text>
                </View>
                <Text className="text-[15px]" numberOfLines={1}>{m.subject}</Text>
                <Text variant="muted" className="text-[15px]" numberOfLines={1}>{m.preview}</Text>
              </View>
              <Pressable
                onPress={() => archive(m)}
                accessibilityRole="button"
                accessibilityLabel={`Archive ${m.subject}`}
                className="h-11 w-11 items-center justify-center rounded-full"
              >
                <Icon name="archive" size="md" color="mutedForeground" />
              </Pressable>
            </View>
          </FoldRow>
        ))}
        {archived.size === INBOX.length ? (
          <View className="items-center py-10">
            <Text variant="muted">Inbox zero</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}
