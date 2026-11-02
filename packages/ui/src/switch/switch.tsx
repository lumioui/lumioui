import * as React from "react";
import { forwardRef } from "react";
import { Pressable, View, Text, type PressableProps } from "react-native";
import Animated, {
  Easing,
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
  interpolateColor,
} from "react-native-reanimated";
import { cn, ease, useHaptic, spring, tempo, timing, useTheme, useReducedMotion, usePressAnimation, LitEdge } from "@lumioui/core";

export interface SwitchProps extends Omit<PressableProps, "onPress" | "children"> {
  /** Whether the switch is on. */
  checked: boolean;
  /** Called when the user toggles the switch. */
  onCheckedChange: (checked: boolean) => void;
  /** Disable interaction. */
  disabled?: boolean;
  /** Extra classes for the outer wrapper. */
  className?: string;
  /** Haptic on toggle — default "selection". Set false to disable. */
  haptic?: "selection" | "light" | false;
  /** Optional label rendered to the left, switch trailing. */
  label?: string;
  /** Optional icon rendered inside the thumb when on. */
  iconOn?: React.ReactNode;
}

// 51×31 track, 27pt thumb — a 2pt inset all round.
const TRACK_W = 51;
const TRACK_H = 31;
const THUMB = 27;
const PAD = (TRACK_H - THUMB) / 2;
/** Disabled flicker — the thumb kicks this far toward the side it can't
 *  reach and releases into spring.shake. One flicker, never a loop. */
const FLICKER_KICK = 4;
/** Light comes on at ignite pace — the knob colour and the fill's brightness. */
const LIGHT_ON = { duration: timing.fast.duration, easing: Easing.bezier(...ease.out) };
/** Light goes out faster than it came on — the track dims in place. */
const LIGHT_OFF = { duration: timing.recede.duration, easing: Easing.bezier(...ease.in) };
/** While held, the fill pre-lights this far toward the destination. */
const PRE_LIGHT = 0.15;
/** The thumb's lit edge flares as it lands — spring.switch settles by ~tempo.move. */
const FLARE_AT = tempo.move;
/** Thumb travel from the off side to the on side. */
const TRAVEL = TRACK_W - THUMB - PAD * 2;

/** The unlit track. The input token sits ~1.3:1 on a card, so the off state
 *  would rest on the thumb's shadow alone; these neutral greys hold ~2:1
 *  against the card in each scheme while staying unlit. */
const TRACK_OFF_LIGHT = "#C2C2C8";
const TRACK_OFF_DARK = "#3C3C43";
/** Disabled dims the whole control to this — still readable as a switch. */
const DISABLED_DIM = 0.55;

/**
 * Switch — LumioUI's primary on/off control, switched on literally.
 *
 * The accent fill grows from the off side behind the thumb on
 * `spring.switch`, so the thumb pulls the light across the track; the
 * thumb's lit edge flares as it lands, then settles. Off, the light goes out
 * in place over `timing.recede` — faster than it came on. While held the
 * thumb squishes, leans toward the destination and the fill pre-lights 15%.
 * A tap on a disabled switch flickers. Reduced motion: colour only.
 *
 * For a button-style toggle, use the `Toggle` component instead.
 */
