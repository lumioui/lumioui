import * as React from "react";
import { forwardRef } from "react";
import { Pressable, Text, View, type PressableProps, type ViewProps } from "react-native";
import Animated from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { cn, useTheme } from "@lumioui/core";
import { HANDWRITING, PAPER, paperShadow, usePaperLift } from "../sticker";

/**
 * PaperClip — a wire clip over the top edge of whatever it wraps, optionally
 * holding a small paper tab with a handwritten label that sticks up above the
 * edge (an index tab: "Day 3", "Receipts"). Press the tab and it slides up
 * out of the clip — it rises, straightens and lifts its shadow — and slips
 * back on release. The clip itself stays put; it's the thing holding on.
 *
 *   <PaperClip tab="Day 3" position="right">
 *     <Card>…</Card>
 *   </PaperClip>
 *   <PaperClip position="left" tone="primary"><Polaroid image={…} /></PaperClip>
 *
 * Expo Go compatible.
 */

/** The clip, drawn on an 18×50 grid: inner loop, top bend, long outer loop. */
const CLIP_PATH = "M6 14 V38 a3 3 0 0 0 6 0 V8 a5 5 0 0 0 -10 0 V42 a7 7 0 0 0 14 0 V14";
const CLIP_W = 18;
const CLIP_H = 50;
/** Drawn grid → points. */
const CLIP_SCALE = 1.2;
/** How far the tab stands above the wrapped edge, and how far it tucks under. */
const TAB_OVER = 30;
const TAB_H = 46;
/** Smallest touch target, in points. */
const MIN_TARGET = 44;

export interface PaperClipProps extends Omit<ViewProps, "children"> {
  className?: string;
  /** The surface being clipped — a card, a note, a photo. */
  children: React.ReactNode;
  /** Label on a paper tab held under the clip. A string is handwritten. */
  tab?: React.ReactNode;
  /** Where along the top edge the clip sits. Default "left". */
  position?: "left" | "center" | "right";
  /** Tab tilt in degrees. Default -3. */
  tilt?: number;
  /** Wire colour. Default "steel". */
  tone?: "steel" | "primary";
  /** Tab paper. Default "paper". */
  tabTone?: "paper" | "kraft";
  /** Called when the tab (or the bare clip) is pressed. */
  onPress?: PressableProps["onPress"];
  /** Selection haptic as the tab lifts. Default true. */
  haptic?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
}

export const PaperClip = forwardRef<React.ElementRef<typeof View>, PaperClipProps>(
  function PaperClip(
    {
      className,
      children,
      tab,
      position = "left",
      tilt = -3,
      tone = "steel",
      tabTone = "paper",
      onPress,
      haptic = true,
      disabled,
      accessibilityLabel,
      ...props
    },
    ref
  ) {
    const { colors, scheme } = useTheme();
    const { onPressIn, onPressOut, surfaceStyle, liftShadowStyle } = usePaperLift({
      tilt: tab != null ? tilt : 0,
      rise: tab != null ? 4 : 2,
      grow: 1,
      straighten: 0.6,
      haptic,
      disabled: !!disabled,
    });

    // Wire: a neutral steel with a highlight down its length, or ink.
    const wire = tone === "primary" ? colors.primary : scheme === "dark" ? "#B5B5B2" : "#8E8E8B";
    const shine = tone === "primary" ? colors.primaryForeground : "#FFFFFF";
    const paper = tabTone === "kraft" ? PAPER.kraft[scheme] : PAPER.stock[scheme];
    const over = tab != null ? TAB_OVER : 22;
    const align =
      position === "center" ? "justify-center" : position === "right" ? "justify-end" : "justify-start";

    const label =
      accessibilityLabel ?? (typeof tab === "string" ? tab : undefined);

    // The tab sits behind the wrapped surface so only its top shows; a
    // transparent twin in front carries the clip and, when pressable, the
    // touch for the part of the tab (and clip) standing above the edge.
    const [tabW, setTabW] = React.useState(72);
    const hasTab = tab != null;
    const clipW = CLIP_W * CLIP_SCALE;
    const hitW = hasTab ? tabW : clipW;
    // Grow the touch area to 44pt: sideways for the slim bare clip, and mostly
    // upward (away from the content) for the short strip above the edge.
    const padX = Math.max(8, Math.ceil((MIN_TARGET - hitW) / 2));
    const padY = Math.max(0, MIN_TARGET - over);
    const hitSlop = { left: padX, right: padX, top: Math.ceil(padY * 0.6), bottom: Math.floor(padY * 0.4) };

    const clip = (
      <Animated.View
        pointerEvents="none"
        className="absolute"
        style={[{ left: hasTab ? 10 : 0, top: hasTab ? -10 : 0 }, hasTab ? null : surfaceStyle]}
      >
        <Svg width={(CLIP_W + 2) * CLIP_SCALE} height={(CLIP_H + 2) * CLIP_SCALE} viewBox={`0 0 ${CLIP_W + 2} ${CLIP_H + 2}`}>
          <Path d={CLIP_PATH} stroke="#000" strokeOpacity={0.16} strokeWidth={2.6} fill="none" strokeLinecap="round" transform="translate(1 1.5)" />
          <Path d={CLIP_PATH} stroke={wire} strokeWidth={2.4} fill="none" strokeLinecap="round" />
          <Path d={CLIP_PATH} stroke={shine} strokeOpacity={0.55} strokeWidth={0.8} fill="none" strokeLinecap="round" transform="translate(-0.4 -0.4)" />
        </Svg>
      </Animated.View>
    );

    return (
      <View ref={ref} className={cn("relative", className)} style={{ paddingTop: over }} {...props}>
        {hasTab ? (
          <View pointerEvents="none" className={cn("absolute left-0 right-0 top-0 flex-row px-5", align)}>
            <Animated.View style={surfaceStyle} onLayout={(e) => setTabW(Math.ceil(e.nativeEvent.layout.width))}>
              <Animated.View
                className="absolute inset-0 rounded-md"
                style={[{ backgroundColor: paper }, paperShadow(true), liftShadowStyle]}
              />
              <View
                className="min-w-[72px] items-start rounded-md pl-11 pr-4 pt-1"
                style={[{ height: TAB_H, backgroundColor: paper }, paperShadow(false)]}
              >
                {typeof tab === "string" ? (
                  <Text numberOfLines={1} style={{ fontFamily: HANDWRITING, fontSize: 16, color: PAPER.ink }}>
                    {tab}
                  </Text>
                ) : (
                  tab
                )}
              </View>
            </Animated.View>
          </View>
        ) : null}
        {children}
        <View pointerEvents="box-none" className={cn("absolute left-0 right-0 top-0 flex-row px-5", align)}>
          {onPress ? (
            // Only the strip above the wrapped edge answers the finger, so the
            // content under the clip keeps its own touches.
            <Pressable
              disabled={disabled}
              onPress={onPress}
              onPressIn={onPressIn}
              onPressOut={onPressOut}
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityState={{ disabled: !!disabled }}
              hitSlop={hitSlop}
              style={{ width: hitW, height: over }}
            >
              {clip}
            </Pressable>
          ) : (
            <View style={{ width: hitW, height: over, pointerEvents: "none" }}>{clip}</View>
          )}
        </View>
      </View>
    );
  }
);

PaperClip.displayName = "PaperClip";
