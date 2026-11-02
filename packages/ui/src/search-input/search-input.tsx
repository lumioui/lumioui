import * as React from "react";
import { forwardRef, useEffect, useRef, useState } from "react";
import { TextInput, View, Text, Pressable, type TextInputProps } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSpring,
  withTiming,
  interpolateColor,
  type SharedValue,
} from "react-native-reanimated";
import {
  cn,
  ease,
  tempo,
  useHaptic,
  useTheme,
  usePressAnimation,
  useReducedMotion,
  spring,
  timing,
  AnimatedTextInput,
  LitEdge,
} from "@lumioui/core";
import { Icon } from "../icon";
import { Glass } from "../glass";

/** Refusal flicker — one 4px kick released into spring.shake. */
const ERROR_KICK = 4;
/** Searching — the leading glyph swaps for three dots that brighten in turn;
 *  one cycle, the same beat as Button's busy dots. */
const BUSY_CYCLE_MS = tempo.roll * 2;
/** Busy dots sized to the glyph slot, and their resting brightness. */
const BUSY_DOT = 4;
const BUSY_DOT_REST = 0.3;

/** One busy dot: brightens as the cycle passes its turn, then rests. Opacity
 *  only — reduced motion holds it half lit. */
function BusyDot({ index, lap, color, still }: { index: number; lap: SharedValue<number>; color: string; still: boolean }) {
  const style = useAnimatedStyle(() => {
    if (still) return { opacity: 0.6 };
    const t = (((lap.value - index / 3) % 1) + 1) % 1;
    const peak = t < 0.5 ? Math.sin(t * 2 * Math.PI) : 0;
    return { opacity: BUSY_DOT_REST + (1 - BUSY_DOT_REST) * Math.max(0, peak) };
  });
  return <Animated.View style={[{ width: BUSY_DOT, height: BUSY_DOT, borderRadius: BUSY_DOT / 2, backgroundColor: color }, style]} />;
}
/** Disabled rests at half strength. */
const DISABLED_OPACITY = 0.5;

const IGNITE = { duration: timing.fast.duration, easing: Easing.bezier(...ease.out) };
const DIM = { duration: timing.recede.duration, easing: Easing.bezier(...ease.in) };

/** Clear button — ignites in place when text appears, dims away when it
 *  goes; it stays mounted so the exit is seen. */
