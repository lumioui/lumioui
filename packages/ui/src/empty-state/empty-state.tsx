import * as React from "react";
import { forwardRef } from "react";
import { View, Text, type ViewProps } from "react-native";
import { BAND_STAGGER, LightFall, SwitchOn, cn, createVariant, useTheme, type ColorTokens } from "@lumioui/core";
import { Icon, type IconName } from "../icon";

const iconWrapVariants = createVariant({
  base: "h-20 w-20 items-center justify-center rounded-[28px]",
  variants: {
    variant: {
      default: "bg-primary/10",
      search: "bg-primary/10",
      error: "bg-destructive/10",
    },
  },
  defaultVariants: { variant: "default" },
});

const variantIcons: Record<NonNullable<EmptyStateProps["variant"]>, IconName> = {
  default: "info",
  search: "search",
  error: "alert-triangle",
};

const variantIconColors: Record<NonNullable<EmptyStateProps["variant"]>, keyof ColorTokens> = {
  default: "primaryText",
  search: "primaryText",
  error: "destructive",
};

export interface EmptyStateProps extends ViewProps {
  /** Visual tone. Default "default". */
  variant?: "default" | "search" | "error";
  /** Icon slot rendered in the lit well. Defaults to a Lumio glyph per variant. */
  icon?: React.ReactNode;
  /** Headline. */
  title: string;
  /** Supporting copy. */
  description?: string;
  /** Optional action slot (e.g. a <Button>). */
  action?: React.ReactNode;
  /** Light the stage from above in the surface accent. Default true. */
  lit?: boolean;
  className?: string;
}

/**
 * EmptyState — an empty, no-result or error state on a lit stage
 * (DESIGN-TASTE §0b): light falls from the top edge in the surface accent,
 * and the glyph, headline, copy and action switch on in page bands, 120ms
 * apart. No grey disc, no bounce.
 */
export const EmptyState = forwardRef<React.ElementRef<typeof View>, EmptyStateProps>(function EmptyState(
  { variant = "default", icon, title, description, action, lit = true, className, ...props },
  ref
) {
  const { colors } = useTheme();
  const tone = variant === "error" ? colors.destructive : undefined;
  return (
    <View
      ref={ref}
      className={cn("items-center justify-center gap-3 overflow-hidden rounded-3xl px-8 py-12", className)}
      accessibilityRole="text"
      accessibilityLabel={description ? `${title}. ${description}` : title}
      {...props}
    >
      {lit ? <LightFall color={tone} reach={0.7} /> : null}
      <SwitchOn className={iconWrapVariants({ variant })}>
        {icon ?? <Icon name={variantIcons[variant]} size="xl" color={variantIconColors[variant]} />}
      </SwitchOn>
      <SwitchOn delay={BAND_STAGGER}>
        <Text className="text-center text-xl font-semibold leading-tight tracking-tight text-foreground" accessibilityRole="header">
          {title}
        </Text>
      </SwitchOn>
      {description ? (
        <SwitchOn delay={BAND_STAGGER * 2}>
          <Text className="max-w-[300px] text-center text-base leading-snug text-muted-foreground">{description}</Text>
        </SwitchOn>
      ) : null}
      {action ? (
        <SwitchOn delay={BAND_STAGGER * 3} className="mt-2">
          {action}
        </SwitchOn>
      ) : null}
    </View>
  );
});

EmptyState.displayName = "EmptyState";
