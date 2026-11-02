import * as React from "react";
import { forwardRef } from "react";
import { Text, View, type ViewProps } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import {
  BAND_STAGGER,
  announce,
  cn,
  createVariant,
  ease,
  spring,
  tempo,
  timing,
  useHaptic,
  useReducedMotion,
  useTheme,
  Sheen,
  SwitchOn,
} from "@lumioui/core";
import { Button } from "../button";
import { Icon, type IconName } from "../icon";

/**
 * ErrorState — what a screen or section shows when it can't: offline,
 * not found, server error, permission denied. A glyph disc, a plain title,
 * one line of help and a retry that tracks itself.
 *
 *   <ErrorState kind="offline" onRetry={refetch} />
 *   <ErrorState kind="server" layout="inline" autoRetry={10} onRetry={refetch} />
 *   <ErrorState kind="offline" structure={<BoardShape />} onRetry={refetch} onRecover={show} />
 *
 * It switches on like everything Lumio: glyph, then copy, then actions,
 * 120ms apart. Pass `structure` — the dim exact layout of the content that
 * failed — and the error is laid over it instead of a blank canvas. When a
 * retry succeeds and `onRecover` is set, the error dims (timing.recede), one
 * sheen passes across the dim structure, then `onRecover` fires so the real
 * blocks can switch on in its place (40ms rows).
 *
 * `onRetry` may return a Promise: the button spins while it runs; a rejection
 * flickers the glyph (a 4px kick into spring.shake, dipping to 0.6), buzzes a
 * warning and shows `retryFailedMessage`. `autoRetry` counts down and
 * retries on its own ("Retrying in 8s"), the seconds swapping in place.
 * Expo Go compatible.
 */

export type ErrorKind = "offline" | "not-found" | "server" | "permission" | "generic";

const DEFAULTS: Record<ErrorKind, { icon: IconName; title: string; description: string; retry: string; failed: string }> = {
  offline: {
    icon: "wifi-off",
    title: "You're offline",
    description: "Check your Wi-Fi or mobile data, then try again.",
    retry: "Try again",
    failed: "Still no connection.",
  },
  "not-found": {
    icon: "search",
    title: "Page not found",
    description: "The link may be broken, or the page was moved or deleted.",
    retry: "Go home",
    failed: "That didn't work.",
  },
  server: {
    icon: "alert-triangle",
    title: "Something went wrong on our end",
    description: "We're on it. Your data is safe; try again in a moment.",
    retry: "Try again",
    failed: "Still having trouble.",
  },
  permission: {
    icon: "lock",
    title: "Access needed",
    description: "Allow access in Settings to use this feature.",
    retry: "Open Settings",
    failed: "Access is still off.",
  },
  generic: {
    icon: "info",
    title: "Couldn't load this",
    description: "Something interrupted the request.",
    retry: "Try again",
    failed: "That didn't work.",
  },
};

const rootVariants = createVariant({
  base: "w-full",
  variants: {
    layout: {
      // Fills its parent and centres — a whole screen or tab that failed.
      screen: "flex-1 items-center justify-center gap-6 px-6 py-10",
      // A section inside a page — leading glyph, compact action.
      inline: "flex-row items-start gap-3 py-4",
    },
  },
  defaultVariants: { layout: "screen" },
});

export interface ErrorStateProps extends Omit<ViewProps, "className"> {
  /** Which failure — picks the glyph and default copy. Default "generic". */
  kind?: ErrorKind;
  /** "screen" (centred, fills its parent) or "inline" (a failed section). Default "screen". */
  layout?: "screen" | "inline";
  /** Override the title. */
  title?: string;
  /** Override the help line. */
  description?: string;
  /** Small reference under the help — "Error 503 · Ref 7Q2-K9". */
  code?: string;
  /** Override the glyph. */
  icon?: IconName;
  /** Replace the glyph disc with your own illustration. */
  illustration?: React.ReactNode;
  /** Primary action. May return a Promise — rejection counts as a failed retry. */
  onRetry?: () => void | Promise<unknown>;
  /** Primary action label. Default per kind ("Try again", "Open Settings"…). */
  retryLabel?: string;
  /** Shown (and announced) after a failed retry. */
  retryFailedMessage?: string;
  /** Quieter second action. */
  secondaryAction?: { label: string; onPress: () => void };
  /** Retry automatically after this many seconds (restarts after each failure). */
  autoRetry?: number;
  /** The exact layout of the content that failed, drawn dim under the error. */
  structure?: React.ReactNode;
  /** After a successful retry: the error dims, a sheen crosses the structure, then this fires — show the real content here. */
  onRecover?: () => void;
  className?: string;
}

