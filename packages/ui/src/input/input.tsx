import * as React from "react";
import { forwardRef, useEffect, useId, useRef } from "react";
import { Platform, TextInput, View, Text, type TextInputProps } from "react-native";
import Animated, {
  Easing,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  interpolateColor,
} from "react-native-reanimated";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { cn, ease, spring, timing, useReducedMotion, useTheme, AnimatedPath, AnimatedTextInput } from "@lumioui/core";
import { Glass } from "../glass";

/** Lumio check on the 24 grid — short stroke, long stroke (length ≈17.7). */
const SUCCESS_PATH = "M6 12.5l4 4 8-9";
const CHECK_LEN = 18;

/** Error flicker — the field kicks this far and releases into
 *  spring.shake: one decaying tremor, never a loop. */
const FLICKER_KICK = 4;

/** Field state colour shift — border + halo (focus, error and success all
 *  crossfade, nothing snaps). Quick enough to answer a tap into the field. */
const STATE_COLOR = { duration: timing.fast.duration, easing: Easing.bezier(...ease.inOut) };

/** Message line — the helper/error text ignites with a small drop from the
 *  field above it. */
const MESSAGE_IN = { duration: timing.fast.duration, easing: Easing.bezier(...ease.out) };
const MESSAGE_DROP = 3;

/** Success check draw — 240ms on the ignite curve, no beat in front. */
const CHECK_DRAW = { duration: 240, easing: Easing.bezier(...ease.out) };

/** Keyboard focus halo (web only) — a soft 2px ring just outside the border. */
const HALO_OPACITY = 0.35;

/** Focus light — the accent pours in from the field's top edge and fades out
 *  by this share of its height; peak alpha at the edge. */
const FOCUS_LIGHT_REACH = 0.6;
const FOCUS_LIGHT_ALPHA = 0.12;

/** Success: the border holds the success colour this long after the check
 *  lands, then settles back so the field calms down (act, hold, resolve).
 *  The drawn check and the lit bottom edge stay as the settled result. */
const SUCCESS_HOLD = 700;
/** The charge line is the field's own bottom edge lighting up, 2pt tall,
 *  clipped by the field's corners. Nothing is painted at charge 0. */
const BASELINE_HEIGHT = 2;

/*
 * Keyboard modality (web) — the halo is for people tabbing through a form, so
 * it only shows when focus arrived from the keyboard. One pair of document
 * listeners, installed on first use.
 */
let keyboardModality = false;
let modalityInstalled = false;
type ModalityTarget = {
  addEventListener: (type: string, fn: (e: { key?: string }) => void, capture?: boolean) => void;
};
function installModality() {
  if (modalityInstalled || Platform.OS !== "web") return;
  const doc = (globalThis as { document?: ModalityTarget }).document;
  if (!doc) return;
  modalityInstalled = true;
  doc.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Tab") keyboardModality = true;
    },
    true
  );
  doc.addEventListener(
    "pointerdown",
    () => {
      keyboardModality = false;
    },
    true
  );
}

export interface InputProps extends Omit<TextInputProps, "className"> {
  /** Visible label above the field. */
  label?: string;
  /** Helper text below the field. */
  helper?: string;
  /** Error message — turns the field red, flickers it, and announces to screen readers. */
  error?: string;
  /** Shows an animated success check on the right edge. */
  success?: boolean;
  /** Icon node rendered inside the left edge of the field. */
  leftIcon?: React.ReactNode;
  /** Icon node rendered inside the right edge (hidden while the success check shows). */
  rightIcon?: React.ReactNode;
  /** Reserve one helper line even when empty — prevents layout shift on error. */
  reserveHelperLine?: boolean;
  /** Field density — "sm" for toolbars and dense forms, "md" (default) for
   *  full-size fields. */
  size?: "sm" | "md";
  /** NativeWind classes for the input element. */
  className?: string;
  /** Classes for the outer wrapper. */
  containerClassName?: string;
  /** Glass field — capsule material instead of the flat fill. */
  glass?: boolean;
  /** 0–1: how close the value is to valid (e.g. postcode chars / 6). Shows a
   *  2px baseline under the text that charges as you type; omit for none. */
  validity?: number;
}

/**
 * Input — label + helper + error states, error flicker, drawn success check,
 * icon slots. Minimum 44pt/48dp height per platform guidelines.
 *
 * Light follows input: focus lights the field from above (a 1px lit top edge
 * and a fall of accent light over timing.fast) while the label goes from
 * muted to ink. With `validity`, a 2px baseline fills left to right on
 * spring.glide as the value nears valid; at valid it completes, retints to
 * success and the check draws (240ms). An error flickers once and dims the
 * baseline back. The halo shows for keyboard focus on web only. None of it
 * changes the field's dimensions.
 */
