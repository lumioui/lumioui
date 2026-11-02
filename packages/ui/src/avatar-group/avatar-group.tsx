import * as React from "react";
import { forwardRef } from "react";
import { View, type ViewProps, type ImageSourcePropType } from "react-native";

import Animated, {
  Easing,
  FadeOut,
  LinearTransition,
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import {
  cn,
  ease,
  rowDelay,
  spring,
  timing,
  useHaptic,
  usePressAnimation,
  useReducedMotion,
  AnimatedPressable,
  Sheen,
} from "@lumioui/core";
import { Avatar } from "../avatar";

export interface AvatarGroupItem {
  /** Stable identity for the item — used as the React key when provided.
   *  Items with an id that arrive after mount play the join moment. */
  id?: string | number;
  /** Image source — falls back to initials. */
  source?: ImageSourcePropType;
  /** Fallback initials when no image. */
  fallback?: string;
  /** Accessibility label — defaults to the fallback text. */
  alt?: string;
}

export interface AvatarGroupProps extends Omit<ViewProps, "className"> {
  items: AvatarGroupItem[];
  /** Max avatars rendered before the "+N" overflow bubble. Default 4. */
  max?: number;
  /** Avatar size. Default "md". */
  size?: "sm" | "md" | "lg";
  /** Fired when an avatar is tapped — makes avatars pressable. */
  onItemPress?: (item: AvatarGroupItem, index: number) => void;
  /** Makes the "+N" bubble tappable (open the full roster). */
  onOverflowPress?: (items: AvatarGroupItem[]) => void;
  /** Switch-on entrance on mount (dim → on, 40ms apart). Default true. */
  animate?: boolean;
  /** Haptic on taps. Default "light". */
  haptic?: "light" | "selection" | false;
  /**
   * Classes for the cut-out ring around each avatar. Match it to the
   * surface the stack sits on. Default `border-card` (rows, cards).
   */
  ringClassName?: string;
  className?: string;
}

/** Overlap per size (px) — negative margin on each item after the first. */
const OVERLAP = { sm: 10, md: 12, lg: 16 } as const;
const OVERFLOW_TEXT = { sm: "text-xs", md: "text-sm", lg: "text-base" } as const;
/** Avatar diameter per size — the +N bubble adds the 2px ring on each side
 *  so it lines up with the ringed avatars beside it. */
const DIAMETER = { sm: 32, md: 40, lg: 56 } as const;
/** Faces wait at half brightness before they switch on — readable, not lit. */
const MOUNT_DIM = 0.5;
/** A joining face ignites from this scale (swap grammar, no spark). */
const JOIN_FROM = 0.96;
/** The +N count travels this far as it swaps — up when it grows, down when it shrinks. */
const COUNT_TRAVEL = 4;

const igniteTiming = { ...timing.fast, easing: Easing.bezier(...ease.out) };
const dimTiming = { ...timing.recede, easing: Easing.bezier(...ease.in) };

/**
 * AvatarGroup — overlapping avatar stack with a cut-out ring per avatar and
 * a "+N" overflow bubble. Faces switch on in order on mount. When someone
 * joins, their face ignites in its slot while the others slide over, the
 * count swaps in place and one light pass crosses the stack.
 *   <AvatarGroup items={team} max={4} onOverflowPress={showRoster} />
 * Expo Go compatible.
 */
export const AvatarGroup = forwardRef<React.ElementRef<typeof View>, AvatarGroupProps>(
  function AvatarGroup(
    {
      items,
      max = 4,
      size = "md",
      onItemPress,
      onOverflowPress,
      animate = true,
      haptic = "light",
      ringClassName,
      className,
      ...props
    },
    ref,
  ) {
    const haptics = useHaptic();
    const reduce = useReducedMotion();
    const visible = items.slice(0, Math.max(0, max));
    const overflow = items.slice(Math.max(0, max));
    const overlap = OVERLAP[size];

    // Who was here before — anyone new with an id is a join.
    const seen = React.useRef<Set<string | number> | null>(null);
    if (seen.current === null) {
      seen.current = new Set(items.flatMap((it) => (it.id != null ? [it.id] : [])));
    }
    const joinedIds = items.filter((it) => it.id != null && !seen.current!.has(it.id)).map((it) => it.id!);
    const joinKey = joinedIds.join("|");
    const [sheen, setSheen] = React.useState(0);
    const idKey = items.map((it) => it.id ?? "").join("|");
    React.useEffect(() => {
      // Track the current roster, so someone who leaves and comes back joins again.
      seen.current = new Set(items.flatMap((it) => (it.id != null ? [it.id] : [])));
      if (joinKey) setSheen((n) => n + 1);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [idKey]);

    const layout = reduce ? undefined : LinearTransition.springify().damping(spring.layout.damping).stiffness(spring.layout.stiffness);

    return (
      <View
        ref={ref}
        className={cn("flex-row items-center", className)}
        accessibilityLabel={`${items.length} people`}
        {...props}
      >
        {visible.map((item, i) => (
          <GroupAvatar
            // alt/fallback labels collide easily (two "JD"s, two users with
            // no label) — prefer a caller-supplied id, else the position.
            key={item.id ?? `avatar-${i}`}
            item={item}
            index={i}
            size={size}
            overlap={i === 0 ? 0 : overlap}
            zIndex={items.length - i}
            animate={animate}
            joined={item.id != null && joinedIds.includes(item.id)}
            layout={layout}
            ring={ringClassName}
            onPress={
              onItemPress
                ? () => {
                    if (haptic) haptics[haptic]();
                    onItemPress(item, i);
                  }
                : undefined
            }
          />
        ))}
        {overflow.length > 0 ? (
          <OverflowBubble
            count={overflow.length}
            size={size}
            overlap={visible.length > 0 ? overlap : 0}
            animate={animate}
            layout={layout}
            ring={ringClassName}
            delayIndex={visible.length}
            onPress={
              onOverflowPress
                ? () => {
                    if (haptic) haptics[haptic]();
                    onOverflowPress(overflow);
                  }
                : undefined
            }
          />
        ) : null}
        {/* One light pass across the ring row when someone joins. */}
        <View pointerEvents="none" className="absolute inset-0 overflow-hidden rounded-full">
          <Sheen run={sheen} />
        </View>
      </View>
    );
  },
);

/** Arrival — on mount a face waits dim and switches on in row order; a face
 *  that joins later ignites in its slot (opacity + a 0.96 → 1 swap). */
function useArrive(index: number, animate: boolean, joined: boolean) {
  const reduce = useReducedMotion();
  const still = !animate;
  const lit = useSharedValue(joined ? 0 : still ? 1 : MOUNT_DIM);
  const grow = useSharedValue(joined && !reduce ? JOIN_FROM : 1);
  React.useEffect(() => {
    if (joined) {
      lit.value = withTiming(1, igniteTiming);
      if (!reduce) grow.value = withSpring(1, spring.swap);
      return;
    }
    if (still) return;
    lit.value = withDelay(rowDelay(index), withTiming(1, igniteTiming));
    // Arrival runs once; later index changes are layout moves, not arrivals.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return useAnimatedStyle(() => ({
    opacity: lit.value,
    transform: [{ scale: grow.value }],
  }));
}

/** Cut-out ring — card-coloured by default because stacks live on rows and
 *  cards; a canvas-coloured ring read as a grey halo on white surfaces. */
const ringBase = "overflow-hidden rounded-full border-2 border-card";

type Layout = React.ComponentProps<typeof Animated.View>["layout"];

const GroupAvatar = React.memo(function GroupAvatar({
  item,
  index,
  size,
  overlap,
  zIndex,
  animate,
  joined,
  layout,
  ring,
  onPress,
}: {
  item: AvatarGroupItem;
  index: number;
  size: "sm" | "md" | "lg";
  overlap: number;
  zIndex: number;
  animate: boolean;
  joined: boolean;
  layout: Layout;
  ring?: string;
  onPress?: () => void;
}) {
  const ringClass = cn(ringBase, ring);
  const press = usePressAnimation({ pressedScale: 0.9 });
  const arriveStyle = useArrive(index, animate, joined);
  const style = [{ marginLeft: -overlap, zIndex }, arriveStyle];
  const exiting = FadeOut.duration(timing.recede.duration);

  const avatar = (
    <Avatar
      size={size}
      source={item.source}
      fallback={item.fallback}
      alt={item.alt ?? item.fallback ?? "Avatar"}
      // The ring wrapper owns a11y — the inner avatar is presentational.
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );

  if (!onPress) {
    return (
      <Animated.View style={style} layout={layout} exiting={exiting} className={ringClass}>
        {avatar}
      </Animated.View>
    );
  }

  // The slot carries arrival + layout moves; the pressable inside carries the press dip.
  return (
    <Animated.View style={style} layout={layout} exiting={exiting}>
      <AnimatedPressable
        onPress={onPress}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        style={press.animatedStyle}
        hitSlop={4}
        className={ringClass}
        accessibilityRole="button"
        accessibilityLabel={item.alt ?? item.fallback ?? "Avatar"}
      >
        {avatar}
      </AnimatedPressable>
    </Animated.View>
  );
});

/** "+N" that swaps in place: the old count dims and drifts, the new one
 *  ignites from 4px on the side the count moved. */
function SwapCount({ count, className }: { count: number; className: string }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = React.useState(count);
  const [out, setOut] = React.useState<number | null>(null);
  if (count !== shown) {
    setOut(shown);
    setShown(count);
  }
  const dir = out == null ? 0 : shown > out ? 1 : -1;
  const lit = useSharedValue(1);
  const leave = useSharedValue(0);
  const mounted = React.useRef(false);
  React.useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    lit.value = 0;
    lit.value = withTiming(1, igniteTiming);
    leave.value = 1;
    leave.value = withTiming(0, dimTiming);
  }, [shown, lit, leave]);
  const travel = reduce ? 0 : COUNT_TRAVEL * dir;
  const inStyle = useAnimatedStyle(() => ({
    opacity: lit.value,
    transform: [{ translateY: (1 - lit.value) * travel }],
  }));
  const outStyle = useAnimatedStyle(() => ({
    opacity: leave.value,
    transform: [{ translateY: -(1 - leave.value) * travel * 0.5 }],
  }));
  return (
    <View className="items-center justify-center">
      <Animated.Text className={className} style={inStyle} allowFontScaling={false}>
        {`+${shown}`}
      </Animated.Text>
      {out != null ? (
        <Animated.Text
          className={cn("absolute", className)}
          style={outStyle}
          allowFontScaling={false}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {`+${out}`}
        </Animated.Text>
      ) : null}
    </View>
  );
}

