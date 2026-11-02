import * as React from "react";
import { forwardRef } from "react";
import { View, Text, type ViewProps, type ColorValue } from "react-native";
import Svg, { Circle, Ellipse, G, Line, Path, Polygon, Polyline, Rect } from "react-native-svg";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { cn, createVariant, ease, spring, timing, useReducedMotion, useTheme, type ColorTokens } from "@lumioui/core";
import { GLYPHS, type GlyphNode } from "./glyphs";

/**
 * Icon — the Lumio glyph set, sized and themed.
 *   <Icon name="check" size="md" />
 *   <Icon name="star" color="warning" filled />
 *   <Icon size="lg"><MyCustomSvg /></Icon>
 *
 * `filled` swaps in place: the fill ignites inside the stroke while the glyph
 * settles 0.94→1; clearing dims the fill and the stroke stays. For full
 * shape morphs (play → pause, menu → close) use <AnimatedIcon>.
 *
 * Geometry comes from packages/ui/src/animated-icons (the same drawings as
 * <AnimatedIcon>, at rest), compiled by scripts/gen-icon-glyphs.mjs.
 */

export type IconName = keyof typeof GLYPHS;

export interface GlyphProps {
  /** Rendered size in pt — the 24 grid scales to it. Default 24. */
  size?: number;
  color?: string;
  /** Stroke width on the 24 grid — default 2. */
  strokeWidth?: number;
  /** Fill colour for the glyph's shapes; "none" (default) keeps it a stroke icon. */
  fill?: string;
}

const SHAPES = { path: Path, circle: Circle, line: Line, rect: Rect, ellipse: Ellipse, polyline: Polyline, polygon: Polygon } as const;

function renderNode(node: GlyphNode, key: number, color: string, strokeWidth: number, fill: string): React.ReactNode {
  const [tag, props, children] = node;
  const { s, f, w, o, ...geometry } = props;
  if (tag === "g") {
    return (
      <G key={key} transform={geometry.transform as string | undefined} opacity={o as number | undefined}>
        {children?.map((c, i) => renderNode(c, i, color, strokeWidth, fill))}
      </G>
    );
  }
  const Shape = SHAPES[tag as keyof typeof SHAPES] as React.ComponentType<Record<string, unknown>> | undefined;
  if (!Shape) return null;
  return (
    <Shape
      key={key}
      {...geometry}
      stroke={s === 0 ? "none" : color}
      strokeWidth={w != null ? (Number(w) * strokeWidth) / 2 : strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={f ? color : fill}
      opacity={o as number | undefined}
    />
  );
}

function makeGlyph(name: IconName) {
  const nodes = GLYPHS[name] as GlyphNode[];
  const Glyph = React.memo(function Glyph({ size = 24, color = "currentColor", strokeWidth = 2, fill = "none" }: GlyphProps) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {nodes.map((n, i) => renderNode(n, i, color, strokeWidth, fill))}
      </Svg>
    );
  });
  Glyph.displayName = `Glyph(${name})`;
  return Glyph;
}

/** Every glyph as a standalone component — `iconMap.star` takes size / color / strokeWidth / fill. */
const iconMap = {} as Record<IconName, React.ComponentType<GlyphProps>>;
for (const n of Object.keys(GLYPHS) as IconName[]) iconMap[n] = makeGlyph(n);

/** Glyph scale the fill ignites from — the swap-in-place bloom. */
const FILL_BLOOM = 0.94;

/**
 * FillableGlyph — a stroke glyph with its fill on its own layer, so turning
 * `filled` on ignites the fill (timing.fast, ease.out) and clearing dims it
 * (timing.recede, ease.in). The first render lands in its state without motion.
 */
function FillableGlyph({ name, size, color, strokeWidth, filled }: { name: IconName; size: number; color: string; strokeWidth: number; filled: boolean }) {
  const reduce = useReducedMotion();
  const Glyph = iconMap[name];
  const lit = useSharedValue(filled ? 1 : 0);
  const scale = useSharedValue(1);
  const first = React.useRef(true);
  React.useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (filled) {
      lit.value = withTiming(1, { ...timing.fast, easing: Easing.bezier(...ease.out) });
      if (!reduce) {
        scale.value = FILL_BLOOM;
        scale.value = withSpring(1, spring.swap);
      }
    } else {
      lit.value = withTiming(0, { ...timing.recede, easing: Easing.bezier(...ease.in) });
    }
  }, [filled, reduce, lit, scale]);
  const glyphStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const fillStyle = useAnimatedStyle(() => ({ opacity: lit.value }));
  return (
    <Animated.View style={[{ width: size, height: size }, glyphStyle]}>
      <Animated.View style={[{ position: "absolute", top: 0, left: 0 }, fillStyle]}>
        <Glyph size={size} color={color} strokeWidth={0} fill={color} />
      </Animated.View>
      <Glyph size={size} color={color} strokeWidth={strokeWidth} fill="none" />
    </Animated.View>
  );
}

