import type * as React from "react";
import { createElement, forwardRef, type ComponentPropsWithoutRef, type ComponentRef } from "react";
import type { PressableProps, TextInput, TextInputProps, TextProps, ViewProps } from "react-native";
import { Platform, Pressable as RNPressable, TextInput as RNTextInput } from "react-native";
import Animated, { type AnimatedProps } from "react-native-reanimated";
import { Path as SvgPath, Circle as SvgCircle, G as SvgG, Line as SvgLine, Rect as SvgRect, Ellipse as SvgEllipse } from "react-native-svg";
import { cssInterop } from "nativewind";

/**
 * Register Reanimated primitives with NativeWind's cssInterop so `className`
 * maps to `style`. Without this, className on Animated.* / wrapped components
 * is silently dropped — on native AND web.
 *
 * cssInterop keys registration by component identity, so registering the
 * shared Animated.View / Animated.Text singletons here covers every usage.
 */

cssInterop(Animated.View, { className: "style" });
cssInterop(Animated.Text, { className: "style" });
// Scrollers also map contentContainerClassName → contentContainerStyle —
// without it a `px-5` on the content container is silently dropped and
// the screen renders edge-to-edge (travel-discover, food-orders…).
cssInterop(Animated.ScrollView, { className: "style", contentContainerClassName: "contentContainerStyle" });
cssInterop(Animated.FlatList, { className: "style", contentContainerClassName: "contentContainerStyle" });
cssInterop(Animated.Image, { className: "style" });

/** A style prop that also takes Reanimated animated styles (alone or mixed
 *  in an array). Use it for any prop that ends up on an Animated component:
 *  React Native 0.88's stricter types reject an animated style on a plain
 *  StyleProp<ViewStyle>. */
export type AnimatedViewStyle = AnimatedProps<ViewProps>["style"];
export type AnimatedTextStyle = AnimatedProps<TextProps>["style"];

/**
 * Animated Pressable with className support (each createAnimatedComponent
 * call creates a new identity, so we share this registered one).
 * Typed from Reanimated's own animated-component props, so `style` takes
 * animated styles (alone or in an array) as well as plain ones — React
 * Native 0.88's stricter generated types reject an animated style on a
 * plain PressableProps `style`. Refs forward to the Pressable host.
 */
export type AnimatedPressableProps = AnimatedProps<PressableProps> & {
  className?: string;
  ref?: React.Ref<ComponentRef<typeof RNPressable>>;
};
export const AnimatedPressable = cssInterop(Animated.createAnimatedComponent(RNPressable) as React.ComponentType<AnimatedPressableProps>, {
  className: "style",
}) as React.ComponentType<AnimatedPressableProps>;

/**
 * Animated TextInput with className support (same identity rule as above).
 * A drop-in TextInput: accepts all TextInputProps plus className, and
 * forwards refs to the underlying TextInput host instance.
 */
type AnimatedTextInputBaseProps = AnimatedProps<TextInputProps> & {
  className?: string;
  ref?: React.Ref<ComponentRef<typeof TextInput>>;
};
const RawAnimatedTextInput = Animated.createAnimatedComponent(RNTextInput) as React.ComponentType<AnimatedTextInputBaseProps>;
cssInterop(RawAnimatedTextInput, { className: "style" });

// `outline-none` on web only — browsers draw a dark native :focus outline
// over our animated ring; on native the utility doesn't exist so skip it.
const OutlineSafeTextInput = forwardRef(function OutlineSafeTextInput(
  { className, ...props }: Omit<AnimatedTextInputBaseProps, "ref">,
  ref: React.Ref<ComponentRef<typeof TextInput>>
) {
  const merged = Platform.OS === "web" ? `outline-none ${className ?? ""}` : className;
  return createElement(RawAnimatedTextInput, { ...props, ref, className: merged });
});

export const AnimatedTextInput: React.ComponentType<AnimatedTextInputBaseProps> = OutlineSafeTextInput;

/**
 * Shared animated SVG Path. react-native-svg is a required peer — every
 * SVG-mark component (Checkbox, Input, ProgressRing, …) and the Icon glyph
 * set already need it, so a static import is correct. The old optionalRequire
 * path silently no-op'd on web (eval("require") throws in bundled RNW),
 * blanking checkmarks/dashes/arcs entirely.
 * SVG nodes take `animatedProps`, never `className`, so one shared
 * identity covers every usage.
 */
export const AnimatedPath = Animated.createAnimatedComponent(SvgPath) as React.ComponentType<Record<string, unknown>>;

/** Shared animated SVG Circle — same treatment as AnimatedPath. */
export const AnimatedCircle = Animated.createAnimatedComponent(SvgCircle) as React.ComponentType<Record<string, unknown>>;

/** Shared animated SVG group — transforms inside a glyph (rotate about a
 *  pivot, nudge a sub-part) go through `animatedProps={{ transform }}`. */
export const AnimatedG = Animated.createAnimatedComponent(SvgG) as React.ComponentType<Record<string, unknown>>;

/** Shared animated SVG Line — x1/y1/x2/y2 endpoint interpolation powers the
 *  real geometry morphs (play→pause, menu→x, growing bars). */
export const AnimatedLine = Animated.createAnimatedComponent(SvgLine) as React.ComponentType<Record<string, unknown>>;

/** Shared animated SVG Rect — x/y/width/height/rx interpolation. */
export const AnimatedRect = Animated.createAnimatedComponent(SvgRect) as React.ComponentType<Record<string, unknown>>;

/** Shared animated SVG Ellipse — cx/cy/rx/ry interpolation (globe spin). */
export const AnimatedEllipse = Animated.createAnimatedComponent(SvgEllipse) as React.ComponentType<Record<string, unknown>>;

/** Wrap a custom component so its `className` prop maps to `style`. */
export function styled<C extends React.ComponentType<{ className?: string }>>(
  Component: C
): C {
  cssInterop(Component as React.ComponentType<Record<string, unknown>>, {
    className: "style",
  });
  return Component;
}

// Prop types for the shared animated singletons above.
export type AnimatedTextInputProps = ComponentPropsWithoutRef<typeof AnimatedTextInput>;
