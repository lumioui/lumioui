import * as React from "react";
import { forwardRef, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Pressable, StyleSheet, View, type PressableProps, type ViewProps, type GestureResponderEvent, } from "react-native";
import Animated, {
  type SharedValue,
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { cn, useHaptic, useReducedMotion, usePressAnimation, spring, ease, timing, tempo, AnimatedPressable, } from "@lumioui/core";
import { Icon, type IconName } from "../icon";

/**
 * ActionSwap — multi-mode content-swap primitives.
 *
 *   ActionSwapButton — spring-pressed pill cycling items (prefix icon slot +
 *     active label swap), controlled or uncontrolled.
 *   ActionSwapText   — standalone label swap (roll / blur / cascade).
 *   ActionSwapIcon   — icon-slot swap.
 *   ActionSwap       — backward-compatible multi-state cycler built on the
 *     primitives above (accent colors, IconName icons).
 *
 * Every mode swaps in place: the outgoing layer dims (timing.recede, →0.96)
 * while the incoming one ignites (opacity on timing.fast ease.out, 0.96→1 on
 * spring.swap). Modes differ only in what rides on top of that:
 *   blur    — the plain in-place swap; nothing travels.
 *   roll    — adds a small upward lift (≤6px) for sequences with direction.
 *   cascade — the new label ignites letter by letter, left to right.
 *
 * Opt-in `light` gives cascade reading order: each letter of the incoming
 * label switches on in place, left → right, on one shared front — the label
 * is lit into place, not typed. No band of light is drawn across it.
 */

export type ActionSwapMode = "roll" | "blur" | "cascade";
/** Modes with a single-element variant set — cascade animates per letter. */
type CoreSwapMode = "roll" | "blur";

/** Legacy alias accepted on `animation` props — "fade" maps to "blur". */
type LegacySwapAnimation = ActionSwapMode | "fade";

/** Scale the outgoing layer dims to and the incoming layer ignites from. */
const SWAP_SCALE = 0.96;
/** Icons are ~16px — the same 4% would be invisible, so glyphs bloom wider. */
const ICON_SWAP_SCALE = 0.86;
/** Roll lift (px): incoming rises this far, outgoing leaves half as far. */
const ROLL_LIFT = 5;
/** Cascade letters rise this far as they ignite. */
const LETTER_LIFT = 3;

// Dim — exits lead with opacity and finish before the ignite does.
const SWAP_DIM = { duration: timing.recede.duration, easing: Easing.bezier(...ease.in) };
// Ignite — opacity of the arriving layer.
const SWAP_IGNITE = { duration: timing.fast.duration, easing: Easing.bezier(...ease.out) };

// One letter every tempo.flick / 8 (20ms): a 10-letter label fully lit in
// ~360ms, inside the ~400ms entrance budget.
const LETTER_STAGGER = tempo.flick / 8;
/** Window after which a finished outgoing layer unmounts — outlasts the 120ms dim. */
const EXIT_WINDOW = tempo.drift;

// Reading order — one steady front across the label (no visible band);
// each letter switches on in place as the front reaches it.
const READ_SWEEP = { duration: tempo.glow, easing: Easing.bezier(...ease.inOut) };
/** A letter goes dark → lit over this much of the front's travel (pt). */
const READ_SOFT = 12;

/** Map the deprecated `animation` alias to a mode. */
function resolveMode(mode: ActionSwapMode | undefined, animation: LegacySwapAnimation | undefined): ActionSwapMode {
  if (mode) return mode;
  if (animation === "fade") return "blur";
  return animation ?? "roll";
}

interface SwapLayer<T> {
  key: string;
  payload: T;
}

/**
 * Two-layer swap state shared by every primitive: the incoming payload
 * renders in flow (sizing the slot) while the outgoing payload lingers as
 * an absolute overlay for one dim, then unmounts. Drives the shared
 * dim / ignite / bloom values; cascade letters ignite themselves on mount
 * but the outgoing label still dims as one layer.
 *
 * Layers are resolved during render (not in a passive effect) so the
 * outgoing overlay mounts on the same commit the new payload appears —
 * the effect version left one frame where the old label blinked out.
 * Reduced motion keeps the swap as a plain opacity crossfade.
 */
function useSwapLayers<T>(key: string, payload: T, reduce: boolean) {
  const [layers, setLayers] = useState<{ display: SwapLayer<T>; outgoing: SwapLayer<T> | null; gen: number }>(
    () => ({ display: { key, payload }, outgoing: null, gen: 0 })
  );
  if (key !== layers.display.key) {
    setLayers({ display: { key, payload }, outgoing: layers.display, gen: layers.gen + 1 });
  } else if (payload !== layers.display.payload) {
    // Same slot, fresh payload — refresh silently, no choreography.
    setLayers({ ...layers, display: { key, payload } });
  }
  const { display, outgoing, gen } = layers;
  /** 0 → 1 as the outgoing layer dims. */
  const dimT = useSharedValue(1);
  /** 0 → 1 opacity of the incoming layer. */
  const igniteT = useSharedValue(1);
  /** 0 → 1 scale/lift settle of the incoming layer (spring.swap). */
  const bloomT = useSharedValue(1);

  useLayoutEffect(() => {
    if (gen === 0) return;
    dimT.value = 0;
    igniteT.value = 0;
    if (reduce) {
      dimT.value = withTiming(1, timing.recede);
      igniteT.value = withTiming(1, timing.fast);
      bloomT.value = 1;
      return;
    }
    bloomT.value = 0;
    dimT.value = withTiming(1, SWAP_DIM);
    igniteT.value = withTiming(1, SWAP_IGNITE);
    bloomT.value = withSpring(1, spring.swap);
  }, [gen, reduce, dimT, igniteT, bloomT]);

  // Drop the spent layer once its dim has run.
  useEffect(() => {
    if (!outgoing) return;
    const id = setTimeout(
      () => setLayers((l) => (l.gen === gen ? { ...l, outgoing: null } : l)),
      EXIT_WINDOW
    );
    return () => clearTimeout(id);
  }, [outgoing, gen]);

  return { display, outgoing, dimT, igniteT, bloomT };
}

// --- CascadeLetter — one glyph of a cascade swap ---

interface CascadeLetterProps {
  char: string;
  index: number;
  /** First paint renders lit — no intro replay on mount. */
  skipIntro: boolean;
  className?: string;
}

function CascadeLetter({ char, index, skipIntro, className }: CascadeLetterProps) {
  const lit = useSharedValue(skipIntro ? 1 : 0);
  const rise = useSharedValue(skipIntro ? 1 : 0);

  useEffect(() => {
    if (skipIntro) return;
    const delay = index * LETTER_STAGGER;
    lit.value = withDelay(delay, withTiming(1, SWAP_IGNITE));
    rise.value = withDelay(delay, withSpring(1, spring.swap));
  }, [index, skipIntro, lit, rise]);

  const style = useAnimatedStyle(() => ({
    opacity: lit.value,
    transform: [{ translateY: (1 - rise.value) * LETTER_LIFT }],
  }));

  return (
    <Animated.Text className={className} style={style}>
      {/* A lone " " Text collapses to zero width — nbsp keeps the slot. */}
      {char === " " ? "\u00A0" : char}
    </Animated.Text>
  );
}

// --- Lit cascade — the reading-light flavour of cascade ---

interface LitLetterProps {
  char: string;
  /** 0 → 1 pass of the reading light. */
  sweep: SharedValue<number>;
  /** Measured row width; 0 until laid out. */
  rowW: SharedValue<number>;
  className?: string;
}

/** One glyph that switches on when the band's front reaches its x. */
function LitLetter({ char, sweep, rowW, className }: LitLetterProps) {
  const x = useSharedValue(-1);
  const style = useAnimatedStyle(() => {
    if (sweep.value >= 1) return { opacity: 1, transform: [{ translateY: 0 }] };
    if (x.value < 0 || rowW.value <= 0) return { opacity: 0, transform: [{ translateY: LETTER_LIFT }] };
    const front = sweep.value * (rowW.value + READ_SOFT);
    const on = Math.min(1, Math.max(0, (front - x.value) / READ_SOFT));
    return { opacity: on, transform: [{ translateY: (1 - on) * LETTER_LIFT }] };
  });
  return (
    <Animated.Text
      className={className}
      style={style}
      onLayout={(e) => {
        x.value = e.nativeEvent.layout.x;
      }}
    >
      {char === " " ? "\u00A0" : char}
    </Animated.Text>
  );
}

interface LitCascadeRowProps {
  label: string;
  skipIntro: boolean;
  className?: string;
}

/**
 * The incoming label lit in reading order: every letter reads one shared
 * front on the UI thread and switches on in place. No band is drawn.
 */
function LitCascadeRow({ label, skipIntro, className }: LitCascadeRowProps) {
  const sweep = useSharedValue(skipIntro ? 1 : 0);
  const rowW = useSharedValue(0);
  useEffect(() => {
    if (skipIntro) return;
    sweep.value = withTiming(1, READ_SWEEP);
  }, [skipIntro, sweep]);
  return (
    <View
      style={styles.letterRow}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      onLayout={(e) => {
        rowW.value = e.nativeEvent.layout.width;
      }}
    >
      {label.split("").map((char, i) => (
        <LitLetter key={i} char={char} sweep={sweep} rowW={rowW} className={className} />
      ))}
    </View>
  );
}

// --- ActionSwapText — standalone animated text swap ---

export interface ActionSwapTextProps extends ViewProps {
  /** Slot identity — when this changes, the text animates. */
  value: string;
  children: ReactNode;
  /** Swap choreography. "cascade" needs a string child. Default "roll". */
  mode?: ActionSwapMode;
  /** @deprecated Use `mode`. "fade" maps to "blur". */
  animation?: LegacySwapAnimation;
  /** Cascade only: each letter of the incoming label switches on in place
   *  in reading order (over 390ms). No band is drawn. Default false. */
  light?: boolean;
  /** @deprecated No effect: no reading-light band is drawn any more. */
  lightColor?: string;
  /** @deprecated No effect: no reading-light band is drawn any more. */
  lightOnFill?: boolean;
  /** Applied to the root View AND the swapped text (text classes are
   *  inert on the View, layout classes are inert on the Text). */
  className?: string;
}

/**
 * Incoming / outgoing layer styles for one swap: dim + ignite, scaled
 * around `scale`, with an optional upward `lift`. Reduced motion: opacity only.
 */
function useSwapStyles(
  dimT: SharedValue<number>,
  igniteT: SharedValue<number>,
  bloomT: SharedValue<number>,
  scale: number,
  lift: number,
  reduce: boolean
) {
  const incomingStyle = useAnimatedStyle(() => ({
    opacity: igniteT.value,
    transform: reduce
      ? []
      : [
          { translateY: (1 - bloomT.value) * lift },
          { scale: scale + bloomT.value * (1 - scale) },
        ],
  }));
  const outgoingStyle = useAnimatedStyle(() => ({
    opacity: 1 - dimT.value,
    transform: reduce
      ? []
      : [
          // Dim to leave: the exit travels half as far as the entrance.
          { translateY: -dimT.value * lift * 0.5 },
          { scale: 1 - dimT.value * (1 - scale) },
        ],
  }));
  return { incomingStyle, outgoingStyle };
}

/**
 * ActionSwapText — animated text that swaps when `value` changes.
 * Cascade splits a string label into per-letter layers that ignite left to
 * right; non-string children and reduced motion fall back to the plain swap.
 */
export const ActionSwapText = forwardRef<React.ElementRef<typeof View>, ActionSwapTextProps>(
  function ActionSwapText(
    { value, children, mode, animation, light = false, lightColor: _lightColor, lightOnFill: _lightOnFill, className, ...props },
    ref
  ) {
    const reduce = useReducedMotion();
    const resolvedMode = resolveMode(mode, animation);
    const label = typeof children === "string" ? children : null;
    const cascadeActive = resolvedMode === "cascade" && label !== null && !reduce;
    const coreMode: CoreSwapMode = resolvedMode === "cascade" ? "roll" : resolvedMode;

    // Mode joins the slot key so switching choreography replays cleanly.
    const swapKey = `${cascadeActive ? "cascade" : coreMode}:${value}`;
    const { display, outgoing, dimT, igniteT, bloomT } = useSwapLayers(swapKey, children, reduce);
    const firstPaint = useRef(true);
    useEffect(() => {
      firstPaint.current = false;
    }, []);

    // Cascade's incoming layer is the letters themselves — its whole-layer
    // style only carries the outgoing dim.
    const lift = coreMode === "roll" && !cascadeActive ? ROLL_LIFT : 0;
    const { incomingStyle, outgoingStyle } = useSwapStyles(dimT, igniteT, bloomT, SWAP_SCALE, lift, reduce);

    // Text layers default to the foreground ink so a bare <ActionSwapText>
    // reads in both themes; caller text classes override via cn().
    const textClass = cn("text-foreground", className);
    const displayLabel = typeof display.payload === "string" ? display.payload : null;
    const outgoingLabel = outgoing && typeof outgoing.payload === "string" ? outgoing.payload : null;

    return (
      <View
        ref={ref}
        className={cn(className)}
        style={styles.clip}
        accessibilityRole="text"
        accessibilityLabel={displayLabel ?? undefined}
        {...props}
      >
        {cascadeActive && displayLabel !== null ? (
          <>
            {outgoingLabel !== null && outgoing ? (
              // The leaving label dims as one layer — only arrivals cascade.
              <Animated.Text
                key={`out-${outgoing.key}`}
                style={[styles.outgoing, outgoingStyle]}
                className={textClass}
                numberOfLines={1}
                ellipsizeMode="clip"
                pointerEvents="none"
                accessibilityElementsHidden
                importantForAccessibility="no"
              >
                {outgoingLabel}
              </Animated.Text>
            ) : null}
            {/* Letters are decorative fragments; the container label above
                is what screen readers announce. */}
            {light ? (
              <LitCascadeRow
                key={display.key}
                label={displayLabel}
                skipIntro={firstPaint.current}
                className={textClass}
              />
            ) : (
              <View
                key={display.key}
                style={styles.letterRow}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              >
                {displayLabel.split("").map((char, i) => (
                  <CascadeLetter
                    key={i}
                    char={char}
                    index={i}
                    skipIntro={firstPaint.current}
                    className={textClass}
                  />
                ))}
              </View>
            )}
          </>
        ) : (
          <>
            {outgoing ? (
              <Animated.Text
                key={outgoing.key}
                style={[styles.outgoing, outgoingStyle]}
                className={textClass}
                // One line, clipped: a longer leaving label must not wrap
                // into the new (narrower) slot mid-exit.
                numberOfLines={1}
                ellipsizeMode="clip"
                accessibilityElementsHidden
                importantForAccessibility="no"
              >
                {outgoing.payload}
              </Animated.Text>
            ) : null}
            <Animated.Text
              style={incomingStyle}
              className={textClass}
            >
              {display.payload}
            </Animated.Text>
          </>
        )}
      </View>
    );
  }
);

ActionSwapText.displayName = "ActionSwapText";

// --- ActionSwapIcon — icon slot swap ---

export interface ActionSwapIconProps extends ViewProps {
  /** Slot identity — when this changes, the icon animates. */
  value: string;
  children: ReactNode;
  /** Swap choreography ("cascade" falls back to roll — icons are single
   *  glyphs). Default "roll". */
  mode?: ActionSwapMode;
  /** @deprecated Use `mode`. */
  animation?: LegacySwapAnimation;
  className?: string;
}

/**
 * ActionSwapIcon — swaps its child when `value` changes: the old glyph
 * dims while the new one ignites in place (roll adds a small lift).
 */
export const ActionSwapIcon = forwardRef<React.ElementRef<typeof View>, ActionSwapIconProps>(
  function ActionSwapIcon({ value, children, mode, animation, className, ...props }, ref) {
    const reduce = useReducedMotion();
    const resolvedMode = resolveMode(mode, animation);
    const coreMode: CoreSwapMode = resolvedMode === "cascade" ? "roll" : resolvedMode;
    const swapKey = `${coreMode}:${value}`;
    const { display, outgoing, dimT, igniteT, bloomT } = useSwapLayers(swapKey, children, reduce);
    const { incomingStyle, outgoingStyle } = useSwapStyles(
      dimT,
      igniteT,
      bloomT,
      ICON_SWAP_SCALE,
      coreMode === "roll" ? ROLL_LIFT : 0,
      reduce
    );

    return (
      <View
        ref={ref}
        className={cn("items-center justify-center", className)}
        style={styles.clip}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        {...props}
      >
        {outgoing ? (
          <Animated.View key={outgoing.key} style={[styles.outgoingCenter, outgoingStyle]} pointerEvents="none">
            {outgoing.payload}
          </Animated.View>
        ) : null}
        <Animated.View style={incomingStyle}>{display.payload}</Animated.View>
      </View>
    );
  }
);

ActionSwapIcon.displayName = "ActionSwapIcon";

// --- ActionSwapButton — cycling button ---

export interface ActionSwapItem {
  id: string;
  label: ReactNode;
  icon?: ReactNode;
  /** Overrides the accessibility label derived from `label`. */
  ariaLabel?: string;
}

export type ActionSwapButtonVariant = "primary" | "secondary" | "outline" | "ghost";
export type ActionSwapButtonSize = "sm" | "md" | "lg" | "icon";

export interface ActionSwapButtonProps extends Omit<PressableProps, "children"> {
  items: ActionSwapItem[];
  /** Controlled active item id. */
  value?: string;
  /** Initial active item id (uncontrolled). Defaults to the first item. */
  defaultValue?: string;
  onValueChange?: (value: string, item: ActionSwapItem) => void;
  variant?: ActionSwapButtonVariant;
  size?: ActionSwapButtonSize;
  /** Swap choreography for icon + label slots. Default "roll". */
  mode?: ActionSwapMode;
  /** @deprecated Use `mode`. */
  animation?: LegacySwapAnimation;
  /** Cascade only: light the incoming label into place with a reading
   *  light (see ActionSwapText). Default false. */
  light?: boolean;
  /** Hide the label — icon slot only. Defaults to size === "icon". */
  iconOnly?: boolean;
  /** Advance to the next item on press. Default true. */
  cycle?: boolean;
  disabled?: boolean;
  className?: string;
}

const BUTTON_VARIANT_CLASS: Record<ActionSwapButtonVariant, string> = {
  primary: "bg-primary",
  secondary: "bg-secondary",
  outline: "border border-border bg-transparent",
  ghost: "bg-transparent",
};

const BUTTON_TEXT_CLASS: Record<ActionSwapButtonVariant, string> = {
  primary: "text-primary-foreground",
  secondary: "text-secondary-foreground",
  outline: "text-foreground",
  ghost: "text-muted-foreground",
};

const BUTTON_SIZE_CLASS: Record<ActionSwapButtonSize, string> = {
  // Heights match Button (sm 36 / md 44 / lg 52) so swap buttons sit flush
  // in a row of regular buttons.
  sm: "h-9 gap-1.5 rounded-full px-3.5",
  md: "h-11 gap-2 rounded-full px-4",
  lg: "h-[52px] gap-2 rounded-full px-6",
  icon: "h-11 w-11 rounded-full",
};

const BUTTON_LABEL_SIZE: Record<ActionSwapButtonSize, string> = {
  sm: "text-sm",
  md: "text-[15px]",
  lg: "text-[17px]",
  icon: "text-[15px]",
};

const BUTTON_ICON_SIZE: Record<ActionSwapButtonSize, string> = {
  sm: "h-4 w-4",
  md: "h-4 w-4",
  lg: "h-5 w-5",
  icon: "h-5 w-5",
};

/**
 * ActionSwapButton — spring-pressed pill that cycles `items` on press,
 * swapping the prefix icon slot and active label with the chosen mode.
 * Controlled via `value`/`onValueChange` or uncontrolled via `defaultValue`.
 */
export const ActionSwapButton = forwardRef<React.ElementRef<typeof Pressable>, ActionSwapButtonProps>(
  function ActionSwapButton(
    {
      items,
      value,
      defaultValue,
      onValueChange,
      variant = "secondary",
      size = "md",
      mode,
      animation,
      iconOnly = size === "icon",
      cycle = true,
      light = false,
      className,
      disabled,
      onPress,
      ...props
    },
    ref
  ) {
    const haptics = useHaptic();
    const press = usePressAnimation({ disabled });
    // Hooks live above the `!activeItem` early return below.
    const resolvedMode = resolveMode(mode, animation);
    const [internal, setInternal] = useState(defaultValue ?? items[0]?.id);
    const currentId = value ?? internal;
    const activeIndex = Math.max(0, items.findIndex((item) => item.id === currentId));
    const activeItem = items[activeIndex] ?? items[0];
    const hasIcon = items.some((item) => item.icon);
    const nextItem = cycle && items.length > 1 ? items[(activeIndex + 1) % items.length] : undefined;

    if (!activeItem) return null;

    const accessibleLabel =
      activeItem.ariaLabel ??
      (typeof activeItem.label === "string" ? activeItem.label : undefined);

    const handlePress = (e: GestureResponderEvent) => {
      onPress?.(e);
      if (disabled || !nextItem) return;
      haptics.selection();
      if (value === undefined) setInternal(nextItem.id);
      onValueChange?.(nextItem.id, nextItem);
    };
    const handlePressIn = () => {
      press.onPressIn();
    };
    const handlePressOut = () => {
      press.onPressOut();
    };

    return (
      <AnimatedPressable
        ref={ref}
        disabled={disabled}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={press.animatedStyle}
        className={cn(
          "flex-row items-center justify-center overflow-hidden",
          BUTTON_VARIANT_CLASS[variant],
          BUTTON_SIZE_CLASS[size],
          disabled && "opacity-50",
          className
        )}
        accessibilityRole="button"
        accessibilityLabel={accessibleLabel}
        accessibilityState={{ disabled }}
        hitSlop={6}
        {...props}
      >

        {hasIcon ? (
          <ActionSwapIcon
            value={activeItem.id}
            mode={resolvedMode}
            className={BUTTON_ICON_SIZE[size]}
          >
            {activeItem.icon ?? null}
          </ActionSwapIcon>
        ) : null}
        {!iconOnly ? (
          <ActionSwapText
            value={activeItem.id}
            mode={resolvedMode}
            light={light}
            lightOnFill={variant === "primary"}
            className={cn("font-medium", BUTTON_LABEL_SIZE[size], BUTTON_TEXT_CLASS[variant])}
          >
            {activeItem.label}
          </ActionSwapText>
        ) : null}
      </AnimatedPressable>
    );
  }
);

ActionSwapButton.displayName = "ActionSwapButton";

// --- ActionSwap — legacy multi-state cycler (backward compatible) ---

export interface ActionSwapState {
  label: string;
  icon?: IconName;
  /** Optional accent color token for this state. */
  accent?: "primary" | "destructive" | "success" | "warning";
}

export interface ActionSwapProps extends Omit<PressableProps, "children"> {
  /** States to cycle through. Must have at least 2. */
  states: ActionSwapState[];
  /** Controlled active index. */
  value?: number;
  /** Initial active index (uncontrolled). Default 0. */
  defaultValue?: number;
  onStateChange?: (index: number) => void;
  /** Visual style. Default "pill". */
  variant?: "pill" | "plain" | "outline";
  /** Swap choreography for icon + label. Default "roll". */
  mode?: ActionSwapMode;
  /** Cascade only: light the incoming label into place with a reading
   *  light (see ActionSwapText). Default false. */
  light?: boolean;
  /** Accessible label prefix. Default "Swap to". */
  accessibilityLabelPrefix?: string;
  disabled?: boolean;
  className?: string;
}

const accentClass: Record<NonNullable<ActionSwapState["accent"]>, string> = {
  primary: "bg-primary",
  destructive: "bg-destructive",
  success: "bg-success",
  warning: "bg-warning",
};

/** Foreground text class that pairs with each accent background. */
const accentTextClass: Record<NonNullable<ActionSwapState["accent"]>, string> = {
  primary: "text-primary-foreground",
  destructive: "text-destructive-foreground",
  success: "text-success-foreground",
  warning: "text-warning-foreground",
};

/** Foreground color token for the leading icon on each accent background. */
const accentIconColor: Record<
  NonNullable<ActionSwapState["accent"]>,
  "primaryForeground" | "destructiveForeground" | "successForeground" | "warningForeground"
> = {
  primary: "primaryForeground",
  destructive: "destructiveForeground",
  success: "successForeground",
  warning: "warningForeground",
};

const variantClass: Record<NonNullable<ActionSwapProps["variant"]>, string> = {
  pill: "rounded-full",
  plain: "rounded-lg",
  outline: "rounded-full border border-border",
};

/**
 * ActionSwap — multi-step button that cycles through states on press.
 * Composes ActionSwapIcon + ActionSwapText, so every `mode` works here too.
 */
export const ActionSwap = forwardRef<React.ElementRef<typeof Pressable>, ActionSwapProps>(
  function ActionSwap(
    {
      states,
      value,
      defaultValue = 0,
      onStateChange,
      variant = "pill",
      mode = "roll",
      accessibilityLabelPrefix = "Swap to",
      light = false,
      disabled,
      className,
      onPress,
      ...props
    },
    ref
  ) {
    const haptics = useHaptic();
    const press = usePressAnimation({ pressedScale: 0.94, disabled });
    const [internal, setInternal] = useState(defaultValue);
    const current = value ?? internal;

    const activeState = states[current] ?? states[0];
    const accent = activeState?.accent;

    const handlePress = (e: GestureResponderEvent) => {
      onPress?.(e);
      if (disabled || states.length < 2) return;
      haptics.selection();
      const next = (current + 1) % states.length;
      if (value === undefined) setInternal(next);
      onStateChange?.(next);
    };

    if (!activeState) return null;

    return (
      <AnimatedPressable
        ref={ref}
        disabled={disabled}
        onPress={handlePress}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        style={press.animatedStyle}
        className={cn(
          "h-11 flex-row items-center justify-center gap-2 px-5",
          variantClass[variant],
          // plain = bare label/icon, no fill — pill without a fill is
          // indistinguishable from the default treatment.
          variant === "plain" ? "bg-transparent" : accent ? accentClass[accent] : "bg-secondary",
          className
        )}
        accessibilityRole="button"
        accessibilityLabel={`${accessibilityLabelPrefix} ${activeState.label}`}
        accessibilityState={{ disabled }}
        hitSlop={6}
        {...props}
      >
        {activeState.icon ? (
          <ActionSwapIcon value={String(current)} mode={mode} className="h-4 w-4">
            <Icon
              name={activeState.icon}
              size="sm"
              color={accent ? accentIconColor[accent] : "foreground"}
            />
          </ActionSwapIcon>
        ) : null}
        <ActionSwapText
          value={String(current)}
          mode={mode}
          light={light}
          lightOnFill={variant !== "plain" && !!accent}
          className={cn(
            "text-base font-semibold leading-tight",
            accent ? accentTextClass[accent] : "text-foreground"
          )}
        >
          {activeState.label}
        </ActionSwapText>
      </AnimatedPressable>
    );
  }
);

ActionSwap.displayName = "ActionSwap";

const styles = StyleSheet.create({
  /** Vertical clip only matters — layers never overflow horizontally. */
  clip: { position: "relative", overflow: "hidden" },
  letterRow: { flexDirection: "row" },
  outgoing: { position: "absolute" },
  outgoingCenter: {
    position: "absolute", top: 0, right: 0, bottom: 0, left: 0,
    alignItems: "center",
    justifyContent: "center",
  },
});
