import * as React from "react";
import { Image, Pressable, ScrollView, View } from "react-native";
import Animated, { Easing, FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from "react-native-reanimated";
import { Accent, ease, spring, timing, useHaptic, usePressAnimation, useReducedMotion } from "@lumioui/core";
import { Chip } from "../chip";
import { AnimatedNumber } from "../../animated-number/animated-number";
import { Icon } from "../../icon/icon";
import { Text } from "../../text/text";

type Filter = "pets" | "laundry" | "parking" | "furnished" | "balcony";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "pets", label: "Pets allowed" },
  { key: "laundry", label: "In-unit laundry" },
  { key: "parking", label: "Parking" },
  { key: "furnished", label: "Furnished" },
  { key: "balcony", label: "Balcony" },
];

const photo = (id: string) => `https://images.unsplash.com/photo-${id}?w=240&h=240&fit=crop&q=70&auto=format`;

const HOMES: { title: string; street: string; rent: string; photo: string; has: Filter[] }[] = [
  { title: "2 bed, 840 sq ft", street: "418 Hawthorne Ave", rent: "$2,150", photo: photo("1590490360182-c33d57733427"), has: ["pets", "laundry", "balcony"] },
  { title: "1 bed, 610 sq ft", street: "77 Alder St, unit 4", rent: "$1,725", photo: photo("1542309175-9b88d743f89f"), has: ["pets", "parking"] },
  { title: "Studio, 480 sq ft", street: "1201 SE Belmont St", rent: "$1,410", photo: photo("1572120360610-d971b9d7767c"), has: ["furnished", "laundry"] },
  { title: "2 bed, 910 sq ft", street: "36 NW Flanders St", rent: "$2,340", photo: photo("1600210492486-724fe5c67fb0"), has: ["pets", "laundry", "parking"] },
  { title: "1 bed, 655 sq ft", street: "2280 N Vancouver Ave", rent: "$1,890", photo: photo("1600489000022-c2086d79f9d4"), has: ["balcony", "parking"] },
  { title: "1 bed, 700 sq ft", street: "509 SE Ash St", rent: "$1,960", photo: photo("1615874959474-d609969a20ed"), has: ["pets", "furnished", "balcony"] },
];

const DIM = { duration: timing.recede.duration, easing: Easing.bezier(...ease.in) };
const IGNITE = { duration: timing.fast.duration, easing: Easing.bezier(...ease.out) };

/** A home that stops matching dims in place, then its slot closes (a
 *  measured collapse on spring.surface) so the rows below rise into it. One
 *  that matches again opens its slot and switches on in it. Opacity and
 *  height only, no travel. Reduced motion: it simply appears or goes. */
function Slot({ shown, children }: { shown: boolean; children: React.ReactNode }) {
  const reduced = useReducedMotion();
  const natural = React.useRef(0);
  const o = useSharedValue(shown ? 1 : 0);
  const h = useSharedValue(shown ? -1 : 0);
  const mounted = React.useRef(false);
  React.useEffect(() => {
    // The first render is already in place; only changes animate.
    if (!mounted.current) { mounted.current = true; return; }
    if (reduced) { o.value = shown ? 1 : 0; h.value = shown ? -1 : 0; return; }
    if (shown) {
      h.value = withSpring(natural.current, spring.surface, (done) => { if (done) h.value = -1; });
      o.value = withDelay(timing.recede.duration, withTiming(1, IGNITE));
    } else {
      if (h.value < 0) h.value = natural.current;
      o.value = withTiming(0, DIM, (done) => { if (done) h.value = withSpring(0, spring.surface); });
    }
  }, [shown, reduced, o, h]);
  const style = useAnimatedStyle(() => (h.value < 0 ? { opacity: o.value } : { height: h.value, opacity: o.value, overflow: "hidden" }));
  return (
    <Animated.View style={style} pointerEvents={shown ? "auto" : "none"} accessibilityElementsHidden={!shown} importantForAccessibility={shown ? "auto" : "no-hide-descendants"}>
      <View onLayout={(e) => { if (e.nativeEvent.layout.height > 0) natural.current = e.nativeEvent.layout.height; }}>{children}</View>
    </Animated.View>
  );
}

