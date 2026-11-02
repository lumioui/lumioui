/**
 * Glyphs — navigation & chrome. See README.md for the geometry/motion
 * contract: 24px grid, 2px round-capped strokes, soft blob silhouettes,
 * one playful detail per glyph (glints, arches, wristlets). Gestures
 * return to rest.
 */
import * as React from "react";
import { Path, Circle, Line } from "react-native-svg";
import { interpolate, useAnimatedProps } from "react-native-reanimated";
import {
  AnimatedCircle,
  AnimatedG,
  AnimatedLine,
  AnimatedPath,
  AnimatedRect,
  tempo,
} from "@lumioui/core";
import { rotateAbout, translateXY, type GlyphCtx, type GlyphDef } from "./motion";

const stroke = (color: string, sw: number) => ({
  stroke: color,
  strokeWidth: sw,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  fill: "none",
});

/** Home — a soft blob house; the arched door draws itself up as the
 *  gesture, like a light coming on. */
const DOOR_LEN = 11;
function HomeGlyph({ t, color, sw }: GlyphCtx) {
  const door = useAnimatedProps(() => ({
    strokeDashoffset: DOOR_LEN * (1 - interpolate(t.value, [0.15, 0.85], [0, 1], "clamp")),
  }));
  const lift = useAnimatedProps(() => ({
    transform: translateXY(0, interpolate(t.value, [0, 0.5, 1], [0, -0.8, 0])),
  }));
  return (
    <AnimatedG animatedProps={lift}>
      <Path
        d="M3.2 12.4c0-1.9.6-2.9 1.9-3.9l4.6-3.4c1.4-1 3.2-1 4.6 0l4.6 3.4c1.3 1 1.9 2 1.9 3.9v4.8c0 2.1-1.7 3.8-3.8 3.8H7c-2.1 0-3.8-1.7-3.8-3.8v-4.8z"
        {...stroke(color, sw)}
      />
      <AnimatedPath
        d="M10.2 21v-3.8c0-1 .8-1.8 1.8-1.8s1.8.8 1.8 1.8V21"
        strokeDasharray={DOOR_LEN}
        {...stroke(color, sw)}
        animatedProps={door}
      />
    </AnimatedG>
  );
}

/** Search — a small inspect tilt; the handle lengthens as it leans in. */
function SearchGlyph({ t, color, sw }: GlyphCtx) {
  const tilt = useAnimatedProps(() => ({
    transform: rotateAbout(interpolate(t.value, [0, 0.5, 1], [0, -9, 0]), 10.5, 10.5),
  }));
  const handle = useAnimatedProps(() => ({
    x2: interpolate(t.value, [0, 0.5, 1], [19.7, 21, 19.7]),
    y2: interpolate(t.value, [0, 0.5, 1], [19.7, 21, 19.7]),
  }));
  return (
    <>
      <AnimatedG animatedProps={tilt}>
        <Circle cx={10.5} cy={10.5} r={6.6} {...stroke(color, sw)} />
        <Circle cx={8.3} cy={8.5} r={0.01} {...stroke(color, sw)} />
      </AnimatedG>
      <AnimatedLine x1={15.4} y1={15.4} {...stroke(color, sw)} animatedProps={handle} />
    </>
  );
}

/** Plus — quarter-turns like a dial being set ("create" as a commit). */
function PlusGlyph({ t, color, sw }: GlyphCtx) {
  const spin = useAnimatedProps(() => ({
    transform: rotateAbout(interpolate(t.value, [0, 1], [0, 90])),
  }));
  return (
    <AnimatedG animatedProps={spin}>
      <Line x1={12} y1={5.5} x2={12} y2={18.5} {...stroke(color, sw)} />
      <Line x1={5.5} y1={12} x2={18.5} y2={12} {...stroke(color, sw)} />
    </AnimatedG>
  );
}

