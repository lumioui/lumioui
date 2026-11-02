import * as React from "react";
import { forwardRef } from "react";
import { PanResponder, View, type ViewProps } from "react-native";
import Animated, {
  useAnimatedReaction,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolateColor,
  type SharedValue,
} from "react-native-reanimated";
import { cn, useHaptic, spring, timing, useReducedMotion, useTheme, usePressAnimation, AnimatedPressable, LitEdge } from "@lumioui/core";
import { Glass } from "../glass";

export interface SegmentedControlOption {
  /** Unique value for this segment. */
  value: string;
  /** Display label. */
  label: string;
  /** Optional icon rendered before the label. */
  icon?: React.ReactNode;
}

export interface SegmentedControlProps extends ViewProps {
  /** Options to display. Can be string[] or SegmentedControlOption[]. */
  options: string[] | SegmentedControlOption[];
  /** Currently selected value. */
  value: string;
  onValueChange: (value: string) => void;
  /** Disable all segments. Default false. */
  disabled?: boolean;
  /** Extra classes for the container. */
  className?: string;
  /** Haptic feedback on segment change. Default "selection". */
  haptic?: "selection" | "light" | false;
  /** Density — "sm" compresses rows for toolbars and card headers. */
  size?: "sm" | "md";
  /** Glass treatment — the track becomes a glass capsule and the
   *  gliding indicator a raised glass pill that refracts what's beneath. */
  glass?: boolean;
  /** Let the finger drag the thumb: it tracks 1:1, ticks the haptic as it
   *  crosses each segment and snaps to the nearest one on release. Default false. */
  draggable?: boolean;
  /** Mirrors the thumb's position (0 to n-1, fractional while gliding) on the
   *  UI thread, so the content below can follow the glide. */
  progress?: SharedValue<number>;
}

function normalizeOptions(options: string[] | SegmentedControlOption[]): SegmentedControlOption[] {
  return options.map((o) =>
    typeof o === "string" ? { value: o, label: o } : o
  );
}

/** The container's p-1 padding (4px each side) — the indicator glides
 * inside the padded track, so segment width excludes it. */
const TRACK_PAD = 4;

/** Dark-mode thumb — the selected segment lifts ABOVE the track (a
 *  lighter translucent white). No semantic token sits lighter than `muted`
 *  in dark, and `bg-background` reads as a hole punched into the track. */
const DARK_THUMB = "rgba(255,255,255,0.14)";
/** The light trail stretches at most this far behind a travelling thumb. */
const TRAIL = 10;
/** Peak brightness of the trail mid-glide; it settles to nothing on landing. */
const TRAIL_LIGHT = 0.45;
/** A drag claims the gesture only after this much sideways travel, so taps stay taps. */
const DRAG_SLOP = 6;

/**
 * SegmentedControl — segmented picker with a gliding indicator.
 *
 * A compact control for choosing between 2-5 mutually exclusive options.
 * The thumb is a light: it glides on spring.indicator with a faint trail
 * stretching behind it that settles as it lands, and each label's ink
 * follows the thumb's coverage on the UI thread. With `draggable` the finger
 * moves the thumb 1:1; `progress` hands its position to the content below.
 */