export const Input = forwardRef<React.ElementRef<typeof TextInput>, InputProps>(
  function Input(
    {
      label,
      helper,
      error,
      success = false,
      leftIcon,
      rightIcon,
      size = "md",
      reserveHelperLine = false,
      className,
      containerClassName,
      glass = false,
      validity,
      editable = true,
      onFocus,
      onBlur,
      style,
      ...props
    },
    ref
  ) {
    const { colors, scheme } = useTheme();
    // Light from above only reads as light when the accent is brighter than
    // the field (dark scheme, or a bright accent). Ink on a white field would
    // be a dark lip and a grey wash: recessed, the opposite of lit. There the
    // border and label igniting carry focus on their own.
    const litFromAbove = scheme === "dark" || colors.primaryForeground !== "#FFFFFF";
    const reducedMotion = useReducedMotion();
    const describedBy = error ?? helper;
    // Built-in label gets a stable nativeID so the field can point back at
    // it via accessibilityLabelledBy (Android) / aria-labelledby (web) —
    // the same path Form.Label uses when wired through nativeID.
    const autoId = useId();
    const labelId = `${autoId}-label`;

    useEffect(installModality, []);
    const gradId = `${autoId.replace(/[^a-zA-Z0-9]/g, "")}light`;

    const translateX = useSharedValue(0);
    /** Keyboard focus (web) — the only thing that raises the halo. */
    const kbdT = useSharedValue(0);
    /** Baseline charge 0–1 — validity, completed by success. */
    const chargeTarget = success && !error ? 1 : Math.min(1, Math.max(0, validity ?? 0));
    const charge = useSharedValue(chargeTarget);
    const hasBaseline = validity !== undefined;
    /** Focus progression — drives the border color glide and halo ring. */
    const focusT = useSharedValue(0);
    /** Error/helper text entrance: 0 hidden → 1 visible. */
    const msgT = useSharedValue(error || helper ? 1 : 0);
    /** Error colour progression — border + halo crossfade to destructive. */
    const errT = useSharedValue(error ? 1 : 0);
    /** Success colour progression — border crossfades to success. */
    const okT = useSharedValue(success && !error ? 1 : 0);
    /** Success border only: lights with okT, then settles after the hold. */
    const okBorderT = useSharedValue(0);
    /** Success check draw progress. */
    const checkDraw = useSharedValue(success ? 1 : 0);
    const hadError = useRef(!!error);
    const showSuccess = success && !error;
    /** Which message kind is on the line — a helper → error swap re-runs the
     *  entrance so the error ignites fresh rather than recolouring in place. */
    const msgKind = error ? "error" : helper ? "helper" : "none";
    const prevKind = useRef(msgKind);

    useEffect(() => {
      if (error && !hadError.current) {
        if (!reducedMotion) {
          // One flicker: kick, then the flicker spring rings it out.
          translateX.value = FLICKER_KICK;
          translateX.value = withSpring(0, spring.shake);
        }
        hadError.current = true;
      } else if (!error) {
        hadError.current = false;
      }
      errT.value = reducedMotion ? (error ? 1 : 0) : withTiming(error ? 1 : 0, STATE_COLOR);
  }, [error, errT, translateX, reducedMotion]);

    useEffect(() => {
      const changed = prevKind.current !== msgKind;
      prevKind.current = msgKind;
      const target = msgKind === "none" ? 0 : 1;
      if (reducedMotion) {
        msgT.value = target;
        return;
      }
      // A new message kind ignites again; leaving dims fast (exits faster
      // than entrances).
      if (changed && target === 1) msgT.value = 0;
      msgT.value =
        target === 1
          ? withTiming(1, MESSAGE_IN)
          : withTiming(0, { duration: timing.recede.duration, easing: Easing.bezier(...ease.in) });
    }, [msgKind, msgT, reducedMotion]);

    useEffect(() => {
      const target = success && !error ? 1 : 0;
      okT.value = reducedMotion ? target : withTiming(target, STATE_COLOR);
      okBorderT.value = target === 0 || reducedMotion
        ? 0
        : withSequence(withTiming(1, STATE_COLOR), withDelay(SUCCESS_HOLD, withTiming(0, STATE_COLOR)));
      // The check only ever draws on — clearing resets it unseen (the slot
      // unmounts), so a re-success always draws from zero.
      checkDraw.value = target === 0 || reducedMotion ? target : withTiming(1, CHECK_DRAW);
    }, [success, error, checkDraw, okT, okBorderT, reducedMotion]);

    useEffect(() => {
      charge.value = reducedMotion ? chargeTarget : withSpring(chargeTarget, spring.glide);
    }, [chargeTarget, charge, reducedMotion]);

    const fieldAnim = useAnimatedStyle(() => ({
      transform: [{ translateX: translateX.value }],
    }));

    // Border color glides input → ring on focus; error/success win outright.
    // Lives on the input itself (the flicker wrapper has no border).
    // Every state crossfades: input → ring on focus, then success and error
    // layered on top (error wins), each on its own timed progression.
    const borderStyle = useAnimatedStyle(() => {
      const focusC = interpolateColor(focusT.value, [0, 1], [colors.input, colors.ring]);
      const okC = interpolateColor(okBorderT.value, [0, 1], [focusC, colors.success]);
      return { borderColor: interpolateColor(errT.value, [0, 1], [okC, colors.destructive]) };
    });

    // Halo — a faint 2px ring just outside the border, keyboard focus only.
    const haloStyle = useAnimatedStyle(() => ({
      opacity: kbdT.value * HALO_OPACITY,
      borderColor: interpolateColor(errT.value, [0, 1], [colors.ring, colors.destructive]),
    }));

    // Light from above — the lit top edge and its fall-off follow focus.
    const lightStyle = useAnimatedStyle(() => ({ opacity: litFromAbove ? focusT.value * (1 - errT.value) : 0 }));

    // Label: muted at rest, ink while the field is lit, red with an error.
    const labelStyle = useAnimatedStyle(() => ({
      color: interpolateColor(
        errT.value,
        [0, 1],
        [interpolateColor(focusT.value, [0, 1], [colors.mutedForeground, colors.foreground]), colors.destructive]
      ),
    }));

    // Baseline — fills from the leading edge; accent → success at valid; an
    // error dims it back.
    const baselineStyle = useAnimatedStyle(() => ({
      // Off in error: the red border and message carry it, no two-tone edge.
      opacity: 1 - errT.value,
      backgroundColor: interpolateColor(okT.value, [0, 1], [colors.primary, colors.success]),
      transform: [{ scaleX: Math.max(0.0001, charge.value) }],
    }));

    const msgStyle = useAnimatedStyle(() => ({
      opacity: msgT.value,
      transform: [{ translateY: reducedMotion ? 0 : (1 - msgT.value) * -MESSAGE_DROP }],
    }));

    const checkProps = useAnimatedProps(() => ({
      strokeDashoffset: (1 - checkDraw.value) * CHECK_LEN,
    }));

    const showRight = !!rightIcon || showSuccess;
    const message = error ?? helper;
    const showLine = !!message || reserveHelperLine;
    // Reserved line: keep the last text painted while it fades out, so a
    // cleared error recedes (exit) instead of blinking away. Hidden from
    // screen readers — it is no longer the field's state.
    const lastMessage = useRef<{ text: string; isError: boolean } | null>(null);
    if (message) lastMessage.current = { text: message, isError: !!error };
    const stale = !message && reserveHelperLine ? lastMessage.current : null;

    return (
      <View className={cn("gap-1.5", containerClassName)}>
        {label ? (
          <Animated.Text
            nativeID={labelId}
            className="text-sm font-medium"
            style={labelStyle}
            accessibilityRole="text"
          >
            {label}
          </Animated.Text>
        ) : null}
        {/* Disabled dim goes on the field wrapper — on web the input's own
            opacity-50 loses to a placeholder-shown preflight rule. */}
        <Animated.View
          style={fieldAnim}
          className={cn("justify-center", glass ? "rounded-full" : "rounded-xl", !editable && "opacity-50")}
        >
          {glass ? (
            <Glass
              effect="regular"
              className="absolute inset-0 rounded-full"
              pointerEvents="none"
            />
          ) : null}
          {/* Focus halo — floats 3px outside the border, fades with focusT.
              Skipped on glass fields: the material's own rim plus this ring
              reads as a double outline. */}
          {glass ? null : (
            <Animated.View
              pointerEvents="none"
              style={[
                {
                  position: "absolute",
                  top: -3,
                  left: -3,
                  right: -3,
                  bottom: -3,
                  borderRadius: 15,
                  borderWidth: 2,
                },
                haloStyle,
              ]}
            />
          )}
          {leftIcon ? (
            <View className="absolute left-3 top-0 h-full items-center justify-center z-10" pointerEvents="none">
              {leftIcon}
            </View>
          ) : null}
          {/* AnimatedTextInput is the shared className-registered primitive —
              a drop-in TextInput accepting the same props + className + style. */}
          <AnimatedTextInput
            ref={ref}
            editable={editable}
            placeholderTextColor={colors.mutedForeground}
            style={[borderStyle, style]}
            onFocus={(e) => {
              focusT.value = reducedMotion ? 1 : withTiming(1, STATE_COLOR);
              kbdT.value = keyboardModality ? withTiming(1, STATE_COLOR) : 0;
              onFocus?.(e);
            }}
            onBlur={(e) => {
              focusT.value = reducedMotion ? 0 : withTiming(0, STATE_COLOR);
              kbdT.value = withTiming(0, STATE_COLOR);
              onBlur?.(e);
            }}
            className={cn(
              // 48px = 44pt+ touch target; px-3.5 aligns text to 14px grid.
              // Constant border-[1.5px] in every state — width never flickers;
              // the color itself is animated (borderColor lives in fieldAnim).
              size === "sm"
                ? glass
                  ? "h-11 rounded-full border-[1.5px] border-transparent bg-transparent px-4 text-sm text-foreground"
                  : "h-11 rounded-xl border-[1.5px] border-transparent bg-card px-3 text-sm text-foreground"
                : glass
                  ? "h-12 rounded-full border-[1.5px] border-transparent bg-transparent px-4 text-base text-foreground"
                  : "h-12 rounded-xl border-[1.5px] border-transparent bg-card px-3.5 text-base text-foreground",
              leftIcon && "pl-10",
              showRight && "pr-10",
              className
            )}
            {...props}
            accessibilityLabel={label ?? props.accessibilityLabel}
            // Keep generated semantics authoritative so a caller cannot
            // accidentally erase the field's label, error, or disabled state.
            accessibilityLabelledBy={label ? labelId : props.accessibilityLabelledBy}
            aria-labelledby={label ? labelId : props["aria-labelledby"]}
            accessibilityHint={describedBy ?? props.accessibilityHint}
            accessibilityState={{ ...props.accessibilityState, disabled: !editable }}
            // accessibilityState isn't forwarded to the DOM on web — mirror
            // the error with an explicit aria-invalid like Checkbox does.
            aria-invalid={!!error || (props as TextInputProps & { "aria-invalid"?: boolean })["aria-invalid"] === true}
          />
          {/* Light from above — lit top edge + accent fall-off inside the
              field shape, over the fill. Decorative. */}
          <Animated.View
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            className={cn("absolute inset-0 overflow-hidden", glass ? "rounded-full" : "rounded-xl")}
            style={lightStyle}
          >
            <Svg width="100%" height="100%">
              <Defs>
                <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <Stop offset={0} stopColor={colors.primary} stopOpacity={FOCUS_LIGHT_ALPHA} />
                  <Stop offset={FOCUS_LIGHT_REACH} stopColor={colors.primary} stopOpacity={0} />
                </LinearGradient>
              </Defs>
              <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${gradId})`} />
            </Svg>
            <View className="absolute left-0 right-0 top-0 h-px bg-primary" />
          </Animated.View>
          {hasBaseline ? (
            <View
              pointerEvents="none"
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              className={cn("absolute inset-0 overflow-hidden", glass ? "rounded-full" : "rounded-xl")}
            >
              <Animated.View
                className="absolute bottom-0 left-0 right-0"
                style={[{ height: BASELINE_HEIGHT, transformOrigin: "left" }, baselineStyle]}
              />
            </View>
          ) : null}
          {showRight ? (
            <View className="absolute right-3 top-0 h-full items-center justify-center" pointerEvents="none">
              {showSuccess ? (
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <AnimatedPath
                    d={SUCCESS_PATH}
                    stroke={colors.success}
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray={CHECK_LEN}
                    animatedProps={checkProps}
                  />
                </Svg>
              ) : (
                rightIcon
              )}
            </View>
          ) : null}
        </Animated.View>
        {showLine ? (
          // Unmounting line (no reserve) recedes instead of vanishing.
          <Animated.View style={[{ minHeight: 20 }, msgStyle]} exiting={FadeOut.duration(timing.recede.duration)}>
            {error ? (
              <Text
                className="text-sm text-destructive"
                accessibilityLiveRegion="polite"
                accessibilityRole="alert"
              >
                {error}
              </Text>
            ) : helper ? (
              <Text className="text-sm text-muted-foreground">{helper}</Text>
            ) : stale ? (
              <Text
                className={cn("text-sm", stale.isError ? "text-destructive" : "text-muted-foreground")}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                aria-hidden
              >
                {stale.text}
              </Text>
            ) : null}
          </Animated.View>
        ) : null}
      </View>
    );
  }
);

Input.displayName = "Input";
