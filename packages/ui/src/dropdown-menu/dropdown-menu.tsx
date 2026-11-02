import * as React from "react";
import { createContext, forwardRef, useContext } from "react";
import { Modal, Platform, Pressable, View, Text, useWindowDimensions, type PressableProps, type ViewProps, } from "react-native";
import Animated, { Easing, useSharedValue, useAnimatedStyle, useAnimatedProps, withDelay, withSpring, withTiming } from "react-native-reanimated";
import Svg from "react-native-svg";
import { cn, ease, rowDelay, spring, timing, useHaptic, usePressAnimation, useReducedMotion, useTheme, AnimatedPath, AnimatedPressable, } from "@lumioui/core";
import { Glass } from "../glass";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Anchor {
  x: number;
  y: number;
  width: number;
  height: number;
  /** The trigger lit up as it opened — the panel waits for that light. */
  lit?: boolean;
}

interface DropdownMenuCtx {
  open: boolean;
  setOpen: (open: boolean) => void;
  anchor: Anchor | null;
  setAnchor: (anchor: Anchor) => void;
  /** The check item being committed (drawing on, holding) — null otherwise. */
  picked: string | null;
  setPicked: (id: string | null) => void;
}
const Ctx = createContext<DropdownMenuCtx | null>(null);

function useDropdownMenu() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("DropdownMenu.* must be inside <DropdownMenu>");
  return ctx;
}

