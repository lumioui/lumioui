import * as React from "react";
import { Pressable, ScrollView, View, type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import Animated, {
  Easing,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Accent, ROW_STAGGER, cn, ease, spring, tempo, timing, useHaptic, useReducedMotion } from "@lumioui/core";
import { Toolbar } from "../toolbar";
import { Icon } from "../../icon/icon";
import { Image } from "../../image/image";
import { Text } from "../../text/text";

// A test kitchen's menu shoot — plated dishes and table props.
const IDS = [
  "1586190848861-99aa4a171e90",
  "1513104890138-7c749659a591",
  "1579871494447-9811cf80d66c",
  "1551504734-5ee1c4a1479b",
  "1569718212165-3a8278d5f624",
  "1621996346565-e3dbc646d9a9",
  "1546793665-c74683f339c1",
  "1546069901-ba9599a7e63c",
  "1509042239860-f550ce710b93",
  "1604382354936-07c5d9983bd3",
  "1514228742587-6b1558fcca3d",
  "1512621776951-a57141f2eefd",
];
const uri = (id: string) => `https://images.unsplash.com/photo-${id}?w=300&h=300&fit=crop&q=70&auto=format`;

/** A deleted tile dims to this before it leaves — the act is seen. */
const FOLD_DIM = 0.4;
/** …and folds to this scale on spring.layout. */
const FOLD_SCALE = 0.94;
/** A picked tile sits a step dimmer so the check reads on top of it. */
const PICK_DIM = 0.7;
/** The "deleted · Undo" slot holds this long before the bar swaps back. */
const DELETE_HOLD = 650;
/** Bringing a scrolled-away pick back into view before it performs. */
const RETURN_MS = tempo.settle;
const TILE_GAP = 2;

const tileMove = LinearTransition.springify()
  .stiffness(spring.layout.stiffness)
  .damping(spring.layout.damping)
  .mass(spring.layout.mass);

function Tile({
  id,
  size,
  selecting,
  picked,
  folding,
  delay,
  onPress,
}: {
  id: string;
  /** Tile edge in pt, from the grid's measured width (3 across). */
  size: number;
  selecting: boolean;
  picked: boolean;
  folding: boolean;
  delay: number;
  onPress: () => void;
}) {
  const reduce = useReducedMotion();
  const lit = useSharedValue(1);
  const fold = useSharedValue(1);
  React.useEffect(() => {
    const target = folding ? FOLD_DIM : picked ? PICK_DIM : 1;
    lit.value = withDelay(folding ? delay : 0, withTiming(target, { ...timing.fast, easing: Easing.bezier(...ease.out) }));
    if (reduce) {
      fold.value = 1;
      return;
    }
    fold.value = folding ? withDelay(delay, withSpring(FOLD_SCALE, spring.layout)) : withSpring(1, spring.layout);
  }, [folding, picked, delay, reduce, lit, fold]);
  const imgStyle = useAnimatedStyle(() => ({ opacity: lit.value }));
  const tileStyle = useAnimatedStyle(() => ({ transform: [{ scale: fold.value }] }));

  return (
    <Animated.View
      layout={reduce ? undefined : tileMove}
      exiting={FadeOut.duration(timing.recede.duration)}
      style={[{ width: size, height: size }, tileStyle]}
    >
      <Pressable
        onPress={onPress}
        className="h-full w-full"
        accessibilityRole={selecting ? "checkbox" : "imagebutton"}
        accessibilityState={selecting ? { checked: picked } : undefined}
        accessibilityLabel="Menu shoot photo"
      >
        <Animated.View style={imgStyle} className="h-full w-full">
          <Image source={{ uri: uri(id) }} rounded="none" className="h-full w-full" />
        </Animated.View>
        {selecting ? (
          <View
            className={cn(
              "absolute bottom-2 right-2 h-6 w-6 items-center justify-center rounded-full border-2 border-white",
              picked ? "bg-primary" : "bg-black/20"
            )}
          >
            {picked ? <Icon name="check" size="sm" color="primaryForeground" strokeWidth={3} /> : null}
          </View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

type Phase = "browse" | "select" | "deleting" | "deleted";

/** ToolbarSelection — a test kitchen's menu-shoot library. "Select" swaps
 *  the floating glass toolbar in place: the browse set dims while Share,
 *  the count and Delete ignite left → right. Share and Delete wake with the
 *  first pick. Delete performs on the photos: picked tiles dim and fold
 *  40ms apart while the count rolls down with them, the slot holds
 *  "3 photos deleted · Undo", then the bar swaps back to browse and the
 *  grid closes the gaps. The bar is glass because the grid scrolls under
 *  it. Pink for media. */
export function ToolbarSelection() {
  const haptics = useHaptic();
  const [photos, setPhotos] = React.useState(IDS);
  const [phase, setPhase] = React.useState<Phase>("browse");
  const [picked, setPicked] = React.useState<Set<string>>(new Set());
  const [left, setLeft] = React.useState(0);
  const [removed, setRemoved] = React.useState(0);
  const n = picked.size;
  const selecting = phase !== "browse";
  const folding = phase === "deleting" || phase === "deleted";

  const scroll = React.useRef<React.ComponentRef<typeof ScrollView>>(null);
  const scrollY = React.useRef(0);
  const view = React.useRef({ w: 0, h: 0 });
  // Three tiles and two gaps fill the measured width exactly; a percentage
  // width plus fixed gaps wraps to two columns on narrow phones.
  const [gridW, setGridW] = React.useState(0);
  const tileSize = gridW > 0 ? (gridW - 2 * TILE_GAP) / 3 : 0;
  const timers = React.useRef<ReturnType<typeof setTimeout>[]>([]);
  const later = (fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  };
  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  React.useEffect(() => clearTimers, []);

  const toggle = (id: string) => {
    if (phase !== "select") return;
    haptics.selection();
    setPicked((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const exit = () => {
    setPhase("browse");
    setPicked(new Set());
  };

  const order = photos.filter((id) => picked.has(id));
  const foldDelay = (id: string) => Math.max(0, order.indexOf(id)) * ROW_STAGGER;

  const perform = () => {
    // Act: tiles fold 40ms apart and the count rolls down with them.
    setPhase("deleting");
    setLeft(n);
    order.forEach((_, i) => later(() => setLeft(n - i - 1), (i + 1) * ROW_STAGGER));
    const folded = order.length * ROW_STAGGER + timing.fast.duration;
    // Hold: the slot owns the result before the bar moves on.
    later(() => {
      setRemoved(n);
      setPhase("deleted");
    }, folded);
    // Resolve: the tiles leave, the grid closes up, the bar swaps back.
    later(() => {
      setPhotos((p) => p.filter((id) => !picked.has(id)));
      exit();
    }, folded + DELETE_HOLD);
  };

  const onDelete = () => {
    haptics.warning();
    // The first pick must be on screen when it performs.
    const row = Math.floor(photos.indexOf(order[0] ?? "") / 3);
    const tile = (view.current.w - 2 * TILE_GAP) / 3;
    const top = row * (tile + TILE_GAP);
    const off = top < scrollY.current || top + tile > scrollY.current + view.current.h - 96;
    if (off) {
      scroll.current?.scrollTo({ y: Math.max(0, top - 24), animated: true });
      later(perform, RETURN_MS);
    } else perform();
  };

  const undo = () => {
    clearTimers();
    haptics.light();
    setRemoved(0);
    exit();
  };

  const contentKey = phase === "browse" ? "browse" : phase === "deleted" ? "deleted" : "select";

  return (
    <Accent color="pink" className="w-full">
      <View className="w-full overflow-hidden rounded-3xl bg-card" style={{ height: 600 }}>
        <View className="flex-row items-center justify-between px-4 pb-3 pt-5">
          <View className="min-w-0 flex-1 pr-3">
            <Text className="text-3xl font-bold tracking-tight" numberOfLines={1}>Menu shoot</Text>
            <Text variant="muted" numberOfLines={1}>{photos.length} photos · Harbor Kitchen, spring</Text>
          </View>
          <Pressable
            onPress={() => {
              if (folding) return;
              haptics.light();
              if (selecting) exit();
              else setPhase("select");
            }}
            className="h-11 shrink-0 items-center justify-center rounded-full bg-secondary px-4"
            accessibilityRole="button"
          >
            <Text className="text-[15px] font-semibold">{selecting ? "Cancel" : "Select"}</Text>
          </Pressable>
        </View>

        <ScrollView
          ref={scroll}
          contentContainerStyle={{ paddingBottom: 96 }}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={64}
          onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
            scrollY.current = e.nativeEvent.contentOffset.y;
          }}
          onLayout={(e: LayoutChangeEvent) => {
            view.current = { w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height };
            setGridW(e.nativeEvent.layout.width);
          }}
        >
          <View className="flex-row flex-wrap" style={{ gap: TILE_GAP }}>
            {photos.map((id) => (
              <Tile
                key={id}
                id={id}
                size={tileSize}
                selecting={selecting}
                picked={picked.has(id)}
                folding={folding && picked.has(id)}
                delay={foldDelay(id)}
                onPress={() => toggle(id)}
              />
            ))}
          </View>
        </ScrollView>

        <View className="absolute bottom-4 left-0 right-0">
          <Toolbar variant="floating" material="glass" contentKey={contentKey}>
            {phase === "deleted" ? (
              <>
                <Toolbar.Item icon="trash" label="Deleted" tone="destructive" disabled />
                <Toolbar.Status title={`${removed} ${removed === 1 ? "photo" : "photos"} deleted`} />
                <Toolbar.TextButton onPress={undo} emphasized>
                  Undo
                </Toolbar.TextButton>
              </>
            ) : selecting ? (
              <>
                <Toolbar.Item icon="share" label="Share" tone="primary" disabled={n === 0 || folding} />
                <Toolbar.Status
                  title={
                    phase === "deleting"
                      ? `${left} ${left === 1 ? "Photo" : "Photos"} Selected`
                      : n === 0
                        ? "Select items"
                        : `${n} ${n === 1 ? "Photo" : "Photos"} Selected`
                  }
                  trend={phase === "deleting" ? "down" : undefined}
                />
                <Toolbar.Item icon="trash" label="Delete" tone="destructive" disabled={n === 0 || folding} onPress={onDelete} />
              </>
            ) : (
              <>
                <Toolbar.Item icon="heart" label="Favorites" />
                <Toolbar.Status
                  title={`${photos.length} Photos`}
                  subtitle={removed ? `${removed} moved to Recently Deleted` : "Synced 2 min ago"}
                />
                <Toolbar.Item icon="grid" label="Grid size" />
              </>
            )}
          </Toolbar>
        </View>
      </View>
    </Accent>
  );
}
