import * as React from "react";
import { forwardRef } from "react";
import { TextInput, View, Text, type TextInputProps, } from "react-native";
import Animated, {
  Easing,
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming,
  interpolateColor,
} from "react-native-reanimated";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { cn, ease, spring, timing, useHaptic, useReducedMotion, useTheme, AnimatedTextInput } from "@lumioui/core";
import { Glass } from "../glass";

/** Flicker for "can't" — one 4pt kick released into spring.shake (§5 rule 4). */
const ERROR_KICK = 4;
/** Focus light — a 1pt lit top edge, brightest over the middle of the field
 *  and fading at the corners: light marks where you write. */
const EDGE_ALPHA = 0.9;
/** The count starts swapping in place once this share of maxLength is used. */
const COUNT_NEAR = 0.9;
/** A count digit's directional travel as it swaps. */
const COUNT_TRAVEL = 4;
/** Refused keystroke at the limit: the count dips to this, then recovers. */
const FLICKER_DIP = 0.6;
const IGNITE = { ...timing.fast, easing: Easing.bezier(...ease.out) };

const useGradientId = () => React.useId().replace(/[^a-zA-Z0-9]/g, "");

export interface TextareaProps extends Omit<TextInputProps, "className" | "multiline"> {
  /** Visible label above the field. */
  label?: string;
  /** Helper text below the field. */
  helper?: string;
  /** Error message — turns the field red. */
  error?: string;
  /** Minimum height in points. Default 96. */
  minHeight?: number;
  /** Grow with content. */
  autoGrow?: boolean;
  /** Show a live character count under the field ("n" or "n/max" with maxLength). */
  showCount?: boolean;
  /** NativeWind classes for the input. */
  className?: string;
  /** Glass field — rounded material instead of the flat fill. */
  glass?: boolean;
  /** Classes for the outer wrapper. */
  containerClassName?: string;
  multiline?: boolean;
}

/**
 * Textarea — multiline Input with minHeight and optional auto-grow.
 * Focus tints the border and lights a 1pt top edge over 160ms. An arriving
 * error flickers the field once (4pt kick, warning haptic). Near maxLength
 * the count swaps in place with each keystroke; a keystroke refused at the
 * limit flickers the count.
 */
