import * as React from "react";
import { forwardRef } from "react";
import { View, type ViewProps } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  runOnUI,
  useAnimatedProps,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import Svg, { Defs, LinearGradient, Stop } from "react-native-svg";
import {
  ACCENTS,
  AnimatedPath,
  cn,
  ease,
  spring,
  timing,
  useReducedMotion,
  useTheme,
  type AccentName,
} from "@lumioui/core";

export type CharacterShape = "squircle" | "cloud" | "blob" | "circle";
export type CharacterExpression = "calm" | "happy" | "sleepy" | "surprised" | "sad";
export type CharacterEyes = "dot" | "pill";
export type CharacterSize = "inline" | "sm" | "md" | "lg" | "xl";

export interface CharacterRenderState {
  shape: CharacterShape;
  expression: CharacterExpression;
  /** The resolved body colour (hex). */
  color: string;
  /** Side of the square box the character draws in, in points. */
  size: number;
}

export interface CharacterProps extends Omit<ViewProps, "className" | "children"> {
  /** Body silhouette. Changing it morphs the outline in place. Default "squircle". */
  shape?: CharacterShape;
  /** Eye pose. Changing it morphs the eyes and the body's posture. Default "calm". */
  expression?: CharacterExpression;
  /** Round dots or tall pills. Default "dot". */
  eyes?: CharacterEyes;
  /** A curated accent name or a `#RRGGBB` hex. Default: the surrounding
   *  accent (`useTheme().colors.primary`). Changes crossfade. */
  color?: AccentName | (string & {});
  /** Eye colour. Default: the accent's own `on` colour, or ink / white by
   *  luminance for a custom hex. */
  eyeColor?: string;
  /** Box side in points, or a preset: inline 28 (sits in a headline), sm 48,
   *  md 72, lg 112, xl 160. Default "md". */
  size?: CharacterSize | number;
  /** Brightness 0..1 — the character can carry a value as its light. Default 1. */
  light?: number;
  /** A supplied mascot (image or illustration) drawn in place of the shape.
   *  Pass a function to swap the pose per expression. The slot keeps the
   *  same box, posture and brightness rules as the drawn character. */
  render?: React.ReactNode | ((state: CharacterRenderState) => React.ReactNode);
  /** Accessibility label. Default "<expression> character". Pass "" to hide
   *  a purely decorative character from screen readers. */
  label?: string;
  className?: string;
}

const SIZES: Record<CharacterSize, number> = { inline: 28, sm: 48, md: 72, lg: 112, xl: 160 };

/** Drawing space — every shape and eye lives in a 100×100 box. */
const VB = 100;
/** Outline samples. Every shape uses the same count and start angle, so a
 *  morph is a point-for-point blend and never twists. */
const N = 64;

type Pts = number[];
interface ShapeDef {
  pts: Pts;
  /** Eye line and spacing for this silhouette. */
  eyeY: number;
  eyeGap: number;
}

const angle = (i: number) => -Math.PI / 2 + (2 * Math.PI * i) / N;
const spow = (v: number, p: number) => Math.sign(v) * Math.abs(v) ** p;

function sample(fn: (c: number, s: number, t: number) => [number, number]): Pts {
  const out: Pts = [];
  for (let i = 0; i < N; i++) {
    const t = angle(i);
    const [x, y] = fn(Math.cos(t), Math.sin(t), t);
    out.push(Math.round(x * 100) / 100, Math.round(y * 100) / 100);
  }
  return out;
}

