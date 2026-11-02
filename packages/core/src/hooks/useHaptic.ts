import { useCallback, useMemo } from "react";
import { optionalRequire } from "../utils/optionalRequire";

/**
 * Choreographed haptic feedback for React Native.
 *
 * Uses `expo-haptics` when the host app provides it (via an optional
 * require — never a hard import, so web and bare RN keep working) and
 * resolves to safe no-ops when the module is unavailable.
 *
 * Usage:
 *   const haptic = useHaptic();
 *   <Pressable onPress={() => { haptic.light(); doThing(); }} />
 */

type HapticStyle = "light" | "medium" | "heavy" | "success" | "warning" | "error" | "selection";

interface ExpoHapticsModule {
  impactAsync: (style: unknown) => Promise<void>;
  notificationAsync: (type: unknown) => Promise<void>;
  selectionAsync: () => Promise<void>;
  ImpactFeedbackStyle: Record<"Light" | "Medium" | "Heavy", unknown>;
  NotificationFeedbackType: Record<"Success" | "Warning" | "Error", unknown>;
}

// Resolved once per bundle — optional peer, invisible to Metro's static
// require analysis so hosts without expo-haptics still bundle.
const haptics =
  (() => {
    const mod = optionalRequire<ExpoHapticsModule>("expo-haptics");
    return mod && typeof mod.impactAsync === "function" ? mod : null;
  })();

export function useHaptic(enabled: boolean = true) {
  const fire = useCallback(
    (style: HapticStyle) => {
      if (!enabled) return;
      if (haptics) {
        switch (style) {
          case "light":
          case "medium":
          case "heavy":
            void haptics.impactAsync(
              haptics.ImpactFeedbackStyle[
                (style[0]!.toUpperCase() + style.slice(1)) as "Light" | "Medium" | "Heavy"
              ]
            );
            break;
          case "success":
          case "warning":
          case "error":
            void haptics.notificationAsync(
              haptics.NotificationFeedbackType[
                (style[0]!.toUpperCase() + style.slice(1)) as "Success" | "Warning" | "Error"
              ]
            );
            break;
          case "selection":
            void haptics.selectionAsync();
            break;
        }
        return;
      }
      // No haptic engine available (web, Expo Go without the module, bare
      // RN without Vibration support) — a raw Vibration buzz on every tap
      // would feel broken, so this is an intentional no-op.
    },
    [enabled]
  );

  return useMemo(
    () => ({
      light: () => fire("light"),
      medium: () => fire("medium"),
      heavy: () => fire("heavy"),
      success: () => fire("success"),
      warning: () => fire("warning"),
      error: () => fire("error"),
      selection: () => fire("selection"),
      fire,
    }),
    [fire]
  );
}
