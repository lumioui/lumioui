import { useSyncExternalStore } from "react";

/** Which scheme the screen on stage has pinned itself to, if any.
 *
 *  A fixed-scheme stage (`<Accent scheme="dark">` / `<World scheme="dark">`)
 *  renders a dark canvas even in a light app. System chrome drawn by the
 *  host — the demo frame's status bar and home indicator, a real app's
 *  StatusBar style — must follow the stage, not the app theme, or the
 *  clock and signal glyphs vanish on the dark canvas. Accent registers
 *  its pinned scheme here; hosts read it with `useStageScheme()`.
 *
 *  A screen can also pin only its top edge (`<StatusBarTone>` over a photo
 *  hero): that moves the status bar and leaves the home indicator on the
 *  stage or app theme, since the bottom of the screen hasn't changed.
 *  Nested pins count, so an unmount only clears when the last one goes. */
type Scheme = "light" | "dark";
type Edge = "screen" | "top";

const counts: Record<Edge, Record<Scheme, number>> = {
  screen: { light: 0, dark: 0 },
  top: { light: 0, dark: 0 },
};
const pinned: Record<Edge, Scheme | null> = { screen: null, top: null };
const listeners = new Set<() => void>();

const recompute = (edge: Edge) => {
  const c = counts[edge];
  const next: Scheme | null = c.dark > 0 ? "dark" : c.light > 0 ? "light" : null;
  if (next !== pinned[edge]) {
    pinned[edge] = next;
    for (const l of listeners) l();
  }
};

/** Called by Accent (whole screen) or StatusBarTone (`edge: "top"`) for a
 *  pinned scheme; returns the release function. */
export function pinStageScheme(scheme: Scheme, edge: Edge = "screen"): () => void {
  counts[edge][scheme] += 1;
  recompute(edge);
  return () => {
    counts[edge][scheme] -= 1;
    recompute(edge);
  };
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
const readScreen = () => pinned.screen;
const readTop = () => pinned.top ?? pinned.screen;

/** The scheme the current stage is pinned to, or null when it follows the
 *  app theme. Pass `"top"` for the status bar: a top-edge pin wins there. */
export function useStageScheme(edge: Edge = "screen"): Scheme | null {
  const read = edge === "top" ? readTop : readScreen;
  return useSyncExternalStore(subscribe, read, read);
}
