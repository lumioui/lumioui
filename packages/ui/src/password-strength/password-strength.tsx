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
import { Sheen, cn, ease, spring, timing, useHaptic, useReducedMotion, useTheme } from "@lumioui/core";

const CHAR_CLASSES = [/[a-z]/, /[A-Z]/, /\d/, /[^a-zA-Z\d\s]/];
const SEQS = "abcdefghijklmnopqrstuvwxyz0123456789";
const COMMON = new Set([
  "password", "passw0rd", "123456", "1234567", "12345678", "123456789",
  "qwerty", "qwerty123", "letmein", "iloveyou", "admin", "welcome",
  "abc123", "111111", "dragon", "monkey", "master", "sunshine",
]);

/** True when `s` holds an ascending/descending sequential run of `n`
 *  (abcd, 4321) — the giveaway pattern checkers penalize hardest. */
function hasSequentialRun(s: string, n: number) {
  const lower = s.toLowerCase();
  for (let i = 0; i + n <= lower.length; i++) {
    const chunk = lower.slice(i, i + n);
    if (SEQS.includes(chunk) || SEQS.includes([...chunk].reverse().join(""))) return true;
  }
  return false;
}

/** True for passwords on the short most-common list — the meter refuses these. */
export function isCommonPassword(password: string): boolean {
  return COMMON.has(password.toLowerCase());
}

/**
 * Lightweight local score 0–4 — a deterministic heuristic of length,
 * character-class spread, and obvious-pattern penalties. Good enough to
 * steer the meter; real entropy estimation stays on the server.
 */
export function derivePasswordScore(password: string): number {
  if (!password) return 0;
  if (isCommonPassword(password)) return 0;
  const classes = CHAR_CLASSES.filter((re) => re.test(password)).length;
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (classes >= 3) score += 1;
  if (classes >= 4) score += 1;
  if (password.length < 8 || /^\d+$/.test(password)) score = Math.min(score, 1);
  if (/^(.)\1+$/.test(password) || hasSequentialRun(password, 4)) score = Math.min(score, 2);
  return Math.max(0, Math.min(4, score));
}

/** What the password is still missing — the hint row under the meter. */
function deriveHint(password: string, score: number): string {
  if (!password) return "";
  if (score >= 4) return STRONG_HINT;
  if (isCommonPassword(password)) return "That one is on every list. Try a phrase only you would write.";
  const tips: string[] = [];
  if (password.length < 12) tips.push(password.length < 8 ? "8+ characters" : "12+ characters");
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) tips.push("upper & lower case");
  if (!/\d/.test(password)) tips.push("a number");
  if (!/[^a-zA-Z\d\s]/.test(password)) tips.push("a symbol");
  return tips.length ? `Try ${tips.slice(0, 2).join(" · ")}` : "";
}

const DEFAULT_LABELS = ["Too weak", "Weak", "Fair", "Good", "Strong"] as const;
const STRONG_HINT = "Strong. This one would take centuries.";

/** An unlit lamp: the accent at low brightness, so the meter reads as four lights, not a track. */
const LAMP_DIM = 0.15;
/** A lamp switching on grows from this height share (scaleY). */
const LAMP_IGNITE_FROM = 0.6;
/** Flicker kick in points (§5 rule 4: one 4pt kick). */
const FLICKER_KICK = 4;
/** Label travel on a swap — up when the score rises, down when it falls. */
const LABEL_RISE = 4;

