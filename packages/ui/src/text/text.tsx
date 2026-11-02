import * as React from "react";
import { forwardRef } from "react";
import { Text as RNText, type TextProps as RNTextProps } from "react-native";
import { SWITCH_DIM, cn, createVariant } from "@lumioui/core";

const textVariants = createVariant({
  base: "text-foreground",
  variants: {
    variant: {
      default: "text-base",
      // Display sizes tighten their tracking: default tracking at 28–36pt
      // reads loose at display sizes.
      h1: "text-4xl font-bold leading-tight tracking-tight",
      h2: "text-3xl font-bold leading-tight tracking-tight",
      h3: "text-2xl font-semibold leading-tight tracking-tight",
      h4: "text-xl font-semibold leading-tight",
      large: "text-lg font-semibold leading-tight",
      small: "text-sm font-medium",
      muted: "text-sm text-muted-foreground",
      lead: "text-xl text-muted-foreground",
      code: "font-mono text-sm bg-muted rounded px-1.5 py-0.5",
      blockquote: "text-base italic border-l-4 border-border pl-4",
      // The Lumio pull quote: upright and a step larger, its rule the one
      // accent use on the page. Opt-in so every existing blockquote keeps its look.
      quote: "text-lg font-medium border-l-4 border-primary pl-4",
    },
  },
  defaultVariants: { variant: "default" },
});

export interface TextProps extends RNTextProps {
  variant?:
    | "default"
    | "h1"
    | "h2"
    | "h3"
    | "h4"
    | "large"
    | "small"
    | "muted"
    | "lead"
    | "code"
    | "blockquote"
    | "quote";
  /**
   * `dim` draws the text as dim structure — readable, not yet switched on
   * (DESIGN-TASTE §5c rule 6) — without wrapping it in a Mount. Default `default`.
   */
  tone?: "default" | "dim";
  className?: string;
}

const DIM_STYLE = { opacity: SWITCH_DIM };

/** Semantic text with size and tone variants. Respects Dynamic Type by default. */
export const Text = forwardRef<React.ElementRef<typeof RNText>, TextProps>(
  function Text({ variant = "default", tone = "default", className, style, ...props }, ref) {
    const isHeading = variant.startsWith("h");
    return (
      <RNText
        ref={ref}
        className={cn(textVariants({ variant }), className)}
        accessibilityRole={isHeading ? "header" : "text"}
        style={tone === "dim" ? [DIM_STYLE, style] : style}
        {...props}
      />
    );
  }
);

Text.displayName = "Text";
export { textVariants };
