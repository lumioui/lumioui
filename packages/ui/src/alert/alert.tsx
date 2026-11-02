import * as React from "react";
import { forwardRef } from "react";
import { View, Text, Modal, Pressable, type ViewProps, type TextProps } from "react-native";
import Animated, {
  Easing,
  LinearTransition,
  useAnimatedProps,
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Path } from "react-native-svg";
import {
  BAND_STAGGER,
  cn,
  createVariant,
  ease,
  spring,
  timing,
  useReducedMotion,
  useHaptic,
  usePressAnimation,
  useTheme,
  AnimatedPath,
  AnimatedPressable,
  Sheen,
} from "@lumioui/core";
import { Glass } from "../glass";
import { iconMap } from "../icon/icon";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const alertVariants = createVariant({
  base: "w-full overflow-hidden rounded-2xl border p-5",
  variants: {
    variant: {
      default: "border-border bg-card",
      destructive: "border-destructive/30 bg-card",
      success: "border-success/30 bg-card",
      warning: "border-warning/30 bg-card",
    },
  },
  defaultVariants: { variant: "default" },
});

/** Edge colour per variant — the layer that dims out when the status changes. */
const EDGE: Record<AlertVariant, string> = {
  default: "border-border",
  destructive: "border-destructive/30",
  success: "border-success/30",
  warning: "border-warning/30",
};

type AlertVariant = "default" | "destructive" | "success" | "warning";

export interface AlertProps extends ViewProps {
  variant?: AlertVariant;
  /** Grow or fold in place on spring.layout when the content changes
   *  (e.g. a resolved alert collapsing to one line). Default false. */
  animateLayout?: boolean;
  className?: string;
}

const AlertContext = React.createContext<AlertVariant>("default");

/** Content changes inside an alert grow or fold it on the layout spring. */
const foldInPlace = LinearTransition.springify()
  .stiffness(spring.layout.stiffness)
  .damping(spring.layout.damping)
  .mass(spring.layout.mass);

/** Exit beats for the modal: content dims, the panel follows half a dim
 *  later, the backdrop clears last; the Modal unmounts after the room. */
const PANEL_EXIT_DELAY = timing.recede.duration / 2;
const ROOM_EXIT_DELAY = timing.recede.duration;
const ALERT_EXIT_MS = ROOM_EXIT_DELAY + timing.recede.duration + 20;
/** Light before motion: the room dims this long before the panel rises. */
const LIGHT_LEAD = timing.instant.duration;
/** Panel rise on entry (pt) — a dialog rises toward the eye. */
const PANEL_RISE = 12;
/** Modal alert panel metrics: 270pt wide, 14pt corner radius.
 *  Kept as consts so the values aren't anonymous magic numbers. */
const MODAL_ALERT_WIDTH = 270;
const MODAL_ALERT_RADIUS = 14;

/** The previous status edge, dimming out over the new one — a retint. */
function EdgeFade({ variant }: { variant: AlertVariant }) {
  const o = useSharedValue(1);
  React.useEffect(() => {
    o.value = withTiming(0, { ...timing.normal, easing: Easing.bezier(...ease.inOut) });
  }, [o]);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: "absolute", top: -1, left: -1, right: -1, bottom: -1 }, style]}
      className={cn("rounded-2xl border", EDGE[variant])}
    />
  );
}

/**
 * Alert — inline status card. When `variant` changes the same card resolves:
 * the 1px status edge retints over timing.normal while one sheen of the new
 * status colour crosses it, and `Alert.Glyph` morphs in place. Copy swaps
 * are the caller's; pass `animateLayout` to let the card fold or grow.
 */
const AlertRoot = forwardRef<React.ElementRef<typeof View>, AlertProps>(
  function Alert({ variant = "default", animateLayout = false, className, children, ...props }, ref) {
    const { colors } = useTheme();
    const reduce = useReducedMotion();
    // Track status changes during render: the last variant shown, the one
    // it changed from, and a counter that fires one sheen per change.
    const [shown, setShown] = React.useState(variant);
    const [from, setFrom] = React.useState<AlertVariant | null>(null);
    const [run, setRun] = React.useState(0);
    if (shown !== variant) {
      setFrom(shown);
      setShown(variant);
      setRun((n) => n + 1);
    }
    const light =
      variant === "success"
        ? colors.success
        : variant === "warning"
          ? colors.warning
          : variant === "destructive"
            ? colors.destructive
            : colors.primary;
    return (
      <AlertContext.Provider value={variant}>
        <Animated.View
          ref={ref as React.Ref<React.ElementRef<typeof Animated.View>>}
          layout={animateLayout && !reduce ? foldInPlace : undefined}
          className={cn(alertVariants({ variant }), className)}
          accessibilityRole="alert"
          {...props}
        >
          {children}
          {from && run ? <EdgeFade key={run} variant={from} /> : null}
          <Sheen run={run} color={light} strength={0.22} />
        </Animated.View>
      </AlertContext.Provider>
    );
  }
);

