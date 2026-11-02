/**
 * Glyphs — objects & actions. Same contract as glyphs-nav; each comment
 * names the verb the gesture performs.
 */
import * as React from "react";
import { Path, Circle, Line } from "react-native-svg";
import { interpolate, useAnimatedProps } from "react-native-reanimated";
import {
  AnimatedCircle,
  AnimatedEllipse,
  AnimatedG,
  AnimatedLine,
  AnimatedPath,
  tempo,
} from "@lumioui/core";
import { rotateAbout, scaleAbout, translateXY, type GlyphCtx, type GlyphDef } from "./motion";

const stroke = (color: string, sw: number) => ({
  stroke: color,
  strokeWidth: sw,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  fill: "none",
});

/** Bell — rings: the shell swings and the clapper counter-swings, decaying. */
function BellGlyph({ t, color, sw }: GlyphCtx) {
  const shell = useAnimatedProps(() => ({
    transform: rotateAbout(
      interpolate(t.value, [0, 0.25, 0.55, 0.8, 1], [0, -11, 8, -4, 0]),
      12,
      4.5
    ),
  }));
  const clapper = useAnimatedProps(() => ({
    transform: rotateAbout(
      interpolate(t.value, [0, 0.25, 0.55, 0.8, 1], [0, 15, -11, 6, 0]),
      12,
      17
    ),
  }));
  return (
    <>
      <AnimatedG animatedProps={shell}>
        <Path
          d="M12 4.6c3.6 0 5.6 2.4 5.6 5.8 0 2.6.5 4 1.4 5.1.4.5-.1 1.1-.7 1.1H5.7c-.6 0-1.1-.6-.7-1.1.9-1.1 1.4-2.5 1.4-5.1 0-3.4 2-5.8 5.6-5.8z"
          {...stroke(color, sw)}
        />
      </AnimatedG>
      <AnimatedG animatedProps={clapper}>
        <Path d="M10.6 18.8a1.4 1.4 0 0 0 2.8 0" {...stroke(color, sw)} />
      </AnimatedG>
    </>
  );
}

/** Heart — pops and fills: the "like". Toggle glyph (active = filled). */
function HeartGlyph({ t, color, sw }: GlyphCtx) {
  const D =
    "M12 19.8S4.6 14.9 3.6 10.4c-.8-3.5 1.6-5.8 4.1-5.8 1.8 0 3.4 1 4.3 2.4.9-1.4 2.5-2.4 4.3-2.4 2.5 0 4.9 2.3 4.1 5.8-1 4.5-8.4 9.4-8.4 9.4z";
  const pop = useAnimatedProps(() => ({
    transform: scaleAbout(interpolate(t.value, [0, 0.55, 1], [1, 1.22, 1])),
  }));
  const fill = useAnimatedProps(() => ({ opacity: t.value }));
  return (
    <AnimatedG animatedProps={pop}>
      <AnimatedPath d={D} fill={color} stroke="none" animatedProps={fill} />
      <Path d={D} {...stroke(color, sw)} />
    </AnimatedG>
  );
}

/** Star — pops and fills like heart, with a faint turn on the way. */
function StarGlyph({ t, color, sw }: GlyphCtx) {
  const D =
    "M12 4.5l1.9 4.1c.2.4.6.7 1 .7l4.5.5-3.4 3c-.3.3-.5.8-.4 1.2l.9 4.4-3.9-2.2c-.4-.2-.9-.2-1.2 0l-3.9 2.2.9-4.4c.1-.4-.1-.9-.4-1.2l-3.4-3 4.5-.5c.4 0 .8-.3 1-.7z";
  const pop = useAnimatedProps(() => ({
    transform: `${rotateAbout(interpolate(t.value, [0, 0.55, 1], [0, -18, 0]))} ${scaleAbout(
      interpolate(t.value, [0, 0.55, 1], [1, 1.18, 1])
    )}`,
  }));
  const fill = useAnimatedProps(() => ({ opacity: t.value }));
  return (
    <AnimatedG animatedProps={pop}>
      <AnimatedPath d={D} fill={color} stroke="none" animatedProps={fill} />
      <Path d={D} {...stroke(color, sw)} />
    </AnimatedG>
  );
}