export const Textarea = forwardRef<React.ElementRef<typeof TextInput>, TextareaProps>(
  function Textarea(
    {
      label,
      helper,
      error,
      minHeight = 96,
      autoGrow = false,
      showCount = false,
      className,
      containerClassName,
      glass = false,
      multiline = true,
      onContentSizeChange,
      onChangeText,
      value,
      defaultValue,
      maxLength,
      editable = true,
      onFocus,
      onBlur,
      onKeyPress,
      style,
      ...props
    },
    ref
  ) {
    const { colors } = useTheme();
    const reduceMotion = useReducedMotion();
    const haptic = useHaptic();
    const edgeId = useGradientId();
    const describedBy = error ?? helper;
    // Built-in label gets a stable nativeID so the field can point back at
    // it via accessibilityLabelledBy / aria-labelledby (Input parity).
    const autoId = React.useId();
    const labelId = `${autoId}-label`;
    // Character count tracks typing; controlled `value` changes resync it.
    const [textLen, setTextLen] = React.useState(() => (value ?? defaultValue ?? "").length);

    // Auto-grow animates instead of jumping — the field eases taller.
    const contentHeight = useSharedValue(minHeight);
    // Error shake — same craft as Input.
    const shake = useSharedValue(0);
    /** Focus progression — drives the border color glide. */
    const focusT = useSharedValue(0);
    /** Read-only dim: 1 editable, 0.5 read-only — crossfaded, never snapped. */
    const editT = useSharedValue(editable ? 1 : 0.5);
    React.useEffect(() => {
      editT.value = reduceMotion ? (editable ? 1 : 0.5) : withTiming(editable ? 1 : 0.5, timing.normal);
    }, [editable, reduceMotion, editT]);
    /** Error/helper text entrance: 0 hidden → 1 visible. */
    const msgT = useSharedValue(error || helper ? 1 : 0);
    const hadError = React.useRef(!!error);

    React.useEffect(() => {
      if (error && !hadError.current) {
        haptic.warning();
        if (!reduceMotion) {
          // One flicker: a small kick released into the flicker spring.
          shake.value = -ERROR_KICK;
          shake.value = withSpring(0, spring.shake);
        }
        hadError.current = true;
      } else if (!error) {
        hadError.current = false;
      }
      const target = error || helper ? 1 : 0;
      // timing.fast (150ms): message arrives quick enough to not flash.
      msgT.value = reduceMotion ? target : withTiming(target, timing.fast);
      // Mount-time errors arrive with the field; only a new error flickers.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [error, helper, reduceMotion, shake, msgT]);

    const shakeStyle = useAnimatedStyle(() => ({
      transform: [{ translateX: shake.value }],
    }));
    const heightStyle = useAnimatedStyle(() =>
      autoGrow ? { height: Math.max(minHeight, contentHeight.value) } : {}
    );

    // Border color glides input → ring on focus; error wins outright.
    const borderStyle = useAnimatedStyle(() => ({
      opacity: editT.value,
      borderColor: error
        ? colors.destructive
        : interpolateColor(focusT.value, [0, 1], [colors.input, colors.ring]),
    }));

    // Focus light — the lit top edge brightens with focus (not on errors:
    // the red border carries that state alone).
    const edgeStyle = useAnimatedStyle(() => ({
      opacity: error ? 0 : focusT.value,
    }));

    // Count: swaps in place near the limit, flickers on a refused keystroke.
    const countIn = useSharedValue(1);
    const countMove = useSharedValue(0);
    const prevLen = React.useRef(textLen);
    React.useEffect(() => {
      const prev = prevLen.current;
      prevLen.current = textLen;
      if (maxLength == null || prev === textLen || textLen < maxLength * COUNT_NEAR) return;
      // The outgoing figure is replaced by an incoming one that ignites,
      // travelling a few points in the direction the count moved.
      countIn.value = 0.4;
      countIn.value = withTiming(1, IGNITE);
      if (reduceMotion) return;
      countMove.value = textLen > prev ? COUNT_TRAVEL : -COUNT_TRAVEL;
      countMove.value = withSpring(0, spring.swap);
    }, [textLen, maxLength, reduceMotion, countIn, countMove]);
    const countStyle = useAnimatedStyle(() => ({
      opacity: countIn.value,
      transform: [{ translateY: countMove.value }],
    }));

    const handleKeyPress = (e: Parameters<NonNullable<TextInputProps["onKeyPress"]>>[0]) => {
      // A character refused at the limit flickers the count once.
      if (maxLength != null && textLen >= maxLength && e.nativeEvent.key !== "Backspace") {
        haptic.warning();
        countIn.value = withSequence(withTiming(FLICKER_DIP, timing.instant), withTiming(1, timing.fast));
        if (!reduceMotion) {
          countMove.value = ERROR_KICK;
          countMove.value = withSpring(0, spring.shake);
        }
      }
      onKeyPress?.(e);
    };

    const msgStyle = useAnimatedStyle(() => ({
      opacity: msgT.value,
      transform: [{ translateY: reduceMotion ? 0 : (1 - msgT.value) * -4 }],
    }));

    const handleContentSizeChange = (
      e: Parameters<NonNullable<TextInputProps["onContentSizeChange"]>>[0]
    ) => {
      if (autoGrow) {
        const next = e.nativeEvent.contentSize.height;
        // Reduced motion: snap to the measured height instead of easing.
        // timing.fast (150ms) tracks typing without jumping.
        if (reduceMotion) contentHeight.value = next;
        else contentHeight.value = withTiming(next, timing.fast);
      }
      onContentSizeChange?.(e);
    };

    const handleChangeText = (text: string) => {
      setTextLen(text.length);
      onChangeText?.(text);
    };

    // Controlled `value` changes (set externally, e.g. cleared) resync the count.
    React.useEffect(() => {
      if (typeof value === "string") setTextLen(value.length);
    }, [value]);

    return (
      <View className={cn("gap-1.5", containerClassName)}>
        {label ? (
          <Text
            nativeID={labelId}
            className="text-sm font-medium text-foreground"
            accessibilityRole="text"
          >
            {label}
          </Text>
        ) : null}
        <Animated.View style={shakeStyle}>
          {glass ? (
            <Glass
              effect="regular"
              sheen={0.4}
              className="absolute inset-0"
              style={{ borderRadius: 16 }}
              pointerEvents="none"
            />
          ) : null}
          <AnimatedTextInput
          ref={ref}
          editable={editable}
          multiline={multiline}
          onFocus={(e) => {
            focusT.value = reduceMotion ? 1 : withTiming(1, timing.fast);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            focusT.value = reduceMotion ? 0 : withTiming(0, timing.fast);
            onBlur?.(e);
          }}
          onContentSizeChange={handleContentSizeChange}
          onChangeText={handleChangeText}
          onKeyPress={handleKeyPress}
          value={value}
          defaultValue={defaultValue}
          maxLength={maxLength}
          className={cn(
            // Constant border-[1.5px] — width never flickers; the color is
            // animated in borderStyle, not swapped via classes.
            glass
              ? "min-h-[96px] rounded-2xl border-[1.5px] border-transparent bg-transparent px-3.5 py-3 text-base text-foreground"
              : "min-h-[96px] rounded-xl border-[1.5px] border-transparent bg-card px-3.5 py-3 text-base text-foreground",
            "placeholder:text-muted-foreground",
            className
          )}
          style={[
            {
              minHeight,
              textAlignVertical: "top",
            },
            heightStyle,
            borderStyle,
            style,
          ]}
          accessibilityLabel={label ?? props.accessibilityLabel}
          accessibilityLabelledBy={label ? labelId : undefined}
          aria-labelledby={label ? labelId : undefined}
          accessibilityHint={describedBy}
          accessibilityState={{ disabled: !editable }}
          // accessibilityState isn't forwarded to the DOM on web — mirror
          // the error with an explicit aria-invalid like Checkbox does.
          aria-invalid={!!error}
          {...props}
          />
          {/* Focus light — a 1pt lit top edge just inside the border, fading
              toward the corners. Replaces an outer halo: light marks where
              you write instead of a glow ring around the chrome. */}
          <Animated.View
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={[{ position: "absolute", top: 1, left: 12, right: 12, height: 1 }, edgeStyle]}
          >
            <Svg width="100%" height="100%">
              <Defs>
                <LinearGradient id={edgeId} x1="0" y1="0" x2="1" y2="0">
                  <Stop offset={0} stopColor={colors.ring} stopOpacity={0} />
                  <Stop offset={0.5} stopColor={colors.ring} stopOpacity={EDGE_ALPHA} />
                  <Stop offset={1} stopColor={colors.ring} stopOpacity={0} />
                </LinearGradient>
              </Defs>
              <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${edgeId})`} />
            </Svg>
          </Animated.View>
        </Animated.View>
        {error || helper || showCount ? (
          <Animated.View
            style={error || helper ? msgStyle : undefined}
            className="flex-row items-start justify-between gap-2"
          >
            {error ? (
              <Text
                className="flex-1 text-sm text-destructive"
                accessibilityLiveRegion="polite"
                accessibilityRole="alert"
              >
                {error}
              </Text>
            ) : helper ? (
              <Text className="flex-1 text-sm text-muted-foreground">{helper}</Text>
            ) : (
              <View className="flex-1" />
            )}
            {showCount ? (
              <Animated.Text
                style={countStyle}
                className={cn(
                  "text-sm",
                  maxLength != null && textLen >= maxLength
                    ? "text-destructive"
                    : "text-muted-foreground"
                )}
                accessibilityLabel={
                  maxLength != null
                    ? `${textLen} of ${maxLength} characters`
                    : `${textLen} characters`
                }
              >
                {maxLength != null ? `${textLen}/${maxLength}` : textLen}
              </Animated.Text>
            ) : null}
          </Animated.View>
        ) : null}
      </View>
    );
  }
);

Textarea.displayName = "Textarea";
