import * as React from "react";
import { forwardRef, useMemo, useState } from "react";
import { Keyboard, Pressable, Text, TextInput, View, type ViewProps } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import {
  AnimatedPressable,
  SWITCH_DIM,
  Sheen,
  SwitchOn,
  cn,
  ease,
  rowDelay,
  spring,
  tempo,
  timing,
  useHaptic,
  usePressAnimation,
  useReducedMotion,
  useTheme,
} from "@lumioui/core";
import { Icon, type IconName } from "../icon";
import { SearchInput, type SearchInputProps } from "../search-input";
import { Skeleton } from "../skeleton";

/**
 * Autocomplete — a search field with live suggestions where light follows
 * input: the typed letters of each title are lit in full ink while the rest
 * sits dim, so typing visibly lights the list. Recents while the query is
 * empty, dim structure while results load (one light pass as rows switch
 * on, 40ms apart), and an honest empty state. Picking a row lifts its title
 * into the field while the siblings dim; the dropdown then dims out.
 * "inline" lists suggestions under the field (a full search screen);
 * "dropdown" floats them in a card under a form field (address entry).
 *
 *   <Autocomplete options={places} recent={recents} onSelect={(o) => go(o)} />
 *
 * Expo Go compatible.
 */

export interface AutocompleteOption {
  /** Stable id. */
  id: string;
  /** Main line — the highlighted match runs here. */
  title: string;
  /** Second line (address, airport city, handle). */
  subtitle?: string;
  /** Leading glyph in a round disc. Defaults to search (clock for recents). */
  icon?: IconName;
  /** Custom leading node (avatar, logo) — wins over `icon`. */
  leading?: React.ReactNode;
  /** Trailing node (distance, code, badge). */
  trailing?: React.ReactNode;
  /** Extra words matched by the built-in filter but not shown. */
  keywords?: string;
}

/** Built-in ranking: title prefix → word prefix → substring → keyword. */
export function filterOptions(options: AutocompleteOption[], query: string): AutocompleteOption[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const scored: { o: AutocompleteOption; s: number }[] = [];
  for (const o of options) {
    const t = o.title.toLowerCase();
    const sub = (o.subtitle ?? "").toLowerCase();
    const kw = (o.keywords ?? "").toLowerCase();
    let s = -1;
    if (t.startsWith(q)) s = 0;
    else if (t.split(/[\s,-]+/).some((w) => w.startsWith(q))) s = 1;
    else if (t.includes(q)) s = 2;
    else if (sub.includes(q) || kw.split(/\s+/).some((w) => w.startsWith(q))) s = 3;
    if (s >= 0) scored.push({ o, s });
  }
  return scored.sort((a, b) => a.s - b.s).map((r) => r.o);
}

/** Untyped letters sit at this share of the ink, so typing visibly lights the list. */
const UNLIT = 0.55;
/** Siblings of a picked row dim to here while it lifts into the field. */
const SIBLING_DIM = 0.35;
/** The picked row travels to the field on one settle beat; the field fills as it lands. */
const LIFT_MS = tempo.settle;
/** It dims out over the last recede of that travel, so it melts into the field text. */
const LIFT_FADE_AT = tempo.settle - timing.recede.duration;
/** Dropdown dims to this scale as it leaves (overlay exit, DESIGN-TASTE §5b). */
const EXIT_SCALE = 0.97;
/** Height of the input box inside the field — the lift aims at its centre. */
const INPUT_H = 48;