export const Switch = forwardRef<React.ElementRef<typeof Pressable>, SwitchProps>(
  function Switch(
    { checked, onCheckedChange, disabled, className, haptic = "selection", label, iconOn, ...props },
    ref
  ) {
    const { colors, scheme } = useTheme();
    // A switched-on control wears its accent's foreground: white on ink and
    // deep hues, ink on bright ones (amber, orange, coral, lime, mint, sky).
    const onKnob = colors.primaryForeground;
    const trackOff = scheme === "dark" ? TRACK_OFF_DARK : TRACK_OFF_LIGHT;
    const haptics = useHaptic();
    const reduceMotion = useReducedMotion();
    const progress = useSharedValue(checked ? 1 : 0);
    /** Colour state 0 → 1 — timed apart from the thumb's spring. */
    const tint = useSharedValue(checked ? 1 : 0);
    const pressed = useSharedValue(0);
    const shakeX = useSharedValue(0);
    /** Lit-edge flare on the thumb as it lands on the on side. */
    const flare = useSharedValue(0);
    // Row press feedback for the label variant — opacity dip only.
    const rowPress = usePressAnimation({ pressedScale: 1, pressedOpacity: 0.65 });

    const mounted = React.useRef(false);
    React.useEffect(() => {
      // Light on at ignite pace, out at dim pace; reduced motion snaps the travel.
      tint.value = withTiming(checked ? 1 : 0, checked ? LIGHT_ON : LIGHT_OFF);
      if (reduceMotion) progress.value = checked ? 1 : 0;
      else progress.value = withSpring(checked ? 1 : 0, spring.switch);
      // The flare marks a switch-on the user made — not the first render.
      if (checked && mounted.current) {
        flare.value = withDelay(
          reduceMotion ? 0 : FLARE_AT,
          withSequence(withTiming(1, timing.instant), withTiming(0, LIGHT_ON))
        );
      } else if (!checked) {
        flare.value = withTiming(0, timing.instant);
      }
      mounted.current = true;
    }, [checked, progress, tint, flare, reduceMotion]);

    // Disabled flicker — a tap on a disabled switch kicks the thumb toward
    // the side it can't reach, then releases. Paired with a warning haptic.
    const triggerFlicker = React.useCallback(() => {
      if (reduceMotion) return;
      shakeX.value = checked ? -FLICKER_KICK : FLICKER_KICK;
      shakeX.value = withSpring(0, spring.shake);
    }, [shakeX, checked, reduceMotion]);

    // The light: a full-track pill whose leading end rides the thumb's far
    // edge, so it grows out of the off side and the thumb pulls it across.
    const fillStyle = useAnimatedStyle(() => {
      const reach = PAD + progress.value * TRAVEL + THUMB + PAD;
      // Held: pre-light toward the destination (on → brighter, off → dimmer).
      const toward = progress.value < 0.5 ? 1 : -1;
      return {
        opacity: Math.min(1, Math.max(0, tint.value + pressed.value * PRE_LIGHT * toward)),
        transform: [{ translateX: reach - TRACK_W }],
      };
    });

    const flareStyle = useAnimatedStyle(() => ({ opacity: flare.value }));

    const thumbStyle = useAnimatedStyle(() => {
      const base = PAD + progress.value * TRAVEL;
      // While held, squish the thumb and lean it toward the destination.
      const squish = 1 - pressed.value * 0.12;
      const stretch = 1 + pressed.value * 0.18;
      const lean = pressed.value * (progress.value < 0.5 ? 3 : -3);
      return {
        // White off; on, the accent's foreground (see onKnob).
        backgroundColor: interpolateColor(tint.value, [0, 1], ["#FFFFFF", onKnob]),
        transform: [
          { translateX: base + lean + shakeX.value },
          { scaleX: stretch },
          { scaleY: squish },
        ],
      };
    });

    // iconOn ignites with the colour and blooms as the thumb lands.
    const thumbIconStyle = useAnimatedStyle(() => ({
      opacity: tint.value,
      transform: [{ scale: reduceMotion ? 1 : 0.7 + Math.min(progress.value, 1) * 0.3 }],
    }));

    const handlePress = () => {
      if (disabled) {
        // One flicker with the warning, together on release.
        triggerFlicker();
        haptics.warning();
        return;
      }
      if (haptic) haptics[haptic === "selection" ? "selection" : "light"]();
      onCheckedChange(!checked);
    };

    const handlePressIn = () => {
      if (disabled) return;
      // Squish is scale travel — skip it under reduced motion.
      if (reduceMotion) return;
      pressed.value = withSpring(1, spring.press);
    };

    const handlePressOut = () => {
      if (disabled || reduceMotion) return;
      pressed.value = withSpring(0, spring.press);
    };

    const track = (
      <Animated.View
        style={[
          {
            width: TRACK_W,
            height: TRACK_H,
            borderRadius: TRACK_H / 2,
            overflow: "hidden",
            // The unlit track — see TRACK_OFF_LIGHT.
            backgroundColor: trackOff,
            opacity: disabled ? DISABLED_DIM : 1,
            // Physical-thumb drop shadow — raw black reads correctly under
            // both schemes, so not a theme token.
            shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 2, shadowOffset: { width: 0, height: 1 },
            elevation: 1,
          },
        ]}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: "absolute",
              top: 0,
              left: 0,
              width: TRACK_W,
              height: TRACK_H,
              borderRadius: TRACK_H / 2,
              backgroundColor: colors.primary,
            },
            fillStyle,
          ]}
        />
        {/* Landing flare — the lit edge at full for an instant, then settled. */}
        <Animated.View
          pointerEvents="none"
          style={[{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }, flareStyle]}
        >
          <LitEdge tone="fill" radius={TRACK_H / 2} strength={2} />
        </Animated.View>
        <Animated.View
          style={[
            {
              width: THUMB,
              height: THUMB,
              borderRadius: THUMB / 2,
              // Knob colour rides thumbStyle (white off, the accent's foreground on).
              position: "absolute",
              top: PAD,
              alignItems: "center",
              justifyContent: "center",
              // Same physical-shadow exception as the track above.
              shadowColor: "#000",
              shadowOpacity: 0.2,
              shadowRadius: 3,
              shadowOffset: { width: 0, height: 1 },
              elevation: 3,
            },
            thumbStyle,
          ]}
        >
          <LitEdge tone="surface" radius={THUMB / 2} />
          {iconOn ? (
            <Animated.View style={thumbIconStyle} pointerEvents="none">
              {iconOn}
            </Animated.View>
          ) : null}
        </Animated.View>
      </Animated.View>
    );

    const switchElement = (
      <Pressable
        ref={ref}
        // Deliberately never disabled at the responder level — a tap on a
        // disabled switch must still fire so it can flicker + warn.
        // a11y still reports disabled via accessibilityState below.
        disabled={false}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="switch"
        accessibilityState={{ checked, disabled: disabled ?? false }}
        aria-checked={checked}
        aria-disabled={disabled ?? false}
        aria-label={label}
        hitSlop={8}
        {...props}
      >
        {track}
      </Pressable>
    );

    // Label on the left, switch on the right.
    // The outer row owns the press and the single switch node — the track
    // renders inert so haptics and screen-reader nodes don't double up.
    if (label) {
      return (
        <Pressable
          ref={ref}
          onPress={handlePress}
          onPressIn={() => {
            handlePressIn();
            rowPress.onPressIn();
          }}
          onPressOut={() => {
            handlePressOut();
            rowPress.onPressOut();
          }}
          hitSlop={4}
          className={cn("py-2", className)}
          accessibilityRole="switch"
          accessibilityState={{ checked, disabled: disabled ?? false }}
          aria-checked={checked}
          aria-disabled={disabled ?? false}
          aria-label={label}
          {...props}
        >
          {/* Row dip — the whole row confirms contact, like a settings row. */}
          <Animated.View
            style={rowPress.animatedStyle}
            className="flex-1 flex-row items-center justify-between"
          >
            <Text className={cn("text-base leading-tight text-foreground", disabled && "opacity-50")}>{label}</Text>
            <View pointerEvents="none">{track}</View>
          </Animated.View>
        </Pressable>
      );
    }

    return (
      <View className={cn(className)}>
        {switchElement}
      </View>
    );
  }
);

Switch.displayName = "Switch";

