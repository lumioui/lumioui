import * as React from "react";
import { Text, View } from "react-native";
import { Accent } from "@lumioui/core";
import { Button } from "../../button/button";
import { SuccessSeal } from "../success-seal";

/** SuccessSealPayment — a freelancer marks an invoice paid. The seal lands on
 *  the invoice itself: the card dips under the stamp, light pools behind it
 *  and it holds, then its status line resolves to "Paid". "Undo" lets you replay it. */
export function SuccessSealPayment() {
  const [paid, setPaid] = React.useState(false);
  const [settled, setSettled] = React.useState(false);
  const [run, setRun] = React.useState(0);
  return (
    <Accent color="green" className="w-full">
      <View className="w-full gap-5">
        <SuccessSeal key={run} on={paid} onSettled={() => setSettled(true)} radius={28}>
          <View className="bg-card px-5 pb-5 pt-5">
            <Text className="text-sm text-muted-foreground">Invoice 0142 · Harlow & Pike Studio</Text>
            <Text className="mt-1 text-[40px] font-semibold tracking-tight text-foreground" style={{ fontVariant: ["tabular-nums"] }}>
              $3,240<Text className="text-2xl text-muted-foreground">.00</Text>
            </Text>
            <Text
              className={settled ? "mt-1 text-[15px] font-semibold text-primary-text" : "mt-1 text-[15px] text-muted-foreground"}
              accessibilityLiveRegion="polite"
            >
              {settled ? "Paid today · in your account Mon 13 Oct" : "Due Fri 17 Oct · 6 days"}
            </Text>
            <View className="mt-5 gap-3 border-t border-border pt-4">
              {[
                ["Brand refresh — round 2", "$2,400.00"],
                ["Illustration set, 6 spots", "$840.00"],
              ].map(([item, amount]) => (
                <View key={item} className="flex-row justify-between">
                  <Text className="text-[15px] text-foreground">{item}</Text>
                  <Text className="text-[15px] font-medium text-foreground" style={{ fontVariant: ["tabular-nums"] }}>
                    {amount}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </SuccessSeal>

        {paid ? (
          <Button
            size="lg"
            variant="secondary"
            className="w-full"
            onPress={() => {
              setPaid(false);
              setSettled(false);
              setRun((r) => r + 1);
            }}
          >
            Undo
          </Button>
        ) : (
          <Button size="lg" className="w-full" onPress={() => setPaid(true)}>
            Mark as paid
          </Button>
        )}
      </View>
    </Accent>
  );
}