/** X — both strokes draw on, second one chasing the first. */
const X_LEN = 17.5;
function XGlyph({ t, color, sw }: GlyphCtx) {
  const a = useAnimatedProps(() => ({
    strokeDashoffset: X_LEN * (1 - interpolate(t.value, [0, 0.7], [0, 1], "clamp")),
  }));
  const b = useAnimatedProps(() => ({
    strokeDashoffset: X_LEN * (1 - interpolate(t.value, [0.3, 1], [0, 1], "clamp")),
  }));
  return (
    <>
      <AnimatedPath d="M6 6l12 12" strokeDasharray={X_LEN} {...stroke(color, sw)} animatedProps={a} />
      <AnimatedPath d="M18 6 6 18" strokeDasharray={X_LEN} {...stroke(color, sw)} animatedProps={b} />
    </>
  );
}

/** Check — the zigzag tick draws itself. */
const CHECK_LEN = 22.5;
function CheckGlyph({ t, color, sw }: GlyphCtx) {
  const p = useAnimatedProps(() => ({
    strokeDashoffset: CHECK_LEN * (1 - t.value),
  }));
  return (
    <AnimatedPath
      d="M5 12.8l4.3 4.3L19.4 7.4"
      strokeDasharray={CHECK_LEN}
      {...stroke(color, sw)}
      animatedProps={p}
    />
  );
}

/** Check-circle — ring is always drawn; the tick draws inside it. */
const TICK_LEN = 11.5;
function CheckCircleGlyph({ t, color, sw }: GlyphCtx) {
  const p = useAnimatedProps(() => ({
    strokeDashoffset: TICK_LEN * (1 - interpolate(t.value, [0.15, 1], [0, 1], "clamp")),
  }));
  return (
    <>
      <Circle cx={12} cy={12} r={8.5} {...stroke(color, sw)} />
      <AnimatedPath
        d="M8.3 12.5l2.9 2.9 4.9-5.9"
        strokeDasharray={TICK_LEN}
        {...stroke(color, sw)}
        animatedProps={p}
      />
    </>
  );
}

/** Arrow — the head is a straight chevron (zigzag accent); the gesture
 *  is a surge: the whole glyph travels out and settles back.
 *  `rot` spins the canonical right-facing arrow for other directions. */
function ArrowGlyph({ t, color, sw, rot }: GlyphCtx & { rot: number }) {
  const surge = useAnimatedProps(() => ({
    transform: `rotate(${rot} 12 12) translate(${interpolate(t.value, [0, 0.55, 1], [0, 3.4, 0])} 0)`,
  }));
  return (
    <AnimatedG animatedProps={surge}>
      <Line x1={4.5} y1={12} x2={19} y2={12} {...stroke(color, sw)} />
      <Path d="M13.3 6.5c2 2 3.7 3.6 5.5 5.3l-5.5 5.7" {...stroke(color, sw)} />
    </AnimatedG>
  );
}
const ArrowRight = (p: GlyphCtx) => <ArrowGlyph {...p} rot={0} />;
const ArrowUp = (p: GlyphCtx) => <ArrowGlyph {...p} rot={-90} />;
const ArrowLeft = (p: GlyphCtx) => <ArrowGlyph {...p} rot={180} />;

/** Chevron — a crisp directional nudge, spring-loaded.
 *  `rot` spins the canonical right-facing chevron. */
function ChevronGlyph({ t, color, sw, rot }: GlyphCtx & { rot: number }) {
  const nudge = useAnimatedProps(() => ({
    transform: `rotate(${rot} 12 12) translate(${interpolate(t.value, [0, 0.5, 1], [0, 2.8, 0])} 0)`,
  }));
  return (
    <AnimatedG animatedProps={nudge}>
      <Path d="M9.5 6.2c1.9 1.9 3.7 3.7 5.5 5.6l-5.5 6" {...stroke(color, sw)} />
    </AnimatedG>
  );
}
const ChevronRight = (p: GlyphCtx) => <ChevronGlyph {...p} rot={0} />;
const ChevronDown = (p: GlyphCtx) => <ChevronGlyph {...p} rot={90} />;
const ChevronLeft = (p: GlyphCtx) => <ChevronGlyph {...p} rot={180} />;
const ChevronUp = (p: GlyphCtx) => <ChevronGlyph {...p} rot={-90} />;

