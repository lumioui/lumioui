import * as React from "react";
import { View, type ViewStyle } from "react-native";
import { useTheme } from "../theme";

/**
 * LitEdge — the Lumio material: a raised surface lit from above.
 *
 * A thin highlight along the top inner edge, a soft fall-off of light into
 * the surface, and a slightly deeper lower edge. Light stays inside the
 * shape (inset shadows) — never a glow, never a coloured outer shadow.
 *
 * Drop it as the last child of a clipped, rounded surface and pass the same
 * radius:  <View className="overflow-hidden rounded-full bg-primary">…<LitEdge tone="fill" radius={999} /></View>
 *
 * tone="fill"     saturated or ink fills (primary buttons, selected chips)
 * tone="surface"  cards, thumbs, indicators, sheets
 */
export interface LitEdgeProps {
  tone?: "fill" | "surface";
  /** Corner radius of the host surface. */
  radius?: number;
  /** 0–1 multiplier for subtler surfaces. Default 1. */
  strength?: number;
}

// Per tone and scheme: [top edge, inner fall-off, lower edge] alphas.
const LIGHT: Record<NonNullable<LitEdgeProps["tone"]>, [number, number, number]> = {
  fill: [0.24, 0.1, 0.18],
  surface: [0.9, 0, 0.06],
};
const DARK: Record<NonNullable<LitEdgeProps["tone"]>, [number, number, number]> = {
  fill: [0.2, 0.08, 0.22],
  surface: [0.09, 0.03, 0.32],
};

export function LitEdge({ tone = "surface", radius = 0, strength = 1 }: LitEdgeProps) {
  const { scheme } = useTheme();
  const [top, falloff, lower] = (scheme === "dark" ? DARK : LIGHT)[tone];
  const style = React.useMemo<ViewStyle>(
    () => ({
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: radius,
      boxShadow: [
        `inset 0 1px 0 rgba(255,255,255,${(top * strength).toFixed(3)})`,
        falloff ? `inset 0 10px 14px -10px rgba(255,255,255,${(falloff * strength).toFixed(3)})` : null,
        `inset 0 -1px 0 rgba(0,0,0,${(lower * strength).toFixed(3)})`,
      ]
        .filter(Boolean)
        .join(", "),
    }),
    [radius, top, falloff, lower, strength]
  );
  return <View pointerEvents="none" style={style} />;
}