function HomeRow({ home, first }: { home: (typeof HOMES)[number]; first: boolean }) {
  const press = usePressAnimation();
  const haptic = useHaptic();
  return (
    <Pressable
      // Opening the listing belongs to the host app; the demo confirms the tap.
      onPress={() => haptic.light()}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      accessibilityRole="button"
      accessibilityLabel={`${home.title}, ${home.street}, ${home.rent} a month`}
    >
      <Animated.View
        style={press.animatedStyle}
        className={`flex-row items-center gap-3 p-3 ${first ? "" : "border-t border-border"}`}
      >
        <Image source={{ uri: home.photo }} className="h-16 w-16 rounded-xl bg-muted" accessibilityIgnoresInvertColors />
        <View className="flex-1 gap-1">
          <Text className="text-[15px]">{home.title}</Text>
          <Text variant="muted" numberOfLines={1}>{home.street}</Text>
        </View>
        <Text className="text-[15px] font-bold tabular-nums">{home.rent}</Text>
      </Animated.View>
    </Pressable>
  );
}

/** ChipFilters — a rentals filter rail. Chips are multi-select; every tap
 *  narrows the listings below: a home that no longer matches dims, then its
 *  slot closes and the rest rise into it; the count rolls to the new number.
 *  Teal for the product. */
export function ChipFilters() {
  const reduced = useReducedMotion();
  const haptic = useHaptic();
  const [on, setOn] = React.useState<Filter[]>(["pets"]);
  const toggle = (k: Filter) => setOn((cur) => (cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k]));
  const visible = HOMES.filter((h) => on.every((f) => h.has.includes(f)));

  return (
    <Accent color="teal" className="w-full">
      <View className="w-full">
        <View className="gap-1 px-1">
          <Text className="text-2xl font-bold tracking-tight">Portland, OR</Text>
          <Text variant="muted">Up to $2,400, 1+ bedrooms</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="-mx-4 mt-4"
          contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
        >
          <Chip variant="filter" icon={<Icon name="list" size="sm" color="foreground" />} accessibilityLabel="All filters" onPress={() => haptic.light()}>
            Filters
          </Chip>
          {FILTERS.map((f) => (
            <Chip key={f.key} variant="filter" selected={on.includes(f.key)} onPress={() => toggle(f.key)}>
              {f.label}
            </Chip>
          ))}
        </ScrollView>

        <View className="mt-5 flex-row items-center justify-between px-1">
          <View className="flex-row items-baseline gap-1">
            <AnimatedNumber value={visible.length} animation="roll" className="text-[17px] font-bold tabular-nums" />
            <Text className="text-[17px]">{visible.length === 1 ? "home" : "homes"}</Text>
          </View>
          {on.length > 0 ? (
            <Animated.View entering={reduced ? undefined : FadeIn.duration(timing.fast.duration)} exiting={reduced ? undefined : FadeOut.duration(timing.recede.duration)}>
              <Pressable onPress={() => setOn([])} accessibilityRole="button" accessibilityLabel="Clear filters" className="h-11 justify-center" hitSlop={8}>
                <Text className="text-[15px] text-primary-text">Clear</Text>
              </Pressable>
            </Animated.View>
          ) : null}
        </View>

        <View className="mt-2 overflow-hidden rounded-2xl bg-card">
          {HOMES.map((h) => (
            <Slot key={h.street} shown={visible.includes(h)}>
              <HomeRow home={h} first={h === visible[0]} />
            </Slot>
          ))}
          {visible.length === 0 ? (
            <View className="items-center px-6 py-8">
              <Text className="text-[15px]">No homes match all of these</Text>
              <Text variant="muted" className="mt-1">Try removing a filter</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Accent>
  );
}
