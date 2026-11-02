import * as React from "react";
import { forwardRef } from "react";
import { Pressable, View, type GestureResponderEvent, type LayoutChangeEvent, type ViewProps } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  Extrapolation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { AnimatedPressable, cn, ease, spring, tempo, timing, useHaptic, usePressAnimation, useReducedMotion, useTheme } from "@lumioui/core";
import { Icon } from "../icon/icon";
import { Text } from "../text/text";

/**
 * Pagination — the three ways a real app pages content:
 *   <Pagination total={12} page={page} onPageChange={setPage} />   numbered pager
 *   <PageDots count={5} progress={scrollProgress} />                scroll-coupled page dots
 *   <LoadMore onLoadMore={fetchNext} hasMore remaining={24} />      "Show more" / infinite footer
 * Also available as Pagination.Dots and Pagination.LoadMore.
 *
 * Pagination is chrome, so its light stays quiet: the current page's disc
 * switches on where it is (no sliding through other numbers), the dots are
 * lamps whose brightness follows the finger, and a loading footer swaps its
 * label in place for three dots that brighten in turn.
 * Expo Go compatible.
 */

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

const IGNITE = { duration: timing.fast.duration, easing: Easing.bezier(...ease.out) } as const;
const DIM = { duration: timing.recede.duration, easing: Easing.bezier(...ease.in) } as const;

/* ------------------------------------------------------------------ */
/* Numbered pager                                                      */
/* ------------------------------------------------------------------ */

type PageToken = number | "start-ellipsis" | "end-ellipsis";

/** Page list with ellipses — always `boundaries` pages at each edge and
 *  `siblings` pages either side of the current one, so the row width stays
 *  constant while you page (no jumping arrows). */
function buildPages(page: number, total: number, siblings: number, boundaries: number): PageToken[] {
  const slots = boundaries * 2 + siblings * 2 + 3;
  if (total <= slots) return Array.from({ length: total }, (_, i) => i + 1);
  const left = Math.max(page - siblings, boundaries + 2);
  const right = Math.min(page + siblings, total - boundaries - 1);
  const showStartGap = left > boundaries + 2;
  const showEndGap = right < total - boundaries - 1;
  const out: PageToken[] = [];
  for (let i = 1; i <= boundaries; i++) out.push(i);
  if (!showStartGap) {
    for (let i = boundaries + 1; i <= boundaries + 2 + siblings * 2; i++) out.push(i);
    out.push("end-ellipsis");
  } else if (!showEndGap) {
    out.push("start-ellipsis");
    for (let i = total - boundaries - 1 - siblings * 2; i <= total - boundaries; i++) out.push(i);
  } else {
    out.push("start-ellipsis");
    for (let i = left; i <= right; i++) out.push(i);
    out.push("end-ellipsis");
  }
  for (let i = total - boundaries + 1; i <= total; i++) out.push(i);
  return out;
}

/** 40pt cells (hitSlop to 44) — the pager cell size. */
const CELL = 40;
/** Smallest a cell may get when the row has to fit a narrow screen. */
const CELL_MIN = 32;
/** Cell size the row resolved for its width (CELL unless it had to shrink). */
const CellSize = React.createContext(CELL);

export interface PaginationProps extends Omit<ViewProps, "className"> {
  /** Total number of pages. */
  total: number;
  /** Controlled current page (1-based). */
  page?: number;
  /** Uncontrolled initial page (1-based). Default 1. */
  defaultPage?: number;
  /** Fires with the new page when a number or arrow is tapped. */
  onPageChange?: (page: number) => void;
  /** Pages shown either side of the current one. Default 1. */
  siblings?: number;
  /** Pages always shown at each end. Default 1. */
  boundaries?: number;
  /**
   * "numbers" — ‹ 1 … 4 5 6 … 12 › with a current-page disc that switches on in place.
   * "compact" — ‹ Page 5 of 12 › for narrow rows and table footers.
   */
  variant?: "numbers" | "compact";
  /** Hide the previous / next arrows. Default false. */
  hideArrows?: boolean;
  /** Disable every control. */
  disabled?: boolean;
  /** Haptic on page change. Default true. */
  haptic?: boolean;
  className?: string;
}

interface ArrowProps {
  dir: "prev" | "next";
  disabled: boolean;
  onPress: () => void;
}

