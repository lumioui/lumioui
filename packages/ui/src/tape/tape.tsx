import * as React from "react";
import { forwardRef } from "react";
import { Pressable, Text, View, type PressableProps } from "react-native";
import Animated from "react-native-reanimated";
import Svg, { ClipPath, Defs, G, Path } from "react-native-svg";
import { cn, useTheme } from "@lumioui/core";
import { HANDWRITING, PAPER, usePaperLift } from "../sticker";

/**
 * Tape — a strip of tape with torn ends, for holding photos, notes and
 * stickers to the page. Lay it across a corner at a tilt, or write on it.
 * Press it and the near end lifts off the page — the strip rises, swings a
 * few degrees about its far end and casts a deeper shadow — then it presses
 * back down on release.
 *
 *   <Tape className="absolute -top-3 left-8" tilt={-8} />
 *   <Tape tone="kraft" pattern="stripes" width={128}>Lisboa ’26</Tape>
 *
 * Tones: paper (translucent white), kraft (brown) and primary (ink, or the
 * surrounding <Accent>). Expo Go compatible.
 */

/** Depth and pitch of the torn teeth at each end, in points. */
const TOOTH_DEPTH = 2.5;
const TOOTH_PITCH = 4;
/** The near end swings this many extra degrees as it lifts. */
const LIFT_SWING = 3;

/** Strip outline with zigzag torn ends. */
function tapePath(w: number, h: number): string {
  const d = TOOTH_DEPTH;
  const steps = Math.max(2, Math.round(h / (TOOTH_PITCH / 2)));
  const dy = h / steps;
  let p = `M${d} 0 L${w - d} 0`;
  for (let i = 1; i <= steps; i++) p += ` L${i % 2 ? w : w - d} ${(i * dy).toFixed(2)}`;
  p += ` L${d} ${h}`;
  for (let i = steps - 1; i >= 0; i--) p += ` L${i % 2 ? 0 : d} ${(i * dy).toFixed(2)}`;
  return `${p} Z`;
}

/** Diagonal washi stripes across the strip. */
function stripesPath(w: number, h: number): string {
  const band = 6;
  let p = "";
  for (let x = -h; x < w + h; x += band * 2) {
    p += `M${x} ${h} L${x + h} 0 L${x + h + band} 0 L${x + band} ${h} Z `;
  }
  return p;
}

export interface TapeProps
  extends Omit<PressableProps, "children" | "style" | "accessibilityRole"> {
  className?: string;
  /** Text written on the tape (set in the handwriting face) or any content. */
  children?: React.ReactNode;
  /** Strip length in points. Default 104. */
  width?: number;
  /** Strip width in points. Default 28. */
  height?: number;
  /** Resting tilt in degrees. Default -6. */
  tilt?: number;
  /** Material. Default "paper". */
  tone?: "paper" | "kraft" | "primary";
  /** Washi pattern printed on the strip. Default "plain". */
  pattern?: "plain" | "stripes";
  /** Selection haptic as it lifts. Default true. */
  haptic?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
}

export const Tape = forwardRef<React.ElementRef<typeof Pressable>, TapeProps>(
  function Tape(
    {
      className,
      children,
      width = 104,
      height = 28,
      tilt = -6,
      tone = "paper",
      pattern = "plain",
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
    const { colors, scheme } = useTheme();
    // The near end lifts: the swing carries the strip further from flat
    // (whichever way it leans) instead of straightening it.
    const { onPressIn: liftIn, onPressOut: liftOut, surfaceStyle, liftShadowStyle } = usePaperLift({
      tilt,
      rise: 2,
      grow: 1.02,
      straighten: 0,
      swing: Math.sign(tilt || 1) * LIFT_SWING,
      haptic,
      disabled: !!disabled,
    });

    const fill =
      tone === "kraft" ? PAPER.kraft[scheme] : tone === "primary" ? colors.primary : scheme === "dark" ? "#EDEAE2" : "#FFFDF6";
    // Paper tape is see-through; kraft and printed tape nearly opaque.
    const alpha = tone === "paper" ? (scheme === "dark" ? 0.82 : 0.78) : 0.92;
    const ink = tone === "primary" ? colors.primaryForeground : PAPER.ink;
    const stripe = tone === "primary" ? colors.primaryForeground : tone === "kraft" ? "#FFFFFF" : PAPER.kraft[scheme];
    const d = tapePath(width, height);
    const clipId = React.useId().replace(/:/g, "");
    const label = accessibilityLabel ?? (typeof children === "string" ? children : undefined);

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
        // Plain decorative tape stays out of the screen-reader order; its
        // written text is still read on its own.
        accessible={!!onPress || !!accessibilityLabel}
        accessibilityRole={onPress ? "button" : undefined}
        accessibilityLabel={label}
        className={cn("self-start", className)}
        style={{ zIndex: 2 }}
        {...props}
      >
        <Animated.View style={[{ width, height, transformOrigin: "100% 50%" }, surfaceStyle]}>
          <Animated.View pointerEvents="none" className="absolute inset-0" style={liftShadowStyle}>
            <Svg width={width} height={height + 4}>
              <Path d={d} fill="#000" opacity={0.14} transform="translate(0 4)" />
            </Svg>
          </Animated.View>
          <Svg width={width} height={height + 1} style={{ position: "absolute" }}>
            <Defs>
              <ClipPath id={clipId}>
                <Path d={d} />
              </ClipPath>
            </Defs>
            <Path d={d} fill="#000" opacity={0.08} transform="translate(0 1)" />
            <Path d={d} fill={fill} opacity={alpha} />
            {pattern === "stripes" ? (
              <G clipPath={`url(#${clipId})`}>
                <Path d={stripesPath(width, height)} fill={stripe} opacity={0.35} />
              </G>
            ) : null}
          </Svg>
          {children != null ? (
            <View pointerEvents="none" className="absolute inset-0 items-center justify-center px-3">
              {typeof children === "string" ? (
                <Text numberOfLines={1} style={{ fontFamily: HANDWRITING, fontSize: 15, color: ink }}>
                  {children}
                </Text>
              ) : (
                children
              )}
            </View>
          ) : null}
        </Animated.View>
      </Pressable>
    );
  }
);

Tape.displayName = "Tape";
