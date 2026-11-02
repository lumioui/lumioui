import * as React from "react";
import { StatusBar } from "react-native";
import { pinStageScheme } from "./stage";

export interface StatusBarToneProps {
  /** "light" = white clock and icons (for a dark or saturated top); "dark" = ink (for a pale top). */
  tone: "light" | "dark";
}

/**
 * StatusBarTone — sets the status bar glyphs for a screen whose top doesn't
 * follow the app theme: a dark photo or colour hero in a light app (tone
 * "light"), or a pale photo in a dark app (tone "dark"). Render it once
 * anywhere in the screen. It sets the system status bar, and a host that
 * draws its own status bar (the preview frame) reads it via
 * useStageScheme("top"). Only the top edge moves: the home indicator still
 * follows the screen's theme.
 *
 *   <StatusBarTone tone="light" />
 */
export function StatusBarTone({ tone }: StatusBarToneProps) {
  React.useEffect(() => pinStageScheme(tone === "light" ? "dark" : "light", "top"), [tone]);
  return <StatusBar barStyle={tone === "light" ? "light-content" : "dark-content"} />;
}
StatusBarTone.displayName = "StatusBarTone";
