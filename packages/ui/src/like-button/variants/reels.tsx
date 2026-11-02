import * as React from "react";
import { Image, Pressable, Text as RNText, View, type LayoutRectangle } from "react-native";
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from "react-native-svg";
import { spring, timing, useReducedMotion } from "@lumioui/core";
import { LikeButton } from "../like-button";
import { Avatar } from "../../avatar/avatar";
import { Icon, type IconName } from "../../icon/icon";

const FRAME = "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&q=80&auto=format&fit=crop";
const HEART = "M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z";
// Two taps inside this window count as a double-tap.
const DOUBLE_TAP_MS = 280;
// Act, hold, resolve: the big heart rests on the frame before it travels.
const HEART_HOLD_MS = 520;
const BIG = 104;
// The rail heart (LikeButton overlay md glyph).
const SMALL = 32;
// The rail heart fills once the big one is this far into its flight — the
// moment it visually lands, before the calm spring finishes settling.
const ARRIVE_AT = 0.9;

const SHADOW = { textShadowColor: "rgba(0,0,0,0.45)", textShadowRadius: 4, textShadowOffset: { width: 0, height: 1 } };

function RailAction({ icon, label, a11y }: { icon: IconName; label?: string; a11y: string }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={a11y} className="min-w-[44px] items-center gap-1">
      <Icon name={icon} size="lg" color="#FFFFFF" />
      {label ? (
        <RNText className="text-[13px] font-semibold text-white tabular-nums" style={SHADOW}>
          {label}
        </RNText>
      ) : null}
    </Pressable>
  );
}

/** LikeButtonReels — the overlay variant on a vertical video. The white rail
 *  sits on the right edge over a bottom scrim. Double-tap the frame: a white
 *  heart lands, holds, then travels into the rail heart, which fills as it
 *  arrives and 48.2K swaps up to 48.3K. */
export function LikeButtonReels() {
  const reduce = useReducedMotion();
  const [liked, setLiked] = React.useState(false);
  const lastTap = React.useRef(0);

  // Frame size, the rail, and the like button inside the rail — the flight
  // runs from the frame's centre to the rail heart's glyph.
  const [frame, setFrame] = React.useState<{ width: number; height: number } | null>(null);
  const [rail, setRail] = React.useState<LayoutRectangle | null>(null);
  const [like, setLike] = React.useState<LayoutRectangle | null>(null);

  const land = useSharedValue(0); // 0 hidden … 1 landed on the frame
  const fly = useSharedValue(0); // 0 on the frame … 1 at the rail heart
  const armed = useSharedValue(0); // 1 while a flight is waiting to arrive

  const arrive = React.useCallback(() => setLiked(true), []);
  useAnimatedReaction(
    () => fly.value,
    (v) => {
      if (armed.value === 1 && v >= ARRIVE_AT) {
        armed.value = 0;
        runOnJS(arrive)();
      }
    }
  );

  const onFramePress = () => {
    const now = Date.now();
    if (now - lastTap.current >= DOUBLE_TAP_MS) {
      lastTap.current = now;
      return;
    }
    lastTap.current = 0;
    // Double-tap only ever likes — it never un-likes.
    if (reduce) {
      fly.value = 0;
      armed.value = 0;
      land.value = withSequence(withTiming(1, timing.fast), withDelay(HEART_HOLD_MS, withTiming(0, timing.recede)));
      setTimeout(arrive, timing.fast.duration + HEART_HOLD_MS);
      return;
    }
    fly.value = 0;
    land.value = 0;
    land.value = withSpring(1, spring.pop);
    armed.value = 1;
    fly.value = withDelay(HEART_HOLD_MS, withSpring(1, spring.surface));
  };

  const dx = frame && rail && like ? rail.x + like.x + like.width / 2 - frame.width / 2 : 0;
  const dy = frame && rail && like ? rail.y + like.y + SMALL / 2 - frame.height / 2 : 0;

  const bigStyle = useAnimatedStyle(() => {
    const f = Math.min(1, fly.value);
    // It dims as it goes and is out by the time it reaches the rail.
    const dim = interpolate(f, [0, ARRIVE_AT], [1, 0.3], "clamp") * (f >= ARRIVE_AT ? 0 : 1);
    const lift = reduce ? 1 : 0.4 + land.value * 0.6;
    const shrink = reduce ? 1 : interpolate(f, [0, 1], [1, SMALL / BIG]);
    return {
      opacity: Math.min(1, land.value * 1.4) * dim,
      transform: [{ translateX: reduce ? 0 : dx * f }, { translateY: reduce ? 0 : dy * f }, { scale: lift * shrink }],
    };
  }, [reduce, dx, dy]);

  return (
    <View
      className="w-full overflow-hidden rounded-3xl bg-neutral-900"
      style={{ height: 600 }}
      onLayout={(e) => setFrame({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}
    >
      <Pressable onPress={onFramePress} className="absolute inset-0" accessibilityRole="image" accessibilityLabel="Video. Double-tap to like.">
        <Image source={{ uri: FRAME }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
        {/* Scrim only where the white type sits — the frame keeps its colour. */}
        <Svg style={{ position: "absolute", left: 0, right: 0, bottom: 0 }} width="100%" height={280} pointerEvents="none">
          <Defs>
            <LinearGradient id="reel-scrim" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#000" stopOpacity={0} />
              <Stop offset="1" stopColor="#000" stopOpacity={0.62} />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#reel-scrim)" />
        </Svg>
      </Pressable>

      <View
        className="absolute bottom-6 right-3 items-center gap-5"
        pointerEvents="box-none"
        onLayout={(e) => setRail(e.nativeEvent.layout)}
      >
        <LikeButton
          variant="overlay"
          liked={liked}
          onLikedChange={setLiked}
          count={48299}
          onLayout={(e) => setLike(e.nativeEvent.layout)}
        />
        <RailAction icon="message-circle" label="1,093" a11y="Comments, 1,093" />
        <RailAction icon="send" label="2,410" a11y="Share" />
        <RailAction icon="more-horizontal" a11y="More" />
      </View>

      <View className="absolute bottom-6 left-4 right-20 gap-2" pointerEvents="box-none">
        <View className="flex-row items-center gap-2">
          <Avatar size="sm" source={{ uri: "https://i.pravatar.cc/150?img=47" }} fallback="JO" alt="Juno Okafor" />
          <RNText className="text-[15px] font-semibold text-white" style={SHADOW}>
            juno.styles
          </RNText>
          <View className="rounded-lg border border-white/60 px-2 py-0.5">
            <RNText className="text-[13px] font-semibold text-white">Follow</RNText>
          </View>
        </View>
        <RNText className="text-[15px] leading-snug text-white" style={SHADOW} numberOfLines={2}>
          Three ways to wear one linen overshirt this spring. Number two is the keeper.
        </RNText>
        <View className="flex-row items-center gap-1.5">
          <Icon name="music" size="sm" color="#FFFFFF" />
          <RNText className="text-[13px] text-white" style={SHADOW} numberOfLines={1}>
            Sundays at Ochre · Pale Coast
          </RNText>
        </View>
      </View>

      {frame ? (
        <View
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={{ position: "absolute", left: frame.width / 2 - BIG / 2, top: frame.height / 2 - BIG / 2 }}
        >
          <Animated.View style={bigStyle}>
            <Svg width={BIG} height={BIG} viewBox="0 0 24 24">
              <Path d={HEART} fill="#FFFFFF" />
            </Svg>
          </Animated.View>
        </View>
      ) : null}
    </View>
  );
}
