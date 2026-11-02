import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

/**
 * Reactive snapshot of the user's "reduce motion" accessibility preference.
 * Components should use this to skip non-essential motion (shakes, draw-ons,
 * bounces) and jump straight to the final state.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduced(enabled);
    });
    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduced
    );
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  return reduced;
}