function Arrow({ dir, disabled, onPress }: ArrowProps) {
  const cell = React.useContext(CellSize);
  const press = usePressAnimation({ pressedScale: 0.9, disabled });
  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      disabled={disabled}
      hitSlop={4}
      style={[{ width: cell, height: cell }, press.animatedStyle]}
      className="items-center justify-center rounded-full"
      accessibilityRole="button"
      accessibilityLabel={dir === "prev" ? "Previous page" : "Next page"}
      accessibilityState={{ disabled }}
      aria-disabled={disabled}
    >
      <Icon name={dir === "prev" ? "chevron-left" : "chevron-right"} size="md" color="foreground" />
    </AnimatedPressable>
  );
}

interface PageCellProps {
  page: number;
  active: boolean;
  disabled: boolean;
  onPress: (page: number) => void;
}

/** The current page's disc switches on from this scale (radio rule — the
 *  light doesn't travel between numbers). */
const DISC_FROM = 0.94;

const PageCell = React.memo(function PageCell({ page, active, disabled, onPress }: PageCellProps) {
  const cell = React.useContext(CellSize);
  const press = usePressAnimation({ pressedScale: 0.9, disabled });
  const reduceMotion = useReducedMotion();
  const lit = useSharedValue(active ? 1 : 0);
  const scale = useSharedValue(1);
  const first = React.useRef(true);
  React.useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    lit.value = withTiming(active ? 1 : 0, active ? IGNITE : DIM);
    if (!active || reduceMotion) return;
    scale.value = DISC_FROM;
    scale.value = withSpring(1, spring.swap);
  }, [active, reduceMotion, lit, scale]);
  const discStyle = useAnimatedStyle(() => ({ opacity: lit.value, transform: [{ scale: scale.value }] }));
  // Ink crossfades with the disc rather than flipping before it lights.
  const restInk = useAnimatedStyle(() => ({ opacity: 1 - lit.value }));
  const litInk = useAnimatedStyle(() => ({ opacity: lit.value }));
  return (
    <AnimatedPressable
      onPress={() => onPress(page)}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      disabled={disabled}
      hitSlop={2}
      style={[{ width: cell, height: cell }, press.animatedStyle]}
      className="items-center justify-center rounded-full"
      accessibilityRole="button"
      accessibilityLabel={`Page ${page}`}
      accessibilityState={{ selected: active, disabled }}
      aria-current={active ? "page" : undefined}
    >
      <Animated.View
        pointerEvents="none"
        style={[{ position: "absolute", top: 0, left: 0, width: cell, height: cell }, discStyle]}
        className="rounded-full bg-primary"
      />
      <Animated.Text style={restInk} className="text-[15px] font-medium tabular-nums text-foreground">
        {page}
      </Animated.Text>
      <Animated.View pointerEvents="none" style={[{ position: "absolute", top: 0, left: 0, width: cell, height: cell }, litInk]} className="items-center justify-center">
        <Text className="text-[15px] font-semibold tabular-nums text-primary-foreground">{page}</Text>
      </Animated.View>
    </AnimatedPressable>
  );
});

const PaginationRoot = forwardRef<React.ElementRef<typeof View>, PaginationProps>(function Pagination(
  {
    total,
    page: controlledPage,
    defaultPage = 1,
    onPageChange,
    siblings = 1,
    boundaries = 1,
    variant = "numbers",
    hideArrows = false,
    disabled = false,
    haptic = true,
    className,
    onLayout,
    ...props
  },
  ref
) {
  const haptics = useHaptic(haptic);
  const [avail, setAvail] = React.useState(0);
  const [internal, setInternal] = React.useState(defaultPage);
  const safeTotal = Math.max(1, total);
  // Resolved during render — never mirrored in an effect.
  const page = clamp(controlledPage ?? internal, 1, safeTotal);

  const go = React.useCallback(
    (next: number) => {
      const p = clamp(next, 1, safeTotal);
      if (p === page || disabled) return;
      haptics.selection();
      if (controlledPage === undefined) setInternal(p);
      onPageChange?.(p);
    },
    [page, safeTotal, disabled, haptics, controlledPage, onPageChange]
  );

  const tokens = React.useMemo(() => buildPages(page, safeTotal, siblings, boundaries), [page, safeTotal, siblings, boundaries]);

  const arrows = !hideArrows;

  // A phone can be narrower than the full row (‹ 1 2 3 4 5 … 12 › is ~350pt):
  // shrink every cell evenly, never below CELL_MIN, instead of overflowing.
  const units =
    tokens.reduce<number>((n, t) => n + (typeof t === "number" ? 1 : (CELL - 8) / CELL), 0) + (arrows ? 2 : 0);
  const cell =
    variant === "numbers" && avail > 0 && units * CELL > avail ? Math.max(CELL_MIN, Math.floor(avail / units)) : CELL;
  const handleLayout = (e: LayoutChangeEvent) => {
    setAvail(e.nativeEvent.layout.width);
    onLayout?.(e);
  };

  return (
    <View
      ref={ref}
      // Fills its parent's width (contents stay centred) so it can measure
      // how much room the row really has.
      className={cn("flex-row items-center justify-center self-stretch", disabled && "opacity-50", className)}
      accessibilityLabel={`Page ${page} of ${safeTotal}`}
      {...props}
      onLayout={handleLayout}
    >
      <CellSize.Provider value={cell}>
      {arrows ? <Arrow dir="prev" disabled={disabled || page <= 1} onPress={() => go(page - 1)} /> : null}

      {variant === "compact" ? (
        <View className="min-w-[132px] items-center px-2" accessibilityLiveRegion="polite">
          <Text className="text-[15px] font-medium tabular-nums">
            Page {page} <Text className="text-[15px] text-muted-foreground">of {safeTotal}</Text>
          </Text>
        </View>
      ) : (
        <View className="flex-row items-center">
          {tokens.map((t) =>
            typeof t === "number" ? (
              <PageCell key={t} page={t} active={t === page} disabled={disabled} onPress={go} />
            ) : (
              <View key={t} style={{ width: cell - 8, height: cell }} className="items-center justify-center" accessible={false}>
                <Text className="text-[15px] text-muted-foreground">…</Text>
              </View>
            )
          )}
        </View>
      )}

      {arrows ? <Arrow dir="next" disabled={disabled || page >= safeTotal} onPress={() => go(page + 1)} /> : null}
      </CellSize.Provider>
    </View>
  );
});
PaginationRoot.displayName = "Pagination";

