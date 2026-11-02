import * as React from "react";
import { createContext, forwardRef, useContext } from "react";
import { Modal, Pressable, View, Text, type ViewProps, type TextProps } from "react-native";
import Animated, { Easing, useSharedValue, useAnimatedStyle, withDelay, withSpring, withTiming } from "react-native-reanimated";
import { BAND_STAGGER, cn, ease, spring, timing, useHaptic, useReducedMotion, SwitchOn } from "@lumioui/core";
import { Glass } from "../glass";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Lumio dialog — light before motion. The backdrop dims first; 80ms later
 * the panel rises 12px into place while scaling 0.96→1 on spring.panel and
 * igniting over timing.fast, arriving as a surface. Its content switches on
 * 120ms behind it, one band at a time (title → description → actions, 120ms
 * apart). Leaving, the panel dims in place (to 0.97, no retreat) on
 * timing.recede and the backdrop clears 60ms after it — the light restores
 * last. Reduced motion keeps only the opacity.
 */
const RISE = 12;
const FROM_SCALE = 0.96;
const EXIT_SCALE = 0.97;
/** Surface corner radius — the large end of Lumio's radius scale. */
const PANEL_RADIUS = 28;
const IGNITE = { duration: timing.fast.duration, easing: Easing.bezier(...ease.out) } as const;
const DIM = { duration: timing.recede.duration, easing: Easing.bezier(...ease.in) } as const;
const SCRIM_IN = { duration: timing.normal.duration, easing: Easing.bezier(...ease.out) } as const;
/** The backdrop dims this long before the panel moves (light before motion). */
const SCRIM_LEAD = timing.instant.duration;
/** The scrim clears this long after the panel starts dimming (light restores last). */
const SCRIM_TRAIL = timing.recede.duration / 2;
/** Content switches on one band behind the arriving surface (container, then content). */
const CONTENT_LAG = SCRIM_LEAD + BAND_STAGGER;
/** How long the root keeps the tree mounted after close — panel dim + scrim trail. */
const EXIT_MS = DIM.duration + SCRIM_TRAIL;

/** Band index handed to a DialogHeader so its title and description switch on as separate bands. */
const BandCtx = createContext<number | null>(null);
const bandDelay = (band: number) => CONTENT_LAG + band * BAND_STAGGER;

interface DialogCtx {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** User-initiated close — fires the close haptic, then resolves state. */
  dismiss: () => void;
}
const Ctx = createContext<DialogCtx | null>(null);

export interface DialogProps {
  /** Controlled open state. Omit for uncontrolled usage with defaultOpen. */
  open?: boolean;
  /** Uncontrolled initial open state. Default false. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

/**
 * Dialog — modal whose backdrop dims first, then the panel arrives and its content switches on.
 * Focus is contained by RN's Modal; VoiceOver/TalkBack announce the content.
 */
export function Dialog({ open, defaultOpen = false, onOpenChange, children }: DialogProps) {
  const haptics = useHaptic();
  const [internal, setInternal] = React.useState(defaultOpen);
  const isControlled = open !== undefined;
  const value = isControlled ? open : internal;
  const firstRender = React.useRef(true);
  // Held mounted through the 120ms dim so DialogContent's exit animation is
  // actually visible — `visible={value}` would drop the Modal instantly.
  const [rendered, setRendered] = React.useState(value);

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (!isControlled) setInternal(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange]
  );

  // User-initiated dismiss paths (backdrop press, hardware back,
  // DialogClose) route through here so the close haptic is intentional —
  // programmatic onOpenChange(false) stays silent.
  const dismiss = React.useCallback(() => {
    haptics.selection();
    setOpen(false);
  }, [haptics, setOpen]);

  React.useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    // Open haptic only — close haptics live on user-initiated dismiss paths,
    // not a passive effect that fires on every value flip.
    if (value) haptics.light();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  React.useEffect(() => {
    if (value) {
      setRendered(true);
      return;
    }
    if (!rendered) return;
    // Unmount lands once the panel has dimmed out.
    const t = setTimeout(() => setRendered(false), EXIT_MS);
    return () => clearTimeout(t);
  }, [value, rendered]);

