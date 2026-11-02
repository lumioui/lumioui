import * as React from "react";
import { forwardRef } from "react";
import { Text, View, type LayoutChangeEvent, type ViewProps } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Sheen, cn, createVariant, ease, spring, tempo, timing, useReducedMotion } from "@lumioui/core";

/**
 * StatusDot — presence and live indicators, drawn as light.
 *   <StatusDot status="online" />
 *   <StatusDot status="dnd" ring />                     // cut out of an avatar
 *   <StatusDot status="away" variant="pill" />          // dot + "Away"
 *   <StatusDot status="live" variant="pill" />          // red "Live" pill, breathing
 *   <StatusDot status="online" glow />                  // lit point with a faint halo
 *
 * Each status has its own SHAPE as well as colour (team-chat idiom) so it
 * never relies on colour alone: online is a filled disc, away a hollow amber
 * ring, busy a filled red disc, do-not-disturb a red disc with a bar,
 * offline a hollow grey ring, live a red disc.
 *
 * Motion: the dot is at rest on first paint (a list of avatars never flashes
 * on mount). A status change swaps in place — the old shape dims to 0.96 on
 * timing.recede while the new one ignites over timing.fast, 0.96 → 1 on
 * spring.swap. In the pill, the width springs to the measured new label and
 * going live is the pill's own act: the red fill switches on, the label
 * ignites inside, one sheen crosses it. Only `live` loops — a slow luminance
 * breath (a real on-air state); stop it with `animate={false}` off-screen.
 * Reduced motion keeps the fades and the breath, drops scale and width springs.
 * Expo Go compatible.
 */

export type PresenceStatus = "online" | "away" | "busy" | "dnd" | "offline" | "live";

/** Diameter per size, in pt. */
const DIAMETER = { xs: 8, sm: 10, md: 12, lg: 14 } as const;

/** Swap in place — outgoing dims to this scale, incoming grows from it. */
const SWAP_SCALE = 0.96;
const IGNITE = { duration: timing.fast.duration, easing: Easing.bezier(...ease.out) };
const DIM = { duration: timing.recede.duration, easing: Easing.bezier(...ease.in) };
/** Live breath — each half on tempo.roll × 1.5 (~0.9s, a ~1.8s breath):
 *  slow enough to stay below notice, never read as an alarm. */
const BREATH = { duration: tempo.roll * 1.5, easing: Easing.bezier(...ease.inOut) };
const BREATH_LOW = 0.7;
/** `glow`: the online halo — a faint pool of the dot's own light. */
const HALO_SPREAD = 6;
const HALO_ALPHA = 0.25;
/** `glow`: away/offline read as unlit filaments. */
const FILAMENT = 0.7;

const DEFAULT_LABEL: Record<PresenceStatus, string> = {
  online: "Active",
  away: "Away",
  busy: "Busy",
  dnd: "Do not disturb",
  offline: "Offline",
  live: "Live",
};

/** Fill/stroke per status. Hollow statuses draw a border instead of a fill. */
const dotVariants = createVariant({
  base: "items-center justify-center rounded-full",
  variants: {
    status: {
      online: "bg-success",
      away: "border-warning bg-transparent",
      busy: "bg-destructive",
      dnd: "bg-destructive",
      offline: "border-muted-foreground bg-transparent",
      live: "bg-destructive",
    },
  },
  defaultVariants: { status: "online" },
});

/** Pill row (padding + gap live on the row so a measuring copy matches it). */
const rowVariants = createVariant({
  base: "flex-row items-center",
  variants: {
    size: {
      xs: "h-6 gap-1.5 px-2",
      sm: "h-6 gap-1.5 px-2.5",
      md: "h-7 gap-2 px-3",
      lg: "h-8 gap-2 px-3",
    },
  },
  defaultVariants: { size: "sm" },
});
const PILL_H = { xs: "h-6", sm: "h-6", md: "h-7", lg: "h-8" } as const;

