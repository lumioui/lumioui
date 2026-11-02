import * as React from "react";
import { View, type LayoutChangeEvent } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from "react-native-reanimated";
import { Accent, Sheen, ease, spring, tempo, timing, useHaptic, useReducedMotion } from "@lumioui/core";
import { Form } from "../form";
import { Button } from "../../button/button";
import { Icon } from "../../icon/icon";
import { Input } from "../../input/input";
import { Text } from "../../text/text";

/** "4242424242424242" → "4242 4242 4242 4242". */
function groupCard(raw: string) {
  return raw.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");
}
/** Luhn checksum — catches a mistyped digit the moment the 16th lands. */
function luhn(digits: string) {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}
/** "0928" → "09/28". */
function formatExpiry(raw: string) {
  const d = raw.replace(/\D/g, "").slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

/** Fields switch on in reading order, this far apart. */
const LABEL_STAGGER = 60;
/** Height of the folded card face. */
const FACE_H = 72;
/** The added card holds this long before the header resolves (act → hold). */
const HOLD = 700;
/** Disabled CTA brightness — the fill crossfades up from here when valid. */
const CTA_DIM = 0.5;
/** Refused-press flicker kick in points. */
const FLICK = 4;

type Phase = "edit" | "folding" | "added";

/** Header line that swaps in place — the new copy starts dim at 0.96 and ignites. */
function SwapLine({ text, className, muted }: { text: string; className?: string; muted?: boolean }) {
  const reduce = useReducedMotion();
  const on = useSharedValue(1);
  const scale = useSharedValue(1);
  const shown = React.useRef(text);
  React.useEffect(() => {
    if (shown.current === text) return;
    shown.current = text;
    on.value = 0.35;
    on.value = withTiming(1, { duration: timing.fast.duration, easing: Easing.bezier(...ease.out) });
    if (reduce) return;
    scale.value = 0.96;
    scale.value = withSpring(1, spring.swap);
  }, [text, reduce, on, scale]);
  const style = useAnimatedStyle(() => ({ opacity: on.value, transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={[style, { transformOrigin: "left" }]}>
      <Text variant={muted ? "muted" : undefined} className={className} accessibilityLiveRegion="polite">
        {text}
      </Text>
    </Animated.View>
  );
}

/** FormCheckout — "Add a card" in a banking app, green accent. Each field's
 *  label switches on from muted to ink as its value passes (in reading
 *  order on first view), and the CTA's fill crossfades up when the last one
 *  does; pressing it early flickers. "Add card" folds the form into the
 *  card it made: fields dim, the stack folds into one card face, a single
 *  sheen crosses it, it holds, then the header resolves to "Card added".
 *  (Finish the number with "242" for a valid test card.) */
export function FormCheckout() {
  const haptic = useHaptic();
  const reduce = useReducedMotion();
  const [number, setNumber] = React.useState("4242 4242 4242 4");
  const [expiry, setExpiry] = React.useState("");
  const [cvc, setCvc] = React.useState("");
  const [holder, setHolder] = React.useState("Tomás Herrera");
  const [phase, setPhase] = React.useState<Phase>("edit");
  const [sheen, setSheen] = React.useState(0);
  const timers = React.useRef<ReturnType<typeof setTimeout>[]>([]);
  React.useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const later = (ms: number, fn: () => void) => timers.current.push(setTimeout(fn, ms));

  const digits = number.replace(/\D/g, "");
  const numberOk = digits.length === 16 && luhn(digits);
  const numberError = digits.length === 16 && !numberOk ? "That number doesn't look right" : undefined;
  const [mm] = expiry.split("/");
  const expiryError = expiry.length === 5 && (Number(mm) < 1 || Number(mm) > 12) ? "Month must be 01–12" : undefined;
  const expiryOk = expiry.length === 5 && !expiryError;
  const cvcOk = cvc.length >= 3;
  const holderOk = holder.trim().length > 2;
  const valid = numberOk && expiryOk && cvcOk && holderOk;

  // CTA fill crossfades with validity; a refused press flickers once.
  const cta = useSharedValue(valid ? 1 : CTA_DIM);
  const kick = useSharedValue(0);
  React.useEffect(() => {
    cta.value = withTiming(valid ? 1 : CTA_DIM, timing.normal);
  }, [valid, cta]);
  const ctaStyle = useAnimatedStyle(() => ({ opacity: cta.value, transform: [{ translateX: kick.value }] }));

  // The fold: fields dim, the measured stack folds to the face height, the face ignites over it.
  const [formH, setFormH] = React.useState(0);
  const fields = useSharedValue(1);
  const height = useSharedValue(-1);
  const face = useSharedValue(0);
  const foldStyle = useAnimatedStyle(() => (height.value < 0 ? {} : { height: height.value }));
  const fieldsStyle = useAnimatedStyle(() => ({ opacity: fields.value }));
  const faceStyle = useAnimatedStyle(() => ({ opacity: face.value }));

  const add = () => {
    if (phase !== "edit") return;
    if (!valid) {
      haptic.warning();
      if (reduce) {
        cta.value = withSequence(withTiming(0.35, timing.instant), withTiming(CTA_DIM, timing.fast));
      } else {
        kick.value = FLICK;
        kick.value = withSpring(0, spring.shake);
      }
      return;
    }
    haptic.light();
    setPhase("folding");
    fields.value = withTiming(0.35, timing.recede);
    height.value = formH;
    height.value = reduce ? FACE_H : withDelay(timing.recede.duration, withSpring(FACE_H, spring.surface));
    face.value = withDelay(timing.recede.duration, withTiming(1, timing.fast));
    later(timing.recede.duration + tempo.settle, () => {
      haptic.success();
      setSheen((n) => n + 1);
      later(HOLD, () => setPhase("added"));
    });
  };

  const again = () => {
    haptic.light();
    face.value = withTiming(0, timing.recede);
    height.value = reduce ? formH : withSpring(formH, spring.surface);
    fields.value = withDelay(timing.recede.duration, withTiming(1, timing.fast));
    setNumber("");
    setExpiry("");
    setCvc("");
    setPhase("edit");
    // Back to natural height once the unfold has landed.
    later(tempo.drift, () => {
      height.value = -1;
    });
  };

  const last4 = digits.slice(-4);

  return (
    <Accent color="green" className="w-full">
      <View className="w-full gap-5 rounded-3xl bg-card p-5">
        <View className="gap-1">
          <SwapLine text={phase === "added" ? "Card added" : "Add a card"} className="text-2xl font-bold tracking-tight" />
          <SwapLine
            muted
            text={phase === "added" ? "Ready for top-ups and bills on Halden Bank." : "Used for top-ups and bills. Never charged without asking."}
          />
        </View>

        <Animated.View style={foldStyle} className="overflow-hidden">
          <Animated.View
            style={fieldsStyle}
            pointerEvents={phase === "edit" ? "auto" : "none"}
            accessibilityElementsHidden={phase !== "edit"}
            importantForAccessibility={phase === "edit" ? "auto" : "no-hide-descendants"}
            onLayout={(e: LayoutChangeEvent) => phase === "edit" && setFormH(e.nativeEvent.layout.height)}
          >
            <Form className="gap-4">
              <Form.Field name="number" label="Card number" error={numberError} valid={numberOk} validDelay={0}>
                <Input
                  value={number}
                  onChangeText={(t) => setNumber(groupCard(t))}
                  keyboardType="number-pad"
                  placeholder="1234 5678 9012 3456"
                  leftIcon={<Icon name="credit-card" size="sm" color="mutedForeground" />}
                  success={numberOk}
                  className="tabular-nums"
                />
              </Form.Field>
              <View className="flex-row gap-3">
                <Form.Field name="expiry" label="Expiry" error={expiryError} valid={expiryOk} validDelay={LABEL_STAGGER} className="flex-1">
                  <Input
                    value={expiry}
                    onChangeText={(t) => setExpiry(formatExpiry(t))}
                    keyboardType="number-pad"
                    placeholder="MM/YY"
                    className="tabular-nums"
                  />
                </Form.Field>
                <Form.Field
                  name="cvc"
                  label="CVC"
                  description="3 digits on the back"
                  valid={cvcOk}
                  validDelay={LABEL_STAGGER * 2}
                  className="flex-1"
                >
                  <Input
                    value={cvc}
                    onChangeText={(t) => setCvc(t.replace(/\D/g, "").slice(0, 4))}
                    keyboardType="number-pad"
                    placeholder="123"
                    secureTextEntry
                  />
                </Form.Field>
              </View>
              <Form.Field name="holder" label="Name on card" valid={holderOk} validDelay={LABEL_STAGGER * 3}>
                <Input value={holder} onChangeText={setHolder} autoComplete="name" />
              </Form.Field>
            </Form>
          </Animated.View>

          {/* The card the form made — it ignites over the folded stack. */}
          {phase !== "edit" ? (
            <Animated.View
              style={[faceStyle, { height: FACE_H }]}
              className="absolute left-0 right-0 top-0 flex-row items-center gap-3 overflow-hidden rounded-2xl bg-primary px-4"
              accessibilityLabel={`Card ending ${last4}, expires ${expiry}`}
            >
              <Icon name="credit-card" size="md" color="primaryForeground" />
              <View className="flex-1">
                <Text className="text-[17px] font-semibold tabular-nums text-primary-foreground">•••• {last4} · {expiry}</Text>
                <Text className="text-sm text-primary-foreground/80" numberOfLines={1}>
                  {holder}
                </Text>
              </View>
              <Sheen run={sheen} />
            </Animated.View>
          ) : null}
        </Animated.View>

        <Animated.View style={ctaStyle}>
          {phase === "added" ? (
            <Button size="lg" variant="secondary" className="w-full" onPress={again}>
              Add another card
            </Button>
          ) : (
            <Button
              size="lg"
              className="w-full"
              onPress={add}
              accessibilityState={{ disabled: !valid, busy: phase === "folding" }}
              icon={<Icon name="lock" size="sm" color="primaryForeground" />}
            >
              Add card
            </Button>
          )}
        </Animated.View>
      </View>
    </Accent>
  );
}
