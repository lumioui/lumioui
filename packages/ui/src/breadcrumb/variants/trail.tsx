import * as React from "react";
import { View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { BAND_STAGGER, SwitchOn, ease, spring, timing, useReducedMotion } from "@lumioui/core";
import { Breadcrumb } from "../breadcrumb";
import { List } from "../../list/list";
import { Icon, type IconName } from "../../icon/icon";

type Entry = { name: string; meta: string; icon: IconName; tile: string; folder?: boolean };

const TREE: Record<string, Entry[]> = {
  "Files": [
    { name: "Studio Kova", meta: "Shared · 41 items", icon: "briefcase", tile: "bg-tint-teal", folder: true },
    { name: "Taxes 2025", meta: "12 items", icon: "landmark", tile: "bg-slate-500", folder: true },
    { name: "Lease renewal.pdf", meta: "1.2 MB · Sep 30", icon: "file-text", tile: "bg-tint-red" },
  ],
  "Studio Kova": [
    { name: "Clients", meta: "8 folders", icon: "users", tile: "bg-tint-teal", folder: true },
    { name: "Brand assets", meta: "214 items", icon: "palette", tile: "bg-tint-amber", folder: true },
    { name: "Rate card 2026.pdf", meta: "380 KB · Oct 3", icon: "file-text", tile: "bg-tint-red" },
  ],
  Clients: [
    { name: "Halden Running", meta: "Spring campaign · 26 items", icon: "footprints", tile: "bg-tint-green", folder: true },
    { name: "Paperline", meta: "Packaging · 9 items", icon: "book-open", tile: "bg-tint-orange", folder: true },
  ],
  "Halden Running": [
    { name: "Hero shoot selects", meta: "48 photos", icon: "image", tile: "bg-tint-pink", folder: false },
    { name: "Launch brief v3.doc", meta: "88 KB · edited 2h ago", icon: "file-text", tile: "bg-tint-teal" },
    { name: "Storyboard.mov", meta: "212 MB · 0:42", icon: "film", tile: "bg-tint-amber" },
  ],
};

/** The folder heading swaps in place: the old name dims while the new one ignites. */
function Heading({ title }: { title: string }) {
  const reduce = useReducedMotion();
  const lit = useSharedValue(1);
  const grow = useSharedValue(1);
  const first = React.useRef(true);
  React.useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    lit.value = 0;
    lit.value = withTiming(1, { ...timing.fast, easing: Easing.bezier(...ease.out) });
    if (reduce) return;
    grow.value = SWAP_FROM;
    grow.value = withSpring(1, spring.swap);
  }, [title, reduce, lit, grow]);
  const style = useAnimatedStyle(() => ({
    opacity: lit.value,
    transform: [{ scale: grow.value }],
  }));
  return (
    <Animated.Text
      className="pb-3 pt-1 text-3xl font-bold tracking-tight text-foreground"
      style={[{ transformOrigin: "left center" }, style]}
      accessibilityRole="header"
      numberOfLines={1}
    >
      {title}
    </Animated.Text>
  );
}

/** Headings ignite from this scale (swap grammar). */
const SWAP_FROM = 0.96;

/** BreadcrumbTrail — a file browser path. Tap a folder and its name rises
 *  into the trail as the new lit crumb while the heading swaps in place and
 *  the folder's rows switch on; tap any crumb to jump back up and the
 *  dropped levels dim right to left. */
export function BreadcrumbTrail() {
  const [path, setPath] = React.useState(["Files", "Studio Kova"]);
  const here = path[path.length - 1]!;
  const entries = TREE[here] ?? [];
  return (
    <View className="w-full overflow-hidden rounded-3xl bg-background pb-2 pt-4">
      <View className="px-4">
        <Breadcrumb
          items={path.map((label, i) =>
            i === path.length - 1
              ? { label }
              : { label, onPress: () => setPath(path.slice(0, i + 1)) },
          )}
        />
        <Heading title={here} />
      </View>
      {/* The folder's contents switch on one band behind the crumb and heading. */}
      <SwitchOn key={here} delay={BAND_STAGGER}>
        <List inset>
          <List.Section>
            {entries.map((e, i) => (
              <React.Fragment key={e.name}>
                {i > 0 ? <List.Separator inset={68} /> : null}
                <List.Item
                  title={e.name}
                  subtitle={e.meta}
                  leading={
                    <View className={`h-10 w-10 items-center justify-center rounded-xl ${e.tile}`}>
                      <Icon name={e.icon} size="md" color="#FFFFFF" />
                    </View>
                  }
                  showChevron={!!e.folder && !!TREE[e.name]}
                  onPress={TREE[e.name] ? () => setPath([...path, e.name]) : undefined}
                />
              </React.Fragment>
            ))}
          </List.Section>
        </List>
      </SwitchOn>
    </View>
  );
}