export interface StatusDotProps extends Omit<ViewProps, "className" | "children"> {
  /** Presence or live state. Default "online". */
  status?: PresenceStatus;
  /** Dot diameter — xs 8 · sm 10 · md 12 · lg 14. Default "sm". */
  size?: keyof typeof DIAMETER;
  /** "dot" renders the bare indicator; "pill" pairs it with a text label. Default "dot". */
  variant?: "dot" | "pill";
  /** Pill text. Defaults to the status name ("Active", "Away", "Live"…). */
  label?: string;
  /** Surface-coloured cut-out ring so the dot reads as punched out of an
   *  avatar or thumbnail. Default false. */
  ring?: boolean;
  /** Ring classes — border AND fill matching the surface the dot sits on
   *  (the fill shows through hollow away/offline rings). Default "border-card bg-card". */
  ringClassName?: string;
  /** Run the live breath. Defaults to true for `live`; ignored for other statuses.
   *  Set false when the row is off-screen or the stream is paused. */
  animate?: boolean;
  /** Status as light: online gets a faint halo of its own light, away and
   *  offline dim to unlit filaments. Default false. */
  glow?: boolean;
  /** Screen-reader label. Defaults to the status label ("Active"). */
  accessibilityLabel?: string;
  className?: string;
  /** Extra classes for the pill label. */
  textClassName?: string;
}

/** Slow luminance breath while a live state sits behind it. */
function useBreath(active: boolean) {
  const v = useSharedValue(1);
  React.useEffect(() => {
    if (!active) {
      cancelAnimation(v);
      v.value = withTiming(1, IGNITE);
      return;
    }
    v.value = 1;
    v.value = withRepeat(withTiming(BREATH_LOW, BREATH), -1, true);
    return () => cancelAnimation(v);
  }, [active, v]);
  return useAnimatedStyle(() => ({ opacity: v.value }));
}

function Glyph({
  status,
  d,
  onFill,
  breathing,
  glow,
}: {
  status: PresenceStatus;
  d: number;
  onFill: boolean;
  breathing: boolean;
  glow: boolean;
}) {
  const hollow = status === "away" || status === "offline";
  const breath = useBreath(breathing);
  const halo = d + HALO_SPREAD;
  return (
    <View style={{ width: d, height: d }} className="items-center justify-center">
      {glow && status === "online" ? (
        <View
          pointerEvents="none"
          style={{ position: "absolute", width: halo, height: halo, borderRadius: halo / 2, opacity: HALO_ALPHA }}
          className="bg-success"
        />
      ) : null}
      <Animated.View style={breath}>
        <View
          style={{
            width: d,
            height: d,
            borderWidth: hollow ? Math.max(2, Math.round(d / 4.5)) : 0,
            opacity: glow && hollow ? FILAMENT : 1,
          }}
          className={cn(dotVariants({ status }), onFill && "bg-destructive-foreground")}
        >
          {status === "dnd" ? (
            <View
              className="rounded-full bg-destructive-foreground"
              style={{ width: Math.round(d * 0.55), height: Math.max(2, Math.round(d / 5)) }}
            />
          ) : null}
        </View>
      </Animated.View>
    </View>
  );
}

interface Face {
  status: PresenceStatus;
  text: string;
  width: number;
}