/** "#RRGGBB" + alpha → "#RRGGBBAA"; other colour formats pass through. */
function withAlpha(color: string, a: number) {
  if (!/^#[0-9a-f]{6}$/i.test(color)) return color;
  return `${color}${Math.round(a * 255).toString(16).padStart(2, "0")}`;
}

/** Title lit by the query: the typed letters are full ink, the rest sits dim. */
function Highlighted({ text, query, enabled }: { text: string; query: string; enabled: boolean }) {
  const { colors } = useTheme();
  const q = query.trim();
  const i = enabled && q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (i < 0) {
    return (
      <Text className="text-base text-foreground" numberOfLines={1}>
        {text}
      </Text>
    );
  }
  return (
    <Text className="text-base" style={{ color: withAlpha(colors.foreground, UNLIT) }} numberOfLines={1}>
      {text.slice(0, i)}
      <Text className="text-foreground">{text.slice(i, i + q.length)}</Text>
      {text.slice(i + q.length)}
    </Text>
  );
}

function OptionRow({
  option,
  query,
  highlight,
  fallbackIcon,
  onPress,
}: {
  option: AutocompleteOption;
  query: string;
  highlight: boolean;
  fallbackIcon: IconName;
  onPress: (o: AutocompleteOption) => void;
}) {
  const press = usePressAnimation({ pressedScale: 0.99, pressedOpacity: 0.6 });
  return (
    <AnimatedPressable
      onPress={() => onPress(option)}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      style={press.animatedStyle}
      className="min-h-14 flex-row items-center gap-3 px-4 py-2"
      accessibilityRole="button"
      accessibilityLabel={[option.title, option.subtitle].filter(Boolean).join(", ")}
    >
      {option.leading ?? (
        <View className="h-9 w-9 items-center justify-center rounded-full bg-secondary">
          <Icon name={option.icon ?? fallbackIcon} size="sm" color="foreground" />
        </View>
      )}
      <View className="min-w-0 flex-1 gap-0.5">
        <Highlighted text={option.title} query={query} enabled={highlight} />
        {option.subtitle ? (
          <Text className="text-sm text-muted-foreground" numberOfLines={1}>
            {option.subtitle}
          </Text>
        ) : null}
      </View>
      {option.trailing}
    </AnimatedPressable>
  );
}

/**
 * One suggestion in the list. It switches on in its slot (dim → on, 40ms row
 * rhythm); when a sibling is picked it dims; when it is picked it lifts into
 * the field and melts into the text there.
 */
function SuggestionRow({
  index,
  picked,
  pickSV,
  liftTo,
  separator,
  children,
}: {
  index: number;
  picked: boolean;
  pickSV: SharedValue<number>;
  /** Offset from the list's top to the input's centre (negative = above). */
  liftTo: number;
  separator: boolean;
  children: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  const y = React.useRef(0);
  const h = React.useRef(0);
  const lift = useSharedValue(0);
  const self = useSharedValue(1);
  const was = React.useRef(picked);
  React.useEffect(() => {
    if (picked && !was.current) {
      if (!reduce) lift.value = withSpring(liftTo - y.current - h.current / 2, spring.surface);
      self.value = withDelay(LIFT_FADE_AT, withTiming(0, { ...timing.recede, easing: Easing.bezier(...ease.in) }));
    } else if (!picked && was.current) {
      // Landed — it is back in its slot as the one match, switching on again.
      lift.value = 0;
      self.value = SWITCH_DIM;
      self.value = withTiming(1, { ...timing.fast, easing: Easing.bezier(...ease.out) });
    }
    was.current = picked;
  }, [picked, reduce, liftTo, lift, self]);
  const style = useAnimatedStyle(() => ({
    opacity: picked ? self.value : 1 - (1 - SIBLING_DIM) * pickSV.value,
    transform: [{ translateY: lift.value }],
    zIndex: picked ? 1 : 0,
  }));
  return (
    <Animated.View
      style={style}
      onLayout={(e) => {
        y.current = e.nativeEvent.layout.y;
        h.current = e.nativeEvent.layout.height;
      }}
    >
      <SwitchOn delay={rowDelay(index)}>
        {separator ? <View className="ml-16 h-px bg-border" /> : null}
        {children}
      </SwitchOn>
    </Animated.View>
  );
}

export interface AutocompleteProps extends Omit<ViewProps, "className"> {
  /** Controlled query text. */
  value?: string;
  /** Uncontrolled initial query. */
  defaultValue?: string;
  /** Fires on every keystroke (debounce in your fetcher if remote). */
  onValueChange?: (query: string) => void;
  /** Candidate options. Filtered by the built-in ranking unless `filter`
   *  is false (then pass already-filtered results). */
  options?: AutocompleteOption[];
  /** Custom filter, or `false` to show `options` as-is (remote search). */
  filter?: ((options: AutocompleteOption[], query: string) => AutocompleteOption[]) | false;
  /** Shown while the query is empty. */
  recent?: AutocompleteOption[];
  /** Header above recents. Default "Recent". */
  recentTitle?: string;
  /** Shows a "Clear" action on the recent header. */
  onClearRecent?: () => void;
  /** Header above matches. Omit for none. */
  resultsTitle?: string;
  /** Fires when a suggestion is picked. */
  onSelect?: (option: AutocompleteOption) => void;
  /** Fill the field with the picked title. Default true. */
  fillOnSelect?: boolean;
  /** Skeleton rows while results load. */
  loading?: boolean;
  /** Max rows shown. Default 6. */
  maxResults?: number;
  /** Characters before matching starts. Default 1. */
  minChars?: number;
  /** Bold the typed part of each title. Default true. */
  highlightMatch?: boolean;
  /** Empty-results copy. Default `No results for "<query>"`. */
  emptyText?: string | ((query: string) => string);
  /** "inline" (default) list under the field, always visible; "dropdown"
   *  floating card shown while the field is focused. */
  presentation?: "inline" | "dropdown";
  /** Controlled suggestion visibility. */
  open?: boolean;
  /** Fires when suggestions open/close (focus, pick, blur). */
  onOpenChange?: (open: boolean) => void;
  /** Field placeholder. Default "Search". */
  placeholder?: string;
  /** Label above the field. */
  label?: string;
  /** Extra props for the SearchInput field. */
  inputProps?: Omit<SearchInputProps, "value" | "onChangeText" | "placeholder" | "label">;
  /** Content shown under recents while the query is empty (shortcuts). */
  emptyQueryContent?: React.ReactNode;
  className?: string;
}

export const Autocomplete = forwardRef<React.ElementRef<typeof TextInput>, AutocompleteProps>(function Autocomplete(
  {
    value,
    defaultValue = "",
    onValueChange,
    options = [],
    filter,
    recent,
    recentTitle = "Recent",
    onClearRecent,
    resultsTitle,
    onSelect,
    fillOnSelect = true,
    loading,
    maxResults = 6,
    minChars = 1,
    highlightMatch = true,
    emptyText,
    presentation = "inline",
    open: controlledOpen,
    onOpenChange,
    placeholder = "Search",
    label,
    inputProps,
    emptyQueryContent,
    className,
    ...props
  },
  ref
) {
  const haptics = useHaptic();
  const reduceMotion = useReducedMotion();
  const { dark } = useTheme();
  const [internal, setInternal] = useState(defaultValue);
  const query = value ?? internal;
  const [focused, setFocused] = useState(false);
  const dropdown = presentation === "dropdown";
  const [lifting, setLifting] = useState(false);
  // The dropdown stays up while a picked row lifts into the field, even
  // though the keyboard (and focus) left at the tap.
  const open = controlledOpen ?? (dropdown ? focused || lifting : true);

  const setQuery = (q: string) => {
    if (value === undefined) setInternal(q);
    onValueChange?.(q);
  };

  const setFocus = (f: boolean) => {
    setFocused(f);
    if (dropdown && controlledOpen === undefined) onOpenChange?.(f);
  };

  const active = query.trim().length >= minChars;
  const matches = useMemo(() => {
    if (!active) return [];
    const list = filter === false ? options : (filter ?? filterOptions)(options, query);
    return list.slice(0, maxResults);
  }, [active, filter, options, query, maxResults]);

  // Pick — the touched row leads: it lifts into the field while siblings
  // dim, the field fills as it lands, then the dropdown dims out.
  const [pickedId, setPickedId] = useState<string | null>(null);
  const pickSV = useSharedValue(0);
  const landing =React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const blurring = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(
    () => () => {
      if (landing.current) clearTimeout(landing.current);
      if (blurring.current) clearTimeout(blurring.current);
    },
    []
  );
  const pick = (o: AutocompleteOption) => {
    if (lifting) return;
    haptics.selection();
    Keyboard.dismiss();
    setLifting(true);
    setPickedId(o.id);
    pickSV.value = withTiming(1, { ...timing.recede, easing: Easing.bezier(...ease.in) });
    landing.current = setTimeout(
      () => {
        landing.current = null;
        setLifting(false);
        if (fillOnSelect) setQuery(o.title);
        setFocused(false);
        onOpenChange?.(false);
        onSelect?.(o);
        // Inline lists stay: the picked row switches on again in its slot.
        if (!dropdown) {
          setPickedId(null);
          pickSV.value = withTiming(0, timing.fast);
        }
      },
      reduceMotion ? timing.fast.duration : LIFT_MS
    );
  };

  // Loading → loaded: one light pass crosses the list as the rows switch on.
  const [lit, setLit] = useState(0);
  const [wasLoading, setWasLoading] = useState(!!loading);
  if (wasLoading !== !!loading) {
    setWasLoading(!!loading);
    if (!loading) setLit((n) => n + 1);
  }

  const siblingStyle = useAnimatedStyle(() => ({ opacity: 1 - (1 - SIBLING_DIM) * pickSV.value }));
  const header = (title: string, action?: { label: string; onPress: () => void }) => (
    <Animated.View style={siblingStyle} className="flex-row items-center justify-between px-4 pb-1 pt-3">
      <Text className="text-[13px] text-muted-foreground" accessibilityRole="header">
        {title}
      </Text>
      {action ? (
        <Pressable onPress={action.onPress} hitSlop={10} accessibilityRole="button" accessibilityLabel={`${action.label} ${title}`}>
          <Text className="text-[13px] font-semibold text-primary-text">{action.label}</Text>
        </Pressable>
      ) : null}
    </Animated.View>
  );

  // The input box is the bottom INPUT_H of the field; the list starts mt-2
  // under it (dropdown card) or pt-1 (inline). Aim the lift at its centre.
  const liftTo = -(dropdown ? 8 : 4) - INPUT_H / 2;
  const rows = (list: AutocompleteOption[], icon: IconName) =>
    list.map((o, i) => (
      <SuggestionRow
        key={o.id}
        index={i}
        picked={pickedId === o.id}
        pickSV={pickSV}
        liftTo={liftTo}
        separator={i > 0}
      >
        <OptionRow option={o} query={query} highlight={highlightMatch} fallbackIcon={icon} onPress={pick} />
      </SuggestionRow>
    ));

  let body: React.ReactNode;
  if (!active) {
    body =
      recent?.length || emptyQueryContent ? (
        <>
          {recent?.length ? (
            <>
              {header(recentTitle, onClearRecent ? { label: "Clear", onPress: () => { haptics.light(); onClearRecent(); } } : undefined)}
              {rows(recent, "clock")}
            </>
          ) : null}
          {emptyQueryContent}
        </>
      ) : null;
  } else if (loading && !matches.length) {
    // Dim structure in the exact shape of the rows it is waiting for.
    body = (
      <View className="gap-4 px-4 py-3" accessibilityLabel="Loading suggestions" accessibilityState={{ busy: true }}>
        {[0.7, 0.5, 0.6].map((w, i) => (
          <View key={i} className="flex-row items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-full" />
            <View className="flex-1 gap-1.5">
              <Skeleton className="h-4 rounded-md" style={{ width: `${w * 100}%` }} />
              <Skeleton className="h-3 rounded-md" style={{ width: `${w * 70}%` }} />
            </View>
          </View>
        ))}
      </View>
    );
  } else if (!matches.length) {
    const copy = typeof emptyText === "function" ? emptyText(query.trim()) : (emptyText ?? `No results for "${query.trim()}"`);
    body = (
      <SwitchOn className="items-center px-6 py-8" accessibilityLiveRegion="polite">
        <Text className="text-center text-[15px] text-muted-foreground">{copy}</Text>
      </SwitchOn>
    );
  } else {
    body = (
      <>
        {resultsTitle ? header(resultsTitle) : null}
        {rows(matches, "search")}
      </>
    );
  }

  // Dropdown card — container then content: the card ignites from its
  // anchor while rows switch on inside it, and it leaves by dimming in place.
  const shown = !!(open && body);
  const [mounted, setMounted] = useState(shown);
  const [prevShown, setPrevShown] = useState(shown);
  if (prevShown !== shown) {
    setPrevShown(shown);
    if (shown) {
      setMounted(true);
      // A fresh opening forgets the last pick.
      if (pickedId) setPickedId(null);
    }
  }
  const glow = useSharedValue(shown ? 1 : 0);
  const rise = useSharedValue(0);
  const shrink = useSharedValue(1);
  React.useEffect(() => {
    if (!dropdown) return;
    if (shown) {
      pickSV.value = 0;
      glow.value = withTiming(1, { ...timing.fast, easing: Easing.bezier(...ease.out) });
      shrink.value = 1;
      if (reduceMotion) {
        rise.value = 0;
      } else {
        rise.value = -6;
        rise.value = withSpring(0, spring.surface);
      }
    } else {
      glow.value = withTiming(0, { ...timing.recede, easing: Easing.bezier(...ease.in) }, (done) => {
        if (done) runOnJS(setMounted)(false);
      });
      if (!reduceMotion) shrink.value = withTiming(EXIT_SCALE, timing.recede);
    }
  }, [shown, dropdown, reduceMotion, glow, rise, shrink, pickSV]);
  const cardStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
    transform: [{ translateY: rise.value }, { scale: shrink.value }],
  }));

  const list = (
    <>
      {body}
      <Sheen run={lit} strength={dark ? 0.14 : 0.45} />
    </>
  );

  return (
    <View className={cn("w-full", dropdown && "z-10", className)} {...props}>
      <SearchInput
        ref={ref}
        value={query}
        onChangeText={setQuery}
        placeholder={placeholder}
        label={label}
        autoCorrect={false}
        {...inputProps}
        onFocus={(e) => {
          setFocus(true);
          inputProps?.onFocus?.(e);
        }}
        onBlur={(e) => {
          // Let a row tap land before the dropdown closes.
          if (blurring.current) clearTimeout(blurring.current);
          blurring.current = setTimeout(() => setFocus(false), timing.recede.duration);
          inputProps?.onBlur?.(e);
        }}
      />
      {dropdown ? (
        mounted && body ? (
          <Animated.View
            style={cardStyle}
            pointerEvents={shown ? "auto" : "none"}
            // While a row lifts out of the card it must not be clipped.
            className={cn(
              "absolute left-0 right-0 top-full mt-2 rounded-2xl border border-border bg-popover pb-1",
              !pickedId && "overflow-hidden"
            )}
            accessibilityRole="list"
          >
            {list}
          </Animated.View>
        ) : null
      ) : open && body ? (
        <View className={cn("pt-1", !pickedId && "overflow-hidden")} accessibilityRole="list">
          {list}
        </View>
      ) : null}
    </View>
  );
});

Autocomplete.displayName = "Autocomplete";