/** Glyph per status. Success is drawn by hand so its check can draw on. */
const GLYPH: Record<Exclude<AlertVariant, "success">, { name: "alert-triangle" | "info"; color: "warning" | "destructive" | "mutedForeground" }> = {
  warning: { name: "alert-triangle", color: "warning" },
  destructive: { name: "alert-triangle", color: "destructive" },
  default: { name: "info", color: "mutedForeground" },
};
/** Non-success status glyph at an exact size. */
function StatusIcon({ variant, size }: { variant: Exclude<AlertVariant, "success">; size: number }) {
  const { colors } = useTheme();
  const G = iconMap[GLYPH[variant].name];
  return <G size={size} color={colors[GLYPH[variant].color]} />;
}
/** Check stroke length in the 24pt grid (two legs of the mark). */
const CHECK_LEN = 12;
/** The check draws over this long once the ring has opened (§5b). */
const CHECK_DRAW_MS = 240;
/** The outgoing glyph shrinks to a dot of this scale before the new one opens. */
const DOT_SCALE = 0.25;

export interface AlertGlyphProps {
  /** Override the status; defaults to the enclosing Alert's variant. */
  variant?: AlertVariant;
  /** Glyph size in pt. Default 22. */
  size?: number;
  className?: string;
}

/** One glyph layer: either the resting glyph or the incoming one opening. */
function GlyphFace({ variant, size, enter }: { variant: AlertVariant; size: number; enter: boolean }) {
  const reduce = useReducedMotion();
  const { colors } = useTheme();
  const o = useSharedValue(enter ? 0 : 1);
  const s = useSharedValue(enter && !reduce ? DOT_SCALE : 1);
  const draw = useSharedValue(enter && !reduce ? 0 : 1);
  React.useEffect(() => {
    if (!enter) return;
    // Opens after the outgoing glyph has shrunk to its dot.
    const after = timing.recede.duration;
    o.value = withDelay(after, withTiming(1, { ...timing.fast, easing: Easing.bezier(...ease.out) }));
    if (reduce) return;
    s.value = withDelay(after, withSpring(1, spring.swap));
    draw.value = withDelay(after + timing.instant.duration, withTiming(1, { duration: CHECK_DRAW_MS, easing: Easing.bezier(...ease.out) }));
  }, [enter, reduce, o, s, draw]);
  const style = useAnimatedStyle(() => ({ opacity: o.value, transform: [{ scale: s.value }] }));
  const checkProps = useAnimatedProps(() => ({ strokeDashoffset: CHECK_LEN * (1 - draw.value) }));
  return (
    <Animated.View style={[{ position: "absolute", width: size, height: size }, style]}>
      {variant === "success" ? (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx={12} cy={12} r={8.5} stroke={colors.success} strokeWidth={2} />
          <AnimatedPath
            d="M8.4 12.5L11.3 15.4L16.1 9.6"
            stroke={colors.success}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={`${CHECK_LEN} ${CHECK_LEN}`}
            animatedProps={checkProps}
          />
        </Svg>
      ) : (
        <StatusIcon variant={variant} size={size} />
      )}
    </Animated.View>
  );
}

/** The outgoing glyph — shrinks to a dot and dims (it never un-draws). */
function GlyphLeave({ variant, size }: { variant: AlertVariant; size: number }) {
  const reduce = useReducedMotion();
  const { colors } = useTheme();
  const o = useSharedValue(1);
  const s = useSharedValue(1);
  React.useEffect(() => {
    const dim = { ...timing.recede, easing: Easing.bezier(...ease.in) };
    o.value = withTiming(0, dim);
    if (!reduce) s.value = withTiming(DOT_SCALE, dim);
  }, [reduce, o, s]);
  const style = useAnimatedStyle(() => ({ opacity: o.value, transform: [{ scale: s.value }] }));
  return (
    <Animated.View style={[{ position: "absolute", width: size, height: size }, style]}>
      {variant === "success" ? (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx={12} cy={12} r={8.5} stroke={colors.success} strokeWidth={2} />
          <Path d="M8.4 12.5L11.3 15.4L16.1 9.6" stroke={colors.success} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      ) : (
        <StatusIcon variant={variant} size={size} />
      )}
    </Animated.View>
  );
}

/**
 * Alert.Glyph — the status mark, performing the change in place: the old
 * glyph shrinks to a dot and dims, then the new one opens out of that dot;
 * a success check draws itself on over 240ms. Static until the status
 * changes. Hidden from screen readers (the alert's copy carries the state).
 */
