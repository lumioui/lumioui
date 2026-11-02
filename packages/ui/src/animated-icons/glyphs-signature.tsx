/**
 * Signature glyphs — the ones that only exist animated.
 */
import * as React from "react";
import { interpolate, useAnimatedProps } from "react-native-reanimated";
import { AnimatedCircle, AnimatedLine, AnimatedPath, AnimatedRect, tempo } from "@lumioui/core";
import type { GlyphCtx, GlyphDef } from "./motion";

const stroke = (color: string, sw: number) => ({
  stroke: color,
  strokeWidth: sw,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  fill: "none",
});

/** Lumio mark — the accent tile lands and the zigzag draws itself across it.
 *  The mark's own path scaled from the 32px brand viewBox into our 24px
 *  live area; the zigzag is pure pointed energy (see README §3). */
const ZIG_LEN = 24;
function LumioMarkGlyph({ t, sw, accent, accentInk }: GlyphCtx) {
  const tile = useAnimatedProps(() => ({
    opacity: interpolate(t.value, [0, 0.25], [0, 1], "clamp"),
  }));
  const zig = useAnimatedProps(() => ({
    strokeDashoffset: ZIG_LEN * (1 - interpolate(t.value, [0.2, 1], [0, 1], "clamp")),
  }));
  return (
    <>
      <AnimatedRect x={3} y={3} width={18} height={18} rx={5} fill={accent} stroke="none" animatedProps={tile} />
      <AnimatedPath
        d="M5.8 15.6 9.2 8.3l3.4 7.3 3.3-7.3 3.4 7.3 2.3-6.7"
        stroke={accentInk}
        strokeWidth={sw * 1.1}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        strokeDasharray={ZIG_LEN}
        animatedProps={zig}
      />
    </>
  );
}

/** Pulse dot — a breathing node: ring ripples out, core swells. Loops. */
function PulseDotGlyph({ t, color, sw }: GlyphCtx) {
  const ring = useAnimatedProps(() => ({
    r: interpolate(t.value, [0, 0.75], [4, 9.5]),
    opacity: interpolate(t.value, [0, 0.75, 1], [0.5, 0, 0]),
  }));
  const core = useAnimatedProps(() => ({
    r: interpolate(t.value, [0, 0.4, 0.8, 1], [3.2, 3.7, 3.2, 3.2]),
  }));
  return (
    <>
      <AnimatedCircle cx={12} cy={12} fill="none" stroke={color} strokeWidth={sw * 0.8} animatedProps={ring} />
      <AnimatedCircle cx={12} cy={12} fill={color} stroke="none" animatedProps={core} />
    </>
  );
}

/** Play ⇄ pause — three lines slide into bars; t IS the morph state
 *  (0 = play, 1 = pause). Toggle glyph. */
function PlayPauseGlyph({ t, color, sw }: GlyphCtx) {
  const up = useAnimatedProps(() => ({
    x1: interpolate(t.value, [0, 1], [9, 9]),
    y1: interpolate(t.value, [0, 1], [5.8, 5.8]),
    x2: interpolate(t.value, [0, 1], [18.4, 9]),
    y2: interpolate(t.value, [0, 1], [12, 18.2]),
  }));
  const mid = useAnimatedProps(() => ({
    x1: interpolate(t.value, [0, 1], [9, 15]),
    y1: interpolate(t.value, [0, 1], [5.8, 5.8]),
    x2: interpolate(t.value, [0, 1], [9, 15]),
    y2: interpolate(t.value, [0, 1], [18.2, 18.2]),
    opacity: interpolate(t.value, [0, 0.4, 1], [1, 1, 1]),
  }));
  const dn = useAnimatedProps(() => ({
    x1: interpolate(t.value, [0, 1], [9, 18.4]),
    y1: interpolate(t.value, [0, 1], [18.2, 12]),
    x2: interpolate(t.value, [0, 1], [18.4, 18.4]),
    y2: interpolate(t.value, [0, 1], [12, 18.2]),
    opacity: interpolate(t.value, [0, 0.5, 1], [1, 0, 0]),
  }));
  return (
    <>
      <AnimatedLine {...stroke(color, sw)} animatedProps={up} />
      <AnimatedLine {...stroke(color, sw)} animatedProps={mid} />
      <AnimatedLine {...stroke(color, sw)} animatedProps={dn} />
    </>
  );
}

