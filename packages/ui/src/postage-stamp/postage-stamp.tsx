import * as React from "react";
import { forwardRef } from "react";
import {
  Image,
  Pressable,
  Text,
  View,
  type ImageSourcePropType,
  type PressableProps,
} from "react-native";
import Animated from "react-native-reanimated";
import Svg, { Circle, G, Path, Text as SvgText } from "react-native-svg";
import { cn, useTheme } from "@lumioui/core";
import { PAPER, usePaperLift } from "../sticker";

/**
 * PostageStamp — a stamp with a perforated edge drawn in SVG: your art in a
 * printed panel, the value and country on the paper margin, and an optional
 * postmark inked across one corner. It sits at a slight tilt; press it to
 * lift it off the envelope — it rises, straightens and its shadow deepens —
 * and it lays back down on release.
 *
 *   <PostageStamp image={{ uri }} value="€1.20" country="Portugal" />
 *   <PostageStamp width={96} postmark="LISBOA · 12 OCT 26" tilt={4}>
 *     <MyIllustration />
 *   </PostageStamp>
 *
 * Expo Go compatible.
 */

/** Paper border between the perforation and the art panel, in points. */
const BORDER = 6;

/**
 * Outline of a perforated sheet: a w×h rectangle with round bites of radius r
 * along every edge, spaced evenly so each edge starts and ends on half a gap.
 * Traced clockwise, so every bite is the same sweep into the paper.
 */
export function perforatedPath(w: number, h: number, r: number, pitch = r * 3.2): string {
  const along = (len: number) => {
    const n = Math.max(1, Math.round(len / pitch));
    const step = len / n;
    return Array.from({ length: n }, (_, i) => step * (i + 0.5));
  };
  const f = (v: number) => v.toFixed(2);
  const bite = (x: number, y: number) => `A${r} ${r} 0 0 0 ${f(x)} ${f(y)}`;
  let p = "M0 0";
  for (const c of along(w)) p += ` L${f(c - r)} 0 ${bite(c + r, 0)}`;
  p += ` L${f(w)} 0`;
  for (const c of along(h)) p += ` L${f(w)} ${f(c - r)} ${bite(w, c + r)}`;
  p += ` L${f(w)} ${f(h)}`;
  for (const c of along(w).reverse()) p += ` L${f(c + r)} ${f(h)} ${bite(c - r, h)}`;
  p += ` L0 ${f(h)}`;
  for (const c of along(h).reverse()) p += ` L0 ${f(c + r)} ${bite(0, c - r)}`;
  return `${p} Z`;
}

/** Smallest postmark lettering, in points — the family-wide text floor. */
const MARK_MIN_FONT = 12;
/** Rough advance of a bold capital, as a share of the font size. */
const MARK_GLYPH = 0.6;

/** Four wavy cancellation lines trailing out of a postmark. */
function wavesPath(x: number, y: number, len: number): string {
  let p = "";
  for (let i = 0; i < 4; i++) {
    const yy = y + i * 6;
    p += `M${x} ${yy} q${len / 8} -3 ${len / 4} 0 t${len / 4} 0 t${len / 4} 0 t${len / 4} 0 `;
  }
  return p;
}

export interface PostageStampProps
  extends Omit<PressableProps, "children" | "style" | "accessibilityRole"> {
  className?: string;
  /** Art printed in the panel. */
  image?: ImageSourcePropType;
  /** Any content in place of an image (an illustration, a glyph on colour). */
  children?: React.ReactNode;
  /** Face value printed on the margin, e.g. "€1.20". */
  value?: string;
  /** Issuing country printed on the margin. */
  country?: string;
  /** Postmark text inked over the top-right corner, e.g. "LISBOA · 12 OCT". */
  postmark?: string;
  /** Stamp width in points. Default 112. */
  width?: number;
  /** Width / height. Default 0.8 (portrait). */
  aspectRatio?: number;
  /** Radius of the perforation bites. Default 3.5. */
  perforation?: number;
  /** Resting tilt in degrees. Default -3. */
  tilt?: number;
  /** Selection haptic as it lifts. Default true. */
  haptic?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
}

