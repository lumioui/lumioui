import * as React from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Accent, ease, spring, timing, useReducedMotion } from "@lumioui/core";
import { Checkbox } from "../checkbox";
import { Text } from "../../text/text";

interface Task {
  id: string;
  title: string;
  /** One plain fact: a time, a due date or a cadence. */
  meta: string;
}

const TASKS: Task[] = [
  { id: "a", title: "Send Q3 deck to Henrik", meta: "10:30" },
  { id: "b", title: "Book flights for the offsite", meta: "Due today" },
  { id: "c", title: "Review Ines's pricing change", meta: "Before standup" },
  { id: "d", title: "Renew passport photos", meta: "Friday" },
  { id: "e", title: "Water the fig", meta: "Every Sunday" },
];

/** The act: the check draws (240ms) and the strike follows it
 *  (timing.recede later, 240ms). The done row then holds 700ms before it
 *  folds down into Done (act, hold, resolve). */
const ACT_MS = timing.recede.duration + 240;
const HOLD_MS = 700;
/** Un-checking is seen before the row moves back up. */
const UNDO_HOLD_MS = 2 * timing.recede.duration;
/** The fold's light: the row dims in place before it moves, and switches on
 *  again while its new slot is still opening (revealed as the slot grows). */
const FOLD_DIM = { duration: timing.recede.duration, easing: Easing.bezier(...ease.in) };
const FOLD_IGNITE = { duration: timing.fast.duration, easing: Easing.bezier(...ease.out) };
/** The row ignites ~40% of the way into its slot opening. */
const IGNITE_INTO_OPEN = timing.recede.duration;

/** Today's progress, as one slim line that fills in the accent. */
function ProgressLine({ value }: { value: number }) {
  const reduced = useReducedMotion();
  const p = useSharedValue(value);
  React.useEffect(() => {
    p.value = reduced ? value : withSpring(value, spring.indicator);
  }, [value, reduced, p]);
  // Transform, not width: the fill scales from its left edge.
  const fill = useAnimatedStyle(() => ({ transform: [{ scaleX: p.value }] }));
  return (
    <View className="h-[6px] w-full overflow-hidden rounded-full bg-secondary">
      <Animated.View style={[fill, { transformOrigin: "left" }]} className="h-full w-full rounded-full bg-primary" />
    </View>
  );
}

/** The empty slot a row leaves behind: it closes from the row's height to 0
 *  on spring.layout (a measured collapse), so the rows below rise into it by
 *  normal flow and the card's top edge never moves. */
