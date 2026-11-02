import * as React from "react";
import { forwardRef } from "react";
import { Platform, Pressable, View, type GestureResponderEvent, type ViewProps } from "react-native";
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Svg from "react-native-svg";
import {
  AnimatedPath,
  AnimatedPressable,
  announce,
  cn,
  ease,
  optionalRequire,
  Sheen,
  spring,
  timing,
  useHaptic,
  usePressAnimation,
  useReducedMotion,
  useTheme,
} from "@lumioui/core";
import { Icon } from "../icon/icon";
import { Text } from "../text/text";

/**
 * CopyField — a read-only value with a copy affordance. Tapping anywhere on
 * the field copies: one accent sheen crosses the value as if the light had
 * picked it up, the value holds in accent ink for 700ms and settles back,
 * while the copy glyph dims and a check draws itself in its place, a
 * success haptic lands, and the label row says "Copied" for a moment. No
 * toast: the feedback stays where the finger is.
 *
 *   <CopyField label="Invite link" value="https://pace.example/i/maya-7Q2K" />
 *   <CopyField label="IBAN" value={iban} groupSize={4} mono appearance="inline" />
 *   <CopyField value="HARVEST15" appearance="box" />
 *   <CopyField label="Account number" value="40221987" masked />
 *
 * Appearances: `field` (filled row, label above), `inline` (bare value with
 * a trailing icon button, for list rows), `box` (large dashed code with a
 * labelled button, for promo and referral codes). `display` and `groupSize`
 * only change what is SHOWN — the clipboard always gets `value` verbatim.
 * `masked` hides all but the last four characters until the eye is tapped
 * (copying never needs the reveal).
 *
 * Clipboard: writes through `expo-clipboard` when the host app provides it
 * (optional peer, never a hard import) and `navigator.clipboard` on web.
 * `onCopy(value)` always fires, so hosts can route the write themselves.
 * `CopyButton` is the standalone pill for "Copy all"-style actions.
 */

/** Lumio check on the 24 grid — short stroke, long stroke (length ≈17.7). */
const CHECK_PATH = "M6 12.5l4 4 8-9";
const CHECK_LEN = 18;
/** Ignite — opacity of anything arriving; the check draws on the same curve. */
const IGNITE = { duration: timing.fast.duration, easing: Easing.bezier(...ease.out) };
/** Dim — the leaving glyph or label goes first and faster. */
const DIM = { duration: timing.recede.duration, easing: Easing.bezier(...ease.in) };
/** Check draws over 240ms with no beat in front — it starts on the tap. */
const CHECK_DRAW = { duration: 240, easing: Easing.bezier(...ease.out) };
/** Glyphs bloom wider than labels — 4% is invisible on a 16px icon. */
const GLYPH_FROM = 0.86;
/** Labels swap in place at the standard 0.96 bloom. */
const LABEL_FROM = 0.96;
/** The "Copied" note ignites with a small slide in from the trailing side. */
const NOTE_SLIDE = 4;
/** Copied state lingers long enough to be read, short enough to copy again. */
const DEFAULT_RESET_MS = 1800;
/** The value holds its picked-up light this long before settling back (act → hold → resolve). */
const VALUE_HOLD = 700;
/** Settle back to resting ink — slower than the ignite, it's the resolve. */
const VALUE_SETTLE = { duration: timing.slow.duration, easing: Easing.bezier(...ease.inOut) };
/** Accent sheen on paper — faint; the light picks the value up, it doesn't flash. */
const COPY_SHEEN = 0.25;

interface ClipboardModule {
  setStringAsync: (text: string) => Promise<boolean | void>;
}

// Resolved once — optional peer, invisible to Metro's static require analysis.
const clipboardModule = (() => {
  const mod = optionalRequire<ClipboardModule>("expo-clipboard");
  return mod && typeof mod.setStringAsync === "function" ? mod : null;
})();

