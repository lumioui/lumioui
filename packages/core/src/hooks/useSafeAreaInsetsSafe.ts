import { createContext, useContext, useEffect, useState } from "react";
import type { Context } from "react";
import { Platform } from "react-native";
import { optionalRequire } from "../utils/optionalRequire";

export interface Insets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

const ZERO_INSETS: Insets = { top: 0, bottom: 0, left: 0, right: 0 };

type SafeAreaModule = {
  SafeAreaInsetsContext?: Context<Insets | null>;
};

// Resolved once per bundle — the context identity stays stable, so the
// unconditional useContext below never changes hook order mid-session.
// Optional peer: hidden from Metro's static require analysis via
// optionalRequire so hosts without safe-area-context still bundle.
const FALLBACK_INSETS_CONTEXT = createContext<Insets | null>(null);
const INSETS_CONTEXT =
  optionalRequire<SafeAreaModule>("react-native-safe-area-context")
    ?.SafeAreaInsetsContext ?? FALLBACK_INSETS_CONTEXT;

/**
 * Safe version of useSafeAreaInsets that never throws when no
 * SafeAreaProvider is mounted (e.g. web preview iframes or React Native Web
 * Modal portals that lose context).
 *
 * Resolution order: real provider insets (via optional
 * react-native-safe-area-context) → web CSS env() values → zeros.
 */
export function useSafeAreaInsetsSafe(): Insets {
  const fromProvider = useContext(INSETS_CONTEXT);
  const [webInsets, setWebInsets] = useState<Insets | null>(null);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    // Minimal structural types for the DOM — core builds without the DOM lib.
    interface WebElementLike {
      style: { cssText: string };
      remove: () => void;
    }
    interface WebDocumentLike {
      createElement: (tag: string) => WebElementLike;
      body: { appendChild: (el: WebElementLike) => void };
    }
    interface WebWindowLike {
      getComputedStyle: (el: WebElementLike) => Record<string, string>;
    }
    const w = globalThis as typeof globalThis & {
      window?: WebWindowLike;
      document?: WebDocumentLike;
    };
    if (!w.window || !w.document || !w.document.body) return;
    const el = w.document.createElement("div");
    el.style.cssText =
      "position:fixed;top:env(safe-area-inset-top);left:env(safe-area-inset-left);right:env(safe-area-inset-right);bottom:env(safe-area-inset-bottom);visibility:hidden";
    w.document.body.appendChild(el);
    const cs = w.window.getComputedStyle(el);
    setWebInsets({
      top: parseInt(cs.top || "0", 10) || 0,
      bottom: parseInt(cs.bottom || "0", 10) || 0,
      left: parseInt(cs.left || "0", 10) || 0,
      right: parseInt(cs.right || "0", 10) || 0,
    });
    el.remove();
  }, []);

  if (fromProvider) return fromProvider;
  if (webInsets) return webInsets;
  return ZERO_INSETS;
}
