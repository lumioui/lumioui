/**
 * Glyphs — media & weather. Same contract as glyphs-nav.
 */
import * as React from "react";
import { Path, Circle, Line } from "react-native-svg";
import { interpolate, useAnimatedProps } from "react-native-reanimated";
import {
  AnimatedCircle,
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

/** Send — launches: the plane flies off up-right, then returns from
 *  below-left so the gesture can repeat. */
function SendGlyph({ t, color, sw }: GlyphCtx) {
  const fly = useAnimatedProps(() => {
    const out = interpolate(t.value, [0, 0.55], [0, 1], "clamp");
    const back = interpolate(t.value, [0.65, 1], [0, 1], "clamp");
    return {
      transform: translateXY(out * 11 - (1 - back) * 4, -out * 11),
      opacity: interpolate(t.value, [0, 0.45, 0.62, 0.7, 1], [1, 0, 0, 1, 1]),
    };
  });
  return (
    <AnimatedG animatedProps={fly}>
      <Path
        d="M19.8 5.1 5.1 9.9c-.9.3-.9 1.5 0 1.8l4.6 1.6c.3.1.6.4.7.7l1.6 4.6c.3.9 1.5.9 1.8 0l6.7-12.8c.3-.7-.3-1.3-.9-.9z"
        {...stroke(color, sw)}
      />
      <Path d="M9.6 12.9 15.5 9" {...stroke(color, sw)} />
    </AnimatedG>
  );
}

/** Mic — listening arcs breathe out from the capsule, staggered. */
function MicGlyph({ t, color, sw }: GlyphCtx) {
  const arcL = useAnimatedProps(() => ({
    opacity: interpolate(t.value, [0.1, 0.4, 0.75, 0.9], [0, 1, 1, 0], "clamp"),
    transform: translateXY(interpolate(t.value, [0.1, 0.7], [0, -1.2], "clamp"), 0),
  }));
  const arcR = useAnimatedProps(() => ({
    opacity: interpolate(t.value, [0.3, 0.6, 0.9, 1], [0, 1, 1, 0], "clamp"),
    transform: translateXY(interpolate(t.value, [0.3, 0.9], [0, 1.2], "clamp"), 0),
  }));
  return (
    <>
      <Path d="M9.3 5.1a2.7 2.7 0 0 1 5.4 0v5.4a2.7 2.7 0 0 1-5.4 0V5.1z" {...stroke(color, sw)} />
      <Path d="M5.8 10.8a6.2 6.2 0 0 0 12.4 0" {...stroke(color, sw)} />
      <Line x1={12} y1={17.3} x2={12} y2={20.4} {...stroke(color, sw)} />
      <Line x1={8.7} y1={20.4} x2={15.3} y2={20.4} {...stroke(color, sw)} />
      <AnimatedG animatedProps={arcL}>
        <Path d="M3.2 9.8a9 9 0 0 0 0 4.6" {...stroke(color, sw)} strokeWidth={sw * 0.8} />
      </AnimatedG>
      <AnimatedG animatedProps={arcR}>
        <Path d="M20.8 9.8a9 9 0 0 1 0 4.6" {...stroke(color, sw)} strokeWidth={sw * 0.8} />
      </AnimatedG>
    </>
  );
}

/** Camera — the lens focuses: iris tightens then opens. */
function CameraGlyph({ t, color, sw }: GlyphCtx) {
  const iris = useAnimatedProps(() => ({
    r: interpolate(t.value, [0, 0.5, 1], [3.4, 2.6, 3.4]),
  }));
  return (
    <>
      <Path
        d="M2.8 9.6a3 3 0 0 1 3-3h1c.6 0 1.1-.3 1.4-.8l.9-1.4c.4-.6 1-.9 1.7-.9h2.4c.7 0 1.3.3 1.7.9l.9 1.4c.3.5.8.8 1.4.8h1a3 3 0 0 1 3 3V17a3 3 0 0 1-3 3H5.8a3 3 0 0 1-3-3V9.6z"
        {...stroke(color, sw)}
      />
      <AnimatedCircle cx={12} cy={13.3} {...stroke(color, sw)} animatedProps={iris} />
    </>
  );
}

/** Video — a recording blip: dot fades in and pulses once. */
function VideoGlyph({ t, color, sw }: GlyphCtx) {
  const rec = useAnimatedProps(() => ({
    opacity: interpolate(t.value, [0, 0.2, 0.5, 1], [0, 1, 0.25, 1]),
    r: interpolate(t.value, [0, 0.5, 1], [1.1, 1.5, 1.1]),
  }));
  return (
    <>
      <Path
        d="M6.7 5.6h7.4c1.9 0 3.4 1.5 3.4 3.4v6c0 1.9-1.5 3.4-3.4 3.4H6.7c-1.9 0-3.4-1.5-3.4-3.4V9c0-1.9 1.5-3.4 3.4-3.4z"
        {...stroke(color, sw)}
      />
      <Path d="M17.5 10.6l3-1.7c.6-.3 1.2 0 1.2.7v4.8c0 .7-.6 1-1.2.7l-3-1.7" {...stroke(color, sw)} />
      <AnimatedCircle cx={8.2} cy={12} r={1.1} fill={color} stroke="none" animatedProps={rec} />
    </>
  );
}

/** Music — the note sways on its stem. */
function MusicGlyph({ t, color, sw }: GlyphCtx) {
  const sway = useAnimatedProps(() => ({
    transform: rotateAbout(
      interpolate(t.value, [0, 0.3, 0.65, 1], [0, -7, 6, 0]),
      12,
      20
    ),
  }));
  return (
    <AnimatedG animatedProps={sway}>
      <Path d="M9.6 17.9V5.9l9.2-1.6v11.5" {...stroke(color, sw)} />
      <Circle cx={7} cy={17.9} r={2.4} {...stroke(color, sw)} />
      <Circle cx={16.2} cy={15.9} r={2.4} {...stroke(color, sw)} />
    </AnimatedG>
  );
}

/** Image — the sun rises over the mountains as the ridge draws. */
const RIDGE_LEN = 17.5;
function ImageGlyph({ t, color, sw }: GlyphCtx) {
  const sun = useAnimatedProps(() => ({
    cy: interpolate(t.value, [0, 1], [10.2, 9.2]),
  }));
  const ridge = useAnimatedProps(() => ({
    strokeDashoffset: RIDGE_LEN * (1 - interpolate(t.value, [0.1, 0.9], [0, 1], "clamp")),
  }));
  return (
    <>
      <Path
        d="M4.8 4.8h14.4c1.2 0 2.2 1 2.2 2.2v10c0 1.2-1 2.2-2.2 2.2H4.8c-1.2 0-2.2-1-2.2-2.2V7c0-1.2 1-2.2 2.2-2.2z"
        {...stroke(color, sw)}
      />
      <AnimatedCircle cx={9.2} r={1.6} {...stroke(color, sw)} animatedProps={sun} />
      <AnimatedPath
        d="M3.2 17.4 8.6 12l3.8 3.8 3-3 5.4 5.4"
        strokeDasharray={RIDGE_LEN}
        {...stroke(color, sw)}
        animatedProps={ridge}
      />
    </>
  );
}

/** Play — the triangle pops forward a beat, like a transport click. */
function PlayGlyph({ t, color, sw }: GlyphCtx) {
  const pop = useAnimatedProps(() => ({
    transform: `${scaleAbout(interpolate(t.value, [0, 0.5, 1], [1, 1.12, 1]))} ${translateXY(
      interpolate(t.value, [0, 0.5, 1], [0, 0.7, 0]),
      0
    )}`,
  }));
  return (
    <AnimatedG animatedProps={pop}>
      <Path
        d="M9.9 5.9l7.4 4.5c.9.5.9 1.7 0 2.2l-7.4 4.5c-.9.5-2.1-.1-2.1-1.1V7c0-1 1.2-1.6 2.1-1.1z"
        {...stroke(color, sw)}
      />
    </AnimatedG>
  );
}

/** Sun — brightens: rays stretch outward while the disc swells a touch. */
const RAYS = [
  { x1: 12, y1: 3, x2: 12, y2: 5, dx: 0, dy: -1.4 },
  { x1: 12, y1: 19, x2: 12, y2: 21, dx: 0, dy: 1.4 },
  { x1: 3, y1: 12, x2: 5, y2: 12, dx: -1.4, dy: 0 },
  { x1: 19, y1: 12, x2: 21, y2: 12, dx: 1.4, dy: 0 },
  { x1: 5.7, y1: 5.7, x2: 7.1, y2: 7.1, dx: -1, dy: -1 },
  { x1: 16.9, y1: 16.9, x2: 18.3, y2: 18.3, dx: 1, dy: 1 },
  { x1: 5.7, y1: 18.3, x2: 7.1, y2: 16.9, dx: -1, dy: 1 },
  { x1: 16.9, y1: 7.1, x2: 18.3, y2: 5.7, dx: 1, dy: -1 },
] as const;
function SunRay({ t, color, sw, i }: GlyphCtx & { i: number }) {
  const r = RAYS[i]!;
  const props = useAnimatedProps(() => ({
    x2: r.x2 + r.dx * interpolate(t.value, [0, 0.5, 1], [0, 1, 0]),
    y2: r.y2 + r.dy * interpolate(t.value, [0, 0.5, 1], [0, 1, 0]),
  }));
  return <AnimatedLine x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2} {...stroke(color, sw)} animatedProps={props} />;
}
function SunGlyph(props: GlyphCtx) {
  const { t, color, sw } = props;
  const disc = useAnimatedProps(() => ({
    r: interpolate(t.value, [0, 0.5, 1], [4, 4.35, 4]),
  }));
  return (
    <>
      <AnimatedCircle cx={12} cy={12} {...stroke(color, sw)} animatedProps={disc} />
      {RAYS.map((_, i) => (
        <SunRay key={i} {...props} i={i} />
      ))}
    </>
  );
}