/** User — a small nod: head dips, shoulders lift to meet it. */
function UserGlyph({ t, color, sw }: GlyphCtx) {
  const head = useAnimatedProps(() => ({
    cy: interpolate(t.value, [0, 0.5, 1], [8.4, 9.2, 8.4]),
  }));
  const body = useAnimatedProps(() => ({
    transform: translateXY(0, interpolate(t.value, [0, 0.5, 1], [0, -1, 0])),
  }));
  return (
    <>
      <AnimatedCircle cx={12} r={3.6} {...stroke(color, sw)} animatedProps={head} />
      <AnimatedG animatedProps={body}>
        <Path
          d="M12 13.6c-3.3 0-5.6 2.3-5.6 5.4 0 .6.5 1.2 1.2 1.2h8.8c.7 0 1.2-.6 1.2-1.2 0-3.1-2.3-5.4-5.6-5.4z"
          {...stroke(color, sw)}
        />
      </AnimatedG>
    </>
  );
}

/** Settings — the gear turns a quarter; the most honest gesture in the set. */
function SettingsGlyph({ t, color, sw }: GlyphCtx) {
  const turn = useAnimatedProps(() => ({
    transform: rotateAbout(interpolate(t.value, [0, 1], [0, 90])),
  }));
  return (
    <AnimatedG animatedProps={turn}>
      <Path d={FLOWER_D} {...stroke(color, sw)} />
      <Circle cx={12} cy={12} r={2.9} {...stroke(color, sw)} />
    </AnimatedG>
  );
}

/** Scalloped bloom — cosine lobes; the Lumio gear is a flower, not teeth.
 *  Computed once; mirrors flowerPath() in svg/gen.mjs. */
const FLOWER_D = (() => {
  const lobes = 8, rMid = 7.7, amp = 1.05, steps = 14;
  const pts: string[] = [];
  for (let i = 0; i < lobes * steps; i++) {
    const t = (i / (lobes * steps)) * Math.PI * 2;
    const r = rMid + amp * Math.cos(lobes * t + Math.PI / 2);
    pts.push(`${(12 + r * Math.cos(t)).toFixed(2)} ${(12 + r * Math.sin(t)).toFixed(2)}`);
  }
  return `M${pts.join("L")}Z`;
})();

/** Message — three dots bounce through a typing beat. */
function MsgDot({ t, color, sw, x, range }: GlyphCtx & { x: number; range: [number, number] }) {
  const props = useAnimatedProps(() => {
    const [a, b] = range;
    const y = interpolate(t.value, [a, (a + b) / 2, b], [10.7, 8.9, 10.7], "clamp");
    return { y1: y, y2: y };
  });
  return <AnimatedLine x1={x} y1={10.7} x2={x} y2={10.7} {...stroke(color, sw)} strokeWidth={sw + 0.6} animatedProps={props} />;
}
const MSG_DOTS: [number, [number, number]][] = [
  [8.5, [0.05, 0.5]],
  [12, [0.28, 0.73]],
  [15.5, [0.51, 0.96]],
];
function MessageGlyph(props: GlyphCtx) {
  return (
    <>
      <Path
        d="M5.4 4.9h13.2c1.5 0 2.7 1.2 2.7 2.7v6.4c0 1.5-1.2 2.7-2.7 2.7h-4.4l-3.4 3c-.6.5-1.5 0-1.5-.8v-2.2H5.4c-1.5 0-2.7-1.2-2.7-2.7V7.6c0-1.5 1.2-2.7 2.7-2.7z"
        {...stroke(props.color, props.sw)}
      />
      {MSG_DOTS.map(([x, range]) => (
        <MsgDot key={x} {...props} x={x} range={range} />
      ))}
    </>
  );
}