const OverflowBubble = React.memo(function OverflowBubble({
  count,
  size,
  overlap,
  animate,
  layout,
  ring,
  delayIndex,
  onPress,
}: {
  count: number;
  size: "sm" | "md" | "lg";
  overlap: number;
  animate: boolean;
  layout: Layout;
  ring?: string;
  delayIndex: number;
  onPress?: () => void;
}) {
  const ringClass = cn(ringBase, ring);
  const press = usePressAnimation({ pressedScale: 0.9 });
  const arriveStyle = useArrive(delayIndex, animate, false);
  const edge = DIAMETER[size] + 4;
  const style = [{ marginLeft: -overlap, zIndex: 0, width: edge, height: edge }, arriveStyle];

  const content = (
    <SwapCount count={count} className={cn("font-semibold leading-none text-muted-foreground", OVERFLOW_TEXT[size])} />
  );

  if (!onPress) {
    return (
      <Animated.View
        style={style}
        layout={layout}
        className={cn(ringClass, "items-center justify-center bg-muted")}
        accessibilityRole="text"
        accessibilityLabel={`${count} more`}
      >
        {content}
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[{ marginLeft: -overlap, zIndex: 0 }, arriveStyle]} layout={layout}>
      <AnimatedPressable
        onPress={onPress}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        style={[{ width: edge, height: edge }, press.animatedStyle]}
        hitSlop={6}
        className={cn(ringClass, "items-center justify-center bg-muted")}
        accessibilityRole="button"
        accessibilityLabel={`${count} more — show everyone`}
      >
        {content}
      </AnimatedPressable>
    </Animated.View>
  );
});

AvatarGroup.displayName = "AvatarGroup";
