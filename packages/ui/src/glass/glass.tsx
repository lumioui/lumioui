import * as React from "react";
import { forwardRef } from "react";
import {
  Platform,
  View,
  type ColorValue,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  type ViewProps,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import { cssInterop } from "nativewind";
import { cn, ease, optionalRequire, timing, useReducedMotion, useTheme } from "@lumioui/core";

/**
 * Glass — the Lumio glass surface, with graceful degradation.
 *
 * Backend chain (first available wins):
 *   1. `expo-glass-effect` — the native UIGlassEffect, works in Expo Go (iOS 26+)
 *   2. `@callstack/liquid-glass` — LiquidGlassView, bare-RN dev builds
 *   3. Web refractive fallback — SVG displacement refraction + specular
 *      rim + sheen (Chromium/Firefox), layered blur elsewhere
 *   4. Frosted translucent fill on old native platforms
 *
 * Both native modules are resolved via optionalRequire — hosts without
 * them bundle cleanly. `useGlass()` reports which backend is live.
 *
 * Light follows input (opt-in, every backend): pass `specular` and the
 * highlight gathers under the finger while it is down, then dims on
 * release. No band of light travels across the pane (`light` is a
 * deprecated no-op). The
 * frosted fallback carries a 1px lit top edge so every backend has a light
 * source.
 *
 * <Glass effect="regular" interactive>
 *   <Composer />
 * </Glass>
 */

interface ExpoGlassModule {
  GlassView: React.ComponentType<Record<string, unknown>>;
  GlassContainer?: React.ComponentType<Record<string, unknown>>;
  isLiquidGlassAvailable?: () => boolean;
  isGlassEffectAPIAvailable?: () => boolean;
}

interface CallstackGlassModule {
  LiquidGlassView: React.ComponentType<Record<string, unknown>>;
  LiquidGlassContainerView?: React.ComponentType<Record<string, unknown>>;
  isLiquidGlassSupported?: boolean;
}

export type GlassBackend = "expo" | "callstack" | "web" | "fallback";

const expoGlass = optionalRequire<ExpoGlassModule>("expo-glass-effect");
const callstackGlass =
  optionalRequire<CallstackGlassModule>("@callstack/liquid-glass");

const expoAvailable =
  Platform.OS === "ios" &&
  !!expoGlass?.GlassView &&
  (typeof expoGlass?.isLiquidGlassAvailable === "function"
    ? expoGlass.isLiquidGlassAvailable()
    : (expoGlass?.isGlassEffectAPIAvailable?.() ?? false));
const callstackAvailable =
  Platform.OS === "ios" && !!callstackGlass?.isLiquidGlassSupported;

const backend: GlassBackend = expoAvailable
  ? "expo"
  : callstackAvailable
    ? "callstack"
    : Platform.OS === "web"
      ? "web"
      : "fallback";

/** Which glass backend is live — screens can branch on it. */
export function useGlass(): GlassBackend {
  return backend;
}

// className needs cssInterop on whatever native view wins — registered once.
const ExpoGlassView = expoAvailable
  ? cssInterop(expoGlass!.GlassView, { className: "style" })
  : null;
const CallstackGlassView = callstackAvailable
  ? cssInterop(callstackGlass!.LiquidGlassView, { className: "style" })
  : null;
const ExpoGlassContainer =
  expoAvailable && expoGlass!.GlassContainer
    ? cssInterop(expoGlass!.GlassContainer, { className: "style" })
    : null;
const CallstackGlassContainer =
  callstackAvailable && callstackGlass!.LiquidGlassContainerView
    ? cssInterop(callstackGlass!.LiquidGlassContainerView, {
        className: "style",
      })
    : null;

/* ------------------------------------------------------------------ */
/* Web refractive fallback                                             */
/*                                                                     */
/* One injected <style> block (rim/sheen/interactive/merge rules plus a  */
/* baked matrix of material classes — backdrop-filter doesn't split      */
/* across classes, so frost×bend×curve×effect combos are generated) and  */
/* an <svg><defs> set of displacement filters whose lens maps are        */
/* rendered to PNG via canvas at install time. Real refraction of the    */
/* live DOM, zero dependencies.                                        */
/* ------------------------------------------------------------------ */

const webGlass = { installed: false, refract: false };

const BEND_SCALES = [0, 14, 30, 52] as const; // displacement px per level
const FROST_BLUR = { regular: [6, 12, 20], clear: [2, 6, 10] } as const;

/* The packages' tsconfig has no DOM lib — minimal structural types over
   globalThis keep this dependency-free and SSR-safe. */
type LensCanvasContext = {
  createImageData(w: number, h: number): { data: Uint8ClampedArray };
  putImageData(img: { data: Uint8ClampedArray }, x: number, y: number): void;
};
type LensCanvas = {
  width: number;
  height: number;
  getContext(kind: "2d"): LensCanvasContext | null;
  toDataURL(type?: string): string;
};
type GlassStyleEl = {
  id: string;
  textContent: string | null;
};
type GlassHolderEl = {
  setAttribute(name: string, value: string): void;
  style: { cssText: string };
  innerHTML: string;
};
type GlassDocument = {
  createElement(tag: "canvas"): LensCanvas;
  createElement(tag: "style"): GlassStyleEl;
  createElement(tag: string): GlassHolderEl;
  head: { appendChild(n: unknown): void };
  body: { appendChild(n: unknown): void } | null;
  addEventListener(
    type: string,
    cb: () => void,
    opts?: { once?: boolean }
  ): void;
};

type CSSGlobal = { supports?: (prop: string, value: string) => boolean };

const getDocument = () =>
  (globalThis as { document?: GlassDocument }).document;
const getCSS = () => (globalThis as { CSS?: CSSGlobal }).CSS;

function lensTexture(mode: "dome" | "ring"): string {
  const S = 160;
  const half = S / 2;
  const document = getDocument();
  if (!document) return "";
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = S;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  const img = ctx.createImageData(S, S);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const nx = (x - half + 0.5) / half;
      const ny = (y - half + 0.5) / half;
      const r = Math.min(1, Math.hypot(nx, ny));
      const fall =
        mode === "dome"
          ? Math.pow(r, 1.6)
          : Math.min(1, Math.max(0, (r - 0.55) / 0.45)) ** 2;
      // Direction-scaled displacement: R=X offset, G=Y offset, 128=neutral
      const d = r > 1e-4 ? fall / r : 0;
      const i = (y * S + x) * 4;
      img.data[i] = 128 + nx * d * 127;
      img.data[i + 1] = 128 + ny * d * 127;
      img.data[i + 2] = 128;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL("image/png");
}

function installGlassWeb() {
  if (webGlass.installed) return;
  webGlass.installed = true;
  if (Platform.OS !== "web") return;
  const document = getDocument();
  if (!document) return;
  const CSS = getCSS();

  webGlass.refract =
    (CSS?.supports?.("backdrop-filter", "url(#x)") ||
      CSS?.supports?.("-webkit-backdrop-filter", "url(#x)")) ??
    false;

  const css: string[] = [
    ".lumi-glass{position:relative;overflow:hidden;" +
      "background:rgba(255,255,255,.55);" +
      "box-shadow:0 8px 32px rgba(15,15,30,.12),0 1px 2px rgba(15,15,30,.08)}",
    ".lumi-glass-clear{background:rgba(255,255,255,.18)}",
    /* Dark material keys off `lg-dark` (the nearest ThemeProvider's scheme),
       not the global `.dark` class — a scheme-pinned stage (Accent/World
       scheme="light" over a bright photo) keeps glass and ink in agreement. */
    ".lumi-glass.lg-dark{background:rgba(255,255,255,.10)}",
    ".lumi-glass-clear.lg-dark{background:rgba(255,255,255,.06)}",
    /* This sheet is injected last, so explicit position classes on the same
       element must re-assert themselves at higher specificity — otherwise
       `absolute inset-0` overlays collapse to 0-height flex children.
       Full-bleed glass is a material UNDERLAY: z:-1 keeps it below the
       wrapper's in-flow content (positioned siblings otherwise paint above
       non-positioned ones, and the ::before backdrop-filter would blur the
       field's own text). Offset-positioned glass (`absolute left-4 top-2`)
       is floating chrome instead — it must paint above sibling imagery, so
       the sink applies only to `inset-0` fills. */
    ".lumi-glass.absolute{position:absolute}" +
      ".lumi-glass.absolute.inset-0{z-index:-1}" +
      ".lumi-glass.fixed{position:fixed}.lumi-glass.sticky{position:sticky}",
    ".lumi-glass.lg-dark{box-shadow:0 8px 32px rgba(0,0,0,.35),0 1px 2px rgba(0,0,0,.3)}",
    /* ::before = the material — refraction + blur + saturate */
    ".lumi-glass::before{content:'';position:absolute;inset:0;border-radius:inherit;pointer-events:none}",
    /* ::after = specular rim + diagonal sheen */
    ".lumi-glass::after{content:'';position:absolute;inset:0;border-radius:inherit;pointer-events:none;" +
      "box-shadow:inset 0 0 0 1px rgba(255,255,255,.22),inset 0 1px 0 rgba(255,255,255,.42),inset 0 -1px 0 rgba(15,15,30,.07);" +
      "background-image:linear-gradient(115deg,rgba(255,255,255,.16) 0%,rgba(255,255,255,0) 34%)}",
    ".lumi-glass.lg-dark::after{box-shadow:inset 0 0 0 1px rgba(255,255,255,.16),inset 0 1px 0 rgba(255,255,255,.28),inset 0 -1px 0 rgba(0,0,0,.25);" +
      "background-image:linear-gradient(115deg,rgba(255,255,255,.12) 0%,rgba(255,255,255,0) 34%)}",
    ".lumi-glass-clear::after{box-shadow:inset 0 0 0 1px rgba(255,255,255,.14),inset 0 1px 0 rgba(255,255,255,.3)}",
    /* sheen levels */
    ".lumi-glass.lg-sheen-0::after{background:none}",
    ".lumi-glass.lg-sheen-2::after{background-image:linear-gradient(115deg,rgba(255,255,255,.3) 0%,rgba(255,255,255,0) 30%,rgba(255,255,255,0) 68%,rgba(255,255,255,.1) 100%)}",
    /* dispersion — faint chromatic fringe at the edges */
    ".lumi-glass.lg-disp::after{box-shadow:inset 0 0 0 1px rgba(255,255,255,.22),inset 0 1px 0 rgba(255,255,255,.42),inset 0 -1px 0 rgba(15,15,30,.07),inset 2px 0 3px -2px rgba(255,90,140,.2),inset -2px 0 3px -2px rgba(70,140,255,.2)}",
    /* interactive press glow */
    ".lumi-glass.lg-interactive{transition:transform .16s cubic-bezier(.2,.8,.3,1),filter .16s}",
    ".lumi-glass.lg-interactive:active{transform:scale(.965);filter:brightness(1.06)}",
    /* merged unions: children lose their own material, container slabs it */
    ".lumi-glass-merge .lumi-glass{background:transparent!important;box-shadow:none!important}",
    ".lumi-glass-merge .lumi-glass::before,.lumi-glass-merge .lumi-glass::after{content:none}",
    /* honor reduced transparency */
    "@media (prefers-reduced-transparency: reduce){.lumi-glass::before{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}}",
  ];

  // Baked material classes: backdrop-filter can't compose across classes.
  for (const effect of ["regular", "clear"] as const) {
    for (let f = 0; f < FROST_BLUR[effect].length; f++) {
      const blur = FROST_BLUR[effect][f];
      const sat = effect === "clear" ? 1.5 : 1.8;
      const sel = `.lumi-glass${effect === "clear" ? ".lumi-glass-clear" : ""}.lg-f${f}`;
      css.push(
        `${sel}::before{backdrop-filter:blur(${blur}px) saturate(${sat}) brightness(1.06);` +
          `-webkit-backdrop-filter:blur(${blur}px) saturate(${sat}) brightness(1.06)}`
      );
      if (webGlass.refract) {
        for (const tex of ["dome", "ring"] as const) {
          for (let b = 1; b < BEND_SCALES.length; b++) {
            const chain = `url(#lumi-lg-${tex}-${b}) blur(${blur}px) saturate(${sat}) brightness(1.06)`;
            css.push(
              `${sel}.lg-${tex}${b}::before{backdrop-filter:${chain};-webkit-backdrop-filter:${chain}}`
            );
          }
        }
      }
    }
  }

  const styleEl = document.createElement("style");
  styleEl.id = "lumi-glass";
  styleEl.textContent = css.join("\n");
  document.head.appendChild(styleEl);

  if (!webGlass.refract) return;
  const dome = lensTexture("dome");
  const ring = lensTexture("ring");
  if (!dome || !ring) {
    webGlass.refract = false;
    return;
  }
  const filters: string[] = [];
  for (const [tex, url] of [
    ["dome", dome],
    ["ring", ring],
  ] as const) {
    for (let i = 1; i < BEND_SCALES.length; i++) {
      filters.push(
        `<filter id="lumi-lg-${tex}-${i}" x="-10%" y="-10%" width="120%" height="120%">` +
          `<feImage href="${url}" x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="map"/>` +
          `<feDisplacementMap in="SourceGraphic" in2="map" scale="${BEND_SCALES[i]}" xChannelSelector="R" yChannelSelector="G"/>` +
          `</filter>`
      );
    }
  }
  const holder = document.createElement("div");
  holder.setAttribute("aria-hidden", "true");
  holder.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
  holder.innerHTML = `<svg width="0" height="0"><defs>${filters.join("")}</defs></svg>`;
  const mount = () => document.body?.appendChild(holder);
  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount, { once: true });
}