export interface PasswordStrengthProps extends Omit<ViewProps, "className"> {
  /** Controlled score 0–4. Omit for uncontrolled via `defaultValue`, or
   *  pass `password` and the score derives itself. */
  value?: number;
  /** Uncontrolled initial score. */
  defaultValue?: number;
  /** Fires whenever the effective score changes (derived or set). */
  onValueChange?: (score: number) => void;
  /** Live password — derives the score with `derivePasswordScore` and
   *  generates the hint row. Takes precedence over value/defaultValue. */
  password?: string;
  /** Labels for scores 0–4. Default ["Too weak","Weak","Fair","Good","Strong"]. */
  labels?: readonly string[];
  /** Show the score label at the right of the meter row. Default true. */
  showLabel?: boolean;
  /** Custom hint under the meter — overrides the derived suggestion.
   *  Pass "" to hide the row entirely. */
  hint?: string;
  /** Extra classes on the outer container. */
  className?: string;
  /** Unlit lamp classes. Default: the accent at low brightness. */
  trackClassName?: string;
}

/** One lamp. On = full accent; switching on ignites (opacity on timing.fast,
 *  scaleY 0.6→1 on spring.swap); switching off dims on timing.recede. */
function Lamp({ on, refused, trackClassName }: { on: boolean; refused: boolean; trackClassName?: string }) {
  const reduce = useReducedMotion();
  const lit = useSharedValue(on ? 1 : 0);
  const grow = useSharedValue(1);
  const first = React.useRef(true);
  React.useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (on) {
      lit.value = withTiming(1, { ...timing.fast, easing: Easing.bezier(...ease.out) });
      if (!reduce) {
        grow.value = LAMP_IGNITE_FROM;
        grow.value = withSpring(1, spring.swap);
      }
    } else {
      lit.value = withTiming(0, { ...timing.recede, easing: Easing.bezier(...ease.in) });
    }
  }, [on, reduce, lit, grow]);
  const style = useAnimatedStyle(() => ({ opacity: lit.value, transform: [{ scaleY: grow.value }] }));
  return (
    <View className="h-2 flex-1 overflow-hidden rounded-full">
      <View className={cn("absolute inset-0", trackClassName ?? (refused ? "bg-destructive" : "bg-primary"))} style={trackClassName ? undefined : { opacity: LAMP_DIM }} />
      <Animated.View className="absolute inset-0 rounded-full bg-primary" style={style} />
    </View>
  );
}

/** Text that swaps in place: the old line dims, the new one ignites with
 *  a little travel in the direction of the change (dir 1 = rising: it
 *  starts 4pt low and comes up). */
function useSwap<T>(next: T, dir: 1 | -1) {
  const reduce = useReducedMotion();
  const [shown, setShown] = React.useState(next);
  const o = useSharedValue(1);
  const y = useSharedValue(0);
  const s = useSharedValue(1);
  React.useEffect(() => {
    if (Object.is(next, shown)) return;
    o.value = withTiming(0, { ...timing.recede, easing: Easing.bezier(...ease.in) });
    if (!reduce) s.value = withTiming(0.96, timing.recede);
    const t = setTimeout(() => {
      setShown(next);
      o.value = withTiming(1, { ...timing.fast, easing: Easing.bezier(...ease.out) });
      if (reduce) return;
      y.value = dir * LABEL_RISE;
      y.value = withSpring(0, spring.swap);
      s.value = withSpring(1, spring.swap);
    }, timing.recede.duration);
    return () => clearTimeout(t);
  }, [next, shown, dir, reduce, o, y, s]);
  const style = useAnimatedStyle(() => ({ opacity: o.value, transform: [{ translateY: y.value }, { scale: s.value }] }));
  return [shown, style] as const;
}

/**
 * PasswordStrength — the compact meter that rides under signup fields.
 * Four lamps in the accent: each score crossing switches one on, a drop
 * dims the top one. Colour is the "on" state in one hue — no traffic
 * light. A common password flickers the row once in destructive with a
 * warning haptic. The label swaps in place (rising 4pt as the score
 * climbs). Reaching Strong sends one sheen across the lamps and the hint
 * becomes the reward line.
 *   <PasswordStrength password={pw} />
 *   <PasswordStrength value={score} onValueChange={...} />
 * Expo Go compatible.
 */
