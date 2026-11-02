import * as React from "react";
import { forwardRef, createContext, useContext, Children } from "react";
import { View, Text, Pressable, StyleSheet, type ViewProps, type PressableProps, type GestureResponderEvent, } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { cn, useHaptic, usePressAnimation, a11yProps, AnimatedPressable, spring, timing, useReducedMotion, useTheme, BAND_STAGGER, rowDelay, SwitchOn, type A11yProps } from "@lumioui/core";
import { Icon } from "../icon";
import { Glass } from "../glass";

/**
 * List — grouped list primitives for settings-style screens.
 *   <List inset>
 *     <List.Section title="General">
 *       <List.Item title="Wi-Fi" subtitle="Connected" showChevron />
 *       <List.Separator />
 *       <List.Item title="Bluetooth" />
 *     </List.Section>
 *   </List>
 *
 * Opt-in Lumio light: `lit` makes a held row brighten rather than shade;
 * `switchOn` has rows start dim and switch on 40ms apart, sections a band
 * (120ms) apart. Without them the list renders exactly as before.
 */

const ListInsetContext = createContext({ inset: false, glass: false, lit: false, switchOn: false });
/** Position of a section among its List's children — drives its switch-on band. */
const SectionOrderContext = createContext(0);

/** A row held under the finger brightens by this much — light, not shade. */
const LIT_WASH = 0.06;

export interface ListProps extends ViewProps {
  /** Inset-grouped style: rounded card sections with horizontal margin. */
  inset?: boolean;
  /** Glass section material (pairs naturally with inset). */
  glass?: boolean;
  /**
   * Lit press: a held row brightens (foreground light on dark, accent light
   * on light) instead of taking the muted ink wash. Default false.
   */
  lit?: boolean;
  /**
   * Switch on at mount: each section's rows start dim and switch on 40ms
   * apart, sections one band (120ms) apart. Default false.
   */
  switchOn?: boolean;
  className?: string;
}

const ListRoot = forwardRef<React.ElementRef<typeof View>, ListProps>(
  function List({ inset = false, glass = false, lit = false, switchOn = false, className, children, ...props }, ref) {
    return (
      <ListInsetContext.Provider value={{ inset, glass, lit, switchOn }}>
        <View ref={ref} className={cn("w-full", className)} {...props}>
          {switchOn
            ? Children.toArray(children).map((child, i) => (
                <SectionOrderContext.Provider key={React.isValidElement(child) && child.key != null ? child.key : i} value={i}>
                  {child}
                </SectionOrderContext.Provider>
              ))
            : children}
        </View>
      </ListInsetContext.Provider>
    );
  }
);

export interface ListSectionProps extends ViewProps {
  /** Optional header text rendered above the group. */
  title?: string;
  /** Extra classes for the header text. */
  titleClassName?: string;
  /** Optional footnote under the group — a short explainer line. */
  footer?: string;
  className?: string;
}

const ListSection = forwardRef<React.ElementRef<typeof View>, ListSectionProps>(
  function ListSection({ title, titleClassName, footer, className, children, ...props }, ref) {
    const { inset, glass, switchOn } = useContext(ListInsetContext);
    const order = useContext(SectionOrderContext);
    const band = order * BAND_STAGGER;
    const header =
      title != null ? (
        <Text
          className={cn(
            "px-4 pb-1.5 text-[13px] text-muted-foreground",
            titleClassName
          )}
          accessibilityRole="header"
        >
          {title}
        </Text>
      ) : null;
    if (switchOn) {
      // Container, then content: the group surface is there at once, its
      // header and rows switch on inside it in reading order.
      return (
        <View ref={ref} className={cn("mb-6", inset && "mx-4", className)} {...props}>
          {header != null ? <SwitchOn delay={band}>{header}</SwitchOn> : null}
          <View
            className={cn("overflow-hidden", !glass && "bg-card", (inset || glass) && "rounded-2xl")}
          >
            {glass ? (
              <Glass
                effect="regular"
                sheen={0.35}
                className="absolute inset-0"
                style={{ borderRadius: 16 }}
                pointerEvents="none"
              />
            ) : null}
            {Children.toArray(children).map((child, i) => (
              <SwitchOn key={React.isValidElement(child) && child.key != null ? child.key : i} delay={band + rowDelay(i + 1)}>
                {child}
              </SwitchOn>
            ))}
          </View>
          {footer != null && (
            <SwitchOn delay={band + rowDelay(Children.count(children) + 1)}>
              <Text className="px-4 pt-2 text-[13px] leading-[18px] text-muted-foreground">
                {footer}
              </Text>
            </SwitchOn>
          )}
        </View>
      );
    }
    return (
      <View ref={ref} className={cn("mb-6", inset && "mx-4", className)} {...props}>
        {title != null && (
          <Text
            className={cn(
              "px-4 pb-1.5 text-[13px] text-muted-foreground",
              titleClassName
            )}
            accessibilityRole="header"
          >
            {title}
          </Text>
        )}
        <View
          className={cn("overflow-hidden", !glass && "bg-card", (inset || glass) && "rounded-2xl")}
        >
          {glass ? (
            <Glass
              effect="regular"
              sheen={0.35}
              className="absolute inset-0"
              style={{ borderRadius: 16 }}
              pointerEvents="none"
            />
          ) : null}
          {children}
        </View>
        {footer != null && (
          <Text className="px-4 pt-2 text-[13px] leading-[18px] text-muted-foreground">
            {footer}
          </Text>
        )}
      </View>
    );
  }
);

