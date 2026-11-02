import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";
import { cn, ease, tempo, timing, useTheme } from "@lumioui/core";

/**
 * DotMatrixText — a figure set in LED dots: every character is a 5×7 grid
 * (narrower for punctuation) drawn with SVG circles, the off LEDs faintly
 * visible behind the lit ones.
 *
 *   <DotMatrixText text="18:42" dot={6} />
 *   <DotMatrixText text={fmt(price)} beatColor={colors.success} />
 *
 * Digits switch on in place, like a real panel: when the text changes, only
 * the dots that differ move — dots the old character lit and the new one
 * doesn't dim out (`timing.recede`), dots the new one adds ignite
 * (`timing.fast`, ease.out), and dots both share stay lit throughout.
 * Columns step 30ms apart from the right. Nothing travels, so reduced motion
 * keeps the same switch. `beatColor` lights the arriving dots in that colour
 * for a beat before they settle to `color` (a ticker's up/down flash).
 * `instant` switches without fading — for count-ups that step every frame.
 *
 * Decorative: give the parent the accessible label (AnimatedNumber and
 * Ticker do).
 */

/** Grid rows per character. */
const ROWS = 7;
/** Dot pitch as a multiple of the diameter — 0.4 of a dot between LEDs. */
const PITCH = 1.4;
/** Columns step this far apart, rightmost first (the number-ticker beat). */
const STAGGER = 30;
/** How strongly an off LED shows, by scheme. */
const UNLIT = { light: 0.09, dark: 0.13 } as const;
const DIM = { ...timing.recede, easing: Easing.bezier(...ease.in) };
const IGNITE = { ...timing.fast, easing: Easing.bezier(...ease.out) };
/** A beat holds this long before it settles to the ink. */
const BEAT_HOLD = tempo.snap;
const BEAT_OUT = { duration: tempo.move, easing: Easing.bezier(...ease.in) };