/** Write text to the system clipboard. Resolves false when no clipboard is reachable. */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (clipboardModule) {
      await clipboardModule.setStringAsync(text);
      return true;
    }
    const nav =
      Platform.OS === "web" && typeof navigator !== "undefined"
        ? (navigator as { clipboard?: { writeText: (v: string) => Promise<void> } })
        : undefined;
    if (nav?.clipboard) {
      await nav.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through */
  }
  return false;
}

export interface UseCopyOptions {
  onCopy?: (value: string) => void;
  /** ms the copied state lasts. Default 1800. */
  resetAfter?: number;
  /** Spoken confirmation, e.g. "IBAN copied". Default "Copied". */
  announcement?: string;
  /** ms between the write and the visible confirmation (check, label,
   *  haptic) — room for what was copied to light up first. Default 0. */
  confirmAfter?: number;
}

/** Copy state machine shared by CopyField and CopyButton. `runs` counts
 *  confirmed copies — bump-to-fire for light that marks each one. */
export function useCopy(
  value: string,
  { onCopy, resetAfter = DEFAULT_RESET_MS, announcement = "Copied", confirmAfter = 0 }: UseCopyOptions = {}
) {
  const haptic = useHaptic();
  const [copied, setCopied] = React.useState(false);
  const [runs, setRuns] = React.useState(0);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const confirmTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
    },
    []
  );

  const copy = React.useCallback(() => {
    void copyToClipboard(value);
    onCopy?.(value);
    const confirm = () => {
      haptic.success();
      announce(announcement);
      setCopied(true);
      setRuns((n) => n + 1);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), resetAfter);
    };
    if (confirmTimer.current) clearTimeout(confirmTimer.current);
    if (confirmAfter > 0) confirmTimer.current = setTimeout(confirm, confirmAfter);
    else confirm();
  }, [value, onCopy, haptic, announcement, resetAfter, confirmAfter]);

  return { copied, copy, runs };
}

/**
 * The value text and its picked-up light: an accent-ink twin over the
 * resting text ignites when `run` bumps, holds VALUE_HOLD, then settles back
 * to the resting ink. Opacity only — it reads the same under reduced motion.
 */
function LitValue({
  children,
  run,
  highlight = 0,
  highlightDelay = 0,
  className,
  numberOfLines,
  ellipsizeMode,
  wrapClassName,
}: {
  children: string;
  run: number;
  highlight?: number;
  highlightDelay?: number;
  className?: string;
  numberOfLines?: number;
  ellipsizeMode?: "middle" | "tail";
  wrapClassName?: string;
}) {
  const lit = useSharedValue(0);
  const flash = React.useCallback(
    (delay: number) => {
      lit.value = withDelay(
        delay,
        withSequence(withTiming(1, IGNITE), withDelay(VALUE_HOLD, withTiming(0, VALUE_SETTLE)))
      );
    },
    [lit]
  );
  React.useEffect(() => {
    if (run) flash(0);
  }, [run, flash]);
  React.useEffect(() => {
    if (highlight) flash(highlightDelay);
  }, [highlight, highlightDelay, flash]);
  const litStyle = useAnimatedStyle(() => ({ opacity: lit.value }));
  return (
    <View className={wrapClassName}>
      <Text className={className} numberOfLines={numberOfLines} ellipsizeMode={ellipsizeMode}>
        {children}
      </Text>
      <Animated.Text
        style={litStyle}
        className={cn("text-base", className, "absolute left-0 right-0 top-0 text-primary-text")}
        numberOfLines={numberOfLines}
        ellipsizeMode={ellipsizeMode}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {children}
      </Animated.Text>
    </View>
  );
}

