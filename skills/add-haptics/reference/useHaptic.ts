import { useCallback, useMemo } from "react";
import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

/**
 * One haptic vocabulary for the whole app.
 *
 *   selection  toggles, segments, picker and slider steps
 *   light      buttons, rows, a threshold crossed
 *   medium     long press activates, destructive confirm
 *   success    a confirmed result (after the work succeeded)
 *   warning    a refused or invalid tap
 *   error      a failed request
 *
 * Needs expo-haptics (`npx expo install expo-haptics`). Silent on web, and
 * `enabled = false` honours a user setting. Calls never throw.
 */
export type HapticKind = "selection" | "light" | "medium" | "heavy" | "success" | "warning" | "error";

const ON = Platform.OS === "ios" || Platform.OS === "android";

export function useHaptic(enabled: boolean = true) {
  const fire = useCallback(
    (kind: HapticKind) => {
      if (!enabled || !ON) return;
      const run = (): Promise<void> => {
        switch (kind) {
          case "selection":
            return Haptics.selectionAsync();
          case "light":
            return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          case "medium":
            return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          case "heavy":
            return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          case "success":
            return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          case "warning":
            return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          case "error":
            return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      };
      // Haptics are best-effort: a device without an engine must not crash a tap.
      run().catch(() => {});
    },
    [enabled]
  );

  return useMemo(
    () => ({
      fire,
      selection: () => fire("selection"),
      light: () => fire("light"),
      medium: () => fire("medium"),
      heavy: () => fire("heavy"),
      success: () => fire("success"),
      warning: () => fire("warning"),
      error: () => fire("error"),
    }),
    [fire]
  );
}