/** The flicker: a 4px kick released into the shake spring. */
const KICK = 4;
const KICK_IN = { duration: timing.instant.duration / 2 };
/** The glyph dips to this on a refused retry. */
const GLYPH_DIP = 0.6;
/** Structure brightness under the error — the shape reads, the error leads. */
const STRUCTURE_DIM = 0.16;
/** …and once the error has cleared, before the real blocks switch on. */
const STRUCTURE_LIT = 0.35;
/** Countdown seconds rise this far as they swap (direction: time moving). */
const SWAP_RISE = 4;
/** onRecover fires once the error has dimmed and the sheen is mostly across. */
const RECOVER_AT = timing.recede.duration + tempo.drift * 0.7;
const IGNITE = { ...timing.fast, easing: Easing.bezier(...ease.out) } as const;
const DIM = { ...timing.recede, easing: Easing.bezier(...ease.in) } as const;

/** A status line that swaps in place when its text changes (dim / ignite, ≤6px). */
function SwapLine({ text, className }: { text: string; className?: string }) {
  const reduce = useReducedMotion();
  const lit = useSharedValue(1);
  const rise = useSharedValue(0);
  const prev = React.useRef(text);
  React.useEffect(() => {
    if (prev.current === text) return;
    prev.current = text;
    lit.value = 0.4;
    lit.value = withTiming(1, IGNITE);
    if (reduce) return;
    rise.value = SWAP_RISE;
    rise.value = withSpring(0, spring.swap);
  }, [text, reduce, lit, rise]);
  const style = useAnimatedStyle(() => ({ opacity: lit.value, transform: [{ translateY: rise.value }] }));
  return (
    <Animated.View style={style}>
      <Text accessibilityLiveRegion="polite" className={className}>
        {text}
      </Text>
    </Animated.View>
  );
}