const SHAPES: Record<CharacterShape, ShapeDef> = {
  circle: { pts: sample((c, s) => [50 + 42 * c, 52 + 42 * s]), eyeY: 47, eyeGap: 28 },
  // Superellipse: flat sides, soft corners, a touch wider than tall.
  squircle: {
    pts: sample((c, s) => [50 + 45 * spow(c, 0.45), 53 + 40 * spow(s, 0.45)]),
    eyeY: 47,
    eyeGap: 30,
  },
  // Three slow lobes — organic, never symmetric.
  blob: {
    pts: sample((c, s, t) => {
      const r = 1 + 0.05 * Math.sin(2 * t + 0.6) + 0.05 * Math.cos(3 * t - 0.4) + 0.025 * Math.sin(5 * t + 1);
      return [50 + 44 * r * c, 53 + 39 * r * s];
    }),
    eyeY: 48,
    eyeGap: 29,
  },
  // Bumpy crown over a flat, soft base.
  cloud: {
    pts: sample((c, s, t) => {
      // Base and crown meet at the sides (bump 0, s 0), so the outline is seamless.
      if (s > 0) return [50 + 46 * spow(c, 0.5), 62 + 24 * spow(s, 0.45)];
      const bump = Math.abs(Math.sin(3 * (t + Math.PI))) ** 0.8;
      const r = 1 + 0.26 * bump;
      return [50 + 46 * r * c, 62 + 32 * r * s];
    }),
    eyeY: 62,
    eyeGap: 30,
  },
};

/** One eye as a lens: a top arc and a bottom arc between two corners.
 *  hw half-width; top / bottom arc heights (negative bends the arc the other
 *  way — that is how a dot becomes a ◠ smile or a ◡ sleepy lid); droop lowers
 *  the outer end of the top arc; dy moves the eye off the eye line. */
interface EyePose {
  hw: number;
  top: number;
  bottom: number;
  droop: number;
  dy: number;
}

/** Body posture per expression — scale from the feet. */
interface Posture {
  sx: number;
  sy: number;
}

const EXPRESSIONS: Record<CharacterExpression, { eye: EyePose; body: Posture }> = {
  calm: { eye: { hw: 5, top: 5, bottom: 5, droop: 0, dy: 0 }, body: { sx: 1, sy: 1 } },
  happy: { eye: { hw: 6, top: 6.5, bottom: -3.5, droop: 0, dy: -1 }, body: { sx: 0.98, sy: 1.04 } },
  sleepy: { eye: { hw: 6, top: -0.5, bottom: 4.5, droop: 0, dy: 3 }, body: { sx: 1.06, sy: 0.92 } },
  surprised: { eye: { hw: 6.5, top: 6.5, bottom: 6.5, droop: 0, dy: -2 }, body: { sx: 0.96, sy: 1.06 } },
  sad: { eye: { hw: 5.5, top: 5, bottom: 3.5, droop: 4.5, dy: 3 }, body: { sx: 1.02, sy: 0.95 } },
};

/** Pill eyes: narrower and taller than dots, same poses. */
const PILL = { hw: 0.7, h: 1.35 } as const;

/** Eye pose packed as an array so it can blend in one worklet. */
function packEye(expression: CharacterExpression, eyes: CharacterEyes): number[] {
  const e = EXPRESSIONS[expression].eye;
  const k = eyes === "pill" ? PILL : { hw: 1, h: 1 };
  return [e.hw * k.hw, e.top * k.h, e.bottom * k.h, e.droop, e.dy];
}

function mix(a: number[], b: number[], t: number): number[] {
  "worklet";
  const out = new Array<number>(a.length);
  for (let i = 0; i < a.length; i++) out[i] = a[i]! + (b[i]! - a[i]!) * t;
  return out;
}

/** Closed Catmull-Rom through the first `n` samples, as cubic Béziers. */
function outlinePath(p: number[], n: number): string {
  "worklet";
  const at = (i: number) => ((i % n) + n) % n;
  let d = `M${p[0]!.toFixed(2)} ${p[1]!.toFixed(2)}`;
  for (let i = 0; i < n; i++) {
    const i0 = at(i - 1) * 2;
    const i1 = at(i) * 2;
    const i2 = at(i + 1) * 2;
    const i3 = at(i + 2) * 2;
    const c1x = p[i1]! + (p[i2]! - p[i0]!) / 6;
    const c1y = p[i1 + 1]! + (p[i2 + 1]! - p[i0 + 1]!) / 6;
    const c2x = p[i2]! - (p[i3]! - p[i1]!) / 6;
    const c2y = p[i2 + 1]! - (p[i3 + 1]! - p[i1 + 1]!) / 6;
    d += `C${c1x.toFixed(2)} ${c1y.toFixed(2)} ${c2x.toFixed(2)} ${c2y.toFixed(2)} ${p[i2]!.toFixed(2)} ${p[i2 + 1]!.toFixed(2)}`;
  }
  return `${d}Z`;
}

