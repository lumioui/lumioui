import * as React from "react";
import { Text, View } from "react-native";
import { Button } from "../../button/button";
import { SuccessSeal } from "../success-seal";

/** SuccessSealDeclined — concert tickets at checkout. A decline never
 *  celebrates: the order card flickers once and a cross seal lands on it.
 *  Retrying with another card stamps the same card with the success seal. */
export function SuccessSealDeclined() {
  const [state, setState] = React.useState<"declined" | "paid">("declined");
  const paid = state === "paid";
  return (
    <View className="w-full gap-5">
      <SuccessSeal key={state} tone={paid ? "success" : "destructive"} size="md" radius={28}>
        <View className="bg-card p-5">
          <Text className="text-sm text-muted-foreground">The Greek Theatre · Sat 18 Oct, 7:30 PM</Text>
          <Text className="mt-1 text-2xl font-semibold tracking-tight text-foreground">2 × Phoebe Brennan</Text>
          <Text className={paid ? "mt-2 text-[15px] font-semibold text-success" : "mt-2 text-[15px] font-semibold text-destructive"} accessibilityLiveRegion="polite">
            {paid ? "Paid $148.50 · tickets in your Wallet" : "Visa ••2291 declined · nothing was taken"}
          </Text>
        </View>
      </SuccessSeal>

      {paid ? (
        <Button size="lg" className="w-full">View tickets</Button>
      ) : (
        <View className="gap-2">
          <Button size="lg" className="w-full" onPress={() => setState("paid")}>
            Pay with Mastercard ••8034
          </Button>
          <Button size="lg" variant="ghost" className="w-full">
            Use another card
          </Button>
        </View>
      )}
    </View>
  );
}