/** 5×7 font: "#" lit, "." off. Narrow glyphs carry fewer columns. */
const FONT: Record<string, readonly string[]> = {
  "0": [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  "1": ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".###."],
  "2": [".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#####"],
  "3": [".###.", "#...#", "....#", "..##.", "....#", "#...#", ".###."],
  "4": ["...#.", "..##.", ".#.#.", "#..#.", "#####", "...#.", "...#."],
  "5": ["#####", "#....", "####.", "....#", "....#", "#...#", ".###."],
  "6": ["..##.", ".#...", "#....", "####.", "#...#", "#...#", ".###."],
  "7": ["#####", "....#", "...#.", "..#..", ".#...", ".#...", ".#..."],
  "8": [".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".###."],
  "9": [".###.", "#...#", "#...#", ".####", "....#", "...#.", ".##.."],
  ".": [".", ".", ".", ".", ".", ".", "#"],
  ",": ["..", "..", "..", "..", "..", ".#", "#."],
  ":": [".", ".", "#", ".", "#", ".", "."],
  "-": ["....", "....", "....", "####", "....", "....", "...."],
  "+": [".....", "..#..", "..#..", "#####", "..#..", "..#..", "....."],
  "%": ["##...", "##..#", "...#.", "..#..", ".#...", "#..##", "...##"],
  $: ["..#..", ".####", "#.#..", ".###.", "..#.#", "####.", "..#.."],
  "€": ["..###", ".#...", "####.", ".#...", "####.", ".#...", "..###"],
  "£": ["..##.", ".#..#", ".#...", "###..", ".#...", ".#...", "#####"],
  "/": ["....#", "...#.", "...#.", "..#..", ".#...", ".#...", "#...."],
  "°": [".#.", "#.#", ".#.", "...", "...", "...", "..."],
  " ": ["...", "...", "...", "...", "...", "...", "..."],
  h: ["#....", "#....", "#.##.", "##..#", "#...#", "#...#", "#...#"],
  k: ["#....", "#....", "#..#.", "#.#..", "##...", "#.#..", "#..#."],
  m: [".....", ".....", "##.#.", "#.#.#", "#.#.#", "#...#", "#...#"],
  s: [".....", ".....", ".####", "#....", ".###.", "....#", "####."],
  M: ["#...#", "##.##", "#.#.#", "#.#.#", "#...#", "#...#", "#...#"],
  K: ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"],
};
FONT["−"] = FONT["-"]!;

const BLANK = FONT[" "]!;

/** The characters DotMatrixText can draw; anything else renders as a gap. */
export const DOT_MATRIX_CHARS = Object.keys(FONT).join("");

type Cell = readonly string[];

function glyphOf(ch: string): Cell {
  return FONT[ch] ?? BLANK;
}

/** Lit dot indices ("r*cols+c") of a glyph. */
function litOf(cell: Cell): Set<number> {
  const cols = cell[0]!.length;
  const lit = new Set<number>();
  for (let r = 0; r < ROWS; r++) {
    const row = cell[r]!;
    for (let c = 0; c < cols; c++) if (row[c] === "#") lit.add(r * cols + c);
  }
  return lit;
}

export interface DotMatrixTextProps {
  /** The figure, already formatted ("18:42", "$6,482.17"). */
  text: string;
  /** LED diameter in pt. Default 5. */
  dot?: number;
  /** Lit colour. Default the theme ink. */
  color?: string;
  /** Arriving dots light in this colour for a beat, then settle to `color`. */
  beatColor?: string;
  /** Draw the off LEDs. Default true. */
  unlit?: boolean;
  /** Characters from this index on use `minorDot` — cents set smaller. */
  minorFrom?: number;
  /** LED diameter for the minor characters. Default 0.6 × `dot`. */
  minorDot?: number;
  /** Switch without fading (counts that step every frame). */
  instant?: boolean;
  /** No column stagger — live feeds switch every column at once. */
  together?: boolean;
  /** Placement classes for the row. */
  className?: string;
  /** Fires on JS once the last changed column has switched. */
  onSettle?: () => void;
}

interface Track {
  text: string;
  prev: string;
  gen: number;
}

export const DotMatrixText = React.forwardRef<React.ElementRef<typeof View>, DotMatrixTextProps>(function DotMatrixText(
  {
    text,
    dot = 5,
    color,
    beatColor,
    unlit = true,
    minorFrom,
    minorDot,
    instant = false,
    together = false,
    className,
    onSettle,
  },
  ref
) {
  const { colors, scheme } = useTheme();
  const ink = color ?? colors.foreground;
  const offAlpha = unlit ? UNLIT[scheme === "dark" ? "dark" : "light"] : 0;

  // Previous text and a generation per change, resolved during render so
  // every column knows in the same pass what it switches from.
  const [track, setTrack] = useState<Track>({ text, prev: text, gen: 0 });
  let current = track;
  if (track.text !== text) {
    current = { text, prev: track.text, gen: track.gen + 1 };
    setTrack(current);
  }
  const { prev, gen } = current;

  const settleRef = useRef(onSettle);
  settleRef.current = onSettle;
  const genRef = useRef(gen);
  genRef.current = gen;
  const land = React.useCallback((g: number) => {
    if (g === genRef.current) settleRef.current?.();
  }, []);

  // Walk from the right so units stay units as the figure grows.
  const len = text.length;
  const slots: { ch: string; old: string; changed: boolean; rank: number }[] = [];
  let changedCount = 0;
  for (let r = 0; r < len; r++) {
    const ch = text[len - 1 - r]!;
    const old = prev[prev.length - 1 - r] ?? "";
    const changed = gen > 0 && ch !== old;
    slots.push({ ch, old, changed, rank: changed ? changedCount++ : -1 });
  }
  slots.reverse();

  useEffect(() => {
    if (gen > 0 && (changedCount === 0 || instant)) land(gen);
  }, [gen, changedCount, instant, land]);

  const minor = minorDot ?? dot * 0.6;

  return (
    // Characters sit one blank LED column apart, so each reads as its own module.
    <View ref={ref} className={cn("flex-row items-end", className)} style={{ gap: dot * PITCH * 2 - dot }}>
      {slots.map((slot, i) => {
        const small = minorFrom !== undefined && minorFrom >= 0 && i >= minorFrom;
        const switching = slot.changed && !instant;
        return (
          <DotColumn
            key={len - 1 - i}
            ch={slot.ch}
            old={slot.old}
            changed={switching}
            // Only switching columns see the generation, so a memoised column
            // whose character held stays put while its neighbours change.
            gen={switching ? gen : 0}
            delay={switching && !together ? slot.rank * STAGGER : 0}
            isLast={switching && slot.rank === changedCount - 1}
            dot={small ? minor : dot}
            ink={ink}
            beat={beatColor}
            offAlpha={offAlpha}
            onLand={land}
          />
        );
      })}
    </View>
  );
});
DotMatrixText.displayName = "DotMatrixText";

interface DotColumnProps {
  ch: string;
  old: string;
  changed: boolean;
  gen: number;
  delay: number;
  isLast: boolean;
  dot: number;
  ink: string;
  beat?: string;
  offAlpha: number;
  onLand: (gen: number) => void;
}

/** One layer of dots — the indices given, in one colour. */
function Dots({
  ids,
  cols,
  dot,
  fill,
  alpha = 1,
}: {
  ids: Iterable<number>;
  cols: number;
  dot: number;
  fill: string;
  alpha?: number;
}) {
  const p = dot * PITCH;
  const r = dot / 2;
  const out: React.ReactElement[] = [];
  for (const id of ids) {
    const row = Math.floor(id / cols);
    const col = id % cols;
    out.push(<Circle key={id} cx={col * p + r} cy={row * p + r} r={r} fill={fill} fillOpacity={alpha} />);
  }
  return <>{out}</>;
}

const FILL = { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 } as const;

/** Memoised: a count-up re-renders only the columns whose character changed. */
const DotColumn = React.memo(function DotColumn({
  ch,
  old,
  changed,
  gen,
  delay,
  isLast,
  dot,
  ink,
  beat,
  offAlpha,
  onLand,
}: DotColumnProps) {
  const cell = glyphOf(ch);
  const cols = cell[0]!.length;
  const prevCell = old ? glyphOf(old) : undefined;
  // A character of another width (a digit becoming a comma) has no dots in
  // common — it simply switches on.
  const comparable = prevCell !== undefined && prevCell[0]!.length === cols;

  const { kept, leaving, arriving } = React.useMemo(() => {
    const now = litOf(cell);
    const was = changed && comparable ? litOf(prevCell!) : changed ? new Set<number>() : now;
    const k: number[] = [];
    const a: number[] = [];
    const l: number[] = [];
    now.forEach((id) => (was.has(id) ? k : a).push(id));
    was.forEach((id) => {
      if (!now.has(id)) l.push(id);
    });
    return { kept: k, leaving: l, arriving: a };
  }, [cell, prevCell, changed, comparable]);

  // The off grid only depends on the module's shape and ink — build it once.
  const offGrid = React.useMemo(() => {
    if (offAlpha <= 0) return null;
    const every: number[] = [];
    for (let i = 0; i < cols * ROWS; i++) every.push(i);
    return <Dots ids={every} cols={cols} dot={dot} fill={ink} alpha={offAlpha} />;
  }, [cols, dot, ink, offAlpha]);

  const w = cols * dot * PITCH - (dot * PITCH - dot);
  const h = ROWS * dot * PITCH - (dot * PITCH - dot);

  // in: arriving dots 0 → 1. out: leaving dots 1 → 0. flash: the beat overlay.
  const lit = useSharedValue(changed ? 0 : 1);
  const out = useSharedValue(changed ? 1 : 0);
  const flash = useSharedValue(0);

  useEffect(() => {
    if (!changed) {
      lit.value = 1;
      out.value = 0;
      flash.value = 0;
      return;
    }
    lit.value = 0;
    out.value = 1;
    out.value = withDelay(delay, withTiming(0, DIM));
    lit.value = withDelay(
      delay,
      withTiming(1, IGNITE, (finished) => {
        if (finished && isLast) runOnJS(onLand)(gen);
      })
    );
    if (beat) {
      flash.value = 0;
      flash.value = withDelay(
        delay,
        withSequence(withTiming(1, IGNITE), withDelay(BEAT_HOLD, withTiming(0, BEAT_OUT)))
      );
    }
  }, [gen, changed, delay, isLast, beat, onLand, lit, out, flash]);

  const inStyle = useAnimatedStyle(() => ({ opacity: lit.value }));
  const outStyle = useAnimatedStyle(() => ({ opacity: out.value }));
  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.value }));

  return (
    <View style={{ width: w, height: h }}>
      <Svg width={w} height={h} style={FILL}>
        {offGrid}
        <Dots ids={kept} cols={cols} dot={dot} fill={ink} />
      </Svg>
      {changed && leaving.length > 0 ? (
        <Animated.View style={[FILL, outStyle]}>
          <Svg width={w} height={h}>
            <Dots ids={leaving} cols={cols} dot={dot} fill={ink} />
          </Svg>
        </Animated.View>
      ) : null}
      {arriving.length > 0 ? (
        <Animated.View style={[FILL, inStyle]}>
          <Svg width={w} height={h}>
            <Dots ids={arriving} cols={cols} dot={dot} fill={ink} />
          </Svg>
        </Animated.View>
      ) : null}
      {beat && changed && arriving.length > 0 ? (
        <Animated.View style={[FILL, flashStyle]}>
          <Svg width={w} height={h}>
            <Dots ids={arriving} cols={cols} dot={dot} fill={beat} />
          </Svg>
        </Animated.View>
      ) : null}
    </View>
  );
});
