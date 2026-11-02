import { useCallback, useEffect, useRef, useState } from "react";
import type { GestureResponderEvent } from "react-native";

export type PressState = "idle" | "loading" | "success" | "error";

export interface AsyncPressResult {
  /** Current press state. */
  state: PressState;
  /** Whether a press is currently in-flight. */
  loading: boolean;
  /** Wrap the user's onPress — auto-tracks the promise. */
  handlePress: (e: GestureResponderEvent) => void;
  /** Manually set the state (for controlled usage). */
  setState: (s: PressState) => void;
}

/**
 * Auto-tracks async onPress handlers.
 *
 * When the user's onPress returns a Promise, this hook automatically
 * transitions: idle → loading → success/error → idle.
 * If onPress is synchronous, it just fires and stays idle.
 *
 * Usage:
 *   const { state, loading, handlePress } = useAsyncPress(onPress, { resetAfter: 1400 });
 *   <Button onPress={handlePress} loading={loading} />
 */
export function useAsyncPress(
  onPress?: (e: GestureResponderEvent) => void | Promise<unknown>,
  options: { resetAfter?: number; haptic?: () => void } = {}
): AsyncPressResult {
  const { resetAfter = 1400, haptic } = options;
  const [state, setState] = useState<PressState>("idle");
  const mounted = useRef(true);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePress = useCallback(
    async (e: GestureResponderEvent) => {
      if (state === "loading") return;
      // A re-press during success/error must cancel the pending idle reset —
      // otherwise the stale timer snaps the new in-flight load back to idle.
      if (resetTimer.current) {
        clearTimeout(resetTimer.current);
        resetTimer.current = null;
      }
      haptic?.();
      const result = onPress?.(e);
      if (result && typeof (result as Promise<unknown>).then === "function") {
        setState("loading");
        try {
          await result;
          if (mounted.current) setState("success");
        } catch {
          if (mounted.current) setState("error");
        }
        if (mounted.current && resetAfter > 0) {
          resetTimer.current = setTimeout(() => {
            resetTimer.current = null;
            if (mounted.current) setState("idle");
          }, resetAfter);
        }
      }
    },
    [onPress, state, haptic, resetAfter]
  );

  // Cleanup on unmount
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  return { state, loading: state === "loading", handlePress, setState };
}