export interface DropdownMenuProps {
  /** Controlled open state. */
  open?: boolean;
  /** Uncontrolled initial state. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

/**
 * DropdownMenu — anchored menu that appears near its trigger.
 * Compose with DropdownMenu.Trigger / .Content / .Item.
 */
function DropdownMenuRoot({ open, defaultOpen = false, onOpenChange, children }: DropdownMenuProps) {
  const [internal, setInternal] = React.useState(defaultOpen);
  const [anchor, setAnchor] = React.useState<Anchor | null>(null);
  const [picked, setPicked] = React.useState<string | null>(null);
  const isControlled = open !== undefined;
  const value = isControlled ? open : internal;

  const setOpen = React.useCallback(
    (next: boolean) => {
      // A fresh open forgets the last commit — rows show `selected` again.
      if (next) setPicked(null);
      if (!isControlled) setInternal(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange]
  );

  return (
    <Ctx.Provider value={{ open: value, setOpen, anchor, setAnchor, picked, setPicked }}>
      {children}
    </Ctx.Provider>
  );
}

export interface DropdownMenuTriggerProps extends Omit<PressableProps, "children"> {
  children: React.ReactNode;
  className?: string;
  /** The touched thing leads: while the menu is open the trigger holds a
   *  soft pill-shaped wash, lit 60ms before the panel grows out of it.
   *  Default false — triggers with their own shaped surface keep theirs. */
  lit?: boolean;
}

/** Trigger wash while its menu is open — present, below notice. */
const TRIGGER_WASH = 0.06;

const DropdownMenuTrigger = forwardRef<React.ElementRef<typeof Pressable>, DropdownMenuTriggerProps>(
  function DropdownMenuTrigger({ children, className, onPress, onPressIn, onPressOut, lit = false, ...props }, ref) {
    const { setOpen, setAnchor, open } = useDropdownMenu();
    const haptics = useHaptic();
    const press = usePressAnimation();
    const innerRef = React.useRef<React.ComponentRef<typeof View>>(null);
    // Light before motion: the wash ignites with the press that opens the
    // menu and dims as the panel leaves.
    const wash = useSharedValue(lit && open ? 1 : 0);
    React.useEffect(() => {
      if (!lit) return;
      wash.value = open ? withTiming(1, IGNITE) : withTiming(0, DIM);
    }, [lit, open, wash]);
    const washStyle = useAnimatedStyle(() => ({ opacity: wash.value * TRIGGER_WASH }));

    const handlePress: PressableProps["onPress"] = (e) => {
      const next = !open;
      // Haptic feedback only when the menu opens.
      if (next) haptics.light();
      // Web-only path: DOM measurement for the anchor. Guarded so native
      // never touches the DOM API.
      if (Platform.OS === "web") {
        const node = innerRef.current as unknown as
          | { getBoundingClientRect?: () => { left: number; top: number; width: number; height: number } }
          | null;
        if (node?.getBoundingClientRect) {
          const r = node.getBoundingClientRect();
          setAnchor({ x: r.left, y: r.top, width: r.width, height: r.height, lit });
          setOpen(next);
          onPress?.(e);
          return;
        }
      }
      innerRef.current?.measureInWindow((x, y, width, height) => {
        setAnchor({ x, y, width, height, lit });
      });
      setOpen(next);
      onPress?.(e);
    };

    return (
      <AnimatedPressable
        ref={(node) => {
          innerRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        style={press.animatedStyle}
        onPressIn={(e) => {
          press.onPressIn();
          onPressIn?.(e);
        }}
        onPressOut={(e) => {
          press.onPressOut();
          onPressOut?.(e);
        }}
        onPress={handlePress}
        className={className}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        // accessibilityState isn't forwarded to the DOM on web — mirror it.
        aria-expanded={open}
        aria-haspopup="menu"
        accessibilityHint="Opens a menu"
        {...props}
      >
        {lit ? (
          <Animated.View
            pointerEvents="none"
            style={[{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, borderRadius: 999 }, washStyle]}
            className="bg-foreground"
          />
        ) : null}
        {children}
      </AnimatedPressable>
    );
  }
);

export interface DropdownMenuContentProps extends ViewProps {
  className?: string;
  /** Horizontal alignment relative to the trigger. Default "start". */
  align?: "start" | "end";
  /** Extra vertical offset below the trigger. Default 6. */
  sideOffset?: number;
  /** Menu surface. "solid" (default) is an opaque popover surface; "glass"
   * opts into Lumio glass — only when the menu floats over photos/video. */
  material?: "solid" | "glass";
}

/** 220 fits a label + trailing check. */
const MENU_MIN_WIDTH = 220;

/** Overlay panel: grows from the trigger's corner 0.96→1 on spring.panel
 *  with a 6px drift away from it; exit dims in place to 0.97 on
 *  timing.recede — no retreat. */
const FROM_SCALE = 0.96;
const EXIT_SCALE = 0.97;
const DRIFT = 6;
const IGNITE = { duration: timing.fast.duration, easing: Easing.bezier(...ease.out) } as const;
const DIM = { duration: timing.recede.duration, easing: Easing.bezier(...ease.in) } as const;
/** Light before motion (§5c rule 1): a lit trigger brightens this long
 *  before the panel starts to grow out of it. */
const TRIGGER_LEAD_MS = 60;
/** Rows switch on top to bottom on the row rhythm (40ms apart, capped) —
 *  opacity + 0.98→1, no travel. */
const ROW_FROM_SCALE = 0.98;
/** A pick: the check draws on, then holds so the choice is seen before the
 *  menu dims (act → hold → resolve, at menu scale). */
const CHECK_DRAW = { duration: 240, easing: Easing.bezier(...ease.out) } as const;
const CHECK_HOLD_MS = 200;
/** Check path length on the 24 grid — dashed fully, then drawn on. */
const CHECK_LEN = 22;

/** One menu row igniting in place; replays each time the menu opens. */
function IgniteRow({ index, active, lead, children }: { index: number; active: boolean; lead: number; children: React.ReactNode }) {
  const reduceMotion = useReducedMotion();
  const lit = useSharedValue(reduceMotion ? 1 : 0);
  React.useEffect(() => {
    if (!active) return;
    if (reduceMotion) {
      lit.value = 1;
      return;
    }
    lit.value = 0;
    lit.value = withDelay(lead + rowDelay(index), withTiming(1, IGNITE));
  }, [active, index, lead, lit, reduceMotion]);
  const style = useAnimatedStyle(() => ({
    opacity: lit.value,
    transform: [{ scale: ROW_FROM_SCALE + (1 - ROW_FROM_SCALE) * lit.value }],
  }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

/** Floating-menu shadow — black in both schemes, soft, single source. */
const FLOAT_SHADOW = {
  shadowColor: "#000",
  shadowOpacity: 0.14,
  shadowRadius: 24,
  shadowOffset: { width: 0, height: 8 },
  elevation: 8,
} as const;

const DropdownMenuContent = forwardRef<React.ElementRef<typeof View>, DropdownMenuContentProps>(
  function DropdownMenuContent({ className, align = "start", sideOffset = 6, material = "solid", children, onLayout, ...props }, ref) {
    const { open, setOpen, anchor } = useDropdownMenu();
    const { width: winW, height: winH } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const haptics = useHaptic();
    const reduceMotion = useReducedMotion();
    const scale = useSharedValue(FROM_SCALE);
    const opacity = useSharedValue(0);
    // Small drift out of the trigger — pairs with the origin-anchored scale
    // so the panel reads as growing *from* the trigger, not in place.
    const drift = useSharedValue(-DRIFT);
    // Kept mounted through the dim so the menu leaves instead of blinking
    // away (deferred-unmount pattern).
    const [rendered, setRendered] = React.useState(false);
    // Measured menu height — needed to decide whether to flip above the
    // trigger when the menu would overflow the bottom edge.
    const [menuH, setMenuH] = React.useState(0);

    // Flip above the trigger when the menu would overflow the bottom edge.
    const flipped =
      !!anchor && menuH > 0 && anchor.y + anchor.height + sideOffset + menuH > winH - insets.bottom - 8;
    // Read by the open/close effect without re-triggering it: `flipped` can
    // change when the first layout lands, and re-running the entrance then
    // snapped the drift mid-entrance.
    const flippedRef = React.useRef(flipped);
    flippedRef.current = flipped;
    // The panel stays at opacity 0 until its first layout so the entrance
    // starts with the flip side + origin known — otherwise the first open
    // rendered below the trigger, then jumped above it mid-animation.
    const measured = menuH > 0;
    // Mirrors `rendered` for the close path — as an effect dep it re-ran the
    // entrance one frame after open (setRendered), restarting it.
    const renderedRef = React.useRef(rendered);
    renderedRef.current = rendered;
    // A lit trigger leads: the panel waits for its light.
    const lead = anchor?.lit ? TRIGGER_LEAD_MS : 0;

    React.useEffect(() => {
      const sign = flippedRef.current ? 1 : -1;
      if (open) {
        setRendered(true);
        if (!measured) return;
        // Reduced motion: skip the scale + drift, keep the ignite.
        if (reduceMotion) {
          scale.value = 1;
          drift.value = 0;
        } else {
          // Reset then settle so each open replays — spring.panel, no
          // overshoot.
          scale.value = FROM_SCALE;
          scale.value = withDelay(lead, withSpring(1, spring.panel));
          drift.value = sign * DRIFT;
          drift.value = withDelay(lead, withSpring(0, spring.panel));
        }
        opacity.value = withDelay(lead, withTiming(1, IGNITE));
        return;
      }
      if (!renderedRef.current) return;
      // Dim in place — no retreat toward the trigger.
      if (!reduceMotion) scale.value = withTiming(EXIT_SCALE, DIM);
      opacity.value = withTiming(0, DIM);
      const t = setTimeout(() => setRendered(false), DIM.duration);
      return () => clearTimeout(t);
    }, [open, measured, scale, opacity, drift, reduceMotion, lead]);

    const menuStyle = useAnimatedStyle(() => ({
      opacity: opacity.value,
      // Grow from the trigger's corner — align-aware origin, flipped when
      // the menu renders above the trigger.
      transformOrigin: `${align === "end" ? "100%" : "0%"} ${flipped ? "100%" : "0%"}`,
      transform: [{ scale: scale.value }, { translateY: drift.value }],
    }));

    // Backdrop tap and hardware back share the close haptic.
    const close = () => {
      haptics.selection();
      setOpen(false);
    };

    if (!anchor) return null;

    const items = React.Children.toArray(children).map((child, i) => (
      // toArray assigns each element a stable key (its own key if set,
      // else a positional one) — prefer it over the raw index.
      <IgniteRow
        key={React.isValidElement(child) && child.key != null ? child.key : i}
        index={i}
        lead={lead}
        // Not gated on `measured`: rows mount with the Modal, and the first
        // layout lands within a frame — gating would skip the first ignite.
        active={open}
      >
        {child}
      </IgniteRow>
    ));

    const belowTop = anchor.y + anchor.height + sideOffset;
    const top = flipped
      ? Math.max(insets.top + 8, anchor.y - menuH - sideOffset)
      : Math.max(insets.top + 8, Math.min(belowTop, winH - insets.bottom - 16));
    const rawLeft = align === "end" ? anchor.x + anchor.width - MENU_MIN_WIDTH : anchor.x;
    const left = Math.max(8 + insets.left, Math.min(rawLeft, winW - MENU_MIN_WIDTH - 8 - insets.right));

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
            accessibilityLabel="Close menu" accessibilityRole="button"
          />
          <Animated.View
            ref={ref}
            style={[
              { position: "absolute", top, left, minWidth: MENU_MIN_WIDTH, maxWidth: winW - 16 },
              material === "solid" ? FLOAT_SHADOW : null,
              menuStyle,
            ]}
            onLayout={(e) => {
              const h = e.nativeEvent.layout.height;
              if (h > 0 && h !== menuH) setMenuH(h);
              onLayout?.(e);
            }}
            className={cn("py-0", className)}
            accessibilityViewIsModal
            accessibilityRole="menu"
            {...props}
          >
            {material === "glass" ? (
              <Glass effect="regular" className="overflow-hidden rounded-2xl py-2">
                {items}
              </Glass>
            ) : (
              // Opaque lifted surface, 16pt radius;
              // shadow on light, surface lightness on dark — one treatment.
              <View className="overflow-hidden rounded-2xl bg-popover py-2">{items}</View>
            )}
          </Animated.View>
        </View>
      </Modal>
    );
  }
);

export interface DropdownMenuItemProps extends Omit<PressableProps, "children"> {
  /** Item label. */
  children: React.ReactNode;
  /** Optional icon rendered before the label. */
  icon?: React.ReactNode;
  /** Optional trailing slot — a checkmark for the selected option, a
   * shortcut, or a value. */
  trailing?: React.ReactNode;
  /** Marks a single-select option as chosen (announced to screen readers). */
  selected?: boolean;
  /** Render in destructive style. */
  destructive?: boolean;
  /** Single-select row that carries its own drawn check: a pick draws the
   *  check on (240ms) and holds it 200ms before the menu dims and `onPress`
   *  fires, while the previous row's check dims. Default false. */
  check?: boolean;
  /** Extra classes for the row. */
  className?: string;
}

/** The row's check — draws on when it switches on, dims (never un-draws) when it leaves. */
function DrawnCheck({ on, fresh }: { on: boolean; fresh: boolean }) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const draw = useSharedValue(on ? 1 : 0);
  const lit = useSharedValue(on ? 1 : 0);
  React.useEffect(() => {
    if (!on) {
      lit.value = withTiming(0, DIM);
      return;
    }
    lit.value = withTiming(1, IGNITE);
    if (fresh && !reduceMotion) {
      draw.value = 0;
      draw.value = withTiming(1, CHECK_DRAW);
    } else draw.value = 1;
  }, [on, fresh, reduceMotion, draw, lit]);
  const pathProps = useAnimatedProps(() => ({ strokeDashoffset: CHECK_LEN * (1 - draw.value) }));
  const style = useAnimatedStyle(() => ({ opacity: lit.value }));
  return (
    <Animated.View style={style} pointerEvents="none">
      <Svg width={18} height={18} viewBox="0 0 24 24">
        <AnimatedPath
          d="M5 12.5l4.5 4.5L19 7.5"
          stroke={colors.primaryText}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          strokeDasharray={CHECK_LEN}
          animatedProps={pathProps}
        />
      </Svg>
    </Animated.View>
  );
}

const DropdownMenuItem = forwardRef<React.ElementRef<typeof Pressable>, DropdownMenuItemProps>(
  function DropdownMenuItem({ children, icon, trailing, selected, destructive, check = false, className, onPress, onPressIn, onPressOut, disabled, ...props }, ref) {
    const { setOpen, picked, setPicked } = useDropdownMenu();
    const id = React.useId();
    // During a commit the picked row owns the check; otherwise `selected` does.
    const checked = picked ? picked === id : !!selected;
    const hold = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    // The commit still lands if the menu is dismissed mid-hold.
    const commit = React.useRef<(() => void) | null>(null);
    React.useEffect(
      () => () => {
        if (hold.current) clearTimeout(hold.current);
        commit.current?.();
        commit.current = null;
      },
      []
    );
    const haptics = useHaptic();
    // Full-width menu rows dip shallowly — 0.98 reads as a press without
    // the whole row visibly shrinking.
    const press = usePressAnimation({ pressedScale: 0.98, disabled: !!disabled });
    // Faint dark ink overlay that fades in on press-in, out on press-out.
    const ink = useSharedValue(0);
    const inkStyle = useAnimatedStyle(() => ({ opacity: ink.value * 0.1 }));

    return (
      <AnimatedPressable
        ref={ref}
        disabled={disabled}
        style={press.animatedStyle}
        onPressIn={(e) => {
          press.onPressIn();
          ink.value = withTiming(1, timing.instant);
          onPressIn?.(e);
        }}
        onPressOut={(e) => {
          press.onPressOut();
          ink.value = withTiming(0, timing.normal);
          onPressOut?.(e);
        }}
        onPress={(e) => {
          // One commit at a time — a held row has already decided.
          if (picked) return;
          // Destructive picks land a warning buzz; ordinary items tick.
          if (destructive) haptics.warning();
          else haptics.selection();
          if (check) {
            // Act → hold → resolve: the check draws on and holds, then the
            // menu dims and the caller swaps its label in place.
            setPicked(id);
            commit.current = () => onPress?.(e);
            hold.current = setTimeout(() => {
              hold.current = null;
              setOpen(false);
              commit.current?.();
              commit.current = null;
            }, CHECK_DRAW.duration + CHECK_HOLD_MS);
            return;
          }
          setOpen(false);
          onPress?.(e);
        }}
        // 48pt rows, 16pt inset, 12pt icon gap.
        className={cn(
          "min-h-[48px] flex-row items-center gap-3 px-4",
          disabled && "opacity-40",
          className
        )}
        accessibilityRole="menuitem"
        accessibilityState={{ disabled: disabled ?? false, selected: check ? checked : (selected ?? undefined) }}
        // accessibilityState isn't forwarded to the DOM on web — mirror it.
        aria-disabled={disabled ?? false}
        {...props}
      >
        {/* Ink overlay — held state */}
        <Animated.View
          pointerEvents="none"
          style={[
            { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
            inkStyle,
          ]}
          className="bg-foreground"
        />
        {icon}
        {typeof children === "string" ? (
          <Text
            numberOfLines={1}
            className={cn("flex-1 text-[15px]", destructive ? "text-destructive" : "text-popover-foreground")}
          >
            {children}
          </Text>
        ) : (
          children
        )}
        {trailing}
        {check ? <DrawnCheck on={checked} fresh={picked === id} /> : null}
      </AnimatedPressable>
    );
  }
);

export interface DropdownMenuSeparatorProps extends ViewProps {
  className?: string;
}

const DropdownMenuSeparator = forwardRef<React.ElementRef<typeof View>, DropdownMenuSeparatorProps>(
  function DropdownMenuSeparator({ className, ...props }, ref) {
    return (
      <View
        ref={ref}
        className={cn("my-2 h-px bg-border", className)}
        // `role` carries the full ARIA union — accessibilityRole's legacy
        // union has no "separator".
        role="separator"
        {...props}
      />
    );
  }
);

export const DropdownMenu = Object.assign(DropdownMenuRoot, {
  Trigger: DropdownMenuTrigger,
  Content: DropdownMenuContent,
  Item: DropdownMenuItem,
  Separator: DropdownMenuSeparator,
});

DropdownMenuRoot.displayName = "DropdownMenu";
DropdownMenuTrigger.displayName = "DropdownMenuTrigger";
DropdownMenuContent.displayName = "DropdownMenuContent";
DropdownMenuItem.displayName = "DropdownMenuItem";
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";