export const SegmentedControl = forwardRef<React.ElementRef<typeof View>, SegmentedControlProps>(
  function SegmentedControl(
    {
      options: rawOptions,
      value,
      onValueChange,
      disabled,
      className,
      haptic = "selection",
      size = "md",
      glass = false,
      draggable = false,
      progress,
      ...props
    },
    ref
  ) {
    const reduceMotion = useReducedMotion();
    const haptics = useHaptic();
    const { scheme } = useTheme();
    const [w, setW] = React.useState(0);

    const options = React.useMemo(() => normalizeOptions(rawOptions), [rawOptions]);
    const count = Math.max(options.length, 1);
    // Start on the selected segment — the first real layout shouldn't
    // glide in from segment 0.
    const initialIndex = React.useRef(
      Math.max(0, options.findIndex((o) => o.value === value))
    ).current;
    const index = useSharedValue(initialIndex);
    /** Where the thumb is headed — the trail reads its distance from here. */
    const target = useSharedValue(initialIndex);
    /** Indicator entrance — fades in once the track has measured itself. */
    const indicatorVis = useSharedValue(0);

    React.useEffect(() => {
      const i = options.findIndex((o) => o.value === value);
      if (i >= 0) {
        target.value = i;
        // Reduced motion: set directly — the indicator jumps, no glide.
        if (reduceMotion) index.value = i;
        else index.value = withSpring(i, spring.indicator);
      }
    }, [value, index, target, options, reduceMotion]);

    useAnimatedReaction(
      () => index.value,
      (now) => {
        if (progress) progress.value = now;
      },
      [progress]
    );

    // Segment width is static per layout — only the transform animates.
    const segW = Math.max(0, (w - TRACK_PAD * 2) / count);
    const indicatorStyle = useAnimatedStyle(() => ({
      // `left: TRACK_PAD` on the base style supplies the leading inset;
      // translateX only walks between padded segment slots.
      transform: [{ translateX: index.value * segW }],
      opacity: indicatorVis.value,
    }), [segW]);
    // Light trail — lags behind a travelling thumb by its distance from the
    // target, so it stretches mid-glide and settles to nothing on landing.
    const trailStyle = useAnimatedStyle(() => {
      const away = Math.max(-1, Math.min(1, index.value - target.value));
      return {
        opacity: indicatorVis.value * Math.abs(away) * TRAIL_LIGHT,
        transform: [{ translateX: index.value * segW + away * TRAIL }],
      };
    }, [segW]);

    // Drag: the finger writes the thumb directly; React hears only the
    // crossings (haptic tick) and the release (snap + onValueChange).
    const dragFrom = React.useRef(0);
    const dragSlot = React.useRef(0);
    const live = React.useRef({ value, options, onValueChange, segW, count, disabled, haptic });
    React.useEffect(() => {
      live.current = { value, options, onValueChange, segW, count, disabled, haptic };
    });
    const pan = React.useMemo(
      () =>
        PanResponder.create({
          onMoveShouldSetPanResponderCapture: (_, g) =>
            !live.current.disabled && Math.abs(g.dx) > DRAG_SLOP && Math.abs(g.dx) > Math.abs(g.dy),
          onPanResponderGrant: () => {
            const i = Math.max(0, live.current.options.findIndex((o) => o.value === live.current.value));
            dragFrom.current = i;
            dragSlot.current = i;
          },
          onPanResponderMove: (_, g) => {
            const { segW: sw, count: n, haptic: h } = live.current;
            if (sw <= 0) return;
            const next = Math.max(0, Math.min(n - 1, dragFrom.current + g.dx / sw));
            index.value = next;
            target.value = next;
            const slot = Math.round(next);
            if (slot !== dragSlot.current) {
              dragSlot.current = slot;
              if (h) haptics[h === "selection" ? "selection" : "light"]();
            }
          },
          onPanResponderRelease: () => {
            const { options: opts, value: v, onValueChange: change } = live.current;
            const slot = dragSlot.current;
            target.value = slot;
            index.value = withSpring(slot, spring.indicator);
            const picked = opts[slot];
            if (picked && picked.value !== v) change(picked.value);
          },
          onPanResponderTerminate: () => {
            const i = Math.max(0, live.current.options.findIndex((o) => o.value === live.current.value));
            target.value = i;
            index.value = withSpring(i, spring.indicator);
          },
        }),
      [haptics, index, target]
    );

    const track = (
      <View
        ref={ref}
        className={cn(
          // Capsule track and capsule thumb.
          // select-none: on web a mouse drag would otherwise select the
          // labels instead of moving the thumb.
          "w-full select-none flex-row rounded-full p-1",
          !glass && "bg-muted",
          disabled && "opacity-50",
          !glass && className
        )}
        onLayout={(e) => {
          setW(e.nativeEvent.layout.width);
          // Reveal the indicator only once the track knows its width —
          // before that it would sit at a wrong zero-width slot.
          if (indicatorVis.value === 0) {
            indicatorVis.value = reduceMotion ? 1 : withTiming(1, timing.fast);
          }
        }}
        accessibilityRole="tablist"
        {...(draggable ? pan.panHandlers : null)}
        {...props}
      >
        {/* Light trail behind the travelling thumb (flat track only). */}
        {glass ? null : (
          <Animated.View
            pointerEvents="none"
            style={[
              {
                position: "absolute",
                top: TRACK_PAD,
                bottom: TRACK_PAD,
                left: TRACK_PAD,
                width: segW,
                borderRadius: 999,
                ...(scheme === "dark" ? { backgroundColor: DARK_THUMB } : null),
              },
              trailStyle,
            ]}
            className="bg-card"
          />
        )}
        {/* Gliding indicator — a whisper of shadow so it floats above the
            track; raw black is intentional (no shadow token).
            In glass mode the pill is Lumio glass instead of a flat card. */}
        <Animated.View
          style={[
            {
              position: "absolute",
              top: TRACK_PAD,
              bottom: TRACK_PAD,
              left: TRACK_PAD,
              width: segW,
              borderRadius: 999,
              ...(glass
                ? {}
                : {
                    ...(scheme === "dark" ? { backgroundColor: DARK_THUMB } : null),
                    shadowColor: "#000",
                    shadowOpacity: 0.08,
                    shadowRadius: 2,
                    shadowOffset: { width: 0, height: 1 },
                    elevation: 1,
                  }),
            },
            indicatorStyle,
          ]}
          className={glass ? undefined : "bg-card"}
        >
          {glass ? (
            <Glass
              effect="regular"
              sheen={0.5}
              bend={0.3}
              className="absolute inset-0 rounded-full"
            />
          ) : (
            <LitEdge tone="surface" radius={999} />
          )}
        </Animated.View>

        {options.map((option, i) => {
          const active = option.value === value;
          return (
            <Segment
              key={option.value}
              option={option}
              slot={i}
              index={index}
              active={active}
              disabled={disabled}
              haptic={haptic}
              size={size}
              glass={glass}
              onSelect={onValueChange}
            />
          );
        })}
      </View>
    );

    if (!glass) return track;
    return (
      <Glass effect="clear" className={cn("w-full rounded-full", className)}>
        {track}
      </Glass>
    );
  }
);

