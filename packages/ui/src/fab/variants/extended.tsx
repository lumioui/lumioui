import * as React from "react";
import { View, type LayoutChangeEvent, type LayoutRectangle } from "react-native";
import Animated, {
  Easing,
  FadeOut,
  LinearTransition,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Accent, BAND_STAGGER, SwitchOn, ease, spring, tempo, timing, useReducedMotion } from "@lumioui/core";
import { Fab } from "../fab";
import { Icon } from "../../icon/icon";
import { Text } from "../../text/text";

type Note = { id: number; title: string; body: string; when: string };

const SEED: Note[] = [
  { id: 3, title: "Pottery class", body: "Bring apron, glaze test tiles, $25 kiln fee", when: "Yesterday" },
  { id: 2, title: "Book club picks", body: "The House of Tides, Small Weathers", when: "Mon" },
  { id: 1, title: "Bike service", body: "Rear brake pads, true the back wheel", when: "Oct 2" },
];

const DRAFTS = ["Gift ideas for Noa", "Questions for the landlord", "Weekend hike gear"];

/** The disc lands on the slot after about one surface period. */
const LAND_MS = tempo.settle;
/** Act, hold, resolve: the new card keeps its light this long, then settles to a plain row. */
const HOLD_MS = 700;
/** Row height before the first row has been measured. */
const ROW_FALLBACK = 68;
/** The list's side inset (px-3). */
const LIST_INSET = 12;

const glideLayout = LinearTransition.springify().damping(spring.layout.damping).stiffness(spring.layout.stiffness);
const dimOut = FadeOut.duration(timing.recede.duration);

type Flight = { from: LayoutRectangle; to: LayoutRectangle };

/** FabExtended — a "New note" pill parked over a notes list. The pill is
 *  the hero of what it creates: it leaves its corner and grows on
 *  spring.surface into the new note card at the top while the list makes
 *  room on spring.layout; the card's title switches on 120ms after it lands
 *  and the card holds lit before settling into the list. Amber. */