/** Copy glyph that hands over to a drawn check. */
function CopyGlyph({ copied, size = 20, tone = "foreground" }: { copied: boolean; size?: number; tone?: "foreground" | "primaryForeground" | "secondaryForeground" }) {
  const reduced = useReducedMotion();
  const { colors } = useTheme();
  const copyO = useSharedValue(copied ? 0 : 1);
  const copyS = useSharedValue(copied ? GLYPH_FROM : 1);
  const checkO = useSharedValue(copied ? 1 : 0);
  const draw = useSharedValue(copied ? 1 : 0);

  React.useEffect(() => {
    if (copied) {
      // The copy glyph dims while the check ignites and draws — no beat.
      copyO.value = withTiming(0, DIM);
      copyS.value = reduced ? 1 : withTiming(GLYPH_FROM, DIM);
      checkO.value = withTiming(1, IGNITE);
      draw.value = reduced ? 1 : 0;
      if (!reduced) draw.value = withTiming(1, CHECK_DRAW);
    } else {
      // Clearing never un-draws — the check dims and the copy glyph ignites.
      checkO.value = withTiming(0, DIM);
      copyO.value = withTiming(1, IGNITE);
      if (reduced) copyS.value = 1;
      else {
        copyS.value = GLYPH_FROM;
        copyS.value = withSpring(1, spring.swap);
      }
    }
  }, [copied, reduced, copyO, copyS, checkO, draw]);

  const copyStyle = useAnimatedStyle(() => ({
    opacity: copyO.value,
    transform: [{ scale: copyS.value }],
  }));
  const checkStyle = useAnimatedStyle(() => ({
    opacity: checkO.value,
  }));
  const pathProps = useAnimatedProps(() => ({ strokeDashoffset: (1 - draw.value) * CHECK_LEN }));
  const checkColor = tone === "primaryForeground" ? colors.primaryForeground : colors.success;

  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      <Animated.View style={copyStyle} className="absolute">
        <Icon name="copy" size="sm" color={tone} />
      </Animated.View>
      <Animated.View style={checkStyle} className="absolute">
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <AnimatedPath
            d={CHECK_PATH}
            stroke={checkColor}
            strokeWidth={2.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            strokeDasharray={CHECK_LEN}
            animatedProps={pathProps}
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

/** "Copy" ↔ "Copied" label that swaps in place; sized to the longer word. */
function SwapLabel({ copied, copyLabel, copiedLabel, className }: { copied: boolean; copyLabel: string; copiedLabel: string; className?: string }) {
  const reduced = useReducedMotion();
  const idleO = useSharedValue(copied ? 0 : 1);
  const idleS = useSharedValue(1);
  const doneO = useSharedValue(copied ? 1 : 0);
  const doneS = useSharedValue(1);
  React.useEffect(() => {
    const [inO, inS, outO, outS] = copied ? [doneO, doneS, idleO, idleS] : [idleO, idleS, doneO, doneS];
    outO.value = withTiming(0, DIM);
    inO.value = withTiming(1, IGNITE);
    if (reduced) {
      outS.value = 1;
      inS.value = 1;
      return;
    }
    outS.value = withTiming(LABEL_FROM, DIM);
    inS.value = LABEL_FROM;
    inS.value = withSpring(1, spring.swap);
  }, [copied, reduced, idleO, idleS, doneO, doneS]);
  const outStyle = useAnimatedStyle(() => ({
    opacity: idleO.value,
    transform: [{ scale: idleS.value }],
  }));
  const inStyle = useAnimatedStyle(() => ({
    opacity: doneO.value,
    transform: [{ scale: doneS.value }],
  }));
  const longer = copiedLabel.length > copyLabel.length ? copiedLabel : copyLabel;
  return (
    <View className="justify-center overflow-hidden">
      <Text className={cn("opacity-0", className)} accessibilityElementsHidden importantForAccessibility="no">
        {longer}
      </Text>
      <Animated.Text style={outStyle} className={cn("absolute", className)} numberOfLines={1}>
        {copyLabel}
      </Animated.Text>
      <Animated.Text style={inStyle} className={cn("absolute", className)} numberOfLines={1}>
        {copiedLabel}
      </Animated.Text>
    </View>
  );
}

function groupDisplay(value: string, size?: number) {
  if (!size) return value;
  const raw = value.replace(/\s+/g, "");
  return raw.match(new RegExp(`.{1,${size}}`, "g"))?.join(" ") ?? raw;
}

export interface CopyFieldProps extends Omit<ViewProps, "className"> {
  /** Copied verbatim. */
  value: string;
  /** Shown instead of `value` (formatting only). */
  display?: string;
  /** Caption above the value (field / box) — also names the copy action for screen readers. */
  label?: string;
  /** Helper line under the field. */
  description?: string;
  /** Default "field". */
  appearance?: "field" | "inline" | "box";
  /** Monospaced value — codes, IBANs, keys. */
  mono?: boolean;
  /** Insert a space every n characters in the displayed value. */
  groupSize?: number;
  /** Where a long value is cut. Default "middle" (keeps both ends of links and addresses). */
  truncate?: "middle" | "tail" | "none";
  /** Hide all but the last `maskVisible` characters until revealed. */
  masked?: boolean;
  /** Characters left visible while masked. Default 4. */
  maskVisible?: number;
  copyLabel?: string;
  copiedLabel?: string;
  /** ms the copied state lasts. Default 1800. */
  resetAfter?: number;
  onCopy?: (value: string) => void;
  /** Bump to light the value as if it were just copied — e.g. every row
   *  lighting in turn when a "Copy all" button copies the set. */
  highlight?: number;
  /** ms before a `highlight` lights the value (row stagger). Default 0. */
  highlightDelay?: number;
  disabled?: boolean;
  className?: string;
  valueClassName?: string;
}

export const CopyField = forwardRef<React.ElementRef<typeof View>, CopyFieldProps>(function CopyField(
  {
    value,
    display,
    label,
    description,
    appearance = "field",
    mono = false,
    groupSize,
    truncate = "middle",
    masked = false,
    maskVisible = 4,
    copyLabel = "Copy",
    copiedLabel = "Copied",
    resetAfter,
    onCopy,
    highlight = 0,
    highlightDelay = 0,
    disabled = false,
    className,
    valueClassName,
    ...props
  },
  ref
) {
  const haptic = useHaptic();
  const reduced = useReducedMotion();
  const { colors } = useTheme();
  const press = usePressAnimation({ pressedScale: appearance === "box" ? 0.98 : 0.99, disabled });
  const [revealed, setRevealed] = React.useState(false);
  const { copied, copy, runs } = useCopy(value, {
    onCopy,
    resetAfter,
    announcement: label ? `${label} copied` : "Copied",
  });
  // A direct copy lights the value at once; an outside highlight after its stagger.
  const light = { run: runs, highlight, highlightDelay };

  // Promo box: the dashed edge brightens to a solid accent line for the hold.
  const edge = useSharedValue(0);
  React.useEffect(() => {
    if (!runs || appearance !== "box") return;
    edge.value = withSequence(withTiming(1, IGNITE), withDelay(VALUE_HOLD, withTiming(0, VALUE_SETTLE)));
  }, [runs, appearance, edge]);
  const edgeStyle = useAnimatedStyle(() => ({ opacity: edge.value }));
  const sheen = <Sheen run={runs} color={colors.primary} strength={COPY_SHEEN} />;

  const shown = React.useMemo(() => {
    const base = groupDisplay(display ?? value, groupSize);
    if (!masked || revealed) return base;
    const raw = (display ?? value).replace(/\s+/g, "");
    return `•••• ${raw.slice(-maskVisible)}`;
  }, [display, value, groupSize, masked, revealed, maskVisible]);

  const ellipsize = truncate === "none" ? undefined : truncate;
  const lines = truncate === "none" ? undefined : 1;

  // "Copied" note in the label row — the inline confirmation.
  const noteO = useSharedValue(0);
  React.useEffect(() => {
    noteO.value = withTiming(copied ? 1 : 0, copied ? IGNITE : DIM);
  }, [copied, noteO]);
  const noteStyle = useAnimatedStyle(() => ({
    opacity: noteO.value,
    transform: [{ translateX: reduced ? 0 : (1 - noteO.value) * NOTE_SLIDE }],
  }));

  const onPress = (_e: GestureResponderEvent) => {
    if (disabled) return;
    copy();
  };

  const eye = masked ? (
    <Pressable
      onPress={() => {
        haptic.selection();
        setRevealed((r) => !r);
      }}
      hitSlop={4}
      className="h-11 w-11 items-center justify-center rounded-full"
      accessibilityRole="button"
      accessibilityState={{ expanded: revealed }}
      accessibilityLabel={revealed ? `Hide ${label ?? "value"}` : `Show ${label ?? "value"}`}
    >
      <Icon name={revealed ? "eye-off" : "eye"} size="sm" color="mutedForeground" />
    </Pressable>
  ) : null;

  const a11y = {
    accessibilityRole: "button" as const,
    accessibilityLabel: `${label ? `${label}, ` : ""}${masked && !revealed ? "hidden" : shown}`,
    accessibilityHint: `Double tap to ${copyLabel.toLowerCase()}`,
    accessibilityState: { disabled },
  };

  const labelRow =
    label && appearance !== "inline" ? (
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-medium text-muted-foreground">{label}</Text>
        <Animated.View style={noteStyle} className="flex-row items-center gap-1">
          <Icon name="check" size="sm" color="success" />
          <Text className="text-sm font-medium text-success">{copiedLabel}</Text>
        </Animated.View>
      </View>
    ) : null;

  if (appearance === "box") {
    return (
      <View ref={ref} className={cn("w-full gap-2", className)} {...props}>
        {labelRow}
        <AnimatedPressable
          onPress={onPress}
          onPressIn={press.onPressIn}
          onPressOut={press.onPressOut}
          disabled={disabled}
          style={press.animatedStyle}
          className={cn(
            "w-full items-center gap-4 rounded-2xl border-2 border-dashed border-border px-5 py-6",
            disabled && "opacity-50"
          )}
          {...a11y}
        >
          {/* Solid accent edge over the dashed one — lit for the hold. */}
          <Animated.View
            pointerEvents="none"
            style={[{ position: "absolute", top: -2, left: -2, right: -2, bottom: -2 }, edgeStyle]}
            className="rounded-2xl border-2 border-primary"
          />
          <View className="w-full items-center overflow-hidden rounded-xl">
            <LitValue
              {...light}
              className={cn("text-3xl font-bold tracking-widest", mono && "font-mono", valueClassName)}
              numberOfLines={lines}
              ellipsizeMode={ellipsize}
            >
              {shown}
            </LitValue>
            {sheen}
          </View>
          <View className="h-11 flex-row items-center gap-2 rounded-full bg-primary px-5">
            <CopyGlyph copied={copied} tone="primaryForeground" />
            <SwapLabel
              copied={copied}
              copyLabel={copyLabel}
              copiedLabel={copiedLabel}
              className="text-[15px] font-semibold text-primary-foreground"
            />
          </View>
        </AnimatedPressable>
        {description ? <Text className="text-center text-sm text-muted-foreground">{description}</Text> : null}
      </View>
    );
  }

  if (appearance === "inline") {
    return (
      <AnimatedPressable
        ref={ref}
        onPress={onPress}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        disabled={disabled}
        style={press.animatedStyle}
        className={cn("min-h-11 flex-row items-center gap-1", disabled && "opacity-50", className)}
        {...a11y}
        {...props}
      >
        <View className="flex-1 justify-center self-stretch overflow-hidden">
          <LitValue
            {...light}
            className={cn("text-[15px] font-medium", mono && "font-mono tracking-wide", valueClassName)}
            numberOfLines={lines}
            ellipsizeMode={ellipsize}
          >
            {shown}
          </LitValue>
          {sheen}
        </View>
        {eye}
        <View className="h-11 w-11 items-center justify-center">
          <View className="h-8 w-8 items-center justify-center rounded-full bg-secondary">
            <CopyGlyph copied={copied} size={18} tone="secondaryForeground" />
          </View>
        </View>
      </AnimatedPressable>
    );
  }

  return (
    <View ref={ref} className={cn("w-full gap-2", className)} {...props}>
      {labelRow}
      <AnimatedPressable
        onPress={onPress}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        disabled={disabled}
        style={press.animatedStyle}
        className={cn(
          "min-h-14 w-full flex-row items-center overflow-hidden rounded-2xl bg-secondary pl-4 pr-1",
          disabled && "opacity-50"
        )}
        {...a11y}
      >
        <LitValue
          {...light}
          wrapClassName="flex-1"
          className={cn("text-base text-secondary-foreground", mono && "font-mono tracking-wide", valueClassName)}
          numberOfLines={lines}
          ellipsizeMode={ellipsize}
        >
          {shown}
        </LitValue>
        {eye}
        <View className="h-12 w-12 items-center justify-center">
          <CopyGlyph copied={copied} tone="secondaryForeground" />
        </View>
        {sheen}
      </AnimatedPressable>
      {description ? <Text className="text-sm text-muted-foreground">{description}</Text> : null}
    </View>
  );
});

CopyField.displayName = "CopyField";

export interface CopyButtonProps extends Omit<ViewProps, "className"> {
  /** Copied verbatim. */
  value: string;
  /** Default "Copy". */
  label?: string;
  /** Default "Copied". */
  copiedLabel?: string;
  /** "default" — accent/ink pill; "secondary" — neutral pill. */
  variant?: "default" | "secondary";
  /** md 44 · lg 52. Default "md". */
  size?: "md" | "lg";
  resetAfter?: number;
  onCopy?: (value: string) => void;
  disabled?: boolean;
  /** Spoken confirmation. Default "Copied". */
  announcement?: string;
  /** ms between the copy and the button's confirmation — let what was
   *  copied light up first (pair with CopyField `highlight`). Default 0. */
  confirmAfter?: number;
  className?: string;
}

/** Standalone pill — "Copy all codes", "Copy link". Glyph hands over to a check, label swaps in place. */
export const CopyButton = forwardRef<React.ElementRef<typeof View>, CopyButtonProps>(function CopyButton(
  {
    value,
    label = "Copy",
    copiedLabel = "Copied",
    variant = "secondary",
    size = "md",
    resetAfter,
    onCopy,
    disabled = false,
    announcement,
    confirmAfter,
    className,
    ...props
  },
  ref
) {
  const press = usePressAnimation({ pressedScale: size === "lg" ? 0.97 : 0.95, disabled });
  const { copied, copy } = useCopy(value, { onCopy, resetAfter, announcement, confirmAfter });
  const filled = variant === "default";
  return (
    <AnimatedPressable
      ref={ref}
      onPress={() => !disabled && copy()}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      disabled={disabled}
      style={press.animatedStyle}
      className={cn(
        "flex-row items-center justify-center gap-2 rounded-full px-5",
        size === "lg" ? "h-14" : "h-11",
        filled ? "bg-primary" : "bg-secondary",
        disabled && "opacity-50",
        className
      )}
      accessibilityRole="button"
      accessibilityLabel={copied ? copiedLabel : label}
      accessibilityState={{ disabled }}
      {...props}
    >
      <CopyGlyph copied={copied} tone={filled ? "primaryForeground" : "secondaryForeground"} />
      <SwapLabel
        copied={copied}
        copyLabel={label}
        copiedLabel={copiedLabel}
        className={cn("font-semibold", size === "lg" ? "text-base" : "text-[15px]", filled ? "text-primary-foreground" : "text-secondary-foreground")}
      />
    </AnimatedPressable>
  );
});

CopyButton.displayName = "CopyButton";
