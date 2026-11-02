import * as React from "react";
import { forwardRef } from "react";
import { AccessibilityInfo, View, type GestureResponderEvent, type LayoutChangeEvent, type ViewProps } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { cn, ease, tempo, timing, useHaptic, useReducedMotion, useTheme } from "@lumioui/core";

/**
 * CircleReveal — the "next screen floods out of the control you touched"
 * transition. A solid circle of the next screen's background grows from an
 * origin (a slide thumb, a theme button, a Place order CTA) until it covers
 * the whole surface; `onCovered` is the moment to swap content underneath;
 * then the circle dims away so the new content reads as igniting.
 *
 *   const reveal = React.useRef<CircleRevealHandle>(null);
 *   <View className="flex-1">
 *     {screen === "cart" ? <Cart /> : <Confirmed />}
 *     <CircleReveal ref={reveal} color={colors.primary} onCovered={() => setScreen("confirmed")} />
 *   </View>
 *   <Button onPress={(e) => reveal.current?.reveal(e)}>Place order</Button>
 *
 * Or declaratively: `<CircleReveal active={open} origin={thumbEnd} onCovered={(open) => …} />`.
 *
 * The circle is ONE Animated.View of a fixed base diameter, grown by a
 * UI-thread transform scale to exactly the radius that reaches the farthest
 * corner from the origin (measured with onLayout) — no width/height
 * animation, no JS per frame. `children` render ABOVE the circle so a shared
 * element (the product photo) stays visible while the screen changes under
 * it; pass a function to receive `revealed` (0 → 1 on reveal, 1 → 0 on
 * conceal, in lock-step with the circle) and glide it between slots.
 * Pass `revealContent` (and `concealContent` for the way back) and the next
 * screen itself is seen through the growing circle from the first frame —
 * the circle is a window, counter-scaled so the screen inside never moves —
 * and at cover the circle simply lifts away over identical pixels. Without
 * content the circle is a plain flood of `color` that dims away after the
 * swap. The leading edge carries a lit 2pt rim that is brightest out of the
 * touch and dims as the circle covers (counter-scaled so it stays 2pt); it
 * reads dark on a light flood and light on a dark one. Light haptic on
 * start, selection tick when covered, and `announce` speaks the new screen.
 * Reduced motion never shows a circle: the swap happens after a short beat
 * and the consumer's content does the ignite. Expo Go compatible.
 */

export interface CircleRevealOrigin {
  /** x in the overlay's own coordinates (pt). */
  x: number;
  /** y in the overlay's own coordinates (pt). */
  y: number;
}

/** Where to grow from — local coordinates, or a press event (its
 *  pageX/pageY are converted into the overlay's coordinates). */
export type CircleRevealFrom = CircleRevealOrigin | GestureResponderEvent;

export interface CircleRevealHandle {
  /** Grow the circle (default `color`) from `from`; fires onCovered(true). */
  reveal: (from?: CircleRevealFrom, color?: string) => void;
  /** Grow back the other way (default `concealColor`); fires onCovered(false). */
  conceal: (from?: CircleRevealFrom, color?: string) => void;
  /** Convert a press event / page point into overlay coordinates. */
  toLocal: (pageX: number, pageY: number) => CircleRevealOrigin;
}

export interface CircleRevealProps extends Omit<ViewProps, "className" | "children"> {
  /** Declarative trigger: false → true reveals, true → false conceals.
   *  Optional — the imperative ref handle works without it. */
  active?: boolean;
  /** Origin in the overlay's coordinates. Default bottom-centre. */
  origin?: CircleRevealOrigin;
  /** Reveal fill — the NEXT screen's background. Default theme background. */
  color?: string;
  /** Conceal fill — the PREVIOUS screen's background. Default `color`. */
  concealColor?: string;
  /** Reveal flood in ms. Default 315 (tempo.settle). */
  duration?: number;
  /** Conceal flood in ms. Default 250 — going back runs quicker than the
   *  commit. */
  concealDuration?: number;
  /** Circle fully covers the surface — swap content now. `revealed` is
   *  true after a reveal, false after a conceal. */
  onCovered?: (revealed: boolean) => void;
  /** The circle has faded away and the transition is complete. */
  onDone?: (revealed: boolean) => void;
  /** Lit leading rim on the flood's edge. Default true. */
  rim?: boolean;
  /** Rim colour. Default: a dark hairline on a light flood, soft white on a dark one. */
  rimColor?: string;
  /** The next screen, seen through the circle while it grows on reveal. */
  revealContent?: React.ReactNode;
  /** The previous screen, seen through the circle while it grows on conceal. */
  concealContent?: React.ReactNode;
  /** Spoken when the circle covers — a string, or per direction. */
  announce?: string | ((revealed: boolean) => string | undefined);
  /** Rendered above the circle (shared elements). A function receives the
   *  `revealed` shared value, 0 → 1 on reveal and 1 → 0 on conceal. */
  children?: React.ReactNode | ((revealed: SharedValue<number>) => React.ReactNode);
  className?: string;
}