const iconVariants = createVariant({
  base: "items-center justify-center",
  variants: {
    size: { sm: "h-4 w-4", md: "h-6 w-6", lg: "h-8 w-8", xl: "h-10 w-10" },
  },
  defaultVariants: { size: "md" },
});

const iconTextVariants = createVariant({
  base: "text-foreground",
  variants: {
    size: { sm: "text-xs", md: "text-base", lg: "text-xl", xl: "text-2xl" },
  },
  defaultVariants: { size: "md" },
});

// md fills the 24pt grid the glyphs are drawn on, so the 2px stroke renders
// at exactly 2px — the weight every other glyph is tuned against.
const px = { sm: 16, md: 24, lg: 28, xl: 34 } as const;

// The set is drawn as strokes. Filling every glyph makes open shapes look
// muddy, so fill is opt-in only for glyphs with a deliberate filled state.
const FILLED_ICONS = new Set<IconName>(["heart", "star", "bookmark"]);
// Transport controls are solid by nature — outlined pause capsules read as "00".
const SOLID_ICONS = new Set<IconName>(["play", "pause"]);

export interface IconProps extends ViewProps {
  /** Glyph name — e.g. "check", "chevron-down", "star". */
  name?: IconName;
  /** Color: a theme token ("foreground", "mutedForeground", "primary", …) or hex. */
  color?: keyof ColorTokens | ColorValue;
  /** Fill the glyph (heart, star, bookmark). */
  filled?: boolean;
  /** Stroke width — default 2. */
  strokeWidth?: number;
  /** Size preset. */
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  /** Extra classes for the glyph text (when children is a string). */
  textClassName?: string;
  /**
   * Icons are decorative by default (hidden from screen readers). Provide a
   * label for a standalone semantic icon — it is exposed with role "image".
   */
  accessibilityLabel?: string;
  /** Custom element (e.g. your own SVG) — overrides `name`. */
  children?: React.ReactNode;
}

export const Icon = forwardRef<React.ElementRef<typeof View>, IconProps>(
  function Icon(
    { name, color, filled, strokeWidth = 2, size = "md", className, textClassName, accessibilityLabel, children, ...props },
    ref
  ) {
    const { colors } = useTheme();
    const colorKey =
      typeof color === "string" ? color.replace(/-([a-z])/g, (_, ch: string) => ch.toUpperCase()) : undefined;
    const resolved: ColorValue =
      colorKey && colorKey in colors
        ? colors[colorKey as keyof ColorTokens]
        : ((color ?? colors.foreground) as ColorValue);

    const Glyph = name ? iconMap[name] : undefined;
    // Labeled icons are exposed as images; unlabeled stay decorative/hidden.
    const meaningful = accessibilityLabel != null;

    return (
      <View
        ref={ref}
        className={cn(iconVariants({ size }), className)}
        accessibilityElementsHidden={!meaningful}
        importantForAccessibility={meaningful ? "yes" : "no"}
        aria-hidden={!meaningful}
        accessibilityRole={meaningful ? "image" : undefined}
        accessibilityLabel={accessibilityLabel}
        {...props}
      >
        {Glyph && name && FILLED_ICONS.has(name) ? (
          <FillableGlyph name={name} size={px[size]} color={resolved as string} strokeWidth={strokeWidth} filled={!!filled} />
        ) : Glyph ? (
          <Glyph
            size={px[size]}
            color={resolved as string}
            strokeWidth={strokeWidth}
            fill={name && SOLID_ICONS.has(name) ? (resolved as string) : "none"}
          />
        ) : typeof children === "string" || typeof children === "number" ? (
          <Text className={cn(iconTextVariants({ size }), textClassName)}>{children}</Text>
        ) : (
          children
        )}
      </View>
    );
  }
);

Icon.displayName = "Icon";
export { iconVariants, iconMap };
