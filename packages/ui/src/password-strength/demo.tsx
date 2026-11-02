import * as React from "react";
import { View } from "react-native";
import { Input } from "../input";
import { Button } from "../button";
import { Text } from "../text";
import { PasswordStrength, derivePasswordScore } from "./password-strength";

/** Playground preview. Not installed with the component.
 *
 *  "Create your vault password" for a password manager, in neutral ink.
 *  Four lamps ride under the field and switch on one by
 *  one as the password earns them; a common password flickers the row
 *  once. Reach Strong and a sheen crosses the lamps while the hint turns
 *  into the reward line. The CTA only accepts Good-or-better that matches. */
export function PasswordStrengthDemo() {
  // Seeded at "Fair" so two lamps are lit at first paint; add a symbol and
  // a capital and watch the last two switch on.
  const [password, setPassword] = React.useState("harborlights7");
  const [confirm, setConfirm] = React.useState("");
  // Same scorer the meter uses, so the CTA gate and the lamps never disagree.
  const score = derivePasswordScore(password);
  const mismatch = confirm.length > 0 && confirm !== password;
  const ready = score >= 3 && confirm === password;
  return (
    <View className="w-full">
      <View className="w-full gap-6">
        <View className="gap-2 px-1">
          <Text className="text-3xl font-bold tracking-tight">Create your vault password</Text>
          <Text variant="muted">
            It encrypts everything in Lockwell. We can't reset it for you, so make it long.
          </Text>
        </View>

        <View className="gap-4 rounded-3xl bg-card p-5">
          <View className="gap-2">
            <Input
              label="Password"
              placeholder="At least 12 characters"
              secureTextEntry
              autoCapitalize="none"
              value={password}
              onChangeText={setPassword}
            />
            {password ? <PasswordStrength password={password} /> : null}
          </View>
          <Input
            label="Confirm password"
            placeholder="Type it again"
            secureTextEntry
            autoCapitalize="none"
            value={confirm}
            onChangeText={setConfirm}
            error={mismatch ? "Passwords don't match yet" : undefined}
            success={confirm.length > 0 && !mismatch}
            reserveHelperLine
          />
        </View>

        <Button size="lg" className="w-full" disabled={!ready}>
          Create vault
        </Button>
      </View>
    </View>
  );
}