/** Moon — tilts toward the horizon; its companion star twinkles. */
function MoonGlyph({ t, color, sw }: GlyphCtx) {
  const tilt = useAnimatedProps(() => ({
    transform: rotateAbout(interpolate(t.value, [0, 0.5, 1], [0, -9, 0]), 12, 13),
  }));
  const twinkle = useAnimatedProps(() => ({
    opacity: interpolate(t.value, [0, 0.35, 0.6, 0.85, 1], [0.4, 1, 0.3, 1, 0.4]),
  }));
  return (
    <>
      <AnimatedG animatedProps={tilt}>
        <Path
          d="M19.6 14.8A8.3 8.3 0 1 1 9.2 4.4a6.9 6.9 0 0 0 10.4 10.4z"
          {...stroke(color, sw)}
        />
      </AnimatedG>
      <AnimatedCircle cx={18.5} cy={5.2} r={0.01} {...stroke(color, sw)} animatedProps={twinkle} />
    </>
  );
}

export const mediaGlyphs: Record<string, GlyphDef> = {
  send: { component: SendGlyph, duration: tempo.roll },
  mic: { component: MicGlyph, duration: tempo.roll, live: true },
  camera: { component: CameraGlyph, duration: tempo.glow },
  video: { component: VideoGlyph, duration: tempo.roll },
  music: { component: MusicGlyph, duration: tempo.drift },
  image: { rest: 1, component: ImageGlyph, duration: tempo.drift },
  play: { component: PlayGlyph, duration: tempo.glow },
  sun: { component: SunGlyph, duration: tempo.drift },
  moon: { component: MoonGlyph, duration: tempo.drift },
};