/** Grid — four tiles pop in on a diagonal cascade. */
const CELL_RANGE: [number, number][] = [
  [0, 0.5],
  [0.15, 0.65],
  [0.15, 0.65],
  [0.3, 0.8],
];
const CELL_POS: [number, number][] = [
  [7.25, 7.25],
  [16.75, 7.25],
  [7.25, 16.75],
  [16.75, 16.75],
];
function GridCell({ t, color, sw, cx, cy, range }: GlyphCtx & { cx: number; cy: number; range: [number, number] }) {
  const props = useAnimatedProps(() => {
    const [a, b] = range;
    const s = interpolate(t.value, [a, (a + b) / 2, b], [1, 1.16, 1], "clamp");
    const w = 6.5 * s;
    return { x: cx - w / 2, y: cy - w / 2, width: w, height: w };
  });
  return (
    <AnimatedRect x={cx - 3.25} y={cy - 3.25} width={6.5} height={6.5} rx={2.2} {...stroke(color, sw)} animatedProps={props} />
  );
}
function GridGlyph(props: GlyphCtx) {
  return (
    <>
      {CELL_POS.map(([cx, cy], i) => (
        <GridCell key={`${cx}-${cy}`} {...props} cx={cx} cy={cy} range={CELL_RANGE[i]!} />
      ))}
    </>
  );
}

/** Filter — a drop falls through the funnel spout. */
function FilterGlyph({ t, color, sw }: GlyphCtx) {
  const drop = useAnimatedProps(() => ({
    cy: interpolate(t.value, [0.1, 0.78], [8, 17.5], "clamp"),
    opacity: interpolate(t.value, [0.1, 0.25, 0.72, 0.82], [0, 1, 1, 0], "clamp"),
  }));
  return (
    <>
      <Path
        d="M4.8 5.4h14.4c.8 0 1.2.9.7 1.5l-5.2 5.9v5.4c0 .5-.3.9-.8 1.1l-3.2 1.3c-.7.3-1.5-.2-1.5-1v-7.3l-5.2-5.9c-.5-.6-.2-1.5.7-1.5z"
        {...stroke(color, sw)}
      />
      <AnimatedCircle cx={12} cy={8} r={0.01} {...stroke(color, sw)} animatedProps={drop} />
    </>
  );
}

/** Refresh — the whole glyph winds 360°, honest about what it does. */
function RefreshGlyph({ t, color, sw }: GlyphCtx) {
  const spin = useAnimatedProps(() => ({
    transform: rotateAbout(interpolate(t.value, [0, 1], [0, 360])),
  }));
  return (
    <AnimatedG animatedProps={spin}>
      <Path d="M3.5 12a8.5 8.5 0 0 1 14.4-6.2l2.6 2.7" {...stroke(color, sw)} />
      <Path d="M20.5 3.5v5h-5" {...stroke(color, sw)} />
      <Path d="M20.5 12a8.5 8.5 0 0 1-14.4 6.2l-2.6-2.7" {...stroke(color, sw)} />
      <Path d="M3.5 20.5v-5h5" {...stroke(color, sw)} />
    </AnimatedG>
  );
}

export const navGlyphs: Record<string, GlyphDef> = {
  home: { component: HomeGlyph, duration: tempo.settle },
  search: { component: SearchGlyph, duration: tempo.settle },
  plus: { component: PlusGlyph, duration: tempo.move },
  x: { rest: 1, component: XGlyph, duration: tempo.move },
  check: { rest: 1, component: CheckGlyph, duration: tempo.move },
  "check-circle": { rest: 1, component: CheckCircleGlyph, duration: tempo.settle },
  "arrow-right": { component: ArrowRight, duration: tempo.settle },
  "arrow-up": { component: ArrowUp, duration: tempo.settle },
  "arrow-left": { component: ArrowLeft, duration: tempo.settle },
  "chevron-right": { component: ChevronRight, duration: tempo.move },
  "chevron-down": { component: ChevronDown, duration: tempo.move },
  "chevron-left": { component: ChevronLeft, duration: tempo.move },
  "chevron-up": { component: ChevronUp, duration: tempo.move },
  grid: { component: GridGlyph, duration: tempo.settle },
  filter: { component: FilterGlyph, duration: tempo.settle },
  refresh: { component: RefreshGlyph, duration: tempo.glow, live: true },
};
