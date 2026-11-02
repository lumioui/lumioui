import * as React from "react";
import { View } from "react-native";
import { Accent } from "@lumioui/core";
import { CopyButton, CopyField } from "../copy-field";
import { Text } from "../../text/text";

const DETAILS = [
  { label: "Account holder", value: "Jonah Achterberg" },
  { label: "IBAN", value: "NL47 KSTR 0612 9934 81", mono: true, group: 4 },
  { label: "BIC", value: "KSTRNL2A", mono: true },
  { label: "Account number", value: "0612993481", mono: true, masked: true },
];

/** CopyFieldIBAN — a bank's "receive money" sheet. Each detail copies on
 *  its own from a grouped list; the IBAN reads in groups of four but pastes
 *  as one unbroken string, and the account number stays masked until
 *  revealed. "Copy all" puts the whole block on the clipboard. */
export function CopyFieldIBAN() {
  const all = DETAILS.map((d) => `${d.label}: ${d.value.replace(/\s/g, "")}`).join("\n");
  return (
    <Accent color="green" className="w-full">
      <View className="w-full gap-4">
        <View className="gap-1">
          <Text className="text-2xl font-bold tracking-tight">Euro account</Text>
          <Text className="text-[15px] text-muted-foreground">Share these to get paid by bank transfer</Text>
        </View>

        <View className="overflow-hidden rounded-2xl bg-card">
          {DETAILS.map((d, i) => (
            <View key={d.label} className={i > 0 ? "border-t border-border pl-4 pr-1 pt-2" : "pl-4 pr-1 pt-2"}>
              <Text className="text-sm text-muted-foreground">{d.label}</Text>
              <CopyField
                appearance="inline"
                label={d.label}
                value={d.value.replace(/\s/g, "")}
                groupSize={d.group}
                mono={d.mono}
                masked={d.masked}
              />
            </View>
          ))}
        </View>

        <CopyButton value={all} label="Copy all details" copiedLabel="All details copied" variant="default" size="lg" announcement="Account details copied" />
      </View>
    </Accent>
  );
}
