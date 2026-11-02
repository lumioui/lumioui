import * as React from "react";
import { View } from "react-native";
import { Accent } from "@lumioui/core";
import { useToast } from "../toast";
import { Button } from "../../button/button";
import { Icon } from "../../icon/icon";
import { Text } from "../../text/text";

/** The first attempt fails; the retry goes through. */
const EXPORT_MS = 1800;

/** ToastVariants — one export, one card. Export the notebook: the toast is
 *  born loading, swaps in place to an error with Retry (the card stays put),
 *  and Retry runs it again until it resolves to success — the check draws
 *  and a sheen crosses the card. */
export function ToastVariants() {
  const { loading, update } = useToast();
  const [state, setState] = React.useState<"idle" | "busy" | "done">("idle");
  const timers = React.useRef<ReturnType<typeof setTimeout>[]>([]);
  React.useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const run = (id: number, attempt: number) => {
    timers.current.push(
      setTimeout(() => {
        if (attempt === 0) {
          update(id, {
            variant: "error",
            title: "Export failed",
            description: "The connection dropped at 61 of 214 notes",
            dismissible: true,
            action: {
              label: "Retry",
              dismiss: false,
              onPress: () => {
                update(id, { variant: "loading", title: "Exporting 214 notes…", description: "Trying again", action: undefined, dismissible: false });
                run(id, 1);
              },
            },
          });
          setState("idle");
          return;
        }
        update(id, {
          variant: "success",
          title: "Notebook exported",
          description: "Garden Club · 214 notes · 38 MB PDF in Files",
          duration: 3500,
          dismissible: true,
        });
        setState("done");
      }, EXPORT_MS)
    );
  };

  const start = () => {
    setState("busy");
    const id = loading("Exporting 214 notes…", "Garden Club · PDF with attachments");
    run(id, 0);
  };

  return (
    <Accent color="teal" className="w-full">
      <View className="w-full gap-5 rounded-3xl bg-card p-5">
        <View className="flex-row items-center gap-3">
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-primary">
            <Icon name="leaf" size="md" color="primaryForeground" />
          </View>
          <View className="flex-1">
            <Text className="text-xl font-bold tracking-tight">Garden Club</Text>
            <Text variant="muted">214 notes · edited 9:14 AM</Text>
          </View>
        </View>
        <View className="overflow-hidden rounded-2xl bg-secondary">
          <View className="flex-row items-center gap-3 px-4 py-3">
            <Icon name="file-text" size="sm" color="mutedForeground" />
            <Text className="flex-1 text-[15px]">Format</Text>
            <Text className="text-[15px] text-muted-foreground">PDF</Text>
          </View>
          <View className="flex-row items-center gap-3 border-t border-border px-4 py-3">
            <Icon name="paperclip" size="sm" color="mutedForeground" />
            <Text className="flex-1 text-[15px]">Attachments</Text>
            <Text className="text-[15px] text-muted-foreground">Included</Text>
          </View>
        </View>
        <Button size="lg" className="w-full" onPress={start} disabled={state === "busy"}>
          {state === "done" ? "Export again" : "Export notebook"}
        </Button>
      </View>
    </Accent>
  );
}