/** Mail — the flap lifts open: two lines share the vertex and it rises. */
function MailGlyph({ t, color, sw }: GlyphCtx) {
  const left = useAnimatedProps(() => ({
    y2: interpolate(t.value, [0, 1], [13.4, 6.8]),
  }));
  const right = useAnimatedProps(() => ({
    y1: interpolate(t.value, [0, 1], [13.4, 6.8]),
  }));
  return (
    <>
      <Path
        d="M4.8 5.4h14.4c1.5 0 2.7 1.2 2.7 2.7v7.8c0 1.5-1.2 2.7-2.7 2.7H4.8c-1.5 0-2.7-1.2-2.7-2.7V8.1c0-1.5 1.2-2.7 2.7-2.7z"
        {...stroke(color, sw)}
      />
      <AnimatedLine x1={3.2} y1={8.6} x2={12} {...stroke(color, sw)} animatedProps={left} />
      <AnimatedLine x2={20.8} y2={8.6} x1={12} {...stroke(color, sw)} animatedProps={right} />
    </>
  );
}

/** Trash — the lid tips open and the ribs dip, like a real pedal bin. */
function TrashGlyph({ t, color, sw }: GlyphCtx) {
  const lid = useAnimatedProps(() => ({
    transform: rotateAbout(interpolate(t.value, [0, 0.5, 1], [0, -14, 0]), 5, 7),
  }));
  const ribs = useAnimatedProps(() => ({
    y1: interpolate(t.value, [0, 0.5, 1], [11, 11.8, 11]),
    y2: interpolate(t.value, [0, 0.5, 1], [16.2, 15.4, 16.2]),
  }));
  return (
    <>
      <AnimatedG animatedProps={lid}>
        <Line x1={4.2} y1={7.6} x2={19.8} y2={7.6} {...stroke(color, sw)} />
        <Path d="M9.8 7.6V6.3c0-.9.7-1.6 1.6-1.6h1.2c.9 0 1.6.7 1.6 1.6v1.3" {...stroke(color, sw)} />
      </AnimatedG>
      <Path d="M6 7.6l.9 10.3c.1 1.4 1.3 2.5 2.7 2.5h4.8c1.4 0 2.6-1.1 2.7-2.5L18 7.6" {...stroke(color, sw)} />
      <AnimatedLine x1={10} x2={10} y1={11} {...stroke(color, sw)} animatedProps={ribs} />
      <AnimatedLine x1={14} x2={14} y1={11} {...stroke(color, sw)} animatedProps={ribs} />
    </>
  );
}

/** Calendar — the event dot pops into place on the grid. */
function CalendarGlyph({ t, color, sw }: GlyphCtx) {
  const dot = useAnimatedProps(() => ({
    r: interpolate(t.value, [0, 1], [1.2, 1.5]),
    opacity: interpolate(t.value, [0, 0.4, 1], [1, 1, 1]),
  }));
  const settle = useAnimatedProps(() => ({
    transform: translateXY(0, interpolate(t.value, [0, 0.5, 1], [0, 0.7, 0])),
  }));
  return (
    <AnimatedG animatedProps={settle}>
      <Path
        d="M5.6 5.4h12.8c1.5 0 2.7 1.2 2.7 2.7v9.8c0 1.5-1.2 2.7-2.7 2.7H5.6c-1.5 0-2.7-1.2-2.7-2.7V8.1c0-1.5 1.2-2.7 2.7-2.7z"
        {...stroke(color, sw)}
      />
      <Line x1={2.9} y1={9.8} x2={21.1} y2={9.8} {...stroke(color, sw)} />
      <Line x1={8.2} y1={3.6} x2={8.2} y2={7.6} {...stroke(color, sw)} />
      <Line x1={15.8} y1={3.6} x2={15.8} y2={7.6} {...stroke(color, sw)} />
      <AnimatedCircle cx={12} cy={15} r={1.2} {...stroke(color, sw)} animatedProps={dot} />
    </AnimatedG>
  );
}

/** Clock — the hands wind forward fast: time flies, then lands back. */
function ClockGlyph({ t, color, sw }: GlyphCtx) {
  const wind = useAnimatedProps(() => ({
    transform: rotateAbout(interpolate(t.value, [0, 1], [0, 320])),
  }));
  return (
    <>
      <Circle cx={12} cy={12} r={8.5} {...stroke(color, sw)} />
      <AnimatedG animatedProps={wind}>
        <Path d="M12 7v5.2l3.2 2" {...stroke(color, sw)} />
      </AnimatedG>
    </>
  );
}

