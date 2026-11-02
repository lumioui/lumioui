import * as React from "react";
import { forwardRef } from "react";
import { Pressable, Text, TextInput, View, type TextInputProps } from "react-native";
import Animated, {
  Easing,
  FadeOut,
  LinearTransition,
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming,
  interpolateColor,
  type SharedValue,
} from "react-native-reanimated";
import { cn, ease, spring, timing, useHaptic, useReducedMotion, useTheme } from "@lumioui/core";
import { Chip } from "../chip";

/** Flicker for "can't" — one 4px kick released into spring.shake, with a dip to 0.6. */
const FLICKER_KICK = 4;
const FLICKER_DIP = 0.6;
/** A new chip settles from a hair under size; its fill ignites over the next 120ms. */
const CHIP_FROM = 0.96;
const FILL_IGNITE = { duration: 120, easing: Easing.bezier(...ease.out) };
const IGNITE = { ...timing.fast, easing: Easing.bezier(...ease.out) };
/** Siblings and the caret reflow on the layout spring; removals dim in 120ms. */
const REFLOW = LinearTransition.springify().damping(spring.layout.damping).stiffness(spring.layout.stiffness);
const CHIP_EXIT = FadeOut.duration(timing.recede.duration);

/** One flicker: kick + dip, released on spring.shake. Reduced motion keeps the dip. */
function flicker(x: SharedValue<number>, o: SharedValue<number>, reduce: boolean) {
  o.value = withSequence(withTiming(FLICKER_DIP, timing.instant), withTiming(1, IGNITE));
  if (reduce) return;
  x.value = FLICKER_KICK;
  x.value = withSpring(0, spring.shake);
}

/** A committed tag. The typed text becomes the chip in place: the label is
 *  there at once, the chip settles 0.96 → 1 and its fill ignites behind it. */
function TagChip({
  tag,
  fresh,
  flick,
  reduce,
  className,
  onDelete,
}: {
  tag: string;
  fresh: boolean;
  flick: number;
  reduce: boolean;
  className?: string;
  onDelete?: () => void;
}) {
  const scale = useSharedValue(fresh && !reduce ? CHIP_FROM : 1);
  const fill = useSharedValue(fresh ? 0 : 1);
  const x = useSharedValue(0);
  const o = useSharedValue(1);
  React.useEffect(() => {
    scale.value = withSpring(1, spring.swap);
    fill.value = withTiming(1, FILL_IGNITE);
  }, [scale, fill]);
  const lastFlick = React.useRef(flick);
  React.useEffect(() => {
    if (lastFlick.current === flick) return;
    lastFlick.current = flick;
    flicker(x, o, reduce);
  }, [flick, reduce, x, o]);
  const style = useAnimatedStyle(() => ({
    opacity: o.value,
    transform: [{ translateX: x.value }, { scale: scale.value }],
  }));
  const fillStyle = useAnimatedStyle(() => ({ opacity: fill.value }));
  return (
    <Animated.View layout={reduce ? undefined : REFLOW} exiting={CHIP_EXIT} style={style}>
      <Animated.View pointerEvents="none" className="absolute inset-0 rounded-full bg-card" style={fillStyle} />
      <Chip variant="input" size="sm" className={cn("bg-transparent", className)} onDelete={onDelete}>
        {tag}
      </Chip>
    </Animated.View>
  );
}

const DEFAULT_SEPARATORS = [",", " "];

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export type TagRejectReason = "duplicate" | "limit";

export interface TagInputProps
  extends Omit<TextInputProps, "className" | "value" | "defaultValue" | "onChange" | "onChangeText" | "onSubmitEditing"> {
  /** Controlled tag list. Omit for uncontrolled via `defaultValue`. */
  value?: string[];
  /** Uncontrolled initial tags. */
  defaultValue?: string[];
  /** Fires with the next tag list on every add/remove. */
  onChange?: (tags: string[]) => void;
  /** Visible label above the field. */
  label?: string;
  /** Placeholder inside the field — shown only while the tag list is empty. */
  placeholder?: string;
  /** Cap on tag count — commits past it are refused with a flicker. */
  maxTags?: number;
  /** Characters that commit a tag on top of Enter. Default [",", " "]. */
  separators?: string[];
  /** Called when a commit is rejected (duplicate or over maxTags). */
  onReject?: (tag: string, reason: TagRejectReason) => void;
  /** Locks the field — chips lose their ×, typing is disabled. */
  disabled?: boolean;
  /** Classes on the outer wrapper. */
  className?: string;
  /** Classes on the field box itself. */
  fieldClassName?: string;
  /** Classes on the inner TextInput. */
  inputClassName?: string;
  /** Classes merged onto every rendered chip. */
  chipClassName?: string;
  /** Show an "n of max" line under the field (needs `maxTags`); an
   *  over-limit commit flickers this line instead of the field. */
  counter?: boolean;
}