/* ------------------------------------------------------------------ */
/* Page dots                                                           */
/* ------------------------------------------------------------------ */

const DOT = 7;
const PILL = 22;
const DOT_GAP = 8;
/** How far the active dot stretches into a pill. */
const STRETCH = PILL - DOT;
/** Dots are lamps: brightness is the readout. Off lamps sit here. */
const LAMP_OFF = 0.25;

export interface PageDotsProps extends Omit<ViewProps, "className"> {
  /** Number of pages. */
  count: number;
  /** Current page (0-based). Used when `progress` isn't supplied. */
  index?: number;
  /**
   * Continuous page position (0 … count-1) on the UI thread — e.g. scrollX /
   * pageWidth from useAnimatedScrollHandler. The dots morph with the finger
   * instead of snapping when the page settles.
   */
  progress?: SharedValue<number>;
  /** Tap left / right of the active dot to step a page (page-control style). */
  onIndexChange?: (index: number) => void;
  /** "pill" — active dot stretches into a capsule. "dot" — classic page dots. Default "pill". */
  variant?: "pill" | "dot";
  /** "default" ink on canvas, "inverse" white for dots over photos/video. */
  tone?: "default" | "inverse";
  className?: string;
}

interface DotProps {
  i: number;
  pos: SharedValue<number>;
  variant: "pill" | "dot";
  color: string;
}

/**
 * One lamp. Brightness and stretch follow the finger on the UI thread.
 * The pill is built from transforms only — a fixed left cap, a body that
 * scales out along X and a right cap that travels with it — so the caps
 * stay truly round and nothing re-lays out per frame. Earlier lamps'
 * stretch pushes this one right by clamp(i − pos, 0, 1) × STRETCH, which
 * keeps the row exactly as wide as the old width-animated one.
 */
function Dot({ i, pos, variant, color }: DotProps) {
  const pill = variant === "pill";
  const lampStyle = useAnimatedStyle(() => {
    // t = 1 on the active page, falling to 0 one page away — value-coupled.
    const t = interpolate(Math.abs(pos.value - i), [0, 1], [1, 0], Extrapolation.CLAMP);
    const pushed = pill ? Math.min(Math.max(i - pos.value, 0), 1) * STRETCH : 0;
    return {
      opacity: LAMP_OFF + t * (1 - LAMP_OFF),
      transform: [{ translateX: pushed }],
    };
  });
  const bodyStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: interpolate(Math.abs(pos.value - i), [0, 1], [1, 0], Extrapolation.CLAMP) }],
  }));
  const capStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(Math.abs(pos.value - i), [0, 1], [1, 0], Extrapolation.CLAMP) * STRETCH }],
  }));
  const cap = { position: "absolute", top: 0, left: 0, width: DOT, height: DOT, borderRadius: DOT / 2, backgroundColor: color } as const;
  return (
    // Offscreen compositing so the overlapping cap/body share one opacity.
    <Animated.View needsOffscreenAlphaCompositing style={[{ width: DOT, height: DOT }, lampStyle]}>
      <View style={cap} />
      {pill ? (
        <>
          <Animated.View
            style={[{ position: "absolute", top: 0, left: DOT / 2, width: STRETCH, height: DOT, backgroundColor: color, transformOrigin: "0% 50%" }, bodyStyle]}
          />
          <Animated.View style={[cap, capStyle]} />
        </>
      ) : null}
    </Animated.View>
  );
}

