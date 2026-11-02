import * as React from "react";
import { View } from "react-native";
import { rowDelay, timing } from "@lumioui/core";
import { CopyButton, CopyField } from "../copy-field";
import { Icon } from "../../icon/icon";
import { Text } from "../../text/text";

const CODES = ["48219930", "71056624", "39904187", "55620318", "82147759", "10938462", "66473015", "93358201"];
const COLS = 2;
/** "Copy all" confirms once the last row of codes has lit. */
const CONFIRM_AFTER = rowDelay(Math.ceil(CODES.length / COLS) - 1) + timing.fast.duration;

/** CopyFieldBackupCodes — two-factor recovery codes in a password vault.
 *  Codes read in monospace pairs of four; any one copies on a tap. "Copy
 *  all" lights the codes row by row, top to bottom 40ms apart, and only
 *  then does the button confirm. */
export function CopyFieldBackupCodes() {
  const [lit, setLit] = React.useState(0);
  return (
    <View className="w-full gap-5 rounded-3xl bg-card p-5">
      <View className="flex-row items-start gap-3">
        <View className="h-11 w-11 items-center justify-center rounded-full bg-secondary">
          <Icon name="shield" size="sm" color="foreground" />
        </View>
        <View className="flex-1 gap-1">
          <Text className="text-xl font-bold tracking-tight">Backup codes</Text>
          <Text className="text-[15px] text-muted-foreground">
            Each code signs you in once if you lose your phone. Keep them offline.
          </Text>
        </View>
      </View>

      <View className="flex-row flex-wrap rounded-2xl border border-border px-3 py-2">
        {CODES.map((c, i) => (
          <View key={c} className="w-1/2 pr-1">
            <CopyField
              appearance="inline"
              label={`Backup code ${c.slice(0, 4)}`}
              value={c}
              groupSize={4}
              mono
              truncate="none"
              valueClassName="text-base"
              highlight={lit}
              highlightDelay={rowDelay(Math.floor(i / COLS))}
            />
          </View>
        ))}
      </View>

      <Text className="text-sm text-muted-foreground">8 of 10 unused · created Sep 30</Text>

      <CopyButton
        value={CODES.map((c) => `${c.slice(0, 4)} ${c.slice(4)}`).join("\n")}
        label="Copy all codes"
        copiedLabel="Codes copied"
        variant="default"
        size="lg"
        announcement="All backup codes copied"
        confirmAfter={CONFIRM_AFTER}
        onCopy={() => setLit((n) => n + 1)}
      />
    </View>
  );
}
