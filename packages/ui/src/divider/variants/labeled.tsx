import * as React from "react";
import { View } from "react-native";
import { Divider } from "../divider";
import { Button } from "../../button/button";
import { Input } from "../../input/input";
import { Icon } from "../../icon/icon";
import { Text } from "../../text/text";

/** DividerLabeled — the labeled rule where it actually lives: the "or"
 *  between email sign-in and the other ways in. It is drawn as a lit seam,
 *  and brightens one step while either path below it is pressed. Continue
 *  is async so the form reacts. Neutral ink, like most auth screens. */
export function DividerLabeled() {
  const [email, setEmail] = React.useState("");
  const [sent, setSent] = React.useState(false);
  const [pressing, setPressing] = React.useState(0);
  const hold = { onPressIn: () => setPressing((n) => n + 1), onPressOut: () => setPressing((n) => Math.max(0, n - 1)) };
  const valid = /.+@.+\..+/.test(email);
  const send = async () => {
    await new Promise((r) => setTimeout(r, 1100));
    setSent(true);
  };
  return (
    <View className="w-full gap-6 rounded-3xl bg-card p-5">
      <View className="gap-1">
        <Text className="text-2xl font-bold tracking-tight">Sign in to Quire</Text>
        <Text variant="muted">
          {sent ? `Check ${email} for a sign-in link.` : "We'll email you a magic link."}
        </Text>
      </View>

      <View className="gap-3">
        <Input
          placeholder="you@studio.com"
          value={email}
          onChangeText={(t) => {
            setEmail(t);
            setSent(false);
          }}
          autoCapitalize="none"
          keyboardType="email-address"
          accessibilityLabel="Email"
          leftIcon={<Icon name="mail" size="sm" color="mutedForeground" />}
        />
        <Button size="lg" className="w-full" disabled={!valid || sent} onPress={send}>
          {sent ? "Link sent" : "Continue with email"}
        </Button>
      </View>

      <Divider label="or" seam lit={pressing > 0} />

      <View className="gap-3">
        <Button size="lg" variant="secondary" className="w-full" {...hold}>
          Continue with a passkey
        </Button>
        <Button size="lg" variant="secondary" className="w-full" {...hold}>
          Continue with phone
        </Button>
      </View>

      <Text className="text-center text-xs text-muted-foreground">
        By continuing you agree to the Terms and Privacy Policy.
      </Text>
    </View>
  );
}