  return (
    <Ctx.Provider value={{ open: value, onOpenChange: setOpen, dismiss }}>
      <Modal
        visible={rendered}
        transparent
        animationType="none"
        onRequestClose={dismiss}
        statusBarTranslucent
      >
        {/* Children stay mounted through the exit recede, then unmount —
            re-opening remounts fresh so the entrance spring replays. */}
        {rendered ? children : null}
      </Modal>
    </Ctx.Provider>
  );
}

function useDialog() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("Dialog.* must be inside <Dialog>");
  return ctx;
}

export interface DialogContentProps extends ViewProps {
  className?: string;
  /** Surface material. "solid" (default) is the opaque popover surface,
   *  legible in light and dark over any screen. "glass" opts into liquid
   *  glass; use it only when the dialog floats over photos or video. */
  material?: "solid" | "glass";
}

export const DialogContent = forwardRef<React.ElementRef<typeof View>, DialogContentProps>(
  function DialogContent({ className, material = "solid", children, onLayout, ...props }, ref) {
  const { open, dismiss } = useDialog();
  const reduceMotion = useReducedMotion();
  const insets = useSafeAreaInsets();
  const opacity = useSharedValue(0);
  const rise = useSharedValue(reduceMotion ? 0 : RISE);
  const scale = useSharedValue(reduceMotion ? 1 : FROM_SCALE);
  const scrim = useSharedValue(0);

  React.useEffect(() => {
    // Children only mount while rendered, so this fires on mount — the
    // close branch matters because the root holds the tree through the
    // exit window.
    if (open) {
      // Light first: the scrim dims, then the panel travels.
      scrim.value = withTiming(1, SCRIM_IN);
      opacity.value = withDelay(SCRIM_LEAD, withTiming(1, IGNITE));
      if (reduceMotion) {
        rise.value = 0;
        scale.value = 1;
      } else {
        rise.value = withDelay(SCRIM_LEAD, withSpring(0, spring.panel));
        scale.value = withDelay(SCRIM_LEAD, withSpring(1, spring.panel));
      }
    } else {
      // Dim in place — no retreat; the scrim clears after the panel.
      opacity.value = withTiming(0, DIM);
      scrim.value = withDelay(SCRIM_TRAIL, withTiming(0, DIM));
      if (!reduceMotion) scale.value = withTiming(EXIT_SCALE, DIM);
    }
  }, [open, opacity, rise, scale, scrim, reduceMotion]);

  const panelStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: rise.value }, { scale: scale.value }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: scrim.value }));
  // Content switches on in bands. A DialogHeader spends one band per child
  // (title, then description); any other child is one band.
  let band = 0;
  const staggered = React.Children.toArray(children).map((child, index) => {
    if (React.isValidElement<{ children?: React.ReactNode }>(child) && child.type === DialogHeader) {
      const base = band;
      band += Math.max(1, React.Children.count(child.props.children));
      return (
        <BandCtx.Provider key={index} value={base}>
          {child}
        </BandCtx.Provider>
      );
    }
    const delay = bandDelay(band);
    band += 1;
    return (
      <SwitchOn key={index} delay={delay}>
        {child}
      </SwitchOn>
    );
  });

  return (
    // Single overlay layer (was triple-stacked → near-black backdrop).
    <View
      ref={ref}
      className="flex-1 items-center justify-center p-5"
      style={{ width: "100%", height: "100%", paddingTop: Math.max(20, insets.top + 8), paddingBottom: Math.max(20, insets.bottom + 8) }}
    >
      <Animated.View className="bg-overlay" style={[{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }, backdropStyle]}>
        <Pressable
          style={{ width: "100%", height: "100%" }}
          onPress={dismiss}
          accessibilityLabel="Close dialog"
          accessibilityRole="button"
        />
      </Animated.View>
      <Animated.View
          style={[
            {
              // Native elevation — shadow-lg is web-only and did nothing on
              // device. Shadow is black, not foreground: a foreground shadow
              // glows white under the dark theme.
              shadowColor: "#000",
              shadowOpacity: 0.18,
              shadowRadius: 32,
              shadowOffset: { width: 0, height: 12 },
              elevation: 12,
            },
            panelStyle,
          ]}
        onLayout={onLayout}
        // max-w-[340px] fits a 350px phone column; max-w-sm (384px) overflowed.
        className={cn("w-full max-w-[340px]", className)}
        accessibilityViewIsModal
        // RN's accessibilityRole enum has no "dialog" — `role` carries the
        // ARIA dialog semantics (web + supported native mappings), and
        // aria-modal marks it as the modal surface. "alert" was too narrow:
        // a generic dialog isn't necessarily an alert.
        role="dialog"
        aria-modal
        {...props}
      >
        {/* 28pt radius + 24pt padding. Depth is the surface itself (popover
            on the dim backdrop): no border, no glow. */}
        <View style={{ overflow: "hidden", borderRadius: PANEL_RADIUS }}>
          {material === "glass" ? (
            <Glass effect="regular" className="rounded-[28px] p-6">
              {staggered}
            </Glass>
          ) : (
            <View className="rounded-[28px] bg-popover p-6">{staggered}</View>
          )}
        </View>
      </Animated.View>
    </View>
  );
}
);