/** Lock — toggle: the shackle pops up and swings open on its hinge. */
function LockGlyph({ t, color, sw }: GlyphCtx) {
  const shackle = useAnimatedProps(() => ({
    transform: `translate(0 ${interpolate(t.value, [0, 0.45], [0, -1.4], "clamp")}) ${rotateAbout(
      interpolate(t.value, [0.25, 1], [0, -62], "clamp"),
      16.2,
      10
    )}`,
    opacity: interpolate(t.value, [0, 0.45, 1], [1, 1, 0.55]),
  }));
  return (
    <>
      <AnimatedG animatedProps={shackle}>
        <Path d="M7.8 10.4V8a4.2 4.2 0 0 1 8.4 0v2.4" {...stroke(color, sw)} />
      </AnimatedG>
      <Path
        d="M7.6 10.4h8.8a3 3 0 0 1 3 3v4a3 3 0 0 1-3 3H7.6a3 3 0 0 1-3-3v-4a3 3 0 0 1 3-3z"
        {...stroke(color, sw)}
      />
      <Line x1={12} y1={14.2} x2={12} y2={16.6} {...stroke(color, sw)} />
    </>
  );
}

/** Edit — the pencil scratches: tip pivots with a small scribble wiggle. */
function EditGlyph({ t, color, sw }: GlyphCtx) {
  const wiggle = useAnimatedProps(() => ({
    transform: rotateAbout(
      interpolate(t.value, [0, 0.3, 0.65, 1], [0, -10, 5, 0]),
      5,
      19
    ),
  }));
  return (
    <AnimatedG animatedProps={wiggle}>
      <Path d="M4.8 19.2l1-3.9L15.7 5.5a2.4 2.4 0 0 1 3.4 0l.1.1a2.4 2.4 0 0 1 0 3.4L9.3 18.8l-3.8.9z" {...stroke(color, sw)} />
      <Path d="M14.4 6.7l3.2 3.2" {...stroke(color, sw)} />
    </AnimatedG>
  );
}

/** Download — the arrow plunges into the tray and the tray dips to catch it. */
function DownloadGlyph({ t, color, sw }: GlyphCtx) {
  const arrow = useAnimatedProps(() => ({
    transform: translateXY(0, interpolate(t.value, [0, 0.5, 1], [0, 2.6, 0])),
  }));
  const tray = useAnimatedProps(() => ({
    transform: translateXY(0, interpolate(t.value, [0, 0.45, 0.6, 1], [0, 0, 1, 0])),
  }));
  return (
    <>
      <AnimatedG animatedProps={arrow}>
        <Line x1={12} y1={4.4} x2={12} y2={14.4} {...stroke(color, sw)} />
        <Path d="M7.2 9.9l4.8 4.8 4.8-4.8" {...stroke(color, sw)} />
      </AnimatedG>
      <AnimatedG animatedProps={tray}>
        <Path d="M4.4 15.2v1.9c0 1.6 1.3 2.9 2.9 2.9h9.4c1.6 0 2.9-1.3 2.9-2.9v-1.9" {...stroke(color, sw)} />
      </AnimatedG>
    </>
  );
}

/** Share — the two links draw out to the nodes, staggered. */
const LINK_LEN = 8.4;
function ShareGlyph({ t, color, sw }: GlyphCtx) {
  const a = useAnimatedProps(() => ({
    strokeDashoffset: LINK_LEN * (1 - interpolate(t.value, [0, 0.55], [0, 1], "clamp")),
  }));
  const b = useAnimatedProps(() => ({
    strokeDashoffset: LINK_LEN * (1 - interpolate(t.value, [0.3, 0.85], [0, 1], "clamp")),
  }));
  const pop = useAnimatedProps(() => ({
    transform: scaleAbout(interpolate(t.value, [0, 0.5, 1], [1, 1.1, 1]), 6, 12),
  }));
  return (
    <>
      <Circle cx={17.5} cy={5} r={2.4} {...stroke(color, sw)} />
      <AnimatedG animatedProps={pop}>
        <Circle cx={6} cy={12} r={2.4} {...stroke(color, sw)} />
      </AnimatedG>
      <Circle cx={17.5} cy={19} r={2.4} {...stroke(color, sw)} />
      <AnimatedPath d="M8.2 10.8l7.1-4.5" strokeDasharray={LINK_LEN} {...stroke(color, sw)} animatedProps={a} />
      <AnimatedPath d="M8.2 13.2l7.1 4.5" strokeDasharray={LINK_LEN} {...stroke(color, sw)} animatedProps={b} />
    </>
  );
}