/** The flood — one tempo.settle from touch to farthest corner. */
const REVEAL_MS = tempo.settle;
/** Going back is a retreat, so it runs at ~80% of the commit. */
const CONCEAL_MS = tempo.move;
/** Once covered, the circle dims away over timing.fast so the next screen's
 *  content ignites ~160ms after the flood lands. */
const SETTLE = timing.fast;
/** Two frames for React to commit the swapped content under the circle
 *  before it starts fading, so the old screen never flashes through. */
const COMMIT_FRAMES_MS = 32;
/** Base diameter of the circle view; growth is scale = needed / BASE. */
const BASE = 64;
/** Rim width in points at any scale — a hairline of light, not a stroke. */
const RIM = 2;
/** Rim — a soft white edge on a dark flood, a dark hairline on a light one. */
const RIM_ON_DARK = "rgba(255,255,255,0.6)";
const RIM_ON_LIGHT = "rgba(0,0,0,0.14)";
/** Below this circle scale the window's counter-scale would explode. */
const MIN_SCALE = 0.01;

/** Perceived lightness of a #RRGGBB fill, 0–1; non-hex reads as light. */
function lightness(color: string) {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(color);
  if (!m) return 1;
  const [r, g, b] = [m[1]!, m[2]!, m[3]!].map((h) => parseInt(h, 16) / 255);
  return 0.299 * r! + 0.587 * g! + 0.114 * b!;
}

/** The flood ignites: a fast rise out of the touch that eases as it
 *  reaches the far corner. */
const EASE_OUT = Easing.bezier(...ease.out);

type Direction = "reveal" | "conceal";

function isEvent(from: CircleRevealFrom): from is GestureResponderEvent {
  return typeof from === "object" && from !== null && "nativeEvent" in from;
}

