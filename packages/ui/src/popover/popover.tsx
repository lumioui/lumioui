import * as React from "react";
import { createContext, forwardRef, useContext } from "react";
import { Modal, Pressable, View, useWindowDimensions, type PressableProps, type ViewProps, } from "react-native";
import Animated, {
  Easing,
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
  cancelAnimation,
  runOnJS,
} from "react-native-reanimated";
import {
  cn,
  ease,
  spring,
  timing,
  useHaptic,
  usePressAnimation,
  useReducedMotion,
  useTheme,
  minTouchTarget,
  AnimatedPressable,
  BAND_STAGGER,
  LitEdge,
} from "@lumioui/core";
import { Glass } from "../glass";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Anchor {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PopoverCtx {
  open: boolean;
  setOpen: (open: boolean) => void;
  anchor: Anchor | null;
  setAnchor: (anchor: Anchor) => void;
  /** Set by a `lit` trigger: the panel waits for its light to lead. */
  lead: React.MutableRefObject<boolean>;
}
const Ctx = createContext<PopoverCtx | null>(null);

function usePopover() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("Popover.* must be inside <Popover>");
  return ctx;
}

export interface PopoverProps {
  /** Controlled open state. */
  open?: boolean;
  /** Uncontrolled initial state. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

/**
 * Popover — generic anchored floating content.
 * Compose with Popover.Trigger and Popover.Content.
 */
function PopoverRoot({ open, defaultOpen = false, onOpenChange, children }: PopoverProps) {
  const [internal, setInternal] = React.useState(defaultOpen);
  const [anchor, setAnchorState] = React.useState<Anchor | null>(null);
  const setAnchor = React.useCallback((next: Anchor) => {
    setAnchorState((cur) =>
      cur &&
      Math.abs(cur.x - next.x) < 0.5 &&
      Math.abs(cur.y - next.y) < 0.5 &&
      Math.abs(cur.width - next.width) < 0.5 &&
      Math.abs(cur.height - next.height) < 0.5
        ? cur
        : next
    );
  }, []);
  const lead = React.useRef(false);
  const isControlled = open !== undefined;
  const value = isControlled ? open : internal;

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (!isControlled) setInternal(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange]
  );

  return (
    <Ctx.Provider value={{ open: value, setOpen, anchor, setAnchor, lead }}>
      {children}
    </Ctx.Provider>
  );
}

export interface PopoverTriggerProps extends Omit<PressableProps, "children"> {
  children: React.ReactNode;
  className?: string;
  /** Light before motion: while open, a 1px accent underline lights under the
   *  trigger over timing.instant and the panel waits that long to grow. */
  lit?: boolean;
}

/** How often an open popover re-checks its trigger position (ms). */
const ANCHOR_POLL_MS = 250;
/** The trigger's light leads the panel by one instant beat. */
const LEAD = timing.instant.duration;