/** Globe — spins about its axis: the meridian ellipse narrows to a slit
 *  and opens again, reading as a real rotation. */
function GlobeGlyph({ t, color, sw }: GlyphCtx) {
  const spin = useAnimatedProps(() => ({
    rx: interpolate(t.value, [0, 0.5, 1], [3.8, 0.4, 3.8]),
  }));
  return (
    <>
      <Circle cx={12} cy={12} r={8.5} {...stroke(color, sw)} />
      <AnimatedEllipse cx={12} cy={12} ry={8.5} {...stroke(color, sw)} animatedProps={spin} />
      <Line x1={3.7} y1={12} x2={20.3} y2={12} {...stroke(color, sw)} />
    </>
  );
}

/** Map pin — drops in from above and lands with a settle; the dot pops. */
function MapPinGlyph({ t, color, sw }: GlyphCtx) {
  const drop = useAnimatedProps(() => ({
    transform: translateXY(0, interpolate(t.value, [0, 0.6, 0.8, 1], [-4, 0.6, -0.3, 0])),
  }));
  const dot = useAnimatedProps(() => ({
    r: interpolate(t.value, [0, 0.5, 0.75, 1], [2.3, 2.3, 3.1, 2.3]),
  }));
  return (
    <AnimatedG animatedProps={drop}>
      <Path
        d="M12 21.4s6.9-5.9 6.9-11.3a6.9 6.9 0 1 0-13.8 0c0 5.4 6.9 11.3 6.9 11.3z"
        {...stroke(color, sw)}
      />
      <AnimatedCircle cx={12} cy={10} r={2.3} {...stroke(color, sw)} animatedProps={dot} />
    </AnimatedG>
  );
}

/** Wallet — the card slot pops right and its dot pulses. */
function WalletGlyph({ t, color, sw }: GlyphCtx) {
  const slot = useAnimatedProps(() => ({
    transform: translateXY(interpolate(t.value, [0, 0.5, 1], [0, 0.7, 0]), 0),
  }));
  const dot = useAnimatedProps(() => ({
    r: interpolate(t.value, [0, 0.5, 1], [0.01, 0.31, 0.01]),
  }));
  return (
    <>
      <Path
        d="M4.5 8.4c0-2 1.6-3.6 3.6-3.6h7.8c2 0 3.6 1.6 3.6 3.6v7.6c0 2-1.6 3.6-3.6 3.6H8.1c-2 0-3.6-1.6-3.6-3.6V8.4z"
        {...stroke(color, sw)}
      />
      <AnimatedG animatedProps={slot}>
        <Path d="M19.5 9.8v5h-4.4c-1.4 0-2.5-1.1-2.5-2.5s1.1-2.5 2.5-2.5h4.4z" {...stroke(color, sw)} />
        <AnimatedCircle cx={15.4} cy={12.3} r={0.01} {...stroke(color, sw)} animatedProps={dot} />
      </AnimatedG>
    </>
  );
}

/** Chart — the three bars grow in, staggered. Build glyph (rest at t=1). */
const BARS = [
  { x: 8.5, top: 10.5, range: [0, 0.5] },
  { x: 12.5, top: 7, range: [0.2, 0.7] },
  { x: 16.5, top: 13, range: [0.4, 0.9] },
] as const;
function ChartBar({ t, color, sw, x, top, range }: GlyphCtx & { x: number; top: number; range: readonly [number, number] }) {
  const props = useAnimatedProps(() => ({
    y2: interpolate(t.value, [range[0], range[1]], [17.5, top], "clamp"),
  }));
  return <AnimatedLine x1={x} y1={17.5} x2={x} {...stroke(color, sw)} animatedProps={props} />;
}
function ChartGlyph(props: GlyphCtx) {
  return (
    <>
      <Path d="M4 4.5v14a1 1 0 0 0 1 1h15" {...stroke(props.color, props.sw)} />
      {BARS.map((b) => (
        <ChartBar key={b.x} {...props} x={b.x} top={b.top} range={b.range} />
      ))}
    </>
  );
}

