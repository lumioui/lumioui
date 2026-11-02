import * as React from "react";
import { View } from "react-native";
import Animated, { Easing, LinearTransition, useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { Accent, ease, spring, timing, useReducedMotion } from "@lumioui/core";
import { DropdownMenu } from "../dropdown-menu";
import { Icon, type IconName } from "../../icon/icon";
import { Text } from "../../text/text";

type SortKey = "modified" | "name" | "size";

interface FileRow {
  name: string;
  icon: IconName;
  tile: string;
  modified: number; // days ago
  modifiedLabel: string;
  size: number; // MB
  sizeLabel: string;
}

const FILES: FileRow[] = [
  { name: "Q3 board deck", icon: "file-text", tile: "bg-tint-amber", modified: 0, modifiedLabel: "today", size: 18.4, sizeLabel: "18.4 MB" },
  { name: "Brand shoot selects", icon: "image", tile: "bg-tint-red", modified: 3, modifiedLabel: "Oct 4", size: 412, sizeLabel: "412 MB" },
  { name: "Contractor agreement", icon: "file-text", tile: "bg-tint-teal", modified: 9, modifiedLabel: "Sep 28", size: 0.3, sizeLabel: "312 KB" },
  { name: "Launch film v4", icon: "film", tile: "bg-tint-pink", modified: 1, modifiedLabel: "yesterday", size: 1240, sizeLabel: "1.2 GB" },
];

const LABEL: Record<SortKey, string> = { modified: "Last modified", name: "Name", size: "Storage used" };

const IGNITE = { duration: timing.fast.duration, easing: Easing.bezier(...ease.out) } as const;

/** The trigger's label swaps in place: the new order ignites 0.96→1 as the
 *  menu dims (the old one has already left with the panel's light). */
function SwapLabel({ text }: { text: string }) {
  const reduce = useReducedMotion();
  const on = useSharedValue(1);
  const scale = useSharedValue(1);
  const first = React.useRef(true);
  React.useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    on.value = 0;
    on.value = withTiming(1, IGNITE);
    if (reduce) return;
    scale.value = 0.96;
    scale.value = withSpring(1, spring.swap);
  }, [text, reduce, on, scale]);
  const style = useAnimatedStyle(() => ({ opacity: on.value, transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={style}>
      <Text className="text-[15px] font-medium text-primary-text">{text}</Text>
    </Animated.View>
  );
}

/** DropdownSort — a single-select sort menu on a file list. The trigger
 *  lights before the panel grows out of it; a pick draws its check on and
 *  holds, then the menu dims, the trigger's label swaps in place and the
 *  rows reflow into the new order. Productivity → orange. */
export function DropdownSort() {
  const reduce = useReducedMotion();
  const [sort, setSort] = React.useState<SortKey>("modified");

  const files = React.useMemo(() => {
    const out = [...FILES];
    if (sort === "name") out.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "size") out.sort((a, b) => b.size - a.size);
    else out.sort((a, b) => a.modified - b.modified);
    return out;
  }, [sort]);

  const reflow = reduce ? undefined : LinearTransition.springify().damping(spring.layout.damping).stiffness(spring.layout.stiffness);

  const option = (key: SortKey) => (
    <DropdownMenu.Item key={key} check selected={sort === key} onPress={() => setSort(key)}>
      {LABEL[key]}
    </DropdownMenu.Item>
  );

  return (
    <Accent color="orange" className="w-full">
      <View className="w-full gap-2">
        <View className="flex-row items-center justify-between px-1">
          <Text className="text-2xl font-bold tracking-tight">My files</Text>
          <DropdownMenu>
            <DropdownMenu.Trigger
              lit
              accessibilityLabel={`Sort by ${LABEL[sort]}`}
              className="min-h-[44px] flex-row items-center gap-1 rounded-full px-3"
            >
              <SwapLabel text={LABEL[sort]} />
              <Icon name="chevron-down" size="sm" color="primaryText" />
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end">
              {/* Overlays portal out of the tree — re-scope the accent so
                  the drawn check keeps the orange tint. */}
              <Accent color="orange">
                {option("modified")}
                {option("name")}
                {option("size")}
              </Accent>
            </DropdownMenu.Content>
          </DropdownMenu>
        </View>

        <View className="overflow-hidden rounded-2xl bg-card">
          {files.map((f, i) => (
            <Animated.View key={f.name} layout={reflow} className="flex-row items-center gap-3 pl-4">
              <View className={`h-10 w-10 items-center justify-center rounded-xl ${f.tile}`}>
                <Icon name={f.icon} size="sm" color="#FFFFFF" />
              </View>
              <View className={`min-h-[64px] flex-1 justify-center pr-4 ${i > 0 ? "border-t border-border" : ""}`}>
                <Text className="text-base font-medium" numberOfLines={1}>{f.name}</Text>
                <Text variant="muted">
                  {sort === "size" ? f.sizeLabel : `Modified ${f.modifiedLabel}`}
                </Text>
              </View>
            </Animated.View>
          ))}
        </View>
      </View>
    </Accent>
  );
}
