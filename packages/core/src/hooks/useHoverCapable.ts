import { useState, useEffect } from "react";
import { Platform } from "react-native";

/** Minimal structural types for the web matchMedia API (core has no DOM lib). */
interface MediaQueryListLike {
  matches: boolean;
  addEventListener?: (type: "change", listener: (event: { matches: boolean }) => void) => void;
  removeEventListener?: (type: "change", listener: (event: { matches: boolean }) => void) => void;
}

interface WebWindowLike {
  matchMedia: (query: string) => MediaQueryListLike;
}

/**
 * Detects whether the current device supports hover (mouse/trackpad)
 * vs touch-only. Used to gate hover-only effects so touch devices
 * don't get stuck "phantom hover" states after a tap.
 *
 * On native (iOS/Android) this always returns false.
 * On web, it checks the `(hover: hover)` media query.
 */
export function useHoverCapable(): boolean {
  const [capable, setCapable] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const w = globalThis as typeof globalThis & { window?: WebWindowLike };
    if (!w.window?.matchMedia) return;
    const mq = w.window.matchMedia("(hover: hover) and (pointer: fine)");
    setCapable(mq.matches);
    const handler = (e: { matches: boolean }) => setCapable(e.matches);
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);

  return capable;
}
