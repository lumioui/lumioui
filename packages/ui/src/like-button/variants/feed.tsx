import * as React from "react";
import { Image, Pressable, View, type LayoutRectangle } from "react-native";
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
import Svg, { Path } from "react-native-svg";
import { spring, timing, useReducedMotion } from "@lumioui/core";
import { LikeButton } from "../like-button";
import { Avatar } from "../../avatar/avatar";
import { Icon } from "../../icon/icon";
import { Text } from "../../text/text";

const PHOTO = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80&auto=format&fit=crop";
const HEART = "M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z";
// Two taps inside this window count as a double-tap (platforms use ~250–300ms).
const DOUBLE_TAP_MS = 280;
// Act, hold, resolve: the big heart rests on the photo before it travels.
const HEART_HOLD_MS = 520;
const BIG = 96;
// The action-row heart (LikeButton plain md glyph).
const SMALL = 24;
// The small heart fills once the big one is this far into its flight — the
// moment it visually lands, before the calm spring finishes settling.
const ARRIVE_AT = 0.9;

/** LikeButtonFeed — a photo post in a feed. Tap the heart, or double-tap the
 *  photo: a big heart lands on the image, holds, then travels down into the
 *  action-row heart, which fills with light the moment it arrives. */
export function LikeButtonFeed() {
  const reduce = useReducedMotion();
  const [liked, setLiked] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const lastTap = React.useRef(0);

  // Layout of the photo, the action row and the like button inside it — the
  // flight runs from the photo's centre to the button's glyph.
  const [photo, setPhoto] = React.useState<LayoutRectangle | null>(null);
  const [row, setRow] = React.useState<LayoutRectangle | null>(null);
  const [like, setLike] = React.useState<LayoutRectangle | null>(null);

  const land = useSharedValue(0); // 0 hidden … 1 landed on the photo
  const fly = useSharedValue(0); // 0 on the photo … 1 at the button
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

  const onPhotoPress = () => {
    const now = Date.now();
    if (now - lastTap.current >= DOUBLE_TAP_MS) {
      lastTap.current = now;
      return;
    }
    lastTap.current = 0;
    // Double-tap only ever likes — it never un-likes.
    if (reduce) {
      // No travel: the heart ignites, holds, dims in place, and the button fills.
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

  // Flight vector from the big heart's centre to the small heart's centre.
  const dx = photo && like ? like.x + SMALL / 2 - (photo.x + photo.width / 2) : 0;
  const dy = photo && row && like ? row.y + like.y + like.height / 2 - (photo.y + photo.height / 2) : 0;

  const bigStyle = useAnimatedStyle(() => {
    const f = Math.min(1, fly.value);
    // It dims as it goes and is out by the time it reaches the button.
    const dim = interpolate(f, [0, ARRIVE_AT], [1, 0.2], "clamp") * (f >= ARRIVE_AT ? 0 : 1);
    const lift = reduce ? 1 : 0.4 + land.value * 0.6;
    const shrink = reduce ? 1 : interpolate(f, [0, 1], [1, SMALL / BIG]);
    return {
      opacity: Math.min(1, land.value * 1.4) * dim,
      transform: [{ translateX: reduce ? 0 : dx * f }, { translateY: reduce ? 0 : dy * f }, { scale: lift * shrink }],
    };
  }, [reduce, dx, dy]);

  return (
    <View className="w-full gap-3">
      <View className="flex-row items-center gap-3">
        <Avatar size="md" source={{ uri: "https://i.pravatar.cc/150?img=12" }} fallback="TV" alt="Tomás Vidal" />
        <View className="flex-1">
          <Text className="text-[15px] font-semibold">tomas.vidal</Text>
          <Text variant="muted" numberOfLines={1}>Laguna de los Tres, Patagonia</Text>
        </View>
        <Icon name="more-horizontal" color="mutedForeground" accessibilityLabel="More options" />
      </View>

      <Pressable
        onPress={onPhotoPress}
        onLayout={(e) => setPhoto(e.nativeEvent.layout)}
        accessibilityRole="image"
        accessibilityLabel="Sunrise over granite peaks above a glacial lake. Double-tap to like."
        className="overflow-hidden rounded-2xl bg-muted"
        style={{ aspectRatio: 4 / 5 }}
      >
        <Image source={{ uri: PHOTO }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
      </Pressable>

      <View className="flex-row items-center gap-4" onLayout={(e) => setRow(e.nativeEvent.layout)}>
        <LikeButton liked={liked} onLikedChange={setLiked} count={1283} onLayout={(e) => setLike(e.nativeEvent.layout)} />
        <View className="min-h-[44px] flex-row items-center gap-1.5">
          <Icon name="message-circle" />
          <Text className="text-[15px] font-semibold tabular-nums">46</Text>
        </View>
        <View className="min-h-[44px] flex-row items-center gap-1.5">
          <Icon name="send" />
          <Text className="text-[15px] font-semibold tabular-nums">12</Text>
        </View>
        <View className="flex-1" />
        <Pressable
          onPress={() => setSaved((s) => !s)}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Save"
          accessibilityState={{ selected: saved }}
          className="min-h-[44px] justify-center"
        >
          <Icon name="bookmark" filled={saved} />
        </Pressable>
      </View>

      <View className="gap-1">
        <Text className="text-[15px] leading-snug">
          <Text className="text-[15px] font-semibold">tomas.vidal </Text>
          First light on Fitz Roy at 5:12am, three hours of switchbacks in the dark. Worth every one.
        </Text>
        <Text className="text-xs text-muted-foreground">2 hours ago</Text>
      </View>

      {/* The big heart flies above the column so it is never clipped by the photo. */}
      {photo ? (
        <View
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={{ position: "absolute", left: photo.x + photo.width / 2 - BIG / 2, top: photo.y + photo.height / 2 - BIG / 2 }}
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
