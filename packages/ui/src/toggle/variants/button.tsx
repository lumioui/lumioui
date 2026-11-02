import * as React from "react";
import { Image, View } from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";
import { Accent, ROW_STAGGER, spring, useReducedMotion } from "@lumioui/core";
import { Toggle } from "../toggle";
import { Icon } from "../../icon/icon";
import { Text } from "../../text/text";

const A = { title: "Cold Little Harbour", artist: "Michael Kiwele", time: "9:52" };
const B = { title: "Night Swim", artist: "Frank Oyelaran", time: "5:07" };
const C = { title: "Motion Blur", artist: "Phoebe Brennan", time: "3:49" };
const D = { title: "Two Weeks Out", artist: "Grizzly Coast", time: "4:03" };
const QUEUE = [A, B, C, D];
const SHUFFLED = [C, A, D, B];

/** ToggleButton — button-style toggles as the Shuffle / Repeat pair above a
 *  music queue. Each pill switches on from where it was pressed. Shuffle
 *  reorders the queue in place — rows move on spring.layout, 40ms apart;
 *  Repeat changes the footer line. Pink for media. */
export function ToggleButton() {
  const [shuffle, setShuffle] = React.useState(false);
  const [repeat, setRepeat] = React.useState(true);
  const reduce = useReducedMotion();
  const list = shuffle ? SHUFFLED : QUEUE;
  const move = (i: number) =>
    reduce
      ? undefined
      : LinearTransition.springify()
          .stiffness(spring.layout.stiffness)
          .damping(spring.layout.damping)
          .mass(spring.layout.mass)
          .delay(i * ROW_STAGGER);
  return (
    <Accent color="pink" className="w-full">
      <View className="w-full gap-4 rounded-3xl bg-card p-5">
        <View className="flex-row items-center gap-3">
          <Image
            source={{ uri: "https://images.unsplash.com/photo-1458560871784-56d23406c091?w=200&h=200&fit=crop&q=70&auto=format" }}
            className="h-14 w-14 rounded-xl bg-muted"
            accessibilityIgnoresInvertColors
          />
          <View className="flex-1">
            <Text className="text-[17px] font-semibold">Late Drive</Text>
            <Text variant="muted">Playlist · 24 songs, 1 hr 38 min</Text>
          </View>
        </View>

        <View className="w-full flex-row gap-2">
          <Toggle
            style="button"
            pressed={shuffle}
            onPressedChange={setShuffle}
            className="flex-1"
            icon={<Icon name="shuffle" size="sm" color="foreground" />}
            iconOn={<Icon name="shuffle" size="sm" color="primaryForeground" />}
          >
            Shuffle
          </Toggle>
          <Toggle
            style="button"
            pressed={repeat}
            onPressedChange={setRepeat}
            className="flex-1"
            icon={<Icon name="repeat" size="sm" color="foreground" />}
            iconOn={<Icon name="repeat" size="sm" color="primaryForeground" />}
          >
            Repeat
          </Toggle>
        </View>

        <View>
          <Text className="pb-1 text-[13px] text-muted-foreground">Up next</Text>
          {list.map((s, i) => (
            <Animated.View
              key={s.title}
              layout={move(i)}
              className="flex-row items-center gap-3 border-t border-border py-3"
            >
              <View className="flex-1">
                <Text className="text-[15px] font-medium" numberOfLines={1}>{s.title}</Text>
                <Text variant="muted" numberOfLines={1}>{s.artist}</Text>
              </View>
              <Text className="text-sm tabular-nums text-muted-foreground">{s.time}</Text>
            </Animated.View>
          ))}
          <Text className="pt-2 text-xs text-muted-foreground">
            {repeat ? "Playlist repeats after the last song" : "Playback stops after the last song"}
          </Text>
        </View>
      </View>
    </Accent>
  );
}