/** One segment — own component so each can hold a usePressAnimation hook.
 *  The press dip lives on the segment itself, so the whole padded target
 *  (icon + label) responds, not just the label. */
function Segment({
  option,
  slot,
  index,
  active,
  disabled,
  haptic,
  size = "md",
  glass = false,
  onSelect,
}: {
  option: SegmentedControlOption;
  slot: number;
  index: SharedValue<number>;
  active: boolean;
  disabled?: boolean;
  haptic: "selection" | "light" | false;
  size?: "sm" | "md";
  glass?: boolean;
  onSelect: (value: string) => void;
}) {
  const haptics = useHaptic();
  // Opacity dip survives reduced motion (scale is auto-dropped) — keeps
  // press feedback for everyone, mirroring the old label-only dip.
  const press = usePressAnimation({ pressedScale: 0.96, pressedOpacity: 0.7 });
  return (
    <AnimatedPressable
      disabled={disabled}
      onPress={() => {
        if (disabled) return;
        if (haptic) haptics[haptic === "selection" ? "selection" : "light"]();
        onSelect(option.value);
      }}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      style={press.animatedStyle}
      className={cn(
        "flex-1 items-center justify-center rounded-full",
        // sm 36 / md 44 overall (segment + the track's 4pt padding).
        size === "sm" ? "min-h-7 px-2" : "min-h-9 px-3"
      )}
      hitSlop={2}
      accessibilityRole="tab"
      accessibilityState={{ selected: active, disabled }}
      // accessibilityState isn't forwarded to the DOM on web — mirror it.
      aria-selected={active}
      aria-disabled={disabled}
      accessibilityLabel={option.label}
    >
      <SegmentLabel option={option} slot={slot} index={index} glass={glass} />
    </AnimatedPressable>
  );
}

// Label ink rides the gliding thumb (an inverted label is clipped label to the
// moving pill): coverage = 1 − distance between the thumb and this slot, so a
// label darkens as the thumb arrives instead of flipping on tap.
const SegmentLabel = React.memo(function SegmentLabel({
  option,
  slot,
  index,
  glass,
}: {
  option: SegmentedControlOption;
  slot: number;
  index: SharedValue<number>;
  glass: boolean;
}) {
  const { colors } = useTheme();
  // The selected label is ink on the raised thumb — selection is
  // carried by the thumb, never by an accent-tinted label. Unselected
  // labels stay readable (muted on the flat track, full foreground over a
  // photo where grey would vanish).
  const activeColor = colors.foreground;
  const inactiveColor = glass ? colors.foreground : colors.mutedForeground;

  const textStyle = useAnimatedStyle(() => {
    const coverage = Math.max(0, 1 - Math.abs(index.value - slot));
    return { color: interpolateColor(coverage, [0, 1], [inactiveColor, activeColor]) };
  }, [slot, inactiveColor, activeColor]);
  const activeIconStyle = useAnimatedStyle(() => ({
    opacity: Math.max(0, 1 - Math.abs(index.value - slot)),
  }), [slot]);

  // Option icons are ReactNodes: stack the consumer's glyph under a
  // foreground copy (cloneElement) and crossfade on the same coverage.
  const icon = React.isValidElement(option.icon) ? (
    <View>
      {option.icon}
      <Animated.View style={activeIconStyle} pointerEvents="none" className="absolute inset-0">
        {React.cloneElement(option.icon as React.ReactElement<{ color?: string }>, { color: "foreground" })}
      </Animated.View>
    </View>
  ) : (
    option.icon
  );

  return (
    // Icon sits beside the label so icon
    // segments keep the same 44pt control height as text-only ones.
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }} className="gap-1.5">
      {icon}
      <Animated.Text style={textStyle} className="text-sm font-semibold leading-tight" numberOfLines={1}>
        {option.label}
      </Animated.Text>
    </View>
  );
});

SegmentedControl.displayName = "SegmentedControl";