/** Menu ⇄ close — three lines collapse into an X. Toggle glyph.
 *  Canonical menu: top/bottom lines rotate into the diagonals, middle
 *  shrinks to a point. */
function MenuGlyph({ t, color, sw }: GlyphCtx) {
  const top = useAnimatedProps(() => ({
    x1: interpolate(t.value, [0, 1], [4, 6.6]),
    y1: interpolate(t.value, [0, 1], [7, 6.6]),
    x2: interpolate(t.value, [0, 1], [20, 17.4]),
    y2: interpolate(t.value, [0, 1], [7, 17.4]),
  }));
  const mid = useAnimatedProps(() => ({
    x1: interpolate(t.value, [0, 1], [4, 12]),
    x2: interpolate(t.value, [0, 1], [20, 12]),
    y1: 12,
    y2: 12,
    opacity: interpolate(t.value, [0, 0.7, 1], [1, 1, 0.001]),
  }));
  const bot = useAnimatedProps(() => ({
    x1: interpolate(t.value, [0, 1], [4, 6.6]),
    y1: interpolate(t.value, [0, 1], [17, 17.4]),
    x2: interpolate(t.value, [0, 1], [20, 17.4]),
    y2: interpolate(t.value, [0, 1], [17, 6.6]),
  }));
  return (
    <>
      <AnimatedLine {...stroke(color, sw)} animatedProps={top} />
      <AnimatedLine {...stroke(color, sw)} animatedProps={mid} />
      <AnimatedLine {...stroke(color, sw)} animatedProps={bot} />
    </>
  );
}

/** Waveform — the zigzag's cousin: five bars bounce like an EQ. */
const WF: [number, number, number][] = [
  // x, centerY, maxHeight
  [6, 12, 6],
  [9.5, 12, 12],
  [13, 12, 8],
  [16.5, 12, 14],
  [20, 12, 7],
];
function WfBar({ t, color, sw, x, cy, h, phase }: GlyphCtx & { x: number; cy: number; h: number; phase: [number, number] }) {
  const props = useAnimatedProps(() => {
    const [a, b] = phase;
    const p = interpolate(t.value, [a, (a + b) / 2, b], [1, 1.9, 1], "clamp");
    const half = (h * p) / 2;
    return { y1: cy - half, y2: cy + half };
  });
  return <AnimatedLine x1={x} x2={x} y1={cy - h / 2} y2={cy + h / 2} {...stroke(color, sw)} animatedProps={props} />;
}
function WaveformGlyph(props: GlyphCtx) {
  const phases: [number, number][] = [
    [0.1, 0.7],
    [0, 0.6],
    [0.3, 0.9],
    [0.15, 0.75],
    [0.35, 0.95],
  ];
  return (
    <>
      {WF.map(([x, cy, h], i) => (
        <WfBar key={x} {...props} x={x} cy={cy} h={h} phase={phases[i]!} />
      ))}
    </>
  );
}

export const signatureGlyphs: Record<string, GlyphDef> = {
  "lumio-mark": { rest: 1, component: LumioMarkGlyph, duration: tempo.roll },
  "pulse-dot": { component: PulseDotGlyph, duration: tempo.roll * 2, live: true },
  "play-pause": { kind: "toggle", component: PlayPauseGlyph },
  menu: { kind: "toggle", component: MenuGlyph },
  waveform: { component: WaveformGlyph, duration: tempo.roll, live: true },
};