/**
 * TagInput — freeform token entry: type, hit Enter/comma/space and the text
 * becomes a chip in place — its fill ignites while the caret reflows on the
 * layout spring; Backspace on an empty field pops the last tag, which dims
 * out as the gap closes. A duplicate flickers the chip it duplicates (the
 * typed text stays); an over-limit commit flickers the counter or field.
 *   <TagInput value={tags} onChange={setTags} placeholder="Add labels…" />
 * Expo Go compatible.
 */
export const TagInput = forwardRef<React.ElementRef<typeof TextInput>, TagInputProps>(
  function TagInput(
    {
      value,
      defaultValue,
      onChange,
      label,
      placeholder,
      maxTags,
      separators = DEFAULT_SEPARATORS,
      onReject,
      disabled,
      editable = true,
      className,
      fieldClassName,
      inputClassName,
      chipClassName,
      counter = false,
      onKeyPress,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) {
    const { colors } = useTheme();
    const haptics = useHaptic();
    const reduce = useReducedMotion();
    const inputRef = React.useRef<React.ComponentRef<typeof TextInput>>(null);
    const isDisabled = disabled || !editable;

    const [internal, setInternal] = React.useState<string[]>(defaultValue ?? []);
    const tags = value ?? internal;
    const [text, setText] = React.useState("");

    // Tags present at mount are at rest; only later commits perform.
    const [mountTags] = React.useState(tags);
    /** Per-tag flicker counters (lower-cased key) — bumping one flickers that chip. */
    const [flicks, setFlicks] = React.useState<Record<string, number>>({});

    const shakeX = useSharedValue(0);
    const fieldO = useSharedValue(1);
    const countX = useSharedValue(0);
    const countO = useSharedValue(1);
    const focusT = useSharedValue(0);
    const fieldStyle = useAnimatedStyle(() => ({ opacity: fieldO.value, transform: [{ translateX: shakeX.value }] }));
    const countStyle = useAnimatedStyle(() => ({ opacity: countO.value, transform: [{ translateX: countX.value }] }));
    const showCounter = counter && maxTags !== undefined;
    const borderStyle = useAnimatedStyle(() => ({
      borderColor: interpolateColor(focusT.value, [0, 1], [colors.input, colors.ring]),
    }));

    const apply = React.useCallback(
      (next: string[]) => {
        if (value === undefined) setInternal(next);
        onChange?.(next);
      },
      [value, onChange]
    );

    const reject = React.useCallback(
      (tag: string, reason: TagRejectReason) => {
        // Point at the cause: the chip it duplicates, the counter, else the field.
        const existing = reason === "duplicate" ? tags.find((t) => t.toLowerCase() === tag.toLowerCase()) : undefined;
        if (existing) {
          const k = existing.toLowerCase();
          setFlicks((f) => ({ ...f, [k]: (f[k] ?? 0) + 1 }));
        } else if (reason === "limit" && showCounter) {
          flicker(countX, countO, reduce);
        } else {
          flicker(shakeX, fieldO, reduce);
        }
        haptics.warning();
        onReject?.(tag, reason);
      },
      [tags, showCounter, reduce, shakeX, fieldO, countX, countO, haptics, onReject]
    );

    /** Why `tag` can't join `current`, or null when it may. Case-insensitive
     *  duplicate guard + maxTags cap. */
    const checkTag = React.useCallback(
      (tag: string, current: string[]): TagRejectReason | null => {
        if (current.some((t) => t.toLowerCase() === tag.toLowerCase())) return "duplicate";
        if (maxTags !== undefined && current.length >= maxTags) return "limit";
        return null;
      },
      [maxTags]
    );

    /** Commit one token. Returns true when the text should leave the field. */
    const commit = React.useCallback(
      (raw: string): boolean => {
        const tag = raw.trim();
        if (!tag) return true;
        const reason = checkTag(tag, tags);
        if (reason) {
          reject(tag, reason);
          return false;
        }
        haptics.selection();
        apply([...tags, tag]);
        return true;
      },
      [tags, checkTag, apply, reject, haptics]
    );

    const remove = React.useCallback(
      (tag: string) => {
        haptics.light();
        apply(tags.filter((t) => t !== tag));
      },
      [tags, apply, haptics]
    );

    const handleChangeText = (next: string) => {
      const re = new RegExp(separators.map(escapeRegExp).join("|"));
      if (!re.test(next)) {
        setText(next);
        return;
      }
      const parts = next.split(re);
      const tail = parts.pop() ?? "";
      // Every chunk before a separator is a commit attempt against the list
      // PLUS what's already been added this keystroke — a pasted "a,a" can't
      // double-commit before state lands. Rejected chunks stay in the field
      // (joined back with the tail) so the user can edit.
      const kept: string[] = [];
      const added: string[] = [];
      for (const part of parts) {
        const tag = part.trim();
        if (!tag) continue;
        const reason = checkTag(tag, [...tags, ...added]);
        if (reason) {
          reject(tag, reason);
          kept.push(tag);
          continue;
        }
        added.push(tag);
      }
      if (added.length > 0) {
        haptics.selection();
        apply([...tags, ...added]);
      }
      setText([...kept, tail].join(" ").trimStart());
    };

    const handleSubmit = () => {
      if (commit(text)) setText("");
    };

    const handleKeyPress = (e: Parameters<NonNullable<TextInputProps["onKeyPress"]>>[0]) => {
      // Backspace on an empty field pops the last tag — the classic
      // token-field idiom (a mail To: line).
      if (e.nativeEvent.key === "Backspace" && text === "" && tags.length > 0) {
        remove(tags[tags.length - 1]!);
      }
      onKeyPress?.(e);
    };

    const describedId = React.useId();

    return (
      <View className={cn("w-full gap-2", className)}>
        {label ? (
          <Text nativeID={`${describedId}-label`} className="text-sm font-medium text-foreground">
            {label}
          </Text>
        ) : null}
        <Pressable
          // Not itself a control — taps on the padding area just forward
          // focus to the inner TextInput, which owns the a11y contract.
          accessible={false}
          accessibilityRole="none"
          onPress={() => !isDisabled && inputRef.current?.focus()}
          disabled={isDisabled}
        >
          <Animated.View
            style={fieldStyle}
            className={cn("rounded-xl", isDisabled && "opacity-50")}
          >
            <Animated.View
              style={borderStyle}
              className={cn(
                "min-h-[48px] flex-row flex-wrap items-center gap-2 rounded-xl border-[1.5px] bg-card px-3 py-2",
                fieldClassName
              )}
            >
              {tags.map((tag) => (
                <TagChip
                  key={tag}
                  tag={tag}
                  fresh={!mountTags.includes(tag)}
                  flick={flicks[tag.toLowerCase()] ?? 0}
                  reduce={reduce}
                  className={chipClassName}
                  onDelete={isDisabled ? undefined : () => remove(tag)}
                />
              ))}
              <Animated.View layout={reduce ? undefined : REFLOW} className="flex-1" style={{ minWidth: 90 }}>
              <TextInput
                ref={(node) => {
                  (inputRef as React.MutableRefObject<React.ComponentRef<typeof TextInput> | null>).current = node;
                  if (typeof ref === "function") ref(node);
                  else if (ref) (ref as React.MutableRefObject<React.ComponentRef<typeof TextInput> | null>).current = node;
                }}
                value={text}
                onChangeText={handleChangeText}
                onSubmitEditing={handleSubmit}
                onKeyPress={handleKeyPress}
                editable={!isDisabled}
                placeholder={tags.length === 0 ? placeholder : undefined}
                placeholderTextColor={colors.mutedForeground}
                className={cn("w-full py-1 text-base text-foreground", inputClassName)}
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={(e) => {
                  focusT.value = reduce ? 1 : withTiming(1, timing.fast);
                  onFocus?.(e);
                }}
                onBlur={(e) => {
                  focusT.value = reduce ? 0 : withTiming(0, timing.fast);
                  onBlur?.(e);
                }}
                accessibilityLabel={label ?? props.accessibilityLabel ?? placeholder ?? "Tags"}
                accessibilityLabelledBy={label ? `${describedId}-label` : undefined}
                aria-labelledby={label ? `${describedId}-label` : undefined}
                accessibilityHint="Type and press return, comma or space to add a tag. Backspace removes the last tag."
                accessibilityState={{ disabled: isDisabled }}
                blurOnSubmit={false}
                returnKeyType="done"
                {...props}
              />
              </Animated.View>
            </Animated.View>
          </Animated.View>
        </Pressable>
        {showCounter ? (
          <Animated.View style={countStyle}>
            <Text className="text-[13px] tabular-nums text-muted-foreground" accessibilityLiveRegion="polite">
              {tags.length} of {maxTags}
            </Text>
          </Animated.View>
        ) : null}
      </View>
    );
  }
);

TagInput.displayName = "TagInput";