export const PostageStamp = forwardRef<React.ElementRef<typeof Pressable>, PostageStampProps>(
  function PostageStamp(
    {
      className,
      image,
      children,
      value,
      country,
      postmark,
      width = 112,
      aspectRatio = 0.8,
      perforation = 3.5,
      tilt = -3,
      haptic = true,
      disabled,
      onPress,
      onPressIn,
      onPressOut,
      accessibilityLabel,
      ...props
    },
    ref
  ) {
    const { scheme } = useTheme();
    const { onPressIn: liftIn, onPressOut: liftOut, surfaceStyle, liftShadowStyle } = usePaperLift({
      tilt,
      straighten: 0.6,
      haptic,
      disabled: !!disabled,
    });

    const height = Math.round(width / aspectRatio);
    const inset = perforation + BORDER;
    // Narrow stamps stack the value over the country instead of truncating.
    const stack = !!(value && country) && width < 128;
    const margin = value || country ? (stack ? 34 : 22) : 0;
    const d = perforatedPath(width, height, perforation);
    const stock = PAPER.stock[scheme];
    // Postmark ink: a worn grey-black, never a hue. Lettering never drops
    // under 12pt; the ring grows (up to just under half the stamp) until both
    // lines sit inside its inner ring.
    const [markCity = "", ...markRest] = (postmark ?? "").split("·").map((t) => t.trim());
    const markDate = markRest.join(" ");
    const baseR = Math.max(20, Math.round(width * 0.3));
    const cityFont = Math.max(MARK_MIN_FONT, baseR * 0.3);
    const dateFont = Math.max(MARK_MIN_FONT, baseR * 0.24);
    const dateDrop = dateFont * 1.3;
    // Radius that holds a line of `n` glyphs whose far corners sit `dy` from
    // the centre, inside the inner ring (4pt in) with a 2pt breath.
    const fit = (n: number, font: number, dy: number) =>
      Math.ceil(Math.hypot((n * font * MARK_GLYPH) / 2, dy) + 6);
    const markR = Math.min(
      Math.max(baseR, Math.round(width * 0.45)),
      Math.max(
        baseR,
        fit(markCity.length, cityFont, cityFont * 0.75),
        markDate ? fit(markDate.length, dateFont, dateDrop) : 0
      )
    );
    const markX = width - markR * 0.35;
    const markY = markR * 0.9;

    const label =
      accessibilityLabel ??
      ["Postage stamp", country, value].filter(Boolean).join(", ");

    return (
      <Pressable
        ref={ref}
        disabled={disabled}
        onPress={onPress}
        onPressIn={(e) => {
          liftIn();
          onPressIn?.(e);
        }}
        onPressOut={(e) => {
          liftOut();
          onPressOut?.(e);
        }}
        accessibilityRole={onPress ? "button" : "image"}
        accessibilityLabel={label}
        accessibilityState={{ disabled: !!disabled }}
        className={cn("self-start", className)}
        {...props}
      >
        <Animated.View style={[{ width, height }, surfaceStyle]}>
          {/* Shadows follow the perforation, so they're drawn, not cast. */}
          <Animated.View pointerEvents="none" className="absolute inset-0" style={liftShadowStyle}>
            <Svg width={width + 4} height={height + 8}>
              <Path d={d} fill="#000" opacity={0.1} transform="translate(1 7)" />
              <Path d={d} fill="#000" opacity={0.08} transform="translate(0 3)" />
            </Svg>
          </Animated.View>
          <Svg width={width} height={height + 2} style={{ position: "absolute" }}>
            <Path d={d} fill="#000" opacity={0.16} transform="translate(0 1.5)" />
            <Path d={d} fill={stock} />
          </Svg>

          <View
            className="absolute overflow-hidden bg-muted"
            style={{ left: inset, right: inset, top: inset, bottom: inset + margin }}
          >
            {image ? (
              <Image source={image} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
            ) : (
              children
            )}
          </View>

          {margin ? (
            <View
              className={cn("absolute", stack ? "justify-center" : "flex-row items-center justify-between")}
              style={{ left: inset, right: inset, bottom: inset - 2, height: margin }}
            >
              {stack && value ? (
                <Text className="text-[15px] font-bold leading-tight tabular-nums" style={{ color: PAPER.ink }}>
                  {value}
                </Text>
              ) : null}
              <Text
                numberOfLines={1}
                className={cn("text-xs font-semibold uppercase tracking-wider", !stack && "flex-1")}
                style={{ color: PAPER.ink }}
              >
                {country ?? ""}
              </Text>
              {!stack && value ? (
                <Text className="text-[15px] font-bold tabular-nums" style={{ color: PAPER.ink }}>
                  {value}
                </Text>
              ) : null}
            </View>
          ) : null}

          {postmark ? (
            <Svg
              pointerEvents="none"
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              width={width + markR}
              height={Math.max(height, markY + markR + 2)}
              style={{ position: "absolute", left: 0, top: 0 }}
            >
              <G opacity={0.62}>
                <Circle cx={markX} cy={markY} r={markR} stroke={PAPER.ink} strokeWidth={1.6} fill="none" />
                <Circle cx={markX} cy={markY} r={markR - 4} stroke={PAPER.ink} strokeWidth={0.8} fill="none" />
                <SvgText
                  x={markX}
                  y={markY - (markDate ? 1 : -3)}
                  fill={PAPER.ink}
                  fontSize={cityFont}
                  fontWeight="700"
                  textAnchor="middle"
                >
                  {markCity}
                </SvgText>
                {markDate ? (
                  <SvgText
                    x={markX}
                    y={markY + dateDrop}
                    fill={PAPER.ink}
                    fontSize={dateFont}
                    fontWeight="600"
                    textAnchor="middle"
                  >
                    {markDate}
                  </SvgText>
                ) : null}
                <Path
                  d={wavesPath(markX - markR - width * 0.55, markY - 9, width * 0.5)}
                  stroke={PAPER.ink}
                  strokeWidth={1.2}
                  fill="none"
                />
              </G>
            </Svg>
          ) : null}
        </Animated.View>
      </Pressable>
    );
  }
);

PostageStamp.displayName = "PostageStamp";