export const PageDots = forwardRef<React.ElementRef<typeof View>, PageDotsProps>(function PageDots(
  { count, index = 0, progress, onIndexChange, variant = "pill", tone = "default", className, ...props },
  ref
) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const haptics = useHaptic();
  const local = useSharedValue(index);
  React.useEffect(() => {
    if (progress) return;
    local.value = reduceMotion ? index : withSpring(index, spring.layout);
  }, [index, progress, local, reduceMotion]);
  const pos = progress ?? local;
  const color = tone === "inverse" ? "#FFFFFF" : colors.foreground;
  const width = useSharedValue(0);

  const step = (delta: number) => {
    const next = clamp(index + delta, 0, count - 1);
    if (next === index) return;
    haptics.selection();
    onIndexChange?.(next);
  };

  const onPress = (e: GestureResponderEvent) => {
    if (!onIndexChange) return;
    // Left half steps back, right half steps forward — dots are too small
    // to hit one by one.
    step(e.nativeEvent.locationX < width.value / 2 ? -1 : 1);
  };

  return (
    <Pressable
      ref={ref}
      onPress={onPress}
      disabled={!onIndexChange}
      onLayout={(e) => (width.value = e.nativeEvent.layout.width)}
      hitSlop={{ top: 8, bottom: 8 }}
      className={cn("h-7 flex-row items-center justify-center self-center px-2", className)}
      // The pill's stretch is drawn by transforms — reserve its room once.
      style={{ gap: DOT_GAP, paddingRight: variant === "pill" ? 8 + STRETCH : 8 }}
      accessibilityRole="adjustable"
      accessibilityLabel="Page"
      accessibilityValue={{ text: `${index + 1} of ${count}` }}
      accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
      onAccessibilityAction={(e) => step(e.nativeEvent.actionName === "decrement" ? -1 : 1)}
      {...props}
    >
      {Array.from({ length: count }, (_, i) => (
        <Dot key={i} i={i} pos={pos} variant={variant} color={color} />
      ))}
    </Pressable>
  );
});
PageDots.displayName = "PageDots";

/* ------------------------------------------------------------------ */
/* Load more / infinite footer                                         */
/* ------------------------------------------------------------------ */

export interface LoadMoreProps extends Omit<ViewProps, "className"> {
  /** Fetch the next page. Return a promise and the footer tracks loading itself. */
  onLoadMore?: () => void | Promise<unknown>;
  /** Controlled loading state (otherwise derived from the onLoadMore promise). */
  loading?: boolean;
  /** More results exist. When false the footer settles into its end state. Default true. */
  hasMore?: boolean;
  /** Items still to load — "Show 24 more" reads better than "Load more". */
  remaining?: number;
  /** Button label. Default "Show {remaining} more" or "Load more". */
  label?: string;
  /** End-of-list line. Default "You're all caught up". */
  endLabel?: string;
  /**
   * "button" — a full-width secondary button (feeds, reviews).
   * "auto" — busy-dots-only footer for FlatList `onEndReached` infinite lists.
   */
  variant?: "button" | "auto";
  className?: string;
}

/** Busy swaps the label for three dots that brighten in turn — one cycle. */
const BUSY_CYCLE_MS = tempo.roll * 2;
/** Resting brightness and size of a busy dot. */
const DOT_REST = 0.3;
const DOT_SIZE = 6;

/** One busy dot: brightens as the cycle passes its turn, then rests. Opacity
 *  only — the dots never travel, and reduced motion holds them half lit. */
function BusyDot({ index, lap, color, still }: { index: number; lap: SharedValue<number>; color: string; still: boolean }) {
  const style = useAnimatedStyle(() => {
    if (still) return { opacity: 0.6 };
    const t = (((lap.value - index / 3) % 1) + 1) % 1;
    const peak = t < 0.5 ? Math.sin(t * 2 * Math.PI) : 0;
    return { opacity: DOT_REST + (1 - DOT_REST) * Math.max(0, peak) };
  });
  return <Animated.View style={[{ width: DOT_SIZE, height: DOT_SIZE, borderRadius: DOT_SIZE / 2, backgroundColor: color }, style]} />;
}