function AlertGlyph({ variant: override, size = 22, className }: AlertGlyphProps) {
  const ctx = React.useContext(AlertContext);
  const variant = override ?? ctx;
  const [shown, setShown] = React.useState(variant);
  const [from, setFrom] = React.useState<AlertVariant | null>(null);
  const [run, setRun] = React.useState(0);
  if (shown !== variant) {
    setFrom(shown);
    setShown(variant);
    setRun((n) => n + 1);
  }
  return (
    <View
      className={cn("items-center justify-center", className)}
      style={{ width: size, height: size }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {from && run ? <GlyphLeave key={`out${run}`} variant={from} size={size} /> : null}
      <GlyphFace key={`in${run}`} variant={variant} size={size} enter={run > 0} />
    </View>
  );
}const AlertTitle = forwardRef<React.ElementRef<typeof Text>, TextProps & { className?: string }>(
  function AlertTitle({ className, ...props }, ref) {
    return (
      <Text
        ref={ref}
        className={cn("mb-1 text-base font-semibold text-foreground", className)}
        accessibilityRole="header"
        {...props}
      />
    );
  }
);

const AlertDescription = forwardRef<React.ElementRef<typeof Text>, TextProps & { className?: string }>(
  function AlertDescription({ className, ...props }, ref) {
    return (
      <Text ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
    );
  }
);

// --- Modal alert ---

export interface ModalAlertProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message?: string;
  buttons?: ModalAlertButton[];
  /** Haptic style when alert appears. Default "warning". */
  haptic?: "warning" | "error" | "success" | false;
  /** Frosted glass panel instead of the solid card. Use only when
   *  the screen behind is photographic / moving content. Default false. */
  glass?: boolean;
}

export interface ModalAlertButton {
  text: string;
  onPress?: () => void;
  /** Visual style. Default "default". */
  style?: "default" | "cancel" | "destructive";
}

/** Alert button row — own component so it can hold a usePressAnimation hook. */
function ModalAlertButtonRow({
  button,
  onSelect,
}: {
  button: ModalAlertButton;
  onSelect: (button: ModalAlertButton) => void;
}) {
  const press = usePressAnimation({ pressedScale: 0.98 });
  return (
    <AnimatedPressable
      onPress={() => onSelect(button)}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      style={press.animatedStyle}
      className="items-center py-3 active:bg-muted"
      accessibilityRole="button"
      accessibilityLabel={button.text}
    >
      <Text
        className={cn(
          "text-[17px]",
          button.style === "destructive" ? "text-destructive" : "text-primary-text",
          button.style === "cancel" && "font-semibold"
        )}
      >
        {button.text}
      </Text>
    </AnimatedPressable>
  );
}

/**
 * ModalAlert — a centered alert card with title, message and buttons
 * separated by hairlines (two side by side, otherwise stacked).
 * The cancel button is bold; destructive buttons are red. Light before
 * motion: the room dims first, the panel rises 12pt (0.96 → 1 on
 * spring.panel) 80ms later and its content switches on a band behind it.
 * Leaving dims content, then the panel, and the room clears last.
 */