export const StatusDot = forwardRef<React.ElementRef<typeof View>, StatusDotProps>(
  function StatusDot(
    {
      status = "online",
      size = "sm",
      variant = "dot",
      label,
      ring = false,
      ringClassName = "border-card bg-card",
      animate = true,
      glow = false,
      accessibilityLabel,
      className,
      textClassName,
      ...props
    },
    ref
  ) {
    const reduce = useReducedMotion();
    const d = DIAMETER[size];
    const isLive = status === "live";
    const text = label ?? DEFAULT_LABEL[status];
    const inPill = variant === "pill";

    // ── Swap in place ────────────────────────────────────────────────────
    // Rests at full on mount; the motion marks a status CHANGE only (a label
    // that ticks — "Live · 0:42" — updates in place without a swap).
    const [measuredW, setMeasuredW] = React.useState(0);
    const [outgoing, setOutgoing] = React.useState<Face | null>(null);
    const [sheen, setSheen] = React.useState(0);
    const last = React.useRef<Face>({ status, text, width: measuredW });
    const inOn = useSharedValue(1);
    const inGrow = useSharedValue(1);
    const outT = useSharedValue(1);
    const liveFill = useSharedValue(isLive ? 1 : 0);
    const outTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    React.useEffect(() => {
      const prev = last.current;
      last.current = { status, text, width: measuredW };
      if (prev.status === status) return;
      setOutgoing(prev);
      inOn.value = 0;
      inOn.value = withTiming(1, IGNITE);
      inGrow.value = reduce ? 1 : SWAP_SCALE;
      if (!reduce) inGrow.value = withSpring(1, spring.swap);
      outT.value = 0;
      outT.value = withTiming(1, DIM);
      liveFill.value = withTiming(isLive ? 1 : 0, isLive ? IGNITE : DIM);
      // Going live is the pill's act — one light pass crosses it.
      if (isLive && inPill) setSheen((n) => n + 1);
      if (outTimer.current) clearTimeout(outTimer.current);
      outTimer.current = setTimeout(() => setOutgoing(null), DIM.duration);
    }, [status, text, measuredW, isLive, inPill, reduce, inOn, inGrow, outT, liveFill]);
    React.useEffect(
      () => () => {
        if (outTimer.current) clearTimeout(outTimer.current);
      },
      []
    );

    const inStyle = useAnimatedStyle(() => ({
      opacity: inOn.value,
      transform: [{ scale: inGrow.value }],
    }));
    const outStyle = useAnimatedStyle(() => ({
      opacity: 1 - outT.value,
      transform: reduce ? [] : [{ scale: 1 - (1 - SWAP_SCALE) * outT.value }],
    }));

    // ── Pill width: spring to the measured label ─────────────────────────
    const width = useSharedValue(0);
    React.useEffect(() => {
      if (!measuredW) return;
      // First measure lands; later ones spring (or land, under reduced motion).
      width.value = width.value === 0 || reduce ? measuredW : withSpring(measuredW, spring.swap);
    }, [measuredW, reduce, width]);
    const widthStyle = useAnimatedStyle(() => (width.value > 0 ? { width: width.value } : {}));
    const fillStyle = useAnimatedStyle(() => ({ opacity: liveFill.value }));
    const onMeasure = (e: LayoutChangeEvent) => {
      const w = Math.ceil(e.nativeEvent.layout.width);
      if (w !== measuredW) setMeasuredW(w);
    };

    const a11y = {
      accessible: true,
      accessibilityRole: "text" as const,
      accessibilityLabel: accessibilityLabel ?? text,
    };

    if (inPill) {
      const row = (face: { status: PresenceStatus; text: string }, breathing: boolean) => {
        const live = face.status === "live";
        return (
          <>
            <Glyph status={face.status} d={d} onFill={live} breathing={breathing} glow={glow} />
            <Text
              numberOfLines={1}
              className={cn(
                "text-xs font-semibold",
                live ? "text-destructive-foreground" : "text-secondary-foreground",
                textClassName
              )}
            >
              {face.text}
            </Text>
          </>
        );
      };
      // Rows sit absolutely once the pill is measured, at their own widths,
      // so a growing pill clips its label instead of squeezing it.
      const placed = measuredW > 0;
      return (
        <Animated.View
          ref={ref}
          className={cn("self-start overflow-hidden rounded-full bg-secondary", PILL_H[size], className)}
          // The JS width holds the frame the rows go absolute; the spring
          // drives it from then on.
          style={[placed ? { width: measuredW } : null, widthStyle]}
          {...a11y}
          {...props}
        >
          <Animated.View
            pointerEvents="none"
            className="absolute bottom-0 left-0 right-0 top-0 bg-destructive"
            style={fillStyle}
          />
          {/* Measuring copy — the width the pill springs to. */}
          <View
            pointerEvents="none"
            style={{ position: "absolute", left: 0, top: 0, width: 1000, opacity: 0 }}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <View className={cn(rowVariants({ size }), "self-start")} onLayout={onMeasure}>
              {row({ status, text }, false)}
            </View>
          </View>
          <Animated.View
            className={rowVariants({ size })}
            style={[placed ? { position: "absolute", left: 0, top: 0, width: measuredW } : null, inStyle]}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            {row({ status, text }, isLive && animate)}
          </Animated.View>
          {outgoing ? (
            <Animated.View
              pointerEvents="none"
              className={rowVariants({ size })}
              style={[{ position: "absolute", left: 0, top: 0, width: outgoing.width || undefined }, outStyle]}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            >
              {row(outgoing, false)}
            </Animated.View>
          ) : null}
          <Sheen run={sheen} />
        </Animated.View>
      );
    }

    return (
      <View
        ref={ref}
        className={cn(
          "items-center justify-center self-start rounded-full",
          ring && cn("border-2", ringClassName),
          className
        )}
        {...a11y}
        {...props}
      >
        <View
          style={{ width: d, height: d }}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Animated.View style={inStyle}>
            <Glyph status={status} d={d} onFill={false} breathing={isLive && animate} glow={glow} />
          </Animated.View>
          {outgoing ? (
            <Animated.View pointerEvents="none" style={[{ position: "absolute", left: 0, top: 0 }, outStyle]}>
              <Glyph status={outgoing.status} d={d} onFill={false} breathing={false} glow={glow} />
            </Animated.View>
          ) : null}
        </View>
      </View>
    );
  }
);

StatusDot.displayName = "StatusDot";
