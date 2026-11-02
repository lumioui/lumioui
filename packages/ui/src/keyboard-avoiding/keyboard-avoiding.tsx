import * as React from "react";
import { forwardRef } from "react";
import { KeyboardAvoidingView, Platform, type KeyboardAvoidingViewProps, } from "react-native";
import { cn } from "@lumioui/core";

/**
 * KeyboardAvoiding — KeyboardAvoidingView with sane per-platform defaults.
 * iOS uses `padding`; Android uses no behavior — the window already resizes
 * via adjustResize, and forcing `height` double-shrinks the layout.
 * Pass `offset` for headers.
 *   <KeyboardAvoiding offset={64}>…form…</KeyboardAvoiding>
 */

export interface KeyboardAvoidingProps extends KeyboardAvoidingViewProps {
  /** Extra offset (e.g. header height). Default 0. */
  offset?: number;
  className?: string;
}

export const KeyboardAvoiding = forwardRef<
  React.ElementRef<typeof KeyboardAvoidingView>,
  KeyboardAvoidingProps
>(function KeyboardAvoiding(
  { offset = 0, behavior, keyboardVerticalOffset, enabled, className, style, ...props },
  ref
) {
  return (
    // Layout wrapper only — intentionally role-free so screen readers
    // traverse the form content, not this container. Nothing to announce,
    // no haptics, no motion; safe-area comes from the inner ScrollView.
    <KeyboardAvoidingView
      ref={ref}
      // Android intentionally has no default behavior: modern practice is
      // to let adjustResize shrink the window. Pass `behavior` to override.
      behavior={behavior ?? (Platform.OS === "ios" ? "padding" : undefined)}
      keyboardVerticalOffset={keyboardVerticalOffset ?? offset}
      enabled={enabled}
      className={cn("flex-1", className)}
      style={[{ flex: 1 }, style]}
      {...props}
    />
  );
});

KeyboardAvoiding.displayName = "KeyboardAvoiding";