export const PasswordStrength = forwardRef<React.ElementRef<typeof View>, PasswordStrengthProps>(
  function PasswordStrength(
    {
      value,
      defaultValue,
      onValueChange,
      password,
      labels = DEFAULT_LABELS,
      showLabel = true,
      hint,
      className,
      trackClassName,
      ...props
    },
    ref
  ) {
    const { colors } = useTheme();
    const reduce = useReducedMotion();
    const haptic = useHaptic();
    // A meter is read-only — nothing internal ever mutates `internal`, so
    // the uncontrolled path is just defaultValue resolved during render.
    const [internal] = React.useState(defaultValue ?? 0);
    const score = Math.max(
      0,
      Math.min(4, password !== undefined ? derivePasswordScore(password) : value ?? internal)
    );
    const refused = password !== undefined && isCommonPassword(password);

    // Direction of the last score change, resolved during render so the
    // label knows which way to travel before its swap starts.
    const [track, setTrack] = React.useState<{ score: number; dir: 1 | -1 }>({ score, dir: 1 });
    if (track.score !== score) setTrack({ score, dir: score > track.score ? 1 : -1 });
    const dir = track.dir;

    const prevScore = React.useRef(score);
    const [sheen, setSheen] = React.useState(0);
    React.useEffect(() => {
      const was = prevScore.current;
      if (was === score) return;
      prevScore.current = score;
      onValueChange?.(score);
      if (score === 4 && was < 4) {
        haptic.success();
        setSheen((n) => n + 1);
      }
    }, [score, onValueChange, haptic]);

    // "Can't": a common password flickers the lamps once — 4pt kick, a dip
    // to 0.6, released on spring.shake — and never loops.
    const kick = useSharedValue(0);
    const dip = useSharedValue(1);
    React.useEffect(() => {
      if (!refused) return;
      haptic.warning();
      dip.value = withSequence(withTiming(0.6, timing.instant), withTiming(1, timing.fast));
      if (reduce) return;
      kick.value = FLICKER_KICK;
      kick.value = withSpring(0, spring.shake);
    }, [refused, reduce, haptic, kick, dip]);
    const rowStyle = useAnimatedStyle(() => ({ opacity: dip.value, transform: [{ translateX: kick.value }] }));

    const label = refused ? "Too common" : (labels[Math.min(score, labels.length - 1)] ?? "");
    const hintText = hint ?? deriveHint(password ?? "", score);
    const [shownLabel, labelStyle] = useSwap(label, dir);
    const [shownHint, hintStyle] = useSwap(hintText, 1);
    // One hue: on states read in ink, the refusal in destructive, empty muted.
    const tone = refused ? colors.destructive : score === 0 ? colors.mutedForeground : colors.foreground;

    return (
      <View
        ref={ref}
        className={cn("w-full gap-2", className)}
        accessibilityRole="progressbar"
        accessibilityLabel={props.accessibilityLabel ?? `Password strength: ${label}`}
        accessibilityValue={{ min: 0, max: 4, now: score }}
        {...props}
      >
        <View className="flex-row items-center gap-2">
          <Animated.View
            className="flex-1 flex-row gap-1 overflow-hidden rounded-full"
            style={rowStyle}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            {[0, 1, 2, 3].map((i) => (
              <Lamp key={i} on={i < score} refused={refused} trackClassName={trackClassName} />
            ))}
            <Sheen run={sheen} />
          </Animated.View>
          {showLabel ? (
            <Animated.Text
              className="min-w-16 text-right text-[13px] font-semibold"
              style={[{ color: tone }, labelStyle]}
              accessibilityElementsHidden
              importantForAccessibility="no"
            >
              {shownLabel}
            </Animated.Text>
          ) : null}
        </View>
        {shownHint ? (
          <Animated.View style={hintStyle}>
            <Text className={cn("text-[13px]", shownHint === STRONG_HINT ? "font-medium text-primary-text" : "text-muted-foreground")}>
              {shownHint}
            </Text>
          </Animated.View>
        ) : null}
      </View>
    );
  }
);

PasswordStrength.displayName = "PasswordStrength";