/** One eye. side -1 = left, 1 = right (droop lowers the outer corner). */
function eyePath(cx: number, cy: number, pose: number[], side: number): string {
  "worklet";
  const hw = pose[0]!;
  const top = pose[1]!;
  const bottom = pose[2]!;
  const droop = pose[3]!;
  const y = cy + pose[4]!;
  // 4/3 turns an arc height into the control offset of a single cubic.
  const k = 4 / 3;
  const topL = side < 0 ? top - droop : top;
  const topR = side < 0 ? top : top - droop;
  const L = (cx - hw).toFixed(2);
  const R = (cx + hw).toFixed(2);
  return (
    `M${L} ${y.toFixed(2)}` +
    `C${L} ${(y - k * topL).toFixed(2)} ${R} ${(y - k * topR).toFixed(2)} ${R} ${y.toFixed(2)}` +
    `C${R} ${(y + k * bottom).toFixed(2)} ${L} ${(y + k * bottom).toFixed(2)} ${L} ${y.toFixed(2)}Z`
  );
}

/** Dark-on-bright and light-on-dark eye inks — the same pair the curated
 *  accents use for their `on` colour. */
const INK = ACCENTS.amber.on;
const PAPER = ACCENTS.blue.on;

/** WCAG relative luminance of a #RGB / #RGBA / #RRGGBB / #RRGGBBAA hex,
 *  0..1 (alpha ignored), or null when the colour isn't a hex. */