export function ModalAlert({ open, onOpenChange, title, message, buttons = [], haptic = "warning", glass = false }: ModalAlertProps) {
  const reduceMotion = useReducedMotion();
  const insets = useSafeAreaInsets();
  const haptics = useHaptic();
  /** Panel arrival (0 → 1) and its light while leaving. */
  const rise = useSharedValue(0);
  const opacity = useSharedValue(0);
  /** Title, message and buttons switch on after the panel. */
  const content = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);
  // Held mounted through the exit — without this the Modal drops the
  // moment `open` flips false and the dim-out never renders.
  const [rendered, setRendered] = React.useState(open);

  React.useEffect(() => {
    const ignite = { ...timing.fast, easing: Easing.bezier(...ease.out) };
    const dim = { ...timing.recede, easing: Easing.bezier(...ease.in) };
    if (open) {
      setRendered(true);
      if (haptic) haptics[haptic]();
      // Light before motion: the room dims first, the panel rises after the
      // lead, and its content switches on a beat behind the panel.
      backdropOpacity.value = withTiming(1, timing.normal);
      opacity.value = withDelay(LIGHT_LEAD, withTiming(1, ignite));
      content.value = withDelay(LIGHT_LEAD + BAND_STAGGER, withTiming(1, ignite));
      if (reduceMotion) rise.value = 1;
      else {
        rise.value = 0;
        rise.value = withDelay(LIGHT_LEAD, withSpring(1, spring.panel));
      }
      return;
    }
    if (!rendered) return;
    // Dim in place: content first, then the panel (settling to 0.97, no
    // retreat), and the room clears last.
    content.value = withTiming(0, dim);
    opacity.value = withDelay(PANEL_EXIT_DELAY, withTiming(0, dim));
    backdropOpacity.value = withDelay(ROOM_EXIT_DELAY, withTiming(0, dim));
    const t = setTimeout(() => setRendered(false), ALERT_EXIT_MS);
    return () => clearTimeout(t);
  }, [open, rendered, reduceMotion, haptic, haptics, rise, opacity, content, backdropOpacity]);

  const contentStyle = useAnimatedStyle(() => {
    // Leaving: the panel settles toward 0.97 as it dims, never shrinking away.
    const leaving = rise.value >= 1 ? 1 - opacity.value : 0;
    const scale = reduceMotion ? 1 : (0.96 + 0.04 * Math.min(1, rise.value)) * (1 - 0.03 * leaving);
    return {
      opacity: opacity.value,
      transform: [{ translateY: reduceMotion ? 0 : (1 - rise.value) * PANEL_RISE }, { scale }],
    };
  });
  const innerStyle = useAnimatedStyle(() => ({ opacity: content.value }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));

  const handleButtonPress = (button: ModalAlertButton) => {
    // Destructive confirms land a warning buzz; ordinary dismissals answer
    // with a light tap (the appearance haptic already fired on open).
    if (button.style === "destructive") haptics.warning();
    else haptics.light();
    onOpenChange(false);
    button.onPress?.();
  };

  const handleBackdropClose = () => {
    haptics.light();
    onOpenChange(false);
  };

  return (
    <Modal visible={rendered} transparent animationType="none" onRequestClose={() => onOpenChange(false)} statusBarTranslucent>
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          // Centered modal must clear the notch/island and home indicator.
          paddingVertical: Math.max(40, insets.top + insets.bottom + 8),
          backgroundColor: "transparent",
        }}
      >
        <Animated.View
          style={[{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }, backdropStyle]}
          className="bg-overlay"
        >
          <Pressable style={{ width: "100%", height: "100%" }} onPress={handleBackdropClose} accessibilityLabel="Close alert" accessibilityRole="button" />
        </Animated.View>
        <Animated.View
          style={[{ width: MODAL_ALERT_WIDTH, borderRadius: MODAL_ALERT_RADIUS, overflow: "hidden" }, contentStyle]}
          accessibilityViewIsModal
          accessibilityRole="alert"
        >
          {(() => {
            const body = (
              <Animated.View style={innerStyle}>
                <View style={{ paddingTop: 20, paddingBottom: 18, paddingHorizontal: 16, alignItems: "center", gap: 4 }}>
                  <Text className="text-center text-[17px] font-semibold leading-tight text-card-foreground">
                    {title}
                  </Text>
                  {message ? (
                    <Text className="text-center text-[13px] leading-snug text-muted-foreground">
                      {message}
                    </Text>
                  ) : null}
                </View>
                {buttons.length > 0 && <View className="bg-border" style={{ height: 0.5 }} />}
                {/* Exactly two actions sit side by side; one or 3+ stack. */}
                {buttons.length === 2 ? (
                  <View className="flex-row">
                    <View className="flex-1">
                      <ModalAlertButtonRow button={buttons[0]!} onSelect={handleButtonPress} />
                    </View>
                    <View className="bg-border" style={{ width: 0.5 }} />
                    <View className="flex-1">
                      <ModalAlertButtonRow button={buttons[1]!} onSelect={handleButtonPress} />
                    </View>
                  </View>
                ) : (
                  buttons.map((button, i) => (
                    <React.Fragment key={i}>
                      {i > 0 && <View className="bg-border" style={{ height: 0.5 }} />}
                      <ModalAlertButtonRow button={button} onSelect={handleButtonPress} />
                    </React.Fragment>
                  ))
                )}
              </Animated.View>
            );
            // Solid card by default: the panel sits on a dimmed backdrop, and
            // a frost fallback there loses contrast in dark mode. `glass`
            // opts into the material when the app behind is photographic.
            return glass ? (
              <Glass effect="regular" className="w-full">{body}</Glass>
            ) : (
              <View className="w-full bg-card">{body}</View>
            );
          })()}
        </Animated.View>
      </View>
    </Modal>
  );
}

export const Alert = Object.assign(AlertRoot, {
  Title: AlertTitle,
  Description: AlertDescription,
  Glyph: AlertGlyph,
  Modal: ModalAlert,
});
Alert.displayName = "Alert";
AlertTitle.displayName = "AlertTitle";
AlertDescription.displayName = "AlertDescription";
ModalAlert.displayName = "ModalAlert";
AlertGlyph.displayName = "AlertGlyph";

/** @deprecated Use `ModalAlert` (or `Alert.Modal`). */
export const IOSAlert = ModalAlert;
/** @deprecated Use `ModalAlertProps`. */
export type IOSAlertProps = ModalAlertProps;
/** @deprecated Use `ModalAlertButton`. */
export type IOSAlertButton = ModalAlertButton;