function ClearButton({ visible, onPress }: { visible: boolean; onPress: () => void }) {
  const reduceMotion = useReducedMotion();
  const on = useSharedValue(visible ? 1 : 0);
  const scale = useSharedValue(1);
  const press = usePressAnimation({ pressedScale: 0.85, pressedOpacity: 0.5 });

  React.useEffect(() => {
    if (visible) {
      on.value = withTiming(1, IGNITE);
      if (!reduceMotion) {
        scale.value = 0.9;
        scale.value = withSpring(1, spring.swap);
      }
    } else {
      on.value = withTiming(0, DIM);
    }
  }, [visible, on, scale, reduceMotion]);

  const appearStyle = useAnimatedStyle(() => ({
    opacity: on.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      disabled={!visible}
      pointerEvents={visible ? "auto" : "none"}
      className="h-8 w-8 items-center justify-center"
      accessibilityRole="button"
      accessibilityLabel="Clear search"
      accessibilityElementsHidden={!visible}
      importantForAccessibility={visible ? "auto" : "no-hide-descendants"}
      // 32px visual + 8px/side hitSlop = 48pt ≥ 44pt touch target.
      hitSlop={{ top: 8, left: 8, right: 8, bottom: 8 }}
    >
      <Animated.View style={appearStyle}>
        <Animated.View style={press.animatedStyle}>
          <Icon name="x" size="sm" color="mutedForeground" />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

export interface SearchInputProps extends Omit<TextInputProps, "className"> {
  /** Visible label above the field. */
  label?: string;
  /** Helper text below the field. */
  helper?: string;
  /** Error message. */
  error?: string;
  /** Debounce duration in ms for onChangeText. While a debounced query is
   *  pending, the leading glyph shows busy dots. */
  debounceMs?: number;
  /** A search is running (e.g. awaiting results) — the leading glyph shows
   *  busy dots until it turns false, then swaps back. */
  searching?: boolean;
  /** Called when the clear button is pressed. */
  onClear?: () => void;
  /** Leading icon slot. */
  icon?: React.ReactNode;
  /** Classes for the input element. */
  className?: string;
  /** Classes for the outer wrapper. */
  containerClassName?: string;
  /** Capsule mode — the field becomes a floating glass pill
   *  (search rides over content instead of sitting on the surface). */
  glass?: boolean;
  /** Glass mode only: tint the capsule (e.g. a dark wash over a bright photo). */
  glassTint?: string;
  /** Field height — "sm" 36pt (search inside a navigation bar), "md" 44pt
   *  (default, standalone search on a screen). */
  size?: "sm" | "md";
}

/** Field height per size — bar search is 36pt, standalone fields 44. */
const FIELD_HEIGHT = { sm: 36, md: 44 } as const;

/**
 * SearchInput — search is a light. Focus brightens the field (muted → card
 * over timing.fast) and lights its top edge; there is no outer halo. While a
 * debounced query is pending (or `searching` is set) the leading glyph swaps
 * in place for three dots that brighten in turn, and swaps back when results
 * land. Nothing sweeps across the field.
 * The clear button ignites and dims in place. An error flickers the field
 * once (4px into spring.shake). Pair with `SearchMatch` so each result
 * lights the part the query matched.
 */
export const SearchInput = forwardRef<React.ElementRef<typeof TextInput>, SearchInputProps>(
  function SearchInput(
    {
      label,
      helper,
      error,
      debounceMs,
      searching = false,
      onClear,
      icon,
      className,
      containerClassName,
      value,
      defaultValue,
      onChangeText,
      editable = true,
      returnKeyType = "search",
      onFocus,
      onBlur,
      glass = false,
      glassTint,
      size = "md",
      ...props
    },
    ref
  ) {
    const height = FIELD_HEIGHT[size];
    const haptics = useHaptic();
    const { colors } = useTheme();
    const reduceMotion = useReducedMotion();
    // Built-in label gets a stable nativeID so the field can point back at
    // it via accessibilityLabelledBy / aria-labelledby (Input parity).
    const autoId = React.useId();
    const labelId = `${autoId}-label`;
    /** Focus progression — the field brightens and its top edge lights. */
    const focusT = useSharedValue(0);
    /** Error flicker offset. */
    const shakeX = useSharedValue(0);
    /** Error/helper text entrance: 0 hidden → 1 visible. */
    const msgT = useSharedValue(error || helper ? 1 : 0);
    /** Disabled ↔ enabled crossfade. */
    const live = useSharedValue(editable ? 1 : DISABLED_OPACITY);
    const hadError = useRef(!!error);
    const [display, setDisplay] = useState<string>(() => {
      const v = value ?? defaultValue;
      return typeof v === "string" ? v : "";
    });
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [pending, setPending] = useState(false);

    useEffect(() => {
      if (value !== undefined) setDisplay(value);
    }, [value]);

    useEffect(() => {
      live.value = withTiming(editable ? 1 : DISABLED_OPACITY, timing.normal);
    }, [editable, live]);

    // Error → one flicker; message switches on under the field (Input parity).
    useEffect(() => {
      if (error && !hadError.current) {
        haptics.warning();
        if (!reduceMotion) {
          shakeX.value = ERROR_KICK;
          shakeX.value = withSpring(0, spring.shake);
        }
        hadError.current = true;
      } else if (!error) {
        hadError.current = false;
      }
      const target = error || helper ? 1 : 0;
      msgT.value = reduceMotion ? target : withTiming(target, timing.fast);
    }, [error, helper, msgT, shakeX, reduceMotion, haptics]);

    // Searching — the leading glyph swaps in place for three dots that
    // brighten in turn while a query is pending or a search runs.
    const working = (pending || searching) && editable;
    const busyOn = useSharedValue(0);
    const lap = useSharedValue(0);
    useEffect(() => {
      busyOn.value = working ? withTiming(1, IGNITE) : withTiming(0, { ...timing.recede, easing: Easing.bezier(...ease.in) });
      if (!working || reduceMotion) {
        cancelAnimation(lap);
        return;
      }
      lap.value = 0;
      lap.value = withRepeat(withTiming(1, { duration: BUSY_CYCLE_MS, easing: Easing.linear }), -1, false);
      return () => cancelAnimation(lap);
    }, [working, reduceMotion, busyOn, lap]);
    const glyphStyle = useAnimatedStyle(() => ({ opacity: 1 - busyOn.value }));
    const dotsStyle = useAnimatedStyle(() => ({ opacity: busyOn.value }));

    const fieldStyle = useAnimatedStyle(() => ({
      transform: [{ translateX: shakeX.value }],
      opacity: live.value,
      // Muted fill at rest; focus brightens it to the card surface.
      backgroundColor: interpolateColor(focusT.value, [0, 1], [colors.muted, colors.card]),
      borderColor: error ? colors.destructive : interpolateColor(focusT.value, [0, 1], [colors.muted, colors.border]),
    }));

    // Glass capsule keeps its material — only the flicker and the dim.
    const glassShakeStyle = useAnimatedStyle(() => ({
      transform: [{ translateX: shakeX.value }],
      opacity: live.value,
    }));

    const litStyle = useAnimatedStyle(() => ({ opacity: focusT.value }));

    const msgStyle = useAnimatedStyle(() => ({
      opacity: msgT.value,
      transform: [{ translateY: reduceMotion ? 0 : (1 - msgT.value) * -4 }],
    }));

    useEffect(() => {
      return () => {
        if (timer.current) clearTimeout(timer.current);
      };
    }, []);

    const emit = (text: string) => {
      if (timer.current) clearTimeout(timer.current);
      if (debounceMs && debounceMs > 0) {
        setPending(text.length > 0);
        timer.current = setTimeout(() => {
          setPending(false);
          onChangeText?.(text);
        }, debounceMs);
      } else {
        onChangeText?.(text);
      }
    };

    const handleChangeText = (text: string) => {
      setDisplay(text);
      emit(text);
    };

    const handleClear = () => {
      haptics.selection();
      if (timer.current) clearTimeout(timer.current);
      setPending(false);
      setDisplay("");
      onChangeText?.("");
      onClear?.();
    };

    const radius = glass ? height / 2 : size === "sm" ? 10 : 12;

    return (
      <View className={cn("w-full gap-1.5", containerClassName)}>
        {label ? (
          <Text
            nativeID={labelId}
            className="text-sm font-medium text-foreground"
            accessibilityRole="text"
          >
            {label}
          </Text>
        ) : null}
        <FieldSurface glass={glass} height={height} tint={glassTint}>
          <Animated.View
            style={glass ? glassShakeStyle : fieldStyle}
            className={cn(
              // Constant border-[1.5px] — width never flickers; the colour is
              // animated in fieldStyle, not swapped via classes.
              "w-full flex-row items-center overflow-hidden border-[1.5px] border-transparent",
              size === "sm" ? "h-9 px-2" : "h-11 px-3",
              glass ? "rounded-full border-0" : size === "sm" ? "rounded-[10px]" : "rounded-xl"
            )}
          >
            {/* Leading glyph — while searching it swaps in place for busy dots. */}
            <View className="items-center justify-center">
              <Animated.View style={glyphStyle}>
                {icon ?? <Icon name="search" size="sm" color="mutedForeground" />}
              </Animated.View>
              <Animated.View
                pointerEvents="none"
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                style={[{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: BUSY_DOT / 2 }, dotsStyle]}
              >
                {[0, 1, 2].map((i) => (
                  <BusyDot key={i} index={i} lap={lap} color={colors.mutedForeground} still={!!reduceMotion} />
                ))}
              </Animated.View>
            </View>
            {/* AnimatedTextInput is the shared className-registered primitive —
                a drop-in TextInput accepting the same props + className. */}
            <AnimatedTextInput
              ref={ref}
              value={display}
              editable={editable}
              returnKeyType={returnKeyType}
              placeholderTextColor={colors.mutedForeground}
              onFocus={(e) => {
                focusT.value = withTiming(1, IGNITE);
                onFocus?.(e);
              }}
              onBlur={(e) => {
                focusT.value = withTiming(0, DIM);
                onBlur?.(e);
              }}
              onChangeText={handleChangeText}
              className={cn(
                "h-full flex-1 px-2 text-foreground",
                size === "sm" ? "text-[15px]" : "text-base",
                "placeholder:text-muted-foreground",
                className
              )}
              accessibilityRole="search"
              accessibilityLabel={label ?? props.accessibilityLabel}
              accessibilityLabelledBy={label ? labelId : undefined}
              aria-labelledby={label ? labelId : undefined}
              // Hint is helper only — errors are announced by the live
              // region below, so repeating them here double-announces.
              accessibilityHint={helper}
              accessibilityState={{ disabled: !editable, busy: working }}
              // accessibilityState isn't forwarded to the DOM on web — mirror
              // the error with an explicit aria-invalid like Checkbox does.
              aria-invalid={!!error}
              aria-busy={working}
              {...props}
            />
            {editable ? <ClearButton visible={display.length > 0} onPress={handleClear} /> : null}
            {/* Focus lights the top edge of the field. */}
            <Animated.View pointerEvents="none" style={[{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }, litStyle]}>
              <LitEdge tone={glass ? "fill" : "surface"} radius={radius} />
            </Animated.View>
          </Animated.View>
        </FieldSurface>
        {error || helper ? (
          <Animated.View style={msgStyle}>
            {error ? (
              <Text
                className="text-sm text-destructive"
                accessibilityLiveRegion="polite"
                accessibilityRole="alert"
              >
                {error}
              </Text>
            ) : (
              <Text className="text-sm text-muted-foreground">{helper}</Text>
            )}
          </Animated.View>
        ) : null}
      </View>
    );
  }
);

SearchInput.displayName = "SearchInput";

export interface SearchMatchProps {
  /** The result text. */
  text: string;
  /** The query — its first case-insensitive match is lit. */
  query: string;
  /** Classes for the whole line (size, weight). */
  className?: string;
  numberOfLines?: number;
}

/** SearchMatch — a result line where the query lights its match: the matched
 *  part is full ink, the rest muted. With no query the whole line is ink. */
export const SearchMatch = forwardRef<React.ElementRef<typeof Text>, SearchMatchProps>(function SearchMatch(
  { text, query, className, numberOfLines },
  ref
) {
  const q = query.trim().toLowerCase();
  const at = q ? text.toLowerCase().indexOf(q) : -1;
  if (at < 0) {
    return (
      <Text ref={ref} className={cn(q ? "text-muted-foreground" : "text-foreground", className)} numberOfLines={numberOfLines}>
        {text}
      </Text>
    );
  }
  return (
    <Text ref={ref} className={cn("text-muted-foreground", className)} numberOfLines={numberOfLines} accessibilityLabel={text}>
      {text.slice(0, at)}
      <Text className="text-foreground">{text.slice(at, at + q.length)}</Text>
      {text.slice(at + q.length)}
    </Text>
  );
});
SearchMatch.displayName = "SearchMatch";

/** Field surface — glass capsule or plain field, keeping the field row
 *  identical underneath so focus/flicker behavior is shared. */
function FieldSurface({
  glass,
  height,
  tint,
  children,
}: {
  glass?: boolean;
  height: number;
  tint?: string;
  children: React.ReactNode;
}) {
  if (!glass) return <>{children}</>;
  return (
    <Glass effect="regular" tintColor={tint} className="w-full rounded-full" style={{ height }}>
      {children}
    </Glass>
  );
}