function luminance(hex: string): number | null {
  const m = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(hex.trim());
  if (!m) return null;
  let h = m[1]!;
  if (h.length <= 4) h = h.replace(/./g, (c) => c + c);
  const lin = (i: number) => {
    const v = parseInt(h.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(0) + 0.7152 * lin(2) + 0.0722 * lin(4);
}

/** Eye ink for a custom body colour. A colour we can't read (rgb(), a name)
 *  gets light eyes — most custom bodies are mid-to-dark. */
function inkFor(fill: string): string {
  const l = luminance(fill);
  return l !== null && l > 0.4 ? INK : PAPER;
}

interface Paint {
  fill: string;
  on: string;
}

/** The anchors (eye line, gap) ride at the end of the outline array so they
 *  morph with the silhouette. */
const withAnchors = (s: ShapeDef) => [...s.pts, s.eyeY, s.eyeGap];

interface LayerProps {
  /** Path strings, computed once per frame in Character and shared by both layers. */
  outline: SharedValue<string>;
  leftEye: SharedValue<string>;
  rightEye: SharedValue<string>;
  body: string;
  eye: string;
  id: string;
}

/** One painted copy of the character. A second copy sits underneath only
 *  while a colour change crossfades. */
function Layer({ outline, leftEye, rightEye, body, eye, id }: LayerProps) {
  const bodyProps = useAnimatedProps(() => ({ d: outline.value }));
  const lightProps = useAnimatedProps(() => ({ d: outline.value }));
  const leftProps = useAnimatedProps(() => ({ d: leftEye.value }));
  const rightProps = useAnimatedProps(() => ({ d: rightEye.value }));
  return (
    <Svg width="100%" height="100%" viewBox={`0 0 ${VB} ${VB}`}>
      <Defs>
        {/* Light from above: the top of the body is lit, fading by mid-height. */}
        <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <Stop offset={0} stopColor="#FFFFFF" stopOpacity={0.28} />
          <Stop offset={0.55} stopColor="#FFFFFF" stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <AnimatedPath animatedProps={bodyProps} fill={body} />
      <AnimatedPath animatedProps={lightProps} fill={`url(#${id})`} />
      <AnimatedPath animatedProps={leftProps} fill={eye} />
      <AnimatedPath animatedProps={rightProps} fill={eye} />
    </Svg>
  );
}

/**
 * Character — a shape character built from primitives: a squircle, cloud,
 * blob or circle with two dot or pill eyes. Shape, colour, expression, size
 * and brightness are props, so a product can make any of them carry a value.
 * Changing shape morphs the outline point-for-point, changing expression
 * re-poses the eyes and the body's posture, both on `spring.swap` (lands
 * dead on, no rebound); colour crossfades. Reduced motion jumps the shape,
 * eyes and posture and keeps the colour and brightness fades. A supplied
 * mascot goes in `render` and obeys the same rules. Expo Go compatible.
 *
 *   <Character shape="cloud" expression="happy" />
 *   <Text>Sleep <Character size="inline" expression="sleepy" /> better</Text>
 */
export const Character = forwardRef<React.ElementRef<typeof View>, CharacterProps>(function Character(
  {
    shape = "squircle",
    expression = "calm",
    eyes = "dot",
    color,
    eyeColor,
    size = "md",
    light = 1,
    render,
    label,
    className,
    style,
    ...props
  },
  ref
) {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const box = typeof size === "number" ? size : SIZES[size];
  const id = React.useId().replace(/[^a-zA-Z0-9]/g, "");

  const curated = color ? (ACCENTS as Record<string, (typeof ACCENTS)[AccentName]>)[color] : undefined;
  const fill = curated ? curated.fill : (color ?? colors.primary);
  const on = eyeColor ?? (curated ? curated.on : color ? inkFor(fill) : colors.primaryForeground);

  // Colour crossfade: `prev` is painted underneath only while `cur` fades in,
  // then dropped — a hidden copy would show through whenever `light` < 1.
  const [paint, setPaint] = React.useState<{ prev: Paint | null; cur: Paint }>({ prev: null, cur: { fill, on } });
  if (paint.cur.fill !== fill || paint.cur.on !== on) {
    // Resolve during render — the outgoing colour becomes the underlay.
    setPaint({ prev: paint.cur, cur: { fill, on } });
  }
  const fade = useSharedValue(1);
  // Each crossfade gets a number, so a fade that ends late can't drop the
  // underlay of a newer one.
  const fadeGen = React.useRef(0);
  const clearPrev = React.useCallback((gen: number) => {
    if (gen === fadeGen.current) setPaint((p) => (p.prev ? { prev: null, cur: p.cur } : p));
  }, []);
  React.useEffect(() => {
    if (!paint.prev) return; // first mount, or the underlay was just dropped
    const gen = ++fadeGen.current;
    fade.value = 0;
    fade.value = withTiming(1, { ...timing.normal, easing: Easing.bezier(...ease.out) }, (finished) => {
      "worklet";
      if (finished) runOnJS(clearPrev)(gen);
    });
  }, [paint, fade, clearPrev]);

  const initialPts = React.useMemo(() => withAnchors(SHAPES[shape]), []); // eslint-disable-line react-hooks/exhaustive-deps
  const initialEye = React.useMemo(() => packEye(expression, eyes), []); // eslint-disable-line react-hooks/exhaustive-deps
  const fromPts = useSharedValue(initialPts);
  const toPts = useSharedValue(initialPts);
  const fromEye = useSharedValue(initialEye);
  const toEye = useSharedValue(initialEye);
  const shapeT = useSharedValue(1);
  const eyeT = useSharedValue(1);
  const posture = EXPRESSIONS[expression].body;
  const sx = useSharedValue(reducedMotion ? 1 : posture.sx);
  const sy = useSharedValue(reducedMotion ? 1 : posture.sy);
  const glow = useSharedValue(light);

  // Blend once per frame; both painted layers read the same strings.
  const pts = useDerivedValue(() => mix(fromPts.value, toPts.value, shapeT.value));
  const pose = useDerivedValue(() => mix(fromEye.value, toEye.value, eyeT.value));
  const outline = useDerivedValue(() => outlinePath(pts.value, N));
  const leftEye = useDerivedValue(() => eyePath(50 - pts.value[N * 2 + 1]! / 2, pts.value[N * 2]!, pose.value, -1));
  const rightEye = useDerivedValue(() => eyePath(50 + pts.value[N * 2 + 1]! / 2, pts.value[N * 2]!, pose.value, 1));

  // Shape → morph from wherever the outline is now (mid-morph included).
  // The first run is skipped: the shared values already start at the target.
  const firstShape = React.useRef(true);
  React.useEffect(() => {
    if (firstShape.current) {
      firstShape.current = false;
      return;
    }
    const target = withAnchors(SHAPES[shape]);
    const instant = reducedMotion;
    runOnUI(() => {
      "worklet";
      fromPts.value = instant ? target : mix(fromPts.value, toPts.value, Math.min(1, shapeT.value));
      toPts.value = target;
      shapeT.value = instant ? 1 : 0;
      if (!instant) shapeT.value = withSpring(1, spring.swap);
    })();
  }, [shape, reducedMotion, fromPts, toPts, shapeT]);

  // Expression → eyes re-pose and the body takes its posture.
  const firstPose = React.useRef(true);
  React.useEffect(() => {
    if (firstPose.current) {
      firstPose.current = false;
      return;
    }
    const target = packEye(expression, eyes);
    const body = EXPRESSIONS[expression].body;
    const instant = reducedMotion;
    runOnUI(() => {
      "worklet";
      fromEye.value = instant ? target : mix(fromEye.value, toEye.value, Math.min(1, eyeT.value));
      toEye.value = target;
      eyeT.value = instant ? 1 : 0;
      if (!instant) eyeT.value = withSpring(1, spring.swap);
      // Reduced motion drops the posture (scale) entirely.
      sx.value = instant ? 1 : withSpring(body.sx, spring.swap);
      sy.value = instant ? 1 : withSpring(body.sy, spring.swap);
    })();
  }, [expression, eyes, reducedMotion, fromEye, toEye, eyeT, sx, sy]);

  // Brightness is opacity, so it fades under reduced motion too.
  React.useEffect(() => {
    glow.value = withTiming(Math.min(1, Math.max(0, light)), { ...timing.normal, easing: Easing.bezier(...ease.out) });
  }, [light, glow]);

  const postureStyle = useAnimatedStyle(() => ({
    opacity: 0.5 + 0.5 * glow.value,
    // Squash and stretch from the feet: the base stays on the floor.
    transform: [{ translateY: (box * (1 - sy.value)) / 2 }, { scaleX: sx.value }, { scaleY: sy.value }],
  }));
  const fadeStyle = useAnimatedStyle(() => ({ opacity: fade.value }));
  const paths = { outline, leftEye, rightEye };

  const a11yLabel = label ?? `${expression} character`;
  const hidden = a11yLabel === "";
  const mascot = typeof render === "function" ? render({ shape, expression, color: fill, size: box }) : render;

  return (
    <View
      ref={ref}
      className={cn("items-center justify-center", className)}
      style={[{ width: box, height: box }, style]}
      accessible={!hidden}
      accessibilityRole={hidden ? undefined : "image"}
      accessibilityLabel={hidden ? undefined : a11yLabel}
      accessibilityElementsHidden={hidden}
      importantForAccessibility={hidden ? "no-hide-descendants" : "yes"}
      {...props}
    >
      {/* Offscreen compositing so brightness dims the character as one group. */}
      <Animated.View
        needsOffscreenAlphaCompositing
        style={[{ width: box, height: box, pointerEvents: "none" }, postureStyle]}
      >
        {mascot != null ? (
          mascot
        ) : (
          <>
            {paint.prev ? (
              <View style={{ position: "absolute", width: box, height: box }}>
                <Layer {...paths} body={paint.prev.fill} eye={paint.prev.on} id={`${id}p`} />
              </View>
            ) : null}
            <Animated.View style={[{ position: "absolute", width: box, height: box }, fadeStyle]}>
              <Layer {...paths} body={paint.cur.fill} eye={paint.cur.on} id={`${id}c`} />
            </Animated.View>
          </>
        )}
      </Animated.View>
    </View>
  );
});

Character.displayName = "Character";

/** Map a 0..1 value (mood, energy, progress) to an expression, low → high:
 *  sad, sleepy, calm, happy. Surprised is left for events. */
export function expressionFor(value: number): CharacterExpression {
  const v = Math.min(1, Math.max(0, value));
  if (v < 0.2) return "sad";
  if (v < 0.45) return "sleepy";
  if (v < 0.75) return "calm";
  return "happy";
}