/** Zap — a pointed bolt (pure zigzag accent) drawn in a flash. */
const ZAP_LEN = 50;
function ZapGlyph({ t, color, sw }: GlyphCtx) {
  const p = useAnimatedProps(() => ({
    strokeDashoffset: ZAP_LEN * (1 - t.value),
  }));
  return (
    <AnimatedPath
      d="M13.3 3.7 6.6 13.1c-.5.6 0 1.4.8 1.4h3.8l-1.3 5.6c-.2.9 1 1.4 1.5.7l6.7-9.4c.5-.6 0-1.4-.8-1.4h-3.8l1.3-5.6c.2-.9-1-1.4-1.5-.7z"
      strokeDasharray={ZAP_LEN}
      {...stroke(color, sw)}
      animatedProps={p}
    />
  );
}

/** Bookmark — the ribbon draws itself down and notches in. */
const BMK_LEN = 52;
function BookmarkGlyph({ t, color, sw }: GlyphCtx) {
  const p = useAnimatedProps(() => ({
    strokeDashoffset: BMK_LEN * (1 - t.value),
  }));
  return (
    <AnimatedPath
      d="M6.8 3.8h10.4c.9 0 1.6.7 1.6 1.6v14.6l-6.8-4.4-6.8 4.4V5.4c0-.9.7-1.6 1.6-1.6z"
      strokeDasharray={BMK_LEN}
      {...stroke(color, sw)}
      animatedProps={p}
    />
  );
}

/** Phone — rings with a decaying wiggle, like a handset on the hook. */
function PhoneGlyph({ t, color, sw }: GlyphCtx) {
  const ring = useAnimatedProps(() => ({
    transform: rotateAbout(
      interpolate(t.value, [0, 0.22, 0.5, 0.78, 1], [0, -9, 7, -4, 0]),
      12,
      14
    ),
  }));
  return (
    <AnimatedG animatedProps={ring}>
      <Path
        d="M5 4.5h3l1.6 4.4-2 1.6a13.5 13.5 0 0 0 6 6l1.6-2 4.4 1.6v3a1.5 1.5 0 0 1-1.6 1.5A16.5 16.5 0 0 1 3.5 6.1 1.5 1.5 0 0 1 5 4.5z"
        {...stroke(color, sw)}
      />
    </AnimatedG>
  );
}

export const objectGlyphs: Record<string, GlyphDef> = {
  bell: { component: BellGlyph, duration: tempo.drift },
  heart: { kind: "toggle", component: HeartGlyph },
  star: { kind: "toggle", component: StarGlyph },
  user: { component: UserGlyph, duration: tempo.glow },
  settings: { component: SettingsGlyph, duration: tempo.drift },
  message: { component: MessageGlyph, duration: tempo.drift },
  mail: { component: MailGlyph, duration: tempo.glow },
  trash: { component: TrashGlyph, duration: tempo.glow },
  calendar: { component: CalendarGlyph, duration: tempo.glow },
  clock: { component: ClockGlyph, duration: tempo.drift },
  lock: { kind: "toggle", component: LockGlyph },
  edit: { component: EditGlyph, duration: tempo.glow },
  download: { component: DownloadGlyph, duration: tempo.glow },
  share: { rest: 1, component: ShareGlyph, duration: tempo.drift },
  globe: { component: GlobeGlyph, duration: tempo.drift },
  "map-pin": { component: MapPinGlyph, duration: tempo.drift },
  wallet: { component: WalletGlyph, duration: tempo.drift },
  chart: { rest: 1, component: ChartGlyph, duration: tempo.drift },
  zap: { rest: 1, component: ZapGlyph, duration: tempo.glow },
  bookmark: { rest: 1, component: BookmarkGlyph, duration: tempo.drift },
  phone: { component: PhoneGlyph, duration: tempo.drift },
};