/** Quantize a 0–1 tunable into the baked class levels. */
function level(v: number | undefined, steps: number): number {
  if (v == null || v <= 0) return 0;
  return Math.min(steps, Math.max(1, Math.round(v * steps)));
}

/* ------------------------------------------------------------------ */
/* Live light — the specular under the finger. Drawn as the last child */
/* of the pane, never hit-testable. Nothing sweeps across the pane.    */
/* ------------------------------------------------------------------ */

const useGradientId = () => React.useId().replace(/[^a-zA-Z0-9]/g, "");

/** Peak alpha of the specular under the finger. */
const SPECULAR_ALPHA = 0.3;

interface GlassLightProps {
  specular: boolean;
  /** Specular position (0–1 of the pane) and how lit it is. */
  touchX: SharedValue<number>;
  touchY: SharedValue<number>;
  held: SharedValue<number>;
}

function GlassLight({ specular, touchX, touchY, held }: GlassLightProps) {
  const spotId = useGradientId();
  const [size, setSize] = React.useState({ w: 0, h: 0 });
  const { w, h } = size;
  const spot = Math.max(96, h * 1.8);

  const spotStyle = useAnimatedStyle(() => ({
    opacity: held.value,
    transform: [{ translateX: touchX.value * w - spot / 2 }, { translateY: touchY.value * h - spot / 2 }],
  }));

  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden" }}
      onLayout={(e: LayoutChangeEvent) => {
        const { width, height } = e.nativeEvent.layout;
        if (width !== w || height !== h) setSize({ w: width, h: height });
      }}
    >
      {specular && w > 0 ? (
        <Animated.View style={[{ position: "absolute", top: 0, left: 0, width: spot, height: spot }, spotStyle]}>
          <Svg width={spot} height={spot}>
            <Defs>
              <RadialGradient id={spotId} cx="50%" cy="50%" r="50%">
                <Stop offset={0} stopColor="#FFFFFF" stopOpacity={SPECULAR_ALPHA} />
                <Stop offset={0.45} stopColor="#FFFFFF" stopOpacity={SPECULAR_ALPHA * 0.35} />
                <Stop offset={1} stopColor="#FFFFFF" stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Rect x="0" y="0" width={spot} height={spot} fill={`url(#${spotId})`} />
          </Svg>
        </Animated.View>
      ) : null}
    </View>
  );
}

