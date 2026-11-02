import { AccessibilityInfo, Platform } from "react-native";
import type { AccessibilityProps, AccessibilityRole } from "react-native";

/** Announce a message to VoiceOver (iOS) / TalkBack (Android). */
export function announce(message: string) {
  AccessibilityInfo.announceForAccessibility(message);
}

/** True when a screen reader is currently enabled. */
export async function isScreenReaderEnabled(): Promise<boolean> {
  return AccessibilityInfo.isScreenReaderEnabled();
}

/** True when the user prefers reduced motion — respect it in animations. */
export async function prefersReducedMotion(): Promise<boolean> {
  return AccessibilityInfo.isReduceMotionEnabled();
}

/** Picked from React Native's own AccessibilityProps so a props interface
 *  that extends both these and PressableProps/ViewProps sees identical
 *  members on every React Native version. */
export type A11yProps = Pick<AccessibilityProps, "accessible" | "accessibilityLabel" | "accessibilityHint" | "accessibilityRole" | "accessibilityState">;

/** Merge component-provided a11y props with sensible role defaults. */
export function a11yProps(props: A11yProps, defaultRole: AccessibilityRole): A11yProps {
  return {
    accessible: true,
    accessibilityRole: props.accessibilityRole ?? defaultRole,
    accessibilityLabel: props.accessibilityLabel,
    accessibilityHint: props.accessibilityHint,
    accessibilityState: props.accessibilityState,
  };
}

/** Minimum touch target size (pt/dp) per platform guidelines. */
export const minTouchTarget = Platform.select({ ios: 44, android: 48, default: 44 });