export const CircleReveal = forwardRef<CircleRevealHandle, CircleRevealProps>(function CircleReveal(
  {
    active,
    origin,
    color,
    concealColor,
    duration = REVEAL_MS,
    concealDuration = CONCEAL_MS,
    onCovered,
    onDone,
    rim = true,
    rimColor,
    revealContent,
    concealContent,
    announce,
    children,
    className,
    onLayout,
    ...props
  },
  ref
) {
  const { colors } = useTheme();
  const haptic = useHaptic();
  const reduce = useReducedMotion();
  const revealColor = color ?? colors.background;
  const backColor = concealColor ?? revealColor;

  const viewRef = React.useRef<React.ComponentRef<typeof View>>(null);
  const size = React.useRef({ w: 0, h: 0 });
  const offset = React.useRef({ x: 0, y: 0 });

  // UI-thread state for the circle.
  const ox = useSharedValue(0);
  const oy = useSharedValue(0);
  const target = useSharedValue(1);
  const grow = useSharedValue(0);
  const fill = useSharedValue(1);
  const tint = useSharedValue(revealColor);
  const rimTint = useSharedValue(rimColor ?? RIM_ON_DARK);
  const sw = useSharedValue(0);
  const sh = useSharedValue(0);
  const revealed = useSharedValue(active ? 1 : 0);
  // Which way the current flood runs — picks the content seen through it.
  const [flooding, setFlooding] = React.useState<Direction | null>(null);

  const busy = React.useRef(false);
  const beat = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => () => {
    if (beat.current) clearTimeout(beat.current);
  }, []);
  // A run asked for while one is in flight runs when it finishes, so the
  // declarative `active` can never be left out of step with the screen.
  const pending = React.useRef<{ dir: Direction; from?: CircleRevealFrom; override?: string } | null>(null);
  const latest = React.useRef({ onCovered, onDone, haptic, announce, revealContent, concealContent });
  latest.current = { onCovered, onDone, haptic, announce, revealContent, concealContent };

  const measure = React.useCallback(() => {
    viewRef.current?.measureInWindow?.((x, y) => {
      offset.current = { x, y };
    });
  }, []);

  const handleLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    size.current = { w: width, h: height };
    sw.value = width;
    sh.value = height;
    measure();
    onLayout?.(e);
  };

  const toLocal = React.useCallback(
    (pageX: number, pageY: number): CircleRevealOrigin => ({ x: pageX - offset.current.x, y: pageY - offset.current.y }),
    []
  );

  const runRef = React.useRef<(dir: Direction, from?: CircleRevealFrom, override?: string) => void>(() => {});
  const finish = React.useCallback(
    (dir: Direction) => {
      busy.current = false;
      grow.value = 0;
      setFlooding(null);
      latest.current.onDone?.(dir === "reveal");
      const next = pending.current;
      pending.current = null;
      if (next) runRef.current(next.dir, next.from, next.override);
    },
    [grow]
  );

  const covered = React.useCallback(
    (dir: Direction, windowed: boolean) => {
      latest.current.haptic.selection();
      latest.current.onCovered?.(dir === "reveal");
      const say = latest.current.announce;
      const text = typeof say === "function" ? say(dir === "reveal") : say;
      if (text) AccessibilityInfo.announceForAccessibility(text);
      if (windowed) {
        // The window already shows the new screen: lift it once the swap has
        // committed underneath — the pixels are the same.
        fill.value = withDelay(COMMIT_FRAMES_MS, withTiming(0, { duration: 0 }, (ok) => {
          if (ok) runOnJS(finish)(dir);
        }));
        return;
      }
      fill.value = withDelay(
        COMMIT_FRAMES_MS,
        withTiming(0, { ...SETTLE, easing: EASE_OUT }, (ok) => {
          if (ok) runOnJS(finish)(dir);
        })
      );
    },
    [fill, finish]
  );

  const start = React.useCallback(
    (dir: Direction, o: CircleRevealOrigin, override?: string) => {
      const { w, h } = size.current;
      // Radius to the farthest corner (+1pt so the anti-aliased edge clears it).
      const r = Math.max(Math.hypot(o.x, o.y), Math.hypot(w - o.x, o.y), Math.hypot(o.x, h - o.y), Math.hypot(w - o.x, h - o.y)) + 1;
      const config = { duration: dir === "reveal" ? duration : concealDuration, easing: EASE_OUT };
      const to = dir === "reveal" ? 1 : 0;

      cancelAnimation(grow);
      cancelAnimation(fill);
      ox.value = o.x;
      oy.value = o.y;
      target.value = (r * 2) / BASE;
      const hue = override ?? (dir === "reveal" ? revealColor : backColor);
      tint.value = hue;
      rimTint.value = rimColor ?? (lightness(hue) > 0.6 ? RIM_ON_LIGHT : RIM_ON_DARK);
      latest.current.haptic.light();

      if (reduce) {
        // No circle and no travel: shared elements jump, and after a short
        // beat the swap happens; the consumer's content dims and ignites.
        grow.value = 0;
        fill.value = 1;
        revealed.value = to;
        beat.current = setTimeout(() => covered(dir, false), timing.fast.duration);
        return;
      }
      const windowed = (dir === "reveal" ? latest.current.revealContent : latest.current.concealContent) != null;
      setFlooding(dir);
      revealed.value = withTiming(to, config);
      fill.value = 1;
      grow.value = 0;
      grow.value = withTiming(1, config, (ok) => {
        if (ok) runOnJS(covered)(dir, windowed);
      });
    },
    [duration, concealDuration, grow, fill, ox, oy, target, tint, rimTint, rimColor, revealColor, backColor, revealed, reduce, covered]
  );

  const run = React.useCallback(
    (dir: Direction, from?: CircleRevealFrom, override?: string) => {
      const { w, h } = size.current;
      if (w === 0 || h === 0) return;
      if (busy.current) {
        pending.current = { dir, from, override };
        return;
      }
      busy.current = true;
      if (from != null && isEvent(from)) {
        // Re-measure first so a scrolled page can't skew the origin.
        const { pageX, pageY } = from.nativeEvent;
        const node = viewRef.current;
        if (node?.measureInWindow) {
          node.measureInWindow((x, y) => {
            offset.current = { x, y };
            start(dir, toLocal(pageX, pageY), override);
          });
        } else {
          start(dir, toLocal(pageX, pageY), override);
        }
        return;
      }
      start(dir, from ?? origin ?? { x: w / 2, y: h }, override);
    },
    [origin, start, toLocal]
  );
  runRef.current = run;

  React.useImperativeHandle(
    ref,
    () => ({
      reveal: (from, c) => run("reveal", from, c),
      conceal: (from, c) => run("conceal", from, c),
      toLocal,
    }),
    [run, toLocal]
  );

  // Declarative trigger — kicks the side effect when `active` flips.
  const prevActive = React.useRef(active);
  React.useEffect(() => {
    if (active === undefined || active === prevActive.current) return;
    prevActive.current = active;
    run(active ? "reveal" : "conceal");
  }, [active, run]);

  const circleStyle = useAnimatedStyle(() => ({
    left: ox.value - BASE / 2,
    top: oy.value - BASE / 2,
    opacity: grow.value === 0 ? 0 : fill.value,
    backgroundColor: tint.value,
    transform: [{ scale: grow.value * target.value }],
  }));

  // The rim rides the same transform; its border is divided by the scale so
  // it stays RIM points wide, and it dims as the flood covers.
  const rimStyle = useAnimatedStyle(() => {
    const s = Math.max(grow.value * target.value, 0.001);
    return {
      left: ox.value - BASE / 2,
      top: oy.value - BASE / 2,
      opacity: grow.value === 0 ? 0 : (1 - grow.value) * fill.value,
      borderWidth: Math.min(RIM / s, BASE / 2),
      borderColor: rimTint.value,
      transform: [{ scale: s }],
    };
  });

  // The window's screen: full overlay size, pinned to the overlay's origin
  // and scaled by the inverse of the circle around the circle's centre, so
  // it stays put while the circle grows over it.
  const windowStyle = useAnimatedStyle(() => {
    const s = Math.max(grow.value * target.value, MIN_SCALE);
    const cx = ox.value - sw.value / 2;
    const cy = oy.value - sh.value / 2;
    return {
      left: BASE / 2 - ox.value,
      top: BASE / 2 - oy.value,
      width: sw.value,
      height: sh.value,
      transform: [{ translateX: cx }, { translateY: cy }, { scale: 1 / s }, { translateX: -cx }, { translateY: -cy }],
    };
  });
  const windowContent = flooding === "reveal" ? revealContent : flooding === "conceal" ? concealContent : null;

  const content = typeof children === "function" ? children(revealed) : children;

  return (
    <View
      ref={viewRef}
      pointerEvents="box-none"
      accessibilityRole="none"
      onLayout={handleLayout}
      className={cn("absolute inset-0 overflow-hidden", className)}
      {...props}
    >
      <Animated.View
        pointerEvents="none"
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
        style={[{ position: "absolute", width: BASE, height: BASE, borderRadius: BASE / 2, overflow: "hidden" }, circleStyle]}
      >
        {windowContent != null ? (
          <Animated.View pointerEvents="none" style={[{ position: "absolute" }, windowStyle]}>
            {windowContent}
          </Animated.View>
        ) : null}
      </Animated.View>
      {rim && !reduce ? (
        <Animated.View
          pointerEvents="none"
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden
          style={[{ position: "absolute", width: BASE, height: BASE, borderRadius: BASE / 2 }, rimStyle]}
        />
      ) : null}
      {content}
    </View>
  );
});
CircleReveal.displayName = "CircleReveal";