const PopoverTrigger = forwardRef<React.ElementRef<typeof Pressable>, PopoverTriggerProps>(
  function PopoverTrigger({ children, className, lit = false, onPress, onPressIn, onPressOut, ...props }, ref) {
    const { open, setOpen, setAnchor, lead } = usePopover();
    const haptics = useHaptic();
    const press = usePressAnimation();
    const innerRef = React.useRef<React.ComponentRef<typeof View>>(null);
    React.useEffect(() => {
      lead.current = lit;
    }, [lit, lead]);
    const glow = useSharedValue(lit && open ? 1 : 0);
    React.useEffect(() => {
      if (!lit) return;
      // Lights first on open; on close it dims last, after the panel (§5c rule 1).
      glow.value = open
        ? withTiming(1, { duration: LEAD, easing: Easing.bezier(...ease.out) })
        : withDelay(timing.recede.duration, withTiming(0, DIM));
    }, [lit, open, glow]);
    const underline = useAnimatedStyle(() => ({ opacity: glow.value }));
    // The trigger's visual size is whatever the child is — measure it and
    // expand hitSlop so the effective target is always ≥ minTouchTarget.
    const [triggerSize, setTriggerSize] = React.useState<{ width: number; height: number } | null>(null);
    const hitSlop = React.useMemo(() => {
      const v = Math.max(4, Math.ceil((minTouchTarget - (triggerSize?.height ?? 0)) / 2));
      const h = Math.max(4, Math.ceil((minTouchTarget - (triggerSize?.width ?? 0)) / 2));
      return { top: v, bottom: v, left: h, right: h };
    }, [triggerSize]);

    // Window-space rect of the trigger. getBoundingClientRect on web (sync,
    // so the first frame of the open already knows the anchor);
    // measureInWindow on native.
    const measureAnchor = React.useCallback(() => {
      const node = innerRef.current as unknown as
        | { getBoundingClientRect?: () => { left: number; top: number; width: number; height: number } }
        | null;
      if (node?.getBoundingClientRect) {
        const r = node.getBoundingClientRect();
        setAnchor({ x: r.left, y: r.top, width: r.width, height: r.height });
      } else {
        innerRef.current?.measureInWindow((x, y, width, height) => {
          setAnchor({ x, y, width, height });
        });
      }
    }, [setAnchor]);
    // Layout around the trigger can move after the overlay mounts (a parent
    // re-flowing, a stage padding change, a keyboard). While open, re-check
    // the trigger's rect a few times a second and follow it; setAnchor bails
    // out when nothing moved, so a still layout costs no re-renders.
    React.useEffect(() => {
      if (!open) return;
      const t = setInterval(measureAnchor, ANCHOR_POLL_MS);
      return () => clearInterval(t);
    }, [open, measureAnchor]);

    return (
      <AnimatedPressable
        ref={(node) => {
          innerRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          if (!triggerSize || triggerSize.width !== width || triggerSize.height !== height) {
            setTriggerSize({ width, height });
          }
        }}
        style={press.animatedStyle}
        hitSlop={hitSlop}
        onPressIn={(e) => {
          press.onPressIn();
          onPressIn?.(e);
        }}
        onPressOut={(e) => {
          press.onPressOut();
          onPressOut?.(e);
        }}
        onPress={(e) => {
          // Open immediately for responsive feel; measure async for position.
          const next = !open;
          // Haptic feedback only when the popover opens.
          if (next) haptics.light();
          measureAnchor();
          setOpen(next);
          onPress?.(e);
        }}
        className={className}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        // accessibilityState isn't forwarded to the DOM on web — mirror it.
        aria-expanded={open}
        aria-haspopup
        accessibilityHint="Opens a popover"
        {...props}
      >
        {children}
        {lit ? (
          <Animated.View
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            className="absolute -bottom-1 left-0 right-0 h-px rounded-full bg-primary"
            style={underline}
          />
        ) : null}
      </AnimatedPressable>
    );
  }
);

export interface PopoverContentProps extends ViewProps {
  className?: string;
  /** Horizontal alignment relative to the trigger. Default "center". */
  align?: "start" | "center" | "end";
  /** Which side of the trigger to render on. Default "bottom". */
  side?: "top" | "bottom";
  /** Gap between trigger and content. Default 6. */
  sideOffset?: number;
  /** Max content width — the panel hugs content up to this cap, then clamps
   * inside the safe window. Default 224. */
  contentWidth?: number;
  /** Surface material. "solid" (default) is the opaque popover surface with
   * a soft shadow; "glass" opts into Lumio glass — only over photos/video. */
  material?: "solid" | "glass";
}

/** Floating-surface shadow — black in both schemes (a foreground shadow
 * would glow under dark), soft and single-source. On dark the lifted
 * popover surface carries the depth; the shadow just grounds it. */
const FLOAT_SHADOW = {
  shadowColor: "#000",
  shadowOpacity: 0.14,
  shadowRadius: 24,
  shadowOffset: { width: 0, height: 8 },
  elevation: 8,
} as const;