export interface ListItemProps extends Omit<PressableProps, "style" | "children">, A11yProps {
  /** Primary label. */
  title: string;
  /** Secondary label under the title. */
  subtitle?: string;
  /** Slot rendered before the text block (icon, avatar, etc.). */
  leading?: React.ReactNode;
  /** Slot rendered after the text block, before the chevron. */
  trailing?: React.ReactNode;
  /** Show a disclosure chevron on the trailing edge. */
  showChevron?: boolean;
  /** Haptic on press. Default "selection"; false to disable. */
  haptic?: "light" | "medium" | "heavy" | "selection" | false;
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  /** Vertical rhythm: "default" for standard rows, "compact" for dense
   *  rails (media pickers, followers) where more rows must fit the fold. */
  density?: "default" | "compact";
  /** Title line clamp. Default 1 — event/news rows that must not lose
   *  their tail should pass 2. */
  titleNumberOfLines?: number;
  /** Subtitle line clamp. Default 2. */
  subtitleNumberOfLines?: number;
  children?: React.ReactNode;
}


const ListItem = forwardRef<React.ElementRef<typeof Pressable>, ListItemProps>(
  function ListItem(
    {
      title,
      subtitle,
      leading,
      trailing,
      showChevron = false,
      haptic = "selection",
      className,
      titleClassName,
      subtitleClassName,
      density = "default",
      titleNumberOfLines = 1,
      subtitleNumberOfLines = 2,
      children,
      disabled,
      onPress,
      onPressIn,
      onPressOut,
      accessibilityLabel,
      accessibilityHint,
      accessibilityRole,
      accessibilityState,
      ...props
    },
    ref
  ) {
    const haptics = useHaptic();
    const press = usePressAnimation({ pressedScale: 0.98, fast: true });
    const reduce = useReducedMotion();
    // Ink wash — a fast fade of the muted-foreground token while the row is
    // held. Low opacity keeps it a wash on both schemes.
    const ink = useSharedValue(0);
    // Lit lists brighten the held row instead: foreground light on dark,
    // the accent's light on a white light-scheme card.
    const { lit } = useContext(ListInsetContext);
    const { scheme } = useTheme();
    const washPeak = lit ? LIT_WASH : 0.14;
    const inkStyle = useAnimatedStyle(() => ({
      opacity: ink.value * washPeak,
    }));
    const washClass = lit
      ? scheme === "dark"
        ? "bg-foreground"
        : "bg-primary"
      : "bg-muted-foreground";
    // Disclosure nudge — the chevron leans 2px right while the row is held,
    // a whisper of "this goes somewhere" before the navigation fires.
    const chevronX = useSharedValue(0);
    const chevronStyle = useAnimatedStyle(() => ({
      transform: [{ translateX: chevronX.value }],
    }));

    const handlePress = (e: GestureResponderEvent) => {
      // Static rows have no onPress — never vibrate without an action.
      if (haptic && onPress) haptics[haptic]();
      onPress?.(e);
    };

    return (
      <AnimatedPressable
        ref={ref}
        disabled={disabled}
        onPress={handlePress}
        onPressIn={(e) => {
          press.onPressIn();
          ink.value = withTiming(1, timing.instant);
          if (showChevron && !reduce) chevronX.value = withTiming(2, timing.fast);
          onPressIn?.(e);
        }}
        onPressOut={(e) => {
          press.onPressOut();
          ink.value = withTiming(0, timing.normal);
          if (showChevron && !reduce) chevronX.value = withSpring(0, spring.press);
          onPressOut?.(e);
        }}
        style={press.animatedStyle}
        className={cn(
          // relative: the absolute ink overlay below clips to this row.
          density === "compact"
            ? "relative min-h-9 w-full flex-row items-center gap-2.5 px-4 py-1.5"
            : "relative min-h-11 w-full flex-row items-center gap-3 px-4 py-2.5",
          disabled && "opacity-50",
          className
        )}
        {...a11yProps(
          { accessibilityLabel, accessibilityHint, accessibilityRole, accessibilityState },
          // Static rows (no onPress) are not interactive — never claim button.
          onPress ? "button" : "none"
        )}
        accessibilityLabel={accessibilityLabel ?? title}
        accessibilityState={{ disabled: !!disabled, ...accessibilityState }}
        // RNW drops the accessibilityState object — mirror selected/disabled
        // as aria-* so web screen readers announce row state (switch pattern).
        aria-disabled={!!disabled}
        aria-selected={accessibilityState?.selected}
        hitSlop={6}
        {...props}
      >
        <Animated.View
          pointerEvents="none"
          style={inkStyle}
          className={cn("absolute inset-0", washClass)}
        />
        {leading}
        <View className="flex-1 gap-0.5">
          <Text
            className={cn(
              density === "compact" ? "text-sm text-foreground" : "text-base text-foreground",
              titleClassName
            )}
            numberOfLines={titleNumberOfLines}
          >
            {title}
          </Text>
          {subtitle != null && (
            <Text
              className={cn(
                density === "compact" ? "text-xs text-muted-foreground" : "text-sm text-muted-foreground",
                subtitleClassName
              )}
              numberOfLines={subtitleNumberOfLines}
            >
              {subtitle}
            </Text>
          )}
          {children}
        </View>
        {trailing}
        {showChevron && (
          <Animated.View
            style={chevronStyle}
            accessibilityElementsHidden
            importantForAccessibility="no"
            aria-hidden
          >
            <Icon name="chevron-right" size="sm" color="mutedForeground" />
          </Animated.View>
        )}
      </AnimatedPressable>
    );
  }
);

