import * as React from "react";
import { Image, View } from "react-native";
import { ButtonGroup } from "../button-group";
import { Button } from "../../button/button";
import { Icon } from "../../icon/icon";
import { Text } from "../../text/text";

const ROWS: string[][] = [
  ["12:30", "1:15", "2:00"],
  ["2:45", "3:30", "4:15"],
  ["5:00", "5:45", "6:30"],
];
const TAKEN = new Set(["1:15", "3:30", "5:45"]);

/** ButtonGroupSlots — detached groups as a barber's open slots. Each row is
 *  a ButtonGroup with gaps; taken slots are disabled, the picked one fills
 *  ink and the booking CTA carries the time and price. Once booked, the
 *  chosen slot and the confirmation stay at full strength — only the other
 *  slots dim, so the answer never reads as disabled. */
export function ButtonGroupSlots() {
  const [slot, setSlot] = React.useState<string | null>("4:15");
  const [booked, setBooked] = React.useState(false);
  const book = async () => {
    if (booked) return;
    await new Promise((r) => setTimeout(r, 1200));
    setBooked(true);
  };
  return (
    <View className="w-full gap-5 rounded-3xl bg-card p-5">
      <View className="flex-row items-center gap-3">
        <Image
          source={{ uri: "https://i.pravatar.cc/150?img=15" }}
          className="h-12 w-12 rounded-full bg-muted"
          accessibilityIgnoresInvertColors
        />
        <View className="flex-1">
          <Text className="text-[17px] font-semibold">Skin fade + beard trim</Text>
          <Text variant="muted">with Marcus · 45 min · Fri afternoon</Text>
        </View>
      </View>

      <View className="gap-2">
        {ROWS.map((row) => (
          <ButtonGroup key={row[0]} attached={false} className="w-full" itemClassName="flex-1">
            {row.map((t) => (
              <Button
                key={t}
                size="md"
                variant={slot === t ? "default" : "secondary"}
                disabled={TAKEN.has(t) || (booked && slot !== t)}
                onPress={() => {
                  if (!booked) setSlot(t);
                }}
                textClassName="tabular-nums"
                accessibilityState={{ selected: slot === t }}
              >
                {t}
              </Button>
            ))}
          </ButtonGroup>
        ))}
      </View>

      <Button
        size="lg"
        className="w-full"
        disabled={!slot}
        onPress={book}
        icon={booked ? <Icon name="check" size="sm" color="primaryForeground" /> : undefined}
        accessibilityState={{ disabled: booked }}
      >
        {booked ? `Booked for ${slot} PM` : slot ? `Book ${slot} PM · $38` : "Pick a time"}
      </Button>
    </View>
  );
}