/**
 * Lumio popover: the panel grows out of its trigger — scale 0.94→1 about
 * the anchor point on spring.panel, a 6px drift away from the trigger, and
 * an ignite over timing.fast. Leaving, it dims in place to 0.97 on
 * timing.recede without retreating. Reduced motion keeps only the opacity.
 *
 * Container, then content: the shape grows with its content dim (0.4), and
 * the content switches on a band later (120ms). A `lit` trigger lights first
 * and the panel waits one instant beat for it. In dark scheme the solid
 * panel carries a lit top edge.
 */
const CONTENT_DIM = 0.4;
const FROM_SCALE = 0.94;
const EXIT_SCALE = 0.97;
/** Starting offset toward the trigger — within the ≤8px overlay rise. */
const DRIFT = 6;
const IGNITE = { duration: timing.fast.duration, easing: Easing.bezier(...ease.out) } as const;
const DIM = { duration: timing.recede.duration, easing: Easing.bezier(...ease.in) } as const;
/** Open panel corner radius — Lumio's floating-surface radius. */
const PANEL_RADIUS = 20;

const PopoverContent = forwardRef<React.ElementRef<typeof View>, PopoverContentProps>(
  function PopoverContent(
    { className, align = "center", side = "bottom", sideOffset = 8, contentWidth = 280, material = "solid", children, onLayout, style, ...props },
    ref
  ) {
    const { open, setOpen, anchor, lead } = usePopover();
    const { scheme } = useTheme();
    const { width: winW, height: winH } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const haptics = useHaptic();
    const reduceMotion = useReducedMotion();
    // Measured panel size — the panel hugs content up to contentWidth, so
    // alignment, clamping and the growth origin need the real laid-out size.
    const [panel, setPanel] = React.useState({ width: 0, height: 0 });
    const measured = panel.width > 0 && panel.height > 0;
    // Keep the Modal mounted through the dim so the exit is visible.
    const [rendered, setRendered] = React.useState(false);
    const opacity = useSharedValue(0);
    const scale = useSharedValue(reduceMotion ? 1 : FROM_SCALE);
    // 1 = tucked DRIFT px toward the trigger, 0 = resting.
    const drift = useSharedValue(reduceMotion ? 0 : 1);
    // Content brightness inside the panel — dim while the shape grows.
    const content = useSharedValue(CONTENT_DIM);

    React.useEffect(() => {
      if (open) {
        setRendered(true);
        // The trigger measures async and the panel measures on its first
        // layout — wait for both so the growth starts from the real anchor
        // instead of a settled panel blinking in.
        if (!anchor || !measured) return;
        const wait = lead.current ? LEAD : 0;
        opacity.value = withDelay(wait, withTiming(1, IGNITE));
        content.value = CONTENT_DIM;
        content.value = withDelay(wait + BAND_STAGGER, withTiming(1, IGNITE));
        if (reduceMotion) {
          scale.value = 1;
          drift.value = 0;
        } else {
          scale.value = FROM_SCALE;
          drift.value = 1;
          scale.value = withDelay(wait, withSpring(1, spring.panel));
          drift.value = withDelay(wait, withSpring(0, spring.panel));
        }
        return;
      }
      const unmount = (finished?: boolean) => {
        "worklet";
        if (finished) runOnJS(setRendered)(false);
      };
      // Dim in place — no retreat into the trigger.
      opacity.value = withTiming(0, DIM, unmount);
      if (!reduceMotion) scale.value = withTiming(EXIT_SCALE, DIM);
    }, [open, anchor, measured, scale, drift, opacity, content, lead, reduceMotion]);

    React.useEffect(
      () => () => {
        cancelAnimation(scale);
        cancelAnimation(drift);
        cancelAnimation(opacity);
        cancelAnimation(content);
      },
      [scale, drift, opacity, content]
    );
    const contentStyle = useAnimatedStyle(() => ({ opacity: content.value }));

    // Close haptic fires on dismiss paths (backdrop tap / hardware back),
    // mirroring dropdown-menu — item presses keep their own haptics.
    const close = () => {
      haptics.selection();
      setOpen(false);
    };

    // Panel hugs its content, capped by contentWidth and the safe window.
    const maxW = Math.min(contentWidth, winW - 16 - insets.left - insets.right);
    const panelW = measured ? Math.min(panel.width, maxW) : maxW;
    const panelH = panel.height;

    const anchorCX = anchor ? anchor.x + anchor.width / 2 : winW / 2;
    let left = 8 + insets.left;
    let top = insets.top + 8;
    if (anchor) {
      if (align === "start") left = anchor.x;
      else if (align === "end") left = anchor.x + anchor.width - panelW;
      else left = anchorCX - panelW / 2;
      left = Math.max(8 + insets.left, Math.min(left, winW - panelW - 8 - insets.right));

      top =
        side === "bottom"
          ? // Clamp the panel's bottom edge (top + panelH) against the lower
            // safe area — clamping top alone let tall content run offscreen.
            Math.max(
              insets.top + 8,
              Math.min(anchor.y + anchor.height + sideOffset, winH - insets.bottom - 8 - panelH)
            )
          : Math.max(insets.top + 8, anchor.y - sideOffset - panelH);
    }

    // Grow from the trigger: the origin sits where the panel meets it.
    const originX = Math.max(0, Math.min(anchorCX - left, panelW));
    const originY = side === "bottom" ? 0 : panelH;
    const toward = side === "bottom" ? -DRIFT : DRIFT;

    const panelStyle = useAnimatedStyle(
      () => ({
        opacity: measured ? opacity.value : 0,
        transform: [{ translateY: drift.value * toward }, { scale: scale.value }],
      }),
      [measured, toward]
    );

    if (!anchor) return null;

    return (
      <Modal
        visible={rendered}
        transparent
        animationType="none"
        onRequestClose={close}
        statusBarTranslucent
      >
        <View className="flex-1" style={{ width: "100%", height: "100%" }}>
          <Pressable
            className="flex-1"
            style={{ width: "100%", height: "100%" }}
            onPress={close}
            accessibilityLabel="Close popover" accessibilityRole="button"
          />
          <Animated.View
            ref={ref}
            // Claim taps that land on dead space inside the panel (padding,
            // non-interactive content) so they can't fall through to the
            // backdrop and dismiss. Children still claim first — this only
            // catches touches nothing inside handled.
            onStartShouldSetResponder={() => true}
            style={[
              {
                position: "absolute",
                left,
                top,
                width: measured ? panelW : undefined,
                maxWidth: maxW,
                borderRadius: PANEL_RADIUS,
                transformOrigin: [originX, originY, 0],
              },
              material === "solid" ? FLOAT_SHADOW : null,
              panelStyle,
            ]}
            className={material === "solid" ? "bg-popover" : undefined}
            accessibilityViewIsModal
            // RN's accessibilityRole enum has no "dialog" — `role` carries
            // the precise semantics (web + supported native mappings) and
            // aria-modal marks the panel as the modal surface on web. Kept
            // "menu" off: popover content is generic, not menu-only.
            role="dialog"
            aria-modal
            {...props}
          >
            {/* Inner clip — separate from the shadowed panel because iOS
                drops the shadow on a view that clips its children. */}
            <View style={{ overflow: "hidden", borderRadius: PANEL_RADIUS }}>
              {material === "glass" ? (
                <Glass effect="regular" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} />
              ) : null}
              <Animated.View
                onLayout={(e) => {
                  const { width, height } = e.nativeEvent.layout;
                  if (width !== panel.width || height !== panel.height) {
                    setPanel({ width, height });
                  }
                  onLayout?.(e);
                }}
                style={[style, contentStyle]}
                className={cn("p-4", className)}
              >
                {children}
              </Animated.View>
              {material === "solid" && scheme === "dark" ? <LitEdge radius={PANEL_RADIUS} /> : null}
            </View>
          </Animated.View>
        </View>
      </Modal>
    );
  }
);

export const Popover = Object.assign(PopoverRoot, {
  Trigger: PopoverTrigger,
  Content: PopoverContent,
});

PopoverRoot.displayName = "Popover";
PopoverTrigger.displayName = "PopoverTrigger";
PopoverContent.displayName = "PopoverContent";