function ClosingSlot({ height, onClosed }: { height: number; onClosed: () => void }) {
  const h = useSharedValue(height);
  React.useEffect(() => {
    h.value = withSpring(0, spring.layout, (done) => { if (done) runOnJS(onClosed)(); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const style = useAnimatedStyle(() => ({ height: h.value }));
  return <Animated.View style={style} />;
}

/** One task row.
 *  - leaving: it dims in place (timing.recede) and then hands its measured
 *    height to the list, which moves it and leaves a ClosingSlot behind.
 *  - arriving: its slot opens from 0 to its height on spring.layout while the
 *    row ignites into it partway through, so it unfolds rather than waiting
 *    in an empty band.
 *  Reduced motion: no dim and no slot motion; the row simply changes place. */
function TaskRow({
  folding,
  onFolded,
  arriving,
  onArrived,
  children,
}: {
  folding: boolean;
  onFolded: (height: number) => void;
  arriving: boolean;
  onArrived: () => void;
  children: React.ReactNode;
}) {
  const reduced = useReducedMotion();
  const animateIn = arriving && !reduced;
  const o = useSharedValue(animateIn ? 0 : 1);
  /** Slot height while opening; -1 = natural height. */
  const h = useSharedValue(animateIn ? 0 : -1);
  const natural = React.useRef(0);
  const [measured, setMeasured] = React.useState(false);

  React.useEffect(() => {
    if (!folding) return;
    if (reduced) { onFolded(natural.current); return; }
    const hNow = natural.current;
    o.value = withTiming(0, FOLD_DIM, (dimmed) => { if (dimmed) runOnJS(onFolded)(hNow); });
    // onFolded is recreated each render; the fold only reacts to `folding`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folding, reduced]);

  React.useEffect(() => {
    if (!animateIn || !measured) return;
    o.value = withDelay(IGNITE_INTO_OPEN, withTiming(1, FOLD_IGNITE));
    h.value = withSpring(natural.current, spring.layout, (open) => {
      if (!open) return;
      h.value = -1;
      runOnJS(onArrived)();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animateIn, measured]);

  const slot = useAnimatedStyle(() =>
    h.value < 0 ? { opacity: o.value } : { height: h.value, opacity: o.value, overflow: "hidden" },
  );
  return (
    <Animated.View style={slot}>
      {/* Measures the row's natural height; inside a closed slot it still
          lays out at full size and is revealed as the slot grows. */}
      <View
        onLayout={(e) => {
          natural.current = e.nativeEvent.layout.height;
          if (!measured) setMeasured(true);
        }}
      >
        {children}
      </View>
    </Animated.View>
  );
}

type Group = "open" | "done";
interface Ghost { key: string; group: Group; index: number; height: number }

/** CheckboxList — a to-do app's Today list in orange. Checking a task fills
 *  the box while the mark draws on and the title strikes through; the row
 *  holds, then folds: it dims, and in one move its old slot closes while a
 *  slot in Done opens and the row switches on inside it. The progress line
 *  steps with the count. */
export function CheckboxList() {
  const reduced = useReducedMotion();
  const [checked, setChecked] = React.useState<Record<string, boolean>>({ b: true });
  // Where each row sits lags its checkbox, so the act is seen first.
  const [settled, setSettled] = React.useState<Record<string, boolean>>({ b: true });
  const [folding, setFolding] = React.useState<Record<string, boolean>>({});
  const [arriving, setArriving] = React.useState<Record<string, boolean>>({});
  const [ghosts, setGhosts] = React.useState<Ghost[]>([]);
  const timers = React.useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const target = React.useRef<Record<string, boolean>>({});
  React.useEffect(() => () => Object.values(timers.current).forEach(clearTimeout), []);

  const open = TASKS.filter((t) => !settled[t.id]);
  const done = TASKS.filter((t) => settled[t.id]);
  const count = TASKS.filter((t) => checked[t.id]).length;

  const toggle = (id: string, v: boolean) => {
    setChecked((s) => ({ ...s, [id]: v }));
    target.current[id] = v;
    clearTimeout(timers.current[id]);
    timers.current[id] = setTimeout(() => setFolding((s) => ({ ...s, [id]: true })), v ? ACT_MS + HOLD_MS : UNDO_HOLD_MS);
  };

  // The dim has landed: move the row now. Its old slot closes while the new
  // one opens, both at once.
  const commitMove = (id: string, height: number) => {
    const from: Group = settled[id] ? "done" : "open";
    const list = from === "open" ? open : done;
    const index = list.findIndex((t) => t.id === id);
    if (!reduced && index >= 0) setGhosts((g) => [...g, { key: `${id}-${Date.now()}`, group: from, index, height }]);
    setArriving((s) => ({ ...s, [id]: !reduced }));
    setSettled((s) => ({ ...s, [id]: !!target.current[id] }));
    setFolding((s) => ({ ...s, [id]: false }));
  };

  const renderGroup = (group: Group, tasks: Task[]) => {
    const nodes: React.ReactNode[] = tasks.map((task, i) => (
      <TaskRow
        key={task.id}
        folding={!!folding[task.id]}
        onFolded={(height) => commitMove(task.id, height)}
        arriving={!!arriving[task.id]}
        onArrived={() => setArriving((s) => ({ ...s, [task.id]: false }))}
      >
        <Checkbox
          className="px-4 py-2"
          checked={!!checked[task.id]}
          onCheckedChange={(v) => toggle(task.id, v)}
          label={task.title}
          subtitle={task.meta}
          strikeWhenChecked
        />
        {/* The separator is the row's bottom edge, so a closing slot at the
            top of a card never shows a stray hairline under its corner. */}
        {i < tasks.length - 1 ? <View className="ml-[52px] h-px bg-border" /> : null}
      </TaskRow>
    ));
    // Closing slots sit where the leaving row was.
    ghosts
      .filter((g) => g.group === group)
      .sort((a, b) => b.index - a.index)
      .forEach((g) =>
        nodes.splice(
          Math.min(g.index, nodes.length),
          0,
          <ClosingSlot key={g.key} height={g.height} onClosed={() => setGhosts((all) => all.filter((x) => x.key !== g.key))} />,
        ),
      );
    return nodes;
  };

  const doneVisible = done.length > 0 || ghosts.some((g) => g.group === "done");
  const openVisible = open.length > 0 || ghosts.some((g) => g.group === "open");

  return (
    <Accent color="orange" className="w-full">
      <View className="w-full gap-3">
        <View className="gap-3 px-1">
          <View className="flex-row items-end justify-between">
            <Text className="text-3xl font-bold tracking-tight">Today</Text>
            <Text variant="muted" className="pb-1 tabular-nums">
              {count} of {TASKS.length} done
            </Text>
          </View>
          <ProgressLine value={count / TASKS.length} />
        </View>

        {/* Each group is one card whose top edge stays put. */}
        {openVisible ? (
          <View className="w-full overflow-hidden rounded-2xl bg-card">{renderGroup("open", open)}</View>
        ) : null}
        {doneVisible ? (
          <Animated.View entering={reduced ? undefined : FadeIn.duration(timing.fast.duration)} className="w-full gap-2 pt-2">
            <Text variant="muted" className="px-1 text-[13px] font-medium">Done</Text>
            <View className="w-full overflow-hidden rounded-2xl bg-card">{renderGroup("done", done)}</View>
          </Animated.View>
        ) : null}
      </View>
    </Accent>
  );
}