export function FabExtended() {
  const reduce = useReducedMotion();
  const [notes, setNotes] = React.useState(SEED);
  const [fresh, setFresh] = React.useState<number | null>(null);
  const [flight, setFlight] = React.useState<Flight | null>(null);
  const fab = React.useRef<LayoutRectangle | null>(null);
  const list = React.useRef<LayoutRectangle | null>(null);
  const rowH = React.useRef(ROW_FALLBACK);
  const t = useSharedValue(0);
  const ghost = useSharedValue(0);
  const fabShown = useSharedValue(1);
  const timers = React.useRef<ReturnType<typeof setTimeout>[]>([]);
  React.useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const land = React.useCallback(() => {
    // The disc becomes the card: it dims away over the slot it filled.
    ghost.value = withTiming(0, { ...timing.recede, easing: Easing.bezier(...ease.in) });
    fabShown.value = withTiming(1, { ...timing.fast, easing: Easing.bezier(...ease.out) });
    timers.current.push(setTimeout(() => setFlight(null), timing.recede.duration));
  }, [ghost, fabShown]);

  const add = () => {
    const id = Date.now();
    setNotes((n) => [
      { id, title: DRAFTS[(n.length - SEED.length) % DRAFTS.length] ?? "Untitled", body: "Just now", when: "Now" },
      ...n,
    ]);
    setFresh(id);
    timers.current.push(setTimeout(() => setFresh((f) => (f === id ? null : f)), LAND_MS + BAND_STAGGER + HOLD_MS));
    if (reduce || !fab.current || !list.current) return;
    // The slot: the list's first row, inside its px-3 inset.
    const to = { x: list.current.x + LIST_INSET, y: list.current.y, width: list.current.width - LIST_INSET * 2, height: rowH.current };
    setFlight({ from: fab.current, to });
    t.value = 0;
    ghost.value = 1;
    fabShown.value = 0;
    t.value = withSpring(1, spring.surface, (done) => {
      if (done) runOnJS(land)();
    });
  };

  const ghostStyle = useAnimatedStyle(() => {
    if (!flight) return { opacity: 0 };
    const { from, to } = flight;
    const p = Math.min(1, t.value);
    return {
      opacity: ghost.value,
      left: interpolate(t.value, [0, 1], [from.x, to.x]),
      top: interpolate(t.value, [0, 1], [from.y, to.y]),
      width: interpolate(t.value, [0, 1], [from.width, to.width]),
      height: interpolate(t.value, [0, 1], [from.height, to.height]),
      borderRadius: interpolate(p, [0, 1], [from.height / 2, 16]),
    };
  }, [flight]);
  const fabStyle = useAnimatedStyle(() => ({ opacity: fabShown.value }));

  return (
    <Accent color="amber" className="w-full">
      <View className="relative h-[480px] w-full overflow-hidden rounded-3xl bg-card">
        <View className="px-5 pb-3 pt-5">
          <Text className="text-3xl font-bold tracking-tight">Notes</Text>
          <Text variant="muted">{notes.length} notes</Text>
        </View>
        <View className="px-3" onLayout={(e: LayoutChangeEvent) => (list.current = e.nativeEvent.layout)}>
          {notes.slice(0, 5).map((n, i) => (
            <Animated.View
              key={n.id}
              layout={reduce ? undefined : glideLayout}
              exiting={dimOut}
              onLayout={i === 0 && n.id !== fresh ? (e: LayoutChangeEvent) => (rowH.current = e.nativeEvent.layout.height) : undefined}
            >
              <NoteRow note={n} first={i === 0} fresh={n.id === fresh} reveal={reduce ? 0 : LAND_MS} />
            </Animated.View>
          ))}
        </View>
        {flight ? <Animated.View pointerEvents="none" className="absolute bg-primary" style={ghostStyle} /> : null}
        <Animated.View
          className="absolute bottom-5 right-5"
          style={fabStyle}
          onLayout={(e: LayoutChangeEvent) => (fab.current = e.nativeEvent.layout)}
        >
          <Fab
            position="none"
            extended
            label="New note"
            onPress={add}
            icon={<Icon name="edit" size="md" color="primaryForeground" />}
          />
        </Animated.View>
      </View>
    </Accent>
  );
}

/** A note row. A fresh one is the card the pill became: it waits dark until
 *  the disc lands, holds an accent wash, and its title switches on 120ms in. */
function NoteRow({ note, first, fresh, reveal }: { note: Note; first: boolean; fresh: boolean; reveal: number }) {
  const shown = useSharedValue(fresh && reveal ? 0 : 1);
  const wash = useSharedValue(fresh ? 1 : 0);
  React.useEffect(() => {
    if (!fresh) {
      wash.value = withTiming(0, { ...timing.slow, easing: Easing.bezier(...ease.inOut) });
      return;
    }
    if (!reveal) return;
    // Revealed under the landing disc, so the swap reads as one object.
    const id = setTimeout(() => (shown.value = withTiming(1, timing.instant)), reveal);
    return () => clearTimeout(id);
  }, [fresh, reveal, shown, wash]);
  const rowStyle = useAnimatedStyle(() => ({ opacity: shown.value }));
  const washStyle = useAnimatedStyle(() => ({ opacity: wash.value * 0.16 }));
  const title = (
    <Text className="flex-1 text-base font-semibold" numberOfLines={1}>
      {note.title}
    </Text>
  );
  return (
    <Animated.View style={rowStyle} className={`gap-1 px-2 py-3 ${first ? "" : "border-t border-border"}`}>
      <Animated.View pointerEvents="none" className="absolute inset-0 rounded-2xl bg-primary" style={washStyle} />
      <View className="flex-row items-baseline justify-between gap-3">
        {fresh ? <SwitchOn delay={reveal + BAND_STAGGER} className="flex-1">{title}</SwitchOn> : title}
        <Text className="text-xs text-muted-foreground">{note.when}</Text>
      </View>
      <Text variant="muted" numberOfLines={1}>
        {note.body}
      </Text>
    </Animated.View>
  );
}