export interface ListSeparatorProps extends ViewProps {
  /**
   * Left inset preset:
   *  - omitted (default): 16px — under the text start of a row without a
   *    leading slot (hairlines never run
   *    full-bleed inside a section).
   *  - `"none"`/false: full-bleed.
   *  - `"icon"`/true: starts under the leading slot edge (16px — the row's
   *    px-4). Legacy `inset` maps here for pixel parity.
   *  - `"text"`: aligns under the title text, past a standard 24px leading
   *    icon (16px padding + 24px icon + 12px gap = 52px).
   *  - number: exact px inset — match your leading slot's width.
   */
  inset?: boolean | "none" | "icon" | "text" | number;
  className?: string;
}

const ListSeparator = forwardRef<React.ElementRef<typeof View>, ListSeparatorProps>(
  function ListSeparator({ inset, className, style, ...props }, ref) {
    const marginClass =
      inset === "text"
        ? // 16px row padding + 24px icon slot + 12px gap.
          "ml-[52px]"
        : inset === undefined || inset === true || inset === "icon"
          ? "ml-4"
          : inset === false || inset === "none"
            ? "mx-0"
            : undefined;
    return (
      <View
        ref={ref}
        className={cn("bg-border", marginClass, className)}
        // Numeric inset goes through style — arbitrary px can't be a class.
        // True hairline (0.33pt on 3x screens), not a 1pt rule.
        style={[{ height: StyleSheet.hairlineWidth }, typeof inset === "number" && { marginLeft: inset }, style]}
        accessibilityElementsHidden
        importantForAccessibility="no"
        aria-hidden
        {...props}
      />
    );
  }
);

export const List = Object.assign(ListRoot, {
  Section: ListSection,
  Item: ListItem,
  Separator: ListSeparator,
});

List.displayName = "List";
ListSection.displayName = "List.Section";
ListItem.displayName = "List.Item";
ListSeparator.displayName = "List.Separator";