export const ErrorState = forwardRef<React.ElementRef<typeof View>, ErrorStateProps>(
  function ErrorState(
    {
      kind = "generic",
      layout = "screen",
      title,
      description,
      code,
      icon,
      illustration,
      onRetry,
      retryLabel,
      retryFailedMessage,
      secondaryAction,
      autoRetry,
      structure,
      onRecover,
      className,
      ...props
    },
    ref
  ) {
    const d = DEFAULTS[kind];
    const haptics = useHaptic();
    const reduce = useReducedMotion();
    const { colors } = useTheme();
    const inline = layout === "inline";
    const [busy, setBusy] = React.useState(false);
    const [failed, setFailed] = React.useState(false);
    const [recovering, setRecovering] = React.useState(false);
    const [sheen, setSheen] = React.useState(0);
    const [countdown, setCountdown] = React.useState<number | null>(autoRetry ?? null);

    const kickX = useSharedValue(0);
    const glyphLit = useSharedValue(1);
    const errorShown = useSharedValue(1);
    const structureLit = useSharedValue(STRUCTURE_DIM);
    const glyphStyle = useAnimatedStyle(() => ({
      opacity: glyphLit.value,
      transform: [{ translateX: kickX.value }],
    }));
    const errorStyle = useAnimatedStyle(() => ({ opacity: errorShown.value }));
    const structureStyle = useAnimatedStyle(() => ({ opacity: structureLit.value }));

    const failMessage = retryFailedMessage ?? d.failed;
    const mounted = React.useRef(true);
    const recoverTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    React.useEffect(
      () => () => {
        mounted.current = false;
        if (recoverTimer.current) clearTimeout(recoverTimer.current);
      },
      []
    );

    const runRetry = React.useCallback(async () => {
      if (!onRetry || busy || recovering) return;
      setBusy(true);
      setFailed(false);
      setCountdown(null);
      try {
        await onRetry();
        if (!mounted.current) return;
        setBusy(false);
        if (onRecover) {
          // Recovery: the error dims, light crosses the structure, the content takes over.
          setRecovering(true);
          errorShown.value = withTiming(0, DIM);
          structureLit.value = withTiming(STRUCTURE_LIT, { ...timing.slow, easing: Easing.bezier(...ease.out) });
          setSheen((n) => n + 1);
          haptics.light();
          recoverTimer.current = setTimeout(() => onRecover(), structure ? RECOVER_AT : DIM.duration);
        }
      } catch {
        if (!mounted.current) return;
        setBusy(false);
        setFailed(true);
        haptics.warning();
        announce(failMessage);
        // Flicker for "can't": the glyph dips while it kicks 4px and rings home.
        glyphLit.value = withSequence(withTiming(GLYPH_DIP, timing.instant), withTiming(1, timing.normal));
        if (!reduce) kickX.value = withSequence(withTiming(-KICK, KICK_IN), withSpring(0, spring.shake));
        if (autoRetry) setCountdown(autoRetry);
      }
    }, [onRetry, busy, recovering, onRecover, structure, haptics, failMessage, reduce, kickX, glyphLit, errorShown, structureLit, autoRetry]);

    // Auto-retry countdown — one state update per second, never per frame.
    React.useEffect(() => {
      if (countdown == null || busy) return;
      if (countdown <= 0) {
        void runRetry();
        return;
      }
      const t = setTimeout(() => setCountdown((c) => (c == null ? c : c - 1)), 1000);
      return () => clearTimeout(t);
    }, [countdown, busy, runRetry]);

    const glyph = illustration ?? (
      <View
        className={cn(
          "items-center justify-center rounded-full bg-secondary",
          inline ? "h-10 w-10" : "h-16 w-16"
        )}
      >
        <Icon name={icon ?? d.icon} size={inline ? "sm" : "lg"} color="foreground" />
      </View>
    );

    const status = busy
      ? "Retrying…"
      : countdown != null && countdown > 0
        ? `Retrying in ${countdown}s`
        : failed
          ? failMessage
          : null;

    const copy = (
      <View className={cn("gap-2", inline ? "flex-1" : "items-center")}>
        <Text
          accessibilityRole="header"
          className={cn(
            "font-semibold text-foreground",
            inline ? "text-base" : "text-center text-2xl tracking-tight"
          )}
        >
          {title ?? d.title}
        </Text>
        <Text
          className={cn("text-muted-foreground", inline ? "text-sm leading-5" : "max-w-[320px] text-center text-base leading-6")}
        >
          {description ?? d.description}
        </Text>
        {code ? (
          <Text className={cn("text-xs text-muted-foreground tabular-nums", !inline && "text-center")} selectable>
            {code}
          </Text>
        ) : null}
        {status ? (
          <SwapLine
            text={status}
            className={cn(
              "text-sm font-medium tabular-nums",
              failed && !busy && countdown == null ? "text-destructive" : "text-muted-foreground",
              !inline && "text-center"
            )}
          />
        ) : null}
      </View>
    );

    const retryText = retryLabel ?? d.retry;
    const actions =
      onRetry || secondaryAction ? (
        <View className={cn(inline ? "flex-row items-center gap-2 pt-2" : "w-full max-w-[320px] gap-2")}>
          {onRetry ? (
            <Button
              size={inline ? "sm" : "lg"}
              variant={inline ? "secondary" : "default"}
              loading={busy}
              asyncTracking={false}
              onPress={() => void runRetry()}
              className={inline ? undefined : "w-full"}
            >
              {countdown != null && countdown > 0 && inline ? "Retry now" : retryText}
            </Button>
          ) : null}
          {secondaryAction ? (
            <Button
              size={inline ? "sm" : "lg"}
              variant="ghost"
              onPress={secondaryAction.onPress}
              className={inline ? undefined : "w-full"}
            >
              {secondaryAction.label}
            </Button>
          ) : null}
        </View>
      ) : null;

    // Things switch on: glyph, then copy, then actions, one band apart.
    const body = (
      <Animated.View
        ref={structure ? undefined : ref}
        className={cn(rootVariants({ layout }), !structure && className)}
        style={errorStyle}
        accessibilityRole="alert"
        pointerEvents={recovering ? "none" : "auto"}
        {...(structure ? {} : props)}
      >
        <SwitchOn>
          <Animated.View style={glyphStyle}>{glyph}</Animated.View>
        </SwitchOn>
        {inline ? (
          <View className="flex-1">
            <SwitchOn delay={BAND_STAGGER}>{copy}</SwitchOn>
            {actions ? <SwitchOn delay={BAND_STAGGER * 2}>{actions}</SwitchOn> : null}
          </View>
        ) : (
          <>
            <SwitchOn delay={BAND_STAGGER} className="w-full items-center">
              {copy}
            </SwitchOn>
            {actions ? (
              <SwitchOn delay={BAND_STAGGER * 2} className="w-full items-center">
                {actions}
              </SwitchOn>
            ) : null}
          </>
        )}
      </Animated.View>
    );

    if (!structure) return body;

    // The failed content's exact layout, dim, with the error laid over it.
    return (
      <View ref={ref} className={cn("w-full", !inline && "flex-1", className)} {...props}>
        <View
          className="overflow-hidden rounded-2xl"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          pointerEvents="none"
        >
          <Animated.View style={structureStyle}>{structure}</Animated.View>
          <Sheen run={sheen} color={colors.primary} strength={0.3} />
        </View>
        <View className={cn("absolute inset-0", !inline && "items-center justify-center")}>{body}</View>
      </View>
    );
  }
);

ErrorState.displayName = "ErrorState";

// Exposed for tests / custom wrappers that want the stock copy.
export const errorStateDefaults = DEFAULTS;
