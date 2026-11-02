import * as React from "react";
import { View } from "react-native";
import { Input } from "../input";
import { Button } from "../../button/button";
import { Text } from "../../text/text";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** How far an email is from valid: a name, the @, a domain, a dot + ending. */
function emailCharge(v: string): number {
  const at = v.indexOf("@");
  if (at < 0) return v.length > 0 ? 0.3 : 0;
  const domain = v.slice(at + 1);
  const dot = domain.lastIndexOf(".");
  return (
    (at > 0 ? 0.3 : 0) +
    0.2 +
    Math.min(1, (dot > 0 ? dot : domain.length) / 4) * 0.25 +
    (dot > 0 ? Math.min(1, (domain.length - dot - 1) / 2) * 0.25 : 0)
  );
}

/** InputCheckout — the shipping step of a clothing shop's checkout, ink
 *  only, on the screen itself rather than a card. A focused field lights its
 *  border and label; the email and postcode fields light their bottom edge as
 *  the value gets closer to valid and complete into a drawn check. A field is
 *  only judged once you leave it: a malformed email or postcode flickers into
 *  an error then, never mid-word. The CTA switches on when the form is
 *  complete. */
export function InputCheckout() {
  const [email, setEmail] = React.useState("noor.haddad@");
  const [name, setName] = React.useState("Noor Haddad");
  const [street, setStreet] = React.useState("");
  const [city, setCity] = React.useState("Utrecht");
  const [zip, setZip] = React.useState("");
  // Judge a field once the person has left it, never mid-word.
  const [emailLeft, setEmailLeft] = React.useState(false);
  const [zipLeft, setZipLeft] = React.useState(false);

  const emailOk = EMAIL_RE.test(email);
  const emailError = emailLeft && email.length > 0 && !emailOk ? "Check the address, it's missing a domain" : undefined;
  const zipOk = /^\d{4}\s?[A-Za-z]{2}$/.test(zip.trim());
  const zipError = zipLeft && zip.length > 0 && !zipOk ? "Like 3511 AB" : undefined;
  const ready = emailOk && name.trim().length > 1 && street.trim().length > 3 && city.trim().length > 1 && zipOk;

  return (
    <View className="w-full gap-4 py-2">
      <View className="gap-2">
        <Text className="text-[28px] font-bold tracking-tight">Shipping</Text>
        <Text variant="muted" className="text-base">Delivery in 2 to 3 working days.</Text>
      </View>

      <View className="gap-4">
        <Input
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChangeText={(v) => { setEmail(v); setEmailLeft(false); }}
          onBlur={() => setEmailLeft(true)}
          autoCapitalize="none"
          keyboardType="email-address"
          error={emailError}
          validity={emailCharge(email)}
          helper="We'll send tracking here."
          success={emailOk}
          reserveHelperLine
        />
        <Input label="Full name" value={name} onChangeText={setName} autoComplete="name" />
        <Input label="Street and number" placeholder="Oudegracht 158" value={street} onChangeText={setStreet} />
        <View className="flex-row gap-3">
          <Input
            containerClassName="flex-1"
            className="tabular-nums"
            label="Postcode"
            placeholder="3511 AB"
            value={zip}
            onChangeText={(v) => { setZip(v); setZipLeft(false); }}
            onBlur={() => setZipLeft(true)}
            autoCapitalize="characters"
            error={zipError}
            validity={Math.min(1, zip.replace(/\s/g, "").length / 6)}
            success={zipOk}
            reserveHelperLine
          />
          <Input containerClassName="flex-1" label="City" value={city} onChangeText={setCity} reserveHelperLine />
        </View>
      </View>

      <Button size="lg" className="w-full" disabled={!ready}>
        Continue to payment
      </Button>
    </View>
  );
}