/** True while Glass renders material-free — inside a merged
 *  GlassContainer on web, where the slab owns the material. */
const GlassUnionContext = React.createContext(false);

export interface GlassProps extends Omit<ViewProps, "className"> {
  /** 'regular' = standard glass blur, 'clear' = more transparent,
   *  'none' = fallback everywhere. */
  effect?: "clear" | "regular" | "none";
  /** Tint overlaid on the glass (native); also tints the fallback fill. */
  tintColor?: ColorValue;
  /** Press interaction (fluid squish + glow; native on iOS 26+). */
  interactive?: boolean;
  /** Edge refraction strength 0–1 — how far the lens bends the backdrop.
   *  Web only; native glass always refracts per the platform. */
  bend?: number;
  /** Diffusion 0–1 — extra backdrop blur behind the glass. */
  frost?: number;
  /** Diagonal sheen intensity 0–1. Web only. */
  sheen?: number;
  /** Chromatic fringe at the rim. Web only. */
  dispersion?: boolean;
  /** Lens curvature — 'dome' warps the whole surface (lens look),
   *  'edge' concentrates refraction at the rim. Web only. */
  curvature?: "dome" | "edge";
  /** @deprecated No effect: no light band travels across the pane any more.
   *  Kept so existing call sites compile. */
  light?: SharedValue<number>;
  /** The highlight gathers under the finger while it is down (brightens
   *  over timing.instant, follows the touch) and dims on release over
   *  timing.recede. Optional, off by default. Every backend. */
  specular?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const Glass = forwardRef<React.ElementRef<typeof View>, GlassProps>(
  function Glass(
    {
      effect = "regular",
      tintColor,
      interactive = false,
      bend,
      frost,
      sheen,
      dispersion,
      curvature = "dome",
      // Deprecated no-op — destructured so it never reaches the native view.
      light: _light,
      specular = false,
      className,
      children: content,
      style,
      onLayout,
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onTouchCancel,
      ...rest
    },
    ref
  ) {
    const inUnion = React.useContext(GlassUnionContext);
    // Web material tone follows the scheme in scope (see `lg-dark` above).
    const { scheme } = useTheme();
    const dark = scheme === "dark";
    const reduce = useReducedMotion();

    // Specular: where the finger is (0–1 of the pane) and how lit it is.
    // Touch events never claim the responder, so pressable children inside still receive their taps.
    const touchX = useSharedValue(0.5);
    const touchY = useSharedValue(0.3);
    const held = useSharedValue(0);
    const pane = React.useRef({ w: 0, h: 0 });
    const aim = (e: GestureResponderEvent, glide: boolean) => {
      const { w, h } = pane.current;
      if (!w || !h) return;
      const x = Math.min(1, Math.max(0, e.nativeEvent.locationX / w));
      const y = Math.min(1, Math.max(0, e.nativeEvent.locationY / h));
      // The highlight slides to the touch on first contact, then rides it 1:1.
      touchX.value = glide && !reduce ? withTiming(x, timing.instant) : x;
      touchY.value = glide && !reduce ? withTiming(y, timing.instant) : y;
    };
    const release = () => {
      held.value = withTiming(0, { ...timing.recede, easing: Easing.bezier(...ease.in) });
    };
    const props: Omit<ViewProps, "className"> = specular
      ? {
          ...rest,
          onLayout: (e: LayoutChangeEvent) => {
            pane.current = { w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height };
            onLayout?.(e);
          },
          onTouchStart: (e: GestureResponderEvent) => {
            aim(e, true);
            held.value = withTiming(1, { ...timing.instant, easing: Easing.bezier(...ease.out) });
            onTouchStart?.(e);
          },
          onTouchMove: (e: GestureResponderEvent) => {
            aim(e, false);
            onTouchMove?.(e);
          },
          onTouchEnd: (e: GestureResponderEvent) => {
            release();
            onTouchEnd?.(e);
          },
          onTouchCancel: (e: GestureResponderEvent) => {
            release();
            onTouchCancel?.(e);
          },
        }
      : { ...rest, onLayout, onTouchStart, onTouchMove, onTouchEnd, onTouchCancel };
    const children = specular ? (
      <>
        {content}
        <GlassLight specular={specular} touchX={touchX} touchY={touchY} held={held} />
      </>
    ) : (
      content
    );

    const ExpoView = ExpoGlassView;
    const CallstackView = CallstackGlassView;
    if (backend === "expo" && ExpoView && effect !== "none") {
      return (
        <View
          ref={ref}
          className={cn("overflow-hidden", className)}
          style={style}
          {...props}
        >
          <ExpoView
            glassEffectStyle={effect}
            isInteractive={interactive}
            tintColor={tintColor}
            style={{ flex: 1 }}
          >
            {children}
          </ExpoView>
        </View>
      );
    }
    if (backend === "callstack" && CallstackView && effect !== "none") {
      return (
        <View
          ref={ref}
          className={cn("overflow-hidden", className)}
          style={style}
          {...props}
        >
          <CallstackView
            effect={effect}
            tintColor={tintColor}
            interactive={interactive}
            style={{ flex: 1 }}
          >
            {children}
          </CallstackView>
        </View>
      );
    }

    if (Platform.OS === "web" && effect !== "none") {
      if (!webGlass.installed) installGlassWeb();
      if (inUnion) {
        // Merged container owns the material — children stay transparent.
        return (
          <View
            ref={ref}
            className={cn("lumi-glass", dark && "lg-dark", className)}
            style={style}
            {...props}
          >
            {children}
          </View>
        );
      }
      const b = level(bend, BEND_SCALES.length - 1);
      const f = level(frost, FROST_BLUR.regular.length - 1);
      const s = level(sheen, 2);
      const classes = cn(
        "lumi-glass",
        effect === "clear" ? "lumi-glass-clear" : undefined,
        dark && "lg-dark",
        `lg-f${f}`,
        b > 0 ? `lg-${curvature === "dome" ? "dome" : "ring"}${b}` : undefined,
        `lg-sheen-${s}`,
        dispersion && "lg-disp",
        interactive && "lg-interactive",
        className
      );
      return (
        <View
          ref={ref}
          className={classes}
          style={[
            tintColor ? { backgroundColor: tintColor } : null,
            style,
          ]}
          {...props}
        >
          {children}
        </View>
      );
    }

    // Native fallback (old iOS / Android): frosted translucency, lit from
    // above by a 1px top edge so this backend has a light source too.
    const fallbackFill = effect === "clear" ? "bg-white/15" : "bg-white/50";
    return (
      <View
        ref={ref}
        className={cn(
          "overflow-hidden border border-white/25 dark:border-white/15",
          fallbackFill,
          "dark:bg-white/10",
          className
        )}
        style={tintColor ? [style, { backgroundColor: tintColor }] : style}
        {...props}
      >
        {children}
        <View
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          className="absolute left-0 right-0 top-0 h-px bg-white/50 dark:bg-white/25"
        />
      </View>
    );
  }
);

Glass.displayName = "Glass";

export interface GlassContainerProps extends Omit<ViewProps, "className"> {
  /** How close panes must sit before they merge into one blob — maps to
   *  the native containers' `spacing`. */
  spacing?: number;
  /** Merge children into a single glass slab on web (default true).
   *  Native unions always merge. */
  merged?: boolean;
  /** Glass effect for the merged web slab. */
  effect?: "clear" | "regular";
  className?: string;
  children?: React.ReactNode;
}

/**
 * GlassContainer — the "liquid" primitive: adjacent Glass children inside
 * `spacing` melt into one continuous blob (native union regions on iOS 26+,
 * one shared refractive slab on web).
 *
 * <GlassContainer spacing={16} className="flex-row gap-3">
 *   <Glass className="rounded-full" /><Glass className="rounded-full" />
 * </GlassContainer>
 */
export const GlassContainer = forwardRef<
  React.ElementRef<typeof View>,
  GlassContainerProps
>(function GlassContainer(
  {
    spacing = 12,
    merged = true,
    effect = "regular",
    className,
    children,
    style,
    ...props
  },
  ref
) {
  const ExpoC = ExpoGlassContainer;
  const CallstackC = CallstackGlassContainer;
  if (Platform.OS === "ios" && ExpoC) {
    return (
      <ExpoC
        ref={ref}
        spacing={spacing}
        className={className}
        style={style}
        {...props}
      >
        {children}
      </ExpoC>
    );
  }
  if (Platform.OS === "ios" && CallstackC) {
    return (
      <CallstackC
        ref={ref}
        spacing={spacing}
        className={className}
        style={style}
        {...props}
      >
        {children}
      </CallstackC>
    );
  }
  // Web merged: one refractive slab owns the material; children render plain.
  if (Platform.OS === "web" && merged) {
    return (
      <GlassUnionContext.Provider value={true}>
        <Glass
          ref={ref}
          effect={effect}
          className={cn("lumi-glass-merge", className)}
          style={style}
          {...props}
        >
          {children}
        </Glass>
      </GlassUnionContext.Provider>
    );
  }
  return (
    <View ref={ref} className={className} style={style} {...props}>
      {children}
    </View>
  );
});

GlassContainer.displayName = "GlassContainer";
