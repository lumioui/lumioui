import * as React from "react";
import { Pressable, View } from "react-native";
import Animated, { FadeIn, FadeOut, LinearTransition, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { Accent, timing, useReducedMotion } from "@lumioui/core";
import { ActionSheet } from "../action-sheet";
import { Icon, type IconName } from "../../icon/icon";
import { Text } from "../../text/text";

function DetailRow({ icon, title, detail, first }: { icon: IconName; title: string; detail?: string; first?: boolean }) {
  return (
    <View className="flex-row items-center gap-3 pl-4">
      <Icon name={icon} size="sm" color="mutedForeground" />
      <View className={`min-h-[52px] flex-1 justify-center pr-4 ${first ? "" : "border-t border-border"}`}>
        <Text className="text-[15px]">{title}</Text>
        {detail ? <Text variant="muted">{detail}</Text> : null}
      </View>
    </View>
  );
}

/** ActionSheetConfirm — a calendar's "delete a repeating event" choice. The
 *  event detail is the habitat; the sheet asks which occurrences go. The
 *  picked row holds lit, the sheet leaves, then the event performs the
 *  delete on the page: its title strikes and dims, the detail card dims and
 *  folds away, and the Undo row is what remains. */
export function ActionSheetConfirm() {
  const reduce = useReducedMotion();
  const [open, setOpen] = React.useState(false);
  const [deleted, setDeleted] = React.useState<null | "one" | "all">(null);
  const layout = reduce ? undefined : LinearTransition.springify();
  // The deleted event dims in place — it does not vanish before the Undo arrives.
  const isDeleted = deleted !== null;
  const headStyle = useAnimatedStyle(() => ({ opacity: withTiming(isDeleted ? 0.5 : 1, timing.normal) }), [isDeleted]);

  return (
    <Accent color="orange" className="w-full">
      <View className="w-full gap-6">
        <Animated.View layout={layout} className="gap-1 px-1" style={headStyle}>
          <View className="flex-row items-center gap-2">
            <View className="h-3 w-3 rounded-full bg-tint-orange" />
            <Text variant="muted">Work</Text>
          </View>
          <Text className={`text-2xl font-bold tracking-tight ${deleted ? "line-through" : ""}`}>Design crit</Text>
          <Text className="text-[15px] text-muted-foreground">Thursday, Oct 9 · 10:30 to 11:15 AM</Text>
        </Animated.View>

        {deleted ? null : (
          <Animated.View
            exiting={FadeOut.duration(timing.recede.duration)}
            entering={FadeIn.duration(timing.fast.duration)}
            layout={layout}
            className="overflow-hidden rounded-2xl bg-card"
          >
            <DetailRow first icon="repeat" title="Every Thursday" detail="Until Dec 18" />
            <DetailRow icon="map-pin" title="Room 4B, Harbor St office" />
            <DetailRow icon="users" title="6 invitees" detail="Noor, Felix, Ines and 3 more" />
            <DetailRow icon="bell" title="10 minutes before" />
          </Animated.View>
        )}

        {deleted ? (
          <Animated.View
            key="undo"
            entering={FadeIn.duration(timing.fast.duration)}
            layout={layout}
            className="flex-row items-center justify-between rounded-2xl bg-card px-4 py-3"
          >
            <Text className="flex-1 text-[15px]">
              {deleted === "one" ? "Deleted Oct 9 only" : "Deleted this and future events"}
            </Text>
            <Pressable
              onPress={() => setDeleted(null)}
              accessibilityRole="button"
              accessibilityLabel="Undo delete"
              hitSlop={8}
              className="min-h-[44px] justify-center pl-4"
            >
              <Text className="text-[15px] font-semibold text-primary-text">Undo</Text>
            </Pressable>
          </Animated.View>
        ) : (
          <Animated.View key="delete" entering={FadeIn.duration(timing.fast.duration)} layout={layout}>
            <Pressable
              onPress={() => setOpen(true)}
              accessibilityRole="button"
              className="min-h-[52px] items-center justify-center rounded-2xl bg-card active:opacity-70"
            >
              <Text className="text-[17px] text-destructive">Delete Event</Text>
            </Pressable>
          </Animated.View>
        )}

        <ActionSheet
          open={open}
          onOpenChange={setOpen}
          title="This is a repeating event."
          message="Delete only this occurrence, or this one and every Thursday after it?"
          actions={[
            { label: "Delete This Event Only", destructive: true, onPress: () => setDeleted("one") },
            { label: "Delete All Future Events", destructive: true, onPress: () => setDeleted("all") },
          ]}
        />
      </View>
    </Accent>
  );
}