export const DialogHeader = forwardRef<React.ElementRef<typeof View>, ViewProps & { className?: string }>(
  function DialogHeader({ className, children, ...props }, ref) {
  const base = useContext(BandCtx);
  return (
    <View ref={ref} className={cn("gap-2", className)} {...props}>
      {base === null
        ? children
        : React.Children.toArray(children).map((child, i) => (
            <SwitchOn key={i} delay={bandDelay(base + i)}>
              {child}
            </SwitchOn>
          ))}
    </View>
  );
}
);

export const DialogTitle = forwardRef<React.ElementRef<typeof Text>, TextProps & { className?: string }>(
  function DialogTitle({ className, ...props }, ref) {
  return (
    <Text
      ref={ref}
      className={cn("text-[22px] font-semibold leading-tight tracking-tight text-popover-foreground", className)}
      accessibilityRole="header"
      {...props}
    />
  );
}
);

export const DialogDescription = forwardRef<React.ElementRef<typeof Text>, TextProps & { className?: string }>(
  function DialogDescription({ className, ...props }, ref) {
  return <Text ref={ref} className={cn("text-[15px] leading-snug text-muted-foreground", className)} {...props} />;
}
);

export const DialogFooter = forwardRef<React.ElementRef<typeof View>, ViewProps & { className?: string }>(
  function DialogFooter({ className, ...props }, ref) {
  return <View ref={ref} className={cn("mt-6 flex-row flex-wrap justify-end gap-2", className)} {...props} />;
}
);

interface DialogCloseChildProps {
  onPress?: () => void;
  className?: string;
  ref?: React.Ref<React.ComponentRef<typeof View>>;
}

export interface DialogCloseProps {
  children: React.ReactElement<DialogCloseChildProps>;
  className?: string;
}

export const DialogClose = forwardRef<React.ComponentRef<typeof View>, DialogCloseProps>(
  function DialogClose({ children, className }, ref) {
    const { dismiss } = useDialog();
    return React.cloneElement(children, {
      // Chain: run the child's own action first, then dismiss (with haptic).
      onPress: () => {
        children.props.onPress?.();
        dismiss();
      },
      className: cn(children.props.className, className),
      ref: ref ?? children.props.ref,
    });
  }
);
DialogClose.displayName = "DialogClose";

Dialog.displayName = "Dialog";
DialogContent.displayName = "DialogContent";
DialogHeader.displayName = "DialogHeader";
DialogTitle.displayName = "DialogTitle";
DialogDescription.displayName = "DialogDescription";
DialogFooter.displayName = "DialogFooter";