export const LoadMore = forwardRef<React.ElementRef<typeof View>, LoadMoreProps>(function LoadMore(
  { onLoadMore, loading: controlledLoading, hasMore = true, remaining, label, endLabel = "You're all caught up", variant = "button", className, ...props },
  ref
) {
  const haptics = useHaptic();
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const [pending, setPending] = React.useState(false);
  const mounted = React.useRef(true);
  React.useEffect(() => () => void (mounted.current = false), []);
  const loading = controlledLoading ?? pending;
  const press = usePressAnimation({ disabled: loading });

  // Busy is not a spinner: the label swaps out in place for three dots that
  // brighten in turn until the page lands. The pill never resizes.
  const labelOn = useSharedValue(loading ? 0 : 1);
  const dotsOn = useSharedValue(loading ? 1 : 0);
  const lap = useSharedValue(0);
  const busyLoop = loading || variant === "auto";
  React.useEffect(() => {
    labelOn.value = loading ? withTiming(0, DIM) : withDelay(timing.recede.duration, withTiming(1, IGNITE));
    dotsOn.value = loading ? withDelay(timing.recede.duration, withTiming(1, IGNITE)) : withTiming(0, DIM);
  }, [loading, labelOn, dotsOn]);
  React.useEffect(() => {
    if (!busyLoop || reduceMotion) {
      cancelAnimation(lap);
      return;
    }
    lap.value = 0;
    lap.value = withRepeat(withTiming(1, { duration: BUSY_CYCLE_MS, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(lap);
  }, [busyLoop, lap, reduceMotion]);
  const dotsStyle = useAnimatedStyle(() => ({ opacity: dotsOn.value }));
  // End state lands with a small rise when the last page arrives.
  const end = useSharedValue(hasMore ? 0 : 1);
  React.useEffect(() => {
    end.value = withTiming(hasMore ? 0 : 1, hasMore ? DIM : IGNITE);
  }, [hasMore, end]);

  const labelStyle = useAnimatedStyle(() => ({ opacity: labelOn.value }));
  const endStyle = useAnimatedStyle(() => ({
    opacity: end.value,
    transform: [{ translateY: reduceMotion ? 0 : (1 - end.value) * 6 }],
  }));

  const run = () => {
    if (loading || !hasMore) return;
    haptics.light();
    const r = onLoadMore?.();
    if (r && typeof (r as Promise<unknown>).then === "function" && controlledLoading === undefined) {
      setPending(true);
      (r as Promise<unknown>).finally(() => mounted.current && setPending(false));
    }
  };

  if (!hasMore) {
    return (
      <Animated.View
        ref={ref}
        style={endStyle}
        className={cn("h-14 flex-row items-center justify-center gap-2", className)}
        accessibilityLiveRegion="polite"
        {...props}
      >
        <Icon name="check-circle" size="sm" color="mutedForeground" />
        <Text className="text-sm text-muted-foreground">{endLabel}</Text>
      </Animated.View>
    );
  }

  if (variant === "auto") {
    return (
      <View
        ref={ref}
        className={cn("h-14 flex-row items-center justify-center", className)}
        style={{ gap: DOT_SIZE }}
        accessibilityRole="progressbar"
        accessibilityLabel="Loading more"
        {...props}
      >
        {[0, 1, 2].map((i) => (
          <BusyDot key={i} index={i} lap={lap} color={colors.mutedForeground} still={reduceMotion} />
        ))}
      </View>
    );
  }

  const text = label ?? (remaining != null ? `Show ${remaining} more` : "Load more");

  return (
    <View ref={ref} className={cn("w-full", className)} {...props}>
      <AnimatedPressable
        onPress={run}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        disabled={loading}
        style={press.animatedStyle}
        className="h-12 w-full items-center justify-center overflow-hidden rounded-full bg-secondary"
        accessibilityRole="button"
        accessibilityLabel={loading ? "Loading" : text}
        accessibilityState={{ busy: loading, disabled: loading }}
      >
        <Animated.View style={labelStyle} className="flex-row items-center gap-2">
          <Text className="text-[15px] font-semibold text-secondary-foreground">{text}</Text>
          <Icon name="chevron-down" size="sm" color="secondaryForeground" />
        </Animated.View>
        {/* Busy — three dots in the label's place while the next page loads. */}
        <Animated.View
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: DOT_SIZE }, dotsStyle]}
        >
          {[0, 1, 2].map((i) => (
            <BusyDot key={i} index={i} lap={lap} color={colors.secondaryForeground} still={reduceMotion} />
          ))}
        </Animated.View>
      </AnimatedPressable>
    </View>
  );
});
LoadMore.displayName = "LoadMore";

export const Pagination = Object.assign(PaginationRoot, { Dots: PageDots, LoadMore });
