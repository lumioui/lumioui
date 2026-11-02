import * as React from "react";
import { forwardRef, createContext, useContext, useId } from "react";
import { View, Text, Pressable, type ViewProps, type TextProps, type PressableProps, type GestureResponderEvent } from "react-native";
import Animated, {
  Easing,
  interpolateColor,
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { cn, ease, useHaptic, usePressAnimation, spring, timing, useReducedMotion, useTheme } from "@lumioui/core";
import { Icon } from "../icon";

/**
 * Form — dependency-free form primitives.
 *   <Form>
 *     <Form.Field name="email" label="Email" required error={errors.email}>
 *       <Input />
 *     </Form.Field>
 *   </Form>
 * Field composes Label + control + Message; all pieces are also usable standalone.
 *
 * Light, not decoration: a Field given `valid` keeps its label muted until
 * the value passes, then the label switches on to ink — the only light a
 * form needs. Row values swap in place (dim / ignite) and disabled rows
 * crossfade instead of snapping.
 */

/** Ignite curve shared by the label switch-on and the row value swap. */
const IGNITE = { duration: timing.fast.duration, easing: Easing.bezier(...ease.out) };
/** A swapped row value starts at this brightness, then ignites (dim, not gone). */
const SWAP_DIM = 0.35;
/** Disabled rows rest at this brightness — reached by a crossfade. */
const ROW_DISABLED = 0.5;

interface FormContextValue {
  /** Reserve space for future form-level state (submission, errors map, etc.). */
  disabled?: boolean;
}

const FormContext = createContext<FormContextValue>({});

export function useFormContext(): FormContextValue {
  return useContext(FormContext);
}

interface FormFieldContextValue {
  name?: string;
  controlId: string;
  messageId: string;
  hasError: boolean;
  required: boolean;
  /** True when the surrounding <Form disabled> — custom controls read it
   *  via useFormField() to disable themselves. */
  disabled: boolean;
  /** Set when the Field opts into the valid light (see FormFieldProps.valid). */
  valid?: boolean;
  /** Wait before the label first switches on, in ms. */
  validDelay?: number;
}

const FormFieldContext = createContext<FormFieldContextValue | null>(null);

/** Access field wiring (ids, error state) inside custom controls. */
export function useFormField(): FormFieldContextValue {
  const ctx = useContext(FormFieldContext);
  if (!ctx) throw new Error("useFormField must be used within a Form.Field");
  return ctx;
}

export interface FormProps extends ViewProps {
  /** Disable all fields in the form (exposed via useFormContext). */
  disabled?: boolean;
  className?: string;
}

const FormRoot = forwardRef<React.ElementRef<typeof View>, FormProps>(
  function Form({ disabled, className, ...props }, ref) {
    return (
      <FormContext.Provider value={{ disabled }}>
        <View ref={ref} className={cn("w-full gap-4", className)} {...props} />
      </FormContext.Provider>
    );
  }
);

export interface FormFieldProps extends ViewProps {
  /** Field name (for identification/analytics). */
  name?: string;
  /** Shorthand label — equivalent to rendering <Form.Label>. */
  label?: string;
  /** Show a required asterisk on the label. */
  required?: boolean;
  /** Error message — renders <Form.Message> and marks the field invalid. */
  error?: string;
  /** Hint text shown when there is no error. */
  description?: string;
  /** Opt into the valid light: the label stays muted while false and
   *  switches on to ink when true. Omit to keep the label always ink. */
  valid?: boolean;
  /** Delay before the label's first switch-on, so pre-filled fields light
   *  in reading order (e.g. index × 60). Later changes are immediate. */
  validDelay?: number;
  className?: string;
  labelClassName?: string;
}

/** Props FormField injects into a lone control child — typed so the
 *  cloneElement call needs no `as never`. */
interface WiredControlProps {
  "aria-invalid"?: boolean;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
  "aria-disabled"?: boolean;
  /** TextInput-style controls (Input/Textarea/SearchInput). */
  editable?: boolean;
  /** Pressable-style controls (Checkbox/Switch/Select). */
  disabled?: boolean;
}

const FormField = forwardRef<React.ElementRef<typeof View>, FormFieldProps>(
  function FormField(
    { name, label, required = false, error, description, valid, validDelay, className, labelClassName, children, ...props },
    ref
  ) {
    const baseId = useId();
    const formCtx = useContext(FormContext);
    const ctx: FormFieldContextValue = {
      name,
      controlId: `${baseId}-control`,
      messageId: `${baseId}-message`,
      hasError: error != null && error !== "",
      required,
      disabled: formCtx.disabled ?? false,
      valid,
      validDelay,
    };

    // Wire the control to its label/message: a lone element child gets
    // aria-invalid plus the label/message ids (they're rendered as real DOM
    // ids via nativeID), and inherits <Form disabled>. Multi-node children
    // are left alone — custom slots can wire themselves through useFormField().
    const control =
      React.isValidElement(children) && !Array.isArray(children)
        ? React.cloneElement(children as React.ReactElement<WiredControlProps>, {
            "aria-invalid": ctx.hasError || undefined,
            "aria-labelledby": label != null ? `${ctx.controlId}-label` : undefined,
            "aria-describedby": ctx.hasError ? ctx.messageId : undefined,
            // Only injected when the form is disabled so a child's own
            // editable/disabled props are never clobbered with undefined.
            ...(ctx.disabled
              ? { "aria-disabled": true, editable: false, disabled: true }
              : {}),
          })
        : children;

    return (
      <FormFieldContext.Provider value={ctx}>
        <View ref={ref} className={cn("gap-1.5", className)} {...props}>
          {label != null && <FormLabel className={labelClassName}>{label}</FormLabel>}
          {control}
          {ctx.hasError ? (
            <FormMessage>{error}</FormMessage>
          ) : description != null ? (
            <Text className="text-sm text-muted-foreground">{description}</Text>
          ) : null}
        </View>
      </FormFieldContext.Provider>
    );
  }
);

export interface FormLabelProps extends TextProps {
  className?: string;
}

const FormLabel = forwardRef<React.ElementRef<typeof Text>, FormLabelProps>(
  function FormLabel({ className, children, ...props }, ref) {
    const field = useContext(FormFieldContext);
    const asterisk = field?.required ? <Text className="text-destructive"> *</Text> : null;
    // Opted-in fields light their label; an error always wins (red, static).
    if (field && field.valid !== undefined && !field.hasError) {
      return (
        <LitLabel
          ref={ref}
          on={field.valid}
          delay={field.validDelay ?? 0}
          nativeID={`${field.controlId}-label`}
          className={className}
          {...props}
        >
          {children}
          {asterisk}
        </LitLabel>
      );
    }
    return (
      <Text
        ref={ref}
        className={cn(
          "text-sm font-medium text-foreground",
          field?.hasError && "text-destructive",
          className
        )}
        nativeID={field ? `${field.controlId}-label` : undefined}
        {...props}
      >
        {children}
        {asterisk}
      </Text>
    );
  }
);

/** A label that switches on — muted until its field passes, then ink over
 *  timing.fast. Colour only, so reduced motion keeps it unchanged. */
const LitLabel = forwardRef<React.ElementRef<typeof Text>, FormLabelProps & { on: boolean; delay: number }>(
  function LitLabel({ on, delay, className, style, children, ...props }, ref) {
    const { colors } = useTheme();
    const lit = useSharedValue(0);
    const first = React.useRef(true);
    React.useEffect(() => {
      const target = on ? 1 : 0;
      // Only the first switch-on waits its turn in reading order.
      lit.value =
        first.current && on ? withDelay(delay, withTiming(target, IGNITE)) : withTiming(target, IGNITE);
      first.current = false;
    }, [on, delay, lit]);
    const muted = colors.mutedForeground;
    const ink = colors.foreground;
    const litStyle = useAnimatedStyle(() => ({ color: interpolateColor(lit.value, [0, 1], [muted, ink]) }));
    return (
      <Animated.Text
        ref={ref as React.Ref<never>}
        className={cn("text-sm font-medium", className)}
        style={[style, litStyle]}
        {...props}
      >
        {children}
      </Animated.Text>
    );
  }
);

export interface FormMessageProps extends TextProps {
  className?: string;
}

const FormMessage = forwardRef<React.ElementRef<typeof Text>, FormMessageProps>(
  function FormMessage({ className, children, ...props }, ref) {
    const field = useContext(FormFieldContext);
    const reduceMotion = useReducedMotion();
    // Mount entrance — the message fades and settles down 4px so validation
    // feedback arrives instead of teleporting in (error-message recipe).
    const t = useSharedValue(0);
    React.useEffect(() => {
      t.value = reduceMotion ? 1 : withTiming(1, timing.fast);
    }, [t, reduceMotion]);
    const msgStyle = useAnimatedStyle(() => ({
      opacity: t.value,
      transform: [{ translateY: reduceMotion ? 0 : (1 - t.value) * -4 }],
    }));
    if (children == null) return null;
    return (
      <Animated.View style={msgStyle}>
        <Text
          ref={ref}
          nativeID={field?.messageId}
          className={cn("text-sm font-medium text-destructive", className)}
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
          {...props}
        >
          {children}
        </Text>
      </Animated.View>
    );
  }
);

// --- Settings form primitives ---

export interface FormSectionProps extends ViewProps {
  /** Optional header text rendered above the group. */
  title?: string;
  /** Optional footer text rendered below the group. */
  footer?: string;
  /** Extra classes for the header text. */
  titleClassName?: string;
  /** Extra classes for the footer text. */
  footerClassName?: string;
  className?: string;
}

const FormSection = forwardRef<React.ElementRef<typeof View>, FormSectionProps>(
  function FormSection({ title, footer, titleClassName, footerClassName, className, children, ...props }, ref) {
    return (
      <View ref={ref} className={cn("mb-6", className)} {...props}>
        {title != null && (
          <Text
            className={cn(
              "mx-4 mb-2 text-[13px] text-muted-foreground",
              titleClassName
            )}
            accessibilityRole="header"
          >
            {title}
          </Text>
        )}
        <View className="mx-4 overflow-hidden rounded-2xl border border-border bg-card">
          {children}
        </View>
        {footer != null && (
          <Text
            className={cn(
              "mx-4 mt-2 text-[13px] text-muted-foreground",
              footerClassName
            )}
          >
            {footer}
          </Text>
        )}
      </View>
    );
  }
);

export interface FormRowProps extends Omit<PressableProps, "children"> {
  /** Primary label. */
  label: string;
  /** Secondary description below the label. */
  description?: string;
  /** Slot rendered before the label (icon, avatar). */
  leading?: React.ReactNode;
  /** Control rendered on the trailing side (Switch, value text, etc.). */
  trailing?: React.ReactNode;
  /** Trailing value text ("15 minutes before"). When it changes it swaps in
   *  place — the new value starts dim and ignites. Renders before `trailing`. */
  value?: string;
  /** Show a disclosure chevron on the trailing edge. */
  showChevron?: boolean;
  /** Haptic on press. Default "selection"; false to disable. */
  haptic?: "light" | "selection" | false;
  className?: string;
  labelClassName?: string;
  descriptionClassName?: string;
  children?: React.ReactNode;
}

const FormRow = forwardRef<React.ElementRef<typeof Pressable>, FormRowProps>(
  function FormRow(
    {
      label,
      description,
      leading,
      trailing,
      value,
      showChevron = false,
      haptic = "selection",
      className,
      labelClassName,
      descriptionClassName,
      children,
      disabled,
      onPress,
      onPressIn,
      onPressOut,
      ...props
    },
    ref
  ) {
    const haptics = useHaptic();
    const reduceMotion = useReducedMotion();
    const press = usePressAnimation({ pressedScale: 0.98, fast: true });
    const ink = useSharedValue(0);
    const inkStyle = useAnimatedStyle(() => ({ opacity: ink.value * 0.12 }));
    // Disclosure chevron nudges right while the row is held — a hint that
    // the row leads somewhere.
    const chevX = useSharedValue(0);
    const chevStyle = useAnimatedStyle(() => ({
      transform: [{ translateX: chevX.value }],
    }));

    // Disabled crossfades over timing.normal instead of snapping to half.
    const dim = useSharedValue(disabled ? ROW_DISABLED : 1);
    React.useEffect(() => {
      dim.value = withTiming(disabled ? ROW_DISABLED : 1, timing.normal);
    }, [disabled, dim]);
    const dimStyle = useAnimatedStyle(() => ({ opacity: dim.value }));

    // Rows without onPress (a Switch or value row) never highlight — only
    // rows that navigate or act flash; a static row stays still.
    const interactive = onPress != null && !disabled;

    const handlePress = (e: GestureResponderEvent) => {
      if (haptic) haptics[haptic === "selection" ? "selection" : "light"]();
      onPress?.(e);
    };

    return (
      <Pressable
        ref={ref}
        disabled={disabled}
        onPress={onPress ? handlePress : undefined}
        onPressIn={(e) => {
          if (!interactive) {
            onPressIn?.(e);
            return;
          }
          press.onPressIn();
          if (!reduceMotion) {
            ink.value = withTiming(1, timing.instant);
            chevX.value = withTiming(3, timing.fast);
          }
          onPressIn?.(e);
        }}
        onPressOut={(e) => {
          if (!interactive) {
            onPressOut?.(e);
            return;
          }
          press.onPressOut();
          ink.value = withTiming(0, timing.normal);
          if (!reduceMotion) chevX.value = withSpring(0, spring.press);
          onPressOut?.(e);
        }}
        className={cn(
          "min-h-12 flex-row items-center gap-3 px-4 py-2.5",
          className
        )}
        // Non-pressable rows announce "none" — silence would let the
        // platform guess a role the row doesn't have.
        accessibilityRole={onPress ? "button" : "none"}
        accessibilityLabel={value != null ? `${label}, ${value}` : label}
        accessibilityState={{ disabled: !!disabled }}
        {...props}
      >
        <Animated.View
          pointerEvents="none"
          style={[{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }, inkStyle]}
          className="bg-foreground"
        />
        <Animated.View style={[press.animatedStyle, dimStyle]} className="flex-1 flex-row items-center gap-3">
          {leading}
          {/* Label and value both start at their natural width and shrink
              together when the row is tight, so neither collapses to a letter. */}
          <View className="min-w-0 flex-auto gap-0.5">
            <Text className={cn("text-base leading-tight text-foreground", labelClassName)} numberOfLines={1}>
              {label}
            </Text>
            {description != null && (
              <Text className={cn("text-sm text-muted-foreground", descriptionClassName)} numberOfLines={2}>
                {description}
              </Text>
            )}
            {children}
          </View>
          {value != null && <RowValue value={value} />}
          {trailing}
          {showChevron && (
            <Animated.View style={chevStyle}>
              <Icon
                name="chevron-right"
                size="sm"
                color="mutedForeground"
                accessibilityElementsHidden
                importantForAccessibility="no"
              />
            </Animated.View>
          )}
        </Animated.View>
      </Pressable>
    );
  }
);

/** Trailing value that swaps in place: the new value starts dim at 0.96 and
 *  ignites (opacity over timing.fast, scale on spring.swap). No travel. */
function RowValue({ value }: { value: string }) {
  const reduce = useReducedMotion();
  const on = useSharedValue(1);
  const scale = useSharedValue(1);
  const shown = React.useRef(value);
  React.useEffect(() => {
    if (shown.current === value) return;
    shown.current = value;
    on.value = SWAP_DIM;
    on.value = withTiming(1, IGNITE);
    if (reduce) return;
    scale.value = 0.96;
    scale.value = withSpring(1, spring.swap);
  }, [value, reduce, on, scale]);
  const style = useAnimatedStyle(() => ({ opacity: on.value, transform: [{ scale: scale.value }] }));
  return (
    // At most half the row, truncating, so a long value never squeezes the
    // label away on a narrow phone.
    <Animated.View style={[{ maxWidth: "50%", flexShrink: 1 }, style]}>
      <Text className="text-base text-muted-foreground" numberOfLines={1}>
        {value}
      </Text>
    </Animated.View>
  );
}

export interface FormSeparatorProps extends ViewProps {
  className?: string;
}

const FormSeparator = forwardRef<React.ElementRef<typeof View>, FormSeparatorProps>(
  function FormSeparator({ className, ...props }, ref) {
    return (
      <View
        ref={ref}
        className={cn("ml-4 h-px bg-border", className)}
        accessibilityElementsHidden
        importantForAccessibility="no"
        {...props}
      />
    );
  }
);

export const Form = Object.assign(FormRoot, {
  Field: FormField,
  Label: FormLabel,
  Message: FormMessage,
  Section: FormSection,
  Row: FormRow,
  Separator: FormSeparator,
});

Form.displayName = "Form";
FormField.displayName = "Form.Field";
FormLabel.displayName = "Form.Label";
FormMessage.displayName = "Form.Message";
FormSection.displayName = "Form.Section";
FormRow.displayName = "Form.Row";
FormSeparator.displayName = "Form.Separator";
LitLabel.displayName = "Form.LitLabel";
