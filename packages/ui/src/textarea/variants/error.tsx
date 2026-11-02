import * as React from "react";
import { View } from "react-native";
import { Textarea } from "../textarea";
import { Button } from "../../button/button";
import { Icon } from "../../icon/icon";
import { Text } from "../../text/text";

const MIN = 30;
/** Stand-in for the network round trip, so the send can be seen. */
const SEND_MS = 900;

/** TextareaError — a support "Report a problem" form, ink only. It opens on
 *  a rejected submit; typing clears the error, and sending a description
 *  that's still too short flickers the field again and says how far off.
 *  A good report sends in place: the button carries the light while it
 *  sends, then becomes "Sent" and the field dims to read-only — the form
 *  keeps the evidence instead of a helper line announcing it. */
export function TextareaError() {
  const [text, setText] = React.useState("App crashes on upload");
  const [tried, setTried] = React.useState(true);
  const [sent, setSent] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  const short = text.trim().length < MIN;
  const error = tried && short ? `Add a little more detail, ${MIN - text.trim().length} more characters` : undefined;

  return (
    <View className="w-full gap-5 rounded-3xl bg-card p-5">
      <View className="gap-1">
        <Text className="text-2xl font-bold tracking-tight">Report a problem</Text>
        <Text variant="muted">Harbor for iOS 4.12 · iPhone 15</Text>
      </View>
      <Textarea
        label="What happened?"
        placeholder="What were you doing, and what did you expect?"
        value={text}
        onChangeText={(t) => {
          setText(t);
          setTried(false);
        }}
        editable={!sent}
        error={error}
        helper="Steps to reproduce help the most."
        maxLength={500}
        showCount
        minHeight={120}
        autoGrow
      />
      <Button
        size="lg"
        className="w-full"
        icon={sent ? <Icon name="check" size="sm" color="primaryForeground" strokeWidth={3} /> : undefined}
        onPress={() => {
          if (sent) return;
          setTried(true);
          if (short) return;
          return new Promise<void>((resolve) => {
            timer.current = setTimeout(() => {
              setSent(true);
              resolve();
            }, SEND_MS);
          });
        }}
      >
        {sent ? "Sent · we reply within a day" : "Send report"}
      </Button>
    </View>
  );
}
